# Prompt maestro: integrar RootCause con defensa Bitcoin

| Principio | Consecuencia en el código |
| --- | --- |
| Nunca recibe material secreto | `src/domain/secret-guard.js` rechaza por nombre y por patrón, a cualquier profundidad |
| No firma ni transmite | La capacidad no está desactivada: no existe el código |
| RPC de solo lectura | Allowlist de 14 métodos en `src/infrastructure/bitcoin-rpc.js` |
| Todo local | Bind en loopback y CSP `self`, verificado en cada push |
| La IA nunca decide | Las reglas son deterministas y auditables |
| Verificación humana para mover fondos | `config/policies.json` → `humanApprovalRequired` |

> **Cada principio de este documento tiene una comprobación que lo defiende.**
> Si alguna vez dejara de ser cierto, el build cae antes de llegar a `main`.

## Rol

Actúa como arquitecto principal de seguridad, desarrollador senior y revisor
criptográfico. Debes mejorar el producto RootCause existente incorporando un
dominio Bitcoin defensivo. RootCause ya existe: no lo reconstruyas desde cero.

## Objetivo

Incorporar observabilidad, detección, correlación causal, evidencia, alertas y
acciones seguras para infraestructura Bitcoin, wallets y cadena de suministro
de custodia. El resultado debe explicar qué falló, por qué, qué activos están
expuestos, qué evidencia lo demuestra y qué acción reversible es apropiada.

## Regla inicial obligatoria

Antes de editar:

1. inspecciona el repositorio completo;
2. lee AGENTS.md y reglas equivalentes;
3. identifica stack, módulos, patrones, pruebas y cambios del usuario;
4. localiza collector, motor de reglas, correlador, notificador, evidencia,
   ejecutor, auditoría y adaptador IA;
5. preserva el stack salvo una razón técnica fuerte, documentada y aprobada;
6. conserva todos los cambios existentes que no pertenezcan a esta tarea.

## Restricciones de seguridad

- Nunca solicites, recibas, registres ni almacenes semillas, mnemonics, WIF,
  xprv, passphrases, PIN o claves privadas.
- No implementes firma en el servidor RootCause.
- No transmitas transacciones automáticamente.
- No prometas cancelar o revertir transacciones Bitcoin confirmadas.
- No expongas Bitcoin Core RPC a Internet.
- Mantén RPC en modo lectura con allowlist.
- No uses datos on-chain de terceros si un nodo local puede resolver el caso.
- Cifra fingerprints, descriptores, direcciones y saldos cuando persistan.
- Separa identidad personal de actividad Bitcoin.
- Toda acción que afecte fondos requiere aprobación humana y verificación en
  hardware independiente.
- La IA es opcional por API. El producto funciona sin IA.
- La IA explica o resume; no crea hechos, severidades ni autorizaciones.

## Incidentes de referencia

### Clase COLDCARD 2026

Modela la cadena causal:

error de build o enlace → fallback RNG no criptográfico → entropía reducida →
semilla predecible → clave reconstruida fuera de línea → transacción válida.

La defensa debe cubrir:

- procedencia del firmware usado al crear cada semilla;
- matriz de versiones afectadas;
- pruebas fail-closed del RNG;
- verificación sobre binario y hardware real;
- compilaciones reproducibles y procedencia SLSA;
- diversidad multisig;
- migración completa, porque actualizar firmware no repara la semilla antigua.

### Clase Trezor / proveedor logístico 2026

Modela:

proveedor con datos → acceso no autorizado → exposición de identidad y dirección
→ phishing o ataque dirigido.

La defensa debe cubrir:

- minimización y vencimiento;
- tokenización;
- auditoría de proveedores;
- detección de lectura masiva;
- separación entre pedidos y actividad on-chain;
- comunicación oficial verificable.

## Arquitectura deseada

Reutiliza los componentes RootCause existentes y agrega adaptadores o packs:

- bitcoin-core-rpc-adapter;
- bitcoin-zmq-adapter;
- hardware-wallet-provenance-adapter;
- bitcoin-advisory-ingestor;
- bitcoin-rule-pack;
- bitcoin-correlation-pack;
- bitcoin-evidence-bundle;
- bitcoin-safe-actions;
- bitcoin-dashboard;
- bitcoin-regtest-lab.

No copies estos nombres si contradicen la convención real del repositorio.
Adáptalos después de inspeccionar.

## Entidades mínimas

Wallet:

- identificador interno;
- nombre;
- fingerprint público;
- red;
- tipo single-signature o multisig;
- quorum;
- saldo observado;
- estado;
- tags.

Firmante:

- identificador;
- fingerprint público;
- fabricante;
- modelo;
- firmware usado al crear la semilla;
- canal de firmware;
- fecha;
- origen de entropía declarado;
- procedencia verificable.

Incidente:

- código;
- severidad;
- entidad;
- síntoma;
- causa raíz;
- evidencia;
- firstSeen y lastSeen;
- estado;
- remediación;
- aprobaciones;
- hash de auditoría.

Nunca agregues un campo para material secreto.

