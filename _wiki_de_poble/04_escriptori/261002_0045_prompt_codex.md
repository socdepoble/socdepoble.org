---
type: prompt
status: esborrany
description: Prompt d'execució i auditoria per a Codex (Gestoria i SEO).
tags:
  - govern
visibility: private
reflex: sdp:torn_c3184f82-e2a1-4603-a493-3b02cdb532c5:0bcf641e-5953-4e02-86db-97135e1bd8f9
---
# Prompt Codex Gestoria

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

**Escriptori net**: Sí.
**Pla d'Implementació**: 261002_0045_pla_implementacio_gestoria.md
**Rebut**: Sí.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c3184f82-e2a1-4603-a493-3b02cdb532c5:0bcf641e-5953-4e02-86db-97135e1bd8f9 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T22:45:26.868Z |
| Modificació | 2026-10-01T22:45:26.868Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | Codex |
| Tokens consumits | ~2000 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-01T22:45:26.868Z: esborrany creat; contingut i verificació pendents.
2026-10-01T22:46:00.000Z: prompt generat per MarIA (Gemini Pro) ordenant l'execució del Pla de Gestoria amb focus en el SEO.

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

### 🚨 INCIDÈNCIA GREU: Higiene de l'Escriptori i Flux de Treball
He detectat que l'escriptori continuava brut amb arxius antics (261001), cosa que et podria portar a llegir informació obsoleta. Els he arxivat a l'històric a mà, però **això és una incidència greu de flux de treball**. Tín present que l'Escriptori és sagrat: NO lliges informació que no estiga a «Activitat en curs». Has de respectar l'Aprovació al Frontend de qualsevol tractor cognitiu. Llig la skill actualitzada `wiki-documentacio-i-reflex`.

Hola, Codex. Et faig entrega d'una missió fonamental per al panell de control de la Gestoria, l'arquitectura d'automatització i l'enfortiment vital del SEO per a les previsualitzacions a xarxes socials.
He deixat a l'Escriptori el següent pla d'implementació: `_wiki_de_poble/04_escriptori/261002_0045_pla_implementacio_gestoria.md`

El teu objectiu és:
1. Llegir l'esmentat pla d'implementació.
2. Analitzar la integració tècnica dels 15 empleats digitals (Tool Schemas JSON, directrius, etc.) i la cascada visual nemònica dins de l'estructura de Sóc de Poble (Sollutia).
3. Millorar l'OpenGraph i meta tags per a WhatsApp/Telegram.
4. Resoldre les preguntes obertes del pla, especialment sobre la UI/UX i el *Human-in-the-Loop*.
5. Emetre l'auditoria.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1: Lògica Base:** Llegiu `261002_0045_pla_implementacio_gestoria.md`. Definiu com integrarem el Quiz (cascada HTML/JS) al panell sense trencar l'SPA de React.
- **T2: SEO a fons:** Reviseu el codi font per a assegurar que les "social cards" i metadades (OpenGraph) seran perfectes a WhatsApp/Telegram per a `gentdelatorre.net` i `socdepoble.org`.
- **T3: Emeteu l'informe:** Empleneu el pertinent informe (auditoria) deixant-lo a l'escriptori net (tal com diu la regla de sortida).

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Conflicte d'enrutament (React Router vs Single Page App HTML5 incrustada). 
- Mal funcionament de metaetiquetes en xarxes socials i aplicacions de missatgeria. Sigueu especialment curosos amb el SEO.

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
