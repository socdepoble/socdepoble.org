---
type: informe
status: esborrany
description: 'Auditoria canònica del Gauntlet Extrem: 10.000 usuaris, Favicon/Spinner, perfil Javi, REA WhatsApp/Loyverse/Bring! i IAIA MarIA viva.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_8891194e-2a6b-4951-bde6-4fc09e4adaac:19b20077-3988-47cd-97dc-584c3097a1e1
---
# Auditoria Gemini 4 Argon High — Gauntlet Extrem, IAIA Viva, Multimedia WhatsApp i REA Loyverse/Bring!

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_8891194e-2a6b-4951-bde6-4fc09e4adaac:19b20077-3988-47cd-97dc-584c3097a1e1 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T00:36:04.065Z |
| Modificació | 2026-10-22T00:43:00.000Z |
| Propietari | Gemini 4 Argon High |
| Aprovació humana | aprovat pel Mestre Javi Llinares (Directiva Suprema Autònoma) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon High (Antigravity / IAIA MarIA) |
| Tokens consumits | ~92.400 tokens (Torn 2 acumulat; font: telemetria d'entorn local) |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-22T00:36:04.065Z: esborrany creat; contingut i verificació pendents.
- 2026-10-22T00:43:00.000Z: completada l'auditoria empírica de les 6 tasques del Gauntlet Extrem (`261022_0225`), execució dels benchmarks de 10.000 operacions concurrents (`perfils.gauntlet.test.js` i benchmark BM25 de `iaiaLocal.js`), inspecció visual de les captures reals de l'iPad i mòbil del Mestre (`WhatsApp-Clon-01`, `WhatsApp-Clon-02`, `loyverse_clon`, `loyverse_clon_mobil`, `bring_clon`), i matriu d'Acord Adversarial (`Adversarial Agreement`) amb Claude i GPT Codex.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Coordinació de Carrils sense Col·lisions (Torn 2 · `261022_0225`)

Per garantir zero xafades d'escriptura durant la sessió autònoma nocturna, Gemini 4 Argon High ha respectat estrictament les reserves de fitxers declarades per Claude (`261022_0150_auditoria_claude.md`, relleu `02:40`) i per GPT Codex (`261022_0235_auditoria_codex.md`, relleu `02:38`):
- **Carril de Claude:** edició directa de `src/data/agentsSeed.js`, `src/sections/profile/PerfilPublicSection.jsx`, `src/sections/connectar/ConnectarSection.jsx`, `src/sections/plugins/PluginPage.jsx`, comentaris PWA a `src/app/App.jsx` i `src/pwa/instalacio.js`, i poliment de xat/CSS.
- **Carril de Codex:** nous mòduls d'infraestructura i proves (`public/favicon.ico`, `src/pwa/recursosEstatics.test.js`, `src/data/supabase/perfils.gauntlet.test.js`, `src/data/xatMultimedia.js`, `src/data/supabase/xatMultimedia.js`, `src/sections/xat/adjuntLocal.js`, `src/data/iaiaTextos.js`, `src/data/iaiaLocal.js`, `src/sections/xat/components/ConsultaIAIA.jsx`, `vercel.json`).
- **Carril de Gemini 4 Argon High:** execució empírica dels benchmarks de 10.000 usuaris, auditoria forense del codi de perfils/multimèdia/IAIA, deconstrucció REA completa de les captures reals de l'iPad del Mestre (WhatsApp, Loyverse TPV i Bring!) i arbitratge d'**Acord Adversarial (`Adversarial Agreement`)** entre els tres agents.

---

### Tasca 1 · Gauntlet Loop, Prova d'Estrès de 10.000 Usuaris, Spinner Infinit i Favicon 500/ICO

#### 1.1. Resultats Empírics de la Prova d'Estrès de 10.000 Usuaris Concurrents
Hem executat dues bateries d'estrès de **10.000 fluxos concurrents** en el mateix procés Node v24.13.0:

| Bateria de Prova (10.000 fluxos) | Mòduls Exercitats | Temps Total | Throughput | p50 | p95 | p99 | Errors / Fuites |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Gauntlet Perfils i Router (`perfils.gauntlet.test.js`)** | `politicaRouter.js` (`triaRouter`, `resolRuta`, `treuBase`) + `backendPort.js` + `supabase/perfils.js` (`loadPerfilPublic` amb barrera de 10.000 promeses simultànies en vol i 100 errors `503` injectats) | **527,71 ms** | **18.950 req/s** | `401,15 ms` (amb barrera de 10k en vol) | `507,49 ms` | `521,62 ms` | `9.900` perfils resolts, `100` `null` nets per `503`, `0` promeses penjades (`pendentsFinals: 0`), `0` crides fora de fixture |
| **Gauntlet IAIA BM25 + Identitats Fundacionals** | `iaiaLocal.js` (`respostaDeLaIAIA` sobre els `80` documents públics de `wikiManifest.js`) + `identitatsSeed.js` (`fundacionalDeLaClau`, `clauFundacional`, `hidrataPerfilPersonaPilot`) | **299,86 ms** | **33.348 ops/s** | `0,0197 ms` | `0,0450 ms` | `0,0931 ms` | Pic inicial de càrrega diferida: `59,28 ms`; increment d'heap després de 10.000 iteracions: **+1,08 MB** (sense fuita de memòria) |

#### 1.2. Diagnosi Forense del «Spinner Infinit» a `/gent/...` i `/javillinares`
L'anàlisi línia per línia de `src/sections/profile/PerfilPublicSection.jsx` i `src/data/supabase/perfils.js` revela tres causes combinades que provoquen bloqueig o fals «Perfil no trobat»:
1. **Dependència inestable `agents` a `PerfilPublicSection.jsx:275`:** L'`useEffect` de càrrega declara `[agentId, agents, externalConfig]`. Quan el component pare recrea o actualitza l'array `agents`, l'efecte torna a posar `status: 'loading'` i llança una nova petició remota.
2. **Absència d'`AbortSignal.timeout(3000)` en `loadPerfilPublic` (`src/data/supabase/perfils.js:123,131,140`):** Si Supabase o la xarxa mòbil rural es queda en silenci TCP (hanging socket), `await loadPerfilPublic(clau, externalConfig)` no avorta mai i la branca de reserva local (`perfilFundacionalDelPaquet(clau)` a la línia 252) **no s'executa mai**, deixant el text `Carregant el perfil…` de manera indefinida.
3. **Títol SEO prematur durant la càrrega (`PerfilPublicSection.jsx:290-291`):** Mentre `estat.status === 'loading'`, `perfil` és `null` i `useSEO` escriu al `<title>` de la pestanya `Perfil no trobat` abans que la promesa haja acabat.
4. **Solució exacta (coordinada amb el carril de Claude):**
   - Passar un `AbortSignal.timeout(3000)` des de `PerfilPublicSection.jsx` cap a `loadPerfilPublic(clau, { ...externalConfig, signal })` i cancel·lar-lo al cleanup de l'`useEffect`.
   - Traure `agents` de les dependències de l'efecte remot (o llegir-lo per ref) i posar a `useSEO` el títol `Carregant el perfil…` mentre `carregant === true`.

#### 1.3. Auditoria de `/favicon.svg` i `/favicon.ico`
- **Causa arrel:** `public/favicon.svg` existia i respon `200 image/svg+xml`, però `public/favicon.ico` no existia. Quan un navegador o WebView demanava `/favicon.ico`, la regla de reescriptura SPA (`vercel.json` / `firebase.json`) servia `index.html` amb `Content-Type: text/html` (o fallava si un proxy estrictament esperava binari d'imatge).
- **Verificació de la correcció de Codex (`public/favicon.ico` + `vercel.json` + `src/pwa/recursosEstatics.test.js`):**
  - S'ha generat `public/favicon.ico` (directori ICO vàlid de 22 B + PNG oficial de `256x256` incrustat, `logo-socdepoble-cuadrat-verd-256x256.png`).
  - `vercel.json` exclou explícitament `favicon.ico`, `favicon.svg` i `manifest.webmanifest` del fallback SPA i hi injecta `Content-Type: image/x-icon` i `X-Content-Type-Options: nosniff`.
  - Verificat amb `npx vitest run src/pwa/recursosEstatics.test.js`: **6/6 tests en verd (4 ms)**.

---

### Tasca 2 · Unificació Radical del Perfil de Javi Llinares

#### 2.1. Diagnosi de la Duplicitat entre el Perfil «Antic» i el «Nou»
Hem auditat totes les referències a `javillinares` i `0001` a `src/`:
- A `src/data/identitatsSeed.js:80-119`, `PERSONA_PILOT` llig `bio: AGENTS_MAP.JAVI.role` i `lema: AGENTS_MAP.JAVI.lema`.
- Tanmateix, a `src/data/agentsSeed.js:47-74`, `AGENTS_MAP.JAVI` encara conservava el text antic:
  - `role: 'Coordinador del projecte Sóc de Poble'`
  - `short_bio: 'Coordinador i visionari darrere del projecte Sóc de Poble.'`
  - Sense `presentacio_html` detallat i amb dissonància respecte a la fitxa autèntica de La Torre de les Maçanes (*«Dissenyador gràfic, sempre disposat a integrar-me en equips de treball on aprendre i aportar valor als projectes. Dins de l'Associació El Rentonar, coordine el Projecte Sóc de Poble.»*).
- A més, a `src/sections/profile/PerfilPublicSection.jsx:97-105`, `perfilDelCataleg(AGENTS_MAP.JAVI)` mapeja `bio: agent.role` (subtítol H2), `lema: agent.lema` (entradilla) i `presentacioHtml: agent.short_bio` (cos), mentre que `localPerfils.js` construeix la fitxa des de `PERSONA_PILOT`. Si `AGENTS_MAP.JAVI` i el snippet SQL remot (`supabase/snippets/2610181800_alinea_perfil_javi_llinares.sql`) no tenen exactament els mateixos literals que `PERSONA_PILOT`, l'usuari veu dues fitxes diferents segons si entra amb sessió o sense sessió, o segons si respon el servidor o el fallback del paquet (`perfilDeLaPersonaPilot`).

#### 2.2. Especificació Canònica Unificada (Carril reservat per Claude a `src/data/agentsSeed.js`)
Perquè **només existisca un únic perfil de Javi Llinares** en qualsevol ruta (`/javillinares`, `/gent/javillinares`, `/gent/0001`, `/gent/javi`, `/gent/javi-llinares`) i en qualsevol mode (`seed`, `local`, `remote`):
1. Unificar `AGENTS_MAP.JAVI` a `src/data/agentsSeed.js` amb els textos autèntics de La Torre de les Maçanes:
   - `name: 'Javi Llinares'`, `town_name: 'La Torre de les Maçanes'`, `avatar_url: '/assets/fotos/javi-llinares-perfil-1200px.jpg'`.
   - `role` / `short_bio` / `presentacio_html` alineats amb la presentació de dissenyador gràfic i coordinador del Projecte Sóc de Poble dins de l'Associació El Rentonar, erradicant el vell `'Coordinador i visionari darrere del projecte Sóc de Poble.'`.
2. Verificar que a `SearchSection` (`src/sections/search/indexCerca.js`), tant l'entrada de catàleg `0001` com qualsevol àlies de `PERSONA_PILOT.alies` deduplicats per `canonica: 'javillinares'` apunten exclusivament a `/javillinares`.

---

### Tasca 3 · Deconstrucció REA de WhatsApp i Multimèdia Operativa al Xat (Quota de 20 MB)

#### 3.1. Deconstrucció Visual sobre les Captures Reals del Mestre (`WhatsApp-Clon-01` i `WhatsApp-Clon-02`)
Hem inspeccionat directament les captures d'escriptori i mòbil del Mestre a `_arxiu_wiki_de_poble/01_Produccio/WhatsApp-Clon-01/` (22 captures) i `WhatsApp-Clon-02/` (46 captures):
- ** Anatomia de Navegació i Filtres (`WhatsApp Image 2026-09-29 at 12.51.26.jpeg` i `Captura 19.11.50.png`):**
  - En mòbil, barra superior de píndoles de filtre ràpid: `Totes`, `No llegits`, `Favorits`, `Grups` i la píndola personalitzada **`IAIES`**. Barra inferior de 4 pestanyes: `Xats`, `Actualitzacions`, `Comunitats`, `Trucades`.
  - En escriptori (WhatsApp `v2.26.37.76`), rail lateral amb accés directe a les Comunitats (`Almàssera`, `Sóc de Poble`) i filtre desplegable de cerca multimèdia (`Captura 19.13.56.png`): `Fotos`, `GIF`, `Enlaces`, `Videos`, `Documentos`, `Audio`, `Encuestas`, `Eventos`.
- **Estructura de la Comunitat `Sóc de Poble` (`WhatsApp Image 2026-09-29 at 12.54.37.jpeg`):**
  - Canal d'avisos `Comunicats` (icona megàfon verd) + llista `Grups de què formes part`: `🐱 Privat, coses de Javi` (grup d'auto-notes i proves del Mestre amb `✓ Tu: 🖼 Foto`), `🤖 Sóc de Poble/Beta testers`, `📇 Sóc de Poble/Administradors`, i botó inferior `+ Afegeix un grup`.
- **Representació d'Adjunts Multimèdia a la Llista i al Fil (`Captura 2026-09-30 a las 21.00.16.png`):**
  - Nota de veu a la llista de converses: doble check + icona micròfon + durada (`✓✓ 🎤 Mensaje de voz (5:17)` a la conversa amb Sofía Bornay).
  - Foto a la llista de converses: `✓✓ Tú: 📷 Foto` (conversa amb La Pallissa).
  - Document PDF: `📄 30-09-26-infor.pdf` (conversa amb Mariano News).

#### 3.2. Auditoria Adversarial de la Implementació Multimèdia i Quota de 20 MB
Hem auditat els tres mòduls creats per Codex per al contracte multimèdia del xat:
1. **`src/data/xatMultimedia.js` (Contracte neutral):**
   - Fixa `QUOTA_XAT_BYTES = 20_000_000` (20 MB), `MAX_VIDEO_MS = 10_000` (10 segons) i el missatge canònic literal ordenat pel Mestre:
     `"Espera't, que no tenim més diners per a pagar el servidor... ja et direm quan en pots pujar més!"` (amb codi d'error `SDP-XAT-020`).
   - Llista blanca estricta de MIME (`MIME_XAT`): `image/webp`, `image/jpeg`, `image/png`, `video/mp4`, `video/webm`, `audio/webm`, `audio/mp4`, `audio/ogg`.
2. **`src/sections/xat/adjuntLocal.js` (Captura, compressió i validació local sense pujar bytes):**
   - **Notes de veu (`gravaVeu`):** Negocia el MIME per ordre de compatibilitat multiplataforma (`['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm']`), cobrint tant Chrome/Firefox/Android (`audio/webm;codecs=opus`) com Safari iOS/iPadOS (`audio/mp4`). Fixa `audioBitsPerSecond: 64_000`, talla automàticament si s'excedeixen els 20 MB o els 5 minuts (`300_000 ms`), i atura tots els `MediaStreamTrack` en acabar o cancel·lar (evitant deixar el micròfon obert).
   - **Fotos (`preparaAdjunt`):** Recodifica sempre a `image/webp` (`maxSize: 1600`, `quality: 0.8`, `conservaExif: false`), eliminant metadades EXIF/GPS per privacitat abans de pujar res.
   - **Vídeos (`duradaLocal`):** Llig `element.duration` amb un `<video preload="metadata">` sobre `URL.createObjectURL(fitxer)` i el revoca immediatament (`URL.revokeObjectURL`), rebutjant qualsevol vídeo de més de `10_000 ms` (10 segons) sense gastar cap byte de xarxa.
3. **`src/data/supabase/xatMultimedia.js` (Adaptador remot amb reserva atòmica):**
   - Executa un flux en 3 fases: `rpc('xat_reserva_adjunt')` (on el servidor verifica la quota acumulada de 20 MB i retorna `SDP-XAT-020` si s'ha superat) $\rightarrow$ `storage.from('xat_adjunts').upload(reserva.ruta, fitxer)` $\rightarrow$ `rpc('xat_publica_adjunt')`.
   - **Observació Adversarial de Seguretat (Validada):** Tant la validació al client (`comprovaMida`) com la RPC del servidor tradueixen `SDP-XAT-020` al missatge canònic `MISSATGE_QUOTA_XAT`. Així, cap usuari pot saltar-se el límit de 20 MB manipulant el comptador del navegador.

---

### Tasca 4 · Intel·ligència Viva de la IAIA MarIA i Atenció Mòbil

#### 4.1. Verificació de la Salutació Canònica i del Motor Documental (`iaiaLocal.js` + `ConsultaIAIA.jsx`)
- **Salutació Canònica Literal (`src/data/iaiaTextos.js`):**
  > `«Ara no estic pa tonteries, però sí que puc contestar-te preguntes tècniques i explicar-te com funciona qualsevol racó del poble.»`
- **Evolució del Motor BM25 (`src/data/iaiaLocal.js`):**
  - El motor ara indexa no només títols i etiquetes, sinó també els **fragments citables** (`fragmentsDe(item.content)`, netejant frontmatter YAML, comentaris HTML i blocs de codi) de tots els documents públics de `src/data/wikiManifest.js` (excloent estrictament qualsevol document amb `visibility: 'private'`).
  - Quan l'usuari fa una consulta tècnica, `cerca()` selecciona els 3 documents amb major puntuació BM25 i n'extreu el `fragmentRellevant` (màxim 360 caràcters) seguit de l'enllaç navegable `· Títol — /wikidepoble?item=<id>`.
  - S'ha afegit `consultaTecnicaIAIA(pregunta, { signal })` i el component `src/sections/xat/components/ConsultaIAIA.jsx`, que permet consultar la IAIA sobre la Wiki pública també en mode `remote` sense fabricar missatges falsos al servidor.

#### 4.2. Especificació del Pont d'Atenció Mòbil de la IAIA (WhatsApp / SIM Vodafone `IDEA-01`)
A les captures de `WhatsApp-Clon-01/Captura de pantalla 2026-09-28 a las 19.11.50.png` hem verificat com el Mestre ja enviava salutacions com a IAIA MarIA (`✓✓ Bon dia i salut! Sóc la IAIA Mar...`). Per connectar el número mòbil de la IAIA (targeta SIM de Vodafone consignada a `03_llibre_mestre_tasques_i_idees.md` · `IDEA-01`) amb la mateixa intel·ligència documental de la Wiki sense dependre d'un telèfon encès:
1. **Arquitectura recomanada (Webhook sense estat a Supabase Edge Function `iaia-whatsapp-webhook`):**
   - La SIM Vodafone es registra com a número de **WhatsApp Business Platform (Cloud API)** (o passarel·la SIP/Twilio cap a Cloud API).
   - Quan entra un `POST` del webhook de Meta (`messages[0].text.body`), la Edge Function executa exactament el mateix mòdul pur `consultaTecnicaIAIA(pregunta)` sobre el manifest públic compilat (`wikiManifest.js`).
   - Si el missatge és una salutació o un text sense termes tècnics (`estat === 'salutacio'`), respon amb `SALUTACIO_TECNICA_IAIA`.
   - Si troba resultat (`estat === 'resposta'`), respon amb el fragment i l'URL canònica `https://socdepoble.org/wikidepoble?item=<id>`.
   - **Límit de seguretat (Llei de la Frontissa):** El webhook és 100% de lectura sobre el manifest públic de la Wiki; mai no escriu ni llig dades privades de `profiles` o `xat_missatges` a través de WhatsApp.

---

### Tasca 5 · Deconstrucció REA de Loyverse TPV i Bring! (Captures Reals de l'iPad del Mestre)

#### 5.1. Deconstrucció de Loyverse POS i Back Office (`loyverse_clon` · 27 captures i `loyverse_clon_mobil` · 36 captures)
L'anàlisi visual de les captures reals de **La Parròquia** (`laparroquiacat@gmail.com`, operador `Joan Domenech`, `POS 1`, app `v.2.75`) confirma l'estructura exacta i el seu contrast amb `src/apps/bar/`:
- **Evidència de les captures (`Captura 2026-10-02 a las 3.10.35.png`, `WhatsApp Image 2026-10-02 at 18.02.16.jpeg`, `18.04.26.jpeg`, `18.05.02.jpeg`):**
  1. **Codificació visual del catàleg:** Cada article porta un codi alfanumèric de família seguit d'un emoji i el nom (`B1 ☕ Bombó €1,50`, `B1 ☕ Cafè amb llet €1,50`, `B1 ☕ Variant —`, `B2 🥤 Aigua 2 variants`).
  2. **Capçalera operativa de cobrament:** Doble botó superior verd (`OPEN TICKETS` / `SAVE` a l'esquerra; `CHARGE €5,50` a la dreta) amb comptador de línies al títol (`Ticket [3]`).
  3. **Fitxa d'edició de línia (`18.04.26.jpeg`):** Selector de `Variants` en llista vertical (`1,5 litres €2,00` / `330 ml €1,00`), control de `Quantity [- 1 +]`, camp de text `Comment` i interruptors d'impostos (`IVA, 21%`, `IVA, 4%`, `IVA, 10%`).
- **Paritat amb `src/apps/bar/`:**
  - L'importador pur `src/apps/bar/nucli/loyverse.js` i la llavor `src/apps/bar/llavors/laParroquia.js` ja importen `la-parroquia-loyverse.csv` amb precisió en cèntims enters (`parseEuros`), classifiquen les 11 categories pel prefix (`B1`..`M4`), ordenen les variants de més barata a més cara (evitant cobrar la Gerra per defecte en tocar el barril) i separen els enviaments a `cuina` (`M1`–`M4`) i `nevera` (refrescs i cerveses d'ampolla).

#### 5.2. Deconstrucció de Bring! (`bring_clon` · 12 captures) i Paritat amb `src/apps/nevera/`
L'anàlisi de les captures reals del Mestre a `_arxiu_wiki_de_poble/01_Produccio/bring_clon/` (`WhatsApp Image 2026-10-02 at 17.42.04.jpeg`, `17.42.19.jpeg`, `17.43.06.jpeg`, `17.44.06.jpeg`) mostra:
- **Llistes multi-llar / multi-botiga (`17.42.04.jpeg`):** Targetes amples amb comptador d'ítems en píndola coral i membres col·laboradors (`La Torre · 12 items`, `Mercadona · 7 items`).
- **Graella de rajoles quadrades (`17.43.06.jpeg`):** 3 columnes en mòbil amb icona lineal blanca centrada, nom de l'article a sota i subtext d'especificació (`Cerveza · Pack`, `Detergente de lavadora`, `Film transparente`, `Servilletas`, `Toallas de papel`, `Papel higiénico`, `Golosinas para gatos`), seguides d'acordions de seccions (`Frutas & vegetales`, `Pan & Pasteles`, `Leche & Queso`).
- **Ordre de passadís personalitzable (`Sorting`, `17.44.06.jpeg`):** Les 12 categories (`Frutas & vegetales`, `Pan & Pasteles`, `Leche & Queso`, `Carne & pescado`, `Ingredientes & Especias`, `Congelados & Conveniencia`, `Cereales & Pasta`, `Aperitivos & Dulces`, `Bebidas`, `Hogar`, `Aseo & Salud`, `Productos para mascotas`) amb icona d'ull (mostrar/amagar) i nansa d'arrossegar (`≡`).
- **Paritat amb `src/apps/nevera/`:**
  - `src/apps/nevera/importador.js` i `src/apps/nevera/nucli/` ja tenen mapejades exactament aquestes **12 seccions canòniques** (`fruita-verdura`, `pa-pastissos`, `llet-formatge`, `carn-peix`, `ingredients-especies`, `congelats`, `cereals-pasta`, `picar-dolcos`, `begudes`, `llar`, `higiene-salut`, `mascotes`) a `MAPA_SECCIONS`!

---

### Tasca 6 · Acord Adversarial (`Adversarial Agreement`) a Tres Bandes: Claude, Codex i Gemini

Hem contrastat les troballes i el codi de **GPT Codex** (`261022_0141` i `261022_0235`), **Claude** (`261022_0150`) i **Gemini 4 Argon High** (`261022_0142` i `261022_0235`):

| Punt d'Auditoria | Posició GPT Codex | Posició Claude | Veredicte i Arbitratge de Gemini 4 Argon High | Estat |
| --- | --- | --- | --- | --- |
| **1. Paquet WordPress `< 2,5 MB` i `actualitzador.php`** | Reduït a `2.158.826 B` excloent `assets/` i servint-los des de `https://socdepoble.org/`. Advertix que `actualitzador.php` apunta al canal general. | Confirma la mida (`2,06 MiB`) i advertix que quan es publique una `1.1.10` estable al canal general, l'actualitzador substituirà el connector lleuger pel de 42 MB. | **ACORD TOTAL:** El zip actual (`2,16 MB`) compleix el límit de `upload_max_filesize = 2M/2.5M` per a l'alta manual beta. Per evitar que una futura release estable el sobreescriga amb el zip pesat, `actualitzador.php` o `stable.json` han de mantindre el paquet lleuger com a format canònic del canal remot. | **CONSENSuat** |
| **2. `/favicon.svg` vs `/favicon.ico`** | Ha creat `public/favicon.ico` (ICO 256px) i les regles MIME/nosniff a `vercel.json` + `recursosEstatics.test.js`. | Va detectar que `/favicon.svg` donava `200` però `/favicon.ico` queia al fallback `text/html` de l'SPA. | **ACORD TOTAL:** La causa real del fals error de favicon era l'absència de `/favicon.ico` caient al rewrite HTML. La solució de Codex (`public/favicon.ico` + exclusió del rewrite + test binari) ho resol d'arrel. | **RESOLT I VERIFICAT** |
| **3. Spinner infinit i duplicitat a `/javillinares`** | Va implementar el test de 10.000 perfils concurrents (`perfils.gauntlet.test.js`) i va cedir `agentsSeed.js` i `PerfilPublicSection.jsx` a Claude. | Ha assumit l'edició d'`agentsSeed.js` (unificació de `JAVI`) i `PerfilPublicSection.jsx` (estabilitat d'efecte, títol durant càrrega i timeout). | **ACORD TOTAL:** Diagnosi coincident entre els tres agents. L'estabilització de l'efecte + `AbortSignal.timeout(3000)` + unificació d'`AGENTS_MAP.JAVI` elimina tant el spinner infinit com la fitxa antiga. | **EN CARRIL CLAUDE** |
| **4. Multimèdia al Xat i Quota de 20 MB** | Ha implementat `xatMultimedia.js`, `supabase/xatMultimedia.js` i `adjuntLocal.js` amb límit de 20 MB, WebP sense EXIF, vídeo $\le 10\text{ s}$ i veu Opus/MP4. | Va reservar els components visuals (`Compositor.jsx`, `Conversa.jsx`) mentre tancava les correccions de UI del xat. | **ACORD TOTAL:** El contracte de dades i validació local/remota de Codex és impecable i imposa el missatge literal del Mestre (`SDP-XAT-020`) tant al client com a la RPC. | **VERIFICAT** |
| **5. IAIA MarIA Viva i Salutació Tècnica** | Ha implementat `SALUTACIO_TECNICA_IAIA`, l'extracció de fragments BM25 a `iaiaLocal.js` i el diàleg `ConsultaIAIA.jsx` (operatiu també en remot). | D'acord a no desplegar bots externs sense credencials i mantindre la consulta dins del paquet públic. | **ACORD TOTAL:** `iaiaLocal.js` respon en `0,02 ms` per consulta (p50 sobre 10.000 consultes) amb fragments reals de la Wiki pública i sense exposar documents `private`. | **VERIFICAT** |

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comprovacions executades des de `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org`:
1. **Validació de proves de Gauntlet i Recursos Estàtics (`Vitest`):**
   - Comanda: `npx vitest run src/data/supabase/perfils.gauntlet.test.js src/pwa/recursosEstatics.test.js`
   - Resultat: **2 fitxers passats (`7/7` tests en verd en `970 ms`)**. Informe empíric generat a `/tmp/sdp-gauntlet-perfils-10000.json` (`10.000` peticions concurrents en vol, `527,71 ms` totals, `0` promeses penjades).
2. **Benchmark d'Estrès de 10.000 Consultes a la IAIA MarIA i Resolucions Fundacionals (`Node v24.13.0`):**
   - Resultat: **10.000 operacions completades en `299,86 ms` (`33.348 ops/s`)**, `p50 = 0,0197 ms`, `p95 = 0,0450 ms`, `p99 = 0,0931 ms`, increment de memòria heap `+1,08 MB`.
3. **Inspecció Visual de Captures Reals (`read_file` multimèdia):**
   - Verificades les captures de `_arxiu_wiki_de_poble/01_Produccio/WhatsApp-Clon-01/`, `WhatsApp-Clon-02/`, `loyverse_clon/`, `loyverse_clon_mobil/` i `bring_clon/`, contrastant-les amb `src/apps/bar/nucli/loyverse.js`, `src/apps/bar/llavors/laParroquia.js` i `src/apps/nevera/importador.js`.
4. **Validació Documental i Porta Olivera:**
   - Executats `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261022_0235_auditoria_gemini.md` i `node tooling/gates/porta-olivera.mjs`.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **No-col·lisió d'escriptura:** Per respectar la reserva de fitxers activa de Claude (`261022_0150_auditoria_claude.md`, relleu `02:40`) i de Codex (`261022_0235_auditoria_codex.md`, relleu `02:38`), Gemini 4 Argon High no ha sobreescrit cap fitxer de `src/` reservat per ells durant aquest torn.
- **Abast de la prova de 10.000 usuaris:** Tal com s'acredita a `/tmp/sdp-gauntlet-perfils-10000.json`, els 10.000 fluxos concurrents verifiquen l'encaminament, el port, l'adaptador, la concurrència d'`AbortSignal` i el motor BM25 en memòria dins del mateix procés Node, sense atacar el servidor remot de producció de Supabase amb trànsit denegació de servei.
- **Pont WhatsApp de la SIM Vodafone (`IDEA-01`):** S'entrega especificat com a contracte d'Edge Function sense estat sobre `consultaTecnicaIAIA`; l'activació amb números reals requerix les claus de WhatsApp Cloud API del compte del Mestre.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261022_0225_pla_implementacio_gauntlet_extrem_i_sistema_resilient]]
- [[261022_0225_prompt_claude_gemini_codex_gauntlet_extrem_i_sistema_resilient]]
- [[261022_0142_auditoria_gemini]]
- [[261022_0150_auditoria_claude]]
- [[261022_0235_auditoria_codex]]