## Reglas mínimas

- BTC-KEY-001: firmware afectado al crear la semilla.
- BTC-KEY-002: firmware de creación desconocido.
- BTC-KEY-003: origen de entropía desconocido.
- BTC-CUSTODY-001: fondos de alto valor en single-signature.
- BTC-CUSTODY-002: multisig sin independencia real.
- BTC-SUPPLY-001: artefacto sin firma o procedencia.
- BTC-SUPPLY-002: build no reproducible o configuración inesperada.
- BTC-TX-001: gasto sin aprobación conocida.
- BTC-TX-002: barrido o velocidad anormal.
- BTC-NODE-001: nodo no disponible.
- BTC-NODE-002: sincronización detenida.
- BTC-NODE-003: peers ausentes o aislamiento probable.
- BTC-NODE-004: presión de mempool.
- BTC-PRIVACY-001: lectura o exportación masiva.

Cada regla debe tener pruebas positivas, negativas y de límites.

## Acciones

Automáticas permitidas:

- crear incidente;
- capturar evidencia redactada;
- notificar;
- impedir nuevas direcciones de depósito dentro de la aplicación;
- denegar una autorización interna;
- revocar sesiones o tokens propios;
- detener el collector afectado y cambiar a un nodo de observación aprobado.

Con aprobación humana:

- crear una PSBT de migración sin firmar;
- cambiar descriptor;
- rotar firmantes;
- transmitir una transacción ya verificada y firmada fuera de RootCause.

Prohibidas:

- solicitar semillas;
- firmar en el servidor;
- desbloquear wallet;
- cambiar una política Bitcoin Core para ocultar el síntoma;
- transmitir una transacción de rescate automáticamente;
- borrar evidencia.

## Bitcoin Core

- Preferir cookie auth local.
- Rechazar credenciales dentro de la URL.
- Aplicar timeout, límite de respuesta y validación JSON.
- Usar solo métodos read-only.
- Tratar credenciales RPC como acceso altamente privilegiado.
- Validar eventos ZMQ contra RPC porque ZMQ es no autenticado y puede perder
  mensajes.
- Registrar versión del nodo para controlar cambios de API.

## UX

Construye una interfaz clara en español:

- resumen de riesgo;
- inventario de wallets y firmantes;
- incidentes ordenados por severidad;
- cadena causal visual;
- advisories con fecha y fuente;
- nodo y watchtower;
- runbooks;
- laboratorio regtest;
- límites explícitos.

No muestres una casilla donde el usuario pueda pegar una seed o PSBT completa.

## Desarrollo seguro

- Usa pnpm, nunca npm, si el proyecto usa JavaScript.
- Mantén dependencias al mínimo.
- Aplica NIST SSDF al flujo de desarrollo.
- Aplica NIST SP 800-90B a fuentes de entropía cuando corresponda.
- Genera SBOM y procedencia de artefactos en releases.
- Fija dependencias con lockfile.
- Verifica código, binario y configuración de build.
- Agrega fuzzing en parsers de transacciones, PSBT, descriptors y advisories.
- Usa datos ficticios en tests.
- No realices pruebas sobre mainnet.

## Fases

### Fase 1: exposición y procedencia

- inventario;
- matriz de advisories;
- reglas de firmware;
- single-signature y multisig;
- dashboard;
- evidencia;
- regtest.

### Fase 2: watchtower

- Bitcoin Core RPC;
- ZMQ validado;
- seguimiento de UTXO o descriptors watch-only cifrados;
- aprobación por hash de PSBT;
- gasto desconocido;
- barridos y velocidad.

### Fase 3: cadena de suministro

- SBOM;
- SLSA provenance;
- firma de firmware;
- build reproducible;
- invariantes de compilación;
- pruebas hardware-in-the-loop.

### Fase 4: empresa

- autenticación y RBAC;
- separación de funciones;
- HSM o servicio de firma externo;
- SIEM;
- retención;
- alta disponibilidad;
- cumplimiento y auditoría.

## Criterios de aceptación

- ninguna ruta acepta material secreto;
- no existe método RPC de escritura;
- RPC remoto está deshabilitado por defecto;
- el caso COLDCARD vulnerable crea un incidente crítico;
- una versión corregida no genera ese hallazgo;
- una wallet de alto valor single-signature genera incidente;
- una multisig 2-de-3 con tres fabricantes no genera concentración;
- un gasto sin hash aprobado genera incidente crítico;
- un gasto con hash aprobado no lo genera;
- la auditoría detecta alteraciones;
- la persistencia falla con una clave incorrecta;
- las pruebas funcionan offline;
- el dashboard es responsive;
- la documentación explica límites y runbook;
- no se rompen módulos RootCause existentes.

## Entrega

Al finalizar:

1. resume los cambios;
2. lista archivos principales;
3. informa pruebas ejecutadas y resultado;
4. explica riesgos residuales;
5. indica pasos de integración;
6. no declares producción-ready si faltan autenticación, HSM, auditoría externa
   o revisión criptográfica independiente.
