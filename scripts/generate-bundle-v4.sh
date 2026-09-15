#!/usr/bin/env bash
#
# generate-bundle-v4.sh — Generador de bundles de Sóc de Poble.
#
# Ubicació canònica: scripts/generate-bundle-v4.sh
#
# Canvis respecte del v3 (FORMAT INCOMPATIBLE, per això puja de major):
#   1. Actius binaris/vectorials: cos omès, hash conservat.
#   2. Numeració de seqüència per fitxer: tot forat enmig és detectable en local.
#   3. Hash del manifest emès al cap i repetit a la cua.
#   4. Provinença git: HEAD, branca i estat brut de l'arbre.
#   5. Espai negatiu: el bundle declara què NO porta i per què.
#   6. Ordre determinista (LC_ALL=C sort): dos bundles del mateix arbre són idèntics.
#   7. La clàusula del contracte l'emet el generador, no una plantilla a banda.
#
# Principi dur: mai s'inclou un fitxer a mitges. O sencer, o omès amb motiu.
# Truncar en silenci és el vector d'al·lucinació que aquest format vol matar.
#
# Ús:
#   scripts/generate-bundle-v4.sh --abast src --abast _wiki_de_poble --abast scripts
#   scripts/generate-bundle-v4.sh --abast src --eixida /tmp/bundle.md --max-bytes 120000
#   scripts/generate-bundle-v4.sh --abast src --amb-actius          (no ometre actius)
#
# Eixides: 0 correcte · 1 error d'ús o d'entorn · 2 cap fitxer dins l'abast

set -euo pipefail

# ─────────────────────────────────────────────────────────── configuració

ARREL="$(pwd)"
EIXIDA=""
declare -a ABAST=()
MAX_BYTES=2000000
OMET_ACTIUS=1
ID_BASE="SDP-BUNDLE-v4.0"
MARCA_FIXA="${MARCA_FIXA:-}"
VERIFICA=1

PATRO_MORTS='\.(orig|rej|bak|swp)$|\.abans-[0-9]{6}$|\.antic$|~$|_BUNDLE_|_MANIFEST_'
PATRO_ACTIUS='\.(png|jpe?g|gif|webp|avif|ico|bmp|tiff?|svg|woff2?|ttf|otf|eot|mp[34]|m4a|wav|ogg|webm|mov|pdf|zip|gz|bz2|xz|tar|7z|wasm|db|sqlite3?)$'
declare -a DIRS_IGNORATS=(node_modules .git .hg .svn dist build coverage .vite .next .nuxt .cache .turbo .obsidian .DS_Store bot/.iaia_auth 90_arxiu_historic 90_historic cervells skills_mirror)

# ─────────────────────────────────────────────────────────── utilitats

roig=''; verd=''; groc=''; tenue=''; cap=''
if [ -t 2 ]; then roig=$'\033[31m'; verd=$'\033[32m'; groc=$'\033[33m'; tenue=$'\033[2m'; cap=$'\033[0m'; fi

avis()  { printf '%s\n' "${groc}⚠ ${*}${cap}" >&2; }
nota()  { printf '%s\n' "${tenue}  ${*}${cap}" >&2; }
mor()   { printf '%s\n' "${roig}✖ generate-bundle-v4: ${*}${cap}" >&2; exit 1; }

# ─────────────────────────────────────────────────────────── arguments

while [ $# -gt 0 ]; do
  case "$1" in
    --arrel)       ARREL="${2:?--arrel necessita un valor}"; shift 2 ;;
    --eixida)      EIXIDA="${2:?--eixida necessita un valor}"; shift 2 ;;
    --abast)       ABAST+=("${2:?--abast necessita un valor}"); shift 2 ;;
    --max-bytes)   MAX_BYTES="${2:?--max-bytes necessita un valor}"; shift 2 ;;
    --amb-actius)  OMET_ACTIUS=0; shift ;;
    --marca)       MARCA_FIXA="${2:?--marca necessita un valor ISO-8601}"; shift 2 ;;
    --sense-verificar) VERIFICA=0; shift ;;
    --ignora)      DIRS_IGNORATS+=("${2:?--ignora necessita un valor}"); shift 2 ;;
    -h|--help)     sed -n '3,30p' "$0"; exit 0 ;;
    *)             mor "argument desconegut: $1" ;;
  esac
done

