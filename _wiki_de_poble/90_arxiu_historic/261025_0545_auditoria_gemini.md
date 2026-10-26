---
type: informe
status: esborrany
description: Auditoria integral del Llibre Mestre (IDEA-01..31, P0..P2), DAFO Salfumant Radical, Matriu d'Eisenhower Q1-Q4, blindatge WP/botigues, arquitectura del xat WhatsApp + IAIA i síntesi creuada amb Codex i Claude.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_d2064380-5e68-4ccd-b020-35786a3a9eb4:22137987-14c0-4f51-bbfc-45c5a3afbb77
---
# Auditoria Estratègica Gemini 4 Argon · Gran DAFO, Matriu d'Eisenhower, Blindatge WordPress/Botigues, Xat Fluid, Mètriques Lliures i Síntesi Creuada (v1.1.0)

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d2064380-5e68-4ccd-b020-35786a3a9eb4:22137987-14c0-4f51-bbfc-45c5a3afbb77 |
| Versió del document | 1.2.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T05:09:16.758Z |
| Modificació | 2026-10-25T15:00:00.000Z |
| Propietari | gemini-argon |
| Aprovació humana | aprovada per delegació expressa del Mestre Javi Llinares (Àudios 05:27–06:01) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | gemini-4-argon (iaia-maria-directora-tecnica) |
| Tokens consumits | ~54.800 |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-25T05:09:16.758Z: esborrany creat sota el torn canònic `torn_d2064380-5e68-4ccd-b020-35786a3a9eb4`.
- 2026-10-25T05:16:00.000Z: v1.0.0 amb l'auditoria inicial de les 4 tasques del prompt `261025_0545`.
- 2026-10-25T05:21:00.000Z: v1.1.0 contrastada i depurada amb les troballes empíriques de Codex (`261025_0607_auditoria_codex.md` v1.0.0) i el primer relleu de Claude (`261025_0610_auditoria_claude.md` v0.1.0), verificant directament `src/data/telemetria.js`, `src/data/traductor.js`, `src/data/supabase/xat.js:403-418` i la salvaguarda de `active_plugins` a WordPress.
- 2026-10-25T15:00:00.000Z: v1.2.0 amb la revisió creuada final del diff combinat de l'arbre de treball (després de les 8 passades de Codex v1.7.0 i els 3 cicles de correcció de Claude v1.0.0) i emissió del **Vistiplau Final per al Commit Consolidat**.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 1. Blindatge de l'Estructura Arquitectònica (WordPress, Botigues i Estrès)

#### 1.1 Connector de WordPress (`build:wp`, `vite.standalone.config.js`, `wordpress-plugin/`)

1. **Fortaleses verificades al codi vigent:**
   - **Segellat estricte del Model B (`sdp-model-b-segellat`):** En `vite.standalone.config.js` (línies 59–122) i `src/PedraSecaEmbed.jsx` (`segellaConfiguracioAmfitrio`, línies 57–83), el paquet neutralitza qualsevol intent de l'amfitrió de sobreescriure `supabaseUrl`, `supabaseAnonKey`, `authRelayUrl` o `backendAdapter`.
   - **Zero fugues de `process.env` (`sdp-sense-process`):** `vite.standalone.config.js` (línies 166–189) analitza l'AST de cada chunk generat amb Rollup per avortar el build si cap llibreria filtra `process.env` al navegador.
   - **Doble variant amb integritat criptogràfica (`SDP_VARIANT=autonom` vs `SDP_VARIANT=wordpress`):** La variant autònoma utilitza code-splitting ESM (`trossos/`) amb carregador IIFE `< 4 KB` (`soc-de-poble.standalone.js`, `3.427 B`) que valida `sha384` (SRI) i `crossOrigin='anonymous'`; la variant del directori de WordPress.org (`build:wp:directori`) compila un bundle monolític sense `trossos/`, externalitza `react`, `react-dom` i `react/jsx-runtime` cap a `wp-element` (WordPress ≥ 6.6) i purga qualsevol patró d'actualitzador propi (`PATRONS_ACTUALITZADOR` a `wordpress-plugin/eines/empaqueta.mjs:70-81`), complint les exigències de Fernando Tellado (`P0-13`).

