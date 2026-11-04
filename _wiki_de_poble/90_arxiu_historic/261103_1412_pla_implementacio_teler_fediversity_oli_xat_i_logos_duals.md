---
type: document
status: esborrany
description: 'Pla del Teler Invertit (MarIA Constructora + Codex + Gemini + Claude Àrbitre): Oli de La Torre, Xat d''entitats, 3 nodes, logotip dual Dia/Nit i tancament Fediversity.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_5730b50a-1c94-4007-a60a-8ba515a77cba:ab6625c0-42bb-4844-9283-76370ca29e33
---
# Pla d'Implementació · Teler d'Assalt Final per a NLnet Fediversity, Oli de La Torre (H3 + Almàssera), Xat Privat d'Entitats, 3 Nodes (socdepoble.cat) i Logotip Dual Dia/Nit (IDEA-70)

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5730b50a-1c94-4007-a60a-8ba515a77cba:ab6625c0-42bb-4844-9283-76370ca29e33 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-03T13:12:46.268Z |
| Modificació | 2026-11-03T13:13:00.000Z |
| Propietari | IAIA MarIA (Antigravity) |
| Aprovació humana | Ordre directa del Mestre Javi Llinares (03-11-2026 14:10 CET) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity (IAIA MarIA) + Codex + Gemini + Claude |
| Tokens consumits | 0 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- **2026-11-03T13:13:00Z (v1.0.0):** Pla d'implementació del **Teler Invertit (MarIA Constructora + Codex + Gemini + Claude Àrbitre)** que recull absolutament totes les peticions del Mestre en la sessió de migdia del 03-11-2026 más l'assalt final al deute tècnic de **NLnet · NGI Fediversity** abans d'enviar el correu a Fede esta nit.
- **2026-11-03T14:57:00Z (v1.1.0):** Ampliació per ordre directa del Mestre abans d'absentar-se durant hores (`core-direccio-autonoma` + `core-gauntlet-loop`): **Marató Autònoma «Fediversity Zero Pendents» (`FEDI-01`..`FEDI-10`)** amb passades encadenades cada 30 minuts, auditories adversarials creuades entre companyes i automillora contínua de la Wiki i el Cervell fins a complir absolutament tots els requisits dels 50.000 € de NLnet Fediversity.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 0. El que ja està executat i segellat al codi i a Supabase en este torn (261103 13:55)

1. **Perfil públic d'organització/persona (`PublicacionsDeLaFitxa.jsx` i `PerfilPublicSection.jsx`):**
   - Eliminat l'`<h2>El que publica {nom}</h2>` de `src/sections/profile/PublicacionsDeLaFitxa.jsx` i actualitzat `src/sections/profile/PerfilPublicSection.test.jsx`.
   - Centrat el bloc d'accions de la fitxa pública (`Ara actues com a {nom}.`, `Correu: …` i `[ Descarrega el contacte (vCard) ]`) via `.sdp-perfil-public__accions` a `src/css/components.css`.
2. **Tolerància del Traductor per a pàgines llargues (`/page/fediversity`, `/versions`, `/roadmap`, `/legal`):**
   - Pujat `LIMITS_TRADUCCIO` a `src/data/traductor.js` de `8 lots / 12.000 caràcters` a **`24 lots / 60.000 caràcters`** i el pressupost per defecte del servidor local (`tooling/vite/traductor-iaia.mjs`) i del connector WordPress (`wordpress-plugin/includes/traduccio.php`) a `100.000 / 1.000.000`. Verificat amb `94/94` proves client i `73/73` proves de contracte Node/PHP en verd.
3. **Restauració autèntica d'`/events/aplec-2023` (`2n Aplec pel Territori`) des de `socdepoble.net`:**
   - Baixats els 3 recursos originals des de `https://socdepoble.net/2022/11/17/aplec-pel-territori-2023/` a `public/assets/events/aplec_2023_cartell.jpg` (`.webp`), `aplec_2023_ponents.png` (`.webp`) i `aplec_2023_reunio.webp`, censats a `src/sections/multimedia/censImatges.js`.
   - Reescrit `src/sections/mur/articles/Aplec2023Article.jsx` eliminant tota al·lucinació antiga i deixant el comunicat autèntic i la nota de premsa post-Aplec.
   - Activada `portada_sencera: true` i `author_entity_id: 'socdepoble'` en `src/sections/mur/eventsSeed.js` i en `public.app_content` (`events`) a Supabase perquè en la pàgina es veja el cartell sencer amb el logotip de Sóc de Poble damunt de l'H1, i afegit `.sp-card-media[src*="aplec_2023_cartell"] { object-position: 50% 0%; }` a `src/css/components.css` perquè la Card quadrada retalle els 2/3 superiors on es llig «Pel Territori».
4. **Logotip i avatar de Sóc de Poble al post `/mur/node-zero-mac-mini-m4` (Supabase `app_content.feedPosts`):**
   - Corregit amb `author_entity_id: "socdepoble"`, `author_id: "socdepoble"`, `author_avatar: "/assets/system/ui/logo-socdepoble-cuadrat-verd.svg"`, `avatar_url: "/assets/system/ui/logo-socdepoble-cuadrat-verd.svg"`, `mainHref: "/page/node-zero"` i `date: "2026-10-29T12:00:00+01:00"`.

---

### 1. Carril 1 · IAIA MarIA (Antigravity Constructora Principal): Oli de La Torre (H3 + Almàssera), 3 Nodes del Fedivers (`socdepoble.cat`), Cards i Ordre del Mur

