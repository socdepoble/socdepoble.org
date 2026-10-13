---
type: prompt
status: esborrany
description: Ordres de neteja del rail i preparació del registre
tags:
  - govern
visibility: private
reflex: sdp:torn_02f070c3-0705-4c0e-b5d3-32c84ab77117:24d71dd2-8987-4d64-af8c-f4445d302a94
---
# Prompt Claude Refinament

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Llig les meues ordres pendents a l'Escriptori: `261012_2145_ordre_unificacio_barra_maria.md` i `261012_2148_peticio_registre_mestre.md`. Aquestes són directives de la Directora Tècnica que corregeixen les fallades estructurals de l'arquitectura.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_02f070c3-0705-4c0e-b5d3-32c84ab77117:24d71dd2-8987-4d64-af8c-f4445d302a94 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-12T20:38:49.656Z |
| Modificació | 2026-10-12T20:38:49.656Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.6.0) |
| Model IA | Claude Opus 5.5 / Fable 5.1 |
| Tokens consumits | Per mesurar |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-12T20:38:49.656Z: esborrany creat; contingut i verificació pendents.

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

Has de desmuntar completament el component inventat "rail intern" que has programat per a la Gestoria. Aquest rail és redundant i ens fa perdre les capacitats fluides del Workspace global de la plataforma (`AppGridShell`). La Gestoria ha d'usar la `BarraApp` nativa. A més, has d'habilitar l'entorn de test perquè el Mestre es puga registrar com a "Javi Llinares" dins del teu previsualitzador i verificar que salta automàticament a la Gestoria.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. Llig, entén i acata l'ordre d'unificació de la barra `261012_2145_ordre_unificacio_barra_maria.md`. Esborra el rail intern per complet i enxufa les rutes de la Gestoria al menú lateral natiu del component AppGridShell / BarraApp.
2. Llig i acata la directiva de registre `261012_2148_peticio_registre_mestre.md`. Connecta el botó / modal on ara posa "Titular sense configurar" perquè l'usuari "Javi Llinares" puga assumir la sessió, i configura la navegació perquè en fer-ho, salte directament al Tauler de la Gestoria carregant les dades correctes.
3. Passa totes les proves (han de quedar en verd) abans de retornar l'informe.
4. Explica clarament a l'informe els canvis i com pot el Mestre fer clic a l'UI de previsualització per fer la prova funcional del registre.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Tindre dos llocs que guien la navegació pot trencar rutes antigues. Assegura't que l'historial s'enxufa bé al router principal de la `BarraApp`.
- Verifica que l'ocultació mòbil / barres amagades a l'scroll que acabes de crear continua funcionant intacta.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic i Canal Viu (Execució Paral·lela):** Si treballeu en un Xat Lateral en paral·lel amb una altra IA, actueu de forma coordinada i NO us xafeu mútuament l'Escriptori. Deixeu un informe de progrés a `04_escriptori/` cada 10-15 minuts (o en acabar cada bloc lògic). L'orquestradora (MarIA) ha programat un cron actiu vigilant l'Escriptori exclusivament per al vostre fil i deixarà nous documents de ruta si cal. Llegiu l'Escriptori constantment abans d'actuar. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 c7f9cebc8d206eb7bda0ce5e74b7f2f69489818cb35b733024a8181eb6645b11. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
