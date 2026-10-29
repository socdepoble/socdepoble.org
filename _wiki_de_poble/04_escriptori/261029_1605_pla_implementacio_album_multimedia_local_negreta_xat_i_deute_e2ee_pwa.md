---
type: document
status: actiu
description: 'Pla d''implementació canònic per a Claude Opus 5.5 Ultracode: Àlbum Multimèdia Local amb persistència IndexedDB i auditoria estil Gestoria, negreta intuïtiva al xat i liquidació de deute E2EE Pas 17 i icones PWA AAA.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_3e23ae6f-f097-4ce7-8533-52978e133348:f8f474fd-9cee-4b41-94b3-cfdc4eed0e16
---
# Pla d'Implementació 261029_1605 · Àlbum Multimèdia Personal Local (IDEA-54), Negreta al Xat (IDEA-53) i Liquidació de Deute E2EE i PWA

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3e23ae6f-f097-4ce7-8533-52978e133348:f8f474fd-9cee-4b41-94b3-cfdc4eed0e16 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-29T15:05:11.776Z |
| Modificació | 2026-10-29T15:09:30.000Z |
| Propietari | iaia-maria |
| Aprovació humana | aprovada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | ~24.000 tokens |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- `2026-10-29T15:05:11.776Z`: Esborrany creat amb rebut canònic `sdp:torn_3e23ae6f-f097-4ce7-8533-52978e133348:f8f474fd-9cee-4b41-94b3-cfdc4eed0e16`.
- `2026-10-29T15:09:30.000Z`: Pla estructurat en 4 blocs per a **Claude Opus 5.5 · Extra · Ultracode** (compte El Rentonar) durant la pausa del dinar del Mestre, deixant preparat el terreny per a l'auditoria adversarial posterior de Gemini CLI i GPT Codex.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Estat de Partida (Post-Onada `261029_1305`)

1. **Carrils `G1`, `G2`, `G3`, `M1` i `E1` de l'Onada `1305` completats:**
   - **`G1` (`be5c6198`):** 14 camins de GPT Codex aplicats i segellats (`100/100` proves Node de `G1` i segell de skills verd).
   - **`G2 + G3`:** `design_guard.mjs --arrel=src` a **`0 crítics` (`PASSA`)**, `tractor-inline-styles.mjs` a `0`, `tractor-fitxa-gestor.mjs` a `0`, `tractor-cens.mjs` amb `C2=0` i `C4=0`, i `tractor-frontmatter.mjs` `F9` abaixat a `135`.
   - **`M1 + E1` (`261029_1455_auditoria_claude.md`):** 25 PNG natius al verd AAA `#0e662e`, 83 PNGs recodificats a PNG real (`R-02`), 6 variants socials `1200×630 <= 300 KB` sense APP1 (`OG-02`), connector WordPress a `1.1.10`, i pipeline E2EE Fase 4 (`xifratXatPipeline.js`, `xatMultimediaXifrat.js`, `supabase/xatXifrat.js`, cua `F7`, `OBLIT_FALLIT` `D-09`) amb **23 suites i 586 proves d'E2EE en verd**.
2. **Base d'`IDEA-54` ja creada i desacoblada de la Gestoria:**
   - S'han creat `src/sections/multimedia/motorMultimediaLocal.js`, `src/sections/multimedia/GestorMultimediaLocal.jsx` i `src/sections/multimedia/GestorMultimediaLocal.test.jsx`, integrats en la tercera pestanya (`Carpeta local`) de `src/sections/multimedia/MultimediaSection.jsx` i amb `src/sections/gestoria/privacitat.test.js` (`18/18`) en verd.
   - S'han evacuat a `_multimedia_de_poble/originals_raster_public/assets/` els 175 originals ràster (`152,70 MB`) que ja tenen bessona `.webp` en `public/assets/`.

---

### 2. Els 4 Blocs d'Execució per a `Claude Opus 5.5 · Extra · Ultracode`

#### Bloc A · `IDEA-54` + `IDEA-55`: Gestor Universal d'Arxius i Volums Locals + Àlbum Multimèdia Personal Local (`/multimedia` → `Carpeta local`) al Nivell d'Excel·lència de la Gestoria i d'Obsidian

Seguint el mateix patró d'enginyeria que `src/sections/gestoria/font/handleStore.js` i `src/sections/gestoria/tauler/ShellGestoria.jsx` (però **sense importar mai cap fitxer de `src/sections/gestoria/**`**, per respectar la frontera de `src/sections/gestoria/privacitat.test.js`, i **sense crear subcarpetes noves dins de `src/sections/multimedia/`**, per respectar `tractor-cens.mjs` `C1`):

