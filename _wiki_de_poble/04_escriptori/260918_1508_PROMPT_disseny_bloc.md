---
type: petorreta
status: esborrany
description: "Disseny de la barra lateral (bloc) basada en Mac Notes per a Claude/Codex"
tags:
  - disseny
  - arquitectura
---

# Petorreta — Disseny de la Barra Lateral (Bloc de Notes)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-202609181508 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-18 15:08 |
| Modificació | 2026-09-18 15:08 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 2026-09-18 |
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

El mestre vol clarificar i implementar el disseny definitiu de la barra lateral de Notes (Folders/Carpetes), basant-se en el disseny de Mac Notes. Aquesta arquitectura servirà de base (el "Bloc") per a la resta de seccions (Bloc de Notes, Bloc de Disseny, Bloc d'Usuari, Gestoria, etc.).

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tu (Codex / Claude) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Pots llegir i veure tot l'arbre de fitxers pel teu compte. 

Juntament amb aquest Prompt, l'usuari us lliurarà una captura de pantalla del "Bloc de Notes de Mac" (Apple Notes) que servirà de referència visual indiscutible per a calcar l'estructura de la barra de carpetes i notes. Fixeu-vos especialment en l'alineació, colors i elements clau (ex. botó fosc "Tot", categories i etiquetes).

## Missió

1. Analitzar l'estat actual dels components de la nostra interfície (ex: `UniversalEditorShell`, `CarpetesNav`, `NotesList`, barres d'eines, etc.) amb el teu accés directe al codi.
2. Definir i proposar l'estructura base d'aquest "Bloc de Notes multiús", recolzant-te en la inspiració (Mac Notes, Obsidian, Notion) per a la disposició dels panells (acordions, navegació).
3. Proposar el disseny per a la **botonera de l'editor**, apropant-la a l'estil clàssic i pràctic de Google Docs.
4. Resoldre el comportament "responsive" i mòbil aplicant regles de Material Design, assegurant regles css clares (com el pas de botó amb text a botó redó amb icona quan falta espai).
5. No et preocupes pels elements finals ara mateix: la prioritat és **deixar el sistema de disseny muntat i estructurat**. Els detalls els polirem després. Proposa el codi CSS (amb variables de Pedra Seca) i la refactorització en React necessària.

## Eixida esperada

Arxiu Markdown amb l'informe d'arquitectura visual i els blocs de codi CSS/React proposats per aconseguir la rèplica del disseny sol·licitat, a punt perquè la IAIA MarIA els integre.

## Incògnites

- No tenim els textos finals de la botonera, la prioritat és muntar l'esquelet funcional.

## Bateria de veritat

- [x] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [x] He citat correctament la ruta i les línies del codi original?
- [x] Cap nom de fitxer, funció o variable inventat?
- [x] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [x] El document passa `tractor-frontmatter.mjs --estricte`?
