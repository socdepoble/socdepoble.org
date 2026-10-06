---
type: document
status: esborrany
description: Pla per a netejar els fossils del LEDGER
tags:
  - implementacio
visibility: private
reflex: sdp:torn_c8669d8b-f421-4b52-8f4a-c59b488079ff:45e4c206-7abb-4fc4-806b-2da4c3c89d96
---
# Pla de Reparació LEDGER

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c8669d8b-f421-4b52-8f4a-c59b488079ff:45e4c206-7abb-4fc4-806b-2da4c3c89d96 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-06T00:25:32.286Z |
| Modificació | 2026-10-06T00:25:32.286Z |
| Propietari | Antigravity |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity |
| Tokens consumits | N/A |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-06T00:25:32.286Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

D'acord amb l'auditoria d'Opus i les instruccions del Mestre:
1. **LEDGER i Immutabilitat (T1):** Seguint el consell d'Opus, no esborrarem els 10 fòssils del `.agents/LEDGER.md` per respectar la Llei de la Immutabilitat. En lloc d'això, modificarem `mapa-consola` perquè tracte els peus intercalats com a històrics. Separarem les dues línies enganxades sense esborrar cap caràcter.
2. **Catàleg de Skills (T2):** Afegeix el frontmatter canònic a les dues skills noves que n'estan mancades, per tornar a posar el CI en verd.
3. **Gestoria Local (T3 - Pas 4.1):** Obrir les aplicacions locals (com `/app/gestoria`) perquè funcionen sense la redirecció de `RequireAuth`, com a prova de concepte abans d'abordar el projecte gran (clon Loyverse / Rebost).
4. **Doctrina Sollutia (T4):** Unificar la definició de "Model B" als documents (AGENTS §8, prompt_local, ADR-2026-09) per resoldre el bloqueig doctrinal d'enxufabilitat.
<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

`node tooling/verify-ledger.mjs` no ha de donar error de hash.
`node tooling/brain/mapa-consola.mjs --json` ha de reportar 0 fòssils i 0 línies mal formades.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Baix. Es corregeixen formats, no s'eliminen dades d'auditoria.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
