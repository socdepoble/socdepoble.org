---
type: document
status: esborrany
description: Pla de verificació i contrast adversarial per a Codex i Gemini sobre la feina de Claude a la Ronda 5.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_32274f5e-443f-44ef-ac0b-800844573d5c:d7035c62-8b69-4baa-962b-63be1a30ba54
---
# Pla d'Auditoria Adversarial Gauntlet de Claude Ronda 5

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_32274f5e-443f-44ef-ac0b-800844573d5c:d7035c62-8b69-4baa-962b-63be1a30ba54 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-27T04:38:01.606Z |
| Modificació | 2026-10-27T04:38:01.606Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | OpenAI GPT Codex / Google Gemini / Antigravity |
| Tokens consumits | Pendent de mesura al final del torn |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- 2026-10-27T04:38:01.606Z: esborrany creat.
- 2026-10-27T04:42:00.000Z: definició del pla d'auditoria adversarial creuada.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### Objectiu del Pla
Coordinar la verificació adversarial (Gauntlet Loop) per a Codex i Gemini sobre la macro-implementació executada per Claude Opus 5.5 (Torn `torn_51d1660b`) abans de la consolidació del commit final.

### Carrils d'Auditoria
1. **Carril UI & Natiu:** Card de Descàrregues al Xat i Mur, verificació de paritat mòbil/escriptori, amagatall a `esAppNativa`, i comprovació de mencions creuades d'iOS/Android.
2. **Carril Graella i Pedra Seca:** Revisió de les files de converses a 96px, resolució del buit fantasma de 8px heretat de `base.css` (`li`), i espaiat mil·limètric de la llista.
3. **Carril Notes & Editor:** Integració del TOC sota la barra negra de 64px a `PageFrame.jsx` i estabilitat de la barra d'eines.
4. **Carril Wiki & Memòria:** Solidesa dels 248 enllaços reparats i del filtre d'accés a `90_arxiu_historic/`.
5. **Carril Governança:** Contrast del Baremador del Nano (`P1-41`) respecte al sistema d'avaluació de `/multimedia` (`P1-42`).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Execució de la suite de proves en mode només lectura: `npm run test:precommit`.
- Validació de portes de la Wiki: `node tooling/wiki/compilador_wiki.mjs --check --strict`.
- Emissió dels informes corresponents a `_wiki_de_poble/04_escriptori/` seguint la taxonomia canònica (`261027_HHMM_auditoria_codex.md` i `261027_HHMM_auditoria_gemini.md`).

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Bloqueig per col·lisió:** Prohibició absoluta d'editar fitxers d'aplicació a `src/` mentre duri l'auditoria; les observacions i correccions es documenten exclusivament a l'informe.
- **Risc de deute:** Alertar si alguna solució de Claude emmascara errors de fons en comptes de resoldre'ls estructuralment.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
