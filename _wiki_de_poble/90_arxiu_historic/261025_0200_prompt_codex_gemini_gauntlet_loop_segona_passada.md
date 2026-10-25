---
type: prompt
status: esborrany
description: Prompt per a la segona passada de revisió adversarial extrema de Codex i Gemini sobre el diff consolidat de Claude, taules de contracte, pre i dualitat de destí opt-in
tags:
  - govern
visibility: private
reflex: sdp:torn_6d0101fb-aef7-4431-9d37-c459ecc2b325:6ea0765b-32bb-4a13-b9e9-3320c516dce3
---
# Prompt Gauntlet Loop Segona Passada · Auditoria Adversarial Extrema de la Reforma Editorial, Ritme Apple HIG i Destí Dual

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

1. Commit base: HEAD 1c110f954 + diff consolidat de Claude al worktree.
2. Informe complet de Claude: `_wiki_de_poble/04_escriptori/261025_0200_implementacio_claude.md`.
3. Servidor actiu a `http://localhost:3340` (HTTP 200 OK).
4. Porta Olivera en codi 0.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_6d0101fb-aef7-4431-9d37-c459ecc2b325:6ea0765b-32bb-4a13-b9e9-3320c516dce3 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T03:29:32.009Z |
| Modificació | 2026-10-25T03:32:00.000Z |
| Propietari | iaia-maria |
| Aprovació humana | aprovat pel Mestre Javi (Àudios 04:26 i 04:29) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | iaia-maria-antigravity |
| Tokens consumits | ~12.000 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-25T03:29:32.009Z: esborrany creat des del circuit documental.
- 2026-10-25T03:32:00.000Z: instrucció consolidada per a la segona passada de revisió adversarial extrema a càrrec de Codex i Gemini sobre el lliurament complet de Claude.

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

### Gauntlet Loop Segona Passada: Auditoria Adversarial Màxima
El Mestre Javi Llinares ordena literalment (Àudios 04:26 i 04:29):  
*«Que Claude està esperant la segona revisió adversarial? Doncs anem a donar-li-la, no ens anem a quedar a mitges! Fes-me un bon prompt per a Gemini i Codex i que la revisen a lo bèstia, que ho facen bé, Gauntlet Loop total i màxim!»*

Claude acaba de lliurar el seu treball complet a l'arbre de treball i ha emés el seu informe detallat a:  
👉 `_wiki_de_poble/04_escriptori/261025_0200_implementacio_claude.md`

Aquesta segona passada ha d'auditar de manera implacable el diff consolidat de Claude respecte a HEAD `1c110f954`, contrastant:
1. **La resolució efectiva de les troballes de la 1a passada:** `C0200-01` (kit.js validant `tipus`), `C0200-02` (nota del xat personal amb barret d'entitat), `C0200-05` (correcció de tokens), `C0200-06` (desbloqueig d'entitat A ➔ entitat B amb administradora comuna), i `G0200-01`..`04`.
2. **La nova migració `supabase/migrations/2610250300_titular_public.sql`:** Auditoria forense de privacitat estricta, concurrència, funcions `titular_public()`, consentiment opt-in de la propietària i bloqueig de fuites d'identitat.
3. **La doctrina de Pedra Seca i Ritme Apple HIG (`IDEA-26`, `IDEA-27`):**
   - Espaiat de 16px de capçal a text i 40px entre fitxes del catàleg.
   - La nova primitiva `Accions` (centrada, 24px del text).
   - L'embolcall de la taula de contracte (`sdp-especimen__contracte` amb scroll contingut i `white-space: nowrap` als noms de props).
   - La contenció de desbordament a blocs `<pre>` (`:where(pre)` amb `overflow-x: auto; max-width: 100%;` i `--sdp-font-mono`).
4. **La troballa directa del Mestre (Àudio 04:29): Erradicació del filet puntejat `border: 1px dashed` i línies divisòries:**
   - Ja executat per l'orquestradora: `.sdp-especimen__viu` reposa sobre fons noble de targeta (`var(--sdp-fons-targeta)`) i s'ha eliminat el `border-top` que envaïa l'espai damunt de l'H3. Verificar en viu.
