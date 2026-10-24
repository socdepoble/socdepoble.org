---
type: prompt
status: esborrany
description: Revisió adversarial implacable de Codex Sol Ultra i Gemini 4 Argon sobre la investigació DSA, conclusions d'iOS/Android i el pegat de text legal P3 de Claude
tags:
  - govern
visibility: private
reflex: sdp:torn_2b56c0fa-6965-40a0-b325-a4658341d3ae:61a13b56-e4d5-45a9-9919-e6b3c7572d78
---
# Prompt canònic: Auditoria Adversarial Creuada de Codex i Gemini sobre Informe de Claude i Pegat Legal P3

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] Escriptori net validat amb `node tooling/gates/porta-olivera.mjs` (Codi 0).
- [x] Pla d'implementació creat i aprovat: `_wiki_de_poble/04_escriptori/261024_0130_pla_implementacio_auditoria_adversarial_claude_i_dsa.md`.
- [x] Llibre Mestre Permanent consultat (`04_escriptori/03_llibre_mestre_tasques_i_idees.md`).
- [x] AAB fresc de release compilat a `_builds_de_poble/android/261023_socdepoble_1.0.0+1.aab` i CSP corregida a `firebase.json`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_2b56c0fa-6965-40a0-b325-a4658341d3ae:61a13b56-e4d5-45a9-9919-e6b3c7572d78 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-23T23:23:04.806Z |
| Modificació | 2026-10-24T01:25:00.000Z |
| Propietari | agent-local |
| Aprovació humana | aprovat pel Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | Codex Sol Ultra & Gemini 4 Argon |
| Tokens consumits | n/a (orquestració local) |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-23T23:23:04.806Z: esborrany creat; contingut i verificació pendents.

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

Codex Sol Ultra i Gemini 4 Argon: Heu d'examinar i auditar de manera implacable i adversarial el treball final que Claude Opus 5.5 acaba de completar a `_wiki_de_poble/04_escriptori/261023_2330_auditoria_claude.md` (especialment les noves seccions **§9 sobre la DSA i regles de compte individual** i **§10 sobre l'esborrany d'esmenes legals P3**) i el fitxer de pegat dipositat a `_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude/PEGAT_261024_P3_TEXT_LEGAL_E4_E6_E7_E11_E14.patch`.

El Mestre ha confirmat solemnement dues decisions claus:
1. **D-1**: Bundle ID canònic: **`org.socdepoble.app`**.
2. **D-2**: Publicació amb l'equip individual d'Apple: **`9KNUA4JR8P`** (*FRANCISCO JAVIER LLINARES GARCIA*).

A més, la IAIA MarIA ha compilat l'AAB de release amb JDK 21 a `_builds_de_poble/android/261023_socdepoble_1.0.0+1.aab` i ha solucionat la CSP de mitjans a `firebase.json`.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Auditoria Adversarial de la Secció §9 i §10 de Claude:**
   - Analitzeu si les propostes de text legal de Claude (E4, E6, E7, E11, E14) s'ajusten escrupolosament a la realitat del codi font i de la base de dades Supabase.
   - Verifiqueu les condicions d'aplicació del pegat P3: migració `2610201500`, registre a Apple Private Email Relay i avís de versió 2.2.
2. **Contrassenya de Seguretat de Botigues (Google Play & App Store):**
   - Valideu si l'AAB i l'App d'iOS estan llestos per a les **Pistes Internes (TestFlight Intern i Play Internal Testing)**.
   - Confirmeu si hi ha cap risc restant abans de la distribució interna.
3. **Emissió de Conclusions:**
   - Actualitzeu o afegiu una addenda als vostres respectius informes (`261023_2328_auditoria_codex.md` i `261023_2331_auditoria_gemini.md`) o confirmeu el consens tècnic a l'Escriptori.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Cap risc operatiu: mode d'auditoria adversarial de només lectura sobre els documents i el pegat. Cap canvi destructiu a codi font viu.

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
- [[261023_2330_auditoria_claude]]
- [[261023_2328_auditoria_codex]]
- [[261023_2331_auditoria_gemini]]
- [[261024_0130_pla_implementacio_auditoria_adversarial_claude_i_dsa]]
