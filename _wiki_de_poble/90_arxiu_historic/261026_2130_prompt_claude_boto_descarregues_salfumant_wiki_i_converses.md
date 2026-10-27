---
type: prompt
status: esborrany
description: 'Prompt mestre per a Claude Opus 5.5: creació del botó i pàgina Card de Descàrregues, salfumant wiki de 226 enllaços i calibratge visual converses.'
tags:
  - govern
visibility: private
reflex: sdp:torn_409a64e5-477b-454c-b445-4e0c42a28d83:929451a1-191c-4e5b-a814-9e5cb40b087d
---
# Prompt Claude — Botó i Pàgina Card de Descàrregues, Salfumant Wiki i Converses WhatsApp

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- **Porta Olivera:** Verda (codi 0). Escriptori netejat prèviament: els 7 documents consumits del torn 1615 s'han traslladat amb èxit a `_wiki_de_poble/90_arxiu_historic/`.
- **Pla d'Implementació Canònic:** Aprovat i vinculat a l'Escriptori: `_wiki_de_poble/04_escriptori/261026_2130_pla_implementacio_boto_descarregues_salfumant_wiki_i_converses.md`.
- **Artefactes Multimèdia Disponibles:** Imatge mestre generada amb el Nano seguint l'escola Bruguera/Berlanga: `public/assets/uploads/brain/nano_descarregues_app.webp` (i còpia física a `_wiki_de_poble/04_escriptori/01_produccio/nano_descarregues_app.webp`).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_409a64e5-477b-454c-b445-4e0c42a28d83:929451a1-191c-4e5b-a814-9e5cb40b087d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-26T20:29:02.092Z |
| Modificació | 2026-10-26T20:35:00.000Z |
| Propietari | MarIA (Directora Tècnica) |
| Aprovació humana | aprovat (Mestre Javi Llinares, en àudio d'instruccions 261026_2126) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | Claude Opus 5.5 (Destinatari) + Codex / Gemini (Auditors) |
| Tokens consumits | ~3.000 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-26T20:29:02.092Z: esborrany creat via tooling canònic.
2026-10-26T20:35:00.000Z: prompt completat per a coordinar la implementació a càrrec de Claude Opus 5.5.

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

Hola Claude! La missió prèvia de Share Target natiu i notificacions ha estat un èxit rotund (commit `d83188d2` amb 3.627 proves verdes). En aquest torn, el Mestre Javi Llinares ha establert una nova gran funcionalitat i un encàrrec de neteja radical del deute tècnic:
1. **La Gran Novetat:** Posar un nou botó destacat damunt de `[ Connectar-se ]` i `[ Registrar-se ]` a la pantalla d'accés del Xat que òbriga la **pàgina Card de Descàrregues**, la qual també s'integra com a pàgina de sistema canònica (`SYSTEM_PAGES`) al Mur (`/mur`). La il·lustració mestre de la Card ja ha estat generada per la IAIA MarIA amb el Nano seguint l'escola Bruguera/Berlanga (`public/assets/uploads/brain/nano_descarregues_app.webp`).
2. **Salfumant Radical a la Wiki (Zero `--no-verify`):** Sanar els 226 enllaços trencats històrics a `_wiki_de_poble/10_actes/` per aconseguir que el hook precommit i `tancament.mjs --check` isquen amb codi 0 net sense ometre cap verificació.
3. **Pla de Notes (§5 i §6):** Reestructurar el calaix de Taula de Continguts (TOC H1–H6) de Notes amb respiració sota la barra negra de 58px i icones coherents a la barra d'eines.
4. **Calibratge Visual de Converses de WhatsApp (`P1-36` i `P1-37`):** Targetes a 96px (`2 × 48px`), avatars grans de 74–76px, apropar títol i últim missatge, extirpar el botó inventat `[...]` de la Fila 1 i selecció per *Long Press*, mantenint el desplegable de cerca existent a `FiltreConverses.jsx`.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Tasca 1: Botó i Pàgina Card de Descàrregues
- **Botó a `AccesAlXat` (`src/sections/xat/XatSection.jsx`):**
  - Damunt dels botons `[ Connectar-se ]` i `[ Registrar-se ]`, afegir un botó d'amplada completa o destacat: `[ Descarrega l'App ]` (amb classe píndola o botó Pedra Seca, alçada tàctil de 48px i navegació a `/page/descarregues` o `/descarregues`).
- **Definició a `SYSTEM_PAGES` (`src/config/systemPages.js`):**
  - Afegir `{ key: 'descarregues', isAvis: false, href: '/page/descarregues', accio: null }`.
  - Actualitzar els tests associats a `systemPages.test.js` i `personalitzacio.test.js`.
- **Contingut a `PAGE_COPY` (`src/sections/text/pageContent.js`):**
  - Crear `PAGE_COPY.descarregues` amb data actual ISO, títol «Descàrregues i Aplicacions», subtítol, lead, i la imatge `/assets/uploads/brain/nano_descarregues_app.webp` (`imageAlt`, 1024×1024, `imageFetchPriority: 'high'`).
  - Contingut HTML enriquidor:
    - *Android:* Google Play i APK directe.
    - *iOS:* Apple TestFlight i App Store.
    - *Ordinador:* Web Nadiua / PWA instal·lable des del navegador.
    - *Visió d'Arquitectura:* Explicació diàfana que hui l'app és online-first amb Supabase per a la sincronització, però té vocació i preparació arquitectònica per a esdevindre un sistema autònom i offline complet en el futur (Pedra Seca / CRDT).
- **Ruta a `src/app/App.jsx`:**
  - Assegurar que `/descarregues` és un àlies directe a `/page/descarregues`.
- **Traduccions:** Afegir la clau `section.xat.sessio.descarregar` a `src/config/idiomes/ca.js` i fitxers de llengua corresponents.

### Tasca 2: Salfumant Radical a la Wiki i SCC (Zero `--no-verify`)
- Executar `node tooling/wiki/compile-wiki-to-app.mjs --check --strict` i `node tooling/gates/tancament.mjs --check`.
- Identificar els 226 enllaços històrics trencats a `10_actes/` (cap a fitxers arxivats a `90_arxiu_historic/`).
- Reparar les àncores o reapuntar-les canònicament (`[[../90_arxiu_historic/...]]` o corregir el slug) de manera que `tancament.mjs --check` isca amb codi 0 i mai més calga utilitzar `--no-verify` al commit.

### Tasca 3: Taula de Continguts (§5) i Icones de Notes (§6)
- **TOC H1–H6:** Al calaix desplegable de la Taula de Continguts de Notes, aplicar respiració superior sota la barra negra de 58px i aplicar els tokens de color de Pedra Seca.
- **Icones de Notes:** Harmonitzar les icones de la barra d'eines (format, encapçalaments, llistes) assegurant un sòl tàctil de 48px i contrast net.

### Tasca 4: Calibratge Visual de Converses de WhatsApp (`P1-36` i `P1-37`)
- **Targetes de Conversa:** Normalitzar l'alçada a 96px (`2 × 48px`), avatars grans de 74–76px (o respiració proporcionada).
- **Tipografia:** Apropar títol de la conversa i darrer missatge (`margin-bottom: 2-4px`).
- **Comportament:** Eliminar el botó `[...]` de la Fila 1 i habilitar el menú contextual per *Long Press*.
- **Cerca:** Mantenir la icona `ListFilter` i el desplegable (`Tot`, `No llegits`, `Preferits`, `Grups`) a la mateixa línia de la caixa de cerca a `FiltreConverses.jsx`.

### Tasca 5: Tractor Cognitiu i Baremador de Consistència Visual del Nano (`P1-41`)
- **Desenvolupament del Baremador:** Implementar el tractor de validació i baremació `tooling/media/baremador_nano.mjs` (i l'arrel de dades `.agents/qualificacions_nano.json`):
  - Permetre al Mestre avaluar de l'1 al 10 qualsevol imatge del Nano.
  - Registrar de forma estructurada els motius de rebuig:
    * `IDIOMA`: Rebuig immediat si conté text no valencià (castellà, italià o pseudotext). El prompt del Nano ha d'incorporar per defecte la regla «Zero Text Rule» («Strictly NO text, NO speech bubbles, NO words»).
    * `ENQUADRAMENT`: Rebuig immediat si genera marcs blancs de vinyeta o vores exteriors. L'obra ha de ser sempre a sang (*FULL BLEED* al 100%).
    * `HUMOR_GAG`: Rebuig categòric d'estampes idíl·liques i somriures asèptics («estil Testimonis de Jehovà»). Exigir gags visuals, contraposició d'extrems (alta tecnologia vs ruralitat arcaica) i màquines impossibles estil Professor Bacteri d'Ibáñez.
    * `ESTIL`: Triar exclusivament entre els 3 registres canònics: Còmic Gamberro, Cyberpunk Rural de Pedra Seca, o Fotografia Panoràmica Realista.
  - El baremador ha de servir per a auditar la consistència dels prompts i alimentar l'automillora contínua de les generacions visuals.

### Tasca 6: Verificació Integral
- Executar `npm run test:precommit` i assegurar que les 3.627+ proves passen verdes al 100%.
- Executar `npm run porta:olivera` i verificar codi 0.
- Executar `npm run tancar -- --check` i verificar codi 0 sense cap omissió.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

1. **Tests de `SYSTEM_PAGES` i `PAGE_COPY`:**
   - Si no s'actualitzen les assercions que compten o llisten les claus de `SYSTEM_PAGES` a `systemPages.test.js` o `personalitzacio.test.js`, els tests de política fallaran. Cal mantindre la suite de proves sincronitzada.
2. **Edició de la Wiki:**
   - La reparació d'enllaços s'ha de fer amb la màxima cura, preservant la integritat del text i de la memòria històrica. Utilitzar el tooling o scripts de sanejament si és possible.

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
- [[261026_2130_pla_implementacio_boto_descarregues_salfumant_wiki_i_converses]]
- [[261026_2115_acta_marmota_triomf_gauntlet_share_target_commit_d83188d2_i_relleu_rea]]

