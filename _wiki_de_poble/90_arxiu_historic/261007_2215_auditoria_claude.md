---
type: informe
status: esborrany
description: 'Relleu de l''Onada 3: revisio de l''historic de l''actor, decisions UX 1-4 del Mestre, paquet trossejat de WordPress i pendents menors, amb proves.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_91821449-aef8-427c-a327-1752ffc9b0ad:69df4828-b1de-4026-8496-c579de50a157
---
# Relleu de l'Onada 3: historic, decisions UX i paquet trossejat

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_91821449-aef8-427c-a327-1752ffc9b0ad:69df4828-b1de-4026-8496-c579de50a157 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-07T20:10:11.072Z |
| Modificació | 2026-10-08T03:20:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), compte del Rentonar, orquestrant workflows de subagents |
| Tokens consumits | ≈ 14,4 M de subagents mesurats pels workflows: grup A 7,1 M, grup B tallat per quota 1,4 M, represa del grup B 4,0 M i passada de tancament 1,9 M. No inclou el coordinador. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-07T20:10:11.072Z: esborrany creat; contingut i verificació pendents.

2026-10-07T20:10Z · Torn `torn_91821449` obert (abast code). Llegits sencers l'informe 261007_1715 («Límits»), els RELLEU_00 a 03 de la sessió anterior, les decisions 261007_1845 (confirmades pel Mestre), el pla i el prompt 261007_2205 i l'acta 261007_1645. Recuperats dels diaris de la sessió anterior l'informe de l'implementador de l'històric i els menors sense aplicar de l'onada 3b. Canal viu a `02_investigacio_ia/261007_2215_auditoria_claude/` (RELLEU_00 a RELLEU_07).

2026-10-07T20:20–22:05Z · Grup A (`wf_b1647776-765`, 23 agents): revisió de l'històric de l'actor i decisions 1, 2, 3 i 5. Cada peça té dos revisors adversarials amb lents diferents, una correcció i una reverificació si hi havia bloquejants.

2026-10-07T22:09–22:28Z · Grup B (`wf_a4437ae0-257`) tallat pel límit de sessió del compte. Només va acabar la peça de pendents menors. La represa per memòria cau no va funcionar i la vaig aturar abans que editara res.

2026-10-08T00:35–01:55Z · Represa del grup B (`wf_2ff6115b-d8f`, 15 agents): decisió 4, decisió 3 al detall, revisió dels menors, verificació final, revisió de seguretat del xat i crític de completesa.

2026-10-08T02:05–02:50Z · Passada de tancament (`wf_d39dad58-23e`, 10 agents): els oblits dins de l'abast marcats pel crític, la reverificació independent de dues correccions i la suite sencera. Després, comprovació al navegador en una pestanya de fons i este informe. Res commitejat.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Mètode i entorn

- El hook local només admet lectures elementals, `npx vitest run`, `node --test tests/…` i unes quantes portes de lectura. No admet `npm run lint`, `npm run build:wp` ni `Monitor`. No l'he sortejat.
- El build real del paquet s'ha compilat dins de `tests/standalone-build.test.mjs` cap a un directori temporal, mai a `wordpress-plugin/dist`.
- ESLint només es comprova a través dels censos de les portes `qualitat*.test.js`.
- Cap fitxer de `.agents/`, `tooling/`, `supabase/` aplicat ni `01_produccio/` tocat.

### A. Històric de l'actor sota l'editor (esmena 2) · REVISAT I CORREGIT

- **Bloquejant corregit:** el Foraster veia l'històric. Sense sessió, l'actor és el convidat, amb id i `rol: 'convidat'`, i les proves simulaven `actor: null`. Ara hi ha una regla única (`potVeureHistoric` / `useVeuHistoric`) que fan servir NotesEditor i PublicacioDetall.
- **Bloquejant corregit:** les 9 claus `section.notes.historic.*` no eren al diccionari. Ara són a les cinc llengües, amb prova de reserves. El basc i el gallec són una proposta.
- El càlcul de dades també queda dins del `SlotErrorBoundary`.
- El contracte de PageFrame al catàleg (EspecimenPage) documenta `peuDePagina`.

