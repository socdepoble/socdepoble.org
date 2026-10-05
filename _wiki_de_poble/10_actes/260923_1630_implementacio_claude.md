---
type: acta
status: esborrany
description: Neteja del linter (109 no-unused-vars a 52), quarantena del bootloader mort i diagnostic executable de per que els blocs normatius es perden.
tags:
  - acta
visibility: private
reflex: sdp:torn_faad1a46-4417-4913-bd10-a5ea9baae1ba:6c9c699b-1209-4f21-9de1-1ae9884a69fd
---
# 260923_1630 - Acta d'implementacio: linter de 121 a 64 i causa arrel de la mutilacio de plantilles

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_faad1a46-4417-4913-bd10-a5ea9baae1ba:6c9c699b-1209-4f21-9de1-1ae9884a69fd |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T14:38:42.596Z |
| Modificació | 2026-09-23T14:38:42.596Z |
| Propietari | Claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | No especificat (pre-telemetria) |
| Tokens consumits | No especificat (pre-telemetria) |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 124345961b466375ee5bea239fbc303ae054820bbfb8105fa24f37a6c4a55d76. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

2026-09-23T14:38:42.596Z: esborrany creat; contingut i verificació pendents.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Part Tècnica

**Xifra d'entrada i d'eixida.** Mesurat amb l'abast real de `npm run lint` (`src tooling scripts tests`, no `eslint .`):

| | abans | després |
| --- | --- | --- |
| `no-unused-vars` | 109 | **52** |
| `react-hooks/exhaustive-deps` | 12 | 12 (intactes per ordre) |
| **total** | **121** | **64** |

**Què s'ha tocat (29 fitxers de codi, tots amb `node --check` net):**

1. **`eslint.config.js`** — afegit `'**/.obsidian/**'` als `ignores`. Nota: `_wiki_de_poble/.obsidian/` cau fora de l'abast de `npm run lint`, per tant això no baixa el recompte de la porta; purga el soroll de qui execute `npx eslint .` a seques, que és el cas on ixen les xifres grosses (231 errors / 196 avisos).
2. **`tooling/wiki/lib/context_preflight.mjs` → `.sdp-paperera/quarantena-260923/`** (−8 avisos). Reverificat abans de moure'l: cap crida al repositori; les úniques mencions són el LEDGER, l'ESTAT i rebuts de torns antics que en registren el SHA (evidència històrica, no dependències). Quarantena en compte de `rm`, segons AGENTS §5.
3. **Imports orfes** (−3 especificadors, via `llevar-imports-orfes.mjs`): `TextSection` i `UniversalCard` a `DesignSection.jsx`, i `TOOLING_WIKI_DIR` a `reflex_petorreta.mjs` en quedar orfe. Verificat que cap dels mòduls té efectes col·laterals i que `PedraSeca` ja s'importava dos línies amunt: **zero canvi de píxel**.
4. **24 clàusules `catch (x)` orfes → `catch` sense binding.** Eina nova `tooling/scripts/llevar-catch-orfes.mjs`, germana de la d'imports: només toca les línies que ESLint marca i que l'AST confirma que són `CatchClause` amb paràmetre `Identifier`. Optional catch binding és ES2019 i entra de sobra al Baseline (Safari 16 / Chrome 100 / Firefox 100).
5. **7 destructuracions «omit key»** (`{ content, ...item }`) → prefix `_`, dins de `tooling/wiki/**`, on `eslint.config.js:69` ja el permet. **No eren deute:** eixes variables s'usen per a excloure un camp. Esborrar-les hauria tornat a ficar `content` als informes (fuita de contingut de documents) i hauria trencat el càlcul de `signature` a `payloadForSignature`.
6. **5 arguments de contracte a `reflex_document.mjs`** → prefix `_`, la decisió del Mestre. Correcció de xifra: la Directiva en deia 2; en són **5**, repartits en dos funcions (`prepararDocument` i `promoureDocument`), les dos stubs que llancen. La signatura és el contracte del que faran, i el prefix la conserva.
7. **8 càlculs morts llevats** en eines, tots sense promesa d'API: `cosCadena` i la desestructuració `cos` a `tractor-cadena.mjs`, `IMPL` a `tractor-enxufe.mjs`, `SCRIPT_DIR` a `generar_genoma_v2.mjs` i a `reflex_petorreta.mjs`, `cru` a `tractor-registre.mjs`, `segell` a `somiador.mjs`, i un `git diff --no-index` mort a `desenterrar.mjs` que a més llegia `/dev/stdin` sense necessitat.

