---
type: document
status: esborrany
description: Pla d'implementació nocturn per a culminar la candidatura NLnet NGI Fediversity (2026-08-1a6), resoldre IDEA-59/P1-72 al Bloc de Notes i liquidar el deute tècnic del Llibre Mestre
tags:
  - implementacio
visibility: private
reflex: sdp:torn_558abd5e-2f62-41ec-9892-b40065c7739f:f3ece362-c8c9-4582-b6a0-26925dc3bc77
---
# Pla d'Implementació — Marató Nocturna NLnet Fediversity, Bloc de Notes i Llibre Mestre

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_558abd5e-2f62-41ec-9892-b40065c7739f:f3ece362-c8c9-4582-b6a0-26925dc3bc77 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-01T02:12:12.260Z |
| Modificació | 2026-11-01T03:13:00.000Z |
| Propietari | IAIA MarIA · Mestre Javi |
| Aprovació humana | aprovat pel Mestre (01/11/2026 03:04 CET) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | MarIA + Claude Opus 5.5 + Gemini CLI + GPT Codex |
| Tokens consumits | ~38.000 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- `2026-11-01T02:12:12.260Z`: esborrany creat; contingut i verificació pendents.
- `2026-11-01T03:13:00.000Z`: pla completat amb els 6 blocs d'implementació nocturna per a NLnet — NGI Fediversity (`2026-08-1a6`), el Bloc de Notes (`IDEA-59` / `P1-72`) i la liquidació del deute tècnic del Llibre Mestre (`P1-71`, `P1-70`, WordPress `1.1.10`).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)

Aquesta nit hem completat i desplegat la **Trilogia d'Infraestructura en Producció**:
1. **Supabase Producció (`100% En Viu`):** Les 64 migracions SQL (`2610241400` → `2610312000`) estan aplicades i verificades amb `11/11 true`.
2. **WordPress.org Directory (`100% En Viu`):** El connector oficial `socdepoble` (`v1.1.10`, SVN Revisió `3777487`) està publicat a `https://wordpress.org/plugins/socdepoble/` amb documentació bilingüe en valencià/català natiu (5 idiomes + traductor automàtic integrat) i 10 captures oficials (`screenshot-1.png` .. `screenshot-10.png`).
3. **Firebase Hosting (`100% En Viu`):** `1.021` fitxers desplegats a `https://socdepoble.org`.

Amb la infraestructura ja desplegada, l'objectiu d'esta marató nocturna és deixar **100% completades, provades i verificables en viu** totes les partides tècniques de la candidatura **NLnet — NGI Fediversity (`2026-08-1a6`, `50.000 € / 1.000 h`)** i resoldre els punts tècnics pendents del **Llibre Mestre de Tasques** (`_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`) abans d'enviar el correu electrònic decisiu als avaluadors de Fediversity demà.

---

### 2. Blocs de Treball i Fitxers Afectats

#### BLOC F1 · Actualització Verificable de `/page/fediversity`, `/page/descarregues` i `canalsDeBotiga.js` (Desplegat Hui → «Fet hui (verificable)»)
- **[MODIFY] `src/config/canalsDeBotiga.js` i `src/config/canalsDeBotiga.test.js` + `src/sections/detail/InstalaLaPwa.test.jsx`:**
  - Obrir la ranura oficial de `wordpress-org` a `CANALS_DE_BOTIGA` (`src/config/canalsDeBotiga.js:28`):
    `Object.freeze({ id: 'wordpress-org', nom: 'WordPress.org', url: 'https://wordpress.org/plugins/socdepoble/' })`
    perquè `InstalaLaPwa.jsx` pinte el canal obert a `/page/descarregues`, i actualitzar `canalsDeBotiga.test.js` i `systemPages.test.js` per reflectir que `wordpress-org` ja és l'únic canal de botiga obert i actiu hui (`Google Play` i `App Store` continuen amb `url: null`).
