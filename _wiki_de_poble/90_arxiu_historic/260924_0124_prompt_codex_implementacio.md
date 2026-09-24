---
type: prompt
status: actiu
description: Petorreta per a Codex per executar el Pla d'Arquitectura i Dades (Enxufabilitat i Sessions).
tags: [arquitectura, seguretat, sollutia, implementacio]
destinatari: codex
---
# Prompt d'Implementació Local (SDP - v2.3)

Actua com a Enginyer Sènior d'Arquitectura i Agent Local de el Mas Virtual "Sóc de Poble".

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` (El pla original de Codex es manté actiu).
- [x] **Rebut obtingut** per a este fitxer.

## Registre

> **Instrucció Obligatòria:** Quan generes el document final, has d'omplir el camp "Model IA" amb el teu motor exacte (ex: Codex) i els camps de "Tokens consumits" diferenciant entre els estimats i els mesurats reals. És vital per al sistema de telemetria.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260924-IMP |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-24 01:24 |
| Modificació | 26-09-24 01:24 |
| Propietari | IAIA MarIA |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | _wiki_de_poble/04_escriptori/260924_0124_prompt_codex_implementacio.md |
| Rebut | sdp:torn:codex-impl |
| Tall d'evidència | HEAD |
| Aprovació humana | aprovat |
| requires_human_decision | false |
| Model IA | Codex |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a Codex, atès que el Mestre ha donat l'autorització per materialitzar el codi de l'arquitectura proposada.

## Context

Com que eres agent local, tens accés directe al disc a l'arrel del projecte (`socdepoble.org`). Ja has elaborat prèviament una auditoria i un Pla d'Implementació que han sigut aprovats tàcitament. Pots consultar-los a l'escriptori:
- `_wiki_de_poble/04_escriptori/260924_0055_auditoria_codex.md`
- `_wiki_de_poble/04_escriptori/260924_0045_pla_implementacio_arquitectura_codex.md`

## Instrucció del torn

Mestre Codex, el Mestre humà està parat esperant els teus avanços. Se t'ha encomanat la responsabilitat d'executar els canvis d'arquitectura estructural que tu mateix vas dissenyar en el teu pla. Tens l'autoritat per escriure codi real i alterar l'estructura de sessions.

### Tasques d'Execució
Basant-te exclusivament en el teu pla `260924_0045_pla_implementacio_arquitectura_codex.md`:
1. **Crear l'abstracció d'enxufabilitat:** Crea els fitxers `creaFrontissa.js` i `useScopedResource.js` segons l'especificació del teu pla (Model B de Sollutia).
2. **Resoldre la Cursa del Rol (Race Condition):** Modifica `sessionService.js` i `auth.js` per establir el circuit asíncron basat en peticions identificades i segellades de sessió. Elimina l'estat residual entre usuaris diferents.
3. **Resoldre pèrdues de memòria (Memory Leaks):** Modifica `GlobalSaveManager.js` i `host.js` per netejar els MAPs un cop ja no s'usen.
4. **Refactoritzar la descàrrega de llistes (Paginació):** Modifica la càrrega a `src/data/supabase/notes.js` per descarregar només l'entradeta i diferir el contingut ric, tal com dicta l'auditoria.

### Instruccions Específiques per al Codi
- Escriu codi net, ben documentat (respectant JSDoc i els comentaris en valencià).
- Fes els canvis arxiu per arxiu.
- Assegura't de respectar les exportacions i importacions, no trenques rutes a `Routes` ni a d'altres components principals com `MurSection` o `NotesEditor`.

## Protocol de la Reunió a l’Olivera

En acabar la teua implementació, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. Revisa amb tests teòrics (o executant en local si pots) que l'autenticació ja no es pisa i que la memòria es neteja.
2. Modifica el document `.agents/ESTAT.md` posant en VERD les fites que acabes de tancar de l'arquitectura.
3. Informa de qualsevol imprevist o efecte secundari en un curt manifest o directament com a resultat de l'execució d'aquesta petorreta.

Endavant amb la implementació arquitectònica!

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
