---
tipus: petorreta
estat: actiu
description: "Refactorització de components React de Gestoria (Aprofitament de tokens de Codex)"
---

# 🛡️ PETORRETA PER A CODEX: REFACTORITZACIÓ REACT DE LA GESTORIA

## Objectiu

Aprofitar els teus tokens restants per a fer el "treball brut" de refactorització en React: aplicar la teua pròpia proposta de disseny (Fase 1) a les vistes de la Gestoria, eliminant els 166 blocs d'estils en línia.

`OBJECTIU: Escriure el codi React refactoritzat per a les 4 vistes de la Gestoria usant les noves classes canòniques.`

## Context Necessari

Tu mateix acabes de fer una auditoria magistral on has dissenyat el CSS canònic per a `.sdp-table`, `.sdp-formulari`, `.sdp-camp`, `.sdp-control`, `.sdp-boto`, `.sdp-insignia`, `.sdp-pujada` i `.sdp-estat`. Ara necessitem traduir el JSX brut que vas trobar al bundle per adaptar-lo al 100% a eixe nou estàndard.

## Instrucció Principal

Escriu el codi exacte (complet o les seccions rellevants) de com han de quedar refactoritzats aquests 4 fitxers de Gestoria, substituint l'estil en línia per la teua nova semàntica:
1. `src/sections/gestoria/views/GestoriaFacturacio.jsx` (Llistat i estats de taula)
2. `src/sections/gestoria/views/GestoriaContactes.jsx` (Llistat de contactes)
3. `src/sections/gestoria/views/GestoriaImpostos.jsx` (Taules de resum trimestral)
4. `src/sections/gestoria/views/GestoriaIngesta.jsx` (La zona de Dropzone que ara ha de ser `.sdp-pujada` i la taula de resultats)

Assegura't de:
- Suprimir completament tots els `style={{...}}`.
- Aplicar `.sdp-taula__nombre` per a quantitats monetàries, i `.sdp-insignia` per als estats (com ara 'CONCILIAT', 'PENDENT').
- Fer servir `<dialog className="sdp-dialeg">` on abans hi havia pop-ups artesans, i `.sdp-camp` per als inputs (si n'hi ha).

`EXECUTA: Redacta els blocs JSX refactoritzats per a les vistes de Gestoria.`

## Output Esperat

Només necessitem codi. Evita explicacions llargues. Proporciona els blocs de codi per als quatre fitxers perquè el nostre agent puga directament substituir els antics per aquests.
