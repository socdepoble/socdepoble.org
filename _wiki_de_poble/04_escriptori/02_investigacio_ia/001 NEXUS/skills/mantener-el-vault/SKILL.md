---
name: mantener-el-vault
description: Cada día a las 02:30 comprueba el vault: notas sin enlaces, tareas hechas de más de siete días para archivar, logs viejos, y deja un aviso si algo se rompió.
tipo: meta
version: "1.0"
visibilidad: ejemplo
---

# mantener-el-vault

> Skill de EJEMPLO incluida con «Mapa de mis agentes»: enseña cómo se escribe una skill que declara qué lee y qué produce. Puedes borrarla o copiarla para hacer la tuya.

## Cuándo usar
Programada: **cada día a las 02:30**, de madrugada, para no gastar tokens en horas de trabajo.

## Entradas
- Lee `020 PROYECTOS/` (tareas hechas de más de siete días).
- Lee `000 LOGS/` (logs de más de treinta días).
- Lee `200 MEMORIA DIGITAL/` buscando notas sin ningún enlace.

## Salidas
- Mueve las tareas hechas antiguas a `902 ARCHIVO/tareas/`.
- Mueve los logs viejos a `902 ARCHIVO/logs/`.
- Escribe el informe en `000 LOGS/AAAA-MM-DD.md` y, si hay avisos, crea una tarea urgente con la skill `crear-tarea`.

## Instrucciones
Todo con scripts deterministas; ningún paso decide nada por su cuenta. Lo que falle se declara.
