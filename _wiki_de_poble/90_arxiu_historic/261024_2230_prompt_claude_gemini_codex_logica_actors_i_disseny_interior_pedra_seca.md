---
type: prompt
status: esborrany
description: Convocatòria autònoma a tres bandes per a disseccionar, auditar i implementar la lògica d'usuaris, empreses, grups i pobles (Gent de la Torre) sota la doctrina del Connectar i el patró de Pedra Seca
tags:
  - govern
visibility: private
reflex: sdp:torn_00ed98d6-10f9-4dcc-8f6f-62e6a39d8e84:65b65128-b989-4e67-a1df-9679d3fc25d0
---
# Prompt Claude, Gemini & Codex · Lògica dels 4 Actors Rurals, Estudi de Mercat i Disseny Interior Pedra Seca (P1-11)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] Escriptori net: Porta Olivera passa amb codi 0.
- [x] HEAD consolidat a `d7aa77350` (`backup-notes-publish`) amb 21.826 proves passant (0 fallades).
- [x] Pla d'Implementació aprovat pel Mestre: [[261024_2230_pla_implementacio_logica_actors_i_disseny_interior_pedra_seca]].
- [x] Mode de co-working en Direcció Autònoma autoritzat pel Mestre (àudio 22:29).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_00ed98d6-10f9-4dcc-8f6f-62e6a39d8e84:65b65128-b989-4e67-a1df-9679d3fc25d0 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T20:30:24.245Z |
| Modificació | 2026-10-24T20:33:00.000Z |
| Propietari | MarIA |
| Aprovació humana | Mestre Javi Llinares (2026-10-24, àudio 22:29) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | Claude Opus 5.5, Gemini 4 Argon, Codex Sol Ultra |
| Tokens consumits | N/A (accés local a disc) |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-24T20:30:24.245Z: esborrany creat; contingut i verificació pendents.

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

El Mestre Javi Llinares ha ordenat una sessió de co-working en **Direcció Autònoma** (àudios 22:29 i 22:47) per a consolidar i millorar la lògica dels 4 Actors Rurals, el Disseny Interior de Pedra Seca (**`P1-11`** al Llibre Mestre) i la **Llibertat de Formats i Ràtios d'Aspecte en Portades i Aparadors**.

Després d'haver consolidat la fortificació tècnica de xarxa i CPU (commits `472f704d0`, `5502c4669` i `d7aa77350` amb **21.826 proves en verd**), el focus absolut s'articula en dos eixos:
1. **Lògica dels Actors Rurals (Estudi de Mercat Comparat):**
   - **Zero Institucionalitat de partida:** Les nostres pàgines són **«Gent de [Poble]»** (ex: *Gent de la Torre*), fetes per la gent i el veïnat, sense dependències burocràtiques d'ajuntaments (evitant el parany de Puebli i Bandomovil).
   - **Zero Xarxa Social Clònica:** Evitar el fracàs de Puebloo (tancada a finals de 2023) arrelant l'eina en la utilitat diària: notes privades, mercat de proximitat KM 0, cotxe compartit, cura de persones i menjar casolà solidari (*Menjar a Casa*).
2. **Llibertat de Format en Foto de Portada i Imatges (Directiva del Mestre, Àudio 22:47):**
   - **El cas real que trenca el sistema:** La primera usuària real (una artesana de joies) ha intentat posar una foto allargada/panoràmica de les seues joies i el sistema l'ha forçada a retallar-la en quadrat (`1:1`). El quadrat únic és una limitació inacceptable per a l'expressió i l'aparador dels veïns i negocis.
   - **Tria multiformat:** L'usuari ha de poder triar la proporció entre els formats habituals (superpanoràmic 21:9 o 16:9, apaisat 4:3 o 3:2, quadrat 1:1, vertical/foli 3:4, 4:5 o 9:16, o mantindre l'original).
   - **Dilema de la Targeta (`UniversalCard` al Mur/Mercat):** S'ha d'estudiar i assessorar si a la targeta es manté un contenidor quadrat/uniforme per preservar la graella matemàtica de Pedra Seca o si s'adapta al format que l'usuari ha triat, sense trencar l'harmonia visual.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Tasca 1 (Claude Opus 5.5 - Constructor Pica-Codi): Implementació Quirúrgica de P1-11 i Formats d'Imatge
1. **Fitxa de Poble (`src/sections/detail/detailSectionMeta.jsx`):**
   - Eliminar les píndoles HTML duplicades `.badge-row`/`.pill` a la capçalera de poble.
   - Activar la 2a pestanya «Empreses i Entitats» a `PestanyesDelPoble` consumint `listPublicOrganizations` filtrat pel poble de la fitxa.
