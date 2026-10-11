---
type: document
status: esborrany
description: Pla per encarregar a Claude la maquetació del PDF del FICIV
tags:
  - implementacio
visibility: private
reflex: sdp:torn_89b60b14-096c-432c-a0f4-2f66cc92199f:2552ffe5-b078-4ef3-ab50-3c967d93d1ee
---
# Pla Maquetació Editorial FICIV

**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_89b60b14-096c-432c-a0f4-2f66cc92199f:2552ffe5-b078-4ef3-ab50-3c967d93d1ee |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-11T12:08:05.899Z |
| Modificació | 2026-10-11T12:08:05.899Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-11T12:08:05.899Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

L'objectiu d'aquest pla és delegar a Claude la maquetació editorial dels lliurables de la subvenció del FICIV.

### 1. Context i Troballes (Research)
Ja tenim els 4 documents base (INFORME_PARA_CARMEN.txt, ESBORRANY_MEMORIA_ACTUACION.txt, i dos CSV) a la carpeta del laboratori (`02_investigacio_ia/261011_1400_ficiv_claude/`). El Mestre ha demanat aplicar les habilitats de maquetació editorial avançades de Claude per produir un informe altament llegible.

### 2. Preguntes Obertes (User Review Required)
Cap. L'ordre és directa: generar l'HTML o MD per a renderitzar-lo a PDF posteriorment per MarIA.

### 3. Canvis Proposats (Proposed Changes)
Claude llegirà els 4 arxius i generarà un nou document (ex. `informe_editorial.html` o `informe_editorial.md`) amb lletra gran, estructura clara, dos columnes (si és HTML) i ús de negretes per ressaltar els missatges crítics.

### 4. Pla de Verificació (Verification Plan)
Validarem que el fitxer creat té un disseny impecable ("somos de pueblo, grande y claro"). Després MarIA llançarà l'script de generació PDF.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Revisió visual de l'HTML/MD resultant abans de crear el PDF definitiu.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Que el format elegit per Claude no s'adapte bé a la generació posterior de PDF. S'ha de recalcar l'ús de lletres grans i claredat.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