**Els 6 enganxalls de `pre-commit.mjs` (auditats a mà, com manava la Directiva).** La troballa és pitjor del que semblava:

- Les **dos sondes** del pas 1 (camins fràgils i anti-tombstone) detecten la infracció, imprimixen l'error i llancen... i **el seu propi `catch` s'engoleix eixe `throw` tres línies més avall**. No podien fallar mai. A sobre, la justificació escrita («grep falla si no troba res») era falsa: `spawnSync` no llança, torna `status: 1`.
- **Activar-les bloquejaria el repositori sencer:** ara mateix la sonda 1 troba **14 fitxers** amb `process.cwd()` o `../..` dins de `tooling/wiki`, i la 2 en troba 6 amb el patró de tombstone. Fer-les bloquejants sense netejar això abans deixaria el Mestre sense poder fer cap commit.
- **Decisió:** s'ha llevat el `try/catch` que s'engolia el `throw` propi i s'han deixat les sondes **explícitament consultives** (`SDP-LOCK (consultiu):`). El comportament observable no canvia ni un caràcter —el `console.error` ja s'imprimia abans del `throw` engolit—, però ara el codi diu la veritat sobre el que fa. Fer-les bloquejants és un torn a banda amb la neteja dels 14 fitxers per davant.
- Els altres 3 `catch (err)` (passos 0, 5 i 6) sí eren conversió neta: imprimixen missatge propi i moren amb `exit(1)`.

**Troballa lateral no tocada (P1):** `pre-commit.mjs:122` invoca `node 06_EINES/canonada.mjs verifica`, i **`06_EINES/` no existix al repositori**. Si l'execució hi arribara, el hook moriria amb un missatge que acusa `fs.writeFileSync` fora de la Canonada, que no és la causa. No hi arriba mai perquè el pas 0 (`npm run gate`) ja talla abans. És una mina amb l'espoleta posada: la deixe documentada i intacta perquè tocar la cadena de portes exigix ordre.

### 2. Incidència forense: per què es perden els blocs de la plantilla

La hipòtesi del Mestre era que un fitxer antic fa conflicte, o que cal una directiva al fitxer d'arrencada. **L'evidència diu una altra cosa, i és millor notícia: l'injector ja existix i ja està ben configurat.**

**El que s'ha verificat, executable:**

1. `tooling/documental/core.mjs:122` construïx `route.fixedBlocks` llegint el text literal de la plantilla. La ruta `prompt.local` **ja declara** `blocsFixos: ["Context", "Protocol de la Reunió a l'Olivera"]` a `.agents/protocolledge.json`. El bloc «Context» carregat en memòria fa **1047 caràcters** i conté el Rentonar i Sollutia sencers.
2. `document.mjs create` injecta eixe text **literalment** (`draft()`, línia 17: `delivery.route.fixedBlocks?.[section] ?? ...`). Qualsevol altra secció naix com a `[pendent]`. És a dir: **pel camí obedient, el Context no es pot perdre.**
3. `validateSections` (`core.mjs:165`) compara els blocs fixos i escup `Bloc normatiu alterat: <nom>`. **La porta existix i funciona.** Passada a mà contra el prompt d'este mateix torn, canta tres defectes:
   - `Secció absent o pendent: Acte reflex`
   - `Bloc normatiu alterat: Context`
   - `Bloc normatiu alterat: Protocol de la Reunió a l'Olivera`
4. **Però `document.mjs check` sobre eixe mateix fitxer només diu «falta rebut».** La causa és `turns.mjs:109`: si el frontmatter no porta un `reflex` vàlid, la funció fa **`return` immediat** i `validateSections` (línia 119) **no s'executa mai**.

