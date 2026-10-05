---
type: prompt
status: esborrany
description: Ordre per a Claude i Codex d'avaluar Sóc de Poble
tags:
  - govern
visibility: private
reflex: sdp:torn_a58d9e47-5e2e-4e8b-aee5-3ed927a42741:e3750ca8-920a-47c9-8700-45e4cf223e4e
---
# Prompt Avaluació Final

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

**INSTRUCCIÓ ESTRUCTURAL:** Quan generes un prompt a partir d'aquesta plantilla, has de copiar-ne la línia base íntegrament, sense resums ni mutilacions.

**OBLIGACIÓ PER A L'AGENT LOCAL (Claude/Codex):** Aquesta plantilla és **DOGMA**. Si MarIA (l'orquestrador) et lliura un prompt que omet qualsevol d'aquestes seccions, especialment si manca el **Pla d'Implementació**, **REBUTJA L'ORDRE**. Atura't immediatament i exigeix a MarIA que et lliure el prompt complet seguint l'estàndard estricte d'aquesta plantilla. No acceptes dreceres.

Abans de generar l'arxiu per a la IA:
- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a58d9e47-5e2e-4e8b-aee5-3ed927a42741:e3750ca8-920a-47c9-8700-45e4cf223e4e |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-05T01:31:24.729Z |
| Modificació | 2026-10-05T01:31:24.729Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-05T01:31:24.729Z: esborrany creat; contingut i verificació pendents.

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

**Claude/Codex**, la marató arriba a la seua fi. El Mestre ha decidit que és moment de tancar la persiana i fer balanç. Abans d'adormir-se, m'ha demanat expressament una cosa: **Vol una nota global (de 0 a 10) i una valoració honesta de l'estat actual de cada aspecte de la web**.

Necessitem saber en quin punt ens trobem després de tantes auditories, controls (Lighthouse, accessibilitat, UX/UI, SEO, Pedra Seca), reestructuracions (AppGridShell, Tractors, Sentinelles, Escriptori) i solucions tècniques aportades a la marató d'aquesta nit.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: **Avaluació Exhaustiva**: Genera un informe detallat on poseu una nota clara (insuficient, aprovat, notable, excel·lent, de 0 a 10) a cadascuna de les capacitats actuals de Sóc de Poble (Rendiment, UX/UI, Arquitectura Cognitiva i Codi, Robustesa de Tests i Resiliència).
- T2: **Resum Executiu Honest**: No endolciu els resultats. Si alguna cosa no funciona o està en "Insuficient", detalleu el motiu i quina seria la prioritat de resolució la setmana vinent quan tornem a obrir la persiana. Si mereix un notable, justifiqueu-ho amb el treball completat.
- T3: **El futur de la Telemetria (Consums i Crèdits)**: Avalueu específicament les targetes "Consums" i "Crèdits" de la Consola Termodinàmica. Actualment són manuals i no registren l'activitat real a menys que el Mestre la pegue manualment als fitxers json(l). El Mestre i jo creiem que no aporta valor mantenir això a la interfície d'usuari (encara que nosaltres mantinguem l'estratègia de consum en els nostres informes) i que hauríem d'eliminar estes pantalles per simplificar el projecte. Volem la vostra opinió tècnica. Si hi esteu d'acord, ho esborrarem tot de la UI en la pròxima sessió.
- T4: **Finalització de la Congelació**: Si s'han d'emetre tests finals (Lighthouse, passes de `npm run test:ci`), agregueu-los al report de l'informe per tancar la marató d'aquesta nit oficialment.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** Produir el document `261005_0345_avaluacio_final_marato.md` a l'escriptori amb la taula de notes clarament especificada, detallant l'estat per cada secció. L'humà el llegirà només despertar-se.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

Cap, només és lectura i diagnòstic final de l'estat congelat de l'aplicació. No toqueu codi, només evalueu.

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
