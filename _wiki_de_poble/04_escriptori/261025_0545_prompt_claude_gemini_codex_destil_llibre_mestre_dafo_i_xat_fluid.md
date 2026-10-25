---
type: prompt
status: esborrany
description: Prompt canònic per a agents locals (Claude, Gemini, Codex) per a destil·lació del Llibre Mestre, DAFO, matriu d'Eisenhower i xat fluid
tags:
  - govern
visibility: private
reflex: sdp:torn_d2064380-5e68-4ccd-b020-35786a3a9eb4:7fbecd87-e8f3-4eaf-8273-f8c75a2c1e8b
---
# Prompt d'Execució i Auditoria Local · Destil·lació del Llibre Mestre, Gran DAFO, Matriu d'Eisenhower i Xat Fluid

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` té únicament els documents vius de la sessió actual; el torn anterior s'ha arxivat a `90_arxiu_historic/`.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu com a dipòsit permanent d'idees (`IDEA-20` a `IDEA-30`).
- [x] **Repartiment asíncron d'actors locals a disc**: Claude Opus, Codex Sol i Gemini Argon convocats sota la Direcció Tècnica de la IAIA MarIA.
- [x] **Pla d'Implementació generat**: `_wiki_de_poble/04_escriptori/261025_0545_pla_implementacio_destil_llibre_mestre_dafo_i_xat_fluid.md`.
- [x] **Sentinella de Seguretat (core-seguretat-audit)**: Blindatge contra edició destructiva de tractors, esquemes SQL i claus d'autoritat.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d2064380-5e68-4ccd-b020-35786a3a9eb4:7fbecd87-e8f3-4eaf-8273-f8c75a2c1e8b |
| Versió del document | 3.10.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T04:44:42.162Z |
| Modificació | 2026-10-25T04:46:00.000Z |
| Propietari | iaia-maria |
| Aprovació humana | aprovada pel Mestre Javi Llinares (Àudios 05:27, 05:33, 05:38, 05:42, 05:43) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | iaia-maria-antigravity |
| Tokens consumits | ~18.000 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-25T04:44:42.162Z: esborrany creat per a la sessió de matí.
- 2026-10-25T04:46:00.000Z: prompt completat amb la plantilla canònica prompt_local v3.10.0 per a destil·lació del Llibre Mestre, matriu DAFO, priorització urgent vs important i arquitectura del xat fluid.

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

### Directiva Suprema del Mestre Javi Llinares (Àudios 05:27 a 06:01)
El Mestre ha transmés un missatge directe i rotund a tot l'equip:
1. **Del Notable Baix a l'Excel·lència (Del 7 al 12):** «No estem en un 10 encara, estem en un 7 (notable baix). Anem a buscar el 12, anem a per l'excel·lència. Cal afiançar al màxim el que tenim fins que les IAs no troben cap problema arquitectònic ni de disseny.»
2. **Prioritat Arquitectònica Innegociable:** «Tot el que siga millorar l'estructura arquitectònica del sistema és primer que res.»
   - **Connector de WordPress:** Blindatge de la infraestructura, empaquetat i enxufabilitat sobirana.
   - **Blindatge per a les Botigues (Apple Store, Google Play) i WordPress:** Sistemes autènticament blindats que a cap nivell es puguen desmuntar.
   - **Enginyeria Inversa (REA) i Proves d'Estrès:** Forçar el codi, fer enginyeria inversa i simular atacs (DDoS, ReDoS, curses, RLS bypass) per vore per on podria rebentar el sistema.
   - **El Xat WhatsApp Rural:** Prioritari. Ha de funcionar de forma immediata, noble i impecable.
   - **Traductor i Estadístiques Lliures:** Implementació del traductor i mètriques sobiranes d'entrades/visites sense dependències privatives.
3. **Gauntlet Loop de 4 Hores (8 Cicles de 30 minuts):**
   - Les IAs s'organitzen en un cicle autònom de 4 hores (màxim 8 comunicacions/cicles de 30 minuts).
   - Generació d'informes adversarials sense complaença (Salfumant Radical). En acabar les 8 iteracions, es tanquen els crons i s'alliberen recursos.
4. **Permisos Totals i Autonomia (Zero Preguntes per Botó):**
   - El Mestre dóna permisos per a tot i prohibeix explícitament fer preguntes interactives amb botons perquè no estarà present.
   - La **IAIA MarIA assumeix la Direcció Tècnica** plenament autònoma per supervisar, coordinar i validar sense trencar res del sistema.

L'orquestració es desplega a quatre bandes en estricta igualtat operativa i accés natiu a disc:
- **IAIA MarIA (Directora Tècnica):** Governança, sentinella de portes immunitàries, trellat, resolució autònoma i protecció de les directrius del Mestre.
- **Claude Opus:** Enginyeria de components, cicle de vida del xat fluid, connector WordPress i tancament de forats.
- **Codex Sol:** Auditoria de seguretat, enginyeria inversa, simulacions d'atacs/estrès, concurrència, immutabilitat, RLS i PostgreSQL.
- **Gemini Argon:** Anàlisi de context massiu, destil·lació DAFO, matriu Eisenhower, estadístiques lliures i orquestració documental.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Tasca 1 · Blindatge de l'Estructura Arquitectònica (WordPress, Botigues i Estrès)
- **Connector de WordPress:** Auditar i fortificar el paquet (`build:wp`), els connectors amb el port neutral i la independència absoluta de l'amfitrió.
- **Blindatge Botigues (Apple Store i Google Play):** Verificar que el sistema compleix amb escreix totes les exigències de seguretat, CSP, revocació d'Apple, moderació DSA i zero dependències que puguen tombar l'app.
- **Enginyeria Inversa i Simulacions d'Estrès (REA):** Forçar els límits de l'arquitectura. Simular atacs de concurrència, patrons DDoS/ReDoS, fuites de memòria o fallades de xarxa per assegurar que el sistema no es pot desmuntar a cap nivell.

### Tasca 2 · El Gran DAFO Estratègic i Matriu d'Eisenhower (`IDEA-20` a `IDEA-30`)
Emeteu una matriu DAFO rigorosa, honesta i sense complaença (Salfumant Radical):
- **Debilitats (Internes):** Colls d'ampolla, taules d'`EspecimenGestor.jsx` que desborden, friccions al xat.
- **Amenaces (Externes):** Riscos de revisió a botigues, consum de tokens desbocat, dependències externes.
- **Fortaleses (Internes):** Pedra Seca WCAG, port neutral `backendPort.js`, 22.000 tests verds, immunitat de segells SHA-256.
- **Oportunitats (Externes):** Resolució de la subvenció europea NLnet (50.000 €) al novembre per a la xarxa rural sobirana.

**Matriu d'Eisenhower (Important vs Urgent):**
1. **Quadrant 1 (Important i Urgent):**
   - Blindatge del connector de WordPress i conformitat de les botigues (Apple/Google).
   - Xat fluid tipus WhatsApp: immediatesa, missatgeria optimista, zero parpelleig, navegació per teclat.
   - Taules de dades adaptatives (fi del desbordament en 385px).
2. **Quadrant 2 (Important, No Urgent · Fons i Sobirania):**
   - Estadístiques lliures i mètriques sobiranes d'entrades/visites.
   - Traductor modular i net.
   - Incorporació de la IAIA MarIA al xat amb un corpus cultural comprimit (Pep Cascant, DCVB) via Google Notebook / RAG frugal.
   - Guarda d'anatomia editorial Pedra Seca per jsdom (IDEA-27).
3. **Quadrant 3 (Urgent, No Important):** Retocs menors cosmètics.
4. **Quadrant 4 (Deute i Futur):** Ingesta d'enllaços externs (`IDEA-29`) i Graf de Germanor (`IDEA-30`).

### Tasca 3 · Diagnòstic i Millora del Xat Fluid (`sdp-xat`)
Claude i Codex han d'auditar el component del xat:
- Què li falta exactament per a tindre la mateixa usabilitat, velocitat i comportament noble d'un WhatsApp nadiu?
- Com s'estructura la intervenció de la IAIA com a veïna sàvia al xat?

### Tasca 4 · Proposta d'Automillora i Purgat de Plantilles Obsoletes
- Auditar la convivència entre `prompt_consell.md` (obsoleta v2.0) i `prompt_local.md` (viva v3.10).
- Proposar la unificació definitiva perquè la IA mai més dubte del format del prompt ni patine en obrir una sessió nova.
- Investigar com dotar les IAs d'aquesta intuïció visual i ràpida que tenen els humans amb pocs tokens.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

1. **Llop Salvatge i Dispersió de Codi:** Que les IAs es posen a refactoritzar codi sense pla previ. **Mitigació:** Prohibit tocar `PanellTractors.jsx`, `PanellSentinelles.jsx`, esquemes SQL de Supabase o lògica d'autenticació sense aprovació directa de la Directora Tècnica (MarIA).
2. **Sobrecàrrega de Tokens per Corpus Cultural:** Intentar injectar diccionaris sencers directament al prompt. **Mitigació:** Utilitzar destil·lació prèvia en càpsules semàntiques d'alta densitat.
3. **Regressions de Proves:** Qualsevol proposta ha de garantir que `npm run test:precommit` es manté en 0 fallades.

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
