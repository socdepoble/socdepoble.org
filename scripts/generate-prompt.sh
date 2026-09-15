#!/bin/bash
# Ús: ./generate-prompt.sh --title "Refactor Backend" --type PROMPT

TEMPLATE="_wiki_de_poble/02_saber/07_plantilles/00_PLANTILLA_PROMPT_ISO.md"
BUNDLE="260915_0510_BUNDLE_auditoria.md"
OUTPUT="_wiki_de_poble/04_ESCRIPTORI/$(date +%Y%m%d_%H%M)_${1}.md"

# Copiar plantilla
cp "$TEMPLATE" "$OUTPUT"

# Omplir camps bàsics
sed -i "s/SDP-PROMPT-ITERACIO-3-EXECUCIO/SDP-PROMPT-$(date +%Y%m%d-%H%M)-${RANDOM}/g" "$OUTPUT"
sed -i "s/IAIA_MarIA/IAIA_MarIA/g" "$OUTPUT"

echo "✅ Prompt generat: $OUTPUT"
echo "⚠️  RECORDA: Revisa les 3 barreres abans d'enviar!"
