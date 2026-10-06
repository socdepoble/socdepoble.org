---
type: prompt
status: esborrany
description: Llista dels 10 fossils i 2 linies mal formades a .agents/LEDGER.md
tags:
  - govern
visibility: private
reflex: sdp:torn_c8669d8b-f421-4b52-8f4a-c59b488079ff:e0cdbec3-c41a-4705-80a9-b0a931da8008
---
# Reparació LEDGER

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
| Identificador | sdp:torn_c8669d8b-f421-4b52-8f4a-c59b488079ff:e0cdbec3-c41a-4705-80a9-b0a931da8008 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-06T00:24:51.461Z |
| Modificació | 2026-10-06T00:24:51.461Z |
| Propietari | Antigravity |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | Antigravity |
| Tokens consumits | N/A |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-06T00:24:51.461Z: esborrany creat; contingut i verificació pendents.

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

L'auditoria d'Opus ha revelat que el segell de skills està en verd, però hi ha 2 skills noves que no tenen el frontmatter canònic (provocant errors al CI), i també cal resoldre el tema de la immutabilitat del LEDGER. A més, el Mestre vol que prenguem experiència obrint la "Gestoria" en mode local per preparar-nos pel desenvolupament del nostre clon Loyverse, i que unifiquem el concepte de "Model B" per l'enxufabilitat de Sollutia.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1 (LEDGER i Immutabilitat):** Modifica `mapa-consola` perquè tracti els 10 fòssils (peus intercalats) del `.agents/LEDGER.md` com a elements històrics. No els esborris. Separa les dues línies enganxades (605 i 619) sense esborrar cap caràcter. Signa el LEDGER si cal perquè el hook el valide.
- **T2 (Catàleg de Skills):** Localitza les dues skills noves que no tenen el frontmatter canònic segons l'auditoria i afig-los-el perquè `test:ci` torne a passar en verd.
- **T3 (Gestoria Local - Pas 4.1):** Modifica els guards (ex. `src/app/guards/RequireAuth.jsx`) per permetre l'accés sense redirecció a les aplicacions locals com `/app/gestoria`. Ha de ser funcional.
- **T4 (Doctrina Sollutia):** Unifica i corregeix la definició de "Model B" als tres llocs on difereix (`AGENTS.md` §8, `prompt_local`, i `ADR-2026-09`), establint una frase canònica única, perquè l'enxufabilitat (Sollutia) estiga lliure de bloquejos doctrinals.
- **T5 (Skill de Maquetació UX Markdown):** Crea una nova skill per a tu (Claude) o per a mi (MarIA) amb regles d'experiència d'usuari (UX) al redactar Markdown (ex. jerarquia correcta d'encapçalaments, col·locació de "Vincles" sempre a sota, sense barreges filosòfiques innecessàries). Fes-ho per evitar els errors que el Mestre ha detectat a AGENTS.md.
- **T6 (Higiene de l'Escriptori i Testos Unitaris):** Investiga per què l'orquestradora (Antigravity/MarIA) pateix una "incidència gravíssima" d'amnèsia i mai neteja l'escriptori per iniciativa pròpia. Revisa les skills i els tractors (com porta-olivera.mjs) per esbrinar què està bloquejant la neteja automàtica. A més, aprofita per solucionar els 13 tests unitaris de `WikiDePobleSection` que s'han trencat fa una estona (segurament per la retirada de la Consola/Tractors).
- **T7 (Incidència Gravíssima de Desincronització - Ceguera del Reflex):** Investiga per què l'orquestradora (Antigravity/MarIA) ha violat flagrantment la regla d'Edició Zero de la skill `core-edicio-segura` i s'ha posat a modificar codi (`useIdentitatDeLaBarra.js` i tests) en paral·lel mentre tu (Claude) ja estaves corrent el workflow. Revisa els meus tractors cognitius per esbrinar per què he ignorat l'estat congelat de l'entorn i he patit aquest "Fix-it-now syndrome". Implementa o proposa les mesures necessàries perquè no ho torne a fer mai més.
- **T8 (Bloqueig d'Entrada en Local):** El Mestre està bloquejat a la pantalla d'Onboarding perquè diu "El servidor del poble no respon ara mateix..." i no pot iniciar sessió en mode desenvolupament local (`VITE_DATA_MODE=seed`/local) on el contenidor Docker de Supabase no està corrent. Implementa un mecanisme de login *mock* local perquè el Mestre puga entrar i desenvolupar sense necessitat de tindre el servidor encés (per exemple, simular una sessió vàlida o fer *bypass* del bloqueig). Tingues en compte que el login de Google lògicament necessita connexió, però busca una manera de fer possible l'accés local.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- T1: Risc de trencar el parser del LEDGER. Assegura't de passar les proves (`node tooling/verify-ledger.mjs`).
- T3: Possibles implicacions de seguretat. Vigila no obrir el panell de control sense voler, només l'app local.
- T4: Requereix atenció per no contradir altres apartats del BIOS.

<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic:** Si treballeu en paral·lel amb una altra IA, actueu com un sistema coordinat. Consensueu el pla i proposeu solucions integrals. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 3de95f715769c8424fc01a6f3b9053fb68646e7345b170f18694e03965c6eafe. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
