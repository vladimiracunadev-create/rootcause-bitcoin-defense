# RootCause Bitcoin Defense

```text
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║  ██████╗  ██████╗  ██████╗ ████████╗ ██████╗  █████╗ ██╗   ██╗███████╗███████╗    ║
║  ██╔══██╗██╔═══██╗██╔═══██╗╚══██╔══╝██╔════╝ ██╔══██╗██║   ██║██╔════╝██╔════╝    ║
║  ██████╔╝██║   ██║██║   ██║   ██║   ██║      ███████║██║   ██║███████╗█████╗      ║
║  ██╔══██╗██║   ██║██║   ██║   ██║   ██║      ██╔══██║██║   ██║╚════██║██╔══╝      ║
║  ██║  ██║╚██████╔╝╚██████╔╝   ██║   ╚██████╗ ██║  ██║╚██████╔╝███████║███████╗    ║
║  ╚═╝  ╚═╝ ╚═════╝  ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚══════╝╚══════╝      ║
║                                                                                   ║
║                       B I T C O I N   D E F E N S E                               ║
║              Defensa watch-only de custodia · Node + JS · v0.3.0                  ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

[![CI](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/actions/workflows/ci.yml/badge.svg)](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/actions/workflows/ci.yml)
[![Auditoría de seguridad](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/actions/workflows/security-audit.yml/badge.svg)](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/actions/workflows/security-audit.yml)
[![CodeQL](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/actions/workflows/codeql.yml/badge.svg)](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A5%2022.12-green.svg)](docs/REQUIREMENTS.md)
[![Platform](https://img.shields.io/badge/plataforma-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey.svg)](docs/WINDOWS-APP.md)
[![Dependencias](https://img.shields.io/badge/dependencias-0-success.svg)](docs/JAVASCRIPT_PARA_ROOTCAUSE.md)
[![Telemetría](https://img.shields.io/badge/telemetr%C3%ADa-cero-success.svg)](docs/POLITICA_DE_PRIVACIDAD_LOCAL.md)
[![Claves privadas](https://img.shields.io/badge/claves%20privadas-nunca-critical.svg)](docs/LIMITACIONES.md)
[![Version](https://img.shields.io/badge/version-0.3.0-green.svg)](docs/ROADMAP.md)

🌐 **[Página del producto →](https://vladimiracunadev-create.github.io/rootcause-bitcoin-defense/)**  ·  💾 **[Descargar para Windows →](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/releases/latest)**  ·  📘 **[Manual de usuario →](docs/MANUAL_USUARIO.md)** (qué es cada cosa, en claro)

---

**RootCause Bitcoin Defense es el hermano de custodia de
[rootcause-windows-inspector](https://github.com/vladimiracunadev-create/rootcause-windows-inspector),
[rootcause-web-inspector](https://github.com/vladimiracunadev-create/rootcause-web-inspector)
y [rootcause-mobile-inspector](https://github.com/vladimiracunadev-create/rootcause-mobile-inspector):**
una aplicación local y watch-only que inventaría **la procedencia de tus claves
Bitcoin**, escrita en JavaScript sobre Node, **sin una sola dependencia**.

Hereda la misma razón de existir, llevada a un dominio donde el síntoma llega
tarde: **una wallet puede estar comprometida sin que nadie la haya tocado.** Si
la semilla nació de un firmware con un defecto de entropía, el atacante no roba
nada — reconstruye la clave y firma una transacción perfectamente válida. Y eso
**no se ve mirando la wallet**: solo se ve sabiendo con qué dispositivo, modelo y
versión de firmware se creó cada semilla.

> **Diagnóstico primero. Intervención después.**

Es un **sensor de procedencia y apoyo a la decisión**, no una wallet: no custodia
claves, no firma, no transmite y **nunca acepta una semilla** —si se la envías,
la rechaza—. Detecta el origen del riesgo, lo explica con evidencia y deja el
runbook; mover fondos es siempre una decisión humana verificada en dispositivos
independientes.

> 🛡️ **Qué detecta hoy, amenaza por amenaza (con honestidad):** [`docs/DETECCION_AMENAZAS.md`](docs/DETECCION_AMENAZAS.md)
>
> 🔬 **Y cómo se comprueba que todo esto es cierto:** [`docs/AUDITORIA_14_ETAPAS.md`](docs/AUDITORIA_14_ETAPAS.md)

---

## 🎯 Por qué existe

En julio y agosto de 2026, el incidente de COLDCARD mostró que una wallet física
puede mantenerse fuera de línea y aun así estar comprometida si la semilla fue
creada con entropía insuficiente. El protocolo Bitcoin no fue vulnerado: los
atacantes reconstruyeron claves y generaron transacciones válidas.

En agosto de 2026, Trezor también informó una filtración de información personal
en un proveedor logístico. Las claves no fueron afectadas, pero nombres,
teléfonos y direcciones permiten phishing y ataques dirigidos.

RootCause Bitcoin Defense convierte esas lecciones en controles de aplicación:

- inventario de wallets y firmantes sin semillas;
- matriz versionada de avisos de seguridad;
- detección de firmware usado al crear una semilla;
- análisis de concentración single-signature;
- verificación de diversidad multisig;
- watchtower para gastos fuera de política;
- snapshot de Bitcoin Core mediante RPC de solo lectura;
- incidentes con causa raíz, evidencia y remediación;
- auditoría encadenada criptográficamente;
- almacenamiento local cifrado con AES-256-GCM;
- dashboard web instalable como PWA.

## 🚫 Principios no negociables

1. La aplicación nunca solicita ni almacena semillas, palabras de recuperación,
   passphrases BIP-39, WIF, xprv o claves privadas.
2. No firma ni transmite transacciones automáticamente.
3. Bitcoin Core RPC se limita mediante una allowlist de métodos de lectura.
4. RPC utiliza localhost por defecto y rechaza destinos remotos.
5. La IA es opcional y nunca necesaria para detectar, correlacionar o responder.
6. Un hallazgo no se considera verdadero solamente por una explicación de IA.
7. Toda migración de fondos requiere verificación humana en dispositivos
   independientes.

## 💾 Instalar en Windows

La forma normal de usar esta aplicación es como programa de escritorio. Los
artefactos se publican en
[Releases](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/releases):

| Artefacto | Para quién |
| --- | --- |
| `RootCause-Bitcoin-Defense-<versión>-win-x64-setup.exe` | Instalación normal, por usuario, sin permisos de administrador |
| `RootCause-Bitcoin-Defense-<versión>-win-x64-portable.zip` | Descomprimir y ejecutar, sin instalar nada |

No hace falta tener Node.js: el motor oficial viaja dentro del paquete,
verificado por SHA-256 al empaquetar. Al abrir la aplicación se levanta el panel
en `http://127.0.0.1:8787` y se lanza el navegador por defecto; se detiene
cerrando la ventana de consola.