- **[MODIFY] `src/sections/text/pageContent.js` (`PAGE_COPY.descarregues` i `PAGE_COPY.fediversity`) + `src/sections/text/pageContent.fediversity.test.js` + `src/data/iaiaLocal.js`:**
  - En **`PAGE_COPY.descarregues`** (`src/sections/text/pageContent.js:582`), actualitzar la secció `<h3>A la web del teu poble, amb WordPress</h3>` / `<h4>WordPress.org</h4>` perquè ja no diga «s'obri amb la primera versió que hi publiquem», sinó que **ja està publicat i obert a tothom al directori oficial de WordPress.org** amb l'enllaç directe `<a href="https://wordpress.org/plugins/socdepoble/" target="_blank" rel="noopener noreferrer">wordpress.org/plugins/socdepoble</a>` (versió `1.1.10`), explicant que es pot buscar i instal·lar des del mateix tauler de WordPress i activar en una pàgina amb el codi curt `[socdepoble_app poble="la-torre-de-les-macanes"]` i la plantilla `Sóc de Poble · full screen` (i aprovar l'empremta amb `node tooling/quality/frontissa_contingut.mjs --aprova descarregues`).
  - En **`PAGE_COPY.fediversity`** (`src/sections/text/pageContent.js:662`), actualitzar l'apartat de WordPress.org per reflectir que `https://wordpress.org/plugins/socdepoble/` **ja està publicat i actiu en producció (`v1.1.10`)** amb guia d'instal·lació en 1 minut i 10 captures verificables.
  - Promoure de `<h5>Pendent</h5>` a `<h5>Fet hui (verificable)</h5>` totes les fites que ja estan desplegades a `https://socdepoble.org` i les que s'entreguen esta mateixa nit:
    - **Partida 1:** Connector WordPress.org actiu i instal·lable (`wordpress.org/plugins/socdepoble`), node viu `gentdelatorre.net`, administració multimunicipi i perfil mínim d'allotjament mesurat.
    - **Partida 2:** Navegació completa per teclat (`IDEA-58` `↑ ↓ ← → Home/End`), traductor sobirà sense Google (`IDEA-31` Apertium + MyMemory), auditories d'accessibilitat automatitzades (`wcag_contrast_audit.mjs` + `design_guard.mjs`) i coberta E2EE WebCrypto (`P-256 ECDH + AES-GCM-256`).
    - **Partida 3:** Federació `ActivityPub`, `WebFinger` (`host-meta`) i `NodeInfo 2.1` verificables en viu (`/.well-known/nodeinfo`, `/nodeinfo/2.1.json`, `/ap/actors/la-torre-de-les-macanes.json`, `/ap/actors/la-torre-de-les-macanes/outbox.json`), exportació Open Data Municipal completa amb `SHA-256` (`exportaMunicipiOpenData.js`), estructuració local de memòria oral (Mètode Karpathy / `proposaCard.js`) i bàndols d'alerta municipal al Mur.
    - **Partida 4:** Empaquetament reproduïble amb Nix (`flake.nix`), instal·lador interactiu `tooling/instalador/inicia-node-germa.mjs` verificat end-to-end sobre una còpia temporal i guia d'un poble nou en una vesprada.
  - Afegir a `/page/fediversity` un bloc d'**Enllaços Directes de Verificació Tècnica per als Avaluadors (1 Clic)** cap als endpoints vius (`/.well-known/nodeinfo`, `/nodeinfo/2.1.json`, `/ap/actors/socdepoble.json`, `/ap/actors/la-torre-de-les-macanes.json`, `/ap/actors/la-torre-de-les-macanes/outbox.json`, `https://wordpress.org/plugins/socdepoble/`, `https://gentdelatorre.net` i descàrrega directa d'Open Data Municipal).

#### BLOC F2 · Partides 1, 3 i 4 de NLnet Fediversity ( Tancament Tècnic 100% )
- **[MODIFY] `src/data/exportaMunicipiOpenData.js` i `src/data/exportaMunicipiOpenData.test.js`:**
  - Verificar i ampliar el paquet d'exportació Open Data Municipal (`noticies.jsonld`, `agenda.jsonld`, `memoria-cultural.jsonld`, `directori.jsonld`, `municipi.jsonld`, `datapackage.json` Frictionless v2 i sumari BagIt `SHA-256`) assegurant que `recullDadesPubliquesDelMunicipi` reculla totes les col·leccions públiques disponibles sense omissions innecessàries.
