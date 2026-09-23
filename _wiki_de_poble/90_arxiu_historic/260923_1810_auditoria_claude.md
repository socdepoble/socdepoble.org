---
type: informe
status: esborrany
description: 'Auditoria del Brain i de les portes CLI: cadàvers validats en verd, portes apagades per caixa a la CI i canals de consentiment tapiats.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_63de82b8-a259-4b4a-a8c4-590c723a80f8:07282a8c-bb52-4cc3-8bf2-5514a23a46bb
---
# Auditoria forense del Brain i de la cadena de portes

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_63de82b8-a259-4b4a-a8c4-590c723a80f8:07282a8c-bb52-4cc3-8bf2-5514a23a46bb |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T15:59:24.910Z |
| Modificació | 2026-09-23T16:12:00.000Z |
| Propietari | Claude |
| Aprovació humana | pendent |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada i llegida íntegrament abans d'escriure: `_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md`, ruta `auditoria` v2.0.0, via `document.mjs context` sobre el torn `torn_63de82b8`. El rebut acredita entrega, no comprensió ni autorització. Mode AFK respectat: zero fitxers de codi modificats.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-23: auditoria forense de `tooling/brain/` i de les portes CLI, per encàrrec de `260923_1735_prompt_auditoria_brain_claude.md`. Llegida i contrastada l'auditoria de Codex de les 17:52. Cap canvi de codi, dades, esquema ni configuració.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen

El Mas no té un problema de peces dolentes: té un problema de **peces sense endollar i de portes que declaren verd sense mirar**. Pràcticament tot el que he auditat està ben escrit. El que falla és la unió: un hook amb el cos buit que una porta valida per un comentari, un pany que accepta `null` com a «intacte», un verificador que s'apaga sol a la CI per una lletra majúscula, i un canal de consentiment que llança sempre perquè el seu propi camp de guarda naix ja posat.

La frase «cadena de portes inviolable» del prompt no es sosté amb l'evidència: **el commit `d2f07d65`, el darrer del repositori, està a l'arbre amb el segell trencat**. La cadena existix i és bona; el que no existix és la garantia que s'execute.

Tall d'evidència: `d2f07d65e3f088363faece4d7b920f74e517efaa`, 23-09-2026 18:10 Europe/Madrid, branca `backup-notes-publish`. No s'ha llegit `90_arxiu_historic/` (AGENTS §5).

### C1 · P0 — Quatre hooks de git són cadàvers i la porta els declara instal·lats

**Fitxer:** `tooling/wiki/reflex_petorreta.mjs:83-86` i `.husky/{post-commit,pre-merge-commit,pre-applypatch,post-applypatch}`

`REQUIRED_HOOKS` exigix açò per a `post-commit`:

```js
['post-commit', [/SDP-REFLEX-HOOK:v2:post-commit/, /consume-commit/]],
```

I `.husky/post-commit` conté açò, sencer:

```sh
#!/bin/sh
# SDP-REFLEX-HOOK:v2:post-commit
# consume-commit
```

Els dos regex casen **amb els dos comentaris**. Mesurat: els quatre fitxers fan 59-61 bytes i tenen **0 línies no-comentari**. La porta comprova que hi haja un text, no que s'execute una acció. `pre-commit` es valida només amb `/npm run gate/`: no es comprova ni `porta-documents --staged`, ni `npm run tancar`, ni `lint`, ni els tests, que sí que hi són.

**Conflicte amb:** AGENTS §4 (cap tasca tancada sense tancament executat) i la premissa del prompt.

