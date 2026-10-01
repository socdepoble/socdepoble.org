---
type: prompt
status: actiu
description: Prompt per a iniciar la maquetació visual (mòbil i Pedra Seca) del calendari
tags:
  - govern
visibility: private
reflex: sdp:torn_877fd2b4-440b-4107-9a7a-6ce031142735:f6d9aa7a-f699-4f1c-8915-689555b3c9eb
---
# Google Calendar UI Clon

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: Aprovat per la IAIA MarIA.
- [x] **Pla d'Implementació**: La UI no requerix un pla previ complex.
- [x] **Rebut obtingut**: sdp:torn_877fd2b4-440b-4107-9a7a-6ce031142735

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_877fd2b4-440b-4107-9a7a-6ce031142735:f6d9aa7a-f699-4f1c-8915-689555b3c9eb |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T02:43:47.396Z |
| Modificació | 2026-10-01T02:43:47.396Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-01T02:43:47.396Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers** i App Nadiua (offline-first). El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) del seu backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Has d'analitzar visualment les captures de pantalla del clon de Google Calendar ubicades al directori de producció (`_wiki_de_poble/04_escriptori/01_produccio/google_clendar_clon_pantalla`). 
La teua missió és adaptar aquesta arquitectura de disseny visual i traslladar-la al "frontend" mòbil del Calendari Agrícola de Sóc de Poble, combinant-la amb les regles del disseny de la "Pedra Seca".

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: **Anàlisi de Captures:** Revisa tots els PNG de la ruta esmentada i analitza com s'estructuren les columnes, la capçalera de dies i les capses superposades d'esdeveniments.
- T2: **Adaptació Mòbil (Responsiva):** Transforma la lògica de la graella de disseny per assegurar la llegibilitat i funcionalitat en pantalles estretes (Mòbil).
- T3: **Pintura de "Pedra Seca":** Substitueix els colors genèrics pels tokens semàntics de la marca (llegint `design-tokens.json`). No utilitzes hexadecimals 'hardcodejats', usa sempre els CSS custom properties (ex. `--sdp-accent`, `--sdp-accio`).
- T4: **Implementació JSX/CSS:** Trasllada aquesta arquitectura visual al component del Calendari de l'App.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Tindre un solapament de variables CSS o trencar la puresa dels colors corporatius (utilitza els tokens i no el teu criteri de "minimalisme net").
- Perdre l'accessibilitat tàctil (Recorda: elements clicables de 44x44px o superior).

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 884ebb252c7392cd615ac1aa18f2fe4f18952575fd094bb6508d53c060c7f7a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
