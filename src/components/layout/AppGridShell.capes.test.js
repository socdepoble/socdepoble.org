import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, test } from 'vitest';

/* jsdom no pinta ni apila: es comprova la regla. En «mitja» el panell esquerre
   llisca per damunt (z-index 30) i les barres sticky d'una fitxa (blava
   99090, taronja 99080, eines 99070) el tapaven perquè compartien context
   d'apilament. El Bloc de Notes ha de quedar com a HEAD.
   Corrector del Gauntlet f4 (30-10-2026, decisió 4 del Mestre: «neteja el
   codi mort mantenint les proves al dia») · El Perfil és un UniversalWorkspace
   (columnesFixes): la seua closca només és «estret» o «ample», mai «mitja», i
   la regla de PerfilShell.css que hi aïllava la columna dreta no casava mai.
   S'ha retirat. La doctrina continua: si mai calguera aïllar la columna
   dreta d'un espai (les eines del Bloc també s'ancoren a 99070), es faria a
   la pell de la secció (`.sdp-bloc`), no a la graella comuna (la prova de
   davall). */
const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const graella = net('src/components/layout/AppGridShell.css');
const fullsCss = (dir) => readdirSync(resolve(process.cwd(), dir), { withFileTypes: true }).flatMap((entrada) => {
  const ruta = join(dir, entrada.name);
  if (entrada.isDirectory()) return fullsCss(ruta);
  return entrada.name.endsWith('.css') ? [ruta] : [];
});

test('decisió 4 · cap full nomena el Perfil en «mitja»: el Workspace no hi passa i la regla d’aïllament era codi mort', () => {
  const ambPerfilEnMitja = fullsCss('src').filter((ruta) => /\.perfil-espai[^{}]*\[data-layout="mitja"\]/.test(net(ruta)));
  expect(ambPerfilEnMitja).toEqual([]);
  /* «Mitja» continua per al Xat i les apps: el panell esquerre de sempre. */
  expect(graella).toMatch(/\.app-grid-shell\[data-layout="mitja"\] \.app-grid-column--left \{[^}]*z-index: 30;/);
});

test('la graella comuna no aïlla la columna dreta en «mitja»: Notes no canvia', () => {
  expect(graella).not.toContain('.app-grid-shell[data-layout="mitja"] .app-grid-column--right { isolation: isolate; }');
  expect(graella).toContain('.app-grid-shell[data-layout="estret"] .app-grid-column--right { z-index: 1; }');
});

/* Decisió 2 del Mestre (30-10-2026 ~15:00: «el separador del mig ha de poder
   agafar-se sempre sense quedar bloquejat; ... el z-index necessari per a
   redimensionar sense xocar amb les barres») · jsdom no apila: es comprova
   la regla i la seua escala, i el navegador ho mesura (elementFromPoint a
   tota la franja, de davall de la capçalera fins a baix). Al Workspace en
   «ample», el separador del mig passa damunt de la taronja i de les eines
   (que tapaven la meitat dreta de la franja) i per davall de la blava (la
   fila de la capçalera, amb l'Arrere a tocar, i els menús que en pengen). Per
   la dreta, la franja fa el marge dels menús i del primer botó de les eines
   (8 px): no en tapa cap. Sense aïllar la columna dreta (la regla de dalt),
   i el separador del Xat, de les apps i de «mitja», el de sempre. */
const tokens = net('src/css/tokens.css');
const enter = (nom) => Number((tokens.match(new RegExp(`${nom}: (\\d+);`)) || [])[1]);
const MIG_DEL_WORKSPACE = '.app-grid-page.sdp-workspace--universal > .app-grid-shell[data-layout="ample"] .app-grid-resizer--middle';

