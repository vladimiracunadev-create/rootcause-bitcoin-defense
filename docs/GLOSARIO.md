# Glosario de términos

Todo término que aparece en el panel, en los incidentes o en la documentación,
explicado una sola vez y sin dar por sabido nada. Ordenado por temas, porque
buscar «entropía» sin saber que se relaciona con «semilla» no ayuda a nadie.

Si un término te resulta nuevo, empieza por
[`MANUAL_PARA_NOVATOS.md`](MANUAL_PARA_NOVATOS.md), que cuenta la historia
completa antes de entrar en vocabulario.

---

## 🔑 1 · Claves y semillas

| Término | Qué es | Por qué importa aquí |
|---|---|---|
| **Clave privada** | El número secreto que autoriza gastar unos fondos. Quien lo tiene, manda. | Esta aplicación **nunca** la pide, la guarda ni la ve. Si se la envías, la rechaza con `422`. |
| **Clave pública** | Se deriva de la privada, se puede compartir y sirve para recibir y para verificar firmas. | Todo lo que RootCause maneja es información pública o metadatos. |
| **Semilla** (*seed*) | El origen de todas las claves de una wallet: un número aleatorio del que se derivan las demás. | Si la semilla se generó mal, **todas** las claves derivadas nacen débiles. Es el problema central de este producto. |
| **Frase de recuperación / mnemónico BIP-39** | Las 12 o 24 palabras que representan la semilla en formato legible. | Es la semilla con otro traje. Nadie legítimo te la pedirá jamás, y esta aplicación tampoco. |
| **Passphrase BIP-39** | Una palabra o frase adicional que, sumada al mnemónico, produce una wallet distinta. | Material secreto: campo prohibido en la API. |
| **xprv / tprv** | Clave privada extendida: una sola cadena que contiene una rama entera de claves privadas. | Rechazada por patrón, no solo por nombre de campo. |
| **xpub / tpub** | Clave pública extendida. Permite ver saldos y direcciones, **no** gastar. | Es lo que usa una wallet *watch-only*. |
| **WIF** | Formato de importación de una clave privada individual. | Material secreto: rechazado. |
| **Huella / fingerprint** | Identificador corto (8 caracteres hexadecimales) derivado de una clave maestra. Ej.: `D15EA5ED`. | Sirve para nombrar un firmante sin revelar nada sensible. |
| **Derivación** | El proceso de obtener muchas claves hijas a partir de una semilla. | Explica por qué una semilla débil contamina toda la wallet. |

---

## 🎲 2 · Entropía y procedencia

| Término | Qué es | Por qué importa aquí |
|---|---|---|
| **Entropía** | La cantidad real de azar impredecible de un número. Se mide en bits. | 256 bits de entropía real son inatacables; 32 bits se rompen con un ordenador de sobremesa. **La diferencia no se ve mirando la wallet.** |
| **RNG / TRNG** | Generador de números aleatorios; el TRNG usa una fuente física (ruido térmico, por ejemplo). | El incidente COLDCARD de 2026 fue un fallo de RNG con repliegue a una fuente pobre. |
| **Repliegue de RNG** (*RNG fallback*) | Cuando el generador principal falla y el dispositivo usa uno peor sin avisar. | Es la causa raíz del aviso `BTC-ADV-2026-COLDCARD-ENTROPY`. |
| **Procedencia** (*provenance*) | El historial verificable de cómo nació una clave: fabricante, modelo, versión de firmware en el momento de crear la semilla y método de generación. | Es **el dato que esta aplicación inventaría**. Sin procedencia no hay diagnóstico posible. |
| **Firmware** | El programa que corre dentro del dispositivo firmante. | No importa el firmware que tiene hoy, sino **el que tenía cuando creó la semilla**. Actualizar no repara una semilla ya generada. |
| **Track de firmware** | Canal de publicación del fabricante: `standard` (estable) o `edge` (adelantado). | Los rangos afectados de un aviso son distintos por canal. |
| **NIST SP 800-90B** | Norma que define cómo se evalúa una fuente de entropía. | Referencia usada para hablar de calidad de entropía sin inventar criterios propios. |

