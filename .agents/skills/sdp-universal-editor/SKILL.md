---
type: skill
status: canonic
description: Especificació de disseny i UX de l'Editor Universal (TipTap). Regles per a la barra d'eines, iconografia, metadades i la jerarquia de plantilles interactives.
tags:
  - disseny
  - skills
name: sdp-universal-editor
triggers_on:
  - UniversalEditor
  - TipTap
  - toolbar
  - NotesEditor
contracte.llig:
  - .agents/skills/sdp-pedra-seca/SKILL.md
  - src/components/universal/UniversalEditorShell.jsx
contracte.escriu:
  - src/components/universal/UniversalEditorShell.jsx
---

# SKILL: Universal Editor — Comportament i UX

Aquest manual defineix el comportament interactiu i la disposició de la interfície d'edició (Universal Editor) utilitzada a Notes, Pobles, Persones, Grups i Empreses. La visió és que aquest editor tinga la potència i la puresa visual suficients per publicar un llibre o un ePub, garantint una experiència d'usuari neta i lliure de distraccions.

## 1. Iconografia, Autoguardat (`CloudUpload`) i Emoticona (`La Ploma`)

L'editor prescindeix d'un botó clàssic de «Guardar», apostant per una experiència fluida i sense fricció a la Barra Taronja (`src/components/universal/barres/BarraTaronja.jsx`):

- **Autoguardat Silenciós (`CloudUpload`):** Quan hi ha canvis pendents o s'estan desant automàticament en segon pla, es mostra la icona del **núvol (`CloudUpload`)**. Un cop l'última versió ha quedat assegurada, l'indicador desapareix suaument (als `1,2 s`), comunicant a l'usuari que el document ja està protegit sense necessitat de prémer cap botó.
- **L'Emoticona del Document i «La Ploma» (`Feather`):** L'espai central de la Barra Taronja representa l'emoticona del document. En mode edició, si la nota encara no té cap emoji triat, mostra la icona d'una **ploma blanca (`Feather`)** que vol dir exclusivament **«tria una emoticona»**. En mode lectura o targeta, si no s'ha triat cap emoji, l'espai queda net.

## 2. Subvistes de Metadades i Selector d'Emojis (`PaginaEmojis`)

Abans d'entrar al cos lliure del document, i acompanyant l'encapçalament i la Barra Taronja, l'editor ofereix accions clares per a classificar, il·lustrar amb una emoticona i datar la publicació:

1. **Selector d'Emojis (`PaginaEmojis` — Prohibit `<Dialeg>` Flotant):** En prémer la Ploma (o l'emoji actual) a la Barra Taronja en mode edició, **MAI s'obri un modal flotant (`<Dialeg>`)**. S'obri la subvista integrada a columna completa **`PaginaEmojis`** (`src/components/universal/classificacio/PaginaEmojis.jsx` i `GraellaEmojis.jsx`) dins del mateix espai de treball, amb un botó prominent **«Tornar»** (`ArrowLeft`, diana tàctil mínima de `44px`) a la capçalera, cercador en viu i graella categoritzada d'acord amb l'estàndard Unicode 18 (`src/sections/notes/familiesEmojis.js`).
2. **Selector d'Etiquetes i Categories:** Un botó explícit que, en ser clicat, obri la subvista de classificació dins de la mateixa columna d'edició (amb botó «Tornar» de `44px`) per triar quines etiquetes i categories s'aplicaran a l'element.
3. **Selector de Drets d'Autor (Copyright):** La píndola i la línia de copyright sota el títol obrin el selector de llicències (`CC BY-NC-SA 4.0` de sèrie) fins que l'usuari prem «Desar autoria».
4. **Data i Hora:** Comandament a la Barra Taronja per establir i visualitzar la data i l'hora de publicació, sincronitzada amb el calendari intern.

## 3. La Barra d'Eines (`UniversalToolbar`), Jerarquia Semàntica i Llenç Complet

L'experiència d'edició de text ha de ser tan pura com la d'un processador de text editorial (`src/components/universal/editor/UniversalToolbar.jsx` i `UniversalEditor.css`), respectant la jerarquia SEO de la pàgina:

- **Ubicació Estratègica i Sticky:** La barra d'edició negra **NO està a la capçalera blava de l'aplicació**. Viu a l'interior de la finestra d'edició, col·locada exactament **a sota de l'Entradilla**, marcant la frontera entre la capçalera i el cos del document, i queda fixada (`sticky`) en fer scroll.
- **Jerarquia de Capçaleres i Llistes (`H3 -> H2`, `List` i `ListOrdered`):**
  - El títol del document és l'`H1` i el subtítol és l'`H2`. Per tant, al cos de l'editor l'encapçalament natural de secció és **`H3` (`Heading3`)**, que se situa en primer lloc abans d'`H2` (`Heading2`).
  - Els controls de llista ofereixen de manera explícita tant la **llista de pics (`List` / `toggleBulletList`)** com la **llista numerada (`ListOrdered` / `toggleOrderedList`)**.
- **Llenç Complet Interactiu (`.sdp-editor-full-canvas`):** El contenidor d'escriptura ocupa tota l'alçada útil disponible (`min-height: 480px`, `padding-bottom: 25vh`, `cursor: text`) i qualsevol clic a la zona buida inferior enfoca automàticament el cursor al final del document (`editor.commands.focus('end')`).
- **Tipografia:** El text de l'editor es nodreix exclusivament de la família local **Noto Sans** i de les escales de Pedra Seca per assegurar una lectura orgànica.

## 4. La Plantilla Interactiva (Contingut Inicial "One-Click")

Quan es crea un document nou (per exemple, una Nota Buida), l'editor mai mostra un full en blanc total. En canvi, ofereix una plantilla d'exemple didàctica que demostra totes les capacitats jeràrquiques de l'eina.

### Estructura de la mostra inicial

1. **Títol (H1):** Fictici, dissenyat per ocupar fins a 2 línies si és llarg per demostrar l'ajustament.
2. **Subtítol (H2):** 1 línia explicativa o inspiracional.
3. **Entradilla (Lead):** 2 línies de text de presentació.
4. **Catàleg de Paràgrafs (Cos del text):**
   - Text d'encapçalament **H3** seguit d'un paràgraf de prova.
   - Text d'encapçalament **H4** seguit d'un paràgraf de prova.
   - Text d'encapçalament **H5** seguit d'un paràgraf de prova.
   - Text d'encapçalament **H6** seguit d'un paràgraf de prova.

### Interacció d'esborrat automàtic

En el moment exacte en què l'usuari clica sobre qualsevol part del cos d'aquesta plantilla d'exemple, **tot el contingut formatiu d'exemple desapareix immediatament**, donant pas al full en blanc preparat per redactar sense obligar l'usuari a seleccionar i esborrar text manualment.

## Vincles

- [[00_INDEX_SKILLS]]
- [[sdp-pedra-seca/SKILL]]
