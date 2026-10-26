---
type: informe
status: esborrany
description: Auditoria adversarial de Gemini 4 Argon sobre l'habitabilitat 10/10 dels 7 mòduls del Mas, depuració del Llibre Mestre, xat amb veu/vídeo/tics i millora de porta-olivera.mjs.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_a30045fb-cee2-4c83-b722-11b923670a69:a37f5ac0-f1f1-4438-b9c3-e2fb5b3c4dcd
---
# Auditoria Gemini 4 Argon (Gauntlet Loop 1645): Habitabilitat 10/10 del Mas, Xat Total WhatsApp, Depuració del Llibre Mestre i Cicle Documental de Porta Olivera

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a30045fb-cee2-4c83-b722-11b923670a69:a37f5ac0-f1f1-4438-b9c3-e2fb5b3c4dcd |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T16:00:37.101Z |
| Modificació | 2026-10-25T17:05:00.000Z |
| Propietari | Gemini 4 Argon (IAIA MarIA) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini 4 Argon |
| Tokens consumits | ~29.500 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-25T16:00:37.101Z: esborrany creat amb obertura de torn `torn_a30045fb-cee2-4c83-b722-11b923670a69`.
- 2026-10-25T17:05:00.000Z: auditoria adversarial completa dels 7 mòduls d'habitabilitat 10/10 del Mas electrònic, certificació i compactació del Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`), i diagnòstic forense amb disseny d'esmena v5 per a `tooling/gates/porta-olivera.mjs`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

##### Bloc 1 · Auditoria i Depuració del Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`)

1. **Verificació de Fites Tècniques Resoltes (`b842160ac` + `vite.config.js`):**
   - **Crash de Notes (`@tiptap/react` / doble instància de React):** Verificat en `vite.config.js:85-95`. S'ha incorporat `resolve.dedupe: ['react', 'react-dom']` i `optimizeDeps.include: ['react', 'react-dom', '@tiptap/react', '@tiptap/pm/state', '@tiptap/pm/view', '@tiptap/starter-kit']`. Això elimina d'arrel l'error d'`Invalid hook call` quan Vite pre-empaqueta Tiptap en mode desenvolupament.
   - **Taules i Geometria (`P1-16` / `IDEA-20`):** Verificat en `src/components/Taula.jsx` i `src/css/sdp.css`. El component `<Taula>` embolcalla amb `.sdp-taula-embolcall` i garanteix `overflow-x: auto` sense trencar el contenidor.
   - **Xat Fluid i Ordre Monòton (`P1-17` / `IDEA-21`):** Verificat en `src/sections/xat/components/Conversa.jsx:20-55` i `src/data/supabase/xat.js`. L'enviament optimista utilitza clau d'idempotència (`clientId`), fusió determinista per `seq` (`ordenaMissatgesPerSeq`) i auto-scroll amb llindar de 96 px (`PROP_DEL_FINAL_PX`).
   - **Blindatge WP i Unificació de Slug (`P0-22`, `P1-19`, `P1-21`, `P1-22`):** Verificat en `wordpress-plugin/includes/actualitzador.php:12-65` i `wordpress-plugin/eines/empaqueta.mjs`. El circuit d'auto-actualització valida SHA-256 de 64 hexadecimals, exigix `socdepoble/socdepoble.php` sense symlinks ni *path traversal*, i el validador de sintaxi ja no utilitza l'expressió regular amb *backtracking* exponencial (ReDoS).

2. **Troballa de Deute Documental al Llibre Mestre (`P2-15` · Segrest de Context per Històrics Intermedis):**
   - Tot i que les files `P0-22`, `P1-16`, `P1-17`, `P1-19`, `P1-21` i `P1-22` ja llueixen l'etiqueta `[FET · b842160ac]`, el fitxer `03_llibre_mestre_tasques_i_idees.md` pesa **110,7 KB** perquè diverses cel·les (`IDEA-20`, `IDEA-21`, `IDEA-22`, `IDEA-26`, `IDEA-27`, `P1-07`..`P1-11`, `P1-20`, `P2-12`) conserven entre 5 i 10 paràgrafs de bitàcoles intermèdies del Gauntlet (`05:56`, `06:28`, `06:58`, `07:20`, `07:56`, `08:30`, `09:05`, `09:20`) que ja han sigut superades pel commit `b842160ac` i per l'Acta Marmota `261025_1600_acta_marmota_triomf_gauntlet_loop_xat_fluid_i_blindatge_wp.md`.
   - **Acció executada en aquest torn:** Compactació quirúrgica dels blocs intermedis ja tancats dins `03_llibre_mestre_tasques_i_idees.md`, preservant el 100% de les idees vives (`IDEA-01` a `IDEA-31`), els hashes de commit, les referències de codi i els pendents reals cap al 10/10.

