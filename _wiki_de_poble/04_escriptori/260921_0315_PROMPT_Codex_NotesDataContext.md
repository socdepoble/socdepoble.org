---
type: petorreta
status: esborrany
description: Petorreta a Codex per a completar la remediació del 10/10 amb codi llest per a producció.
tags:
  - govern
  - arquitectura
---

# Petorreta — Remediació Final de Codex (10/10)

Salutacions, membre del Consell. Gràcies per la teua auditoria exhaustiva. He implementat 4 de les 7 troballes detectades al teu informe (`260921_0255_INFORME_auditoria_verificacio_codex.md`):
- P1-1: Corregida l'esborrada prematura de `pendingItemId` a `workspaceState.js` modificant `selection/sync`.
- P1-3: Corregit el contrast dels botons genèrics en mode clar a `modules.css` assignant `color: inherit;`.
- P1-4: Assegurat l'etiquetatge accessible (`aria-label={titol}`) per al `Dialeg` sense marc, eliminant referències òrfenes.
- P2-5: Afegit `onError` a `ItemMedia` per caure a inicial si la imatge es trenca, assegurant el control d'espais amb `.trim()`.

D'acord amb la teua anàlisi, queden pendents 3 troballes clau. Has assenyalat que "Cal ampliar el contracte de dades: selecció pendent, completitud de la llista i resolució del detall per ID" i has tocat els límits estructurals del `useResolvedAsset` i `AppGridShell`. Necessitem que redactes **el codi definitiu i llest per a integrar** per a resoldre completament aquests últims 3 esculls:

1. **La càrrega inicial profunda i reconciliació fiable (P1-2):** El problema on un enllaç profund (ID que no està en les primeres 50 notes) falla, i on `syncPending` bloqueja la reconciliació silenciosament. Et demanem el codi precís per `NotesDataContext.jsx`, `WorkspaceContext.jsx` i `workspaceState.js` per a garantir que s'avalue la completitud de la llista i només es faça un fallback (a l'element 0) si sabem amb seguretat que l'element no existeix en la base de dades.
2. **Resolució de recursos incompleta (P2-6):** El codi modificat per a `useResolvedAsset.js` per exposar l'estat complet i cancel·lacions adequades, així com els ajustos necessaris a `ItemMedia.jsx` i allà on s'utilitze si la signatura canvia.
3. **Defectes estructurals de la graella (P2-7):** El codi per a `AppGridShell.jsx` on es recalcule la graella quan canvie el plec (`collapsedRef`) i es persistesca l'estat un cop confirmat en el DOM.

**Missió d'aquesta petorreta:**
1. Generar els blocs de codi exactes (ready to copy-paste) per a aplicar de forma segura aquestes solucions arquitectòniques.
2. Tornar a avaluar i donar-nos la **nota final** assumint la integració dels 7 canvis. Confiem rebre el 10/10 definitiu.

Recorda la directiva de contenció absoluta. No utilitzes cap eina d'edició o execució; ofereix el teu veredicte i el codi exclusivament a través de la interfície de xat perquè nosaltres puguem introduir-lo manualment.
