---
type: prompt
status: esborrany
description: 'Prompt executiu per a Claude: erradicació del doble scroll en Dialeg, selector compacte de proporcions en retall i adaptabilitat de finestres emergents.'
tags:
  - govern
visibility: private
reflex: sdp:torn_bfb7558b-37b2-4828-b258-fc5b181dc76f:f99c1dba-bf1c-48bd-86f3-dc68d32ef0de
---
# Disseny aplicat a la usabilitat: erradicació del doble scroll i diàlegs adaptatius

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- **Pla d'implementació vinculat:** `_wiki_de_poble/04_escriptori/261025_0045_pla_implementacio_disseny_usabilitat_dialegs.md` (aprovat).
- **Auditoria de referència:** `_wiki_de_poble/04_escriptori/261025_0031_auditoria_codex.md` (Gauntlet Codex post-commit `47eb2fa00`).
- **Estat del repositori:** HEAD a commit `47eb2fa00` (70 fitxers consolidats, Vitest 2.959 + 259 Node nets, 0 fallades).
- **Directriu humana:** Àudios del Mestre 00:33, 00:35 i 00:36 («el disseny és com el soroll per a allò usable», fi del doble scroll, diàlegs que s'adapten al contingut quan hi ha espai, i selector compacte de retall).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_bfb7558b-37b2-4828-b258-fc5b181dc76f:f99c1dba-bf1c-48bd-86f3-dc68d32ef0de |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T22:40:18.872Z |
| Modificació | 2026-10-24T22:45:00.000Z |
| Propietari | IAIA MarIA |
| Aprovació humana | Mestre Javi Llinares (àudios 00:33, 00:35, 00:36) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | IAIA MarIA (Antigravity) |
| Tokens consumits | ~18.000 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-24T22:40:18.872Z: esborrany creat des de la plantilla canònica viva.
2026-10-24T22:45:00.000Z: prompt executiu completat per a Claude, enfocat a la usabilitat i el disseny dels diàlegs, erradicació del doble scroll, selector compacte de proporcions i resolució de la troballa P2 G-P11-01.

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

Claude, el Mestre Javi Llinares ha analitzat la interfície resultant de l'últim commit i ha donat una directriu visual i d'usabilitat fonamental:

> **«El disseny és com el soroll per a allò usable»**. Si una funcionalitat està feta i funciona tècnicament però visualment conté elements que destorben (dobles scrolls paral·lels, finestres encotillades a mitja pantalla que fan scroll quan hi ha espai de sobres, o selectors quilomètrics que empenyen el contingut essencial fora de la vista), esdevé confusa per als usuaris i dóna la sensació d'estar «mig trencada».

Tenim tres missions visuals clares d'usabilitat i una correcció preventiva de disponibilitat:

1. **Erradicació del Doble Scroll a `<Dialeg>`:** En qualsevol finestra emergent que continga més dades que l'alçària de la pantalla, actualment apareixen **dues barres d'scroll verticals paral·leles** (una al `<dialog>` natiu del navegador i una altra a `.sdp-dialeg__cos`). Açò s'ha d'eliminar de soca-rel: el diàleg arrel ha de tenir `overflow: hidden;` i només el cos intern (`.sdp-dialeg__cos`) ha de desplaçar-se netament amb un sol scrollbar.
2. **Finestres Adaptatives al Contingut (Zero Scroll si hi ha espai):** A pantalles d'escriptori o mitjanes, finestres com `SelectorVisibilitat` o el retall s'estaven encotillant a una alçària reduïda (per culpa de `margin: var(--sdp-alt-barres)` a `.sdp-dialeg--barra` o mides rígides), obligant a fer scroll quan per baix hi havia quilòmetres de pantalla lliure. Els diàlegs han de créixer orgànicament fins a allotjar el seu contingut i només fer scroll quan realment superen el viewport de la pantalla.
3. **Selector Compacte de Proporcions en el Retall (`DialegEnquadrament.jsx`):** El mode senzill de retall de capçalera actualment mostra una llista vertical de 9 opcions de ràdio de `GrupOpcions` amb explicacions individuals. Això obliga a fer scroll i fa desaparèixer el visor de la imatge de la pantalla! L'usuari ha de poder triar la proporció (1:1, 16:9, 4:3, etc.) veient la imatge en tot moment: cal substituir la llista vertical per una barra o graella compacta de pastilles/botons de format directament sota o al costat del visor, amb una sola línia dinàmica que explique la proporció activa.
4. **Troballa P2 de Codex (`G-P11-01`):** A `src/data/supabase/organizations.js`, `columnesDirectoriAbsents` és un Set global únic. Si una petició a un servidor antic falla amb `42703`, aquest Set bloqueja altres servidors nous vàlids. Cal acotar aquest registre per amfitrió/URL o permetre la seua neteja i aïllament.
5. **Reforma de la Pàgina de Connectar (`IDEA-22`, Àudios del Mestre 00:53, 00:54, 00:55):**
   - **Multirepresentació d'Actors:** Erradicar «les connexions són personals». Una empresa o grup es connecta com a tal (B2B rural). Dispositiu senzill a la mateixa pantalla per triar amb quin barret et connectes (Persona, Empresa o Grup) sense commutar la sessió global.
   - **Accés directe al Xat de l'Entitat:** Erradicar «Des d'ací encara no es pot arribar al xat d'esta entitat: parla directament amb qui l'administra». Donar accés net al xat privat o al canal de l'empresa per comentar i preguntar.
   - **Purga de «Administrar l'organització»:** Treure `BlocAdministrarOrganitzacio` de `/connectar`. Administrar organitzacions i gestionar membres interns pertany exclusivament al Workspace / panell intern (`DetallCompte` / `GestioMembres`).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Tasca 1 · Blindatge de `<Dialeg>` contra el doble scroll (`src/css/components.css`)
- A `.sdp-dialeg`: afegir `overflow: hidden;` (evita que l'estil natiu `dialog { overflow: auto }` del navegador active un segon scrollbar exterior).
- A `.sdp-dialeg__marc`: assegurar `display: flex; flex-direction: column; height: 100%; max-height: inherit; min-height: 0;`.
- A `.sdp-dialeg__cap`, `.sdp-dialeg__descripcio`, `.sdp-dialeg__peu`: assegurar `flex-shrink: 0;`.
- A `.sdp-dialeg__cos`: assegurar `flex: 1 1 auto; min-height: 0; padding: var(--sdp-space-4) var(--sdp-space-6); overflow-y: auto; overscroll-behavior: contain;`.

### Tasca 2 · Diàlegs adaptatius i fi de l'encotillament artificial (`src/css/modules.css` i `SelectorVisibilitat.jsx`)
- Revisar `.sdp-dialeg.sdp-dialeg--barra` a `src/css/modules.css`: evitar que el marge superior de 180px (`--sdp-alt-barres`) i la reducció dràstica de `max-height` esclafen el diàleg a mitja pantalla quan no és necessari.
- A `SelectorVisibilitat.jsx`: permetre que el diàleg respire amb una amplada i alçària còmodes perquè les dues targetes de selecció i els textos d'avís es mostren complets sense tallar-se ni provocar scroll innecessari a pantalles de més de 760px d'alçària.

### Tasca 3 · Selector compacte de formats a `DialegEnquadrament.jsx`
- Reemplaçar el `<GrupOpcions>` vertical de 9 ítems per un selector compacte horitzontal de pastilles o graella neta de proporcions (`.sdp-enquadrament__selector-formats`): botons d'un sol toc amb l'etiqueta curta (`1:1`, `16:9`, `4:3`, `3:2`, `21:9`, `3:4`, `4:5`, `9:16`, `Orig.`).
- El selector ha d'estar ubicat immediatament a la vora del visor (a sobre o a sota del control de zoom), de manera que el visor canvas estiga SEMPRE visible al 100% mentre l'usuari commuta de format.
- Mostrar una sola línia de didàctica dinàmica en temps real amb el text del format actualment actiu (sense abocar 9 paràgrafs simultanis).
- Canviar la mida del diàleg d'enquadrament de `mida="s"` a `mida="m"` (o adaptativa) per oferir espai d'aire.

### Tasca 4 · Aïllament de memòria de columnes per servidor (`G-P11-01` a `src/data/supabase/organizations.js`)
- Modificar el registre `columnesDirectoriAbsents`: en lloc d'un Set global que barreja tots els amfitrions, indexar-lo per la URL o identificador del backend efectiu (`backendUrl` o `supabaseUrl`), o netejar-lo quan canvia l'amfitrió.
- Afegir test de regressió per verificar que un error de columna en un host antic no bloqueja una crida posterior a un host que sí té la columna.

### Tasca 5 · Reforma de la Pàgina de Connectar (`IDEA-22` a `src/sections/connectar/`)
- A `ConnectarSection.jsx`:
  * Erradicar la frase `Actues com a ..., però les connexions són personals`.
  * Integrar selector/píndoles de l'actor que connecta (`Connectar com a: [Persona] [Entitat] [Grup]`), de manera que el seguiment s'emeta des de l'actor triat (permetent connexions B2B empresa↔empresa o grup↔empresa).
  * Purgar el muntatge de `<BlocAdministrarOrganitzacio>` de la vista `/connectar` (la gestió pertany exclusivament al Workspace / `DetallCompte.jsx`).
- A `BlocFormarPart.jsx`:
  * Eliminar el bloqueig `sense-xat` («Des d'ací encara no es pot arribar al xat...»); oferir botó directe per obrir el xat amb qui administra o el canal de l'entitat.

### Tasca 6 · Verificació i Suite de Proves
- Executar `npm test` sobre `Dialeg.test.jsx`, `SelectorVisibilitat.test.jsx`, `DialegEnquadrament.test.jsx`, `organizations.test.js`, `ConnectarSection.test.jsx`.
- Executar la bateria completa `npm run test:precommit` (<30s).
- Validar amb `node tooling/gates/porta-olivera.mjs`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Regressió en calaixos o pantalla completa:** Comprovar que `.sdp-dialeg--calaix` i `.sdp-dialeg--completa` mantenen el seu posicionament i dimensions sense interferència de `overflow: hidden;`.
- **Compatibilitat de tests de Snapshot o Selector:** Assegurar que els canvis a `DialegEnquadrament` no trenquen les proves existents que cerquen els botons del peu o l'atribut de format seleccionat.

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
- [[261025_0045_pla_implementacio_disseny_usabilitat_dialegs]]
- [[261025_0031_auditoria_codex]]
