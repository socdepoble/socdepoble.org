---
type: document
status: esborrany
description: Pla per donar instruccions a Claude d'aplicar la seua capa editorial a l'informe complet.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_f2be3d1e-0501-4d2d-9bde-47a6c1b95669:7a0c02d1-49df-4e3d-889a-50b65c4bf30d
---
# Pla d'implementació: Maquetació total per Claude

**Estat del Pla:** aprovat<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f2be3d1e-0501-4d2d-9bde-47a6c1b95669:7a0c02d1-49df-4e3d-889a-50b65c4bf30d |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-11T22:23:11.032Z |
| Modificació | 2026-10-11T22:23:11.032Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | MarIA |
| Tokens consumits | N/A |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-10-11T22:23:11.032Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

Demanarem a Claude que prenga l'informe complet original (del qual només va fer un resum) i aplique el seu disseny editorial perfecte (usant l'HTML generat en `informe_editorial_ficiv_2026.html`) amb el text íntegre, ajustant el tamany de font a 15pt per fer-lo perfectament llegible en mòbils. A més, es demanarà a Claude que establisca unes pautes (sistema de disseny) perquè la IA puga imitar i mantenir aquest disseny sempre per a Sóc de Poble.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

Claude retornarà un fitxer HTML llest per a ser renderitzat a PDF amb `tooling/pdf/render_pdf.sh`. L'informe estarà complet i es llegirà bé en pantalles xicotetes.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

Pèrdua d'informació de la font original durant el format. S'especifica claret a Claude que cal utilitzar **el text íntegre**, sense resums.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
