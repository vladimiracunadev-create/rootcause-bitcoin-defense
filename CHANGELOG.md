# Changelog

## 0.3.0 - 2026-08-20

Seguridad en cuatro niveles: auditoría continua, skill de dominio, agente y
funcionalidad del propio producto.

### Añade — detección

- `BTC-TX-002`: barrido, un gasto sin aprobación que se lleva el 90 % o más del
  saldo declarado de una wallet;
- `BTC-TX-003`: ráfaga, varios gastos sin aprobación de la misma wallet en menos
  de una hora;
- `BTC-PRIVACY-002`: correlación entre una filtración de datos y el fabricante de
  los firmantes que tienes registrados;
- `BTC-CUSTODY-003`: quorum N-de-N, donde perder un solo firmante deja los fondos
  irrecuperables;
- `BTC-INTEL-001/002/003`: la matriz de avisos está vieja, vacía o sin fechas de
  verificación — un panel en verde sobre inteligencia vieja es una tranquilidad
  falsa;
- familia `BTC-OPSEC-001…008`: la aplicación se audita a sí misma (bind fuera de
  loopback, inventario en modo demostración, clave de datos débil, RPC remoto,
  credenciales estáticas, watchtower apagado con alto valor, límites relajados y
  cadena de auditoría rota);
- campo opcional `valueSats` en las transacciones observadas, sin el cual no se
  puede distinguir un pago de un vaciado.

### Añade — reevaluación al cambiar

- Registrar una wallet vuelve a disparar el análisis completo, como ya hacían la
  observación de transacciones y de eventos de privacidad;
- cada reevaluación automática deja una entrada `auto_rescan` en la auditoría con
  el motivo y el recuento de hallazgos.

### Añade — auditoría continua

- `scripts/check-runtime-advisories.js`: audita el motor Node que se distribuye
  dentro del instalador contra la base del Node.js Security WG, distinguiendo el
  runtime que se distribuye del que ejecuta la comprobación;
- `scripts/check-history-secrets.js`: secretos en todo el histórico de git, con
  patrones del dominio, evidencia enmascarada y exenciones declaradas;
- workflow `security-audit.yml` con seis trabajos, también los lunes: custodia,
  runtime, secretos (más gitleaks verificado por checksum), workflows (zizmor y
  hadolint), inteligencia y sincronía del plugin.

### Añade — skill, agente y plugin

- Skill `bitcoin-custody-audit` con 14 etapas y ejecutable
  `scripts/audit-bitcoin.js`, que produce informe Markdown y plan de remediación;
- agente `bitcoin-security-auditor`, especializado en custodia Bitcoin, con
  prohibición explícita de pedir o aceptar material secreto;
- comando `/auditar-bitcoin`;
- `plugin/`, copia generada y verificada en CI desde `.claude/`.

### Añade — API y documentación

- `GET /api/posture`, postura de la instalación calculada en el momento;
- `docs/AUDITORIA_14_ETAPAS.md`, `docs/AUDITORIA_CONTINUA.md`,
  `docs/AGENTE_Y_PLUGIN.md` y `docs/POSTURA_DE_DESPLIEGUE.md`.

### Añade — una ficha por regla

- `config/rules-catalog.json`: catálogo versionado de las 26 reglas, con umbral,
  evidencia, remediación y la sección que más importa —**qué NO significa** cada
  hallazgo cuando salta;
- `docs/reglas/`: una ficha por regla más su índice, **generadas** desde el
  catálogo con `scripts/generate-rule-docs.js`;
- `landing/reglas.html`: la misma información publicada en GitHub Pages, con
  el semáforo por severidad y enlazada desde la navegación del sitio;
- `test/rules-catalog.test.js`: comprueba que el catálogo y el motor tienen
  **exactamente** los mismos códigos. Añadir una regla sin documentarla, o
  documentar una que no existe, rompe el build;
- séptima puerta de calidad: `generate-rule-docs.js --check`, para que una ficha
  editada a mano no sobreviva a un push.

### Añade — una ficha por regla

- `config/rules-catalog.json`: catálogo versionado con las 26 reglas —umbral,
  evidencia, causa raíz, remediación, qué **no** significan y cómo comprobarlas—;
- `docs/reglas/`: una ficha por regla más su índice, **generadas** desde el
  catálogo con `scripts/generate-rule-docs.js`;
- `landing/reglas.html`: la misma información publicada en GitHub Pages, con
  tarjeta por regla y ancla por código, generada desde la misma fuente;
- `test/rules-catalog.test.js`: seis pruebas que impiden la divergencia — toda
  regla del motor tiene ficha, toda ficha corresponde a una regla real, y ninguna
  se publica sin umbral, evidencia, remediación ni «qué NO significa»;
- puerta `generate-rule-docs.js --check` en `pnpm check`, en CI y en el release.

### Añade — identidad visual de la familia

- README con la firma de la familia RootCause: banner ASCII en caja doble, fila
  de badges, línea de enlaces destacados, el lema «Diagnóstico primero.
  Intervención después.» y el aviso de honestidad sobre lo que detecta;
- secciones con emoji en toda la documentación, como en las ediciones Windows,
  Web y Mobile;
- `check-doc-style.js` vigila también esa firma: sin banner, sin seis badges,
  sin línea de enlaces o sin lema, el build cae.

