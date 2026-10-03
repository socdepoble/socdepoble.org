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
 *    · Eixida per stdout, JSON. PreToolUse → `{decision: allow|deny|ask|force_ask,
 *      reason}`; PreInvocation → `{injectSteps: [{ephemeralMessage}]}` o `{}`.
 *    · `allow` AUTOAPROVA l'eina («Automatically allow the tool execution»);
 *      `ask` torna la decisió al permís de l'IDE i respecta la memòria «Always
 *      Allow»; només `force_ask` pregunta sempre (hooks.md:194-196). Per això el
 *      que el hook no jutja és `ask`, mai `allow` (260930b, tooling-portes-1), i
 *      el que és decisió del Mestre és `force_ask` (261002, O10): el 261002 dos
 *      `mv` marcats amb `ask` es van executar en menys de 50 ms, aprovats per la
 *      memòria de l'IDE i no per cap humà.
 *
 *  Què fa:
 *    pre-tool        · les tres lectures que acredita la traça (view_file,
 *                      list_dir, grep_search) i les ordres canòniques de la porta
 *                      Olivera (informe, `--arxiva` amb noms o sense, amb `--sec`
 *                      o sense) i del relleu (`document.mjs handoff`), escrites
 *                      soles i des de l'arrel: `allow`;
 *                    · escriure un prompt, una petorreta o un pla al primer nivell
 *                      de l'Escriptori: `deny` si la Plantilla viva o la Porta
 *                      Olivera hi troben errors, amb el motiu i la via de sortida.
 *                      La taula només es jutja mentre la petorreta naix (D11);
 *                    · un .md nou al primer nivell amb una categoria fora del
 *                      catàleg (tooling/wiki/taxonomia.json) i que cap porta
 *                      vigila: `ask`; un nom parany com `planificacio_*` va a les
 *                      portes, que diuen el prefix correcte (O13);
 *                    · `run_command` que trasllada, copia o esborra (`mv`, `cp`,
 *                      `rm`, `rsync`, `ditto`, `unlink`, `-delete`) i toca
 *                      `04_escriptori`, o que escriu, mou o esborra un camí de
 *                      governança (tooling/, .agents/, .claude/, scripts/, …):
 *                      `force_ask` (D10, O17). També amb el verb entre cometes
 *                      (`'rm' x`) o dins d'una shell niuada (`sh -c '…'`,
 *                      `bash -lc "…"`), que es jutja com un trasllat (OLIV-R2);
 *                    · escriure amb una eina un camí de governança: `force_ask`;
 *                      ESTAT.md i LEDGER.md, que el BIOS mana escriure en cada
 *                      relleu (AGENTS §4), pregunten sense forçar;
 *                    · la zona humana (01_produccio) i les peces del hook, per
 *                      eina o per shell quan s'hi escriu: `force_ask`;
 *                    · `run_command` que redirigix a un document del primer
 *                      nivell: `ask` (el contingut no es pot jutjar);
 *                    · la resta: `ask` sense objecció.
 *                    Els camins es comparen sense distingir caixa: APFS no la
 *                    distingix, i `04_Escriptori/` és el mateix directori. Un
 *                    document existent escrit amb una altra caixa del nom es
 *                    jutja amb el nom real.
 *    pre-invocation  · si l'Escriptori no passa `checkTaula` (definició única,
 *                      AGENTS §0.1), injecta un missatge efímer curt amb l'ordre
 *                      observa → actua → verifica → informa.
 *
 *  No hi ha `Stop`: un `continue` mal comptat és un bucle, i tancar el torn no és
 *  feina d'un hook d'escriptura.
 *
 *  Seguretat de funcionament:
 *    · Qualsevol error en pre-tool torna `ask`: ni `allow` cec ni `deny` cec.
 *    · Interruptor d'apagada: si existix `.agents/runtime/antigravity-hook.off`,
 *      torna `ask` (o `{}`) sense comprovar res, i ho traça com a `apagat`. Apagar
 *      el hook no obri cap porta. L'apagada que documenta l'IDE és `"enabled":
 *      false` a hooks.json. Totes dues són del Mestre: una escriptura de MarIA a
 *      l'interruptor, a hooks.json, a este fitxer o a `.agents/runtime/` força la
 *      pregunta.
 *    · Traça d'una línia per invocació a `.agents/runtime/antigravity-hook.log`
 *      (fora de git per `*.log`), amb l'ordre de `run_command` retallada i els
 *      secrets en línia emmascarats: és l'única acreditació que l'IDE executa el
 *      hook i de què s'ha aprovat.
 *    · stdin només es llig si no és un terminal: executat a mà no es penja (la
 *      lliçó de la porta Olivera antiga, que esperava un EOF que no arribava).
 *    · L'arrel ve de SDP_ARREL o de tooling/lib/arrel.mjs; el cwd només és el
 *      darrer recurs (D6).
 *
 *  Límit conegut: una shell és opaca. `node -e`, `python -c` o un script propi
 *  poden moure fitxers sense dir cap verb dels de dalt; el hook no ho pot vore, i
 *  per això la via canònica és l'única que s'aprova sola. Una shell niuada
 *  (`sh -c`) sí que es veu, i es tracta com un trasllat.
 *
 *  Nucli pur: `preTool` i `preInvocation` reben les portes per paràmetre. Els
 *  imports reals (`./porta-olivera.mjs`, `./porta-reflex.mjs`,
 *  `./porta-plantilla-viva.mjs`, `./porta-taxonomia.mjs`) es fan amb `import()`
 *  dins de `main()`, i només quan la decisió els necessita: un `view_file` no
 *  paga cap càrrega, i el nucli es prova amb portes falses.
 *
 *  Ús (des de l'arrel; l'IDE ho fa amb `cd ..` des de `.agents/`):
 *    node tooling/gates/antigravity-hook.mjs pre-tool        < payload.json
 *    node tooling/gates/antigravity-hook.mjs pre-invocation  < payload.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const DESK = '_wiki_de_poble/04_escriptori';
