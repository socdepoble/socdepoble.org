---
type: document
status: esborrany
description: Pla per desplegar l'actualització del plugin de WordPress amb els últims canvis a les targetes i els filtres del mur.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_8d18b767-4c6b-4e95-ba17-9d4ca76e7ad3:75efc703-e786-4b73-8656-c1f4d61c7712
---
# Desplegament del Plugin

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_8d18b767-4c6b-4e95-ba17-9d4ca76e7ad3:75efc703-e786-4b73-8656-c1f4d61c7712 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-08T18:33:26.062Z |
| Modificació | 2026-10-08T18:33:26.062Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude 3.5 Sonnet |
| Tokens consumits | N/A |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

Cap historial anterior rellevant en aquest document.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

- S'ha afegit un filtre 'Sóc de Poble' al Mur de Sóc de Poble (`MurSection.jsx`).
- S'ha fet un empaquetat actualitzat per WordPress mitjançant `npm run build:wp`.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

S'ha verificat la build de producció del lloc web i s'ha creat l'arxiu d'extensió de WordPress (`socdepoble-react-latest.zip`).

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Desconnexions si el Mestre no fa les migracions de DB (`2610081400`, `2610081401`, `2610081402`, `2610081543`).

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
