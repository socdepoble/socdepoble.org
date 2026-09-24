---
type: prompt
status: actiu
description: "Auditoria ULTRA d'escombratge profund exclusivament per a Claude (ultracode) abans del reset de quotes."
tags: [govern, auditoria]
visibility: private
reflex: sdp:torn_55db196d-c3c1-4af0-b283-fb10e77b165c:e813936f-5375-4095-9764-3ed4a2040094
---

# Prompt d'Auditoria Local - MODE ULTRA (SDP - v2.3)

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
| Identificador | SDP-PROMPT-ULTRA-260924 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-24 04:00 |
| Modificació | 26-09-24 04:00 |
| Propietari | Claude (ultracode) |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_55db196d-c3c1-4af0-b283-fb10e77b165c:e813936f-5375-4095-9764-3ed4a2040094 |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | Autoritzat pel Mestre per esgotar la quota abans del reset (04:00) |
| requires_human_decision | false |
| Model IA | Claude Opus 5 Max (ultracode) |
| Tokens consumits | Mesurats no disponibles; estimació no calculada |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial

- **v2.3.0:** Validada com a Prompt Conjunt per a l'Olivera i consolidada com l'única estructura acceptable per a IAs locals.
- **v2.2.0 (260923_1345):** Integrades les auditories T3 de Claude: Afegida secció 0 "Abans de generar", camps Ruta, Rebut i Tall d'evidència, Tasques, i Riscos.
- **v2.1.0 (260922_2220):** Afegida la secció "La Reunió a l'Olivera".
- **v2.0.0:** Revisió inicial del prompt per auditories amb zero context.

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

## Instrucció del torn

Nota original de destinació: informe AAMMDD_HHMM_auditoria_ultracode o auditoria_ultra.

**Context de l'Auditoria Actual:**
Hem superat la fortificació global amb els 161 tests de React i 197 de Node en verd. Has deixat a l'escriptori la teua auditoria prèvia on hi ha 3 decisions estètiques pendents (blau primari, degradat d'encapçalaments de la Wiki, quadre ISO). Aquest és un escombratge profund llançat just abans d'anar a dormir, per a aprofitar el 26% de quota restant d'Opus 5 Max abans que es reinicie.

**Contrast Codex 04:15:** les xifres de proves descriuen passades parcials. El build ha passat, però `npm run porta` encara no és verd. La regularització d’este document no certifica una fortificació global ni activa esta nova auditoria en la conversa Codex.


**ESCOMBRATGE GLOBAL DE DEUTE TÈCNIC, DISSENY I ACCESSIBILITAT**

Vull que utilitzes **tota la teua profunditat de context i temps de càlcul** per a buscar problemes ocults que no hages vist abans. Examina el repositori sense por. Pots prendre't el teu temps per analitzar, pensar i proposar solucions. Si et quedes sense memòria a mitjan camí, no et preocupes, fes el que pugues i deixa'ns un informe amb tot el que trobes.

## Tasques

**0. Missió Crítica: Fiabilitat dels Tractors Cognitius:** La IAIA MarIA ha patit una fallada greu ("incidència greu") en generar aquest mateix prompt inicialment: ha omès tota la meitat inferior de la plantilla `prompt_local.md` (Riscos, Tasques, Reunió a l'Olivera) tot i tindre ordres estrictes de seguir-la. El Mestre necessita que els tractors cognitius siguen inmutables i 100% fiables; no pot haver-hi sorpreses. Analitza per què el sistema de 'skills' o les instruccions de context de la IAIA permeten aquesta degradació de l'atenció ("Stochastic Parrots") i proposa una solució arquitectònica radical i definitiva (nous tractors, regles al `AGENTS.md` o canvis a la Wiki) perquè l'aplicació de plantilles siga mecànica, infal·lible i indestructible.

1. **El deute estètic i la Pedra Seca:** Resol aquelles 3 decisions pendents si trobes un camí segur, o prepara'ns una prova de concepte de com resoldre el contrast primari o el `style` prohibit.
2. **Accessibilitat extrema:** Revisa la resta de l'aplicació per veure on fallem estrepitosament a nivell de W3C o SEO.
3. **Components oblidats:** T'has adonat de l'`AgendaSection` i les seues etiquetes? Buscàvem reutilitzar-ho per a posar-ho a l'`UniversalPage`. Examina els arxius de l'agenda i compta'ns en quina situació es troben per reaprofitar-los com un xicotet giny de calendari al selector de data.
4. **Estat buit de la targeta (Placeholder UI):** A la llista de notes del Workspace, quan una nota és nova/buida, ara mateix només es veu 'Sense títol'. Actualitza la lògica perquè la targeta mostre exactament els mateixos textos "placeholder" que l'editor: com a subtítol "No es recomana posar punt final per a títols i subtítols" i com a entradeta "El text que poses ací també es vorà a la targeta (card) o miniatura d'aquesta publicació.". **Important:** Ha de ser una targeta completament neta (sense categories, sense etiquetes, sense copyright i sense imatge). Només els tres textos esmentats, per veure l'esquelet perfecte d'una targeta buida.
5. **Icona d'estat d'edició (La Ploma):** A l'editor, la icona per defecte al costat de la data (ara mateix una 'i' d'informació) ha de ser una icona de redacció (com una ploma o llapis, ex: `PenLine` o `FileEdit`). Aquesta icona té un comportament especial: només és visible dins de l'editor (perquè l'usuari sàpiga que pot fer clic i canviar-la). Si l'usuari no en tria cap altra, aquesta icona **desapareix de la targeta (card) i de la pàgina publicada**, ja que allà només s'han de mostrar icones triades explícitament. Per tant, a la previsualització de la targeta buida (a l'esquerra), no s'ha de mostrar cap icona. Evidentment, dins de l'editor la ploma es manté sempre visible si no se n'ha triat cap, perquè cal poder fer-hi clic sempre.
6. **Estandardització d'altures (Pedra Seca):** Hem detectat una desalineació visual. L'altura de les barres principals (siga la barra blava de l'editor, la "boina" taronja de les targetes, o els peus blaus) ha de ser sempre **exactament 58px**. Això aplica tant a les targetes (`UniversalCard`) com a les pàgines (`UniversalPage`). Estandarditza l'altura i elimina qualsevol discrepància als arxius CSS.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o el port de Vite actual)
- **Criteris d'Acceptació:** Completar una auditoria profunda i generar un informe d'almenys 3 troballes.

## Riscos

- Tocar el contrast primari podria trencar l'accessibilitat d'altres elements en mode fosc.
- No tens permís per editar els fitxers arrel de la Wiki, només pots diagnosticar-los.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
