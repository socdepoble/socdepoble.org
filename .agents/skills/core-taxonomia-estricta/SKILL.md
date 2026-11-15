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
  - _wiki_de_poble/03_actuar/plantilles
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
4. Executa `node tooling/wiki/document.mjs check --file CAMI` i `node tooling/gates/porta-taxonomia.mjs --staged` per als documents nous preparats per a Git; usa `--fitxer CAMI` per a una comprovació puntual i `--paritat` per a contrastar el catàleg de categories. Registra els errors reals; no afirmes que l'esquema prova comprensió ni que valida tota la prosa.

## 3. Límits

Si la ruta o la plantilla no existixen o estan retirades, aplica el Fusible del BIOS. La taxonomia no atorga permisos de governança, arxivament o publicació.

## 4. Prudència Taxonòmica de Carpetes i Dades («Reflexió abans d'Actuació: Zero Carpetes Inventades» · `261111`)

1. **Prohibició absoluta d'inventar carpetes per impuls:** Cap IA pot crear una carpeta nova en `public/assets/`, `src/data/`, `_wiki_de_poble/` o `Som de Poble/` pel seu compte pensant que «ja val». Abans d'esborrar qualsevol carpeta o fitxer fora de l'arxiu canònic, s'ha d'inspeccionar i documentar exactament què conté i per què es va originar.
2. **Reutilització o Pregunta Socràtica al Mestre:** Quan sorgisca un domini o col·lecció nova (*receptes, arbres, plantes, llavors, rutes, oli, fitxes...*) que encara no tinga una ubicació o categorització acordada:
   - Primer verifica si encaixa netament en les carpetes canòniques ja aprovades i cobertes pels tests (`public/assets/uploads/patrimoni/`, `src/data/importacio/`, `src/data/patrimoni/`, etc.).
   - Si realment convindria obrir una carpeta o taxonomia nova, **atura't en mode reflexió i pregunta primer al Mestre**: *«Javi, què fem amb aquest tipus de continguts o cas d'ús i on el guardem? Obrim una carpeta canònica dedicada o l'integrem dins d'X?»*.

## Vincles
- [[00_INDEX_SKILLS]]
