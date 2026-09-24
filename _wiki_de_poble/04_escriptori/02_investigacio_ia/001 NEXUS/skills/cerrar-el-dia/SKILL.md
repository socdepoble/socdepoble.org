---
name: cerrar-el-dia
description: Cada día a las 23:59 lee el log del día y las tareas hechas y escribe el resumen en el diario: en qué me centré, no qué toqué.
tipo: acción
version: "1.0"
visibilidad: ejemplo
---

# cerrar-el-dia

> Skill de EJEMPLO incluida con «Mapa de mis agentes»: enseña cómo se escribe una skill que declara qué lee y qué produce. Puedes borrarla o copiarla para hacer la tuya.

## Cuándo usar
Programada: **cada día a las 23:59**. También si dices «cierra el día».

## Entradas
- Lee `000 LOGS/AAAA-MM-DD.md` (lo que pasó hoy).
- Lee las tareas con `status: hecho` de `020 PROYECTOS/` modificadas hoy.

## Salidas
- Escribe la sección `## Tareas` de `900 DIARIO/AAAA-MM-DD.md` (tres a cinco viñetas y los enlaces a las tareas hechas). No toca `## Mis reflexiones`.

## Instrucciones
1. Lee el log y las tareas hechas.
2. Escribe un resumen breve y conceptual; si no hay log, no escribas nada y dilo.
3. Anota la hora real de cierre en el log.