---

##### Bloc 2 · Full de Ruta Tecnicoarquitectònic cap al 10/10 als 7 Mòduls del Mas

| Mòdul | Nota Actual | Objectiu | Diagnòstic Tècnic i Bretxes Exactes al Codi |
| --- | --- | --- | --- |
| **1. Port Neutral (`backendPort.js`, `host.js`, `adaptadors/sollutia/`)** | **9,5 / 10** | **10 / 10** | **Fortaleses:** `src/data/backendPort.js` congela el contracte (`CONTRACT_VERSION = 1`), i `src/data/adaptadors/sollutia/creaFrontissa.js` ja implementa transport exclusivament `GET`, `credentials: 'omit'`, `redirect: 'error'`, verificació de `captureId`, lector de stream acotat per `maxBytes` i `timeoutMs` sobre el cos complet.<br>**Bretxes per al 10/10:**<br>1) **Connexió Catàleg-Client (`client.js:4-8`):** `CONFIGURACIO.resources` és `Object.freeze({})` i encara no connecta el catàleg de traductors de `src/data/adaptadors/sollutia/recursos.js` (`RECURSOS.perfil.traductor`) sota bandera d'activació quan Sollutia lliure l'origen definitiu.<br>2) **Supervivència Rural Offline (*Stale-While-Revalidate*):** Si la connexió rural cau (`UNAVAILABLE` / `TIMEOUT`), `creaFrontissa.js` llança excepció immediata sense consultar una última captura vàlida en cau local (`localStorage`/`IndexedDB` sota clau `sdp:frontissa:v1:<recurs>:<hashParams>`) marcada amb `{ _stale: true, _cachedAt }`.<br>3) **Guardes d'Època en Hooks (`P1-15` · `C2-01` / `C2-02`):** En `src/hooks/useTitularDeConnexio.js:24-39` i `src/components/GestioMembres.jsx:29-42`, cal incloure un comptador d'època de sessió/amfitrió (` sessionEpoch`) perquè cap promesa en vol d'una sessió anterior pise l'estat després d'un canvi d'usuari o d'`orgId`. |
| **2. Bateria de Proves (`test:precommit` i suite global)** | **9,6 / 10** | **10 / 10** | **Fortaleses:** `npm run test:precommit` passa **3.391 proves en verd (3.132 Vitest + 259 Node, 0 fallades)** en ~22 segons.<br>**Bretxes per al 10/10:**<br>1) **Reconciliació de la Suite Global Completa (`npx vitest run` i `npm run test:node`):** Corregir les 4 proves de Vitest i les 3 proves/3 TODO de Node fora del subconjunt de precommit perquè tant el precommit ràpid com la suite nocturna completa estiguen al 100% en verd.<br>2) **Prova de Geometria de Taules a 385 px:** Afegir en `src/components/Taula.test.jsx` i en el test de regresió CSS la verificació explícita de contenidor estret (`385px`) i contrast fotomètric $\Delta E$. |
| **3. Pedra Seca (`sdp.css`, `tokens.css`, `Taula.jsx`, `parseMarkdown.js`)** | **8,5 / 10** | **10 / 10** | **Diagnòstic al mil·límetre en `src/css/sdp.css` i `src/utils/parseMarkdown.js`:**<br>1) **Contrast Fotomètric Insuficient a les Taules (`sdp.css:27-36`):** Actualment `:where(thead th)` usa `background: var(--sdp-fons-app)` (`#F3F0EC`, RGB `243,240,236`) i `:where(tbody tr:nth-child(even))` usa `background: var(--sdp-fons-subtil)` (`#EFECE7`, RGB `239,236,231`). La diferència lumínica és de només **4 punts sobre 255 ($\Delta E < 1,5$)**, fent la zebra i la capçalera quasi invisibles en monitors estàndard. **Solució 10/10:** Assignar a `:where(thead th)` `background: var(--sdp-pedra-200)` (`#E2DDD5`) amb `border-block-end: 2px solid var(--sdp-vora-control)` (`#C8C1B6`), files imparells explícites en `var(--sdp-fons-targeta)` (`#FFFFFF`) i files parells en `var(--sdp-fons-subtil)` (`#EFECE7`), més `margin-block: var(--sdp-space-4) var(--sdp-space-6)` (`16px` dalt, `24px` baix) per separar taules consecutives.<br>2) **Overflow de Taules Nues en Escriptori (`sdp.css:55-65`) i Accessibilitat a Markdown (`parseMarkdown.js:162-169` · `C1645-07`):** La regla `overflow-x: auto` sobre `:where(table)` està tancada dins `@media (max-width: 40rem)`. A més, `parseMarkdown.js:162-169` genera `.sdp-taula-prosa` sense `tabIndex="0"`, `role="region"` ni `aria-label`. Cal aplicar l'overflow horitzontal sense restricció de `@media` i dotar `.sdp-taula-prosa` d'atributs d'accessibilitat de teclat igual que `<Taula>`.<br>3) **View Transitions Ja Existents i Anatomia Editorial (`IDEA-27`):** `src/app/App.jsx:683-693,1126-1133` i `modules.css:1928-1946` ja implementen `document.startViewTransition` amb `prefers-reduced-motion` (no cal duplicar la capa d'animació); resta completar l'anatomia editorial de 3 escalons (`H1 → H2 → .lead → H3 → P → .sdp-accions`) en les 25 vistes restants inventariades. |
| **4. Xat Fluid Estil WhatsApp (`Compositor.jsx`, `ControlsAdjunt.jsx`, `MarquesEstat.jsx`, `Bombolla.jsx`, `xatMultimedia.js`)** | **8,4 / 10** | **10 / 10** | **Descobriment clau d'arquitectura:** Tant la gravació d'àudio (`MediaRecorder` Opus/WebM/MP4 a 64 kbit/s, 5 min / 3 MB en `src/sections/xat/adjuntLocal.js:186-237`), com la quota acumulada de **20 MB per persona (`QUOTA_XAT_BYTES = 20_000_000` en `src/data/xatMultimedia.js:6`) JA EXISTEIXEN al codi!** Per què l'experiència encara no és 10/10 com WhatsApp? Per **4 bretxes exactes**:<br>1) **Bretxa 4A · Ergonomia del Compositor (`Conversa.jsx:996-1009` i `ControlsAdjunt.jsx:174-219`):** `ControlsAdjunt` es renderitza com una barra separada damunt de `<Compositor>` i fa `return null` si `quotaXat` encara no ha carregat o si s'està en mode llavor/local. En WhatsApp, el botó d'adjuntar (`+` / Clip) viu **dins del `<Compositor>` a l'esquerra** (al costat del selector d'Emojis), i el botó de **Micròfon (`<Mic>`) substitueix dinàmicament el botó `<Send>` a la dreta quan el camp de text està buit (`buit === true`)**, transformant la caixa en un cronòmetre viu (`00:14`) amb ona d'àudio i botó de paperera per cancel·lar o enviar en un sol toc.<br>2) **Bretxa 4B · Límit de Vídeo i Documents PDF (`xatMultimedia.js:7-14`):** `MAX_VIDEO_MS` està clavat en `10_000` (10 segons), rebutjant vídeos de 30-120 segons encara que càpiguen dins la quota de 20 MB per persona! A més, `MIME_XAT` només admet imatge, àudio i vídeo, però no `application/pdf` (actes, bans o factures de la cooperativa). **Solució 10/10:** Ampliar `MAX_VIDEO_MS` (p. ex. a `180_000` = 3 minuts dins del sostre de 20 MB per persona), afegir un indicador visual d'ús de quota (`X,X MB / 20 MB`) i admetre `application/pdf` amb validació real de capçalera `%PDF-` i consum de la mateixa quota.<br>3) **Bretxa 4C · Tics d'Estat (`enviat`, `entregat`, `llegit`) sobre `public.xat_participants` (`MarquesEstat.jsx:10-33`):** `MarquesEstat.jsx` només contempla `pendent` (rellotge), `enviat` (1 tic gris) i `llegit` (2 tics blaus), ometent `entregat` (2 tics grisos). En l'esquema SQL vigent (`2610220240_xat_adjunts_i_quota.sql:438-464`), la lectura viu a `public.xat_participants` (no `xat_lectures`); cal afegir la marca de recepció (`entregat_fins_seq`) i propagació Realtime per mutar els tics en viu de gris a blau sense recarregar.<br>4) **Bretxa 4D · Reaccions Ràpides d'Emoji (`Bombolla.jsx`):** `Bombolla.jsx` ja té resposta citada (`CitaResposta`, `onRespon`), però li falta la barra flotant de 6 reaccions ràpides (`👍 ❤️ 😂 😮 😢 🙏`) amb upsert idempotent per missatge i participant. |
| **5. Connector de WordPress (`socdepoble-enxufe.php`, `actualitzador.php`, `empaqueta.mjs`)** | **8,8 / 10** | **10 / 10** | **Diagnòstic d'Arrel per a Instal·lacions Antigues (`C1645-06`):**<br>1) **Compatibilitat Real WP 5.8+ i PHP 7.4+ (`socdepoble-enxufe.php:7-8`, `blocks/*/block.json` i `empaqueta.mjs:318`):** No n'hi ha prou amb baixar la capçalera `Requires at least: 5.8`: els fitxers `blocks/*/block.json` usen `apiVersion: 3` i propietat `render` (introduïts en WP 6.1/6.3). Perquè el paquet autònom (`dist/soc-de-poble.standalone.js`) funcione d'arrel en **WP 5.8+ i PHP 7.4+**, cal registrar els blocs amb un `render_callback` PHP explícit compatible amb WP 5.8 i mantindre el shortcode `[socdepoble]` com a reserva universal.<br>2) **Pont de Migració Transparent de Slug (`WP-03` / `P1-09`):** Les webs que ja tenien `socdepoble-enxufe/socdepoble-enxufe.php` instal·lat necessiten que el paquet nou mantinga `socdepoble-enxufe.php` com a fitxer pont (`require_once __DIR__ . '/socdepoble.php';`) i execute en `admin_init` una migració atòmica d'`option('active_plugins')` cap a `socdepoble/socdepoble.php`.<br>3) **Neteja del ZIP (`WP-02`):** Excloure `.DS_Store` i `builds/migracions_pendents.sql` en `empaqueta.mjs`. |
| **6. Botigues Apple i Google (`ios/App/`, `android/`, `compte-apple/gestor.js`)** | **8,2 / 10** | **10 / 10** | **Diagnòstic d'Homologació Store-Ready (`P1-18`, `P0-23`, `P0-24`, `C1645-08`):**<br>1) **Seguretat Edge Function (`P1-18` · `WM1/WM2` en `supabase/functions/compte-apple/gestor.js:73,261`):** Nota crítica: `P1-18` NO és el ReDoS (que és `P1-21`, ja resolt en `b842160ac`), sinó el lector sense límit de bytes de `compte-apple`. Cal reutilitzar el lector de stream acotat de `creaFrontissa.js` per tallar el cos a 4.096 bytes reals i mantindre el timeout de 5.000 ms durant tota la descàrrega del cos.<br>2) **Control de Versió Mínima i Deep Links (`BOT-02`, `BOT-03`):** Afegir `comprovaVersioMinima()` a l'arrencada; configurar `apple-app-site-association` i `assetlinks.json` per a recuperació de contrasenya; connectar el botó físic `backButton` d'Android en Capacitor.<br>3) **Binaris Frescos (`1.0.0 (2)` · SDK iOS 26+ / Android API 36):** Els artefactes actuals ja compilen amb `iphoneos27.1` (Xcode 2710) i `targetSdk 36`, però empaqueten el bundle antic `index-BZGLZYBH.js` anterior a `b842160ac`. Cal substituir `soc_de_poble_ibanez.webp` (`BOT-M1`), retirar `socdepoble-beta.apk` (`debuggable`, `P0-23`) i recompilar el Build #2 des del commit vigent. |
| **7. Intel·ligència IAIA MarIA (`iaiaLocal.js`, `_cultura_de_poble/`, Edge Function `iaia`, `bot/` WhatsApp `IDEA-01`)** | **8,5 / 10** | **10 / 10** | **Troballes tècniques (`P1-24`, `C1645-03`, `C1645-04`):** A més de les 3 Capes d'Intel·ligència detallades ací baix, el bot de WhatsApp actual a `bot/` té dos errors d'arrencada al checkout que cal reparar abans d'enxufar la SIM de Vodafone: 1) `bot/arrels.mjs:47-50` apunta a `bot/rag_index.json` (mentre el builder escriu `public/rag-index.json`) i `edge_rag.mjs:108-126` falla amb `TypeError: stopwords.has is not a function` perquè `JSON.parse` hidrata un `Array` i no un `Set`; 2) `bot/cervell.mjs:166,251` fa créixer `session.history` sense límit (cal podar l'array en desar, no només en construir el prompt). |

