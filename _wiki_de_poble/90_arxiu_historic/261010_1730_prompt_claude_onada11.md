---
type: prompt
status: esborrany
description: Prompt global per a l'Onada 11
tags:
  - govern
visibility: private
reflex: sdp:torn_f7f78604-c157-48db-88f1-ffc387a41d76:1ecb225e-7c4b-4485-94b4-18bb5006990a
---
# Prompt Onada 11

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

[pendent]

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f7f78604-c157-48db-88f1-ffc387a41d76:1ecb225e-7c4b-4485-94b4-18bb5006990a |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-10T15:26:50.941Z |
| Modificació | 2026-10-10T15:26:50.941Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-10T15:26:50.941Z: esborrany creat; contingut i verificació pendents.

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

L'Onada 11 té l'objectiu de sanejar les targetes de la Consola, implementar el Panell de Superadministrador, investigar l'arquitectura de xifrat BYOP i resoldre l'impecabilitat de `design_guard`. També cal solucionar l'Índex de Continguts i el bug de la taxonomia de la plantilla viva.

🚨 **INCIDÈNCIA EXTREMADAMENT GREU (Registrada per la IAIA MarIA):** 
S'ha detectat un oblit catastròfic en l'edició de l'arquitectura documental. Després d'invocar la creació d'aquest document mitjançant `document.mjs create`, la IAIA no va procedir a omplir els blocs «pendent» d'Instruccions, Tasques i Riscos, enviant-ho com si estigués llest. Aquest fet posa en relleu una manca de seguiment en la construcció de plantilles. És responsabilitat teua (Claude/Fable) auditar sempre que rebes una plantilla per confirmar que s'han emplit i, en el cas de dissenyar una automatització, assegurar que no queda buida.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Bug Taxonomia:** Resol el problema on `porta-plantilla-viva.mjs` i `protocolledge.json` xoquen (Decisió 11 de l'Onada 8).
2. **Superadmin i 2FA (TOTP):** Implementar el Panell de superadministrador i integrar un factor 2FA (AAL2) robust per permetre tancar la consola (Decisió 12 de l'Onada 8).
3. **Neteja _design_guard_:** Arreglar les 9 infraccions pendents en els fitxers antics perquè la suite torne a ser 100% impecable.
4. **BYOP (Seguretat IndexedDB):** Elaborar una ADR criptogràfica (AES-GCM i PBKDF2) per protegir les dades de la Gestoria.
5. **Índex Consola i Revisió de Plugins:** Implementar un Índex de Continguts visual per a la Consola Termodinàmica perquè siga entenedora d'una ullada. A més, s'ha de revisar on estan les 13 targetes originàries. Hem de recuperar especialment un plugin gratuït que utilitzàvem per veure la **"saturació de nodes"** (nodes DOM o de dades) fa mesos i assegurar-nos de que torna a estar actiu si cal.
6. **Prova d'Aplanament (Flatten):** Realitza una prova d'aplanament del codi. Revisa i elimina divs superflus i estils perduts (dead CSS/classes no utilitzades) per reduir profunditat innecessària al DOM i guanyar puresa. 
7. **Resolucions Pendents Onada 10:** Tanca i executa les 16 pautes (decisions menors) que van quedar escrites a l'auditoria anterior.
8. **SEO Dinàmic WhatsApp:** Plantejar l'actualització del PHP amfitrió per pre-renderitzar l'OpenGraph segons la ruta, evitant mostrar sempre `gentdelatorre.net` genèric.
9. **Arqueologia i Rescat (L'Antiga Web):** Tens permisos complets atorgats pel Mestre per explorar l'antiga web (la versió antiga de la Consola i altres directoris històrics o de producció com `.quarantena` si fa falta). Has d'investigar a fons i extraure qualsevol idea, plugin (com el dels 13 nodes que cercàvem) o funcionalitat valuosa que se'ns haja quedat al tinter. Una volta hem destil·lat tot el valor i estiga integrat o recollit com a llavor, l'objectiu últim serà l'**eliminació total de l'antic sistema** abans d'actualitzar, ja que els nous nodes offline s'escriuran des de zero en el futur.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- El canvi al panell Superadmin no pot entorpir el sistema d'usuaris ordinaris.
- Xifrar l'IndexedDB és delicat. No utilitzes cap llibreria massiva, centra't en solucions natives i pures amb Web Crypto API per respectar la Pedra Seca.

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
