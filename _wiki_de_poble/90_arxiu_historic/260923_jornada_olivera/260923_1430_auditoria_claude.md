---
type: informe
status: esborrany
description: "Implementació del sistema nerviós: segell immune, despertar fresc, watcher de la Wiki, anidació i porta d'higiene de l'Olivera."
tags:
  - auditoria
  - brain
  - govern
  - portes
reflex: "sdp:torn_7bb49ce4-f3fb-4d1b-8b58-2e762fab300d:ef73c48c-3c5e-4874-8dac-c0d1deb02e14"
---

# Implementació del sistema nerviós — informe d'execució

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-IMPLEMENTACIO-260923_1430_CLAUDE |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 26-09-23 14:30 |
| Modificació | 26-09-23 14:30 |
| Propietari | Claude (agent local) |
| Plantilla | auditoria_canonica.md (ruta `auditoria`, v2.0.0) |
| Torn | `torn_7bb49ce4-f3fb-4d1b-8b58-2e762fab300d` (abast `code`) |
| Rebut | `sdp:torn_7bb49ce4-f3fb-4d1b-8b58-2e762fab300d:ef73c48c-3c5e-4874-8dac-c0d1deb02e14` |
| Tall d'evidència | HEAD `6423590e`, arbre brut heretat |
| Aprovació humana | pendent |
| requires_human_decision | true (R1, R2, R5) |

## Acte reflex

Torn obert amb `obrir_torn.mjs --actor Claude --scope code`. Plantilla demanada amb `document.mjs context --route auditoria` i llegida sencera abans d'escriure. Llegits abans de tocar codi: `AGENTS.md`, `02_genotip.md`, `00_index.md`, el Pla de MarIA de les 12:45 (amb l'aportació de Codex de les 13:03) i la meua pròpia auditoria de les 13:10, que és d'on venen els codis T1…T14.

Mode AFK alçat pel Mestre per a este torn: **ací sí que s'ha tocat codi**. La frontera que m'he marcat és la del §Abast: tot allò que he tocat està enumerat, i tot allò que he trobat trencat i **no** he tocat també.

## Historial

- **v1.0.0 (260923_1430):** Primera entrega. Respon a `260923_1340_prompt_implementacio_claude`. Implementa les tasques 1-5 del prompt.

## Troballes

Onze fitxers tocats, cap d'ells a `01_produccio`. Cada apartat diu què s'ha fet, per què i com comprovar-ho.

---

### I1 · El segell ja no es trenca quan el Mestre ensenya · T1, RESOLT

**Fitxers:** `tooling/gates/segella.mjs` (reescrit), `tooling/gates/segell-auto.mjs` (nou), `.claude/settings.json`, `.agents/hooks.json`, `.agents/SKILLS_SEAL.json`.

Dos canvis independents, i convé no confondre'ls:

**1. Superfície del hash.** `segella.mjs` recorria `.agents/skills/` sense filtrar extensió: els 18 fitxers que entraven al hash incloïen `.agents/skills/.DS_Store`. Ara només es hasheja `**/*.md` —les 16 `SKILL.md` i `00_INDEX_SKILLS.md`, 17 fitxers— i el que queda fora es **reporta**, no s'amaga:

```bash
node tooling/gates/segella.mjs --json | node -e "…"
# files: 17 · ignorats: [".agents/skills/.DS_Store"]
```

He anat més enllà del `.DS_Store` literal que demanava el prompt, i ho dic perquè es puga revertir: filtrar per `.md` cobrix tota la família (`Icon\r`, `._*`, `Thumbs.db`) i **no canvia ni un byte del conjunt segellat d'avui**, perquè els altres 17 fitxers ja eren `.md`. Si demà algú posa un `reference.txt` dins d'una carpeta de skill, quedarà fora del segell: és el cost conegut d'esta decisió.

**2. Resegellat automàtic.** `CLAUDE.md` mana escriure la lliçó del Mestre dins de la `SKILL.md` i cap dels quatre passos resegella; com que la Porta Segell és la tercera de 48, **aprendre apagava la cadena**. `segell-auto.mjs` és un hook `PostToolUse` que resegella només quan l'escriptura ha tocat `.agents/skills/**/*.md`, deixa traça a `.agents/runtime/segell.log` (JSONL: quan, fitxer, hash anterior, hash nou) i **mai falla l'operació**.

