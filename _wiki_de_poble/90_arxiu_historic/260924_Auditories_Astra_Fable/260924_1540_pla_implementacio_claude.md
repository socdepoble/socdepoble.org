---
type: document
status: esborrany
description: Reestructurar pestanyes en pàgines separades
tags:
  - implementacio
visibility: private
reflex: sdp:torn_47078719-7e23-4876-8f2c-ede11f39b939:3b95a3ce-ec57-4191-8d96-489308adb8ff
---
# Refactoritzar la Consola en Dashboard

**Estat del Pla:** aprovat

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_47078719-7e23-4876-8f2c-ede11f39b939:3b95a3ce-ec57-4191-8d96-489308adb8ff |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T13:33:50.791Z |
| Modificació | 2026-09-24T13:33:50.791Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity (IAIA MarIA) |
| Tokens consumits | [no aplicable] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-24T13:33:50.791Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

- Transformar la Consola Termodinàmica de disseny de "Pestanyes" a un disseny de múltiples pàgines separades.
- Crear una pàgina principal (Dashboard) a `/consola` que continga 6 `Cards` de Pedra Seca, un per a cada pàgina, amb una breu descripció i informació bàsica de la pàgina de destinació.
- Arreglar l'estructura tipogràfica de la pàgina principal: actualment hi ha dos etiquetes `H2` seguides sense text entre mig. Cal afegir-hi una "entradeta" (lead paragraph) per a fer la pàgina més amable.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

- Comprovar que el dashboard principal de la Consola mostra les 6 "cards".
- Comprovar que els enllaços funcionen i porten a rutes independents de la Consola.
- Comprovar l'absència de pestanyes.
- Verificar l'estructura d'encapçalaments (només un H2 seguit per un paràgraf abans del següent encapçalament).

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- Tocar el Router de React per afegir 5 sub-rutes per a la Consola Termodinàmica pot comportar errors d'enrutament.
- Assegurar que l'estat global (JSON Mapa) es manté o es recupera eficientment en navegar entre les noves rutes de la consola en lloc de romandre tot muntat en la mateixa pàgina com abans.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
