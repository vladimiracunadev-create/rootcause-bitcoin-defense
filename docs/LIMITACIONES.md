# Limitaciones

Lo que este producto **no** puede hacer, sin adornos. Un detector que no declara
sus límites produce una falsa sensación de cobertura, y en custodia de bitcoin
eso cuesta dinero real.

Divididas en tres clases: límites **físicos** (nadie puede), límites de
**alcance** (se decidió no hacerlo) y límites de **implementación** (todavía no).

---

## 1. Límites físicos — nadie puede, ni este producto ni ninguno

### No se puede saber si una semilla es débil mirando una dirección

Una clave generada con 32 bits de entropía y otra con 256 producen direcciones
idénticas en forma. **No hay análisis público que las distinga.** Por eso este
producto pide procedencia: fabricante, modelo, firmware al crear la semilla y
método de generación. Sin ese dato no hay diagnóstico, y la aplicación lo dice
en vez de inventarlo (`BTC-KEY-002`, `BTC-KEY-003`).

### No se puede cancelar ni revertir una transacción confirmada

Ni esta aplicación, ni el fabricante, ni un exchange, ni un juez. Cuando una
transacción válida está confirmada, es definitiva.

### Bloquear depósitos aquí no impide un gasto

Si un atacante ya tiene la clave, puede firmar y transmitir sin pasar por esta
aplicación —o por ninguna. Las acciones automáticas (`disable_new_deposit_addresses`,
`deny_policy_authorization`) solo alcanzan a lo que la aplicación controla. Para
una wallet single-sig comprometida, la única defensa real es mover los fondos
antes que el atacante.

### Actualizar el firmware no repara una semilla ya creada

El firmware corregido generará bien las claves futuras. La semilla existente
nació del proceso defectuoso y sigue siendo lo que es. Es la confusión más
frecuente, y por eso `BTC-KEY-001` no se cierra al actualizar.

---

## 2. Límites de alcance — decisiones deliberadas

### No custodia, no firma, no transmite

No hay claves privadas en el producto. No hay código de firma. No hay
transmisión a la red. No es una carencia: es la propiedad de seguridad
principal, y está verificada en cada build por
`scripts/check-security-claims.js`.

### Solo lee del nodo, y solo 11 métodos

La allowlist RPC contiene únicamente métodos de consulta. Cualquier método de
firma, envío, importación, exportación o desbloqueo se rechaza **antes** de
salir a la red. No hay forma de configurarlo para que gaste: no existe el código.

### Un solo usuario, sin autenticación

Está pensada para una persona en su propia máquina, escuchando en loopback. No
hay usuarios, ni roles, ni sesiones. **Si expones el puerto a la red, cualquiera
en esa red ve tu inventario de wallets y saldos.** No lo hagas.

### No hace análisis de cadena

No estudia la historia de las monedas, no detecta reutilización de direcciones,
no puntúa contrapartes ni intenta desanonimizar nada. Fuera de alcance por
diseño.

### La IA es opcional y nunca decisoria

Un hallazgo no es cierto porque un modelo lo explique bien. Las reglas son
deterministas y auditables; cualquier capa de explicación es accesoria.

---

## 3. Límites de implementación — hoy no, y está anotado

| Límite | Consecuencia práctica | Estado |
|---|---|---|
| **Sin soporte de descriptores** | Las wallets se registran a mano; no se derivan direcciones ni se verifican políticas de script | [Roadmap](ROADMAP.md) |
| **Sin ZMQ** | La observación de transacciones depende de sondeo periódico, no de notificaciones en tiempo real | Roadmap |
| **Sin integración HWI** | No habla con dispositivos por USB; la procedencia se introduce a mano | Requiere Rust: [ADR-0001](ADR-0001-plataforma-y-lenguaje.md) |
| **Sin PSBT** | El runbook de migración describe pasos humanos, la aplicación no construye la transacción | Roadmap |
| **Avisos manuales** | `config/advisories.json` se actualiza a mano contra fuentes oficiales | Roadmap |
| **Saldos declarados** | `balanceSats` lo escribe el operador; no se deriva de la cadena | Depende de descriptores |
| **Solo x64 en Windows** | No hay compilación ARM64 | Pendiente |
| **Binarios sin firmar** | SmartScreen advierte; la verificación disponible es el hash publicado | Pendiente |
| **Un idioma** | Interfaz y documentación en español | Las ediciones hermanas tienen i18n |

---

## 4. Lo que la matriz de avisos NO garantiza

`config/advisories.json` está fechada. Cada entrada lleva `publishedAt` y
`verifiedAt`, y ambas se muestran en el panel a propósito.

- **Un verde con avisos viejos no es un verde.** Si nadie revisó la matriz en
  seis meses, la ausencia de hallazgos no significa ausencia de problemas.
- **No hay ingesta automática.** Nadie te avisa de un aviso nuevo: hay que
  contrastar con las fuentes oficiales del fabricante.
- **Cobertura limitada.** Hoy hay dos avisos (COLDCARD y Trezor). No es la
  historia completa de la industria; es lo que estaba verificado el 20 de agosto
  de 2026.

---

## 5. Lo que no sustituye

Ni pretende hacerlo:

- una auditoría criptográfica profesional;
- un HSM o una política de custodia empresarial;
- un proceso formal de respuesta a incidentes con personas de guardia;
- asesoría legal o financiera;
- el criterio de alguien con experiencia acompañándote en una migración de
  fondos importante.

---

## 6. Cómo verificar estas afirmaciones tú mismo

No hace falta creer en ninguna de las anteriores:

~~~bash
# Los invariantes de seguridad, ejecutando la aplicación de verdad
node scripts/check-security-claims.js

# Cero dependencias y cero orígenes remotos
node scripts/check-local-only.js

# Intenta darle una semilla y observa el 422
curl -i -X POST http://127.0.0.1:8787/api/wallets \
  -H "content-type: application/json" -H "x-rootcause-request: 1" \
  --data '{"name":"x","mnemonic":"esto no debe aceptarse"}'
~~~

Si alguna de estas comprobaciones dejara de pasar, el fallo es del producto y no
del documento. Ese es el punto de escribirlas así.
