---
type: document
status: canonic
description: Acta Marmota - Tancament de Jornada amb auditories finals de Codex i Claude
---

# Acta Marmota - Tancament de Jornada
Data: 26-09-23 00:35

## 1. Resum de l'Estat Actual
La jornada finalitza en **Mode AFK Absolut**. No s'ha modificat cap línia de codi de producte (a `src/`) després de la reversió de l'al·lucinació visual. Totes les accions d'aquesta darrera hora han sigut documentals, forenses i arquitectòniques per preparar la propera sessió. 

L'Escriptori està net i conté exclusivament:
- Els esborranys del Pla d'Implementació de l'Universal Workspace.
- Les auditories en ferm de Codex i Claude.

## 2. Diagnòstics a l'Olivera (Auditories de Tancament)

### A. Codex (Arquitectura de l'UniversalWorkspace - 00:17)
- **Veredicte:** La injecció de targetes (com el Graf o la Portada) s'ha de deslligar de l'esquema de dades documentals. Validat l'ús de `headerItems` (només vista), descartant Seed per a portades.
- **El Fantasma de Notes:** Abans de fer pegats de UI, cal reparar la passarel·la de `NotesContext` (que no exposa `notesComplete`, `resolveNote` ni `workspaceKey`). A més, el fantasma ha de ser un draft editable autèntic, no només un títol.
- **Carpetes reals:** S'ha prohibit moure carpetes reals per "amagar-les"; l'índex ha de ser honest.

### B. Claude (Forense de l'Al·lucinació Visual - 00:16)
- **Causa Arrel:** Una purga d'estils sense frontera geogràfica crea un "buit visual" que el model ompli amb allò més probable a internet (Tailwind genèric), no amb l'estètica del Mas.
- **La Llei del Píxel:** Nova regla establerta: el criteri d'èxit de tota neteja visual és que el resultat siga **visualment idèntic**. Si no ho és, és un redisseny i cal ordre explícita. "Prohibició sense substitut = Fusible".
- **Danys col·laterals pendents:** Durant la neteja innecessària es va eliminar accidentalment l'`<hr className="app-sidebar-divider">` a `App.jsx`, deixant el CSS orfe. La purga de Tailwind tampoc va ser completa (encara hi ha 13 infraccions a `WikiDePobleSection`).

## 3. Punt d'Arrancada per a Demà (Tasques del Mestre)
Abans que cap IA toque una sola línia de codi, el Mestre ha de resoldre el **consens obert**:
1. **Disseny:** Decidir si l'`<hr>` del menú torna a `App.jsx` o si s'esborra la classe CSS (T6 de Claude), i aclarir si el menú té una o dues primitives (T2).
2. **Arquitectura:** Autoritzar el Pla d'Implementació revisat per Codex per arreglar l'`UniversalWorkspace`, recuperar el botó "Crear Nota" i restaurar la creació reactiva via `NotesContext`.
3. **Producte:** Un colp l'arquitectura estiga arreglada, s'haurà de reprendre el deute de Sollutia (reintents de xarxa i validació del `tenant_id`).

**Bona nit! La guàrdia queda coberta i el context segellat per a demà.**

## Vincles

- [[00_index]]
