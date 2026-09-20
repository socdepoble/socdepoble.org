#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_ROOT=${1:-.}
REPORT_DIR=${2:-"$PROJECT_ROOT/.brain-reports"}

mkdir -p "$REPORT_DIR"

AUDIT_STATUS=0
python3 "$SCRIPT_DIR/brain_audit.py" "$PROJECT_ROOT" \
  --policy "$SCRIPT_DIR/brain_policy.json" \
  --json "$REPORT_DIR/audit.json" \
  --markdown "$REPORT_DIR/audit.md" \
  --fail-on high || AUDIT_STATUS=$?

python3 "$SCRIPT_DIR/brain_distill.py" plan "$PROJECT_ROOT" \
  --output "$REPORT_DIR/distill-plan.json"

MIRROR_STATUS=0
SDP_ARREL="$PROJECT_ROOT" node "$SCRIPT_DIR/cataleg_skills.mjs" --check || MIRROR_STATUS=$?

printf '%s\n' "Informes escrits en: $REPORT_DIR"
printf '%s\n' "No s'han modificat fonts; només s'han escrit els informes anteriors."

if [ "$AUDIT_STATUS" -ne 0 ]; then
  exit "$AUDIT_STATUS"
fi
exit "$MIRROR_STATUS"