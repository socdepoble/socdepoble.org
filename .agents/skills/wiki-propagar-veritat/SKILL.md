---
type: skill
status: canonic
description: Propaga una decisió estructural o arquitectònica aprovada sobre una llista explícita de fitxers vius per mantenir la coherència del sistema.
tags:
  - saber
name: wiki-propagar-veritat
triggers_on:
  - propagar una decisió
  - actualitzar una decisió arquitectònica
  - coherència de la wiki
contracte.llig:
  - _wiki_de_poble/00_index.md
  - AGENTS.md
  - _wiki_de_poble/02_saber/doc_governanca.md
  - .agents/skills/sdp-workflow/SKILL.md
contracte.escriu:
  - _wiki_de_poble/00_index.md
  - AGENTS.md
---
# Propagar una decisió aprovada

Esta skill reconcilia les referències d’una decisió arquitectònica aprovada amb les superfícies declarades en l’encàrrec. La coincidència d’una paraula no autoritza editar el fitxer que la conté.

## 1. Fixar el canvi i la superfície

Identifica la decisió font, la forma antiga i la forma canònica. Declara una llista explícita de fitxers i superfícies autoritzades, segons `sdp-workflow` («L’abast es definix per superfície, no per patró»). El contracte de la skill descriu les seues rutes; no amplia els permisos de la petició. Si cal arribar a altres rutes, deixa-les com a proposta fins que formen part de l’encàrrec autoritzat.

## 2. Descoberta de només lectura

Busca les referències amb `rg` dins de la superfície declarada. Les coincidències fora d’ella es documenten com a pendents, sense substituir-les. L’arxiu `90_arxiu_historic/` queda fora del corpus operatiu i del RAG automàtic (AGENTS §5).

`04_escriptori/01_produccio/` i `04_escriptori/02_investigacio_ia/` queden fora de la cerca i de l’edició automàtiques; la propagació en estes zones requerix un encàrrec directe i explícit amb eixe abast (AGENTS §12). No seguixes enllaços simbòlics per ampliar la superfície declarada.

## 3. Preparar i revisar el pegat

Prepara un diff sobre els fitxers declarats, preservant els exemples, cites i registres històrics que no siguen instruccions vives. Revisa cada ocurrència en context: una substitució literal pot canviar un significat diferent. No uses una cerca recursiva com a llista d’edició ni una ordre global de `find` amb `sed` o `perl`.

Si hi ha treball concurrent sobre un fitxer, coordina la propietat i torna a llegir-ne la versió abans d’aplicar el pegat. Claude i Codex preparen i verifiquen els canvis de codi; la classificació i els moviments de documents corresponen a `core-higiene-escriptori` i no són part d’esta skill.

## 4. Aplicar i verificar

1. Aplica el pegat autoritzat pel carril d’execució vigent; esta skill no substituïx les portes ni els controls d’abast.
2. Revisa el diff i comprova que només han canviat els fitxers declarats. Verifica explícitament que l’arxiu i les zones protegides s’han conservat.
3. Repetix la cerca dins de la mateixa superfície i executa les comprovacions corresponents al canvi. Declara els rastres pendents amb la seua ruta i motiu; zero coincidències no acredita coherència semàntica completa.
4. Si la decisió afecta plantilles, rutes o metadades, reconcilia `.agents/protocolledge.json` i els seus consumidors dins de l’abast autoritzat. La creació i el rebut documental continuen en `wiki-documentacio-i-reflex`; no dupliques eixe circuit ací.

## Vincles

- [[00_INDEX_SKILLS]]
- [[sdp-workflow/SKILL|sdp-workflow]]
- [[core-higiene-escriptori/SKILL|core-higiene-escriptori]]
- [[wiki-documentacio-i-reflex/SKILL|wiki-documentacio-i-reflex]]