export const INTERRUPTOR = '.agents/runtime/antigravity-hook.off';
export const TRACA = '.agents/runtime/antigravity-hook.log';
export const MODES = Object.freeze(['pre-tool', 'pre-invocation']);

/* Les úniques eines que el hook aprova soles: les lectures que acredita la traça
   (.agents/runtime/antigravity-hook.log). Qualsevol altra, també una de nova, torna
   al permís de l'IDE. */
export const LECTURES = Object.freeze(['view_file', 'list_dir', 'grep_search']);

/* Noms d'eina d'escriptura d'Antigravity. La documentació només acredita
   `run_command`, `view_file` i `browser_*`; estos tres noms, i les claus
   TargetFile, CodeContent i ReplacementChunks, són els del dialecte que ja parla
   porta-reflex.mjs. Per això també compta com a escriptura qualsevol eina que
   porte un argument de contingut, es diga com es diga: un nom nou no escapa. */
const ESCRIPTURA = new Set(['write_to_file', 'replace_file_content', 'multi_replace_file_content']);
const ARGS_CONTINGUT = Object.freeze(['CodeContent', 'ReplacementChunks', 'ReplacementContent', 'TargetContent']);

/* Peces que governen este mateix hook, en minúscules: APFS no distingix caixa.
   Tocar-les és decisió del Mestre. */
const AUTOPROTEGITS = new Set(['.agents/hooks.json', 'tooling/gates/antigravity-hook.mjs', INTERRUPTOR]);
/* Les mateixes, vistes des d'una ordre de shell: subcadenes de l'ordre en minúscules. */
const AUTOPROTEGITS_SHELL = Object.freeze(['.agents/hooks.json', 'antigravity-hook', '.agents/runtime/']);

/* Camins de governança (261002, O17 i omissió 4): s'apliquen amb
   executor-mutacio.mjs i una lease del Mestre, mai amb una eina d'escriptura ni
   amb un `cp` de shell. En minúscules; els que acaben en `/` són carpetes. */
export const GOVERNANCA = Object.freeze(['tooling/', '.agents/', '.claude/', '.codex/', '.husky/', '.github/', 'scripts/',
  'agents.md', 'claude.md', 'package.json', 'package-lock.json']);
