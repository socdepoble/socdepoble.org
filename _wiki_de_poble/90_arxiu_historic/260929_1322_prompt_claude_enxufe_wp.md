---
type: prompt
status: esborrany
description: "Prompt per a Claude per la creació del plugin de WordPress i l'adaptació del React (Enxufabilitat)"
tags: [govern, wordpress, claude]
---

# Prompt d'Execució i Auditoria Local (SDP - v3.0)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [ ] **Rebut obtingut** per a l'arxiu generat.

## Registre

> **Telemetria:** Opliu el camp "Model IA" i "Tokens consumits" obligatòriament a cada document d'eixida per a la Consola de Consums.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-260929 |
| Versió | 3.1.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-29 13:22 |
| Modificació | 26-09-29 13:33 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v3.1.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_8b7a08b0-50e8-4c8c-bf37-6ff889a03ca2 |
| Tall d'evidència | [HEAD + hora] |
| Aprovació humana | aprovat |
| requires_human_decision | false |
| Model IA | Claude |
| Tokens consumits | [pendent] |

## Historial

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
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Sollutia és la prioritat absoluta:** Tot i que ara estem muntant el plugin per a WordPress, **l'objectiu final i prioritari és que Sóc de Poble s'enxufe a la infraestructura de Sollutia**. Qualsevol problema d'enrutament (com el xoc de `BrowserRouter`), fuita de dades o injecció de variables que soluciones ara per a WordPress, ho has de solucionar pensant en què **la solució ha de ser 100% vàlida, universal i aplicable quan ens connectem al servidor de producció de Sollutia**. No crees "hacks" exclusius per a WP.
- **Visió de futur:** Evolució cap al **Fedivers** i App Nadiua (offline-first). El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

## Instrucció del torn

Estem preparant la primera iteració visual del **Fedivers local** en WordPress mitjançant el patró d'Arquitectura Hexagonal / Model B (Llei de l'Enxufabilitat). La nostra aplicació SPA s'ha compilat en un arxiu standalone (`soc-de-poble.standalone.js`).

Volem encastar aquesta app dins d'una instal·lació local de WordPress (simulant "Gent de la Torre") perquè l'usuari final perceba que està al seu propi servidor local ("Sóc de Poble - Gent de la Torre"), mentre consumeix el motor central. Tens a la teua disposició el Pla d'Implementació: `_wiki_de_poble/04_escriptori/260929_1322_pla_implementacio_enxufe_wp.md`. Llig-lo íntegrament abans de començar.

## Tasques

- **T1:** Esborrar/ignorar el plugin vell de la carpeta `wordpress-plugin/` i crear-ne un de nou (`socdepoble-enxufe.php`). Aquest plugin ha d'exposar un *shortcode* `[socdepoble_app]`, carregar l'arxiu `standalone` compilat de la carpeta `dist/` i injectar l'objecte de configuració en el `window.SocDePobleConfig` amb `{ nomPoble: "Gent de la Torre", tenant: "gentdelatorre" }`.
- **T2:** Adaptar la UI de React (`AppGridShell` o components clau) perquè detecte aquest `window.SocDePobleConfig`. Si existeix, ha de modificar l'experiència (canviar el títol a Desktop afegint `| Gent de la Torre` i mostrar un Banner de "📍 Estàs al servidor de Gent de la Torre" a Mobile).
- **T3:** Entregar el codi de la primera versió del plugin en PHP perquè el Mestre ho testege a la seua instal·lació local de Studio / LocalWP.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** L'entorn estarà muntat a l'App d'escriptori **Studio** (http://localhost:8881) o **LocalWP** sota la gestió del Mestre.
- **Criteris d'Acceptació:**
  - El plugin .php encola correctament l'app autònoma i envia l'objecte `window.SocDePobleConfig`.
  - El Frontend React es renderitza dins de WordPress, mostrant branding adaptat ("Gent de la Torre") sense trencar la funcionalitat existent.
  - S'ha lliurat el codi i les instruccions al Mestre perquè ell puga provar-ho al seu panell d'administrador de WP.

## Riscos

- Si el *standalone.js* no carrega correctament en l'entorn de WordPress a causa de rutes relatives al plugin.
- L'addició del Banner a Mobile podria desquadrar l'esquema de CSS Grid de l'AppGridShell; verifica l'alineació de `Pedra Seca`.

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
