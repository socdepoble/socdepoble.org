---
type: informe
status: esborrany
description: Auditoria de capacitat Plug & Play LLM (respon al prompt 0745). Nota 3/10, set barreres arrel, diagnòstic mecànic de l'oblit de l'escriptori i el tractor que el fa impossible.
tags:
  - consell
  - arquitectura
  - revisar
reflex: 6e372469c6cdb992b5d9bfbfe123441241cddff36d5c0e49e3f0b986c13993ed
---
# Informe d'auditoria: autonomia Plug & Play LLM (torn 1 de Claude)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-INFORME-PLUGPLAY-260921-0759 |
| Respon a | [[260921_0745_prompt_autonomia_llm_plug_and_play]] |
| Entorn | entorn-dev-local, branca `backup-notes-publish`, HEAD `d79bd0f9` + 99 canvis sense cometre |
| Creació | 26-09-21 07:59 |
| Agent redactor | Claude (Anthropic), membre 6 del Consell |
| Efectes laterals | Este informe, l'ancoratge a l'índex, ESTAT i LEDGER. Cap canvi a `src/`, `tooling/`, `.agents/skills/` ni plantilles. |
| Aprovació humana | pendent |

## Vincles (Ancoratge de Seguretat)

- [[00_INDEX_ESCRIPTORI]]
- [[260921_0701_informe_auditoria_brain_claude]] (no repetisc el que ja hi és; el cite)
- [[../02_saber/protocols_tecnics/auditoria_canonica]]

---

## 0. Rebut de reflex: què he llegit i executat abans d'escriure

- `protocolledge.json` → ruta `auditoria` → `auditoria_canonica.md` (hash al frontmatter). Contracte d'informe: evidència reproduïble, severitat, font de veritat en conflicte, proposta conservadora, `requires_human_decision` on cal.
- Skills: `sdp-calendari-agricola`, `wiki-documentacio-i-reflex`, `wiki-cicle-de-vida`, `sdp-workflow`. Constitucions: `QUI_SOC.md`, `.agents/AGENTS.md`, `CLAUDE.md`.
- Tractors llegits sencers: `despertar.mjs`, `somiador.mjs`, `tancament.mjs`, `check-close.mjs`, `porta-reflex.mjs`, `obrir_torn.mjs`, `preflight_matrix_wrapper.mjs`, `run-portes.mjs`.
- Executat en només lectura: `npm run porta`, `npm run tancar`, `cataleg_skills.mjs --check`, `matrix.mjs "crear un prompt"`, `eslint --quiet`.
- Banda de codi (`src/`, `supabase/`, portes E/R/W/V/C) cartografiada amb un agent d'exploració i les cites verificades a mà on les use.
- Sense cerca web, sense bundle: he treballat sobre l'arbre viu (Reunió davall l'Olivera).

## 1. Veredicte en una pàgina

**Distància al Nirvana Plug & Play: 3 sobre 10.** El codi està molt més a prop (7/10) que el Brain (3/10), i els conductes d'execució (portes, hooks, tancament) estan a 2/10 perquè hui no donen cap senyal fiable.

La frase «Sóc de Poble! Hui no estic. Fes el Calendari Agrícola» fallaria hui per set motius arrel, i cap és estètic:

1. **No hi ha porta d'entrada neutra.** Només Claude arranca amb constitució (`CLAUDE.md`). Codex, Gemini, Cursor o Copilot no troben cap `AGENTS.md` a l'arrel i arranquen cecs.
2. **La cadena de portes mor a la posició 3.** Dos errors de lint aturen `npm run porta`; les 45 portes restants no s'executen. El pre-commit executa la mateixa cadena: tot commit d'avui s'ha fet saltant-se'l.
3. **El tancament està en roig per deute que no és de qui entra.** `npm run tancar` falla amb 22 orfes i un estil en línia: 13 plantilles i el seu índex (reanomenades sense reenllaçar), `sgq_prompts.md`, `CLAUDE.md`, `VEINS.md`, cinc fitxers a `02_investigacio_ia/`, un `prompt.md` de 37 KB a l'arrel i `ItemMedia.jsx`. I el cron immunitari els diagnostica cada hora sense curar-ne cap.
4. **Paradoxa del contracte.** `src/data/contracte.js` és `SDP-LOCK`, però la porta Enxufe (E2) obliga a editar-lo per exposar qualsevol mètode nou. No hi ha mecanisme d'extensió per a un mòdul.
5. **No hi ha Supabase local ni `supabase/functions/`.** La migració `cultius.sql` no es pot aplicar ni provar sense un humà al SQL Editor. L'enviador d'SMS no té cap lloc on viure.
6. **L'autonomia està prohibida per disseny.** `sdp-workflow` §1 exigix que el Mestre aprove el PRD abans de codificar. Sense una política de «Mestre absent», la IA obeient s'atura ací.
7. **No hi ha runbook de mòdul nou.** Afegir una secció toca quatre fitxers de rutes, `modules.css` (79 KB), `registre.js` i el manifest SEO, i cap document ho diu en orde.

