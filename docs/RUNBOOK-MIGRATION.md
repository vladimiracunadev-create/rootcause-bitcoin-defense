# Runbook: wallet con semilla potencialmente afectada

| Fase | Qué se hace | Qué se verifica antes de seguir |
| --- | --- | --- |
| 1 · Activación | Confirmar que el aviso te afecta de verdad | Modelo, canal y firmware al crear la semilla contra la fuente oficial |
| 2 · Contención | Dejar de recibir en la wallet afectada | Ninguna dirección nueva emitida |
| 3 · Preparación | Equipo limpio, responsable y segunda persona | Saldo confirmado desde nodos controlados |
| 4 · Nuevo destino | Crear semilla nueva en dispositivo sano | Huella y dirección **en la pantalla del dispositivo** |
| 5 · Prueba | Mover una cantidad pequeña | Confirmación en la cadena antes de continuar |
| 6 · Migración | Mover el resto | Evidencia preservada y auditoría íntegra |

> **La semilla antigua se trata como comprometida de forma permanente.** No se
> reutiliza «para cosas pequeñas».

## Advertencia

Este documento es una guía operacional de diseño. No ejecutes una migración con
fondos reales basándote solamente en esta copia. Confirma el aviso oficial del
fabricante y usa personal competente.

RootCause no debe firmar ni transmitir automáticamente.

## Condiciones de activación

- advisory oficial coincide con modelo, canal y versión usada al crear la
  semilla;
- no puede demostrarse la procedencia;
- se observa un gasto desconocido;
- un firmante de un quorum se considera comprometido.

## Prioridad

1. Proteger UTXO todavía no gastados.
2. Evitar nuevos depósitos.
3. No revelar el incidente a través de movimientos improvisados.
4. Preservar evidencia.
5. Migrar a claves realmente independientes.

## Preparación

- designar responsable y segunda persona;
- usar un equipo limpio;
- verificar fecha, hora y fuente oficial;
- registrar fabricante, modelo, firmware y fingerprint;
- confirmar saldo desde nodos controlados;
- seleccionar destino nuevo;
- comprobar backup del destino;
- definir tarifa y ventana operacional;
- preparar comunicaciones y escalamiento.

## Nuevo destino

Preferir una wallet multisig 2-de-3:

- tres semillas independientes;
- fabricantes o implementaciones diferentes;
- ubicaciones diferentes;
- fingerprints verificados;
- descriptor construido y revisado;
- backup probado;
- dirección confirmada en cada dispositivo.

No reutilizar la seed afectada como firmante del nuevo quorum.

## Migración

1. Desactivar nuevas direcciones de depósito de la wallet afectada.
2. Denegar nuevas aprobaciones rutinarias.
3. Crear una dirección en el destino.
4. Verificarla físicamente en los dispositivos del nuevo quorum.
5. Crear una transacción pequeña de prueba.
6. Revisar inputs, output, cambio y tarifa.
7. Firmar fuera de RootCause.
8. Transmitir mediante un flujo aprobado.
9. Esperar la política de confirmaciones definida.
10. Comprobar recepción desde un nodo independiente.
11. Preparar la migración restante.
12. Repetir revisión de destino y cambio.
13. Firmar y transmitir.
14. Vigilar mempool y confirmación.
15. Retirar la wallet antigua.

## Si aparece un gasto desconocido

- no asumas que puede cancelarse;
- verifica el txid en más de un nodo;
- identifica UTXO todavía no gastados;
- detén el servicio de autorización;
- preserva logs y timestamps;
- escala al responsable;
- ejecuta la migración aprobada para fondos restantes;
- registra direcciones de destino del atacante como evidencia;
- coordina con asesoría legal, exchanges y autoridades cuando corresponda.

Una transacción confirmada no se revierte. Una transacción no confirmada tampoco
puede rescatarse de forma general y confiable.

## Cierre

- saldo antiguo en cero o riesgo aceptado formalmente;
- nuevos depósitos usan el descriptor nuevo;
- firmante afectado retirado;
- backups verificados;
- inventario actualizado;
- incidente documentado;
- postmortem;
- reglas y pruebas actualizadas;
- evidencia protegida según retención.
