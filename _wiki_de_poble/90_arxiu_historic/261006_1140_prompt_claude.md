---
type: prompt
status: esborrany
description: Prompt d'estudi de la checklist d'AyudaWP
tags:
  - govern
visibility: private
reflex: sdp:torn_402313e4-3446-4d79-bb2b-fee87b9fc21a:1126ae42-44dc-4b2f-85f8-3dfe82a685ec
---
# Prompt Segona Tanda

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] L'Escriptori està net.
- [x] S'ha obert el torn correctament.
- [x] La instrucció al Consell és clara i sense ambigüitats.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_402313e4-3446-4d79-bb2b-fee87b9fc21a:1126ae42-44dc-4b2f-85f8-3dfe82a685ec |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-06T09:39:46.825Z |
| Modificació | 2026-10-06T09:39:46.825Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | Claude |
| Tokens consumits | Pendent |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-06T09:39:46.825Z: esborrany creat; contingut i verificació pendents.

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

El Mestre demana que estudiem la llista de comprovació (checklist) de Fernando Tellado per a netejar un WordPress infectat, disponible a `_wiki_de_poble/04_escriptori/01_produccio/checklist-limpieza-wp-ayudawp-complet.csv`, i que lliges també el text de l'article original d'on ix que hem guardat a `_wiki_de_poble/04_escriptori/01_produccio/article-ayudawp.md`.

L'objectiu principal és analitzar aquest document (pensat per a WordPress) per tal de veure si podem adaptar o extrapolar alguna bona idea, pràctica de seguretat, o procediment d'auditoria al nostre propi sistema de Sóc de Poble (basat en un frontend React hiperenxufable, Supabase com a font de veritat, i IAs automatitzades). Volem enfortir la nostra seguretat, resiliència i higiene operativa. Llig el CSV detingudament i fes un informe extraient els conceptes arquitectònics i operatius que podem aprofitar, destil·lant la "filosofia de seguretat" darrere d'aquests 77 passos.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Lectura i assimilació:** Llegir detingudament el fitxer `_wiki_de_poble/04_escriptori/01_produccio/checklist-limpieza-wp-ayudawp-complet.csv` i llegir l'article emmagatzemat a `_wiki_de_poble/04_escriptori/01_produccio/article-ayudawp.md` per tindre el context original sencer sense necessitat d'eixir a internet.
2. **Anàlisi abstracta:** Analitzar les 8 fases de neteja (des de la fase 0 fins a la 7) i els seus 77 punts, abstreient els conceptes més enllà de WordPress (PHP, plugins, etc.).
3. **Extrapolació:** Identificar quines idees, polítiques o pràctiques es poden aplicar a l'arquitectura de Sóc de Poble per millorar-ne la seguretat, l'aïllament i la prevenció.
4. **Informe d'auditoria:** Redactar un informe clar a l'Escriptori amb les conclusions i propostes concretes de millora que haurem d'implementar en la nostra arquitectura.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Literalitat innecessària:** Prendre mesures de seguretat específiques de WordPress o PHP i intentar aplicar-les on no tenen sentit (ex. canviar prefixos de taules SQL quan usem RLS a Supabase). Cal enfocar-se en l'abstracció i la filosofia de seguretat en profunditat.

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
