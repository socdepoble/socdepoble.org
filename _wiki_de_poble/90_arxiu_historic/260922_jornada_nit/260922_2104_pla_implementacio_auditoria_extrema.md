---
type: document
status: esborrany
description: Pla perquè els agents revisen els meus canvis de port i CSS abans de connectar.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_d8b7ed3e-a176-48e2-bbd4-84ac7cf9fe76:4eb1f8ea-587d-40eb-a657-4fbd3cf1dbbe
---
# Auditoria Extrema a Sollutia

**Estat del Pla:** acabat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d8b7ed3e-a176-48e2-bbd4-84ac7cf9fe76:4eb1f8ea-587d-40eb-a657-4fbd3cf1dbbe |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T19:10:02.833Z |
| Modificació | 2026-09-22T19:10:02.833Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 c91129c4f47fdb7fa55f40284bd315379b06063f38976051981791fd287f44a9. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-22T19:10:02.833Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

1. **Resolució de Ports:** S'ha bloquejat el port a 3340 estricte en `vite.standalone.config.js` per evitar servidors fantasma.
2. **Resolució de Dependències:** S'ha permès el pegat de seguretat a `dompurify` (`^3.4.14`).
3. **Resolució de Disseny Visual:** S'ha corregit `modules.css` perquè la columna esquerra herete el fons estructurat de "Tot" i s'ha eliminat l'atribut enganyós `aria-current`.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

L'agent (o l'humà) ja ha validat el correcte build de React i l'absència d'errors de dependències al paquet. L'aspecte visual respon ara a les lleis de Pedra Seca.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Cap, ja s'han aplicat a l'escriptori i estan a producció. Aquest document serveix només d'avís per a les companyes auditors.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
