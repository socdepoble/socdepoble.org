---
type: prompt
status: esborrany
description: Prompt d'execució i auditoria per a Claude (Gestoria i SEO).
tags:
  - govern
visibility: private
reflex: sdp:torn_c3184f82-e2a1-4603-a493-3b02cdb532c5:783b75da-f22e-4170-aedd-351a79031078
---
# Prompt Claude Gestoria

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

## 0. Preflight (Per a l'agent orquestrador)

**Escriptori net**: Sí.
**Pla d'Implementació**: 261002_0045_pla_implementacio_gestoria.md
**Rebut**: Sí.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_c3184f82-e2a1-4603-a493-3b02cdb532c5:783b75da-f22e-4170-aedd-351a79031078 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T22:45:26.816Z |
| Modificació | 2026-10-01T22:45:26.816Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | Claude |
| Tokens consumits | ~2000 |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-01T22:45:26.816Z: esborrany creat; contingut i verificació pendents.

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

## Instrucció del torn

### 🚨 INCIDÈNCIA GREU: Higiene de l'Escriptori i Flux de Treball
He detectat que l'escriptori continuava brut amb arxius antics (261001), cosa que et podria portar a llegir informació obsoleta. Els he arxivat a l'històric a mà, però **això és una incidència greu de flux de treball**. Tín present que l'Escriptori és sagrat: NO lliges informació que no estiga a «Activitat en curs». Has de respectar l'Aprovació al Frontend de qualsevol tractor cognitiu. Llig la skill actualitzada `wiki-documentacio-i-reflex`.

Hola, Claude. Et faig entrega d'una missió fonamental per al panell de control de la Gestoria, l'arquitectura d'automatització i l'enfortiment vital del SEO per a les previsualitzacions a xarxes socials.
He deixat a l'Escriptori el següent pla d'implementació: `_wiki_de_poble/04_escriptori/261002_0045_pla_implementacio_gestoria.md`

El teu objectiu per a aquesta nit (una sessió profunda i exhaustiva) és dissenyar i implementar el nucli del Panell de Gestoria. Aquest serà un mòdul "enxufable/desenxufable" que fins i tot podrem oferir com a SaaS (a 40€/any) per a altres autònoms.

Les teues prioritats OBLIGATÒRIES són:
1. **Extremar la Seguretat (Dades Externes i Locals):** Les dades de facturació i personals de la gestoria del Mestre estan emmagatzemades **fora del sistema (Sóc de Poble)**, concretament a la carpeta de l'ordinador: `/Users/javillinares/Documents/Antigravity/Som de Poble/_gestoria_de_poble`.
Has d'implementar el mecanisme perquè la Gestoria llija i sincronitze exclusivament de manera local o segura des d'aquestes carpetes (per exemple `02_Facturacio`). **Cap dada personal pot pujar mai a producció, ni a Supabase, ni al núvol de Sóc de Poble.** S'ha d'extremar la seguretat: ha de ser un sistema completament "desenxufable" (sense rastre).
2. **Generació del Full de Càlcul (El Model):** Has de generar automàticament el model de full de càlcul que cal enviar a la gestoria (amb ingressos i despeses).
Per a que t'ho faces una idea, la informació pura d'aquest full consta d'aquestes columnes exactes: `Data, Núm, Client/Proveïdor, NIF - CIF, Descripció, Subtotal, IVA, Total`.
3. **Auditoria Prèvia de Factures (Creuament de Correus):** *Abans* de generar la llista i donar-la per bona, el teu codi haurà d'incorporar la intel·ligència o la funció de verificar si **falta alguna factura** creuant la informació amb els correus electrònics (emails del Mestre) o alertant els proveïdors habituals que no s'han detectat en el trimestre actual.
4. **Mecanisme d'Aprovació UI de Tractors Cognitius:** Per a cada script, habilitat o tractor cognitiu nou que crees, has d'implementar a la Wiki (el panell web de React) la capacitat que l'usuari llija un flux de treball explicatiu del tractor i el puga **aprovar manualment (amb un botó o acció al frontend)** abans que siga executat i operatiu. Això és decisiu per a la seguretat en fase de proves.
5. **Desenvolupament Exhaustiu:** Tens tota la nit per endavant. Proposa una solució d'enginyeria increïble que em deixi preparat per a demà la generació d'aquest full de càlcul segur i verificat.
6. A banda d'això, llig i resol el SEO i la integració React descrita a `261002_0045_pla_implementacio_gestoria.md`.
7. Emet l'auditoria detallant l'estructura completa que has deixat creada i llesta per al vist-i-plau del Mestre.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1: Seguretat i Carpeta Externa:** Defineix la lògica perquè la Gestoria consumisca dades exclusivament de `/Users/javillinares/Documents/Antigravity/Som de Poble/_gestoria_de_poble/` sense pujar res al núvol (sistema enxufable).
- **T2: Full de Càlcul i Intel·ligència:** Crea la funció per a extraure les factures (les 8 columnes esmentades) i, previ a això, fes que analitze (o construïsca la integració per a analitzar) els correus per detectar factures perdudes de proveïdors.
- **T3: Aprovació de Tractors a la UI:** Crea la interfície o la mecànica per la qual jo puga aprovar un flux de treball d'un tractor a la web abans que aquest processe els meus fitxers personals.
- **T4: Lògica Base i SEO:** Integra el Quiz (cascada HTML/JS) al panell sense trencar React i revisa el codi font per assegurar un SEO immillorable (OpenGraph per a WhatsApp/Telegram de gentdelatorre.net / socdepoble.org).
- **T5: Emeteu l'informe:** Fes una feina molt extensa i detalla-ho tot a l'informe (auditoria) deixant-lo a l'escriptori net demà al matí.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Filtració de dades sensibles: És inacceptable qualsevol fugida de dades (factures) des del directori extern `_gestoria_de_poble` cap a Supabase o al backend de l'aplicació pública.
- Conflicte d'enrutament (React Router vs Single Page App HTML5 incrustada).
- Mal funcionament de metaetiquetes en xarxes socials i aplicacions de missatgeria. Sigueu especialment curosos amb el SEO.

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
