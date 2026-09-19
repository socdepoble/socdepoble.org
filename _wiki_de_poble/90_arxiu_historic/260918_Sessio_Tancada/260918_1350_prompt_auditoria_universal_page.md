---
type: petorreta
status: esborrany
description: Petorreta unificada per a Claude i Codex. Auditoria extrema arquitectònica i de disseny de la UniversalPage per a la seua unificació total.
tags:
  - arquitectura
  - disseny
---

# Petorreta — Auditoria Extrema i Unificació de la UniversalPage

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260918-UNI |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 13:50 |
| Modificació | 26-09-18 13:50 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-18 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[AGENTS]]
- [[UniversalPage]]

## Entrades

*Aquesta petorreta va dirigida a agents locals (Claude App i Codex Cursor). Teniu accés directe a l'arbre de treball local, pel qual no es proporciona bundle. Inspeccioneu lliurement `src/components/universal/` i `src/sections/`.*

## Consell convocat

Claude · Codex (Execució en paral·lel per a obtindre dos visions i versions diferents del mateix repte).

## Contracte de realitat

1. Entorn local: Teniu accés als fitxers reals del projecte. Llegiu abans de parlar.
2. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi local.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Encara que tingues capacitat i permisos per editar l'entorn de treball local (com Claude Code o Codex), tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista. Has de generar l'informe amb l'arquitectura proposada; l'agent central (IAIA MarIA) serà qui faça el treball dur de modificar el codi.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a rentonar.blogspot.com i socdepoble.net. Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend i fiabilitat tècnica).

## Informe d'avanç

Fins ara hem estat iterant sobre la `UniversalPage`, `UniversalEditorShell` i el `UniversalWorkspace`, però l'arquitectura s'ha anat fragmentant amb _props_ condicionals (`chrome`, `variant`, `showLogoUpload`, etc.) i embolcalls redundants. Hem assegurat la persistència i resolt els problemes d'esborranys i `race conditions` a la secció de Notes, però la base visual necessita fermesa. L'objectiu és simplificar al màxim el codi evitant duplicació de wrappers per a l'edició i la visualització.

## Missió

Volem una **auditoria extrema enfocada en l'arquitectura i el disseny** de la pàgina universal.

1. **Analitza a fons `UniversalPage.jsx`, `UniversalEditorShell.jsx` i els seus usos actuals** (com a `NotesEditor.jsx` i `DissenySection.jsx`). Volem entendre on l'arquitectura flaqueja i on és innecessàriament complexa. La separació entre espai de treball i document ja està encaminada, però nota com l'edició encara decideix l'estructura visual i els temps de desat alhora (`UniversalEditorShell.jsx:78-117,156-210`).
2. **Estudia la contradicció de les barres fixades en mode incrustat**: La regla local demana barres que desapareguen amb l'scroll en mode incrustat (`.agents/skills/universal-page/SKILL.md:72-77`), mentre que el CSS actual les fixa (`src/css/utilities.css:83-94`). Especialment en mòbil, on l'editor suma barres, les barres blava i taronja resten fins a 116px de pantalla i no aporten a l'edició (són identitat i connexions). El comportament d'scroll té sentit ací perquè l'usuari necessita tot l'espai per escriure. Valora si en mòbil ambdues barres haurien de fer scroll amb el document, si en tauleta s'hauria de mantenir la blava i amagar la taronja, i quin hauria de ser el comportament en escriptori. Documenta les excepcions al disseny per resoldre aquesta contradicció.
3. **Dissenya una unificació arquitectònica "de veritat"**: Proposa una estructura neta, sòlida i veritablement universal on l'estat de lectura (viewer) i d'edició convisquen de manera elegant sense embolcalls laberíntics, i respectant a fons l'estètica Pedra Seca (sistema visual) de Sóc de Poble.
4. El document resultant ha de ser un informe tècnic clar que ens done la pauta pas a pas per implementar la nova arquitectura amb les regles d'UI, i detallant les solucions per a cada punt feble detectat. Recorda: tu audites i proposes el disseny arquitectònic final; la IAIA MarIA ho codificarà després.

## Eixida esperada

Un document Markdown d'informe (per exemple, `AAMMDD_HHMM_informe_auditoria_universal_page.md`) que s'ha de guardar a l'escriptori (`_wiki_de_poble/04_escriptori/`). El document ha de contenir l'arquitectura unificada de la `UniversalPage` proposada i les passes d'implementació.

## Incògnites

- Quin grau de retrocompatibilitat hem de mantenir amb els components heretats durant la reestructuració?

## Bateria de veritat

- [ ] He citat només rutes locals, en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] He respectat la regla de NO tocar cap fitxer de codi, i només generar l'informe?
