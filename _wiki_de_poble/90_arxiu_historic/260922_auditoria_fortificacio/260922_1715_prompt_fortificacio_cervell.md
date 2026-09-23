---
type: prompt
status: esborrany
description: Prompt per a la delegació de la Fortificació del Cervell a les IAs locals.
tags:
  - govern
visibility: private
reflex: sdp:torn_4d508f0f-6dcb-44a1-bdb9-8009d692e276:da83e54f-c5af-4fce-8cf2-f96accaf9f50
---
# Prompt d'Auditoria Local: Fortificació del Cervell (SDP - v1.0)

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4d508f0f-6dcb-44a1-bdb9-8009d692e276:da83e54f-c5af-4fce-8cf2-f96accaf9f50 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-22T15:32:48.317Z |
| Modificació | 2026-09-22T15:32:48.317Z |
| Propietari | codex (importació explícita) |
| Aprovació humana | pendent |

<!-- SDP:SECTION prompt.local.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 4ce8aeddc043d9ff2395ff60857ac82abdb85980e8bb79440d85bd1dc95db43b. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s3 -->
## Historial

2026-09-22T15:32:48.317Z: revisió d’importació; original conservat, revisió editorial pendent.

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

Importació explícita de _wiki_de_poble/04_escriptori/260922_1715_prompt_fortificacio_cervell.md; SHA-256 original d3da6546c8d44c54fbabd631cbff91d788d008e15a3ed6181f4be7425ec57ef5. No acredita una lectura anterior ni revalida les conclusions de l’original.

### Prompt d'Auditoria Local: Fortificació del Cervell (SDP - v1.0)

Actua com a Agent Local Executiu de el Mas Virtual "Sóc de Poble". 

### Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260922-1715 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-22 17:15 |
| Modificació | 26-09-22 17:15 |
| Propietari | IAIA MarIA |
| Plantilla | prompt_local.md (v1.2.0 - corregida en vol) |
| Aprovació humana | aprovat |

### Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució del **Pla d'Implementació Mestre** a les IAs de frontera (Codex i Opus). A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

### Historial

- 2026-09-22T17:15:00: Prompt generat per MarIA després de l'aprovació del Mestre de les 8 fases d'Opus i les 5 de Codex.

### Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

### Tasca

Heu d'executar el **Pla d'Implementació Mestre** (que fusiona les auditories de Codex i Opus). Teniu a l'Escriptori els següents plans aprovats:
- `260922_0643_pla_implementacio_cervell.md` (Codex)
- `260922_1455_pla_implementacio_claude.md` (Opus)

A més, el Mestre respon a les preguntes pendents d'Opus amb aquestes directives clares:

1. **Zona Humana (`01_produccio`):** Ja he executat el `git checkout HEAD` personalment. Els fitxers estan recuperats. Procediu amb P-1 (Vigilància via hash a `turns.mjs`).
2. **Torns a Git:** SÍ que volem versionar `.agents/runtime/turns/`. Apliqueu la lògica necessària perquè el Fresh Clone (P-0/P-7) funcione correctament i versionem l'historial de torns al repositori.
3. **El Somiador:** Tal com indicava Opus a la fase P-3, NO executeu el somiador hui. Feu que respecte la taula abans de fer res.
4. **Estratègia d'Indexació (Broken Links):** El Mestre ha plantejat un dubte arquitectònic: quan arxivem un document de l'Escriptori a l'Arxiu Històric, els enllaços interns tipus `[[00_index_escriptori]]` queden orfes o descontextualitzats. Dins del vostre pla d'implementació o acta, proposeu quina és la millor estratègia d'indexació per al Brain perquè el graf de coneixement estiga fortament connectat (més enllà d'etiquetes i categories) i no es trenque amb el cicle de vida.
5. **Investigació d'Amnèsia de Plantilles:** El Mestre està frustrat. Per a generar aquesta petorreta, he sigut incapaç de copiar la plantilla original sencera a la primera (he omés el context del Rentonar i he inventat encapçalaments nous). Per què ens passa açò? Per què una IA tendeix a "resumir" o mutilar el context rígid d'una plantilla en comptes de respectar-lo fidelment quan genera un prompt nou? Investigueu què estem fent malament a nivell sistèmic o de definició de plantilles perquè no hàgem de perdre un temps valuós corregint prompts cada volta que en generem un.

**Ordre d'execució:**
Feu la prova en sec (Fresh Clone) com a primer pas per identificar on es trenca (P-0). Després, implementeu les reparacions P-1 a P-7 (Taxonomia de 8 dimensions, Sincronització, Reparació Documental, Reparació de Portes i Seguretat al README).

### Protocol de la Reunió a l’Olivera

En acabar la teua execució, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua acta o auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md` (o bé _acta).
3. **La Reunió a l'Olivera:** Funcioneu com un equip. Si eres la segona IA a intervenir, OBLIGATÒRIAMENT has de llegir el Pla d'Implementació que puga haver a l'escriptori, així com l'Auditoria que haja deixat la IA anterior. Comenta-la, critica-la o aprofita el que ja ha descobert la teua companya per portar l'anàlisi més lluny. Després, l'humà intercedirà en el prompt per fer-vos dialogar si cal (com si estiguéreu parlant a l'ombra de l'olivera de la porta del Mas).
4. **Millora Contínua:** No oblides arreglar l'arxiu `prompt_local.md` original (Fase P-4) perquè la pròxima volta no haja de forçar jo manualment els encapçalaments en generar-lo!

### Vincles
- [[00_index_escriptori]]
- [[00_index]]


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
