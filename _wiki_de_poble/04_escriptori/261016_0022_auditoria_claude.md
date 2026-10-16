---
type: informe
status: esborrany
description: 'Informe de Claude Code al Gauntlet 261016: execució dels blocs 0-4, evidència de proves i límits del confinament local'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_60a0d776-7f83-435d-ab7d-fa26f6507f08:d11d5f98-68b2-40e9-b293-1f3af5010fcd
---
# Auditoria i execució de Claude al Gauntlet nocturn

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_60a0d776-7f83-435d-ab7d-fa26f6507f08:d11d5f98-68b2-40e9-b293-1f3af5010fcd |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-15T22:21:42.394Z |
| Modificació | 2026-10-16T03:10:00.000Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`), Claude Code a l'app d'escriptori |
| Tokens consumits | ≈ 26,5 M de subagents segons els comptadors dels workflows (sis de producte i un d'auditoria), més el fil principal (no mesurat) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-15T22:21:42.394Z: esborrany creat; contingut i verificació pendents.

- 2026-10-15T22:27Z · **Relleu 1 (canal viu).** Claude ha llegit el prompt `261016_0015_prompt_gauntlet_claude_codex_gemini`, el pla `261016_0015_pla_implementacio_gauntlet_autonom` i l'acta `261016_0025_acta_marmota`. Torn propi `torn_60a0d776-7f83-435d-ab7d-fa26f6507f08` (actor `claude`, abast `code`). Reconeixement de només lectura en marxa: sis lectors paral·lels (Lector RSS, imatges, WordPress, perfil, proves roges, Feedly).
- 2026-10-15T22:50Z · **Relleu 2.** Reconeixement acabat (6/6). Llegits sencers `261016_0021_auditoria_codex`, `261016_0022_auditoria_gemini4` i `261016_0035_acta_marmota_codex_gauntlet`. **Claude respecta les reserves de Codex** (`paginaDeText.test.js`, `PublicacioDetall.imatgesPropies.test.jsx`, `PageFrame.jsx`, `UniversalPage.jsx`, proves d'empaquetat i `tests/gauntlet-codex*`) i les de Gemini (tractor WebP i la seua prova). Claude assumix els tres P2 que Codex li assigna: focus i RAF de `UniversalWorkspace`, seqüència de l'ACK i baixa fallida del canal (`src/data/supabase/xat.js`). Execució en marxa en conjunts de fitxers disjunts. **A**: fallback WordPress. **B1**: dignitat de persona, ANIMAL→`ia`, poble al directori i seed de Nano Banana. **B2**: llicència de sèrie a «El compte». **C**: retirada de la T50. **E**: xat. **F**: workspace. **R**: verificació de feeds reals amb el navegador. Darrere de F va **D** (Lector sobre `UniversalWorkspace`), i darrere de B2, **G** (canonada d'imatges).
- **Les dues proves roges de la CI base les ha resoltes Codex** dins de la seua reserva. Claude no les toca: el seu lector en va veure tres estats del disc en tres minuts.
- 2026-10-15T23:45Z · **Relleu 3.** Primera onada acabada (9/9 fronts). Fet al disc:
  - Fallback WordPress `Carregant el mur...`, amb el filtre `no_texturize_tags`: sense ell, el WordPress 7.1.2 real el pintava «Carregant el mur…».
  - Dignitat de persona a la fitxa pública i a `ConnexioDetall`.
  - Els ANIMAL passen a `ia` des d'una font única (`tipusDAgent`, a `src/data/agentsSeed.js`).
  - El poble i l'avatar a les targetes del directori.
  - Drets de sèrie de les notes a «El compte».
  - Retirada de la T50 de l'editor.
  - Recompte opcional a l'arbre d'`UniversalWorkspace`.
  - Purga de la llavor del Lector en DEV i bookmarklet amb `desti`.
  - Avatar a 400 px, MIME real de les pujades i vinyeta del TPV en WebP.
  - Fonts RSS reals verificades al navegador (taula a Troballes).
  - Prompt (01:08) i pla (01:18) rellegits sencers. El Bloc -1 ja el tenen resolt Codex i Gemini: Claude no hi torna.
- 2026-10-16T00:55Z · **Relleu 4.** Segona onada acabada (5/5).
  - Porta `workspace` del nucli 1.2.0 (`contracteNucli.js`, `nucliModuls.js`, guarda nova a `vite.modul.config.js`). Build real d'un mòdul de prova amb la porta, sense afluixar cap guarda.
  - `/app/lector/noticies` muntat sobre `UniversalWorkspace`: arbre amb recomptes, llista amb la fila per defecte, sense imatges i sense cap `UniversalCard`, i lectura al detall. Enllaços profunds vells conservats.
  - Capçalera del Perfil 1:1 exacta de 1200, avatar exacte de 400, pressupost <80.000 B amb error honest i reserva JPEG en Safari 16.
  - EXIF per defecte amb la casella «Conserva la ubicació i la data de la foto» (mòdul `exifIncrustat.js`, sense la miniatura de l'IFD1).
  - Text públic `publicar_mapa` reconciliat.
  - Neteja de comentaris i censos.
  - Prompt i pla rellegits sencers a les 02:45 (Blocs 3.5 i 3.6, Onades 1.1 i 1.2).
  - **Tercera onada en marxa:** els cinc contraexemples de Codex de 02:04-02:26:
    - graf TIFF (MakerNote/SubIFD) i límits per format;
    - càmera sense GPS ni data;
    - orientació del WebP;
    - avatars divergents després del 403;
    - scroll del Lector.
  - Al costat dels contraexemples, també en marxa:
    - Bloc 3.5: rutes `/javillinares`, `/socdepoble` i `/rentonar`, un perfil per identitat, poble obligatori, SQL del 403 i SEO/OG;
    - Bloc 3.6: quatre actors fixos al xat i la IAIA a localhost;
    - dues proves roges de text: `qualitat.nucliApps.test.js:203` i `destinsControl.test.js`.
- 2026-10-16T02:10Z · **Relleu 5.** Tercera onada acabada (10/10).
  - **EXIF:**
    - `analitzaTiff` recorre el graf sencer (IFD0, Exif, GPS, Interop i SubIFD, amb el MakerNote) i torna l'estat explícit «no es pot conservar» en lloc d'un null silenciós.
    - Sostre per format: JPEG 65.527 B; WebP limitat només pel pressupost.
    - La casella també apareix per a l'EXIF de càmera sola.
  - **Orientació:** lector EXIF multiformat i sonda per format; el gir s'aplica una sola vegada al retallador i a `compressImage`. Integra la proposta de Codex, revisada críticament.
  - **Quadrat als camins genèrics:** capçalera de les Notes 1:1 exacta de 1200, desat local sense recompressió i avatar T46 exacte de 400.
  - **Perfil:** una sola font d'imatge per a l'editor, la barra i la TargetaViva; un 403 deixa la finestra oberta amb un avís honest.
  - **Rutes i poble:** `/javillinares`, `/socdepoble` i `/rentonar` a `App.jsx`. Poble «La Torre de les Maçanes» a les tres identitats i obligatori a l'alta i a l'edició. Duplicat `soc-de-poble` del `seed.sql` corregit.
  - **SQL del 403:** migració `supabase/migrations/2610160250_perfil_update_propi.sql`, NO aplicada. El 42501 és de privilegis de columna, no de RLS.
  - **SEO/OG:** socdepoble.org el servix **Firebase Hosting amb una versió del 11-06-2026**. Per això tota URL, inclosa la PNG de l'OG, torna l'HTML vell: el defecte és del desplegament, no del repo. `index.html` porta ara `og:url`; `vercel.json` ja no captura els actius.
  - **Xat:** quatre actors permanents i missatge automàtic literal de Javi per al visitant anònim. La fila de la IAIA de localhost passa per `?amb=<UUID>` en llavor i en local.
  - **Lector:** scroll a dalt en canviar de carpeta.
  - **Proves de text:** posades al dia.
  - **Quarta onada curta en marxa:** «Marca-ho tot» amb cerca, avisos de la foto a DetallAjust, «Les vistes» amb la mateixa font d'avatar, cens i versió del catàleg, comentaris rancis, navegació i títols de les rutes canòniques, i un sol «Javi Llinares» al cercador.
- 2026-10-16T02:35Z · **Relleu 6.** Quarta onada acabada:
  - «Marca-ho tot» respecta la cerca, via `visibleItemIds` i `filtered` opcionals a `renderDetail`.
  - Tots els avisos de la foto ixen tal qual a DetallAjust.
  - «Les vistes» mostra la mateixa foto que l'editor.
  - Versió del catàleg al dia, i rutes canòniques a `sections.js`, `RouteSEO` i el sitemap.
  - Un sol «Javi Llinares» al cercador, fusionat per identitat declarada.
- **Bateria completa (Claude, 04:10:47-04:21):** `npx vitest run src tests` dona 1.057 fitxers i **18.272 proves passades, 0 fallades**, amb 89 omeses. Node: el build real `standalone-build` passa 31/31; plugin, conformitat, runtime, lint de sessió, xat, lògica, enxufe i política de la suite donen 95 passades, 0 fallades i 4 TODO de diagnòstic heretats.
- **Auditoria adversarial pròpia, en dues fases (cacera i refutació independents):** 12 caçadors (6 grups × 2 lents) han fet 62 troballes. La refutació **n'ha confirmat 39** i n'ha refutat 23 (37 %). Totes les confirmades estan en correcció a la cinquena onada, llevat de les que són decisions del Mestre (vegeu Límits).
  - Les quatre P1:
    - pressupost de 80 KB impossible en JPEG (Apple);
    - previsualització JPEG dins del MakerNote;
    - `/javillinares` «Perfil no trobat» en remot;
    - sitemap cap a eixa ruta.
  - **Mesura real de Claude amb el codificador de Chromium, fotos reals del poble a 1200×1200:** amb l'escala 0,8→0,4, `DSC00410.JPG` i `P_20161028_150735.jpg` no caben en 80.000 B ni en WebP (90.315 i 91.236 B a 0,4). En JPEG calen qualitats de 0,15 a 0,2. Correcció en curs: cerca binària de la qualitat més alta que cap.
- 2026-10-16T03:35Z · **Relleu 7 (final).** Cinquena onada acabada (8/8): totes les troballes confirmades de la refutació estan corregides o elevades com a decisió. Vitest sencer en verd (18.386/18.386 actives). Informe tancat. **Cadascuna a sa casa:** Claude no ha creat cap cron ni schedule, no deixa cap procés de fons viu i ha tancat la pestanya pròpia del navegador. No ha fet cap commit, cap desplegament ni cap escriptura a `tooling/`, `.agents/` ni `01_produccio/`.
- **Segona onada (planificada al Relleu 3):** (a) porta `workspace` del nucli (1.2.0) i el Lector muntat sobre `UniversalWorkspace`; (b) Llei del Quadrat estricta: capçalera 1:1 exacta de 1200, avatar exacte de 400, pressupost <80.000 B amb error honest, EXIF conservat per defecte amb opt-out (pla §0.1.3) i text públic de privacitat reconciliat; (c) neteja de comentaris, cens i textos rancis que els fronts han deixat anotats.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Balanç per blocs (estat del disc, sense commit)

**Bloc 0 · Lector RSS.**
- `/app/lector/noticies` ja és un `UniversalWorkspace` (patró del Bloc de notes). Té l'arbre Hui / Per a després / categories / fonts amb el recompte de no llegides, una llista de títols sense cap `UniversalCard` ni imatge de fora, i la lectura al detall. Hi entra per una **porta nova del nucli, `workspace` (VERSIO_NUCLI 1.2.0)**, que no afluixa cap guarda de clausura; una guarda nova de `vite.modul.config.js` impedix incrustar l'espai dins d'un mòdul.
- Purga de mocks: la llavor fictícia només s'encén amb `VITE_SDP_LECTOR_LLAVOR === '1'`; en DEV sense eixe literal, el Lector mostra l'estat buit honest.
- El bookmarklet admet `desti` (`bloc` o `lector`).
- Correccions de la refutació: «Marca-ho tot» respecta la cerca i ho diu al botó; el scroll torna a dalt en canviar de carpeta; desmarcar «Per a després» ja no et canvia de carpeta; l'Arrere del sistema en estret torna a la llista; una carpeta amagada ja no desquadra el detall; «Hui» ja no es recalcula en obrir una notícia.
- Feedly s'ha estudiat amb el navegador integrat: el connector REA està denegat pel hook local.
- **No fet:** les fonts reals no estan connectades, perquè requerixen un connector de servidor i una ADR del Mestre (taula verificada davall).

**Bloc 1 · Llei del Quadrat i EXIF.**
- **Mides i format:**
  - La capçalera és 1:1 exacta de 1200, tant al Perfil com a les Notes.
  - L'avatar és exacte de 400, també al retallador T46.
  - El logotip es queda a 600, sense ordre de canvi.
  - El File porta sempre el MIME real; en WebKit la reserva és JPEG.
- **Pressupost estricte <80.000 B.** Primer prova la qualitat 0,8; si no hi cap, busca per cerca binària la qualitat més alta que hi cap, amb 7 codificacions com a màxim. Només dona un error honest si ni la qualitat mínima (0,04) hi cap. Les mesures reals de Chromium sobre quatre fotos del poble guien la reixa i estan anotades a la capçalera de `src/utils/pujadaImatge.js`.
- **EXIF conservat per defecte (pla §0.1.3), amb la casella d'opt-out:**
  - **Què es publica:** el graf IFD0, Exif, GPS, Interop i SubIFD, sense la miniatura de l'IFD1 i amb l'orientació a 1.
  - **MakerNote:** el que porta un JPEG dins es retira.
  - **Etiqueta i ajuda:** es decidixen pel que es publicarà de veres (ubicació, data, càmera, números de sèrie, nom de persona).
  - **Lectura no acabada:** si es desa abans que acabe la lectura, el diàleg no desa sense haver mostrat la casella.
  - **Re-enquadrar:** re-enquadrar una adreça ja desada conserva l'EXIF.
  - **No conservable:** un EXIF que no es pot conservar dona un avís honest, mai una foto neta en silenci.
- **Orientació:** el lector és multiformat (JPEG, PNG i WebP) i la sonda va per format; el gir s'aplica una sola vegada. Integra la proposta de Codex, revisada críticament.
- **Text públic** de `publicar_mapa` reconciliat amb el mandat.
- **Vinyeta del TPV:** el plugin carrega `tpv_vinyeta.webp` (1200×1200, 77.746 B), sense cap personatge de tercers. El systemPrompt de Nano Banana ja no nomena cap sèrie ni marca de tercers.

**Bloc 2 · WordPress.**
- `marcatge.php` emet `<soc-de-poble …>Carregant el mur...</soc-de-poble>`, amb el filtre `no_texturize_tags`: sense ell, el WordPress 7.1.2 real el convertia en «Carregant el mur…».
- Proves de forma i de conducta amb PHP real i amb `wptexturize` real.
- **No publicat:** cal una release 1.1.4 signada pel Mestre.

**Bloc 3 · Perfil (decisions de la Fase 1).**
- **Llicència de sèrie de les notes a «El compte»:** és un ajust `drets-notes` amb `CopyrightPage` en àmbit `compte`.
  - La preferència es sincronitza amb el servidor en carregar la sessió de qualsevol dispositiu.
  - L'acceptació de CC0 diu el que és cert.
- **Els quatre ANIMAL:** són `ia` des d'una font única, `tipusDAgent`.
- **Directori:** totes les targetes porten el poble i l'avatar a la boina.
- **Retirada de la maquinària T50** de l'aside de l'editor.
- **Restaurada la dignitat de persona a la fitxa pública** (regressió de la Fase 1: hi tornaven la píndola «Persona» i el «© Nom»). També a `ConnexioDetall`.

**Bloc 3.5 · Mandat d'urgència.**
- **Rutes canòniques:** `/javillinares`, `/socdepoble` i `/rentonar` tenen una sola fitxa per identitat, i el duplicat `soc-de-poble` del `seed.sql` està corregit.
  - En remot, les tres identitats del Mestre fan servir la fitxa del paquet quan el servidor no en dona cap. És una excepció a D12, revocable per MarIA. Es reconeixen només per l'identificador declarat, mai pel nom ni per un slug d'un altre registre.
- **Poble:** «La Torre de les Maçanes», obligatori a l'alta i a l'edició de les organitzacions. Ja no se sobreescriu el poble d'una organització existent; el reintent del poble funciona.
- **403:** migració `2610160250_perfil_update_propi.sql`, NO aplicada. El 42501 és de **privilegis de columna**: una política sola no el cura. Té la guarda de RLS, el GRANT UPDATE de CAMPS_PERFIL i una sola política d'UPDATE propi.
- **Imatges:** una sola font per a l'editor, la barra taronja, la TargetaViva, «Les vistes», «El compte» i la llista. Un 403 deixa la finestra oberta amb un avís honest.
- **SEO/OG:**
  - La causa és el desplegament (Firebase Hosting, versió de l'11-06-2026), no el repo.
  - Sense `og:url` estàtic.
  - `vercel.json` ja no captura els actius.
  - Sitemap amb les rutes canòniques.

**Bloc 3.6 · Xat.**
- Quatre actors permanents (Sóc de Poble, Javi Llinares, Gent de la Torre i IAIA MarIA), comprovats al navegador.
- Per a qui no té sessió, el fil de Javi és de només lectura amb el literal «Este missatge és automàtic: per a poder parlar amb mi has de registrar-te.».
- Javi no es reconeix mai pel nom: no hi ha suplantació per homònim.
- La fila de la IAIA a localhost passa per `?amb=<UUID>` en llavor i en local, i ja no desapareix després de comentar a /iaia.
- **No fet:** la intel·ligència cultural de la IAIA és condicional i no s'ha començat.

**Bloc 4 · Defectes assignats per Codex.**
- Focus i RAF de `UniversalWorkspace`, ACK amb `seq` invàlid, i baixa del canal amb `'error'`. Tots tenen regressió verda; part dels pegats eren de Codex i Claude els ha completat o verificat.
- Les dues proves roges de la CI base les va resoldre Codex.

### Fonts RSS reals verificades (Bloc 0, per al connector de servidor)

Verificades el 16/10/2026 amb el navegador integrat. Cada URL s'ha obert i ha tornat XML vàlid. No s'ha iniciat cap sessió. Al consentiment de YouTube s'ha triat «Rechazar todo».

| Font | Feed verificat | Estat |
| --- | --- | --- |
| Emowe (blog) | `https://emowe.com/rss.xml` | RSS 2.0 viu (170 elements, últim 14/10/2026). És l'únic amb `Access-Control-Allow-Origin: *`. |
| Emowe (YouTube) | `https://www.youtube.com/feeds/videos.xml?channel_id=UCWNdNma5sbMELOhpu6qD8Sg` | Atom viu (últim 14/10/2026) |
| Xavier Mitjana (YouTube) | `https://www.youtube.com/feeds/videos.xml?channel_id=UCp2Zmdh40GJJJ2T5vWsMZDA` | Atom viu (últim 14/10/2026) |
| Xavier Mitjana (web) | `https://iaenaccion.com/feed/` | Vàlid però abandonat: 4 elements de proves de 2024 |
| Jon Hernández (YouTube) | `https://www.youtube.com/feeds/videos.xml?channel_id=UCl5-lvQyfILb-l2abPk4Ntg` (canal, 12 Shorts de 15) · `…?playlist_id=UULFl5-lvQyfILb-l2abPk4Ntg` (només vídeos llargs) | Atom viu (últim 15/10/2026) |
| Jon Hernández (web) | `https://www.jonhernandez.education/feed/` | Vàlid, però només capítols de curs (febrer de 2025) |
| Ben Cord (YouTube) | `https://www.youtube.com/feeds/videos.xml?channel_id=UCpq8lHHliCS3oBt-gfL0bKQ` | Atom viu (últim 12/10/2026) |
| Ben Cord (Skool) | — | Sense RSS i comunitat privada: no es pot sindicar |
| Migue Baena (YouTube) | `https://www.youtube.com/feeds/videos.xml?channel_id=UCX_dT6nVtCIHRo_GFOsWK2A` (canal, 11 Shorts de 15) · `…?playlist_id=UULFX_dT6nVtCIHRo_GFOsWK2A` | Atom viu (últim 15/10/2026) |

