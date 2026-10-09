---
type: prompt
status: esborrany
description: Tasques de UX de caputxa, botó xat i automatització Wikipedia
tags:
  - govern
visibility: private
reflex: sdp:torn_1b6c8a9a-cd6d-4053-9241-39681ce17ca1:e3bd0527-27e5-40d6-ae9a-48d610e4da29
---
# Prompt Claude Onada 5 UX i Pobles

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

L'entorn està net. M'he encarregat de documentar els problemes en el **Pla d'Implementació** adjunt: `261008_2345_pla_implementacio_onada5.md`.
**TRACTOR COGNITIU DE L'OLIVERA:** Has d'obrir OBLIGATÒRIAMENT el Pla d'Implementació de l'Escriptori abans de continuar. Llegeix-lo i fes-lo teu per consensuar una solució conjunta. No passes per alt aquesta ordre directa!

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1b6c8a9a-cd6d-4053-9241-39681ce17ca1:e3bd0527-27e5-40d6-ae9a-48d610e4da29 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-08T21:45:22.701Z |
| Modificació | 2026-10-08T21:45:22.701Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | claude-3-5-sonnet |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-08T21:45:22.701Z: esborrany creat; contingut i verificació pendents.

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

El Mestre ha proporcionat instruccions visuals i orals per a refinar l'experiència d'usuari de l'App (Onada 5), centrades principalment en la pàgina de Pobles i el routing. Ens demana fixar l'ordre de la barra inferior, polir l'anatomia de la card de "Pobles", desdoblar el comportament del clic a la card per anar al poble o al xat de l'entitat segons on es clique, resoldre un 404 de Supabase i dissenyar l'algoritme/scraper de Wikipedia per a nous pobles. A més, se sol·licita una investigació documental dins de la Gestoria sobre l'estat de publicació a les botigues d'apps (Google i Apple) i el repositori de WordPress.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Slugs i Imatges SEO:** Assegurar que els Slugs i URLs directes com `gentdelatorre.net/#/chat` carreguen perfectament en copiar/apegar (hidratació). També, la imatge d'OG/SEO per defecte ha de ser el logotip quadrat verd (a `assets`).
2. **Ordre i Espaiat del Menú (Tabbar):** 
   - Reordenar els pestanyes inferiors a: `Xat, Mur, Mercat, Pobles`. A "Pobles" no s'hi publica. És un enroque on pugen dalt els pobles de les persones que publiquen al Mur o Mercat.
   - **Molt important:** Fes que els 5 icones estiguen més separats entre si (més aire) perquè actualment estan massa comprimits al centre i deixen molt d'espai negre sobrant als laterals. Troba una proporció visual harmònica.
3. **Caputxa Naranja i Card a "Pobles":** 
   - A la llista de pobles, el títol de la "caputxa" ha de ser l'entitat: `Gent de la Torre` i el subtítol el poble `La Torre de les Maçanes` (no la comarca com ara).
   - Fer que un clic sobre aquesta caputxa porte a la pàgina de Xat de `Gent de la Torre`.
   - Fer que un clic al cos o a la foto porte a la pàgina del Poble.
4. **Anatomia de la Pàgina Poble:** Un cop dins del poble `/pobles/la-torre...`:
   - Mostrar el Logotip per a Pobles (Sóc de Poble).
   - Sota el logo: H1 per `Gent de la Torre` i H2 per `La Torre de les Maçanes`.
   - Entradilla tipus Wikipedia.
   - Sota de l'entradilla: **Botó blau gros** per anar al xat de "Gent de la Torre".
   - Utilitza la província (Categoria) i comarca (Etiqueta, ex: `l'Alacantí`) per categoritzar la informació dels pobles.
5. **Algoritme de Wikipedia per Pobles Nous:** Defineix, documenta i prepara un script o lògica per quan un nou habitant registra un poble que no existeix: cal que el sistema rasque Wikipedia per portar-se les 3 fotografies necessàries (Panoràmica, Avatar, Imatge de reserva), genere els H1/H2, l'entradilla i l'enllaç del botó del xat de forma autònoma.
6. **Bug Supabase 404 (obri_fil_de_pagina):** Hi ha un problema per resoldre amb la crida POST RPC `obri_fil_de_pagina` que torna Not Found quan obrim la pestanya Xat o un fil. Prepara el script SQL si és necessari o corregeix l'endpoint per arreglar el flux de base de dades.
7. **Estat de la Gestoria (Publicació a Botigues):** El Mestre et dona permís total per investigar i analitzar els documents i seccions de la "Gestoria". Vol un balanç (Estat de la qüestió) de com estem amb aquests tres fronts de publicació:
   - Facturació de connexió a internet / Apple Developer (la factura d'Apple va ser cap a març o abril).
   - Estat de l'aplicació a la Google Play Store (el Mestre diu que estem molt avançats, què ens falta per publicar-ho al més aviat possible?).
   - Estat de l'extensió de WordPress (el plugin pesa molt; comprova si el podrem pujar i actualitzar des del repositori oficial de WP o com ho resolem).

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- No es pot trencar el Routing actual per `hash`, requeriment vital per poder enxufar-nos mitjançant WordPress.
- Alterar la navegació i l'enllaç des de les cards podria impactar accessibilitat si no es fa mitjançant Pedra Seca de manera correcta.
- La lògica de l'Script de Wikipedia s'ha de dissenyar de forma asíncrona, robusta i respectuosa (rate limits).

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
