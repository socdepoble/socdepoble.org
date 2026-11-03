---
type: prompt
status: esborrany
description: 'Prompt del Teler per a MarIA, Codex, Gemini i Claude: correcció d''Oli de La Torre, Xat privat d''entitats, 3 nodes, logotip dual Dia/Nit i assalt final Fediversity.'
tags:
  - govern
visibility: private
reflex: sdp:torn_10f0e355-fa6b-41fb-98f9-6a4478f38c1d:cb5810c8-c793-4380-92b8-ea041981ab3c
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
| Identificador | sdp:torn_10f0e355-fa6b-41fb-98f9-6a4478f38c1d:cb5810c8-c793-4380-92b8-ea041981ab3c |
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
