# Changelog

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