- **[MODIFY] `src/sections/notes/proposaCard.js` i test unitari `src/sections/notes/proposaCard.test.js`:**
  - Reforçar l'assistent curatorial local basat en el **Mètode Karpathy** (100% determinista i local, sense consum de tokens de núvol de pagament): a partir d'una nota o transcripció de memòria oral, extreure automàticament títol estructurat, resum pedagògic, etiquetes temàtiques, municipi detectat i proposta d'esquema **Open Knowledge Format (OKF v0.2)** llesta per a publicar amb revisió humana.
- **[MODIFY] `src/sections/mur/TargetaDelMur.jsx` i `src/sections/mur/MurSection.jsx`:**
  - Suportar l'etiqueta i bàner destacat d'**Alerta / Bàndol Municipal Urgent (`alerta` / `bandol_urgent`)** en les targetes del Mur quan una publicació municipal porte eixa categoria o prioritat, complint el requisit de resiliència i avisos d'emergència de la Partida 3.
- **[MODIFY] `tooling/instalador/inicia-node-germa.mjs` i `tooling/instalador/inicia-node-germa.test.mjs`:**
  - Ampliar les proves automatitzades end-to-end que executen `inicia-node-germa.mjs` sobre un directori temporal (`os.tmpdir()`), verificant que genera la configuració d'un segon node municipal germà amb l'`actor.json` i `nodeinfo` corresponents.