**La cadena causal completa:** un document escrit directament amb l'eina d'escriptura de l'agent naix sense rebut → `check` s'atura al rebut → el contingut no s'arriba a comparar mai amb la plantilla. **La porta que detecta la mutilació només mira els documents que ja han nascut bé.** Els que naixen pel camí de fora són precisament els que no es miren.

**I el diagnòstic fi, comparant text amb text:**

| bloc | plantilla | document | veredicte |
| --- | --- | --- | --- |
| Context | 1047 car. | 1404 car. | **no hi ha mutilació**: el text hi és literal i sencer, amb el Rentonar i Sollutia. Hi ha una **addició** de 357 car. al final (el paràgraf «Instrucció Específica per a aquest Torn»). |
| Protocol de l'Olivera | 1291 car. | 280 car. | **mutilació real**: es perden els punts 3 (diàleg i Pla d'Implementació) i 4 (millora contínua), i es reescriuen l'1 i el 2. |

Açò **corregix la sospita del Mestre en un punt i la confirma en un altre**: el que desapareix no és el Context del Rentonar —que en este prompt hi és sencer— sinó **el Protocol de l'Olivera**, justament les ordres que fan funcionar la reunió creuada.

**Per què passa, i és mecànic, no desídia:** les dos seccions estan declarades invariables, però l'agent necessita escriure en cada torn coses que canvien (la instrucció específica, el nom exacte del fitxer d'eixida, a qui va dirigit). Com que **la ruta `prompt.local` no té cap secció editable on posar això**, l'agent ho fica dins del bloc fix. De vegades afegint (Context: queda alterat però íntegre) i de vegades resumint per a encaixar-hi la particularització (Protocol: es perd la meitat). **El bloc fix s'envaïx perquè no hi ha cap altre lloc.**

