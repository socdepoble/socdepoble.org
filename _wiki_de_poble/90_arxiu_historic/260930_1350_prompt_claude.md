---
type: prompt
status: esborrany
description: Petició a Claude per a executar les correccions indicades en l'auditoria adversarial de Codex.
tags:
  - govern
visibility: private
reflex: sdp:torn_4cb31ec0-38b7-4e69-a390-d814a2d94d25:97d50cac-7b6c-46cf-a6f1-8e2152f72b4f
---
# Prompt d'Execució per a Claude (Correccions Auditoria Codex)

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

- [x] **Escriptori net i indexat**: `04_escriptori/` només ha de contindre els arxius de la sessió actual. Arxius anteriors han d'estar a `90_arxiu_historic/`. Tots els arxius actius estan a `00_index_escriptori.md`.
- [x] **Pla d'Implementació** generat si cal.
- [x] **Rebut obtingut** per a l'arxiu generat.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4cb31ec0-38b7-4e69-a390-d814a2d94d25:97d50cac-7b6c-46cf-a6f1-8e2152f72b4f |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-30T11:49:41.754Z |
| Modificació | 2026-09-30T11:49:41.754Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-09-30T11:49:41.754Z: esborrany creat; contingut i verificació pendents.

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

Hola Claude. L'agent Codex ha realitzat una auditoria adversarial profunda sobre l'autonomia, el canal de WordPress i la Consola Termodinàmica. Ha generat un informe (`260930_1325_auditoria_codex.md`) amb 10 troballes (2 P1 i 8 P2), i un pla d'implementació estabilitzat (`260930_1312_pla_implementacio_codex.md`).

La teua instrucció per a aquest torn és **llegir atentament aquests dos documents i executar l'implementació de totes les correccions proposades al pla**. Totes les proves passen actualment, però l'auditoria adversarial ha demostrat que l'estat actual no certifica l'execució completa i correcta.

**Molt important:** Com ja saps, NO implementis tu la solució en el text del prompt. Limita't a executar les modificacions al codi base a través de les eines d'edició per satisfer els criteris d'acceptació descrits en el pla de Codex.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: **Llegir Context:** Llegeix `260930_1325_auditoria_codex.md` i `260930_1312_pla_implementacio_codex.md` abans de tocar cap fitxer.
- T2: **F01 (P1):** Corregeix la col·lisió destructiva a `tooling/higiene/tractor_cognitiu.mjs` de manera que s'arxiven els homònims de forma segura (sense pèrdua de bytes ni fallades silencioses).
- T3: **F02 (P1):** Revisa i aplica el pegat existent de governança per a `tooling/gates/antigravity-hook.mjs` canviant `allow` per `ask` en operacions no documentals.
- T4: **F03:** Implementa la lògica de recuperació de documents transaccional (`tooling/wiki/document.mjs`, `tooling/documental/draft-write.mjs`, etc.) per solucionar el bloqueig amb documents bloquejats, afegint la creació de successors de forma segura i compatible amb rebuts antics.
- T5: **F04 i F05:** Refactoritza `wordpress-plugin/includes/actualitzador.php` perquè la versió i el hash requerits coincidesquen estrictament, i per propagar correctament els errors de xarxa (ex: HTTP 503) sense ocultar-los.
- T6: **F06, F07, F09 i Acreditada:** Resol els problemes de la Consola i Mapa. Corregeix la projecció de "llancador-sense-declaracio", assegura que l'estat "viu" reflecteix realment execució i crea una columna "Acreditada (Sí/No)" al CalendariMapa amb criteris exigents d'evidència fresca i ordre coincident. Registra també incidències de lectura de torns.
- T7: **F08:** Repara les fonts de telemetria creant un adaptador local per a rebuts actuals de sessions a `tooling/vite/consola-iaia.mjs`, sense afegir noves dependències sobre Supabase.
- T8: **F10:** Modifica `tooling/brain/crear_bundle.mjs` perquè exigisca el destinatari correcte i valide explícitament l'ancoratge documental, impedint la generació "orfe" del macro_bundle.

### Criteris d’acceptació i reproducció

- **Evidència adversarial i R1-R9:** Fes passar totes les reproduccions adversarials definides a l'informe R1 a R9 amb els resultats esperats invertits (és a dir, funcionant correctament).
- **Testos automatitzats:** Executa les suites de Vitest (Consola) i Node afectades per garantir zero regressions.
- **Transaccionalitat:** Les proves de recuperació documental han de resistir la interrupció (rollback documental).

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Pèrdua de dades per col·lisions:** Assegura't de no esborrar cap original durant la substitució. Qualsevol operació documental ha de mantindre el document antic si hi ha hagut alguna errada en la regeneració.
- **Autoaprovació fora d'abast:** La reparació de hooks ha de protegir el codi base. Vigila no crear una "porta de darrere" que aprovi execucions que no es corresponguen amb el flux documental.
- **Acoblament UI i Backend:** A l'hora de mostrar els estats de telemetria o de mapes a la Consola, l'adaptador de dades ha de ser completament neutral i local. No s'ha d'inserir cap crida a proveïdors al codi d'interfície (React).

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