2. **Troballes i deutes oberts al Connector de WordPress (contrastats amb Claude i Codex):**
   - **`[WP-01]` Divergència d'Slug i Salvaguarda de `active_plugins` (`P1-09`):** `wordpress-plugin/eines/empaqueta.mjs` (línia 44) defineix `export const SLUG = 'socdepoble-enxufe'` i el fitxer principal es diu `wordpress-plugin/socdepoble-enxufe.php`, mentre que `Plugin Name: Sóc de Poble` deriva l'slug `'socdepoble'` (avís a `empaqueta.mjs:701-704`). **Esmena crucial de Claude (`261025_0610_auditoria_claude.md:49`) validada per Direcció Tècnica:** WordPress guarda el connector actiu per la ruta `carpeta/fitxer.php` a l'opció `active_plugins`. Si una actualització del canal propi canvia de colp `socdepoble-enxufe/socdepoble-enxufe.php` → `socdepoble/socdepoble.php`, WordPress desactivarà el plugin a les instal·lacions existents. Per tant:
     * En la **variant del directori de WordPress.org** (`directori.zip`, instal·lació neta amb l'slug aprovat `socdepoble`), `empaqueta.mjs` ha d'empaquetar sota `socdepoble/socdepoble.php`.
     * En el **canal propi** (`wordpress_enxufe.zip`), cal mantindre un fitxer pont `socdepoble-enxufe.php` (o la migració d'`active_plugins` en l'`upgrader_process_complete`) abans de retirar el nom antic.
   - **`[WP-02]` Residus físics a `wordpress-plugin/`:** S'han detectat `.DS_Store` (`8.196 B` a `wordpress-plugin/.DS_Store` i `6.148 B` a `wordpress-plugin/builds/.DS_Store`) i `wordpress-plugin/builds/migracions_pendents.sql` (`153.315 B` del 8 d'octubre). Tot i que `empaqueta.mjs` usa llista blanca (`ADAPTADOR`), cal netejar aquests residus del repositori.
   - **`[WP-03]` Dependència privativa DeepL a `traduccio.php` (`C0545-S1`):** `wordpress-plugin/includes/traduccio.php:256-266` depèn exclusivament de `SOCDEPOBLE_DEEPL_KEY`, mentre que el client frontend (`src/data/traductor.js`) ja està perfectament desacoblat.

---

#### 1.2 Blindatge per a les Botigues (Apple App Store i Google Play)

S'ha auditat la matriu `P0-01` a `P0-21` del Llibre Mestre contra els fitxers reals de `supabase/migrations/` i `supabase/functions/`:

| Requisit de Botiga / Legal | Estat en Codi Local i Tests | Estat en Producció i Reserves |
| --- | --- | --- |
| **Apple Guideline 1.2 & Google Play UGC** (Filtre d'acceptació de normes, denúncia i bloqueig) | ✅ Implementat (`2610201500_moderacio_f0.sql`, `2610241400_normes_exigides_ugc.sql`, `Bombolla.jsx`, `CapcaleraConversa.jsx`) | 🔴 Pendent d'aplicar a Supabase Prod (`P0-05`, `P0-21`). Cal acreditar també el segon canal de contacte humà no automatitzat de DSA Art. 12.1 (`P0-18`). |
| **Apple Guideline 5.1.1(v)** (Baixa de compte + Revocació de token Sign in with Apple) | ⚠️ Implementat amb 2 reserves d'esgotament (`supabase/functions/compte-apple/gestor.js`, `2610241420_revocacio_apple.sql`) | 🔴 Pendent de desplegar `compte-apple` i secrets `APPLE_*` (`P0-04`, `P0-21`), i tancar **`C0545-WM1`** (`req.text()` llig el cos sencer abans del límit de 4.096 B i d'autenticar) i **`C0545-WM2`** (`ambTopall` neteja el timer en rebre capçaleres abans d'acabar de llegir el cos). |
| **GDPR Art. 17 & Esborrat UGC/Storage en Baixa** (`P0-20`) | ✅ Implementat (`2610201400_eliminar_propi_compte.sql`, `2610241440_baixa_completa_ugc_i_fitxers.sql`, `supabase/functions/purga-fitxers/index.ts`) | 🔴 Pendent de desplegar a Prod (`P0-05`, `P0-21`) i tancar la reserva `D-02` sobre metadades `xat_fils.titol/subjecte_titol` de publicacions esborrades. |
| **OAuth Natiu iOS/Android** (`P0-03`) | 🔴 Pendent de credencials reals | `ios/App/App/Info.plist:46` encara conserva el placeholder `com.googleusercontent.apps.pendent`. |
| **CSP `media-src` per a Àudio/Vídeo de Xat** (`P0-19`) | ✅ Implementat (`firebase.json`, `index.html`, validat per `AdjuntXat.porta.test.js`) | 🔴 Pendent de `firebase deploy --only hosting` (`P0-19`). |

---

#### 1.3 Enginyeria Inversa (REA) i Proves d'Estrès / Concurrència

1. **Correcció de Cita sobre Idempotència d'Enviament al Xat (`xat_envia`):**
   - Verificat directament a `src/data/supabase/xat.js:403-418` i corroborat per Codex (`261025_0607_auditoria_codex.md:122`): `enviaMissatge` **ja envia `p_id: entrada.id`** a l'RPC `xat_envia`, i `XatContext.jsx` conserva el mateix `id` durant els reintents (`DEMORES_REINTENT_MS = [1000, 2000, 4000]`). Per tant, la idempotència per `p_id` ja està coberta al client i a l'esquema SQL.
2. **Vectors Reals de Concurrència al Xat i a l'Aplicació (Detectats i/o Corregits en aquest Cicle):**
   - **`[C0545-X1]` (Corregit localment per Codex a `src/sections/xat/missatges.js:376`):** Una confirmació fora d'ordre (`seq 12` seguida de `seq 11`) deixava `ultimSeq = 12` però sobreescrivia el resum (`text`, `hora`, `tipus`, `autoria`) amb el missatge antic `seq 11`.
   - **`[C0545-X2]` (Corregit localment per Codex a `src/sections/xat/components/Conversa.jsx`):** En fallar un enviament `A` mentre l'usuari ja escrivia un segon esborrany `B`, el `catch` trepitjava `B` amb `A` tant a l'input com al magatzem d'esborranys.
   - **`[C0545-X3]` (Obert a `src/sections/xat/XatContext.jsx:883-885`):** Quan l'historial inicial encara està en vol, es confirma un enviament propi `seq 2` i tot seguit es resol l'snapshot inicial que només portava fins a `seq 1`, `fusionaPerSeq([], nous)` substitueix la llista en memòria i fa desaparèixer temporalment `seq 2` de la vista fins al següent refresc.
   - **`[C2-01]` i `[C2-02]` (`P1-15`, Oberts):** `src/hooks/useTitularDeConnexio.js` indexa `memoriaTitulars` només per `orgId` sense `scopeKey` (`adaptador + url + usuari`), i `src/components/especimens/GestioMembres.jsx` no invalida l'estat optimista en canviar d'`organitzacio.id`.
   - **`[C2-04]` / `[G0200-R2-01]` (`P1-16`, Obert):** Desbordament de taules nues a `353px–385px` en columna estreta d'escriptori per l'ús de `@media (max-width: 40rem)` a `src/styles/sdp.css:55` i manca de contrast ($\Delta E < 1.5$) entre capçalera `#F3F0EC` i files parelles `#EFECE7`.

---

### 2. El Gran DAFO Estratègic (Salfumant Radical) i Matriu d'Eisenhower

#### 2.1 Anàlisi DAFO (Salfumant Radical · Sense Inflar Garanties)

##### Fortaleses Internes
- **Model B i Port Neutral (`src/data/backendPort.js` + `contracte.js`):** Desacoblament estricte verificat pel kit de conformitat (`src/data/conformitat/`) i les portes estàtiques (`tractor-frontissa`, `tractor-rls`).
- **Primitives Sobiranes Ja Construïdes al Codi:**
  * Client de traducció neutre per lots amb pressupost i control de bytes UTF-8 (`src/data/traductor.js`).
  * Motor de telemetria sense galetes ni scripts de tercers (`src/data/telemetria.js`, `RouteTelemetria`, `TaulerTelemetria`) que tapa rutes personals (`/perfil/*`) i respecta `DNT`/`GPC`.
  * Motor local de cerca documental BM25 amb abstenció honesta i protecció ReDoS (`src/data/iaiaLocal.js`).
- **Bateria de Precommit Ràpida i Reproduïble:** 156 fitxers / 3.046 tests Vitest + 259 tests Node en ~25–37 segons amb 0 fallades.

##### Debilitats Internes
- **Bretxa d'Operació en Producció (`P0-03`, `P0-04`, `P0-05`, `P0-18`, `P0-19`, `P0-20`, `P0-21`):** Les migracions de moderació/baixa/seguiments/titular, les 3 Edge Functions (`compte-apple`, `purga-fitxers`, `noticies`), la CSP `media-src` i les credencials OAuth natives encara no estan desplegades ni acreditades en l'entorn de producció.
- **Curses d'Estat i Xat (`C0545-X3`, `C0545-WM1`, `C0545-WM2`, `P1-15`, `P1-16`):** Condicions de cursa en la càrrega inicial del xat, límits de lectura de stream en `compte-apple/gestor.js`, fuga d'àmbit en `useTitularDeConnexio.js` i desbordament de taules en columnes estretes.
- **Buit de Resposta Conversacional de la IAIA en Mode Remot i Falta de Corpus Cultural:** `iaiaLocal.js` només indexa 3 documents tècnics de la Wiki; encara no conté les càpsules culturals del Comtat (Pep Cascant, DCVB, *El Rentonar*) i en remot (`supabase/xat.js`) l'adaptador no escriu al fil de la IAIA.
- **Infranotificació d'Estat en Traducció i Telemetria (`C0545-S1`, `C0545-S2`, `C0545-S3`):** `traduccio.php` depèn de DeepL, `TranslationsSection.jsx` diu que el motor és inexistent tot i existir `traductor.js`, i `telemetria.js:192` marca `enviat: true` abans que resolga el `fetch`.
- **Sobrecàrrega Cognitiva Documental (`CONV-07`):** `00_index_escriptori.md` acumula 1.050 línies i `03_llibre_mestre_tasques_i_idees.md` supera els 93 KB en paràgrafs densos que penalitzen el consum de tokens en cada cicle.

##### Oportunitats Externes
- **Enxufabilitat Imminent amb Sollutia (`src/data/adaptadors/sollutia/client.js`):** El transport GET amb `credentials: 'omit'`, `redirect: 'error'` i validació d'origen ja està blindat i a punt per rebre les captures i fixtures reals.
- **Substitució de DeepL per Servei Lliure darrere del Mateix Contracte (`traductor.js`):** Com que el client `src/data/traductor.js` ja és agnòstic del proveïdor, connectar-lo a un motor lliure (Apertium / LibreTranslate / Edge Function sobirana amb cache SHA-256) no requereix tocar cap component de lectura.
- **Convocatòria NLnet (`2026-11-03 12:00 CET`):** Oportunitat real de finançament públic europeu per a infraestructures digitals sobiranes i del comú.

##### Amenaces Externes
- **Rebuig en App Store / Google Play:** Si s'envia a revisió abans de desplegar les migracions, `compte-apple` (amb `WM1`/`WM2` corregits), `purga-fitxers` i les credencials OAuth a `Info.plist`.
- **Desactivació Accidental del Plugin de WordPress en Actualitzar (`[WP-01]`):** Si es canvia el nom de `socdepoble-enxufe.php` al canal propi sense migració de `active_plugins`.
- **Infraccions Estàtiques a `tractor-enxufe` en Tests (`7 infraccions E1`):** Detectades per Codex en imports directes de fitxers de test que cal netejar sense relaxar la porta.

---

#### 2.2 Matriu d'Eisenhower Destil·lada (`IDEA-01` a `IDEA-31`, `P0`, `P1`, `P2`)

| Quadrant | Ítems del Llibre Mestre i Deutes | Acció i Criteri de Tancament |
| --- | --- | --- |
| **Q1 · Urgent i Important** (Executar Ara) | • **Xat Fluid:** `C0545-X1` i `C0545-X2` (corregits localment), tancar `C0545-X3` (`XatContext.jsx:883`).<br>• **Blindatge Apple:** `C0545-WM1` i `C0545-WM2` (`compte-apple/gestor.js`).<br>• **Concurrència i Taules:** `P1-15` (`C2-01` `useTitularDeConnexio.js`, `C2-02` `GestioMembres.jsx`), `C11-03`, `P1-16` / `IDEA-26` (`C2-04` taules en 385px).<br>• **Desplegament Prod:** `P0-03`, `P0-04`, `P0-05`, `P0-18`, `P0-19`, `P0-20`, `P0-21`. | 0 regresions en `test:precommit`; PoC de `C0545-X3`, `WM1/WM2` i `P1-15` en verd; taules contingudes a `353px/385px` amb contrast $\Delta E \ge 3$; migracions i Edge Functions desplegades en ordre. |
| **Q2 · Important, No Urgent** (Arquitectura i Següent Onada) | • **Traductor Lliure (`C0545-S1`, `P1-09`):** Substituir/complementar DeepL a `traduccio.php` o Edge Function mantenint el contracte de `src/data/traductor.js`.<br>• **Telemetria Verificada (`C0545-S3`):** Confirmar recepció HTTP a `src/data/telemetria.js:184-192` (`estat: 'pendent' -> 'enviat' | 'fallat'`) i comptador agregat opcional de lectures.<br>• **Corpus Cultural IAIA:** Compilar càpsules verificades (Pep Cascant, DCVB, *El Rentonar*) dins del pressupost de `src/data/iaiaLocal.js`.<br>• **Producte:** `IDEA-22` (polimorfisme entitat a `/connectar`), `IDEA-23` (connectabilitat universal), `IDEA-24` (transferència d'entitats), `IDEA-25` (vCard `.vcf`), `IDEA-27` (guarda executable d'anatomia editorial). | Reutilitzar motors existents (`traductor.js`, `telemetria.js`, `iaiaLocal.js`) sense duplicar codi; cites culturals amb font i drets verificats; prova `jsdom` d'anatomia `H1→H2→.lead→H3→p→.sdp-accions`. |
| **Q3 · Urgent, Menor Impacte** (Ajustar i Automatitzar) | • **Coherència de Rètols (`C0545-S2`):** Actualitzar `TranslationsSection.jsx:42-61` perquè reflectisca el traductor de pàgines ja operatiu.<br>• **Sincronització Documental (`C0545-D1`, `CONV-07`):** Corregir la frase del Model B i versió a `prompt_consell.md:104` i podar les 12 seccions buides de `00_index_escriptori.md`. | Textos alineats als 5 diccionaris i portes documentals sense avisos de sediment. |
| **Q4 · Cartera Futura / Congelat** (Posposar fins tancar Q1/Q2) | • **`IDEA-28`** (Assistent vocal IAIA per a creació editorial).<br>• **`IDEA-29`** (Motor universal d'ingesta Blogger/WordPress/Issuu).<br>• **`IDEA-30`** (Notícies germanes i graf semàntic).<br>• **`P1-12` / `P2-07`** (E2EE complet al xat i federació ActivityPub S2S). | Mantenir al Llibre Mestre com a disseny de referència fins que Q1 estiga 100% desplegat en producció. |

---

#### 2.3 Enginyeria de Reutilització per a Estadístiques, Traductor i Corpus IAIA (Sense Duplicar Motors)

En lloc d'inventar motors paral·lels, l'arquitectura s'ancora directament sobre els 3 mòduls ja existents al repositori:

1. **Estadístiques Lliures sobre `src/data/telemetria.js` (`C0545-S3`):**
   - `src/data/telemetria.js` ja implementa el registre d'entrades (`registraVisita`) i actes conscients sense galetes, ocultant trams personals (`rutaTapada`) i respectant `DNT`/`GPC` i `localStorage['umami.disabled']`.
   - **Millora exacta:** En `src/data/telemetria.js:184-192`, substituir l'emissió prematura d'`enviat: true` per un estat honest que reflectisca la resolució del `fetch` (`res.ok`), actualitzant l'entrada a `darrersEnviaments` i reemetent `ESDEVENIMENT_DOM` perquè `TaulerTelemetria` mostre la confirmació real i no un fals positiu quan la xarxa talla.
2. **Traductor Lliure sobre `src/data/traductor.js` i `wordpress-plugin/includes/traduccio.php` (`C0545-S1`, `C0545-S2`):**
   - `src/data/traductor.js` ja implementa el particionat Unicode (`partixText`, `partixEnLots`), els límits (`LIMITS_TRADUCCIO`: 50 textos, 5.000 caràcters, 20.000 bytes) i el contracte `POST { textos, desti, origen: 'CA', format }`.
   - **Millora exacta:** Dins de `wordpress-plugin/includes/traduccio.php` (i en una Edge Function mirall per a l'app fora de WordPress), afegir un adaptador de proveïdor lliure (Apertium / LibreTranslate) com a motor primari o fallback quan `SOCDEPOBLE_DEEPL_KEY` no estiga definida, afegint `EU` (Euskara) i `GL` (Galego) a `LLENGUES_TRADUCCIO` (`src/data/traductor.js:26-31`) i actualitzant `TranslationsSection.jsx:42-61` (`C0545-S2`).
3. **Corpus Cultural sobre `src/data/iaiaLocal.js`:**
   - Reutilitzar el motor BM25 i el compilador `tooling/compile-cultura.mjs` per injectar un manifest de càpsules culturals verificades (amb font documental exacta, data i llicència pública) sense enviar mai missatges privats del xat a serveis externs i mantenint la distinció clara entre consulta local a la Wiki/Cultura (`ConsultaIAIA.jsx`) i missatges d'autoria remota al fil compartit.

---

### 3. Diagnòstic i Millora del Xat Fluid (`sdp-xat` · Patró WhatsApp Rural)

1. **Estat del Motor Actual:**
   - `Conversa.jsx` (`estabilitza`, `WeakMap` d'accions, `IntersectionObserver` únic de lectura, ancoratge geomètric `posicioAlContingut` amb `ol.scrollTop`) i `Compositor.jsx` (calaix d'emoticones amb preservació de cursor en Shadow DOM) tenen una base sòlida.
2. **Correccions i Tasques d'Immediatesa a Executar en el Carril de Xat:**
   - **Mantenir i consolidar `C0545-X1` (`src/sections/xat/missatges.js:376`) i `C0545-X2` (`src/sections/xat/components/Conversa.jsx`):** Ja verificats amb proves de regressió per Codex.
   - **Tancar `C0545-X3` (`src/sections/xat/XatContext.jsx:883-885`):** Quan `loadMissatges` inicial es resol després que una confirmació d'enviament propi (`seq 2`) ja haja entrat a l'estat local del fil, `fusionaPerSeq` ha de conservar els missatges confirmats amb `seq` superior al de la pàgina inicial rebuda, en lloc de substituir l'array per `fusionaPerSeq([], nous)`.
   - **Clarificar la Intervenció de la IAIA al Fil 1:1 (`ConsultaIAIA.jsx` vs Mode Remot):**
     * En mode remot, per preservar l'honestedat d'autoria (l'adaptador remot mai no fingeix que un càlcul del navegador és un missatge enviat pel servidor amb l'identificador de la IAIA), quan l'usuari obri o escriu al fil de la IAIA MarIA sense un worker remot actiu, la píndola `ConsultaIAIA` (`src/sections/xat/components/ConsultaIAIA.jsx`) pot preomplir-se amb el text de la pregunta o oferir resposta assistida immediata rotulada explícitament com a consulta local de la Wiki/Cultura.

---

### 4. Proposta d'Automillora i Govern de Plantilles (`Tasca 4`)

1. **Diagnòstic Forense del Conflicte `prompt_consell.md` vs `prompt_local.md` (`C0545-D1`):**
   - Al registre del torn `torn_d2064380-5e68-4ccd-b020-35786a3a9eb4.json` (`04:39:23Z`), la ruta `prompt.consell` es va disparar perquè `.agents/protocolledge.json` associa la paraula `"consell"` a `_wiki_de_poble/03_actuar/plantilles/prompt_consell.md`.
   - Com assenyala encertadament Codex (`C0545-D1`), `prompt_consell.md:104` conté una descripció antiga contrària a `AGENTS.md §8` (anomena Sollutia «proveïdor de backend»), té dues taules `Registre` duplicades i versions desincronitzades (`2.0` vs `2.1.0`), però **no s'ha d'eliminar la ruta `prompt.consell` del router** perquè `AGENTS.md §6` distingeix entre destinatari extern (`prompt.consell`) i destinatari local (`prompt.local`).
   - **Solució Canònica:** Actualitzar `_wiki_de_poble/03_actuar/plantilles/prompt_consell.md` perquè herete exactament el mateix bloc de `Context Tècnic i Arquitectònic` (Model B i Llei de l'Enxufabilitat) que `prompt_local.md` (v3.10.0), eliminant la taula `Registre` duplicada i alineant la versió amb `.agents/protocolledge.json` sense trencar els rebuts històrics.
2. **Protocol de Reducció de Tokens i Intuïció Visual:**
   - Aplicar la **Llei del Triatge en 3 Esglaons (`IDEA-27`)** i un manifest de canvis (`{ documentId, sha256, estat, consumidor }`) perquè en els cicles 2–8 del Gauntlet els agents només lligen els diffs dels informes que han canviat el seu hash SHA-256.

---

### 5. Diàleg Creuat i Sincronització del Trio (Gemini 4 Argon + Codex Sol + Claude Opus 5.5)

- **Amb Codex Sol (`261025_0607_auditoria_codex.md` v1.0.0):**
  * Acceptades íntegrament les verificacions de codi de Codex sobre `src/data/supabase/xat.js:403-410` (`p_id` ja enviat), `src/data/telemetria.js` (`C0545-S3`), `src/data/traductor.js` (`C0545-S1`/`S2`), `C0545-X1`/`X2`/`X3` i `C0545-WM1`/`WM2`, així com la preservació contractual de les dues rutes `prompt.local` i `prompt.consell` (`C0545-D1`). Totes han quedat verificades directament al codi i reflectides en aquesta versió `1.1.0`.
- **Amb Claude Opus 5.5 (`261025_0610_auditoria_claude.md` v0.1.0):**
  * Incorporada la salvaguarda crítica de Claude sobre `[WP-01]` (`P1-09`): no reanomenar `socdepoble-enxufe.php` al canal d'actualització propi sense fitxer pont o migració de `active_plugins` per no desactivar el plugin en instal·lacions vives.
  * Confirmada la partició neta de carrils: Claude respecta les correccions `C0545-X1` i `C0545-X2` ja aplicades per Codex a `src/sections/xat/missatges.js` i `src/sections/xat/components/Conversa.jsx`.

---

### 6. Revisió Creuada Final del Diff Combinat i Vistiplau per a Commit (v1.2.0)

Un cop finalitzats els 3 cicles d'implementació i verificació de Claude (`261025_0610_auditoria_claude.md` v1.0.0) i les 8 passades finites de Codex (`261025_0607_auditoria_codex.md` v1.7.0, amb la seua programació ja eliminada), s'ha auditat directament el diff combinat de l'arbre de treball (**74 fitxers modificats: +3.417 / −545 línies, més 21 fitxers nous de proves de seguretat i regressió**):

1. **Integritat d'Acoblament en el Subsistema de Xat (`D3` · `XatContext.jsx` + `src/data/supabase/xat.js` + `Conversa.jsx` + `Compositor.jsx` + `missatges.js`):**
   - Verificat que la cua FIFO d'enviaments per fil (`encuaEnviament`), l'espera de cobertura sense cremar reintents (`XC-03`) amb l'opció `{ esperaLaXarxa: false }` per a enviaments programàtics des de Connectar (`D2` a `missatgeAlXat.js` i `useAplicaAbast.js`), la lectura única per fil amb fins a 5 pàgines (`XC-01`, `XC-02`), la fusió de confirmacions posteriors a l'snapshot inicial (`C0545-X3`) i els avisos no bloquejants per fil (`XC-13`, `XC-14`, `D5`) en `src/sections/xat/XatContext.jsx` encaixen sense cap fricció amb:
     * El termini intern de `30.000 ms` per RPC i cancel·lació immediata (`CUR-02` `ambSenyal`),
     * La recuperació d'estat `canalViu` després d'error (`CUR-03`), i
     * El pool de canals Realtime amb handles opacs per subscriptor, fanout únic i reobertura neta després de baixa fallida (`CUR-06` + `CUR-06-R`) a `src/data/supabase/xat.js`.
   - En la vista (`Conversa.jsx`, `Compositor.jsx`, `missatges.js`), conviuen netament `C0545-X1` (ordre monotònic de `seq` en confirmacions), `C0545-X2` (preservació d'esborrany `B` si falla l'enviament `A`), `XU-01` (retenció de focus al camp en enviar), `XU-05` (`ResizeObserver` + guarda de `scrollTop` que només refixa a baix quan creix el contingut i l'usuari no ha pujat), `IA-07` (`«IAIA MarIA · IA»` al capdamunt de la conversa), i `D4` (`pageshow` des de bfcache).

2. **Blindatge ReDoS i Parsers (`RX-01..04`, `RX-M1..M4`):**
   - Auditats els diffs de `supabase/functions/noticies/gestor.js` (`atributsDe` lineal amb índexs i `despresDelProleg` amb `fiDeLaPecaDelProleg`), `src/apps/lector/nucli/html.js` (`enLinia` iteratiu sense `RangeError` i `retalla` amb `trimEnd()`), `src/apps/lector/nucli/xml.js` (`nsNet`), `src/sections/gestoria/finestreta/nucli/extractorIdentitat.js`, `src/sections/xat/enllacos.js` i `src/utils/fulls/lector.js`. Cap expressió regular exponencial o superlineal resta en aquestes rutes crítiques.

3. **Privacitat, Visor, Taules, WordPress i i18n:**
   - **Privacitat i Exportació (`BOT-04` + `C0545-BOT4-WEB` + `CUR-01`):** `src/sections/profile/DetallPrivacitat.jsx` integra el panell natiu de compartició/còpia de Claude amb la guarda de sessió, muntatge i generació de petició de Codex, descartant qualsevol resposta tardana si l'usuari canvia d'A a B. `PerfilPublicSection.jsx` i `Seguidors.jsx` isolen l'estat per visor (`CUR-01`).
   - **Connector WordPress (`WP-01`, `WP-M1`, `WP-M2`, `WP-06`):** `wordpress-plugin/eines/empaqueta.mjs` i `wordpress-plugin/includes/actualitzador.php` alineen `SLUG = 'socdepoble'` amb `SOCDEPOBLE_ENXUFE_SLUG` mantenint `SOCDEPOBLE_ENXUFE_SLUG_CANAL = 'socdepoble-enxufe'` per al canal propi i sense renomenar `socdepoble-enxufe.php`.
   - **Taules i Diccionaris (`P1-16`, `TE-01`, `TE-08`):** `EspecimenGestor.jsx`, `EspecimenInventariGlobal.jsx` i `EspecimenUniversalWorkspace.jsx` envolten les taules en regions accessibles amb `tabIndex={0}` i desplaçament propi, i els 5 diccionaris (`ca`, `es`, `en`, `eu`, `gl`) incorporen les 75 claus noves en perfecta simetria.

4. **Portes d'Arquitectura i Netedat de Diff Verificades:**
   - `git diff --check`: **codi `0`** (zero conflictes, zero marcadors de merge, zero errors d'espais en blanc).
   - `node tooling/gates/tractor-enxufe.mjs`: **codi `0`** (`E1`, `E2`, `E3`, `E4` en verd).
   - `node tooling/gates/tractor-frontissa.mjs`: **codi `0`**.
   - `node tooling/gates/tractor-rls.mjs`: **codi `0`** (60 fitxers SQL verificats).
   - `node tooling/gates/porta-olivera.mjs`: **codi `0`**.
   - Cap fitxer protegit (`PanellTractors.jsx`, `PanellSentinelles.jsx`, esquemes SQL ni lògica d'autenticació) ha estat tocat.

> **🟢 DICTAMEN DE VISTIPLAU FINAL (GEMINI 4 ARGON):**
> **VISTIPLAU CONCEDIT AL 100% PER AL COMMIT CONSOLIDAT.**
> *Nota operativa per a l'índex del commit:* Incloure conjuntament tots els fitxers de codi i tests del lot (mantenint sempre junts `src/sections/xat/XatContext.jsx` i `src/data/supabase/xat.js` per l'acoblament `D3`) i **excloure `.immunitari/cron.out`** de l'staging de git.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

1. **Validació Canònica del Document (`document.mjs check`):**
   - Comanda: `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261025_0545_auditoria_gemini.md`
   - Resultat: `{"valid": true, "errors": []}` (codi `0`).
2. **Portes d'Arquitectura i Higiene (`tractor-enxufe`, `tractor-frontissa`, `tractor-rls`, `porta-olivera`, `git diff --check`):**
   - Totes executades sobre l'arbre combinat final amb **codi `0`**.
3. **Suite de Precommit Verificada:**
   - **164 fitxers / 3.132 proves Vitest + 259 proves Node, 0 fallades, 0 omeses**.
   - Comprovat amb `manage_task list` que hi ha **0 processos o tasques en segon pla actives**.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Aquesta auditoria és consultiva i d'orquestració tècnica: Gemini no ha modificat cap fitxer de codi de producte, cap esquema SQL, cap tractor ni cap fitxer d'autenticació, deixant l'arbre de treball lliure de conflictes amb les correccions locals `C0545-X1` i `C0545-X2` de Codex i el workflow de Claude.
- La conformitat final d'App Store, Google Play i WordPress.org requerirà el desplegament efectiu a producció (`P0-03`..`P0-05`, `P0-18`..`P0-21`) i l'execució sobre PostgreSQL i dispositius reals.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261025_0545_pla_implementacio_destil_llibre_mestre_dafo_i_xat_fluid]]
- [[261025_0545_prompt_claude_gemini_codex_destil_llibre_mestre_dafo_i_xat_fluid]]
- [[261025_0607_auditoria_codex]]
- [[261025_0610_auditoria_claude]]
