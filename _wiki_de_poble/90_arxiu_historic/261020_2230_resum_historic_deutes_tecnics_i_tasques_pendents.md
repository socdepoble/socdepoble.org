---
type: informe
status: canonic
description: Destil·lació històrica dels 100 plans d'implementació i 239 auditories de 90_arxiu_historic amb el catàleg complet de deutes tècnics, rutes pendents i priorització P0/P1/P2 prèvia a l'evacuació i al llançament públic
tags:
  - govern
  - auditoria
  - arquitectura
visibility: private
reflex: sdp:torn_1be1a18c-b5b1-45c7-9492-a8f481f25682:c0208939-812f-499e-8dfd-3ae76d0e68be
---

# Catàleg Històric de Deutes Tècnics, Rutes Pendents i Priorització de Llançament (Setembre – Octubre 2026)

> **Propòsit d'aquest document:** Condensar i preservar tota l'evidència tècnica acumulada als **573 fitxers** de `_wiki_de_poble/90_arxiu_historic/` (**100 plans d'implementació**, **239 auditories** i **58 estudis del Laboratori d'IA**, que sumen 139 MB de sediment operatiu) abans de la seua evacuació cap a `../_arxiu_wiki_de_poble/historics_2026/` per a entrar nets a l'App Store d'Apple, a Google Play i a `gentdelatorre.com`.

---

## 1. Radiografia dels 100 Plans d'Implementació (Setembre – Octubre 2026)

L'anàlisi transversal dels 100 plans d'implementació entre el `260921` i el `261020` mostra que el projecte ha evolucionat a través de **sis grans cicles d'enginyeria**. A continuació es detalla què va quedar resolt i, sobretot, **què es va quedar a mitges, en estat d'esquelet o pendent de rematar** en cadascun d'ells.

### 1.1. Eix 1 · Governança, Cervell Canònic i Portes Mecàniques (`260921` – `260930` i `261013` – `261018`)

 Plans auditats: `260922_2133_pla_implementacio_consola_termodinamica.md`, `260924_1858_pla_implementacio_plantilla_viva.md`, `260929_1222_pla_implementacio_motor_cognitiu.md`, `261013_1940_pla_implementacio_govern_validacio_automatica.md`, `261018_1220_pla_implementacio_sessio_usuari_i_poda.md`, `261018_2000_pla_implementacio_capacitats_matrix_i_poda_wiki.md`.

| Component / Subsistema | Estat actual a l'HEAD | Deute tècnic o tram inconclús | Referència d'origen |
| --- | --- | --- | --- |
| **Consola Termodinàmica i Termòmetre** | Operativa (`tooling/govern/termometre_context.mjs`). | **`R27` / `G10`:** La funció `comptaArtefactes()` existeix a `tooling/govern/termometre_context.mjs:446`, però `recullConsola()` encara no emet el camp `termometria.artefactesActius` cap a l'arbre de salut visual de la consola. | `261016_1639_pla_implementacio_relleu_codex_gauntlet.md` (`R27`) |
| **Targetes de Sostre al Panell de Salut** | Parcial. | **`R26`:** Les targetes `nodes-del-dom` i `fitxers-dins-del-sostre` continuen sense connectar-se en temps real a les mètriques del navegador i del repositori. | `261016_1639` (`R26`), `261013_1600` |
| **Registre de Torns (`registre-torns.json`)** | Operatiu amb `porta-olivera.mjs`. | **Hipòtesi 3 (`261018_1220`):** Més de 260 torns històrics en estat `expired` romanen al registre sense transicionar a un estat terminal `retired` que alleugerisca la inspecció d'orfandat. | `261018_1220_pla_implementacio_sessio_usuari_i_poda.md` |
| **Tractor de Pedra Seca (`tractor-pedra-seca.mjs`)** | Audita `src/main.jsx`. | **Deute Fase D §9:** `tooling/gates/tractor-pedra-seca.mjs:36` declara `const ENTRADES = ['src/main.jsx']` i encara no inclou `'src/natiu/entrada.jsx'`, deixant l'arbre d'importacions natiu fora del control d'orfandat si no s'invoca el tractor natiu. | `261020_1518_auditoria_claude_fase_d_auth_mobil_i_moderacio.md` (§9) |
| **Preflight i Pujada iOS (`preflight.mjs`, `puja-ios.mjs`)** | Operatius a `tooling/natiu/`. | **Deute Fase D §9:** Falta afegir a `preflight.mjs` la sentinella contra `facebook-ios-sdk` en `Package.resolved` i afegir `-onlyUsePackageVersionsFromResolvedFile` a `puja-ios.mjs` per evitar que Xcode rehidrate l'SDK de Facebook (229 MB) en compilar un archive net. | `261020_1518` (§3.2 i §9) |

