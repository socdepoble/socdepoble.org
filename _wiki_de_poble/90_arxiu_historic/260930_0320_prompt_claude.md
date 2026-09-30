---
type: prompt
status: esborrany
description: Iteració per a UI tauler, Google Translate i altres tasques
tags:
  - govern
visibility: private
reflex: sdp:torn_f734b982-8506-4d18-8c15-c593bdaf497f:2b5f233e-3422-4891-b87c-42fd583c86fc
---
# Prompt Iteració Claude

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

[pendent]

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f734b982-8506-4d18-8c15-c593bdaf497f:2b5f233e-3422-4891-b87c-42fd583c86fc |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T01:20:14.127Z |
| Modificació | 2026-09-30T01:20:14.127Z |
| Propietari | Claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.1.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-09-30T01:20:14.127Z: esborrany creat; contingut i verificació pendents.

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

Hola Claude! Reprenem la sessió des de l'última acta marmota. 
El nostre objectiu per a aquesta iteració és:
1. **Revisió adversarial pendent:** Fes una passada sobre els fitxers que els correctors no van poder acabar de revisar: `DetallPeca.jsx`, `CalendariEsdeveniments.jsx`, `AgendaMur.jsx`, `esdeveniment.js`, `ics.js` i els fitxers nous de tooling.
2. **Verificació visual:** A 1440 i 375 px de l'Explorador, l'Agenda del Mur, el Calendari i l'Índex de la Consola.
3. **Directiva d'UI · targetes del tauler:** Implementa el desglossament d'estats interns a la coberta de cada targeta de la Consola. Es fa ampliant `mesuresPagina()` en `src/sections/consola/consolaPagines.js`. Afegeix mètriques com "skills amb semàfor roig", "òrfenes", "fora del cens" sense barrejar-ho amb la signatura de "Canvis nous".
4. **Traductor (Google Translate):** Investiga si podem integrar el giny de Google Translate sense que reescrigui el DOM i xoqui amb React, retallant els menús per al nostre ús (llista tancada d'idiomes, menú propi Pedra Seca), i compara-ho amb alternatives com Bergamot.
5. **Dades del Mur:** Arregla el comportament de `mapejadorSeccions.js` (inventa la data) i `EventCard.jsx` (llig en UTC).
6. **Deute de portes previ:** Arregla la porta Frontmatter per a les carpetes i torns caducats.
7. **Actualitzacions Automàtiques (WP):** El nou plugin de WordPress (`socdepoble-enxufe`) requereix suport per al canal d'actualitzacions automàtiques natives de WP (la columna "Enable auto-updates" a la llista de plugins està buida). Revisa l'`actualitzador.php` i assegura't que s'enganxa correctament als filtres de WordPress perquè l'usuari puga activar les auto-actualitzacions del Súper Plugin.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Revisió adversarial.
- T2: Verificació visual.
- T3: UI Tauler - Desglossament de mètriques per targeta.
- T4: Recerca i decisió sobre l'enxufe del traductor.
- T5: Correccions menors de Dades del Mur i Deute de portes.
- T6: Actualitzacions automàtiques al plugin de WordPress.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

[pendent]

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 74786a2ee504fa2234f0e9b79c3bc0ae140288823196482702e5f2f78a8783c9. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