2. **Fitxa Pública d'Actor (`src/sections/profile/PerfilPublicSection.jsx`):**
   - Muntar `<Pestanyes>` + `<VistaPublicacionsDeLActor>` al peu de la fitxa per mostrar l'aparador KM 0 de comerços i les publicacions dels col·lectius.
   - Suprimir qualsevol botó solt de seguir; la relació es gestiona unificada a `/connectar`.
3. **Puresa del Connectar (`src/sections/connectar/BlocRelacio.jsx` & `Seguidors.jsx`):**
   - Purgar el vocabulari de xarxa social («Seguir {nom}», «Deixar de seguir», «Seguidors») i establir el vocabulari de Pedra Seca («Connectar amb {nom}», «Connectat», «Veïnat connectat»).
4. **Desbloqueig de Formats de Capçalera (`useImatgeDeFitxa.jsx` / `useEnquadramentImatge.jsx`):**
   - Alliberar la capçalera (`heroImage`) del límit forçat de `1:1`. Oferir els formats habituals ja definits a `enquadrament.js` (1:1, 4:3, 16:9, original) i afegir els formats verticals (3:4, 4:5) perquè l'usuari puga triar com retallar la seua imatge.
   - Assegurar que `PageFrame.jsx` / `UniversalPage` renderitza la capçalera respectant la proporció triada sense trencar la maquetació.
5. **Verificació:** Executar `npm run test:precommit` garantint verd absolut (<30s).

### Tasca 2 (Gemini 4 Argon - Garant de Disseny Pedra Seca): Coherència dels 4 Actors i Dilema de la Targeta
1. **Auditoria dels 4 Actors Rurals:**
   - Validar la diferenciació visual i funcional entre:
     - **Veí/Veïna:** Refugi de notes privades, connectivitat veïnal simètrica.
     - **Comerç/Empresa:** Aparador KM 0, contacte directe, TPV Pedra Seca (Mode Bar/Rebost) i tapers solidaris (*Menjar a Casa*).
     - **Col·lectiu/Grup:** Organització comunitària, xat lliure de soroll amb «Enviar a Notes».
     - **Pàgina de Poble («Gent de la Torre»):** Àgora veïnal (Mur, Mercat, Agenda d'actes, Calendari Agrícola).
2. **Assessorament sobre el Dilema de la Targeta (`UniversalCard` vs Portada):**
   - Assessorar el Mestre amb una anàlisi rigorosa: com combinar la llibertat de format de la portada de l'usuari (panoràmica, vertical, quadrada) amb la visualització a les targetes del Mur i del Mercat sense trencar la graella matemàtica de Pedra Seca (proporció fixa a la card amb letterbox/fons vs flexibilitat controlada).
3. **Accessibilitat i Pedra Seca:** Assegurar ús estricte dels tokens canònics (`#0F672F` verds de poble, tipografies i targetes de Pedra Seca).

### Tasca 3 (Codex Sol Ultra - Crític Implacable i Seguretat RLS): Blindatge de Dades i DTOs
1. **Auditoria de `listPublicOrganizations` i RPC:**
   - Comprovar que el filtre per poble no té fallades silencioses ni injecta dades privades de gestors/propietaris.
2. **Concurrència i Gestió de Membres:**
   - Auditar que la gestió de membres de grups/empreses (`GestioMembres.jsx`) només és editable pels administradors legítims de l'organització.
3. **Persistència de Formats d'Imatge (Principi de T46):**
   - Verificar si el re-enquadrament multiformat es «cou» directament a la imatge recodificada al client (sense necessitat de migracions d'esquema SQL al backend) o si cal algun camp addicional.
4. **Matriu MCR:** Emetre la taula de conformitat del torn.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

1. **Desalineació de DTOs:** Items retornats per `itemsPublicatsDe` han de ser compatibles amb `<VistaPublicacionsDeLActor>`.
2. **Regressió a la suite pre-commit:** Cap canvi d'UI pot trencar els 151 fitxers de proves de `npm run test:precommit`.
3. **Soroll conceptual:** No inventar camps institucionals municipals; centrar-se exclusivament en la gent del poble.

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
- [[261024_2230_pla_implementacio_logica_actors_i_disseny_interior_pedra_seca]]
- [[261024_1945_acta_marmota_triomf_commit_472f704d0_fortificacio_i_obertura_gauntlet]]
- [[sdp-estudi-mercat/SKILL]]
- [[sdp-casos-us-essencials/SKILL]]
- [[sdp-pedra-seca/SKILL]]