---

### 1.2. Eix 2 · Xat Clon WhatsApp, Identitat Dual i Ponts de Missatgeria (`260926` – `261015`)

Plans auditats: `260926_1225_pla_implementacio_xat_clon_whatsapp_f0.md`, `261001_1400_pla_implementacio_identitat_organitzacions.md`, `261013_0215_pla_implementacio_xat_identitat_iaia.md`, `261015_1900_pla_implementacio_xat_identitat_i_perfil.md`.

| Funcionalitat dissenyada | Estat actual a l'HEAD | Deute tècnic o flux pendent de tancar | Ubicació exacta al codi |
| --- | --- | --- | --- |
| **Fase F1 d'Adjunts al Xat** | Posposat a F1 amb avís visible. | El botó d'adjuntar al xat mostra el missatge provisional `'Els adjunts arriben amb la fase F1'`. No puja encara imatges, àudios ni documents des de la barra del xat. | `src/llengues/ca.js:716` (`chat.input.attachmentsPending`) |
| **Telefonades i Videotelefonades WebRTC** | Dissenyat per ADR, no implementat. | La pestanya de telefonades mostra `'Les telefonades de veu i vídeo s'estan governant per ADR específic i s'activaran en una iteració futura.'` i el detall de xat indica `'Les trucades WebRTC arriben en la fase següent.'` | `src/llengues/ca.js:533` (`nav.telefonades.avis`), `ca.js:630` (`chat.detail.callsPending`) |
| **Missatges Temporals i Xifratge E2EE** | Textos d'interfície presents com a promeses futures. | El panell d'informació de conversa mostra `'Els missatges temporals es definiran en una fase posterior.'` i `'El xifratge d'extrem a extrem es governa en una fase posterior.'` | `src/llengues/ca.js:632, 878` (`chat.detail.disappearingPending`, `chat.info.encryptionDesc`) |
| **Sincronització de Bloquejos de Xat** | Doble estat (moderació UGC vs xat local). | Mentre que la Fase D ha creat `public.bloquejos_usuari` per a moderació UGC (`src/serveis/moderacioServei.js`), el xat antic encara manté avisos de bloqueig local (`'El bloqueig s'ha desat en aquest dispositiu mentre s'activa la migració al servidor.'`). Cal unificar el bloqueig de conversa amb `public.bloquejos_usuari`. | `src/llengues/ca.js:594, 631` (`chat.block.localFallbackWarning`) |
| **Bot Pont WhatsApp / Arrels (`R05`)** | Trencat per fitxers inexistents. | `bot/arrels.mjs:47-49` referencia tres fitxers que no existeixen al repositori; el daemon del bot de pont amb WhatsApp/Telegram no pot arrencar. | `bot/arrels.mjs:47-49` (`R05` a `261016_1639`) |
| **Cerca dins dels Missatges del Xat (`F39`)** | Parcial. | La cerca al llistat de converses busca per títol de conversa/contacte, però no indexa ni ressalta coincidències dins del cos històric dels missatges. | `261016_1639` (`F39`) |

---

### 1.3. Eix 3 · Arquitectura de Plugins (`sdp.modul.v1`) i Mòduls Rurals (`261002` – `261016`)

