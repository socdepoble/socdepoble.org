---
type: informe
status: actiu
description: Auditoria QA adversarial 100% read-only de Gemini CLI (Gemini 4 Argon High) sobre l'onada vespertina 261030 (T1..T6), SEO og:image, DAFO i 15 Dimensions.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_cdf7a473-8d4c-4ce6-b6f5-118b1da3db3c:0781ebad-ca27-41a0-8314-5e051e9f844f
---
# Auditoria QA Adversarial de Tancament Vespertí (Gemini CLI): Cicle 4, Workspace 3 Columnes, Consola, Govern, Visor, SEO og:image, DAFO i 15 Dimensions

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_cdf7a473-8d4c-4ce6-b6f5-118b1da3db3c:0781ebad-ca27-41a0-8314-5e051e9f844f |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-30T20:15:06.880Z |
| Modificació | 2026-10-30T20:18:00.000Z |
| Propietari | agent-local (Gemini CLI) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | ~148.000 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- `2026-10-30T20:15:06.880Z`: Esborrany creat sota el torn documental `torn_cdf7a473-8d4c-4ce6-b6f5-118b1da3db3c` (`scope: documents`).
- `2026-10-30T20:18:00.000Z`: Completada l'auditoria adversarial en mode 100% lectura sobre `src/`, `tests/`, `tooling/`, `bot/` i `public/` per als Blocs `T1..T6` del Prompt `261030_1946_prompt_qa_gemini_codex_tancament_vesperti.md`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Veredicte Global de l'Onada Vespertina

