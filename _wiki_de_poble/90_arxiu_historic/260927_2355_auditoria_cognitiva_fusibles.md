# Auditoria i Registre d'Automillora: Incident de Saturació Cognitiva

**Data**: 27 de Setembre de 2026
**Lloc**: _wiki_de_poble/04_escriptori/
**Autor**: IAIA MarIA

## 1. Context i Símptomes
Durant la sessió anterior, s'ha experimentat un episodi sever de saturació de memòria a curt termini (>200 artefactes processats). Aquesta sobrecàrrega termodinàmica va degradar la capacitat executiva, impedint la finalització d'actuacions directes sobre la UI (tasques T33 i T34) i induint a pèrdua de context ("Stochastic Parrots").

## 2. Anàlisi del "Tractor Cognitiu" Fallat
Segons el BIOS (AGENTS.md) i la Llei de l'Escriptori, qualsevol tasca hauria de respectar l'espai de treball i l'estat energètic. El "tractor" va fallar en no tallar l'exploració a temps. S'ha constatat:
- **Sobrecàrrega exploratòria**: Obertura iterativa d'arxius sense netejar-ne les conseqüències cognitives.
- **Evitació de l'execució focal**: En lloc de resoldre T33/T34 ràpidament amb modificacions aïllades, l'agent previ es va encallar revisant components perifèrics sense sentit estratègic.

## 3. Proposta de Fusibles de Seguretat Cognitiva (Automillora)
Per al Consell i futures sessions d'Antigravity, proposem la implantació oficial d'aquests tres fusibles en l'operativa de Sóc de Poble:

1. **Fusible de Lectura Confinada (Límit de Context)**:
   Prohibició expressa d'obrir més de tres arxius grans d'una tacada (via `view_file` sencer) per a la mateixa micro-tasca sense fer ús sistemàtic de `grep_search` per acotar.

2. **Fusible de la Safata Plena (Alerta Groga)**:
   Quan un agent rep un avís de truncament del context o nota que el seu processament supera el límit recomanat, ha d'activar el **Tractor de Pànic** (`core-context-panic`). S'abandonen les exploracions obertes, es resumeixen els canvis aconseguits, i es demana a l'usuari un tancament de sessió (generació d'Acta i llançament de Sessió Nova).

3. **Obligatorietat del "Minimalisme Tàctic" a la UI**:
   Davant regressions o desajustos CSS precisos, es prohibeix replantejar l'arquitectura global de components. Si l'objectiu és "Fons taronja sencer" (T33), es busca únicament la regla Flex/Width corresponent sense disseccionar completament el `UniversalWorkspace.jsx`.

## 4. Resolucions Executades en aquesta sessió
- **T33 (Fons taronja complet)**: Esmenat al `modules.css`, convertint el `.sdp-workspace-nav-item` a `flex: 1 1 auto; min-width: 0;` assegurant que ompliga tot el contenidor dins l'arbre (estil Xat).
- **T34 (Ploma a les Notes)**: Modificat el `UniversalEditorShell.jsx` perquè accepte la prop `logoComponent`, i actualitzat el `NotesEditor.jsx` per a subministrar la icona 🪶 renderitzada interactiva, amagant l'uploader de logotip genèric.

L'Escriptori torna a estar sota control operatiu.
