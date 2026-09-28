import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

/* T42 · jsdom no calcula ni alçades, ni scroll, ni capes, ni @supports: es
   comprova la regla escrita (mateix patró que PageFrame.capes.test.js). */
const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const components = net('src/css/components.css');
const moduls = net('src/css/modules.css');

/* El bloc que obri `obertura` (comptant claus) i conté `regla`. */
const blocDe = (text, obertura, regla) => {
  for (let obri = text.indexOf(obertura); obri >= 0; obri = text.indexOf(obertura, obri + 1)) {
    let fons = 0;
    for (let i = text.indexOf('{', obri); i < text.length; i += 1) {
      if (text[i] === '{') fons += 1;
      else if (text[i] === '}' && (fons -= 1) === 0) {
        const bloc = text.slice(obri, i + 1);
        if (bloc.includes(regla)) return bloc;
        break;
      }
    }
  }
  return '';
};

/* Les declaracions de la primera regla amb eixe selector. */
const regla = (selector) => {
  const obri = moduls.indexOf(`${selector} {`);
  return obri < 0 ? '' : moduls.slice(obri, moduls.indexOf('}', obri) + 1);
};

const DIALEG = '.sdp-dialeg.sdp-print-dialog';

test('T42 · el diàleg té alçada fixa, sense sostre de 40rem, i és la reserva de scroll', () => {
  const dialeg = regla(DIALEG);
  for (const declaracio of ['height: 90vh;', 'max-height: 90vh;', 'max-width: none;', 'overflow: auto;', 'overscroll-behavior: contain;', 'text-align: start;']) {
    expect(dialeg).toContain(declaracio);
  }
  // Amb hidden, en pantalla curta el peu (Imprimir) quedava retallat i sense scroll.
  expect(dialeg).not.toContain('overflow: hidden');
  // Sense margin: el full inferior del mòbil (components.css) conserva el seu.
  expect(dialeg).not.toContain('margin');
});

test('T42 · dvh només dins de @supports, darrere del vh de la Baseline 2022', () => {
  expect(moduls).toContain(`@supports (height: 1dvh) { ${DIALEG} { height: 90dvh; max-height: 90dvh; } }`);
  expect(moduls.indexOf('@supports (height: 1dvh)')).toBeGreaterThan(moduls.indexOf(`${DIALEG} {`));
});

test('T42 · el marc ompli el diàleg i el cos és una columna que cedix l’espai a l’iframe', () => {
  expect(regla('.sdp-print-dialog .sdp-dialeg__marc')).toContain('{ height: 100%; max-height: 100%; }');
  const cos = regla('.sdp-print-dialog .sdp-dialeg__cos');
  for (const declaracio of ['display: flex;', 'flex-direction: column;', 'flex: 1;', 'gap: var(--sdp-space-3);', 'overflow: visible;']) {
    expect(cos).toContain(declaracio);
  }
  // Sense min-height: 0 el cos no s'encongix per davall de la casella i
  // l'iframe mínim: en pantalla curta fa scroll el diàleg, no un cos de 20px.
  expect(cos).not.toContain('min-height');
});

test('T42 · l’iframe pren la resta, sense alçada fixa en vh ni token inventat', () => {
  const iframe = regla('.sdp-print-preview');
  expect(iframe).toContain('flex: 1;');
  expect(iframe).toContain('min-height: 10rem;');
  expect(iframe).toContain('background: var(--sdp-fons-app);');
  expect(iframe).not.toMatch(/height: \d+vh/);
  expect(iframe).not.toContain('var(--sdp-fons)');
});

test('T42 · les regles velles ja no hi són i cap altre full toca la vista prèvia', () => {
  expect(moduls).not.toContain('.sdp-print-dialog { inset: 0; margin: auto; }');
  expect(moduls.split('.sdp-print-preview {').length).toBe(2);
  expect(moduls.split(`${DIALEG} {`).length).toBe(3); // la regla i la del @supports
  expect(components).not.toContain('sdp-print');
});

test('T42 · tot viu dins de @layer components i sense :has()', () => {
  const bloc = blocDe(moduls, '@layer components {', `${DIALEG} {`);
  for (const selector of [`${DIALEG} {`, '.sdp-print-dialog .sdp-dialeg__marc {', '.sdp-print-dialog .sdp-dialeg__cos {', '.sdp-print-preview {']) {
    expect(bloc).toContain(selector);
  }
  expect(bloc).not.toContain(':has(');
});
