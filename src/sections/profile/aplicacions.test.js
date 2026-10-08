import { expect, test } from 'vitest';
import { ALIES_DEL_PANELL, APLICACIONS, ESTATS_APLICACIO, aplicacionsValides } from './aplicacions.js';
import { IDS_PLUGINS } from '../plugins/registrePlugins.js';

test('les utilitats de sèrie: les cinc utilitats declarades, pendents i amb icona', () => {
  expect(APLICACIONS.map((a) => a.id)).toEqual(['gestoria', 'metriques', 'lector-rss', 'cervell', 'snippet']);
  for (const aplicacio of APLICACIONS) {
    expect(aplicacio.estat).toBe('pendent');
    expect(aplicacio.icona).toBeTruthy();
    expect(aplicacio.descripcio).toMatch(/\S/);
    expect(aplicacio).not.toHaveProperty('ruta');
  }
  // La configuració de sèrie ja és vàlida: passar-la pel filtre no la canvia.
  expect(aplicacionsValides(APLICACIONS).map((a) => a.id)).toEqual(['gestoria', 'metriques', 'lector-rss', 'cervell', 'snippet']);
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
  /* Peça C (ordre del Mestre, 261007) · Cada utilitat vàlida porta `panell`,
     l'id amb què el Panell llig la preferència; sense declarar-ne, el seu id. */
  expect(valides).toEqual([{ id: 'forn', nom: 'Forn', descripcio: '', icona: null, estat: 'pendent', ruta: null, panell: 'forn' }]);
  expect(aplicacionsValides('no és una llista')).toEqual([]);
});

/* Ordre del Mestre (261007, prompt 261007_1628, peça C) · La preferència que
   escriu el Perfil ha de ser la que llig el Panell: cada utilitat apunta a un
   id del registre de plugins (el que amaga ControlSection) o al Snippet. */
test('peça C · cada aplicació del Perfil apunta a un id del registre de plugins o és «snippet»', () => {
  const delPanell = new Set([...IDS_PLUGINS, 'snippet']);
  for (const aplicacio of aplicacionsValides(APLICACIONS)) {
    expect(delPanell.has(aplicacio.panell), `${aplicacio.id} → ${aplicacio.panell}`).toBe(true);
  }
  expect(aplicacionsValides(APLICACIONS).map((a) => [a.id, a.panell])).toEqual([
    ['gestoria', 'gestoria'], ['metriques', 'consola'], ['lector-rss', 'rss'], ['cervell', 'cervell'], ['snippet', 'snippet'],
  ]);
});

test('peça C · ALIES_DEL_PANELL: només els ids vells que no casaven, de la mateixa taula', () => {
  expect(ALIES_DEL_PANELL).toEqual({ metriques: 'consola', 'lector-rss': 'rss' });
  expect(Object.isFrozen(ALIES_DEL_PANELL)).toBe(true);
});

test('peça C · un `panell` que no és un id vàlid no passa: queda el de l’aplicació', () => {
  const [buit, majuscules, bo] = aplicacionsValides([
    { id: 'a', nom: 'A', panell: '' },
    { id: 'b', nom: 'B', panell: 'Consola Gran' },
    { id: 'c', nom: 'C', panell: 'consola' },
  ]);
  expect([buit.panell, majuscules.panell, bo.panell]).toEqual(['a', 'b', 'consola']);
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
