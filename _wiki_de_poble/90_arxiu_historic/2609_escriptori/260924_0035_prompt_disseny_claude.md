---
type: prompt
status: actiu
description: Petorreta de disseny visual i rectificació de la Card a NotaFitxa per a Claude
tags: [disseny, ui, frontend]
destinatari: claude
---
# Prompt d'Auditoria Local (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [ ] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [ ] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`. (Si la reunió té diversos destinataris, el cognom és el de la sessió compartida).
- [ ] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.

## Registre

> **Instrucció Obligatòria:** Quan generes el document final, has d'omplir el camp "Model IA" amb el teu motor exacte (ex: Opus 5 Max, GPT-6 Astra, o "variant no exposada" si no tens eixa informació) i els camps de "Tokens consumits" diferenciant entre els estimats i els mesurats reals. És vital per al sistema de telemetria.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260924 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-24 00:35 |
| Modificació | 26-09-24 00:35 |
| Propietari | IAIA MarIA |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | _wiki_de_poble/04_escriptori/260924_0035_prompt_disseny_claude.md |
| Rebut | pendent |
| Tall d'evidència | HEAD |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | Claude |
| Tokens consumits | [pendent] |

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

Mestre Claude, el Mestre necessita la teua ajuda per fer uns ajustos purament visuals al disseny del **Bloc de notes** i de la **Live Preview**. Les IAs locals m'han ordenat delegar-te aquesta tasca d'artesania front-end per assegurar-nos que els divs queden nets i l'arquitectura es manté intacta.

Ací tens els manaments directes:

### 1. Neteja de la Barra Taronja (Llevar els Tres Puntets)
Al fitxer **`src/sections/notes/NotesEditor.jsx`** (i els seus components relacionats com `DocumentEditor.jsx` / `UniversalPage.jsx`):
- El Mestre està fart de veure el botó dels **tres puntets** (`MoreVertical` dins de `AccionsIdentitat`). Ens ha demanat textualment: *"Quita este botón de la plantilla... Que desaparezca. Que no existe"*. 
- **Acció:** Elimina l'enviament de `identityActions` cap al `DocumentEditor` per suprimir completament el menú desplegable a la caputxa taronja. Allà dalt només hi ha de quedar la data i hora.

### 2. Moure la "Bola del Món" a la Caputxa Taronja
- Actualment, a l'esquema de **`src/components/universal/PageFrame.jsx`**, el botó de Traduir (bola del món) es pinta a la barra blava (a la zona `.sp-card-actions`). 
- **Acció:** El Mestre vol que aquest botó s'ubique precisament a la **caputxa taronja** (barra taronja, `.bar-actions`), compartint espai amb la Data i l'Hora. Fes la lògica per moure aquest botó específic cap allà dalt i lleva de pas qualsevol altre botó sobrant d'eixe espai.

### 3. Disseny "Flat" (Rectangular) a la Live Preview (NotaFitxa.jsx)
Al fitxer **`src/sections/notes/NotaFitxa.jsx`**, l'estat actiu (`if (active)`) ara renderitza una `UniversalCard` per defecte, cosa que significa cantons redonits i ombra (box-shadow). Segons el Mestre, *«queda muy mal los cantos redondeados dentro de esta columna»*.
- **Acció:** Has de redissenyar o adaptar la Card renderitzada a `NotaFitxa.jsx` perquè siga **completament rectangular** (`rounded-none`, sense `border-radius`) i sense cap tipus d'ombra (`shadow-none`). Però la resta de la targeta ha de ser **IDÈNTICA** a la vista acabada, incloent la caputxa taronja, el peu blau, l'entradeta i l'H1/H2.
- L'adaptació ha d'aplicar-se tant a la **caputxa taronja** superior com al **peu blau** inferior.
- Has de mantindre **divs nets** però assegurar-te que es mostre tota la informació:
  1. Elimina la icona del cadenat (`Lock`), no la vol veure.
  2. Afegeix l'H1 (títol de la nota).
  3. Afegeix el subtítol (H2).
  4. Afegeix l'entradeta / excerpt.
  5. Assegura't de llistar les etiquetes i el Copyright (*© Sóc de Poble*).
  6. Si dins d'aquesta targeta de preview hi ha la bola del món (Traduir), aplica-li la mateixa norma que al DocumentEditor (fes-la visible a la caputxa taronja de la targeta viva).

### 4. Unificació del Botó de Data i Hora (PROHIBIT INVENTAR)
El Mestre s'ha adonat que el botó de data i hora de la targeta de Notes no és el mateix que la resta de targetes o del sistema. 
- **Acció:** Fes que el botó de data i hora de la targeta siga **EXACTAMENT** el mateix component que s'utilitza en tot el sistema (enllaçat o renderitzat igual). Hi ha d'haver només un botó de data i hora.
- **Pregunta del Mestre per a tu (Claude):** Si us plau, documenta a la teua auditoria o comentaris **per què està passant això**. Per què, en lloc de reutilitzar el component base de l'arquitectura, t'has inventat un botó de data i hora diferent o amb estructura pròpia? Entén que açò trenca l'Arquitectura Pedra Seca i li dóna molta ràbia al Mestre perquè no sap si has trencat altres coses darrere l'escena. Evita "l'Stochastic Parroting".

Si us plau, executa aquests canvis amb precisió i cura, assegurant-te que no pete cap component. Confiem en la teua olivera. Endavant!
## Tasques

- [ ] Aplicar disseny rectangular a NotaFitxa.jsx sense ombres.
- [ ] Replicar exactament el contingut a la Card (H1, H2, entradilla, peu blau).
- [ ] Moure botó de Traducció a la caputxa taronja.
- [ ] Eliminar els tres puntets de NotesEditor.jsx.
- [ ] Unificar el botó de data i hora amb el de la resta del sistema.
- [ ] Respondre per què s'inventen components en compte de reutilitzar-los.
### Criteris d’acceptació i reproducció

- **URL de proves locals:** (per exemple, `http://localhost:3340` (o el port de Vite actual))
- **Criteris d'Acceptació:** (Llista breu del que ha de complir el codi per donar la tasca per finalitzada)

## Riscos

- Trencar els Error Boundaries si es trau algun Context o Provider.
- Trencar el disseny responsive de la graella.
- Trencar els estils generals si s'afegix CSS ad-hoc no permès per Pedra Seca.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
