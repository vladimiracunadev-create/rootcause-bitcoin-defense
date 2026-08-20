# Operación día a día

Qué hacer ante cada color, en qué orden, y —sobre todo— **qué no hacer**. Este
documento asume que la aplicación ya está instalada y que entiendes el panel; si
no, empieza por [`MANUAL_USUARIO.md`](MANUAL_USUARIO.md).

---

## La rutina

| Cuándo | Qué |
|---|---|
| **Cada vez que abres** | Mira el anillo y los incidentes abiertos. Treinta segundos |
| **Al registrar una wallet o un firmante** | Pulsa *Analizar ahora* y lee lo que salga |
| **Semanalmente** | Revisa `/api/audit` y comprueba que la cadena está intacta |
| **Mensualmente** | Contrasta `config/advisories.json` con las fuentes oficiales de tus fabricantes |
| **Cuando Node publique un parche de seguridad** | Republica la aplicación de Windows ([`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md)) |

La tarea mensual es la que se olvida y la que más importa: **una matriz de
avisos desactualizada produce un verde falso**, que es peor que no tener panel.
Cada aviso muestra su `verifiedAt` justo para que no puedas engañarte.

---

## Ante un incidente crítico

### `BTC-KEY-001` — firmware afectado al crear la semilla

Es el hallazgo que justifica el producto entero.

**Ahora mismo:**

1. Deja de generar direcciones de recepción en esa wallet.
2. Anota el incidente: id, huella del firmante, aviso que coincidió.
3. Comprueba en la fuente oficial del fabricante que el rango sigue vigente.

**Después, con calma:**

4. Planifica la migración con [`RUNBOOK-MIGRATION.md`](RUNBOOK-MIGRATION.md).
5. Crea una semilla nueva en un dispositivo con firmware corregido o en un
   firmante independiente.
6. Verifica huella y dirección de destino **en la pantalla del dispositivo**, no
   en la del ordenador.
7. Mueve una cantidad pequeña primero. Confírmala. Luego el resto.
8. Trata la semilla antigua como comprometida de forma permanente. No la
   reutilices «para cosas pequeñas».

**Lo que NO hay que hacer:**

- Actualizar el firmware y dar el asunto por cerrado. No repara la semilla ya
  creada, y el hallazgo seguirá activo con razón.
- Mover todo de golpe con prisa.
- Teclear la frase de recuperación en ningún sitio. En ninguno.

### `BTC-TX-001` — gasto sin aprobación conocida

Es el caso urgente de verdad, porque puede significar que alguien más tiene la
clave.

1. **Preserva evidencia antes de tocar nada:** exporta `/api/incidents` y
   `/api/audit`.
2. Verifica el txid en un segundo nodo independiente. Que dos fuentes coincidan
   es barato y evita perseguir fantasmas.
3. Deniega nuevas autorizaciones al servicio de firma.
4. Si el gasto era legítimo pero nadie lo registró, registra la aprobación
   (`POST /api/approvals`) y vuelve a analizar. **Corrige el proceso, no
   silencies la regla.**
5. Si no era legítimo: asume clave comprometida y activa migración de los UTXO
   que aún no se han gastado.

Lo que la aplicación **no** puede hacer, y conviene tenerlo claro antes de
necesitarlo: no puede cancelar la transacción, ni congelar fondos, ni impedir
que quien tenga la clave vuelva a gastar.

### `BTC-CUSTODY-001` — todo el valor bajo una sola clave

No es una emergencia; es deuda estructural. Se resuelve migrando a multisig con
fabricantes distintos, con el mismo procedimiento cuidadoso: prueba pequeña,
verificación en dispositivo, luego el resto.

Si decides asumir el riesgo, déjalo escrito: sube el umbral en
`HIGH_VALUE_THRESHOLD_SATS` **conscientemente** en vez de convivir con un rojo
permanente que acaba por no mirarse.

---

## Ante los avisos medios

| Hallazgo | Acción | Plazo razonable |
|---|---|---|
| `BTC-KEY-002` firmware desconocido | Reconstruir procedencia desde registros verificables. Si no se puede demostrar, tratarla como sospechosa | Semanas |
| `BTC-KEY-003` entropía desconocida | Documentar el método de generación | Semanas |
| `BTC-CUSTODY-002` multisig sin diversidad | Sustituir firmantes hasta tener dos fabricantes independientes | Meses |
| `BTC-PRIVACY-001` acceso masivo a datos | Revocar sesión, preservar registros, avisar a los afectados y esperar phishing dirigido | Días |

---

## Ante un `BTC-NODE-*`

Estos **no hablan de tus fondos**, hablan de tu capacidad de observar.

| Código | Primer sitio donde mirar |
|---|---|
| `NODE-001` no disponible | ¿Está corriendo `bitcoind`? ¿La cookie es legible? ¿La URL es la correcta? |
| `NODE-002` sin sincronizar | Espera. Si el progreso no avanza: disco, CPU, reloj del sistema |
| `NODE-003` sin peers | Cortafuegos, DNS, proxy o Tor |
| `NODE-004` mempool a tope | Nada urgente. Correlaciona transacciones desaparecidas con reemplazos |

Mientras `NODE-001` esté activo, la vigilancia de gastos está ciega. No es que
no haya problemas: es que no se pueden ver.

---

## Higiene de la propia herramienta

**La clave de datos.** Vive en tu gestor de contraseñas, nunca junto a los datos
cifrados y nunca en el repositorio. Si la pierdes, el archivo no se recupera.

**La auditoría.** Cada acción encadena su hash con el anterior. Revisa
periódicamente:

~~~bash
curl -s http://127.0.0.1:8787/api/audit | grep -o '"valid":[a-z]*'
~~~

Un `"valid":false` significa que alguien modificó el historial. Preserva el
archivo antes de tocar nada más.

**El puerto.** El panel escucha en loopback. Si alguna vez cambias `HOST`, estás
exponiendo el inventario de tus wallets a tu red local. Piénsalo dos veces y
luego una tercera.

**Las actualizaciones.** El motor Node viaja dentro de la aplicación de Windows:
cuando Node publica un parche, la aplicación debe republicarse. Está en el
checklist de release, y es responsabilidad de quien mantiene el repositorio, no
del usuario final.

---

## Los tres principios que gobiernan todo lo anterior

1. **La evidencia primero.** Antes de remediar, preserva. Un incidente sin
   evidencia es una anécdota.
2. **Verificación humana en dispositivos independientes.** Ninguna migración de
   fondos se decide con una sola pantalla.
3. **Un hallazgo no se cierra porque moleste.** Se cierra cuando la causa raíz
   deja de ser cierta. Si un rojo permanente te estorba, la respuesta es
   arreglar la causa o cambiar la política **de forma explícita** —nunca
   ignorarla en silencio.
