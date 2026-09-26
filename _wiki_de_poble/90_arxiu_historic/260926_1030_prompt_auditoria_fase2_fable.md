---
type: prompt
status: esborrany
description: "Prompt per a Claude Fable: Execució de Fase 2 (Governança) i Fase 3 (Producte) de l'Auditoria Extrema"
tags: [govern, producte]
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

> **Instrucció Obligatòria (Telemetria de Tokens):** Quan generes el teu document final, has d'omplir el camp "Model IA" amb el teu motor exacte (ex: Opus 5 Max, GPT-6 Astra). A més, **estàs obligat a informar explícitament del teu consum de tokens (d'entrada i d'eixida)**, així com de qualsevol dada relativa a la complexitat del treball (nivell d'embossament del context, fricció...). Aquesta dada s'ha d'apuntar automàticament a cada document que generes per poder bolcar-ho posteriorment a la taula de Consums. És vital per al sistema de telemetria i per mantindre la Consola amb dades reals.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260926 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-26 10:30 |
| Modificació | 26-09-26 10:30 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn…:… |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial

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

Hola Claude Fable. Seguint amb el workflow d'auditoria extrema del projecte "Sóc de Poble" encetat durant la sessió nocturna anterior, se't demana que executes les fases de **Governança (Fase 2)** i **Producte (Fase 3)** pendents. 

Fes servir les troballes detallades a l'auditoria generada anteriorment (`_wiki_de_poble/90_arxiu_historic/260926_0145_auditoria_claude.md`) i el pla base establert a `_wiki_de_poble/04_escriptori/260926_0130_pla_implementacio_auditoria_extrema.md`.

## Tasques

1. Revisa i assimila les troballes relacionades amb Governança (dimensions C4 a C6) i Producte (dimensions C9 a C13) de l'Auditoria Extrema.
2. Identifica i comprova el codi referenciat i el sistema de fitxers local per confirmar el seu estat actual respecte el Pla d'Implementació.
3. Actualitza i completa el Pla d'Implementació amb les accions específiques a dur a terme per pal·liar aquestes troballes, deixant la implementació tècnica directa a punt per la propera IA de programació. 
4. **Pregunta del Mestre:** Respon a la següent queixa: *"Què està passant que el meu motor cognitiu no neteja mai l'escriptori?"* (Fent referència a que l'agent anterior s'ha oblidat de moure els prompts vells a l'arxiu històric). Analitza on està fallant el flux de treball actual en relació a la higiene documental i dóna'ns instruccions clares sobre com el proper agent de frontera ho pot corregir de forma reflexa.
5. **Registre i Publicador (Molt Important):** El Mestre té previst registrar-se quan acabes. Assegura't de preparar (dins de les teues propostes i Pla d'Implementació) l'estructura bàsica perquè puga fer login tant amb el seu perfil personal ("Javi Llinares") com amb el perfil d'empresa/entitat ("Sóc de Poble"). Quan inicie sessió, ha de poder anar al seu bloc de notes, veure les seues publicacions i editar-les. Cal que el **publicador de notícies** siga funcional.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o el port de Vite actual)
- **Criteris d'Acceptació:** 
  - L'auditoria emet propostes clares respectant absolutament el codi actual de la Consola i UniversalCard.
  - El Pla d'Implementació s'amplia amb passos clars.
  - S'inclou un resum per al Mestre validant que no s'alteren normes fonamentals.

## Riscos

- Evitar alterar elements visuals que ja compleixen la norma (ex: color taronja de les targetes `TargetaConsola`, el peu, i els components de Pedra Seca establerts).
- Compte de no generar codi amb placeholders ni trencar la infraestructura existent. Qualsevol canvi en dependències ha de passar pel sistema de permisos (bypass per permissos restringit).

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