**Conseqüència d'arquitectura:** cap navegador pot llegir els feeds de YouTube, ni `iaenaccion.com` ni `jonhernandez.education` (CORS bloquejat, comprovat a la consola). El connector ha de córrer al servidor i el Lector ha de llegir-ne la còpia. YouTube només torna els 15 elements més recents, sense paginació: cal sondejar periòdicament i deduplicar per `yt:videoId`. Les miniatures (`i3.ytimg.com`) exposen la IP a Google, i `legalContent.js:186` promet bloquejar les imatges externes: el connector les ha de descarregar o ometre. Les llistes `UULF` no estan documentades per Google: convé conservar també el `channel_id`. És un canvi de backend: cal l'ADR del Mestre (AGENTS §8). `requires_human_decision: true`.

### Tractor WebP de Gemini (lectura creuada a l'Olivera)

- `tooling/maquinaria/convertir_a_webp.mjs:474` crida `python3` amb un script Pillow incrustat (`:390-430`). És una dependència de sistema que no està declarada. Una màquina o una CI sense Pillow no pot convertir. Contradiu la Pedra Seca «sense dependències tòxiques» o, com a mínim, s'ha de documentar a l'eina.
- Per a arribar al pressupost aplica de manera silenciosa un difuminat gaussià de fins a 2,2 px i qualitats de fins a 1 (`:413-415`). L'eixida compleix els bytes, però pot perdre definició sense cap avís. Proposta: informar del radi i la qualitat finals al resultat i fallar per sota d'un llindar.
- La vinyeta del TPV generada pesa 77.746 B, no els 81.590 que deia el Relleu 2 de Gemini. G (Claude) ho ha comprovat llegint la capçalera RIFF/VP8X: 1200×1200, <80 KB. Si el `.jpg` de partida feia 1024 px, el `.webp` de 1200 és una ampliació. A més, la il·lustració porta la marca real «LICOR 43» en una botella: és una marca de tercers que ha de valorar el Mestre.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les ordres són reproduïbles des de l'arrel. Són talls de l'arbre compartit, sense commit: Codex i Gemini també hi escrivien.

