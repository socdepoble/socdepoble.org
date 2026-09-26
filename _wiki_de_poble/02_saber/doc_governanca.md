---
type: norma
status: canonic
description: Fixa l'autoritat, els límits d'execució i la frontera React/Vite sense atribuir mecanismes inexistents al sistema.
tags:
  - govern
---
# Governança d'execució

Esta norma fixa qui mana quan dos fonts discrepen, quins principis limiten l'execució i quines portes existixen de veritat. L'humà conserva sempre la decisió final.

## Jerarquia de veritat

1. `AGENTS.md` de l'arrel, que és el BIOS (`.agents/AGENTS.md` n'és un mirall generat).
2. `.agents/PROTOCOL_PETORRETA.md`.
3. `.agents/skills/sdp-workflow/SKILL.md` i la resta de procediments de `.agents/skills/`.
4. Codi, schema, configuració i proves reproduïbles.
5. Normes canòniques de la Wiki (`type: norma`) que no contradiguen els nivells anteriors.
6. Wiki explicativa, arxiu i registres històrics.

L'humà conserva la decisió final sobre producte, risc, publicació, llicència i
canvis irreversibles. Una nota, una frase d'activació o una puntuació anterior
no amplien una lease.

## Principis

- **Sobirania:** dades i decisions han de poder auditar-se i exportar-se.
- **Online-first:** Supabase és la font de veritat de les dades compartides; la
  memòria cau local és opcional i no autoritativa, i els errors de xarxa es
  mostren amb honestedat ([[ADR-2026-08-ONLINE-FIRST]]).
- **Enxufable (Model B):** el frontend és 100% modular i s'endolla a Sollutia
  com un enxufe; Sollutia no l'injecta ni el governa
  ([[ADR-2026-09-SOLLUTIA-MODEL-B]]).
- **Pedra Seca:** estructura semàntica, CSS amb tokens semàntics `--sdp-*`,
  dependències justificades i simplicitat proporcional.
- **Accessibilitat:** disseny per a persones reals i verificació en el dispositiu
  objectiu.
- **Fail closed i reversible:** si falta evidència, l'operació s'atura; una
  mutació d'alt risc necessita Reflex, pla, backup i rollback.

## Frontera arquitectònica vigent

React/Vite és la carcassa productiva legítima. Les responsabilitats actuals
viuen en `src/sections`, `src/components`, `src/config` i `src/data`. No
existixen `src/core` o `src/forja` com a fronteres actives i no es creen per
decret.

Sollutia és l'amfitrió: allotja el Web Component i hi pot passar la sessió,
però no injecta implementacions al port de backend (`src/data/backendPort.js`).
Les dades compartides viuen a Supabase amb RLS i la Frontissa només llig de
Sollutia per `GET`.

Si en el futur s'extrau un core pur, la dependència podrà anar de la UI cap al
core, mai del core cap a React, DOM o adaptadors remots. Eixa frontera només
entra en vigor quan tinga ADR, rutes, proves i propietari.

## Gates reals

- `npm run porta`, la cadena de portes de `tooling/gates/run-portes.mjs`;
- portes soltes com `npm run porta:frontmatter`, `npm run porta:cens` o
  `npm run porta:teixit`;
- `npm run lint` i `npm test`;
- el hook `.husky/pre-commit` sobre l'arbre preparat (frontissa de contingut,
  taxonomia, plantilla viva i `tooling/gates/git-staged.mjs`);
- `npm run tancar` per al tancament del torn;
- Reflex per a efectes laterals;
- CI i protecció de branca una vegada versionats i activats.

Els mecanismes CRDT, OPFS, bateria, “SSI” o IFT no formen part del bloqueig
actual. El contracte executiu detallat és [[sdp_lock]].

## Vincles

- [[00_index]]
- [[sdp_lock]]
- [[ADR-2026-08-ONLINE-FIRST]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[soci_sollutia]]
- [[00_arquitectura_tecnica_unificada]]
