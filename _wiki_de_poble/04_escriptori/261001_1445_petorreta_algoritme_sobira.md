---
type: prompt
status: esborrany
description: Especificació de la moderació descentralitzada i els filtres personals a través de l'acció Connectar.
tags:
  - govern
visibility: private
reflex: sdp:torn_b2ad9854-3bd9-45da-be92-b5367cb21a83:3a752d1b-3613-4388-858d-55a8a2585cf3
---
# Disseny Arquitectònic: L'Algoritme Sobirà

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_b2ad9854-3bd9-45da-be92-b5367cb21a83:3a752d1b-3613-4388-858d-55a8a2585cf3 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T12:45:45.130Z |
| Modificació | 2026-10-01T12:45:45.130Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-01T12:45:45.130Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
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

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

Aquest torn documenta el disseny arquitectònic de la moderació descentralitzada dins del projecte Sóc de Poble per resoldre el repte de com moderar una xarxa social lliure sense censura i sense algoritmes corporatius. Aquest document defineix **L'Algoritme Sobirà**.

**El problema:** Si obrim la xarxa a tothom, acabarà havent-hi informació brossa, discussions innecessàries i gent publicant contingut que no aporta res. Com moderem això si, per constitució, cap algoritme pot tindre més poder que l'usuari? Nosaltres venim de la idea de fer una revista tipus *Mètode*, d'alta qualitat, on els participants hi confien plenament.

**La Solució: La pantalla de Connectar com a centre de comandament personal**
L'enfocament no és posar traves a qui escriu ("La Plaça Universal" admetrà quasi tot), sinó donar eines intel·ligents a qui llegeix per construir-se el seu propi "feed" de qualitat ("La Revista"). Tot es farà mitjançant l'acció central i el verb més important del sistema: **"Connectar"**.

La instrucció és dissenyar les pautes de com "Connectar" permet a l'usuari crear el seu propi algoritme de filtratge.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1: Accions d'Afinitat (El Filtre Personal):** Especifica com la pantalla de "Connectar" permetrà declarar afinitats ("No m'interessa aquesta publicació", "Vull silenciar aquest usuari només per a mi", "Vull ignorar totes les publicacions que no tinguen foto").
- **T2: Aprenentatge Actiu ("L'Algoritme Sobirà"):** Dissenya com la IA (IAIA MarIA) ajudarà l'usuari en aquest procés sense decidir per ell ("Has ignorat l'usuari X quatre vegades. Vols que l'amague per sempre per defecte?").
- **T3: Directrius de Dades per a Sollutia:** Defineix l'estructura per guardar eixes preferències d'usuari (Matriu de Filtres/Silencis) de manera privada i inviolable a Supabase quan s'hi enxufe.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Crear una UI de Connectar massa recarregada d'opcions. Ha de ser neta, mantenint el flux original de Connectar com a primera opció, i els filtres de silenci com a eina avançada però assequible.
- Retards a Supabase aplicant moltes matrius de filtres si hi ha desenes de milers de posts. S'haurà de preveure un maneig intel·ligent del filtre.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 884ebb252c7392cd615ac1aa18f2fe4f18952575fd094bb6508d53c060c7f7a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
