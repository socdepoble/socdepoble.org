---
type: norma
status: esborrany
description: "Decisió d'integració amb Sollutia: Model B, SdP font de veritat i Sollutia en lectura per GET via la Frontissa."
tags:
  - sollutia
---
# ADR-2026-09 — Integració amb Sollutia: Model B

## Estat

Acceptada pel Mestre el 16 de setembre de 2026. Aprovació humana: pendent de signatura.

## Context

Sollutia es connecta amb Sóc de Poble hui. Calia fixar qui és la font de veritat i
per on circulen les dades abans del desplegament. Els models considerats:

- **A** · Sollutia injecta la seua implementació al port (`src/data/backendPort.js`) i substituïx Supabase.
- **B** · Supabase de SdP és la font de veritat. Sollutia allotja el Web Component
  `<soc-de-poble>` i pot passar la sessió amb `adoptaSessioExterna`
  (`src/data/identitat.js:241-272`). SdP llig de Sollutia només per GET a través
  de la Frontissa (`src/data/adaptadors/sollutia/client.js`).
- **C** · Qualsevol variant amb escriptures creuades entre les dues cases.

## Decisió

**Model B.**

1. Dades compartides del poble: només a Supabase de SdP, amb RLS.
2. Sollutia → SdP: sessió de la persona usuària (`adoptaSessioExterna`, fail-closed) i
   atributs del Web Component. Cap clau de servei.
3. SdP → Sollutia: només `GET`, `credentials: 'omit'`, token de la sessió
   (`client.js:29-33`). `ESCRIPTURES_PERMESES` continua buida (`client.js:16`).
4. Cada recurs de Sollutia entra a `recursos.js` només amb captura real, traductor i fixture.
   Sense els tres, `llig()` falla tancat.

## Conseqüències

- Cap escriptura cap a Sollutia sense una ADR nova que l'afija a `ESCRIPTURES_PERMESES`.
- `src/data/backendPort.js` no s'obri a implementacions de Sollutia: el backend segellat és el de SdP.
- Pendents abans d'obrir el trànsit real:
  - allowlist d'orígens per a `supabase-url` i `bot-api-url` a `sanejaConfig()` (incògnita I1 de Perplexity);
  - orígens exactes de Sollutia a `public/auth/callback.html`;
  - `tooling/gates/tractor-frontissa.mjs`, que `run-portes.mjs:58` crida i no existix.

## Vincles

- [[ADR-2026-08-ONLINE-FIRST]]
- [[soci_sollutia]]
- [[doc_governanca]]
