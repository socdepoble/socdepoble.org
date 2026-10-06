#!/usr/bin/env node
/** antigravity-hook.mjs — la Porta Olivera i la Plantilla viva, dites en el dialecte d'Antigravity.
 *
 *  El problema, dit sense adornar-lo: MarIA escriu des d'Antigravity IDE i cap
 *  porta la veia. `.agents/hooks.json` era al camí bo, però amb un format, un
 *  payload, un contracte d'eixida i un directori de treball que l'IDE no parla.
 *  La regla que havia de disparar quan MarIA escriu un prompt vivia en canals que
 *  MarIA no té davant en eixe moment.
 *
 *  Contracte (documentació local de l'IDE 2.5.5, llegida el 260930):
 *    ~/.gemini/antigravity-ide/builtin/skills/agy-customizations/docs/hooks.md
 *    · `.agents/hooks.json`: cada clau de primer nivell és un hook amb nom.
 *    · L'ordre corre amb `sh -c` des del directori que conté hooks.json
 *      (`.agents/`): per això les ordres fan `cd ..` abans de cridar node.
 *    · Entrada per stdin, JSON en camelCase. PreToolUse porta
 *      `{toolCall: {name, args}, stepIdx, …}`; PreInvocation, `{invocationNum, …}`.
 *      Tots dos porten els camps comuns, entre ells `conversationId`.
 *    · Eixida per stdout, JSON. PreToolUse → `{decision: allow|deny|ask|force_ask,
 *      reason}`; PreInvocation → `{injectSteps: [{ephemeralMessage}]}` o `{}`.
 *
 *  Què fa:
 *    pre-tool        · escriure un prompt, una petorreta o un pla al primer nivell
 *                      de l'Escriptori: `deny` si la Plantilla viva o la Porta
 *                      Olivera hi troben errors, amb el motiu i la via de sortida;
 *                    · `run_command` destructiu que toca Escriptori/governança: `force_ask` (el
 *                      trasllat a mà deixa àncores fantasma a l'índex);
 *                    · `run_command` que redirigix (`>`, `>>`, `| tee`) a un
 *                      document del primer nivell: `force_ask` (el contingut no es pot
 *                      jutjar, i és la via per on van nàixer documents sense rebut);
 *                    · `run_command` que nomena l'índex de l'Escriptori i hi pot
 *                      escriure per una via opaca (heretoc, `sed -i`, `perl -i`,
 *                      `tee`, `writeFile*`), o que executa un script fora de
 *                      tooling/, scripts/, tests/ i src/ que el nomena i escriu
 *                      fitxers (també amb el camí entre cometes i amb espais,
 *                      com l'arrel «Som de Poble»): `force_ask`. L'índex el
 *                      reescriuen les ordres de la porta Olivera o l'eina d'edició;
 *                    · la resta: `allow`.
 *    pre-invocation  · si l'Escriptori no passa `checkTaula` (definició única,
 *                      AGENTS §0.1), injecta un missatge efímer curt amb l'ordre
 *                      observa → actua → verifica → informa;
 *                    · si la taula és neta però hi ha documents declarats vius a
 *                      «## Activitat en curs» (o artefactes d'abans de hui al
 *                      primer nivell), injecta UNA VEGADA per conversa i jornada el
 *                      «briefing de taula»: quins són, quants són d'abans de hui i
 *                      com es decidix cadascun. Els noms que la porta no deixa
 *                      eixir per nom (majúscules a la part termodinàmica, com els
 *                      BUNDLE, PROMPT i ABSENTS de crear_bundle) no reben l'ordre
 *                      `--nom`: per a eixos, preguntar. És un avís, mai un bloqueig.
 *
 *  Per què (laboratori 261006_0300_ledger_claude/t6_higiene, DIAGNOSI.txt): la
 *  porta dona verd a tot el que està declarat viu, i la declaració no caduca. El
 *  2026-10-05 a les 11:39 (hora local) MarIA va passar la porta en arrencar, per
 *  iniciativa pròpia, i va informar «Tinc l'Escriptori ben net» amb dotze
 *  documents declarats vius: sis del 4-10 i sis de la marató de la mateixa nit.
 *  Al primer nivell hi havia 102 fitxers, els dotze inclosos. Al primer crit de
 *  cada conversa el briefing els llista tots: en eixe moment tots són d'abans
 *  d'esta conversa, i on talla la «jornada» és decisió del Mestre.
 *  La guarda de l'índex ve del mateix dia: «npm run olivera:arxiva» va respondre
 *  «Res a arxivar», la neteja es va fer amb un mv massiu i la taula va tornar a
 *  verd amb dos scripts creats per heretoc (scratch_clean.mjs i
 *  scratch_anchor.mjs) que reescrivien l'índex sense passar per cap porta. Des
 *  del 29-9, almenys 26 ordres de shell (11 scripts per heretoc, 7 sed -i,
 *  5 node -e i 3 scripts ad hoc de la carpeta scratch de l'IDE) han escrit
 *  l'índex; d'eixes vies, este hook només aturava els node -e (DIAGNOSI §3.3).
 *
 *  No hi ha `Stop`: un `continue` mal comptat és un bucle, i tancar el torn no és
 *  feina d'un hook d'escriptura.
 *
 *  Seguretat de funcionament:
 *    · Qualsevol error en pre-tool torna `ask`: ni `allow` cec ni `deny` cec.
 *    · Interruptor d'apagada: si existix `.agents/runtime/antigravity-hook.off`,
 *      torna `allow` (o `{}`) sense comprovar ni traçar res. És del Mestre: una
 *      escriptura de MarIA a l'interruptor, a hooks.json o a este fitxer pregunta.
 *    · Traça d'una línia per invocació a `.agents/runtime/antigravity-hook.log`
 *      (fora de git per `*.log`): és l'única acreditació que l'IDE executa el hook.
 *      Les injeccions hi deixen el principi del missatge com a motiu.
 *    · El briefing es recorda a `.agents/runtime/antigravity-briefing.log` (també
 *      fora de git per `*.log`): una línia per conversa i jornada. Si no es pot
 *      escriure, no hi ha briefing: un avís que no es pot recordar es repetiria a
 *      cada crida.
 *    · stdin només es llig si no és un terminal: executat a mà no es penja (la
 *      lliçó de la porta Olivera antiga, que esperava un EOF que no arribava).
 *
 *  Nucli pur: `preTool` i `preInvocation` reben les portes (i la memòria del
 *  briefing) per paràmetre. Els imports reals (`./porta-olivera.mjs`,
 *  `./porta-reflex.mjs`, `./porta-plantilla-viva.mjs`) es fan amb `import()` dins
 *  de `main()`, i només quan la decisió els necessita: un `view_file` no paga cap
 *  càrrega, i el nucli es prova amb portes falses.
 *
 *  Ús (des de l'arrel; l'IDE ho fa amb `cd ..` des de `.agents/`):
 *    node tooling/gates/antigravity-hook.mjs pre-tool        < payload.json
 *    node tooling/gates/antigravity-hook.mjs pre-invocation  < payload.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { knownPureRead, SECURITY_PATHS, mutationPath } from './mutation-policy.mjs';
import { documentArgv } from '../documental/command-policy.mjs';

export const DESK = '_wiki_de_poble/04_escriptori';
export const INTERRUPTOR = '.agents/runtime/antigravity-hook.off';
export const TRACA = '.agents/runtime/antigravity-hook.log';
export const MODES = Object.freeze(['pre-tool', 'pre-invocation']);
/* Briefing de taula. Sense exportacions noves a propòsit: el laboratori 260930b
   compara l'API instal·lada amb la seua còpia, i qualsevol nom nou el fa caure
   (tests/governanca-260930b-portes.test.mjs). Es prova per preInvocation i pel
   procés real. */
