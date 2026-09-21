---
type: petorreta
status: esborrany
description: Petorreta interna per a verificar els canvis d'AppGridShell, ItemMedia, WorkspaceContext i Dialeg
tags:
  - govern
  - arquitectura
aliases:
  - auditoria verificacio final
---

# Petorreta — Verificació de la Remediació Tècnica

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260921 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-21 02:45 |
| Modificació | 26-09-21 02:45 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_INDEX_ESCRIPTORI]]
- [[universal_maquetation]]
- [[design_system_specs]]

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

**Context Històric i Ànima del Projecte:** Per a entendre la profunditat del que estem construint, la nostra identitat i el concepte d'accessibilitat extrema, pots consultar els nostres orígens a rentonar.blogspot.com i socdepoble.net. Aquest és el cor de Sóc de Poble. (Sollutia és l'agència SaaS que ens dona l'arquitectura de backend).

## Informe d'avanç

S'han executat les 4 tasques del Master Plan d'Auditoria prèvia:
1. **Neteja CSS Visual:** Eliminada la variant "transparent" obsoleta de l'AppGridShell i `modules.css`. A més s'ha restablert i forçat que la primera columna tinga correctament i en totes les vistes un fons bonic de `var(--sdp-pedra-750)`.
2. **Resolució de miniatures:** Creat el component compartit `ItemMedia.jsx` i arreglada la "race condition" de `useResolvedAsset.js` per a suportar icones de fallback, inicials generades i evitar renders desincronitzats. S'usa a `UniversalWorkspace` i `NotaFitxa`.
3. **Reconciliació asíncrona:** Aïllats els closures a `WorkspaceContext.jsx`. Es fan servir referències (refs) internament per evitar que `selectCategory` depengui constantment del renderitzat o es desincronitzi si `status !== 'ready'`.
4. **Menú mòbil:** Afegida la variant `sense-marc` al component genèric `Dialeg.jsx`. `App.jsx` l'usa ara per al menú compacte mòbil, eliminant parpellejos.

## Situació i dades opaques

Aquest és un cas especial d'auditoria (Excepció de Frontera). Com que tu (Codex / Claude) tens accés natiu a tot el codi font del projecte `socdepoble.org` en l'entorn de desenvolupament, **no t'hem generat cap Bundle**. Pots llegir i veure tot l'arbre de fitxers pel teu compte. 

Volem avaluar si aquests 4 canvis solucionen de base tots els errors assenyalats a l'auditoria prèvia o si hem trencat alguna cosa sense voler. Volem un "10 sobre 10".

## Missió

1. Revisa exhaustivament el codi actualitzat (`AppGridShell.css`, `modules.css`, `ItemMedia.jsx`, `UniversalWorkspace.jsx`, `WorkspaceContext.jsx`, `App.jsx`, `Dialeg.jsx`) cercant fugues de CSS, components desalineats, errors d'accessibilitat o falles en els contractes estructurals del disseny.
2. Verifica si la reconciliació a `WorkspaceContext.jsx` mitiga efectivament el problema reportat prèviament o si cal un redisseny més gran per a la càrrega inicial profunda d'URLs.
3. Repassa visualment (mentalment via el codi) l'aparença en mode light i dark, especialment a la primera columna de l'AppGridShell (que utilitza `--sdp-pedra-750` fixat i `--sdp-crom-text`). Tot bé?

## Eixida esperada

Genera un informe a l'escriptori (`_wiki_de_poble/04_escriptori/`) amb el format: `260921_0255_INFORME_auditoria_verificacio_{claude/codex}.md`. Detalla clarament si hem assolit el 10/10 o llista de manera prioritzada els aspectes que encara hem de solucionar, però **sense tocar codi**.

## Incògnites

- No estem segurs si `Dialeg.jsx` necessita alguna altra adaptació per a la variant `sense-marc` en temes d'accessibilitat.

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
- [ ] El document passa `tractor-frontmatter.mjs --estricte`?
