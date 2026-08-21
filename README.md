# RootCause Bitcoin Defense

[![CI](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/actions/workflows/ci.yml/badge.svg)](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/actions/workflows/ci.yml)
[![CodeQL](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/actions/workflows/codeql.yml/badge.svg)](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/actions/workflows/codeql.yml)
[![Release Windows](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/actions/workflows/release-windows.yml/badge.svg)](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/actions/workflows/release-windows.yml)
[![Auditoría de seguridad](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/actions/workflows/security-audit.yml/badge.svg)](https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense/actions/workflows/security-audit.yml)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-informational)](LICENSE)
[![Dependencias](https://img.shields.io/badge/dependencias-cero-success)](docs/ARCHITECTURE.md)

Aplicación local y watch-only para inventariar la procedencia de claves Bitcoin,
detectar exposición criptográfica, correlacionar incidentes y ejecutar respuestas
seguras sin custodiar secretos.

Este repositorio es un módulo independiente y listo para integrarse con el producto
RootCause existente. No reemplaza su collector, motor de reglas, correlador,
evidencias, notificador ni auditoría.

## Por qué existe

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

## Principios no negociables

1. La aplicación nunca solicita ni almacena semillas, palabras de recuperación,
   passphrases BIP-39, WIF, xprv o claves privadas.
2. No firma ni transmite transacciones automáticamente.
3. Bitcoin Core RPC se limita mediante una allowlist de métodos de lectura.
4. RPC utiliza localhost por defecto y rechaza destinos remotos.
5. La IA es opcional y nunca necesaria para detectar, correlacionar o responder.
6. Un hallazgo no se considera verdadero solamente por una explicación de IA.
7. Toda migración de fondos requiere verificación humana en dispositivos
   independientes.

## Instalar en Windows

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

## Inicio rápido

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

## Verificación

`pnpm check` encadena las seis puertas que también corren en CI:

~~~bash
pnpm check
~~~

| Puerta | Qué comprueba |
| --- | --- |
| `node scripts/validate-repo.js` | Archivos obligatorios, JSON válido, sintaxis, versión sincronizada con `/api/health`, ausencia de material privado embebido |
| `node scripts/check-local-only.js` | Cero dependencias, cero orígenes remotos en el panel, CSP `self` intacta |
| `node scripts/check-docs.js` | Todo documento referenciado existe |
| `node scripts/check-doc-style.js` | El lenguaje visual de la familia RootCause: un H1, tablas con cabecera, bloques con lenguaje y todo `docs/` en el índice |
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

## Persistencia cifrada

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

## Conectar Bitcoin Core

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

## Arquitectura

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

## Reglas incluidas

| Código | Detección |
| --- | --- |
| BTC-KEY-001 | Firmante creado con firmware afectado |
| BTC-KEY-002 | Firmware de creación desconocido |
| BTC-KEY-003 | Origen de entropía desconocido |
| BTC-CUSTODY-001 | Fondos de alto valor controlados por una sola clave |
| BTC-CUSTODY-002 | Multisig sin diversidad de fabricantes |
| BTC-TX-001 | Gasto observado sin aprobación conocida |
| BTC-NODE-001 | Bitcoin Core no disponible |
| BTC-NODE-002 | Nodo todavía no sincronizado |
| BTC-NODE-003 | Nodo sin peers |
| BTC-NODE-004 | Presión elevada de mempool |
| BTC-PRIVACY-001 | Acceso masivo a datos de clientes |
| BTC-CUSTODY-003 | Quorum N-de-N: perder un firmante congela los fondos |
| BTC-TX-002 | Barrido: un gasto sin aprobar se lleva ≥ 90 % del saldo |
| BTC-TX-003 | Ráfaga: varios gastos sin aprobar en menos de una hora |
| BTC-PRIVACY-002 | La filtración afecta al fabricante de tus firmantes |
| BTC-INTEL-001/2/3 | La matriz de avisos está vieja, vacía o sin fechar |
| BTC-OPSEC-001…008 | Postura de la instalación: bind, cifrado, RPC, vigilancia, auditoría |

Especificación de cada una en [docs/HEURISTICAS.md](docs/HEURISTICAS.md); la
familia `BTC-OPSEC` en [docs/POSTURA_DE_DESPLIEGUE.md](docs/POSTURA_DE_DESPLIEGUE.md).

## Auditoría de custodia en 14 etapas

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

## API mínima

Las mutaciones requieren el encabezado local x-rootcause-request con valor 1.

~~~bash
curl http://127.0.0.1:8787/api/summary

curl -X POST http://127.0.0.1:8787/api/scan \
  -H "content-type: application/json" \
  -H "x-rootcause-request: 1" \
  --data "{}"
~~~

La API completa está descrita en docs/API.md.

## Estructura

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

## Limitaciones honestas

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

## Fuentes técnicas

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

## Licencia

MIT. Revisa SECURITY.md antes de desplegar la aplicación con información real.
