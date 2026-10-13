import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { BotoTornarADalt } from './BotoTornarADalt.jsx';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');

/* Ordre del Mestre (261012, vespre) · «Un botó suau de "Tornar a dalt"»: la
   pell de l'àtom. On va i quan apareix ho decidix la closca (App.jsx). */

afterEach(cleanup);

test('és un <button type="button"> amb el nom «Tornar a dalt», la classe de la pell i la fletxa decorativa', () => {
  render(<BotoTornarADalt onPuja={() => {}} />);
  const boto = screen.getByRole('button', { name: 'Tornar a dalt' });
  expect(boto.getAttribute('type')).toBe('button');
  expect(boto.className).toBe('sdp-tornar-dalt');
  const icona = boto.querySelector('svg');
  expect(icona.getAttribute('aria-hidden')).toBe('true');
  expect(icona.getAttribute('focusable')).toBe('false');
  expect(boto.textContent).toBe('');
});

test('cap estil en línia (Pedra Seca): ni al botó ni a la icona', () => {
  const { container } = render(<BotoTornarADalt onPuja={() => {}} />);
  expect(container.querySelector('[style]')).toBeNull();
});

test('el clic crida onPuja', () => {
  const onPuja = vi.fn();
  render(<BotoTornarADalt onPuja={onPuja} />);
  fireEvent.click(screen.getByRole('button', { name: 'Tornar a dalt' }));
  expect(onPuja).toHaveBeenCalledTimes(1);
});

/* Pedra Seca §9 · L'espècimen va primer: les expressions de la porta
   tooling/gates/tractor-cataleg.mjs (C1 registrat, C2 viu en un espècimen
   que l'importa per una ruta de PedraSeca). No entra a la façana index.js:
   la closca l'importa directament, com Dialeg. */
test('porta del catàleg: registrat «viu» a la pàgina de navegació i pintat de veres al seu espècimen', () => {
  const registre = llig('src/sections/disseny/cataleg/registre.js');
  const entrades = [...registre.matchAll(/\{\s*nom:\s*'([^']+)',\s*fitxer:\s*'([^']+)'[^}]*estat:\s*'(\w+)'([^}]*)\}/g)]
    .map(([, nom, fitxer, estat, resta]) => ({ nom, fitxer, estat, fora: /fora:\s*true/.test(resta) }));
  expect(entrades.filter((e) => e.nom === 'BotoTornarADalt'))
    .toEqual([{ nom: 'BotoTornarADalt', fitxer: 'PedraSeca/atoms/BotoTornarADalt.jsx', estat: 'viu', fora: false }]);
  const especimen = llig('src/sections/disseny/cataleg/detalls/EspecimenTornarADalt.jsx');
  const importats = [...especimen.matchAll(/import\s*\{([^}]+)\}\s*from\s*'[^']*(?:components\/(?:ui|PedraSeca)\/[^']+|UniversalElements)'/g)]
    .flatMap((m) => m[1].split(',').map((s) => s.trim()));
  expect(importats).toContain('BotoTornarADalt');
  expect(especimen).toMatch(/<BotoTornarADalt\b/);
  expect(llig('src/components/PedraSeca/atoms/BotoTornarADalt.jsx')).not.toMatch(/from '\.\.\/index\.js'|\sstyle=/);
});

test('l’etiqueta es pot personalitzar i és el nom accessible', () => {
  render(<BotoTornarADalt onPuja={() => {}} etiqueta="Tornar a l’inici del document" />);
  expect(screen.getByRole('button', { name: 'Tornar a l’inici del document' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Tornar a dalt' })).toBeNull();
});
