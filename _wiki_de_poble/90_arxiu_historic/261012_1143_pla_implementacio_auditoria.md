---
type: document
status: esborrany
description: Pla per executar el Gauntlet Prompt de Xavier Mitjana per a Claude i Codex.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_769f7988-1f57-470c-b10c-d9d06a1c4564:9c5352a9-1426-4f65-9926-ee01006debfd
---
# Pla per a l'Auditoria Adversarial d'Onada 12

**Estat del Pla:** en elaboració

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_769f7988-1f57-470c-b10c-d9d06a1c4564:9c5352a9-1426-4f65-9926-ee01006debfd |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-12T09:43:32.305Z |
| Modificació | 2026-10-12T09:43:32.305Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude 3.5 Sonnet / Codex |
| Tokens consumits | [estimat: ~3000 tokens] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-12T09:43:32.305Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

- Generar un prompt amb l'arquitectura "Gauntlet" (Fet)
- Llançar Claude 3.5 Sonnet i Codex per analitzar la Finestreta de Subvencions aplicant aquest prompt (Pendent d'executar per l'usuari/Claude).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Revisar si el resultat de Claude conté solucions amb placeholders (Codi trencat). Si en té, el prompt Gauntlet ha fallat i cal reiterar.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Que l'IA (Claude) es cansi abans d'hora i entregui una solució a mitges malgrat el loop obligatori.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
