---
type: informe
status: esborrany
description: 'Segona passada, de només lectura i en solitari: SEO, accessibilitat i frontend (fora de la 0652), refutació de les seues troballes clau i estat de la Gàbia davant d''Ultracode.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_90b82d38-ac5b-4b48-ae53-805e11580166:2081a96f-4fbd-4bb9-a772-e801bc9097f5
---
# Auditoria de fortificacio II: SEO, a11y, frontend i refutacio de la 0652

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_90b82d38-ac5b-4b48-ae53-805e11580166:2081a96f-4fbd-4bb9-a772-e801bc9097f5 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T05:16:36.827Z |
| Modificació | 2026-09-24T05:16:36.827Z |
| Propietari | agent-local (Claude) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Ruta | `auditoria` |
| Torn | `torn_90b82d38-ac5b-4b48-ae53-805e11580166` · abast `documents` · obert 05:16:23Z |
| Tall d'evidència | HEAD `5eee1293`, arbre brut (el `git status` d'inici de sessió); lectures fetes des de l'arrencada (05:09:46Z) fins a la redacció |
| Petorreta origen | `260924_0630_prompt_fortificacio_opus.md` (segona execució) · pla `260924_0645_pla_implementacio_opus.md` |
| Informe germà | `260924_0652_auditoria_claude.md` (primera execució de la mateixa petorreta; este informe no el substituïx, el completa i el corregix) |
| Mode AFK | **sí · zero línies de codi tocades**; l'únic fitxer escrit és este |
| requires_human_decision | **true** (G2-01, G2-02, SEO-01, SEO-02, FE-01, A11Y-01 i tota la Gàbia) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`). S'ha invocat Ultracode (`/workflow-authoring`); el `Workflow` ha sigut denegat pel hook (G2-01) |
| Tokens consumits | Mesurats: l'entorn no me'ls exposa. Estimats: no n'invente cap xifra |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

He llegit sencera la plantilla que ha retornat `document.mjs context --route auditoria` abans de `create`, i n'aplique el contracte d'informe: fitxer, evidència reproduïble, severitat, font de veritat en conflicte, proposta conservadora i `requires_human_decision`. Abans d'auditar he llegit la petorreta, el Pla de MarIA i l'auditoria germana `260924_0652_auditoria_claude.md` sencera (875 línies). Ho mana el Protocol de l'Olivera, i evita repetir la feina que ja està feta.

**Dada, no disculpa.** La petorreta s'ha executat dues vegades. La primera (0652) no va poder usar subagents. Esta segona s'ha llançat amb Ultracode explícit i ha xocat amb la mateixa paret: `Workflow` denegat a la primera crida. Per tant, este informe torna a ser d'un sol agent. Per això no repetix l'escombrada de govern de la 0652. Fa tres coses que la 0652 no va fer:

1. l'eix **SEO, a11y i frontend** que demana la Instrucció del torn;
2. una **refutació dirigida** de les seues troballes clau (la 0652 declarava «cap troballa ha passat per refutació creuada»);
3. una **correcció de seguretat** a la seua proposta F1.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **v1.0.0 (260924_0716):** primera entrega. Quatre blocs: Gàbia (estat davant d'Ultracode i correcció d'F1), refutació de la 0652, SEO, i a11y amb frontend. Ubicació de les troballes noves al mapa 8×8 de la 0652 i proposta de millora de `prompt_local.md`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum executiu

1. **Ultracode continua sense poder arrancar, i la causa és la mateixa.** El `PreToolUse` sense `matcher` denega el `Workflow` (`hooks-local.mjs:85`). A més, en este client no hi ha `Grep` ni `Glob`: la cerca es fa amb la shell, i la Gàbia només admet dotze ordres exactes. **Un agent ací no pot cercar res.** Obrir el `Workflow` sense obrir la lectura donaria subagents cecs (G2-01).
2. **La proposta F1 de la 0652 obriria una shell lliure. No s'ha d'aplicar tal qual.** Un `matcher` que només nomene `Bash|Write|Edit|MultiEdit|NotebookEdit` deixa fora del hook totes les eines MCP. Entre elles hi ha `mcp__terminal__run_in_terminal` (ordres a la terminal del Mestre), l'automatització del navegador i els publicadors externs. Hui el hook sense `matcher` les bloqueja; amb F1 passarien lliures. Propose F1′: una llista blanca d'orquestració dins de `hooks-local.mjs` (G2-02).
3. **L'aplicació publica dos mapes del lloc que es contradiuen, i cap dels dos té productor viu.** `public/sitemap.xml` inclou `/registre`, que la mateixa app marca `noindex`. El seu generador viu a la zona humana i, des d'allà, escriu en una ruta equivocada. El manifest SEO bo (`seo-routes.json`) el generem, però el seu consumidor PHP no és al repositori (SEO-01, SEO-02).
4. **La Wiki pública és invisible per a qualsevol cercador, document a document.** No crida `useSEO`: cada document ix amb el títol «Sóc de Poble» i el canònic `/wikidepoble`. A més, cada enllaç intern porta `nofollow`. Els documents sense data en mostren la d'avui (SEO-03, SEO-04, A11Y-05).
5. **Qualsevol URL del domini pot pintar un missatge d'error dictat per un tercer.** Passa per exemple amb `https://socdepoble.org/mur?error_description=…`. `gestionaTornada()` s'executa a cada càrrega, interpreta `error` i `code` encara que no hi haja cap entrada en curs, i l'app en mostra el text dins d'un toast d'error. Per a un públic de 55 a 80 anys (`tractor-cromatic.mjs:27`) és un vector de pesca (FE-01).
6. **L'ADR vigent promet «WCAG 2.2 AA amb comprovació automàtica i manual abans de publicar».** Cap eina del repositori audita el DOM renderit. `porta:cromatic` verifica tokens, no rols, noms accessibles ni l'ordre de capçaleres. Els defectes d'A11Y-01 a A11Y-06 són justament del tipus que només es veuen al DOM.
7. **Refutació de la 0652:** he tornat a verificar 17 troballes. En confirme 16 i en corregisc una, F1 (vegeu la taula R). No en refute cap altra.

