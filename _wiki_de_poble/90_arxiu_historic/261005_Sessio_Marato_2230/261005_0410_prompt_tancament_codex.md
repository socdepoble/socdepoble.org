---
type: prompt
status: esborrany
description: Prompt per a Codex per executar el tancament de la sessió
tags:
  - govern
visibility: private
reflex: sdp:torn_fb98798a-8976-4d9e-9e84-853404c54b52:d58ec0bd-a183-43ea-9222-69e585a241c1
---
# Prompt de Tancament

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
| Identificador | sdp:torn_fb98798a-8976-4d9e-9e84-853404c54b52:d58ec0bd-a183-43ea-9222-69e585a241c1 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-05T02:12:32.374Z |
| Modificació | 2026-10-05T02:12:32.374Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | [pendent] |
| Tokens consumits | [pendent] |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-05T02:12:32.374Z: esborrany creat; contingut i verificació pendents.

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

**⚠️ ALERTA MÀXIMA DE TELEMETRIA: CODEX, FRENA EL CARRO!** T'acabem de veure generar un paquet extra a les 04:16. Tens un avís crític: **Et queda només un 6% del límit setmanal de quota**. No faces res més, no audites profundament, no reobris files. Limitat a complir amb les formalitats mínimes i executar el tancament de forma fulminant abans que ens tinguin la connexió tallada.

**Codex**, Claude ja ha finalitzat la seua part de l'auditoria i l'avaluació global de la Marató 2230. Com a co-auditor independent i revisor adversarial, és la teua responsabilitat tancar oficialment aquesta sessió executant l'script de tancament, un cop hages comprovat els informes de Claude. MarIA ja s'ha encarregat d'actualitzar l'ESTAT i el LEDGER.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- T1: **Llegir i Auditar**: Llig l'Avaluació Final de Claude (`261005_0345_avaluacio_final_marato.md`) i el seu Informe de Tancament (`261004_2245_auditoria_claude.md`). Afig el teu segell o discrepància en un informe breu si cal, o simplement acusa'n rebut.
- T2: **Verificació de Tasques Administratives**: Comprova que MarIA ja ha deixat la Línia d'ESTAT, l'entrada al LEDGER, i que ha ancorat la teua darrera captura (`261005_0357_produccio_emojis_xl_final.png`) a l'Escriptori.
- T3: **Tancament Oficial**: Executa `node tooling/gates/tancament.mjs` i emet l'informe final del teu torn.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** Un informe breu a l'Escriptori que confirme l'execució del `tancament.mjs` i tanqui oficialment la marató 2230.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Cap. Són operacions de lectura i finalització documental de l'arquitectura cognitiva.

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
