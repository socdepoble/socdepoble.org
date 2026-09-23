---
type: prompt
status: esborrany
description: "Prompt per al Consell: Fortificació de la cadena de segells i hooks (B4-B6)."
tags:
  - govern
---
# Prompt d'Auditoria Local (SDP - v2.3)

Actua com a Auditor Sènior i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`. (Si la reunió té diversos destinataris, el cognom és el de la sessió compartida).
- [ ] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.

## Registre

> **Instrucció Obligatòria:** Quan generes el document final, has d'omplir el camp "Model IA" amb el teu motor exacte (ex: Opus 5 Max, GPT-6 Astra) i el camp "Tokens consumits" amb la teua estimació de despesa de tokens. És vital per al sistema de telemetria.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260923 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 19:22 |
| Modificació | 26-09-23 19:22 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn:260923 |
| Tall d'evidència | HEAD |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Acte reflex

Aquest document s'ha generat amb el "Trellat" de la IAIA MarIA per delegar l'execució a les IAs de frontera. A l'hora d'auditar el codi, si creieu que aquesta plantilla es pot millorar per a treballar millor, digueu-ho!

## Historial

- **v2.3.0:** Validada com a Prompt Conjunt per a l'Olivera i consolidada com l'única estructura acceptable per a IAs locals.

## Context

Com que sou agents locals, no rebeu un Bundle massiu amb tot el codi, ja que teniu accés directe al disc a l'arrel del projecte (`socdepoble.org`). Però **OBLIGATÒRIAMENT** heu de llegir els següents documents abans de començar per comprendre la visió (El Rentonar):
- `AGENTS.md` (Constitució i regles)
- `_wiki_de_poble/01_ser/02_genotip.md` (Qui som i com parlem)
- `_wiki_de_poble/00_index.md` (L'índex mestre)

## Instrucció del torn

Us convidem a auditar la cadena de seguretat del nostre entorn (B4-B6). El nostre objectiu és crear un entorn totalment protegit que asseguri que els models i eines compleixen la constitució abans i després de cada execució:
1. Auditar els hooks actuals (especialment `hooks.json` i `hooks-local.mjs`).
2. Auditar com enllacem el segell automàtic (`segell-auto.mjs`) a través dels hooks de manera agnòstica.
3. Proposar com fortificar la cadena perquè la càrrega del bash intercepti fallades (convertint hooks cadàvers en operatius).

Volem implementar un mecanisme sòlid que validi els segells abans de qualsevol petició d'IA, i garantir que totes les peticions compleixin la norma de "zero trust" (cap arxiu sencer es pot alterar sense un rastre, o si es trenca, es desactiva).

## Tasques

- Analitzar l'estat actual de la càrrega dels hooks (Husky, Bash i MCP).
- Detectar si els scripts d'ancoratge de segells (com el `SCC` check) s'apliquen bé, i proposar-ne la millora per tancar l'esquerda.
- Definir com lliguem Claude i Codex al procés de validació (evitant els hooks orfes).

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o el port de Vite actual)
- **Criteris d'Acceptació:** 
  - La proposta defineix clarament com `segell-auto.mjs` i el segellat interactuen en els hooks.
  - La cadena és completament ininterrompuda: tot agent local està subjecte a validació.
  - El procés no requereix més intervenció de l'usuari (zero fricció).

## Riscos

- Què pot trencar-se amb aquests canvis? Sobrecàrrega d'operacions si els hooks triguen massa en un commit o pre-prompt.
- Quins efectes secundaris preveiem sobre la resta del sistema? Que algunes comandes puguin fallar a meitat si no els configurem perquè tornin codi d'error correcte.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