const BRIEFINGS = '.agents/runtime/antigravity-briefing.log';
const MARCA_BRIEFING = '[Briefing de taula';
const MAX_NOMS_BRIEFING = 6;
/* Forma de nom que la porta del paquet 261006_0055 deixa eixir per --nom
   (NOM_ARTEFACTE, porta-olivera.mjs:98 del seu nous/): part termodinàmica en
   minúscules i alguna extensió. Els BUNDLE, PROMPT i ABSENTS de crear_bundle no
   hi caben (LLEGIU del 0055, §6; el remei és ANC-06): el briefing no els dona
   l'ordre --nom, que fallaria sempre. La categoria no es mira ací: si no ix per
   nom, la porta ho diu i el briefing ja mana preguntar. */
const NOM_PER_NOM = /^\d{6}_\d{4}_[a-z0-9]+(?:_[a-z0-9]+)*(?:\.[A-Za-z0-9]+)+$/;

/* Noms d'eina d'escriptura d'Antigravity. La documentació només acredita
   `run_command`, `view_file` i `browser_*`; estos tres noms, i les claus
   TargetFile, CodeContent i ReplacementChunks, són els del dialecte que ja parla
   porta-reflex.mjs. Per això també compta com a escriptura qualsevol eina que
   porte un argument de contingut, es diga com es diga: un nom nou no escapa. */
const ESCRIPTURA = new Set(['write_to_file', 'replace_file_content', 'multi_replace_file_content']);
const ARGS_CONTINGUT = Object.freeze(['CodeContent', 'ReplacementChunks', 'ReplacementContent', 'TargetContent']);

/* Peces que governen este mateix hook. Tocar-les és decisió del Mestre. */
const AUTOPROTEGITS = new Set(['.agents/hooks.json', 'tooling/gates/antigravity-hook.mjs', INTERRUPTOR]);

const ALLOW = Object.freeze({ decision: 'allow' });
const ask = (reason) => ({ decision: 'ask', reason });
const forceAsk = (reason) => ({ decision: 'force_ask', reason });
const MAX_ERRORS = 12;

const VIA_OLIVERA = 'node tooling/gates/porta-olivera.mjs';
const MOTIU_MV = `Trasllat a mà dins de l'Escriptori: deixa àncores fantasma a l'índex i no avisa cap rebut. Via canònica (AGENTS §0.1): ${VIA_OLIVERA} --arxiva [--nom aammdd_hhmm_categoria_titol.md] [--sec].`;
const MOTIU_ARXIU = "Esborrat o trasllat dins de 90_arxiu_historic: el que ja no val es trasllada i mai s'esborra (AGENTS §5). Necessita l'ordre del Mestre.";

