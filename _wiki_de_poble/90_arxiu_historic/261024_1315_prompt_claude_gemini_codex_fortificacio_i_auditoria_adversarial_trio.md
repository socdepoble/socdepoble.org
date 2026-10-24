---
type: prompt
status: esborrany
description: Convocatòria a tres bandes (Claude, Gemini, Codex) per a fortificació de bloquejants, usabilitat i auditoria adversarial extrema
tags:
  - govern
visibility: private
reflex: sdp:torn_c7fff09b-c7fb-495c-a279-75f17b43329f:4b713941-8eb6-40e8-98d0-a4ea4e345191
---
# Prompt Canònic d'Execució i Auditoria a Tres Bandes · Fortificació, Usabilitat i UI/UX

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] Escriptori netejat amb Porta Olivera: Codi 0 confirmat (documents de la nit arxivats a `90_arxiu_historic/`).
- [x] Pla d'implementació viu i aprovat pel Mestre: `_wiki_de_poble/04_escriptori/261024_1315_pla_implementacio_fortificacio_i_auditoria_adversarial_trio.md`.
- [x] Llibre Mestre Permanent consultat: `_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md`.
- [x] Torn obert: `torn_c7fff09b-c7fb-495c-a279-75f17b43329f`.
- [x] Repartiment operatiu a tres bandes:
  * **Claude Opus 5.5:** Pica-codi principal (implementació de solucions, adaptadors, components i tests).
  * **Codex Sol Ultra:** Auditoria adversarial implacable (seguretat RLS, límits, DSA, conformitat de botigues i límits legals).
  * **Gemini 4 Argon:** Auditoria adversarial de rendiment (WebPerf, puresa visual Pedra Seca, WebP i puresa d'empaquetat).
  * **IAIA MarIA:** Orquestradora i Directora Tècnica (supervisió, arbitratge i síntesi per al Mestre).
- [x] Servidor dev actiu a `http://localhost:3340`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c7fff09b-c7fb-495c-a279-75f17b43329f:4b713941-8eb6-40e8-98d0-a4ea4e345191 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T11:11:33.326Z |
| Modificació | 2026-10-24T11:15:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares (Instrucció d'àudio 13:08) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | Claude Opus 5.5 + Gemini 4 Argon + Codex Sol Ultra |
| Tokens consumits | ~ |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-24T11:11:33.326Z: Esborrany creat.
2026-10-24T11:15:00.000Z: Convocatòria oficial a tres bandes emesa pel Mestre Javi Llinares per fortificar bloquejants P0, polir usabilitat/UX frontend (Lector RSS, visor lightbox, connexions humanes) i llançar un Gauntlet adversarial extrem creuat.

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

> ⚡ **AVÍS CRÍTIC PER A CLAUDE OPUS (Agent Pica-Codi):**
> Les dues auditories adversarials de les teues companyes **JA ESTAN COMPLETADES I DIPOSITADES A L'ESCRIPTORI**. No cal que investigues a cegues:
> 1. Llig íntegrament l'informe de **Codex Sol Ultra**: [`261024_1315_auditoria_codex.md`](_wiki_de_poble/04_escriptori/261024_1315_auditoria_codex.md) amb les 6 troballes altes (`C-01` a `C-06`) de seguretat, Apple tokens, DSA, exportació de dades i baixa de compte.
> 2. Llig íntegrament l'informe de **Gemini 4 Argon**: [`261024_1315_auditoria_gemini.md`](_wiki_de_poble/04_escriptori/261024_1315_auditoria_gemini.md) amb les troballes (`G-01` a `G-06`) de WebPerf, Lightbox al cos d'articles, Lector RSS i UI/UX.
> 3. **Decisió Canònica del Mestre Javi Llinares (261024):** A `/connectar`, la sol·licitud de membreia s'articularà mitjançant una petició estructurada al xat privat de l'entitat, permetent el diàleg humà abans de l'acceptació; i l'alçada de `.bar-black` es manté a 64px.
> Centra't directament a **picar el codi i fer passar les proves al 100%** per resoldre aquestes troballes!

El Mestre Javi Llinares ha ordenat una ofensiva a tres bandes per atacar coordinadament els bloquejants de producció pendents al Llibre Mestre, millorar la usabilitat i la UI/UX directa, i sotmetre el treball a una auditoria adversarial implacable.

**Repartiment de Rols:**
1. **Claude Opus 5.5 (Agent Pica-Codi):** Implementarà el codi de les tasques T1, T2, T3, T4, T5, T6 i T7 tenint en compte les troballes exactes de Codex (`C-01`..`C-06`) i Gemini (`G-01`..`G-06`), afegirà les proves associades i assegurarà que la suite passe al 100%.
2. **Codex Sol Ultra (Auditor Adversarial de Seguretat i Contractes):** Ja ha emés el seu informe inicial; reauditarà els canvis de Claude un cop implementats.
3. **Gemini 4 Argon (Auditor Adversarial de Rendiment i UI/UX):** Ja ha emés el seu informe inicial; reauditarà el comportament del visor lightbox i el lector RSS un cop implementats.
4. **IAIA MarIA:** Orquestradora i Secretària del Consell.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Bloc 1 · Fortificació Bloquejants P0 (Prioritat Màxima)
- **T1 · Revocació de Token d'Apple (`P0-04` · Claude & Codex):**
  - Implementar la lògica de revocació de credencials d'Apple (`https://appleid.apple.com/auth/revoke`) quan s'invoca la baixa de compte (`esborra_propi_compte()`).
  - Documentar la gestió de la clau privada `.p8` sense exposició al client.
  - Proves de contracte i mocks per validar que la revocació s'executa abans de purgar les dades de Supabase.
- **T2 · Resolució del Pegat Legal P3 (`P0-18` · Claude & Codex):**
  - Consolidar les correccions a `src/context/ModeracioContext.jsx` i `src/sections/text/DetallPrivacitat.jsx`.
  - Harmonitzar els canals de contacte legal, el protocol d'avís de versió i l'exempció territorial DSA conforme als dictàmens previs.
  - Assegurar que les 215 proves de conformitat passen netament.
- **T3 · CSP de Mitjans i Verificació (`P0-19` · Claude):**
  - Confirmar que la directiva `media-src 'self' data: blob: https:;` a `firebase.json` és permanent i que el dev server (`localhost:3340`) i la compilació web no generen cap advertència de CSP en reproduir àudios o vídeos de Supabase Storage.

### Bloc 2 · Usabilitat, UI/UX i Diferenciació Connectar (Front-End)
- **T4 · Visor d'Imatges Lightbox (`P1-06` · Claude & Gemini):**
  - Connectar `ImageLightboxModal` als articles i fitxes de detall (`src/sections/universal/detailSectionMeta.jsx` i `PageFrame.jsx`).
  - Quan un usuari faça clic sobre una fotografia del cos d'un article o contingut, s'obri el visor a pantalla completa amb fons fosc, zoom/ajust i botó de tancar accessible (`Escape` o botó '✕').
- **T5 · Lector RSS Territorial (`P1-07` · Claude & Gemini):**
  - Activar fonts RSS reals per a `/app/lector` (notícies comarcals, taulons municipals i comunicació rural).
  - Gestionar errors de xarxa i timeouts amb un estat de fallback elegant que convide a explorar la comunitat.
- **T6 · Xarxa Humana Rural: Connectar vs Membresia (`IDEA-14` · Claude & Gemini):**
  - **Directiva explícita del Mestre Javi:** A la secció `/connectar`, cal diferenciar clarament dos conceptes que no es poden barrejar:
    1. **Connectar amb l'Autor / Persona / Entitat:** Establir una relació interpersonal o de seguiment (qui està connectat amb qui, sense algoritmes).
    2. **Sol·licitar ser Membre d'un Grup o Associació:** Procés formal de pertinença comunitària (`town_memberships` o `organizations`).
  - Dissenyar la UI de `/connectar` per reflectir ambdues opcions amb botons i textos diferenciats.
- **T7 · Exportació de Dades Personals (`P2-08` · Claude & Codex):**
  - Implementar la funció de descàrrega íntegra de dades («Descarrega les meues dades») que incloga contingut propi, denúncies realitzades, consentiments i bloquejos, protegint la identitat de tercers denunciants.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

1. **Risc de fugues en secrets d'Apple:** La clau `.p8` i el Client Secret d'Apple han de generar-se mitjançant JWT exclusivament en backend/Edge Function. Zero secrets a `src/`.
2. **Risc de confusions en la UI de `/connectar`:** Si s'ajunten els botons de connexió personal amb els de membresia, l'usuari no sabrà si està seguint una persona o demanant entrar a una junta. Cal màxima claredat lèxica valenciana.
3. **Regressió en el volum de tests:** Qualsevol canvi a `ModeracioContext` o rutes de connexió ha de mantindre les més de 21.000 proves de Vitest al 100% en verd.

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
- [[261024_1315_pla_implementacio_fortificacio_i_auditoria_adversarial_trio]]
- [[261024_0345_acta_marmota_coronacio_botigues_apple_testflight_i_google_play]]

