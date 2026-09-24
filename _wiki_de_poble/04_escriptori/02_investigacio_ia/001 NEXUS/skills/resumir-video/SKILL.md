---
name: resumir-video
description: Descarga la transcripción de un vídeo de YouTube, lo resume en cinco líneas, saca dos o tres ideas y lo guarda en Recursos externos.
tipo: comprensión
version: "1.0"
visibilidad: ejemplo
---

# resumir-video

> Skill de EJEMPLO incluida con «Mapa de mis agentes»: enseña cómo se escribe una skill que declara qué lee y qué produce. Puedes borrarla o copiarla para hacer la tuya.

## Cuándo usar
Cuando mandas una URL de YouTube con «resúmeme esto» o «¿me aporta algo?».

## Entradas
- Lee la URL del vídeo (youtube.com o youtu.be).
- Descarga la transcripción con `yt-dlp` (sin descargar el vídeo).

## Salidas
- Guarda la transcripción en `001 CAPTURA/YouTube/transcripts/AAAA-MM-DD_<título>.md`.
- Añade el resumen y las ideas a `001 CAPTURA/YouTube/000 Varios vídeos.md`.
- Si sale una idea de vídeo propia, ejecuta la skill `capturar-idea`.

## Instrucciones
1. Descarga la transcripción; si YouTube devuelve 429, dilo y no insistas.
2. Resume en cinco líneas y saca dos o tres ideas con su ángulo.
3. Responde con el resumen y guarda los ficheros.
