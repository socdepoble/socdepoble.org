---
type: informe
status: esborrany
description: 'Execució i auditoria adversarial de Claude Code: twins WebP a public/assets, cens del visor i variant del directori de WordPress sota 10 MB'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_6a5887e7-edd2-4314-b4f0-53b12431e1ad:cc446e89-5f47-464e-ba89-91c657ca9160
---
# Alliberament del paquet multimèdia i conversió a WebP

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_6a5887e7-edd2-4314-b4f0-53b12431e1ad:cc446e89-5f47-464e-ba89-91c657ca9160 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-19T12:47:35.670Z |
| Modificació | 2026-10-19T14:55:00.000Z |
| Propietari | claude |
| Aprovació humana | Ordre del Mestre al prompt 1425 (execució); D1 (opció B, 16:12) i D3 (bessones a l'autònom, 16:45) decidides pel Mestre; D2, D4 i D5 pendents |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`) a Claude Code, amb subagents de workflow |
| Tokens consumits | ≈5,0 M en subagents (mapa 1,32 M + Àrbitre 3,71 M) més el fil principal (no mesurat) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-19T12:47:35.670Z: esborrany creat (`document.mjs create`, torn `torn_6a5887e7-edd2-4314-b4f0-53b12431e1ad`).
- 2026-10-19 14:48 · **Relleu 1.** Llegits sencers el prompt i el pla 1425, l'acta 1345, el prompt de Gemini 1425, el BIOS, el Genotip, l'índex i la taxonomia. T1 en lectura. Cinc lectors en paral·lel sobre el codi implicat.
- 2026-10-19 ≈15:05 · **Relleu 2.** Mapa fet; tres troballes que canvien el pla (vegeu §1). Política de mitjans i millores del tractor. **T2 aplicada** (119 bessones). T3 en verd.
- 2026-10-19 15:25 · **Relleu 3.** T4 implementada i mesurada en una còpia de treball (zip del directori de 6.621.151 B). Llegida l'auditoria de Gemini.
- 2026-10-19 15:28-15:55 · **Àrbitre adversarial** (5 lents, 2 refutadors per troballa mitjana o alta, 31 agents). 35 troballes; 9 de mitjanes o altes sobreviuen.
- 2026-10-19 15:55-16:20 · Correccions de l'Àrbitre, nou build i prova de fum del bundle real, suites senceres (Vitest 19.681 en verd) i este informe.
- 2026-10-19 16:12-16:40 · **D1 decidida pel Mestre: opció B.** Les carpetes externes passen a ser només `uploads/`, `towns/`, `fotos/` i `events/`; `nano_cards/` i `img/` viatgen al paquet. Les bessones de `nano_cards/` es tornen a fer a 768 px, i les 10 vinyetes no candidates de `ui/plugins/` també passen a WebP. Nou build real: **zip del directori de 9.710.800 B**. Les 21 bessones noves o refetes, verificades.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Resum per al Mestre

- **T2 feta:** 119 bessones `.webp` al costat de les seues fotos originals (118,9 MB → 27,3 MB, −77 %). Cap original tocat, cap imatge retallada ni ampliada, l'alfa i l'EXIF conservats. L'Àrbitre les ha verificades una a una.
- **T3 feta:** el cens de l'Arxiu visual reconeix les bessones sense obrir la porta a imatges noves sense declarar.
- **T4 feta en codi i mesurada, amb l'opció B que va triar el Mestre (D1):** el zip del directori de WordPress.org fa **9.710.800 B**, amb un límit de 10.485.760 B (marge de 0,74 MiB). La interfície viatja dins del paquet; només el contingut del servei se servix de fora. Perquè siga publicable falten dos passos fora del repositori (D2): desplegar `public/` amb les bessones a l'origen dels mitjans i posar-hi CORS.
- **T5:** proves, lint i porta Olivera en verd. Les dues fallades de la suite de node són anteriors a este torn i alienes (§6).
- **Decisions (§4):** D1 (opció B) i D3 (bessones a l'autònom), decidides i aplicades. **El paquet del canal propi (gentdelatorre.net) i el de Sollutia passen de 135,6 MB a 41,9 MB**, amb les fotos pesants en WebP. Queden pendents D2, D4 i D5.

### 1. Tres troballes que canvien el pla

1. **L'ordre literal de T2 no és el que diu el seu text.** `converteix public/assets` no filtra per candidates: escriu **200** bessones, no les 125 candidates. 81 no són candidates, i algunes estalvien menys de l'1 % (`disseny_vinyeta.jpg`, 0,999). He afegit `--nomes-candidates`, amb el mateix criteri que el cens (més de 300 KB o més de 1600 px), i he executat `converteix public/assets --max 1600 --qualitat 84 --nomes-candidates --aplica`.
2. **Excloure només `assets/uploads/` no baixa de 10 MB.** Fins i tot amb totes les imatges en WebP, el zip del directori faria **15,7 MiB**; amb els originals, 17,4 MiB. Sense uploads, les imatges que queden pesen 12,8 MB en WebP. Vegeu D1.
3. **L'origen extern encara no existix.** `https://socdepoble.org` és un desplegament de Firebase del juny (`last-modified: 11 Jun 2026`). Servix 83 de les 141 imatges d'`uploads/`, cap de `towns/`, `nano_cards/`, `events/` ni `img/`, i cap bessona. Per a una ruta inexistent torna l'`index.html` amb un 200 (7.009 B), no un 404. Tampoc no envia capçaleres CORS. Vegeu D2.

### 2. Què s'ha fet

#### 2.1 Imatges (T1 i T2)

- **T1:** codificadors `maquinaria` (Python + Pillow, JPEG amb EXIF) i `chrome` (PNG amb alfa). Abans de convertir, el cens donava 219 imatges, 131.795 KB, 125 candidates (119.908 KB) i 0 orfes.
- **T2:** 125 candidates, de les quals 119 bessones escrites, 6 saltades amb motiu i 0 errors.
  - Col·lisions de nom: `og-socdepoble-1200x630.png`, `og_gentdelatorre_mapa_cuadrat_halo.png` i el parell `ibanez_pedra_seca_design_…{jpg,png}`.
  - Ja tenia `.webp`: `tpv_vinyeta.jpg`.
  - El `.webp` no pesava menys que l'original: `towns/alcoleja/1.jpg`.
- **Repartiment per carpetes:** uploads 82 (16,41 MB), nano_cards 11 (3,45), towns 9 (2,17), ui 4 (1,28), fotos 4 (0,98), img 4 (0,77), soc_de_poble_ibanez 1 (0,35), system 1 (0,28), events 2 (0,26), notes 1 (0,09).
- **D1, opció B (16:12):**
  - les 11 bessones de `nano_cards/` es tornen a fer amb `--max 768 --sobreescriu` (2,20 MB en lloc de 3,45);
  - les 10 vinyetes no candidates de `ui/plugins/` (480×480) passen a WebP (1.646 → 1.105 KB).
  - Les dues PNG no candidates d'`img/` no es convertixen: estalviarien l'1 %.
- **Total:** 129 bessones noves, que pesen 25,89 MB.
- **Cens després:** 348 imatges, **0 orfes**. Les 130 bessones porten `bessonaDe`: les 129 noves i la vinyeta del Bar.

#### 2.2 Codi

| Fitxer | Canvi |
| --- | --- |
| `src/config/politicaDeMitjans.js` (nou) | La regla única de les bessones: mateixa carpeta, mateix nom amb la mateixa caixa i única font sense distingir majúscules. També els prefixos externs del directori, `separaRecursos` i `esHostLocal`, que s'hi ha mogut des de `vite.standalone.config.js`, que la reexporta. És pur; el fan servir el build, l'empaquetador, el cens i el tractor. |
| `vite.standalone.config.js` | `origenDeMitjans` (https públic; http local només fora de les releases) i `politicaDeMitjans(variant)`, que torna `null` per a l'autònom. El plugin de recursos emet només el que viatja. Clau additiva `mitjans` al manifest, fora de `contracte` i de `node`. La política se segella amb `define['import.meta.env.SDP_POLITICA_DE_MITJANS']`, només per a `SDP_VARIANT=wordpress`. |
| `src/config/assetResolver.js` | `resolveAsset` és l'únic punt d'aplicació: demana la bessona en lloc de l'original i, per a una carpeta externa, l'origen extern. `resolRecursPropi` i `resolRecursosDeHtml` també apliquen la política sense base. Noves funcions `fixaPoliticaDeMitjans`, `origenDeMitjansExterns`, `hiHaPoliticaDeMitjans` i `recursOriginalDeBessona`. Sense política, la sortida és idèntica a la d'abans (Llei del Píxel). |
| `src/config/fallbackBessones.js` (nou) | Si una bessona no arriba, torna a demanar l'original una sola vegada. És un escoltador en fase de captura sobre el shadow root, que també cobrix l'HTML sanejat, i atura el primer error perquè el component no amague la imatge. És l'element del pla «fallback automàtic a l'original». |
| `src/PedraSecaEmbed.jsx` | Registra l'origen extern al sanejador (`permetOrigenMitjans`) i instal·la el fallback, només amb política. |
| `wordpress-plugin/eines/empaqueta.mjs` | `verificaMitjans`: l'autònom no declara mitjans; el directori no porta cap extern; res no falta sense motiu (regla d'única font); l'origen es valida amb el criteri del build. El readme del directori declara el servidor de mitjans com a servei extern, amb el que s'envia realment. Informa de les restes del directori i recorda el desplegament i el CORS. |
| `tooling/media/optimitzar_webp.mjs` | `--nomes-candidates`. Escriptura atòmica amb un temporal ocult i un canvi de nom. Les col·lisions es miren a la carpeta de destí, també amb `--eixida`. Al cens, una bessona sense cap cita hereta l'estat del seu original, en lloc de passar per orfe. |
| `src/sections/multimedia/censImatges.js` i `.test.js` | El cens nomena sempre l'original. La prova accepta la bessona d'un original declarat; una `.webp` solta o ambigua continua fent-la roja; el cens no pot nomenar alhora una foto i la seua bessona. |
| `vercel.json` | `Access-Control-Allow-Origin: *` i `Access-Control-Expose-Headers: Content-Range, ETag` per a `/assets/`. |
| Proves | `politicaDeMitjans.test.js`, `assetResolver.mitjans.test.js` i `fallbackBessones.test.js` (noves). Ampliades: `censImatges.test.js`, `optimitzar_webp.test.mjs`, `standalone-build.test.mjs` (política, config, porta de mida sobre el `public/` real i CORS) i `enxufe-empaqueta.test.mjs`. |

**No s'ha tocat:** el contracte d'amfitrió (`contracteAmfitrio.js`, cap atribut nou), `.agents/`, `01_produccio/`, ni el build web o el natiu. La Frontissa i el port de backend queden intactes.

#### 2.3 Mesura de T4

Build real en una còpia de treball (`public/` i `node_modules` enllaçats), seguit de `empaqueta.mjs --prova`:

- **Zip del directori amb l'opció B: 9.710.800 B** (límit de 10.485.760 B). Fora queden 278 mitjans externs (`uploads/`, `towns/`, `fotos/` i `events/`), i 33 originals queden substituïts per la seua bessona. Amb l'opció C anterior (sis carpetes fora) feia 6.625.267 B.
- **El marge és de 0,74 MiB.** La porta de mida de `tests/standalone-build.test.mjs` (el `public/` que viatja més 2 MiB de reserva per al bundle) avisarà abans d'arribar al límit real.
- **Política al bundle:** apareix 3 vegades (~10 KB en cru cadascuna), una al resolutor i una per cada objecte `import.meta.env` sencer.
- **Readme:** porta el servei 6 en lloc del paràgraf del canal propi.
- **Autònom (canal propi i Sollutia), amb D3:** abans del torn feia 135,6 MB. Amb les bessones afegides sense substituir res, 162,8 MB. Amb la substitució, **41.913.260 B** (canal propi) i 41.834.132 B (estàtic). Vegeu D3.

### 3. Àrbitre adversarial (mètode Gauntlet)

Cinc lents independents (temps d'execució, empaquetat i WordPress.org, integritat de les imatges, proves i eines, doctrina i contrast). Cada troballa mitjana o alta ha passat per dos refutadors.

#### 3.1 Abans de l'Àrbitre, l'àrbitre intern va trobar i corregir

1. **Col·lisions amb `--nomes-candidates`.** Es miraven només entre les entrades, i s'hauria escrit `og-socdepoble-1200x630.webp` com a bessona ambigua del `.png` i del `.jpg`. Es va corregir abans d'aplicar.
2. **Còpia de la política.** Amb una clau d'`import.meta.env` llegida en sencer, Vite la copiava dins de dos objectes d'entorn.

#### 3.2 Verificat correcte (resum)

- **Les 119 bessones, una a una:**
  - Descodifiquen completes amb Pillow i amb ImageIO de macOS.
  - El contenidor RIFF és íntegre.
  - Mides exactes: 16 reduïdes a 1600 px, 103 a la seua mida, cap ampliada, error d'aspecte ≤ 0,063 % (cap retall).
  - **Alfa:** 10 PNG amb transparència la conserven, i cap fons no s'ha tornat opac.
  - **EXIF:** 16 de 16 el conserven, amb l'orientació a 1; el GPS i la data hi són.
  - **Qualitat:** PSNR mínima de 34,70 dB i mediana de 37,06 dB. El flux de bits de les 104 JPEG és idèntic, byte a byte, a una reproducció a q84.
  - Cap perfil de color no és de fora de sRGB.
- **Prova de fum del bundle real del directori en jsdom,** amb el React del nucli com a globals:
  - A `/multimedia` es pinten 154 imatges i «TOTS (149)», amb política i sense: la deduplicació de l'Arxiu no canvia.
  - 132 demanen l'origen extern, 0 queden bloquejades pel sanejador, i el fons del Xat es demana en `.webp` des del paquet.
  - Tot el que es demana al paquet hi és.
- **Empaquetat:**
  - El zip del directori no porta cap fitxer extern i hi viatgen les bessones en lloc dels originals.
  - `manifest.php` ignora la clau `mitjans`, `salut.php` només mira l'inventari, i la imatge OG de `seo.php` viatja.
  - El canal signat no canvia.

#### 3.3 Troballes que sobreviuen i què se n'ha fet

| ID | Severitat | Troballa | Estat |
| --- | --- | --- | --- |
| WPORG-1 | alta (2 de 2 confirmen) | La guia 7 de WordPress.org prohibix «Offloading assets […] that are unrelated to a service». `nano_cards/` i `img/` són il·lustracions de la interfície i d'una pàgina estàtica, no contingut del servei. El readme deia, a més, que es treien «per fer el paquet menut». | Text del readme corregit: ara parla de contingut del servei i diu què s'envia. **Resolta amb D1, opció B:** `nano_cards/` i `img/` ja viatgen al paquet. |
| F1 | alta → mitjana | L'origen per defecte no servix `towns/`, `nano_cards/`, `events/` ni `img/`, i per a un fitxer absent torna un 200 HTML. | Fallback a l'original afegit. Recordatori a l'empaquetador. **Desplegament: D2.** |
| R1 / F3 | mitjana | L'EXIF del visor i el reenquadrament fan `fetch` a un altre origen i `socdepoble.org` no envia CORS. | Capçaleres CORS a `vercel.json`, amb prova. **A Firebase, D2.** La degradació és neta: sense dades d'EXIF, sense cap error a la pantalla. |
| WPORG-2 / F7 | mitjana | El readme deia «no visitor data is sent», i és fals: s'envien l'IP, l'agent d'usuari i la pàgina. | Corregit, amb prova que l'afirmació no torna. |
| F2 | baixa (refutades R2 i ARCH-1) | Els builds sense política llegien una global de la pàgina: un canal per on l'amfitrió podia posar orígens. | Corregit: ara és una clau de l'entorn, que Vite deixa en `undefined` fora del directori. Una prova comprova que una global de la pàgina no fa res. |
| F5 | mitjana | Faltava el «fallback automàtic a l'original» del pla. | Implementat (`fallbackBessones.js`, amb proves). |
| F6 | mitjana | L'LCP de gentdelatorre.net, que usa el paquet autònom, no millora. | **Resolta amb D3:** l'autònom demana les bessones (DSC00410: de 6,8 MB a 291 KB). |
| T1 | baixa | Una prova del tractor llegia el JSON abans de mirar el codi d'eixida. | Corregit. |

**Baixes, no verificades pels refutadors:**

- **Corregides:**
  - PKG-1 / F9: l'empaquetador i el build tenien criteris d'origen diferents.
  - PKG-2 / T5: la regla d'única font i les bessones només sota `assets/`.
  - T2: l'asserció del cens era tautològica.
  - T4: les col·lisions amb `--eixida`.
  - T6: el temporal de l'escriptura atòmica no era ocult.
  - T7: el cens fallava si s'esborraven totes les bessones.
  - F10: les restes del directori no s'informaven.
- **Documentades, sense canvi:**
  - IMG-1: la `tpv_vinyeta.webp` antiga compta com a bessona de la `.jpg` exclosa. No té efecte visible: el codi només nomena la `.webp`.
  - IMG-2: la bessona de Benimassot perd el marcador COM amb la font de Wikimedia. L'original el conserva.
  - PKG-3 / F8: el build natiu també porta les 119 bessones (+27 MB) sense usar-les. Vegeu D3.
  - F11: no s'aplica (es referix a un altre pla).

### 4. Decisions pendents del Mestre (`requires_human_decision: true`)

#### D1 · Quines carpetes viatgen al paquet del directori: **DECIDIDA, opció B (Mestre, 16:12), aplicada**

Zip estimat del directori (deflate 9, com `creaZip`, més el bundle):

| Opció | Fora del zip | Zip | Guia 7 | Ordre del Mestre |
| --- | --- | --- | --- | --- |
| A | només `uploads/` | 17,4 MiB (15,7 amb tot en WebP) | ✅ | ✅ literal, però **no cap** |
| **B (decidida)** | `uploads/`, `towns/`, `fotos/`, `events/` (contingut del servei) | 11,0 MiB tal com estava; **9,26 MiB amb els ajustos de baix (zip real de 9.710.800 B)** | ✅ probable | ✅ la interfície es queda |
| C (anterior) | B més `nano_cards/` i `img/` | 6,3 MiB | ⚠️ risc a la revisió | ⚠️ les targetes nano són interfície |

**Resultat de B aplicada:** zip real de **9.710.800 B**. La meua estimació de l'estalvi en vinyetes era alta (1,3 MB); la real ha sigut de 0,53 MB, i els 768 px de `nano_cards/` han sigut imprescindibles (amb 1024 px, B faria 10,51 MiB).

**Nota per al Mestre:** les targetes nano també fan de capçalera a pàgines de la Consola i de text (`.hero-image`, a amplada completa). Al paquet del directori es veuran a 768 px; la Consola ja usava vinyetes de 480 px com a capçalera. Al web i al canal propi no canvia res: no hi ha política.

La proposta original de B, que és la que s'ha aplicat:

1. reduir el costat llarg de les bessones de `nano_cards/` (ara de 1024 px) a uns 768 px (≈ −1,5 MB);
2. convertir també les vinyetes no candidates de `ui/plugins/` (≈ −1,3 MB).

Això queda dins de «màxim 1600 px», però canvia les xifres literals de T2 per a dues carpetes. És un canvi d'una constant (`MITJANS_EXTERNS_DEL_DIRECTORI.prefixos`) i d'una passada del tractor.

#### D2 · Posar en marxa l'origen dels mitjans abans de publicar el directori

Cal desplegar a l'origen el `public/` actual, amb les bessones. Ara és `https://socdepoble.org` a Firebase; `SDP_ORIGEN_MITJANS` el pot canviar, per exemple, per un bucket públic de Supabase que replique `assets/`. A Firebase cal la mateixa regla CORS que ara porta `vercel.json`.

Sonda abans de publicar: cada fitxer extern i la seua bessona han de respondre amb `content-type: image/*`, no amb l'`index.html` de reserva. El script de la sonda és al scratchpad de la sessió (`sonda_origen.sh`); se'n pot fer una porta.

#### D3 · El paquet autònom (canal propi, Sollutia, gentdelatorre.net): **DECIDIDA, bessones a l'autònom (Mestre, 16:45), aplicada**

`politicaDeMitjans('autonom')` torna `{ origen: null, externs: [], bessones }`. L'autònom segella la política al bundle (substitució sense origen extern), i el plugin hi emet la bessona en lloc de l'original.

- **Coherència entre variants:** `verificaMitjans` admet que l'autònom declare bessones, però mai un origen extern, i exigix que les dues variants en declaren les mateixes. El canal signat porta la clau additiva `mitjans` de l'autònom.
- **Mesura** (build real de les dues variants i `empaqueta.mjs --prova`):
  - canal propi: **41.913.260 B** (135,6 MB abans del torn);
  - estàtic: 41.834.132 B;
  - directori: igual, 9.710.800 B.
  - Viatgen 130 bessones en lloc dels seus originals. Cap original no conviu amb la seua bessona dins del paquet.
- **Tros d'entrada** de l'autònom: 1.329.550 B, dins del sostre de 1.591.855 B.
- **Prova de fum de l'autònom** (bundle real, monolític per a jsdom):
  - a `/multimedia`, 154 imatges, de les quals 153 del paquet (106 en `.webp`), 0 de fora i 0 que hi falten;
  - 0 bloquejades, «TOTS (149)»;
  - el fons del Xat, en `.webp`;
  - també verificades `/consola`, `/projecte` i `/pobles`.
- **Proves afectades:**
  - `pesDelNucli.test.js` (el `[DEFECTE]` dels mitjans de la Gestoria) accepta ara l'original o la seua bessona: el mitjà continua dins del paquet del nucli.
  - Noves proves de config, de `verificaMitjans` i d'empaquetat amb l'autònom substituint.
- **El natiu (Capacitor) no canvia:** porta encara originals i bessones (+26 MB) sense usar-les. Aplicar-hi la mateixa política és el mateix canvi d'una línia a `vite.natiu.config.js`, i queda per a quan s'arrenque el natiu.

#### D4 · Versionar les bessones

Són 129 fitxers i 25,89 MB. El ganxo de pre-commit llig `git diff --cached --binary` amb un buffer de 16 MiB (`tooling/wiki/reflex_petorreta.mjs:451`), uns 13 MB de binaris per commit, així que cal fer-ho en lots:

1. `uploads/brain` i `uploads/empresa` (9,26 MB);
2. la resta d'`uploads/` (7,15 MB);
3. la resta de carpetes (9,46 MB).

Les bessones van amb el codi: sense elles, el zip del directori no cap.

#### D5 · Brossa del torn: la carpeta literal `socdepoble.org/~/` (a les 16:45 ja no hi era: algú l'ha retirada)

Fa 7,1 MB i té 19 fitxers. És la memòria cau d'un Chrome sense capçal que un verificador de l'Àrbitre va llançar des de l'arrel, a les 15:45:13: el mateix parany que avisa el tractor. No està versionada, però `git add -A` la incorporaria. Segons `core-neteja-brossa`, una carpeta de l'arrel es consulta i no l'esborre jo: es pot retirar des de `socdepoble.org` amb `rm -rf -- "./~"`, amb les cometes i el `./`.

### 5. Contrast amb l'auditoria de Gemini (1425)

**Coincidim en el fons.** Es pot convertir; el pla citava un `DetailMultimedia.jsx` que no existix (el real és `profile/DetallMultimedia.jsx`); el cens petaria; i cal la «Via de Convivència»: bessones al disc, exclusió al build i origen remot.

**Afirmacions de fet que el codi desmentix** (verificades per la lent de doctrina):

1. `empaqueta.mjs` no «avorta amb error» per sobre de 10 MB: només avisa i escriu el zip igualment.
2. No existixen `seleccionarCodificadorPerFitxer`, ni `MIDA_MAXIMA_PER_DEFECTE`, ni `QUALITAT_PER_DEFECTE = 84` (és 80; la maquinària fixa 84).
3. No existix `lligExifFinalWebp`, ni cap lectura dels «últims 64 KB» amb `exifr`. El visor recorre els trossos del RIFF amb peticions Range, i des d'un altre origen això necessita CORS: no és «100 % sòlid».
4. `TOWN_FALLBACK_IMAGES` són 9 imatges d'`uploads/brain/`, no rutes de `towns/` ni de `system/`.
5. No hi havia cap `onError` cap a l'original enlloc; ara sí (`fallbackBessones.js`).
6. Recomanava excloure `rag-index.json` del directori: trencaria la Wiki dins del connector.

### 6. Riscos residuals i deute observat

- **Suite de node: 2 fallades anteriors a este torn,** que no importen cap fitxer tocat ací:
  - `tests/backend_consolidacio.test.mjs` («storage: poble explícit…»): `ReferenceError: CODI_SEGON_FACTOR is not defined`. `storage.js` ara l'usa i la prova aïllada no l'injecta.
  - `tests/migracio-membres-organitzacio.test.mjs`: la migració `2610181915` redefinix permisos.
  - Les dues vénen del commit `ed6077ff` (13:54).
- **«Resolució» al visor del directori:** mostra la mida del fitxer que es veu (1600 px), no la de l'original. És la semàntica documentada a `panellDeLaFoto.js`.
- **Documentació desfasada, fora del meu abast d'escriptura:**
  - `AJUDA` d'`empaqueta.mjs` i `.agents/skills/core-empaquetat-wp/SKILL.md` diuen que el zip del directori va a `builds/directori/`; va a `builds/`.
  - La skill no parla encara de la política de mitjans.
  - Claude no escriu a `.agents/`; ho trasllade a MarIA.
- **El latent de la maquinària:** no passa el perfil ICC. Avui tots els perfils són sRGB; una foto Display-P3 d'un iPhone canviaria de color.

### Proposta d'Automillora

**Anàlisi del prompt.**

- **Contradicció interna:** T2 demana convertir «les imatges candidates», però l'ordre literal que dona les converteix totes (209). Hauria estat més eficient escriure l'ordre exacta amb el filtre, o escriure el criteri i deixar l'ordre a l'executor.
- **Criteri d'acceptació inabastable tal com està escrit.** T4 fixa «excloure `assets/uploads/`» i el criteri 4 fixa «< 10 MB»: les dues coses alhora no hi caben (17,4 MiB). Una mesura prèvia (`du` de `public/` sense `uploads/`) ho hauria dit en un minut. Proposta per a la plantilla `prompt_local`: un camp «Pressupost verificat» on el pla escriga la xifra que fa possible el criteri.
- **Falta de l'estat de l'origen.** Ni el prompt ni el pla no diuen que `socdepoble.org` és un desplegament del juny. Cal un camp «Estat dels serveis externs dels quals depén el pla».
- **Fitxer inexistent:** el pla cita `DetailMultimedia.jsx`. Proposta: que `document.mjs check` valide que cada camí citat existix.
- **Contradicció del 19.658:** la xifra de proves era la del migdia. Proposta: «la suite en verd», sense xifra fixa.

**Noves capacitats per a la Colmena.**

- Els workflows de Claude Code han fet en 25 minuts el que abans eren tres torns d'auditoria: cinc lents independents i dos refutadors per troballa. Proposta: que el prompt local demane «Àrbitre amb N lents i refutadors» i que MarIA el llance com a pas estàndard abans de tancar un pla.
- La prova de fum en jsdom del bundle real del directori ha resultat decisiva. Proposta: incorporar-la a `tests/` com a prova de build real, a demanda, perquè la vigilància de la política no depenga d'una sessió.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Ordre | Resultat |
| --- | --- | --- |
| T1, codificadors i cens | `node tooling/media/optimitzar_webp.mjs codificadors` i `cens` | `maquinaria` i `chrome`; 219 imatges, 125 candidates i 0 orfes abans; 338 imatges i 0 orfes després |
| T2, conversió | `… converteix public/assets --max 1600 --qualitat 84 --nomes-candidates --aplica --json` | 119 escrites, 6 saltades amb motiu, 0 errors, cap temporal residual |
| Integritat de les bessones | Àrbitre, lent d'imatges (Pillow i ImageIO, 119 de 119) | Descodificació, mides, alfa, EXIF i PSNR ≥ 34,7 dB: tot correcte |
| T3, cens | `npx vitest run src/sections/multimedia/censImatges.test.js` | Verd |
| Proves noves i afectades | `npx vitest run src/config src/sections/multimedia/censImatges.test.js` | 36 fitxers, 782 proves en verd |
| Proves de node afectades | `node --test` del tractor, `enxufe-empaqueta`, `standalone-build` i `natiu-build` | 104 en verd i 1 saltada (`dist-natiu/` absent, anterior) |
| T4, mida | build real de les dues variants en una còpia i `empaqueta.mjs --prova` | Opció C: 6.625.267 B. **Opció B (decidida): 9.710.800 B < 10.485.760 B** |
| Bessones noves de D1 | Pillow: descodificació, RIFF, mides esperades, aspecte, PSNR davant d'una referència Lanczos | 21 de 21 correctes; cap retall; PSNR mínima de 33,01 dB i mediana de 35,02 dB |
| T4 amb l'opció B, en temps d'execució | prova de fum del bundle nou a `/multimedia`, `/consola` i `/projecte` | `nano_cards/` i `img/` no es demanen mai fora; 41 imatges del paquet, totes presents; 0 bloquejades; «TOTS (149)» |
| T4, en temps d'execució | prova de fum del bundle real en jsdom (`/multimedia`, `/projecte`, `/pobles`, `/consola`) | 154 imatges i «TOTS (149)» a `/multimedia`; 132 externes; 0 bloquejades; només els 3 avisos d'entorn de sempre |
| T5, Vitest sencer (1a passada, 15:25) | `npx vitest run` | 1.150 fitxers, **19.677 proves en verd**, 89 saltades, 0 errors |
| T5, Vitest sencer (2a passada, després de les correccions) | `npx vitest run` | 1.151 fitxers, **19.681 proves en verd**, 89 saltades, 0 errors |
| T5, Vitest sencer (3a passada, amb l'opció B aplicada) | `npx vitest run` | 1.151 fitxers, **19.681 proves en verd**, 89 saltades, 0 errors; lint 0 i node, igual que abans |
| D3, mida i execució | build real de les dues variants, `empaqueta.mjs --prova` i prova de fum de l'autònom | Canal propi de 41.913.260 B i estàtic de 41.834.132 B; 0 imatges que falten al paquet, 0 de fora |
| T5, suites senceres amb D3 | `npm run lint`, `npm run test:node` i `npx vitest run` | Lint 0. Node: 992 proves, 985 en verd i les 2 fallades anteriors i alienes (§6). Vitest: 19.678 en verd i **3 fallades alienes a este torn**, a `src/css/components.abast.capes.test.js` (2) i `src/css/qualitat.tokens.test.js` (1). Les causa una edició en curs d'un altre agent, el selector `PaginaEmojis` de `src/css/components.css` (16:46:54), que porta temps literals de transició, un `scale(1.15)` en hover i els tokens sense declarar `--sdp-fons` i `--sdp-z-panell`. La passada de les 16:30, abans d'eixa edició, era tota en verd. |
| T5, node sencer | `npm run test:node` | 991 proves: 984 en verd i 2 errors anteriors i aliens (§6); la resta, saltades |
| T5, lint | `npm run lint` | 0 errors, 0 avisos |
| T5, portes | `npm run porta:olivera` | Eixida 0; només els avisos de sediment de l'índex, que ja hi eren |
| Document | `node tooling/wiki/document.mjs check --turn-id torn_6a5887e7… --file …` | `valid: true`, cap error |
| Tancament | `document.mjs plan` (pla 1425 vinculat al torn) i `node tooling/gates/tancament.mjs --check --turn-id torn_6a5887e7…` | `valid: false`, per causes fora del meu abast d'escriptura: falta el relleu a `.agents/ESTAT.md` i a `LEDGER.md` (els escriu MarIA), la signatura del LEDGER i el segell de regles ja eren trencats, i l'índex de l'Escriptori té enllaços morts cap a fitxers de `02_investigacio_ia/` evacuats (troballa també de Gemini). No he executat `--close`. |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Res no s'ha publicat ni desplegat.** No he fet cap commit (D4), no he signat ni pujat cap zip, i no he tocat cap servidor. Els zips de prova són a la còpia de treball del scratchpad, no a `wordpress-plugin/builds/`.
- **Res no s'ha mogut ni esborrat** fora dels fitxers que he creat. Els 119 `.webp` són nous; cap original no s'ha tocat.
- **Builds:** els d'esta sessió són de desenvolupament (`--prova`, node sintètic). La release real l'ha de compilar el Mestre amb `SDP_RELEASE=1`.
- **Les comprovacions en un navegador real** són en jsdom i Chrome sense capçal, no en un WordPress real. El CORS de producció s'ha comprovat amb `curl` contra `socdepoble.org`.
- **`.agents/ESTAT.md` i el LEDGER** no són del meu abast d'escriptura. El relleu per a MarIA és este informe.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261019_1425_prompt_alliberament_multimedia_i_conversio_webp]]
- [[261019_1425_pla_implementacio_alliberament_multimedia_i_conversio_webp]]
- [[261019_1425_auditoria_gemini_skills_i_multimedia]]
- [[261019_1345_acta_marmota_relleu_migdia_seguretat_i_wp]]
