---
type: skill
status: canonic
description: Lògica visual i de comportament del AppGridShell i UniversalWorkspace. Comportament de les barres, icones i redimensionament.
tags:
  - disseny
name: app-grid-shell
triggers_on:
  - app grid shell
---
\n# SKILL: AppGridShell i l'Espai de Treball (UniversalWorkspace)

Aquesta skill documenta la lògica de disseny i comportament de la interfície principal de gestió a Sóc de Poble (`AppGridShell`), així com la seua integració a través de `UniversalWorkspace`.

## 1. La Jerarquia Visual (UniversalWorkspace vs UniversalPage)

- **La `UniversalPage` només ha d'existir DINS de l'Editor.** L'espai de treball (`UniversalWorkspace`) no ha de ser embolicat per una `UniversalPage`. La Barra Blava (`bar-blue`) de la `UniversalPage` ha d'estar confinada exclusivament a la columna dreta (la de l'editor), ja que és on s'edita la targeta/pàgina, i mai no pot desbordar per damunt de les columnes de Carpetes i Notes.

## 2. Disseny de les Barres (Capçaleres de les columnes)

La graella de 3 columnes (`AppGridShell`) disposa de dues capçaleres laterals i centrals amb la següent estètica de Pedra Seca:

- **Colors de fons:** La barra de Carpetes i la barra de Notes tenen un color de fons gris, sent el de les notes un gris lleugerament més clar per donar profunditat.
- **Icones transparents:** Totes les icones d'aquestes barres han de tindre un fons completament **transparent** i la icona pròpiament dita ha de ser de color **blanc**. Prohibit l'ús de fons blancs amb icones negres ("fantasmes").
- **Comportament dels Botons (Quan Tot Està Obert):**
  - *Columna Esquerra (Carpetes):* A l'esquerra tenim el botó "Tot". A la dreta de la barra hi ha l'icona de la "Roda Dentada" (Configuració de les funcionalitats del bloc de notes).
  - *Columna Central (Notes):* A l'esquerra tenim l'icona de la "Lupa" (Buscar). A la dreta hi ha el botó de "Crear Nota". (La cerca completa no es mostra fins que no es clica la lupa).

## 3. Lògica de Replegament (Collapse)

Quan l'usuari clica als icones d'ocultar les columnes (per amagar la barra lateral cap a l'esquerra), l'estat i l'alineació dels elements ha de ser perfecte:

- **Ocultació de Carpetes:** Quan es replega la columna de carpetes, l'icona que serveix per a tornar a obrir-la s'alinea de manera perfecta amb l'icona de la "Roda Dentada". Ambdós icones queden visibles.
- **Ocultació de Notes:** Quan es replega la columna de notes (cap a l'esquerra), el botó de "Crear Nota" **desapareix**. Només queda visible l'icona d'obrir la columna i la "Lupa".
- **Resum:** Només es poden crear notes si la columna de notes està desplegada (oberta). Aquesta és la distribució inicial i obligatòria.

## 4. Deute Tècnic Restringit
- Està estrictament prohibit l'ús de l'atribut `style=` directament sobre els components React per no trencar les regles de la `design-guard`. Les mides dinàmiques s'injectaran preferiblement a través de classes dinàmiques o `<style>` tags inserits localment si és inevitable.
- No s'ha de fer ús del pseudo-selector `:has()` en els estils com `src/components/layout/AppGridShell.css`, per mantenir l'estàndard del *Baseline 2022*. Les ocultacions es controlaran a través de classes de React (ex: `has-left-collapsed`).
