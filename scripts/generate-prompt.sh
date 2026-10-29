#!/bin/sh
# TOMBSTONE T11 (revisió final 261029, SG-02): este script copiava la plantilla
# del prompt a l'Escriptori sense torn, sense rebut ni porta Olivera, amb un nom
# fora de la taxonomia i un sed -i de GNU. L'Escriptori només s'escriu pel
# circuit documental: node tooling/gates/obrir_torn.mjs + node tooling/wiki/document.mjs create.
echo '[SDP-LOCK] generate-prompt.sh retirat (T11). Usa el circuit documental: node tooling/wiki/document.mjs create --turn-id ID --route prompt.consell|prompt.local --file CAMI' >&2
exit 2