---

## 🏛️ 3 · Custodia

| Término | Qué es | Por qué importa aquí |
|---|---|---|
| **Custodia** | Quién controla las claves que pueden mover unos fondos. | El producto analiza la *arquitectura* de custodia, no los fondos. |
| **Firmante** (*signer*) | Un dispositivo o software capaz de firmar con una clave. | Unidad mínima del inventario. Una wallet tiene entre uno y cinco. |
| **Hardware wallet** | Dispositivo dedicado que guarda la clave y firma sin exponerla. | COLDCARD, Trezor, Ledger, BitBox son ejemplos. |
| **Single-sig** | Una sola clave puede gastar todo. | Simple y frágil: comprometer una clave es perderlo todo. Regla `BTC-CUSTODY-001`. |
| **Multisig** | Hacen falta *N* firmas de *M* posibles (ej.: 2 de 3). | Contiene el compromiso de un firmante. |
| **Quorum** | La expresión `required` de `total` que define un multisig. | El panel lo muestra como `2/3`. |
| **Diversidad de fabricantes** | Que los firmantes de un multisig no sean todos del mismo fabricante ni del mismo firmware. | Un multisig 2-de-3 con tres dispositivos idénticos cae entero con un solo fallo de firmware. Regla `BTC-CUSTODY-002`. |
| **Watch-only** | Wallet que conoce las claves públicas y puede ver, pero no gastar. | Es el único modo en que opera esta aplicación. |
| **Descriptor** | Texto que describe con precisión cómo se derivan las direcciones de una wallet. | Fuera de alcance hoy; anotado en el [roadmap](ROADMAP.md). |
| **PSBT** | *Partially Signed Bitcoin Transaction*: formato estándar para pasar una transacción entre firmantes. | Esta aplicación **no** las crea ni las firma; el runbook de migración las menciona como paso humano. |
| **HSM** | Módulo de hardware para claves de nivel empresarial. | Mencionado como algo que este producto **no** sustituye. |

---

## 🌐 4 · Bitcoin, la red

| Término | Qué es | Por qué importa aquí |
|---|---|---|
| **Bitcoin Core** | La implementación de referencia del nodo Bitcoin. | Fuente de verdad local, consultada en **solo lectura**. |
| **Nodo** | Programa que valida por sí mismo toda la cadena. | Si confías en el nodo de un tercero, confías en su versión de la realidad. |
| **RPC** | La interfaz de comandos de Bitcoin Core (`getblockchaininfo`, etc.). | Se usa con una **allowlist** de 11 métodos de lectura; el resto se rechaza antes de salir. |
| **Cookie de autenticación** | Archivo `.cookie` que Bitcoin Core genera para autenticar RPC local. | Forma preferida de conectar: evita escribir contraseñas en archivos. |
| **UTXO** | Una porción de bitcoin no gastada, la unidad que se mueve realmente. | El runbook de migración razona en UTXO, no en «saldo». |
| **Mempool** | La sala de espera de transacciones aún no confirmadas. | Su presión afecta a qué transacciones sobreviven. Regla `BTC-NODE-004`. |
| **Confirmación** | Cada bloque que se apila sobre el que contiene tu transacción. | Una transacción confirmada **no se puede revertir**. Ni por esta aplicación ni por nadie. |
| **Sincronización / IBD** | Descarga y validación inicial de la cadena. | Un nodo no sincronizado da respuestas incompletas. Regla `BTC-NODE-002`. |
| **Peers** | Otros nodos con los que el tuyo habla. | Cero peers = aislado de la red. Regla `BTC-NODE-003`. |
| **Satoshi (sat)** | La unidad mínima: 1 BTC = 100.000.000 sats. | El umbral de alto valor por defecto son 10.000.000 sats = 0,1 BTC. |
| **Regtest / signet** | Redes de prueba donde el bitcoin no vale nada. | `labs/regtest/` trae la configuración para practicar sin riesgo. |

---

## 🛡️ 5 · Seguridad y respuesta a incidentes

