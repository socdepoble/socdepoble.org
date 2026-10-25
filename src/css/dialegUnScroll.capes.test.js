import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

/* Directiva del Mestre (261025, pla 261025_0045, T1 i T2: «el disseny és com
   el soroll per a allò usable») · jsdom no maqueta ni resol la cascada: es
   comproven les regles dels fulls.
   · T1 · Un sol scroll, el del cos: el <dialog> no en fa mai (overflow:
     hidden), obert i amb marc és una columna flex (amb [open]: tancat no es
     veu), el marc i el cos s'encongixen (min-height: 0) i la capçalera, la
     descripció i el peu no.
   · T2 · La finestra de la barra que no hi cap davall de les barres puja
     (sdp-dialeg--barra-amunt) i pren l'alçada de la pantalla, només en
     escriptori. */

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
/** Les declaracions de la primera regla amb el selector exacte `selector`. */
function declaracions(css, selector) {
  const net = senseComentaris(css);
  const escapat = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const trobada = new RegExp(`(?:^|[}\\s])${escapat}\\s*\\{([^}]*)\\}`).exec(net);
  return trobada ? trobada[1].replace(/\s+/g, ' ').trim() : null;
}

const COMPONENTS = llig('src/css/components.css');
const MODULS = llig('src/css/modules.css');

test('T1 · obert i amb marc, el <dialog> és una columna flex; el seu scroll és només la reserva', () => {
  /* Revisió adversarial 261025 · overflow-y: auto, la reserva de pantalla curta: el diàleg ja no desborda. */
  expect(declaracions(COMPONENTS, '.sdp-dialeg')).toMatch(/overflow-y: auto;/);
  expect(declaracions(COMPONENTS, '.sdp-dialeg[open]:not(.sdp-dialeg--sense-marc)')).toBe('display: flex; flex-direction: column;');
});

test('T1 · el marc i el cos s’encongixen; només el cos fa scroll; capçalera, descripció i peu no s’encongixen', () => {
  expect(declaracions(COMPONENTS, '.sdp-dialeg__marc')).toBe('display: flex; flex-direction: column; flex: 1 1 auto; height: 100%; max-height: inherit; min-height: 0;');
  const cos = declaracions(COMPONENTS, '.sdp-dialeg__cos');
  expect(cos).toMatch(/flex: 1 1 auto;/);
  expect(cos).toMatch(/min-height: 0;/);
  expect(cos).toMatch(/overflow-y: auto;/);
  expect(cos).toMatch(/overscroll-behavior: contain;/);
  for (const peça of ['.sdp-dialeg__cap', '.sdp-dialeg__descripcio', '.sdp-dialeg__peu']) {
    expect(declaracions(COMPONENTS, peça), peça).toMatch(/flex-shrink: 0;/);
  }
});

test('T2 · la finestra de la barra que no hi cap puja dalt i pren l’alçada de la pantalla, només en escriptori i amb tokens', () => {
  const net = senseComentaris(MODULS);
  const media = net.indexOf('.sdp-dialeg.sdp-dialeg--barra.sdp-dialeg--barra-amunt');
  expect(media).toBeGreaterThan(-1);
  /* Dins del @media d'escriptori: entre el @media i la regla, cap clau d'eixe bloc tancada. */
  const inici = net.lastIndexOf('@media (min-width: 721px)', media);
  expect(inici).toBeGreaterThan(-1);
  const entremig = net.slice(inici, media);
  expect(entremig.split('{').length - entremig.split('}').length).toBeGreaterThan(0);
  expect(declaracions(MODULS, '.sdp-dialeg.sdp-dialeg--barra.sdp-dialeg--barra-amunt'))
    .toBe('margin-top: var(--sdp-space-4); max-height: calc(100vh - var(--sdp-space-8));');
});

/* T3 (mesurat al navegador, 261025) · El retallador senzill de la capçalera sense scroll: a 1280 × 800, les
   nou píndoles en una fila i el visor amb el pressupost d'escriptori; a 375 × 812, el peu en una fila (abans,
   tres botons apilats, uns 200 px) i el visor amb el de mòbil. */
test('T3 · retallador senzill: una fila de píndoles; en mòbil, el peu en una fila i el visor amb el pressupost de mòbil', () => {
  const net = senseComentaris(MODULS);
  const visor = '.sdp-enquadrament--formes .sdp-enquadrament__visor-caixa > .sdp-enquadrament__visor';
  expect(declaracions(MODULS, visor)).toBe('max-height: max(10rem, min(45vh, 22rem, calc(100vh - 32rem)));');
  expect(declaracions(MODULS, '.sdp-enquadrament__format-pindola')).toMatch(/padding: var\(--sdp-space-1\) var\(--sdp-space-2\);/);
  const peu = net.indexOf('.sdp-enquadrament__dialeg--senzill .sdp-dialeg__peu {');
  expect(peu).toBeGreaterThan(-1);
  const inici = net.lastIndexOf('@media (max-width: 720px)', peu);
  expect(inici).toBeGreaterThan(-1);
  const bloc = net.slice(inici, net.indexOf('\n  }\n', peu));
  expect(bloc).toContain('.sdp-enquadrament__dialeg--senzill .sdp-dialeg__peu { flex-direction: row; flex-wrap: wrap; gap: var(--sdp-space-2); }');
  expect(bloc).toContain('max-height: max(10rem, min(45vh, 22rem, calc(100vh - 39rem)));');
});
