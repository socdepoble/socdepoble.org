---
type: document
status: esborrany
description: Contracte de Graella
---
# Contracte de Graella

Aquest document defineix el contracte del framework de graella responsiva (`AppGridShell`).

Punts de tall (breakpoints): 720px, 900px i 1023px (`PUNTS_DE_TALL` de `src/components/layout/graella.js`).

## AppGridShell

| Prop | Descripció |
|---|---|
| `children` | El contingut de la graella |
| `leftColumn` | Component per la columna esquerra |
| `middleColumn` | Component per la columna central |
| `rightColumn` | Component per la columna dreta |
| `leftTitle` | Títol columna esquerra |
| `middleTitle` | Títol columna central |
| `leftCollapsed` | Estat inicial plegat esquerra |
| `middleCollapsed` | Estat inicial plegat central |
| `initialPane` | Panell actiu inicial en mode mòbil |
| `panellEstret` | Panell estret per defecte |
| `tornaEstret` | Retorn del panell estret |
| `onPanell` | Notifica panell assentat |
| `railEstret` | Rail esquerre fix en estret |
| `columnesFixes` | Fora de mòbil (més de 720px), les tres columnes queden fixes a la graella i redimensionables amb els dos separadors, mai com a calaix flotant; el vel i els panells flotants només en estret. L'usa l'UniversalWorkspace (ordre del Mestre 261030) |
| `aria-label` | Etiqueta accessible |
| `className` | Classes addicionals |

## AppGridColumn

| Prop | Descripció |
|---|---|
| `titol` | Títol de la columna |
| `icona` | Icona de la columna; amb `onReplega`, a la capçalera oberta és un botó germà del [\|<] que fa el mateix i, plegada, el rail porta la mateixa icona al mateix lloc per a desplegar-la (ordre d'usabilitat del Mestre 261030) |
| `startActions` | Accions a l'esquerra del títol |
| `endActions` | Accions a la dreta del títol |
| `accions` | (Deprecat) Ús `endActions` preferentment |
| `esquerra` | Indica si és la columna esquerra |
| `esDark` | Indica si la columna usa la variant fosca |
| `plegable` | Indica si es pot plegar |
| `obert` | Estat d'obertura |
| `onPlega` | Callback en plegar |
| `onReplega` | Callback en replegar |
| `replegaTotaCapcalera` | Tota la fila de la capçalera oberta és el botó de replegar; només l'usa el Xat, i l'UniversalWorkspace ja no la passa (ordre d'usabilitat del Mestre 261030: hi pleguen la icona i el [\|<], i el títol és fix) |
| `etiquetaReplega` | Etiqueta per a la icona de replegar |
| `controls` | aria-controls de l'acció |
| `replegaCompacte` | Replegador visible a mòbil (P6) |
| `expandObridor` | Declara expandir com a obridor |
| `variant` | Variant visual |
| `collapseBtnRef` | Ref al botó de plegar (successor de focus en replegar) |
| `expandBtnRef` | Ref al botó d'expandir (successor de focus en plegar) |
| `children` | Contingut interior |

## Vincles

- [[00_index_escriptori]]
