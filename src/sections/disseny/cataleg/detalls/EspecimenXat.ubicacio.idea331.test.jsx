/* v1.2.23 · K5 (ordre del Mestre 261123) · IDEA-331 · La mostra de la ubicació de l'espècimen del Xat
   (UbicacioIAvisTancableDeMostra, EspecimenXat.jsx) pintava el text de R32.8, «📍 S’inclourà la ubicació on
   s’ha fet (38,59°, -0,42°)», que ja no existix a la interfície. Ara ensenya la fila de producció
   (ControlsAdjunt.jsx): l'avís de la clau section.xat.adjunts.ubicacioConservada amb el punt del fitxer (cinc
   decimals com a màxim), la icona MapPin i l'interruptor d'un toc «Amaga el lloc» (title «Publicar sense
   geolocalització») / «Conserva el lloc», que torna a «Ubicació amagada». Els textos es comparen amb el
   diccionari valencià de veres, i la costura de dalt diu que producció encara pinta eixes claus: si una canvia,
   esta prova cau i el catàleg s'ha de posar al dia. */
import '../../../../../tests/helpers/diccionaris.js';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import { createTranslator } from '../../../../config/i18n.js';
import EspecimenXat from './EspecimenXat.jsx';

const tCa = createTranslator('ca');
const CLAUS = Object.freeze({
  avis: 'section.xat.adjunts.ubicacioConservada',
  amaga: 'section.xat.adjunts.amagaLloc',
  llarg: 'section.xat.adjunts.publicaSenseGeolocalitzacio',
  conserva: 'section.xat.adjunts.conservaLloc',
  amagada: 'section.xat.ubicacio.amagada'
});

let errors;
beforeEach(() => { errors = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => {
  const crides = errors.mock.calls.map((c) => String(c[0]).slice(0, 200));
  errors.mockRestore();
  cleanup();
  expect(crides).toEqual([]);
});

test('costura: ControlsAdjunt de producció pinta l’avís i l’interruptor amb les claus que ensenya l’espècimen', () => {
  const produccio = readFileSync(path.join(process.cwd(), 'src/sections/xat/components/ControlsAdjunt.jsx'), 'utf8');
  for (const clau of Object.values(CLAUS)) {
    expect(produccio, clau).toContain(`t('${clau}'`);
    expect(tCa(clau), clau).not.toBe(clau);
  }
  expect(produccio).toContain('className="sdp-xat-adjunts__fila sdp-xat-ubicacio-control"');
  expect(produccio).toContain('className="sdp-xat-adjunts__avis sdp-xat-ubicacio-control__estat"');
});

test('la mostra de la ubicació ensenya l’avís i l’interruptor de producció, no el text de R32.8', () => {
  render(<MemoryRouter><EspecimenXat /></MemoryRouter>);
  const mostra = screen.getByRole('region', { name: 'Ubicació i avís tancable de mostra' });
  expect(mostra.textContent).not.toContain('S’inclourà');
  expect(mostra.textContent).not.toContain('📍');

  const fila = mostra.querySelector('.sdp-xat-adjunts__fila.sdp-xat-ubicacio-control');
  expect(fila).not.toBeNull();
  const avis = () => fila.querySelector('p.sdp-xat-adjunts__avis.sdp-xat-ubicacio-control__estat');
  expect(avis().querySelector('svg.lucide-map-pin[aria-hidden="true"]')).not.toBeNull();
  expect(avis().textContent).toBe(tCa(CLAUS.avis).replace('{lat}', '38,5892').replace('{lng}', '-0,4214'));

  const amaga = within(fila).getByRole('button', { name: tCa(CLAUS.amaga) });
  expect(amaga.getAttribute('title')).toBe(tCa(CLAUS.llarg));
  expect(amaga.classList.contains('sdp-xat-pindola--secundaria')).toBe(true);
  fireEvent.click(amaga);

  expect(avis().textContent).toBe(tCa(CLAUS.amagada));
  expect(within(fila).queryByRole('button', { name: tCa(CLAUS.amaga) })).toBeNull();
  fireEvent.click(within(fila).getByRole('button', { name: tCa(CLAUS.conserva) }));
  expect(avis().textContent).toBe(tCa(CLAUS.avis).replace('{lat}', '38,5892').replace('{lng}', '-0,4214'));
});