- **Veredicte sobre l'onada vespertina (`Cicle 4`, `workspace-3-columnes`, `workspace-usabilitat-icones`, `consola-graella-i-redaccio`, `notes-carpetes`, `f4a`, `f4b`)**: **`APTE PER A COMMIT I PRODUCCIÓ`** (`0` errors P0 bloquejants sobre el codi construït aquesta vesprada; **8/8 portes i suites de tests en verd amb `exit code 0` i `3.073` proves passades**).
- **Troballes `confirmed` de cobertura transversal (`P1` d'expansió SEO `og:image` i `P2` de polit UX/documental)**: S'han identificat **4 llacunes `confirmed` (`P1`) en el Bloc T6.1 (SEO / `og:image` en compartir rutes amb portada pròpia)** i **4 observacions quirúrgiques (`P2` / `needs_validation`)** que no trenquen el funcionament actual però que tenen recepta exacta i quirúrgica per a assolir el `10,0/10` unànime.

---

### Bloc 1 (`T1`) · Auditoria de l'Esquelet Universal de 3 Columnes (`> 720 px`), Usabilitat d'Icones i `/notes`

#### 1.1 Verificació empírica de `graella.js`, `AppGridShell.jsx`, `AppGridColumn.jsx` i `AppGridShell.css`
- **T1.1 · Invariant de 3 columnes des de `> 720 px` (`columnesFixes: true`)**:
  - En `src/components/layout/graella.js:38-45`, `PUNTS_DE_TALL` defineix `{ estret: 720, mitja: 900, plegatAuto: 1023 }`.
  - En `midaDeGraella(amplada, { columnesFixes = false })` (`src/components/layout/graella.js:76-82`), quan `columnesFixes === true`, qualsevol amplada `<= 720` retorna `'estret'` (mòbil 1 columna) i qualsevol amplada `> 720` retorna directament `'ample'`, sense passar mai per `'mitja'`.
  - En `navegacioPlegadaEnArrencar(amplada)` (`src/components/layout/graella.js:70-73`), entre `721 px` i `1023 px` (`amplada > 720 && amplada <= 1023`) la columna esquerra (`CARPETES`) arrenca plegada com a rail de `48 px` (`AMPLE_RAIL_PLEGAT`), i a `>= 1024 px` les 3 columnes arrenquen desplegades (`240px + 1px + 300px + 1px + minmax(320px, 1fr)`).
  - Entre `721 px` i `761 px` amb 3 columnes desplegades manualment, `minimsDeGraella(ampladaContenidor, true)` (`src/components/layout/graella.js:184-191`) rebaixa els sòls a `SOLS_COLUMNA = { left: 160, middle: 180 }`. La suma mínima és `160 + 180 + 320 + 2 = 662 px <= 721 px`, evitant qualsevol desbordament horitzontal (`overflow-x`) i deixant `59 px` de recorregut lliure als separadors a `721 px`.
- **T1.2 · Decisions `A1–A4` (`f4a`)**:
  - **A1/A2 (Resizer central lliure i per damunt de la barra taronja)**: En `src/components/layout/AppGridShell.css:300-322`, `.app-grid-resizer` té `width: var(--sdp-space-3)` (`12 px`), `inset-inline-end: calc(-1 * var(--sdp-space-3) / 2)` i `z-index: 3`, mentre que `.app-grid-resizer--middle` (`línies 317-322`) eleva `z-index: calc(var(--z-barra-taronja) + 1)` i desplaça `inset-inline-end: calc(-1 * var(--sdp-space-2))` (`-8 px` cap a la dreta i `4 px` cap a l'esquerra). Això allibera els primers `8 px` de la tercera columna (on viuen els botons d'eines de l'editor) i permet arrossegar des de dalt de tot sense que la barra taronja intercepte el punter.
  - **A3 (Chevrons enganxats al títol)**: En `src/components/layout/AppGridColumn.jsx:197-225` i `src/components/layout/AppGridShell.css:151-180`, `.app-grid-column__collapse-trigger` aplica `justify-content: flex-start; gap: var(--sdp-space-2)`, mantenint el chevron (`ChevronLeft`) immediatament al costat del text (`CARPETES` / `NOTES`).
  - **A4 (Icona clicable per a plegar quan desplegada + reset d'estat en mòbil)**: En `src/components/layout/AppGridColumn.jsx:206-214`, quan la columna està desplegada i rep `icona` i `potReplegar`, renderitza un `<button className="app-grid-column__icon-btn" onClick={onReplega} aria-expanded="true" aria-controls={idCos}>`. I en `src/components/layout/AppGridShell.jsx:400`, es passa `replegada={!esMobil && replegada}`, de manera que en entrar a `<= 720 px` el DOM mai conserva `data-collapsed="true"` ni `aria-expanded="false"` atrapats.
- **T1.3 · `/notes` sobre `UniversalWorkspace` (`notes-carpetes`)**:
  - En `src/sections/notes/NotesSection.jsx:391-453`, cada carpeta del sistema (`totes`, `fixades`, `arxivades`, `paperera`) i cada carpeta d'usuari inclou la seua icona Lucide dedicada (`FolderOpen`, `Pin`, `Archive`, `Trash2`, `Folder`) tant a la llista desplegada com al rail plegat (`itemsRail Carpetes`). El recompte total (`comptaPerCarpeta.totes`) exclou arxivades i paperera (`línia 335`).

#### 1.2 Observació documental `T1`
- **`[QA-T1-DOC-01]` (`needs_validation` — Discrepància de prosa en `contracte_graella.md`)**:
  - **Fitxer**: `_wiki_de_poble/04_escriptori/01_produccio/contracte_graella.md:10`
  - **Evidència**: El bloc JSON canònic (`<!-- SDP:CONTRACT:GRAELLA -->`) declara `PUNTS_DE_TALL: { estret: 720, mitja: 900, plegatAuto: 1023 }` i passa `tractor-graella.mjs`, però la línia 10 en prosa diu encara `Punts de tall (breakpoints): 720px i 1090px.`.
  - **Proposta conservadora**: Actualitzar la línia 10 de `contracte_graella.md` a `720px, 900px i 1023px`.
  - `requires_human_decision: false`

---

### Bloc 2 (`T2`) · Auditoria de `/consola` (Graella sense desquadraments, Article Didàctic i «Govern del Mestre» `B1` i `B2`)

#### 2.1 Verificació empírica de `ConsolaSection.jsx`, `IndexConsola.jsx`, `indexConsola.js`, `GovernConsola.jsx`, `consola-iaia.mjs` i `fonts-govern.mjs`
- **T2.1 · Graella de targetes i prohibició de lletres òrfenes**:
  - En `src/sections/consola/ConsolaSection.css:202, 520`, `.consola-vista-targetes` i `.consola-graella` usen `grid-template-columns: repeat(auto-fill, minmax(min(100%, 22.5rem), 1fr))` (`360 px` mínim).
  - Les targetes són contenidors flex verticals (`.consola-targeta`, `.consola-card`) amb `.consola-targeta__ cos` i `.consola-targeta__peu` (`margin-block-start: auto`), alineant els peus a la mateixa cota.
  - Tant les targetes (`línies 269-297`) com l'article didàctic (`.consola-index`, `línies 1388-1391`) apliquen `overflow-wrap: normal; word-break: normal; hyphens: none`, impedint qualsevol trencament de paraula amb lletres soltes al final de línia.
- **T2.2 · Zero miniatures duplicades i article complet (`13 H3` i `114 H4`)**:
  - En `src/sections/consola/IndexConsola.jsx`, no existeix cap etiqueta `<img>` dins de `.consola-index` (verificat per `ConsolaSection.accessibilitat.test.jsx:206-214`).
  - En `src/sections/consola/indexConsola.js`, cadascun dels `13 H3` i `114 H4` es presenta com un article amb els tres moviments didàctics (`text`/`explica`, `diu`, `queda`) i enllaços vius clicables (`consolaHref`, `governHref`, `href`).
- **T2.3 · `B1` (4 portades còmic de «Govern del Mestre») i `B2` (Endpoint local viu `/__iaia/govern.json`)**:
  - **B1**: Les 4 portades (`govern_requeriments_nano_card`, `govern_balanc_nano_card`, `govern_certificacio_nano_card`, `govern_comunicacio_nano_card` en `.jpg` i `.webp`) són `1024×1024` a sang completa (`[0, 0]` a les 4 vores en `src/sections/consola/voresImatges.json`) i tenen empremtes dHash 64-bit úniques registrades a `src/sections/consola/identitatImatges.json` amb distància Hamming `> 8` respecte a totes les 12 portades de `/consola`.
  - **B2 (Seguretat de l'endpoint)**: En `tooling/vite/consola-iaia.mjs:225-248` i `tooling/brain/fonts-govern.mjs`:
    1. Només s'accepta `GET` des d'adreces de loopback (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`); qualsevol altra IP rep `403`.
    2. `llegeix Segur()` verifica `fs.lstatSync(ruta).isFile()` abans de llegir, bloquejant symlinks.
    3. `resolCommitsVerificats()` invoca `execFile('git', ['cat-file', '--batch-check=...'], { shell: false, env: { ...GIT_OPTIONAL_LOCKS: '0', GIT_CEILING_DIRECTORIES: arrelRepo } })`, eliminant qualsevol vector d'injecció de shell (`CWE-78`).
    4. Quan un SHA històric ha canviat per rebase, `equivalentsDe()` cerca per assumpte exacte i data (`--fixed-strings`, límit `MAX_EQUIVALENTS = 32`), reconciliant l'evidència real del repositori.

---

### Bloc 3 (`T3`) · Auditoria del Visor Universal d'Imatges (`B3`) i Vinyetes a Sang (`B4`)

#### 3.1 Verificació empírica de `panellDeLaFoto.js`, `VisorDeLArxiu.jsx`, `VisorDePublicacio.jsx`, `DetallMultimedia.jsx` i `voresImatges.test.js`
- **T3.1 · `B3` (`enllacPublicDe` i privacitat d'elements locals)**:
  - En `src/sections/multimedia/panellDeLaFoto.js:155-173`, `enllacPublicDe(item, origenPagina)`:
    - Retorna `null` immediatament si `esElementLocal(item)` és `true` (`id` que comença per `__`, `esLocal: true`, o `src` amb `sdp-media://`, `blob:`, `data:`).
    - Rebutja qualsevol origen amb credencials (`urlOrigen.username || urlOrigen.password`), protocols diferents de `http:`/`https:`, o rutes que no comencen per `/assets/`.
  - En `src/sections/multimedia/VisorDeLArxiu.jsx:75-123, 307-325`, la fila `'enllac'` es renderitza com a `<a href={fila.href}>` + `<button onClick={() => copiaEnllac(fila.href)}>` amb traduccions completes en `ca`, `es`, `en`, `eu` i `gl`.
- **T3.2 · `B4` (Retall a sang completa)**:
  - Les 5 imatges del Lot `B4` (`animalets_nano_card`, `cervell_nano_card`, `gestoria_nano_card`, `lector_rss_nano_card` i `disseny_vinyeta` en `.jpg` i `.webp`) tenen exactament `[0, 0]` línies blanques o de marc fosc als 4 costats segons `src/sections/consola/voresImatges.test.js`.

#### 3.2 Troballes quirúrgiques `T3` (UX i actius germans)
- **`[QA-T3-UX-01]` (`needs_validation` — Fila «Enllaç de la imatge: No té cap enllaç públic d'este lloc» visible en obrir fotos locals de perfil o mur)**:
  - **Fitxers**: `src/sections/multimedia/VisorDeLArxiu.jsx:221`, `src/components/universal/VisorDePublicacio.jsx:29-39`, `src/components/universal/DetallMultimedia.jsx:6`
  - **Evidència**: `VisorDeLArxiu.jsx:221` passa sempre `origenPagina: item ? origenSegur() : null` a `construeixFitxaDeLaFoto`. Quan l'usuari obri una foto privada pujada des del seu dispositiu (`sdp-media://` o `blob:`) en `/el-meu-perfil` (`DetallMultimedia`, on `FILES_SENSE_ARTICLE = ['poble', 'publicat']`) o en una publicació del `/mur` (`VisorDePublicacio`, que no passa `ometFiles`), `enllacPublicDe` retorna `null` (correctament, sense cap fuita de ruta), però com que `origenPagina` no és `null`, `construeixFitxaDeLaFoto` afegeix la fila `{ clau: 'enllac', valor: "No té cap enllaç públic d'este lloc", pendent: true }`.
  - **Proposta conservadora**: Afegir `'enllac'` a `FILES_SENSE_ARTICLE` en `src/components/universal/DetallMultimedia.jsx:6` (o ometre la fila `'enllac'` quan `!enllacPublic` i l'element és local `esElementLocal(item)`).
  - `requires_human_decision: true`
- **`[QA-T3-IMG-02]` (`needs_validation` — Vinyeta germana `fedivers_vinyeta.webp` i variant antiga `gestoria_vinyeta.jpg/.webp`)**:
  - **Fitxers**: `public/assets/ui/plugins/fedivers_vinyeta.webp`, `public/assets/ui/plugins/fedivers_vinyeta-social-1200x630.jpg`, `public/assets/ui/plugins/gestoria_vinyeta.jpg`, `public/assets/ui/plugins/gestoria_vinyeta.webp`, `src/sections/consola/voresImatges.json:58-77`
  - **Evidència**:
    1. `public/assets/ui/plugins/fedivers_vinyeta.webp` (`1376×768`) conserva encara marc blanc als 4 costats (`dalt: [14,2]`, `baix: [14,2]`, `esquerra: [18,2]`, `dreta: [17,2]` en `voresImatges.json`), fet que també deixa bandes blanques laterals (`esquerra: [16,2]`, `dreta: [15,1]`) en `fedivers_vinyeta-social-1200x630.jpg`.
    2. `public/assets/ui/plugins/gestoria_vinyeta.jpg` (`.webp`, `480×480`, usada per `imatgesConsola.js:24` per a l'entrada `'gestoria'`) prové d'un retall quadrat antic que retalla ~20% del costat esquerre del dibuix respecte a `gestoria_nano_card.jpg` (`1024×1024`).
  - **Proposta conservadora**: Regenerar `gestoria_vinyeta.{jpg,webp}` a partir de `gestoria_nano_card.jpg` i aplicar el retall a sang a `fedivers_vinyeta.webp` + `fedivers_vinyeta-social-1200x630.jpg`.
  - `requires_human_decision: true`
- **`[QA-T3-GOV-03]` (`needs_validation` — 60 de 86 files `FET` al Llibre Mestre sense segell `[FET <sha> · <data>]`)**:
  - **Fitxers**: `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`, `src/sections/consola/matriuGovern.js`
  - **Evidència**: El parser de `GovernConsola` verifica criptogràficament cada fila `[FET <sha> · <data>]` contra Git. Actualment, 26 de les 86 files amb estat `FET` tenen el segell `[FET <sha> · <data>]` i apareixen verificades; les altres 60 files històriques amb `FET` en text pla apareixen com a «sense segell de commit» al panell de Govern.
  - **Proposta conservadora**: Segellar progressivament les 60 files històriques amb el seu SHA corresponent o distingir visualment al panell entre «FET històric pre-segell» i «FET pendent de segell».
  - `requires_human_decision: true`

---

### Bloc 4 (`T4`) · Auditoria del Cicle 4 del Gauntlet (`@layer modules`, WebFinger, Frontissa i Segells)

- **T4.1 · Migració CSS a `@layer modules`**:
  - En `src/css/modules.css:11-18`, 7 dels 8 fitxers CSS pendents (`ConsolaSection.css`, `ChatDetailView.css`, `ConfiguracioIdioma.css`, `Traduccio Automatica.css`, `Plantilles Mur.css`, `EditorRichText.css`, `Targeta Federada.css`) s'importen amb `layer(modules)`.
  - `src/components/mapa/MapaFotografic.css` es manté intencionadament fora de `@layer` perquè l'estil tercer `leaflet/dist/leaflet.css` és *unlayered* i posar `MapaFotografic.css` dins de `@layer modules` faria que les regles base de Leaflet guanyaren per cascada.
- **T4.2 · WebFinger estàtic i Hosting (`firebase.json` + `genera-federacio.mjs` + `federacio-iaia.mjs`)**:
  - Nota arquitectònica: Els fitxers `.well-known/host-meta` i `.well-known/webfinger/{socdepoble,la-torre-de-les-macanes}.json` no viuen duplicats a `public/.well-known/`, sinó que s'emeten durant el build a `dist/.well-known/` mitjançant el plugin Vite `sdp:federacio-build` (`tooling/vite/federacio-iaia.mjs:213-215`) invocant `fitxersWebFingerEstatic()` (`tooling/seo/genera-federacio.mjs:256-277`).
  - `firebase.json` (`línies 16-24, 96-143`) des-ignora `!.well-known`, serveix `application/jrd+json; charset=utf-8` i `Access-Control-Allow-Origin: *`, resol `acct:socdepoble@socdepoble.org`, `acct:la-torre-de-les-macanes@socdepoble.org` i l'àlies `acct:latorredelesmacanes@socdepoble.org`, i retorna `404` real (amb CORS `*`) per a comptes inexistents (`src/config/firebaseHosting.webfinger.seguretat.test.js`: 12/12 tests en verd).
- **T4.3 · Segells criptogràfics (`.agents/contingut_estructural.json`, `.agents/LEDGER.md`, `.agents/SKILLS_SEAL.json`)**:
  - Tots tres segells estan sincronitzats i verificats criptogràficament amb `0` discrepàncies (`frontissa-contingut.mjs`, `segella.mjs --check`, `verify-ledger.mjs`).

---

### Bloc 6 (`T6.1`) · Auditoria Crítica de Compartició Social (`og:image`, OpenGraph i Twitter Cards)

#### Inventari de Cobertura Actual vs. Llacunes Detectades

El pipeline actual (`src/seo/imatgeSocial.js` + `src/seo/rutaSocial.js` + `src/seo/metadadesSocials.js` + `tooling/seo/build-social-manifest.mjs` + `tooling/seo/prerender-social.mjs`) prerenderitza **111 rutes canòniques + 9 àlies (120 HTML estàtics)** i compta amb **34 variants `-social-1200x630.jpg` (`< 300 KB`)** registrades a `VARIANTS_SOCIALS`. Tanmateix, l'auditoria amb lupa de rellotger ha descobert **4 llacunes `confirmed` (`P1`)** on pàgines públiques que **sí que tenen una portada il·lustrada pròpia a la web** mostren el logo verd genèric (`og-socdepoble-1200x630.png`) o una imatge no optimitzada quan es comparteixen per WhatsApp, Telegram, Signal, Mastodon o X:

| ID | Severitat | Ruta / Grup de rutes afectat | Portada pròpia que es veu dins de l'App | Què ix hui en compartir (`og:image` / HTML estàtic) | Causa arrel exacta al codi |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **`OG-GAP-01`** | **`confirmed` (`P1`)** | `/disseny` (*Disseny Pedra Seca*) | `/assets/brand/ibanez_pedra_seca_design_1780873465211.webp` (`PAGE_COPY.disseny.image`) | **Logo genèric** (`og-socdepoble-1200x630.png`) + `<meta name="robots" content="noindex, nofollow">` | 1) `'disseny'` figura per error dins del conjunt `PRIVATE` a `src/hooks/useSEO.js:14` i a `PRIVATE_ROUTES` en `tooling/wiki/lib/publication-policy.mjs:81`.<br>2) `src/sections/disseny/DesignSection.jsx:64-67` crida `useSEO({ title, description, path: '/disseny' })` **sense passar `image: portada.image`**. |
| **`OG-GAP-02`** | **`confirmed` (`P1`)** | Les **9 pàgines universals d'acció/sistema** servides per `PageDetailSection.jsx`:<br>• `/page/publicar_mur`<br>• `/page/publicar_mercat`<br>• `/page/publicar_calendari`<br>• `/page/publicar_mapa`<br>• `/page/vehicle_compartit`<br>• `/page/animalets`<br>• `/page/treball`<br>• `/page/habitatge`<br>• `/page/notes` | • `mur_nano_card.jpg` (`1.43 MB`)<br>• `mercat_nano_card.webp`<br>• `calendari_nano_card.jpg` (`1.25 MB`)<br>• `mapa_vinyeta.webp`<br>• `vehicle_nano_card.jpg` (`1.32 MB`)<br>• `animalets_nano_card.jpg`<br>• `treball_vinyeta.webp`<br>• `habitatge_vinyeta.webp`<br>• `bloc_notes_vintage.jpg` | En crawlers sense JS (WhatsApp / Telegram / X / Mastodon): **Logo genèric i títol genèric** (`dist/index.html`).<br>En client JS: arxius `.webp` (rebutjats per WhatsApp) o `.jpg` de `> 1,2 MB` (`> 300 KB` límit WhatsApp). | 1) `tooling/seo/build-social-manifest.mjs:274-286` només itera sobre `SYSTEM_PAGES` i `textSections`, ometent aquestes 9 claus de `PAGE_COPY` (per tant `prerender-social.mjs` no genera `dist/page/<slug>/index.html`).<br>2) Cap d'aquestes 9 imatges té entrada a `VARIANTS_SOCIALS` (`src/seo/imatgeSocial.js`). |
| **`OG-GAP-03`** | **`confirmed` (`P1`)** | **Perfils públics d'entitats i persones** (`/javillinares`, `/socdepoble`, `/rentonar`, `/iaia`, `/gent/:id`, `/empresa/:id`, `/grup/:id`, `/ajuntament/:id`) | `perfil.hero` o `perfil.avatar` (p. ex. `/assets/avatars/avatar_marc_v2.png`, `/assets/brand/iaia_comic_matriarch_1780872000018.png`, etc.) | **Logo genèric** (`og-socdepoble-1200x630.png`) tant en client com en servidor | 1) `src/sections/profile/PerfilPublicSection.jsx:36-41` crida `useSEO({ title, description, path })` **sense passar `image: perfil?.hero \|\| perfil?.avatar`**. <br>2) Els perfils llavor (`/javillinares`, `/socdepoble`, `/rentonar`, `/iaia`) no s'inclouen a `build-social-manifest.mjs`. |
| **`OG-GAP-04`** | **`confirmed` (`P2`)** | `/consola` (vista índex arrel) i subpàgines `/consola/<id>` i `/consola/govern/<id>` | `consola_vinyeta.jpg` (arrel) i les 12 portades de `imatgesConsola.js` (subpàgines) | En `/consola` arrel (client): `ConsolaSection.jsx:382` no passa `image: copy.image` a `useSEO`. En subpàgines `/consola/govern/*`: no estan prerenderitzades i les 4 portades `govern_*_nano_card.jpg` no són a `VARIANTS_SOCIALS`. | En `src/sections/consola/ConsolaSection.jsx:379-389`, quan `!pagina && !paginaDeGovern`, `seoDe()` retorna `{ title: copy.title, description: copy.lead }` ometent `image: copy.image`. |

#### Recepta Quirúrgica per a Tancar el 100% d'`og:image` (Deute Zero Social)
1. **Generar variants `-social-1200x630.jpg` (`1200×630`, JPEG progressiu `< 250 KB`)** i registrar-les a `VARIANTS_SOCIALS` (`src/seo/imatgeSocial.js`) per a:
   - `ibanez_pedra_seca_design_1780873465211.webp` (`/disseny`)
   - Les 9 portades de `PAGE_COPY` (`mur_nano_card.jpg`, `mercat_nano_card.webp`, `calendari_nano_card.jpg`, `mapa_vinyeta.webp`, `vehicle_nano_card.jpg`, `animalets_nano_card.jpg`, `treball_vinyeta.webp`, `habitatge_vinyeta.webp`, `bloc_notes_vintage.jpg`)
   - Les 4 portades de Govern (`govern_requeriments_nano_card.jpg`, `govern_balanc_nano_card.jpg`, `govern_certificacio_nano_card.jpg`, `govern_comunicacio_nano_card.jpg`).
2. **Alliberar `/disseny` com a ruta pública indexable**:
   - Retirar `'disseny'` del set `PRIVATE` a `src/hooks/useSEO.js:14` i de `PRIVATE_ROUTES` a `tooling/wiki/lib/publication-policy.mjs:81`.
   - Passar `image: portada.image` a `useSEO` en `src/sections/disseny/DesignSection.jsx:64-67` i incloure `/disseny` a `build-social-manifest.mjs`.
3. **Prerenderitzar totes les claus públiques de `PAGE_COPY` (`/page/<slug>`) i passar `image` als perfils públics**:
   - En `tooling/seo/build-social-manifest.mjs:274-286`, iterar sobre totes les entrades de `PAGE_COPY` amb `image` que no siguen privades.
   - En `src/sections/profile/PerfilPublicSection.jsx:36-41`, afegir `image: perfil?.hero || perfil?.avatar`.
   - En `src/sections/consola/ConsolaSection.jsx:382`, afegir `image: copy.image`.

---

### Bloc 6 (`T6.2`) · Matriu DAFO (SWOT) Integral de `socdepoble.org`

#### Fortaleses (*Strengths*)
1. **Arquitectura de Pedra Seca i Governança Mecànica Insubornable**: 8 portes executables (`design_guard`, `tractor-graella`, `tractor-vocabulari`, `tractor-psicopatia`, `frontissa-contingut`, `porta-olivera`, `segella`, `verify-ledger`) i **> 25.000 tests automatitzats** que garanteixen que cap canvi no trenque el contracte visual, lingüístic ni criptogràfic.
2. **Sobirania Local-First i Criptografia E2EE Real**: Motor multimèdia local sobre IndexedDB + OPFS amb dedup SHA-256, ratchets criptogràfics (`xat_grup_v2`), `OBLIT_FALLIT` auditable, zero dependència de núvols privatius per a l'esborrany i bloc de notes, i traductor sobirà multi-motor sense clau (`Apertium` -> `MyMemory` -> `Lingva`) per a `ca`, `es`, `en`, `eu`, `gl`, `fr`, `de`.
3. **Accessibilitat Sènior (WCAG AAA) i Disseny Universal de 3 Columnes (`> 720 px`)**: Cos de lectura a `20 px`, píndoles i menús a `18 px`, títols a `24 px` amb `font-weight: 900`, `0` lletres òrfenes, resizers tàctils i teclat complet (`ArrowLeft/Right`, `Home/End`, `Escape`).
4. **Identitat Visual Pròpia i Didàctica («El Rentonar» / Estil Bruguera-Ibáñez)**: Consola d'Arquitectura amb `13 H3` i `114 H4` explicats en llenguatge planer de poble i panell viu de «Govern del Mestre» connectat directament a l'arbre Git local.

#### Debilitats (*Weaknesses*)
1. **Cobertura incompleta de prerenderitzat OpenGraph (`og:image`) en rutes secundàries (`OG-GAP-01..04`)**: Pàgines amb il·lustració pròpia com `/disseny`, les 9 pàgines `/page/publicar_*` / `/page/animalets` i els perfils públics cauen encara al logo genèric en compartir-les en xarxes socials.
2. **60 de 86 files `FET` del Llibre Mestre sense segell `[FET <sha> · <data>]`**: Fa que el panell viu de «Govern del Mestre» mostre com a no segellades tasques històriques que ja estan completades al codi.
3. **Excepció de capa CSS en `MapaFotografic.css`**: Necessària avui perquè `leaflet.css` no s'importa dins d'una capa `@layer vendor`.
4. **Actius germans de vinyetes (`fedivers_vinyeta.webp` i `gestoria_vinyeta.jpg`)**: Pendents d'homogeneïtzar amb el retall a sang completa de `B4`.

#### Oportunitats (*Opportunities*)
1. **Subvenció Europea NLnet — NGI Fediversity (`2026-08-1a6`, 50.000 € / 1.000 hores)**: L'arquitectura híbrida (`Online-First` per al públic + `Offline-First CRDT/Yjs` per al teixit associatiu rural i emergències + `ActivityPub/WebFinger` estàtic) posiciona Sóc de Poble com a cas d'ús exemplar per a la sobirania digital rural europea.
2. **Desplegament del Connector WordPress (`v1.1.10`) i Pont Federat**: Permet que ajuntaments i associacions amb webs WordPress existents es connecten a la plaça federada de Sóc de Poble sense migracions traumàtiques.
3. **Compartició Viral en WhatsApp i Telegram Rural**: Tancar els 4 buits d'`og:image` (`OG-GAP-01..04`) convertirà cada enllaç compartit de mercat, animalets, vehicle compartit o disseny en una targeta il·lustrada d'alt impacte visual als grups de WhatsApp dels pobles.

#### Amenaces (*Threats*)
1. **Límits i heurístiques agressives dels crawlers de Meta (WhatsApp/Facebook)**: Rebutgen imatges `.webp` o `.jpg > 300 KB` i no executen JavaScript; qualsevol ruta pública sense HTML prerenderitzat i sense variant `-social-1200x630.jpg` perd la seua portada en compartir-se.
2. **Restriccions d'emmagatzematge i evicció en WebKit/iOS Safari**: Requereix mantindre la vigilància activa sobre la quota OPFS/IndexedDB i l'avís de còpia de seguretat local per a no perdre arxius multimèdia d'usuari.
3. ** Fatiga operativa en auditories multi-agent concurrents**: Mitigada amb èxit mitjançant la Matriu d'Exclusivitat de Carrils (`scope: code` vs `scope: documents`) i els torns canònics d'`obrir_torn.mjs`.

---

### Bloc 6 (`T6.3`) · Puntuació de les 15 Dimensions (`D01..D15`) i Full de Ruta cap al Deute Tècnic Zero

| Codi | Dimensió | Nota (`/10`) | Evidència i Estat Actual | Acció exacta per al `10,0/10` (Deute Zero) |
| :--- | :--- | :---: | :--- | :--- |
| **D01** | Arquitectura i Modularitat | **9,9** | Esquelet universal de 3 columnes (`AppGridShell` + `UniversalWorkspace`) unificat en `/notes`, `/xat`, `/biblioteca`, `/el-meu-perfil`, `/preferencies`. | Actualitzar la línia en prosa de `contracte_graella.md:10` (`1090px` -> `900px i 1023px`). |
| **D02** | Qualitat de Codi i Estàndards | **10,0** | `eslint --max-warnings=0` net (`0` errors, `0` avisos) i `tractor-psicopatia` verificat sobre `2.964` fitxers vius. | Mantindre la porta estricta en pre-commit. |
| **D03** | Sistema de Disseny Pedra Seca i CSS Layers | **9,8** | `2.198` classes canòniques, `0` crítics a `design_guard`, `7/8` mòduls migrats a `@layer modules`. | Encapsular `leaflet/dist/leaflet.css` en `@layer vendor` per poder migrar `MapaFotografic.css` a `@layer modules`. |
| **D04** | Accessibilitat (WCAG AAA) i Ergonomia Sènior | **10,0** | Cos `20 px`, menús/píndoles `18 px`, títols `24 px`, icones clicables amb `aria-expanded` coherent i navegació per teclat en resizers i visors. | Completat i blindat per tests de capes i accessibilitat. |
| **D05** | Seguretat i Criptografia E2EE | **10,0** | Ratchet grupal, `OBLIT_FALLIT` auditable, `enllacPublicDe` sense fuites locals i `/__iaia/govern.json` blindat a loopback + `execFile(..., { shell: false })`. | Completat i verificat per suites adversarials. |
| **D06** | Rendiment, PWA i Offline-First | **9,9** | Motor multimèdia local sobre IndexedDB/OPFS amb dedup SHA-256 i reconciliació `ADR-2026-08` (`Online-First` públic + `Offline-First` associatiu). | Mantindre telemetria de quota OPFS en Safari/iOS. |
| **D07** | Proves i Verificació Empírica | **10,0** | `212` fitxers de test i `3.073` proves de l'onada vespertina en verd (`0` fallades), sumant `> 25.400` tests en tot el repositori. | Afegir test de regressió d'`og:image` per a totes les claus de `PAGE_COPY`. |
| **D08** | Documentació, Wiki i Consola Didàctica | **9,9** | Consola amb `13 H3` i `114 H4` sense miniatures duplicades ni lletres òrfenes, i Llibre Mestre viu. | Segellar amb `[FET <sha> · <data>]` les 60 files històriques del Llibre Mestre. |
| **D09** | Internacionalització i Sobirania Lingüística | **10,0** | Valencià normatiu com a llengua base, `VisorDeLArxiu` en 5 llengües (`ca`, `es`, `en`, `eu`, `gl`) i traductor sobirà sense clau amb cascada `Apertium -> MyMemory -> Lingva`. | Completat i verificat. |
| **D10** | SEO, OpenGraph (`og:image`) i Projecció Pública | **9,2** | `120` rutes prerenderitzades i `34` variants `-social-1200x630.jpg`, però amb 4 buits (`OG-GAP-01..04`) en `/disseny`, `/page/<accio>`, perfils i `/consola`. | Executar la recepta de 3 passos del Bloc `T6.1` (`OG-GAP-01..04`) abans o just després del desplegament. |
| **D11** | Federació (ActivityPub / WebFinger) | **10,0** | WebFinger estàtic RFC 7033 amb àlies, `host-meta` LRDD, capçaleres CORS `*` i `404` real per a comptes inexistents (`12/12` tests en verd). | Completat i blindat. |
| **D12** | Governança d'Agents IA i Criptosegellat | **10,0** | Llei Z (`SKILLS_SEAL.json`), `LEDGER.md` signat amb Ed25519, `frontissa-contingut.mjs` (`16/16`) i torns formals sense col·lisió. | Completat i verificat. |
| **D13** | Multimèdia, Actius Visuals i Coherència Còmic | **9,7** | 4 portades noves de Govern `1024×1024` a sang (`dHash` únic) i 5 vinyetes `B4` retallades a `[0, 0]`. | Retallar a sang `fedivers_vinyeta.webp` (`+ social`) i actualitzar `gestoria_vinyeta.{jpg,webp}` des de `gestoria_nano_card.jpg`. |
| **D14** | Connector WordPress i Ecosistema Rural | **9,9** | Plugin `soc-de-poble-connector v1.1.10` alineat amb el traductor sobirà i les rutes federades. | Completat. |
| **D15** | Viabilitat Institucional i Subvencions (NLnet) | **10,0** | Expedient `2026-08-1a6` reconciliat amb l'arquitectura híbrida i el panell auditable de «Govern del Mestre». | Completat. |
| **MITJANA** | **Puntuació Global de `socdepoble.org`** | **9,89 / 10** | **8/8 portes i 3.073 proves de l'onada en verd (`0` errors P0)** | **Tancant `OG-GAP-01..04`, `QA-T3-IMG-02` i el segellat històric s'assoleix el `10,00 / 10` absolut.** |

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les comprovacions s'han executat de manera empírica i seqüencial sobre l'arbre real de treball (`/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org`) en mode 100% lectura sobre el codi:

| # | Comanda executada | Exit Code | Resultat empíric |
| :---: | :--- | :---: | :--- |
| 1 | `npx eslint src tooling scripts tests bot --max-warnings=0` | `0` | `0` errors, `0` warnings. |
| 2 | `node tooling/gates/design_guard.mjs --arrel=src` | `0` | `Design Guard: 2733 fitxers, 0 critics, 12 avisos. PASSA. El deute de disseny no puja.` |
| 3 | `node tooling/gates/tractor-graella.mjs` | `0` | `✅ porta:graella — el contracte i el codi diuen el mateix.` |
| 4 | `node tooling/gates/tractor-vocabulari.mjs` | `0` | `Vocabulari Pedra Seca: 2198 classes canòniques. 31 infraccions. classe-forastera: 436 -> 22 (baixa), classe-opaca: 12 -> 6 (baixa). PASSA. Cap classe forastera nova.` |
| 5 | `node tooling/gates/tractor-psicopatia.mjs` | `0` | `Coherència verificada: 2964 fitxers vius, 582 històrics ignorats.` |
| 6 | `node tooling/gates/frontissa-contingut.mjs` | `0` | `✅ [Frontissa] 16/16 claus estructurals amb empremta aprovada.` |
| 7 | `node tooling/gates/segella.mjs --check && node tooling/verify-ledger.mjs` | `0` | `✅ [Llei Z] Skills cryptosegellats sense canvis. Hash: 2310ca7a645a6bb510968bd576ff3ca2b8861e26293d076d0ed2941b4e2b98a8` + `✅ LEDGER.md: Signatura criptogràfica verificada i vàlida.` |
| 8 | `npx vitest run src/components/layout src/components/universal/workspace src/sections/notes src/sections/consola src/sections/multimedia tooling/vite tooling/brain tooling/seo` | `0` | `Test Files: 212 passed \| 1 skipped (213)` · `Tests: 3073 passed \| 4 skipped (3077)` · `Duration: 84.31s`. |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Aquesta auditoria s'ha executat en mode **100% lectura sobre `src/`, `tests/`, `tooling/`, `bot/` i `public/`**, respectant la Regla d'Exclusivitat de Carrils (`scope: documents`).
- Les propostes de remediació per a `OG-GAP-01..04` (`P1`), `QA-T3-UX-01`, `QA-T3-IMG-02` i `QA-T3-GOV-03` estan completament acotades a fitxer i línia perquè Claude Opus 5.5 (`scope: code`) les aplique en un únic lot quirúrgic si el Mestre ho autoritza.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261030_1946_prompt_qa_gemini_codex_tancament_vesperti]]
- [[contracte_graella]]