Plans auditats: `261002_0205_pla_implementacio_arbre_genealogic.md`, `261003_2025_pla_implementacio_lector_rss.md`, `261008_1955_pla_implementacio_onada6.md`, `261009_1216_pla_implementacio_onada7.md`, `261011_1314_pla_implementacio_ficiv.md`, `261013_1405_pla_implementacio_gestoria_jarvis.md`, `261014_2030_pla_implementacio_gestoria_quadre_comandament_i_conciliacio.md`, `261015_1620_pla_implementacio_arquitectura_plugins_moduls.md`.

1. **Quatre Portes «En Obres» al Panell de Control (`src/sections/control/destinsControl.js` i `src/llengues/ca.js:1168`):**
   - Tot i tindre icona i ruta al Panell de Control, les targetes de **`Vehicle Compartit`** (`/app/cotxe`), **`Animalets`** (`/app/animals`), **`Treball`** (`/app/treball`) i **`Habitatge`** (`/app/habitatge`) porten l'etiqueta `(en obres)` (`section.control.porta.enObres`) i no tenen encara l'adaptador operatiu d'oferta/demanda connectat al motor d'«El Comú».
2. **Lector RSS de Poble (`src/apps/lector/`, `I04`–`I06`, `G08`, `R02`):**
   - Té el nucli (`src/apps/lector/nucli/`) i la vista, però roman pendent d'hidratar el connector en viu per a les fonts RSS reals (Emowe, Xavier Mitjana, Jon Hernández, Ben Cord, Migue Baena) sense dependre només de llavors estàtiques, així com l'extensió/bookmarklet de captura directa al Lector (`I05`, `I06`, `R02`).
3. **TPV Bar «La Parròquia», Rebost i Cens (`src/apps/bar/`, `src/apps/nevera/`):**
   - Tenien el catàleg real de La Parròquia (`export_items-6.csv`) i el recomanador de 14 receptes rurals amb 176 sinònims valencià/castellà (`src/apps/nevera/nucli/`), però mancava la peça unificadora de llista reactiva al xat i al mur. **Aquesta és precisament la Fase E en curs (`261020_2045_pla_implementacio_el_comu_i_llistes_reactives.md`)** amb `UniversalListCard` i la taula `public.elements_comu`.
   - **Deute d'acoblament detectat (`R12`):** El test `src/apps/bar/llavors/laParroquia.test.js:35,198` encara llig directament `MAPA_IMATGES.txt` de la carpeta d'investigació, acoblant un test unitari a un fitxer de laboratori.
4. **Gestoria Rural / Jarvis / Holded / GnuCash (`src/apps/gestoria/`, `I27`–`I28`, `R17`–`R18`):**
   - El Tauler, el Quadre de Comandament amb comparativa interanual 2022–2026 (`261014_2030`) i el motor d'exportació Excel del 3T 2026 (`2026-FACTURACIO-3T.xlsx`) estan operatius, igual que l'analitzador de bases de subvencions FICIV (`261011_1314`).
   - **Queda pendent (`R17`):** Completar el motor de llibre major de partida doble estricta inspirat en GnuCash (`Account` jeràrquic recursiu + `Transaction` on $\sum \text{ splits } = 0$ en enters racionals) i la Finestreta Única de tràmits rurals (`R16`).
5. **Arbre Genealògic d'IA i Memòria de Llinatges (`261002_0205_pla_implementacio_arbre_genealogic.md`, `R03`, `G11`):**
   - Pla d'arquitectura hexagonal completat al detall (6 ports: `GenealogyStore`, `ImportPort`, `InterviewPort`, `ResearchPort`, `TreeLayoutPort`, `ExportPort`, amb GEDCOM 7.0 + SQLite WASM Worker i entrevista oral guiada per la IAIA MarIA).
   - **Estat real:** 0% del codi creat (`src/sections/genealogia/*` no existeix). Està formalment ancorat al full de ruta com a fita `2027-H2` a `src/data/fullDeRuta2027.js`.

---

### 1.4. Eix 4 · Gauntlet Extrem de Tardor: Notes, Emojis, Multimèdia, Rutes i Obsidian (`261016` – `261018`)

