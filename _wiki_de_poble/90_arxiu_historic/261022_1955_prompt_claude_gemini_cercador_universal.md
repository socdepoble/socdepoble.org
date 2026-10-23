---
type: prompt
status: esborrany
description: Prompt d'execució i auditoria per construir el cercador definitiu que indexa entitats públiques i recupera el padró
tags:
  - govern
visibility: private
reflex: sdp:torn_34da1b34-3cf4-4b01-970e-00424573bf81:988315d5-b3e5-4623-875d-cec287f7f03f
---
# Prompt Claude i Gemini — Cercador Universal Desacoblat i Resilient

Aquesta plantilla estableix les instruccions tècniques i el context arquitectònic per a agents locals (Claude/Codex).

<!-- SDP:SECTION prompt.local.s0 -->
## 0. Preflight (Per a l'agent orquestrador)

Verificat l'Escriptori amb `node tooling/gates/porta-olivera.mjs --informe`. S'han identificat les fallades estructurals de `/cerca` (absència d'adaptador per a `organization_directory` i bloqueig 403 Forbidden al padró pel tenant mismatch). Pla d'implementació validat a `_wiki_de_poble/04_escriptori/261022_1955_pla_implementacio_cercador_universal.md`.

<!-- SDP:SECTION prompt.local.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_34da1b34-3cf4-4b01-970e-00424573bf81:988315d5-b3e5-4623-875d-cec287f7f03f |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T18:28:23.046Z |
| Modificació | 2026-10-22T18:33:00.000Z |
| Propietari | IAIA MarIA (Directora Tècnica) |
| Aprovació humana | Mestre Javi Llinares |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/prompt_local.md (v3.8.0) |
| Model IA | Claude Opus 5.5 / Gemini 4 Argon |
| Tokens consumits | ~ |

<!-- SDP:SECTION prompt.local.s2 -->
## Historial

2026-10-22T18:28:23.046Z: Emissió del prompt per part de la Directora Tècnica MarIA per a Claude i Gemini, per solucionar la cerca d'empreses com «La Figuera» (`/empresa/lafiguera`) i de persones com Carmen i Damián, creant el Cercador Universal Definitiu.

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

**🌍 Ecosistema Físic i Distribució de Carpetes (`Som de Poble` vs `socdepoble.org`):**
- **Directori Mare (`Som de Poble`):** És l'entorn contenidor global de tot el projecte (`/Users/javillinares/Documents/Antigravity/Som de Poble/`). No conté `package.json` ni és un repositori git (està protegit per un `.gitignore` de seguretat).
- **Nucli Operatiu i Git (`socdepoble.org`):** És l'aplicació web, la Wiki oficial (`_wiki_de_poble/`), el motor de regles i el repositori Git. Tota comanda de consola (`npm test`, `npm run dev`, `git status`, `node tooling/...`) **s'ha d'executar obligatòriament a `socdepoble.org`** (p. ex. `cd socdepoble.org && npm test`). Si s'editen fitxers des de l'arrel de `Som de Poble`, cal prefixar les rutes amb `socdepoble.org/`.
- **Carpetes Satèl·lit Exteriors de `Som de Poble` (Ja Creades i Canòniques):**
  * `_arxiu_wiki_de_poble/`: Únic destí oficial per a l'arxiu fred i la memòria històrica pesada que s'evacua d'Obsidian.
  * `_comunicacio_de_poble/`, `_cultura_de_poble/`, `_gestoria_de_poble/`, `_investigacio_ia_de_poble/`, `_multimedia_de_poble/`, `_raw_de_poble/`, `_rebost_de_poble/`, `_recursos_de_poble/`, `_salut_de_poble/`.
- **Prohibició Absoluta:** Està terminantment prohibit que qualsevol IA invente carpetes noves a `Som de Poble` o a `socdepoble.org`. La informació que calga preservar s'ubica exclusivament a les carpetes satèl·lit oficials ja establertes.

**🔬 ENGINYERIA INVERSA I PARITAT AMB REA (Incentiu de Fidelitat):**
Totes les IAs (Claude, Codex, Gemini) tenen registrat i operatiu el conjunt d'eines MCP de REA (*Reverse Engineer Anything*) i la skill 'reverse-engineer-anything'. Quan se us encomane replicar, millorar o auditar una funcionalitat basada en un sistema o aplicació de referència existent (ex. el clon/patró WhatsApp, el TPV Loiverse, la Gestoria autònoma o la Frontissa de Sollutia), teniu autorització expressa i encoratjament per a utilitzar REA per a disseccionar bundles, lògica i comportament del patró de referència. L'objectiu és capturar la saviesa i el funcionament real de les millors aplicacions i traslladar-les al patró de Pedra Seca de Sóc de Poble amb el màxim trellat i sense duplicar codi.

<!-- SDP:SECTION prompt.local.s_instruccio -->
## Instrucció del torn

El Mestre Javi acaba de crear una empresa a La Torre de les Maçanes: «La Figuera» (`/empresa/lafiguera`). La fitxa funciona al 100%, però en anar al cercador global (`/cerca?q=figuera`), torna **0 resultats**. A més, en cercar persones com Carmen o Damián, el cercador falla amb un error `403 Forbidden` mostrant l'alerta: *«⚠️ No s'ha pogut buscar en el padró del poble: Estàs en Mode Foraster»*.

Com a equip d'enginyeria d'elit (Claude Opus 5.5 per a la construcció i Gemini 4 per a l'auditoria adversarial), teniu la missió de construir el **Cercador Universal Definitiu** de Sóc de Poble:
1. **Desacoblar el cercador del xat**: La cerca de veïns i entitats no pot dependre de si tens un fil de conversa obert ni pot rebentar amb 403 Forbidden si l'usuari és foraster o està desconnectat.
2. **Indexar el directori d'organitzacions públiques**: Afegir la font de dades neutral `organization_directory` / `organizations` (amb suport local i remot) per a que totes les empreses i entitats del poble siguen cercables instantàniament.
3. **Algorisme de cerca d'alta precisió (Estat de l'Art)**:
   - Plegat exhaustiu d'accents i caràcters especials valencians (à/á, è/é, í/ï, ò/ó, ú/ü, ç, l·l).
   - Rànquing intel·ligent multicriteri: Coincidència exacta > Prefix > Títol > Lema/Ofici > Contingut.
   - Ponderació per proximitat: Si l'entitat o persona és del poble actiu, rep una bonificació al rànquing.
   - Resiliència absoluta (Fail-Safe): Si una font externa falla o triga, les altres fonts es mostren a l'instant sense bloquejos ni pantalles d'error destructives.

> **MÈTODE GAUNTLET (Obligatori):** L'Agent Local ha de processar aquest prompt en mode *Gauntlet*. Planifica, construeix, audita el teu propi resultat amb un *Àrbitre Adversarial intern* (buscant falles, placeholders o incompliments de la Llei de l'Enxufabilitat), i corregeix fins que assoleixis la perfecció. Prohibit lliurar la primera versió sense passar l'auditoria adversarial.

