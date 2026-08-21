# CI/CD en GitHub

Los cinco workflows del repositorio, qué garantiza cada uno y cómo replicarlos en
local. Todos los actions están pinneados a commit SHA, no a etiquetas móviles.

---

## Visión general

| Workflow | Archivo | Dispara | Garantiza |
|---|---|---|---|
| **CI** | `ci.yml` | push a `main`, PR, manual | Que el código funciona en tres sistemas y que las promesas del producto siguen siendo ciertas |
| **CodeQL** | `codeql.yml` | push, PR, lunes 06:17 UTC, manual | Análisis estático de seguridad sobre el código propio |
| **Release Windows** | `release-windows.yml` | tag `v*`, manual | Que el artefacto publicado se instala y arranca de verdad |
| **Auditoría de seguridad** | `security-audit.yml` | push, PR, **lunes**, manual | Que la custodia, el runtime distribuido, los secretos y los workflows siguen sanos |
| **Deploy Landing** | `deploy-landing.yml` | cambios en `landing/` | Publica la landing sin recursos de terceros |

Reglas comunes: `permissions` mínimos, `concurrency` con cancelación, timeouts
explícitos y **cero instalación de dependencias** —no hay registro de paquetes
en juego porque no hay dependencias.

---

## CI — cinco trabajos

### 1. `calidad` — matriz de 6

`{windows, ubuntu, macos} × Node {22, 24}`. Ejecuta `validate-repo.js` y
`node --test`. Windows va primero en la lista porque es el destino principal del
producto.

Node 22.12 es el mínimo que declara `package.json`; Node 24 es la rama actual.
Si algo solo funciona en la máquina de quien programa, aquí se ve.

### 2. `solo-local` — el claim de distribución

Dos redes de seguridad independientes:

- `check-local-only.js`: cero dependencias declaradas, cero árbol instalado,
  ningún import que no sea `node:` o relativo, ninguna referencia remota en el
  panel, CSP `self` intacta.
- Una comprobación aparte con `npm ls --all --json`, que delataría un
  `node_modules` real aunque el script anterior tuviera un fallo.

### 3. `invariantes` — el claim del producto

- `check-security-claims.js`: arranca la aplicación y comprueba sus 20
  invariantes.
- Un `grep` deliberadamente tonto contra métodos RPC de gasto en `src/`. Es
  redundante con la allowlist a propósito: dos mecanismos distintos tienen que
  fallar a la vez para que un método peligroso llegue a `main`.

### 4. `app-windows` — la aplicación, de verdad

En `windows-latest`: genera el icono desde código, empaqueta la edición portable
—descargando el `node.exe` oficial y verificando su SHA-256— y después **ejecuta
el lanzador `.cmd` real**, el mismo que usa una persona, comprobando:

- `/api/health` responde y se identifica;
- el panel contiene el título de la aplicación;
- `/api/summary` devuelve al menos una wallet.

Esa última es la que caza el fallo clásico: aplicación que instala, abre y sale
vacía. El ZIP se sube como artefacto de CI con 7 días de retención.

### 5. `documentacion`

`check-docs.js`: ningún `.md` puede citar una ruta o enlazar un documento que no
existe.

---

## CodeQL

`javascript-typescript` con el conjunto `security-extended`. Corre también los
lunes por la mañana porque las consultas de CodeQL mejoran aunque el código no
cambie.

`init` y `analyze` van pinneados **al mismo SHA**: son el mismo action, y
mezclar versiones lo rompe. Por eso `dependabot.yml` los agrupa.

---

## Release Windows

Se dispara con un tag `v*`. Con `workflow_dispatch` hace todo salvo publicar,
que es como se ensaya un release sin comprometer nada.

Orden de los pasos, y el orden es el argumento:

1. **Las cinco puertas de calidad**, antes de empaquetar nada. Un tag no puede
   publicar un artefacto que no las superó.
2. **Coherencia de versión**: si el tag es `v0.2.0`, `package.json` debe decir
   `0.2.0`. Si no, el workflow se detiene.
3. Icono, edición portable, Inno Setup, instalador.
4. **Instalación silenciosa y arranque de la aplicación instalada**, con la
   misma comprobación de inventario.
5. `SHA256SUMS.txt`.
6. Artefactos del workflow (30 días).
7. `gh release create` — **solo si es un tag**.

No se usa ningún action de terceros para publicar: la release la crea `gh` con
el token del propio workflow. Menos superficie, menos permisos.

---

## Auditoría de seguridad

Seis trabajos, descritos en [`AUDITORIA_CONTINUA.md`](AUDITORIA_CONTINUA.md):
`custodia` (las 14 etapas, con informe como artefacto), `runtime` (avisos del
Node que se distribuye, no el del runner), `secretos` (patrones del dominio más
gitleaks verificado por checksum), `workflows` (zizmor y hadolint),
`inteligencia` (frescura de la matriz de avisos) y `plugin` (que lo distribuido
coincida con lo practicado).

Corre también **los lunes**: un aviso nuevo de Node o de un fabricante no espera
a que alguien haga commit.

## Por qué pinnear a SHA

Una etiqueta como `@v4` es un puntero móvil: quien controla el repositorio del
action puede cambiar a qué apunta. Un SHA es inmutable. El comentario al lado
conserva la legibilidad:

~~~yaml
uses: actions/checkout@08eba0b27e820071cde6df949e0beb9ba4906955 # v4.3.0
~~~

Dependabot propone las subidas semanalmente, agrupadas, y CI las valida antes de
que nadie las mezcle.

---

## Replicar en local

~~~bash
# calidad
node scripts/validate-repo.js && node --test

# solo-local
node scripts/check-local-only.js

# invariantes
node scripts/check-security-claims.js

# documentacion
node scripts/check-docs.js

# los workflows en sí
actionlint .github/workflows/*.yml
~~~

~~~powershell
# app-windows
powershell -File packaging/windows/make-icon.ps1
powershell -File packaging/windows/build-portable.ps1
~~~

---

## Operar los workflows

~~~bash
gh run list --limit 5
gh run view <RUN_ID> --log-failed
gh workflow run release-windows.yml --ref main     # ensayo sin publicar
gh run download <RUN_ID> --dir ./artefactos
~~~

---

## Secretos

**Ninguno.** El repositorio no tiene secretos configurados y los workflows no
piden nada más que el `GITHUB_TOKEN` automático, con `contents: write` solo en
el job que publica el release. Si algún día un workflow necesita un secreto, hay
que justificarlo en la revisión.
