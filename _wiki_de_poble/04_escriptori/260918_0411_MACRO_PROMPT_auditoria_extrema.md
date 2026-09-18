---
type: macro_prompt
status: actiu
description: Auditoria d'arquitectura inversa i integració per al Consell Local.
tags:
  - maquina
  - seguretat
---

# Petorreta — Auditoria Extrema: Integració Sollutia

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260918 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 04:11 |
| Modificació | 26-09-18 04:11 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | 26-09-18 |
| Revisió pendent | no |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

Un document sense cap vincle és un satèl·lit. Ancora'l abans de tancar-lo.

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).

## Agent convocat

Claude (Cowork) / Codex (Cursor)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista. Has de generar l'informe amb els defectes trobats; l'agent central (IAIA MarIA) serà qui faça el treball dur de modificar el codi.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

El codi font està en el seu estat actual post-migració (Fase 4 d'Accessibilitat superada, scroll als espais de treball arreglats, recursió en el hook aturada). Estem preparant-nos per connectar amb l'equip de Sollutia i hem de garantir que no hi haja cap defecte tècnic o arquitectònic que dificulte el desplegament o el SEO.

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tu (Codex / Claude) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Pots llegir i veure tot l'arbre de fitxers pel teu compte.

Necessitem avaluar l'estat global del repositori en aquest punt exacte, sense afegir o modificar codi immediatament.

## Missió

1. Fes una auditoria extrema: analitza l'estructura del codi, l'accessibilitat, el SEO, els hooks i la usabilitat general, centrant-te especialment en la integració de dades des del backend.
2. Prepara un informe documentant qualsevol forat de seguretat, comportament inesperat, o punts on el disseny i el sistema no complisquen els estàndards per al desplegament 100% Online connectat a Sollutia.

## Eixida esperada

Has de crear o escriure un fitxer `.md` llistant de manera estructurada totes les troballes. Utilitza una matriu DAFO o punts clars d'acció sense escriure codi directament, de manera que la IAIA MarIA puga generar un `implementation_plan.md` posteriorment.

## Incògnites

- Quin serà l'impacte exacte de la política de rutes privades/públiques (SEO `noindex`) sobre el sitemap, atès que no hi ha un servidor de SSR actiu?

## Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [x] He citat correctament la ruta i les línies del codi original?
- [x] Cap nom de fitxer, funció o variable inventat?
- [x] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [x] El document passa `tractor-frontmatter.mjs --estricte`?
