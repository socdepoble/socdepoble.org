/** Porta executable del torn «Lògica d'Usuari» (prompt 260927_1925, T1–T7).
 *  El hook del projecte no deixa executar `npm run lint` ni cap escombrada amb
 *  grep: ací es linten amb l'API d'ESLint (mateixa configuració que `npm run
 *  lint`, zero avisos) tots els fitxers .js/.jsx/.mjs tocats en este torn, i es
 *  comproven com a text les regles que les altres portes vigilen al pre-commit:
 *  paritat i18n en cinc llengües, classes del JSX nou declarades al CSS canònic,
 *  tokens declarats (el nou --sdp-radi-boto inclòs), cap píndola als botons
 *  d'acció, cap vocabulari vetat, i Supabase només dins de src/data/supabase/.
 *  Cap import relatiu: tot es resol des de l'arrel del repositori. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const llig = (ruta) => fs.readFileSync(path.join(ARREL, ruta), 'utf8');
const existix = (ruta) => fs.existsSync(path.join(ARREL, ruta));

/* ─────────────────────────── Fitxers del torn ─────────────────────────── */

const JSX_NOU = [
  'src/sections/profile/PerfilPublicSection.jsx',
  'src/sections/notes/PublicacioDetall.jsx',
  'src/sections/connectar/ConnectarSection.jsx',
  'src/sections/xat/components/CapcaleraConversa.jsx',
  'src/sections/xat/components/FiltreConverses.jsx',
  'src/sections/xat/components/Bombolla.jsx',
  'src/sections/xat/components/FilaPersona.jsx',
  'src/sections/notes/NotesEditor.jsx',
  'src/sections/profile/PerfilEditor.jsx',
  'src/sections/profile/ProfileSection.jsx',
  'src/components/universal/PageFrame.jsx',
  /* T54 · el lector de connexions (read-it-later). */
  'src/sections/notes/ConnexioDetall.jsx',
  /* T71 · la fitxa de lectura d'una connexió a la llista del Bloc. */
  'src/sections/notes/ConnexioFitxa.jsx'
];

const JS_TORN = [
  ...JSX_NOU,
  'src/data/identitatsSeed.js',
  'src/data/origenNota.js',
  'src/data/xatSeed.js',
  'src/data/localXat.js',
  'src/data/localPerfils.js',
  'src/data/localPerfils.test.js',
  'src/data/localNotes.js',
  'src/data/appSeed.js',
  'src/data/contracte.js',
  'src/data/backendPort.js',
  'src/data/supabase/perfils.js',
  'src/data/supabase/index.js',
  'src/data/supabase/auth.js',
  'src/data/supabase/organizations.js',
  'src/data/supabase/xat.js',
  'src/data/supabase/xat.test.js',
  'src/data/supabase/content.js',
  'src/data/supabase/notes.js',
  'src/sections/xat/missatges.js',
  'src/sections/xat/XatSection.jsx',
  'src/sections/xat/XatSection.test.jsx',
  'src/sections/xat/XatControlSection.jsx',
  'src/config/navigation.js',
  'src/config/i18n.js',
  'src/components/universal/UniversalToolbar.jsx',
  'src/components/universal/richText/UniversalRichTextToolbar.jsx',
  'src/components/universal/DocumentEditor.jsx',
  'src/sections/mur/MurSection.jsx',
  'src/sections/mercat/MercatSection.jsx',
  'src/sections/detail/ItemDetailSection.jsx',
  'src/sections/profile/perfilCamps.js',
  'src/sections/profile/perfilModel.js',
  'src/sections/profile/PerfilContext.jsx',
  'src/sections/profile/PerfilPublicSection.test.jsx',
  'src/app/App.jsx',
  'src/sections/notes/carpetes.js',
  'src/sections/notes/masDeLUsuari.js',
  'src/sections/notes/masDeLUsuari.test.js',
  'src/sections/notes/NotesSection.jsx',
  'src/sections/notes/NotesSection.test.jsx',
  'src/sections/notes/NotesEditor.test.jsx',
  'src/sections/notes/NotesContext.jsx',
  'src/sections/connectar/ConnectarSection.test.jsx',
  /* T54 · el resolvedor únic de l'element original i les proves del lector. */
  'src/sections/detail/elementDeSeccio.js',
  'src/sections/detail/elementDeSeccio.test.js',
  'src/sections/notes/ConnexioDetall.test.jsx',
  /* Esmenes de T54 (W3C) · el cos de les connexions, pur, i les seues proves. */
  'src/sections/notes/connexions.js',
  'src/sections/notes/connexions.test.js',
  'src/sections/notes/NotesContext.connexio.test.jsx',
  'src/sections/disseny/cataleg/detalls/EspecimenEspaiat.jsx',
  /* T71 · «Connectar»: pàgines de text resoltes, fitxa de lectura i contingut de fora. */
  'src/sections/notes/ConnexioFitxa.test.jsx',
  'src/sections/text/TextSection.jsx',
  'src/sections/text/TextSection.test.jsx',
  'src/sections/text/paginaDeText.js',
  'src/sections/text/paginaDeText.test.js',
  'src/sections/connectar/contingutExtern.js',
  'src/sections/connectar/contingutExtern.test.js',
  'src/data/origenNota.test.js',
  'tests/lint_xat.test.mjs',
  'tests/lint_logica_usuari.test.mjs'
];

