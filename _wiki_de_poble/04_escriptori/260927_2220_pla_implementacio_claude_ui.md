---
type: document
status: esborrany
description: Pla per fer els blocs d'icones més compactes
tags:
  - implementacio
visibility: private
reflex: sdp:torn_0b48dfc8-211c-45e9-a74a-69ec6d9c8f8f:6bf43e39-90f2-4cf5-b275-e915fa7aa6af
---
# Agrupació visual de la barra blava (T20)

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_0b48dfc8-211c-45e9-a74a-69ec6d9c8f8f:6bf43e39-90f2-4cf5-b275-e915fa7aa6af |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-27T20:22:42.735Z |
| Modificació | 2026-09-27T20:22:42.735Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-27T20:22:42.735Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

**T20: Barra Blava**
Després de completar la lògica amb Codex (T15-T19) i fortificar la separació de dades i sessió, s'ha detectat massa espai en blanc entre els grups d'icones a la barra blava de l'aplicació (`.bar-blue`). L'objectiu és que els blocs d'icones es vegen com "packs" o "trios" molt més compactes i units visualment:
- **Pack 1 (Esquerra):** Fletxa arrere, Llibre (Índex) i Fletxa endavant.
- **Pack 2 (Dreta):** Traduir, Comentar i Compartir.
1. Revisar els arxius `src/css/layout.css` i `src/css/components.css`.
2. Eliminar marges o paddings sobrants en els `.sp-card-action` i `.icon`.
3. Mantenir la mida de l'àrea tàctil base de l'arquitectura de Pedra Seca (`var(--sdp-touch)`).

**T22: Sincronització Foraster**
1. Quan un usuari navega com a convidat, el nom "Foraster" i el subtítol "Poble de la persona forastera" han d'estar sempre sincronitzats a la interfície (ex: components de perfil i converses). En iniciar sessió de veritat, han de reflectir les dades reals.

**T23: Iconografia Universal i Emoticones**
1. Eliminar la icona d'intel·ligència artificial (IA) de la Universal Page (on ja no fa falta).
2. Permetre que l'usuari puga afegir emoticones per substituir les icones de sistema.
3. Si un element no té emoticona i està en mode d'edició (s'està editant la pàgina), mostrar una icona de ploma per indicar que és editable. Si s'ix de l'edició, la ploma desapareix. Si l'usuari assigna una emoticona, la ploma desapareix definitivament per donar pas a l'emoticona guardada.

**T24: Icona de Control (Sidebar)**
1. Substituir la icona del rail principal quan està col·lapsat (actualment mostra un rectangle amb fletxa) per la icona de la roda dentada de "Control".

**T25: Separació visual de pestanyes (Carpetes/Notes)**
1. Aplicar una línia taronja d'uns 4 píxels a la part inferior del `div` contenidor de "CARPETES" i "NOTES". Aquesta línia ha d'actuar **cap a fora** del component (amb un `box-shadow` extern i un `z-index` superior perquè solape cap avall). Així, en lloc de restar espai intern i semblar trencat, es fondrà amb el taronja de les columnes següents garantint la continuïtat de la quadrícula.

**T26: Unificació del menú de subseccions**
1. Corregir els marges dels elements actius (fons taronja) a les llistes de subseccions (com Notes personals i Disseny) perquè ocupen el 100% de l'amplada fins a la vora dreta, igual que fa el Xat.
2. Afegir la lògica perquè a la Universal Page (Wiki de Poble), el primer element ("Wiki de Poble" o equivalent) aparega seleccionat (actiu) per defecte en carregar la vista, unificant el comportament amb la resta de seccions.

**T27: Sincronització de l'estat actiu de la barra lateral**
1. Modificar la lògica de navegació o les classes CSS actives de la barra principal (el *sidebar* esquerre). Cal garantir que la secció arrel (per exemple, "Xat") mantinga l'estat de selecció (color taronja i icona) encara que l'usuari interaccione o navegue per subseccions secundàries com ara "Control del xat". Mai pot quedar la barra principal completament sense element actiu.

**T28: Alineació perfecta a les subseccions**
1. Inspeccionar l'estructura HTML i les classes CSS de la llista d'opcions del submenú de "Xat" (on l'alineació icona-text està perfecta).
2. Uniformitzar els components de la llista a "Disseny", "Wiki de Poble" i "Notes personals" perquè utilitzen exactament la mateixa base. Tot ha de quedar perfectament alineat en columna.
<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Els botons de navegació (fletxes i llibre) pareixen un sol grup visual, igual que els botons d'acció de la dreta, a localhost.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Tocar marges pot afectar l'alineació del botó de "Connectar" de la dreta. Vigila que tot mantinga el centre vertical.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
