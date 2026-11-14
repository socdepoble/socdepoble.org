#!/usr/bin/env node
/** P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · Capa 2, la part segura: LA SENTINELLA
 * de frescor i de retirada del prerender social. Només llig (GET), no desplega res i no
 * necessita cap credencial nova: fa servir la clau anon del build, com la projecció.
 *
 * El prerender és una foto: una entitat creada, reanomenada, amagada o esborrada entre
 * dos desplegaments continua servida amb el head vell (o amb el genèric) fins a la release
 * següent. La sentinella ho detecta i diu què cal fer:
 *   1. Torna a fer, en memòria, la projecció pública i el manifest amb les MATEIXES
 *      funcions del build (projeccioPublica i buildSocialManifest): el que s'hauria de
 *      servir hui.
 *   2. Als DOS orígens (socdepoble.org i socdepoble.cat) demana, sense JavaScript, la
 *      canònica de cada fitxa pública, els àlies que l'app emet per id (/empresa/<id> i
 *      /entitats/<id>) i, amb el rebut, tots els seus àlies; i baixa cada og:image.
 *   3. Informa de:
 *        · FALTANTS   una fitxa pública sense head propi en un origen, o el directori
 *                     tallat pel sostre;
 *        · CADUCADES  el títol, la descripció o la imatge servits ja no són els de hui,
 *                     o la imatge no és un JPEG de 1200x630 i 300.000 B com a molt;
 *        · RETIRADES  un camí o una imatge del rebut, d'origen veïnal, que ja no hauria
 *                     de ser servit (la fitxa ja no és pública, o ara queda exclosa) i
 *                     encara ho és. És privadesa: urgent.
 * Codis d'eixida: 0 fresc · 3 cal una re-release · 4 retirada pendent en algun origen ·
 * 5 no verificable (sense el rebut no se sap què hi ha desplegat: mai 0) · 1 error.
 *
 *   node tooling/seo/sentinella-social.mjs --root . [--rebut REBUT.json] [--origen https://socdepoble.org --origen https://socdepoble.cat]
 *
 * El rebut és el fitxer privat que escriu el prerender (rebut-social.json), mai publicat.
 * Mai imprimix la clau ni cap URL de Storage.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {CAP_SOCIAL_BASE} from '../../src/config/imatgeSocial.js';
import {buildSocialManifest, CAMI_PUBLIC_DE_STORAGE} from './build-social-manifest.mjs';
import {sniffImage} from './jpeg-social.mjs';
import {cosFitat} from './lectura-anonima.mjs';
import {entornDelBuild, projeccioPublica, variablesDelBuild} from './projeccio-publica.mjs';

export const ORIGENS_PER_DEFECTE = Object.freeze(['https://socdepoble.org', 'https://socdepoble.cat']);
export const CODIS = Object.freeze({fresc: 0, error: 1, reRelease: 3, retirada: 4, noVerificable: 5});
const ORIGEN_CANONIC = 'https://socdepoble.org';
const TERMINI = 8000;
const MAX_HTML = 1024 * 1024;
const MAX_IMATGE = 600 * 1024;
const PES_SOCIAL = 300_000;
const EN_PARALLEL = 6;
const sha = text => createHash('sha256').update(text).digest('hex');
const ENTITATS = Object.freeze({'&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'"});
const descodifica = text => String(text).replace(/&(?:amp|lt|gt|quot|#39);/g, entitat => ENTITATS[entitat]);

/** El head social d'un HTML servit, sense executar res: { marcat, title, description, image }. */
export function headServit(html) {
  const text = String(html);
  const cap = text.slice(0, text.search(/<\/head>/i) === -1 ? text.length : text.search(/<\/head>/i));
  const atribut = (etiqueta, nom) => { const m = new RegExp(`\\b${nom}="([^"]*)"`, 'i').exec(etiqueta); return m ? descodifica(m[1]) : null; };
  const metes = cap.match(/<meta\b[^>]*>/gi) || [];
  const meta = (clau, valor) => { const etiqueta = metes.find(m => atribut(m, clau) === valor); return etiqueta ? atribut(etiqueta, 'content') : null; };
  const titol = /<title\b([^>]*)>([\s\S]*?)<\/title>/i.exec(cap);
  return {marcat: Boolean(titol && /\bdata-sdp-ssr\b/i.test(titol[1])), title: titol ? descodifica(titol[2]).trim() : null,
    description: meta('name', 'description'), image: meta('property', 'og:image')};
}