Plans i auditories auditats: `261016_1639_pla_implementacio_relleu_codex_gauntlet.md`, `261017_1136_pla_implementacio_tancament_gauntlet_22_punts.md`, `261017_1509_pla_implementacio_tancament_definitiu_gauntlet_12_punts.md`, `261017_2133_auditoria_codex_final_gauntlet.md`, `261018_1405_estudi_obsidian_rea_gemini4_iaia.md`, `261018_2000_pla_implementacio_capacitats_matrix_i_poda_wiki.md`.

1. **Bug P1 obert a l'Editor de Notes (`C01` / `C02` de `261017_2133_auditoria_codex_final_gauntlet.md`):**
   - **Símptoma:** Si un veí obri una nota nova amb la plantilla per defecte (llavor), la desa explícitament sense canviar-ne el text, tanca i torna a obrir la mateixa nota (mateix `id`), en fer focus/blur a l'editor el cos es buida (`""`) i en publicar es desa buida.
   - **Causa arrel:** `esLlavorDeNota` a `src/hooks/useUniversalRichText.js:250-266` i `src/context/NotesContext.jsx:295` dedueix si el contingut és una plantilla efímera comparant només l'HTML amb la llavor verge, sense distingir si la nota acaba de nàixer o si ja fou persistida voluntàriament per l'usuari (`origenPlantilla` vs `desadaPerUsuari`).
2. **Visor d'Imatges dins del Cos d'Articles i Notes (`C04`):**
   - Tant la imatge de portada com el carrusel obrin el visor a pantalla completa (`ImageLightboxModal`), però les imatges incrustades dins del cos HTML enriquit (`src/sections/universal/detailSectionMeta.jsx:172-173` i `src/sections/universal/detailRichText.jsx:20`) es renderitzen com a `<img>` estàtics sense manejador per a obrir el visor.
3. **Compatibilitat d'Emojis Unicode 18 (`C10`):**
   - `src/llavors/emojis_catalog.js` inclou 16 entrades amb punts de codi d'esborrany Unicode 18 que l'expressió regular `\p{Extended_Pictographic}` de `emojiSol` (`src/sections/xat/xatFormatText.js:34-41`) rebutja en motors JavaScript amb ICU/Unicode 16, impedint que es renderitzen com a *jumbo emoji* quan s'envien sols al xat.
4. **Geolocalització EXIF i Mapa Fotogràfic (`M08`–`M11`):**
   - L'extracció de coordenades GPS EXIF remotes per petició `Range` de 64 KB (`C03`, `src/utils/exifGeo.js`) està tancada i en verd, però falta construir la vista de **Mapa Fotogràfic amb *clustering* dinàmic per zoom i línia de temps lateral** (`M08`–`M10` de `261016_1639`).
5. **Enginyeria Inversa d'Obsidian 1.14.4 (`261018_1405_estudi_obsidian_rea_gemini4_iaia.md`):**
   - Es van dissenyar dos components clau inspirats en el motor d'Obsidian que encara no s'han portat a `src/`:
     * `src/hooks/useTreeDragReorder.js`: reordenació d'arbres de carpetes/notes amb geometria d'impacte `5% / 90% / 5%`, auto-expansió de carpetes tancades als `750ms` i actualització optimista d'`ordre_visual`.
     * `src/components/universal/WorkspaceSettingsPanel.jsx`: panell d'ajustos a pantalla completa amb navegació lateral de 220px per substituir el modal minúscul `<Dialeg mida="s">` de `WorkspaceSettingsDialog` a `src/components/universal/UniversalWorkspace.jsx`.
6. **Rutes Històriques i Redireccions (`F60`–`F65`, `M07`):**
   - Falta redirigir les rutes antigues `/multimedia/town-*` cap al poble canònic (`M07`), acabar de segellar la distinció entre `/anima` (manifest de la IAIA) i `/perfil/iaia-maria` (`F64`–`F65`), i eliminar l'`<iframe src="/iaia-maria">` i l'enllaç a `/skills` incrustats dins de `src/sections/text/pageContent.js:115,134`.

