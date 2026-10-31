---
type: prompt
status: actiu
description: 'Prompt operatiu de revisió de qualitat i conformitat (QA) per a Gemini CLI i GPT Codex: auditoria dels Blocs A, B, C i D ja construïts per Claude Opus 5.5 i verificació de contractes per als Blocs E, F i G.'
tags:
  - govern
visibility: private
reflex: sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:5b35a28b-ba84-4231-8c70-7f80a5979309
---
# Prompt Operatiu 261029_1852 · Revisió de Qualitat i Conformitat (QA) per a Gemini CLI i GPT Codex · Blocs A, B, C, D i Contractes E, F, G

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `_wiki_de_poble/04_escriptori/00_index_escriptori.md` conté tots els documents actius de la sessió.
- [x] **Llibre Mestre consultat i referenciat**: `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu amb les prioritats `IDEA-54` + `IDEA-55` + `P1-71` (Gestor d'Arxius Locals en `UniversalWorkspace` de 3 columnes a `/multimedia`), `IDEA-53` (Negreta d'1 toc al Xat), `D-09` + `D-C2 PWA` (Oblit E2EE + LRU de `blob:` + icones PWA AAA) i `P1-70` + `IDEA-56` (4 Actors Permanents de `/xat` + Cervell Local Zero-Tokens de la `IAIA MarIA`).
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**:
  1. **Claude Code (`Claude Opus 5.5 · Ultracode`, torn actiu `torn_438fe070-961a-4576-bb08-f597a4daf763`)**: Propietari exclusiu d'escriptura sobre `src/`, `tests/`, `tooling/` i `public/`. Ja ha construït i passat en verd els carrils dels Blocs A, B, C i D i està integrant i construint els Blocs E, F i G.
  2. **Gemini CLI (`Gemini 4 Argon (High)` / `Gemini 3.1 Pro`)**: Revisió de qualitat i conformitat (QA) de portes, accessibilitat WCAG AAA (`design_guard.mjs`), cens d'arquitectura (`tractor-cens.mjs`), frontera de privacitat de la Gestoria (`src/sections/gestoria/privacitat.test.js`), i18n quatrilingüe i integració amb `<UniversalWorkspace>`. Carril exclusiu d'escriptura: `_wiki_de_poble/04_escriptori/261029_HHMM_auditoria_gemini.md` i actualització d'entrades al Llibre Mestre.
  3. **GPT Codex (`GPT-6.1 Sol Ultra` / `Astra`)**: Revisió de qualitat i conformitat de contractes (QA), sanejament d'entrades, operacions físiques del File System Access API (`mou`, `reanomena`, `creaCarpeta`, `elimina`), pressupost LRU de `blob:` i oblit E2EE (`D-09`), tokenitzador de negreta (`Bombolla.jsx` / `negreta.js`) i contractes dels 4 Actors Permanents + Cervell Local BM25 (`iaiaLocal.js`). Carril exclusiu d'escriptura: `_wiki_de_poble/04_escriptori/261029_HHMM_auditoria_codex.md`, pegats `.patch` proposats a `_wiki_de_poble/04_escriptori/` (si calguera suggerir un ajust puntual a Claude) i actualització del Llibre Mestre.
- [x] **Pla d'Implementació** generat i vinculat al torn (`_wiki_de_poble/04_escriptori/261029_1605_pla_implementacio_album_multimedia_local_negreta_xat_i_deute_e2ee_pwa.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Verificat amb la plantilla `prompt_local.md (v3.11.0)` conservant íntegres tots els spans de codi dels blocs normatius i complint `IDEA-47` (compatibilitat total amb els controls de seguretat `Daybreak` d'OpenAI).
- [x] **Sentinella de Seguretat (core-seguretat-audit)**: Verificat el Checklist §5 (`E2EE_ACTIU_PER_DEFECTE = false`, frontera privada de Gestoria intacta a `src/sections/gestoria/privacitat.test.js` i purga de claus).
- [x] **Enginyeria Inversa i Paritat amb REA**: Autoritzat l'ús de REA (`reverse-engineer-anything`).
- [x] **Cron de vigilància**: Sense crons zombis; treball en fil principal seqüencial.
- [x] **Rebut obtingut** per a l'arxiu generat (`sdp:torn_3e23ae6f-f097-4ce7-8533-52978e133348:545a7fc7-0108-4186-bc7c-1f1512b19c7a`).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f298d1e0-3122-47a0-b815-bf2f719c5be3:5b35a28b-ba84-4231-8c70-7f80a5979309 |
| Versió del document | 3.11.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-29T17:52:56.000Z |
| Modificació | 2026-10-29T17:55:00.000Z |
| Propietari | iaia-maria |
| Aprovació humana | aprovada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Argon (High) |
| Tokens consumits | ~26.000 tokens |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- `2026-10-29T17:52:56.000Z`: Esborrany creat amb rebut canònic `sdp:torn_3e23ae6f-f097-4ce7-8533-52978e133348:545a7fc7-0108-4186-bc7c-1f1512b19c7a` i vinculat al pla `261029_1605_pla_implementacio_album_multimedia_local_negreta_xat_i_deute_e2ee_pwa.md`.
- `2026-10-29T17:55:00.000Z`: Completat seguint `prompt_local.md (v3.11.0)` i `IDEA-47` perquè Gemini CLI i GPT Codex executen la Revisió de Qualitat i Conformitat (QA) en paral·lel i sense col·lisió sobre els Blocs A, B, C i D ja escrits a disc per Claude Opus 5.5 i verifiquen l'arquitectura dels Blocs E, F i G.
- `2026-10-30T21:31:55.000Z`: rebut renovat per Claude Code (Claude Opus 5.5, torn_f298d1e0-3122-47a0-b815-bf2f719c5be3) per ordre del Mestre (prompt 261030_2208, T4.4), perquè el torn del rebut anterior (`sdp:torn_3e23ae6f-f097-4ce7-8533-52978e133348:545a7fc7-0108-4186-bc7c-1f1512b19c7a`) havia caducat sense tancar-se; el contingut no canvia.

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

Estem en l'**Onada `261029_1605 / 261029_1852`**. Aquest prompt s'adreça a **Gemini CLI** i a **GPT Codex** per executar una **Revisió de Qualitat i Conformitat (QA)** profunda i independent sobre el treball que **Claude Opus 5.5 · Ultracode** ja ha escrit a disc (Blocs A, B, C i D) i sobre l'arquitectura dels Blocs E, F i G.

> **⚠️ REGLA D'OR D'EXCLUSIVITAT DE CARRILS (ZERO COL·LISIÓ AMB CLAUDE OPUS 5.5):**
> - **Claude Opus 5.5 (`torn_438fe070-961a-4576-bb08-f597a4daf763`, `scope: code`)** està actiu i construint sobre `src/`, `tests/`, `tooling/` i `public/`.
> - Per tant, **Gemini CLI i GPT Codex han d'obrir el seu torn amb `--scope=documents`** i operar en **MODE NOMÉS LECTURA estricte sobre `src/`, `tests/`, `tooling/` i `public/`**:
>   - **PROHIBIT** editar fitxers de `src/`, `tests/`, `tooling/` o `public/` directament.
>   - **PROHIBIT** executar comandes destructives de Git (`git checkout`, `git restore`, `git reset`, `git clean`, `git stash`).
>   - **PERMÉS I OBLIGATORI:** Llegir tot el codi nou i modificat, executar les bateries de proves unitàries i les portes de qualitat en mode lectura (`npx vitest run ...`, `node tooling/gates/design_guard.mjs --arrel=src`, `node tooling/gates/tractor-cens.mjs`, `npx eslint ...`), escriure el vostre informe canònic a `_wiki_de_poble/04_escriptori/261029_HHMM_auditoria_gemini.md` o `_wiki_de_poble/04_escriptori/261029_HHMM_auditoria_codex.md`, actualitzar el Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`) i, si detecteu qualsevol defecte o millora puntual en el codi de Claude, documentar el fragment exacte amb línia i proposta de correcció dins de l'informe (o deixar un fitxer `.patch` informatiu a `_wiki_de_poble/04_escriptori/`).

1. Llegiu immediatament abans d'auditar:
   - `_wiki_de_poble/04_escriptori/261029_1723_auditoria_claude.md` (relleu viu de progrés de Claude Opus 5.5)
   - `_wiki_de_poble/04_escriptori/261029_1605_pla_implementacio_album_multimedia_local_negreta_xat_i_deute_e2ee_pwa.md`
   - `_wiki_de_poble/04_escriptori/261029_1605_prompt_opus_album_multimedia_local_negreta_xat_i_deute_e2ee_pwa.md`
   - `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### 1. TASQUES DE REVISIÓ DE QUALITAT I CONFORMITAT (QA) SOBRE ELS BLOCS A, B, C I D (Ja Construïts per Claude Opus 5.5)

#### T1 · Auditoria del Bloc A (`IDEA-54` + `IDEA-55` · Motor i Components del Gestor d'Arxius Locals a `src/sections/multimedia/`)
Reviseu línia per línia els fitxers nous i modificats de `src/sections/multimedia/` i `tests/helpers/carpetaLocalFalsa.js`:
- **Motor i magatzem (`motorMultimediaLocal.js`, `bibliotecaCarpetesLocals.js`, `suggerimentPobleLocal.js`, `notaDelFitxerLocal.js`, `urlsArxiuLocal.js`, `textosGestorLocal.js`):**
  1. Verifiqueu que les 4 operacions físiques (`mou`, `reanomena`, `creaCarpeta`, `elimina`) a `motorMultimediaLocal.js` validen sempre les rutes i els noms contra caràcters de control, barres, `..` i col·lisions al destí, i que `mou` verifica els bytes escrits abans d'invocar `removeEntry` a l'origen.
  2. Verifiqueu que `urlsArxiuLocal.js` i `GestorMultimediaLocal.jsx` revoquen tots els `URL.createObjectURL` en canviar de pàgina, carpeta o desmuntar el component (zero fuites de memòria).
  3. Verifiqueu que `bibliotecaCarpetesLocals.js` aïlla correctament l'`IndexedDB` (`socdepoble_arxius_locals_v1`) i es neteja en tancar la sessió (`oblidaCarpetesLocalsAlLogout`).
  4. Verifiqueu que cap fitxer de `src/sections/multimedia/` importa cap mòdul de `src/sections/gestoria/**` (`npx vitest run src/sections/gestoria/privacitat.test.js`) i que no s'ha creat cap subcarpeta nova que trenque `tractor-cens.mjs` (`C1`).
- **Components UI (`GestorMultimediaLocal.jsx`, `BarraVolumsLocals.jsx`, `ArbreCarpetesLocals.jsx`, `AccionsCarpetaLocal.jsx`, `GraellaAlbumLocal.jsx`, `TaulaArxiusLocals.jsx`, `DetallArxiuLocal.jsx`, `EditorTextLocal.jsx`, `OperacionsArxiuLocal.jsx`, `LaboratoriWebpLocal.jsx`, `PropostaPobleLocal.jsx`, `FormulariNomLocal.jsx`):**
  1. Verifiqueu el compliment de `node tooling/gates/design_guard.mjs --arrel=src` (`0 crítics`, tots els botons interactius amb àrea tàctil `>= 44x44 px`, zero colors hexadecimals literals, zero estils en línia prohibits).
  2. Verifiqueu que la vista de cada carpeta mostra tant imatges com arxius `.txt`, `.md`, `.pdf`, `.json`, `.csv`, àudio i vídeo barrejats a la mateixa carpeta.

#### T2 · Auditoria del Bloc B (`IDEA-53` · Negreta d'1 Toc al Xat a `src/sections/xat/`)
Reviseu `src/sections/xat/negreta.js`, `src/sections/xat/components/Bombolla.jsx`, `src/sections/xat/components/Compositor.jsx`, `src/sections/xat/cercaXat.js`, `src/sections/xat/conversa.js` i `src/sections/xat/enllacos.js`:
1. Verifiqueu que el tokenitzador de `negreta.js` i `Bombolla.jsx` és lineal $O(n)$ (sense expressions regulars amb *backtracking* superlineal), retorna exclusivament elements React `<strong>` (sense `dangerouslySetInnerHTML`), preserva les URLs amb asteriscos i no altera expressions aritmètiques com `2 * 3 * 4 = 24`.
2. Verifiqueu que el botó `[ N ]` i la drecera `Cmd/Ctrl+B` a `Compositor.jsx` gestionen correctament la selecció del `<textarea>` i tenen cobertura completa en `Bombolla.negreta.test.jsx` i `Compositor.negreta.test.jsx`.

#### T3 · Auditoria dels Blocs C i D (`D-09` Oblit E2EE + LRU de `blob:` Xifrats + `D-C2 PWA` + Deutes Polits)
Reviseu:
1. `src/app/contexts/SessionContext.jsx`, `src/sections/xat/XatContext.jsx`, `src/sections/xat/components/AvisOblitXat.jsx`, `src/data/xifratXatEixida.js` i `src/host.js`:
   - Verifiqueu que `SessionContext.jsx` espera i propaga el resultat d'`oblidaTotXat()` i neteja les carpetes locals muntades al logout; que `AvisOblitXat.jsx` informa quan `OBLIT_FALLIT` queda actiu; i que `src/host.js` compleix `src/config/qualitat.amfitrio.test.js` (zero mencions literals a `localStorage`, `sessionStorage` o `indexedDB`).
2. `src/data/xatMultimediaXifrat.js`:
   - Verifiqueu l'evicció LRU (`48 MB` mòbil / `100 MB` escriptori) i que no revoca cap `blob:` que tinga referències actives en pantalla.
3. `public/icona-app-192.png`, `public/icona-app-512.png`, `public/apple-touch-icon.png` i `src/natiu/projecteIos.test.js`:
   - Verifiqueu que les 3 icones PWA tenen el verd institucional `#0e662e` (`RGB 14, 102, 46`) i passen `src/natiu/projecteIos.test.js`.
4. Reviseu també els fitxers del Bloc D (`src/components/universal/PageFrame.jsx`, `src/hooks/useBarresAmbScroll.js`, `src/sections/mur/MapaFotografic.jsx`, `src/sections/profile/GestioMembres.jsx`, `src/data/conformitat/kit.js`, `src/config/storage.js`, `src/config/idiomes/{ca,es,en,eu,gl}.js`).

---

### 2. TASQUES DE VERIFICACIÓ ARQUITECTÒNICA DELS BLOCS E, F I G (En Construcció / Integració per Claude Opus 5.5)

#### T4 · Verificació dels Blocs E (`UniversalWorkspace` a `/multimedia`), F (4 Actors Permanents de `/xat` + Cervell Local `iaiaLocal.js`) i G (`CoreContentContext` HMR + `IDEA-50`)
1. Comproveu l'estat d'avanç dels Blocs E, F i G a l'arbre de treball:
   - Si Claude Opus 5.5 ja ha escrit canvis a `src/sections/multimedia/MultimediaSection.jsx` (Bloc E), `src/sections/xat/pobleAmfitrio.js` / `actorsDelXat.js` / `useObriXatPerDefecte.js` / `src/data/iaiaLocal.js` (Bloc F) o `src/app/contexts/CoreContentContext.jsx` (Bloc G), auditeu-los amb el mateix rigor.
   - Si algun d'aquests fitxers encara està en curs de construcció per Claude en el moment de la vostra lectura, verifiqueu el seu contracte d'interfície contra `DesignSection.jsx`, `WikiDePobleSection.jsx` i `XatSection.actorsPermanents.test.jsx` i deixeu al vostre informe una llista de comprovació tècnica precisa perquè l'integrador final no deixe cap serrell obert.

---

### 3. Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340/multimedia` i `http://localhost:3340/xat`.
- **Criteris d'Acceptació de l'Auditoria QA:**
  1. Execució en mode lectura de les proves dels blocs auditats (`npx vitest run src/sections/multimedia/ src/sections/xat/ src/sections/gestoria/privacitat.test.js src/natiu/projecteIos.test.js src/data/xifratXat* src/data/xatMultimediaXifrat* src/app/contexts/SessionContext.oblitXat.seguretat.test.jsx tests/host.xifrat.test.js`) i de `node tooling/gates/design_guard.mjs --arrel=src`.
  2. Emissió de l'informe canònic (`_wiki_de_poble/04_escriptori/261029_HHMM_auditoria_gemini.md` o `_wiki_de_poble/04_escriptori/261029_HHMM_auditoria_codex.md`) validat amb `document.mjs check` i `porta-plantilla-viva.mjs --escriptori --complet`, incloent obligatòriament tant la qualificació per bloc (`/10`) com la **Matriu Universal de les 15 Dimensions (`D01..D15`) de TOT el Sistema Sóc de Poble (`/10`)** definida a `IDEA-57` del Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`), avaluant el sistema des de tots els punts de vista i enumerant amb fitxer, línia i identificador (`P0/P1/P2/QA`) **tot el que falta per arribar al `10,0 / 10` i deixar `0 deutes tècnics` pendents**, sense haver modificat cap fitxer de `src/`.
  3. Actualització de `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` amb qualsevol observació de qualitat o deute detectat.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Col·lisió d'escriptura amb Claude Opus 5.5:** Risc mitigat al 100% mantenint `src/`, `tests/`, `tooling/` i `public/` en estricte mode de només lectura durant tota l'auditoria de Gemini CLI i GPT Codex.
- **Frontera de la Gestoria (`src/sections/gestoria/privacitat.test.js`) i de l'Amfitrió (`src/config/qualitat.amfitrio.test.js`):** Verificar explícitament que ambdues fronteres continuen al 100% en verd.

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

