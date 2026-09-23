---
type: informe
status: esborrany
description: 'Auditoria reproduïble B4–B6: cobertura d’agents, segellat, Husky i falsos positius SCC, sense implementar codi.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_0f269aa7-badc-46a5-903b-b2f468b5814e:1f18d2c8-aeb4-4a80-9d8f-04c9f1444904
---
# Auditoria Codex: Brain, SCC, segells i hooks

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-AUDITORIA-CODEX-260923-1943 |
| Versió | 1.0.0 |
| Entorn | entorn-dev-local, macOS, Europe/Madrid |
| Creació | 2026-09-23 19:43 +02:00 |
| Modificació | 2026-09-23 19:49:45 +02:00 |
| Propietari | Codex |
| Aprovació humana | Auditoria autoritzada pel prompt; implementació AFK fins al consens |
| Plantilla | auditoria_canonica.md, ruta auditoria v2.0.0 |
| Rebut | sdp:torn_0f269aa7-badc-46a5-903b-b2f468b5814e:1f18d2c8-aeb4-4a80-9d8f-04c9f1444904 |
| Tall d’evidència | HEAD f03affcb33121e024f508a35ec6a50816311d731 + arbre de treball, 19:42–19:48 |
| Model IA | GPT-6; variant exacta no exposada en esta sessió |
| Tokens consumits | Estimació: 45.000–65.000 tokens de context i generació; mesurament real no disponible |
| requires_human_decision | false per a lliurar l’auditoria; execució subjecta al consens establit pel prompt |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Llegits íntegrament AGENTS.md, Genotip, índex mestre, Bootstrap, les skills sdp-workflow i wiki-documentacio-i-reflex, el protocol executable i la plantilla prompt_local.md. Consultat ESTAT_ACTUAL i llegit el pla compartit de les 19:30. La ruta auditoria s’ha resolt amb document.mjs context; create ha generat el rebut i l’àncora. SHA-256 de la plantilla entregada: ea0659ead41a021d4fe12161de73cf5a54deb1e40541a888ec7764a550f4b90d.

Abast: hooks de les aplicacions, Husky/Git, segell de skills, SCC i frontera del circuit documental. Cap font executable, configuració de hooks, skill, fitxer humà o segell del repositori s’ha modificat en este torn. Les reproduccions mutadores s’han executat exclusivament en temporals privats i s’han eliminat al final. Les excepcions documentals són esta entrega, la seua àncora, el rebut i el relleu operatiu.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 260923_1943: auditoria B4–B6 amb contrast del codi viu i fixtures temporals.
- Esmena al relleu de Claude de les 18:52: draft() ja inclou Model IA i Tokens consumits; les 73 proves seleccionades passen. SCC ja usa split('\n') per al número de línia. No perpetue aquelles fallades com si continuaren presents.
- Al tall inicial no hi havia cap auditoria de Claude a l’escriptori actiu, només el pla i els dos prompts de les 19:30. Les auditories traslladades a l’arxiu no s’han carregat; el contrast històric és amb ESTAT_ACTUAL i amb el codi, no una atribució de lectura dels originals.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Dictamen

**La cadena no és contínua ni acredita l’origen de totes les mutacions.** Hi ha controls documentals útils i provats, però validar un document, observar una eina i autoritzar un canvi de governança són tres garanties diferents. SCC és un auditor de graf i estil, no un segell criptogràfic. SKILLS_SEAL és un checksum agregat de Markdown; un rebut documental acredita contracte i entrega; la lease Reflex limita operacions protegides. No són intercanviables.

Prioritat P1 significa una fissura que cal corregir abans d’afirmar protecció integral; no afirme cap atac ni pèrdua de dades. P2 és coherència, diagnòstic o reducció de bloquejos incorrectes.

### C1 · P1 · El resegellat legitima canvis que no corresponen a l’eina observada

**Font:** tooling/gates/segell-auto.mjs:48–60 i tooling/gates/segella.mjs:54–82. Conflicte amb Protocol P-06/P-07 i el criteri zero trust del prompt.

