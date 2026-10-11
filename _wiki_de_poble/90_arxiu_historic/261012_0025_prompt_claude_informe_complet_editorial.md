---
type: prompt
status: esborrany
description: Prompt per demanar a Claude que genere l'informe sencer aplicant el seu estil CSS.
tags:
  - govern
visibility: private
reflex: sdp:torn_f2be3d1e-0501-4d2d-9bde-47a6c1b95669:47a1bc92-8499-433a-bc36-5ff0d11b9dee
---
# Prompt per a Claude: Informe complet amb disseny editorial

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)
El Mestre demana que Claude genere l'informe complet maquetat i establisca el sistema de disseny de Sóc de Poble per als informes. Es delega a Claude via el canal Cowork (App d'Escriptori).

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f2be3d1e-0501-4d2d-9bde-47a6c1b95669:47a1bc92-8499-433a-bc36-5ff0d11b9dee |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-11T22:22:58.342Z |
| Modificació | 2026-10-11T22:22:58.342Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | Claude Desktop |
| Tokens consumits | N/A |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-11T22:22:58.342Z: esborrany creat; contingut i verificació pendents.

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

En el torn anterior vas crear un disseny espectacular en HTML pur (amb columnes, portades, fitxes, alertes i CSS incrustat) per a l'informe del FICIV. El problema és que vas fer un **resum** del text original, i per tant es va perdre part de l'auditoria i del sentit original de l'informe llarg que ja s'havia redactat prèviament per a Carmen. El Mestre necessita l'informe **complet**, sense deixar-se ni una coma dels textos originals que hi ha a `_wiki_de_poble/04_escriptori/02_investigacio_ia/261011_1400_ficiv_claude/`, però maquetat amb eixa mateixa bellesa editorial.

**Objectiu urgent:**
Agafa el text de:
- `INFORME_PARA_CARMEN.txt`
- `ESBORRANY_MEMORIA_ACTUACION.txt`
- `pressupost_ficiv_2026.csv`
- `escenaris_financament.csv`
I aplica'ls el teu disseny HTML editorial exacte. Volem el text ÍNTEGRE i que siga llegible al mòbil (puja la font a 15pt com a mínim). A més, com aquesta maquetació l'haurem de fer moltes més voltes al futur, dóna a MarIA (al teu informe de sortida) el **codi/sistema de disseny/esquema** precís per poder muntar aquests HTMLs en python a partir d'ara per als propers informes.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- Repassar l'HTML que vas dissenyar a `informe_editorial_ficiv_2026.html`.
- Extreure els textos d'auditoria complets de la carpeta `02_investigacio_ia/261011_1400_ficiv_claude/`.
- Muntar l'HTML definitiu sencer i sense cap retall, amb lletra més gran per al mòbil.
- Explicar les normes del CSS i etiquetes semàntiques perquè MarIA puga encapsular-ho en un script automàtic en el futur per al sistema de disseny.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

Mutilació de text: ÉS IMPRESCINDIBLE mantindre tot el text original. Una fallada ací farà que Carmen no reba l'informe complet.

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
