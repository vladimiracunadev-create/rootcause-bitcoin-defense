import crypto from "node:crypto";
import { matchingAdvisories } from "./firmware.js";
import { evaluatePosture } from "./posture.js";

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

  // Un quorum N-de-N no reparte el riesgo: lo multiplica. Sigue haciendo falta
  // comprometer todas las claves para robar, pero basta perder UNA para que los
  // fondos queden irrecuperables. Es la configuración que más fondos ha
  // congelado para siempre.
  const required = Number(wallet.quorum?.required || 0);
  const total = Number(wallet.quorum?.total || 0);
  if (wallet.walletType === "multisig" && total > 1 && required === total) {
    findings.push(
      makeFinding({
        code: "BTC-CUSTODY-003",
        entityType: "wallet",
        entityId: wallet.id,
        severity: highValue ? "high" : "medium",
        title: "Quorum sin tolerancia a fallos (N-de-N)",
        explanation:
          wallet.name +
          " exige las " +
          total +
          " firmas de sus " +
          total +
          " firmantes: perder o dañar uno solo deja los fondos irrecuperables.",
        rootCause:
          "El quorum no reserva margen para la pérdida de un firmante, que es el incidente más frecuente en custodia propia.",
        evidence: {
          walletFingerprint: wallet.fingerprint,
          quorum: wallet.quorum
        },
        remediation: [
          "Migrar a un quorum con margen, por ejemplo 2 de 3.",
          "Verificar que existe copia de seguridad verificada de cada descriptor y de cada firmante."
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

// ── Inteligencia con fecha ───────────────────────────────────────────────────
//
// Un panel en verde sobre una matriz de avisos sin revisar desde hace meses es
// una tranquilidad falsa, que es peor que no tener panel. La antigüedad de la
// inteligencia es, por tanto, un hallazgo del propio producto.
export function evaluateIntel(advisories, context = {}) {
  if (!Array.isArray(advisories) || !advisories.length) {
    return [
      makeFinding({
        code: "BTC-INTEL-002",
        entityType: "advisory-matrix",
        entityId: "config/advisories.json",
        detectedAt: context.now,
        severity: "high",
        title: "Sin matriz de avisos cargada",
        explanation:
          "La aplicación no tiene ningún aviso con el que contrastar la procedencia de las claves.",
        rootCause: "El archivo de avisos está vacío o no se pudo leer.",
        evidence: { advisories: 0 },
        remediation: [
          "Restaurar config/advisories.json desde el repositorio.",
          "Verificar cada entrada contra la fuente oficial del fabricante."
        ]
      })
    ];
  }

  const now = context.now ? new Date(context.now) : new Date();
  const maxAgeDays = context.advisoryMaxAgeDays || 30;
  const timestamps = advisories
    .map((advisory) => Date.parse(advisory.verifiedAt || advisory.publishedAt || ""))
    .filter((value) => Number.isFinite(value));

  if (!timestamps.length) {
    return [
      makeFinding({
        code: "BTC-INTEL-003",
        entityType: "advisory-matrix",
        entityId: "config/advisories.json",
        detectedAt: context.now,
        severity: "medium",
        title: "Avisos sin fecha de verificación",
        explanation:
          "Ninguna entrada declara cuándo se contrastó por última vez con la fuente oficial.",
        rootCause: "La matriz no registra su propia frescura.",
        evidence: { advisories: advisories.length },
        remediation: ["Añadir verifiedAt a cada aviso al revisarlo."]
      })
    ];
  }

  const newest = Math.max(...timestamps);
  const ageDays = Math.floor((now.getTime() - newest) / 86400000);
  if (ageDays <= maxAgeDays) return [];

  return [
    makeFinding({
      code: "BTC-INTEL-001",
      entityType: "advisory-matrix",
      entityId: "config/advisories.json",
      discriminator: String(Math.floor(ageDays / 30)),
      detectedAt: context.now,
      severity: ageDays > maxAgeDays * 3 ? "high" : "medium",
      title: "Matriz de avisos sin verificar",
      explanation:
        "Han pasado " +
        ageDays +
        " días desde la última verificación de un aviso. Un hallazgo ausente puede significar que la inteligencia está vieja, no que no haya problema.",
      rootCause:
        "La matriz de avisos se mantiene a mano y no se ha contrastado con las fuentes oficiales dentro del plazo definido.",
      evidence: {
        lastVerifiedAt: new Date(newest).toISOString(),
        ageDays,
        maxAgeDays
      },
      remediation: [
        "Revisar los avisos de seguridad de cada fabricante presente en el inventario.",
        "Actualizar verifiedAt de cada entrada contrastada en config/advisories.json.",
        "Registrar los avisos nuevos antes de dar por bueno un panel en verde."
      ]
    })
  ];
}

// ── Correlaciones entre entidades ────────────────────────────────────────────
//
// Las reglas anteriores miran una entidad cada una. Estas cruzan varias, que es
// donde aparecen los patrones de robo en curso.
export function evaluateCorrelations(state, context = {}) {
  const findings = [];
  const now = context.now || new Date().toISOString();
  const wallets = state.wallets || [];
  const approvals = state.approvals || [];
  const walletsById = new Map(wallets.map((wallet) => [wallet.id, wallet]));

  const unapproved = (state.observedTransactions || []).filter(
    (event) =>
      event.spendsWatchedWallet &&
      !(event.approvalHash && approvals.some((entry) => entry.hash === event.approvalHash))
  );

  // BTC-TX-002 · barrido: un gasto que se lleva casi todo el saldo vigilado.
  for (const event of unapproved) {
    const wallet = walletsById.get(event.walletId);
    const balance = Number(wallet?.balanceSats || 0);
    const value = Number(event.valueSats || 0);
    if (!wallet || balance <= 0 || value <= 0) continue;
    if (value < balance * 0.9) continue;
    findings.push(
      makeFinding({
        code: "BTC-TX-002",
        entityType: "transaction",
        entityId: event.txid,
        detectedAt: now,
        severity: "critical",
        title: "Barrido del saldo de una wallet vigilada",
        explanation:
          "Una transacción sin aprobación mueve el " +
          Math.round((value / balance) * 100) +
          " % del saldo de " +
          wallet.name +
          ". Ese patrón es el de un vaciado, no el de un pago.",
        rootCause:
          "Quien firmó controla la clave y está retirando el saldo completo, no gastando una parte.",
        evidence: {
          txid: event.txid,
          walletFingerprint: wallet.fingerprint,
          valueSats: value,
          balanceSats: balance
        },
        remediation: [
          "Asumir clave comprometida y preservar evidencia antes de tocar nada.",
          "Migrar de inmediato los UTXO que todavía no se han gastado.",
          "Verificar el txid en un segundo nodo independiente."
        ]
      })
    );
  }

  // BTC-TX-003 · ráfaga: varios gastos sin aprobar de la misma wallet, seguidos.
  const windowMs = context.burstWindowMs || 3600000;
  const byWallet = new Map();
  for (const event of unapproved) {
    if (!byWallet.has(event.walletId)) byWallet.set(event.walletId, []);
    byWallet.get(event.walletId).push(event);
  }
  for (const [walletId, events] of byWallet) {
    if (events.length < 2) continue;
    const times = events
      .map((event) => Date.parse(event.observedAt || ""))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);
    if (times.length < 2 || times.at(-1) - times[0] > windowMs) continue;
    const wallet = walletsById.get(walletId);
    findings.push(
      makeFinding({
        code: "BTC-TX-003",
        entityType: "wallet",
        entityId: walletId,
        discriminator: String(events.length),
        detectedAt: now,
        severity: "critical",
        title: "Varios gastos sin aprobación en una ventana corta",
        explanation:
          events.length +
          " transacciones sin aprobación desde " +
          (wallet?.name || walletId) +
          " en menos de " +
          Math.round(windowMs / 60000) +
          " minutos.",
        rootCause:
          "Una ráfaga de gastos no autorizados indica extracción activa, no un error de registro puntual.",
        evidence: {
          walletFingerprint: wallet?.fingerprint,
          events: events.length,
          firstObservedAt: new Date(times[0]).toISOString(),
          lastObservedAt: new Date(times.at(-1)).toISOString()
        },
        remediation: [
          "Cortar cualquier autorización automática ahora.",
          "Preservar evidencia y activar el runbook de migración.",
          "No esperar a que termine la ráfaga para actuar."
        ]
      })
    );
  }

  // BTC-PRIVACY-002 · el proveedor filtrado es fabricante de tus firmantes.
  const vendorsInInventory = new Set(
    wallets.flatMap((wallet) =>
      (wallet.signers || []).map((signer) => String(signer.vendor || "").toLowerCase())
    )
  );
  for (const event of state.privacyEvents || []) {
    const vendor = String(event.vendor || "").toLowerCase();
    if (!vendor || !vendorsInInventory.has(vendor)) continue;
    findings.push(
      makeFinding({
        code: "BTC-PRIVACY-002",
        entityType: "vendor-event",
        entityId: event.id,
        detectedAt: now,
        severity: "high",
        title: "Datos expuestos de un fabricante presente en tu inventario",
        explanation:
          "El evento afecta a " +
          event.vendor +
          ", que fabrica firmantes que tienes registrados. El phishing dirigido deja de ser genérico: quien escribe puede saber qué dispositivo tienes.",
        rootCause:
          "La identidad del titular y la titularidad del dispositivo quedaron en el mismo dominio de confianza de un tercero.",
        evidence: {
          vendor: event.vendor,
          recordCount: event.recordCount,
          signersFromVendor: wallets
            .flatMap((wallet) => wallet.signers || [])
            .filter((signer) => String(signer.vendor || "").toLowerCase() === vendor).length
        },
        remediation: [
          "Tratar como fraude cualquier comunicación urgente que mencione tu dispositivo.",
          "Verificar siempre por un canal oficial abierto por ti, nunca por un enlace recibido.",
          "Recordar que ningún fabricante pide la frase de recuperación."
        ]
      })
    );
  }

  return findings;
}

export function evaluateState(state, context) {
  const now = context?.now || new Date().toISOString();
  const enriched = { ...context, now };
  return [
    ...state.wallets.flatMap((wallet) => evaluateWallet(wallet, enriched)),
    ...state.observedTransactions.flatMap((event) =>
      evaluateTransaction(event, state.approvals)
    ),
    ...state.privacyEvents.flatMap(evaluatePrivacyEvent),
    ...(state.node ? evaluateNode(state.node) : []),
    ...evaluateCorrelations(state, enriched),
    ...evaluateIntel(context?.advisories, enriched),
    ...evaluatePosture(state, enriched)
  ];
}
