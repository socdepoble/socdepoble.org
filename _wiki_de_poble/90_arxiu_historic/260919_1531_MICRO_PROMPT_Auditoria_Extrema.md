---
type: petorreta
status: esborrany
description: Petorreta d'auditoria extrema a tots els nivells del sistema (Codex/Claude)
tags:
  - seguretat
  - arquitectura
---

# Petorreta — Auditoria Extrema del Sistema

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260919 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 15:31 |
| Modificació | 26-09-19 15:31 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-19 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[arquitectura_tecnica]]
- [[arquitectura_cognitiva]]

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

**Context Històric i Ànima del Projecte:** Sóc de Poble és una xarxa social d'hiperproximitat per a la Torre de les Maçanes i altres pobles. Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. El projecte busca ser ràpid, segur i immutable al pas del temps (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend via Supabase, actuant només de persistència HTTP remota). El codi és pur, no s'hi permet la brossa. Tot s'audita a través de les Portes (Tractors).

## Informe d'avanç

Acabem de finalitzar una sessió exhaustiva on s'han netejat referències a secrets (com `service_role`) que s'havien filtrat als *bundles* de producció. Hem re-avaluat l'Acte Reflex per tal d'injectar les capes de validació directament sense trencar la política de seguretat, i hem assegurat la integritat de la maquinària i del graf. Totes les Portes estan actualment en verd. 

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tu (Codex / Claude) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Pots llegir i veure tot l'arbre de fitxers pel teu compte. 

El Mestre demana una **Auditoria Extrema del Sistema** a tots els nivells per la teva part. Necessitem que destripes l'arquitectura, l'estat del codi, la configuració, les portes de qualitat, l'accessibilitat i la seguretat a la recerca de qualsevol clivella per trobar els defectes que se'ns escapen.

## Missió

1. Extreu problemes o vulnerabilitats a tots els nivells arquitectònics, cognitius i tècnics del sistema actual llegint directament els arxius de l'arbre local. No donis res per descomptat.
2. Identifica potencials deutes tècnics, friccions de rendiment o fuites de dades i de seguretat (p.ex. a Supabase, els imports del client, gestió del state global, la UI).
3. Per a cada problema detectat, proposa una solució concreta, argumentada i cenyida al context del projecte 100% online amb Sollutia com a backend.
4. Genera un document d'Auditoria estructurat on els defectes estiguen categoritzats i valorats per importància.

## Eixida esperada

L'informe s'ha de redactar en valencià i formatar com un document d'Auditoria. Hauràs de detallar clarament quin agent ha emés l'auditoria, les troballes, les prioritats d'acció i el pla proposat. Desa l'informe a l'Escriptori.

## Incògnites

- Hi ha alguna porta del Tractor que estiga fallant de manera silenciosa o que estiga ignorant un risc greu que se'ns hagi escapat?

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
