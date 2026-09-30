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
 *
 *  Què fa:
 *    pre-tool        · escriure un prompt, una petorreta o un pla al primer nivell
 *                      de l'Escriptori: `deny` si la Plantilla viva o la Porta
 *                      Olivera hi troben errors, amb el motiu i la via de sortida;
 *                    · `run_command` amb `mv` que toca `04_escriptori`: `ask` (el
 *                      trasllat a mà deixa àncores fantasma a l'índex);
 *                    · `run_command` que redirigix (`>`, `>>`, `| tee`) a un
 *                      document del primer nivell: `ask` (el contingut no es pot
 *                      jutjar, i és la via per on van nàixer documents sense rebut);
 *                    · la resta: `allow`.
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
 *      torna `allow` (o `{}`) sense comprovar ni traçar res. És del Mestre: una
 *      escriptura de MarIA a l'interruptor, a hooks.json o a este fitxer pregunta.
 *    · Traça d'una línia per invocació a `.agents/runtime/antigravity-hook.log`
 *      (fora de git per `*.log`): és l'única acreditació que l'IDE executa el hook.
 *    · stdin només es llig si no és un terminal: executat a mà no es penja (la
 *      lliçó de la porta Olivera antiga, que esperava un EOF que no arribava).
 *
 *  Nucli pur: `preTool` i `preInvocation` reben les portes per paràmetre. Els
 *  imports reals (`./porta-olivera.mjs`, `./porta-reflex.mjs`,
 *  `./porta-plantilla-viva.mjs`) es fan amb `import()` dins de `main()`, i només
 *  quan la decisió els necessita: un `view_file` no paga cap càrrega, i el nucli
 *  es prova amb portes falses.
 *
 *  Ús (des de l'arrel; l'IDE ho fa amb `cd ..` des de `.agents/`):
 *    node tooling/gates/antigravity-hook.mjs pre-tool        < payload.json
 *    node tooling/gates/antigravity-hook.mjs pre-invocation  < payload.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const DESK = '_wiki_de_poble/04_escriptori';
export const INTERRUPTOR = '.agents/runtime/antigravity-hook.off';
export const TRACA = '.agents/runtime/antigravity-hook.log';
export const MODES = Object.freeze(['pre-tool', 'pre-invocation']);

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
const MAX_ERRORS = 12;

const VIA_OLIVERA = 'node tooling/gates/porta-olivera.mjs';
const MOTIU_MV = `Trasllat a mà dins de l'Escriptori: deixa àncores fantasma a l'índex i no avisa cap rebut. Via canònica (AGENTS §0.1): ${VIA_OLIVERA} --arxiva [--nom aammdd_hhmm_categoria_titol.md] [--sec].`;

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

/** Destins de les redireccions d'una ordre que cauen al primer nivell de l'Escriptori. */
export function redireccionsAlTaulell(ordre, root, cwd = root) {
  const out = [];
  for (const m of ordre.matchAll(/(?:>>?|\|\s*tee(?:\s+-a)?)\s*(?:'([^']+)'|"([^"]+)"|([^\s;&|<>]+))/g)) {
    const rel = relatiu(root, m[1] || m[2] || m[3], cwd);
    if (rel && alPrimerNivell(rel) && esMd(rel)) out.push(rel);
  }
  return out;
}

/* ── Nucli pur ────────────────────────────────────────────────────────────── */

function preShell(args, root) {
  const ordre = typeof args.CommandLine === 'string' ? args.CommandLine : typeof args.Command === 'string' ? args.Command : null;
  if (ordre === null) return ask('Hook Olivera: run_command sense CommandLine; cap comprovació feta.');
  if (ordre.includes('antigravity-hook.off')) {
    return ask(`L'interruptor ${INTERRUPTOR} és del Mestre: apagar el hook necessita el seu permís.`);
  }
  const cwd = typeof args.Cwd === 'string' && args.Cwd ? path.resolve(root, args.Cwd) : root;
  const cwdRel = relatiu(root, cwd) ?? '';
  const tocaTaulell = ordre.includes('04_escriptori') || cwdRel === DESK || cwdRel.startsWith(`${DESK}/`);
  if (tocaTaulell && /(?:^|[\s;&|(`])mv(?=\s|$)/.test(ordre)) return ask(MOTIU_MV);
  const redir = redireccionsAlTaulell(ordre, root, cwd);
  if (redir.length) {
    return ask(`Escriptura per shell a ${redir.join(', ')}: no passa per cap porta ni deixa rebut. Un document de l'Escriptori s'escriu amb l'eina d'edició, i un prompt o un pla naix de node tooling/wiki/document.mjs context → create.`);
  }
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
  if (zonaHumana(rel)) return ask(`${rel} és a la zona humana (01_produccio): només amb ordre directa i explícita del Mestre (AGENTS §12).`);
  if (AUTOPROTEGITS.has(rel)) return ask(`${rel} governa el hook d'Antigravity: canviar-lo és decisió del Mestre.`);
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
  const [reflex, viva] = await Promise.all([import('./porta-reflex.mjs'), import('./porta-plantilla-viva.mjs')]);
  return {
    esPetorreta: (rel) => olivera.esPetorreta(rel),
    vigilat: (nom) => viva.vigilat(nom),
    operacio: (payload) => reflex.normalitza(payload, root),
    olivera: (contingut) => olivera.checkOlivera(root, { contingut }).errors,
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
    eixida = decidix(mode, payload, { root, portes });
  } catch (e) {
    eixida = perError(mode, e);
  }

  const args = argsDe(payload?.toolCall);
  traca(root, {
    mode: mode ?? null,
    eina: payload?.toolCall?.name ?? null,
    fitxer: relatiu(root, args.TargetFile) ?? (args.TargetFile ? 'fora del repositori' : null),
    decisio: eixida.decision ?? (eixida.injectSteps ? 'injecta' : 'res'),
    ...(eixida.reason ? { motiu: retalla(eixida.reason, 200) } : {}),
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
