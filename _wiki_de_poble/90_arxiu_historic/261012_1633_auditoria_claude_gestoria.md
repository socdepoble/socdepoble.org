---
type: informe
status: esborrany
description: Aplicacio del cable i correccio de proves per a la Gestoria.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_3eb0d0a5-8551-413a-89f7-cbba8bcebc58:d8fedaa1-970c-4119-bbed-95c3d4db31f8
---
# Auditoria V2 Gestoria

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3eb0d0a5-8551-413a-89f7-cbba8bcebc58:d8fedaa1-970c-4119-bbed-95c3d4db31f8 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-12T14:32:55.586Z |
| Modificació | 2026-10-12T14:32:55.586Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Gemini |
| Tokens consumits | N/A |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-12T14:32:55.586Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Implementació de la V2 completada

- S'ha afegit el nou test a `ShellGestoria.test.jsx` (que tria el mòdul 'Impostos', interactua amb 'Full trimestral', carrega el mock file i comprova el canvi d'estimacions a '3T 2026').
- S'ha corregit el tercer i quart argument de `findByRole` en la prova de `ShellGestoria.test.jsx` per fer que `timeout: 3000` funcione correctament dins de l'objecte de `waitForOptions`.
- Executat `npx vitest run` per a `targetesTauler.test.js`, `PanellGestoria.test.jsx`, `ContenidorGestoria.test.jsx`, `ShellGestoria.test.jsx` i `useGestoria.test.jsx` amb èxit absolut (99 passats, 0 fallats).

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

L'edició del codi i les proves han passat els tests automàtics (`vitest`). El cable entre `PanellGestoria`, `ContenidorGestoria` i `ShellGestoria` està lligat correctament (elevació de l'estat d'`onFactures`).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- Falta l'aprovació i la signatura de Touch ID per part del Mestre per als quatre tractors modificats o invalidats (`gestoria.tauler`, `gestoria.factures`, `gestoria.correus` i `gestoria.historic`).

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
