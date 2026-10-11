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
- [[02_saber/architecture/ADR-2026-10-APPS-DEL-DISPOSITIU|ADR-2026-10-APPS-DEL-DISPOSITIU]] · esmena de l'ADR-2026-08 (pendent de signatura): dades del dispositiu amb deures d'exportació i la closca de /app/* al service worker del lloc propi.
- [[02_saber/architecture/ADR-2026-11-PAGINACIO-SECCIONS|ADR-2026-11-PAGINACIO-SECCIONS]] · capacitat opcional del port (pendent de signatura): «Mostra més» al Mur i al Mercat després de les 50 primeres publicacions, amb un cursor (created_at, id).
- [[02_saber/architecture/ADR-2026-12-MODULS-OPCIONALS|ADR-2026-12-MODULS-OPCIONALS]] · mòduls opcionals (pendent de signatura): el contracte sdp.modul.v1, el nucli SocDePoble.nucli, la guarda financera i el pressupost de pes; la Gestoria, primer mòdul.
- [[02_saber/architecture/ADR-2026-13-BYOP-XIFRAT-LOCAL|ADR-2026-13-BYOP-XIFRAT-LOCAL]] · xifrat local BYOP (esborrany): el cofre de la Gestoria com a nucli compartit, el magatzem xifrat damunt de creaMagatzemIdb, la clau només en memòria, un sol cofre compartit de moment (D-16, 261011) i la guarda de document propi sense relaxar a WordPress amb el cofre actiu (D-17, 261011); en altres amfitrions, pendent del Mestre.
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
