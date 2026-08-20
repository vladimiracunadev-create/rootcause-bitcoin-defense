# Caso de estudio: COLDCARD 2026

## Estado de esta ficha

Verificada el 20 de agosto de 2026. La investigación y los montos reportados
evolucionaron durante el incidente. Antes de usar los rangos afectados debe
consultarse el aviso vigente del fabricante.

## Qué ocurrió

La falla estaba en la generación de semillas de determinadas versiones de
firmware. Un error de integración y build hizo que una ruta esperada de hardware
RNG terminara usando un generador de software determinista.

Consecuencia:

1. el dispositivo mostró palabras aparentemente normales;
2. la seed continuó funcionando;
3. las direcciones y firmas eran válidas;
4. el espacio real de búsqueda era menor al esperado;
5. atacantes pudieron evaluar candidatos fuera de línea;
6. al encontrar coincidencias on-chain, firmaron gastos válidos.

No fue necesario vulnerar consenso, mineros ni nodos Bitcoin.

## Por qué actualizar no basta

El firmware corregido cambia la generación futura. No puede convertir una
semilla ya creada en otra más aleatoria. Una semilla afectada continúa
controlando exactamente las mismas claves.

La remediación exige:

- crear una semilla nueva bajo un proceso corregido;
- verificar fingerprint y dirección;
- mover fondos;
- retirar la wallet antigua.

## Cadena causal para RootCause

| Capa | Evidencia |
| --- | --- |
| Source | commit, submódulo y configuración de build |
| Binary | hash, firma y procedencia |
| Device | modelo y firmware |
| Key lifecycle | versión usada al crear la semilla |
| Wallet | fingerprint y política |
| Exposure | UTXO controlados |
| Attack | txid y patrón de barrido |
| Response | migración y retiro de firmante |

## Qué habría detectado la aplicación

Si la procedencia estaba inventariada:

- BTC-KEY-001 por firmware afectado;
- BTC-CUSTODY-001 si la wallet era single-signature y de alto valor;
- bloqueo de nuevas direcciones de depósito;
- plan de migración;
- vigilancia de gasto no aprobado;
- evidencia fechada.

Si la procedencia no estaba inventariada:

- BTC-KEY-002;
- necesidad de demostrar firmware de creación;
- migración precautoria si no puede probarse.

## Qué no habría detectado

La aplicación no puede medir retrospectivamente la entropía de una seed a
partir de direcciones o firmas. Una salida seudoaleatoria defectuosa puede tener
apariencia aleatoria.

## Controles de ingeniería derivados

- no fallback silencioso;
- error fatal si falta el hardware RNG;
- comprobación de macro y valor, no solo existencia;
- test del binario enlazado;
- test en dispositivo;
- health tests;
- build reproducible;
- SLSA provenance;
- revisión de límites de librerías y submódulos;
- multisig con implementaciones independientes.

## Fuentes

- Coinkite:
  https://blog.coinkite.com/coldcard-mk3-seed-generation-warning/
- Block Engineering:
  https://engineering.block.xyz/blog/predictable-rng-fallback-and-32-bit-reseed-in-coldcard-firmware
- TRM Labs:
  https://www.trmlabs.com/resources/blog/the-largest-hardware-wallet-exploit-of-2026-inside-the-usd-116-million-coldcard-hack
- NIST SP 800-90B:
  https://csrc.nist.gov/pubs/sp/800/90/b/final
