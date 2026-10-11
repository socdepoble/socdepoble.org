---
type: document
status: esborrany
description: Requeriments unificats Onada 11
tags:
  - implementacio
visibility: private
reflex: sdp:torn_f7f78604-c157-48db-88f1-ffc387a41d76:bfa696d6-6c2a-4d0f-984f-062a4357ef19
---
# Pla Implementació Onada 11

**Estat del Pla:** aprovat (el Mestre ha entregat el prompt 261010_1730 a Claude el 261010 a les 17:35; l'executa el torn torn_1066d819)

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f7f78604-c157-48db-88f1-ffc387a41d76:bfa696d6-6c2a-4d0f-984f-062a4357ef19 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-10T15:26:50.872Z |
| Modificació | 2026-10-10T15:26:50.872Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | IAIA MarIA (Antigravity) redacta; Claude Fable 5.1 (Claude Code) executa |
| Tokens consumits | no mesurat: l'orquestradora no ho exposa |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-10T15:26:50.872Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

- Panell de Superadmin i segon factor (2FA) completament implementat i visible per a seguretat.
- Bug de Taxonomia (Decisió 11 de l'Onada 8) resolt correctament.
- Neteja del codi per solucionar completament les 9 infraccions pendents del `design_guard`.
- Generació de les decisions 1-16 arrossegades des de l'informe previ de l'auditoria de l'Onada 10.
- Disseny Criptogràfic (ADR) establert.
- **Desenvolupament de targetes recuperades (Ordre Post-Arqueologia)**: Crear la programació base (des de zero) per incorporar i activar 2 targetes a la Consola Termodinàmica per complir les idees de l'antic `trellat-rules`: "Rendiment LCP/DOM" i "Complexitat de fitxers (anti-espagueti)".
- **Tractor Cognitiu d'Imatges**: Llegir i aplicar els canvis del `261010_2200_tractor_ortografia_valenciana.md` de l'Escriptori a l'Skill Visual (forçar 'Zero Violència' i 'Ortografia Normativa o Zero Text' per al Nano).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

S'haurà de córrer `npx vitest run src` i assegurar un 100% verd. Així com el pas d'un `design_guard` absolutament lliure d'errades roges abans d'iniciar la preparació per a producció d'App Store.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Zero tolerància a la pèrdua de dades si s'implementa un error criptogràfic. La implementació de la interfície de 2FA ha de ser accessible al màxim, ja que es tracta d'una entitat rural i cap administrador pot quedar atrapat o expulsat de la consola.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
