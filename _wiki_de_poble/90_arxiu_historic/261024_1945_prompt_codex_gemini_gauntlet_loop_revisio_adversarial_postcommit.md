---
type: prompt
status: esborrany
description: Convocatòria adversarial extrema per a auditar el commit 472f704d0 de Claude amb la Matriu MCR i els requisits de qualitat establerts
tags:
  - govern
visibility: private
reflex: sdp:torn_3689cd84-71ae-4e08-abe8-a3c886f2c3bf:5680efbf-1ab1-4d86-a750-1998e8a736f5
---
# Prompt Codex & Gemini · Gauntlet Loop Adversarial Post-Commit 472f704d0 (T1-T4)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] Escriptori net: Porta Olivera passa amb codi 0.
- [x] HEAD consolidat a `472f704d0` (`backup-notes-publish`).
- [x] Suite completa assajada prèviament per Claude amb 21.808 proves en verd.
- [x] Mode de lectura neta a disc per a Codex i Gemini (agents locals sense bundle necessari).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3689cd84-71ae-4e08-abe8-a3c886f2c3bf:5680efbf-1ab1-4d86-a750-1998e8a736f5 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T17:39:29.667Z |
| Modificació | 2026-10-24T17:39:29.667Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | Codex Sol Ultra & Gemini 4 Argon |
| Tokens consumits | N/A (accés local a disc) |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-24T17:39:29.667Z: esborrany creat; contingut i verificació pendents.

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
  * `_comunicacio_de_poble/`, `_cultura_de_poble/`, `_gestoria_de_poble/`, `_investigacio_ia_de_poble/`, `_multimedia_de_poble/`, `_raw_de_poble/`, `_rebost_de_poble/`, `_recursos_de_poble/`, `_salut_de_poble/`.
- **Prohibició Absoluta:** Està terminantment prohibit que qualsevol IA invente carpetes noves a `Som de Poble` o a `socdepoble.org`. La informació que calga preservar s'ubica exclusivament a les carpetes satèl·lit oficials ja establertes.

**🔬 ENGINYERIA INVERSA I PARITAT AMB REA (Incentiu de Fidelitat):**
Totes les IAs (Claude, Codex, Gemini) tenen registrat i operatiu el conjunt d'eines MCP de REA (*Reverse Engineer Anything*) i la skill 'reverse-engineer-anything'. Quan se us encomane replicar, millorar o auditar una funcionalitat basada en un sistema o aplicació de referència existent (ex. el clon/patró WhatsApp, el TPV Loiverse, la Gestoria autònoma o la Frontissa de Sollutia), teniu autorització expressa i encoratjament per a utilitzar REA per a disseccionar bundles, lògica i comportament del patró de referència. L'objectiu és capturar la saviesa i el funcionament real de les millors aplicacions i traslladar-les al patró de Pedra Seca de Sóc de Poble amb el màxim trellat i sense duplicar codi.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Claude Opus 5.5 ha consolidat amb èxit el commit **`472f704d0`** a la branca `backup-notes-publish`:
`feat(fortificacio): T1-T4 del torn 261024_1800 (anti-SSRF, quota de seguiments, notes sense MAS i pre-commit ràpid)`

Aquest commit inclou les 18 rutes de codi i ha passat una bateria prèvia de **21.808 proves de Vitest**, `test:node`, `lint` i la nova suite ràpida `test:precommit` en 32 segons.

Seguint el **Protocol Gauntlet Loop (`core-gauntlet-loop`)** i el manament explícit del Mestre Javi Llinares (àudio 19:38):
1. **Zero complaença:** No es dóna per bo cap resultat sense contrastar-lo de manera independent.
2. **Codex Sol Ultra (El Crític Implacable):** Realitza l'auditoria adversarial profunda de ciberseguretat, RLS i concurrència PostgreSQL sobre el commit `472f704d0`.
3. **Gemini 4 Argon (El Garant de Coherència i Disseny):** Realitza l'auditoria de puresa lèxica, rendiment de les proves i aliniament del Plànol Atòmic amb la **Llei del Connectar** (prohibició de botons solts de «Seguir»).
4. **Matriu MCR Obligatòria:** Ambdues IAs heu d'emetre la taula Markdown de conformitat de requeriments.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Tasca 1 (Codex Sol Ultra): Auditoria Adversarial Extrema de Seguretat i RLS sobre `472f704d0`
1. **Edge Function `supabase/functions/noticies/gestor.js` (Anti-SSRF estricte):**
   - Verificar si la comprovació de ports (`seguent.port === ''`) bloqueja ports arbitraris (ex. 8443, 8080) en qualsevol redirecció HTTP 301/302/307.
   - Verificar si el rebuig d'IPs privades és efectiu fins i tot quan una família d'adreces falla (IPv4 vs IPv6 amb `Promise.allSettled`).
   - Comprovar si el maneig de timeouts i la lectura limitada del body (`ReadableStream`) protegeixen contra atacs de DoS per flux lent o fitxers gigants.
