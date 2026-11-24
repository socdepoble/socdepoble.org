#!/usr/bin/env node
/**
 * frontissa-contingut.mjs — Frontissa de contingut estructural.
 *
 * DESTÍ: tooling/gates/frontissa-contingut.mjs (en quarantena al laboratori).
 *
 * PER QUÈ EXISTIX
 *   El 24-09 un refactor nocturn va reanomenar la clau `wikidepoble` de
 *   PAGE_COPY a `skills`. El Mur va descartar la targeta en silenci i la
 *   portada de la Wiki es va quedar sense text. Cap porta ho va dir, i el dany
 *   ja era a HEAD: «restaurar el fitxer» haguera restaurat el dany.
 *
 * QUÈ FA (només lectura, excepte les ordres de registre, que són humanes)
 *   1. Importa l'objecte real `PAGE_COPY` (no busca text: un comentari que
 *      mencione una clau no la fa existir).
 *   2. Deriva les claus obligatòries dels consumidors: SYSTEM_PAGES i
 *      COVER_PAGE_KEYS de src/config/systemPages.js, i els `pageKey` de
 *      src/config/sections.js. Una clau demanada i absent fa fallar la porta.
 *   3. Compara l'empremta de cada clau (SHA-256 del valor serialitzat i
 *      longitud de l'HTML) amb el registre .agents/contingut_estructural.json.
 *      Una empremta nova només passa si algú l'aprova, i l'aprovació queda
 *      lligada exactament a eixa empremta: no val per a un altre canvi.
 *   4. Un retall de l'HTML del 30% o més no s'aprova sense --accepta-retall.
 *
 * ON S'EXECUTA
 *   · primer pas de .husky/pre-commit, abans i fora de run-portes.mjs;
 *   · CI; · el Mapa de la Consola (mètrica integritat-contingut).
 *
 * ÚS
 *   node tooling/gates/frontissa-contingut.mjs                 # comprova (exit 1 si falla)
 *   node tooling/gates/frontissa-contingut.mjs --json
 *   node tooling/gates/frontissa-contingut.mjs --inicia --per NOM --motiu "..."
 *   node tooling/gates/frontissa-contingut.mjs --aprova CLAU --per NOM --motiu "..." [--accepta-retall]
 *   node tooling/gates/frontissa-contingut.mjs --retira CLAU --per NOM --motiu "..."
 *
 *   Via agent: afegix --pla --session ID per a revisar/vincular el pla sense escriure;
 *   després executa la mateixa ordre amb --session ID --rebut CAMÍ (sense --pla).
 *
 * Les tres últimes usen CAS durable i auditoria; en TTY sense sessió activa no
 * requerixen IA. Via agent: --session ID [--rebut CAMÍ] i claim Reflex. El diff
 * del registre és el que es revisa abans de fusionar.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import {readState, safePath, durableMutation, digest} from '../lib/mutacio-durable.mjs';

export const REGISTRE = '.agents/contingut_estructural.json';
export const ESQUEMA_REGISTRE = 'sdp.contingut.v1';
export const RETALL_MAXIM = 0.3;
export const RECUPERACIO = 'No restaures fitxers sencers: si el dany ja és a HEAD, HEAD és el dany. '
  + 'Recupera només la clau afectada des de refs/time-machine/<branca> (node tooling/brain/time-machine.mjs --llista src/sections/text/pageContent.js) '
  + 'o des del commit anterior, seguint la skill core-restauracio-segellada.';

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

export function empremta(valor) {
  return {
    sha256: sha256(JSON.stringify(valor)),
    html: typeof valor?.html === 'string' ? valor.html.length : 0
  };
}

/**
 * Claus que la interfície necessita. sections.js importa icones de
 * lucide-react i no es carrega en node sense el paquet del navegador; els seus
 * `pageKey` són literals de configuració i es lligen del text. Un literal
 * comentat només faria la porta més estricta, mai més fluixa.
 */