/* El relleu que el BIOS mana escriure a mà en cada tancament (AGENTS §4): pregunta, no força. */
const RELLEU_LLIURE = new Set(['.agents/estat.md', '.agents/ledger.md']);

const ALLOW = Object.freeze({ decision: 'allow' });
const ask = (reason) => ({ decision: 'ask', reason });
const forceAsk = (reason) => ({ decision: 'force_ask', reason });
const NEUTRE = Object.freeze(ask("Hook Olivera: cap objecció; l'aprovació és del permís de l'IDE."));
const APAGAT = Object.freeze(ask(`Hook Olivera apagat per l'interruptor del Mestre (${INTERRUPTOR}): cap comprovació feta; l'aprovació és del permís de l'IDE.`));
const MAX_ERRORS = 12;

const VIA_OLIVERA = 'node tooling/gates/porta-olivera.mjs';
const MOTIU_TRASLLAT = `Trasllat, còpia o esborrat per shell a l'Escriptori: deixa àncores fantasma a l'índex i rebuts sense relleu. Via canònica (AGENTS §0.1), un sol acte que també fa el relleu: ${VIA_OLIVERA} --arxiva --sec --nom aammdd_hhmm_categoria_titol.md, i després sense --sec. Esborrar és decisió del Mestre (AGENTS §5).`;
const MOTIU_GOVERNANCA = "és un camí de governança: s'aplica amb node tooling/gates/executor-mutacio.mjs i una lease del Mestre, no a mà (AGENTS §5).";
const MOTIU_HUMANA = 'és a la zona humana (01_produccio): només amb ordre directa i explícita del Mestre (AGENTS §12).';

/* Ordres que mouen, copien o esborren. El prefix admet `/` i `\` (`/bin/mv` i
   `\mv` són el mateix `mv`) i unes cometes, obertes o tancades (`'rm' x`,
   `sh -c 'mv …'`, OLIV-R2): la shell les lleva abans d'executar. Un fals positiu
   (`grep 'rm' …`) només fa preguntar. */