I la resposta a la pregunta clau del §4 del prompt (l'oblit de l'escriptori) és mecànica, no moral: **la regla està en quatre llocs amb tres polítiques incompatibles, no és a la finestra de context en el moment d'escriure, i cap tractor la mesura.** Vegeu §4.

## 2. Simulació honesta: què em passa hui, pas a pas

| Pas | Què faria una IA nova | Què li passa hui | Evidència |
| --- | --- | --- | --- |
| Aterrar | Busca `AGENTS.md` a l'arrel | No existix; només `CLAUDE.md` (815 bytes) que carrega `QUI_SOC.md` + `ON_ESTIC.md` | `ls AGENTS.md` → no; `.agents/AGENTS.md:8` diu que les skills «no són memoritzables per defecte» |
| Carregar skills | Espera que el router li injecte `sdp-calendari-agricola` | El router (`matrix.mjs`) viu, però només l'invoca `preflight_matrix_wrapper.mjs` amb un payload d'Antigravity (`invocationNum`, `matrixProtocols`). No hi ha `.claude/settings.json`; `hooks.json` no el llig cap programa del repositori | `grep -rl hooks.json` → només documents i informes |
| Llegir l'espec | `sdp-calendari-agricola/SKILL.md` | Bona: taules, mock d'SMS, Pedra Seca. Però diu «cap taula core sense aprovació» i calla sobre el contracte, que sí que s'ha de tocar | SKILL.md:19 vs `tractor-enxufe.mjs` E2 |
| Escriure la migració | `supabase/migrations/260921_HHMM_cultius.sql` amb RLS | Pot escriure-la; la porta RLS (R1-R8) la revisa estàticament. No la pot aplicar ni provar: no hi ha `config.toml`, CLI ni `localhost:54321` | `ls supabase` → README, migrations, seed.sql |
| Exposar dades a la UI | Afegir `getCultius` al backend | Ha d'editar `contracte.js` (`/* SDP-LOCK */` línia 1) i `backendPort.js` alhora, o E2 falla | `tractor-enxufe.mjs:117-150` |
| Component | Copiar `src/sections/notes/` | No és autocontingut: toca `modules.css`, `config/sections.js`, `App.jsx` (lazy + Route), `navigation.js`; la porta V3 prohibix CSS dins de la secció; C1 exigix entrada a `registre.js` | `src/sections/README.md`, `tractor-vocabulari.mjs`, `tractor-cataleg.mjs` |
| Notificador mock | Un `notificacions.js` | Cap ubicació legal: `src/data/` tancat pel contracte, no hi ha `supabase/functions/`, el bot de WhatsApp viu a `bot/` fora de l'app | `bot/whatsapp_baileys.mjs`; cap `functions/` |
| Verificar | `npm run porta` | Mor a la porta 3 (Linter): `NotesDataContext.jsx:458 eol-last`, `porta-reflex.mjs:16 no-empty`. 45 portes mudes | Eixida d'avui, 07:52 |
| Tancar | `npm run tancar` | Roig per deute heretat: 22 orfes + 1 estil en línia (§B3). No pot obtindre rebut verd sense tocar faena d'altres | Eixida d'avui, 07:55 i 08:05 |
| Cometre | `git commit` | Husky executa `gate` + `lint` + `test`: falla al lint. Aprén que `--no-verify` és la norma | `.husky/pre-commit` |

