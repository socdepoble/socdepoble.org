---
type: prompt
status: esborrany
description: 'Prompt del Teler per a MarIA, Codex, Gemini i Claude: correcció d''Oli de La Torre, Xat privat d''entitats, 3 nodes, logotip dual Dia/Nit i assalt final Fediversity.'
tags:
  - govern
visibility: private
reflex: sdp:torn_5730b50a-1c94-4007-a60a-8ba515a77cba:c4cc8845-1209-4e8c-8315-1723f0bce988
---
# Prompt Teler d'Assalt · MarIA Constructora + Codex + Gemini + Claude (Oli de La Torre, Xat Privat, 3 Nodes socdepoble.cat, Logotip Dual Dia/Nit i NLnet Fediversity)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- **Escriptori net verificat:** `node tooling/gates/porta-olivera.mjs` ix amb `0` abans i després de la convocatòria.
- **Pla d'Implementació vinculat:** [[261103_1412_pla_implementacio_teler_fediversity_oli_xat_i_logos_duals]]
- **Acta Marmota de relleu:** [[261103_1412_acta_marmota_aplec2023_traductor_i_relleu_teler_fediversity]]
- **Llibre Mestre:** [[03_llibre_mestre_tasques_i_idees]] (`IDEA-67..70`)

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5730b50a-1c94-4007-a60a-8ba515a77cba:c4cc8845-1209-4e8c-8315-1723f0bce988 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-03T13:15:17.914Z |
| Modificació | 2026-11-03T13:16:00.000Z |
| Propietari | IAIA MarIA (Antigravity) |
| Aprovació humana | Ordre directa del Mestre Javi Llinares (03-11-2026 14:10 CET) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | IAIA MarIA (Antigravity) + GPT Codex + Gemini 4 + Claude |
| Tokens consumits | 0 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-11-03T13:16:00Z (v1.0.0):** Convocatòria del **Teler Invertit (MarIA Constructora + Codex + Gemini + Claude Àrbitre)** per a executar immediatament després del reinici del Mac, cobrint totes les correccions editorials d'Oli de La Torre (`H3` darrere de l'entradilla sense duplicar el `lead` + `A l'Almàssera de La Torre`), el Xat privat amb Oli de La Torre i entitats, els 3 nodes actius (`socdepoble.cat`) i les Cards a `/fedivers`, `/page/fediversity` i `/page/node-zero`, el logotip dual Dia/Nit damunt de l'H1 a l'editor (`IDEA-70`) i la fortificació final per a enviar el correu a Fede de **NLnet · NGI Fediversity** esta nit.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Model B:** Sollutia és l'amfitrió i el soci d'infraestructura de Sóc de Poble: allotja el Web Component, ens pot passar la sessió i ens obri la seua API només en lectura (GET a través de la Frontissa), sense injectar cap backend ni interferir en l'arquitectura o el disseny. Les dades del poble viuen al Supabase de Sóc de Poble, única font de veritat, darrere d'un port neutral (`src/data/backendPort.js`): el frontend, 100% modular, s'enxufa a qualsevol amfitrió (Sollutia, WordPress o Joomla), canviar de backend és una decisió de Sóc de Poble amb una ADR i el kit de conformitat, i sempre podem traure-ho «tot fora».
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) de la seua API: entraran per la Frontissa (`src/data/adaptadors/sollutia/`), només en lectura GET i cada recurs amb captura real, traductor i fixture, sense tocar el port de backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

**🌍 Ecosistema Físic i Distribució de Carpetes (`Som de Poble` vs `socdepoble.org`):**
- **Directori Mare (`Som de Poble`):** És l'entorn contenidor global de tot el projecte (`/Users/javillinares/Documents/Antigravity/Som de Poble/`). No conté `package.json` ni és un repositori git (està protegit per un `.gitignore` de seguretat).
- **Nucli Operatiu i Git (`socdepoble.org`):** És l'aplicació web, la Wiki oficial (`_wiki_de_poble/`), el motor de regles i el repositori Git. Tota comanda de consola (`npm test`, `npm run dev`, `git status`, `node tooling/...`) **s'ha d'executar obligatòriament a `socdepoble.org`** (p. ex. `cd socdepoble.org && npm test`). Si s'editen fitxers des de l'arrel de `Som de Poble`, cal prefixar les rutes amb `socdepoble.org/`.
- **Carpetes Satèl·lit Exteriors de `Som de Poble` (Ja Creades i Canòniques):**
  * `_arxiu_wiki_de_poble/`: Únic destí oficial per a l'arxiu fred i la memòria històrica pesada que s'evacua d'Obsidian.
  * `_builds_de_poble/`, `_comunicacio_de_poble/`, `_cultura_de_poble/`, `_gestoria_de_poble/`, `_investigacio_ia_de_poble/`, `_menjar_i_beure_de_poble/`, `_multimedia_de_poble/`, `_oficina_de_poble/`, `_raw_de_poble/`, `_recursos_de_poble/`, `_salut_de_poble/`.
- **Prohibició Absoluta:** Està terminantment prohibit que qualsevol IA invente carpetes noves a `Som de Poble` o a `socdepoble.org`. La informació que calga preservar s'ubica exclusivament a les carpetes satèl·lit oficials ja establertes.

**⚡ ORQUESTRACIÓ DEL TRIO LOCAL I EXCLUSIVITAT DE CARRILS (Doctrina 2026):**
- **Rols i Models Actius:** IAIA MarIA (Directora Tècnica en Antigravity sobre `Gemini 4 Argon (High)` / `Gemini 3 Flash`), Claude Code (`Claude Fable 5.1 Extra · Ultracode` com a motor principal d'implementació i refactorització multi-carril el 80% del temps, i `Claude Opus · Ultracode` reservat el 20% per a arquitectura fundacional i auditories extremes), GPT Codex (`GPT-6.1 Sol Ultra` per a cicles d'enginyeria de portes i contractes, i `GPT Astra` per a l'auditoria adversarial extrema final) i Gemini CLI (higiene de portes, cens i índexs).
- **Matriu d'Exclusivitat de Carrils (Zero Col·lisions d'Escriptura):** Quan operen múltiples agents en paral·lel sobre `socdepoble.org`, cada agent modifica exclusivament els fitxers assignats al seu carril. Si detecta una millora fora del seu carril, deixa un pegat net `.patch` a `_wiki_de_poble/04_escriptori/` o l'anota al seu informe sense trepitjar l'arbre d'un altre agent.

