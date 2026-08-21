import crypto from "node:crypto";

// Postura de despliegue: la aplicación se audita a sí misma.
//
// Las reglas BTC-KEY, BTC-CUSTODY y BTC-TX miran las wallets del operador. Esta
// familia mira la instalación: cómo está configurada, dónde escucha, si cifra,
// si vigila y si su propio registro sigue íntegro.
//
// Es la diferencia entre «tus claves tienen un problema» y «la herramienta con
// la que miras tus claves tiene un problema». Ambas cosas importan, y la
// segunda suele no mirarla nadie.
function findingId(code, discriminator = "") {
  return crypto
    .createHash("sha256")
    .update(["posture", code, discriminator].join("|"))
    .digest("hex")
    .slice(0, 20);
}

function makeFinding(input) {
  return {
    id: findingId(input.code, input.discriminator),
    detectedAt: input.detectedAt || new Date().toISOString(),
    status: "open",
    entityType: "deployment",
    entityId: "rootcause-bitcoin-defense",
    ...input
  };
}

function isLoopbackHost(host) {
  const normalized = String(host || "").replace(/^\[|\]$/g, "").toLowerCase();
  return normalized === "localhost" || normalized === "::1" || normalized.startsWith("127.");
}

// Entropía aproximada de una clave de datos, en bits: longitud por el logaritmo
// del alfabeto que realmente usa. No mide calidad criptográfica; detecta el
// caso real, que es alguien escribiendo "clave123" en config.cmd.
export function estimateKeyStrengthBits(key) {
  const value = String(key || "");
  if (!value) return 0;
  let alphabet = 0;
  if (/[a-z]/.test(value)) alphabet += 26;
  if (/[A-Z]/.test(value)) alphabet += 26;
  if (/[0-9]/.test(value)) alphabet += 10;
  if (/[^A-Za-z0-9]/.test(value)) alphabet += 30;
  const unique = new Set(value).size;
  // Un valor largo pero repetitivo ("aaaa…") no aporta la entropía de su longitud.
  const effectiveLength = Math.min(value.length, unique * 4);
  return Math.round(effectiveLength * Math.log2(Math.max(alphabet, 2)));
}

