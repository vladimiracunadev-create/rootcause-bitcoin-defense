# Licencia y decisión

Este repositorio se publica bajo **licencia MIT** ([`../LICENSE`](../LICENSE)).
Aquí queda por qué, qué te permite exactamente y qué no deberías deducir de ella.

---

## Qué te permite MIT

Casi todo, y en una frase: **puedes usar, copiar, modificar, integrar y
redistribuir este código, incluso comercialmente, siempre que conserves el aviso
de copyright y la nota de licencia.**

| Puedes | Sin pedir permiso |
|---|---|
| Usarlo en tu empresa | Sí |
| Modificarlo | Sí |
| Redistribuirlo | Sí, con el aviso de copyright |
| Integrarlo en un producto cerrado | Sí |
| Venderlo | Sí |
| Publicar un fork | Sí |

| No puedes | Motivo |
|---|---|
| Quitar el aviso de copyright | Es la única obligación de MIT |
| Reclamar garantías | Se entrega «tal cual», sin garantía de ningún tipo |
| Usar el nombre para dar a entender respaldo | No es una marca cedida |

---

## Por qué MIT y no otra

**Frente a Apache 2.0** (la que usa la edición Web): Apache añade una concesión
expresa de patentes y una cláusula de defensa, cosa valiosa en un producto con
algoritmos propios. Aquí no hay nada patentable: el valor está en el
conocimiento del dominio —qué avisos existen, qué reglas importan, qué runbook
seguir— y ese conocimiento se comparte mejor cuanto menos fricción tenga.

**Frente a GPL:** una licencia copyleft impediría que este módulo se integrara
en herramientas de custodia propietarias. Dado que el objetivo es que la
comprobación de procedencia acabe **dentro** de las herramientas que la gente ya
usa, imponer copyleft trabajaría en contra del propósito.

**Frente a no publicar:** un producto de seguridad que pide confianza y no
enseña el código pide algo que no ha ganado. Todo el argumento de este
repositorio —«no acepto tus claves y aquí está la prueba»— se derrumba si el
código no se puede leer.

MIT es, sencillamente, la licencia con menos fricción para que alguien copie las
reglas y las meta en su propia herramienta. Eso es un éxito, no una pérdida.

---

## Qué NO garantiza la licencia

Conviene subrayarlo, porque en seguridad se confunde:

- **No garantiza que el software sea correcto.** MIT lo dice con todas las
  letras: sin garantía, expresa o implícita.
- **No garantiza idoneidad para custodiar valor.** Lee
  [`LIMITACIONES.md`](LIMITACIONES.md) antes de apoyarte en esta aplicación para
  decisiones sobre fondos reales.
- **No transfiere responsabilidad.** Si pierdes fondos, la licencia excluye
  expresamente la responsabilidad del autor. Y con razón: esta aplicación no
  toca tus fondos.
- **No es asesoría.** Ni financiera, ni legal, ni de inversión.

---

## Si haces un fork

Bienvenido, y dos peticiones que no son obligaciones legales sino de higiene:

1. **Conserva o elimina, pero no debilites, las puertas de calidad.** Si tu fork
   mantiene el discurso de «nunca acepta material secreto», mantén también
   `check-security-claims.js`. Un claim sin su verificación es marketing.
2. **Cambia el nombre y el icono** si el comportamiento difiere. Que alguien
   descargue algo llamado RootCause Bitcoin Defense y obtenga otra cosa es un
   problema de seguridad, no de marca.

Y una advertencia práctica: si tu fork **sí** maneja claves privadas, has
cambiado el modelo de amenazas por completo. Reescribe
[`THREAT_MODEL.md`](THREAT_MODEL.md) antes que el código.

---

## Contribuir

Las condiciones están en [`../CONTRIBUTING.md`](../CONTRIBUTING.md). No hay CLA:
al enviar un PR, contribuyes bajo la misma licencia MIT del proyecto.

Lo único innegociable: **ninguna contribución puede introducir la capacidad de
recibir, almacenar, derivar o usar material secreto**, ni una dependencia de
terceros. Las dos cosas tienen su puerta automática, así que la discusión la
zanja el CI y no una opinión.

---

## Dependencias de terceros

Ninguna. No hay licencias de terceros que auditar, ni avisos que reproducir, ni
árbol de dependencias que revisar antes de integrar esto en un producto
comercial.

El único componente ajeno que se distribuye es el **motor Node.js** dentro de la
aplicación de Windows, bajo su propia licencia (MIT, con los avisos de OpenSSL,
V8 y demás que el propio Node incluye). Va sin modificar y verificado por
SHA-256 contra el archivo oficial: la versión exacta y su hash quedan escritos en
`BUILD-INFO.json` dentro del paquete.
