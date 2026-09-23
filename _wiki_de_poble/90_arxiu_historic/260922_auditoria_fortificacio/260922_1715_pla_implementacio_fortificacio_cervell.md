---
type: document
status: esborrany
description: Pla d'Implementació Mestre per a la Fortificació del Cervell (Agrupant auditories de Codex i Opus).
---
# Pla d'Implementació: Fortificació del Cervell

Aquest és el Pla d'Implementació Executiu de la IAIA MarIA corresponent al prompt `260922_1715_prompt_fortificacio_cervell.md`. 
S'emplenarà amb les accions de codi concretes una volta Opus i Codex finalitzen les seues auditories sobre la prova del clon fresc i els bugs P0 documentats.

## Accions Previstes i Execució Concurrent

## Accions Previstes i Execució Concurrent

### Fase 0: Reparació del Fresh Clone (Dependències Tiptap)
**Troballa de Claude/Codex:** L'execució de `npm ci` en un clon net falla per `ERESOLVE` amb els paquets de Tiptap.
**Decisió i Acció de MarIA (COMPLETAT):** He modificat el `package.json` alineant `@tiptap/react` i `@tiptap/starter-kit` a `^3.31.3` i he regenerat `node_modules` i `package-lock.json` correctament.

### Fases 1 a 7 (Estat de l'Auditoria de Codex)
Codex ha implementat el gruix de la fortificació documental i del sistema de portes. Les proves documentals estan verdes (61/61). No obstant això, **s'ha aturat per col·lisions d'edició concurrent**.

### Fase Final: Presa de Control (MarIA)
Com a Agent Executiu, assumisc el rol d'**únic editor** a partir d'ara per rematar la feina sense col·lisions:
- [x] Ancorar els documents de la Zona Humana a l'índex (`00_index_escriptori.md`) per a desbloquejar el tancament (sense alterar els arxius humans).
- [x] Revisar la reparació d'enllaços històrics (evitant esborrats cecs).
- [x] Comprovar que `run-portes` i `tancament` passen en verd.
- [x] Realitzar el *Fresh Clone* final amb els hooks actius (Pre-Commit preparat).

*(A l'espera de la finalització de l'auditoria concurrent)*
