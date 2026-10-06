// @vitest-environment node
/* Plataforma d'Apps Enxufables · qualitat: les portes del repo sobre TOTS els
   fitxers .js i .jsx de src/apps/ (proves i suport inclosos) i sobre els
   fitxers del nucli que la plataforma toca (App.jsx, RouteSEO.jsx i, des del
   pont de sessió del 261006, IdentitatContext.jsx). ESLint amb la
   configuració del projecte i zero missatges (l'equivalent de
   --max-warnings=0), i les regles de Pedra Seca per text, també sobre
   apps.css. Els patrons vetats es componen a trossos perquè les portes que
   llegixen src/ no els troben ací (patró de src/sections/gestoria/qualitat.test.js). */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

function fitxersDe(directori, extensio = /\.jsx?$/) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta, extensio));
    else if (extensio.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

const APPS = fitxersDe('src/apps');
const NUCLI_TOCAT = ['src/app/App.jsx', 'src/hooks/RouteSEO.jsx', 'src/app/contexts/IdentitatContext.jsx'];
const TOTS = [...APPS, ...NUCLI_TOCAT];
const esProva = (f) => /\.test\.jsx?$/.test(f) || f.includes('/__fixtures__/');
const PRODUCCIO = APPS.filter((f) => !esProva(f));
const JSX = PRODUCCIO.filter((f) => f.endsWith('.jsx'));
const CSS_APPS = 'src/apps/plataforma/apps.css';
const especificadors = (codi) => [...codi.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
const senseComentarisCss = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');

/* Els valors de className d'un JSX: literals i les dues branques d'una ternària. */
function classesDe(codi) {
  return [...codi.matchAll(/className=(?:"([^"]+)"|\{([^}]+)\})/g)]
    .flatMap(([, literal, expressio]) => (literal ? [literal] : [...expressio.matchAll(/'([^']+)'/g)].map((m) => m[1])))
    .flatMap((valor) => valor.split(/\s+/).filter(Boolean));
}

/* Classes amb regla: tot selector de regla dels fulls donats. */
function classesAmbRegla(fulls) {
  const classes = new Set();
  for (const full of fulls) {
    for (const [, selector] of senseComentarisCss(llig(full)).matchAll(/([^{}]+)\{/g)) {
      if (selector.trim().startsWith('@')) continue;
      for (const m of selector.matchAll(/\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)/g)) classes.add(m[1]);
    }
  }
  return classes;
}

describe('el cens', () => {
  test('la plataforma i els dos marcadors hi són, proves incloses', () => {
    for (const esperat of [
      'plataforma/manifestApp.js', 'plataforma/registreApps.js', 'plataforma/interruptors.js', 'plataforma/rutesAplicacio.js',
      'plataforma/RutaApps.jsx', 'plataforma/BarraLateral.jsx', 'plataforma/BarraApp.jsx', 'plataforma/PortalApps.jsx',
      'plataforma/ClosaAplicacio.jsx', 'plataforma/AvisApp.jsx', 'plataforma/sessioApp.js',
      'plataforma/fontSessio.js', 'plataforma/ContextApp.jsx', 'plataforma/fronteres.test.js',
      'plataforma/manifestApp.test.js', 'plataforma/registreApps.test.js', 'plataforma/interruptors.test.js',
      'plataforma/RutaApps.test.jsx', 'plataforma/BarraApp.test.jsx', 'plataforma/ClosaAplicacio.test.jsx',
      'plataforma/sessioApp.test.jsx',
      'plataforma/qualitat.test.js',
      'bar/manifest.js', 'bar/AppBar.jsx', 'salut/manifest.js', 'salut/AppSalut.jsx'
    ]) expect(APPS, esperat).toContain(`src/apps/${esperat}`);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a tots els fitxers', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís és un error amb --max-warnings=0).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/apps/plataforma/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});

describe('Pedra Seca · JSX', () => {
  const h1 = new RegExp(['<h', '1[\\s>]'].join(''));

  test('cap style=, className literal o ternària de literals, cap classe d’utilitat', () => {
    const utilitats = /^sdp-(?:w|h|p|m|mt|mb|ml|mr|px|py|gap|bg|border|text|font|radius)-|^sdp-(?:flex|grid)(?:-|$)/;
    for (const fitxer of JSX) {
      const codi = llig(fitxer);
      expect(/\sstyle=[{"]/.test(codi), `${fitxer}: style=`).toBe(false);
      for (const [, expressio] of codi.matchAll(/className=\{([^}]*)\}/g)) {
        expect(expressio.trim(), `${fitxer}: className={${expressio}}`).toMatch(/^[^?'"`]+\?\s*'[^']*'\s*:\s*'[^']*'$/);
      }
      for (const classe of classesDe(codi)) expect(utilitats.test(classe), `${fitxer}: ${classe}`).toBe(false);
    }
  });

  test('h1 només dins de header.page-title; cap h1 ni h2 acaba en punt', () => {
    for (const fitxer of JSX) {
      const codi = llig(fitxer);
      const h1s = codi.split(h1).length - 1;
      if (h1s) {
        expect(h1s, fitxer).toBe(1);
        expect(codi, fitxer).toMatch(/<header className="page-title">\s*<h1[\s>]/);
      }
      for (const [, text] of codi.matchAll(/<h[12][^>]*>([^<{]*)<\/h[12]>/g)) {
        expect(text.trim().endsWith('.'), `${fitxer}: «${text}»`).toBe(false);
      }
    }
  });

  test('tota classe sdp-app-* té regla a apps.css; la resta, a un full canònic o heretada de la barra d’App.jsx', () => {
    const propies = classesAmbRegla([CSS_APPS]);
    const canoniques = classesAmbRegla([...fitxersDe('src/css', /\.css$/), 'src/components/layout/AppGridShell.css']);
    const heretades = new Set(classesDe(llig('src/app/App.jsx')));
    const sdpApp = [];
    const orfes = [];
    for (const fitxer of JSX) {
      for (const classe of classesDe(llig(fitxer))) {
        if (classe.startsWith('sdp-app-')) {
          sdpApp.push(classe);
          if (!propies.has(classe)) orfes.push(`${fitxer}: .${classe}`);
        } else if (!canoniques.has(classe) && !heretades.has(classe)) {
          orfes.push(`${fitxer}: .${classe}`);
        }
      }
    }
    expect(new Set(sdpApp).size).toBeGreaterThan(8);
    expect(orfes).toEqual([]);
  });
});

describe('Pedra Seca · apps.css', () => {
  const css = senseComentarisCss(llig(CSS_APPS));
  const regles = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, cos]) => ({ selector: selector.trim(), cos }));

  test('totes les regles porten el prefix .sdp-app-* i cap reutilitza un nom ja pres', () => {
    expect(regles.length).toBeGreaterThan(8);
    const presos = ['sdp-app-grid-shell', 'sdp-app-error', 'sdp-app-loading'];
    for (const { selector } of regles) {
      for (const part of selector.split(',')) expect(part, 'selector sense prefix').toMatch(/\.sdp-app-/);
      for (const pres of presos) expect(selector.includes(`.${pres}`), `${selector}: ${pres}`).toBe(false);
    }
  });

  test('només tokens --sdp-* declarats, sense fallback ni primitives; cap color en brut ni declaració de token', () => {
    const declarats = new Set();
    for (const full of ['src/css/tokens.css', 'src/css/design-tokens.css']) {
      for (const m of llig(full).matchAll(/(--sdp-[a-z0-9-]+)\s*:/g)) declarats.add(m[1]);
    }
    const usats = [...css.matchAll(/var\(([^)]*)\)/g)].map((m) => m[1].trim());
    expect(usats.length).toBeGreaterThan(10);
    for (const us of usats) {
      expect(us, 'fallback').toMatch(/^--sdp-[a-z0-9-]+$/);
      expect(declarats.has(us), `${us} no declarat`).toBe(true);
      expect(/^--sdp-(?:pedra|primary|secondary|error|avis|exit)-\d+$|^--sdp-(?:blanc|negre)/.test(us), `${us} és primitiu`).toBe(false);
    }
    expect(css).not.toMatch(new RegExp(['#[0-9a-fA-F]{3,8}\\b|\\brgba?\\(|\\bhsla?\\(', '|--sdp-[a-z0-9-]+\\s*:'].join('')));
  });

  test('sense ombres, :has(), !important, @layer ni @import; rem en múltiples de 0,25 i px només per a vores d’1px', () => {
    const vetat = new RegExp(['box-', 'shadow|:', 'has\\(|!', 'important|@', 'layer|@', 'import'].join(''));
    expect(vetat.test(css)).toBe(false);
    for (const [, valor] of css.matchAll(/(\d*\.?\d+)rem/g)) expect(Number(valor) % 0.25, `${valor}rem`).toBe(0);
    for (const [, valor] of css.matchAll(/(\d*\.?\d+)px/g)) expect(valor, `${valor}px`).toBe('1');
  });

  test('l’àrea única reserva, en compacte, l’alçada de la barra mòbil (la barra d’accions del TPV no queda tapada)', () => {
    const reserva = regles.filter(({ selector }) => selector === ':where(.sdp-root.is-compact) .sdp-app-unica');
    expect(reserva).toHaveLength(1);
    expect(reserva[0].cos).toMatch(/padding-bottom:\s*calc\(var\(--sdp-alt-nav-mobil\) \+ env\(safe-area-inset-bottom, 0rem\)\)/);
    const base = regles.find(({ selector }) => selector === '.sdp-app-unica');
    expect(base.cos).toMatch(/position:\s*absolute/);
    expect(base.cos).toMatch(/overflow:\s*hidden/);
  });

  test('index.css l’importa una sola vegada, dins de la capa components', () => {
    const index = llig('src/css/index.css');
    expect(index.split('apps/plataforma/apps.css').length - 1).toBe(1);
    expect(index).toContain("@import url('../apps/plataforma/apps.css') layer(components);");
  });
});

describe('higiene i fronteres del codi', () => {
  test('fora de proves: cap emmagatzematge directe, cap global escrita, res fora del Baseline', () => {
    const vetats = [
      [new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB'].join('')), 'emmagatzematge directe (només storage.js)'],
      [/(?:window|globalThis)\.\w+\s*=[^=]/, 'global escrita'],
      [/\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers/, 'fora del Baseline'],
      [/\(\?<[=!]/, 'lookbehind']
    ];
    const trobats = PRODUCCIO.flatMap((fitxer) => {
      const codi = llig(fitxer);
      return vetats.filter(([patro]) => patro.test(codi)).map(([, que]) => `${fitxer}: ${que}`);
    });
    expect(trobats).toEqual([]);
  });

  test('cap HTML cru (tampoc a les proves)', () => {
    const cru = new RegExp(['\\binner', 'HTML\\b|\\bouter', 'HTML\\b|insertAdjacent', 'HTML|dangerously', 'SetInnerHTML'].join(''));
    for (const fitxer of APPS) expect(cru.test(llig(fitxer)), fitxer).toBe(false);
  });

  test('cap caràcter de control, invisible ni bidi en cru', () => {
    const rangs = [[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x061C, 0x061C], [0x200B, 0x200F],
      [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF]];
    const car = (cp) => String.fromCodePoint(cp);
    const re = new RegExp(`[${rangs.map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');
    for (const fitxer of [...TOTS, CSS_APPS]) expect(re.test(llig(fitxer)), fitxer).toBe(false);
  });

  test('el suport de proves (__fixtures__) no l’importa cap fitxer de producció', () => {
    const trobats = PRODUCCIO.flatMap((fitxer) => especificadors(llig(fitxer)).filter((e) => e.includes('__fixtures__')).map((e) => `${fitxer}: ${e}`));
    expect(trobats).toEqual([]);
  });

  test('una app només entra a la plataforma per l’API pública (plataforma/index.js)', () => {
    const deLesApps = PRODUCCIO.filter((f) => !f.startsWith('src/apps/plataforma/'));
    const trobats = deLesApps.flatMap((fitxer) => especificadors(llig(fitxer))
      .filter((e) => e.includes('/plataforma/') && !/\/plataforma\/index\.js$/.test(e)).map((e) => `${fitxer}: ${e}`));
    expect(trobats).toEqual([]);
  });

  /* P1-R1 · Ordre del Mestre (261002, sinergies T4/T8): un sol esquelet visual.
     Cap app munta la closca de tres columnes a mà: totes passen per
     ClosaAplicacio (plataforma/index.js), que és l'única que la importa. */
  test('cap app munta AppGridShell a mà: l’esquelet comú és ClosaAplicacio', () => {
    const closca = /components\/layout\/AppGridShell(?:\.jsx)?$/;
    /* Sonda: les dues formes d'importar-la casen; la capçalera de columna, no. */
    expect(especificadors("import A from '../../components/layout/AppGridShell.jsx';").filter((e) => closca.test(e))).toHaveLength(1);
    expect(especificadors("import { useAppGrid } from '../../components/layout/AppGridShell';").filter((e) => closca.test(e))).toHaveLength(1);
    expect(closca.test('../../components/layout/AppGridColumn.jsx')).toBe(false);
    const deLesApps = PRODUCCIO.filter((f) => !f.startsWith('src/apps/plataforma/'));
    const trobats = deLesApps.flatMap((fitxer) => especificadors(llig(fitxer))
      .filter((e) => closca.test(e)).map((e) => `${fitxer}: ${e}`));
    expect(trobats).toEqual([]);
    const dePlataforma = PRODUCCIO.filter((f) => f.startsWith('src/apps/plataforma/')
      && especificadors(llig(f)).some((e) => closca.test(e)));
    expect(dePlataforma).toEqual(['src/apps/plataforma/ClosaAplicacio.jsx']);
    expect(llig('src/apps/plataforma/index.js')).toMatch(/export \{ ClosaAplicacio, useClosaAplicacio, validaTaulaDeClosa \} from '\.\/ClosaAplicacio\.jsx';/);
  });

  test('cada app interna carrega darrere del literal de compilació, perquè Vite la tregui del build', () => {
    /* Directoris de src/apps que no són apps: la plataforma i l'esquelet comú
       (src/apps/comu, ordre del Mestre T4/T8), que no té manifest ni es registra. */
    const noApps = new Set(['plataforma', 'comu']);
    const apps = readdirSync(path.join(ARREL, 'src/apps'), { withFileTypes: true })
      .filter((d) => d.isDirectory() && !noApps.has(d.name)).map((d) => d.name).sort();
    expect(apps).toEqual(expect.arrayContaining(['bar', 'nevera', 'salut']));
    expect(llig('src/apps/plataforma/registreApps.js')).not.toContain("from '../comu/");
    for (const id of apps) {
      const manifest = llig(`src/apps/${id}/manifest.js`);
      const literal = `import.meta.env.DEV || import.meta.env.VITE_SDP_APP_${id.toUpperCase().replace(/-/g, '_')} === '1' ? () => import('./`;
      expect(manifest, `${id}: literal de compilació`).toContain(literal);
      expect(manifest.split('import(').length - 1, `${id}: una sola importació dinàmica`).toBe(1);
      expect(llig('src/apps/plataforma/registreApps.js'), `${id}: registrada`).toContain(`from '../${id}/manifest.js'`);
    }
  });
});
