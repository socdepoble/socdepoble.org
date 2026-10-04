/**
 * Contracte de tokens compartit (pla 261004_0050, decisions Q1-Q8 del Mestre,
 * 261004). D1 declara; la resta de fulls només consumixen. La prova llig els
 * fitxers de veres (tokens.css, design-tokens.css, design-tokens.json i
 * base.css) i resol els colors fins al hex per mesurar el contrast WCAG.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const TOKENS = llig('src/css/tokens.css');
const CANON = llig('src/css/design-tokens.css');
const JSON_TOKENS = JSON.parse(llig('src/config/design-tokens.json'));
const BASE = llig('src/css/base.css');

const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const declaracions = (text) => Object.fromEntries(
  [...senseComentaris(text).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
);

/** El cos del bloc que obri `selector {` (selector exacte, a principi de línia). */
function bloc(text, selector) {
  const inici = text.indexOf(`\n${selector} {`);
  expect(inici, `falta el bloc ${selector}`).toBeGreaterThan(-1);
  const obre = text.indexOf('{', inici);
  let prof = 0;
  for (let i = obre; i < text.length; i++) {
    if (text[i] === '{') prof++;
    if (text[i] === '}' && --prof === 0) return { inici: inici + 1, fi: i, cos: text.slice(obre + 1, i) };
  }
  throw new Error(`bloc sense tancar: ${selector}`);
}

const PRINCIPAL = bloc(TOKENS, ':root, :host, .sdp-root');
const FOSC = bloc(TOKENS, ':root[data-theme="dark"], :host([data-theme="dark"]),\n:root[data-theme="dark"] .sdp-root, :host([data-theme="dark"]) .sdp-root');
const SEL_BANCAL = ':root[data-contrast="bancal"], :host([data-contrast="bancal"]),\n:root[data-contrast="bancal"] .sdp-root, :host([data-contrast="bancal"]) .sdp-root';
const SEL_BANCAL_FOSC = ':root[data-theme="dark"][data-contrast="bancal"], :host([data-theme="dark"][data-contrast="bancal"]),\n'
  + ':root[data-theme="dark"][data-contrast="bancal"] .sdp-root, :host([data-theme="dark"][data-contrast="bancal"]) .sdp-root';
const BANCAL = bloc(TOKENS, SEL_BANCAL);
const BANCAL_FOSC = bloc(TOKENS, SEL_BANCAL_FOSC);

const CLAR = { ...declaracions(CANON), ...declaracions(PRINCIPAL.cos) };
const MAPA_FOSC = { ...CLAR, ...declaracions(FOSC.cos) };
const MAPA_BANCAL = { ...CLAR, ...declaracions(BANCAL.cos) };
const MAPA_BANCAL_FOSC = { ...MAPA_FOSC, ...declaracions(BANCAL.cos), ...declaracions(BANCAL_FOSC.cos) };

