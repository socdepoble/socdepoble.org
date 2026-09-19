---
type: document
status: esborrany
description: Contracte de Graella
---
# Contracte de Graella

Aquest document defineix el contracte del framework de graella responsiva (`AppGridShell`).

Punts de tall (breakpoints): 720px i 1090px.

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
| `aria-label` | Etiqueta accessible |
| `className` | Classes addicionals |

## AppGridColumn

| Prop | Descripció |
|---|---|
| `titol` | Títol de la columna |
| `icona` | Icona de la columna |
| `startActions` | Accions a l'esquerra del títol |
| `endActions` | Accions a la dreta del títol |
| `accions` | (Deprecat) Ús `endActions` preferentment |
| `esquerra` | Indica si és la columna esquerra |
| `plegable` | Indica si es pot plegar |
| `obert` | Estat d'obertura |
| `onPlega` | Callback en plegar |
| `onReplega` | Callback en replegar |
| `variant` | Variant visual |
| `collapseBtnRef` | Ref al botó de plegar (successor de focus en replegar) |
| `expandBtnRef` | Ref al botó d'expandir (successor de focus en plegar) |
| `children` | Contingut interior |
