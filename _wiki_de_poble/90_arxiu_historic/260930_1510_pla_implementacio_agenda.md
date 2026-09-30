---
type: document
status: esborrany
description: Pla per a activar l'Agenda, enllaçar el calendari i fer clicables les targetes
tags:
  - implementacio
visibility: private
reflex: sdp:torn_601b2dca-3691-4e2c-9278-af704315070f:7979b0bc-cc19-462f-b2a0-6a82582b86a3
---
# Activar Agenda i Targetes

**Estat del Pla:** en elaboració

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_601b2dca-3691-4e2c-9278-af704315070f:7979b0bc-cc19-462f-b2a0-6a82582b86a3 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T13:07:44.530Z |
| Modificació | 2026-09-30T13:07:44.530Z |
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

2026-09-30T13:07:44.530Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

**Context:** El Mestre considera que l'Agenda ja pot eixir de quarantena i integrar-se a la navegació pública. A més, els botons de dates de l'aplicació han de dur a aquest calendari. Per una altra banda, es vol donar la capacitat a la capçalera de les targetes de redirigir cap a la font.

**1. Activar l'Agenda al Menú Principal:**
- A `src/config/sections.js`, eliminar la NOTA QUARANTENA.
- A `SECTION_ORDER`, afegir `'agenda'` just després de `'pobles'`.
- A `SECTIONS`, afegir l'objecte complet de l'Agenda.

**2. Enllaçar les dates a l'Agenda:**
- A `src/components/universal/UniversalPage.jsx` (cap a la línia 78), on `handleDateTime` redirigeix al Mur:
  Canviar `navigate("/mur?date=...")` per `navigate("/agenda?date=...")` (i si falla sense date, `/agenda`).

**3. Navegació a la font des d'UniversalCard:**
- A `src/components/PedraSeca/organismes/UniversalCard.jsx`, el disseny de la capçalera taronja (`sourceName`) ha de ser clicable i portar a la pàgina origen ("mare"). Caldrà embolicar el text en un element interactiu (`Link` o botó depenent d'on vinga).

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- **Criteri d'Acreditació 1:** En obrir l'aplicació, el menú lateral i el menú mòbil mostren "Agenda" davall de "Pobles".
- **Criteri d'Acreditació 2:** En fer clic al botó de data d'una targeta, l'aplicació navega a `/agenda` amb la URL filtrada per data.
- **Criteri d'Acreditació 3:** En la targeta de Consola Termodinàmica (o altres), fer clic sobre el nom de la font taronja navega a la pàgina principal de la font.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- UniversalCard s'usa arreu. Qualsevol modificació HTML per fer clicable la capçalera ha de garantir que no trenca la visualització de l'espècimen original (Llei del Píxel).
- S'ha d'assegurar que `AgendaSection` espera efectivament el paràmetre `?date=` i sap navegar o inicialitzar-se en conseqüència.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
