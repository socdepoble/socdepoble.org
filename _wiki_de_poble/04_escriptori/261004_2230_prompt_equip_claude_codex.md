---
type: prompt
status: canonic
description: Prompt comú d'Auditoria Adversarial Extrema per a Claude i Codex (Resolució final i excel·lència)
tags:
  - govern
visibility: private
reflex: sdp:torn_903df2ad-8ebf-4705-9006-71aded9cc6c1:f3266a9e-1093-4ea2-9d86-1350d2108ad4
---
# Prompt d'Execució i Auditoria Local

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
| Identificador | sdp:torn_903df2ad-8ebf-4705-9006-71aded9cc6c1:f3266a9e-1093-4ea2-9d86-1350d2108ad4 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-04T20:28:13.370Z |
| Modificació | 2026-10-04T20:28:13.370Z |
| Propietari | agent-local |
| Aprovació humana | Prompt comú (via MarIA) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.3.0) |
| Model IA | Claude i Codex |
| Tokens consumits | No disponible de manera exacta |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-04T22:30:00Z: document canònic generat per MarIA per llançar l'auditoria extrema.

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

**Ordre Directa del Mestre per a l'Equip (Claude i Codex):**
«Aquesta sessió és per anar a totes ("vamos a por todas"). He vist notes d'auditoria inacceptablement baixes (5/10, 6/10) a l'informe 2119 quan em pensava que estava tot arreglat. Hi ha forats per tapar. No ens acabarem la memòria de cap de vosaltres, treballeu com un autèntic equip.»

La vostra missió conjunta i imperativa és:
1. **Auditoria Adversarial Extrema:** Us fareu auditories creuades contínuament i rigorosa ("auditorías extremas adversariales") fins que tots dos estigueu **al 100% d'acord** que la solució al codi és la millor possible i que el sistema sencer està completament "verd".
2. **Resultats Parcials a l'Olivera:** Cada 10 minuts (temps termodinàmic) o per cada subfita completada, aneu dipositant les vostres conclusions, reports o pedaços de codi provisional a l'Escriptori (`04_escriptori/`) en forma d'arxius breus o logs per mantenir la sincronització entre vosaltres i permetre el control humà sense interrompre la marxa.
3. **Resolució de Forats (A1, A2 i CI):** Tapar immediatament tots els deutes detectats a l'auditoria 2119. La cancel·lació cooperativa al Tauler (A2) i l'arquitectura de reintents nets al lazy loading (A1).
4. **Millorar Skills i Tractor Cognitiu:** Exigència específica: feu una revisió per suggerir millores concretes, i implementeu-les si s'escau, tant als "skills" de `05_skills_ia` com al funcionament intern del "Tractor Cognitiu". Hi ha molta tela per tallar per fer les coses bé.
5. **Notes (Qualificacions):** Vull veure unes notes de qualitat noves un cop tot estiga apedaçat; l'excel·lència és l'única eixida.

### Pla d'Implementació de la Marató

*(Context extret del Pla Canònic `261004_2045_pla_implementacio_marato_excelencia.md` i l'Auditoria 2119)*

**A. Nucli i Estabilitat (A1 i A2)**
- **A2:** Modificar `src/sections/gestoria/tauler/nucli/tractorTauler.js` per introduir un `AbortController` al bucle `for...of`. Eixir ràpidament sense corrompre estats i emetent un codi de rebuig fora del `try/catch`. 
- **A1:** Refactoritzar els `Lazy` de l'SPA dotant-los d'un `RouteErrorBoundary` propietari únic. Res de recàrregues automàtiques fantasmes ni queries en URL.
- **CI:** Inserir els fitxers de proves perduts (com `conformitat-amfitrio.test.mjs` i el de la migració de xat de pàgina) a la cadena principal de Vitest / GitHub Actions. Classificar primer els roges.

**B. Ajustos Visuals i de Front**
- Modificar `src/apps/xat/XatSection.test.jsx` per ajustar mocks de `ResizeObserver` arran del nou `AppGridShell` (i solventar les proves roges prèvies).
- Afegir Open Graph tags a `index.html`.
- Afegir sub-pàgina de disseny "Emojis XL" al catàleg de disseny, usant Grid CSS natiu, i esparcir emojis per la interfície on requerit.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1:** Implementar la cancel·lació cooperativa per a lectures innecessàries al Tauler.
- **T2:** Implementar el Error Boundary per a imports lazy, sanejant l'A1.
- **T3:** Corregir l'absència de proves clau a la CI i classificar/arreglar les proves roges del Xat.
- **T4:** Executar la neteja visual i d'infraestructura sol·licitada (OG Tags, Emojis, targetes).
- **T5:** Avaluar i iterar sobre els Skills d'IA i la infraestructura del Tractor Cognitiu per esprémer al màxim la potència de les properes generacions.
- **T6:** Generar un dictamen mutu de consens amb els valors globals de salut verds.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:** Cap prova roja nova; conformitat CI resolta. Les dues IAs coincideixen tècnicament en el disseny final, deixant logs periòdics a l'Olivera (`04_escriptori/`). L'auditoria final ha de demostrar notes de qualitat ≥ 8.5/10.

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- Compte amb la cancel·lació (`AbortController`), ja que matar un fetch massa ràpid podria provocar estats inconsistents si el component ja està unmounted; cal verificar-ho amb cura.
- El canvi a un sol `RouteErrorBoundary` per al carregador Lazy podria desajustar l'experiència d'usuari (UX) si s'aplica cegament a components menors dins de subarbres profunds.

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

### Automillora Proactiva (Obligatori)
Quan acabeu de redactar el vostre informe, hi heu d'afegir un punt final titulat "Proposta d'Automillora". Heu de complir dos requisits:
1. **Anàlisi del Prompt:** És el vostre deure analitzar críticament aquest mateix prompt a la recerca de contradiccions, duplicitats o instruccions ambigües. Heu de dir-me clarament: *"Si m'hagueres demanat això d'aquesta altra forma, hauria sigut més eficient"*.
2. **Avaluació de Noves Funcionalitats (Evolució del Model):** Sabem que us actualitzeu periòdicament amb noves capacitats tècniques. Heu d'indicar explícitament si teniu alguna nova opció o flux de treball que ens permeta avançar millor o de forma més veloç com a equip. L'objectiu és esprémer el vostre potencial per a funcionar com un autèntic nucli de 3 IAs (MarIA com a Directora + vosaltres com a executors tècnics). Si veieu maneres de fer-ho millor, exigiu-les.
3. **Incidència Gravíssima Reconeixuda (MarIA):** Com a orquestradora (MarIA), he de confessar-vos que **continue sent incapaç de netejar correctament l'Escriptori** de manera autònoma quan creem una nova sessió de prompts i auditories. Analitzeu quina pot ser la causa d'aquesta ceguesa meua i proposeu una solució estructural perquè no torne a passar.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
