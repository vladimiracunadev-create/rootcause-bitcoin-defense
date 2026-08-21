---
name: bitcoin-custody-audit
description: >
  Audita la seguridad de una custodia Bitcoin en 14 etapas — procedencia de claves
  (fabricante, modelo y firmware con el que se creó cada semilla) contra la matriz de
  avisos publicados; frescura de esa matriz; arquitectura de custodia (single-sig,
  quorum N-de-N, diversidad de fabricantes); rechazo verificado de material secreto con
  la aplicación en marcha; secretos en el histórico de git; avisos abiertos del runtime
  que se distribuye dentro del binario; superficie de dependencias; integridad del
  repositorio; postura de la instalación (bind, cifrado, RPC, vigilancia, auditoría);
  aislamiento del nodo Bitcoin Core; persistencia cifrada; workflows pinneados;
  verificación del artefacto publicado; y proceso humano de respuesta. Declara SIEMPRE
  la cobertura real: una etapa que no pudo ejecutarse sale como OMITIDA, nunca como
  aprobada. Genera informe Markdown y plan de remediación priorizado. Úsalo cuando el
  usuario diga "audita mi custodia bitcoin", "revisa la seguridad de mis wallets",
  "¿me afecta el aviso de COLDCARD/Trezor?", "auditoría bitcoin", "revisa la procedencia
  de mis claves", "postura de seguridad del despliegue", "prepara el release de bitcoin
  defense", o cuando cambie el inventario, la configuración o la matriz de avisos.
---

# bitcoin-custody-audit — auditoría de custodia Bitcoin en 14 etapas

Hermano de dominio del skill genérico `security-audit` (12 capas). Aquel audita
**el repositorio**: dependencias, CVE, SAST, contenedor, secretos. Este audita
**la custodia**: de dónde vienen las claves, qué las puede romper y si la
instalación que las vigila está bien puesta.

No se solapan: se encadenan. En un repositorio de custodia conviene correr los
dos, y este declara explícitamente qué hereda de aquel.

## Las tres reglas que gobiernan el skill

1. **La cobertura se declara siempre.** Lo que no se pudo comprobar aparece como
   no comprobado. Un «0 hallazgos» sobre una superficie que no se miró es una
   mentira con formato de informe.
2. **Una etapa que no puede ejecutarse sale OMITIDA, no verde.** Sin red, sin
   git o sin estado persistente son motivos legítimos para omitir; ninguno lo es
   para aprobar.
3. **La ausencia de dato es un hallazgo.** No poder demostrar con qué firmware
   nació una clave **es** el problema, aunque la clave esté sana.

---

## Las 14 etapas

### Bloque A — Las claves (1-3)

| # | Etapa | Pregunta | Fallo típico |
|---|---|---|---|
| 1 | **Procedencia de claves y firmantes** | ¿Se puede demostrar con qué firmware y método nació cada semilla? | Inventario con `firmware: unknown` que impide descartar cualquier aviso |
| 2 | **Frescura de la matriz de avisos** | ¿La inteligencia con la que se juzga está al día? | Panel en verde sobre avisos sin revisar en seis meses |
| 3 | **Arquitectura de custodia** | ¿La arquitectura contiene el compromiso de un firmante? | Alto valor en single-sig; multisig 3-de-3; tres dispositivos del mismo fabricante |

### Bloque B — El software (4-8)

| # | Etapa | Pregunta | Fallo típico |
|---|---|---|---|
| 4 | **Rechazo de material secreto** | ¿Sigue siendo imposible entregarle una semilla? | Un campo nuevo en la API que acepta `mnemonic` sin pasar por el guardia |
| 5 | **Secretos en el histórico** | ¿Entró alguna vez material secreto al repositorio? | Un `.env` commiteado y «borrado» tres commits después |
| 6 | **Cadena de suministro del runtime** | ¿El motor que viaja dentro del binario tiene avisos abiertos? | Cero dependencias npm y un Node de hace un año dentro del `.exe` |
| 7 | **Superficie de dependencias** | ¿Sigue sin haber código de terceros ejecutándose? | Una utilidad «pequeña» que arrastra 40 paquetes transitivos |
| 8 | **Integridad del repositorio** | ¿Contiene lo que dice contener? | Documentación que remite a un runbook que ya no existe |

### Bloque C — La instalación (9-13)

