import crypto from "node:crypto";
import { matchingAdvisories } from "./firmware.js";

function findingId(code, entityId, discriminator = "") {
  return crypto
    .createHash("sha256")
    .update([code, entityId, discriminator].join("|"))
    .digest("hex")
    .slice(0, 20);
}

function makeFinding(input) {
  return {
    id: findingId(input.code, input.entityId, input.discriminator),
    detectedAt: input.detectedAt || new Date().toISOString(),
    status: "open",
    ...input
  };
}

export function evaluateWallet(wallet, context) {
  const findings = [];
  const threshold = context.highValueThresholdSats;
  const highValue = Number(wallet.balanceSats || 0) >= threshold;
  const signers = Array.isArray(wallet.signers) && wallet.signers.length
    ? wallet.signers
    : [wallet];

  for (const signer of signers) {
    const advisories = matchingAdvisories(signer, context.advisories);
    for (const advisory of advisories) {
      findings.push(
        makeFinding({
          code: "BTC-KEY-001",
          entityType: "wallet",
          entityId: wallet.id,
          discriminator: advisory.id + ":" + (signer.id || signer.fingerprint || ""),
          severity: "critical",
          title: "Semilla creada con firmware afectado",
          explanation:
            wallet.name +
            " contiene un firmante que coincide con " +
            advisory.id +
            ". Actualizar el firmware no repara la semilla existente.",
          rootCause:
            "La procedencia criptográfica de la semilla depende de una versión de firmware incluida en un aviso crítico.",
          evidence: {
            walletFingerprint: wallet.fingerprint,
            signerFingerprint: signer.fingerprint,
            vendor: signer.vendor,
            model: signer.model,
            firmwareAtSeedCreation: signer.firmwareAtSeedCreation,
            firmwareTrack: signer.firmwareTrack,
            advisoryId: advisory.id
          },
          remediation: advisory.mitigation
        })
      );
    }

    if (
      !signer.firmwareAtSeedCreation ||
      signer.firmwareAtSeedCreation === "unknown"
    ) {
      findings.push(
        makeFinding({
          code: "BTC-KEY-002",
          entityType: "wallet",
          entityId: wallet.id,
          discriminator: signer.id || signer.fingerprint || "",
          severity: highValue ? "high" : "medium",
          title: "Firmware de creación desconocido",
          explanation:
            "No es posible demostrar qué firmware generó la semilla de un firmante de " +
            wallet.name +
            ".",
          rootCause: "Falta trazabilidad del ciclo de vida de la clave.",
          evidence: {
            walletFingerprint: wallet.fingerprint,
            signerFingerprint: signer.fingerprint,
            vendor: signer.vendor,
            model: signer.model
          },
          remediation: [
            "Reconstruir la procedencia desde registros verificables.",
            "Si no puede demostrarse, migrar hacia firmantes con procedencia documentada."
          ]
        })
      );
    }

    if (signer.seedOrigin === "unknown") {
      findings.push(
        makeFinding({
          code: "BTC-KEY-003",
          entityType: "wallet",
          entityId: wallet.id,
          discriminator: signer.id || signer.fingerprint || "",
          severity: "medium",
          title: "Origen de entropía desconocido",
          explanation:
            "La aplicación desconoce cómo se creó la semilla de un firmante de " +
            wallet.name +
            ".",
          rootCause: "No existe evidencia suficiente sobre el origen de entropía.",
          evidence: {
            walletFingerprint: wallet.fingerprint,
            signerFingerprint: signer.fingerprint
          },
          remediation: [
            "Documentar si la semilla fue generada por el dispositivo, importada o creada con una fuente independiente.",
            "No inferir la calidad de entropía observando solamente direcciones públicas."
          ]
        })
      );
    }
  }

  if (highValue && wallet.walletType === "single-sig") {
    findings.push(
      makeFinding({
        code: "BTC-CUSTODY-001",
        entityType: "wallet",
        entityId: wallet.id,
        severity: "critical",
        title: "Fondos de alto valor dependen de una sola clave",
        explanation:
          wallet.name +
          " supera el umbral de política y una sola firma puede gastar todos sus fondos.",
        rootCause: "La arquitectura no contiene el compromiso de un único firmante.",
        evidence: {
          walletFingerprint: wallet.fingerprint,
          balanceSats: wallet.balanceSats,
          thresholdSats: threshold
        },
        remediation: [
          "Migrar a una política multisig con firmantes independientes.",
          "Separar fabricantes, ubicaciones y procesos de generación de claves."
        ]
      })
    );
  }

  if (
    wallet.walletType === "multisig" &&
    Number(wallet.quorum?.independentVendors || 0) < 2
  ) {
    findings.push(
      makeFinding({
        code: "BTC-CUSTODY-002",
        entityType: "wallet",
        entityId: wallet.id,
        severity: highValue ? "high" : "medium",
        title: "Multisig sin diversidad de implementación",
        explanation:
          "El quorum existe, pero depende de menos de dos fabricantes independientes.",
        rootCause: "Una falla común de firmware podría afectar a varios firmantes.",
        evidence: {
          walletFingerprint: wallet.fingerprint,
          quorum: wallet.quorum
        },
        remediation: [
          "Distribuir el quorum entre implementaciones y fabricantes independientes.",
          "Generar cada semilla mediante un proceso separado."
        ]
      })
    );
  }

  return findings;
}

