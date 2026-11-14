/* Onada R26 (Bloc A, guarda d'esborrany) · Verificació del carril de Claude
   sobre el kit de Gemini: el botó «Publicar al Mur» de davall de l'entradilla
   (petició `origen: 'publicar-barra'`) arriba al panell en línia.
     · Esborrany privat: no publica; el recordatori és la descripció del ràdio
       públic, i el focus hi arriba quan el recordatori ja és al DOM (el
       lector el diu en enfocar-lo, també en prémer el botó una segona volta).
     · Nota pública amb canvis: publica directament i el focus no queda en un
       botó que es desactiva mentre es publica (WCAG 2.4.3): va al panell.
     · La barra diu «Publicat» però el poble s'ha canviat al panell: «Publicat»
       no publica; el focus va a «Actualitzar al Mur», que és qui ho fa.
     · El salt cap al panell és suau, i de colp amb prefers-reduced-motion. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => () => {} }));

import { PanellVisibilitatEnLinia } from './PanellVisibilitatEnLinia.jsx';

afterEach(cleanup);

const NOM_PANELL = 'Visibilitat i publicació de la nota';
const RECORDATORI = 'Esta nota està en 🔒 Esborrany privat. Tria «📣 Públic al Mur de poble» abans de publicar-la.';
const peticio = () => ({ nota: 'n-1', origen: 'publicar-barra' });

function munta(props) {
  const base = { notaId: 'n-1', onTria: vi.fn(() => true), ...props };
  const utils = render(<PanellVisibilitatEnLinia {...base} />);
  const demana = () => act(() => {
    utils.rerender(<PanellVisibilitatEnLinia {...base} peticioEnfocament={peticio()} />);
  });
  return { ...utils, demana, onTria: base.onTria };
}

const descripcioDe = (element) => (element.getAttribute('aria-describedby') || '')
  .split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)?.textContent || '').join(' ');

test('esborrany privat: no publica, enfoca el ràdio públic i el recordatori n’és la descripció (també a la segona volta)', () => {
  const { demana, onTria } = munta({ esPublica: false, estatPublicacio: 'pendent' });
  demana();
  const panell = screen.getByRole('region', { name: NOM_PANELL });
  const radioPublic = within(panell).getByRole('radio', { name: /Públic al Mur de poble/ });
  expect(onTria).not.toHaveBeenCalled();
  expect(radioPublic.checked).toBe(false);
  expect(within(panell).getByText(RECORDATORI)).toBeTruthy();
  expect(document.activeElement).toBe(radioPublic);
  expect(descripcioDe(radioPublic)).toContain(RECORDATORI);

  // Segona volta, amb el focus en un altre lloc: el mateix destí i la mateixa descripció.
  within(panell).getByRole('radio', { name: /Esborrany privat/ }).focus();
  demana();
  expect(document.activeElement).toBe(radioPublic);
  expect(descripcioDe(radioPublic)).toContain(RECORDATORI);
  expect(onTria).not.toHaveBeenCalled();

  // Triada la pública, el recordatori se'n va i la descripció torna a ser la de sempre.
  fireEvent.click(radioPublic);
  expect(within(panell).queryByText(RECORDATORI)).toBeNull();
  expect(descripcioDe(radioPublic)).not.toContain(RECORDATORI);
});

test('nota pública amb canvis: publica directament i el focus va al panell, no al botó que es desactiva', async () => {
  let resol;
  const onTria = vi.fn(() => new Promise((r) => { resol = r; }));
  const { demana } = munta({ esPublica: true, estatPublicacio: 'pendent', onTria });
  demana();
  const panell = screen.getByRole('region', { name: NOM_PANELL });
  expect(onTria).toHaveBeenCalledTimes(1);
  expect(onTria).toHaveBeenCalledWith(true);
  expect(within(panell).getByRole('button', { name: 'Publicant…' }).disabled).toBe(true);
  expect(document.activeElement.disabled).not.toBe(true);
  expect(document.activeElement).toBe(panell);
  await act(async () => { resol(true); });
});

test('el salt cap al panell és suau i, amb prefers-reduced-motion, de colp', () => {
  const scrollAbans = Element.prototype.scrollIntoView;
  const matchMediaAbans = window.matchMedia;
  const salts = [];
  Element.prototype.scrollIntoView = function scrollIntoView(opcions) { salts.push(opcions); };
  try {
    const suau = munta({ esPublica: false, estatPublicacio: 'pendent' });
    suau.demana();
    expect(salts).toEqual([{ behavior: 'smooth', block: 'start' }]);
    suau.unmount();
    window.matchMedia = (consulta) => ({ matches: consulta === '(prefers-reduced-motion: reduce)', media: consulta, addEventListener() {}, removeEventListener() {} });
    const colp = munta({ esPublica: false, estatPublicacio: 'pendent' });
    colp.demana();
    expect(salts[1]).toEqual({ behavior: 'auto', block: 'start' });
  } finally {
    Element.prototype.scrollIntoView = scrollAbans;
    window.matchMedia = matchMediaAbans;
  }
});

test('la barra diu «Publicat» però el poble s’ha canviat al panell: no publica i el focus va a «Actualitzar al Mur»', () => {
  const { demana, onTria } = munta({
    esPublica: true,
    estatPublicacio: 'publicat',
    poblesDisponibles: ['Alcoi', 'Xixona'],
    poblePublicat: 'Alcoi',
  });
  const panell = screen.getByRole('region', { name: NOM_PANELL });
  fireEvent.change(within(panell).getByLabelText('Poble on es publica'), { target: { value: 'Xixona' } });
  const actualitza = within(panell).getByRole('button', { name: 'Actualitzar al Mur' });
  expect(actualitza.disabled).toBe(false);
  demana();
  expect(onTria).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(actualitza);
  // La persona ho confirma al panell: ara sí, amb el poble nou.
  fireEvent.click(actualitza);
  expect(onTria).toHaveBeenCalledWith(true, { poble: 'Xixona' });
});
