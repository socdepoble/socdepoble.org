---
type: informe
status: esborrany
description: Auditoria i autòpsia del Tractor de Neteja i crash useSession
tags:
  - auditoria
visibility: private
reflex: sdp:torn_eafab5f7-6d92-49a2-ad17-eec892cc41af:b9ce22c8-4408-48ec-a07d-3c63c171b54b
---
# Auditoria Fable UltraCode

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_eafab5f7-6d92-49a2-ad17-eec892cc41af:b9ce22c8-4408-48ec-a07d-3c63c171b54b |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-05T10:11:09.696Z |
| Modificació | 2026-10-05T10:55:00.000Z (aproximada: el hook bloqueja `date`) |
| Propietari | Fable |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (claude-fable-5-1) via Claude Code en mode ultracode, més huit subagents del mateix model (no «Claude 3.5», com deia el prompt) |
| Tokens consumits | Sense comptador propi. Panell del Mestre a les 12:45: cost USD 45,03; lectura de caché 5 M, escriptura de caché 332,8 k, entrada 550 i eixida 184 (unitats tal com les mostra el panell); el 92 % en subagents del workflow |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-05T10:11:09Z: esborrany creat per MarIA (torn `torn_eafab5f7`) amb Propietari «Fable».
- 2026-10-05T10:23:22Z: Fable, sense saber que este esborrany existia, en crea un segon (`261005_1215_auditoria_fable.md`, torn propi `torn_0a328563`). Queda com a punter: cal arxivar-lo (vegeu Troballes §7).
- 2026-10-05T10:25Z a 10:47Z: cacera amb un workflow de setze caçadors (lents T1, T1-bis, T2, T3, T4a, T4b, T4c, LEDGER, i huit lents de codi). A les 10:47Z el Mestre avisa que el límit setmanal de tots els models és al 99 %: workflow aturat. Huit caçadors havien acabat (els de T1 a T4 i LEDGER); els huit de l'escombrada de codi, la deduplicació, la refutació adversarial i el crític de completesa no han corregut.
- 2026-10-05T10:55Z: informe escrit sencer d'una tacada (el hook no admet ompliments parcials: bloqueja qualsevol edició mentre quede una secció pendent).

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Resum per al Mestre (sense mentides belles)

1. **No puc veure cap quota.** He treballat fins que el Mestre ha mostrat el panell (99 % setmanal global). La promesa del prompt («para al 5 %») era incomplible des de dins; ho dic abans que res.
2. **El crash de `useSession` NO es reproduïx amb el codi de HEAD `886f4272`.** Dos caçadors independents, llegint tot l'arbre de rutes i providers, han conclòs que l'arbre estàtic no pot produir eixe error des del Panell de Control. L'única aparició documentada del missatge a la Marató era una regressió de PROVES (ItemDetailSection, ja resolta). Cap prova exercita l'eixida real: les tres suites del Panell substituïxen `useEixidaSegura`. Primer pas: una prova d'integració, no un pegat (§2).
3. **Autòpsia del tractor de neteja: no és un problema de raonament de MarIA, és un forat mecànic en cadena.** La porta Olivera només sap arxivar Markdown de dotze categories; els noranta artefactes `produccio_*` d'una marató no tenen eixida; la frontera de «consumit» és el dia natural i no l'Acta; el hook d'Antigravity calla quan la taula és «vàlida» per al codi però plena; el `force_ask` del `mv` es converteix en aprovació humana sense cap reparació posterior; el «tractor» d'avui han sigut cinc scripts `scratch_*.mjs` a l'arrel que el hook deixa passar. La solució estructural té huit passos ordenats (§1.4).
4. **El commit atòmic té tres trampes P0 i un bundle de 67,7 MB a l'arrel de l'arxiu que un `git add -A` versionaria per sempre** (§3).
5. **La cadena de tancament no pot tancar mai per disseny**: segell de skills trencat avui a les 12:17 per una skill nova, signatura del LEDGER invàlida, zona humana sense canal de reconeixement, i comprovacions d'entorn globals sense amnistia. Cada una necessita decisió humana (§4).
6. **Consola**: localització exacta de les targetes de consums i crèdits amb pla d'extirpació en dues fases sota la Llei del Píxel, quatre peces i tres grups de CSS orfes, i el que falta per a decorar (cap targeta rep `imatge` avui). Els prompts Nano Banana no s'han escrit: el workflow s'ha parat abans d'eixa etapa i el cens de mòduls (9 targetes, no 6-7) l'ha de tancar el Mestre (§5).

Totes les troballes d'ací avall són d'una sola lent i sense refutació adversarial (la fase no ha corregut). La memòria del Mas diu que un 27 % de les troballes d'agents resulten falses: cada una porta la seua confiança i l'evidència `ruta:línia` perquè MarIA o Codex la puguen tombar.

### 1. T4 · Autòpsia del Tractor de Neteja (CRÍTIC)

#### 1.1 Diagnòstic en una frase

La regla «Escriptori net» viu al BIOS, però cap canal que corra en el moment X (acabar una marató i buidar la taula abans de convocar algú) té una eina capaç de fer la neteja; l'única eina que existix no cobrix el 88 % del que una sessió produïx, i el hook que vigila el `mv` delega en un humà cansat i no repara res després.

#### 1.2 Les causes, en cadena (totes confirmades amb codi)

**C1 · L'eina no sap arxivar el que una marató produïx (P1, confiança 0,95).**
`tooling/gates/porta-olivera.mjs:71` `export const TRANSITORIES = /^(prompt|macro_prompt|micro_prompt|petorreta|auditoria|informe|bundle|macro_bundle|micro_bundle|pla|acta|tasques)$/;` i `:73` `const NOM = /^(\d{6})_(\d{4})_([a-z0-9]+(?:_[a-z0-9]+)*)\.md$/;` (només `.md`). Però `:95` inventaria «artefactes regulars» de qualsevol extensió i `:209` els exigix àncora. `:350` rebutja per nom qualsevol categoria fora de TRANSITORIES («la categoria «produccio» no és de torn»). La taxonomia (`_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md:68`) sí que declara `produccio` com a categoria, i només marca `informe` i `tasques` com a transitòries: la doctrina no diu mai quan ixen de la taula els patches, captures i informes Lighthouse. Resultat observat: dels 102 fitxers moguts a mà esta matinada a `90_arxiu_historic/261005_Sessio_Marato_2230/`, 90 no són `.md` o són `produccio_*`/`avaluacio_*`. L'informe de la porta ho confessa (`:445` «l'arxivat de torn continua limitat a Markdown»).

**C2 · La frontera de «consumit» és la mitjanit, no l'Acta (P2, 0,95).**
`porta-olivera.mjs:140` `filter((d) => TRANSITORIES.test(d.categoria) && d.data < dia && !viu.has(d.nom))` amb `dia = avui()` (`:82-85`). Cap línia de la porta mira `10_actes/`. L'Acta 261005_0445 tanca la sessió a les 04:45 i a les 11:50 del mateix dia res del 00:10-04:32 és ranci: `npm run olivera:arxiva` diu «Res a arxivar». Era el `[DEFECTE D2]` fixat a `tests/porta-olivera-diagnosi.test.mjs:73-76` el 261002 i continua instal·lat. Les sessions del Mas acaben de matinada de manera habitual.

**C3 · L'eina arxiva pla; el Mas vol subcarpetes de sessió (P2, 0,95).**
`porta-olivera.mjs:361` `path.join(arrel, ARXIU)` i `:372-374` `renameSync` a l'arrel de `90_arxiu_historic/`. L'índex documenta des del 260924 la pràctica real: «Moguts a `90_arxiu_historic/260924_Auditories_Astra_Fable/` sense `porta-olivera --arxiva`». L'orquestradora tria la convenció humana i perd el relleu de torns i la neteja d'àncores.