<!-- SDP:SECTION prompt.local.s4 -->
## Tasques

- **T1: Contracte de Dades i Adaptador per a Entitats Públiques (`src/data/`)**:
  - Afegir el mètode `listPublicOrganizations(filtre, config)` a `contracte.js` i `backendPort.js`.
  - Implementar la crida a `/rest/v1/organization_directory?select=*` a `src/data/supabase/organizations.js`.
  - Implementar el mètode equivalent a `src/data/localPerfils.js` per als modes `local` i `seed`.
- **T2: Adaptador d'Indexació i Algorisme de Cerca (`src/sections/search/indexCerca.js`)**:
  - Implementar `deOrganitzacio(org, opcions)` que converteix les files d'organització pública a entrades amb títol, poble, lema/descripció, avatar/logo i enllaç directe a la ruta `/empresa/<slug>`.
  - Enriquir `cercaEntrades` amb normalització valenciana completa i rànquing multicriteri (BM25 simplificat + pes semàntic).
- **T3: Resiliència i Integració de Fonts al Hook (`src/sections/search/useCercaGlobal.js`)**:
  - Integrar la font `entitatsPubliques` a l'índex global.
  - Blindar la crida a `cercaMembres`: si respon 403 (foraster), no marcar la cerca general com a fallida ni disparar alerts alarmistes; tractar el padró privat silenciosament com a no disponible per a forasters i mantenir la cerca oberta.
  - Assegurar que la fusió d'identitats pròpies i entitats públiques manté una única fitxa canònica al graf.
