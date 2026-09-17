---
tipus: micro_prompt
estat: esborrany
description: Prompt d'auditoria de millora de codi per a Codex (Notes i arquitectura general)
tags:
  - auditoria
  - disseny
---

# Petorreta — Auditoria Extrema de Millora (Codex)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-20260917 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-17 20:47 |
| Modificació | 2026-09-17 20:47 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[pedra_seca]]

## Consell convocat

ChatGPT Codex

## Contracte de realitat

1. Entorn tancat. L'única font de veritat és l'arbre del teu entorn local.
2. Tota afirmació sobre codi es cita com `ruta:linies`. Si no es pot citar, no s'afirma.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències a construccions rurals.
4. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Encara que tingues capacitat i permisos per editar l'entorn de treball local, tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista. Has de generar l'informe amb els defectes trobats; l'agent central (IAIA MarIA) serà qui faça el treball dur de modificar el codi.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a rentonar.blogspot.com i socdepoble.net. Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

Hem superat la crisi de la integració amb Sollutia tancant les escletxes de seguretat (llistes blanques per a `supabaseUrl` i aïllament estricte del `sessionStorage` del widget). També hem refet l'estructura de la `UniversalWorkspace` utilitzant els tokens i les classes del sistema de disseny "Pedra Seca" (`modules.css` etc). Ara la pàgina de Disseny i el Bloc de Notes s'entenen perfectament visualment: hem separat conceptes de carpetes, categories i etiquetes a la columna esquerra i hem sanejat el `NotesContext`.

## Situació i dades opaques

El Mestre disposa d'unes captures de referència (com era l'antiga disposició de carpetes, categories, etiquetes, i els botons/icones situats als extrems de la barra) que mostren una ergonomia que encara no hem assolit del tot. Ens agradaria continuar netejant el codi (lògica, CSS pseudo-tailwind residual, components react farragosos) i polir l'aplicació acostant-la a eixa estructura neta, sense trencar res.

L'objectiu ara no són els incendis P0, sinó els P2/P3: defectes de refactorització, estils residuals (el que en diem *poda salfumà*), redundàncies, deute tècnic o ineficiències de renderitzat que puguem anar netejant amb trellat.

## Missió

1. **Auditoria de refactorització (Bloc de Notes i UniversalWorkspace)**: Analitza l'estat actual de `NotesContext.jsx`, `UniversalWorkspace.jsx` i els CSS relacionats (`modules.css`). Detecta classes css orfes, importacions innecessàries i proposa millores per alinear la distribució de botons/icones tal com requerix el Mestre (distribució òptima).
2. **Cerca de codi mort o ineficient**: Inspecciona l'arbre de components buscant `useEffect` innecessaris, estils antics `dv-*` / `ue-*` que encara ronden per les capes d'UI o components antics.
3. **Redacció de l'informe**: Genera un document Markdown clar amb els problemes trobats (classificats per severitat i arxiu), incloent instruccions clares de com ho ha de resoldre la IAIA MarIA. **RECORDA: ESTÀ TOTALMENT PROHIBIT TOCAR EL CODI DIRECTAMENT**. Només redactar l'informe.

## Eixida esperada

Un informe Markdown clar i incisiu que s'ha de crear a l'escriptori (`_wiki_de_poble/04_ESCRIPTORI/`). El títol ha de seguir la taxonomia: `AAAAMMDD_HHMM_INFORME_Auditoria_Millora_Codex.md`.

## Incògnites

- No podem veure amb els nostres ulls la referència visual antiga exacta (tot i que el Mestre la proporcionarà en el xat de Codex), ens fiarem de la capacitat de Codex per correlacionar el disseny antic aportat pel Mestre amb el codi actual.

## Bateria de veritat

- [ ] He citat només rutes reals en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
