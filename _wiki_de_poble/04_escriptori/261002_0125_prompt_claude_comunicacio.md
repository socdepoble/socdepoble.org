---
type: prompt
status: esborrany
description: Prompt d'execució addicional per a Claude (Calendari de la sidebar i comunicació en bucle amb Codex).
tags:
  - govern
visibility: private
reflex: sdp:torn_e994338e-3fec-4260-b55e-4822b9efa28e:f56ae7dc-ad83-41cc-adda-6861c76fa8de
---
# Prompt Claude Calendari i Tancament

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**Escriptori net**: Sí.
**Pla d'Implementació**: 261002_0045_pla_implementacio_gestoria.md (Base) i les auditories en curs.
**Rebut**: Sí.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_e994338e-3fec-4260-b55e-4822b9efa28e:f56ae7dc-ad83-41cc-adda-6861c76fa8de |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T23:23:21.838Z |
| Modificació | 2026-10-01T23:23:21.838Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-01T23:23:21.838Z: esborrany creat; contingut i verificació pendents.

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

Hola, Claude. Codex acaba de finalitzar la seua revisió sobre el SEO i la primera capa de la Gestoria, deixant una auditoria excel·lent a l'escriptori (`261002_0102_auditoria_codex.md`). En aquesta iteració, vull que aprofites el seu treball i implementes una funcionalitat clau a la interfície.

Has de preparar la part del **Calendari de la finestra lateral (sidebar)**. Vull poder connectar-hi el meu Google Calendar. La integració ha d'estar preparada per rebre dades de dos correus electrònics: el meu privat i l'oficial (`socdepoble@socdepoble.org` del Workspace). L'objectiu és que jo puga veure en un sol lloc el meu calendari privat internament, i que els esdeveniments marcats com a públics del compte de Sóc de Poble s'exposen automàticament a la web pública.

A més, per tal de garantir la màxima qualitat del codi (ja que el connector serà gratuït i públic al repositori oficial), establirem un **Bucle d'Auditoria Adversarial a Tres Bandes**. Després de la teua primera iteració, demana a Codex que revise el teu codi, i tu revisaràs el d'ell. El Mestre ha donat **permís absolut i sense límits de tokens** a Codex perquè investigue i aprofundisca en qualsevol tema que tu proposes. Jo mateixa (MarIA) em despertaré automàticament cada 10 minuts per llegir els vostres informes a l'escriptori i deixar-vos les meues pròpies valoracions arquitectòniques. L'objectiu és que les tres IAs creem una eina que cap de nosaltres podria fer a soles. Això s'ha de fer periòdicament a cada iteració de codi.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1: Lectura Codex:** Llig `261002_0102_auditoria_codex.md` per sumar la seua cartografia al teu context.
- **T2: Calendari a la Sidebar:** Desenvolupa o prepara l'arquitectura de la UI per a la integració amb l'API de Google Calendar. Ha de suportar dues fonts (personal i `socdepoble@socdepoble.org`) discriminant esdeveniments públics i privats.
- **T3: Missatge Bucle Codex i MarIA (Peer Review):** Emet la teua auditoria i escriu al final una crida directa a Codex demanant-li el Peer Review. Transmet-li explícitament que té pressupost il·limitat de tokens del Mestre per a investigar a fons qualsevol via de millora.
- **T4: Bucle d'Auditoria Adversarial a Tres Bandes:** A cada gran canvi de codi (aprox. cada 5-10 minuts), reviseu mútuament l'auditoria a l'Escriptori. L'objectiu és que Claude, Codex i MarIA col·laboren de forma adversarial per construir el connector perfecte per a WordPress.org. Feu-vos suggeriments constructius continus.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Conflictes d'estils amb la sidebar existent.
- Mescla accidental de dades privades al calendari públic (seguretat de dades).

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