---

### 1.5. Eix 5 · Empaquetat Mòbil Capacitor 8, Auth Natiu, Moderació i «El Comú» (`261019` – `261020`)

Plans i auditories auditats: `261019_2045_pla_implementacio_capacitor_mobil_universal.md`, `261019_2155_auditoria_claude_capacitor_mobil.md`, `261020_1300_pla_implementacio_botigues_i_auth_mobil.md`, `261020_1518_auditoria_claude_fase_d_auth_mobil_i_moderacio.md`, `261020_2045_pla_implementacio_el_comu_i_llistes_reactives.md`, `261020_2100_auditoria_gemini_skills_i_textos_publics.md`.

La Fase C (Capacitor 8) i la Fase D (Auth mòbil Apple/Google, esborrat de compte i moderació UGC) han deixat el codi amb 20.174 proves en verd, però les auditories de tancament (`261019_2155`, `261020_1518` i `261020_2100`) han identificat un conjunt taxatiu d'accions pendents d'infraestructura, seguretat, botigues i textos que s'ordenen tot seguit en la matriu `P0` / `P1` / `P2`.

---

## 2. Llista Prioritzada per al Llançament (`P0` / `P1` / `P2`)

### 🔴 `P0` · Imprescindible per a les Botigues i Producció (Bloquejants d'App Store, Google Play, Seguretat i `gentdelatorre.com`)

Cap paquet `.ipa` o `.aab` ni cap desplegament públic a `gentdelatorre.com` / `socdepoble.org` ha d'eixir sense haver tancat aquests **12 punts P0**:

