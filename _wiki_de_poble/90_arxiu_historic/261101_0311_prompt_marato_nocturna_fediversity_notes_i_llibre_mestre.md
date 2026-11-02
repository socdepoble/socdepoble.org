---
type: prompt
status: esborrany
description: Prompt d'execució autònoma per a Claude Opus 5.5 i revisió de qualitat i conformitat (QA) amb Gemini CLI i GPT Codex sobre NLnet Fediversity, IDEA-59/P1-72 i el Llibre Mestre
tags:
  - govern
visibility: private
reflex: sdp:torn_558abd5e-2f62-41ec-9892-b40065c7739f:1b45b1c1-fff4-4e63-a8d1-720d2f529e4c
---
# Prompt d'Execució i Auditoria Local — Marató Nocturna NLnet Fediversity, Bloc de Notes i Llibre Mestre

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex/Gemini):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu com a dipòsit continu d'idees, deutes tècnics i memòria permanent de la sessió.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: El Registre i la Instrucció declaren els models i variants vigents (`Claude Fable 5.1 Extra · Ultracode` / `Opus · Ultracode`, `GPT-6.1 Sol Ultra` / `Astra`, i `Gemini CLI`) i assignen a cadascun un carril exclusiu de fitxers d'escriptura per operar en paral·lel sense col·lisions ni esperes mútues.
- [x] **Pla d'Implementació** generat i vinculat al torn (`document.mjs plan`): `_wiki_de_poble/04_escriptori/261101_0311_pla_implementacio_marato_nocturna_fediversity_notes_i_llibre_mestre.md`.
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Verificat que el prompt naix de `document.mjs context` + `create` i conserva íntegres els spans de codi (`` `ruta` ``) dels blocs normatius sense mutilacions.
- [x] **Sentinella de Seguretat (core-seguretat-audit)**: Verificat el Checklist §5 (zero spread JSONB sense coacció, zero regex amb backtracking O(n), RLS per columna, Storage privat i purga de claus d'autoritat).
- [x] **Enginyeria Inversa i Paritat amb REA**: Verificat l'ús de REA ('reverse-engineer-anything') per a disseccionar referències i estructures natives o de botigues sense reinventar la roda.
- [x] **Cron de vigilància**: L'orquestradora programarà un cron (p. ex. cada 10 minuts) per revisar els relleus a l'Escriptori si l'agent local treballarà de forma autònoma i llarga.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

> **Telemetria:** Ompliu el camp "Model IA" amb l'identificador exacte del model real en ús (p. ex. `Gemini 4 Argon (High)` o `Gemini 3 Flash` per a MarIA; prohibit arrossegar per inèrcia models històrics obsolets com `Gemini 3.1 Pro`) i "Tokens consumits" obligatòriament a cada document d'eixida per a la Consola de Consums.

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_558abd5e-2f62-41ec-9892-b40065c7739f:1b45b1c1-fff4-4e63-a8d1-720d2f529e4c |
| Versió del document | 3.11.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-01T02:14:29.755Z |
| Modificació | 2026-11-01T03:16:00.000Z |
| Propietari | Agents Locals (Claude Opus 5.5 · Gemini CLI · GPT Codex) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_558abd5e-2f62-41ec-9892-b40065c7739f:1b45b1c1-fff4-4e63-a8d1-720d2f529e4c |
| Tall d'evidència | HEAD + 2026-11-01 03:16 CET |
| Aprovació humana | aprovat pel Mestre |
| requires_human_decision | false |
| Model IA | Claude Opus · Ultracode + Gemini 4 Argon (High) + GPT-6.1 Sol Ultra |
| Tokens consumits | ~42.000 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **v3.11.0 (261029):** Actualització de l'Orquestració de Models (Trio d'Avantguarda 2026), Matriu d'Exclusivitat de Carrils i Ecosistema Físic Real. S'actualitza la telemetria del Registre per desterrar models històrics obsolets (com Gemini 3.1 Pro o GPT-4o) i reflectir l'estàndard operatiu vigent: IAIA MarIA sobre `Gemini 4 Argon (High)` / `Gemini 3 Flash`; Claude Code amb `Claude Fable 5.1 Extra · Ultracode` com a motor principal d'implementació multi-carril (80%) i `Claude Opus · Ultracode` reservat per a arquitectura fundacional i auditories extremes (20%); GPT Codex amb `GPT-6.1 Sol Ultra` per a cicles d'enginyeria de portes i `GPT Astra` per a l'auditoria adversarial final; i `Gemini CLI` per a higiene de portes i índexs. S'incorpora al Context Tècnic i al Protocol d'Interacció la Matriu d'Exclusivitat de Carrils (zero col·lisions d'escriptura entre agents concurrents) i el circuit canònic de rebuts (`obrir_torn.mjs` + `document.mjs` + `porta-plantilla-viva.mjs`), i es posa al dia la llista real de carpetes satèl·lit exteriors de `Som de Poble` (`_builds_de_poble/`, `_menjar_i_beure_de_poble/` i `_oficina_de_poble/`, retirant l'antic `_rebost_de_poble/`).
- **v3.10.0 (261023):** Protocol de Col·laboració Autònoma, Diàleg Creuat i Llibre Mestre Permanent a l'Escriptori (Ment Colmena Local a 2 o 3 bandes). S'institucionalitza que totes les IAs convocades (siguen dues com Claude i Gemini, o tres amb Codex) operen en estricta igualtat de condicions operatives amb accés natiu a disc. El flux de treball és asíncron i no bloquejant: no cal que s'esperen l'una a l'altra; cada IA avança de manera autònoma en el seu rol i diposita el seu informe a `04_escriptori/`. És obligatori consultar activament el Llibre Mestre Permanent (`04_escriptori/03_llibre_mestre_tasques_i_idees.md`) per a no perdre cap idea ni deute tècnic durant l'anàlisi, i llegir de manera continuada els informes de les companyes per auditar i contrastar mútuament les conclusions sota la Direcció Tècnica de la IAIA MarIA.
- **v3.9.0 (261018):** Directriu canònica d'Enginyeria Inversa i Reconstrucció amb REA (*Reverse Engineer Anything*). S'autoritza i encoratja formalment a totes les IAs (Claude, Codex, Gemini) a utilitzar les eines MCP de REA i la skill 'reverse-engineer-anything' quan es dispose d'un punt de comparació o aplicació de referència (com el patró WhatsApp, el TPV Loiverse, la Gestoria o el connector extern), per tal d'extreure lògica i fidelitat mil·limètrica sense inventar ni al·lucinar res.
- **v3.8.0 (261017):** Incorporació canònica de l'Ecosistema Físic i Distribució de Carpetes ('Som de Poble' com a contenidor mare vs 'socdepoble.org' com a nucli Git/Node). Es fixa l'obligació d'executar comandes de consola i proves a 'socdepoble.org/' i es blinda la prohibició absoluta d'inventar carpetes noves fora dels satèl·lits oficials existents (_arxiu_wiki_de_poble, _gestoria_de_poble, etc.).
- **v3.7.0 (261013):** Protocol de Desconvocatòria i Tall Tèrmic de Crons («Cadascuna a sa casa»). Prohibició estricta de crons infinits sense límit d'iteracions o sense parada explícita; en finalitzar l'encàrrec o tancar el torn, la IA ha de cancel·lar qualsevol tasca programada per evitar malbaratar tokens i quota del pla.
- **v3.6.0 (261012):** Institucionalització del 'Canal Viu' per a entorns multi-agent en paral·lel (Nou Xat Lateral). S'indica explícitament als agents que un cron específic vigilarà els seus processos asíncrons i que han de coordinar-se sense xafar-se la memòria compartida.
- **v3.5.0 (261012):** S'introdueix l'exigència de l'**Auditoria Adversarial (Gauntlet Prompt)** per defecte a la instrucció de torn. La IA està obligada a executar un *Àrbitre Intern* abans d'emetre l'informe per evitar donar codi a mitges o amb placeholders.
- **v3.4.1 (261011):** S'introdueix la mentalitat d'I+D obligatòria com a pilar del prompt: les IAs han de plantejar les últimes tendències de l'estat de l'art (Investigació) abans de desenvolupar qualsevol solució mecànica.
- **v3.4.0 (261006, ENX-01):** El Context Tècnic porta la frase canònica de l'enxufabilitat amb Sollutia («Model B», ADR + port neutral), triada i signada pel Mestre el 261006: és la mateixa, caràcter per caràcter, que obri l'ADR-2026-09, i AGENTS.md §8 la rep amb el seu paquet de governança. La Directiva Suprema dona destí als punts d'accés de Sollutia: la Frontissa, només en lectura. La versió 3.4.0 també va a `.agents/protocolledge.json` en eixe paquet (deia 3.3.0 mentre la plantilla deia 3.3.1).
- **v3.3.1 (261005_1250):** Integració de les "Tècniques d'Investigació i Autòpsia". S'exigeix a la IA que vaja més enllà de la teoria de les skills i verifique el codi font real dels scripts i tractors per trobar discrepàncies mecàniques.
- **v3.3.0:** Refactorització estructural global. Es canvia el camp de registre "Versió" per "Versió del document" per evitar ambigüitats, exigint una migració a protocolledge.json.
- **v3.2.0:** Incorporada explícitament la Directiva Suprema de l'Enxufabilitat amb Sollutia al Context Tècnic. A més, es força l'agent a buscar contradiccions i duplicitats a la fase d'Automillora de manera explícita.
- **v3.1.0 (260927_1730):** Consolidació històrica. S'afegeix el llegat de 30 anys d'activisme (socdepoble.net) que s'havia perdut, i s'implementa el bloqueig de seguretat on l'Agent Local ha de rebutjar els prompts de MarIA si incompleixen la plantilla o ometen el Pla d'Implementació.
- **v3.0.0 (260927_1505):** Refactorització total cap a un format tècnic, concís i lliure de metàfores (eliminats "Olivera", "Masia"). S'optimitza per claredat tècnica mantenint la visió hipermodular.
- **v2.4.0:** Afegida visió Fedivers i App Nadiua.
- **v2.3.0:** Validada com a estructura única per IAs locals.

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

Llegiu abans de començar el Pla d'Implementació vinculat a aquest torn:
- `_wiki_de_poble/04_escriptori/261101_0311_pla_implementacio_marato_nocturna_fediversity_notes_i_llibre_mestre.md`
- I el Llibre Mestre Permanent: `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` (`IDEA-59` / `P1-72`, `P1-71`, `P1-70`, `P1-23`).

### Context Operatiu de la Nit (Trilogia ja Desplegada en Producció)
Aquesta nit ja hem desplegat i verificat en viu:
1. **Supabase Producció (`100% En Viu`):** Les 64 migracions SQL (`2610241400` → `2610312000`) estan aplicades i verificades amb `11/11 true`.
2. **WordPress.org Plugin Directory (`100% En Viu`):** El connector oficial **`socdepoble` (`v1.1.10`, SVN Revisió `3777487`)** ja és públic i instal·lable a **`https://wordpress.org/plugins/socdepoble/`** amb documentació bilingüe en valencià/català natiu (5 idiomes + traductor automàtic integrat) i 10 captures oficials (`screenshot-1.png` .. `screenshot-10.png`).
3. **Firebase Hosting (`100% En Viu`):** `1.021` fitxers desplegats a `https://socdepoble.org`.

L'objectiu d'esta marató nocturna és deixar **100% completades, provades i verificables** totes les partides de la candidatura **NLnet — NGI Fediversity (`2026-08-1a6`, `50.000 € / 1.000 h`)**, el nou enllaç i text de **WordPress.org a `/page/descarregues` i `/page/fediversity`**, la restauració i millora del **Bloc de Notes (`IDEA-59` / `P1-72`)** i la liquidació dels punts pendents del **Llibre Mestre (`P1-71`, `P1-70`)**, de manera que demà puguem desplegar i enviar el correu electrònic decisiu als avaluadors de Fediversity.

### Repartiment de Carrils (Zero Col·lisions)
- **Carril Principal d'Implementació (`Claude Opus · Ultracode` / `Claude Fable 5.1 Extra · Ultracode`):** Execució completa dels Blocs **F1**, **F2**, **N1** i **M1** detallats a les Tasques `T1`..`T6`.
- **Carril de Revisió de Qualitat i Conformitat (`Gemini CLI` i `GPT Codex`):** Revisió independent de qualitat i conformitat (QA), proves de regressió, validació de contractes i portes del sistema (`design_guard`, `wcag_contrast_audit`, `porta-autoritat`, `porta-olivera` i bateria `vitest`), emetent l'informe canònic a `_wiki_de_poble/04_escriptori/` i deixant pegats `.patch` si detecten qualsevol ajust pendent.

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 (BLOC F1 · Obrir el canal oficial `https://wordpress.org/plugins/socdepoble/` a `/page/descarregues` i `canalsDeBotiga.js`):**
  1. A `src/config/canalsDeBotiga.js` (línia 28), obrir el canal oficial `wordpress-org`:
     `Object.freeze({ id: 'wordpress-org', nom: 'WordPress.org', url: 'https://wordpress.org/plugins/socdepoble/' })`
     perquè `InstalaLaPwa.jsx` pinte l'enllaç verificat a `/page/descarregues`.
  2. A `src/sections/text/pageContent.js`, dins de `PAGE_COPY.descarregues` (`<h3>A la web del teu poble, amb WordPress</h3>` / `<h4>WordPress.org</h4>`, línia 582), actualitzar el text perquè declare que el connector oficial **`socdepoble` (`v1.1.10`) ja està publicat i obert a tothom al directori oficial de WordPress.org**, amb l'enllaç directe `<a href="https://wordpress.org/plugins/socdepoble/" target="_blank" rel="noopener noreferrer">wordpress.org/plugins/socdepoble</a>`, explicant que qualsevol ajuntament o col·lectiu el pot buscar i instal·lar des del tauler del seu WordPress i activar-lo en 1 minut amb el codi curt `[socdepoble_app poble="la-torre-de-les-macanes"]` i la plantilla `Sóc de Poble · full screen` (com ja fa `gentdelatorre.net`).
  3. Actualitzar `src/config/canalsDeBotiga.test.js`, `src/sections/detail/InstalaLaPwa.test.jsx` i qualsevol test de `systemPages.test.js` / `paginaDeText.test.js` afectat, i actualitzar la frontissa de contingut (`node tooling/gates/frontissa-contingut.mjs`) i `src/data/iaiaLocal.js`.

- **T2 (BLOC F1 · Actualització de `/page/fediversity` amb tot el desplegat a «Fet hui (verificable)» i Enllaços de Verificació en 1 Clic):**
  1. A `src/sections/text/pageContent.js` (`PAGE_COPY.fediversity`, línia 662):
     - Actualitzar el paràgraf de WordPress.org perquè diga que la fitxa oficial `<a href="https://wordpress.org/plugins/socdepoble/" target="_blank" rel="noopener noreferrer">wordpress.org/plugins/socdepoble</a>` **ja està publicada i activa amb la versió `1.1.10`** i 10 captures verificables.
     - Promoure de `<h5>Pendent</h5>` a `<h5>Fet hui (verificable)</h5>` totes les fites que ja s'han desplegat aquesta nit a `https://socdepoble.org` i les que s'entreguen en este torn:
       * **Partida 2:** Navegació completa amb fletxes del teclat (`IDEA-58` `↑ ↓ ← → Home/End`) per les columnes i graelles, i Traductor sobirà de pàgines sense Google (`IDEA-31` amb Apertium + MyMemory).
       * **Partida 3:** Exportació Open Data per municipi (`src/data/exportaMunicipiOpenData.js` amb verificador `SHA-256`, descarregable des de la fitxa de cada poble) i Primera fase de Federació `ActivityPub`, `WebFinger` (`host-meta`) i `NodeInfo 2.1` publicada en viu a `/ap/`, `/.well-known/nodeinfo` i `/nodeinfo/2.1.json` per a `@socdepoble@socdepoble.org` i `@la-torre-de-les-macanes@socdepoble.org`.
     - Afegir a la secció `<h3>Verificació en viu per als avaluadors i el veïnat</h3>` els enllaços directes clicables a:
       * Connector oficial a WordPress.org: `https://wordpress.org/plugins/socdepoble/`
       * Node germà en producció: `https://gentdelatorre.net`
       * Descoberta NodeInfo 2.1: `/.well-known/nodeinfo` i `/nodeinfo/2.1.json`
       * Actors i bústia ActivityPub: `/ap/actors/socdepoble.json`, `/ap/actors/la-torre-de-les-macanes.json` i `/ap/actors/la-torre-de-les-macanes/outbox.json`
       * WebFinger estàtic: `/.well-known/host-meta`
  2. Actualitzar `src/sections/text/pageContent.fediversity.test.js` i aprovar l'empremta a `node tooling/gates/frontissa-contingut.mjs`.

- **T3 (BLOC F2 · Tancament Tècnic de les Partides 1, 3 i 4 de NLnet Fediversity):**
  1. **Exportació Open Data Municipal Completa (`src/data/exportaMunicipiOpenData.js` + `src/data/exportaMunicipiOpenData.test.js`):**
     - Verificar i completar el paquet d'exportació Open Data Municipal (`noticies.jsonld`, `agenda.jsonld`, `memoria-cultural.jsonld`, `directori.jsonld`, `municipi.jsonld`, `datapackage.json` Frictionless v2 i sumari BagIt `SHA-256`), assegurant que `recullDadesPubliquesDelMunicipi` reculla les dades públiques disponibles i actualitzant el text corresponent de la Partida 3 a `/page/fediversity`.
  2. **Mètode Karpathy Local per a Memòria Oral (`src/sections/notes/proposaCard.js` + `src/sections/notes/proposaCard.test.js`):**
     - Verificar i completar l'estructurador local determinista de memòria oral perquè, a partir d'una nota o relat de la gent gran al Bloc de Notes (`[ 🎴 Proposa Card ]`), genere una fitxa estructurada amb títol, resum, etiquetes temàtiques, municipi detectat i bloc **Open Knowledge Format (OKF v0.2)** 100% en el navegador sense tòkens de pagament.
  3. **Alertes d'Emergència i Bàndols Urgents al Mur (`src/sections/mur/TargetaDelMur.jsx` + `src/sections/mur/MurSection.jsx`):**
     - Suportar visualment i semànticament (`role="status"` / distintiu d'alerta municipal destacat amb contrast AAA) les publicacions amb etiqueta o categoria d'alerta/emergència municipal (`alerta`, `emergencia`, `bandol_urgent`).
  4. **Prova End-to-End Real de `tooling/instalador/inicia-node-germa.mjs` (`tooling/instalador/inicia-node-germa.test.mjs`) i Perfil Mínim d'Allotjament:**
     - Verificar i ampliar les proves d'integració de `tooling/instalador/inicia-node-germa.test.mjs` sobre un segon poble en `os.tmpdir()`.
     - Documentar les mètriques mesurades d'allotjament mínim a `_wiki_de_poble/02_saber/architecture/perfil_minim_allotjament_node_municipal.md` (ancorat a `_wiki_de_poble/00_index_maquina.md` i `_wiki_de_poble/00_index.md`).

- **T4 (BLOC N1 · `IDEA-59` / `P1-72` — Restauració de la Card Tutorial del Bloc de Notes i Nova UX de l'Editor a `/notes`):**
  1. **Punt 0 (Regressió Crítica — Card Tutorial «Bloc de notes» amb la mà i la ploma):**
     - Restaurar dins de `NOTES` (`Tot`, a `src/data/appSeed.js` i `src/sections/notes/NotesSection.jsx`) la Card tutorial il·lustrada **`Bloc de notes · El teu estudi d'escriptura privat i lliure de distraccions`** (copiant `_wiki_de_poble/04_escriptori/01_produccio/261101_0256_card_bloc_de_notes_ploma.jpg` a `public/assets/notes/` sense alterar l'original de `01_produccio/`).
     - En entrar a `/notes` sense paràmetre `nota=` ni `carpeta=` explícit, obrir per defecte la vista **`NOTES` (`Tot`)** amb aquesta Card tutorial seleccionada i visible a la Columna 3 (en lloc d'obrir `carpeta=f-mur` sobre una `Nota sense títol` buida).
  2. **Punt 1 (Plantilla guia reversible a 0 caràcters en el cos de la nota — `src/components/universal/richText/useUniversalRichText.js`):**
     - En crear una nota nova (cos amb `0` caràcters), mostrar la plantilla guia (`Títol de secció H3`, paràgraf explicatiu, `Subtítol H4`, llista amb vinyetes i llista numerada).
     - En fer clic/focus al cos, ocultar la guia perquè l'usuari escriga sobre net; si ix del camp (`blur`) amb `0` caràcters escrits, tornar a mostrar la guia; si ha escrit `>= 1` caràcter, no tornar-la a mostrar.
  3. **Punt 2 (Desplegable d'encapçalaments `H3 → H4 → H5 → H6 → H2` — `src/components/universal/UniversalToolbar.jsx`):**
     - Substituir els botons solts `H3` i `H2` per un selector desplegable amb l'ordre exacte: **`H3`** (opció principal per a seccions del cos), **`H4`**, **`H5`**, **`H6`** i **`H2`** (al final).
  4. **Punt 3 (Sense Subratllat):**
     - Conservar **Negreta** i **Cursiva** i mantindre la prohibició del botó de **Subratllat** a la barra d'eines.
  5. **Punt 4 (Iconografia Pedra Seca i barra desplegable a 2 línies):**
     - Polir les icones SVG de la barra d'eines de l'editor i afegir un botó discret d'expansió a la dreta perquè la barra es desplegue a 2 línies quan calga sense retallar eines.

- **T5 (BLOC M1 · Liquidació de Deute Tècnic del Llibre Mestre: `P1-71`, `P1-70` i `wordpress-plugin/readme.txt`):**
  1. **`P1-71` (`IDEA-55` en `src/sections/multimedia/MultimediaSection.jsx` i `GestorMultimediaLocal.jsx`):** Moure `BarraVolumsLocals` a la Columna 1 davall de les vistes i blindar que la càrrega de sessió/HMR no es quede mai penjant en «Comprovant la sessió…».
  2. **`P1-70` (`IDEA-56` en `src/data/agentsSeed.js`):** Generar el derivat quadrat lleuger `256×256` de l'avatar de Javi Llinares a `public/assets/fotos/` i enllaçar-lo a `AGENTS_MAP.JAVI.avatar_url`.
  3. **Sincronització de `wordpress-plugin/readme.txt`:** Actualitzar `wordpress-plugin/readme.txt` del repositori amb el text en valencià/català natiu (5 idiomes + traductor automàtic integrat) i les 10 captures de la versió `1.1.10` publicada a WordPress.org, mantenint `tests/enxufe-plugin.test.mjs` 100% en verd.

- **T6 (BLOC S1 · Preparació Integral per a Google Play Store i Apple App Store — Dossier `T6` sense alterar els IDs històrics `P0-18`/`P0-19`/`P1-13`):**
  Un cop completades `T1`..`T5`, dedica el temps restant de la marató nocturna a deixar preparat tot el necessari per a pujar **Sóc de Poble** a **Google Play Store** i **Apple App Store**:
  1. **Android / Google Play:** Prepara/actualitza `public/.well-known/assetlinks.json` (i `public/.well-known/apple-app-site-association`), verifica `scripts/botigues/preflight.mjs` (`tests/botigues.test.mjs`) i les respostes exactes del formulari **Data Safety** de Google Play Console.
  2. **iOS / Apple App Store:** Verifica `ios/App/App/PrivacyInfo.xcprivacy` (`NSPrivacyTracking = false`), verifica que el flux d'eliminació de compte i dades personals estiga a 1 clic des de l'app (App Store Review Guideline 5.1.1(v)) i deixa llista la configuració d'empaquetat iOS.
  3. **Fitxes de Botiga Multilingües, Captures i Guia Pas a Pas:** Crea `_wiki_de_poble/02_saber/architecture/guia_publicacio_app_store_i_google_play.md` (ancorat a `_wiki_de_poble/00_index_maquina.md` i `_wiki_de_poble/00_index.md`) amb tots els textos oficials llestos per a copiar i enganxar a **Google Play Console** i **App Store Connect** en valencià/català, castellà i anglés.

- **T7 (BLOC K1 · Kits Paral·lels Sense Col·lisió Gemini/Codex + Qualificació sobre 10 dels 15 Punts de la Matriu Universal + Visió de Sistema Indestructible per a Fediversity):**
  1. **Kits Col·laboratius en `../_investigacio_ia_de_poble/261101_kits_marato_nocturna/{gemini,codex}/`:**
     - Tal com vam fer esta vesprada amb èxit total, mentre Claude avança pel carril principal, **Gemini** i **Codex** tenen mandat per construir i dipositar a `../_investigacio_ia_de_poble/261101_kits_marato_nocturna/{gemini,codex}/` (fora del RAG de la Wiki perquè no trenque la porta SCC d'ancoratge) **kits de pegats `.patch`, nous tests i solucions tècniques i de disseny** orientats a fortificar al màxim el sistema (per exemple: eliminar els 12 avisos residuals de `design_guard.mjs`, reforçar accessibilitat AAA, blindar casos frontera d'`exportaMunicipiOpenData.js`, `NotesSection.jsx`, `UniversalToolbar.jsx` o `assetlinks.json`), i **Claude auditarà i integrarà eixos kits** en la segona passada de la nit.
  2. **Qualificació sobre 10 dels 15 Punts de la Matriu Universal de Sóc de Poble (Obligatori a l'informe dels agents locals):**
     - Tant **Claude** com **Gemini** i **Codex** han d'incloure als seus informes d'auditoria una taula d'avaluació rigorosa qualificant amb **Nota (`X.X / 10`)** cadascun dels **15 Punts de la Matriu Universal del Sistema**, indicant **què falta exactament per arribar al `10/10` perfecte**:
       1. *Arquitectura Hexagonal i Port Neutral (`backendPort.js`, Model B Sollutia, Zero Lock-in)*
       2. *Sistema Pedra Seca i Geometria d'Alta Definició (`AppGridShell`, 3 columnes fixes, zero desbordaments)*
       3. *Accessibilitat Universal Rural AAA (Contrast WCAG $\ge 7:1$, `design_guard`, `tractor-cromatic`, navegació per teclat `IDEA-58`)*
       4. *Sobirania de Dades i Exportació Open Data Municipal (`exportaMunicipiOpenData.js`, Frictionless v2, JSON-LD, BagIt `SHA-256`)*
       5. *Federació Oberta (`ActivityPub`, `NodeInfo 2.1`, `WebFinger`, interoperabilitat Fedivers)*
       6. *Enxufabilitat Universal (Connector oficial `wordpress.org/plugins/socdepoble` `v1.1.10`, Web Component, SRI, CSP)*
       7. *Replicabilitat de Nodes Germans (`inicia-node-germa.mjs`, `flake.nix`, `gentdelatorre.net`)*
       8. *Privacitat, Seguretat i Blindatge RLS/RGPD (64 migracions Supabase, coacció JSONB, baixa/exportació RGPD, preparació E2EE)*
       9. *Bloc de Notes Sobirà i Mètode Karpathy Local (`NotesSection`, `UniversalToolbar`, `proposaCard.js` OKF v0.2 zero-cloud)*
       10. *Memòria Oral, Patrimoni i Gestor Multimèdia Local (`MultimediaSection`, File System Access API, Mapa EXIF Emowe)*
       11. *Comunicació Comunitària i Xat Rural (`/xat` estil WhatsApp Pedra Seca, Bàndols i Alertes d'Emergència al `/mur`)*
       12. *Multilingüisme Natiu i Traductor Sobirà Sense Google (5 idiomes natius `ca/es/eu/gl/en` + Apertium/MyMemory)*
       13. *Presència en Botigues Mòbils i PWA (`Apple App Store / TestFlight`, `Google Play Store`, `PrivacyInfo.xcprivacy`, `assetlinks.json`)*
       14. *Governança Algorítmica, Telemetria Honesta i Consola Pública (`/consola/*`, Umami nadiu sense cookies, Portes Mecàniques i Reflex)*
       15. *Rendiment, Lleugeresa i Resiliència Rural (LCP, mida de bundles, prerender SEO/OpenGraph de les 34 rutes públiques $\le 300\text{ KB}$, 26.900+ tests)*
  3. **Visió de Futur («Fins on podem arribar perquè Sóc de Poble siga un Sistema Completament Indestructible») i Argumentari per a NLnet Fediversity:**
     - Redactar una secció estratègica i tècnica explicant fins on pot arribar l'arquitectura de **Sóc de Poble** per esdevindre un **sistema públic comunitari 100% indestructible** (autoclonació des d'HTML/ZIP, federació inter-pobles d'emergència, supervivència sense núvols privatius, memòria oral immortal en format obert) i com presentar aquesta realitat demà en el correu a **NLnet — NGI Fediversity (`2026-08-1a6`)** perquè canvien radicalment d'opinió i financen el projecte.

- **T8 (Iniciativa Proactiva i Reversibilitat sobre el Llibre Mestre Depurat · «Millora amb Trellat»):**
  - El Llibre Mestre (`_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`) ja s'ha depurat de `405 KB` a `108 KB`.
  - Per ordre explícita del Mestre (`§0.2` del Llibre Mestre), si veieu qualsevol altre deute tècnic pendent a les matrius `P0`/`P1`/`P2` o una millora no demanada que clarament millore l'experiència d'ús o la nota dels 15 punts, **teniu permís i mandat d'arreglar-la per iniciativa pròpia** (Claude a l'arbre i Gemini/Codex en kits `.patch` a `../_investigacio_ia_de_poble/261101_kits_marato_nocturna/`), amb la condició estricta que siga **100% modular i fàcilment desfaïble (reversible)** si al Mestre no li agrada, i que ho documenteu a l'apartat `Millores Proactives Reversibles Aplicades`.

- **T9 (Verificació Total, Actualització del Llibre Mestre i Informe Canònic):**
  - Executar `npx vitest run`, `npm run build`, `node tooling/gates/porta-autoritat.mjs`, `node tooling/gates/porta-olivera.mjs`, `node tooling/gates/design_guard.mjs --arrel=src`, `node tooling/gates/tractor-cromatic.mjs` i `node tooling/gates/frontissa-contingut.mjs`.
  - Marcar com a resoltes les entrades corresponents a `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` i emetre l'informe canònic a `_wiki_de_poble/04_escriptori/`.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (servidor Vite actiu).
- **Criteris d'Acceptació:**
  1. `/page/descarregues` mostra el canal `WordPress.org` actiu amb enllaç directe a `https://wordpress.org/plugins/socdepoble/` i el text actualitzat de la versió oficial publicada (`v1.1.10`).
  2. `/page/fediversity` reflectix a «Fet hui (verificable)» totes les funcionalitats desplegades i entregades, amb enllaços directes clicables a `wordpress.org/plugins/socdepoble/`, `gentdelatorre.net`, `/.well-known/nodeinfo`, `/nodeinfo/2.1.json` i `/ap/actors/...`.
  3. Entrar a `/notes` obri per defecte `NOTES` (`Tot`) amb la Card tutorial «Bloc de notes» (mà amb la ploma) seleccionada; l'editor complix els Punts 1, 2, 3 i 4 d'`IDEA-59` / `P1-72`.
  4. `npx vitest run` i `npm run build` passen amb `0` errors, i `porta-olivera.mjs` ix amb `0`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Sincronització d'empremtes de la Frontissa de Contingut (`frontissa_contingut.mjs`):** Qualsevol canvi a `PAGE_COPY.descarregues` o `PAGE_COPY.fediversity` requerix actualitzar la seua empremta i els tests de contracte (`pageContent.fediversity.test.js`, `paginaDeText.test.js`, `systemPages.test.js`).
- **Tests de `canalsDeBotiga.test.js`:** En passar `wordpress-org` de `url: null` a `'https://wordpress.org/plugins/socdepoble/'`, cal actualitzar el test que abans comprovava que tots tres canals estaven tancats perquè ara verifique que `wordpress-org` és obert i `google-play` / `app-store` continuen tancats.

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
