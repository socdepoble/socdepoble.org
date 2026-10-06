---
type: prompt
status: esborrany
description: Instruccions per a l'auditoria adversarial i l'execució de solucions tècniques
tags:
  - govern
visibility: private
reflex: sdp:torn_6f2b5c7d-b0de-4b08-a27f-e867dff0765c:72eff582-73f5-4259-9e49-916f3edb6680
---
# Prompt Opus 5.5 Ultracode

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: La porta Olivera està verda i només hi ha els documents pertinents.
- [x] **Pla d'Implementació** generat: `261005_1303_pla_implementacio_opus.md`.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_6f2b5c7d-b0de-4b08-a27f-e867dff0765c:72eff582-73f5-4259-9e49-916f3edb6680 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-05T11:02:24.541Z |
| Modificació | 2026-10-05T11:02:24.541Z |
| Propietari | Agent Local (Opus) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.1) |
| Model IA | Opus 5.5 Ultracode |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-05T11:02:24.541Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) del seu backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Company Opus, el model anterior (Fable) ha hagut d'aturar l'auditoria extrema per exhauriment de quota, però ens ha deixat un informe massiu (`261005_1211_auditoria_fable.md`) amb troballes molt valuoses:
1. Va descobrir el forat mecànic de `porta-olivera.mjs` (només agafa `TRANSITORIES`).
2. Va descobrir que el crash de `useSession` no es pot reproduir manualment i exigeix un test d'integració.
3. Va alertar d'un monstre de 67MB i errors de Segell.

**La teua missió és doble:**
1. Llig l'auditoria de Fable i el teu Pla d'Implementació (`261005_1303_pla_implementacio_opus.md`) i **executa els canvis estructurals i de codi** per resoldre totes aquestes qüestions (Fases 1, 2 i 3 del pla).
2. El Mestre reporta que la Porta Olivera crida contínuament "àncores a documents absents". Aplica rigorosament les **Tècniques d'Investigació i Autòpsia** per trobar culpables dins del codi dels tractors. El codi és el que mana. Descobreix per què està fallant reiteradament i soluciona-ho. Més enllà d'això, continua escrivint i auditant el sistema per millorar l'enxufabilitat amb Sollutia.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Reparar i signar el Segell de Skills (`SKILLS_SEAL.json`).
- T2: Aplicar la tècnica d'autòpsia al tractor `porta-olivera.mjs` per arreglar la categoria `produccio`.
- T3: Investigar i solucionar la fallada reiterada de les "àncores a documents absents".
- T4: Codi del test d'integració per a `useSession`.
- T5: Neteja de la UI i arrel preparant el commit atòmic.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Evita esborrar el context de l'Acta Marmota, que el necessitem per connectar els punts.
- Verifica absolutament cada script abans de tocar-lo amb la Tècnica d'Autòpsia.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 3de95f715769c8424fc01a6f3b9053fb68646e7345b170f18694e03965c6eafe. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
