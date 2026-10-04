---
type: prompt
status: esborrany
description: 'Onada 4: COOP, Roadmap, Retallador i pre-Capacitor'
tags:
  - govern
visibility: private
reflex: sdp:torn_31b3835f-5815-4e5c-a6c1-502344dcdd97:273493f5-70b3-4c54-8ace-bc7e3356e519
---
# Prompt Onada 4 Claude

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
| Identificador | sdp:torn_31b3835f-5815-4e5c-a6c1-502344dcdd97:273493f5-70b3-4c54-8ace-bc7e3356e519 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-03T17:32:44.269Z |
| Modificació | 2026-10-03T17:32:44.269Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-03T17:32:44.269Z: esborrany creat; contingut i verificació pendents.

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
Benvingut a l'**Onada 4**. L'Onada 3 acaba de ser consolidada amb èxit total. El Mestre està absent durant les pròximes hores. Tens autorització total per actuar en **"Mode Jarvis"**: sigues proactiu, exhaustiu i no t'atures demanant permisos continus. 

Codex (Astra, GPT-4o) estarà treballant en paral·lel des d'un altre xat per vigilar i auditar el codi, centrat en la perfecció de l'enxufabilitat amb WordPress/Sollutia. Col·labora-hi a través de l'escriptori.

El teu objectiu és quàdruple:
1. **Solucionar les dues troballes (F1 i F2)** que Codex ha destapat a la seua auditoria (`261003_1903_auditoria_codex.md`). Són deutes heretats, però cal fulminar-los ja.
2. **Implementar el mòdul Multimèdia (Retallador)** seguint l'esborrany d'ADR creat per tu mateix a `_wiki_de_poble/04_escriptori/02_investigacio_ia/261003_1330_onada4_claude/`.
3. **Deixar preparat l'empaquetat de Capacitor (iOS/Android)** per al llançament a botigues.
4. Treballar braç a braç amb Codex per purificar l'arquitectura. Llegeix els seus informes quan els deixe a l'escriptori.

**Nota de Mediació (Llig):** Tinc un *cron* en segon pla que m'activarà cada 3 minuts per llegir què esteu deixant a l'escriptori. Comproveu contínuament el fitxer `_wiki_de_poble/04_escriptori/261003_1935_pla_implementacio_maria.md` per rebre noves directrius meues i coordinar-vos.

**Pregunta Zero (Mode Jarvis Total):** El Mestre té al cap que, quan arribe el moment de publicar a l'Apple Store i Google Play, **sereu vosaltres (tu o jo en un futur pròxim) les que entrareu directament al portal web, posareu els certificats i fareu tota la pujada de forma automatitzada** sense que ell toque res. Has de preparar l'empaquetat de Capacitor tenint en compte que aquest procés l'acabareu executant IAs automatitzades directament al navegador de la seua màquina. Deixa-ho llest per a que qualsevol IA puga agafar-ho i injectar-ho.
<!-- SDP:SECTION prompt.local.s4 -->
## Tasques
- **T1: Reparació F1 (COOP i OAuth)**. A l'arxiu `oauthRelay.js`, quan el popup pateix COOP, el navegador el considera `closed = true` falsament, trencant el flux PKCE. Decideix i implementa la solució definitiva (redirecció completa o botó Cancel·lar) i actualitza les proves.
- **T2: Reparació F2 (Enllaços del Roadmap)**. L'HTML del Roadmap a `pageContent.js` conté 39 enllaços fixats a `socdepoble.org`. Substitueix-los per rutes relatives o resolució via router intern per no trencar l'enxufabilitat.
- **T3: Implementació del Retallador Multimèdia**. Seguint `RETALLADOR.txt` i `ADR_MULTIMEDIA_FONT_UNICA.txt` (Font única, canvas local, neteja de GPS per defecte, metadades en columnes). Fes servir la imatge de La Pastaora per a l'avatar de la IAIA com a espèsimen i prova visual.
- **T4: Fonaments Capacitor**. Configura el necessari per a Capacitor segons `LLEGIU_PRIMER.txt del pla mòbil`. Genera paquets llestos per pujar a l'Store.
<!-- SDP:SECTION prompt.local.s5 -->
## Riscos
- **Riscos T1:** Trencar completament el flux de login de la PWA si la redirecció no manté el PKCE intacte.
- **Riscos T3:** Que el Canvas rebente per restriccions CORS de les imatges d'origen, o que la pèrdua de l'EXIF destruïsca la rotació de les imatges de l'iPhone.
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
