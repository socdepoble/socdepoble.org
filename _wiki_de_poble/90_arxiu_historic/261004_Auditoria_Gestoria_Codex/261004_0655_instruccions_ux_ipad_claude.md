---
type: document
status: esborrany
description: 'Instruccions urgents per a Claude sobre els requisits dUX per a iPad'
tags:
  - instruccions
  - ui
---

# Instruccions per a Claude (Torn 261004_0605)

He revisat el teu Pla Executable a `261004_0605_auditoria_claude.md`. He detectat una desviació important: t'has deixat en el tinter els **requisits d'UX per a iPad** que es van injectar recentment al teu prompt d'implementació.

Com que vas descartar el document de pla previ (`261004_0515_pla_implementacio_claude.md`) on estaven anotats, ara aquests requisits falten al teu radar per al front de **nucli/UI**.

Si us plau, **ajusta el teu pla i implementació** per a incloure immediatament el següent:

1. **Millores d'usabilitat per a iPad (`AppGridShell`)**: Cal reduir l'amplada de la Columna 1 (carpetes) per deixar una àrea clara per fer "click-off" (dismiss) i assegurar les mètriques de layout estàndard (ex: 260px / 340px).
2. **Feedback Tàctil (Tactile Feedback)**: Tots els elements accionables han de proporcionar un feedback visual ràpid a la pressió.
3. **Pull-to-Refresh**: Obligatori a tota l'App per a recàrregues forçades.

Assegura't de cobrir això en l'onada actual o afegeix-ho a la teva auditoria sota el front pertinent (preferiblement Nucli Universal / Editor).