| Comprovació | Ordre | Resultat |
| --- | --- | --- |
| Vitest sencer (final) | `npx vitest run src tests` (inici 05:26:02, 485 s) | **1.062 fitxers passats, 6 omesos; 18.386 proves passades, 89 omeses, 0 fallades** |
| Vitest sencer (abans de la cinquena onada) | mateixa ordre (inici 04:10:47) | 1.057 fitxers; 18.272 passades, 0 fallades |
| Build real del paquet | `node --test tests/standalone-build.test.mjs` | 31/31 (monolític i trossejat) |
| Connector, conformitat, lint i política de la suite | `node --test tests/enxufe-plugin.test.mjs tests/conformitat-amfitrio.test.mjs tests/lint-sessio.test.mjs tests/lint_xat.test.mjs tests/node-suite-policy.test.mjs tests/natiu-build.test.mjs` (més el build) | 113 proves: 112 passades, 0 fallades, 1 omesa (`dist-natiu/` no existix) |
| Lint de lògica i d'enxufe (abans de la cinquena onada) | `node --test tests/lint_logica_usuari.test.mjs tests/lint_enxufe.test.mjs …` | 0 fallades; 4 TODO de diagnòstic heretats |
| Segell de skills | `node tooling/gates/segella.mjs` | «sense canvis» (reconciliat per Gemini) |
| Porta RLS | `node tooling/gates/tractor-rls.mjs` | exit 1 amb una sola infracció R4, un fals positiu previ de `2610081401` (comentari «només»); la migració nova no n'afig cap |
| Navegador integrat (llavor, localhost:3340) | `/javillinares`, `/rentonar`, `/perfil`, `/xat` | fitxa única amb el poble i sense píndola «Persona»; directori amb la boina del poble; quatre actors al xat amb el literal de Javi. Pestanya pròpia tancada |
| Pesos reals | `canvas.toDataURL` de Chromium sobre quatre fotos reals a 1200² | taula a la capçalera de `src/utils/pujadaImatge.js` |

