/* Fase C (punt 9; ordre del Mestre, 19-10-2026) · La fila «Veure fitxa
   pública» (AccesFitxaPublica, PerfilShell.jsx) als fulls d'estil. jsdom no
   resol la cascada ni pinta: es comproven les regles escrites, com a
   src/sections/xat/components/FullAjustos.capes.test.js.
   · Revisió adversarial (19-10-2026) · La fila 1 de la tercera columna es
     pinta amb el gris de la fila 1 de l'espai de treball (modules.css), el de
     les capçaleres de PERFIL i APARTATS: amb --sdp-crom-capcalera (el gris de
     la navegació, més clar) la barra de dalt feia un graó on comença la
     tercera columna.
   · En una línia, la fila fa --sdp-alt-accio justa; si el motiu de la fitxa
     privada i el botó no hi caben (un mòbil), es partix en lloc de retallar
     «Fitxa privada».
   · La porta inerta (aria-disabled) porta la pell de :disabled del Perfil. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const perfil = llig('src/sections/profile/PerfilShell.css');
const modules = llig('src/css/modules.css');
const tokens = llig('src/css/tokens.css');

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
          condicions: pila.map((b) => b.prelud).filter((p) => /^@(media|container)/.test(p)),
        });
      }
      inici = i + 1;
    }
  }
  return eixida;
}

/** Les declaracions d'una regla sense condicions, com a mapa propietat → valor. */
function declaracionsDe(css, selector) {
  const trobades = regles(css).filter((r) => r.selectors.includes(selector) && r.condicions.length === 0);
  const mapa = {};
  for (const { cos } of trobades) {
    for (const declaracio of cos.split(';').map(net).filter(Boolean)) {
      const dos = declaracio.indexOf(':');
      mapa[net(declaracio.slice(0, dos))] = net(declaracio.slice(dos + 1));
    }
  }
  return mapa;
}

const FILA1_ESPAI = '.sdp-workspace .sdp-workspace-column > .app-grid-col-header:not(.app-grid-col-header--collapsed)';
const pixels = (token) => Number(tokens.match(new RegExp(`${token}:\\s*(\\d+)px`))?.[1]);

describe('la fila «Veure fitxa pública»', () => {
  const fila = declaracionsDe(perfil, '.perfil-fitxa-publica');

  test('el gris de la fila 1 de l’espai de treball, el mateix de les capçaleres de PERFIL i APARTATS', () => {
    const capcalera = declaracionsDe(modules, FILA1_ESPAI);
    expect(capcalera.background).toBe('var(--sdp-workspace-fila1-fons)');
    expect(fila.background).toBe(capcalera.background);
    expect(perfil).not.toMatch(/\.perfil-fitxa-publica\s*\{[^}]*--sdp-crom-capcalera/);
  });

  test('fora del scroll; en una línia, --sdp-alt-accio justa: el farciment completa l’alçada tàctil', () => {
    expect(fila.flex).toBe('none');
    expect(fila['min-height']).toBe('var(--sdp-alt-accio)');
    expect(fila.height).toBeUndefined();
    expect(fila['box-sizing']).toBe('border-box');
    expect(fila.padding).toBe('calc((var(--sdp-alt-accio) - var(--sdp-touch)) / 2) var(--sdp-space-4)');
    // El motiu i el botó del Perfil fan l'alçada tàctil; el farciment no és negatiu.
    expect(declaracionsDe(perfil, '.perfil-fitxa-publica__avis')['min-height']).toBe('var(--sdp-touch)');
    expect(declaracionsDe(perfil, ':where(.perfil-pagina) .sdp-boto')['min-height']).toBe('var(--sdp-touch)');
    expect(pixels('--sdp-touch')).toBeLessThanOrEqual(pixels('--sdp-alt-accio'));
  });

  test('si el motiu i el botó no caben, la fila es partix: «Fitxa privada» no es retalla en un mòbil', () => {
    expect(fila['flex-wrap']).toBe('wrap');
    expect(declaracionsDe(perfil, '.perfil-fitxa-publica__avis').flex).toBe('1 1 auto');
    expect(declaracionsDe(perfil, '.perfil-fitxa-publica__boto').flex).toBe('none');
  });

  test('la porta inerta (aria-disabled) porta la pell de :disabled del Perfil', () => {
    const inerta = declaracionsDe(perfil, '.perfil-fitxa-publica__boto[aria-disabled="true"]');
    const desactivat = declaracionsDe(perfil, ':where(.perfil-pagina) .sdp-boto:disabled');
    expect(inerta.opacity).toBe(desactivat.opacity);
    expect(inerta.cursor).toBe(desactivat.cursor);
  });
});