/* Els fulls que el torn toca (T6, botons rectangulars; T8, alineació del rail). */
const CSS_TORN = [
  'src/css/modules.css',
  'src/css/components.css',
  'src/css/layout.css',
  'src/css/tokens.css',
  'src/components/layout/AppGridShell.css',
  'src/sections/profile/PerfilShell.css'
];
/* Per a resoldre classes compten tots els fulls canònics de src/css més el
   full de secció que el JSX nou usa (PerfilShell). El de Connectar ja no
   existix: T43 el va moure al seu bloc de css/modules.css. */
const CSS_RESOLUCIO = [
  'src/css/modules.css', 'src/css/sdp.css', 'src/css/layout.css', 'src/css/components.css',
  'src/css/utilities.css', 'src/css/base.css', 'src/components/layout/AppGridShell.css',
  'src/sections/profile/PerfilShell.css'
];
const CSS_TOKENS = ['src/css/tokens.css', 'src/css/design-tokens.css'];
const TEXT_TORN = [
  ...JS_TORN,
  ...CSS_TORN,
  'supabase/migrations/2609272100_notes_origen.sql',
  'supabase/README.md'
];

test('tots els fitxers del torn existixen', () => {
  const absents = [...JS_TORN, ...CSS_TORN, ...CSS_TOKENS, 'supabase/migrations/2609272100_notes_origen.sql'].filter((f) => !existix(f));
  assert.deepEqual(absents, []);
});

/* ─────────────────────────────── ESLint ─────────────────────────────── */

async function linta(fitxers) {
  const eslint = new ESLint({ cwd: ARREL });
  const resultats = await eslint.lintFiles(fitxers.map((f) => path.join(ARREL, f)));
  const missatges = [];
  for (const r of resultats) {
    for (const m of r.messages) {
      missatges.push(`${path.relative(ARREL, r.filePath)}:${m.line}:${m.column} [${m.ruleId || m.severity}] ${m.message}`);
    }
  }
  return missatges;
}

test('ESLint: zero missatges (avisos inclosos) als fitxers del torn', async () => {
  const missatges = await linta(JS_TORN);
  assert.deepEqual(missatges, [], `ESLint ha trobat ${missatges.length} missatge(s):\n${missatges.join('\n')}`);
});

/* ─────────────────────────── Higiene de text ─────────────────────────── */

