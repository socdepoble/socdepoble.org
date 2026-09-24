---
name: revisar-lo-capturado
description: Cada lunes a las 08:00 repasa lo capturado en la semana, decide qué merece procesarse y lo convierte en notas de Conocimiento enlazadas.
tipo: conexión
version: "1.0"
visibilidad: ejemplo
---

# revisar-lo-capturado

> Skill de EJEMPLO incluida con «Mapa de mis agentes»: enseña cómo se escribe una skill que declara qué lee y qué produce. Puedes borrarla o copiarla para hacer la tuya.

## Cuándo usar
Programada: **los lunes a las 08:00**. O cuando dices «procesa lo de esta semana».

## Entradas
- Lee `001 CAPTURA/YouTube/000 Varios vídeos.md` y `001 CAPTURA/CODEX/` (lo de los últimos siete días).
- Lee `200 MEMORIA DIGITAL/index.md` para saber en qué carpeta va cada tema.

## Salidas
- Escribe o amplía notas en `200 MEMORIA DIGITAL/<tema>/` con `#procesar` para que las revises.
- Deja una tarea «Revisar lo procesado esta semana» en `020 PROYECTOS/` ejecutando la skill `crear-tarea`.

## Instrucciones
1. Lista lo capturado en la semana y descarta lo que no aporte.
2. Para cada pieza que valga, busca en el índice la carpeta y escribe la nota enlazada.
3. Crea la tarea de revisión con `crear-tarea`.
