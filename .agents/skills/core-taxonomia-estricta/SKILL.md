---
name: core-taxonomia-estricta
description: Tractor documental per blindar la taxonomia i evitar generació de documents arbitraris que no segueixen les plantilles canòniques.
version: 1.0.0
type: skill
status: canonic
triggers_on: [prompt_generation, planning, documentation]
contracte.llig:
  - _wiki_de_poble/02_saber/doc_governanca.md
  - tooling/wiki/schema.json
contracte.escriu:
  - _wiki_de_poble/02_saber/doc_governanca.md
---

# Tractor Documental: Taxonomia Estricta (Fusible)

Aquesta habilitat s'activa per **BLOCAR** la generació de documentació i petorretes que no s'ajusten al model taxonòmic de Sóc de Poble.

## 1. Abast i font única

Esta skill selecciona categoria, nom i ruta documental. Les fonts són `tooling/wiki/taxonomia.json`, [[taxonomia_documental]] i `.agents/protocolledge.json`. El contracte de metadades és `tooling/wiki/schema.json`.

## 2. Procediment

1. Identifica la categoria i la ruta del document en el catàleg vigent; no inventes categories.
2. Aplica [[core-temps-termodinamic/SKILL|core-temps-termodinamic]] per al nom i [[wiki-documentacio-i-reflex/SKILL|wiki-documentacio-i-reflex]] per a `document.mjs context/create`. Llig íntegrament la plantilla que retorne el CLI.
3. Conserva les seccions de la plantilla i aplica [[core-maquetacio-markdown/SKILL|core-maquetacio-markdown]] al contingut del fitxer. La pàgina pintada correspon a [[core-llegibilitat-text/SKILL|core-llegibilitat-text]].
4. Executa `node tooling/wiki/document.mjs check --file CAMI` i la porta de taxonomia pertinent. Registra els errors reals; no afirmes que l'esquema prova comprensió ni que valida tota la prosa.

## 3. Límits

Si la ruta o la plantilla no existixen o estan retirades, aplica el Fusible del BIOS. La taxonomia no atorga permisos de governança, arxivament o publicació.

## Vincles
- [[00_INDEX_SKILLS]]
