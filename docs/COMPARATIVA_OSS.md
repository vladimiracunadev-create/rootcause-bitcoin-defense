# Comparativa con herramientas existentes

Dónde encaja este producto entre lo que ya existe, y —más útil— **qué usar en su
lugar** cuando lo que necesitas es otra cosa.

Ninguna de las herramientas mencionadas es competencia en sentido estricto:
resuelven problemas vecinos. Este documento existe para que nadie use esta
aplicación esperando lo que otra hace mejor.

---

## El hueco que ocupa

| Pregunta | Quién la responde bien hoy |
|---|---|
| ¿Cuánto tengo y dónde? | Sparrow, Specter, BlueWallet, cualquier wallet |
| ¿Es válida esta transacción? | Bitcoin Core |
| ¿Puedo firmar con mi dispositivo? | HWI, Sparrow |
| ¿Mi política multisig está bien formada? | Sparrow, Caravan |
| ¿Alguien está gastando ahora mismo? | Watchtowers de Lightning, alertas de exchange |
| **¿De dónde vino esta clave y nació con un defecto publicado?** | **Este producto** |
| **¿Puedo demostrar la procedencia de mis claves ante un incidente?** | **Este producto** |

Las dos últimas se responden hoy con una hoja de cálculo y buena memoria. Eso es
exactamente lo que falla el día que un fabricante publica un aviso y hay que
saber, deprisa, a cuáles de tus wallets afecta.

---

## Comparativa directa

| Herramienta | Qué hace | Qué NO cubre de lo que este producto hace |
|---|---|---|
| **Sparrow Wallet** | Wallet de escritorio excelente: descriptores, multisig, coin control, hardware | No inventaría procedencia histórica de la semilla ni la contrasta con avisos publicados |
| **Specter Desktop** | Coordinación multisig sobre Bitcoin Core | Igual: gestiona la política actual, no el historial de fabricación de la clave |
| **HWI** | Habla con dispositivos firmantes | Es una capa de transporte, no un motor de reglas |
| **Caravan** | Multisig en el navegador | No hay inventario histórico ni incidentes |
| **Bitcoin Core** | El nodo. La verdad sobre la cadena | No sabe nada de firmware ni de fabricantes |
| **Mempool / exploradores** | Estado de la red y de las transacciones | Datos públicos de cadena; nada sobre procedencia |
| **BTCPay Server** | Pagos y facturación | Dominio distinto |
| **Wazuh, OSSEC, EDR** | Seguridad del sistema operativo | No entienden de custodia Bitcoin |

---

## Lo que estas herramientas hacen mejor

Y por tanto lo que **no** deberías pedirle a esta aplicación:

- **Sparrow** para operar de verdad: construir transacciones, firmar con
  hardware, gestionar UTXO y descriptores. Es la herramienta correcta para
  ejecutar la migración que este producto te dice que hace falta.
- **Bitcoin Core** como fuente de verdad. Esta aplicación solo lo lee, y con
  catorce métodos.
- **Specter o Caravan** para diseñar y coordinar un multisig.
- **HWI** para cualquier cosa que implique tocar un dispositivo por USB.

La combinación natural es: **este producto detecta y explica → Sparrow ejecuta →
el dispositivo verifica**. Ninguna de las tres piezas debería intentar ser las
otras dos.

---

## Comparado con las alternativas caseras

Es la comparación sincera, porque es contra lo que se usa de verdad:

| Alternativa | Problema |
|---|---|
| **Hoja de cálculo con las wallets** | No sabe comparar versiones de firmware con rangos por modelo y canal, no deja rastro auditable y nadie la revisa cuando sale un aviso |
| **«Me acuerdo de memoria»** | Falla justo el día que importa, que es el día con prisa |
| **Alertas del exchange** | Solo ven lo que está en el exchange |
| **Confiar en el correo del fabricante** | Llega a la dirección que diste al comprar, que puede ser la misma que se filtró en el incidente logístico |

---

## Por qué no es un fork de nada

No reutiliza el código de ninguna wallet porque **el problema es distinto**: las
wallets existen para gastar y esta aplicación existe para no poder gastar. Una
wallet debe manejar claves; aquí manejarlas sería un defecto.

Compartir base de código habría significado arrastrar la capacidad de firmar
—código muerto que un error o un cambio futuro podría despertar—. La ausencia
total de esa capacidad es más fácil de auditar que su desactivación.

---

## Dónde este producto es honestamente peor

Para que la comparación valga:

- **No opera.** No firma, no construye, no mueve. Cuando termina su trabajo,
  necesitas otra herramienta.
- **Los datos los escribes tú.** Sparrow deriva los saldos de la cadena; aquí el
  saldo es un dato declarado.
- **Cobertura de avisos mínima.** Dos avisos verificados frente a la historia
  completa de la industria.
- **Comunidad de uno.** Sparrow, Core y HWI llevan años de revisión de mucha
  gente. Este repositorio no.

Eso último es la razón de que todas las promesas del proyecto sean
comprobaciones ejecutables y no afirmaciones: no puedo pedirte confianza por
reputación, así que la pido por verificación.
