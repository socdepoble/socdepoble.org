---
type: document
status: canonic
description: Taula de potència i recomanacions d'ús per a la família de models Claude i la resta de l'eixam IA.
tags:
  - estrategia
  - models
---
# Taula de Potència de Models IA

Aquesta taula recull la potència i cost relatiu dels models d'Intel·ligència Artificial usats a Sóc de Poble per garantir que assignem "cada model a la seua tasca", evitant despeses innecessàries i el buidatge sobtat del dipòsit de consum.

## Família Claude

| Model | Identificador | Potència (1–10, relativa) | Context | Preu API (entrada / eixida, $/MTok) | Consum de límit relatiu (Sonnet 5 = 1) | Lloc ideal a Sóc de Poble |
| --- | --- | --- | --- | --- | --- | --- |
| Haiku 4.5 | `claude-haiku-4-5` | 3 | 200K | 1 / 5 | 0,5 | Pic i pala mecànic: reanomenar, formatar, lectors de workflows, classificar, resumir logs. Mai decisions d'arquitectura. |
| Sonnet 4.6 | `claude-sonnet-4-6` | 5 | 1M | 3 / 15 | 1,5 | Cap: costa més que Sonnet 5 i rendix menys. Només si un contracte antic el demana. |
| Sonnet 5 | `claude-sonnet-5` | 6 | 1M | 2 / 10 | 1 | El cavall de treball: CSS i JSX de rutina, proves, documentació, refutadors d'auditoria en paral·lel. |
| Opus 4.6 / 4.7 / 4.8 | `claude-opus-4-6`, `-4-7`, `-4-8` | 6,5 / 7 / 7,5 | 1M | 5 / 25 | 2,5 | Cap raó de triar-los: mateix preu que Opus 5 i menys potència. Compatibilitat només. |
| Opus 5 | `claude-opus-5` | 8 | 1M | 5 / 25 | 2,5 | Arquitectura, refactors entre fitxers, jutge i orquestrador d'auditories, decisions de Model B. El model per defecte de Claude Code. |
| Opus 5.5 (en llançament) | `claude-opus-5-5` | 8,5 | 1M | 4 / 20 | 2 | El substitut natural d'Opus 5 quan estiga disponible al pla: mateix nivell, més barat. Només si el Mestre l'anomena. |
| Fable 5 | `claude-fable-5` | 9 | 1M | 10 / 50 | 5 | Superat per Fable 5.1 al mateix preu. |
| Fable 5.1 | `claude-fable-5-1` | 9,5 | 1M | 10 / 50 | 5 | Tasques de llarg abast amb molta autonomia: Ultracode amb refutació adversarial, auditories extremes, problemes on Opus 5 s'encalla. Cinc vegades el consum de Sonnet 5: es reserva, no es gasta en CSS. |
| Mythos 5.1 | `claude-mythos-5-1` | 9,5 | 1M | 10 / 50 | 5 | No disponible: només organitzacions aprovades (Project Glasswing). Mateix model que Fable 5.1 sense les mesures addicionals. |

## Regles de triatge que se'n deriven per al Mas

1. **La palanca barata és l'esforç, no el model antic.** Abans de baixar de model, baixar `effort` (`output_config.effort`: low, medium, high, xhigh, max): un Opus 5 a `medium` sol rendir més que un Opus 4.6 a `high` i gasta menys. Sonnet 4.6 i Opus 4.x no tenen cap lloc a la taula de costos d'un pla Pro.
2. **Cada peça al seu model.** Lectura massiva i mecànica → Haiku 4.5. Codi de rutina, proves i documents → Sonnet 5. Arquitectura, jutjar troballes i integrar → Opus 5 (5.5 quan arribe). Només el que Opus 5 no trau → Fable 5.1.
3. **Ultracode és car per construcció.** Quan s'orquestre amb Fable, els lectors i refutadors auxiliars (agents lectors) han d'anar a Haiku 4.5 o Sonnet 5 (`opts.model` del workflow) i Fable només ha de jutjar i integrar l'última part per no rebentar la quota.
4. **Codex es reserva** per a backend, RLS i migracions, mai per a CSS.
5. **Mesurar, no creure.** `node tooling/brain/tracker_consum.mjs` després de cada torn; la fila «Consum de límit relatiu» és una proporció de preu, no una lectura del pla.

## Vincles
- [[03_equip_ia]]
- [[agents_equip_ia]]
