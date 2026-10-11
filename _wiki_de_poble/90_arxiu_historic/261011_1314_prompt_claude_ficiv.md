---
type: prompt
status: esborrany
description: Prompt per a l'anàlisi de la subvenció del Festival FICIV per a Carmen Chaves
tags:
  - govern
visibility: private
reflex: sdp:torn_39e9e0e0-9f43-4a07-aa77-4a250239504f:34354aa0-f153-48f6-9012-c134135dc5f7
---
# Auditoria Subvenció FICIV

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

[pendent]

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_39e9e0e0-9f43-4a07-aa77-4a250239504f:34354aa0-f153-48f6-9012-c134135dc5f7 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-11T11:14:46.620Z |
| Modificació | 2026-10-11T11:14:46.620Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-11T11:14:46.620Z: esborrany creat; contingut i verificació pendents.

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

Hola Claude! El Mestre ens demana una tasca completament fora de l'ordinari, però crítica per a la supervivència d'un festival al qual tenim molt d'afecte: el **FICIV** (Festival Internacional de Cine Infantil de València), liderat per la companya Carmen Chaves.
L'objectiu és analitzar tota la documentació burocràtica de la convocatòria (les bases de l'IVC) i els documents que Carmen ja ha elaborat (Memòria, Hojas de Méritos) per optar a la màxima puntuació possible i aconseguir l'ajuda econòmica. Aquestes subvencions s'aproven en règim de concurrència competitiva, i necessitem oferir a Carmen una perspectiva analítica precisa i contundent.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. Llig exhaustivament tots els documents de text de la carpeta `_wiki_de_poble/04_escriptori/textos_subvencio` (les versions extretes per MarIA dels PDFs originals). Presta especial atenció al document `01 AUTOBAREMO FESTIVALES_CAS.pdf.txt` i a les bases `convocatoriafes202629661cas.pdf.txt`.
2. Analitza la redacció de Carmen (`Memoria actuación 2026.pdf` i `HojademéritosFiciv2026.pdf`). Estan tots els criteris de l'autobarem coberts? Hi ha conceptes que sobren o falten? Fes una llista detallada de recomanacions de millora (redacció, èmfasi, punts de baremació no explorats).
3. Converteix o millora l'esborrany financer (`00 Ficha Presupuestaria FES CIN JOR CON GOY ASO_CAS_signed.pdf`) elaborant un o més documents en un format útil (com un text csv, markdown tabulat, o recomanacions per a Excel), que ajude a justificar els criteris econòmics de manera inqüestionable, presentant escenaris de finançament si escau.
4. Explica a Carmen, en un informe accessible, com resoldre els annexos que encara puguen estar pendents.

Utilitza TOTS els teus recursos per no deixar cap via d'escapatòria a l'administració; necessitem guanyar aquesta subvenció. 

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Els documents pdf poden ser extremadament feixucs i burocràtics; no obvies cap lletra menuda.
- No alteres informació veraç del Festival, ens limitem a potenciar la justificació segons el que està escrit i a aconsellar si un concepte està mal enfocat o subrepresentat.

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
