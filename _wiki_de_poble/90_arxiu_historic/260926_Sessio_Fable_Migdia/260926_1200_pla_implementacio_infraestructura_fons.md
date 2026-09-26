---
type: document
status: esborrany
description: 'Diagnosi i pla de reparació de la infraestructura de fons que pinta el Calendari de la Consola: reflex_daemon, Time Machine, subtasques de Plaquetes, hooks de git, hooks d''Antigravity i avisos de skills.'
tags:
  - implementacio
visibility: private
reflex: sdp:torn_a2db8978-9b8b-4c83-b100-078d5165dcb9:2fcf1a06-8de0-4660-8807-9fe1c592c631
---
# Infraestructura de fons: launchd, Plaquetes, hooks de git i avisos del Mapa

**Estat del Pla:** en elaboració (la part de `src/` i Wiki ja està aplicada; launchd, `.agents/` i `tooling/` esperen el Mestre o un executor amb lease)

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_a2db8978-9b8b-4c83-b100-078d5165dcb9:2fcf1a06-8de0-4660-8807-9fe1c592c631 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-26T09:53:42.314Z |
| Modificació | 2026-09-26T10:05:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Claude Fable 5.1 (claude-fable-5-1), Claude Code (app d'escriptori) |
| Tokens consumits | fil principal no mesurat (sense telemetria); subagent Explore de cerca del reflex daemon: 436.353 tokens, 80 crides |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 99b143078fb4534160d2f52deaf0ff9ef1d64ad9d4472c1665f46fe82b894bd1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

2026-09-26T09:53:42.314Z: esborrany creat; contingut i verificació pendents.

2026-09-26 (torn torn_a2db8978, Claude Fable): diagnosi dels quatre punts del Mestre (reflex_daemon, Time Machine, subtasques de Plaquetes, hooks de git) i dels quatre de l'auditoria d'urgència de la IAIA MarIA (vigilants-vius 1/3, frescor 2653 min, hooks d'Antigravity sense consumidor, avisos de skills). Aplicat el que és de `src/` i Wiki; la resta, en quarantena a `02_investigacio_ia/260926_1200_infraestructura_fons/` i com a runbook ací.

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes (Research)

Fonts llegides: el Mapa viu (`http://localhost:3340/__iaia/mapa.json`, dev server del Mestre), `tooling/brain/mapa-consola.mjs`, `src/sections/consola/mapa/construeixMapa.js`, `.agents/cron/registre_tasques.json`, `~/Library/LaunchAgents/com.socdepoble.reflex_daemon.plist` i `org.socdepoble.plaquetes.plist`, `/tmp/reflex_daemon.log`, `.immunitari/cron.err`, `.git/config`, `.husky/pre-commit`, `.husky/post-commit`, `.husky/_/`, `tooling/brain/time-machine.mjs`, `.agents/hooks.json`, `.agents/skills_index.json` i els quatre SKILL.md amb avís. Estat observat al Mapa abans de tocar res: `higiene-basica`, `adopta-orfes`, `lapida-fantasmes`, `quarantena-brossa`, `refresc-tokens` i `time-machine` **declarats sense llançador**; `frontissa-contingut` i `porta-taxonomia` **desconeguts**; `reflex-daemon` **mort**; `plaquetes-diagnostic` **viu**; vigilants-vius 1/3; frescor-instantània 2649 min.

| # | Símptoma a la Consola | Causa real | Què cal fer |
|---|---|---|---|
| 1 | `reflex-daemon` mort (tasca-morta, alta) | El plist té `KeepAlive` i apunta a `tooling/wiki/core/reflex_daemon.mjs`, que **no existix al repositori ni ha estat mai a l'índex de git** (cerca exhaustiva d'un subagent: cap fitxer del repositori diu què havia de fer; totes les mencions són posteriors a trobar-lo mort: ESTAT T16 del 260922, auditoria 260924_1317 T10, i el mateix registre, que el declara «perquè la Consola el pinte mort, no perquè funcione»; l'ESTAT de Codex del 25-09 ja diu «daemon retirat», però el plist va quedar). launchd el rellança sense parar: `/tmp/reflex_daemon.log` té més de 100.000 línies de `MODULE_NOT_FOUND`. | **No es pot «reiniciar»**: reiniciar un bucle és el bucle, i no hi ha res a reactivar. Cal descarregar-lo (`bootout`), apartar el plist i llevar-lo del registre. Si es vol un vigilant resident, el candidat que ja existix és `porta-plantilla-viva.mjs --vigila` (pregunta oberta 1). |
| 2 | `time-machine` declarat sense llançador; frescor 2649–2653 min | El registre declara `org.socdepoble.time-machine` però **no hi ha cap plist instal·lat** a `~/Library/LaunchAgents/`. L'script sí que existix i sap generar el seu plist (`--llancador`, interval 1800 s, `RunAtLoad`). L'última instantània és del 24-09, quan es va executar a mà. | Generar el plist amb `--llancador` i carregar-lo amb `bootstrap` (runbook §4.2). |
| 3 | Cinc tasques d'higiene «sense cadència declarada» i «sense llançador» | No són processos independents: són les cinc **subtasques** que `scripts/immunitari/plaquetes.mjs diagnostic --autonom` executa cada hora dins de `org.socdepoble.plaquetes` (viu). El registre no ho declarava i el compilador no tenia manera d'expressar-ho. | Cap cron ni launchd nou: seria duplicar la maquinària. Llançador nou `tasca` al compilador (aplicat) + registre que el declare (quarantena). |
| 4 | `frontissa-contingut` i `porta-taxonomia` desconeguts; «estan a `.git/hooks`?» | Els hooks de git **no viuen a `.git/hooks`**: `git config core.hooksPath` = `.husky/_` i Husky encadena a `.husky/pre-commit`, que crida `frontissa-contingut.mjs`, `porta-taxonomia.mjs --staged`, `porta-plantilla-viva.mjs --staged` i `git-staged.mjs`; `.husky/post-commit` crida `reflex_petorreta.mjs consume-commit`. Els shims `.husky/_/pre-commit`, `post-commit` i `h` hi són. Estan correctament instal·lats. El compilador els pintava desconeguts perquè no llegia els hooks. | Res a instal·lar. El compilador jutja ara les tasques `git-hook` pel text del hook (aplicat a `src/`, closca en quarantena). Declarar també les altres tres portes del pre-commit i el post-commit (registre en quarantena). |
| 5 | `hook:antigravity:PreToolUse` i `PostToolUse` «sense consumidor» | No és una ruta trencada: els dos scripts (`tooling/gates/hooks-local.mjs`, `tooling/gates/segell-auto.mjs`) existixen i el Mapa emetria `script-absent` si no. L'avís `hook-sense-consumidor` l'emet el compilador **per a tot hook de `.agents/hooks.json` per disseny** (`consumidor_acreditat: false`), i el mateix fitxer ho declara: «consumidor Antigravity no acreditat. Cap garantia d'activació». | No es «repara» tocant rutes. Es tanca amb evidència que Antigravity executa els hooks (pregunta oberta 2) o s'accepta l'avís com a recordatori honest. |
| 6 | `crida-inexistent` a `core-restauracio-segellada` i `sdp-universal-page` | No és el frontmatter: és la **prosa**. `mencionsDeSkills` busca tokens `core-*`, `sdp-*`, `wiki-*`. A `sdp-universal-page` són tres classes CSS (`sdp-badge-system`, `-category`, `-tag`); a `core-restauracio-segellada` són tres skills absorbides el 260831 citades en la nota de fusió. | Classes escrites com a selector (`.sdp-badge-…`), nota de fusió davall de `## Historial`, i el detector ignora l'Historial (pegat i closca en quarantena). |
| 7 | `disparador-ample` a `core-context-panic` i `sdp-pedra-seca` | «error» és paraula comuna; «css» i «ui» tenen menys de 4 lletres. El router compara per subcadena. | `bucle d'errors`, `estils css`, `interfície` a l'índex i al frontmatter (pegat en quarantena). |
| 8 | (trobat de pas) el detector d'error del registre | `mapa-consola.mjs` només mirava **l'última línia** del stderr. Un bucle de KeepAlive acaba amb «Node.js v24.13.0» i passaria per viu; i mirar més línies sense data hauria matat Plaquetes per un error de fa dies a `cron.err`. | Cua de 30 línies i només si el registre d'errors és tan recent com el d'eixida (closca en quarantena, amb prova). |

Amb tot aplicat, el Calendari ha de quedar: cinc subtasques vives «cada hora · en arrencar», `time-machine` viu, `reflex-daemon` desaparegut, sis tasques `git-hook` vives, vigilants-vius **2/2**.

### 2. Preguntes Obertes (User Review Required)

1. **Reflex daemon.** Recomane desinstal·lar-lo: mai ha existit l'script, i un resident amb `KeepAlive` que no sap què vigilar és un forat de CPU i de registre. Si el Mestre vol un vigilant resident, l'únic que ja existix al repositori és `tooling/gates/porta-plantilla-viva.mjs --vigila` (un `fs.watch` sobre l'Escriptori que valida prompts i plans contra la plantilla viva i posa en quarantena el que falla; té `--llancador`, que imprimix el plist `org.socdepoble.plantilla-viva` amb `RunAtLoad` i `KeepAlive`). És el pas B.10 del pla 0130 i s'instal·la igual que Time Machine (§4.2, canviant l'script i l'etiqueta). Qualsevol altre daemon necessita dir **què** vigila i un pla propi.
2. **Hooks d'Antigravity.** Per a acreditar el consumidor cal una evidència que no siga prosa: per exemple, que `hooks-local.mjs` escriga un rebut (`.agents/runtime/…`) quan l'invoca Antigravity (els `toolNames` de `.agents/hooks.json` són els d'Antigravity: `write_to_file`, `run_command`), i que el compilador marque `consumidor_acreditat: true` només si eixe rebut és recent. És un canvi de `tooling/` i de doctrina; sense ordre, l'avís es queda perquè diu la veritat.
3. **Tres portes més al registre.** He declarat `porta-plantilla-viva`, `git-staged` i `reflex-consume-commit` perquè el Calendari veja la cadena sencera. Si el Mestre prefereix declarar només el que ell ha nomenat, es lleven del JSON de quarantena.

### 3. Canvis Proposats (Proposed Changes)

**Aplicats en este torn (fora de la zona protegida):**

### [MODIFY] `src/sections/consola/mapa/construeixMapa.js`
Llançador `tasca` (`{ tipus: 'tasca', tasca: '<id de la mare>' }`): la subtasca hereta l'estat de la mare i, si no en declara, la cadència; mare absent o cicle (`a→b→a`, `a→a`) = `declarat-sense-llancador`, sense penjar el compilador. Aresta `tasca:mare → tasca:filla` (`dispara`, `declarat`). Tasques `git-hook`/`hook`: si `fonts.hooksGit[esdeveniment]` és text, viu quan cita `t.script`, mort quan no; sense font, desconegut. Node `hook:git:<esdeveniment>` (font `.husky/<esdeveniment>`, `consumidor_acreditat: true`) i aresta `dispara` derivada cap a la tasca viva. L'avís `tasca-morta` cita el hook com a evidència.

### [MODIFY] `src/sections/consola/mapa/mapaContent.js`
`textLlancador` mostra també la tasca mare (`tasca · plaquetes-diagnostic`).

### [MODIFY] `src/sections/consola/mapa/construeixMapa.test.js`
Tres proves noves: herència d'estat i cadència de la subtasca (i vigilants-vius no la compta), mare absent i cicles, judici de `git-hook` amb i sense font.

### [MODIFY] `_wiki_de_poble/02_saber/03_consola_termodinamica/02_calendari.md` i `04_contracte_de_dades.md`
Tipus `tasca` al model de dades, regla de les subtasques, regla del judici dels hooks de git (i on viuen: `.husky/`, activats per `core.hooksPath`), font `.husky/<esdeveniment>` a la taula del compilador.

**En quarantena a `02_investigacio_ia/260926_1200_infraestructura_fons/` (zona protegida pel hook: executor amb lease o Mestre):**

### [MODIFY] `tooling/brain/mapa-consola.mjs` ← `mapa_consola.mjs`
`hooksGit(arrel)`: llig `.husky/{pre-commit,commit-msg,post-commit,pre-push}` i `git config core.hooksPath`; si no apunta a `.husky/_` passa el hook buit (git no l'executa) i afig `.husky/_` a `absents`. `errorRecent()`: cua de 30 línies i mtime del registre d'errors ≥ mtime del d'eixida. `mencionsDeSkills()` ignora `## Historial`.

### [MODIFY] `tests/mapa-consola.test.mjs` ← `mapa_consola_test.mjs`
Proves de `errorRecent`, `hooksGit` (amb `git init` i `core.hooksPath`) i mencions fora de l'Historial. `node --test tests/mapa-consola.test.mjs`.

### [MODIFY] `.agents/cron/registre_tasques.json` ← `registre_tasques.json`
Cinc subtasques amb `llancador: { tipus: 'tasca', tasca: 'plaquetes-diagnostic' }`; entrada `reflex-daemon` eliminada (aplicar després del bootout, si no el Mapa pintarà «llançador sense declaració»); `porta-plantilla-viva`, `git-staged` i `reflex-consume-commit` declarats com a `git-hook`.

### [MODIFY] `.agents/skills_index.json` i quatre `SKILL.md` ← `metadades_skills.patch.txt`
Disparadors i mencions (files 6 i 7 de la taula). Resegellar `.agents/SKILLS_SEAL.json` després.

### [DELETE] `~/Library/LaunchAgents/com.socdepoble.reflex_daemon.plist` · [NEW] `~/Library/LaunchAgents/org.socdepoble.time-machine.plist`
Runbook del Mestre (§4). Cap fitxer de `~/Library` entra al repositori.

### 4. Runbook del Mestre (launchd, un terminal, en este ordre)

Ho ha d'executar el Mestre: el hook local bloqueja `launchctl`, `ls`, `git status` i tota escriptura a `~/Library` i `.agents/` per a l'agent, i la doctrina (02_calendari) diu que els plist són acció humana. Totes les ordres són del domini d'usuari (`gui/$(id -u)`), cap toca el sistema.

**§4.1 Parar el bucle del reflex daemon** (reversible: el plist es guarda amb un altre nom, launchd no llig res que no acabe en `.plist`).

```bash
launchctl bootout gui/$(id -u)/com.socdepoble.reflex_daemon
```

```bash
mv ~/Library/LaunchAgents/com.socdepoble.reflex_daemon.plist ~/Library/LaunchAgents/com.socdepoble.reflex_daemon.plist.desactivat
```

```bash
rm /tmp/reflex_daemon.log
```

Comprovació: `launchctl print gui/$(id -u)/com.socdepoble.reflex_daemon` ha de dir «Could not find service».

**§4.2 Instal·lar Time Machine** (el plist s'imprimix des del repositori amb les rutes d'esta màquina: usuari, node i registre a `~/Library/Logs/socdepoble-time-machine.log`).

```bash
node tooling/brain/time-machine.mjs --llancador > ~/Library/LaunchAgents/org.socdepoble.time-machine.plist
```

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/org.socdepoble.time-machine.plist
```

`RunAtLoad` fa la primera instantània a l'instant. Comprovació:

```bash
node tooling/brain/time-machine.mjs --llista
```

Ha d'eixir una instantània d'ara mateix a `refs/time-machine/backup-notes-publish`. Si el Mestre executa les ordres amb un `node` d'nvm, el plist porta eixe `node`: és el que toca, launchd no llig el `.zshrc`.

**§4.2b (opcional, B.10 del pla 0130) Vigilant de la plantilla viva**, el resident que sí que té script:

```bash
node tooling/gates/porta-plantilla-viva.mjs --llancador > ~/Library/LaunchAgents/org.socdepoble.plantilla-viva.plist
```

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/org.socdepoble.plantilla-viva.plist
```

Si s'instal·la, cal afegir-lo al registre (`llancador: launchd`, etiqueta `org.socdepoble.plantilla-viva`, `cadencia: { permanent: true }`, script `tooling/gates/porta-plantilla-viva.mjs`); si no, la Consola el pintarà «llançador sense declaració».

**§4.3 Aplicar la quarantena** (executor amb lease, o a mà): `mapa_consola.mjs`, `mapa_consola_test.mjs`, `registre_tasques.json`, `metadades_skills.patch.txt`, en este ordre, i resegellar les skills. Després, reiniciar el dev server (el middleware importa `tooling/brain/mapa-consola.mjs` una sola vegada per procés).

**§4.4 Hooks de git**: res a instal·lar. Comprovació:

```bash
git config core.hooksPath
```

Ha de dir `.husky/_`. Copiar els scripts a `.git/hooks/` no serviria de res mentre `core.hooksPath` estiga definit, i llevar-lo desactivaria Husky sencer.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

**Fet en este torn:**

- `npx vitest run src/sections/consola/mapa/construeixMapa.test.js`: 24/24 verdes (21 anteriors + 3 noves).
- Mapa viu llegit al navegador abans dels canvis (`/__iaia/mapa.json`): els estats de la taula §1 són els observats, no deduïts.
- Existència comprovada amb lectura directa: `.husky/pre-commit`, `.husky/post-commit`, `.husky/_/pre-commit`, `.husky/_/post-commit`, `.husky/_/h`, `.git/config` (`hooksPath = .husky/_`), `tooling/gates/frontissa-contingut.mjs`, `porta-taxonomia.mjs`, `porta-plantilla-viva.mjs`, `git-staged.mjs`, `tooling/wiki/reflex_petorreta.mjs`, `tooling/gates/hooks-local.mjs`, `segell-auto.mjs`. Absent: `tooling/wiki/core/reflex_daemon.mjs`, `~/Library/LaunchAgents/org.socdepoble.time-machine.plist`.
- `npx vitest run src/sections/consola`: `construeixMapa` i la resta del Mapa verdes; **7 proves de `ConsolaSection.test.jsx` roges** (boina de la targeta «Sóc de Poble» en lloc de «Consola Termodinàmica», i una etiqueta «Font: Font: el Mapa del Mas:?» repetida). No toquen cap fitxer d'este torn: són de `TargetaConsola`/`UniversalCard`, que algú altre té modificats a l'arbre (l'índex de l'Escriptori també ha canviat davall meu mentre l'editava). Ho deixe anotat per al torn que els tinga en curs.

**Pendent (no executable per l'agent):**

- `node --test tests/mapa-consola.test.mjs` amb la closca de quarantena instal·lada.
- `node tooling/brain/mapa-consola.mjs` després d'aplicar el registre: cap avís `tasca-sense-llancador`, cap `tasca-morta`, vigilants-vius 2/2.
- Navegador: `/consola/calendari` amb les cinc subtasques a «Diàries» (cada hora) i `time-machine` viu; `/consola/avisos` sense `crida-inexistent` ni `disparador-ample`.
- `launchctl print gui/$(id -u)/org.socdepoble.time-machine` i `--llista` amb una instantània fresca; frescor-instantània per davall de 60 min al Mapa.
- Lint, build, cadena de portes i `tancament.mjs --check`: bloquejats pel hook per a l'agent.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Ordre d'aplicació.** Si el registre de quarantena (sense `reflex-daemon`) s'aplica abans del `bootout`, el Mapa pinta «llançador sense declaració» amb avís mitjà: és correcte, però sorollós. Primer §4.1, després §4.3.
- **`bootout` amb el daemon en bucle.** launchd pot tardar uns segons a matar l'últim rellançament; si `print` encara el troba, repetir el `bootout` una vegada. No cal `kill` a mà.
- **Plist de Time Machine amb rutes de màquina.** Porta el `node` i l'arrel absoluta d'esta màquina; si es mou el repositori o es canvia de node, cal regenerar-lo. Per això no entra al repositori.
- **Time Machine i secrets.** L'script avorta (exit 2) si troba fitxers nous amb nom de secret; el registre ho dirà i el Mapa pintarà la frescor com a estancada. És el comportament desitjat, no una fallada.
- **Subtasques sense observació pròpia.** Una subtasca hereta l'estat de la mare: si Plaquetes viu però una subtasca falla dins del diagnòstic, el Mapa no ho veu. La font per a afinar-ho és `.immunitari/receptes/` (pendent, fora d'este pla).
- **Detector d'error per mtime.** Si un plist envia stdout i stderr al mateix fitxer, mana la cua de 30 línies: un procés viu que escriu un `Error:` informatiu al final es pintaria mort. Cap plist actual ho fa (Plaquetes separa `cron.out`/`cron.err`; Time Machine unifica però no escriu «Error:» en èxit).
- **Segell de skills.** Els pegats de `metadades_skills.patch.txt` canvien bytes de quatre SKILL.md: sense resegellar, el Mapa canviarà un avís (`crida-inexistent`) per un altre (`segell-divergent`).
- **Arbre concurrent.** Hi ha altres agents editant (índex de l'Escriptori canviat mentre l'editava; 7 proves de `ConsolaSection` roges alienes a este torn). Abans de commit, tornar a passar `npx vitest run src/sections/consola`.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260926_0130_pla_implementacio_auditoria_extrema]]
- [[260926_1130_auditoria_execucio_fable_fase2]]
- [[../02_saber/03_consola_termodinamica/02_calendari]]
- [[../02_saber/03_consola_termodinamica/04_contracte_de_dades]]
