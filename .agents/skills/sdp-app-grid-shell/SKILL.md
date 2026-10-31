---
type: skill
status: canonic
description: Lògica visual i de comportament del AppGridShell i UniversalWorkspace. Comportament de les barres, icones i redimensionament.
tags:
  - disseny
name: sdp-app-grid-shell
triggers_on:
  - app grid shell
contracte.llig:
  - src/components/layout/AppGridShell.jsx
  - src/css/index.css
contracte.escriu:
  - src/components/layout/AppGridShell.jsx
---
# SKILL: AppGridShell i l'Espai de Treball (UniversalWorkspace)

Aquesta skill documenta la lògica de disseny i comportament de la interfície principal de gestió a Sóc de Poble (`AppGridShell`), així com la seua integració a través de `UniversalWorkspace`.

## 1. La Jerarquia Visual (UniversalWorkspace vs UniversalPage)

- **La `UniversalPage` només ha d'existir DINS de l'Editor.** L'espai de treball (`UniversalWorkspace`) no ha de ser embolicat per una `UniversalPage`. La Barra Blava (`bar-blue`) de la `UniversalPage` ha d'estar confinada exclusivament a la columna dreta (la de l'editor), ja que és on s'edita la targeta/pàgina, i mai no pot desbordar per damunt de les columnes de Carpetes i Notes.

## 2. Disseny de les Barres (Capçaleres de les columnes)

La graella de 3 columnes (`AppGridShell`) disposa de dues files de capçaleres amb la següent estètica de Pedra Seca:

- **Continuïtat Visual sense Fantasmes:** Les barres superiors de les columnes han de semblar una **única barra contínua**. Està totalment prohibit l'ús de marges, gaps o vores laterals (filets blancs d'1px) que trenquin aquesta continuïtat entre columnes.
- **Jerarquia de Grisos i Colors:**
  - *Fila 1 (Capçalera Principal: Carpetes, Notes, Eines d'edició):* Ha de ser d'**un sol gris uniforme** per a totes les columnes (utilitzant el gris fosc de "Carpetes"). No hi ha degradats cap al centre; és una barra horitzontal contínua.
  - *Fila 2 (Controls: Tot, Buscar, etc.):* A les columnes esquerra i central, aquesta fila tindrà un **gris més intens** per diferenciar-se clarament de la Fila 1. A la columna dreta, aquesta fila és on s'allotja la barra blava de la `UniversalPage` (quan n'hi ha).
  - *Fons de Contingut (Columna Carpetes):* El fons d'aquesta columna s'ha de diferenciar clarament de les seues capçaleres, usant també un to diferent (més intens/contrastat) per no confondre's amb els controls.
- **Icones transparents:** Totes les icones d'aquestes barres han de tindre un fons completament **transparent** i la icona pròpiament dita ha de ser de color **blanc** (sobre fons fosc) o **negre** (segons contrast). Prohibit l'ús de fons crema o blancs purs amb icones negres ("fantasmes") en els botons estructurals per desentonar amb la jerarquia.
- **Comportament i Distribució dels Botons (Quan Tot Està Obert):**
  - *Columna Esquerra (Carpetes):* A l'esquerra tenim el botó o l'icona amb el nom de la carpeta (ex. "Tot"). A la part dreta d'aquesta barra hi ha exclusivament l'icona de la "Roda Dentada" (Configuració).
  - *Columna Central (Notes):* A l'esquerra tenim exclusivament l'icona de la "Lupa" (Buscar). A la part dreta d'aquesta barra hi ha el botó sencer de "Crear Nota" (prohibit l'accent taronja "canon" per al text o icona d'aquest botó per evitar competir amb els elements primaris).

## 3. Lògica de Replegament (Collapse)

