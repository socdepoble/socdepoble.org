/* Revisió adversarial 260930 · El full «Ajustos» als fulls d'estil. jsdom no
   resol la cascada ni pinta: es comproven les regles dels fulls, com a
   src/css/navegacio-secundaria.capes.test.js.
   · P2: el full passa a pantalla completa amb el MATEIX tall que convertix
     la resta de Dialeg en full inferior (components.css a socdepoble.org,
     [data-sdp-estret] de layout.css a l'encastat), no amb .is-compact
     (≤1023): entre 721 i 1023 l'encastat deixava un marc de 8px de vel
     amb cantons rectes, i socdepoble.org el posava a pantalla completa
     quan la resta de Dialeg són modals centrats.
   · P3: les files no hereten el sagnat de 4px del li editorial (base.css). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const modules = llig('src/css/modules.css');
const components = llig('src/css/components.css');
const layout = llig('src/css/layout.css');
const base = llig('src/css/base.css');

const net = (text) => text.replace(/\s+/g, ' ').trim();

/** Regles fulla d'un full, amb els @media / @container que les contenen. */
function regles(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const eixida = [];
  const pila = [];
  let inici = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      pila.push({ prelud: net(text.slice(inici, i).split(';').pop()), obert: i + 1, fills: false });
      inici = i + 1;
    } else if (text[i] === '}') {
      const bloc = pila.pop();
      if (bloc && !bloc.fills && !bloc.prelud.startsWith('@')) {
        eixida.push({
          selectors: bloc.prelud.split(',').map(net),
          cos: net(text.slice(bloc.obert, i)),
          condicions: pila.map((b) => b.prelud).filter((p) => /^@(media|container)/.test(p))
        });
      }
      inici = i + 1;
    }
  }
  return eixida;
}

const declara = (cos, propietat, valor) => cos.split(';').map(net).includes(`${propietat}: ${valor}`);

test('P2 · a socdepoble.org, pantalla completa amb la mateixa media query que el full inferior del Dialeg', () => {
  const fullInferior = regles(components).find((r) => r.selectors.includes('.sdp-dialeg:not(.sdp-dialeg--calaix)') && r.condicions.length);
  expect(fullInferior?.condicions).toEqual(['@media (max-width: 720px)']);
  const completa = regles(modules).filter((r) => r.selectors.includes('.sdp-dialeg.sdp-xat-ajustos') && r.condicions.length);
  expect(completa.map((r) => r.condicions)).toEqual([fullInferior.condicions]);
  const [cos] = completa.map((r) => r.cos);
  for (const [propietat, valor] of [['inset', '0'], ['inline-size', '100%'], ['block-size', '100%'], ['max-inline-size', 'none'], ['max-block-size', 'none'], ['margin', '0'], ['border-radius', '0']]) {
    expect([propietat, declara(cos, propietat, valor)]).toEqual([propietat, true]);
  }
});

test('P2 · a l’encastat, pantalla completa amb [data-sdp-estret], el mateix prefix que el full inferior del modal local', () => {
  const fullInferior = regles(layout).find((r) => r.selectors.some((s) => s.endsWith('> .sdp-capa-modal > .sdp-dialeg:not(.sdp-dialeg--calaix)')));
  const prefix = fullInferior.selectors[0].replace(' > .sdp-capa-modal > .sdp-dialeg:not(.sdp-dialeg--calaix)', '');
  expect(prefix).toBe(':host .sdp-root[data-sdp-estret]');
  /* La capa hi perd el coixí: el full omple la caixa sense franja de vel. */
  expect(regles(layout).some((r) => r.selectors.some((s) => s.startsWith(`${prefix} > .sdp-capa-modal`)) && declara(r.cos, 'padding', '0'))).toBe(true);
  const completa = regles(modules).filter((r) => r.selectors.includes(`${prefix} > .sdp-capa-modal > .sdp-dialeg.sdp-xat-ajustos`));
  expect(completa).toHaveLength(1);
  for (const [propietat, valor] of [['inline-size', '100%'], ['block-size', '100%'], ['border-radius', '0']]) {
    expect([propietat, declara(completa[0].cos, propietat, valor)]).toEqual([propietat, true]);
  }
});

test('P2 · cap regla del full depén de .is-compact (≤1023): entre 721 i 1023 és el modal centrat', () => {
  const ambCompacte = regles(modules)
    .flatMap((r) => r.selectors)
    .filter((s) => s.includes('sdp-xat-ajustos') && s.includes('is-compact'));
  expect(ambCompacte).toEqual([]);
  /* Les vores segures, amb el mateix tall que la pantalla completa. */
  const segures = regles(modules).filter((r) => r.selectors.some((s) => /\.sdp-xat-ajustos__(cap|cos)$/.test(s)) && /safe-area-inset/.test(r.cos));
  expect(segures.length).toBeGreaterThan(0);
  for (const regla of segures) {
    const ambTall = regla.condicions.includes('@media (max-width: 720px)')
      || regla.selectors.every((s) => s.startsWith(':host .sdp-root[data-sdp-estret] > .sdp-capa-modal > .sdp-dialeg.sdp-xat-ajustos '));
    expect([regla.selectors.join(', '), ambTall]).toEqual([regla.selectors.join(', '), true]);
  }
});

test('P3 · les files del full no hereten el sagnat del li editorial', () => {
  expect(regles(base).some((r) => r.selectors.includes('li') && declara(r.cos, 'padding-left', '4px'))).toBe(true);
  const li = regles(modules).filter((r) => r.selectors.includes('.sdp-xat-ajustos__targeta > li'));
  expect(li.length).toBeGreaterThan(0);
  expect(li.some((r) => declara(r.cos, 'padding', '0'))).toBe(true);
});
