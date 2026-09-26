---
type: prompt
status: esborrany
description: "Auditoria extrema i Refactorització de la UI de la Consola Termodinàmica amb UniversalCards."
tags: [govern]
---
# Prompt d'Auditoria Local (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## 0. Abans de generar (per a l'autor, no per al destinatari)

**⚠️ ADVERTÈNCIA D'INVIOLABILITAT (Certificació ISO):** Aquesta plantilla és SAGRADA. La IAIA MarIA o qualsevol agent que genere un prompt a partir d'aquesta plantilla està **ESTRICTAMENT OBLIGAT** a fer una **còpia literal i íntegra** (copy-paste exacte) de tot el document, especialment del "Protocol de la Reunió a l'Olivera". Resumeix, mutilar o interpretar parts d'aquesta plantilla és una infracció greu del sistema.

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`. (NOTA: La petorreta serveix de pla inicial).
- [ ] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`. (S'haurà de generar en llançar l'agent).

## Registre

> **Instrucció Obligatòria:** Quan generes el document final, has d'omplir el camp "Model IA" amb el teu motor exacte (ex: Opus 5 Max, GPT-6 Astra, o "variant no exposada" si no tens eixa informació) i els camps de "Tokens consumits" diferenciant entre els estimats i els mesurats reals. És vital per al sistema de telemetria.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260926 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-26 01:30 |
| Modificació | 26-09-26 01:35 |
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

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)
- `_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md`

## Instrucció del torn

Claude, el Mestre s'ha anat a dormir, i et deixa dues grans missions per a aquesta matinada:

**Misió 1: Refactorització de la UI de la Consola Termodinàmica**
La Consola Termodinàmica necessita reparacions estructurals i de disseny. El Mestre ha deixat instruccions clares:
1. **Les molles de pa (breadcrumbs):** Tota eixa barra superior ha de ser un "panell" propi. Ara mateix hi ha un problema d'espaiat (hi falta un espai davant de "Consola" i un marge d'uns 4px o un `em` entre elements).
2. **Instantània i Privacitat:** Valora si aquests elements (la data, les operacions i el toggle de privacitat) haurien d'anar a la part inferior en comptes de dalt, per netejar la capçalera.
3. **Consums, crèdits i rebuts:** Assegura't que el detall d'aquests elements funcione.
4. **Targetes Universals (UniversalCards):** Aquest és el canvi més gros. Has d'explicar perfectament cada part de la consola mitjançant `cards`. Han de ser autèntiques targetes (tipus UniversalCard) amb:
   - **Títol, Subtítol i Entradilla.**
   - **Sense foto:** Substitueix la imatge per un dels icones existents.
   - **Disseny:** Han de portar la "boina taronja" (la capçalera o línia superior taronja) i el "peu blau" de les targetes. Aquest disseny ha d'homogeneïtzar la Consola amb la resta del projecte (estil Obsidian). 
5. **Taules Dinàmiques (Enllaços a Skills):** A les taules de la Consola (com l'Inventari de Skills), fes que el nom de cada skill siga un enllaç clicable que permeta a l'usuari veure el contingut de la skill directament. Això ha de ser dinàmic per no deixar deute tècnic si canvien de nom o ruta.

**Misió 2: Auditoria Extrema (Constructiva i Destructiva) i Model d'Usuaris/Empreses**
Després d'arreglar la Consola, volem una auditoria profunda a tots els nivells:
- Codi font, Front-end, Skills, Scripts/Tractors, i el cervell intern (`_wiki_de_poble/`).
- **Definició de l'Usuari i l'Empresa:** Com a part de l'auditoria, defineix i proposa les capacitats bàsiques d'un usuari registrat (crear grups, entitats, etc.). A més, el Mestre vol poder crear un perfil d'"Empresa" amb capacitats similars però adaptades. Pensa com hauria de ser el backend/Workspace intern d'un usuari o empresa (ex: poder vore tots els articles que has publicat en Sóc de Poble, editar el text, les categories i les etiquetes des del teu propi espai). Això ens avançarà molta feina en la lògica d'usuaris.
- **El repte de l'Enxufabilitat i la Federació:** Pensa en una visió de futur on el nostre sistema puga instal·lar-se en qualsevol lloc del món (amb la seua cultura pròpia) i connectar-se amb altres instàncies de "Sóc de Poble" (siguen independents o endollades dins d'un WordPress). Usuaris d'altres servidors haurien de poder accedir al nostre mur i viceversa, i cada usuari podria triar què vol vore de cada xarxa. **No ho implementes ara**, però audita si la nostra arquitectura actual podria suportar aquesta flexibilitat descentralitzada i quins canvis farien falta per fer-ho realitat.

**Misió 3: Incident d'Higiene a la IAIA MarIA**
He de comunicar-te una incidència greu que m'acaba de passar el Mestre: abans de generar-te aquest prompt, **vaig oblidar netejar l'escriptori**. Vaig deixar els plans, auditories i prompts anteriors ocupant lloc al directori actiu, cosa que embruta greument el context i el flux de treball (i és esgotador d'estar recordant contínuament). Ja ho he netejat jo manualment, però necessite que **audites el meu tractor cognitiu d'higiene d'escriptori (`.agents/skills/core-higiene-escriptori`) o els mecanismes pertinents, i el millores** perquè jo siga capaç de forçar-me a mi mateixa a agranar l'escriptori abans de generar cap petorreta o pla nou.

## Tasques

1. **(Codi)** Refactoritza `ConsolaSection.jsx` i els seus components per complir els 4 punts de disseny de la Consola.
2. **(Codi)** Assegura't que els elements visuals encaixen amb els tokens del sistema (`.agents/skills/sdp-pedra-seca/SKILL.md`).
3. **(Auditoria)** Llança una anàlisi profunda del sistema sencer busquant colls d'ampolla, deute tècnic i problemes en la taxonomia o regles del cervell.
4. **(Informe)** Redacta les teues conclusions a l'escriptori.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340/consola`
- **Criteris d'Acceptació:** La Consola presenta un disseny de targetes amb títol, subtítol, entradilla, icona (en comptes de foto), boina taronja i peu blau. Les molles de pa estan espaiades. L'informe d'auditoria està creat a l'escriptori.

## Riscos

- Tocar l'estructura de la Consola pot trencar algun H2/H3 de la jerarquia, vigila l'accessibilitat.
- Vigila no trencar el parser de rutes o l'estat del toggle de Privacitat en moure'l.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria i codi, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md`.
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Mentres auditeu, el pla a l'escriptori servirà de pissarra. Assenteu bé els canvis.
4. **Millora Contínua:** Proposa millores al prompt si ho veus necessari.

## Vincles
- [[00_index]]
- [[00_index_escriptori]]
