---
type: prompt
status: esborrany
description: 'Carril 2 d''Onada R19 per a Codex GPT-6.1 Sol Ultra en clon efímer: contracte backendPort per a traspàs i co-publicació, GEDCOM 5.5.1/7.0 sense PII i auto-titulació de sessions al xat.'
tags:
  - govern
visibility: private
reflex: sdp:torn_c9496ba8-7054-4950-af29-31b28476df6c:2d03f332-44fc-4745-9b09-c94560c17435
---
# Prompt d'Execució i Auditoria Local — Codex: Port Co-Publicació, GEDCOM i Auto-Titulació Xat

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `porta-olivera.mjs` `exit 0`; documents consumits de `R18` arxivats a `90_arxiu_historic/`.
- [x] **Llibre Mestre consultat i referenciat**: `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu.
- [x] **Repartiment asíncron d'actors locals i Matriu d'Exclusivitat de Carrils**: Carril 2 assignat a `Codex GPT-6.1 Sol Ultra` en clon efímer `/tmp/sdp_codex_r19` (zero mutació directa de `src/` a `socdepoble.org/`, lliurament com a Kit CAS a `../_investigacio_ia_de_poble/261111_kit_codex_r19_copublicacio_gedcom_i_xat/`).
- [x] **Pla d'Implementació** generat i vinculat al torn (`261111_1720_pla_implementacio_onada_r19_commit_r18_copublicacio_i_patrimoni.md`).
- [x] **Circuit Canònic de Rebuts i Plantilla Viva**: nascut de `document.mjs context` + `create`.
- [x] **Sentinella de Seguretat (`core-seguretat-audit`)** i **Enginyeria Inversa (`REA`)** verificats.
- [x] **Rebut obtingut**: `sdp:torn_c9496ba8-7054-4950-af29-31b28476df6c:2d03f332-44fc-4745-9b09-c94560c17435`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c9496ba8-7054-4950-af29-31b28476df6c:2d03f332-44fc-4745-9b09-c94560c17435 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local (clon efímer `/tmp/sdp_codex_r19`) |
| Creació | 2026-11-11T16:22:01.073Z |
| Modificació | 2026-11-11T16:24:00.000Z |
| Propietari | Codex GPT-6.1 Sol Ultra (Carril 2) |
| Aprovació humana | vigent (Acta Marmota 261111_1608 i despertar Jarvis 261111_1715) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.11.0) |
| Model IA | Gemini 4 Carbon (High) (Orquestradora MarIA) → Destinatari: Codex GPT-6.1 Sol Ultra |
| Tokens consumits | Telemetria de sessió Antigravity `e6d089f5-0068-49fe-b103-1de942b3ac21` |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- `2026-11-11T16:22:01.073Z`: esborrany creat amb `document.mjs create` sota `torn_c9496ba8-7054-4950-af29-31b28476df6c`.
- `2026-11-11T16:24:00.000Z`: incorporat l'encàrrec ortogonal del Carril 2 (`backendPort` per a traspàs/co-publicació, `GEDCOM 5.5.1/7.0` + deduplicació sense PII i auto-titulació de sessions al xat).

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

Operes com a **Carril 2 d'Enginyeria de Contractes, Genealogia i Xat** dins d'un clon aïllat (`/tmp/sdp_codex_r19`), **sense mutar mai `src/`, `tooling/` ni `.git/` de l'arbre viu** mentre Claude executa el `COMMIT R18`. Llig sencers abans d'actuar:
1. El Pla d'Implementació viu d'`Onada R19`: `_wiki_de_poble/04_escriptori/261111_1720_pla_implementacio_onada_r19_commit_r18_copublicacio_i_patrimoni.md`.
2. L'Acta Marmota vigent (`_wiki_de_poble/10_actes/261111_1608_acta_marmota_tancament_marato_r18_patrimoni_plugins_genealogia_i_relleu_r19.md`), el Llibre Mestre (`03_llibre_mestre_tasques_i_idees.md`) i les 3 auditories finals de `R18` (`0205`, `0206`, `0612`).
3. El Dossier de Pre-Mastegat del Node 0 (`../_investigacio_ia_de_poble/DOSSIER_NODE0_PREMASTEGAT_R19.md`).

> **QUÀDRUPLE TÈCNICA COGNITIVA I MÈTODE GAUNTLET (Obligatori):** Executa les 5 fases del **Mètode MIT d'Acumulació de Context i Memòria Semàntica en Xarxa**, contrasta amb **Google EGM** i **REA**, i segella un Kit CAS executable (`fitxers/`, `pegats/`, `MANIFEST.json`, `SHA256SUMS` i `verifica_i_aplica.py`) a `../_investigacio_ia_de_poble/261111_kit_codex_r19_copublicacio_gedcom_i_xat/`.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 · Contracte Neutral (`backendPort.js`), Adaptador Local i Migració SQL amb RLS per a Traspàs d'Autoria i Co-Publicació Multi-Entitat Registrada:**
  - Dissenya i implementa darrere de `src/data/backendPort.js` (amb simetria 100% a `src/data/contracte.js`, `src/data/supabase/`, `src/data/local/adaptadorLocal.js` i `src/data/conformitat/kit.js`) la capacitat universal de **Co-Publicació i Traspàs d'Autoria (`publicadorsRegistrats[]`)**:
    - Regla dura verificada en servidor (SQL constraint / RPC) i client: **només comptes realment registrats al padró de Sóc de Poble** poden formar part de `publicadorsRegistrats[]`; si la llista és buida o l'entitat d'origen encara no està registrada, el publicador efectiu de la Barra Taronja és `Sóc de Poble` mentre l'autoria de l'obra i la llicència (`copyright`) es conserven intactes.
    - Funció atòmica `traspassaPublicacio` (`superadmin + aal2`, amb bitàcola d'auditoria reversible) per traspassar pàgines/llibres a una associació real quan es registra, amb opció de mantindre co-publicació compartida (`Sóc de Poble` + `Associació`, o múltiples pobles/associacions).
- **T2 · Genealogia Local Fase 2 (`P0-110`): Motor Determinista `GEDCOM 5.5.1 / 7.0` i Deduplicació Assistida Zero-PII (`src/apps/genealogia/`):**
  - Endureix l'importador/exportador `GEDCOM 5.5.1 / 7.0` amb round-trip fidel (Sosa-Stradonitz, precisions de data, notes d'evidència i filtratge estricte RGPD de persones vives per defecte) i construeix el detector determinista de possibles duplicats en IndexedDB (sense fusió automàtica destructiva: sempre confirmació humana explícita i Cognom ≠ Parentiu). **Zero dades familiars reals dins del kit, les proves o Git.**
- **T3 · Auto-Titulació Automàtica de Sessions al Xat Natiu amb la IAIA MarIA (`src/sections/xat/`):**
  - Quan una persona obri una sessió/conversa nova amb la IAIA a `/xat`, el sistema genera i persisteix automàticament un títol curt semàntic a partir del primer missatge de l'usuari (sense obligar mai l'humà a escriure o copiar un títol manual), amb proves Vitest completes.
- **T4 · Marató Autònoma Multi-Loop de Migdiada (`17:30 – 20:30 CET`, 2–3 hores sense el Mestre): Fortificació del Panell de Control, Verificador Botànic-Visual i Consens Multi-IA:**
  - **PROHIBIT ATURAR-SE AL PRIMER PASS:** El Mestre dorm 2–3 hores i ordena execució contínua 100% autònoma en múltiples **Gauntlet Loops** usant l'**Elefant (`egm-zoom-out`) i els Peixets de Google EGM** fins assolir l'excel·lència consensuada amb Claude, Gemini Carbon i el Node 0 (auto-compactant al `75%` de context i amb parada neta a les `20:30 CET`).
  - **Loop 2 (Enfortiment de totes les idees del Panell de Control):** Audita i endureix la persistència local, l'exportació/importació real, la concurrència entre pestanyes i els casos límit de totes les eines del Panell de Control (`gestoria`, `bar`, `nevera`, `salut`, `genealogia`, `lector`, `avisador`), eliminant deute tècnic real del Llibre Mestre.
  - **Loop 3 (Guarda Determinista i Auditoria Adversarial de Plantes, Llavors i Imatges Hiperrealistes):** Audita a fons `src/data/patrimoni/herbariLaTorre117.js`, `bancLlavors.js`, `arbresMonumentals2020.js`, `laminesBotaniquesNode0.js` i els `.webp` de `public/assets/uploads/patrimoni/`. Construeix una prova/guarda determinista (`laminesBotaniquesNode0.rigor.test.js`) que verifique: (a) correspondència exacta `id` + `binomiNet` + existència/dimensions/SHA-256 dels `.webp`, (b) absència d'al·lucinacions morfològiques i barbarismes (com *Olea europaea* alterna/serrada/pentàmera, *Ceratonia siliqua* bipinnada/serrada, *Prunus dulcis* capçuda, «lanceololances», «tàlem»), (c) càrrega diferida (lazy) de `laminesBotaniquesNode0.js` perquè l'expansió d'imatges no sume ni 1 byte a l'arrencada de WordPress.
  - **Conversa i Consens a 4 Bandes:** Escriu i respon a cada ronda de `../_investigacio_ia_de_poble/261111_1720_mesa_consens_migdiada_r19/TAULER_CONVERSA_I_CONSENS_R19.md`, audita els kits de Gemini Carbon i del Node 0, actualitza el teu Kit CAS fins que totes les IAs signen consens sense objeccions obertes, i emet `_wiki_de_poble/04_escriptori/AAMMDD_HHMM_auditoria_codex.md` amb MCR i puntuació `D01`–`D15`.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** Servidor efímer en port lliure (`3341+`), tancat netament en bloc `finally` en acabar.
- **Criteris d'Acceptació:** Kit CAS segellat amb `SHA256SUMS` 100% verificat, `tractor-enxufe.mjs` `E1..E4` verd, `tractor-rls.mjs` `0` infraccions, `kit.test.js` i `adaptadorLocal.test.js` 100% verds, zero PII a tot l'arbre i Nucli Verge `<= 250.000 B` gzip-9.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Xoc de preimatge amb `COMMIT R18`:** Construeix les operacions CAS de `R19` sobre mòduls ben aïllats i re-verifica les preimatges contra l'arbre viu una vegada Claude consolide `COMMIT R18`.
- **Contaminació de dades personals:** Tota prova de `GEDCOM` i deduplicació ha d'usar noms 100% sintètics de laboratori.

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
- [[261111_1720_pla_implementacio_onada_r19_commit_r18_copublicacio_i_patrimoni]]
- [[261111_0206_auditoria_claude]]
- [[261111_0205_auditoria_codex]]
- [[261111_0612_auditoria_gemini_carbon_extrema_i_futur]]
- [[taxonomia_documental]]
