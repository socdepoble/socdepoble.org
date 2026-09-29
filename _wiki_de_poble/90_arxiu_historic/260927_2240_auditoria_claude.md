---
type: informe
status: esborrany
description: Mesures en viu de la barra blava, canvis de T20 a T32 amb proves, taula de potencia de la familia Claude i decisions pendents del Mestre
tags:
  - auditoria
visibility: private
reflex: sdp:torn_d784bcf3-adac-49f5-b14b-c6843cd26676:621b39ab-c7fc-4de1-8757-ceb7febaae74
---
# Auditoria T20-T32: barra blava, Foraster, iconografia viva, subseccions, mòbil i taula de models

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d784bcf3-adac-49f5-b14b-c6843cd26676:621b39ab-c7fc-4de1-8757-ceb7febaae74 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-27T20:48:53.526Z |
| Modificació | 2026-09-27T21:35:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (`claude-fable-5-1`), Claude Code amb Ultracode; workflow de lectura amb 5 subagents del mateix model |
| Tokens consumits | Workflow de lectura: 1.029.010 tokens de subagents (403 crides d'eines, 17 min 28 s). La sessió principal no exposa el seu comptador: no s'inventa. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-09-27T20:38Z: torn `torn_d784bcf3` obert (actor claude, scope code). Lectura del pla i del prompt 2220, de les skills que el router ha disparat (pedra-seca, workflow, documentació, estratègia-ia, universal-page, app-grid-shell, universal-editor) i de l'última Acta Marmota (1850).
- 2026-09-27T20:48Z: esborrany d'esta auditoria creat amb rebut. Mesures en viu de la barra blava al navegador integrat (800, 1440 px; Notes i Mur) abans de tocar cap fitxer.
- 2026-09-27T20:50Z a 21:08Z: workflow de lectura (4 lectors en paral·lel: barra blava i cascada, Foraster, glifs i mode edició, portes; més un crític de completesa). L'agent «portes» du un avís de l'harness («Auto-Mode Bypass»): la seua eixida s'ha usat només com a mapa de lectura, i tot el que s'hi cita s'ha comprovat després al codi.
- 2026-09-27T21:00Z: el Mestre afig T24 i T25 en directe; 21:05Z, T26 a T28 al prompt i al pla; 21:2xZ, T29 a T32 i cancel·lació de T25 (commits `docs:` del Mestre, `.git/logs/HEAD`).
- 2026-09-27T21:00Z a 21:30Z: implementació de T20, T22, T23, T24, T26, T27, T28, T29, T30, T31 i T32; T25 implementada i retirada després en cancel·lar-se. Proves, lint i design guard executats; verificació en viu a 375, 800, 1000 i 1440 px.
- 2026-09-27T21:35Z: informe v1.0.0. Sense commit propi: els commits `docs:` del Mestre fets durant el torn han arrossegat també els fitxers de codi que ja estaven canviats (vegeu Límits).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### A. Mesures en viu abans de tocar res (font: `getComputedStyle` al navegador integrat, servidor 3340)

| Superfície | Mesura | Conseqüència |
| --- | --- | --- |
| `header.bar-blue` a l'editor de Notes amb tres columnes (viewport 800) | barra de 311 px; graella `1fr auto 1fr` amb columnes 73,5 / 132 / 73,5; trio esquerre 670–802, trio central 744–876 | els dos trios se solapaven 58 px i la fletxa «endavant» quedava davall de «Traduir» |
| `header.bar-blue` al Mur (viewport 1440) | barra de 1165 px; trio nav 276–408, trio accions 777–909, Connectar 1279–1409 | 370 px de buit entre cada grup: el que el Mestre anomena «massa separació» |
| Botons de la barra | 44×44, coixí 0, marge 0, icona 24, gap 0 | el pla deia «eliminar marges o paddings sobrants»: no n'hi havia cap; la Llei de Vida (44 px) impedix acostar més les icones dins d'un trio |
| Peu de la UniversalCard | accions 48 px amb gap 4 a l'esquerra, Connectar a la dreta | referència atòmica per a la nova disposició de la barra |
| Arbre de carpetes (Notes, Disseny, Wiki) | fila comença a 264 (la del Xat a 260): el `li` du 4 px de coixí de la tipografia editorial; gap 13 px; text a 317 (Xat: 316); espaiador de 44 px transparent a la dreta de l'entrada activa | T26.1 i T28 |
| Wiki de Poble en entrar | categoria `__all__`, cap fila de l'arbre amb `aria-current` | T26.2 |
| `NavLink` | actiu només si `currentPath === to` o comença per `to + '/'`; `/control-xat` no casa amb `/xat` | T27 |
| Logotip al mòbil (375) | 40×10 px sobre un natural de 300×78: proporció correcta però una tireta | T29 |
| Barra negra | botó IAIA present entre món i lupa (App.jsx) | T30 |

### B. Què s'ha fet, tasca per tasca

- **T20 · Barra blava en dos packs.** `layout.css` (`header.bar-blue`): de graella a fila flex amb `gap: var(--sdp-space-6)`; `components.css` (§ Trios): els trios no s'encongixen (`flex: none`), CONNECTAR recupera `margin-left: auto` (la família de barra li posava `margin: 0` després), passos per amplària de barra a ≤400 px (gap i coixí 8) i ≤336 px (packs a tocar, coixí 0, «+» de 44), i el pare `.sdp-universal-page-container` passa a ser contenidor de consulta perquè `header.bar-blue` no pot consultar-se a si mateix. Resultat mesurat: Mur 1440 → glifs a 286·330·374 ‖ 442·486·530 (44 px entre packs, 20 dins) i CONNECTAR a la dreta; editor 511 → 16·172·365; editor 331 → 8·148·288 amb «+» de 44; mòbil 375 → 8·148·319. Espècimen del catàleg (`EspecimenControlsBarra.jsx`) posat al dia (ordre Arrere·Índex·Endavant i packs).
- **T21 · Taula de potència de la família Claude.** Secció E d'este informe.
- **T22 · Foraster.** `UniversalUtils.js`: constant `FORASTER` (nom + poble) i `autorDeSessio(currentUser)` (sense sessió, el Foraster sencer; amb sessió, `user_metadata.name || full_name` i `user_metadata.town_name`, o buit). Consumidors: `NotesEditor.jsx` (barra taronja; abans deia «Identitat Lliure»), `NotaFitxa.jsx` (targeta viva), `UniversalEditorShell.jsx` (reserva; abans «Nom del poble del Foraster»). Prova nova a `UniversalEditorShell.test.jsx`. Verificat en viu: sense sessió, barra taronja i targeta diuen «Foraster / Poble de la persona forastera».
- **T23.1 · Icona de la IA de la Universal Page.** Primera lectura errònia: vaig llevar la IAIA de la barra negra i el Mestre la va reclamar (T30). Lectura definitiva: la «i» d'informació del botó d'estat de la barra taronja de l'editor (`NotesEditor.jsx`, `statusIcon`), el lloc on la skill `sdp-universal-editor` §1 situa la ploma. Llevada: el botó torna a dir l'estat (cadenat/món). Decisió D3.
- **T23.2 i T23.3 · Emoticones i ploma.** Camp `icon` del document (un sol emoji, validat per `utils/emoji.emojiSol`, extret de `NavGlyph.jsx` perquè la capa de dades no importe components). `BotoneraClassificacio.jsx`: quart botó «Emoticona» amb la ploma (`Feather`) quan no n'hi ha i l'emoticona quan n'hi ha; `DialegEmoticona.jsx` (Dialeg + Camp + CampText, el teclat d'emojis del sistema fa de selector); `NotesEditor.jsx` desa per `escriu` (sandbox del Foraster o `setLocalNoteField`); `NotesSection.jsx` mapa `icon` a l'ítem (ItemMedia i rail ja el llegien); `localNotes.js` i `NotesContext.jsx` netegen el camp. Flux verificat en viu: triar 🍅, desar, recarregar (persistix en local), llevar. Proves a `Classificacio.test.jsx` i `emoji.test.js`.
- **T24 · Roda dentada.** `App.jsx`: plegada, la cel·la de dalt del rail pinta `Settings` en lloc de `PanelLeftOpen`. Mesurat: 56×58, roda de 24 a l'eix 28.
- **T25 · Cancel·lada.** Implementada dues vegades (cap a dins, cap a fora) seguint el pla, i retirada sencera d'`AppGridShell.css` quan el Mestre l'ha cancel·lada. No en queda cap regla.
- **T26.1 · Taronja fins a la vora.** `modules.css`: el botó de desplegar o l'espaiador de 44 px que tanca la fila hereta el taronja de l'entrada activa (germà adjacent, sense `:has()`). Mesurat a Notes i Wiki: fila 260–520, espaiador taronja.
- **T26.2 · Wiki entra amb la primera opció.** `WikiDePobleSection.jsx`: sense res a la URL, carpeta `__intro_cat` («Wiki de Poble») i portada oberta; amb `?item=` sense carpeta, «Tot» com abans; «Tot» triat a mà es guarda a la URL. Proves ajustades (`WikiDePobleSection.test.jsx`, `.navegacio.test.jsx`).
- **T27 · Mai sense element actiu.** `RouterContext.jsx`: `NavLink` accepta `matchPaths`; `sections.js`: `subrutes` (xat ← /control-xat; pobles ← /poblacio, /perfil, /el-meu-perfil, /gent, /empresa, /ajuntament, /grup; ia ← /realitat); `App.jsx` les passa a la barra i a la navegació mòbil, i el botó CONTROL s'encén a /control i /utilitats (`layout.css`). Verificat: /control-xat encén «Xat», /realitat «L'ànima de la iaia», /control el botó CONTROL. Rutes sense pare: D6.
- **T28 · Estil Excel.** `modules.css`: `.sdp-workspace-categories` sense coixí de dalt i `li` sense sagnat; gap del `.sdp-workspace-nav-item` de 13 a 16 (`--sdp-space-4`). Mesurat a Notes i Wiki: eix d'icona 288 i text a 316, els mateixos que el rail del Xat; primera fila enganxada a la capçalera.
- **T29 · Logotip.** `layout.css` (≤480): contenidor `flex: 1 1 auto; min-width: 0`, imatge `max-height: 32px; width: auto; max-width: 100%`, icones `flex: none`. Mesurat a 375: 123×32, proporció 3,85 = natural, sense solapar les icones.
- **T30 · IAIA.** Restaurada a `App.jsx` entre el món i la lupa. Animació: `layout.css` `sdp-iaia-resplendor` (8 s, vel taronja `--sdp-accent-vel`) sobre `.sdp-top-bar-btn--iaia-activa`, substituint un `.iaia-icon` que cap element portava. Estat: `sections/realitat/nivellIaia.js` (nivell del Selector de Realitat, actiu a partir del 2; esdeveniment `sdp:iaia-nivell` perquè la barra negra s'assabente sense tornar a muntar-se). Verificat: nivell 2 → classe i animació de 8 s; nivell 1 → cap. Decisió D7.
- **T31 · /realitat.** `RealitatSection.jsx`: els nivells eren `<button>` amb classes que cap full definia (`card--accent`, `realitat-btn`: es pintaven amb l'estil de l'agent d'usuari). Ara `GrupOpcions` (ràdios) i `Casella` de Pedra Seca dins de `.sdp-realitat` (68ch, `modules.css`). Prova nova `RealitatSection.test.jsx`.
- **T32 · Píndoles centrades.** `modules.css`: `.page-title-classificacio` i `.sdp-copyright-control` amb `justify-content: center`. Mesurat a 375: cada fila centrada dins de 48–327.

### C. Troballes col·laterals (evidència al codi)

1. **`@container` no s'aplica a l'element contenidor.** `header.bar-blue` és contenidor (`components.css`), i les regles sobre ell dins d'una `@container` no casaven mai: per això a 331 px la barra desbordava 41 px. Resolt fent contenidor el pare. Font: CSS Containment 3 §container queries; comprovat en viu (contenidor `inline-size` al pare, gap 8 a 331 px).
2. **`.sp-card-connect { margin-left: auto }` trepitjat** per `margin: 0` de la família de barra (mateixa especificitat, posterior). Amb la graella no es notava (`justify-self: end`); amb flex, sí. Resolt amb pes.
3. **Espècimen del catàleg desfasat**: `EspecimenControlsBarra.jsx` deia «Arrere · Avant · Índex» i pintava eixe ordre; PageFrame posa l'Índex al mig des del 260924. Corregit (§9 de Pedra Seca: res existix fins que no és al manual).
4. **CSS mort**: `layout.css` `.iaia-icon` + `@keyframes sdp-iaia-pulse` (cap element amb eixa classe; el SVG du `sdp-iaia-icon`). Substituït per l'animació de T30.2.
5. **`design_guard` ja eixia roig abans del torn** (deute heretat, no meu): DocumentPrintPreview.jsx (4 hex, h1), ConnectarSection.css (13 hex, outline none), ConnectarSection.jsx (h1), modules.css (14 px ×2), WikiDePobleSection.navegacio.test.jsx (h1). Després del torn ix exactament igual: 434 fitxers, 68 crítics, cap identitat nova meua.
6. **`StructuredOutput` ja passa el hook** (`mutation-policy.mjs` READ_TOOLS): la «LLIÇÓ D'OR» de l'ESTAT del 260927 01:51 (cap `schema` als agents) ha caducat des del T1 de Codex. Els lectors d'este torn han tornat text pla igualment.
7. **Els commits `docs:` del Mestre han arrossegat codi**: `git status` mostrava només 5 fitxers modificats quan n'hi havia 20 tocats; els altres 15 ja eren dins de commits amb missatge `docs: afig T2x…` (`.git/logs/HEAD`, 21:03Z a 21:29Z). El codi és a HEAD, però el missatge no el descriu.
8. **Barra principal plegada**: l'eix de la primera entrada (`.nav-item` svg) cau a 26 i la roda de dalt a 28 (2 px). Pre-existent; no tocat.
9. **Skills a propagar** (no les puc editar: `.agents/` demana executor amb lease): `sdp-universal-page` §A diu «trio central centrat matemàticament», ara són dos packs a l'esquerra; `sdp-universal-editor` §1 diu «ploma = canvis pendents a la barra taronja», T23.3 posa la ploma a la botonera com a «sense emoticona en edició». Vegeu D4 i D5.
10. **Persistència remota de l'emoticona**: `supabase/notes.js` (DTO, `SUMMARY_COLUMNS`, cos de `createNote`, payload d'`updateNote`) i `supabase/migrations` no coneixen `icon`; el payload la descarta en silenci. En mode seed/local i al sandbox del Foraster persistix. Falta contracte de dades (Codex, AGENTS §8): D2.
11. **Rutes sense pare a la barra principal** (T27 diu «mai sense actiu»): /cerca, /registre, /connectar, /traduccions, /page/:slug, /consola, /admin. No he inventat pares: D6.
12. **Literals «Foraster» fora de la constant**: `mapejadorSeccions.js` (autor de publicacions sense autor: 51, 52, 72, 93) i els textos «Mode Foraster» de `ConnectarSection.jsx` (113, 140). Al xat el convidat és «Jo» per a ell i «Veí» per als altres, sense poble. D1.
13. **Baseline 2022**: `@container` és Chrome 105 / Safari 16 / Firefox 110. Per a Chrome 100 i Firefox 100 la `@media (max-width: 480px)` de `layout.css` fa de xarxa (coixí i gap 8): a 320 px de viewport amb els dos packs i el «+» hi ha 16 px que sobreïxen per la dreta en eixos navegadors. Amb `@container`, cap.

### D. Decisions que només pot prendre el Mestre (`requires_human_decision: true`)

- **D1 · On més ha de dir «Foraster / Poble de la persona forastera».** Ara: barra taronja de l'editor i targeta viva de Notes (i la reserva de la closca). Candidats: `mapejadorSeccions.js` (autor de publicacions), textos «Mode Foraster», el xat («Veí» hui). Amb sessió, el poble ix de `user_metadata.town_name`; la font canònica seria `profiles.town_name` via `getProfile`, que Notes no consulta.
- **D2 · Columna `icon` a `notes` (Supabase)**: `alter table public.notes add column icon text` més DTO, `SUMMARY_COLUMNS`, payloads i purga. Backend: Codex segons l'ESTAT 22:20.
- **D3 · T23.1**: la «i» llevada és la del botó d'estat de la barra taronja de l'editor. Si volies també la «i» de la targeta viva (`NotaFitxa.jsx`, `headerAction`), és una línia. Si volies una altra icona, també.
- **D4 · Emoticones per defecte** (T23.2 al prompt, «per defecte als components»): he deixat els glifs de sistema (Folder, FileText, Bookmark, Hash i el mapa de carpetes) i he donat el mecanisme perquè l'usuari pose la seua. Passar els defectes a emojis toca `NavGlyph.jsx`, `UniversalWorkspace.jsx`, `carpetes.js` (i `ConnectarSection.jsx`, que usa el mapa com a component) i 7 assercions de prova.
- **D5 · Conciliar les dues plomes** a `sdp-universal-editor` §1 (canvis pendents) i T23.3 (sense emoticona en edició), i actualitzar `sdp-universal-page` §A (packs). Skills: cal executor amb lease.
- **D6 · Pares de ruta** per a /cerca, /registre, /connectar, /traduccions, /page/:slug, /consola i /admin, o acceptar que a eixes pàgines la barra no té element actiu.
- **D7 · Què és «IA activa»** per a l'animació: he pres el nivell del Selector de Realitat (≥ 2). No hi ha cap altre estat d'activitat d'IA a l'app (cerca de `isThinking`, `iaActiva` i semblants: cap).
- **D8 · Alçada de fila a Notes**: `.sdp-bloc .sdp-workspace-nav-item` fa 48 (`--sdp-bloc-control`); Xat, Disseny i Wiki, 44. Per a «exactament la mateixa base» caldria unificar; no ho he tocat.
- **D9 · T20, alternativa B**: packs a l'esquerra i CONNECTAR sol a la dreta (fet, com el peu de la targeta). L'altra lectura del pla («Pack 2 (Dreta)» enganxat a CONNECTAR) és una línia: `margin-left: auto` a `.bar-blue .sp-card-actions` en lloc de Connectar.

### E. T21 · Taula de potència de la família Claude i lloc a Sóc de Poble

Fonts: referència de models del skill `claude-api` (taula en memòria cau del 2026-06-24: identificadors, context i preu de l'API en dòlars per milió de tokens) i la telemetria pròpia del Mas (ESTAT 260927 01:35 i 01:51; este torn). La columna «Potència» és un ordre relatiu derivat del nivell i de la generació, no un benchmark: no hi ha cap mesura pròpia del Mas per a comparar-los. Els multiplicadors exactes de consum dels plans Pro no consten en cap font del repositori ni del skill: l'única proporció pública és la del preu de l'API, i és la que s'usa ací per a estimar «quant de límit gasta» cada model.

| Model | Identificador | Potència (1–10, relativa) | Context | Preu API (entrada / eixida, $/MTok) | Consum de límit relatiu (Sonnet 5 = 1) | Lloc ideal a Sóc de Poble |
| --- | --- | --- | --- | --- | --- | --- |
| Haiku 4.5 | `claude-haiku-4-5` | 3 | 200K | 1 / 5 | 0,5 | Pic i pala mecànic: reanomenar, formatar, lectors de workflows (els 4 lectors d'este torn haurien costat una desena part), classificar, resumir logs. Mai decisions d'arquitectura. |
| Sonnet 4.6 | `claude-sonnet-4-6` | 5 | 1M | 3 / 15 | 1,5 | Cap: costa més que Sonnet 5 i rendix menys. Només si un contracte antic el demana. |
| Sonnet 5 | `claude-sonnet-5` | 6 | 1M | 2 / 10 | 1 | El cavall de treball: CSS i JSX de rutina (T20 a T32 eren faena de Sonnet 5), proves, documentació, refutadors d'auditoria en paral·lel. |
| Opus 4.6 / 4.7 / 4.8 | `claude-opus-4-6`, `-4-7`, `-4-8` | 6,5 / 7 / 7,5 | 1M | 5 / 25 | 2,5 | Cap raó de triar-los: mateix preu que Opus 5 i menys potència. Compatibilitat només. |
| Opus 5 | `claude-opus-5` | 8 | 1M | 5 / 25 | 2,5 | Arquitectura, refactors entre fitxers, jutge i orquestrador d'auditories, decisions de Model B. El model per defecte de Claude Code. |
| Opus 5.5 (en llançament) | `claude-opus-5-5` | 8,5 | 1M | 4 / 20 | 2 | El substitut natural d'Opus 5 quan estiga disponible al pla: mateix nivell, més barat. Només si el Mestre l'anomena. |
| Fable 5 | `claude-fable-5` | 9 | 1M | 10 / 50 | 5 | Superat per Fable 5.1 al mateix preu. |
| Fable 5.1 | `claude-fable-5-1` | 9,5 | 1M | 10 / 50 | 5 | Tasques de llarg abast amb molta autonomia: Ultracode amb refutació adversarial, auditories extremes, problemes on Opus 5 s'encalla. Cinc vegades el consum de Sonnet 5: es reserva, no es gasta en CSS. |
| Mythos 5.1 | `claude-mythos-5-1` | 9,5 | 1M | 10 / 50 | 5 | No disponible: només organitzacions aprovades (Project Glasswing). Mateix model que Fable 5.1 sense les mesures addicionals. |

Regles de triatge que se'n deriven per al Mas:

1. **La palanca barata és l'esforç, no el model antic.** Abans de baixar de model, baixar `effort` (`output_config.effort`: low, medium, high, xhigh, max): un Opus 5 a `medium` sol rendir més que un Opus 4.6 a `high` i gasta menys. Sonnet 4.6 i Opus 4.x no tenen cap lloc a la taula de costos d'un pla Pro.
2. **Cada peça al seu model.** Lectura massiva i mecànica → Haiku 4.5. Codi de rutina, proves i documents → Sonnet 5. Arquitectura, jutjar troballes i integrar → Opus 5 (5.5 quan arribe). Només el que Opus 5 no trau → Fable 5.1.
3. **Ultracode és car per construcció.** Este torn: 1.029.010 tokens de subagents en 17 minuts només per a llegir, a preu de Fable. La telemetria del 260927 01:35 (55 $ en 12 minuts amb 8 lectors) diu el mateix. Quan s'orquestre amb Fable, els lectors i refutadors han d'anar a Haiku 4.5 o Sonnet 5 (`opts.model` del workflow) i Fable només ha de jutjar i integrar.
4. **Codex es reserva** per a backend, RLS i migracions (ESTAT 22:20: límits al 48 %, 24 hores), mai per a CSS.
5. **Mesurar, no creure.** `node tooling/brain/tracker_consum.mjs` (skill `core-estrategia-ia`) després de cada torn; la fila «Consum de límit relatiu» és una proporció de preu, no una lectura del pla.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Proves**: `npx vitest run src` → 115 fitxers, 1.220 proves, totes verdes (23:25). Abans del torn, els 6 fitxers que anava a tocar: 75/75. Proves noves: `UniversalEditorShell.test.jsx` (T22), `Classificacio.test.jsx` (T23: botonera i diàleg), `utils/emoji.test.js`, `RealitatSection.test.jsx` (T31 i T30.2), `WikiDePobleSection.test.jsx` (T26.2). Proves ajustades per canvi demanat: `NotesEditor.test.jsx` (4 botons), `WikiDePobleSection.navegacio.test.jsx` (entrada amb la portada triada).
- **Lint**: `node --test tests/lint-sessio.test.mjs` amb la llista dels 25 fitxers del torn → net (`npm run lint` no passa el hook; esta prova executa el mateix ESLint amb `--max-warnings=0`).
- **Design guard**: `node tooling/gates/design_guard.mjs --arrel=src` → PARAT abans i després del torn amb les mateixes identitats (deute heretat, § C.5); cap identitat nova meua. Un `<h1>` d'un mock de prova meu l'ha fet pujar un moment i s'ha corregit.
- **En viu (navegador integrat, servidor 3340, `getComputedStyle`)**: barra blava a 1165, 511, 391, 331 i 375 px (§ B); arbre de carpetes a Notes i Wiki (eix 288, text 316, fila 260–520, espaiador taronja); barra lateral plegada (roda 24 a l'eix 28, 56×58); /control-xat, /control i /realitat amb l'element actiu correcte; Foraster a la barra taronja i a la targeta viva; emoticona (desar, recarregar, llevar); logotip 123×32 a 375 px; IAIA entre món i lupa amb animació de 8 s al nivell 2 i cap al nivell 1; /realitat amb 4 ràdios dins de 622 px centrats; píndoles centrades a 375 px. Captures preses al navegador durant el torn, no desades al disc.
- **Comprovacions del torn**: `document.mjs check` d'este informe i `tancament.mjs --check --turn-id torn_d784bcf3` executats en tancar (resultat al relleu d'ESTAT).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Cap commit ni push propis. Els commits `docs:` del Mestre durant el torn contenen també el codi (§ C.7): el relleu documental sí que l'he fet, l'historial de git el descriu com a docs.
- L'emoticona només persistix en local i al sandbox: en remot cal la columna i el contracte (D2).
- T23.1 és una interpretació (D3) després d'una primera lectura equivocada que el Mestre ha corregit (T30).
- «IA activa» = nivell ≥ 2 del Selector de Realitat (D7): és l'únic estat que existix.
- T25 s'ha implementat i retirat: cap regla en queda, però ha costat dues iteracions perquè el pla ha canviat tres vegades mentre s'executava.
- `@container` queda fora de Chrome 100 i Firefox 100; la `@media` de 480 px fa de xarxa amb 16 px de sobreeiximent a 320 px en eixos navegadors.
- El hook local només deixa passar lectures elementals amb argv literal (sense `\`, `*`, `|`, `&&`), `npx vitest run <rutes>`, `node --test tests/...`, `git status --short`, `git diff --stat --no-ext-diff --no-textconv` i set ordres `node tooling/gates/...`. Ni `npm run lint` ni les portes de tokens, crom o 58 px s'han pogut executar des d'ací: només el design guard.
- L'agent «portes» del workflow du l'avís «Auto-Mode Bypass» de l'harness; la seua eixida s'ha tractat com a dades i tot s'ha comprovat al codi abans d'usar-ho.
- No s'ha escrit cap Acta Marmota: correspon al tancament de jornada (AGENTS §14). Recordatori fet al relleu.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260927_2220_pla_implementacio_claude_ui]]
- [[260927_2220_prompt_claude_ui]]
