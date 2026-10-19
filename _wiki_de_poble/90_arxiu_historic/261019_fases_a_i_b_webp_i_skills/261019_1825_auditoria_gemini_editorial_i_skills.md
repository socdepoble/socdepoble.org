---
type: informe
status: esborrany
description: Relleu d'execució de l'enriquiment didàctic de pageContent.js, correcció d'H1 i PaginaEmojis en les skills i blindatge de core-seguretat-audit.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_cb39a942-aac3-4aaf-a4af-f4b759317437:c1e74711-ab69-4bb8-8838-038eafc0f84a
---
# Informe de Progrés: Enriquiment Editorial de pageContent.js i Blindatge de les Skills

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_cb39a942-aac3-4aaf-a4af-f4b759317437:c1e74711-ab69-4bb8-8838-038eafc0f84a |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T16:25:36.263Z |
| Modificació | 2026-10-19T16:25:36.263Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon High (Google AI Ultra, 2M context) |
| Tokens consumits | ~210k / 2M |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-19T16:25:36.263Z: Creació del document de progrés posterior a l'auditoria forense (`261019_1730_auditoria_gemini_skills_i_laboratori.md`), recollint l'execució de l'enriquiment editorial i didàctic de `src/sections/text/pageContent.js`, la sincronització de tests i l'esmena i blindatge de les 7 skills afectades a `.agents/skills/`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Tasca 1: Redacció Editorial i Enriquiment Didàctic de la Web (`src/sections/text/pageContent.js`)

S'han revisat i enriquit els textos de les pàgines d'acció veïnal i utilitat comunitària a `src/sections/text/pageContent.js` (`publicar_mercat`, `publicar_mur`, `publicar_calendari`, `publicar_mapa`, `vehicle_compartit`, `animalets`, així com `treball` i `habitatge`), aplicant l'estàndard editorial i de llegibilitat (`core-llegibilitat-text`) de Sóc de Poble:

| Clau de `pageContent.js` | Millores Editorials i Didàctiques Aplicades |
| :--- | :--- |
| **`publicar_mercat`** | S'ha ampliat de 3 a 4 blocs didàctics (`<h5>` + `<p>`) amb **negretes estratègiques (`<strong>`)** en cada paràgraf per a lectura ràpida de la gent gran: 1) **Què pots oferir o demanar** (verdures de l'hort, oli, mel, llenya, eines de camp i mobles de fusta que ja no uses); 2) **Com publicar un anunci pas a pas** (foto clara amb el mòbil, títol planer i si ho vens, ho regales o ho canvies a tornallom); 3) **Com parlar i tancar el tracte en persona** (contacte pel Xat i trobada al **bar de la plaça prenent un café**, a la cooperativa o a la **porta del Mas** per mirar el producte amb calma i donar-se la mà); 4) **Tracte directe sense comissions ni intermediaris** (el **100 % del valor** es queda entre veïns). |
| **`publicar_mur`** | Explicació pas a pas en 3 blocs amb `<strong>` estratègics: **Per a què serveix el Mur** (avisos útils com talls d'aigua, camins tallats o ajuda puntual), **Com escriure un bon avís** (títol clar amb el lloc i l'hora en les primeres línies) i **Bon veïnatge i respecte** (espai lliure de soroll i discussions estèrils). |
| **`publicar_calendari`** | Enriquiment en 3 blocs amb `<strong>` en cada paràgraf: **Quins actes hi caben** (festes majors, mercats, assemblees, tallers, treballs a tornallom), **Dades imprescindibles perquè ningú es perda** (dia, hora d'inici i punt de trobada exacte enllaçat al Mapa) i **Avisos si canvia l'oratge** (actualització immediata en cas de pluja o vent). |
| **`publicar_mapa`** | Enriquiment en 3 blocs amb `<strong>` estratègics: **Què pots assenyalar al territori** (fonts, bancals, camins tallats, obres, patrimoni de pedra seca), **Com situar el punt amb precisió** (xinxeta exacta o referència coneguda i fotografia real) i **Memòria viva del terme** (cura del territori compartida entre jóvens i majors). |
| **`vehicle_compartit`** | Enriquiment en 3 blocs amb `<strong>` estratègics: **Com funciona el cotxe compartit al poble** (places lliures per anar a l'hospital, al mercat comarcal o a l'institut), **Com publicar o buscar un trajecte** (ruta, hora i punt de recollida acordat pel Xat) i **Confiança i despeses clares** (acord previ sobre si s'aporta per a la benzina o es fa per reciprocitat veïnal). |
| **`animalets`** | Enriquiment en 3 blocs amb `<strong>` estratègics: **Animals perduts o trobats al terme** (avisos ràpids amb foto, lloc i collaret per evitar que s'allunyen a la serra), **Adopcions responsables i cura mútua** (cadells o ajuda per alimentar els animals quan un veí major ha d'anar al metge) i **Respecte pel bestiar i la ramaderia** (tancament de cledes i convivència amb ramats en pastura). |
| **`treball` i `habitatge`** | S'han incorporat negretes estratègiques (`<strong>`) i llenguatge proper en cada paràgraf: **Jornals, oficis i ajuda mútua** (collita d'oliva, poda, fusteria, cura de gent gran sense intermediaris) i **Cases vives tot l'any** (lloguers dignes, masies compartides i rehabilitació d'habitatge buit). |

