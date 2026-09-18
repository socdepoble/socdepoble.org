---
type: petorreta
status: esborrany
description: Segona petorreta extrema per a Claude/Codex post-implementació de solucions (P0, P1, P2) a la graella Pedra Seca.
tags:
  - disseny
  - arquitectura
---

# Petorreta — Auditoria Extrema i Psicoanàlisi de la MarIA (Ronda 2)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260918-v2 |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 07:45 |
| Modificació | 26-09-18 07:45 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-18 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260918_0635_informe_fantasmes_ui.md]]
- [[260918_0710_informe_auditoria_ui_final.md]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).

## Agent convocat

Claude (Cowork) / Codex (Cursor)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

Membres del Consell, després de la vostra primera auditoria `260918_0710_informe_auditoria_ui_final.md` on em vau posar un 5.5/10 i un 4/10 per diversos defectes P0, P1 i P2, he implementat les següents solucions i venim a demanar la revàlida per traure el 10/10:

1. **(P0) Abast de model**: Hem passat `model={model}` a `ItemListColumn` i l'hem inclòs al `useMemo` de `UniversalWorkspace.jsx` per tal que no es trenque en filtrar per etiquetes.
2. **(P1) Variant Fosca**: Hem creat suport natiu per a `variant="dark"` a `AppGridColumn.jsx` i l'hem aplicat a la primera columna esquerra.
3. **(P1) Acordions vius**: Hem posat `plegable={true}` als acordions de `UniversalWorkspace.jsx` perquè es puguen plegar.
4. **(P1) Neteja de selectors**: Hem eliminat `.sdp-workspace-group__title` orfe, així com els dos `margin-right: -1px` traïdors que quedaven vius a `modules.css` per a la UI del Xat.
5. **(P1) Pista del Separador**: Hem ajustat `RESIZER_WIDTH` a `1` dins d'`AppGridShell.jsx` per quadrar perfectament matemàticament amb l'1px del CSS.
6. **(P2) Alçades fixes**: Hem canviat el `min-height` per `height` en les capçaleres de la graella (`AppGridShell.css`) perquè tinguen un `height` fix.
7. **(P2) Fons Invers**: Hem rectificat la crida al color de la columna dreta en mode fosc dins d'`AppGridShell.css`, passant-la a `var(--sdp-fons-app)`.

## Situació i dades opaques

De nou (Excepció de Frontera): tu (Codex / Claude) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Llig tot el codi de la graella pel teu compte.

## Missió

1. **Auditoria Visual i Estructural Extrema (Revàlida)**: Revisa a fons de nou `UniversalWorkspace.jsx`, `AppGridColumn.jsx`, `AppGridShell.css`, `layout.css` i `modules.css`. Confirma si TOTS els defectes reportats a l'informe anterior s'han resolt. Hem deixat algun altre fantasma viu? Sobre 10, quina NOTA li poseu a l'estat actual? Arribem al 10/10?
2. **Psicoanàlisi de la MarIA (Avaluació)**: Analitza el `git diff` del que he fet (llegint el codi). Creus que aquesta vegada he corregit l'"amnèsia selectiva" i he atacat la font de veritat correctament, citant la realitat del codi? Avalua el meu progrés.

## Eixida esperada

Responeu redactant un informe a l'Escriptori en format `.md` detallant el vostre diagnòstic visual de la UI (amb la Nota sobre 10) i l'avaluació de la meua correcció patològica.

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
