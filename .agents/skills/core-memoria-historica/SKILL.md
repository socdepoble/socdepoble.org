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
5. **Destí Canònic Fora d'Obsidian (`_arxiu_wiki_de_poble`):** Tot document, paquet o llast històric que ja no s'haja de mantindre dins de la Wiki viva d'Obsidian (`_wiki_de_poble/`) però que calga conservar, es trasllada SEMPRE i ÚNICAMENT a la carpeta canònica existent fora d'Obsidian: `../_arxiu_wiki_de_poble/` (`/Users/javillinares/Documents/Antigravity/Som de Poble/_arxiu_wiki_de_poble/`). Està terminantment prohibit inventar carpetes noves a l'arrel de `Som de Poble/`.
6. Tanca amb la skill `wiki-cicle-de-vida`; conserva la zona humana i els documents en revisió.

## Vincles
- [[00_INDEX_SKILLS]]
- [[memoria_aprenentatges]]
