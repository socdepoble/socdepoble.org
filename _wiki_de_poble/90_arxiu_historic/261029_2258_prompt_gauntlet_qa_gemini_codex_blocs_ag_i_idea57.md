---
type: prompt
status: actiu
description: 'Prompt operatiu de segona ronda de QA amb Gauntlet Loop (4 cicles) per a Gemini CLI i GPT Codex sobre els Blocs A-G construïts per Claude Opus 5.5 i la Matriu D01..D15.'
tags:
  - govern
visibility: private
reflex: sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:e7d86cf6-9e41-4c55-9a28-9256b7eeff2b
---
# Prompt Gauntlet QA Ronda 2 per a Gemini CLI i GPT Codex: Blocs A-G, Deutes IDEA-57 i Matriu 15 Dimensions (10/10)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `_wiki_de_poble/04_escriptori/00_index_escriptori.md` conté tots els documents actius de la sessió.
- [x] **Llibre Mestre consultat i referenciat**: `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu amb `IDEA-57` (Matriu Universal de les 15 Dimensions `D01..D15` i Zero Deute Tècnic `10,0 / 10`), `IDEA-54` + `IDEA-55` + `P1-71` (Gestor d'Arxius Locals en `UniversalWorkspace` de 3 columnes a `/multimedia`), `IDEA-53` (Negreta d'1 toc al Xat), `D-09` + `D-C2 PWA` (Oblit E2EE + LRU de `blob:` + icones PWA AAA), `P1-70` + `IDEA-56` (4 Actors Permanents de `/xat` + Cervell Local Zero-Tokens de la `IAIA MarIA`) i deutes `P1-16`, `P1-22`, `P1-24`, `P1-26`, `P1-27`.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**:
  1. **Claude Code (`Claude Opus 5.5 · Ultracode`, torn actiu `torn_438fe070-961a-4576-bb08-f597a4daf763`, `scope: code`)**: Propietari exclusiu d'escriptura sobre `src/`, `tests/`, `tooling/`, `bot/` i `public/`. Ja ha construït i integrat els Blocs A, B, C, D, E, F, G i els deutes d'`IDEA-57` (`25.195` proves en verd, `0` errors de consola) i està executant el seu propi *Gauntlet Loop* multi-cicle.
  2. **Gemini CLI (`Gemini 4 Argon (High)`, torn documental `torn_7440474f-5096-456d-b1aa-b1f97b21c348`, `scope: documents`)**: Execució d'un **Gauntlet Loop QA de 4 Cicles** sobre els Blocs A–G i els deutes d'`IDEA-57`, amb especial focus en accessibilitat WCAG AAA (`design_guard.mjs`), arquitectura `<UniversalWorkspace>` de 3 columnes (`MultimediaSection.jsx`), enquadrament d'avatars (`Avatar.jsx`), estabilitat HMR (`CoreContentContext.jsx`, `objectesDeContext.js`), portes de cens (`tractor-cens.mjs`), frontera de Gestoria (`privacitat.test.js`), i18n en 5 idiomes i puntuació completa de la **Matriu Universal de les 15 Dimensions (`D01..D15`)**. Carril d'escriptura: `_wiki_de_poble/04_escriptori/261029_1858_auditoria_gemini.md` (o nou informe `261029_HHMM_auditoria_gemini.md`) i `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`.
  3. **GPT Codex (`GPT-6.1 Sol Ultra` / `Astra`, torn documental `torn_a1fd0148-ebd5-4317-91a9-733ba1511a91`, `scope: documents`)**: Execució d'un **Gauntlet Loop QA de 4 Cicles** sobre els Blocs A–G i els deutes d'`IDEA-57`, verificant el tancament de les llavors de Ronda 1 (`QA-A01..A05`, `QA-B01..B03`, `QA-C01..C02`), l'arrencada i seguretat del bot (`bot/arrels.mjs`, `bot/cervell.mjs`, `tests/bot-arrencada.test.mjs`), l'`AbortSignal` de Supabase Storage (`src/data/supabase/storage.js`), els 4 Actors Permanents (`actorsDelXat.js`), el Cervell Local BM25 (`iaiaLocal.js`) i la puntuació completa de la **Matriu Universal de les 15 Dimensions (`D01..D15`)**. Carril d'escriptura: `_wiki_de_poble/04_escriptori/261029_1859_auditoria_codex.md` (o nou informe `261029_HHMM_auditoria_codex.md`), pegats `.patch` proposats a `_wiki_de_poble/04_escriptori/` i `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`.
- [x] **Pla d'Implementació** generat i vinculat al torn (`_wiki_de_poble/04_escriptori/261029_1605_pla_implementacio_album_multimedia_local_negreta_xat_i_deute_e2ee_pwa.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Verificat amb la plantilla `prompt_local.md (v3.11.0)` conservant íntegres tots els spans de codi dels blocs normatius i complint `IDEA-47` (vocabulari defensiu de verificació de qualitat i conformitat).
- [x] **Sentinella de Seguretat (core-seguretat-audit)**: Verificat el Checklist §5 (`E2EE_ACTIU_PER_DEFECTE = false`, frontera privada de Gestoria i d'amfitrió intactes, i frontera pública del bot verificada).
- [x] **Enginyeria Inversa i Paritat amb REA**: Autoritzat l'ús de REA (`reverse-engineer-anything`).
- [x] **Cron de vigilància**: Sense crons zombis; treball en fil principal seqüencial.
- [x] **Rebut obtingut** per a l'arxiu generat (`sdp:torn_3e23ae6f-f097-4ce7-8533-52978e133348:23f1a2a0-3450-40a2-b6e5-e4be3c3dd49c`).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:e7d86cf6-9e41-4c55-9a28-9256b7eeff2b |
| Versió del document | 3.11.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-29T21:58:54.691Z |
| Modificació | 2026-10-29T22:00:00.000Z |
| Propietari | iaia-maria |
| Aprovació humana | aprovada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | ~32.000 tokens |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- `2026-10-29T21:58:54.691Z`: Esborrany creat amb rebut canònic `sdp:torn_3e23ae6f-f097-4ce7-8533-52978e133348:23f1a2a0-3450-40a2-b6e5-e4be3c3dd49c`.
- `2026-10-29T22:00:00.000Z`: Completat per ordre del Mestre Javi Llinares perquè **Gemini CLI** i **GPT Codex** executen la **Ronda 2 d'Auditoria QA amb Gauntlet Loop (4 Cicles Iteratius de Verificació Profunda)** sobre l'arbre complet (`Blocs A, B, C, D, E, F, G + Deutes IDEA-57`) construït per **Claude Opus 5.5 · Ultracode**, fins que les 3 guies convergixen en el **`10,0 / 10` unànime** de la Matriu de les 15 Dimensions (`D01..D15`).
- `2026-10-30T21:31:55.000Z`: rebut renovat per Claude Code (Claude Opus 5.5, torn_f298d1e0-3122-47a0-b815-bf2f719c5be3) per ordre del Mestre (prompt 261030_2208, T4.4), perquè el torn del rebut anterior (`sdp:torn_3e23ae6f-f097-4ce7-8533-52978e133348:23f1a2a0-3450-40a2-b6e5-e4be3c3dd49c`) havia caducat sense tancar-se; el contingut no canvia.

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

Estem en la **Ronda 2 de Convergència (Gauntlet Loop Multi-Cicle)** de l'Onada `261029_1605 / 261029_2258`. **Claude Opus 5.5 · Ultracode** ja ha completat i integrat els **Blocs A, B, C, D, E, F i G**, ha corregit les llavors de la Ronda 1 (`QA-A01..A05`, `QA-B01..B03`, `QA-C01..C02`, `OBS-F1`, `OBS-F2`, `OBS-G1`), ha resolt els deutes de codi d'`IDEA-57` (`P1-24 bot/`, `P1-26`, `P1-27`) i està executant el seu propi *Gauntlet Loop* de 3 a 4 cicles.

El Mestre Javi Llinares demana que **Gemini CLI** i **GPT Codex** executeu ara en paral·lel un **Gauntlet Loop QA de 4 Cicles Iteratius** sobre tot el sistema per acompanyar i contrastar el treball de Claude fins que **les 3 guies estigueu d'acord que el sistema és immillorable (`10,0 / 10` i zero deute tècnic)**.

> **⚠️ REGLA D'OR D'EXCLUSIVITAT DE CARRILS (ZERO COL·LISIÓ AMB CLAUDE OPUS 5.5):**
> - **Claude Opus 5.5 (`torn_438fe070-961a-4576-bb08-f597a4daf763`, `scope: code`)** manté la propietat d'escriptura de `src/`, `tests/`, `tooling/`, `bot/` i `public/`.
> - **Gemini CLI** pot reutilitzar el seu torn documental ja obert `torn_7440474f-5096-456d-b1aa-b1f97b21c348` (actualitzant `_wiki_de_poble/04_escriptori/261029_1858_auditoria_gemini.md`) o obrir-ne un amb `--scope=documents`.
> - **GPT Codex** pot reutilitzar el seu torn documental ja obert `torn_a1fd0148-ebd5-4317-91a9-733ba1511a91` (actualitzant `_wiki_de_poble/04_escriptori/261029_1859_auditoria_codex.md`) o obrir-ne un amb `--scope=documents`.
> - **PROHIBIT** editar fitxers de `src/`, `tests/`, `tooling/`, `bot/` o `public/` ni executar comandes destructives de Git (`git checkout`, `git restore`, `git reset`, `git clean`, `git stash`). Tota proposta de canvi al codi es documenta amb fitxer, línia i bloc de reemplaçament exacte dins de l'informe i al Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`).

1. Llegiu abans d'iniciar el Cicle 1:
   - `_wiki_de_poble/04_escriptori/261029_1723_auditoria_claude.md` (estat actual de Claude Opus 5.5)
   - `_wiki_de_poble/04_escriptori/261029_1858_auditoria_gemini.md` i `_wiki_de_poble/04_escriptori/261029_1859_auditoria_codex.md` (troballes de Ronda 1)
   - `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` (`IDEA-57` i la Matriu Universal de les 15 Dimensions `D01..D15`)

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### PROTOCOL DEL GAUNTLET LOOP QA (4 CICLES ITERATIUS D'INSPECCIÓ PROFUNDA)

Executeu i documenteu explícitament al vostre informe els **4 Cicles del Gauntlet Loop**:

#### Cicle 1 · Verificació Empírica de les Llavors de Ronda 1 (`QA-A01..A05`, `QA-B01..B03`, `QA-C01..C02`, `OBS-F1..G1`)
Comproveu una per una en el codi actual i en les seues noves proves que les 10 llavors de la Ronda 1 han quedat resoltes sense serrells:
1. **`QA-A01a` i `QA-A01b` (Oblit des d'amfitrió i neteja de detall/URLs en tancar sessió):** Reviseu `src/data/expulsioAmfitrio.js`, `src/host.js`, `src/app/contexts/SessionContext.jsx`, `src/sections/multimedia/useGestorArxiusLocals.js` i les proves `tests/host.expulsio.test.js`, `src/app/contexts/SessionContext.expulsio.seguretat.test.jsx` i `src/sections/multimedia/useGestorArxiusLocals.eixida.seguretat.test.jsx`.
2. **`QA-A02` (Moviment i reanomenat d'arxius grans per flux):** Reviseu `mouArxiuLocal` i `reanomenaArxiuLocal` a `src/sections/multimedia/motorMultimediaLocal.js` per confirmar que copien per *chunks* i verifiquen l'empremta sense carregar tot el fitxer en un sol `ArrayBuffer`.
3. **`QA-A03` (Protecció contra desat concurrent de text):** Reviseu `desaTextArxiuLocal` a `src/sections/multimedia/motorMultimediaLocal.js` i `src/sections/multimedia/EditorTextLocal.jsx` (verificació de `lastModified` / mida de l'arxiu base abans d'escriure per evitar xafar edicions externes).
4. **`QA-A04` (Sincronització d'URL i detall en eliminar l'arxiu actiu):** Reviseu `src/sections/multimedia/GestorMultimediaLocal.jsx` i `src/sections/multimedia/MultimediaSection.jsx`.
5. **`QA-A05` (Alliberament determinista d'`ImageBitmap`):** Reviseu `src/sections/multimedia/LaboratoriWebpLocal.jsx` (`bitmap.close()` dins d'un bloc `try / finally`).
6. **`QA-B01`, `QA-B02`, `QA-B03` (Negreta al Xat, URLs amb `*` i escapes `\*`):** Reviseu `src/sections/xat/negreta.js`, `src/sections/xat/components/Bombolla.jsx`, `src/sections/xat/cercaXat.js` i `src/sections/xat/conversa.js`.
7. **`QA-C01` i `QA-C02` (Retenció activa de `blob:` davant LRU i bloqueig d'IndexedDB per pestanya germana):** Reviseu `src/sections/xat/components/AdjuntXat.jsx`, `src/sections/xat/components/AdjuntXat.retencio.test.jsx`, `src/data/xatMultimediaXifrat.js`, `src/data/xifratXatEixida.js` i `src/data/xifratXatEixida.bloquejat.seguretat.test.js`.

---

#### Cicle 2 · Auditoria Profunda dels Nous Blocs E, F, G i Deutes d'`IDEA-57`
Inspeccioneu línia per línia tota la construcció nova de la segona meitat de l'onada:
1. **Bloc E (`IDEA-55` + `P1-71` · `<UniversalWorkspace>` de 3 columnes a `/multimedia`):**
   - Fitxers: `src/sections/multimedia/MultimediaSection.jsx`, `src/sections/multimedia/PaginesEspaiMultimedia.jsx`, `src/sections/multimedia/arbreMultimedia.js`, `src/sections/multimedia/textosEspaiMultimedia.js`, `src/sections/multimedia/MultimediaSection.espai.test.jsx`.
   - Comproveu: paritat amb `/disseny` i `/wikidepoble`, panells laterals col·lapsats per defecte a `1440px`, 3 columnes coherents, suport en 5 idiomes i absència de rutes del Finder a la URL.
2. **Bloc F (`P1-70` + `IDEA-56` · 4 Actors Permanents de `/xat` + Cervell Local BM25 de la `IAIA MarIA`):**
   - Fitxers dels 4 actors: `src/sections/xat/actorsDelXat.js`, `src/sections/xat/pobleAmfitrio.js`, `src/sections/xat/useObriXatPerDefecte.js`, `src/components/PedraSeca/atoms/Avatar.jsx`, `src/components/PedraSeca/atoms/enquadramentsAvatar.js`, `src/sections/xat/XatSection.actorsPermanents.test.jsx`, `src/components/PedraSeca/atoms/Avatar.enquadrament.test.jsx`.
   - Comproveu: presència garantida dels 4 actors (`Sóc de Poble`, `Gent de la Torre`, `Javi Llinares`, `IAIA MarIA`) en visitant, sessió iniciada, quan l'usuari és Javi i en remot buit; prevenció de suplantació per slug en remot; foto real de `Gent de la Torre` (zero inicials `GD`) i avatar `1:1` perfecte.
   - Fitxers del Cervell Local: `src/data/iaiaLocal.js`, `src/data/iaiaLocal.atles.test.js`, `src/data/iaiaLocal.consulta.test.js`, `src/sections/xat/components/Conversa.iaiaLocal.test.jsx`, `src/sections/xat/components/FakeChatOnboarding.iaiaLocal.test.jsx`.
   - Comproveu: indexació de `PAGE_COPY`, `MOCK_TOWNS` i Atles Operatiu del Sistema, resposta determinista `< 50 ms` i zero crides de xarxa.
3. **Bloc G (`P1-71` HMR + `IDEA-50` + Deutes d'`IDEA-57`):**
   - **HMR i Fast Refresh:** `src/app/contexts/CoreContentContext.jsx`, `src/app/contexts/IdentitatContext.jsx`, els nous fitxers `objectesDeContext.js` i `tooling/vite/hmr-bfcache.mjs` + `src/app/contexts/CoreContentContext.senseIdentitat.test.jsx`.
   - **Pastilla `/versions` (`IDEA-50`):** `src/sections/consola/ConsolaSection.jsx`, `src/sections/consola/EmpaquetatsConsola.jsx` i `src/sections/consola/ConsolaSection.empaquetats.test.jsx`.
   - **Deute `P1-24` (`bot/`):** `bot/arrels.mjs`, `bot/cervell.mjs`, `tests/bot-arrencada.test.mjs` (índex hidratat, rutes Wiki sense duplicació, filtre de frontera pública `visibility !== 'private'` a cada lectura i historial de conversa acotat).
   - **Deute `P1-26` i `P1-27`:** `src/app/App.appsLocals.test.jsx` (hermeticitat d'estat entre proves) i `src/data/supabase/storage.js` + `src/data/supabase/storage.termini.test.js` (`AbortSignal` real propagat a les 5 operacions de Storage).
   - **`IDEA-58` (Navegació Universal amb les Fletxes del Teclat `↑ ↓ ← →` i `Home/End` a `UniversalWorkspace.jsx`, `PaginesEspaiMultimedia.jsx` i `GraellaAlbumLocal.jsx` — `D08` WCAG 2.2 AAA `2.1.1`):** Comproveu que en les 3 columnes de l'espai de treball i en les graelles d'imatges/arxius es pot navegar amb `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Home` i `End` com al Finder de macOS.
   - **`IDEA-31` (Activació del Traductor Sobirà Sense Google Translate ni Clau de DeepL — `C0545-S1` + `C0545-S2` + `/__iaia/traduir`):** Comproveu que `wordpress-plugin/includes/traduccio.php` incorpora el proveïdor lliure sense clau (Apertium / endpoint lliure) quan `DEEPL_API_KEY` no està definida, que el botó **«Traduir»** de la Barra Blava funciona en viu a `http://localhost:3340` (`/__iaia/traduir`) i que `src/sections/translations/TranslationsSection.jsx` reflecteix l'estat actiu del Traductor Sobirà de pàgines.

---

#### Cicle 3 · Bateria Empírica de Casos Límit, Suites i Portes (en Mode Lectura)
Executeu des de `socdepoble.org` i registreu l'eixida exacta al vostre informe:
1. **Suites de proves completes dels blocs i deutes:**
   - `npx vitest run src/sections/multimedia/ src/sections/xat/ src/sections/consola/ConsolaSection.empaquetats.test.jsx src/app/contexts/CoreContentContext.senseIdentitat.test.jsx src/app/contexts/SessionContext.carpetesLocals.seguretat.test.jsx src/app/contexts/SessionContext.expulsio.seguretat.test.jsx src/app/contexts/SessionContext.oblitXat.seguretat.test.jsx src/app/App.appsLocals.test.jsx src/components/PedraSeca/atoms/Avatar.enquadrament.test.jsx src/data/iaiaLocal* src/data/xifratXat* src/data/xatMultimediaXifrat* src/data/supabase/storage.termini.test.js src/sections/gestoria/privacitat.test.js src/natiu/projecteIos.test.js tests/host.expulsio.test.js tests/host.xifrat.test.js`
   - `node --test tests/bot-arrencada.test.mjs`
2. **Portes d'Arquitectura, Disseny i Linter:**
   - `npx eslint src tooling scripts tests bot --max-warnings=0`
   - `node tooling/gates/design_guard.mjs --arrel=src`
   - `node tooling/gates/tractor-cens.mjs`
   - `node tooling/wiki/compile-wiki-to-app.mjs --check --strict`

---

#### Cicle 4 · Arbitratge de Convergència i Matriu Universal de les 15 Dimensions (`D01..D15`)
Construïu al vostre informe la taula completa de les **15 Dimensions (`D01..D15`) de TOT el Sistema Sóc de Poble (`/10`)** definida a `IDEA-57` del Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`):
- Per a cada dimensió (`D01` Arquitectura Pedra Seca, `D02` Sistema de Disseny i WCAG AAA, `D03` Xat i E2EE, `D04` Multimèdia i Gestor d'Arxius Locals, `D05` Gestoria Autònoma, `D06` El Mercat i TPV, `D07` El Mur i Mapa Fotogràfic, `D08` Pobles i Comunitat, `D09` Wiki de Poble i Índexs, `D10` IAIA MarIA i Bot Telegram, `D11` Consola i Observabilitat, `D12` PWA, iOS/Android i WordPress `1.1.10`, `D13` Rendiment i Memòria, `D14` Seguretat, RLS i Privacitat, `D15` Portes Immunitàries i Cobertura de Proves):
  1. **Nota (`/10`)** amb 2 decimals.
  2. **Evidència empírica verificada** (fitxers, proves i portes).
  3. **Què impedeix el `10,0 / 10` (si `< 10,0`)** o confirmació de **`0 deutes pendents`**.
  4. **Acció exacta realitzada o requerida (`QA-R2-xx`)** perquè Claude Opus 5.5 o el Mestre la tanquen a l'acte si quedara cap detall pendent.

---

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340/multimedia`, `http://localhost:3340/xat` i `http://localhost:3340/versions`.
- **Criteris d'Acceptació:**
  1. Els 4 Cicles del Gauntlet Loop documentats amb evidència empírica.
  2. La **Matriu Universal de les 15 Dimensions (`D01..D15`)** completada al 100%.
  3. Informe validat amb `node tooling/wiki/document.mjs check` i `node tooling/gates/porta-plantilla-viva.mjs --escriptori --complet`, i Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`) actualitzat.
  4. Zero modificacions directes sobre `src/`, `tests/`, `tooling/`, `bot/` o `public/`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Col·lisió d'escriptura amb el torn de codi de Claude Opus 5.5:** Mitigat al 100% operant amb `--scope=documents` i mantenint el codi en mode de només lectura.
- **Sincronia amb el Gauntlet de Claude Opus 5.5:** Si durant el Cicle 1 o 2 observeu que Claude acaba d'actualitzar un fitxer (com `EditorTextLocal.jsx` per a `QA-A03`), re-llegiu el fitxer abans d'emetre el veredicte del Cicle 4.

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
- [[03_llibre_mestre_tasques_i_idees]]
- [[261029_1605_pla_implementacio_album_multimedia_local_negreta_xat_i_deute_e2ee_pwa]]
- [[261029_1605_prompt_opus_album_multimedia_local_negreta_xat_i_deute_e2ee_pwa]]
- [[261029_1723_auditoria_claude]]
- [[261029_1852_prompt_qa_gemini_codex_blocs_abcd_i_efg]]
- [[261029_1858_auditoria_gemini]]
- [[261029_1859_auditoria_codex]]
