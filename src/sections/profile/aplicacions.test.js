import { expect, test } from 'vitest';
import { APLICACIONS, ESTATS_APLICACIO, aplicacionsValides } from './aplicacions.js';

test('les utilitats de sèrie: Gestoria, Llibreria i Ajuntament, pendents i amb icona', () => {
  expect(APLICACIONS.map((a) => a.id)).toEqual(['gestoria', 'llibreria', 'ajuntament']);
  for (const aplicacio of APLICACIONS) {
    expect(aplicacio.estat).toBe('pendent');
    expect(aplicacio.icona).toBeTruthy();
    expect(aplicacio.descripcio).toMatch(/\S/);
    expect(aplicacio).not.toHaveProperty('ruta');
  }
  // La configuració de sèrie ja és vàlida: passar-la pel filtre no la canvia.
  expect(aplicacionsValides(APLICACIONS).map((a) => a.id)).toEqual(['gestoria', 'llibreria', 'ajuntament']);
  expect(Object.isFrozen(APLICACIONS)).toBe(true);
});

test('el filtre descarta ids invàlids, noms buits i repetits; guanya la primera', () => {
  const valides = aplicacionsValides([
    { id: 'forn', nom: ' Forn ' },
    { id: 'Forn Gran', nom: 'Majúscules i espais' },
    { id: 'buit', nom: '   ' },
    { id: 'forn', nom: 'Repetida' },
    null,
    { nom: 'Sense id' },
  ]);
  expect(valides).toEqual([{ id: 'forn', nom: 'Forn', descripcio: '', icona: null, estat: 'pendent', ruta: null }]);
  expect(aplicacionsValides('no és una llista')).toEqual([]);
});

test('només una utilitat «connectada» amb ruta interna s’enllaça; la resta, pendent', () => {
  const [bona, sensRuta, externa, protocol] = aplicacionsValides([
    { id: 'a', nom: 'A', estat: 'connectada', ruta: '/mercat' },
    { id: 'b', nom: 'B', estat: 'connectada' },
    { id: 'c', nom: 'C', estat: 'connectada', ruta: 'https://fora.test' },
    { id: 'd', nom: 'D', estat: 'connectada', ruta: '//fora.test' },
  ]);
  expect(bona).toMatchObject({ estat: 'connectada', ruta: '/mercat' });
  for (const aplicacio of [sensRuta, externa, protocol]) expect(aplicacio).toMatchObject({ estat: 'pendent', ruta: null });
  expect(ESTATS_APLICACIO.pendent).toBe('Pendent de connectar en este node');
});
