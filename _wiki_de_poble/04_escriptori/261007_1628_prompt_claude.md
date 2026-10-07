---
type: prompt
status: esborrany
description: Prompt per a Claude per a reparar els 403 de perfils i integrar els xats per defecte.
tags:
  - govern
visibility: private
reflex: sdp:torn_36180a80-9466-477c-8d3d-1a9c9710bc4e:55527e54-5b43-4ea4-9517-5e6dc341b56e
---
# Auditoria i reparació de perfils i xat

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

1. Deixar l'escriptori net (Porta Olivera).
2. Proporcionar a Claude el context complet sobre el problema de les identitats de xat en producció.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_36180a80-9466-477c-8d3d-1a9c9710bc4e:55527e54-5b43-4ea4-9517-5e6dc341b56e |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-07T14:29:15.408Z |
| Modificació | 2026-10-07T14:29:15.408Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | Claude 3.5 Sonnet |
| Tokens consumits | pendent |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-07T14:29:15.408Z: esborrany creat; contingut i verificació pendents.

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

Claude, necessitem la teua ajuda.
Després de tancar la revisió final i pujar l'empaquetat a producció (Sollutia), han eixit dos problemes en els primers beta testers registrats directament a Supabase:
1. Reben un error 403 (Forbidden) quan intenten guardar el perfil. Açò és perquè les columnes `lema`, `is_public`, etc., encara no tenen permisos `UPDATE` a producció donat que la migració `2610042350_convergencia_perfil_i_create_organization.sql` no es va llançar manualment (no la llança cap agent).
2. No veuen els usuaris de suport "Sóc de Poble" i "Iaia MarIA" als seus xats. Com que estos xats s'injectaven per defecte a la bústia de l'entorn de desenvolupament (via `xatSeed.js`), els beta testers a producció no tenen amb qui parlar al principi. El Mestre ha decidit que per comptes de crear un sistema feixuc de triggers a la base de dades, el mateix frontend (`loadFils` a `src/data/supabase/xat.js`) hauria d'**injectar/sintetitzar per defecte** el xat del Poble (`soc-de-poble`) i el de la Iaia (`/iaia`) al llistat de xats actius per a tots els usuaris si no els tenen encara, permetent iniciar la conversa en fer-hi clic (enllaçant directament a les rutes de resolució).

La teua missió és:
A) Reparar el codi de `loadFils` a `src/data/supabase/xat.js` perquè injecte sempre estos dos perfils per a garantir que sempre apareguen actius per defecte al xat (respectant l'ordre cronològic de les converses o quedant fixats a la cua).
   **Important sobre Sóc de Poble:** El Mestre l'ha creat en producció amb l'identificador (slug) `socdepoble` (SENSE guions). Com que el fitxer `src/data/identitatsSeed.js` deia `soc-de-poble`, hauràs d'ajustar la constant `ENTITAT_PILOT_SLUG` a `'socdepoble'` (o gestionar-ho on pertoque). A més, com que ha fallat la pujada d'imatges, assigna tu a foc el logo quadrat (`/assets/system/ui/logo-socdepoble-cuadrat-verd.svg`) com a avatar d'aquesta entitat a la llista sintètica.
B) Realitzar una **auditoria extrema, adversarial i implacable** a tot el sistema per detectar qualsevol forat ocult de rendiment, coherència de dades, estat de React o desajustos arquitectònics que s'ens hagen passat, i deixar el codi **el més net i pulcre possible**. Mestre ha marxat a menjar, així que aprofita per ser metòdic i profund.
C) Revisar a fons el **Panell de Control** i acabar o arreglar les funcionalitats pendents (ex. RSS, Bàscula Cooperativa que no funcionen correctament).
D) Investigar els errors a la maquinària de la **Consola Termodinàmica** (`/consola`). Explicar el motiu d'absència de dades en producció ("Dades no disponibles en este entorn") i verificar possibles contradiccions o rutes mortes.
E) Investigar i arreglar l'**Editor Universal (TipTap)**: actualment no es pot posar el logotip (o cap imatge) damunt de l'H1 de la pàgina perquè no hi ha cap botó per a fer-ho (almenys a Gent de la Torre no ix). Assegura't de proveir una solució.
F) Elaborar una **bateria de preguntes i dubtes** que pugues tindre sobre estes peces incompletes perquè el Mestre les resolga a la seua tornada. La finalitat última és garantir l'atomicitat i la modularitat extrema de l'arquitectura, preparant-ho tot perquè qualsevol IA futura siga capaç de clonar la pàgina només llegint-ne el codi i els *skills*.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- [ ] Analitzar i modificar `src/data/supabase/xat.js` (específicament `loadFils`) per ancorar per defecte "Sóc de Poble" i "Iaia MarIA" a la llista de converses en cas que no estiguen presents a la llista de `xat_fils_meus` de Supabase.
- [ ] Revisar tota l'aplicació sota un enfocament d'Auditoria Adversarial Extrema. No pressuposes que el codi està bé. Busca edge-cases, memory leaks o rutes mortes, particularment pel que fa a l'Estat del xat, memòria Redux/Zustand o integració dels portals web component.
- [ ] Auditar el Panell de Control i la Consola Termodinàmica per reparar RSS, Bàscula Cooperativa i qualsevol anomalia en la lectura de dades/grafs.
- [ ] Proveir el document final d'auditoria (p.ex. `261007_1640_auditoria_claude.md`) detallant els canvis, explicant el funcionament de la consola en remot, i afegint una **bateria de preguntes** clau per al Mestre per seguir avançant cap a la modularitat total.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Sintetització i navegació de Xats:** Els xats que s'injecten a `loadFils` només existiran a nivell visual fins que l'usuari interaccione i envíe el primer missatge. En eixe moment es cridarà `obriFilDePagina` o `crea_fil_directe`. Cal comprovar acuradament que el botó de xat no es trenca i enllaça perfectament.
- **Rendiment del RAG:** Evitar embrutar el workspace de la wiki. Respectar de manera religiosa l'acte reflex i evitar bucles infinits durant l'auditoria de codi.

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
