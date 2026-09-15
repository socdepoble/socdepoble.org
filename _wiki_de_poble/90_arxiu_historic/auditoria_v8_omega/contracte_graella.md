---
tipus: document
estat: esborrany
description: Contracte Graella
---
# Contracte Graella

El framework de graella es basa en `AppGridShell` i `AppGridColumn`.

## AppGridShell

| Prop | Descripció |
|---|---|
| `children` | El contingut lliure per defecte |
| `leftColumn` | La columna esquerra |
| `middleColumn` | La columna central |
| `rightColumn` | La columna dreta |
| `leftTitle` | El títol de la columna esquerra per a pantalles xicotetes |
| `middleTitle` | El títol de la columna central per a pantalles xicotetes |
| `leftCollapsed` | Si la columna esquerra està col·lapsada (replegada) |
| `middleCollapsed` | Si la columna central està col·lapsada (replegada) |
| `initialPane` | Quin panell s'obri per defecte ('left', 'middle', 'right') |
| `aria-label` | Etiqueta per a l'accessibilitat |
| `className` | Classes CSS extra |

Els punts de tall (breakpoints) que governen la responsivitat de l'AppGridShell són **720px** i **1090px**.

## AppGridColumn

| Prop | Descripció |
|---|---|
| `titol` | El títol de la columna |
| `icona` | Icona per a la capçalera |
| `esquerra` | Element a l'esquerra (per exemple, botó Tot o lupa) |
| `accions` | Elements d'acció a la dreta del títol |
| `plegable` | Booleà que indica si la columna es pot plegar |
| `obert` | Estat d'obertura (controlat) |
| `onPlega` | Cridat quan l'usuari vol tancar |
| `onReplega` | Cridat quan l'usuari vol obrir de nou |
| `variant` | 'default', 'mur', 'notes' (determina estils interns de fons i layout) |
| `children` | Contingut de la columna |
