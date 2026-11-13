// @vitest-environment node
/* workspace-05 (Gauntlet R22) · senseHtmlCru (R21.9 · T2) es crida sense memo
   en cada pintat de cada targeta del Mercat (targetaDeProducte.js) i en el
   subtítol del detall (detailSectionMeta.jsx), amb la descripció que escriu qui
   ven. La capçalera promet temps lineal: una cadena de «<» sense cap «>» no pot
   tornar a recórrer la cua per a cada «<». Abans de la correcció, 400.000 «<»
   tardaven 1,3 s en este Mac (els verificadors en van mesurar fins a 3,4 s);
   ara, uns pocs mil·lisegons. */
import { describe, expect, test } from 'vitest';
import { senseHtmlCru } from './etiquetesMercat.js';

const ms = (funcio) => {
  const inici = performance.now();
  const resultat = funcio();
  return { resultat, temps: performance.now() - inici };
};

describe('senseHtmlCru · «<» sense tancament', () => {
  test('un «<» sense cap «>» darrere és text literal, abans i després de l’última etiqueta', () => {
    expect(senseHtmlCru('<<<<<a')).toBe('<<<<<a');
    expect(senseHtmlCru('<p>Oli</p><p>verge</p> <<')).toBe('Oli verge <<');
    expect(senseHtmlCru('a<b>c</b><')).toBe('ac<');
    expect(senseHtmlCru('x<'.repeat(3))).toBe('x<x<x<');
  });

  test('400.000 «<» seguits, i «x<» repetit 200.000 vegades, en temps lineal', () => {
    const lletres = '<'.repeat(400_000);
    const nuvol = ms(() => senseHtmlCru(lletres));
    expect(nuvol.resultat).toBe(lletres);
    expect(nuvol.temps).toBeLessThan(250);

    const alternat = 'x<'.repeat(200_000);
    const mesclat = ms(() => senseHtmlCru(alternat));
    expect(mesclat.resultat).toBe(alternat);
    expect(mesclat.temps).toBeLessThan(250);
  });

  test('una etiqueta oberta al principi i la resta sense tancar continua sent lineal', () => {
    const entrada = `<p>${'<'.repeat(400_000)}`;
    const { resultat, temps } = ms(() => senseHtmlCru(entrada));
    expect(resultat).toBe('<'.repeat(400_000));
    expect(temps).toBeLessThan(250);
  });
});
