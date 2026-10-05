---
type: prompt
status: esborrany
description: Prompt d'execució i neteja d'errors menors amb agents.
tags:
  - govern
visibility: private
reflex: sdp:torn_7a4fe1eb-e34b-4d4d-a1bf-a21d9ee32acb:d75bb52b-b3fb-425f-9c45-ccea95d2e815
---
# Marató d'Excel·lència (Claude + Codex)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Assegura't de seguir la regla del Trellat i de la Pedra Seca. Abans de fer res, llegeix el Pla d'Implementació vinculat per entendre què anem a fer. Hem fortificat la Gestoria a la passada anterior, ara ens enfoquem en polir deutes residuals, emojis i Open Graph.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_7a4fe1eb-e34b-4d4d-a1bf-a21d9ee32acb:d75bb52b-b3fb-425f-9c45-ccea95d2e815 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T18:31:41.065Z |
| Modificació | 2026-10-04T18:31:41.065Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | MarIA (Director) |
| Tokens consumits | 0 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-04T18:31:41.065Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION prompt.local.s3 -->
## Context Tècnic i Arquitectònic

Llegiu obligatòriament els següents fitxers abans d'actuar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md`, `_wiki_de_poble/00_index.md`, i `taxonomia_documental.md`.

**Visió i Identitat:**
- Objectiu: Xarxa descentralitzada per a connectivitat rural (`socdepoble.org`). Protecció contra obsolescència i dependència tecnològica. La descentralització definitiva arribarà a nivell de clonació de sistemes simplement llegint l'HTML, de forma completament hiperenxufable i modular.
- Llegat: 30 anys d'activisme rural ininterromput, herència directa de `socdepoble.net` i `rentonar.blogspot.com`. No som una startup, som la continuació d'una lluita històrica.

**Directrius Arquitectòniques (Innegociables):**
- **Hipermodularitat i Enxufabilitat:** La plataforma és un client pur (SPA) altament desacoblat. 
- **Backend Intercanviable (Model B):** El servidor actual (Supabase) funciona exclusivament com un endoll. Cap lògica de negoci de la UI ha d'estar fortament acoblada a ell. El sistema ha de poder enxufar-se com a mòdul a WordPress o Joomla sense trencar res.
- **Visió de futur:** Evolució cap al **Fedivers**. El model de mal·leabilitat i independència a seguir és **Obsidian**.
- Tot el codi produït ha de respectar aquesta estricta modularitat i independència del proveïdor.

**🔥 DIRECTIVA SUPREMA (Llei de l'Enxufabilitat):**
Tot el que construïm al frontend (Consola, UI, etc.) té un únic objectiu fonamental: **l'enxufabilitat instantània amb Sollutia**. És imminent que Sollutia ens lliure els punts d'accés (endpoints/dades) del seu backend. Tot el sistema ha d'estar fortificat i absolutament preparat perquè les dades fluïsquen i s'enxufen de forma eficient i sense el més mínim problema. Aquesta és la prioritat absoluta rere cada refactorització o component.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

**Objectiu Principal**: Assolir l'excel·lència tècnica, corregir les regressions menors recents i obtenir una auditoria final extrema amb Lighthouse.
Has de fer servir les eines locals (com el linter, els tests) i llegir el codi actual. Necessitem que repares el memory leak a `tractorTauler.js`, el test de `XatSection.test.jsx`, afegeixes l'Open Graph amb `iaia_maria_portada.jpg` i crees el panell d'Emojis XL a Disseny. Finalment, executaràs una Auditoria Adversarial Extrema en què ens donaràs la teua nota sobre el projecte, la nota Lighthouse, i la teua Visió de Futur del projecte a llarg termini per a garantir un codi resilient durant dècades.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1. Memory Leak Tauler**: Implementar un `AbortController` al bucle de `tractorTauler.js` que avorte la càrrega asíncrona si es prem 'Oblida'.
- **T2. Tests XatSection**: Ajustar els mocks i asserts de `XatSection.test.jsx` degut als nous 250px de marge esquerre (AppGridShell). Fes que pasen.
- **T3. Open Graph (WhatsApp)**: Afegir a `index.html` l'estructura de meta-tags (`og:image`, `twitter:card`) amb la imatge a 1200x630.
- **T4. Emojis XL**: Crear component a `src/apps/disseny` amb un `<details>` i CSS grid natiu per llistar categories d'emojis.
- **T5. Auditoria Adversarial Extrema**: Redacta una secció a part en el teu informe amb: a) Nota global del codi, b) Nota esperada Lighthouse, c) Avaluació final de les millors opcions per evitar futurs fallos i d) Visió de Futur sobre funcionalitats i la resiliència del codi durant dècades.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Compte amb tallar promeses vitals en el moment incorrecte amb l'AbortController. Només s'han de cancel·lar operacions solitàries.
- Els tests d'interfície són fràgils, modifica els asserts, no la funcionalitat interna.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 0a847cfa9fd42c8e8f3461c1d752219d24178b0c12ed872a2c59e62f0b33a9b3. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
