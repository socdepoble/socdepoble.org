---
type: prompt
status: canonic
description: Instruccions per a Codex per a implementar les correccions crítiques de les auditories de Claude i Codex.
tags:
  - disseny
---

# Petorreta — Implementació Resolucions Auditoria Extrema

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260918-IMPL |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 04:35 |
| Modificació | 26-09-18 04:35 |
| Agent redactor | IAIA MarIA (Fable 5.1) |
| Propietari | Consell de la Petorreta |
| Aprovació humana | pendent |
| Revisió pendent | no |

## Vincles

- [[00_index_escriptori]]
- [[260918_0243_informe_auditoria_extrema_postmigracio]] (Informe Codex)
- [[260918_0300_informe_auditoria_extrema_postmigracio_claude]] (Informe Claude)

## Entrades

- Cap bundle massiu. Els arxius s'han d'explorar localment.

## Consell convocat

ChatGPT Codex

## Contracte de realitat

1. Tens permís total per a proposar i realitzar les modificacions de codi. No estàs limitat només a auditar. Necessitem l'**execució de la implementació**.
2. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**.
3. **PROTOCOL ANTI-CERCA**: Tens estrictament prohibit activar cap eina de cerca web.

## Informe d'avanç

Fable i Claude han acabat les seues auditories. Ara tenim dos informes a l'escriptori (`260918_0243_informe_auditoria_extrema_postmigracio.md` i `260918_0300_informe_auditoria_extrema_postmigracio_claude.md`) que revelen errors crítics en la migració de Pedra Seca i la UniversalWorkspace.

## Missió

Llig els dos informes esmentats i **implementa** les següents correccions prioritàries:

1. **C-01 / A-1 (Claude issue 1)**: Corregeix les 31 rutes d'importació trencades als 26 espècimens dins de `src/sections/disseny/cataleg/detalls/*.jsx`. Ara mateix usen 6 nivells de pujada (`../../../../../../`) i només n'han de ser 4 per trobar `src/components/...`.
2. **C-02**: Afegeix l'estat local absent a `EspecimenAlerta.jsx` (`visible`, `setVisible`) i `EspecimenDialeg.jsx` (`modal`, `setModal`).
3. **Build Trencat (Claude issue 2)**: Elimina les referències a l'arxiu esborrat `tooling/gates/build-seo-manifest.mjs` dins de `package.json` i `tooling/gates/run-portes.mjs`.
4. **Portes Trencades (Claude issue 4)**: Fes que `tractor-cataleg.mjs` deixe de buscar els arxius esborrats `Pagina*.jsx` i `DesignSectionContent.jsx`.
5. **Rendiment (Claude A-1 i A-2)**: Optimitza `UniversalWorkspace.jsx:43-46` (evitant el `|| []` en cada render fent servir una constant congelada `CAP`) i afegeix memòria/bail-out al reductor de `workspaceState.js`.

## Eixida esperada

Has de proporcionar les instruccions exactes o procedir amb la modificació dels fitxers locals per deixar la branca compilant i el catàleg renderitzant correctament.
Després actualitza `00_index_escriptori.md` amb els teus resultats.

## Bateria de veritat

- [ ] Cap nom de fitxer inventat?
- [ ] Has respectat la regla anti-cerca?