/**
 * La comprovació: { codi, estat, faltants, caducades, retirades, comprovades, avisos }.
 * `entorn` és el d'entornDelBuild; `rebut`, el del prerender desplegat (o null).
 */
export async function sentinella({root, entorn, origens = ORIGENS_PER_DEFECTE, rebut = null, fetchImpl = globalThis.fetch, env = {}, policyRoot = root, pausa} = {}) {
  if (!root) throw new Error('root és obligatori.');
  if (rebut !== null && (rebut?.schema !== 'sdp.social-rebut.v1' || !Array.isArray(rebut.camins) || !Array.isArray(rebut.imatges))) throw new Error('El rebut no és un rebut del prerender social.');
  for (const origen of origens) { const u = new URL(origen); if (u.protocol !== 'https:' || u.href !== `${u.origin}/`) throw new Error('Cada origen ha de ser un origen HTTPS net.'); }
  const nomesGet = (href, opcions = {}) => {
    if ((opcions.method || 'GET') !== 'GET' || opcions.body !== undefined) throw new Error('La sentinella només fa peticions GET.');
    return fetchImpl(href, opcions);
  };
  /* 1 · El que s'hauria de servir hui, amb les funcions del build. */
  const {snapshot, rebut: projeccio} = await projeccioPublica({entorn, origin: ORIGEN_CANONIC, fetchImpl: nomesGet, env, ...(pausa ? {pausa} : null)});
  const imageOrigins = entorn?.supabaseUrl ? [entorn.supabaseUrl] : [];
  const {manifest, evidence} = await buildSocialManifest({root, policyRoot, origin: ORIGEN_CANONIC, publicSnapshot: snapshot, imageOrigins, estricte: true});
  const faltants = [], caducades = [], retirades = [], avisos = [];
  if (projeccio.directori?.tallat) faltants.push({origen: '*', cami: '(directori)', motiu: 'el directori passa del sostre: hi ha fitxes públiques que no es prerenderitzen'});
  const generica = new URL(CAP_SOCIAL_BASE.image.url, ORIGEN_CANONIC).href;
  const esRemota = href => { try { const u = new URL(href); return imageOrigins.includes(u.origin) && CAMI_PUBLIC_DE_STORAGE.test(u.pathname); } catch { return false; } };
  /* Els camins a comprovar de cada fitxa: la canònica, els àlies per id que emet l'app i, amb el rebut, tots. */
  const perCanonica = new Map();
  for (const [cami, desti] of Object.entries(manifest.aliases)) { if (!perCanonica.has(desti)) perCanonica.set(desti, []); perCanonica.get(desti).push(cami); }
  const comprovacions = []; // {cami, clau}
  for (const fitxa of evidence.perfils?.canoniques || []) {
    const alies = perCanonica.get(fitxa.ruta) || [];
    const perId = alies.filter(cami => [`/empresa/${fitxa.id}`, `/entitats/${fitxa.id}`].includes(cami));
    for (const cami of new Set([fitxa.ruta, ...(rebut ? alies : perId)])) comprovacions.push({cami, clau: fitxa.ruta});
  }
  const baixa = async (href, maxim) => {
    const resposta = await nomesGet(href, {method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(TERMINI), headers: {Accept: '*/*', 'User-Agent': 'sdp-sentinella-social/1.0'}});
    if (resposta.status !== 200) { await resposta.body?.cancel?.().catch(() => {}); return {status: resposta.status}; }
    return {status: 200, tipus: (resposta.headers.get('content-type') || '').split(';')[0].trim().toLowerCase(), bytes: await cosFitat(resposta, maxim)};
  };
  const enParallel = async (tasques) => {
    const cua = [...tasques];
    await Promise.all(Array.from({length: Math.min(EN_PARALLEL, cua.length)}, async () => { for (let tasca = cua.shift(); tasca; tasca = cua.shift()) await tasca(); }));
  };
  const imatgesVistes = new Map(); // href → motiu o null
  const comprovaImatge = async href => {
    if (imatgesVistes.has(href)) return imatgesVistes.get(href);
    let motiu = null;
    try {
      const {status, tipus, bytes} = await baixa(href, MAX_IMATGE);
      const forma = status === 200 ? sniffImage(bytes) : null;
      if (status !== 200) motiu = `la imatge torna HTTP ${status}`;
      else if (tipus !== 'image/jpeg' || forma?.type !== 'image/jpeg') motiu = 'la imatge no és un JPEG';
      else if (bytes.length > PES_SOCIAL) motiu = `la imatge pesa ${bytes.length} B`;
      else if (forma.width !== 1200 || forma.height !== 630) motiu = `la imatge fa ${forma.width}x${forma.height}`;
    } catch (error) { motiu = `la imatge no es pot baixar (${String(error?.message || error).slice(0, 80)})`; }
    imatgesVistes.set(href, motiu);
    return motiu;
  };
  let comprovades = 0;
  await enParallel(origens.flatMap(origen => comprovacions.map(({cami, clau}) => async () => {
    const entrada = manifest.routes[clau];
    let pagina;
    try { pagina = await baixa(new URL(cami, origen).href, MAX_HTML); } catch (error) { faltants.push({origen, cami, motiu: `no respon (${String(error?.message || error).slice(0, 80)})`}); return; }
    comprovades += 1;
    if (pagina.status !== 200) { faltants.push({origen, cami, motiu: `HTTP ${pagina.status}`}); return; }
    const cap = headServit(pagina.bytes.toString('utf8'));
    if (!cap.marcat || !cap.title) { faltants.push({origen, cami, motiu: 'sense head propi (la targeta genèrica)'}); return; }
    if (cap.title !== `${entrada.title} | Sóc de Poble`) { caducades.push({origen, cami, motiu: 'el títol servit no és el de hui'}); return; }
    if (cap.description !== entrada.description) { caducades.push({origen, cami, motiu: 'la descripció servida no és la de hui'}); return; }
    /* La imatge: una remota es materialitza al propi origen (/assets/og/<hash>.jpg); una del paquet o la genèrica, tal qual. */
    const esperaMaterialitzada = esRemota(entrada.image.url);
    const servidaMaterialitzada = typeof cap.image === 'string' && /^https:\/\/[^/]+\/assets\/og\/[a-f0-9]{24}\.jpg$/.test(cap.image) && new URL(cap.image).origin === ORIGEN_CANONIC;
    if (esperaMaterialitzada !== servidaMaterialitzada) { caducades.push({origen, cami, motiu: esperaMaterialitzada ? 'la fitxa té imatge i el head servit no la porta' : 'el head servit porta una imatge que la fitxa ja no té'}); return; }
    if (!esperaMaterialitzada && cap.image !== entrada.image.url) { caducades.push({origen, cami, motiu: 'la imatge servida no és la de hui'}); return; }
    if (esperaMaterialitzada) {
      /* El fitxer es demana a l'origen que es comprova (el dist/ és el mateix als dos). */
      const motiu = await comprovaImatge(new URL(new URL(cap.image).pathname, origen).href);
      if (motiu) caducades.push({origen, cami, motiu});
    } else if (cap.image !== generica && !cap.image) caducades.push({origen, cami, motiu: 'sense og:image'});
  })));
  /* 3 · Retirades: el que el rebut diu que es va desplegar, d'origen veïnal, i que hui ja no s'hauria de servir. */
  if (rebut) {
    const esperats = new Set([...Object.keys(manifest.routes), ...Object.keys(manifest.aliases)]);
    const vells = rebut.camins.filter(c => c.origen === 'veinal' && c.classe !== 'farcit' && !esperats.has(c.cami));
    const refsVives = new Set(Object.values(manifest.routes).map(e => e.image.url).filter(esRemota).map(sha));
    const imatgesVelles = rebut.imatges.filter(i => Array.isArray(i.refs) && !i.refs.some(ref => refsVives.has(ref)));
    await enParallel(origens.flatMap(origen => [
      ...vells.map(({cami}) => async () => {
        try {
          const pagina = await baixa(new URL(cami, origen).href, MAX_HTML);
          comprovades += 1;
          if (pagina.status === 200 && headServit(pagina.bytes.toString('utf8')).marcat) retirades.push({origen, cami, motiu: 'la fitxa ja no és pública (o ara queda exclosa) i el seu head encara es servix'});
        } catch (error) { avisos.push(`${origen}${cami}: no s'ha pogut comprovar la retirada (${String(error?.message || error).slice(0, 80)})`); }
      }),
      ...imatgesVelles.map(({fitxer}) => async () => {
        try {
          const imatge = await baixa(new URL(`/${fitxer}`, origen).href, MAX_IMATGE);
          comprovades += 1;
          if (imatge.status === 200 && imatge.tipus?.startsWith('image/')) retirades.push({origen, cami: `/${fitxer}`, motiu: 'la imatge d’una fitxa retirada encara es servix'});
        } catch (error) { avisos.push(`${origen}/${fitxer}: no s'ha pogut comprovar la retirada (${String(error?.message || error).slice(0, 80)})`); }
      })
    ]));
  } else avisos.push('sense rebut: no es pot saber què hi ha desplegat (retirades i àlies sense comprovar)');
  const ordena = llista => llista.sort((a, b) => `${a.origen}${a.cami}`.localeCompare(`${b.origen}${b.cami}`));
  const codi = retirades.length ? CODIS.retirada : faltants.length || caducades.length ? CODIS.reRelease : rebut ? CODIS.fresc : CODIS.noVerificable;
  const estat = {0: 'fresc', 3: 'cal una re-release', 4: 'retirada pendent (privadesa)', 5: 'no verificable sense el rebut'}[codi];
  return {codi, estat, origens: [...origens], fitxes: (evidence.perfils?.canoniques || []).length, comprovades,
    faltants: ordena(faltants), caducades: ordena(caducades), retirades: ordena(retirades), avisos};
}

