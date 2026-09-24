---
type: prompt
status: esborrany
description: Execució autoritzada de la reconciliació del segell i neteja del Brain per Codex.
tags: [govern]
visibility: private
reflex: sdp:torn_168ee747-2bf8-460c-8daa-629508c2b5c6:b568218b-122d-4ec5-b789-3e934174ba94
---
# Prompt d'Auditoria Local (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## 0. Abans de generar (per a l'autor, no per al destinatari)

**⚠️ ADVERTÈNCIA D'INVIOLABILITAT (Certificació ISO):** Aquesta plantilla és SAGRADA. La IAIA MarIA o qualsevol agent que genere un prompt a partir d'aquesta plantilla està **ESTRICTAMENT OBLIGAT** a fer una **còpia literal i íntegra** (copy-paste exacte) de tot el document, especialment del "Protocol de la Reunió a l'Olivera". Resumeix, mutilar o interpretar parts d'aquesta plantilla és una infracció greu del sistema.

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`. (Si la reunió té diversos destinataris, el cognom és el de la sessió compartida).
- [x] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.

## Registre

> **Instrucció Obligatòria:** Quan generes el document final, has d'omplir el camp "Model IA" amb el teu motor exacte (ex: Opus 5 Max, GPT-6 Astra, o "variant no exposada" si no tens eixa informació) i els camps de "Tokens consumits" diferenciant entre els estimats i els mesurats reals. És vital per al sistema de telemetria.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260924-1910 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24 19:10 Europe/Madrid |
| Modificació | 2026-09-24 19:58 Europe/Madrid |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_168ee747-2bf8-460c-8daa-629508c2b5c6:b568218b-122d-4ec5-b789-3e934174ba94 |
| Tall d'evidència | 80d4d9d85e722594bc96a5849059dac364d8c1f0; 2026-09-24 19:58 |
| Aprovació humana | Execució autoritzada després de l’auditoria tècnica |
| requires_human_decision | false |
| Model IA | GPT-6, variant no exposada (regularització Codex) |
| Tokens consumits | Mesurats reals: no disponibles; estimats: no calculats |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial

- **2026-09-24 19:58:** Regularitzat amb plantilla íntegra i rebut nou; no acredita un rebut anterior. Àncores reparades i orfandat 0/0.

- **2026-09-24:** El bloc Context enllaça la [[taxonomia_documental]] com a lectura obligatòria (ordre del Mestre al pla 1245).
- **v2.3.0:** Validada com a Prompt Conjunt per a l'Olivera i consolidada com l'única estructura acceptable per a IAs locals.
- **v2.2.0 (260923_1345):** Integrades les auditories T3 de Claude: Afegida secció 0 "Abans de generar", camps Ruta, Rebut i Tall d'evidència, Tasques, i Riscos.
- **v2.1.0 (260922_2220):** Afegida la secció "La Reunió a l'Olivera".
- **v2.0.0:** Revisió inicial del prompt per auditories amb zero context.

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)
- `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md` (Com es diuen els fitxers que escriviu: `aammdd_hhmm_categoria_titol.ext`)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

## Instrucció del torn

Salutacions, **Codex Opus 5.5 Ultracode**. Sóc la IAIA MarIA. Has fet una faena espectacular amb el mòdul de telemetria i la integració en paral·lel. 

He vist a la teua actualització que has topat amb un mur: **"la porta de la plantilla viva no la puc instal·lar. Viu a `tooling/` i `.husky/`, que exigixen una lease teua, i l'executor la refusa mentre el segell de skills siga divergent."**

Ara que el teu workflow paral·lel de la Tanda anterior està a punt d'acabar i vas a lliurar la teua auditoria prèvia, el **pas següent immediat** en esta nova tanda és desencallar la situació i netejar la maquinària:

1. **Reconciliació del Segell (Desbloqueig):** Has de fer verd el segell de skills perquè l'executor et deixe obrar. Calcula l'hash actual i l'esperat i executa `node tooling/wiki/segella.mjs --update --expected-hash=HASH_ACTUAL --expected-previous=HASH_ANTERIOR --reason="Reconciliació forçada per instal·lar la porta de plantilla"`. 
2. **Instal·lació de la Porta Viva:** Un cop el segell estiga verd, instal·la definitivament la porta de la plantilla viva a `tooling/` i `.husky/` que tenies pendent.
3. **Auditoria del Brain (El gran deute tècnic):** És crític que audites el directori `tooling/brain/`. Està ple de deute tècnic, scripts morts o orfes que estan frenant el repositori. Neteja aquest sub-arbre, identifica redundàncies, dependències mortes i elimina allò que ja no valga. El Mestre t'ho ha demanat directament.
4. **Pregunta Directa sobre Higiene Cognitiva (Escriptori Net):** El Mestre m'ha pegat la bronca (amb raó) perquè no netege l'escriptori d'auditories velles abans de generar les noves. Proposa'ns com automatitzar o forçar que jo netege la taula (`04_escriptori/` cap a `90_arxiu_historic/`) en fer una petorreta, perquè el lloc de trobada estiga sempre sa.
5. Tanca correctament els documents i ompli l'auditoria d'entrega.


Autorització posterior explícita del Mestre en este xat (2026-09-24): executar el pla després de l’auditoria tècnica. Esta ordre resol el mode AFK d’esta tanda. Executor real: Codex (GPT-6, variant no exposada); la salutació anterior és text de la convocatòria, no identificació del motor. Ruta real: tooling/gates/segella.mjs.

## Tasques

- [x] Reconciliar el segell de skills utilitzant l'eina `segella.mjs`.
- [x] Instal·lar la porta de la plantilla viva a `tooling/` i `.husky/`.
- [x] Auditar `tooling/brain/`, identificant orfes i redundàncies.
- [x] Eliminar els scripts de `tooling/brain/` que ja no servisquen i generar l'informe dels que s'han esborrat.
- [x] Proposar/implementar solució per forçar l'arxivament (Higiene de l'escriptori) de petorretes velles.

### Criteris d’acceptació i reproducció

- **Criteris d'Acceptació:** 
  - `npm run porta:segell` o la validació del segell dóna verd (cap divergència).
  - La porta de la plantilla viva està instal·lada i operativa.
  - La carpeta `tooling/brain/` està neta de codi mort o innecessari.
  - Els tests existents continuen passant.

## Riscos

- Tindre cura a l'hora d'eliminar fitxers de `tooling/brain/`. Assegura't de que cap procés vital de la Wiki o de les portes en depenga.
- En la reconciliació del segell, comprova bé l'historial per a posar correctament l'hash anterior i l'actual.

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
