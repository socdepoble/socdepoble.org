#!/bin/sh
set -eu

usage() {
  printf '%s\n' "Ús: $0 [--replace] entrada.html eixida.pdf" >&2
  exit 2
}

REPLACE=0
if [ "${1:-}" = "--replace" ]; then
  REPLACE=1
  shift
fi
[ "$#" -eq 2 ] || usage

INPUT=$1
OUTPUT=$2
[ -f "$INPUT" ] || { printf '%s\n' "Entrada inexistent: $INPUT" >&2; exit 2; }
[ "${OUTPUT##*.}" = "pdf" ] || { printf '%s\n' "El destí ha d'acabar en .pdf" >&2; exit 2; }

OUTPUT_DIR=$(CDPATH= cd -- "$(dirname -- "$OUTPUT")" && pwd)
OUTPUT_NAME=$(basename -- "$OUTPUT")
OUTPUT_ABS="$OUTPUT_DIR/$OUTPUT_NAME"
INPUT_ABS=$(CDPATH= cd -- "$(dirname -- "$INPUT")" && pwd)/$(basename -- "$INPUT")
[ "$INPUT_ABS" != "$OUTPUT_ABS" ] || { printf '%s\n' "Entrada i eixida no poden coincidir" >&2; exit 2; }

if [ -e "$OUTPUT_ABS" ] && [ "$REPLACE" -ne 1 ]; then
  printf '%s\n' "El destí ja existeix; usa --replace per crear una còpia .bak: $OUTPUT_ABS" >&2
  exit 3
fi

if [ -n "${CHROME_BIN:-}" ]; then
  CHROME=$CHROME_BIN
elif command -v google-chrome >/dev/null 2>&1; then
  CHROME=$(command -v google-chrome)
elif command -v chromium >/dev/null 2>&1; then
  CHROME=$(command -v chromium)
elif [ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
else
  printf '%s\n' "No s'ha trobat Chrome/Chromium; defineix CHROME_BIN" >&2
  exit 2
fi
[ -x "$CHROME" ] || { printf '%s\n' "CHROME_BIN no és executable: $CHROME" >&2; exit 2; }

TEMP_PDF=
SDP_PDF_BROWSER_DIR=
cleanup() {
  if [ -n "$TEMP_PDF" ] && [ -e "$TEMP_PDF" ]; then
    unlink "$TEMP_PDF"
  fi
  if [ -n "$SDP_PDF_BROWSER_DIR" ]; then
    rm -rf -- "$SDP_PDF_BROWSER_DIR"
  fi
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

TEMP_PDF=$(mktemp "$OUTPUT_DIR/.${OUTPUT_NAME}.XXXXXX")
# Chrome no ha de llegir el perfil, la memòria cau ni el clauer de la sessió.
# Canonicalitza també un TMPDIR relatiu: les dos banderes exigixen camins absoluts.
SDP_PDF_TMP_DIR=$(CDPATH= cd -- "${TMPDIR:-/tmp}" && pwd -P)
SDP_PDF_BROWSER_DIR=$(mktemp -d "$SDP_PDF_TMP_DIR/sdp-pdf.XXXXXX")
mkdir "$SDP_PDF_BROWSER_DIR/profile" "$SDP_PDF_BROWSER_DIR/cache"

INPUT_URI=$(python3 -c 'from pathlib import Path; import sys; print(Path(sys.argv[1]).resolve().as_uri())' "$INPUT_ABS")

"$CHROME" \
  --headless \
  --disable-gpu \
  "--user-data-dir=$SDP_PDF_BROWSER_DIR/profile" \
  "--disk-cache-dir=$SDP_PDF_BROWSER_DIR/cache" \
  --use-mock-keychain \
  --password-store=basic \
  --no-pdf-header-footer \
  "--print-to-pdf=$TEMP_PDF" \
  "$INPUT_URI" >/dev/null 2>&1

[ -s "$TEMP_PDF" ] || { printf '%s\n' "Chrome no ha generat cap PDF" >&2; exit 1; }
[ "$(head -c 5 "$TEMP_PDF")" = "%PDF-" ] || { printf '%s\n' "L'eixida no té capçalera PDF" >&2; exit 1; }
PDF_BYTES=$(wc -c < "$TEMP_PDF" | tr -d ' ')
[ "$PDF_BYTES" -ge 1000 ] || { printf '%s\n' "PDF sospitosament menut: $PDF_BYTES bytes" >&2; exit 1; }

if [ -e "$OUTPUT_ABS" ]; then
  BACKUP="$OUTPUT_ABS.bak.$(date -u +%Y%m%dT%H%M%SZ)"
  [ ! -e "$BACKUP" ] || { printf '%s\n' "La còpia de seguretat ja existeix: $BACKUP" >&2; exit 3; }
  cp -p "$OUTPUT_ABS" "$BACKUP"
  printf '%s\n' "Versió anterior preservada: $BACKUP"
fi

mv -f "$TEMP_PDF" "$OUTPUT_ABS"
printf '%s\n' "PDF verificat: $OUTPUT_ABS ($PDF_BYTES bytes)"