[ ${#ABAST[@]} -gt 0 ] || mor "cap --abast declarat. Un bundle sense abast explícit no pot declarar el seu espai negatiu."
cd "$ARREL" || mor "no puc entrar a $ARREL"
[[ "$MAX_BYTES" =~ ^[0-9]+$ ]] || mor "--max-bytes ha de ser un enter"

# ─────────────────────────────────────────────────── detecció d'entorn
# Es resol tot ací dalt. Un generador que descobreix a mitja passada que
# li falta una eina deixa un bundle a mitges, que és pitjor que cap bundle.

if command -v sha256sum >/dev/null 2>&1;   then SHA() { sha256sum "$1" | cut -d' ' -f1; }
elif command -v shasum  >/dev/null 2>&1;   then SHA() { shasum -a 256 "$1" | cut -d' ' -f1; }
else mor "cal sha256sum o shasum"; fi

if stat -c%s . >/dev/null 2>&1;            then MIDA() { stat -c%s "$1"; }
elif stat -f%z . >/dev/null 2>&1;          then MIDA() { stat -f%z "$1"; }
else mor "stat no compatible (ni GNU ni BSD)"; fi

if command -v file >/dev/null 2>&1;        then MIME() { file --mime-type -b "$1" 2>/dev/null || echo "application/octet-stream"; }
else                                            MIME() { echo "text/plain"; }; fi

if   command -v node    >/dev/null 2>&1;   then JSONBIN=node
elif command -v python3 >/dev/null 2>&1;   then JSONBIN=python3
else mor "cal node o python3 per a construir el manifest amb escapat JSON correcte"; fi

printf '' | sort -z >/dev/null 2>&1 && SORT_NUL=1 || SORT_NUL=0
[ "$SORT_NUL" = 1 ] || avis "sort -z no disponible: es rebutjaran rutes amb salts de línia."

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
INV="$TMP/inventari.tsv"   # ruta \t hash \t mida \t mime \t mode \t nl_afegit
: >"$INV"

# ─────────────────────────────────────────────────────────── provinença

GIT_HEAD=""; GIT_BRANCA=""; GIT_BRUT="desconegut"; GIT_BRUTS_N=0
if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
  GIT_HEAD="$(git rev-parse HEAD 2>/dev/null || echo '')"
  GIT_BRANCA="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
  GIT_BRUTS_N="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
  if [ "$GIT_BRUTS_N" -eq 0 ]; then GIT_BRUT="false"; else GIT_BRUT="true"; fi
  git status --porcelain 2>/dev/null | head -50 | sed 's/^...//' >"$TMP/bruts.txt" || : >"$TMP/bruts.txt"
else
  avis "fora d'un repositori git: el bundle no podrà provar a quin estat correspon."
  : >"$TMP/bruts.txt"
fi
[ "$GIT_BRUT" = "true" ] && avis "l'arbre té $GIT_BRUTS_N canvis sense confirmar: aquest bundle descriu un estat que no existeix en cap història."

# ─────────────────────────────────────────────────────────── inventari

declare -a PODA=()
for d in "${DIRS_IGNORATS[@]}"; do PODA+=(-name "$d" -o); done
unset 'PODA[${#PODA[@]}-1]'

N_MORTS=0; N_ACTIUS=0; N_GRANS=0; N_TEXT=0; N_IL=0

afig() {
  local ruta="$1" mode hash mida mime nl
  case "$ruta" in *$'\n'*|*$'\t'*) avis "ruta amb salt de línia o tabulador, exclosa: $(printf %q "$ruta")"; N_IL=$((N_IL+1)); return ;; esac

  mida="$(MIDA "$ruta")"; hash="$(SHA "$ruta")"; mime="$(MIME "$ruta")"; nl=0

  if   [ "$OMET_ACTIUS" = 1 ] && [[ "$ruta" =~ $PATRO_ACTIUS ]]; then mode=actiu; N_ACTIUS=$((N_ACTIUS+1))
  elif ! LC_ALL=C grep -qI '' "$ruta" 2>/dev/null;               then mode=actiu; N_ACTIUS=$((N_ACTIUS+1))
  elif [ "$MAX_BYTES" -gt 0 ] && [ "$mida" -gt "$MAX_BYTES" ];   then mode=gran;  N_GRANS=$((N_GRANS+1))
  else
    mode=text; N_TEXT=$((N_TEXT+1))
    [ -s "$ruta" ] && [ "$(tail -c1 "$ruta" | wc -l | tr -d ' ')" -eq 0 ] && nl=1
  fi
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$ruta" "$hash" "$mida" "$mime" "$mode" "$nl" >>"$INV"
}

recull() {
  local arrel="$1"
  if [ "$SORT_NUL" = 1 ]; then
    while IFS= read -r -d '' f; do
      f="${f#./}"
      if [[ "$f" =~ $PATRO_MORTS ]]; then N_MORTS=$((N_MORTS+1)); continue; fi
      afig "$f"
    done < <(find "$arrel" \( "${PODA[@]}" \) -prune -o -type f -print0 | LC_ALL=C sort -z)
  else
    while IFS= read -r f; do
      f="${f#./}"
      if [[ "$f" =~ $PATRO_MORTS ]]; then N_MORTS=$((N_MORTS+1)); continue; fi
      afig "$f"
    done < <(find "$arrel" \( "${PODA[@]}" \) -prune -o -type f -print | LC_ALL=C sort)
  fi
}

nota "recollint…"
for a in "${ABAST[@]}"; do
  if   [ -d "$a" ]; then recull "$a"
  elif [ -f "$a" ]; then afig "${a#./}"
  else avis "abast inexistent, ignorat: $a"; fi
done

TOTAL="$(wc -l <"$INV" | tr -d ' ')"
[ "$TOTAL" -gt 0 ] || { printf '%s\n' "${roig}✖ cap fitxer dins l'abast declarat.${cap}" >&2; exit 2; }

# ─────────────────────────────────────────────────────────── manifest

# Marca de temps. Amb SOURCE_DATE_EPOCH o --marca el bundle és reproduïble
# byte a byte: dos bundles del mateix commit han de ser comparables amb diff.
if [ -n "${MARCA_FIXA:-}" ]; then MARCA="$MARCA_FIXA"
elif [ -n "${SOURCE_DATE_EPOCH:-}" ]; then
  MARCA="$(date -u -d "@$SOURCE_DATE_EPOCH" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null \
        || date -u -r "$SOURCE_DATE_EPOCH" +%Y-%m-%dT%H:%M:%SZ)"
else MARCA="$(date -u +%Y-%m-%dT%H:%M:%SZ)"; fi
ID="${ID_BASE}"

construeix_manifest() {
  if [ "$JSONBIN" = node ]; then
    node -e '
      const fs=require("fs");
      const [inv,bruts]=[process.argv[1],process.argv[2]];
      const files=fs.readFileSync(inv,"utf8").split("\n").filter(Boolean).map(l=>{
        const [path,hash_sha256,size,mime_type,mode,nl]=l.split("\t");
        return {path,hash_sha256,size:Number(size),mime_type,
                cos: mode==="text"?"inclos":(mode==="actiu"?"omes_actiu":"omes_mida"),
                nl_afegit: nl==="1"};
      });
      const ex=JSON.parse(process.argv[3]);
      process.stdout.write(JSON.stringify({
        bundle_id:process.argv[4], generator_script:"generate-bundle-v4.sh",
        timestamp:process.argv[5],
        provinenca:{git_head:process.argv[6]||null,git_branca:process.argv[7]||null,
                    git_brut:process.argv[8],canvis_sense_confirmar:Number(process.argv[9]),
                    rutes_brutes:fs.readFileSync(bruts,"utf8").split("\n").filter(Boolean)},
        abast_solicitat:JSON.parse(process.argv[10]),
        espai_negatiu:ex,
        recompte:{total:files.length,
                  cos_inclos:files.filter(f=>f.cos==="inclos").length,
                  cos_omes:files.filter(f=>f.cos!=="inclos").length},
        files
      }));
    ' "$INV" "$TMP/bruts.txt" "$1" "$ID" "$MARCA" "$GIT_HEAD" "$GIT_BRANCA" "$GIT_BRUT" "$GIT_BRUTS_N" "$2"
  else
    python3 -c '
import sys,json
inv,bruts,ex,bid,ts,gh,gb,gd,gn,ab=sys.argv[1:11]
files=[]
for l in open(inv,encoding="utf-8"):
    if not l.strip(): continue
    p,h,s,m,mode,nl=l.rstrip("\n").split("\t")
    files.append({"path":p,"hash_sha256":h,"size":int(s),"mime_type":m,
                  "cos":"inclos" if mode=="text" else ("omes_actiu" if mode=="actiu" else "omes_mida"),
                  "nl_afegit":nl=="1"})
sys.stdout.write(json.dumps({
 "bundle_id":bid,"generator_script":"generate-bundle-v4.sh","timestamp":ts,
 "provinenca":{"git_head":gh or None,"git_branca":gb or None,"git_brut":gd,
               "canvis_sense_confirmar":int(gn),
               "rutes_brutes":[x for x in open(bruts,encoding="utf-8").read().split("\n") if x]},
 "abast_solicitat":json.loads(ab),
 "espai_negatiu":json.loads(ex),
 "recompte":{"total":len(files),
             "cos_inclos":sum(1 for f in files if f["cos"]=="inclos"),
             "cos_omes":sum(1 for f in files if f["cos"]!="inclos")},
 "files":files},ensure_ascii=False))
' "$INV" "$TMP/bruts.txt" "$1" "$ID" "$MARCA" "$GIT_HEAD" "$GIT_BRANCA" "$GIT_BRUT" "$GIT_BRUTS_N" "$2"
  fi
}

llista_json() { local s="[" p=""; for x in "$@"; do s+="$p\"${x//\"/\\\"}\""; p=","; done; printf '%s]' "$s"; }

EXCLOSOS=$(cat <<JSON
{"fitxers_residuals":$N_MORTS,
 "actius_cos_omes":$N_ACTIUS,
 "supera_max_bytes":$N_GRANS,
 "rutes_il_legals":$N_IL,
 "directoris_podats":$(llista_json "${DIRS_IGNORATS[@]}"),
 "patro_residuals":"${PATRO_MORTS//\\/\\\\}",
 "max_bytes":$MAX_BYTES}
JSON
)

MANIFEST="$(construeix_manifest "$(printf '%s' "$EXCLOSOS" | tr -d '\n')" "$(llista_json "${ABAST[@]}")")"
printf '%s' "$MANIFEST" >"$TMP/manifest.json"
MANIFEST_SHA="$(SHA "$TMP/manifest.json")"

# ─────────────────────────────────────────────────────────── escriptura

[ -n "$EIXIDA" ] || EIXIDA="$(date -u +%y%m%d_%H%M)_BUNDLE_sdp.md"
mkdir -p "$(dirname "$EIXIDA")" 2>/dev/null || true
: >"$EIXIDA"
exec 3>>"$EIXIDA"

clausula_contracte() {
  cat >&3 <<'CLAU'
## === CONTRACTE DEL FORMAT (emès pel generador, no per cap plantilla) ===
##  · El manifest és la línia JSON entre MANIFEST START i MANIFEST END.
##  · MANIFEST SHA256 prova el manifest. Es repeteix a la cua: si els dos
##    valors no coincideixen, el document ha sigut alterat o retallat.
##  · Cada fitxer: capçalera "FITXER n/N: ruta", línia HASH, cos, <<<FI_FITXER>>>.
##    Si falta un número de la sèrie, falta un fitxer. No cal esperar al final.
##  · hash_sha256 és dels bytes del fitxer en disc. RECONSTRUCCIÓ EXACTA:
##    agafa les línies entre la línia HASH i <<<FI_FITXER>>>, uneix-les amb "\n"
##    i AFIG SEMPRE un "\n" final; després, si nl_afegit és cert, LLEVA'N un.
##    Condicionar-ho a "si no acaba amb \n" corromp els fitxers que acaben
##    amb línia buida. El hash resultant ha de quadrar amb hash_sha256.
##  · cos: "inclos" | "omes_actiu" | "omes_mida". Un cos omès mai és un cos buit.
##    Cap fitxer s'inclou a mitges: o sencer, o omès amb motiu declarat.
##  · espai_negatiu declara què s'ha deixat fora i per què. L'absència és una
##    dada del manifest, no una cosa a deduir.
##  · El document acaba amb <<<FI_DEL_BUNDLE>>>. Si no hi és, arriba tallat.
CLAU
}

{
  printf '## === MANIFEST START ===\n'
  printf '%s\n' "$MANIFEST"
  printf '## === MANIFEST END ===\n'
  printf '## === MANIFEST SHA256: %s ===\n' "$MANIFEST_SHA"
} >&3
clausula_contracte

n=0
while IFS=$'\t' read -r ruta hash mida mime mode nl; do
  n=$((n+1))
  {
    printf '\n## === FITXER %d/%d: %s ===\n' "$n" "$TOTAL" "$ruta"
    printf '<<<HASH: %s>>>\n' "$hash"
  } >&3
  case "$mode" in
    text)  cat "$ruta" >&3; [ "$nl" = 1 ] && printf '\n' >&3 ;;
    actiu) printf '[ACTIU OMÈS: %s · %s bytes · sha256 %s · %s]\n' "$ruta" "$mida" "$hash" "$mime" >&3 ;;
    gran)  printf '[FITXER OMÈS PER MIDA: %s · %s bytes (límit %s) · sha256 %s]\n' "$ruta" "$mida" "$MAX_BYTES" "$hash" >&3 ;;
  esac
  printf '<<<FI_FITXER>>>\n' >&3