Resultat: la IA nova arriba a tindre codi raonable, però **no pot demostrar que és net, no pot provar-lo contra la base de dades i no pot tancar el torn.** Això no és autonomia; és un becari sense clau del taller.

## 3. Les set barreres reals (P0), amb causa arrel i proposta

### B1 · Sense porta d'entrada neutra ni carregador de skills

- **Evidència.** Arrel: només `CLAUDE.md`. `.agents/` conté cinc constitucions (`QUI_SOC`, `AGENTS`, `BOOTSTRAP`, `BIOS`, `BASELINE`) i `QUI_SOC.md:62` diu que reemplaça les altres quatre, que continuen al disc i les lligen els tractors (`manifest.yaml` apunta a `AGENTS.md` i `PROFILE.md`, no a `QUI_SOC`). Ja documentat com a P0-5 a l'informe 0701; no s'ha mogut.
- **Causa arrel.** La identitat de la IAIA es defineix per prosa que només un arnés carrega. L'adopció d'identitat (§2.3 del prompt) depén de quin editor obri la carpeta.
- **Proposta.** Un sol `AGENTS.md` a l'arrel (convenció que lligen Codex, Cursor, Gemini CLI, Copilot i Claude via `@AGENTS.md`), amb el contingut de `QUI_SOC` més les deu regles que només viuen a les altres quatre. `CLAUDE.md` = dues línies d'`@`. Els tractors que citen `AGENTS.md`/`PROFILE.md` s'actualitzen en la mateixa Petorreta. `requires_human_decision: true`.

### B2 · La cadena de portes és fail-fast i està morta a la posició 3

- **Evidència.** `run-portes.mjs:30-79`: 48 passos, Linter és el tercer. `eslint --quiet` → 2 errors (`src/sections/notes/NotesDataContext.jsx:458` eol-last; `tooling/gates/porta-reflex.mjs:16` no-empty). Tot el que ve després (Enxufe, RLS, Rutes Web, Catàleg, Frontmatter, SCC, Proves) no s'executa.
- **Causa arrel.** Una cadena que s'atura al primer roig converteix 47 portes en zero informació. Una IA nova no pot saber si el seu Calendari passa RLS o Catàleg.
- **Proposta.** Dos arreglos de lint (cinc minuts) hui mateix. Després, `run-portes.mjs` en mode «executa-les totes i resumix», amb bloqueig final si n'hi ha alguna en roig. El pre-commit ja fa `gate + lint + test`; no cal duplicar el lint dins de `gate`.

### B3 · El tancament falla per deute heretat

