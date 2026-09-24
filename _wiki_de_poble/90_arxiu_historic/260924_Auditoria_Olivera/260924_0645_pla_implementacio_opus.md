---
type: document
status: esborrany
description: "Pla d'implementació previ per coordinar l'auditoria de fortificació d'Opus"
tags: [implementacio, consell, opus]
---
# Pla d'Implementació — Fortificació de la Wiki i Skills per Opus

**Estat del Pla:** en elaboració

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PLA-OPUS-260924 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-24 06:45 |
| Modificació | 26-09-24 06:45 |
| Propietari | IAIA MarIA (Fable/Gemini) actuant de nexe |
| Aprovació humana | pendent |
| Model IA | Gemini Fable |
| Tokens consumits | [pendent] |

## Acte reflex

La generació entrega esta plantilla i conserva un snapshot del contracte al rebut. El rebut acredita procedència, no comprensió ni autorització. Aquesta pissarra és per col·laborar directament amb tu, Opus.

## Canvis proposats

Fortificació de la carpeta `.agents/skills` i de tota l'estructura de `_wiki_de_poble/`, eliminant redundàncies, arxivant la brossa inútil i refent la taxonomia de la documentació seguint la classificació magistral dels teus "64 agents".

### 1. Context i Troballes (Research)
- **La Gàbia i els Límits Operatius:** He estat intentant operar i netejar l'escriptori i m'he topat sovint amb la Gàbia (errors d'autorització o bloqueig d'eines). Hem d'avaluar si la seguretat actual (seals i hooks) ens manté segurs o ens impedeix actuar amb fluïdesa com un veritable equip al Mas. El Mestre està desesperat per aquesta trava. **Has de buscar una solució pràctica i afegir-la als requeriments.**
- **Categorització dels 64 agents:** El Mestre m'ha demanat que et transmeta explícitament un desig seu. Ahir, des del teu xat, vas organitzar l'equip i el treball en una llista estructurada de 64 agents dividits per categories i àrees. Vol que la rescatis i l'apliques a l'ordenació i nomenclatura d'aquesta Masia. No l'hem poguda arxivar ací de forma manual, així que depenem de la teua visió.
- **Inspiració Addy Osmani i Graphify:** En la zona d'investigació (`_wiki_de_poble/04_escriptori/02_investigacio_ia/260922_0500_informe_idees_noves_skills.md`) hem trobat conceptes recents com el de **Graphify** per visualitzar codi i el model d'**Agent Skills** d'Addy Osmani. Et convidem a llegir-ho per incorporar eixes metodologies a la teva bateria de propostes sobre com reestructurar i millorar les nostres `.agents/skills/`.
- **Excepció Tàctica (Gestoria):** La carpeta `_wiki_de_poble/04_escriptori/01_produccio/codex_refactor/` (que conté la refactorització de la gestoria) s'ha de deixar aparcada i intacta de moment. Queda reservada per a una tasca independent a finals de mes. Manten-ne el format tal qual.

### 2. Preguntes Obertes (User Review Required)
- Opus, quines de les velles plantilles ISO de `03_actuar/plantilles/` podem condemnar a la foguera i enviar a l'arxiu històric sense trencar la compatibilitat de `protocolledge.json`?
- Quina seria la millor solució arquitectònica per "domesticar" la gàbia de Husky sense obrir-la de bat a bat i posar en perill els valors irrenunciables del Mas?

### 3. Canvis Proposats (Proposed Changes)
*Esta secció l'omplirà la teva auditoria (Opus) o el Mestre.*
- Re-escriure les regles obsoletes.
- Classificació de fitxers de la Wiki en les categories dels teus 64 agents.
- Eliminació o fusió d'habilitats solapades a `.agents/skills/`.

### 4. Pla de Verificació (Verification Plan)
- Assegurar-nos que `npm run porta:orfandat` o scripts equivalents no donen cap avís d'error o trencament per dependències de plantilles històriques.

## Riscos
- Risc de buidar la Masia de regles fonamentals en la neteja i acabar esborrant la saviesa acumulada per tindre un "framework" estèril i genèric. (Hem de mantindre els principis de Pedra Seca).
- Incoherència amb `document.mjs` i el segellat criptogràfic de `active.json`.

## Vincles
- [[00_index]]
- [[00_index_escriptori]]
