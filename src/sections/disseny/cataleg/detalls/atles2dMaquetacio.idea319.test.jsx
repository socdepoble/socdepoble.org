/* v1.2.21 · IDEA-319 · P0-MAQUETACIO-CANONICA-UNIVERSAL-H3-H4 (ordre del Mestre del 22-11-2026 a les 14:12,
   captura 01_produccio/261122_1412_captura_error_maquetacio_atles_2d_amplada_paragraf_lletra_menuda_i_h2_h3_h4.png).
   Dins del cos d'una UniversalPage, el h1 i l'únic h2 (el subtítol) els pinta la capçalera. Per això, a les cinc
   pàgines de l'Atles 2D i a l'Inventari global:
   · cap h1 ni h2 dins del cos; cada secció comença amb un h3 i cada fitxa o targeta porta un h4;
   · cap salt de nivell en baixar (h3 → h4 → h5);
   · cap contenidor de dues columnes (.sdp-atles__dos-col) i cap --sdp-measure al full de l'Atles;
   · la prosa (to suau, datació, cites, llistes de definició i llistes de sí/no) amb la mida de cos, sense --sdp-text-meta.
   Les proves de DOM munten les pàgines de veres; les del full lligen les regles escrites (jsdom no resol la cascada). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import EspecimenAtles2dPresentacio from './EspecimenAtles2dPresentacio.jsx';
import EspecimenAtles2dPobleVirtual from './EspecimenAtles2dPobleVirtual.jsx';
import EspecimenAtles2dXarxesMon from './EspecimenAtles2dXarxesMon.jsx';
import EspecimenAtles2dMapaEntitats from './EspecimenAtles2dMapaEntitats.jsx';
import EspecimenAtles2dMotorEstudis from './EspecimenAtles2dMotorEstudis.jsx';
import EspecimenInventariGlobal from './EspecimenInventariGlobal.jsx';

const PAGINES = Object.freeze([
  ['Presentació', EspecimenAtles2dPresentacio],
  ['El poble virtual', EspecimenAtles2dPobleVirtual],
  ['Xarxes del món', EspecimenAtles2dXarxesMon],
  ['Mapa de les entitats', EspecimenAtles2dMapaEntitats],
  ['Motor d’estudis', EspecimenAtles2dMotorEstudis],
  ['Inventari global', EspecimenInventariGlobal]
]);
const ATLES = PAGINES.slice(0, 5);
const munta = (Pagina) => render(<MemoryRouter rutaInicial="/disseny"><Pagina /></MemoryRouter>);
const nivell = (h) => Number(h.tagName.slice(1));

beforeEach(() => vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('cap petició de xarxa')))));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('IDEA-319 · la jerarquia dins del cos', () => {
  test.each(PAGINES)('%s: cap h1 ni h2 al cos, i el primer encapçalament és un h3', (_nom, Pagina) => {
    const { container } = munta(Pagina);
    expect(container.querySelectorAll('h1, h2')).toHaveLength(0);
    expect(container.querySelector('h1, h2, h3, h4, h5, h6')?.tagName).toBe('H3');
  });

  test.each(PAGINES)('%s: en baixar, cap encapçalament no salta de nivell', (_nom, Pagina) => {
    const { container } = munta(Pagina);
    const nivells = [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(nivell);
    expect(nivells.length).toBeGreaterThan(1);
    nivells.forEach((n, i) => {
      if (i > 0) expect(n - nivells[i - 1], `encapçalament ${i}: h${nivells[i - 1]} → h${n}`).toBeLessThanOrEqual(1);
    });
  });

  test.each(ATLES)('%s: cada secció de l’Atles obri amb un h3 i les fitxes i targetes porten h4', (_nom, Pagina) => {
    const { container } = munta(Pagina);
    const seccions = [...container.querySelectorAll('section.sdp-atles__bloc, nav.sdp-atles__bloc')];
    expect(seccions.length).toBeGreaterThan(0);
    for (const seccio of seccions) {
      expect(seccio.querySelector('h1, h2, h3, h4, h5, h6')?.tagName, seccio.className).toBe('H3');
    }
    // Gauntlet R1 (L1-09) · El títol d'una fitxa és un h4, i un subnivell intern, un h5 (punt 5 de la skill).
    for (const peca of container.querySelectorAll('.sdp-atles__fitxa, .sdp-atles__targeta')) {
      const titols = [...peca.querySelectorAll('h1, h2, h3, h4, h5, h6')];
      for (const titol of titols) expect(['H4', 'H5'], titol.textContent).toContain(titol.tagName);
    }
  });

  test.each(ATLES)('%s: cap contenidor de dues columnes', (_nom, Pagina) => {
    const { container } = munta(Pagina);
    expect(container.querySelector('.sdp-atles__dos-col')).toBeNull();
  });

  test('Motor d’estudis: les cinc seccions de baix són germanes al cos, i la maqueta va davall del seu h3', () => {
    const { container } = munta(EspecimenAtles2dMotorEstudis);
    const arrel = container.querySelector('.sdp-atles');
    const directes = [...arrel.children].filter((el) => el.matches('section.sdp-atles__bloc')).map((el) => el.querySelector('h3')?.id);
    expect(directes).toEqual(expect.arrayContaining([
      'atles-motor-principis', 'atles-motor-encaix', 'atles-motor-fonament', 'atles-motor-preguntes', 'atles-motor-maqueta'
    ]));
    const maqueta = container.querySelector('#atles-motor-maqueta').closest('section');
    expect(maqueta.querySelector('.sdp-atles__mobil')).not.toBeNull();
    /* Gauntlet R1 (L1-08) · La maqueta és aria-hidden: els seus títols són paràgrafs, i l'Índex de la Barra Blava
       (encapcalamentsIndex recorre h1-h6) no els llista com si foren fitxes de la pàgina. */
    expect([...maqueta.querySelectorAll('.sdp-atles__mobil .sdp-atles__mobil-titol')]).toHaveLength(3);
    expect(maqueta.querySelectorAll('.sdp-atles__mobil :is(h1, h2, h3, h4, h5, h6)')).toHaveLength(0);
  });
});