Verifica siempre la descarga contra `SHA256SUMS.txt`:

~~~powershell
Get-FileHash .\RootCause-Bitcoin-Defense-0.2.0-win-x64-setup.exe -Algorithm SHA256
~~~

Construir los artefactos desde el código, configuración del usuario y qué se
verifica antes de publicar: [docs/WINDOWS-APP.md](docs/WINDOWS-APP.md).

~~~bash
pnpm package:windows
~~~

La aplicación corre igual en Linux y macOS ejecutándola desde el código; lo
específico de Windows es únicamente el empaquetado.

## ⚡ Inicio rápido

Requisitos:

- Node.js 22.12 o superior;
- pnpm 11;
- no se necesitan dependencias externas.

~~~bash
corepack enable
pnpm start
~~~

Abre http://127.0.0.1:8787.

La configuración inicial usa datos ficticios y mantiene todo en memoria. Permite
examinar el caso COLDCARD, reconocer incidentes y simular un gasto no autorizado.

## ✅ Verificación

`pnpm check` encadena las siete puertas que también corren en CI:

~~~bash
pnpm check
~~~

| Puerta | Qué comprueba |
| --- | --- |
| `node scripts/validate-repo.js` | Archivos obligatorios, JSON válido, sintaxis, versión sincronizada con `/api/health`, ausencia de material privado embebido |
| `node scripts/check-local-only.js` | Cero dependencias, cero orígenes remotos en el panel, CSP `self` intacta |
| `node scripts/check-docs.js` | Todo documento referenciado existe |
| `node scripts/check-doc-style.js` | El lenguaje visual de la familia RootCause: banner, badges, lema, un H1 por documento y todo `docs/` en el índice |
| `node scripts/generate-rule-docs.js --check` | Las 26 fichas de regla y su página publicada coinciden con el catálogo |
| `node --test` | Pruebas unitarias y de integración |
| `node scripts/check-security-claims.js` | Arranca la aplicación real y comprueba que rechaza semillas, mnemónicos, passphrases, xprv, mutaciones sin cabecera local, peticiones cross-site y RPC remoto |

Y dos capas más, que corren en la auditoría continua:

| Capa | Qué comprueba |
| --- | --- |
| `node scripts/check-history-secrets.js` | Secretos en **todo** el histórico de git, con patrones del dominio (`xprv`, WIF, mnemónicos, clave de datos) |
| `node scripts/check-runtime-advisories.js` | Avisos abiertos del motor Node que viaja dentro del instalador, contra la base del Node.js Security WG |

