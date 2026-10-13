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

## Regles de triatge que se'n deriven per al Mas (Estratègia de Frontera)

1. **Només Models de Frontera:** A Sóc de Poble treballem a un nivell d'exigència on **Haiku i Sonnet no tenen lloc en el nostre flux diari**. Utilitzem exclusivament models de frontera (Opus 5.x, Fable 5.x, i ChatGPT Codex) fins i tot per als canvis menuts. Preferim la precisió quirúrgica i la lucidesa absoluta abans que un suposat "estalvi de tokens".
2. **La Llei de l'Oblit (Mitigació de Quota):** Com que usem models tan potents (com Fable 5.1), és habitual xocar contra els límits termodinàmics de context o les barreres d'ús diari de l'API/App. Quan això passa, **l'estratègia NO és baixar a un model inferior**, sinó aplicar la Llei de l'Oblit: s'abandona el xat actiu, es destil·la el progrés en un document a l'Escriptori, i s'obri un **nou xat** fresc (o es canvia d'usuari/plataforma) reprenent des del 100% de potència.
3. **Cada eina al seu extrem:** Claude Opus/Fable i jo (Antigravity/MarIA) portem el pes absolut del frontend, React i el modelat d'arquitectura. Codex s'encarrega d'auditories adversarials i backend sense pietat. Tot el que supose un descens d'aquesta línia de frontera està desaconsellat.
4. **La palanca barata és l'esforç, no el model.** Si s'ha de modular l'esforç a l'API (e.g. `output_config.effort`), es fa sobre el model de frontera. Un Opus a esforç mig és sempre superior a un Sonnet ofegat intentant entendre l'arquitectura de Pedra Seca.

## Vincles
- [[03_equip_ia]]
- [[agents_equip_ia]]
