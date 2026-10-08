---
type: informe
status: esborrany
description: 'Auditoria adversarial del prompt 261007_1628: xats sintètics de Sóc de Poble i la IAIA, 403 del perfil, RSS i Bàscula, Consola i imatge damunt de l''H1.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_162b2a6a-bbf9-482b-8e49-3315f7a65684:3e20b766-fcb0-4fcc-90a2-7e695bfdb67d
---
# Auditoria adversarial: xat per defecte, perfil, Panell, Consola i TipTap

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_162b2a6a-bbf9-482b-8e49-3315f7a65684:3e20b766-fcb0-4fcc-90a2-7e695bfdb67d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-07T15:10:47.002Z |
| Modificació | 2026-10-07T17:55:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), orquestrant workflows de subagents |
| Tokens consumits | ≈ 42 M de subagents mesurats pels workflows (auditoria 27,0 M; esmenes 6,2 M; onada 1 3,6 M; xat 1,0 M; onada 3a 3,0 M; Bàscula 0,4 M); les onades 3b i del paquet es van aturar sense recompte. Tancat per l'alerta de quota setmanal (96 %). |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-07T15:10:47.002Z: esborrany creat; contingut i verificació pendents.

2026-10-07T15:20Z · Torn `torn_162b2a6a` obert. Llegits el prompt 261007_1628, el pla 261007_1645 i l'acta 261007_1645. Canal viu a `02_investigacio_ia/261007_1715_auditoria_claude/` (RELLEU_00 a RELLEU_03).