La última merece el énfasis: no lee el código, lo ejecuta. Las promesas del
README son afirmaciones verificables, no notas de intención.

Si el entorno bloquea la resolución de Corepack, ninguna de ellas depende de
paquetes descargados y todas pueden ejecutarse directamente con `node`.

## 🔐 Persistencia cifrada

Genera una clave de datos:

~~~bash
pnpm generate:data-key
~~~

Guárdala en un gestor de secretos o en un archivo local protegido que no sea
versionado. Después inicia:

~~~bash
DEMO_MODE=false ROOTCAUSE_DATA_KEY="valor-generado" pnpm start
~~~

El estado se cifra con AES-256-GCM. La clave no se escribe en el repositorio ni
en el archivo de datos.

## 🔗 Conectar Bitcoin Core

La opción preferida es el archivo cookie de autenticación de Bitcoin Core:

~~~bash
DEMO_MODE=false \
ROOTCAUSE_DATA_KEY="valor-generado" \
BITCOIN_RPC_COOKIE_FILE="/ruta/segura/.cookie" \
BITCOIN_RPC_URL="http://127.0.0.1:8332" \
WATCHTOWER_ENABLED=true \
pnpm start
~~~

La conexión usa solamente:

- getblockchaininfo;
- getnetworkinfo;
- getpeerinfo;
- getmempoolinfo;
- getmempoolentry;
- getrawmempool;
- gettxout;
- getwalletinfo;
- getblockcount y getbestblockhash;
- estimatesmartfee.

Los métodos de firma, envío, desbloqueo o modificación son rechazados antes de
realizar la solicitud RPC.

Bitcoin Core advierte que RPC concede control significativo sobre el nodo y no
debe exponerse a Internet. La allowlist de esta aplicación es una defensa
adicional y no sustituye el aislamiento del sistema operativo.

## 🏗️ Arquitectura

~~~mermaid
flowchart TD
    A["Avisos y procedencia"] --> D["Motor RootCause"]
    B["Bitcoin Core read-only"] --> D
    C["Inventario de firmantes"] --> D
    D --> E["Hallazgo causal"]
    E --> F["Evidencia y runbook"]
~~~

El dashboard y la API comparten el mismo proceso local. El diseño sin
dependencias externas facilita auditoría, ejecución en Windows, macOS, Linux o
contenedores y posterior incorporación al stack real de RootCause.

El índice completo de la documentación está en
[docs/INDEX.md](docs/INDEX.md). Los cuatro documentos con los que suele empezar
la gente:

| Si eres… | Empieza por |
| --- | --- |
| Nuevo en el tema | [docs/MANUAL_PARA_NOVATOS.md](docs/MANUAL_PARA_NOVATOS.md) — sin dar nada por sabido |
| Usuario del panel | [docs/MANUAL_USUARIO.md](docs/MANUAL_USUARIO.md) — pantalla por pantalla, Windows y localhost |
| Operador | [docs/OPERACION.md](docs/OPERACION.md) — qué hacer ante cada hallazgo |
| Desarrollador | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) y [docs/HEURISTICAS.md](docs/HEURISTICAS.md) |

Y si aparece una palabra que no conoces, está en
[docs/GLOSARIO.md](docs/GLOSARIO.md).

## 🚦 Reglas incluidas

Veintiséis reglas en siete familias. **Cada una tiene su ficha**: qué la dispara,
con qué umbral, qué evidencia adjunta, cómo se remedia y —sobre todo— qué **no**
significa cuando salta.

