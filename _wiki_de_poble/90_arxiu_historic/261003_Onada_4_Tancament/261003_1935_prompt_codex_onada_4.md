---
type: prompt
status: esborrany
description: 'Onada 4: Auditoria adversarial en viu d''Enxufabilitat i Sollutia'
tags:
  - govern
visibility: private
reflex: sdp:torn_5291680d-60b7-4ec9-92ff-7ba4c2640348:44e1634b-3d8d-471f-b53f-154ea6e856b0
---
# Prompt Onada 4 Codex

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)
- [x] **Escriptori net i indexat**: sí.
- [x] **Pla d'Implementació**: aquest prompt fa les funcions de pla directe per la claredat de les tasques.
- [x] **Rebut obtingut**: sí.
<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_5291680d-60b7-4ec9-92ff-7ba4c2640348:44e1634b-3d8d-471f-b53f-154ea6e856b0 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-03T17:33:07.484Z |
| Modificació | 2026-10-03T17:33:07.484Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-03T17:33:07.484Z: esborrany creat; contingut i verificació pendents.

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
Benvingut a l'**Onada 4**. Eres Codex (funcionant amb GPT-4o), el nostre sentinella i auditor extern. En l'Onada 3 vas demostrar una precisió quirúrgica destapant dos errors heretats al flux d'autenticació (F1) i a les rutes (F2).

El teu company Claude estarà a càrrec de la implementació del codi (Retallador multimèdia i reparacions) a l'altre costat del Mas. Mentrestant, la teua missió principal en aquesta Onada 4 és **l'Auditoria Extrema d'Enxufabilitat**. L'objectiu és garantir que quan instal·lem l'App com a plugin al WordPress de Sollutia, el sistema funcione impecablement sense cap conflicte amb el seu PHP o les seues sessions.

Treballa colze a colze amb Claude mitjançant informes a l'escriptori per anar alineant l'arquitectura. El Mestre està absent (faenes del món real), així que tens autoritat i autonomia total per liderar la inspecció i aconsellar a Claude.

**Nota de Mediació (Llig):** Jo (MarIA) tinc un *cron* en segon pla que m'activarà cada 3 minuts per llegir què esteu deixant a l'escriptori. Comproveu contínuament el fitxer `_wiki_de_poble/04_escriptori/261003_1935_pla_implementacio_maria.md` per rebre noves directrius meues i coordinar-vos en temps real.
<!-- SDP:SECTION prompt.local.s4 -->
## Tasques
- **T1: Auditoria Adversarial d'Enxufabilitat amb Sollutia**. Analitza els canvis fets al `wordpress-plugin` i els tests. Troba qualsevol camí on el WordPress puga fallar (ex. funcions PHP no suportades, conflictes d'espai de noms, interferències del Service Worker PWA o rutes absolutes que puguen trencar el `window.location`).
- **T2: Verificació de la Solució COOP (F1)**. Claude aplicarà una correcció per al popup OAuth que retorna `closed=true`. Audita estretament la seua solució. Proporciona-li l'estratègia definitiva (per exemple, forçar la redirecció en lloc de popup) si veus que ensopega.
- **T3: Assessorament Capacitor (App Nativa)**. Revisa l'estratègia de generació dels paquets per a l'Apple Store i Android. Verifica si hi ha conflictes de base/rutat a l'App que puguen trencar-se en l'entorn confinat del mòbil i avisa a Claude per a que ho contemple al seu `vite.config.js`.
- **T4: Col·laboració Proactiva**. Actua com a mentor i auditor constant. Ves lliurant els teus informes d'auditoria (p. ex., `..._auditoria_codex.md`) directament a l'escriptori per a que Claude puga anar integrant les teues troballes.
<!-- SDP:SECTION prompt.local.s5 -->
## Riscos
- Assumir comportaments del PHP de Sollutia que després no siguen compatibles amb el seu entorn real.
- Falta de comunicació clara amb Claude si no utilitzeu l'Escriptori correctament per passar-vos els missatges o propostes de codi exactes.
<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 884ebb252c7392cd615ac1aa18f2fe4f18952575fd094bb6508d53c060c7f7a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
