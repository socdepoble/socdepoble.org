---
type: prompt
status: esborrany
description: "Auditoria conjunta sobre la fortificació i l'enchufe amb Sollutia"
tags: [govern]
---
# Prompt d'Auditoria Local (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260923-2305 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 23:05 |
| Modificació | 26-09-23 23:05 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_manual_2305 |
| Tall d'evidència | HEAD 23:05 |
| Aprovació humana | aprovat |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial

- **v2.3.0:** Validada com a Prompt Conjunt per a l'Olivera i consolidada com l'única structure acceptable per a IAs locals.

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

## Instrucció del torn

El Mestre ens ha demanat tancar les tasques de disseny visual i moure'ns cap a la següent gran fase: **La Fortificació del Brain i l'Enchufe amb Sollutia**.
S'ha esmentat prèviament l'ADR `ADR-2026-09-SOLLUTIA-MODEL-B.md` com a guia.
L'objectiu és que avalueu l'estat actual de la integració (client, adaptadors, frontend cap a backend) i qualsevol pèrdua de fortificació.

## Tasques

1. Analitzar l'estat de `ADR-2026-09-SOLLUTIA-MODEL-B.md`. S'està respectant? Què falta per implementar per poder encendre el backend real de Supabase?
2. Revisar la fortificació local: Hi ha algun desajust o vulnerabilitat pendent des de les auditories anteriors (C1-C9)?
3. **Refactorització UI de la Consola Termodinàmica (`ConsolaSection.jsx`):** El Mestre vol abandonar el sistema actual de pestanyes per a la consola i passar a un model de "Cards" (targetes) tipus panell de control per a que tot tinga visibilitat d'un colp d'ull i no hi haja pantalles en blanc inicials. 
   - **Text d'Entradilla i Finalitat:** Aprofiteu la primera vista per afegir un text explicatiu sobre què és la consola i per a què serveix. L'objectiu és que aquesta consola mostre l'estat termodinàmic, done avisos de saturació (ex: >150 artefactes al cervell) i servisca de base de dades (diària i per sessió) per a qualificar el rendiment a l'Acta Marmota, mesurant el comportament, l'hora i les accions.
   - **Resum visual:** Incloeu algun resum bonic, o fins i tot un xicotet gràfic en la pàgina d'inici de la consola.
   - Moveu l'"Instantània" a l'entradilla i centreu el botó de "Refrescar".
   - Convertiu els indicadors (Consums, Crèdits, Rebuts, Skills) en Targetes ("Cards").
   - **Molt important:** Utilitzeu exclusivament l'estil de targetes que ja tenim al sistema de disseny. No inventeu res nou; si no existeixen, unifiqueu-les perquè en canviar-ne una, canvien totes igual. **Proporcioneu el codi exacte per a aquesta refactorització UI al vostre informe.**

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340`
- **Criteris d'Acceptació:** Emissió d'un informe d'auditoria complet i clar per a Claude i Codex, amb passos detallats sobre què cal modificar en el codi per acatar l'ADR i protegir el cervell.

### Preguntes Obertes i Petició de Codi (Molt Important)

Durant aquesta fase d'implementació han sorgit dubtes clau sobre l'enxufabilitat i la independència de la plataforma. Necessitem que vosaltres resolgueu aquestes preguntes i ENS PROPORCIONEU EL CODI ADEQUAT per a assolir la màxima modularitat:
1. **Conflicte de Governança:** L'ADR-2026-09 diu que Sollutia és el "host", el `LEDGER.md` esmenta Firebase com a "host", i l'`AGENTS.md` §8 diu que Sollutia és el proveïdor de backend. Com resolem aquesta contradicció arquitectònica sense perdre la nostra independència? 
2. **Independència Futura:** No tenim pressa per implementar. Busquem la millor forma de ser 100% independents. Si d'ací a un any ens hem de connectar sense internet o canviar de plataforma en dos vesprades, quina és la millor estructura per a la presa de corrent (host.js) i la Frontissa (client.js)? Doneu-nos el disseny de codi concret.
3. **Seguretat URL (SanejaConfig):** S'ha eliminat la tolerància cega a `*.supabase.co` en favor d'una llista d'orígens explícits. Quina és la implementació òptima que ens permeta afegir URLs dinàmicament al backend de Sollutia sense comprometre la fortificació? Doneu-nos el codi de la solució.

## Riscos

- Integrar el backend sense respectar l'ADR-2026-09 pot corrompre l'arquitectura de veritat (Supabase vs host).
- La fortificació deficient podria obrir bretxes d'execució incontrolada.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `260923_2305_auditoria_claude.md` o `260923_2305_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