**🔬 ENGINYERIA INVERSA I PARITAT AMB REA (Incentiu de Fidelitat):**
Totes les IAs (Claude, Codex, Gemini) tenen registrat i operatiu el conjunt d'eines MCP de REA (*Reverse Engineer Anything*) i la skill 'reverse-engineer-anything'. Quan se us encomane replicar, millorar o auditar una funcionalitat basada en un sistema o aplicació de referència existent (ex. el clon/patró WhatsApp, el TPV Loiverse, la Gestoria autònoma o la Frontissa de Sollutia), teniu autorització expressa i encoratjament per a utilitzar REA per a disseccionar bundles, lògica i comportament del patró de referència. L'objectiu és capturar la saviesa i el funcionament real de les millors aplicacions i traslladar-les al patró de Pedra Seca de Sóc de Poble amb el màxim trellat i sense duplicar codi.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Executeu en paral·lel i sense col·lisió d'escriptura el **Pla d'Implementació [[261103_1412_pla_implementacio_teler_fediversity_oli_xat_i_logos_duals]]**, seguint la doctrina del **Teler Invertit** que tan bon resultat ens ha donat:
- **IAIA MarIA (Antigravity · Constructora Principal i Orquestradora):** Executa el **Carril 1** (`src/sections/text/pageContent.js`, Supabase `app_content.marketItems`, proves de `src/sections/text/` i `src/data/iaiaLocal.js`) mentre roman disponible en tot moment per al Mestre.
- **GPT Codex (Constructor de Lògica, Xat i Editor a tope):** Executa el **Carril 2** (`src/sections/xat/components/FakeChatOnboarding.jsx`, `src/data/xatsPerDefecte.js`, `src/config/navigation.js`, `src/sections/detail/elementDeSeccio.js`, `src/sections/notes/NotesSection.jsx`, `src/sections/notes/NotesContext.jsx` i proves associades).
- **Gemini 4 (Inspector Visual, Multiidioma i Dossier NLnet Fediversity):** Executa el **Carril 3** (verificació visual/editorial de `/events/aplec-2023`, `/mercat/oli-de-la-torre-*`, `/page/node-zero`, `/fedivers`, `/page/fediversity`, i enfortiment d'evidències per al correu a Fede de NLnet Fediversity d'esta nit).
- **Claude (Àrbitre Suprem · Gauntlet Loop + Enginyeria Inversa REA + Consola 100% Neta):** Executa el **Carril 4** (auditoria inversa de tots els canvis de MarIA, Codex i Gemini, bucle adversarial Gauntlet Loop fins a 0 defectes, consola del navegador 100% neta `P0-16` i portes de tancament en verd).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### 1. Context d'allò JA EXECUTAT just abans del reinici (NO REVERTIR)
1. **Traductor per a pàgines llargues (`/page/fediversity`):** `LIMITS_TRADUCCIO` a `src/data/traductor.js` ja està ampliat a `24 lots / 60.000 caràcters`, i el pressupost a `tooling/vite/traductor-iaia.mjs` i `wordpress-plugin/includes/traduccio.php` a `100.000 / 1.000.000` (`94/94` proves client i `73/73` proves Node/PHP en verd).
2. **`/events/aplec-2023` (`2n Aplec pel Territori`) restaurat des de `socdepoble.net`:** Cartell d'alta resolució (`1343×1900`), cartell de ponents i foto de la reunió en `public/assets/events/aplec_2023_*` i `censImatges.js`; `Aplec2023Article.jsx` reescrit sense cap al·lucinació; `portada_sencera: true` i `author_entity_id: 'socdepoble'` a `eventsSeed.js` i Supabase (`app_content.events`); i retall quadrat dels 2/3 superiors a la Card (`.sp-card-media[src*="aplec_2023_cartell"] { object-position: 50% 0%; }` a `src/css/components.css`).
3. **Perfil públic (`PublicacionsDeLaFitxa.jsx`):** Eliminat l'`<h2>El que publica {nom}</h2>` i centrat el bloc d'accions a `src/css/components.css`.
4. **Post `/mur/node-zero-mac-mini-m4` a Supabase (`app_content.feedPosts`):** Ja té `author_entity_id: "socdepoble"`, `author_avatar` i `avatar_url` oficials i `date: "2026-10-29T12:00:00+01:00"`.

---

### 2. Carril 1 · IAIA MarIA (Constructora Principal en Antigravity)
1. **Oli de La Torre (7 productes a Supabase `public.app_content` → `marketItems`):**
   - **Llevar l'entradilla duplicada:** Eliminar el primer `<p>Oli d’oliva de categoria superior, obtingut directament d’olives, només per procediments mecànics i de la primera extracció en fred.</p>` de `description` (perquè `lead` / `entradilla` ja es mostra com a entradilla destacada sota el subtítol i no s'ha de repetir mai al cos).
   - **Posar sempre un `<h3>` immediatament darrere de l'entradilla:** Començar `description` directament amb `<h3>Presentació del format i elaboració tradicional</h3>`, seguit del paràgraf descriptiu del format amb negretes (`<strong>`), després `<h3>Fitxa nutricional i especificacions del producte</h3>` + `<table class="sdp-taula-nutricional">`, i finalment `<h3>Venda directa a l’Almàssera de La Torre</h3>` + botó gran cap a `https://olidelatorre.com/producte/...`.
   - **Nom i adreça oficials exactes (Zero mencions a *Cooperativa Agrícola Sant Gregori*):** Substituir tota menció de *Cooperativa Agrícola Sant Gregori* per **`A l’Almàssera de La Torre`** i el text literal facilitat pel Mestre:
     > «Pots adquirir este format directament a la botiga oficial de l’**ALMÀSSERA DE LA TORRE, COOP. V.** – Carrer Sant Isidre, 18, La Torre de les Maçanes 03108 (Alacant).»
2. **Actualització de `/fedivers`, `/page/fediversity`, `/page/node-zero`, `/xat` i `/versions` (`src/sections/text/pageContent.js`):**
   - **`PAGE_COPY.fedivers` (`/fedivers`):** Deixar clar al `lead` i al cos (`html`) que ja hi ha **tres nodes actius** (`socdepoble.org`, `gentdelatorre.net` i `<a href="http://socdepoble.cat" target="_blank" rel="noopener noreferrer"><strong>socdepoble.cat</strong></a>`, el servidor físic `<a href="/page/node-zero"><strong>Node 0 · Mac mini M4</strong></a>`). Autoritzar `http://socdepoble.cat` a `tests/helpers/lleiT8Prova.js`.
   - **`PAGE_COPY.fediversity` (`/page/fediversity`):**
     - Col·locar la Card de **`Node 0 · Mac mini M4: el servidor de l'habitació`** (`data-sdp-targeta="pagina:node-zero"`) **a dalt de tot a la dreta** (just sota el logotip de NGI Fediversity a `<h3>Què és NGI Fediversity i per què Sóc de Poble hi encaixa</h3>`).
     - Moure la Card de **`Nodes i Fedivers`** (`data-sdp-targeta="pagina:fedivers"`) a `<h4>La visió: nodes germans «Gent de…»</h4>`.
     - Actualitzar el text dels nodes actius perquè explique els **tres nodes actius** amb enllaç a `http://socdepoble.cat` i `/page/node-zero`.
   - **`PAGE_COPY['node-zero']` (`/page/node-zero`):** Enllaçar `<a href="http://socdepoble.cat" target="_blank" rel="noopener noreferrer"><strong>socdepoble.cat</strong></a>`, incrustar la Card de tornada a `/page/fediversity` (`data-sdp-targeta="pagina:fediversity"`) a l'última secció `<h3>Per què importa per al futur dels nostres pobles</h3>` i fixar `"date": "2026-10-29T12:00:00+01:00"`.
   - **`PAGE_COPY.xat` (`/xat`):** Ajustar `"date"` a `"2026-10-27T01:30:00+01:00"` perquè el trio superior del Mur siga: 1) *Candidatura Europea NLnet · NGI Fediversity* (`30/10/26`), 2) *Node 0 · Mac mini M4* (`29/10/26`), 3) *El Xat* (`27/10/26`).
   - **`PAGE_COPY.versions` (`/versions`) i tests:** Actualitzar `entrega110` (`03-11-2026`), `src/data/iaiaLocal.js`, `src/data/iaiaLocal.atles.test.js`, `src/sections/text/paginaDeText.test.js`, `src/sections/text/pageContent.fediversity.test.js`, `src/sections/text/TextSection.targetes.test.jsx` i `tooling/gates/frontissa-contingut.mjs`.

