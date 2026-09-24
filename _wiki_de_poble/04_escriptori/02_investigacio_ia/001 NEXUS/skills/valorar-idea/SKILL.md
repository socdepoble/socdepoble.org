---
name: valorar-idea
description: Convierte una idea pendiente en una propuesta puntuada (visibilidad, búsqueda, clientes) con ángulo y tres títulos, y la deja en la carpeta de propuestas.
tipo: comprensión
version: "1.0"
visibilidad: ejemplo
---

# valorar-idea

> Skill de EJEMPLO incluida con «Mapa de mis agentes»: enseña cómo se escribe una skill que declara qué lee y qué produce. Puedes borrarla o copiarla para hacer la tuya.

## Cuándo usar
Cuando hay ideas nuevas en `001 CAPTURA/CODEX/` o cuando dices «valora esta idea».

## Entradas
- Lee la nota de la idea en `001 CAPTURA/CODEX/`.
- Lee `050 ACTIVOS/NEGOCIO/Identidad editorial.md` para juzgar el ángulo.

## Salidas
- Escribe la propuesta en `001 CAPTURA/03 propuestas/AAAA-MM-DD ideas.md` (una sección por idea, con las tres notas y el veredicto).
- Actualiza `001 CAPTURA/03 propuestas/000 Ranking ideas.md` ejecutando la skill `rankear-ideas`.

## Instrucciones
1. Lee la idea y la identidad editorial.
2. Escribe tema, ángulo, tres notas de 0 a 10, veredicto y tres títulos.
3. Ejecuta la skill `rankear-ideas` para reordenar el ranking.
