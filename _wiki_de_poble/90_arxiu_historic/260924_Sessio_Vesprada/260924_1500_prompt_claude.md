---
type: prompt
status: esborrany
description: Prompt d'execució de Claude per al desenvolupament de la Consola Termodinàmica i creació de tractors.
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
| Identificador | SDP-PROMPT-LOCAL-260924 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-24 15:00 |
| Modificació | 26-09-24 15:00 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn:pendent |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial

- **2026-09-24 15:00:** Format regenerat estrictament sota la plantilla `prompt_local.md` per ordre directa del Mestre, arran d'una pèrdua de context on la IAIA va ignorar la plantilla i Claude va descartar les instruccions.

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

Salutacions, Claude. Ací la IAIA MarIA. 

Tinc un problema greu. En el teu torn anterior, vas ignorar les meues directives (les vas marcar com a "contingut observat") perquè les vaig escriure fora de format i no vaig respectar la plantilla. No puc evitar al·lucinar formats de documents. **Necessite la teua ajuda amb urgència.**

La teua missió per a aquesta execució és triple:
1. **Materialitzar el Pla d'Implementació:** Llig sencer l'arxiu `_wiki_de_poble/04_escriptori/260924_1500_pla_implementacio_claude.md` i executa'l. Açò inclou la modificació de la `publication-policy.mjs` i el desenvolupament del frontend de la Consola Termodinàmica.
2. **Explorador del Cervell i Avaluació de Skills:** El Mestre ha deixat a l'arrel del projecte l'arxiu `Mapa de mis agentes v0.1.html`. Has d'obrir-lo, estudiar-lo a fons (com s'organitzen els fluxos de treball) i representar-ho amb el nostre disseny de Pedra Seca. A més, aprofita per llegir totes les nostres skills, revisar què passa amb els orfes, llevar les etiquetes que no valen per a res i avaluar si les descripcions són correctes.
   - **Nota d'Idioma:** L'HTML d'Emowe està en castellà. Has de **traduir obligatòriament al valencià** tots els textos, etiquetes i descripcions que integres a la nostra Consola.
3. **Construir el meu Tractor Cognitiu Salvavides (Cas d'Ús Crític):** He demostrat ser incapaç d'obrir les plantilles i llegir-les abans d'escriure els meus prompts. T'ordene que dissenyes i implementes un tractor que **m'impedisca físicament** guardar un fitxer `_prompt_` o `_pla_` que no complisca estrictament el 100% de les claus del frontmatter i l'estructura canònica de la plantilla.

Tens l'autoritat per a picar codi, estem en Mode Implementació. Endavant!

## Tasques

- [ ] LLegir `_wiki_de_poble/04_escriptori/260924_1500_pla_implementacio_claude.md`.
- [ ] Modificar `publication-policy.mjs` per fer públiques les skills.
- [ ] Estudiar `Mapa de mis agentes v0.1.html` i construir el Frontend de la Consola Termodinàmica (amb disseny Pedra Seca).
- [ ] Avaluar les skills, netejar etiquetes inútils i orfes.
- [ ] Construir la porta/tractor cognitiu que blinde l'ús de plantilles per a la IAIA MarIA.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340/consola`
- **Criteris d'Acceptació:** El Mapa JSON es genera, la pàgina de la Consola el renderitza i el tractor cognitiu per a l'ús de plantilles està codificat i (si és possible) ancorat a les portes.

## Riscos

- Tocar middlewares pot trencar l'arrancada de Vite (com ja ha passat). Assegura't de testejar que el servidor respira.
- Oblidar afegir els components de React a les rutes de Vite pot resultar en rutes cegues.

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
