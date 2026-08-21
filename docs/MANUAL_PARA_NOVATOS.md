# Manual para quien empieza de cero

Este documento no supone nada. Ni que sabes qué es Bitcoin, ni que has usado una
wallet, ni que te interesa la criptografía. Si alguien te pasó este programa y
no entiendes para qué sirve, empieza aquí.

Se lee en unos quince minutos y al final vas a entender **qué problema resuelve,
qué no resuelve y si te sirve a ti**.

---

## 🔓 1 · La idea de fondo, con una analogía

Imagina una caja fuerte cuya combinación se genera sola, dentro de la caja, la
primera vez que la enciendes. Esa combinación no está escrita en ningún
servidor: existe solo ahí dentro y en un papel que tú guardas.

Bitcoin funciona parecido. Tus fondos no están «en una cuenta»: están asociados
a una clave. **Quien conoce la clave, puede gastar. Quien no, no puede.** No hay
banco al que llamar, no hay «recuperar contraseña», no hay quien revierta una
operación.

Ahora la parte incómoda.

Esa combinación tiene que ser **impredecible**. Si la caja fuerte, por un fallo
de fábrica, eligiera combinaciones entre solo mil posibles en vez de entre
trillones, la caja seguiría pareciendo perfecta: mismo aspecto, mismo peso,
misma puerta blindada. Pero cualquiera con paciencia podría probarlas todas.

**Eso fue exactamente lo que pasó en 2026.** Un fabricante de dispositivos para
guardar bitcoin descubrió que algunas versiones de su programa interno generaban
esas combinaciones con muchísimo menos azar del que debían. Bitcoin no fue
hackeado. Las cajas fuertes tampoco fueron abiertas a la fuerza. Simplemente,
las combinaciones eran adivinables.

Y aquí está el detalle que hace falta un programa entero para resolver:

> **Mirando la caja fuerte por fuera no se ve.** Una combinación débil y una
> fuerte se parecen en todo. La única forma de saberlo es reconstruir el
> historial: qué dispositivo la creó, qué modelo era y qué versión de programa
> tenía **el día que la creó**.

Ese historial se llama **procedencia**. Y llevar la cuenta de la procedencia de
tus claves es, literalmente, lo que hace esta aplicación.

---

## 🎯 2 · Qué hace este programa, en una frase

Anota de dónde vienen tus claves, lo compara con los defectos que los
fabricantes han publicado, y te avisa si alguna nació con un problema conocido
—explicándote por qué y qué hacer.

Nada más. Y, sobre todo, **nada menos**.

---

## 🚫 3 · Qué NO hace (léelo dos veces)

Esta lista importa más que la anterior, porque es donde la gente se hace
ilusiones:

| No hace | Por qué |
|---|---|
| **No guarda tus bitcoins** | No hay fondos dentro. Es una libreta de anotaciones, no un monedero. |
| **No te pide tus palabras secretas** | Y si se las das, las rechaza. Nunca las necesita, así que no las pide. Nadie legítimo lo hace. |
| **No puede firmar ni mover fondos** | No sabe hacerlo. No tiene el código para hacerlo. |
| **No puede cancelar una transacción** | Nadie puede, en ningún programa del mundo. Una vez confirmada, es definitiva. |
| **No adivina si tu clave es débil mirando tu dirección** | Eso es imposible. Necesita que le cuentes de dónde vino la clave. |
| **No manda nada por Internet** | Se ejecuta entero en tu equipo. No hay servidor, no hay cuenta, no hay registro. |

Si buscabas un programa que «recupere» bitcoins perdidos o que «revierta» un
envío, no existe, y quien te diga que sí te está estafando.

---

## 📘 4 · Las cuatro palabras que necesitas

Solo cuatro. El resto está en el [glosario](GLOSARIO.md).

**Clave privada.** El secreto que permite gastar. Como la combinación de la caja.

**Semilla.** El número del que nacen todas tus claves. Suele representarse como
12 o 24 palabras en un papel. Si la semilla es mala, todas las claves que
salieron de ella son malas.

**Firmante.** El aparato o programa que guarda la clave y aprueba los envíos.
Los dispositivos físicos (COLDCARD, Trezor, Ledger…) son firmantes.

**Multisig.** Repartir el control: hacen falta, por ejemplo, 2 firmas de 3
posibles para mover fondos. Si uno falla o te lo roban, no pierdes nada. Es lo
contrario de tener todo bajo una sola clave.

---

## ⚡ 5 · Cómo se usa, sin tecnicismos

1. **Lo abres.** Se abre una ventana negra de texto (es normal, es el programa
   funcionando) y enseguida tu navegador con un panel oscuro.
2. **Arranca en modo demostración.** Trae datos inventados para que trastees sin
   miedo. Nada de lo que hagas se guarda.
