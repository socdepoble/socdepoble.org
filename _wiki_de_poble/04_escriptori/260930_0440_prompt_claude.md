---
type: prompt
status: esborrany
description: Prompt per a Claude sobre la neteja de l'escriptori
tags:
  - govern
visibility: private
reflex: sdp:torn_dcf2f95a-a532-4dbc-b0e2-28d26313a0ce:6bbad859-ea34-4165-aa11-fffaa68072b6
---
# Prompt Investigació Escriptori

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Llig el fitxer `AGENTS.md` per comprendre les directrius (en concret la secció "0.1 ESCRIPTORI NET I ORQUESTRADORA RESOLUTIVA") i analitza l'estat actual de `_wiki_de_poble/04_escriptori/`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_dcf2f95a-a532-4dbc-b0e2-28d26313a0ce:6bbad859-ea34-4165-aa11-fffaa68072b6 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T02:34:19.465Z |
| Modificació | 2026-09-30T02:34:19.465Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.1.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-09-30T02:34:19.465Z: esborrany creat; contingut i verificació pendents.

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

El Mestre ha notificat una incidència greu: hi ha dificultats i fallades en la neteja de l'Escriptori per part teua i de la porta Olivera. Investiga a fons els registres, les teues darreres execucions de la porta `porta-olivera.mjs` i per què no s'aconsegueix deixar l'Escriptori net i amb el relleu correcte segons el BIOS. La neteja és un acte reflex, i el Mestre sent que se li està robant temps valuós intentant que l'entorn es mantinga net.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. Diagnostica l'estat actual de l'Escriptori (`04_escriptori`).
2. Analitza els logs recents de l'execució de `node tooling/gates/porta-olivera.mjs`.
3. Comprén per què no has pogut mantenir l'Escriptori net sense requerir múltiples prompts del Mestre.
4. Proposa una solució tècnica, procedimental o una correcció al hook/script si escau, perquè això no torne a passar i estalvies temps.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Perdre el rastre de documents importants si s'arxiven malament o si els errors de validació no s'interpreten bé.
- Desgast de la paciència del Mestre; la prioritat absoluta és ser una eina que estalvie temps.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 74786a2ee504fa2234f0e9b79c3bc0ae140288823196482702e5f2f78a8783c9. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
