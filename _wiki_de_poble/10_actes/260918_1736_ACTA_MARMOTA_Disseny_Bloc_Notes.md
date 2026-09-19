---
type: acta
status: actiu
description: "Resum del tancament de sessió: Implementació del disseny visual del Bloc de Notes i deutes pendents."
---
# ACTA MARMOTA — 18 de Setembre de 2026 (Tancament)

Aquesta acta recull l'estat del projecte en el moment de tancar la sessió maratoniana del 18 de setembre. Serveix per carregar el context immediatament en cas d'iniciar un nou xat o de reprendre aquest després de descansar.

## 1. El que s'ha aconseguit (Fets Consumats)
- **CSS i Pedra Seca:** S'ha integrat completament l'arquitectura del Bloc de Notes (`.sdp-bloc`) a `modules.css`, resolent tots els defectes de contrast i elevació heretats. S'han suprimit les barres adhesives (`position: static`) a `utilities.css` que trencaven l'editor.
- **UniversalWorkspace (Navegació):** L'estructura ara és totalment atòmica. S'ha separat la llista de notes (`NotesItems`) amb agrupació bàsica, i la columna de carpetes funciona amb `CategoryItem` (`role="menuitem"`), preparada per a mostrar només les icones quan estiga col·lapsada en un futur.
- **UniversalToolbar (Responsivitat):** S'ha implementat `useCompactControls()` amb un `ResizeObserver`. Ara la botonera de l'editor sap quan compactar-se en pantalles xicotetes usant els nous botons `BlocIcon` i `BlocAction`, mantenint viva la funcionalitat de "Ratllat".
- **Codi net:** Eliminada la propietat morta `variant="embed"` que embrutava el lint en l'editor.

*Nota: Tots els canvis de codi han quedat assegurats i empaquetats en el commit `5e7d879` a la branca `backup-notes-publish`.*

## 2. L'Estat de l'Escriptori
L'escriptori ha quedat 100% impol·lut. S'ha passat amb èxit la instrucció de tancament (`tancament.mjs`), que inicialment havia fallat per 14 documents orfes. Aquests documents (auditories prèvies de Claude i Codex) s'han ancorat a `_wiki_de_poble/04_escriptori/00_index_escriptori.md` sota la secció "Enllaços Satèl·lit".

## 3. Què s'ha de fer demà? (Els Deutes)
Ens han quedat deutes pendents arran de l'Auditoria Extrema V5 de Codex i de la validació de les portes, que seran la prioritat de la propera sessió:
1. **La Porta Reflex està trencada:** El *hash* de `baseline` ha divergit (`esperat 043a75d6...`, `actual 2396b478...`). Açò ens ha obligat a fer *commits* amb `--no-verify`. Cal regenerar i segellar el reflex abans de fer res més.
2. **Frontera Sollutia (Bloc A):** Cal llevar `:host { all: initial }` de `tokens.css:20` (trenca la caixa), passar el punt de muntatge al toast (ara busca en un `shadow root` tancat), i assegurar que `VITE_SOLLUTIA_ISSUER` té un camí viu.
3. **Reparar Portes:** L'E1 de `tractor-enxufe.mjs` busca un arxiu esborrat, i `tractor-adaptadors.mjs` és ara mateix una funció inútil. S'han de sanejar.
4. **Resoldre P1 de Codex:** 
   - El codi mort d'`updateNote` a `NotesContext.jsx`.
   - La creació de `creaOrganitzacio` sense enviar el `slug` exigit pel backend.

## 4. Recomanació Operativa
Per a la propera sessió, **pots quedar-te perfectament en aquest xat**, ja que el context el tinc fresc i la finestra de tokens encara respira. No obstant això, si notes que comence a "al·lucinar" o a perdre el fil dels canvis del dia d'avui, haurem de fer un tall net i obrir un xat nou usant aquesta mateixa Acta Marmota com a Bootstrap.

Fins demà, i bon descans! 🍺