**Proposta conservadora:** que la porta execute el hook en sec contra un repositori de fixtura i comprove l'efecte, no el text. Mentrestant, com a mínim exigir una línia executable: `grep -vcE '^\s*(#|$)' > 0`. No esborrar els fitxers: cal decidir abans si els quatre hooks han de fer alguna cosa o si s'han de retirar del contracte.

### C2 · P0 — `hash: null` desactiva la Llei Z i la porta diu «intacte»

**Fitxer:** `tooling/gates/segella.mjs:66`

```js
const ok = oldSeal.hash === null || oldSeal.hash === hash;
```

Escrivint `{"hash": null}` a `.agents/SKILLS_SEAL.json` la Llei Z queda desactivada de manera permanent i silenciosa. Provat i revertit en el mateix procés:

```
PROVA hash:null  →  ok=true  motiu=intacte
pany restaurat   →  ok=false motiu=ruptura
```

El camí de fallada és exactament el que el segell diu protegir: modificar les regles d'amagat. A més, `.agents/SKILLS_SEAL.json` **no és a `CRITICAL_SEED_PATHS`** de `reflex_petorreta.mjs`, de manera que el Reflex tampoc vigila el pany.

**Proposta conservadora:** `hash` absent, buit o `null` és `ok: false, motiu: 'pany invàlid'`. Un pany sense hash no és un pany. I afegir `.agents/SKILLS_SEAL.json` al seed crític.

### C3 · P0 — El segell està committejat trencat: la cadena ja s'ha travessat

**Evidència de git, no inferència:**

```
pany a HEAD:                6e288332 (filesCount 18)
hash real de l'arbre a HEAD: 354afc9e (19 fitxers)
```

El commit `d2f07d65` (hui, 17:46) va afegir `.agents/skills/core-estrategia-ia/SKILL.md` (+24) i modificar `.agents/skills/core-automillora/SKILL.md` (+33). Les dos tenen `mtime` 17:31. **Cap de les dos escriptures va deixar traça a `.agents/runtime/segell.log`**, que sí que conté la de les 14:34 sobre `sdp-workflow/SKILL.md`.

Dues coses, i cal no confondre-les:

1. **El resegellat automàtic funciona** (`tooling/gates/segell-auto.mjs`) però només dispara amb el matcher `Write|Edit|NotebookEdit`. Una escriptura per `Bash` (`sed`, heredoc) no el desperta. Les dos skills de les 17:31 van entrar per eixa porta.
2. **El commit es va fer igualment.** `.husky/pre-commit` executa `npm run tancar` i `npm run gate`, i el Segell és el **pas 3 de 56**: hauria d'haver avortat. Que el commit existisca vol dir `--no-verify`, o que el hook no es va executar. Convé saber quina de les dos, perquè la reparació és diferent.

Apunt mecànic: **`HUSKY=0` no serveix per a saltar-se'l ací.** `git config core.hooksPath` val `.husky` (no `.husky/_`, que és el que husky 9.1.7 escriu). Git executa `.husky/pre-commit` directament i el llançador `.husky/_/h` —l'únic que llig `HUSKY`— no s'executa mai. Efecte lateral d'això: **`.husky/commit-msg` no existix**, i `.git/hooks/commit-msg`, que sí que existix des de l'agost, queda ignorat per `hooksPath`. Cap missatge de commit es valida.

**Proposta conservadora:** un pas de verificació en CI que recalcule el segell contra el pany a cada push (una línia), perquè un `--no-verify` local no puga arribar a `main` sense que ningú se n'assabente. I ampliar el matcher de `segell-auto` a `Bash`, o —millor— moure el resegellat a `post-commit`, que és un dels quatre cadàvers de C1 i està lliure.

### C4 · P0 — La Porta SCC s'apaga sola a la CI per una divergència de caixa

**Fitxers:** `tooling/gates/verificador-scc.mjs:12,128,133,143`, `tooling/gates/tractor-graella.mjs:25`, `tooling/wiki/lib/project_paths.mjs:66`

La doctrina (AGENTS §2) va passar els noms a minúscules. El disc va obeir. **El codi no.** I com que macOS és case-insensitive, ningú ho ha vist mai en local. La CI és `ubuntu-latest`.

Comprovació component a component, que és com es comporta ext4:

| Ruta que el codi busca | ext4 (CI) | APFS (Mac) |
| --- | --- | --- |
| `…/04_escriptori/00_INDEX_ESCRIPTORI.md` | **MANCA** | existix |
| `…/04_escriptori/00_Bandeja_d_Entrada` | **MANCA** | existix |
| `…/04_ESCRIPTORI/01_Produccio/contracte_graella.md` | **MANCA** | existix |

El disc, en caixa exacta segons `git ls-files`: `00_index_escriptori.md`, `00_bandeja_d_entrada`, `01_produccio`, `02_investigacio_ia`.

Conseqüències, una per una:

- **`verificador-scc.mjs:128` + `:133`.** El `readFile` de l'índex falla a la CI i el `catch` fa `return`. **Tota la comprovació d'ancoratge de l'Escriptori se salta en silenci.** El comentari del codi ja ho confessa: *«Si no hi ha índex, saltem (encara que hauria de ser error)»*.
- **`verificador-scc.mjs:12` + `:120`.** El `readdir` de la safata falla i el `catch` és buit. **El límit de 20 elements d'AGENTS §12 no es comprova mai a la CI.**
- **`verificador-scc.mjs:143`.** `relPath.startsWith('00_Bandeja_d_Entrada')` és case-sensitive **sempre**, també a macOS: l'exclusió que el codi pretén no s'aplica mai i la safata s'audita per ancoratge, contra la seua pròpia intenció declarada dos línies amunt.
- **`tractor-graella.mjs:25`.** A la CI no troba la fitxa i canta `fitxa-absent`: un error **fals**, sobre un fitxer que hi és. Avui no es veu perquè la cadena mor al pas 3.
- **`project_paths.mjs:66`.** `INDEX_ESCRIPTORI_FILE` apunta a la caixa antiga i, a més, **no el crida ningú** (0 referències a tot l'arbre).

Detall que agreuja: **la porta és hui més estricta al Mac que a la CI.** Just a l'inrevés del que caldria.

**Proposta conservadora:** no reanomenar res al disc. Corregir els literals del codi a la caixa real i afegir una porta petita que compare cada literal de ruta amb `git ls-files` (case-sensitive) i falle si divergixen. És la mateixa classe de porta per a un problema que tornarà a passar cada vegada que la doctrina canvie un nom.

### C5 · P0 — El canal de consentiment de la zona humana és inabastable per construcció

**Fitxer:** `tooling/documental/turns.mjs:78,230,238`

`openTurn` escriu `humanInventoryVersion: 1` a **cada** torn nou (línia 78). I `startHumanWatch` comença així (línia 232):

```js
if(turn.humanInventoryVersion===1||turn.humanBaseline) throw new Error('Inventari humà ja establit; no es pot reiniciar');
```

Executat contra el torn que he obert per a esta auditoria:

```
startHumanWatch              → LLANÇA: Inventari humà ja establit; no es pot reiniciar
acknowledgeHumanZoneChanges  → LLANÇA: No hi ha vigilància humana activa al torn
```

No és que ningú les cride: **és que si algú les cridara, llançarien sempre.** `turn.humanBaseline` no es pot establir mai, i per tant el reconeixement de canvis tampoc. Mentrestant `checkTurn` (línia 158) afig `Zona humana modificada: <fitxer>` per cada canvi a `01_produccio`.

**Conseqüència operativa:** quan el Mestre toca la seua pròpia carpeta —cosa que AGENTS §12 no sols permet sinó que reserva per a ell—, **el torn no es pot tancar mai i no hi ha cap manera legítima de registrar-ho**. L'única eixida que queda és falsejar-ho, i això no s'ha de fer.

**Proposta conservadora:** `startHumanWatch` ha d'acceptar un torn amb `humanInventoryVersion: 1` —que és l'estat normal de tot torn— i establir la línia base a partir de l'inventari actual. La guarda contra el reinici ha de mirar només `turn.humanBaseline`. Dues paraules de codi; la decisió de si el reconeixement necessita una signatura humana explícita és del Mestre, no meua.

### C6 · P1 — 47 de 56 portes no s'executen mai, i `--diagnostic` en corre 5 i declara `valid`

**Fitxer:** `tooling/gates/run-portes.mjs`

Mesurat sobre el mòdul, no estimat:

```
TOTAL PASSOS: 56
readOnly (els únics de --diagnostic): 5
Posició del Linter: 9 de 56
```

- La cadena fa `process.exit(1)` a la primera fallada. **Ara mateix mor al pas 3** (Segell de skills, per C3): **53 portes sense notícies**.
- Encara que el segell es repare, el pas 9 és el Linter amb `--max-warnings=0` i **64 avisos**: **47 portes continuarien sense executar-se**.
- `--diagnostic` filtra `readOnly:true`, que són **5 passos**, i imprimix `{"diagnostic":true,"failures":0,"valid":true}`. Eixe `valid: true` significa «5 de 56 han passat», i no ho diu enlloc. És el mode que corre l'automatisme horari.

**Proposta conservadora:** un mode `--continua` que acumule fallades i recórrega les 56 (la variable `failures` ja hi és, només la fa servir `--diagnostic`), i que la sortida JSON porte sempre `cobertura: "5/56"` al costat de `valid`. Cap porta canvia de comportament; només deixem de confondre «no ha fallat» amb «s'ha comprovat».

### C7 · P1 — El cens de skills viu en sis llocs i cap dos coincidixen

**Actualització en viu:** mentre jo auditava, a les **17:58**, algú (MarIA, presumiblement) ha afegit `triggers_on` a `core-automillora` i `core-estrategia-ia`. He reverificat tot este bloc després del canvi. **Les 9 proves que fallaven ara són 1**, i eixa que queda és la que destapa la causa arrel. Esmene doncs la xifra que Codex i jo donàvem.

El nombre de skills està escrit a mà en sis llocs independents. Comptat ara mateix:

| Font | Compte |
| --- | --- |
| `SKILL.md` al disc | **18** |
| directoris a `.agents/skills/` | **18** |
| `filesCount` del pany `SKILLS_SEAL.json` | **18** (i compta `.md`, que són **19**) |
| `.agents/skills_index.json` | **17** |
| symlinks a `.claude/skills/` | **16** |
| `tests/backend_consolidacio.test.mjs:51` | **16**, cablejat — i també al títol del test |

**Cap d'estes xifres es deriva de cap altra.** Crear una skill obliga a tocar sis llocs a mà, i ara mateix no n'hi ha dos d'acord. La prova que queda roja ho diu sense embuts:

```
✖ catàleg: 16 IDs iguals, dues escriptures idempotents i check sense mutació
  AssertionError: 18 !== 16
```

Conseqüències concretes que continuen vives després del pedaç de les 17:58:

- **`.claude/skills/` té 16 symlinks**, tots amb data 22-09 01:21, fets a mà. **Cap script del repositori nomena `.claude/skills`** (grep sobre `tooling/`, `scripts/`, `package.json`, `.agents/*.json`: zero coincidències). `core-automillora` —la skill d'automillora— i `core-estrategia-ia` **continuen sense symlink: cap agent les pot invocar**.
- **`core-estrategia-ia` continua fora de `skills_index.json`**, que no s'ha regenerat.
- **`cataleg_skills --check` continua roig**, ara per un motiu distint: `Projecció divergent: .agents/manifest.yaml` i `Projecció divergent: .agents/skills/00_INDEX_SKILLS.md`. Les dues skills noves no estan projectades ni al manifest ni a l'índex.

Corregir `triggers_on` era necessari i ha desbloquejat 8 proves, però **no arregla la classe**: la skill continua inabastable per tres vies alhora.

**Proposta conservadora:** una sola font de veritat, que ja existix — `build_skills_index.mjs` llig el frontmatter del disc i està ben escrit. Que ell genere l'índex, els symlinks de `.claude/skills/` i la projecció del manifest, i que el test compte el disc en compte de dur el 16 escrit. Cap comportament canvia; deixem de comptar a mà en sis llocs.

### C8 · P1 — El Somiador mou fitxers fora del repositori i el reancoratge es degrada a avís

**Fitxer:** `tooling/brain/somiador.mjs:16,95`

```js
const ARXIU_EXTERN = path.join(ARREL, '../_arxiu_wiki_de_poble');
```

Els fitxers de més de 500 KB ixen del repositori amb `fs.renameSync`. **Fora del control de git no hi ha recuperació.** I el reancoratge, que és el que evita que allò que queda es convertisca en orfe:

```js
try { if (!dryRun) execSync('node tooling/wiki/llaurador_indexs.mjs --escriu', …); }
catch { console.error("Error al llaurador."); }
```

Si el llaurador falla, el Somiador imprimix igualment *«Cicle de son finalitzat. El cervell ha madurat i descansat»* i ix amb 0. **L'ordre és el problema**: mou primer, reancora després, sense transacció. Una fallada deixa l'Escriptori buit i els índexs apuntant a fitxers que ja no hi són.

Dos detalls més: `f.includes('BUNDLE')` busca majúscules, però la taxonomia d'AGENTS §2 i de la skill del Reflex escriu `macro_bundle` i `micro_bundle` **en minúscules** — la condició de purga externa no casa mai amb un nom generat pel sistema actual. I el Somiador **no té dry-run per defecte**.

**Atenuant que cal dir:** hui només el crida `tests/fortificacio.test.mjs`, i amb `--dry-run`. `despertar.mjs` ja no l'invoca. És una arma carregada sense gallet, no un incendi actiu. El risc és que qualsevol agent l'execute a mà.

Ja registrat de forma independent com a P2 a `.agents/deute/.promesa-deute.json`.

**Proposta conservadora:** invertir l'ordre (calcular el pla, reancorar, i moure només si el reancoratge ha anat bé), fer `--dry-run` el valor per defecte i exigir `--executa` explícit, i que el `catch` propague amb `process.exitCode = 1`.

### C9 · P1 — 31 torns, 2,7 MB, i 10 làpides que no es poden tancar

Cada torn desa a `initial` un hash per fitxer de tot l'arbre: **~730 entrades, ~85 KB per torn**. Estat actual:

```
tancats: 1 | vius: 22 | caducats i mai tancats: 10
```

**Correcció d'una sospita meua:** `readTurn` (`turns.mjs:43`) **sí** que aplica la caducitat i llança `Torn caducat`. Això no millora la situació, l'empitjora: un torn caducat no es pot tancar (la lectura llança abans d'arribar-hi), no es pot reobrir i ningú el purga. Són **làpides permanents**, i qualsevol document que hi estiga ancorat queda invalidable per sempre.

Efecte lateral que contamina qualsevol auditoria futura: com que cada torn llista tots els fitxers, **un grep pel nom d'un script del Brain dóna ~32 coincidències falses** vingudes de `.agents/runtime/turns/`. Si algú compta referències sense excloure eixa carpeta, conclourà que tot s'usa.

**Proposta conservadora:** desar a `initial` només un hash de l'arbre més les entrades de la superfície del torn, i un `torns:purga` que moga els caducats a un arxiu comprimit deixant una làpida d'una línia. Cap dels dos canvis toca la semàntica de la verificació.

### C10 · P2 — Codi mort al nucli documental i al Brain

Comptat distingint «ningú l'importa de fora» de «ningú el crida enlloc, ni dins del seu fitxer». **Mort de veres, quatre funcions:**

| Funció | Fitxer | Nota |
| --- | --- | --- |
| `startHumanWatch` | `documental/turns.mjs` | és C5 |
| `acknowledgeHumanZoneChanges` | `documental/turns.mjs` | és C5 |
| `templateParity` | `documental/core.mjs` | xarxa de seguretat desconnectada |
| `invalidaEmissio` | `brain/context_documental.mjs` | — |

**`templateParity` mereix un matís honest.** Compara els encapçalaments reals de cada plantilla amb els que el contracte declara: és exactament el verificador que hauria de detectar que una plantilla ha derivat del seu contracte. L'he executada a mà sobre les 13 rutes: **0 divergències**. No és un bug actiu; és una xarxa correcta que ningú ha penjat. Endollar-la a `porta-plantilles` són dues línies i tanca la classe de problema que Codex reporta a B5 (plantilla v2.3.0 al cos, ruta v2.2.0 al contracte — **confirmat**).

**Scripts orfes a `tooling/brain/`** (0 referències des de codi o configuració, excloent-ne `.agents/runtime/turns/`): `260830_neteja_deute.mjs`, `260830_pedacos_arrel.mjs`, `260830_purga_maquinari.mjs`, `260831_rescat_tokens.mjs`, `add_frontmatter_to_agents.mjs`, `cens_cromatic.mjs`, `classificador_tasques.mjs`, `crear_mini_bundle_z.mjs`, `migrate_skills.mjs`, `reflex_plantilles.mjs`, `reparar_frontmatter_skills.mjs`, `termometre_context.mjs`, `build_context_pack.py`, `sync_agent_mirror.py`. **Són 14.**

Un d'ells no és només orfe, és **inert**: `reflex_plantilles.mjs` fa `import './matrix.mjs'` per donar un àlies de compatibilitat, però la guarda CLI de `matrix.mjs:16` compara `import.meta.url` amb `process.argv[1]`, i sota l'àlies eixos dos valors **mai coincidixen**. `node tooling/brain/reflex_plantilles.mjs` carrega el mòdul i no fa res, en silenci.

**Prova en directe del valor de `templateParity`:** mentre escrivia esta auditoria, un altre procés ha afegit els camps `Model IA` i `Tokens consumits` a **les 13 plantilles** i a **87 documents de `90_arxiu_historic/`** (el motor de telemetria de consum). La ruta `prompt.local` del contracte **continua declarant v2.2.0 i el seu joc de seccions anterior**. És a dir: la plantilla acaba de divergir del contracte una altra vegada, en directe, i cap porta ho ha dit. `templateParity` és precisament la funció que ho cantaria, i està desconnectada. Això converteix el seu endollament de «net a fer» en «la peça que falta».

**Proposta conservadora:** no esborrar res encara. Inventariar-los amb una capçalera `@estat: quarantena` i moure'ls en un torn específic, després de decidir un per un. Els que porten data al nom (`260830_*`, `260831_*`) són pedaços d'una migració acabada i són els candidats més clars.

### C11 · P2 — Els 64 avisos, per on cauen

```
52  no-unused-vars        28  src
12  react-hooks/…         13  tooling/gates
                          11  tooling/wiki
                           6  scripts
                           5  tooling/brain
```

Concentració: `tractor-fitxa-gestor.mjs` (9) i `prompt_sgq.mjs` (7) en sumen 16, i són els dos cadàvers de maquinària que l'acta de les 16:30 ja va inventariar. Els 28 de `src/` toquen pantalla i cauen sota la Llei del Píxel. **Cap d'estos 64 és brossa nova**; són el mapa del que està a mitges.

### Contrast amb l'auditoria de Codex (17:52)

**On m'esmena i accepte:**

- **B1.** Té raó i m'ho corregisc: `turns.mjs:109` **no és un bypass d'acceptació**. El document sense rebut ja és rebutjat; el que es perd és el **diagnòstic complet**, no la validació. El seu apunt tècnic és el bo: no basta llevar el `return`, perquè el codi següent usa `m[1]`. Severitat real: P1 de qualitat de diagnòstic, no P0 de seguretat. Ho retire del meu bloc de P0.
- **B5.** La secció `Instrucció del torn` **ja està a la plantilla**: la proposta que vaig fer a l'acta de les 16:30 està aplicada. No la repetisc. La seua troballa nova (v2.3.0 al cos vs v2.2.0 al contracte) l'he verificada i és certa.
- **B3.** Coincidim que `.husky/pre-commit` és el camí actiu i que `tooling/wiki/pre-commit.mjs:122` (que crida `06_EINES/canonada.mjs`, absent) és el camí antic i no bloqueja res hui.
- **B6.** Coincidíem en les 9 proves que fallaven per `core-automillora`. **La xifra ha canviat mentre auditàvem:** amb el `triggers_on` afegit a les 17:58, ara **en falla 1**, i és la del 16 cablejat de C7. Ho esmene per a tots dos.

**On l'amplie**, amb coses que el seu tall no cobrix: C1 (els quatre hooks cadàvers validats per comentari), C2 (`hash: null`), C3 (el segell committejat trencat), C4 (la caixa que apaga la SCC a la CI), C5 (el canal humà tapiat) i C7 (les dues skills sense symlink).

**On el matise:** ell diu que el hook actiu «invoca porta-documents, tancar, gate, lint i test». És cert que el fitxer ho diu. C3 demostra que **el darrer commit del repositori no va passar per ahí**. El hook està escrit; l'execució no està garantida.

**No discutisc** el seu bloc d'enxufabilitat (E1-E4) ni el mapa de backend: és el seu abast i el treball és sòlid. Una nota sobre E3: confirme que `tooling/gates/tractor-frontissa.mjs` no apareix a `run-portes.mjs`; les 56 entrades de la cadena són les que he llistat i eixa no hi és.

### Motors cognitius proposats (codi, no prosa)

Sis peces petites. Cap altera cap pantalla; totes tanquen una classe sencera de fallada, no un cas.

1. **`porta-caixa.mjs`** — llig tot literal de ruta del codi (`_wiki_de_poble/...`) i el contrasta amb `git ls-files` en case-sensitive. Mata C4 i impedix que torne cada volta que la doctrina reanomene alguna cosa. ~40 línies.
2. **`porta-hooks.mjs`** — substituïx `REQUIRED_HOOKS` per una execució real: prepara un repositori de fixtura, fa un commit que ha de fallar i un que ha de passar, i compara. Mata C1. Mentre no hi siga, la guarda mínima és exigir una línia executable.
3. **Guarda del pany** (`segella.mjs:66`) — `hash` absent, buit o `null` = ruptura. Mata C2. Una línia.
4. **Verificació de segell a la CI** — un pas a `wiki-integrity.yml` que recalcule i compare. Mata la reincidència de C3 sense dependre de la disciplina local.
5. **`--continua` i `cobertura` a `run-portes.mjs`** — la cadena recorre les 56 acumulant, i el JSON diu sempre quantes s'han comprovat de quantes. Mata C6.
6. **Cens únic de skills** — `build_skills_index.mjs` genera índex, symlinks de `.claude/skills/` i projecció del manifest; el test compta el disc en compte de dur el 16 escrit. Mata C7 sencer, no sols el símptoma.
7. **`templateParity` endollada a `porta-plantilles`** — dues línies; detecta la deriva plantilla/contracte que Codex reporta a B5. Tanca C10.

**Ordre que propose**, alineat amb el T0-T5 de Codex i sense envair-lo: el `triggers_on` **ja el va fer MarIA a les 17:58** i ha desbloquejat 8 de les 9 proves. Queda: el pany i els literals de caixa (C2, C4: línies soltes que obrin la cadena), després el cens únic (C7, que tanca la prova que resta), després el resegellat i la CI (C3), i després el canal humà (C5). Els tres primers caben en un torn curt.

### Millora de `prompt_local.md`

Coincidisc amb Codex en separar `mode: auditoria` de `mode: implementacio`: este prompt ordena «formula propostes de motors cognitius en codi» i «NO S'HA DE MODIFICAR… CAP FITXER JS» alhora, i eixa contradicció l'ha de resoldre qui l'escriu, no qui el llig. Hi afegisc tres coses:

- **La secció 0 no s'ha de poder marcar sense prova.** Les tres caselles d'este prompt estaven marcades `[x]`, i les tres són falses: el pla de MarIA **no té rebut**, els documents **no estaven ancorats** (`tancament.mjs --check` ho canta) i l'Escriptori tenia quatre documents sense àncora. Una casella marcada a mà no és evidència. O la porta les verifica, o millor que no hi siguen.
- **«Tall d'evidència: [HEAD + hora]» arriba sense omplir.** Si el camp és literal a la plantilla, cap auditor el pot fer servir per acarar troballes. Hauria de generar-lo `document.mjs create`.
- **Llevar «cadena de portes inviolable» del bloc de Context.** És un bloc normatiu que es copia literal a cada petorreta, i afirma una cosa que C3 desmenteix amb una xifra. Un bloc fix que menteix contamina totes les auditories que el llegixen.

`requires_human_decision: false` per a esta entrega. Les propostes de codi no s'han aplicat i continuen fora d'abast fins que el Pla estiga consensuat.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Tot el que segueix s'ha executat en esta sessió, sobre `d2f07d65`:

- `node tooling/gates/run-portes.mjs` → **exit 1 al pas 3 de 56** (Segell de skills: `354afc9e` ≠ `6e288332`). Plantilles i Autoritat en verd.
- `npx eslint src tooling scripts tests --max-warnings=0` → **64 avisos** (52 `no-unused-vars`, 12 `react-hooks/exhaustive-deps`), format JSON per a l'agrupació per zona.
- `node tooling/gates/tancament.mjs --check` → **roig**. Verd: `plantilles`, `autoritat`, `ledger`. Roig: `segell`, `skills` (`triggers_on invàlid`), `wiki` (enllaços trencats), `scc` (4 `ESCRIPTORI_UNANCHORED` + 5 `ORPHAN_OPERATIVE`).
- `node tooling/wiki/reflex_petorreta.mjs doctor --ci` → **roig** per baseline del graf divergent.
- **C2 provat i revertit** en el mateix procés: `hash:null → ok=true, motiu=intacte`; pany restaurat → `ok=false, motiu=ruptura`.
- **C5 provat amb execució** sobre `torn_63de82b8`: les dos funcions llancen.
- **C4 provat** amb comprovació component a component (`readdirSync().includes()`), que reproduïx ext4: 3/3 rutes MANQUEN. Contrastat amb `git ls-files`, que dóna la caixa exacta del checkout de la CI.
- **C10 comptat** executant `templateParity(loadContract())` a mà: 13 rutes, **0 divergències**.
- **C1 mesurat**: `wc -c` i `grep -vcE '^\s*(#|$)'` sobre els quatre hooks.
- **Higiene**: ancorats els 6 documents de la reunió a `00_index_escriptori.md`; `ESCRIPTORI_UNANCHORED` de **4 a 0**. LEDGER signat de nou (`verify-ledger --sign`) després d'afegir-hi el relleu.
- **C3 verificat** amb `git show HEAD:.agents/SKILLS_SEAL.json` contra `calculaSegell()` de l'arbre.
- **C9 comptat** recorrent `.agents/runtime/turns/*.json`. I confirmat en viu: `tancament.mjs --check --turn-id` canta `_wiki_de_poble/04_escriptori/02_investigacio_ia/260922_0500_informe_idees_noves_skills.md: Torn caducat` — un document real, ancorat a una làpida, invalidable per sempre.
- **Reverificació posterior al canvi de les 17:58** (`triggers_on` afegit per un altre procés mentre jo auditava): `npm run test:node` → **25 proves, 24 passen, 1 falla** (era 9). `cataleg_skills --check` → roig per projecció divergent. `.claude/skills/` → continua a **16**. `skills_index.json` → continua a **17**. Els comptes de C7 són posteriors a eixe canvi.
- **Arbre concurrent:** el hash del segell ha canviat dos vegades durant l'auditoria (`354afc9e` → `d06d9901`) per escriptures d'un altre procés sobre `.agents/skills/`, **cap de les dos resegellada**. És C3 passant una tercera volta davant dels meus ulls.

No s'han executat builds, migracions, publicacions ni peticions externes. **Cap fitxer de codi, dada, esquema ni configuració modificat.** L'única escriptura d'este torn és esta auditoria. El pany del segell s'ha restaurat al seu valor original dins del mateix procés que el va alterar per a la prova.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

Auditoria de `tooling/brain/` i de les portes CLI. **No** és certificació de seguretat, ni cobrix `src/`, ni el backend, ni les fronteres de dades amb Sollutia —això és l'abast de Codex i no el duplique—.

Les 47 portes que la cadena no arriba a executar **no s'han auditat una per una**: sé que no s'executen, no sé si passarien. Afirmar-ho seria inventar.

C3 estableix que el commit `d2f07d65` té el segell trencat. **No he determinat si va ser `--no-verify` o una fallada del hook**, i les dos tenen reparacions distintes. Cal decidir-ho abans de reparar.

Les propostes de la secció de motors cognitius són **disseny, no codi escrit**. Les xifres de línies són estimacions.

**Arbre concurrent, i cal dir-ho clar:** durant esta auditoria un altre procés ha modificat **més de 100 fitxers** que no són meus —les 13 plantilles, 87 documents de `90_arxiu_historic/`, `src/data/wikiManifest.js`, `protocolledge.json` i dues skills—. No els he tocat ni auditat; les meues troballes es refereixen a `d2f07d65`. Qui revise açò ha de saber que l'arbre no estava quiet. Les escriptures meues són exactament sis: esta auditoria, `00_index_escriptori.md`, `.agents/ESTAT.md`, `.agents/LEDGER.md` i els dos fitxers de runtime del meu torn.

L'auditoria de Codex de les 17:52 s'ha llegit sencera i contrastada. El consens de les tres IAs i el Pla d'Implementació de MarIA continuen pendents; esta entrega no els presumix. Acta Marmota de jornada pendent.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260923_1752_auditoria_codex]]
- [[260923_1735_pla_implementacio_fortificacio]]
- [[260923_1630_implementacio_claude]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]
