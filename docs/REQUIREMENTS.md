# Requisitos

Separados en dos: lo que necesitas para **usar** el producto y lo que necesitas
para **desarrollarlo**. La lista es corta a propósito.

---

## Para usar la aplicación de Windows

| Requisito | Detalle |
|---|---|
| Windows 10 o 11, x64 | No hay compilación ARM64 todavía |
| ~120 MB de disco | La aplicación instalada, con su motor incluido |
| Un navegador | Cualquiera moderno; se usa el predeterminado del sistema |
| Permisos | **Ninguno especial.** Instalación por usuario, sin UAC |
| Internet | **No hace falta.** Solo para descargar el instalador |
| Node.js | **No hace falta.** Viaja dentro del paquete |

Opcional, para las capacidades de nodo:

| Opcional | Para qué |
|---|---|
| Bitcoin Core en la misma máquina | Reglas `BTC-NODE-*` y vigilancia de gastos |
| Acceso de lectura a su `.cookie` | Autenticación RPC sin escribir contraseñas |

---

## Para usar el panel desde el código

| Requisito | Versión |
|---|---|
| Node.js | **22.12 o superior** (probado en 22 y 24) |
| Sistema | Windows, Linux o macOS |
| pnpm | Opcional. Solo para los atajos `pnpm <script>` |
| Dependencias externas | **Ninguna.** No hay `node_modules` que instalar |

~~~bash
node --version   # debe ser >= v22.12
node src/server.js
~~~

---

## Para desarrollar

| Requisito | Para qué |
|---|---|
| Node.js 22.12+ | Ejecutar y probar |
| Git | Lo evidente |
| PowerShell 5.1+ | Empaquetar la edición de Windows |
| Inno Setup 6 | Compilar el instalador (`choco install innosetup`) |
| `gh` | Releases y workflows |
| `actionlint` | Validar los workflows antes de subirlos (opcional pero recomendable) |

Nada de lo anterior se instala como dependencia del proyecto. El repositorio
tiene cero dependencias y una puerta de calidad que rompe el build si alguien
añade una: [`../scripts/check-local-only.js`](../scripts/check-local-only.js).

---

## Para el laboratorio Bitcoin

| Requisito | Nota |
|---|---|
| Bitcoin Core | Modo `regtest`, con la configuración de [`../labs/regtest/`](../labs/regtest/README.md) |
| ~1 GB de disco | Para una cadena `regtest` de pruebas |

Para `mainnet` real, Bitcoin Core necesita del orden de 700 GB (o ~10 GB
podado). Esta aplicación no cambia esos requisitos: solo lee.

---

## Compatibilidad declarada

| Componente | Rango soportado | Dónde se verifica |
|---|---|---|
| Node.js | 22.12 → 24.x | Matriz de CI: 22 y 24, en Windows, Linux y macOS |
| Windows | 10 y 11 x64 | Job `app-windows`, que empaqueta y arranca la aplicación |
| Bitcoin Core | 26.x → 29.x | Los 14 métodos RPC usados son estables desde hace años |
| Navegadores | Cualquiera con soporte de módulos ES y CSS Grid | El panel no usa dependencias ni transpilación |

Si funciona fuera de esos rangos, bien; pero no está comprobado, y este
documento solo afirma lo que la CI comprueba.

---

## Lo que el producto NO requiere, y conviene subrayar

- **No requiere cuenta.** No hay registro, ni login, ni servidor.
- **No requiere permisos de administrador.**
- **No requiere conexión saliente.** Ni telemetría, ni actualizaciones
  automáticas, ni consultas a terceros.
- **No requiere tus claves.** Nunca, bajo ninguna configuración.
