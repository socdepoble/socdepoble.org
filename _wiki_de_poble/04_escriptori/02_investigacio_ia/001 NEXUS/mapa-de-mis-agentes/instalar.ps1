# Mapa de mis agentes · instalador para Windows (PowerShell).
# Comprueba que existe `uv` (si no, lo instala con el instalador oficial de astral.sh) y genera el mapa.
#   powershell -ExecutionPolicy Bypass -File instalar.ps1
#   powershell -ExecutionPolicy Bypass -File instalar.ps1 C:\ruta\carpeta   # dibuja otra carpeta en vez de la actual
$aqui = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
  Write-Host "· uv no está instalado; lo instalo (instalador oficial de astral.sh)…"
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  $env:Path = "$env:USERPROFILE\.local\bin;$env:Path"
}
if ($args.Count -gt 0) { uv run "$aqui\mapa_agentes.py" --raiz $args[0] } else { uv run "$aqui\mapa_agentes.py" }
Write-Host "· Listo. Abre «Mapa de mis agentes v0.1.html», que está en la carpeta desde la que lo has ejecutado."
