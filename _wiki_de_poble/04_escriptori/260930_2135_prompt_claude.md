---
type: prompt
status: esborrany
description: Petorreta perquè Claude s'encarregue de l'arquitectura i disseny del mòdul de Xat emulant WhatsApp
tags:
  - govern
visibility: private
reflex: sdp:torn_a55a2185-3402-4418-b72e-208fc1fc68d3:47c46b6c-c472-4049-9b07-8fe91299550d
---
# Prompt Clon WhatsApp per a Claude

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a55a2185-3402-4418-b72e-208fc1fc68d3:47c46b6c-c472-4049-9b07-8fe91299550d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T19:35:41.950Z |
| Modificació | 2026-09-30T19:35:41.950Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-09-30T19:35:41.950Z: esborrany creat; contingut i verificació pendents.

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

El Mestre ha ordenat iniciar la implementació completa de la UI/UX del mòdul de Xat emulant WhatsApp al màxim detall. A més, se t'ha emparellat amb **Codex**, que treballarà paral·lelament en l'enxufabilitat de WordPress i els acabats del plugin.
Com a part de la vostra dinàmica, heu de realitzar **auditories adversarials creuades cada 5 minuts**. Això vol dir que, mentre desenvolupes el codi, Codex revisarà el que fas, i tu hauràs de revisar els canvis de Codex. No et xocques amb Codex als arxius de configuració de WordPress; tu centra't en la UI del Xat (`src/sections/xat/`, `App.jsx`, etc.).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1:** Implementar la interfície del Xat seguint l'estil i anatomia de WhatsApp Web/Mòbil (disseny Pedra Seca). El grup "Gent de la Torre" ha de ser la primera vista o integració clau si entrem directament a `/xat`.
- **T2:** Assegurar que els tokens de disseny s'apliquen correctament.
- **T3:** Realitzar una auditoria adversarial (creuada) de la feina de Codex en el plugin de WordPress cada 5 minuts i reportar els resultats a `04_escriptori/`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Conflictes amb Codex:** Com que Codex estarà tocant el codi de l'enxufabilitat (`PedraSecaEmbed.jsx`, `App.jsx`, `layout.css`), hi pot haver col·lisions d'edició. Coordina't mitjançant els documents de l'escriptori per no xafar el seu treball.
- **Navegació Mòbil:** L'arquitecte (MarIA) ja ha afegit `.is-compact` a l'arrel de l'aplicació i `container-type: inline-size;` a `base.css` per garantir que la barra mòbil funciona quan l'app s'incrusta. Respecta aquests canvis CSS.

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
