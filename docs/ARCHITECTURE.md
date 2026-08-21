# Arquitectura

## Propósito

RootCause Bitcoin Defense es un plano de observación y decisión. No es una
wallet, un firmante, un exchange ni un explorador público.

Su responsabilidad termina en:

- recibir metadatos públicos y telemetría;
- normalizar;
- evaluar reglas deterministas;
- correlacionar causas;
- preservar evidencia;
- proponer una respuesta segura;
- denegar autorizaciones internas cuando la arquitectura lo permita.

## Contexto

~~~mermaid
flowchart TD
    A["Firmantes y firmware"] --> D["RootCause Bitcoin Domain"]
    B["Bitcoin Core"] --> D
    C["CI, proveedores y advisories"] --> D
    D --> E["Incidentes y evidencia"]
    E --> F["Operador y sistemas de respuesta"]
~~~

## Límites de confianza

Cuatro dominios, y la frontera entre ellos es lo que define el producto:

| Dominio | Contiene | Qué cruza la frontera hacia RootCause |
| --- | --- | --- |
| 1 · Firmantes | Semillas y claves privadas | Solo metadatos públicos: huella, fabricante, modelo, firmware al crear la semilla, procedencia |
| 2 · Bitcoin Core | La verdad sobre la cadena | Respuestas de 11 métodos RPC de lectura, por loopback |
| 3 · RootCause | Inventario, reglas, incidentes, evidencia | Nada sale: el panel se sirve en 127.0.0.1 |
| 4 · Proveedores y avisos | Datos de fabricantes y terceros | Entradas versionadas y fechadas en `config/advisories.json` |

> **La frontera del dominio 1 es de una sola dirección.** RootCause nunca entra:
> recibe metadatos y confirmaciones de operaciones hechas en el dispositivo.

### Dominio 1: firmantes

Contiene semillas y claves. RootCause no entra en este dominio. Recibe solo:

- fingerprint;
- fabricante y modelo;
- versión usada al crear la semilla;
- fecha y procedencia;
- confirmación de una operación realizada en el dispositivo.

### Dominio 2: nodo Bitcoin

Bitcoin Core valida blockchain y mempool. RootCause usa RPC de lectura local.
Las credenciales RPC se consideran altamente privilegiadas aunque la aplicación
use una allowlist.

### Dominio 3: RootCause

Contiene metadatos que revelan la postura de custodia. Debe ejecutarse localmente
o en una red privada, con cifrado y auditoría.

### Dominio 4: proveedores y fuentes externas

Los avisos externos no se consideran confiables por defecto. Deben:

- proceder de una fuente oficial;
- tener fecha;
- conservar URL;
- pasar revisión;
- transformarse a una matriz versionada;
- incluir pruebas de límites.

## Componentes

### API y dashboard

Un servidor HTTP local entrega:

- dashboard responsive;
- PWA;
- API JSON;
- controles de origen;
- límite de body;
- rate limit;
- encabezados de seguridad.

No hay recursos externos, trackers ni CDN.

### DefenseService

Orquesta:

- registro de wallet;
- ejecución de scan;
- snapshot Bitcoin Core;
- aprobación de hash;
- observación de transacciones;
- estado de incidentes;
- auditoría.

Las escrituras se serializan para evitar pérdida de actualizaciones en el store
local.

### Motor de reglas

Las reglas son funciones puras. Producen:

- código;
- severidad;
- entidad;
- explicación;
- causa raíz;
- evidencia redactada;
- remediación.

El identificador del hallazgo se deriva de regla, entidad y discriminador. Esto
permite mantener firstSeen, lastSeen y estado a través de scans.

### Firmware matcher

Normaliza versiones simples y sufijos de fabricante. La matriz define:

- fabricante;
- modelos;
- canal;
- mínimo y máximo inclusivo o exclusivo.

No intenta adivinar versiones no documentadas.

### BitcoinRpcClient

Responsabilidades:

- validar esquema y host;
- negar RPC remoto por defecto;
- cargar cookie o credenciales separadas de la URL;
- bloquear métodos no incluidos;
- aplicar timeout;
- limitar respuesta;
- normalizar el snapshot.

### Store

Modo demo:

- MemoryStore;
- datos ficticios;
- sin persistencia.

Modo persistente:

- JSON cifrado AES-256-GCM;
- IV nuevo por escritura;
- archivo temporal y rename atómico;
- permisos restrictivos;
- clave solo en entorno o gestor de secretos.

El store es apropiado para una instancia local. Una implementación empresarial
debe reemplazarlo por una base de datos transaccional y un gestor de claves.

### Auditoría

Cada entrada incluye el hash anterior. Una alteración rompe la verificación de
la cadena. Esto ofrece detección local de manipulación, no no-repudio externo.
Una instalación empresarial debe enviar checkpoints firmados a un destino
separado.

## Flujo de análisis

~~~mermaid
sequenceDiagram
    participant O as Operador
    participant R as RootCause
    participant N as Bitcoin Core
    participant E as Motor
    O->>R: Ejecutar análisis
    R->>N: Consultas RPC read-only
    N-->>R: Cadena, peers y mempool
    R->>E: Estado normalizado
    E-->>R: Hallazgos causales
    R-->>O: Incidente, evidencia y runbook
~~~

## Datos

Wallet:

~~~json
{
  "id": "uuid",
  "name": "Tesorería",
  "fingerprint": "D15EA5ED",
  "network": "signet",
  "walletType": "multisig",
  "balanceSats": 25000000,
  "quorum": {
    "required": 2,
    "total": 3,
    "independentVendors": 3
  },
  "signers": []
}
~~~

El modelo no contiene un lugar para secretos.

## Evolución prevista

1. Extraer contracts del dominio para integrarlos al RootCause real.
2. Reemplazar polling por una combinación RPC y ZMQ validada.
3. Agregar seguimiento watch-only cifrado por descriptor.
4. Ingerir advisories firmados y revisados.
5. Integrar un servicio de políticas separado del firmante.
6. Agregar autenticación, RBAC y separación de funciones.
7. Firmar checkpoints de auditoría.
8. Incorporar Lightning como pack separado.