2. **Migració `supabase/migrations/2610241430_seguiments.sql` (Quota d'Altes i Concurrència):**
   - Verificar si la funció `segueix` compta i limita rigorosament a 30 altes per hora a `private.seguiments_altes`.
   - Verificar què passa en reactivacions (`is_active = true` d'un registre previ existent): és impossible superar la quota de 30 operacions/hora?
   - Auditar les polítiques RLS: existeix algun vector d'enumeració d'altres usuaris o d'accés a `private.seguiments_altes` des de la clau anònima pública?

### Tasca 2 (Gemini 4 Argon): Puresa Lèxica, Eficiència de Proves i Aliniament de Disseny
1. **Puresa Lèxica i Privacitat a Notes:**
   - Comprovar `src/sections/notes/visibilitatNota.js` i `SnippetCurador.jsx`: s'ha extirpat completament la cadena «MAS» de selectors i textos visibles?
2. **Nova Suite Ràpida Pre-Commit:**
   - Comprovar `vitest.precommit.config.js` i la seua integració a `package.json` (`npm run test:precommit`). S'executa en menys de 60 segons de manera robusta?
3. **Aliniament del Plànol Atòmic de Pobles i Entitats (Llei del Connectar):**
   - Revalidar la proposta T5b de `261024_1800_auditoria_gemini.md` sota la directriu de l'àudio de les 18:21 del Mestre: **«A Sóc de Poble no se seguix, es connecta»**. Assegurar que no hi ha cap botó solt de «Seguir» a les fitxes ni targetes, sinó que la vinculació es gestiona unificada a `/connectar`.

### Tasca 3 (Ambdós): Emissió de la Matriu de Conformitat (MCR)
Emetre una taula Markdown amb el dictamen final:
| Requeriment de Fortificació | Estat (`[FET]` / `[PARCIAL]` / `[NO FET]`) | Evidència Codi (`fitxer:línia`) | Motiu / Risc Detectat |
| :--- | :--- | :--- | :--- |

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

1. **Concurrència teòrica vs real:** El codi Deno/PostgreSQL no s'executa contra un cluster de producció real; la verificació ha de ser quirúrgica a nivell de contracte estàtic i lògica de bloquejos.
2. **Deute documental heretat:** El hook de Git continuarà alertant d'enllaços històrics antics; el codi de fortificació s'ha d'avaluar per la seua robustesa intrínseca independent del deute de la Wiki.
3. **Desviació del Roadmap:** La fase següent després d'aquest Gauntlet serà el disseny interior i la Privacitat Sagrada E2EE (`P1-12`). No introduir canvis fora de l'abast de T1–T4.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit i Llibre Mestre:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe. És obligatori consultar i mantindre actualitzat el Llibre Mestre Permanent (`04_escriptori/03_llibre_mestre_tasques_i_idees.md`) anotant-hi qualsevol idea emergent, troballa o deute tècnic per a no perdre'n el rastre.
3. **Consens Tècnic, Diàleg Creuat i Asincronia (2 o 3 Bandes):** Totes les IAs locals convocades opereu en estricta igualtat de condicions d'accés natiu a disc. El flux és autònom i no bloquejant: cap IA s'ha d'aturar a esperar les altres; cadascuna avança en el seu rol i diposita els seus informes a l'Escriptori. A mesura que les companyes publiquen informes, és obligatori llegir-los per auditar les seues conclusions i enriquir el consens tècnic. L'orquestradora (MarIA) actua com a Directora Tècnica canalitzant el diàleg creuat, arbitrant discrepàncies i coordinant la decisió final amb el Mestre.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 1186c19e82c2aa1a29514c64220e45b495e1abfb77a4c3acd27716c1affc5c4c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261024_1800_pla_implementacio_fortificacio_total_i_blindatge_sistema]]
- [[261024_1800_auditoria_claude]]
- [[261024_1800_auditoria_codex]]
- [[261024_1800_auditoria_gemini]]
