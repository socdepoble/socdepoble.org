---
tipus: petorreta
estat: esborrany
description: Petorreta per a Claude per a executar la migració de frontmatter i Pedra Seca a UniversalPage.
tags:
  - govern
  - maquina
---

# Petorreta — Migració de Frontmatter i Pedra Seca

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-20260917 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-17 22:05 |
| Modificació | 2026-09-17 22:05 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[estandard_ui_universal]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).
- Captura de pantalla adjunta (Bloc de notes) amb l'estudi de IAs i l'explicació de l'entorn de treball.

## Agent convocat

Claude (Cowork / Desktop)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-QWEN (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
5. **A diferència d'altres auditories, pots proposar l'execució d'aquests canvis o generar els artefactes directament si t'ho permet el teu entorn (Efecte Matrix).**

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

S'ha tancat l'auditoria "Sol Muy Alto" completant la consolidació de les bases de l'App (aïllament del xat, sanejament de catàlegs, configuració de portes mecàniques, actualització de documents canònics i contractes). L'arquitectura està llesta i netejada d'abstraccions mortes (PWA, Dexie).

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tu (Claude) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Pots llegir i veure tot l'arbre de fitxers pel teu compte. A més, repassa la captura adjunta per entendre completament les expectatives del Mestre Javi respecte a l'ecosistema i el tractament de la nostra identitat de poble.

## Missió

1. **Migració de Frontmatter:** Analitza la Wiki per identificar i migrar el deute tècnic als fitxers on encara s'utilitzen les metadades `tipus` i `estat`. Actualitza'ls als equivalents moderns en anglés segons l'esquema actual (`type` i `status`).
2. **Aplicar Pedra Seca a UniversalPage:** Revisa l'estructura de `src/components/universal/UniversalPage.jsx` per assegurar que està utilitzant totalment l'estàndard Pedra Seca vigent (sense utilitats obsoletes de Tailwind ni dependències en classes `sp-*` velles, utilitzant els components formals com UniversalCard o equivalents).
3. **Implementació del Sistema de Gestió de Qualitat (SGQ-PP):** Revisa el document `00_SGQ_PLANTILLES.md` recentment creat i la plantilla que abans era ISO i ara s'anomena `00_PLANTILLA_PROMPT_CONSELL.md`. T'encarreguem que ens ajudes a dissenyar, implementar i desplegar aquest sistema de qualitat a través de les plantilles que consideres convenients (comença a numerar-les o organitzar-les segons procedisca). El terme "ISO" s'ha erradicat perquè era inadequat; l'oficial és SGQ.

## Eixida esperada

Has de presentar un informe detallat dels fitxers afectats per la migració del frontmatter, el codi refactoritzat per a `UniversalPage.jsx` amb la Pedra Seca, i una proposta estructurada per posar en marxa el SGQ (Sistema de Gestió de Qualitat) per a les nostres plantilles. Sent-te lliure de generar els documents necessaris en el teu entorn.

## Incògnites

- Hi ha altres components satèl·lit de `UniversalPage` que tinguen deute CSS pendent de netejar i passar a mòduls/tokens?

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
