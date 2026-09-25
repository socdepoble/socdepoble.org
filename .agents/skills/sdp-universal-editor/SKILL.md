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

## 3. La Barra d'Eines (Toolbar) i Jerarquia Semàntica

L'experiència d'edició de text ha de ser tan pura com la d'un processador de text professional (tipus Google Docs), respectant la jerarquia SEO de la pàgina.

- **Ubicació Estratègica i Sticky:** La barra d'edició negra (amb botons de negreta, cursiva, etc.) **NO ha d'estar a la capçalera blava de l'aplicació**. S'ha de moure a l'interior de la finestra d'edició, col·locada exactament **a sota de l'Entradilla**. Això marca visualment la frontera: dalt està la Targeta (Card) i baix comença el cos del document. A més, quan l'usuari faça scroll pel text, **aquesta barra ha de quedar fixada (sticky)** a dalt perquè les eines d'edició estiguen sempre accessibles.
- **Doble Estat (Bàsic i Desplegat):**
  - **Estat Bàsic (Replegat):** La barra mostra només els botons més bàsics per no atabalar: `H3`, Negreta (`B`), Cursiva (`I`), Ratllat (`S`) i Llistes. *Atenció: En aquest estat bàsic NO hi haurà cap botó per inserir H1 o H2*, ja que l'H1 és el títol i l'H2 és el subtítol.
  - **Estat Avançat (Desplegat "Google Docs Style"):** L'usuari podrà desplegar la barra (ocupant una segona o tercera fila, alineant-se a la part inferior de la capçalera). En aquest mode complet, apareixeran absolutament totes les eines d'edició avançada per publicar ePubs/llibres, incloent-hi opcions per a inserir `H2` o targetes incrustades.
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


## Vincles
- [[00_INDEX_SKILLS]]