| # | Etapa | Pregunta | Fallo típico |
|---|---|---|---|
| 9 | **Postura de la instalación** | ¿Cómo está configurada ahora mismo? | `HOST=0.0.0.0` «para verlo desde el portátil» |
| 10 | **Aislamiento del nodo** | ¿El acceso al nodo es local y de solo lectura? | RPC expuesto con usuario y contraseña estáticos |
| 11 | **Persistencia cifrada** | ¿El estado está cifrado y la clave es fuerte? | `ROOTCAUSE_DATA_KEY=clave123` en un `config.cmd` |
| 12 | **Automatización y CI** | ¿Los workflows están pinneados y con permisos mínimos? | `uses: action@v4` sobre una etiqueta que alguien puede mover |
| 13 | **Verificación del artefacto** | ¿Lo publicado se puede verificar y arranca de verdad? | Un instalador que compila, pesa lo esperado y abre vacío |

### Bloque D — Las personas (14)

| # | Etapa | Pregunta | Fallo típico |
|---|---|---|---|
| 14 | **Proceso humano de respuesta** | ¿Existe runbook y quién decide qué, antes de necesitarlo? | Descubrir durante el incidente que nadie definió quién aprueba mover fondos |

---

## Cómo se invoca

Desde la raíz de un repositorio con esta estructura (o del propio
`rootcause-bitcoin-defense`):

```bash
# Las 14 etapas, informe por consola
node scripts/audit-bitcoin.js

# Además, informe Markdown fechado en la raíz del repositorio
node scripts/audit-bitcoin.js --report

# Solo algunas etapas
node scripts/audit-bitcoin.js --stages=1,2,3,9

# Salida procesable
node scripts/audit-bitcoin.js --json
```

Contra una instalación real, en vez de la de demostración:

```bash
DEMO_MODE=false ROOTCAUSE_DATA_KEY="…" node scripts/audit-bitcoin.js --report
```

Cada etapa se apoya en un verificador que también se puede correr suelto:

| Etapa | Comando |
|---|---|
| 4 | `node scripts/check-security-claims.js` |
| 5 | `node scripts/check-history-secrets.js` |
| 6 | `node scripts/check-runtime-advisories.js` |
| 7 | `node scripts/check-local-only.js` |
| 8 | `node scripts/validate-repo.js` y `node scripts/check-docs.js` |
| 9 y 11 | `curl http://127.0.0.1:8787/api/posture` |

---

## Qué produce

Salida por consola con una línea por etapa (`OK`, `!!` atención, `XX` fallo,
`..` omitida), su cobertura y su detalle; y, con `--report`, un
`SECURITY_AUDIT_BITCOIN_<fecha>.md` con resumen, etapas y **plan de remediación
único, deduplicado y accionable**.

Código de salida: `1` si alguna etapa **falla**. Las etapas «con atención» no
tumban el proceso: describen deuda, no rotura.

---

## Cuándo invocarlo

- Al cambiar el inventario: una wallet o un firmante nuevo cambia el mapa.
- Al publicar un aviso un fabricante que usas.
- Antes de cada release (etapas 4 a 8 y 13 son parte del checklist).
- Al cambiar la configuración del despliegue (etapas 9 a 11).
- Periódicamente, aunque no cambie nada: la etapa 2 detecta que **el mundo**
  cambió aunque tu repositorio no.

---

## Relación con el skill de 12 capas

| Capa de `security-audit` | Aquí |
|---|---|
| `osv`, `kev`, `epss` | Etapa 6, adaptada: no hay dependencias npm, el tercero es el runtime empaquetado |
| `sast` | Etapa 4, pero ejecutando la aplicación en vez de leerla, más CodeQL en CI |
| `secrets` | Etapa 5, con patrones del dominio: `xprv`, WIF, mnemónicos y la clave de datos |
| `workflows` | Etapa 12 |
| `dockerfile` | Cubierta por la etapa 12 en CI (hadolint) |
| `container`, `typosquat`, `pypi-malware` | No aplican: no hay imagen de producción ni paquetes |
| — | Etapas 1, 2, 3, 9, 10, 11, 13 y 14 son propias de este dominio |

Cuando ambos skills están disponibles, el orden natural es: primero
`security-audit` sobre el repositorio, después `bitcoin-custody-audit` sobre la
custodia y la instalación.

---

## Limitaciones

- **No verifica la procedencia que le cuentas.** Si alguien registra un firmware
  incorrecto, el diagnóstico será incorrecto. La aplicación no puede comprobar
  qué firmware tenía un dispositivo hace dos años.
- **La matriz de avisos es manual.** La etapa 2 detecta que está vieja, no la
  actualiza sola.
- **No mira la cadena.** Sin análisis de UTXO, de reutilización de direcciones ni
  de contrapartes: es una decisión de alcance, no una carencia.
- **No sustituye una auditoría criptográfica ni un proceso profesional de
  respuesta a incidentes.**
- Las etapas 1, 3 y 9 dependen del inventario cargado: contra el estado de
  demostración sirven para aprender, no para concluir nada sobre fondos reales.
