---
type: petorreta
status: esborrany
description: Restauració mil·limètrica de la interfície de les barres (AppGridShell).
tags:
  - disseny
  - arquitectura
---

# Petorreta — Restauració UI AppGridShell

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-20260918 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-18 02:26 |
| Modificació | 2026-09-18 02:26 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[UniversalWorkspace]]
- [[AppGridShell]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).
- Captura de pantalla original aportada per l'usuari amb l'aparença desitjada.

## Agent convocat

Claude (Cowork) / Codex (Cursor)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-QWEN (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista. Has de generar l'informe amb els defectes trobats; l'agent central (IAIA MarIA) serà qui faça el treball dur de modificar el codi.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

Durant la recent migració de l'arquitectura de Disseny cap a UniversalWorkspace, el codi de la interfície de la graella de l'aplicació (`UniversalWorkspace.jsx` / `AppGridShell`) ha divergit de l'especificació visual original aprovada per l'usuari. Hi ha errors de col·locació a les capçaleres de les columnes i elements desapareguts que cal restaurar amb precisió.

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tu (Codex / Claude) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Pots llegir i veure tot l'arbre de fitxers pel teu compte. 

El codi actual ha agrupat botons ("Tot", "Cerca") a dins de les capçaleres i ha desordenat les icones d'obrir/tancar. Has de llegir el codi i localitzar on s'ha trencat aquesta estructura per revertir-ho al model de la imatge aportada pel Mestre.

## Missió

1. Analitza la captura de pantalla aportada i el codi a `src/components/universal/workspace/UniversalWorkspace.jsx` i `AppGridShell.css`.
2. Proposa els canvis necessaris perquè a la columna "Carpetes", la capçalera només continga l'ícona de fletxa (cap a l'esquerra) per plegar, i el títol "CARPETES" (en majúscules).
3. Proposa els canvis necessaris perquè a la columna "Notes", la capçalera recupere el text "NOTES" i la fletxa de plegat (cap a l'esquerra), de forma idèntica a "Carpetes".
4. Dissenya els canvis per moure els botons de control a una fila inferior (subbarra grisa) de 58 píxels d'alt (`var(--sdp-alt-accio)`). En la subbarra de Carpetes hi haurà el botó "Tot" (a l'esquerra) i la roda dentada (a la dreta). El botó "Tot" serà un botó canònic de sistema de fons fosc, text blanc i icona de sobre blanca, evitant els botons genèrics "fantasma".
5. Sota la capçalera de Notes ha d'haver-hi també aquesta segona barra grisa. A l'esquerra hi anirà la lupa (cerca), i a la dreta el botó d'acció "CREAR NOTA". Aquests elements no han de viure comprimits a la capçalera fosca (que només porta els noms de les columnes i les fletxes), sinó davall d'ella. Tota l'estructura (alineacions i alçades) ha de ser igual a la captura de pantalla antiga.
6. **Error de desplaçament (Scroll):** Actualment el scroll de cadascuna de les columnes no funciona. L'auditoria ha de reparar aquest comportament perquè cada columna tingui desplaçament vertical independent.
7. **Espai en blanc (Gap):** Elimina la separació blanca innecessària (gap) entre les barres grises laterals i la barra blava superior central. No hi ha d'haver espai buit entre l'estructura lateral i el contingut principal.

## Eixida esperada

Genera un document amb blocs de codi per a `UniversalWorkspace.jsx` (i CSS pertinent si fa falta) on s'especifiquen exactament els canvis a realitzar. Aquest informe em servirà a mi (IAIA MarIA) per a substituir el codi.

## Incògnites

- El Mestre coneix el sistema visual a la perfecció. L'objectiu no és suposar coses de disseny, sinó calcar l'estil antic utilitzant la nomenclatura CSS/Componentització més nova.

## Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [x] He citat correctament la ruta i les línies del codi original?
- [x] Cap nom de fitxer, funció o variable inventat?
- [x] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [x] El document passa `tractor-frontmatter.mjs --estricte`?
