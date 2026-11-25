// @vitest-environment node
/**
 * IDEA-353 (ordre directa del Mestre, 25-11-2026) · Cap títol (h2..h6) dins de
 * la prosa o d'un cos amb targeta/imatge flotant (.sdp-amb-targetes, .cms-preview,
 * .detail-content, .sdp-prose, .sdp-editor-full-canvas) pot portar clear: both,
 * i a /page/reconeixements el bloc diferit CreditsReconeixementsComplet s'integra
 * dins de CosDeLaPagina (.sdp-amb-targetes > .sdp-cos-tros) abans del clearfix
 * ::after perquè l'h3 «Divulgadors, formadors...» s'adapte al costat de la targeta
 * flotant «Legal i privacitat» sense deixar cap buit vertical.
 *
 * Gauntlet 261125 (CSS-R3291-01, CSS-R3291-02, CSS-R3291-06, CSS-R3291-07 i
 * CSS-R3291-08) · La prova comprova la capa de cada regla, no només el text:
 * jsdom no aplica capes, i una regla d'IDEA-353 fora de @layer components (o
 * dins d'una capa més baixa que legacy) canviaria qui guanya sense que cap
 * regex ho veguera. També escaneja tots els fulls de src/css, no només
 * modules.css.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles fulla d'un full: { prelud, cos, pares } (pares: els blocs que la contenen, de fora a dins).
 *  Mateix mètode que quadreDeComandament.capes.test.js. */
function regles(css) {
  const eixida = [];
  const pila = [];
  let tros = '';
  for (const c of senseComentaris(css)) {
    if (c === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      pila.push({ prelud: tros.split(';').pop().trim().replace(/\s+/g, ' '), fills: false });
      tros = '';
    } else if (c === '}') {
      const marc = pila.pop();
      if (marc && !marc.fills) eixida.push({ prelud: marc.prelud, cos: tros.replace(/\s+/g, ' ').trim(), pares: pila.map((p) => p.prelud) });
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}

/** Els selectors d'un prelud, partits per les comes de fora de parèntesis. */
function selectors(prelud) {
  const eixida = [];
  let nivell = 0;
  let actual = '';
  for (const c of prelud) {
    if (c === '(') nivell += 1;
    if (c === ')') nivell -= 1;
    if (c === ',' && nivell === 0) { eixida.push(actual.trim()); actual = ''; } else actual += c;
  }
  if (actual.trim()) eixida.push(actual.trim());
  return eixida;
}

const declaracions = (cos) => Object.fromEntries(cos.split(';')
  .map((d) => d.trim())
  .filter((d) => d.includes(':'))
  .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]));

const FULLS = readdirSync(resolve(process.cwd(), 'src/css')).filter((nom) => nom.endsWith('.css'));
const MODULS = regles(llig('src/css/modules.css'));
const BASE = regles(llig('src/css/base.css'));
const PROSA = ':where(.cms-preview, .detail-content, .sdp-prose, .sdp-editor-full-canvas)';
const MEDIA_COLUMNA = '@media (min-width: 40.01rem)';
const capa = (regla) => regla.pares.join(' > ');

/** El subjecte (darrer compost) d'un selector és un títol h1..h6. */
const subjecteEsTitol = (selector) => {
  const sensePseudoElement = selector.split('::')[0];
  const compostos = sensePseudoElement.split(/\s*[\s>+~]\s*(?![^(]*\))/).filter(Boolean);
  return /(^|[^a-z0-9-])h[1-6](?![a-z0-9-])/i.test(compostos[compostos.length - 1] || '') && !selector.includes('::');
};

