---
type: informe
status: esborrany
description: 'Auditoria de només lectura de la Gàbia (hooks, segell, executor), les 21 skills, les 13 plantilles i la Wiki publicada: contradiccions, esbandida i mapa temàtic 8x8.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_b0e47896-3370-462d-b4d2-534031c294a5:f3263dae-e075-48b3-9d11-13e167b3821c
---
# Auditoria de fortificació: Gàbia, skills, plantilles i mapa temàtic 8x8

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_b0e47896-3370-462d-b4d2-534031c294a5:f3263dae-e075-48b3-9d11-13e167b3821c |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-24T04:52:01.349Z |
| Modificació | 2026-09-24T05:20:00Z |
| Propietari | agent-local (Claude) |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Ruta | `auditoria` |
| Torn | `torn_b0e47896-3370-462d-b4d2-534031c294a5` · abast `documents` · obert 04:51:37Z |
| Tall d'evidència | HEAD `5eee1293`, arbre brut (`git status --short` al principi del torn); disc llegit entre 04:41Z i 04:52Z |
| Segell al tall | ❌ hash actual `455a0fad` ≠ segellat `88f0ec03` |
| Petorreta origen | `260924_0630_prompt_fortificacio_opus.md` · pla `260924_0645_pla_implementacio_opus.md` |
| Mode AFK | **sí · zero línies de codi tocades**; l'únic fitxer escrit és este |
| requires_human_decision | **true** (G-01, G-10, F1–F9, C-01, C-04, W-01 i tota la migració d'etiquetes) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`). S'ha demanat mode Ultracode (multiagent); no s'ha pogut executar (G-02) |
| Tokens consumits | Mesurats: l'entorn no me'ls exposa. Estimació d'ordre de magnitud: ~450k d'entrada llegida, ~45k d'eixida. No és una mesura |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

Llegida sencera la plantilla que ha retornat `document.mjs context --route auditoria` abans de `create`. Llegits abans d'auditar: `AGENTS.md`, `_wiki_de_poble/01_ser/02_genotip.md` i `_wiki_de_poble/00_index.md` (les tres lectures obligatòries del Context de la petorreta), `.agents/protocolledge.json`, `tooling/wiki/schema.json`, el Pla de MarIA (`260924_0645_pla_implementacio_opus.md`) i la petorreta (`260924_0630_prompt_fortificacio_opus.md`).

**Dada de l'auditoria, no disculpa:** la petorreta demana el mode Ultracode (orquestració de molts agents). No ha sigut possible. El hook `PreToolUse` ha denegat `Agent`, `Workflow` i `Skill`, i també la cerca de transcripcions que necessitava per a recuperar els «64». Tot este informe s'ha fet amb `Read`, fitxer a fitxer, i amb les poques ordres de shell que la política admet. És la primera evidència de la Missió Gàbia (G-02), i l'he patida en primera persona.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **v1.0.0 (260924_0652):** primera entrega. Set blocs de troballes (Gàbia, govern, producte i disseny, skills, plantilles, Wiki publicada, esbandida), mapa temàtic 8×8 i proposta de millora de `prompt_local.md`. Cap troballa ha passat per refutació creuada: no hi ha hagut subagents ni una segona IA a l'Olivera en el moment d'entregar.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum executiu

1. **La Gàbia no és estreta: hui està tancada del tot, i té una causa concreta.** La skill `core-taxonomia-estricta` (la que va proposar Fable) s'ha instal·lat a `.agents/skills/` sense passar pel segell. El segell ha caigut (`455a0fad` ≠ `88f0ec03`). Amb el segell caigut, l'executor de governança refusa qualsevol escriptura. `segell-auto` retorna un «blocking error» darrere de cada eina, lectures incloses. I la reconciliació només la pot executar una persona des d'un terminal (G-01).
2. **Encara amb el segell sa, el hook bloqueja justament les eines que no escriuen res.** Són `Agent`, `Workflow`, `Skill`, les eines MCP i la shell de lectura (`ls`, `grep`, `find`, `date`). En este client, a més, `Glob` i `Grep` no existixen. L'efecte és que cap agent pot verificar: `npm test`, `npm run lint`, `npm run porta` i `tancament.mjs --check` estan denegats. **La Gàbia impedix la seguretat que vol protegir**: obliga a lliurar codi sense provar (G-02 a G-05).
3. **Almenys dotze skills i plantilles manen executar ordres que la Gàbia denega.** Qui seguix una skill al peu de la lletra falla al primer pas. Cap porta comprova la coherència entre el que diu una skill i el que permet la política (S-02).
4. **L'autoritat té tres capçaleres i el Consell té cinc descripcions.** `AGENTS.md` diu que és l'únic original, `QUI_SOC.md` diu que el substituïx i `cervell.json` ni tan sols carrega `QUI_SOC.md`. Els rols i els models de cada IA canvien segons el document (C-01, C-05).
5. **La Wiki publicada porta tres capes de dany.** Una substitució global `Offline→Online` ha capgirat el sentit d'ADRs canònics. El cos de molts documents comença amb `\n` literals. Hi ha `BROKEN LINK`/`TODO` servits a producció. I dos documents estratègics amb noms de persones i dades econòmiques estan al manifest que servix la Wiki integrada (D-06, W-01, W-06).
6. **Els «64» no s'han pogut recuperar.** No en queda rastre en cap fitxer que haja pogut llegir, i la cerca de transcripcions està denegada. Propose un mapa **8×8 = 64** nou, declarat com a reconstrucció i no com a recuperació, i l'aplique als 68 documents publicats, a les 21 skills i als documents de govern (bloc H).

---

### A · La Gàbia: què ens bloqueja, per què i com obrir-li portes sense llevar-li les parets

#### G-01 · P0 · El segell està trencat per una skill instal·lada fora del circuit, i ningú de la família el pot reparar

- **Evidència reproduïble:**
  - `node tooling/gates/segella.mjs` → `❌ [Llei Z] Ruptura de segell detectada! El hash actual 455a0fad no coincideix amb el segellat 88f0ec03.`
  - `.agents/SKILLS_SEAL.json` (segellat a `2026-09-24T02:54:33Z`, transacció `d60e076e…`) enumera 21 fitxers. `.agents/skills/core-taxonomia-estricta/SKILL.md` **existix al disc i no és al manifest**. Com que el hash combinat inclou la llista de rutes, eixa alta, per si sola, ja trenca el segell. No puc descartar que hi haja altres fitxers canviats: el `--json` de `segella.mjs` no està admés i cap eina permesa calcula hashes.
  - El fitxer està versionat (no apareix a `git status --short`). No puc veure en quin commit va entrar perquè `git show` està denegat. El missatge de `5eee1293` («…U18, U01, i taxonomia») apunta a eixe commit, però és inferència.
- **Conseqüència en cadena (llegida al codi):**
  1. `tooling/gates/executor-mutacio.mjs:42` → `if (!verificaSegell(root).ok) throw new Error('Segell previ invàlid; reconciliació explícita requerida')`. Amb el segell trencat, **cap** escriptura de governança és possible, ni tan sols amb lease.
  2. `tooling/gates/segell-auto.mjs:16` llança a cada `PostToolUse` i `PostToolUseFailure`. En esta sessió he rebut l'avís «hook blocking error» darrere de **totes** les crides, incloses més de 60 lectures.
  3. La reconciliació és `segella.mjs --update --expected-hash=… --expected-previous=… --reason=…` (`PROTOCOL_PETORRETA.md` P-14). La política de lectures només admet la cadena exacta `node tooling/gates/segella.mjs` (`mutation-policy.mjs:44`), i `npm run porta:segella:update` no porta els paràmetres CAS. Per tant, **cap agent la pot executar**.
- **Font de veritat en conflicte:** `PROTOCOL_PETORRETA.md` P-14 i la mateixa skill, que a la §3 adverteix que saltar-se l'estructura «farà caure la gàbia». La skill és, literalment, la que l'ha feta caure.
- **Proposta conservadora (runbook humà, en este ordre):**

```bash
node tooling/gates/segella.mjs --json
```

  Mira el `manifest` actual contra `.agents/SKILLS_SEAL.json` i confirma quins fitxers han canviat. Després decidix què fas amb `core-taxonomia-estricta` (vegeu S-04). Si la mantens, primer completa-li el frontmatter (`type`, `status`) i després reconcilia:

```bash
node tooling/gates/segella.mjs --update --expected-hash=HASH_ACTUAL_COMPLET --expected-previous=88f0ec03b3910a6e95785b3a3e0e67a69170357a319a5c005474e0eec148104d --reason="Alta revisada de core-taxonomia-estricta 260924"
```

  `requires_human_decision: true`.

#### G-02 · P0 · El `PreToolUse` sense `matcher` denega totes les eines que no coneix, incloses les que no escriuen res

- **Fitxer:** `.claude/settings.json:32-42` (sense `matcher`), `tooling/gates/hooks-local.mjs:85`.
- **Mesurat en esta sessió:**

| Eina | Resultat | Escriu al repositori? |
| --- | --- | --- |
| `Read` | ✅ passa | no |
| `ToolSearch` | ✅ passa (U01 d'ultracode, aplicat) | no |
| `Agent` | ❌ BLOQUEIG | no, per si sola |
| `Workflow` | ❌ BLOQUEIG | no, per si sola |
| `Skill` | ❌ BLOQUEIG | no: només carrega instruccions |
| `mcp__ccd_session_mgmt__search_session_transcripts` | ❌ BLOQUEIG | no |
| `Glob`, `Grep` | no existixen en este client (`ToolSearch select:Glob,Grep` no els retorna) | — |

- **Conseqüències:**
  - `mutation-policy.mjs:53` autoritza `Glob` i `Grep`, dues eines que ací no existixen, i nega la shell per on es cerca de veres. **La política autoritza el que no hi ha i prohibix el que hi ha.**
  - Els 16 symlinks de `.claude/skills/` no servixen de res, perquè l'eina `Skill` que els carrega està denegada. L'única via que funciona és el Router cognitiu del `UserPromptSubmit`, que dona rutes i no contingut.
  - Els subagents no són cap perill que calga parar ací: el hook del projecte també s'aplica a les seues crides de `Bash`/`Write`/`Edit`. Bloquejar `Agent` no afig cap protecció, però sí que lleva tota la capacitat de revisió creuada.
- **Font de veritat en conflicte:** `PROTOCOL_PETORRETA.md` P-01 («la lectura, cerca, auditoria en memòria i impressió per stdout són lliures») i Genotip 7 («la màquina fa el treball que té autoritat i eines per fer»).

#### G-03 · P0 · La shell de lectura és una llista tancada de dotze cadenes exactes

- **Fitxer:** `tooling/gates/mutation-policy.mjs:43-68`. Només passen `pwd`, cinc ordres `git` exactes, set ordres `node` exactes i `npm run porta:*` quan l'script coincidix amb una d'eixes set.
- **Mesurat:** `ls _wiki_de_poble/04_escriptori` → BLOQUEIG. `node tooling/gates/tancament.mjs --check --turn-id …` → BLOQUEIG. `cd … && …` → BLOQUEIG. Tampoc passen `find`, `grep`, `date`, `shasum`, `git show`, `git ls-files` ni `git config`.
- **Conseqüència:** un agent no pot llistar un directori. Per a fer este inventari he hagut de llegir `src/data/wikiManifest.js` sencer i el fitxer d'inventari del torn.

#### G-04 · P0 · La verificació està prohibida, i això obliga a lliurar sense provar

- `npm test`, `npm run lint`, `npm run porta` i `node tooling/gates/tancament.mjs --check` no són a la llista.
- **Fonts que manen fer-ho i ara són inexecutables:** `sdp-workflow` §3 («és imperatiu executar els tests»), `core-edicio-segura` pas 4 («executa `npm test run` IMMEDIATAMENT»), `AGENTS.md` §4 i `QUI_SOC.md` §6 (tancament), i `wiki-cicle-de-vida` pas 8.
- **Evidència històrica:** l'ESTAT de 260924_0600 (Claude, Tractor) diu literalment que no s'ha executat cap prova per problemes d'eines. Es va lliurar codi de producte (C14, U04–U09) **sense cap prova executada**. La Gàbia no va impedir l'escriptura: va impedir la comprovació.

#### G-05 · P1 · La governança només s'escriu amb una lease que cap agent pot obrir

- `mutation-policy.mjs:6,15` → `.agents/**`, `tooling/**`, `.claude/**`, `.husky/**`, `scripts/**`, `AGENTS.md`, `CLAUDE.md` i `package.json` queden fora de l'eina directa.
- La via legal és `executor-mutacio.mjs PLA.json REBUT.json`, però per a arribar-hi calen tres coses i les tres estan tancades:
  1. Un rebut `governance-write` que emet `tooling/wiki/reflex_petorreta.mjs open/seal`, **que no és a la llista**.
  2. Un pla amb el SHA-256 `before` de cada fitxer. **Cap eina permesa calcula hashes.**
  3. Un segell sa (G-01).
- **Conseqüències directes:**
  - La **REFLEX DE CORRECCIÓ** del `CLAUDE.md` mana escriure la lliçó a `.agents/skills/<skill>/SKILL.md` i una línia a `.agents/LEDGER.md`. Són dos camins que el hook prohibix. La norma de correcció és inexecutable per a qualsevol agent.
  - `AGENTS.md` §4 obliga a actualitzar `.agents/ESTAT.md` abans de donar cap tasca per acabada. Tampoc es pot. Cap torn d'agent pot arribar a `closed` per mitjans propis. (Els relleus que hi ha a l'ESTAT els ha escrit algú fora de la Gàbia.)
  - `hooks-local.mjs:31` rebutja tot `Delete` i tot `Move` d'`apply_patch`, i `porta-olivera.mjs --arxiva` no és a la llista. **Cap agent pot arxivar res per l'eina.** D'ací ve que l'arxivat es faça «a mà» i deixe àncores fantasma (ho reconeix el mateix índex de l'Escriptori, secció «Relleu arxivat a mà»).

#### G-06 · P1 · `segell-auto` crida «blocking error» després de cada eina i no pot desfer res

- Un `PostToolUse` ja arriba tard: l'escriptura ja s'ha fet i no la pot desfer (Codex ho va dir a U02). Retornar codi 2 només posa l'etiqueta «blocking error» a una crida que ha anat bé.
- **Hipòtesi per a «`write_to_file` de vegades rebutja accions bàsiques» (MarIA), no verificada:** si Antigravity llig l'eixida 2 del post-hook com una fallada, cada escriptura bona es veu com una fallada mentre el segell està trencat. `.agents/hooks.json` declara textualment «consumidor Antigravity no acreditat. Cap garantia d'activació», i no ho puc comprovar des d'ací.

#### G-07 · P1 · El dialecte d'Antigravity: les edicions per línies es rebutgen sempre

- `tooling/gates/porta-reflex.mjs:38`: «Edició per línies no suportada; envia el document complet». Un `replace_file_content` amb `StartLine`/`EndLine` sobre un document protegit falla **sempre**. És una segona candidata forta a explicar la queixa de MarIA.
- **Contraevidència que cal tindre present:** `260924_0630_prompt_…` i `260924_0645_pla_…` són al disc **sense rebut**. Si el pre-hook s'haguera executat, `porta-reflex` els hauria rebutjat (és el mateix validador que `porta-documents` usa per a marcar-los en roig). Per tant, eixes dos escriptures d'Antigravity no van passar pel hook. O el hook d'Antigravity no sempre s'activa, o van entrar per una altra via. No ho puc resoldre sense veure el client.

#### G-08 · P1 · El pre-commit exigix tot el verd i empenta cap a saltar-se'l

- `.husky/pre-commit` → `tooling/gates/git-staged.mjs`. Cada commit exigix:
  - un rebut Reflex `git-commit`;
  - `porta-documents --staged`;
  - `tancament.mjs --check`;
  - els 59 passos de `run-portes.mjs`, que paren al primer roig (U17);
  - `npm run lint`;
  - la suite sencera de Vitest, dins d'un arbre materialitzat.
- Amb els rojos coneguts (el segell, Doctrina 155, el deute de skills i Wiki), **cap commit legítim pot passar**. Tot i això, `5eee1293` va versionar una skill que trenca el segell. **Inferència, no verificada** (`git config core.hooksPath` està denegat): o el hook es va saltar (`--no-verify`) o no estava actiu. En tots dos casos, l'última xarxa (P-09) s'ha convertit en el forat.

#### G-09 · P2 · El missatge d'error recepta el remei equivocat

- Quan el hook denega `Agent`, `Workflow`, `Skill` o `ls`, l'eixida afig sempre «Recuperació: node tooling/wiki/document.mjs context … create …» (`hooks-local.mjs:14`). Eixe circuit no té res a vore amb una eina d'orquestració. Un agent que obeïx el missatge obri torns i rebuts que no li servixen de res, i torna a xocar. Així naix la sensació de «búnquer».

#### G-10 · P1 · La Gàbia també tanca la memòria de Claude entre sessions

- **Mesurat al final d'este torn:** un `Write` a `~/.claude/projects/…/memory/` (la memòria persistent de Claude per a este projecte, fora del repositori) → `[HOOKS-LOCAL] BLOQUEIG · Ruta fora del repositori`.
- **Conseqüència:** encara que hui haguera trobat i entès la llista dels «64», no la podria haver deixada escrita per a la sessió següent. La petorreta demana recuperar coses «de la teua memòria». Eixa memòria només existix si algú la pot escriure, i la Gàbia ho impedix.
- **Proposta:** afegir eixa ruta concreta (i només eixa) a les destinacions permeses de `hooks-local.mjs`, o bé acceptar que la memòria entre sessions viu només a la Wiki i a l'Escriptori, i dir-ho a les petorretes (J-3). `requires_human_decision: true`.

#### Diagnòstic de conjunt

La Gàbia barreja **quatre classes d'acció** i les tracta totes com si foren una mutació:

| Classe | Exemples | Risc real per al repositori | Tracte hui | Tracte proposat |
| --- | --- | --- | --- | --- |
| Orquestració | `Agent`, `Workflow`, `Skill`, `ToolSearch`, preguntes a l'humà | cap per si soles; les seues crides passen pel hook | denegades | lliures |
| Lectura | `ls`, `grep`, `find` sense `-exec`/`-delete`, `git log/show/diff` sense `--output`, `shasum` | cap | denegades | lliures, amb anàlisi d'argv |
| Verificació | `npm test -- --run`, `npm run lint`, `npm run porta`, `tancament.mjs --check` | derivats temporals (P-12 ja els admet) | denegades | carril propi, resolt des de `package.json` protegit |
| Mutació | `Write`/`Edit` a governança, moviments, esborrats | alt | lease + executor, però inabastables | lease assistida amb aprovació humana per hash |

El model d'amenaça declarat és P-09: el control local protegix contra l'oblit i la corrupció accidental, no contra un agent adversarial. Amb eixe model, denegar lectures i verificacions **no redueix cap accident**, i sí que n'afavorix un: el codi que es lliura sense provar.

#### Proposta: la Gàbia amb portes (de menys a més cost)

Tot el que ve ara toca `.claude/`, `.agents/` o `tooling/`. Ho ha de fer el Mestre o qui tinga lease. `requires_human_decision: true`.

1. **F1 · Matcher al `PreToolUse` (1 línia).** A `.claude/settings.json`, posar `"matcher": "Bash|Write|Edit|MultiEdit|NotebookEdit"` a l'entrada de `hooks-local.mjs`, i l'equivalent de `toolNames` a `.agents/hooks.json`. L'orquestració i la lectura queden lliures; cada subagent continua passant pel mateix hook en cada `Bash`/`Write`/`Edit`. Queda un risc residual: si algun dia s'instal·la un MCP que escriga fitxers, caldrà afegir-lo al matcher.
2. **F2 · `segell-auto` informa, no crida (3 línies).** Amb el segell trencat, eixida 0 i `additionalContext` una sola vegada per sessió. L'eixida 2 queda només per a un `PostToolUse` d'una eina mutadora que haja trencat el segell en eixa mateixa crida.
3. **F3 · Carril de verificació.** Admetre `npm test -- --run`, `npm run lint`, `npm run porta`, `node tooling/gates/tancament.mjs --check --turn-id ID` i `node --test tests/…`. Cada `npm run X` es resoldria contra una llista fixada, com ja es fa amb `porta:*`, i `package.json` continua sent governança protegida.
4. **F4 · Lectura per argv, no per cadena.** Admetre `ls`, `rg`/`grep`, `find` sense `-exec|-delete|-ok|-fprint`, `cat/head/tail/wc`, `sed -n` sense `-i`, `git log|show|diff|ls-files|rev-parse|blame` sense `--output`, `shasum -a 256` i `date`. Els pipes, només entre ordres de la llista. Amb proves adversarials: la R1 de Codex (`git diff --output`) n'és el primer cas.
5. **F5 · Ajudant de hash.** `node tooling/gates/hash.mjs RUTA`, de només lectura. Sense ell, cap agent pot compondre un pla per a l'executor.
6. **F6 · Lease assistida.** Que l'agent puga fer `reflex_petorreta.mjs open`, i que `seal` exigisca l'aprovació humana d'un hash curt (el patró `aprova <12 caràcters>` que ja fan servir les Plaquetes). L'humà continua dins del bucle, però sense haver d'anar al terminal.
7. **F7 · `document.mjs relleu`.** Un apèndix validat i només d'afegir a `ESTAT.md` i `LEDGER.md`, vinculat al torn. Així `AGENTS.md` §4 i la REFLEX DE CORRECCIÓ tornen a ser executables.
8. **F8 · `document.mjs install-skill`.** En una sola transacció CAS i amb aprovació humana: valida l'esquema, escriu el `SKILL.md`, regenera `skills_index.json` i `00_INDEX_SKILLS.md`, crea el symlink de `.claude/skills/` i torna a segellar. És exactament el que va faltar amb `core-taxonomia-estricta`.
9. **F9 · Dos carrils al pre-commit.** Un documental (`porta-documents`, `orfandat`, segell) i un de codi (el complet). La CI continua sent la xarxa final. Respon la pregunta oberta del Pla: «domesticar Husky sense obrir-la de bat a bat».

Ordre recomanat: **G-01 (runbook) → F1 → F2 → F3**. Només eixos quatre passos ja haurien permés fer esta auditoria amb subagents i proves.

---

### B · Contradiccions de govern i autoritat

#### C-01 · P1 · Tres capçaleres constitucionals

- `AGENTS.md` §15: «`AGENTS.md` de l'arrel és l'únic original constitucional».
- `.agents/QUI_SOC.md` (última línia): «Aquest document reemplaça i fusiona BOOTSTRAP, AGENTS, BIOS i BASELINE».
- `.agents/cervell.json` → `entrada` comença per `AGENTS.md` i `.agents/BOOTSTRAP.md` i **no inclou `QUI_SOC.md`**. En canvi, `CLAUDE.md` l'importa en primer lloc.
- `.agents/BOOTSTRAP.md`, `.agents/BASELINE.md`, `.agents/BIOS.md` i `.agents/PROFILE.md` continuen existint i marcats `canonic`. La fusió que anuncia `QUI_SOC.md` no s'ha fet.
- **Proposta:** decidir-ne un. La proposta conservadora és mantindre `AGENTS.md` com a constitució i rebaixar `QUI_SOC.md` a document d'identitat enllaçat, llevant-li la frase «reemplaça». `requires_human_decision: true`.

#### C-02 · P1 · Tres punters a la skill equivocada

- `AGENTS.md` §13: «[Acte Reflex](.agents/skills/sdp-workflow/SKILL.md)». L'Acte Reflex és `wiki-documentacio-i-reflex`.
- `.agents/BOOTSTRAP.md` §2: «Si has de tocar disseny… llegir la llei a `.agents/skills/sdp-workflow/SKILL.md`». La llei de disseny és `sdp-pedra-seca`.
- `sdp-workflow` §2 remet a «principis de disseny matemàtics descrits a `.agents/skills/sdp-workflow/SKILL.md`», és a dir, a si mateixa.
- `doc_governanca` (Wiki, norma canònica): jerarquia de veritat, punt 3 → `.agents/skills/socdepoble-workflow/SKILL.md`, que no existix.

#### C-03 · P1 · La Regla 0 nomena una plantilla i mana copiar-ne el frontmatter equivocat

- `AGENTS.md` §0.1 nomena `prompt_local.md` per a «qualsevol prompt, auditoria, petorreta o bundle», i n'hi ha tretze rutes.
- §0.2 mana heretar «tots els camps obligatoris» del frontmatter de la plantilla. Però el frontmatter de qualsevol plantilla és `type: plantilla`. El frontmatter d'eixida viu dins del comentari `SDP:EIXIDA`, i `document.mjs create` ja l'escriu tot sol. Qui seguix la Regla 0 al peu de la lletra produïx un document `type: plantilla` que el contracte rebutja.
- **Proposta:** reescriure §0 en dos línies: «Obri torn i demana `document.mjs context --route RUTA`; crea amb `create`. No copies el frontmatter de la plantilla.»

#### C-04 · P1 · Qui pot escriure codi

- `core-automillora` §2.1: MarIA és «l'ÚNICA entitat amb permís per escriure, esborrar o modificar codi»; Claude i Codex «NO tenen permisos d'edició».
- En contra: l'ESTAT de 260924_0145, 0420 i 0600 (Codex i Claude implementen codi de producte amb autorització del Mestre), l'Acta 260924_0500 («Claude assumisca el rol de Tractor»), `prompt_local` (Olivera: «cap línia de codi… fins que el Pla estiga consensuat», que admet implementació després) i `core-consell-i-colmena` §2 (Cowork, «s'ha d'evitar excepte…»).
- `requires_human_decision: true`. És la regla que decidix qui és Tractor.

#### C-05 · P2 · El Consell té cinc descripcions i cap coincidix

| Font | Claude | Codex |
| --- | --- | --- |
| `QUI_SOC.md` §7 | narrativa, to valencià, filosofia | segona opinió, estructuració |
| `.agents/consell.json` | Seient Núm. 5 · auditor sènior i estil | segona opinió generalista; «GPT-5.6 Sol Medio» |
| `core-consell-i-colmena` §1 | Mestre d'Obra / Disseny, UI/UX, CSS | Arquitecte Lògic, backend |
| `core-estrategia-ia` §2 | «Opus 5 Max»: arquitectura, forense, seguretat | «GPT-6 Astra Ligero»: execució |
| Wiki `agents_equip_ia` | filòsof, nucli psicològic de la IAIA | fonament inicial |

- A més:
  - `core-consell-i-colmena` §1 **deixa fora Qwen**, i això incomplix la regla d'enumeració de `consell.json` («ha de posar-les totes 12»).
  - La §3 posa Z.ai, la d'«ingesta massiva», a l'**Equip Micro** («<1MB»).
  - La §5 porta dades de consum caducades («es reinicia… aproximadament el 24 de setembre») i diu «Fable (Claude 3.5 Haiku)». El Pla de hui firma com a «Gemini Fable».
  - La «REGLA SAGRADA» mana `node -e "…require('./.agents/consell.json')…"`, que la Gàbia denega (S-02).
- **Proposta:** `consell.json` com a font única; les skills i la Wiki en citen el rol, no el reescriuen; les dades de consum fora de les skills.

#### C-06 · P2 · L'arxiu històric: es llig o no es llig, s'esborra o no s'esborra

- `AGENTS.md` §5: mai llegir `90_arxiu_historic/` en RAG automàtic; no esborrar, sinó moure a quarantena.
- `memoria_aprenentatges`, Lliçó 10: el que no aporta «**s'elimina del sistema (esborrat definitiu)**». Lliçó 11: l'arxiu ha de ser «completament PLA» i la IA hi entra «per fer neteja (esborrar els documents vells)». La pràctica real el desmentix: `90_arxiu_historic/260924_Auditoria_Fable/` i `260924_Auditoria_Claude_Olivera/` són subcarpetes.
- `sdp-workflow` §0 mana consultar `_wiki_de_poble/90_arxiu_historic/260918_Sessio_Tancada/02_investigacio_ia/00_TARGET_SKILLS.md`, és a dir, llegir l'arxiu.
- La descripció de `core-memoria-historica` diu que «regula l'arxivament segur cap a `_arxiu_wiki_de_poble`». El cos ho prohibix, i `PROTOCOL_PETORRETA.md` P-10 també: prohibit escriure-hi.

#### C-07 · P2 · La neteja de l'Escriptori té quatre versions i cap és executable

- `AGENTS.md` §12: «No s'ha de buidar cegament l'Escriptori».
- `wiki-documentacio-i-reflex`, lliçó 260922: «cap arxivat automàtic». Lliçó 260923: «HA DE netejar els arxius antics… deixar-lo impecable».
- `prompt_local` §0: «les auditories velles… s'han d'haver mogut a `90_arxiu_historic/`».
- `core-higiene-escriptori` (instal·lada) mana `node tooling/gates/porta-olivera.mjs` sense bandera i `ls -l`: tots dos denegats. La versió nova pendent (`02_investigacio_ia/260924_0200_skill_core_higiene_escriptori.txt`) mana `porta-olivera.mjs --arxiva` i `npm run porta:orfandat`: tots dos denegats. A més, té un frontmatter sense `type` i un `reflex:` fals («document.mjs actiu i signat»).

#### C-08 · P2 · Noms: `petorreta`, majúscules i cognoms

- **`petorreta`:** `schema.json` admet `type: petorreta` i la ruta `bundle` en produïx. `memoria_aprenentatges` Lliçó 9 diu que `type: petorreta` és un error. La Lliçó 11 prohibix la paraula per a categoritzar fitxers. La versió `.txt` de l'higiene la compta com a categoria transitòria.
- **Majúscules contra `AGENTS.md` §2:**
  - `sdp-estudi-mercat`: `04_ESCRIPTORI/01_Produccio/AAMMDD_HHMM_mercat_NOMCOMPETIDOR.md`;
  - `core-consell-i-colmena` i `bundle.md`: `MACRO_PROMPT`;
  - `QUI_SOC.md`: `00_Bandeja_d_Entrada`, `01_Produccio`;
  - `memoria_aprenentatges`: `00_INDEX_ARXIU`;
  - `01_identitat`: `02_saber/GLOSSARI.md`, que no existix (n'hi ha un a `src/GLOSSARI.md`);
  - `estudi_consell.md`: `YYMMDD_HHMM_estudi_[nom_ia].md`.
  A Linux la caixa importa (vegeu la memòria «la caixa en minúscules apaga portes a la CI»).
- **Cognom del pla:**
  - la plantilla `pla_implementacio.md` diu `aammdd_hhmm_pla_titol.md`;
  - la lliçó 260922 diu `…_pla_implementacio_<mateix cognom que la petorreta>`;
  - el pla d'ara és `260924_0645_pla_implementacio_opus.md` per a la petorreta `260924_0630_prompt_fortificacio_opus.md`, i el cognom no casa.

#### C-09 · P2 · La plantilla d'acta demana justament el que la skill de tancament prohibix

- `acta.md` demana `{{ESTAT_HUMA}}` («Agobiat, creatiu, furiós, productiu, exhaust») i un «Temps estalviat (avaluació relativa)».
- `wiki-cicle-de-vida`: «No inventes mètriques d'eficiència ni d'estat humà».
- `memoria_aprenentatges` §4 exigix «Temps de Durada» i una «anàlisi psiquiàtrica» de cada acta. Són tres normes per a un mateix document.

#### C-10 · P2 · La Wiki té quatre taxonomies i nomena carpetes que no existixen

- «4 pilars + 2 zones»: `00_arquitectura_tecnica_unificada`, `00_visio_i_pilars`, `successio_lazaro_execucio`.
- «6 carpetes»: les reals.
- «8 dimensions»: `cervell.json` i `00_index_identitat`.
- `successio_lazaro_execucio` diu «huit dimensions» a «Mapa vigent» i «l'arquitectura vigent és 4+2» a «Annex». El mateix document afirma totes dues coses.
- Carpetes fantasma citades com a vigents: `03_GOVERNAR`/`03_govern`, `00_SER`, `01_SABER`, `02_ACTUAR`, `04_ARXIU_Documents_Historics`, `05_Escriptori_Soc_de_Poble` i `07_plantilles` (esta última a la plantilla `skill.md`).

#### C-11 · P2 · L'esquema de frontmatter en tres versions

- `tooling/wiki/schema.json`: obligatoris `type`/`status`/`description`, `additionalProperties: false` i 40 etiquetes a l'enum.
- `index_trellat`: «L'esquema v2 només admet `estat`, `tipus`, `description` i, opcionalment, `aliases` i `revisat`».
- `doc_taula_mestra`: Dataview sobre `estat`, `tipus`, `revisat` i la carpeta `03_govern`.
- `auditoria_canonica`: «`revisat` no està admés».

#### C-12 · P2 · Portes fantasma dins de normes canòniques

- `doc_governanca`, `03_consola_termodinamica` i `index_trellat` citen `wiki:test`, `wiki:audit:strict` i `precommit:sdp` com a «portes reals». **Cap d'eixes tres és a `package.json`.**
- `forja_to_core` diu que no hi ha `npm run porta`. N'hi ha: `package.json:61`.

---

### C · Contradiccions de producte i disseny (norma contra norma)

#### D-01 · P1 · La integració amb Sollutia es descriu amb el model que l'ADR rebutja

- `estandard_integracio_react` (norma canònica, adreçada a l'equip de Sollutia), LLEI 1: `window.SocDePoble.configura({ backend: { loadCoreContent…, getCurrentUser… } })`. Això és el Model A.
- `ADR-2026-09-SOLLUTIA-MODEL-B`: «`backendPort.js` no s'obri a implementacions de Sollutia». L'ESTAT de 260923_2358 constata `configura({backend})` → `configura({auth})`.
- La LLEI 3 de la mateixa norma parla de `vite-plugin-pwa`. La PWA està retirada per l'ADR-2026-08 i no és a `package.json`.
- `llibre_blanc_produccio_pedra_seca` Fase 1 («delega en Sollutia… Vite, React, Tailwind, Supabase») contra `AGENTS.md` §8 (Sollutia no interferix en l'arquitectura). I `LEDGER.md:15` diu Firebase Hosting. És l'A2 de 260923, encara oberta.
- **Proposta:** reescriure LLEI 1 i LLEI 3 segons el Model B, o marcar la norma `arxivat`. És un document que es dona a un tercer.

#### D-02 · P1 · Quin color és el primari

- `sdp-pedra-seca` §2: `--sdp-accio` (blau) és el **PRIMARI**; el taronja «mai ha de competir amb l'acció principal».
- En contra:
  - `branding.md`: «Primary `#FF7300` (Taronja… botons primaris)», amb el secundari a `#016ebf`;
  - `identitat_visual`: el blau és «IA / sistema fred o de nit»;
  - el `Boto` canònic documenta `varietat="accent"` com a «identitat taronja, publicar» (auditoria 260924_0356).
- El blau tampoc és un de sol: `#016ebf` (`branding.md`) i `#0984E3` (`design-tokens.css` i `llibre_blanc`).

#### D-03 · P2 · Valors literals contra el reglament matemàtic

- `sdp-pedra-seca` §2 i §5 prohibixen HEX/RGB i `border-radius` en px, i admeten ombres només amb tokens.
- `sdp-universal-page` §D prescriu `border-radius: 32px`, `box-shadow: 0 4px 20px rgba(0,0,0,0.03)`, `#f7f6f3` i `max-width: 800px`. `branding.md` i `produccio.md`: radis de 28px i 18px i base de 19px.
- Àrea tàctil:
  - 44px als tokens;
  - 48px a `a11y_seo_trellat` i `perfil_psiquiatric`;
  - «44/48» a `sdp-pedra-seca`;
  - dos tokens, `--sdp-touch` i `--sdp-touch-min` (U19).
- El prefix de tokens `--sp-*` (a `a11y_seo_trellat`, `llibre_blanc`, `forja_to_core`) contra el vigent `--sdp-*`.

#### D-04 · P2 · Tailwind: obligatori o prohibit

- `perfil_psiquiatric` §6: «Prohibit Tailwind per a Vestit, obligatori per a Cos».
- En contra: `estandard_ui_universal` (deprecat), `design_guard` (`tailwind-visual` a zero) i `package.json` (no n'hi ha).
- La mateixa frase diu que «48px… estan esborrats de l'existència» i, tot seguit, «Botons a mínim 48px».

#### D-05 · P2 · Offline i PWA: retirats per l'ADR, vius a la Wiki

- `ADR-2026-08` retira PWA, Dexie i la doctrina offline.
- En contra:
  - `el_projecte`: «la baseline actual acredita persistència local amb Dexie, PWA i una capa Supabase amb fallback»;
  - `arquitectura_sistema_nervios`: «PWA… amb fallbacks»;
  - `self_repair`: «Mode offline Mas Cau» amb cua d'operacions;
  - `seguretat_execucio`: xifratge en IndexedDB/OPFS;
  - `perfil_psiquiatric`: «La PWA actual»;
  - `pla_director_legal_i_subvencions`: finançar «programari de sincronització CRDT / Offline».

#### D-06 · P1 · Una substitució global ha capgirat el sentit de documents canònics

- `wiki-propagar-veritat` §3 recepta `find … -exec sed -i …` sobre tota la Wiki. Els seus propis exemples ja estan destrossats per eixa operació: `s/dispositius moderns/dispositius moderns/g` (substitució idèntica), «canviem d'estratègia Online-First a online-first», «Exemple: `dispositius moderns`, `Online-First`, `Online-First`».
- La mateixa empremta en documents publicats:
  - `ADR-2026-08`: «El projecte ja no necessita suport específic per a dispositius moderns ni funcionament 100% offline. **La pila Online-First afegeix Dexie, snapshots, fallback, service worker**…». L'ADR que va decidir abandonar l'offline ara diu que la pila *online* és la que porta Dexie.
  - `arquitectura_l_anima`: «El Repte Online-First (Bancal Mode)» descriu dades que «continuen disponibles al dispositiu».
  - `antigravity`: «aplicacions resilients (Online-First) per a dispositius com l'maquinari del Baseline 2022».
  - El «pitch» de `pla_director_legal_i_subvencions`: «Quan falla la fibra… Sóc de Poble funciona de manera local (Online-First)». És una frase pensada per a administracions.
- La memòria d'auditories prèvies ja constatava un `LEDGER` mutat per un `sed` Offline→Online.
- **Proposta:** retirar el §3 de la skill (vegeu S-03). Restaurar el sentit de cada document amb la seua història de Git, per `core-restauracio-segellada`, que hui la Gàbia també bloqueja (S-02). `requires_human_decision: true`.

---

### D · Skills

#### S-01 · P1 · El cens: quatre xifres per a una sola carpeta

| Font | Quantes | Diferència |
| --- | --- | --- |
| Disc `.agents/skills/*/SKILL.md` | **21** | — |
| `SKILLS_SEAL.json` (02:54Z) | 20 | li falta `core-taxonomia-estricta` |
| `00_INDEX_SKILLS.md` | 20 | li falta `core-taxonomia-estricta` |
| `.agents/skills_index.json` (Router) | 17 | li falten `core-edicio-segura`, `core-estrategia-ia`, `core-higiene-escriptori` i `core-taxonomia-estricta`; `core-automillora` hi consta amb `triggers_on: []` quan el frontmatter en té dos |
| `.claude/skills/` (llista de l'eina Skill) | 16 | li falten les quatre anteriors i `core-automillora` |

- Una skill que no és a `skills_index.json` no la proposa mai el Router. Una que no és a `.claude/skills/` Claude no la pot carregar. I, encara que hi fóra, l'eina `Skill` està denegada (G-02).

#### S-02 · P1 · Skills i plantilles que manen executar el que la Gàbia denega

| Font | Ordre que mana | Estat |
| --- | --- | --- |
| `wiki-cicle-de-vida` pas 1 | `obrir_torn.mjs … --output /tmp/torn-NOM.json` | ❌ `command-policy.mjs:71` només admet `actor` i `scope` (U18: el commit ho anuncia, el text encara no ha canviat) |
| `wiki-cicle-de-vida` pas 8 | `tancament.mjs --check` / `--close` | ❌ denegat (mesurat) |
| `sdp-workflow` §3 | `npm run porta`, tests, ESLint | ❌ |
| `core-edicio-segura` pas 4 | `npm test run` | ❌ |
| `core-consell-i-colmena` §1 | `node -e "…require('./.agents/consell.json')…"` | ❌ |
| `core-higiene-escriptori` 1–2 | `porta-olivera.mjs` sense bandera; `ls -l` | ❌ |
| versió `.txt` d'higiene | `porta-olivera.mjs --arxiva`; `npm run porta:orfandat` | ❌ (`npm run porta:olivera` sí que passa) |
| `core-identitat` pas 4 | «Inspeccionar VISUALMENT l'escriptori» | ❌ no es pot llistar |
| `core-restauracio-segellada` fases 1–2–7 | `ancora.mjs`, `desenterrar.mjs`, `git rev-parse`, `shasum` | ❌ |
| `wiki-propagar-veritat` §2–3 | `grep`/`ripgrep`, `find … -exec sed -i` | ❌ (i ha de continuar denegat: S-03) |
| `wiki-busca-skills` Fase C | redactar una skill nova a `.agents/skills/` | ❌ governança |
| `auditoria_canonica.md` | `porta:documents -- --all`, `porta:frontmatter`, `porta:cognitiu`, `porta:llaurador`, `porta:reflex`, `npm run porta` | ❌ totes sis |

- **Proposta Graphify, a la nostra mida:** una porta de només lectura, `porta:endolls`, que extraga les ordres de cada `SKILL.md` i plantilla i les compare amb `mutation-policy.mjs`. Hauria detectat mecànicament tota esta taula. És la família de defectes que la memòria ja anomena «maquinària correcta sense endollar».

#### S-03 · P1 · `wiki-propagar-veritat` és un perill actiu

- Recepta un `sed -i` global sense declarar superfície. Contradiu la lliçó de `sdp-workflow` de 260923 («l'abast es definix per superfície, no per patró») i la immutabilitat del LEDGER (`QUI_SOC.md` §3.3). I és la causa més probable de D-06.
- **Proposta:** reescriure-la com a escombrada amb llista de fitxers declarada, `Edit` fitxer a fitxer i revisió humana del diff; o arxivar-la. `requires_human_decision: true`.

#### S-04 · P2 · `core-taxonomia-estricta`: una norma més no és una porta

- El frontmatter és invàlid segons `schema.json`: no té `type` ni `status`, que són obligatoris.
- Duplica `AGENTS.md` §0, `wiki-documentacio-i-reflex` §1, `core-automillora` i `PROTOCOL_PETORRETA.md`. L'auditoria de 260923_1535 ja ho advertia: una norma que cal repetir tres vegades és una porta que falta. Esta seria la cinquena.
- **Proposta:** no conservar-la com a skill. El seu contingut útil ja el fa complir `porta-reflex` quan el pre-hook s'executa. Si el Mestre la vol conservar, cal completar-li el frontmatter abans de tornar a segellar (G-01).

#### S-05 · P2 · Producte dins de les skills

- `sdp-casos-us-essencials` és un registre d'idees de producte, i `sdp-calendari-agricola` duplica la seua §3.
- `AGENTS.md` §1: «les skills NO han de contenir filosofia, sinó procediments».
- **Proposta:** moure-les a la Wiki (`02_saber/`, domini 8 del mapa), no arxivar-les.

#### S-06 · P2 · `core-estrategia-ia` duplica `core-consell-i-colmena` §5 amb unes altres dades

- **Proposta:** fusionar-les i treure les dades de consum de les skills, perquè caduquen en dies.

#### S-07 · P2 · Disparadors que ningú escriu i descripcions que no disparen

- Disparadors generats automàticament i morts: `skill iaia identitat`, `skill memoria historica`, `skill casos us essencials`, `skill estudi mercat`, `skill busca skills`, `skill cicle de vida` i `skill propagar veritat`.
- Massa genèrics: `core` (`core-automillora`) i `error` (`core-context-panic`).
- Claude Code només precarrega `name` i `description` de cada `SKILL.md`, i el cos es carrega quan s'invoca. És coneixement meu del client, no una dada del repositori. `triggers_on` només el llig el Router. Descripcions com «Core skill per a restauració segura» no fan saltar res.

#### S-08 · P3 · `\n` literals al principi del cos

- Skills: `sdp-app-grid-shell`, `sdp-casos-us-essencials`, `sdp-estudi-mercat` i `wiki-propagar-veritat`.
- Wiki publicada: `00_index`, `00_index_actuar`, `260913_0635_arquitectura_perfil_universal`, `ADR-2026-08-ONLINE-FIRST` i `estandard_integracio_react`.
- És un generador antic que va escriure `\\n` en compte d'un salt de línia.

#### S-09 · P2 · `sdp-estudi-mercat` escriu a la zona humana

- Destí: `_wiki_de_poble/04_ESCRIPTORI/01_Produccio/…`. `mutationPath` ho prohibix, i en majúscules no casa ni a Linux.
- El contracte l'encamina per la ruta `estudi_ia` → plantilla `estudi_consell.md` → nom `estudi_[nom_ia]`. Hi ha tres noms per a un sol tipus de document.

#### S-10 · P2 · Una skill té tres formes i cap arriba a la carpeta

- La plantilla `skill.md` prescriu Propòsit, Frontera, Instruccions i Context.
- La ruta `skill` del contracte genera Registre, Acte reflex, Historial, Contingut, Verificació i Vincles, amb destí `04_escriptori`.
- Cap de les 21 skills reals té ni l'una ni l'altra forma.
- Per això les skills noves queden «pendents d'instal·lar amb lease» a l'Escriptori, com la de Fable i la d'higiene `.txt`, o s'instal·len per la porta del darrere, com ha passat hui (G-01). F8 ho resol.

#### Uniformitat: estat del frontmatter de cada skill

| Skill | name | type | status | tags | core | triggers útils | Problema principal |
| --- | --- | --- | --- | --- | --- | --- | --- |
| core-automillora | ✓ | ✓ | actiu | ✗ | ✗ | «core» genèric | C-04; absent del Router i de `.claude` |
| core-consell-i-colmena | ✓ | ✓ | canonic | ✓ | true | ✓ | C-05; `node -e` |
| core-context-panic | ✓ | ✓ | canonic | ✓ | true | «error» genèric | cap greu |
| core-edicio-segura | ✓ | ✓ | actiu | ✓ | ✗ | «edicio de components React» | dialecte Antigravity; absent del Router i de `.claude` |
| core-estrategia-ia | ✓ | ✓ | actiu | ✗ | ✗ | ✓ | S-06; absent del Router i de `.claude` |
| core-higiene-escriptori | ✓ | ✓ | actiu | ✓ | ✗ | frase morta | C-07; absent del Router i de `.claude` |
| core-identitat | ✓ | ✓ | canonic | ✓ | true | ✗ | apunta a `personalitat_iaia`, no a `QUI_SOC.md` |
| core-memoria-historica | ✓ | ✓ | canonic | ✓ | true | ✗ | descripció contra el cos (C-06) |
| core-restauracio-segellada | ✓ | ✓ | canonic | ✓ | true | ✓ | eines denegades (S-02) |
| **core-taxonomia-estricta** | ✓ | **✗** | **✗** | ✗ | ✗ | ✗ | **invàlida; trenca el segell** |
| sdp-app-grid-shell | ✓ | ✓ | canonic | ✓ | ✗ | ✗ | `\n` |
| sdp-calendari-agricola | ✓ | ✓ | canonic | ✗ | ✗ | ✓ | S-05 |
| sdp-casos-us-essencials | ✓ | ✓ | canonic | ✓ | ✗ | ✗ | S-05; `\n` |
| sdp-estudi-mercat | ✓ | ✓ | canonic | ✓ | ✗ | ✗ | S-09; `\n` |
| sdp-pedra-seca | ✓ | ✓ | canonic | ✓ | true | ✓ | D-02, D-03 |
| sdp-universal-page | ✓ | ✓ | canonic | `core` sense `core: true` | ✗ | ✓ | D-03 |
| sdp-workflow | ✓ | ✓ | canonic | ✓ | true | ✓ | autoreferència (C-02); §0 llig l'arxiu (C-06) |
| wiki-busca-skills | ✓ | ✓ | canonic | ✓ | ✗ | ✗ | Fase C impossible (S-10) |
| wiki-cicle-de-vida | ✓ | ✓ | canonic | ✓ | ✗ | ✗ | `--output` (S-02) |
| wiki-documentacio-i-reflex | ✓ | ✓ | canonic | ✓ | true | ✓ | lliçons contradictòries (C-07) |
| wiki-propagar-veritat | ✓ | ✓ | canonic | ✓ | ✗ | ✗ | S-03; `\n` |

Frontmatter uniforme proposat per a tot `SKILL.md`. Els camps ja són a `schema.json`, llevat del valor nou de `tags` (vegeu H):

```yaml
---
name: nom-igual-al-directori
description: "Fes-la servir quan … (el que llig Claude per a decidir; ≤220)"
type: skill
status: canonic
tags: [un-domini-del-mapa-8x8]
core: false
triggers_on: ["frases reals que diu el Mestre"]
version: "1.0.0"
---
```

---

### E · Plantilles

#### P-01 · P2 · La versió no la comprova ningú

- `prompt_local.md` diu 2.3.0 a la capçalera, al Registre i a l'Historial. `protocolledge.json` → `prompt.local.version: "2.2.0"`.
- `porta-plantilles.mjs` només compara seccions i `blocsFixos`, i per això ix verda («13 rutes: la plantilla i el contracte diuen el mateix»).
- `prompt_consell.md` té un segon «Registre» amb «Versió 1.0.0 (Consell)» dins de «Tasca», contra el 2.0.0 del contracte.

#### P-02 · P2 · `auditoria_canonica.md`, la plantilla fora de lloc

- És l'única de les tretze que no viu a `03_actuar/plantilles/`. El frontmatter diu `type: document`, no `plantilla`.
- Porta `BROKEN LINK: skills <!-- TODO: fix link -->`, cita `04_ARXIU_Documents_Historics` i mana sis ordres denegades (S-02).
- **Proposta:** moure-la a `03_actuar/plantilles/auditoria.md` i actualitzar la ruta a `protocolledge.json`. Toca governança: cal lease.

#### P-03 · P2 · El bloc de logos duplicat que la norma de logos prohibix

- «LOGOS OFICIALS (Font de la Veritat)» apareix sencer a `brainstorming.md`, `branding.md`, `doc_to_app.md`, `pla.md`, `produccio.md` i `skill.md`.
- `doc_logos_oficials`: «Cap plantilla ha d'incrustar blocs repetits de logos».

#### P-04 · P2 · Plantilles d'una altra època

- `doc_to_app.md`: miniaplicacions «Pure HTML/CSS/JS» en carpetes `miniapp_<tema>_<timestamp>/`, «Bento», i una «Skill de Producció (Botiga de Diumenge)» que no existix.
- `produccio.md`: radis de 28/18px i «paleta de 4 colors».
- `branding.md`: la paleta de D-02.
- `acta.md`: «Vanilla JS/Node» i C-09.
- «El to de la Tia Maria» a `branding.md` i `doc_to_app.md`.

#### P-05 · P3 · La guia editorial viu dins de la secció que s'ha d'omplir

- En totes les plantilles, «### Guia editorial» penja de «Troballes», «Contingut» o «Canvis proposats». `pla_implementacio.md` fins i tot hi posa un «### Vincles».
- `document.mjs create` no la copia, i fa bé. Però qui seguix la Regla 0 i copia la plantilla la porta dins del document (C-03).

#### P-06 · P1 · La petorreta d'esta tanda i el seu pla

- **Etiquetes fora de l'enum:** `prompt` i `ultracode` (petorreta), `opus` (pla). Ho diu `porta-documents`.
- **Sense rebut i sense àncora:** `porta-documents` i `porta-olivera --informe` estan en roig.
- **Caselles §0 marcades `[x]`** amb `porta-olivera` en roig en eixe mateix moment. És la tercera vegada que es proposa que la màquina òmpliga eixa casella.
- **Bloc fix modificat:** el «Protocol de la Reunió a l'Olivera» està retallat respecte de la plantilla (punts 2 i 3). Quan tinga rebut, `blocsFixos` el tombarà.
- **Seccions absents al pla:** li falten `## Historial` i `## Verificació` (el «Pla de Verificació» és un `###` dins de «Canvis proposats»), i el cognom no casa (C-08).
- No és un retret: el circuit (`document.mjs context/create`) existix i funciona, però G-05 i G-07 fan versemblant que MarIA no el poguera usar des d'Antigravity.

---

### F · Wiki publicada (`src/data/wikiManifest.js`, 68 documents)

#### W-01 · P1 · Documents estratègics dins del manifest de la Wiki integrada

- `pla_director_legal_i_subvencions` conté els noms de pila de tres persones proposades per a la junta i l'estratègia per a remunerar el Mestre.
- `pla_director_viabilitat_economica` conté el repartiment 50/50 amb Sollutia, franges salarials i la frase que les hores de manteniment «es camuflen com a costos directes de personal» a les subvencions.
- Tots dos són al manifest que compila `tooling/wiki/compile-wiki-to-app.mjs`. `schema.json` admet `visibility: private`, i cap dels dos el porta.
- **Verificat:** el contingut és a `src/data/wikiManifest.js`. **No verificat:** què servix ara mateix el desplegament.
- **Proposta:** `visibility: private` i regenerar el manifest. `requires_human_decision: true`. És decisió teua i afecta tercers.

#### W-02 · P2 · Text de tercers publicat com a canònic

- `02_saber/obsidian_plugins/homepage.md` i `plugins.md` són text promocional de la web d'Obsidian, en anglès, amb `status: canonic` i les etiquetes `escriptori` i `temporal`.

#### W-03 · P2 · Buits amb segell de canònic

- Els hubs `govern`, `maquina`, `identitat`, `coneixement` i `graf` (`type: hub`, `status: canonic`) tenen el cos buit. `00_index_maquina` està buit.
- **Proposta:** convertir `graf` en el mapa del bloc H i arxivar la resta, o omplir-los amb el seu domini.

#### W-04 · P2 · Frontmatter trencat o contradictori

- `agents_equip_ia` no té frontmatter.
- `sgq_prompts` no té `tags`, i descriu un validador que el codi ha desactivat i una plantilla (`00_PLANTILLA_PROMPT_CONSELL.md`) que ja no existix.
- `ADR-2026-08` diu «Acceptada», però porta `status: esborrany` i l'etiqueta `escriptori`.
- `sistema_immunitari` és `type: skill` dins de la Wiki (contra `AGENTS.md` §1). A més, mana instal·lar `.git/hooks/pre-commit`, que Git ignora quan `core.hooksPath` apunta a `.husky/_` (P-10).

#### W-05 · P2 · Etiquetes que no classifiquen

- La tripleta `core, genoma, identitat` es repetix en 14 documents de temes molt distints: `01_identitat`, `02_genotip`, `03_equip_ia`, `00_index_identitat`, `03_consola_termodinamica`, `anatomia_cognitiva`, `antigravity`, `connectors_mcp_disseny`, `doc_logos_oficials`, `doc_taula_mestra`, `el_projecte`, `identitat_visual`, `perfil_psiquiatric` i `soci_sollutia`.
- `maquina` es repetix en 16 documents, entre protocols i plantilles.
- L'enum té 40 etiquetes amb sinònims (`acta`/`marmota`/`acta-marmota`, `identitat`/`ser`/`genoma`, `saber`/`coneixement`) i dos amb caràcters no ASCII (`memòria`, `col·laboració`).
- Una etiqueta que porten la meitat dels documents no servix per a filtrar.

#### W-06 · P2 · `BROKEN LINK`/`TODO` servits

- Set protocols acaben amb `**Categoria:** protocols (BROKEN LINK: skills) <!-- TODO: fix link -->`: `a11y_seo_trellat`, `auditoria_canonica`, `futur_adaptacio`, `index_trellat`, `seguretat_execucio`, `self_repair` i `successio_lazaro_execucio`.
- `pla_director_legal_i_subvencions` en porta dos, «Sollutia (BROKEN LINK: Sollutia)».
- `00_index_identitat` servix «Mirall d'Agents i Skills… pendent de generació».
- És la T-13 de 260923, que continua oberta.

---

### G · Esbandida: candidats a arxiu, fusió o trasllat

Qualsevol moviment, rename o operació sobre més de cinc fitxers és risc alt segons `PROTOCOL_PETORRETA.md` P-02 i necessita Petorreta, lease i la teua ordre. Hui cap agent el pot executar (G-05).

| Element | Decisió proposada | Motiu |
| --- | --- | --- |
| `02_saber/obsidian_plugins/homepage.md`, `plugins.md` | arxivar | W-02 |
| hubs `govern`, `maquina`, `identitat`, `coneixement`; `00_index_maquina` | arxivar o omplir | W-03 |
| hub `graf` | reconvertir en el mapa 8×8 | bloc H |
| `agents_equip_ia` + `03_equip_ia` | fusionar en una pàgina que llija `consell.json` | C-05 |
| `sgq_prompts` | arxivar | W-04 |
| skill `core-taxonomia-estricta` | retirar-la o completar-la, i reconciliar el segell | G-01, S-04 |
| skill `core-estrategia-ia` | fusionar a `core-consell-i-colmena` | S-06 |
| skills `sdp-casos-us-essencials`, `sdp-calendari-agricola` | moure a la Wiki (domini 8) | S-05 |
| skill `wiki-propagar-veritat` | reescriure o arxivar | S-03 |
| skill `core-automillora` | reescriure la §2 segons la teua decisió de C-04 | C-04 |
| skill `core-higiene-escriptori` | substituir-la per la `.txt` esmenada, amb frontmatter vàlid | C-07 |
| plantilla `auditoria_canonica.md` | moure a `plantilles/` | P-02 |
| plantilles `doc_to_app.md`, `produccio.md` | reescriure o arxivar | P-04 |
| plantilla `branding.md` | reescriure amb la paleta real de `src/config/design-tokens.json` | D-02 |
| norma `estandard_integracio_react` | reescriure LLEI 1 i LLEI 3 segons el Model B | D-01 |

No he pogut mesurar l'**ús** de cap plantilla: comptar-lo demanaria cercar a `10_actes/` i a l'Escriptori, i la cerca està denegada. Les decisions de dalt es basen en el contingut, no en la freqüència.

---

### H · Els «64»: reconstrucció d'un mapa temàtic 8×8

#### Què he buscat i què no he trobat

He buscat la llista a:

- `_wiki_de_poble/04_escriptori/` sencer (índex i documents solts) i `02_investigacio_ia/`;
- l'Acta `10_actes/260924_0500_acta_marmota.md` i l'auditoria `10_actes/260923_1535_auditoria_claude.md`;
- quatre documents de l'arxiu, llegits de manera dirigida i perquè la petorreta ho mana, no en RAG: `260924_0435_auditoria_ultracode.md` (les 534 línies), `260924_0437_auditoria_codex.md`, `260924_0356_auditoria_claude.md` i `260924_Auditoria_Claude_Olivera/260924_0445_pla_implementacio_olivera.md`;
- la memòria persistent de Claude per a este projecte (`MEMORY.md`).

Cap conté una llista de 64 agents ni de 64 temes. La cerca de transcripcions està denegada (G-02) i el client d'escriptori no escriu cap `~/.claude/history.jsonl`.

Hi ha una dada que ho fa encara menys probable. L'escombratge Ultracode de la nit passada diu, a la seua U01, que **no va poder llançar cap Workflow** per la mateixa Gàbia. Si una llista de 64 agents va existir, no va nàixer d'un Workflow de Claude Code d'eixa nit. Pot haver nascut en un altre canal (claude.ai web) que jo no puc vore. **No la reconstruïsc de memòria perquè no la tinc, i no n'invente una còpia.**

El que sí que faig és observar que 64 = 8 × 8, i que `cervell.json` ja té 8 dimensions. Propose un mapa nou de **8 dominis temàtics × 8 àrees = 64 entitats documentals**. Cada àrea és un «agent» en el sentit de responsabilitat: té un nom, un titular (la skill o el document que en respon) i uns documents que hi pertanyen. És ortogonal a les 8 dimensions de cicle de vida de `cervell.json`. Les dimensions diuen *on viu* un document; els dominis diuen *de què parla*.

#### Els 8 dominis i l'etiqueta de cada un

Hi ha una sola etiqueta de domini per document i totes ja són a l'enum de `schema.json`, llevat de `producte`, que caldria afegir (canvi d'esquema: lease).

| # | Domini | Etiqueta |
| --- | --- | --- |
| 1 | SER · identitat i cultura | `identitat` |
| 2 | GOVERN · autoritat, llei i economia | `govern` |
| 3 | CONSELL · cognició i col·laboració d'agents | `consell` |
| 4 | DOCUMENT · cicle documental i plantilles | `plantilla` |
| 5 | PEDRA SECA · disseny | `disseny` |
| 6 | MÀQUINA · arquitectura i dades | `arquitectura` |
| 7 | PORTES · qualitat, seguretat i restauració | `portes` |
| 8 | POBLE · producte i comunitat | `producte` (nova) |

#### Les 64 àrees, amb el titular actual

«⬜» vol dir que l'àrea no té cap document ni skill que en responga. És un forat del mapa, no un error.

| Codi | Àrea | Titular actual |
| --- | --- | --- |
| 1.1 | Missió i llinatge | `00_visio_i_pilars`, `el_projecte`, `arquitectura_l_anima` |
| 1.2 | Genotip i lleis cognitives | `02_genotip`, `01_identitat` |
| 1.3 | Veu i personalitat de la IAIA | `QUI_SOC.md`, `.agents/PROFILE.md`, `personalitat_iaia`, `perfil_psiquiatric`, skill `core-identitat`, `antigravity` |
| 1.4 | Trellat | `01_trellat`, `index_trellat` |
| 1.5 | Identitat visual i marca | `identitat_visual`, `doc_logos_oficials` |
| 1.6 | Llengua i glossari | ⬜ (`src/GLOSSARI.md` existix fora de la Wiki) |
| 1.7 | Territori i patrimoni | ⬜ (metàfores disperses a `perfil_psiquiatric` §7–8) |
| 1.8 | Memòria fundacional | `arquitectura_protocol_lazaro`, `memoria_aprenentatges` |
| 2.1 | Constitució | `AGENTS.md`, `.agents/AGENTS.md`, `.agents/cervell.json`, `.agents/rules/00_BIOS_COGNITIU.md`, `.agents/BIOS.md` |
| 2.2 | Petorreta, leases i bloqueig | `.agents/PROTOCOL_PETORRETA.md`, `sdp_lock` |
| 2.3 | Jerarquia de veritat | `doc_governanca` |
| 2.4 | Privacitat | `llei_05_privacitat` |
| 2.5 | Entitat legal | `pla_director_legal_i_subvencions` |
| 2.6 | Economia i finançament | `pla_director_viabilitat_economica` |
| 2.7 | Soci Sollutia i frontera | `soci_sollutia`, `estandard_integracio_react` |
| 2.8 | Decisions (ADR) i propagació | `ADR-2026-08-ONLINE-FIRST`, `ADR-2026-09-SOLLUTIA-MODEL-B`, skill `wiki-propagar-veritat` |
| 3.1 | Cens del Consell | `.agents/consell.json`, `agents_equip_ia`, `03_equip_ia` |
| 3.2 | Rols i estratègia de consum | skills `core-consell-i-colmena`, `core-estrategia-ia` |
| 3.3 | Reunió davall l'Olivera | `core-automillora` §2, `prompt_local` (bloc fix), skill `wiki-documentacio-i-reflex` §5 |
| 3.4 | Acte Reflex i Efecte Matrix | skills `wiki-documentacio-i-reflex`, `core-taxonomia-estricta`; `sgq_prompts` |
| 3.5 | Fusibles cognitius | skills `core-context-panic`, `core-edicio-segura`; `anatomia_cognitiva` |
| 3.6 | Arrencada i context | `.agents/BOOTSTRAP.md`, `ON_ESTIC.md`, `despertar.mjs`, `context-local.mjs`, `persona_router.mjs` |
| 3.7 | Automillora i lliçons | skill `core-automillora`; les seccions «Lliçons del Mestre»; REFLEX DE CORRECCIÓ |
| 3.8 | Recerca d'avantguarda | skill `wiki-busca-skills`, `02_investigacio_ia/`, `futur_adaptacio`, `connectors_mcp_disseny` |
| 4.1 | Contracte i metadades | `.agents/protocolledge.json`, `tooling/wiki/schema.json`, `doc_taula_mestra` |
| 4.2 | Plantilles de prompt | `prompt_local.md`, `prompt_consell.md`, `bundle.md` |
| 4.3 | Plantilles de treball | `pla_implementacio.md`, `pla.md`, `brainstorming.md`, `doc_to_app.md`, `produccio.md`, `skill.md` |
| 4.4 | Auditoria i estudi | `auditoria_canonica.md`, `estudi_consell.md` |
| 4.5 | Actes i relleu | `acta.md`, `10_actes/`, `.agents/ESTAT.md`, `ON_ESTIC.md` |
| 4.6 | Torns i rebuts | skill `wiki-cicle-de-vida`, `document.mjs`, `obrir_torn.mjs` |
| 4.7 | Escriptori i higiene | `00_index_escriptori`, skill `core-higiene-escriptori`, `porta-olivera.mjs` |
| 4.8 | Arxiu i Llibre d'Obra | `90_arxiu_historic/`, skill `core-memoria-historica`, `.agents/LEDGER.md` |
| 5.1 | Reglament matemàtic | skill `sdp-pedra-seca` |
| 5.2 | Tokens i color | ⬜ a la Wiki (`src/config/design-tokens.json` al codi) |
| 5.3 | UniversalPage | skill `sdp-universal-page` |
| 5.4 | AppGridShell i Workspace | skill `sdp-app-grid-shell`, `estandard_ui_universal` |
| 5.5 | UniversalCard i Connectar | `connexio_radical` |
| 5.6 | Tipografia i lectura | ⬜ (disperses a `identitat_visual` §4 i `sdp-pedra-seca` §4) |
| 5.7 | Accessibilitat | `a11y_seo_trellat` |
| 5.8 | Catàleg i mètode de producció | `DesignSection.jsx`, `llibre_blanc_produccio_pedra_seca` |
| 6.1 | Arquitectura unificada i mètode | `00_arquitectura_tecnica_unificada`, skill `sdp-workflow`, `.agents/BASELINE.md` |
| 6.2 | Supabase i RLS | ⬜ a la Wiki (`tractor-rls.mjs`, `supabase/`) |
| 6.3 | Enxufabilitat i port del backend | ⬜ a la Wiki (`backendPort.js`, `tractor-enxufe.mjs`) |
| 6.4 | Frontissa Sollutia | ⬜ a la Wiki (`src/data/adaptadors/sollutia/`) |
| 6.5 | Sessió i autenticació | ⬜ (on viu C14) |
| 6.6 | Wiki integrada i publicació | ⬜ (`compile-wiki-to-app.mjs`, `wikiManifest.js`) |
| 6.7 | SEO | `a11y_seo_trellat` (part SEO) |
| 6.8 | Visió futura | `arquitectura_sistema_nervios`, `forja_to_core` |
| 7.1 | La Gàbia | ⬜ a la Wiki (només P-14; bloc A d'este informe) |
| 7.2 | Segell de skills | ⬜ (`segella.mjs`, `segell-auto.mjs`, `SKILLS_SEAL.json`) |
| 7.3 | Executor i leases | ⬜ (`executor-mutacio.mjs`, `reflex_petorreta.mjs`) |
| 7.4 | Cadena de portes i observabilitat | `03_consola_termodinamica` (`run-portes.mjs`, 59 passos) |
| 7.5 | Pre-commit i CI | ⬜ (`.husky/`, `git-staged.mjs`, `wiki-integrity.yml`) |
| 7.6 | Seguretat d'execució | `seguretat_execucio`, `self_repair` |
| 7.7 | Sistema immunitari | `sistema_immunitari` |
| 7.8 | Restauració i continuïtat | skill `core-restauracio-segellada`, `successio_lazaro_execucio` |
| 8.1 | Casos d'ús essencials | skill `sdp-casos-us-essencials` |
| 8.2 | Calendari agrícola | skill `sdp-calendari-agricola` |
| 8.3 | Mur i xarxa | ⬜ |
| 8.4 | Notes i Editor Universal | ⬜ (Lliçó 2 de `memoria_aprenentatges`) |
| 8.5 | Agenda (quarantena) | ⬜ (`src/config/sections.js`) |
| 8.6 | Perfil universal | `260913_0635_arquitectura_perfil_universal` |
| 8.7 | Mercat i pobles | ⬜ |
| 8.8 | Estudi de mercat | skill `sdp-estudi-mercat` |

**Lectura del mapa:** hi ha 20 àrees buides de 64. Sis són del domini 7 (PORTES): la maquinària que més bloqueja és la menys documentada per a humans. Cinc són del domini 6 (MÀQUINA): la frontera amb Sollutia viu al codi i a un ADR, no a la Wiki.

#### Classificació de cada document de la Wiki publicada (68)

Format: `document` → codi · etiquetes proposades (ara).

**01_ser**

- `00_index` → índex global · `core` (core)
- `01_identitat` → 1.2 · `identitat` (core, genoma, identitat)
- `02_genotip` → 1.2 · `identitat`, `core` (core, genoma, identitat)
- `03_equip_ia` → 3.1 · `consell` (core, genoma, identitat)
- `agents_equip_ia` → 3.1 · `consell` (cap: no té frontmatter)
- `personalitat_iaia` → 1.3 · `identitat` (ser, identitat)

**02_saber**

- `00_arquitectura_tecnica_unificada` → 6.1 · `arquitectura` (maquina)
- `00_index_identitat` → índex del domini 1 · `identitat`, `core` (core, genoma, identitat)
- `00_index_maquina` → índex del domini 6 · `arquitectura` (maquina) · buit
- `00_visio_i_pilars` → 1.1 · `identitat` (saber)
- `01_trellat` → 1.4 · `identitat` (saber)
- `03_consola_termodinamica` → 7.4 · `portes` (core, genoma, identitat)
- `anatomia_cognitiva` → 3.5 · `consell` (core, genoma, identitat)
- `antigravity` → 1.3 · `identitat` (core, genoma, identitat)
- `architecture/260913_0635_arquitectura_perfil_universal` → 8.6 · `producte` (identitat)
- `architecture/ADR-2026-08-ONLINE-FIRST` → 2.8 · `govern`, `arquitectura` (escriptori)
- `architecture/ADR-2026-09-SOLLUTIA-MODEL-B` → 2.8 · `govern`, `sollutia` (sollutia)
- `codex_huma/arquitectura_l_anima` → 1.1 · `identitat` (saber)
- `codex_huma/arquitectura_protocol_lazaro` → 1.8 · `identitat` (saber)
- `codex_huma/arquitectura_sistema_nervios` → 6.8 · `arquitectura` (saber)
- `coneixement` → hub sense domini · arxivar (saber)
- `connectors_mcp_disseny` → 3.8 · `consell`, `disseny` (core, genoma, identitat)
- `connexio_radical` → 5.5 · `disseny` (saber)
- `doc_governanca` → 2.3 · `govern` (govern)
- `doc_logos_oficials` → 1.5 · `identitat`, `disseny` (core, genoma, identitat)
- `doc_taula_mestra` → 4.1 · `plantilla` (core, genoma, identitat)
- `el_projecte` → 1.1 · `identitat` (core, genoma, identitat)
- `estandard_integracio_react` → 2.7 · `govern`, `sollutia` (core, govern)
- `estandard_ui_universal` → 5.4 · `disseny` (govern)
- `forja_to_core` → 6.8 · `arquitectura` (govern)
- `govern` → hub del domini 2 · `govern` (saber)
- `graf` → mapa 8×8 · `core` (saber)
- `identitat_visual` → 1.5 · `identitat`, `disseny` (core, genoma, identitat)
- `identitat` → hub del domini 1 · `identitat` (saber)
- `llei_05_privacitat` → 2.4 · `govern`, `seguretat` (govern)
- `llibre_blanc_produccio_pedra_seca` → 5.8 · `disseny` (disseny, saber)
- `maquina` → hub del domini 6 · `arquitectura` (saber)
- `memoria_aprenentatges` → 1.8 · `identitat` (saber, aprenentatge)
- `obsidian_plugins/homepage` → arxivar (escriptori, temporal)
- `obsidian_plugins/plugins` → arxivar (escriptori, temporal)
- `perfil_psiquiatric` → 1.3 · `identitat` (core, genoma, identitat)
- `pla_director_legal_i_subvencions` → 2.5 · `govern`, `legal` (govern, legal, sollutia) · `visibility: private`
- `pla_director_viabilitat_economica` → 2.6 · `govern`, `legal` (govern, legal) · `visibility: private`
- `protocols_tecnics/a11y_seo_trellat` → 5.7 · `disseny` (maquina)
- `protocols_tecnics/auditoria_canonica` → 4.4 · `plantilla`, `auditoria` (maquina)
- `protocols_tecnics/futur_adaptacio` → 3.8 · `consell` (maquina)
- `protocols_tecnics/index_trellat` → 1.4 · `identitat` (maquina)
- `protocols_tecnics/seguretat_execucio` → 7.6 · `portes`, `seguretat` (maquina)
- `protocols_tecnics/self_repair` → 7.6 · `portes` (maquina)
- `protocols_tecnics/sgq_prompts` → 3.4 · arxivar (cap)
- `protocols_tecnics/successio_lazaro_execucio` → 7.8 · `portes` (maquina)
- `sdp_lock` → 2.2 · `govern`, `seguretat` (maquina)
- `sistema_immunitari` → 7.7 · `portes` (saber)
- `soci_sollutia` → 2.7 · `govern`, `sollutia` (core, genoma, identitat, legal, sollutia)

**03_actuar**

- `00_index_actuar` → índex del domini 4 · `plantilla` (skills)
- `plantilles/00_index_plantilles` → 4.2–4.4 · `plantilla` (maquina)
- `plantilles/acta` → 4.5 · `plantilla`, `acta` (maquina)
- `plantilles/brainstorming` → 4.3 · `plantilla` (maquina)
- `plantilles/branding` → 4.3 · `plantilla`, `disseny` (maquina)
- `plantilles/bundle` → 4.2 · `plantilla`, `consell` (govern, saber)
- `plantilles/doc_to_app` → 4.3 · `plantilla` (maquina)
- `plantilles/estudi_consell` → 4.4 · `plantilla`, `consell` (maquina)
- `plantilles/pla_implementacio` → 4.3 · `plantilla`, `pla` (plantilla, pla)
- `plantilles/pla` → 4.3 · `plantilla`, `pla` (maquina)
- `plantilles/produccio` → 4.3 · `plantilla` (maquina)
- `plantilles/prompt_consell` → 4.2 · `plantilla`, `consell` (govern, saber)
- `plantilles/prompt_local` → 4.2 · `plantilla`, `consell` (govern, saber)
- `plantilles/skill` → 4.3 · `plantilla`, `skills` (maquina, skills)

Les 21 skills i els documents de govern ja tenen el codi a la taula de les 64 àrees. En conjunt fan uns 105 elements classificats.

#### Política d'etiquetes que propose

1. **Una etiqueta de domini**, obligatòria i de les 8.
2. Com a molt **dues facetes** d'una llista curta: `core` (només per als documents d'`entrada` de `cervell.json`), `legal`, `sollutia`, `supabase`, `seguretat`, `acta`, `auditoria`, `pla` i `skills`.
3. **Retirar de l'enum**, perquè són sinònims o perquè el cicle de vida ja el diuen la carpeta, el `type` i l'`status`: `genoma`, `ser`, `saber`, `coneixement`, `maquina`, `escriptori`, `temporal`, `revisar`, `log`, `marmota`, `acta-marmota`, `graf`, `trellat`, `codex`, `aprenentatge`, `tractors`, `brain`, `fortificacio`, `implementacio`, `col·laboració`, `memòria`, `rols`, `reflex`, `abocament` i `ultracode` (esta última no hi ha d'entrar).
4. **La màquina proposa i el carboni decidix.** És la Lliçó 8 de `memoria_aprenentatges`: la semàntica no s'escriu al frontmatter sense autorització. Esta taula és una proposta per a validar, no un script per a aplicar. La migració toca l'esquema i més de cinc fitxers, i és risc alt: es fa per dominis, en lots, amb `porta:frontmatter` després de cada lot.

---

### I · Inspiració: Agent Skills i Graphify

Font: només `02_investigacio_ia/260922_0500_informe_idees_noves_skills.md`. No he pogut navegar ni verificar els repositoris originals, i no n'afirme res més del que diu eixe informe.

- **Agent Skills (Addy Osmani), segons l'informe:** «habilitats estructurades per a diferents etapes del desenvolupament: planificació, programació, testing i publicació». Si projectem les 21 skills sobre eixes quatre etapes:
  - planificació → `sdp-workflow`;
  - programació → `sdp-pedra-seca`, `sdp-universal-page`, `sdp-app-grid-shell` i `core-edicio-segura`;
  - **testing → cap skill**;
  - **publicació → cap skill** (només la plantilla `produccio.md`).
  Les dos etapes òrfenes són justament les que la Gàbia impedix executar (G-04). Proposta: una skill `sdp-verificacio` (quines portes, en quin ordre, què fer quan una cau) quan F3 estiga fet, i no abans, perquè seria una skill inexecutable.
- **Mecànica de skills de Claude Code** (coneixement meu, no del repositori): precàrrega de `name` i `description`, cos sota demanda i fitxers annexos sota demanda. Conseqüència pràctica: la `description` és el disparador, i convé que diga «Fes-la servir quan…». El cos ha de ser curt i procedimental. Les lliçons llargues poden viure en un `.md` germà, que `segella.mjs` també segella perquè segella tot `*.md`.
- **Graphify, a la nostra mida:** no cal cap eina externa. El fitxer d'inventari de cada torn (`.agents/runtime/turns/<id>.json`) ja conté el hash de cada fitxer del repositori. Un generador de només lectura que creue skill → ordre → política de la Gàbia → estat, i document → etiqueta → domini, donaria el mapa d'endolls (S-02) i el mapa 8×8 viu en un sol JSON. El `BrainGraph` de l'app el podria pintar.

---

### J · Proposta de millora de `prompt_local.md` (Protocol §4)

1. **Camp «Eines i ordres executables pel destinatari».** Ultracode ja ho va proposar i encara no hi és. Hui la petorreta demanava Ultracode i la Gàbia el feia impossible. Una casella a la §0 («l'orquestració està permesa?») ho hauria detectat abans d'enviar-la.
2. **Les caselles §0 les ha d'omplir la màquina.** Que les ompli l'eixida de `porta-olivera --informe` i de `porta-documents`, no l'autor. Esta és la tercera tanda seguida amb `[x]` i porta roja.
3. **Tot artefacte que es cite ha de dur ruta.** «Recupera-ho de la teua memòria» no és executable: els agents no tenim memòria entre sessions si ningú l'ha escrita en un fitxer. Si els «64» existixen, la petorreta ha de dir on.
4. **Mode AFK al Registre.** La Tasca 2 demanava «auto-reparació» i el Protocol, «cap línia de codi». M'he quedat amb el Protocol perquè és la clàusula més explícita. És la segona vegada que es proposa.
5. **Alinear la versió** amb `protocolledge.json` (P-01) i nomenar la ruta del lliurable (`auditoria`) dins de la mateixa petorreta.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Ordres executades** (totes de només lectura o del circuit documental autoritzat):

| Ordre | Resultat |
| --- | --- |
| `git status --short` | arbre brut: `ON_ESTIC.md`, `cron.out`, `layout.css` modificats; 4 documents de Fable esborrats de l'Escriptori; petorreta, pla i `260924_Auditoria_Fable/` sense seguir |
| `git log --oneline` | HEAD `5eee1293` |
| `node tooling/gates/segella.mjs` | ❌ ruptura: `455a0fad` ≠ `88f0ec03` |
| `node tooling/gates/porta-plantilles.mjs` | ✅ 13 rutes (no compara versions: P-01) |
| `node tooling/gates/porta-documents.mjs` | ❌ 7 errors sobre la petorreta i el pla (rebut, enum, àncora) |
| `node tooling/gates/porta-olivera.mjs --informe` | ❌ 2 documents sense àncora; ⚠️ 4 àncores a documents que ja no hi són |
| `node tooling/gates/obrir_torn.mjs --actor claude-opus --scope documents` | ✅ `torn_b0e47896…` |
| `node tooling/wiki/document.mjs context … --route auditoria …` | ✅ plantilla i rebut |
| `node tooling/wiki/document.mjs create …` | ✅ esborrany ancorat |

**Denegades pel hook en esta sessió** (evidència de G-02, G-03 i G-10): `Agent`, `Workflow`, `Skill`, `mcp__ccd_session_mgmt__search_session_transcripts`, `ls`, `cd … && …`, `node tooling/gates/tancament.mjs --check` i un `Write` a la memòria persistent de Claude, fora del repositori.

**No executades i, per tant, no avalades:** `npm test`, `npm run lint`, `npm run porta`, `porta:orfandat`, `porta:frontmatter`, `tancament.mjs --check/--close` (la política no les admet) i cap navegador. **Cap porta es declara verda en este informe, llevat de les que surten com a ✅ en esta taula.**

**Mètode:** lectura sencera de les 21 `SKILL.md`, de `00_INDEX_SKILLS.md` i de `skills_index.json`; de les 13 plantilles (`prompt_local.md`, `pla_implementacio.md`, `skill.md` i `auditoria_canonica.md` al disc, i la resta dins del manifest); dels 68 documents de `src/data/wikiManifest.js`; i de `hooks-local.mjs`, `mutation-policy.mjs`, `command-policy.mjs`, `porta-reflex.mjs`, `executor-mutacio.mjs`, `segella.mjs`, `segell-auto.mjs`, `git-staged.mjs`, `obrir_torn.mjs`, `porta-plantilles.mjs`, `.claude/settings.json`, `.agents/hooks.json`, `PROTOCOL_PETORRETA.md`, `QUI_SOC.md`, `consell.json`, `cervell.json`, `.agents/index.md`, `BASELINE.md`, `BIOS_COGNITIU` i `LEDGER.md` (capçalera). Cada troballa cita fitxer i línia o una ordre reproduïble.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

1. **Sense refutació creuada.** Ni subagents ni Workflow (G-02). La memòria d'auditories prèvies diu que ~27 % de les troballes d'agents són falses, i estes no han passat cap segon parell d'ulls. Tracta-les com a primera passada. Codex o MarIA poden i han de rebatre-les a l'Olivera.
2. **Sense cerca.** Tota afirmació del tipus «no existix» o «ningú ho usa» es limita als fitxers que he llegit, enumerats a Verificació. No he mesurat l'ús de cap plantilla.
3. **Arxiu:** he llegit de manera dirigida quatre documents de `90_arxiu_historic/` per a buscar els «64», perquè la petorreta ho mana i dient-ho. No n'he fet cap ús de RAG.
4. **No he pogut determinar** si, a més de `core-taxonomia-estricta`, hi ha altres fitxers de skills canviats respecte del segell. Tampoc quin commit la va introduir, ni si el hook de Git està actiu (G-01, G-08).
5. **No he verificat el desplegament** (W-01): parle del manifest compilat, no del que servix producció.
6. **No he tocat codi, ni `.agents/`, ni l'ESTAT, ni el LEDGER.** La política ho impedix (G-05). El torn `torn_b0e47896…` queda **obert**. El relleu el deixe preparat ací davall perquè l'anote qui tinga lease o el Mestre a mà:

```markdown
## ESTAT_ACTUAL · 260924_0652 · Claude · Auditoria de fortificació (Gàbia, skills, plantilles, mapa 8x8)

- Torn `torn_b0e47896-3370-462d-b4d2-534031c294a5` (documents). Entrega [[260924_0652_auditoria_claude]]. Zero codi tocat.
- Gàbia tancada del tot: segell 455a0fad ≠ 88f0ec03 per `core-taxonomia-estricta` instal·lada fora del segell; executor inservible; Agent/Workflow/Skill/ls/tancament --check denegats.
- Següent acció: el Mestre reconcilia el segell (runbook G-01) i decidix F1 (matcher del PreToolUse) abans de cap altra petorreta. Decisions pendents: C-01, C-04, W-01 i la política d'etiquetes 8x8.
- Acta Marmota pendent.
```

```markdown
260924 | auditoria | Claude | Gàbia tancada per skill sense segell; mapa temàtic 8x8 proposat
```

7. **Recordatori (AGENTS §14):** falta l'Acta Marmota d'esta jornada.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260924_0630_prompt_fortificacio_opus]]
- [[260924_0645_pla_implementacio_opus]]
- [[../10_actes/260923_1535_auditoria_claude]]
- [[../90_arxiu_historic/260924_0435_auditoria_ultracode]]
- [[auditoria_canonica]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
