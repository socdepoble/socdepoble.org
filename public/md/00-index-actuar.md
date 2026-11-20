# 00_index_actuar

> Índex vertical de l'anell Actuar amb el mapa funcional de portes, scripts i el catàleg de plantilles documentals sense taules amples.

- Document a la Wiki de Poble: https://socdepoble.org/wikidepoble?item=00_index_actuar
- Llicència de sèrie del contingut: CC BY-NC-SA 4.0 (https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

# Actuar: scripts, portes i plantilles

L'anell **Actuar** explica com s'executen les **verificacions** i els **procediments** del repositori sense incrustar-hi el **codi font** ni **taules amples** que trenquen la **lectura mòbil** (`P0-128`). Els **programes executables** viuen a `tooling/` i `scripts/`, els procediments operatius a `.agents/skills/`, l'arquitectura d'enginyeria per a equips externs a `ARCHITECTURE.md` i les plantilles documentals ací mateix.

## Famílies d'eines verificables (lectura vertical)

### Portes d'arquitectura, seguretat i estil (`tooling/gates/`)

- **Àmbit d'execució:** pre-commit (`.husky/pre-commit`), integració contínua i `npm run porta -- --nomes-portes`.
- **Nivell de risc:** `lectura` (verificació estàtica i sobre artefactes compilats; bloqueja amb eixida diferent de zero si detecta una regressió).
- **Peces clau:** `tractor-frontissa.mjs`, `tractor-adaptadors.mjs`, `tractor-enxufe.mjs`, `tractor-rls.mjs`, `tractor-psicopatia.mjs`, `design_guard.mjs`, `certifica-enllacos.mjs` i `tractor-coherencia-editorial-viva.mjs`.

### Higiene documental i compilació de la Wiki (`tooling/wiki/`)

- **Àmbit d'execució:** creació i validació de documents amb rebut (`document.mjs`), esquema `wiki-frontmatter-v2.1` (`tractor-frontmatter.mjs`), graf sense orfes (`tractor-orfandat.mjs`) i projecció a l'aplicació (`compile-wiki-to-app.mjs`).
- **Nivell de risc:** `lectura` en mode auditoria; `escriptura` acotada quan es compila `src/data/wikiManifest.js` o es crea un document de torn a `04_escriptori/`.

### Cobertura social, SEO i dades obertes (`tooling/seo/` i `scripts/`)

- **Àmbit d'execució:** validació de cobertura social del router (`cobertura-router.mjs`), generació de `public/llms.txt` i còpies Markdown públiques (`genera-llms.mjs`), pla d'ordre de migracions SQL (`scripts/supabase/verifica-migracions.mjs`) i preflight de botigues (`scripts/botigues/`).
- **Nivell de risc:** `lectura` en verificació; `escriptura` reproduïble sobre artefactes de `public/` i `dist/` durant el build.

## Catàleg de plantilles operatives

Cada ruta declarada a `.agents/protocolledge.json` instancia la seua plantilla des de la subcarpeta següent:

- [[plantilles/00_index_plantilles]]

## Vincles

- [[00_index]]
- [[00_arquitectura_tecnica_unificada]]
- [[plantilles/00_index_plantilles]]
