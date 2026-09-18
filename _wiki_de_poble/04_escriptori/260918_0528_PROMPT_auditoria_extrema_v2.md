---
type: petorreta
status: esborrany
description: Auditoria extrema post-reparacions per a Codex amb petició de qualificació (nota).
tags:
  - auditoria
  - qualitat
---

# Petorreta — Auditoria Extrema Post-Reparacions (Codex)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260918-0528 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 05:28 |
| Modificació | 26-09-18 05:28 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260918_0509_informe_auditoria_extrema_postimplementacio]]

## Entrades

- Cap bundle adjunt. Aquesta petorreta és exclusiva per a **Codex** (Agent Local), que té accés directe a l'entorn de treball i als fitxers.

## Consell convocat

ChatGPT Codex

## Contracte de realitat

1. Entorn tancat.
2. Com a agent local tens accés a l'estat actual del codi a l'IDE. Ets la nostra font de veritat.
3. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
4. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
5. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi aportat al bundle o pel propi agent.
6. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Encara que tingues capacitat i permisos per editar l'entorn de treball local (com Claude Code o Codex), tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista. Has de generar l'informe amb els defectes trobats.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a rentonar.blogspot.com i socdepoble.net. Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

S'han reparat els punts crítics (Nivell C) i de rendiment (Nivell A) que varen fer fracassar l'última auditoria de segellat:
- L'atribut `aria-busy` s'ha connectat correctament al `globalStatus` centralitzat de l'`UIContext`.
- S'ha actualitzat el contracte del host a `host.js` per suportar injeccions parcials sense comprometre la seguretat de l'arrencada i s'hi ha afegit el mètode `deferArrenca`.
- S'ha resolt l'advertiment de pèrdua de fonts en el cicle de desmuntatge de `PedraSecaEmbed.jsx`.
- S'ha aïllat del cicle innecessari la renderització del `DetailColumn` a `UniversalWorkspace.jsx` mitjançant memorització i extracció de dependències directes del context.
- S'ha afegit un `AbortController` al mètode d'obtenció de dades del `MurContext.jsx` per cancel·lar netament les peticions quan canvia la subscripció.

## Situació i dades opaques

Necessitem una validació severa i rigorosa. L'entorn passa l'eslint, els tests (Vitest) i la construcció (build), però necessitem assegurar-nos que l'estructura és sòlida per al pas a producció.

## Missió

1. Fes una **auditoria extrema** del codi i de l'estat actual de l'arquitectura.
2. Presta especial atenció en la correcta resolJaolució de les incidències prèvies de Nivell A i C per assegurar que no s'ha trencat cap lligam d'accessibilitat ni s'ha afegit deute tècnic.
3. **Posa'ns una nota sobre 10.** Sigues exigent, dur, i valora si l'arquitectura actual és mereixedora de portar el segell de producció de Sóc de Poble.

## Eixida esperada

No modifiquis codi. Crea exclusivament un arxiu markdown amb el nom en format `AAMMDD_HHMM_informe_auditoria_extrema_amb_nota.md` dins de `_wiki_de_poble/04_escriptori/`. Inclou clarament el veredicte, les teues conclusions (si tot rutlla bé o si cal fer-hi retocs) i **LA NOTA FINAL**.

## Bateria de veritat

- [ ] He citat només rutes del manifest, en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