### Añade — estilo visual

- `scripts/check-doc-style.js`: puerta que mantiene el lenguaje visual de la
  familia RootCause en los 41 documentos —un H1, tablas con cabecera, bloques de
  código con lenguaje declarado y ningún documento de `docs/` fuera del índice;
- los informes de auditoría se generan con esa misma estética: semáforo
  🟢🟡🔴⚪, resumen ejecutivo, cobertura por etapa, detalle por bloque y plan de
  remediación como lista de verificación;
- tablas de resumen en los documentos que no las tenían: arquitectura, roadmap,
  runbook, checklist, contribución, principios y política de seguridad.

### Actualiza

- GitHub Actions al día, con cada SHA verificado antes de fijarlo:
  `actions/checkout` v7.0.1, `actions/upload-artifact` v7.0.1,
  `actions/configure-pages` v6.0.0, `actions/deploy-pages` v5.0.0,
  `actions/upload-pages-artifact` v5.0.0 y `github/codeql-action` v4.37.7.

### Corrige

- `BUILD-INFO.json` se escribía con BOM y `JSON.parse` no podía leerlo: la
  procedencia del artefacto era ilegible por máquina;
- `Dockerfile`: el usuario pasa a ser numérico (`1000:1000`), porque un host que
  no resuelva el nombre `node` acabaría ejecutando el proceso como root, y la
  comprobación de salud pasa a notación JSON para no interponer un shell entre
  Docker y el proceso;
- `gitleaks` se descargaba renombrado y su verificación de checksum fallaba
  siempre; ahora el archivo conserva su nombre y el hash se comprueba de verdad;
- los checkouts de todos los workflows dejan de persistir credenciales en
  `.git/config` (hallazgo `artipacked` de zizmor);
- la regla de bind abierto distingue ahora un contenedor —donde `0.0.0.0` es lo
  normal y quien decide la exposición es el mapeo de puertos— de una instalación
  de escritorio expuesta.

## 0.2.0 - 2026-08-20

Edición de escritorio para Windows y verificación ejecutable de las promesas
del proyecto.

### Añade

- aplicación de Windows en dos formatos: instalador por usuario (Inno Setup,
  sin permisos de administrador) y edición portable en ZIP;
- empaquetador que descarga el motor Node.js oficial y VERIFICA su SHA-256
  contra `SHASUMS256.txt` antes de incluirlo;
- verificación de arranque real del paquete: el ZIP no se crea si la aplicación
  empaquetada no sirve el panel y no rechaza material secreto;
- lanzador de escritorio que abre el panel en el navegador por defecto, guarda
  la configuración y los datos cifrados fuera de la carpeta del programa, y se
  niega a arrancar en modo persistente sin clave de datos;
- apertura de navegador opcional y restringida a loopback (`ROOTCAUSE_OPEN_BROWSER`);
- icono multirresolución generado desde código, no versionado como binario;
- `scripts/check-security-claims.js`: arranca la aplicación real y comprueba 20
  invariantes (semillas, mnemónicos, passphrases, xprv, cabecera local,
  cross-site, allowlist RPC, RPC remoto, CSP, valores por defecto);
- `scripts/check-local-only.js`: cero dependencias, cero orígenes remotos, CSP
  `self` intacta;
- `scripts/check-docs.js`: ningún documento referenciado puede faltar;
- comprobación de coherencia entre la versión de `package.json` y la que
  responde `/api/health`;
- CI ampliada a cinco trabajos, con matriz de tres sistemas operativos y dos
  versiones de Node, y actions pinneadas a commit SHA;
- workflow de release de Windows que instala el `.exe` en silencio, arranca la
  aplicación instalada y publica `SHA256SUMS.txt`;
- análisis CodeQL semanal y Dependabot para GitHub Actions;
- `docs/ADR-0001-plataforma-y-lenguaje.md` y `docs/WINDOWS-APP.md`;
- documentación completa alineada con el resto de la familia RootCause: índice
  (`INDEX.md`), glosario de términos, manual de usuario para la versión Windows
  y para el panel local, manual para quien empieza de cero, operación,
  troubleshooting, heurísticas de las 11 reglas, detección de amenazas,
  limitaciones, requisitos, testing, CI, checklist de release, política de
  privacidad local, catálogo de producto, comparativa con otras herramientas,
  licencia y decisión, y por qué JavaScript sin dependencias;
- landing pública en GitHub Pages.

### Cambia

- `pnpm check` encadena las cinco puertas de calidad.

## 0.1.0 - 2026-08-20

Primera versión funcional.

### Incluye

- dashboard responsive instalable como PWA;
- inventario público de wallets y firmantes;
- matriz de avisos COLDCARD y Trezor fechada;
- motor de reglas y puntuación de riesgo;
- detección de gastos no aprobados;
- snapshot Bitcoin Core con RPC de lectura;
- cifrado AES-256-GCM para persistencia;
- auditoría hash-chain;
- controles HTTP y rechazo de material secreto;
- pruebas unitarias y de integración;
- laboratorio regtest y simulación;
- documentación de arquitectura, amenazas, integración y runbooks.

### No incluye

- autenticación multiusuario;
- custodia de claves;
- firma de transacciones;
- ZMQ;
- seguimiento por descriptor;
- ingestión automática de avisos;
- integración directa con un repositorio RootCause específico.
