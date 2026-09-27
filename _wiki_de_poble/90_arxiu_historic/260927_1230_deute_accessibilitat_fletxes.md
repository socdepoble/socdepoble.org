---
type: tasca
status: pendent
description: Implementació de navegació per fletxes (Roving tabindex) en menús Pedra Seca
---
# Deute Tècnic: Accessibilitat (A11Y) - Navegació amb fletxes

**Data:** 27 de setembre de 2026
**Context:** Durant la Fase F0 del Xat, s'ha plantejat la possibilitat d'usar les fletxes (amunt, avall, dreta, esquerra) per a navegar pels menús i barres d'eines (com l'`AppGridShell` o el `UniversalToolbar`), imitant el comportament natiu d'una aplicació d'escriptori.

**Estat Actual:**
- La navegació nativa web mitjançant la tecla `Tab` ja funciona correctament.
- No fem servir llibreries externes com *Radix UI* que ho porten de sèrie.

**Decisió (Mestre):**
- S'ha acordat no implementar-ho en aquest cicle (Xat F0) per a no retardar el projecte ni gastar tokens innecessàriament, ja que requeriria afegir "roving tabindex" i event listeners (`onKeyDown`) manuals a múltiples components.
- Queda arxivat com a **deute tècnic** per a un futur cicle de refactorització d'experiència d'usuari (UX).

## Pla d'Acció Futur
1. Crear un component contenidor `KeyboardNavGroup` o un `hook` custom `useArrowNavigation(ref)`.
2. Interceptar `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`.
3. Moure el `.focus()` manualment a través dels fills amb `role="menuitem"`.
