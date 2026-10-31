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
import { esSlugFederat, normalitzaOrigen } from '../../src/data/activitypub.js';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const DIRECTORIS = ['src', 'public', 'tooling', 'scripts'];
const FITXERS = ['package.json', 'package-lock.json', 'index.html', 'vite.config.js', 'firebase.json', 'flake.nix', 'flake.lock', 'LICENSE'];
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
  for (const dir of DIRECTORIS) {
    if (!fs.existsSync(path.join(origen,dir))) throw new Error(`Falta ${dir} en la release.`);
    if (fs.lstatSync(path.join(origen,dir)).isSymbolicLink()) throw new Error('Directori de release amb enllaç.');
    rels.push(...arbre(path.join(origen,dir),dir));
  }
  // Validació i lectura completes abans de crear el destí.
  const continguts = rels.sort().map(rel => { const abs = path.join(origen,rel);
    if (!fs.lstatSync(abs).isFile() || fs.lstatSync(abs).isSymbolicLink()) throw new Error('Fitxer de release no regular.');
    return [rel, fs.readFileSync(abs)]; });
  const entorn = { VITE_DATA_MODE: c.mode, VITE_CANONICAL_URL: c.origen,
    ...(c.mode === 'remote' ? { VITE_SUPABASE_URL: c.supabaseUrl, VITE_SUPABASE_ANON_KEY: c.anonKey, VITE_TENANT_ID: c.tenantId } : { VITE_SUPABASE_URL: 'https://seed.invalid', VITE_SUPABASE_ANON_KEY: 'sb_publishable_demostracio_seed', VITE_TENANT_ID: '00000000-0000-0000-0000-000000000000' }) };
  const manifest = { esquema: 'sdp.node-germa.v1', config: c, node: process.versions.node, release: pkg.version,
    fitxers: continguts.map(([cami,bytes]) => ({ cami, sha256: sha(bytes) })) };
  fs.mkdirSync(target, { recursive: false, mode: 0o700 });
  for (const [rel,bytes] of continguts) { const abs = path.join(target,rel); fs.mkdirSync(path.dirname(abs),{recursive:true}); fs.writeFileSync(abs,bytes,{flag:'wx'}); }
  fs.writeFileSync(path.join(target,'.env.local'), Object.entries(entorn).map(([k,v]) => `${k}=${JSON.stringify(v)}`).join('\n')+'\n', {flag:'wx', mode:0o600});
  fs.writeFileSync(path.join(target,'node-germa.json'), JSON.stringify(manifest,null,2)+'\n', {flag:'wx'});
  fs.writeFileSync(path.join(target,'INICIA_NODE.md'), `# Gent de ${c.nom}\n\nFont verificada a node-germa.json; només dades públiques a .env.local.\n\n1. Amb Node 24: npm ci --ignore-scripts --no-audit --no-fund\n2. npm run build:web\n3. Publica dist/ a ${c.origen} amb les capçaleres de firebase.json o el mòdul NixOS de flake.nix.\n\nPer a Nix: nix flake lock i versiona flake.lock; després nix develop --no-update-lock-file. El lock de la release és necessari per repetir el mateix entorn.\n\nNo es creen taules, comptes, DNS ni un servidor Supabase. En mode seed el node és una demostració. En remot cal el tenant i les polítiques de la release aplicades per l’administrador.\n`,{flag:'wx'});
  if (build) {
    for (const args of [['ci','--ignore-scripts','--no-audit','--no-fund'],['run','build:web']]) {
      const resultat = run('npm',args,{cwd:target,stdio:'inherit',shell:false,env:{...Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('VITE_'))),...entorn,SOURCE_DATE_EPOCH:'0'}});
      if (resultat.error || resultat.status !== 0) throw new Error('La preparació ha fallat; es conserva el destí per al diagnòstic.');
    }
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
