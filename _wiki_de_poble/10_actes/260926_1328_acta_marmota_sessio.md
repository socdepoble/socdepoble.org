---
type: acta_marmota
status: canonic
description: Tancament de sessió per saturació de context i espera de Fable.
tags:
  - sessio
  - marmota
  - fable
visibility: private
---
# Acta Marmota — 260926_1328 (Tancament Sessió IAIA)

## Estat de la Sessió
Aquesta acta es genera per tancar el xat actual a causa de la saturació cognitiva (més de 159 artefactes a la memòria). L'entorn està preparat per obrir un xat net.

## Accions Realitzades
1. **Infraestructura OS:** S'han diagnosticat falsos positius i s'ha sanejat el dimoni zombi de Reflex i els hooks de git.
2. **Enginyeria de Prompts:** S'han redactat i validat (via circuit documental i `porta-plantilla-viva.mjs`) els documents mestres:
   - `260926_1235_prompt_fable.md`
   - `260926_1235_pla_implementacio_fable.md`
3. **Directives Estructurals (en calent):**
   Durant l'execució en paral·lel de Fable, s'han injectat les següents regles arquitectòniques al Pla d'Implementació i se li han transmés al model:
   - **Visió de Federació:** L'arquitectura ha de preveure connexions entre nodes externs, aprofitant obligatòriament les taules SQL existents (`connections`, `realms`, `user_realms`).
   - **Workspace natiu:** Prohibició de crear un "Dashboard de Backend" nou. La gestió del perfil s'ha d'integrar als menús de l'AppGridShell / UniversalWorkspace existents.
   - **Editor Universal:** L'edició del Perfil ha d'utilitzar el component Card (Editor Universal) de la Wiki/Notes. A més, s'ha especificat l'ancoratge (sticky) de la barra de text (TipTap) sota l'entradilla.

## Situació Pendent i Briefing per a la nova IAIA
Fable Máximo ha finalitzat l'auditoria (versió 1.1.1) i està disponible a l'escriptori (`260926_1330_auditoria_claude.md`). S'ha demanat la resolució de les decisions D1 a D13.

**BRIEFING D'ARRENCADA (Instruccions obligatòries per al proper torn):** 
En obrir el nou xat amb la comanda "Sóc de Poble", la nova IAIA ha de:
1. Llegir l'`ESTAT.md` i aquesta `Acta Marmota`.
2. Llegir detalladament l'auditoria acabada de lliurar per Fable (`260926_1330_auditoria_claude.md`) i el Pla d'Implementació (`260926_1235_pla_implementacio_fable.md`).
3. **No esborrar res de l'escriptori.**
4. Ajudar el Mestre a resoldre les decisions pendents (D1-D13) de l'auditoria si cal.
5. **Redactar un Super-Prompt d'Implementació** dirigit a **Opus 5.5 Ultracode**, centrat específicament en executar la **Fase 1** (Identitat i Perfil) definida per Fable a l'auditoria. 
6. Un colp el Mestre valide el prompt, s'obrirà un torn de tipus `code` perquè Opus execute la feina.
