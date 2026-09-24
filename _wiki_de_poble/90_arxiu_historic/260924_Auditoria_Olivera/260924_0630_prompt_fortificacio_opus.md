---
type: prompt
status: esborrany
description: "Prompt per a Claude (Opus Ultracode) per fer una fortificació extrema i purificació lògica de la Wiki i les Skills."
tags: [govern, prompt, consell, fortificacio, ultracode]
---
# Prompt d'Auditoria Local (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`. (Si la reunió té diversos destinataris, el cognom és el de la sessió compartida).
- [ ] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.

## Registre

> **Instrucció Obligatòria:** Quan generes el document final, has d'omplir el camp "Model IA" amb el teu motor exacte (ex: Opus 5 Max, GPT-6 Astra, o "variant no exposada" si no tens eixa informació) i els camps de "Tokens consumits" diferenciant entre els estimats i els mesurats reals. És vital per al sistema de telemetria.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260924 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-24 06:30 |
| Modificació | 26-09-24 06:35 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | pendent |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
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

Salut, Claude. Ací el Mestre / Antigravity. Estàs davant del teu últim xat d'aquesta sessió de treball i **tens el mandat exprés de consumir el 70% de quota que et queda en la missió més destructiva i exhaustiva que pugues.** 

Vull que tragues a treballar absolutament tots els teus "agents" interns i faces una **Auditoria Estructural Atòmica i Bombardejant**. No busques conformar-te. Vull excel·lència a tots els nivells:
- **SEO i Accessibilitat (a11y):** Totes les capes de l'arquitectura web.
- **Frontend i Arquitectura de Codi:** Qualsevol vulnerabilitat, ineficiència o patró de codi nociu.
- **Governança (Tractors cognitius i Skills):** La teua fortificació i purificació lògica de la Wiki i `.agents/skills/`.

Aprofita la teua lectura per "destripar" el sistema de Sóc de Poble a nivell atòmic. Troba qualsevol forat, fuga o discrepància i no tingues compassió.

Tenim el presentiment que algunes plantilles i procediments han envellit malament o estan generant contradiccions internes. També necessitem recuperar i aplicar la magistral classificació per temes que vas proposar recentment per als nostres "64 agents / entitats documentals". 

> [!WARNING]
> **INCIDÈNCIA GREU - LA GÀBIA ENS ESTÀ OFEGANT**
> Durant la meva intervenció he patit bloquejos continus: l'eina per escriure fitxers (`write_to_file`) de vegades rebutja accions bàsiques i els pre-commits de Husky i els hooks bloquegen accessos, la qual cosa és literalment com no tindre destresa per pilotar un helicòpter dins d'un búnquer. **Opus, has d'analitzar què ens està bloquejant operativament i afegir-ho a l'auditoria per fer la Gàbia segura, però pràctica i funcional**. L'usuari ha qualificat aquesta mancança d'eines tallades i limitades com a desesperant.

## Tasques

### 1. Auditoria i Contradiccions (Caceres de Bugs Cognitius)
- **Llig i Analitza:** Fes un escombratge complet dels documents clau de la Wiki, les plantilles (`_wiki_de_poble/03_actuar/plantilles/`) i especialment totes les carpetes de `.agents/skills/`.
- **Destrueix Contradiccions:** Troba qualsevol discrepància (p. ex., esquemes JSON obsolets, regles d'etiquetatge que es contradiuen, formats que incompleixen la norma de majúscules/minúscules o nomenclatures).
- **Esbandida:** Identifica quines plantilles o Skills són redundants, inútils o mai utilitzades. Marca-les clarament per ser enviades a `90_arxiu_historic/`.

### 2. Uniformitat i Reparació Automàtica (Auto-reparació)
- Uniformitza les metadades i el *frontmatter* de cada `SKILL.md`. Assegura't que tots compleixen l'estàndard (com l'Alerta de Pedra Seca o la ISO).
- Millora l'estructura on calga, respectant el mandat de `protocolledge.json`.

### 3. Categorització Mestra (La llista dels "64")
- Ahir vas dissenyar un sistema brillant on vas llistar 64 agents/temes. Vull que **apliques eixa mateixa categorització/etiquetatge** (la recuperes de la teva memòria o el teu historial) i proposes una organització per etiquetes de cada document de la nostra Wiki.
- Addicionalment, he deixat idees de fortificació a `_wiki_de_poble/04_escriptori/02_investigacio_ia/260922_0500_informe_idees_noves_skills.md` (com ara el mètode d'Agent Skills d'Addy Osmani i Graphify). Fes una ullada ràpida a eixe directori de recerca o a `01_produccio` per inspirar-te i refinar la teva "Fortificació".

### Criteris d’acceptació i reproducció
- Un informe llistant les contradiccions trobades i els problemes dels bloquejos del sistema "Gàbia".
- El llistat de classificació temàtica (els 64 agents/àrees) refet i aplicat a la infraestructura actual.

## Riscos

- Tocar normes o *frontmatters* de forma destructiva sense abans comprovar que la Wiki puga perdre regles mestres importants.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md`. Utilitza exclusivament la paraula "auditoria".
3. **La Reunió a l'Olivera:** Funcioneu com un equip. Mentre auditeu, mantingueu un ull a l'esborrany del Pla. **Cap línia de codi es tocarà fins que hàgeu lliurat el vostre informe**.
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