### B. Decisió 1 · Bombolles del xat · FETA

- `XatContext` separa la clau de dades (`ambitEstable`: backend, persona i actor) de la d'operació (amb `generacio`). Una renovació del JWT no buida fils, missatges, paginació, bombolles, visitants ni `filActiu`. Llança les peticions de nou amb el testimoni nou.
- Un enviament tallat per la renovació queda en «No s'ha enviat · Torna-ho a provar» i es reenvia amb el mateix id. `retiraConfirmats` el retira si el servidor ja el tenia.
- La key de XatWorkspace i la del padró de la cerca global (`useCercaGlobal`) són ara `ambitEstable`.
- Un canvi de persona, actor o backend continua purgant-ho tot (ARQ-H01).
- Mecanisme de «llinatge»: les accions guardades abans d'una renovació deleguen en la versió vigent. Una revisió adversarial de seguretat el va aprovar sense cap fuita entre identitats. La passada de tancament va tancar la finestra latent entre l'`await` i l'acció i hi va afegir sis proves amb mutació.

### C. Decisió 2 · Renovació silenciosa · FETA

- `useScopedResource` separa aïllament i frescor. Amb una renovació o un refresh conserva el payload en `'ready'`, marca `revalidant` i exposa `errorRevalidacio`. Core, Mur i Multimèdia ja no posen `generacio` a la clau. Ho vigila una porta AST.
- **Bloquejant corregit:** amb una revalidació fallida, l'indicador de connexió quedava en verd. Ara diu «Sense connexió» sense buidar el contingut (regla T7).
- Publicar des de Notes ja no s'avorta per una simple renovació.

### D. Decisió 3 · Imatges externes prohibides · FETA AL CLIENT; MIGRACIÓ SENSE APLICAR

