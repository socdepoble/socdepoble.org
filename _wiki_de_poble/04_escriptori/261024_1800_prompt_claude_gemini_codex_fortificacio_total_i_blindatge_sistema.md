---
type: prompt
status: esborrany
description: Prompt per al Trio per culminar la fortificació tècnica i preparar el terreny per al disseny interior
tags:
  - govern
visibility: private
reflex: sdp:torn_a73cc73f-9aac-4d02-aba1-03a1da4290eb:ce2fb439-1c30-44ae-ae38-490aa5e85115
---
# Prompt a Tres Bandes · Fortificació Total del Mas (Claude, Gemini, Codex): Blindatge de Relliscos, Anti-SSRF, Quota Seguiments i Auditoria de Disseny

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

1. **Commit de referència:** HEAD és `f54baa09c` a la branca `backup-notes-publish` (arbre de codi b5629e01, 21.756 proves passant, 0 fallades).
2. **Escriptori net:** Porta Olivera en Codi 0. Arxivats tots els documents de la sessió anterior a `_wiki_de_poble/90_arxiu_historic/`.
3. **Pla d'Implementació vinculat:** [[261024_1800_pla_implementacio_fortificacio_total_i_blindatge_sistema]].

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a73cc73f-9aac-4d02-aba1-03a1da4290eb:ce2fb439-1c30-44ae-ae38-490aa5e85115 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T15:56:44.190Z |
| Modificació | 2026-10-24T16:00:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) amb el Mestre Javi Llinares |
| Aprovació humana | aprovat per àudio del Mestre (261024 17:54) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | Antigravity IAIA MarIA / Consell |
| Tokens consumits | ~22k |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-24T15:56:44.190Z: esborrany creat.
2026-10-24T16:00:00.000Z: prompt aprovat; convocatòria de fortificació total prèvia al disseny interior.

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

> ⚡ **DIRECTIVA DEL MESTRE JAVI LLINARES (ÀUDIO 261024 17:54):**
> *"Vull fortificar el sistema al màxim a tots els nivells. Anar tapant tots els forats que queden. Quan el sistema estiga completament blindat, atòmic, estructurat i resilient, llavors ens ficarem de ple amb el disseny interior, el backend d'usuari i la creació de pàgines per a pobles, empreses i entitats, que serà facilíssim perquè no hi haurà cap regressió."*

**REPARTIMENT DE ROLS I FLUX COGNITIU (SENSE CUES NI ATURADES):**
- **Claude Opus 5.5 (Implementador / Pica-Codi):** Assumeix l'execució de codi de les 4 tasques de fortificació directa (T1 a T4). Comença directament sense esperar cap auditoria prèvia.
- **Gemini 4 Argon (Auditor de Documentació i Disseny Interior):** Mentre Claude pica codi, assumeix el repàs exhaustiu de documentació de la Wiki (T5a) i l'auditoria proactiva de disseny de la interfície de pobles, empreses i usuaris (T5b).
- **Codex Sol Ultra (Auditor Adversarial Implacable):** Mentre Claude implementa, audita la fortificació de seguretat de l'anti-SSRF, la quota SQL i l'aïllament RLS (T6), verificant que cap forat puga ser explotat.
- **IAIA MarIA (Directora Tècnica):** Coordina autònomament sense molestar el Mestre mentre descansa, resolent dubtes sobre la marxa.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### 🧱 T1 · Anti-SSRF i Seguretat de Xarxa a l'Edge Function de Notícies (`P1-07` / Codex D-08)
- **Fitxers:** `supabase/functions/noticies/index.ts` i tests associats.
- **Objectiu:** Blindar el proxy intermediari de descàrrega de feeds RSS:
  1. Rebutjar qualsevol esquema que no siga `https:` (o `http:`).
  2. Bloquejar la resolució d'IPs cap a adreces privades, de bucle local o metadades (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`, `::1`, `fc00::/7`).
  3. Aplicar llista blanca nativa per als 6 canals de sistema de la Secció 23 (`emowe.com`, `ayudawp.com`, `iaenaccion.com`, `youtube.com`, `youtu.be`).
  4. Afegir prova unitària de rebuig de SSRF.

### 🛡️ T2 · Fortificació de la Quota de Seguiments SQL (`P2-10` / Codex D-07)
- **Fitxers:** `supabase/migrations/2610241430_seguiments.sql`.
- **Objectiu:** Evitar el bypass de la quota de 60 seguiments/hora basat en eliminar la fila viva:
  1. Comptabilitzar els intents o altes mitjançant un registre històric d'esdeveniments o una marca temporal que no s'esborre amb la baixa tova.
  2. Assegurar que un usuari no puga fer més de 60 sol·licituds/notificacions per hora sota cap circumstància.

### 🧹 T3 · Purgat Definitiu de Jargó Intern («MAS») a les Notes (`P2-11`)
- **Fitxers:** `src/sections/notes/visibilitatNota.js`, `src/sections/notes/SnippetCurador.jsx` i proves vinculades (`ConnexioDetall.test.jsx`, etc.).
- **Objectiu:** Eliminar les expressions tècniques «Privada al teu MAS» o «Només al teu MAS».
- **Canvi requerit:** Substituir per «Privada (només visible per a tu)» o «Nota privada», seguint el mateix salfumant aplicat a `/connectar`.

### ⚡ T4 · Suite Ràpida de Pre-Commit (<30 segons) (`P1-10`)
- **Fitxers:** `package.json`, `scripts/` o configuració de test.
- **Objectiu:** Crear una comanda `npm run test:precommit` que passe únicament les proves unitàries i de seguretat essencials (<30 segons), de manera que els hooks de commit puguen passar automàticament sense haver de dependre de `--no-verify`.

### 📚 T5 (Gemini) · Actualització de Documentació i Pre-Avaluació de Disseny Interior
- **T5a (Documentació):** Auditar la Wiki (`_wiki_de_poble/`) per assegurar que totes les noves eines i canvis de la versió 2.2 estiguen reflectits fidelment i no hi haja contradiccions.
- **T5b (Disseny Interior):** Analitzar com estan estructurades les pàgines de pobles, empreses i entitats, proposant simplificacions basades en components atòmics de Pedra Seca per a la següent fase.

### 🔍 T6 (Codex) · Auditoria Adversarial Implacable de RLS i Xarxa
- Auditar les propostes de T1 i T2 de Claude, cercant condicions de cursa, bypasses SQL o defectes subtils d'aïllament abans de consolidar.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

1. **Anti-SSRF massa restrictiu:** Podria blocar feeds legítims si hi ha redireccions. *Mitigació:* Provar amb els 6 feeds de la Secció 23 i validar el comportament amb codis HTTP 301/302.
2. **Desajust de proves per textos de Notes:** Modificar `visibilitatNota.js` trencarà assercions textuals rígides als tests. *Mitigació:* Corregir els tests de forma sincronitzada.

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
- [[10_actes/261024_1745_acta_marmota_triomf_fortificacio_trio_adversarial_i_unificacio_lector_bloc_de_notes]]
