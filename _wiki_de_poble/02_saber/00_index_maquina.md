---
type: index
status: esborrany
description: Índex de la maquinària tècnica de Sóc de Poble, amb les decisions d'arquitectura, els estàndards del codi i les portes que el vigilen.
tags:
  - maquina
---
# Índex de la Màquina

El codi executable viu fora de la Wiki, a `src/` i `tooling/`; ací només hi ha el camí per a trobar-lo i entendre'l, començant per les decisions d'arquitectura que el condicionen.

## Decisions d'arquitectura

- [[ADR-2026-08-ONLINE-FIRST]] · online-first amb Supabase com a font de veritat; la PWA, Dexie i la reconciliació offline són història superada.
- [[02_saber/architecture/ADR-2026-09-SOLLUTIA-MODEL-B|ADR-2026-09-SOLLUTIA-MODEL-B]] · Model B: el frontend, 100% modular, s'endolla a Sollutia sense que Sollutia l'injecte ni el governe.
- [[00_arquitectura_tecnica_unificada]]

## Estàndards del codi

- [[estandard_integracio_react]]
- [[estandard_ui_universal]]

## Salut del sistema

- [[sistema_immunitari]]
- La cadena sencera de portes s'executa amb `npm run porta`; cada porta té el seu script propi (`npm run porta:frontmatter`, `npm run porta:cens`, `npm run porta:llaurador`…).

## Vincles

- [[00_index]]
- [[maquina]]