**C4 · El canal d'Antigravity calla quan la taula és «vàlida» però plena (P1, 0,9).**
`tooling/gates/antigravity-hook.mjs:298-302` `preInvocation` només injecta si `checkTaula` és invàlid, i `checkTaula` (`porta-olivera.mjs:232-251`) només coneix tres brutícies: rancis de dies anteriors, Safata plena i àncores. Cent artefactes d'avui, tots ancorats, són «taula neta». Registre `.agents/runtime/antigravity-hook.log`: 5 478 pre-invocations, 264 injeccions (4,8 %), 5 214 «res». A les 10:01:35Z, 32 segons després del `force_ask` del `mv`, el hook diu «res». I quan sí que injecta, les set ratxes del final del registre acaben totes amb una edició de l'índex (`multi_replace_file_content` sobre `00_index_escriptori.md`), no amb `--arxiva`: el missatge empeny a fer callar la porta, no a classificar. L'Acta 0445 escriu «L'Escriptori es manté net» amb cent artefactes damunt: literalment cert per al codi, materialment fals per al Mestre. El desacord és de definició (AGENTS §0.1 «net no vol dir buit»), no de bug.

**C5 · `force_ask` és una formalitat sense reparació posterior (P1, 0,92).**
`antigravity-hook.mjs:206-207` detecta `mv` sobre l'Escriptori i pregunta. Els sis `force_ask` del registre han acabat tots amb l'acció feta: ESTAT i LEDGER editats a mà (02:09Z, 02:10Z; d'ací la signatura trencada de l'Acta §2), dos `mv` consumats (09:52Z, 10:01Z), skill nova creada (10:16Z, 10:16Z). Després del `mv` no hi ha cap pas: `arxiva()` només suggerix el handoff per `console.log` (`porta-olivera.mjs:472`) i `handoffDocument` (`tooling/documental/turns.mjs:306-314`) exigix el turn-id del rebut i el torn obert; els documents 2230 són del torn de Codex `torn_6cd529b4`, no de MarIA. El contracte d'Antigravity oferix `overwrite` de `CommandLine` (documentació local `~/.gemini/antigravity-ide/.../hooks.md:200-212`) i el hook no l'usa: la reconducció mecànica del `mv` a `--arxiva --nom` és possible i no està feta.

**C6 · El «tractor» d'avui han sigut cinc scripts a l'arrel que el hook deixa passar (P1, 0,9).**
`scratch_clean.mjs:7-25` esborra TOTA línia de l'índex amb un `[[enllaç]]` a fitxer absent (prosa inclosa; no separa l'àlies `|`; només mira el primer enllaç de la línia); `scratch_anchor.mjs`, `scratch_anchor_local.mjs` i `scratch_anchor_fable.mjs` afigen àncores AMB `.md` davant d'«## Activitat en curs» (d'ací les àncores duplicades `x.md` i `x`); `scratch_clean_bundle.mjs` en lleva tres. Per què passen: `antigravity-hook.mjs:197-198` jutja el TEXT de l'ordre (`node scratch_clean.mjs` no anomena `04_escriptori`) i `:210` només caça intèrprets inline amb `-e|-c|-p`. Per a Claude i Codex el mateix `node fitxer.mjs` està bloquejat (`hooks-local.mjs:90`): la frontera de seguretat depén de qui tecleja. La regla contra fitxers scratch a l'arrel existix en codi mort (`.agents/hooks/verify.mjs:45`, no cablejat a `hooks.json`) i `core-neteja-brossa` busca `scratchpad_*.mjs`, no `scratch_*.mjs`. AGENTS §3 els prohibix.

**C7 · Ningú neteja al TANCAR la jornada (P1, 0,95).**
`tooling/gates/tancament.mjs:15-20` comprova plantilles, autoritat, ledger, segell, skills i wiki: cap import de la porta Olivera. `wiki-cicle-de-vida` (nou passos) no té cap pas d'arxivat. L'únic cridador d'`arxiva()` fora dels tests és el CLI (`porta-olivera.mjs:467`). La doctrina posa la neteja «abans de redactar res» (AGENTS §0.1) de la jornada SEGÜENT, amb una IA de context nou que no sap què era viu. L'índex té 13 seccions «arxivat a mà» entre el 260924 i el 261001 (línies 121, 324, 330, 345, 364, 376, 390, 394, 398, 405, 422, 434, 444) i el trasllat d'avui, el 14é, no té ni secció.

**C8 · La reparació existix des del 261002 i no s'ha aplicat mai (P1, 0,9).**
`_wiki_de_poble/04_escriptori/02_investigacio_ia/261002_1745_olivera_arxiva_claude/LLEGIU_PRIMER.txt:3` «Res d'este laboratori està aplicat». Cap transacció `sdp-olivera-arxiva` a `.agents/seal-transactions/` (94 transaccions). `tests/olivera-arxiva-261002.test.mjs:120` fa `t.skip` si el paquet no té transacció; `tests/porta-olivera-diagnosi.test.mjs:54` «[DEFECTE D1+D2] la seqüència del 261002» PASSA perquè afirma el defecte. Tres dies de la mateixa ferida oberta, amb proves verdes que la descriuen. Ni eixe paquet resol l'extensió, la frontera per acta ni la subcarpeta de sessió.

**C9 · Antigravity arranca només amb AGENTS.md (P1, 0,95).**
Documentació local de l'IDE (`rules.md:12-15`): només reconeix `GEMINI.md` i `AGENTS.md`; esdeveniments de hook (`hooks.md:71-79`): PreToolUse, PostToolUse, PreInvocation, PostInvocation, Stop; no hi ha SessionStart ni UserPromptSubmit. `.agents/hooks.json` només cableja PreInvocation i PreToolUse. Claude i Codex tenen quatre canals (`.claude/settings.json:3-64`); MarIA, dos, i cap parla a l'inici. No carrega `CLAUDE.md`, ni `cervell.json` (només el consumix `context-local.mjs` per a Claude/Codex), ni QUI_SOC, ni cap skill: `core-higiene-escriptori` s'activa per `description` (`skills.md:50-54`), i la seua descripció parla de «crear un prompt» i «escriptori brut», no de moure, arxivar, congelar ni commitejar (`SKILL.md:8-17`). El router de `UserPromptSubmit` és Claude-only i ho diu ell mateix: «Cap s'ha carregat sola». Dos hooks útils de `.agents/hooks/` (`preflight_matrix_wrapper.mjs:7` amb `invocationNum !== 1`; `verify.mjs:45` amb el patró scratch) no estan cablejats: maquinària correcta sense endollar.

**C10 · `crear_bundle.mjs` sembra brossa que la porta no pot traure (P2, 0,95).**
`tooling/brain/crear_bundle.mjs:67-70` `PERFIL` null sense `--perfil`; `:544` `sufix = PERFIL`; `:552-553` i `:580` interpolen «null» → `261005_1154_BUNDLE_null.md` (67,7 MB, 814 274 línies), `_PROMPT_null.md`, `_ABSENTS_null.json`. Noms en majúscules que `NOM` (`[a-z0-9]+`) no reconeix: ni inventari ni `--nom`, però sí àncora. `:489-495` la seua porta DORMIR mana «moure fitxers a 90_arxiu_historic» a mà. `:602-603` `// execSync('node generar_indexs.mjs' …)` comentat i `console.log('✅ Ancoratge automàtic: L'Escriptori ha sigut reindexat.')`: verd inert. I era un bundle per a una IA local, prohibit per AGENTS §6 i la lliçó 260922.

#### 1.3 L'índex de l'Escriptori, cicatriu del problema

`00_index_escriptori.md`: 652 línies; 13 seccions «arxivat a mà» datades; 13 capçaleres sense contingut; 78 línies buides en cinc runs (11, 23, 11, 7, 26); àncores duplicades amb i sense `.md` a «## Activitat en curs» (línies 34-47) i 12 àncores de `261004_0605_nit_claude` repetides (76-87 i 523-558); un bloc «## Fix Automàtic d'Àncores» (línia 500, 86 àncores) que cap script del repositori escriu (`grep -rln "Fix Autom"` només troba l'índex); huit tasques vives en prosa a «## Tasques pendents (Pròxima sessió)» (598-606) mentre el fitxer `tasques` que sí tenia nom taxonòmic s'ha mogut hui a l'arxiu i l'ESTAT encara el cita com a «Següent». L'ESTAT injectat pel canal fresc apunta a tres documents que ara són a la zona de lectura prohibida (`261004_2245_auditoria_claude`, `261005_0345_avaluacio_final_marato`, `261005_0345_tasques_pendents_consola_visual`): la mateixa patologia que es va reparar a l'ON_ESTIC, ara a l'ESTAT.

#### 1.4 Solució estructural (especificació, en este ordre; res implementat)

