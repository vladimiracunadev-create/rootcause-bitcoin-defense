# Modelo de amenazas

## Activos

- fondos controlados por wallets observadas;
- procedencia de cada semilla;
- fingerprints y composición del quorum;
- descriptores o direcciones futuras;
- políticas de aprobación;
- metadatos de clientes;
- credenciales Bitcoin Core;
- evidencia de incidentes;
- integridad del software RootCause.

## Adversarios

- atacante remoto que reconstruye una clave débil;
- malware en el coordinador;
- operador interno malicioso;
- proveedor comprometido;
- atacante de cadena de suministro;
- fabricante con firmware defectuoso;
- actor que obtiene una sesión RPC;
- atacante físico con información filtrada;
- dependencia o build manipulado.

## Escenarios

| Escenario | Causa | Prevención | Detección | Límite |
| --- | --- | --- | --- | --- |
| Semilla predecible | RNG o build defectuoso | fail-closed, validación de entropía, multisig independiente | matriz firmware y procedencia | una dirección no demuestra su entropía |
| Clave robada | malware, backup o phishing | hardware, separación, quorum | gasto fuera de aprobación | una transacción válida puede confirmarse |
| Proveedor filtra PII | acceso excesivo o brecha | minimización, cifrado, TTL, segregación | acceso masivo y DLP | datos ya exfiltrados no se recuperan |
| RPC comprometido | exposición o credencial | loopback, aislamiento, cookie, allowlist | auditoría y patrón de consultas | la allowlist de aplicación no sustituye SO |
| Build alterado | CI o dependencia | firma, SLSA, reproducibilidad | diferencia de hash y procedencia | código abierto no garantiza seguridad |
| Coordinador cambia destino | malware de interfaz | confirmar salida en hardware | diferencia PSBT/política | el usuario puede aprobar visualmente mal |
| Single-signature | diseño de custodia | multisig independiente | regla de concentración | migración requiere operación segura |
| Eclipse o nodo aislado | peers controlados | diversidad y nodos separados | peers, altura y divergencia | señales no prueban por sí solas un eclipse |

## Ataque COLDCARD como árbol causal

~~~mermaid
flowchart TD
    A["Macro o enlace incorrecto"] --> B["Fallback determinista"]
    B --> C["Entropía efectiva reducida"]
    C --> D["Búsqueda offline de semillas"]
    D --> E["Firma válida del atacante"]
    E --> F["Fondos transferidos"]
~~~

Controles en cada punto:

- A: invariantes de build, CI negativa, revisión de límites y procedencia;
- B: fallo cerrado, hardware-in-the-loop y validación del binario;
- C: registro de procedencia y pruebas conforme a NIST SP 800-90B;
- D: multisig con implementaciones independientes;
- E: política PSBT y separación de funciones;
- F: watchtower, contención y evidencia.

La watchtower actúa demasiado tarde para garantizar recuperación. La defensa
principal debe estar antes de la firma.

## STRIDE resumido

### Suplantación

- header de actor no es autenticación;
- requiere reverse proxy autenticado para multiusuario;
- usa identidad fuerte y MFA fuera del MVP.

### Manipulación

- auditoría encadenada;
- AES-GCM detecta modificación del estado;
- releases deben firmarse;
- falta checkpoint externo en el MVP.

### Repudio

- acciones se registran;
- falta firma individual y tiempo confiable externo;
- no usar para no-repudio regulatorio sin ampliación.

### Divulgación

- no hay secretos por diseño;
- estado cifrado;
- CSP y sin recursos terceros;
- fingerprints siguen siendo información sensible.

### Denegación de servicio

- body limit;
- timeout RPC;
- rate limit;
- serialización de escrituras;
- falta alta disponibilidad en el MVP.

### Elevación de privilegios

- RPC read-only en código;
- proceso sin firma;
- contenedor sin capabilities;
- falta RBAC en el MVP.

## Riesgos residuales

- error en la matriz de advisory;
- información de firmware falsa proporcionada por el operador;
- vulnerabilidad desconocida en otro fabricante;
- compromiso simultáneo de varios firmantes;
- malware que altera lo mostrado en el dispositivo;
- robo físico;
- clave de cifrado RootCause obtenida;
- dependencia futura vulnerable;
- nodo local engañado o aislado;
- falsa sensación de recuperación por monitoreo.

## Decisión de despliegue

El MVP puede usarse para aprendizaje, laboratorio y evaluación local. Antes de
proteger una tesorería real se requieren:

- auditoría independiente;
- autenticación;
- RBAC;
- base de datos y backup cifrado;
- gestión de secretos;
- dos nodos de observación;
- procedimiento humano probado;
- integración con firmantes externos;
- ejercicios de incidente;
- revisión legal y operacional.
