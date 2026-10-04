---
type: document
status: esborrany
description: Pla per llançar la injecció dels 11 plugins al Control i completar la passada 5
tags:
  - implementacio
visibility: private
reflex: sdp:torn_a30329e9-cd8b-45b9-a78c-411c66d537d9:214f88f3-182b-436b-804e-855582e89ce9
---
# Pla per a la Passada 6

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a30329e9-cd8b-45b9-a78c-411c66d537d9:214f88f3-182b-436b-804e-855582e89ce9 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-03T22:14:51.777Z |
| Modificació | 2026-10-03T22:14:51.777Z |
| Propietari | maria |
| Aprovació humana | aprovat |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | claude-3-5-sonnet |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 30f1b3310dd558c625a0cef2562b28ee8f08351afd719136367464a3b12aff38. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-03T22:14:51.777Z: esborrany creat; contingut i verificació pendents.
2026-10-04T00:15: Es crea el pla per a coordinar la Passada 6 de Claude. L'Onada 4 porta dues auditories de Claude i Codex congelades o pendents. Claude ha deixat el seu codi i la seua terminal penjada, sense llançar el resum de la Passada 5. Açò reprèn la feina.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

- Finalitzar ajustos pendents de la Passada 5 en `UniversalCard` (badge de la data fosc vs píndola de preu).
- Finalitzar `border-bottom` de `H3` al `components.css`.
- Injectar les 11 il·lustracions creades per MarIA a les `UniversalCard` del Panell de Control i crear les seues rutes (`/assets/ui/plugins/*_vinyeta.jpg`).
- Crear les `UniversalPage` genèriques per als 11 nous connectors (Gestoria, Salut, Rebost...).
- Amagar l'etiqueta inferior i posar el botó blau enorme CTA a les `UniversalPage`.
- Implementar a les `UniversalPage` dels connectors el "Hero Image Toggle" (amagar imatge a voluntat des de l'engranatge o menú) requerit pel Mestre per guanyar espai vertical quan es treballa.

### 1. Context i Troballes (Research)
La Passada 5 ha quedat penjada per tancament de la sessió de Claude. Quedava pendent un bug visual on l'emblema de data en UniversalCard eixia on el preu, un desajust de títols H3 i unes etiquetes sobrants a les pàgines d'acció. Simultàniament, hem enllestit 11 imatges (full bleed a 920x920) de totes les eines que conformaran l'ecosistema de Sóc de Poble per mostrar al Panell de Control en un grid.

### 3. Canvis Proposats (Proposed Changes)

### [Acció: MODIFY] `src/app/ControlSection.jsx`
Injectar les 11 targetes UniversalCard noves referenciant `/assets/ui/plugins/X_vinyeta.jpg` de manera provisional (i enllaçant a `/plugin/X`).

### [Acció: MODIFY] `src/app/components/UniversalCard.jsx`
Aplicar el fix del `squareBadge` correctament a les dates.

### [Acció: MODIFY] `src/app/components/UniversalPage.jsx`
Introduir lògica per a amagar l'Hero Image (toggle user settings state) en les pàgines de plugin.

### [Acció: MODIFY] `src/css/components.css`
Recuperar filete a `.sdp-prose h3` i als components títol de la targeta.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Claude en la seua propera passada o el Mestre al `localhost:8340`.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Enrutament intern defectuós per a les noves utilitats. Trencament visual per imatges massa grans si el contenidor no respecta el full bleed (tot ha d'anar lligat a UniversalCard).

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