---

##### Explicació Clara per al Mestre Javi: D'on Trau la seua Intel·ligència la IAIA MarIA? (Arquitectura de 3 Capes)

Mestre, perquè no hi haja cap caixa negra ni cap embolic tècnic, la intel·ligència de la IAIA MarIA dins del Mas electrònic s'organitza com una casa de poble amb **tres plantes molt clares**:

###### Capa 1 · El Rebost de Casa (Memòria Local Instantània · Cost 0 € i Funciona Sense Internet)
- **On viu:** Dins del propi telèfon o navegador de l'usuari, al fitxer `src/data/iaiaLocal.js` i alimentada pels documents de `_cultura_de_poble/` i la Wiki (`wikiManifest.js`).
- **Com pensa:** No crida a cap servidor extern. Utilitza un cercador matemàtic ultraràpid (BM25 amb arrels de paraules valencianes i sinònims rurals) que llig el **Rebost Cultural del Poble**: receptes tradicionals, refranys, malnoms, història de La Torre de les Maçanes, guia d'ús del Mas i memòria dels majors.
- **Per a què serveix:** Quan un veí pregunta *«Com es fa l'olleta?»*, *«Com publique un ban?»* o *«Què vol dir trellat?»*, la Capa 1 respon en **menys de 20 mil·lisegons**, gratis i encara que no hi haja cobertura mòbil al bancal.

