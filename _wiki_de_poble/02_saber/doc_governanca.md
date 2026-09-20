---
type: norma
status: canonic
description: Fixa l'autoritat, els límits d'execució i la frontera React/Vite sense atribuir mecanismes inexistents al sistema.
tags:
  - govern
---
# Governança d'execució

## Jerarquia de veritat

1. `AGENTS.md` de l'arrel.
2. `.agents/AGENTS.md` i `.agents/PROTOCOL_PETORRETA.md`.
3. `.agents/skills/socdepoble-workflow/SKILL.md`.
4. Codi, schema, configuració i proves reproduïbles.
5. Normes canòniques de `03_GOVERNAR` que no contradiguen els nivells anteriors.
6. Wiki explicativa, arxiu i registres històrics.

L'humà conserva la decisió final sobre producte, risc, publicació, llicència i
canvis irreversibles. Una nota, una frase d'activació o una puntuació anterior
no amplien una lease.

## Principis

- **Sobirania:** dades i decisions han de poder auditar-se i exportar-se.
- **Local amb fallback:** una funció es declara resilient només després de
  provar desconnexió, persistència i recuperació.
- **Pedra Seca:** estructura semàntica, CSS amb tokens, dependències
  justificades i simplicitat proporcional.
- **Accessibilitat:** disseny per a persones reals i verificació en el dispositiu
  objectiu.
- **Fail closed i reversible:** si falta evidència, l'operació s'atura; una
  mutació d'alt risc necessita Reflex, pla, backup i rollback.

## Frontera arquitectònica vigent

React/Vite és la carcassa productiva legítima. Les responsabilitats actuals
viuen en `src/sections`, `src/components`, `src/config` i `src/data`. No
existixen `src/core` o `src/forja` com a fronteres actives i no es creen per
decret.

Si en el futur s'extrau un core pur, la dependència podrà anar de la UI cap al
core, mai del core cap a React, DOM o adaptadors remots. Eixa frontera només
entra en vigor quan tinga ADR, rutes, proves i propietari.

## Gates reals

- `wiki:test`;
- `wiki:audit:strict`;
- `precommit:sdp` sobre l'arbre preparat;
- Reflex per a efectes laterals;
- CI i protecció de branca una vegada versionats i activats.

Els mecanismes CRDT, OPFS, bateria, “SSI” o IFT no formen part del bloqueig
actual. El contracte executiu detallat és [[sdp_lock]].


**Ancoratge de Seguretat:** [[00_index]]

