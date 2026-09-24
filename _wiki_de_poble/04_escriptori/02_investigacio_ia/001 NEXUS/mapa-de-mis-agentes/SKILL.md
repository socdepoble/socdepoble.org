---
name: mapa-de-mis-agentes
description: Dibuja en un HTML todo lo que tienes montado con IA — skills, agentes, quién llama a quién, lo que corre solo — y lo que te falta para que sea un sistema. Solo lee; no usa internet ni claves.
version: "0.1"
ultimo_uso_tablero: nunca
---

# Mapa de mis agentes

> La mayoría de la gente tiene un montón de skills y no sabe cómo funcionan entre sí. Esta skill las dibuja: qué hay, qué hace cada una, cuál llama a cuál, cuál está huérfana, cuál corre sola de madrugada… y qué falta para que todo eso trabaje junto sin ti.

## Qué hace (y qué no)

- **Dibuja la carpeta desde la que lo ejecutas** (cada uno la suya: su proyecto, su vault, su carpeta de agentes) y además **lee** las carpetas de skills y agentes de tus herramientas: Claude Code (`~/.claude/skills`, `~/.claude/agents`, `.claude/` del proyecto), Codex, Gemini CLI, Cursor; tu `CLAUDE.md`/`AGENTS.md`; y tus tareas programadas (cron, launchd, Tareas programadas de Windows). Con `--raiz` dibuja otra carpeta en vez de la actual.
- **Escribe un solo fichero**: `Mapa de mis agentes v0.1.html`, en la carpeta desde la que lo ejecutas. Se abre con doble clic.
- **No** usa internet, **no** pide claves, **no** modifica nada. Puedes leer el script entero: cabe en una pantalla larga.

## Cómo se usa

Dile a tu agente (Claude Code, Codex, Gemini CLI…):

> «Instala y ejecuta la skill mapa-de-mis-agentes que acabo de descargar en <carpeta>.»

O a mano, desde la carpeta descomprimida:

```
bash instalar.sh                              # Mac / Linux
powershell -ExecutionPolicy Bypass -File instalar.ps1    # Windows
```

El instalador comprueba que tienes `uv` (si no, lo instala con el instalador oficial de astral.sh) y genera el mapa. Ejecútalo desde la carpeta que quieras dibujar; o dile cuál: `bash instalar.sh /ruta/a/tu/vault`.

## Las seis pestañas

1. **Flujos trabajo skills** — cadenas de skills que el mapa **infiere** cruzando lo que cada una dice que lee y que escribe, y las llamadas reales entre ellas. Nadie las ha declarado: son flujos posibles; cada paso explica el enlace.
2. **Calendario** — arriba, tres cajas con todo lo programado junto (diarias · semanales · mensuales); debajo, el mes con un punto por arranque. Solo salen las skills y agentes **que tienen alguna programación**: el programa barre tu crontab, tus LaunchAgents (Mac), tus Tareas programadas (Windows) y el texto de las skills buscando horarios escritos («cada día a las 02:30»). En color, lo real; hueco, lo que la skill dice pero nadie lanza; en gris discontinuo y con la chapa «ejemplo», los crones virtuales.
3. **Skills** — el inventario con lo que se puede saber de verdad de cada una: nombre, herramienta, qué hace, tamaño, cuándo se tocó, y un semáforo con avisos (sin descripción, no dice cuándo se activa, sin tocar en 90 días, demasiado larga, casi vacía, duplicada, huérfana). Con buscador y filtros; «solo las mías» quita las de ejemplo.
4. **Entradas y salidas** — para cada skill, qué lee (izquierda) y qué produce y dónde lo deja (derecha), inferido de su texto con tres niveles de confianza (declarado / inferido / supuesto); las que no dicen nada son «cajas opacas». Debajo, a qué skills llama de verdad.
5. **Agentes atómicos** — los flujos **declarados** con contratos (`flujos.yml` y perfiles). Si no hay ninguno, lo dice, enseña un flujo real del autor como ejemplo (marcado) y, debajo, las cuatro cajas de lo que falta: flujos, tablero, agentes que trabajan solos, quién avisa cuando algo se rompe.
6. **Actores** — el plano de lo que hay alrededor de tus agentes en esta máquina: tú y por dónde hablas, qué arneses hay instalados y si tienen fichero de instrucciones, tablero, lanzador, vigilante, qué corre solo, candados y sobre qué carpeta trabajan. Lo que existe con trazo lleno; lo que falta, en gris.

Todo lo que viene incluido con el mapa (skills, agentes y tareas de ejemplo) lleva la chapa naranja **EJEMPLO**, y cada pestaña lo avisa arriba.

## Para el agente que la instale

1. Ejecuta el instalador de tu sistema (arriba). Si `uv` ya está, tarda dos segundos.
2. Ejecútalo DESDE la carpeta que el usuario quiere dibujar (su proyecto o su vault); si te lo pide para otra, `--raiz <carpeta>`.
3. Dile al usuario dónde ha quedado `Mapa de mis agentes v0.1.html` (en la carpeta desde la que lo ejecutaste) y que se abre con doble clic. No subas el fichero a ningún sitio: es suyo.
4. Si algo falla, el mensaje de error lo dice en castellano; no instales nada más que `uv`.

## Registro

- **v0.1 (2026-09-16)** — borrador. Probado sobre la carpeta personal de agentes del autor (88 skills y agentes, 273 llamadas, 6 programadas). Pendiente: probar en un ordenador sin nada montado (debe salir un mapa casi vacío con las cuatro cajas en gris), en Windows, y decidir el enlace de la caja gris.
- **v0.1 (2026-09-17; renumerada el 18-09)** — versión pública: seis pestañas, chapa «ejemplo» en todo lo incluido con el mapa, figura de un flujo real cuando no hay agentes atómicos, pestaña Actores, resumen del calendario por cadencia, versión en el nombre del fichero. Manual de instalación en PDF en la carpeta.