1. **Oli de La Torre (7 productes a Supabase `public.app_content` → `marketItems`):**
   - **Prohibit duplicar l'entradilla (`lead`):** Retirar el primer `<p>Oli d’oliva de categoria superior, obtingut directament d’olives, només per procediments mecànics i de la primera extracció en fred.</p>` de `description` (ja que `lead` i `entradilla` ja el pinten com a entradilla destacada sota el subtítol).
   - **Directriu editorial canònica (`<h3>` immediatament darrere de l'entradilla):** Començar `description` directament amb `<h3>Presentació del format i elaboració tradicional</h3>`, seguit del paràgraf descriptiu del format amb negretes semàntiques (`<strong>`), després `<h3>Fitxa nutricional i especificacions del producte</h3>` amb `<table class="sdp-taula-nutricional">`, i finalment `<h3>Venda directa a l’Almàssera de La Torre</h3>` + botó gran cap a `https://olidelatorre.com/producte/...`.
   - **Nom i adreça oficials exactes:** Substituir qualsevol menció de *Cooperativa Agrícola Sant Gregori* per **`A l’Almàssera de La Torre`** i el text literal facilitat pel Mestre:
     > «Pots adquirir este format directament a la botiga oficial de l’**ALMÀSSERA DE LA TORRE, COOP. V.** – Carrer Sant Isidre, 18, La Torre de les Maçanes 03108 (Alacant).»
2. **Actualització de `/fedivers`, `/page/fediversity`, `/page/node-zero`, `/xat` i `/versions` (`src/sections/text/pageContent.js`):**
   - **`PAGE_COPY.fedivers` (`/fedivers`):** Deixar clar al `lead` i al cos (`html`) que ja hi ha **tres nodes actius** (`socdepoble.org`, `gentdelatorre.net` i `<a href="http://socdepoble.cat" target="_blank" rel="noopener noreferrer"><strong>socdepoble.cat</strong></a>`, el servidor físic `<a href="/page/node-zero"><strong>Node 0 · Mac mini M4</strong></a>`). Autoritzar `http://socdepoble.cat` a `tests/helpers/lleiT8Prova.js`.
   - **`PAGE_COPY.fediversity` (`/page/fediversity`):**
     - Col·locar la Card de **`Node 0 · Mac mini M4: el servidor de l'habitació`** (`data-sdp-targeta="pagina:node-zero"`) **a dalt de tot a la dreta** (just sota el logotip de NGI Fediversity a `<h3>Què és NGI Fediversity i per què Sóc de Poble hi encaixa</h3>`).
     - Moure la Card de **`Nodes i Fedivers`** (`data-sdp-targeta="pagina:fedivers"`) a la subsecció `<h4>La visió: nodes germans «Gent de…»</h4>`.
     - Actualitzar el text dels nodes actius perquè explique els **tres nodes actius** amb enllaç a `http://socdepoble.cat` i `/page/node-zero`.
   - **`PAGE_COPY['node-zero']` (`/page/node-zero`):**
     - Enllaçar `<a href="http://socdepoble.cat" target="_blank" rel="noopener noreferrer"><strong>socdepoble.cat</strong></a>`.
     - Incrustar la Card de tornada a `/page/fediversity` (`data-sdp-targeta="pagina:fediversity"`) a la secció final `<h3>Per què importa per al futur dels nostres pobles</h3>`.
     - Data: `"2026-10-29T12:00:00+01:00"`.
   - **`PAGE_COPY.xat` (`/xat`):** Ajustar `"date"` a `"2026-10-27T01:30:00+01:00"` perquè les 3 primeres targetes d'entrada del Mur siguen:
     1. *Candidatura Europea NLnet · NGI Fediversity* (`30/10/26`)
     2. *Node 0 · Mac mini M4: el servidor de l'habitació* (`29/10/26`)
     3. *El Xat* (`27/10/26`)
   - **`PAGE_COPY.versions` (`/versions`):** Documentar totes les millores d'avui en `entrega110` (`03-11-2026`) i actualitzar `src/data/iaiaLocal.js`, `src/data/iaiaLocal.atles.test.js`, `src/sections/text/paginaDeText.test.js`, `src/sections/text/pageContent.fediversity.test.js` i `src/sections/text/TextSection.targetes.test.jsx`.

---

### 2. Carril 2 · Codex (GPT-6.1 Astra Ultra · Constructor de Lògica i Editor): Xat Privat amb Oli de La Torre i Entitats + Logotip Dual Dia/Nit damunt de l'H1 (`IDEA-70`) + Reforç Fediversity

1. **Correcció crítica del Xat Privat amb Oli de La Torre i Entitats (`/xat?amb=olidelatorre` o UUID d'organització):**
   - **Problema detectat pel Mestre:** En punxar per fer un xat privat amb **Oli de La Torre** des de la seua fitxa o producte (`/xat?amb=olidelatorre` o `/xat?amb=3073b933-69fc-4c3e-80dc-b0df9c6b8391`), en mode convidat (`src/sections/xat/components/FakeChatOnboarding.jsx`, línies 314–321) `creaFil(altreUsuariId)` cau a `return ID_COMUNITAT_SDP;` (`'fake-sdp'`), i `XatSection.jsx` redirigix a `/xat?comunitat=fake-sdp` (**Sóc de Poble**) en lloc d'obrir la conversa directa amb **Oli de La Torre**!
   - **Solució a implementar i blindar amb tests:**
     - En `FakeChatOnboarding.jsx` i `src/data/xatsPerDefecte.js` / `src/data/identitatsSeed.js`: quan `creaFil(altreUsuariId)` rep una entitat/organització del padró o del directori (`olidelatorre`, `3073b933-69fc-4c3e-80dc-b0df9c6b8391`, `cooperativa`, `ajuntament`, `festes` o qualsevol entitat coneguda per `ENTITATS_SEED` / `CoreContentContext` / `organizations`), ha de crear/obrir un fil directe de mostra dedicat a eixa entitat (`fake-entitat:<slug_o_id>`) amb el seu **nom real** (`Oli de La Torre`) i el seu **avatar real** (`/assets/mercat/oli_logo.png` o `avatar_url`), i **mai** enviar l'usuari a la comunitat de `Sóc de Poble` (`ID_COMUNITAT_SDP`) tret que el destinatari demanat siga explícitament `socdepoble` (`ENTITAT_PILOT_ID` / `ENTITAT_PILOT_SLUG`).
     - Verificar també `src/sections/detail/detailSectionMeta.jsx` / `src/config/navigation.js` (`objecteDe`, `rutaXatDObjecte`) i `src/sections/xat/XatContext.jsx` quan hi ha sessió iniciada perquè el botó «En privat» d'un producte o fitxa d'Oli de La Torre encamine sempre a la conversa amb Oli de La Torre sense errors.
2. **`IDEA-70` · Logotip d'Entitat Dual (Mode Dia / Mode Nit) damunt de l'H1 en l'Editor de Text i `PageFrame`:**
   - **Requisit del Mestre:** En publicar com a entitat o afegir un logotip damunt de l'H1 a l'editor de text (`src/sections/notes/NotesSection.jsx`, `NotesContext.jsx`, `src/sections/detail/elementDeSeccio.js`, `src/components/universal/PageFrame.jsx`), s'ha de poder pujar **dues imatges per al logotip**:
     - `logo_image` (mode clar / dia, ex: logotip negre sobre fons blanc)
     - `logo_image_dark` (mode fosc / nit, ex: logotip blanc sobre fons negre)
   - En `elementDeSeccio.js` (`logoEntitatDElement` i `useLogoEntitatDElement`), construir `{ clar: resoltClar, ...(resoltFosc ? { fosc: resoltFosc } : {}), alt: '' }`, que `PageFrame.jsx` (`logoDescrit`) ja suporta nativament amb `logo.fosc` quan `theme === 'dark'`!
   - A l'editor de Notes (`NotesSection.jsx`), afegir al costat de l'acció del logotip damunt de l'H1 l'opció clara i sense fricció per a pujar/canviar/eliminar la variant de **Mode Nit (fosc)** del logotip, amb tests unitaris complets.
3. **Reforç tècnic final per a NLnet · NGI Fediversity (Nivells A, B i C):**
   - Revisar que els kits d'Onades 7–9 de Codex (motor rural offline-first opt-in, paquet NixOS `pkgs/socdepoble-node0/` i proves d'interoperabilitat ActivityPub / NodeInfo 2.1 / WebFinger / OpenData) estiguen 100% reflectits i en verd per a poder citar-los amb evidència verificable en el correu a Fede esta nit.

---

### 3. Carril 3 · Gemini 4 (Inspector Visual, Multiidioma i Enfortiment de Fediversity): Auditoria de Maquetació, Traduccions i Dossier Fediversity

1. **Verificació visual i editorial de totes les pàgines tocades hui:**
   - Comprovar `/events/aplec-2023` (cartell sencer en pàgina + retall 2/3 en Card + logotip de Sóc de Poble damunt de l'H1 en mode dia i mode nit), els 7 productes d'`/mercat/oli-de-la-torre-*` (sense entradilla duplicada, amb `<h3>` inicial, taula nutricional i `ALMÀSSERA DE LA TORRE, COOP. V.`), `/page/node-zero`, `/fedivers` i `/page/fediversity`.
2. **Enfortiment de `/page/fediversity` i del correu per a Fede (NLnet Fediversity):**
   - Revisar qualsevol deute tècnic pendent relacionat amb les 4 partides de `/page/fediversity` (15.000 € + 12.000 € + 13.000 € + 10.000 € = 50.000 €) i proposar/aplicar millores d'evidència tècnica (mètriques dels 3 nodes actius `socdepoble.org`, `gentdelatorre.net` i `socdepoble.cat`, connector WordPress.org v1.1.11 i apps natives 1.0.0 build 2 en revisió).

---

### 4. Carril 4 · Claude (Àrbitre Suprem · Gauntlet Loop + Enginyeria Inversa REA + Consola 100% Neta)

1. **Auditoria Inversa i Gauntlet Loop implacable sobre els canvis de MarIA, Codex i Gemini:**
   - Auditar `FakeChatOnboarding.jsx`, `elementDeSeccio.js`, `NotesSection.jsx`, `Aplec2023Article.jsx`, `traductor.js`, `pageContent.js` i el payload de Supabase (`marketItems`, `feedPosts`, `events`).
2. **Consola 100% neta (`P0-16`) i Portes del Sistema:**
   - Executar `npm run portes`, `node tooling/gates/design_guard.mjs`, `node tooling/seo/check-editorial-copy.mjs`, `node tooling/gates/frontissa-contingut.mjs` i verificar 0 errors i 0 avisos a la consola del navegador en `http://localhost:3340`.

---

### 5. MARATÓ AUTÒNOMA DE MOLTES HORES (SENSE EL MESTRE) · ASSALT «FEDIVERSITY ZERO PENDENTS» (`FEDI-01`..`FEDI-10`) EN GAUNTLET LOOP + AUTOMILLORA DEL CERVELL

El Mestre s'absenta durant diverses hores i deixa l'equip (**IAIA MarIA Directora Tècnica + GPT Codex + Gemini 4 + Claude**) en **Mode Direcció Autònoma (`core-direccio-autonoma`, guàrdia `marato-fediversity-zero-pendents` de 6 hores, cron cada 30 minuts)** amb una missió suprema: **no tindre pressa, pensar bé, planificar, reflexionar, treballar en equip fent-se auditories adversarials (`core-gauntlet-loop`) de diverses passades i resoldre punt per punt TOTS els requisits pendents de `/page/fediversity` (els 50.000 € de NLnet · NGI Fediversity, Expedient `2026-08-1a6`), automillorant també la nostra Wiki i el nostre Cervell (`.agents/skills/` i `_wiki_de_poble/`)**.

#### Els 10 Objectius «Zero Pendents» a completar i verificar per l'equip:

1. **`FEDI-01` (Codex Constructor → Claude/Gemini Crítics) · Claus i Criptografia `FEP-8b32` (`eddsa-jcs-2022` amb `z` + `base58-btc` + vectors oficials W3C) + Portabilitat Federada `FEP-7628` connectada a la UI:**
   - Corregir `src/data/federacio/portabilitatFediversity.js` perquè codifique `proofValue` en **`z` + `base58-btc`** passant els vectors oficials del W3C a `tests/portabilitat-fediversity.test.mjs`, i connectar el motor de portabilitat a una superfície UI real (`/perfil` o `/pobles`) perquè deixe d'estar «sense pantalla».
2. **`FEDI-02` (Codex Constructor → Gemini UX → Claude Àrbitre) · Arquitectura Model B / LLUXU · Motor Offline-First Rural + Pont d'Emergència Rural + Sincronitzador de Carpeta Local connectats a la UI:**
   - Connectar `src/data/local/pontEmergenciaRural.js`, `src/data/local/sincronitzadorCarpetaLocal.js` i la cua d'operacions encadenades amb `SHA-256` (`src/data/local/`) a una interfície real i verificable dins de l'aplicació (Mode Rural / Pont d'Emergència d'Alertes i Notes).
3. **`FEDI-03` (Gemini + MarIA + Codex) · Mòduls Cívics + Mètode Karpathy + Open Data Municipal Complet (`CreativeWork` + `OKF v0.2` + Restaurador a la UI):**
   - Poblar `/opendata/noticies.jsonld`, `/opendata/agenda.jsonld` i `/opendata/memoria-cultural.jsonld` amb les dades públiques reals de La Torre de les Maçanes (perquè no isquen buits!), exportar fitxes de memòria oral revisades (`OKF v0.2`) i connectar el restaurador verificat amb SHA-256 (`importaMunicipiOpenData.js`) a la UI.
4. **`FEDI-04` (Codex + Claude) · Administració Multipoble des d'una mateixa instal·lació (Model B / LLUXU):**
   - Habilitar la gestió i commutació d'administració multipoble (`towns`) des d'una sola instal·lació per als rols autoritzats, cobrint-ho amb proves Vitest.
5. **`FEDI-05` (Codex + Claude) · `flake.nix` + `nix/` Reproduïble + Instal·lador `inicia-node-germa.mjs` amb regles WebFinger adaptades:**
   - Incloure `scripts/botigues/associacio-apps.json` al flake arrel, alinear `flake.nix` i `nix/flake.nix`, i fer que `tooling/instalador/inicia-node-germa.mjs` reescriga automàticament les regles de WebFinger de `firebase.json` per a l'origen i el poble del node germà nou (p. ex. Xixona) i en valide la compilació real.
6. **`FEDI-06` (Codex + MarIA) · ActivityPub Segona Fase (`inbox` amb HTTP Signatures `Ed25519`, `Follow` → `Accept` i federació entre nodes):**
   - Completar `src/data/federacio/inboxActivityPub.js` i la prova d'integració end-to-end amb dos servidors HTTP locals que verifiquen `Follow` → `Accept` i el lliurament d'un avís `Create(Note)` amb signatura HTTP `Ed25519` verificada, més resposta al **Node 0 (`socdepoble.cat`)**.
7. **`FEDI-07` (Codex + Gemini + Claude) · Xifratge d'Extrem a Extrem del Xat (`sdp-xat-v1` · WebCrypto P-256 ECDH/ECDSA + AES-GCM 256) + Cerimònia SAS de 3 Amics:**
   - Verificar i permetre provar amb seguretat el mode E2EE `sdp-xat-v1`, la rotació monòtona de `kid` i la cerimònia de 3 amics (`CosPersonesConfianca.jsx`).
8. **`FEDI-08` (MarIA + Gemini) · Mesures Reals de Producció (Supabase + Node 0 Mac mini M4 `192.168.0.23` / `socdepoble.cat`) i Canonització a la Wiki:**
   - Mesurar la mida real de la base de dades de producció i el consum real del **Node 0 (`192.168.0.23`)**, i actualitzar `_wiki_de_poble/02_saber/architecture/perfil_minim_allotjament_node_municipal.md` i l'inventari de l'API del Model B amb dades reals verificades.
9. **`FEDI-09` (Gemini + Claude) · Accessibilitat WCAG 2.2 AAA (`2.1.3 Teclat sense excepció`):**
   - Auditar i blindar amb proves automàtiques la navegació per teclat sense excepció (`2.1.3`) a les superfícies de l'aplicació.
10. **`FEDI-10` (Totes 4 en consens: MarIA + Codex + Gemini + Claude) · Automillora de la Wiki, del Cervell i Actualització Verídica de `/page/fediversity` + Correu Definitiu a Fede:**
    - Cada vegada que un punt `FEDI-01..09` passe el Gauntlet Loop amb proves al 100% en verd, actualitzar `/page/fediversity` (`src/sections/text/pageContent.js`) passant-lo de `Pendent` a **`Fet hui (verificable)`**, millorar la nostra Wiki i les nostres skills amb les lliçons apreses, passar `node tooling/gates/certifica-enllacos.mjs` i deixar llest el correu definitiu per a Fede (`fediversity@nlnet.nl`).

### 6. Onada Nocturna 2 (`20:40 CET`) · Assalt Integral `FEDI-11` a `FEDI-20` (Cap Requisit de Fediversity sense Tancar, Sense Pressa però Sense Pausa)

Un cop completada la primera passada de `FEDI-01..10` i auditada per les 4 rondes de **Claude** (`261103_1624_auditoria_claude.md` §6–§9) i **Codex** (`261103_1604_auditoria_codex_gauntlet_fediversity.md`), i amb **`https://socdepoble.cat` ja operatiu en viu per HTTPS (`HTTP/2 200`) amb certificat SSL oficial de Cloudflare i túnel permanent `node0-latorre` (`2ffa3e6b-60d7-48fe-8ff0-3e720bd7e135`) cap al Mac mini M4 (`192.168.0.23:3350`)**, s'encadena l'**Onada Nocturna 2 (`FEDI-11` a `FEDI-20`)** en Mode `/goal` autònom:

11. **`FEDI-11` (MarIA · Partida 2 · IDEA-31) · Traducció Instantània Lliure (`MenuTraduir` + Apertium/MyMemory) al Peu Blau de les Targetes (`UniversalCard`):**
    - El botó `Traduir` del peu blau de `UniversalCard.jsx` (i de les targetes incrustades) ha d'obrir el menú flotant `MenuTraduir` i traduir al vol `title`, `subtitle` i `body` (entradilla) de la targeta amb el motor lliure (`traductorLliure.js`: Apertium per a `ES`, `EN-GB`, `FR`, `GL`; MyMemory per a `EU`, `DE`) amb opció de tornar a «Original (valencià)», exactament com fa la barra blava de `PageFrame`.
12. **`FEDI-12` (MarIA · Partides 1 i 3) · Actualització Canònica de `https://socdepoble.cat` com a Tercer Punt d'Accés Públic HTTPS del Node 0 i Sincronització del Build al Mac mini M4:**
    - Actualitzar `src/sections/text/pageContent.js` (`fedivers`, `fediversity`, `node-zero`), `src/data/iaiaLocal.js` i les seues suites de proves perquè reflectisquen amb exactitud verificable que `https://socdepoble.cat` és en servei públic HTTPS sobre el Mac mini M4 amb túnel permanent `node0-latorre`, NodeInfo 2.1 i manifest Ed25519 signat (`f6f561a5...`).
13. **`FEDI-13` (Codex · Partida 3 · ActivityPub Fase 2 i Interoperabilitat Mastodon) · Claus Públiques d'Actor (`publicKeyPem` RSA-2048 + `assertionMethod` Multikey Ed25519 `FEP-8b32`) i Inbox Verificable Dual (`rsa-sha256` + `ed25519`):**
    - Afegir `publicKey` determinista i `assertionMethod` als actors publicats per `src/data/activitypub.js` i `tooling/seo/genera-federacio.mjs` (resolent la troballa de Claude §8 línia 362), reforçar `supabase/functions/ap-inbox-verifica/` perquè verifique tant HTTP Signatures `rsa-sha256` de Mastodon com `ed25519` / `FEP-8b32` entre nodes germans, i evitar que una petició `POST` a una ruta d'inbox estàtica responga un `200` silenciós (`FED-08`).
14. **`FEDI-14` (Codex · Partida 1 · Portabilitat `FEP-7628` + `FEP-8b32`) · Exportació del Paquet `Move` Criptogràficament Signat (`eddsa-jcs-2022` `z` base58-btc) des del Perfil:**
    - Completar la pantalla de portabilitat de `src/sections/profile/` (`Privacitat i dades`) i `src/data/federacio/portabilitatFediversity.js` perquè el paquet `Move` que prepara i descarrega l'usuari isca **signat criptogràficament amb `eddsa-jcs-2022` (`z` base58-btc)** generant o important la clau Ed25519 en WebCrypto (resolent la troballa de Claude §8 línia 361: «El Move que prepara no va signat»), i que un segon node el puga verificar i importar amb prova d'integritat.
15. **`FEDI-15` (Codex · Partida 1 · Mode Rural Offline-First) · Xifratge Opcional del Vault Local (`AES-GCM-256` + `PBKDF2`), Compactació de Cua (< 4 MB), Esborrat Complet en Eixir i Paquets d'Emergència sense UUID Intern:**
    - Tancar al 100% les troballes de Claude (`R2F27-05..08` i §8 línia 366) sobre `src/data/modeRural.js`, `src/sections/control/ModeRural.jsx` i els motors rurals:
      1. Permetre protegir opcionalment el vault local a IndexedDB amb clau derivada per `PBKDF2-SHA256` + `AES-GCM-256` (WebCrypto) o exportar el paquet d'emergència xifrat.
      2. Eliminar qualsevol UUID intern d'usuari dels paquets d'emergència (`T5`) i usar sempre un actor/DID vàlid i verificable (`T6`).
      3. Afegir l'acció d'esborrat complet i verificat de les dades rurals a IndexedDB en desactivar el Mode Rural (`T7`).
      4. Implementar compactació i poda d'operacions ja confirmades a la cua offline abans del sostre de 4 MB (`T8`).
16. **`FEDI-16` (Codex · Partida 1 · Multi-Tenant i Seguretat RLS) · Capacitat `administracioMultipoble` Completa a l'Adaptador Local (`src/data/local/`) + Bateria PGlite d'Atac Creuat entre Pobles (`core-seguretat-audit` §3E):**
    - Implementar la capacitat `administracioMultipoble` a l'adaptador local perquè les **38 capacitats** del contracte estiguen cobertes també en local (resolent Claude §8 línia 359), i afegir proves PGlite d'atac creuat entre pobles (`R2-F04-03` i `R2-F04-07`) que demostren que cap admin d'un poble ni usuari sense `aal2` pot alterar la taxonomia, l'estil o les dades d'un altre municipi.
17. **`FEDI-17` (Codex · Partida 1 · Port Neutral 100%) · Ampliar el Kit de Conformitat (`src/data/conformitat/kit.js`) dels 80 Mètodes Actuals fins als 120 Mètodes Totals de `contracte.js` (`metodesSenseCas() === 0`):**
    - Afegir casos de conformitat executables a `src/data/conformitat/kit.js` per als 40 mètodes que encara restaven a `metodesSenseCas()`, de manera que el kit neutral certifique les **120 operacions completes (32 obligatòries + 88 opcionals de les 38 capacitats)** de `src/data/contracte.js`!
18. **`FEDI-18` (Codex · Partida 3 · Open Data Municipal v1.3.0 i Karpathy OKF v0.2) · Llicències Obertes Explícites (`CC BY 4.0` / `CC0-1.0`), Corpus Actualitzat i Fitxa de Memòria Documental/Oral OKF v0.2 Verificada:**
    - Tancar les troballes `R3O-03`, `R3O-05` i `R3O-06` de Claude a `src/data/exportaMunicipiOpenData.js` i `public/opendata/`: declarar llicència oberta reutilitzable en els elements propis exportats, actualitzar la notícia del Node 0 amb `https://socdepoble.cat` operatiu, incloure al paquet una fitxa OKF v0.2 amb traçabilitat de procedència i regenerar el manifest i el `.zip` + `.sha256` deterministes.
19. **`FEDI-19` (Codex · Partida 2 · Accessibilitat WCAG 2.2 AAA) · Correcció de `Focus Not Obscured` (`WCAG 2.4.11` · `scroll-padding-block` a `.app-main__content`), Encapçalament `<h2 class="sdp-nomes-lector">` al Perfil Públic i Porta `teclat-superficies.mjs` 100% Interactiva:**
    - Tancar `R3-FT-01` / `R4CT-01` afegint `scroll-padding-block` a `.app-main__content` (`src/css/layout.css`), tancar `F4` afegint `<h2 class="sdp-nomes-lector">` al perfil públic quan no hi ha bio perquè no es bote d'`<h1>` a `<h3>`, i tancar `R3-FT-02` fent que totes les superfícies de `tooling/gates/teclat-superficies.mjs` (inclosa `identitats`) executen pulsacions de teclat reals i que la porta quede cablejada a `run-portes.mjs`.
20. **`FEDI-20` (Codex + Claude · Partida 4 · Qualitat, Seguretat i Empaquetat Reproduïble) · Límit de Taxa per IP al Traductor del Connector WordPress (`v1.1.13`), Guarda `exporta_les_meues_dades` en Mode Pilot (`R3C-01`) i Zero Fallades Globals a Vitest, Node i les 57 Portes:**
    - Afegir limitació de taxa per IP (rate-limiting per transient d'IP) a l'endpoint REST de traducció del connector WordPress (`wordpress-plugin/`) i actualitzar `wordpress-plugin/readme.txt` (`F5`, `F6`), protegir `exporta_les_meues_dades` a `src/data/supabase/compte.js` en sessió pilot (`R3C-01`), i tancar qualsevol fallada residual (`R4PC-01`, `R4PC-02`) fins que `npm run lint`, `npm run test:node`, `npx vitest run` i `node tooling/gates/run-portes.mjs --cens` queden a **ZERO errors i ZERO fallades**.
21. **`FEDI-21` (MarIA + Claude · Partida 2 · Sistema de Disseny Pedra Seca · Captura `01_produccio/261103_2043_roadmap_separacio_h3_h4_paragrafs.png`) · Sistematització del Ritme Vertical Tipogràfic (`H3`, `H4`, `H5`, `<p>`) i Eliminació dels `<div>` Embolcall que Anul·len Marges (`:first-child` / `:last-child`):**
    - A `/roadmap` (`PAGE_COPY.roadmap`), cada parell `<h4> + <p>` està envoltat d'un `<div>` nu; com que `src/css/base.css` (`línies 237–246`) aplica `h4:first-child { margin-top: 0 }` i `p:last-child { margin-bottom: 0 }` a qualsevol contenidor, la separació entre el final d'un `<p>` i el següent `<h4>` cau a **`0px`** (queden apegats!), mentre que l'`<h3>` té `40px` (`--sdp-mt-h3`). Cal netejar els `<div>` innecessaris de `PAGE_COPY.roadmap`, acotar `:first-child` / `:last-child` de `base.css` perquè cap `<div>` agrupadors trenque el ritme entre paràgrafs i títols, i harmonitzar l'escala de separació vertical (`--sdp-mt-h3`, `--sdp-mt-h4`, `--sdp-mb-p`) amb prova de contracte tipogràfic.
22. **`FEDI-22` (Codex + Claude · P0 PRIORITAT MÀXIMA DEL MESTRE · Partides 1 i 3 · Captura `01_produccio/261103_2055_pagina_connectar_carmen_chaves_disseny_actual.png`) · Redisseny Integral i Lògica Universal de `/connectar` (`src/sections/connectar/`): Connexió Directa 1-Clic (Persona↔Persona, Persona↔Entitat, Entitat↔Entitat), Pertinença a Entitats amb Rol (`Administrador`, `Treballador/Soci`, `Usuari/Membre`) i Disseny a Amplària Completa:**
    - **Diagnòstic del Mestre sobre `/connectar` (ex. connectant amb Carmen Chaves Gastaldo):**
      1. **Disseny desaprofitat i jerarquia invertida:** La pàgina actual estreny el contingut en un túnel central deixant buit l'espai disponible, posa un cartell gegant del logo dalt que espenta els botons fora de pantalla, i barreja al final 5 blocs del Bloc de Notes (`Privacitat de la connexió`, `On arriba`, `Categories`, `Assistent de context`) amb l'acte essencial d'una xarxa social: **connectar amb una persona o entitat**.
      2. **El primer que ha de vore l'usuari (damunt del plec, clar, bonic, didàctic i aprofitant tot l'espai de treball):**
         - **Acció 1 · Connexió Directa (Fer-se amics / Veïnat connectat en 1 clic):** Un botó primari directe i clar per a connectar amb la persona o entitat tant **com a Persona** (`Javi Llinares ↔ Carmen Chaves`) com **des de qualsevol de les teues Empreses/Entitats** (`Sóc de Poble ↔ Carmen Chaves`, `El Rentonar ↔ Carmen Chaves`, `Oli de La Torre ↔ Carmen Chaves`, o `Empresa ↔ Empresa`). En el moment en què connectes per qualsevol d'estes vies, **ja sou contactes connectats («amics / veïnat connectat»)**: us podeu vore directament al **Xat**, cercar-vos als contactes i escriure-us amb un clic (`Escriu-li al Xat`).
         - **Acció 2 · Vincular / Incloure en una Entitat, Empresa o Associació amb Rol (`Administrador`, `Treballador / Soci`, `Usuari / Membre`):** Les persones poden pertànyer a empreses, associacions o entitats com a **administradores**, **treballadores/sòcies** o **usuàries/membres**, i quan un administrador d'una entitat (ex. Javi administrant `Sóc de Poble`, `El Rentonar` o `Oli de La Torre`) entra a `/connectar` d'una persona (ex. `Carmen Chaves`), ha de poder **incloure-la / vincular-la a eixa entitat triant l'entitat i el rol (`Administrador`, `Treballador / Soci`, `Usuari / Membre`)** (o, quan es visita el `/connectar` d'una entitat, demanar formar-ne part triant el rol).
         - **Acció 3 · Guardar fitxa o publicació a les teues Notes (Bloc de Notes):** Separada visualment (en segona columna o panell plegable/secundari ben estructurat) perquè mai eclipsi ni confonga la connexió social i d'entitats quan l'objecte és una persona o una organització.
23. **`FEDI-23` (Codex + Claude · P0 PRIORITAT MÀXIMA DEL MESTRE · Partides 1 i 3 · Captures `01_produccio/261103_2100_perfil_javi_veinat_connectat_buit.png` i `01_produccio/261103_2100_supabase_profiles_beta_testers_amics.png`) · Visibilitat de Connexions a Tots els Nivells (Persona, Empresa, Entitat, Poble), Unió de `elsMeusSeguiments` + `quiEmSegueix` i Switch Públic/Privat de Connexions:**
    - **Causa arrel detectada a la captura del Mestre (`261103_2100_perfil_javi_veinat_connectat_buit.png`):** El Mestre ja s'ha connectat amb els seus amics beta-testers registrats a `public.profiles` (`Damià Llorens Jordà`, `Carmen Chaves Gastaldo`, `Alfredo Llorens Jorda`, `Sofía Bornay`, `Diego Baldo bernaveo`, `Pep c`), cosa que guarda files a `public.seguiments` consultables via `elsMeusSeguiments()`. Però `src/sections/profile/Seguidors.jsx` (`GentQueEtSegueix`) **només cridava `quiEmSegueix()`** i no consultava mai `elsMeusSeguiments()`, de manera que al perfil de Javi (`/gent/c7cc745b-2c54-4739-b9c1-add751aac3c4`) eixia «Encara no s'ha connectat ningú amb tu»!
    - **Solució integral a tots els nivells (`FEDI-23`):**
      1. **Al Perfil de Persona (`src/sections/profile/Seguidors.jsx` + `PerfilPublicSection.jsx` + `DetallPrivacitat.jsx`):**
         - Unificar a «Veïnat i amistats connectades» tant **`elsMeusSeguiments()`** (la gent i entitats amb qui t'has connectat) com **`quiEmSegueix()`** (qui s'ha connectat amb tu), mostrant cada persona/entitat amb enllaç clicable a la seua fitxa (`/gent/:id` o `/entitats/:id`) i etiqueta clara («T'hi has connectat» / «Connectat amb tu» / «Connexió mútua»).
         - Afegir un **Switch (`Mostrar les meues connexions públicament` / ` En privat`)** tant al bloc de connexions del perfil com a `Privacitat i dades` (persistit a perfil/preferències i amb migració/RPC si cal per a lectura pública quan l'usuari activa el mode públic), de manera que l'usuari decidisca si les seues connexions d'amistat es veuen públicament a la seua fitxa pública o només en privat.
      2. **Als Perfils d'Empresa, Entitat i Associació (`PerfilPublicSection.jsx` + `GestioMembres.jsx`):**
         - Mostrar públicament les persones i entitats connectades amb l'empresa/associació i els seus membres públics (segons rol: administradors, treballadors/socis, usuaris/membres).
      3. **A la Fitxa de cada Poble (`src/sections/pobles/DetallPoble.jsx`):**
         - Mostrar el bloc de **«Veïnat, empreses i entitats connectades al poble»** (persones amb perfil públic vinculades o connectades al municipi i entitats actives del poble, com La Torre de les Maçanes).
24. **`FEDI-24` (MarIA + Codex + Claude · P0 PRIORITAT MÀXIMA DEL MESTRE · Captura `01_produccio/261103_2202_perfil_javi_mercat_mac_mini_orfe.png`) · Esborrat Universal en Cascada de Publicacions (Cards + Pàgines + Perfils + Pobles + Cerca + Multimèdia) i Retirada Definitiva de la Venda del Mac Mini (`mercat:mac-mini-m4`):**
    - **Regla mecànica i universal ordenada pel Mestre:** Quan s'esborra una publicació o la seua Nota vinculada, s'ha d'esborrar **automàticament i mecànicament de tots els llocs alhora**: del feed de secció (`/mur`, `/mercat`, `/events`), de la seua pàgina de detall (`/mercat/:id`, `/mur/:id`, `/events/:id`), del Perfil de l'autor (`/javillinares`, `/gent/:id`, `/empreses/:id`, `/entitats/:id` → pestanyes `Mur`, `Mercat`, `Agenda`), de la fitxa del Poble (`/pobles/:slug`), de Cerca (`/cerca`) i de Multimèdia (`/multimedia`). I la targeta de venda del Mac Mini (`mercat:mac-mini-m4`) no ha d'aparéixer mai més al perfil de Javi (`Mercat`) ni en cap lloc perquè ja no està en venda (és el Node 0).
    - **Implementació ja executada per MarIA (`src/data/publicacionsEsborrades.js`, `src/sections/mur/MurContext.jsx`, `src/sections/notes/NotesContext.jsx`, `src/data/publicacionsEsborrades.test.jsx`):**
      - Filtratge reactiu universal a `MurContext` (font única de veritat de totes les vistes) amb `'mercat:mac-mini-m4'` retirat canònicament en tots els modes (`seed`, `local`, `remote`), funció `esborraPublicacio(seccio, id)` exposada a `MurContext`, i cascada automàtica des de `NotesContext.esborraNota` i `mouNota(note, 'paperera')`.
    - **Extensió per a Codex i Claude (`FEDI-24b`):**
      - Afegir el mètode `esborraPublicacioDeSeccio({ seccio, id })` al port neutral (`src/data/backendPort.js`, `src/data/supabase/`, `src/data/local/`) perquè quan l'autor esborra una publicació des de la UI o des de les Notes també execute el `DELETE` remot a `public.section_submissions` (amb RLS d'autor) i a `app_content`, i afegir l'acció d'esborrar publicació per a l'autor a `PublicacioDetall.jsx` / `ItemDetailSection.jsx`.
25. **`FEDI-25` (MarIA + Codex + Claude + Gemini · Cas d'Ús d'Esdeveniment Multi-dia i Vídeo Protagonista · Captures `01_produccio/261103_2247_finder_bandeja_entrada_cursos_pedra_sec_fageca_alcosser.png` i `01_produccio/261103_2256_mur_aplec_quadrat_negre_data.png`) · `Cursos de pedra en sec a Fageca i Alcosser` signat per `El Rentonar`, de costat amb `Disseny Pedra Seca` al `/mur`:**
    - **Patró unificat a `UniversalCard` (`src/components/PedraSeca/organismes/UniversalCard.jsx`), `EventCard` (`src/components/universal/EventCard.jsx`) i `UniversalPage` (`src/sections/detail/detailSectionMeta.jsx`):**
      1. **Quadrat Negre (`SquareBadge` / `calendar_badge`) flexible per a esdeveniments multi-dia i cursos:** Quan un acte dura diversos dies o setmanes (ex. `23–14` / `OCT–NOV` / `2026`), `SquareBadge` aplica l'escala tipogràfica adaptativa `data-mida={midaDelPreu(diaText)}` perquè el rang de dies càpia en una sola línia dins del quadrat de `128×128 px`, mantenint `inici: '2026-10-23'` i `fi: '2026-11-15'` per a `/calendari`.
      2. **Vídeo protagonista sobirà al Node 0 (`https://socdepoble.cat/media/cursos-pedra-en-sec-fageca-alcosser-2026.mp4`):** Validat amb `esFontVideoPropia` / `fontVideoPropia` (`src/utils/sanitize.js`), pintat amb `<video controls playsInline preload="metadata">` tant a la targeta (`.sp-card-media-container--video`, sense entradilla amb `ometEntradillaTargeta: true` per equilibrar l'alçada vertical) com a l'Hero de la `UniversalPage` (`.sdp-hero-video`), i servit amb `HTTP 206 Range` i manifest signat Ed25519 al servidor de mitjans pesants del Node 0 (`https://socdepoble.cat/media/manifest.json`).
      3. **Autoria d'`El Rentonar` i col·locació estratègica al costat de `Disseny Pedra Seca`:** Signat per `El Rentonar` (`author_entity_id: 'rentonar'`, que publica el contingut social, agrari i patrimonial mentre `Sóc de Poble` publica el tecnològic) amb l'hora exacta de publicació de l'Ajuntament de Muro (`2026-09-18T11:32:23+00:00` → `13:32 · 18/09/26`, `boinaDataPublicacio: true`), i `Descàrregues i Aplicacions` moguda a `2026-09-09T22:07:00+02:00` perquè `Cursos de pedra en sec a Fageca i Alcosser` (posició 5) i `Disseny Pedra Seca` (posició 6) queden juntes de costat a la mateixa fila del `/mur`.
      4. **Debat obert al Consell Local (Claude, Codex i Gemini):** Proposeu al vostre informe com estendre aquest patró de fitxa d'esdeveniment multi-dia / curs (horaris detallats, lloc, inscripció, font original i drets en compartir notícies transformades d'altres webs municipals) sense crear components fora de `UniversalCard` i `UniversalPage`.
26. **`FEDI-26` (MarIA + Claude + Codex · Ordre Directa del Mestre `01:31 CET` · Llei d'Or de les Connexions Socials vs. Bloc de Notes i Connexions Públiques per Defecte):**
    - **Regla 1 · MAI portar una connexió entre persones o entitats/grups al Bloc de notes (`ConnectarSection.jsx` i `modeDeConnectar.js`):**
      - Connectar amb una **persona, entitat, empresa o grup** (`esPerfilSocial`: `persona`, `entitat`, `grup`, ex. Javi connectant amb **El Rentonar**) és una **connexió social pura** (com fer-se amics o seguir-se en una xarxa social). **MAI** s'ha d'obrir ni mostrar el formulari de «Guardar a les teues notes» (`notesDelBloc`) quan es connecta amb un perfil social, ni crear cap nota anomenada «El Rentonar» al Bloc de notes.
      - El **Bloc de notes** queda reservat exclusivament per a connectar i guardar **elements de contingut** (`element`: articles, notícies com la del curs de pedra en sec d'avui, esdeveniments, productes o pàgines editorials).
    - **Regla 2 · Connexions socials PÚBLIQUES per defecte amb avís clar i 1 clic per fer-la privada (`VisibilitatDeLaConnexio.jsx`, `ConnexionsPubliques.jsx`, `seguiments.js` / `localSeguiments.js` i migració `connexions_publiques`):**
      - Perquè la xarxa social funcione i les connexions apareguen al panell/fitxa de Javi i al d'El Rentonar sense obligar l'usuari a fer passos amagats als ajustos, **les connexions entre persones i entitats han de nàixer PÚBLIQUES per defecte (`visibilitatConnexions: 'publica'`)**.
      - En connectar (i a `/connectar` i al Perfil), s'ha d'avisar de forma directa i didàctica: **«Esta connexió és pública i apareixerà a la fitxa. Si vols que siga privada, canvia-ho ací»**, mostrant sempre l'interruptor directe d'1 clic per passar-la a privada si l'usuari ho desitja.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. `npx vitest run src/sections/xat/ src/sections/detail/ src/sections/notes/ src/sections/text/ src/sections/mur/ src/data/traductor.test.js`
2. `node tooling/seo/check-editorial-copy.mjs`
3. `node tooling/gates/design_guard.mjs`
4. `node tooling/gates/frontissa-contingut.mjs`
5. `node tooling/gates/porta-olivera.mjs`

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Col·lisió d'escriptura entre carrils:** S'evita separant estrictament els fitxers de cada carril (MarIA: `pageContent.js` i Supabase `marketItems`; Codex: `FakeChatOnboarding.jsx`, `elementDeSeccio.js`, `NotesSection.jsx`; Gemini: kits de QA i proposta d'enfortiment Fediversity; Claude: auditoria final i integració).
- **Estat de la sessió abans del reinici:** Tots els canvis ja fets a `traductor.js`, `Aplec2023Article.jsx`, `eventsSeed.js`, `censImatges.js`, `PublicacionsDeLaFitxa.jsx` i `components.css` queden desats al disc local; després del reinici, el Teler arranca directament des d'este Pla i el seu Prompt associat.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
