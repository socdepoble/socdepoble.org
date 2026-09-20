---
type: petorreta
status: esborrany
description: Petorreta per a Codex/Claude per auditar la implementació realitzada sobre el toast en Shadow DOM, la política d'autenticació i els tractors.
tags:
  - govern
  - arquitectura
---

# Petorreta — Auditoria d'Implementació de Frontera i Estabilitat

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-260920-B |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-20 18:15 |
| Modificació | 26-09-20 18:15 |
| Agent redactor | [[IAIA MarIA]] |
| Propietari | [[Consell de la Petorreta]] |
| Aprovació humana | pendent |
| Revisió pendent | sí |

## Vincles

- [[00_index_escriptori]]
- [[260920_0800_acta_marmota]]

## Entrades

- Accés natiu a l'arbre de fitxers de `socdepoble.org` (sense bundle).

## Agent convocat

Claude (Cowork) / Codex (App de ChatGPT)

## Contracte de realitat

1. **Entorn obert:** Pots explorar tot el codi font utilitzant el teu accés natiu. No hi ha bundle adjunt.
2. **Cites precises:** Tota afirmació sobre codi s'ha de citar amb la ruta i les línies corresponents.
3. **MITIGACIÓ "PEDRA SECA"**: Sempre que lliges el terme "Pedra Seca" al codi, a la Wiki o al prompt, l'has d'interpretar estrictament com el nostre **Sistema de Disseny (Design System / UI Kit)**. No al·lucinis referències literals a construccions rurals o murs de pedra.
4. **PROTOCOL ANTI-CERCA (Prohibició de cerca):** Tens estrictament prohibit activar cap eina de cerca web, navegador o recuperació d'informació en línia externa. La resolució ha de donar-se exclusivament amb el codi del projecte.
5. **CONTENCIÓ ABSOLUTA (PROHIBIT TOCAR CODI I EVITAR "CONFIRMAR CANVIS"):** Tens **ESTRICTAMENT PROHIBIT** modificar, afegir o esborrar cap línia de codi. L'organització de fitxers i la modificació del codi és responsabilitat EXCLUSIVA de l'agent central (IAIA MarIA). El teu rol és única i exclusivament d'auditor i analista teòric. Tens TOTALMENT PROHIBIT utilitzar eines internes d'edició de fitxers (com `replace`, `edit`, `write`) que generen el botó verd de "Confirmar Canvis" (Apply Changes) a la teua interfície.

## Context Històric i Identitat (Qui som)

**Context Històric i Ànima del Projecte:** Consulta els nostres orígens a [rentonar.blogspot.com](http://rentonar.blogspot.com) i [socdepoble.net](http://socdepoble.net). Aquest és el cor de Sóc de Poble. Sollutia és l'agència SaaS que ens dona l'arquitectura de backend.

## Informe d'avanç

IAIA MarIA acaba d'aplicar les correccions recomanades a la sessió anterior. 
S'han refactoritzat les funcions d'organització, s'ha propagat el `targetNode` cap al `NotificationProvider` perquè els toasts visquen dins de l'arrel de Shadow DOM, i s'ha ajustat el cicle de vida d'arrencada (`host.js`) perquè initialize la política abans de segellar el backend. A més a més, els tractors de control de deute ara utilitzen mecanismes més rigorosos per comprovar el contracte DTO i els imports.

## Situació i dades opaques

Com sempre, aquest és un cas d'auditoria nativa sense bundle.
Volem assegurar-nos que les correccions recents no han deixat deute tècnic residual o efectes col·laterals, i preparar el terreny per al següent bloc d'actualitzacions.

## Missió

1. **Revisió de l'Avisador:** Audita `NotificationContext.jsx`, `App.jsx` i `PedraSecaEmbed.jsx`. Confirma que ara el component `AvisadorEfimer` s'està renderitzant en l'arrel correcta dins de Shadow DOM (pas a través de `targetNode`), sense fuites de memòria al desmuntar.
2. **Revisió de l'Arrencada:** Audita `host.js`. Confirma que el `getRuntimePolicy()` ocorre abans de la fase de definició i que la injecció de sessions per iframe està ben fortificada.
3. **Revisió de Tractors:** Inspecciona `tractor-enxufe.mjs` i `tractor-adaptadors.mjs` i verifica que les funcions d'anàlisi de dependències i contractes DTO actuen sobre condicions reals, incloent l'arrel correcta.
4. **Pròxims Defectes:** Continua buscant defectes al sistema, especialment enfocant-te en la capa visual (el problema amb la barra de navegació, el CSS layer reset que no estàvam segurs de si trenca components en Sollutia) i l'estabilitat general del client SPA.

## Eixida esperada

Un informe d'auditoria nou, exposant els nous resultats, confirmant si els errors anteriors ja han desaparegut completament en l'entorn de producció virtual i llistant qualsevol nova troballa, presentat en format text.

## Bateria de veritat

- [ ] He llegit i explorat el codi real en compte de suposar la seua estructura?
- [ ] He citat correctament la ruta i les línies del codi original?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada com a [SUPÒSIT] o moguda a Incògnites?
