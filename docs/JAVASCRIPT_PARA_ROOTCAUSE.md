# JavaScript para RootCause

Por qué esta edición está escrita en JavaScript sobre Node, sin TypeScript, sin
framework, sin bundler y sin una sola dependencia. Y en qué condiciones esa
decisión dejaría de ser la correcta.

La decisión de plataforma y lenguaje, con sus disparadores de migración, está en
[`ADR-0001`](ADR-0001-plataforma-y-lenguaje.md). Este documento es la parte
práctica: cómo se programa aquí.

---

## Cero dependencias, y por qué no es postureo

En un producto de seguridad para custodia de bitcoin, cada dependencia es una
persona más a la que confías el poder de ejecutar código en la máquina donde
alguien inventaría sus claves. La cadena de suministro de npm ha demostrado
repetidamente lo que eso significa.

Aquí no hay árbol de dependencias. No es una promesa: es una **puerta de
calidad**. `scripts/check-local-only.js` rompe el build si aparece una
dependencia declarada, un `node_modules`, un import que no sea `node:` o
relativo, o una referencia remota en el panel.

Lo que ganamos:

| Ventaja | Concreto |
|---|---|
| Auditoría posible | Todo el código que corre está en este repositorio |
| Sin CVEs heredados | No hay que vigilar 400 paquetes transitivos |
| Instalación instantánea | `git clone` y ejecuta. No hay `npm install` |
| Empaquetado trivial | Copiar `src/` y `config/` junto a `node.exe` |
| Envejecimiento lento | Nada se rompe porque un paquete cambió su API |

Lo que cuesta, dicho sin adornos: escribimos a mano el router HTTP, el límite de
tasa, el parseo de cuerpos y las validaciones. Son unas 400 líneas. A cambio de
no tener supervisión sobre miles ajenas, es un intercambio que compensa **en
este dominio**.

---

## Qué usamos de la plataforma

Node moderno trae de serie casi todo lo que un framework aportaba en 2015:

| Necesidad | Lo que usamos |
|---|---|
| Servidor HTTP | `node:http` |
| Cliente HTTP | `fetch` global |
| Criptografía | `node:crypto` — AES-256-GCM, SHA-256, `randomUUID` |
| Pruebas | `node:test` y `node:assert/strict` |
| Recarga en desarrollo | `node --watch` |
| Comprobación de sintaxis | `node --check` |
| Módulos | ESM nativo (`"type": "module"`) |

Ningún Express, ningún Jest, ningún nodemon, ningún dotenv. No porque sean malos
—no lo son— sino porque aquí no aportan nada que la plataforma no dé ya.

---

## Por qué JavaScript y no TypeScript

Es la pregunta legítima. TypeScript habría dado tipos, y los tipos son buenos.

El motivo es que TypeScript **es una dependencia y un paso de compilación**. Con
él, el código que se publica no es el código que se lee: hay una transformación
en medio. En un producto cuyo argumento entero es «puedes auditar exactamente lo
que se ejecuta», esa transformación tiene un coste conceptual que aquí no
compensa: son 2.500 líneas, no 250.000.

Cómo se compensa la falta de tipos:

- **Validación explícita en la frontera.** Todo lo que entra por HTTP pasa por
  `normalizeWallet`, `enumValue`, `integer` y el guardia de secretos. Los tipos
  no habrían protegido de una petición malformada; la validación sí.
- **Objetos congelados.** La configuración se devuelve con `Object.freeze`.
- **24 pruebas** sobre el comportamiento observable.
- **JSDoc donde el tipo no es evidente** por el nombre.

Si el proyecto creciera un orden de magnitud, la respuesta correcta no sería
TypeScript: sería Rust, y está argumentado en el ADR.

---

## El panel, sin framework

`src/web/static/` son cinco archivos: HTML, CSS, un JS, un manifiesto y un
service worker. Sin React, sin bundler, sin transpilación.

Es viable porque el panel **no tiene lógica de decisión**: todas las reglas
viven en el servidor y el panel pinta lo que `/api/summary` le da. Un frontend
que solo renderiza no necesita un framework para gestionar estado que no posee.

Además hay una razón de seguridad: la CSP es `self` estricta, sin
`unsafe-inline` ni `unsafe-eval`. Muchas configuraciones de framework empujan a
relajarla, y esa relajación es exactamente lo que no queremos en la pantalla que
muestra el inventario de wallets de alguien.

---

## Convenciones del código

| Convención | Motivo |
|---|---|
| ESM en todas partes, imports `node:` explícitos | Que se vea de un vistazo qué toca la plataforma |
| Un módulo, una responsabilidad: `domain/`, `infrastructure/`, `services/`, `api/` | El dominio no sabe de HTTP ni de disco |
| Funciones puras en `domain/` | Se prueban sin montar nada, y son lo primero que se portaría a Rust |
| Errores con `statusCode` y `code` | La capa HTTP traduce sin conocer el dominio |
| Sin abreviaturas en los nombres | `firmwareAtSeedCreation`, no `fwSeed` |
| Comentarios que explican **por qué**, nunca **qué** | El qué ya lo dice el código |
| Nada de `console.log` suelto | Los logs son JSON de una línea con `event` |

---

## Cómo añadir código sin romper el claim

1. ¿Necesitas una biblioteca? Casi siempre la respuesta es `node:` algo. Si de
   verdad no la hay, la conversación es sobre el diseño, no sobre la
   dependencia.
2. ¿Tocas la frontera HTTP? Valida antes de usar y deja que el guardia de
   secretos vea el cuerpo entero.
3. ¿Añades una regla? Dos pruebas: la que activa y la que no.
4. ¿Cambias una promesa pública? Actualiza `check-security-claims.js` **antes**
   que el README.
5. `pnpm check` en verde antes de subir.

---

## Cuándo este documento quedará obsoleto

Cuando ocurra alguno de los cuatro disparadores del ADR: hardware wallets por
USB, PSBT y descriptores, fusión con la edición Windows, o distribución
corporativa con binario firmado. Ese día la respuesta correcta será Rust, y la
costura para migrar sin tirar el trabajo ya está preparada: el contrato HTTP de
[`API.md`](API.md), el dominio como funciones puras y las pruebas actuales como
suite de aceptación.

Hasta entonces, JavaScript sin dependencias es lo que permite que este
repositorio se lea entero en una tarde. Para un producto de seguridad, esa
propiedad vale más que cualquier azúcar sintáctica.
