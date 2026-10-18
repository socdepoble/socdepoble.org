import { expect, test } from 'vitest';
import { ALIES_DEL_PANELL, APLICACIONS, ESTATS_APLICACIO, aplicacionsValides } from './aplicacions.js';
import { IDS_PLUGINS } from '../plugins/registrePlugins.js';

/* Encàrrec d'harmonització (261018) · El catàleg complet del Panell: sis públiques i dues internes. */
test('les utilitats de sèrie: les huit utilitats declarades, pendents i amb icona', () => {
  expect(APLICACIONS.map((a) => a.id)).toEqual(['gestoria', 'rebost', 'salut', 'lector-rss', 'tpv', 'snippet', 'metriques', 'cervell']);
  for (const aplicacio of APLICACIONS) {
    expect(aplicacio.estat).toBe('pendent');
    expect(aplicacio.icona).toBeTruthy();
    expect(aplicacio.descripcio).toMatch(/\S/);
    expect(aplicacio).not.toHaveProperty('ruta');
  }
  // La configuració de sèrie ja és vàlida: passar-la pel filtre no la canvia.
  expect(aplicacionsValides(APLICACIONS).map((a) => a.id)).toEqual(['gestoria', 'rebost', 'salut', 'lector-rss', 'tpv', 'snippet', 'metriques', 'cervell']);
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
   id del registre de plugins (el que amaga ControlSection) o al Snippet.
   Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) ·
   DEROGAT «o a una pàgina del sistema de Maquinària i Sistema» (Onada 8):
   les targetes de la Consola i del Cervell ixen del Panell de Control i
   viuen només al Mur. L'ordre nova: tota utilitat amb `panell` apunta a una
   targeta que el Panell encara pinta, i les que no en tenen (la Consola de
   Mètriques i el Cervell) porten un null explícit, sense cap preferència. */
test('peça C · Onada 10 · cada aplicació del Perfil apunta a una targeta del Panell (del registre de plugins o «snippet») o a cap (null)', () => {
  const delPanell = new Set([...IDS_PLUGINS, 'snippet']);
  const valides = aplicacionsValides(APLICACIONS);
  for (const aplicacio of valides.filter((a) => a.panell !== null)) {
    expect(delPanell.has(aplicacio.panell), `${aplicacio.id} → ${aplicacio.panell}`).toBe(true);
  }
  expect(valides.map((a) => [a.id, a.panell])).toEqual([
    ['gestoria', 'gestoria'], ['rebost', 'rebost'], ['salut', 'salut'], ['lector-rss', 'rss'], ['tpv', 'tpv'], ['snippet', 'snippet'],
    ['metriques', null], ['cervell', null],
  ]);
  /* Cap utilitat apunta ja a la clau d'una de les tres pàgines que han eixit del Panell. */
  for (const clau of ['consola', 'cervell', 'disseny']) {
    expect(delPanell.has(clau), clau).toBe(false);
    expect(valides.map((a) => a.panell), clau).not.toContain(clau);
  }
  /* El null és a la taula, escrit: no ix d'un camp que falta. */
  for (const id of ['metriques', 'cervell']) {
    expect(APLICACIONS.find((a) => a.id === id).panell, id).toBeNull();
  }
});

/* Onada 10 (261010) · DEROGAT l'àlies 'metriques' → 'consola': la Consola ja
   no té targeta al Panell. Una utilitat amb `panell: null` no fa cap àlies;
   sense el filtre, ambAlies (utilitatsActives.js) copiaria la preferència
   vella a una clau «null». */
test('peça C · Onada 10 · ALIES_DEL_PANELL: només l’id vell que encara té targeta, de la mateixa taula; cap àlies cap a null', () => {
  expect(ALIES_DEL_PANELL).toEqual({ 'lector-rss': 'rss' });
  expect(Object.values(ALIES_DEL_PANELL).every((id) => typeof id === 'string' && id !== 'null')).toBe(true);
  expect(Object.isFrozen(ALIES_DEL_PANELL)).toBe(true);
});

/* Onada 10 (261010) · Un null EXPLÍCIT sí que passa: «sense targeta al
   Panell». Només el null: un camp que falta, undefined, buit o mal format
   continua caient a l'id, com abans (una llista federada que no el declara no
   canvia de comportament). */
test('peça C · un `panell` que no és un id vàlid no passa: queda el de l’aplicació; un null explícit es conserva', () => {
  const [buit, majuscules, bo, sense, indefinit, nul] = aplicacionsValides([
    { id: 'a', nom: 'A', panell: '' },
    { id: 'b', nom: 'B', panell: 'Consola Gran' },
    { id: 'c', nom: 'C', panell: 'consola' },
    { id: 'd', nom: 'D' },
    { id: 'e', nom: 'E', panell: undefined },
    { id: 'f', nom: 'F', panell: null },
  ]);
  expect([buit.panell, majuscules.panell, bo.panell, sense.panell, indefinit.panell, nul.panell]).toEqual(['a', 'b', 'consola', 'd', 'e', null]);
});

/* Gauntlet 261016 (Bloc 3.4; ordre del Mestre: «retirar definitivament la
   maquinària interna de desenvolupament de l'aside en pantalles d'usuari») ·
   La Consola de Mètriques i el Cervell són maquinària interna (intern: true,
   escrit a la taula), i el filtre conserva la marca. Només un true: qualsevol
   altre valor no hi posa cap clau (una llista federada no canvia). */
test('Bloc 3.4 · la maquinària interna porta `intern: true`, i el filtre només la conserva quan és un true', () => {
  expect(APLICACIONS.filter((a) => a.intern === true).map((a) => a.id)).toEqual(['metriques', 'cervell']);
  const valides = aplicacionsValides(APLICACIONS);
  expect(valides.filter((a) => a.intern === true).map((a) => a.id)).toEqual(['metriques', 'cervell']);
  for (const aplicacio of valides.filter((a) => !['metriques', 'cervell'].includes(a.id))) {
    expect(aplicacio, aplicacio.id).not.toHaveProperty('intern');
  }
  const [si, fals, text, sense] = aplicacionsValides([
    { id: 'a', nom: 'A', intern: true },
    { id: 'b', nom: 'B', intern: false },
    { id: 'c', nom: 'C', intern: 'true' },
    { id: 'd', nom: 'D' },
  ]);
  expect(si.intern).toBe(true);
  for (const aplicacio of [fals, text, sense]) expect(aplicacio, aplicacio.id).not.toHaveProperty('intern');
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
