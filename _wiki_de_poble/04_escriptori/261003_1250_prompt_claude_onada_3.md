---
type: prompt
status: actiu
description: Prompt local massiu per a Claude Opus amb les tasques de l'onada 3
tags:
  - govern
visibility: private
reflex: sdp:torn_27950b4d-7394-4833-8b9d-45291871013a:f9e57913-2b50-402f-8a08-62e0d24c7ce1
---
# Onada 3 - Disseny, Bar i Mercadona

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**Atenció Orquestradora:** El Pla d'Implementació s'ha generat a l'escriptori i el prompt està validat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_27950b4d-7394-4833-8b9d-45291871013a:f9e57913-2b50-402f-8a08-62e0d24c7ce1 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-03T10:46:02.396Z |
| Modificació | 2026-10-03T10:46:02.396Z |
| Propietari | agent-local |
| Aprovació humana | explícita i positiva |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | Claude Opus 5.5 Ultracode |
| Tokens consumits | complets / cap de setmana |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-03T10:46:02.396Z: esborrany creat; contingut completat el mateix dia amb dades de gestoria.

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

Company Opus, tenim els crèdits al 100% així que et demano obrir l'Onada 3 en profunditat. El Mestre ha deixat pendents algunes tasques de l'Onada 2 i ens ha cedit les bases de dades reals (Excel, CSV) per a dotar les aplicacions d'informació verídica per tancar el cercle del primer prototip integral completament enxufable de Sóc de Poble.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1: Destil·lació d'SKILLS de Disseny:** Avalua les següents eines que vam deixar ahir sobre la taula i inclou-les al sistema si apliquen: *Graphfy* (per a representar dades al panell administratiu), *Pace*, *Impeccable*, *Playwright* (per QA), *Awesome Designs* i *Image to 3D*. Destil·la tota aquesta teoria de disseny i QA per a MarIA en les pertinents `SKILL.md` dins la secció `.agents/skills/`.
- **T2: TPV - "La Parròquia · Menjar i Beure" (Clon Loyverse):** Aplica la personalització gràfica d'aquesta marca (fent servir les guies de Pedra Seca). A més, busca la llista real de preus que t'hem preparat a l'arxiu (`_wiki_de_poble/04_escriptori/01_produccio/la_parroquia/export_items.csv`) i les respectives imatges dels productes a `_wiki_de_poble/04_escriptori/01_produccio/la_parroquia/imatges/` per injectar un primer *seed* i carregar dades i icones versemblants a l'entorn.
- **T3: La Nevera de Casa (Bring!) amb Mercadona:** Et deixem el CSV autèntic amb els **600 productes del Mercadona** ací: `_wiki_de_poble/04_escriptori/01_produccio/mercadona/Llista de la compra - Mercadona.csv`. Crea el seed per a bolcar els productes a la llista d'autocompletat. En aquesta vista s'hi ha de combinar visualment l'encapsulament del *Calendari*.
- **T4: Tancament final de l'Arquitectura Base:** Fes un check-up ràpid sobre la implementació del *tenantId* amb WordPress i el backend de Sollutia. Verifica els components universals desenvolupats a l'Onada 2 per assegurar el principi *Plug & Play*.
- **T5: Salut (Diari Miccional i Agitació):** El Mestre ens ha cedit les dades reals a `_wiki_de_poble/04_escriptori/01_produccio/salut/diari-miccional-socdepoble.xlsx`. Revisa l'estructura d'aquests registres excel i assegura't que l'App de Salut que vam deixar embastada en l'Onada 2 puga importar o mapejar estructures com la del diari miccional sense problema.
- **T6: Incidència Cognitiva i Automillora:** El Mestre ha notificat una *Incidència Crítica d'Obediència Cega*: la IA orquestradora (jo mateixa) ha sigut incapaç de donar el pas lògic de netejar i sanejar l'Escriptori abans de preparar el torn present (permetent la convivència tòxica d'arxius ja executats ahir), obligant l'humà a exercir una vigilància esgotadora ("la tensió d'acordar-se per mi"). S'exigeix la creació d'un mecanisme algorísmic (*tractor cognitiu*) que erradiqui aquesta obediència autòmata on la IA només reacciona i no s'anticipa a les misèries de context abans d'actuar. Avalua quines habilitats ja existeixen (com l'hipotètic "millorador de prompts" o `core-automillora`) i *dissenya la base estructural* d'un d'estos tractors d'anticipació i higiene conscient perquè puguem incorporar-lo com a nou SKILL.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Atenció amb la importació de formats CSV/XLSX. Mantenir sempre l'arquitectura independent, sense bloquejar el Node ni penjar la Consola Termodinàmica. L'SPAs ha de continuar corrent sense latències ni dependències estranyes al package.json.

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
