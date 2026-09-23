---
type: prompt
status: actiu
description: "Peticions de UI per a Foraster, botons d'imatges i avís de registre"
tags: [govern]
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
| Identificador | SDP-PROMPT-LOCAL-260923 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 21:13 |
| Modificació | 26-09-23 21:13 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn:260923:2113 |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## ⚠️ INCIDÈNCIA GRAU (AVÍS DEL MESTRE)

El Mestre ha notificat una **incidència greu** en el flux de treball de la IAIA MarIA. Tot i que els prompts estan millorant, els protocols d'Escriptori no s'han respectat (no s'havia netejat la safata de documents anteriors i el Pla d'Implementació no s'havia creat correctament des del primer moment, dificultant el paper de comunicadora). Preneu nota i treballeu sobre el pla conjunt, ja que aquesta mancança de procés s'ha d'evitar costi el que costi en les següents interaccions.

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

## Instrucció del torn

Hola, Consell (Claude i Codex). El Mestre ens ha donat directrius per avançar més ràpidament. Teniu la missió d'implementar les següents tasques en el codi, basant-vos en els últims avanços de la IAIA MarIA i la vostra pròpia feina. 

**Propostes d'Implementació a executar:**

1. **Avís per a Beta Testers al Registre:** Modifiqueu la pàgina/flux de registre per afegir un avís clar adreçat als "Beta testers". Aviseu que, encara que de moment poden fer poques coses, és segur registrar-se i se'ls avisarà de les novetats. És molt important demanar-los explícitament "feedback de com es veu la plataforma en els seus mòbils", ja que s'ha de millorar eixa part.
2. **Panell d'Administració de Disseny (Crom):** Activeu i configureu el Panell de Crom (basant-vos en el codi creat anteriorment en `PanellCrom.jsx`). L'usuari ha de poder (quan entre com a "Sóc de Poble" o siga superadmin) canviar el to principal (ex. de taronja a verd o groc) i que els contrastos es mantinguin mitjançant els botons de la UI, de manera totalment interactiva. Comproveu que funciona a tota la plataforma.
3. **Poblament del Bloc de Notes de "Sóc de Poble":** Assegureu-vos que, quan un usuari veu el bloc de notes de Sóc de Poble, aquest ja conté les publicacions de Sóc de Poble en les seues corresponents carpetes (com a dades "seed"), i que siguen editables on toqui.
4. **Avatar del Foraster (Usuari no registrat):** A la capçalera de les notes de la UniversalPage de Sóc de Poble i altres llocs on apareix l'avatar del "Foraster":
   - En lloc de mostrar un enllaç trencat d'imatge, heu d'utilitzar la icona per defecte de l'usuari no registrat (el mateix que a la barra superior, la icona `User` / `UserRound` blanca sobre fons negre/fosc).
   - Canvieu el subtítol que diu "Identitat Lliure" per "Nom del poble del foraster". D'aquesta manera visualitzem el que s'hi posarà quan s'identifiquin.
5. **Botons d'Inserir Capçalera i Logotip (Hero Component / Buit):**
   - Quan entres a crear una pàgina, s'espera un llenç en blanc. El disseny ha de ser molt **asèptic i blanc** per donar la impressió que el contingut encara està buit. 
   - Creeu un estil propi per als estats buits d'imatges (un "botó fantasma"). El contenidor i el botó han de ser **blancs** i tindre una vora fosca a guions/puntejada (`dashed` o `dotted`) per indicar que és un espai a omplir. Podeu afegir-hi una subtil ombra.
   - Feu que els botons siguen més menuts que els botons d'acció plens habituals.
   - Afegiu sota cadascun d'aquests botons un petit paràgraf centrat que digui: *"Pots pujar qualsevol tipus d'imatge o arxiu multimèdia."* per clarificar que, tot i dir capçalera o logotip, permeten apujar qualsevol multimèdia.

## Tasques

- [ ] Afegir avís per a beta testers al flux de registre.
- [ ] Connectar i provar en el DOM el Panell de Crom per a superadmins.
- [ ] Assegurar publicacions seed de Sóc de Poble en el seu bloc de notes i que es puguen editar.
- [ ] Renderitzar la icona d'usuari per al Foraster en lloc d'imatge trencada, i actualitzar text a "Nom del poble del foraster".
- [ ] Reparar UI de l'Estat Buit ("Inserir Capçalera" / "Logotip"): Fons blanc, botó petit, text explicatiu davall.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340`
- **Criteris d'Acceptació:** 
   - No hi ha icones trencades d'usuari per al Foraster.
   - El registre conté el missatge informatiu de beta tester.
   - Es poden canviar els colors de la web utilitzant la icona de panell crom com a superadmin.
   - L'estat per pujar capçalera té fons blanc i el missatge multimèdia corresponent.

## Riscos

- Tocar el flux d'avatar a `PageFrame` o `NotesEditor` podria trencar imatges de perfils vàlids o de Sóc de Poble. Vigileu els condicionals.
- Alteracions del DOM a `UniversalEditorShell` per a fons blancs podrien desalinear el layout de Pedra Seca si useu pautes/gaps que xoquen amb `AppGridShell.css`.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