Quan l'usuari clica als icones d'ocultar les columnes (per amagar la barra lateral cap a l'esquerra), l'estat i l'alineació dels elements ha de ser perfecte:

- **Ocultació de Carpetes:** Quan es replega la columna de carpetes, l'icona que serveix per a tornar a obrir-la s'alinea de manera perfecta amb l'icona de la "Roda Dentada". Ambdós icones queden visibles.
- **Ocultació de Notes:** Quan es replega la columna de notes (cap a l'esquerra), el botó de "Crear Nota" **desapareix**. Només queda visible l'icona d'obrir la columna i la "Lupa".
- **Resum:** Només es poden crear notes si la columna de notes està desplegada (oberta). Aquesta és la distribució inicial i obligatòria.
- **Columnes fixes fora de mòbil (ordre del Mestre 261030):** amb més de 720 px la graella pinta sempre les tres columnes fixes, redimensionables amb els dos separadors i mai com a calaix flotant; amb 720 px o menys és la vista mòbil (mestre-detall). El tall és un de sol per al JS i la CSS (`PUNTS_DE_TALL.estret` de `src/components/layout/graella.js`).
- **La icona de la columna plega i desplega:** oberta, la icona de la capçalera és un botó germà del [|<] que fa el mateix; plegada, el rail porta la mateixa icona al mateix lloc per a desplegar-la, i el focus passa al botó contrari. L'acordió de la capçalera porta només la paraula i el chevron apegat; sense acordió, el títol és text fix. La fila sencera com a botó només la porta el Xat.
- **Estat d'arrencada:** les columnes arrenquen obertes a tots els espais, també al Bloc de Notes. Amb la finestra de 721 a 1023 px (entre `estret` i `compacte`), l'`UniversalWorkspace` arrenca amb la navegació plegada en rail (`navegacioPlegadaEnArrencar`); des de 1024 px, totes obertes. Només decidix la muntada: després mana la persona, i un `columnesInicials` explícit o el mode compacte manen sobre la franja.
- **El separador del mig s'agafa sempre:** per davall de la capçalera, la seua franja queda per damunt de la barra taronja i de les eines de l'editor, i per davall de la barra blava.

## 5. Llei de la Barra Negra Immutable i Safe-Area Natiu (Mòbil i Escriptori)

- **Topologia de la Barra Negra (`header.bar-black`):** La Barra Negra de Sóc de Poble és el portal d'identitat institucional i arrel universal de navegació (logo Sóc de Poble, traductor, IAIA MarIA, cerca, mode dia/nit i accés d'usuari).
- **Immutabilitat i Permanència Absoluta:** La Barra Negra **MAI es pot amagar ni fer desaparèixer** sota cap concepte (`display: none` està terminantment prohibit per a la barra negra global). És permanentment fixa (`position: sticky; top: 0;`), no s'amaga en fer scroll, ni en entrar al Xat (`/xat`), ni en cap vista mòbil.
- **Respecte Estricte del Safe-Area Superior (Dynamic Island / Barra d'Estat iOS):**
  - La Barra Negra MAI s'ha de dibuixar encavallada darrere de la barra d'estat del sistema (Dynamic Island, rellotge, wifi, bateria).
  - Ha d'incorporar `padding-top: env(safe-area-inset-top, 0px);` i una alçada adaptativa `calc(var(--sdp-alt-negra) + env(safe-area-inset-top, 0px))` amb `box-sizing: border-box`.
  - La barra d'estat nativa ocupa el coixí superior fosc, i el contingut de la Barra Negra (el logotip i els botons) se situa netament per davall de la Dynamic Island.
- **Jerarquia Vertical d'App i Subcapçaleres:**
  1. Dalt de tot: Barra d'estat del sistema / Dynamic Island (`safe-area-inset-top`).
  2. Just a sota: **Barra Negra de Sóc de Poble** (`header.bar-black`) — FIXA i IMMUTABLE.
  3. A sota de la Barra Negra: Les capçaleres de secció o subbarres (com la barra de `Converses` amb el commutador, menú i botó `+`).
  4. La barra de `Converses` o subbarres podran en un futur adaptar-se o ocultar-se si faltés espai extrem, però la Barra Negra de Sóc de Poble mai.

## Lliçons del Mestre

- **261030** | **Tres columnes fixes i icona que plega**: fora de mòbil (més de 720 px) l'espai de treball pinta les tres columnes fixes i redimensionables. Cada columna té la seua icona, que a la capçalera oberta plega com el [|<] i al rail desplega des del mateix lloc.
- **261030** | **Columnes obertes en arrencar**: tot espai de treball arrenca amb les columnes obertes. Només amb la finestra de 721 a 1023 px la navegació arrenca plegada en rail, i eixe tall viu a `src/components/layout/graella.js`.

## Vincles
- [[00_INDEX_SKILLS]]