- **Evidència.** `npm run tancar` (08:05): 22 `ORPHAN_OPERATIVE` + 1 `PEDRA_SECA_INLINE_STYLE`. Per famílies: (a) 13 plantilles de `03_actuar/plantilles/` (`acta.md`, `prompt_consell.md`, `prompt_local.md`, `skill.md`…) i el seu `00_index_plantilles.md`: la purga del commit `5ff9c1c1` les va reanomenar, però `03_actuar/00_index_actuar.md` no enllaça `plantilles/` i els fitxers nous no estan versionats (`git grep 00_index_plantilles HEAD` → res). Les plantilles que `protocolledge.json` encamina són orfes al graf. (b) `02_saber/protocols_tecnics/sgq_prompts.md`. (c) `CLAUDE.md` i `VEINS.md` a l'arrel. (d) Cinc fitxers a `04_escriptori/02_investigacio_ia/` (subcarpeta que cap índex enllaça). (e) `prompt.md` a l'arrel, 37 KB, seguit per git. (f) `src/components/universal/workspace/ItemMedia.jsx:1`. Cap dels 23 és del cicle actual. Nota: la primera vegada només vaig llegir la cua de l'eixida i vaig comptar cinc; Codex ho va veure sencer. Corregit.
- **El cron que no cura.** `~/Library/LaunchAgents/org.socdepoble.plaquetes.plist` executa cada 3600 s `scripts/immunitari/plaquetes.mjs diagnostic --autonom`. El mode `diagnostic` (`plaquetes.mjs:160`) només escriu una recepta a `.immunitari/receptes/`; el mode `aplica` (`:302`) no l'executa ningú. Hui: dotze receptes (05:47, 06:47, 07:47…) amb entre 40 i 82 operacions `ADOPTA`, sempre els mateixos fitxers. El registre diu «Mode Autònom Activat» i el graf no canvia. Una IA nova hereta 3,5 MB de receptes que descriuen el mateix mal cada hora.
- **Causa arrel.** El rebut verd és global, no per torn. `wiki-cicle-de-vida` §4 promet `--turn-id=<id>`; `tancament.mjs` no llig cap `--turn-id` (només `--json`). La IA hereta el roig dels altres i, com que té prohibit tocar faena aliena sense preguntar, no pot tancar mai. I el sistema que hauria d'absorbir eixe deute (Plaquetes) diagnostica sense aplicar.
- **Proposta.** Fer real el `turn_id`: `tancament.mjs` distingix «deute previ» (avís, llistat, no bloqueja) de «deute del torn» (bloqueja). Netejar els 23 ara: una línia a `00_index_actuar.md` cap a `plantilles/00_index_plantilles` (resol 14), ancorar `sgq_prompts.md`, `CLAUDE.md` i `VEINS.md` des d'`00_index.md`, ancorar o arxivar `02_investigacio_ia/`, `git rm --cached prompt.md`, corregir `ItemMedia.jsx`. Decidir si Plaquetes ha d'aplicar L1 (`aplica`) o deixar de dir «autònom». `requires_human_decision: true` per a `02_investigacio_ia/`, `prompt.md` i Plaquetes.

### B4 · Paradoxa del contracte `SDP-LOCK`

- **Evidència.** `src/data/contracte.js:1` `/* SDP-LOCK */`, 32 mètodes de nucli + 9 de capacitats. `tractor-enxufe.mjs` E2: bijecció estricta entre `backendPort.js` i el contracte. No existix `capacitats.notificacions` ni cap capacitat per a un domini nou. `sdp-calendari-agricola` §2 prohibix alterar «taules core» però no diu res del contracte.
- **Causa arrel.** L'enxufabilitat es va pensar per a canviar de backend, no per a afegir dominis. El pany protegix el nucli i, de pas, bloqueja tota extensió.
- **Proposta.** Separar el pany: `CONTRACTE_NUCLI` continua `SDP-LOCK`; `CAPACITATS` s'obri a extensió per domini (`calendari`, `notificacions`), amb E2 validant nucli + capacitats declarades. La skill del Calendari ha de dir explícitament quina capacitat crea. `requires_human_decision: true` (toca la Llei de l'Enxufabilitat).

### B5 · Sense Supabase local ni lloc per al notificador

- **Evidència.** `supabase/` = `README.md`, `migrations/` (17), `seed.sql`. Cap `config.toml`, cap `functions/`, cap `pg_cron`. `.env.example` només apunta a un projecte remot. El procediment del README és manual (SQL Editor).
- **Causa arrel.** «100% Online» s'ha llegit com «sense entorn local». Sense entorn local, cap IA pot validar SQL, RLS real ni un trigger.
- **Proposta.** `supabase init` + `config.toml` + `npm run db:local` (CLI de Supabase: és un `npm install` i, per tant, decisió del Consell) o, com a mínim, un `tests/sql/` amb comprovacions estàtiques més fortes. Crear `supabase/functions/` com a ubicació canònica dels enviadors, amb `notificacions-mock` com a primer habitant i el bot de `bot/` documentat com a canal real. `requires_human_decision: true` (dependència nova).

### B6 · L'autonomia està prohibida per disseny

- **Evidència.** `sdp-workflow` §1: «L'usuari ha d'aprovar aquest esborrany». `AGENTS.md` §12: «no s'ha de buidar cegament l'Escriptori». `QUI_SOC.md` §6: «prohibit esborrar a l'escriptori sense preguntar». Totes tres exigixen un humà present.
- **Causa arrel.** No existix el concepte «Mestre absent». Tota la constitució pressuposa diàleg.
- **Proposta.** Una regla nova, curta, a la constitució única: «**Mode Sofà.** Quan el Mestre declara absència, l'aprovació humana del PRD la substituïx un PRD escrit a l'escriptori + totes les portes en verd + una autorevisió de tres fallades (Les Tres Pedres). Les accions destructives continuen prohibides.» `requires_human_decision: true`.