function resol(valor, mapa, vistos = new Set()) {
  return valor.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    expect(vistos.has(nom), `cicle a ${nom}`).toBe(false);
    expect(mapa[nom], `falta ${nom}`).toBeDefined();
    return resol(mapa[nom], mapa, new Set([...vistos, nom]));
  }).trim();
}
function luminancia(hex) {
  expect(hex, 'color opac de sis xifres').toMatch(/^#[0-9a-f]{6}$/i);
  const [r, g, b] = hex.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b, mapa) {
  const [la, lb] = [luminancia(resol(`var(${a})`, mapa)), luminancia(resol(`var(${b})`, mapa))];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe('contracte compartit · moviment, focus, tàctil i tipografia al primer bloc', () => {
  const P = declaracions(PRINCIPAL.cos);

  test('moviment: durades, corbes i escales amb el valor exacte del contracte', () => {
    expect(P).toMatchObject({
      '--sdp-durada-premut': '100ms',
      '--sdp-durada-rapida': '180ms',
      '--sdp-durada-base': '200ms',
      '--sdp-durada-panell': '280ms',
      '--sdp-durada-sostre': '300ms',
      '--sdp-corba-eixida': 'cubic-bezier(0.23, 1, 0.32, 1)',
      '--sdp-corba-moviment': 'cubic-bezier(0.77, 0, 0.175, 1)',
      '--sdp-corba-calaix': 'cubic-bezier(0.32, 0.72, 0, 1)',
      '--sdp-corba-suau': 'cubic-bezier(0.2, 0.7, 0.3, 1)',
      '--sdp-escala-premut': '0.97',
      '--sdp-escala-aparicio': '0.96',
      '--sdp-despl-aparicio': 'var(--sdp-space-2)'
    });
  });

  test('Fase C: --sdp-t és la ràpida amb la corba d’eixida; --sdp-t-lenta conserva el valor d’abans', () => {
    expect(P['--sdp-t']).toBe('var(--sdp-durada-rapida) var(--sdp-corba-eixida)');
    expect(P['--sdp-t-lenta']).toBe('var(--sdp-durada-sostre) var(--sdp-corba-suau)');
    expect(resol(P['--sdp-t-lenta'], CLAR)).toBe('300ms cubic-bezier(0.2, 0.7, 0.3, 1)');
  });

  test('moviment reduït: escales a 1 i desplaçament a 0, fora del bloc clar', () => {
    const reduit = /@media \(prefers-reduced-motion: reduce\) \{\s*:root, :host, \.sdp-root \{([^}]*)\}\s*\}/.exec(TOKENS);
    expect(reduit).not.toBeNull();
    expect(declaracions(reduit[1])).toEqual({
      '--sdp-escala-premut': '1',
      '--sdp-escala-aparicio': '1',
      '--sdp-despl-aparicio': '0'
    });
    expect(reduit.index).toBeGreaterThan(FOSC.fi);
  });

  test('focus: gruix 3px i separació 2px', () => {
    expect(P['--sdp-focus-gruix']).toBe('3px');
    expect(P['--sdp-focus-separacio']).toBe('2px');
    expect(PRINCIPAL.cos.indexOf('--sdp-focus-gruix')).toBeGreaterThan(PRINCIPAL.cos.indexOf('--sdp-focus-invers'));
  });

  test('Q2 · 48px sempre: --sdp-touch, la capa 0 generada i el JSON diuen el mateix', () => {
    expect(P['--sdp-touch']).toBe('48px');
    expect(declaracions(CANON)['--sdp-touch-min']).toBe('48px');
    expect(JSON_TOKENS.tacte.minim_absolut).toMatchObject({ value_px: 48, css_var: '--sdp-touch-min' });
    expect(JSON_TOKENS.tacte.minim_absolut.nota_normativa).toContain('Mestre 261004: 48px sempre');
    expect(resol('var(--sdp-bloc-control)', CLAR)).toBe('max(48px, 48px)');
  });

  test('design-tokens.css és exactament el que escriuria tooling/scripts/build-tokens.mjs', () => {
    const px = (o) => (o.value_rem ? o.value_rem : `${o.value_px}px`);
    let css = '/* AUTO-GENERATED FROM design-tokens.json */\n:root, :host, .sdp-root {\n';
    css += '  /* Color */\n';
    for (const o of Object.values(JSON_TOKENS.color || {})) css += `  ${o.css_var}: ${o.value};\n`;
    css += '\n  /* Radi */\n';
    for (const o of Object.values(JSON_TOKENS.radi || {})) css += `  ${o.css_var}: ${px(o)};\n`;
    css += '\n  /* Tacte */\n';
    for (const o of Object.values(JSON_TOKENS.tacte || {})) css += `  ${o.css_var}: ${px(o)};\n`;
    css += '\n  /* Tipografia */\n';
    for (const o of Object.values(JSON_TOKENS.tipografia || {})) css += `  ${o.css_var}: ${px(o)};\n`;
    css += '}\n';
    expect(CANON).toBe(css);
  });

  test('tipografia fluida: valors exactes, mínims ajustats per a mòbil i interpolació de 320 a 1024px', () => {
    const FLUIDS = {
      '--sdp-fluid-h1': 'clamp(2rem, 1.3182rem + 3.4091vw, 3.5rem)',
      '--sdp-fluid-h2': 'clamp(1.75rem, 1.2386rem + 2.5568vw, 2.875rem)',
      '--sdp-fluid-h3': 'clamp(1.5rem, 1.1591rem + 1.7045vw, 2.25rem)',
      '--sdp-fluid-h4': 'clamp(1.25rem, 0.9659rem + 1.4205vw, 1.875rem)',
      '--sdp-fluid-h5': 'clamp(1.125rem, 0.8977rem + 1.1364vw, 1.625rem)',
      '--sdp-fluid-h6': 'clamp(1rem, 0.8295rem + 0.8523vw, 1.375rem)',
      '--sdp-fluid-lead': 'clamp(1.125rem, 1.0114rem + 0.5682vw, 1.375rem)',
      '--sdp-fluid-cos': 'clamp(1rem, 0.8864rem + 0.5682vw, 1.25rem)'
    };
    for (const [token, esperat] of Object.entries(FLUIDS)) {
      expect(P[token], token).toBe(esperat);
      const [, min, a, b, max] = /^clamp\(([\d.]+)rem, ([\d.]+)rem \+ ([\d.]+)vw, ([\d.]+)rem\)$/.exec(P[token]).map(Number);
      // El terme preferit toca el mínim a 320px i el màxim a 1024px (mig píxel de marge).
      expect(Math.abs(a * 16 + b * 3.2 - min * 16), token).toBeLessThan(0.05);
      expect(Math.abs(a * 16 + b * 10.24 - max * 16), token).toBeLessThan(0.05);
      expect(max / min, `${token}: creixement moderat`).toBeLessThanOrEqual(1.8);
    }
  });

  /* Fluida relativa al contenidor (decisió de MarIA, 261004) sense trencar la
     Baseline 2022: el cqi només viu dins de @supports (width: 1cqi). Una
     segona declaració de la mateixa custom property al bloc principal NO fa
     de reserva (no es valida en llegir-la): en Chrome 100 o Firefox 100 el
     var() seria invàlid i el títol heretaria la mida del pare. */
  test('tipografia fluida: el cqi només dins de @supports (width: 1cqi), amb els mateixos valors que la base en vw', () => {
    const net = senseComentaris(TOKENS);
    const inici = net.indexOf('@supports (width: 1cqi) {');
    expect(inici, 'falta el bloc @supports (width: 1cqi)').toBeGreaterThan(-1);
    const obre = net.indexOf('{', inici);
    let prof = 0;
    let fi = -1;
    for (let i = obre; i < net.length; i++) {
      if (net[i] === '{') prof++;
      if (net[i] === '}' && --prof === 0) { fi = i; break; }
    }
    expect(fi, 'el @supports (width: 1cqi) no es tanca').toBeGreaterThan(obre);
    const dins = net.slice(obre + 1, fi);
    const fora = net.slice(0, inici) + net.slice(fi + 1);
    expect(fora, 'cap terme cqi fora del @supports').not.toMatch(/\dcqi\b/);
    expect(dins).toContain(':root, :host, .sdp-root {');
    const D = declaracions(dins);
    const fluids = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'lead', 'cos'].map((n) => `--sdp-fluid-${n}`);
    for (const token of fluids) {
      expect(P[token], `${token}: la base és en vw`).toMatch(/\dvw, /);
      expect(D[token], token).toBe(P[token].replace(/(\d)vw, /, '$1cqi, '));
    }
    expect(Object.keys(D).sort()).toEqual([...fluids].sort());
  });

  test('interlineat 1.2 i 1.6; els noms antics de la prosa en són àlies; amplades de Noto Sans', () => {
    expect(P['--sdp-leading-titol']).toBe('1.2');
    expect(P['--sdp-leading-cos']).toBe('1.6');
    expect(P['--sdp-leading-display']).toBe('var(--sdp-leading-titol)');
    expect(P['--sdp-leading-editorial']).toBe('var(--sdp-leading-cos)');
    // El calendari calcula línies amb --sdp-leading-tight: és mètrica de component i no es toca.
    expect(P['--sdp-leading-tight']).toBe('1.15');
    expect(P['--sdp-font-amplada-semi']).toBe('87.5%');
    expect(P['--sdp-font-amplada-estreta']).toBe('75%');
  });

  test('sòl de 14px: --sdp-ui-sm i --sdp-text-meta no baixen de 0.875rem', () => {
    expect(P['--sdp-ui-sm']).toBe('0.875rem');
    expect(P['--sdp-text-meta']).toBe('0.875rem');
  });

  test('els fluids morts de l’antic «Mètriques del layout» ja no hi són', () => {
    for (const mort of ['--sdp-ctrl-vw', '--sdp-ctrl-scale', '--sdp-step-0', '--sdp-space-base']) {
      expect(TOKENS, mort).not.toContain(`${mort}:`);
    }
  });

  /* D-C (ordre del Mestre del 261004, prompt 261004_0515; escombrada triada al
     xat a les 06:38) · el ritme vertical de la prosa, a la reixeta de 4px:
     l'h5 i l'h6 passen de 6 a 8px. */
  test('D-C · ritme vertical a la reixeta de 4px: marges de prosa en 0 o múltiples de 4px', () => {
    const ritme = Object.entries(P).filter(([nom]) => /^--sdp-(mt|mb)-|^--sdp-li-gap$|^--sdp-bq-indent$/.test(nom));
    expect(ritme.length).toBeGreaterThan(0);
    for (const [nom, valor] of ritme) {
      const px = valor === '0' ? 0 : Number(/^(\d+)px$/.exec(valor)?.[1]);
      expect(px % 4, `${nom}: ${valor}`).toBe(0);
    }
    expect([P['--sdp-mb-h5'], P['--sdp-mb-h6']]).toEqual(['8px', '8px']);
  });

  test('D-C · cap radi fora de l’escala: els àlies apunten a un graó s–xl o a la pastilla', () => {
    const escala = new Set(['--sdp-radi-s', '--sdp-radi-m', '--sdp-radi-g', '--sdp-radi-xl', '--sdp-radi-pastilla']);
    for (const [nom, valor] of Object.entries(P).filter(([n]) => n.startsWith('--sdp-radi-') && !escala.has(n))) {
      expect(valor, nom).toMatch(/^var\(--sdp-radi-(s|m|g|xl|pastilla)\)$/);
    }
    expect(P['--sdp-radi-alerta']).toBe('var(--sdp-radi-s)');
  });
});