| Código | Detección | Severidad |
| --- | --- | --- |
| [`BTC-KEY-001`](docs/reglas/BTC-KEY-001.md) | Semilla creada con firmware afectado | 🔴 |
| [`BTC-KEY-002`](docs/reglas/BTC-KEY-002.md) | Firmware de creación desconocido | 🟠 · 🟡 |
| [`BTC-KEY-003`](docs/reglas/BTC-KEY-003.md) | Origen de entropía desconocido | 🟡 |
| [`BTC-CUSTODY-001`](docs/reglas/BTC-CUSTODY-001.md) | Fondos de alto valor dependen de una sola clave | 🔴 |
| [`BTC-CUSTODY-002`](docs/reglas/BTC-CUSTODY-002.md) | Multisig sin diversidad de implementación | 🟠 · 🟡 |
| [`BTC-CUSTODY-003`](docs/reglas/BTC-CUSTODY-003.md) | Quorum sin tolerancia a fallos (N-de-N) | 🟠 · 🟡 |
| [`BTC-TX-001`](docs/reglas/BTC-TX-001.md) | Gasto observado sin aprobación conocida | 🔴 |
| [`BTC-TX-002`](docs/reglas/BTC-TX-002.md) | Barrido del saldo de una wallet vigilada | 🔴 |
| [`BTC-TX-003`](docs/reglas/BTC-TX-003.md) | Varios gastos sin aprobación en ventana corta | 🔴 |
| [`BTC-NODE-001`](docs/reglas/BTC-NODE-001.md) | Bitcoin Core no disponible | 🟠 |
| [`BTC-NODE-002`](docs/reglas/BTC-NODE-002.md) | Nodo todavía no sincronizado | 🟡 |
| [`BTC-NODE-003`](docs/reglas/BTC-NODE-003.md) | Nodo sin peers | 🟠 |
| [`BTC-NODE-004`](docs/reglas/BTC-NODE-004.md) | Presión elevada de mempool | 🟡 |
| [`BTC-PRIVACY-001`](docs/reglas/BTC-PRIVACY-001.md) | Acceso masivo a datos de clientes | 🔴 · 🟡 |
| [`BTC-PRIVACY-002`](docs/reglas/BTC-PRIVACY-002.md) | El proveedor filtrado fabrica tus firmantes | 🟠 |
| [`BTC-INTEL-001`](docs/reglas/BTC-INTEL-001.md) | Matriz de avisos sin verificar | 🟡 · 🟠 |
| [`BTC-INTEL-002`](docs/reglas/BTC-INTEL-002.md) | Sin matriz de avisos cargada | 🟠 |
| [`BTC-INTEL-003`](docs/reglas/BTC-INTEL-003.md) | Avisos sin fecha de verificación | 🟡 |
| [`BTC-OPSEC-001`](docs/reglas/BTC-OPSEC-001.md) | El panel escucha fuera de loopback | 🔴 · 🟡 |
| [`BTC-OPSEC-002`](docs/reglas/BTC-OPSEC-002.md) | Inventario con saldo declarado en modo demostración | 🟡 |
| [`BTC-OPSEC-003`](docs/reglas/BTC-OPSEC-003.md) | Clave de datos por debajo del mínimo recomendado | 🟠 · 🟡 |
| [`BTC-OPSEC-004`](docs/reglas/BTC-OPSEC-004.md) | RPC de Bitcoin Core remoto habilitado | 🟠 |
| [`BTC-OPSEC-005`](docs/reglas/BTC-OPSEC-005.md) | RPC autenticado con usuario y contraseña | 🟡 |
| [`BTC-OPSEC-006`](docs/reglas/BTC-OPSEC-006.md) | Watchtower apagado con wallets de alto valor | 🟡 |
| [`BTC-OPSEC-007`](docs/reglas/BTC-OPSEC-007.md) | Límites de petición por encima de lo razonable | ⚪ |
| [`BTC-OPSEC-008`](docs/reglas/BTC-OPSEC-008.md) | La cadena de auditoría no verifica | 🔴 |

