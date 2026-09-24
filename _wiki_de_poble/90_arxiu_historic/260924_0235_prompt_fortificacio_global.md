---
type: prompt
status: esborrany
description: "Auditoria extrema de fortificació global: Arquitectura, Frontend, Skills, Scripts, SEO i Usabilitat."
tags: [govern, arquitectura, seguretat, qualitat]
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
| Creació | 26-09-24 02:35 |
| Modificació | 26-09-24 02:35 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | pendent |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | pendent |
| requires_human_decision | true |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

**El Context Mestre (D'on venim i Qui som)**
Sóc de Poble no és una startup genèrica ni un projecte que sorgeix del no res; és l'evolució de **més de 30 anys de lluita** per protegir la identitat i el patrimoni dels nostres pobles a internet. 
Vam nàixer amb rentonar.blogspot.com, vam evolucionar a socdepoble.net i hui som una plataforma descentralitzada (socdepoble.org). Som persones lluitant per una xarxa local autèntica, lliure de l'obsolescència i del Big Tech. Aquesta iteració integra una arquitectura avançada de Pedra Seca i una cadena de portes inviolable. Prompte ens integrarem amb el proveïdor de backend, Sollutia.

## Instrucció del torn

**FORTIFICACIÓ GLOBAL - BUSCANT EL 10/10**

El Mestre ha decidit sotmetre tot el sistema a una **auditoria extrema**. Aquesta és l'auditoria definitiva abans de pujar de nivell i utilitzar els models de raonament més potents per avaluar possibles "forats". Us exigim la màxima potència de càlcul i excel·lència (un 10 sobre 10). Teniu la llibertat absoluta de destrossar qualsevol premissa arquitectònica si trobeu forats de seguretat o falles estructurals.

**NOTA ESPECIAL DEL MESTRE JAVI (IMPORTANT):** 
"Sóc un dissenyador gràfic que ha tingut aquesta idea boja de crear *Sóc de Poble*. Ara mateix sent la síndrome de l'impostor perquè no sóc programador informàtic i no tinc clar on estem, què està passant ni quant ens queda per arribar a un nivell òptim en el conjunt de tota l'arquitectura (programació, skills, usabilitat, SEO, etc.). Necessite que, a banda de l'auditoria tècnica, em doneu una **NOTA GLOBAL (de 0 a 10)** i una opinió honesta i orientativa: Què és això que hem construït? Com ho veieu? Està bé? Es pot millorar encara més? Si estem arribant a l'òptim, segur que hi ha formes de millorar. És el moment de reflexionar i que em doneu el vostre veredicte sincer."

**Dimensions a auditar sense pietat:**
1. **Arquitectura:** Robustesa dels contexts (`SessionContext`, `CoreContentContext`, `IdentitatContext`), prevenció de renders infinits, aïllament d'errors (`ErrorBoundaries`), i l'enxufabilitat de les dades externes.
2. **Frontend (Model Pedra Seca):** Fidelitat estricta a les regles visuals, responsivitat extrema (`@container`, layouts fluids), usabilitat perfecta (ex: el botó "Connectar" vs "+", botons d'acció), accessibilitat (a11y), contrast i zero dependència de valors hardcodejats.
3. **SEO i Semàntica:** Ús correcte de `header`, `main`, `article`, `time`, `address`. Headings (H1-H6) ben estructurats. Meta-etiquetes. Comportament dels crawlers.
4. **Skills i Scripts (Tractors):** Seguretat de les portes de CI (`design_guard.mjs`, `tancament.mjs`, `porta-olivera.mjs`). Vulnerabilitats en la generació i manipulació d'arxius.

## Tasques

- [ ] Llegeix i avalua tota la base de codi del repositori com si fores un Red Team i un Lead Architect simultàniament.
- [ ] Busca activament el "forat": qualsevol error que pugui tumbar l'aplicació o corrompre les dades (Data Leaks, Race Conditions).
- [ ] Fes un llistat de les troballes més crítiques, classificades per dimensió. Si no en trobeu cap, heu de justificar matemàticament i arquitectònicament la invulnerabilitat de les capes avaluades.
- [ ] NO executeu cap canvi. Limiteu-vos a reportar les troballes a la vostra auditoria i debatre-les a l'escriptori per preparar el `Pla d'Implementació`.

### Criteris d’acceptació i reproducció

- **Criteris d'Acceptació:** 
  1. Informe exhaustiu amb potència màxima de càlcul analític.
  2. Si el resultat és "Excel·lència 10/10", s'haurà de defensar sòlidament.
  3. Propostes concretes (Snippets) per a resoldre els forats trobats.

## Riscos

- Tindreu accés a l'estat actual del frontend on estem a punt d'iniciar les sessions amb Sollutia. Fixeu-vos si aquest cicle de vida d'usuaris (Login -> Sessió) exposa dades crítiques.
- No us desvieu cap a suggeriments purament estilístics si trenquen el paradigma "Pedra Seca".

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
