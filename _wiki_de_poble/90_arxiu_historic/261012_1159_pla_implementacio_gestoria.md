---
type: document
status: esborrany
description: Pla per a adaptar el tauler de la Gestoria a les dades reals i fer la declaració del 3T.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_259babc9-63b6-4d31-89c7-d5459a6bb191:5eee1c01-fdce-412e-b0a7-b71ad095d5cb
---
# Pla per a la Gestoria i Trimestre 3

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_259babc9-63b6-4d31-89c7-d5459a6bb191:5eee1c01-fdce-412e-b0a7-b71ad095d5cb |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-12T09:59:20.292Z |
| Modificació | 2026-10-12T09:59:20.292Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude 3.5 Sonnet |
| Tokens consumits | [estimat: ~4000 tokens] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-12T09:59:20.292Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

- Adaptar el codi del panell de control de la gestoria creat prèviament per a que pugui llegir l'estructura real que el Mestre té a `_gestoria_de_poble/02_Facturacio` (carpetes anuals i trimestrals: `2026_1T`, `2026_2T`, `2026_3T`, etc.).
- Elaborar un panell de control de facturació que mostri el que passa dins de la gestoria.
- Preparar tota la documentació (informes o panell) necessària per presentar la declaració trimestral de l'IRPF/IVA (Trimestre 3T).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- El panell ha de ser capaç d'entendre i parsejar els noms de fitxer i l'estructura real que el Mestre usa a la seva gestoria local.
- Les dades trimestrals pel 3T han de quedar clares i documentades per a la seva presentació immediata a Hisenda.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Risc de format d'arxiu: els PDFs i PNGs no es podran llegir automàticament si només fem codi de panell, així que Claude haurà de rebre les dades o orientar com pujar-les a la interfície que ell crearà.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