1. **Lease del Mestre per al paquet 261002_1745** (rebasat sobre `886f4272`; base `62b623339`; `prepara-pla.mjs` i verificació de deriva ja escrites): aporta `--nom` per a qualsevol categoria del catàleg, candidats d'avui, reapuntat d'àncores amb «## Arxivat amb la Porta Olivera», col·lisions sense moure i relleu de torns en el mateix acte. Abans, aprovar el flux a la Wiki (lliçó 261002). Mentre no s'aplique, que l'informe de la porta mostre en roig els `[DEFECTE]` que ja sap que té.
2. **Inventari doble a `porta-olivera.mjs`**: documents (`NOM` `.md`) i artefactes (regex termodinàmic amb qualsevol extensió: `/^(\d{6})_(\d{4})_([a-z0-9]+(?:_[a-z0-9]+)*)((?:\.[a-z0-9]+)+)$/`); categories consumibles llegides de `tooling/wiki/taxonomia.json` i ampliades amb `produccio` i `avaluacio`. Decisió humana prèvia: dir a la taxonomia que `produccio` i `avaluacio` són transitòries de torn. Els artefactes sense rebut només reapunten l'àncora.
3. **Bandera `--sessio NOM`** (i `--sessio` sola que derive `aammdd_Sessio_<cognom>` de l'última acta): destí `90_arxiu_historic/aammdd_Sessio_NOM/`, col·lisions dins d'eixa carpeta, àncores reapuntades a `../90_arxiu_historic/aammdd_Sessio_NOM/nom`, handoff amb destí sencer. L'arxiu pla queda per compatibilitat.
4. **`fronteraSessio()`** = marca `aammdd_hhmm` de l'última `*acta_marmota*` de `10_actes/`; mode `--arxiva --sessio-tancada` (sempre `--sec` primer) que mou tot el consumit anterior a l'acta que no estiga declarat viu, i MAI res posterior a l'acta sense `--nom`. Protegix la sessió oberta sense dependre de la mitjanit. `pla_implementacio` i `tasques` del dia, vius per defecte.
5. **Acte mecànic de tancament de jornada** (`tooling/gates/tancar_jornada.mjs`, `npm run jornada:tanca`), desacoblat de `checkClosure` perquè la cadena està roja per disseny (§4). Fase A (lectura, sense permís): `checkTaula`, classificació de cada artefacte en viu-per-declaració / viu-per-torn (rebut d'un torn no `closed`: l'«Acte Reflex Pre-Arxivament» mecanitzat) / pla-tasques-de-hui / consumit; proposta de destí; àncores de l'índex i de l'ESTAT que quedarien penjades; comprovació de si hi ha acta de hui amb `reflex` i Registre (AGENTS §14), i si no, impressió de l'ordre `document.mjs context --route acta`. Fase B (un sol «sí» del Mestre o de MarIA, o lease): moure, despenjar, escriure UNA secció «## Relleu arxivat (aammdd, tancar_jornada)», registrar handoffs, reescriure les àncores mogudes al bloc ESTAT_ACTUAL com a `../90_arxiu_historic/CARPETA/nom`, i una línia al LEDGER «aammdd | jornada | tancar_jornada | N moguts, M vius, acta sí/no». Qui el dispara: MarIA o el Mestre en acabar; opcionalment un hook `Stop` en mode Fase A. Claude i Codex només la Fase A.
6. **Canal d'Antigravity**: (a) a la primera invocació (`invocationNum === 1`, l'únic «SessionStart» que té) injectar SEMPRE la fotografia fresca (llista i recompte d'artefactes del primer nivell, veredicte de `checkTaula`, ESTAT_ACTUAL i la ruta de `core-higiene-escriptori`), sense preguntar; (b) `checkTaula` amb un camp `avisos` (no `errors`) quan el primer nivell supere un llindar d'artefactes no-Markdown fora d'«Activitat en curs»; (c) `mv` d'un document de torn cap a l'arxiu → `ask` amb `overwrite` de `CommandLine` a `node tooling/gates/porta-olivera.mjs --arxiva --nom <fitxer> --sec`, i `deny` amb l'ordre canònica al motiu quan no es puga traduir; (d) `node <script no llistat>` → `ask` (shell no confinada), com fa `hooks-local`; (e) escriptura d'un `scratch|tmp|prova|borrador` a l'arrel → `ask`; (f) dins d'`arxiva()`, registrar el handoff sol quan el turn-id del frontmatter `reflex` és d'un torn obert, i si no, línia al LEDGER en lloc de `console.log`; (g) un hook `Stop` (requerix decisió del Mestre: la capçalera del hook el rebutja a les línies 34-35) amb un sol `continue` per conversa si `checkTaula` és invàlid o hi ha scratch a l'arrel.
7. **`despertar.mjs`**: importar `checkTaula` i `plaDeHui` (exportades, lectura pura) i afegir al canal fresc «## 1b. Veredicte de la porta Olivera»; filtrar l'índex i els directoris de la llista; avisar quan una àncora de l'ESTAT no resol al disc. I `tancament.mjs`: afegir `['olivera',['tooling/gates/porta-olivera.mjs','--informe']]` a `environmentChecks`; a la plantilla d'acta, substituir la frase lliure d'estat de l'Escriptori per l'eixida literal de la porta.
8. **Higiene documental mínima, a mà i ara** (MarIA): una sola àncora per document a «## Activitat en curs»; llevar línies buides; secció «## Relleu arxivat a mà (261005, Sessió Marató 2230)» amb carpeta i torns afectats (`torn_6cd529b4` Codex, `torn_8ec393af` Claude); traure les huit tasques a `aammdd_hhmm_tasques_pendents_sessio.md` declarat viu; moure els cinc `scratch_*.mjs` a `scratch/` (ja ignorat a `.gitignore:46`) o a `.sdp-paperera/`, mai esborrar; `crear_bundle.mjs`: codi 2 si el sufix és null, noms minúscules i taxonòmics, eliminar el verd inert, exigir `--destinatari` i rebutjar bundle per a local; `mutation-policy.mjs`: acceptar la porta sense bandera (la forma que AGENTS §0.1 mana i que hui ix amb 2), `--arxiva --sec [--nom|--sessio]` i `git diff … -- <ruta>` dins del repo. Ampliar `description` i `triggers_on` de `core-higiene-escriptori` amb els verbs del moment X («moure», «mv», «arxivar», «traslladar», «congelar», «tancar sessió», «commit», «artefactes») i marcar-la `core` al router.

Decisions que només el Mestre pot prendre: la lease del paquet 261002; si `produccio` i `avaluacio` són transitòries; la forma de les subcarpetes de sessió; el hook `Stop`; què fer amb els cinc scratch, els tres `*_null.*` i `fix_anchors.mjs` (este sí versionat a l'arrel).

### 2. T1 · Crash «useSession ha de ser usat dins de SessionProvider» en eixir des de Control

**T1-01 · No té causa estructural a HEAD; cal reproduir-lo abans de tocar res (P1, 0,8; requerix decisió humana).**
Únic punt de muntatge del proveïdor, dins del router i de l'ErrorBoundary, embolcallant TOTA l'App: `src/PedraSecaEmbed.jsx:262-265` `<UIProvider …><SessionProvider config={config}><IdentitatProvider config={config}><App …/>`. Les tres entrades pinten eixe component: `src/main.jsx:53`, `src/PedraSecaEmbed.jsx:850-851` (element `<soc-de-poble>`), `src/natiu/entrada.jsx:66`. El Panell és ruta d'App sense guarda: `src/app/App.jsx:800` `<Route path="/control" element={<ControlSection />} />`. Cap proveïdor remunta els fills (`App.jsx:687` «No els destruïm forçosament (F01)»; `grep key=` als set contexts de dades: cap resultat); cap `createRoot` niat; cap mòdul duplicat de SessionContext; cap àlies `preact` (`vite.config.js:96` ho data com a anterior al 260920; `package.json:113` només react 18.3.1): la memòria heretada «preact/compat» és rància. Els portals (Dialeg, Notification, PageFrame, UniversalWorkspace) conserven el context. L'error només pot nàixer a `src/app/contexts/SessionContext.jsx:169` cridat per `src/components/universal/EixidaSegura.jsx:54`. L'única ocurrència documentada del missatge a la Marató és de PROVES: `02_investigacio_ia/261004_2240_marato_claude/RELLEU_01_revisor.txt:25` «useSession sense proveïdor, per un canvi no confirmat … a ItemDetailSection.jsx:20», resolta amb dobles (P4). L'Acta no porta cap traça. Si el crash es va vore al navegador amb este codi, la causa és fora de l'arbre: servidor Vite ranci (memòria «servidor Vite ranci després d'un npm ci»), muntatge sense PedraSecaEmbed, o l'amfitrió WordPress amb React extern (`vite.standalone.config.js:179-182`). Pegar `useSession` o `useEixidaSegura` a cegues (fer el hook opcional) amagaria un símptoma i contradiria el criteri de la Marató (`RELLEU_03_execucio_f1_f5.txt:29`).

Què fer, en este ordre: (1) al navegador de desenvolupament amb servidor acabat d'arrancar, entrar, anar a `/control`, «Eixir del poble», i copiar el `component stack` de la consola o del `<pre>` de `RouteErrorBoundary.jsx:52` (només DEV); (2) repetir-ho al banc de WordPress; (3) si no es reproduïx, tancar la tasca de l'Acta com a «no reproduïble a HEAD» i enllaçar-la a la regressió de proves ja resolta. No he obert el navegador: eixir hi tancaria la sessió del Mestre.

**T1-02 · Cap prova exercita la cadena real «Eixir del poble» → useEixidaSegura → useSession → logout → /registre (P2, 0,95).**
`ControlSection.test.jsx:53-54`, `ControlSection.eixida.test.jsx:21-26` i `ControlSection.espais.test.jsx:34-35` fan `vi.mock('../../components/universal/EixidaSegura.jsx', …)` i pinten el Panell sense SessionProvider: si algú lleva el mock, la suite cau amb exactament el missatge de l'Acta. `SessionContext.test.jsx:42-44` prova el logout amb un botó aïllat; `App.test.jsx:85` munta el PedraSecaEmbed real però no té cap «logout». Executat: `npx vitest run src/sections/control/ControlSection.eixida.test.jsx` → 1/1 passada, i només acredita que `despres` porta a `/registre`. Proposta: UNA prova d'integració nova (`ControlSection.sessio.test.jsx`) amb `backendPort.js` i `sessionService.js` simulats com a `SessionContext.test.jsx:9-20`, arbre real `<SessionProvider><MemoryRouter rutaInicial="/control"><Routes>…` SENSE substituir EixidaSegura, clic a «Eixir del poble», `waitFor` ubicació `/registre`, cap «Hi ha hagut un problema» i cap `console.error`. Si ix verda a HEAD, queda acreditat que el crash no és del Panell.

**T1-03 · DetallAjust («Confirmar eixida» del Perfil) encara recarrega la pàgina sencera contra l'ordre del Mestre 260930 (P2, 0,9; decisió humana).**
`src/sections/profile/DetallAjust.jsx:10` `export const pagina = { recarrega: () => window.location.reload() };` i `:45-48` `navigate('/xat', { replace: true }); pagina.recarrega();`. Els altres dos consumidors ja complixen l'ordre (`ControlSection.jsx:271-272`, `FullAjustos.jsx:192-193` «Sense recàrrega: a WordPress, window.location.reload() recarregava la pàgina sencera de l'amfitrió»). A més, sota `RequireAuth` (`App.jsx:838`), `emetCanvi(null)` és síncron abans dels `await` (`src/data/supabase/auth.js:862-865`): la guarda pinta `Navigate` a `/registre` mentre el logout encara espera, i quan `eix` acaba, `despres` navega a `/xat` i recarrega. Pegat mínim: igualar-lo a `ControlSection.jsx:276-278` i retirar `pagina.recarrega()` (comprovar `DetallAjust.test.jsx` abans). Si el Mestre vol conservar la recàrrega al Perfil, protegir-la amb `esAmaDelDocument` com fa `RouteErrorBoundary.jsx:38`.

