---
type: document
status: esborrany
description: Pla per llançar l'auditoria adversarial de Fable
tags:
  - implementacio
visibility: private
reflex: sdp:torn_eafab5f7-6d92-49a2-ad17-eec892cc41af:c3f0bc8e-7318-40c3-a44a-76bdaa67dde3
---
# Pla Fable

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_eafab5f7-6d92-49a2-ad17-eec892cc41af:c3f0bc8e-7318-40c3-a44a-76bdaa67dde3 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-05T09:54:37.653Z |
| Modificació | 2026-10-05T09:54:37.653Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | MarIA Orquestradora |
| Tokens consumits | Pendent |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-05T09:54:37.653Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

Llançar una auditoria adversarial (petorreta + bundle) cap a Fable 5.1 UltraCode (model de Claude extern).
Donat que la quota setmanal d'Opus/Sonnet està al 94%, volem aprofitar el límit setmanal completament independent de Fable per a avançar en les tasques pendents (crash `useSession`, commit atòmic, LCP) sense consumir els recursos de l'Eixam principal fins que es reinicien. Fable farà l'auditoria de manera contínua fins que només li quede un 5% de marge de quota.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Entregar el prompt i el bundle generat al Mestre per a què ho copie i ho passe a Fable.
- Llegir els resultats o demanar l'auditoria final quan Fable arribe al seu límit de quota (5%).

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Desconnexió temporal amb la sessió de Codex/Claude si s'inicia una nova branca paral·lela de reflexió.
- Necessitat d'integrar posteriorment el report generat per Fable.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