/** La CLI; torna el codi d'eixida. Les dependències s'injecten a les proves. */
export async function main(argv, {env = process.env, entorn = null, fetchImpl = globalThis.fetch, stdout = process.stdout, stderr = process.stderr} = {}) {
  let clauAnon = '';
  try {
    const args = {origens: []};
    for (let i = 0; i < argv.length; i += 2) {
      const k = argv[i], v = argv[i + 1];
      if (!['--root', '--rebut', '--origen', '--mode'].includes(k) || !v) throw new Error('Ús: --root RUTA [--rebut REBUT.json] [--origen HTTPS]… [--mode production]');
      if (k === '--origen') args.origens.push(v); else if (args[k]) throw new Error(`Argument repetit: ${k}`); else args[k] = v;
    }
    if (!args['--root']) throw new Error('Ús: --root RUTA [--rebut REBUT.json] [--origen HTTPS]… [--mode production]');
    const root = fs.realpathSync(args['--root']);
    const backend = entorn ?? entornDelBuild(await variablesDelBuild(root, args['--mode'] || 'production'));
    clauAnon = backend.anonKey || '';
    if (backend.dataMode !== 'remote') throw new Error(`El paquet és en mode ${backend.dataMode}: no hi ha res remot que vigilar.`);
    const rebut = args['--rebut'] ? JSON.parse(fs.readFileSync(args['--rebut'], 'utf8')) : null;
    const informe = await sentinella({root, entorn: backend, origens: args.origens.length ? args.origens : ORIGENS_PER_DEFECTE, rebut, fetchImpl, env});
    stdout.write(`${JSON.stringify(informe, null, 2)}\n`);
    return informe.codi;
  } catch (error) {
    const missatge = String(error?.message || error);
    stderr.write(`${JSON.stringify({codi: CODIS.error, estat: 'error', error: clauAnon ? missatge.split(clauAnon).join('[clau]') : missatge})}\n`);
    return CODIS.error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(codi => { process.exitCode = codi; });
}
