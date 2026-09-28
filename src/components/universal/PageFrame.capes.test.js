import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

/* jsdom no calcula ni graelles, ni capes, ni @media, ni @container: es
   comprova la regla escrita (T33, T37 i T38, ordres del Mestre 260927-28). */
const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const components = net('src/css/components.css');
const moduls = net('src/css/modules.css');

/* El bloc que obri `obertura` (comptant claus) i conté `regla`. Es proven
   totes les obertures: n'hi ha més d'una `@container (max-width: 400px)`. */
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

/* T33 · l'espaiador de la fila de l'arbre pren l'alçada de la fila: el
   taronja de l'entrada activa arriba a la vora sense franja de 16px. */
const FILA = '.sdp-workspace-folder-row { display: flex; align-items: stretch;';
test('T33 · la fila de l’arbre estira les cel·les, dins de @layer components', () => {
  expect(moduls).toContain(FILA);
  expect(blocDe(moduls, '@layer components {', FILA)).toContain(FILA);
});

const GRAELLA = 'header.bar-blue { display: grid; grid-template-columns: minmax(max-content, 1fr) max-content minmax(max-content, 1fr); }';
test('T37 · la barra blava és una graella de tres columnes que no deixa baixar cap extrem del seu contingut', () => {
  expect(components).toContain(GRAELLA);
});

test('T37 · la graella viu dins de @layer components, que guanya al display:flex de layout.css (legacy)', () => {
  expect(blocDe(components, '@layer components {', GRAELLA)).toContain(GRAELLA);
});

test('T37 · la col·locació va per classe: sense CONNECTAR el trio continua a la columna del mig', () => {
  expect(components).toContain('.bar-blue-left { grid-column: 1; justify-self: start; }');
  expect(components).toContain('.bar-blue .sp-card-actions { grid-column: 2; justify-self: center; }');
  expect(components).toContain('.bar-blue .btn-connectar.sp-card-connect { grid-column: 3; justify-self: end; }');
});

const AMAGA = '.sdp-universal-page-container > section.bar-orange { display: none; }';
const PERFIL = '.perfil-espai .sdp-editor-document .sdp-universal-page-container > section.bar-orange { display: flex; }';
const media = () => blocDe(components, '@media (max-width: 720px) {', AMAGA);
const container = () => blocDe(components, '@container (max-width: 400px) {', AMAGA);

test('T38 · en mòbil i en columna estreta la barra taronja de pàgina no es pinta', () => {
  expect(media()).toContain(AMAGA);
  expect(container()).toContain(AMAGA);
});

test('T38 · l’excepció del Perfil (selector d’identitat i avatar) va darrere i pesa més', () => {
  for (const bloc of [media(), container()]) {
    expect(bloc.indexOf(PERFIL)).toBeGreaterThan(bloc.indexOf(AMAGA));
    expect(bloc).toContain('.perfil-espai .sdp-editor-document .sdp-editor-eines { top: calc(var(--sdp-alt-accio) * 2); }');
  }
});

test('T38 · sense taronja, les eines ancorades pugen a davall de la blava', () => {
  expect(media()).toContain('.sdp-editor-document .sdp-editor-eines { top: var(--sdp-alt-accio); }');
});

test('T38 · la caputxa taronja de les targetes no hi entra', () => {
  expect(media()).not.toContain('sp-card-header');
  expect(container()).not.toContain('sp-card-header');
});

test('T38 · les regles viuen dins de @layer components (guanyen el section.bar-orange de legacy)', () => {
  expect(blocDe(components, '@layer components {', AMAGA)).toContain('@media (max-width: 720px) {');
});