3. **Miras el círculo de riesgo.** Es un número del 0 al 100. Rojo alto =
   hay algo grave anotado. Sirve para comparar tu situación de hoy con la de
   dentro de un mes, no para compararte con nadie.
4. **Miras «Incidentes».** Cada línea te dice qué pasa, por qué pasa y qué
   hacer. En español, no en jerga.
5. **Vas a «Laboratorio» y pulsas el botón de simulación.** Verás cómo se
   comporta el programa ante un problema, con datos falsos. Hazlo: entender una
   alerta antes de necesitarla es lo que marca la diferencia.

Cuando quieras registrar tus propias wallets, el programa te va a preguntar
cosas como «¿qué fabricante?», «¿qué modelo?», «¿qué versión tenía cuando
creaste la semilla?».

**Si no lo sabes, responde que no lo sabes.** El programa levantará un aviso
diciendo «procedencia desconocida», y eso es la respuesta correcta, no un
fracaso. Un «no lo sé» anotado vale infinitamente más que un dato inventado, que
te daría una tranquilidad falsa.

Para cerrarlo: cierra la ventana negra. Ya está. No queda nada corriendo.

---

## 🤔 6 · ¿Esto es para mí?

**Te sirve si:**

- guardas bitcoin en uno o varios dispositivos físicos;
- tienes varias wallets y ya no recuerdas cuál se creó con qué;
- administras fondos de otras personas, de una empresa o de una comunidad;
- oíste que hubo un problema con cierto fabricante y no sabes si te afecta.

**No te hace falta si:**

- tienes tu bitcoin en un exchange (ahí las claves las tiene el exchange, con
  todo lo que eso implica);
- tienes una cantidad pequeña en una app de móvil y no te preocupa;
- lo que quieres es comprar, vender o invertir. Esto no hace nada de eso.

---

## 🛡️ 7 · Las tres reglas que valen más que el programa

Si solo te llevas tres cosas de todo este documento, que sean estas:

**1. Nadie legítimo te pedirá jamás tus 12 o 24 palabras.** Ni el soporte del
fabricante, ni una web «oficial», ni un correo urgente, ni este programa. Si
alguien te las pide, es un robo en curso. Sin excepciones.

**2. Actualizar el aparato no arregla una clave que ya nació mal.** Es la parte
que más cuesta aceptar. El programa nuevo generará bien las claves *futuras*; la
que ya tienes siguió naciendo del defecto. Si te afecta, hay que crear una
semilla nueva y mudar los fondos.

**3. Cualquier mudanza de fondos se prueba primero con una cantidad pequeña.**
Siempre. Y se verifica la dirección de destino en la pantalla del propio
dispositivo, no en la del ordenador. La pantalla del ordenador puede mentir; la
del dispositivo es justo para eso.

---

## 🚨 8 · Si algo te pasa de verdad

Si el programa te marca un incidente crítico y no sabes qué hacer, el orden es
este y no otro:

1. **No corras.** Mover fondos con prisa y sin verificar es como se pierden de
   verdad.
2. **Deja de recibir dinero en esa wallet.** No generes direcciones nuevas ahí.
3. **Lee la ficha del incidente.** Trae los pasos concretos del fabricante.
4. **Sigue el runbook de migración** ([`RUNBOOK-MIGRATION.md`](RUNBOOK-MIGRATION.md)):
   crear semilla nueva en un dispositivo sano, verificar en un segundo aparato,
   probar con poco, mover el resto.
5. **Si son fondos que no te puedes permitir perder, busca ayuda profesional.**
   Este programa te dice qué pasa; no sustituye a alguien que sepa acompañarte
   en la mudanza.

---

## 🔍 9 · ¿Y por qué debería fiarme de este programa?

Buena pregunta, y la correcta. Tres respuestas comprobables:

- **El código está publicado entero.** Cualquiera puede leerlo, incluida la
  parte que rechaza material secreto.
- **No tiene dependencias de terceros.** No arrastra código de nadie más, y hay
  una comprobación automática que rompe la compilación si alguien lo intenta.
- **Las promesas se verifican ejecutando el programa, no leyendo el README.**
  En cada cambio, un robot arranca la aplicación y le intenta enviar semillas,
  frases de recuperación y claves privadas. Si alguna vez las aceptara, la
  compilación falla y ese cambio no se publica.

Y la respuesta más honesta de todas: **no te fíes del todo de ningún programa
con tus claves**. Este está diseñado precisamente para no necesitarlas.

---

¿Listo para más? [`MANUAL_USUARIO.md`](MANUAL_USUARIO.md) explica cada pantalla
en detalle, y [`GLOSARIO.md`](GLOSARIO.md) tiene todas las palabras que aquí me
salté a propósito.