test('decisió 2 · al Workspace en «ample», el separador del mig passa damunt de la taronja i de les eines i per davall de la blava', () => {
  expect(graella).toContain(`${MIG_DEL_WORKSPACE} { z-index: calc(var(--z-barra-taronja) + 1); }`);
  const z = enter('--z-barra-taronja') + 1;
  expect(z).toBeGreaterThan(enter('--z-eines-editor'));
  expect(z).toBeLessThan(enter('--z-barra-blava'));
  /* Cap altra regla toca el z-index d'un separador: el 50 de sempre i el 20 de «mitja». */
  const ambZ = reglesDe(graella).filter(({ selector, cos }) => selector.includes('app-grid-resizer') && /z-index/.test(cos)).map(({ selector }) => selector);
  expect(ambZ.sort()).toEqual([MIG_DEL_WORKSPACE, '.app-grid-resizer', '.app-grid-shell[data-layout="mitja"] .app-grid-resizer--middle'].sort());
  expect(graella).toMatch(/\.app-grid-resizer \{ position: relative; z-index: 50;/);
  expect(graella).toContain('.app-grid-shell[data-layout="mitja"] .app-grid-resizer--middle { grid-column: 2; z-index: 20; }');
  /* La columna dreta no s'aïlla en cap mida: les barres i els seus menús conserven el seu context. */
  expect(reglesDe(graella).filter(({ selector, cos }) => selector.includes('app-grid-column--right') && cos.includes('isolation'))).toEqual([]);
});

test('decisió 2 · per la dreta, la franja del separador del mig fa el marge on comencen els menús i el primer botó de les eines', () => {
  expect(graella).toContain(`${MIG_DEL_WORKSPACE}::before { inset-inline-end: calc(-1 * var(--sdp-space-2)); }`);
  expect(graella).toContain('.app-grid-resizer::before { content: \'\'; position: absolute; inset: 0 -10px;');
  // Decisió del Mestre (30-10-2026) · La línia es compon: tractor-tokens (T3) la prendria per una declaració.
  expect(tokens).toContain(['--sdp-space-2', ': 8px;'].join(''));
  /* El menú «Format del text» de les eines compactes comença a 8 px: si s'hi
     acostara, el separador (damunt de les eines) li'n taparia una franja. */
  const moduls = net('src/css/modules.css');
  const formats = /\.sdp-editor-tools__format-options:not\(\[hidden\]\) \{ position: absolute; inset-block-start: 100%; inset-inline-start: (\d+)px;/.exec(moduls);
  expect(Number(formats?.[1])).toBeGreaterThanOrEqual(8);
});

/* Ordre del Mestre (261026_2126, pla 261026_1615 §6) · Els 12px entre
   l'Ordenar i el Crear els porta ara el Crear, el germà que el seguix (abans,
   un margin-right de l'Ordenar). Sense Crear (Disseny, el Bloc sense sessió),
   l'Ordenar no porta cap marge propi a l'extrem i toca el coixí de la fila. */
const reglesDe = (css) => css.split('}').filter((tros) => tros.includes('{')).map((tros) => {
  const obri = tros.lastIndexOf('{');
  return { selector: tros.slice(0, obri).split(/[{;]/).pop().trim(), cos: tros.slice(obri + 1).trim() };
});
const ES_ORDENAR = /\.sdp-workspace-sort-action(:[\w-]+(\([^)]*\))?)*$/;

test('§6 · el buit de 12px va davant del Crear que seguix l’Ordenar, i l’Ordenar no porta cap marge propi a l’extrem', () => {
  expect(graella).toContain('.sdp-workspace-sort-action + .app-grid-col-header__accio { margin-inline-start: var(--sdp-space-3); }');
  const moduls = net('src/css/modules.css');
  const delOrdenar = [...reglesDe(graella), ...reglesDe(moduls)]
    .filter(({ selector }) => selector.split(',').some((s) => ES_ORDENAR.test(s.trim())));
  expect(delOrdenar.filter(({ cos }) => /(^|;)\s*margin(-right|-inline-end|-inline)?\s*:/.test(cos))).toEqual([]);
});
