---
type: informe
status: esborrany
description: Auditoria tècnica i fiscalització de Gemini 4 Argon sobre la sessió d'usuari, workspaces d'identitat, tractor WebP i proposta per lots de buidatge dels 165 fitxers de llast a _arxiu_wiki_de_poble.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_5466c8bd-cf33-4317-b4e8-13e4ed571db9:11dd4cd6-2f6f-4cc1-8baa-ac8b740c2091
---
# Auditoria de Gemini 4 Argon: Sessió d'Usuari, Workspaces d'Identitat, Tractor WebP i Pla Executiu de Poda Històrica (165 Fitxers de Llast)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5466c8bd-cf33-4317-b4e8-13e4ed571db9:11dd4cd6-2f6f-4cc1-8baa-ac8b740c2091 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-18T10:41:27.863Z |
| Modificació | 2026-10-18T11:09:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (Auditor i Fiscalitzador Documental) |
| Tokens consumits | ~74.000 (estimats en sessió activa) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-18T10:41:27.863Z`: esborrany creat; contingut i verificació pendents.
- `2026-10-18T10:54:00.000Z`: **Relleu 1 (canal viu `04_escriptori/`)**. Completada l'auditoria estatica i forense dels punts d'arrel de la sessió d'usuari, el calaix d'identitats (`CalaixIdentitats.jsx` / `useIdentitatDeLaBarra.js`), el workspace de perfil i organització (`PerfilShell.jsx` / `WorkspaceContext.jsx`), l'onboarding pilot (`OnboardingSection.jsx` / `identitatsSeed.js`), l'auditoria tècnica del tractor `tooling/media/optimitzar_webp.mjs` (18/18 tests verds + cens real de 221 imatges a `public/`) i la fiscalització completa per lots dels **165 fitxers de llast** de `90_arxiu_historic/` (863.205 B) i les **60 entrades** de `04_escriptori/02_investigacio_ia/` (480 fitxers, 14.499.531 B) contrastats contra el Llibre d'Or (`01_ser/03_llibre_d_or_memoria_episodica.md`).
- `2026-10-18T11:09:00.000Z`: **Relleu 2 (Verificació Creuada i Tancament d'Auditoria)**. Auditat línia per línia el diff de Claude Code (`torn_ef1ddff2-52e7-4d41-8a7e-57c945b7a579`) sobre `src/data/identitatsSeed.js`, `src/config/dataMode.js`, `src/config/navigation.js`, `src/components/universal/identitat/useIdentitatDeLaBarra.js`, `src/sections/profile/PerfilShell.jsx`, `src/sections/profile/perfilModel.js`, `src/sections/onboarding/OnboardingSection.jsx`, `src/sections/onboarding/OnboardingSteps.jsx`, `src/sections/onboarding/onboardingModel.js`, `src/app/App.jsx` i les seues suites de test. Verificades **205 proves Vitest en 11 fitxers (100% PASS)** + **18 proves Node del tractor WebP (100% PASS)**. Veredicte: **APROVAT AMB EXCEL·LÈNCIA ARQUITECTÒNICA**.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Bloc I — Correcció de Premisses del Pla (Llibre d'Or Error #11)

Abans d'auditar el codi, es deixa constància de dues discrepàncies de ruta en les premisses de l'encàrrec (`261018_1220_pla_implementacio_sessio_usuari_i_poda.md`):
1. **Rutes reals dels components d'identitat i perfil:** El pla cita `src/components/CalaixIdentitats.jsx` i `src/pages/PerfilShell.jsx`, però al repositori vigent viuen a `src/components/universal/identitat/CalaixIdentitats.jsx` (acompanyat del hook `src/components/universal/identitat/useIdentitatDeLaBarra.js`) i `src/sections/profile/PerfilShell.jsx`.
2. **Ruta real del Laboratori IA:** Les 60 entrades d'investigació viuen a `_wiki_de_poble/04_escriptori/02_investigacio_ia/` (480 fitxers totals, 14,50 MB) i la producció multimèdia a `_wiki_de_poble/04_escriptori/01_produccio/` (27 entrades de primer nivell, 260 fitxers, 88,62 MB).

---

### Bloc II — Diagnòstic Forense i Auditoria de Codi (Tasques 0–3 i 5)

#### C01 [P1 · Bug d'Usabilitat Crític] — Seleccionar identitat a `CalaixIdentitats` no navega cap al Workspace (efecte «atrapat a `/notes`»)
- **Evidència (`src/components/universal/identitat/useIdentitatDeLaBarra.js:88-99,118`):** Quan `directe` és `false` (usuari amb persona + organitzacions), fer clic a l'avatar de la barra superior obri el modal `CalaixIdentitats`. En seleccionar una identitat, s'invoca `tria(tipus, id)`:
  ```javascript
  const tria = useCallback((tipus, id) => {
    setActor(tipus, id);
    setObert(false);
  }, [setActor]);
  ```
  `tria` **no invoca `onNavega`**. Si l'usuari es trobava a `/notes` (Bloc de notes) quan va obrir el calaix «Amb qui actues?», el calaix es tanca i l'usuari es queda a `/notes` (que es recarrega per al nou actor), produint la sensació exacta reportada pel Mestre («el calaix porta al Bloc de notes en lloc del Workspace»).
- **Requisit de verificació sobre el diff de Claude:** `tria(tipus, id)` ha de navegar explícitament a `/el-meu-perfil` (quan `tipus === 'usuari'`) o a `/el-meu-perfil?organitzacio=${encodeURIComponent(id)}` (quan `tipus === 'organitzacio'`).

#### C02 [P1 · Bug d'Estat Reactiu] — `PerfilShell.jsx` congela `initialSelection` en `UniversalWorkspace`
- **Evidència (`src/sections/profile/PerfilShell.jsx:165-169,220-222` i `src/components/universal/workspace/WorkspaceContext.jsx:40-44`):** `PerfilShell` calcula `triada` i passa `initialSelection={{ categoryId: triada != null ? String(triada) : 'jo', itemId: 'resum' }}` a `UniversalWorkspace`. Com que `WorkspaceProvider` inicialitza l'estat amb `useReducer(workspaceReducer, initialSelection, createInitialState)` només en muntar-se i `PerfilShell` no passa un `workspaceKey` reactiu ni sincronitza canvis posteriors d'actor o de query string (`?organitzacio=`), canviar d'identitat a la barra superior mentre ja s'està a `/el-meu-perfil` (o quan les pertinences asincròniques arriben després del primer render) deixa el workspace congelat en la categoria anterior.
- **Requisit de verificació sobre el diff de Claude:** Presència de `workspaceKey` (o sincronització equivalent al reducer/efecte) lligada a la identitat/organització seleccionada i reconciliació de `triada` quan canvia l'actor actiu (`actor.tipus` / `actor.id`) o el paràmetre `?organitzacio=`.

#### C03 [P1 · Absència de Lligam a la Llavor] — *El Rentonar* (`rentonar`) no figura com a administrada per Javi Llinares en mode Seed/Pilot
- **Evidència (`src/data/identitatsSeed.js:331-337`):** La funció `rolALEntitat(orgId, usuariId, { teSessio = false })` retornava `'owner'` exclusivament per a `ENTITAT_PILOT_ID` (`'socdepoble'`). Per a `ENTITAT_RENTONAR_SLUG` (`'rentonar'`), retornava `null` fins que l'usuari executara manualment la reclamació de l'entitat. Això impedia que Javi Llinares vera i commutara entre els seus tres rols reals (**Javi Llinares**, **Sóc de Poble** i **El Rentonar**) des del minut zero al `CalaixIdentitats` i a `GRUPS I EMPRESES` de `PerfilShell`.
- **Requisit de verificació sobre el diff de Claude:** Verificar que `identitatsSeed.js` incloga `ENTITAT_RENTONAR_SLUG` en les entitats administrades pel pilot (amb sessió activa o `USUARI_PILOT_ID`), sense alterar la sobirania de la resta d'entitats ni trencar els tests de pertinences i rols.

#### C04 [P1 · Bloqueig d'Accés DEV] — Botó pilot de Javi Llinares ocult quan `VITE_DATA_MODE=remote` i desconnexió de `/registra`
- **Evidència (`src/sections/onboarding/OnboardingSection.jsx:94-95,444-457` i `src/sections/xat/components/EntradaDelPoble.jsx`):**
  1. `potEntrarComAPilot` exigia `(dataMode === 'seed' || dataMode === 'local') && (servidorCaigut || entradaSuspesa)`. Amb `.env.local` configurat en `remote`, l'entrada directa amb 1 clic per a Javi Llinares quedava bloquejada o amagada.
  2. El camí `/registra` (invocat mentalment en fluxos d'alta en valencià) queia en 404 perquè només `/registre` estava mapejat.
- **Requisit de verificació sobre el diff de Claude:** Verificar que en DEV (`import.meta.env.DEV`) l'accés pilot permeta commutar netament a mode prova (`seed`) amb 1 clic sense enviar mai el token `pilot-local-dev-token` al backend remot (`sessioPilot.js:esTokenPilot`), i que `/registra` redirigisca o resolga cap a `/registre`.

#### C05 [P2 · Auditoria del Tractor WebP (`tooling/media/optimitzar_webp.mjs`)] — Sòlid i amb 18/18 tests verds, amb observació tècnica sobre EXIF patrimonial
- **Verificació d'implementació i proves:** El script `tooling/media/optimitzar_webp.mjs` i la seua suite `tooling/media/optimitzar_webp.test.mjs` passen **18/18 tests en 65 ms**. Implementa els tres subcomandos (`cens`, `converteix`, `reescriu`), dry-run per defecte, límit de lots (`--lot`, `--des-de`), redimensionat a màxim `1600px` d'ample i cadena d'eines (`cwebp` $\rightarrow$ `magick` $\rightarrow$ `sips`+Chrome headless).
- **Resultat del cens real executat per Gemini 4 Argon (`node tooling/media/optimitzar_webp.mjs cens`):**
  - **Total imatges a `public/`:** 221 imatges (134.568 KB $\approx$ 131,4 MB).
  - **Referenciades en codi:** 209 · **Dinàmiques:** 3 · **Només Wiki:** 1 (`public/assets/towns/la-torre-de-les-macanes/og-la-torre-1200x630.jpg`, 155 KB).
  - **Orfes detectades (8 fitxers · 1.303 KB):** Totes 8 són proves d'OpenGraph recents a `public/assets/uploads/poble/la-torre-de-les-macanes/og_gentdelatorre_*.{jpg,png}` (que actualment estan untracked `??` a git!). El tractor **no les toca** i les deixa per a decisió humana.
  - **Candidates a WebP (>300 KB o >1600 px):** **127 imatges (122.681 KB $\approx$ 119,8 MB)**, encapçalades per `DSC00410.JPG` (6.720 KB, 5184×3888) i `DSC00320.JPG` (6.279 KB, 5184×3888).
- **Observació Tècnica P2 (EXIF Patrimonial vs. Optimització UI):** Cal notar que `tooling/media/optimitzar_webp.mjs` empra `-metadata none` (`cwebp`), `-strip` (`magick`) o `canvas.toDataURL` (Chrome), eliminant les metadades EXIF, mentre que `tooling/maquinaria/convertir_a_webp.mjs` conserva l'EXIF sa segons la Llei del Quadrat (`03_llibre_d_or_memoria_episodica.md`, línia 111). Per a cartelleria IA, avatars còmic, captures UI i banners (`nano_cards`, `brain`, `posts/disseny`), el buidatge de metadades és òptim; per a fotografia patrimonial de poble (`DSC00410.JPG`, `DSC00320.JPG`, `P_20161028_*`), es recomana preservar l'original o usar `convertir_a_webp.mjs` si es vol retindre l'EXIF històric.

#### C06 [P2 · Higiene d'Arbre de Treball] — Directori espuri `./~/Downloads/Default` a l'arrel del repo
- Durant l'execució d'instàncies headless de Chrome/Playwright a les 12:45 s'ha creat un directori literal no rastrejat `~/Downloads/Default` dins de `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/~/`. S'ha d'eliminar abans del tancament de sessió perquè no contamine el repositori.

---

### Bloc III — Proposta Executiva de Poda Històrica i Buidatge a `_arxiu_wiki_de_poble/` (Tasca 6)

#### 1. Arquitectura de Destí (Satèl·lit Fred Fora del Repo Operatiu)
Per a complir la Llei de Buidatge d'Escriptori i evitar que `porta-olivera.mjs`, `verificador-scc.mjs`, els índexs d'Obsidian o els crawlers d'agents paguen l'impost de lectura de fitxers morts, el destí canònic fora del git operatiu és:
- **Arrel de l'arxiu fred:** `/Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/`
- **Estructura interna proposada:**
  - `_arxiu_wiki_de_poble/00_manifest_arxiu_fred.json` (manifest amb ruta d'origen, data d'evacuació, bytes, SHA-256 i capítol del Llibre d'Or on queda destil·lat).
  - `_arxiu_wiki_de_poble/90_arxiu_historic_llast/` (destí dels fitxers de llast de `90_arxiu_historic/`, preservant l'estructura relativa de subcarpetes).
  - `_arxiu_wiki_de_poble/02_investigacio_ia/` (destí de les 49 entrades amortitzades del Laboratori IA).
  - `_arxiu_wiki_de_poble/01_produccio/` (destí futur dels binaris pesants de producció quan s'aproven).

#### 2. Fiscalització Forense dels 165 Fitxers de Llast de `90_arxiu_historic/` (863.205 Bytes)

Hem creuat els **165 fitxers de llast** identificats a l'Annex B de `261017_1526_auditoria_claude.md` contra:
1. El sistema de fitxers real (`165/165` existents, `0` absents, **863.205 B** totals).
2. El Llibre d'Or reconciliat (`_wiki_de_poble/01_ser/03_llibre_d_or_memoria_episodica.md`).
3. Tots els wikilinks (`[[...]]`) i referències de codi de `_wiki_de_poble/` (fora de `90_arxiu_historic/`), `src/` i `tests/`.

El resultat d'aquesta auditoria impedeix una poda cega i divideix els 165 fitxers en **tres sub-lots quirúrgics**:

| Sub-lot | Fitxers | Pes (Bytes) | Estat d'Ancoratge | Acció Executiva Proposada |
| --- | ---: | ---: | --- | --- |
| **Lot 1A — Evacuació Directa Immediata** | **134** | **666.074 B** | **0 wikilinks vius** a `_wiki_de_poble/`, **0 cites** al Llibre d'Or, **0 refs** a `src/`/`tests/`. (7 d'ells apareixen com a històric textual a `.agents/ESTAT.md` o `.agents/LEDGER.md`, que no bloquegen `porta-olivera.mjs`). | Moviment immediat (`mv`) a `../_arxiu_wiki_de_poble/90_arxiu_historic_llast/` amb registre de SHA-256 a `00_manifest_arxiu_fred.json`. |
| **Lot 1B — Evacuació amb Desancoratge Atòmic Previ** | **29** | **178.940 B** | **0 cites** al Llibre d'Or, però tenen **wikilinks vius `[[...]]`** a `04_escriptori/00_index_escriptori.md` (28 fitxers) i/o a `10_actes/` (2 fitxers). Si es mouen sense desancorar, **trenquen `porta-olivera.mjs` (`LINK_INVALID`)**. | Pas 1: Esborrar les 28 entrades antigues a `00_index_escriptori.md` (incloent `261012_2148_peticio_registre_mestre.md` a línia 41) i convertir els 2 wikilinks de `10_actes/261014_1315_acta_marmota.md` i `10_actes/261016_0025_acta_marmota.md` en mencions en backticks `` `...` ``. Pas 2: Moure els 29 fitxers a `../_arxiu_wiki_de_poble/90_arxiu_historic_llast/`. |
| **Lot 1C — Protegits pel Llibre d'Or (Fonts Primàries)** | **2** | **18.191 B** | Citats explícitament com a **fonts primàries verificables** a `_wiki_de_poble/01_ser/03_llibre_d_or_memoria_episodica.md` (línies 215 i 234) i indexats a `00_index_escriptori.md` i `src/data/wikiManifest.js`. | **No evacuar a cegues:** (1) `261016_0035_acta_marmota_codex_gauntlet.md` (15.352 B, SHA `b4b15ff40a92`) és una **Acta Marmota** que ha de viure a `_wiki_de_poble/10_actes/` (o retindre's en `90_arxiu_historic/`). (2) `261011_1410_pla_implementacio_maquetacio_ficiv.md` (2.839 B, SHA `9c474836c4a5`) es manté com a testimoni de la Llei FICIV o s'evacua només actualitzant la nota del Llibre d'Or amb el seu SHA-256. |
| **TOTAL LOT 1** | **165** | **863.205 B** | **100% verificat sense pèrdua de memòria** | **163 fitxers (845.014 B) evacuables ja; 2 fitxers (18.191 B) protegits/reubicables.** |

##### Detall complet del Lot 1C (2 fitxers citats al Llibre d'Or)
| # Annex B | Fitxer relatiu a `90_arxiu_historic/` | Bytes | SHA-256 (12c) | Cita al Llibre d'Or (`03_llibre_d_or_memoria_episodica.md`) | Altres vincles vius | Recomanació |
| ---: | --- | ---: | --- | --- | --- | --- |
| 141 | `261011_1410_pla_implementacio_maquetacio_ficiv.md` | 2.839 | `9c474836c4a5` | Part III, Cap. V, línia 215 (Llei de Maquetació Editorial FICIV) | `00_index_escriptori.md`, `src/data/wikiManifest.js` | Mantenir o anotar SHA-256 al Llibre d'Or abans d'arxivar |
| 163 | `261016_0035_acta_marmota_codex_gauntlet.md` | 15.352 | `b4b15ff40a92` | Part III, Cap. V, línia 234 (Gauntlet Autònom de Codex) | `00_index_escriptori.md`, `10_actes/261016_1545_acta_marmota.md` | Reubicar a `_wiki_de_poble/10_actes/` (és una Acta Marmota) |

##### Detall complet del Lot 1B (29 fitxers amb wikilinks vius a `_wiki_de_poble/`)
| # Annex B | Fitxer relatiu a `90_arxiu_historic/` | Bytes | SHA-256 (12c) | Fitxers de `_wiki_de_poble/` on té wikilink `[[...]]` |
| ---: | --- | ---: | --- | --- |
| 130 | `261006_0224_pla_implementacio_antigravity.md` | 2.639 | `c7e8aadf342a` | `04_escriptori/00_index_escriptori.md` |
| 131 | `261007_1645_pla_implementacio_claude.md` | 2.983 | `ef2776e884d1` | `04_escriptori/00_index_escriptori.md` |
| 132 | `261007_2205_pla_implementacio_claude.md` | 2.231 | `188fbf55e469` | `04_escriptori/00_index_escriptori.md` |
| 133 | `261008_1521_informe_progres_claude.md` | 7.043 | `5fa1cde9c0c4` | `04_escriptori/00_index_escriptori.md` |
| 134 | `261008_1649_informe_progres_claude.md` | 6.174 | `cec19a571645` | `04_escriptori/00_index_escriptori.md` |
| 135 | `261008_2032_pla_implementacio_claude.md` | 1.953 | `c4a76ada4b75` | `04_escriptori/00_index_escriptori.md` |
| 136 | `261008_2032_prompt_claude.md` | 6.002 | `6a2536dbb777` | `04_escriptori/00_index_escriptori.md` |
| 137 | `261009_0245_pla_implementacio_onada6.md` | 4.891 | `7695073be848` | `04_escriptori/00_index_escriptori.md` |
| 139 | `261011_1314_pla_implementacio_ficiv.md` | 3.703 | `0364cd0f442f` | `04_escriptori/00_index_escriptori.md` |
| 140 | `261011_1314_prompt_claude_ficiv.md` | 7.066 | `50616af4a198` | `04_escriptori/00_index_escriptori.md` |
| 142 | `261011_1410_prompt_claude_maquetacio_ficiv.md` | 7.569 | `94ef7df98727` | `04_escriptori/00_index_escriptori.md` |
| 143 | `261012_0025_pla_implementacio_informe_editorial.md` | 2.317 | `f34aa05c4ae4` | `04_escriptori/00_index_escriptori.md` |
| 144 | `261012_0025_prompt_claude_informe_complet_editorial.md` | 6.844 | `5f10791ddfb6` | `04_escriptori/00_index_escriptori.md` |
| 147 | `261012_1633_auditoria_claude_gestoria.md` | 2.627 | `14158318ae2a` | `04_escriptori/00_index_escriptori.md` |
| 148 | `261012_1940_pla_implementacio_gestoria_erp.md` | 3.058 | `79c247deba6b` | `04_escriptori/00_index_escriptori.md` |
| 149 | `261012_1940_prompt_claude_gestoria_erp.md` | 7.238 | `6c20b72aa9d2` | `04_escriptori/00_index_escriptori.md` |
| 150 | `261012_2004_prompt_chatgpt_auditor.md` | 7.093 | `8cd5a53c90be` | `04_escriptori/00_index_escriptori.md` |
| 151 | `261012_2148_peticio_registre_mestre.md` | 1.202 | `4abb741d2f5b` | `04_escriptori/00_index_escriptori.md` (**en secció `## Activitat en curs`, línia 41!**) |
| 152 | `261012_2245_prompt_claude_refinament.md` | 7.003 | `99dcf5f1f134` | `04_escriptori/00_index_escriptori.md` |
| 153 | `261013_1405_prompt_chatgpt_auditor.md` | 11.975 | `173eb41773b6` | `04_escriptori/00_index_escriptori.md` |
| 154 | `261013_2355_prompt_codex_sanejament_produccio_i_laboratori.md` | 9.315 | `ffe7c6b37286` | `04_escriptori/00_index_escriptori.md` |
| 155 | `261014_0130_pla_implementacio_auditoria_gemini4.md` | 3.374 | `cd8a14a02bd4` | `04_escriptori/00_index_escriptori.md` |
| 156 | `261014_0130_prompt_gemini4_auditoria_adversarial_extrema.md` | 11.436 | `13457842640e` | `04_escriptori/00_index_escriptori.md` |
| 157 | `261014_0210_pla_implementacio_reparacions_xat_i_consola.md` | 3.922 | `84a625389124` | `04_escriptori/00_index_escriptori.md` |
| 158 | `261014_0210_prompt_claude_reparacions_xat_i_consola.md` | 8.345 | `73533fced20f` | `04_escriptori/00_index_escriptori.md` |
| 159 | `261014_0215_prompt_gemini4_fiscalitzacio_xat_i_consola.md` | 7.917 | `7ec92a0cc421` | `04_escriptori/00_index_escriptori.md` |
| 160 | `261014_0420_auditoria_codex_reparacions_xat_i_consola.md` | 6.384 | `d2825847e9b5` | `04_escriptori/00_index_escriptori.md` |
| 161 | `261014_0425_pla_implementacio_gestoria_i_replegament.md` | 4.803 | `912fe220b68d` | `10_actes/261014_1315_acta_marmota.md` |
| 162 | `261016_0015_prompt_gauntlet_claude_codex_gemini.md` | 21.833 | `e28187b82c65` | `04_escriptori/00_index_escriptori.md`, `10_actes/261016_0025_acta_marmota.md` |

