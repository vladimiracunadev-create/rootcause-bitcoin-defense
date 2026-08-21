# Roadmap — estado actual y evolución prevista

| Versión | Foco | Estado |
| --- | --- | --- |
| 0.1 | Referencia funcional: panel, reglas, RPC de lectura, cifrado | 🟢 Publicada |
| 0.2 | Aplicación de escritorio para Windows y puertas de calidad ejecutables | 🟢 Publicada |
| 0.3 | Auditoría en cuatro niveles, postura del despliegue y más detección | 🟢 Publicada |
| 0.4 | Watchtower real: descriptores, UTXO, ZMQ, reorgs | ⚪ Prevista |
| 0.5 | Cadena de suministro: avisos firmados, SBOM, build reproducible | ⚪ Prevista |
| 1.0 | Uso empresarial: multiusuario, integración con el stack RootCause | ⚪ Prevista |

> **Las casillas de abajo son el detalle histórico.** La numeración original
> (0.1 a 1.0) se conserva tal cual se planificó; la tabla de arriba refleja
> dónde está realmente el producto hoy.

## 0.1 - Referencia funcional

- [x] dashboard;
- [x] inventario público;
- [x] reglas COLDCARD;
- [x] single-signature y multisig;
- [x] RPC read-only;
- [x] gasto no aprobado;
- [x] persistencia cifrada;
- [x] auditoría;
- [x] PWA;
- [x] tests.

## 0.2 - Watchtower real

- [ ] descriptors watch-only cifrados;
- [ ] seguimiento de UTXO;
- [ ] ZMQ sequence con validación RPC;
- [ ] reorg y reemplazos;
- [ ] comparación entre dos nodos;
- [ ] baselines de barrido y velocidad;
- [ ] simulador regtest automatizado.

## 0.3 - Cadena de suministro

- [ ] ingestor de advisories firmado;
- [ ] SBOM;
- [ ] SLSA provenance;
- [ ] verificación de firma de firmware;
- [ ] build reproducible;
- [ ] invariantes de compilación;
- [ ] hardware-in-the-loop;
- [ ] fuzzing.

## 0.4 - Integración RootCause

- [ ] adapter conforme al stack real;
- [ ] rule pack;
- [ ] evidence bundle;
- [ ] safe actions;
- [ ] notificaciones;
- [ ] IA opcional;
- [ ] panel unificado.

## 1.0 - Uso empresarial

- [ ] autenticación;
- [ ] RBAC;
- [ ] separación de funciones;
- [ ] base de datos transaccional;
- [ ] KMS/HSM;
- [ ] alta disponibilidad;
- [ ] SIEM;
- [ ] auditoría externa;
- [ ] ejercicios y revisión independiente;
- [ ] documentación operativa.

## Dominios posteriores

- Lightning Network;
- custodios y exchanges;
- tesorería corporativa;
- stablecoins como dominio separado;
- activos digitales bancarios;
- análisis de cadena de suministro de hardware.
