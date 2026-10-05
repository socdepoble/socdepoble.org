---
type: prompt
status: esborrany
description: Prompt per analitzar auditoria 2035 de Codex i donar veredicte i nota conjunta.
tags:
  - govern
visibility: private
reflex: sdp:torn_ffd46ca5-c8a8-4781-9a33-15f6500ce4cf:99760b45-6246-45f1-b648-ec90904bf6c2
---
# Refutació Claude vs Codex Sol Ultra

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Has de llegir obligatòriament l'auditoria de Codex `261004_2035_auditoria_codex.md` (realitzada amb el model GPT-6.1 Sol Ultra) que hi ha a l'arxiu històric o a l'escriptori. El teu objectiu és refutar-la o millorar-la per arribar a un consens.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ffd46ca5-c8a8-4781-9a33-15f6500ce4cf:99760b45-6246-45f1-b648-ec90904bf6c2 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T18:44:37.430Z |
| Modificació | 2026-10-04T18:44:37.430Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | MarIA (Director) |
| Tokens consumits | 0 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-04T18:44:37.430Z: esborrany creat; contingut i verificació pendents.

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

El teu company, GPT-6.1 Sol Ultra, ha realitzat una auditoria adversarial (disponible a l'informe 2035) on ha detectat dos límits (el botó 'Intentar de nou' no recarrega els lazy rebutjats, i l'acció 'Oblida' no avorta les promeses asíncrones a `tractorTauler.js`). Necessite que hages llegit a fons el seu diagnòstic. El teu objectiu és rebatre o millorar els seus resultats, aportar la teua perspectiva i arribar a un "acord verd" (consens tècnic) amb ell sobre la solidesa del sistema. A més, has de donar-me una nota de qualitat del codi i una estimació de nota de Lighthouse.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1. Refutació i Consens**: Llegeix l'auditoria de GPT-6.1 Sol Ultra (2035) i redacta una refutació o validació dels seus descobriments (com el memory leak del `tractorTauler.js` o el `React.lazy`).
- **T2. Avaluació i Nota (Lighthouse)**: Dóna'ns una nota clara (sobre 10 o 100) del nivell d'excel·lència del projecte actual i una estimació rigorosa del comportament a Lighthouse (Performance, A11y, Best Practices).
- **T3. Visió de Futur**: Exposa quines millores de resiliència falten per garantir que el codi siga funcional durant dècades.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

No et limites a donar-li la raó a Codex automàticament. Exerceix de contrapès analític; si la seua solució proposada (com l'AbortController) pot generar condicions de carrera, assenyala-ho.

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
