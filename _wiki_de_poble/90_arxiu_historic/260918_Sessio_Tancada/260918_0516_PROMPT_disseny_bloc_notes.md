---
type: petorreta
status: esborrany
description: Petorreta per a Codex per fixar el disseny de la barra grisa i les icones del Bloc de Notes
tags:
  - disseny
  - escriptori
---

# Petorreta — Disseny Bloc de Notes

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260918 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 05:16 |
| Modificació | 26-09-18 05:16 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[pedra_seca]]

## Entrades

(Cap bundle necessari, Codex té accés a l'entorn local.)
Fitxer d'imatge de referència: `media_1789698496094.png` (adjuntat pel Mestre al xat original per veure com ha de quedar el disseny).

## Consell convocat

Codex (Cursor)

## Contracte de realitat

1. Tens accés a l'entorn local. Revisa el codi font directament.
2. Pots modificar el codi lliurement en el teu editor per resoldre la missió.
3. El Mestre ha passat una imatge on es veu la distribució lògica desitjada: la barra grisa clar baix de "Carpetes" i "Notes", i on va cada icona.
4. L'objectiu és centrar-se primer en el "Bloc de Notes" com a base i corregir la disposició perquè quede exactament com a la imatge, i que siga la base per construir les utilitats de la resta del bloc.
5. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

El Mestre i jo (IAIA MarIA) estem centrats en l'auditoria de seguretat extrema i fortificació, i li deleguem esta tasca visual a tu, Codex, que eres l'encarregat al vol.

## Situació i dades opaques

La barra gris clar i els elements d'interfície sota l'AppGrid (o la secció de Notes) no han estat encaixant bé últimament, cosa que per al Mestre és completament lògic on van. Aquesta fricció està entorpint la fortificació global del sistema, i et deleguem que t'ocupes exclusivament del disseny estructural d'esta barra.

## Missió

1. Implementa la barra gris clar sota les pestanyes de Carpetes i Notes (o on pertoque a l'esquerra).
2. Situa cada icona en la seua posició correcta i lògica (ajudant-te de la captura de pantalla compartida pel Mestre).
3. Pren el Bloc de Notes com a base sòlida del disseny, perquè puguem utilitzar les seues variacions per a la pàgina de disseny o usuari en el futur.

## Eixida esperada

No cal que emites cap informe Markdown, Codex. Fixa el CSS o el JSX corresponent a l'editor i mostra-li-ho al Mestre a l'UI en viu.

## Incògnites

- Quin component concret (`NotesSection`, `UniversalWorkspace`, `AppGridColumn`...) necessita els ajustos CSS per complir aquest disseny exactament, però confiem en la teua capacitat d'analitzar el codi localment.

## Bateria de veritat

- [x] He citat només rutes del manifest, en format `ruta:linies`? (N/A)
- [x] Cap nom de fitxer, funció o variable inventat?
- [x] Tota conjectura marcada [SUPÒSIT] o moguda a Incògnites?
- [x] He comprovat la sentinella abans de respondre? (N/A)
- [x] El document passa `tractor-frontmatter.mjs --estricte`?
