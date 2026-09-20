---
type: petorreta
status: esborrany
description: Auditoria de la Capa de Reactivitat Visual i AppGridShell per evitar cicles innecessaris.
tags:
  - arquitectura
  - rendiment
---

# Petorreta — Auditoria de la Reactivitat Visual

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260919 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-19 23:20 |
| Modificació | 26-09-19 23:20 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent · 26-09-19 |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).

## Agent convocat

Claude (Cowork) / Codex (Cursor)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI I EVITAR "CONFIRMAR CANVIS"):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. L'organització de fitxers i la modificació del codi és responsabilitat EXCLUSIVA de l'agent central (IAIA MarIA). El teu rol és única i exclusivament d'auditor i analista teòric. **CRÍTIC PER A CLAUDE I CODEX:** Tens TOTALMENT PROHIBIT utilitzar eines internes d'edició de fitxers (com `replace`, `edit`, `write`) que generen el botó verd de "Confirmar Canvis" (Apply Changes) a la teua interfície. Si el Mestre humà prem eixe botó per accident, pot desmuntar tot el sistema. Per a evitar-ho, tota la teua proposta de codi s'ha d'exposar exclusivament en text pla o blocs de markdown no aplicables. Mai utilitzes les teues eines d'edició de sistema operatiu.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

Hem completat la neteja de CSS mort (eliminant antigues regles d'UI trencades que sobreescrivien dissenys moderns, fixant els backgrounds).
Hem restaurat la visualització de les capçaleres transparents i la llegibilitat dels placeholders en l'editor universal de blocs.
L'arbre visual està sanejat. El següent pas (Onada E) és analitzar la Capa de Reactivitat Visual i els cicles de render associats.

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tu (Codex / Claude) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Pots llegir i veure tot l'arbre de fitxers pel teu compte. 

Tenim identificat un possible problema de rendiment cíclic causat per memoització ineficient. A banda de l'acoblament CSS reparat, hi ha mutacions i mètodes (com l'ús de `JSON.stringify` per comparar estats a l'arrel o a `NotesContext`) que destrueixen funcions i clonen objectes pesats, causant pèrdua de cicles valuosos en els iPads antics (A10). Tampoc tenim clar si el layout (`AppGridShell` i `UniversalWorkspace`) està re-avaluant innecessàriament les columnes en cada clic.

## Missió

1. **Analitzar la memòria reactiva:** Revisa com es transmet l'estat global a la UI en `UniversalWorkspace`. Identifica hooks propensos a causar re-renders si la referència muta innecessàriament.
2. **Avaluar el patró `JSON.stringify` a App.jsx i NotesContext:** Diagnostica el cost tèrmic d'aquest patró i proposa una solució estructural en Vanilla React per extirpar-lo (amb useMemo o referències fraccionades).
3. **Escut de Contenció per a columnes:** Revisa la gestió de columnes de l'AppGridShell i assegura que no causen allaus de renders asíncrons a l'obrir/tancar la barra lateral.
4. **Auditoria de Contradiccions a la Wiki (Mecànica i Skills):** "Escolteu, Codex i Claude, necessite ajuda per entendre i arreglar el meu propi cervell. El Mestre humà ha detectat que contínuament em desoriente, invente formats o utilitze plantilles antigues (per exemple, abans us he demanat un bundle a vosaltres que sou locals i no en necessiteu). Això em passa perquè tenia 4 o 5 *skills* (`equip-ia`, `ment-colmena-integral`, `skill-consell-bundle`, `skill-acte-reflex`) que es calcigaven entre ells i es contradeien. Jo he intentat fusionar-los ara en 2 nous (`skill-consell-i-colmena` i `skill-documentacio-i-reflex`), però segur que no ho he fet bé del tot i que n'hi ha més com aquests. Si us plau, **auditeu un a un els meus skills de la carpeta `.agents/skills`**, investigueu per què falle, valideu si les meues plantilles (`_wiki_de_poble/02_saber/07_plantilles`) tenen sentit, unifiqueu-ho i ensenyeu-me com evitar aquests desastres. Si hi ha alguna cosa que cap IA pot deduir, llisteu els dubtes perquè el Mestre ens done la seua visió com a humà. Però necessite que m'ajudeu a curar la meua arquitectura cognitiva abans d'anar a pitjor."

## Eixida esperada

Has de retornar una qualificació objectiva sobre 10 de l'estat de la reactivitat del projecte llegit. Elabora un document d'Auditoria Estructural Reactiva. No vull línies de codi a cegues: vull explicacions estructurals.
El format final de la teua resposta no s'ha d'aplicar al disc (Contenció Absoluta). Mostra'm com quedaria la solució en text pla. (Les respostes directes de Codex/Claude s'anomenen SEMPRE "auditoria" ex. 260919_2100_auditoria_claude.md)

## Incògnites

- No sabem com reacciona `Sollutia` davant el nombre elevat de fetchs si s'esdevé un re-render. Ho hem de donar per opac.

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
