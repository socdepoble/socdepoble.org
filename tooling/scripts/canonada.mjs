#!/usr/bin/env node
/** canonada.mjs — Porta única d'escriptura. Zero dependències. Node >= 18. */
import { existsSync, mkdirSync, readdirSync, readFileSync,
         renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SENTINELLA = '.escriptori-arrel';

// Ancora pujant des d'este fitxer, MAI des de process.cwd().
// process.cwd() és la causa exacta dels artefactes a l'arrel: fa que l'eixida
// depenga d'on has invocat l'script, no d'on viu el projecte.
function trobaArrel() {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    if (existsSync(join(dir, SENTINELLA))) return dir;
    const pare = dirname(dir);
    if (pare === dir) throw new Error(`[CANONADA] Falta '${SENTINELLA}' a l'arrel.`);
    dir = pare;
  }
}
// No s'exporta: exportar-la convida a path.join(ARREL, ...) i reobri la porta.
const ARREL = trobaArrel();

const DESTINS = Object.freeze({
  PETORRETA: '_wiki_de_poble/05_Escriptori_Soc_de_Poble',
  PROMPT: '_wiki_de_poble/05_Escriptori_Soc_de_Poble',
  BUNDLE: '_wiki_de_poble/05_Escriptori_Soc_de_Poble',
  ACTA: '_wiki_de_poble/05_Escriptori_Soc_de_Poble',
  AUDITORIA: '_wiki_de_poble/05_Escriptori_Soc_de_Poble',
});
const ARREL_PERMESA = new Set([SENTINELLA, '.git', '.gitignore', '.github',
  '.obsidian', 'README.md', 'package.json', 'package-lock.json', 'node_modules', '.agents']);

// Mapa explícit. Res de normalize('NFD') + strip: això destrossa 'l·l' i 'ç'.
const TRANSLIT = new Map(Object.entries({
  'à':'a','á':'a','è':'e','é':'e','í':'i','ï':'i','ò':'o','ó':'o',
  'ú':'u','ü':'u','ç':'c','ñ':'n','·':'',"'":'','’':'','"':'' }));

const llima = (t) => [...t.normalize('NFC').toLowerCase()]
  .map((c) => TRANSLIT.has(c) ? TRANSLIT.get(c) : c).join('')
  .split(/[^a-z0-9]+/).filter(Boolean)
  .map((p) => p[0].toUpperCase() + p.slice(1)).join('_');

