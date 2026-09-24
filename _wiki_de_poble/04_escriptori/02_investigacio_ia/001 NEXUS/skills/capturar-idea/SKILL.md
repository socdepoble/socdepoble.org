---
name: capturar-idea
description: Guarda una idea dictada o escrita como nota en Recursos externos, con fecha, tipo y estado pendiente, para procesarla después.
tipo: captura
version: "1.0"
visibilidad: ejemplo
---

# capturar-idea

> Skill de EJEMPLO incluida con «Mapa de mis agentes»: enseña cómo se escribe una skill que declara qué lee y qué produce. Puedes borrarla o copiarla para hacer la tuya.

## Cuándo usar
Cuando dices «apunta esta idea», «idea de vídeo: …», «idea para un correo: …» o mandas una nota de voz con una idea.

## Entradas
- Lee la idea tal cual la dictas (texto o transcripción de la nota de voz).
- Lee `001 CAPTURA/CODEX/` para no duplicar una idea que ya exista.

## Salidas
- Escribe una nota nueva en `001 CAPTURA/CODEX/AAAA-MM-DD - Idea <tipo> <resumen>.md` con `categoría: idea`, `tipo` y `status: pendiente`.

## Instrucciones
1. Decide el tipo (vídeo, correo, artículo, pensar) por lo que dice la idea; si hay duda, pregunta.
2. Crea la nota en `001 CAPTURA/CODEX/` con el frontmatter y el texto literal.
3. Responde con la ruta creada. No la desarrolles: eso lo hace la skill `valorar-idea`.