**Solució proposada, tres peces, de menys a més invasiva** (proposta: cap s'ha implementat, perquè toquen la cadena documental i exigixen pla aprovat per §1 del workflow):

1. **Donar-li un lloc al que canvia.** Afegir a la ruta `prompt.local` una secció editable —`Instrucció del torn`— entre `Context` i `Tasques`. És una línia a `.agents/protocolledge.json` i una secció a la plantilla. Sense això, les altres dos peces només castiguen una conducta que el format obliga a tindre.
2. **Que la porta puga parlar.** A `turns.mjs:109`, en compte de `return`, acumular l'error del rebut i continuar fins a `validateSections`. Així `check` sobre un document sense rebut diria també «Bloc normatiu alterat», que és el que el Mestre vol saber. Cal mesurar-ho abans: farà eixir errors nous en documents que hui passen amb un sol avís.
3. **Tancar el camí de fora.** És la peça de Codex en este mateix torn: que el hook de `PreToolUse` sobre `Write`/`Edit` a `04_escriptori/*.md` exigisca que el document tinga rebut, o siga, que haja passat per `document.mjs create`. Mentre escriure el `.md` a mà siga possible i gratuït, cap validació posterior l'atrapa.

**Resposta directa a la pregunta del Mestre** («cal que un script injecte el text sense que la IA l'haja de transcriure?»): **ja ho fa, i bé.** No falta injector ni sobra cap fitxer antic. El que falta és (a) un lloc previst per al que varia de torn a torn i (b) que la comprovació s'execute en els documents que naixen fora del camí canònic.

### 3. Decisions de Trellat

- **No s'ha buscat el verd a base d'esborrar.** Els 52 `no-unused-vars` que queden no són brossa d'imports: són el mapa de la maquinària a mitges. `prompt_sgq.mjs` en té 7 que són el **cadàver del validador SGQ** (`canonicalSections()` i `validateSgqPrompt()` retornen `[]` per decisió escrita al propi codi) — i com que `canonicalSections()` torna llista buida, `buildSgqPrompt` compon el prompt amb `context.templateSections.map(...)` sobre un array buit: **el generador canònic produïx documents sense cap secció**. Esborrar `CANONICAL_HEADINGS`, `editable` i `receiptPattern` destruiria l'única còpia de l'especificació d'eixe validador.
- **Llei del Píxel.** Res del que s'ha tocat altera la pantalla: els dos imports de `src/` no s'usaven i el mòdul ja es carregava per una altra línia. Els 16 avisos que queden a `src/` sí que la tocarien i per això no s'han tocat.
- L'eina nova (`llevar-catch-orfes.mjs`) s'ha deixat al repositori en compte del temporal: fa la mateixa faena que la germana d'imports i servirà la pròxima volta.

### 4. Metadades per a màquines

```yaml
data: "260923_1630"
linter:
  abans: { no_unused_vars: 109, react_hooks: 12, total: 121 }
  despres: { no_unused_vars: 52, react_hooks: 12, total: 64 }
  restants_per_arbre: { src: 16, tooling: 30, scripts: 6 }
blockers:
  - "test:node: 9 fallades preexistents per .agents/skills/core-automillora/SKILL.md (name/type/status divergents del contracte de cataleg_skills.mjs). Provat amb git stash: falla igual sense els meus canvis."
  - "El Pla de l'Olivera continua sense validar: title desconegut i status consensuat fora de l'enum."
decisions_clau:
  - "Blocs fixos: l'injector ja existix; el que falta és una seccio editable per al torn i que validateSections s'arribe a executar."
  - "Sondes de pre-commit: consultives i explicites, no bloquejants; activar-les exigix netejar 14 fitxers abans."
  - "Destructuracions omit-key i arguments de contracte: prefix _, no esborrat."
requereix_auditoria: false
```

### 5. Portes executades

| porta | resultat | de qui és el que falla |
| --- | --- | --- |
| `npm run lint` | **64 problemes, 0 errors** (abans 121) | — |
| `test:documental` | **45/45 verdes** | — |
| `node --check` × 29 fitxers | **tots nets** | — |
| `porta:enxufe` | ✅ verda (i és un dels fitxers que he tocat) | — |
| `porta:plantilles` | ✅ 13 rutes quadren | — |
| `ledger` | ✅ signat i verificat de nou després d'escriure-hi | — |
| `porta:cadena` | ❌ 5 (C4: `porta:segella`, `porta:matrix`, `porta:olivera`, `porta:segella:update`; C5: `build-seo-manifest.mjs`) | heretat; el meu canvi a este fitxer no hi entra i la detecció C4 continua funcionant |
| `porta:registre` | ❌ 2 | `core-automillora` sense `status:` |
| `porta:documents` | ❌ 7 | els 4 documents de MarIA sense rebut; **la meua acta no hi ix** |
| `porta:reflex` | ❌ baseline divergent | `90_arxiu_historic/260923_1515_prompt_conjunt_olivera.md` sense versionar |
| `tancament --check` | ❌ no valida | vore avall |
| `test:node` | ❌ 9 fallades | `core-automillora`; **provat amb `git stash`: falla igual sense els meus canvis** |

**El tancament no valida, i cap causa és d'este torn.** Les onze primeres línies d'error són: el Pla de l'Olivera sense rebut (i per tant «el torn encara no està planificat»), els tres prompts de MarIA sense rebut ni àncora, `260923_1515_prompt_conjunt_olivera.md` mogut a `90_arxiu_historic/` **sense `document.mjs handoff`** («Document eliminat sense relleu»), els enllaços trencats de `00_index` i les dos actes marmota òrfenes. L'acta d'este torn no apareix a cap llista d'orfes ni de no ancorats.

**Avís d'arbre concurrent:** el **segell de skills s'ha trencat durant la sessió** (era `6e288332` a l'inici del torn i és `e981981f` ara). `git status .agents/skills/` diu que jo no n'he tocat cap; l'únic canvi és `core-automillora/`, sense versionar. Entre mig han aparegut fitxers nous a l'Escriptori (16:35, 16:38), o siga que hi ha un altre agent editant alhora. **No he executat `segella.mjs --update`**: resegellar seria signar canvis d'un tercer que no he auditat, que és exactament el que la Llei Z vol impedir. Qui haja tocat les skills que les segelle.

<!-- SDP:SECTION acta.s5 -->
## Pendents

**Els 52 `no-unused-vars` que queden, classificats.** Cap és brossa mecànica; cada grup demana una decisió distinta:

| grup | quants | on | què cal fer |
| --- | --- | --- | --- |
| Maquinària a mitges | 18 | `tractor-fitxa-gestor.mjs` (9), `prompt_sgq.mjs` (7), `neteja_brain.mjs` (2) | **Fusible.** Són lleis amb el cos incomplet, el validador SGQ retirat i dos funcions (`buidaQuarantena`, `restaura`) que no crida ningú. Esborrar-les amputa la maquinària; acabar-les és faena de producte. |
| Funcionalitat a mitges a `src/` | 16 | seccions i contextos | **Llei del Píxel.** `onBack` a `AdminSection` (el botó de tornar no funciona), `previous`/`next` a `ItemDetailSection` (navegació calculada i no usada), `showToast` a dos espècimens del catàleg, `config` a `loginWithMagicLink`. Tocar-ho canvia comportament: necessita ordre. |
| Promeses de CLI incomplides | 6 | `crear_document.mjs` (`author`, `dateStr`, `dateIso`), `tractor-build-previ.mjs` (`--desplega`), `tractor-classes-orfes.mjs` (`--detall`) | Són **banderes documentades que no fan res**. `crear_document.mjs` anuncia `[Autor]` a la seua pròpia ajuda i després el descarta. O s'implementen o s'espenta la promesa fora de l'ajuda. |
| Comptadors morts | 4 | `porta-vigencia.mjs` (`nMorts`, `reparats`), `migrate-css.mjs` (`hasZombie`), `teixidora_sinapsis.mjs` (`categoriaStr`) | **Bugs, no deute:** compten i no informen. La correcció és usar-los a l'informe, cosa que canvia l'eixida de la porta. Decisió del Mestre. |
| Rest-siblings fora d'abast | 2 | `tooling/brain/context_documental.mjs` | Mateix patró «omit key» dels 7 ja resolts, però `tooling/brain/**` no té `varsIgnorePattern` a la config. Estendre-la-hi és ampliar una excepció: no s'ha fet sense ordre. |
| Altres | 6 | `plaquetes.mjs`, `teixidor-backlinks.mjs`, `trellat_metrics.mjs`, `tractor-classes-orfes.mjs` | `memPath`/`indexPath` de `plaquetes.mjs` calculen les rutes del memorial de làpides i de l'índex d'adopció **i no les escriuen mai**: és l'evidència que Plaquetes diagnostica i no cura. |

**Tasques immediates per al pròxim torn:**

1. `[ ]` **Primer de tot: validar el Pla de l'Olivera.** `260923_1515_pla_implementacio_olivera.md` continua sense passar `document.mjs plan` (`title` és propietat desconeguda i `status: consensuat` és fora de l'enum; ha de ser `actiu`). Mentre no valide, **cap torn d'esta reunió pot arribar a `closed`**. Són tres línies de frontmatter i és document de MarIA.
2. `[ ]` **Arreglar `core-automillora/SKILL.md`** perquè `test:node` torne a passar: `cataleg_skills.mjs:56` exigix `name` igual al nom de la carpeta, `type: skill` i `status` dins de `['actiu','canonic']`. Són 9 fallades d'un sol fitxer, i és el mateix que fa que el router no seleccione la skill (troballa de Codex).
3. `[ ]` **Decidir sobre les tres peces de la secció forense** (secció editable per al torn, `turns.mjs:109`, hook de `PreToolUse`). La primera és la que canvia el resultat; les altres dos sense ella només castiguen.
4. `[ ]` **Repassar els 4 comptadors morts i les 6 promeses de CLI**: són bugs xicotets i aïllats, bona faena per a un torn curt.
5. `[ ]` Pendent de sempre: `06_EINES/canonada.mjs` no existix i `pre-commit.mjs:122` el crida.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
