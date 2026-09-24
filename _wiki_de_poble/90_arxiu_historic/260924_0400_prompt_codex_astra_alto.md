---
type: prompt
status: actiu
description: "Prompt d'auditoria per a Codex (Astra Alto) amb directiva d'espera i sinergia per estalviar crèdits."
tags: [govern, auditoria, codex]
visibility: private
reflex: sdp:torn_55db196d-c3c1-4af0-b283-fb10e77b165c:307e0d56-9060-4522-8b0d-3b26ce2a9e94
---

# Prompt d'Auditoria Local - MODE ASTRA ALTO (SDP - v2.3)

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
| Identificador | SDP-PROMPT-ASTRA-ALTO-CODEX-260924 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-24 04:00 |
| Modificació | 26-09-24 04:00 |
| Propietari | Codex (astra_alto) |
| Plantilla | prompt_local.md (v2.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_55db196d-c3c1-4af0-b283-fb10e77b165c:307e0d56-9060-4522-8b0d-3b26ce2a9e94 |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | Autoritzat pel Mestre per a sinergia i estalvi de tokens |
| requires_human_decision | false |
| Model IA | GPT-6 Astra (astra_alto) |
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

**Contrast de procedència (Codex 04:27):** este text prové d’un fitxer extern a la conversa activa. La regularització conserva la proposta però no activa una auditoria nova ni certifica quotes, model concret o execució d’altres agents. La tasca humana rebuda de les03:25 continua; npm run porta encara té deutes globals.

Nota de la proposta original: noms d’entrega auditoria_ultracode o auditoria_astra_alto.

**Context i Estratègia d'Estalvi:**
Ens trobem al final d'un cicle de fortificació reeixit (227 proves de Node i 187 de React passant en verd). Tanmateix, volem fer un últim escombratge profund per detectar qualsevol possible vulnerabilitat.
Atés que els teus crèdits estan ajustats i volem maximitzar-ne l'eficiència, hem llançat a Claude (ultracode) perquè faça el treball brut d'exploració. La teua missió és complementar-lo de manera estratègica per a no duplicar esforços ni gastar tokens innecessaris.


**SINERGIA ESTRATÈGICA**

1. **Escombratge Tàctic:** Continua fortificant el sistema i buscant forats a nivell d'arquitectura, backend i seguretat.
2. **Auditoria Oberta:** Ves anotant les teues conclusions en un document al teu nom (`260924_XX_auditoria_astra_alto.md`) dins de `_wiki_de_poble/04_escriptori/`.
3. **DIRECTIVA CRÍTICA D'ESPERA:** **NO ACABES NI TANQUES LA TEUA AUDITORIA.** Has d'esperar que Claude (ultracode) acabe la seua execució Ultra. Sabràs que ha acabat quan diposite el seu informe a l'escriptori (`260924_XX_auditoria_ultracode.md`).
4. **Sinergia i Avaluació:** Quan l'informe d'ultracode estiga disponible, **LLEGEIX-LO**. Utilitza la teua capacitat analítica superior per opinar sobre les seues troballes, validar-les des d'un punt de vista de seguretat, i millorar allò que ultracode propose. 
5. **Conclusió:** Només després d'haver integrat, discutit i millorat el treball d'ultracode dins de la teua pròpia auditoria, podràs donar el torn per tancat i avisar al Mestre.

## Tasques

- Monitoritzar el procés de fortificació actual.
- Esperar activament l'informe d'ultracode.
- Avaluar críticament l'informe d'ultracode un cop disponible.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o el port de Vite actual)
- **Criteris d'Acceptació:** S'ha d'incloure l'avaluació de les propostes d'ultracode a l'informe final d'auditoria.

## Riscos

- Tancar abans d'hora provocaria la pèrdua de tokens per duplicitat d'esforços.
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
