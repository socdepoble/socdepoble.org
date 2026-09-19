---
type: petorreta
status: actiu
description: Auditoria Atòmica i Reparació de l'Error d'Enrutament Crític
tags:
  - temporal
---

# Petorreta — Auditoria Atòmica i Reparació (Fase 0 - CLAUDE)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-20260917-CLAUDE |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-17 04:35 |
| Modificació | 2026-09-17 04:35 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 2026-09-17 |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]

## Entrades

- Accés directe de lectura a l'espai de treball `/Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org` (Vía Projectes de Claude).

## Consell convocat

Claude (Sonnet 3.5 / 5) amb **esforç MÀXIM**.

## Contracte de realitat

1. Entorn tancat. L'única font de veritat és l'espai de treball al que tens accés.
2. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-QWEN (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi aportat al teu entorn.
5. **PROHIBICIÓ DE MODIFICACIÓ:** Tens accés de lectura i escriptura al repositori, però TENS TOTALMENT PROHIBIT crear, editar o esborrar cap fitxer. La teua tasca és NOMÉS de lectura. Has d'entregar l'informe generant-lo únicament ací mateix, en el xat.

## Informe d'avanç

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [socdepoble.blogspot.com](http://socdepoble.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble.

El sistema Sóc de Poble pateix actualment d'amnèsia cognitiva acumulada per intervencions anteriors. Abans de dissenyar el nou Bloc de Notes, necessitem netejar l'arquitectura. Tenim un error crític d'enrutament on qualsevol URL (com `/jo/disseny` o `/jo/skills`) renderitza el component de Xat en comptes del seu propi.

**[ATENCIÓ: NO DISSENYES EL BLOC DE NOTES]**: L'arquitectura teòrica del futur Bloc de Notes ja ha estat dissenyada per un altre agent del Consell en una sessió paral·lela. No gastes ni un sol token en pensar com fer el bloc de notes. La teua missió ara mateix és *exclusivament* fer l'auditoria forense per trobar el codi mort i diagnosticar el bug crític d'enrutament.

## Situació i dades opaques

Desconeixem si l'error està a `src/app/App.jsx`, a `AppGridShell.jsx` o en la gestió d'estat a `IdentitatContext` / `UIState`. Desconeixem la quantitat exacta de codi fantasma i components orfes existents a `src/components/PedraSeca/`.

## Missió

1. Revisa profundament l'enrutament (`src/app/App.jsx`, `src/components/layout/AppGridShell.jsx`, `src/config/sections.js`). Troba la fallada sistèmica i explica per què sempre es mostra el Xat.
2. Revisa `src/components/PedraSeca/` i les vistes. Llista de forma precisa els components obsolets, duplicats o construïts matusserament que hem d'esborrar.
3. Fes una auditoria d'escalabilitat: El model actual de rutes és sostenible per allotjar un "Bloc de Notes Universal" a 3 columnes pròximament?

## Eixida esperada

Genera un **"Informe de Poda Extrema"** estructurat en Markdown amb llistes exactes (ruta i acció) del codi a purgar i del codi a reparar.

## Incògnites

- Les dependències i crides asíncrones exactes de Sollutia (backend) que podrien estar fallant i forçant redirects.

## Bateria de veritat

- [ ] He citat només rutes reals en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
