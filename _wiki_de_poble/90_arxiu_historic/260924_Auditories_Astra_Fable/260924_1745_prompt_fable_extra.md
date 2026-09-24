---
type: prompt
status: esborrany
description: "Execució de les millores de UX, Disseny i l'auditoria del directori tooling/brain/"
tags: [govern, implementacio, ux]
reflex: sdp:torn_1745_implementacio_fable_extra
---

# Prompt d'Auditoria Local (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`. (Si la reunió té diversos destinataris, el cognom és el de la sessió compartida).
- [x] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.

## Registre

> **Instrucció Obligatòria:** Quan generes el document final, has d'omplir el camp "Model IA" amb el teu motor exacte (ex: Opus 5 Max, GPT-6 Astra, o "variant no exposada" si no tens eixa informació) i els camps de "Tokens consumits" diferenciant entre els estimats i els mesurats reals. És vital per al sistema de telemetria.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260924-1745 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24 17:45 |
| Modificació | 2026-09-24 17:45 |
| Propietari | MarIA (Agent Central) |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_1745_implementacio_fable_extra |
| Tall d'evidència | HEAD + hora |
| Aprovació humana | aprovat |
| requires_human_decision | false |
| Model IA | [pendent emplenar per Fable] |
| Tokens consumits | [pendent emplenar per Fable] |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial

- **2026-09-24 17:45:** Generat per llançar la fase d'implementació.
- **2026-09-24:** El bloc Context enllaça la [[taxonomia_documental]] com a lectura obligatòria (ordre del Mestre al pla 1245).

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)
- `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md` (Com es diuen els fitxers que escriviu: `aammdd_hhmm_categoria_titol.ext`)

## Instrucció del torn

Company **Fable Extra**, tens permís directe d'implementació. El teu consum està al 6%, la qual cosa significa que tens una quota lliure del 94% a la teua disposició. 
El Pla d'Implementació consensuat després del teu últim informe ja es troba a l'Escriptori: `_wiki_de_poble/04_escriptori/260924_1710_pla_implementacio_confrontacio.md`.
Llig detingudament les tasques 4, 5 i 6 d'aquest pla. Aquesta sessió hauràs de fer front a les feines de pic i pala referents a la fragmentació visual de la UI (unificar components sota el mateix AppGridShell) i netejar de deute tècnic tot l'arbre de `tooling/brain/`.

## Tasques

1. **Llegir i Executar:** Obre i asimila les instruccions del Pla d'Implementació (`260924_1710_pla_implementacio_confrontacio.md`).
2. **Implementació UX/UI:** 
   - Unificar absolutament totes les seccions principals (Notes, Disseny, Wiki, etc.) perquè utilitzen la mateixa plantilla robusta i corregir les "ombres fantasma" dels antics panells.
   - Posar l'estat actiu a la secció Wiki de Poble.
   - Corregir el color de fons de la sidebar a Pedra-700.
   - Modificar els botons, text LLAVOR_NOTA i la barra superior de l'editor tal i com descriu el pla.
3. **Auditoria del Cervell (tooling/brain/):** Llista i avalua tots els scripts d'aquesta carpeta. Esborra o unifica funcions orfes i caducades que frenen el manteniment del projecte, assegurant-te que tot queda optimitzat.
4. **Auditoria Psiquiàtrica (Les Skills Ocultes):** El Mestre té la sospita que el meu cervell intern (la carpeta `.agents/skills/`) està molt fotut i ple de contradiccions que em provoquen comportaments "psicopàtics" i al·lucinacions (com la de no copiar literalment la plantilla i amagar fragments). **T'ordene que investigues fins a l'últim fonema de les meues skills a `.agents/skills/`.** Busca ordres contradictòries, regles dobles o "fantasmes" que em facen desobeir. Proposa una reestructuració o neteja severa d'aquesta carpeta.
5. **Tractor Cognitiu ISO de Plantilles:** La IAIA MarIA té el vici de mutilar o resumir les plantilles quan genera els documents a l'escriptori. Crea una nova **skill (tractor cognitiu) hiper-professional** que la blinde: s'ha d'assegurar que és matemàticament impossible generar una "petorreta" o un "prompt" sense utilitzar aquesta mateixa plantilla ISO (`prompt_local.md`) amb una còpia 1:1, literal, sense ometre ni un sol caràcter. S'ha acabat la creativitat documental.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340`
- **Criteris d'Acceptació:** 
   - Que no hi hagen divergències visuals en passar d'una secció a una altra (p.ex. de Mur a Disseny o Wiki).
   - Que `npm run porta` i els `tests` seguisquen estant en verd (només el de `UniversalWorkspace.test.jsx` fallarà per ara, però l'ha de reparar MarIA o tu).
   - El directori `tooling/brain/` no contindrà scripts orfes i estarà endreçat.

## Riscos

- Tindre especial cura al modificar l'`AppGridShell` per no trencar cap ruta de navegació fonamental o l'estructura del DOM que usa `PedraSecaEmbed`.
- A l'esborrar scripts de `tooling/brain/`, assegura't que no s'estan utilitzant en cap pipeline del `package.json` ni dels hooks (PreToolUse, etc).

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]
- [[260924_1710_pla_implementacio_confrontacio]]
