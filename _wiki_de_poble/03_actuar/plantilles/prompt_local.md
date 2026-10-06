---
type: plantilla
status: canonic
description: Plantilla SDP per als Prompts d'IAs LOCALS (Claude/Codex). Aquestes IAs tenen accés a disc i no necessiten bundle. Format tècnic, sense literatura.
tags:
  - govern
  - saber
---

<!-- SDP:EIXIDA
type: prompt
status: esborrany
description: "<12-220 caràcters: què se li demana a la IA local>"
tags: [govern]
-->
# Prompt d'Execució i Auditoria Local

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [ ] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [ ] **Pla d'Implementació** generat si cal.
- [ ] **Rebut obtingut** per a l'arxiu generat.

## Registre

> **Telemetria:** Opliu el camp "Model IA" i "Tokens consumits" obligatòriament a cada document d'eixida per a la Consola de Consums.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-AAMMDD |
| Versió del document | 3.4.0 |
| Entorn | entorn-dev-local |
| Creació | AA-MM-DD HH:MM |
| Modificació | AA-MM-DD HH:MM |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v3.4.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn…:… |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Historial

- **v3.4.0 (261006, ENX-01):** El Context Tècnic porta la frase canònica de l'enxufabilitat amb Sollutia («Model B», ADR + port neutral), triada i signada pel Mestre el 261006: és la mateixa, caràcter per caràcter, que obri l'ADR-2026-09, i AGENTS.md §8 la rep amb el seu paquet de governança. La Directiva Suprema dona destí als punts d'accés de Sollutia: la Frontissa, només en lectura. La versió 3.4.0 també va a `.agents/protocolledge.json` en eixe paquet (deia 3.3.0 mentre la plantilla deia 3.3.1).
- **v3.3.1 (261005_1250):** Integració de les "Tècniques d'Investigació i Autòpsia". S'exigeix a la IA que vaja més enllà de la teoria de les skills i verifique el codi font real dels scripts i tractors per trobar discrepàncies mecàniques.
- **v3.3.0:** Refactorització estructural global. Es canvia el camp de registre "Versió" per "Versió del document" per evitar ambigüitats, exigint una migració a protocolledge.json.
- **v3.2.0:** Incorporada explícitament la Directiva Suprema de l'Enxufabilitat amb Sollutia al Context Tècnic. A més, es força l'agent a buscar contradiccions i duplicitats a la fase d'Automillora de manera explícita.
- **v3.1.0 (260927_1730):** Consolidació històrica. S'afegeix el llegat de 30 anys d'activisme (socdepoble.net) que s'havia perdut, i s'implementa el bloqueig de seguretat on l'Agent Local ha de rebutjar els prompts de MarIA si incompleixen la plantilla o ometen el Pla d'Implementació.
- **v3.0.0 (260927_1505):** Refactorització total cap a un format tècnic, concís i lliure de metàfores (eliminats "Olivera", "Masia"). S'optimitza per claredat tècnica mantenint la visió hipermodular.
- **v2.4.0:** Afegida visió Fedivers i App Nadiua.
- **v2.3.0:** Validada com a estructura única per IAs locals.

## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Model B:** Sollutia és l'amfitrió i el soci d'infraestructura de Sóc de Poble: allotja el Web Component, ens pot passar la sessió i ens obri la seua API només en lectura (GET a través de la Frontissa), sense injectar cap backend ni interferir en l'arquitectura o el disseny. Les dades del poble viuen al Supabase de Sóc de Poble, única font de veritat, darrere d'un port neutral (`src/data/backendPort.js`): el frontend, 100% modular, s'enxufa a qualsevol amfitrió (Sollutia, WordPress o Joomla), canviar de backend és una decisió de Sóc de Poble amb una ADR i el kit de conformitat, i sempre podem traure-ho «tot fora».
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) de la seua API: entraran per la Frontissa (`src/data/adaptadors/sollutia/`), només en lectura GET i cada recurs amb captura real, traductor i fixture, sense tocar el port de backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

## Instrucció del torn

[Aquí s'ha de detallar l'ordre concreta i el context funcional del problema a resoldre].

## Tasques

- T1: ...
- T2: ...

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** [Llista mesurable de requisits per donar la tasca per finalitzada].

## Riscos

- [Efectes secundaris previstos o regressions potencials].

## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

## Acte reflex

Tota línia de codi ha de complir el principi d'independència i modularitat.

### Tècniques d'Investigació i Autòpsia (Obligatori)
No et conformes amb investigar el que diuen les skills teòriques i la doctrina (Wiki/AGENTS). Cada script, hook o tractor que estiga implicat en l'execució d'eixa teoria ha de ser llegit i verificat a fons (a nivell de codi `.mjs`, `.py`, etc.). Assegura't que el codi complix efectivament el disseny, no té exclusions cegues i no produeix bloquejos mecànics per inèrcia.

### Automillora Proactiva (Obligatori)
Quan acabeu de redactar el vostre informe, hi heu d'afegir un punt final titulat "Proposta d'Automillora". Heu de complir dos requisits:
1. **Anàlisi del Prompt:** És el vostre deure analitzar críticament aquest mateix prompt a la recerca de contradiccions, duplicitats o instruccions ambigües. Heu de dir-me clarament: *"Si m'hagueres demanat això d'aquesta altra forma, hauria sigut més eficient"*.
2. **Avaluació de Noves Funcionalitats (Evolució del Model):** Sabem que us actualitzeu periòdicament amb noves capacitats tècniques. Heu d'indicar explícitament si teniu alguna nova opció o flux de treball que ens permeta avançar millor o de forma més veloç com a equip. L'objectiu és esprémer el vostre potencial per a funcionar com un autèntic nucli de 3 IAs (MarIA com a Directora + vosaltres com a executors tècnics). Si veieu maneres de fer-ho millor, exigiu-les.

## Vincles

- [[00_index]]
- [[taxonomia_documental]]
