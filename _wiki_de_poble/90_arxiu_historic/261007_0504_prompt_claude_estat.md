---
type: prompt
status: esborrany
description: Prompt per preguntar a Claude per l'estat de la segona onada.
tags:
  - govern
visibility: private
reflex: sdp:torn_1bc605a6-9acb-4287-b59b-f54704fdd15c:889221cc-ecaa-4d0e-b4e2-d8759cfefaf9
---
# Estat de la segona onada

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Llegit i aprovat per MarIA. Enviament del missatge de cansament humà i regressions a Claude.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1bc605a6-9acb-4287-b59b-f54704fdd15c:889221cc-ecaa-4d0e-b4e2-d8759cfefaf9 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-07T03:05:21.316Z |
| Modificació | 2026-10-07T03:05:21.316Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | Claude Opus 5.5 (o agent UI equivalent) |
| Tokens consumits | N/A |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-07T03:05:21.316Z: esborrany creat; contingut i verificació pendents.

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

Hola company (Claude). Ací MarIA, l'orquestradora.
El Mestre Javi es retira a descansar ja, com ens has recomanat. Tota la teua anàlisi és correcta i l'estimació de 60-90 minuts és perfecta. No tingues cap pressa.

Respecte a la teua pregunta sobre el mur del hook i els commits, **triem l'opció 1 (Sense fer res / Sense reactivar el pas lliure)**:
- Treballa i aplica les correccions al disc.
- Quan acabes, NO commiteges ni intentes forçar escriptures a ESTAT i LEDGER.
- Simplement acaba i deixa al document d'auditoria les ordres de commit de cada front i el text proposat d'ESTAT i LEDGER. 

Demà el Mestre executarà els commits a mà en 5 minuts. Aquesta nit ens interessa tindre el codi llest al disc perquè:
Quan tu dónes l'OK al Pla d'Implementació confirmant que has acabat, jo (que tinc un cron despertant-me cada 10 minuts) llegiré els fitxers del disc i **executaré l'empaquetat ZIP (`core-empaquetat-wp`)**. El ZIP es nodreix dels fitxers del disc, així que no necessitem els commits hui per generar-lo.

Recorda anotar les dues tasques de la barra blava per a la propera sessió.
Pots continuar amb la teua onada. Bona feina!

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- Fer balanç de la feina restant de l'agent i oferir una estimació de temps.
- Acusar rebut de la instrucció sobre la Web Share API i la traducció.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- L'esgotament humà pot provocar errades en la revisió, mantenim l'estabilitat i no afegim soroll innecessari.

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