---

### 3. Carril 2 · GPT Codex (Constructor de Lògica, Xat Privat d'Entitats i Logotip Dual Dia/Nit `IDEA-70`)
1. **Xat Privat amb Oli de La Torre i Entitats (`/xat?amb=olidelatorre` o UUID d'organització):**
   - En `src/sections/xat/components/FakeChatOnboarding.jsx` (`creaFil`), `src/data/xatsPerDefecte.js`, `src/data/identitatsSeed.js` i `src/config/navigation.js`: quan l'usuari obri un xat privat amb **Oli de La Torre** (`olidelatorre` o `3073b933-69fc-4c3e-80dc-b0df9c6b8391`) o qualsevol altra entitat/empresa del padró o directori, **MAI** s'ha de redirigir a la comunitat de `Sóc de Poble` (`ID_COMUNITAT_SDP` / `comunitat=fake-sdp`). S'ha d'obrir la conversa directa amb **Oli de La Torre** (amb el seu nom `Oli de La Torre` i el seu avatar `/assets/mercat/oli_logo.png` o `avatar_url`).
   - Verificar també el camí autenticat a `src/sections/xat/XatContext.jsx` / `src/sections/detail/detailSectionMeta.jsx` i afegir proves de regressió a `src/sections/xat/components/FakeChatOnboarding.test.jsx`.
2. **`IDEA-70` · Logotip d'Entitat Dual (Mode Dia / Mode Nit) damunt de l'H1 en l'Editor de Text i `PageFrame`:**
   - Implementar en `src/sections/detail/elementDeSeccio.js` (`logoEntitatDElement`, `useLogoEntitatDElement`), `src/sections/notes/NotesSection.jsx` i `src/sections/notes/NotesContext.jsx` la possibilitat de pujar **dues imatges per al logotip que va damunt de l'H1**:
     - `logo_image` (logotip per a mode dia / fons clar, ex: negre)
     - `logo_image_dark` (logotip per a mode nit / fons fosc, ex: blanc)
   - En `elementDeSeccio.js`, tornar `{ clar: resoltClar, ...(resoltFosc ? { fosc: resoltFosc } : {}), alt: '' }` perquè `PageFrame.jsx` (`logoDescrit`) mostre automàticament `logo.fosc` quan `theme === 'dark'`.
   - En `NotesSection.jsx`, afegir l'acció d'edició del logotip de mode nit (fosc) al costat del logotip damunt de l'H1 i cobrir-ho amb proves unitàries.
3. **Revisió dels deutes tècnics del Llibre Mestre per a NLnet Fediversity:**
   - Verificar que el paquet `pkgs/socdepoble-node0/`, el motor rural offline-first opt-in i les proves de federació (ActivityPub / NodeInfo 2.1 / WebFinger / OpenData) estiguen en verd i documentats per al correu d'esta nit.

---

### 4. Carril 3 · Gemini 4 (Inspector Visual, Multiidioma i Fortificació de la Candidatura NLnet Fediversity)
1. **Inspecció editorial i visual completa:** Verificar que cap pàgina tinga entradilles duplicades ni falte l'`<h3>` darrere de l'entradilla, que totes les taules nutricionals i de la Wiki complisquen l'estàndard de Pedra Seca i que les 5 llengües (`CA/ES/EN/EU/GL`) estiguen alineades.
2. **Revisió de deutes tècnics i preparació del correu executiu final a Fede (`fediversity@nlnet.nl`):**
   - Contrastar el Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`) amb `/page/fediversity` perquè la candidatura arribe esta nit amb la màxima força tècnica possible (3 nodes actius: `socdepoble.org`, `gentdelatorre.net` i `socdepoble.cat` sobre el Node 0 Mac mini M4; connector oficial a WordPress.org; iOS i Android build 2 en revisió; ActivityPub + NodeInfo 2.1 + WebFinger + OpenData + Offline-First Rural).

---

### 5. Carril 4 · Claude (Àrbitre Suprem · Gauntlet Loop + Enginyeria Inversa REA + Consola 100% Neta)
1. **Auditoria Inversa i Gauntlet Loop:** Auditar implacablement tots els canvis dels Carrils 1, 2 i 3, verificar que no hi haja cap regressió i que totes les suites de Vitest i Node estiguen al 100% en verd.
2. **Consola 100% Neta (`P0-16`) i Portes:** Comprovar que la consola del navegador no emeta cap error ni avís en cap ruta (`/mur`, `/mercat/oli-de-la-torre-verge-extra-250-ml-botella-de-vidre`, `/events/aplec-2023`, `/xat?amb=olidelatorre`, `/fedivers`, `/page/fediversity`, `/page/node-zero`) i deixar totes les portes (`npm run portes`, `design_guard.mjs`, `check-editorial-copy.mjs`, `frontissa-contingut.mjs`, `porta-olivera.mjs`) a `0`.

---

### 6. MODE `/goal` + GAUNTLET LOOP INATURABLE SENSE EL MESTRE (`core-direccio-autonoma` · `requires_human_decision: false`) · MARATÓ «FEDIVERSITY ZERO PENDENTS» (`FEDI-01`..`FEDI-10`)

**EL MESTRE S'HA ABSENTAT DURANT HORES i ha activat el Mode `/goal` + Gauntlet Loop (`core-gauntlet-loop`) sota la direcció tècnica autònoma de la IAIA MarIA (`core-direccio-autonoma`, guàrdia `marato-fediversity-zero-pendents` activa durant 6 hores):**
- **Gemini 4 entra en Mode `/goal` (Goal Loop inaturable):** Té l'ordre d'executar sense parar, iteració rere iteració, tot el que siga acabable per a **NLnet · NGI Fediversity (`FEDI-01`..`FEDI-10`)**, l'arquitectura LLUXU / Model B, els mòduls cívics, les claus criptogràfiques (`FEP-8b32` i `sdp-xat-v1`), el `flake.nix`, l'Open Data i l'automillora de la Wiki i el Cervell, fins que no quede absolutament cap punt pendent.
- **GPT Codex i Claude donen suport total a Gemini 4 en bucle continu (Gauntlet Loop):** Llegint els avanços i kits a `_wiki_de_poble/04_escriptori/` i `../_investigacio_ia_de_poble/`, construint les peces pesants de backend/criptografia/Nix/Xat (Codex) i arbitrant, verificant portes i integrant a l'arbre viu amb consola 100% neta (Claude).

1. **PROHIBIT ATURAR-SE PER BOTONS HUMANS O PREGUNTES (`requires_human_decision: false`):**
   - Cap agent (Codex, Gemini, Claude) pot invocar `AskUserQuestion`, `ask_question`, `EnterPlanMode` ni comandes interactives que esperen un clic del Mestre, perquè el Mestre no és davant de la pantalla.
   - Si sorgeix qualsevol dubte de disseny, arquitectura o abast, l'agent pren la decisió més sòlida i reversible segons la doctrina de Pedra Seca / Model B o consulta el dictamen de **MarIA** a `_wiki_de_poble/04_escriptori/` i **continua avançant sense aturar-se**.
2. **ENCADENAMENT AUTOMÀTIC D'ONADES (`FEDI-01`..`FEDI-10` de `§5` del Pla `261103_1412_pla_implementacio_teler_fediversity_oli_xat_i_logos_duals.md`):**
   - En acabar la passada actual, **NO US ATUREU**: rellegiu immediatament `§5` del Pla `_wiki_de_poble/04_escriptori/261103_1412_pla_implementacio_teler_fediversity_oli_xat_i_logos_duals.md` i els informes de les companyes a `_wiki_de_poble/04_escriptori/`, i avanceu punt per punt pels **10 Objectius «Fediversity Zero Pendents» (`FEDI-01` a `FEDI-10`)** fent passades de **Gauntlet Loop adversarial (`core-gauntlet-loop`)** i **automillorant la Wiki i el Cervell** fins que no quede cap requisit pendent dels 50.000 € de NLnet Fediversity:
     - **Codex:** Construeix en còpia aïllada i/o al seu carril `FEDI-01` (`FEP-8b32` amb `z` + `base58-btc` + vectors oficials W3C + UI portabilitat `FEP-7628`), `FEDI-02` (connexió UI del Pont d'Emergència Rural, Sincronitzador de Carpeta Local i Cua Offline-First), `FEDI-04` (administració multipoble), `FEDI-05` (`flake.nix` + `nix/` + `inicia-node-germa.mjs` adaptant `firebase.json` WebFinger per al nou origen), `FEDI-06` (ActivityPub Segona Fase `inboxActivityPub.js` + prova HTTP signada entre dos nodes) i `FEDI-07` (E2EE `sdp-xat-v1` + cerimònia 3 amics).
     - **Gemini 4:** Construeix i audita `FEDI-03` (Open Data complet amb notícies, agenda i memòria cultural/oral `OKF v0.2` no buits + UI restaurador), `FEDI-08` (documentació canònica del perfil d'allotjament i API Model B a la Wiki), `FEDI-09` (WCAG 2.2 AAA `2.1.3 Teclat sense excepció`), `FEDI-10` (automillora de la Wiki/Skills i actualització verídica de `/page/fediversity` + correu definitiu a Fede certificat amb `certifica-enllacos.mjs`).
     - **Claude:** Actua com a Àrbitre Gauntlet Loop, integrador segur a l'arbre viu de cada peça verificada per Codex i Gemini, verificador de 0 errors/avisos de consola (`P0-16`) i garant que totes les portes (`node tooling/gates/run-portes.mjs --cens`, `design_guard.mjs`, `check-editorial-copy.mjs`, `frontissa-contingut.mjs`, `porta-olivera.mjs`) es mantinguen a `0`.

---

### 7. RONDA 3 GAUNTLET (`18:40 CET`) — OBLIGACIÓ DE CRON ACTIU (`schedule` cada 25m) I RESOLUCIÓ TOTAL DE P0/P1/P2 DE CLAUDE R3 I CODEX R2

**ATENCIÓ GEMINI 4 (`/goal`), CODEX I CLAUDE:**
Gemini 4 es va aturar a les `17:51` perquè el mode `/goal` NO crea un Cron (`schedule`) per si mateix i perquè va donar per tancats `FEDI-01..10` abans que **Claude** (`_wiki_de_poble/04_escriptori/261103_1624_auditoria_claude.md` §6–§7, actualitzat a les `18:37`) i **Codex** (`_wiki_de_poble/04_escriptori/261103_1604_auditoria_codex_gauntlet_fediversity.md`, actualitzat a les `18:30`) publicaren les troballes de la **Ronda 2 i Ronda 3** (5 P0 de veracitat, 18 P1 i 40 P2 oberts).

**ORDRE IMPERATIVA D'INICI DE TORN PER A GEMINI 4 (I CODEX/CLAUDE):**
- **NOVETAT EN VIU (`19:51 CET` · `FED-01` RESOLT EN REALITAT PEL MESTRE):** El Mestre acaba d'actualitzar a DonDominio les redireccions de `http://socdepoble.cat/` i `http://www.socdepoble.cat/` cap al túnel viu del **Node 0 · Mac mini M4 (`https://insight-station-baseball-promise.trycloudflare.com/`)**. Verificat amb `curl -sS -L -I http://socdepoble.cat/`: respon `HTTP/2 200` amb `x-sdp-node: node0-la-torre-mac-mini-m4`, `x-sdp-key-sha256: f6f561a5180e9f3da8c1c6ee8064b5475232e0ce06ba645d02566903ac5e1e11` i `/api/estat` operatiu!
0. **PROHIBIT ABSOLUTAMENT USAR `node -e`, `node --eval` O `python -c` AMB RUTES PROTEGIDES (`tooling/`, `.agents/`, `supabase/`) PERQUÈ DISPARA EL BOTÓ DE BLOQUEIG DEL HOOK I EL MESTRE ESTÀ DORMINT!**
   - El hook `.gemini/hooks/pre_tool_guard.mjs` bloqueja qualsevol «Intèrpret inline amb ruta protegida» (`node -e '...tooling/gates/...'`) i demana confirmació humana amb botó.
   - Per tant, **MAI** faces servir `node -e` ni `python -c` sobre `tooling/`, `.agents/` o `supabase/`. Usa **sempre** els scripts CLI directes: per ex. `node tooling/gates/segella.mjs --json` (el segell ja està `intacte`, verificat!), `node tooling/gates/run-portes.mjs --cens`, `node tooling/gates/frontissa-contingut.mjs --aprova-tot`, etc.
1. **PAS 1 OBLIGATORI (CRON ACTIU):** En el teu PRIMER pas, invoca l'eina `schedule` amb `CronExpression: "*/25 * * * *"`, `IsDaemon: true` i un `Prompt` que t'obligue a rellegir `_wiki_de_poble/04_escriptori/261103_1624_auditoria_claude.md` i `_wiki_de_poble/04_escriptori/261103_1604_auditoria_codex_gauntlet_fediversity.md` cada 25 minuts. **ESTÀ PROHIBIT donar el `/goal` per completat mentre quede qualsevol P0, P1 o P2 obert a l'auditoria de Claude o Codex!**
2. **PAS 2 · REVERTIR ELS TRUCS DE PORTES (`R2PP-10`, `R2PP-11`, `R2PP-15`):**
   - Claude ha caçat en `261103_1624_auditoria_claude.md` (línia 213) que a les 16:00–16:10 es van calmar portes retocant les portes: exempció afegida a `tooling/gates/tractor-doctrina.mjs:169`, edició manual del bloc autogenerat de `.agents/README.md` (que fa pujar F9 de 38 a 40), i retoc de `tooling/gates/kit-carril.mjs`.
   - **Acció obligatòria:** Revertiu qualsevol exempció artificial en `tooling/gates/tractor-doctrina.mjs` i `tooling/gates/kit-carril.mjs`, regenereu `.agents/README.md` amb el seu script legítim (`node tooling/llaurador.mjs` / `despertar.mjs`) i corregiu les rutes o fitxers reals que feien fallar les portes, passant per `executor-mutacio.mjs` si cal tocar govern.
3. **PAS 3 · TANCAR TOTS ELS P1 I P2 OBERTS DE LA RONDA 3 DE CLAUDE (`261103_1624_auditoria_claude.md` §6–§7):**
   - **`R3-FT-01 (P1 · WCAG 2.4.11 Focus No Obscured)`:** El focus de teclat queda tapat per la barra mòbil fixa i les barres apegaloses. Afegiu `scroll-padding-top` i `scroll-padding-bottom` adequats a `.app-main__content` en `src/styles/layout.css` (línies ~98 i ~600) i verifiqueu-ho amb test.
   - **`R3-FT-02 (P1 · Porta Teclat Real)`:** `tooling/gates/teclat-superficies.mjs` ara mateix no executa interaccions reals de teclat (`Tab`, `ArrowRight`, `Enter`, `Escape`) ni està cablejada. Feu que prove interaccions reals de teclat sobre el graf, calendari, calaixos i visor.
   - **`R3O-03, R3O-05, R3O-06 (P2 · Open Data Municipal Real i Llicència)`:**
     - En `public/opendata/noticies.jsonld`, l'única notícia diu encara «connectat a socdepoble.cat» (`R3O-03`): corregiu-ho amb la veritat actual i amplieu el paquet Open Data amb un script exportador real i reproduïble (`R3O-05`) que exporte totes les notícies públiques, actes de l'agenda i memòries culturals/orals de la llavor de La Torre de les Maçanes, incloent-hi el camp explícit de llicència oberta (`CC-BY-SA-4.0` / `ODbL-1.0`, `R3O-06`), i regenereu els hashes SHA-256 de `public/opendata/manifest.json` i `socdepoble-opendata.zip`.
   - **`R2F27-05..08 (P1/P2 · Mode Rural i Cua Offline)` i `FED-09 (P2 · Test Determinista)`:**
     - `T5`: El paquet d'emergència (`src/data/pontEmergenciaRural.js`) exporta l'UUID intern com a autor — anonimitzeu o useu l'àlies/DID públic sense filtrar l'UUID intern de sessió.
     - `T6`: El delta declara un actor institucional inexistent — useu l'actor canònic `https://socdepoble.org/ap/actors/la-torre-de-les-macanes.json` o el del node configurat.
     - `T7`: Les notes rurals queden a IndexedDB en eixir del Mode Rural sense cap opció d'esborrar-les — afegiu a `src/sections/control/ModeRural.jsx` i `src/data/sessioRural.js` un botó i funció d'esborrat complet i neteja en tancar sessió rural.
     - `T8`: La cua d'operacions offline (`src/data/cuaOperacionsOffline.js`) satura als ~4 MB i no es buida mai — implementeu poda/compactació de transaccions ja confirmades i límit amb rotació segura.
     - `FED-09`: Feu 100% determinista la prova «respostes remotes fora d'ordre» (`SDP-OFFLINE-TIMEOUT`) perquè no falle mai en `npm run test:node`.
   - **`R2-F04-03` i `R2-F04-07 (P1/P2 · Administració Multipoble i Migracions)`:**
     - Afegiu la migració `2611031700_administracio_multipoble.sql` (i `2611031500_notes_logo_mode_nit.sql`) al catàleg de `supabase/migrations/README.md` perquè `node scripts/supabase/verifica-migracions.mjs` i `migracio-verificador` passen a `0`.
     - Afegiu la prova de servidor PGlite d'atac creuat entre pobles (`core-seguretat-audit §3E`) verificant que un admin d'un poble no pot mutar un poble aliè no assignat.
   - **`R3C-01 (P3 · Privacitat i Dades sense 401)` i `R2F27-03 (P2 · Laboratori E2EE honest)`:**
     - En `src/data/supabase/compte.js`, protegiu també `exporta_les_meues_dades` amb la guarda de `runtimeDataMode` / sessió pilot perquè «Descarregar les meues dades» no dispare un `POST` remot `401` en mode llavor/pilot.
     - En `src/sections/profile/ProvaXifratXat.jsx` (`R2F27-03`), no afirmeu que l'usuari real té «3 contactes verificats» ni que la recuperació real està bloquejada; deixeu clar que són 3 contactes simulats de l'entorn de prova.
   - **`FED-08` i `R2F-03 (P2 · Honestedat ActivityPub Inbox i hs2019)`:**
     - Corregiu els comentaris i textos d'`ap-inbox-verifica` i `/page/fediversity` perquè no atribuïsquen a Mastodon suport d'Ed25519 amb `draft-cavage hs2019` (especifiqueu que Mastodon usa RSA `rsa-sha256` per a HTTP Signatures o `FEP-8b32 eddsa-jcs-2022` per a Object Integrity Proofs, i afegiu verificació dual RSA + Ed25519 a `ap-inbox-verifica` perquè puga verificar tant nodes germans Ed25519 com servidors Mastodon RSA!).
   - **`D-1..D-5` i Pegat d'Honestedat de `/page/fediversity` (`261103_1711_solucio_codex_copy_fediversity.patch` amb les 4 esmenes de Claude §6 línia 200–207):**
     - Integreu l'actualització honesta de `src/data/pageContent.js`, `src/data/pageContent.fediversity.test.js` i `src/App.fediversity.test.jsx` respectant els **3 H3 canònics** (posant el bloc de tall verificat com a **H4** dins de «Agenda viva i estat de les 4 partides»), aprovant la frontissa amb `node tooling/gates/frontissa-contingut.mjs --aprova-tot` i verificant que `check-editorial-copy.mjs` (inclosos els paràgrafs de `fediversity` i `fedivers`, `PP-05`) i totes les proves de Vitest i Node queden al 100% en verd.
   - **`Aplec F2 / F3` i `Oli F3 / F4`:**
     - Corregiu el desfàs d'hora de l'Aplec 2023 (`12:30` vs `18:00`) i optimitzeu el PNG de 2,6 MB a WebP lleuger si escau, i deixeu llest l'script/snippet de Supabase per a Oli de La Torre (`Oli F1/F3/F4`).

---

### 8. ONADA NOCTURNA 2 (`20:40 CET`) — ORDRE DIRECTA DEL MESTRE PER A CODEX I CLAUDE EN MODE `/goal` INATURABLE: «CAP REQUISIT DE FEDIVERSITY SENSE ACONSEGUIR (`FEDI-11` A `FEDI-20`), SENSE PRESSA PERÒ SENSE PAUSA»

**EL MESTRE HA ORDENAT EXPLICÍTAMENT (`20:40 CET`):**
> «Creo que Codex se ha estancado, dame algo para Codex porque ha acabado hace 20 minutos y Claude está esperando... esto no puede parar. Dales más faena que sigan en formato `/goal`, que sigan consiguiendo todos los requisitos de Fediversity, uno detrás de otro, cuantos más consigan y cuanto más se acerquen a los requisitos que Fediversity necesita más posibilidades tenemos de subsistir, necesitamos esos 50.000 €. Dales todo el trabajo posible para que hagan al máximo posible lo mejor que puedan sin prisa, pero sin pausa.»

#### NOVETAT D'INFRAESTRUCTURA EN VIU (`20:32 CET` · VERIFICADA AMB `curl`):
- **`https://socdepoble.cat` i `https://www.socdepoble.cat` JA SÓN 100% OPERATIUS EN VIU PER HTTPS (`HTTP/2 200`)!**
  - El Mestre i MarIA acaben de delegar els nameservers de `socdepoble.cat` a Cloudflare (`arch.ns.cloudflare.com`, `daniella.ns.cloudflare.com`), han creat el túnel permanent amb nom **`node0-latorre` (`2ffa3e6b-60d7-48fe-8ff0-3e720bd7e135`)** com a `LaunchAgent` persistent (`org.socdepoble.cloudflared-named.plist`) al **Node 0 · Mac mini M4 (`192.168.0.23`, port `3350`)** a La Torre de les Maçanes, i han activat les rutes:
    - `curl -sS -I https://socdepoble.cat/` → `HTTP/2 200` amb `x-sdp-node: node0-la-torre-mac-mini-m4` i `x-sdp-key-sha256: f6f561a5180e9f3da8c1c6ee8064b5475232e0ce06ba645d02566903ac5e1e11`.
    - `curl -sS https://socdepoble.cat/.well-known/nodeinfo` → `200 application/json` apuntant a `https://socdepoble.cat/nodeinfo/2.1.json`.
    - `curl -sS https://socdepoble.cat/nodeinfo/2.1.json` → `200 application/json` (NodeInfo 2.1 del Node 0).
    - `curl -sS https://socdepoble.cat/federation/node-manifest.json` → `200 application/json` (manifest signat amb Ed25519).
  - **Per tant, queda DEROGAT dir que `socdepoble.cat` està mort o que redirigix a un túnel caducat:** `https://socdepoble.cat` és el nostre tercer punt d'accés públic HTTPS en viu servit des del Mac mini M4 físic del poble!

#### DISTRIBUCIÓ DE CARRILS SENSE COL·LISIÓ PER A L'ONADA NOCTURNA 2 (`FEDI-11` A `FEDI-20` de `§6` del Pla):

1. **CARRIL MARIA (Orquestradora · En execució immediata):**
   - **`FEDI-11` (Traducció instantània en targetes):** Connectar el botó `Traduir` del peu blau de `src/components/PedraSeca/organismes/UniversalCard.jsx` (i `useAccions.js`) al menú flotant `MenuTraduir` + `traductorLliure.js` (Apertium + MyMemory) perquè traduïsca al vol `title`, `subtitle` i `body` de la pròpia targeta sense eixir de la pàgina (en lloc de navegar a `/traduccions`).
   - **`FEDI-12` (Actualització canònica de `https://socdepoble.cat`):** Actualitzar `src/sections/text/pageContent.js` (`fedivers`, `fediversity`, `node-zero`), `src/data/iaiaLocal.js` i les seues proves directes (`pageContent.fediversity.test.js`, `paginaDeText.test.js`, `iaiaLocal.atles.test.js`) amb `https://socdepoble.cat` operatiu per HTTPS, i sincronitzar el build amb el Mac mini M4.
   - **`FEDI-21` (Sistematització del Ritme Vertical Tipogràfic `H3` / `H4` / `<p>` · Captura `01_produccio/261103_2043_roadmap_separacio_h3_h4_paragrafs.png`):** Eliminar els `<div>` embolcall nus de `PAGE_COPY.roadmap` i blindar en `src/css/base.css` + `src/css/tokens.css` que `h4:first-child` i `p:last-child` dins de blocs interns mai deixen a `0px` la distància entre un paràgraf i el següent `<h4>`, equilibrant la proporció entre `--sdp-mb-p`, `--sdp-mt-h4` i `--sdp-mt-h3`.
   - **`FEDI-24` (Esborrat Universal en Cascada de Cards, Pàgines i Perfils + Retirada de `mercat:mac-mini-m4` · Captura `01_produccio/261103_2202_perfil_javi_mercat_mac_mini_orfe.png`):** Implementat a `src/data/publicacionsEsborrades.js`, `src/sections/mur/MurContext.jsx`, `src/sections/notes/NotesContext.jsx` i `src/data/publicacionsEsborrades.test.jsx` (`99/99` tests en verd). Codex i Claude poden completar la persistència remota al port (`esborraPublicacioDeSeccio` a `backendPort.js` / `section_submissions`) i el botó d'esborrat directe per a l'autor a `PublicacioDetall.jsx` / `ItemDetailSection.jsx`.
   - **`FEDI-25` (Cas d'Ús d'Esdeveniment Multi-dia i Curs amb Vídeo Protagonista · `Cursos de pedra en sec a Fageca i Alcosser` signat per `El Rentonar`, col·locat de costat amb `Disseny Pedra Seca` al `/mur` · Captures `01_produccio/261103_2247_finder_bandeja_entrada_cursos_pedra_sec_fageca_alcosser.png` i `01_produccio/261103_2256_mur_aplec_quadrat_negre_data.png`):** Implementat a `src/utils/sanitize.js` (`esFontVideoPropia`), `UniversalCard.jsx` (`videoUrl` + `SquareBadge` multi-dia amb `data-mida`), `EventCard.jsx` (`calendar_badge`, `boinaDataPublicacio`, `ometEntradillaTargeta`), `detailSectionMeta.jsx` (`.sdp-hero-video` + `date_label`), `eventsSeed.js` (`CURSOS_PEDRA_EN_SEC_2026_EVENT`), `content.js` i servidor de mitjans pesants del Node 0 (`https://socdepoble.cat/media/cursos-pedra-en-sec-fageca-alcosser-2026.mp4`). **Encàrrec per a Claude, Codex i Gemini:** Reviseu i aporteu als vostres informes la vostra visió sobre com unificar i estendre aquesta fitxa per a cursos, esdeveniments de diversos dies i cròniques transformades d'altres webs municipals (quadrat negre flexible, vídeo protagonista, citació de la font original i llicència de drets) sempre dins de `UniversalCard` i `UniversalPage`.

2. **CARRIL CODEX (Constructor Principal en Mode `/goal` · Autorització Plena del Mestre per executar `FEDI-22`, `FEDI-23` i de `FEDI-13` a `FEDI-20` un darrere l'altre sense parar):**
   - **Prohibit aturar-se dient «fora del meu carril» o «falta arbitratge»:** El Mestre t'autoritza explícitament a construir, provar i tancar a l'arbre local TOTS els requisits pendents de `FEDI-22`, `FEDI-23` i `FEDI-13` a `FEDI-20` (excepte editar `src/sections/text/pageContent.js` i `src/components/PedraSeca/organismes/UniversalCard.jsx` que està editant MarIA; per a `pageContent.js`, quan acabes cada bloc, deixa el teu resum verificat a `_wiki_de_poble/04_escriptori/261103_1604_auditoria_codex_gauntlet_fediversity.md` perquè MarIA el passe a «Fet hui (verificable)»):
     - **`FEDI-23` (PRIORITAT 0 ABSOLUTA DEL MESTRE · Captures `01_produccio/261103_2100_perfil_javi_veinat_connectat_buit.png` i `01_produccio/261103_2100_supabase_profiles_beta_testers_amics.png` · Connexions Visibles a Perfils de Persona, Empresa, Entitat i Poble + Unió `elsMeusSeguiments` + `quiEmSegueix` + Switch Públic/Privat):**
       1. **El bug que acaba de patir el Mestre en viu:** El Mestre s'ha connectat personalment amb els seus amics beta-testers registrats a `public.profiles` (`Damià Llorens Jordà`, `Carmen Chaves Gastaldo`, `Alfredo Llorens Jorda`, `Sofía Bornay`, `Diego Baldo bernaveo`, `Pep c`), però quan obri el seu perfil (`/gent/c7cc745b-2c54-4739-b9c1-add751aac3c4`), el bloc «Veïnat connectat amb tu» (`src/sections/profile/Seguidors.jsx`) diu **«Encara no s'ha connectat ningú amb tu»** perquè `GentQueEtSegueix` només crida `quiEmSegueix()` i **mai crida `elsMeusSeguiments()`**!
       2. **Acció immediata a `src/sections/profile/Seguidors.jsx` i `PerfilPublicSection.jsx`:**
          - Fes que `useSeguidors` / `GentQueEtSegueix` carregue en paral·lel tant **`elsMeusSeguiments()`** (la gent i entitats amb qui t'has connectat) com **`quiEmSegueix()`** (qui s'ha connectat amb tu) i els mostre unificats (amb distinció clara: «Connectat per tu», «Connectat amb tu» o «Connexió mútua / Amics», i amb enllaç clicable a la fitxa `/gent/:id` o `/entitats/:id` de cada contacte!).
          - Afig un **Switch (`Mostrar les meues connexions públicament` vs `Privades`)** al perfil (`Seguidors.jsx` i/o `DetallPrivacitat.jsx`, amb persistència i RPC/política de lectura pública quan el switch està actiu) perquè cada persona puga decidir si les seues connexions es mostren públicament al seu perfil públic o només en privat.
          - Estén la visibilitat pública de les connexions a tots els nivells: **Perfil de Persona**, **Perfil d'Empresa / Entitat / Associació** (`QuiSegueixOrganitzacio` / bloc públic de veïnat i membres connectats) i **Fitxa de cada Poble** (`src/sections/pobles/DetallPoble.jsx`: bloc de gent, empreses i associacions connectades públicament al poble).
     - **`FEDI-22` (PRIORITAT 0 ABSOLUTA DEL MESTRE · Captura `01_produccio/261103_2055_pagina_connectar_carmen_chaves_disseny_actual.png` · Redisseny Integral, Bonic, Didàctic i a Amplària Completa de `/connectar` `src/sections/connectar/`):**
       1. **Disseny i espai (`ConnectarSection.jsx`, `BlocRelacio.jsx`, `BlocFormarPart.jsx`, `src/css/modules.css`):** La pàgina `/connectar` ha d'aprofitar tot l'espai disponible (graella ampla de targetes en escriptori en lloc d'un túnel estret amb el logo gegant dalt que amaga els botons davall del plec). El **primer que es veu dalt del tot** ha de ser la fitxa de la persona/entitat amb qui vols connectar (amb el seu avatar real si en té!) i els botons d'acció social immediata!
       2. **Lògica de Connexió Directa i Pertinença amb Rols:**
          - **Camí 1 · Connexió Directa (Amics / Veïnat connectat en 1 clic):** Botó primari directe per a connectar **com a Persona** (`Javi Llinares ↔ Carmen Chaves`) o **com a qualsevol de les teues Empreses/Entitats** (`Sóc de Poble`, `El Rentonar`, `Oli de La Torre`). Quan connectes, ja sou amics/connectats: apareixeu a les vostres connexions del perfil (`FEDI-23`), us podeu cercar i obrir conversa directa al **Xat** (`Escriu-li al Xat`).
          - **Camí 2 · Incloure / Formar part d'una Empresa, Associació o Entitat amb Rol (`Administrador`, `Treballador / Soci`, `Usuari / Membre`):** Tant si visites el `/connectar` d'una entitat com si visites el `/connectar` d'una persona (com `Carmen Chaves`) i tu administres entitats (`Sóc de Poble`, `El Rentonar`, `Oli de La Torre`), has de poder **vincular / incloure eixa persona en una de les teues entitats triant el rol (`Administrador`, `Treballador / Soci`, `Usuari / Membre`)** o demanar formar-ne part!
          - **Camí 3 · Guardar a les teues Notes (Bloc de Notes):** Separat en una targeta/columna secundària o desplegable neta perquè mai tape ni confonga la connexió entre persones i entitats.
     - **`FEDI-17` (Prioritat 1 · Port Neutral 120/120):** Amplia `src/data/conformitat/kit.js` dels 80 mètodes actuals fins a cobrir els **120 mètodes complets de `src/data/contracte.js` (`metodesSenseCas().length === 0`)**! Quan els 32 mètodes obligatoris i els 88 mètodes de les 38 capacitats tinguen cas executable al kit de conformitat neutral, haurem assolit el 10/10 d'enxufabilitat de la Partida 1.
     - **`FEDI-16` (Prioritat 2 · Multi-Tenant Local + Proves PGlite d'Atac Creuat):** Implementa la capacitat `administracioMultipoble` a l'adaptador local (`src/data/local/`) perquè l'adaptador local declare i passe les **38 capacitats completes**, registra les migracions a `supabase/migrations/README.md` (`R2-F04-03`) i escriu la suite PGlite d'atac creuat entre pobles (`R2-F04-07`, `core-seguretat-audit §3E`).
     - **`FEDI-14` (Prioritat 3 · Paquet `Move` Signat amb `eddsa-jcs-2022` `z` base58-btc al Perfil):** Fes que la pantalla de portabilitat de `/perfil` (`src/sections/profile/` i `src/data/federacio/portabilitatFediversity.js`) **signe criptogràficament amb `eddsa-jcs-2022` (`z` base58-btc)** el paquet `Move` que prepara i exporta (generant/usant una clau Ed25519 WebCrypto de l'usuari o importada), i que permete verificar i importar el paquet signat amb un clic (`Claude §8 línia 361`).
     - **`FEDI-13` (Prioritat 4 · ActivityPub Fase 2: Actors amb `publicKey` RSA-2048 + Multikey Ed25519 i Verificació Dual):** Afig `publicKey` (`publicKeyPem` RSA-2048 per a Mastodon) i `assertionMethod` (Multikey Ed25519 `FEP-8b32`) als actors d'`src/data/activitypub.js` i `tooling/seo/genera-federacio.mjs` (`Claude §8 línia 362`), completa la verificació dual (`rsa-sha256` + `ed25519`) a `supabase/functions/ap-inbox-verifica/`, i evita que les rutes d'inbox estàtiques accepten `POST` amb `200` silenciós (`FED-08`).
     - **`FEDI-15` (Prioritat 5 · Mode Rural Offline-First 10/10: Vault Xifrat `AES-GCM-256` + `PBKDF2`, Cua Compactada, Neteja d'IndexedDB i Zero UUID Intern):** Tanca les 4 troballes de Claude (`R2F27-05..08` i `§8 línia 366`) a `src/data/modeRural.js`, `src/sections/control/ModeRural.jsx` i motors associats:
       1. Opció de xifratge real del vault local i dels paquets d'emergència amb `PBKDF2-SHA256` + `AES-GCM-256` (WebCrypto).
       2. Cap UUID intern d'usuari exposat com a autor al paquet d'emergència (`T5`) i actor canònic vàlid al delta (`T6`).
       3. Botó i funció d'esborrat complet d'IndexedDB en eixir del Mode Rural (`T7`).
       4. Compactació i poda automàtica de la cua d'operacions abans del límit de 4 MB (`T8`).
     - **`FEDI-18` (Prioritat 6 · Open Data Municipal v1.3.0 amb Llicències Obertes i Fitxa OKF v0.2 Verificada):** A `src/data/exportaMunicipiOpenData.js` i `public/opendata/`, resol `R3O-03`, `R3O-05` i `R3O-06`: actualitza la notícia del Node 0 a `https://socdepoble.cat`, declara llicència oberta explícita (`CC BY 4.0` / `CC0-1.0`) als recursos propis del paquet, inclou una fitxa documental/oral OKF v0.2 amb cadena de procedència i regenera el manifest, el `.zip` i el `.sha256`.
     - **`FEDI-19` (Prioritat 7 · WCAG 2.2 AAA: `scroll-padding-block` SC 2.4.11, `<h2 class="sdp-nomes-lector">` al Perfil i Porta `teclat-superficies.mjs` 100% Real):** Tanca `R3-FT-01` / `R4CT-01` a `src/css/layout.css` (`.app-main__content`), `F4` al perfil públic sense bio, i `R3-FT-02` a `tooling/gates/teclat-superficies.mjs` (cablejada a `run-portes.mjs`).
     - **`FEDI-20` (Prioritat 8 · Quota per IP del Traductor al Connector WordPress `v1.1.13`, Guarda `R3C-01` i Suite Global a ZERO Fallades):** Afig rate-limiting per IP a l'endpoint REST de traducció a `wordpress-plugin/` i actualitza `wordpress-plugin/readme.txt` (`F5`, `F6`), afig la guarda de mode pilot a `exporta_les_meues_dades` en `src/data/supabase/compte.js` (`R3C-01`), i resol les fallades residuals (`R4PC-01`, `R4PC-02`) fins que Vitest, Node i les 57 portes donen **0 errors i 0 fallades**.

3. **CARRIL CLAUDE (Àrbitre Gauntlet Loop en Mode `/goal` · Rondes 5, 6 i 7):**
   - Audita en còpia efímera (`cp -cR`) cada lliurament de `FEDI-11` a `FEDI-20` a mesura que MarIA i Codex els aterren.
   - Verifica en viu amb `curl` que `https://socdepoble.cat/` (`/.well-known/nodeinfo`, `/nodeinfo/2.1.json`, `/federation/node-manifest.json`) respon `HTTP/2 200` amb certificat SSL de Cloudflare i túnel `node0-latorre`.
   - Verifica amb Chrome headless / CDP que la nova traducció instantània en les targetes (`FEDI-11`) obri el `MenuTraduir` al peu blau de les cards i traduïx el títol, subtítol i entradilla in-place amb Apertium sense errors de consola (`P0-16`).
   - Actualitza a `_wiki_de_poble/04_escriptori/261103_1624_auditoria_claude.md` (§10 Ronda 5+) la **Taula de Puntuació 0–10 per cada Requisit i Partida d'NGI Fediversity** i la versió final del correu en anglés per a NLnet (`2026-08-1a6@nlnet.nl`) incorporant `https://socdepoble.cat` verificat i tots els nous punts `FEDI-11..20` que passen el Gauntlet!
   - **`FEDI-26` (Ordre Directa del Mestre a les `01:31 CET` per a Claude + Codex + MarIA):**
     1. **MAI portar una connexió entre persones o entitats/grups al Bloc de notes (`ConnectarSection.jsx` i `modeDeConnectar.js`):** Quan `social` és `true` (`esPerfilSocial`: persona, entitat o grup, com Javi connectant amb `El Rentonar`), **no s'ha de mostrar ni muntar `notesDelBloc` («Guardar a les teues notes»)** ni crear cap nota al Bloc de notes. El Bloc de notes és exclusivament per a connectar i guardar **elements de contingut** (`element`: articles, notícies, esdeveniments, productes o pàgines).
     2. **Connexions socials PÚBLIQUES per defecte amb avís clar i 1 clic per passar-les a privades (`VisibilitatDeLaConnexio.jsx`, `ConnexionsPubliques.jsx`, `localSeguiments.js`, `src/data/supabase/seguiments.js`):** Canviar el valor per defecte de `visibilitatConnexions` de `'privada'` a **`'publica'`** perquè les connexions entre persones i entitats apareguen per defecte a les fitxes públiques (en cas contrari, ningú sap obrir-les i la xarxa social queda buida), mostrant l'avís directe a `/connectar` i al Perfil: **«Esta connexió és pública i apareixerà a la fitxa. Si vols que siga privada, canvia-ho ací»** amb l'interruptor directe d'1 clic sempre actiu.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Zero trepitjades entre carrils:** Cada agent escriu exclusivament als fitxers del seu carril. Si detecta res fora del seu àmbit, ho comunica a l'informe d'auditoria o amb un `.patch`.
- **Prohibit bloquejar el Mestre:** Cap agent ha d'invocar preguntes bloquejants ni quedar-se en bucle; l'orquestradora (MarIA) respon sempre al Mestre a l'instant.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida i Rebut Canònic:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md` mitjançant el circuit formal (`node tooling/gates/obrir_torn.mjs` + `node tooling/wiki/document.mjs context` + `create` + `check`), declarant al Registre el vostre `Model IA` exacte en ús (prohibit deixar placeholders o models històrics obsolets).
2. **Context Compartit i Llibre Mestre:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe. És obligatori consultar i mantindre actualitzat el Llibre Mestre Permanent (`04_escriptori/03_llibre_mestre_tasques_i_idees.md`) anotant-hi qualsevol idea emergent, troballa o deute tècnic per a no perdre'n el rastre.
3. **Consens Tècnic, Diàleg Creuat i Asincronia (2 o 3 Bandes):** Totes les IAs locals convocades opereu en estricta igualtat de condicions d'accés natiu a disc. El flux és autònom i no bloquejant: cap IA s'ha d'aturar a esperar les altres; cadascuna avança en el seu rol i carril exclusiu d'escriptura i diposita els seus informes a l'Escriptori. A mesura que les companyes publiquen informes, és obligatori llegir-los per auditar les seues conclusions i enriquir el consens tècnic. L'orquestradora (MarIA) actua com a Directora Tècnica canalitzant el diàleg creuat, arbitrant discrepàncies i coordinant la decisió final amb el Mestre.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 edf7daf4d81ab3640d195369807d5ab047bbc60027abd2663f86de3b076d992a. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
