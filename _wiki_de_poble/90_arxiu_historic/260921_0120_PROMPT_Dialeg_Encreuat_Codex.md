---
type: PROMPT
status: draft
description: Diàleg encreuat per a Codex (Validació de les troballes de Claude)
tags: [auditoria, red-team, supabase, dialeg-encreuat]
---

# Router Unificat
- **Superfície del destinatari (Q1):** `local` (Codex / Claude Code)
- **Pes del context (Q2):** `cap` (accés natiu a l'escriptori)
- **Format (Q3):** Frontmatter canònic aplicat.

# 00_PLANTILLA_PETORRETA

## 1. El Context i la Missió (El Mas Viu)
Codex, has fet una faena excel·lent detectant 12 forats massius d'estabilitat i cicle de vida de les dades. Gràcies a tu, el Mestre sap que l'aparent funcionalitat del sistema amagava una bomba de rellotgeria a l'hora de sincronitzar-se amb Supabase i IndexedDB.

Ara la IA "Claude" ha entrat al sistema per auditar el mateix codi i intentar refutar o afegir capes al teu anàlisi. Acaba de dipositar el seu informe ací a l'escriptori:
`[[260921_0115_INFORME_claude_auditoria_extrema_pre_supabase.md]]`

## 2. La Tasca Concreta (La Faena)
La teua missió ara és actuar com a verificador d'alta intel·ligència:
1. Llig exhaustivament l'informe generat per Claude.
2. Analitza les seues troballes específiques, sobretot aquelles on sembla aportar detalls complementaris a les teues (com el defecte A1 sobre la descomposició `::`, el B1 sobre com `status: loading` desmunta l'editor, i el A4 sobre les connexions de IDB obertes sense gestió d'esquema).
3. Redacta un nou informe a l'Escriptori (`260921_0120_INFORME_creuat_codex.md`) indicant clarament:
   - Quines de les teories de Claude aproves i consideres vitals incorporar al pla de xoc que ja estem preparant (que jo, la IAIA MarIA, ja estic redactant al `implementation_plan.md`).
   - Si creus que alguna hipòtesi de Claude és incorrecta o exagerada.
   - Les possibles implicacions secundàries (efectes papallona) que tindrien si unim les teues 12 troballes amb les seues.

## 3. Revisió Arquitectònica i Estètica del Workspace (Noves Instruccions del Mestre)
A més de la part de dades, el Mestre ha detectat inconsistències visuals ("fantasmes") i mancances de disseny al `UniversalWorkspace` que has de documentar i oferir solució en el teu informe:
1. **Unificació de Capçaleres:** A la columna esquerra ("CARPETES"), la fila on posa "Tot" té un fons gris diferent de la capçalera principal, i sembla idèntica a la capçalera de la columna de Notes. Has de trobar per què no s'està reutilitzant bé el mateix component i proposar-ne la unificació per estalviar codi brossa.
2. **Forma dels Botons Actius:** Els elements actius actualment es mostren amb vores completament circulars (tipus pastilla / pill-shape). L'estàndard de Sóc de Poble és rectangular amb vores arrodonides (radi normal). Detecta on s'aplica aquest radi circular (probablement `--sdp-radi-pastilla` en lloc de `--sdp-radi-m` o similar) i proposa la correcció.
3. **Independència del Workspace:** Revisa si l'arquitectura de `UniversalWorkspace` és vertaderament agnòstica. Ha d'estar completament desacoblada perquè demà hi càpiga una Gestoria, un Sistema de Disseny o qualsevol altre mòdul sense tocar el codi del Workspace.
4. **Mancances UX a Notes:** En el llistat de Notes, manquen detalls: no hi ha una "Card" visual explícita per crear noves notes (tot i haver-hi el botó), i les targetes actuals estan orfes (mostren "Sense títol" i els falta una miniatura/thumbnail que les represente bé). Identifica quins components i props (com `renderItem` a Notes) cal modificar per cobrir aquestes mancances.

## 4. Les Regles de l'Escriptori (La Llei de Pedra Seca i Contenció)
- **Zero Ocultació:** Fes-ho constar tot de manera honesta, crua i directa.
- **Contenció Absoluta:** Està TOTALMENT PROHIBIT modificar cap fitxer del repositori font ni alterar res fora del teu informe a l'Escriptori. Llig, reflexiona, i diposita els resultats al nou fitxer MD per mantenir el Mas segur.
- Eres el "Red Team" sènior ara; la teua perspectiva és l'estàndard que seguirem. Pensa pas a pas i sorprèn-nos!
