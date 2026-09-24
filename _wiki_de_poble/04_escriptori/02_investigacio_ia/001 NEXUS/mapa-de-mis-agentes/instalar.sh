#!/bin/bash
# Mapa de mis agentes · instalador para Mac y Linux.
# Qué hace: comprueba que existe `uv` (si no, lo instala desde astral.sh, el instalador oficial),
# y genera el mapa. No toca nada más. Se ejecuta desde la carpeta descomprimida:
#   bash instalar.sh                 # dibuja LA CARPETA DESDE LA QUE LO EJECUTAS (y deja el HTML ahí)
#   bash instalar.sh /ruta/carpeta   # dibuja otra carpeta (p. ej. tu vault)
set -e
AQUI="$(cd "$(dirname "$0")" && pwd)"
if ! command -v uv >/dev/null 2>&1 && [ ! -x "$HOME/.local/bin/uv" ]; then
  echo "· uv no está instalado; lo instalo (instalador oficial de astral.sh)…"
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:/opt/homebrew/bin:$PATH"
if [ -n "$1" ]; then
  uv run "$AQUI/mapa_agentes.py" --raiz "$1"
else
  uv run "$AQUI/mapa_agentes.py"
fi
echo "· Listo. Abre «Mapa de mis agentes v0.1.html», que está en la carpeta desde la que lo has ejecutado."
