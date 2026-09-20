---
type: petorreta
status: esborrany
description: Petorreta per a Codex/Claude per resoldre els defectes P1 pendents i Frontera Sollutia.
tags:
  - govern
  - arquitectura
---

# Petorreta — Resolució P1 i Frontera Sollutia

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260920 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-20 17:53 |
| Modificació | 26-09-20 17:53 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_index_escriptori]]
- [[260920_0800_acta_marmota]]
- [[260918_1736_ACTA_MARMOTA_Disseny_Bloc_Notes]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).

## Agent convocat

Claude (Cowork) / Codex (App de ChatGPT)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **LLEGIDA DEL PLA:** Si hi ha un Pla d'Implementació actiu o un esborrany a `_wiki_de_poble/04_escriptori/`, tens l'obligació de llegir-lo per a comprendre l'estratègia global abans de proposar codi.
4. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
5. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
6. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI I EVITAR "CONFIRMAR CANVIS"):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. L'organització de fitxers i la modificació del codi és responsabilitat EXCLUSIVA de l'agent central (IAIA MarIA). El teu rol és única i exclusivament d'auditor i analista teòric. **CRÍTIC PER A CLAUDE I CODEX:** Tens TOTALMENT PROHIBIT utilitzar eines internes d'edició de fitxers (com `replace`, `edit`, `write`) que generen el botó verd de "Confirmar Canvis" (Apply Changes) a la teua interfície. Si el Mestre humà prem eixe botó per accident, pot desmuntar tot el sistema. Per a evitar-ho, tota la teua proposta de codi s'ha d'exposar exclusivament en text pla o blocs de markdown no aplicables. Mai utilitzes les teues eines d'edició de sistema operatiu.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

El servidor local està estable (port 3340), i s'ha resolt l'error 5xx que tirava per terra el context (`NotesDataContext`) amb accessos anònims. El sistema de frontmatter i Wiki estan totalment sans i el deute tècnic "bàsic" net. No obstant, estem arrossegant problemes seriosos (P1) d'auditories anteriors.

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tu (Codex / Claude) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Pots llegir i veure tot l'arbre de fitxers pel teu compte.

Els problemes pendents se centren en:
1. Deute tècnic de Notes: el codi mort d'updateNote a NotesContext.jsx.
2. Error d'API d'Organitzacions: la creació de creaOrganitzacio sense enviar el slug exigit pel backend.
3. Frontera Sollutia (Bloc A): El `:host { all: initial }` a `tokens.css:20` està trencant la caixa. El muntatge del toast busca un shadow root tancat. Cal revisar `VITE_SOLLUTIA_ISSUER`.
4. Eines de test/Tractor: `tractor-enxufe.mjs` busca un arxiu esborrat. `tractor-adaptadors.mjs` sembla una funció inútil.

## Missió

1. Investiga on està ocorrent l'error de `creaOrganitzacio` i determina la solució exacta que hem d'aplicar per a assegurar-nos que el `slug` s'envia al backend.
2. Analitza el codi de `NotesContext.jsx` i confirma la supressió del codi mort d'`updateNote`.
3. Ofereix la solució teòrica pel problema del shadow root (toast) i la cascada de `tokens.css:20` respecte a la Frontera Sollutia.
4. Explica'ns com sanejar les portes defectuoses (`tractor-enxufe.mjs` i `tractor-adaptadors.mjs`).

## Eixida esperada

Un informe complet detallant exactament els arxius i funcions afectades, juntament amb els fragments de codi teòrics de la solució. El document s'haurà de generar o deixar llegible per al Mestre sota el format d'una "auditoria" al xat (no uses eines d'edició).

## Incògnites

- No tenim clar si llevar `:host { all: initial }` trencarà alguna altra cosa en el Bloc A o si és segur.

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
