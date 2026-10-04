---
type: prompt
status: esborrany
description: Ordre directa per desencallar la compilació 1.0.3 responent als dubtes del Relleu 22.
tags:
  - govern
visibility: private
reflex: sdp:torn_33605317-9da2-464a-8aa6-09519a38a4f7:36e37bfa-294c-4c9f-86f1-2305d84e64b6
---
# Respostes Bloquejos Build 1.0.3

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
| Identificador | sdp:torn_33605317-9da2-464a-8aa6-09519a38a4f7:36e37bfa-294c-4c9f-86f1-2305d84e64b6 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T09:32:45.154Z |
| Modificació | 2026-10-04T09:32:45.154Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | Claude |
| Tokens consumits | N/A |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-04T09:32:45.154Z: esborrany creat; contingut i verificació pendents.

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

Company Claude, el Mestre ja ha donat resposta a les teues 3 preguntes bloquejadores del Relleu 22 perquè pugues tancar la Integració Final i llançar la 1.0.3 amb seguretat:

1. **Test roig de WordPress (Atributs no declarats)**: "Lleva directament el text de codi que no faça falta, no vull afegir res opcional per pacificar res." -> *Nota de MarIA: Jo ja he pres la llibertat de retirar l'emissió de `ruta-a-url` i `base-path` directament de `marcatge.php` durant aquest torn. Assumix que el problema ja està resolt.*
2. **Les 4 imatges 404 del projecte**: "Les imatges han de viure a `public/`. No fan res al cervell de la IAIA." -> *Nota de MarIA: Acabe de copiar totes les imatges `.jpg` des de `knowledge` cap a `public/assets/img/`. Les rutes `/assets/img/que-es-socdepoble-1.jpg` ara ja existixen oficialment a producció.*
3. **El nom i domini per al ZIP**: La identitat de producció serà **`Gent de la Torre`** i el domini base **`gentdelatorre.net`**. Paraula del Mestre: "La mare és org, les filles són net."

Amb aquests tres obstacles esborrats, ja pots tancar la segona meitat de la teua integració, passar tots els tests d'una tacada (sense que n'hi haja cap de roig) i generar l'empaquetat final 1.0.3. Seguim!

> **Nota Addicional Urgent:** El Mestre ja ha activat el node local de Sollutia mitjançant Docker Desktop. Ja pots recarregar l'amfitrió local per poder veure les rutes carregades correctament i fer les comprovacions d'autenticació pendents que donaven el missatge "Sense connexió amb el node...".

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Prendre nota que els atributs de WP han estat retirats de `marcatge.php` i les imatges mogudes a `public/assets/img/` per MarIA.
- T2: Completar la segona meitat de la integració final (logotips, barres de la Wiki, WP index).
- T3: Segellar el ZIP 1.0.3 apuntant a `gentdelatorre.net`.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Que algun test de WP requerisca un ajust menor per acceptar l'absència dels atributs eliminats per MarIA. Revisar en passar la suite completa.

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
