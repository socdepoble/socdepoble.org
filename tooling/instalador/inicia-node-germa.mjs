#!/usr/bin/env node
/** Instal·lador municipal sense dependències. Font local immutable + package-lock.
 * node tooling/instalador/inicia-node-germa.mjs --font RELEASE --desti DIR --config municipi.json [--build]
 * Config: {slug,nom,origen,mode:'seed'|'remote',supabaseUrl?,anonKey?,tenantId?}.
 * No crea infraestructura remota. --build executa npm ci i el build web al destí nou.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validatePublicCredentials } from '../../src/config/publicCredentials.js';
import * as activitypub from '../../src/data/activitypub.js';
import { ALIES_WEBFINGER, reglesFirebaseWebFinger } from '../seo/genera-federacio.mjs';
import { CAMINS } from '../lib/arrel.mjs';
import { PUBLIC_WIKI_DIRS } from '../wiki/lib/publication-policy.mjs';
import { escriuInventariEstatic, verificaInventariEstatic } from './inventari-estatic.mjs';
const { esSlugFederat, normalitzaOrigen } = activitypub;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const DIRECTORIS = ['src', 'public', 'tooling', 'scripts'];
// Les mateixes fonts públiques que el flake: Vite necessita el marcador d'arrel i la Wiki pública.
const DIRECTORIS_OPCIONALS = ['nix', ...PUBLIC_WIKI_DIRS.map(dir => path.posix.join(CAMINS.wiki, dir))];
const FITXERS = ['package.json', 'package-lock.json', 'index.html', 'vite.config.js', 'firebase.json', 'flake.nix', 'flake.lock', 'LICENSE', 'AGENTS.md', '.agents/AGENTS.md'];

/** El node hereta les capçaleres públiques, però mai el compte WebFinger ni el lloc de desplegament del Mas. */
export function adaptaFirebaseNode(firebase, config) {
  if (!firebase || typeof firebase !== 'object' || !firebase.hosting || Array.isArray(firebase.hosting)
    || typeof firebase.hosting !== 'object' || !Array.isArray(firebase.hosting.rewrites) || !Array.isArray(firebase.hosting.headers)) {
    throw new TypeError('Cal una configuració Firebase Hosting amb reescriptures i capçaleres.');
  }
  const c = validaConfig(config);
  const actor = { slug: c.slug, perfil: '/', ...(ALIES_WEBFINGER[c.slug] ? { alies: ALIES_WEBFINGER[c.slug] } : {}) };
  const regles = reglesFirebaseWebFinger({ ap: activitypub, origen: c.origen, actors: [actor], principals: [c.slug] });
  const esWebFinger = r => typeof r?.source === 'string' && r.source.startsWith('/.well-known/webfinger')
    || typeof r?.regex === 'string' && r.regex.includes('webfinger');
  const hosting = { ...firebase.hosting };
  delete hosting.site;
  delete hosting.target;
  return { ...firebase, hosting: { ...hosting,
    rewrites: [...regles.rewrites, ...hosting.rewrites.filter(r => !esWebFinger(r))],
    headers: [...hosting.headers.filter(r => !esWebFinger(r) && r?.source !== '/.well-known/host-meta'), ...regles.headers]
  } };
}

