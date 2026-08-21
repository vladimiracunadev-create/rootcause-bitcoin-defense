# Contribuir

| Tu cambio debe pasar | Comando |
| --- | --- |
| Las cinco puertas de calidad | `pnpm check` |
| El estilo visual de la documentación | `node scripts/check-doc-style.js` |
| Los secretos del histórico | `node scripts/check-history-secrets.js --staged` |
| La auditoría de custodia, si tocas reglas o configuración | `node scripts/audit-bitcoin.js` |

> **Dos cosas no se negocian y las zanja el CI, no una opinión:** ninguna
> contribución puede introducir la capacidad de recibir, almacenar o usar
> material secreto, ni una dependencia de terceros.

## Preparación

~~~bash
corepack enable
pnpm check
pnpm start
~~~

No uses npm ni generes package-lock.json. El proyecto no necesita instalar
paquetes para funcionar.

## Flujo

1. Describe el riesgo o caso operacional.
2. Agrega una prueba que represente el fallo.
3. Implementa la corrección más pequeña.
4. Ejecuta pnpm check.
5. Actualiza documentación y changelog.
6. Verifica que ningún dato real o secreto quede en ejemplos.

## Nuevas reglas

Toda regla debe incluir:

- código estable;
- entidad;
- severidad justificada;
- síntoma;
- causa raíz;
- evidencia mínima y redactada;
- remediación segura;
- prueba positiva;
- prueba negativa;
- fuente oficial cuando dependa de un aviso externo.

Una regla no puede ordenar automáticamente una transacción, firma, aumento de
comisión, cierre de canal o movimiento de fondos.

## Avisos

config/advisories.json es información fechada, no una verdad permanente.

- usa fuentes primarias;
- registra publishedAt y verifiedAt;
- distingue hechos confirmados de estimaciones;
- no amplíes rangos afectados por intuición;
- agrega una prueba de límite inferior, superior y versión corregida.

## Interfaz

- conserva accesibilidad por teclado;
- escapa contenido que provenga de usuarios o feeds;
- no agregues scripts, fuentes o trackers de terceros;
- la PWA nunca debe cachear respuestas de API;
- la interfaz debe explicar los límites del producto.

## Integración con RootCause

Antes de modificar el producto RootCause existente:

1. inspecciona su estructura, stack y convenciones;
2. reutiliza collectors, reglas, correlador, evidencia y auditoría;
3. implementa este repositorio como dominio o adaptador;
4. evita duplicar servicios ya existentes;
5. documenta cualquier razón fuerte para cambiar el stack.
