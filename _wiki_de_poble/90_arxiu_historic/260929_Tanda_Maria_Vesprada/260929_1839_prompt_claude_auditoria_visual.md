---
type: prompt
status: esborrany
description: "Prompt per a Claude: auditoria visual i T13 (Priorització dataMode)"
tags: [govern]
---
# Prompt d'Execució i Auditoria Local (SDP - v3.0)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

## Registre

> **Telemetria:** Opliu el camp "Model IA" i "Tokens consumits" obligatòriament a cada document d'eixida per a la Consola de Consums.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260929 |
| Versió | 3.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-29 18:39 |
| Modificació | 26-09-29 18:39 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v3.1.0) |
| Ruta | prompt.local |
| Rebut | pendent |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | pendent |
| requires_human_decision | true |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Historial

- **v3.1.0 (260927_1730):** Consolidació històrica.

## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **PRIORITAT ABSOLUTA (Llei de Sollutia):** No oblides MAI que la prioritat absoluta de tot aquest exercici és garantir l'enxufabilitat a **Sollutia** (el proveïdor de backend final). Els problemes d'enxufabilitat que estem tenint amb WordPress i els ajustos (com el polyfill de `process`) han de servir per millorar l'enxufabilitat global i estar preparats per a Sollutia demà mateix, no per empitjorar-la.
- **Visió de futur:** Evolució cap al **Fedivers** i App Nadiua (offline-first). El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

## Instrucció del torn

Claude, necessitem la teua expertesa per resoldre l'assumpte **T13 (Bug Fix: Empty Seed Data)**. Hi ha un dubte arquitectònic sobre com resoldre la priorització a `src/config/dataMode.js`. El problema és que si un desenvolupador clica "Connectar", l'opció `remote` s'escriptura a `localStorage` i això trepitja el `VITE_DATA_MODE=seed` quan arranca l'entorn de desenvolupament, fent que intenti connectar al servidor remot i no vegi les dades de seed. Però si fem que `VITE_DATA_MODE` trepitgi `localStorage`, el botó "Connectar" deixarà de funcionar en dev, perquè el sistema sempre tornarà a forçar `seed`. 

A més a més, el Mestre Javi ha detectat que l'accés a l'aplicació està trencat (error 400 "invalid login credentials" de Supabase) i que el disseny d'aquest formulari (al component de registre/login) no respecta el Trellat: els camps de text i el quadre d'alerta estan estirats de banda a banda sense cap marge ni padding per l'exterior.

Finalment, queda pendent la **T6 (Automillora Proactiva)**, que cal integrar a partir del pla descrit a `260929_1145_pla_implementacio_codex.md`.

## Tasques

- **T13 (Bug Fix: Empty Seed Data):** Analitza `resolveDataMode` a `src/config/dataMode.js` i proposa la millor solució per a la priorització, tot i no trencar els tests.
- **T6 (Automillora Proactiva):** Implementa la proposta pendent de `260929_1145_pla_implementacio_codex.md`.
- **Higiene i Rigor Metodològic (Incidència Greu):** MarIA ha comès dos errors greus d'indisciplina: (1) Ha deixat documents vells (`260929_1322_*`) tirats a l'Escriptori sense netejar-los. (2) Ha creat aquest prompt SENSE haver creat prèviament un Pla d'Implementació, confonent un document de comunicació pasatgera amb el document persistent de tasques. Revisa les skills i el procediment d'Automillora per dissenyar un "Motor Cognitiu" (un tractor ineludible) que ens obligui sempre a: netejar l'escriptori primer, i generar el Pla d'Implementació abans de qualsevol prompt.
- **Visual Bug (Login Form):** El disseny està trencat. Els camps de text i el missatge d'error de Supabase estan omplint el 100% de l'amplària del contenidor fins a l'extrem, sense cap espai ni *padding* pels costats. Aplica la filosofia de disseny (Pedra Seca) per afegir *padding* o marges i arreglar-ho.
- **Bug Fix (Supabase 400):** Analitza per què l'intent d'inici de sessió (amb `socdepoblecom@gmail.com`) falla amb un error `Supabase 400: {"code":400,"error_code":"invalid_credentials","msg":"Invalid login credentials"}` i arregla-ho perquè puguem entrar al sistema.
- **T14 (Bug Fix: Pantalla en blanc WordPress):** El build generat a `wordpress-plugin/dist/soc-de-poble.standalone.js` llança un error `Uncaught ReferenceError: process is not defined` quan es carrega al navegador. Això impedeix que l'app s'iniciï. Depura la configuració de `vite.standalone.config.js` o el codi per assegurar que el polyfill de `process.env` o la seva eliminació siga correcta per a un entorn navegador pur (IIFE).\n\n### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** La priorització de dades resol el problema de l'Empty Seed Data sense trencar el flux de 'Connectar' en desenvolupament; les correccions visuals apliquen el Trellat (Pedra Seca).

## Riscos

- Podem trencar l'arrancada si no gestionem bé la priorització del config vs el `localStorage`.

## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

## Acte reflex

Tota línia de codi ha de complir el principi d'independència i modularitat.

### Automillora Proactiva (Obligatori)
Quan acabeu de redactar el vostre informe, hi heu d'afegir un punt final titulat "Proposta d'Automillora". Heu de proposar com millorar aquest mateix prompt, les nostres plantilles o els nostres sistemes de comunicació IA-Humà per tal d'evitar friccions innecessàries i accelerar el flux de treball. Sou agents actius: heu d'esforçar-vos en arreglar i esmolar les eines que feu servir, i proposar altres sistemes d'automillora que faciliten la clonació, la hiperenxufabilitat, la comunicació i el flux de treball entre la IA i l'humà.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]