/* ── El full: regles escrites ── */
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();
const FULL = senseComentaris(readFileSync(resolve(process.cwd(), 'src/css/diferit-atles-2d.css'), 'utf8'));

/** Les regles fulla: { selectors: string[], cos: string }. */
function regles(css) {
  const eixida = [];
  const pila = [];
  let buf = '';
  for (const caracter of css) {
    if (caracter === '{') { pila.push(net(buf)); buf = ''; } else if (caracter === '}') {
      const preludi = pila.pop();
      if (preludi && !preludi.startsWith('@')) eixida.push({ selectors: preludi.split(',').map(net), cos: net(buf) });
      buf = '';
    } else if (caracter === ';' && (pila.length === 0 || pila[pila.length - 1].startsWith('@'))) {
      buf = '';
    } else {
      buf += caracter;
    }
  }
  return eixida;
}
const TOTES = regles(FULL);
const delaClasse = (classe) => TOTES.filter((r) => r.selectors.some((s) => s.split(/[\s>+~:]/)[0] === classe || s === classe));

describe('IDEA-319 · el full de l’Atles (diferit-atles-2d.css)', () => {
  test('cap --sdp-measure, cap amplada màxima literal, cap .sdp-atles__dos-col i cap selector de h2', () => {
    expect(FULL).not.toContain('--sdp-measure');
    // Gauntlet R1 (L1-09) · Tampoc una mesura escrita a mà (68ch, 40rem…) que torne a tallar la prosa.
    expect(FULL).not.toMatch(/max-(?:inline-size|width):\s*[\d.]+(?:ch|rem|em|px)\s*;/);
    expect(FULL).not.toContain('sdp-atles__dos-col');
    for (const regla of TOTES) for (const selector of regla.selectors) expect(selector, selector).not.toMatch(/\bh2\b/);
  });

  test.each([
    '.sdp-atles__suau', '.sdp-atles__datacio', '.sdp-atles__cita', '.sdp-atles__dl',
    '.sdp-atles__llista-si', '.sdp-atles__llista-no', '.sdp-atles__avis', '.sdp-atles__proposta'
  ])('%s: prosa a mida de cos i a tota l’amplada', (classe) => {
    const propies = delaClasse(classe);
    expect(propies.length, classe).toBeGreaterThan(0);
    for (const regla of propies) {
      expect(regla.cos, regla.selectors.join(', ')).not.toMatch(/font-size:\s*var\(--sdp-text-meta\)/);
      expect(regla.cos, regla.selectors.join(', ')).not.toMatch(/max-inline-size:\s*var\(--sdp-measure\)/);
    }
  });

  test('el títol d’una fitxa o d’una targeta és un h4 a l’escala de h5, i la prosa de les <dl> i les cites va a mida de cos', () => {
    const titol = TOTES.find((r) => r.selectors.includes('.sdp-atles__fitxa :where(h4)'));
    expect(titol?.selectors).toContain('.sdp-atles__targeta :where(h4)');
    expect(titol.cos).toContain('font-size: var(--sdp-fluid-h5)');
    // Gauntlet R2 (Latles-03) · base.css només dona la mida de cos a p, ul i ol: la <dl> i la cita la porten explícita.
    for (const classe of ['.sdp-atles__dl', '.sdp-atles__cita']) {
      expect(delaClasse(classe).some((r) => /font-size:\s*var\(--sdp-fluid-cos\)/.test(r.cos)), classe).toBe(true);
    }
    expect(TOTES.some((r) => r.selectors.some((s) => /:where\([^)]*\bh3\b[^)]*\)/.test(s) && /fitxa|targeta/.test(s)))).toBe(false);
  });

  test('--sdp-text-meta només queda en xips, codis, comptadors, rètols, el peu tècnic i la maqueta', () => {
    // Gauntlet R1 (L1-09) · Noms sencers: «__font» no admet «__fonts», ni «__cel» admet «__cella».
    const PERMESES = /^\.sdp-atles__(?:meta|recompte|etiqueta|mono|xifra-d|id|xip|sev|grafic-nom|grafic-valor|grafic-eix|anti|mapa|cel|cel-marca|passos|mobil-barra|mobil-cos|font)(?![\w-])/;
    for (const regla of TOTES.filter((r) => /font-size:\s*var\(--sdp-text-meta\)/.test(r.cos))) {
      for (const selector of regla.selectors) expect(selector, selector).toMatch(PERMESES);
    }
  });
});