export async function carregaContingut(arrel) {
  const importa = (rel) => import(pathToFileURL(path.join(arrel, rel)).href);
  const { PAGE_COPY } = await importa('src/sections/text/pageContent.js');
  const { SYSTEM_PAGES, COVER_PAGE_KEYS } = await importa('src/config/systemPages.js');
  const seccions = fs.readFileSync(path.join(arrel, 'src/config/sections.js'), 'utf8');
  const pageKeys = [...seccions.matchAll(/\bpageKey:\s*['"]([\w-]+)['"]/g)].map((m) => m[1]);
  const requerides = [...new Set([
    ...SYSTEM_PAGES.map((p) => p.key),
    ...Object.values(COVER_PAGE_KEYS),
    ...pageKeys
  ])].sort();
  return { PAGE_COPY, requerides };
}

export function validaRegistre(r) {
  if (r?.schema !== ESQUEMA_REGISTRE || !r.claus || Array.isArray(r.claus) || typeof r.claus !== 'object'
    || Object.keys(r).some(k => !['schema', 'claus'].includes(k))) throw new Error(`${REGISTRE} no és un registre ${ESQUEMA_REGISTRE}`);
  for (const [key, value] of Object.entries(r.claus)) {
    if (!clauValida(key) || !value || !/^[a-f0-9]{64}$/.test(value.sha256 || '') || !Number.isSafeInteger(value.html) || value.html < 0
      || typeof value.aprovat_per !== 'string' || !value.aprovat_per.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(value.data || '')
      || Object.keys(value).some(k => !['sha256', 'html', 'aprovat_per', 'data'].includes(k))) throw new Error(`Entrada de registre invàlida: ${key}`);
  }
  return r;
}
function clauValida(value) { return typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value) && !['__proto__', 'prototype', 'constructor'].includes(value); }
function textExplicit(value, name) {
  if (typeof value !== 'string' || !value.trim() || value.length > 4096 || /[\x00-\x1f\x7f]/.test(value)) throw new Error(`Cal ${name} explícit i no buit`);
  return value.trim();
}
/** Also applied by the generic executor: its registry target cannot bypass the policy. */
export function validaMutacioRegistre(before, content, meta) {
  const next = validaRegistre(JSON.parse(content));
  if (!meta || Object.keys(meta).some(k => !['action', 'key', 'actor', 'reason', 'acceptaRetall'].includes(k)) || !['inicia', 'aprova', 'retira'].includes(meta.action) || typeof meta.acceptaRetall !== 'boolean') throw new Error('Pla Frontissa incomplet');
  textExplicit(meta.actor, '--per'); textExplicit(meta.reason, '--motiu');
  if (meta.action === 'inicia') {
    if (before !== null || meta.key !== null || meta.acceptaRetall) throw new Error('CAS d’inici invàlid');
    if (Object.values(next.claus).some(v => v.aprovat_per !== meta.actor)) throw new Error('Actor divergent');
    return;
  }
  if (before === null || !clauValida(meta.key)) throw new Error('CAS Frontissa invàlid');
  const previous = validaRegistre(JSON.parse(before)), key = meta.key;
  const expectedKeys = new Set(Object.keys(previous.claus));
  if (meta.action === 'aprova') expectedKeys.add(key); else expectedKeys.delete(key);
  if (Object.keys(next.claus).length !== expectedKeys.size || Object.keys(next.claus).some(k => !expectedKeys.has(k))) throw new Error('Conjunt de claus divergent');
  for (const k of expectedKeys) if (k !== key && JSON.stringify(previous.claus[k]) !== JSON.stringify(next.claus[k])) throw new Error('Canvi alié a la clau aprovada');
  if (meta.action === 'retira') {
    if (!Object.hasOwn(previous.claus, key) || meta.acceptaRetall) throw new Error('Retirada invàlida');
  } else {
    if (next.claus[key].aprovat_per !== meta.actor) throw new Error('Actor divergent');
    if (retall(previous.claus[key], next.claus[key]) >= RETALL_MAXIM && !meta.acceptaRetall) throw new Error('Retall sense --accepta-retall i --motiu');
  }
}
export function llegeixRegistre(arrel) {
  const state = readState(arrel, REGISTRE);
  return state.bytes === null ? null : validaRegistre(JSON.parse(state.bytes));
}
function serialitzaRegistre(registre) {
  const claus = Object.fromEntries(Object.keys(registre.claus).sort().map(k => [k, registre.claus[k]]));
  return `${JSON.stringify({schema: ESQUEMA_REGISTRE, claus}, null, 2)}\n`;
}

/** Retall relatiu de l'HTML respecte del registrat (0 si no ha minvat). */
export function retall(registrat, actual) {
  if (!registrat?.html) return 0;
  return Math.max(0, 1 - actual.html / registrat.html);
}

export function comprova({ PAGE_COPY, requerides }, registre) {
  const claus = registre?.claus ?? null;
  const obligatories = [...new Set([...requerides, ...(claus ? Object.keys(claus) : [])])].sort();
  const errors = [];
  let correctes = 0;
  if (!claus) {
    errors.push({ clau: null, codi: 'registre-absent',
      missatge: `Falta ${REGISTRE}: sense empremtes només es comprova la presència. Inicia'l amb --inicia --per NOM --motiu "..." (decisió humana).` });
  }
  for (const clau of obligatories) {
    const valor = PAGE_COPY?.[clau];
    if (valor === undefined) {
      errors.push({ clau, codi: 'absent',
        missatge: `La clau «${clau}» falta a PAGE_COPY i un consumidor la demana (o el registre la protegix).` });
      continue;
    }
    if (!claus) continue;
    const registrada = claus[clau];
    if (!registrada) {
      errors.push({ clau, codi: 'sense-registre',
        missatge: `La clau «${clau}» és obligatòria i no té empremta aprovada. Aprova-la amb --aprova ${clau} --per NOM.` });
      continue;
    }
    const actual = empremta(valor);
    if (actual.sha256 !== registrada.sha256) {
      const r = retall(registrada, actual);
      errors.push({ clau, codi: r >= RETALL_MAXIM ? 'retall' : 'empremta-divergent',
        missatge: r >= RETALL_MAXIM
          ? `La clau «${clau}» ha perdut el ${Math.round(r * 100)}% de l'HTML (${registrada.html} → ${actual.html} caràcters).`
          : `La clau «${clau}» ha canviat des de l'última aprovació (${registrada.aprovat_per ?? '?'}, ${registrada.data ?? '?'}).`,
        actual, registrada });
      continue;
    }
    correctes += 1;
  }
  return { valid: errors.length === 0, requerides: obligatories.length, correctes: claus ? correctes : null, errors };
}

function opcions(argv) {
  const out = {}, values = new Set(['aprova', 'retira', 'per', 'motiu', 'session', 'rebut', 'arrel']);
  const flags = new Set(['inicia', 'accepta-retall', 'json', 'pla']);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i], equal = arg.indexOf('='), name = arg.slice(2, equal < 0 ? undefined : equal);
    if (!arg.startsWith('--') || (!values.has(name) && !flags.has(name)) || Object.hasOwn(out, name)) throw new Error(`Opció desconeguda o ambigua: ${arg}`);
    if (flags.has(name)) { if (equal >= 0) throw new Error(`Bandera ambigua: ${arg}`); out[name] = true; }
    else {
      const value = equal < 0 ? argv[++i] : arg.slice(equal + 1);
      if (!value || value.startsWith('--')) throw new Error(`Falta valor de --${name}`);
      out[name] = value;
    }
  }
  const actions = ['inicia', 'aprova', 'retira'].filter(k => Object.hasOwn(out, k));
  if (actions.length > 1) throw new Error('Ordres ambigües: només una ordre de mutació');
  if (!actions.length && Object.keys(out).some(k => !['json', 'arrel'].includes(k))) throw new Error('Opcions de mutació sense ordre');
  if (actions.length) {
    if (out.json) throw new Error('--json és només de comprovació');
    if (out.pla && (!out.session || out.rebut)) throw new Error('--pla necessita --session i no admet --rebut');
    if (out['accepta-retall'] && !out.aprova) throw new Error('--accepta-retall només amb --aprova');
    out.per = textExplicit(out.per, '--per'); out.motiu = textExplicit(out.motiu, '--motiu');
    if (out.aprova && !clauValida(out.aprova) || out.retira && !clauValida(out.retira)) throw new Error('Clau no autoritzada');
  }
  return Object.freeze(out);
}
function contextAgent(arrel, snapshot) {
  if (snapshot.automated) return {agent: true, session: null};
  const active = readState(arrel, '.sdp-reflex/active.json');
  if (active.bytes) {
    const marker = JSON.parse(active.bytes);
    if (!/^[a-f0-9-]{36}$/.test(marker.sessionId || '')) throw new Error('Marcador de sessió invàlid');
    const receipt = JSON.parse(readState(arrel, `.sdp-reflex/sessions/${marker.sessionId}.json`).bytes);
    if (receipt.sessionId !== marker.sessionId || !['sealed', 'consumed', 'open'].includes(receipt.status)) throw new Error('Estat de sessió invàlid');
    const expiry = Date.parse(receipt.leaseExpiresAt || receipt.openExpiresAt);
    if (!Number.isFinite(expiry)) throw new Error('Caducitat de sessió invàlida');
    if (receipt.status !== 'consumed' && expiry > snapshot.now) return {agent: true, session: marker.sessionId};
  }
  if (readState(arrel, '.agents/TORN_ACTIU.json').bytes) return {agent: true, session: null};
  const turns = safePath(arrel, '.agents/runtime/turns');
  if (fs.existsSync(turns)) for (const name of fs.readdirSync(turns)) {
    if (!/^torn_[a-f0-9-]{36}\.json$/.test(name)) throw new Error('Nom de torn invàlid');
    const turn = JSON.parse(readState(arrel, `.agents/runtime/turns/${name}`).bytes);
    if (!['opened', 'context_loaded', 'planned', 'verified', 'closed'].includes(turn.state) || !Number.isFinite(Date.parse(turn.expiresAt))) throw new Error('Estat de torn invàlid');
    if (turn.state !== 'closed' && Date.parse(turn.expiresAt) > snapshot.now) return {agent: true, session: null};
  }
  return {agent: !snapshot.tty, session: null};
}
// Only internal tests supply authorize/session. The real CLI always uses real TTY/Reflex.
export async function executa(argv, arrel = arrelSegura(), dependencies = {}) {
  const invocation = Object.freeze([...argv]);
  const config = opcions(invocation);
  const snapshot = Object.freeze({tty: process.stdin.isTTY === true && process.stdout.isTTY === true, now: Date.now(),
    automated: ['CI', 'SDP_AGENT', 'SDP_SESSION', 'SDP_TURN_ID', 'CODEX_THREAD_ID', 'CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT', 'GEMINI_CLI'].some(k => Boolean(process.env[k]) && process.env[k] !== 'false' && process.env[k] !== '0')});
  const injectedAuthorize = dependencies.authorize, injectedSession = dependencies.session;
  arrel = fs.realpathSync(arrel);
  if (config.arrel && fs.realpathSync(config.arrel) !== arrel) throw new Error('Arrel de la invocació divergent');
  const initialContext = config.inicia || config.aprova || config.retira ? contextAgent(arrel, snapshot) : null;
  const before = readState(arrel, REGISTRE);
  const registre = before.bytes === null ? null : validaRegistre(JSON.parse(before.bytes));
  const contingut = await carregaContingut(arrel);
  const avui = new Date(snapshot.now).toISOString().slice(0, 10);
  let result;
  if (config.inicia) {
    if (registre) throw new Error(`${REGISTRE} ja existix; usa --aprova per a cada canvi.`);
    const absents = contingut.requerides.filter(k => !Object.hasOwn(contingut.PAGE_COPY, k));
    if (absents.length) throw new Error(`No s’inicia un registre amb claus absents: ${absents.join(', ')}`);
    result = {accio: 'inicia', claus: contingut.requerides.length};
  } else if (config.aprova) {
    if (!registre) throw new Error(`Falta ${REGISTRE}; primer --inicia.`);
    if (!Object.hasOwn(contingut.PAGE_COPY, config.aprova)) throw new Error(`La clau «${config.aprova}» no existix a PAGE_COPY: no hi ha res a aprovar. ${RECUPERACIO}`);
    const actual = empremta(contingut.PAGE_COPY[config.aprova]);
    if (retall(registre.claus[config.aprova], actual) >= RETALL_MAXIM && !config['accepta-retall']) throw new Error(`La clau «${config.aprova}» ha perdut HTML. Si és volgut, repeteix amb --accepta-retall i --motiu.`);
    registre.claus[config.aprova] = {...actual, aprovat_per: config.per, data: avui};
    result = {accio: 'aprova', clau: config.aprova, sha256: actual.sha256};
  } else if (config.retira) {
    if (!registre || !Object.hasOwn(registre.claus, config.retira)) throw new Error(`La clau «${config.retira}» no és al registre.`);
    if (contingut.requerides.includes(config.retira)) throw new Error(`La clau «${config.retira}» encara la demana un consumidor: primer lleva-la del consumidor.`);
    delete registre.claus[config.retira]; result = {accio: 'retira', clau: config.retira};
  } else {
    const result = comprova(contingut, registre);
    if (readState(arrel, '.agents/runtime/mutation.pending.json').bytes !== null) {
      result.valid = false; result.errors.push({clau: null, codi: 'operacio-incompleta', missatge: 'Mutació pendent: revisa preimatges, bytes i auditoria abans de reconciliar.'});
    }
    return result;
  }

  const next = config.inicia ? {claus: Object.fromEntries(contingut.requerides.map(k => [k, {...empremta(contingut.PAGE_COPY[k]), aprovat_per: config.per, data: avui}]))} : registre;
  const content = serialitzaRegistre(next), meta = Object.freeze({action: result.accio, key: result.clau || null, actor: config.per, reason: config.motiu, acceptaRetall: Boolean(config['accepta-retall'])});
  validaMutacioRegistre(before.bytes?.toString('utf8') ?? null, content, meta);
  const makePlan = session => ({schema: 'sdp.mutation.v1', session, operationId: `frontissa-${result.accio}`, frontissa: meta, files: [{path: REGISTRE, before: before.hash, content}]});
  if (config.pla) { const plan = makePlan(config.session); return {plan, planDigest: digest(JSON.stringify(plan))}; }
  const currentContext = contextAgent(arrel, snapshot);
  const context = {agent: initialContext.agent || currentContext.agent, session: initialContext.session || currentContext.session};
  let transaction;
  if (context.agent || config.session || config.rebut || injectedAuthorize || injectedSession) {
    const session = config.session || injectedSession || context.session;
    if (!session) throw new Error('Via agent/automatitzada: cal --session i rebut Reflex; la via humana sense IA necessita TTY sense sessió activa.');
    const {executeMutation, reflexAuthorization} = await import('./executor-mutacio.mjs');
    const plan = makePlan(session);
    transaction = await executeMutation(arrel, plan, injectedAuthorize || reflexAuthorization(arrel, plan, config.rebut));
  } else {
    transaction = await durableMutation(arrel, [{path: REGISTRE, before: before.hash, content}], {metadata: {kind: 'frontissa-human', ...meta, invocation}});
  }
  return {...result, transaction: transaction.id, before: before.hash, after: digest(content)};
}

async function main() {
  const argv = process.argv.slice(2);
  const r = await executa(argv);
  if (r.plan) { console.log(JSON.stringify(r, null, 2)); return; }
  if (r.accio) {
    console.log(`✅ [Frontissa] ${r.accio}${r.clau ? ` · ${r.clau}` : ''}${r.claus ? ` · ${r.claus} claus` : ''}`);
    return;
  }
  if (argv.includes('--json')) console.log(JSON.stringify(r, null, 2));
  else if (r.valid) console.log(`✅ [Frontissa] ${r.correctes}/${r.requerides} claus estructurals amb empremta aprovada.`);
  else {
    console.error(`❌ [Frontissa] ${r.errors.length} problema(es) de contingut estructural:`);
    for (const e of r.errors) console.error(`   · ${e.missatge}`);
    if (r.errors.some((e) => e.codi === 'absent' || e.codi === 'retall')) console.error(`   ${RECUPERACIO}`);
  }
  process.exitCode = r.valid ? 0 : 1;
}

if (esMain(import.meta.url)) {
  main().catch((e) => { console.error(`[Frontissa] ${e.message}`); process.exitCode = 2; });
}