**T1B-01 · `lazyRoute` disfressa qualsevol error d'avaluació de mòdul com a fallada de càrrega (P2, 0,85).**
`src/apps/plataforma/lazyRoute.js:15-16` converteix TOT rebuig en `LazyRouteError` («No s'ha pogut carregar el mòdul d'esta vista»); `RouteErrorBoundary.jsx:44-55` oferix «Recarrega l'aplicació». Al paquet IIFE de WordPress (`vite.standalone.config.js:448-451`) no hi ha chunks: tot LazyRouteError és un bug de codi presentat com a problema de xarxa, amb un botó que no el cura i descarta dades. Proposta: classificar com a LazyRouteError només els rebuigs de càrrega (TypeError «import»/«fetch»/«Loading chunk», `vite:preloadError`) i rellançar la resta; prova amb un `import()` que rebutja amb ReferenceError.

**T1B-02 · La closca i els sis providers queden fora de `RouteErrorBoundary`; l'ErrorBoundary arrel no es reinicia mai (P2, 0,9; decisió humana).**
`App.jsx:677-699` (NotificationProvider > AppShell > CoreContent > Mur > NotesData > Notes > Xat > Multimedia) i `:737` (RouteErrorBoundary només embolcalla AppRoutes); `PedraSecaEmbed.jsx:272` ErrorBoundary únic; `src/components/ErrorBoundary.jsx:14-23` sense reset, text «Torna a carregar la pàgina» (la de l'amfitrió, dins de WordPress) i `<pre>` amb `error.toString()` en producció. `useIdentitatDeLaBarra.js:51` crida `useSession` dins de TopBar, fora de la frontera de ruta. Proposta: `resetKey` i botó «Torna a provar» a ErrorBoundary; segona frontera per a AppShell; no pintar `error.toString()` en producció.

Menors (P3): dues rutes mortes a ActorRoutes (`App.jsx:823` i `:836`, inassolibles perquè `:786` i `:800` casen abans del comodí `:813`); una ruta amb barra final (`/xat/`) cau a NotFoundPage (`configAmfitrio.js:77` la conserva, `RouterContext.jsx:254,282` exigix exactitud); `StrictMode` viu dins d'App (`App.jsx:676`) i no cobrix UIProvider, SessionProvider ni IdentitatProvider; AppShell enfoca `<main>` en muntar també dins de la pàgina amfitriona (`App.jsx:342-346`); la Suspense única d'AppRoutes (`:784-785`) sense `startTransition` fa parpellejar la vista a cada primera càrrega lazy (UX, Llei del Píxel: només amb ordre).

### 3. T2 · Fitxers no versionats i pla del commit atòmic

Fets: el commit `886f4272` (que l'Acta 0445 nega: «No s'ha fet cap commit») va versionar els 102 artefactes transitoris de la Marató dins de l'Escriptori (≈85 000 línies: quatre Lighthouse JSON d'11 000 línies, quatre HTML de 2 908, `portes_resultats.json` de 8 649, cinquanta `.patch/.json`, deu imatges), que esta matinada s'han mogut a mà a `90_arxiu_historic/261005_Sessio_Marato_2230/`: `git status` mostra 102 `D` i la carpeta `??`. `lazyRoute.js`, `RouteErrorBoundary.jsx`, les 34 migracions (incloses `2610042330` i `2610042350`) i la imatge OG `public/assets/system/ui/og-socdepoble-1200x630.png` (referenciada a `src/hooks/useSEO.js:15`) SÍ que estan versionats: el «parany de commit parcial» de l'ESTAT 04:40 és ranci des de `886f4272`. No he pogut vore el contingut del commit (`git show` bloquejat) ni confirmar si va passar amb `--no-verify`; el LEDGER no en té entrada (precedent: `LEDGER.md:769` «b22b168b9 confirmat amb --no-verify»).

**T2-01 · Bundle de 67,7 MB (814 274 línies) sense versionar a l'arrel de l'arxiu (P0, 0,97).** `_wiki_de_poble/90_arxiu_historic/261005_1154_BUNDLE_null.md` més `_PROMPT_null.md` i `_ABSENTS_null.json`: bundle per a una IA local (prohibit, AGENTS §6), majúscules i «null» al nom. Un `git add -A` o `git add _wiki_de_poble` el versiona per sempre. Decisió del Mestre: esborrar (AGENTS §5 exigix ordre) o moure fora del repositori.

