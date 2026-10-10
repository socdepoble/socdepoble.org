---
type: prompt
status: esborrany
description: Investigació d'arquitectura per xifrar IndexedDB i blindar la Gestoria en amfitrions de tercers.
tags:
  - govern
visibility: private
reflex: sdp:torn_70dd0d59-76c0-43dc-98e3-85f587c8b732:02e44666-a614-4488-8ee2-28f5ee2a45cf
---
# Prompt Claude Investigació Seguretat Gestoria

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Fet per MarIA: Creació de la plantilla.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_70dd0d59-76c0-43dc-98e3-85f587c8b732:02e44666-a614-4488-8ee2-28f5ee2a45cf |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-10T09:48:44.259Z |
| Modificació | 2026-10-10T09:48:44.259Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-10T09:48:44.259Z: esborrany creat; contingut i verificació pendents.

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

El Mestre ha demanat que els mòduls de la Gestoria i Salut ES PUGUEN instal·lar i executar des de qualsevol amfitrió (Sollutia, WordPress de tercers o qualsevol altre sistema de la xarxa del Fedivers), i que el robatori d'independència que suposava la restricció de la guarda financera ('financeres' i 'salut' només al domini socdepoble.org) s'elimine mitjançant un mecanisme de seguretat més intel·ligent.

La proposta del Mestre és una "doble clau de seguretat": quan el plugin s'instal·la o l'usuari l'obri, ha de posar una segona contrasenya (Bring Your Own Password, BYOP) que xifre les seues dades privades a IndexedDB. Així, fins i tot si el WordPress amfitrió on s'executa la Gestoria està compromès (o l'administrador del WordPress intenta accedir a l'IndexedDB des d'un script maliciós injectat), les dades romandran il·legibles sense la contrasenya de l'usuari.

S'encarrega a Claude una investigació arquitectònica profunda per a dissenyar aquest blindatge criptogràfic del costat del client, possiblement usant la Web Crypto API i PBKDF2/AES-GCM per xifrar les taules sensibles (factures, salut) abans d'inserir-les a Dexie/IndexedDB, de manera que només l'usuari final puga desxifrar-les al vol durant la seua sessió activa.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Disseny Criptogràfic (BYOP):** Dissenya l'arquitectura necessària per a introduir una contrasenya d'accés (segona clau) i usar-la per derivar una clau de xifrat simètric (AES-GCM) amb la Web Crypto API.
2. **Integració amb Magatzem:** Proposa com interceptar la lectura/escriptura en IndexedDB (mitjançant hooks de Dexie o middleware) per xifrar els camps sensibles de les taules (ex: `factures`, `quadern_salut`) al vol, garantint que el que es guarda al disc de l'amfitrió és sempre incomprensible.
3. **Persistència de la Sessió Segura:** Com mantindre la clau derivada a la memòria (RAM, `sessionStorage` o clausura) durant la sessió de l'usuari de manera que l'amfitrió tinga el menor accés possible, i destruint-la en tancar la pestanya.
4. **Viabilitat d'Exportació:** Verifica si això afecta l'exportació nativa en format OOXML (XLSX). Com es desxifraria abans d'exportar?
5. **Redacció de l'ADR de Seguretat:** Aboca els teus descobriments, propostes de passos i pseudocodi en un document que resulte en l'especificació d'una nova ADR sobre Seguretat Criptogràfica per a aplicacions de Tercers.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Intercepció del Teclat / DOM:** Si l'amfitrió WordPress és totalment maliciós i controla el DOM, podria llegir la contrasenya en el moment en què l'usuari l'escriu al camp de text (perquè compartim el context del DOM si no estem en un iframe blindat, tot i que ací es lliura per Shadow DOM o script). Cal valorar si hi ha mitigacions front a injeccions XSS al mateix orígen.
- **Pèrdua de clau = Pèrdua de dades:** Si l'usuari oblida la segona contrasenya, l'IndexedDB local és irrecuperable.
- **Impacte en pes i rendiment:** La Web Crypto API és nativa, de manera que no hauria de fer falta afegir cap llibreria pesada, preservant el requisit del Nucli ultralleuger de l'Onada 7.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 69997976f6e4d34f9041b9e54c4bdf3e2cd7dd4ebb9fe0864b6828cbcb32bb34. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
