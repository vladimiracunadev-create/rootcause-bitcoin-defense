# Checklist de seguridad — comprobaciones antes de cada paso irreversible

| Checklist | Cuándo | Qué garantiza |
| --- | --- | --- |
| Antes de cada release | Al publicar un artefacto | Que lo que se distribuye superó las puertas y se puede verificar |
| Antes de conectar un nodo | Al salir del modo demostración | Que el RPC es local, mínimo y de solo lectura |
| Antes de registrar custodia real | Al introducir wallets con fondos | Que el estado está cifrado y el runbook está ensayado |
| Wallet | Por cada wallet nueva | Que la procedencia está documentada y el quorum tiene margen |
| Proveedor y privacidad | Al tratar datos de terceros | Que identidad y titularidad no comparten dominio de confianza |

> **Buena parte de esto lo comprueba ahora una máquina.** `node scripts/audit-bitcoin.js`
> cubre las etapas automatizables ([`AUDITORIA_14_ETAPAS.md`](AUDITORIA_14_ETAPAS.md));
> lo que queda en esta lista es lo que exige criterio humano.

## Antes de cada release

- [ ] pnpm check termina correctamente.
- [ ] No existen package-lock.json, yarn.lock ni npm-shrinkwrap.json.
- [ ] No hay tests enfocados con only.
- [ ] No hay secretos o datos reales en ejemplos.
- [ ] Los advisories tienen fuente y verifiedAt.
- [ ] Los rangos incluyen pruebas de límites.
- [ ] No apareció ningún método RPC de escritura.
- [ ] RPC remoto sigue deshabilitado por defecto.
- [ ] CSP no permite inline, eval ni terceros.
- [ ] El service worker no cachea API.
- [ ] La aplicación no registra body completo.
- [ ] El ZIP tiene hash SHA-256.
- [ ] El changelog está actualizado.

## Antes de conectar un nodo

- [ ] Nodo controlado y actualizado.
- [ ] RPC enlazado a localhost.
- [ ] Cookie con permisos mínimos.
- [ ] Proceso RootCause bajo usuario separado.
- [ ] Firewall revisado.
- [ ] Backup del nodo y wallet según política.
- [ ] Sin wallet privada cargada si no es necesaria.
- [ ] Watchtower probado en regtest.

## Antes de registrar custodia real

- [ ] Autenticación externa.
- [ ] TLS o acceso local.
- [ ] Clave de datos en gestor de secretos.
- [ ] Backup cifrado.
- [ ] Retención definida.
- [ ] Operadores autorizados.
- [ ] Segundo nodo de verificación.
- [ ] Inventario validado por dos personas.
- [ ] Runbook ensayado.
- [ ] Revisión independiente completada.

## Wallet

- [ ] Firmware al crear la seed documentado.
- [ ] Fingerprint verificado.
- [ ] Origen de entropía documentado.
- [ ] Avisos revisados.
- [ ] Quorum independiente.
- [ ] Destinos verificados físicamente.
- [ ] Backups separados y probados.
- [ ] Ninguna seed en RootCause.

## Proveedor y privacidad

- [ ] Solo datos necesarios.
- [ ] TTL automático.
- [ ] Accesos auditados.
- [ ] Bulk export alertado.
- [ ] PII separada de direcciones.
- [ ] Contratos incluyen eliminación.
- [ ] Plan de comunicación contra phishing.
