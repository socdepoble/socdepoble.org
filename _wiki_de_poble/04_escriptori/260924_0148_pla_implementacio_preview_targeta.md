---
title: Pla d'Implementació - Redisseny Preview Targeta
description: Instruccions per a reconstruir la Universal Card en mode "pla" per al llistat de l'editor.
---

# Objectiu
Aconseguir que la targeta de previsualització de l'editor (la del llistat de l'esquerra a `NotaFitxa.jsx`) mostre exactament el mateix disseny que la publicació real a la seua capçalera i peu.

# Tasques a Implementar (Per a Claude)

## 1. Capçalera (Barra Taronja)
- **Fons i Color**: S'ha de garantir que l'estil `.sp-card--pla .sp-card-header` tinga fons taronja, igual que la barra de l'editor.
- **Avatar**: L'avatar de l'autor ha de tindre la grandària correcta, llevant la restricció actual de `24px` del CSS perquè coincidisca amb la de l'editor.
- **Controls de Capçalera**: 
  - S'ha d'activar el botó de data i hora a la capçalera (`NotaFitxa.jsx`).
  - S'ha d'afegir el botó d'informació ('i') a la dreta de la capçalera (igual que la barra taronja del costat).

## 2. Cos de la Targeta (Centrat)
- **Sense Cadenat**: Eliminar la icona del cadenat/llapis (Lock / PenSquare) que actualment es passa a la propietat `icon` i es pinta innecessàriament al costat del títol.
- **Alineació Central**: Com que el Bloc de Notes no té informació lateral (ni botiga, ni esdeveniments), **tot el contingut d'aquesta targeta ha d'anar centrat**: l'H3 (títol), l'H4 (subtítol) i el paràgraf de l'entradeta.

## 3. Peu de la Targeta (Div Blau)
- **Simulació del peu**: S'ha de mostrar un div blau al peu de la targeta (el clàssic `sp-card-footer`), perquè el creador entenga intuïtivament que la targeta es vorà d'eixa manera al publicar-se. Encara que ací no faça cap acció funcional, és vital per entendre les proporcions.

## Fitxers Clau:
- `src/sections/notes/NotaFitxa.jsx` (On s'inicia la UniversalCard amb `variant="pla"`)
- `src/css/components.css` (On es defineixen les classes de `.sp-card--pla`)
