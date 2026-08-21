# Auditoría continua

Cómo se mantiene el sistema al día cuando nadie está mirando. Tres mecanismos,
en tres velocidades distintas.

| Velocidad | Mecanismo | Qué detecta |
|---|---|---|
| **Inmediata** | Reevaluación automática al cambiar el inventario | Que el cambio que acabas de hacer introdujo un riesgo |
| **Por cambio de código** | Workflows `ci.yml` y `security-audit.yml` en cada push y PR | Que una modificación rompió una promesa del producto |
| **Semanal** | `security-audit.yml` programado los lunes | Que **el mundo** cambió aunque tu repositorio no |

La tercera es la que más se olvida y la que más importa: un aviso nuevo de Node
o de un fabricante de hardware no espera a que alguien haga commit.

---

## ⚡ 1 · Reevaluación inmediata al cambiar

Desde la versión 0.3.0, toda mutación vuelve a disparar el análisis completo
—reglas de wallet, correlaciones, inteligencia y postura— y deja constancia:

| Acción | Qué desencadena |
|---|---|
| Registrar una wallet | Análisis completo + entrada de auditoría `auto_rescan` |
| Observar una transacción | Análisis completo, incluidas correlaciones de barrido y ráfaga |
| Registrar un evento de privacidad | Análisis completo, incluida la correlación con tus fabricantes |
| Aprobar una política | Análisis completo: puede cerrar un `BTC-TX-001` legítimo |

Antes, el panel se quedaba desactualizado hasta que alguien pulsaba *Analizar*.
Un inventario que cambia y un panel que no se entera es un panel que miente
durante ese intervalo.

La entrada `auto_rescan` de la auditoría registra el motivo, cuántos hallazgos
salieron y cuántos incidentes había antes y después. Es lo que permite
reconstruir después **qué sabía la aplicación y cuándo lo supo**.

---

## 🤖 2 · El workflow de auditoría

[`security-audit.yml`](../.github/workflows/security-audit.yml) traslada al CI el
criterio del skill de auditoría en 12 capas, adaptado a un repositorio sin
dependencias.

### `custodia` — las 14 etapas

Ejecuta `node scripts/audit-bitcoin.js --report`, publica el informe como
artefacto con 90 días de retención y lo vuelca al resumen del run. El informe
queda accesible aunque nadie mire los logs.

### `runtime` — la cadena de suministro real

Resuelve **qué versión de Node empaquetaría hoy** el constructor y audita esa,
no la del runner. La distinción importa: el Node del runner no viaja dentro de
ningún artefacto, y suspender el build por él escondería el dato que sí importa.

Es la capa que descubrió, al escribirse, que la versión de desarrollo local
llevaba 25 avisos abiertos mientras la que se distribuye estaba limpia.

### `secretos` — dos escáneres, a propósito

- `check-history-secrets.js`, con patrones del dominio que ninguna herramienta
  genérica conoce: `xprv`, WIF, mnemónicos BIP-39 y la clave de datos del
  producto.
- **gitleaks**, con sus cientos de patrones genéricos, descargado desde el
  binario oficial y **verificado por checksum**: un escáner de secretos que se
  descargara sin verificar sería justo el tipo de cosa que este workflow existe
  para detectar.

### `workflows` — zizmor y hadolint

zizmor busca en YAML lo que un ojo humano no ve: inyección por interpolación de
datos de evento, permisos excesivos, actions sin pinnear. hadolint hace lo propio
con el `Dockerfile`.

### `inteligencia` — la matriz no puede envejecer en silencio

Ejecuta la etapa 2 aislada. Si la matriz de avisos lleva más del plazo sin
verificarse, lo escribe en el resumen del run con la instrucción concreta.

No tumba el build a propósito: **el hallazgo es del producto, no del código**.
Quien abra un PR de documentación no tiene por qué encontrarse un rojo porque
nadie revisó los avisos hace cinco semanas — pero sí tiene que verlo escrito.

### `plugin` — lo que se distribuye es lo que se practica

Comprueba que `plugin/` sigue siendo copia exacta de `.claude/`. Un plugin que
promete algo que el proyecto no practica es peor que no publicarlo.

---

## 🚨 3 · Qué hacer cuando la auditoría avisa

| Aviso | Acción | Plazo |
|---|---|---|
| Etapa **fallida** (`XX`) | Es una promesa rota del producto. Se arregla antes de seguir | Ahora |
| `BTC-INTEL-001` inteligencia vieja | Contrastar los avisos de cada fabricante presente en el inventario y actualizar `verifiedAt` | Esta semana |
| Avisos del runtime distribuido | Republicar con un Node parcheado, siguiendo [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md) | Según severidad |
| Secreto en el histórico | **Rotar**, no borrar. Un secreto commiteado se considera comprometido | Ahora |
| Etapa **omitida** (`..`) | Averiguar por qué no se pudo comprobar. No es un aprobado | Antes del próximo release |

---

## 🗓️ 4 · Actualizar la matriz de avisos

Es la única tarea de mantenimiento que no se puede automatizar hoy, y por eso
tiene su propia regla que la vigila.

1. Para cada fabricante presente en el inventario, abrir su página oficial de
   avisos de seguridad.
2. Para cada aviso ya registrado, confirmar que el rango afectado no cambió.
3. Actualizar `verifiedAt` **solo de lo que realmente contrastaste**.
4. Añadir los avisos nuevos con su rango por modelo y canal.
5. `pnpm check` y commit.

Poner `verifiedAt` sin haber mirado la fuente convierte la regla en un adorno y
el panel en una tranquilidad falsa. Es la forma más fácil de romper este
producto, y no la detecta ninguna herramienta: depende de quien lo mantiene.

---

## 💻 5 · Ejecutarlo todo en local

```bash
# Las cinco puertas de siempre
pnpm check

# Las 14 etapas con informe
node scripts/audit-bitcoin.js --report

# Capas sueltas
node scripts/check-history-secrets.js
node scripts/check-runtime-advisories.js
node scripts/sync-plugin.js --check
```
