---
type: index
status: esborrany
description: Índex Dataview de les notes operatives, ordenat per connectivitat i amb metadades de l'esquema v2.
tags:
  - core
  - genoma
  - identitat
---
# 📊 Taula Mestra de la Wiki (vista 2D)

Vista en taula de totes les notes de `01_ser`, `02_saber` i `03_actuar`, amb l'estat, el tipus i la descripció del frontmatter de l'esquema v2. Les notes amb menys connexions ixen primer, perquè són les que més risc tenen de quedar-se òrfenes.

> **⚠️ Requisit:** per veure esta taula renderitzada (a l'estil Notion o Excel), cal tindre instal·lat i activat el plugin de la comunitat **Dataview** a Obsidian. Fora d'Obsidian es veu com un bloc de codi.

```dataview
TABLE WITHOUT ID
  file.link AS "Títol",
  status AS "Estat",
  type AS "Tipus",
  description AS "Descripció",
  aliases AS "Àlies",
  (length(file.inlinks) + length(file.outlinks)) AS "Connexions"
FROM "01_ser"
  OR "02_saber"
  OR "03_actuar"
WHERE file.name != this.file.name
SORT (length(file.inlinks) + length(file.outlinks)) ASC
```

## Vincles

- [[00_index_identitat]]
- [[00_index]]
