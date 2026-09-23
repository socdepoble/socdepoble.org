---
type: plantilla
status: canonic
description: Plantilla de Pla d'Implementació per a IAIA MarIA i AIs auditores
tags:
  - plantilla
  - pla
---

<!-- SDP:EIXIDA
type: document
status: esborrany
description: "<12-220 caràcters: quins canvis de codi es proposen i per què>"
tags: [implementacio]
-->

<!-- 
Aquesta plantilla obliga a la IAIA MarIA a documentar què farà ABANS de fer-ho, 
permetent que AIs locals (Claude/Codex) auditen el pla en curs.
El nom del fitxer ha de ser sempre: aammdd_hhmm_pla_titol.md
i s'ha de guardar a l'Escriptori (_wiki_de_poble/04_escriptori/).
-->

# Pla d'Implementació — [Títol del Pla]

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]


## Registre

| Camp | Valor |
| --- | --- |
| Identificador | [pendent] |
| Versió | [pendent] |
| Entorn | [pendent] |
| Creació | [pendent] |
| Modificació | [pendent] |
| Propietari | [pendent] |
| Aprovació humana | [pendent] |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Acte reflex

La generació entrega esta plantilla i conserva un snapshot del contracte al rebut. El rebut acredita procedència, no comprensió ni autorització.

## Historial

[pendent]

## Canvis proposats

### Estat Actual (Fase 2)
Hem executat amb èxit el 'Camí Curt' per destapar la cadena:
- `[x]` **C2 - Guarda del Pany:** Corregit `segella.mjs` (hash `null`).
- `[x]` **C4 - Literals de Caixa:** Corregides les majúscules a l'arrel de SCC.
- `[x]` **C7 - Cens Únic:** Comptabilització dinàmica de skills als tests.

### Fases T (Restants) i Nou Diagnòstic
- `[ ]` **T1 - Diagnòstic i Cadàvers SGQ:** Corregir el diagnòstic prematur a `turns.mjs:109` (B1) i la compatibilitat falsa de `prompt_sgq.mjs` (B2).
- `[ ]` **T2 - Portes i Skills Invàlides:** Unificar la invocació real del linter amb el pre-commit consultiu.
- `[ ]` **T3 - Modularització del Backend:** Extraure validadors i mapatge pur sense alterar `backendPort.js`.
- `[ ]` **T4 - El Client de la Frontissa:** Completar el contracte de lectura des de Sollutia cap a Supabase.
- `[ ]` **T5 - Canari Visual i Permisos:** Prova de canari del component `PedraSecaEmbed`.

*(Pendent de rebre les auditories extremes de Claude i Codex per refermar o afegir més vulnerabilitats d'arquitectura)*

### Guia editorial de la plantilla


### Vincles (Ancoratge de Seguretat)
- [[00_index_actuar]]

### 1. Context i Troballes (Research)
Resum de què s'ha descobert abans d'escriure codi. Si hi ha auditories d'AIs locals prèvies, es citen ací.

### 2. Preguntes Obertes (User Review Required)
Dubtes fonamentals per al Mestre. Les AIs auditores que llegeixen aquest document poden aprofitar aquesta secció per a respondre o donar idees abans que el Mestre valide el pla.

### 3. Canvis Proposats (Proposed Changes)
El codi i passos concrets que s'aplicaran, separats per fitxers.

### [Acció: MODIFY / NEW / DELETE] `ruta/del/fitxer`
Descripció exacta o fragment de codi.

### 4. Pla de Verificació (Verification Plan)
Passos que executarem (portes, linting, tests, llançament de scripts) per comprovar que la implementació ha estat un èxit.




## Verificació

[pendent]

## Riscos

[pendent]

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
