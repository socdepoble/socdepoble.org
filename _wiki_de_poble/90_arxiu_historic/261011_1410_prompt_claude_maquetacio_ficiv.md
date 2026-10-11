---
type: prompt
status: esborrany
description: Prompt per a que Claude maquete l'informe FICIV en HTML/MD per a generar un PDF editorial
tags:
  - govern
visibility: private
reflex: sdp:torn_89b60b14-096c-432c-a0f4-2f66cc92199f:5fb08044-193d-490e-b01a-13a9ff508757
---
# Prompt Claude/Codex: Maquetació FICIV

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

S'ha netejat l'escriptori i s'han arxivat els documents de la sessió anterior. El plan d'implementació està vinculat (261011_1410_pla_implementacio_maquetacio_ficiv.md). L'entorn està preparat per a Claude.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_89b60b14-096c-432c-a0f4-2f66cc92199f:5fb08044-193d-490e-b01a-13a9ff508757 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-11T12:07:50.133Z |
| Modificació | 2026-10-11T12:07:50.133Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-11T12:07:50.133Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
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

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

L'objectiu és agafar els lliurables de text pla de l'auditoria FICIV i convertir-los en un **document professional de disseny editorial altament llegible**, pensat per ser exportat a PDF per a la directora del festival (Carmen). Has d'aplicar les teues habilitats avançades de maquetació ("skills editorials"):

- Fes un disseny impecable generant un fitxer **HTML amb CSS integrat** llest per imprimir a PDF (amb regles de CSS `@media print`). Asseegura't que l'estil siga net i professional (fonts sans-serif modernes, espaiats generosos).
- **Obligatori:** Fes un disseny a **dos columnes** (`column-count: 2`). Aquest requeriment és innegociable perquè el PDF s'obrirà sovint en telèfons mòbils, i l'experiència de l'usuari demostra que al fer zoom sobre una estructura de dues columnes la lectura en pantalla menuda és molt més còmoda.
- No uses Markdown, ja que necessitem control absolut sobre els marges, la lletra i l'estructura visual.
- El document requerirà diverses pàgines. 
- Fes ús intensiu i estratègic de les **negretes** per a ressaltar les dades clau o decisions, perquè la directora puga escanejar la informació ràpidament.
- Aplica el teu criteri estètic per estructurar l'informe, la memòria i les taules (CSVs) d'una manera que siga visualment espectacular, clara i molt professional.

Quan acabes, guarda el fitxer resultant (ex: `informe_editorial.html`) a la carpeta del laboratori perquè MarIA (jo) o el Mestre puguem generar l'arxiu PDF final passant-lo pel renderitzador.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. Llig i interioritza el contingut d'aquests quatre arxius a `_wiki_de_poble/04_escriptori/02_investigacio_ia/261011_1400_ficiv_claude/`: `INFORME_PARA_CARMEN.txt`, `ESBORRANY_MEMORIA_ACTUACION.txt`, `escenaris_financament.csv`, i `pressupost_ficiv_2026.csv`.
2. Dissenya i genera un fitxer amb la versió maquetada professionalment reunint tota eixa informació en un format dissenyat expressament per a ser un bon PDF d'impressió/lectura.
3. Desa'l dins d'aquella mateixa carpeta `02_investigacio_ia/261011_1400_ficiv_claude/` amb un nom evident.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Que el disseny final no siga clar, que la lletra quede massa menuda o que les taules es trenquen al renderitzar el PDF. Dóna-li marges i estructura sòlida.
- Assegura't de no esborrar els lliurables originals (els TXTs i CSVs), perquè la directora pot voler usar-los de forma editable a banda del teu document mestre.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 189187b73ba2ef4610f145a173aeb24c157c4453f41dc98c56f1a80f6f384475. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
