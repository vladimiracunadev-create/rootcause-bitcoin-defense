# Política de seguridad

RootCause Bitcoin Defense procesa información sensible de custodia, aunque no
debe procesar material secreto. Trátalo como un componente de alta criticidad.

## Modelo de uso soportado

- instancia local o dentro de una red privada controlada;
- un solo dominio administrativo;
- Bitcoin Core accesible por localhost, socket privado o túnel autenticado;
- datos cifrados en reposo cuando se desactiva el modo demostración;
- acceso al dashboard protegido por una capa de identidad externa antes de
  cualquier despliegue multiusuario.

La versión 0.1.0 no incluye autenticación multiusuario. No debe publicarse
directamente en Internet.

## Datos que nunca se aceptan

- palabras de recuperación;
- semillas;
- passphrases BIP-39;
- claves privadas;
- WIF;
- xprv o tprv;
- backups de wallet;
- PIN de un dispositivo;
- PSBT completas.

La API rechaza nombres de campos asociados a secretos y patrones de claves
privadas. Esta protección reduce errores accidentales; no autoriza a enviar
secretos para probarla.

## Datos públicos que siguen siendo sensibles

Fingerprints, descriptores watch-only, xpub, direcciones y saldos pueden revelar
la estructura financiera de una organización. Esta versión registra
fingerprints, pero no descriptores ni xpub. Si se agrega monitoreo por
descriptores:

1. mantenerlos cifrados localmente;
2. separar identidad personal y actividad on-chain;
3. limitar exportaciones;
4. registrar todo acceso;
5. definir vencimiento y eliminación.

## Bitcoin Core RPC

La aplicación:

- rechaza URLs con credenciales incrustadas;
- acepta solo HTTP o HTTPS;
- restringe el destino a loopback por defecto;
- aplica timeout;
- limita el tamaño de respuesta;
- permite únicamente métodos explícitos de lectura.

La allowlist no es una frontera de seguridad suficiente. Usa un usuario
dedicado, permisos de sistema operativo, contenedor o máquina separada. No
expongas RPC a Internet.

## Acciones prohibidas

- guardar claves en la aplicación;
- firmar en el servidor;
- desbloquear wallets mediante RPC;
- transmitir automáticamente una operación de recuperación;
- cambiar reglas Bitcoin Core automáticamente;
- confiar en una respuesta de IA para autorizar fondos;
- afirmar que una transacción confirmada puede revertirse.

## Comunicación de vulnerabilidades

Usa el mecanismo privado de reporte de seguridad del repositorio donde se
publique este proyecto. No abras una incidencia pública que contenga:

- direcciones reales;
- fingerprints reales;
- txid todavía no divulgados;
- rutas internas;
- credenciales;
- datos personales;
- detalles explotables antes de coordinar una corrección.

Incluye versión, entorno, impacto, pasos mínimos de reproducción con datos
ficticios y una propuesta de mitigación si existe.

## Respuesta del mantenedor

1. confirmar recepción;
2. reproducir sin usar fondos reales;
3. asignar severidad;
4. preparar corrección y pruebas;
5. coordinar divulgación;
6. publicar un aviso con rangos afectados y acciones;
7. mantener un registro de decisiones.

## Dependencias y compilación

El runtime no tiene dependencias de producción externas. Cada cambio debe
conservar:

- Node.js soportado;
- pnpm como único gestor cuando corresponda;
- validación sintáctica;
- pruebas unitarias y de API;
- procedencia verificable del artefacto de release;
- hash SHA-256 del ZIP o binario distribuido.

## Verificar un artefacto de Windows

Cada release publica `SHA256SUMS.txt`. Antes de ejecutar nada:

~~~powershell
Get-FileHash .\RootCause-Bitcoin-Defense-0.2.0-win-x64-setup.exe -Algorithm SHA256
~~~

El resultado debe coincidir, carácter a carácter, con la línea correspondiente
del archivo de sumas. Los binarios no están firmados con certificado de código
todavía, así que el hash publicado es la verificación disponible: si no
coincide, no ejecutes el archivo y abre un aviso.

Dentro del paquete, `BUILD-INFO.json` registra la versión exacta del motor
Node.js incluido y el SHA-256 con el que se verificó al empaquetar, contra
`SHASUMS256.txt` de nodejs.org.

Consulta docs/THREAT_MODEL.md, docs/SECURITY-CHECKLIST.md y docs/WINDOWS-APP.md.
