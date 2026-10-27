---
type: prompt
status: esborrany
description: Encàrrec a Codex per a auditar implacablement la feina de Claude (Descàrregues, Wiki, Notes, Files de xat i Baremador Nano).
tags:
  - govern
visibility: private
reflex: sdp:torn_32274f5e-443f-44ef-ac0b-800844573d5c:deb4b1a8-3f58-4b37-a553-143a4489db5a
---
# Auditoria Adversarial Gauntlet de Claude Ronda 5

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude, Gemini, Codex) en estricta igualtat de condicions operatives amb accés natiu a disc.

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Aquest torn obri l'auditoria adversarial extrema (Gauntlet Loop) sobre els lliurables de Claude Opus 5.5 a la Ronda 5 i Ronda 6 (Torn `torn_51d1660b`), segons les directrius del Mestre Javi Llinares.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_32274f5e-443f-44ef-ac0b-800844573d5c:deb4b1a8-3f58-4b37-a553-143a4489db5a |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-27T04:37:22.085Z |
| Modificació | 2026-10-27T04:40:00.000Z |
| Propietari | agent-local |
| Aprovació humana | Aprovat pel Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.10.0) |
| Model IA | OpenAI GPT Codex / Google Gemini |
| Tokens consumits | Pendent de mesura al final del torn |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

- 2026-10-27T04:37:22.085Z: esborrany creat.
- 2026-10-27T04:40:00.000Z: instruccions tècniques de l'auditoria adversarial incorporades.

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

Auditar de manera implacable i adversarial (Gauntlet Loop) els cinc fronts de codi i arquitectura implementats i preparats per Claude Opus 5.5 al seu torn (vegeu l'informe `_wiki_de_poble/04_escriptori/261026_2150_auditoria_claude.md` i l'històric del Llibre Mestre). La vostra missió és trobar vicis ocults, regressions, trencaments de contracte, sobreenginyeries o fragilitats abans que es consolide el commit.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### 1. Card de Descàrregues (`P1-38`)
- Verificar la implementació a `src/sections/xat/XatSection.jsx` (`AccesAlXat`), `src/config/systemPages.js`, `src/sections/text/pageContent.js` i `src/app/App.jsx`.
- Comprovar que el botó s'amaga correctament a l'App nativa (`esAppNativa`).
- Avaluar el risc assenyalat per Claude (T1-02): la presència de mencions d'Android dins de la pàgina servida en entorn iOS per a revisió d'App Store.

### 2. Caça del Fantasma de 10px a les Converses (`P1-53`)
- Auditar la correcció a `src/css/modules.css` i `src/sections/xat/components/LlistaConverses.jsx`.
- Verificar si la supressió del marge global `li` de `base.css` genera efectes secundaris no desitjats en altres llistes del xat o de l'app.

### 3. Calaix TOC i Eines de Notes (§5 i §6)
- Auditar `src/components/universal/PageFrame.jsx`, `UniversalToolbar.jsx` i `NotesSection.jsx`.
- Verificar que el calaix TOC obri de l'H1 a l'H6 netament sota la barra negra (64px) sense desplaçar el contingut ni provocar bloquejos de scroll.

### 4. Salfumant de la Wiki i Enllaços Reparats (`P1-39`)
- Auditar les edicions als 26 fitxers de la Wiki i contrastar si el pegat de resolució per nom per a documents a `90_arxiu_historic/` és resilient o crea precedents de deute.

### 5. Baremador del Nano (`P1-41` vs `P1-42`)
- Inspeccionar el paquet preparat a `_investigacio_ia_de_poble/261026_2130_baremador_nano_claude/`.
- Avaluar la duplicitat detectada pel Mestre entre el sistema 1-10 i el sistema 1-5 estrelles de `/multimedia` (`P1-42`).

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

### Prohibició de Modificació Directa
Aquest és un torn d'auditoria pura; NO heu de mutar fitxers de `src/` directament per evitar col·lisions amb el tancament de Claude.

### Emissió d'Informe Canònic
Totes les troballes, defectes i propostes de millora s'han de reflectir amb el format de severitat canònic (`[BLOQUEJANT]`, `[DEFECTE]`, `[MILLORA]`) al vostre informe final.

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