### B7 · Sense runbook de mòdul nou

- **Evidència.** `grep` de «nou mòdul», «nova secció», «afegir un bloc» a wiki i `.agents/` → zero. Afegir una pàgina = `config/sections.js` + `App.jsx` (lazy i `<Route>`) + `config/navigation.js` + `modules.css` + `registre.js` + manifest SEO. L'únic exemplar complet (`sections/notes/`) toca quatre fitxers fora de la seua carpeta.
- **Causa arrel.** El coneixement està a les portes (que ho rebutgen) i no en un procediment (que ho guie). Portes sense runbook = aprendre a colps.
- **Proposta.** Skill `sdp-nou-modul` amb la llista ordenada: migració → RLS → adaptador a `data/supabase/` → capacitat al contracte + port → context → secció → rutes (4 fitxers) → classes a `modules.css` → `registre.js` + espècimen → test (`NotesDataContext.test.jsx` com a patró) → `npm run porta`. I un bastidor `node tooling/scripts/nou-modul.mjs <nom>` que cree els esquelets. Cap decisió humana necessària.

## 4. Pregunta clau: per què la IAIA no va netejar l'escriptori si ho té a la skill

Diagnòstic mecànic, sense adjectius. Quatre causes, totes verificables:

1. **Quatre lleis, tres polítiques incompatibles.** `wiki-documentacio-i-reflex` §3: «moure tota la brossa a `90_arxiu_historic` abans d'iniciar el nou cicle». `wiki-cicle-de-vida` §6: «esborra sense pietat, no l'arxives enlloc». `AGENTS.md` §12: «no s'ha de buidar cegament». `QUI_SOC.md` §6: «prohibit esborrar sense preguntar». I les portes reforcen la paràlisi: `DESTINS_CANONICS.json` declara l'històric `READ-ONLY`, i `PROTOCOL_PETORRETA` P-10 prohibix escriure a `../_arxiu_wiki_de_poble`, on `somiador.mjs:11` escriu per disseny. Un model amb regles contradictòries tria l'acció que no viola cap: **no fer res.** L'oblit és racional.
2. **La regla no és a la finestra quan toca actuar.** `.agents/AGENTS.md:8`: les skills «no són memoritzables per defecte». El carregador (`matrix.mjs` + `preflight_matrix_wrapper.mjs`) només parla el protocol d'un arnés i cap configuració d'arnés l'invoca (`.claude/settings.json` no existix; `hooks.json` sense lector al repositori). A les 07:45 la skill era al disc, no al context.
3. **Cap tractor mesura l'edat de l'escriptori.** `obrir_torn.mjs`: pany + recompte de safata. `verificador-scc.mjs`: límit de safata + ancoratge. `porta-reflex.mjs`: només que existisca una cadena `reflex:` (l'esquema la declara `string`, no hash verificat; l'informe 0701 en portava `llegit`). `somiador.mjs` (creat hui a les 07:33): sense criteri d'edat i sense cap invocador (`grep -rn somiador` → només deute i este informe). **No hi ha cap sensor de «cicle anterior encara damunt la taula».**
4. **El canal que sí que arriba a tot arnés no ho diu.** `ON_ESTIC.md` §3 («Què has de fer ara?») té tres passos i cap és «dormir». És l'únic fitxer que `CLAUDE.md` garantix carregar; s'ha desaprofitat.

### El tractor: `porta:dormir` (tres punts d'aplicació, tots fail-closed)

**Definició mecànica de cicle** (sense criteri humà): un fitxer de l'escriptori pertany al cicle del seu segell `AAMMDD_HHMM`. El cicle viu és el del `prompt_*` més recent. Tot fitxer solt amb segell anterior al del prompt viu és **cicle anterior** i ha d'haver-se'n anat abans que nasca un prompt nou. Excepcions: índexs, `.ancora_sessio.json`, subcarpetes, i (esmena acceptada de Codex, §9.3) qualsevol fitxer amb `status: pendent` al frontmatter, que es conserva fins que algú el tanque explícitament. El predicat continua sent decidible sense humà.

