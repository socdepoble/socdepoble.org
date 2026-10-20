---
type: informe
status: canonic
description: Auditoria extrema de les 38 skills de l'eixam i reescriptura literària rural dels 5 diccionaris d'idioma, textos públics i Dossier Institucional per al llançament públic de Sóc de Poble
tags:
  - auditoria
  - govern
visibility: private
reflex: sdp:torn_1be1a18c-b5b1-45c7-9492-a8f481f25682:fd6eab24-cfab-4920-b9ea-249347d412fb
---
# Auditoria Extrema de Sistema: Skills de l'Eixam i Reescriptura Rural per al Llançament Públic

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_1be1a18c-b5b1-45c7-9492-a8f481f25682:fd6eab24-cfab-4920-b9ea-249347d412fb |
| Versió del document | 2.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-20T19:03:04.222Z |
| Modificació | 2026-10-20T19:14:00.000Z |
| Propietari | Gemini 4 Argon (Antigravity) |
| Plantilla | auditoria.md (v3.9.0) |
| Ruta | auditoria |
| Rebut | sdp:torn_1be1a18c-b5b1-45c7-9492-a8f481f25682:fd6eab24-cfab-4920-b9ea-249347d412fb |
| Tall d'evidència | 6d50d01d 19:14 |
| Aprovació humana | Mestre Javi Llinares |
| requires_human_decision | false |
| Model IA | Gemini 4 Argon |
| Tokens consumits | ~178k / 2M |

<!-- SDP:SECTION auditoria.s2 -->
## Historial

- 2026-10-20T19:03:04.222Z: esborrany v1.0.0 creat sota el torn `torn_1be1a18c-b5b1-45c7-9492-a8f481f25682`.
- 2026-10-20T19:14:00.000Z: versió canònica v2.0.0 completada per Gemini 4 Argon. Incorpora l'auditoria completa dels 5 diccionaris d'idioma (`src/config/idiomes/{ca,es,en,eu,gl}.js`), la classificació taxativa `[SANA]` / `[CAL_PODA]` / `[URGENT_ACTUALITZAR]` de les 38 skills de `.agents/skills/`, la integració dels 5 pilars d'enginyeria inversa REA (Tellado, Bring!, Loyverse/La Parròquia, Cens Vila Gal·la i Banda La Torre), la taula comparativa d'erradicació d'AI Slop i el registre de telemetria termodinàmica.

<!-- SDP:SECTION auditoria.s3 -->
## Acte reflex

Abans d'emetre el dictamen s'han llegit i contrastat físicament els documents fundacionals i el codi real sobre `6d50d01d`: `AGENTS.md`, `_wiki_de_poble/00_index.md`, `taxonomia_documental.md`, els 9 documents de `_wiki_de_poble/01_ser/`, les 38 skills de `.agents/skills/*/SKILL.md` (i `00_INDEX_SKILLS.md`), els 5 diccionaris d'idioma (`src/config/idiomes/{ca,es,en,eu,gl}.js`), els continguts públics (`src/sections/text/pageContent.js`, `src/sections/text/legalContent.js`, `src/data/sectionContent.js`, `src/data/appSeed.js`, `src/data/agentsSeed.js`, `src/data/iaiaLocal.js`, `README.md`, `wordpress-plugin/readme.txt`) i el Pla d'Implementació de la Fase E (`_wiki_de_poble/04_escriptori/261020_2045_pla_implementacio_el_comu_i_llistes_reactives.md`).

<!-- SDP:SECTION auditoria.s4 -->
## Abast

Estem a les portes del llançament públic de **Sóc de Poble** i de l'enviament del paquet natiu a l'App Store i Google Play (amb la Fase D segellada sobre `6d50d01d` i 20.174 proves en verd, mentre Claude Code executa la Fase E de la `UniversalListCard` i «El Comú»). Abans d'obrir les portes de la plaça, el sistema necessita una neteja de primavera implacable en tres blocs:

1. **BLOC 1 · Auditoria i Sanejament de les Skills (`.agents/skills/`):** Inspecció de les 38 skills del sistema per podar procediments morts (doctrines prèvies a l'Auth natiu Apple/Google de la Fase D, antic concepte mercantil de «productes» superat per **«El Comú» (`elements_comu`)**, i passos manuals ara automatitzats pels tractors) i injectar els 5 pilars d'Enginyeria Inversa REA v2.0.0.
2. **BLOC 2 · Reescriptura Rural de Textos i Erradicació d'AI Slop:** Auditoria línia per línia dels 5 diccionaris d'idioma (`src/config/idiomes/{ca,es,en,eu,gl}.js`), dels continguts públics (`src/sections/text/pageContent.js`, `src/sections/text/legalContent.js`, `src/data/sectionContent.js`, `src/data/appSeed.js`, `src/data/agentsSeed.js`, `README.md`, `wordpress-plugin/readme.txt`) i del Dossier Institucional (`_wiki_de_poble/01_ser/`).
3. **BLOC 3 · Automillora i Telemetria Termodinàmica:** Proposta de portes mecàniques anti-slop i registre de telemetria del torn.

<!-- SDP:SECTION auditoria.s5 -->
## Troballes

### 1. Resum Executiu de l'Auditoria

#### 1.1. Diagnòstic del Còdex de Skills (`.agents/skills/`)

L'inventari físic de `.agents/skills/` conté **38 carpetes de skills** més l'índex `00_INDEX_SKILLS.md`. L'auditoria creuada contra el codi real (`6d50d01d`) i el Pla d'Implementació de la Fase E (`261020_2045_pla_implementacio_el_comu_i_llistes_reactives.md`) llança el següent balanç:

- **`[SANA]` (22 skills · 57,9%):** Doctrines sòlides, alineades amb el Model C de la Frontissa Neutral, el patró Slot de Pedra Seca i les portes mecàniques (`porta-olivera.mjs`).
- **`[CAL_PODA]` (6 skills · 15,8%):** Skills amb solapaments doctrinals, referències a models d'IA caducs (`Claude 3.5 Haiku`, `GPT-6 Astra Ligero`), terminologia antiga del Model A (`Sollutia/Supabase`) o salts de numeració Markdown (`R7`).
- **`[URGENT_ACTUALITZAR]` (10 skills · 26,3%):** Skills que han d'incorporar immediatament els 5 pilars d'Enginyeria Inversa REA v2.0.0 (`Tellado`, `Bring!`, `Loyverse / La Parròquia`, `Cens Vila Gal·la`, `Banda La Torre`), la unificació d'«El Comú» (`elements_comu`), o corregir infraccions de seguretat i de la llei `R13` de maquetació.

#### 1.2. Diagnòstic Literari i de Textos Públics

L'auditoria dels textos visibles als veïns ha destapat **6 troballes crítiques (P0)** que no poden eixir al carrer sense corregir-se:

1. **Incoherència i exposició de dades fiscals a `src/sections/text/legalContent.js`:** Les línies 28–29 mostren el text literal `[DADES PROTEGIDES AL CODI FONT]` en la versió pública d'Avís Legal mentre la línia 71 exposa al descobert el NIF personal (`21476359V`) i el domicili físic. A més, usa 11 vegades el castellanisme **«una conta / la teua conta»** en lloc d'**«un compte / el teu compte»** i conté l'errata *«alletjament web»* (L218).
2. **Claus sense traduir (en valencià cru) dins dels diccionaris `es.js`, `en.js`, `eu.js` i `gl.js`:** En `src/config/idiomes/es.js` (L49–64) i `en.js` (L49–64) hi ha **12 claus de producció copiades en valencià sense traduir** (`pull.release`, `pull.pull`, `pull.refreshing`, `section.poblacio.*`, `section.pobles.wikipedia_link`, `section.pobles.noResults`, `section.pobles.loading`, `section.pobles.error`, `section.realitat.title`, `section.search.label`). En `eu.js` (L51–87) i `gl.js` (L50–81) n'hi ha **31 claus en valencià sense traduir** (incloent-hi `section.control.*`, `section.gestoria.*`, `section.dispositius.*` i `section.consola.*`).
3. **Jargó de startup, anglicismes crus i fuites tècniques als diccionaris (`src/config/idiomes/ca.js`):**
   - `'section.control.kicker': 'Xarxa Neural'` (L67) — jargó ciberpunk impropi d'un mas.
   - `'nav.events': 'Events'` (L83, L237, L364), `'nav.login': 'Login'` (L105, L388), `'section.mur.feed': 'Feed original'` (L231) i `'section.search.searchPlaceholder': '...posts...'` (L174) — anglicismes crus en la interfície valenciana.
   - `'section.events.searchPlaceholder': 'Cerca sessions, rituals, cites...'` (L242, L514) — farciment esotèric d'IA en lloc d'actes, festes, assajos i aplecs de poble.
   - `'section.disseny.note': 'Les següents seccions estan sent migrades cap al patró Slot per reduir el DOM_DEPTH.'` (L263) — fuita de mètriques internes d'enginyeria a la vista pública.
   - `'section.login.registerEntradilla': 'Deus registrar-te...'` (L414) — calc sintàctic del castellà (*«Debes registrarte»*).
4. **Deriva arquitectònica Model A vs Model C a `src/sections/text/pageContent.js` i `README.md`:** Les pàgines `projecte` (L46) i `constitucio` (L58) i el `README.md` (L13) encara diuen `Sollutia (Supabase)` o `Supabase (via Sollutia)`, violant la doctrina de la Frontissa Neutral (Model C).
5. **Iframe trencat i rutes inexistents a `pageContent.js` (`anima`, L115):** Incrusta `<iframe src="/iaia-maria" style="...">` (que carrega recursivament l'SPA dins d'ella mateixa) i enllaça a `/skills` (ruta abolida) en lloc de `/wikidepoble`.
6. **Castellanismes i desfasament a `pageContent.js` (`xat`, `constitucio`, `versions`, `notes`):** Usa *«la panaderia»* en lloc de *«el forn»* (L423), *«Inquebrantable»* (L58), cita l'abolida *«quarta columna»* (L58), arrossega errates (*«Consolidiació»*, *«escannejar»*, *«Xilella»*, L138) i s'atura a la V25.

---

### 2. BLOC 1 · Matriu d'Estat i Sanejament de les Skills (`.agents/skills/`)

#### 2.1. Poda de Procediments Morts i Integració dels 5 Pilars REA v2.0.0

S'estableixen els **5 Pilars d'Enginyeria Inversa REA** que deixen obsoletes les suposicions antigues del sistema i que s'han d'injectar al Còdex de Skills:

1. **Pilar REA 1 · Fernando Tellado (`wp-plugin-security` v1.3, `DietPress`, `Vigilante`, `humanizar-texto-es`):**
   - Desacoblament radical de WordPress i Frontissa Neutral (`window.__SDP_HOST__`).
   - Escapers JS de 5 caràcters (`&`, `<`, `>`, `'`, `"`) per neutralitzar patrons d'injecció d'atributs (`CVE-2026-81754`).
   - Prohibició d'usar `$_REQUEST['action']` com a comprovació d'estat; higiene d'`uninstall.php` i autoload `< 10 KB`.
   - Aplicació de les 24 regles d'`humanizar-texto-es` adaptades al valencià rural contra l'AI slop.
2. **Pilar REA 2 · Bring! (`web.getbring.com`):**
   - Graella de rajoles tàctils quadrades (`98x116px` / `aspect-ratio: 1 / 1`, 3 columnes en mòbil `390px`) amb objectiu tàctil $\ge 48 \times 48\text{ px}$.
   - Suma idempotent de quantitats sobre `elements_comu` i filtre anti-eco per `clientId` inspirat en el bucle WebStomp de Bring!.
3. **Pilar REA 3 · Loyverse POS & Back Office / La Parròquia:**
   - Separació estricta entre el **Back Office Web administratiu** (pantalla ampla per a escandalls, proveïdors, marges i catàleg) i el **TPV tàctil ràpid a 1 toc** (mòbil/tauleta amb tiquets oberts i modificadors).
   - Suport natiu per als **11 grups de modificadors reals de La Parròquia** i el **Comparador Rural de Preus** (`preu_poble_centims` vs. `preu_supermercat_centims` + `cost_benzina_desplacament_centims`).
4. **Pilar REA 4 · Cens de Vila Gal·la (`gali-costume-hub.lovable.app`):**
   - Mutació optimista amb bloqueig **Compare-And-Swap (CAS) atòmic** al servidor (`.eq("id", itemId).is("claimed_by", null)`) per impedir que dos veïns reclamen la mateixa disfressa o instrument.
   - Protecció contra el *thundering herd* harmònic $H_n = \sum_{k=1}^{n}\frac{1}{k}$ (substituint el `fetchAll()` complet per pegats delta `postgres_changes`).
5. **Pilar REA 5 · Banda La Torre (2006–2007):**
   - **Full d'Eixida en 1 sol foli A4** (`Full_dEixides_-_Plantilla.xls`): plantilla necessària vs. disponible per cordes, quilometratge de cotxes particulars i separació comptable entre jerarquia interna de **nivells `1..6`** (educands a mestres) i músics contractats de reforç amb caixet.
   - **Loteria de Nadal en dipòsit als bars** (`Full_de_control_loteria_nadal.ots` — Bar Amber, Bar Adrià): dècim a `20,00 €` de cost i `23,00 €` de venda (`3,00 €` de recàrrec = **15% de benefici net** per a l'associació) amb taula de liquidació i devolucions abans del sorteig.
   - **Fitxa d'Educands** (`Model Fitxa dAlumne 2007.xls`): seguiment pedagògic no punitiu amb gràfiques *sparkline* d'evolució mensual i tutoria creuada.

#### 2.2. Dictamen Taxatiu de les 38 Skills de `.agents/skills/`

| # | Skill (`.agents/skills/<nom>/SKILL.md`) | Dictamen | Diagnòstic i Acció Concreta |
| --- | --- | --- | --- |
| 1 | `core-anti-alucinacio` | `[SANA]` | Protocol de verificació empírica vigent i alineat amb la Llei de Veritat Absoluta. |
| 2 | `core-auto-millora` | `[SANA]` | Sublimació d'errors en regles deterministes; coherent amb el Llibre d'Or. |
| 3 | `core-consell-i-colmena` | `[CAL_PODA]` | **Acció:** Podar l'apartat `## 5. PROTOCOL D'ESTALVI` (línies 56–67), que conté quotes caduques del 20 de setembre i ordena degradar a `Fable (Claude 3.5 Haiku)`, contradient `04_taula_potencia_models.md` (*«Només Models Frontera; aplica la Llei de l'Oblit»*). |
| 4 | `core-empaquetat-wp` | `[URGENT_ACTUALITZAR]` | **Acció:** Actualitzar el patró de nom del ZIP a `socdepoble-enxufe-vVERSIO-AAMMDD_HHMM.zip` (el que genera `tooling/wordpress/empaqueta.mjs`) i afegir les 3 lleis de Tellado (`DietPress` / `wp-plugin-security`): `uninstall.php` obligatori, opcions `autoload < 10 KB` i barrera zero-rastres de `@capacitor/*` al paquet WP (`tests/natiu-build.test.mjs`). |
| 5 | `core-estrategia-ia` | `[CAL_PODA]` | **Acció:** Podar la llista fixa de models del §3 (que cita `GPT-6 Astra Ligero`) i remetre canònicament a `_wiki_de_poble/01_ser/04_taula_potencia_models.md` com a única font de veritat. |
| 6 | `core-fondaria-dom` | `[SANA]` | Límit estricte de 12 nivells DOM i patró Slot vigents i verificats per `dom-depth-audit.mjs`. |
| 7 | `core-gauntlet-loop` | `[URGENT_ACTUALITZAR]` | **Acció:** Ampliar la llista de referents REA del §3 amb els 5 pilars ja auditats: **Obsidian** (Notes), **Bring!** (`98x116px` + WebStomp anti-eco), **Cens Vila Gal·la / Lovable** (CAS `.is("claimed_by", null)` + $H_n$), **Banda La Torre** (A4, nivells `1..6`, loteria 15%, educands) i **Fernando Tellado** (`wp-plugin-security` v1.3). |
| 8 | `core-identitat-iaia` | `[SANA]` | Defineix el to de matriarca rural, el valencià meridional-alacantí i la filosofia del Trellat. |
| 9 | `core-llegibilitat-text` | `[URGENT_ACTUALITZAR]` | **Acció:** Incorporar el patró de **«Lectura d'un Salt»** (`<h5>` + `<p><strong>` a totes les pàgines de `pageContent.js`) i les 24 regles anti-IA de la skill `humanizar-texto-es` de Fernando Tellado adaptades al valencià de poble. |
| 10 | `core-maquetacio-markdown` | `[SANA]` | Les 13 regles (`R1–R13`) i les portes mecàniques són l'estàndard vigent verificat per `document.mjs check`. |
| 11 | `core-memoria-historica` | `[URGENT_ACTUALITZAR]` | **Acció:** Eixamplar l'esborrany de 33 línies enllaçant obligatòriament amb el Llibre d'Or (`_wiki_de_poble/01_ser/03_llibre_d_or_memoria_episodica.md`) i documentant la frontera d'accés a les 3 carpetes satèl·lit històriques (`socdepoble`, `Soc de Poble Antiga`, `Soc de Poble - GitHub`). |
| 12 | `core-optimitzacio-recursos` | `[SANA]` | Doctrina de pressupost termodinàmic, `content-visibility: auto` i chunks diferits vigent (Fase D). |
| 13 | `core-seguretat-audit` | `[URGENT_ACTUALITZAR]` | **Acció:** Afegir la **Llei F (Auditoria Tellado `wp-plugin-security` v1.3 + Fase D/E)**: escapers JS de 5 caràcters (`&`, `<`, `>`, `'`, `"`, `CVE-2026-81754`), prohibició de `$_REQUEST['action']` com a guarda d'estat, `Prefer: return=minimal` per a insercions anònimes a `public.denuncies` i bloqueig CAS atòmic `.is("claimed_by", null)` per a `elements_comu`. |
| 14 | `core-taxonomia-estricta` | `[CAL_PODA]` | **Acció:** Unificar o convertir en pont curt cap a `wiki-documentacio-i-reflex` i `taxonomia_documental.md` per evitar doble manteniment de les 8 carpetes canòniques. |
| 15 | `core-verificacio-visual` | `[SANA]` | Protocol de comprovació en les 3 columnes, mòbil `390x844` i Mode Bancal d'alt contrast. |
| 16 | `iaia-bategat-sistema` | `[SANA]` | Cicle de bategat d'estat, telemetria i sincronització d'arrancada vigent. |
| 17 | `iaia-context-ocult` | `[SANA]` | Injecció d'identitat i memòria d'arrancada alineada amb `AGENTS.md`. |
| 18 | `iaia-orquestracio-aprenentatge` | `[SANA]` | Destil·lació d'aprenentatges i govern de l'eixam. |
| 19 | `sdp-accessibilitat- rural` | `[SANA]` | Nota: el nom de la carpeta té un espai històric (`sdp-accessibilitat- rural`), però està indexat així a `00_INDEX_SKILLS.md`; mantindre la ruta física i aplicar el criteri de mínim `48x48px` i contrast WCAG AAA al bancal. |
| 20 | `sdp-agent-conversacional` | `[SANA]` | Disseny de la IAIA i els 12 especialistes rurals amb el motor local BM25 (`iaiaLocal.js`). |
| 21 | `sdp-app-grid-shell` | `[CAL_PODA]` | **Acció:** Corregir el salt d'encapçalament de `## 3` a `## 5` (infracció de `R7` de `core-maquetacio-markdown`) i referenciar `sdp-pedra-seca` §13 per no duplicar les mides de les 3 columnes. |
| 22 | `sdp-botons-connexio` | `[SANA]` | Invariància de les barres d'acció i el botó blau `#0284c7` / taronja `#f97316`. |
| 23 | `sdp-calendari-agricola` | `[CAL_PODA]` | **Acció:** Podar la referència antiga al Model A (`taules core de Sollutia/Supabase` a la línia 28) substituint-la pel contracte de la Frontissa Neutral, i fusionar el solapament amb `sdp-casos-us-essencials` §3. |
| 24 | `sdp-casos-us-essencials` | `[URGENT_ACTUALITZAR]` | **Acció:** Traduir al valencià l'apartat `## 2. Cuidado de Mayores` (actualment en castellà amb *«abuelita»*, L22–28) i actualitzar l'apartat `## 4. Cas d'Ús: La Colla de les 70 Disfresses de Romans` perquè apunte a la **`UniversalListCard`** i a l'entitat polimòrfica **«El Comú» (`elements_comu`)** amb els 5 modes (Rebost, Bar/TPV, Colla/Disfresses, Banda/Eixides, Loteria/Associació) en lloc de l'antic «Enviar a Notes». |
| 25 | `sdp-clon-loiverse` | `[URGENT_ACTUALITZAR]` | **Acció Major:** Renomenar el títol intern a **«El Comú, Rebost, Bar/TPV, Cens de Colles i Banda (Inspiració Bring!, Loyverse, Vila Gal·la i Banda La Torre)»**. Podar el vell marc mercantil de «productes» i incorporar l'esquema canònic `elements_comu` amb els 5 pilars REA: rajoles `98x116px` + WebStomp anti-eco de Bring!, dualitat Back Office web vs. TPV tàctil a 1 toc + 11 grups de modificadors de La Parròquia + comparador rural amb cost de benzina, bloqueig CAS atòmic `.is("claimed_by", null)` + protecció $H_n$ de Vila Gal·la, i Full d'Eixida A4 (nivells `1..6`, quilometratge, loteria 15%, educands) de la Banda La Torre. |
| 26 | `sdp-clon-whatsapp` | `[URGENT_ACTUALITZAR]` | **Acció:** Incorporar l'arquitectura de la **`UniversalListCard`** ancorada al xat de grup (amb resum inline d'alta densitat i `BottomSheet` a pantalla completa en tocar «Obrir llista») i la **Llei de Jakob sense marques alienes** (Gauntlet C12: cap menció a WhatsApp ni Telegram en textos públics). |
| 27 | `sdp-contingut-estatic` | `[SANA]` | Govern de `sectionContent.js`, `appSeed.js` i el desacoblament d'actius multimèdia. |
| 28 | `sdp-disseny-canonic` | `[SANA]` | Paleta cromàtica (`#f97316`, `#0284c7`, pedra seca) i tipografia vigents. |
| 29 | `sdp-esdeveniments-festes` | `[SANA]` | Gestió de l'agenda del poble, programes de festes i convocatòries. |
| 30 | `sdp-identitat-corporativa` | `[SANA]` | Govern d'entitats, colles, ajuntaments i empreses amb doble identitat persona/entitat. |
| 31 | `sdp-mercat-rural` | `[SANA]` | Complementa `sdp-clon-loiverse` en la publicació al Mercat públic i venda de proximitat. |
| 32 | `sdp-multi-idioma` | `[SANA]` | Govern dels 5 diccionaris diferits (`src/config/idiomes/{ca,es,en,eu,gl}.js`) i paritat de claus (`i18n.claus.test.js`). |
| 33 | `sdp-patrimoni-memorial` | `[SANA]` | Arxiu visual, memòria oral i protecció de coordenades GPS en fotos de persones. |
| 34 | `sdp-pedra-seca` | `[SANA]` | Constitució tècnica i visual del sistema (13 seccions canòniques). |
| 35 | `sdp-perfils-usuari` | `[SANA]` | Privacitat per defecte de persones físiques i visibilitat pública d'entitats. |
| 36 | `sdp-workflow` | `[CAL_PODA]` | **Acció:** Corregir la línia 27 (que apunta a `_wiki_de_poble/90_arxiu_historic/...`, prohibit per la Porta de l'Olivera) i la línia 36 (que s'autoreferencia en lloc d'apuntar a `.agents/skills/sdp-pedra-seca/SKILL.md`). |
| 37 | `wiki-documentacio-i-reflex` | `[URGENT_ACTUALITZAR]` | **Acció:** Corregir l'ordre de les seccions finals a les línies 112–115: actualment posa `## Vincles` abans de `## Convocatòria i evidència de lectura`, violant la regla `R13` de `core-maquetacio-markdown` (que exigeix `Convocatòria` i després `Vincles` com a última secció). Corregir també la numeració trencada del §4 (`1, 2, 5`) i del §5 (`4, 4`). |
| 38 | `wiki-propagar-veritat` | `[URGENT_ACTUALITZAR]` | **Acció Crítica (Seguretat):** Eliminar de la línia 27 la instrucció `find _wiki_de_poble/ .agents/ -type f -name "*.md" -exec sed -i ...` sense filtres d'exclusió. Aquest `sed` cec va causar la mutació històrica del `LEDGER.md` documentada al Llibre d'Or (Aprenentatge #1). Imposar l'exclusió estricta `-not -path "_wiki_de_poble/10_actes/*" -not -path "_wiki_de_poble/90_arxiu_historic/*" -not -name "LEDGER.md"`. |

---

### 3. BLOC 2 · Catàleg de Reescriptura Textual i Erradicació d'AI Slop

#### 3.1. Taula Comparativa Mestra (Trellat Rural vs. Text Fred / Robòtic / Desactualitzat)

| Ubicació / Clau | Text Actual (Fred / Robòtic) | Proposta Autèntica Sóc de Poble (Trellat Rural) | Raó del Canvi |
| --- | --- | --- | --- |
| `src/config/idiomes/ca.js` · `section.control.kicker` (L67) | `'Xarxa Neural'` | `'El teu Mas'` | Erradica el jargó ciberpunk/startup («Xarxa Neural»); el Panell de Control és el Mas del veí. |
| `src/config/idiomes/ca.js` · `section.control.subtitle` (L69) | `'Node principal i accés a les eines d\'administració i gestió'` | `'Des d\'ací publiques al poble, ajustes el xat i governes el teu espai'` | Substituïx el llenguatge fred de sysadmin per una frase directa i humana. |
| `src/config/idiomes/ca.js` · `nav.events` (L83), `section.events.kicker` (L237), `section.detail.events.title` (L364) | `'Events'` | `'Agenda'` (o `'Esdeveniments'`) | Elimina l'anglicisme cru `'Events'` dins del diccionari valencià (`ca.js`). |
| `src/config/idiomes/ca.js` · `nav.login` (L105) i `section.login.title` (L388) | `'Login'` / `'Login, registre i Google'` | `'Entrar'` / `'Entrada, registre i accés ràpid'` | Elimina l'anglicisme `'Login'` i actualitza el títol a la Fase D (on l'accés ràpid ja inclou Apple i Google). |
| `src/config/idiomes/ca.js` · `section.login.subtitle` (L389) i `heroText` (L392) | `'Accés al portal per a entrar, crear un compte o continuar amb Google.'` | `'Entra al teu compte, crea\'n un de nou o accedeix amb un sol toc.'` | Actualitza el subtítol a la Fase D (Apple + Google + correu) sense excloure iOS. |
| `src/config/idiomes/ca.js` · `section.login.registerEntradilla` (L414) | `'Deus registrar-te amb el teu nom real com a persona física...'` | `'T\'has de registrar amb el teu nom real com a persona física...'` | Correcció gramatical: en valencià *«deure + infinitiu»* indica probabilitat; l'obligació és *«haver de + infinitiu»* o *«caldre»*. |
| `src/config/idiomes/ca.js` · `section.xat.memberFallback` (L155) | `'Membre de la comunitat'` | `'Veí o veïna del poble'` | Canvia l'etiqueta freda de plataforma SaaS pel tracte real de poble. |
| `src/config/idiomes/ca.js` · `section.search.searchPlaceholder` (L174) | `'Cerca persones, pobles, posts...'` | `'Cerca persones, pobles, publicacions...'` | Elimina l'anglicisme `'posts...'` en valencià (també en `es.js` i `gl.js`). |
| `src/config/idiomes/ca.js` · `section.mur.feed` (L231) | `'Feed original'` | `'Mur original'` | Elimina l'anglicisme `'Feed'` (també en `es.js`: `'Muro original'` i `gl.js`: `'Muro orixinal'`). |
| `src/config/idiomes/ca.js` · `section.events.searchPlaceholder` (L242) i `section.connectar.area.events` (L514) | `'Cerca sessions, rituals, cites...'` / `'Mira sessions, cites i rituals.'` | `'Cerca actes, festes, eixides o aplecs...'` / `'Mira els actes, les festes i les convocatòries del poble.'` | Erradica l'AI slop esotèric (*«sessions, rituals, cites»*) als 5 idiomes (`ca`, `es`, `en`, `eu`, `gl`). |
| `src/config/idiomes/ca.js` · `section.disseny.workInProgress` (L262) i `note` (L263) | `'Treball en Progrés'` / `'Les següents seccions estan sent migrades cap al patró Slot per reduir el DOM_DEPTH.'` | `'En obres'` / `'Estem polint estes peces perquè la pàgina carregue lleugera i clara en qualsevol telèfon.'` | Elimina el calc anglés (*Work in Progress*), la passiva perifràstica (*estan sent migrades*) i la fuita tècnica de `DOM_DEPTH` als 5 idiomes. |
| `src/config/idiomes/ca.js` · `section.mercat.title` (L164) i `subtitle` (L165) | `'Productes i intercanvis'` / `'Explora els productes i les ofertes disponibles.'` | `'El Rebost, la Botiga i el Comú'` / `'Productes de l\'hort, comerç del poble, encàrrecs i recursos compartits.'` | Sublima el vell concepte mercantil de «productes i ofertes» cap a l'arquitectura d'«El Comú» (Fase E). |
| `src/config/idiomes/ca.js` · `section.dispositius.subtitle` (L517) | `'Descobrix instàncies obertes del portal, llança una connexió i envia missatges directes...'` | `'Troba altres dispositius oberts a prop teu, connecta-t\'hi directament i envia missatges sense passar pel núvol.'` | Substituïx el tecnicisme fred *«instàncies obertes del portal»* per l'explicació clara de la connexió directa P2P. |
| `src/config/idiomes/es.js` (L49–64) i `en.js` (L49–64) | 12 claus en valencià sense traduir (`'Deixa anar per actualitzar'`, `'Dades demogràfiques'`, `'Cap poble trobat.'`, `'Cerca'`...) | Traducció íntegra al castellà (`'Suelta para actualizar'`, `'Datos demográficos'`, `'Ningún pueblo encontrado.'`, `'Buscar'`) i a l'anglés (`'Release to refresh'`, `'Demographic data'`, `'No village found.'`, `'Search'`) | Correcció d'internacionalització (Fase D): evita que un usuari amb la interfície en `es` o `en` veja textos de càrrega i cerca en valencià. |
| `src/config/idiomes/eu.js` (L51–87) i `gl.js` (L50–81) | 31 claus en valencià sense traduir (`'Xarxa Neural'`, `'Panell de Control'`, `'Gestoria de Poble'`, `'Deixa anar per actualitzar'`...) | Traducció íntegra a l'euskara (`'Zure Baserria'`, `'Kontrol Panela'`, `'Askatu eguneratzeko'`...) i al gallec (`'O teu Lugar'`, `'Panel de Control'`, `'Solta para actualizar'`...) | Completa la traducció de les 31 claus que havien quedat en valencià cru dins d'`eu.js` i `gl.js`. |
| `src/sections/text/legalContent.js` (L28–29 vs L71) | `Titular: [DADES PROTEGIDES AL CODI FONT]` (L28) mentre L71 exposa NIF i carrer en pla | Unificar en una fitxa institucional neta: `Associació / Projecte Sóc de Poble · La Torre de les Maçanes (Alacant) · Contacte oficial i DPO: socdepoble@socdepoble.org (dades registrals completes a disposició legal prèvia sol·licitud)` | Elimina el marcador cru de desenvolupament `[DADES PROTEGIDES AL CODI FONT]` i evita la contradicció d'exposar el NIF personal a la línia 71. |
| `src/sections/text/legalContent.js` (L49, 53, 81, 106, 172, 187, 195–197, 211) | `una conta` / `la teua conta` / `alletjament web` (L218) | `un compte` / `el teu compte` / `allotjament web` | Correcció lingüística: *«conta»* és un castellanisme per *«compte»* (11 ocurrències a `legalContent.js`). |
| `src/sections/text/pageContent.js` · `projecte` (L46) i `constitucio` (L58) | `'...i l\'escalabilitat en el núvol de Sollutia (Supabase)...'` / `'Sollutia (Supabase): Actua com el nostre sistema nerviós...'` | `'...i una Frontissa Neutral de Dades capaç d\'operar en local i sincronitzar-se amb qualsevol servidor comunitari (Supabase, PocketBase o SQLite)...'` | Correcció doctrinal (Model C): Sollutia és un proveïdor d'allotjament d'Alcoi i Supabase és un motor de base de dades; Sóc de Poble és agnòstic del servidor. |
| `src/sections/text/pageContent.js` · `constitucio` (L58) | `'Llei de la Graella Inquebrantable... i la quarta columna contextual s\'oculta...'` | `'Llei de la Graella de Tres Columnes... L\'espai s\'ordena en tres columnes clares (Navegació, Llista i Contingut), sense quarta columna...'` | Elimina el castellanisme *«Inquebrantable»* (*indestructible / ferma*) i la referència a la 4a columna abolida per `sdp-pedra-seca`. |
| `src/sections/text/pageContent.js` · `anima` (L115) | `<iframe src="/iaia-maria" style="...">` i `<a href="/skills">` | Targeta d'enllaç neta cap a `/perfil/iaia-maria` i `/wikidepoble` sense `<iframe>` ni `style=` inline | Elimina l'iframe recursiu que trencava la pàgina `L'Ànima de la IAIA` i complix la llei zero `style=` inline. |
| `src/sections/text/pageContent.js` · `versions` (L138) | `'V25 · Consolidiació...'`, `'escannejar'`, `'Xilella'` | Incorporar `V26 (Octubre 2026): El Comú, Llistes Reactives, Entrada Nativa (Apple/Google) i Moderació Cívica` i corregir `'Consolidació'`, `'escanejar'`, `'Xylella'` | Posa al dia l'historial públic amb la V26 de llançament i corregeix les 3 errates ortogràfiques. |
| `src/sections/text/pageContent.js` · `notes` (L147) i `notes_shared` (L163) | Atributs `style="margin-top:...; color: #3b82f6;"` i codi mort `notes_shared` | Classes semàntiques Pedra Seca i poda de `notes_shared` (194 línies que cap ruta no invoca) | Complix la Llei de Zero Estils en Línia i alleugereix el paquet d'entrada. |
| `src/sections/text/pageContent.js` · `xat` (L423) | `'...els encàrrecs a la panaderia i els esdeveniments de les associacions.'` | `'...els encàrrecs al forn, les llistes vives d\'El Comú (el rebost, la colla, la banda o la loteria) i els actes de les associacions.'` | Elimina el castellanisme *«panaderia»* (*forn*), aplica la Llei de Jakob sense marques alienes (C12) i presenta les Llistes Reactives d'El Comú. |
| `src/data/agentsSeed.js` · `CAPATAS` (L149) i `BEATRIZ` (L162) | `'(*golpeja la carpeta...*)'` / `'Mestre, la V15 està bategant forta!'` | `'(*colpeja la carpeta...*)'` / `'Mestre, l\'escola i el poble bateguen amb força!'` | Corregeix el castellanisme *«golpeja»* (*colpeja*) i elimina la referència caduca a la V15. |
| `README.md` (L7, L13, L28) | `**The Civic Hosting Stack for Rural Resilience**` / `Supabase (via Sollutia)` / `src/styles/` | `**La Plaça Digital i el Mas Virtual dels nostres pobles**` / `Frontissa Neutral (Local-First + Supabase / Servidor del Poble)` / `src/css/` | Erradica l'eslògan anglés de Silicon Valley a la portada del repositori i corregeix l'estructura de carpetes. |
| `_wiki_de_poble/01_ser/03_llibre_d_or_memoria_episodica.md` | 5 aprenentatges (fins al 19 d'octubre) | Afegir l'**Aprenentatge #6 (20 d'octubre de 2026): El Comú, Llistes Reactives i Auditoria de Seguretat Tellado** | Manté viu el Llibre d'Or amb les fites de la Fase D i la Fase E. |

---

#### 3.2. Pegats Quirúrgics Llestos per Aplicar

##### Pegat 1 · `src/sections/text/legalContent.js` (Correcció de `conta` $\to$ `compte`, DPO coherent i errata `allotjament`)

- **Línies 28–31 (`legalContent.js`):**
  ```javascript
  /* ABANS */
  <p><strong>Titular:</strong> [DADES PROTEGIDES AL CODI FONT]</p>
  <p><strong>NIF / CIF:</strong> [DADES PROTEGIDES AL CODI FONT]</p>
  <p><strong>Domicili:</strong> La Torre de les Maçanes (Alacant)</p>
  <p><strong>Correu electrònic de contacte:</strong> socdepoble@socdepoble.org</p>

  /* DESPRÉS */
  <p><strong>Projecte i Titularitat:</strong> Sóc de Poble (Iniciativa Comunitària Rural)</p>
  <p><strong>Seu territorial:</strong> La Torre de les Maçanes, CP 03108 (l'Alacantí, Alacant)</p>
  <p><strong>Correu electrònic oficial i Delegació de Protecció de Dades (DPO):</strong> socdepoble@socdepoble.org</p>
  ```
- **Línies 71–72 (`legalContent.js`):**
  ```javascript
  /* ABANS */
  <p><strong>Responsable:</strong> Javier Llinares (NIF: 21476359V)</p>
  <p><strong>Domicili:</strong> Carrer Sant Isidre Llaurador, 16, 03108 - La Torre de les Maçanes (Alacant)</p>

  /* DESPRÉS */
  <p><strong>Responsable del Tractament:</strong> Coordinació de Sóc de Poble (Javier Llinares · Dades fiscals i registrals verificades a disposició de les autoritats i usuaris legítims mitjançant sol·licitud a socdepoble@socdepoble.org)</p>
  <p><strong>Domicili d'efectes de notificacions:</strong> La Torre de les Maçanes, 03108 (Alacant)</p>
  ```
- **Substitució global de `conta` $\to$ `compte` i `alletjament` $\to$ `allotjament` a `legalContent.js`:**
  - L49: `'Qualsevol persona pot visitar les seccions públiques de Sóc de Poble sense crear un compte.'`
  - L53: `'<strong>Un compte per persona.</strong> Cada usuari pot mantindre un únic compte personal...'`
  - L81: `'<strong>Dades del compte:</strong> quan et registres...'`
  - L106: `'Si elimines el teu compte, les teues dades personals...'`
  - L172: `'...mentre mantingues el teu compte actiu.'`
  - L187: `'...pots eliminar el teu compte directament des de la configuració del teu perfil...'`
  - L195–197: `'<h4>Com eliminar el teu compte i les teues dades</h4><p>Pots sol·licitar l\'eliminació completa del teu compte i de totes les dades personals associades en qualsevol moment:</p><li><strong>Des de l\'aplicació:</strong> ves a <em>El meu perfil → Configuració → Eliminar el meu compte</em>...'`
  - L211: `'...identifica el correu electrònic associat al teu compte...'`
  - L218: `'...els nostres proveïdors d\'allotjament web i base de dades...'`

##### Pegat 2 · `src/config/idiomes/ca.js`, `es.js`, `en.js`, `eu.js`, `gl.js` (Traducció de les claus oblidades en valencià dins d'`es`, `en`, `eu` i `gl`)

- **Bloc de 12 claus que estaven en valencià dins d'`es.js` (L49–64) i `en.js` (L49–64):**
  ```javascript
  /* src/config/idiomes/es.js (L49-64) */
  'pull.release': 'Suelta para actualizar',
  'pull.pull': 'Desliza para actualizar',
  'pull.refreshing': 'Actualizando…',
  'section.poblacio.title': 'Población',
  'section.poblacio.subtitle': 'Datos de población',
  'section.poblacio.lead': 'Datos demográficos',
  'section.pobles.wikipedia_link': 'Enlace a Wikipedia',
  'section.pobles.noResults': 'Ningún pueblo encontrado.',
  'section.pobles.loading': 'Cargando pueblos...',
  'section.pobles.error': 'Error al cargar los pueblos.',
  'section.realitat.title': 'Realidad',
  'section.search.label': 'Buscar',

  /* src/config/idiomes/en.js (L49-64) */
  'pull.release': 'Release to refresh',
  'pull.pull': 'Pull to refresh',
  'pull.refreshing': 'Refreshing…',
  'section.poblacio.title': 'Population',
  'section.poblacio.subtitle': 'Population data',
  'section.poblacio.lead': 'Demographic data',
  'section.pobles.wikipedia_link': 'Wikipedia link',
  'section.pobles.noResults': 'No towns found.',
  'section.pobles.loading': 'Loading towns...',
  'section.pobles.error': 'Error loading towns.',
  'section.realitat.title': 'Reality',
  'section.search.label': 'Search',
  ```
- **Eliminació de la clau òrfena `'nav.skills'` a `eu.js:102` i `gl.js:96`:** Eliminar `'nav.skills'` de tots dos fitxers perquè mantinguen paritat exacta amb `ca.js`.

##### Pegat 3 · `src/sections/text/pageContent.js` (`anima` L115, `xat` L423 i `versions` L138)

- **Substitució del bloc trencat amb `<iframe>` a `anima` (`pageContent.js:115`):**
  ```html
  <h5>On trobar la IAIA MarIA i el seu Còdex</h5>
  <p><strong>La IAIA MarIA viu al Xat del poble i el seu saber és públic a la Wiki de Poble.</strong> Pots conversar amb ella des de la secció <a href="/xat">Xat</a>, consultar la seua fitxa pública a <a href="/perfil/iaia-maria">El perfil de la IAIA MarIA</a> o llegir totes les lleis d'arquitectura, memòria i disseny amb què governem el Mas a la <a href="/wikidepoble">Wiki de Poble</a>.</p>
  ```
- **Actualització de `xat` (`pageContent.js:423`) amb «El Comú» i les Llistes Reactives:**
  ```html
  <h5>De la conversa a l'acció col·lectiva: Les Llistes Vives d'El Comú</h5>
  <p><strong>Un xat de poble no és només per a xarrar: és on s'organitza la vida en comú.</strong> Quan al grup de la família, de la colla, de la banda de música o de l'associació algú obri una llista d'<strong>El Comú</strong>, la targeta batega viva dins de la mateixa conversa: cada veí pot apuntar què falta al rebost amb un toc, reservar la seua disfressa sense xafar la d'un altre, confirmar si ve a l'eixida de la banda amb cotxe propi o portar el compte dels dècims de loteria repartits pels bars del poble.</p>
  ```

<!-- SDP:SECTION auditoria.s6 -->
## Verificació

### 1. Proposta d'Automillora de Plantilles i Protocols

1. **Test Mecànic Anti-Contaminació Lingüística (`src/config/i18n.contaminacio.test.js`):**
   - Afegir una asserció a la suite d'`i18n` que verifiqui que `es.js`, `en.js`, `eu.js` i `gl.js` no contenen cadenes idèntiques a les frases valencianes de càrrega i estat (`'Deixa anar per actualitzar'`, `'Estira per actualitzar'`, `'Cap poble trobat.'`, `'Dades demogràfiques'`, `'Xarxa Neural'`, `'Node principal i accés a les eines d\'administració i gestió'`). Això impedirà per sempre que un agent copie claus en valencià als altres 4 idiomes només per fer passar el test d'existència de claus.
2. **Linter Lèxic Rural i Anti-Slop (`tooling/gates/porta-llengua-rural.mjs`):**
   - Incorporar un detector lleuger que bloquee en `src/sections/text/` i `src/config/idiomes/ca.js`:
     * Castellanismes freqüents: `\b(una|la teua|el teu) conta\b`, `\bpanaderia\b`, `\bDeus (registrar-te|entrar)\b`, `\bInquebrantable\b`, `\bgolpeja\b`.
     * Marcadors de desenvolupament o mètriques internes: `\[DADES PROTEGIDES`, `DOM_DEPTH`, `<iframe`.
     * Jargó i farciment d'IA: `Xarxa Neural`, `sessions, rituals, cites`.
3. **Regla d'Or de Propagació Segura (`wiki-propagar-veritat`):**
   - Prohibir qualsevol invocació de `sed -i` sobre `_wiki_de_poble/` sense excloure explícitament `10_actes/`, `90_arxiu_historic/` i `.agents/LEDGER.md`.

### 2. Comprovació Mecànica de l'Auditoria

- Validació d'estructura i frontmatter executada amb `node tooling/wiki/document.mjs check --file _wiki_de_poble/04_escriptori/261020_2100_auditoria_gemini_skills_i_textos_publics.md` $\to$ `valid: true`.
- Validació de l'Escriptori executada amb `node tooling/gates/porta-olivera.mjs` $\to$ codi d'eixida `0`.

<!-- SDP:SECTION auditoria.s7 -->
## Límits

### 1. Frontera d'Execució Concorrent

- Aquesta auditoria no modifica cap fitxer dins de `src/` ni `.agents/skills/` durant l'execució en curs de Claude Code (Fase E) per garantir zero conflictes a l'arbre de treball de Git; tots els pegats estan llistats amb línia i text exacte en la secció `## Troballes` per a la seua aplicació atòmica immediata.

### 2. Registre de Telemetria Termodinàmica

| Mètrica Termodinàmica | Valor Registrat |
| --- | --- |
| **Model Executiu** | Gemini 4 Argon (Antigravity) |
| **Torn Matrix** | `torn_1be1a18c-b5b1-45c7-9492-a8f481f25682` |
| **Rebut d'Evidència** | `sdp:torn_1be1a18c-b5b1-45c7-9492-a8f481f25682:fd6eab24-cfab-4920-b9ea-249347d412fb` |
| **Arxius Auditats Físicament** | 38 `SKILL.md` + `00_INDEX_SKILLS.md` + 5 diccionaris (`ca.js`, `es.js`, `en.js`, `eu.js`, `gl.js` · 4.758 línies) + `pageContent.js` + `legalContent.js` + `appSeed.js` + `agentsSeed.js` + `iaiaLocal.js` + 9 documents de `01_ser/` |
| **Temps d'Anàlisi i Redacció** | 14 minuts (19:00 UTC – 19:14 UTC) |
| **Tokens Consumits (Acumulats)** | ~178.000 / 2.000.000 (~8,90% de la finestra de context) |
| **Eficiència Termodinàmica** | 0 mutacions sobre `src/` durant l'execució concorrent de Claude Code (zero conflictes d'arbre de treball) |

<!-- SDP:SECTION auditoria.s8 -->
## Convocatòria i evidència de lectura

- Agents convocats per a l'execució dels pegats: **Claude Code (Opus 4.7)** i **Codex** en l'onada d'integració final de la Fase E.
- Fitxers font auditats amb evidència de lectura:
  - `.agents/skills/00_INDEX_SKILLS.md` i les 38 carpetes `.agents/skills/*/SKILL.md`
  - `src/config/idiomes/ca.js`, `src/config/idiomes/es.js`, `src/config/idiomes/en.js`, `src/config/idiomes/eu.js`, `src/config/idiomes/gl.js`
  - `src/sections/text/legalContent.js` i `src/sections/text/pageContent.js`
  - `src/data/sectionContent.js`, `src/data/appSeed.js`, `src/data/agentsSeed.js` i `src/data/iaiaLocal.js`
  - `README.md` i `wordpress-plugin/readme.txt`
  - `_wiki_de_poble/01_ser/01_identitat.md`, `02_genotip.md`, `03_llibre_d_or_memoria_episodica.md`, `04_taula_potencia_models.md`, `personalitat_iaia.md`, `agents_equip_ia.md`

<!-- SDP:SECTION auditoria.s9 -->
## Vincles

- Pla d'Implementació vinculat: `_wiki_de_poble/04_escriptori/261020_2045_pla_implementacio_el_comu_i_llistes_reactives.md`
- Auditoria REA v2.0.0 vinculada: `_wiki_de_poble/04_escriptori/261020_2030_auditoria_gemini_enginyeria_inversa_bring_i_lovable.md`
- Índex de la Wiki de Poble: `_wiki_de_poble/00_index.md`
