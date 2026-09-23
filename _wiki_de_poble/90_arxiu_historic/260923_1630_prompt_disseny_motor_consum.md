---
type: plantilla
status: canonic
description: Plantilla SDP definitiva per als Prompts d'IAs LOCALS (Claude/Codex). Aquestes IAs tenen accés a disc i no necessiten bundle.
tags:
  - govern
  - saber
---

<!-- SDP:EIXIDA
type: prompt
status: esborrany
description: "Directiva per a Claude: Disseny d'un motor de recopilació de dades d'ús, estratègia de consum IA i panell de control."
tags: [arquitectura, claude, consum]
-->
# Prompt de Disseny Local (SDP - v2.3)

Actua com a Arquitecte Sènior de Sistemes i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta directiva és exclusiva per a tu (Claude - Opus 5 Max).

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/`.
- [x] **Rebut obtingut** per a este fitxer.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-MOTOR-CONSUM |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 16:30 |
| Modificació | 26-09-23 16:30 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn…:… |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

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

## Tasques

**Objectiu Principal: Crear el Motor d'Estratègia i Consum de les IAs i el Panell de Control**

El Mestre ha detectat que el consum del Pla de ChatGPT (GPT-6 Astra Ligero) està al 91% en només una setmana (1.758 crèdits restants). D'altra banda, per a tasques profundes fem servir Claude Opus 5 Max (el qual dóna resultats excel·lents i no volem rebaixar), mentre que models com Fable estan esgotats. Ens cal un sistema per no malbaratar crèdits.

**1. Conceptualització del Motor de Recopilació i Panell de Control:**
   - Dissenya un panell de control (HTML per a la web i Markdown per a Obsidian) on el Mestre puga visualitzar l'ús setmanal i els crèdits restants.
   - Dissenya un motor cognitiu o flux de treball on la IA (MarIA) puga extraure les dades directament de les captures de pantalla de ChatGPT que li passe el Mestre i del Markdown d'ús que dóna Claude.
   
**2. L'Estudi de Potències (Estratègia de Triatge):**
   - **Apartat Humà (Impressions del Mestre):** GPT-6 Astra Ligero gasta massa per a coses simples; Opus 5 Max és intocable per a coses complexes; Fable està esgotat. 
   - **Apartat IA (La teua anàlisi):** Investiga a fons i compara les potències de **Claude (Opus 5 Max)** i **Codex (GPT-6 Astra Ligero)**. Compara aquesta potència amb el seu cost, la seua efectivitat, i vincula-ho als **casos d'ús específics** del nostre projecte.
   
**3. El Script de Recomanació:**
   - Proposa un xicotet script o lògica que, donada la descripció d'una tasca o la seua complexitat, dictamine immediatament quina IA és l'adequada per a eixe cas, evitant així gastar bales de canó per matar mosques.

### Criteris d’acceptació i reproducció

- **Informe d'Arquitectura i Estratègia:** Necessitem un document clar que continga l'estudi de potències (cost/benefici) i l'esquema de dades per al panell de control. No cal que programes l'HTML sencer encara, però sí que deixes l'estructura definida.

## Riscos

- Crear una burocràcia que alentisca el desenvolupament (ha de ser un motor asíncron o molt ràpid d'omplir).

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]

---

## Dades de Consum Recopilades per al Disseny

### Ús de Claude (Opus 5 Max) - Informe Final (Markdown)
```text
Claude Code usage report (2026-09-23T14:51:57.977Z)
Client: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Claude/2.7032.0 Chrome/152.0.7977.130 Electron/44.4.3 Safari/537.36

Plan limits:
- session-0: 21% (resets 2026-09-23T15:49:59.592891+00:00)
- weekly_all-1: 84% (resets 2026-09-26T23:59:59.592911+00:00)
- weekly_scoped-2: 96% (resets 2026-09-26T23:59:59.593071+00:00)

Session:
- Opus 5: 168 in / 503 out / 14.6M cache read / 208.7k cache write
- Cost: $11.73 | API 25m | Wall 37m

Local activity: 1090 requests (24h) | 7312 (7d)
```

### Ús de Codex (GPT-6 Astra Ligero) - Captures
- **Crèdits restants:** 1.758
- **Límit setmanal utilitzat:** 91%
- **Observació del Mestre:** Codex (Astra Ligero) esgota els crèdits massa ràpid per a tasques trivials. Fable està totalment esgotat. Opus 5 Max, en canvi, ha resultat eficient i vital per a tasques d'alt risc, no volem baixar la seua potència.