describe('les portes que lligen tokens.css continuen veient el mateix tema clar', () => {
  test('cap @media ni [data-theme="dark"] abans del final del bloc clar (tall de tractor-cromatic)', () => {
    expect(TOKENS.indexOf('@media')).toBeGreaterThan(PRINCIPAL.fi);
    expect(TOKENS.indexOf('[data-theme="dark"]')).toBeGreaterThan(PRINCIPAL.fi);
    // Les proves de contrast tallen pel primer `:root[data-theme="dark"]`: ha de ser el bloc fosc.
    expect(TOKENS.indexOf(':root[data-theme="dark"]')).toBe(FOSC.inici);
    expect(BANCAL.inici).toBeGreaterThan(FOSC.fi);
  });

  test('la rampa pedra baixa de lluminositat sense salts enrere, 650 inclòs', () => {
    const graons = Object.keys(CLAR).filter((t) => /^--sdp-pedra-\d+$/.test(t))
      .map((t) => [Number(t.split('-').pop()), luminancia(resol(`var(${t})`, CLAR))])
      .sort((x, y) => x[0] - y[0]);
    expect(graons.map(([n]) => n)).toContain(650);
    for (let i = 1; i < graons.length; i++) expect(graons[i][1], `pedra-${graons[i][0]}`).toBeLessThanOrEqual(graons[i - 1][1] + 1e-6);
  });
});