const segell = (d) => { const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getFullYear() % 100)}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`; };

// Marcatge per identitat: un literal { ruta: '...' } fet a mà és rebutjat.
const BITLLETS = new WeakSet();

export function resol(tipus, descripcio, { extensio = 'md', data = new Date() } = {}) {
  const carpeta = DESTINS[tipus];
  if (!carpeta) throw new Error(`[CANONADA] Tipus '${tipus}' desconegut.`);
  const slug = llima(descripcio);
  if (!slug) throw new Error(`[CANONADA] '${descripcio}' no dona slug utilitzable.`);
  const nom = `${segell(data)}_${tipus}_${slug}.${extensio}`;
  const b = Object.freeze({ ruta: join(ARREL, carpeta, nom), nom, tipus });
  BITLLETS.add(b);
  return b;
}

export function escriu(bitllet, contingut, { sobreescriu = false } = {}) {
  if (!BITLLETS.has(bitllet)) throw new Error('[CANONADA] Ruta no emesa per resol().');
  if (typeof contingut !== 'string') throw new Error('[CANONADA] Res de Buffer.');
  if (!sobreescriu && existsSync(bitllet.ruta)) throw new Error(`[CANONADA] Ja existix: ${bitllet.nom}`);
  mkdirSync(dirname(bitllet.ruta), { recursive: true });
  const tmp = `${bitllet.ruta}.tmp`;          // atòmic: mai un bundle a mitges
  writeFileSync(tmp, contingut, 'utf8');
  renameSync(tmp, bitllet.ruta);
  return bitllet.ruta;
}

const EXT_VETADES = new Set(['.woff','.woff2','.ttf','.otf','.eot','.png','.jpg',
  '.jpeg','.gif','.webp','.avif','.ico','.mp3','.mp4','.wav','.pdf','.zip','.gz']);
const LIMIT_FITXER = 600_000, LIMIT_BUNDLE = 4_000_000;
const LLENG = { '.jsx':'jsx','.js':'js','.mjs':'js','.ts':'ts','.tsx':'tsx','.css':'css',
  '.sql':'sql','.json':'json','.md':'md','.php':'php','.html':'html','.svg':'xml' };

/** Salts de línia REALS. Res de JSON.stringify: això produïx els '\n' literals. */
export function empaqueta(rutes, { arrelCodi = ARREL } = {}) {
  const admesos = [], exclosos = [], trossos = []; let total = 0;
  for (const rel of rutes) {
    const abs = resolve(arrelCodi, rel);
    const veto = (m) => exclosos.push([rel, m]);
    if (!existsSync(abs) || !statSync(abs).isFile()) { veto('no existix'); continue; }
    const ext = extname(abs).toLowerCase();
    if (EXT_VETADES.has(ext)) { veto(`binari (${ext})`); continue; }
    const brut = readFileSync(abs);
    if (brut.includes(0)) { veto('bytes nuls'); continue; }
    const text = brut.toString('utf8');
    if (text.includes('\uFFFD')) { veto('UTF-8 invàlid'); continue; }
    if (text.length > LIMIT_FITXER) { veto(`${text.length} > ${LIMIT_FITXER}`); continue; }
    if (total + text.length > LIMIT_BUNDLE) { veto('pressupost exhaurit'); continue; }
    total += text.length; admesos.push([rel, text.length]);
    trossos.push(`## Fitxer: ${rel}\n\n\`\`\`${LLENG[ext] ?? ''}\n${text}\n\`\`\`\n`);
  }
  const inv = ['## Inventari', '', ...admesos.map(([r,n]) => `- \`${r}\` (${n})`), '',
    `**Total:** ${total} caràcters, ${admesos.length} fitxers.`, '',
    ...(exclosos.length ? ['### Exclosos', '', ...exclosos.map(([r,m]) => `- \`${r}\` — ${m}`), ''] : [])];
  return { cos: `${inv.join('\n')}\n---\n\n${trossos.join('\n')}`, admesos, exclosos, total };
}

export const verificaArrel = () => readdirSync(ARREL)
  .filter((n) => !ARREL_PERMESA.has(n) && !/^\d\d_/.test(n) && !/^_/.test(n) && !/^[a-z]+_/.test(n) && !/^[A-Z]/.test(n) && n !== 'src' && n !== 'supabase' && n !== 'dist' && n !== 'tooling' && n !== 'scripts' && n !== 'wordpress-plugin' && n !== '06_EINES')
  .map((n) => `arrel bruta: ${n}`);

function* recorre(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* recorre(p); else if (/\.m?js$/.test(e.name)) yield p;
  }
}

/** Cap script fora d'ací pot escriure al disc. */
export function verificaGuants() {
  const jo = resolve(fileURLToPath(import.meta.url));
  const mal = /fs\.(writeFileSync|appendFileSync|createWriteStream|promises\.writeFile)|\bwriteFileSync\(/;
  const faltes = [];
  for (const f of recorre(ARREL)) {
    if (resolve(f) === jo) continue;
    readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
      if (mal.test(l) && !l.trimStart().startsWith('//'))
        faltes.push(`${relative(ARREL, f)}:${i+1}: escriptura directa fora de canonada.mjs`);
    });
  }
  return faltes;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const faltes = [...verificaArrel(), ...verificaGuants()];
  if (faltes.length) {
    console.error('[CANONADA] BLOQUEJAT:');
    faltes.forEach((f) => console.error(`  ✗ ${f}`));
    process.exit(1);
  }
  console.log('[CANONADA] Net.');
}
