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

## Vincles (Ancoratge de Seguretat)
- [[00_index_actuar]]

## 1. Context i Troballes (Research)
Resum de què s'ha descobert abans d'escriure codi. Si hi ha auditories d'AIs locals prèvies, es citen ací.

## 2. Preguntes Obertes (User Review Required)
Dubtes fonamentals per al Mestre. Les AIs auditores que llegeixen aquest document poden aprofitar aquesta secció per a respondre o donar idees abans que el Mestre valide el pla.

## 3. Canvis Proposats (Proposed Changes)
El codi i passos concrets que s'aplicaran, separats per fitxers.

### [Acció: MODIFY / NEW / DELETE] `ruta/del/fitxer`
Descripció exacta o fragment de codi.

## 4. Pla de Verificació (Verification Plan)
Passos que executarem (portes, linting, tests, llançament de scripts) per comprovar que la implementació ha estat un èxit.


## Generació amb contracte executable

La ruta `pla.implementacio` de `.agents/protocolledge.json` defineix les seccions obligatòries. El bloc SDP:EIXIDA és l’exemple de metadades; la resta d’aquesta plantilla és context de redacció. Usa `document.mjs context` per rebre la plantilla i el rebut persistent, i `document.mjs create` per preparar el document amb totes les seccions. No copies el frontmatter de la plantilla com si fora el del fill.
