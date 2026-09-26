---
type: norma
status: canonic
description: "Contracte UI verificable: carcassa React/Vite, components Pedra Seca i tokens --sdp-* en CSS natiu; l'annex absolutista antic ja no és norma."
tags:
  - govern
---
# Estàndard UI Universal

La interfície de Sóc de Poble es construïx amb React i Vite, components Pedra Seca i tokens semàntics en CSS natiu. Este document només recull el que es pot verificar al codi; tota promesa de «100%» que no passe per una porta real és deute declarat, no norma.

## Contracte vigent i verificable

- React/Vite és la carcassa productiva legítima.
- La implementació universal localitzable viu dins de `src/components/PedraSeca/` i en `src/components/universal/workspace/`.
- Les classes antigues (`sp-*`) i l'enfocament basat en Tailwind estan deprecats. Els estils són CSS natiu amb `@layer`, cosits per `src/css/index.css` i adoptats dins del Shadow DOM. Els tokens semàntics `--sdp-*` es declaren a `src/css/tokens.css`; les constants de marca (`--sdp-canon-*`) naixen a `src/config/design-tokens.json`.
- Encara existixen estils inline i peces legacy. Són deute mesurable, no una
  infracció que el CI ja bloquege en totes les rutes.
- Accessibilitat i compatibilitat amb el Baseline 2022 només es declaren per
  l'scope que haja superat proves reproduïbles. El funcionament offline no és un objectiu: l'arquitectura és online-first ([[ADR-2026-08-ONLINE-FIRST]]).

Prevalen [[doc_governanca]], Pedra Seca (Design System actual), el codi, ESLint i les
proves reals. L'antic annex històric d'este estàndard ja no forma part del document:
descrivia una aspiració fusionada, contenia rutes i gates que no existixen i no pot
autoritzar canvis ni justificar un «100%».

## Vincles

- [[00_index]]
- [[doc_governanca]]
- [[ADR-2026-08-ONLINE-FIRST]]
- [[estandard_integracio_react]]
