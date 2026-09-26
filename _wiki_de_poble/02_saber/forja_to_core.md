---
type: protocol
status: esborrany
description: Conserva com a proposta futura l'homologació de peces pures sense contradir la carcassa React/Vite actual.
tags:
  - govern
---
# Forja a Core — proposta futura

Proposta per a extraure algun dia peces de JavaScript pur o Web Components quan un cas real necessite reutilitzar-les fora de React. No està activa: la carcassa legítima continua sent React/Vite, i cap agent pot usar este text per a moure components ni declarar una homologació superada.

Este protocol **no està implementat en la baseline actual**. No existixen
`src/forja/` ni `src/core/`, cap de les portes de `npm run porta` comprova
esta homologació i res del que diu autoritza a rebutjar React.

La decisió canònica vigent és la de [[doc_governanca]] i de l'estàndard
Pedra Seca ([[estandard_ui_universal]] i la skill `sdp-pedra-seca`): React/Vite
és la carcassa productiva legítima. El codi es localitza en `src/sections/`,
`src/components/`, `src/config/` i `src/data/`.

## Hipòtesi que es conserva

En el futur pot ser útil extraure una peça a JavaScript o Web Components purs
quan un cas d'ús real necessite reutilització fora de React. La promoció seria
optativa i incremental; no una reescriptura general per decret.

Abans d'activar este protocol caldria:

1. una ADR que definisca el problema, la frontera i el cost de mantindre dos
   models de components;
2. crear les rutes reals i adaptar les regles d'agents;
3. implementar una prova reproduïble al Baseline 2022 (Safari/iOS 16);
4. definir compatibilitat, accessibilitat i comportament davant d'errors de xarxa
   mesurables (l'offline total queda fora: [[ADR-2026-08-ONLINE-FIRST]]);
5. integrar el gate en CI i demostrar-lo amb una regressió negativa;
6. establir un rollback i una política que impedisca duplicar components.

## Criteris candidats d'homologació

Només després de l'activació anterior, una peça candidata podria exigir:

- cap dependència UI injustificada;
- CSS basat en tokens semàntics `--sdp-*`;
- HTML semàntic, focus visible i objectius tàctils verificats;
- errors de xarxa honestos en l'scope declarat;
- zero imports creuats que trenquen la frontera acordada;
- informe generat per proves, no un JSON escrit manualment.

## Vincles

- [[00_index]]
- [[doc_governanca]]
- [[00_arquitectura_tecnica_unificada]]
- [[estandard_ui_universal]]
- [[ADR-2026-08-ONLINE-FIRST]]
