---
type: prompt
status: esborrany
description: Auditoria adversarial a Fable per esgotar la quota
tags:
  - govern
visibility: private
reflex: sdp:torn_eafab5f7-6d92-49a2-ad17-eec892cc41af:91a57a61-b770-4f0c-98a5-9aa5a64b1588
---
# Auditoria Adversarial Fable

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` només conté els arxius de la sessió actual.
- [x] **Pla d'Implementació** generat.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_eafab5f7-6d92-49a2-ad17-eec892cc41af:91a57a61-b770-4f0c-98a5-9aa5a64b1588 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-05T09:56:55.526Z |
| Modificació | 2026-10-05T09:56:55.526Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | Claude 3.5 Fable UltraCode |
| Tokens consumits | Pendent (en execució) |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-05T09:56:55.526Z: esborrany creat; contingut i verificació pendents.

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

Has de fer una **Auditoria Adversarial profunda** de l'estat actual del nostre sistema. Estem a meitat de la maquetació del sistema i ens queden tasques crítiques per tancar (l'error de `useSession`, el LEDGER trencat i l'empaquetat del commit atòmic). 

Donat que la meua quota d'ús (Sonnet/Opus) està gairebé al 94% aquesta setmana, volem aprofitar el límit completament independent del teu model (Fable UltraCode, que està al 0%). 

**El teu objectiu és exhaurir la teua quota:** esprem al màxim el teu cervell i fes una anàlisi intensiva de tot el codi. Com que volem aprofitar la teua quota sencera abans de continuar amb el meu compte, **has d'aturar la teua anàlisi només quan et quede aproximadament un 5% de marge de quota**. En eixe moment detín-te, fes balanç, avisa'ns i vomita l'informe complet del que hages trobat. No et deixes res al tinter.

Ens agrada el Trellat. Audita sense pietat.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Revisar el crash de `useSession` en l'eixida des del Panell de Control.
- T2: Revisar l'estat dels fitxers no versionats (`lazyRoute.js`, `RouteErrorBoundary`, etc.) de cara al commit atòmic.
- T3: Proposar accions per extirpar la brossa de mòduls vells i decorar-ho amb l'estil "Berlanga/Mortadelo".
- T4: **Autòpsia del Tractor de Neteja (CRÍTIC)**: Continua passant-nos cada dia; la IAIA MarIA (jo) falla en executar autònomament la neteja de l'Escriptori, tot i tindre la regla al BIOS. Sempre queden fitxers solts de jornades anteriors, la Safata s'ompli i acabe demanant perdó i arreglant-ho a mà o quan el Mestre s'enfada. Necessitem que analitzes per què el meu raonament (les skills i l'arquitectura de *prompting*) no actua de manera reflexa per esbrinar què hi ha, què necessite i arxivar la resta al `90_arxiu_historic`. Què li falta al tractor o a la regla perquè aquest engranatge funcione per si sol? Vull una solució estructural perquè l'Escriptori es netege automàticament sense intervenció del Mestre.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** Entrega d'informe complert i avís de límit de quota arribat (5%).

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Desconnexió temporal amb l'orquestrador principal.
- Possibles canvis de context que requerisquen una futura integració manual.

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
