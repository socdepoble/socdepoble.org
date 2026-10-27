/* Gauntlet 261022_0225 (XATR-5) · L'accés sense sessió (AccesAlXat) als fulls
   d'estil. jsdom no resol la cascada ni fa disposició: es comproven les
   regles de modules.css. El DOM (on viu el peu) el comprova
   XatSection.avatars.test.jsx.
   XAT-1 · El peu de l'accés és l'últim fill del cos amb scroll de la
   columna: el cos continua sent el que s'encongix i fa scroll (abans el peu
   vivia fora, no s'encongia i en un mòbil apaïsat deixava la llista a 0 px),
   i amb poc contingut el peu baixa al fons. En una pantalla baixa, compacte:
   la frase cau. XATR-2 · El peu no hi suma un segon coixí. XATR-7 · L'avís
   d'un fil de només lectura s'encongix dins de la seua barra. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

const modules = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();

/** El valor d'una propietat a les regles d'un selector exacte (l'última guanya). */
function valor(selector, propietat, full = modules) {
  let trobat = null;
  for (const m of full.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = net(m[1].split(';').pop()).split(',').map(net);
    if (!selectors.includes(selector)) continue;
    for (const declaracio of m[2].split(';')) {
      const [prop, ...resta] = declaracio.split(':');
      if (net(prop || '') === propietat) trobat = net(resta.join(':'));
    }
  }
  return trobat;
}

/** Cada bloc `@media <condicio>`: { inici, fi, cos } (amb les claus aparellades). */
function trossosMedia(condicio) {
  const trossos = [];
  let des = 0;
  for (;;) {
    const inici = modules.indexOf(`@media ${condicio}`, des);
    if (inici < 0) return trossos;
    const obri = modules.indexOf('{', inici);
    let fondaria = 1;
    let i = obri + 1;
    for (; i < modules.length && fondaria; i += 1) {
      if (modules[i] === '{') fondaria += 1;
      else if (modules[i] === '}') fondaria -= 1;
    }
    trossos.push({ inici, fi: i, cos: modules.slice(obri + 1, i - 1) });
    des = i;
  }
}
const blocsMedia = (condicio) => trossosMedia(condicio).map((tros) => tros.cos);
/** El full sense els blocs `@media <condicio>`. */
const foraDeMedia = (condicio) => trossosMedia(condicio).reverse()
  .reduce((full, { inici, fi }) => full.slice(0, inici) + full.slice(fi), modules);

const COS = '.sdp-workspace-column__body';
const AMB_PEU = `${COS}.sdp-xat-cos--amb-peu`;
const RESERVA = 'calc(var(--sdp-alt-nav-mobil) + env(safe-area-inset-bottom, 0px))';

test('XAT-1 · el cos que porta l’accés continua sent el que s’encongix i fa scroll', () => {
  expect(valor(`.sdp-xat ${COS}`, 'flex')).toBe('1 1 0');
  expect(valor(`.sdp-xat ${COS}`, 'min-height')).toBe('0');
  expect(valor(`.sdp-xat ${COS}`, 'overflow-y')).toBe('auto');
  /* Cap regla de l'accés li ho trau. */
  for (const propietat of ['flex', 'flex-shrink', 'min-height', 'height', 'overflow', 'overflow-y']) {
    expect(valor(AMB_PEU, propietat), propietat).toBeNull();
  }
});

test('XAT-1 · amb poc contingut, el peu de l’accés baixa al fons del cos; amb molt, va darrere', () => {
  expect(valor(AMB_PEU, 'display')).toBe('flex');
  expect(valor(AMB_PEU, 'flex-direction')).toBe('column');
  expect(valor(`${AMB_PEU} > *`, 'flex-shrink')).toBe('0');
  expect(valor(`${AMB_PEU} > .sdp-xat-llista__peu`, 'margin-top')).toBe('auto');
  /* La fitxa (min-height: 100%) no empeny l'accés davall del plec. */
  expect(valor(`${AMB_PEU} > .sdp-xat-fitxa-comunitat`, 'min-height')).toBe('0');
  expect(valor(`${AMB_PEU} > .sdp-xat-fitxa-comunitat`, 'flex-grow')).toBe('1');
});

test('XAT-1 · en una pantalla baixa, l’accés es compacta i la frase cau', () => {
  const blocs = blocsMedia('(max-height: 500px)').filter((bloc) => bloc.includes('.sdp-xat-acces'));
  expect(blocs).toHaveLength(1);
  expect(valor('.sdp-xat-acces > p', 'display', blocs[0])).toBe('none');
  expect(valor('.sdp-alerta.sdp-xat-acces', 'padding', blocs[0])).toBe('var(--sdp-space-2) var(--sdp-space-3)');
});

test('XATR-2 · el peu de l’accés no hi suma coixí; en compacte, l’alerta porta la reserva de la barra mòbil', () => {
  expect(valor('.sdp-xat-llista__peu.sdp-xat-llista__peu--acces', 'padding')).toBe('0');
  expect(valor(':where(.sdp-root.is-compact) .app-grid-shell .sdp-xat-llista__peu.sdp-xat-llista__peu--acces', 'padding')).toBe('0');
  /* La mateixa caixa que quan l'alerta era el peu: el seu coixí més la reserva. */
  const alerta = ':where(.sdp-root.is-compact) .app-grid-shell .sdp-xat-llista__peu--acces > .sdp-xat-acces';
  expect(valor(alerta, 'padding-bottom', foraDeMedia('(max-height: 500px)'))).toBe(`calc(var(--sdp-space-4) + ${RESERVA.slice('calc('.length)}`);
  const [baixa] = blocsMedia('(max-height: 500px)').filter((bloc) => bloc.includes('.sdp-xat-acces'));
  expect(valor(alerta, 'padding-bottom', baixa)).toBe(`calc(var(--sdp-space-2) + ${RESERVA.slice('calc('.length)}`);
  /* El que hi ha damunt ja no la repetix (una coma dins de :is(): el text sencer). */
  expect(net(modules)).toContain(':where(.sdp-root.is-compact) .app-grid-shell .sdp-xat-cos--amb-peu :is(.sdp-xat-llista, .sdp-xat-resultats) { padding-bottom: 0; }');
});

