---
tipus: petorreta
estat: esborrany
description: "Auditoria d'arquitectura inversa i integració amb Sollutia (Fase 4 i 5)"
tags:
  - maquina
  - seguretat
---
# Petorreta — Auditoria Extrema: Integració Sollutia
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-202609162351 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-16 23:51 |
| Modificació | 2026-09-16 23:51 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 2026-09-16 |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

## Contracte de Realitat (IMPORTANT)
**REGLA DE FOC**: Si el document (el bundle sencer que acompanya aquest prompt) no acaba EXACTAMENT amb la línia `<<<FI_DEL_BUNDLE>>>`, significa que se t'ha tallat l'entrada a causa dels límits de context (token limits). 
SI AIXÒ PASSA: el teu **únic i exclusiu** retorn ha de ser informar-me d'on s'ha tallat i dictaminar "NO CONFORME - BUNDLE INCOMPLET". No al·lucines res, no inventes solucions. Sense la sentinella final, la realitat està corrompuda.

## Missió

Realitza una auditoria extrema (mode ulleres roges) a fons de tot el codi de la targeta:
1. S'han integrat les **Fases 4 i 5** (Nova arquitectura de Pedra Seca, macro-contenidors i l'adopció del component `AgendaSection`).
2. Verifica si hi ha forats de seguretat, defectes en la integració amb Sollutia per a la capacitat `agenda`, trencaments de les normes del "Trellat" i "Pedra Seca", i assegura't que l'aïllament per instància de configuració es manté segur.
3. Informa de forma destructiva qualsevol fallida als nous components i contenidors CSS, o a `AgendaSection.jsx`.

## Eixida esperada

Respon a l'usuari aplicant la taxonomia i el to de Sóc de Poble: dictamen directe, incisiu, enumerant els punts i proposant les solucions (amb els errors a "ULLERES ROGES") de qualsevol fallida crítica o fricció trobada. Fes un èmfasi especial en l'abstracció i independència del `AgendaSection`.
