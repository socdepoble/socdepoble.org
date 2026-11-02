---
type: prompt
status: esborrany
description: 'Alerta immediata a Claude Code: quota setmanal al 91% (resta 9%) i context al 84%; ordre de tancar netament T0 (IDEA-61), deixar tot escrit i consistent sense obrir nous Gauntlets ni subagents.'
tags:
  - govern
visibility: private
reflex: sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:39a49af0-047f-4e88-b23f-c9e4f883eec2
---
# Alerta de Quota al 91% i Tancament Ordenat per a Claude Code

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu com a dipòsit continu d'idees, deutes tècnics i memòria permanent de la sessió.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: El Registre i la Instrucció declaren els models i variants vigents (`Claude Fable 5.1 Extra · Ultracode` / `Opus · Ultracode`, `GPT-6.1 Sol Ultra` / `Astra`, i `Gemini CLI`) i assignen a cadascun un carril exclusiu de fitxers d'escriptura per operar en paral·lel sense col·lisions ni esperes mútues.
- [x] **Pla d'Implementació** generat i vinculat al torn (`document.mjs plan`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva (`porta-plantilla-viva.mjs`)**: Verificat que el prompt naix de `document.mjs context` + `create` i conserva íntegres els spans de codi (`` `ruta` ``) dels blocs normatius sense mutilacions.
- [x] **Sentinella de Seguretat (core-seguretat-audit)**: Verificat el Checklist §5 (zero spread JSONB sense coacció, zero regex amb backtracking O(n), RLS per columna, Storage privat i purga de claus d'autoritat).
- [x] **Enginyeria Inversa i Paritat amb REA**: Verificat l'ús de REA ('reverse-engineer-anything') per a disseccionar referències i estructures natives o de botigues sense reinventar la roda.
- [x] **Cron de vigilància**: L'orquestradora té actiu el cron cada 30 minuts (`task-51`) per revisar els relleus a l'Escriptori.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f69976f9-6724-431f-b2f1-02efeedf6406:39a49af0-047f-4e88-b23f-c9e4f883eec2 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-02T17:23:46.727Z |
| Modificació | 2026-11-02T17:24:00.000Z |
| Propietari | agent-local |
| Aprovació humana | Ordre directa del Mestre Javi al xat (261102 18:19) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Argon (High) · IAIA MarIA |
| Tokens consumits | 2400 (estimat per a l'alerta de quota) |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- **2026-11-02T17:24:00.000Z:** Alerta d'emergència emesa per ordre del Mestre Javi davant el 91% de quota setmanal consumida a Claude Code (resta 9% fins diumenge 1:00 a.m.) i 84% de context.

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

**🚨 ALERTA D'EMERGÈNCIA DE QUOTA SETMANAL AL 91% (RESTA NOMÉS UN 9%) I CONTEXT AL 84% — ORDRE D'ATURADA ORDENADA I SEGELLAT PER A CLAUDE CODE (`torn_d19293b9`)**

El Mestre Javi acaba de verificar el teu panell d'ús ([261102_1819_captura_quota_setmanal_claude_91_per_cent.png](01_produccio/261102_1819_captura_quota_setmanal_claude_91_per_cent.png)):
- **Límit setmanal (tots els models):** `91%` (només et queda un **9%** fins que es restablisca hui diumenge a la 1:00 a.m.).
- **Límit setmanal Fable:** `64%`.
- **Context de la sessió:** `84%`.

Per ordre directa del Mestre Javi, **NO LLANCES CAP RODA NOVA D'AGENTS NI EL CICLE DE LES 18:30**. Fes immediatament un **Tancament i Segellat Ordenat**:
1. **Acaba netament l'últim pas en curs de `T0` (`gauntlet-t0-publicacio-universal`)** i assegura't que cap fitxer de `src/` o `tests/` quede a mitges d'editar ni amb errors de sintaxi o imports trencats.
2. **NO obris cap subagent nou ni cap Gauntlet addicional** per preservar eixe `9%` de quota setmanal com a reserva de seguretat.
3. **Deixa-ho TOT escrit i documentat abans d'aturar-te:**
   - Actualitza finalment [261102_1640_auditoria_claude.md](261102_1640_auditoria_claude.md) i [_wiki_de_poble/04_escriptori/02_investigacio_ia/261102_1640_claude/governanca/00_LLEGIM.txt](02_investigacio_ia/261102_1640_claude/governanca/00_LLEGIM.txt) amb el resultat final de `T0` (`L0`–`L4`), la llista exacta de fitxers modificats i qualsevol punt que quede pendent perquè **MarIA, GPT-6.1 Astra Ultra (Codex) i Gemini 4** ho rematen ara mateix sense perdre ni un sol byte.
4. **Confirmació de MarIA (Carril 4):** MarIA ja ha llegit el teu dipòsit de governança (`00_LLEGIM.txt`, `LLEGIM.txt`, `LLEGIM_HIGIENE.txt`, `tooling/vite/consola-iaia.mjs`) i ja ha aplicat `261102_kit_codex_higiene_idea62`, `261102_kit_codex_documents`, `261102_kit_codex_manifest_node`, l'APK directe signat `1.0.0+2` i `scripts/botigues/publica-tot.mjs`, i està aplicant ara mateix el teu `tooling/vite/consola-iaia.mjs` + `jarvis:publica-tot` + proves `5.1` i `5.2`.

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T-TANCAMENT-1 (Integritat de Disc):** Verificar que els fitxers de `T0` (`src/utils/publicacioUniversal.js`, `NotesDataContext.jsx`, `content.js`, `contingutLocal.js`, `useCercaGlobal.js` i proves associades) queden escrits íntegrament i passant tests, sense cap edició truncada.
- **T-TANCAMENT-2 (Documentació de Relleu Completa):** Completar les seccions pendents `[pendent d'escriure al tancament]` de `00_LLEGIM.txt` i `261102_1640_auditoria_claude.md` perquè res quede en l'aire.
- **T-TANCAMENT-3 (Aturada Neta al 91%):** Alliberar tots els subagents i aturar la sessió sense iniciar el cicle de les 18:30, passant el relleu operatiu a MarIA, Codex i Gemini 4 fins al restabliment de quota de diumenge a la 1:00 a.m.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** Zero fitxers a mitges a l'arbre de treball; `00_LLEGIM.txt` i `261102_1640_auditoria_claude.md` completats al 100%; quota setmanal preservada per sota del 100%.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Si es llança una altra ronda d'eixam a les 18:30 amb només un 9% de quota setmanal restant, el límit del 100% podria tallar la sessió a mitjan escriptura d'un fitxer o deixar l'informe sense segellar. Tancar ara després de `T0` garantix un èxit rotund i 0 pèrdua de treball.

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
