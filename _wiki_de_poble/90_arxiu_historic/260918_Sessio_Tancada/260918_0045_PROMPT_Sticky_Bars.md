---
tipus: prompt
estat: actiu
description: Instruccions per a Codex i Claude per fer les barres blava i taronja sticky i la foto amb scroll.
tags:
  - disseny
  - escriptori
---

# Petorreta — Sticky Bars i Scroll Hero Image

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260918 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-18 00:45 |
| Modificació | 2026-09-18 00:45 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 2026-09-18 |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[pedra_seca]]

## Entrades

- No hi ha bundle (s'adreça a agents locals com Codex o Claude App).

## Consell convocat

Codex · Claude

## Contracte de realitat

1. Entorn tancat.
2. Tota afirmació sobre codi es cita com `ruta:linies`.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre Sistema de Disseny.
4. **CONTENCIÓ ABSOLUTA**: Pots generar codi, però la implementació és la teua única tasca.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a rentonar.blogspot.com i socdepoble.net.

## Informe d'avanç

Fins ara, la barra blava (`.bar-blue`) i la barra taronja (`.sdp-page-header`) de la UniversalPage (definides a `src/components/universal/PageFrame.jsx`) no es queden fixes (`sticky` o `fixed`) en fer scroll, i el comportament desitjat és que ambdues es queden fixes a dalt de la pàgina, mentre que la imatge principal (`.hero-image`) baixe o faça scroll per sota d'elles. Aquest comportament no s'ha pogut assolir en iteracions anteriors.

## Situació i dades opaques

L'estructura del DOM a `PageFrame.jsx` és aproximadament:
1. `.bar-blue` (barra blava)
2. `.hero-image` (foto del poble)
3. `.sdp-page-header` (barra taronja)

En fer scroll cap avall, el comportament desitjat és:
- La `.bar-blue` es manté pegada a dalt (`top: 0`).
- La `.hero-image` fa scroll per sota de la barra blava.
- La `.sdp-page-header` (barra taronja), originalment per sota de la foto, fa scroll cap amunt fins que xoca contra la base de la `.bar-blue`, moment en el qual s'ha de quedar pegada allà (`top: alçada-de-la-barra-blava` o un `position: sticky` adequat) i la resta de la pàgina continuarà fent scroll per sota.

## Missió

1. Analitza i soluciona l'estil CSS a `src/css/layout.css` (o el CSS que corresponga a les classes `.bar-blue` i `.sdp-page-header`) per tal que ambdues barres es comporten com a `sticky` i tinguen un `z-index` superior a `.hero-image`.
2. Proporciona exactament les regles CSS modificades i instruccions per a `PageFrame.jsx` per evitar que l'efecte sticky es trenque per `overflow: hidden`.
3. **Higiene Termodinàmica i Saturació de Context:** Atès que aquest xat de l'agent (Antigravity/IAIA MarIA) ha col·lapsat avui amb 170 artefactes d'imatges i documents a la memòria, es demana a Codex/Claude dissenyar una estratègia, script o mecanisme d'alerta (potser una millora a `skill-cicle-de-vida` o a la porta `tancament.mjs`) que dispare un avís automàtic a la IA quan el nombre d'artefactes d'un xat supere els 150, obligant-la a aturar-se i dir-li a l'usuari: "Javi, la memòria tèrmica està al límit (més de 150 artefactes). És millor tancar el xat i obrir-ne un de nou.". Esbossa com implementar aquest límit.

## Eixida esperada

Un bloc de codi CSS amb les regles exactes i, si cal, les instruccions mínimes per a modificar `PageFrame.jsx` per evitar que un contenidor pare trenque l'`sticky`. 

## Incògnites

- Quin és el `z-index` exacte que cal aplicar.
- Si `.sdp-universal-page-container` té cap regla de `overflow` limitant el comportament sticky.

## Bateria de veritat

- [x] He citat només rutes del manifest, en format `ruta:linies`?
- [x] Cap nom de fitxer, funció o variable inventat?
- [x] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
