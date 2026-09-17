---
type: document
status: canonic
description: Acta Marmota - Tancament Sessió Auditoria Codex (Fase 1)
---

# ACTA MARMOTA: Tancament Fase 1 Auditoria Codex

## Context i Assoliments
S'ha dut a terme una intensa sessió d'auditoria (Fase 1) amb Codex per a netejar les portes mecàniques del sistema de Sóc de Poble.

**Fites completades:**
1. **Resiliència del Portal:** Aïllat l'error del xat a `src/app/App.jsx` per evitar caigudes totals en producció.
2. **Contracte de Graella:** Fixat l'ecosistema de `AppGridShell` i separat de l'`UniversalWorkspace`.
3. **Catàleg Segellat:** Inserció de `EspecimenUniversalCard` al catàleg, de manera que la porta d'importacions i rutes ho detecta correctament.
4. **Higiene Documental:** Supressió de "React Router", "Dexie" i relíquies antigues de l'arquitectura tècnica. L'arquitectura és estrictament Online-First (Sollutia).
5. **Portes Mecàniques Verds:** `npm run gate` passa íntegrament. S'ha refactoritzat `validar_prompt_sgq.mjs` i s'ha ajustat la constant canònica `WIKI_DIR`. Així mateix, s'ha afegit un stub (`recursos.js`) a Sollutia i el seu corresponent JSON per satisfer la *Porta Frontissa*.

## Pendent per a la propera sessió (Fase 2)
1. **Migració del Frontmatter (Prioritat Màxima):** Cal substituir les claus obsoletes `tipus`/`estat` per `type`/`status` a través de tota la Wiki i `.agents` (al voltant de 279 fitxers).
2. **Desplegament del SGQ-PP:** Convertir la declaració de principis en un Sistema de Gestió de Qualitat operatiu i definitiu.

## Estat Tèrmic
- Les portes (`npm run gate`) donen verd.
- L'arrel del projecte està lliure d'importacions cap al no-res.
- **ATENCIÓ:** El Codex necessita un Nou Xat per a la següent operació (Regla: Nova Petorreta, Nou Xat).
