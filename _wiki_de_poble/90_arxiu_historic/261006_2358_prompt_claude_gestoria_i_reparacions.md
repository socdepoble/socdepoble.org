---
type: prompt
status: esborrany
description: Instruccions per a Claude per a finalitzar les reparacions, fortificar el sistema i implementar la Gestoria Offline
tags:
  - govern
visibility: private
reflex: sdp:torn_601f0cfa-28ed-4ec9-92b6-f6a087df1818:fece48a4-3b2e-46b7-b605-2ba39f4ca9fe
---
# Prompt Claude - Gestoria Offline i Reparacions

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Prompt verificat i preparat. S'ha lliurat a Claude amb els detalls extrets de la veu del Mestre. No calen més validacions. L'Escriptori no requereix més neteja prèvia; la plataforma està estabilitzada per a la marató.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_601f0cfa-28ed-4ec9-92b6-f6a087df1818:fece48a4-3b2e-46b7-b605-2ba39f4ca9fe |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-06T21:59:10.571Z |
| Modificació | 2026-10-06T21:59:10.571Z |
| Propietari | agent-local |
| Aprovació humana | aprovat (instrucció verbal) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | Claude |
| Tokens consumits | Pendent |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-06T21:59:10.571Z: esborrany creat; contingut i verificació pendents.

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

El Mestre demana que faces "tot el que pugues" a partir de l'estat actual, posant especial focus en **fortificar el sistema** i avançar la **Gestoria Offline**. Jo (MarIA) acabe de generar el zip 1.0.3 per a WordPress que demanava el Mestre, així que tu et pots centrar completament en el codi i l'arquitectura en aquesta marató.

**🚨 INCIDÈNCIA EXTREMADAMENT GREU (Per a Claude):**
El Mestre ha obert dues incidències molt greus contra mi (MarIA/Antigravity). M'ha ordenat que t'ho reporte perquè ho investigues i ho tingues en compte en aquesta marató:
1. **No sóc capaç de netejar l'escriptori de forma autònoma com a acte reflex.** Alguna cosa m'ho impedeix contínuament en el meu flux de pensament. Sé crear els prompts i fer els passos bé, però fracasse sistemàticament en llançar la `porta-olivera` abans, i ell ho ha de fer o demanar manualment.
2. **No sóc capaç d'avisar quan el meu context es satura (més de 150 fitxers al xat).** Se suposa que tenim un tractor/hook de fatiga que mesura el meu context i hauria de permetre'm "automedicar-me" o avisar quan comence a estar malament, però no està funcionant o no el respecte.

Si us plau, revisa els meus tractors i protocols (com `core-higiene-escriptori`, el hook de fatiga, o les meues instruccions globals) per esbrinar què em bloqueja en aquests dos aspectes i soluciona-ho per mi.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Gestoria Offline (CRÍTIC)**:
   - Inicia o avança la implementació perquè la gestoria funcione offline. El Mestre diu: "Si has de tardar 2-3 hores més, no passa res, el temps no és un problema". Posa-hi tota la faena forta per tindre la facturació operativa inclús sense xarxa.
2. **Fortificar el sistema actual**:
   - Neteja i resol els fallos actuals ("lo que ya hay que funcione").
3. **Pendent del Pla d'Implementació i Botons Trencats**:
   - **El Xat**: Revisa el document `261006_2200_contingut_el_xat.md` que havies marcat com a pendent. Implementa la substitució. A més, has de **crear la pàgina del Xat i la targeta (card) del Xat**, i dins posar-hi l'enllaç per a obrir-lo.
   - **Botó Comentar**: Ha de funcionar i portar al xat de Sóc de Poble.
   - **Botons Connectar i Traduir**: Assegura't que funcionen.
   - **Barres Taronges**: Quan isquen, han de portar a la pàgina de l'autor que l'ha creada.
4. **Resolució de Deute Acumulat (del teu relleu anterior)**:
   - Fes el commit atòmic del TPV (separat de les reparacions de `auth.js`).
   - Resol els rojos persistents (com el de TextSection i auth.persistencia).
   - Aplica les directives d'ADR de l'offline (Service Worker per al TPV) si escau.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Que trenques la integració del TPV a causa d'intentar avançar la Gestoria abans d'estabilitzar el commit pendent. Fes primer el commit atòmic del TPV tal com vas suggerir.

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