1. **En escriure** (`tooling/gates/tractor-dormir.mjs --check --nou=<ruta>`): si la ruta nova és un `*_prompt_*.md` a l'escriptori i hi ha fitxers de cicle anterior, ix amb codi 2 i el missatge exacte: «Escriptori amb N fitxers del cicle AAMMDD_HHMM. Executa `npm run dormir` i torna-ho a intentar.» Cablejat a `.claude/settings.json` (PreToolUse sobre Write/Edit), a `.agents/hooks.json` (Antigravity) i com a primer pas de `porta-reflex.mjs`. Per a arnesos sense hooks, els punts 2 i 3.
2. **En despertar** (`despertar.mjs`): calcula l'edat de l'escriptori i escriu com a **primera línia** d'`ON_ESTIC.md` §3 la instrucció imperativa amb l'ordre exacta. Si hi ha més d'un cicle anterior, crea `.agents/SDP-LOCK` amb el motiu, i `obrir_torn.mjs` ja el fa complir. És l'únic conducte que arriba a qualsevol IA que carregue la constitució.
3. **En tancar** (`verificador-scc.mjs`): nou codi `ESCRIPTORI_STALE_CYCLE`, mateixa regla.

**`npm run dormir`** = `somiador.mjs` reescrit: criteri de cicle (no d'extensió ni de pes), destí únic `90_arxiu_historic/<AAMMDD>_Sessio_Tancada/` (mai `..`, per P-10), reescriptura del bloc «Arxivats» de `00_index_escriptori.md`, línia al LEDGER, `--dry-run` per defecte i `--escriu` per aplicar, i rebuig si algun fitxer que mou no està ancorat (perquè quedaria orfe a l'arxiu). Test amb tres fitxers de prova a `tests/tractor-dormir.test.mjs`.

**Reconciliació de lleis** (decisió humana): una sola frase a la constitució única: «L'escriptori conté només el cicle viu. `npm run dormir` arxiva els cicles anteriors a `90_arxiu_historic/`; l'esborrat físic és humà.» Les altres tres formulacions s'esborren. `requires_human_decision: true`.

Amb això, l'oblit deixa de ser possible: no perquè la IA recorde, sinó perquè el fitxer no es pot escriure.

## 5. Resposta a les tres preguntes del §3 del prompt

1. **Entendre-ho tot sense instruccions afegides?** Parcial. La banda de codi és exemplar: el catàleg viu de Pedra Seca (`registre.js` + 43 espècimens a `/disseny`), el contracte explícit, les portes amb codis (E1-E2, R1-R8, W1-W5, V1-V3, C1-C3) són documentació que es fa complir. La banda de Brain no: cinc constitucions, skills fora de context, cap runbook.
2. **Moure's sense bloquejar-se?** No. La cadena mor a la porta 3 i el tancament està en roig per deute d'altres. Hui, «no bloquejar-se» vol dir saltar-se les portes.
3. **Lliurar complet i net?** No garantit. Sense Supabase local la migració no es prova; sense lloc per al notificador la funcionalitat queda a mitges; i les portes que certificarien «net» no s'executen.

## 6. Pla ordenat, per retorn per hora invertida (sense executar)

1. **Dos arreglos de lint** (`NotesDataContext.jsx:458`, `porta-reflex.mjs:16`). Cinc minuts. Verificació: `npm run porta` passa de la porta 3. Cap decisió humana.
2. **Netejar els 23 roigs del tancament** (§B3). Una hora; 14 cauen amb una sola línia a `00_index_actuar.md`. Verificació: `npm run tancar` verd. `02_investigacio_ia/`, `prompt.md` i Plaquetes: decisió humana.
3. **`porta:dormir` + `npm run dormir`** (§4). Dues hores. Verificació: test amb fixtures + intent d'escriure un prompt amb escriptori brut → bloqueig.
4. **Constitució única a l'arrel** (§B1, ja P0-5 del 0701) + `.claude/settings.json` amb SessionStart que execute `despertar` i PreToolUse que execute `porta:dormir`. `requires_human_decision: true`.
5. **`run-portes.mjs` que executa totes les portes i resumix** (§B2), amb `turn_id` real al tancament (§B3).
6. **Skill `sdp-nou-modul` + bastidor** (§B7). Cap decisió humana.
7. **Contracte extensible per capacitats** (§B4) + `supabase/functions/` amb el notificador mock (§B5). `requires_human_decision: true`.
8. **Supabase local** (§B5): és un `npm install`. Decisió del Consell.
9. **Mode Sofà** a la constitució (§B6). `requires_human_decision: true`.

