---
type: document
status: esborrany
description: Pla per a reprendre l'Onada 3
tags:
  - implementacio
visibility: private
reflex: sdp:torn_38e0bd5e-f2c7-4990-aa0e-c869c738a1e0:3bc9d5d5-2469-4d45-8a0d-090df5a64380
---
# Pla Relleu Rentonar

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_38e0bd5e-f2c7-4990-aa0e-c869c738a1e0:3bc9d5d5-2469-4d45-8a0d-090df5a64380 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-07T20:04:10.611Z |
| Modificació | 2026-10-07T20:04:10.611Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude 3.5 Sonnet |
| Tokens consumits | 0 |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-07T20:04:10.611Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

S'ha d'assumir la continuació exacta de l'auditoria anterior. Les tasques són:
1. Completar la revisió adversarial de l'Històric de Notes (peça de l'Editor Universal).
2. Construir el minicarregador ESM (Code Splitting) per a compilar el paquet de WordPress, ja dissenyat i ajornat.
3. Aplicar les 4 decisions UX descrites a `261007_1845_decisions_iaia.md`.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Verificació automàtica: Passar tota la suite `npm run test` (les bateries afectades per les modificacions han de mantenir els 47 verds).
- Compilació `npm run build:wp` exitosa usant el nou carregador ESM.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Tocar codi que ja ha sigut auditat i donat per bo a la fase inicial de l'Onada 3. El Relleu delimita molt bé el que falta per fer. L'adherència al document de relleu és fonamental.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
