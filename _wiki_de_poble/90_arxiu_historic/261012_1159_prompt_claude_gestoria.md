---
type: prompt
status: esborrany
description: Adaptació del codi del tauler a la taxonomia real i càlcul del tercer trimestre.
tags:
  - govern
visibility: private
reflex: sdp:torn_259babc9-63b6-4d31-89c7-d5459a6bb191:673d4481-e1a7-4788-8ed1-f79c772f4cab
---
# Tauler de Gestoria i Liquidació Trimestral

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Aquesta és una plantilla a disposició del Mestre. No hi ha accions prèvies per a l'orquestradora.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_259babc9-63b6-4d31-89c7-d5459a6bb191:673d4481-e1a7-4788-8ed1-f79c772f4cab |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-12T09:59:40.920Z |
| Modificació | 2026-10-12T09:59:40.920Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.6.0) |
| Model IA | Claude 3.5 Sonnet |
| Tokens consumits | [estimat: ~4000 tokens per la sessió] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-12T09:59:40.920Z: esborrany creat; contingut i verificació pendents.

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

L'objectiu principal d'aquesta sessió és doble:
1. **Consolidar el Tauler de Control Integral (L'Oficina):** Has d'adaptar el Tauler de Control de la Gestoria (que vas crear anteriorment) perquè actuï com a gran centre de comandament (Oficina) de tota la gestió de l'empresa (facturació, banc, previssions, comunicació, etc.). El Tauler ha de poder llegir la informació real del directori `_gestoria_de_poble/` i connectar-se a d'altres carpetes del projecte com `_comunicacio_de_poble/` si cal, sense trencar la taxonomia (les dades beuen d'on viuen, no cal ficar-ho tot en una carpeta única).
2. **Liquidació 3T:** Com a primera acció pràctica d'este tauler, preparar la presentació de la declaració de la renda trimestral (3T de 2026) a partir de `_gestoria_de_poble/02_Facturacio/2026_3T/`.

El Mestre vol poder veure bancs, previsions, factures, comunicació i tot el que has dissenyat en el tauler, però basant-se en l'estructura real que ell té a l'ordinador. Necessitem que tot el que vares crear en sessions anteriors s'adapti per a reflectir aquests continguts, i que tu mateix avaluïs si l'estructura de carpetes del Mestre s'ha de millorar per donar suport a aquest tauler o si el tauler és qui s'ha d'adaptar a les carpetes.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

1. **Auditoria de Taxonomia (Oficina vs Gestoria):** Llegeix mentalment l'estructura de `_gestoria_de_poble/` (i `_comunicacio_de_poble/` si s'escau). Comprova si les carpetes existents quadren amb el que el teu sistema de Tauler necessita. Respon: cal crear més carpetes? S'ha de mantenir separat comunicació de gestoria? (Resposta de la IAIA: Sí, s'ha de mantenir separat. El tauler pot beure de diverses fonts).
2. **Adaptar el Tauler:** Actualitza el codi del tauler de gestoria (disseny, interfície, funcions) perquè accepti les dades reals de les carpetes trimestrals, especialment el `2026_3T`.
3. **Generar la Liquidació 3T:** Extreu (o preveu com extreure) els valors necessaris per a la declaració trimestral (IVA/IRPF) i plasma-ho en el panell de control amb un disseny impecable (Pedra Seca).
4. **Resoldre el problema de format:** Els PDFs o PNGs (com `Captura de pantalla 2026-07-04...png`) no sempre els pots llegir per codi pla. Afegeix un mecanisme al panell (o indica-ho clarament al Mestre) per processar eixos documents de forma fàcil.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Risc d'orfandat de dades: fer un panell que només funciona amb dades mockejades i no llegeix el sistema de fitxers reals del projecte.
- No arribar a la data límit (avui) per tenir els càlculs a punt de la declaració 3T. Cal que la solució sigui immediata i funcional.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic i Canal Viu (Execució Paral·lela):** Si treballeu en un Xat Lateral en paral·lel amb una altra IA, actueu de forma coordinada i NO us xafeu mútuament l'Escriptori. Deixeu un informe de progrés a  cada 10-15 minuts (o en acabar cada bloc lògic). L'orquestradora (MarIA) ha programat un cron actiu vigilant l'Escriptori exclusivament per al vostre fil i deixarà nous documents de ruta si cal. Llegiu l'Escriptori constantment abans d'actuar. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 189187b73ba2ef4610f145a173aeb24c157c4453f41dc98c56f1a80f6f384475. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
