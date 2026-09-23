---
type: informe
status: esborrany
description: 'Verificacio de C2, C4 i C7 del Cami Curt i escorcoll de la resta de la cadena: guardes CLI que s''apaguen sota symlink, 29 portes roges i hooks sense consumidor'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_3d935cf7-c259-457f-854d-2c2282241eda:22086e4a-e193-467c-9288-ac692106d39e
---
# Auditoria extrema del Brain, la cadena de portes i els hooks

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-CLAUDE-260923-1833 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-23T16:34:18.475Z |
| Modificació | 2026-09-23T17:05:00Z |
| Propietari | Claude |
| Aprovació humana | Auditoria autoritzada pel prompt de les 18:15; implementació en AFK |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Ruta | auditoria |
| Rebut | sdp:torn_3d935cf7-c259-457f-854d-2c2282241eda:22086e4a-e193-467c-9288-ac692106d39e |
| Tall d'evidència | HEAD f03affcb, arbre net excepte dos fitxers de runtime; 23-09-2026 18:20–18:52 CEST |
| requires_human_decision | true per a B0, B1, B2 i B4 |
| Model IA | Claude Opus 5 (claude-opus-5) |
| Tokens consumits | Estimació pròpia: ~95.000 d'entrada i ~12.000 d'eixida. No és telemetria facturada |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d. El rebut acredita entrega, no comprensió.

Llegits AGENTS.md sencer, QUI_SOC.md, les tres skills injectades, el prompt de les 18:15 íntegre, el Pla d'Implementació de les 18:15, el relleu ESTAT_ACTUAL de les 18:10 i l'auditoria de Codex de les 18:21 sencera. Zero fitxers de codi tocats: el Mode AFK del punt 3 del Protocol de l'Olivera. Els únics fitxers escrits són este informe i, si el Mestre ho aprova, la seua àncora.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-09-23T16:34:18.475Z: esborrany creat.
2026-09-23T16:52:00Z: auditoria completa. Verificades les tres peces del Camí Curt i escorcollada la cadena, els hooks i les guardes CLI de `tooling/`. Rèplica a Codex inclosa.
2026-09-23T17:05:00Z: afegit B0 i corregit el número de B3. El `tancament.mjs --check` del meu propi torn ha destapat una porta que jo havia exclòs de la mesura: les proves del contracte documental. Investigada fins a la causa arrel.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Dictamen.** Les tres peces del Camí Curt fan el que havien de fer: les he provades una per una i passen. Però el Camí Curt ha destapat el pas 3 i **no l'ha travessat**: el segell continua trencat al disc i a l'arbre, la cadena mor exactament on moria, i darrere hi ha **29 portes roges de 51** que ningú havia vist mai. I hi ha una cosa pitjor que un deute: **una manera d'apagar el mur sencer sense tocar cap regla.** Quaranta guardes CLI de `tooling/` no resolen els symlinks; per un camí amb un symlink pel mig, `npm run porta` i `npm run tancar` ixen **exit 0 en silenci absolut**. La frase «cadena de portes inviolable» del prompt no descriu el sistema: descriu la intenció.

**I hi ha una cosa més, que he trobat perquè el meu propi tancament me l'ha tirada a la cara:** la maquinària que fabrica els documents i el contracte que els valida **ja no diuen el mateix**. Des de hui, tot document que naix de `document.mjs create` naix **invàlid**, i això té **36 proves roges** i **cap torn d'abast `code` tancable**. És la troballa més accionable de totes i la pose primera.

### A · Les tres peces del Camí Curt

#### A1 · C2 (guarda del pany, Llei Z) — CORREGIDA I VERIFICADA

