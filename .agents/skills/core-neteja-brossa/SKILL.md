---
name: core-neteja-brossa
description: Tractor de neteja d'arrels. Retira de l'arrel de socdepoble.org la brossa solta (logs, pegats, sondes) sense tocar mai la configuració de les eines, l'estat local ni res versionat.
---
# Tractor de Neteja d'Arrels

Aquest tractor manté l'arrel del repositori lliure de fitxers temporals, logs residuals i sondes que deixen els agents o les eines òrfenes.

## Per què ho fem?
Segons la filosofia de la **safata d'entrada** i el control de brossa, les accions dels agents no poden crear entropia a l'arrel del projecte. Una arrel neta deixa veure l'arquitectura i evita dependències accidentals amb dades residuals.

## Eina de Neteja

`node tooling/higiene/neteja_brossa_arrel.mjs` (simulació: només informa)
`node tooling/higiene/neteja_brossa_arrel.mjs --aplica` (mou els candidats)
`--workspace` afig l'arrel del workspace `Som de Poble/`, amb paperera pròpia.

### Funcionament (llista negra)
1. Només són candidats els **fitxers solts** de l'arrel que casen amb `PATRONS_BROSSA` (`*.log`, `*.diff`, `*.patch`, `test_output*.txt`, `lint_results*.json`, `probe_*.mjs`, `scratchpad_*.mjs`...).
2. Mai toca una entrada que comença per punt. `.claude`, `.codex`, `.agents`, `.immunitari`, `.sdp-reflex`, `.iaia_auth` o `.snapshots` són configuració d'eines i estat local que llig la maquinària.
3. Mai toca directoris ni fitxers seguits per git. La brossa versionada es retira amb `git rm`, en un commit revisat.
4. Amb `--aplica`, mou els candidats a `.sdp-paperera/quarantena-<ISO>/` i hi deixa `MANIFEST.json` amb rutes relatives. No esborra mai res.

## Quan utilitzar-lo

- Quan la llista de fitxers de l'arrel és inusualment gran.
- Si el Mestre indica que hi ha fitxers no desitjats.
- Primer sempre en simulació. S'aplica quan la llista que mostra és la que toca.

## Incident que ho motiva (260929)
La primera versió treballava per llista blanca i movia tot allò que no hi constava. A les 18:50 va apartar `.claude`, `.codex`, `.sdp-reflex` i `.immunitari`. Això va deixar sense hooks Claude i Codex, va fer fallar Plaquetes i Time Machine i va apartar la clau dels rebuts. Si una carpeta desconeguda sembla sobrera, es consulta al Mestre.

## Recordatori per a IAs Orquestradores
L'arrel no és un abocador. Els informes van a l'Escriptori: `_wiki_de_poble/04_escriptori/`.
