---
type: index
status: esborrany
description: Índex Dataview de les notes operatives, ordenat per connectivitat i amb metadades de l'esquema v2.
tags:
  - core
  - genoma
  - identitat
---
# 📊 Taula Mestra de la Wiki (Vista 2D)
> **⚠️ REQUISIT:** Per veure aquesta taula renderitzada (a l'estil Notion o Excel), necessites tenir instal·lat i activat el plugin de la comunitat anomenat **Dataview** a Obsidian.

```dataview
TABLE WITHOUT ID
  file.link AS "Títol",
  estat AS "Estat",
  tipus AS "Tipus",
  description AS "Descripció",
  aliases AS "Àlies",
  revisat AS "Revisat",
  (length(file.inlinks) + length(file.outlinks)) AS "Connexions"
FROM "01_ser"
  OR "02_saber"
  OR "03_actuar"
  OR "03_govern"
WHERE file.name != this.file.name
SORT (length(file.inlinks) + length(file.outlinks)) ASC
```


**Ancoratge de Seguretat:** [[00_index_identitat]]