/* Guarda de l'índex. L'índex de l'Escriptori el reescriuen les ordres de la porta
   Olivera (la CLI ja admesa més amunt) o l'eina d'edició. Una ordre que el nomena
   i hi pot escriure per una via opaca, o un script ad hoc que el nomena i escriu
   fitxers, no passa per cap porta: és la via per on el 5-10 la taula va tornar a
   verd (scratch_clean.mjs i scratch_anchor.mjs, laboratori t6_higiene). Els
   scripts versionats (tooling/, scripts/, tests/, src/) tenen el seu circuit. */
const INDEX_ESCRIPTORI = /00_index_escriptori/i;
const ESCRIPTURA_OPACA = /<<|(?:^|[\s;&|(])(?:sed|perl)(?:[ \t][^;&|\n]*)?[ \t]-[a-zA-Z]*i(?=[ \t]|$)|(?:^|[\s;&|(])tee(?=[ \t]|$)|\b(?:write|append)File(?:Sync)?\b|>[ \t]*[^\s;&|<>]+\.(?:m?js|cjs|ts|py|sh|rb|pl)(?=$|[\s;&|)])/;
const API_ESCRIPTURA = /\b(?:write|append)File(?:Sync)?\b|\brename(?:Sync)?\(|\.write\(|\bopen\([^)\n]*['"][wa]/;
const INTERPRET = /(?:^|[\s;&|(])(?:\/(?:[^/\s]+\/)*)?(?:node|python[0-9.]*|ruby|perl|bash|sh|zsh)((?:[ \t]+[^\s;&|<>]+)+)/g;
const VERSIONAT = /^(?:tooling|scripts|tests|src|node_modules)\//;
/* Una paraula de shell amb les cometes i els escapes sencers: el camí absolut de
   l'arrel («…/Som de Poble/…») entre cometes, o amb «\ », és una sola paraula. */
const PARAULA_SHELL = /(?:'[^']*'|"(?:\\.|[^"\\])*"|\\.|[^\s'"\\])+/g;
const MAX_SCRIPT = 512 * 1024;
const MOTIU_INDEX = `Escriptura de l'índex de l'Escriptori per shell o per un script ad hoc: no passa per cap porta i pot fabricar un verd. L'índex el reescriuen les ordres de la porta Olivera (${VIA_OLIVERA}) o l'eina d'edició. Si la porta no et deixa fer el gest, pregunta al Mestre.`;

export function retalla(text, max = 300) {
  const t = String(text ?? '');
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/**
 * Ruta relativa a l'arrel amb `/`, o null si ix del repositori. És lèxica: un
 * symlink que escapa el jutja porta-reflex (protectedPath) quan cal reconstruir.
 */
export function relatiu(root, cami, base = root) {
  if (typeof cami !== 'string' || !cami) return null;
  const r = path.relative(root, path.resolve(base, cami));
  if (!r || r === '..' || r.startsWith(`..${path.sep}`) || path.isAbsolute(r)) return null;
  return r.split(path.sep).join('/');
}

const alPrimerNivell = (rel) => path.posix.dirname(rel) === DESK;
const esMd = (rel) => /\.md$/i.test(rel);
const zonaHumana = (rel) => rel.toLowerCase().startsWith(`${DESK}/01_produccio/`);
const governat = rel => SECURITY_PATHS.some(dir=>rel.toLowerCase()===dir || rel.toLowerCase().startsWith(`${dir}/`))
  || /^(?:agents|claude)\.md$|^package(?:-lock)?\.json$/i.test(rel);
const argsDe = (crida) => (crida?.args && typeof crida.args === 'object' && !Array.isArray(crida.args) ? crida.args : {});

export function esEscriptura(nom, args = {}) {
  return ESCRIPTURA.has(nom) || ARGS_CONTINGUT.some((k) => Object.hasOwn(args, k));
}

/**
 * Antigravity edita per trossos amb StartLine/EndLine, i porta-reflex rebutja
 * les edicions per línies perquè no en coneix la semàntica exacta. Un tros sense
 * AllowMultiple dona el mateix resultat sense les línies SI el text buscat només
 * apareix una vegada al document, i eixa unicitat ja l'exigix porta-reflex: si
 * apareix dues voltes, falla i el hook pregunta. Amb AllowMultiple les línies
 * limiten l'abast i no es poden llevar: es deixen, i porta-reflex les rebutja.
 */
export function sensePosicions(args) {
  const lleva = (c) => (c && typeof c === 'object' && c.AllowMultiple !== true
    ? Object.fromEntries(Object.entries(c).filter(([k]) => k !== 'StartLine' && k !== 'EndLine'))
    : c);
  const out = { ...lleva(args) };
  if (Array.isArray(args.ReplacementChunks)) out.ReplacementChunks = args.ReplacementChunks.map(lleva);
  return out;
}

/** Nom literal de shell: resol cometes/escapes, mai executa expansions. */
function shellLiteral(raw) {
  let value='',quote=null;
  for(let i=0;i<raw.length;i++) {
    const character=raw[i];
    if(quote==="'") { if(character===quote)quote=null;else value+=character;continue; }
    if(character==='"' || (!quote && character==="'")) { quote=quote?null:character;continue; }
    if(character==='\\') {
      const next=raw[++i];if(next===undefined)return null;
      if(quote==='"' && !/[$`"\\]/.test(next))value+='\\';
      value+=next;continue;
    }
    if(character==='$'||character==='`')return null;
    value+=character;
  }
  return quote?null:value;
}
function redirectionWords(command) {
  const targets=[];
  for(const match of command.matchAll(/(?:>>?|\|\s*tee(?:\s+-a)?(?:\s+--)?)\s*((?:'[^']*'|"(?:\\.|[^"\\])*"|\\.|[^\s;&|<>])+)/g)) {
    targets.push(match[1]);
  }
  // tee pot escriure diversos destins: cada nom literal passa per la mateixa porta.
  for(const tee of command.matchAll(/\|\s*tee(?:\s+-a)?(?:\s+--)?\s+([^;&|\n]+)/g)) {
    for(const word of tee[1].matchAll(/(?:'[^']*'|"(?:\\.|[^"\\])*"|\\.|[^\s;&|<>])+/g)) {
      const literal=shellLiteral(word[0]);if(!literal || !literal.startsWith('-'))targets.push(word[0]);
    }
  }
  return [...new Set(targets)];
}
const redirectionTargets=command=>redirectionWords(command).map(shellLiteral).filter(Boolean);

/** Destins de les redireccions d'una ordre que cauen al primer nivell de l'Escriptori. */
export function redireccionsAlTaulell(ordre, root, cwd = root) {
  const out = [];
  for (const target of redirectionTargets(ordre)) {
    const rel = relatiu(root, target, cwd);
    if (rel && alPrimerNivell(rel) && esMd(rel)) out.push(rel);
  }
  return out;
}

/**
 * Script ad hoc que una ordre executa amb un intèrpret, si en nomena l'índex i
 * escriu fitxers. Només el llig si existix, és regular i no passa de 512 KB; un
 * script que encara no existix (creat en la mateixa ordre) el jutja l'heretoc.
 * El camí es llig com a paraula de shell sencera abans de resoldre'l: partit
 * pels espais, «node "/…/Som de Poble/x.mjs"» deixava una cometa oberta i
 * passava sense mirar. El camí es resol contra Cwd, no contra un `cd` previ de
 * la mateixa ordre (límit declarat al LLEGIU §5).
 */
function scriptSobreIndex(ordre, root, cwd) {
  for (const m of ordre.matchAll(INTERPRET)) {
    const primer = (m[1].match(PARAULA_SHELL) ?? []).find((w) => !w.startsWith('-'));
    const literal = primer ? shellLiteral(primer) : null;
    if (!literal) continue;
    const abs = path.resolve(cwd, literal);
    const rel = relatiu(root, abs);
    if (rel && VERSIONAT.test(rel)) continue;
    try {
      const st = fs.statSync(abs);
      if (!st.isFile() || st.size > MAX_SCRIPT) continue;
      const text = fs.readFileSync(abs, 'utf8');
      if (INDEX_ESCRIPTORI.test(text) && API_ESCRIPTURA.test(text)) return rel ?? abs;
    } catch { /* un camí que no es pot llegir no és cap script jutjable */ }
  }
  return null;
}

/* ── Nucli pur ────────────────────────────────────────────────────────────── */

function preShell(args, root) {
  const ordre = typeof args.CommandLine === 'string' ? args.CommandLine : typeof args.Command === 'string' ? args.Command : null;
  if (ordre === null) return ask('Hook Olivera: run_command sense CommandLine; cap comprovació feta.');
  if (typeof args.CommandLine === 'string' && typeof args.Command === 'string' && args.CommandLine !== args.Command) {
    return forceAsk('Hook Olivera: CommandLine i Command divergents; cap ordre privilegiada acreditada.');
  }
  if (ordre.includes('antigravity-hook.off')) {
    return forceAsk(`L'interruptor ${INTERRUPTOR} és del Mestre: apagar el hook necessita el seu permís.`);
  }
  const cwd = typeof args.Cwd === 'string' && args.Cwd ? path.resolve(root, args.Cwd) : root;
  const cwdRel = (relatiu(root, cwd) ?? '').toLowerCase();
  // Les lectures elementals ja aprovades no es convertixen en preguntes perquè
  // el patró cercat diga «rm» o esmente una ruta governada.
  if (knownPureRead({tool_name:'run_command',tool_input:{command:ordre}},root)) return ALLOW;
  // Un argument literal d'una CLI governada pot citar «rm .» com a text.
  // L'argv no admet composició ni expansió; l'autoritat continua a l'executor/CLI.
  try {
    const argv=documentArgv(ordre);
    if (argv[0]==='node' && ['tooling/wiki/document.mjs','tooling/gates/obrir_torn.mjs','tooling/gates/porta-olivera.mjs','tooling/gates/executor-mutacio.mjs'].includes(argv[1])) return ALLOW;
  } catch { /* ordre composta: mai una excepció per prefix */ }
  const lexicalRisk = ordre.replace(/['"\\]/g,'');
  const riskText = lexicalRisk.toLowerCase();
  const mentions = dir => new RegExp(`(?:^|[\\s/])${dir.replaceAll('.','[.]')}(?=$|[\\s/;&|()])`).test(riskText);
  const tocaTaulell = mentions('04_escriptori') || cwdRel === DESK || cwdRel.startsWith(`${DESK}/`);
  const enclosesProtected = directory => [DESK,...SECURITY_PATHS].some(dir=>{
    const rel=path.relative(directory,path.join(root,dir));
    return rel==='' || (rel!=='..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel));
  });
  const ancestorRisk = lexicalRisk.split(/[ \t;&|]+/).some(word=>word && !word.startsWith('-') && enclosesProtected(word==='*'?cwd:path.resolve(cwd,word)))
    || lexicalRisk.endsWith(root) || lexicalRisk.endsWith(`${root}/`) || lexicalRisk.includes(`${root} `);
  const tocaGovern = ancestorRisk || SECURITY_PATHS.some(dir=>mentions(dir) || cwdRel===dir || cwdRel.startsWith(`${dir}/`)) || /(?:AGENTS|CLAUDE)\.md|package(?:-lock)?\.json/i.test(riskText);
  const destructiva = /(?:^|[\s;&|(`])(?:\/(?:[^/\s`]+\/)*)?(?:rm|mv|unlink|rmdir|truncate)(?=[\s`]|$)/.test(riskText);
  if (tocaTaulell && destructiva) return forceAsk(`${MOTIU_MV}${tocaGovern?' Si afecta governança, necessita executor-mutacio.mjs amb pla exacte i lease.':''}`);
  if (tocaGovern && destructiva) return forceAsk('Destrucció o trasllat de governança: necessita autoritat explícita; usa executor-mutacio.mjs amb pla exacte i lease.');
  const ARXIU_REL = '_wiki_de_poble/90_arxiu_historic';
  if (destructiva && (mentions('90_arxiu_historic') || cwdRel === ARXIU_REL || cwdRel.startsWith(`${ARXIU_REL}/`))) return forceAsk(MOTIU_ARXIU);
  // Un intèrpret inline amb destí explícit no és una via documental ni un lease.
  if ((tocaTaulell || tocaGovern) && /(?:^|[\s;&|('"`])(?:\/(?:[^/\s'"`]+\/)*)?(?:node|python[0-9.]*|perl|ruby|sh|bash|zsh)(?:[ \t]+[^;&|]*)?[ \t]-(?:e|c|p)(?=[ \t]|$)/.test(lexicalRisk)) {
    return forceAsk('Intèrpret inline amb ruta protegida: necessita autoritat explícita; usa la via documental o executor-mutacio amb pla i lease.');
  }
  if((tocaTaulell||tocaGovern) && redirectionWords(ordre).some(raw=>shellLiteral(raw)===null)) {
    return forceAsk('Redirecció amb expansió no verificable i ruta protegida: cap destí ni autoritat acreditats.');
  }
  for (const target of redirectionTargets(ordre)) {
    const rel=relatiu(root,target,cwd);
    if(!rel)continue; // /dev/null i artefactes fora del repo ja preaprovats.
    if(governat(rel)||zonaHumana(rel))return forceAsk(`Redirecció a ${rel}: ruta protegida; usa la via amb autoritat explícita.`);
    try {
      const physical=mutationPath(root,target,cwd);
      if(governat(physical)||zonaHumana(physical)||(alPrimerNivell(physical)&&esMd(physical)))return forceAsk(`Redirecció a ${physical}: ruta física protegida; usa node tooling/wiki/document.mjs context → create o executor-mutacio.mjs amb pla exacte i lease.`);
    } catch(error) { return forceAsk(`Destí de redirecció protegit: ${retalla(error.message)}`); }
  }
  const redir = redireccionsAlTaulell(ordre, root, cwd);
  if (redir.length) {
    return forceAsk(`Escriptura per shell a ${redir.join(', ')}: no passa per cap porta ni deixa rebut. Un document de l'Escriptori s'escriu amb l'eina d'edició, i un prompt o un pla naix de node tooling/wiki/document.mjs context → create.`);
  }
  if (INDEX_ESCRIPTORI.test(lexicalRisk) && ESCRIPTURA_OPACA.test(lexicalRisk)) return forceAsk(MOTIU_INDEX);
  const script = scriptSobreIndex(ordre, root, cwd);
  if (script) return forceAsk(`${MOTIU_INDEX} Script: ${script}.`);
  return ALLOW;
}

function motiuDeny(fitxer, errors) {
  const llista = errors.slice(0, MAX_ERRORS).map((e) => `- ${retalla(e)}`);
  if (errors.length > MAX_ERRORS) llista.push(`- … i ${errors.length - MAX_ERRORS} més`);
  return [
    `Porta Olivera · ${fitxer}`,
    ...llista,
    `Resol-ho ara (AGENTS §0.1): observa amb ${VIA_OLIVERA}, declara els vius a «## Activitat en curs» o arxiva amb --arxiva, i fes nàixer el document de la plantilla (node tooling/wiki/document.mjs context → create).`,
  ].join('\n');
}

function preEscriptura(args, { root, portes }) {
  const cami = typeof args.TargetFile === 'string' && args.TargetFile ? args.TargetFile : null;
  if (!cami) return ask("Hook Olivera: eina d'escriptura sense TargetFile; cap comprovació feta.");
  const rel = relatiu(root, cami);
  if (rel === null) return ALLOW; // fora del repositori: artefactes propis de l'IDE (~/.gemini/…)
  if (zonaHumana(rel)) return forceAsk(`${rel} és a la zona humana (01_produccio): només amb ordre directa i explícita del Mestre (AGENTS §12).`);
  if (AUTOPROTEGITS.has(rel)) return forceAsk(`${rel} governa el hook d'Antigravity: canviar-lo és decisió del Mestre.`);
  if (governat(rel)) return forceAsk(`${rel} és governança: usa executor-mutacio.mjs amb pla exacte i lease; l’eina directa no acredita autoritat.`);
  // Una àlies en src pot apuntar a governança o eixir de l'arrel. Reusa la
  // mateixa resolució física i defensa de hardlinks que la política de mutació.
  try {
    const physical = mutationPath(root,cami);
    if (governat(physical) || zonaHumana(physical)) return forceAsk(`${physical} és una ruta física protegida; l'àlies no acredita autoritat.`);
  } catch (error) { return forceAsk(`Ruta d'escriptura protegida: ${retalla(error.message)}`); }
  if (!alPrimerNivell(rel) || !esMd(rel)) return ALLOW;
  if (!portes) throw new Error('portes no carregades per a una escriptura a l’Escriptori');

  const nom = path.posix.basename(rel);
  if (!portes.esPetorreta(rel) && !portes.vigilat(nom)) return ALLOW;
  if (args.AllowMultiple === true && (args.StartLine !== undefined || args.EndLine !== undefined)) {
    return ask(`Hook Olivera · ${rel}: edició AllowMultiple limitada per línies; no es pot reconstruir el document. Escriu-lo sencer o demana permís.`);
  }

  let op;
  try { op = portes.operacio({ toolArgs: sensePosicions(args), cwd: root }); }
  catch (e) { return ask(`Hook Olivera · ${rel}: ${retalla(e.message)}. No es pot reconstruir el document; escriu-lo sencer (write_to_file) o demana permís.`); }
  if (!op || op.fora || typeof op.contingut !== 'string') {
    return ask(`Hook Olivera · ${rel}: la porta documental no reconeix la ruta; cap comprovació feta.`);
  }

  const fitxer = op.fitxer;
  const errors = [];
  if (portes.esPetorreta(fitxer)) errors.push(...portes.olivera(op.contingut));
  errors.push(...portes.plantilla(fitxer, op.contingut).map((e) => `[Plantilla viva] ${e}`));
  return errors.length ? { decision: 'deny', reason: motiuDeny(fitxer, errors) } : ALLOW;
}

/** PreToolUse. `portes` només cal quan `calenPortes` ho diu; si falta, llança i el cridador pregunta. */
export function preTool(payload, { root, portes = null } = {}) {
  const crida = payload?.toolCall;
  const nom = crida?.name;
  if (typeof nom !== 'string' || !nom) return ask('Hook Olivera: payload sense toolCall.name; cap comprovació feta.');
  const args = argsDe(crida);
  if (nom === 'run_command') return preShell(args, root);
  if (!esEscriptura(nom, args)) return ALLOW;
  return preEscriptura(args, { root, portes });
}

export function missatgeTaula(errors = []) {
  const llista = Array.isArray(errors) ? errors : [];
  const mostra = llista.slice(0, 3).map((e) => retalla(e, 160)).join(' · ');
  const mes = llista.length > 3 ? ` (+${llista.length - 3})` : '';
  return `[Escriptori brut · AGENTS §0.1] ${mostra || 'la porta no diu per què'}${mes}. Resol-ho en este torn, abans de redactar cap prompt o pla: observa (${VIA_OLIVERA}) → actua (declara els vius a «## Activitat en curs», arxiva la resta amb --arxiva, corregix les àncores) → verifica (la porta ix amb 0) → informa (una línia al Mestre).`;
}

/**
 * Briefing de taula: el que la porta deixa passar perquè està declarat viu, dit en
 * veu alta una vegada per conversa i jornada. Llista tots els declarats vius (al
 * primer crit d'una conversa tots són d'abans d'ella), els més antics primer, i
 * diu quants són d'abans de hui. Els que la porta no deixa eixir per nom
 * (NOM_PER_NOM) es diuen a banda i no reben l'ordre --nom: si cap no hi cap, el
 * briefing no la dona. Null si no hi ha res a dir.
 */
function missatgeBriefing({ dia = '', documents = [], artefactes = 0, artefactesSenseNom = 0 } = {}) {
  const parells = Array.isArray(documents)
    ? documents.filter((n) => typeof n === 'string' && n).map((n) => ({ nom: n, curt: n.replace(/\.md$/i, '') })).sort((a, b) => (a.curt < b.curt ? -1 : a.curt > b.curt ? 1 : 0))
    : [];
  const docs = parells.map((p) => p.curt);
  const art = Number.isInteger(artefactes) && artefactes > 0 ? artefactes : 0;
  if (!docs.length && !art) return null;
  const antics = docs.filter((n) => /^\d{6}_/.test(n) && n.slice(0, 6) < dia).length;
  const noms = docs.slice(0, MAX_NOMS_BRIEFING).join(', ');
  const mes = docs.length > MAX_NOMS_BRIEFING ? ` +${docs.length - MAX_NOMS_BRIEFING}` : '';
  const docsSenseNom = parells.filter((p) => !NOM_PER_NOM.test(p.nom)).map((p) => p.curt);
  const artSenseNom = Number.isInteger(artefactesSenseNom) && artefactesSenseNom > 0 ? Math.min(artefactesSenseNom, art) : 0;
  const senseNom = docsSenseNom.length + artSenseNom;
  const que = [
    docs.length ? `${docs.length} document(s) continuen declarats vius a «## Activitat en curs»${antics ? `, ${antics} d'abans de hui` : ''} (${noms}${mes})` : '',
    art ? `${art} artefacte(s) d'abans de hui continuen al primer nivell` : '',
  ].filter(Boolean).join(', i ');
  const quins = docsSenseNom.length ? `: ${docsSenseNom.slice(0, 3).join(', ')}${docsSenseNom.length > 3 ? ` +${docsSenseNom.length - 3}` : ''}` : '';
  const limit = senseNom ? ` ${senseNom} no pot(en) eixir per nom (majúscules o nom no termodinàmic; ANC-06${quins}): per a eixos, pregunta al Mestre.` : '';
  const via = senseNom < docs.length + art
    ? `si no, ${VIA_OLIVERA} --arxiva --sec --nom NOM i, si la simulació quadra, sense --sec`
    : 'si no, pregunta al Mestre, perquè la porta no els deixa eixir per nom';
  return `${MARCA_BRIEFING} · AGENTS §0.1 · primera crida de la conversa] La porta Olivera és verda, però verd no vol dir consumit: ${que}.${limit} Una declaració de viu no caduca sola. Decidix-los abans de la primera tasca: si encara el necessita algú (core-higiene-escriptori, pas 0), es queda declarat i ho dius al Mestre (qui i per a què); ${via}. Si la porta no et deixa fer el gest, pregunta al Mestre: ni mv, ni rm, ni scripts sobre l'índex. Informa el Mestre en una línia.`;
}

/** Clau de la memòria del briefing: una per conversa i jornada. */
function clauBriefing(payload, dia) {
  const conversa = typeof payload?.conversationId === 'string' && payload.conversationId ? payload.conversationId : 'sense-conversa';
  return `${conversa}:${dia}`;
}

/**
 * PreInvocation. La taula bruta ho diu una vegada per crida, curt. La taula neta
 * calla, llevat del briefing de la jornada: només si les portes saben calcular
 * els heretats i el host sap recordar que ja l'ha dit (`primera`).
 */
export function preInvocation({ portes = null, payload = null, primera = null } = {}) {
  if (!portes) throw new Error('portes no carregades per a comprovar la taula');
  const r = portes.taula();
  if (!r || typeof r.valid !== 'boolean') throw new Error('checkTaula ha tornat un resultat il·legible');
  if (!r.valid) return { injectSteps: [{ ephemeralMessage: missatgeTaula(r.errors) }] };
  if (typeof portes.heretats !== 'function' || typeof primera !== 'function') return {};
  const h = portes.heretats();
  if (!h || typeof h.dia !== 'string' || !Array.isArray(h.documents)) throw new Error('heretats ha tornat un resultat il·legible');
  const missatge = missatgeBriefing(h);
  if (!missatge || !primera(clauBriefing(payload, h.dia))) return {};
  return { injectSteps: [{ ephemeralMessage: missatge }] };
}

/**
 * Heretats de la taula amb les funcions de la porta Olivera instal·lada: tots els
 * fitxers solts del primer nivell que l'índex declara vius (de qualsevol data i
 * extensió, també els .md en majúscules que no són documents termodinàmics), i el
 * recompte dels artefactes d'abans de hui que no són documents termodinàmics ni
 * estan declarats vius, amb quants d'eixos no poden eixir per nom. Només llig.
 */
function heretatsDe(root, olivera, dia = typeof olivera?.avui === 'function' ? olivera.avui() : null) {
  for (const f of ['avui', 'vius', 'inventari']) {
    if (typeof olivera?.[f] !== 'function') throw new Error(`porta-olivera.mjs no exporta ${f}: cal la porta v3`);
  }
  if (typeof dia !== 'string' || !/^\d{6}$/.test(dia)) throw new Error(`dia il·legible: ${dia}`);
  const viu = olivera.vius(root);
  const termodinamics = new Set(olivera.inventari(root).map((d) => d.nom));
  const dir = path.join(root, DESK);
  const solts = fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && !e.name.startsWith('.') && e.name.toLowerCase() !== '00_index_escriptori.md')
      .map((e) => e.name)
    : [];
  const declarat = (nom) => viu.has(nom.replace(/\.md$/, ''));
  const documents = solts.filter(declarat).sort();
  const vells = solts.filter((n) => !declarat(n) && !termodinamics.has(n) && /^\d{6}_/.test(n) && n.slice(0, 6) < dia);
  return { dia, documents, artefactes: vells.length, artefactesSenseNom: vells.filter((n) => !NOM_PER_NOM.test(n)).length };
}

/** Quines portes cal carregar abans de decidir: 'taula', 'escriptura' o null. */
export function calenPortes(mode, payload, root) {
  if (mode === 'pre-invocation') return 'taula';
  if (mode !== 'pre-tool') return null;
  const crida = payload?.toolCall;
  const nom = crida?.name;
  const args = argsDe(crida);
  if (typeof nom !== 'string' || nom === 'run_command' || !esEscriptura(nom, args)) return null;
  const rel = relatiu(root, args.TargetFile);
  return rel && alPrimerNivell(rel) && esMd(rel) ? 'escriptura' : null;
}

export function decidix(mode, payload, ctx) {
  if (mode === 'pre-tool') return preTool(payload, ctx);
  if (mode === 'pre-invocation') return preInvocation({ ...ctx, payload });
  throw new Error(`mode desconegut «${mode ?? ''}»`);
}

/** Resposta davant qualsevol error: pregunta (pre-tool) o avisa que no s'ha pogut mirar (pre-invocation). */
export function perError(mode, error) {
  const m = retalla(error?.message ?? error);
  return mode === 'pre-invocation'
    ? { injectSteps: [{ ephemeralMessage: `[Hook Olivera] no s'ha pogut comprovar l'Escriptori (${m}). Comprova-ho a mà amb ${VIA_OLIVERA} i avisa el Mestre.` }] }
    : ask(`Hook Olivera: error intern (${m}); cap comprovació feta.`);
}

/** Decisió que queda a la traça: la de pre-tool, o el tipus d'injecció de pre-invocation. */
function decisioDeTraca(eixida) {
  if (eixida?.decision) return eixida.decision;
  const missatge = eixida?.injectSteps?.[0]?.ephemeralMessage;
  if (typeof missatge !== 'string') return eixida?.injectSteps ? 'injecta' : 'res';
  return missatge.startsWith(MARCA_BRIEFING) ? 'briefing' : 'injecta';
}

/* ── Procés ───────────────────────────────────────────────────────────────── */

async function carregaPortes(tipus, root) {
  const olivera = await import('./porta-olivera.mjs');
  if (tipus === 'taula') {
    if (typeof olivera.checkTaula !== 'function') throw new Error('porta-olivera.mjs no exporta checkTaula: cal la porta v3');
    return { taula: () => olivera.checkTaula(root), heretats: () => heretatsDe(root, olivera) };
  }
  const [reflex, viva] = await Promise.all([import('./porta-reflex.mjs'), import('./porta-plantilla-viva.mjs')]);
  return {
    esPetorreta: (rel) => olivera.esPetorreta(rel),
    vigilat: (nom) => viva.vigilat(nom),
    operacio: (payload) => reflex.normalitza(payload, root),
    olivera: (contingut) => olivera.checkOlivera(root, { contingut }).errors,
    plantilla: (rel, contingut) => viva.inspeccionaText(root, rel, contingut).errors,
  };
}

/**
 * Memòria del briefing: true la primera vegada que es demana una clau, i la
 * deixa escrita. Si no la pot llegir o escriure, false: sense memòria, el
 * briefing es repetiria a cada crida.
 */
function primeraDeLaJornada(root, clau) {
  const fitxer = path.join(root, BRIEFINGS);
  try {
    if (fs.existsSync(fitxer) && fs.readFileSync(fitxer, 'utf8').includes(`"clau":${JSON.stringify(clau)}`)) return false;
    fs.mkdirSync(path.dirname(fitxer), { recursive: true });
    fs.appendFileSync(fitxer, `${JSON.stringify({ t: new Date().toISOString(), clau })}\n`);
    return true;
  } catch {
    return false;
  }
}

function llegeixPayload() {
  if (process.stdin.isTTY) return { payload: null, error: 'stdin és un terminal: cap payload' };
  let raw;
  try { raw = fs.readFileSync(0, 'utf8'); } catch (e) { return { payload: null, error: `stdin il·legible (${e.message})` }; }
  if (!raw.trim()) return { payload: null, error: 'payload buit' };
  try { return { payload: JSON.parse(raw), error: null }; } catch (e) { return { payload: null, error: `payload il·legible (${e.message})` }; }
}

function traca(root, entrada) {
  try {
    const fitxer = path.join(root, TRACA);
    fs.mkdirSync(path.dirname(fitxer), { recursive: true });
    fs.appendFileSync(fitxer, `${JSON.stringify({ t: new Date().toISOString(), ...entrada })}\n`);
  } catch { /* la traça no decidix mai */ }
}

const escriu = (eixida) => process.stdout.write(`${JSON.stringify(eixida)}\n`);

async function main(argv) {
  const mode = argv[0];
  const root = path.resolve(process.env.SDP_ARREL || process.cwd());
  // stdin es buida sempre: l'IDE hi escriu el payload sencer i no ha de trobar la canonada tancada.
  const { payload, error } = llegeixPayload();
  if (fs.existsSync(path.join(root, INTERRUPTOR))) { escriu(mode === 'pre-tool' ? ALLOW : {}); return; }

  let eixida;
  try {
    if (!MODES.includes(mode)) throw new Error(`mode desconegut «${mode ?? ''}»`);
    if (mode === 'pre-tool' && error) throw new Error(error);
    const tipus = calenPortes(mode, payload, root);
    const portes = tipus ? await carregaPortes(tipus, root) : null;
    eixida = decidix(mode, payload, { root, portes, primera: (clau) => primeraDeLaJornada(root, clau) });
  } catch (e) {
    eixida = perError(mode, e);
  }

  const args = argsDe(payload?.toolCall);
  const missatge = eixida.injectSteps?.[0]?.ephemeralMessage;
  traca(root, {
    mode: mode ?? null,
    eina: payload?.toolCall?.name ?? null,
    fitxer: relatiu(root, args.TargetFile) ?? (args.TargetFile ? 'fora del repositori' : null),
    decisio: decisioDeTraca(eixida),
    ...(eixida.reason ? { motiu: retalla(eixida.reason, 200) } : typeof missatge === 'string' ? { motiu: retalla(missatge, 200) } : {}),
  });
  escriu(eixida);
}

// Mateixa guarda que porta-olivera.mjs: sota un symlink (/var → /private/var a
// macOS) `process.argv[1]` i `import.meta.url` no coincidixen si no es resol el
// camí real, i el mòdul es carregaria en silenci sense decidir res.
function esEntrada() {
  try { return Boolean(process.argv[1]) && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; }
  catch { return false; }
}
if (esEntrada()) {
  main(process.argv.slice(2)).catch((e) => escriu(perError(process.argv[2], e)));
}
