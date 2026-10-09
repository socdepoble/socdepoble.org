---
type: prompt
status: esborrany
description: Prompt autònom per a que Claude implemente l'Onada 7 durant el pont.
tags:
  - govern
visibility: private
reflex: sdp:torn_27c27956-9060-47f2-936a-5d70526c2923:4f6caf24-6b67-4a1a-9f22-b76d418192b3
---
# Prompt Onada 7: Implementació de sdp.modul.v1

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Revisar el pla d'implementació abans de començar: `_wiki_de_poble/04_escriptori/261009_1216_pla_implementacio_onada7.md`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_27c27956-9060-47f2-936a-5d70526c2923:4f6caf24-6b67-4a1a-9f22-b76d418192b3 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-09T10:16:42.094Z |
| Modificació | 2026-10-09T10:16:42.094Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | Claude Code |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-09T10:16:42.094Z: esborrany creat; contingut i verificació pendents.

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

Claude, tens permís absolut i autonomia total per implementar el Pla de l'Onada 7 (`261009_1216_pla_implementacio_onada7.md`). El Mestre està fora pel pont i no estarà disponible per revisar o donar permisos intermedis. 
L'objectiu és extreure els 5 mòduls (Gestoria, Rebost, Salut, RSS, TPV) cap a l'arquitectura de plugins `sdp.modul.v1` i reduir el pes del nucli. Has d'implementar-ho, passar els tests i fer els commits pertinents sense esperar confirmació.

**INCIDÈNCIA EXTREMAMENT GREU 1 (Higiene):** El tractor de netejar l'escriptori (`core-higiene-escriptori`) està fallant. T'ho comunico com un problema no resolt del qual n'has de ser conscient durant l'execució.
**INCIDÈNCIA EXTREMAMENT GREU 2 (Taxonomia):** En crear el pla d'aquesta onada amb `node tooling/wiki/document.mjs create --route pla.implementacio --file _wiki_de_poble/04_escriptori/261009_1203_pla_onada7.md`, la paraula `pla` al nom de fitxer va fer que el protocolledge l'assignara com a `planificacio` en lloc de `pla.implementacio`, fallant a la `porta-olivera` amb l'error *"el rebut és de «pla.implementacio» i el nom demana planificacio"*. Claude, has d'investigar per què el sistema confon la taxonomia en base al nom tot i especificar `--route`, i donar-nos una solució al `.agents/protocolledge.json`.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. Implementar l'arquitectura `sdp.modul.v1` seguint el pla establert.
2. Extreure els 5 mòduls fora del nucli principal.
3. Configurar Vite i els components perquè els plugins es carreguen de manera diferida.
4. Passar tots els tests i assegurar-se que les validacions automàtiques (husky pre-commit) estan verdes.
5. Fer commit dels canvis automàticament.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- El problema amb `core-higiene-escriptori` podria causar acumulació de fitxers; actua amb precaució i fes les neteges manualment si cal, tenint cura de no esborrar evidències útils.
- L'extracció pot trencar les dependències compartides si no s'externalitzen bé.

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