| Término | Qué es | Por qué importa aquí |
|---|---|---|
| **Aviso de seguridad** (*advisory*) | Comunicación formal de un fabricante sobre un defecto. | `config/advisories.json` versiona los avisos con su rango afectado y su fecha de verificación. |
| **Hallazgo** (*finding*) | Una regla que se activó sobre una entidad concreta. | Tiene código, severidad, evidencia, causa raíz y remediación. |
| **Incidente** | Un hallazgo que persiste y se sigue en el tiempo. | Estados: `open` → `acknowledged` → `resolved`. |
| **Causa raíz** | La razón de fondo por la que algo ocurre, no su síntoma. | «El saldo se movió» es el síntoma; «la semilla se generó con entropía insuficiente» es la causa. |
| **Evidencia** | Los datos concretos que sostienen un hallazgo. | Nunca contiene material secreto: se redacta antes de escribirse. |
| **Remediación** | Los pasos concretos para corregir. | Vienen del aviso del fabricante cuando existe. |
| **Severidad** | `critical`, `high`, `medium`, `low`, `info`. | Determina el peso en el puntaje: 100, 75, 45, 20 y 5. |
| **Watchtower** | Vigilante que consulta el nodo cada cierto tiempo. | Apagado por defecto: no hace polling sin que lo pidas. |
| **Auditoría hash-chain** | Registro donde cada entrada incluye el hash de la anterior. | Modificar una entrada pasada rompe la cadena y se detecta. |
| **AES-256-GCM** | Cifrado autenticado: protege el contenido y detecta manipulación. | Cifra el archivo de estado local. |
| **CSP** | *Content-Security-Policy*: regla del navegador sobre de dónde puede cargar el panel. | Aquí es `self` estricta: cero orígenes externos, verificado en CI. |
| **Loopback** | `127.0.0.1`, la dirección que solo alcanza tu propia máquina. | Todo el producto vive ahí. |
| **Allowlist** | Lista de lo permitido; todo lo demás se niega. | Modelo usado para el RPC, en vez de una lista negra. |
| **Phishing dirigido** | Engaño personalizado con datos reales de la víctima. | Riesgo del incidente Trezor: los datos filtrados hacen el engaño creíble. |

---

## 📘 6 · Vocabulario del proyecto

| Término | Qué es |
|---|---|
| **Modo demostración** | Arranque por defecto: datos ficticios, todo en memoria, nada se escribe en disco. |
| **Modo persistente** | `DEMO_MODE=false` más una clave de datos: el estado se cifra en disco. |
| **Clave de datos** (`ROOTCAUSE_DATA_KEY`) | Clave AES que cifra el estado local. No es una clave Bitcoin y no controla fondos, pero si la pierdes no hay recuperación del archivo. |
| **Guardia de secretos** (*secret-guard*) | El módulo que rechaza cualquier campo que huela a material secreto, a cualquier profundidad del JSON. |
| **Cabecera de mutación** | `x-rootcause-request: 1`, obligatoria para cualquier `POST`, `PATCH` o `DELETE`. Bloquea peticiones lanzadas desde otra pestaña. |
| **Puerta de calidad** | Cada uno de los cinco verificadores que corren en CI y en `pnpm check`. |
| **Edición portable** | ZIP que se descomprime y se ejecuta, con el motor Node dentro. |
| **Invariante** | Afirmación que el producto debe cumplir siempre y que se comprueba ejecutando la aplicación, no leyendo el código. |

---

## ⚠️ Términos que verás y NO significan lo que parece

- **«Wallet»** en este producto es una *ficha de inventario*, no un monedero con
  fondos que puedas mover. No hay fondos dentro de la aplicación.
- **«Riesgo 100»** no significa que te vayan a robar hoy: significa que existe al
  menos un hallazgo crítico abierto. El puntaje sirve para comparar el mismo
  inventario a lo largo del tiempo.
- **«Bloquear depósitos»** bloquea lo que la aplicación controla. Si un atacante
  ya tiene tu clave, puede gastar sin pasar por aquí. Está dicho también en
  [`LIMITACIONES.md`](LIMITACIONES.md).
- **«Nodo no disponible»** es un problema de observación, no un problema de tus
  fondos.
