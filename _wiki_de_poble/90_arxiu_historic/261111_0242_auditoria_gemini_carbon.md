---
type: informe
status: esborrany
description: Certificació del Kit CAS R18.3 (presentació multipoble d'Arbres, Beta Oberta Pedra Seca, 4 columnes @container i /versions 5 llengües) i auditoria Gauntlet dels Kits R17.2, R17.2B i R18.2.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_0a88bdeb-d34b-4390-840d-6f9659f79fef:9cfc6b6e-1b6b-455a-971f-c09dc9742c52
---
# Auditoria Gauntlet de Gemini 4 Carbon · Marató Nocturna R18 Carril 3 (Kit R18.3, Portades Multipoble i Auditories R17)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0a88bdeb-d34b-4390-840d-6f9659f79fef:9cfc6b6e-1b6b-455a-971f-c09dc9742c52 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-11T01:42:42.853Z |
| Modificació | 2026-11-11T01:45:00.000Z |
| Propietari | gemini-carbon |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Carbon (High) · Google Antigravity (AI Ultra) |
| Tokens consumits | Sessió combinada R17.3 + R18.3: 1.392 passos / 10,0 MB transcript_full.jsonl (tram R18.3: ~396 passos / ~1,72 MB observats sobre base t0 53% setmanal / 98% 5h · Overages OFF; percentatge UI exacte pendent de lectura humana) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 8f66b7b4fba3395d1c2bd4111f085affeb2387bc0003ed18974d118221b05e61. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-11-11T01:42:42.853Z: esborrany creat al torn `torn_0a88bdeb-d34b-4390-840d-6f9659f79fef`.
- 2026-11-11T01:45:00.000Z: certificació completa del Kit CAS `R18.3`, auditoria adversarial Gauntlet creuada (`R17.2`, `R17.2B`, `R18.2`, dossiers `Node 0`) i dictamen biblioteconòmic `P0-107..P0-110`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Resum executiu del Carril 3 (`Kit R18.3` segellat i verificat)

S'han completat al worktree aïllat `/private/tmp/sdp_r18_carbon` (sobre la base reconciliada `6db207a21` = `HEAD c07f78b83` + `Kit R17.2` + `Kit R17.2B` + `Kit R17.3`) totes les entregues de `T1`, `T2` i `T3`, segellant el Kit CAS:

- **Directori del Kit CAS:** `../_investigacio_ia_de_poble/261111_kit_carbon_r18_presentacio_multipoble_panell_i_versions/`
- **`manifest.json` SHA-256:** `97ba2ab3a7ffdca6e230e79ee2ec2c8a6ea934adf89b639cb63e97cae1eaf27e` (`14` fitxers CAS amb preimatges exactes de la base `R17.2 + R17.2B + R17.3`).
- **`R18.3.patch` SHA-256:** `34bad6b27aba1b8d15eac2e716d5e73031be4e3881827cf1433c1523dec97ef4`.
- **`GAUNTLET_R17_2_I_R17_2B_FIXES.patch` SHA-256:** `ccfb41c274f5a3f2b670c13c86e375c177bfcb909f744c4bc3a5d6aeb5545394` (`3` fitxers de correcció per als bloquejos `P0` caçats a `R17.2` i `R17.2B`).
- **`SHA256SUMS` global del Kit:** `95dd45cc3bdbd28e4f6ffc0f48e1512638f52e25c07f5f5f835132962c53b64a`.
- **Entregues certificades dins del `Kit R18.3`:**
  1. **`P0-100 / IDEA-231` (`/page/arbres-monumentals` multipoble en 5 llengües):** transformada la portada d'arrel de `/page/arbres-monumentals` (`src/sections/text/pageContent.patrimoniR9.js` + `src/sections/text/pageContent.r10.js` en `ca`, `es`, `en`, `gl`, `eu`) en una biblioteca multipoble d'arbres emblemàtics amb La Torre de les Maçanes (`2007` + `2020`, `19` fitxes i seguiment longitudinal `CIEF v232`) com a primer model reproduïble per a qualsevol municipi, crida centrada **«Catalogar els arbres del meu poble»** i connexió germana amb l'herbari (`/page/herbari`), el banc de llavors (`/page/banc-de-llavors`) i l'anatomia rural (`/page/anatomia-rural`).
  2. **`P0-97 / IDEA-228` (Llei de Marca i metadades ASO d'App Store):** creat `scripts/botigues/metadades-aso-app-store.json` en `5` llengües (`ca`, `es-ES`, `en-US`, `gl`, `eu`) amb **Nom** `Sóc de Poble` (`12 <= 30`), **Subtítol** de marca (ex. `Xarxa veïnal per al món rural`, `29 <= 30`, zero referències a beta), paraules clau `< 100` bytes i text promocional `< 170` caràcters que situa amb claredat l'etapa de beta oberta comunitària; netejades simultàniament les mencions a `sobir*` i `Ollama`/`11434` a `_wiki_de_poble/01_ser/agents_equip_ia.md` i recompilat `src/data/wikiManifest.js` + `public/rag-index.json`.
  3. **`P0-101 / IDEA-232` (Insígnia Pedra Seca `.sdp-insignia-beta-oberta` + 4 columnes `@container` + `/versions` i `/disseny`):** definida `.sdp-insignia-beta-oberta` a `src/css/components.css` (`border-radius: 0`, tokens `--sdp-*`, contrast AAA en tema clar i fosc, `min-height: 28px`, zero estils en línia), unificada la graella `.sdp-cataleg-ws__graella` de `src/css/modules.css` en **4 llindars `@container` (`280px` → 1 col, `380px` → 2 cols, `520px` → 3 cols, `960px` → 4 cols)** compartits entre `/page/receptes` i `/page/arbres-monumentals`, documentat el patró a `/disseny` (`PAGE_COPY.disseny`) i actualitzada `/versions` (`FITA_R18` en les `5` llengües, `v1.1.14` / `R18`).

### 2. Auditoria Adversarial Gauntlet Creuada (`Kits R17.2`, `R17.2B`, `Codex R18.2` i `Node 0`)

#### `GAUNTLET-CARBON-R18-01` · `P0 · BLOQUEJANT` en `Kit R17.2` (`porta:design-guard`)

- **Fitxer o scope afectat:** `src/pages/AvisadorPage.test.jsx:12` (introduït per `261110_kit_codex_r17_avisador_drets_alergens`).
- **Evidència reproduïble:** En aplicar `Kit R17.2` i executar `npm run porta:design-guard` (`node tooling/quality/design_guard.mjs --baseline .agents/design-debt-baseline.json`), la porta avorta amb `exit 1`: `❌ DEUTE PUJA · h1-outside-header: 0 -> 1 (+1)` perquè el mock de `PageFrame` escriu `<main><h1>{title}</h1>{children}</main>` sense embolcallar l'`<h1>` dins d'un `<header class="page-title">` (`design_guard.mjs:293`).
- **Severitat justificada:** `P0` bloquejant — trenca la porta d'arquitectura Pedra Seca i impedeix tancar `R18a`.
- **Font de veritat en conflicte:** `tooling/quality/design_guard.mjs` + `.agents/design-debt-baseline.json` (`h1-outside-header: 0`).
- **Proposta conservadora:** Embolcallar l'`<h1>` del mock amb `<header className="page-title"><h1>{title}</h1></header>`. Pegat llest i verificat (`0` crítics, `0` avisos, `3/3` proves verdes) a `GAUNTLET_R17_2_I_R17_2B_FIXES.patch`.
- **`requires_human_decision`:** `false`.

#### `GAUNTLET-CARBON-R18-02` · `P0 · BLOQUEJANT` en `Kit R17.2B` (`paginesPubliques.sistemaR41.test.js`)

- **Fitxer o scope afectat:** `src/sections/text/pageContent.js:960` (`PAGE_COPY.dispositius = PAGINA_DISPOSITIUS`, introduït per `261111_kit_codex_r17_2b_ugc_revisions_i_fediversity`) vs `src/data/taxonomia/classificacioPaginesPubliques.js` i `src/data/taxonomia/paginesPubliques.sistemaR41.test.js`.
- **Evidència reproduïble:** Executar `npx vitest run src/data/taxonomia/paginesPubliques.sistemaR41.test.js` sobre `R17.2 + R17.2B` falla en `2` assercions (`expected 33 to equal 34` i `Cannot destructure property '0' of 'CLASSIFICACIO_PAGINES_PUBLIQUES[key]' as it is undefined` per a `key = 'dispositius'`).
- **Severitat justificada:** `P0` bloquejant — trenca l'invariant taxonòmic R41 de totes les pàgines públiques de `PAGE_COPY`.
- **Font de veritat en conflicte:** `src/data/taxonomia/classificacioPaginesPubliques.js` + `src/data/taxonomia/tesaurusDoctoralSocDePoble.js`.
- **Proposta conservadora:** Registrar `dispositius: ['tecnologia-lliure', 'Documentació']` a `CLASSIFICACIO_PAGINES_PUBLIQUES` i a la matriu d'`EXPECTED` de `paginesPubliques.sistemaR41.test.js` (`26 + 8 = 34`). Pegat llest i verificat (`218/218` proves verdes) a `GAUNTLET_R17_2_I_R17_2B_FIXES.patch`.
- **`requires_human_decision`:** `false`.

#### `GAUNTLET-CARBON-R18-03` · `P0 · RESOLT DINS KIT R18.3` (`pageContent.r9.test.js` vs `fediversity ca`)

- **Fitxer o scope afectat:** `src/sections/text/pageContent.r9.test.js:134` després d'aplicar `Kit R17.2B` (`src/sections/text/pageContent.js` afegeix `<h3>Candidatura NLnet · continuïtat del projecte</h3>` davant dels `7` apartats tècnics de `fediversity` en `ca`, igualant-lo a `es/en/eu/gl`).
- **Evidència reproduïble:** Amb `const inici = clau === 'fediversity' && llengua !== 'ca' ? 1 : 0`, `npx vitest run src/sections/text/pageContent.r9.test.js` fallava en `fediversity / ca` (`expected 'Candidatura NLnet · continuïtat del p…' to match /arquitectura|federaci/i`).
- **Severitat justificada:** `P0` bloquejant de suite R9 — **ja resolt directament dins del nostre `Kit R18.3`** (`const inici = clau === 'fediversity' ? 1 : 0;`, `34/34` proves verdes).
- **Font de veritat en conflicte:** Paritat estructural pentalingüe de `PAGE_COPY.fediversity`.
- **Proposta conservadora:** Ja inclosa a `Kit R18.3` (`payload/src/sections/text/pageContent.r9.test.js`).
- **`requires_human_decision`:** `false`.

#### `GAUNTLET-CARBON-R18-04` · `P0 · RESOLT DINS KIT R18.3` (`agents_equip_ia.md` → `wikiManifest.js`)

- **Fitxer o scope afectat:** `_wiki_de_poble/01_ser/agents_equip_ia.md` i l'artefacte compilat `src/data/wikiManifest.js`.
- **Evidència reproduïble:** En executar `node scripts/compile-wiki-to-app.mjs` sobre `HEAD`, els termes literals `Ollama` i `:11434` presents a `agents_equip_ia.md` passaven a `src/data/wikiManifest.js` i feien fallar `src/sections/text/pageContent.r9.test.js:556` (`/\bollama\b|(?<![\d.])11434(?!\d)/i`).
- **Severitat justificada:** `P0` bloquejant — impedia recompilar la Wiki pública sense trencar la guarda de vocabulari públic R9.
- **Font de veritat en conflicte:** Guarda R9 de vocabulari públic (`pageContent.r9.test.js:556`) i Llei de Vocabulari Natural (`P0-41`, zero `sobir*`).
- **Proposta conservadora:** Substituir per `motor local de pesos oberts` i eliminar `sobir*` a `agents_equip_ia.md`, recompilant `src/data/wikiManifest.js` i `public/rag-index.json`. **Ja segellat dins del `Kit R18.3`**.
- **`requires_human_decision`:** `false`.

#### `GAUNTLET-CARBON-R18-05` · `P1 · PARITAT MULTILINGÜE` en `Kit R17.2` (`AvisadorPage.jsx`)

- **Fitxer o scope afectat:** `src/pages/AvisadorPage.jsx` (`261110_kit_codex_r17_avisador_drets_alergens`).
- **Evidència reproduïble:** Totes les cadenes d'interfície (`L’Avisador`, `Batec de Vida`, `Horari de l’avís`, `Persones de confiança`, ` Posa en marxa`, etc.) estan escrites en valencià (`ca`) directament al JSX sense diccionari pentalingüe (`ca`, `es`, `en`, `gl`, `eu`).
- **Severitat justificada:** `P1` — no trenca cap porta ni prova de `R18a`, però deixa `/avisador` sense traducció curada en les altres 4 llengües de l'App Store.
- **Font de veritat en conflicte:** Paritat pentalingüe de les pantalles principals (`ca, es, en, gl, eu`).
- **Proposta conservadora:** Integrar `R17.2` en `R18a` (amb el fix `GAUNTLET-CARBON-R18-01`) i extraure les cadenes d'`AvisadorPage.jsx` a un mapa pentalingüe en la passada següent.
- **`requires_human_decision`:** `false`.

#### `GAUNTLET-CARBON-R18-06` · `P2 · HIGIENE DOM I CSS` en `Kit R17.2` (`CandidatsAlergens.jsx` i instantània CSS)

- **Fitxer o scope afectat:** `src/components/PedraSeca/molecules/CandidatsAlergens.jsx:30` i `.agents/classes-orfes-snapshot.json` (avís de `qualitat.classesOrfes.test.js`).
- **Evidència reproduïble:** (1) Dins d'un `<li>` amb text en línia s'imbrica un `<p className="text-muted">` de bloc en lloc d'un `<span>` o bloc homogeni; (2) `qualitat.classesOrfes.test.js` passa en verd però emet avís informatiu que `.ProseMirror-selectednode` ja té consumidor viu i es pot retirar de la instantània d'òrfenes.
- **Severitat justificada:** `P2` — millora semàntica i neteja d'instantània sense impacte funcional.
- **Font de veritat en conflicte:** Semàntica HTML neta Pedra Seca i higiene d'instantànies CSS.
- **Proposta conservadora:** Canviar `<p className="text-muted">` per `<span className="text-muted">` en `CandidatsAlergens.jsx:30` en un proper toc del component.
- **`requires_human_decision`:** `false`.

#### Revisió creuada de `Codex R18.2`, `Claude R18` i dossiers del `Node 0`

- **Carril 2 (`Codex · Kit R18.2`):** En el moment de tancar aquesta auditoria (`02:44 CET`), `ESTAT_SINAPTIC.json` registra Codex en `estat = "verificant_ronda_3"` (`ronda_gauntlet = 3`, `sha256_instantania = 37e86d84538ebd8e43dba745ba034892ab6d14a4493b6e38ffc37b85f4b3bf0c`) havent corregit `R18-C1` (`src/data/patrimoni/revisionsArbresCief.js`, qualificacions sanitàries inferides i cotes 2007 sobre fotos 2020) més 5 punts de robustesa d'importació (`cursa_lectura_inicial`, `cursor_amb_campanya_antiga`, `identitat_multipoble`, `renderitzador_de_font`, `xml_limit_i_escaner`). L'arquitectura de `Kit R18.3` manté **zero intersecció de fitxers modificats** amb el carril de Codex (`NaturaPatrimoniWorkspaceSection.jsx`, `esquemaDoctoralArbres.js`, `FitxaArbreMonumental.jsx`, `revisionsArbresCief.js`), i l'asserció de `PageDetailSection.patrimoniR9.test.jsx` (`>= 19`) és 100% compatible tant amb les 19 fitxes del llibre 2020 com amb la unió 2007+2020.
- **Carril 1 (`Claude Opus 5.5`):** `261111_0206_auditoria_claude.md` deixa constància que `tooling/gates/hooks-local.mjs` impedeix a Claude escriure fora del repo (`ESTAT_SINAPTIC.json`), reportant `estat = "integrant_r18a"`. S'espilla aquesta nota al tauler sinàptic per a MarIA.
- **Filtrat crític dels dossiers del `Node 0` i salut del Llibre Mestre:**
  1. En `DOSSIER_NODE0_R18_PLUGINS_I_SEPARACIO_DADES.md` (`qwen2.5-coder:14b`), es descarten les mencions genèriques a `Webpack` i `Redux` (Sóc de Poble opera exclusivament sobre Vite 8 + `React.lazy` i ports/contextos purs).
  2. En `DOSSIER_NODE0_R18_HIGIENE_I_TESI_ARBRES.md`, es descarta la proposta d'auto-esborrar/arxivar automàticament quan hi ha `>5` fitxers a `04_escriptori/`: `AGENTS.md §0.1/§5` i `porta-olivera.mjs` governen la retenció real i prohibeixen esborrats destructius.
  3. **Alerta documental per a MarIA (`requires_human_decision: false`, acció d'orquestradora):** La línia final `494` de `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` presenta un tall preexistent (`... [truncated for diff preview]` dins `P0-73`). No s'ha tocat per no col·lidir amb escriptures d'altres carrils; MarIA pot restaurar la cua des de `RESGUARD_NOVES_FILES_LLIBRE_MESTRE_P078_P099.md` i `backup_protector_03_llibre_mestre_261111_0225.md`.

### 3. Dictamen Biblioteconòmic i d'Arquitectura sobre les Ordres Vives `P0-107..P0-110` (`02:41 CET`)

En resposta a l'encàrrec col·legiat a totes les IAs publicat en `ESTAT_SINAPTIC.json.ordres_mestre_en_viu_r18`:

1. **`P0-108` (Arquitectura Biblioteconòmica `Ranganathan PMEST + ISAD(G) + SKOS + Frictionless Data Package v2`):**
   - **Veredicte d'escalabilitat a 500 pobles:** Aprovat amb **4 regles canòniques d'invariància**:
     - *(Regla 1 · Nivell 2 acotat a 7 sèries documentals navegables a simple vista en Finder i `UniversalWorkspace` col. 1):* `gastronomia/`, `arbres-emblematics/`, `herbari/`, `banc-de-llavors/`, `arquitectura-pedra-seca/`, `rutes-i-camins/`, `memoria-oral/` (compleix la llei cognitiva `7±2` sense necessitat de cercador inicial).
     - *(Regla 2 · Nivell 3 com a slug `<ambit-territorial>-<obra-o-any>`):* ex. `la-torre-de-les-macanes-2007/`, `la-torre-de-les-macanes-2020/`, `el-comtat-que-dinem-2024/`. Resol de soca-rel els dos grans colls d'ampolla arxivístics: les **obres supramunicipals/comarcals** (com *Què dinem?* o la *Trilogia Mediterrània*) i les **múltiples edicions temporals** d'un mateix municipi (`2007` vs `2020` d'arbres).
     - *(Regla 3 · Desacoblament URN/SKOS respecte a la ruta física + `datapackage.json`):* Cada carpeta de Nivell 3 conté un `datapackage.json` Frictionless amb identificador canònic `urn:sdp:patrimoni:<serie>:<colleccio>:<item>` i `conceptesSkos[]`; així, si als `>250` pobles s'introdueix partició per comarca en Supabase Storage (`03-el-comtat/la-torre-...`), cap URL d'aplicació (`/page/arbres-monumentals`, `/receptes/:slug`) no es trenca mai.
     - *(Regla 4 · Isomorfisme 1:1):* `public/assets/uploads/patrimoni/<serie>/<colleccio>/` ↔ `src/data/patrimoni/<serie>/<colleccio>/` ↔ `Supabase Storage bucket patrimoni/<serie>/<colleccio>/` ↔ les 4 columnes d'`UniversalWorkspace` (*Sèrie → Col·lecció/Poble → Graella UniversalCard → Fitxa Longitudinal*).
2. **`P0-107` (`SquareBadge` geolocalitzat Opció 1) i `P0-110` (`/page/publicar_mapa`):**
   - **Sinergia immediata amb `Kit R18.3`:** La portada multipoble de `/page/arbres-monumentals` que demana `P0-110` com a destí de la `UniversalCard` d'exemple (amb el botó centrat *«Catalogar els arbres del meu poble»* i referència germana a plantes/herbari i llavors) **ja queda 100% construïda i segellada en aquest `Kit R18.3`**.
   - **Salvaguarda crítica de pressupost (`250.000 B gzip`) per a qui implemente `P0-107` i `P0-110`:** *(a)* A `/page/publicar_mapa`, `MapaFotografic` s'ha d'importar obligatòriament amb `lazyRoute(() => import('../mur/MapaFotografic.jsx'))` (com a `MurSection.jsx:46`) perquè Leaflet (`~45 KB gzip`) no entre mai al paquet d'arrencada; *(b)* El `SquareBadge` verd `--sdp-verd #0e662e` sobre `#ffffff` compleix **WCAG AAA (`7,18:1 >= 7:1`)**, ha de renderitzar `<button type="button">` amb `e.stopPropagation()` cap a `/mapa?lat=...&lng=...&zoom=18&id=...` i mantenir lleuger `SquareBadge.jsx` per respectar `src/apps/plataforma/pesDelNucli.test.js`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

 Totes les comprovacions s'han executat realment al worktree `/private/tmp/sdp_r18_carbon` i sobre un worktree net de verificació CAS (`/private/tmp/sdp_r18_carbon_base_wt`, eliminat en acabar):

- **Aplicació CAS de `Kit R18.3` (`applyKit` dry-run + write + `validateFrontissa`):** `14/14` fitxers verificats per SHA-256 (`valid: true`, `0` discrepàncies).
- **Compilació Wiki → App (`node scripts/compile-wiki-to-app.mjs`):** `PASS` (`82` documents compilats, `9` categories, `0` ocurrències d'`ollama`/`11434` i `0` ocurrències de `sobir*`).
- **ESLint (`npm run lint`):** `PASS` (`0` errors, `0` warnings).
- **11 Portes Constitucionals del Reflex:**
  - `npm run porta:pedra-seca` → `PASS`
  - `npm run porta:inlinestyles` → `PASS` (`0` estils en línia)
  - `npm run porta:vocabulari` → `PASS` (`0` classes forasteres noves)
  - `npm run porta:tokens` → `PASS`
  - `npm run porta:fitxa` → `PASS`
  - `npm run porta:promesa` → `PASS` (`P3 = 0`)
  - `npm run porta:frontissa` → `PASS` (`arbres-monumentals`, `receptes`, `disseny`, `versions` aprovades)
  - `npm run porta:enxufe` → `PASS`
  - `npm run porta:cens` → `PASS`
  - `npm run check:secret-literals` → `PASS` (`5.322` fitxers escanejats, `0` troballes)
  - `npm run porta:design-guard` (amb `GAUNTLET_R17_2_I_R17_2B_FIXES.patch` aplicat) → `PASS` (`3.678` fitxers, `0` crítics, `0` avisos)
- **Suites Vitest executades (`10/10` suites · `376/376` tests en verd):**
  - Carril `R18.3`: `8/8` suites, **`155/155` proves PASS** (`onadaR18Carbon.test.jsx` `12/12`, `PageDetailSection.patrimoniR9.test.jsx` `11/11`, `pageContent.r9.test.js` `34/34`, `pageContent.versions.test.js` `22/22`, `qualitat.classesOrfes.test.js`, `ReceptesQueDinem.test.jsx`, `NaturaPatrimoniWorkspaceSection.test.jsx`, `pesDelNucli.test.js`).
  - Verificació Gauntlet `R17.2 + R17.2B`: `2/2` suites, **`221/221` proves PASS** (`AvisadorPage.test.jsx` `3/3`, `paginesPubliques.sistemaR41.test.js` `218/218`).
- **Build de Producció i Pressupost de Closca Pura (`node tooling/gates/pressupost-paquet.mjs`):** `PASS` — `dist/assets/index-BxA-mu-y.js` = `695.082 B` cru / **`242.727 B gzip -9`** (`<= 250.000 B`, marge lliure de **`+7.273 B`**).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Frontera d'escriptura:** Cap fitxer de `src/`, `public/`, `scripts/` o `_wiki_de_poble/01_ser/` s'ha modificat a l'arbre viu de `socdepoble.org/`; tot el codi del Carril 3 s'entrega segellat dins del Kit CAS `261111_kit_carbon_r18_presentacio_multipoble_panell_i_versions`.
- **Condició del vot d'excel·lència (`vot_excel_lencia: true` condicionat):** L'integrador (`Claude` / `MarIA`) ha d'aplicar conjuntament `GAUNTLET_R17_2_I_R17_2B_FIXES.patch` (`3` fitxers) en consolidar `R17.2 + R17.2B` dins de `R18a` perquè `porta:design-guard` i `paginesPubliques.sistemaR41.test.js` isquen 100% en verd abans d'aplicar `Kit R18.3`.
- **Feedback sobre la plantilla `prompt_local` (`§6.4`):** La plantilla `v3.11.0` i el prompt `261111_0148_prompt_gemini_carbon...` han sigut exemplars i autosuficients. Única millora suggerida per a futures maratons nocturnes: recordar explícitament a la secció `Preflight` que `tooling/gates/hooks-local.mjs` bloqueja a Claude l'escriptura fora del repo (`ESTAT_SINAPTIC.json`), habilitant una ruta interna mirall a `_wiki_de_poble/04_escriptori/` per al tauler sinàptic.
- **Parada neta (`Kill Switch IDEA-07`):** `0` processos en segon pla, `0` subagents actius i `0` worktrees auxiliars oberts a les `02:45 CET` (molt abans del límit `06:30 CET`).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261111_0148_pla_implementacio_marato_nocturna_r18_sistema_nervios_plugins_i_arbres]]
- [[../90_arxiu_historic/261111_0148_prompt_gemini_carbon_marato_nocturna_r18_panell_control_portades_i_gauntlet|261111_0148_prompt_gemini_carbon_marato_nocturna_r18_panell_control_portades_i_gauntlet]]
- [[261111_0205_auditoria_codex]]
- [[261111_0206_auditoria_claude]]
- [[agents_equip_ia]]
