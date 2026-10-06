---
type: norma
status: canonic
description: "Decisió d'integració amb Sollutia: Model B, SdP font de veritat i Sollutia en lectura per GET via la Frontissa."
tags:
  - sollutia
---
# ADR-2026-09 — Integració amb Sollutia: Model B

**Model B:** Sollutia és l'amfitrió i el soci d'infraestructura de Sóc de Poble: allotja el Web Component, ens pot passar la sessió i ens obri la seua API només en lectura (GET a través de la Frontissa), sense injectar cap backend ni interferir en l'arquitectura o el disseny. Les dades del poble viuen al Supabase de Sóc de Poble, única font de veritat, darrere d'un port neutral (`src/data/backendPort.js`): el frontend, 100% modular, s'enxufa a qualsevol amfitrió (Sollutia, WordPress o Joomla), canviar de backend és una decisió de Sóc de Poble amb una ADR i el kit de conformitat, i sempre podem traure-ho «tot fora». No hi ha escriptures creuades.

## Estat

Acceptada pel Mestre el 16 de setembre de 2026 i signada pel Mestre el 6 d'octubre de 2026 (decisió al xat, torn torn_9d5803f4 de Claude) amb esta frase canònica, la que obri l'ADR. Aprovació humana: signada.

## Context

Sollutia es connecta amb Sóc de Poble hui. Calia fixar qui és la font de veritat i
per on circulen les dades abans del desplegament. Els models considerats:

- **A** · Sollutia injecta la seua implementació al port (`src/data/backendPort.js`) i substituïx Supabase.
- **B** · Supabase de SdP és la font de veritat. Sollutia allotja el Web Component
  `<soc-de-poble>` i pot passar la sessió amb `adoptaSessioExterna`
  (`src/data/identitat.js:486`). SdP llig de Sollutia només per GET a través
  de la Frontissa (`src/data/adaptadors/sollutia/client.js`).
- **C** · Qualsevol variant amb escriptures creuades entre les dues cases.

## Decisió

**Model B.**

1. Dades compartides del poble: només a Supabase de SdP, amb RLS.
2. Sollutia → SdP: sessió de la persona usuària (`adoptaSessioExterna`, fail-closed) i
   atributs del Web Component. Cap clau de servei.
3. SdP → Sollutia: només `GET`, `credentials: 'omit'`, token de la sessió
   (pendent: el transport encara no l'envia, `creaFrontissa.js:60-63`). `ESCRIPTURES_PERMESES` continua buida (`client.js:9`).
4. Cada recurs de Sollutia entra a `recursos.js` només amb captura real, traductor i fixture.
   Sense els tres, `llig()` falla tancat.

## Conseqüències

- Cap escriptura cap a Sollutia sense una ADR nova que l'afija a `ESCRIPTURES_PERMESES`.
- `src/data/backendPort.js` no s'obri a implementacions de Sollutia ni de cap amfitrió: el backend segellat el tria SdP. Canviar-lo demana una ADR nova i un adaptador que passe el kit de conformitat (`src/data/conformitat/kit.js`), injectat només per la via interna del paquet (`injectaBackendDelPaquet` a `src/host.js`).
- Pendents abans d'obrir el trànsit real:
  - allowlist d'orígens per a `supabase-url` i `bot-api-url` a `sanejaConfig()` (incògnita I1 de Perplexity);
  - orígens exactes de Sollutia a `public/auth/callback.html`;
  - `tooling/gates/tractor-frontissa.mjs`: quan es va escriure esta ADR la cadena de portes la cridava i no existia; ara existix, comprova l'estructura de `client.js` i `creaFrontissa.js` i la cadena `run-portes.mjs` l'executa com a «Porta Frontissa Sollutia» (`npm run porta:frontissa`). Queda acreditar que passa en verd.

## Vincles

- [[ADR-2026-08-ONLINE-FIRST]]
- [[soci_sollutia]]
- [[doc_governanca]]
