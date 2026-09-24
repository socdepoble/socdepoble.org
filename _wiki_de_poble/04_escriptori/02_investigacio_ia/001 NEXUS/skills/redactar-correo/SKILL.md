---
name: redactar-correo
description: Convierte una idea de correo en un borrador de la newsletter, en tu voz, y lo deja en la carpeta de correos y como borrador en la herramienta de envío (nunca lo envía).
tipo: creación
version: "1.0"
visibilidad: ejemplo
---

# redactar-correo

> Skill de EJEMPLO incluida con «Mapa de mis agentes»: enseña cómo se escribe una skill que declara qué lee y qué produce. Puedes borrarla o copiarla para hacer la tuya.

## Cuándo usar
Cuando dices «correo: …» o hay ideas de tipo correo pendientes en `001 CAPTURA/CODEX/`.

## Entradas
- Lee la idea (texto o nota de `001 CAPTURA/CODEX/`).
- Lee `050 ACTIVOS/NEGOCIO/Reglas de estilo.md` (voz, apertura, cierre).

## Salidas
- Escribe `050 ACTIVOS/NEGOCIO/CORREOS/AAAA-MM-DD - <asunto>.md` con `status: borrador`.
- Sube el borrador a la herramienta de correo (API) sin audiencia y sin fecha.
- Deja la tarea «Revisar y programar el correo» con la skill `crear-tarea`.

## Instrucciones
1. Lee la idea y las reglas de estilo. 2. Escribe asunto, apertura sin saludo, cuerpo, CTA y firma. 3. Guarda, sube el borrador y crea la tarea. Nunca enviar.