📘 **[Fichas completas de las 26 reglas →](docs/reglas/README.md)**  ·  🌐 **[Versión publicada →](https://vladimiracunadev-create.github.io/rootcause-bitcoin-defense/reglas.html)**  ·  🔬 **[Especificación por familias →](docs/HEURISTICAS.md)**

## 🔬 Auditoría de custodia en 14 etapas

El repositorio trae su propia auditoría de dominio, ejecutable en un comando:

~~~bash
node scripts/audit-bitcoin.js --report
~~~

Recorre procedencia de claves, frescura de la inteligencia, arquitectura de
custodia, rechazo de material secreto, secretos en el histórico de git, avisos
abiertos del runtime que viaja dentro del instalador, dependencias, integridad
del repositorio, postura de la instalación, aislamiento del nodo, cifrado,
workflows, verificación del artefacto y proceso humano de respuesta.

Cada etapa **declara su cobertura**, y una etapa que no puede ejecutarse sale
como omitida, nunca como aprobada. Detalle en
[docs/AUDITORIA_14_ETAPAS.md](docs/AUDITORIA_14_ETAPAS.md).

Lo mismo existe como skill, agente y comando para Claude Code —y como plugin
instalable en `plugin/`— documentado en
[docs/AGENTE_Y_PLUGIN.md](docs/AGENTE_Y_PLUGIN.md). El workflow
`security-audit.yml` lo corre en cada push y **cada lunes**, porque un aviso
nuevo no espera a que alguien haga commit:
[docs/AUDITORIA_CONTINUA.md](docs/AUDITORIA_CONTINUA.md).

## 🧩 API mínima

Las mutaciones requieren el encabezado local x-rootcause-request con valor 1.

~~~bash
curl http://127.0.0.1:8787/api/summary

curl -X POST http://127.0.0.1:8787/api/scan \
  -H "content-type: application/json" \
  -H "x-rootcause-request: 1" \
  --data "{}"
~~~

La API completa está descrita en docs/API.md.

## 📁 Estructura

~~~text
.claude/                 Skill, agente y comando de auditoría de custodia
.github/workflows/       CI, CodeQL, auditoría de seguridad, landing y release
landing/                 Página pública, estática y sin recursos de terceros
plugin/                  Copia distribuible del skill, el agente y el comando
config/                  Avisos y políticas versionadas
docs/                    Arquitectura, amenazas, decisiones, runbooks e integración
examples/                Eventos públicos ficticios
labs/regtest/            Configuración de laboratorio Bitcoin
packaging/windows/       Empaquetador portable, instalador Inno Setup y lanzadores
scripts/                 Validación, puertas de seguridad y utilidades
src/api/                 Rutas HTTP
src/domain/              Reglas, firmware, riesgo y protección de secretos
src/infrastructure/      RPC, cifrado y auditoría
src/services/            Casos de uso y watchtower
src/web/static/          Dashboard responsive y PWA
test/                    Pruebas unitarias y de integración
~~~

## 📖 Documentación del sistema

La documentación técnica, funcional, arquitectónica y operativa del proyecto se
encuentra en [`docs/system-documentation/`](docs/system-documentation/README.md):
un estudio del repositorio hecho desde cero, con el mapa de código archivo a
archivo, la referencia de cada función y la trazabilidad de cada funcionalidad
desde la interfaz hasta el disco y su prueba.

- [Índice general de documentación](docs/system-documentation/README.md)
- [Descripción general](docs/system-documentation/01-system-overview.md) — incluye la explicación para una persona no técnica
- [Instalación y ejecución](docs/system-documentation/02-installation-and-execution.md)
- [Arquitectura](docs/system-documentation/03-architecture.md)
- [Mapa completo del código](docs/system-documentation/04-code-map.md)
- [Referencia técnica](docs/system-documentation/05-technical-reference.md)
- [Explicación profunda del código](docs/system-documentation/06-deep-code-explanation.md)
- [Base de datos y persistencia](docs/system-documentation/07-database.md)
- [Seguridad](docs/system-documentation/11-security.md)
- [Riesgos y deuda técnica](docs/system-documentation/15-risks-and-technical-debt.md)
- [Resumen ejecutivo](docs/system-documentation/17-executive-summary.md)
- [Guía para nuevos desarrolladores](docs/system-documentation/18-new-developer-guide.md)
- [Matriz de trazabilidad](docs/system-documentation/19-traceability-matrix.md)
- [Documentos en PDF](docs/system-documentation/pdf/README.md)

El resto de la documentación —producto, operación, reglas, amenazas y
decisiones— sigue donde estaba, indexada en
[`docs/INDEX.md`](docs/INDEX.md).

## ⚖️ Limitaciones honestas

- No puede determinar la entropía real de una semilla mirando una dirección.
  Necesita procedencia verificable: fabricante, modelo, versión usada al crearla
  y proceso de generación.
- No puede cancelar ni revertir una transacción Bitcoin válida y confirmada.
- Bloquear retiros en la aplicación no protege una wallet single-signature si
  el atacante ya posee la clave y puede gastar fuera de la aplicación.
- No sustituye una auditoría criptográfica, un HSM, una política multisig ni un
  proceso profesional de respuesta a incidentes.
- La matriz de avisos está fechada al 20 de agosto de 2026 y debe actualizarse
  desde fuentes oficiales.

## 📚 Fuentes técnicas

- Coinkite, COLDCARD Security Advisory:
  https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/
- Block Engineering, Predictable RNG Fallback:
  https://engineering.block.xyz/blog/predictable-rng-fallback-and-32-bit-reseed-in-coldcard-firmware
- Trezor, shipping-provider incident:
  https://trezor.io/blog/news/recent-customer-data-exposed-in-shipping-provider-incident
- Bitcoin Core JSON-RPC security:
  https://github.com/bitcoin/bitcoin/blob/master/doc/JSON-RPC-interface.md
- NIST SP 800-90B:
  https://csrc.nist.gov/pubs/sp/800/90/b/final
- Bitcoin Core HWI:
  https://github.com/bitcoin-core/HWI

## 📄 Licencia

MIT. Revisa SECURITY.md antes de desplegar la aplicación con información real.