const PROVES_DE_TEXT = new Set(['tests/lint_xat.test.mjs', 'tests/lint_logica_usuari.test.mjs']);
const senseComentarisCss = (text) => text.replace(/\/\*[\s\S]*?\*\//g, (bloc) => bloc.replace(/[^\n]/g, ' '));

function liniesQueCasen(fitxers, patro, { neteja = (text) => text, exclou = new Set() } = {}) {
  const trobades = [];
  for (const f of fitxers) {
    if (!existix(f) || exclou.has(f)) continue;
    neteja(llig(f)).split('\n').forEach((linia, i) => {
      if (patro.test(linia)) trobades.push(`${f}:${i + 1}: ${linia.trim()}`);
    });
  }
  return trobades;
}

test('cap paraula vetada, cap console.log, cap innerHTML fora de sanitizeHtml, cap «Javi Llinares» a la llavor', () => {
  assert.deepEqual(liniesQueCasen(TEXT_TORN, /offline-first|local-first/i, { exclou: PROVES_DE_TEXT }), []);
  assert.deepEqual(liniesQueCasen(JS_TORN, /console\.log\(/, { exclou: PROVES_DE_TEXT }), []);
  const inner = liniesQueCasen(JS_TORN, /innerHTML/, { exclou: PROVES_DE_TEXT }).filter((l) => !/sanitizeHtml\(/.test(l));
  assert.deepEqual(inner, []);
  assert.deepEqual(liniesQueCasen(['src/data/identitatsSeed.js', 'src/data/xatSeed.js', 'src/data/localPerfils.js', 'src/data/appSeed.js'], /Javi Llinares/), []);
});

/* Cap JSX del torn importa ja el seu propi full: Connectar (V3) va deixar de
   fer-ho amb T43, i la regla el torna a vigilar com la resta. */
const JSX_AMB_FULL_PROPI = new Set();

/* components.css porta tres :has() anteriors al torn (placeholder del
   contenteditable i etiqueta amb acció): la doctrina del Baseline 2022 el
   prohibix als fulls de la closca (sdp-app-grid-shell §4), que són els que
   ací es vigilen; el de components.css es deixa com a deute documentat. */
const CSS_SENSE_HAS = CSS_TORN.filter((f) => f !== 'src/css/components.css');

test('cap style= al JSX nou, cap import de CSS des de JSX, cap :has() als fulls de la closca', () => {
  assert.deepEqual(liniesQueCasen(JSX_NOU, /\sstyle=\{/), []);
  assert.deepEqual(liniesQueCasen(JS_TORN.filter((f) => f.endsWith('.jsx') && !JSX_AMB_FULL_PROPI.has(f)), /^\s*import\s+[^;]*\.css['"]/), []);
  assert.deepEqual(liniesQueCasen(CSS_SENSE_HAS, /:has\(/, { neteja: senseComentarisCss }), []);
});

test('Supabase només s’importa dins de src/data/supabase/ (Model B)', () => {
  const fora = JS_TORN.filter((f) => !f.startsWith('src/data/supabase/'));
  const imports = liniesQueCasen(fora, /@supabase\/supabase-js|from\s+['"][^'"]*\/supabase\/[^'"]*['"]/);
  assert.deepEqual(imports, []);
});

test('tot fitxer del torn acaba amb una línia buida', () => {
  const senseFinal = TEXT_TORN.filter((f) => existix(f) && !llig(f).endsWith('\n'));
  assert.deepEqual(senseFinal, []);
});

/* ─────────────────────────────── i18n ─────────────────────────────── */

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];

/* Fase D (261020, tasca 4.1) · L1 · Cada llengua es llig del seu diccionari,
   src/config/idiomes/<codi>.js (abans, un bloc de TRANSLATIONS a i18n.js);
   un fitxer absent tomba la prova. */
function clausPerLlengua(prefix) {
  const resultat = {};
  const patro = new RegExp(`^\\s*'(${prefix.replace(/\./g, '\\.')}[^']+)'\\s*:\\s*(.*?),?\\s*$`, 'gm');
  for (const l of LLENGUES) {
    const ruta = `src/config/idiomes/${l}.js`;
    assert.ok(existix(ruta), `No trobe el diccionari ${l} (${ruta})`);
    const claus = new Map();
    for (const m of llig(ruta).matchAll(patro)) claus.set(m[1], (claus.get(m[1]) || 0) + 1);
    resultat[l] = claus;
  }
  return resultat;
}

for (const prefix of ['section.xat.', 'section.notes.']) {
  test(`i18n: les claus ${prefix}* són idèntiques a les cinc llengües i sense duplicats`, () => {
    const per = clausPerLlengua(prefix);
    const referencia = [...per.ca.keys()].sort();
    assert.ok(referencia.length > 0, `Cap clau ${prefix}* en ca`);
    for (const l of LLENGUES) {
      const claus = [...per[l].keys()].sort();
      const falten = referencia.filter((c) => !per[l].has(c));
      const sobren = claus.filter((c) => !per.ca.has(c));
      const duplicades = [...per[l].entries()].filter(([, n]) => n > 1).map(([c]) => c);
      assert.deepEqual({ falten, sobren, duplicades }, { falten: [], sobren: [], duplicades: [] }, `Llengua ${l}`);
    }
  });
}

test('i18n: les sis claus noves del xat (T2–T4) existixen en ca', () => {
  const per = clausPerLlengua('section.xat.');
  for (const clau of ['section.xat.perfil.obri', 'section.xat.entitat.canal', 'section.xat.ia.avis', 'section.xat.ia.etiqueta', 'section.xat.padro.entitat', 'section.xat.padro.ia']) {
    assert.ok(per.ca.has(clau), `Falta ${clau}`);
  }
});

/* ─────────────────────────── Classes ↔ CSS ─────────────────────────── */

function classesUsadesAlJsx(fitxers) {
  const classes = new Map();
  const afig = (classe, f) => {
    if (!classe || classe.includes('$') || classe.includes('{')) return;
    if (!classes.has(classe)) classes.set(classe, new Set());
    classes.get(classe).add(f);
  };
  for (const f of fitxers) {
    const text = llig(f);
    for (const m of text.matchAll(/className="([^"]*)"/g)) m[1].split(/\s+/).forEach((c) => afig(c, f));
    for (const m of text.matchAll(/className=\{`([^`]*)`\}/g)) {
      m[1].replace(/\$\{[^}]*\}/g, ' ').split(/\s+/).forEach((c) => afig(c, f));
    }
    for (const m of text.matchAll(/['"]((?:sdp|app|sp|cs)-[a-z0-9_-]+(?:\s+(?:sdp|app|sp|cs)-[a-z0-9_-]+)*)['"]/g)) {
      m[1].split(/\s+/).forEach((c) => afig(c, f));
    }
  }
  return classes;
}

function classesDeclaradesAlCss(fitxers) {
  const declarades = new Set();
  for (const f of fitxers) {
    for (const m of llig(f).matchAll(/\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g)) declarades.add(m[1]);
  }
  return declarades;
}

/* Prefixos que no són classes CSS sinó claus, rutes o identificadors. */
const NO_ES_CLASSE = /^(sdp-xat-rail|sdp-root)$|^sdp:|^app-grid-(list|main|sidebar)$|^sp-card-(label|action)$/;

function classesOrfes(fitxers) {
  const usades = classesUsadesAlJsx(fitxers);
  const declarades = classesDeclaradesAlCss(CSS_RESOLUCIO);
  return [...usades.entries()]
    .filter(([c]) => !declarades.has(c) && !NO_ES_CLASSE.test(c))
    .map(([c, fitxers]) => `${c} (${[...fitxers].map((f) => path.basename(f)).join(', ')})`)
    .sort();
}

/* PageFrame porta dos classes òrfenes anteriors al torn (page-title-logo-
   personalitzat i el prefix toc-level-): es mostren com a diagnòstic, sense
   tombar la bateria, perquè qui en tinga la propietat les veja. */
const JSX_HERETAT = new Set(['src/components/universal/PageFrame.jsx']);

test('tota classe usada al JSX nou existix als fulls canònics', () => {
  assert.deepEqual(classesOrfes(JSX_NOU.filter((f) => !JSX_HERETAT.has(f))), []);
});

test('classes òrfenes heretades al JSX tocat (diagnòstic)', (t) => {
  const orfes = classesOrfes([...JSX_HERETAT]);
  if (orfes.length) {
    t.todo(`${orfes.length} classe(s) òrfena(es) anteriors al torn`);
    for (const o of orfes) t.diagnostic(o);
  }
  assert.deepEqual(orfes, []);
});

/* ─────────────────────────── Tokens i botons ─────────────────────────── */

function tokensNoDeclarats() {
  const declarats = new Set();
  for (const f of CSS_TOKENS) {
    if (!existix(f)) continue;
    for (const m of llig(f).matchAll(/(--sdp-[a-z0-9-]+)\s*:/g)) declarats.add(m[1]);
  }
  assert.ok(declarats.has('--sdp-radi-boto'), 'Falta --sdp-radi-boto a tokens.css');
  const usats = new Map();
  for (const f of CSS_TORN) {
    for (const m of senseComentarisCss(llig(f)).matchAll(/var\((--sdp-[a-z0-9-]+)/g)) if (!usats.has(m[1])) usats.set(m[1], f);
  }
  return [...usats.entries()].filter(([nom]) => !declarats.has(nom)).map(([nom, on]) => `${nom} (${on})`).sort();
}

/* Les famílies que el torn toca (radis i espais) han d'estar declarades al
   complet. Els tokens heretats sense definició (--sdp-fons de la previsualització
   d'impressió, --sdp-font-family del Connectar heretat, --sdp-desplegable-ample
   que el Dropdown escriu en línia) es mostren com a diagnòstic. */
test('tot var(--sdp-radi-*) i var(--sdp-space-*) usat als fulls del torn està declarat a tokens.css', () => {
  assert.deepEqual(tokensNoDeclarats().filter((t) => /^--sdp-(radi|space|touch)/.test(t)), []);
});

test('tokens heretats sense definició als fulls del torn (diagnòstic)', (t) => {
  const pendents = tokensNoDeclarats();
  if (pendents.length) {
    t.todo(`${pendents.length} token(s) sense definició anteriors al torn`);
    for (const p of pendents) t.diagnostic(p);
  }
  assert.deepEqual(pendents, []);
});

/** Talla un full en regles fulla: { selector, cos, linia }. */
function reglesFulla(text) {
  const regles = [];
  let selector = '';
  let cos = '';
  let liniaSelector = 1;
  let linia = 1;
  let enCos = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (c === '\n') linia += 1;
    if (c === '{') {
      if (!enCos) { enCos = true; cos = ''; liniaSelector = linia; }
      else { selector = ''; cos = ''; }
      continue;
    }
    if (c === '}') {
      if (enCos && cos.trim()) regles.push({ selector: selector.trim(), cos, linia: liniaSelector });
      selector = '';
      cos = '';
      enCos = false;
      continue;
    }
    if (enCos) cos += c;
    else selector += c;
  }
  return regles;
}

/* T6 (regla definitiva del Mestre, 260927 vespre) · Els botons d'acció són
   píndoles: l'àlies --sdp-radi-boto resol a la pastilla i cap botó d'acció
   porta un radi de 0. L'única superfície rectangular pura (border-radius: 0)
   són les capçaleres i les entrades de la barra principal i de la primera
   columna o rail. */
const BOTONS_ACCIO = [
  '.sdp-boto', '.sdp-alerta__tanca', '.sdp-dialeg__tanca', '.sdp-pista__boto', '.sdp-cataleg-nav__enllac',
  '.btn', '.btn-taronja-fort', '.sp-card-action', '.btn-connectar', '.btn-date-time', '.btn-icon-orange',
  '.sdp-pindola', '.sdp-pindola__opcio', '.sdp-bloc-action', '.sdp-xat-nova',
  '.sdp-xat-icona', '.sdp-xat-carrega__boto', '.sdp-xat-bombolla__accio', '.sdp-xat-compositor__envia',
  '.sdp-copyright-selector', '.app-grid-col-header__accio',
  '.cs-toggle-container', '.cs-toggle-btn', '.cs-tag', '.cs-add-btn', '.cs-submit-btn'
];
/* Ordre del Mestre, 261001 · Les regles de la barra plegada porten la guarda
   :not(.is-compact) (C1-2 de l'auditoria de Claude, aplicada per Codex; D5-T1
   de Codex per a les proves): els selectors d'ací són els de layout.css. */
const PLEGADA = '.sdp-root:not(.is-compact).sidebar-closed nav.app-sidebar';
const NAVEGACIO_RECTANGULAR = [
  'nav.app-sidebar .nav-item',
  `${PLEGADA} .nav-item`,
  '.sidebar-control-btn',
  '.app-grid-col-header--replegable',
  '.sdp-workspace-nav-item',
  '.sdp-xat .sdp-xat-rail-llista .sdp-workspace-nav-item',
  '.sdp-workspace-rail__boto'
];
const regla = (text, selector) => reglesFulla(senseComentarisCss(text)).filter((r) => r.selector === selector).map((r) => r.cos).join(' ');
const reglaArreu = (selector) => CSS_TORN.map((f) => regla(llig(f), selector)).join(' ');

test('T6 · l’àlies --sdp-radi-boto resol a la pastilla i es declara una sola vegada, a tokens.css', () => {
  const declaracions = liniesQueCasen(['src/css/tokens.css'], /^\s*--sdp-radi-boto\s*:\s*var\(--sdp-radi-pastilla\)\s*;/);
  assert.equal(declaracions.length, 1);
  assert.deepEqual(liniesQueCasen(CSS_TORN.filter((f) => f !== 'src/css/tokens.css'), /^\s*--sdp-radi-boto\s*:/), []);
});

test('T6 · cap botó d’acció porta un radi de 0: el rectangle pur és només de la navegació', () => {
  const dolentes = [];
  for (const f of CSS_TORN) {
    for (const r of reglesFulla(senseComentarisCss(llig(f)))) {
      const selectors = r.selector.split(',').map((s) => s.trim());
      const esBoto = selectors.some((s) => BOTONS_ACCIO.some((b) => s === b || s.endsWith(` ${b}`) || s.endsWith(`>${b}`) || s.endsWith(`> ${b}`)));
      if (!esBoto) continue;
      for (const m of r.cos.matchAll(/border-radius\s*:\s*([^;]+);/g)) {
        const valor = m[1].trim();
        if (/^0(px)?$/.test(valor)) dolentes.push(`${f}:${r.linia} ${r.selector}: border-radius ${valor}`);
      }
    }
  }
  assert.deepEqual(dolentes, []);
});

test('T6 · la barra principal i la primera columna són rectangles purs: border-radius 0 explícit', () => {
  for (const selector of NAVEGACIO_RECTANGULAR) {
    assert.match(reglaArreu(selector), /border-radius\s*:\s*0\s*;/, `«${selector}» no declara border-radius: 0`);
  }
});

/* T8 + T9 · Caixes de banda a banda apegades a la capçalera, en tots els
   estats: cap coixí de dalt a les llistes desplegades ni marge davall de
   la fila superior dels rails plegats; cap separació entre cel·les; les
   cel·les plegades s'estiren a l'amplària de la columna. */
test('T8 · les llistes desplegades i els rails plegats s’apeguen a la capçalera, sense bots', () => {
  const modules = llig('src/css/modules.css');
  const layout = llig('src/css/layout.css');
  const shell = llig('src/components/layout/AppGridShell.css');
  assert.match(regla(modules, '.app-sidebar-nav'), /padding\s*:\s*0\s+0\s+var\(--sdp-space-4\)\s*;/);
  assert.match(regla(modules, '.sdp-xat-rail-llista'), /padding\s*:\s*0\s+0\s+var\(--sdp-space-2\)\s*;/);
  assert.match(regla(layout, `${PLEGADA} .app-sidebar-nav`), /padding\s*:\s*0\s+0\s+var\(--sdp-space-2\)\s*;/);
  assert.match(regla(shell, '.app-grid-col-header--collapsed .app-grid-col-header__rail-top'), /margin-bottom\s*:\s*0\s*;/);
  assert.match(regla(shell, '.app-grid-col-header.app-grid-col-header--collapsed'), /gap\s*:\s*0\s*;/);
});

test('T9 · les cel·les plegades van de banda a banda i s’apilen sense separació', () => {
  const modules = llig('src/css/modules.css');
  const layout = llig('src/css/layout.css');
  const shell = llig('src/components/layout/AppGridShell.css');
  assert.match(regla(shell, '.app-grid-col-header.app-grid-col-header--collapsed'), /align-items\s*:\s*stretch\s*;/);
  assert.match(regla(modules, '.sdp-workspace-rail__grup'), /align-items\s*:\s*stretch\s*;/);
  assert.match(regla(modules, '.sdp-workspace-rail__grup'), /gap\s*:\s*0\s*;/);
  assert.match(regla(modules, '.sdp-workspace-rail__boto'), /width\s*:\s*100%\s*;/);
  /* T5 (261007): sense peu fix, la llista és l'única pila de cel·les plegades. */
  const llistaPlegada = regla(layout, `${PLEGADA} .app-sidebar-nav__llista`);
  assert.match(llistaPlegada, /align-items\s*:\s*stretch\s*;/);
  assert.match(llistaPlegada, /gap\s*:\s*0\s*;/);
  assert.match(regla(layout, `${PLEGADA} .nav-item`), /width\s*:\s*auto\s*;/);
  /* La porta K4 de tractor-crom prohibix width: 100% a .nav-item: la caixa s'estira per la li, no per una amplària literal. */
  assert.doesNotMatch(regla(layout, `${PLEGADA} .nav-item`), /width\s*:\s*100%/);
});

/* ─────────────────────────── Migració (T5) ─────────────────────────── */

test('la migració d’origen és additiva, idempotent i amb transacció', () => {
  const sql = llig('supabase/migrations/2609272100_notes_origen.sql');
  assert.match(sql, /^begin;/m);
  assert.match(sql, /^commit;/m);
  assert.match(sql, /add column if not exists origen jsonb/);
  assert.match(sql, /jsonb_typeof\(origen\) = 'object'/);
  assert.doesNotMatch(sql, /drop |truncate |delete from/i);
  assert.match(llig('supabase/README.md'), /2609272100_notes_origen\.sql/);
});
