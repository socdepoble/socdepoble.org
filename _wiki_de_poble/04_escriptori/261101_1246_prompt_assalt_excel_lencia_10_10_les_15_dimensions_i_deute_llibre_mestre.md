---
type: prompt
status: canonic
description: Prompt d'orquestració per a Claude Opus 5.5, GPT Codex 6.1 Sol i Gemini 4 Argon High per pujar les 15 dimensions al 10/10 i tancar el deute del Llibre Mestre
tags:
  - govern
visibility: private
reflex: sdp:torn_558abd5e-2f62-41ec-9892-b40065c7739f:1b094716-686a-4db8-9ca4-0b022defa1ed
---
# PROMPT LOCAL: ASSALT A L'EXCEL·LÈNCIA 10/10 EN LES 15 DIMENSIONS I TANCAMENT DEL DEUTE DEL LLIBRE MESTRE

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex/Gemini):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu com a dipòsit continu d'idees, deutes tècnics i memòria permanent de la sessió.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: El Registre i la Instrucció declaren els models i variants vigents (`Claude Fable 5.1 Extra · Ultracode` / `Opus · Ultracode`, `GPT-6.1 Sol Ultra` / `Astra`, i `Gemini CLI`) i assignen a cadascun un carril exclusiu de fitxers d'escriptura per operar en paral·lel sense col·lisions ni esperes mútues.
- [x] **Pla d'Implementació** generat i vinculat al torn (`document.mjs plan`): `_wiki_de_poble/04_escriptori/261101_1246_pla_implementacio_assalt_excel_lencia_10_10_les_15_dimensions_i_deute_llibre_mestre.md`.
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
| Identificador | sdp:torn_558abd5e-2f62-41ec-9892-b40065c7739f:1b094716-686a-4db8-9ca4-0b022defa1ed |
| Versió del document | 3.11.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-01T11:48:46.900Z |
| Modificació | 2026-11-01T11:51:00.000Z |
| Propietari | Agents Locals |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_558abd5e-2f62-41ec-9892-b40065c7739f:1b094716-686a-4db8-9ca4-0b022defa1ed |
| Tall d'evidència | HEAD + arbre viu 2026-11-01 12:46 CET |
| Aprovació humana | Mestre Javi Llinares (2026-11-01 12:42 CET) |
| requires_human_decision | false |
| Model IA | IAIA MarIA (Orquestradora) → Claude Opus 5.5 · Ultracode + GPT-6.1 Sol Ultra + Gemini 4 Argon (High) |
| Tokens consumits | ~42.000 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **v3.11.0 (261029):** Actualització de l'Orquestració de Models (Trio d'Avantguarda 2026), Matriu d'Exclusivitat de Carrils i Ecosistema Físic Real. S'actualitza la telemetria del Registre per desterrar models històrics obsolets (com Gemini 3.1 Pro o GPT-4o) i reflectir l'estàndard operatiu vigent: IAIA MarIA sobre `Gemini 4 Argon (High)` / `Gemini 3 Flash`; Claude Code amb `Claude Fable 5.1 Extra · Ultracode` com a motor principal d'implementació multi-carril (80%) i `Claude Opus · Ultracode` reservat per a arquitectura fundacional i auditories extremes (20%); GPT Codex amb `GPT-6.1 Sol Ultra` per a cicles d'enginyeria de portes i `GPT Astra` per a l'auditoria adversarial final; i `Gemini CLI` per a higiene de portes i índexs. S'incorpora al Context Tècnic i al Protocol d'Interacció la Matriu d'Exclusivitat de Carrils (zero col·lisions d'escriptura entre agents concurrents) i el circuit canònic de rebuts (`obrir_torn.mjs` + `document.mjs` + `porta-plantilla-viva.mjs`), i es posa al dia la llista real de carpetes satèl·lit exteriors de `Som de Poble` (`_builds_de_poble/`, `_menjar_i_beure_de_poble/` i `_oficina_de_poble/`, retirant l'antic `_rebost_de_poble/`).
- **v3.10.0 (261023):** Protocol de Col·laboració Autònoma, Diàleg Creuat i Llibre Mestre Permanent a l'Escriptori (Ment Colmena Local a 2 o 3 bandes). S'institucionalitza que totes les IAs convocades (siguen dues com Claude i Gemini, o tres amb Codex) operen en estricta igualtat de condicions operatives amb accés natiu a disc. El flux de treball és asíncron i no bloquejant: no cal que s'esperen l'una a l'altra; cada IA avança de manera autònoma en el seu rol i diposita el seu informe a `04_escriptori/`. És obligatori consultar activament el Llibre Mestre Permanent (`04_escriptori/03_llibre_mestre_tasques_i_idees.md`) per a no perdre cap idea ni deute tècnic durant l'anàlisi, i llegir de manera continuada els informes de les companyes per auditar i contrastar mútuament les conclusions sota la Direcció Tècnica de la IAIA MarIA.
- **v3.9.0 (261018):** Directriu canònica d'Enginyeria Inversa i Reconstrucció amb REA (*Reverse Engineer Anything*). S'autoritza i encoratja formalment a totes les IAs (Claude, Codex, Gemini) a utilitzar les eines MCP de REA i la skill 'reverse-engineer-anything' quan es dispose d'un punt de comparació o aplicació de referència (com el patró WhatsApp, el TPV Loiverse, la Gestoria o el connector extern), per tal d'extreure lògica i fidelitat mil·limètrica sense inventar ni al·lucinar res.
- **v3.8.0 (261017):** Incorporació canònica de l'Ecosistema Físic i Distribució de Carpetes ('Som de Poble' com a contenidor mare vs 'socdepoble.org' com a nucli Git/Node). Es fixa l'obligació d'executar comandes de consola i proves a 'socdepoble.org/' i es blinda la prohibició absoluta d'inventar carpetes noves fora dels satèl·lits existents (_arxiu_wiki_de_poble, _gestoria_de_poble, etc.).
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

### 1. Context de Partida i Ordre del Mestre Javi Llinares

El Mestre Javi Llinares ha revisat els tres dictàmens de la Marató Nocturna:
1. `_wiki_de_poble/04_escriptori/261101_0409_auditoria_claude.md` (Claude Opus 5.5)
2. `_wiki_de_poble/04_escriptori/261101_0403_auditoria_codex_marato_nocturna.md` (GPT Codex 6.1 Sol)
3. `_wiki_de_poble/04_escriptori/261101_0407_auditoria_gemini_marato_nocturna.md` (Gemini 4 Argon High)

**Decisió del Mestre:** **NO enviem encara el correu de seguiment a NLnet Fediversity (`2026-08-1a6`).** Abans d'enviar-lo, volem implementar **TOT** el que Claude Opus 5.5 i GPT Codex han assenyalat com a incomplet o pendent en les **15 Dimensions de la Matriu Universal (`D01`–`D15`)** i al Llibre Mestre (`_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`) per pujar les qualificacions de `4.5–8.5/10` fins a un **`10/10` real, verificable i sense fum**.

Llegiu obligatòriament abans d'actuar el **Pla d'Implementació vinculat a aquest torn**:
- `_wiki_de_poble/04_escriptori/261101_1246_pla_implementacio_assalt_excel_lencia_10_10_les_15_dimensions_i_deute_llibre_mestre.md`

---

### 2. Decisions Tècniques Resoltes (`D-1` a `D-13` de `261101_0409_auditoria_claude.md` · Zero Botons d'Aprovació Humana)

Totes les preguntes obertes de Claude queden resoltes per la Direcció Tècnica perquè cap agent s'ature:
- **`D-1` (Correu NLnet Fediversity):** NO s'envia encara; quan s'hagen implementat totes les fites d'aquest torn (`T1`–`T10`), actualitzeu l'esborrany dins de l'informe final amb les mètriques reals assolides.
- **`D-2` (`design_guard.mjs` vs `sanitize.test.js`):** Calibreu `tooling/gates/design_guard.mjs` i corregiu els components de `src/` de manera que `node tooling/gates/design_guard.mjs --arrel=src` done **`0 errors i 0 avisos`** (reduït des dels 9 avisos actuals) i `src/utils/sanitize.test.js` continue 100% en verd.
- **`D-3` (Lectura pública a `exportaMunicipiOpenData.js`):** Autoritzat exposar lectura pública anònima de `noticies`, `agenda`, `memoria-cultural` i fitxes de memòria oral `okf-v0.2` públiques/revisades al port (`src/data/backendPort.js`), a l'adaptador Supabase i al segon adaptador local (`src/data/local/adaptadorLocal.js`).
- **`D-4` (Card tutorial a `/notes`):** Autoritzat fixar la Card explicativa de la mà amb la ploma sempre com a primera fila de la vista `Tot` mentre no estiga arxivada.
- **`D-5` (Etiquetes i àlies de poble a `FitxaMemoriaOral.jsx`):** Autoritzat afegir edició d'etiquetes (`tags`) i selector/cercador de municipi amb resolució d'àlies bilingües/populars (*Jijona* → `xixona`, *Torremanzanas* / *la Torre* → `la-torre-de-les-macanes`, *Ibi*, *Tibi*, *Castalla*, *Onil*, *Biar*, *Alcoi*, *Alacant*, *València*).
- **`D-6` (`pot_signar_com_organitzacio`):** Autoritzat restringir l'emissió d'alertes d'emergència al mateix `town_id` de l'organització.
- **`D-7` (Reserva anònima HMR a Mur, Notes i Xat):** Autoritzat usar `useIdentitatOpcional()` amb reserva anònima de només lectura per evitar pantalles d'error en recàrregues HMR.
- **`D-8` (Avatar de Javi Llinares):** Es manté `javi-llinares-256x256.jpg` (16 KB) per a llistes/bombolles del xat i la imatge gran per a la fitxa de perfil.
- **`D-9` (`eu.js` i `gl.js`):** Autoritzat completar les 24 claus de `TE-02` i polir basc i gallec.
- **`D-10` (*Sign in with Apple* a iOS):** Autoritzat ocultar el botó d'Apple quan el proveïdor OAuth d'Apple no estiga actiu (`VITE_APPLE_OAUTH_ACTIU !== 'true'`), evitant el rebuig per Guideline 2.1.
- **`D-11` (`wordpress-plugin` `v1.1.11`):** Autoritzat pujar el connector a **`v1.1.11`** (`soc-de-poble.php` i `readme.txt`).
- **`D-12` (Capçalera `/versions`):** Autoritzat actualitzar la capçalera de `/versions` a `src/sections/text/pageContent.js`.
- **`D-13` (`genera-federacio.mjs` i `inicia-node-germa.mjs`):** Autoritzat corregir el defecte perquè qualsevol node germà (via `node-germa.json` o `--config`) genere el seu propi actor ActivityPub, WebFinger, Outbox i NodeInfo 2.1.

---

### 3. Matriu d'Exclusivitat de Carrils (Zero Col·lisions i Zero Popups)

1. **Carril 1 · Claude Opus 5.5 (`Claude Opus · Ultracode` / `Claude Fable 5.1 Extra · Ultracode`) — Executora Principal al Repositori Viu (`socdepoble.org/`):**
   - Té l'exclusiva d'escriptura sobre `src/`, `public/`, `supabase/`, `tooling/`, `wordpress-plugin/` i `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`.
   - Integra els kits pre-assemblats per GPT Codex (`../_investigacio_ia_de_poble/261101_kits_10_10/codex/`) i per Gemini (`../_investigacio_ia_de_poble/261101_kits_10_10/gemini/`) a mesura que estiguen disponibles (sense bloquejar-se mai esperant-los), executa Vitest i les portes, i emet o actualitza el seu dictamen canònic a `_wiki_de_poble/04_escriptori/`.
2. **Carril 2 · GPT Codex (`GPT-6.1 Sol Ultra`) — IA de Suport d'Enginyeria de Dades, Federació i Conformitat:**
   - **Prohibit tocar el codi viu de `src/`, `public/`, `supabase/`, `tooling/` o `wordpress-plugin/`.**
   - Construeix el seu kit pre-assemblat a `../_investigacio_ia_de_poble/261101_kits_10_10/codex/` (`verifica_i_aplica.py` amb `--check` i `--apply`, pegats `.patch` i proves) per a **`D01` (segon adaptador complet + `AbortSignal` storage)**, **`D04`/`D10` (`importaMunicipiOpenData.js` round-trip amb SHA-256 i fitxes OKF v0.2)**, **`D05`/`D07` (`inboxActivityPub.js` amb HTTP Signatures + correcció `D-13` de `genera-federacio.mjs` / `inicia-node-germa.mjs` + outbox poblat)** i **`D08`/`D11` (E2EE/Shamir + restricció `town_id` d'alertes)**, i actualitza `_wiki_de_poble/04_escriptori/261101_0403_auditoria_codex_marato_nocturna.md`.
3. **Carril 3 · Gemini (`Gemini 4 Argon (High)`) — IA de Suport de Pedra Seca `0 avisos`, Accessibilitat AAA i i18n 5 Llengües:**
   - **REGLA ANTI-POPUPS OBLIGATÒRIA PER A GEMINI:** Està terminantment prohibit executar comandes bash amb heredocs (`<<'PY'`, `<<EOF`) o redireccions d'escriptura (`>`, `>>`, `tee`) que disparen el filtre `guarda-reflex` i demanen clic humà. Per crear o editar qualsevol fitxer `.py`, `.patch` o `.md`, usa **EXCLUSIVAMENT** les eines natives `write_file` i `edit_file`. Tampoc executes `xcodebuild` ni comandes natives de macOS.
   - **Prohibit tocar el codi viu de `src/`, `public/`, `supabase/`, `tooling/` o `wordpress-plugin/`.**
   - Construeix el seu kit pre-assemblat a `../_investigacio_ia_de_poble/261101_kits_10_10/gemini/` (`verifica_i_aplica.py` + pegats `.patch`) per a **`D02` (`design_guard.mjs` amb 0 avisos i fix `1024px`)**, **`D03` (accessibilitat AAA i lector de pantalla real en diàlegs i taules)**, **`D12` (les 24 claus de `TE-02` en `ca`/`es`/`en`/`eu`/`gl` + `TE-01` + `TE-05`)** i **`D13`/`D14` (ocultació condicional del botó d'Apple a iOS + `tractor-vigilant.mjs`)**, i actualitza `_wiki_de_poble/04_escriptori/261101_0407_auditoria_gemini_marato_nocturna.md`.

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 (`D01` · Segon Adaptador Complet i `AbortSignal` Real al Storage · `P1-27`):**
  - Crear `src/data/local/adaptadorLocal.js` implementant el 100% dels dominis i operacions de `CONTRACTE_BACKEND` (`src/data/backendPort.js`) sobre un magatzem determinista en memòria/IndexedDB i verificar que passa totes les proves de `executaKitConformitat` (`src/data/conformitat/kit.js`), demostrant amb dos adaptadors complets l'enxufabilitat del Model B.
  - Propagar `AbortSignal` real i límit de peticions concurrents en vol a `src/data/supabase/storage.js` (`upload`, `sign`, `remove`) amb reconciliació d'efectes tardans (`P1-27`).
- **T2 (`D04` & `D10` · Exportació Pública Completa + Restaurador Municipal `importaMunicipiOpenData.js` Round-Trip):**
  - Afegir lectura pública anònima de `noticies`, `agenda`, `memoria-cultural` i fitxes de memòria oral `okf-v0.2` públiques/revisades a `backendPort.js` i als adaptadors perquè `recullDadesPubliquesDelMunicipi` (`src/data/exportaMunicipiOpenData.js`) exporte totes les col·leccions amb dades reals.
  - Crear `src/data/importaMunicipiOpenData.js` capaç de llegir un paquet BagIt v1.0, verificar criptogràficament cada entrada de `manifest-sha256.txt` (rebutjant qualsevol fitxer alterat o path traversal), validar els esquemes i restaurar el municipi sencera i idempotentment sobre un adaptador del `backendPort`, amb test round-trip complet (`src/data/__tests__/importaMunicipiOpenData.test.js`).
- **T3 (`D05` & `D07` · ActivityPub Fase 2 `inboxActivityPub.js`, Outbox Poblat i Actor Propi per a Nodes Germans `D-13`):**
  - Crear `src/data/federacio/inboxActivityPub.js` amb resolució dinàmica de WebFinger (`resolveWebFingerAcct`), verificació de signatures HTTP (`verificaSignaturaHttpActivityPub` amb clau pública de l'actor) i processador idempotent d'activitats (`processaActivitatInbox`: `Follow` → genera `Accept`, `Create`, `Delete` i `Announce` d'alerta d'emergència municipal), amb tests a `src/data/federacio/__tests__/inboxActivityPub.test.js`.
  - Actualitzar `tooling/seo/genera-federacio.mjs` i `tooling/instalador/inicia-node-germa.mjs` per: (a) poblar `public/federacio/outbox/la-torre-de-les-macanes.json` amb activitats `Create` reals (`totalItems > 0`), i (b) corregir el defecte `D-13` perquè quan s'inicialitza un node germà (ex. Xixona amb `node-germa.json` o `--config`), es generen l'actor ActivityPub, el WebFinger, l'Outbox i el NodeInfo 2.1 propis d'eixe municipi.
- **T4 (`D15` & `D02` · Dieta de Bundle `< 250 KB` gzip amb `wikiManifest.js` Diferit + Pedra Seca `0 avisos`):**
  - Carregar `src/data/wikiManifest.js` (`578 KB`, `200 KB` gzip) de forma diferida (`import()` dinàmic) i ajustar `manualChunks` a `vite.config.js` perquè el bundle principal d'entrada baixe per sota de `< 250 KB` gzip (`P1-20`).
  - Resoldre els **9 avisos** restants de `node tooling/gates/design_guard.mjs --arrel=src` (`D-2`) sense trencar `src/utils/sanitize.test.js` i corregir el tall de paraules a `1024px` en la Columna 1 (`P1-28`).
- **T5 (`D03` & `D12` · Accessibilitat Rural AAA per a Lector de Pantalla + Tancament de `TE-01`, `TE-02` i `TE-05` en 5 Llengües):**
  - Completar les **24 claus `t()` absents** identificades per `TE-02` als 5 diccionaris (`src/locales/ca.js`, `es.js`, `en.js`, `eu.js`, `gl.js`), internacionalitzar les cadenes i dates hardcoded de `src/sections/profile/DetallPrivacitat.jsx` (`TE-01`) i passar l'idioma de l'atribut `lang` des de `src/natiu/entrada.jsx` i `wordpress-plugin/includes/marcatge.php` cap a `UIContext.jsx` (`TE-05`).
  - Completar `P1-15`, `P1-22` i `P2-16`: noms accessibles, regions `aria-live="polite"`, tancament amb `Escape` i retorn de focus en `ConnectarSection.jsx`, `GestioMembres.jsx`, `DialegEnquadrament.jsx`, `DetallPrivacitat.jsx` i wrapper amb `tabIndex={0}` i rol accessible a les taules de `src/utils/parseMarkdown.js`.
- **T6 (`D09` & `D10` · Etiquetes i Àlies de Poble a `FitxaMemoriaOral.jsx` `D-5`, Card Tutorial Fixa `D-4` i Blindatge HMR `D-7`):**
  - Permetre afegir/eliminar etiquetes (`tags`) i seleccionar municipi amb resolució d'àlies bilingües/populars (*Jijona* → `xixona`, *Torremanzanas* / *la Torre* → `la-torre-de-les-macanes`, etc.) a `src/sections/notes/FitxaMemoriaOral.jsx`.
  - Fixar la Card explicativa de la mà amb la ploma sempre al capdamunt de la llista en la vista `Tot` de `/notes` (`D-4`).
  - Estendre el blindatge HMR de `useIdentitatOpcional()` a Mur, Notes i Xat amb reserva anònima de només lectura (`D-7` / `P1-71`).
- **T7 (`D08` & `D11` · E2EE Opt-In Verificable + Custòdia Social Shamir $k=3$ UI + Alertes Municipals Estrictes i Captures `2048px`):**
  - Connectar el commutador d'E2EE opt-in verificable a la conversa del xat (`P1-12` a `src/sections/xat/XatContext.jsx` i `src/sections/xat/e2ee/sessioXat.js`) i la interfície de recuperació social Shamir $k=3$ a `src/sections/profile/DetallPrivacitat.jsx` (`IDEA-48`), més les proves de `P1-13` (`C11-03` i `C11-05`).
  - Restringir `pot_signar_com_organitzacio` al mateix `town_id` (`D-6`), afegir rellotge reactiu de caducitat a `src/sections/xat/components/AlertaMunicipal.jsx`, aplicar l'espaiat interior (`padding`) harmònic a la llista de converses (`P1-67`) i pujar el límit de píxels de captures en `src/sections/xat/adjuntLocal.js` a `2048px` (`IDEA-36`).
- **T8 (`D06`, `D13` & `D14` · WordPress `v1.1.11`, Protecció Botó Apple iOS `D-10`, `tractor-vigilant.mjs` i Telemetria Verificada `P2-14`):**
  - Pujar `wordpress-plugin/soc-de-poble.php` i `wordpress-plugin/readme.txt` a **`v1.1.11`** i suportar mini-Markdown bàsic dins del detall `<details>` de `wordpress-plugin/includes/renderitzador.php`.
  - Ocultar el botó *Sign in with Apple* a `src/sections/register/RegisterSection.jsx` (i pantalla de login) quan `VITE_APPLE_OAUTH_ACTIU !== 'true'` (`D-10` / `BOT-A3`), alinear l'edat mínima a `16+` anys i aplicar els pegats de `src/config/versio.js` i `tooling/botigues/preflight-botigues.mjs` (`P0-23`).
  - Implementar `tooling/gates/tractor-vigilant.mjs` executable (`IDEA-13`), afegir estat additiu de recepció HTTP verificada a `src/config/telemetria.js` (`P2-14`) i actualitzar la capçalera de `/versions` (`D-12`).
- **T9 (Kits de Suport de GPT Codex i Gemini a `../_investigacio_ia_de_poble/261101_kits_10_10/`):**
  - Codex i Gemini generen els seus respectius kits amb `verifica_i_aplica.py` (`--check` i `--apply`), pegats `.patch` i `README_INTEGRACIO.md`, i executen un cicle d'auditoria (màxim 3 iteracions) fins que la Matriu Universal (`D01`–`D15`) assolisca el `10/10` verificat i totes les tasques automàtiques/crons queden cancel·lades.
- **T10 (Actualització del Llibre Mestre, Esborrany NLnet Fediversity i Dictamen Final):**
  - Actualitzar l'estat de les tasques completades a `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`, incloure a l'informe final l'esborrany bilingüe actualitzat per a NLnet Fediversity (`2026-08-1a6`) amb totes aquestes fites ja en verd, i verificar totes les portes.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:**
  1. `node tooling/gates/design_guard.mjs --arrel=src` → **0 errors i 0 avisos**.
  2. `npm run build` → Bundle d'entrada principal **`< 250 KB` gzip** amb `wikiManifest.js` carregat en chunk diferit.
  3. `npx vitest run` → **0 fallades** en tota la suite (incloent les noves proves de `adaptadorLocal`, `importaMunicipiOpenData`, `inboxActivityPub`, `genera-federacio` per a node germà, `FitxaMemoriaOral`, `TE-01`/`TE-02`/`TE-05` i `tractor-vigilant`).
  4. `node tooling/gates/tractor-vigilant.mjs` → `exit 0` amb informe JSON vàlid.
  5. `node tooling/gates/porta-olivera.mjs`, `node tooling/gates/verificador-scc.mjs` i `node tooling/gates/porta-documents.mjs --all` → `exit 0`.
  6. Taula de les **15 Dimensions (`D01`–`D15`)** reavaluada amb evidència real de codi i tests en els tres informes (`Claude`, `Codex`, `Gemini`).

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Col·lisió entre agents concurrents:** Evitada mitjançant l'exclusivitat d'escriptura de Claude sobre el repositori viu i l'aïllament dels kits de Codex i Gemini a `../_investigacio_ia_de_poble/261101_kits_10_10/`.
- **Bloqueig per popups de permisos a Gemini:** Evitat prohibint a Gemini l'ús d'heredocs (`<<'PY'`) i redireccions bash, exigint l'ús exclusiu de `write_file` i `edit_file`.
- **Trencament de `sanitize.test.js` en netejar `design_guard.mjs`:** Evitat calibrant la regla de `design_guard.mjs` per a wrappers semàntics legítims i verificant `npx vitest run src/utils/sanitize.test.js` a cada pas.

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

Tota línia de codi ha de complir el principi d'independència i modularitat.

### Tècniques d'I+D, Investigació i Autòpsia (Obligatori)
No et conformes amb investigar el que diuen les skills teòriques i la doctrina (Wiki/AGENTS). Cada script, hook o tractor que estiga implicat en l'execució d'eixa teoria ha de ser llegit i verificat a fons (a nivell de codi `.mjs`, `.py`, etc.). Assegura't que el codi complix efectivament el disseny, no té exclusions cegues i no produeix bloquejos mecànics per inèrcia.
**Mentalitat I+D:** No et limites a obeir i picar codi (Desenvolupament). Exerceix sempre com a investigador de tendències (Investigació). Abans d'implementar res, analitza l'estat de l'art i planteja com aprofitar les últimes solucions del mercat i tecnologies innovadores per resoldre el problema demanat. Mantenir-nos a l'avantguarda és la teva responsabilitat.

### Automillora Proactiva (Obligatori)
Quan acabeu de redactar el vostre informe, hi heu d'afegir un punt final titulat "Proposta d'Automillora". Heu de complir dos requisits:
1. **Anàlisi del Prompt:** És el vostre deure analitzar críticament aquest mateix prompt a la recerca de contradiccions, duplicitats o instruccions ambigües. Heu de dir-me clarament: *"Si m'hagueres demanat això d'aquesta altra forma, hauria sigut més eficient"*.
2. **Avaluació de Noves Funcionalitats (Evolució del Model):** Sabem que us actualitzeu periòdicament amb noves capacitats tècniques. Heu d'indicar explícitament si teniu alguna nova opció o flux de treball que ens permeta avançar millor o de forma més veloç com a equip. L'objectiu és esprémer el vostre potencial per a funcionar com un autèntic nucli de 3 agents (MarIA com a Directora + vosaltres com a executors tècnics). Si veieu maneres de fer-ho millor, exigiu-les.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261101_1246_pla_implementacio_assalt_excel_lencia_10_10_les_15_dimensions_i_deute_llibre_mestre]]
- [[261101_0409_auditoria_claude]]
- [[261101_0403_auditoria_codex_marato_nocturna]]
- [[261101_0407_auditoria_gemini_marato_nocturna]]