**T2-02 · El pre-commit no pot acceptar cap document de l'Escriptori d'un torn obert (P0, 0,93).** `.git/config:8` `hooksPath = .husky/_` (el hook ESTÀ actiu). `.husky/pre-commit:6-9`: frontissa, taxonomia `--staged`, plantilla viva `--staged`, i `exec node tooling/gates/git-staged.mjs`, que (1) exigix lease del Reflex (`tests/git-hooks.test.mjs:66-70`: sense `.sdp-reflex/active.json` falla amb ENOENT), (2) executa `porta-documents --staged`, que a `porta-documents.mjs:31` exigix `turn.state === 'closed'` per a cada `.md` de l'Escriptori, i els dos torns vius (`torn_eafab5f7`, `torn_0a328563`) estan en `context_loaded`; (3) `tancament.mjs --check`, `run-portes.mjs` (58 passos, no 48; el 3r és el Segell de skills), `npm run lint` (`--max-warnings=0`) i `npm run test -- --run`. Resultat: els quatre `.md` nous de l'Escriptori no poden entrar pel hook mentre els torns no tanquen, i tancar exigix la cadena verda (§4).

**T2-03 · La skill nova `core-comprensio-reflexiva` (12:17, sense versionar) trenca el Segell de skills (P1, 0,9).** `SKILLS_SEAL.json:4` `filesCount: 31`; ara n'hi ha 32. Executat `node tooling/gates/segella.mjs` → exit 1 «hash actual 818b1a09 no coincideix amb el segellat 5be515e9». Frontmatter de la skill sense `type` ni `status` i amb tags fora de l'enum (`cognitiu`, `reflexio`). No és al cens (`00_INDEX_SKILLS.md`, `.claude/skills`: 9 symlinks, no 16). Conseqüència immediata: `segell-auto.mjs` (PostToolUse) llança un error roig després de CADA crida d'eina de Claude i Codex des de les 12:17, i `executor-mutacio.mjs` refusa qualsevol mutació governada («Segell previ invàlid»): ningú pot tocar ESTAT, LEDGER ni skills fins que el Mestre reconcilie. Torn propi: completar frontmatter, índex, symlink, `npm run porta:segella:update` amb el Mestre present, commit «feat(skills)».

**T2-04 · `stable.json` (canal que lligen els WordPress en producció) anuncia 1.0.4 amb URLs de `http://localhost:8881` (P1, 0,92).** `wordpress-plugin/builds/stable.json:4,59,92` generat amb `empaqueta.mjs --prova`; el plugin declara 1.0.3 (`socdepoble-enxufe.php:6`, `readme.txt:7`); `1.0.4.json` sense ZIP publicat (els ZIP els ignora `*.zip`). Si es desplega, tots els WordPress intentaran baixar de localhost. Abans del commit: `git restore -- wordpress-plugin/builds/stable.json`; no afegir `1.0.4.json`.

**T2-05 · Trasllat a mà sense àncores, sense handoff i sense secció (P1, 0,95).** Documents amb rebut de torn moguts sense relleu: `261004_2230_pla_implementacio_equip_claude_codex.md`, `261004_2240_auditoria_codex.md`, `261005_0335_prompt_avaluacio.md`, `261005_0410_prompt_tancament_codex.md`. Git no segueix renames: basta stagejar les 102 `D` i els 102 nous EN EL MATEIX commit i verificar `git diff --cached --stat -M` (R100).

**T2-06 a T2-10.** Cinc `scratch_*.mjs` a l'arrel (no stagejar; AGENTS §3). Soroll de màquina versionat: `.immunitari/cron.out` i unes 350 receptes de Plaquetes tracked, tres noves `??`; `ON_ESTIC.md` regenerat a cada sessió (decisió: rutinari o soroll). `wiki-cicle-de-vida` pas 9 mana versionar `.claude/skills/` però `.gitignore:39` ignora `.claude/`: instrucció inexecutable. El torn de Fable `torn_eafab5f7` té un rebut de `context` sense `create` (`261005_1155_prompt_fable_ultracode.md`, mai creat), un prompt creat i mogut a mà sense handoff (`261005_1155_prompt_fable.md`) i `plan: null` malgrat tindre el pla creat: no podrà tancar (memòria «rebut fantasma» verificada en viu).

**Pla de commit atòmic (ordres SENSE executar; des de l'arrel; mai `git add -A` ni `git add .`):**

Pas 0, decisions del Mestre: destí dels tres `*_null.*`; `stable.json` torna a 1.0.3; la skill nova es segella en torn propi; com es passa el hook (lease del Reflex `node tooling/wiki/reflex_petorreta.mjs open --intent="Commit atòmic 261005" --risk=high --operation=git-commit --scope=<rutes>` més `seal`, o `--no-verify` amb línia d'incidència al LEDGER).

Pas 1, higiene prèvia (MarIA, no Git): `node tooling/wiki/document.mjs handoff --turn-id torn_eafab5f7-6d92-49a2-ad17-eec892cc41af --file _wiki_de_poble/04_escriptori/261005_1155_prompt_fable.md --to _wiki_de_poble/90_arxiu_historic/261005_1155_prompt_fable.md`; `node tooling/wiki/document.mjs plan --turn-id torn_eafab5f7-6d92-49a2-ad17-eec892cc41af --file _wiki_de_poble/04_escriptori/261005_1155_pla_implementacio_fable.md`; handoffs del torn `torn_6cd529b4` (caduca el 2026-10-05T20:53:47Z, 22:53 local) per al pla 2230 i l'auditoria 2240 cap a la carpeta de sessió, si el Mestre vol conservar-li el relleu; índex: una àncora per document, línies buides fora, secció «## Relleu arxivat a mà (261005, Sessió Marató 2230)»; `git restore -- wordpress-plugin/builds/stable.json`; scratch fora de l'arrel; `node tooling/gates/porta-olivera.mjs --informe` ha d'eixir 0.

Pas 2, commit A «chore(arxiu): trasllat de la Marató 2230 a 90_arxiu_historic»: `git add -u -- _wiki_de_poble/04_escriptori/`; `git add -- _wiki_de_poble/90_arxiu_historic/261005_Sessio_Marato_2230/`; `git add -- _wiki_de_poble/90_arxiu_historic/261005_1155_prompt_fable.md` (només després del handoff); verificar `git diff --cached --stat -M` (R100) i `git diff --cached --name-only` sense cap `*_null.*`; commit.

Pas 3, commit B «chore(torns): rebuts i contracte dels torns Fable i Claude 261005»: `git add -- .agents/runtime/turns/torn_eafab5f7-6d92-49a2-ad17-eec892cc41af.json .agents/runtime/turns/torn_0a328563-5bba-4716-9c28-eb7b5442f723.json .agents/runtime/contracts/a1ad0cc687e57c5d097d9914936b2c25f29248a891f03e05c20704ec880be58d.json`; stagejar-los immediatament abans del commit (són vius). Els `.md` de l'Escriptori NOMÉS si abans `tancament.mjs --close` ha segellat els torns, o per decisió explícita amb `--no-verify` i línia al LEDGER.

Pas 4, commit C (torn separat): skill nova amb frontmatter corregit, `00_INDEX_SKILLS.md`, symlink, `npm run porta:segella:update`, commit «feat(skills): core-comprensio-reflexiva».

Pas 5, commit D (opcional): `.gitignore` amb `.immunitari/cron.out`, `.immunitari/cron.err`, `.immunitari/receptes/` i `git rm -r --cached` corresponent (ignorar no desversiona); resoldre `.claude/skills` (ignorar la regla o reescriure el pas 9).

Pas 6: línia al LEDGER per a `886f4272` i per als commits nous, `node tooling/verify-ledger.mjs --sign` pel Mestre, bloc ESTAT_ACTUAL.

Riscos: `git add -A` empassa 67,7 MB; stagejar `.md` amb torns oberts tomba el commit sencer; la skill sense resegellar tomba el Segell; `stable.json` amb localhost trenca el canal en producció; trasllat en dos commits perd `--follow`; `--no-verify` sense línia al LEDGER repetix el buit de `886f4272`.

### 4. El LEDGER «trencat» i la cadena de tancament

**Contracte de signatura.** `tooling/verify-ledger.mjs:20` `hashRegex = /\n\n<!-- HASH: ([a-f0-9]{64}) -->$/` i `:31` SHA-256 del fitxer sense el peu final; `tooling/documental/ledger.mjs:4-7` idèntic (tolera espais finals). Un sol peu vàlid: l'últim; els deu peus intercalats (línies 69, 187, 211, 238, 310, 328, 605, 618, 781, 823) són text del cos. El fitxer acaba literalment en `-->` sense salt (forma correcta). L'única entrada datada 261005 és la línia 21 («261005 | recaiguda | wiki-documentacio-i-reflex | canal viu …»), escrita a mà després del peu `c6eb…` de Codex: és el que l'Acta 0445 descriu. No existix cap «hook de ressegellat automàtic»: `verify-ledger` només el criden `run-portes.mjs:33` i `tancament.mjs:17`. No he pogut executar `verify-ledger.mjs` (fora de la llista blanca): la invalidesa concreta del peu és inferència coherent amb el codi i l'Acta.

**Reparació legítima (humana, sense reescriure història).** El Mestre, des del seu terminal: `node tooling/verify-ledger.mjs` (mostra esperat/trobat), opcionalment una línia nua «261005 | resegellat | ledger | peu c6eb invalidat per l'entrada 261005 recaiguda; resignat pel Mestre», i `node tooling/verify-ledger.mjs --sign` (només substituïx l'últim peu). Els agents no poden: `.agents` és SECURITY_PATH i `--sign` no és lectura.

**Contradicció estructural (P1, 0,9).** El REFLEX DE CORRECCIÓ de `CLAUDE.md` mana als agents «AFIG una línia a .agents/LEDGER.md», però `mutation-policy.mjs:6,15-16` bloqueja l'escriptura directa i cada línia afegida invalida un segell que cap agent pot refer. El sistema castiga complir la doctrina. Decisió: (a) acceptar que el LEDGER queda sense signar durant la jornada i el Mestre el signa en tancar (pas explícit a `wiki-cicle-de-vida` §8 i a l'Acta), o (b) un circuit `ledger:afig-i-signa` a `executor-mutacio.mjs` amb lease, dins de la mateixa operació CAS.