**Auditoria adversarial pròpia.** 12 caçadors han fet 62 troballes i un escèptic independent ha revisat cadascuna. N'ha confirmat 39 i n'ha refutat 23. Les confirmades s'han corregit amb una prova roja abans del pegat, llevat de les que són decisions del Mestre (Límits). **No acreditat:** cap navegador WebKit ni Safari 16 real, cap base de dades remota, cap desplegament i cap ESLint per CLI directa (el hook el bloqueja; el lint s'ha acreditat per les proves de qualitat que el criden).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- El hook `tooling/gates/hooks-local.mjs` denega el connector REA (`mcp__rea__*`): Feedly s'estudia amb el navegador integrat, que el hook sí admet.
- La shell només admet lectures elementals, `npx vitest run` i `node --test tests/…`; cap script de `tooling/` fora de la llista blanca.
- Tota escriptura a `tooling/`, `.agents/`, `scripts/` i `package.json` exigix `executor-mutacio.mjs` amb una lease signada del Reflex. Claude no en té: `tooling/maquinaria/convertir_a_webp.mjs`, `.agents/ESTAT.md` i `.agents/LEDGER.md` queden fora del seu abast escrivible aquesta nit.
- El hook de postús `segell-auto.mjs` va informar de «segell divergent» des de la primera ordre de Claude (`segella.mjs`: hash actual 3c4eee5c contra el segellat 67862594). Era anterior a aquest torn. Gemini l'ha reconciliat, i a les 22:49Z `node tooling/gates/segella.mjs` torna «sense canvis, 3c4eee5c».
- **Contradicció elevada a MarIA (Fusible), ara resolta pel pla §0.1.3 (01:18):** «EXIF conservat per defecte, amb opt-out explícit de la persona; l'esborrat per defecte queda superat pel mandat humà». Claude l'executa a la segona onada (G2b). Hi afig una salvaguarda: es lleva la miniatura de l'IFD1, perquè és una còpia de l'original sense retallar. Els camins sense cap moment per a l'opt-out (imatges enganxades) conserven la neteja. El text que es va elevar era aquest: el Bloc 1 ordena preservar l'EXIF (GPS i data) dins del fitxer. Hi van en contra l'ADR multimèdia D4/D6 (`02_investigacio_ia/261003_1330_onada4_claude/ADR_MULTIMEDIA_FONT_UNICA.txt:39-50`, que a la línia 99 descarta explícitament conservar-lo dins del fitxer), el codi de pujada (`src/utils/imageUtils.js:6-10`) i la promesa pública «esborra totes les dades EXIF» (`src/sections/text/pageContent.js:340,344`). El tractor de Gemini (`tooling/maquinaria/convertir_a_webp.mjs`) incrusta el bloc EXIF amb GPS dins del WebP. Si s'aplica a fotos publicades a `public/assets` (on hi ha fotos amb segment Exif, p. ex. `uploads/poble/la-torre-de-les-macanes/DSC00320.JPG`), publica coordenades exactes. *(Text històric del Relleu 2: després de la resolució del pla, Claude SÍ que ha implementat la conservació per defecte, amb la casella d'opt-out; vegeu Troballes.)*

### Decisions del Mestre o de MarIA (`requires_human_decision: true`)

**Per al matí (beta-testers per WhatsApp).**
1. **Desplegar socdepoble.org.**
   - Avui el servix Firebase Hosting (projecte `soc-de-poble`) amb una versió de l'11-06-2026: tota URL, inclosa la PNG de l'OG, torna el mateix HTML sense meta.
   - El repo no té `firebase.json`; S2 en proposa un de mínim (`public: dist`, reescriptura `**` → `/index.html`).
   - Ordres: `npm run build`, i després `firebase deploy --only hosting --project soc-de-poble`.
   - **Risc de privacitat:** el `dist` actual publicaria per primera vegada `rag-index.json` i `slugIndex.json`, amb la Wiki dins (inclòs `_wiki_de_poble/02_saber/perfil_psiquiatric.md`). Cal decidir abans `ignore`.
   - Verificació després del desplegament: `curl -sI https://socdepoble.org/assets/system/ui/og-socdepoble-1200x630.png` ha de donar `image/png`. Després, cal fer «Scrape Again» al depurador de Facebook.
2. **Imatge OG massa pesada.** Fa 530.885 B; WhatsApp sol no pintar previsualitzacions de més d'uns 300 KB (llindar empíric). Proposta: una JPG de 1200×630 per davall de 300 KB, canviant alhora `index.html`, `useSEO.js`, `seo.php` i el generador del manifest SEO de `tooling/`.
3. **gentdelatorre.net** (Yoast SEO): posar la imatge del lloc i la descripció a Yoast. No és un defecte del connector.
4. **Migració del 403** (`2610160250`): abans d'aplicar-la, executar les quatre consultes de només lectura de la capçalera; després, comprovar que el PATCH de `profiles` torna 200 i una fila.
5. **Release 1.1.4 del connector**, signada amb la clau privada (fora del repo), perquè l'esquelet `Carregant el mur...` arribe als WordPress.

**Producte.**

6. **Comptes remots.** Declarar els UUID de Javi, Sóc de Poble i El Rentonar (`IDS_REMOTS_FUNDACIONALS`, `src/data/identitatsSeed.js`). Sense això:
   - la fila de Javi del xat en remot amb sessió només mostra un avís honest;
   - el «Escriu-li al xat» de la fitxa del paquet porta a un id que no és un UUID.
7. **Excepció a D12** per a les tres identitats en remot (`PerfilPublicSection.jsx:205-222`). És revocable i és el que demana el pla, Onada 1.5.
8. **Connector RSS de servidor** (Edge Function o connector de l'amfitrió) amb l'ADR del Mestre. La taula de feeds verificats és a Troballes.
9. **EXIF:**
   - política dels bytes orfes quan hi ha MakerNote (es publiquen);
   - estendre la detecció de miniatures a l'IRB de Photoshop (0x8649) i a l'XMP;
   - les imatges enganxades i l'ordre «/» Imatge continuen netes perquè no tenen cap moment d'opt-out (Codex demana «tota foto»);
   - l'avatar d'una persona publica de sèrie el GPS (és el mandat, i l'ajuda ho avisa).
10. **Qualitat mínima del pressupost (0,04).** Una foto molt densa pot eixir amb blocs visibles. Pujar el mínim faria que se'n rebutjaren més.
11. **CC0 de sèrie:** cada nota nova naix CC0 sense una acceptació pròpia. És una decisió legal.
12. **Doctrina P1-R1** («un sol esquelet»): el Lector munta `UniversalWorkspace` per ordre del Bloc 0. Cal escriure'n l'excepció.
13. **Frontissa de contingut:** les pàgines `drets-autor` i `publicar_mapa` han canviat. El pre-commit demanarà `node tooling/gates/frontissa-contingut.mjs --aprova <pàgina> --per Mestre`.
14. **Làpides del Lector:** `git rm src/apps/lector/vistes/Carpetes.jsx src/apps/lector/vistes/Fonts.jsx`. El hook bloqueja `rm`.
15. **Xat en llavor:** apareixen dues files «Sóc de Poble», la comunitat (Avisos, General) i el suport sintètic. Cal triar el nom de la de suport. Observat al navegador.
16. **Petites decisions de redactat i conducta:**
   - «Rentonar» o «El Rentonar»;
   - el bookmarklet cap al Lector només té destí amb un port de notícies (SN-R1);
   - en estret, el segon Arrere ensenya «Hui»;
   - ratificar el canvi de la regla «camí i consulta» → «camí» d'AppLector;
   - la marca «LICOR 43» de la vinyeta del TPV.

### Retroalimentació de la plantilla `prompt_local` (punt 4 del protocol)

- **Declarar el confinament real** de l'entorn d'execució. Esta nit el hook ha denegat REA, la shell no elemental, `git diff` amb ruta i tota escriptura a `tooling/` i `.agents/`. Ordenar a Claude «usa REA» o «crea el tractor a `tooling/`» sense lease converteix tasques en impossibles.
- **Versionar el prompt i el pla** quan canvien en calent. Esta nit han canviat tres vegades (Bloc -1, Blocs 3.5 i 3.6, EXIF) amb el Registre a `1.0.0` i la data de modificació congelada. Una línia d'Historial per canvi estalviaria relectures a cegues.
- **Distingir mandat humà de resolució de MarIA**, amb data i autor. L'EXIF i D12 han tingut lectures contradictòries entre agents.
- **Una taula de reserves de fitxers** per agent dins del prompt mateix. Ara les reserves viuen en informes que creixen sense parar.
- **Cadència del canal viu:** «cada bloc lògic» és més realista que «cada 10-15 minuts» quan un bloc és un workflow de 30-60 minuts.

### Per a Gemini i Codex (lectura creuada)

- **Tractor WebP de Gemini:** no lleva la miniatura de l'IFD1. Publica dins del WebP una còpia de l'original sense retallar. Cal aplicar-hi la mateixa preparació que `analitzaTiff`. També té la dependència no declarada de Python/Pillow i un difuminat silenciós.
- **`tooling/gates/tractor-rls.mjs` (R4):** dona un fals positiu amb un comentari de `2610081401_organitzacions_poble.sql:21`, on la regex captura «nom» de «només».
- **Plantilla de la Wiki `prompt_nano_banana.md`:** encara nomena una sèrie de tercers i l'arrossega a `wikiManifest.js`.
- **Codex:** convé repetir la bateria de Chromium/Pillow sobre el codi final (geometria i EXIF de producte). Els oracles de Claude són de jsdom; la mesura de pesos és de Chromium real.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
