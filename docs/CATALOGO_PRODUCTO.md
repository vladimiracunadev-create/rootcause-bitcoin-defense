# La familia RootCause

RootCause es una idea aplicada a cuatro superficies distintas: **no basta con
detectar que algo va mal; hay que poder decir por qué**, con evidencia y con un
siguiente paso. Cada edición lleva esa idea a un dominio, con el lenguaje y el
empaquetado que ese dominio pide.

| Edición | Superficie | Lenguaje | Estado |
|---|---|---|---|
| [**Windows Inspector**](https://github.com/vladimiracunadev-create/rootcause-windows-inspector) | Sistema operativo: CPU, disco, red, procesos, autoarranque, servicios | Rust | Publicado |
| [**Web Inspector**](https://github.com/vladimiracunadev-create/rootcause-web-inspector) | Navegador: cookies, sesiones, extensiones, descargas, permisos | JavaScript, cero deps | Publicado |
| [**Mobile Inspector**](https://github.com/vladimiracunadev-create/rootcause-mobile-inspector) | Android e iOS: consumo por app, stalkerware, permisos | Flutter | Publicado |
| **Bitcoin Defense** (este) | Custodia Bitcoin: procedencia de claves, avisos de firmware, gasto fuera de política | JavaScript, cero deps | Publicado |

---

## 🧬 Qué comparten las cuatro

No es una marca común: son decisiones repetidas a propósito.

| Principio | Cómo se concreta aquí |
|---|---|
| **Todo local** | Panel en `127.0.0.1`, sin cuenta ni servidor |
| **Telemetría cero, verificada** | `check-local-only.js` en cada push |
| **Causa raíz, no síntoma** | Cada hallazgo lleva `rootCause` además de `explanation` |
| **Evidencia adjunta** | Cada incidente trae los datos que lo sostienen |
| **Límites declarados** | [`LIMITACIONES.md`](LIMITACIONES.md) y las filas 🔴 de [`DETECCION_AMENAZAS.md`](DETECCION_AMENAZAS.md) |
| **El claim se prueba ejecutando** | 20 invariantes con la aplicación en marcha |

---

## 🎯 Qué hace única a esta edición

Las otras tres observan **lo que está pasando ahora** en un sistema. Esta
observa **de dónde vino una clave**, que es una pregunta sobre el pasado.

El motivo es el dominio: en Bitcoin, cuando el síntoma aparece —el saldo se
movió— ya no hay nada que hacer. Una transacción confirmada es definitiva. La
única defensa útil llega antes, y llega mirando la procedencia.

De ahí tres rasgos que no tienen las hermanas:

- **La ausencia de dato es un hallazgo.** No saber con qué firmware nació una
  clave es en sí mismo el problema (`BTC-KEY-002`).
- **Hay una matriz de avisos con fecha.** El producto depende de conocimiento
  externo publicado por fabricantes, y muestra cuándo se verificó por última vez.
- **Se niega activamente a recibir el dato más valioso.** Las otras ediciones
  leen todo lo que pueden de su superficie; esta rechaza material secreto
  aunque se lo ofrezcan.

---

## 🧭 A quién sirve cada una

| Si eres… | Empieza por |
|---|---|
| Alguien con bitcoin en dispositivos físicos | **Bitcoin Defense** |
| Responsable de tesorería o fondos de terceros | **Bitcoin Defense** + política multisig |
| Alguien con el equipo lento o sospechoso | **Windows Inspector** |
| Preocupado por rastreo y sesiones abiertas | **Web Inspector** |
| Con dudas sobre una app del móvil | **Mobile Inspector** |

Las cuatro se usan por separado. No hay servidor común, ni cuenta compartida, ni
consola central: eso sería precisamente el punto único de fallo que ninguna de
ellas quiere crear.

---

## 🔗 Cómo encaja con el RootCause existente

Este repositorio es un **módulo independiente**, no un reemplazo. No sustituye
el collector, el motor de reglas, el correlador, las evidencias, el notificador
ni la auditoría del producto principal.

El plan de integración —qué se reutiliza, qué se traduce y qué se descarta— está
en [`INTEGRATION-ROOTCAUSE.md`](INTEGRATION-ROOTCAUSE.md), y la decisión de
lenguaje para una eventual fusión, en
[`ADR-0001`](ADR-0001-plataforma-y-lenguaje.md).

---

## 💾 Distribución

| Edición | Cómo se instala |
|---|---|
| Windows Inspector | Instalador, portable, Chocolatey, Scoop, Winget, extensión de VS Code |
| Web Inspector | Panel local + extensión MV3 |
| Mobile Inspector | APK e IPA |
| **Bitcoin Defense** | **Instalador de Windows por usuario, ZIP portable, o desde el código en Windows, Linux y macOS** |

Todas publican `SHA256SUMS.txt`, porque un binario sin hash publicado es un
binario en el que no hay motivo para confiar.
