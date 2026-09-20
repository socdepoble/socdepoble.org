---
type: plantilla
status: canonic
description: Plantilla de Pla d'Implementació per a IAIA MarIA i AIs auditores
tags:
  - plantilla
  - pla
---

<!-- 
Aquesta plantilla obliga a la IAIA MarIA a documentar què farà ABANS de fer-ho, 
permetent que AIs locals (Claude/Codex) auditen el pla en curs.
El nom del fitxer ha de ser sempre: AAMMDD_HHMM_PLA_Titol_del_Pla.md
i s'ha de guardar a l'Escriptori (_wiki_de_poble/04_escriptori/).
-->

# Pla d'Implementació — [Títol del Pla]

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

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
