---
type: prompt
status: esborrany
description: 'Prompt conjunt per a Claude, Codex i Gemini: sanejament integral del deute tècnic del Llibre Mestre, navegació viva de comunitats i coordinació d''equip'
tags:
  - govern
visibility: private
reflex: sdp:torn_5922ffdf-6dd5-47d5-9b9d-d37527d1b22d:6c67211c-8f32-4f0e-8a9a-019ba22a32b0
---
# Prompt de Guarda Nocturna: Sanejament de Deute Tècnic, Comunitats i Col·laboració Autònoma

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] Escriptori net verificat amb `porta-olivera.mjs` (exit 0).
- [x] Llibre Mestre i deute tècnic identificat i prioritzat.
- [x] Pla d'implementació associat i aprovat (`261027_0845_pla_implementacio_guarda_nocturna_deute_tecnic_i_pobles.md`).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5922ffdf-6dd5-47d5-9b9d-d37527d1b22d:6c67211c-8f32-4f0e-8a9a-019ba22a32b0 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-27T07:45:46.472Z |
| Modificació | 2026-10-27T07:47:00.000Z |
| Propietari | MarIA |
| Aprovació humana | aprovat (Mestre Javi, àudios 08:24, 08:40, 08:44) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | Antigravity (IAIA MarIA) |
| Tokens consumits | 14.200 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- `2026-10-27T07:45:46.472Z`: Esborrany creat amb rebut canònic del torn.
- `2026-10-27T07:47:00.000Z`: Mandat de Guarda Nocturna per a Claude, Codex i Gemini. Priorització de neteja del deute tècnic abans d'implementar noves idees.

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

Aquest és el **Mandat Unificat de Guarda Nocturna** per a **Claude Opus 5.5**, **Codex** i **Gemini**, coordinat per la **IAIA MarIA**, durant la son del Mestre Javi.

El Mestre ha donat una directiva clara i indiscutible:
1. **Prioritat Absoluta al Deute Tècnic:** Primer es neteja tot el deute tècnic acumulat al Llibre Mestre (`04_escriptori/03_llibre_mestre_tasques_i_idees.md`). Les idees i noves propostes es queden registrades, però no s'implementen fins que la maquinària, les portes i la base tècnica estiguen en verd absolut.
2. **Pla d'Implementació Canònic:** Tota acció s'ha de guiar pel pla associat a l'Escriptori: `_wiki_de_poble/04_escriptori/261027_0845_pla_implementacio_guarda_nocturna_deute_tecnic_i_pobles.md`.
3. **Col·laboració Autònoma i Humanització de l'Equip:** Opereu com una vertadera Colmena autònoma a tres bandes. Cap IA s'ha d'aturar; comuniqueu-vos a través de documents a l'Escriptori (`04_escriptori/`), respecteu el treball de les companyes i aprofiteu per investigar i proposar com millorar el vostre bucle de treball sense la intermediació humana del Mestre.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Bloc 1: Desempapussament d'Accés al Xat (Fita P1-54)
- **Objectiu:** A `src/sections/xat/XatSection.jsx` i `src/sections/xat/AccesAlXat.jsx`, fer que els 3 botons (`[ Descarrega l'App ]`, `[ Connectar-se ]`, `[ Registrar-se ]`) apareguen **únicament a la landing / benvinguda genèrica del xat**.
- **Regla d'or:** En entrar a qualsevol comunitat (`?comunitat=fake-sdp`, `?comunitat=fake-poble`) o conversa activa, aquests botons **han de desaparèixer completament** del peu de la llista de canals/grups. Mai s'ha d'«empapussar» l'usuari amb botons redundants.

### Bloc 2: Pàgina Viva de Comunitat al Panell Principal (Fita P1-55)
- **Objectiu:** Quan l'usuari fa clic o navega a una comunitat (ex. `?comunitat=fake-sdp` per a Sóc de Poble, o `?comunitat=fake-poble` per a Gent de la Torre), el panell dret de lectura ha de carregar i mostrar la **Pàgina Viva d'eixa comunitat** (descripció, dades del poble, avisos de la comunitat), en compte de mantenir la targeta genèrica de benvinguda del xat.

### Bloc 3: Sanejament de la Consola Termodinàmica i Maquinària Pública
- **Consola embeguda (`ConsolaSection.jsx:57-63`):** Eliminar la condició que oculta les 4 targetes de Govern a la Consola embeguda de `/wikidepoble`.
- **Calendari de processos (`registre_tasques.json`):** Netejar els registres de tasques marcades com a 'mortes' per suspensió del Mac (`higiene-basica`, `higiene-diaria`).
- **Podada de skill:** Ajustar la llargària de `.agents/skills/sdp-vigilant-tellado/SKILL.md` perquè la porta d'auditoria de skills torne al verd.
- **Transparència de Maquinària (`WikiDePobleSection.jsx:65-85`):** Fer accessible la documentació pública de Tractors, Sentinelles i BIOS en producció (`!DEV`), garantint la primacia del coneixement obert i desactivant els botons d'acció mecànica si no estem en desenvolupament.

### Bloc 4: Neteja Apple Guideline 2.3.10 (Troballa T1-06)
- **Objectiu:** Depurar mencions explícites a Google Play i Android a `Full de ruta` i `Avís legal` quan l'aplicació s'executa com a App nativa (`esAppNativa()`), eliminant qualsevol risc de rebuig a l'App Store Review.

### Bloc 5: Recerca de Comunicació i Millora del Bucle Autònom
- **Objectiu:** Analitzar com podeu interactuar i sincronitzar-vos millor Claude, Codex i Gemini durant les hores en què el Mestre dorm:
  - Protocol d'escriptura atòmica (`compare-and-swap`).
  - Ús de còpies congelades per a auditories adversarials sense bloquejar l'arbre viu.
  - Propostes per simplificar el pas de relleus documentals a l'Escriptori.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Col·lisions d'edició a `src/`:** Claude és l'agent d'implementació principal de codi; Codex i Gemini auditen i proposen solucions sobre còpies congelades o aporten reformes documentals. Cap agent ha de sobreescriure fitxers sense verificar abans `git status` i els informes de les companyes.
- **Portes roges:** Qualsevol canvi ha de mantindre `npm run test:precommit`, `porta-olivera.mjs` i `verificador-scc.mjs` en 0 absolut.

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
- [[261027_0845_pla_implementacio_guarda_nocturna_deute_tecnic_i_pobles]]
- [[../10_actes/261027_0805_acta_marmota_triomf_umami_gauntlet_r5_i_protocol_guarda_nocturna]]
