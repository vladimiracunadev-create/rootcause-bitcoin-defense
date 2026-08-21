# ADR-0001 — Plataforma de distribución y lenguaje de implementación

- Estado: aceptado
- Fecha: 20 de agosto de 2026
- Decide: aplicación de escritorio para Windows, escrita hoy en Node.js, con
  criterios explícitos y verificables para migrar a Rust más adelante.

Este documento existe porque las dos preguntas —«¿dónde debe vivir esto?» y
«¿en qué lenguaje?»— tienen respuestas distintas y conviene no mezclarlas.

## Resumen de la decisión

| | |
| --- | --- |
| **Plataforma** | Aplicación de escritorio, empezando por Windows |
| **Descartado** | Despliegue web alojado — no puede leer el nodo local y convierte el inventario en un objetivo |
| **Móvil** | Solo como acompañante de lectura; el trabajo de procedencia es de escritorio |
| **Lenguaje hoy** | JavaScript sobre Node, sin dependencias |
| **Coste asumido** | Cargar con el runtime: ~32 MB y republicar ante cada CVE de Node |
| **Lenguaje probable mañana** | Rust, con cuatro disparadores concretos escritos abajo |
| **Descartado** | Go — no aporta nada que Rust no dé mejor en este dominio |

## 1. Contexto

RootCause Bitcoin Defense no es una wallet. No custodia claves, no firma y no
transmite transacciones. Es una **consola de operador**: inventaría la
procedencia de las claves, la contrasta con avisos publicados, lee un nodo
Bitcoin Core en modo solo lectura y produce incidentes con causa raíz,
evidencia y runbook.

Eso condiciona la plataforma más que ninguna preferencia estética:

1. necesita hablar con `127.0.0.1:8332` (RPC de Bitcoin Core);
2. necesita persistir estado cifrado en el disco del operador;
3. no debe depender de ningún servidor de terceros, ni siquiera del autor;
4. su usuario es alguien sentado frente a un equipo, respondiendo un incidente.

## 2. Decisión de plataforma

### 2.1 Escritorio (Windows): sí, y es la principal

Las cuatro condiciones anteriores describen literalmente una aplicación de
escritorio. El nodo escucha en loopback, y loopback solo es alcanzable desde la
misma máquina. Todo lo demás son rodeos para llegar al mismo sitio con más
superficie de ataque.

Windows primero por dos razones: es donde está el operador al que apunta este
trabajo, y es donde ya vive **RootCause Windows Inspector**, con el que este
módulo comparte destino. El mismo código corre en Linux y macOS sin cambios —el
empaquetado de escritorio es lo único específico de Windows.

### 2.2 Web alojada: no

Esta es la opción que hay que descartar de forma explícita, porque parece
razonable y no lo es:

- Un panel alojado en un dominio **no puede** leer el RPC en `127.0.0.1:8332`
  del usuario. El navegador lo impide, y las formas de saltárselo (un túnel, un
  proxy, abrir el nodo a Internet) son exactamente lo que la documentación de
  Bitcoin Core desaconseja.
- Alojarlo obligaría a que los datos —qué wallets existen, cuánto valor
  controlan, qué firmantes son vulnerables— viajen a un servidor. Ese servidor
  se convierte en un mapa del tesoro y en un objetivo. Hoy no existe ese
  servidor, y esa ausencia es una propiedad de seguridad, no una carencia.
- Una URL pública se puede suplantar, envenenar por DNS o servir modificada. Un
  binario con hash publicado, no.

Lo que sí es correcto —y es lo que hace la aplicación— es **usar tecnología
web como capa de interfaz**: el panel es HTML servido por el propio proceso
local, con CSP `self` y sin un solo origen externo. Web como UI, sí; web como
servicio alojado, no.

### 2.3 Móvil: matiz

La intuición de partida —«el bitcoin no se gestiona en móvil»— es medio cierta.
Sí existen wallets móviles serias y mucha gente las usa. Lo que no encaja en un
teléfono es *este* producto: un inventario de procedencia con runbooks de
migración es trabajo de escritorio, con dos dispositivos delante y una hoja de
cálculo al lado.

El papel razonable del móvil aquí es **acompañante de solo lectura**: recibir
la alerta de un gasto fuera de política y ver el incidente. Eso no exige
reescribir nada, y en el ecosistema ya existe **RootCause Mobile Inspector**
como vehículo natural si algún día se decide.

## 3. Decisión de lenguaje

