---
tipus: petorreta
estat: esborrany
description: "Estilització de capçaleres, llistes i menús desplegables de l'espai universal (Workspace)"
tags:
  - maquina
  - claude
  - universal-workspace
---
# Petorreta — Estilització i Comportament del UniversalWorkspace

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-202609201945 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-20 19:45 |
| Modificació | 2026-09-20 19:45 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[app_grid_shell]]
- [[universal_workspace]]

## 1. Objectiu de la Missió

Hem validat tècnicament el funcionament de la graella (`AppGridShell`) i del llistat (`UniversalWorkspace`), però ens falta polir-ne l'aspecte i el comportament perquè coincidisca exactament amb el prototip de disseny visual que tenim com a referència per al Bloc de Notes. 

Tens com a tasca aplicar aquests 3 canvis essencials d'interfície al `UniversalWorkspace` (i/o `AppGridShell` / `layout.css` si escau):

## 2. El que has de fer

### 1. La Capçalera de la Columna Central (Llista / Notes)
La barra superior de la segona columna (la llista de notes) ja té els elements correctes ("Tot" en una píndola, l'icona d'engranatge, la lupa i el botó blau de "CREAR NOTA"), però li falta el disseny i el comportament:
- **Fons gris:** Ha de tindre el fons gris fosc que s'espera al disseny (pots usar la variable corresponent de Pedra Seca o establir l'estil pertinent). Actualment sembla tindre un fons transparent o blanc en comptes del gris esperat.
- **Immobilitat (Sticky):** Aquesta capçalera ha de ser totalment **immòbil**. Quan es fa *scroll* cap avall per la llista de notes, la capçalera grisa s'ha de mantenir fixa a la part superior de la columna central. Mai desapareix.

### 2. Navegació Lateral (Carpetes, Categories, Etiquetes) com a Acordions
A la primera columna (el panell lateral esquerre), els grups de navegació no han de ser simples llistes planes.
- Han de funcionar com a **menús desplegables cap avall** (estil acordió).
- Cada grup de navegació ("CARPETES", "CATEGORIES", "ETIQUETES") ha de tindre el seu encapçalament acompanyat d'una menuda icona (*chevron*) que indique clarament que són desplegables.
- Exemples del contingut (depenent de la secció, p. ex. Bloc de Notes):
  - **CARPETES**: Mur, Mercat, Pobles, Multimèdia, Esdeveniments, Mapa, Altres notes.
  - **CATEGORIES**: Sistema.
  - **ETIQUETES**: Productivitat, Tutorial.
- Fes que l'estructura del component de navegació al `UniversalWorkspace` suporte de forma nativa aquest comportament de *toggle* o desplegable, incloent l'estat obert/tancat.

### 3. Disseny de la Targeta de Llista (Card de la Nota)
A la columna central, els ítems de la llista (ex: `NotesItems` o `sdp-gestor-fitxa`) han de ser redissenyats com a targetes riques.
- **Imatge quadrada:** A l'esquerra de la targeta hi ha d'haver una miniatura d'imatge quadrada d'aproximadament 86px o 90px (segons estàndards).
- **Contingut a la dreta:** Al costat de la imatge hi ha el títol (H1 de la nota), el subtítol o entradilla (H2 / Excerpt) i la data de publicació o modificació.
- Aquest aspecte visual indica clarament que en prémer la targeta es passa a l'edició de l'element.

## 3. Què NO has de fer

- No modifiques l'estructura global responsive del `AppGridShell` innecessàriament, només assegura't que l'estilització dels colors de fons i les posicions (com l'*sticky* de la capçalera central) siguen correctes.
- No trenques la lògica d'estat ni la persistència de rutes que ja funciona.

## 4. Contracte de Realitat

- Estudia el codi de `UniversalWorkspace.jsx` (especialment com es renderitzen els `navigationGroups` i el `AppGridColumn` de la columna central).
- T'adjunte les captures de pantalla del disseny que cal replicar per a que veges clarament els tons de gris i la forma de les targetes al Bloc de Notes.

---
<<<FI_DEL_BUNDLE>>>
