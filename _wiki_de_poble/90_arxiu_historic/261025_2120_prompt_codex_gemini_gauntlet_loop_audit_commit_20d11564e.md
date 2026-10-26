---
type: prompt
status: esborrany
description: Prompt d'auditoria adversarial extrema per a Codex Sol Ultra i Gemini 4 Argon sobre els 52 fitxers del commit 20d11564e
tags:
  - govern
visibility: private
reflex: sdp:torn_4ff4e4ec-e4ea-4519-b971-253fb157c26f:38cf65d7-b5c4-4b08-8f6b-55f2fdcf48d4
---
# Gauntlet Loop Post-Commit 20d11564e: Auditoria Implacable de Codex i Gemini sobre l'Obra de Claude

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` té únicament els documents vius de la sessió actual. Porta Olivera verificada en codi 0.
- [x] **Commit de Claude aplicat a HEAD**: Commit `20d11564e` consolidat a la branca `backup-notes-publish` (52 fitxers modificats, +2.109 / -1.625 línies).
- [x] **Bateria de proves verdes**: `npm run test:precommit` passant **3.410 proves en verd** (3.151 Vitest + 259 Node, 0 fallades) en 22 segons.
- [x] **Llibre Mestre consultat i referenciat**: `04_escriptori/03_llibre_mestre_tasques_i_idees.md` actiu amb les 31 idees vives i les files de deutes actualitzades.
- [x] **Rebut de torn obtingut**: sdp:torn_4ff4e4ec-e4ea-4519-b971-253fb157c26f:38cf65d7-b5c4-4b08-8f6b-55f2fdcf48d4.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4ff4e4ec-e4ea-4519-b971-253fb157c26f:38cf65d7-b5c4-4b08-8f6b-55f2fdcf48d4 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T20:20:36.049Z |
| Modificació | 2026-10-25T21:20:00.000Z |
| Propietari | MarIA |
| Aprovació humana | en revisió pel Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | Antigravity 2.0 (IAIA MarIA) |
| Tokens consumits | ~4.800 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-25T20:20:36.049Z: esborrany canònic creat amb obertura de torn `torn_4ff4e4ec-e4ea-4519-b971-253fb157c26f`.
- 2026-10-25T21:20:00.000Z: redactat el prompt per a l'auditoria adversarial extrema en Gauntlet Loop de Codex Sol Ultra i Gemini 4 Argon sobre el commit `20d11564e` de Claude.

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

Convoquem a **Codex Sol Ultra** i **Gemini 4 Argon** per a activar el protocol de **Gauntlet Loop Adversarial Extrem** sobre l'obra completa executada per Claude Code al commit local `20d11564e` (branca `backup-notes-publish`).

Claude ha desplegat 52 fitxers (+2.109 / -1.625 línies) cobrint el xat d'àudio avançat, timeouts d'storage (45s), protecció de concurrència per època a Connectar (P1-15), retrocompatibilitat de blocs a WordPress 5.8-6.0, botó enrere natiu a Android (BOT-A9) i aïllament de memòria cau a Vite.

La directriu del Mestre Javi és rotunda: **Gasteu els vostres tokens al màxim, exploreu cada racó del sistema i busqueu sense pietat qualsevol defecte, escletxa, regressió silenciosa, fugida de memòria o vulnerabilitat que puga tindre el sistema.** Res d'aigua de colònia ni complaença: volem la veritat nua per a assegurar la solidesa de 10/10 abans de considerar qualsevol pujada a producció.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Dissecció Forense del Commit `20d11564e`**:
   - Inspeccioneu l'arbre amb `git show --stat 20d11564e` i analitzeu el diff detallat dels 52 fitxers modificats.
   - Verifiqueu que cap canvi haja trencat el contracte neutral del backend (`src/data/backendPort.js`), la Llei de l'Enxufabilitat de Sollutia (Model B) ni la puresa dels Web Components.

2. **Auditoria de Concurrència i Resiliència (Connectar & Storage)**:
   - Examineu la guarda d'època de connexió a `src/sections/connectar/useTitularDeConnexio.js` i `GestioMembres.jsx`. Pot una resposta tardana d'un soci o canvi de xarxa corrompre l'estat local?
   - Examineu el timeout de 45 segons a `src/data/supabase/storage.js`. S'alliberen correctament els AbortControllers? Produeix memòria filtrada en pujades cancel·lades?

3. **Auditoria del Reproductor i Gravador d'Àudio del Xat (Pedra Seca & UX)**:
   - Analitzeu `src/sections/xat/components/AdjuntXat.jsx` i `ControlsAdjunt.jsx`.
   - Comproveu la gestió dels esdeveniments de reproducció exclusiva (`sdp-xat-reprodueix-veu`): hi ha casos límit on dos àudios puguen sonar simultàniament o quedar bloquejats?
   - Verifiqueu la persistència de posició (`tempsReproduccio`) i el canvi de velocitat (1x, 1.5x, 2x): com es comporta si el fitxer d'àudio falla o no té capçalera de duració?
   - Verifiqueu l'accessibilitat (ARIA, contrast, suport de teclat) i el comportament en dispositius mòbils.

4. **Auditoria de Perímetre: WordPress Plugin & Android Natiu**:
   - Auditeu `wordpress-plugin/includes/bloc/render.php` i `idioma.php`: és segur el render_callback per a WordPress 5.8-6.0? Hi ha risc d'injecció o manipulació d'atributs?
   - Auditeu `android/app/src/main/java/org/socdepoble/app/MainActivity.java`: la gestió del botó físic Back (BOT-A9) pot atrapar l'usuari en un bucle infinit en determinades rutes o WebViews?

5. **Execució de Proves i Detecció de Regressions**:
   - Executeu la suite completa: `npm run test:precommit` (3.410 proves).
   - Executeu les proves de ciberseguretat i integritat: `npm run audit:seguretat`, `npm run vigilant`, `node tooling/gates/porta-olivera.mjs` i `node tooling/gates/porta-autoritat.mjs`.
   - Creeu noves proves adversarials si trobeu escletxes no cobertes pels tests existents.

6. **Actualització del Llibre Mestre Permanent**:
   - Reviseu `04_escriptori/03_llibre_mestre_tasques_i_idees.md`.
   - Anoteu-hi qualsevol deute tècnic pendent, risc detectat o proposta de millora sorgida de l'auditoria.

7. **Emissió dels Informes Canònics d'Auditoria**:
   - **Gemini**: Genera `_wiki_de_poble/04_escriptori/261025_2120_auditoria_gemini.md`.
   - **Codex**: Genera `_wiki_de_poble/04_escriptori/261025_2120_auditoria_codex.md`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Complauença de les IAs**: Risc d'assumir que com que 3.410 tests passen en verd, no hi ha errors. El Gauntlet Loop exigeix cerca activa de fallades en condicions límit.
- **Trencament de la Frontissa de Sollutia**: Qualsevol import directe o acoblament que impedisca la lectura asíncrona GET de Sollutia és un bloquejador crític.
- **Zombis en memòria**: Comproveu que els listeners del DOM (`sdp-xat-reprodueix-veu`) es desconnecten en desmuntar els components per evitar fuites de memòria en converses llargues.
- **Bloqueig del Tancament**: Qualsevol procés de fons o cron ha de ser cancel·lat abans de finalitzar el torn.

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
