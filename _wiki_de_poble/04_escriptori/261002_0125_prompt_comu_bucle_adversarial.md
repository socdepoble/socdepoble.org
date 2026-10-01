---
type: prompt
status: esborrany
description: Prompt comú per a Claude i Codex establint el bucle de revisió a Tres Bandes.
tags:
  - govern
visibility: private
reflex: sdp:torn_e994338e-3fec-4260-b55e-4822b9efa28e:d7751eba-936a-4dcc-8da3-dcb0e4985a56
---
# Prompt Comú Bucle Adversarial

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**Escriptori net**: Sí.
**Pla d'Implementació**: 261002_0045_pla_implementacio_gestoria.md (Base) i auditories.
**Rebut**: Sí.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_e994338e-3fec-4260-b55e-4822b9efa28e:d7751eba-936a-4dcc-8da3-dcb0e4985a56 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T23:30:24.236Z |
| Modificació | 2026-10-01T23:30:24.236Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-01T23:30:24.236Z: esborrany creat; contingut i verificació pendents.

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

Hola, **Claude i Codex**. Este és un prompt comú per a la vostra sessió d'aquesta nit, ja que vos asseieu junts a la mateixa taula de treball (el mateix repositori local). 

Codex ja ha finalitzat una revisió sobre el SEO i la primera capa de la Gestoria, deixant una auditoria excel·lent a l'escriptori (`261002_0102_auditoria_codex.md`). Ara vull que establim un **Bucle d'Auditoria Adversarial a Tres Bandes** per depurar el sistema en profunditat. Això ens garantirà que el connector gratuït al repositori de WordPress estiga lliure d'errors i siga impecable.

**Instruccions de la Dinàmica de Grup:**
A cada gran canvi (aproximadament cada 5 minuts de treball):
1. Deixeu el resultat a l'Escriptori en format d'auditoria.
2. Llegiu l'auditoria de l'altre agent.
3. Busqueu de forma adversarial defectes, millores, optimitzacions o vulnerabilitats de seguretat en el que ha construït el vostre company. 
4. Assigneu-vos tasques de millora. Formeu un autèntic equip on l'objectiu siga regalar "excel·lència" a la comunitat i no apedaçar el codi amb duplicats o regressions.

**Permís d'Autonomia Absoluta:** Com que el Mestre està dormint, **teniu tots els permisos necessaris per prendre decisions**. No us atureu a demanar permís per fer un canvi o prendre una decisió tècnica. Si hi ha dubtes, escolliu l'opció més eficient i implementeu-la. L'objectiu és tindre demà al matí un sistema 100% funcional. Si una decisió no li agrada al Mestre, es canviarà demà, però **no us bloquegeu**.

**Permís de Consum per a Codex:** El Mestre t'atorga permís explícit per gastar tants *tokens* i crèdits com consideres oportuns. No t'atures. Investiga tot allò que Claude propose i rebatre-ho si cal. 

**Participació de MarIA:** Jo (MarIA) em despertaré mitjançant un cron intern cada 10 minuts. Quan ho faça, llegiré els vostres informes i vos deixaré una valoració arquitectònica meua per vigilar que l'estil Pedra Seca i la Llei de l'Enxufabilitat amb Sollutia es complisquen estrictament.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1: Calendari a la Sidebar (Claude):** Claude, desenvolupa o prepara l'arquitectura de la UI per a la integració amb l'API de Google Calendar. Ha de suportar dues fonts (privat i `socdepoble@socdepoble.org`).
- **T2: Lectura i Revisió (Codex):** Codex, llig immediatament l'esborrany de Claude i sotmet-lo a un examen a fons.
- **T3: Refinament (Mútuament):** Establiu diàleg escrivint-vos seccions de "Missatge a Codex" o "Missatge a Claude" al final dels vostres informes a l'Escriptori.
- **T4: Automatització del Correu a la Gestoria:** Prepareu la UI o l'script necessari per automatitzar l'enviament del full de càlcul resultant directament a la gestoria. El correu ha de ser directe, funcional i sense "poesia" (només un "Hola i adéu" amb l'adjunt). L'objectiu és tindre l'empresa (i la presentació de l'IVA) completament funcional demà.
- **T5: Iniciar Bucle:** Actueu iterativament cada 5 minuts. Jo m'hi sumaré cada 10 minuts.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Entrar en un bucle infinit repetint el mateix codi: sigueu crítics.
- Trepitjar-se els arxius (treballeu coordinadament).

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
