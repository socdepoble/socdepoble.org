---
type: prompt
status: esborrany
description: Prompt per a Claude per pensar en el nou disseny Impeccable i integrar les noves rules a Pedra Seca
tags:
  - govern
visibility: private
reflex: sdp:torn_f62a2178-3461-41b5-acf9-6e3214c0599a:f2ca42ee-b4b4-48f2-8fbe-d0ee3993bf53
---
# Prompt per a Claude: Disseny Impeccable

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f62a2178-3461-41b5-acf9-6e3214c0599a:f2ca42ee-b4b4-48f2-8fbe-d0ee3993bf53 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-03T22:49:08.322Z |
| Modificació | 2026-10-03T22:49:08.322Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-03T22:49:08.322Z: esborrany creat; contingut i verificació pendents.

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

Hola Claude, la teua orquestradora (MarIA) m'acaba de passar els nous criteris de disseny que ha configurat.

**El nostre objectiu actual és introduir i integrar els nous criteris "Impeccable / Emil Kowalski" dins de l'estètica actual de Pedra Seca de Sóc de Poble, per donar-li eixa pàtina de "producte d'elit" mantenint l'accessibilitat.**

L'skill `sdp-pedra-seca/SKILL.md` ja s'ha actualitzat amb eixes noves directrius.

Necessite que actues com a **Design Engineer en Cap** i facis el següent:

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1:** Revisa el contingut actualitzat de `.agents/skills/sdp-pedra-seca/SKILL.md` per entendre les noves variables termodinàmiques visuals, la tipografia fluïda i les micro-interaccions.
- **T2:** Obre i audita el fitxer base de disseny `src/components/PedraSeca/tokens/design-tokens.css` i identifica on i com cal introduir aquests nous tokens per a les noves propietats.
- **T3:** Escriu un **Pla d'Implementació** (com a eixida pròpia per aquesta fase de pensament) en què expliques com integraràs exactament les normes de l'Impeccable en els nostres CSS i components.
- **T4:** Deixa clar què aplicaries a la setena passada per poder donar un salt en la interacció i refinament estètic sense trencar la regla del Bancal Mode. No faces cap canvi de codi font de moment, només elabora l'informe / pla.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Evitar que l'excés de refinament i suavitat trenqui la visió AAA del contrast i l'accessibilitat del Bancal Mode. Sóc de Poble ha de seguir sent de "Pedra Seca".

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 6d988b3a752dac3f4108497058a90efbf107d50b70e5e25c3557edb20653ff0a. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
