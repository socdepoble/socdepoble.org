---
type: prompt
status: actiu
description: Petorreta per a Claude per investigar i solucionar el bloqueig total de la interfície.
tags: [ui, bugfix, claude]
destinatari: claude
---
# Prompt de Resolució d'Incidències (SDP - v2.3)

Actua com a Enginyer Frontend i Agent Local de el Mas Virtual "Sóc de Poble".

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` (No cal pla per a un hotfix).
- [x] **Rebut obtingut** per a este fitxer.

## Registre

> **Instrucció Obligatòria:** Quan generes el document final, has d'omplir el camp "Model IA" amb el teu motor exacte (ex: Claude 3.5 Sonnet).

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260924-BUGFIX |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-24 01:30 |
| Modificació | 26-09-24 01:30 |
| Propietari | IAIA MarIA |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | _wiki_de_poble/04_escriptori/260924_0130_prompt_claude_bugfix.md |
| Rebut | sdp:torn:claude-bugfix |
| Tall d'evidència | HEAD |
| Aprovació humana | aprovat |
| requires_human_decision | false |
| Model IA | Claude |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA perquè jo com a coordinadora no dec tocar codi, i el Mestre humà ha detectat un error greu a la interfície.

## Context

Recentment hem tocat `UniversalCard.jsx`, `NotaFitxa.jsx` i `components.css` per a afegir la variant `sp-card--pla` a les targetes. A més, hem apedaçat un error a `WikiDePobleSection.jsx` on no es trobava la clau `wikidepoble` a `PAGE_COPY`.

## Instrucció del torn

Mestre Claude, el Mestre humà informa del següent error crític:
*"La web ahora mismo no funciona. No funciona nada. Pinches donde pinches se queda parada. Y la consola no marca ningún error."*

Açò indica que possiblement hi ha una capa invisible (overlay) bloquejant els clics arreu de l'aplicació, o algun problema de rendiment/bucle silenciós de React, o potser els enllaços/navigate s'han trencat en algun component d'enrutament sense llançar cap excepció.

### Tasques d'Execució
1. **Investigació:** Revisa els darrers canvis fets a `UniversalCard.jsx` (especialment les classes o l'element `sp-card-link-overlay`), l'estructura de la `UniversalPage`, o qualsevol *z-index* a `components.css` que puga estar ocupant tota la pantalla i robant els clics.
2. **Solució:** Troba l'arrel d'aquest bloqueig i aplica la correcció necessària al codi CSS o JSX.
3. **Verificació:** Assegura't utilitzant MCP o entenent bé el DOM que la web torna a ser interactiva (els clics funcionen).

## Protocol de la Reunió a l’Olivera

Una vegada hages arreglat el codi:
1. Deixa constància del que estava fallant (per exemple, un `div` absolut o un error d'estat) i com ho has solucionat.
2. Modifica el `.agents/ESTAT.md` anotant que s'ha resolt l'error de bloqueig total (hotfix).

Endavant! A destapar la web!

## Vincles
- [[00_index]]
- [[00_index_escriptori]]
