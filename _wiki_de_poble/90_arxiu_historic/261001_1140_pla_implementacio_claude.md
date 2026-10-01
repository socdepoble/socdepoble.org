---
type: document
status: canonic
description: Revisió adversarial de la UI
tags:
  - implementacio
visibility: private
reflex: sdp:torn_440f1d06-27e2-4754-997e-b8b416189fad:6e86a931-ded9-498d-85d9-bed8af05543e
---
# Pla d'Implementació Revisió Codex

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_440f1d06-27e2-4754-997e-b8b416189fad:6e86a931-ded9-498d-85d9-bed8af05543e |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T09:40:36.086Z |
| Modificació | 2026-10-01T09:40:36.086Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 30f1b3310dd558c625a0cef2562b28ee8f08351afd719136367464a3b12aff38. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-01T09:40:36.086Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

- Revisar l'Error Boundary al Calendari, detectar el component erroni (VistaSetmana, VistaMes, o propietats faltants de franges horàries) i corregir-lo.
- Revisar `UniversalCard.jsx` i `PoblesSection.jsx` per recuperar l'Avatar que no es renderitza.
- A `UniversalCard.jsx`, llevar qualsevol condicional que amague la pastilla de data i hora (`DataPill`) depenent de la secció (Pobles/Mur). El `DataPill` sencer ha de ser visible a tot arreu.
- Revisar la lògica de generació del node de l'autor (`autor` object) per assegurar que si l'autor és el Mestre (Javi), use les dades del Mestre localment en compte del logo genèric de Sóc de Poble a la secció Mercat.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Provar navegació a `/calendari` -> Error Boundary resolt i les vistes carreguen bé.
- Provar navegació a `/pobles` -> Avatar present i Pastilla de Data/Hora present.
- Provar navegació a `/mercat` -> Targetes locals mostren boina i avatar de "Javi".
- Provar navegació a `/xat` (Mur) -> Totes les targetes de "Sóc de Poble" mostren la pastilla d'hora i data (legal).

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Els canvis a `UniversalCard` tenen gran abast, podrien trencar les vistes de Feed i Articles on ja es pinta bé. Cal provar exhaustivament.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
