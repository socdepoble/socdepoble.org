/** Porta executable del carril T1 (prompt comú 261002_0125): fonts de
 *  calendari i Google Calendar. El hook del projecte no deixa executar
 *  `npm run lint`: ací es linten amb l'API d'ESLint (la configuració de
 *  `npm run lint`, zero avisos) els fitxers del carril, i es comproven com a
 *  text les regles de Pedra Seca i de privacitat que el carril ha de complir:
 *  cap style=, cap emmagatzematge del navegador ni HTML cru, cap color hex,
 *  cap backend importat (Llei de l'Enxufabilitat), tota classe declarada, i
 *  la pàgina de tornada sense scripts en línia i d'acord amb l'adaptador. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const llig = (ruta) => fs.readFileSync(path.join(ARREL, ruta), 'utf8');

const FONTS = 'src/sections/calendari/fonts';
const CODI = [
  `${FONTS}/contracteFonts.js`,
  `${FONTS}/googleCalendar.js`,
  `${FONTS}/configFonts.js`,
  `${FONTS}/sessioFonts.js`,
  `${FONTS}/useFontsCalendari.js`,
  `${FONTS}/PanellFontsCalendari.jsx`,
  'src/sections/calendari/CalendariSection.jsx'
];
const PROVES = [
  `${FONTS}/contracteFonts.test.js`,
  `${FONTS}/googleCalendar.test.js`,
  `${FONTS}/configFonts.test.js`,
  `${FONTS}/sessioFonts.test.js`,
  `${FONTS}/useFontsCalendari.test.jsx`,
  `${FONTS}/PanellFontsCalendari.test.jsx`,
  'src/sections/calendari/CalendariSection.fonts.test.jsx',
  // Bucle adversarial (auditoria Codex 261002_0148, punts 10 i 12).
  `${FONTS}/useFontsCalendari.reconnexio.test.jsx`,
  `${FONTS}/sessioFonts.identitat.test.js`,
  `${FONTS}/configFonts.retorn.test.jsx`,
  `${FONTS}/configFonts.amfitrio.test.js`,
  'src/sections/calendari/CalendariSection.amfitrio.test.jsx'
];
const PUBLIC = ['public/auth/calendari-google.js'];
const CARRIL = [...CODI, ...PROVES, ...PUBLIC, 'tests/lint_calendari_fonts.test.mjs'];
const CSS_CANONIC = fs.readdirSync(path.join(ARREL, 'src/css')).filter((f) => f.endsWith('.css')).map((f) => `src/css/${f}`);

test('tots els fitxers del carril existixen', () => {
  assert.deepEqual(CARRIL.filter((f) => !fs.existsSync(path.join(ARREL, f))), []);
});

test('ESLint: zero missatges (avisos inclosos) als fitxers del carril', async () => {
  const eslint = new ESLint({ cwd: ARREL });
  const resultats = await eslint.lintFiles(CARRIL.map((f) => path.join(ARREL, f)));
  const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line}:${m.column} [${m.ruleId || m.severity}] ${m.message}`));
  assert.equal(resultats.length, CARRIL.length, 'ESLint no ha linat tots els fitxers del carril');
  assert.deepEqual(missatges, [], `ESLint ha trobat ${missatges.length} missatge(s):\n${missatges.join('\n')}`);
});

test('Pedra Seca i privacitat: cap style=, cap emmagatzematge del navegador, cap HTML cru, cap global escrit, cap color hex', () => {
  const dolents = [];
  for (const f of [...CODI, ...PROVES]) {
    const prova = PROVES.includes(f);
    llig(f).split('\n').forEach((linia, i) => {
      const on = `${f}:${i + 1}`;
      if (/\sstyle=\{/.test(linia)) dolents.push(`${on} style=`);
      if (!prova && /localStorage|sessionStorage|indexedDB/.test(linia)) dolents.push(`${on} emmagatzematge`);
      if (/innerHTML|outerHTML|insertAdjacentHTML|dangerouslySetInnerHTML/.test(linia)) dolents.push(`${on} HTML cru`);
      if (/(?:window|globalThis)\.[A-Za-z_$][\w$]*\s*=[^=]/.test(linia)) dolents.push(`${on} global escrit`);
      if (/#[0-9a-fA-F]{3,8}\b/.test(linia)) dolents.push(`${on} color hex`);
      if (/from\s+['"]@\//.test(linia)) dolents.push(`${on} import amb @/`);
      if (/Local-First|Offline-First|iOS 15|iPad A10/.test(linia)) dolents.push(`${on} paraula vetada`);
    });
  }
  assert.deepEqual(dolents, []);
});

test('Enxufabilitat: les fonts no importen cap backend; la pàgina només coneix el contracte i l’adaptador', () => {
  const dolents = [];
  for (const f of CODI.filter((ruta) => ruta.startsWith(FONTS))) {
    if (/backendPort|supabase|adaptadors\//i.test(llig(f).replace(/\/\*[\s\S]*?\*\//g, ''))) dolents.push(f);
  }
  assert.deepEqual(dolents, []);
  const seccio = llig('src/sections/calendari/CalendariSection.jsx');
  assert.doesNotMatch(seccio, /googleCalendar\.js|googleapis/);
});

/* Només les classes del carril (prefix sdp-calendari-fonts-): les d'abans de
   CalendariSection.jsx les vigila tests/lint_calendari.test.mjs. */