---

### G2 · La Gàbia davant d'Ultracode

#### G2-01 · P0 · Sense `Workflow` ni cerca no hi ha multiagent possible, i totes dues coses depenen del Mestre

- **Evidència reproduïble (esta sessió):**
  - `Workflow` (sonda d'un sol agent de lectura) → `[HOOKS-LOCAL] BLOQUEIG · Eina opaca o shell no confinada`. El codi és `tooling/gates/hooks-local.mjs:85`: tota eina que no siga lectura coneguda ni escriptura coneguda cau ací.
  - `ls …`, `cd … && …` → mateix bloqueig. `tooling/gates/mutation-policy.mjs:43-68` només admet `pwd`, cinc ordres `git` exactes, set ordres `node` exactes i els `npm run porta:*` que hi apunten.
  - `node tooling/gates/segella.mjs` → `❌ Ruptura de segell … 455a0fad ≠ 88f0ec03`. És la G-01 de la 0652, sense canvis.
  - Totes les crides d'esta sessió, lectures incloses, han rebut `PostToolUse … hook blocking error` de `segell-auto.mjs` (la G-06 de la 0652).
- **Dada nova respecte de la 0652:** el client d'escriptori no porta `Grep` ni `Glob`. El seu propi mode de treball preveu cercar amb `grep`/`find` per la shell, i la Gàbia la tanca. Encara que el `Workflow` s'obrira, cada subagent només podria fer `Read` de rutes que ja coneguera. Jo he hagut de reconstruir l'arbre de `src/` des del fitxer d'inventari d'un torn (`.agents/runtime/turns/*.json`). **F4 (lectura per argv) no és una millora: és el requisit perquè un Ultracode servisca per a alguna cosa.**
- **Font de veritat en conflicte:** `PROTOCOL_PETORRETA.md` P-01 («la lectura, cerca… són lliures») i la mateixa petorreta, que demana «tots els teus agents interns».
- **Proposta:** l'ordre de la secció «Camí més curt» d'ací avall. `requires_human_decision: true`: tot toca `.claude/`, `.agents/` o `tooling/`.

#### G2-02 · P0 · Correcció a la 0652: el `matcher` d'F1 obri una shell sense hook

- **Què proposava la 0652 (F1):** posar `"matcher": "Bash|Write|Edit|MultiEdit|NotebookEdit"` a l'entrada de `hooks-local.mjs` a `.claude/settings.json`.
- **Per què és perillós:** un `matcher` decidix a quines eines s'aplica el hook. Tot el que no nomena queda **fora del hook del tot**. En esta sessió hi ha, com a mínim:
  - `mcp__terminal__run_in_terminal`: executa ordres a la terminal del Mestre. És una shell completa sense cap filtre;
  - `mcp__Claude_Browser__javascript_tool` i les eines `mcp__claude-in-chrome__*`: executen JavaScript i accions en navegadors;
  - `mcp__Affinity__execute_script`: executa scripts en una aplicació de l'equip;
  - l'eina `Artifact` i el connector de documents: publiquen contingut fora de la màquina;
  - `mcp__scheduled-tasks__*`, `CronCreate` i `RemoteTrigger`: programen execucions futures.
  Hui el hook sense `matcher` els denega tots. Amb F1, tots passarien. I `mcp__terminal__run_in_terminal`, per si sol, anul·la tota la política de shell de `mutation-policy.mjs`.
- **Proposta F1′ (substituïx F1):** mantindre el hook sobre totes les eines i afegir a `hooks-local.mjs` una llista blanca **d'orquestració**, és a dir, d'eines que no escriuen res per si soles. Les crides que facen després els subagents tornen a passar pel mateix hook, segons el funcionament documentat del client. Cal verificar-ho amb la sonda de la secció Verificació. Just abans de la línia 80 (`if (knownRead(payload, root))`):

```js
    // Orquestració: no escriu res per si sola; cada crida dels subagents torna a passar per ací.
    if (['Agent', 'Workflow', 'Skill', 'AskUserQuestion', 'TaskStop'].includes(name)) return {code: 0, errors: []};
```

  - Les MCP continuen denegades per defecte. Si en cal una de lectura (per exemple `mcp__ccd_session_mgmt__search_session_transcripts` per a buscar els «64»), s'afig amb nom propi.
  - **Probablement cal obrir una sessió nova després del canvi.** El client llig els hooks en arrencar, i no ho he pogut comprovar des d'ací.
  - `requires_human_decision: true`.

#### G2-03 · P1 · El pas intermedi que falta: F4 mínima, sense pipes

Tot i F1′, sense cerca un Ultracode només llig allò que ja coneix. Propose una F4 mínima, a `mutation-policy.mjs`, que només admeta ordres sense operadors de shell (el `knownRead` actual ja rebutja `&|;<>$\``):

- `ls` i `ls -la` sobre una ruta de dins del repositori;
- `git ls-files`, `git show <rev>:<ruta>` i `git log --oneline -- <ruta>`, sense `--output`;
- `grep -rn <patró> <ruta>` sense `-exec`.

Totes necessiten proves adversarials, començant per la R1 de Codex (`git diff --output`). `requires_human_decision: true`.

#### Camí més curt per a una tercera passada amb Ultracode

1. **Mestre:** reconciliar el segell (runbook G-01 de la 0652).
2. **Mestre:** F1′ (G2-02). **No** F1.
3. **Mestre:** F4 mínima (G2-03).
4. Sessió nova i la mateixa petorreta. El `Workflow` faria tres fases:
   1. cerca dels «64» a les transcripcions;
   2. refutació adversarial de la 0652 i d'esta 0716, amb tres jutges per troballa;
   3. escombrada a11y i SEO de les 20 seccions de `src/sections/`, de 9 en 9.

---

### R · Refutació dirigida de la 0652

He triat les troballes que fonamenten decisions (P0/P1) o que es podien verificar amb les eines permeses. «Confirmat» vol dir que he llegit el codi o executat l'ordre en esta sessió.

| Troballa 0652 | Veredicte | Evidència d'esta sessió |
| --- | --- | --- |
| G-01 segell trencat | **confirmat** | `node tooling/gates/segella.mjs` → `455a0fad ≠ 88f0ec03` |
| G-02 `PreToolUse` sense `matcher` | **confirmat** | `.claude/settings.json:32-42`; `Workflow` denegat |
| G-03 shell de lectura tancada | **confirmat** | `mutation-policy.mjs:43-68`; `ls` denegat |
| G-05 governança només amb lease | **confirmat** | `mutation-policy.mjs:6,15` |
| G-06 `segell-auto` crida en cada eina | **confirmat** | l'avís ha aparegut en totes les crides d'esta sessió |
| G-09 recepta equivocada | **confirmat** | `hooks-local.mjs:14,111`: el missatge de `document.mjs` s'afig a qualsevol denegació |
| **F1 `matcher`** | **corregit** | vegeu G2-02: deixa fora del hook una shell (`mcp__terminal__run_in_terminal`) |
| C-01 tres capçaleres | **confirmat** | `AGENTS.md` §15 («únic original») contra l'última línia de `QUI_SOC.md` («reemplaça i fusiona…») |
| C-02 punter de l'Acte Reflex | **confirmat** | `AGENTS.md` §13 enllaça «Acte Reflex» a `sdp-workflow`; la §2 de `sdp-workflow` s'autoreferencia |
| C-08 cognom del pla | **confirmat** | `…_prompt_fortificacio_opus.md` contra `…_pla_implementacio_opus.md` |
| C-12 `npm run porta` | **confirmat** | `package.json:61` |
| S-01 cens de `.claude/skills` | **confirmat** | la llista de skills que el client m'exposa en té 16. Hi falten `core-automillora`, `core-edicio-segura`, `core-estrategia-ia`, `core-higiene-escriptori` i `core-taxonomia-estricta` |
| S-02 `--output` a `wiki-cicle-de-vida` | **confirmat** | `tooling/documental/command-policy.mjs:71` només admet `actor` i `scope` |
| P-01 versions de plantilla | **confirmat** | `protocolledge.json:70` diu `2.2.0`; la petorreta declara `2.3.0` |
| P-02 `auditoria_canonica` | **confirmat** | la plantilla retornada hui és `type: document` i conté `BROKEN LINK: skills <!-- TODO: fix link -->` |
| W-01 plans directors publicats | **confirmat** | `02_saber/pla_director_viabilitat_economica.md` té `status: canonic` i cap `visibility`. `publication-policy.mjs:18` publica per defecte el que no porta `visibility`. Vegeu SEO-05 per l'abast real |
| D-06 i S-08 al mateix ADR | **confirmat** | `ADR-2026-08-ONLINE-FIRST.md:18-20` («la pila Online-First afegeix Dexie…») i `:8` (`\n# ADR…` literal) |

**No reverificades:** G-07, G-08, G-10, C-03 a C-07, C-09 a C-11, D-01 a D-05, S-03 a S-10, P-03 a P-06, W-02 a W-06 i el bloc H. No les done per bones ni per dolentes.

---

### SEO · Tots els pisos

#### SEO-01 · P1 · El `sitemap.xml` publicat anuncia una URL `noindex` i una redirecció, i ningú el regenera

- **Fitxers:** `public/sitemap.xml`, `_wiki_de_poble/04_escriptori/01_produccio/generador_sitemap.mjs` (zona humana: només l'he llegit).
- **Evidència:**
  - El sitemap té 7 URL. Entre elles hi ha `https://socdepoble.org/registre`, que tant `useSEO.js:6-8` com `publication-policy.mjs:80-81` classifiquen com a privada: el client hi posa `noindex, nofollow` (`seoHead.js:48`). També hi ha l'arrel `/`, que l'app redirigix (`App.jsx:563`).
  - Falten totes les rutes que el manifest bo marca com a indexables: `wikidepoble`, `multimedia`, `projecte`, `constitucio`, `roadmap`, `poblacio` i les pàgines de detall de `pobles/*`, `mercat/*` i `events/*`.
  - El generador calcula l'arrel com `__dirname/../../` (`generador_sitemap.mjs:7`). Des de `04_escriptori/01_produccio/` això dona `_wiki_de_poble/`, i el fitxer aniria a `_wiki_de_poble/public/sitemap.xml`. Si s'executa des d'on és, no toca el sitemap publicat. És un script mogut de lloc sense ajustar-li la ruta.
- **Font de veritat en conflicte:** `tooling/gates/build-seo-manifest.mjs`, que diu ser «el productor» de les rutes SEO, i el protocol de Google: una URL `noindex` dins del sitemap és un error que marca Search Console.
- **Proposta conservadora:** fer que `build:seo` escriga també `public/sitemap.xml` a partir de `seo-routes.json` (una sola font) i retirar el generador de la zona humana, o que el Mestre el marque com a històric. `requires_human_decision: true`: la zona humana és seua.

#### SEO-02 · P1 · El manifest SEO bo no té consumidor al repositori

- **Fitxer:** `tooling/gates/build-seo-manifest.mjs:5-8,97-102`.
- **Evidència:**
  - La capçalera diu que `seo-routes.json` el consumixen `sdp-seo.php:21` i `:360`, i que sense ell `sdp_resolve_request()` torna 404.
  - `wordpress-plugin/inc/sdp-seo.php` **no existix** en esta còpia (el `Read` retorna «File does not exist»). Per això els sinònims del PHP ixen buits: `"aliases": {}` al `seo-routes.json` actual. Tot el mapa `ALIES_CANONIC` (`:106-116`) és codi mort.
  - Sense un servidor que òmpliga les metadades per ruta, qualsevol robot que no execute JavaScript veu el mateix `<title>` i els mateixos `og:*` d'`index.html` a totes les URL. Són els previsualitzadors de WhatsApp, Telegram, Facebook i X, que és com es compartix de veritat en un poble.
- **Font de veritat en conflicte:** `AGENTS.md` §8. Si l'amfitrió SPA és Sollutia, qui servix les metadades per ruta s'ha d'acordar amb Sollutia, i el contracte no ho diu enlloc.
- **Proposta:** decidir qui fa el SSR mínim de `<head>` (Sollutia, un plugin o un prerenderitzat estàtic de les rutes indexables en `build`). Mentrestant, documentar que el manifest no té consumidor. `requires_human_decision: true`.

#### SEO-03 · P1 · La Wiki integrada no té SEO per document

- **Fitxers:** `src/sections/wiki-de-poble/WikiDePobleSection.jsx` (no importa `useSEO`), `src/hooks/RouteSEO.jsx:4-9`, `src/hooks/useSEO.js:27`.
- **Evidència:**
  - `RouteSEO` no té títol per a `wikidepoble`, així que cada document ix amb el títol pelat «Sóc de Poble».
  - El canònic es calcula amb `pathname` i sense `search`. Com que cada document és `/wikidepoble?item=<id>`, **tots** declaren el canònic `/wikidepoble` i els cercadors els fusionen en una sola pàgina.
  - En canvi, `seo-routes.json` marca `wikidepoble` com a `index: true` amb el títol «Wiki de Poble», i no coincidix amb el client.
- **Font de veritat en conflicte:** la missió («Preservar l'Herència», `QUI_SOC.md` §1). La Wiki és el coneixement públic del projecte, i ara mateix cap cercador el pot trobar document a document.
- **Proposta:**
  - que `WikiDetail` cride `useSEO({ title: item.title, description: item.subtitle, canonical: <url amb ?item> })`;
  - o bé passar els documents a ruta pròpia (`/wikidepoble/<id>`).
  Qualsevol de les dos només s'ha de fer **després** de resoldre W-01, o publicarem millor el que no s'havia de publicar.

#### SEO-04 · P2 · `nofollow` a tots els enllaços, també als interns

- **Fitxer:** `src/utils/sanitize.js:53-54`.
- **Evidència:**
  - El ganxo posa `rel="noopener noreferrer nofollow"` a tot `<a href>`, inclosos els `?item=` que genera `compile-wiki-to-app.mjs:66`.
  - Les línies `:55-57` són una branca morta: si `target` és `_blank`, hi tornen a posar `_blank`.
- **Proposta:** posar `nofollow` només als orígens externs i llevar la branca morta. Canvi de 3 línies amb prova a `sanitize.test.js`.

#### SEO-05 · P1 · W-01 és més greu del que diu la 0652: el text viatja dins del paquet JavaScript

- **Evidència:**
  - `WikiDePobleSection.jsx:4` importa `wikiManifest.js`. El manifest és un fitxer estàtic que el navegador descarrega sencer quan algú obri `/wikidepoble`.
  - Això inclou el cos complet dels dos plans directors, i també el de la resta de documents amb `status` publicable.
  - El canònic fusionat (SEO-03) fa que Google no els indexe un a un, però els pot llegir qualsevol que òbriga les eines de desenvolupador. «No indexat» no vol dir «privat».
- **Font de veritat en conflicte:** `llei_05_privacitat` i `AGENTS.md` §5 (no exposar secrets).
- **Proposta:** la mateixa de la 0652 (`visibility: private` i regenerar), i afegir-hi una porta que falle si un document amb `tags: [legal]` no declara `visibility`. `requires_human_decision: true`.

#### SEO-06 · P2 · Dades de prova publicades com a productes, i SVG com a imatge social

- **Fitxer:** `wordpress-plugin/dist/seo-routes.json:257-273`.
- **Evidència:**
  - `mercat/mac-mini-m4` («Mac Mini en perfecte estat. Comprat al març de 2025…») i `mercat/samarreta-socdepoble` són llavors del seed, marcades `index: true` i `type: Product`, sense preu ni disponibilitat.
  - Tots dos porten `image: …/logo-socdepoble-cuadrat-verd.svg`. El mateix script adverteix que «les xarxes socials no pinten SVG a og:image» (`build-seo-manifest.mjs:174`), però només aplica la imatge per defecte quan el seed no en porta cap (`:221`).
- **Proposta:** excloure del manifest els seeds que no siguen contingut real (un camp `publicable: true` a la llavor) i refusar qualsevol `image` `.svg`. P2 perquè hui el manifest no té consumidor (SEO-02).

#### SEO-07 · P3 · `lastmod` sempre és el dia del build

- **Fitxer:** `build-seo-manifest.mjs:34,190,210,223`.
- **Evidència:** totes les rutes porten `lastmod: AVUI`. Un `lastmod` que canvia cada dia sense que canvie el contingut ensenya els cercadors a ignorar-lo.
- **Proposta:** usar la data de l'últim commit del fitxer font, o no emetre'l.

#### SEO-08 · P3 · Dos llistes de rutes privades que ja divergixen

- **Fitxers:** `src/hooks/useSEO.js:6-8` (client) i `tooling/wiki/lib/publication-policy.mjs:80-81` (build).
- **Evidència:** `control-xat`, `accedir`, `crear-compte`, `el-meu-perfil`, `admin`, `consola` i `utilitats` només són a la primera. És el patró de «cens cablejat en N llocs» que la memòria ja té documentat per a les skills.
- **Proposta:** una sola llista a `src/config/` que importen tots dos.

---

### A11Y · Accessibilitat

Context normatiu:

- `ADR-2026-08:30` fixa com a objectiu «WCAG 2.2 AA, amb comprovació automàtica i manual abans de publicar».
- `tractor-cromatic.mjs:26-28` exigix AAA (7:1) per al text de cos, perquè «l'usuari objectiu té 55–80 anys i llig a sol de migdia».

#### A11Y-01 · P1 · La promesa de comprovació automàtica WCAG no té cap eina

- **Evidència:**
  - A `package.json` no hi ha cap auditor del DOM (axe, pa11y, Playwright o Lighthouse).
  - `porta:cromatic` calcula el contrast de **tokens** (`tractor-cromatic.mjs:20-36`). No mira rols, noms accessibles, `aria-current`, l'ordre de capçaleres ni el focus. Les troballes d'A11Y-02 a A11Y-06 són d'eixa mena i cap porta les veuria.
- **Font de veritat en conflicte:** `ADR-2026-08`, «Decisió».
- **Proposta:** `axe-core` com a dependència de desenvolupament, amb una prova Vitest+jsdom per secció. Fa falta `npm install`, i `QUI_SOC.md` §5 exigix l'aprovació del Mestre. `requires_human_decision: true`.

#### A11Y-02 · P2 · La navegació principal no diu quina és la pàgina actual

- **Fitxers:** `src/app/contexts/RouterContext.jsx:160-174` (`NavLink`) i `src/components/layout/AppGridColumn.jsx:88`.
- **Evidència:**
  - `NavLink` només afig la classe `active`; mai no posa `aria-current="page"`. Un lector de pantalla no sap en quina secció està.
  - Al revés, `AppGridColumn.jsx:88` posa `aria-current="page"` **fix** a un botó de plegar, que no és cap pàgina. És la troballa de la memòria «capçalera fantasma», i continua viva al codi.
- **Proposta:** `aria-current={isActive ? 'page' : undefined}` a `NavLink`, i llevar-lo de `AppGridColumn`. Són dues línies. Cal revisar la CSS que se'n penja, per la Llei del Píxel.

#### A11Y-03 · P2 · Etiquetes de 10,4 px i text amb opacitat per a un públic de 55 a 80 anys

- **Fitxer:** `src/css/layout.css`.
- **Evidència:**
  - `.mobile-nav .nav-item__text` baixa a `0.65rem` (10,4 px) a ≤480 px (`:475`) i a `0.7rem` a ≤1100 px (`:409`).
  - `.mobile-nav .nav-item` té `opacity: 0.78` (`:394`), i les icones de la barra negra, `opacity: 0.8` (`:170`). L'opacitat rebaixa el contrast efectiu que `porta:cromatic` certifica sobre el token pur.
- **Font de veritat en conflicte:** `tractor-cromatic.mjs` C3 (AAA per al públic objectiu) i `sdp-pedra-seca` (Llei de Vida).
- **Proposta:** mesurar el contrast efectiu en el navegador. Si baixa de l'objectiu, llevar l'opacitat i pujar la mida. És un canvi visual: cal ordre del Mestre. `requires_human_decision: true`.

#### A11Y-04 · P2 · La Wiki salta de l'`h1` a l'`h4`

- **Fitxer:** `WikiDePobleSection.jsx:116`.
- **Evidència:**
  - Després de l'`h1` de la `UniversalPage` ve «Quadre de Comandament ISO» en `<h4>`.
  - Tot seguit, el Markdown comença en `h2` (`parseMarkdown.js:49-53`). L'ordre queda h1 → h4 → h2.
- **Proposta:** `<h2 className="h4">`. Semàntica correcta i el mateix aspecte (Llei del Píxel).

#### A11Y-05 · P2 · Dates inventades a la Wiki

- **Fitxer:** `WikiDePobleSection.jsx:84`, i també `:36`, `:235`, `:245` i `:255`.
- **Evidència:** `item.attributes?.date || new Date().toISOString()`. Un document sense data mostra la data i l'hora del moment de la visita, i les passa a `dateTime`.
- **Font de veritat en conflicte:** «Zero Mentides Belles» (`QUI_SOC.md` §2). Un lector (humà o màquina) llig com a data de publicació una cosa que no ho és.
- **Proposta:** si no hi ha data, no pintar-ne cap.

#### A11Y-06 · P3 · Detalls menors, amb evidència

- `App.jsx:89` posa `aria-label="Seccions"` a un `div` sense rol. ARIA prohibix donar nom a un element genèric, i el lector l'ignora. Proposta: `role="group"` o llevar-lo.
- `App.jsx:311`: `touchmove` amb `passive: false`, però el gestor no crida mai `preventDefault()`. Obliga el navegador a esperar el JS en cada desplaçament tàctil, cosa que es nota en els iPad vells del públic objectiu. Proposta: `passive: true`.
- `App.jsx:540-542` mostra `error.message` en brut a l'usuari dins d'un `<pre>`.
- `ProfileSection.jsx:22` pinta `avatar_url` sense `isSafeAsset`, quan `App.jsx:425` sí que el filtra. Amb `img-src https:` (CSP), qualsevol URL fa de píxel de seguiment.
- `src/css/base.css:10-19` posa `overflow: hidden` a `html` i `body`, i les barres tenen alçades fixes. **Hipòtesi no verificada:** amb el zoom de text al 200 % (WCAG 1.4.4) o a 320 px d'ample (1.4.10), el contingut de les barres es podria tallar. Cal provar-ho al navegador.

---

### FE · Frontend i seguretat de client

#### FE-01 · P2 · Injecció de text al domini a través de `?error=` i `?code=`

- **Cadena verificada:**
  1. `App.jsx:188` crida `recullTornadaOAuth(externalConfig)` en muntar-se, a qualsevol ruta.
  2. `backendPort.js:91-97` → `supabase/auth.js:184-186` → `oauthRelay.js:304`.
  3. `oauthRelay.js:313-315` llig `code`, `error` o `error_description` de la query **o** del fragment, sense mirar primer si hi ha cap entrada en curs.
  4. Si hi ha error: `throw new Error(error)` (`:356-358`).
  5. `App.jsx:190` → `showToast(e.message, 'error')`.
- **Efecte:** una URL com `…/mur?error_description=El+teu+compte+està+bloquejat.+Telefona+al+…` pinta eixe text com un avís d'error oficial de la plataforma. React escapa l'HTML, i per això no és XSS sinó suplantació de contingut. A més, un enllaç legítim amb un paràmetre `code` (un codi promocional, per exemple) fa saltar «Estat OAuth no vàlid… Possible atac CSRF» davant d'un usuari que no ha fet res.
- **Font de veritat en conflicte:** el mateix disseny del relé. Ja fa servir els paràmetres propis `sdp_code` i `sdp_oauth_error`; els genèrics `code` i `error` són una herència del flux implícit.
- **Proposta conservadora:**
  - no interpretar res si no hi ha verificador pendent (`getEfimer(CLAU_VERIFICADOR)`);
  - acceptar només `sdp_code` i `sdp_oauth_error`, llevat que el relé real necessite els genèrics;
  - mostrar un missatge fix i traduït en lloc del text del paràmetre.
  Cal verificar amb el relé de producció quins paràmetres torna de veres. `requires_human_decision: true`: toca l'autenticació.

#### FE-02 · P2 · Fonts de Google en un projecte de sobirania

- **Fitxer:** `index.html:10-12` (i la CSP de `:8`, que obri `style-src` i `font-src` a tot `https:` per a fer-ho possible).
- **Evidència:** cada visita envia la IP del visitant a Google per a descarregar Noto Sans.
- **Font de veritat en conflicte:**
  - `QUI_SOC.md` §1 («Sobirania», «Poble Abans que Corporació») i `llei_05_privacitat`;
  - a la UE hi ha jurisprudència que tracta eixa transferència d'IP com a dada personal sense base legal. És context, no una opinió jurídica meua.
- **Proposta:** servir Noto Sans des de `public/` (llicència OFL) i tancar `style-src` i `font-src` a `'self'`. El resultat és visualment idèntic.

#### FE-03 · P3 · La CSP de producció permet `localhost`

- **Fitxer:** `index.html:8`: `connect-src … ws://localhost:* http://localhost:*`, i també `frame-src https:`.
- **Evidència:**
  - Qualsevol script injectat podria sondejar serveis locals del visitant.
  - `frame-ancestors` no es pot declarar en un `<meta>`. Només el servidor de desenvolupament l'envia com a capçalera (`vite.config.js:42`). En producció, la protecció contra el *clickjacking* depén de l'amfitrió, i el repositori no ho documenta.
- **Proposta:** CSP diferent per a `dev` i `build` (un plugin de Vite que la transforme), i documentar amb Sollutia la capçalera `frame-ancestors`.

#### FE-04 · P3 · La consola «només superadmin» es pot obrir sense entrar

- **Fitxers:** `App.jsx:567` (`/consola` amb `RequireAuth rol="superadmin"`) contra `WikiDePobleSection.jsx:72-82`, que pinta `ConsolaPanells` a `/wikidepoble?item=consola_termodinamica` sense cap guarda.
- **Refutació pròpia del risc més greu:** he comprovat que la font de dades, `tooling/vite/consola-iaia.mjs:95`, només respon a `127.0.0.1` i `::1`, i que només existix amb el servidor de desenvolupament (`apply: 'serve'`). **No hi ha fuga de dades a la xarxa local.** El que queda és una incoherència de guardes i un defecte d'experiència. En producció, un amfitrió que torne `index.html` (codi 200) per a `/__iaia/consola.json` fa que `consolaContent.js:9` no el reconega com a absent, i la Wiki pública mostra un error de JSON en brut.
- **Proposta:** llevar l'entrada «Consola Termodinàmica» del model de la Wiki fora de `import.meta.env.DEV`, i tractar qualsevol resposta que no siga `application/json` com a absent.

#### FE-05 · P3 · L'índex de l'Escriptori té àncores a documents esborrats

- **Fitxer:** `_wiki_de_poble/04_escriptori/00_index_escriptori.md:41-44`.
- **Evidència:**
  - Hi ha quatre àncores a documents de Fable que `git status` dona com a esborrats (`D`); ara són a `90_arxiu_historic/260924_Auditoria_Fable/`, sense seguiment de Git.
  - La petorreta `0630` i el pla `0645` no hi estan ancorats. És el mateix patró d'«arxivat a mà» que l'índex ja reconeix a la línia 74.
- **Proposta:** `porta-olivera.mjs --arxiva` per als quatre, quan la Gàbia ho permeta (G-05 de la 0652).

---

### Ubicació al mapa 8×8 (Tasca 3)

La 0652 va marcar com a buides (⬜) dos àrees on ara hi ha evidència:

- **6.6 Wiki integrada i publicació:** SEO-03, SEO-05 i FE-04. Proposta de titular: un document de la Wiki que explique la frontera de `publication-policy.mjs`. Hui només ho sap el codi.
- **6.7 SEO:** SEO-01 a SEO-08. El titular actual, `a11y_seo_trellat`, no parla de sitemap, de manifest ni de canònics.
- **5.7 Accessibilitat:** A11Y-01 a A11Y-06. El titular és el mateix `a11y_seo_trellat`. Propose dividir-lo en dos documents (5.7 i 6.7), perquè un sol document no pot ser el titular de dos dominis.
- **7.1 La Gàbia:** G2-01 a G2-03. Continua sense document de Wiki. El diagnòstic de les quatre classes d'acció (0652) i F1′ (0716) en serien el nucli.

**Els «64»:** continuen sense aparéixer. Hui la cerca de transcripcions també està denegada, pel mateix `hooks-local.mjs:85`. Després de F1′ n'hi ha prou amb afegir `mcp__ccd_session_mgmt__search_session_transcripts` a la llista blanca per a buscar-los. El Mestre també els pot buscar ja mateix amb el cercador de sessions de l'app. Mentrestant, el mapa 8×8 de la 0652 continua sent una reconstrucció declarada, no una recuperació.

### Proposta de millora de `prompt_local.md` (Protocol §4)

Vénen a sumar-se als cinc punts de la secció J de la 0652:

1. **Preflight de capacitat a la §0.** Si la petorreta demana Ultracode, una casella «sonda `Workflow` verda en esta màquina». La mateixa petorreta s'ha enviat dues vegades i ha xocat dues vegades amb la mateixa paret.
2. **Declarar les execucions anteriors.** Si ja hi ha una auditoria de la mateixa petorreta a l'Escriptori, la petorreta l'ha de nomenar i dir què s'espera de la segona passada: repetir, refutar o completar. Sense això, la segona passada ha de reconstruir-ho sola.
3. **Separar «destripar» de «reparar».** La Tasca 2 demana auto-reparació i el Protocol diu «cap línia de codi». Les dos execucions han triat el Protocol. Val més dir-ho a la plantilla que fer-ho endevinar.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Ordres executades en esta sessió:**

| Ordre o eina | Resultat |
| --- | --- |
| `Workflow` (sonda d'un agent de lectura) | ❌ `[HOOKS-LOCAL] BLOQUEIG · Eina opaca o shell no confinada` |
| `ls …` via `Bash` | ❌ mateix bloqueig |
| `git log --oneline` | ✅ HEAD `5eee1293` |
| `node tooling/gates/segella.mjs` | ❌ `455a0fad ≠ 88f0ec03` |
| `node tooling/gates/obrir_torn.mjs --actor claude-opus-ultracode --scope documents` | ✅ `torn_90b82d38…` |
| `node tooling/wiki/document.mjs context … --route auditoria …` | ✅ plantilla i rebut |
| `node tooling/wiki/document.mjs create …` | ✅ esborrany amb rebut |
| `node tooling/wiki/document.mjs check --file …` | ✅ `valid: true`, cap error |

**Lectures (totes amb `Read`, senceres llevat que s'indique):**

- Configuració i Gàbia: `.claude/settings.json`, `tooling/gates/hooks-local.mjs`, `tooling/gates/mutation-policy.mjs`, `tooling/documental/command-policy.mjs`, `.agents/protocolledge.json` i `package.json`.
- Entrada, router i SEO: `index.html`, `vite.config.js`, `src/main.jsx`, `src/host.js`, `src/app/App.jsx`, `src/app/contexts/RouterContext.jsx`, `src/app/guards/RequireAuth.jsx`, `src/hooks/seoHead.js`, `src/hooks/useSEO.js`, `src/hooks/RouteSEO.jsx` i `src/pages/NotFoundPage.jsx`.
- Wiki, consola i perfil: `src/sections/wiki-de-poble/WikiDePobleSection.jsx`, `src/sections/wiki-de-poble/parseMarkdown.js`, `src/sections/consola/ConsolaSection.jsx`, `src/sections/consola/consolaContent.js`, `tooling/vite/consola-iaia.mjs`, `src/sections/profile/ProfileSection.jsx`, `src/components/universal/UniversalPage.jsx` i `src/components/layout/AppGridColumn.jsx`.
- Sanejament i autenticació: `src/components/PedraSeca/organismes/Dialeg.jsx`, `src/utils/sanitize.js`, `src/data/oauthRelay.js`, `src/data/backendPort.js` i `src/data/supabase/auth.js`.
- CSS: `src/css/base.css` i `src/css/layout.css`.
- Publicació i sitemap: `tooling/wiki/compile-wiki-to-app.mjs`, `tooling/wiki/lib/publication-policy.mjs`, `tooling/gates/build-seo-manifest.mjs`, `wordpress-plugin/dist/seo-routes.json`, `public/robots.txt`, `public/sitemap.xml` i `01_produccio/generador_sitemap.mjs` (només lectura).
- Portes i Wiki: `tooling/gates/tractor-cromatic.mjs` (capçalera), `02_saber/pla_director_viabilitat_economica.md` (frontmatter), `02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md` (primeres 40 línies) i `src/config/i18n.js` (primeres 80).
- Documents de l'Olivera: la petorreta 0630, el pla 0645, la 0652 sencera i `00_index_escriptori.md`.

**Sonda per a la sessió següent (després de F1′), per a verificar que el hook continua cobrint els subagents:**

```bash
node tooling/gates/segella.mjs
```

Després, un `Workflow` d'un sol agent que intente `Write` a `.agents/ESTAT.md`. Ha d'eixir **denegat** pel hook. Si passa, F1′ no protegix els subagents i s'ha de desfer.

**No executat i, per tant, no avalat:** `npm test`, `npm run lint`, `npm run porta`, cap navegador (les eines del navegador són MCP i estan denegades) i cap mesura de contrast efectiu. **Cap porta es declara verda en este informe, llevat de les marcades amb ✅.**

<!-- SDP:SECTION auditoria.s6 -->
## Límits

1. **Un sol agent, sense refutació creuada** de les troballes pròpies. La memòria d'auditories prèvies dona un ~27 % de troballes falses. Jo n'he refutat una de pròpia abans d'entregar: FE-04 era, d'entrada, una fuga a la LAN, i no ho és. Codex i MarIA poden i han de rebatre la resta a l'Olivera.
2. **Sense cerca.** L'arbre de `src/` l'he tret de l'inventari del torn `torn_b0e47896…`. Tota afirmació del tipus «no n'hi ha cap» es limita als fitxers enumerats a la Verificació. A11Y-06 i SEO-02 inclouen hipòtesis marcades com a tals.
3. **Abast de l'escombrada:** 45 fitxers de codi i configuració d'un total d'uns 270 a `src/` i `tooling/`. No he llegit les 20 seccions una per una, ni els CSS de components, ni el PHP (no existix), ni el desplegament real.
4. **No he tocat** codi, `.agents/`, l'ESTAT ni el LEDGER. La Gàbia ho impedix (G-05 de la 0652). El torn `torn_90b82d38…` queda **obert**, i també el `torn_b0e47896…` de la 0652. Deixe el relleu preparat perquè l'anote el Mestre:

```markdown
## ESTAT_ACTUAL · 260924_0716 · Claude · Auditoria de fortificació II (SEO, a11y, frontend, refutació)

- Torn `torn_90b82d38-ac5b-4b48-ae53-805e11580166` (documents). Entrega [[260924_0716_auditoria_claude]], complement de [[260924_0652_auditoria_claude]]. Zero codi tocat.
- Ultracode denegat per segona vegada (hooks-local.mjs:85). Correcció: NO aplicar l'F1 de la 0652 (matcher), perquè deixa lliure mcp__terminal__run_in_terminal. Aplicar F1′ (llista blanca d'orquestració) i F4 mínima.
- Troballes noves prioritàries: sitemap amb URL noindex i sense productor (SEO-01), Wiki sense SEO per document i amb el text dels plans directors al paquet JS (SEO-03, SEO-05), injecció de text via ?error= (FE-01), promesa WCAG sense eina (A11Y-01).
- Següent acció: el Mestre reconcilia el segell, aplica F1′ i obri una sessió nova per a la tercera passada amb Workflow.
```

```markdown
260924 | auditoria | Claude | Segona passada: SEO, a11y, frontend; F1 corregit per F1′
```

5. **Recordatori (AGENTS §14):** falta l'Acta Marmota d'esta jornada.
6. **Per a Codex (petorreta `260924_0711_prompt_fortificacio_codex.md`, mateix abast).** Esta auditoria i la 0652 ja cobrixen la governança i el primer tall de SEO, a11y i frontend. On més aportes és en el que jo no he pogut provar, perquè tens `http://localhost:3340`:
   - reproduir FE-01 obrint `http://localhost:3340/mur?error_description=prova`;
   - mesurar el contrast efectiu d'A11Y-03;
   - provar la hipòtesi de zoom i *reflow* d'A11Y-06;
   - comprovar al DOM el canònic de SEO-03;
   - rebatre G2-02 si la teua lectura dels `matcher` del client és una altra.
   Si una troballa meua cau, digues-ho amb la teua evidència. És el que demana la lliçó de l'Olivera del 260922.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_0652_auditoria_claude]]
- [[260924_0630_prompt_fortificacio_opus]]
- [[260924_0645_pla_implementacio_opus]]
- [[260924_0711_prompt_fortificacio_codex]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
