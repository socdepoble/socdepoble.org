---
type: hub
status: canonic
description: Nota d'etiqueta del graf de la Wiki, amb com es cusen els documents entre ells i quines portes vigilen orfes, enllaços penjats i illes.
tags:
  - saber
---

# Graf

Els documents de la Wiki es cusen entre ells amb enllaços, etiquetes i índexs. Cap nota ha de quedar òrfena ni cap enllaç penjat, i això no depén de la memòria de ningú sinó de les portes del teixit.

## Com es mesura

- `npm run porta:llaurador` comprova que tot document s'abasta des de l'índex mestre.
- `npm run porta:teixit` compta orfes, enllaços penjats, illes i etiquetes sense nota.
- `npm run porta:scc` i `npm run porta:orfandat` vigilen la connexió del graf i els documents sense ancoratge.

## Vincles

- [[00_index]]
- [[taxonomia_documental]]
