---
type: prompt
status: esborrany
description: Prompt de desenvolupament Frontend per clonar Loiverse
tags:
  - govern
visibility: private
reflex: sdp:torn_402313e4-3446-4d79-bb2b-fee87b9fc21a:d19b5069-d697-4304-b740-8725becdd166
---
# Prompt TPV Loiverse

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
| Identificador | sdp:torn_402313e4-3446-4d79-bb2b-fee87b9fc21a:d19b5069-d697-4304-b740-8725becdd166 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-06T10:14:01.890Z |
| Modificació | 2026-10-06T10:14:01.890Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | Claude |
| Tokens consumits | Pendent |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-06T10:14:01.890Z: esborrany creat; contingut i verificació pendents.

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

Ara que has acabat l'auditoria de seguretat, anem a canviar de barret i obrir el front de Desenvolupament Frontend en aquest mateix context. L'objectiu d'aquest segon assalt és crear la interfície del TPV Universal (que servirà per al Bar de la Parròquia i per a la Llista de la Compra/Rebost). 

Has de llegir obligatòriament la nova skill d'arquitectura visual: `.agents/skills/sdp-clon-loiverse/SKILL.md`.

Volem que calques al mil·límetre la interfície de Loiverse que hi ha a les captures proporcionades pel Mestre. Aprofita tot l'espai i fes que "es veja més que es llija". Aquesta interfície haurà de viure de forma harmònica dins del nostre Espai de Treball (la barra fosca i la barra taronja). Més endavant la Nano Banana s'encarregarà de canviar les imatges per solucionar problemes de drets, així que de moment construeix el component base i la distribució de la graella de productes i categories.

A més d'aquesta maquetació base de Loiverse, has d'establir el model per unificar la gestió de productes. S'han de separar:
1. Productes per a casa (domèstics / llista de la compra).
2. Productes per a bars: qualsevol bar ha de poder entrar (com a usuari registrat), posar la seua marca i vendre els seus productes. Han de tindre una "Carta digital" i una "Carta de menjar per a casa" (take away).

**IMPORTANT - CAPACITAT OFFLINE:** Programa i dissenya l'arquitectura del TPV sempre tenint en compte que haurà de poder funcionar en mode offline (sense connexió a Internet). Aquest és un dels nostres objectius clau al costat de la hipermodularitat, perquè puguem treballar sense estar sempre connectats.

Assegura't de comprovar que la capacitat d'entrar com a usuari registrat (login) funciona perfectament dins del sistema i està integrada en aquesta nova interfície TPV.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Llegir la Skill:** Revisa detalladament `.agents/skills/sdp-clon-loiverse/SKILL.md` per entendre la filosofia Pedra Seca i la clonació.
2. **Revisar l'Espai de Treball:** Llig l'estat actual de la UI de Sóc de Poble a `src/` (les barres de navegació).
3. **Desenvolupar el Frontend:** Crea el component base `UniversalTPV.jsx` (o similar) reproduint la barra fosca i l'àrea blanca de tiquets a l'esquerra, i la graella aprofitable a la dreta per a categories i productes.
4. **Informe i Entrega:** Redacta un relleu d'estat a l'Escriptori en finalitzar.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **No calcar la interfície:** Crear un disseny nou i inventat en lloc de replicar l'eficiència tàctil de Loiverse.
- **Tocar codi de seguretat recent:** Esborrar o xafar res del que hàgem consolidat prèviament en aquest torn. Només s'han de crear/modificar components de la interfície del TPV.

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