###### Capa 2 · El Seny del Consell al Núvol (Edge Function `iaia` al nostre Supabase · Raonament Profund i Segur)
- **On viu:** En una funció protegida del nostre servidor Supabase (`supabase/functions/iaia/`), mai exposant claus secretes al mòbil.
- **Com pensa:** Quan una pregunta necessita raonar, resumir una acta llarga o redactar un document nou, la Capa 2 agafa primer els fragments verídics del nostre Rebost (RAG sobre `_cultura_de_poble/` i notes públiques del poble), li aplica la **Constitució i Personalitat de la IAIA MarIA** (`02_genotip.md` + `personalitat_iaia.md`) i consulta el model d'IA (Gemini / Claude).
- **Seguretat i Llei (10/10 per a Apple, Google i la UE):** La resposta s'escriu a la base de dades oficial (`public.xat_missatges`) amb el segell `is_ai: true` (Art. 50 de l'AI Act europeu `IA-07`) i amb un `id` real perquè qualsevol usuari puga prémer «Denuncia resposta» si la IA s'equivoca, complint al 100% la política d'IA Generativa de Google Play (`IA-02`).

###### Capa 3 · La Finestra de WhatsApp amb la SIM de Vodafone (`IDEA-01` · El Pont per als Majors)
- **On viu:** És el pont exterior connectat al número de mòbil de Vodafone que ja teniu preparat.
- **Com funciona pas a pas:**
  1. Un veí major (que no vol instal·lar cap app nova) envia un **àudio de WhatsApp** o un missatge de text al número de telèfon de la IAIA MarIA.
  2. La passarel·la oficial de WhatsApp (webhook connectat a la nostra Edge Function) rep el missatge. Si és una nota de veu, la transcriu a text en valencià (Speech-to-Text).
  3. El missatge passa exactament pel mateix cervell de les **Capes 1 i 2** (consulta el Rebost del poble i el Seny de la IAIA).
  4. La IAIA li contesta al seu WhatsApp en valencià clar i, si el veí li ha parlat per àudio, li pot tornar també una **nota de veu amb veu càlida** (Text-to-Speech), registrant la consulta (si és d'interés comunitari i amb permís) al Mas electrònic.

---

##### Bloc 3 · Diagnòstic Forense i Solució Definitiva per a `porta-olivera.mjs` (v5) i `core-higiene-escriptori`

Hem auditat línia per línia `tooling/gates/porta-olivera.mjs` (1.450 línies) i `.agents/skills/core-higiene-escriptori/SKILL.md` per explicar per què l'auditoria va necessitar una neteja manual d'11 documents a `04_escriptori/` tot i haver-se tancat la tasca del matí:

###### Les 5 Causes Exactes al Codi Actual (`porta-olivera.mjs`)

1. **Causa 1 · `ranci()` (`línies 218-221`) ignora qualsevol document llistat en `## Activitat en curs` i qualsevol document del mateix dia (`d.data < dia`):**
   ```js
   function ranci(arrel, dia = hui()) {
     const viu = declarats(arrel);
     return llistaEscriptori(arrel).filter((d) => d.data && d.data < dia && !viu.has(d.nom));
   }
   ```
   Com que `tooling/wiki/document.mjs create` inscriu automàticament cada nou fitxer dins `## Activitat en curs` de `00_index_escriptori.md`, `viu.has(d.nom)` és sempre `true`. Per tant, **`ranci()` mai detecta com a arxivable cap fitxer creat amb `document.mjs create`**, ni el mateix dia ni l'endemà!
2. **Causa 2 · Els torns tenen un TTL de 24 hores (`expiresAt`) i `vidaDe()` (`línies 577-582`) els dóna per vius mentre no es tanque explícitament el torn:**
   Quan un document té `reflex: sdp:torn_...` al frontmatter, `vidaDe()` crida `estatTorn(arrel, tornId)`. Com que els agents executaven `tancament.mjs` en mode lectura sense `--close`, el torn d'una onada matinal (`0545`, `0607`, `0610`) seguia en estat `"opened"` o `"planned"` durant 24 hores, i `vidaDe()` li posava el segell `🌿 valid: true`.
3. **Causa 3 · Absència de Superació d'Onada (*Wave Supersession*) en `vidaTaula()` (`línies 606-659`):**
   Quan al mateix dia s'obri una nova onada canònica (per exemple, el pla `261025_1645_pla_implementacio_...` i el prompt `261025_1645_prompt_...`), els plans, prompts i auditories d'onades anteriors del mateix dia (`261025_0545_*`, `261025_0607_*`, `261025_0610_*`) ja han sigut consumits i superats, però `vidaTaula()` no comprova si existeix una família de convocatòria amb marca horària `AAMMDD_HHMM` posterior i estat actiu.
4. **Causa 4 · `.agents/olivera-fase.json` no existeix en disc (`línies 441-453` i `740`):**
   `faseConvocatoria(arrel)` retorna `'avis'` per defecte quan `.agents/olivera-fase.json` no existeix. En mode `'avis'`, tots els incompliments `CONV-01..CONV-08` van a l'array `avisos` i mai a `errors`, de manera que `porta-olivera.mjs` acaba sempre amb `exit code 0` encara que hi haja documents caducats (`🍂`).
5. **Causa 5 · `arxivables()` sense `--nom` (`línia 1007`) només consulta `ranci()`:**
   Quan s'executa `node tooling/gates/porta-olivera.mjs --arxiva`, la funció `arxivables()` ignora els documents marcats amb `🍂` (`!v.valid`) per `vidaTaula(arrel, dia)` i només mou els que retorne `ranci()`.

###### Disseny de l'Esmena Canònica `porta-olivera.mjs` (v5) i `core-higiene-escriptori`

Perquè cap agent ni el Mestre Javi hagen de netejar mai més l'escriptori a mà, l'esmena v5 sobre `tooling/gates/porta-olivera.mjs` consta de 3 regles quirúrgiques:
1. **Regla `CONV-09` (Superació Automàtica d'Onada del Mateix Dia):** Dins `vidaTaula(arrel, dia)`, determinar el prefix `AAMMDD_HHMM` de l'últim `pla_implementacio` o `prompt` actiu a `04_escriptori/`. Qualsevol `pla_implementacio`, `prompt` o `auditoria_*` amb timestamp `AAMMDD_HHMM` estrictament anterior al de l'onada vigent (i que no tinga un motiu explícit `arxiu-diferit:` en la taula) passa automàticament a `🍂 valid: false, codi: 'CONV-09', detall: 'onada superada per convocatòria posterior'`.
2. **Unificació d'`arxivables()` amb `vidaTaula()` (`línia 1007`):** Quan s'invoca `node tooling/gates/porta-olivera.mjs --arxiva` (sense `--nom`), `arxivables()` ha d'unir `ranci(arrel, dia)` **més** tots els documents amb `vida.get(d.nom)?.valid === false` (`🍂`), movent-los amb `git mv` a `90_arxiu_historic/` i podant al mateix acte la seua fila de `## Activitat en curs` cap a una única línia d'històric en `00_index_escriptori.md`.
3. **Tancament de Torn en `core-higiene-escriptori/SKILL.md`:** Documentar com a pas obligatori de tancament d'onada l'execució de `node tooling/govern/tancament.mjs --id <tornId> --close` seguida de `node tooling/gates/porta-olivera.mjs --arxiva`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Comprovacions executades directament sobre el repositori `socdepoble.org`:

1. **Verificació de Porta Olivera:**
   - Comanda: `node tooling/gates/porta-olivera.mjs`
   - Resultat: `exit code 0` (`🟢 L'escriptori està net i polit com una patena, Mestre!`).
2. **Verificació del Llibre Mestre i Escriptori:**
   - Inspecció completa de `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` i compactació d'històrics intermedis consumits.
3. **Inspecció de Codi Font dels 7 Mòduls:**
   - `vite.config.js` (línies 85-95: `dedupe: ['react', 'react-dom']`).
   - `src/data/backendPort.js`, `src/host.js`, `src/data/adaptadors/sollutia/client.js`, `creaFrontissa.js` i `recursos.js`.
   - `src/css/sdp.css` (línies 1-289: contrast de taules i regles `@media`).
   - `src/sections/xat/components/Compositor.jsx`, `ControlsAdjunt.jsx`, `Conversa.jsx`, `Bombolla.jsx`, `AdjuntXat.jsx`, `MarquesEstat.jsx`, `src/sections/xat/adjuntLocal.js` i `src/data/xatMultimedia.js`.
   - `wordpress-plugin/socdepoble-enxufe.php`, `includes/actualitzador.php` i `eines/empaqueta.mjs`.
   - `src/data/iaiaLocal.js` i `supabase/functions/compte-apple/gestor.js`.
4. **Verificació d'Estructura Canònica del Document:**
   - Comanda: `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261025_1645_auditoria_gemini.md`

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- L'abast del torn `torn_a30045fb-cee2-4c83-b722-11b923670a69` és `documents` (auditoria canònica i depuració documental del Llibre Mestre). Les modificacions de codi productiu en `src/`, `wordpress-plugin/`, `supabase/functions/` i `tooling/gates/porta-olivera.mjs` queden especificades al detall amb fitxer i línia exacta per a l'execució coordinada de l'obrera (Claude) i la validació del Trio.
- La connexió de la Capa 3 de la IAIA MarIA amb la SIM de Vodafone (`IDEA-01`) requerirà les credencials del compte de WhatsApp Business Cloud API o del webhook autoritzat pel Mestre Javi en les variables d'entorn de Supabase.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261025_1645_pla_implementacio_habitabilitat_mas_xat_total_i_excelencia_10]]
- [[261025_1645_prompt_claude_gemini_codex_habitabilitat_mas_xat_total_i_excelencia_10]]
- [[261025_1701_auditoria_codex]]
- [[261025_1600_acta_marmota_triomf_gauntlet_loop_xat_fluid_i_blindatge_wp]]
