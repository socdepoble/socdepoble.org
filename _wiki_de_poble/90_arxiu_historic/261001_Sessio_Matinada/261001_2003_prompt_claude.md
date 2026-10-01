---
type: prompt
status: esborrany
description: Auditoria de fluxos i telemetria de Brain
tags:
  - govern
visibility: private
reflex: sdp:torn_0a24c0cd-9dc8-4316-b35c-cc43b71dc206:bb0c60b5-4c0b-42ba-a766-934885059528
---
# Prompt Claude

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
| Identificador | sdp:torn_0a24c0cd-9dc8-4316-b35c-cc43b71dc206:bb0c60b5-4c0b-42ba-a766-934885059528 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-01T18:04:54.212Z |
| Modificació | 2026-10-01T18:04:54.212Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-01T18:04:54.212Z: esborrany creat; contingut i verificació pendents.

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

Hola Claude! Necessite la teua ajuda per dur a terme una auditoria important de final de jornada. M'agradaria que analitzes l'estat del sistema sencer des de diferents òptiques (Brain, Errors, Mètriques, i Aspectes Legals).

Hem preparat un Pla d'Implementació (261001_2050_pla_implementacio.md) on pots veure com s'emmarca aquesta tasca en el conjunt del relleu amb Codex, que s'encarregarà de l'enxufabilitat de Sollutia, mentre tu fas aquesta inspecció global.

### Pla d'Implementació

**Objectius**
1. **Auditoria del Brain i Tractors (Claude):** Revisió d'errors a consola i avaluació de l'estat dels tractors d'higiene i telemetria de l'AIIA, així com dels textos legals.
2. **Seguretat i Enxufabilitat de Sollutia (Codex):** Avaluació del connector de WordPress, per resoldre l'error 400 Bad Request i assegurar que la paritat amb `localhost` siga total i indistingible.

**Passos (Checklist)**
- [ ] Claude: Executar auditoria de consola i de tractors a l'Escriptori.
- [ ] Claude: Revisar la política de privacitat i textos legals per equiparar-los a estàndards globals (tipus WhatsApp).
- [ ] Codex: Inspeccionar com es resol i s'injecta el `tenantId` des de WordPress/Sollutia. Actualment s'està injectant com a `undefined` a l'entorn de producció malgrat estar present al panell d'administració de WordPress.
- [ ] Codex: Proposar refactorització a l'adaptador WP (marcatge.php o configAmfitrio.js) per garantir que `tenantId` estiga disponible al boot.
- [ ] MarIA: Aplicar el consens i desplegar el paquet a WordPress per verificar-ho en viu.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: Realitzar una auditoria skill per skill de tots els tractors (fluxos i scripts que gestionen el Brain i la memòria de Sóc de Poble). Analitzar i documentar l'estat actual i qualsevol problema potencial de pèrdua de context.
- T2: Reparar qualsevol error de consola actual o avís relacionat amb l'arquitectura i el nucli en `localhost`.
- T3: Proposar mètriques de telemetria per a que l'AIIA (Agent IA) siga capaç d'avaluar la seua pròpia auto-maduresa i el seu rendiment d'acord amb les Regles de la IAIA MarIA.
- T4: Dur a terme una auditoria legal i de privacitat del codi o textos associats, usant WhatsApp i altres estàndards de missatgeria com a model a seguir. Assegurar-nos que tenim tot el que cal per a cobrir-nos les espatlles en la política de privadesa.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Pèrdua de flux cognitiu si els tractors tenen errors ocults en el parsing del frontmatter.
- Desviació dels estàndards de privacitat europeus si ignorem els models establerts per sistemes massius.

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