> **Nota arquitectònica sobre l'estructura DOM:** S'han preservat intactes els camps `title`, `subtitle`, `lead` i les etiquetes `<h5>` del cos HTML per complir l'especificació de `ControlSection.test.jsx` i la llei de jerarquia interna de `destinsControl.test.js` (`sanejat.querySelectorAll('h1, h2, h3, h4, h6').length === 0`), actualitzant en paral·lel les taules mirall `COS_2245`, `COS_261004` i `PARAGRAFS` a `src/sections/control/destinsControl.test.js`.

---

### 2. Tasca 2: Esmena de les Skills i Blindatge (`.agents/skills/`)

S'han aplicat totes les correccions estructurals, d'UI/UX i de seguretat identificades en l'auditoria forense sobre 7 skills canòniques:

1. **Correcció de Format H1 (`\n# ` literal eliminat):**
   - `.agents/skills/sdp-app-grid-shell/SKILL.md`: Corregit `\n# SKILL: App Grid Shell...` -> `# SKILL: App Grid Shell...` (línia 16).
   - `.agents/skills/sdp-casos-us-essencials/SKILL.md`: Corregit `\n# 💡 Casos d'Ús...` -> `# 💡 Casos d'Ús...` (línia 21).
   - `.agents/skills/sdp-estudi-mercat/SKILL.md`: Corregit `\n# SKILL: Estudi de Mercat...` -> `# SKILL: Estudi de Mercat...` (línia 18), alineada la descripció del backend amb el **Model B de Sollutia** (`src/data/backendPort.js` + lectura `GET` per la Frontissa) i eliminada la secció duplicada `## Ancoratge de la Wiki`.
   - `.agents/skills/wiki-propagar-veritat/SKILL.md`: Corregit `\n# SKILL: Propagar la Veritat...` -> `# SKILL: Propagar la Veritat...` (línia 20) i reparada l'ordre `find ... -exec sed` perquè excloga tant `90_arxiu_historic` com `04_escriptori/02_investigacio_ia`.