- Mode estricte nou (`esFontImatgePropia` / `fontImatgePropia`). Admet el mateix origen, els orígens propis registrats (el Storage i l'origen del paquet), `data:image` ràster, `sdp-media://` i els camins propis, també a l'app nativa. Exclou els orígens OAuth.
- S'aplica a TargetaDelMur, EventCard, TargetaDelMercat, la portada, el logotip i l'avatar del detall, el carrusel, les variacions, `og:image`, el lector del MAS i el cos HTML del Mur (`sanitizeHtml(…, { imatgesPropies: true })`, també la instantània `data-imatge`). Pobles i Multimèdia queden igual.
- **Bloquejant corregit (verificació final):** la guarda de les variacions trencava les fotos pròpies a l'app nativa (`capacitor://`). Ara exclou només la referència opaca `sdp-media:`.
- Migració nova `supabase/migrations/2610072230_mur_imatges_propies.sql`, **NO aplicada**. És un trigger amb `WHEN section_id in ('mur','mercat','events')` que buida els camps d'imatge de fora. Necessita la fila `private.ajustos('origens_mitjans_propis')`.
- Canvi visible autoritzat: els avatars de Google, Facebook i GitHub deixen de vore's al Mur i al detall, i ix la silueta. Les imatges de fora ja no es pinten.

### E. Decisió 4 · Carregar-ne més · FETA

- Capacitat opcional `paginacioSeccions` (`loadSeccioPage`), calcada de `paginacioNotes`. El cursor és opac (`created_at`, `id`) amb empats i codificació PostgREST, i `loadMur` porta un camp additiu `paginacio`. Kit de conformitat amb un recorregut remot de 53 files.
- `MurContext` exposa `carregaMes`, `hiHaMes`, `carregantMes` i `errorMes`. Un canvi d'aïllament buida les pàgines extres; una revalidació les conserva.
- Botó Pedra Seca a `/mur` i `/mercat` amb la clau ja existent `section.mur.loadMore` («Mostra més»). Sense capacitat o sense més pàgines, el DOM és idèntic.
- ADR nova `02_saber/architecture/ADR-2026-11-PAGINACIO-SECCIONS.md`, en esborrany i pendent de signatura, ancorada a `00_index_maquina.md`.

### F. Decisió 5 · Paquet trossejat · FETA, SENSE PROVA A WORDPRESS

- `soc-de-poble.standalone.js` és ara un carregador clàssic de 3.378 B: captura `currentScript`, deixa un `window.SocDePoble` provisional amb cua i importa l'entrada ESM. Pinta un bloc de fallada honest, també en elements creats després.
- Build real: el monolític fa 4.458.513 B i l'entrada trossejada 1.578.810 B (gzip 436 KB, el 35,4 %), amb 260 trossos. TipTap, ProseMirror, la Wiki i la Consola ja no són a l'entrada.
- Interruptor `SDP_PAQUET=monolitic`. La variant del directori de WordPress continua monolítica.
- `sdp-release.json` porta la clau `formatDelPaquet`. La Salut del lloc comprova que els trossos hi són sencers i l'empaquetador els inclou.

### G. Pendents menors (Límits §5) i onada 3b · FETS

- `mapejadorSeccions`: `map(netejaText)` passava l'índex com a màxim i corrompia les variacions i les etiquetes. Ara les variacions es netegen camp a camp.
- Helpers `camiDe`, `esMarcaDeLEntitat` i `esAvatarSegur` unificades a `UniversalUtils.js`.
- Comentaris del carrusel i de la Bàscula al dia. Títol de la prova del full de ruta (40 llavors). Cites d'ordre (B).
- Comentaris del Perfil, i prova del membre de l'entitat pilot.
- Comentaris del paquet (host.js, assetResolver.js, contracteAmfitrio.js, que inclou el missatge de diagnosi). Banc manual `enxufe-responsive.html`.
- `VERSIO_CATALEG` al dia.
- Porta ESLint nova del xat, i onze fitxers més afegits a censos existents.

### H. Preguntes per al Mestre (valor per defecte aplicat)

1. **IdentitatContext (no tocat, front nou):** si la recàrrega de pertinences falla en una renovació, l'actor passa d'entitat a persona i es purga tot. Les decisions 1 i 2 queden incompletes per a qui actua com a entitat. Proposta: conservar les pertinences anteriors i mostrar l'error.
2. **Text del botó:** «Mostra més» (la clau que ja existia) o «Carregar-ne més», com vas escriure? És una línia d'i18n. Altres preguntes: el botó a `/calendari`, a l'històric de l'actor, i el text «Treballant…» mentre carrega.
3. **Decisió 1:** que l'enviament tallat es reenvie sol, i un text propi per a la bombolla interrompuda.
4. **Decisió 3:**
   - el substitut de l'avatar rebutjat;
   - «forçar la pujada» de la foto de Google al nostre Storage;
   - si Pobles, Multimèdia i els cossos que no són del Mur també hi entren;
   - quins orígens són propis (el matís del CDN compartit);
   - netejar les files existents;
   - la portada quan la primera foto és de fora.
5. **Decisió 5:**
   - SRI només del carregador;
   - CORS i redireccions;
   - SocDePobleCua només abans del paquet;
   - els trossos orfes;
   - una segona onada de lazy loading (`index.css` 369 KB, `i18n.js` 244 KB, dos SVG en base64 277 KB i `pageContent.js` 106 KB).
6. **Històric:** el text de la regió, totes les publicacions o les N darreres, les pàgines de sistema, Multimèdia.
7. **F15 de l'informe 1715:** esborrar `MapaConsola.jsx.tmp`, `config.js.bak`, `src/config/app.js`, el SVG sense importadors i `notesContent.js`.

### I. Retroalimentació de la plantilla prompt_local

- El pla 2205 duia el Registre amb «Claude 3.5 Sonnet» i 0 tokens: la plantilla hauria de deixar estos camps a l'agent que fa el torn.
- Un relleu entre comptes hauria de portar els identificadors dels workflows i els fitxers de resultats (diaris), no només l'informe. Ací es van poder recuperar perquè la carpeta temporal encara hi era.
- Convé que el prompt diga explícitament si el document d'informe és de l'agent: dos agents van creure que este informe era de MarIA.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **`npx vitest run src` sencer** (passada de tancament): 852 fitxers passats i 1 omés, 14.210 proves passades i 8 omeses, **0 fallades**.
- **Proves node:** `standalone-build` amb el build real i `node-suite-policy` (40/40). La bateria del connector `enxufe-*`, `conformitat-amfitrio`, `dist-secrets`, `lint_enxufe` i `tractor-enxufe` donava 111 passades i 0 fallades a la verificació del grup B.
- **Portes:** `tractor-rls` 0 · `tractor-enxufe` 0 · `porta-olivera --informe` 0.
- **`design_guard` ix amb 1:** 7 identitats HERETADES, en fitxers commitejats fora del diff. La de qualitat.publicacionsActor.test.js, que era d'este torn, ja està corregida.
- **Rojos heretats de governança:** 7 a `tests/laboratori-higiene-261006` i `laboratori-olivera-261006`. Comparen `.agents/` i `tooling/` amb HEAD.
- **Navegador** (pestanya de fons, `localhost:3340`, seed): `/mur`, `/mercat`, `/mercat/samarreta-socdepoble` (carrusel de 8 fotos pròpies i `og:image` pròpia), `/xat` i `/notes` arrenquen sense cap error de consola.
- **Revisió adversarial:** totes les peces la tenen; les correccions amb bloquejants, a més, una reverificació independent. Les proves noves s'han comprovat amb mutació quan l'informe ho diu.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

### Per al Mestre

- Executar `npm run build:wp` (abans, esborra `wordpress-plugin/dist/trossos/` si existix), `npm run build:wp:directori` i `npm run lint`.
- Provar el paquet trossejat a WordPress Studio:
  - la pestanya Xarxa i les rutes mandroses;
  - la Salut, CORS i un amfitrió posterior;
  - l'FCP comparat amb `SDP_PAQUET=monolitic`.
- El banc `?compilat` s'obri des d'un servidor estàtic, no des del 3340.
- Aplicar la migració `2610072230_mur_imatges_propies.sql` i inserir la fila `origens_mitjans_propis`.
- Proves a mà en remot:
  - una renovació real del JWT (bombolles, Mur sense «Carregant»);
  - «Mostra més» amb més de 50 publicacions;
  - el xat per defecte i el Perfil;
  - Notes > Mercat;
  - /cerca sense sessió.
- Commits atòmics per peça (Límits §2 de l'informe 1715). Res no està commitejat.

### Per a MarIA (governança, fora del meu abast d'escriptura)

- `.agents/ESTAT.md`, LEDGER i `tancament.mjs --check/--close` per a este torn.
- LLEI 1 i LLEI 5 d'`estandard_integracio_react.md`, i propagar l'ADR-2026-11. `wikiManifest.js` l'ha regenerat el hook i s'ha de versionar.
- La skill `sdp-universal-editor` (ranura damunt de l'H1).
- `tooling/`:
  - la regla E4 de tractor-enxufe per al provisional;
  - una porta de mida per a `wordpress-plugin/dist`;
  - que `design_guard` excloga `*.test.*`, o un baseline nou;
  - els laboratoris 261006.
- `261007_1845_decisions_iaia.md` dona roig a porta-documents (sense rebut).
- `context_output.json` solt a l'arrel.

### Deute que queda (no és front d'este relleu)

- Les imatges pròpies `sdp-media://` de les targetes del Mur no es resolen pel port: `resolveAsset` en fa `/sdp-media://…`. La imatge principal del Mercat i la del Mur passen per `validaUrl` i es perden. Amb la decisió 3 són justament les úniques admeses. Proposta: primera peça de la propera onada.
- Defenses estructurals del xat:
  - l'època de sessió ja existix (`entradaSessio()`), però abans cal arreglar la reinjecció de l'amfitrió;
  - `esperatUsuariId` a l'adaptador, que és un canvi de contracte amb ADR.
- `created_at` el posa el client: cal una migració a `trg_force_submission_author`.
- Les pàgines extres del Mur no es revaliden: està documentat a l'ADR-2026-11.
- La memòria persistent de Claude no s'ha pogut actualitzar: el hook bloqueja escriure fora del repositori.

### Límits del mètode

Les verificacions són proves de vitest i node i una ullada en seed. Cap dada de producció ni cap navegador dins de WordPress no s'ha vist directament.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
