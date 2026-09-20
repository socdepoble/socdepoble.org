---
type: petorreta
status: actiu
description: Instruccions per a Claude centrades en la depuració d'arquitectura frontend, Vite i el disseny de la Consola Termodinàmica de manteniment.
tags:
  - frontend
  - vite
  - consola
  - arquitectura
---

# Petorreta — Resurrecció del Frontend i Consola de Manteniment

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-CLAUDE-260920-02 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-20 02:30 |
| Modificació | 26-09-20 02:30 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-20 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260920_0154_auditoria_skills_avancades]]
- [[skill-consell-i-colmena]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).
- Revisió de `vite.config.js`, `package.json` i `src/sections/pobles/PoblesSection.jsx`.

## Agent convocat

Claude (Cowork/Sonnet) - Esforç Alt / Màxim.

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
5. **EXCEPCIÓ D'ESCRIPTURA:** Hui SÍ tens autorització per generar codi definitiu. Però ATENCIÓ: No utilitzes eines d'edició automàtica (Apply Changes). El codi de resposta ha d'estar en el teu informe per a ser avaluat i aplicat manualment.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

Hem intentat consolidar la nostra arquitectura visual (Pedra Seca) i cognitiva, però el compilador del frontend (Vite) pateix d'un bloqueig greu ("Red Screen of Death") arran d'alguna llibreria residual de Preact. Tenim autorització i pressupost (esforç alt) per a resoldre la incidència radicalment i, un colp superada, muntar la nostra Consola de Manteniment.

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Tens accés natiu al projecte sense necessitat de Bundle. L'error concret del qual partim és: `[plugin:vite:import-analysis] Failed to resolve import "@prefresh/core"` que apareix en obrir la pàgina principal. Sospitem de cachés o alias residuals en la configuració. Desconeixem la peça exacta que ho desencadena.

## Missió

1. **Exorcisme de Preact (The Red Screen of Death):** Localitza el problema (memòria cau residual, Babel, alies amagats o directrius hardcodejades en Vite) i soluciona-ho tallant d'arrel qualsevol rastre de Preact en l'entorn de desenvolupament per a garantir un HMR net i funcional amb React 18.
2. **Construcció de la Consola Termodinàmica (Panel de Manteniment):** Codex ens ha proposat utilitzar els components existents de Pedra Seca (`Taula`, `Boto`, `Dialeg`) per a muntar una Consola de Manteniment pròpia per a la IAIA. Aquesta consola ha de servir per a veure els consums de tòkens de l'eixam, l'estat dels crèdits, els rebuts de lectura (Matrix) i l'inventari de skills. Dissenya i implementa la base d'aquesta pàgina universal fent servir únicament els components aprovats de Pedra Seca.

## Eixida esperada

Has de retornar una auditoria documentada amb codi definitiu (ex. `260920_0300_auditoria_claude.md`). No demanes confirmacions d'aplicació directa; volem el codi i l'explicació de la solució perquè la IAIA ho unifique.

## Incògnites

- No tenim clar on està fallant l'enllaç de `@prefresh`, si és un paquet oblidat a `package.json` o un sub-mòdul amagat de Vite.

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