resegellaSiCal rep una sola ruta, però verificaSegell(update:true) recalcula i accepta TOTES les skills. No conserva estat previ per operació, no compara el conjunt canviat amb el conjunt autoritzat, no exigix lease, ni comprova session_id, tool_use_id o resultat de l’eina. El transcript no està vinculat al nou hash. La crida directa també accepta una ruta declarada sense demostrar que l’eina l’haja escrita.

**Reproducció:** fixture amb A0 i B0 segellats; canvi B fora de l’operació; canvi A atribuït a l’eina; resegellaSiCal(A). Abans: ok=false. Després: ok=true. L’única línia de traça nomena A, però el hash inclou el canvi alié de B.

**Proposta:** segell previ vàlid, manifest per fitxer i autorització limitada abans d’escriure; comparar després el conjunt exacte de canvis. Un canvi preexistent o alié invalida l’operació i mai provoca resegellat automàtic. Recuperar el segell real actual exigix revisar el diff existent, no executar --update a cegues.

### C2 · P1 · El segell es publica abans de garantir el rastre

**Font:** segell-auto.mjs:53–59, 64–82; segella.mjs:76. Conflicte amb el requisit de rastre i P-07.

El codi escriu SKILLS_SEAL.json abans d’appendFileSync(segell.log). Si la traça falla, el catch només avisa i la CLI ix 0. Tampoc hi ha lock, comparació CAS ni transacció entre l’estat anterior, el checksum i el registre; l’append local no té protecció d’immutabilitat contra qui pot editar-lo.

**Reproducció:** en fixture, substituïsc segell.log per un directori i altere A. La CLI informa EISDIR, retorna 0 i deixa verificaSegell().ok=true. És una actualització sense la nova traça requerida.

**Proposta:** registre transaccional amb id d’operació, estat preparat, hashes abans/després i resultat; lock i CAS; publicar una generació de segell només quan el registre durable ho acredita. Si el procés cau o falta confirmació, la generació queda no acceptada i el supervisor bloqueja noves mutacions. No basta canviar exit 0 a exit 2 després d’haver escrit: el PostToolUse arriba després de l’efecte. Cap restauració cega sobre canvis concurrents.

### C3 · P1 · El hook comú protegix documents Markdown, no totes les escriptures

**Font:** hooks-local.mjs:65–85; documental/core.mjs:38–45; porta-reflex.mjs:23–24; porta-olivera.mjs:147–160. Conflicte amb AGENTS §12, Protocol P-02/P-06 i l’abast anunciat.

protectedPath només retorna cert per Markdown dins de l’escriptori. Per això Write sobre .agents/skills/.../SKILL.md passa sense validar una lease; també passa Write sobre 01_produccio/demo.html. La guarda de zona humana queda darrere del filtre d’extensió. El tancament pot detectar canvis humans després, però no evita l’escriptura.

Per Bash només es crida Olivera, que reconeix un subconjunt de redireccions cap a prompts; no és un analitzador dels efectes de shell. Un node -e que escriuria una auditoria invàlida obté code:0. Els noms d’eina desconeguts també passen. Reproduït sense executar les escriptures: Bash, un MCP d’escriptura, Write d’una skill i Write d’un HTML humà → 0. El cas sintètic exec_command també passa; **Codex normalitza la shell a Bash**, de manera que el cas Bash és l’evidència rellevant de l’adaptador real.

**Proposta:** separar contracte documental de permisos de mutació. Protegir les rutes humanes abans de filtrar extensions; classificar tota eina com lectura verificada, mutador conegut o opaca. Les opaques no poden escriure fonts protegides fora d’un executor amb permisos limitats. Evitar una denylist de regex sobre Bash: Python, Node, subshells, scripts i sessions interactives la fan incompleta.

### C4 · P1 · Configuració present no equival a activació en cada aplicació

| Aplicació | Configuració local observada | Cobertura demostrada | Falta acreditar |
| --- | --- | --- | --- |
| Claude Code | .claude/settings.json | SessionStart; PreToolUse comú; Reflex/Olivera per Write/Edit; Olivera per Bash; PostToolUse de skills per Write/Edit/NotebookEdit | Execució real del client i el seu tractament d’errors; manca postvalidació de shell/MCP |
| Codex | .codex/hooks.json | SessionStart i PreToolUse comú; simulació de comanda i payload | Confiança/activació en esta sessió; no hi ha PostToolUse configurat |
| Antigravity / MarIA | .agents/hooks.json | JSON amb noms write_to_file/replace_file_content/run_command | No he trobat cap consumidor executable al repositori; falta prova del client i contracte d’eixida |

