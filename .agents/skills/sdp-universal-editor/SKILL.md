---
type: skill
status: canonic
description: Especificació de disseny i UX de l'Editor Universal (TipTap). Regles per a la barra d'eines, iconografia, metadades i la jerarquia de plantilles interactives.
tags:
  - ui
  - editor
  - tiptap
name: sdp-universal-editor
triggers_on:
  - UniversalEditor
  - TipTap
  - toolbar
  - NotesEditor
---

# SKILL: Universal Editor — Comportament i UX

Aquest manual defineix el comportament interactiu i la disposició de la interfície d'edició (Universal Editor) utilitzada a Notes, Pobles, Persones, Grups i Empreses. La visió és que aquest editor tinga la potència i la puresa visual suficients per publicar un llibre o un ePub, garantint una experiència d'usuari neta i lliure de distraccions.

## 1. Iconografia i Estat d'Edició (Autoguardat)
L'editor prescindeix d'un botó clàssic de "Guardar", apostant per una experiència més fluida i recolzada per un sistema d'autoguardat visual:
- **Icona d'Edició / Canvis Pendents (La Ploma):** Mentre l'usuari està redactant o el document té canvis pendents de guardar, es mostra l'icona d'una **ploma** a la barra superior (on solia estar la "i" d'informació).
- **Desaparició per Autoguardat (Feedback Visual):** En el moment en què el sistema guarda automàticament els canvis en segon pla, la ploma **desapareix**. Això comunica a l'usuari que l'última versió ja està assegurada al disc, estalviant-nos el botó "Guardar".
- **Reaparició Reactiva:** Només que l'usuari torne a teclejar, la ploma torna a aparèixer per indicar que la sessió d'edició s'ha reprès.
- **Absència en Mode Lectura / Targeta:** Quan el document es presenta en mode lectura o renderitzat com a Targeta (Card), la ploma no hi apareix mai, ja que no hi ha edició en curs.

## 2. Botons de Metadades (Zona del Títol)
Abans d'entrar al cos lliure del document, i acompanyant l'encapçalament, l'editor ha d'oferir accions clares (botons) per a classificar i datar la publicació:
1. **Selector d'Etiquetes i Categories:** Un botó explícit que, en ser clicat, òbriga una vista/pàgina nova (dins del mateix *frame* o columna d'edició) per triar quines etiquetes i categories s'aplicaran a l'element.
2. **Selector de Copyright:** Un botó per establir els drets d'autor (per defecte predefinit a "Sóc de Poble" o al nom de la persona registrada).
3. **Data i Hora:** Comandament per establir i visualitzar la data i l'hora de publicació (aquest valor es sincronitza i envia cap al calendari intern).

## 3. Jerarquia Semàntica i la Barra d'Eines (Toolbar)
La barra d'eines principal de l'editor (situada a la capçalera de la columna) no pot contradir la jerarquia SEO de la pàgina.

- **Reserva de H1 i H2:** 
  - **H1:** Reservat estrictament per al Títol de la nota/pàgina.
  - **H2:** Reservat per al Subtítol (ex: "El teu estudi d'escriptura privat i lliure de distraccions").
  - Per tant, **a la barra d'eines (Toolbar) NO poden haver-hi botons per inserir H1 o H2.**
- **Encapçalaments permesos a la Toolbar:** La barra d'eines permetrà exclusivament inserir `H3`, `H4`, `H5` i `H6`, a més d'icones d'edició rica estàndard (Negreta, Cursiva, Ratllat i llistes).
- **Expansió per a Edició Avançada:** Per a mantenir la barra principal neta, les opcions d'edició més avançades (necessàries per a formatar llibres, ePubs, o inserir targetes) s'allotjaran en una **segona barra d'edició desplegable** o un menú expansible.
- **Tipografia:** Cal evitar les lletres per defecte i mancades de disseny. El text de l'editor s'ha de nodrir de les fonts i mides "Premium" del sistema de disseny de Sóc de Poble per assegurar una lectura orgànica.

## 4. La Plantilla Interactiva (Contingut Inicial "One-Click")
Quan es crea un document nou (per exemple, una Nota Buida), l'editor mai mostra un full en blanc total. En canvi, ofereix una plantilla d'exemple didàctica que demostra totes les capacitats jeràrquiques de l'eina.

**Estructura de la mostra inicial:**
1. **Títol (H1):** Fictici, dissenyat per ocupar fins a 2 línies si és llarg per demostrar l'ajustament.
2. **Subtítol (H2):** 1 línia explicativa o inspiracional.
3. **Entradilla (Lead):** 2 línies de text de presentació.
4. **Catàleg de Paràgrafs (Cos del text):**
   - Text d'encapçalament **H3** (ex: "Heading 3") seguit d'un paràgraf de prova.
   - Text d'encapçalament **H4** seguit d'un paràgraf de prova.
   - Text d'encapçalament **H5** seguit d'un paràgraf de prova.
   - Text d'encapçalament **H6** seguit d'un paràgraf de prova.

**Interacció d'esborrat automàtic:**
En el moment exacte en què l'usuari clica sobre qualsevol part del cos d'aquesta plantilla d'exemple (per exemple, a sobre de l'H3 per començar a escriure el seu llibre), **tot el contingut formatiu d'exemple desapareix immediatament**. Aquesta neteja reactiva dóna pas al full en blanc preparat per redactar, sense obligar l'usuari a seleccionar i esborrar text de farciment manualment.