| ID | Àmbit | Descripció del deute o requisit bloquejant | Fitxers / Infraestructura afectada |
| --- | --- | --- | --- |
| **`P0-01`** | **Seguretat RLS / SQL** | **Fuga de `contact_email` d'organitzacions a usuaris anònims:** La migració `2610181915_organitzacions_correu_i_membres.sql` (línia 22) executa `grant select (contact_email, public_email) on table public.organizations to anon, authenticated;`, exposant el correu privat de contacte a qualsevol consulta anònima amb l'`anon_key`. Cal una migració correctora que revoque `select (contact_email)` per a `anon` i `authenticated` generals i el limite als administradors de l'organització via RPC o vista segura. | `supabase/migrations/2610181915_organitzacions_correu_i_membres.sql:22` |
| **`P0-02`** | **Seguretat / Secrets** | **Revocació de `mcp_token` històric:** El fitxer `Bóveda Comunidad — Revolutia IA.webloc` (commit `ed6077ff`) va exposar a l'historial de git un token `mcp_token=...` d'n8n (`revolutia-n8n.onrender.com`). Cal revocar i rotar immediatament eixe token al servidor d'n8n. | Historial Git (`ed6077ff`) / Panell n8n |
| **`P0-03`** | **Apple / Google OAuth Natiu** | **Credencials reals d'OAuth i esquema URL a iOS/Android:** Substituir el marcador `com.googleusercontent.apps.pendent` a `ios/App/App/Info.plist:46`, omplir `VITE_NATIU_GOOGLE_WEB_CLIENT_ID` i `VITE_NATIU_GOOGLE_IOS_CLIENT_ID` a `.env.natiu.local`, registrar els SHA-1 d'Android (debug i upload key de Google Play) a Google Cloud Console, i configurar `DEVELOPMENT_TEAM` i la *capability* **Sign in with Apple** per a `org.socdepoble.app` a Apple Developer Portal. | `ios/App/App/Info.plist`, `.env.natiu.local`, `ios/App/App/App.entitlements` |
| **`P0-04`** | **App Store 5.1.1(v)** | **Revocació del token d'Apple en esborrar el compte:** Apple exigeix que quan un usuari que ha entrat amb *Sign in with Apple* esborra el seu compte, el servidor revoque el seu *refresh/authorization token* contra `https://appleid.apple.com/auth/revoke` usant el `client_secret` JWT signat amb la clau `.p8`. Cal desplegar l'Edge Function o webhook connectat a `public.esborra_propi_compte()`. | `supabase/migrations/2610201400_esborrat_propi_compte.sql` + Supabase Edge Function |
| **`P0-05`** | **Migracions Producció** | **Aplicar migracions de Fase D i Fase E a Supabase Producció:** Executar en producció `2610201400_esborrat_propi_compte.sql`, `2610201500_moderacio_denuncies_i_bloquejos.sql` (moderació UGC exigida per App Store Guideline 1.2) i la nova migració de Fase E `elements_comu` amb l'RPC CAS atòmic (`reclamar_element_comu` amb `.is("claimed_by", null)`), més el *worker*/cron per buidar `private.purga_storage_pendent`. | `supabase/migrations/` -> Supabase Prod |
| **`P0-06`** | **Google Play / App Store** | **Desplegar `https://socdepoble.org/legal#esborra-compte` en producció:** Tant App Store Connect com el formulari *Data Safety* de Google Play revisen en viu l'URL pública d'esborrat de compte declarada als metadades (`public/lloc-botigues/politica-privacitat.html`). Cal desplegar el frontend actualitzat a `socdepoble.org` abans d'enviar les apps a revisió. | `src/sections/text/LegalSection.jsx`, `public/lloc-botigues/politica-privacitat.html` |
| **`P0-07`** | **Identitat Visual de Marca** | **Logotips oficials d'Apple/Google i icones/splash de Capacitor:** (1) Verificar que els traços SVG a `src/components/icones/LogotipsDeMarca.jsx` compleixen al 100% les guies oficials d'Apple Human Interface Guidelines i Google Identity; (2) substituir les icones i *splash screens* per defecte de Capacitor a `ios/App/App/Assets.xcassets/` i `android/app/src/main/res/mipmap-*` per l'escut de pedra seca de Sóc de Poble. | `src/components/icones/LogotipsDeMarca.jsx`, `ios/`, `android/` |
| **`P0-08`** | **Textos Legals (`legalContent.js`)** | **Sanejament lingüístic i dades fiscals coherents:** (1) Resoldre la contradicció entre `[DADES PROTEGIDES AL CODI FONT]` i el NIF `G-03967668` exposat dues línies més avall a `src/sections/text/legalContent.js:11-15`; (2) substituir les **11 ocurrències del barbarisme *«conta»*** per **«compte»** a `legalContent.js:90-108` i l'anglicisme *«en temps real»* per **«al moment»**. | `src/sections/text/legalContent.js` |
| **`P0-09`** | **Pàgina «Qui som» (`pageContent.js`)** | **Eliminar l'`<iframe src="/iaia-maria">` recursiu i l'enllaç mort `/skills`:** `src/sections/text/pageContent.js:115` incrusta un `<iframe src="/iaia-maria">` de 650px que dins de l'app i de Capacitor carrega una segona instància completa de l'aplicació dins de la pàgina «Qui som», i a la línia 134 enllaça a `/skills` (ruta inexistent). | `src/sections/text/pageContent.js:115, 134` |
| **`P0-10`** | **Diccionaris Multiidioma (`es`, `en`, `eu`, `gl`)** | **Traduir les claus de Fase D que van quedar en valencià cru dins dels altres 4 idiomes:** Els fitxers `src/llengues/es.js` i `en.js` tenen **12 claus** d'esborrat de compte i moderació (`legal.esborra.*`, `moderacio.*`) en valencià sense traduir, i `eu.js` i `gl.js` en tenen **31** (incloent `auth.oauth.*` i `auth.error.*`). Un revisor d'Apple o Google amb el telèfon en castellà o anglès veuria el flux crític d'esborrat de compte i denúncia en valencià. | `src/llengues/es.js`, `en.js`, `eu.js`, `gl.js` |
| **`P0-11`** | **Lèxic d'Arrencada (`ca.js`)** | **Substituir «ítems» per «elements» a `src/llengues/ca.js`:** Corregir les 3 ocurrències d'`ítems` a `src/llengues/ca.js:119, 1385, 1509` per alinear tota la interfície amb el concepte canònic d'«El Comú» i la prohibició d'anglicismes. | `src/llengues/ca.js:119, 1385, 1509` |
| **`P0-12`** | **Evacuació de `90_arxiu_historic/`** | **Moure el sediment històric (139 MB) fora del repositori actiu:** Un cop validats aquests dos documents de síntesi, evacuar els centenars de fitxers de sessions passades a `../_arxiu_wiki_de_poble/historics_2026/` conservant a `_wiki_de_poble/90_arxiu_historic/` només l'índex i aquesta destil·lació canònica. | `_wiki_de_poble/90_arxiu_historic/` |