- **[NEW / MODIFY] `_wiki_de_poble/02_saber/architecture/perfil_minim_allotjament_node_municipal.md` (i ancoratge a `_wiki_de_poble/00_index_maquina.md` i `_wiki_de_poble/00_index.md`):**
  - Documentar amb xifres mesurades el perfil mínim d'allotjament d'un node municipal (mida del bundle de producció, consum de memòria/CPU per a l'estàtic + base de dades Postgres/Supabase, i cost mensual estimat per a un ajuntament menut).

#### BLOC N1 · `IDEA-59` / `P1-72` — Restauració de la Card Tutorial del Bloc de Notes i Nova UX de l'Editor (`/notes`)
- **[MODIFY] `src/sections/notes/NotesSection.jsx`, `src/sections/notes/NotesEditor.jsx`, `src/components/universal/UniversalToolbar.jsx` i `src/components/universal/richText/useUniversalRichText.js`:**
  1. **Punt 0 (Regressió Crítica — Card Tutorial «Bloc de notes» amb la mà i la ploma):**
     - Assegurar que la Card tutorial il·lustrada **`Bloc de notes · El teu estudi d'escriptura privat i lliure de distraccions`** (amb la imatge de la mà escrivint amb ploma estilògraf i l'explicació pedagògica del bloc de notes) estiga sempre inclosa dins de la carpeta **`NOTES` (`Tot`)**.
     - En entrar a `/notes` sense cap paràmetre `nota=` ni `carpeta=` explícit a la URL, obrir per defecte la vista **`NOTES` (`Tot`)** amb aquesta Card tutorial seleccionada i oberta en la Columna 3 (en lloc d'entrar a `carpeta=f-mur` sobre una `Nota sense títol` buida).
  2. **Punt 1 (Plantilla guia reversible a 0 caràcters en el cos de la nota):**
     - Quan es crea una nota nova (o el cos té `0` caràcters), mostrar la plantilla pedagògica de guia (`Títol de secció H3`, paràgraf explicatiu, `Subtítol H4`, llista amb vinyetes i llista numerada) com a *placeholder* estructurat.
     - En fer clic/focus dins del cos per a començar a escriure, la guia desapareix immediatament perquè l'usuari escriga sobre net.
     - Si l'usuari ix del camp (`blur`) sense haver escrit **cap caràcter (`0` caràcters)**, la plantilla guia torna a aparéixer. En el moment en què escriu almenys `1` caràcter, ja no reapareix.
  3. **Punt 2 (Desplegable d'encapçalaments `H3 → H4 → H5 → H6 → H2`):**
     - Substituir els botons solts `H3` i `H2` de la barra d'eines per un desplegable compacte d'encapçalaments amb l'ordre exacte: **`H3`** (primera opció per defecte per a seccions del cos), **`H4`**, **`H5`**, **`H6`** i **`H2`** (al final del tot).
  4. **Punt 3 (Estils de text sense subratllat):**
     - Mantenir **Negreta (`B`)** i **Cursiva (`I`)**, i **eliminar completament el botó de Subratllat (`U`)** per evitar confusions amb enllaços web.
  5. **Punt 4 (Nova iconografia Pedra Seca i barra d'eines ampliable):**
     - Renovar les icones de la barra d'eines de l'editor amb icones SVG netes, proporcionades i coherents amb Pedra Seca, i afegir un botó discret `[ + / ⋯ ]` per mostrar o plegar eines secundàries sense recarregar la primera línia.

#### BLOC M1 · Liquidació de Deute Tècnic del Llibre Mestre (`P1-71`, `P1-70` i Sincronització WordPress `1.1.10`)
- **[MODIFY] `src/sections/multimedia/MultimediaSection.jsx` i `src/sections/multimedia/GestorMultimediaLocal.jsx` (`P1-71` / `IDEA-55`):**
  - Moure `BarraVolumsLocals` (llista de carpetes/volums muntats amb indicadors d'estat i botó de desmuntar) a la **Columna 1** davall de les vistes, tal com fixa el contracte d'`IDEA-55`, i assegurar que en recàrrega en calent (HMR) no es quede mai bloquejat en «Comprovant la sessió…».
- **[MODIFY] `src/data/agentsSeed.js` i `public/assets/fotos/` (`P1-70` / `IDEA-56`):**
  - Optimitzar l'avatar de Javi Llinares utilitzat a les llistes de `/xat` (versió lleugera `256×256` en WebP/JPG optimitzat en lloc d'arrossegar la imatge de `1200px` en cada fila).
- **[MODIFY] `wordpress-plugin/readme.txt` i `tests/enxufe-plugin.test.mjs`:**
  - Sincronitzar el `wordpress-plugin/readme.txt` del repositori amb la versió publicada en el directori oficial de WordPress.org (`v1.1.10`, encapçalament en valencià/català natiu + 5 idiomes + traductor automàtic, guia d'instal·lació de `gentdelatorre.net` amb `[socdepoble_app]` i llista de les 10 captures oficials), mantenint tots els tests de `tests/enxufe-plugin.test.mjs` en verd.

#### BLOC S1 · Preparació Integral per a Apple App Store i Google Play Store (Dossier `T6`)
Un cop completats els blocs de Fediversity (`F1`, `F2`) i Bloc de Notes (`N1`), i aprofitant la marató nocturna completa, deixar preparat al màxim tot el paquet tècnic i de botiga per a publicar **Sóc de Poble** a **Google Play Store** i **Apple App Store** (sense sobreescriure els IDs històrics `P0-18`, `P0-19` ni `P1-13` del Llibre Mestre):
- **[NEW / MODIFY] Configuració i Empaquetat Android / Google Play:**
  - Verificar i deixar llest `public/.well-known/assetlinks.json` (i `public/.well-known/apple-app-site-association`), `capacitor.config.json`, `scripts/botigues/preflight.mjs` i el formulari complet de **Google Play Data Safety** + declaració d'eliminació de compte en `https://socdepoble.org/page/privacitat`.
- **[NEW / MODIFY] Configuració i Requisits d'Apple App Store / iOS:**
  - Verificar el manifest de privacitat d'Apple **`ios/App/App/PrivacyInfo.xcprivacy`** (`NSPrivacyTracking = false`), verificar el flux d'eliminació de compte in-app (App Store Guideline 5.1.1(v)) i documentar la configuració d'accés sense registre / *Sign in with Apple*.
- **[NEW / MODIFY] Dossier de Fitxes de Botiga, Captures i Guia d'Enviament Rapídissim:**
  - Deixar preparat a `_wiki_de_poble/02_saber/architecture/guia_publicacio_app_store_i_google_play.md` (ancorat a `_wiki_de_poble/00_index_maquina.md` i `_wiki_de_poble/00_index.md`) tots els textos copiar-i-enganxar en valencià/català, castellà i anglés i comandes de captures per a iPhone, iPad i Android.

#### BLOC K1 · Treball Col·laboratiu en Kits Sense Col·lisió (Gemini + Codex → Claude) + Qualificació de la Matriu Universal de 15 Punts + Visió de Sistema Indestructible
- **[COLLABORATIVE KITS] `../_investigacio_ia_de_poble/261101_kits_marato_nocturna/{gemini,codex}/`:**
  - Mentre Claude executa el carril principal en `src/`, **Gemini** i **Codex** construeixen pegats i kits autosuficients d'enginyeria i disseny (zero col·lisió d'escriptura) a `../_investigacio_ia_de_poble/261101_kits_marato_nocturna/` (eliminació dels 12 avisos de `design_guard.mjs`, enduriment de contractes Open Data / Fediversity, millores UX/accessibilitat AAA i verificació de botigues) perquè Claude els audite i integre en la Ronda 2 de la nit.
- **[EVALUATION 15 POINTS] Qualificació sobre 10 dels 15 Punts de la Matriu Universal del Sistema + Full de Ruta cap a un Sistema 100% Indestructible:**
  - Tant Gemini com Codex i Claude han d'incloure al seu informe la taula qualificada (`Nota X.X / 10`) dels **15 Punts de la Matriu Universal de Sóc de Poble**, detallant què falta exactament en cada punt per al `10/10` absolut i la visió arquitectònica d'un **sistema rural completament indestructible** capaç de fer canviar radicalment d'opinió els avaluadors de **NLnet — NGI Fediversity**.

- **[PROACTIVE] Protocol d'Iniciativa Proactiva i Reversibilitat («Millora amb Trellat» sobre el Llibre Mestre Depurat):**
  - El Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`) ha estat depurat de `405 KB` a `108 KB` (arxivant l'històric íntegre d'octubre a `_arxiu_wiki_de_poble/historics_llibre_mestre/261101_0318_llibre_mestre_historic_integral_octubre_2026.md`). Claude, Codex i Gemini tenen autorització per implementar per iniciativa pròpia qualsevol millora o deute tècnic pendent del Llibre Mestre que supose una millora clara, sempre que estiga encapsulat de forma modular i fàcilment desfaïble (reversible en 5 segons si al Mestre no li agrada).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Bateria de Tests Unitaris i de Contracte:**
   - `npx vitest run` (incloent `src/sections/text/pageContent.fediversity.test.js`, `src/config/canalsDeBotiga.test.js`, `src/data/exportaMunicipiOpenData.test.js`, `src/sections/notes/proposaCard.test.js` i `node --test tooling/instalador/inicia-node-germa.test.mjs tests/enxufe-plugin.test.mjs tests/botigues.test.mjs`).
2. **Build de Producció i Portes del Sistema:**
   - `npm run build`
   - `node tooling/gates/porta-autoritat.mjs`
   - `node tooling/gates/porta-olivera.mjs`
   - `node tooling/gates/design_guard.mjs --arrel=src`
   - `node tooling/gates/tractor-cromatic.mjs`
   - `node tooling/gates/frontissa-contingut.mjs`
3. **Revisió de Qualitat i Conformitat (QA) amb Gemini CLI i GPT Codex:**
   - Execució d'un cicle de proves de regressió i verificació de contractes sobre els Blocs F1, F2, N1 i M1 fins a certificar `0` defectes crítics i `0` regressions.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Coherència amb els tests existents de `/page/fediversity` i `canalsDeBotiga.js`:** En promoure elements de `Pendent` a `Fet hui (verificable)` i activar `wordpress-org`, cal actualitzar simultàniament `pageContent.fediversity.test.js` i `canalsDeBotiga.test.js` perquè les assercions reflectisquen el nou estat real verificat en producció.
- **Preservació d'entitats de lectura en `/notes`:** En seleccionar per defecte la Card tutorial de «Bloc de notes» en entrar a `/notes`, cal assegurar que l'usuari pot crear una nota nova amb 1 clic (`+ Nova nota`) o commutar a qualsevol nota editable sense fricció.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