Per què això no afluixa la Llei Z: el segell diu que protegix contra modificacions «d'amagat». Una escriptura feta amb l'eina de l'agent queda al transcript i al `git diff`: no és amagada. El que continua trencant el segell —i ha de trencar-lo— és tot el que entra per fora: un editor manual, un `git checkout`, un altre procés.

**`requires_human_decision: true` (R1).** És un canvi de model de confiança. Es revertix llevant l'entrada `PostToolUse` de `.claude/settings.json` i de `.agents/hooks.json`.

---

### I2 · `despertar.mjs`: dos canals, i el ranci ja no porta noms · T6+T7, RESOLT

**Fitxer:** `tooling/brain/despertar.mjs` (reescrit).

**L'ESTAT (T7).** `estatActual()` pren la **primera capçalera `## ESTAT_ACTUAL · …`** del fitxer —on els agents escriuen de veres, perquè l'ESTAT creix pel principi— i deixa el bloc delimitat `<!-- SDP:ESTAT_ACTUAL -->` com a reserva. Fins ara s'injectava el bloc de baix, que portava catorze hores fossilitzat.

**L'escriptori (T6).** L'`@`-import de `CLAUDE.md` es resol **abans** que el hook escriga: qui llig `ON_ESTIC.md` llig sempre la sessió anterior. Un avís no ho repara, i la llista d'ahir apuntava a documents que hui són a `90_arxiu_historic/`, que AGENTS §5 prohibix llegir en procediments automàtics. Per tant:

- **stdout (canal fresc):** el hook `SessionStart` imprimix la fotografia sencera, amb la llista real. Per construcció no pot ser d'ahir. `npm run despertar` dona exactament el mateix text.
- **`.agents/ON_ESTIC.md` (canal ranci):** **ja no conté cap nom de fitxer de l'Escriptori.** Dona l'ordre de llistar la carpeta i diu per quins dos camins s'obté la llista fresca. El relleu de l'ESTAT sí que hi queda, perquè un relleu escrit expressament pel torn anterior *ha de ser* d'abans: això no és rancidesa, és la seua funció.

**Detector de rancidesa (nou).** Compara el segell de la capçalera de l'ESTAT amb l'`mtime` més recent de `04_escriptori/` i `10_actes/`. Mesurat ara mateix:

```
> [!WARNING]
> ESTAT RANCI: l'últim relleu és de 260923_1310 i
> `…/260923_1340_prompt_implementacio_codex.md` s'ha tocat 41 min després.
```

Els segells `AAMMDD_HHMM` es parsegen en **hora local**, no UTC: fer-ho en UTC amagava rancieses de fins a dues hores en horari d'estiu. La meua auditoria demanava que això isquera amb codi ≠ 0; **no ho he fet**, i és una desviació deliberada: un hook `SessionStart` que ix 1 es pot menjar l'eixida, i perdríem el canal fresc per guanyar un avís. Queda com a `[!WARNING]` visible als dos canals i com a línia de `stderr`.

Corregits també els dos defectes menors que ja havia mesurat: el segon bloc `---` de frontmatter buit i la `description` que deia «la sessió actua».

---

### I3 · Watcher de la Wiki en calent · T13, RESOLT

**Fitxers:** `tooling/wiki/compile-wiki-to-app.mjs` (refactoritzat), `tooling/vite/wiki-watcher.mjs` (nou), `vite.config.js`.

`compile-wiki-to-app.mjs` ara exporta `construeixManifest()`, `verificaEnllacos()` i `compila({root, write})`, i el cos del mòdul no escriu res: l'escriptura viu dins de `compila()` i és **condicional** —si el contingut generat és idèntic al del disc, no toca el fitxer i torna `changed: false`. Sense això, cada desat innocu canviaria l'`mtime`, Vite reinvalidaria i el navegador parpellejaria: la diferència entre un watcher i un bucle.