- **T4: Alineació de Configuració de Tenant**:
  - Actualitzar `VITE_TENANT_ID` a `.env.local` i `.env.production.local` al poble real de La Torre de les Maçanes (`edd2f840-f4af-414a-821c-ebb8b8b2a80a`).
- **T5: SQL de Supabase per al Mestre**:
  - Verificar i aportar el SQL necessari per actualitzar la vista `organization_directory` a Supabase afegint `town_name` i garantint els permisos `SELECT` per a `anon` i `authenticated`.

### Criteris d’acceptació i reproducció

- **URL de proves locals:** `http://localhost:3340` (o port actiu).
- **Criteris d'Acceptació:**
  1. La cerca `/cerca?q=figuera` troba «La Figuera» a la pestanya «Tot» i a «Entitats» amb comptador 1, el seu logo i enllaç a `/empresa/lafiguera`.
  2. La cerca de persones del poble (com Carmen o Damián) torna les seues fitxes corresponents sense error 403 Forbidden.
  3. En mode convidat/foraster, no apareix cap error en roig ni es bloqueja la cerca pública.
  4. Totes les proves existents i noves passen amb èxit (`npm test src/sections/search/` i `npm test src/data/`).

<!-- SDP:SECTION prompt.local.s5 -->
## Riscos

- **Duplicació de targetes**: Assegurar que `ambLaIdentitatPropia` i `clauCanonica` continuen deduplicant l'entitat pròpia amb l'entitat pública del directori.
- **Manteniment de compatibilitat**: No alterar les signatures existents de `useCercaGlobal` per a no trencar components consumidors com `SearchSection.jsx`.


<!-- SDP:SECTION prompt.local.s6 -->
## Protocol d'Interacció i Sortida

En finalitzar l'auditoria o l'edició, heu de complir els següents passos:
1. **Sortida:** Genereu el vostre document d'informe o auditoria exclusivament a `_wiki_de_poble/04_escriptori/` seguint la taxonomia `AAMMDD_HHMM_auditoria_[nom_ia].md`.
2. **Context Compartit:** Qualsevol altre document present a `04_escriptori/` és part del context actiu i s'ha de llegir sencer abans d'emetre l'informe.
3. **Consens Tècnic i Canal Viu (Execució Paral·lela):** Si treballeu en un Xat Lateral en paral·lel amb una altra IA, actueu de forma coordinada i NO us xafeu mútuament l'Escriptori. Deixeu un informe de progrés a `04_escriptori/` cada 10-15 minuts (o en acabar cada bloc lògic). L'orquestradora (MarIA) ha programat un cron actiu vigilant l'Escriptori exclusivament per al vostre fil i deixarà nous documents de ruta si cal. Llegiu l'Escriptori constantment abans d'actuar. No s'executarà cap canvi sobre codi crític fins que el Pla estigui estabilitzat.
4. **Retroalimentació:** Si aquesta plantilla (prompt_local) es pot optimitzar tècnicament, detalleu-ho al vostre informe.
5. **Desconvocatòria i Tancament de Crons («Cadascuna a sa casa»):** Quan l'informe final estiga emés o quan finalitze el torn de treball, és OBLIGATORI aturar i cancel·lar qualsevol cron o schedule recurrent de fons. Està terminantment prohibit deixar processos zombis actius que continuen consumint tokens o bloquegen el tancament de l'aplicació. En acabar, tot agent allibera els seus recursos i cancel·la les seues tasques programades.

<!-- SDP:SECTION prompt.local.s7 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/prompt_local.md; SHA-256 33bf809f3e982c6466f238664086d7b48b527bb30bb5a07843541902a279b315. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION prompt.local.s8 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
