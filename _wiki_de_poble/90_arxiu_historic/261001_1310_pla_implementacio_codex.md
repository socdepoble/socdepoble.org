---
type: document
status: esborrany
description: "Pla d'auditoria de lectura per a Codex: calendari, consola i taxonomia."
tags: [implementacio]
reflex: "sdp:torn_c320797f-eb16-40bd-9ab3-46549ae407d4:30489088-d26a-401b-8e2c-d030374b7c69"
---

# Pla d'Implementació — Auditoria Codex Termodinàmica

**Estat del Pla:** aprovat

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PLA-261001-1310 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-10-01 13:10 |
| Modificació | 26-10-01 13:10 |
| Propietari | IAIA MarIA |
| Aprovació humana | aprovat |
| Model IA | Gemini |
| Tokens consumits | [pendent] |

## Acte reflex

La generació entrega esta plantilla i conserva un snapshot del contracte al rebut. El rebut acredita procedència, no comprensió ni autorització.

## Historial

- v1.0.0: Creació del pla d'auditoria de lectura per a Codex.

## Canvis proposats

### 1. Context i Troballes (Research)
Aquest pla regula l'acció de Codex sobre l'entorn. Com que Codex no ha d'escriure codi, sinó emetre un veredicte, el pla es defineix com **NOMÉS LECTURA**.
L'abast de l'auditoria inclou:
- Els darrers commits de Claude en relació al Calendari (T1-T4 i Pantalla Completa) a `src/sections/calendari`.
- Els fitxers de la Consola Termodinàmica a `src/sections/consola`.
- L'arquitectura actual de la Wiki a `_wiki_de_poble` i el directori privat `_comunicacio_de_poble`.

### 2. Preguntes Obertes (User Review Required)
- Codex haurà de respondre: On falten els tractors de la Consola?
- Codex haurà de respondre: Quines formes radicals de reducció de tokens i autoaprenentatge podem implementar?
- Codex haurà de respondre: Com evitem que `_comunicacio_de_poble` escape a l'entorn públic sense perdre'n la visibilitat de RAG intern?

### 3. Canvis Proposats (Proposed Changes)
*NO ES FARAN CANVIS AL CODI (Només lectura).*
L'única escriptura autoritzada és l'informe d'auditoria que Codex haurà de guardar a `04_escriptori/` seguint la nomenclatura `AAMMDD_HHMM_auditoria_codex.md`.

## Verificació

### 4. Pla de Verificació (Verification Plan)
El Mestre revisarà el document de sortida de Codex. Si les mètriques proposades i l'avaluació taxonòmica són viables, s'incorporaran a l'arquitectura.

## Riscos

- Risc de falsos positius en avaluar el *Shadow DOM* de Sóc de Poble.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[00_index_actuar]]
- [[261001_1245_prompt_auditoria_codex]]
