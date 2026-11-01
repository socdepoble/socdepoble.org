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

L'experiència d'edició de text ha de ser tan pura com la d'un processador de text editorial (`src/components/universal/UniversalToolbar.jsx` i `src/components/universal/UniversalEditorShell.jsx`), respectant la jerarquia SEO de la pàgina:

- **Ubicació Estratègica i Sticky:** La barra d'edició negra **NO està a la capçalera blava de l'aplicació**. Viu a l'interior de la finestra d'edició, col·locada exactament **a sota de l'Entradilla**, marcant la frontera entre la capçalera i el cos del document, i queda fixada (`sticky`) en fer scroll.
- **Desplegable d'Encapçalaments (`H3 → H4 → H5 → H6 → H2`), Llistes i Format (IDEA-59 / P1-72, Mestre 261101):**
  - El títol del document és l'`H1` i el subtítol és l'`H2`. Per tant, al cos de l'editor l'encapçalament natural de secció és **`H3`**. Cap botó solt d'encapçalament: un sol **desplegable** (botó de menú amb `aria-haspopup="menu"`) que diu el nivell actiu («H3»; «Paràgraf» si no n'hi ha cap) i oferix, en este ordre exacte, **`H3`**, `H4`, `H5`, `H6` i, al final del tot, `H2`. Teclat complet: Enter, Espai o les fletxes l'obrin; dins, fletxes, Inici, Fi, Enter i Escape. Triar el nivell actiu el torna a paràgraf. Mai `H1` al cos.
  - Format: **Negreta** i **Cursiva**. **Sense subratllat** (ni botó, ni marca a l'esquema, ni Cmd/Ctrl+U, ni el del menú del sistema; un `<u>` enganxat entra com a text normal). El **ratllat** («S» travessada) es conserva: no és el subratllat.
  - Els controls de llista ofereixen de manera explícita tant la **llista de pics** com la **llista numerada**.
- **Barra Compacta amb Segona Fila (`⋯`):** La primera fila porta l'encapçalament, la negreta, la cursiva i les llistes; un botó discret **«⋯» («Més eines»)**, amb `aria-expanded` i `aria-controls`, mostra o plega la **segona fila just a sota**, amb les eines secundàries (ratllat, citació i divisor) i les principals que no caben a la primera fila (la barra mesura l'amplària). Per davall del tall de la graella (`PUNTS_DE_TALL.eines`), «⋯» ocupa el lloc de l'antic «Aa» («Format del text») i obri totes les eines.
- **Iconografia:** els glifs de format són propis (`src/components/universal/richText/iconesBarra.jsx`): graella de 24 × 24, traç de `currentColor`, el mateix contracte que lucide, dins de la cel·la tàctil de 48 px (`--sdp-bloc-control`), en clar i en fosc amb els tokens del crom.
- **Llenç Complet Interactiu (`.sdp-editor-full-canvas`):** El contenidor d'escriptura ocupa tota l'alçada útil disponible (`min-height: 480px`, `padding-bottom: 25vh`, `cursor: text`) i qualsevol clic a la zona buida inferior enfoca automàticament el cursor al final del document (`editor.commands.focus('end')`).
- **Tipografia:** El text de l'editor es nodreix exclusivament de la família local **Noto Sans** i de les escales de Pedra Seca per assegurar una lectura orgànica.

## 4. La Plantilla Interactiva (Cartell Guia Reversible)

Quan el cos d'un document té 0 caràcters (per exemple, una nota nova), l'editor mai mostra un full en blanc total: pinta un **cartell guia** (`src/components/universal/richText/extensions/guiaCos.js`; el del Bloc, `GUIA_NOTA` de `src/sections/notes/llavorNota.js`) que demostra la jerarquia de l'eina. **No és contingut**: és una decoració que no es desa, no es publica ni arriba a la targeta; per al lector de pantalla és muda i el cos porta el seu `aria-placeholder`.

### Estructura de la mostra inicial

1. **Títol (H1):** Fictici, dissenyat per ocupar fins a 2 línies si és llarg per demostrar l'ajustament.
2. **Subtítol (H2):** 1 línia explicativa o inspiracional.
3. **Entradilla (Lead):** 2 línies de text de presentació.
4. **Cartell guia del cos (`GUIA_NOTA`):**
   - Títol de secció **H3** seguit del paràgraf que explica la plantilla (s'amaga en punxar, torna si s'ix sense escriure, no es desa ni es publica).
   - Subtítol de secció **H4** seguit d'un paràgraf de prova.
   - Una **llista amb pics** i una **llista numerada**.

### Interacció reversible (Mestre 261101)

- En punxar al cos (o entrar-hi amb el teclat), **el cartell desapareix** i queda el full en blanc per a escriure.
- Si la persona **ix del cos sense haver escrit res**, el cartell **torna**.
- Si en eixe document s'ha escrit **almenys un caràcter**, el cartell **ja no torna**, encara que s'esborre tot.
- Les notes velles que encara porten la plantilla antiga desada com a contingut (la llavor) la buiden al primer focus; després s'hi aplica el cartell.

## Vincles

- [[00_INDEX_SKILLS]]
- [[sdp-pedra-seca/SKILL]]