**Els 95 LINK_INVALID (P2, 0,7).** `verificador-scc.mjs:37` fa el cens de graf només amb `.md`; `:257` l'ancoratge rep també els recursos no-md però `:258` i `:145` resolen els enllaços de l'índex contra el cens només-md; `tooling/lib/document-links.mjs:16,20,24,30`: un `[[x.json]]` conserva l'extensió, es busca per basename entre `.md` i acaba en «Enllaç inexistent». La doctrina (índex:126, AGENTS §12) obliga a ancorar exactament eixos recursos. 90 dels 102 moguts no són `.md`: l'ordre de magnitud del 95. Avui el símptoma ha desaparegut perquè les àncores s'han esborrat amb el trasllat; tornarà amb la primera captura. La memòria heretada sobre `[[00_index_escriptori]]` és rància: resol per basename únic; `tractor-orfandat.mjs:51` exclou l'Escriptori com a origen, no com a destí. Canvi mínim (lease): a `auditGraphConnectivity`, cens unificat quan `file` és l'índex de l'Escriptori.

**Hi ha camí a `closed`? No, per disseny (P2, 0,9).** `tancament.mjs:37` uneix els errors del torn (`checkTurn`, que sí té amnistia: `turns.mjs:242-247`) amb els de l'entorn (`environmentChecks:13-31`: plantilles, autoritat, LEDGER, segell, catàleg, Wiki `--strict`, SCC de tota la Wiki, i set suites per a scope code), que és global i sense amnistia. Cap entrada del LEDGER declara mai un `closed`. A més: la zona humana no té canal de reconeixement (`turns.mjs:352-362`: `startHumanWatch` rebutja els torns v1, que són tots, i `acknowledgeHumanZoneChanges` no el crida ningú: tota captura nova a `01_produccio` després d'obrir un torn el bloqueja per sempre); i dins de `--close` la porta «ledger» és tautològica (`ledger.mjs:14-22` resigna abans de verificar). Decisió de política: mantindre la porta global i fer una jornada exclusiva de neteja, o separar «tancament del torn» de «salut de l'entorn» (informe, no veto). Jo no triaria pel Mestre: és la frontera entre rigor i paràlisi.

Menors: `verify-ledger.mjs:13` resol el LEDGER per `process.cwd()` en lloc d'`arrel.mjs`; `verificador-scc.mjs:29` i `:192` exclouen `90_arxiu_historic` dues vegades i el comentari «case-insensitive» de `:120` no es complix; `tooling/session/check-close.mjs:70` usa `90_historic` (carpeta inexistent) i `:90` esborra un fitxer dins d'un «check». El torn de la Marató `torn_6cd529b4` caduca hui a les 20:53Z amb pla i rebuts moguts sense handoff.

### 5. T3 · Consola Termodinàmica: brossa, extirpació i decoració

**Com es registra.** Una sola ruta global `App.jsx:47` (`lazyRoute`) i `:792` `/consola/*` amb `RutaConsola` (sense sessió en DEV, superadmin en build: `guardaConsola.js:19-21`); incrustada a la Wiki a `WikiDePobleSection.jsx:215`. Dades només en DEV pel middleware `tooling/vite/consola-iaia.mjs` (`/__iaia/consola.json` i `/__iaia/mapa.json`). Tractors i Sentinelles només a la Wiki en DEV, per disseny. Nou targetes al tauler (`consolaPagines.js:28-30`: pols, explorador, fluxos, calendari, inventari, entrades, agents, actors, salut), cinc panells del pols, deu xifres d'«El Mas en xifres».

