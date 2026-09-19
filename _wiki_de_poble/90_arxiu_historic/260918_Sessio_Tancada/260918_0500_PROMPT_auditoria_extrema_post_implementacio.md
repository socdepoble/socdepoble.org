---
type: prompt
status: canonic
description: Instruccions per a Codex per a realitzar una segona auditoria extrema després de la implementació.
tags:
  - govern
---

# Petorreta — Segona Auditoria Extrema Global (Post-Implementació)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260918-AUDIT2 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 05:00 |
| Modificació | 26-09-18 05:00 |
| Agent redactor | IAIA MarIA (Fable 5.1) |
| Propietari | Consell de la Petorreta |
| Aprovació humana | pendent |
| Revisió pendent | no |

## Vincles

- [[00_index_escriptori]]
- [[260918_0243_informe_auditoria_extrema_postmigracio]] (Primer Informe Codex)
- [[260918_0435_PROMPT_implementacio_auditoria]] (Implementació realitzada)

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).

## Agent convocat

Claude (Cowork) / Codex (Cursor)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi en aquesta fase. El teu rol és única i exclusivament d'auditor i analista.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

Acabem d'implementar totes les correccions crítiques derivades de la teua primera auditoria (importacions trencades a Pedra Seca, problemes de render al reductor de UniversalWorkspace, referències SEO obsoletes, i portes de catàleg fallides). Actualment, la bateria completa de test passa, l'ESLint no reporta errors i el build aparentment funciona.

## Situació i dades opaques

Necessitem confirmar empíricament que l'estat actual és 100% net i que no hem introduït cap regressió ni efecte col·lateral amb les últimes implementacions. Volem assegurar-nos que l'aplicació està completament a punt abans de donar la branca per bona.

## Missió

1. **Inspecció Post-Operatòria:** Revisa l'estat actual del working tree i executa internament una passada completa d'anàlisi de l'arquitectura. Comprova especialment la integració del router i els cicles de renderitzat del `UniversalWorkspace`.
2. **Verificació de Portes i Tests:** Executa i llig els resultats de `npm run porta:cataleg`, `npm run porta:importacions` i els test per confirmar que res s'ha trencat.
3. **Detecció de Deute Romanent:** Identifica si queda qualsevol incidència crítica (nivell C) o advertència de memòria/rendiment (nivell A) que no haguem cobert en la implementació anterior.

## Eixida esperada

Has de redactar un nou informe d'auditoria (format markdown) a l'escriptori detallant el veredicte final de la branca actual. Si l'estat és completament verd i a punt per a desplegament, dictamina-ho oficialment.

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Has respectat la regla anti-cerca?
- [ ] El document compleix l'estàndard termodinàmic de metadades?
