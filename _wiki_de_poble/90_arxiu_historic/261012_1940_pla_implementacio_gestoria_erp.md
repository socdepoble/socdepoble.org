---
type: document
status: esborrany
description: Estratègia per redissenyar el dashboard de la Gestoria V2 basant-se en l'arquitectura ERP
tags:
  - implementacio
visibility: private
reflex: sdp:torn_8f2e40ba-660b-41a9-818f-557ac881e445:af4726c3-d443-47af-ad6a-4f00f383d444
---
# Pla d'Implementació Gestoria V2 (ERP)

**Estat del Pla:** [en elaboració]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_8f2e40ba-660b-41a9-818f-557ac881e445:af4726c3-d443-47af-ad6a-4f00f383d444 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-12T17:35:40.568Z |
| Modificació | 2026-10-12T17:35:40.568Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-12T17:35:40.568Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

- **Layout ERP Estàndard:** Refactoritzar `ShellGestoria.jsx` per adoptar una estructura de panell de control professional. Afegir un *Sidebar* esquerre col·lapsable per als mòduls (Factures, Impostos, etc.) i una *Top bar* per al context global (any fiscal, trimestre actiu).
- **Vistes de Progrés (CSS Natiu):** Implementar barres de progrés i tiradors usant CSS natiu amb variables HSL de Pedra Seca, mostrant quotes, estat de pressupostos o límit d'ingressos.
- **Simuladors d'Impostos:** Integrar controls (inputs de rang) tipus *slider* al mòdul d'impostos per projectar la liquidació de l'IVA i l'IRPF de forma dinàmica i interactiva abans del tancament del trimestre.
- **Transició de Targetes a Dashboard:** Abandonar el disseny de targetes aïllades en favor d'una densitat de dades alta i panells rics.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Passar la bateria de proves completa de la Gestoria: `npm run test:unit -- src/sections/gestoria`.
- Garantir que no hi ha cap error de sintaxi React o CSS trencat a la nova graella ERP.
- Validar amb la Porta Pedra Seca que els dissenys compleixen l'estàndard d'accessibilitat i estils (HSL).

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Ruptura de tests existents:** El canvi estructural a `ShellGestoria` pot fer fallar tests d'integració que depenien d'elements DOM antics. S'han d'actualitzar les expectatives dels tests.
- **Problemes d'adaptabilitat mòbil:** El layout ERP (Sidebar + Àrea Central) és complex d'encaixar en pantalles xicotetes. Cal garantir un col·lapse perfecte a la versió mòbil.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