describe('Fase E · AAA sempre (Q1)', () => {
  const SUPERFICIES = ['--sdp-fons-targeta', '--sdp-fons-app', '--sdp-fons-subtil', '--sdp-fons-lectura'];

  test('clar: títol, cos i text suau passen de 7:1 sobre la targeta, l’app, el fons subtil i el de lectura', () => {
    for (const text of ['--sdp-text-titol', '--sdp-text-cos', '--sdp-text-suau']) {
      for (const fons of SUPERFICIES) expect(contrast(text, fons, CLAR), `${text} sobre ${fons}`).toBeGreaterThanOrEqual(7);
    }
  });

  test('clar: el suau no es confon amb el cos (graó propi)', () => {
    expect(resol('var(--sdp-text-suau)', CLAR)).not.toBe(resol('var(--sdp-text-cos)', CLAR));
    expect(contrast('--sdp-text-suau', '--sdp-fons-targeta', CLAR)).toBeLessThan(contrast('--sdp-text-cos', '--sdp-fons-targeta', CLAR));
  });

  test('hover taronja: el text de damunt continua AAA (abans primary-600, 5,42:1) i cap full el pinta com a text', () => {
    for (const mapa of [CLAR, MAPA_FOSC]) {
      expect(contrast('--sdp-sobre-accent', '--sdp-accent-hover', mapa)).toBeGreaterThanOrEqual(7);
    }
    const fulls = ['src/css/components.css', 'src/css/modules.css', 'src/css/layout.css', 'src/css/base.css'].map(llig).map(senseComentaris).join('\n');
    expect(fulls).not.toMatch(/(?:^|[\s;{])color:\s*var\(--sdp-accent-hover\)/);
  });

  test('anell sobre les barres blaves: 3:1 o més contra --sdp-accio en clar i en fosc', () => {
    expect(contrast('--sdp-focus-sobre-accio', '--sdp-accio', CLAR)).toBeGreaterThanOrEqual(3);
    expect(contrast('--sdp-focus-sobre-accio', '--sdp-accio', MAPA_FOSC)).toBeGreaterThanOrEqual(3);
    // Abans: --sdp-accent-text, 1,42:1.
    expect(contrast('--sdp-accent-text', '--sdp-accio', CLAR)).toBeLessThan(3);
  });
});

describe('Mode Bancal (data-contrast="bancal")', () => {
  const B = declaracions(BANCAL.cos);
  const BF = declaracions(BANCAL_FOSC.cos);

  test('els quatre selectors com el tema fosc, i el bloc fosc niat darrere', () => {
    expect(BANCAL_FOSC.inici).toBeGreaterThan(BANCAL.fi);
  });

  test('cada color del Bancal clar es torna a declarar al niat fosc (si no, pintaria colors de tema clar sobre fons foscos)', () => {
    const colors = Object.keys(B).filter((t) => t !== '--sdp-escala-premut');
    expect(colors.length).toBeGreaterThan(0);
    expect(Object.keys(BF).sort()).toEqual(colors.sort());
  });

  test('cap crom, cap ombra (Q6: les targetes conserven l’ombra), cap translucidesa; premut sense escala', () => {
    for (const t of [...Object.keys(B), ...Object.keys(BF)]) {
      expect(t, t).not.toMatch(/^--sdp-(crom|ombra)-/);
    }
    for (const v of [...Object.values(B), ...Object.values(BF)]) expect(v).not.toMatch(/rgba?\(|transparent/);
    expect(B['--sdp-escala-premut']).toBe('1');
  });

  for (const [tema, mapa, superficies] of [
    ['clar', MAPA_BANCAL, ['--sdp-fons-targeta', '--sdp-fons-app', '--sdp-fons-subtil']],
    ['fosc', MAPA_BANCAL_FOSC, ['--sdp-fons-targeta', '--sdp-fons-app', '--sdp-fons-subtil']]
  ]) {
    test(`${tema}: cos i suau passen de 9:1 sobre totes les superfícies`, () => {
      for (const text of ['--sdp-text-cos', '--sdp-text-suau']) {
        for (const fons of superficies) expect(contrast(text, fons, mapa), `${text} sobre ${fons}`).toBeGreaterThanOrEqual(9);
      }
    });

    test(`${tema}: enllaços i accent de text, 7:1 o més sobre la targeta i l’app; el hover no baixa`, () => {
      for (const text of ['--sdp-accent-text', '--sdp-accent-titol', '--sdp-accent-text-hover']) {
        for (const fons of ['--sdp-fons-targeta', '--sdp-fons-app']) {
          expect(contrast(text, fons, mapa), `${text} sobre ${fons}`).toBeGreaterThanOrEqual(7);
        }
      }
      expect(contrast('--sdp-accent-text-hover', '--sdp-fons-targeta', mapa))
        .toBeGreaterThan(contrast('--sdp-accent-text', '--sdp-fons-targeta', mapa));
    });

    test(`${tema}: el Bancal mai rebaixa el contrast del mode normal`, () => {
      const normal = tema === 'clar' ? CLAR : MAPA_FOSC;
      for (const text of ['--sdp-text-cos', '--sdp-text-suau', '--sdp-accent-text', '--sdp-accent-titol']) {
        expect(contrast(text, '--sdp-fons-targeta', mapa), text)
          .toBeGreaterThanOrEqual(contrast(text, '--sdp-fons-targeta', normal) - 1e-9);
      }
    });
  }
});

describe('base.css consumix el contracte', () => {
  const regla = (selector) => {
    const m = new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`).exec(BASE);
    expect(m, `falta la regla ${selector}`).not.toBeNull();
    return m[1];
  };

  test('prosa fluida: h1-h6, p, llistes i .lead, amb l’interlineat Impeccable', () => {
    for (let n = 1; n <= 6; n++) {
      const cos = regla(`h${n}, .h${n}`);
      expect(cos).toContain(`font-size: var(--sdp-fluid-h${n});`);
      expect(cos).toContain('line-height: var(--sdp-leading-titol);');
    }
    for (const [selector, mida] of [['p', 'cos'], ['ul, ol', 'cos'], ['.lead', 'lead']]) {
      const cos = regla(selector);
      expect(cos, selector).toContain(`font-size: var(--sdp-fluid-${mida});`);
      expect(cos, selector).toContain('line-height: var(--sdp-leading-cos);');
    }
    // Els components no: el títol de targeta conserva el seu token fix a components.css.
    expect(BASE).not.toContain('.sp-card-title');
  });

  test('flux lliure (Mestre 261004): cap topall de mesura ni sagnat a la prosa nua de l’article', () => {
    const net = senseComentaris(BASE);
    expect(net).not.toMatch(/content-wrapper\)[^{]*\{[^}]*max-inline-size/);
    expect(net).not.toMatch(/text-indent/);
  });

  test('imatges de lectura a ample complet, amb especificitat zero', () => {
    expect(BASE).toMatch(/:where\(article\.content-wrapper, \.sdp-prose\) :where\(img:not\(\[class\]\), img\[class=""\]\) \{\s*display: block;\s*inline-size: 100%;\s*block-size: auto;/);
  });

  test('focus amb els tokens de geometria; barres blaves amb --sdp-focus-sobre-accio', () => {
    expect(BASE).toContain(':focus-visible { outline: var(--sdp-focus-gruix) solid var(--sdp-focus); outline-offset: var(--sdp-focus-separacio); }');
    expect(BASE).toMatch(/header\.bar-blue :focus-visible,\s*\.sp-card-footer :focus-visible \{ outline-color: var\(--sdp-focus-sobre-accio\); \}/);
    expect(senseComentaris(BASE)).not.toMatch(/bar-blue[^{]*\{[^}]*--sdp-accent-text/);
  });

  test('un sol apagador de moviment reduït i un bloc de colors forçats amb outline', () => {
    expect(BASE.split('@media (prefers-reduced-motion: reduce)').length).toBe(2);
    const forcats = /@media \(forced-colors: active\) \{([\s\S]*)\}\s*$/.exec(BASE);
    expect(forcats).not.toBeNull();
    expect(forcats[1]).toContain('outline: var(--sdp-focus-gruix) solid CanvasText;');
    expect(forcats[1]).toContain('.sp-card-link-overlay:focus-visible');
  });

  test('cap token fantasma: tot var(--sdp-*) de base.css existix a tokens.css o a la capa 0', () => {
    const declarats = new Set([...Object.keys(CLAR), ...Object.keys(MAPA_FOSC)]);
    const usats = [...new Set([...senseComentaris(BASE).matchAll(/var\((--sdp-[\w-]+)\)/g)].map((m) => m[1]))];
    expect(usats.filter((t) => !declarats.has(t))).toEqual([]);
  });

  test('sòl de 14px al manual de disseny de base.css: cap font-size per davall', () => {
    const mides = [...senseComentaris(BASE).matchAll(/font-size:\s*([\d.]+)(rem|px)/g)].map(([, n, u]) => (u === 'rem' ? Number(n) * 16 : Number(n)));
    expect(mides.filter((px) => px < 14)).toEqual([]);
  });
});
