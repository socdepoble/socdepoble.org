---
name: core-cartografia-contenidor-som-de-poble
type: skill
status: actiu
description: Abans de crear una carpeta, moure patrimoni o documents fora de socdepoble.org o desar contingut nou al contenidor «Som de Poble», consulta el mapa canònic i el cartògraf per a donar-li una sola llar.
triggers_on:
  - on va
  - carpeta nova
  - contenidor Som de Poble
  - cartografia
  - duplicats
  - inventari
contracte.llig:
  - _wiki_de_poble/02_saber/architecture/mapa_canonic_contenidor_som_de_poble.md
  - tooling/gates/cartograf-som-de-poble.mjs
contracte.escriu:
  - _wiki_de_poble/04_escriptori
motors:
  - tooling/gates/cartograf-som-de-poble.mjs
  - tooling/gates/porta-olivera.mjs
---

# Cartografia del contenidor «Som de Poble»

El contenidor és la carpeta pare de `socdepoble.org`. Hi conviuen el repositori viu i els fons patrimonials, tècnics, legals i d'empaquetat. Cada contingut té una sola llar canònica, i qualsevol persona al Finder o qualsevol IA l'ha d'entendre a primera vista. Esta skill viu dins de Git des de la v1.2.26 (decisió del Mestre del 26-11-2026); abans era una skill global.

## 1. Abans de crear una carpeta o desar res fora de `socdepoble.org`

1. Llig el mapa canònic: `_wiki_de_poble/02_saber/architecture/mapa_canonic_contenidor_som_de_poble.md`.
2. Pregunta on va: `node tooling/gates/cartograf-som-de-poble.mjs --on-va "<descripció del contingut>"`.
3. Mira l'estat real: `node tooling/gates/cartograf-som-de-poble.mjs --audit` jutja l'arrel i els fons temàtics i informa de duplicats i homònims; `--inventari` mesura cada carpeta en temps real (recompte, mida, profunditat, symlinks i noms estranys), sense catàlegs desats a Git.

## 2. Prohibicions

- Cap carpeta nova a l'arrel del contenidor sense l'aprovació explícita del Mestre i, en el mateix canvi, la seua fila al mapa canònic i a `TAXONOMIA_CANONICA` del cartògraf.
- Cap enllaç simbòlic d'accés ràpid: al Finder sembla una carpeta repetida. Els únics autoritzats són els que el cartògraf declara, amb la prova que en depén.
- Cap PDF, vídeo o imatge pesant duplicat en dos fons. Una còpia que Firebase ha de servir des de `public/assets/uploads/` porta la seua empremta a `DUPLICATS_JUSTIFICATS_SHA256` i al mapa.
- Res nou a `_raw_de_poble/`: és una safata congelada. Tot document nou entra al seu calaix temàtic viu.
- A `_arxiu_wiki_de_poble/` només entra el que ix de la Wiki viva amb Doble Custòdia (D3, AGENTS §5): etiqueta git anotada sobre l'últim commit que el conté i entrada a `../_arxiu_wiki_de_poble/00_manifest_arxiu_fred.json`. Ho comprova `node tooling/gates/porta-olivera.mjs --custodia`.

## 3. Consolidar un duplicat sense destruir

Quan l'auditoria troba un symlink redundant o un fitxer idèntic per SHA-256:

1. Comprova que cap mòdul ni prova en depén: `grep -rn` a `src/` i `tests/`.
2. Verifica la identitat exacta amb `ls -la` (symlinks) o `shasum -a 256` (fitxers).
3. Demana confirmació d'una línia al Mestre abans de retirar res fora de les carpetes efímeres de treball. La retirada l'ordena el Mestre: el que es retira es trasllada (AGENTS §5 i §12), mai s'esborra.

## Vincles

- [[mapa_canonic_contenidor_som_de_poble]]
- [[00_INDEX_SKILLS]]