/** Comprova els documents emesos pel build real, sense confondre un exit 0 amb una federació del node nou. */
export function validaCompilacioNode(desti, config) {
  const c = validaConfig(config), dist = path.join(camiNet(desti), 'dist');
  const llig = rel => {
    const abs = camiNet(path.join(dist, rel));
    if (!fs.lstatSync(abs).isFile()) throw new Error('El build no ha emés un document federat regular.');
    return fs.readFileSync(abs, 'utf8');
  };
  const actor = JSON.parse(llig(`ap/actors/${c.slug}.json`));
  const jrd = JSON.parse(llig(`.well-known/webfinger/${c.slug}.json`));
  const discovery = JSON.parse(llig('.well-known/nodeinfo'));
  const info = JSON.parse(llig('nodeinfo/2.1.json'));
  const actorUrl = `${c.origen}/ap/actors/${c.slug}.json`;
  if (actor.id !== actorUrl || actor.preferredUsername !== c.slug
    || jrd.subject !== `acct:${c.slug}@${new URL(c.origen).host}`
    || !jrd.links?.some(l => l.rel === 'self' && l.href === actorUrl)
    || discovery.links?.[0]?.href !== `${c.origen}/nodeinfo/2.1.json`
    || info.version !== '2.1' || info.software?.homepage !== `${c.origen}/`
    || !llig('.well-known/host-meta').includes(`template="${c.origen}/.well-known/webfinger/{uri}"`)) {
    throw new Error('La compilació federada no correspon a l’origen i al poble del node.');
  }
  if (fs.readdirSync(path.join(dist, 'ap/actors')).some(n => n !== `${c.slug}.json`)
    || fs.readdirSync(path.join(dist, '.well-known/webfinger')).some(n => n !== `${c.slug}.json`)) {
    throw new Error('La compilació conserva identitats federades d’un altre node.');
  }
  const firebase = JSON.parse(fs.readFileSync(path.join(desti, 'firebase.json'), 'utf8'));
  const esperat = adaptaFirebaseNode(firebase, c);
  if (JSON.stringify(firebase) !== JSON.stringify(esperat)) throw new Error('Les regles Firebase no corresponen al node compilat.');
  llig('index.html');
  return { origen: c.origen, actor: actorUrl, webfinger: jrd.subject };
}
export function validaConfig(c) {
  if (!c || !esSlugFederat(c.slug) || c.slug === 'socdepoble' || typeof c.nom !== 'string' || !c.nom.trim() || c.nom.length > 120 || /[\r\n\x00-\x1f]/.test(c.nom)) throw new TypeError('Identitat municipal invàlida.');
  const origen = normalitzaOrigen(c.origen);
  if (!origen.startsWith('https:') || origen !== c.origen) throw new TypeError('Cal un origen HTTPS sense barra final.');
  if (!['seed', 'remote'].includes(c.mode)) throw new TypeError('Cal mode seed o remote.');
  const config = { slug: c.slug, nom: c.nom.trim(), origen, mode: c.mode };
  if (c.mode === 'remote') {
    validatePublicCredentials(c.supabaseUrl, c.anonKey);
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(c.tenantId || '')) throw new TypeError('Cal tenantId UUID.');
    Object.assign(config, { supabaseUrl: c.supabaseUrl, anonKey: c.anonKey, tenantId: c.tenantId });
  }
  return config;
}
function arbre(dir, prefix = '') {
  const files = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist' || e.name === '90_arxiu_historic' || e.name === '01_produccio' || e.name === '02_investigacio_ia') continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    const abs = path.join(dir, e.name);
    if (e.isSymbolicLink()) throw new Error('La release conté un enllaç simbòlic.');
    if (e.isDirectory()) files.push(...arbre(abs, rel));
    else if (e.isFile()) files.push(rel);
  }
  return files;
}
function camiNet(cami) {
  const abs = path.resolve(cami).replace(/^\/(tmp|var)(?=\/|$)/, (_, nom) => fs.realpathSync(`/${nom}`)); let cursor = path.parse(abs).root;
  for (const tros of abs.slice(cursor.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, tros);
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw new Error('No es travessen enllaços simbòlics.');
  }
  return abs;
}
export function iniciaNodeGerma({ font, desti, config, build = false, run = spawnSync }) {
  const c = validaConfig(config), origen = camiNet(font), target = camiNet(desti);
  if (target === origen || target.startsWith(`${origen}${path.sep}`) || origen.startsWith(`${target}${path.sep}`)) throw new Error('Font i destí s’han de separar.');
  if (fs.existsSync(target)) throw new Error('El destí ja existix: no es reescriu.');
  const lock = JSON.parse(fs.readFileSync(path.join(origen, 'package-lock.json'), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(path.join(origen, 'package.json'), 'utf8'));
  if (lock.lockfileVersion !== 3 || lock.packages?.['']?.version !== pkg.version) throw new Error('package-lock incoherent amb la release.');
  const rels = FITXERS.flatMap(n => fs.existsSync(path.join(origen,n)) ? [n] : []);
  for (const dir of [...DIRECTORIS, ...DIRECTORIS_OPCIONALS.filter(n => fs.existsSync(path.join(origen, n)))]) {
    if (!fs.existsSync(path.join(origen,dir))) throw new Error(`Falta ${dir} en la release.`);
    const abs = camiNet(path.join(origen,dir));
    if (fs.lstatSync(abs).isSymbolicLink()) throw new Error('Directori de release amb enllaç.');
    rels.push(...arbre(abs,dir));
  }
  // Validació i lectura completes abans de crear el destí.
  const continguts = rels.sort().map(rel => { const abs = camiNet(path.join(origen,rel));
    if (!fs.lstatSync(abs).isFile() || fs.lstatSync(abs).isSymbolicLink()) throw new Error('Fitxer de release no regular.');
    const fontBytes = fs.readFileSync(abs);
    const bytes = rel === 'firebase.json' ? Buffer.from(JSON.stringify(adaptaFirebaseNode(JSON.parse(fontBytes), c), null, 2)+'\n') : fontBytes;
    return { rel, bytes, ...(bytes.equals(fontBytes) ? {} : { sha256Font: sha(fontBytes) }) }; });
  const entorn = { VITE_DATA_MODE: c.mode, VITE_CANONICAL_URL: c.origen,
    ...(c.mode === 'remote' ? { VITE_SUPABASE_URL: c.supabaseUrl, VITE_SUPABASE_ANON_KEY: c.anonKey, VITE_TENANT_ID: c.tenantId } : { VITE_SUPABASE_URL: 'https://seed.invalid', VITE_SUPABASE_ANON_KEY: 'sb_publishable_demostracio_seed', VITE_TENANT_ID: '00000000-0000-0000-0000-000000000000' }) };
  const manifest = { esquema: 'sdp.node-germa.v1', config: c, node: process.versions.node, release: pkg.version,
    fitxers: continguts.map(({ rel: cami, bytes, ...procedencia }) => ({ cami, sha256: sha(bytes), ...procedencia })) };
  fs.mkdirSync(target, { recursive: false, mode: 0o700 });
  for (const { rel, bytes } of continguts) { const abs = path.join(target,rel); fs.mkdirSync(path.dirname(abs),{recursive:true}); fs.writeFileSync(abs,bytes,{flag:'wx'}); }
  fs.writeFileSync(path.join(target,'.env.local'), Object.entries(entorn).map(([k,v]) => `${k}=${JSON.stringify(v)}`).join('\n')+'\n', {flag:'wx', mode:0o600});
  fs.writeFileSync(path.join(target,'node-germa.json'), JSON.stringify(manifest,null,2)+'\n', {flag:'wx'});
  fs.writeFileSync(path.join(target,'INICIA_NODE.md'), `# Gent de ${c.nom}\n\nEmpremtes dels fitxers instal·lats a node-germa.json; sha256Font conserva la preimatge de firebase.json. Només dades públiques a .env.local.\n\n1. Amb Node 24: npm ci --ignore-scripts --no-audit --no-fund\n2. npm run build:web\n3. Publica dist/ a ${c.origen} amb les capçaleres de firebase.json o el mòdul NixOS de flake.nix.\n\nFederació: a partir de node-germa.json, el build publica el poble com a @${c.slug}@${new URL(c.origen).host} (ap/actors/${c.slug}.json), amb la seua bústia de sortida, WebFinger i NodeInfo 2.1, i cap altre actor. Amb el mòdul NixOS (encara sense verificar amb Nix), WebFinger també respon per paràmetre. L’instal·lador ja adapta les reescriptures i capçaleres WebFinger de firebase.json a ${c.origen}, sense conservar el site/target de desplegament de la font. Abans de publicar, configura explícitament el projecte i lloc Firebase del node nou. --build comprova l’actor, WebFinger, NodeInfo i host-meta del dist real i genera inventari-dist.json amb SHA256 i bytes de tots els fitxers, fora de dist. El digest compilacio.sha256Confiat queda al rebut node-germa.json: conserva’l per un canal independent de confiança abans de distribuir el paquet. Verifica amb node tooling/instalador/inventari-estatic.mjs verifica --dist dist --manifest inventari-dist.json --sha256-confiat DIGEST_CONFIAT. Recalcular el manifest no acredita l’origen; este inventari no és la firma pública del manifest Node 0. No desplega res.\n\nPer a Nix: nix flake lock i versiona flake.lock; després nix develop --no-update-lock-file. El lock de la release és necessari per repetir el mateix entorn.\n\nNo es creen taules, comptes, DNS ni un servidor Supabase. En mode seed el node és una demostració. En remot cal el tenant i les polítiques de la release aplicades per l’administrador.\n`,{flag:'wx'});
  if (build) {
    for (const args of [['ci','--ignore-scripts','--no-audit','--no-fund'],['run','build:web']]) {
      const resultat = run('npm',args,{cwd:target,stdio:'inherit',shell:false,env:{...Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('VITE_'))),...entorn,SOURCE_DATE_EPOCH:'0',SDP_SOCIAL_SENSE_REMOT:'1'}});
      if (resultat.error || resultat.status !== 0) throw new Error('La preparació ha fallat; es conserva el destí per al diagnòstic.');
    }
    validaCompilacioNode(target, c);
    const paquet = { dist: path.join(target,'dist'), manifest: path.join(target,'inventari-dist.json') };
    const compilacio = escriuInventariEstatic(paquet);
    verificaInventariEstatic({ ...paquet, sha256Confiat: compilacio.sha256Confiat });
    manifest.compilacio = { inventari: 'inventari-dist.json', ...compilacio };
    fs.writeFileSync(path.join(target,'node-germa.json'), JSON.stringify(manifest,null,2)+'\n');
  }
  return manifest;
}
export function main(argv) {
  const op = {}; for(let i=0;i<argv.length;i++) {
    if(argv[i]==='--build') { if(op.build) throw new Error('Opció repetida.'); op.build=true; continue; }
    if(!['--font','--desti','--config'].includes(argv[i]) || !argv[i+1] || op[argv[i].slice(2)]) throw new Error('Ús: --font RELEASE --desti DIR --config municipi.json [--build]');
    op[argv[i].slice(2)] = argv[++i];
  }
  if(!op.font || !op.desti || !op.config) throw new Error('Cal --font, --desti i --config.');
  const config = JSON.parse(fs.readFileSync(op.config,'utf8'));
  const manifest = iniciaNodeGerma({...op,config});
  process.stdout.write(JSON.stringify({esquema:manifest.esquema,slug:manifest.config.slug,fitxers:manifest.fitxers.length})+'\n');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); } catch { console.error('No s’ha pogut iniciar el node: comprova la configuració, la release i el destí buit.'); process.exitCode=1; }
}