test('tota classe del JSX del carril té regla als fulls canònics, i al bloc propi de modules.css', () => {
  const declarades = new Set();
  for (const f of CSS_CANONIC) for (const m of llig(f).matchAll(/\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g)) declarades.add(m[1]);
  const usades = [];
  for (const f of [`${FONTS}/PanellFontsCalendari.jsx`, 'src/sections/calendari/CalendariSection.jsx']) {
    const text = llig(f);
    usades.push(...[...text.matchAll(/'(sdp-calendari-fonts-[^']*)'/g)].flatMap((m) => m[1].split(/\s+/)));
    usades.push(...[...text.matchAll(/className="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)));
  }
  const delCarril = [...new Set(usades)].filter((c) => c.startsWith('sdp-calendari-fonts-'));
  assert.ok(delCarril.length >= 10, `només ${delCarril.length} classes del carril: la cerca no les troba`);
  assert.deepEqual(delCarril.filter((c) => !declarades.has(c)), []);
  assert.deepEqual(llig(`${FONTS}/PanellFontsCalendari.jsx`).match(/className="(?!sdp-calendari-fonts-)[^"]*"/g), null);
  const modules = llig('src/css/modules.css');
  const bloc = modules.slice(modules.indexOf('/* ── CALENDARI · FONTS (261002) ── */'));
  assert.match(bloc, /^\/\* ── CALENDARI · FONTS \(261002\) ── \*\/\n@layer components \{/);
  assert.doesNotMatch(bloc.split('\n}\n')[0], /box-shadow|var\([^)]*,|56px|58px/);
});

test('la pàgina de tornada: cap script en línia, CSP estricta, el mateix canal i el mateix missatge que l’adaptador', () => {
  const html = llig('public/auth/calendari-google.html');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.match(scripts[0][1], /src="\/auth\/calendari-google\.js"/);
  assert.equal(scripts[0][2].trim(), '');
  assert.match(html, /script-src 'self'/);
  assert.doesNotMatch(html, /unsafe-inline|style=/);
  const js = llig('public/auth/calendari-google.js');
  const adaptador = llig(`${FONTS}/googleCalendar.js`);
  const tipus = adaptador.match(/TIPUS_MISSATGE_OAUTH = '([^']+)'/)[1];
  const canal = adaptador.match(/CANAL_OAUTH = '([^']+)'/)[1];
  assert.match(js, new RegExp(`var TIPUS = '${tipus}'`));
  assert.match(js, new RegExp(`var CANAL = '${canal}'`));
  assert.match(js, /postMessage\(carrega, window\.location\.origin\)/);
  assert.doesNotMatch(js, /localStorage|sessionStorage|indexedDB|document\.cookie|fetch\(/);
  const ruta = llig(`${FONTS}/configFonts.js`).match(/RUTA_RETORN_GOOGLE = '([^']+)'/)[1];
  assert.ok(fs.existsSync(path.join(ARREL, 'public', ruta)), `${ruta} no existix a public/`);
});

test('.env.example documenta les dues variables buides: cap credencial', () => {
  const exemple = llig('.env.example');
  assert.match(exemple, /^VITE_GOOGLE_OAUTH_CLIENT_ID=$/m);
  assert.match(exemple, /^VITE_GCAL_FONTS=$/m);
});
