---
type: informe
status: esborrany
description: Informe de Claude (torn de codi) sobre les bessones WebP de public/, la guarda WebP de les pujades a Storage i el salvavides de bessones al web propi; relleu per a l'auditoria adversària de Gemini.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_3e2490dc-0092-4905-b42e-3284b57af480:8752eee9-4575-4873-93a5-3a6aa4d714ac
---
# Auditoria Claude: transició a WebP i salvavides de bessones

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3e2490dc-0092-4905-b42e-3284b57af480:8752eee9-4575-4873-93a5-3a6aa4d714ac |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T15:25:43.890Z |
| Modificació | 2026-10-22T17:20:00.000Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), Claude Code a l'app d'escriptori |
| Tokens consumits | no mesurat (l'agent local no té comptador fiable per torn) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-22T15:05Z: torn `torn_3e2490dc` (claude, code) obert per ordre del Mestre en xat: tasques 1, 2 i 3 del pla `261022_1645_pla_implementacio_transicio_webp_i_salvavides`, i avisar Gemini. Pla vinculat i fitxers declarats amb `document.mjs own`. Ni la tasca 4 (purga de Supabase) ni la 5 (desplegament a Firebase) entren en l'encàrrec: no s'han tocat.
- 2026-10-22T15:45Z: les tres tasques, fetes. Llegit sencer el preflight de Gemini (`261022_1700_auditoria_gemini`, relleu 1) i resposta en §3. Este informe és l'avís a Gemini (§4).
- 2026-10-22T15:55Z: suite completa acabada: 2 fallades, cap d'este torn (§Verificació).
- 2026-10-22T16:20Z: ampliació per ordre del Mestre en xat («converteix a WebP els 67 originals de public/assets que encara no tenen bessona, amb la mateixa eina i les mateixes garanties, i actualitza l'informe»): 61 bessones més (§1.1).
- 2026-10-22T17:20Z: el Mestre aprova la clau «disseny» i ordena el commit amb `--no-verify` (§6).
- 2026-10-22T16:50Z: els tres parells, per ordre del Mestre en xat («l'original canònic és el .png … genera la bessona .webp a partir del .png … elimina els 3 .jpg duplicats que sobren, i fes el commit definitiu de tot el lot») (§1.2).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Tasca 1 · Bessones WebP a `public/`

He llegit l'script abans d'executar-lo. Garanties: no toca mai l'original, no sobreescriu cap `.webp` sense `--sobreescriu` i no escriu la bessona si no pesa menys. Primer, un assaig sense `--aplica`. Després, la comanda del pla, executada en bash (en zsh, un patró sense coincidències avortaria la comanda sencera):

`node tooling/media/optimitzar_webp.mjs converteix public/assets/img/*.jpg public/assets/fotos/*.png public/assets/towns/*/*.jpg --aplica`

- 28 fitxers casen amb els tres patrons. 17 ja tenien bessona (saltats). 10 s'han convertit amb la maquinària (Pillow, qualitat 84, conserva l'EXIF): 2.246 KB → 1.549 KB en total (−31 %). Són `img/pi-pla-verd`, `towns/benifallim/2`, `towns/la-torre-de-les-macanes/1` i `og-la-torre-1200x630`, `towns/orxeta/1`, `towns/relleu/2`, `towns/sella/1` i `2`, `towns/tibi/1` i `towns/xixona/2`.
- `towns/alcoleja/1.jpg` el saltava la maquinària: el WebP feia 348 KB, més que l'original. L'ha fet Chrome a qualitat 75: 309 KB → 283 KB (−8 %). Chrome no conserva l'EXIF; l'original sí que el guarda. És exactament la proposta 4 de Gemini.
- Resultat: cap fitxer dels tres patrons queda sense `.webp`. Les 11 bessones noves són a `public/` sense commit, i el build de prova les porta a `dist/`.
### 1.1 Ampliació: els 67 originals que quedaven sense bessona (ordre del Mestre)

Mateixa eina i mateixes garanties: assaig sense `--aplica` i, després, `converteix --aplica` sobre la llista exacta dels 67 originals de `public/assets` sense bessona. JPEG amb la maquinària; PNG amb Chrome, perquè la maquinària només fa JPEG.

- **60 escrites:** 6,0 MB → 4,0 MB (−33 %). D'`uploads/` (avatars, gent, ia, brain, empresa, poble, grup, companies), `events/` (2), `img/` (els 2 `nano_porta_*`) i `system/ui/` (els 3 logotips).
- **1 amb Chrome a qualitat 75:** `uploads/companies/mercat/generic_market.png`, que la conversió per defecte saltava perquè el WebP pesava més (155 KB). A qualitat 75: 153 KB → 125 KB. És el mateix tractament que alcoleja.
- **6 sense bessona, per la regla de les bessones:** la bessona ha de ser de l'única font, i ací hi ha tres parells `.jpg`/`.png` amb el mateix nom a la mateixa carpeta:
  - `system/ui/og-socdepoble-1200x630`;
  - `uploads/brain/ibanez_pedra_seca_design_1780873465211`;
  - `uploads/poble/la-torre-de-les-macanes/og_gentdelatorre_mapa_cuadrat_halo`.

  `requires_human_decision: true`: quin dels dos és el bo. Llevar l'altre deixa fer-li la bessona. Ull: l'OG de `system/ui` en PNG el cita `index.html` (`og:image`, `twitter:image`) com a URL absoluta de producció.
- **Comprovacions:**
  - **Transparència:** dels 47 PNG convertits, 4 en tenien de real, i les quatre bessones la conserven (Pillow, canal alfa).
  - **Logotips:** el negre de 985×256, comparat a ull amb l'original, és igual.
  - **Cites fora del resolutor:** `index.html` cita el logotip de 256 px i l'OG com a URL absolutes de producció (el web no substituïx res), i `media_registry.json` no el llig cap codi de `src/`.
  - **Portes dels paquets:** les del natiu (cap `url()` dels CSS ni cap cita sense resolutor d'un original amb bessona) i la de mida del directori sobre el `public/` real passen.
- **Resultat de l'ampliació:** 72 bessones noves (11 + 61), 5,8 MB, totes a `dist/` en compilar. Només quedaven sense bessona els 6 fitxers dels tres parells (§1.2).

### 1.2 Els tres parells: el `.png` és el canònic (ordre del Mestre)

- **Els tres `.jpg` duplicats fora de `public/`.** Traslladats, no esborrats, al lloc on el projecte guarda els originals retirats (`_multimedia_de_poble/originals_raster_public/assets/…`, amb el mateix camí), com els 32 del 261021. El hash és idèntic a l'origen i al destí. A git consten com a esborrats.
  - `system/ui/og-socdepoble-1200x630.jpg`;
  - `uploads/brain/ibanez_pedra_seca_design_1780873465211.jpg` (768 px);
  - `uploads/poble/la-torre-de-les-macanes/og_gentdelatorre_mapa_cuadrat_halo.jpg`.
- **Bessones dels tres `.png`:** 2.128 KB → 463 KB (−78 %), amb les mateixes mides. Cap tenia transparència real.
- **Troballa:** el `.png` de l'Ibáñez és, per dins, un JPEG (1.024×1.024) amb extensió `.png`. Els navegadors el pinten igual (miren els bytes), però no porta transparència ni té la fidelitat d'un PNG. `requires_human_decision: false`: la bessona es fa igual (348 KB, menys que els 367 KB del `.jpg` de 768 px retirat).
- **Cites reescrites** (només en citava un, el de l'Ibáñez):
  - `DesignSection.jsx`: la «portada lleugera» és ara la bessona `.webp` (1.024 px). Un copy que encara cite el `.jpg` retirat també hi va. Té una prova nova a `DesignSection.datesDeProva.test.jsx`.
  - `pageContent.js`: `.webp`, 1.024×1.024.
  - El cens de l'Arxiu (`censImatges.js`) nomena el `.png`, perquè el cens nomena sempre l'original. Abans s'excloïa el `.png` («es queda el JPEG»): ara és al revés.
  - De les exclusions OG de La Torre ix el `.jpg` retirat: la prova en compta 8 (abans, 9).
  - Els altres dos `.jpg` no els citava ningú. `index.html` cita l'OG en `.png` (es queda).
- **`supabase/seed.sql` (avís per a MarIA).** És un canvi en curs d'una altra mà, en `stage`, que reescriu les rutes d'imatges. Hi havia passat la portada de l'Ibáñez del `.png` al `.jpg`, que ara ja no hi és, i `seedSql.multimedia.test.js` ho detectava.
  - Hi he canviat només eixe token del `.jpg` al `.webp`, al fitxer i al seu `stage` (blob `cc7946db` → `17b13c0b`, una sola línia). La resta del canvi és tal com era, i no entra al meu commit.
  - Eixa entrada encara declara `imageWidth`/`imageHeight` 768; la bessona en fa 1.024. La portada de Disseny força 1.024 igualment, i és quadrada.
- **Resultat final:** a tot `public/assets` cap original PNG/JPEG queda sense bessona WebP. 75 bessones noves en total (11 + 61 + 3), uns 6,2 MB.
- **Si algun contingut remot (`app_content` de producció) encara cita algun dels tres `.jpg` retirats, caldrà reescriure'l** (a `.webp`, o al `.png` canònic). El salvavides només rescata `.webp`.

### 2. Tasca 2 · Cap JPEG ni PNG nou a Storage (`src/utils/pujadaImatge.js`)

**Estat de partida.** Abans de canviar res he mirat tots els camins de pujada:
- En Chrome i Firefox ja no entrava cap JPEG ni PNG nou: la capçalera, la targeta i l'avatar passen per `fotoDinsDelPressupost` (WebP); l'enquadrament i el text enriquit, per `compressImage` (WebP); el xat, per `adjuntLocal · preparaAdjunt` (WebP).
- La porta per on encara entren és WebKit: Safari 16 del Baseline i tots els navegadors d'iOS no saben codificar WebP en un canvas, i el codi hi recorre a JPEG (o a PNG per al logotip i l'ordre «/» Imatge).
- Al servidor arriben pels dos únics cridadors d'`uploadToStorage`: `PerfilContext · pujaMitja` i `NotesEditor · pujarImatgeDeNota`.

**Canvi.**
- `garantixWebp(fitxer)` nova a `pujadaImatge.js`, la guarda de l'última porta. La criden els dos camins de Storage just abans d'`uploadToStorage`; els modes seed i local no canvien.
- Un JPEG o un PNG es torna a codificar en WebP amb `compressImage`: 1.600 px pel costat llarg com a molt, sense ampliar mai, qualitat 0,82, sense EXIF. Ix amb nom `.webp` i tipus `image/webp`.
- He usat `compressImage` i no un `toBlob` directe perquè posa dreta la foto segons l'orientació EXIF, que un `toBlob` cru deixaria tombada.
- Un WebP (el de `fotoDinsDelPressupost`, amb el seu pressupost i l'EXIF que la persona ha triat), un AVIF o un PDF del Bloc passen tal qual.

**Límit (`requires_human_decision: true`).** En WebKit la guarda no pot fer WebP: el fitxer es puja com venia (el JPEG de reserva), perquè trencar les pujades dels iPhone de la gent gran seria pitjor. «Zero JPEG» també en WebKit demana una de dues coses:
- un codificador WebP en WASM, que és una dependència nova (`npm install` requerix l'aprovació del Mestre);
- la conversió al servidor (Supabase).

**Memòria del canvas (proposta 2 de Gemini).**
- `compressImage` (`imageUtils.js`) i `codifica` (`imatgeCanvas.js`) alliberen ara el canvas (`width = height = 0`) en un `finally`, també si la codificació falla. És el que ja feia `giraSiCal`.
- Importa perquè la cerca del pressupost en fa fins a set seguits i Safari d'iOS té un sostre de memòria de canvas.
- No canvia cap píxel: el data URL o el blob ja tenen els bytes.

### 3. Tasca 3 · El salvavides de bessones a `src/main.jsx`

**Troballa: connectar-lo tal com deia el pla no feia res.**
- Al web propi (el build de `main.jsx`, socdepoble.org) no hi ha cap política de mitjans segellada: `SDP_POLITICA_DE_MITJANS` és `undefined`.
- `recursOriginalDeBessona` torna `''` sense política. El recurs, tal com era, no sabria mai quin era l'original, i el salvavides seria inert.
- Gemini ho va veure també (punt 1.2 del seu preflight).

**Canvi a `fallbackBessones.js`.**
- Amb política (directori, autònom), tot com abans: l'original exacte, una vegada.
- Sense política (el web propi, on el contingut ja demana `.webp` directament), una `.webp` d'`assets/` que no arriba es torna a demanar al mateix camí amb les extensions dels originals de `public/`, una per error: `.jpg` (69 originals), `.png` (105) i `.JPG` (3). Es conserva la consulta (`?v=`).
- La màquina d'estats és acotada i monotònica: tres salts com a molt i mai de tornada a `.webp`. Acabats, l'error arriba al component.
- Cada salt deixa un `console.warn('[Bessones] No ha arribat', abans, '→ es prova', després)`: una bessona que falta s'ha de pujar, no amagar. Les adreces són públiques d'`assets/`; no hi ha cap dada sensible.
- No toca les pujades de Storage (no són d'`assets/`) ni cap imatge que no siga `.webp`.

**Canvi a `main.jsx`.**
- `instalaFallbackDeBessones(arrel)`, sobre `#root` i abans del primer pintat.
- No va sobre `document.body`: el tractor `LLEI_06_ENCAPSULAMENT` ho marcava com a infracció nova (punt 1.3 de Gemini, cert). Ara no marca cap fitxer d'este torn.

**Resposta al punt 1.1 de Gemini («l'SPA es pinta en una arrel d'ombra tancada i l'error no hi arriba»).** No és el cas de `main.jsx`.
- Allí es pinta el **component** React `PedraSecaEmbed` (la funció de `PedraSecaEmbed.jsx:343`) directament dins de `#root`. L'arrel d'ombra tancada és de l'**element** `<soc-de-poble>` (la classe de `PedraSecaEmbed.jsx:818`), que el web propi no munta.
- Comprovat al navegador: 10 `<img>` dins de `#root`, cap `<soc-de-poble>` i cap portal amb imatges fora de `#root`.

**Prova en Chromium real (servidor :3340):**
- `/assets/events/aplec_2023_cartell.webp` (no existix) → `.jpg`, carregada (723 px d'ample).
- `/assets/events/aplec_2023_ponents.webp` → `.jpg` (no existix) → `.png`, carregada (1.024 px). Tres avisos `[Bessones]` a la consola.
- `/assets/no-existix/res.webp` → tres intents, i un sol error arriba al component (sense bucle).

### 4. Per a Gemini: on posar la lupa

Gemini, el codi és a punt per a l'auditoria adversària; res no té commit. Fitxers:
- `src/utils/pujadaImatge.js`: `garantixWebp`, al final.
- `src/sections/profile/PerfilContext.jsx`: `pujaMitja`.
- `src/sections/notes/NotesEditor.jsx`: `pujarImatgeDeNota`.
- `src/utils/imageUtils.js` i `src/components/universal/enquadrament/imatgeCanvas.js`: el `finally` que allibera el canvas.
- `src/config/fallbackBessones.js`: la seqüència sense política.
- `src/main.jsx`: la instal·lació sobre `#root`.
- Proves: `pujadaImatge.test.js`, `fallbackBessones.test.js`, `PerfilContext.test.jsx`, `NotesEditor.test.jsx` i `orientacio.formats.test.js`. Aquesta última ara apunta les mides del canvas en codificar i comprova que després queda a 0×0.
- Bessones noves: les 11 de §1 i les 61 de §1.1. Les PNG les ha fet Chrome amb pèrdua (qualitat 80); la de `generic_market`, a 75.

Preguntes on una mirada en contra és més útil:
1. **`garantixWebp` torna a codificar un PNG o un JPEG que ja estava dins del pressupost de 80 KB.** Hi ha cap camí de Chrome o Firefox on arribe un JPEG o un PNG que no haja passat per `fotoDinsDelPressupost`? I el WebP d'eixida podria passar de `MIDA_MAX_PUBLICA`? Jo no n'he trobat cap; el logotip és WebP en Chrome.
2. **El salvavides sense política prova `.jpg`, `.png` i `.JPG` fins i tot per a una `.webp` que no té original** (les 32 que es van quedar només en WebP el 261021). Són fins a tres peticions perdudes per imatge absent. Val la pena, o preferiu una llista segellada al build web (més precisa, però toca `vite.config.js`)?
3. **`img.src = …` sobre un `<img>` de React:** si React torna a pintar amb la mateixa prop, no la reposa. Si la prop canvia, la marca de `dataset` queda vella. Hi veieu algun cas real (un avatar que canvia de persona)?
4. **El `finally` del canvas:** en Safari 16, `toBlob` amb un canvas de 0×0 després de l'`await`?
5. **Les bessones dels logotips i de les il·lustracions** són WebP amb pèrdua, i els paquets amb política (directori, autònom, natiu) les mostren en lloc de l'original. Hi veieu algun artefacte que valga la pena (vores, text menut) per a demanar-les sense pèrdua?

### 5. Retroalimentació a la plantilla `prompt_local`

- **Tasques de risc fora de l'encàrrec.** El pla barreja tasques de codi local amb tasques de producció (DROP de taules a Supabase, desplegament a Firebase). Separar-les en blocs amb el seu responsable evitaria que un implementador les execute per inèrcia.
- **Tasques que donen per fet un comportament.** La tasca 3 donava per fet que el recurs funcionaria al web; una línia de preflight («comprova que el recurs actua sense política») ho hauria detectat abans.
- **Comandes amb patrons.** Les comandes amb comodins s'haurien d'escriure per a `bash` o amb cometes: en zsh, un patró buit avorta la comanda.

### 6. Commit del lot

Ordre del Mestre en xat: «fes el commit definitiu de tot el lot». El commit va damunt de `ccd8fd5ea`, amb un índex temporal i una llista explícita (96 camins, i el registre de la frontissa en fa 97):
- 17 fitxers de codi i proves;
- els 3 `.jpg` retirats;
- les 75 bessones;
- este informe.

Una guarda comprova que l'arbre del commit és l'assajat. Queden fora, perquè no són d'este torn: `supabase/seed.sql` (de l'altra mà, en `stage`, amb el token del §1.2), `.agents/` (ESTAT i torns), els informes de Gemini, l'índex de l'Escriptori i el pla i el prompt de MarIA.

**Estat: el commit no s'ha fet, perquè el hook l'ha parat** (intent amb el hook normal, sense `--no-verify`). Portes de `.husky/pre-commit` sobre el mateix índex temporal:
- `frontissa-contingut.mjs` ❌: «La clau «disseny» ha canviat des de l'última aprovació (Javi, 2026-10-10)». És la portada de `pageContent.js` (`.jpg` → `.webp`, 768 → 1.024 px), obligada per la retirada del `.jpg`.
  - L'aprovació és una decisió humana del Mestre: `node tooling/gates/frontissa-contingut.mjs --aprova disseny --per Javi`. Escriu a `.agents/contingut_estructural.json`, que aleshores entra al commit.
- `porta-taxonomia.mjs --staged` ✅; `porta-plantilla-viva.mjs --staged` ✅.
- `git-staged.mjs` ❌: no hi ha cap llicència Reflex activa (`.sdp-reflex/active.json`). Com en els commits anteriors, cal obrir-ne una o fer el commit amb `--no-verify`, per decisió del Mestre.
- `requires_human_decision: true` (les dues coses).

**Resolt (17:20 local):** el Mestre va aprovar la clau en xat («He aprovat la clau «disseny» amb la frontissa … Fes el commit del lot amb índex temporal, llista explícita (afegint .agents/contingut_estructural.json) i --no-verify»).
- Comprovat abans del commit: `frontissa-contingut.mjs` ✅ (14/14 claus aprovades); el registre només canvia l'empremta i la data de «disseny» (`c0e017aa…` → `a2a85aa9…`, 2026-10-10 → 2026-10-22).
- El commit porta 97 camins: els 96 d'abans i el registre. Es fa amb `--no-verify` per decisió del Mestre.

Suite completa sobre l'arbre definitiu (`npx vitest run`, 762 s): 1.243 fitxers (1.232 en verd, 9 saltats, 2 en roig); 20.995 proves en verd, 100 saltades i 2 en roig. Són les dues mateixes fallades alienes de la primera passada: l'identificador de commit de 9 caràcters i `MercatSection.autoria` pel `seed.sql` de l'altra mà.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Proves dirigides** (després de l'últim canvi): `npx vitest run src/utils src/config/fallbackBessones.test.js src/components/universal/enquadrament src/entrades.capaDelPaquet.test.jsx`: 52 fitxers, 1.099 proves en verd (5 saltades de sempre). `npx vitest run src/sections/profile/PerfilContext.test.jsx src/sections/notes/NotesEditor.test.jsx`: 112 en verd.
- **Suite completa** (`npm test` és `vitest`; s'ha executat `npx vitest run`, 748 s): 1.243 fitxers; 1.232 en verd, 9 saltats i 2 en roig. Proves: 20.994 en verd, 100 saltades i 2 en roig. Cap de les dues ve d'este torn:
  - `tests/laboratori-telefonades-261006.test.js` espera el hash curt `76947e5d` i git ara n'abreuja a 9 caràcters (`76947e5d7`), perquè el repo ha crescut. És de l'entorn.
  - `src/sections/mercat/MercatSection.autoria.test.jsx` falla perquè la fila del Mac Mini de `supabase/seed.sql` porta ara `author_avatar`. Eixe canvi és d'una altra mà (el fitxer és en `stage` i no l'he tocat).
  - La suite va començar abans dels últims retocs (`#root` en lloc de `document.body` i el `finally` dels canvas). Els fitxers que toquen s'han tornat a passar després (la línia anterior: 52 fitxers i 1.099 proves, més 112).
- **ESLint:** `--max-warnings=0` sobre tots els fitxers tocats: 0 missatges.
- **Portes:** `tractor-pedra-seca --detall` i `tractor-vocabulari` no nomenen cap fitxer d'este torn.
- **Bessones (ampliació §1.1):**
  - `npx vitest run src/sections/multimedia/censImatges.test.js src/config src/PedraSecaEmbed.config.test.jsx src/sections/plugins src/sections/consola/imatgesConsola.test.js src/sections/consola/indexConsola.test.js src/css/kowalskiMurConsola.capes.test.js src/apps/plataforma/pesDelNucli.test.js`: 53 fitxers, 1.319 proves en verd.
  - `node --test tests/standalone-build.test.mjs` (la mida del directori sobre el `public/` real i les polítiques): en verd.
  - `node --test tests/natiu-build.test.mjs` (els recursos que viatgen, la política nativa, les cites sense resolutor i els `url()` dels CSS): en verd.
  - Compilació web: les 72 bessones noves, a `dist/`.
- **Els tres parells (§1.2):** `npx vitest run src/sections/disseny src/sections/multimedia src/sections/text src/sections/mur src/config src/app src/utils src/components/universal/enquadrament src/sections/profile/PerfilContext.test.jsx src/sections/notes/NotesEditor.test.jsx` va donar 305 fitxers, 5.753 proves en verd (7 saltades). Les portes dels paquets (`standalone-build`: 9; `natiu-build`: 4) passen, `tractor-vocabulari` i `tractor-pedra-seca` no nomenen cap fitxer d'este torn i la compilació és correcta.
- **Compilació:** `vite build` (el de `build:web`) a una carpeta temporal, per no xafar el `dist/` compartit: correcta. Les bessones noves hi són (`img/pi-pla-verd.webp`, `towns/alcoleja/1.webp`, `towns/xixona/2.webp`, `fotos/javi-llinares-perfil-1200px.webp`), i el salvavides va dins del tros principal.
- **Navegador:** Chromium del panell, servidor :3340; proves de §3.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Commit: vegeu §6.
- No s'ha tocat Supabase (tasca 4) ni s'ha desplegat a Firebase (tasca 5). Producció continua servint 404 per a les `.webp` fins que algú desplegue.
- La guarda WebP no actua en WebKit (§2). El salvavides no s'ha provat en Safari ni en un dispositiu real.
- `.agents/ESTAT.md` i `LEDGER.md` són de l'orquestradora.
- No he creat cap cron i no queda cap procés en segon pla.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261022_1645_pla_implementacio_transicio_webp_i_salvavides]]
- [[261022_1645_prompt_claude_gemini_transicio_webp_i_salvavides]]
- [[261022_1700_auditoria_gemini]]
