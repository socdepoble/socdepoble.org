---
tipus: index
estat: esborrany
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
FROM "00_SER_Brain_Identitat"
  OR "01_SABER_Cultura_Coneixement"
  OR "02_ACTUAR_Maquina_Tecnica"
  OR "03_GOVERNAR_Normativa_Regles"
WHERE file.name != this.file.name
SORT (length(file.inlinks) + length(file.outlinks)) ASC
```


**Ancoratge de Seguretat:** [[00_index_identitat]]


---

**Ancoratge de Seguretat:** [[00_index_identitat]]

## Sinapsis Entrants (Autogenerat)

- [[00_index|00_INDEX.md]] — [[01_identitat|00_SER_Brain_Identitat/01_IDENTITAT.md]] — Tornar a:[[00_INDEX...
- [[00_index_identitat|00_SER_Brain_Identitat/00_INDEX_IDENTITAT.md]] — [[doc_taula_mestra]]
- [[01_identitat|00_SER_Brain_Identitat/01_IDENTITAT.md]] — Tornar a:[[00_index|00_index]], [[doc_taula_mestra]]
- [[doc_taula_mestra|00_SER_Brain_Identitat/DOC_Taula_Mestra.md]] — [[00_index_identitat|00_SER_Brain_Identitat/00_INDEX_IDENTITAT.md]] — [[DOC_T...
- [[graf|01_SABER_Cultura_Coneixement/Graf.md]] — [[doc_taula_mestra|00_SER_Brain_Identitat/DOC_Taula_Mestra.md]] — Etiquetes: ...
- [[identitat|01_SABER_Cultura_Coneixement/Identitat.md]] — [[doc_taula_mestra|00_SER_Brain_Identitat/DOC_Taula_Mestra.md]] — Categoria: ...

<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->
