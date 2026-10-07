---
type: prompt
status: esborrany
description: Avis per a Claude de la represa del treball en localhost
tags:
  - govern
visibility: private
reflex: sdp:torn_64f5cbf4-2ef3-4489-b406-8c9533a29f95:c9973f1c-771e-4da4-b0e3-7684414451e4
---
# Prompt Claude Represa

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

L'Escriptori està net. S'ha comprovat amb `porta-olivera.mjs` i les 5 dependències s'han conservat expressament per a Claude.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_64f5cbf4-2ef3-4489-b406-8c9533a29f95:c9973f1c-771e-4da4-b0e3-7684414451e4 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-06T23:47:18.495Z |
| Modificació | 2026-10-06T23:47:18.495Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | N/A |
| Tokens consumits | N/A |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-06T23:47:18.495Z: esborrany creat; contingut i verificació pendents.

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

Claude, el Mestre ja ha tornat i acaba d'obrir el `localhost` perquè pugues continuar treballant amb els 6 fronts que tenies pendents de la marató de la matinada (Gestoria offline, Xat, etc.). 

**Directriu Arquitectònica per al Xat (Comentaris = Xat):**
Quan un usuari clique en una targeta (notícia, avís, etc.) per a comentar, pot triar fer-ho en privat o en públic:
1. **Comentari Privat:** S'obri un xat privat exclusiu entre l'usuari i Sóc de Poble. No és visible per a ningú més.
2. **Comentari Públic:** S'obri automàticament un **nou xat públic**, amb la mateixa mecànica que els grups "General" o "Beta testers".
   - El nom d'aquest nou xat serà el mateix que el títol de la targeta (la notícia).
   - Com qualsevol xat públic, qualsevol usuari hi podrà entrar i participar en el debat.
   - Això significa que si 20 notícies obren debat, tindrem 20 xats diferents a la llista.
   
*Concepte clau:* En el nostre sistema modular no tenim un fil de comentaris baix del post a l'estil Facebook o Instagram; **el propi espai de debat d'una publicació és directament un Xat**. Tota la interacció i debat públic succeeix dins del format Xat.

**Directriu Arquitectònica per al Calendari (Component Únic i Compartit):**
El component del Calendari ha de ser **exactament el mateix** als dos llocs on apareix. El calendari que ja tens més avançat és el de la pàgina pròpia de `/calendari` (`CalendariSection.jsx`). Has de:
1. **Incrustar eixe mateix component** dins de la secció del Mur (`MurSection.jsx`), a la pestanya/vista on diu "Calendari".
2. **Esborrar** completament el codi fantasma o component duplicat que vas crear abans exclusivament per al Mur.
3. Utilitzar els mateixos components, la mateixa font de dades i assegurar que l'única fulla d'estils especial del calendari s'aplique correctament a les dues vistes per igual. El disseny, el comportament i l'estil han de ser idèntics (Single Source of Truth).

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- Reprendre l'execució dels 6 fronts de treball paral·lel on t'havies quedat.
- Verificar que els canvis locals estan en l'estat que esperaves abans de fer cap commit.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Fatiga d'artefactes: Compte amb no saturar el teu context amb massa imatges innecessàries, tal i com va passar abans.

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