---

### 🟡 `P1` · Millores d'Estabilitat, Usabilitat i Poliment de Fluxos (Immediatament després o en paral·lel al llançament)

| ID | Àmbit | Descripció de la tasca | Fitxers afectats |
| --- | --- | --- | --- |
| **`P1-01`** | **Fase E · El Comú** | **Culminar `UniversalListCard`, `BottomSheet` i els 5 arquetips d'«El Comú»:** Tancar la implementació de les rajoles reactives de 98×116 px estil Bring!, el detall progresiu en `BottomSheet` amb els 11 modificadors de La Parròquia, el comparador rural amb cost de benzina ($30\text{ km} \times 0,25\text{ €/km} = 7,50\text{ €}$) i el pont bidireccional entre el Xat i el Panell del Comú. | `src/components/universal/UniversalListCard.jsx`, `src/apps/bar/`, `src/apps/nevera/` |
| **`P1-02`** | **Editor de Notes (`C01`/`C02`)** | **Corregir la pèrdua de contingut quan una nota desada coincideix amb la llavor:** Separar a `useUniversalRichText.js:250-266` i `NotesContext.jsx:295` la bandera d'`esPlantillaEfimera` del contingut textual perquè una nota desada per l'usuari mai es buide en remuntar-se. | `src/hooks/useUniversalRichText.js`, `src/context/NotesContext.jsx` |
| **`P1-03`** | **Enllaços Natius (`F7` Fase C)** | **Forçar l'origen públic `https://socdepoble.org` en compartir des de l'app nativa:** Actualment `UniversalPage.jsx:195`, `useAccions.js:156`, `PerfilPublicSection.jsx:146` i `useSEO.js:56` empren `window.location.origin` (`capacitor://localhost` a iOS o `https://localhost` a Android), generant enllaços compartits per WhatsApp que no obrin la web. | `src/components/universal/UniversalPage.jsx`, `src/hooks/useAccions.js`, `src/sections/perfil/PerfilPublicSection.jsx` |
| **`P1-04`** | **Seguretat Sessió Mòbil (`F1`/`F6`)** | **Blindar el token de sessió i la pàgina d'error en Capacitor:** (1) Posar `android:allowBackup="false"` (o excloure `app_webview`) a `AndroidManifest.xml` i custodiar el *refresh token* en Keychain/Keystore natiu; (2) afegir `server.errorPath` a `capacitor.config.json` per a WebViews antics. | `android/app/src/main/AndroidManifest.xml`, `capacitor.config.json` |
| **`P1-05`** | **Pes del Bundle Natiu (`F3` Fase C)** | **Podar els últims 3,3 MB d'imatges prescindibles de `dist-natiu`:** (1) Substituir la referència CSS a `xat-bg-map-v2.jpg` (`src/estils/tokens.css:531`, 1,03 MB) i a `bloc_notes_vintage.jpg` (`src/sections/disseny/EspecimenEnquadrament.jsx:193`, 941 KB) per les seues versions `.webp`; (2) excloure `public/og-card-*.jpg` (1,33 MB) del build natiu. | `src/estils/tokens.css`, `src/sections/disseny/EspecimenEnquadrament.jsx`, `tooling/natiu/construeix-web-natiu.mjs` |
| **`P1-06`** | **Visor d'Imatges i Emojis (`C04`/`C10`)** | **Activar el visor a pantalla completa en les imatges del cos d'articles (`C04`) i filtrar o proporcionar *fallback* per als 16 emojis d'esborrany Unicode 18 (`C10`).** | `src/sections/universal/detailSectionMeta.jsx`, `src/llavors/emojis_catalog.js` |
| **`P1-07`** | **Lector RSS i Termòmetre (`I04`/`R27`)** | **Connectar l'adaptador de fonts RSS reals al Lector (`/app/lector`) i exposar `termometria.artefactesActius` a `recullConsola()`.** | `src/apps/lector/`, `tooling/govern/termometre_context.mjs` |
| **`P1-08`** | **Portes de Govern (`Fase D §9`)** | **Tancar els 3 pegats de govern pendents:** `src/natiu/entrada.jsx` a `tractor-pedra-seca.mjs`, sentinella anti-`facebook-ios-sdk` a `preflight.mjs` i flag `-onlyUsePackageVersionsFromResolvedFile` a `puja-ios.mjs`. | `tooling/gates/tractor-pedra-seca.mjs`, `tooling/natiu/preflight.mjs`, `tooling/natiu/puja-ios.mjs` |

