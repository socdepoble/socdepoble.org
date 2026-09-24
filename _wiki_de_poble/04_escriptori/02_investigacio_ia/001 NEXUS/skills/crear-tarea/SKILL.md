---
name: crear-tarea
description: Crea una tarea en el tablero personal (nota con frontmatter: título, estado, fecha) sin abrir Obsidian.
tipo: acción
version: "1.0"
visibilidad: ejemplo
---

# crear-tarea

> Skill de EJEMPLO incluida con «Mapa de mis agentes»: enseña cómo se escribe una skill que declara qué lee y qué produce. Puedes borrarla o copiarla para hacer la tuya.

## Cuándo usar
Cuando dices «apunta la tarea …» o la monta otra skill que necesita dejar algo pendiente.

## Entradas
- Lee el título y el estado (urgente, cuanto antes, trimestre) que le pasan.

## Salidas
- Escribe `020 PROYECTOS/AAAA-MM-DD - Tarea <título>.md` con `categoría: tarea`, `status` y `dateCreated`.

## Instrucciones
```
uv run --no-project crear_tarea.py --titulo "<título>" --status urgente
```
