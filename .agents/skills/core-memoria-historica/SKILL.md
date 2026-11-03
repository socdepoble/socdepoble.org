---
type: skill
status: canonic
description: Consulta i destil·la lliçons històriques, registra decisions i prepara relleus documentals sense arxivament automàtic.
tags:
  - escriptori
  - graf
name: core-memoria-historica
core: true
triggers_on:
  - lliçons apreses
  - memòria històrica
  - recuperar una decisió anterior
contracte.llig:
  - _wiki_de_poble/02_saber/memoria_aprenentatges.md
  - .agents/skills/wiki-cicle-de-vida/SKILL.md
  - _wiki_de_poble/10_actes
contracte.escriu:
  - _wiki_de_poble/02_saber/memoria_aprenentatges.md
  - _wiki_de_poble/10_actes
---
# Procediment de memòria històrica

1. Consulta [[memoria_aprenentatges]] per a les lliçons i la seua procedència.
2. Selecciona fonts concretes relacionades amb la tasca; no recórregues l’arxiu en RAG o bundles automàtics.
3. Registra decisions vigents a l’ESTAT i evidència a l’acta; una data recent no crea autoritat.
4. Arxiva només amb decisió explícita i relleu de rebut. No esborres de manera destructiva.
5. **Dos destins, dues operacions:** el relleu documental d'Olivera conserva l'arxiu local a `90_arxiu_historic/`, segons AGENTS §0.1 i `core-higiene-escriptori`. Una evacuació freda fora d'Obsidian usa el satèl·lit existent `../_arxiu_wiki_de_poble/` només si l'encàrrec ho inclou. No convertisques eixe satèl·lit en destí automàtic de qualsevol acta ni inventes carpetes d'arxiu a l'arrel.
6. Tanca amb la skill `wiki-cicle-de-vida`; conserva la zona humana i els documents en revisió.

## Vincles
- [[00_INDEX_SKILLS]]
- [[memoria_aprenentatges]]