5. **🔥 MANDAT SUPREM DEL MESTRE (Àudio 04:45): El desbordament i contrast de les taules (`estructura-gestor`):**
   - **El fall de disseny:** A `/disseny?categoria=estructura&item=estructura-gestor` (i a qualsevol taula de contingut), les taules (`<table>`) desborden la columna dreta, es tallen de forma lletja i trenquen tota l'harmonia visual de la pàgina.
   - **Scroll horitzontal obligatori:** Cap taula pot eixir-se'n del seu contenidor: cal assegurar desplaçament horitzontal contingut (`overflow-x: auto; overscroll-behavior-inline: contain; max-width: 100%;`) per a tota taula (`sdp-taula` o `:where(table)`).
   - **Contrast cromàtic i jerarquia:** El Mestre adverteix literalment: *«el color es tan el mismo que se funde con el otro, no lo veo claro»*. Cal auditar el contrast entre `thead th`, files parelles (`tbody tr:nth-child(even)`), files imparelles i vores, assegurant una lectura neta on la vista descanse.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### Per a Codex (Auditoria Forense SQL, Contractes i Taules):
1. **Forense de la migració `2610250300_titular_public.sql`:**
   - Verificar la guarda de bloquejos (`pg_locks` / `pg_stat_activity` o error 42P01 reportat per Claude a PGlite).
   - Verificar que `titular_public` complix les 5 condicions de privacitat (owner confirmat, opt-in explícit, perfil públic, sense baixa, entitat pública) i no filtra correus d'accés ni UUIDs privats a tercers.
2. **Contracte del Port i Kit de Conformitat:**
   - Validar que `src/data/conformitat/kit.js` ara sí rebutja objectes de `quiEmSegueix` sense camp `tipus` o amb tipus invàlid (`C0200-01`).
   - Comprovar que `backendPort.js` i els adaptadors local/remot preserven la paritat de capacitats `titularPublic` i `consentimentTitular`.
3. **Mètriques de Precommit i Suites:**
   - Executar i mesurar `npm run test:precommit` i auditar els temps reals de paret sense concurrència externa.
4. **Auditoria de Taules al Codi:**
   - Auditar l'ús de `<table>` nu a tots els detalls del catàleg (`EspecimenGestor.jsx`, etc.) i proposar o implementar la seua contenció amb el component accessible `Taula` o amb una regla global resilient a `:where(table)`.

### Per a Gemini (Auditoria Visual en Viu amb Chrome DevTools MCP):
1. **Verificació en viu a `http://localhost:3340` (Viewport 1280×800 i 375×812):**
   - **🔥 EL DESBORDAMENT DE LES TAULES (Prioritat 1):** Anar a `/disseny?categoria=estructura&item=estructura-gestor`. Mesurar com les taules «Mides», «Amplades de columna» i «Colors i profunditat» sobrepassen la columna de 385px. Dictaminar la solució perquè tinguen scroll horitzontal contingut i proposar la millora de contrast cromàtic perquè les files i capçaleres no es fonguen en una massa confusa.
   - **Taules de contracte:** Anar a `/disseny?categoria=fonaments&item=fonaments-publicacions-actor` i comprovar que a columnes estretes (385px) el codi no es trosseja per síl·labes i que l'scroll està contingut.
   - **Blocs `<pre>`:** Anar a `/disseny?categoria=estructura&item=estructura-universalworkspace` i verificar que cap bloc `<pre><code>` desborda per la dreta.
   - **Netedat visual de Pedra Seca:** Comprovar a `/disseny?categoria=estructura&item=estructura-arbre` i `estructura-shell` que la línia divisòria (`border-top`) damunt de l'H3 ha desaparegut i que el fons de la caixa és blanc noble.
2. **Pàgina `/connectar` en viu:**
   - Entrar en mode llavor (`/registre` ➔ Entra com a persona de prova) i comprovar el comportament de «Connectar com a», la no exposició de xat propi i el selector de destinació dual amb opt-in.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

1. **Risc de regressió per desbordament:** Verificar que cap canvi d'scroll horitzontal a taules o `<pre>` genere barres de desplaçament a la finestra global o a l'arbre principal de l'aplicació.
2. **Risc de fuga de privacitat:** Assegurar que la titular pública siga estrictament `opt-in` voluntari i mai activat per defecte.
3. **Risc de sediment:** Confirmar que les portes Olivera i Document mantenen codi 0 i zero processos orfes en finalitzar.

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