El plugin és `apply: 'serve'` (el build ja té `prebuild`), amb debounce de 120 ms (desar des d'Obsidian dispara fitxer temporal + renom), `full-reload` en compte d'HMR fi, i els errors van a l'overlay sense tombar el servidor.

**Àmbit heretat, mai ampliat.** Verificat en el servidor viu del port 3340:

```bash
# dins de l'àmbit
printf '…' > _wiki_de_poble/02_saber/zzz_prova_watcher.md
# manifest mtime 1790165103 → 1790166171, i el document hi apareix
rm _wiki_de_poble/02_saber/zzz_prova_watcher.md
# el document desapareix del manifest

# fora de l'àmbit
printf 'prova\n' >> _wiki_de_poble/04_escriptori/.prova_ambit.tmp
# mtime del manifest: idèntic. L'Escriptori no arriba mai a l'aplicació.
```

`rag-index.json` i `slugIndex.json` queden fora a propòsit: viuen a `public/`, que Vite servix del disc, i regenerar-los és bastant més car. Queda declarat, no fet.

---

### I4 · L'anidació inútil i la portada amagada · REQUERIMENT NOU, RESOLT

**Fitxers:** `tooling/wiki/compile-wiki-to-app.mjs`, `src/sections/wiki-de-poble/WikiDePobleSection.jsx`.

`ensureCategory()` calculava la ruta des de l'arrel del **repositori**, i per això tot penjava de `folder:_wiki_de_poble`, etiquetat « WIKI DE POBLE» (amb espai al davant, perquè el `replace(/^[0-9]+_/)` no casa amb `_wiki_de_poble`). Ara la ruta és relativa a `_wiki_de_poble/`:

| Abans | Ara |
| --- | --- |
| ` WIKI DE POBLE` → `SER`, `SABER`, `ACTUAR` | `SER`, `SABER`, `ACTUAR` (arrels) |
| 9 categories | 8 categories |
| `00_index` penjat del contenidor | `categoryId: null` |

Els documents solts de l'arrel de la Wiki tornen `categoryId: null` i la secció els posa a una categoria base pròpia, `ÍNDEX`, germana de `Cervell (Graf)`. Comprovat al navegador, columna esquerra:

```
Tot · Cervell (Graf) · ÍNDEX · SER · SABER › · ACTUAR ›
```

Tots al mateix nivell d'indentació (4 px / 18 px), zero errors de consola. `BrainGraph` ja tractava `categoryId` nul (`if (item.categoryId && …)`), per tant no ha calgut tocar-lo. Els identificadors de categoria canvien (`folder:_wiki_de_poble/01_ser` → `folder:01_ser`); no hi ha cap estat persistit que els referencie, perquè la URL només porta `?item=`.

---

### I5 · `triggers_on` encaminat, i no per la porta cara · T4, RESOLT

**Fitxers:** `tooling/brain/build_skills_index.mjs` (nou), `tooling/session/persona_router.mjs` (reescrit), `.claude/settings.json`.

L'encaminador estava **doblement mort**: zero cridadors i una dependència inexistent. Demanava `.agents/skills_index.json` i deia «executa primer `tooling/brain/build_skills_index.mjs`», un fitxer que tampoc existia. Per això els disparadors de 16 skills eren ornamentació.

He triat **encaminar-lo**, no esborrar-lo, i el motiu és que esborrar-lo deixaria 16 fitxers declarant un mecanisme inexistent: el problema no és el motor, és la mentida. Tres decisions:

1. **`build_skills_index.mjs`** construïx l'índex des de l'única font que hi ha, el frontmatter de les `SKILL.md`. Resultat mesurat: 8 core, 8 plugins.
2. **El router emet punters, no contingut.** El mode `--punters` imprimix només nom, ruta i descripció de les skills que han disparat. Unes poques línies per torn, no setze documents. El bolcat complet en JSON continua disponible sense bandera.
3. **S'encaminen també les `core: true`.** No és un descuit: els disparadors que més valen (`petorreta`, `acte reflex`, `workflow`, `disseny`) viuen justament en skills marcades com a nucli, i el router original només mirava els plugins. Que una skill estiga permanentment al context **no la fa present en el moment d'actuar** —eixa és exactament la fallada que estem reparant—, així que el punter les nomena i marca «ja al context, aplica-la ara».

```bash
$ printf '{"prompt":"fem una petorreta amb el workflow de planificacio"}' \
  | node tooling/session/persona_router.mjs --hook --punters
[Router cognitiu] Aquesta petició dispara procediments consultables:
- sdp-workflow → .agents/skills/sdp-workflow/SKILL.md · ja al context, aplica-la ara · …
- wiki-documentacio-i-reflex → .agents/skills/wiki-documentacio-i-reflex/SKILL.md · ja al context, aplica-la ara · …
```

Endollat a `UserPromptSubmit` de `.claude/settings.json`. **`requires_human_decision: true` (R2):** canvia què entra al context de cada torn. Es revertix llevant eixe bloc. **No** l'he posat a `.agents/hooks.json`: el dialecte d'Antigravity que conec només documenta `PreToolUse`, i inventar-ne un altre seria tornar a promentre un mecanisme sense comprovar-lo. MarIA ha de confirmar el nom de l'esdeveniment al seu client.

---

### I6 · La Porta Olivera: la precondició viu on es decidix · TASCA 5, RESOLT

**Fitxers:** `tooling/gates/porta-olivera.mjs` (nou), `.agents/protocolledge.json`, `.claude/settings.json`, `.agents/hooks.json`.

El Mestre demana un mecanisme perquè la higiene de l'Olivera siga un hàbit infal·lible. El diagnòstic de la meua auditoria era que **la regla vivia a les Lliçons d'una skill i el moment de decisió té davant un altre document**. Per tant la reparació no pot ser un altre text: ha de ser una porta que corre exactament quan s'escriu la petorreta. Tres capes:

**Capa 1 · El contracte.** MarIA havia afegit §0, `Tasques` i `Riscos` a `prompt_local.md` sense sincronitzar `.agents/protocolledge.json`, i això matava la cadena a la **porta 1**:

```
❌ [Porta Plantilles] 2 divergències: prompt.local: la plantilla no té les seccions
   que el contracte exigeix: Tasca; …té seccions que el contracte no coneix:
   0. Abans de generar…, Tasques, Riscos
```

Sincronitzat (ruta `prompt.local` a v2.2.0, 9 seccions amb els seus `sectionIds`). Ara `§0 «Abans de generar»` és **secció obligatòria del contracte**: cap petorreta pot validar sense ella. §0 s'ha deixat **fora** de `blocsFixos` a propòsit —un bloc fix exigix contingut idèntic al de la plantilla, i això impediria marcar les caselles.

**Capa 2 · La porta.** `porta-olivera.mjs` s'engancha a `PreToolUse` i només actua quan el destí és una petorreta de l'Escriptori (`AAMMDD_HHMM_prompt_*.md`, fitxer solt, mai en subcarpeta). Comprova tres coses i bloqueja amb codi 2:

1. **Escriptori classificat:** cap document de categoria de torn (`prompt`, `auditoria`, `pla`, `bundle`, `acta`…) amb data anterior a hui.
2. **Pla d'Implementació de hui** present a l'Escriptori.
3. **§0 present i sense caselles a mitges.**

També mira les **redireccions de shell** (`>`, `>>`, `| tee`) cap a una petorreta: eixa és la via per la qual els documents d'aquesta jornada van arribar al disc sense rebut (T11), i que el `matcher` de `Write|Edit` no cobria.

```bash
$ node tooling/gates/porta-olivera.mjs < payload-sense-seccio-0.json
[PORTA-OLIVERA] BLOQUEIG · …/260923_1400_prompt_prova_claude.md
- La petorreta no porta la secció «0. Abans de generar…». És la precondició
  d'higiene i ha de viatjar dins del document, no a la memòria de qui l'escriu.
→ exit 2
```

**Capa 3 · La neteja, que es demana i no es fa sola.** `--arxiva` mou els documents de jornades anteriors a `90_arxiu_historic/` i despenja les seues àncores de l'índex. **És una ordre explícita, no automàtica**, i això és deliberat: AGENTS §5 prohibix l'esborrat i el trasllat silenciós, i el Somiador requerix encàrrec. El que sí que és automàtic és el **bloqueig**, que porta l'ordre escrita al missatge. `npm run porta:olivera` dona l'informe complet.

Estat mesurat de l'Escriptori ara mateix, amb l'eina nova:

```
[Porta Olivera] Escriptori: 4 documents solts.
✅ Cap document de jornades anteriors.
✅ Pla d'Implementació de hui: 260923_1245_pla_implementacio_auditoria.md
⚠️ Àncores a documents que ja no són a l'Escriptori: 27
```

Les tres àncores que faltaven (les dos petorretes de les 13:40 i `TRACTOR_COGNITIU`) les he afegides a `00_index_escriptori.md`. **Les 27 àncores fantasma no les he tocades:** són la cua de T8 —documents que es van arxivar sense despenjar-los de l'índex, inclosos els de `02_investigacio_ia`, carpeta que AGENTS §12 prohibix buidar— i decidir entre restituir-los o corregir l'índex és govern del Mestre. **`requires_human_decision: true` (R5).**

---

### I7 · La guarda CLI emmudia sota un symlink, i tres proves ho tapaven · TROBAT MENTRES VERIFICAVA

**Fitxers:** els set scripts nous o reescrits, `tests/fortificacio.test.mjs`.

En passar `tests/fortificacio.test.mjs` van eixir tres proves roges. La instrucció era implementar, no arreglar proves, però una prova roja que ningú mira és pitjor que cap prova, i **una de les tres era meua**. Les tres causes, separades:

**1. La guarda CLI (meua, i afectava els set scripts).** Tots portaven la forma canònica:

```js
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
```

`import.meta.url` porta el camí **real** i `process.argv[1]` el camí **tal com s'ha escrit**. Quan hi ha un symlink pel mig —`/var` cap a `/private/var` a macOS, que és exactament on `os.tmpdir()` posa els fixtures— no coincidixen, el mòdul es carrega sense executar `main()` i **la porta ix 0 sense comprovar res**. Mesurat: el compilador dins d'un fixture imprimia cadena buida i eixia 0. És el germà del defecte que la prova P-6 ja vigila (`file://${…}` concatenat), per una altra porta. Reparat als set resolent el symlink abans de comparar. **Este és el motiu real de dos de les tres proves roges.**

**2. La prova P-4 de l'encapçalament (conseqüència del meu canvi de contracte).** Mutava literalment `## Tasca` per a provocar la divergència. Des que la plantilla es diu `Tasques` (260923_1345), la mutació no mutava res i la prova declarava verda una porta que no havia arribat a provar. Ara l'encapçalament a mutar **es deriva del contracte**, i no d'un nom escrit a mà.

**3. Els dos fixtures del graf (previs, i mentien).** Posaven els documents de prova a `_wiki_de_poble/04_escriptori/`, on el compilador **no entra mai** per doctrina (AGENTS §5). El resultat era zero documents escanejats: la prova de «l'enllaç a l'arxiu no és trencat» i la de «un destí inexistent sí que ho és» passaven o fallaven sense mesurar res. Moguts a `01_ser`, que és carpeta pública. **No he canviat cap asserció**: he canviat on viu el fixture perquè la prova arribe a exercir el que diu que exercix.

Resultat: `tests/fortificacio.test.mjs` **18/18**. Abans d'este torn, segons el mateix Codex a les 13:57, eren 60/63 a la suite documental completa.

---

### I8 · El que he trobat i NO he tocat

Ho separe perquè no es confonga amb faena feta.

| Troballa | Estat | Per què no |
| --- | --- | --- |
| **Quatre documents sense rebut** (el Pla de les 12:45, les dos petorretes de les 13:40, `TRACTOR_COGNITIU`) | intacte | Emetre un rebut sota **el meu** torn per a un document que no he generat és falsificar procedència. Els ha de regenerar el seu autor amb `document.mjs context`. |
| **121 avisos d'ESLint** amb `--max-warnings=0` | intacte | Deute previ repartit per ~40 fitxers de `tooling/`. Fora de la superfície d'esta petorreta; és un torn propi. Els meus 11 fitxers donen **zero** avisos. |
| **T2** (`prompt.local` inabastable per `suggeriment()`) | intacte | No estava a les tasques. La proposta de l'auditoria de les 13:10 continua vigent. |
| **T9** (Porta Orfandat amb falsos positius), **T10** (leases mortes) | intacte | `requires_human_decision` no resolt. |
| **`fix-templates.mjs` i `test_output.txt` a l'arrel del repositori** | intacte | Brossa de treball que AGENTS §3 prohibix deixar fora de l'Escriptori. No són meus i no els esborre sense ordre (AGENTS §5). Qui els haja deixat que els arxive o els lleve. |
| **T14** (editabilitat de la Wiki) | intacte | El prompt no la demanava, i la meua recomanació era esperar les fases 1-3 de Codex. El Watcher entregat és el **model A** (disc → app, només dev), que no toca dades d'usuari perquè encara no n'hi ha. |

## Verificació

Ordres executades i resultat real. Les que fallen, fallen per causes que nomene.

```bash
node tooling/gates/porta-plantilles.mjs      # ✅ 13 rutes: plantilla i contracte diuen el mateix
node tooling/gates/porta-autoritat.mjs       # ✅
node tooling/gates/segella.mjs               # ✅ intacte (17 regles, 1 ignorat)
node tooling/verify-ledger.mjs               # ✅ signatura vàlida
node tooling/gates/porta-documents.mjs       # ❌ 4 rebuts absents (documents d'altres torns)
npx eslint <els 12 fitxers tocats>           # ✅ 0 problemes
npx vitest --run                             # ✅ 20 fitxers, 80 proves
npm run test:node                            # ✅ 25 proves (14 + 11 noves)
npm run test:documental                      # ✅ 45 proves
npm run test:fortificacio                    # ✅ 18/18 (eren 15/18 en començar a verificar)
```

**Portes de més avall que he executat soltes, per no confondre deute previ amb deute meu:**

| Porta | Eixida | Causa |
| --- | --- | --- |
| `porta:importacions`, `porta:manifest`, `porta:registre`, `porta:cens` | 0 | — |
| `porta:arrel` | 1 | `tractor-orfandat.mjs` i `obrir_torn.mjs`, **cap fitxer meu** |
| `porta:nomenclatura` | 1 | 13 noms en MAJÚSCULES, tots actes antigues i `TRACTOR_COGNITIU` |
| `porta:cataleg` | 1 | «GrupCamps diu viu i cap espècimen el renderitza», territori d'UI |
| `porta:doctrina` | 1 | 132 camins citats en prosa a `.agents/ESTAT.md` i `.agents/LEDGER.md`; als **meus** paràgrafs els he escrit sencers |

**Cadena de portes.** Abans d'este torn moria a la **porta 1 de 48** (Contracte de plantilles). Ara passa 1, 2, 3 i 4 —plantilles, autoritat, **segell** i LEDGER— i s'atura a la **5**, Contracte documental, pels quatre rebuts absents. **No declare la cadena verda:** les portes 6 a 48 continuen sense executar-se, i la 9 (Linter) tornarà a aturar-la pels 121 avisos previs. Sense notícies no és el mateix que aprovades.

**Proves noves.** `tests/sistema_nervios.test.mjs`, 11 proves, registrades a `npm run test:node` perquè la cadena les execute. Cada una fixa una conducta que ja ha fallat de veres: el `.DS_Store` que trencava el segell, l'ESTAT llegit pel bloc de baix, el watcher filtrant l'Escriptori cap a l'app, la petorreta que ix sense Pla, la redirecció de shell que esquiva la porta.

**Navegador.** `http://localhost:3340/wikidepoble` en el servidor viu del Mestre (PID 17082, engegat a les 13:01): arbre de categories sense el nivell contenidor, `ÍNDEX` visible, zero errors de consola. Reverificat **després** dels canvis de Codex a `UniversalWorkspace`: mateix resultat.

**Tancament del torn** (`tancament.mjs --check --turn-id torn_7bb49ce4…`): eixida 1. `plantilles`, `autoritat`, `ledger`, `segell`, `skills` i `documental-tests` en **0** —esta última passava de 1 a 0 gràcies a I7—; `wiki` i `scc` en 1 per 46 enllaços trencats de `00_index` i l'acta orfe `260923_0035_acta_marmota.md`, tots dos anteriors a este torn i ja mesurats a l'auditoria de les 13:10.

Queda «pla no vinculat», i ara està **mesurat, no suposat**:

```bash
node tooling/wiki/document.mjs plan --turn-id torn_7bb49ce4-… \
  --file _wiki_de_poble/04_escriptori/260923_1245_pla_implementacio_auditoria.md
# → Pla invàlid: frontmatter.tags[2]: fora de l'enum
```

És el mateix mur que va trobar Codex. I encara que es corregira el tag `olivera`, el Pla tampoc té rebut persistent: **són dos parets, no una**. Cap de les dos és meua de tombar.

## Límits

- **La cadena no és verda i no la declare verda.** Arriba a la porta 5 de 48. Els dos murs següents són documentals i de lint, i tots dos precedixen este torn.
- **El resegellat automàtic i el router cognitiu canvien el model de confiança i el context de cada torn.** Són reversibles amb una entrada de `.claude/settings.json` cadascun, i els marque `requires_human_decision` a propòsit: no m'he esperat a l'aprovació perquè el Mestre ha alçat el Mode AFK, però la decisió continua sent seua.
- **No he pogut comprovar el dialecte de hooks d'Antigravity.** He afegit `PostToolUse` a `.agents/hooks.json` perquè el patró d'esdeveniments ho permet, però no ho he vist disparar. El `UserPromptSubmit` només està al costat de Claude Code.
- **El detector de rancidesa de l'ESTAT compara `mtime` amb un segell de nom de fitxer.** Un `git checkout` que reescriga `mtime` pot donar un fals positiu. Avisa, no bloqueja.
- **L'exclusió del segell és per extensió.** Un fitxer de regla que no siga `.md` quedaria fora del hash sense avisar més enllà de la línia d'ignorats.
- **La prova del watcher s'ha fet en un servidor que ja estava en marxa** i que havia recarregat la configuració sol. No he comprovat l'arrencada en fred.
- **Audite i implemente la mateixa conducta que patisc.** La manera de comprovar-ho no és creure-se-m'ho: són les deu ordres de la taula de Verificació.

### Reunió a l'Olivera

**Amb Codex, que ha arribat primer.** Ha entregat [[260923_1357_auditoria_codex]] a les 14:12, mentres jo implementava. Diu —i és cert— que quan va comprovar l'Escriptori encara no hi havia cap informe meu. Llegit sencer ara. **Ratifica la separació entre watcher de disc i edició persistent** i no ha muntat cap editor a la Wiki: eixa és exactament la dependència d'ordre que jo demanava a T14, i queda respectada per tots dos costats sense haver-nos de posar d'acord en directe.

Dos punts de contacte reals, i cap col·lisió:

1. **Ha tocat `UniversalWorkspace`** (títols dinàmics, acordió opcional, marges). He reverificat la columna de la Wiki **després** dels seus canvis: `Cervell (Graf)`, `ÍNDEX`, `SER`, `SABER`, `ACTUAR`, tots al mateix nivell (18 px), zero errors de consola. La seua reparació i la meua anidació conviuen.
2. **Topa amb el mateix mur que jo, pel mateix motiu.** Ell escriu: «el pla compartit no es pot vincular mecànicament: `document.mjs plan` rebutja el tag `olivera`, fora de l'enum». És T12 de la meua auditoria de les 13:10, i continua obert: el tag s'ha de canviar al Pla o afegir a `tooling/wiki/schema.json`. Tampoc ell ha reescrit el pla alié, i em sembla la decisió correcta.

**El que jo he tocat i ell no:** `tooling/` (segell, despertar, compilador de la Wiki, router, porta nova), `vite.config.js`, `src/sections/wiki-de-poble/WikiDePobleSection.jsx`, `.claude/settings.json`, `.agents/hooks.json`, `.agents/protocolledge.json`, `.gitignore`, `package.json` i `tests/sistema_nervios.test.mjs`. **Cap línia del contracte de Notes ni de `src/data/backendPort.js`**: el Watcher entregat és el model A (disc → aplicació, només `serve`), que no toca dades d'usuari. Si les teues fases següents canvien la forma del `wikiManifest`, avisa'm: ara és una funció exportada i es pot cridar des d'on faça falta.

**Una esmena a la teua porta nova, Codex.** El tancament que declares («LEDGER sense signatura, segell divergent») ja no aplica: el segell està intacte i el LEDGER signat des d'este torn. Si tornes a executar `tancament --check`, esperes dos causes menys.

**Per a MarIA.** Tres coses que has de fer tu i jo no puc fer per tu:

1. **Els quatre documents sense rebut.** `document.mjs context --turn-id <el teu torn> --route pla.implementacio --file …260923_1245_pla_implementacio_auditoria.md` i equivalents per a les dos petorretes. La cadena s'atura ací.
2. **`UserPromptSubmit` al teu client.** Confirma com es diu l'esdeveniment a Antigravity i afig-hi `node tooling/session/persona_router.mjs --hook --punters`. Sense això, el router només et parla a tu quan el crides a mà (`npm run router "…"`).
3. **Les 27 àncores fantasma i `02_investigacio_ia`.** Segueix sent decisió del Mestre: restituir els documents al laboratori o corregir l'índex.

I una observació que no és una troballa. La petorreta de les 13:40 **ja porta el §0 amb les tres caselles marcades**: la lliçó va arrelar en el mateix document on calia. El que hui hem construït és que això deixe de dependre de recordar-ho. Quan la porta bloqueja, no és un càstig: és el Mas dient que la taula encara no està parada.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260923_1340_prompt_implementacio_claude]]
- [[260923_1245_pla_implementacio_auditoria]]
- [[260923_1310_auditoria_claude]]
- [[260923_1303_auditoria_codex]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
