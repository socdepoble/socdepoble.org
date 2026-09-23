---
type: prompt
status: esborrany
description: "Prompt per a Claude: Arquitectura, Enxufabilitat amb Sollutia i resolució de la Barra Taronja (UniversalPage)."
tags:
  - govern
---
# Prompt d'Auditoria Local (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`. (Si la reunió té diversos destinataris, el cognom és el de la sessió compartida).
- [ ] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.

## Registre

> **Instrucció Obligatòria:** Quan generes el document final, has d'omplir el camp "Model IA" amb el teu motor exacte (ex: Opus 5 Max, GPT-6 Astra) i el camp "Tokens consumits" amb la teua estimació de despesa de tokens. És vital per al sistema de telemetria.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260923-CLAUDE |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 19:30 |
| Modificació | 26-09-23 19:30 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn:260923 |
| Tall d'evidència | HEAD |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial

- **v2.3.0:** Validada com a Prompt Conjunt per a l'Olivera i consolidada com l'única estructura acceptable per a IAs locals.

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

## Instrucció del torn

Claude, l'objectiu principal del teu torn és **l'Arquitectura del Frontend i la Integració amb Sollutia**. Concretament, se't demanen les tasques següents:
1. **Resolució del problema de la UI:** La IAIA MarIA ha fracassat a l'hora d'intentar restaurar la visibilitat de la barra taronja "Sóc de Poble" (amb l'hora i el cadenat) i la minicard a l'entorn de Desktop (`UniversalPage`). Hem detectat que això es va espatllar en una iteració recent; la barra ha desaparegut en l'escriptori i necessitem que l'arregles garantint la fidelitat a les captures i a la norma de disseny visual. **El Mestre adjunta en aquest missatge les captures de l'estat actual i l'antiga (com hauria de ser) perquè tinguis la referència visual exacta a recuperar.**
2. **Restaurar l'Icona de Configuració (Roda dentada / Engranatge):** En algun moment vam perdre la icona de la roda dentada (engranatge) que permetia dues accions clau per a la graella: "Tornar la graella al seu estat original (reset)" i "Forçar el mode clar/fosc independentment del sistema". Cal tornar-la a afegir a la interfície i recuperar aquesta funcionalitat.
3. **Arquitectura i Enxufabilitat:** Fer una anàlisi profunda del funcionament actual dels mòduls per a garantir la seua "enxufabilitat" directa (plug-and-play) amb els sistemes de backend oferts per Sollutia, de manera que la base del codi mantingui un aïllament d'estat fort i permeti connexions àgils i estables.
4. **Usuaris Reals al Backend:** El Mestre necessita poder iniciar sessió ja mateix com a "Javi Llinares" i que existeixi l'usuari "Sóc de Poble" per poder interactuar amb ell. Has de preparar el necessari en l'adaptador o base de dades (Sollutia/Supabase) perquè aquests dos usuaris estiguin disponibles, i que ell pugui començar a provar el "bloc de notes" des d'aquests perfils.

## Tasques

- Diagnosticar i esmenar el codi relatiu a l'Universal Page (`UniversalEditorShell.jsx`, `PageFrame.jsx` i CSS, `utilities.css`, `layout.css`, etc.) que està causant l'ocultació de la barra taronja i la minicard en l'escriptori.
- Analitzar els arxius de connexió del backend i proposar qualsevol millora d'arquitectura per assegurar la compatibilitat fluida amb Sollutia.
- Provisionar o documentar el flux exacte de credencials perquè el Mestre puga fer login com a "Javi Llinares" i interactuar amb "Sóc de Poble".

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340/notes`
- **Criteris d'Acceptació:** 
  - La barra taronja amb el nom d'autoria, hora i cadenat apareix correctament ancorada sota la barra negra/blava a l'escriptori (es recupera l'estat original de l'app).
  - L'arquitectura amb Sollutia es dictamina llesta o es proposen pedaços concrets i segurs.

## Riscos

- Què pot trencar-se amb aquests canvis? Es pot trencar el comportament `sticky` del disseny responsiu si els `overflow` o regles de posició no s'apliquen amb coneixement del sistema Pedra Seca.
- Quins efectes secundaris preveiem sobre la resta del sistema? Cap, hauria de ser un fix aïllat de CSS/JSX.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260923_1930_pla_implementacio]]