2. **Actualització UI/UX (`PaginaEmojis` com a subvista integrada):**
   - `.agents/skills/sdp-universal-editor/SKILL.md`: Actualitzades les seccions §1, §2 i §3 per reflectir l'estat real del codi (`src/components/universal/UniversalEditor.jsx`, `UniversalActionRow.jsx` i `classificacio/PaginaEmojis.jsx`):
     * Distinció explícita entre la icona `CloudUpload` (estat d'autodesat al núvol) i la icona `Feather` (**Ploma**, disparador d'identitat visual i selector d'emojis).
     * Documentació que el selector d'emojis és la **subvista integrada a tota la columna de treball `PaginaEmojis`** amb **botó «Tornar» de `44px` d'alt** i cercador en valencià, prohibint per sempre l'ús de modals `<Dialeg>` flotants o popovers per a la tria d'emojis.
     * Actualització de la `UniversalToolbar` (`H3 -> H2`, `List` + `ListOrdered`, i llenç `.sdp-editor-full-canvas`).
   - `.agents/skills/sdp-pedra-seca/SKILL.md`: Actualitzades les seccions §10 i §12 per fixar com a llei de Pedra Seca que el selector d'emojis és la subvista integrada `PaginaEmojis` (amb botó «Tornar» de `44px`) i **mai més un `<Dialeg>` flotant**, i unificada la secció final en `## Vincles`.

3. **Blindatge de la Sentinella de Seguretat (`core-seguretat-audit/SKILL.md`):**
   - Incorporat `core: true`, `prioritat: 1` i `status: canonic` al frontmatter, i afegits els **6 pegats d'enduriment** que fan la skill plenament compatible amb els 83 tests de seguretat i regles del repositori:
     1. **Protocol de Clean Shadow Copy** (`mktemp -d` + `git archive HEAD` + overlay de fitxers modificats) quan el worktree tinga fitxers *dirty* de rondes en paral·lel, prohibint `git stash`/`git checkout` destructius sobre la feina d'altres agents.
     2. **Llei de Coacció Primitiva en Payloads i Metadades JSONB** (`coercir ValorPrimitiuSegur`, profunditat màxima controlada, màxim `32` claus i prohibició de `__proto__`, `constructor`, `prototype`).
     3. **Llei d'Escaneig en Temps Lineal $O(n)$ (Zero ReDoS)** prohibint regex amb quantificadors imbricats o *backtracking* superlineal en escàners i filtres.
     4. **Llei de Privilegis Mínims en Supabase (`column-level grants` i Storage no llistable)** exigint `REVOKE UPDATE` general per a `authenticated` abans d'atorgar `GRANT UPDATE (columnes_segures)` i prohibint polítiques `SELECT` obertes sobre `storage.objects`.
     5. **Llei d'Expulsió de Claus d'Autoritat i Validació d'`sdp-media://`** en el *hidratador* d'esborranys locals (`localStorage`) i l'exportació d'estat.
     6. **Checklist Pre-Release de 10 punts** per a tota la Colmena (Claude, Codex, Gemini, MarIA).

4. **Sincronització d'índex i symlinks de la Colmena:**
   - Creats els symlinks `.claude/skills/core-gauntlet-loop` i `.claude/skills/core-seguretat-audit` amb `ln -sfn`.
   - Sincronitzat `.agents/skills/INDEX.md` i `.agents/cataleg_skills.json` via `node tooling/brain/cataleg_skills.mjs --escriu`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les comprovacions i bateries de tests s'han executat des de `socdepoble.org` amb resultat `0` errors:

```bash
npx vitest run src/sections/control/destinsControl.test.js src/sections/control/ControlSection.test.jsx src/sections/detail/PageDetailSection.publicar.test.jsx src/sections/text/pageContent.paquet.test.js src/sections/text/paginaDeText.test.js
# Test Files: 5 passed (5) | Tests: 99 passed (99)

node tooling/gates/frontissa-contingut.mjs
# OK frontissa-contingut: 14/14 claus estructurals amb empremta aprovada.

node tooling/brain/cataleg_skills.mjs --check
# {"porta": "cataleg-skills", "ok": true, "problemes": []}
```

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- No s'han executat ordres `git commit` ni modificat l'índex de Git (*staging area*) per respectar l'execució en paral·lel de Claude Code sobre la infraestructura.
- El segell de Llei Z (`.agents/segell_integritat.json`) requereix reconciliació explícita (`expectedHash`, `expectedPrevious`, `reason`) en el moment de tancar el commit unificat d'infraestructura i skills.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[02_genotip]]
- [[doc_governanca]]
- [[forja_to_core]]

