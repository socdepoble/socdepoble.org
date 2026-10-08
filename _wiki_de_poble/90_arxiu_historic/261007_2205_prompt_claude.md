---
type: prompt
status: esborrany
description: Prompt per a Claude per reprendre l'Onada 3
tags:
  - govern
visibility: private
reflex: sdp:torn_38e0bd5e-f2c7-4990-aa0e-c869c738a1e0:5f4f4e25-de06-4f02-b5b9-9cd112a09753
---
# Relleu Rentonar

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Pla preparat i documentació ancorada. El document de prompt ara fa referència al pla actiu `261007_2205_pla_implementacio_claude.md`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_38e0bd5e-f2c7-4990-aa0e-c869c738a1e0:5f4f4e25-de06-4f02-b5b9-9cd112a09753 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-07T20:03:33.657Z |
| Modificació | 2026-10-07T20:03:33.657Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | Claude 3.5 Sonnet |
| Tokens consumits | 0 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-07T20:03:33.657Z: esborrany creat; contingut i verificació pendents.

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

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Sóc de Poble. Inicie sessió de relleu des d'este compte per límits termodinàmics de l'anterior.
L'agent predecessor ha hagut de frenar en sec i t'ha preparat un document de Relleu exclusiu per a tu a l'Escriptori perquè reprengues l'Onada 3.

TASCA IMMEDIATA:
1. Llig l'arxiu `_wiki_de_poble/04_escriptori/261007_1715_auditoria_claude.md` sencer. L'apartat «Límits» conté el relleu exacte del que falta per fer.
2. Llig també l'arxiu de les decisions aprovades: `261007_1845_decisions_iaia.md`.
3. Llig el Pla assignat: `261007_2205_pla_implementacio_claude.md`.
4. L'històric de Notes, el minicarregador de WordPress i les 4 decisions UX t'estan esperant.

Confirma'm que has assimilat el Relleu i reprén la implementació just on es va quedar, sense obrir nous fronts que no estiguen indicats allí.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- Assumir les tasques definides en el pla (`261007_2205_pla_implementacio_claude.md`).
- Reprendre l'Onada 3 amb els punts de l'informe de relleu.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Ocultació de context (Llei del Consell): no demanar informació extra si el pla ja cobreix tota la necessitat.
- Viatge en el temps: evitar revertir canvis ja fets pel predecessor (el relleu ho especifica clarament).

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 69997976f6e4d34f9041b9e54c4bdf3e2cd7dd4ebb9fe0864b6828cbcb32bb34. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