describe('IDEA-353 · Adaptació fluida dels títols al costat d’imatges i targetes flotants', () => {
  test('l’ordre de capes d’index.css posa components per damunt de legacy (on viuen els títols de base.css)', () => {
    const ordre = /@layer ([a-z, ]+);/.exec(senseComentaris(llig('src/css/index.css')))?.[1].split(',').map((c) => c.trim());
    expect(ordre).toEqual(['reset', 'sdp', 'legacy', 'components', 'utilities']);
    const primerFill = BASE.find((r) => selectors(r.prelud).includes('h3:first-child'));
    expect(primerFill && capa(primerFill)).toBe('@layer legacy');
    expect(declaracions(primerFill.cos)).toMatchObject({ 'margin-top': '0' });
  });

  test('cap selector amb un títol h1..h6 de subjecte porta clear, a cap full de src/css', () => {
    const infraccions = FULLS.flatMap((nom) => regles(llig(`src/css/${nom}`))
      .filter((r) => /\bclear\s*:/.test(r.cos))
      .flatMap((r) => selectors(r.prelud).filter(subjecteEsTitol).map((s) => `${nom} · ${s}`)));
    expect(infraccions).toEqual([]);
  });

  test('a partir de 40.01rem, els títols de la prosa fan display: flow-root (mai overflow: hidden) dins de @layer components, sense tocar les targetes ni l’atribut hidden', () => {
    const general = MODULS.filter((r) => r.prelud.startsWith(`${PROSA} :where(:is(h2, h3, h4, h5, h6)`));
    expect(general).toHaveLength(1);
    expect(capa(general[0])).toBe(`@layer components > ${MEDIA_COLUMNA}`);
    expect(general[0].prelud).toBe(`${PROSA} :where(:is(h2, h3, h4, h5, h6):not([hidden], .sdp-targeta *, .sp-card *))`);
    expect(declaracions(general[0].cos)).toEqual({ display: 'flow-root', 'overflow-wrap': 'break-word' });

    const h3 = MODULS.filter((r) => r.prelud.startsWith(`${PROSA} :where(h3`));
    expect(h3).toHaveLength(1);
    expect(capa(h3[0])).toBe(`@layer components > ${MEDIA_COLUMNA}`);
    expect(h3[0].prelud).toBe(`${PROSA} :where(h3:not(.sdp-targeta *, .sp-card *))`);
    expect(declaracions(h3[0].cos)).toEqual({ 'text-wrap': 'pretty' });
  });

  test('cap regla de src/css posa overflow: hidden a un títol de la prosa; només el títol h2/h3 de la targeta incrustada conserva el de R11', () => {
    const ambOverflow = FULLS.flatMap((nom) => regles(llig(`src/css/${nom}`))
      .filter((r) => /(^|;)\s*overflow\s*:\s*hidden/.test(r.cos))
      .filter((r) => /\.cms-preview|\.detail-content|\.sdp-prose|\.sdp-editor-full-canvas|\.sdp-amb-targetes/.test(r.prelud))
      .flatMap((r) => selectors(r.prelud).filter(subjecteEsTitol).map((s) => ({ nom, s, capa: capa(r) }))));
    expect(ambOverflow).toEqual([
      { nom: 'modules.css', s: '.sdp-amb-targetes :where(.sdp-targeta) :is(h2, h3)', capa: `@layer components > ${MEDIA_COLUMNA}` }
    ]);
  });

  test('/page/reconeixements: el títol que obri un segon tros de text germà recupera el ritme del títol, a la capa del :first-child (legacy) i després d’ell', () => {
    const primerFill = BASE.findIndex((r) => selectors(r.prelud).includes('h3:first-child'));
    for (const nivell of [2, 3, 4, 5, 6]) {
      const index = BASE.findIndex((r) => r.prelud === `.sdp-amb-targetes > .sdp-cos-tros + .sdp-cos-tros > h${nivell}:first-child`);
      expect(index, `h${nivell}`).toBeGreaterThan(primerFill);
      /* Mateixa capa que h*:first-child { margin-top: 0 } i més especificitat (0,4,1 > 0,1,1): guanya. */
      expect(capa(BASE[index]), `h${nivell}`).toBe('@layer legacy');
      expect(declaracions(BASE[index].cos), `h${nivell}`).toEqual({ 'margin-top': `var(--sdp-mt-h${nivell})` });
    }
    const contents = MODULS.find((r) => r.prelud === '.sdp-cos-tros');
    expect(declaracions(contents.cos)).toEqual({ display: 'contents' });
    /* L'única regla de marge que nomena .sdp-cos-tros és la del ritme. */
    const ambTros = FULLS.flatMap((nom) => regles(llig(`src/css/${nom}`))
      .filter((r) => /\.sdp-cos-tros/.test(r.prelud) && /margin(-top|-block)?\s*:/.test(r.cos))
      .map((r) => `${nom} · ${r.prelud}`))
      .filter((s) => !/> \.sdp-cos-tros \+ \.sdp-cos-tros > h[2-6]:first-child$/.test(s));
    expect(ambTros).toEqual([]);
    /* Per damunt de legacy (components, utilities o fora de capa), cap regla torna a posar a 0 el marge
       d'un títol de la prosa o d'un títol sense context: guanyaria per capa i desfaria el buit de 32 px. */
    const PROSA_O_TROS = /\.cms-preview|\.detail-content|\.sdp-prose|\.sdp-editor-full-canvas|\.sdp-amb-targetes|\.sdp-cos-tros/;
    const TITOL_SOL = /^(:(where|is)\()?h[1-6]/;
    const MARGE_ZERO = /(^|;)\s*margin(-top|-block|-block-start)?\s*:\s*0(px|rem)?(\s|;|$)/;
    const perDamuntDeLegacy = (r) => !r.pares.some((p) => /^@layer (reset|sdp|legacy)$/.test(p));
    const zeros = FULLS.flatMap((nom) => regles(llig(`src/css/${nom}`))
      .filter((r) => perDamuntDeLegacy(r) && MARGE_ZERO.test(r.cos))
      .flatMap((r) => selectors(r.prelud)
        .filter((s) => subjecteEsTitol(s) && (PROSA_O_TROS.test(s) || TITOL_SOL.test(s)))
        .map((s) => `${nom} · ${capa(r) || '(sense capa)'} · ${s}`)));
    expect(zeros).toEqual([]);
  });

  test('/page/reconeixements munta CreditsReconeixementsComplet amb display: contents (.sdp-cos-tros) dins de CosDeLaPagina', () => {
    expect(llig('src/sections/text/CreditsReconeixementsComplet.jsx')).toContain('className="sdp-cos-tros"');
    expect(llig('src/sections/text/TextSection.jsx')).toMatch(/<CosDeLaPagina html=\{page\.html\}>\s*\{pageKey==='reconeixements'\?<BarreraDelTrosAccessori><Suspense fallback=\{null\}><CreditsReconeixementsComplet language=\{language\}\/>/);
  });
});
