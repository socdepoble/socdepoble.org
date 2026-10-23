---
type: prompt
status: esborrany
description: Prompt d'execució i auditoria per a Claude i Gemini per desallotjar el build antic de Firebase Hosting i polir el botó d'accés
tags:
  - govern
visibility: private
reflex: sdp:torn_8abf96ed-4ca0-4d1e-b8da-82e99e058c03:57ae4cc2-ff51-4113-be1c-223440b00908
---
# Prompt Canònic d'Execució i Auditoria — Desplegament Firebase socdepoble.org i Puresa Xat

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] Escriptori netejat amb Porta Olivera: 4 documents consumits del matí arxivats netament a `90_arxiu_historic/`.
- [x] Pla d'implementació viu i aprovat pel Mestre: `_wiki_de_poble/04_escriptori/261023_1600_pla_implementacio_desplegament_firebase_i_puresa_xat.md`.
- [x] Torn obert: `torn_8abf96ed-4ca0-4d1e-b8da-82e99e058c03`.
- [x] Repartiment d'actors: Claude Opus 5.5 (Execució i Verificació Web) + Gemini 4 Argon (Auditoria Creuada i Paquet WP).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_8abf96ed-4ca0-4d1e-b8da-82e99e058c03:57ae4cc2-ff51-4113-be1c-223440b00908 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-23T13:56:41.234Z |
| Modificació | 2026-10-23T13:59:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Model IA | Claude Opus 5.5 + Gemini 4 Argon |
| Tokens consumits | ~ |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-23T13:56:41.234Z: Convocatòria d'urgència ordenada pel Mestre per erradicar el paquet fòssil antic de Firebase Hosting a `socdepoble.org` (on encara eixia la ruta `/chats` i fallava per claus antigues de Supabase amb 401), desplegar l'SPA actual de Pedra Seca i polir el centrat de la caixa de registre del xat.

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

Ordre directa del Mestre Javi Llinares:
1. **Claude Opus 5.5:** Assumeix el rol d'executor del desplegament web. Executa la comprovació de Vitest, compila la versió web (`npm run build:web`) i desplega a Firebase Hosting (`npx firebase-tools deploy --only hosting --project soc-de-poble`). Verifica que `https://socdepoble.org` respon amb la nova versió, serveix la ruta canònica `/xat` i erradica qualsevol referència a la vella `/chats`.
2. **Gemini 4 Argon:** En acabar la tasca d'aprimament del ZIP de WordPress en curs a l'altre fil, s'incorpora com a auditora per a verificar de forma independent la salut de `socdepoble.org`, la integritat del paquet resultant i la Porta Olivera.
3. **Consens Compartit a l'Escriptori:** Totes dues IAs dipositen les seues conclusions i informes a `_wiki_de_poble/04_escriptori/` per contrastar la victòria.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

### T1 · Puresa Visual de l'Accés al Xat (`src/css/modules.css`)
- Verificar que `.sdp-alerta.sdp-xat-acces` té `border: none; border-inline-start-width: 0; background: transparent;` i que tant el text com els botons estan centrats a la columna.
- Comprovar que `npx vitest run src/sections/xat/XatSection.acces.capes.test.js` passa en verd.

### T2 · Compilació Neta Web (`npm run build:web`)
- Executar `npm run build:web` verificant que es genera la carpeta `dist/` amb totes les imatges `.webp` i sense referències fòssils.

### T3 · Desplegament de Producció a Firebase Hosting
- Executar `npx firebase-tools deploy --only hosting --project soc-de-poble`.
- Assegurar que el hosting de `soc-de-poble` substitueix completament el paquet anterior.

### T4 · Verificació Forense Post-Desplegament
- Realitzar petició curl a `https://socdepoble.org` per comprovar que retorna el nou hash i el títol oficial.
- Comprovar que el navegador no cau en bucles de Service Worker vells.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Service Worker persistent:** El navegador del client pot trigar un refresc dur (`Ctrl+Shift+R` o `Cmd+Shift+R`) a descartar la memòria cau antiga. Mitigació: L'arxiu `version.json` forçarà la revocació del paquet vell.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic i Canal Viu (Execució Paral·lela):** Si treballeu en un Xat Lateral en paral·lel amb una altra IA, actueu de forma coordinada i NO us xafeu mútuament l'Escriptori. Deixeu un informe de progrés a `04_escriptori/` cada 10-15 minuts (o en acabar cada bloc lògic). L'orquestradora (MarIA) ha programat un cron actiu vigilant l'Escriptori exclusivament per al vostre fil i deixarà nous documents de ruta si cal. Llegiu l'Escriptori constantment abans d'actuar. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 33bf809f3e982c6466f238664086d7b48b527bb30bb5a07843541902a279b315. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