2026-10-07T15:20–17:10Z · Cacera i refutació: `wf_ac5d8423-31f` (181 agents: 7 peces de l'encàrrec i 8 dimensions adversarials; cada troballa passa per 1 o 2 verificadors que la intenten refutar) i `wf_7602dd60-f58` (esmenes del pla: editor, històric i Targeta Viva).

2026-10-07T16:40–19:45Z · Implementació en onades amb revisió adversarial per peça: onada 1 (`wf_6938b853-fd5`), xat per defecte (`wf_a9342bd9-52f`), onada 3a (`wf_d1667a5c-01b`), onada 3b (`wf_0190dd64-d5d`, aturada amb la revisió de l'històric pendent) i retirada de la Bàscula (`wf_666f8448-1bf`). La decisió 5 (paquet trossejat, `wf_56e5733b-af2`) es va aturar en la fase de disseny, abans de tocar cap fitxer.

2026-10-07T19:30Z · El Mestre confirma en el xat les 5 decisions del document 261007_1845_decisions_iaia, tanca el 403 al servidor (bucket `mitjans` i polítiques RLS aplicades a mà) i descarta la Bàscula. A les 19:45 ordena tancar per la quota setmanal (96 %).

2026-10-07T19:55Z · Tancament: informe complet, relleu per a la sessió següent (secció «Límits») i RELLEU_03. Res commitejat.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Avís d'arbre concurrent

Durant la fase de lectura (17:48) una altra IA va escriure sense commit a `src/data/supabase/xat.js` (fils sintètics amb id `'socdepoble'` i `'/iaia'`), `src/data/identitatsSeed.js` (el slug nou) i `src/components/universal/UniversalEditorShell.jsx` (extracció d'`ImageUploaderUI`). He conservat el slug (és l'ordre) i l'extracció (DOM idèntic), i he substituït els fils sintètics. Estaven fixats a dalt, en clicar portaven a un fil inexistent (`xat_historial` rebutja un id que no és UUID), feien «Contactes freqüents» falsos i duplicaven la IAIA per sempre.

### A. Xat per defecte (Sóc de Poble i Iaia MarIA) · FET

- `ENTITAT_PILOT_SLUG = 'socdepoble'` amb les 18 proves que fixaven el slug vell ajustades. Era també l'arrel de tres defectes més a producció: «En privat» no trobava l'entitat, el logotip de Sóc de Poble no eixia damunt de l'H1 i el Panell mostrava sempre l'avís «Xat de Sóc de Poble: encara no disponible». A més, el slug lliure `soc-de-poble` el podia ocupar qualsevol membre del poble i rebre els xats privats de tothom. Ara la cerca per slug es limita al poble actiu (`perfils.js`).
- Mòdul neutre i pur `src/data/xatsPerDefecte.js` (Model B), que `loadFils` de Supabase crida en una línia, només en remot i després de l'error. Files a la CUA, sense fixar, id `sdp-per-defecte:<clau>`, avatar de Sóc de Poble exactament `/assets/system/ui/logo-socdepoble-cuadrat-verd.svg` (fixat per prova). Desapareixen quan existix el fil real (per id o slug, mai pel nom), i qui gestiona l'entitat no veu la seua. Font única dels contactes d'ajuda: contactesAjuda i FakeChatOnboarding en deriven, amb el DOM idèntic.
- Un sol punt d'intercepció a XatSection. Sóc de Poble va per la via «En privat» (`/xat?amb=<uuid>`, `crea_fil_directe`). La IAIA va pel xat de la pàgina `/iaia` (`?sobre=pagina:/iaia`, `obri_fil_de_pagina`), com diuen els Riscos del prompt. En mode seed no canvia res.

### 1. Error 403 del perfil · TANCAT PEL MESTRE

La diagnosi va trobar tres orígens possibles: el PATCH de `profiles`, el PUT de GoTrue i la pujada a Storage. La ruta del client (`<poble>/<uid>/<carpeta>/…`) casa amb la migració vigent 2609200300. Hi faltava el bucket. El Mestre ha creat `mitjans` i ha aplicat les polítiques (19:30). **No s'ha d'aplicar 2610061448 (aal2)**: el client no té MFA i el Panell de superadmin deixaria de funcionar.

### B. Auditoria adversarial del sistema · FET EL QUE ÉS PÍXEL IDÈNTIC

Aplicat, amb proves i revisió:

- **Xat:**
  - el cursor incremental perdia missatges dels altres (ALTA);
  - una marca de lectura fallida quedava com a enviada;
  - el sondeig repintava sense canvis (ara amb una clau de dia perquè «Hui» i «Ahir» es refresquen);
  - una càrrega superada multiplicava l'espera per 10;
  - el fil continuava sondejant fora de /xat;
  - `errorDeXat` no reintentava els 5xx ni el «Load failed» de Safari.
- **Mur i dades:**
  - publicar des de Notes fallava mentre el Mur carregava;
  - `promoteToPublic` publicava la referència privada en tornar a publicar (409);
  - una funció neutra `elementDeFilaPublicada` lleva les claus d'autoritat del payload de les publicacions dels veïns (`isSystem`, `author_org_id`, `mainHref`, `slug`, `href` de les etiquetes);
  - TargetaDelMur i EventCard només accepten un `mainHref` intern;
  - `trobaElement` busca primer per id;
  - el kit de conformitat ara passa també en remot;
  - codi mort retirat (`utils.js`, `realtime.js`, `loadAppData`, `navigation.js` i `sectionContent.js`, dues rutes inabastables d'App, `item_id` de /traduccions).
- **Sessió i rendiment:**
  - dues instàncies `<soc-de-poble>` amb opcions de presentació diferents ja no peten;
  - `sessionService` no notifica sense canvis;
  - el valor de NotificationProvider és estable;
  - el Bloc no torna a baixar en eixir de /notes;
  - cap tanda de generació 0;
  - DevicesSection no es repinta en va.
- **Web Component:** `setTheme` i `themeMode` validats; el tema es sincronitza entre instàncies; comentaris rancis corregits.

**Canvis visibles aplicats** (els tres per ordre o per correcció d'un defecte, i declarats):

- el botó «Entra per a buscar gent del poble» obri «Entrar» i no «Crear compte»;
- el copyright triat per una entitat ja es veu a la seua fitxa remota;
- el «Torna» d'un acte no trobat porta a /calendari i no a la 404.

### C. Panell de Control · FET

- La preferència «Mostrar/Ocultar del Panell» ja no s'enganya. El Perfil parteix de «visible» com el Panell, i els ids `lector-rss` i `metriques` casen amb `rss` i `consola`, també per a les preferències desades. És un canvi visible: el botó diu «Ocultar» d'entrada.
- La prova de producció de /plugin/rss certificava un text que producció no mostra mai: ara simula el build real.
- **RSS:** no està trencat, no té port de producció. Cal un proxy de feeds al servidor, i és una pregunta.
- **Bàscula:** no existia. Per ordre del Mestre (19:30) s'ha retirat de la interfície, i /plugin/bascula és ara la 404. S'ha anotat al Full de ruta, a la pàgina /roadmap («Llavors», «(sense data)») i a `_wiki_de_poble/02_saber/00_full_de_ruta.md`. La il·lustració `bascula_vinyeta.jpg` queda al disc.

### D. Consola Termodinàmica · EXPLICAT I NETEJAT

«Dades no disponibles en este entorn» és per disseny, no una avaria. `consola.json` i `mapa.json` només els servix el middleware de `vite serve` (`tooling/vite/consola-iaia.mjs`, només 127.0.0.1), i `useConsola` i `useMapa` no fan cap petició si `import.meta.env.DEV !== true`. El contracte (`04_contracte_de_dades.md:117`) prohibix posar-les al paquet.

Netejat sense canviar cap píxel: un hook comú `useFontDev`, una sola font de les taules de to, la xifra calculada una vegada i comentaris falsos corregits.

Pendent de decisió: dos textos atribuïxen l'absència a un compilador «no instal·lat» (fals); la Wiki pública enllaça 19 targetes a una ruta de superadmin; el lead del pols promet crèdits retirats.

### E. Editor Universal i imatge damunt de l'H1 · FET

Hi ha UN sol editor (DocumentEditor → UniversalEditorShell → UniversalPage → PageFrame). L'arrel del «no hi ha botó» era que el Perfil apagava la ranura (T35), quan el 261004 se'n va derogar la premissa.

- **Organització:** «Editar logotip» damunt de l'H1.
- **Persona o IA:** l'avatar redó amb la càmera, o la ranura buida amb «Canvia la teua imatge». Obri el diàleg en «avatar».
- **Entitat pilot:** el logotip fix, també en remot des del primer render.
- **Lector sense permís:** veu el mateix que la fitxa pública.
- **Notes:** el logotip pujat ara es publica (`logo_image`, promogut si és privat) i es pinta al detall.
- **Logotip i ordre «/»:** el logotip té la guarda de pujada, i l'ordre «/» Imatge avisa quan falla.

### Esmenes del pla 261007_1645

1. **Editor duplicat · FET:** extracció d'`ImageUploaderUI` completada amb la guarda T46, i `onLogoEdit` com a mirall d'`onHeroEdit`.
2. **Històric sota l'editor · FET, revisió adversarial PENDENT:**
   - ranura `peuDePagina` a PageFrame (fora de l'Índex i de la traducció);
   - `usePublicacionsDeLActor` i `PublicacionsDeLActor` amb la targeta canònica de cada secció (TargetaDelMercat extreta de MercatSection, TargetaDelMur), més l'espècimen al catàleg;
   - es pinta a Notes > Mur, Mercat i Esdeveniments i davall de PublicacioDetall.
   - La implementació va passar 207 fitxers i 2511 proves; el revisor es va aturar pel tancament.
3. **Targeta Viva del producte · FET:**
   - el lector del MAS (PublicacioDetall) pinta per al Mercat la portada amb carrusel i les variacions (`portadaDElement`, compartida amb /mercat/:id), la foto del producte i no el logotip de qui ven, i l'entradilla sense repetir el subtítol;
   - Compartir envia `/mercat/<id>` i no `/notes?…`.
   - «Obri al Mercat» ja navegava al slug. El salt a l'arrel que vas vore quadra amb el router en memòria de WordPress i `tapaRuta` (`/mercat/*`).

### Decisions UX confirmades pel Mestre (19:30) · NO APLICADES (tancament per quota)

1. Bombolles del xat conservades en renovar el JWT.
2. Mur, Mercat i Calendari amb renovació silenciosa.
3. Imatges externes prohibides al Mur.
4. «Carregar-ne més» en lloc del tall de 50.
5. Paquet de WordPress trossejat.

Totes cinc estan autoritzades i pendents. El pla de cada una és a «Límits».

### F. Bateria de preguntes per al Mestre

1. IAIA en remot: el xat públic de la pàgina /iaia és un grup de tot el poble, sense moderació i sense cap IAIA que responga, i depén de la migració 2610042330 (NO aplicada; el servidor encara coneix `/ia`). Es manté o es canvia de via? L'únic punt a tocar és `src/sections/xat/useObriXatPerDefecte.js`.
2. Qui és a la COMUNITAT de Sóc de Poble també ha de vore la fila privada «Sóc de Poble»?
3. Text de previsualització de les files per defecte («Cap missatge.» o una invitació)?
4. Es reconeix `soc-de-poble` com a àlies històric, i s'alinea la plantilla d'alta (`appSeed.js` i `seed.sql`)?
5. L'entitat del projecte es declara per UUID a la configuració de l'amfitrió, per a tancar del tot l'ocupació d'un slug?
6. Damunt de l'H1 d'una nota publicada, el logotip propi substituïx el de qui signa (així està ara, com a l'editor)?
7. Ajuda i selector de la ranura d'imatge: canviem «Pots pujar qualsevol tipus d'imatge o arxiu multimèdia» per un text honest i l'accept a `image/*`?
8. Consola: un text únic i cert per a l'absència? Les targetes de la Wiki pública queden quietes fora de DEV?
9. RSS: on viu el proxy de feeds (Edge Function, REST del connector o GET de Sollutia) i què es fa amb les fonts personals del Snippet?
10. Lector del MAS d'un producte: la boina va a /projecte (T6) o al perfil públic de qui ven (Marató 2230)? Reserva de drets «© Sóc de Poble» o CC BY-NC-SA? Etiqueta «Mercat» o «Producte»?
11. «Afegeix al cabàs» de les variacions no fa res i ara també ix al MAS: es deixa, es lleva del MAS o es lleva de tot arreu?
12. Històric sota l'editor: entren les 10 pàgines de sistema del Mur? Multimèdia? Totes les publicacions o les N darreres? (Amb la decisió 4 s'hi afig «Carregar-ne més».)
13. `seed.sql` porta 7 fotos de la samarreta, i una és trencada: es regenera la fila `marketItems`?
14. Avís únic del xat: un error del fil obert o de l'historial ha de pintar-se dins de la conversa, com a WhatsApp, o com ara, tapant la llista?
15. Esborrats que necessiten permís: `src/sections/consola/mapa/MapaConsola.jsx.tmp` (0 bytes), `src/data/supabase/config.js.bak`, `src/config/app.js` i `src/assets/ui/logo-socdepoble-cuadrat-verd.svg` (sense importadors), `src/sections/notes/notesContent.js` (orfe) i `bascula_vinyeta.jpg`.

### Retroalimentació de la plantilla prompt_local

El prompt 1628 barrejava ordres executables (A, C, E) amb una auditoria oberta (B) i preguntes (F) en un sol torn. Convé que la plantilla demane, per a cada ordre:

- la superfície exacta on el Mestre ha vist el defecte (URL i amfitrió): «Gent de la Torre» i «Obri al Mercat» van costar dues investigacions;
- el mode de dades;
- si es pot canviar l'aparença.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

- **Suite sencera de `src` (19:45):**
  - els únics 7 rojos eren l'estat a mitges de la retirada de la Bàscula: `ControlSection.test.jsx` (1) i `pageContent.roadmap.test.js` (6), executats mentre s'editaven;
  - tornats a passar a les 19:48: 2 fitxers i 47 proves verdes;
  - no hi ha cap altre roig a `src`.
- **Cada peça té proves noves i un revisor adversarial independent:**
  - aprovats o corregits: slug, lector del MAS, editor i Perfil, Panell i RSS, Consola, xat per defecte (dos revisors), xat-robustesa, dades-mur, sessió-rendiment, embed-neteja, dades-netes, perfil-retocs i Bàscula;
  - l'històric de l'actor només té la verificació de l'implementador (207 fitxers i 2511 proves verdes).
- **No executat:**
  - `npm run build:wp` i `vite build`: el hook els bloqueja;
  - les proves `node --test` de `tests/`;
  - la porta Olivera, `tancament.mjs` i `npm run porta`;
  - cap prova al navegador: el panell és compartit i el Mestre hi clica en directe.
- **Estat de git:** res commitejat. El diff és gran i barreja l'esmena concurrent de l'altra IA amb les peces d'este torn.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

### Relleu per a la sessió següent (compte del Rentonar)

1. **Llegir primer:** este informe, RELLEU_00 a RELLEU_03 de `02_investigacio_ia/261007_1715_auditoria_claude/`, el document `261007_1845_decisions_iaia.md` (confirmat pel Mestre) i els resultats dels workflows. Els resultats viuen a la carpeta temporal de la sessió de Claude i es poden perdre: les conclusions útils ja són ací.
2. **Abans de cap commit:**
   - `npx vitest run src` sencer;
   - `npm run lint`;
   - `npm run build:wp` (cap d'estos dos es va poder executar ací);
   - una prova a mà del xat en remot: la fila «Sóc de Poble» porta a /xat?amb=<uuid>, la IAIA a ?sobre=pagina:/iaia, i el gestor de l'entitat no veu la seua fila;
   - el Perfil d'una organització, d'una persona i de Sóc de Poble;
   - Notes > Mercat amb la Samarreta (carrusel, variacions i històric);
   - /cerca sense sessió.
   - Commits atòmics per peça: el slug amb les seues proves; el xat per defecte; el lector del MAS amb `logo_image`; editor i Perfil; Panell i RSS; Consola; les correccions B; la Bàscula amb `wikiManifest.js` i el full de ruta; l'històric de l'actor.
3. **Revisió adversarial pendent de l'històric de l'actor (esmena 2):** `PageFrame.jsx` (`peuDePagina`), `src/sections/mur/usePublicacionsDeLActor.js`, `PublicacionsDeLActor.jsx`, `src/sections/mercat/TargetaDelMercat.jsx`, NotesSection, NotesDetail, NotesEditor, PublicacioDetall i l'espècimen del catàleg.
4. **Decisions del Mestre pendents d'implementar (autoritzades):**
   - **Decisió 1 · Bombolles i conversa:** a `XatContext.jsx`, purgar només quan canvia `ambitEstable` (backend, persona, actor) i no amb `generacio`. Conservar fils, missatges, pendents i `filActiu`, i passar a 'error' els enviaments avortats, que es reintenten amb el mateix id (idempotent). La clau de `XatWorkspace` (XatSection.jsx:~210) passa de `scopeKey` a `ambitEstable`. Proves de `XatContext.test.jsx` (~67-82), que fixen la purga per `generacio`, a reescriure citant l'ordre. Detall: troballes 2807-2833 i 3042-3068 del resultat de l'auditoria.
   - **Decisió 2 · Renovació silenciosa:** `useScopedResource` separa la clau d'aïllament de la de frescor. Si només canvia la generació o el tick, conserva el payload amb `status: 'ready'` i una marca `revalidant`. No s'ha d'usar un estat nou: els consumidors comproven `status !== 'ready'`.
   - **Decisió 3 · Imatges externes:** `imatgePrivada` a TargetaDelMur i EventCard. Els avatars OAuth de Google, Facebook i GitHub els admet hui `esFontImatgeSegura`: l'ordre diu «només locals o del nostre servidor», i cal un mode estricte per al Mur. També la portada del detall (`paginaDElement`), i una validació al servidor (migració, la llança el Mestre).
   - **Decisió 4 · «Carregar-ne més»:** una capacitat opcional del port (per exemple `paginacioSeccions`) en `contracte.js` i al kit de conformitat, implementada a `content.js` amb un cursor `(created_at, id)`. `MurContext` exposa `carregaMes` i `hiHaMes`, i el botó va a /mur i a /mercat (Pedra Seca). Cal una ADR, perquè és un canvi de contracte opcional.
   - **Decisió 5 · Paquet trossejat:**
     - El format IIFE obliga Rollup a inlinar les 138 `import()`: posar més `React.lazy` no reduïx res.
     - Cal un carregador clàssic menut que capture `document.currentScript`, deixe `window.SocDePoble` amb una cua per als `<script>` posteriors i faça `import()` d'una entrada ESM amb trossos amb hash, al costat del carregador.
     - `sdp-release` ja inventaria tot el que s'emet. L'SRI per tros no és del baseline. Sollutia, si servix des d'un altre origen, necessita CORS.
     - La variant WordPress, amb React extern, probablement queda monolítica.
     - Cal un interruptor per a tornar al monolític.
     - Només es pot verificar amb el build real (fora del que permet el hook ací) i una prova al navegador dins de WordPress.
5. **Pendents menors:**
   - `mapejadorSeccions.js:89` i `:144`: `variations.map(netejaText)` i `tags.map(netejaText)` passen l'índex com a màxim i corrompen les variacions i les etiquetes en remot. És un defecte real que no he aplicat.
   - Les helpers `camiDe`, `esMarcaDeLEntitat` i `esAvatarSegur` estan copiades a `PageFrame.jsx`, `elementDeSeccio.js` i `imatgesDeProducte.js`: cal moure-les a `UniversalUtils.js`.
   - Comentaris que encara diuen que ItemDetailSection munta el carrusel: `CarruselImatges.jsx:47` i `:53`, `i18n.js:760`, `EspecimenCarruselImatges.jsx:8`, `components.css:2478`.
   - `UniversalPage.jsx:20` cita la Bàscula com a exemple.
   - El títol de `pageContent.roadmap.test.js` diu 39 llavors, i ara són 40.
   - La skill `sdp-universal-editor` hauria de documentar la ranura damunt de l'H1 i l'ordre «/» Imatge (`.agents/`, només amb lease).
6. **Fora de l'abast d'escriptura d'este torn (`tooling/`, `supabase/`, `.agents/`):**
   - la regla R6 de `tractor-rls.mjs` ix verd amb un `search_path` mutable;
   - `created_at` de `section_submissions` el posa el client, i el trigger `trg_force_submission_author` l'hauria de fitar;
   - la Frontissa de Sollutia té dos catàlegs incompatibles (D10);
   - una porta de mida per al paquet;
   - `.agents/ESTAT.md` i `.agents/LEDGER.md` NO s'han actualitzat (governança, cal lease), i `tancament.mjs` no s'ha pogut executar;
   - la memòria persistent de Claude no s'ha pogut actualitzar: el hook bloqueja escriure fora del repositori.

### Límits del mètode

- Les investigacions i verificacions són lectures del codi i proves de vitest. Cap dada de producció no s'ha vist directament.
- Les afirmacions sobre producció (migracions aplicades, slug, buckets) vénen del Mestre o del repositori.
- Algunes troballes es van refutar i no figuren ací.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
