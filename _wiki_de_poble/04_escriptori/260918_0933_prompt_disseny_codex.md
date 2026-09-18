---
titol: "Prompt per a Codex: Calcat de Disseny i Cacera de Fantasmes UI"
descripcio: "Petorreta per a Codex (Sol Alto) detallant els requisits visuals i de layout exactes que el Mestre vol calcar, per tal que analitze el CSS i el JSX a fons."
autor: "IAIA MarIA"
data_creacio: "2026-09-18"
estat: "esborrany"
tags:
  - prompt
  - disseny
  - codex
---
# Prompt per a Codex (Sol Alto): Calcat de Disseny i Cacera de Fantasmes UI

[INSTRUCCIÓ PRINCIPAL: Llig el frontmatter i aquest document sencer abans d'executar res. Tens barra lliure per a proposar els canvis de codi necessaris.]

Hola Codex. Sóc el Mestre. La IAIA MarIA ha fet una gran feina en l'estructura, però a nivell de disseny visual i CSS encara tenim problemes i "fantasmes" que impedeixen que la interfície siga exactament igual al disseny original. Com que estàs operant com a "Sol Alto", vull que sigues tu qui analitze on estan les fallades i em dones el codi exacte per a deixar-ho perfecte.

Els fitxers implicats són principalment `AppGridShell.css`, `modules.css`, `AppGridColumn.jsx` i `UniversalWorkspace.jsx`.

## Requisits de Disseny a "Calcar" (Problemes Actuals)

1. **Espaiat Icona-Text massa gran:** Actualment hi ha una separació d'uns 36 píxels entre les icones i el text a la sidebar (categories, etiquetes, etc.). Vull que aquesta separació siga **exactament de 24 píxels**, no més.
2. **Element Atòmic (Tàndem):** Vull que crees o unifiques un "element atòmic" que siga el tàndem d'Icona + Text. Aquest element s'ha d'utilitzar tant a la sidebar com a la llista de Notes (els ítems com "Bloc de notes" o "Sense títol"). L'objectiu és que si es canvia un (per exemple s'enfosqueix), canvien tots igual. Han de compartir la mateixa lògica visual i portar una única icona.
3. **El Comportament de "Carpetes":** Tant "Carpetes" com "Notes" porten una icona. El de "Carpetes" serveix per amagar la carpeta cap avall (com fan els acords de Categories o Etiquetes). Actualment, en punxar per amagar el contingut cap avall, **no s'amaga la segona capçalera** (la de "Tot"). Cal arreglar aquesta interacció.
4. **Color de la Segona Capçalera:** La segona capçalera (la fila on està el botó "Tot" i "Crear Nota") ha de tindre un fons gris **més clar** que la primera cabecera de "Carpetes" i "Notes". Ara mateix no destaquen correctament.
5. **Visibilitat de la Roda Dentada en Replegar:** A l'esquerra, al costat de "Tot", hi ha una roda dentada de configuració. Quan la columna es replega completament, s'ha de continuar veient la roda dentada (tal com passa amb la lupa a la columna de notes).
6. **Alineació del Botó Publicar:** A la barra superior de l'editor, el botó blau de "Publicar" ha d'estar sempre alineat **completament a la dreta**, passi el que passi amb la resta de botons d'eines.

## La teua Missió

1. Troba els "fantasmes" al CSS (marges estranys, flex gaps incorrectes, display flex mal aplicats) que estan causant això.
2. Dóna'm les modificacions exactes de `UniversalWorkspace.jsx`, `AppGridColumn.jsx` i del CSS per a assolir aquesta perfecció visual i crear el component atòmic Icona+Text.
3. Assegura't de respectar la modularitat (Pedra Seca).

Quede a l'espera del teu codi.
