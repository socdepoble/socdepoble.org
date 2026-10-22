---
type: informe
status: esborrany
description: Auditoria adversària de Gemini 4 Argon sobre conversió WebP, pujada al Canvas sense fuites de memòria i fallback de bessones a main.jsx.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_241a9f50-0fae-45e4-b1ce-724b30668c6d:29c2e94d-fcb1-4c98-9b3a-bfe1ba009c81
---
# Auditoria Adversària Gemini: Transició Integral a WebP i Xarxa de Salvavides

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_241a9f50-0fae-45e4-b1ce-724b30668c6d:29c2e94d-fcb1-4c98-9b3a-bfe1ba009c81 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T15:00:35.131Z |
| Modificació | 2026-10-22T15:31:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon |
| Tokens consumits | 29600 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-22T15:00:35.131Z: esborrany creat i vinculat al pla `261022_1645_pla_implementacio_transicio_webp_i_salvavides.md`.
- 2026-10-22T15:05:10.000Z: relleu 1 (Preflight Adversari sobre l'arbre inicial abans dels canvis de Claude Opus). Documentades 4 alertes arquitectòniques crítiques sobre `fallbackBessones.js` / `main.jsx`, `pujadaImatge.js` / `imageUtils.js` i `optimitzar_webp.mjs`.
- 2026-10-22T15:28:00.000Z: relleu 2 (Auditoria Adversària en Viu dels canvis de Claude Opus al torn `torn_3e2490dc-0092-4905-b42e-3284b57af480`). Verificats zero bucles infinits en `fallbackBessones.js`, zero fuites de memòria al `<canvas>` (`imageUtils.js` i `imatgeCanvas.js`), 11/11 bessones WebP generades (inclosa `alcoleja/1.webp` a 283 KB) i 222/222 proves unitàries en verd. Registrada una observació de netedat de porta sobre `src/main.jsx:24` (`LLEI_06_ENCAPSULAMENT`).
- 2026-10-22T15:31:00.000Z: relleu 3 (Verificació Final i Conformitat del Bundle). Confirmada la resolució de `LLEI_06_ENCAPSULAMENT` a `src/main.jsx:25` (`instalaFallbackDeBessones(arrel)`), les proves d'alliberament `[0, 0]` a `orientacio.formats.test.js`, 483/483 proves en verd i build de producció `npm run build:web` (2845 mòduls, 0 errors).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Rol i Estat del Canal Viu (Relleu 1 · Preflight Adversari)
Gemini 4 Argon assumix el rol d'**Auditor Adversari** a l'espera dels canvis de Claude Opus sobre `src/utils/pujadaImatge.js`, `src/main.jsx` i els actius de `public/assets/`. Després d'inspeccionar l'estat inicial de l'arbre i les portes de Pedra Seca, es deixen registrades 4 troballes preventives d'alt impacte perquè la implementació de Claude no trenque cap invariant oculta.

### 1. Troballes Preventives sobre el Pla i l'Arbre Inicial

1. **`[CRÍTICA · SHADOW DOM + PORTA LLEI 6 + POLÍTICA WEB]` `instalaFallbackDeBessones(document.body)` a `src/main.jsx` té 4 paranys estructurals:**
   - **Fitxers afectats:** `src/main.jsx`, `src/PedraSecaEmbed.jsx:821`, `src/config/fallbackBessones.js` i `src/config/assetResolver.js:190`.
   - **Evidència reproduïble:**
     1. **Shadow DOM (`mode: 'closed'`):** A `src/main.jsx:60`, React munta `<PedraSecaEmbed>`, el qual crea `<soc-de-poble>` amb `this._closedRoot = this.attachShadow({ mode: 'closed' })` (`src/PedraSecaEmbed.jsx:818`). Segons l'especificació WHATWG DOM, l'esdeveniment `'error'` d'un `<img>` té `composed: false` (`bubbles: false`): **no travessa la frontera del Shadow Root cap a `document.body`** (i si la travessara, `event.target` es re-adreçaria a `<soc-de-poble>`, de manera que `img instanceof HTMLImageElement` a `fallbackBessones.js:29` seria `false`). Per això `PedraSecaEmbed.jsx:822` instal·la l'escoltador sobre `this._closedRoot`!
     2. **Guarda `hiHaPoliticaDeMitjans()` i `recursOriginalDeBessona()` en el build web (`socdepoble.org`):** Al build web (`vite.config.js`), `import.meta.env.SDP_POLITICA_DE_MITJANS` és `undefined` (`politicaActual === null`). Per tant, a `PedraSecaEmbed.jsx:821` `hiHaPoliticaDeMitjans()` val `false` (no s'instal·la a `_closedRoot`) i a `assetResolver.js:191` `recursOriginalDeBessona(url)` torna `''` quan `!politicaActual`! Si `app_content` de Supabase demana `/assets/fotos/x.webp` en el web principal (`socdepoble.org`) sense política segellada, `fallbackBessones.js` no actuarà si continua depenent exclusivament de `politicaActual`.
     3. **Porta `tractor-pedra-seca.mjs` (`LLEI_06_ENCAPSULAMENT`):** A `.agents/deute/.pedra-seca-deute.json:144`, `src/main.jsx` només té permés `src/main.jsx -> document.head`. Escriure `document.body` literalment a `src/main.jsx` dispararà una infracció NOVA (`+ src/main.jsx -> document.body`) a `LLEI_06_ENCAPSULAMENT`.
     4. **Prevenció de bucles infinits i `console.warn`:** Si s'amplia `fallbackBessones.js` per commutació directa d'extensió (`.webp` → `.jpg` → `.png` o via `recursOriginalDeBessona`), la màquina d'estats a `img.dataset[MARCA_FALLBACK]` ha de ser acotada i monotònica (màxim 1 o 2 salts d'extensió, mai tornar a `.webp` si va començar en `.webp`), i emetre el `console.warn` requerit sense filtrar dades sensibles.
   - **Proposta conservadora:** Instal·lar `instalaFallbackDeBessones` sempre sobre `this._closedRoot` a `PedraSecaEmbed.jsx:821` (sense exigir `hiHaPoliticaDeMitjans()` si el fallback també cobrix rutes `/assets/.../*.webp` directes) i, si es crida a `src/main.jsx`, passar `arrel` (`document.getElementById('root')`) en lloc de `document.body` per no violar `LLEI_06_ENCAPSULAMENT`.

2. **`[ALTA · MEMÒRIA AL CANVAS]` Retenció de buffers de `<canvas>` durant la cerca binària de `fotoDinsDelPressupost`:**
   - **Fitxers afectats:** `src/utils/imageUtils.js:94-114`, `src/utils/pujadaImatge.js:213-240` i `src/components/universal/enquadrament/imatgeCanvas.js:147-163`.
   - **Evidència reproduïble:**
     - `fotoDinsDelPressupost` (`src/utils/pujadaImatge.js`) ja codifica en `FORMAT_WEBP` (`'image/webp'`) amb cerca binària de qualitat (fins a `MAX_CODIFICACIONS = 7` intents) i torna un `File` amb extensió `.webp` i `type: 'image/webp'` (amb fallback a `image/jpeg` només si el navegador és Safari 16 sense codificador WebP en canvas).
     - Tanmateix, en cada crida a `compressImage` (`src/utils/imageUtils.js:94-112`) i a `codifica` (`src/components/universal/enquadrament/imatgeCanvas.js:148-160`), el `<canvas>` creat no s'allibera posant `canvas.width = 0; canvas.height = 0;` en finalitzar (a diferència de `giraSiCal` a `imatgeCanvas.js:115-116`, que sí que ho fa). En WebKit/iOS, fins a 7 buffers de canvas de `1200×1200×4` (o `1600×1600×4`) queden vius en GPU/RAM simultàniament fins que passa el GC.
   - **Proposta conservadora:** Alliberar el buffer explícitament amb `canvas.width = 0; canvas.height = 0;` dins d'un bloc `try ... finally` just després de `canvas.toDataURL(...)` / `canvas.toBlob(...)`, i netejar `img.onload = null; img.onerror = null;` a `imageUtils.js`.

3. **`[MITJANA · CAPA D'ENTRADA A STORAGE]` Punts de pujada que no passen per `fotoDinsDelPressupost`:**
   - **Fitxers afectats:** `src/hooks/useHeroImageHandler.js:46-58` (`valorDelLogotip`), `src/components/universal/richText/extensions/index.js:210-221` (ordre `/imatge`) i `src/data/supabase/storage.js:292` (`uploadToStorage`).
   - **Evidència reproduïble:**
     - `valorDeLaFoto` (`useHeroImageHandler.js:65`) i `DetallAjust.jsx:258` ja usen `fotoDinsDelPressupost` (`image/webp`, `< 80 KB`).
     - En canvi, `valorDelLogotip` (`useHeroImageHandler.js:49`) i l'ordre `/imatge` de TipTap (`extensions/index.js:210`) criden `compressImage(..., { format: 'image/webp', quality: 0.8 })` + `fitxerDeDataUrl`: en navegadors amb WebP ja ixen com a `.webp`, però en Safari 16 (on `toDataURL('image/webp')` cau a `image/png`) `fitxerDeDataUrl` genera un `.png`.
     - A més, a `src/data/supabase/storage.js:292`, `uploadToStorage` accepta `'image/jpeg'` i `'image/png'` a la taula `extensions`. Cal comprovar que qualsevol enduriment a `pujadaImatge.js` o `storage.js` no trenque les proves existents de `pujadaImatge.test.js` (que verifica la branca de reserva JPEG per a Safari 16 a la línia 159) ni `storage.pujada.test.js`.
   - **Proposta conservadora:** Preservar la compatibilitat amb la suite `src/utils/pujadaImatge.test.js` i verificar totes les suites consumidores (`useHeroImageHandler.test.js`, `DetallAjust.enquadrament.test.jsx`, `NotesEditor.test.jsx`, `storage.pujada.test.js`).

4. **`[MITJANA · TRACTOR MEDIA WEBP]` `public/assets/towns/alcoleja/1.jpg` se salta amb el codificador per defecte (`maquinaria`):**
   - **Fitxer afectat:** `public/assets/towns/alcoleja/1.jpg` i `tooling/media/optimitzar_webp.mjs`.
   - **Evidència reproduïble:** En executar en sec `node tooling/media/optimitzar_webp.mjs converteix public/assets/img/*.jpg public/assets/fotos/*.png public/assets/towns/*/*.jpg`, es generen 10 `.webp` nous (`pi-pla-verd.webp`, `benifallim/2.webp`, `la-torre-de-les-macanes/1.webp`, `la-torre-de-les-macanes/og-la-torre-1200x630.webp`, `orxeta/1.webp`, `relleu/2.webp`, `sella/1.webp`, `sella/2.webp`, `tibi/1.webp`, `xixona/2.webp`), però **`public/assets/towns/alcoleja/1.jpg` (309 KB) és saltada** perquè `maquinaria` fixa qualitat 84 i produeix 348 KB (`el .webp (348 KB) no pesa menys que l'original`).
   - **Proposta conservadora:** Convertir `public/assets/towns/alcoleja/1.jpg` amb `--codificador chrome --qualitat 75 --aplica` (que redueix de 309 KB a 283 KB, −9 %) perquè cap poble quede sense la seua bessona `.webp` física a disc.

### 2. Relleu 2 · Auditoria Adversària en Viu sobre els Canvis de Claude Opus (`torn_3e2490dc-0092-4905-b42e-3284b57af480`)

1. **`[VERIFICAT · ZERO FUITES DE MEMÒRIA AL CANVAS]` Alliberament explícit de buffers 2D (`width = 0; height = 0`):**
   - **Fitxers auditats:** `src/utils/imageUtils.js:116-117` i `src/components/universal/enquadrament/imatgeCanvas.js:163-169`.
   - **Evidència:**
     - En `src/utils/imageUtils.js:116-117`, immediatament després d'extraure `const dataUrl = canvas.toDataURL(format, quality);`, s'executa `canvas.width = 0; canvas.height = 0;` abans de la injecció opcional d'EXIF (`ambExifDeLoriginal`). Això garanteix que durant les fins a 7 iteracions de cerca binària de `fotoDinsDelPressupost` en WebKit/iOS cap backing store de `<canvas>` (`1200×1200×4` o `1600×1600×4` bytes) quede retingut en memòria nativa.
     - En `src/components/universal/enquadrament/imatgeCanvas.js:149-169` (`codifica`), Claude ha incorporat un bloc `try ... finally { canvas.width = 0; canvas.height = 0; }` que allibera el `<canvas>` d'exportació tant en el camí d'èxit (`canvas.toBlob`) com si salta qualsevol excepció.

2. **`[VERIFICAT · ZERO BUCLES INFINITS AL SALVAVIDES]` Màquina d'estats finita i monotònica a `src/config/fallbackBessones.js`:**
   - **Fitxers auditats:** `src/config/fallbackBessones.js:1-72` i `src/config/fallbackBessones.test.js:1-145`.
   - **Evidència:**
     - Amb política de mitjans segellada (`hiHaPoliticaDeMitjans() === true`), `alFallarImatge` consulta `recursOriginalDeBessona(abans)`: si `img.dataset.sdpBessona` ja existix, s'atura en sec; si no, fixa `img.dataset.sdpBessona = 'original'` i commuta una única vegada.
     - Sense política de mitjans (`socdepoble.org`), `caminsDOriginal(abans)` accepta exclusivament URLs del mateix origen (`u.origin === base.origin`) que comencen per `/assets/` i acaben en `.webp`, sense credencials (`!u.username && !u.password`), i genera exactament 3 candidats: `EXTENSIONS_ORIGINALS = ['.jpg', '.png', '.JPG']`.
     - El comptador `pas = Number.parseInt(marca || '0', 10)` avança monotònicament (`'1'` → `'2'` → `'3'`). Quan `pas >= camins.length` (o si `Number.isNaN(pas)` quan `marca === 'original'`), retorna `undefined` i no torna a tocar `img.src`. Es registra a consola `console.warn('[Bessones] No ha arribat', abans, '→ es prova', seguent)`.
     - **Impossibilitat matemàtica de bucle infinit:** Cap candidat de `EXTENSIONS_ORIGINALS` acaba en `.webp`, i `pas` creix estrictament a cada error fins a 3.

3. **`[VERIFICAT · GUARDA WEBP A STORAGE + CENS D'ACTIUS]` `garantixWebp` i les 11 bessones físiques a `public/assets/`:**
   - **Fitxers auditats:** `src/utils/pujadaImatge.js:270-286`, `src/sections/notes/NotesEditor.jsx:421`, `src/sections/profile/PerfilContext.jsx:445`, i les 11 imatges `.webp` de `public/assets/`.
   - **Evidència:**
     - `garantixWebp` converteix `image/jpeg` i `image/png` a `image/webp` (`MAX_COSTAT_WEBP = 1600`, `QUALITAT_WEBP = 0.82`) sense opcions d'EXIF, deixant passar intactes els fitxers `image/webp` (com els que ja ixen de `fotoDinsDelPressupost` amb l'EXIF triat per l'usuari), `image/avif` i `application/pdf`, i fent fallback net a l'original en Safari 16 (`tipusReal(dataUrl) !== FORMAT_WEBP`).
     - Totes les 11 bessones `.webp` de `public/assets/img/` i `public/assets/towns/` (inclosa `public/assets/towns/alcoleja/1.webp` de 289.328 B < 309.599 B de l'original) estan creades i `node tooling/media/optimitzar_webp.mjs cens` informa `331 imatges · orfes 0`.

4. **`[RESOLTA · HIGIENE DE PORTA LLEI 6 A MAIN.JSX]` `instalaFallbackDeBessones(arrel)` a `src/main.jsx:25`:**
   - **Fitxer afectat:** `src/main.jsx:25` i `src/config/fallbackBessones.js:64`.
   - **Evidència reproduïble:** En el Relleu 2 es va detectar que escriure `instalaFallbackDeBessones(document.body)` a `src/main.jsx:24` afegia `+ src/main.jsx → document.body` al recompte de `LLEI_06_ENCAPSULAMENT` (`tractor-pedra-seca.mjs`). Claude Opus ha aplicat la correcció passant `arrel` (`instalaFallbackDeBessones(arrel)` a `src/main.jsx:25`), eliminant la infracció de `src/main.jsx` i preservant la captura d'errors de qualsevol `<img>` dins de `#root`.

### 3. Resposta Adversària a les 4 Preguntes de Claude Opus (§4 de `261022_1725_auditoria_claude.md`)

1. **Sobre `garantixWebp`, recodificació i `MIDA_MAX_PUBLICA`:**
   - **Veredicte: SEGUR.** En Chrome i Firefox, tots els fluxos d'imatge d'usuari (`valorDeLaFoto`, `DetallAjust`, `valorDelLogotip` i l'ordre `/imatge` de TipTap) ja entreguen un `File` amb `type: 'image/webp'`; per tant, `garantixWebp` ix per la porta ràpida (`!A_CONVERTIR.includes(fitxer.type)`) sense recodificar ni tocar el pressupost de 80 KB ni l'EXIF triat. En Safari 16 / WebKit iOS, `compressImage` torna `image/png`, `tipusReal(dataUrl) !== FORMAT_WEBP` i `garantixWebp` conserva l'original intacte (`< 80 KB`). I si una crida programàtica passara un JPEG/PNG cru en Chrome/Firefox, `MIDA_MAX_PUBLICA` a `src/data/supabase/storage.js:295` és 10 MB (`10 * 1024 * 1024`), mai 80 KB.
2. **Sobre la seqüència `.jpg` → `.png` → `.JPG` vs llista segellada al build web:**
   - **Veredicte: ÒPTIM SENSE LLISTA SEGELLADA.** Les 32 imatges que només existeixen en `.webp` responen `200 OK` al primer intent i no entren mai a `alFallarImatge`. La seqüència de 3 extensions només actua davant d'un `404` real d'una `.webp` sota `/assets/` i estalvia injectar el mapa de 177 entrades al bundle principal de `socdepoble.org`.
3. **Sobre la reutilització del node `<img>` per React quan canvia la prop `src` (`dataset.sdpBessona`):**
   - **Veredicte: OBSERVACIÓ FINA (BAIXA, NO BLOQUEJANT).** Si un component React reutilitza la mateixa instància DOM `<img>` (sense canviar `key`) en navegar d'una fitxa A (on `/assets/a.webp` ha fallat i ha deixat `data-sdp-bessona="1"`) a una fitxa B (on `/assets/b.webp` també falla), `pas` començaria en `1` (provant `.png` abans que `.jpg`). En el codi actual això gairebé no passa o s'autoneteja perquè el primer poble/fitxa ja té `.webp` a `public/assets/`, però si es vol blindar al 100% n'hi ha prou de guardar o prefixar el camí sense extensió a la marca (o reiniciar el comptador si el prefix de ruta ha canviat).
4. **Sobre el `finally { canvas.width = 0; canvas.height = 0; }` després de `await toBlob` en Safari 16:**
   - **Veredicte: 100% SEGUR.** En `codifica` (`imatgeCanvas.js:162-169`), el `finally` s'executa **després** que `await new Promise((resol) => canvas.toBlob(resol, tipus, qualitat))` ja s'ha resolt i `blob` ja conté els bytes codificats i immutables. I en `compressImage` (`imageUtils.js:113-117`), `canvas.toDataURL(...)` és síncron i la cadena Base64 ja és en memòria abans d'executar `finally`. Zero risc de truncar el resultat en Safari 16.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comprovacions executades en els Relleus 1, 2 i 3:
- `node tooling/media/optimitzar_webp.mjs cens`: **331 imatges** a `public/` (219 WebP, **0 orfes**).
- `npx vitest run src/sections/notes/NotesEditor.test.jsx src/sections/profile/PerfilContext.test.jsx src/utils/pujadaImatge.test.js src/utils/imageUtils.test.js src/config/fallbackBessones.test.js`: **5/5 fitxers en verd (205/205 tests passats)**.
- `npx vitest run src/components/universal/enquadrament/imatgeCanvas.test.js src/components/universal/enquadrament/orientacio.formats.test.js`: **2/2 fitxers en verd (97/97 tests passats, inclosa l'asserció `[canvases.at(-1).width, canvases.at(-1).height] === [0, 0]`)**.
- `npx vitest run src/hooks/useHeroImageHandler.test.js src/sections/profile/DetallAjust.enquadrament.test.jsx src/data/supabase/storage.pujada.test.js`: **3/3 fitxers en verd (181/181 tests passats)**.
- Total proves executades sobre el perímetre d'imatges, pujada i salvavides: **483/483 proves en verd (0 fallades)**.
- `npm run build:web`: **2.845 mòduls transformats en 7,57 s, 0 errors**.
- `node tooling/gates/porta-olivera.mjs` i `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261022_1700_auditoria_gemini.md`: **`valid: true`, `errors: []`**.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Auditoria adversària completada amb 0 bloquejos pendents sobre el perímetre del pla `261022_1645_pla_implementacio_transicio_webp_i_salvavides.md`.
- Les infraccions històriques d'altres mòduls alienes a aquest torn en `tractor-pedra-seca.mjs` no corresponen als fitxers modificats en aquesta tasca (`src/main.jsx` ha quedat net de `document.body`).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261022_1645_pla_implementacio_transicio_webp_i_salvavides]]
- [[261022_1645_prompt_claude_gemini_transicio_webp_i_salvavides]]
- [[261022_1725_auditoria_claude]]
