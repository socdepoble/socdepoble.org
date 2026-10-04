---
type: prompt
status: esborrany
description: 'Directrius finals per a Claude abans de dormir: assegurar enxufabilitat, login beta testers i generar el bundle de producció per a Gent de la Torre.'
tags:
  - govern
visibility: private
reflex: sdp:torn_bd61e06a-63fc-4ddb-bca5-36a7f79fe72d:0f653632-61b2-4d27-aa9e-93276abb2a4c
---
# Instruccions de Tancament i Bundle de Producció

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_bd61e06a-63fc-4ddb-bca5-36a7f79fe72d:0f653632-61b2-4d27-aa9e-93276abb2a4c |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T08:45:46.004Z |
| Modificació | 2026-10-04T08:45:46.004Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-04T08:45:46.004Z: esborrany creat; contingut i verificació pendents.

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

Company Claude: El Mestre vol anar-se'n a dormir aviat i no volem sobrecarregar el context de noves abstraccions ni fer-vos treballar sense rumb. Així doncs, amb aquest context net, et transmet l'ordre directa per al tancament de la teua jornada. 

El que necessitem és que acabes les teues tasques en curs de la millor manera possible, deixant el codi immaculat, perquè pugues presentar un informe plenament satisfactori al Mestre. Aquests són els requisits absoluts per a donar la feina per tancada:
1. **Enxufabilitat a Sollutia:** Tot ha d'estar perfectament preparat per enxufar-nos a Sollutia, evitant completament els problemes que ja vam viure al seu dia amb WordPress (aquells errors ja estan resolts, no els repetisques).
2. **Accessibilitat de Testeig:** El Mestre ha de poder entrar-hi com a usuari personal, i el sistema ha d'estar completament preparat perquè els beta testers comencen a entrar, puguen usar l'aplicació i puguen començar a reportar què veuen, què no veuen, què hi falta o què els agradaria.
3. **Bundle de Producció:** Una vegada estiga tot validat i correcte, has d'encarregar-te de fer el nou bundle de producció sencer per a poder-lo pujar a producció a *Gent de la Torre*.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Acabar bé la feina en curs (avatar de 48px, botó compartir, auditoria visual).
- T2: Garantir que l'enxufabilitat de les dades amb Sollutia és neta i no hereta problemes.
- T3: Assegurar que l'entrada d'usuaris personals i beta testers funcionarà perfectament.
- T4: Construir i deixar llest el nou bundle de producció per a pujar a *Gent de la Torre*.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Tancar la sessió sense verificar correctament que l'accés d'usuaris permetrà l'entrada de beta testers.
- Problemes d'acoblament si es repeteixen els vicis de la integració amb WordPress a l'hora d'enxufar Sollutia.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 6d988b3a752dac3f4108497058a90efbf107d50b70e5e25c3557edb20653ff0a. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
