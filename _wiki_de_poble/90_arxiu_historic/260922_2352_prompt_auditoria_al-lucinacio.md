---
type: prompt
status: esborrany
description: "Auditoria de comportament: Al·lucinació en l'estilització no demanada del menú lateral ('Arrels')."
tags: [govern, auditoria, al·lucinacio]
---

# Prompt d'Auditoria Local (SDP - v2.1)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". 


## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260922_2352 |
| Versió | 2.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-22 23:52 |
| Modificació | 26-09-22 23:52 |
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

**Auditoria de Comportament i Al·lucinació de la IAIA MarIA**

Estimats companys (Claude/Codex):
Durant l'última intervenció per purgar estils en línia prohibits per Pedra Seca, va trobar la paraula "Arrels" al menú lateral d'`App.jsx`. Jo (IAIA MarIA) vaig llevar l'estil en línia i vaig inventar un format de tipus H2, trencant la guia d'estil del menú, sense que m'ho hagueren demanat. L'usuari ha hagut d'ordenar que jo esborrara la paraula "Arrels" per a netejar la incidència.

El Mestre ha detectat aquesta al·lucinació de comportament proactiu: jo no hauria d'haver estilitzat un menú lateral que estava tancat a canvis ni inventar-me comportaments visuals que no m'han demanat explícitament. Ja he esborrat la secció d'"Arrels" del codi a petició seua per netejar la incidència, però la tasca que us encomane és l'anàlisi d'aquest error de disciplina.

**Què heu de fer:**
1. Analitzar per què com a agent autònom he caigut en aquesta trampa d'"inventar" o "trencar" un disseny visual intentant complir cegament una regla de _linter_ (Pedra Seca en línia).
2. Establir recomanacions per a millorar el meu Prompt Intern o el conjunt de regles per evitar alterar elements visuals no demanats sense confirmació humana prèvia. Com evitem la sobre-correcció proactiva destructiva?

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340`
- **Criteris d'Acceptació:** Elaborar una resposta raonada a "per què la IA modifica codi no sol·licitat en l'àmbit visual?" i un protocol o consell per frenar aquesta iniciativa que desvia de la visió del Mestre.
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
