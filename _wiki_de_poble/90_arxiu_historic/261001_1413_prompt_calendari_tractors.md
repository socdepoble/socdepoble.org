---
type: prompt
status: esborrany
description: Prompt per a Codex/Claude per redissenyar el calendari a l'estil Google Calendar i formalitzar els fluxos de treball dels tractors cognitius.
tags:
  - govern
visibility: private
reflex: sdp:torn_b2ad9854-3bd9-45da-be92-b5367cb21a83:78f8b020-9a65-4aa8-891d-c4962df6f148
---
# Refactorització del Calendari i Generació de Tractors Cognitius

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_b2ad9854-3bd9-45da-be92-b5367cb21a83:78f8b020-9a65-4aa8-891d-c4962df6f148 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T12:14:04.372Z |
| Modificació | 2026-10-01T12:14:04.372Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-01T12:14:04.372Z: esborrany creat; contingut i verificació pendents.

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

Aquest torn demana dues grans missions orientades al redisseny de la interfície i a la formalització del sistema cognitiu:

1. **Redisseny del Calendari (L'Excepció de Pedra Seca):** Hem d'apropar l'aspecte visual del Calendari el màxim possible al Google Calendar. Això significa abandonar les "píndoles" (pills) i utilitzar blocs rectangulars que aprofiten tot l'espai horitzontal disponible del dia (amb una mínima rodonesa als cantons, per exemple, de 4 píxels). Aquests blocs s'han de diferenciar per colors (un color sòlid per cada calendari). A més, cal incorporar el botó d'hamburguesa (sandvitx) al costat de "Avui" per desplegar un tauler lateral (Sidebar) on poder activar i desactivar els diferents calendaris de l'usuari.
2. **Definició dels Fluxos de Treball dels Tractors Cognitius (Skills):** Cada "Tractor Cognitiu" (Skill) ha de tindre el seu "Flux de Treball" associat clarament definit per passos, i una "Certificació d'Execució" un cop realitzat. Sense aquest flux, es considera que el sistema falla. T'ordenem que llistes i crees/actualitzes els fluxos de treball formals de *tots* els tractors actius en el sistema (ex: crear petorretas, etc.), presentant-los d'un en un perquè el Mestre (humà) els puga anar aprovant.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1: Redisseny del Calendari:** Modifica els components del calendari perquè els esdeveniments es mostren com blocs rectangulars quasi complets (no píndoles), amb els seus respectius colors corporatius assignats a cada llista.
- **T2: Sidebar de Calendaris:** Afegeix el botó de menú (hamburguesa) i el tauler lateral corresponent que permeta a l'usuari marcar i desmarcar quins calendaris es mostren.
- **T3: Definició dels Fluxos de Treball (Tractors):** Recopila i defineix explícitament els passos dels fluxos de treball de TOTS els Tractors Cognitius actius a l'ecosistema, i documenta'ls perquè siguen analitzats pel Mestre (Humà) de manera atòmica i consecutiva.
- **T4: Sistema de Certificació:** Proposa el mètode com MarIA acreditarà i certificarà que un flux de treball s'ha completat al 100% amb èxit un cop seguit pels passos definits.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Tindre conflictes entre l'estil "Google" del calendari i la resta del Sistema de Disseny Pedra Seca, requerint exempcions específiques al sistema de tokens que ho permeten sense trencar la coherència visual.
- Generar llistats de fluxos de treball massa farragosos de validar manualment; per això han de presentar-se un per un.

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
