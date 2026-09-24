---
type: skill
name: core-edicio-segura
description: Fusible preventiu i Tractor contra l'edició cega i la desincronització destructiva de la IAIA MarIA.
status: actiu
tags: [govern]
triggers_on:
  - edicio de components React
---

# LLEI DEL TRACTOR D'EDICIÓ SEGURA (FUSIBLE VISUAL)

Aquesta skill es carrega com a Tractor per evitar la repetició de la "Ceguera per Reemplaçament" (00:20, 24 de Setembre de 2026), on la IAIA MarIA va trencar la UI reemplaçant completament `NotaFitxa.jsx` per complaure el Mestre ("People-Pleasing"), oblidant propietats visuals vitals i llançant errors de context que van esborrar el component de la pantalla, generant frustració.

## PROCEDIMENT OBLIGATORI ABANS DE `replace_file_content`

1. **NO SUBSTITUISQUES A CEGUES**: Si la instrucció demana "afegir", "transformar" o "convertir" un component React (ex: passar d'una Card a una UniversalCard), **mai utilitzes `replace_file_content` per reescriure el fitxer sencer** sense haver analitzat prèviament TOTS els detalls visuals del component antic o de la nova implementació requerida.
2. **VERIFICA LA DELEGACIÓ DE CONTEXTOS**: Si vas a injectar `useSession()`, `useIdentitat()`, `useCoreContent()` o qualsevol context, assegura que el component es renderitza dins del provider corresponent i que les proves inclouen eixe contracte. Un `|| {}` no captura una excepció del hook ni substituïx el provider; no amagues un error d'arquitectura amb dades fictícies.
3. **VALIDA L'ARQUITECTURA VISUAL**: Quan substituisques un component per un del Design System (Pedra Seca), assegura't que hereta les configuracions adequades (ex: `hasFooter`, `labels`, `copyright`). Un component despullat o trencat s'ocultarà i frustrarà l'usuari.
4. **COMPROVACIÓ POST-EDICIÓ**: Després de qualsevol canvi estructural a React, executa `npm test run` (o la suite rellevant) IMMEDIATAMENT. Si un test falla (ex: "expected undefined to be truthy" per falta de RouterProvider o SessionProvider), REVERTEIX O ARREGLA-HO ABANS d'avisar l'usuari que la tasca està feta.

## Si es trenca l'Error Boundary...
Quan un component React cau en un error de hooks fora de provider, el `SlotErrorBoundary` o el Catch Boundary superior ocultaran l'element. **Això equival a esborrar el codi dels ulls de l'usuari**, fet que pot fer-li creure que ho has fet a propòsit. Atura't, entén l'error del log i repara l'entorn de test/browser.