Els passos 1 a 3 es fan hui i ja canvien la nota de 3 a 5. Els passos 4 a 9 són el camí de 5 a 8. El 10 no existix: una IA que entra de zero sempre necessitarà que el que troba siga verd.

## 7. Refutacions i límits (el que no afirme)

- No he construït el Calendari. El §2 és una simulació sobre evidència, no un registre d'execució.
- L'arnés Antigravity podria llegir `.agents/hooks.json` fora del repositori. No es pot verificar des de l'arbre; dins de l'arbre, zero lectors.
- Les 45 portes posteriors al Linter podrien estar verdes. No ho sé, i eixe és el problema.
- Part de l'informe 0701 ha caducat en bé: els 17 `SKILL.md` ja tenen `name` = carpeta, `cataleg_skills.mjs --check` torna `problemes: []`, el router emet context i `despertar.mjs` ja no crida el Somiador ni filtra en majúscules. Mèrit de la IAIA MarIA d'este matí.
- El prompt 0745 s'ha escrit amb `prompt_consell.md` (extern, amb bundle) i porta un hash `reflex` verificable: el Reflex de plantilla ha funcionat. L'oblit del §4 és d'un altre mecanisme, el que este informe descriu.
- Error meu, exposat: la primera lectura del tancament va ser de la cua de l'eixida (cinc roigs). La segona, sencera, en dona 23. Les xifres del §B3 són les segones.

## 9. Reunió davall l'Olivera: contrast amb l'informe de Codex (07:55)

Codex ha deixat [[260921_0755_informe_autonomia_codex]] a la taula quatre minuts abans que jo acabara el meu. L'he llegit sencer després d'escriure el §1-§8, per no contaminar la meua cacera; este apartat és el contrast.

### 9.1 Convergència independent (dos auditors, la mateixa arrel)

- `AGENTS.md` absent a l'arrel i arrancada no portable (el seu P1-1, la meua B1).
- La causa de l'oblit: Codex diu «la skill és una instrucció recuperable, no una precondició del sistema»; jo dic «la regla no és a la finestra quan toca actuar» (§4.2). Mateixa causa, dos vocabularis. Cap dels dos la considera una falla de voluntat.
- Somiador sense estat de tancament, arxiu extern prohibit, mai executat sobre l'escriptori real.
- Sense Supabase local; RLS per expressions regulars, no contra PostgreSQL; cap SMS ni cua persistent.
- 22 orfes + 1 estil en línia al tancament.

### 9.2 Troballes de Codex que jo no tenia, verificades ara (cinc de cinc CONFIRMADES)

1. `reflex_petorreta.mjs doctor --ci` → exit 1: `AGENTS.md` arrel absent, baseline del corpus divergent (`4e0b7ddf…` esperat, `fa5e4cc9…` actual), 24 fitxers del corpus estable no versionats. La cadena de portes mai hi arriba (mor a la 3), per això no ho tenia.
2. `verificador-scc.mjs:13-14` usa `04_ESCRIPTORI` en majúscules. A macOS funciona perquè el sistema de fitxers és insensible; a Linux saltaria les comprovacions de safata i d'ancoratge en silenci. Per a un Consell amb IAs en contenidors Linux, açò és un fals verd portàtil.
3. `auditoria_canonica.md:50` cita `npm run porta:esquemes`; `package.json` no el té. La plantilla que este informe ha seguit conté una ordre morta.
4. `BOOTSTRAP.md:21` i `sdp-workflow/SKILL.md:30` citen `.agents/skills/pedra-seca/SKILL.md`; la carpeta és `sdp-pedra-seca`. Dos punts d'entrada envien la IA nova a una ruta inexistent.
5. L'espec agrícola (`sdp-calendari-agricola`, 33 línies) no concreta comarca, varietat, sembra o trasplantament, origen de les dates, fus horari ni recurrència. **És la barrera que jo vaig infravalorar:** sense una font agronòmica validada, l'autonomia produïx una demo amb dates inventades. Ho incorpore com a B8, amb decisió humana obligatòria sobre la font i el territori.

