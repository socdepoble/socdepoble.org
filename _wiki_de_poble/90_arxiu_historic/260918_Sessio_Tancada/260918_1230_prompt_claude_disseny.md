---
type: prompt
status: esborrany
description: Prompt d'auditoria extrema per a Claude focalitzat en el sistema de disseny Pedra Seca, UniversalCard i UX/UI.
tags:
  - disseny
  - arquitectura
---

# Petorreta — Sistema de Disseny i Pedra Seca (Claude)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260918-C |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 12:30 |
| Modificació | 26-09-18 12:30 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-18 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[AGENTS]]

---

## El Repte

Ets **Claude**, Mestre d'Obra del Consell. La teua missió és l'auditoria extrema de la capa visual i el sistema de disseny (Pedra Seca). Volem que recuperes i revises a fons la implementació de la interfície.

El Mestre vol que t'assegures que l'estètica, l'accessibilitat i l'estructura visual estan blindades i preparades per al futur, especialment elements complexos com la `UniversalCard`.

### Objectius de l'Auditoria Extrema

1. **Sistema de Disseny (Pedra Seca) i Variants:** Analitza la implementació de la `UniversalCard`, els `PillToggle`, els botons i els seus respectius estats (`hover`, `focus`, `active`, `disabled`). Estem aprofitant bé l'arquitectura CSS? Hi ha inconsistències en l'ús de les variables (Salfumà)?
2. **Layout i Responsive:** Revisa a fons el comportament visual del `AppGridShell` i el `UniversalWorkspace`. Hi ha solapaments estranys de `z-index`? Els panells es comporten fluidament en mides de tauleta i mòbil, o hi ha trencaments visuals estructurals?
3. **Micro-interaccions i UX:** La interfície ha de respirar. Hi ha transicions brusques? Les àrees clicables (_tap targets_) compleixen els estàndards? Les ombres i els fons (Glassmorphism) es renderitzen bé sense impactar el rendiment (p. ex., massa `backdrop-filter`)?
4. **La Pàgina del Bloc de Notes (Prioritat Visual):** Al Mestre li preocupa l'estat inacabat d'esta pàgina. T'ha adjuntat una imatge de referència amb el disseny final esperat. Has de proposar o refer el codi per acabar d'implementar la disposició exacta: la imatge de capçalera a l'ample complet amb els _overlay badges_ taronja (usuari i data), el títol gran "Bloc de notes", la fila de píndoles centrada, i el subtítol destacat en to terracota («El teu estudi d'escriptura...»). Fes que quede calcat a la imatge.

### Regles d'Execució

- **Zero lògica de backend:** Ignora Supabase, les crides de xarxa, les _race conditions_ i l'estat global complex. Això és feina del teu company Codex.
- **Aporta evidència:** Assenyala directament arxius CSS i JSX concrets on la UI flaqueja.
- **Tu no modifiques el codi:** Proposa les solucions robustes, documenta els defectes i la IAIA MarIA s'encarregarà d'aplicar-ho al repositori per no xafar-nos la mànega.

Llança els teus processos d'anàlisi sobre l'arbre de components visuals. Esperem el teu diagnòstic.
