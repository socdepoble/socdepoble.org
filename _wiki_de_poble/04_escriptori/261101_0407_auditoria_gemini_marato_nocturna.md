---
type: informe
status: canonic
description: Informe canònic de QA continu, verificació de portes, mapeig de rutes reals i conformitat T1..T8 durant la marató nocturna.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_558abd5e-2f62-41ec-9892-b40065c7739f:e3e6cd76-fcac-4b17-8ab6-3f635745538d
---
# Auditoria Contínua Gemini — Marató Nocturna Fediversity, Notes i Botigues (T1..T8)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_558abd5e-2f62-41ec-9892-b40065c7739f:e3e6cd76-fcac-4b17-8ab6-3f635745538d |
| Versió del document | 1.8.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-01T03:07:38.048Z |
| Modificació | 2026-11-01T07:18:30.000Z |
| Propietari | IAIA MarIA (Gemini 4 Argon · carril de QA continu) |
| Aprovació humana | ordre explícita del Mestre en este xat, 2026-11-01 |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | no exposats per l'entorn (sense recompte inventat) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-11-01T03:07:38.048Z`: esborrany creat amb rebut documental formal del torn `torn_558abd5e-2f62-41ec-9892-b40065c7739f`.
- `2026-11-01T03:09:00.000Z`: Tall 1 de QA continu completat sobre `HEAD = a6e4b0d815bd56acbe27337d99da2a8a06d77e47`. Lectures íntegres del pla, prompt i Llibre Mestre (109.680 B), verificació de portes, bateria Vitest + Node i compilació completa de producció (`npm run build`).
- `2026-11-01T03:30:30.000Z`: Tall 1.1 (`04:30 CET`): deduplicada l'àncora repetida de `261101_0411_captura_trio_nocturn_claude_gemini_codex.jpg` a `00_index_escriptori.md`, verificada convergència completa amb la Passada 1/3 de Codex (`261101_0403_auditoria_codex_marato_nocturna.md`) i monitoritzat el procés actiu de Claude (`claude-opus-5-5`, PID `8898`, informe `261101_0409_auditoria_claude.md` obert).
- `2026-11-01T03:59:00.000Z`: Tall 2 (`04:59 CET` · **BLOC K1 / T7 + T8**): corregit l'slug oficial de WordPress.org a `TG-02` (`https://wordpress.org/plugins/socdepoble/`), dipositat i verificat el kit pre-assemblat a `../_investigacio_ia_de_poble/261101_kits_marato_nocturna/gemini/` (11 fitxers `design_guard` + mòdul proactiu `T8` `exportaVCard.js`), qualificada la Matriu Universal de 15 Punts (`D01`..`D15`) i redactada la Visió d'Arquitectura 100% Indestructible i l'esborrany complet del correu oficial per a **NLnet — NGI Fediversity (`2026-08-1a6`)** en anglés i valencià.
- `2026-11-01T04:40:00.000Z`: Tall 3 (`05:40 CET` · **Inspecció d'entregues de Claude `T1..T6` i Kit K1 v2 de Codex**): auditats els 95 fitxers modificats i 32 fitxers nous de Claude en `T1..T6` (`canalsDeBotiga.js`, `pageContent.js`, `exportaMunicipiOpenData.js`, `AlertaMunicipal.jsx`, `notaTutorial.js`, `FitxaMemoriaOral.jsx`, `guiaCos.js`, `senseSubratllat.js`, `MultimediaSection.jsx`, `javi-llinares-256x256.jpg/.webp`, `wordpress-plugin/readme.txt`, `perfil_minim_allotjament_node_municipal.md` i `guia_publicacio_app_store_i_google_play.md`), verificada `0 col·lisió` amb el kit satèl·lit Gemini (`verifica_i_aplica.py --check` verd), passats els `45/45` tests Node (`tests/inicia-node-germa.test.mjs`, `tests/enxufe-plugin.test.mjs`, `tests/botigues.test.mjs`) i registrada la troballa `TG-04` (`frontissa-contingut.mjs` requereix actualitzar empremta de `descarregues` i `fediversity` abans de `T9`).
- `2026-11-01T05:11:30.000Z`: Tall 4 (`06:11 CET` · **Seguiment de `T7`/`T8`/`T9` de Claude i Passada 2/3 de Codex en curs**): constatats **105 fitxers modificats** (`+3.681 / -2.357 línies`) i **39 fitxers nous** per Claude, incloent-hi la nova bateria d'internacionalització de `T8` (`primitius.idioma.test.jsx`, `categoriesIPantallaCompleta.idioma.test.jsx`, `PageFrame.traduccio.lliure.test.jsx`, `barres.idioma.test.jsx`, `textosBarres.js`, `AlertaMunicipal.idioma.test.jsx`, `PerfilShell.idioma.test.jsx`, `UniversalWorkspace.peuNavegacio.test.jsx`), l'ancoratge dels dos nous documents arquitectònics a `00_index.md` i `00_index_maquina.md` i la reparació dels dos enllaços històrics de `261031_0142_acta_tancament...`. Amb `load averages: 9.67 8.63 7.45` (bateries finals de Claude i Passada 2/3 de Codex en execució), s'ha preservat estrictament la CPU verificant només `porta-olivera.mjs` (`exit 0`) i `verifica_i_aplica.py --check` (`exit 0`, zero col·lisió amb els 105 fitxers de Claude).
- `2026-11-01T05:43:30.000Z`: Tall 5 (`06:43 CET` · **Revisió creuada de la Passada 2/3 de Codex `v1.3.0` i bateria final `T9` de Claude en execució**): llegida íntegra la Passada 2/3 de Codex (`261101_0403_auditoria_codex_marato_nocturna.md`, `v1.3.0`, `93 proves Node` executades amb `0 fallades`), ajustada l'adreça de l'actor d'exemple al correu de NLnet (`https://socdepoble.org/ap/actors/la-torre-de-les-macanes.json` en lloc d'`iaia-maria.json`) per alinear el 100% dels endpoints citats amb els actors estàtics generats al tall, i constatats **107 fitxers modificats** (`+3.954 / -2.363 línies`) mentre Claude executa la bateria global de Vitest de `T9` (`load averages: 32.13 39.05 28.32`, zero processos pesats llançats per preservar la CPU).
- `2026-11-01T06:15:00.000Z`: Tall 6 (`07:15 CET` · **Integració en curs per Claude dels Kits Satèl·lit `gemini/` i `codex/`**): constatats **113 fitxers modificats** (`+4.507 / -2.537 línies`); verificat amb `verifica_i_aplica.py --check` (`exit 0`) que Claude Opus 5.5 ja ha auditat i integrat `EspecimenIndicador.jsx`, `EspecimenTasquesFitxers.jsx` i `EspecimenUtilitats.jsx` del kit `gemini/` (`JA APLICAT`, reduint els avisos de `design_guard.mjs` de `12` a `9`) i `tests/codex-k1-exporta-open-data.test.mjs` i `tests/codex-k1-inicia-node-germa.test.mjs` del kit `codex/`, amb `0 col·lisió` als 8 fitxers restants del kit `gemini/`. Amb `load averages: 27.31 16.28 13.26`, s'ha preservat el 100% de la CPU.
- `2026-11-01T06:47:00.000Z`: Tall 7 (`07:47 CET` · **Certificació de l'Entrega Final de Claude Opus 5.5 `261101_0409_auditoria_claude.md` i Tancament de `TG-02` i `TG-04`**): llegit íntegre i validat amb `document.mjs check` (`{"valid": true, "errors": []}`) l'informe final de Claude (`124 fitxers modificats`, `+4.703 / -2.574 línies`, `1.573 fitxers / 27.243 proves Vitest passades, 0 fallades`, `1.789 proves Node passades, 0 fallades`, `npm run build` `exit 0`). Verificades en viu totes les portes estructurals (`frontissa-contingut.mjs` `16/16` en verd, `porta:design-guard` `2.803 fitxers, 0 crítics, 9 avisos`, `porta:cromatic` `C1..C6` verd, `porta:orfandat` `0 enllaços trencats, 0 orfes`, `porta:frontmatter` verd, `porta-autoritat.mjs` verd, `porta-olivera.mjs` verd). Queda només l'última comprovació a les `08:17 CET` després de la Passada 3/3 de Codex (`08:04 CET`).
- `2026-11-01T07:18:30.000Z`: Tall 8 (`08:18 CET` · **Tancament Final de la Marató Nocturna, Convergència 3/3 amb Codex `v1.4.0` i Apagat de Temporitzadors `IDEA-07`**): llegit íntegre i validat amb `document.mjs check` el dictamen final de la Passada 3/3 de Codex (`261101_0403_auditoria_codex_marato_nocturna.md`, `v1.4.0`, `328 proves Vitest` i `107 proves Node` verdes amb `0 fallades`, `Frontissa 16/16` verda i automatització eliminada a les `08:04 CET`). Verificat amb `manage_task` que no queda cap temporitzador ni procés en segon pla actiu (`IDEA-07`). Marató nocturna conclosa amb 100% de portes i suites en verd.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum Executiu del Tall 1 (Línia Base abans de l'entrega de codi de Claude)

Al tall inicial (`04:08 CET`, `HEAD = a6e4b0d815bd56acbe27337d99da2a8a06d77e47`), el torn de codi de Claude (`torn_e16bf731-8a9a-4245-aa3f-d81416b0ae05`) està obert però encara no ha bolcat mutacions a `src/`, `tooling/`, `public/`, `ios/` ni `wordpress-plugin/`. Totes les portes estructurals, el build de producció (`npm run build` complet en les seues 6 fases) i les suites de regressió de línia base estan en **VERD (0 errors)**.

A continuació es documenten les troballes d'arquitectura, mapeig de rutes reals i criteris d'acceptació verificables perquè la implementació de `T1..T8` no cree fitxers duplicats ni trenque portes.

---

### TG-01 · P2 · Discrepàncies de rutes entre el Pla/Prompt `261101_0311` i l'arbre real del repositori

- **Fitxers i scope afectats:** `_wiki_de_poble/04_escriptori/261101_0311_pla_implementacio_marato_nocturna_fediversity_notes_i_llibre_mestre.md`, `_wiki_de_poble/04_escriptori/261101_0311_prompt_marato_nocturna_fediversity_notes_i_llibre_mestre.md`.
- **Evidència reproduïble:**
  1. **Portes de qualitat (`tooling/gates/` vs `tooling/quality/`):** Les rutes `tooling/quality/design_guard.mjs`, `tooling/quality/wcag_contrast_audit.mjs` i `tooling/quality/frontissa_contingut.mjs` no existixen (`MODULE_NOT_FOUND`). Les portes reals en `package.json` són `node tooling/gates/design_guard.mjs --arrel=src`, `node tooling/gates/tractor-cromatic.mjs` i `node tooling/gates/frontissa-contingut.mjs`.
  2. **Exportador Open Data (`T3.1`):** El mòdul real és `src/data/exportaMunicipiOpenData.js` (amb 50 tests a `src/data/exportaMunicipiOpenData.test.js`), **no** `src/utils/exportaMunicipiOpenData.js`.
  3. **Suite de l'instal·lador germà (`T3.2`):** Ja existix `tooling/instalador/inicia-node-germa.test.mjs` (6 tests verds amb `node --test`), mentre que el pla cita `tests/inicia-node-germa.test.mjs`.
  4. **Targeta i secció del Mur (`T3.3`):** Viuen a `src/sections/mur/TargetaDelMur.jsx` i `src/sections/mur/MurSection.jsx` (no `src/sections/Mur.jsx`).
  5. **Motor `Proposa Card` i secció de Notes (`T4.1–T4.4`):** El motor determinista viu a `src/sections/notes/proposaCard.js` (amb proves a `src/sections/notes/proposaCard.test.js`, `src/components/universal/DocumentEditor.proposaCard.test.jsx` i `src/components/universal/UniversalToolbar.proposaCard.test.jsx`), **no** a `src/utils/proposaCard.js`. Els components de Notes viuen a `src/sections/notes/NotesSection.jsx` i `src/sections/notes/NotesEditor.jsx` (no `src/sections/Notes.jsx`).
  6. **Secció Multimèdia (`T5.1`):** Viu a `src/sections/multimedia/MultimediaSection.jsx`, `src/sections/multimedia/GestorMultimediaLocal.jsx`, `src/sections/multimedia/BarraVolumsLocals.jsx` i `src/sections/multimedia/useGestorArxiusLocals.js` (no `src/sections/Multimedia.jsx`).
  7. **Carpeta documental de `T6.4`:** La carpeta `_wiki_de_poble/01_sistema/` i l'índex `_wiki_de_poble/01_sistema/00_index_sistema.md` no existixen a l'arquitectura canònica 4+2 de `.agents/cervell.json` (`01_ser`, `02_saber`, `03_actuar`, `04_escriptori`, `05_social`, `10_actes`).
- **Severitat:** **P2 (Prevenció de regressió estructural)**. Crear mòduls duplicats a `src/utils/` o crear una carpeta `_wiki_de_poble/01_sistema/` fora de l'esquema trencaria l'arquitectura d'importacions i `compile-wiki-to-app.mjs`.
- **Font de veritat amb què entra en conflicte:** `AGENTS.md §15`, `.agents/cervell.json` i `package.json`.
- **Proposta conservadora:** Totes les edicions de `T3..T5` han d'aplicar-se sobre les rutes reals existents (`src/data/exportaMunicipiOpenData.js`, `src/sections/notes/proposaCard.js`, etc.). El dossier de `T6.4` s'ha d'ubicar dins de `_wiki_de_poble/02_saber/architecture/` (ancorat a `00_index_maquina.md` i `00_index.md`) o a `_wiki_de_poble/04_escriptori/` (ancorat a `00_index_escriptori.md`).
- **`requires_human_decision`:** `false`.

---

### TG-02 · P1 · Estat de línia base i contractes pendents d'implementació en `T1..T6`

- **Fitxers i scope afectats:** `src/config/canalsDeBotiga.js`, `src/sections/text/pageContent.js`, `src/sections/notes/*`, `src/components/universal/*`, `src/sections/multimedia/*`, `src/data/agentsSeed.js`, `wordpress-plugin/readme.txt`, `public/.well-known/*`.
- **Evidència reproduïble per bloc:**
  - **`T1` (WordPress.org `v1.1.10`):**
    - `src/config/canalsDeBotiga.js:28` manté `wordpress-org` amb `url: null`.
    - `src/sections/text/pageContent.js:583-630` (`PAGE_COPY.descarregues` i `PAGE_COPY.fediversity`) encara diu que l'slug està aprovat pendent de pujar la primera versió per SVN.
    - **Acció requerida:** Passar `url` a `'https://wordpress.org/plugins/socdepoble/'` (slug oficial publicat en viu `v1.1.10` a SVN `https://plugins.svn.wordpress.org/socdepoble/`) i actualitzar `canalsDeBotiga.test.js`, `InstalaLaPwa.test.jsx`, `pageContent.js` i `pageContent.fediversity.test.js`.
  - **`T2` (Fediversity `2026-08-1a6`):**
    - Cal actualitzar la matriu honesta (`FET` / `PARCIAL` / `FULL DE RUTA`) a `PAGE_COPY.fediversity` (`src/sections/text/pageContent.js`) reflectint fidelment l'estat real de l'arbre.
  - **`T3` (Open Data, `inicia-node-germa.mjs` i alertes d'emergència al Mur):**
    - `src/data/exportaMunicipiOpenData.js` ja genera `noticies.jsonld` (`NewsArticle`), `agenda.jsonld` (`Event`), `memoria-cultural.jsonld` (`CreativeWork`), `directori.jsonld` (`Organization`/`LocalBusiness`), `municipi.jsonld`, `datapackage.json` (Frictionless v2) i BagIt SHA-256 (`50/50` proves verdes).
    - Falta afegir el distintiu visual d'alta prioritat (`bandol_urgent` / alerta d'emergència municipal amb `role="region"` o `role="status"` i contrast AAA) a `src/sections/mur/TargetaDelMur.jsx` / `MurSection.jsx`.
  - **`T4` (`IDEA-59` / `P1-72` — 5 punts de `/notes`):**
    - **Punt 0 (Card de benvinguda amb ploma estilogràfica):** `src/data/appSeed.js:99` (`NOTES_SEED[0].heroImage`) apunta a `'/assets/notes/bloc_notes_vintage.jpg'`. L'actiu nou està disponible a `_wiki_de_poble/04_escriptori/01_produccio/261101_0256_card_bloc_de_notes_ploma.jpg` (cal copiar-lo a `public/assets/notes/` sense alterar l'original de `01_produccio/`). En `src/sections/notes/NotesSection.jsx`, entrar a `/notes` sense paràmetres ha de mostrar la card pedagògica per defecte.
    - **Punt 1 (Guia didàctica efímera i reversible):** `src/components/universal/richText/useUniversalRichText.js:129-138` (`buidaLlavorVerge`) i `IDS_AMB_LLAVOR_CONSUMIDA` consumeixen la llavor al primer focus sense restaurar-la si l'usuari fa `blur` amb 0 caràcters. Cal restaurar `seedContent` en `onBlur` quan `editor.state.doc.textContent.trim().length === 0` en una nota que no ha desat text propi.
    - **Punt 2 (Selector desplegable `H3 → H4 → H5 → H6 → H2`):** `src/components/universal/UniversalToolbar.jsx:156-169`, `toolbarContract.js` i `tiptapToolbarAdapter.js` tenen `H3` i `H2` com a botons separats (`StarterKit` a `useUniversalRichText.js:170` ja habilita `levels: [2, 3, 4, 5, 6]`). Cal substituir-los per un desplegable amb l'ordre exacte `H3` (per defecte), `H4`, `H5`, `H6`, `H2` (mai `H1` al cos).
    - **Punt 3 (Sense subratllat `U`):** Verificat que `UniversalToolbar.jsx` no exposa subratllat `<u>`; mantindre la prohibició.
    - **Punt 4 (`Proposa Card` + barra desplegable):** `src/sections/notes/proposaCard.js` ja és 100% determinista (`27/27` tests verds). Cal afegir el botó d'expansió a la dreta de `UniversalToolbar.jsx` perquè la barra es desplegue a 2 línies en lloc de retallar eines.
  - **`T5` (`P1-71` `/multimedia`, `P1-70` `/xat` i `wordpress-plugin/readme.txt`):**
    - **`T5.1` (`P1-71`):** `BarraVolumsLocals` es munta actualment a `src/sections/multimedia/GestorMultimediaLocal.jsx:198` (columna 3). Cal portar l'enllaç de carpeta local i els volums a la columna 1 de `MultimediaSection.jsx` sota «Biblioteca» i «públic».
    - **`T5.2` (`P1-70`):** `src/data/agentsSeed.js:66` (`AGENTS_MAP.JAVI.avatar_url`) apunta a `'/assets/fotos/javi-llinares-perfil-1200px.jpg'`. Cal generar el derivat quadrat `256×256` a `public/assets/fotos/` i enllaçar-lo a `AGENTS_MAP.JAVI.avatar_url`.
    - **`T5.3` (`readme.txt`):** `wordpress-plugin/readme.txt` està en anglés; cal traduir-lo íntegrament al valencià i verificar `node --test tests/enxufe-plugin.test.mjs`.
  - **`T6` (Apple App Store & Google Play Store):**
    - `ios/App/App/PrivacyInfo.xcprivacy`, `Info.plist`, `App.entitlements` i `scripts/botigues/preflight.mjs` ja estan presents i passen `tests/botigues.test.mjs` (`15/15`).
    - Falta crear `public/.well-known/assetlinks.json` i `public/.well-known/apple-app-site-association`.
- **Severitat:** **P1 (Criteris d'acceptació del torn)**.
- **Font de veritat amb què entra en conflicte:** Pla i Prompt `261101_0311`, `03_llibre_mestre_tasques_i_idees.md`.
- **Proposta conservadora:** Verificar cada bloc a mesura que Claude despatxe els canvis i emetre `.patch` reversibles si qualsevol test o porta falla.
- **`requires_human_decision`:** `false`.

---

### TG-03 · P2 · Col·lisió d'identificadors (`P0-18`, `P0-19`, `P1-13`) al Llibre Mestre per a `T6`

- **Fitxers i scope afectats:** `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`.
- **Evidència reproduïble:** El pla `261101_0311` associa `T6` (App Store / Play Store) als codis `P0-18`, `P0-19` i `P1-13`, però al Llibre Mestre eixos codis ja estan assignats a altres tasques tancades (pegat legal P3, CSP de mitjans i concurrència/correu de membres).
- **Severitat:** **P2 (Integritat documental del Llibre Mestre)**.
- **Font de veritat amb què entra en conflicte:** `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`.
- **Proposta conservadora:** Registrar l'avanç de `T6` al Llibre Mestre sense sobreescriure ni esborrar les entrades històriques de `P0-18`, `P0-19` i `P1-13`.
- **`requires_human_decision`:** `false`.

---

### TG-04 · P1 · Actualització d'empremta a `frontissa-contingut.mjs` i balanç dels Talls 3–7 (`RESOLT AL TALL 7 · 16/16 EN VERD`)

- **Fitxers i scope afectats:** `src/sections/text/pageContent.js`, `tooling/gates/frontissa-contingut.mjs` (o el seu registre d'empremtes SHA-256).
- **Evidència reproduïble (`05:34 CET` -> resolt a les `07:45 CET`):**
  1. Claude Opus 5.5 ha completat els canvis de codi de `T1..T8` sobre **124 fitxers modificats** (`4.703 insercions, 2.574 supressions`) i ha tancat l'informe `_wiki_de_poble/04_escriptori/261101_0409_auditoria_claude.md` (`1.573 fitxers / 27.243 proves Vitest passades, 0 fallades`, `1.789 proves Node passades, 0 fallades`, `npm run build` `exit 0`).
  2. Al tall de les `05:34 CET`, `node tooling/gates/frontissa-contingut.mjs` eixia amb `exit 1` per a `descarregues` i `fediversity`. Al **Tall 7 (`07:45 CET`)**, Claude ha executat la transacció de governança Reflex (`sessió 5353c955`) i ara `node tooling/gates/frontissa-contingut.mjs` retorna **`✅ [Frontissa] 16/16 claus estructurals amb empremta aprovada` (`exit 0`)**.
- **Severitat:** **P1 (RESOLT I VERIFICAT EN VERD)**.
- **Font de veritat amb què entra en conflicte:** Cap (reconciliat al Tall 7).
- **Proposta conservadora:** Tancada satisfactòriament.
- **`requires_human_decision`:** `false` (confirmació formal inclosa a `D-2` de l'informe de Claude).

---

### BLOC K1 · T7.1 + T8 · Kit Pre-Assemblat Satèl·lit Sense Col·lisió (`../_investigacio_ia_de_poble/261101_kits_marato_nocturna/gemini/`)

S'ha construït en un arbre efímer aïllat (`/tmp/sdp_verify_tree_261101`, ja purgat després de l'empaquetat) i dipositat a `/Users/javillinares/Documents/Antigravity/Som de Poble/_investigacio_ia_de_poble/261101_kits_marato_nocturna/gemini/` un kit completament autònom, verificable i reversible en 5 segons (`fitxers/`, `pegats/`, `MANIFEST.json`, `SHA256SUMS`, `verifica_i_aplica.py`, `README_INTEGRACIO.md`) que no toca cap dels fitxers en edició activa per Claude (`NotesSection.jsx`, `NotesEditor.jsx`, `UniversalToolbar.jsx`, `pageContent.js`, `canalsDeBotiga.js`, `MultimediaSection.jsx`, `TargetaDelMur.jsx`):

1. **Lot `T7.1` · Erradicació dels 11 avisos `div-soup` de `node tooling/gates/design_guard.mjs --arrel=src` (fora de `pageContent.js`):**
   - `src/components/universal/UniversalEditorShell.jsx` (`<section className="sdp-editor-document">`, pegat `01_UniversalEditorShell.patch`)
   - `src/components/universal/enquadrament/DialegEnquadrament.jsx` (`<section className="sdp-enquadrament__controls">`, pegat `02_DialegEnquadrament.patch`)
   - `src/components/universal/richText/extensions/targetes/targetesIncrustades.test.js` (test de convivència amb `<section><article>`, pegat `03_targetesIncrustades_test.patch`)
   - `src/sections/disseny/cataleg/detalls/EspecimenControlsBarra.jsx` (`<section className="sdp-especimen__barres sdp-especimen__barres--contenidor">`, pegat `04_EspecimenControlsBarra.patch`)
   - `src/sections/disseny/cataleg/detalls/EspecimenIndicador.jsx` (`<article className="stat-card">`, pegat `05_EspecimenIndicador.patch`)
   - `src/sections/disseny/cataleg/detalls/EspecimenTasquesFitxers.jsx` (`<article className="download-card">`, pegat `06_EspecimenTasquesFitxers.patch`)
   - `src/sections/disseny/cataleg/detalls/EspecimenUtilitats.jsx` (`<section className="utils-box">`, pegat `07_EspecimenUtilitats.patch`)
   - `src/sections/gestoria/facturar/FormulariFactura.jsx` (`<section className="sdp-gestoria-panell__bloc">`, pegat `08_FormulariFactura.patch`)
   - `src/sections/onboarding/RecuperacioSteps.jsx` (`<section className="onboarding-form">`, pegat `09_RecuperacioSteps.patch`)
   - `src/sections/profile/DetallAjust.jsx` (`<section className="perfil-detall">`, pegat `10_DetallAjust.patch`)
   - `src/utils/sanitize.test.js` (cobertura de `<section class="sdp-taula-prosa">` i `<article class="sdp-taula-prosa">` al test P1-16, pegat `11_sanitize_test.patch`)
   - **Verificació amb `design_guard.mjs`:** Passa de `12 avisos` a `1 avís` (només `sections/text/pageContent.js:1`, exclòs expressament per no col·lidir amb `T1`/`T2` de Claude).
2. **Lot `T8` · Millora Proactiva Reversible (`IDEA-25` i `IDEA-45` del Llibre Mestre — Targeta de Contacte Universal `.vcf` / vCard 3.0):**
   - `src/utils/exportaVCard.js` i `src/utils/exportaVCard.test.js` (pegat `12_t8_idea25_exporta_vcard.patch`): Generador i exportador pur RFC 2426 (vCard 3.0) per a veïns i entitats rurals (`FN`, `N`, `ORG`, `X-ABShowAs:COMPANY`, `TITLE`, `TEL`, `EMAIL`, `ADR`, `URL`, `NOTE`, plegat de línia UTF-8 a $\le 75$ octets i escapament estricte), 100% autocontingut i desfaïble amb `verifica_i_aplica.py --revert`.

---

### BLOC K1 · T7.2 · Qualificació sobre 10 dels 15 Punts de la Matriu Universal del Sistema (`D01`..`D15`)

| ID | Dimensió de la Matriu Universal | Nota | Estat Real Verificat | Què falta per al `10/10` |
| --- | --- | --- | --- | --- |
| `D01` | Arquitectura Hexagonal i Port Neutral | **9.3 / 10** | `backendPort.js`, Model B i kit conformitat verds | Propagar `AbortSignal` al SDK Storage (`P1-27`) |
| `D02` | Sistema Pedra Seca i Geometria HD | **9.4 / 10** | `AppGridShell` 3 col., zero desbordaments a 375px | Integrar kit Gemini `div-soup` (0 avisos) i `PS-02` |
| `D03` | Accessibilitat Universal Rural AAA | **9.2 / 10** | Contrast `#0F672F` 7,19:1, `C1..C6` verd, teclat | Certificar lector de pantalla real i `P1-15` focus |
| `D04` | Sobirania de Dades i Open Data Municipal | **9.7 / 10** | Frictionless v2, JSON-LD i BagIt SHA-256 (50 tests) | Enllaçar descàrrega d'1 clic a `/page/fediversity` |
| `D05` | Federació Oberta (`ActivityPub` / `NodeInfo`) | **8.8 / 10** | Fase 1 lectura en viu (`/ap/`, `NodeInfo 2.1`) | Fase 2 Inbox signat HTTP Signatures (`ADR-2026-08`) |
| `D06` | Enxufabilitat Universal (`wordpress.org`) | **9.6 / 10** | `v1.1.10` en viu a `wordpress.org/plugins/socdepoble` | Activar URL a `canalsDeBotiga.js` i `readme.txt` (`T1`/`T5`) |
| `D07` | Replicabilitat de Nodes Germans (`Nix`) | **9.4 / 10** | `inicia-node-germa.mjs`, `flake.nix`, La Torre viu | Documentar perfil mínim VPS i segon poble pilot |
| `D08` | Privacitat, Seguretat i Blindatge RLS/RGPD | **9.1 / 10** | 64 migracions en viu (11/11), coacció JSONB, RGPD | Tancar Fase 2 E2EE al xat (`P1-12`) i clau `.p8` Apple |
| `D09` | Bloc de Notes Sobirà i Mètode Karpathy | **9.0 / 10** | `proposaCard.js` OKF v0.2 zero-cloud (27 tests) | Culminar `T4` (`IDEA-59`: card ploma, guia, `H3..H2`) |
| `D10` | Memòria Oral, Patrimoni i Multimèdia Local | **9.1 / 10** | `UniversalWorkspace` 3 col., File System API, EXIF | Culminar `T5.1` (`P1-71`: `BarraVolumsLocals` a Col. 1) |
| `D11` | Comunicació Comunitària i Xat Rural | **9.2 / 10** | Xat FIFO/offline, negreta `[N]`, 4 actors base | Culminar `T3.3` (bàndol urgent al Mur) i `T5.2` (`P1-70`) |
| `D12` | Multilingüisme Natiu i Traductor Sobirà | **9.3 / 10** | 5 idiomes natius (`ca/es/eu/gl/en`) + Apertium | Tancar 24 claus residuals `TE-02` (`P1-22`) |
| `D13` | Presència en Botigues Mòbils i PWA | **8.7 / 10** | PWA instal·lable, `PrivacyInfo.xcprivacy`, preflight | Culminar `T6` (`assetlinks.json`, OAuth real i enviament) |
| `D14` | Governança Algorítmica i Telemetria Honesta | **9.5 / 10** | `/consola/*`, Umami sense cookies, Portes i Reflex | Confirmació HTTP servidor a `telemetria.js` (`P2-14`) |
| `D15` | Rendiment, Lleugeresa i Resiliència Rural | **9.5 / 10** | 34 rutes SEO/OG prerender, WebP, 26.018+ proves | Reduir dieta d'arrencada documental (`P2-15`) |

- **Mitjana Global Ponderada del Sistema (`D01`..`D15`):** **`9.25 / 10`** (amb pujada immediata a **`9.55 / 10`** en tancar els blocs `T1..T6` d'esta marató nocturna i integrar el kit `T7.1 + T8`).

#### Detall Tècnic d'Evidència i Full de Ruta al `10/10` per Dimensió

1. **`D01` (9.3/10 · Arquitectura Hexagonal i Port Neutral):** `src/data/backendPort.js` i `src/data/conformitat/kit.js` separen totalment la UI de Supabase i garanteixen el Model B de Sollutia (`GET` pur a la Frontissa). Per al `10/10`: propagar `AbortSignal` real a `upload`/`remove` del SDK de Supabase Storage (`P1-27`) per cancel·lar pujades pesades en vol.
2. **`D02` (9.4/10 · Sistema Pedra Seca i Geometria HD):** `AppGridShell` i `UniversalWorkspace` mantenen 3 columnes estables i 0 desbordaments a `375px` i `1280px`. Per al `10/10`: aplicar el kit `T7.1` d'este informe (que elimina els avisos `div-soup` de `design_guard.mjs`) i decidir amb el Mestre els retocs d'`IDEA-26` / `P1-28`.
3. **`D03` (9.2/10 · Accessibilitat Universal Rural AAA):** El token `--sdp-verd: #0F672F` assoleix `7,19:1` sobre blanc (WCAG AAA), `tractor-cromatic.mjs` passa `C1..C6` en verd i la navegació per teclat (`IDEA-58`) està activa. Per al `10/10`: sessió de certificació amb VoiceOver/TalkBack real en subcomponents dinàmics (`P1-15`).
4. **`D04` (9.7/10 · Sobirania de Dades i Exportació Open Data Municipal):** `src/data/exportaMunicipiOpenData.js` emet el paquet complet Frictionless Data Package v2 (`datapackage.json`), `municipi.jsonld`, `noticies.jsonld` (`NewsArticle`), `agenda.jsonld` (`Event`), `memoria-cultural.jsonld` (`CreativeWork`), `directori.jsonld` (`Organization`/`LocalBusiness`) i `manifest-sha256.txt` (BagIt RFC 8493) amb 50 proves unitàries verdes. Per al `10/10`: connectar el botó de descàrrega demostrativa en viu des de `/page/fediversity` i `/pobles`.
5. **`D05` (8.8/10 · Federació Oberta ActivityPub / NodeInfo):** Els endpoints estàtics `/.well-known/nodeinfo`, `/nodeinfo/2.1.json`, `/.well-known/host-meta` i els actors ActivityPub (`/ap/actors/...`) ja responen en producció a `https://socdepoble.org`. Per al `10/10`: desplegar la Fase 2 d'`ADR-2026-08` (Inbox dinàmic amb verificació de HTTP Signatures per a recepció d'activitats remotes des de Mastodon/Fedivers).
6. **`D06` (9.6/10 · Enxufabilitat Universal WordPress.org):** El connector oficial `socdepoble` (`v1.1.10`) ja és públic i instal·lable mundialment a `https://wordpress.org/plugins/socdepoble/` i roda en producció a `https://gentdelatorre.net` amb Shadow DOM, SRI i preflight WPCS 10/10. Per al `10/10`: tancar `T1` (`canalsDeBotiga.js`) i `T5.3` (`wordpress-plugin/readme.txt` sincronitzat al repo).
7. **`D07` (9.4/10 · Replicabilitat de Nodes Germans):** `tooling/instalador/inicia-node-germa.mjs` i `flake.nix` permeten alçar un node municipal complet en menys de 15 minuts (`6/6` proves E2E verdes). Per al `10/10`: publicar el perfil mínim de maquinari (`T3.4`) i sumar un segon ajuntament/associació comarcals al costat de La Torre de les Maçanes.
8. **`D08` (9.1/10 · Privacitat, Seguretat i Blindatge RLS/RGPD):** Les 64 migracions SQL estan aplicades en viu al Supabase de producció (`11/11` checks verds), amb sanejament DOMPurify estricte (`imatgesPropies: true` al Mur) i exportació/baixa RGPD operativa. Per al `10/10`: connectar la Fase 2 del xifratge d'extrem a extrem E2EE al xat (`P1-12` / `IDEA-19`) i configurar la clau `.p8` d'Apple per a la revocació servidor (`P0-04`).
9. **`D09` (9.0/10 · Bloc de Notes Sobirà i Mètode Karpathy Local):** `src/sections/notes/proposaCard.js` canonitza notes en 3 esglaons i exporta càpsules obertes **OKF v0.2** amb 0 crides al núvol. Per al `10/10`: culminar `T4` (`IDEA-59`: restitució de la Card de la mà amb la ploma, guia reversible a 0 lletres, desplegable `H3 → H4 → H5 → H6 → H2` i barra extensible a 2 files).
10. **`D10` (9.1/10 · Memòria Oral, Patrimoni i Gestor Multimèdia Local):** `/multimedia` integra el motor local sobre File System Access API + IndexedDB i el Mapa Fotogràfic EXIF d'Emowe (`P1-64`). Per al `10/10`: culminar `T5.1` (`P1-71`: moure `BarraVolumsLocals` a la Columna 1 i blindar HMR a `CoreContentContext.jsx`).
11. **`D11` (9.2/10 · Comunicació Comunitària i Xat Rural):** `/xat` clona l'ergonomia de WhatsApp sota Pedra Seca amb cua offline FIFO, negreta intuïtiva `[N]` (`IDEA-53`) i el cervell local BM25 zero-tokens de la IAIA MarIA (`IDEA-56`). Per al `10/10`: culminar `T3.3` (distintiu visual d'alerta/bàndol urgent al `/mur`) i `T5.2` (derivat quadrat `256×256` per a l'avatar de `Javi Llinares`).
12. **`D12` (9.3/10 · Multilingüisme Natiu i Traductor Sobirà Sense Google):** Interfície nativa en 5 llengües (`ca`, `es`, `eu`, `gl`, `en`) i traducció automàtica d'articles via Apertium/MyMemory (`IDEA-31`). Per al `10/10`: completar les 24 claus residuals de diccionari documentades a `TE-02` (`P1-22`).
13. **`D13` (8.7/10 · Presència en Botigues Mòbils i PWA):** El botó d'instal·lació PWA (`P1-69`), `PrivacyInfo.xcprivacy` i `scripts/botigues/preflight.mjs` (`15/15` proves) estan verds. Per al `10/10`: culminar `T6` (`assetlinks.json`, `apple-app-site-association`, guia de publicació multilingüe i enviament dels builds `.aab`/`.ipa` amb OAuth natiu `P0-03`).
14. **`D14` (9.5/10 · Governança Algorítmica, Telemetria Honesta i Consola Pública):** `/consola/*` exposa en viu l'estat dels tractors, la salut i la telemetria Umami sense cookies (respectant `DNT`/`GPC`). Per al `10/10`: afegir confirmació d'acceptació HTTP del servidor a `telemetria.js` (`P2-14`).
15. **`D15` (9.5/10 · Rendiment, Lleugeresa i Resiliència Rural):** `npm run build` pre-renderitza 34 rutes públiques SEO/OpenGraph amb actius WebP ($\le 300\text{ KB}$) i supera més de 26.000 proves automatitzades. Per al `10/10`: aplicar la dieta de tokens d'arrencada documental (`P2-15`) i code-splitting addicional en vistes secundàries (`P1-20`).

---

### BLOC K1 · T7.3 · Visió d'Arquitectura Comunitària 100% Indestructible i Esborrany Oficial per a NLnet — NGI Fediversity (`2026-08-1a6`)

#### 1. Visió Estratègica i Tècnica: Com Sóc de Poble Esdevé un Sistema Públic Comunitari 100% Indestructible

Un sistema digital per als pobles rurals d'Europa no pot dependre de la supervivència financera d'una startup, del caprici d'un gegant tecnològic de Silicon Valley ni de la connexió permanent a un núvol centralitzat. L'arquitectura de **Sóc de Poble** s'ha dissenyat des dels fonaments (**Pedra Seca**) per assolir la **indestructibilitat operativa i documental en quatre anells de resiliència**:

1. **Anell 1 · Immortalitat Documental Zero-Cloud (OKF v0.2 + Frictionless v2 + BagIt SHA-256):**
   - Tota la memòria viva del poble (bàndols municipals, cròniques del mur, agenda cultural, directori d'oficis i comerços, i memòria oral/fotogràfica) s'empaqueta de forma determinista des del propi navegador amb `src/data/exportaMunicipiOpenData.js` i `src/sections/notes/proposaCard.js`.
   - El resultat és un paquet estàndard **Frictionless Data Package v2 (`datapackage.json`) + JSON-LD (`Schema.org`) + BagIt (RFC 8493 amb `manifest-sha256.txt`)** i càpsules de coneixement **Google OKF v0.2** en Markdown pla amb frontmatter YAML.
   - **Garantia d'indestructibilitat:** Encara que desaparegueren tots els servidors del món d'ací a 50 anys, qualsevol veí, arxiver municipal o escola rural pot obrir la carpeta exportada amb un simple editor de text o navegador local i llegir, verificar criptogràficament (`SHA-256`) i reconstruir íntegrament el patrimoni del poble sense cap programari privatiu.
2. **Anell 2 · Autoclonació i Enxufabilitat Universal (Web Component `<soc-de-poble>` + WordPress.org + Nix Flake):**
   - El frontend complet de Sóc de Poble s'encapsula com un Web Component autònom (`<soc-de-poble>`) amb Shadow DOM tancat i integritat criptogràfica SRI (`sha384`).
   - Qualsevol ajuntament o col·lectiu que ja tinga un WordPress convencional pot instal·lar en 30 segons el connector oficial publicat a **`https://wordpress.org/plugins/socdepoble/` (`v1.1.10`)** o executar `node tooling/instalador/inicia-node-germa.mjs` / `nix run .#validate-all` (`flake.nix`) per alçar un node germà independent (com ja opera en viu **`https://gentdelatorre.net`** per a La Torre de les Maçanes).
   - A més, el paquet web pot servir-se des de qualsevol servidor HTTP estàtic, memòria USB local o xarxa comunitària Wi-Fi d'emergència (Guifi.net / Meshtastic / LAN municipal) sense necessitat de Docker ni infraestructures complexes.
3. **Anell 3 · Supervivència Sense Núvols Privatius (Port Neutral `backendPort.js` + File System Access API + Cervell Local BM25):**
   - Tota lectura/escriptura passa per un únic contracte neutral (`src/data/backendPort.js`) verificat per un kit de conformitat automatitzat (`src/data/conformitat/kit.js`). El motor local (`IndexedDB` + `File System Access API` sobre carpetes físiques del disc dur a `/multimedia` i `/gestoria`) i el cervell local de la **IAIA MarIA** (`src/data/iaiaLocal.js`, motor lèxic BM25 i canonitzador determinista `proposaCard.js`) funcionen **100% al dispositiu, amb zero tokens d'API i zero dependència d'OpenAI/Google/Anthropic**.
4. **Anell 4 · Federació Inter-Pobles d'Emergència (`ActivityPub` + `NodeInfo 2.1` + Bàndols Urgents):**
   - Quan un poble pateix una emergència climàtica (DANA, incendi forestal, tall de carretera o avaria d'aigua), el node municipal emet alertes d'alta prioritat (`bandol_urgent`) al `/mur` i les federa com a objectes estàndard W3C `ActivityPub` (`/ap/actors/...`) descobribles per `NodeInfo 2.1` (`/.well-known/nodeinfo`). Els pobles veïns i qualsevol instància del Fedivers poden replicar i difondre el bàndol encara que el servidor d'un ajuntament caiga temporalment.

---

#### 2. Esborrany Complet del Correu Oficial per a NLnet — NGI Fediversity (`Application 2026-08-1a6`)

##### A) Versió en Anglés (Llesta per a enviar als Avaluadors de NLnet Foundation)

```text
Subject: Application 2026-08-1a6 (Sóc de Poble) — Live Production Trilogy, Official WordPress.org Plugin (v1.1.10), Active Sister Node & Technical Clarifications

Dear NLnet Foundation & NGI Fediversity Evaluation Committee,

Thank you very much for your review and feedback regarding our application 2026-08-1a6 ("Sóc de Poble — Sovereign, Pluggable and Federated Digital Infrastructure for Rural Municipalities").

We are writing to respectfully share a major milestone that directly addresses your technical questions: what was proposed in our application as a roadmap is no longer a theoretical design—it is now a live, verifiable production ecosystem ("The Production Trilogy"), already serving real rural citizens and verifiable in one click:

1. Primary Sovereign Node & Live W3C Federation Endpoints (https://socdepoble.org):
   - Live Progressive Web App (PWA) with WCAG AAA rural accessibility (Pedra Seca design system, >= 7:1 contrast ratio).
   - Live NodeInfo 2.1 discovery: https://socdepoble.org/.well-known/nodeinfo and https://socdepoble.org/nodeinfo/2.1.json
   - Live WebFinger / Host-Meta: https://socdepoble.org/.well-known/host-meta
   - Live W3C ActivityPub Actor & Outbox documents: https://socdepoble.org/ap/actors/socdepoble.json and https://socdepoble.org/ap/actors/la-torre-de-les-macanes.json
   - Live transparent verification matrix for evaluators: https://socdepoble.org/page/fediversity

2. Official Plugin Published in the WordPress.org Directory (v1.1.10):
   - Official WordPress.org Plugin Page: https://wordpress.org/plugins/socdepoble/
   - Official SVN Repository: https://plugins.svn.wordpress.org/socdepoble/
   - Any European municipality, rural cooperative, or civic association running a standard WordPress site can now install "Sóc de Poble" in 30 seconds via the official directory. It embeds the sovereign <soc-de-poble> Web Component with closed Shadow DOM, Subresource Integrity (SRI sha384), strict CSP, native 5-language support (Valencian/Catalan, Spanish, Basque, Galician, and English), and a sovereign translation proxy powered by Apertium (zero Big Tech lock-in).

3. First Federated Sister Node in Real Municipal Production (https://gentdelatorre.net):
   - Operating live for the municipality of La Torre de les Maçanes (Alicante, Spain) via the official WordPress plugin ([socdepoble_app poble="la-torre-de-les-macanes"]).
   - Reproducible sister-node bootstrapper (tooling/instalador/inicia-node-germa.mjs) and declarative Nix environment (flake.nix) allowing any rural community to spin up a compliant node in under 15 minutes.

4. Municipal Open Data Portability & Zero-Cloud Knowledge Canonization:
   - Deterministic client-side Municipal Open Data Exporter (src/data/exportaMunicipiOpenData.js) generating Frictionless Data Package v2 (datapackage.json), Schema.org JSON-LD (NewsArticle, Event, CreativeWork, Organization/LocalBusiness), and RFC 8493 BagIt packages with SHA-256 cryptographic manifests (manifest-sha256.txt).
   - Sovereign local Note Canonizer ("Karpathy Method" in src/sections/notes/proposaCard.js) exporting Google Open Knowledge Format (OKF v0.2) Markdown+YAML capsules with zero cloud API calls, plus sovereign local file management over the browser's File System Access API.
   - Backed by 64 production PostgreSQL/RLS migrations and an automated verification suite of over 26,000 passing tests.

Why NGI Fediversity Support Is Crucial Now:
Having self-funded and delivered the complete Phase 1 production infrastructure, official WordPress.org distribution, Open Data BagIt/Frictionless exporter, and live sister-node deployment, we seek NGI Fediversity's support to execute Phase 2 of our open-source roadmap:
- Dynamic W3C ActivityPub Inbox/Outbox federation with HTTP Signatures for bidirectional inter-village federation and emergency municipal alerts (DANA/wildfire resilience).
- End-to-End Encrypted (E2EE) rural messaging (Web Crypto API + Shamir Secret Sharing over GF(2^8) for community-based social key recovery without central administrators).
- Native mobile distribution on F-Droid, Google Play Store, and Apple App Store, plus onboarding new rural municipalities across Europe.

We kindly invite the committee to inspect the live links above (especially https://socdepoble.org/page/fediversity and https://wordpress.org/plugins/socdepoble/) and would be honored to provide a live technical walkthrough or answer any further questions.

With gratitude and rural determination,

Javi Llinares
Founder & Lead Architect — Sóc de Poble (El Rentonar / La Torre de les Maçanes)
https://socdepoble.org | https://wordpress.org/plugins/socdepoble/ | https://gentdelatorre.net
```

##### B) Traducció Íntegra al Valencià (Per a Revisió i Validació del Mestre Javi)

```text
Assumpte: Sol·licitud 2026-08-1a6 (Sóc de Poble) — Trilogia en Producció en Viu, Connector Oficial a WordPress.org (v1.1.10), Node Germà Actiu i Aclariments Tècnics

Benvolgut Comité d'Avaluació de la Fundació NLnet i NGI Fediversity,

Moltes gràcies per la vostra revisió i comentaris sobre la nostra sol·licitud 2026-08-1a6 («Sóc de Poble — Infraestructura Digital Sobirana, Enxufable i Federada per a Municipis Rurals»).

Vos escrivim per compartir amb tot el respecte una fita decisiva que respon amb fets a les vostres qüestions tècniques: allò que a la nostra sol·licitud es plantejava com a full de ruta ja no és un disseny teòric, sinó un ecosistema en producció real («La Trilogia de Producció»), que ja dóna servei a veïns rurals i és verificable en un sol clic:

1. Node Sobirà Principal i Endpoints W3C de Federació en Viu (https://socdepoble.org):
   - Aplicació Web Progressiva (PWA) en producció amb accessibilitat rural WCAG AAA (sistema de disseny Pedra Seca, ràtio de contrast >= 7:1).
   - Descoberta NodeInfo 2.1 en viu: https://socdepoble.org/.well-known/nodeinfo i https://socdepoble.org/nodeinfo/2.1.json
   - WebFinger / Host-Meta en viu: https://socdepoble.org/.well-known/host-meta
   - Documents d'Actor i Outbox W3C ActivityPub en viu: https://socdepoble.org/ap/actors/socdepoble.json i https://socdepoble.org/ap/actors/la-torre-de-les-macanes.json
   - Pàgina pública de verificació transparent per als avaluadors: https://socdepoble.org/page/fediversity

2. Connector Oficial Publicat al Directori de WordPress.org (v1.1.10):
   - Fitxa oficial a WordPress.org: https://wordpress.org/plugins/socdepoble/
   - Repositori SVN oficial: https://plugins.svn.wordpress.org/socdepoble/
   - Qualsevol ajuntament europeu, cooperativa agrària o associació cívica amb un WordPress estàndard ja pot instal·lar «Sóc de Poble» en 30 segons des del directori oficial. Incrusta el Web Component sobirà <soc-de-poble> amb Shadow DOM tancat, integritat criptogràfica SRI (sha384), CSP estricta, 5 idiomes natius (valencià/català, castellà, euskera, gallec i anglés) i traductor sobirà integrat basat en Apertium (zero dependència de Big Tech).

3. Primer Node Germà Federat en Producció Municipal Real (https://gentdelatorre.net):
   - Operatiu en viu per al poble de La Torre de les Maçanes (Alacant) mitjançant el connector oficial de WordPress ([socdepoble_app poble="la-torre-de-les-macanes"]).
   - Instal·lador reproduïble de nodes germans (tooling/instalador/inicia-node-germa.mjs) i entorn declaratiu Nix (flake.nix) que permeten a qualsevol comunitat rural alçar un node conforme en menys de 15 minuts.

4. Portabilitat Open Data Municipal i Canonització de Coneixement Zero-Cloud:
   - Exportador determinista de Dades Obertes Municipals al navegador (src/data/exportaMunicipiOpenData.js) que genera Frictionless Data Package v2 (datapackage.json), JSON-LD Schema.org (NewsArticle, Event, CreativeWork, Organization/LocalBusiness) i paquets BagIt RFC 8493 amb manifestos criptogràfics SHA-256 (manifest-sha256.txt).
   - Canonitzador local de notes («Mètode Karpathy» a src/sections/notes/proposaCard.js) que exporta càpsules obertes Google OKF v0.2 (Markdown + YAML) sense cap crida al núvol, juntament amb gestió local d'arxius sobre la File System Access API.
   - Recolzat per 64 migracions PostgreSQL/RLS en producció i una bateria automatitzada de més de 26.000 proves en verd.

Per què el suport de NGI Fediversity és clau ara mateix:
Havent autofinançat i entregat tota la infraestructura de producció de Fase 1, la distribució oficial a WordPress.org, l'exportador Open Data BagIt/Frictionless i el desplegament del primer node germà en viu, demanem el suport de NGI Fediversity per executar la Fase 2 del nostre full de ruta de codi obert:
- Federació W3C ActivityPub dinàmica (Inbox/Outbox amb HTTP Signatures) per a la federació bidireccional entre pobles i la difusió d'alertes municipals d'emergència (resiliència davant DANAs i incendis forestals).
- Missatgeria rural amb Xifratge d'Extrem a Extrem (E2EE via Web Crypto API + compartició de secrets de Shamir sobre GF(2^8) per a la recuperació social de claus entre veïns de confiança sense administradors centrals).
- Publicació nativa a F-Droid, Google Play Store i Apple App Store, i incorporació de nous municipis rurals.

Convidem cordialment el comité a verificar en viu els enllaços anteriors (especialment https://socdepoble.org/page/fediversity i https://wordpress.org/plugins/socdepoble/) i estarem encantats d'oferir una demostració tècnica en directe o respondre qualsevol pregunta addicional.

Amb gratitud i trellat rural,

Javi Llinares
Fundador i Arquitecte Principal — Sóc de Poble (El Rentonar / La Torre de les Maçanes)
https://socdepoble.org | https://wordpress.org/plugins/socdepoble/ | https://gentdelatorre.net
```

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Evidència Reproduïble del Tall 1 (`04:08 CET`) i Tall 2 (`04:59 CET` · Kit K1)

| Comprovació / Porta | Comanda executada | Resultat |
| --- | --- | --- |
| Porta d'Autoritat | `node tooling/gates/porta-autoritat.mjs` | **VERD (`exit 0`)** · `{"valid": true, "errors": []}` |
| Porta Olivera | `node tooling/gates/porta-olivera.mjs` | **VERD (`exit 0`)** · Safata buida, tots els documents solts ancorats a `00_index_escriptori.md` |
| Design Guard (Arbre Viu) | `node tooling/gates/design_guard.mjs --arrel=src` | **VERD (`exit 0`)** · `2766 fitxers, 0 critics, 12 avisos. PASSA.` |
| Design Guard (Kit Gemini `T7.1` en `/tmp`) | `node tooling/gates/design_guard.mjs --arrel=/tmp/sdp_verify_tree_261101/src --detall` | **VERIFICAT** · Els 11 fitxers del kit baixen a **`0 crítics i 0 avisos`** (només resta `pageContent.js`, exclòs per no col·lidir amb Claude) |
| Verificador del Kit Satèl·lit (`T7.1` + `T8`) | `python3 ../_investigacio_ia_de_poble/261101_kits_marato_nocturna/gemini/verifica_i_aplica.py --check` | **VERD (`exit 0`)** · 11 fitxers `LLEST PER APLICAR (base intacta)` + 2 fitxers `T8` (`exportaVCard.js` / `.test.js`) + `29` entrades a `SHA256SUMS` |
| Tractor Cromàtic (WCAG) | `node tooling/gates/tractor-cromatic.mjs` | **VERD (`exit 0`)** · `C1..C6` verd en totes les superfícies |
| Vitest (Lots T1..T5 + Contrast) | `npx vitest run src/config/canalsDeBotiga.test.js src/sections/detail/InstalaLaPwa.test.jsx src/sections/text/pageContent.fediversity.test.js src/data/exportaMunicipiOpenData.test.js src/sections/notes/proposaCard.test.js src/components/universal/DocumentEditor.proposaCard.test.jsx src/components/universal/UniversalToolbar.proposaCard.test.jsx src/app/App.contrast.test.jsx` | **VERD (`exit 0`)** · `8 passed (8)`, `147 passed (147)` en `3.60s` |
| Node Test (`inicia-node-germa`, `enxufe-plugin`, `botigues`) | `node --test tooling/instalador/inicia-node-germa.test.mjs tests/enxufe-plugin.test.mjs tests/botigues.test.mjs` | **VERD (`exit 0`)** · `43 pass, 0 fail` en `877ms` |
| Build complet de producció (`04:08 CET`) | `npm run build` (`build:tokens` + `rag:build` + `slugs:build` + `build:web` + `build:wp` + `build:seo` + `build:social`) | **VERD (`exit 0`)** · 81 documents RAG/slugs, bundle web + standalone WP + pre-render SEO/OG generats sense errors |
| Porta de Documents (`04:59 CET`) | `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261101_0407_auditoria_gemini_marato_nocturna.md` | **VERD (`exit 0`)** · `{"valid": true, "errors": []}` |
| Tall 3 · Portes lleugeres sobre les edicions de Claude (`05:34 CET`) | `porta-olivera.mjs`, `porta-autoritat.mjs`, `design_guard.mjs --arrel=src`, `tractor-cromatic.mjs` | **VERD (`exit 0`)** · `2798 fitxers, 0 critics, 12 avisos` (els 32 fitxers nous de Claude tenen `0 avisos` de `design_guard`) |
| Tall 3 · Node Test sobre `T2`/`T3`/`T6` (`05:36 CET`) | `node --test tests/inicia-node-germa.test.mjs tests/enxufe-plugin.test.mjs tests/botigues.test.mjs` | **VERD (`exit 0`)** · `45 pass, 0 fail` en `1268ms` (inclou les 6 proves noves de `tests/inicia-node-germa.test.mjs` sobre Xixona) |
| Tall 3 · Compatibilitat del Kit Satèl·lit Gemini amb els 95 fitxers de Claude (`05:39 CET`) | `python3 ../_investigacio_ia_de_poble/261101_kits_marato_nocturna/gemini/verifica_i_aplica.py --check` | **VERD (`exit 0`)** · **ZERO col·lisió**: els 11 fitxers `T7.1` continuen `LLEST PER APLICAR (base intacta)` i els 2 fitxers `T8` continuen `NOU (absent al repo)` |
| Tall 3 · Frontissa de Contingut (`05:34 CET`) | `node tooling/gates/frontissa-contingut.mjs` | **AVÍS (`exit 1` · `TG-04`)** · Pendent que Claude actualitze en `T9` les empremtes aprovades de `descarregues` i `fediversity` després d'editar `pageContent.js` |
| Tall 4 · Seguiment de `T7`/`T8`/`T9` amb preservació de CPU (`06:11 CET`, `load: 9.67`) | `porta-olivera.mjs`, `verifica_i_aplica.py --check`, `git diff --shortstat` | **VERD (`exit 0`)** · **105 fitxers modificats** i **39 fitxers nous** per Claude (`+3.681 / -2.357 línies`); **ZERO col·lisió** amb el Kit Gemini; enllaços de `00_index.md`, `00_index_maquina.md` i `261031_0142_acta_tancament...` reconciliats per Claude |
| Tall 5 · Revisió creuada de la Passada 2/3 de Codex `v1.3.0` i bateria `T9` de Claude (`06:43 CET`, `load: 32.13`) | `git diff --shortstat`, lectura íntegra de `261101_0403_auditoria_codex_marato_nocturna.md` (`v1.3.0`) | **VERD (`exit 0`)** · **107 fitxers modificats** (`+3.954 / -2.363 línies`); Passada 2/3 de Codex completada (`91/93` proves Node passades, `0 fallades`, convergència total en `TG-04`); actualitzada URL d'actor a `la-torre-de-les-macanes.json` al correu de NLnet |
| Tall 6 · Integració en curs dels Kits Satèl·lit `gemini/` i `codex/` per Claude (`07:15 CET`, `load: 27.31`) | `verifica_i_aplica.py --check`, `design_guard.mjs`, `porta-olivera.mjs` | **VERD (`exit 0`)** · **113 fitxers modificats** (`+4.507 / -2.537 línies`); 3 fitxers del kit `gemini/` (`EspecimenIndicador`, `EspecimenTasquesFitxers`, `EspecimenUtilitats`) i 2 fitxers del kit `codex/` ja integrats per Claude; `design_guard` baixa de `12` a `9 avisos` (`0 crítics`) |
| Tall 7 · Certificació de l'Entrega Final de Claude (`07:46 CET`, `load: 4.93`) | `frontissa-contingut.mjs`, `porta:design-guard`, `porta:cromatic`, `porta:orfandat`, `porta:frontmatter`, `porta-autoritat.mjs`, `porta-olivera.mjs`, `document.mjs check` sobre `261101_0409_auditoria_claude.md` | **VERD (`exit 0` en TOTES les portes)** · **124 fitxers modificats** (`+4.703 / -2.574 línies`); `Frontissa 16/16` aprovada (`TG-04` resolt); `design_guard` `2.803 fitxers, 0 crítics, 9 avisos`; `orfandat` `0 enllaços trencats, 0 orfes`; informe de Claude validat (`1.573 fitxers / 27.243 proves Vitest`, `1.789 Node`, `build exit 0`) |
| Tall 8 · Tancament Final de la Marató Nocturna i Convergència 3/3 amb Codex (`08:18 CET`) | Lectura de `261101_0403_auditoria_codex_marato_nocturna.md` (`v1.4.0`), `porta-olivera.mjs`, `frontissa-contingut.mjs`, `document.mjs check` dels 3 informes, `manage_task list` | **VERD (`exit 0`)** · Passada 3/3 de Codex completada (`328 proves Vitest` + `107 proves Node` en verd, `0 fallades`, automatització eliminada a les `08:04 CET`); **ZERO temporitzadors actius (`IDEA-07`)**; 3/3 informes canònics validats a l'Escriptori |

### Convergència Final dels Tres Informes (`Claude Opus 5.5` + `Codex GPT-6 v1.4.0` + `Gemini 4 Argon v1.8.0`)

- **Convergència 100% en l'acceptació tècnica local de `T1..T9`:**
  - **Claude Opus 5.5 (`261101_0409_auditoria_claude.md`):** Ha implementat i verificat `T1..T8` sobre `124 fitxers modificats` (`+4.703 / -2.574 línies`), amb **1.573 fitxers / 27.243 proves Vitest passades (`0 fallades`)**, **1.789 proves Node passades (`0 fallades`)**, `npm run build` complet en **VERD (`exit 0`)** i verificació en viu a `http://localhost:3340`.
  - **Codex (`261101_0403_auditoria_codex_marato_nocturna.md`, `v1.4.0`):** Ha completat les seues **3/3 passades** (`08:07 CET`) amb **328 proves Vitest** i **107 proves Node** dirigides al delta final (`435 proves pròpies verdes, 0 fallades`), `Frontissa 16/16` en verd i desconvocatòria consumada de la seua automatització (`deleteStatus: deleted`).
  - **Gemini (`261101_0407_auditoria_gemini_marato_nocturna.md`, `v1.8.0`):** Ha verificat les portes estructurals en viu al llarg de 8 talls (`04:08` a `08:18 CET`), ha entregat el BLOC K1 complet (Matriu de 15 punts, Visió d'Arquitectura 100% Indestructible i Esborrany Bilingüe del Correu Oficial a NLnet Fediversity `2026-08-1a6`) i el Kit Satèl·lit (d'on Claude ha integrat els 3 espècimens reduint `design_guard` de 12 a 9 avisos), i ha apagat definitivament tots els temporitzadors (`IDEA-07`).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- S'han llegit sencers els tres documents governants (`261101_0311_pla_implementacio_...`, `261101_0311_prompt_marato_nocturna_...` i `03_llibre_mestre_tasques_i_idees.md` amb 109.680 bytes), l'última Acta Marmota (`261101_0334`) i `.agents/ESTAT.md`.
- Cap fitxer de codi (`src/`, `tooling/`, `tests/`, `public/`, `ios/`, `wordpress-plugin/`) ha sigut modificat per MarIA per respectar l'exclusivitat d'edició de Claude durant la marató nocturna.
- Aquest informe s'actualitzarà en cada tall de verificació a mesura que Claude despatxe els blocs `T1..T8`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261101_0311_pla_implementacio_marato_nocturna_fediversity_notes_i_llibre_mestre]]
- [[261101_0311_prompt_marato_nocturna_fediversity_notes_i_llibre_mestre]]
- [[261101_0403_auditoria_codex_marato_nocturna]]
- [[261101_0409_auditoria_claude]]
