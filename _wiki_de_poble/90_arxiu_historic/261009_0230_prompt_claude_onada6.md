---
type: prompt
status: esborrany
description: Llançament de l'Onada 6 de Sóc de Poble
tags:
  - govern
visibility: private
reflex: sdp:torn_ecfa73e1-f389-4bd5-85ac-290dadadb70f:b67048af-e757-4ddd-9d6f-1fec83988622
---
# Prompt Onada 6: Manteniment, Cronologia i Higiene

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

[pendent]

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_ecfa73e1-f389-4bd5-85ac-290dadadb70f:b67048af-e757-4ddd-9d6f-1fec83988622 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-09T00:30:33.335Z |
| Modificació | 2026-10-09T00:30:33.335Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.4.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-09T00:30:33.335Z: esborrany creat; contingut i verificació pendents.

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

Llançament de l'Onada 6 de Sóc de Poble. Aquesta onada s'executarà tota la nit en segon pla (sense interrupcions humanes) i se centra en l'auditoria profunda i perfeccionament del Brain (Consola de Manteniment), la lògica de cronologia del naixement de pobles, la implementació del mòdul Calendari clonat de Google, la definició visual i nominal de la IAIA, i la neteja tècnica i higiènica massiva de tot el sistema i plugins.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

Consulta l'última versió del Pla d'Implementació (`_wiki_de_poble/04_escriptori/261008_2345_pla_implementacio_onada5.md`, secció "Tasques Futures / Onada 6") per entendre bé totes les noves directives de l'Onada 6.

Punts clau a tindre en compte especialment:
1. **Unificació del Calendari:** És un requisit CRÍTIC. El Mur i el Calendari gastaven components diferents; s'han d'unificar absolutament sota l'estètica i funcionalitat de Google Calendar. El clic en un esdeveniment ha d'obrir la targeta sencera, i el clic en el "dia" del quadre (fora de l'enllaç de l'esdeveniment) ha de mostrar les targetes filtrades per eixe dia davall.
2. **Neteja del sistema i Cron:** Has de revisar el sistema, esborrar les restes d'informes vells i plugins/brossa inútils perquè el repositori quede completament net. Quan s'acabe l'Onada, tanca totes les pestanyes de proves obertes. També caldrà que implementes un *CRON* automatitzat que ho netege tot en el futur.
3. **INCIDENT GREU - Motor Cognitiu per a l'Escriptori Net:** Hi ha un error greu de flux. Si l'escriptori no es neteja bé abans de cada Onada, s'embruta el context. Estudia i crea un motor cognitiu (una regla/skill) per a obligar a netejar els arxius consumits o residuals de les auditories anteriors de l'escriptori abans de redactar cap nou prompt, evitant que una nova IA perda el focus amb residus vells.
4. **Operativitat Total del Xat:** El mòdul de xat ha d'estar operatiu sense fissures demà. És una eina de validació primerenca, els betatesters s'hi registraran i la faran servir com a eina de feedback (per informar d'errors).
5. **Gestoria 100% Operativa i Desacoblada (Plugin System):** La Gestoria no pot lastrar el pes de l'app de WordPress. Fes l'arquitectura de *plugins* perquè siga un mòdul opcional de GitHub. Aquesta filosofia hipermodular d'enxufes s'ha d'aplicar a la resta de funcionalitats secundàries (Rebost, TPV, Salut, RSS, etc.). El nucli ha de ser ultralleuger i la resta s'ha de poder connectar o desconnectar. PERÒ ATENCIÓ: a més a més, has de deixar la Gestoria **completament funcional per a aquest cap de setmana**, inspirant-te en eines com *Holded* o *Factura Directa*. El Mestre la necessita dilluns per a portar els comptes del banc, calcular les despeses massives en IA, fer simulacions i descarregar-se un full de càlcul per a la gestora real. Ha de permetre **importar tot l'històric (des de l'any passat fins al trimestre passat)**, emetre factures des de Sóc de Poble, simular la renda i estar preparada per a la nova llei **VeriFactu** de l'any vinent. Ha de ser una alternativa molt potent però **GRATUÏTA**, ideal per a xicotets autònoms que no volen pagar quotes abusives per quatre factures. Recorda que tens dins del teu sistema un paquet de skills empresarials/CEO (aquelles famoses 15 skills per a muntar una empresa). Activa-les i construeix un panell de control financer bestial, digne d'un autèntic gestor d'empresa. **BLINDATGE I SEGURETAT (1000x1000):** Com que aquest mòdul gestionarà factures i dades bancàries altament sensibles de la vida personal i del projecte, la seguretat ha de ser paranoica i absoluta. Si funciona offline, xifra-ho i protegeix-ho perquè el Mestre puga provar amb dades reals; si s'ha de connectar online, implementa el millor sistema possible perquè cap dada quede surant per la xarxa. La privacitat és innegociable. Tens permís total per a treballar tota la nit i esgotar els teus tokens implementant la lògica d'aquests sistemes enxufables.
6. **Autonomia, Propostes i Generalització:** Tens *carte blanche* total per revisar el "sistema nerviós" (backend i fluxos de treball). El Mestre reconeix estar perdut al backend, així que si veus oportunitats de millorar, canviar l'arquitectura de dades, o aplicar ux/ui superior, **proposa i arregla** allò que convinga sense por. A més, asseura't que la lògica de publicacions locals que faràs per a `Gent de la Torre` s'aplique de manera **absolutament generalitzada**; si demà algú obri un poble nou, la pestanya de la seua gent ha de funcionar automàticament sense tocar ni una línia de codi.


<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Desincronització o trencament visual de les publicacions si la lògica del calendari unificat es desbarata.
- Esborrat per error de fitxers fonamentals durant la neteja d'arxius (en cas de dubte sobre un plugin o arxiu, llista-ho en l'auditoria abans d'esborrar res sense demanar permís, però assumeix autonomia si és clara brossa temporal).

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