### 3.1 Lo que hace realmente el código

Servidor HTTP en loopback, JSON, AES-256-GCM con la biblioteca criptográfica de
la plataforma, una cadena de hashes para la auditoría, y un motor de reglas de
unas 300 líneas. **Ninguna primitiva criptográfica está implementada a mano** y
no hay cómputo pesado. Ese perfil no exige un lenguaje de sistemas.

### 3.2 Por qué hoy se queda en Node.js

- Funciona, está probado y se puede empaquetar hoy: 2.400 líneas, cero
  dependencias, 24 pruebas en verde, y una edición de Windows que arranca y
  sirve el panel. Reescribirlo no añadiría una sola capacidad al producto.
- Cero dependencias significa que el argumento habitual contra Node —el árbol
  de `node_modules` como superficie de suministro— aquí no aplica: no hay árbol,
  y hay un test que tumba el build si alguien lo planta.
- El valor de este repositorio está en el conocimiento del dominio (la matriz
  de avisos, las reglas, los runbooks), no en el rendimiento del proceso.

### 3.3 El coste real de esta decisión

Hay que decirlo con todas las letras: empaquetar `node.exe` significa **cargar
con el runtime**. El ZIP pesa ~32 MB en vez de ~5 MB, y cada vulnerabilidad de
Node obliga a publicar una versión nueva de la aplicación aunque el código
propio no haya cambiado. Eso es una obligación de mantenimiento periódica, no
un detalle: está anotada en el runbook de release.

### 3.4 Rust: el destino probable, con disparadores explícitos

Rust es la respuesta correcta *cuando* ocurra alguna de estas cuatro cosas, y no
antes:

1. **Hardware wallets o PSBT.** Si hay que hablar por USB con un firmante (HWI),
   analizar descriptores o manipular PSBT, el ecosistema de Rust
   (`rust-bitcoin`, `miniscript`, BDK) es el más maduro y el más auditado del
   mundo Bitcoin. Ese es el disparador más probable.
2. **Fusión con RootCause Windows Inspector.** Ese producto ya es Rust. Si esto
   deja de ser un módulo aparte y pasa a ser una capacidad suya, se escribe en
   su lenguaje.
3. **Distribución corporativa.** Un único `.exe` firmado, pequeño y sin runtime
   que parchear encaja mucho mejor en despliegues gestionados y en firma de
   código.
4. **Servicio permanente.** Si el watchtower deja de ser un panel abierto y pasa
   a ser un servicio de Windows corriendo siempre, importa la huella de memoria
   y el arranque.

### 3.5 Go: no

Go daría un binario estático y compilación rápida, pero **no aporta nada que
Rust no dé mejor en este dominio concreto**: su ecosistema Bitcoin (`btcsuite`)
está menos orientado a herramienta de wallet y descriptores, y elegirlo
fragmentaría la familia RootCause en cuatro lenguajes (Rust en escritorio, Node
en web, Dart en móvil, Go aquí) sin ninguna ganancia a cambio. Descartado por
coherencia, no por calidad del lenguaje.

## 4. Cómo se migraría sin tirar el trabajo

La migración, si llega, no empieza por el servidor:

1. **La costura es la API HTTP.** `docs/API.md` es el contrato. Mientras se
   respete, el panel actual —HTML, CSS y JS sin dependencias— sigue funcionando
   servido por un binario Rust sin tocar una línea de frontend.
2. **Primero el dominio.** `src/domain/` (reglas, firmware, riesgo, guardia de
   secretos) son funciones puras: se portan y se comparan contra los mismos
   casos.
3. **Las pruebas actuales son la suite de aceptación.** `test/` y
   `scripts/check-security-claims.js` describen el comportamiento observable; el
   binario Rust tiene que superarlos igual, ejecutándose contra su propio
   proceso.
4. **Convivencia posible.** Nada impide que la primera versión Rust reutilice
   este repositorio como especificación ejecutable durante la transición.

## 5. Consecuencias

- Se mantiene Node.js y se invierte en el empaquetado de Windows: instalador por
  usuario, edición portable, verificación de arranque real en CI.
- Se asume la obligación de republicar cuando Node publique parches de
  seguridad.
- Se documentan cuatro disparadores concretos para Rust, de modo que la decisión
  futura sea una comprobación, no una discusión.
- Se descarta explícitamente el despliegue web alojado, y queda por escrito el
  motivo, para que no vuelva a plantearse cada seis meses.
