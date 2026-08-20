# Detección de amenazas: mapa honesto

Qué amenazas cubre este producto, cuáles cubre a medias y cuáles quedan
totalmente fuera. El objetivo del documento es que nadie confunda «el panel está
verde» con «estoy a salvo».

El modelo formal de adversarios está en [`THREAT_MODEL.md`](THREAT_MODEL.md);
esto es su versión operativa.

---

## La tesis del producto

La mayoría de las herramientas de seguridad Bitcoin vigilan **el movimiento**:
alertan cuando algo se mueve. Este producto vigila **el origen**: si una clave
nació de un proceso defectuoso, el robo ya es posible aunque todavía no haya
ocurrido, y esperar al movimiento es esperar demasiado.

De ahí que la unidad de análisis sea la procedencia de la clave y no la
transacción.

---

## Cobertura por amenaza

| Amenaza | Cobertura | Cómo |
|---|---|---|
| **Semilla generada con firmware defectuoso** | 🟢 Completa | `BTC-KEY-001` contra la matriz de avisos, con rangos por modelo y canal |
| **Procedencia de clave no demostrable** | 🟢 Completa | `BTC-KEY-002`, `BTC-KEY-003`: la ausencia de dato es un hallazgo |
| **Concentración de valor bajo una sola clave** | 🟢 Completa | `BTC-CUSTODY-001` sobre umbral configurable |
| **Multisig que no protege (mismo fabricante y firmware)** | 🟢 Completa | `BTC-CUSTODY-002` cuenta fabricantes independientes |
| **Gasto no autorizado desde wallet vigilada** | 🟡 Parcial | `BTC-TX-001` compara contra aprobaciones registradas; depende de que el operador registre las legítimas |
| **Observación degradada (nodo caído, aislado o atrasado)** | 🟢 Completa | `BTC-NODE-001` a `004` |
| **Exposición de datos personales del ecosistema de custodia** | 🟡 Parcial | `BTC-PRIVACY-001` sobre eventos que le entregas; no descubre filtraciones por su cuenta |
| **Phishing dirigido tras una filtración** | 🟡 Contexto | Levanta el aviso y explica el riesgo; no puede bloquear correos |
| **Manipulación del propio registro de incidentes** | 🟢 Completa | Auditoría hash-chain: alterar el pasado rompe la cadena |
| **Robo de la semilla por engaño al usuario** | 🔴 Fuera | Ningún panel local puede impedirlo. Solo mitiga no pidiéndola nunca |
| **Malware en el equipo del operador** | 🔴 Fuera | Si el equipo está comprometido, todo lo que ve el operador es dudoso |
| **Compromiso del dispositivo firmante en fábrica** | 🔴 Fuera | Requiere verificación física y de suministro |
| **Análisis de cadena / desanonimización** | 🔴 Fuera | Decisión de alcance |
| **Nonces débiles en firmas ya publicadas** | 🔴 Fuera | Exigiría análisis criptográfico de transacciones históricas |

🟢 cubierto · 🟡 parcial, con condiciones · 🔴 fuera de alcance

---

## Los dos casos reales que modelaron el producto

### COLDCARD, julio de 2026 — defecto de entropía

Firmware con repliegue de RNG que generaba semillas con mucha menos entropía de
la esperada. **Bitcoin no fue vulnerado**: los atacantes reconstruyeron claves y
firmaron transacciones perfectamente válidas.

Lo que este producto habría dicho, con solo tener el inventario de procedencia
al día: un `BTC-KEY-001` crítico por cada firmante en rango, con el aviso
citado, la evidencia del firmware y la remediación oficial. Y lo habría dicho
**antes** de que se moviera ni un satoshi.

Análisis completo: [`INCIDENT-COLDCARD-2026.md`](INCIDENT-COLDCARD-2026.md).

### Trezor, agosto de 2026 — filtración logística

Un proveedor externo expuso datos de pedidos. Ni una clave comprometida, y aun
así el riesgo de sus usuarios subió: con nombre, teléfono y dirección, el
phishing pasa a ser creíble y dirigido.

Es la razón de que exista `BTC-PRIVACY-001` en un producto de custodia: **la
superficie de ataque de una wallet incluye a las personas que la usan.**

---

## Cómo se decide que algo es un hallazgo

Tres condiciones, y las tres a la vez:

1. **Es comprobable con datos públicos.** Nada que exija material secreto.
2. **Tiene causa raíz nombrable.** Si solo se puede describir el síntoma, no es
   un hallazgo: es una anécdota.
3. **Tiene remediación accionable.** Preferiblemente la del fabricante. Una
   alerta sin siguiente paso es ruido que entrena al operador a ignorar
   alertas.

Cualquier regla que no cumpla las tres no entra. Está en
[`HEURISTICAS.md`](HEURISTICAS.md), junto con el procedimiento para añadirlas.

---

## Falsos positivos que vas a ver, y por qué se aceptan

| Caso | Por qué la regla salta igual |
|---|---|
| Gasto legítimo que nadie registró (`BTC-TX-001`) | Preferimos preguntar por un gasto legítimo que callar ante uno que no lo es. La corrección es registrar la aprobación, no silenciar la regla |
| Firmware desconocido en una wallet vieja (`BTC-KEY-002`) | No poder demostrar la procedencia **es** el problema, aunque la clave esté sana |
| Single-sig por debajo de tu tolerancia real (`BTC-CUSTODY-001`) | El umbral es tuyo: súbelo de forma explícita en vez de convivir con un rojo que dejas de mirar |

---

## Los falsos negativos que debes asumir

Más importante todavía. El panel puede estar verde y existir un problema si:

- la matriz de avisos está desactualizada (mira `verifiedAt` de cada aviso);
- la procedencia que registraste es incorrecta —la aplicación no puede
  verificarla, confía en lo que le cuentas;
- la amenaza cae en cualquiera de las filas 🔴 de la tabla de arriba;
- el nodo lleva días caído y la vigilancia de gastos está ciega.

Un verde de este producto significa exactamente esto: **«ninguna de mis once
reglas se activó con los datos que me diste y los avisos que conozco»**. Ni una
palabra más.
