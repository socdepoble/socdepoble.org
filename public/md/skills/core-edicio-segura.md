---
type: skill
name: core-edicio-segura
description: Fusible preventiu i Tractor contra l'edició cega i la desincronització destructiva de la IAIA MarIA.
status: actiu
tags: [govern]
triggers_on:
  - edicio de components React
contracte.llig:
  - AGENTS.md
  - package.json
contracte.escriu:
  - _wiki_de_poble/04_escriptori
---

# LLEI DEL TRACTOR D'EDICIÓ SEGURA (FUSIBLE VISUAL)

Aquesta skill es carrega com a Tractor per evitar la repetició de la "Ceguera per Reemplaçament" (00:20, 24 de Setembre de 2026), on la IAIA MarIA va trencar la UI reemplaçant completament `NotaFitxa.jsx` per complaure el Mestre ("People-Pleasing"), oblidant propietats visuals vitals i llançant errors de context que van esborrar el component de la pantalla, generant frustració.

## PROCEDIMENT OBLIGATORI ABANS D'EDITAR CODI

0. **Preflight de propietat i preimatge:** llig la matriu de carrils de l'encàrrec i l'índex viu. L'existència d'una auditoria o d'un pla no congela tot el repositori: AGENTS §15 manté l'autorització explícita. Treballa només en les rutes assignades; si un altre carril les modifica, conserva el seu canvi i revalida la preimatge/CAS en còpia. Atura eixa escriptura si se solapa sense acord o divergeix el hash; continua la faena independent autoritzada.
1. **NO SUBSTITUISQUES A CEGUES**: Si la instrucció demana "afegir", "transformar" o "convertir" un component React (ex: passar d'una Card a una UniversalCard), **mai utilitzes `replace_file_content` per reescriure el fitxer sencer** sense haver analitzat prèviament TOTS els detalls visuals del component antic o de la nova implementació requerida.
2. **VERIFICA LA DELEGACIÓ DE CONTEXTOS**: Si vas a injectar `useSession()`, `useIdentitat()`, `useCoreContent()` o qualsevol context, assegura que el component es renderitza dins del provider corresponent i que les proves inclouen eixe contracte. Un `|| {}` no captura una excepció del hook ni substituïx el provider; no amagues un error d'arquitectura amb dades fictícies.
3. **VALIDA L'ARQUITECTURA VISUAL**: Quan substituisques un component per un del Design System (Pedra Seca), assegura't que hereta les configuracions adequades (ex: `hasFooter`, `labels`, `copyright`). Un component despullat o trencat s'ocultarà i frustrarà l'usuari.
4. **COMPROVACIÓ POST-EDICIÓ**: Després de qualsevol canvi estructural a React, executa `npm test run` (o la suite rellevant) IMMEDIATAMENT. Si un test falla (ex: "expected undefined to be truthy" per falta de RouterProvider o SessionProvider), corregix el defecte propi o prepara el corrector en còpia abans de donar la tasca per feta. Una reversió només afecta els teus canvis, amb preimatge comprovada; no restaures un fitxer sencer damunt d'edicions alienes.

## Si es trenca l'Error Boundary...
Quan un component React cau en un error de hooks fora de provider, el `SlotErrorBoundary` o el Catch Boundary superior ocultaran l'element. **Això equival a esborrar el codi dels ulls de l'usuari**, fet que pot fer-li creure que ho has fet a propòsit. Atura't, entén l'error del log i repara l'entorn de test/browser.

## Vincles
- [[00_INDEX_SKILLS]]