1. **`A.1 · Biblioteca Multi-Carpeta en IndexedDB (Volums Locals Muntats) i Reconnexió d'1 Clic (`motorMultimediaLocal.js` + `GestorMultimediaLocal.jsx`)`:**
   - Implementar dins de `src/sections/multimedia/motorMultimediaLocal.js` un magatzem `IndexedDB` dedicat (`socdepoble_arxius_locals_v1`, object store `carpetes`) capaç de desar **múltiples carpetes locals muntades** (`[{ id, nom, ultimAcces, handle }]`: ex. `_multimedia_de_poble`, `_cultura_de_poble`, `_oficina_de_poble`, `_salut_de_poble`, `_menjar_i_beure_de_poble` o qualsevol carpeta de l'usuari) per clonació estructurada (`desaCarpetaLocal`, `llistaCarpetesLocalsRecordades`, `recuperaCarpetaLocal`, `oblidaCarpetaLocal`, `verificaPermisCarpetaLocal`), mantenint també els àlies de compatibilitat.
   - En muntar `GestorMultimediaLocal.jsx`:
     - Mostrar la barra de **«Volums / Carpetes Locals Recordades»** amb pastilles d'1 clic per canviar entre totes les carpetes que l'usuari haja connectat anteriorment i un botó **`[ + Vincular nova carpeta local ]`**.
     - Si la carpeta activa té `queryPermission({ mode: 'read' }) === 'granted'`, obrir-la i indexar-la automàticament sense cap clic extra.
     - Si `queryPermission({ mode: 'read' }) === 'prompt'`, mostrar el bàner d'1 clic: **«Carpeta recordada: `{nom}` · [ Reconnectar amb 1 clic ] · [ Desvincular ]»**.
2. **`A.2 · Gestor Universal d'Arxius Locals (`IDEA-55`): Visor i Editor Polimòrfic (Markdown/Text/JSON amb connexió al Bloc de Notes, Àlbum en Graella `blob:`, Àudio, Vídeo i PDF)`:**
   - Suportar tots els tipus d'arxiu d'una carpeta de treball (`imatge`, `audio`, `video`, `document`, `codi`/`dades`: `.md`, `.txt`, `.json`, `.csv`, `.yml`, `.html`, `.css`, `.js`, `.pdf`, `.vcf`, `.af`, `.xls`, `.xlsx`) i afegir el commutador de vista **«Graella d'Àlbum» / «Explorador d'Arxius (Taula)»**:
     - **Imatges (`.webp`, `.png`, `.jpg`, `.svg`, `.gif`, `.avif`):** en mode **Graella d'Àlbum**, mostrar targetes amb miniatures reals carregades des dels bytes locals (`URL.createObjectURL` amb revocació estricta i paginació de 24 elements per pàgina), etiquetes d'estat (`PUBLICADA`, `BESSONA WEBP`, `INÈDITA`, `PES ALT`, `DUPLICADA`), dimensions, EXIF/GPS i el **Laboratori de Qualitat WebP**.
     - **Markdown, Text i Codi (`.md`, `.txt`, `.json`, `.csv`, `.canvas`, `.yml`):** al panell de detall, decodificar el contingut UTF-8 (`TextDecoder`) i oferir un **Visor/Editor en Viu** amb tres accions nobles:
       1. **`[ 💾 Desar canvis al fitxer local ]`** (escriptura directa `font.escriu(ruta, bytesUtf8, { sobreescriu: true })` amb permís `readwrite`).
       2. **`[ 📝 Enviar com a Nota al Bloc de Notes ]`** (creant una nota nova a l'emmagatzematge del Bloc de Notes o copiant-la estructurada i navegant a `/notes`).
       3. **`[ ➕ Nou fitxer .md en aquesta carpeta ]`** per crear notes o arxius de text directament dins de la carpeta local.
     - **Àudio (`.mp3`, `.wav`, `.ogg`, `.m4a`, `.webm`), Vídeo (`.mp4`, `.webm`, `.mov`) i PDF (`.pdf`):** reproductor `<audio controls>`, `<video controls>` o visor `<iframe title={nom} src={blobUrl} />` integrat sense eixir de Sóc de Poble.
3. **`A.3 · Operacions Físiques Reals en Disc estil Obsidian/Finder (`readwrite`: Moure de carpeta, Reanomenar, Crear Subcarpeta, Eliminar) + Intel·ligència d'Auditoria Local:**
   - **Manipulació física real al sistema d'arxius del Mac (`motorMultimediaLocal.js` + `GestorMultimediaLocal.jsx`):** igual que en Obsidian quan mous o reanomenes una nota i canvia físicament al Finder del Mac, afegir al contracte de `fontDesDeHandle` (amb permís `readwrite`) les operacions físiques segures:
     1. **`font.mou(rutaOrigen, rutaDesti)` / `mouFitxerLocal`:** si en una carpeta d'imatges hi ha barrejat un `.txt`, `.md` o `.pdf` (o un original a `00_inbox/`), permetre moure'l físicament a una altra subcarpeta (ex. `documents_i_pdfs/` o `originals_raster_public/`) escrivint els bytes al destí, verificant la mida escrita i eliminant l'entrada d'origen amb `dirOrigen.removeEntry(nomOrigen)`.
     2. **`font.reanomena(rutaOrigen, nouNom)`:** canviar el nom del fitxer en la mateixa carpeta i esborrar el nom antic un cop verificada l'escriptura.
     3. **`font.creaCarpeta(rutaCarpeta)`:** crear una subcarpeta nova físicament al disc (`getDirectoryHandle(segment, { create: true })`).
     4. **`font.elimina(ruta)`:** esborrar un fitxer local (sempre amb confirmació explícita de l'usuari).
   - **Un sol arbre mixt real (Fototeca + Tots els arxius de cada carpeta):** en seleccionar qualsevol carpeta de l'arbre, mostrar tant les imatges com els fitxers `.txt`, `.md`, `.pdf`, `.json`, àudio o vídeo que hi haja dins d'eixa carpeta (amb targetes diferenciades en la vista de Graella/Fototeca i files clares en la vista de Taula), perquè cap `.txt` o document barrejat quede ocult.
   - **Detecció real de duplicats exactes per contingut (`SHA-256`):** afegir `calculaHashFitxerLocal(font, ruta)` amb `crypto.subtle.digest('SHA-256', bytes)` i un botó **«Verificar duplicats exactes (SHA-256)»**.
   - **Suggeriment intel·ligent de poble des d'EXIF/GPS i nom:** quan `inspeccionaImatgeLocal` extraga coordenades GPS (`exif.gps`) o nom reconeixible, suggerir el poble de la comarca i la categoria del catàleg.
   - **Laboratori de Qualitat WebP amb Desat Directe i Evacuació d'Original (`readwrite`):** afegir el botó **«Desar .webp a la carpeta local»** i l'opció **«Desar .webp i moure l'original a `originals_raster_public/`»** que escriga el `.webp`, moga l'original ràster a la subcarpeta d'originals i refresque l'inventari local al moment.

---

#### Bloc B · `IDEA-53`: Negreta Intuïtiva d'1 Toc al Xat (`*text*` i `**text**` + Botó `[ N ]`)

1. **`B.1 · Renderitzat segur de negreta (`*text*` i `**text**`) a `src/sections/xat/components/Bombolla.jsx`:**
   - A `TextAmbEnllacos` dins de `src/sections/xat/components/Bombolla.jsx`, estendre el tokenitzador de text pla (entre URLs) perquè reconega tant `**text**` (sintaxi Markdown) com `*text*` (sintaxi WhatsApp, exigint que l'asterisc d'obertura no vaja seguit d'espai i el de tancament no vaja precedit d'espai, i sense trencar números o operacions com `2 * 3 = 6`) i els renderitze com a elements React `<strong>` purs (sense `dangerouslySetInnerHTML`).
2. **`B.2 · Botó accessible `[ N ]` (`Negreta`) i drecera `Cmd/Ctrl+B` a `src/sections/xat/components/Compositor.jsx`:**
   - Afegir a la barra del `Compositor.jsx` un botó compacte i accessible amb `min-height: 44px; min-width: 44px` (`aria-label="Negreta"`, títol `"Negreta (⌘B / Ctrl+B)"`) i la drecera de teclat `Cmd+B` / `Ctrl+B` al `<textarea>`:
     - Si l'usuari té text seleccionat (`selectionStart !== selectionEnd`), embolica el fragment seleccionat amb `*...*` (o el desembolica si ja portava asteriscos) i manté la selecció i el focus al `<textarea>`.
     - Si no hi ha selecció, insereix `**` i col·loca el cursor al mig perquè tot el que escriga a continuació isca en negreta.
   - Afegir proves unitàries a `src/sections/xat/components/__tests__/` o al test de `Bombolla` / `Compositor` verificant `*negreta*`, `**negreta**`, combinació amb enllaços URL i el botó `[ N ]`.

---

#### Bloc C · Liquidació del Deute Tècnic Anotat al Llibre Mestre (E2EE Pas 17 + Icones PWA AAA)

1. **`C.1 · Connexió de l'Oblit E2EE a la Sortida de Sessió (`D-09` UI) i Pressupost LRU de `blob:` Xifrats (`src/context/SessionContext.jsx`, `src/context/XatContext.jsx`, `src/data/xatMultimediaXifrat.js`)`:**
   - Connectar el tancament de sessió (`DESPRES_DE_TANCAR` a `SessionContext.jsx` o el pont d'`host.js` / `XatContext.jsx`) amb `servei.oblidaTotXat()`, exposant l'estat `oblitFallit` (`codi === 'OBLIT_FALLIT'`) a `XatContext` sense trencar `src/config/qualitat.amfitrio.test.js` (`host.js` no pot esmentar `localStorage`/`sessionStorage`/`indexedDB` literalment).
   - Afegir al gestor d'`objectUrl` de `src/data/xatMultimediaXifrat.js` (o al registre de blobs xifrats) un pressupost LRU amb sostre de `48 MB` (màxim `100 MB`) que revoque automàticament els `blob:` més antics quan se supere el llindar, tal com estava anotat al Llibre Mestre.
2. **`C.2 · Icones PWA de `public/` al Verd Institucional AAA `#0e662e` (`D-C2 PWA`)`:**
   - Tal com Claude va anotar a `261029_1455_auditoria_claude.md §Límits` (línia 148) i al Llibre Mestre, remapar al verd institucional AAA `#0e662e` (`RGB 14, 102, 46`) els píxels del verd antic `#0F672F` (`RGB 15, 103, 47`) en les icones PWA de `public/`:
     - `public/icona-app-192.png`
     - `public/icona-app-512.png`
     - `public/apple-touch-icon.png`
     - `public/favicon.ico` / `public/favicon.svg` (si contenen `#0F672F` / `15, 103, 47`)
   - Afegir l'asserció corresponent a `src/natiu/projecteIos.test.js` (emprant sempre `` `${'#'}0e662e` `` sense coixinet literal perquè `design_guard.mjs` mantinga `0 crítics`).

---

#### Bloc D · Verificació Integral, Actualització del Llibre Mestre i Informe d'Auditoria

1. Executar i deixar amb `exit 0`:
   - `npm run test:precommit`
   - `npx eslint src tooling scripts tests --max-warnings=0`
   - `node tooling/gates/design_guard.mjs --arrel=src` (`0 crítics`)
   - `node tooling/gates/tractor-enxufe.mjs`
   - `npx vitest run src/sections/multimedia/ src/sections/xat/ src/sections/gestoria/privacitat.test.js src/natiu/projecteIos.test.js src/data/xifratXat* src/data/xatMultimediaXifrat*`
2. Actualitzar `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` marcant com a completats `IDEA-53`, `IDEA-54`, `D-C2 PWA` i el tancament UI de `D-09`.
3. Emetre l'informe canònic `_wiki_de_poble/04_escriptori/261029_HHMM_auditoria_claude.md` amb `Model IA: Claude Opus 5.5 · Ultracode`.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. `npx vitest run src/sections/multimedia/ src/sections/gestoria/privacitat.test.js` → `100%` en verd.
2. `npx vitest run src/sections/xat/ src/data/xifratXat* src/data/xatMultimediaXifrat*` → `100%` en verd.
3. `npm run test:precommit` i `npx eslint src tooling scripts tests --max-warnings=0` → `exit 0`.
4. `node tooling/gates/design_guard.mjs --arrel=src` → `0 crítics (PASSA)`.
5. `node tooling/wiki/document.mjs check` i `node tooling/gates/porta-plantilla-viva.mjs` → `valid: true`.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

1. **Risc d'incomplir la frontera de privacitat de la Gestoria (`src/sections/gestoria/privacitat.test.js`)**:
   - **Mitigació**: `src/sections/multimedia/**` no importa mai res de `src/sections/gestoria/**`; tota la persistència `IndexedDB` de handles i la lectura/escriptura local viuen dins de `src/sections/multimedia/motorMultimediaLocal.js`.
2. **Risc d'incomplir `tractor-cens.mjs` (`C1`, noves subcarpetes en `src/`)**:
   - **Mitigació**: No crear cap subcarpeta nova dins de `src/sections/multimedia/`; mantindre els mòduls plans dins de `src/sections/multimedia/`.
3. **Risc d'introduir colors literals amb `#` en fitxers de test (`design_guard.mjs` `raw-color`)**:
   - **Mitigació**: En qualsevol fitxer dins de `src/` (inclosos `.test.js`), construir els hexadecimals de prova amb `` `${'#'}0e662e` `` o constants per mantindre `design_guard.mjs --arrel=src` a `0 crítics`.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261029_1605_prompt_opus_album_multimedia_local_negreta_xat_i_deute_e2ee_pwa]]
- [[../90_arxiu_historic/261029_1455_auditoria_claude]]
- [[../90_arxiu_historic/261029_1514_auditoria_gemini]]
- [[../90_arxiu_historic/261029_1447_auditoria_codex]]
