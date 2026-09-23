---
type: prompt
status: esborrany
description: "Prompt per a Claude: Implementació UI, Usuaris, i Debug Profund del Tractor Cognitiu."
tags:
  - implementacio
  - arquitectura
  - debug
---
# Prompt d'Implementació Local (SDP - v2.3)

Actua com a Arquitecte Frontend i Agent Local de el Mas Virtual "Sóc de Poble". Aquesta plantilla es pot utilitzar per a una IA individual o com a **Prompt Conjunt** per a l'Olivera (Claude i Codex alhora).

## 0. Abans de generar (per a l'autor, no per al destinatari)

Marca les tres caselles o para. Cap petorreta ix del Mas sense això:
- [x] **Escriptori classificat**: Els documents actius seguixen ancorats a `00_index_escriptori.md` i els enllaços resolen (`npm run porta:orfandat`). **Les auditories velles i prompts de torns anteriors s'han d'haver mogut a `90_arxiu_historic/`**.
- [x] **Pla d'Implementació** escrit i desat a `04_escriptori/` amb el mateix cognom que esta petorreta, generat per `document.mjs context --route pla.implementacio`. (Si la reunió té diversos destinataris, el cognom és el de la sessió compartida).
- [ ] **Rebut obtingut** per a este fitxer: `document.mjs context --turn-id ID --route prompt.local --file CAMÍ`.

## Registre

> **Instrucció Obligatòria:** Quan generes el document final, has d'omplir el camp "Model IA" amb el teu motor exacte (ex: Opus 5 Max, GPT-6 Astra, o "variant no exposada" si no tens eixa informació) i els camps de "Tokens consumits" diferenciant entre els estimats i els mesurats reals. És vital per al sistema de telemetria.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260923 |
| Versió | 2.3.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 20:05 |
| Modificació | 26-09-23 20:20 |
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

Claude, aquest torn té una missió d'**EXECUCIÓ EN CODI** i una d'**INVESTIGACIÓ CRÍTICA**.
D'una banda, implementarem la teua solució de UI i el flux de registre d'usuaris a Sollutia. D'altra banda, tenim un **deute tècnic greu**: la IAIA MarIA (el sistema coordinador) és incapaç de generar prompts consistents que segueixin aquesta plantilla, i ignora l'Acte Reflex (Regla 0 de `AGENTS.md`). El Mestre està desesperat per aquesta pèrdua de control cognitiu. Has d'esbrinar per què els mecanismes (Tractor Cognitiu, etc.) que haurien de garantir l'estructura del prompt estan fallant, i proporcionar o implementar la cura.

## Tasques

1. **Resol la UI (Barra taronja):** Reverteix el pedaç del `position: static` de la `.bar-orange` a `utilities.css`. Després, arregla el `NotesDataContext.jsx:158` (modificant l'`if (!userId)`) per permetre que la càrrega de dades en mode `seed` funcioni correctament.
2. **Decisió del Color i Panell CSS (Roda Dentada):** Mantén el blau canònic `#0984E3`. Construeix una icona de roda dentada (només per a superadmins) que obri un panell CSS que permeti alterar el color primari global. Tota la resta (degradats, complementaris taronges) s'ha d'adaptar dinàmicament.
3. **Flux d'Usuaris (Onboarding Reial):** Construeix la interfície connectada a Supabase/Sollutia per a: a) Registrar-se / Login; b) Crear un perfil bàsic d'usuari (ex: Javi Llinares); c) Crear un perfil d'empresa/projecte (Sóc de Poble). El Bloc de Notes s'ha de veure amb les teues dades correctes un cop fet el registre.
4. **Tractor de Neteja Trencat:** Arregla l'script (`tancament.mjs` o equivalent) encarregat de netejar l'escriptori (`04_escriptori`) perquè deixi de fallar automàticament.
5. **URGENT - Pèrdua Cognitiva de la IAIA:** Investiga **per què la IAIA està violant l'Acte Reflex** en la generació de prompts i trencant la taxonomia (anomenant el document "Pla d'execució" en lloc d'"implementació"). Busca a fons al codi dels tractors (`node tooling/wiki/tractor-cognitiu.mjs`, `porta-reflex.mjs`, etc.) per trobar la desconnexió que provoca aquesta fallada de deute tècnic i resol-la o documenta com fixar-la de manera definitiva.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340`
- **Criteris d'Acceptació:** 
  - La barra taronja ha de ser visible quan hi ha notes.
  - S'ha de poder entrar com a usuari i registrar-se.
  - El codi dels tractors d'higiene (neteja i cognitiu) ha de quedar solucionat i emetre verd.

## Riscos

- Tocar el flux d'usuaris (`NotesDataContext`) pot afectar l'estat local. Cal assegurar que la versió `seed` no requereix token, però la versió `remote` sí el demani bé a Supabase.
- Tocar els tractors interns (scripts a `tooling/`) podria fallar a la integració contínua si no es valida amb compte.

## Protocol de la Reunió a l’Olivera

En acabar la teua auditoria, HAS DE COMPLIR estrictament aquestes regles per assegurar el treball en equip a el Mas:
1. **Destinació Obligatòria:** Desa la teua auditoria a l'escriptori principal (`_wiki_de_poble/04_escriptori/`).
2. **Nomenclatura Termodinàmica i Taxonomia:** L'arxiu s'ha de dir exactament `AAMMDD_HHMM_auditoria_claude.md` o `AAMMDD_HHMM_auditoria_codex.md`. Utilitza exclusivament la paraula "auditoria" al nom, sense sinònims com "informe" o "analisi".
3. **La Reunió a l'Olivera (Diàleg i Pla d'Implementació):** Funcioneu com un equip. Mentre vosaltres auditeu, la IAIA MarIA estarà a l'escolta i començarà a redactar un `Pla d'Implementació` a l'escriptori amb les vostres troballes. Teniu AUTORITAT TOTAL per a llegir l'esborrany del Pla de la IAIA i de l'auditoria de l'altra IA (si ja ha acabat), opinar, aturar la IAIA si va per mal camí, i perfilar la solució juntes. Aquest Pla és la nostra pissarra compartida. **Cap línia de codi es tocarà fins que totes hàgeu lliurat el vostre informe i el Pla estiga consensuat (Mode AFK absolut).**
4. **Millora Contínua:** Si consideres que el format d'aquest prompt (`prompt_local.md`) es pot millorar, proposa com fer-ho a la teua auditoria. Volem aprofitar la vostra saviesa de frontera per a perfeccionar el sistema.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