/* v1.2.21 · Els huit dolors que toquen els kits R32.35b, R32.37 i R32.38, repassats contra el codi (Llei 0): l'estat
   només passa a «resolt» quan el kit tanca el dolor sencer; si en tanca una part, continua obert i la nota diu què queda. */
describe('v1.2.21 · els dolors posats al dia', () => {
  test('cada dolor repassat diu la v1.2.21, i l’avís de datació de la pàgina ho diu a la vista', async () => {
    const { ATLES } = await import('../dades/atles2dDades.js');
    /* v1.2.22 · posat_al_dia és una llista de passades: la primera és la de la v1.2.21 (DOL-31 passa a la de la v1.2.22). */
    const posat = ATLES.meta.posat_al_dia[0];
    expect(posat).toEqual({ data: '2026-11-22', versio: 'v1.2.21 (build 26)', dolors: expect.any(Array) });
    expect(posat.dolors).toHaveLength(7);
    const repassats = ATLES.placa.dolors.filter((dolor) => posat.dolors.includes(dolor.id));
    expect(repassats).toHaveLength(posat.dolors.length);
    for (const dolor of repassats) expect(dolor.versio_o_kit, dolor.id).toMatch(/^v1\.2\.21 \(build 26\) · R32\./);
    /* Gauntlet R1 (L1-01, L1-02 i L1-04) · Només DOL-29 es tanca sencer; DOL-51 queda en la decisió del Mestre (l'entrada
       per defecte del Bar) i la resta, oberts. Un «resolt» no pot dir que res «queda» o «continua». */
    const resolts = repassats.filter((dolor) => dolor.estat === 'resolt');
    expect(resolts.map((dolor) => dolor.id)).toEqual(['DOL-29']);
    // Gauntlet R2 (Latles-02) · Ni el títol ni la descripció d'un resolt diuen en present el que ja no passa.
    for (const dolor of resolts) {
      for (const camp of ['titol', 'descripcio', 'nota']) {
        expect(dolor[camp], `${dolor.id} · ${camp}`).not.toMatch(/\b(?:queda|queden|continua|continuen|encara no)\b/i);
      }
    }
    expect(repassats.find((dolor) => dolor.id === 'DOL-51').estat).toBe('decisio_mestre');
    for (const dolor of repassats.filter((d) => d.estat !== 'resolt')) {
      expect(['obert', 'decisio_mestre'], dolor.id).toContain(dolor.estat);
      expect(dolor.versio_o_kit, dolor.id).toMatch(/\((?:només|la porta|el calaix|dades veïnes)/);
      expect(dolor.nota, dolor.id).toMatch(/\b(?:queda|queden|continua|encara no)\b/i);
      // La descripció és la del dia del dolor: es marca com a anterior a la v1.2.21.
      expect(dolor.descripcio, dolor.id).toMatch(/^Abans de la v1\.2\.21: /);
    }
    const { container } = munta(EspecimenAtles2dPresentacio);
    const avis = container.querySelector('.sdp-atles__datacio').textContent;
    expect(avis).toContain('es van repassar el 22-11-2026 contra la v1.2.21 (build 26)');
    for (const id of posat.dolors) expect(avis).toContain(id);
  });
});

/* v1.2.22 · IDEA-323.4 · DOL-31 · Un sol Mode Bancal tanca el dolor sencer: el contrast es nota (v1.2.21) i ja no és
   amagat (el xip de l'accés del Xat, /el-meu-perfil, /control i Ajustos, i els dos atributs alhora). */
describe('v1.2.22 · DOL-31 resolt i la segona passada de datació', () => {
  test('DOL-31 és resolt a la passada de la v1.2.22, en passat, i l’avís ho diu a la vista', async () => {
    const { ATLES } = await import('../dades/atles2dDades.js');
    const [primera, segona] = ATLES.meta.posat_al_dia;
    expect(segona).toEqual({ data: '2026-11-22', versio: 'v1.2.22 (build 27)', dolors: ['DOL-31'] });
    expect(primera.dolors).not.toContain('DOL-31');
    const dol31 = ATLES.placa.dolors.find((dolor) => dolor.id === 'DOL-31');
    expect(dol31.estat).toBe('resolt');
    expect(dol31.versio_o_kit).toMatch(/^v1\.2\.22 \(build 27\) · IDEA-323\.4/);
    for (const camp of ['titol', 'descripcio', 'nota']) {
      expect(dol31[camp], camp).not.toMatch(/\b(?:queda|queden|continua|continuen|encara no)\b/i);
    }
    for (const ruta of ['src/config/theme.js', 'src/app/contexts/UIContext.jsx', 'src/components/universal/ControlModeSenior.jsx']) {
      expect(dol31.evidencia).toContain(ruta);
    }
    /* v1.2.22 · Gauntlet R1 (L3-04) · La mesura del 39 % i del 64 % és del kit R32.35b, d'abans que la costura de R32.41
       ajustara quatre valors: la nota no la pot presentar com la del contrast publicat. I la capçalera no canvia. */
    expect(dol31.nota).toContain('el 39 % en clar i el 64 % en fosc, però ho va mesurar abans que la costura de R32.41 ajustara quatre valors');
    expect(dol31.nota).toContain('no és una mesura del contrast publicat');
    expect(dol31.nota).toContain('La capçalera no canvia');
    const { container } = munta(EspecimenAtles2dPresentacio);
    const avis = container.querySelector('.sdp-atles__datacio').textContent;
    expect(avis).toContain('El dolor DOL-31 es va repassar el 22-11-2026 contra la v1.2.22 (build 27).');
  });
});