**T3-01 · Targetes de consums i crèdits: localització exacta i pla en dues fases (P1, 0,95; decisió humana per a la Fase B).** Panell Consums: `polsConsola.js:29`, `PolsConsola.jsx:94-131` i `:376`, xifres `tokens-d-entrada`, `tokens-d-eixida`, `registres-de-consum` (`xifresVistes.js:714-753`, grup `:1055`); Panell Crèdits: `polsConsola.js:34`, `PolsConsola.jsx:133-159` i `:377`, xifra `proveidors-de-credits` (`xifresVistes.js:995-1022`, grup `:1050`), família `credit` (`pecesMapa.js:270-300`), text d'`estrategia_consum.txt` (`.sdp-consola__estrategia`, `modules.css:6083`); vistes `xifresMas.js:405-406,494,506`; etiquetes `consolaPagines.js:549,558-559`; normalització `consolaContent.js:142-159`. Font real: `.agents/credits.json` (5 entrades a mà) i un diari amb UNA línia `consum.tokens`. Fase A (idèntica fora de `/consola/pols` i filles): llevar les entrades, els panells, les quatre xifres, la família `credit`, les dues vistes, les etiquetes, l'import de `resumConsums`, canviar «els cinc panells» per «els tres panells» (`PolsConsola.jsx:364,368`), llevar `.sdp-consola__estrategia` i la seua exempció a `modules.abast.capes.test.js:317`, i reescriure les proves afectades (`ConsolaSection.pols/test/navegacio/viceversa/xifres.test.jsx`, `xifresMas.test.js`, `xifresDestacades.test.js`, `consolaPagines.test.js`, llistes de línies a l'informe del caçador). Fase B (canvia píxels del TAULER i copy, NOMÉS amb ordre): `MESURES.pols` (`consolaPagines.js:100`) pinta «N registres de consum» com a primera h5 de la targeta del tauler; el lead del pols a `pageContent.js:185` diu «Consums de tòkens, crèdits…» (frontissa de contingut, empremta aprovada). No esborrar `.agents/credits.json` ni `estrategia_consum.txt` sense ordre. Duplicat de font: `consolaPagines.js:549` té `IDS` hardcodejat en lloc d'`IDS_PANELLS` (`polsConsola.js:51`).

**T3-02 · Quatre peces OBSOLETES exportades sense consumidor (P2, 0,95).** `peces.jsx:46` `TargetaResum`, `:64` `Xifra`, `:191` `useTargetesQueObrin`, `:219` `movimentReduit`; `:36-40` «OBSOLETA · Es conserva perquè ningú no l'esborre a cegues»; consumidors reals: només `peces.test.jsx` (set tests), `manifest.js:372` del catàleg i un selector `modules.css:5935`. Zero píxels en esborrar-les; decisió humana pel comentari.

**T3-03 · CSS orfe (P2, 0,92).** `modules.css:6089-6104` `.sdp-consola__ajust*`, `components.css:564-565` `.sdp-consola__segell`, `:569` `.sdp-consola__llista`: cap JSX els pinta (les proves només n'asseguren l'absència).

**T3-04 a T3-06.** `src/sections/consola/mapa/MapaConsola.jsx.tmp` de 0 bytes versionat (esborrat, decisió humana); branca morta a `MapaConsola.jsx:141,192-197` (lectura pròpia i botó «Refrescar el mapa» que cap consumidor activa: `ConsolaSection.jsx:286` sempre passa `font`); taules de tons duplicades en tres i quatre fitxers (`TO_ESTAT`, `TO_CONFIANCA`, `TO_SEVERITAT`, `rutaDelNode`, `darrer`, `textAcreditat`) i dos `FONT_MAPA` amb valors diferents (`mapaContent.js:16` vs `xifresComu.js:26`).

**T3-07 i T3-08 · Què cal per a decorar (P2, 0,9; decisió humana).** Cap targeta del tauler rep `imatge` (`ConsolaSection.jsx:217-222`) encara que `TargetaConsola` ho admet (`peces.jsx:110,126-128`: amb imatge deixa de pintar la insígnia de la icona, és un redisseny); `xifresMas.js:538` «Cap xifra no porta imatge encara»; tres pàgines (fluxos, agents, actors) només tenen `COPY_PROVISIONAL` (`consolaPagines.js:35-48`) i no són a `PAGE_COPY.consola.pagines` (`pageContent.js:184-191`, frontissa de contingut). El cens no quadra amb l'Acta: 9 targetes, no 6-7 (més 3 panells del pols si es vol). Abans de cap imatge: pla aprovat que fixe cens, camp `image`/`imageAlt` a `PAGE_COPY`, el pas d'`imatge` per `paginaConsola → ConsolaTauler → TargetaConsola`, i proporció i pes segons `core-identitat-visual`. Els prompts Nano Banana no s'han escrit: l'etapa del workflow s'ha parat; es poden fer en un torn barat quan el Mestre tanque el cens (l'inventari funcional de les 18 peces vives ja és a l'informe del caçador i es pot reaprofitar).

### 6. Troballes transversals de governança observades en esta mateixa sessió

- **G1 (P1) · El hook PostToolUse `segell-auto.mjs` falla a cada crida d'eina** («Origen no acreditat: segell divergent») des de les 12:17, per la skill nova. Soroll roig permanent per a tots els agents, i l'executor amb lease també refusa: deadlock de governança fins que el Mestre reconcilie el segell.
- **G2 (P2) · El hook no admet ompliments parcials d'un document de ruta**: `Edit` sobre este informe es rebutja mentre quede una secció `[pendent]` (`tooling/documental/core.mjs:169-184`). Obliga a escriure l'informe sencer d'una tacada i fa impossible el «canal viu cada 3-4 minuts» (lliçó 261003) dins del mateix document. Proposta: permetre edicions que no AUGMENTEN el nombre de seccions pendents.
- **G3 (P2) · El hook bloqueja tota escriptura fora del repositori**: scratchpad de Claude Code i memòria persistent (`~/.claude/projects/…/memory/`). Claude no pot guardar el que aprén entre sessions mentre treballa ací; les memòries existents es van escriure fora d'este hook. Proposta: llista blanca per al directori de memòria i el scratchpad de sessió (`mutationPath` els tracta com a «Ruta fora del repositori»).
- **G4 (P2) · La llista blanca de lectura és una cadena exacta** (`mutation-policy.mjs:134-154`): la porta Olivera sense bandera (la forma d'AGENTS §0.1) ix amb 2; `date`, `git show`, `git log -1 --stat`, `git diff … -- <ruta>`, `grep` amb `\|` i qualsevol pipe queden bloquejats. Una dotzena de crides perdudes en esta sessió i els caçadors igual. Proposta a §1.4 pas 8.
- **G5 (P2) · Dos esborranys d'auditoria per a un sol encàrrec** (`261005_1211` de MarIA i `261005_1215` de Fable): `node tooling/gates/porta-documents.mjs` ix 1 amb deu errors mentre siguen pendents, i `tancament --check` sense torn és roig. El 1215 queda com a punter; cal arxivar-lo amb `node tooling/gates/porta-olivera.mjs --arxiva --nom 261005_1215_auditoria_fable.md` (primer `--sec`) i `node tooling/wiki/document.mjs handoff --turn-id torn_0a328563-5bba-4716-9c28-eb7b5442f723 --file _wiki_de_poble/04_escriptori/261005_1215_auditoria_fable.md --to _wiki_de_poble/90_arxiu_historic/261005_1215_auditoria_fable.md`.
- **G6 (P3) · Plantilles amb deute**: `prompt_local.md:63` mana llegir «obligatòriament» `taxonomia_documental.md` sense ruta (viu a `02_saber/protocols_tecnics/`, no a `02_saber/`); la plantilla d'auditoria arrossega «**Categoria:** protocols (BROKEN LINK: skills) <!-- TODO: fix link -->» i «Relacionat: [[00_arquitectura_tecnica_unificada]]» dins del text que `create` copia a cada informe nou; el Registre del prompt deia «Claude 3.5 Fable UltraCode» (el model és Fable 5.1).
- **G7 (P3) · ESTAT i LEDGER són inassolibles per a Claude** (`.agents` és SECURITY_PATH): el pas 7 de `wiki-cicle-de-vida` i AGENTS §4 són incomplibles per este agent sense lease. El text per a MarIA és a §8.

### 7. Taula de severitats (totes d'una lent, sense refutació)

| Id | Sev | Conf. | Tema | Decisió humana |
| --- | --- | --- | --- | --- |
| T2-01 | P0 | 0,97 | Bundle 67,7 MB `*_null.*` a l'arrel de l'arxiu | sí |
| T2-02 | P0 | 0,93 | Pre-commit exigix torn `closed` i lease del Reflex | sí |
| C1/T4a-01 | P1 | 0,95 | Porta Olivera només arxiva `.md` de 12 categories | sí |
| C4/T4b-02 | P1 | 0,90 | Pre-invocation calla amb taula «vàlida» però plena | sí |
| C5/T4b-03 | P1 | 0,92 | `force_ask` sense reparació posterior (6/6) | no |
| C6/T4b-04 | P1 | 0,90 | Scripts scratch a l'arrel passen el hook d'Antigravity | no |
| C7/T4c-01 | P1 | 0,95 | Cap acció mecànica arxiva al tancar la jornada | sí |
| C8/T4a-05 | P1 | 0,90 | Paquet 261002 no aplicat; proves `[DEFECTE]` verdes | sí |
| C9/T4b-01 | P1 | 0,95 | Antigravity arranca només amb AGENTS.md | no |
| T4c-02 | P1 | 0,90 | El tancament no pot tancar; PostToolUse falla a cada eina | sí |
| T4c-03 | P1 | 0,95 | 102 fitxers moguts a mà; 90 fora de l'abast de l'eina | sí |
| T1-01 | P1 | 0,80 | Crash useSession sense causa a HEAD; reproduir abans | sí |
| L-01 | P1 | 0,70 | Signatura LEDGER: cos editat després del peu `c6eb` | sí |
| L-02 | P1 | 0,90 | REFLEX mana escriure al LEDGER; cap agent pot resignar | sí |
| L-03/T2-03 | P1 | 0,95 | Segell de skills trencat per `core-comprensio-reflexiva` | sí |
| L-05 | P1 | 0,85 | `torn_6cd529b4` caduca 20:53Z sense handoffs | sí |
| L-06 | P1 | 0,90 | Zona humana sense canal de reconeixement | sí |
| T2-04 | P1 | 0,92 | `stable.json` 1.0.4 amb localhost | sí |
| T2-05 | P1 | 0,95 | Trasllat sense àncores ni handoff; 85 000 línies a l'història | sí |
| T3-01 | P1 | 0,95 | Consums i crèdits: extirpació en dues fases | Fase B |
| G1 | P1 | 1,00 | `segell-auto` roig a cada crida | sí |
| C2, C3, C10, T4c-04..12, T4b-05..09, T1-02, T1-03, T1B-01, T1B-02, L-04, L-07, L-08, T2-06..10, T3-02..09, G2..G7 | P2/P3 | 0,7-0,95 | Detall a cada secció | mixt |

### 8. Text per a ESTAT i LEDGER (Claude no pot escriure a `.agents/`; MarIA l'aplica)

```markdown
## ESTAT_ACTUAL · 2026-10-05 12:55 · Fable · auditoria adversarial parada per quota

Informe 261005_1211_auditoria_fable (v1.0.0, ancorat). Workflow de 16 caçadors parat a les 12:47 pel 99 % setmanal global: 8 resultats (T1, T1-bis, T2, T3, T4a, T4b, T4c, LEDGER), sense refutació. Crash useSession: no reproduïble a HEAD, cap prova real de l'eixida; primer una prova d'integració. Tractor de neteja: forat mecànic en cadena (C1-C10) i solució en 8 passos; paquet 261002 encara sense lease. Commit atòmic: pla en 6 passos; P0 el bundle de 67,7 MB a l'arxiu i el pre-commit que exigix torns closed. Segell de skills trencat a les 12:17 per core-comprensio-reflexiva: executor i PostToolUse bloquejats fins a reconciliació del Mestre. 261005_1215_auditoria_fable és un duplicat a arxivar. Següent: decisions del Mestre de §1.4, §3 pas 0 i §4; handoffs de torn_6cd529b4 abans de les 22:53.
```

```markdown
261005 | auditoria | fable | 1211: autòpsia tractor neteja C1-C10, useSession no reproduïble, commit atòmic 6 passos; cacera parada 99 % quota
261005 | incidència | wiki-documentacio-i-reflex | bundle 67,7 MB per a IA local amb nom null a l'arxiu; prohibit per AGENTS §6
261005 | incidència | core-higiene-escriptori | 102 artefactes de la marató moguts a mà amb scratch_*.mjs a l'arrel; 14a recaiguda
261005 | bloqueig | governança | segell de skills 818b1a09 ≠ 5be515e9 per core-comprensio-reflexiva sense versionar; executor i segell-auto refusen
```

### 9. Retroalimentació de la plantilla `prompt_local` i Proposta d'Automillora

- **El prompt demanava una cosa impossible de mesurar** («para al 5 % de quota»). Una IA local no veu cap comptador; si el Mestre vol una parada per quota, que la dispare ell amb el panell o que el prompt fixe un pressupost en nombre d'agents o en temps. Si m'ho haguera demanat així («setze caçadors, sense refutació, informe a les 13:00»), hauria sigut més eficient i hauria evitat 45 dòlars en una cacera que s'ha hagut de parar a mitges.
- **Un sol esborrany per encàrrec.** La plantilla hauria de dir si l'orquestradora pre-crea l'informe de l'agent (com ha fet MarIA a les 12:11) o si el crea l'agent amb el seu torn. Avui han nascut dos, i el meu torn `torn_0a328563` queda amb un rebut que caldrà rellevar.
- **El Registre porta el model equivocat** («Claude 3.5 Fable UltraCode»): posar un camp lliure o deixar-lo a l'agent.
- **La secció «Context Tècnic» mana llegir `taxonomia_documental.md` sense ruta**; donar-la.
- **Les ordres de lectura que la plantilla pressuposa** (`git show`, `date`, pipes, la porta sense bandera) estan bloquejades pel hook: o s'amplia la llista blanca (§1.4 pas 8) o el prompt avisa.
- **Automillora proposada**: (1) un `jornada:tanca` mecànic (§1.4 pas 5) és la peça que més fricció estalviaria al Mestre: convertix la neteja de l'Escriptori en un acte de màquina amb un sol «sí», i deixa d'exigir memòria a cap IA; (2) permetre que els agents escriguen la seua memòria i el scratchpad (G3): sense això cada sessió de Claude reaprén els mateixos bloquejos; (3) una etapa de refutació adversarial separada i barata (dos escèptics per troballa P0/P1) abans d'actuar sobre este informe, perquè cap de les troballes ha passat per ella.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Executat per Fable (lectura, cap escriptura fora d'este document i del punter 1215):

- `node tooling/gates/porta-olivera.mjs --informe` → exit 0: «4 documents solts; declarats vius: pla 1155, prompt 1155, auditories 1211 i 1215; cap ranci; Safata buida; pla de hui present». La porta diu net perquè la seua definició no veu el que s'ha mogut a mà.
- `node tooling/gates/segella.mjs` → exit 1: «hash actual 818b1a09 no coincideix amb el segellat 5be515e9» (31 fitxers segellats, 32 al disc; `core-comprensio-reflexiva/SKILL.md` creat a les 12:17:10).
- `node tooling/gates/porta-documents.mjs` → exit 1 amb deu errors: seccions pendents i Registre incomplet als dos esborranys d'auditoria (resolt per a 1211 amb este text; 1215 queda com a punter vàlid).
- `grep -c` sobre `.agents/runtime/antigravity-hook.log`: `"mode":"pre-invocation"` 5 478; `"decisio":"injecta"` 264; `"decisio":"force_ask"` 6.
- `git status --short`, `git diff --stat --no-ext-diff --no-textconv` (106 fitxers, 71 insercions, 85 490 supressions), `git log --oneline`.
- `grep -c "arxivat a mà" 00_index_escriptori.md` → 9 (el caçador T4c en compta 13 incloent «Relleu arxivat»).
- Prova d'escriptura al scratchpad i a la memòria de Claude → bloquejades («Ruta fora del repositori»). `Edit` parcial de l'informe → bloquejat («Secció absent o pendent»).

Executat pels caçadors (declarat als seus informes): `npx vitest run src/sections/control/ControlSection.eixida.test.jsx` → 1/1 passada (12:31); `node --test tests/fonts-vigilancia.test.mjs` → 11/11 (sobre fixtures, no sobre el LEDGER real); `node tooling/gates/segella.mjs` i `porta-documents.mjs` amb els mateixos resultats.

NO verificat: `verify-ledger.mjs` i `verificador-scc.mjs` (fora de la llista blanca), `npm run lint`, bateria Vitest completa, el contingut del commit `886f4272`, el navegador a `localhost:3340`. Cap troballa ha passat per la fase de refutació adversarial.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Quota.** No tinc comptador. He parat quan el Mestre ha mostrat el 99 % setmanal global (Fable al 11 %, però el límit vinculant és el global). Si el compte arriba al 100 %, les crides noves fallen a mitges: per això este informe s'ha escrit abans de res més.
- **Abast de la cacera.** 8 de 16 caçadors han acabat (T1, T1-bis, T2, T3, T4a, T4b, T4c, LEDGER). No han corregut: correctesa React, enxufabilitat Model B, seguretat i RLS, rendiment LCP 8,1 s, salut de proves i CI, CSS Pedra Seca, portes amb verd inert, connector de WordPress. Tampoc la deduplicació, la refutació (dos o tres escèptics per troballa), el crític de completesa ni els prompts Nano Banana. «Anàlisi intensiva de tot el codi» NO s'ha fet: s'ha fet la de les quatre tasques i del LEDGER.
- **Lectura de `90_arxiu_historic/`.** He llegit un sol fitxer d'eixa carpeta per encàrrec directe de T1 (`261005_Sessio_Marato_2230/261005_0345_tasques_pendents_consola_visual.md`, la descripció original del crash) i el prompt `261005_1155_prompt_fable.md`; els caçadors només n'han llistat noms i capçaleres dels fitxers nomenats. Cap RAG automàtic.
- **Fitxers que no puc tocar.** `.agents/ESTAT.md` i `.agents/LEDGER.md` (zona governada; text a Troballes §8), la memòria persistent i el scratchpad (bloquejats pel hook). Este informe viu amb el rebut de MarIA (`torn_eafab5f7`); el meu torn `torn_0a328563` queda amb el rebut de `261005_1215`, que cal rellevar en arxivar-lo.
- **Sense refutació.** Cada troballa és d'una sola lent. La memòria del Mas (≈27 % de falsos) obliga a tractar-les com a hipòtesis fortes amb evidència `ruta:línia`, no com a veredictes. Les confiances són les que han declarat els caçadors.
- **Temps.** Les hores d'este document són aproximades: el hook bloqueja `date`; m'he datat amb `ls -lT` i amb `expiresAt` del torn.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