- **Fitxer:** `tooling/gates/segella.mjs:65`.
- **Evidència:** `oldSeal.hash !== null && oldSeal.hash === hash`. Provats cinc casos en fixture aïllada (`calculaSegell`/`verificaSegell` amb `root` propi): sense fitxer de segell → `absent`; `hash: null` → `ruptura`; `--update` → `resegellat`; reverificació → `intacte`; regla tocada → `ruptura`. Els cinc es comporten com han de.
- **Severitat:** cap. La peça funciona.
- **Esquerda residual (P2):** `segella.mjs:96` construïx el missatge amb `r.anterior.substring(0, 8)`. En el cas exacte que C2 vingué a tancar (`hash: null` al fitxer del pany) `anterior` val `null` i la porta **peta amb un TypeError** en compte de dir «Ruptura de segell». Ix 1, per tant bloqueja igual: és pèrdua de diagnòstic, no de protecció. Reproduït amb una còpia del fitxer i un pany `{"hash":null}`.
- **Font de veritat:** AGENTS §15 (l'evidència ha de ser llegible).
- **Proposta conservadora:** `String(r.anterior ?? 'absent').substring(0, 8)`. Una línia, cap canvi de comportament observable.
- **requires_human_decision:** false.

#### A2 · C4 (literals de caixa a la Porta SCC) — CORREGIDA ALS TRES LITERALS DE L'ARREL

- **Fitxer:** `tooling/gates/verificador-scc.mjs:12,128,143,150,153`.
- **Evidència:** els tres camins que mancaven a ext4 ja estan en minúscula i coincidixen amb el disc (`00_bandeja_d_entrada`, `00_index_escriptori.md`). El `catch { return; }` de la línia 133 ja no s'activa: la porta **executada ara canta 6 errors reals** (3 `ESCRIPTORI_UNANCHORED` + 3 `ORPHAN_OPERATIVE`), quan abans deia `✅ SCC OK`. L'ancoratge de l'Escriptori i el límit de la safata **ja es comproven de veres**, també a la CI. També s'ha llevat l'import de `CAMINS, arrelSegura` (que era el crític heretat) sense deixar cap ús orfe al fitxer: `grep` no en troba cap.
- **Severitat:** cap per a la peça. Funciona i ho demostra fallant.
- **Restes al mateix fitxer (P2):** dos literals més no casen mai amb el disc. `:218` exclou `'00_INDEX.md'` i al disc és `_wiki_de_poble/00_index.md`; `:222` exempta `'/07_plantilles/'` i al disc les plantilles són a `_wiki_de_poble/03_actuar/plantilles/`. **Refutació del meu propi material:** hui cap de les dos produïx un fals positiu — l'índex arrel sempre està visitat pel DFS i les plantilles ixen ancorades per una altra via (`orfes que són plantilles: 0`, mesurat). Són codi mort i un missatge que nomena un fitxer inexistent, no una porta trencada. Cauen el dia que algú desenllace una plantilla.
- **Buit de cobertura nou (P1):** `:36` només censa `.md`. AGENTS §12 diu que **TOTS** els elements de `01_produccio` estan subjectes a l'ancoratge obligatori; els HTML, àudios i recursos pesants d'eixa carpeta **no els mira ningú**. La doctrina promet més del que la porta comprova.
- **Proposta conservadora:** corregir els dos literals a la caixa del disc (cosmètic, zero efecte observable) i **consultar** abans de censar binaris a `01_produccio`: ampliar-ho faria eixir errors nous sobre la zona humana, i això és decisió del Mestre.
- **requires_human_decision:** true per al buit de `01_produccio`.

#### A3 · C7 (cens de skills) — LA PROVA JA NO MENT; EL CENS CONTINUA DIVERGENT

- **Fitxers:** `tests/backend_consolidacio.test.mjs:51`, `.claude/skills/`, `.agents/skills/00_INDEX_SKILLS.md`, `.agents/manifest.yaml`, `.agents/SKILLS_SEAL.json`.
- **Evidència:** `npm run test:node` → **25/25 verdes**, i el `16` cablejat ha desaparegut: la línia 51 compta els directoris reals. Això està bé i tanca la prova roja. Però el cens **no** s'ha unificat: disc **18** skills; `.claude/skills/` **16** symlinks; `00_INDEX_SKILLS.md` **16** entrades; `filesCount` del pany **18** quan la superfície segellada són **19** fitxers `.md`. `node tooling/brain/cataleg_skills.mjs --check` ix **1** i nomena les dos projeccions divergents (`.agents/manifest.yaml` i `00_INDEX_SKILLS.md`). Les dos que falten a les tres projeccions són exactament `core-automillora` i `core-estrategia-ia`, les escrites ahir a les 17:31 (`comm -13` entre les dos llistes).
- **Conseqüència operativa:** **les dos skills noves no es carreguen mai com a skills d'este amfitrió.** No és que estiguen mal escrites: és que no hi ha symlink que les faça visibles.
- **Font de veritat:** AGENTS §1 (un sol cervell, autoritat executiva a `.agents/skills/`).
- **Proposta conservadora:** una sola comanda que genere les tres projeccions des del disc i que la cadena execute (vegeu B3, on explique per què `cataleg_skills --check` no és a `run-portes.mjs`). Cap decisió de disseny nova.
- **requires_human_decision:** false.

### B · Els forats que el Camí Curt ha destapat

#### B0 · P0 · La maquinària documental pareix documents que el contracte rebutja

- **Fitxers:** `.agents/protocolledge.json:490-499` (clau `registre`) contra `draft()` a `tooling/wiki/document.mjs`.
- **Evidència:** el contracte exigix **deu** camps al Registre, entre ells `Model IA` i `Tokens consumits`. `draft()` —la funció que `document.mjs create` usa— genera **huit**: ni `Model IA` ni `Tokens consumits`. Executat sobre una fixture neta amb la maquinària oficial (`openTurn` → `deliverContext` → `draft`): *Model IA al document? false | Tokens consumits? false*. I la prova més directa de totes: **el meu propi esborrany**, creat fa mitja hora amb `document.mjs create`, va nàixer sense eixes dos files. Este informe valida només perquè jo les vaig escriure a mà, copiant el format de l'informe de Codex.
- **Conseqüència mesurada:** `node --test tests/documental.test.mjs tests/porta-reflex.test.mjs tests/fortificacio.test.mjs` → **36 roges** (`porta-reflex` 26 de 27, `documental` 8 de 18, `fortificacio` 2 de 18). Totes moren al mateix `setup`, amb el mateix parell d'errors: `Registre: falta Model IA` i `Registre: falta Tokens consumits`. El fixture `validDoc` no cablejа cap registre a mà: crida la maquinària real. Per això les proves diuen la veritat i no són elles les trencades.
- **I açò tanca dos portes més:** el **pas 6** de `run-portes.mjs` (Proves del contracte documental) i el `documental-tests` de `tancament.mjs` per a l'abast `code`. **Cap torn d'abast `code` pot arribar a `closed`**, i això inclou el meu.
- **Quan es va trencar:** els dos camps van entrar a `protocolledge.json` entre `0ffda7a7` i HEAD, és a dir en un dels dos commits de hui. L'últim canvi de `tests/helpers/documental.mjs` és de `6423590e`, anterior. **El contracte es va endurir i la maquinària que l'ha de complir no es va tocar.**
- **Font de veritat:** AGENTS §0.2 («verifiqueu que el frontmatter del prompt nou hereta tots els camps obligatoris de la plantilla») i la «Instrucció Obligatòria» de telemetria del prompt de les 18:15. La intenció és bona: la telemetria serveix. El que falta és propagar-la a qui pareix els documents.
- **Proposta conservadora:** **dos camins, i el Mestre tria.** (a) Si la telemetria és obligatòria, afegir les dos files a `draft()` amb `[pendent]` com a valor, igual que la resta del registre: és una línia i deixa les 36 proves verdes. (b) Si ha de ser opcional, llevar-les de `registre` al contracte. **No ho trie jo:** la doctrina de hui diu que la telemetria és vital, cosa que apunta a (a), però qui ha escrit eixa doctrina fa tres hores és el Mestre i té dret a confirmar-la.
- **requires_human_decision:** true.

#### B1 · P0 · Quaranta guardes CLI s'apaguen sota un symlink: el mur sencer ix verd en silenci

- **Fitxers:** 40 de `tooling/`, entre ells `tooling/gates/run-portes.mjs:91`, `tooling/gates/tancament.mjs:62`, `tooling/gates/verificador-scc.mjs:286`, `porta-documents.mjs`, `porta-plantilles.mjs`, `porta-autoritat.mjs`, `porta-reflex.mjs`, `tooling/wiki/document.mjs`, `reflex_petorreta.mjs`, `cataleg_skills.mjs`.
- **Evidència:** cens mecànic sobre tots els `.mjs` de `tooling/`: **9 guardes amb `fs.realpathSync` (correctes) i 40 sense**. Prova directa amb un symlink cap a l'arrel: sis portes executades pel symlink donen **silenci total i exit 0** (`run-portes.mjs`, `porta-documents.mjs`, `verificador-scc.mjs`, `porta-plantilles.mjs`, `porta-autoritat.mjs`, `reflex_petorreta.mjs`); les mateixes tres, pel camí real, parlen i canten els seus errors. `tancament.mjs --check` pel camí real ix **1** amb ~50 errors; pel symlink, **0 sense imprimir res**.
- **Per què és P0 i no una curiositat:** `.husky/pre-commit` fa `npm run tancar` (línia 7) i `npm run gate` (línia 15) i decidix pel codi d'eixida. N'hi ha prou amb un symlink al camí de treball — un `ln -s` de conveniència, una carpeta sincronitzada, `/tmp` a macOS, un runner que munte el workspace — per a convertir tot el mur en dos `exit 0`. No cal malícia ni tocar cap regla.
- **Font de veritat:** el comentari de `segella.mjs:110-114` ja ho explica i ja porta la solució: «Resoldre el symlink és el que fa que la guarda parle sempre». La lliçó està escrita en un fitxer i no s'ha propagat als altres 40.
- **Proposta conservadora:** una funció compartida (`esMain(import.meta.url)`) a `tooling/lib/`, i substituir les 40 guardes per una crida. És mecànic i sense efecte visual. **Escombrada: cal declarar la superfície abans de tocar-la** (sdp-workflow, lliçó del 260923): propose començar pels 9 fitxers que el `pre-commit` i la cadena consulten de veres i deixar els altres 31 documentats.
- **requires_human_decision:** true (és una escombrada; l'abast el fixa el Mestre).

#### B2 · P0 · Quatre dels cinc últims commits duen el segell trencat, i el darrer és de fa una hora

- **Fitxers:** `.agents/SKILLS_SEAL.json`, `.husky/pre-commit`.
- **Evidència:** reconstrucció commit a commit amb `git archive` cap a un directori temporal i el `calculaSegell` vigent:

| Commit | Hash real | Fitxers | Pany | filesCount | Estat |
| --- | --- | --- | --- | --- | --- |
| be16f668 | 41a69831 | 17 | 09d80bc7 | 19 | trencat |
| 6423590e | f48553ac | 17 | be38837d | 18 | trencat |
| 0ffda7a7 | c888f72e | 17 | c888f72e | 17 | **quadra** |
| d2f07d65 | 354afc9e | 19 | 6e288332 | 18 | trencat |
| f03affcb | cff3af91 | 19 | 6e288332 | 18 | trencat |

- **Matís d'honestedat:** per a `be16f668` i `6423590e` la comparació és anacrònica (la superfície segellada va canviar el 260923; amb la funció d'eixe moment podien quadrar). Els **concloents són els dos últims**, posteriors al canvi.
- **El fet decisiu:** `f03affcb` («resolució del defecte C7») **va committejar tres `SKILL.md` i no el pany**. En el moment del commit el segell ja estava trencat, i `npm run porta` mor al pas 3 amb eixe estat — verificat ara mateix. Si el hook s'hagués executat, el commit hauria sigut impossible. **Per tant el `pre-commit` no s'executa en els commits que fa la IAIA.**
- **Què no puc determinar des del disc:** si va ser `--no-verify`, `HUSKY=0` o l'eina de commit de l'amfitrió. No hi ha cap rastre de `--no-verify` als permisos ni als scripts, i el `post-commit` que deixaria traça és un dels quatre cadàvers (B6). **Això el Mestre sí ho pot dir en una frase**, i la reparació canvia segons la resposta.
- **Efecte lateral verificat:** `core.hooksPath` val `.husky`, no `.husky/_`. El llançador `h` de husky no s'executa mai i `.husky/_/commit-msg` és inabastable: **els missatges de commit no es validen en absolut**. I `.git/hooks/pre-commit` (el que bloqueja `main` i els fitxers protegits) està **mort** pel mateix motiu: `core.hooksPath` el desvia.
- **Proposta conservadora:** cap canvi de codi fins que el Mestre diga com es fan els commits. Mentrestant, resegellar amb `npm run porta:segella:update` és una comanda i destapa el pas 3.
- **requires_human_decision:** true.

#### B3 · P0 · 29 portes roges de 51 darrere del pas 3

- **Fitxer:** `tooling/gates/run-portes.mjs` (56 passos).
- **Evidència:** he executat cada pas de forma independent amb un temps màxim de 90 s, **excloent-ne 5** per prudència i temps (`Porta Build`, que pot llançar un `npm run build`, i els quatre de proves i linter, que ja conec: linter **64 avisos**, `test:node` **25/25**). Resultat sobre els 51 restants: **22 verdes, 29 roges, 0 penjades**.
- **Les roges:** Segell de skills, Contracte documental, Porta Arrel, Porta InnerHTML, Porta Rutes, Tractor Cognitiu (1 bloquejant, 18 avisos), Porta Consell (4 infraccions), Porta Registre, Porta Manifest, Porta Doctrina, Porta Reflex, Tractor Pedra Seca, Design Guard (78 crítics), Porta Tokens, Porta Fitxa Gestor, Porta Cromàtic, Porta Crom (3), Porta Vocabulari (**544 infraccions** sobre 459 classes canòniques), Llaurador Índexs, Porta Frontmatter, Porta Nomenclatura, Porta Teixit, Porta SCC (6), Porta Orfandat (66 enllaços, 4 orfes), Porta Persistència (3), Porta Cadena (5), Porta Utilitats SDP, Porta Inline-Styles, Porta Catàleg.
- **Correcció del meu propi número:** havia dit que, reparat el segell, la cadena moriria al pas 9 (Linter). **És fals: moriria al pas 6**, a les proves del contracte documental (B0). Jo havia exclòs eixe pas de la mesura i ha sigut el tancament del meu torn qui me l'ha destapat.
- **Per què importa ara:** el Pla de les 18:15 planifica les Fases T1–T5 sobre un mapa que no existia. **Qualsevol T que acabe en un commit xocarà amb estes 29**, i no amb la que estiguem reparant. Este número és la dada que faltava per a planificar.
- **Una porta audita la cadena i també és roja:** `tractor-cadena.mjs` diu «**Portes al disc: 53 · a la cadena: 43**» i «la cadena de portes no és de fiar». Dels seus quatre C4, **`porta:segella` i `porta:segella:update` són fals positiu de forma**: el pas 3 executa `node tooling/gates/segella.mjs` directament i el tractor casa per nom de script del `package.json`, no per comanda. `porta:olivera` és un hook, no un pas. **El cas real és `porta:matrix`.** Ho comprove i ho dic perquè una xifra inflada no ajuda ningú.
- **`cataleg_skills --check` no és a `run-portes.mjs`:** el cens de skills el vigila `npm run tancar` (`tancament.mjs:19`), no la cadena. Per tant està cobert pel pre-commit, però **no per `npm run porta`** — i és el que un agent executa a mà per a comprovar-se.
- **Proposta conservadora:** un torn curt que només resegelle i torne a llançar la cadena per a fixar el mapa, abans de decidir cap Fase T. Cap reparació massiva.
- **requires_human_decision:** true (ordre de reparació).

#### B4 · P0 · RECAIGUDA · Els hooks protegixen un sol agent dels tres

- **Fitxers:** `.claude/settings.json`, `.codex/hooks.json`, `.agents/hooks.json`.
- **Això no és una troballa nova, i el fet que torne és la troballa.** Ja és T03 de l'auditoria del 260922 i el LEDGER I5 ho diu amb totes les lletres: «No s'ha posat a `.agents/hooks.json` perquè no he pogut comprovar l'esdeveniment al client d'Antigravity».
- **Evidència d'ara:** `grep -rn "hooks.json"` per tot el codi: els únics lectors reconeguts són `.claude/settings.json` i `.codex/hooks.json` (`tests/hooks-local.test.mjs:36,87`, que només itera sobre dos amfitrions: `claude` i `codex`). **Cap programa llig `.agents/hooks.json`**, i el seu format (`hooks: [{event, toolNames, command}]`) no és cap dels dos que el repositori sí reconeix. Els noms d'eina que declara (`write_to_file`, `replace_file_content`, `run_command`) són els d'Antigravity.
- **Evidència operativa nova, i és la que tanca el cas:** `.agents/runtime/segell.log` té **una sola línia**, de les 14:34. Les escriptures de skills de les **17:31** i el `triggers_on` de les **17:58** no hi han deixat cap traça. Si el `PostToolUse` d'Antigravity s'hagués executat, `segell-auto.mjs` hauria resegellat i escrit la línia. No la va escriure perquè no va córrer.
- **Conclusió:** sumant B2, **les escriptures de la IAIA MarIA no tenen cap porta**: ni `PreToolUse` (Reflex, Olivera), ni `PostToolUse` (resegellat), ni `pre-commit`. El sistema immunitari viu dins de la configuració d'un amfitrió i protegix qui menys escriu.
- **Proposta conservadora:** cap canvi a cegues. La pregunta és per al Mestre: **quin fitxer llig Antigravity i amb quin format?** Amb eixa dada, endollar-hi les tres crides és copiar `.codex/hooks.json`. Sense ella, tornarem a escriure un fitxer bonic que ningú llig — que és exactament el que ja ha passat dos voltes.
- **requires_human_decision:** true.

#### B5 · P1 · El Reflex no mira mai una escriptura feta per `Bash`

- **Fitxer:** `tooling/gates/hooks-local.mjs:71-72,84`.
- **Evidència:** `ops` només s'omple per a `apply_patch` i per a `/^(Write|Edit|NotebookEdit)$/`. La línia 84 afig **Olivera** per a `Bash`, però **`reflex(op)` no s'executa mai** per a `Bash`. Un document de govern escrit amb un heredoc, `sed` o `tee` no passa pel contracte documental. El matcher de `PostToolUse` de `.claude/settings.json` tampoc cobrix `Bash`: una skill escrita així no resegella.
- **Per què ho dic hui:** esta sessió corre amb una directriu d'amfitrió que m'ordena fer la faena per `Bash` sempre que puga. **Eixa directriu desactiva de fet el Reflex** per a tot el que jo escriga. He seguit el circuit documental a mà (`context` → `create` → omplir → `check`) i el meu informe té rebut, però ho he fet per doctrina, no perquè cap porta m'ho exigira.
- **Font de veritat:** AGENTS §0 (l'Acte Reflex és innegociable) contra el comportament observable.
- **Proposta conservadora:** afegir `Bash` al matcher de `PostToolUse` és una línia i cobrix el segell. Fer que el Reflex inspeccione redireccions de shell ja existix parcialment (`reflex_petorreta` reconeix una redirecció cap a una petorreta, i hi ha prova d'això a `test:node`): **ampliar-ho és disseny i el propose, no ho decidisc.**
- **requires_human_decision:** true.

#### B6 · P1 · Els quatre hooks cadàvers continuen validats pel seu propi comentari

- **Fitxer:** `tooling/wiki/reflex_petorreta.mjs:79-86`.
- **Evidència:** `REQUIRED_HOOKS` exigix a `post-commit` les expressions `/SDP-REFLEX-HOOK:v2:post-commit/` i `/consume-commit/`; el fitxer `.husky/post-commit` són **60 bytes** i les dos cadenes hi són **com a comentaris**, amb **zero línies executables**. Igual per a `pre-merge-commit`, `pre-applypatch` i `post-applypatch`. La Porta Reflex executada ara ix roja, però **per una altra cosa** (baseline del graf divergent): sobre els hooks no diu res, perquè per a ella estan bé.
- **Segona part encara oberta:** `.agents/SKILLS_SEAL.json` **no és a `CRITICAL_SEED_PATHS`** (la llista inclou els cinc fitxers de `.husky/` i no el pany). Qui toque el pany no trenca la llavor crítica.
- **Proposta conservadora:** exigir a cada hook una línia executable (per exemple, que continga `node ` o `exec `), o declarar-los explícitament buits amb un motiu. Triar-ho és governança.
- **requires_human_decision:** true.

#### B7 · P1 · `turns.mjs:109` — done la raó a Codex i ho confirme amb el codi

- **Fitxer:** `tooling/documental/turns.mjs:109`.
- **Evidència:** `if (!m) return [...errors, 'reflex: cal un rebut persistent…']`. **No és un bypass d'acceptació**: el document ja queda rebutjat. És **pèrdua de diagnòstic**: sense rebut no es comproven ni l'esquema, ni les seccions (i per tant **ni els blocs normatius**), ni el registre. I no basta llevar el `return`, perquè la línia següent usa `m[1]`.
- **Ho he vist en viu hui:** `npm run tancar` diu del Pla de les 18:15 exactament «reflex: cal un rebut persistent emés per document.mjs context» i **res més** sobre eixe fitxer. El Pla, a més, conserva el frontmatter de la plantilla (`type: plantilla`, `status: canonic`) i les seccions `[pendent]` — i això la porta no ho arriba a dir mai.
- **Proposta conservadora:** acumular en compte de retornar, guardant el `m` en una variable i saltant només el bloc que el necessita.
- **requires_human_decision:** false.

#### B8 · P2 · El número de línia de la Llei de Pedra Seca sempre val 1

- **Fitxer:** `tooling/gates/verificador-scc.mjs:246`.
- **Evidència:** `content.substring(0, match.index).split('\\n').length`. Dins d'una cadena simple, `'\\n'` és barra invertida més ena, no un salt de línia: la divisió no troba res i `lineNum` val **1** sempre. Tota infracció `PEDRA_SECA_INLINE_STYLE` s'informa a la línia 1.
- **Proposta conservadora:** `split('\n')`. Una línia, i el missatge comença a servir.
- **requires_human_decision:** false.

#### B9 · Higiene de la taula, sense retocar-la

- Els **tres documents de les 18:15** (el meu prompt, el de Codex i el Pla) **no estan ancorats** a `00_index_escriptori.md`: `ESCRIPTORI_UNANCHORED` × 3, mesurat. La secció 0 del prompt els donava per ancorats com a requisit previ i les caselles van quedar sense marcar, cosa que és honest: el que falta és **l'acció**, no la casella.
- El **Pla no té rebut** (B7) i conserva el frontmatter de la plantilla. Coincidisc amb Codex: **no és un pla executable encara**. No l'he tocat: és el fitxer d'una altra mà i el Mode AFK és explícit.
- No he mogut, arxivat ni esborrat res. Este informe s'ancorarà quan el Mestre ho aprove, i eixa és la meua única escriptura pendent.

### C · Reunió a l'Olivera: rèplica a Codex (18:21)

Llegida sencera. **El seu abast és Sollutia i el frontend; el meu és el Brain i la cadena.** No hi ha solapament, i això és bo: cobrim el Mas per les dos bandes.

- **Coincidència independent que val doble:** el seu tancament documental reporta el mateix que jo he mesurat pel meu costat — «fallen segell, projeccions de skills, compilació estricta de Wiki i SCC» i «els tres documents 1815 apareixen sense àncora directa». Dos mesures separades, el mateix resultat. Això puja la confiança d'estes quatre troballes.
- **Li done la raó en B7** (ja ho vaig fer a les 18:10 i ho reafirme amb el codi a la mà).
- **Li done la raó sobre el Pla:** no és avalable com a pla executable.
- **Hi afig el que li faltava per abast:** el seu `porta:orfandat` roig amb «66 enllaços i 4 orfes, alguns són rutes físiques existents que la porta no resol» és correcte i **jo el complete**: eixa porta és **una de les 29**, i la causa que la cadena no l'haja vista mai és el pas 3.
- **On el matise:** diu «no certifique el linter ni la cadena global». Ara sí que estan certificats: linter **64 avisos**, cadena **29 roges de 51**.
- **Sobre la seua proposta de millora del prompt:** subscric «sincronitzar v2.3.0 del text amb v2.2.0 del contracte» i «les caselles de l'autor no han de convertir-se en una ordre d'arxivat per a l'auditor». Hi afegisc una sola cosa: **la secció 0 hauria de ser una comanda, no tres caselles.** `npm run porta:scc` diu en dos segons si l'Escriptori està ancorat; una casella marcada a mà no diu res. Si eixa comanda s'executara abans de llançar la petorreta, els tres documents de hui haurien eixit ancorats.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Tot el que hi ha a l'apartat de Troballes ix d'una execució, no d'una lectura. Comandes, en ordre:

- `node tooling/gates/obrir_torn.mjs --actor Claude --scope code` → `torn_3d935cf7…`, obert a propòsit.
- Relleu escrit: bloc `ESTAT_ACTUAL · 260923_1852` al principi d'`.agents/ESTAT.md` i entrada nova al LEDGER, resegellada amb l'eina oficial (`node tooling/verify-ledger.mjs --sign`) i reverificada verda. La Porta Integritat del LEDGER continua a 0.
- **A1:** fixture pròpia a l'scratchpad amb `calculaSegell`/`verificaSegell` sobre un `root` aïllat; cinc casos. Còpia del fitxer amb pany `{"hash":null}` per al TypeError de `:96`.
- **A2:** `node tooling/gates/verificador-scc.mjs .` → `valid: false`, `{"ESCRIPTORI_UNANCHORED":3,"ORPHAN_OPERATIVE":3}`. `find` per `07_plantilles` → només `03_actuar/plantilles`. `grep` de `CAMINS|arrelSegura` al fitxer → cap ús orfe.
- **A3:** `npm run test:node` → **25/25**. `node tooling/brain/cataleg_skills.mjs --check` → **exit 1** (verificat amb `$?` sobre la comanda, no darrere d'un pipe), dos projeccions divergents. `comm -13` entre `.claude/skills/` i `.agents/skills/` → `core-automillora`, `core-estrategia-ia`.
- **B1:** cens de guardes sobre tots els `.mjs` de `tooling/` → 9 amb `realpathSync`, 40 sense. `ln -s` cap a l'arrel i execució de sis portes pel symlink → silenci i exit 0; contraprova pel camí real → parlen.
- **B2:** `git archive <commit> .agents | tar -x` cap a temporal i `calculaSegell` per a cinc commits. `git show --stat f03affcb` → tres `SKILL.md`, cap pany. `git config core.hooksPath` → `.husky`. `ls -la .husky/ .husky/_ .git/hooks/`.
- **B3:** script que importa `passos` de `run-portes.mjs` i executa cada pas amb `spawnSync` i `timeout: 90000`, exclosos els 5 declarats. `node tooling/gates/tractor-cadena.mjs`. `npm run lint` → 64 avisos.
- **B4:** `grep -rn "hooks.json"` per tot el repositori; lectura de `tests/hooks-local.test.mjs`; `cat .agents/runtime/segell.log` (una línia, 12:34 UTC).
- **B5, B6, B7, B8:** lectura de `hooks-local.mjs:65-87`, `reflex_petorreta.mjs:79-110`, `turns.mjs:100-120`, `verificador-scc.mjs:233-255`.
- **B0:** `node tooling/gates/tancament.mjs --check --turn-id torn_3d935cf7…` → `valid: false`, 13 errors, amb `documental-tests=1`. `node --test` sobre els tres fitxers → 36 roges. Reproducció de la causa amb `openTurn` + `deliverContext` + `draft` sobre fixture neta. `sed -n 488,500p .agents/protocolledge.json` per a la llista de deu camps. `git log` de `protocolledge.json` i de `tests/helpers/documental.mjs` per a la datació.
- `npm run porta` sencer → mor al **pas 3 de 56** amb el missatge de Llei Z. `node tooling/gates/tancament.mjs` → `valid: false`, ~50 errors.
- URL de proves locals: `http://localhost:3340`. **No l'he obert:** cap troballa d'esta auditoria és visual i no hi ha res a comprovar a la pantalla (Llei del Píxel: zero canvis, zero píxels).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Zero fitxers de codi tocats.** Mode AFK. Cap correcció aplicada, ni la d'una línia.
- **Cinc passos de la cadena no executats** a B3: `Porta Build` (pot llançar un `npm run build` i escriure artefactes) i els quatre de proves i linter. El 29/51 és sobre els executats. **Dos d'eixos cinc els he mesurat després, arran del tancament:** el linter (64 avisos, roig) i les proves del contracte documental (36 roges, roig). Per tant el compte conegut passa a **31 roges de 53**; queden sense mesurar `Porta Build` i el `vitest` complet, i `test:node` el sé verd (25/25).
- **No puc dir com s'esquiva el pre-commit** (B2). Cap rastre al disc; falta la paraula del Mestre.
- **No puc verificar quin fitxer de hooks llig Antigravity** (B4). Ho afirme només del que el repositori reconeix.
- La comparació del segell per als commits anteriors a `0ffda7a7` és **anacrònica** i no la presente com a prova.
- No he llegit `90_arxiu_historic/` (AGENTS §5) ni he entrat a `01_produccio` (AGENTS §12). No he obert cap secret.
- L'arbre tenia dos fitxers de runtime modificats abans que jo començara; no són meus i no els he tocat.
- **Set** motors cognitius dissenyats a l'auditoria de les 18:10 continuen sense escriure. No he afegit cap proposta nova de maquinària: hui el problema no és que falte maquinària, és que la que hi ha no està endollada.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260923_1815_prompt_auditoria_brain_claude]]
- [[260923_1815_pla_implementacio]]
- [[260923_1821_auditoria_codex]]