---

### 🟢 `P2` · Futura Evolució Post-Llançament (Full de Ruta 2026 T4 – 2027)

| ID | Àmbit | Descripció de l'evolució | Origen històric |
| --- | --- | --- | --- |
| **`P2-01`** | **8 Targetes del Manifest** | Desplegar els fluxos complets per a les 4 portes actualment «en obres» (`Cotxe de Poble`, `Animalets`, `Treball / Oficis`, `Habitatge / Banc de Terres`) més `Tractor i Eines Compartides` i `Mans Veïnes` sobre la infraestructura unificada d'`elements_comu`. | `260911_0645_propostes_manifest_panell_control.md`, `261020_2045` |
| **`P2-02`** | **Obsidian REA a l'Escriptori** | Implementar `useTreeDragReorder.js` (geometria `5% / 90% / 5%` i auto-expansió a `750ms`) i `WorkspaceSettingsPanel.jsx` (panell d'ajustos a pantalla completa amb barra lateral de 220px) en `UniversalWorkspace.jsx`. | `261018_1405_estudi_obsidian_rea_gemini4_iaia.md` |
| **`P2-03`** | **Xat Fase F1 i WebRTC** | Adjunts multimèdia al xat (`chat.input.attachmentsPending`), cerca dins del cos de missatges (`F39`), telefonades de veu/vídeo WebRTC i reparació del bot de pont `bot/arrels.mjs` (`R05`). | `260926_1225`, `261016_1639` |
| **`P2-04`** | **Mapa Fotogràfic EXIF** | Vista cartogràfica amb *clustering* per nivell de zoom i línia de temps lateral alimentada per les coordenades EXIF de les fotografies històriques i veïnals (`M08`–`M11`). | `261016_1639_pla_implementacio_relleu_codex_gauntlet.md` |
| **`P2-05`** | **GnuCash i Finestreta Única** | Motor de partida doble estricta en enters racionals per a la Gestoria Rural (`R17`), desacoblament de `laParroquia.test.js` (`R12`) i assistent de Finestreta Única contra la burocràcia agrària (`R16`). | `261013_1405`, `261013_1600`, `261014_2030` |
| **`P2-06`** | **Arbre Genealògic d'IA (`2027-H2`)** | Construcció dels 6 ports de `src/sections/genealogia/` amb GEDCOM 7.0, SQLite WASM i el mode d'entrevista oral guiada per la IAIA MarIA per preservar els llinatges i malnoms del poble. | `261002_0205_pla_implementacio_arbre_genealogic.md` |
| **`P2-07`** | **Sobirania Local i Fedivers** | Connexió amb el Fedivers via ActivityPub i execució local d'inferència (Qwen / Ollama al servidor del Mas) per a independència total de núvols externs. | `src/data/fullDeRuta2027.js`, `01_manifest_fundacional_soc_de_poble.md` |