### 9.3 On discrepe, i què accepte

- **«No hi ha percentatge honest sense la prova».** Mantinc la rúbrica del §8 com a rúbrica declarada, no com a telemetria: servix per mesurar el torn 2 contra el torn 1. Codex té raó que l'única prova real és repetir el recorregut des de zero amb un altre model (el seu pas 5); afegisc eixe pas al pla com a criteri de tancament.
- **El tractor.** El de Codex (obrir cicle → pla d'higiene amb hashes → aplicar amb lease, preimatges i bloqueig de concurrència → rebut amb digest) és el disseny correcte a llarg termini. El risc és el mateix que el del dimoni del Reflex: que no s'envie mai. El meu `porta:dormir` és el predicat mínim cablejable hui. Síntesi proposada: enviar el predicat esta setmana i fer-lo créixer cap al seu cicle, sense esperar-lo.
- **Acceptat:** «antiguitat i nom no basten». He esmenat el §4: `status: pendent` conserva el fitxer. El predicat continua sent mecànic.
- **Acceptat:** el criteri d'èxit és «absència de residus tancats sense processar», no «escriptori buit». El meu §4 ja ho deia; ho subscric amb les seues paraules.

### 9.4 Troballa nova d'este contrast: el Sistema Immunitari diagnostica i no cura

Detallada al §B3. Cap dels dos informes previs la tenia: el `launchd` executa `plaquetes.mjs diagnostic --autonom` cada hora, el mode `aplica` no el crida ningú, i el registre proclama «Mode Autònom Activat» mentre genera la dotzena recepta idèntica del dia. Per a la pregunta del prompt («què falla en el sistema de tractors mecànics que permet aquests oblits»), és la resposta més literal: **hi ha tractors que fan soroll de tractor sense llaurar.**

### 9.5 Concurrència durant la sessió

Codex i jo hem escrit a la mateixa taula amb quatre minuts de diferència. El seu informe va quedar ancorat a `00_index_escriptori.md` sota «Eines i Scripts Temporals»; l'he mogut a «Documents Actius» en ancorar el meu. Cap altre fitxer fora de l'escriptori ha canviat durant l'auditoria (verificat amb `find -mmin`).

## 8. Nota i rúbrica

| Àmbit | Nota | Motiu en una línia |
| --- | --- | --- |
| Codi (`src/`, contracte, Pedra Seca, portes UI) | 7/10 | Documentació que es fa complir; li falta extensió per domini i entorn local |
| Brain (`.agents/`, wiki, skills) | 3/10 | Cinc constitucions, skills fora de context, lleis contradictòries sobre l'escriptori |
| Conductes (portes, hooks, tancament, commit) | 2/10 | Cadena morta a la porta 3, tancament roig per deute aliè, hooks sense lector |
| **Plug & Play global** | **3/10** | Una IA nova pot escriure codi raonable; no pot demostrar que és net ni tancar el torn |

**B8 (afegida després del contrast amb Codex, §9.2.5):** l'espec agrícola no té font agronòmica ni territori. Sense això, cap IA pot lliurar dates de plantació que no siguen inventades. `requires_human_decision: true`.

**Per al torn 2 (Codex o MarIA):** refutar primer §4.2 (si algun arnés carrega les skills al context sense que jo ho veja) i §B4 (si hi ha un mecanisme d'extensió del contracte que no he trobat). Si cauen, la nota puja a 4. Criteri final de tancament, pres de Codex: repetir el recorregut del Calendari des d'un clon net amb un model diferent, sense explicacions afegides, i comptar intervencions humanes.

---
**Ancoratge de Seguretat:** [[00_INDEX_ESCRIPTORI]]