export function evaluatePosture(state, context = {}) {
  const config = context.config;
  if (!config) return [];

  const findings = [];
  const now = context.now || new Date().toISOString();
  const wallets = Array.isArray(state?.wallets) ? state.wallets : [];
  const threshold = context.highValueThresholdSats || config.highValueThresholdSats || 0;
  const watchedSats = wallets.reduce((sum, wallet) => sum + Number(wallet.balanceSats || 0), 0);
  const hasHighValue = wallets.some(
    (wallet) => Number(wallet.balanceSats || 0) >= threshold
  );

  // ── BTC-OPSEC-001 · escucha fuera de loopback ─────────────────────────────
  if (!isLoopbackHost(config.host)) {
    const inContainer = Boolean(config.containerized);
    findings.push(
      makeFinding({
        code: "BTC-OPSEC-001",
        detectedAt: now,
        // En un contenedor, 0.0.0.0 es el bind normal y quien decide la
        // exposición es el mapeo de puertos. Sigue mereciendo una comprobación,
        // pero no la misma alarma: un detector que grita en el despliegue
        // soportado enseña a ignorarlo.
        severity: inContainer ? "medium" : "critical",
        title: inContainer
          ? "El contenedor escucha en todas las interfaces"
          : "El panel escucha fuera de loopback",
        explanation: inContainer
          ? "Dentro del contenedor el bind en " +
            config.host +
            " es lo esperable. Lo que decide la exposición real es el mapeo de puertos del host: tiene que publicar en 127.0.0.1, no en 0.0.0.0."
          : "La aplicación acepta conexiones en " +
            config.host +
            ", no solo desde esta máquina. No tiene autenticación: cualquiera con acceso de red ve el inventario de wallets y saldos.",
        rootCause:
          "El modelo de seguridad del producto asume un único operador en loopback; publicar el puerto invalida ese supuesto.",
        evidence: { host: config.host, port: config.port, containerized: inContainer },
        remediation: inContainer
          ? [
              "Comprobar que el mapeo publica en loopback: `127.0.0.1:8787:8787`.",
              "No publicar el puerto en 0.0.0.0 ni exponerlo a través de un proxy sin autenticación."
            ]
          : [
              "Volver a HOST=127.0.0.1.",
              "Si necesitas acceso remoto, usa un túnel SSH en vez de exponer el puerto."
            ]
      })
    );
  }

  // ── BTC-OPSEC-002 · inventario real en modo demostración ──────────────────
  if (config.demoMode && watchedSats > 0) {
    findings.push(
      makeFinding({
        code: "BTC-OPSEC-002",
        detectedAt: now,
        severity: "medium",
        title: "Inventario con saldo declarado en modo demostración",
        explanation:
          "El modo demostración mantiene todo en memoria: al cerrar la aplicación se pierde lo registrado.",
        rootCause: "La persistencia cifrada está desactivada mientras se registran datos que se quieren conservar.",
        evidence: { demoMode: true, watchedSats },
        remediation: [
          "Generar una clave de datos con `pnpm generate:data-key`.",
          "Arrancar con DEMO_MODE=false y ROOTCAUSE_DATA_KEY definida."
        ]
      })
    );
  }

  // ── BTC-OPSEC-003 · clave de datos débil ──────────────────────────────────
  if (!config.demoMode && config.dataKey) {
    const bits = estimateKeyStrengthBits(config.dataKey);
    if (bits < 128) {
      findings.push(
        makeFinding({
          code: "BTC-OPSEC-003",
          detectedAt: now,
          severity: bits < 64 ? "high" : "medium",
          title: "Clave de datos por debajo del mínimo recomendado",
          explanation:
            "La clave que cifra el estado local aporta unos " +
            bits +
            " bits de entropía estimada; el generador del proyecto produce 256.",
          rootCause: "La clave se escribió a mano en vez de generarse.",
          evidence: { estimatedBits: bits, minimumRecommendedBits: 128 },
          remediation: [
            "Regenerar con `pnpm generate:data-key` y volver a cifrar el estado.",
            "Guardarla en un gestor de contraseñas, nunca junto al archivo de datos."
          ]
        })
      );
    }
  }

  // ── BTC-OPSEC-004 · RPC remoto habilitado ─────────────────────────────────
  if (config.bitcoin?.allowRemote) {
    findings.push(
      makeFinding({
        code: "BTC-OPSEC-004",
        detectedAt: now,
        severity: "high",
        title: "RPC de Bitcoin Core remoto habilitado",
        explanation:
          "ALLOW_REMOTE_RPC=true permite consultar un nodo fuera de loopback. Bitcoin Core desaconseja exponer RPC a la red.",
        rootCause: "La defensa por defecto contra destinos remotos está desactivada explícitamente.",
        evidence: { url: config.bitcoin.url, allowRemote: true },
        remediation: [
          "Usar un túnel hacia 127.0.0.1 y volver a ALLOW_REMOTE_RPC=false.",
          "Confirmar que el nodo no acepta RPC desde Internet."
        ]
      })
    );
  }

  // ── BTC-OPSEC-005 · credenciales RPC en vez de cookie ─────────────────────
  if (!config.bitcoin?.cookieFile && (config.bitcoin?.user || config.bitcoin?.password)) {
    findings.push(
      makeFinding({
        code: "BTC-OPSEC-005",
        detectedAt: now,
        severity: "medium",
        title: "RPC autenticado con usuario y contraseña",
        explanation:
          "La contraseña vive en una variable de entorno o en un archivo de configuración; la cookie de Bitcoin Core rota sola y no hay que escribirla en ningún sitio.",
        rootCause: "Se eligió autenticación estática frente a la cookie que genera el propio nodo.",
        evidence: { usingCookie: false },
        remediation: [
          "Configurar BITCOIN_RPC_COOKIE_FILE apuntando al .cookie del nodo.",
          "Retirar BITCOIN_RPC_USER y BITCOIN_RPC_PASSWORD."
        ]
      })
    );
  }

  // ── BTC-OPSEC-006 · vigilancia apagada con valor en juego ─────────────────
  if (hasHighValue && !config.watchtower?.enabled) {
    findings.push(
      makeFinding({
        code: "BTC-OPSEC-006",
        detectedAt: now,
        severity: "medium",
        title: "Watchtower apagado con wallets de alto valor",
        explanation:
          "Hay wallets por encima del umbral de política y nadie está observando el nodo: un gasto fuera de política no se detectaría hasta el próximo análisis manual.",
        rootCause: "La vigilancia periódica está desactivada.",
        evidence: { watchtowerEnabled: false, highValueThresholdSats: threshold },
        remediation: [
          "Arrancar con WATCHTOWER_ENABLED=true.",
          "Comprobar que el nodo responde para que la vigilancia sea real."
        ]
      })
    );
  }

  // ── BTC-OPSEC-007 · límites de petición relajados ─────────────────────────
  if (config.rateLimitPerMinute >= 5000 || config.bodyLimitBytes >= 1048576) {
    findings.push(
      makeFinding({
        code: "BTC-OPSEC-007",
        detectedAt: now,
        severity: "low",
        title: "Límites de petición por encima de lo razonable",
        explanation:
          "Un límite de tasa o de cuerpo muy alto amplía la superficie de abuso local sin aportar nada al uso normal del panel.",
        rootCause: "Configuración explícita por encima de los valores por defecto.",
        evidence: {
          rateLimitPerMinute: config.rateLimitPerMinute,
          bodyLimitBytes: config.bodyLimitBytes
        },
        remediation: ["Volver a los valores por defecto (120 por minuto, 64 KiB)."]
      })
    );
  }

  // ── BTC-OPSEC-008 · cadena de auditoría rota ──────────────────────────────
  const audit = context.auditVerification;
  if (audit && audit.valid === false) {
    findings.push(
      makeFinding({
        code: "BTC-OPSEC-008",
        detectedAt: now,
        severity: "critical",
        title: "La cadena de auditoría no verifica",
        explanation:
          "Una entrada del registro no encadena con la anterior: el historial fue modificado después de escribirse.",
        rootCause: "Manipulación del archivo de estado o corrupción del almacenamiento.",
        evidence: { brokenAtIndex: audit.brokenAt ?? null, entries: audit.entries ?? null },
        remediation: [
          "Preservar el archivo actual antes de tocar nada: es evidencia.",
          "Restaurar desde una copia conocida y revisar quién tuvo acceso al equipo."
        ]
      })
    );
  }

  return findings;
}
