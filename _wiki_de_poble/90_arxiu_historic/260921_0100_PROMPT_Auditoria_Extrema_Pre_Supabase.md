---
type: PROMPT
status: draft
description: Auditoria extrema pre-Supabase per a Codex i Claude
tags: [auditoria, red-team, supabase]
---

# Router Unificat
- **Superfície del destinatari (Q1):** `local` (Claude Code / Codex)
- **Pes del context (Q2):** `cap` (no cal bundle perquè tenen accés local)
- **Format (Q3):** Frontmatter canònic aplicat.

# 00_PLANTILLA_PETORRETA

## 1. El Context i la Missió (El Mas Viu)
Bones companyes (Codex i Claude). Hem acabat d'implementar i fixar la infraestructura base del nostre Mas. Hem aplicat el pedaç de solucions sistèmiques que vau redactar:
- S'ha implementat el Gestor d'esborranys basat en IndexedDB per protegir la feina en cas d'error de xarxa (GlobalSaveManager).
- S'han assecat i fixat les rutes de Vite (arrel.mjs, tractor-manifest.mjs).
- S'ha reparat el Verificador SCC perquè escanege els orfes reals i faça fail-closed si no troba els índexs canònics (i ara funciona perfetament passant de 113 orfes falsos a 13 reals).
- També s'han estabilitzat els linters (que intentaven processar brossa i dependències en compte d'arxius natius).

La infraestructura bàsica ara és robusta, però abans de fer l'assalt final cap a la **Migració a Supabase** (que encara no s'ha iniciat), necessite que feu una **auditoria extrema i descarnada (Red Team)** de l'estat actual del repositori, centrant-vos en la resiliència del codi implementat i la preparació per a la fase de dades.

## 2. El Deure (Què has de fer?)
1. **Audita el codi implementat:** Revisa com s'han consolidat els fitxers `src/sections/notes/GlobalSaveManager.js`, `tooling/gates/verificador-scc.mjs`, `tooling/lib/arrel.mjs` i el funcionament de `eslint.config.js`. Hi ha cap fuita de memòria, condició de carrera o forat de seguretat en IndexedDB? Estan les rutes efectivament a prova de bales?
2. **Avalua l'arquitectura per a Supabase:** Teniu via lliure per examinar les propostes de migració i indicar-me si el sistema (UniversalWorkspace, GlobalSaveManager, etc.) aguantarà el pes d'un canvi a backend o si, per contra, hi ha algun patró que s'ensordirà quan el retarde de la xarxa augmente.
3. **Restricció de Contenció:** No modifiqueu cap fitxer. No feu crides a la xarxa externa. Vull exclusivament un informe de diagnòstic pur i dur, escrit al vostre escriptori, on destrosseu qualsevol feblesa del sistema.

## 3. Limitacions Tècniques (Pedra Seca)
Recordeu les lleis del Mas:
- Només fitxers natius i codi pragmàtic. 
- Contenció absoluta (accés només local). 
- Mantingueu la filosofia de desenvolupament rústic: preferim l'estabilitat i la llegibilitat abans que l'optimització prematura.

Desplegueu les eines de cerca, comproveu les estructures i entregueu-me la veritat nua i crua sobre el que hem construït. La iaia vos escolta.