export function evaluateTransaction(event, approvals) {
  if (!event.spendsWatchedWallet) return [];
  const approved = Boolean(
    event.approvalHash && approvals.some((entry) => entry.hash === event.approvalHash)
  );
  if (approved) return [];

  return [
    makeFinding({
      code: "BTC-TX-001",
      entityType: "transaction",
      entityId: event.txid,
      severity: "critical",
      title: "Gasto observado sin aprobación conocida",
      explanation:
        "La transacción gasta fondos vigilados y no coincide con una política aprobada.",
      rootCause:
        "La cadena recibió una transacción válida fuera del flujo de autorización registrado.",
      evidence: {
        txid: event.txid,
        walletId: event.walletId,
        observedAt: event.observedAt,
        source: event.source || "unknown"
      },
      remediation: [
        "Denegar nuevas autorizaciones al servicio de firma.",
        "Preservar evidencia y verificar el estado en nodos independientes.",
        "Activar el plan de migración para UTXO todavía no gastados."
      ]
    })
  ];
}

export function evaluateNode(node) {
  const findings = [];
  if (!node.connected) {
    findings.push(
      makeFinding({
        code: "BTC-NODE-001",
        entityType: "node",
        entityId: "bitcoin-core",
        severity: "high",
        title: "Bitcoin Core no disponible",
        explanation: node.error || "No fue posible consultar el nodo configurado.",
        rootCause: "El canal de observación no puede validar el estado local de Bitcoin.",
        evidence: { endpoint: node.endpoint, checkedAt: node.checkedAt },
        remediation: [
          "Verificar el proceso Bitcoin Core y la autenticación RPC local.",
          "No exponer RPC directamente a Internet."
        ]
      })
    );
    return findings;
  }

  if (node.initialBlockDownload || Number(node.verificationProgress || 0) < 0.999) {
    findings.push(
      makeFinding({
        code: "BTC-NODE-002",
        entityType: "node",
        entityId: "bitcoin-core",
        severity: "medium",
        title: "Nodo todavía no sincronizado",
        explanation: "El nodo no ha alcanzado completamente la punta validada.",
        rootCause: "La observación de transacciones puede estar incompleta o atrasada.",
        evidence: {
          blocks: node.blocks,
          headers: node.headers,
          verificationProgress: node.verificationProgress
        },
        remediation: [
          "Esperar la sincronización completa antes de tomar decisiones de custodia.",
          "Revisar disco, CPU, reloj y conectividad si el progreso se detiene."
        ]
      })
    );
  }

  if (Number(node.connections || 0) === 0) {
    findings.push(
      makeFinding({
        code: "BTC-NODE-003",
        entityType: "node",
        entityId: "bitcoin-core",
        severity: "high",
        title: "Nodo sin peers",
        explanation: "Bitcoin Core no registra conexiones P2P.",
        rootCause: "La observación local está aislada de la red Bitcoin.",
        evidence: { connections: node.connections },
        remediation: [
          "Comprobar firewall, DNS, proxy, Tor o configuración P2P.",
          "Comparar la altura con un segundo nodo controlado."
        ]
      })
    );
  }

  if (
    node.mempoolMaxBytes > 0 &&
    Number(node.mempoolUsageBytes || 0) / Number(node.mempoolMaxBytes) >= 0.9
  ) {
    findings.push(
      makeFinding({
        code: "BTC-NODE-004",
        entityType: "node",
        entityId: "bitcoin-core",
        severity: "medium",
        title: "Presión elevada de mempool",
        explanation: "El uso local del mempool alcanzó al menos 90% del máximo configurado.",
        rootCause: "Transacciones de menor tarifa pueden ser expulsadas del mempool local.",
        evidence: {
          mempoolUsageBytes: node.mempoolUsageBytes,
          mempoolMaxBytes: node.mempoolMaxBytes,
          mempoolMinFee: node.mempoolMinFee
        },
        remediation: [
          "Revisar la política de tarifas sin modificarla automáticamente.",
          "Correlacionar cualquier transacción desaparecida con reemplazos o expulsión."
        ]
      })
    );
  }

  return findings;
}

export function evaluatePrivacyEvent(event) {
  if (event.type !== "bulk_customer_data_access") return [];
  return [
    makeFinding({
      code: "BTC-PRIVACY-001",
      entityType: "vendor-event",
      entityId: event.id,
      severity: event.authorized ? "medium" : "critical",
      title: "Acceso masivo a datos de clientes",
      explanation:
        "Se observó acceso masivo a datos personales asociados al ecosistema de custodia.",
      rootCause:
        "Un proveedor o usuario accedió a un volumen de información superior al patrón esperado.",
      evidence: {
        vendor: event.vendor,
        recordCount: event.recordCount,
        authorized: event.authorized,
        observedAt: event.observedAt
      },
      remediation: [
        "Revocar la sesión y preservar los registros de acceso.",
        "Verificar minimización, cifrado y vencimiento de datos.",
        "No vincular identidad personal con direcciones Bitcoin en el mismo dominio."
      ]
    })
  ];
}

export function evaluateState(state, context) {
  return [
    ...state.wallets.flatMap((wallet) => evaluateWallet(wallet, context)),
    ...state.observedTransactions.flatMap((event) =>
      evaluateTransaction(event, state.approvals)
    ),
    ...state.privacyEvents.flatMap(evaluatePrivacyEvent),
    ...(state.node ? evaluateNode(state.node) : [])
  ];
}
