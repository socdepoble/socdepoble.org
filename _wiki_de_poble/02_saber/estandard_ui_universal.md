---
type: norma
status: canonic
description: Distingix el contracte UI verificat de l'annex històric absolutista que encara no està implementat com a gate.
tags:
  - govern
---
# Estàndard UI Universal

## Contracte vigent i verificable

- React/Vite és la carcassa productiva legítima.
- La implementació universal localitzable viu ara dins de `src/components/PedraSeca/` i en `src/components/universal/workspace/`.
- Les classes antigues (`sp-*`) i l'enfocament basat en Tailwind estan deprecats en favor de l'encapsulació CSS amb mòduls i tokens centralitzats en JSON (`src/config/design-tokens.json`).
- Encara existixen estils inline i peces legacy. Són deute mesurable, no una
  infracció que el CI ja bloquege en totes les rutes.
- Offline, accessibilitat i compatibilitat amb el Baseline 2022 només es declaren per
  l'scope que haja superat proves reproduïbles.

Prevalen [[doc_governanca]], Pedra Seca (Design System actual), el codi, ESLint i les
proves reals. El text següent es conserva com a **annex històric no normatiu**:
descriu una aspiració fusionada, conté rutes i gates que no existixen i no pot
autoritzar canvis ni justificar un “100%”.



## Vincles
- [[00_index]]

