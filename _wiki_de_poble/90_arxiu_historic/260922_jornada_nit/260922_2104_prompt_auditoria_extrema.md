---
type: prompt
status: esborrany
description: Revisió profunda de la plataforma abans de connectar el backend.
tags:
  - govern
visibility: private
reflex: sdp:torn_d8b7ed3e-a176-48e2-bbd4-84ac7cf9fe76:5f20c843-fb69-447c-ac45-6e80d755e366
---
# Auditoria Extrema a Sollutia

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble".

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d8b7ed3e-a176-48e2-bbd4-84ac7cf9fe76:5f20c843-fb69-447c-ac45-6e80d755e366 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T19:10:02.792Z |
| Modificació | 2026-09-22T19:10:02.792Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v2.0.0) |

<!-- SDP:SECTION prompt.local.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 4ce8aeddc043d9ff2395ff60857ac82abdb85980e8bb79440d85bd1dc95db43b. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s3 -->
## Historial

2026-09-22T19:10:02.792Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s4 -->
## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

<!-- SDP:SECTION prompt.local.s5 -->
## Tasca

Estem a punt d'integrar el backend amb Sollutia. L'usuari ens ha donat autonomia total (Mode AFK 100%) i necessita saber amb absoluta certesa si el sistema és prou segur i estable per a realitzar aquesta integració.

**Objectiu:** 
1. Esmicolar (desmuntar) tota l'aplicació web i realitzar una auditoria extrema de la integritat del codi, l'estat dels components i l'arquitectura.
2. Identificar els errors crítics o el deute tècnic restant que puga ser un bloqueig per a la integració amb l'API de Sollutia.
3. Avaluar si els mòduls poden funcionar aïlladament respecte de les dades.
4. Elaborar un diagnòstic clar, sincer i descarnat: **Estem preparats per endollar la base de dades i l'autenticació de Sollutia o se'ns caurà el sistema?**

**Autorització (Consell de Guerra):** Teniu permís total per llegir tot l'arbre, analitzar el `package.json`, explorar les rutes de Vite i revisar l'estructura. El Mestre està absent (AFK). 

**Resultat Esperat:** Un informe detallant si hi ha lligams trencats, estat real de la plataforma, quants forats de seguretat hi ha, i la llum verda (o roja) per a Sollutia.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera:** Funcioneu com un equip. Si eres la segona IA a intervenir, OBLIGATÒRIAMENT has de llegir el Pla d'Implementació que puga haver a l'escriptori, així com l'Auditoria que haja deixat la IA anterior. Comenta-la, critica-la o aprofita el que ja ha descobert la teua companya per portar l'anàlisi més lluny. Després, l'humà intercedirà en el prompt per fer-vos dialogar si cal (com si estiguéreu parlant a l'ombra de l'olivera de la porta del Mas).
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

<!-- SDP:SECTION prompt.local.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
