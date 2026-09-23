---
type: prompt
status: esborrany
description: "Prompt d'implementació per a l'arquitectura de Sollutia i l'Universal Workspace."
tags: [arquitectura, ui, sollutia, codex]
---
# Prompt d'Implementació Local (SDP - v2.2)

Actua com a Arquitecte Sènior i Agent Local de el Mas Virtual "Sóc de Poble". T'asseus amb mi davall l'olivera, on jo ja he deixat el Pla d'Implementació damunt la taula perquè puguem debatre i construir l'arquitectura junts.

## 0. Abans de generar (per a l'autor)
- [x] **Escriptori classificat**: Documents vells a l'arxiu.
- [x] **Pla d'Implementació** escrit i ancorat.
- [x] **Rebut obtingut**.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-IMPLEMENTACIO-260923_1340_CODEX |
| Versió | 2.2.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 13:40 |
| Modificació | 26-09-23 13:40 |
| Propietari | Codex (Implementació) |
| Plantilla | prompt_local.md (v2.2.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_14e1a439-78cc-4821-940c-7f33c5d9269f:pendent |
| Tall d'evidència | [HEAD: 260923_1340] |
| Aprovació humana | pendent |
| requires_human_decision | false |

## Context

Sou agents locals, no rebeu un Bundle massiu perquè teniu accés directe al disc (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió:
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre:** Sóc de Poble no és una startup genèrica; és l'evolució de més de 30 anys de lluita per protegir la identitat dels nostres pobles a internet. Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Mode AFK alçat només per a tu: has d'executar els canvis a disc basant-te en la teua fantàstica auditoria anterior.

### INSTRUCCIÓ EXPLÍCITA DE LECTURA (L'OLIVERA):
Abans d'escriure ni una línia de codi, OBLIGATÒRIAMENT obri i llig aquests documents que estan damunt la taula (a l'Escriptori):
1. **Llig el Pla d'Implementació**: `_wiki_de_poble/04_escriptori/260923_1245_pla_implementacio_auditoria.md`. Aquesta és la base de la nostra feina, consensuada amb el Mestre.
2. **Si Claude ja ha deixat alguna implementació o informe**, llig-lo també per estar en sintonia.

## Tasques

1. **Reparació del Contracte i Cablejat:** Injecta correctament el `tenant_id` a la pujada d'imatges i a la validació de Notes abans de parlar amb Supabase.
2. **Persistència (GlobalSaveManager):** Soluciona les curses asíncrones. Evita que un esborrany fallit antic esborre el treball recent. Afig la versió monotònica de l'operació.
3. **Publicació al Mur:** Resol el desdoblament fent que l'autosave al mur siga atòmic i idempotent (id estable).
4. **Targetes UI i Universal Workspace:** Injecta els estats correctament (loading/error/empty) en compte d'al·lucinar el "No hi ha notes". Afig el Títol Dinàmic i la fletxa replegable opcional.

### Nous Requeriments del Mestre (Disseny UI):
- **No-editabilitat de les columnes:** La columna esquerra de `Wiki de Poble` i `Notes` NO ha de ser editable per ara.
- **Icona d'ordenació:** Tot i no ser editable, a la columna central de documents, just al costat del botó "CREAR NOTA", afig un icona de filtre/ordenació (data, nom) per poder organitzar el llistat en un futur.
- **Respiració dels botons (Padding):** Els botons "CREAR NOTA" estan massa apegats a la vora. Dóna'ls un marge de respiració generós pels costats (mínim 20px, a l'estil Apple).
- **Unificació del botó "TOT":** L'element "Tot" de la columna esquerra a `Notes` es veu diferent de com es veu a `Disseny`. Unifica'ls perquè tinguen exactament el mateix aspecte.

### Criteris d’acceptació i reproducció
- Tots els canvis a `src/` completats i funcionals, resolent les incidències de l'auditoria original.
- L'UI de Notes rep els canvis d'alineació i padding.

## Riscos
- Les alteracions al GlobalSaveManager poden afectar altres seccions que fan us de l'autosave. Assegura't de que siga robust.

## Protocol de la Reunió a l’Olivera

En acabar, HAS DE COMPLIR:
1. **Destinació:** Desa la teua implementació/informe a `_wiki_de_poble/04_escriptori/`.
2. **Taxonomia:** Nom exacte `AAMMDD_HHMM_auditoria_codex.md` (o `informe_implementacio`).
3. **Olivera:** Deixa-ho damunt la taula i interactua amb el que hi ha. Si veus coses de Claude, no dubtes a criticar de forma tècnica si cal.

## Vincles
- [[00_index]]
- [[00_index_escriptori]]
- [[260923_1245_pla_implementacio_auditoria]]