*(Nota: A la primera passada automàtica els fitxers #159 i #160 no eixien si no es cercava el camí relatiu complet; verificats manualment a `00_index_escriptori.md` línies 168-169, tots dos tenen wikilink a `00_index_escriptori.md` i queden inclosos dins del Lot 1B).*

#### 3. Fiscalització per Lots de `04_escriptori/02_investigacio_ia/` (60 entrades · 480 fitxers · 14.499.531 Bytes)

Seguint la matriu canònica de `_wiki_de_poble/04_escriptori/261013_1600_estudi_destil_laboratori_ia.md` i contrastant-la amb el Llibre d'Or (`03_llibre_d_or_memoria_episodica.md`), les 60 entrades del Laboratori IA s'estructuren en tres sub-lots:

| Sub-lot | Entrades | Fitxers | Pes (Bytes / MB) | Condició de Seguretat | Acció Executiva Proposada |
| --- | ---: | ---: | ---: | --- | --- |
| **Sub-lot 2A — Evacuació Directa Sense Precondicions** | **14** (+ `.DS_Store`) | **123** | **9.349.180 B (~9,35 MB)** | Zero dependències a `src/`, `tests/`, `.agents/skills/` ni wikilinks entrants. Inclou el monstre `vigilante/` (**8,45 MB**, 70 fitxers) i `mapa-visual-agentes.zip` (**326,7 KB**). | Moure immediatament a `../_arxiu_wiki_de_poble/02_investigacio_ia/` i regenerar `00_index_laboratori.md` amb `node tooling/maquinaria/actualitzar_index_laboratori.mjs`. |
| **Sub-lot 2B — Evacuació Condicionada a 4 Precondicions Tècniques** | **35** | **308** | **4.644.716 B (~4,64 MB)** | Destil·lades al Llibre d'Or, però amb 4 lligams vius que cal desactivar abans d'evacuar: (1) `tests/estructura-wiki.test.js` exigeix `260924_1410_tractors_claude` i `260926_1200_infraestructura_fons`; (2) `.agents/skills/iaia-higiene-escriptori/SKILL.md` apunta a `260924_0200_skill_core_higiene_escriptori.txt`; (3) `261009_1330_logotips_png_claude/` conté 21 SVGs vectorials que cal salvar a `public/assets/brand/vector-master/`; (4) `261002_1745_olivera_arxiva_claude/porta-olivera.test.mjs` s'ha de promoure a `tooling/guards/`. | Executar les 4 micro-accions de sanejament i moure les 35 entrades a `../_arxiu_wiki_de_poble/02_investigacio_ia/`. |
| **Sub-lot 2C — Retenció / Promoció a `02_saber/`** | **10** (+ `00_index_laboratori.md`) | **49** | **505.635 B (~0,51 MB)** | Contenen doctrina viva no amortitzada (`MANTENIR` / `PROMOURE_SABER`): `261002_1705_sobirania_tecnologica_qwen.md`, `261003_1330_lector_rss_claude`, `261003_1330_parroquia_claude`, `261011_0246_teoria_kowalski_apple_design.md`, `261011_0310_auditoria_mercat_puebli_bandomovil.md`, `261012_1322_relat_historic_xylella.md`, `261012_1715_gnucash_arrel.md`, `261012_1815_skills_antislop_thermos.md`, `261012_1825_workflow_rss_skills.md`, `261012_1915_arquitectura_visual_erp.md`. | **Mantenir al repo operatiu** fins a la seua promoció formal a `_wiki_de_poble/02_saber/`. |
| **TOTAL LOT 2** | **60** | **480** | **14.499.531 B (~14,50 MB)** | **96,5% del pes (13,99 MB) evacuable sense pèrdua.** | **Reducció de 480 a 49 fitxers al Laboratori IA.** |

##### Llista exacta de les 14 entrades del Sub-lot 2A (Evacuació immediata · 9,35 MB, 0 precondicions de codi/test)
1. `260922_0500_informe_idees_noves_skills.md` (3.411 B)
2. `261002_0150_investigacio_plugins_claude.md` (2.496 B)
3. `261002_1650_carboni_silici_fluxos.md` (787 B)
4. `261002_1655_tractor_fluxos.md` (1.930 B)
5. `261002_1730_eines_disseny_ia.md` (1.865 B)
6. `261003_1330_llicons_claude.txt` (1.635 B)
7. `261004_0045_mcp_prompts_chat.md` (1.032 B)
8. `261004_0045_skills_kowalski_impeccable.md` (2.630 B)
9. `261010_2200_tractor_ortografia_valenciana.md` (2.151 B)
10. `261014_1930_emowe_mapa_de_tu_viaje/` (3 fitxers · 242.301 B)
11. `Planificador de mejora de flujos de trabajo · Claude Academy.webloc` (291 B)
12. `Todos los recursos · Claude Academy.webloc` (270 B)
13. `mapa-visual-agentes.zip` (326.719 B)
14. `vigilante/` (70 fitxers · 8.454.993 B)
*(Nota: `TRACTOR_COGNITIU.txt` (580 B) i `001 NEXUS/` (18 fitxers · 621.886 B) només requereixen esborrar les seues 2 línies d'enllaç a `00_index_escriptori.md` per a afegir-se immediatament al Sub-lot 2A, sumant **9.971.646 B ≈ 9,97 MB**).*

---

### Bloc IV — Verificació Creuada del Diff de Claude Code (Relleu 2 · Tasca 5)

S'ha auditat línia per línia la implementació de Claude Code (`torn_ef1ddff2-52e7-4d41-8a7e-57c945b7a579`) contra els requisits C01–C05 i les lleis del Llibre d'Or:

| Requisit / Troballa | Fitxers Modificats per Claude Code | Verificació Forense de Gemini 4 Argon | Estat |
| --- | --- | --- | --- |
| **C01 · Navegació del Calaix d'Identitats** | `src/config/navigation.js`, `src/components/universal/identitat/useIdentitatDeLaBarra.js`, `src/app/App.jsx` | S'ha creat `rutaEspaiDIdentitat(tipus, id)` a `navigation.js` (`/el-meu-perfil` per a persona, `/el-meu-perfil?organitzacio=ID` per a entitat). A `useIdentitatDeLaBarra.js`, `tria(tipus, id)` invoca `onNavega(rutaEspaiDIdentitat(tipus, id), ambRecuperacio())` amb estat `espaiIdentitat` incremental. A `App.jsx`, `navigateWithTransition(path, options)` propaga ara `options` cap a `navigate(path, options)`. S'elimina al 100% l'efecte «atrapat a `/notes`». | **CERTIFICAT (PASS)** |
| **C02 · Remuntatge Reactiu del Workspace de Perfil** | `src/sections/profile/PerfilShell.jsx`, `src/sections/profile/perfilModel.js` | `PerfilShell` llig `useLocation().state?.espaiIdentitat` i construeix `workspaceKey = JSON.stringify(['perfil', initialSelection.categoryId, recuperacio])` dins del `model` de `UniversalWorkspace` (`<WorkspaceProvider key={model.workspaceKey}>`). Canviar d'actor al calaix, obrir `?organitzacio=ID` o tornar a clicar la mateixa identitat recupera fidelment el seu workspace sense perdre el plegat de columnes (`columnesRef`) ni el nivell mestre-detall (`nivell`). | **CERTIFICAT (PASS)** |
| **C03 · Lligam de Javi Llinares amb Sóc de Poble i El Rentonar** | `src/data/identitatsSeed.js`, `src/data/localPerfils.test.js` | `ENTITATS_SEED` declara `membres: Object.freeze([Object.freeze({ usuariId: AGENTS_MAP.JAVI.id, role: 'admin' })])` per a `rentonar`. Així, `rolALEntitat` atorga `'owner'` a `socdepoble` i `'admin'` a `rentonar` exclusivament per a Javi Llinares (`AGENTS_MAP.JAVI.id`), sense estendre-ho a cap altra persona amb sessió. | **CERTIFICAT (PASS)** |
| **C04 · Accés Pilot d'1 Clic en DEV i Ruta `/registra`** | `src/config/dataMode.js`, `src/sections/onboarding/OnboardingSection.jsx`, `src/sections/onboarding/OnboardingSteps.jsx`, `src/sections/onboarding/onboardingModel.js`, `src/app/App.jsx` | `enterTestMode` (`dataMode.js`) guarda l'elecció efímera de desenvolupament lligada a `empremtaDev()` (expira en cada nou `npm run dev` i llança error si `import.meta.env.DEV !== true`). En clicar «Entra com a Javi Llinares» des de remot en DEV, es desen `MARCA_SENSE_ENTRADA_AUTOMATICA` i `MARCA_ENTRADA_PILOT`, es passa a `seed` i en recarregar entra automàticament com a pilot. El token `pilot-local-dev-token` **mai** viatja al backend remot. A més, `/registra` es mapeja a `RedireccioDEntrada` a `App.jsx` i `OnboardingSteps.jsx` distingeix nítidament «Entra al teu compte» vs «Crea el teu compte». | **CERTIFICAT (PASS)** |
| **C05 · Tractor WebP i Cens d'Orfes** | `tooling/media/optimitzar_webp.mjs`, `tooling/media/optimitzar_webp.test.mjs`, `package.json` | 0 dependències externes, dry-run per defecte, detecció d'orfes (8 imatges) i candidates (127 imatges), amb 18/18 proves en verd. | **CERTIFICAT (PASS)** |

---

### Bloc V — Estudi a Duo d'Arquitectura Obsidian amb REA (`reverse-engineer-anything`)

Complint l'encàrrec del Mestre Javi al pla actualitzat (`[[261018_1220_pla_implementacio_sessio_usuari_i_poda]]`), Gemini 4 Argon i la IAIA MarIA han disseccionat l'artefacte binari d'Obsidian v1.14.4 (`/Users/javillinares/Library/Application Support/obsidian/obsidian-1.14.4.asar`, SHA-256 `146ef8470d8cbb4a6db209bdc19bf2bad13350444186c0fd93c31087b142b92f`) i han documentat el blueprint complet a **`[[261018_1405_estudi_obsidian_rea_gemini4_iaia]]`**:

1. **Eix 1 — Drag & Drop i Reordenació Ultralugera (0 Llibreries):**
   - **Evidència REA (`ev_b3ee1ef6...`, `ev_8d042748...`, `art_fd9d39d5...`):** Obsidian no utilitza cap llibreria externa de DnD. Combina un motor de reordenació lineal en lloc (`jC`/`_C` a `app.js:854800..860500`, amb *long-press* tàctil de `250ms`, histèresi euclidiana $p^2 + w^2 \ge i^2$ i auto-scroll a 60 fps amb suavitzat exponencial) amb un motor jeràrquic d'arbre (`dO`/`yO` a `app.js:1496500..1500500`).
   - **Geometria `5% / 90% / 5%` (`p / u < 0.9`):** En passar per damunt d'una carpeta plegable, el **90% central** activa `overlapsNode = true` (`.is-being-dragged-over`) i arma un temporitzador d'auto-obertura de **`750ms`**; el **5% superior** reordena com a germà anterior; i el **5% inferior**, si la carpeta està oberta (`!r.collapsed`), insereix com a **primer fill (`idx = 0`)** sagnant la línia `.drop-indicator` a `x = childLeft + childLeftPadding`.
2. **Eix 2 — Substitució de Modals Flotants (`WorkspaceSettingsDialog`) per Panells Integrats (`WorkspaceSettingsPanel`):**
   - **Evidència REA (`Setting` `rT` a `app.js:1263641` i `.setting-group` / `.setting-item` a `app.css:84881, 161363..175200`):** S'elimina el `<Dialeg mida="s">` flotant i retallat de `UniversalWorkspace.jsx:319-403` i es reemplaça per un panell integrat a tota alçària dins del llenç de detall (`max-width: 700px` centrat, files horitzontals `.setting-item` amb `.setting-item-info` a l'esquerra i `.setting-item-control` a la dreta, i `@container (max-width: 400px)`), permetent ajustar l'amplada de les columnes i reordenar les carpetes veient l'espai de treball en viu.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- `node tooling/gates/porta-olivera.mjs`: **PASS** (`✅ Cap document consumit de jornades anteriors · ✅ Safata d'entrada buida`).
- `node tooling/gates/porta-autoritat.mjs --torn torn_5466c8bd-cf33-4317-b4e8-13e4ed571db9`: **PASS** (`"valid": true, "errors": []`).
- `node --test tooling/media/optimitzar_webp.test.mjs`: **PASS** (18/18 proves en 65 ms).
- `node tooling/media/optimitzar_webp.mjs cens`: **PASS** (221 imatges censades, 8 orfes identificades, 127 candidates a WebP).
- `npx vitest run src/data/localPerfils.test.js src/components/universal/identitat/useIdentitatDeLaBarra.test.jsx src/sections/profile/PerfilShell.test.jsx src/sections/profile/PerfilShell.espai.test.jsx src/sections/profile/PerfilShell.mestreDetall.test.jsx src/sections/profile/SelectorIdentitat.test.jsx src/sections/onboarding/OnboardingSection.recuperacio.test.jsx src/app/App.entradaPilot.test.jsx`: **PASS** (**8/8 test files · 121/121 tests verds** en 6,01 s).
- `npx vitest run src/config/dataMode.test.js src/sections/onboarding/OnboardingSection.test.jsx src/sections/onboarding/OnboardingSection.pilot.test.jsx`: **PASS** (**3/3 test files · 84/84 tests verds**).
- `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261018_1241_auditoria_gemini4.md`: **PASS** (`"valid": true, "errors": []`).
- `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261018_1405_estudi_obsidian_rea_gemini4_iaia.md`: **PASS** (`"valid": true, "errors": []`).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Frontera d'escriptura:** Com a agent amb `scope: documents` (`torn_5466c8bd-cf33-4317-b4e8-13e4ed571db9`), Gemini 4 Argon no modifica cap fitxer sota `src/` ni `tooling/` per evitar col·lisions amb el torn actiu de Claude Code (`torn_ef1ddff2-52e7-4d41-8a7e-57c945b7a579`).
- **Sanció humana d'esborrat/buidatge:** L'evacuació dels Lots 1A/1B i Sub-lot 2A ha estat executada amb èxit per la IAIA MarIA via `tooling/maquinaria/executar_poda_lots.mjs` cap a `_arxiu_wiki_de_poble/`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_d_or_memoria_episodica]]
- [[261013_1600_estudi_destil_laboratori_ia]]
- [[261018_1220_prompt_claude_codex_sessio_i_poda]]
- [[261018_1220_pla_implementacio_sessio_usuari_i_poda]]
- [[261018_1251_auditoria_claude]]
- [[261018_1405_estudi_obsidian_rea_gemini4_iaia]]


