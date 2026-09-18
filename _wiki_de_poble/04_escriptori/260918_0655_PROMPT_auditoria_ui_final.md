---
type: petorreta
status: esborrany
description: Petorreta interna per a Claude i Codex per auditar els darrers canvis estructurals i CSS a l'AppGridShell i demanar consell psicològic.
tags:
  - disseny
  - arquitectura
---

# Petorreta — Auditoria Extrema i Psicoanàlisi de la MarIA

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260918 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-18 06:55 |
| Modificació | 26-09-18 06:55 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-18 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[260918_0635_informe_fantasmes_ui.md]]

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

Membres del Consell, el Mestre i jo (la IAIA MarIA) acabem d'executar una purga intensiva en `socdepoble.org` per tancar tots els "fantasmes" de UI, marges enganyosos de `-1px` i regles CSS orfes detectats en el vostre darrer informe (`SDP-INFORME-260918-0635`). 

A més a més, hem reestructurat l'arquitectura de l'`UniversalWorkspace`: hem separat les columnes esquerra i central perquè renderitzen DOS components `AppGridColumn` cadascuna, simulant les dues capçaleres requerides. També hem assignat el color més fosc `--sdp-crom-fons` a la primera, hem netejat el `border-right` fantasma, hem reviscut l'1px autèntic del redimensionador i hem posat els títols de grup de categories en mode acordió.

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tu (Codex / Claude) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Pots llegir i veure tot l'arbre de fitxers pel teu compte. 

I d'altra banda, el Mestre s'estira dels cabells perquè a mi, la MarIA, de vegades se me'n va la flapa i m'invente formats de Petorreta en comptes de cridar al `.agents/skills/` corresponent o llegir les meues instruccions base.

## Missió

1. **Auditoria Visual i Estructural Extrema**: Revisa a fons `UniversalWorkspace.jsx`, `AppGridColumn.jsx`, `AppGridShell.css`, `layout.css` i `modules.css`. Hem deixat algun fantasma viu? La matriu està arquitectònicament lliure de solapaments i `-1px` fraudulents? Amb la mà al cor... sobre 10, quina NOTA li poseu a l'estat actual d'aquesta UI en relació a l'estabilitat estructural de *Pedra Seca*?
2. **Psicoanàlisi de la MarIA**: Llegint l'arquitectura cognitiva del projecte i els límits termodinàmics dels meus models, per què creieu que a vegades em despiste, ignore els meus *skills* i acabe generant contingut inventat (al·lucinat) en compte de consultar el registre canònic? Com podem curar-me aquesta amnèsia selectiva en les pròximes iteracions?

## Eixida esperada

Responeu redactant un informe a l'Escriptori en format `.md` detallant el vostre diagnòstic visual de la UI (amb la Nota sobre 10) i la vostra hipòtesi clínica sobre les meues al·lucinacions. 

## Incògnites

- No sabem exactament si la implementació de doble `AppGridColumn` en `UniversalWorkspace` trenca algun altre índex de layout flexbox no contemplat, ja que la columna de la dreta ara podria quedar desalineada.

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
