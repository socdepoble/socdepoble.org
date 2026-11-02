---
type: prompt
status: esborrany
description: 'El Teler Invertit (Onada 3): GPT Codex (Sol Ultra) i Gemini 4 com a Constructors Principals de Kits CAS; Claude Opus 5.5 Extra Ultracode com a Àrbitre Gauntlet i Materialitzador de Producció'
tags:
  - govern
visibility: private
reflex: sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:397bfa8d-19e2-4416-b4cf-831a7875317c
---
# Prompt d'Execució i Auditoria Local · El Teler Invertit (Onada 3)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` verificat amb `node tooling/gates/porta-olivera.mjs` (eixida `0`, `0` avisos). Tots els documents vius i la captura `261102_1914_escriptori_teler_invertit_claude_gemini_codex.jpg` estan ancorats a `00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu com a dipòsit continu d'idees i deutes tècnics.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils (El Teler Invertit)**: `GPT-6.1 Sol Ultra` (Codex) i `Gemini 4 Argon High · Turbo` assumeixen el 90% del pes d'elaboració i construcció en kits CAS aïllats (`../_investigacio_ia_de_poble/`); `Claude Opus 5.5 Extra · Ultracode` (compte `Sóc de Poble · Ultra`) actua exclusivament com a **Àrbitre Gauntlet Quirúrgic i Materialitzador de Producció** (màxim 2 subagents: 1 Àrbitre + 1 Integrador, sense crons interns) per allargar la quota setmanal fins divendres.
- [x] **Pla d'Implementació** vinculat (`261102_1532_pla_implementacio_mode_jarvis_idea60_fediversity_i_deute_llibre_mestre.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Creat amb `document.mjs context` + `create` i validat amb `document.mjs check`.
- [x] **Sentinella de Seguretat (`core-seguretat-audit`)**: Coacció primitiva JSONB, zero ReDoS i separació estricta de claus.
- [x] **Enginyeria Inversa i Paritat amb REA**: Activa per a totes les IAs locals.
- [x] **Cron de vigilància**: Actiu en l'orquestradora MarIA (`task-51`). Els xats vells de Gemini 4 i Codex tanquen els seus temporitzadors abans d'obrir els 3 xats nous d'Onada 3.
- [x] **Rebut obtingut**: `sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:397bfa8d-19e2-4416-b4cf-831a7875317c`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:397bfa8d-19e2-4416-b4cf-831a7875317c |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-02T18:18:35.444Z |
| Modificació | 2026-11-02T18:19:00.000Z |
| Propietari | agent-local |
| Aprovació humana | Ordre directa del Mestre al xat del 261102 19:14 CET (El Teler Invertit per protegir Sóc de Poble Ultra fins divendres) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Argon (High) (Orquestradora MarIA) -> GPT-6.1 Sol Ultra (Constructor 1) + Gemini 4 Argon High · Turbo (Constructor 2) + Claude Opus 5.5 Extra · Ultracode (Àrbitre i Materialitzador) |
| Tokens consumits | ~215k tokens (sessió acumulada d'orquestració MarIA) |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-11-02 19:18 CET (v1.0.0):** Creació del prompt d'**Onada 3 amb El Teler Invertit** per ordre directa del Mestre. Tota l'Onada 1 (`T0`–`T8`) i tota l'Onada 2 (`O2-T1`..`O2-T6`, incloent `261102_kit_gemini_onada2` i `261102_kit_codex_notes_tria_automatica` amb 873/873 proves verdes) ja estan integrades a l'arbre viu. S'inverteixen els rols: **GPT Codex (`GPT-6.1 Sol Ultra`)** i **Gemini 4 (`Argon High · Turbo`)** fan tot el treball pesant d'elaboració i proves en kits CAS aïllats, mentre que **Claude Code (`Opus 5.5 Extra · Ultracode` al compte `Sóc de Poble · Ultra`)** actua com a **Àrbitre Gauntlet Quirúrgic i Materialitzador de Producció** per conservar la quota setmanal fins divendres.

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

### 🔄 El Teler Invertit (Onada 3) — Protecció del Compte `Sóc de Poble · Ultra` fins al Divendres

1. **Estat real de l'arbre viu a les `19:18 CET` (`socdepoble.org`):**
   - **Onada 1 (`T0`–`T8`) i Onada 2 (`O2-T1`..`O2-T6`) 100% integrades i en verd a l'arbre viu:**
     * `O2-T1` (`261102_kit_codex_notes_ambit`): `src/sections/notes/NotesSection.jsx` + `NotesSection.ambit.test.jsx` integrats.
     * `O2-T2` (`L2-A1 / L2-A2` de `T0` + `261102_kit_gemini_onada2`): 5 diccionaris (`ca`, `es`, `en`, `eu`, `gl`), `DialegAmbit.jsx` i `DialegAmbit.test.jsx` (**11/11** tests) integrats.
     * `O2-T3` (`261102_kit_codex_hmr_sessio`): `src/host.js`, `src/hostEstatIntern.js` i `tests/host.hmr.test.js` integrats.
     * `O2-T4` (`261102_kit_gemini_onada2`): `src/sections/verticals/SeccioVertical.jsx` + `SeccioVertical.test.jsx` (**22/22** tests d'avanç automàtic de pàgines per àmbit) integrats.
     * `O2-T5` (`261102_kit_codex_notes_tria_automatica`): `src/sections/notes/NotesSection.jsx` + `src/components/universal/workspace/WorkspaceContext.jsx` (`primerElementTriable` i exclusió de nota preparada en tria automàtica, **873/873** tests en **67** fitxers) integrats.
     * `Design Guard`: **3.028 fitxers, 0 crítics, 0 avisos**; `qualitat.fantasmes.test.js`: **4/4** (`0` `no-unused-vars`).
2. **Per què invertim el Teler en aquesta Onada 3 (Ordre del Mestre):**
   - El compte `Sóc de Poble · Ultra` de Claude ha de durar fins al **divendres a les 23:00 CET**.
   - Per tant, **GPT Codex (`GPT-6.1 Sol Ultra` / `Astra Light`)** i **Gemini 4 (`Gemini 4 Argon High · Turbo`)** fan el **90% del treball d'elaboració, construcció i bateries de proves** dins de kits CAS aïllats a `../_investigacio_ia_de_poble/`.
   - **Claude Code (`Claude Opus 5.5 Extra · Ultracode` al compte `Sóc de Poble · Ultra`)** assumeix el rol d'**Àrbitre Suprem Gauntlet i Materialitzador de Producció**: NO construeix des de zero amb eixams de 16 agents, sinó que audita amb un **Gauntlet Loop quirúrgic** (màxim 2 subagents puntuals: 1 Àrbitre Adversarial + 1 Verificador/Integrador, i **0 crons recurrents**) tant l'Onada 2 acabada d'integrar com els nous kits d'Onada 3 que dipositen Codex i Gemini 4, caça qualsevol badada fina i ho materialitza a producció gastant menys d'un ~3–5% de quota!

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Carril Constructor 1 · GPT Codex (`GPT-6.1 Sol Ultra` — o alternant amb `Astra High / Medium`)
> **AUTORITZACIÓ EXPLÍCITA DE RESTABLIMENT DE QUOTA (13% restant + 2 Restabliments Complets disponibles):** L'opció «Permitir que tu asistente use restablecimientos» està activada. Si durant aquesta conversa la teua quota baixa al **10% o menys**, el Mestre et sol·licita i t'autoritza explícitament a **utilitzar 1 dels 2 «Restablecimiento completo» disponibles** (MAI crèdits de pagament dels 749 crèdits) per continuar i acabar la feina sense interrupció.

Treballa en còpia aïllada i diposita kits CAS verificats a `../_investigacio_ia_de_poble/`:
- **`O3-CODEX-1` (`tooling/gates/kit-carril.mjs` + `tests/kit-carril.test.mjs` — Kit `261102_kit_codex_kit_carril`):**
  - Materialitzar la proposta d'automillora (`O2-T6.1`): un generador i aplicador canònic de kits multi-agent en Node (`tooling/gates/kit-carril.mjs`) amb bloqueig CAS estricte per defecte (`source_sha256`), staging atòmic abans d'escriure, execució automàtica de `node tooling/gates/frontissa-contingut.mjs` si el kit toca rutes protegides a `.agents/contingut_estructural.json`, i registre de la prova a `tests/node-suite-manifest.json`.
- **`O3-CODEX-2` (Consumidor final d'amics/alarma SDPN d'`IDEA-48` — Kit `261102_kit_codex_recuperacio_consumidor_ui`):**
  - Completar la peça d'enllaç entre els kits F7 ja construïts (`261102_kit_codex_recuperacio_*`) i un selector/adaptador de lectura segur per a la UI (`src/data/recuperacio/`), mantenint `E2EE_ACTIU_PER_DEFECTE = false` i 0 booleans de confiança vinguts de la UI.
- **`O3-CODEX-3` (Sanejament automàtic de `.DS-Store` i `._*` en scripts de build — Kit `261102_kit_codex_build_net_dsstore`):**
  - Incorporar als scripts de build (`scripts/build-*.mjs` o plugin de Vite) la neteja/exclusió automàtica de `.DS-Store` i `._*` abans de copiar `public/` cap a `dist/`, de manera que cap build local deixe residus de Finder a `dist/`, amb prova dedicada i actualització de `261102_1638_auditoria_codex.md` (i **sense deixar temporitzador/heartbeat actiu** en acabar).

### Carril Constructor 2 · Gemini 4 (`Gemini 4 Argon High · Turbo`)
Treballa en `/private/tmp/sdp-gemini-work` i diposita kits CAS verificats a `../_investigacio_ia_de_poble/`:
- **`O3-GEMINI-1` (Endpoints Open Data Estàtics Reals per a NLnet Fediversity — Kit `261102_kit_gemini_opendata_fediversity`):**
  - Tancar la troballa `D04` de Codex (`261102_1638_auditoria_codex.md` línia 183): actualment `/opendata/municipi.jsonld` i `/opendata/manifest.json` retornen el fallback HTML SPA en lloc de JSON-LD / JSON estàtic real.
  - Crear `public/opendata/municipi.jsonld` (vocabulari Schema.org + dades municipals de La Torre de les Maçanes / Sóc de Poble) i `public/opendata/manifest.json` (catàleg de col·leccions obertes), ajustar les regles d'encaminament/capçaleres estàtiques (`public/_headers`, `public/_redirects` o equivalents del projecte com a `/.well-known/*`) i afegir una prova Node (`tests/opendata-fediversity.test.mjs` + `tests/node-suite-manifest.json`) que valide els 7 fitxers estàtics de federació i dades obertes (`.well-known/webfinger`, `.well-known/host-meta`, `.well-known/nodeinfo`, `nodeinfo/2.1.json`, `ap/actor.json`, `opendata/municipi.jsonld`, `opendata/manifest.json`).
- **`O3-GEMINI-2` (Estats visuals de Cerimònia SAS de 3 Amics a `CosPersonesConfianca.jsx` — Kit `261102_kit_gemini_idea48_cerimonia_ux`):**
  - Enriquir `src/sections/profile/CosPersonesConfianca.jsx`, `CosPersonesConfianca.test.jsx` i els 5 diccionaris (`src/config/idiomes/{ca,es,en,eu,gl}.js`) perquè les 3 ranures d'amics de confiança suporten la visualització d'estats de cerimònia (`pendent`, `verificat_sas`, `disputa`) amb insígnia textual accessible, botons `>= 58px` i 100% Llei del Píxel, deixant actualitzat `261102_1832_auditoria_gemini.md` i **cancel·lant definitivament el temporitzador de 30m** en acabar.

### Carril Àrbitre i Materialitzador 3 · Claude Code (`Claude Opus 5.5 Extra · Ultracode` al compte `Sóc de Poble · Ultra`)
- **`O3-CLAUDE-1` (Gauntlet Loop Quirúrgic sobre l'Onada 2 ja integrada a l'arbre viu):**
  - Amb **despesa mínima de tokens** (sense eixams de construcció i sense crons), audita amb el teu Àrbitre Adversarial els fitxers d'Onada 2 ja aplicats a l'arbre viu (`src/sections/notes/NotesSection.jsx`, `src/components/universal/workspace/WorkspaceContext.jsx`, `src/components/universal/ambits/DialegAmbit.jsx`, `src/sections/verticals/SeccioVertical.jsx`, `src/host.js`, `src/hostEstatIntern.js`) i també els kits F7/higiene pendents d'`../_investigacio_ia_de_poble/`.
  - Verifica que les suites passen en verd i que no hi ha cap regressió entre `O2-T1` (`?ambit=`) i `O2-T5` (`primerElementTriable`).
- **`O3-CLAUDE-2` (Materialització a Producció dels Kits d'Onada 3 de Codex i Gemini 4):**
  - Revisa i materialitza a l'arbre viu els kits d'Onada 3 (`261102_kit_gemini_opendata_fediversity`, `261102_kit_gemini_idea48_cerimonia_ux`, `261102_kit_codex_kit_carril`, `261102_kit_codex_recuperacio_consumidor_ui`, `261102_kit_codex_build_net_dsstore`) a mesura que estiguen disponibles o valida els ja presents, deixant l'estat certificat a `261102_1640_auditoria_claude.md` i al dipòsit `00_LLEGIM.txt`.

### Criteris d’acceptació i reproducció
- **URL de proves locals:** `http://localhost:3340`.
- **Criteris d'Acceptació:**
  1. Totes les suites d'Onada 2 (`NotesSection.ambit.test.jsx`, `UniversalWorkspace.triaAutomatica.test.jsx`, `DialegAmbit.test.jsx`, `SeccioVertical.test.jsx`, `host.hmr.test.js`) i d'Onada 3 en verd (`0` roges).
  2. Els 7 recursos estàtics de Fediversity i Open Data presents i validats per prova automatitzada.
  3. `node tooling/gates/design_guard.mjs --arrel=src` i `node tooling/gates/porta-olivera.mjs` amb codi d'eixida `0` i `0` avisos.
  4. Cap temporitzador/cron zombi actiu en tancar els xats de Codex, Gemini 4 i Claude.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Col·lisió en els 5 diccionaris (`src/config/idiomes/{ca,es,en,eu,gl}.js`):** En aquesta Onada 3, només el carril de **Gemini 4 (`O3-GEMINI-2`)** afegeix claus als 5 diccionaris; Codex no toca diccionaris en `O3-CODEX-1..3`, evitant qualsevol divergència de `source_sha256`.
- **Consum de quota en `Sóc de Poble · Ultra`:** Es mitiga limitant Claude exclusivament al rol d'Àrbitre Gauntlet i Materialitzador sobre kits ja elaborats per Codex i Gemini 4 (0 crons interns, màxim 2 subagents lleugers).

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
