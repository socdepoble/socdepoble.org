// @vitest-environment node
/* La Policia del Disseny com a porta real (candidata al pre-commit, al costat
   de design_guard): cap bandera roja al codi de producció de src/apps i de
   src/utils. Les dues sondes impedixen que la porta isca verda sense
   comprovar res: ha de revisar fitxers de veres i ha de saber trobar una
   roja. Si src/apps encara no existix (el carril de les apps el crea), es
   revisa src/utils sol i la prova ho diu. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { revisaFitxer } from './policiaDisseny.js';

const ARREL = process.cwd();
const ARRELS = ['src/apps', 'src/utils'];
const esProva = (ruta) => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(ruta) || ruta.includes('/__fixtures__/');

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.(?:jsx?|mjs|css|html)$/.test(entrada.name) && !esProva(ruta)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

const presents = ARRELS.filter((arrel) => existsSync(path.join(ARREL, arrel)));
const FITXERS = presents.flatMap(fitxersDe);

describe('porta de la Policia del Disseny sobre src/apps i src/utils', () => {
  test('hi ha codi per revisar: src/utils sempre, src/apps quan existix', () => {
    expect(presents).toContain('src/utils');
    expect(FITXERS.filter((f) => f.startsWith('src/utils/')).length).toBeGreaterThanOrEqual(5);
  });

  test('cap bandera roja al codi de producció', () => {
    const roges = FITXERS.flatMap((ruta) => revisaFitxer(ruta, readFileSync(path.join(ARREL, ruta), 'utf8')))
      .filter((a) => a.severitat === 'roja')
      .map((a) => `${a.font} [${a.codi}] ${a.missatge}`);
    expect(roges).toEqual([]);
  });

  test('sonda: la mateixa porta troba una roja en un fitxer d’apps', () => {
    const estil = ['sty', 'le='].join('');
    const roges = revisaFitxer('src/apps/sonda/Sonda.jsx', `export const S = () => <p ${estil}{{}} />;`).filter((a) => a.severitat === 'roja');
    expect(roges.map((a) => a.codi)).toEqual(['PS-ESTIL-EN-LINIA']);
  });
});
