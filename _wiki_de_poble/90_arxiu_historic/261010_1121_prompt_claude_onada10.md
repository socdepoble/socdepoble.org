---
type: prompt
status: esborrany
description: Instruccions detallades per a Claude basades en el Pla de l'Onada 10
tags:
  - govern
visibility: private
reflex: sdp:torn_425e7459-f1ae-4948-98b5-e29d0d28b31f:b55b2f47-628c-4150-9122-5bf251edd353
---
# Prompt Claude Onada 10

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Revisar el pla d'implementació abans de començar: `_wiki_de_poble/04_escriptori/261010_1121_pla_implementacio_onada10.md`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_425e7459-f1ae-4948-98b5-e29d0d28b31f:b55b2f47-628c-4150-9122-5bf251edd353 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-10T09:25:23.981Z |
| Modificació | 2026-10-10T09:25:23.981Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | Antigravity/MarIA |
| Tokens consumits | no mesurat |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-10T09:25:23.981Z: esborrany creat; contingut i verificació pendents.
2026-10-10T09:27:00.000Z: prompt redactat d'acord amb el Pla d'Implementació de l'Onada 10 per encàrrec del Mestre.

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

Hola Claude! El Mestre ha iniciat l'Onada 10 i la teua missió d'aquesta sessió és executar el pla d'implementació descrit a `_wiki_de_poble/04_escriptori/261010_1121_pla_implementacio_onada10.md`.
En resum, hem de traure les 3 targetes de sistema ("Consola Termodinàmica", "El Cervell" i "Disseny de Pedra Seca") del Panell de Control i deixar-les només al Mur, amb format estàndard (amb Categoria i Etiqueta en lloc de l'enorme botó central). Adicionalment, aquest mateix procés d'estandardització de targetes s'ha d'aplicar al "Rebost Domèstic" i "Salut", assegurant-nos que usen la targeta canònica completa que inclou la data i hora a la capçalera taronja. Finalment, a les respectives pàgines de destinació d'aquests cinc serveis, s'ha d'afegir un text d'entradilla didàctic de 6 paràgrafs (en valencià) col·locant el botó d'acció dins de la decoració al final de cada explicació.
A més, hi ha una tasca pendent de traduccions de l'error de xat: cal reemplaçar l'expressió "no ets del poble" pel terme "Foraster" i completar les traduccions als idiomes que falten (com eu i gl).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- [ ] Llegeix detingudament `_wiki_de_poble/04_escriptori/261010_1121_pla_implementacio_onada10.md`.
- [ ] Elimina les tres targetes de sistema ("Consola Termodinàmica", "El Cervell" i "Disseny de Pedra Seca") del `ControlPage`.
- [ ] Modifica l'origen de dades (ex. `wikiManifest` o `pluginManifest`) de les cinc targetes ("Consola Termodinàmica", "El Cervell", "Disseny de Pedra Seca", "Rebost Domèstic", "Salut") perquè tinguen una presentació estàndard:
  - Elimina el botó d'acció gran.
  - Activa els camps "Categoria" i "Etiqueta".
  - **Molt important:** Assegura't que el Rebost i Salut usen l'estructura canònica que té la franja taronja amb la data i hora, ja que ara mateix els hi falta.
- [ ] Obre els components o markdowns de destinació d'aquestes eines (Cervell, Consola, Rebost, Salut) i crea-hi una entradilla: 6 paràgrafs explicatius i didàctics en valencià per a cadascuna d'elles.
- [ ] Afig just a sota de cada entradilla el seu respectiu botó d'acció ("Obrir el Cervell", "Obrir la Consola", "Obrir el Rebost", "Obrir Salut"). Assegura't de col·locar el botó sempre a l'interior de la mateixa decoració (el frame de la pàgina), mai fora d'ella.
- [ ] Revisa els fitxers de traduccions. A la clau de l'error del xat per a destinataris externs, on deia "no ets del poble" posa-hi ara "Foraster" o "Mode foraster", i afegeix les traduccions per a l'euskera i gallec (que estaven pendents de l'Onada 8).
- [ ] Llança els tests i verifica que tot queda impecable. Si estàs segur dels canvis, avisa el Mestre.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Pots trencar algun laboratori/test de l'UniversalCard si modifiques dràsticament l'estructura al `wikiManifest`. Assegura't de que el tipus de targeta de sistema ara simplement use metadades normals en lloc del botó.
- Atenció al disseny visual al Mur per no trencar l'alçada (`height`) estàndard de les targetes en afegir els camps "Categoria" i "Etiqueta".

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
