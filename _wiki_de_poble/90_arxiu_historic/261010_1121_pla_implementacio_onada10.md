---
type: document
status: esborrany
description: 'Preparació per a Claude: eliminar targetes de Control, actualitzar etiquetes al Mur i redactar contingut a les pàgines del Cervell i Consola Termodinàmica.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_425e7459-f1ae-4948-98b5-e29d0d28b31f:ce581a3d-d48d-4a18-b0fc-87d0c11e415d
---
# Pla d'Implementació Onada 10

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_425e7459-f1ae-4948-98b5-e29d0d28b31f:ce581a3d-d48d-4a18-b0fc-87d0c11e415d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-10T09:23:20.963Z |
| Modificació | 2026-10-10T09:23:20.963Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity/MarIA |
| Tokens consumits | no mesurat |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-10T09:23:20.963Z: esborrany creat; contingut i verificació pendents.
2026-10-10T09:25:00.000Z: pla redactat d'acord amb les instruccions d'àudio del Mestre.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)
L'usuari ha indicat per àudio que les targetes "Consola Termodinàmica", "El Cervell" i "Disseny de Pedra Seca" es troben actualment duplicades (apareixen tant al Mur com a la pàgina de Control). 
A més, aquestes targetes tenen uns botons d'acció primaris molt grans (ex. "Obrir el Cervell", "Obrir la Consola") i manquen de les metadades estàndard ("Categoria" i "Etiqueta"). 
Posteriorment, ha afegit que les targetes "Rebost Domèstic" i "Salut" han de patir exactament el mateix procés: tenen el botó gran, els falten metadades i, a més, la seua targeta no mostra la capçalera taronja amb data i hora (no són canòniques). Les seues pàgines també necessiten l'entradilla de 6 paràgrafs i el botó col·locat correctament dins de l'element decorat de la pàgina.
Finalment, pel que fa a les traduccions que falten per a la clau `section.xat.error.noDelPoble`, el Mestre vol que l'expressió canvie de "no ets del poble" a la paraula "Foraster" o "Mode Foraster", ja que li resulta més autèntica, i cal emplenar els idiomes pendents (com eu i gl).

### 2. Canvis Proposats (Proposed Changes)

#### [Acció: MODIFY] `src/pages/control/ControlPage.jsx` (i/o components de maquinària de sistema relacionats)
- **Eliminar les 3 targetes:** "Consola Termodinàmica", "El Cervell", "Disseny de Pedra Seca" de la pàgina de Control per evitar la duplicitat. D'ara endavant, aquestes targetes "viuen" només al Mur.

#### [Acció: MODIFY] `src/data/wikiManifest.js` (o l'arxiu d'on isquen les dades de les targetes de sistema)
- **Per a les targetes "Consola Termodinàmica", "El Cervell", "Disseny de Pedra Seca", "Rebost Domèstic" i "Salut":**
  - Retirar l'atribut de botó gran / call to action d'elles per a igualar el disseny visual amb la resta de targetes.
  - Afegir els camps de metadades perquè es mostren igual que la resta de targetes, específicament valors per a **Categoria i Etiqueta**.
  - **Avís important per a Rebost i Salut:** Actualment no són targetes canòniques perquè els falta la data i hora a la capçalera taronja. Cal assegurar-se que fan servir exactament el mateix patró que la resta de targetes.

#### [Acció: MODIFY] `src/pages/wiki/CervellPage.jsx` (i/o `src/data/cervell-content.json` o equivalent per `/page/cervell`)
- Redactar un text explicatiu i de presentació d'uns 6 paràgrafs explicant què és el Cervell (el mapa de relacions del Mas, agents units per fils, visió general del graf de l'explorador...).
- Afegir, just a sota d'aquest text, el botó "Obrir el Cervell" (que abans estava a la targeta directament). Aquest botó permetrà la navegació real a la funcionalitat.

#### [Acció: MODIFY] `src/pages/wiki/ConsolaPage.jsx` (i/o contingut markdown equivalent per `/page/consola`)
- Redactar un text de presentació d'uns 6 paràgrafs explicant què és la Consola Termodinàmica, com funciona (per veure errors, consum, etc.) i per a què serveix el manteniment d'IAIA.
- Afegir, al final d'aquest text, el botó "Obrir la Consola".

#### [Acció: MODIFY] Pàgines de destinació de Rebost i Salut (ex. `/plugin/rebost` i `/plugin/salut`)
- **Molt important:** el botó s'ha de col·locar SEMPRE dins de l'estructura de la decoració o marc principal de la pàgina, mai fora (per mantindre la coherència Pedra Seca).

#### [Acció: MODIFY] `src/lang/ca.json` (i equivalents com `eu.json`, `gl.json`, etc.)
- Modificar el text de la clau `section.xat.error.noDelPoble` (o similar que mostre l'error de destinatari invàlid/no del poble al xat) per canviar "no ets del poble" per "Foraster" o "Mode foraster".
- Afegeix les traduccions corresponents a la resta d'idiomes pendents (euskera, gallec, etc.).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. Pujar l'entorn amb `npm run dev` i navegar a `/control`. Verificar visualment que ja no hi ha les targetes del Cervell, Consola i Disseny de Pedra Seca.
2. Navegar a `/mur` i comprovar que les targetes de sistema (incloent Rebost i Salut) hi són. Validar que tenen la capçalera amb data/hora, no tenen el botó gran d'acció i que en canvi mostren "Categoria" i "Etiqueta" alineades amb l'estil de la resta de targetes.
3. Clicar sobre la targeta "El Cervell" des del Mur. Comprovar que la pàgina oberta (`/page/cervell`) mostra al voltant de 6 paràgrafs de text descriptiu redactat en valencià i conté el botó "Obrir el Cervell" funcional al final, dins la decoració.
4. Clicar sobre "Consola Termodinàmica", "Rebost Domèstic" i "Salut" des del Mur/Control. Comprovar de la mateixa manera que mostren 6 paràgrafs de presentació seguits del corresponent botó (ubicat dins de la decoració).
5. Comprovar que el fitxer de traduccions té "Foraster" on abans deia "no ets del poble" i que hi ha traduccions per a l'euskera i el gallec.
6. Llançar la bateria de tests globals (`npx vitest run src tests`) i assegurar-se que cap test s'ha trencat.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Qualsevol test hardcoded de `ControlPage` o de `wikiManifest` que espere que aquestes targetes tinguen un `botoAccio` requerirà actualització perquè els tests passen.
- Desajustos CSS potencials al Mur quan les targetes de sistema (abans singulars amb un botó) passen a mostrar format normal amb Categoria/Etiqueta; caldrà fixar-se que no es trenca el grid.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
