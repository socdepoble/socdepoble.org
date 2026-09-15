#!/bin/bash
# Script per generar un Bundle SDP v3 robust i verificable
# Utilitza hashing SHA-256 i un manifest JSON embut per a la integritat.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Generador de Bundles SDP v3 iniciat.${NC}"

# Paràmetres
INPUT_DIR="${1:-"./"}" # Directori d'entrada per defecte: actual
OUTPUT_FILE="${2:-"full_bundle.md"}" # Fitxer de sortida per defecte
MANIFEST_FILE="manifest.json"

echo "Directori d'entrada: $INPUT_DIR"
echo "Fitxer de sortida: $OUTPUT_FILE"

# Funció per calcular el hash SHA-256
calculate_hash() {
    local file="$1"
    if command -v sha256sum > /dev/null; then
        sha256sum "$file" | cut -d' ' -f1
    elif command -v openssl > /dev/null; then
        openssl sha256 -r "$file" | tr -d ' \t\r\n'
    else
        echo "Error: Ni 'sha256sum' ni 'openssl' trobats per calcular el hash." >&2
        exit 1
    fi
}

# Funció per obtenir el tipus MIME
get_mime_type() {
    local file="$1"
    if command -v file > /dev/null; then
        local mime=$(file --brief --mime-type "$file" 2>/dev/null || echo "text/plain")
        echo "$mime"
    else
        echo "text/plain"
    fi
}

# Crear el fitxer de manifest
cat > "$MANIFEST_FILE" << EOF
{
  "bundle_id": "SDP-BUNDLE-v3.0",
  "generator_script": "$(basename $0)",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "files": []
}
EOF

# Array per guardar els fitxers processats
files_to_process=()
while IFS= read -r line; do
    files_to_process+=("$line")
done < <(find "$INPUT_DIR" -type f ! -path "*/.*" ! -path "*/$MANIFEST_FILE" ! -name "*.orig" ! -name "*.rej" ! -name "*.abans-*")

total_files=${#files_to_process[@]}
echo "S'han trobat $total_files fitxer(s) per processar."

# Processar cada fitxer i afegir-lo al manifest
for ((i=0; i<total_files; i++)); do
    file_path="${files_to_process[i]}"
    
    # Fer servir relativitzar la ruta respecte a INPUT_DIR
    relative_path="${file_path#$INPUT_DIR/}"
    
    # Calcular hash i tamany
    file_hash=$(calculate_hash "$file_path")
    file_size=$(stat -f %z "$file_path" 2>/dev/null || stat -c %s "$file_path")
    mime_type=$(get_mime_type "$file_path")

    # Afegir entrada al manifest
    jq --arg path "$relative_path" \
       --arg hash "$file_hash" \
       --argjson size $file_size \
       --arg mime "$mime_type" \
       '.files += [{"path": $path, "hash_sha256": $hash, "size": $size, "mime_type": $mime}]' \
       "$MANIFEST_FILE" > tmp.$$.json && mv tmp.$$.json "$MANIFEST_FILE"

    echo "  Processat: $relative_path (Hash: $file_hash:)"
done

# Crear el fitxer de paquet final
> "$OUTPUT_FILE"

# Afegir el manifest al fitxer de paquet
echo "## === MANIFEST START ===" >> "$OUTPUT_FILE"
jq -c . "$MANIFEST_FILE" | tr -d '\n' >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "## === MANIFEST END ===" >> "$OUTPUT_FILE"

# Afegir els continguts dels fitxers
for file_path in "${files_to_process[@]}"; do
    relative_path="${file_path#$INPUT_DIR/}"
    file_hash=$(calculate_hash "$file_path")
    
    echo "" >> "$OUTPUT_FILE"
    echo "## === FILE: $relative_path ===" >> "$OUTPUT_FILE"
    echo "<<<<<<< HASH: $file_hash >>>>>>>" >> "$OUTPUT_FILE"
    
    # Afegir el contingut del fitxer
    cat "$file_path" >> "$OUTPUT_FILE"
    
    echo "" >> "$OUTPUT_FILE"
    echo "<<<FI_FITXER>>>" >> "$OUTPUT_FILE"
done

echo "" >> "$OUTPUT_FILE"
echo "<<<FI_DEL_BUNDLE>>>" >> "$OUTPUT_FILE"

echo -e "${GREEN}Paquet generat amb èxit: $OUTPUT_FILE${NC}"
echo "Integritat garantida mitjançant hashing SHA-256."
