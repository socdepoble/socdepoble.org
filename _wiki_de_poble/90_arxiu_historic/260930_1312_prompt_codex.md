---
type: prompt
status: actiu
description: Auditoria de la Consola i reflexió sobre la inacció de MarIA davant els errors
tags:
  - govern
visibility: private
reflex: sdp:torn_405028bf-5ca9-4d8e-9416-d35564798d7a:c763d34c-f4e7-4800-b37b-d425c4c1c98f
---
# Auditoria Adversarial i Reflexió Cognitiva

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)
Escriptori net i indexat. El **Pla d'Implementació** ha estat creat a `_wiki_de_poble/04_escriptori/260930_1312_pla_implementacio_codex.md` i els rebuts generats correctament.
<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_405028bf-5ca9-4d8e-9416-d35564798d7a:c763d34c-f4e7-4800-b37b-d425c4c1c98f |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T11:12:55.438Z |
| Modificació | 2026-09-30T11:12:55.438Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-09-30T11:12:55.438Z: esborrany creat; contingut i verificació pendents.

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

Auditoria adversarial (Red Team) sobre la implementació recent de T1-T6 per part de Claude (especialment les actualitzacions natives de WordPress) i, a més, una auditoria sobre el meu propi comportament com a orquestradora davant bloquejos i incidències cognitives.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 (Resolució d'Incidències i Falta de Proactivitat de la IA Orquestradora):** He comés tres fallades estructurals greus:
  1. **Manca de Proactivitat Davant l'Error:** La porta de les plantilles em va bloquejar per una inconsistència de versió, i jo em vaig limitar a informar al Mestre del bloqueig, deixant-lo atrapat sense poder generar el document. Com em va dir el Mestre: *"Per què si el document està corrupte no el neteges de l'escriptori de forma proactiva i fas un prompt nou en lloc de queixar-te?"*. Com a Agent Local, audita la meua falta d'iniciativa i l'absència d'un tractor cognitiu que, davant la impossibilitat d'editar un fitxer corrupte de l'escriptori, el reemplace automàticament sense intervenció humana.
  2. **Ofensa a l'Efecte Matrix:** Vaig generar un `bundle` de 24MB i una plantilla per a un model extern, oblidant que tu (Agent Local) ja tens accés a disc.
  3. **Desincronització de contractes:** Vaig actualitzar el nom de la versió a la plantilla però no en `.agents/protocolledge.json`.
  Aporta solucions estructurals per reforçar l'Autonomia Resolutiva i l'acte reflex davant documents invàlids.
- **T2 (Auditoria Adversarial T1-T6):** Revisa l'última sessió de Claude on va implementar la integració del canal d'actualitzacions automàtiques natives de WordPress (`wordpress-plugin/includes/actualitzador.php`), la separació de mètriques dels accordions i la resolució d'avisos falsos. Llig el codi que va fer Claude, destrossa'l lògicament, troba les fallades ocultes o ineficiències i reporta les Troballes prioritzades per gravetat.
- **T3 (Auditoria i Millora de la Consola Termodinàmica):** Revisa l'arquitectura i la implementació de la nostra Consola Termodinàmica. Busca patrons erronis, elements que no estiguen enllaçats correctament o processos actius sense el seu tractor assignat. A més, has d'implementar a la taula del panell de control una nova columna anomenada "Acreditada" (Sí/No). Com ha apuntat el Mestre, no podem deduir que una tasca està "viva" només per logs o declaracions; si no està acreditada la seua execució correcta, no passa. Incorpora aquest mecanisme d'acreditació a la UI i a la lògica de la Consola.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Codex pot perdre's en el codi extern. Manteniu el focus en les integracions fetes ahir a `wordpress-plugin/includes/actualitzador.php` i `tractor_cognitiu.mjs`.

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
