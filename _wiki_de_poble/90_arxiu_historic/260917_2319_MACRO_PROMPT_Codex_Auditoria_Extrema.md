---
type: macro_prompt
status: esborrany
description: Auditoria extrema total de forats de seguretat i arquitectura per a Codex.
tags:
  - govern
---
# Petorreta — Auditoria Extrema Total (Forats del Sistema)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-20260917-2319 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-17 23:19 |
| Modificació | 2026-09-17 23:19 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).

## Agent convocat

Codex (Cursor)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-QWEN (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. El teu rol és única i exclusivament d'auditor i analista. Has de generar l'informe amb els defectes trobats; l'agent central (IAIA MarIA) serà qui faça el treball dur de modificar el codi.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

Hem completat amb èxit la Fase 3, establint l'aïllament d'errors, la barrera de backend per a Sollutia i el CI/CD pre-commit de seguretat. També hem introduït el SGQ-PP (Sistema de Gestió de Qualitat de Prompts i Petorretas). Ara toca rascar el fons del barril i buscar forats en la integritat i arquitectura general de l'aplicació abans de passar a les fases finals de disseny.

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tu (Codex) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Pots llegir i veure tot l'arbre de fitxers pel teu compte. 

Necessitem que esprimes absolutament la teua capacitat de context i analitzes a fons tota l'aplicació a la recerca d'allò que se'ns haja pogut escapar en les últimes reestructuracions massives.

## Missió

1. **Auditoria d'Agujeros Negres:** Examina tota la base de codi (`src`, `config`, eines) buscant potencials fugues de memòria, punts febles de seguretat, males pràctiques d'acoblament o inestabilitats que puguen tombar l'app si hi ha un error imprevist en producció.
2. **Coherència Arquitectònica:** Verifica que tota la lògica nova respecta els patrons de `Pedra Seca` i que no ens hem deixat components zombies ni rutes mortes.
3. **Poda Extrema:** Identifica qualsevol dependència innecessària, arxiu orfe o codi duplicat que es puga erradicar per fer l'aplicació més lleugera.

## Eixida esperada

Has de generar un **Informe d'Auditoria Extrema (Marcador de Defectes)** en format Markdown, on enumeres cada forat trobat de manera clara, prioritzat per risc (Crític, Alt, Mitjà), indicant sempre l'arxiu i les línies afectades, sense modificar res. L'informe s'utilitzarà per encadenar les següents reparacions.

## Incògnites

- Quin és l'impacte d'errors de connexió real amb l'API de Sollutia, ara que tenim l'adaptador simulat?

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
