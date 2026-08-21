# Auditoría de custodia Bitcoin en 14 etapas

Este proyecto hereda un criterio de auditoría de seguridad en **12 capas**
—dependencias contra OSV/KEV/EPSS, SAST, contenedor, secretos, workflows,
Dockerfile, typosquat— y lo lleva a un dominio donde esas capas, por sí solas,
dejan fuera lo que de verdad pierde fondos.

Un repositorio de custodia puede tener cero CVE y cero secretos filtrados, y aun
así estar a un firmware defectuoso de perderlo todo. De ahí las 14 etapas.

Ejecutable: `node scripts/audit-bitcoin.js`
Definición del skill: [`.claude/skills/bitcoin-custody-audit/SKILL.md`](../.claude/skills/bitcoin-custody-audit/SKILL.md)

---

## Las tres reglas heredadas

1. **La cobertura se declara siempre.** Cada etapa dice qué miró. Un «0
   hallazgos» sobre una superficie que no se miró es una mentira con formato de
   informe.
2. **Una etapa que no puede ejecutarse sale OMITIDA, no verde.** Sin red, sin
   git o sin estado persistente son motivos legítimos para omitir; ninguno lo es
   para aprobar.
3. **La ausencia de dato es un hallazgo.** No poder demostrar con qué firmware
   nació una clave **es** el problema, aunque la clave esté sana.

---

## Bloque A — Las claves

### 1. Procedencia de claves y firmantes
*¿Se puede demostrar con qué firmware y método nació cada semilla?*

Recorre el inventario y cuenta cuántos firmantes tienen procedencia completa:
fabricante, modelo, firmware **en el momento de crear la semilla**, canal y
origen de entropía. Un `unknown` no se ignora: se lista.

### 2. Frescura de la matriz de avisos
*¿La inteligencia con la que se juzga está al día?*

Mira el `verifiedAt` más reciente de `config/advisories.json`. Pasado el plazo
(30 días por defecto) levanta `BTC-INTEL-001`. Es la etapa que detecta que **el
mundo** cambió aunque tu repositorio no.

### 3. Arquitectura de custodia
*¿La arquitectura contiene el compromiso de un firmante?*

Alto valor en single-sig, quorum N-de-N sin margen y multisig sin diversidad de
fabricantes. Las tres son configuraciones que parecen bien hasta el día que no.

## Bloque B — El software

### 4. Rechazo de material secreto
*¿Sigue siendo imposible entregarle una semilla?*

Arranca la aplicación y le lanza cinco cargas hostiles. Es la etapa que convierte
la promesa del README en un hecho comprobable.

### 5. Secretos en el histórico de git
*¿Entró alguna vez material secreto al repositorio?*

Recorre todos los parches de todas las ramas con patrones genéricos (PEM, tokens
de GitHub, claves de nube) y del dominio (`xprv`, WIF, mnemónicos, la clave de
datos). Borrar un secreto en un commit posterior no lo borra.

### 6. Cadena de suministro del runtime distribuido
*¿El motor que viaja dentro del binario tiene avisos abiertos?*

**La adaptación más importante del skill original.** Aquí no hay dependencias
npm, así que un scan de CVE diría «0 vulnerabilidades» y sería verdad — y
también engañoso. El código de terceros que se distribuye es el `node.exe` que
va dentro del instalador, y esta etapa lo contrasta contra la base del Node.js
Security Working Group.

Distingue el runtime que **se distribuye** (bloquea) del que ejecuta la
comprobación (informativo): el Node del runner de CI no viaja dentro de ningún
artefacto y teñir de rojo por él escondería el dato que sí importa.

### 7. Superficie de dependencias
*¿Sigue sin haber código de terceros ejecutándose?*

Cero dependencias declaradas, cero instaladas, ningún import externo, ninguna
referencia remota en el panel, CSP intacta.

### 8. Integridad del repositorio
*¿Contiene lo que dice contener?*

Archivos obligatorios, JSON válido, sintaxis, versión sincronizada entre
`package.json` y `/api/health`, y todos los enlaces de la documentación.

## Bloque C — La instalación

### 9. Postura de la instalación
*¿Cómo está configurada ahora mismo?*

Los ocho controles `BTC-OPSEC` de [`POSTURA_DE_DESPLIEGUE.md`](POSTURA_DE_DESPLIEGUE.md).

### 10. Aislamiento del nodo Bitcoin
*¿El acceso al nodo es local y de solo lectura?*

URL, método de autenticación y, sobre todo, que la allowlist RPC no haya crecido
hacia métodos capaces de firmar, enviar, importar o desbloquear.

### 11. Persistencia cifrada y clave de datos
*¿El estado está cifrado y la clave es fuerte?*

En modo demostración se declara **omitida** —no hay nada que cifrar— en vez de
aprobarse por defecto.

### 12. Automatización y CI
*¿Los workflows están pinneados y con permisos mínimos?*

Actions sin SHA, workflows sin bloque `permissions` e interpolación de datos de
evento sin sanear, que es el vector de inyección clásico en GitHub Actions.

### 13. Verificación del artefacto distribuido
*¿Lo publicado se puede verificar y arranca de verdad?*

Que el release publique checksums, que instale el artefacto en silencio y que
compruebe que la aplicación instalada **tiene contenido**. Un binario que compila
y pesa lo esperado puede abrirse vacío.

## Bloque D — Las personas

### 14. Proceso humano de respuesta
*¿Existe runbook y quién decide qué, antes de necesitarlo?*

Runbook de migración, documento de operación, checklist de release y una política
que exija aprobación humana para transmitir transacciones. Descubrir durante el
incidente que nadie definió quién aprueba mover fondos es el fallo más caro y el
más evitable.

---

## Uso

```bash
# Las 14 etapas
node scripts/audit-bitcoin.js

# Con informe Markdown fechado
node scripts/audit-bitcoin.js --report

# Solo algunas
node scripts/audit-bitcoin.js --stages=1,2,3,9

# Contra una instalación real en vez de la de demostración
DEMO_MODE=false ROOTCAUSE_DATA_KEY="…" node scripts/audit-bitcoin.js --report
```

Salida: una línea por etapa con `OK`, `!!` (atención), `XX` (fallo) o `..`
(omitida), su cobertura y su detalle; y un **plan de remediación deduplicado**.

Código de salida `1` solo si alguna etapa **falla**. «Con atención» describe
deuda, no rotura, y no tumba el proceso.

## Correspondencia con las 12 capas originales

| Capa de `security-audit` | Aquí |
|---|---|
| `osv`, `kev`, `epss`, `recent` | Etapa 6, adaptada al runtime empaquetado |
| `sast` | Etapa 4 ejecutando la aplicación, más CodeQL en CI |
| `secrets` | Etapa 5, con patrones del dominio |
| `workflows` | Etapa 12 y zizmor en CI |
| `dockerfile` | hadolint en CI |
| `container`, `typosquat`, `pypi-malware`, `news` | No aplican: sin imagen de producción ni paquetes |
| — | Etapas 1, 2, 3, 9, 10, 11, 13 y 14 son propias del dominio |

## Automatización

El workflow [`security-audit.yml`](../.github/workflows/security-audit.yml)
ejecuta estas etapas en cada push, en cada PR y **cada lunes**, porque un aviso
nuevo de Node o de un fabricante no espera a que alguien haga commit. Detalles
en [`AUDITORIA_CONTINUA.md`](AUDITORIA_CONTINUA.md).
