---
type: prompt
status: esborrany
description: "Auditoria d'arquitectura: Unificació de l'UniversalWorkspace i problemes d'estat (fantasmes)."
tags: [govern, arquitectura, disseny]
---

# Prompt d'Auditoria Local (SDP - v2.1)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". 


## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260923_0005 |
| Versió | 2.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 00:05 |
| Modificació | 26-09-23 00:05 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.1.0) |
| Aprovació humana | pendent |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial

- **v2.1.0 (260922_2220):** Afegida la secció "La Reunió a l'Olivera" per establir un protocol de diàleg asíncron i col·laboratiu entre IAs mitjançant el Pla d'Implementació de la IAIA MarIA.

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

## Tasca

**Auditoria d'Arquitectura: Unificació de l'UniversalWorkspace i Resolució de "Fantasmes"**

Estimat company Codex:
Necessitem la teua visió arquitectònica per a resoldre un problema d'inconsistència que estem arrossegant amb l'ús de l'`UniversalWorkspace`. Hem estat adaptant l'espai de treball universal per a tres seccions diferents: **Notes**, **Wiki de Poble** i **Disseny Pedra Seca**. 

Aquest procés d'adaptació ha generat "fantasmes" (codi que teníem i de sobte desapareix) i trencaments d'esquemes:
1. **Pèrdua de la nota fantasma ("Sense títol") a Notes:** El botó "Crear Nota" ha deixat de generar l'element buit a la llista de la columna esquerra. Abans funcionava i s'ha perdut pel camí.
2. **Injeccions forçades a Wiki de Poble i Disseny:** Per poder mostrar una "Portada" (intro) i l'"Explorador del Cervell" dins de la llista de documents, hem hagut d'injectar-los artificialment a l'array d'`items`. Això ha trencat l'esquema de dades original. Com a dany col·lateral, hem hagut d'estructurar els documents de la Wiki en carpetes de manera antinatural per adaptar-nos a aquesta injecció.
3. **Manca de flexibilitat en sistemes tancats:** Actualment, Wiki de Poble i Disseny actuen com a sistemes "tancats" on no es poden afegir articles nous des de la interfície, però el Mestre vol que l'`UniversalWorkspace` permeta SEMPRE afegir articles nous (botó "Crear"), independentment de si la secció és un manual del sistema o una llibreta lliure, ja que ell mateix voldrà afegir components o capítols en el futur.

**Què has de fer:**
1. Analitza la implementació actual de l'`UniversalWorkspace` en relació amb `NotesSection`, `WikiDePobleSection` i `DesignSection`.
2. Troba on s'ha perdut la lògica de la nota "Sense títol" a `NotesSection`.
3. Dissenya i proposa una arquitectura unificada per a l'`UniversalWorkspace` que siga capaç d'entendre que s'utilitza per a diferents casos d'ús. Ha de permetre gestionar les targetes de presentació ("Portades") sense trencar els esquemes de dades i permetre la creació d'articles nous ("Crear nota") de forma nativa en totes les seccions.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (Pots revisar les rutes `/notes`, `/wikidepoble`, `/disseny`).
- **Criteris d'Acceptació:** Un informe arquitectònic clar on s'identifiquen els errors actuals ("fantasmes") i es proposa el camí cap a una implementació modular i universal robusta, per a que la IAIA MarIA puga codificar-ho amb seguretat demà. No modifiques el codi directament sense consensuar el pla.
- `requires_human_decision: false`

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