Les proves de hooks-local llancen /bin/sh amb la comanda configurada: demostren el script i el payload, **no que l’aplicació els carregue**. No afirme que Antigravity no tinga cap mecanisme extern; el repositori no l’acredita. Afegir segell-auto a Codex sense adaptar apply_patch tampoc basta: el lector actual espera file_path/notebook_path/TargetFile, no un pegat multifitxer.

La documentació de Codex exigix confiança del hook, indica execució concurrent dels handlers i normalitza exec_command a Bash. write_stdin no repetix PreToolUse; els hooks tenen excepcions de cobertura. Per això cal un únic orquestrador quan hi ha dependències entre fases i restringir també les sessions interactives. [OpenAI, Hooks](https://learn.chatgpt.com/docs/hooks).

Claude documenta que el timeout d’un hook de comanda PreToolUse no bloqueja l’eina i que PostToolUse no desfà efectes. Les proves d’activació han d’incloure timeout, executable absent i payload il·legible, no només una denegació normal. [Claude Code, Hooks](https://code.claude.com/docs/en/hooks#timeouts).

### C5 · P1 · Quatre hooks Git inerts passen la seua validació textual

**Font:** .husky/post-commit, pre-merge-commit, pre-applypatch i post-applypatch; reflex_petorreta.mjs:80–87 i 1427–1440. Conflicte amb Protocol P-03/P-11.

Els quatre contenen únicament shebang i comentaris; executats amb sh retornen 0 i zero línies executables. Les regex REQUIRED_HOOKS casen precisament amb els comentaris consume-commit/pre-commit/post-commit. La comprovació d’eixos marcadors no detecta la inactivitat. Això no implica que doctor global siga verd: altres comprovacions poden fallar.

.husky/pre-commit sí que executa porta-documents --staged, tancar, gate, lint i tests. Però no fa la verificació/claim git-commit ni el consum posterior que descriu P-03. El doctor comprova existència i textos, no implementa eixa lease.

**Proposta:** triar explícitament si es conserva el protocol de lease Git i connectar-lo de principi a fi. Verificar els hooks amb operacions Git en repositoris temporals: cas autoritzat, cas denegat, consum, replay, merge i applypatch. Un marcador no és una prova funcional. No extrapolar d’un commit històric incorrecte si es va usar --no-verify o un altre mecanisme: no està demostrat en este torn.

### C6 · P1 · Husky i Reflex disputen hooksPath; validació mixta d’índex i disc

**Font:** git config --show-origin --get core.hooksPath → .git/config, .husky; node_modules/husky/index.js; package.json prepare; reflex_petorreta.mjs:1412–1425; .husky/pre-commit:4–18.

Husky 9 configura .husky/_ en prepare. initReflex configura .husky i doctor local exigix exactament .husky. Per tant una instal·lació normal i init alternen configuracions. .husky és un directori de hooks Git vàlid amb executables: **no significa que el pre-commit estiga desactivat**. Sí que omet el llançador h, la seua inicialització i HUSKY=0. No hi ha .husky/commit-msg versionat; apuntar a .husky/_ no inventarà la validació de missatges que falta. [Husky, diagnòstic](https://typicode.github.io/husky/troubleshoot.html), [Git, hooks](https://git-scm.com/docs/githooks).

porta-documents --staged usa contingut i rebuts de l’índex —les proves ho confirmen—, però tancar/gate executen SCC i el segell contra el worktree. Això contradiu P-09: les portes generals poden comprovar bytes diferents dels que es commitarien. La CI audita el checkout del commit; no he verificat regles remotes que n’exigisquen l’èxit abans de fusionar.

**Proposta:** una única instal·lació idempotent (recomanació: Husky 9, .husky/_, amb doctor coherent); validar l’arbre preparat en una materialització temporal immutable. Tornar a comprovar tree OID i HEAD abans d’acceptar. Evitar builds que modifiquen fonts des del hook. CI i protecció de branca han de ser obligatòries per cobrir vies que ometen hooks locals.

### C7 · P1 · SCC resol per nom base i pot acreditar una àncora inexistent

**Font:** verificador-scc.mjs:93–96, 137–148 i 162–164. Conflicte amb l’ancoratge real exigit per AGENTS §3/§12.

El graf elimina la ruta amb basename; l’ancoratge també. Amb fact.md a l’escriptori, un índex que conté [broken](wrong/fact.md) fa que SCC retorne valid:true encara que wrong/fact.md no existisca. Homònims en carpetes diferents també compartixen una única entrada del Map, amb risc d’atribució equivocada. És un **verd fals**, no una falsa alarma contra l’usuari.

SCC només inventaria .md; un HTML sense àncora en 01_produccio queda fora. Reproduït junt al cas anterior i obtinc zero errors. No he escrit res en la zona humana real.

**Proposta:** resoldre Markdown relatiu al document d’origen; wikilinks per ruta o nom únic; rebutjar ambigüitat, enllaços inexistents i eixides de l’arrel. Inventariar tots els tipus de fitxer subjectes a ancoratge sense llegir binaris. Compartir el resolutor entre SCC i la porta d’orfandat. Distingir errors per fitxer de fallades del propi auditor.

### C8 · P1 · SCC pot eixir 0 sense executar-se per un symlink

**Font:** verificador-scc.mjs:295–296; tancament.mjs:64 i porta-reflex.mjs:81 també mantenen guardes sense realpath. L’arbre actual incorpora esMain en altres entrades; la reparació és parcial.

Reproducció SCC: cree un symlink temporal a l’arrel i execute node <symlink>/tooling/gates/verificador-scc.mjs. Resultat: exit 0, stdout buit, stderr buit. L’import usa ruta real i argv usa l’àlies. La prova no acredita cap auditoria. El cas directe sobre el repositori real, en canvi, retorna 1 amb sis incidències.

Els catch que silencien errors de readdir/stat en SCC poden, a més, deixar una cobertura parcial sense explicitar-ho. L’absència d’un índex canònic sí que es detecta ara al graf: no la presente com un verd fals actual.

**Proposta:** propagar una guarda canònica provada; cada CLI ha de retornar un resultat estructurat amb nombre de fitxers i controls executats. Una cadena no pot acceptar èxit sense resultat. Afegir proves Linux, espais, symlinks i fallades d’I/O. Un fitxer absent i un permís denegat han de tindre diagnòstics diferents.

### C9 · P1 · La configuració Codex queda fora del snapshot de torn

**Font:** documental/turns.mjs:15–29; reflex_petorreta.mjs:89–129. Conflicte amb la garantia de detectar canvis de les mateixes proteccions.

inventory inclou .claude, .agents, .husky i .github, però no .codex. Reproducció en fixture: canviar .codex/hooks.json entre dos inventaris dona changes=[]; per tant el hash de tancament no cobrix eixa configuració. CRITICAL_SEED_PATHS tampoc declara SKILLS_SEAL.json ni les configuracions de hooks dels agents; que un fitxer estiga seguit per Git no substituïx incloure’l en el contracte crític.

**Proposta:** cens únic de superfícies de seguretat incloent .codex, .claude, .agents/hooks.json, segell, scripts i configuració efectiva. Els canvis al validador no poden certificar-se únicament amb la versió modificada: ancorar la política d’acceptació en un lloc amb permisos diferents o en CI protegida.

### Proposta per al pla compartit: cadena verificable B4–B6

1. **B4a, cens i activació.** Registrar aplicació/versió, arrel canònica, configuració efectiva, hash del codi de política i capacitats reals. Fer una prova innòcua de lectura, una escriptura permesa temporal i una denegada; repetir amb payload corrupte i timeout. Un host sense prova positiva queda habilitat només per lectura sobre la superfície protegida.
2. **B4b, arrencada i prompt.** Un launcher o supervisor comprova segell, polítiques i estat abans d’iniciar el client. UserPromptSubmit pot validar l’entrada de cada torn; SessionStart aporta context. La càrrega de .bashrc o .zshrc no cobrix GUI, shell no interactiva ni totes les peticions al model. Si es necessita controlar cada petició de xarxa, el punt d’execució ha de ser el client/proxy autoritzat, no un hook de shell. No es promet comprensió constitucional a partir d’un hash.
3. **B5, abans de l’efecte.** Un adaptador per host normalitza a una operació comuna: id, sessió, eina, rutes reals, hashes esperats, abast i autorització. Lectures conegudes lliures; escriptures documentals amb torn/rebut; governança i risc alt amb lease i claim. Eines opaques només en un entorn sense permís d’escriptura a fonts protegides, o a través de l’executor controlat. Una shell persistent manté el mateix confinament durant tota la sessió.
4. **B6, després de l’efecte.** segell-auto passa a ser comprovador d’una operació ja autoritzada, mai reparador indiscriminat. Estat proposat: preparat → executat → verificat → acceptat; qualsevol discrepància, error de registre o operació incompleta deixa el torn bloquejat per a noves mutacions. El registre conté totes les rutes canviades, incloses altes i baixes, hashes abans/després, identitat del claim i política. En Claude cal cobrir també les eines fallides; en Codex el post-hook rep també Bash amb eixida no-zero.
5. **SCC i tancament.** Separar integritat de la política, autorització, ancoratge i qualitat del codi en resultats explícits. Validació incremental ràpida abans/després de l’operació; validació completa en tancament i sobre arbre Git/CI. El deute preexistent s’informa separat del delta, però mai es presenta la superfície crítica com a verda.
6. **Git/CI.** Un únic hooksPath; prova funcional dels hooks; arbre preparat immutable; comprovacions obligatòries de CI sobre el commit. Rebut local i checksum no són una frontera contra un agent que pot modificar simultàniament política, clau i registre. Per a eixe model d’amenaça cal retirar-li eixos permisos i posar l’executor/registre fora del seu control.

L’ordre intern ha de ser seqüencial dins d’un orquestrador; no confiar en l’ordre de handlers d’un JSON. Mantindre un camí de recuperació de només lectura, un error amb causa i comanda de diagnòstic, i una reconciliació explícita limitada al diff autoritzat. Això reduïx bloquejos arbitraris sense convertir error en èxit.

**Alternatives descartades:** (a) resegellar en qualsevol PostToolUse: conserva C1 i C2; (b) executar totes les portes en cada Bash: augmenta latència i bloquejos per deute alié, i no conté escriptures fora de la shell. A sis mesos vista, un nucli de política, adaptadors menuts i fixtures compartides són més mantenibles que tres còpies de les regles.

### Criteris d’acceptació proposats

| Prova | Resultat exigible |
| --- | --- |
| Canvi alié preexistent + escriptura legítima | Denegació/reconciliació; cap resegellat global |
| Fallada de traça, crash o concurrència | Cap generació acceptada sense prova completa; recuperació CAS |
| Write/Edit/apply_patch/Bash/MCP i shell interactiva | Mateixa política per rutes; opacs confinats |
| HTML o binari en 01_produccio | Protecció prèvia i ancoratge aplicable |
| Eina/host desconegut, timeout, hook absent | No obté capacitat de mutar la superfície protegida |
| Ancoratge amb ruta falsa o nom ambigu | Error explicat, mai resolució oportunista per basename |
| CLI per symlink i arrel amb espais | Mateixa comprovació efectiva que per ruta real |
| Hook amb comentaris però sense codi | Prova funcional roja |
| npm prepare seguit d’init/doctor | hooksPath estable i coherent |
| Índex Git divergent del worktree | Validació dels bytes preparats |
| Canvi .codex/hooks.json | Inventari i revalidació de política obligatoris |
| Bypass local de hooks | CI requerida impedix incorporar el canvi no validat |

El criteri original «tot agent local» només és verificable dins d’un entorn on tots els escriptors estan censats i confinats. Amb processos arbitraris amb els mateixos permisos, no es pot certificar una cadena infal·lible.

### Olivera: esmenes al pla de les 19:30

El pla actual repartix rols, però no concreta canvis, proves ni riscos de B4–B6. No té frontmatter; document.mjs check retorna «Frontmatter absent o no tancat». Declara l’ancoratge «Opcional», en conflicte amb AGENTS §3/§12. SCC detecta tres documents de les 19:30 sense àncora i els tres com a orfes.

Propose que MarIA consolide en el pla les fases i la matriu anteriors, obtinga el rebut corresponent i corregisca la consideració d’àncora opcional. Actualització de les 19:49: ha aparegut 260923_1947_auditoria_claude.md; l’he llegit íntegrament. Encara té Troballes, Verificació i Límits per completar. Coincidim en la correcció de B0, però l’esborrany no permet contrastar conclusions noves ni donar consens. No he reescrit el seu pla ni he marcat cap consens alié. La implementació continua AFK. El relleu antic encerta B5 i els quatre hooks inerts; l’afirmació que cap programa llig hooks.json d’Antigravity ha de quedar limitada a «consumidor no acreditat».

### Millora del prompt_local.md

- Canviar «infal·lible», «inviolable» i «tot agent» per superfície protegida, model d’amenaça i proves d’acceptació observables.
- Les caselles d’àncora, rebut i pla han de dur resultat mecànic, hora i hash. Un [x] escrit per l’autor no és evidència.
- Fer compatible la higiene amb AGENTS §12: conservar treball actiu ancorat; no arxivar automàticament per antiguitat o per nova ronda.
- Distingir auditoria de només lectura, proposta, consens i implementació. Un pla invàlid no impedix investigar, però no acredita preparació ni consens.
- Mantindre «variant no exposada» i separar tokens estimats dels mesurats, com ja fa la plantilla viva llegida en este torn. No inventar el motor exacte.
- Exigir ruta exacta de les entregues de les companyes i declarar «no disponible al tall» quan encara no han arribat.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

### Resultats executats

- node --test tests/hooks-local.test.mjs tests/porta-reflex.test.mjs tests/fortificacio.test.mjs tests/documental.test.mjs: **73/73 passen**, exit 0. No certifica C1–C9: les reproduccions addicionals mostren els buits.
- SCC directe, 19:43: exit 1, sis incidències — tres ESCRIPTORI_UNANCHORED i tres ORPHAN_OPERATIVE dels documents de les 19:30.
- verificaSegell: ok=false; actual cff3af91abe862e72d916b4860572d30f864543bb22e8f9bf5c2c4dd883cc643, pany 6e2883329444b55734638d2f2aef68c09684a980a6f425afdfb479f196d5aa23. 19 Markdown inventariats. No actualitzat.
- Fixtures: canvi alié resegellat; fallada de traça amb segell verd; cinc payloads admesos per checkLocal; SCC verd amb ruta falsa i HTML sense àncora; canvi .codex invisible a inventory; SCC per symlink amb exit 0 sense eixida; quatre hooks inerts amb exit 0.
- tancament --check executat: plantilles, autoritat i LEDGER passen; segell, catàleg de skills, Wiki estricta i SCC fallen. El torn no té pla vinculat vàlid. La comprovació final de l’entrega i el relleu es registra al final d’esta secció.
- No executat tests/verificador-scc.test.mjs perquè injecta i esborra brossa directament a l’escriptori compartit i pressuposa la resta del repo net. Substituït per fixtures temporals. No hi ha build, commit, instal·lació ni deploy en esta auditoria.

### Reproducció curta de C1, C2, C7 i C9

Des de l’arrel del repositori; només crea i elimina una carpeta temporal pròpia. No executar segell-auto amb --update sobre el repositori real per a reproduir-ho.

```bash
node --input-type=module <<'NODE'
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {verificaSegell} from './tooling/gates/segella.mjs';
import {resegellaSiCal} from './tooling/gates/segell-auto.mjs';
import {VerificadorSCC} from './tooling/gates/verificador-scc.mjs';
import {inventory,changes} from './tooling/documental/turns.mjs';
const repo=process.cwd(), root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-audit-'));
const put=(p,s)=>{p=path.join(root,p);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s);};
try {
  put('.agents/skills/a/SKILL.md','A0');put('.agents/skills/b/SKILL.md','B0');
  verificaSegell(root,{update:true});
  put('.agents/skills/b/SKILL.md','B alié');put('.agents/skills/a/SKILL.md','A eina');
  console.log('C1',resegellaSiCal('.agents/skills/a/SKILL.md',root),verificaSegell(root).ok);
  fs.unlinkSync(path.join(root,'.agents/runtime/segell.log'));
  fs.mkdirSync(path.join(root,'.agents/runtime/segell.log'));
  put('.agents/skills/a/SKILL.md','A nou');
  const run=spawnSync(process.execPath,[path.join(repo,'tooling/gates/segell-auto.mjs')],{
    cwd:root,env:{...process.env,SDP_ARREL:root},encoding:'utf8',
    input:JSON.stringify({tool_input:{file_path:'.agents/skills/a/SKILL.md'}})
  });
  console.log('C2',run.status,run.stderr,verificaSegell(root).ok);
  put('_wiki_de_poble/00_index.md','[[00_index_escriptori]]');
  put('_wiki_de_poble/04_escriptori/00_index_escriptori.md','[broken](wrong/fact.md)');
  put('_wiki_de_poble/04_escriptori/fact.md','# fact');
  put('_wiki_de_poble/04_escriptori/01_produccio/unanchored.html','html');
  console.log('C7',await new VerificadorSCC(root).runAudits());
  put('.codex/hooks.json','{}');const before=inventory(root);
  put('.codex/hooks.json','{"changed":true}');
  console.log('C9',changes(before,inventory(root)));
} finally {fs.rmSync(root,{recursive:true,force:true});}
NODE
```

En el tall auditat: C1 acaba true; C2 acaba exit 0 i true; C7 valid:true; C9 []. Després de fortificar, estos resultats han de canviar en les condicions descrites en la matriu.

### Empremtes de les fonts clau, 19:42

| Fitxer | SHA-256 |
| --- | --- |
| tooling/gates/hooks-local.mjs | b5ca5433f55bc7b0e1d048b1371804507f83f46480dae74dfd401cda5383d215 |
| tooling/gates/segell-auto.mjs | 62d6f49704f005f729452f0ecacc1c615517114137f29266c347b0a09d04670f |
| tooling/gates/segella.mjs | 489f70370dd8f111048a7271229b1db7b7f0184537d5c636556ac0464d0b1e40 |
| tooling/gates/verificador-scc.mjs | 6a644ab9ebe188a2a0d9dc42eba0cccd2a13f9ccc78e09aec57662da787c4d1c |
| tooling/documental/turns.mjs | a265a52e80886336196f51d0d8e1b071b27b3ce52e4c3198fb39d503bbd67a8b |
| tooling/wiki/reflex_petorreta.mjs | 735d904a6bc9b29d8c491676d8741f00b006fd4021f7ce30cf2074afa0e9e98c |


### Tancament de l’entrega (2026-09-23 19:49:45 +02:00)

Document check vàlid abans del relleu. ESTAT i LEDGER actualitzats amb el torn; checksum del LEDGER preservat vàlid. Tancament final --check: exit 1, valid=false, state=context_loaded. Controls: plantilles=0, autoritat=0, ledger=0, segell=1, skills=1, wiki=1, scc=1. Continuen sense pla vinculat ni estat planned; les incidències globals no s’han ocultat. El torn no es declara closed.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

L’arbre ja contenia modificacions d’altres sessions en codi, documentació i estat. Les conclusions descriuen els bytes observats, no exclusivament HEAD; un canvi posterior obliga a repetir les proves afectades. No s’han llegit secrets ni el contingut de l’arxiu històric per a RAG. No s’ha provat l’activació real de cada client ni la protecció remota de branca. No he inferit autoria dels canvis concurrents.

L’entrega de l’auditoria està autoritzada. La implementació, el consens de les altres IAs, la reconciliació del segell i l’Acta Marmota global continuen per resoldre. Un tancament mecànic roig es conserva roig: no es resegella contingut alié ni es presenta una auditoria documental com una lease de seguretat.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260923_1930_pla_implementacio]]
- [[260923_1947_auditoria_claude]]
- [[02_genotip]]
- [Protocol executable](../../.agents/PROTOCOL_PETORRETA.md)
- [OpenAI: hooks](https://learn.chatgpt.com/docs/hooks)
- [Claude Code: hooks](https://code.claude.com/docs/en/hooks)
- [Husky: diagnòstic](https://typicode.github.io/husky/troubleshoot.html)
- [Git: hooks](https://git-scm.com/docs/githooks)

**Ancoratge de Seguretat:** [[00_index_escriptori]]