const VERB_TRASLLAT = /(?:^|[\s;&|(`/\\'"])(?:mv|cp|rm|rsync|ditto|unlink|trash)(?=[\s'"]|$)|\s-delete(?=[\s'"]|$)/;
/* Ordres que escriuen un fitxer sense redirecció. */
const VERB_ESCRIPTURA = /(?:^|[\s;&|(`/\\'"])(?:tee|touch|truncate|ln|install|dd|patch)(?=[\s'"]|$)|(?:^|[\s;&|(`/\\'"])(?:sed|perl)\s+(?:-[a-z]*\s+)*-[a-z]*i|(?:^|[\s;&|(`'"])git\s+(?:checkout|restore|apply)(?=[\s'"]|$)/;
/* Una shell niuada (`sh -c '…'`, `bash -lc "…"`, `zsh -c …`): el que fa dins és
   opac per a este hook, i es jutja com un trasllat (OLIV-R2). Si no toca res
   protegit, continua sense objecció. */
const SHELL_NIUADA = /(?:^|[\s;&|(`/\\'"])(?:sh|bash|zsh|dash|ksh)(?:\s+--?[a-z][a-z-]*)*\s+-[a-z]*c[a-z]*(?=[\s'"]|$)/;
const AVIS_NIUADA = 'Shell niuada (sh -c): el hook no veu què fa dins i la jutja com un trasllat. ';

/* Ordres canòniques que el hook aprova soles (261002): escrites soles (cap
   operador de shell), des de l'arrel i amb noms de document taxonòmics. */
const DOC_SOLT = '(?:_wiki_de_poble/04_escriptori/)?\\d{6}_\\d{4}_[a-z0-9]+(?:_[a-z0-9]+)*(?:\\.md)?';
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
export const ORDRES_CANONIQUES = Object.freeze([
  /^node tooling\/gates\/porta-olivera\.mjs(?: --informe)?$/,
  /^npm run porta:olivera$/,
  new RegExp(`^node tooling/gates/porta-olivera\\.mjs --arxiva(?: --sec)?(?: --nom(?: |=)${DOC_SOLT})*(?: --sec)?$`),
  new RegExp(`^node tooling/wiki/document\\.mjs handoff --turn-id torn_${UUID} --file _wiki_de_poble/04_escriptori/\\d{6}_\\d{4}_[a-z0-9_]+\\.md --to _wiki_de_poble/(?:04_escriptori|10_actes|90_arxiu_historic)/(?:[A-Za-z0-9_-]+/)?\\d{6}_\\d{4}_[a-z0-9_]+\\.md$`),
]);

export function retalla(text, max = 300) {
  const t = String(text ?? '');
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/* Secrets que una ordre de shell pot portar en línia: assignacions de claus i
   tokens, capçaleres Bearer, credencials dins d'una URL, JWT i claus de Supabase.
   La traça és fora de git, però és un fitxer en clar (260930b). */
const SECRETS = Object.freeze([
  [/([\w-]*(?:key|secret|token|password|passwd|pwd)["']?\s*[=:]\s*)(?:'[^']*'|"[^"]*"|[^\s'"]+)/gi, '$1***'],
  [/(\bbearer\s+)[^\s'"]+/gi, '$1***'],
  [/(:\/\/[^\s/:@]+:)[^\s/@]+@/g, '$1***@'],
  [/\beyJ[\w-]{10,}\.[\w-]{10,}(?:\.[\w-]+)?/g, '***'],
  [/\b(sb_(?:publishable|secret)_)[\w-]{10,}/g, '$1***'],
]);

/** El text amb els secrets en línia substituïts per `***`. S'aplica abans de retallar: un secret tallat també es tapa. */
export function emmascara(text) {
  return SECRETS.reduce((t, [patro, per]) => t.replace(patro, per), String(text ?? ''));
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

/** Al primer nivell de l'Escriptori, sense distingir caixa: `04_Escriptori/` és la mateixa carpeta a APFS. */
const alPrimerNivell = (rel) => path.posix.dirname(rel.toLowerCase()) === DESK;
const esMd = (rel) => /\.md$/i.test(rel);
const zonaHumana = (rel) => rel.toLowerCase().startsWith(`${DESK}/01_produccio/`);
const argsDe = (crida) => (crida?.args && typeof crida.args === 'object' && !Array.isArray(crida.args) ? crida.args : {});
const ordreDe = (args) => (typeof args.CommandLine === 'string' ? args.CommandLine : typeof args.Command === 'string' ? args.Command : null);

/** Camí de governança (sense distingir caixa), menys el relleu lliure d'ESTAT i LEDGER. */
export function esGovernanca(rel) {
  const r = String(rel ?? '').toLowerCase();
  if (!r || RELLEU_LLIURE.has(r)) return false;
  return GOVERNANCA.some((g) => (g.endsWith('/') ? r.startsWith(g) : r === g));
}

/* Un camí de governança dins d'una ordre: ha de començar un camí (a l'inici, després d'un
   espai, d'unes cometes o d'un operador), amb `./` opcional. Així `prompt_claude.md` no és
   `claude.md`, però `mv AGENTS.md` i `rm -rf .agents/runtime/x` sí que ho són. */
const literal = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const GOVERNANCA_SHELL = Object.freeze(GOVERNANCA.map((g) => [g, new RegExp(`(?:^|[\\s'"=:;&|(<>])(?:\\./)?${literal(g)}`)]));

/** Camins de governança que esmenta una ordre (en minúscules, sense l'arrel absoluta), o el del directori de treball. */
function governancaDe(min, cwdRel, root) {
  const net = root ? min.split(`${String(root).toLowerCase()}/`).join('') : min;
  const trobats = GOVERNANCA_SHELL.filter(([, re]) => re.test(net)).map(([g]) => g);
  const cwd = cwdRel ? `${cwdRel.toLowerCase()}/` : '';
  if (cwd && esGovernanca(cwd)) trobats.push(cwdRel);
  return trobats;
}

export function esEscriptura(nom, args = {}) {
  return ESCRIPTURA.has(nom) || ARGS_CONTINGUT.some((k) => Object.hasOwn(args, k));
}

/** Ordre canònica de la porta Olivera o del relleu, escrita sola i des de l'arrel. */
export function esCanonica(ordre, cwdRel = '') {
  if (typeof ordre !== 'string' || cwdRel) return false;
  const neta = ordre.trim();
  if (/[;&|<>$`\\(){}\r\n*?!#~]/.test(neta) || neta.toLowerCase().includes('01_produccio')) return false;
  return ORDRES_CANONIQUES.some((re) => re.test(neta));
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

/** Destins de les redireccions d'una ordre (`>`, `>>`, `>|`, `| tee`), relatius a l'arrel; els de fora del repositori no hi són. */
export function destinsDeRedireccio(ordre, root, cwd = root) {
  const out = [];
  for (const m of ordre.matchAll(/(?:>>|>\||>|\|\s*tee(?:\s+-a)?)\s*(?:'([^']+)'|"([^"]+)"|([^\s;&|<>]+))/g)) {
    const rel = relatiu(root, m[1] || m[2] || m[3], cwd);
    if (rel) out.push(rel);
  }
  return out;
}

/** Destins de les redireccions d'una ordre que cauen al primer nivell de l'Escriptori. */
export function redireccionsAlTaulell(ordre, root, cwd = root) {
  return destinsDeRedireccio(ordre, root, cwd).filter((rel) => alPrimerNivell(rel) && esMd(rel));
}

/* ── Nucli pur ────────────────────────────────────────────────────────────── */

function preShell(args, root) {
  const ordre = ordreDe(args);
  if (ordre === null) return ask('Hook Olivera: run_command sense CommandLine; cap comprovació feta.');
  const cwd = typeof args.Cwd === 'string' && args.Cwd ? path.resolve(root, args.Cwd) : root;
  const cwdRel = relatiu(root, cwd) ?? (path.resolve(cwd) === path.resolve(root) ? '' : 'fora');
  if (esCanonica(ordre, cwdRel)) return ALLOW;

  const min = ordre.toLowerCase();
  if (min.includes('antigravity-hook.off')) {
    return forceAsk(`L'interruptor ${INTERRUPTOR} és del Mestre: apagar el hook necessita el seu permís.`);
  }
  const niuada = SHELL_NIUADA.test(min);
  const trasllat = niuada || VERB_TRASLLAT.test(min);
  const escriu = trasllat || VERB_ESCRIPTURA.test(min);
  // Dins d'una shell niuada el motiu ho diu: la decisió no ve d'un verb vist, sinó d'una ordre opaca.
  const forcat = (motiu) => forceAsk(`${niuada ? AVIS_NIUADA : ''}${motiu}`);
  const cwdMin = cwdRel.toLowerCase();
  const humana = min.includes('01_produccio') || zonaHumana(`${cwdMin}/`);
  const redireccions = destinsDeRedireccio(ordre, root, cwd);

  if ((escriu && humana) || redireccions.some(zonaHumana)) return forcat(`L'ordre escriu, mou o esborra en un camí que ${MOTIU_HUMANA}`);
  const autoprotegit = AUTOPROTEGITS_SHELL.find((p) => min.includes(p));
  if ((escriu && autoprotegit) || redireccions.some((r) => AUTOPROTEGITS.has(r.toLowerCase()) || r.toLowerCase().startsWith('.agents/runtime/'))) {
    return forcat(`L'ordre escriu en «${autoprotegit ?? '.agents/runtime/'}», que governa el hook d'Antigravity: és decisió del Mestre.`);
  }
  const governanca = governancaDe(min, cwdMin, root);
  if ((escriu && governanca.length) || redireccions.some(esGovernanca)) {
    const quins = [...governanca, ...redireccions.filter(esGovernanca)];
    return forcat(`L'ordre escriu, mou o esborra en un camí de governança (${[...new Set(quins)].join(', ')}): ${MOTIU_GOVERNANCA}`);
  }
  if (autoprotegit) return ask(`L'ordre toca «${autoprotegit}», que governa el hook d'Antigravity: és decisió del Mestre.`);
  if (humana) return ask(`L'ordre toca un camí que ${MOTIU_HUMANA}`);
  const tocaTaulell = min.includes('04_escriptori') || cwdMin === DESK || cwdMin.startsWith(`${DESK}/`);
  if (tocaTaulell && trasllat) return forcat(MOTIU_TRASLLAT);
  const redir = redireccions.filter((rel) => alPrimerNivell(rel) && esMd(rel));
  if (redir.length || (tocaTaulell && escriu)) {
    return ask(`Escriptura per shell a ${redir.join(', ') || DESK}: no passa per cap porta ni deixa rebut. Un document de l'Escriptori s'escriu amb l'eina d'edició, i un prompt o un pla naix de node tooling/wiki/document.mjs context → create.`);
  }
  return NEUTRE;
}

function motiuDeny(fitxer, errors) {
  const llista = errors.slice(0, MAX_ERRORS).map((e) => `- ${retalla(e)}`);
  if (errors.length > MAX_ERRORS) llista.push(`- … i ${errors.length - MAX_ERRORS} més`);
  return [
    `Porta Olivera · ${fitxer}`,
    ...llista,
    `Resol-ho ara (AGENTS §0.1): observa amb ${VIA_OLIVERA}, declara els vius a «## Activitat en curs» o arxiva amb --arxiva --nom (trasllat i relleu en un sol acte), i fes nàixer el document de la plantilla (node tooling/wiki/document.mjs context → create).`,
  ].join('\n');
}

/** Motiu d'un nom nou fora del catàleg, amb la categoria que l'autor ha triat i el remei si se sap. */
function motiuCataleg(rel, suggeriment = null) {
  const m = /^\d{6}_\d{4}_([^_.]+)/.exec(path.posix.basename(rel));
  const que = m ? `«${m[1]}» no és cap categoria del catàleg` : 'el nom no seguix aammdd_hhmm_categoria_titol.md';
  return `Hook Olivera · ${rel}: ${que} (tooling/wiki/taxonomia.json).${suggeriment ? ` ${suggeriment}.` : ''} Un document nou de l'Escriptori porta una categoria del catàleg, i un prompt o un pla naix de node tooling/wiki/document.mjs context → create.`;
}

function preEscriptura(args, { root, portes }) {
  const cami = typeof args.TargetFile === 'string' && args.TargetFile ? args.TargetFile : null;
  if (!cami) return ask("Hook Olivera: eina d'escriptura sense TargetFile; cap comprovació feta.");
  let rel = relatiu(root, cami);
  if (rel === null) return ask(`Hook Olivera: ${retalla(cami, 160)} és fora del repositori; cap porta el jutja i l'aprovació és del permís de l'IDE.`);
  if (zonaHumana(rel)) return forceAsk(`${rel} ${MOTIU_HUMANA}`);
  if (AUTOPROTEGITS.has(rel.toLowerCase())) return forceAsk(`${rel} governa el hook d'Antigravity: canviar-lo és decisió del Mestre.`);
  if (esGovernanca(rel)) return forceAsk(`${rel} ${MOTIU_GOVERNANCA}`);
  if (!alPrimerNivell(rel) || !esMd(rel)) return NEUTRE;
  if (path.posix.dirname(rel) !== DESK) {
    return ask(`Hook Olivera · ${rel}: el camí de l'Escriptori no porta la caixa canònica (${DESK}), i les portes no el reconeixerien. Escriu-lo amb la caixa real.`);
  }
  if (!portes) throw new Error('portes no carregades per a una escriptura a l’Escriptori');

  // APFS obri el fitxer existent amb qualsevol caixa del nom: les portes jutgen el
  // document real, no la grafia que ha triat l'eina (260930b).
  let jutjats = args;
  const real = portes.existix(rel) ? portes.nomReal?.(rel) : null;
  if (real && real !== path.posix.basename(rel)) {
    rel = `${DESK}/${real}`;
    jutjats = { ...args, TargetFile: path.join(root, rel) };
  }

  const nom = path.posix.basename(rel);
  // Un nom parany (planificacio_*) no és al catàleg, però sí vigilat: va a les portes, que diuen el prefix bo.
  if (!portes.existix(rel) && !portes.enCataleg(nom) && !portes.vigilat(nom)) return ask(motiuCataleg(rel, portes.suggeriment?.(nom)));
  if (!portes.esPetorreta(rel) && !portes.vigilat(nom)) return NEUTRE;
  if (args.AllowMultiple === true && (args.StartLine !== undefined || args.EndLine !== undefined)) {
    return ask(`Hook Olivera · ${rel}: edició AllowMultiple limitada per línies; no es pot reconstruir el document. Escriu-lo sencer o demana permís.`);
  }

  let op;
  try { op = portes.operacio({ toolArgs: sensePosicions(jutjats), cwd: root }); }
  catch (e) { return ask(`Hook Olivera · ${rel}: ${retalla(e.message)}. No es pot reconstruir el document; escriu-lo sencer (write_to_file) o demana permís.`); }
  if (!op || op.fora || typeof op.contingut !== 'string') {
    return ask(`Hook Olivera · ${rel}: la porta documental no reconeix la ruta; cap comprovació feta.`);
  }

  const fitxer = op.fitxer;
  const errors = [];
  // D11: la porta sap si la petorreta naix (taula, pla i secció 0) o ja és nascuda (secció 0).
  if (portes.esPetorreta(fitxer)) errors.push(...portes.olivera(fitxer, op.contingut));
  errors.push(...portes.plantilla(fitxer, op.contingut).map((e) => `[Plantilla viva] ${e}`));
  if (errors.length) return { decision: 'deny', reason: motiuDeny(fitxer, errors) };
  return ask(`Porta Olivera i Plantilla viva sense errors per a ${fitxer}; l'aprovació és del permís de l'IDE.`);
}

/** PreToolUse. `portes` només cal quan `calenPortes` ho diu; si falta, llança i el cridador pregunta. */
export function preTool(payload, { root, portes = null } = {}) {
  const crida = payload?.toolCall;
  const nom = crida?.name;
  if (typeof nom !== 'string' || !nom) return ask('Hook Olivera: payload sense toolCall.name; cap comprovació feta.');
  const args = argsDe(crida);
  if (nom === 'run_command') return preShell(args, root);
  if (!esEscriptura(nom, args)) return LECTURES.includes(nom) ? ALLOW : NEUTRE;
  return preEscriptura(args, { root, portes });
}

export function missatgeTaula(errors = []) {
  const llista = Array.isArray(errors) ? errors : [];
  const mostra = llista.slice(0, 3).map((e) => retalla(e, 160)).join(' · ');
  const mes = llista.length > 3 ? ` (+${llista.length - 3})` : '';
  return `[Escriptori brut · AGENTS §0.1] ${mostra || 'la porta no diu per què'}${mes}. Resol-ho en este torn, abans de redactar cap prompt o pla: observa (${VIA_OLIVERA}) → actua (declara els vius a «## Activitat en curs», arxiva la resta amb --arxiva --sec i després --arxiva, mai a mà) → verifica (la porta ix amb 0) → informa (una línia al Mestre).`;
}

/** PreInvocation: la taula neta no diu res; la bruta ho diu una vegada per crida, curt. */
export function preInvocation({ portes = null } = {}) {
  if (!portes) throw new Error('portes no carregades per a comprovar la taula');
  const r = portes.taula();
  if (!r || typeof r.valid !== 'boolean') throw new Error('checkTaula ha tornat un resultat il·legible');
  return r.valid ? {} : { injectSteps: [{ ephemeralMessage: missatgeTaula(r.errors) }] };
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
  if (mode === 'pre-invocation') return preInvocation(ctx);
  throw new Error(`mode desconegut «${mode ?? ''}»`);
}

/** Resposta davant qualsevol error: pregunta (pre-tool) o avisa que no s'ha pogut mirar (pre-invocation). */
export function perError(mode, error) {
  const m = retalla(error?.message ?? error);
  return mode === 'pre-invocation'
    ? { injectSteps: [{ ephemeralMessage: `[Hook Olivera] no s'ha pogut comprovar l'Escriptori (${m}). Comprova-ho a mà amb ${VIA_OLIVERA} i avisa el Mestre.` }] }
    : ask(`Hook Olivera: error intern (${m}); cap comprovació feta.`);
}

/* ── Procés ───────────────────────────────────────────────────────────────── */

async function carregaPortes(tipus, root) {
  const olivera = await import('./porta-olivera.mjs');
  if (tipus === 'taula') {
    if (typeof olivera.checkTaula !== 'function') throw new Error('porta-olivera.mjs no exporta checkTaula: cal la porta v3');
    return { taula: () => olivera.checkTaula(root) };
  }
  const [reflex, viva, taxonomia] = await Promise.all([import('./porta-reflex.mjs'), import('./porta-plantilla-viva.mjs'), import('./porta-taxonomia.mjs')]);
  // El catàleg és el de l'arbre d'este script: és codi, com les portes, i no depén de l'arrel jutjada.
  const cataleg = taxonomia.carregaConfig(fileURLToPath(new URL('../..', import.meta.url)));
  return {
    esPetorreta: (rel) => olivera.esPetorreta(rel),
    vigilat: (nom) => viva.vigilat(nom),
    suggeriment: (nom) => (typeof viva.suggeriment === 'function' ? viva.suggeriment(nom) : null),
    existix: (rel) => fs.existsSync(path.join(root, rel)),
    // El nom tal com és al disc: el mateix si hi és, o l'únic que hi casa sense distingir caixa.
    nomReal: (rel) => {
      const nom = path.posix.basename(rel);
      const entrades = fs.readdirSync(path.join(root, path.posix.dirname(rel)));
      if (entrades.includes(nom)) return nom;
      const iguals = entrades.filter((n) => n.toLowerCase() === nom.toLowerCase());
      return iguals.length === 1 ? iguals[0] : null;
    },
    enCataleg: (nom) => Object.hasOwn(cataleg.exempts ?? {}, nom) || Boolean(taxonomia.analitzaNom(nom, cataleg).categoria),
    operacio: (payload) => reflex.normalitza(payload, root),
    olivera: (fitxer, contingut) => olivera.checkPetorreta(root, fitxer, contingut).errors,
    plantilla: (rel, contingut) => viva.inspeccionaText(root, rel, contingut).errors,
  };
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

/** Arrel del hook (D6): SDP_ARREL, o la de tooling/lib/arrel.mjs; el cwd (`cd ..` de l'IDE) només si no n'hi ha. */
async function arrelDelHook() {
  if (process.env.SDP_ARREL) return path.resolve(process.env.SDP_ARREL);
  try {
    const { arrelSegura } = await import('../lib/arrel.mjs');
    return arrelSegura();
  } catch { return path.resolve(process.cwd()); }
}

async function main(argv) {
  const mode = argv[0];
  const root = await arrelDelHook();
  // stdin es buida sempre: l'IDE hi escriu el payload sencer i no ha de trobar la canonada tancada.
  const { payload, error } = llegeixPayload();
  if (fs.existsSync(path.join(root, INTERRUPTOR))) {
    // Apagat no vol dir obert: cap comprovació, però la decisió torna a l'IDE i queda traça.
    traca(root, { mode: mode ?? null, eina: payload?.toolCall?.name ?? null, decisio: 'apagat' });
    escriu(mode === 'pre-tool' ? APAGAT : {});
    return;
  }

  let eixida;
  try {
    if (!MODES.includes(mode)) throw new Error(`mode desconegut «${mode ?? ''}»`);
    if (mode === 'pre-tool' && error) throw new Error(error);
    const tipus = calenPortes(mode, payload, root);
    const portes = tipus ? await carregaPortes(tipus, root) : null;
    eixida = decidix(mode, payload, { root, portes });
  } catch (e) {
    eixida = perError(mode, e);
  }

  const args = argsDe(payload?.toolCall);
  const ordre = ordreDe(args);
  traca(root, {
    mode: mode ?? null,
    eina: payload?.toolCall?.name ?? null,
    fitxer: relatiu(root, args.TargetFile) ?? (args.TargetFile ? 'fora del repositori' : null),
    ...(ordre !== null ? { ordre: retalla(emmascara(ordre), 200) } : {}),
    decisio: eixida.decision ?? (eixida.injectSteps ? 'injecta' : 'res'),
    ...(eixida.reason ? { motiu: retalla(emmascara(eixida.reason), 200) } : {}),
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