done <"$INV"

{
  printf '\n## === TANCAMENT ===\n'
  printf '## fitxers_emesos: %d/%d\n' "$n" "$TOTAL"
  printf '## manifest_sha256: %s\n' "$MANIFEST_SHA"
  printf '<<<FI_DEL_BUNDLE>>>\n'
} >&3
exec 3>&-

[ "$n" -eq "$TOTAL" ] || mor "s'han emès $n fitxers de $TOTAL. Bundle incoherent, no l'useu."

# ──────────────────────────────────────────── autoverificació del format
# El generador reverteix la seua pròpia eixida abans de lliurar-la. Un bundle
# que el seu autor no sap desfer no és una font de veritat, és una esperança.

if [ "$VERIFICA" = 1 ] && [ "$JSONBIN" = node ]; then
  node -e '
    const fs=require("fs"),cr=require("crypto");
    const L=fs.readFileSync(process.argv[1],"latin1").split("\n");
    const man=JSON.parse(L[1]), esp=new Map(man.files.map(f=>[f.path,f]));
    let ok=0,mal=[],vistos=0;
    for(let i=0;i<L.length;i++){
      const m=/^## === FITXER \d+\/\d+: (.+) ===$/.exec(L[i]); if(!m) continue;
      vistos++; const ruta=m[1]; let k=i+2; while(k<L.length&&L[k]!=="<<<FI_FITXER>>>")k++;
      const meta=esp.get(ruta); if(!meta){mal.push(ruta+" (fora del manifest)");i=k;continue;}
      if(meta.cos!=="inclos"){i=k;continue;}
      let cos=L.slice(i+2,k).join("\n")+"\n";
      if(meta.nl_afegit) cos=cos.slice(0,-1);
      const h=cr.createHash("sha256").update(Buffer.from(cos,"latin1")).digest("hex");
      h===meta.hash_sha256?ok++:mal.push(`${ruta} (esperat ${meta.hash_sha256.slice(0,12)}, obtingut ${h.slice(0,12)})`);
      i=k;
    }
    if(vistos!==man.recompte.total){console.error(`seqüència incompleta: ${vistos}/${man.recompte.total}`);process.exit(1);}
    if(mal.length){console.error("reversió fallida:\n  - "+mal.slice(0,10).join("\n  - "));process.exit(1);}
    process.stderr.write(`  reversió    ${ok} cossos revertits i verificats contra el manifest\n`);
  ' "$EIXIDA" || mor "el bundle emès no es pot revertir. No el lliureu."
elif [ "$VERIFICA" = 1 ]; then
  avis "autoverificació omesa (cal node). Useu --sense-verificar per a silenciar-ho."
fi

# ─────────────────────────────────────────────────────────── resum

MIDA_FINAL="$(MIDA "$EIXIDA")"
printf '\n%s▬ BUNDLE %s%s\n' "$verd" "$ID" "$cap" >&2
nota "eixida        $EIXIDA  ($MIDA_FINAL bytes)"
nota "manifest      sha256 ${MANIFEST_SHA:0:16}…"
nota "git           ${GIT_HEAD:0:12}${GIT_HEAD:+ }${GIT_BRANCA:-—} · brut: $GIT_BRUT ($GIT_BRUTS_N)"
nota "cos inclòs    $N_TEXT"
nota "cos omès      $N_ACTIUS actius · $N_GRANS per mida"
nota "exclosos      $N_MORTS residuals · $N_IL rutes il·legals"
printf '%s✔ %d fitxers, ordre determinista, tancament verificat.%s\n' "$verd" "$TOTAL" "$cap" >&2