test('XATR-7 · l’avís d’un fil de només lectura s’encongix dins de la seua barra', () => {
  expect(valor('.sdp-xat-compositor', 'flex')).toBe('none');
  expect(valor('.sdp-xat-compositor-barra-avis > .sdp-xat-compositor--avis', 'flex')).toBe('0 1 auto');
  expect(valor('.sdp-xat-compositor-barra-avis > .sdp-xat-compositor--avis', 'min-width')).toBe('0');
});

test('puresa visual de l’accés: sense vora lateral de cita ni fons d’alerta, amb text i botons centrats', () => {
  expect(valor('.sdp-alerta.sdp-xat-acces', 'border')).toBe('none');
  expect(valor('.sdp-alerta.sdp-xat-acces', 'border-inline-start-width')).toBe('0');
  expect(valor('.sdp-alerta.sdp-xat-acces', 'background')).toBe('transparent');
  expect(valor('.sdp-alerta.sdp-xat-acces', 'text-align')).toBe('center');
  expect(valor('.sdp-alerta.sdp-xat-acces', 'align-items')).toBe('center');
  expect(valor('.sdp-xat-acces > p', 'text-align')).toBe('center');
  expect(valor('.sdp-xat-acces > .sdp-alerta__accions', 'justify-content')).toBe('center');
});

/* Ordre del Mestre (261026, prompt 261026_1615, tasca 4) · «Connectar-se» i
   «Registrar-se» comparteixen fila: la mateixa amplària, el buit de la
   reixeta entre les dues i, com a molt, l'amplària de la columna del llistat. */
const ACCIONS = '.sdp-xat-acces > .sdp-alerta__accions';

test('261026 · les dues píndoles de l’accés van en línia i de la mateixa amplària, sense el 100% de sèrie', () => {
  const pindola = `${ACCIONS} > .sdp-xat-pindola`;
  expect(valor(pindola, 'flex')).toBe('1 1 0');
  expect(valor(pindola, 'width')).toBe('auto');
  expect(valor(pindola, 'min-inline-size')).toBe('max-content');
  /* La regla de sèrie continua portant el 100%: és la de l'accés la que el desfà. */
  expect(valor('.sdp-xat-pindola', 'width')).toBe('100%');
});

test('261026 · la fila de l’accés porta el buit de la reixeta i com a molt l’amplària de la targeta viva', () => {
  expect(valor(ACCIONS, 'gap')).toBe('var(--sdp-space-3)');
  expect(valor(ACCIONS, 'max-inline-size')).toBe('var(--sdp-targeta-viva-ample)');
  expect(valor(ACCIONS, 'justify-content')).toBe('center');
});

test('261026 · en una pantalla baixa ja cap regla de píndola: comparteixen fila sempre', () => {
  const blocs = blocsMedia('(max-height: 500px)');
  expect(blocs.length).toBeGreaterThan(0);
  for (const bloc of blocs) {
    expect(bloc).not.toContain('.sdp-xat-pindola');
    expect(valor(`${ACCIONS} > .sdp-xat-pindola`, 'width', bloc)).toBeNull();
  }
});

/* Ordre del Mestre (261026_2126; prompt 261026_2130, tasca 1; P1-38 i P1-37) ·
   «Descarrega l'App», damunt de la parella: la píndola de sèrie (alçada
   tàctil i 100%) fins a l'amplària de la parella, amb el respir de davall de
   la frase que abans portava la parella. Entre la píndola i la parella, només
   el buit de l'alerta, el mateix que entre «Connectar-se» i «Registrar-se». */
const DESCARREGA = '.sdp-xat-acces > .sdp-xat-acces__descarrega';
const components = readFileSync(resolve(process.cwd(), 'src/css/components.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

test('261026_2126 · «Descarrega l’App» és la píndola de sèrie: alçada tàctil i, com a molt, l’amplària de la parella', () => {
  expect(valor('.sdp-xat-pindola', 'min-height')).toBe('var(--sdp-touch)');
  expect(valor('.sdp-xat-pindola', 'width')).toBe('100%');
  expect(valor(DESCARREGA, 'max-inline-size')).toBe(valor(ACCIONS, 'max-inline-size'));
  expect(valor(DESCARREGA, 'margin')).toBe('var(--sdp-space-3) auto 0');
  expect(valor(ACCIONS, 'margin')).toBe('var(--sdp-space-3) auto 0');
  /* Cap regla no li desfà l'amplària ni l'alçada de sèrie. */
  for (const propietat of ['width', 'min-height', 'height', 'flex']) expect(valor(DESCARREGA, propietat), propietat).toBeNull();
});

test('261026_2126 · P1-37 · entre «Descarrega l’App» i la parella, només el buit de l’alerta', () => {
  expect(valor(`${DESCARREGA} + .sdp-alerta__accions`, 'margin-top')).toBe('0');
  expect(valor('.sdp-alerta', 'gap', components)).toBe('var(--sdp-space-3)');
  expect(valor('.sdp-alerta.sdp-xat-acces', 'gap')).toBeNull();
  expect(valor(ACCIONS, 'gap')).toBe('var(--sdp-space-3)');
});
