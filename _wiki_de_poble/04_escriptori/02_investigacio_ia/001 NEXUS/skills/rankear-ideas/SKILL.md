---
name: rankear-ideas
description: Reconstruye el ranking de ideas a partir de todas las propuestas puntuadas: las mejores arriba, las guionizadas aparte. Script determinista, cero tokens.
tipo: acción
version: "1.0"
visibilidad: ejemplo
---

# rankear-ideas

> Skill de EJEMPLO incluida con «Mapa de mis agentes»: enseña cómo se escribe una skill que declara qué lee y qué produce. Puedes borrarla o copiarla para hacer la tuya.

## Cuándo usar
La monta `valorar-idea` al terminar, o cuando dices «regenera el ranking».

## Entradas
- Lee todos los ficheros de `001 CAPTURA/03 propuestas/` que tengan ideas puntuadas.

## Salidas
- Escribe entero `001 CAPTURA/03 propuestas/000 Ranking ideas.md`.

## Instrucciones
```
uv run --no-project rankear.py
```
No puntúa ni decide: ordena por la suma de las tres notas.
