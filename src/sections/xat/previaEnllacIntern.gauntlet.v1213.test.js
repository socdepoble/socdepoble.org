/* Gauntlet v1.2.13 · Regressions de la previsualització d'enllaços interns del Xat:
   un «%» solt no tomba la conversa i un camí «//host» o «/\host» no fa targeta. */
import { describe, expect, test } from 'vitest';
import { extreuPreviaInterna } from './previaEnllacIntern.js';

describe('Gauntlet v1.2.13 · previaEnllacIntern', () => {
  test('un «%» que no es pot descodificar no llança: el títol el conserva tal qual', () => {
    expect(() => extreuPreviaInterna('mira /mur/rebaixes-50%')).not.toThrow();
    expect(extreuPreviaInterna('mira /mur/rebaixes-50%').titol).toBe('Rebaixes 50%');
    expect(extreuPreviaInterna('https://socdepoble.org/mur/oferta-%E0%A4%A').titol).toBe('Oferta %e0%a4%a'); // la clau es passa a minúscules abans del títol
  });

  test('un camí que comença per dues barres no fa cap targeta amb l’etiqueta de socdepoble.org', () => {
    expect(extreuPreviaInterna('https://socdepoble.org//evil.example/login')).toBeNull();
    expect(extreuPreviaInterna('https://socdepoble.org/\\evil.example')).toBeNull();
    for (const cami of ['/.//evil.example', '/mur/..//evil.example', '/%2e//evil.example']) {
      expect(extreuPreviaInterna(`https://socdepoble.org${cami}`), cami).toBeNull();
    }
    expect(extreuPreviaInterna('https://socdepoble.org/mur/la-veu-de-soc-de-poble').ruta).toBe('/mur/la-veu-de-soc-de-poble');
  });
});
