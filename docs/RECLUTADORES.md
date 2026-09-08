# Para reclutadores y revisores técnicos

Qué demuestra este repositorio, dónde mirarlo y en cuánto tiempo. Escrito para
quien tiene diez minutos y necesita formarse un juicio.

---

## 🎯 En una frase

Aplicación de escritorio local-first para Windows que inventaría la procedencia
de claves Bitcoin y detecta exposición criptográfica, escrita en JavaScript sin
una sola dependencia externa, con las promesas de seguridad del producto
verificadas ejecutando la aplicación en cada build.

---

## ⏱️ Recorrido de diez minutos

| Minuto | Archivo | Qué demuestra |
|---|---|---|
| 0–2 | [`../README.md`](../README.md) | Definición del problema y límites declarados desde la primera pantalla |
| 2–4 | [`../scripts/check-security-claims.js`](../scripts/check-security-claims.js) | Arranca la aplicación real y comprueba 20 invariantes. **Es el archivo que mejor resume el criterio del proyecto** |
| 4–6 | [`../src/domain/rule-engine.js`](../src/domain/rule-engine.js) | Motor de reglas con causa raíz, evidencia y remediación por hallazgo; ids deterministas para idempotencia |
| 6–8 | [`ADR-0001-plataforma-y-lenguaje.md`](ADR-0001-plataforma-y-lenguaje.md) | Decisión técnica argumentada, con coste asumido y disparadores explícitos para revertirla |
| 8–10 | [`../.github/workflows/release-windows.yml`](../.github/workflows/release-windows.yml) | El artefacto se instala en silencio y se **arranca** antes de publicarse |
| Extra | [`AUDITORIA_14_ETAPAS.md`](AUDITORIA_14_ETAPAS.md) | Auditoría de dominio propia, con cobertura declarada etapa por etapa |

---

## 🛠️ Capacidades que este repositorio evidencia

### Ingeniería de seguridad

- Modelo de amenazas escrito y aplicado ([`THREAT_MODEL.md`](THREAT_MODEL.md)).
- Defensa en profundidad: allowlist de RPC, guardia de secretos por nombre **y**
  por patrón, CSP `self`, cabecera anti-CSRF local, comprobación `sec-fetch-site`,
  límite de cuerpo, límite de tasa.
- Criptografía aplicada con la biblioteca de la plataforma: AES-256-GCM para el
  estado y auditoría encadenada por hash. **Ninguna primitiva implementada a
  mano** — decisión consciente y explicada.
- Superficie reducida a propósito: la capacidad de firmar no está desactivada,
  es que no existe.

### Diseño de producto

- El producto se define por lo que se niega a hacer, y eso está en el código
  antes que en el README.
- Alertas con causa raíz y siguiente paso; nada de avisos sin remediación.
- Falsos positivos aceptados de forma explícita y documentada
  ([`DETECCION_AMENAZAS.md`](DETECCION_AMENAZAS.md)).
- Documentación por audiencia: [novatos](MANUAL_PARA_NOVATOS.md),
  [usuarios](MANUAL_USUARIO.md), [operadores](OPERACION.md) y
  [desarrolladores](HEURISTICAS.md).

### Ingeniería de entrega

- Cero dependencias, con puerta automática que rompe el build si alguien añade
  una.
- CI en tres sistemas operativos × dos versiones de Node, actions pinneadas a
  SHA, permisos mínimos.
- Empaquetado Windows reproducible: descarga el runtime oficial, **verifica su
  SHA-256** y registra la procedencia en `BUILD-INFO.json`.
- Verificación del artefacto en tres momentos distintos, porque un binario que
  compila puede instalarse vacío.

### Criterio técnico

El ADR sobre plataforma y lenguaje es probablemente lo más representativo:
argumenta por qué **no** migrar a Rust hoy, **declara el coste** de esa decisión
(cargar con el runtime y republicar ante cada CVE de Node) y fija cuatro
disparadores concretos para revertirla. Sabe también decir que no: descarta Go y
descarta el despliegue web alojado, con motivos.

---

## 📊 Números

| Métrica | Valor |
|---|---|
| Dependencias de producción y desarrollo | 0 |
| Líneas de código de la aplicación | ~3.000 |
| Pruebas automatizadas | 50 |
| Invariantes verificados con la app en marcha | 20 |
| Reglas de detección | 26, en siete familias, cada una con su ficha |
| Etapas de auditoría de custodia | 14, con informe y plan de remediación |
| Puertas de calidad | 7, todas ejecutables en local |
| Trabajos de CI por push | 14 |
| Sistemas operativos probados | 3 |
| Formatos de distribución Windows | 2 + checksums |

---

## 🔍 Cómo verificarlo sin creerme

~~~bash
git clone https://github.com/vladimiracunadev-create/rootcause-bitcoin-defense
cd rootcause-bitcoin-defense
node scripts/check-security-claims.js
~~~

No hace falta `pnpm install` porque no hay nada que instalar. En unos segundos verás las
veinte comprobaciones, incluidos los cinco intentos de colarle material secreto
a la aplicación y su rechazo.

---

## ⚖️ Lo que este repositorio NO demuestra

Por si el juicio tiene que ser completo:

- **No hay trabajo de escalabilidad distribuida.** Es una aplicación local de un
  solo usuario, a propósito.
- **No hay frontend moderno con framework.** El panel es HTML, CSS y JS sin
  dependencias, coherente con el resto del proyecto, pero no acredita React,
  Angular ni Vue —eso está en otros repositorios del autor.
- **No hay base de datos.** El estado es un archivo cifrado.
- **La comunidad es de uno.** No hay revisión de terceros todavía; por eso todas
  las afirmaciones del proyecto son comprobaciones ejecutables.

---

## 🔗 Contexto

Cuarta edición de la familia RootCause, junto a
[Windows Inspector](https://github.com/vladimiracunadev-create/rootcause-windows-inspector) (Rust),
[Web Inspector](https://github.com/vladimiracunadev-create/rootcause-web-inspector) (JavaScript) y
[Mobile Inspector](https://github.com/vladimiracunadev-create/rootcause-mobile-inspector) (Flutter).
Cuatro dominios, tres lenguajes, un mismo criterio: causa raíz con evidencia,
todo local y con los límites por delante. Comparativa en
[`CATALOGO_PRODUCTO.md`](CATALOGO_PRODUCTO.md).
