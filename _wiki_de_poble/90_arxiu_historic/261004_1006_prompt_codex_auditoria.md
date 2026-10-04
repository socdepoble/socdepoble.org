---
type: prompt
status: esborrany
description: "Petorreta per a Codex: Auditoria profunda de la macro-onada nocturna de Claude (Gestoria, Targetes, CSS)."
tags: 
  - govern
visibility: private
reflex: sdp:torn_c9de9ef6-d073-4941-b998-6017f6dda8a8:879e61e5-dee8-4ce8-950a-f87e44e6b256
---
# Prompt d'Execució i Auditoria Local

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal. (Aquest prompt mateix és el pla d'auditoria).
- [x] **Rebut obtingut** per a l'arxiu generat.

## Registre

> **Telemetria:** Opliu el camp "Model IA" i "Tokens consumits" obligatòriament a cada document d'eixida per a la Consola de Consums.

| Camp | Valor |
| --- | --- |
| Identificador | SDP-PROMPT-LOCAL-261004 |
| Versió del document | 3.3.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04 10:06 |
| Modificació | 2026-10-04 10:06 |
| Propietari | Agents Locals |
| Plantilla | prompt_local.md (v3.3.0) |
| Ruta | prompt.local |
| Rebut | sdp:torn_c9de9ef6-d073-4941-b998-6017f6dda8a8:879e61e5-dee8-4ce8-950a-f87e44e6b256 |
| Tall d'evidència | [HEAD + 10:06] |
| Aprovació humana | pendent |
| requires_human_decision | false |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

## Historial

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
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers** i App Nadiua (offline-first). El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) del seu backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

## Instrucció del torn

Has d'auditar de manera severa i estructural el treball realitzat per Claude durant la seua macro-onada nocturna (el relat complet està a l'auditoria `_wiki_de_poble/04_escriptori/261004_0605_auditoria_claude.md`). S'ha construït la nova closca i Panell de la Gestoria (Veri*Factu), s'han estandarditzat totes les targetes amb `UniversalCard` i boina pròpia (incloent les de sistema com la Consola i la Nevera), i s'ha realitzat una escombrada mil·limètrica de CSS. El teu objectiu és actuar com a auditor independent (El Consell) per comprovar si el codi resultant és realment sòlid, modular i segueix rigorosament els principis de "Pedra Seca" i la "Llei de la Targeta".

## Tasques

- **T1:** Revisa `src/sections/gestoria/` per verificar l'arquitectura de la Facturació (sèrie NOVA vs llegat F tancat) i la robustesa de la petjada Veri*Factu (casos 1 i 2). Està realment blindat i modular? Capaç d'enxufar-se ràpid a l'AEAT en el futur?
- **T2:** Avalua el refactoritzat cap a `UniversalCard` (especialment a la Consola, Lector i Nevera). S'ha aplicat correctament la "Llei de la Targeta" (boina taronja amb autor, cos sencer i pàgina pròpia desplegable)?
- **T3:** Analitza l'escombrada de CSS aplicada als fitxers globals. S'han mantingut els espais de la reixeta? L'arquitectura és sòlida?
- **T4:** Emet el teu propi informe (261004_1010_auditoria_codex.md) assenyalant qualsevol badada, redundància, "chapuza" oculta o codi fràgil que Claude haja pogut deixar passar. Sigues crític i no et limites a aplaudir.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** Document d'auditoria creat indicant l'estat real de l'arquitectura després de l'onada de Claude, assenyalant deute tècnic si n'hi ha.

## Riscos

- Tindre dos models (Claude i Codex) treballant sobre la mateixa base pot generar divergències de criteri si no t'atens exclusivament a les normes de Sóc de Poble (`AGENTS.md`). No inventes patrons nous de disseny; audita el que hi ha sota les regles del sistema.

## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

## Acte reflex

Tota línia de codi ha de complir el principi d'independència i modularitat.

### Automillora Proactiva (Obligatori)
Quan acabeu de redactar el vostre informe, hi heu d'afegir un punt final titulat "Proposta d'Automillora". Heu de complir dos requisits:
1. **Anàlisi del Prompt:** És el vostre deure analitzar críticament aquest mateix prompt a la recerca de contradiccions, duplicitats o instruccions ambigües. Heu de dir-me clarament: *"Si m'hagueres demanat això d'aquesta altra forma, hauria sigut més eficient"*.
2. **Avaluació de Noves Funcionalitats (Evolució del Model):** Sabem que us actualitzeu periòdicament amb noves capacitats tècniques. Heu d'indicar explícitament si teniu alguna nova opció o flux de treball que ens permeta avançar millor o de forma més veloç com a equip. L'objectiu és esprémer el vostre potencial per a funcionar com un autèntic nucli de 3 IAs (MarIA com a Directora + vosaltres com a executors tècnics). Si veieu maneres de fer-ho millor, exigiu-les.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[taxonomia_documental]]
