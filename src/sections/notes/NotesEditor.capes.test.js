import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { selectorIndex } from '../../components/universal/PageFrame.jsx';

/* jsdom no calcula ni sticky ni capes: es comprova la regla. Les eines
   davall de l'entradilla (D13) s'ancoren a `blava + taronja` perquè al
   Perfil les dues barres són sticky. Al Bloc de Notes són static, i el
   mateix `top` deixava una franja buida de 116px damunt de les eines. */
const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const moduls = net('src/css/modules.css');
const utilitats = net('src/css/utilities.css');

test('la regla base de les eines continua deixant lloc a la blava i la taronja', () => {
  expect(moduls).toContain('.sdp-editor-eines { position: sticky; top: calc(var(--sdp-alt-accio) * 2);');
});

test('el Bloc de Notes ancora les eines a dalt del contenidor de scroll', () => {
  expect(moduls).toContain('.sdp-bloc .sdp-editor-eines { top: 0; }');
});

test('el top 0 de Notes depén que la blava i la taronja hi siguen static', () => {
  expect(utilitats).toMatch(/\.sdp-bloc \.sdp-editor-document > \.sdp-universal-page-container--contained > \.bar-blue,[^{]*\{ position: static; top: auto; \}/);
});

/* Tres barres (174px): al navegador, les eines fan 58px en una fila i 161px
   en tres (columna de 280-285px). Amb columnes més estretes no basta. */
/* T2 (ordre del Mestre, 260930) · els mateixos nivells que recull l'Índex:
   la llista ve del selector per defecte de PageFrame, i no d'una còpia a mà,
   perquè la regla no es desalinee si el valor per defecte torna a canviar. */
const SALT = `.sdp-bloc .sdp-editor-eines ~ * :is(${selectorIndex()})`;
test('l\'índex no deixa el títol de destí davall de les eines ancorades', () => {
  expect(SALT).toBe('.sdp-bloc .sdp-editor-eines ~ * :is(h1, h2, h3, h4, h5, h6)');
  expect(moduls).toContain(`${SALT} { scroll-margin-top: calc(var(--sdp-alt-accio) * 3); }`);
});

/* Talla el bloc `@layer components { … }` que conté la regla base, comptant
   claus: si la regla de Notes passara a una altra capa (legacy), perdria
   contra la base encara que tinga més especificitat. */
const blocDeCapa = (text, regla) => {
  const obri = text.lastIndexOf('@layer components {', text.indexOf(regla));
  let fons = 0;
  for (let i = text.indexOf('{', obri); i < text.length; i += 1) {
    if (text[i] === '{') fons += 1;
    else if (text[i] === '}' && (fons -= 1) === 0) return text.slice(obri, i + 1);
  }
  return '';
};

test('les regles de Notes viuen darrere de la base, dins del mateix @layer components', () => {
  const base = '.sdp-editor-eines { position: sticky;';
  const bloc = blocDeCapa(moduls, base);
  const topNotes = bloc.indexOf('.sdp-bloc .sdp-editor-eines { top: 0; }');
  expect(topNotes).toBeGreaterThan(bloc.indexOf(base));
  expect(bloc.indexOf(`${SALT} {`)).toBeGreaterThan(topNotes);
});
