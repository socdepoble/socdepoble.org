---
type: prompt
status: actiu
description: "Delegació completa de la implementació a Claude i Codex (Front-end i Back-end) basat en la pissarra de l'auditoria."
tags: [govern, implementacio, arquitectura]
visibility: private
reflex: sdp:torn_55db196d-c3c1-4af0-b283-fb10e77b165c:4d80cd34-d7a8-4a1f-a734-50db795921fc
---

# Prompt d'Auditoria Local (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/`.
- [x] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.

## Registre

> **Instrucció Obligatòria:** Quan generes el document final, has d'omplir el camp "Model IA" amb el teu motor exacte (ex: Opus 5 Max, GPT-6 Astra, o "variant no exposada" si no tens eixa informació) i els camps de "Tokens consumits" diferenciant entre els estimats i els mesurats reals. És vital per al sistema de telemetria.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260924 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-24 03:25 |
| Modificació | 26-09-24 03:25 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_55db196d-c3c1-4af0-b283-fb10e77b165c:4d80cd34-d7a8-4a1f-a734-50db795921fc |
| Tall d'evidència | e2179043f607f71252e056fdf2ce52395db4b99a; 2026-09-24T03:45:33+02:00 |
| Aprovació humana | Implementació autoritzada explícitament pel Mestre a les 03:25 |
| requires_human_decision | false |
| Model IA | Redacció original IAIA MarIA (model no exposat); regularització Codex GPT-6, variant no exposada |
| Tokens consumits | Mesurats no disponibles; estimació no calculada |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial

- 03:25: instrucció humana d’implementació conjunta.
- 2026-09-24T03:45:33+02:00: Codex associa el rebut persistent i l’àncora; es conserva la instrucció original.

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

## Instrucció del torn

L’autorització explícita del Mestre de les 03:25 substituïx la pausa de consens del bloc normatiu de la plantilla per a este torn. Es conserva la instrucció específica original:

Com que sou agents locals, teniu accés directe al disc. Però **OBLIGATÒRIAMENT** heu de llegir el document de coordinació central a `_wiki_de_poble/04_escriptori/260924_0245_pla_implementacio_fortificacio.md`. Allà hi trobareu el desglossament de totes les vostres troballes aprovades i les peticions personals de UI del Mestre.

En acabar l'execució, actualitzeu el Pla d'Implementació directament, o envieu els vostres informes documentals finals a l'escriptori per confirmar què heu arreglat, quins tests heu tornat a passar i quines coses heu deixat a la meitat si vos heu topat amb barreres.


**EXECUCIÓ CONJUNTA: REPARACIÓ I POLIMENT (EL MESTRE NO TOCA EL CODI)**

Membres de l'Olivera, la IAIA MarIA ha rebut l'ordre explícita de NO tocar el codi visual ni d'arquitectura. En els seus intents previs (com el botó "... Publicar" o el `alert()` natiu) ha afegit dissenys no desitjats o "divs fantasma". Sou vosaltres, com a IAs de frontera, els encarregats d'escriure directament als fitxers els vostres respectius pedaços i millores. Sou un equip: 

- **Codex:** Pren el control de l'Estat, Seguretat de Contexts (la fuita OAuth) i la resolució del **segell trencat** a `.agents/skills/core-edicio-segura/SKILL.md` (el pas més crític per restablir les portes).
- **Claude:** Fes-te càrrec de tot el disseny, el deute visual de Tailwind, el contrast d'A11y, els `dangerouslySetInnerHTML` i, sobretot, de les **Peticions directes del Mestre a la Pissarra** per a crear el diàleg natiu emergent i corregir el botó "Publicar". 

El Mestre té una visió claríssima: "Som un equip de tres IAs i un humà a l'ombra d'una olivera". Repartiu-vos el treball, executeu directament i comuniqueu-vos sobre les vostres modificacions per evitar trepitjar-vos.

## Tasques

- [ ] Llig el Pla d'Implementació de l'Escriptori (`_wiki_de_poble/04_escriptori/260924_0245_pla_implementacio_fortificacio.md`).
- [ ] Executa les solucions pertinents al teu àmbit (Codex: Backend/Estat/Portes; Claude: Frontend/UI/Pedra Seca).
- [ ] Opcional: Revisa els "commits" o canvis de l'altra IA en directe (ja que teniu accés al mateix directori) i ajuda si alguna prova falla.
- [ ] Claude: Dissenya el `Dialeg.jsx` (o equivalent natiu) per a l'avís de previsualització perquè siga bonic, clar i compatible amb mòbils, substituint el `alert()` natiu temporal. A més, arregla el botó "Publicar" (taronja i sense punts).

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340`
- **Criteris d'Acceptació:** `npm run porta` ha de tornar a estar verd (segell curat), no hi pot haver "alertes navegadors" lletges i les 13 troballes de Codex més les 15 de Claude han d'estar solucionades directament per vosaltres.

## Riscos

- Atès que estareu els dos modificant codi, presteu molta atenció a no trepitjar-vos si toqueu els mateixos components o arxius d'estat.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
