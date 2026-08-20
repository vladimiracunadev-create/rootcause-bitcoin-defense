# Checklist de release

Cada paso con su comando de verificación. La regla que gobierna el documento:
**nada se da por hecho sin una salida de comando que lo demuestre.**

---

## 0. Antes de empezar

~~~bash
git status                    # el árbol debe estar limpio
git log --oneline -3
gh run list --branch main --limit 3
~~~

El último run de `main` debe ser `success`. Si está en rojo, no hay release: se
arregla el CI primero.

---

## 1. Versión coherente en los tres sitios

| Sitio | Comando |
|---|---|
| `package.json` | `node -p "require('./package.json').version"` |
| `/api/health` | `grep -n 'version:' src/api/router.js` |
| `CHANGELOG.md` | `head -5 CHANGELOG.md` |

Los dos primeros los compara `validate-repo.js` automáticamente y el workflow
compara además con el tag. El tercero es humano: **si el CHANGELOG no describe
lo que cambió, el release no está listo**, aunque compile.

~~~bash
node scripts/validate-repo.js
~~~

---

## 2. Las cinco puertas, en local

~~~bash
pnpm check
~~~

Salida esperada, en este orden:

~~~text
Repository validation passed for NN files.
Claim solo-local verificado: cero dependencias, cero orígenes remotos.
Documentacion coherente: NN referencias verificadas en NN documentos.
ℹ pass 24
Invariantes de seguridad verificados: 20 comprobaciones.
~~~

---

## 3. Empaquetar y probar en local (opcional pero recomendable)

~~~powershell
powershell -File packaging/windows/make-icon.ps1
powershell -File packaging/windows/build-portable.ps1
~~~

El empaquetador arranca la aplicación con el `node.exe` empaquetado antes de
comprimir. Después, pruébala como la probaría una persona:

~~~powershell
& "build\portable\RootCause-Bitcoin-Defense\RootCause Bitcoin Defense.cmd"
~~~

Debe abrirse el navegador con el panel y datos de demostración.

---

## 4. Ensayo completo en CI, sin publicar

~~~bash
gh workflow run release-windows.yml --ref main
gh run list --workflow release-windows.yml --limit 1
~~~

Espera a que termine y **lee la evidencia**, no solo el color:

~~~bash
gh run view <RUN_ID> --log | grep -E "SHA-256 OK|instalada y funcionando"
~~~

Debe aparecer el hash verificado del runtime y una línea como
`instalada y funcionando: 2 wallets, riesgo 100`. Si no aparece, la aplicación
instalada no arrancó con inventario y **no hay release**.

---

## 5. Crear el tag

~~~bash
git tag v0.2.0
git push origin v0.2.0
~~~

El tag debe coincidir con `package.json`; si no, el workflow se detiene solo.

---

## 6. Verificar la publicación

~~~bash
gh run list --workflow release-windows.yml --limit 1
gh release view v0.2.0
gh release view v0.2.0 --json assets --jq '.assets[] | "\(.name)  \(.size)"'
~~~

Deben existir exactamente tres activos:

| Activo | Tamaño aproximado |
|---|---|
| `RootCause-Bitcoin-Defense-0.2.0-win-x64-portable.zip` | ~32 MB |
| `RootCause-Bitcoin-Defense-0.2.0-win-x64-setup.exe` | ~22 MB |
| `SHA256SUMS.txt` | unos cientos de bytes |

Un activo de tamaño sospechosamente pequeño es la señal clásica de un paquete
sin contenido.

---

## 7. Verificar la descarga como lo haría un usuario

~~~powershell
gh release download v0.2.0 --dir .\verificacion
cd .\verificacion
Get-FileHash .\RootCause-Bitcoin-Defense-0.2.0-win-x64-setup.exe -Algorithm SHA256
Get-Content .\SHA256SUMS.txt
~~~

Los hashes deben coincidir carácter a carácter. Después, instala y abre la
aplicación de verdad al menos una vez. **Este paso no se salta**: es el único
que prueba el recorrido completo tal como lo vive quien descarga.

---

## 8. Después de publicar

- [ ] `README.md` menciona la versión correcta en los ejemplos de `Get-FileHash`
- [ ] `CHANGELOG.md` está publicado con la fecha correcta
- [ ] Los PRs de Dependabot pendientes se revisan (no se acumulan)
- [ ] Si aplica, se actualiza el README del perfil y el portafolio

---

## Release por parche de Node

Caso especial y periódico: Node publica una versión de seguridad y hay que
republicar aunque el código propio no haya cambiado.

~~~powershell
powershell -File packaging/windows/build-portable.ps1 -NodeVersion <nueva>
~~~

1. Sube el parche en `package.json` y en `src/api/router.js`.
2. Anota en `CHANGELOG.md` que es una actualización de runtime, citando la
   versión de Node y el motivo.
3. Repite desde el paso 2.

Es la obligación que se asumió al empaquetar el runtime, y está razonada en
[`ADR-0001`](ADR-0001-plataforma-y-lenguaje.md).

---

## Si algo falla a mitad

| Situación | Qué hacer |
|---|---|
| El workflow falla después de crear el tag | Arregla, borra el tag (`git push --delete origin v0.2.0`), vuelve a etiquetar |
| El release se publicó con un activo malo | `gh release delete v0.2.0` y repite. **No** subas un activo corregido a mano: rompe la trazabilidad entre tag, run y binario |
| El hash no coincide en la descarga | Trátalo como incidente de seguridad, no como un fallo de build: borra el release y averigua por qué antes de republicar |
