/* v1.2.22 · Gauntlet R2 (M2-03) · El xip del Mode Bancal fora d'UIProvider. El mode és global (theme.js: SENIOR_KEY i un
   'bancal' antic a CONTRAST_KEY), i els dos atributs, data-sdp-senior i data-contrast="bancal", es deriven d'eixe estat en
   un sol efecte que els reclama i els allibera junts. Abans cada xip guardava un reclam propi del contrast i escrivia la
   lletra gran en cru: dos xips, o un xip que es desmuntava, deixaven un atribut sol, i un proveïdor de la mateixa pàgina no
   s'assabentava del 'normal' desat. Dins del proveïdor (el camí de producció: XatSection, PerfilShell, DetallEspai,
   ControlSection i AvisadorPage) els atributs els posa App.jsx, i el xip no en toca cap. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { UIProvider, useUIState } from '../../app/contexts/UIContext.jsx';
import ControlModeSenior from './ControlModeSenior.jsx';
import { delVal, getVal, setVal } from '../../config/storage.js';
import {
  ATRIBUT_CONTRAST, ATRIBUT_SENIOR, CONTRAST_KEY, ESDEVENIMENT_CONTRAST, SENIOR_KEY, reiniciaMemoriaSenior
} from '../../config/theme.js';

const arrel = () => document.documentElement;
const atributs = () => ({ senior: arrel().getAttribute(ATRIBUT_SENIOR), contrast: arrel().getAttribute(ATRIBUT_CONTRAST) });
/* Mai un atribut sol: o hi són tots dos (el Mode Bancal encés) o no n'hi ha cap. */
const ambElsDos = () => expect(atributs()).toEqual({ senior: 'true', contrast: 'bancal' });
const senseCap = () => expect(atributs()).toEqual({ senior: null, contrast: null });

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((consulta) => ({
    matches: false, media: consulta, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn()
  })));
  delVal(SENIOR_KEY);
  delVal(CONTRAST_KEY);
  reiniciaMemoriaSenior();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delVal(SENIOR_KEY);
  delVal(CONTRAST_KEY);
  reiniciaMemoriaSenior();
  arrel().removeAttribute(ATRIBUT_SENIOR);
  arrel().removeAttribute(ATRIBUT_CONTRAST);
});

test('M2-03 · dos xips fora d’UIProvider: A encén i B apaga, i cap atribut no queda a mitges', () => {
  render(<><ControlModeSenior etiquetaCurta testId="a" /><ControlModeSenior testId="b" /></>);
  const [a, b] = [screen.getByTestId('a'), screen.getByTestId('b')];
  senseCap();
  fireEvent.click(a);
  ambElsDos();
  expect([a.getAttribute('aria-checked'), b.getAttribute('aria-checked')]).toEqual(['true', 'true']);
  fireEvent.click(b);
  senseCap();
  expect([a.getAttribute('aria-checked'), b.getAttribute('aria-checked')]).toEqual(['false', 'false']);
  expect(getVal(SENIOR_KEY)).toBe(false);
  fireEvent.click(b);
  ambElsDos();
  fireEvent.click(a);
  senseCap();
});

test('M2-03 · desmuntar un xip encés se’n du els dos atributs junts; amb un altre xip muntat, es queden tots dos', () => {
  const sol = render(<ControlModeSenior testId="sol" />);
  fireEvent.click(screen.getByTestId('sol'));
  ambElsDos();
  sol.unmount();
  senseCap();
  /* Desmuntar no és apagar: la preferència desada continua encesa. */
  expect(getVal(SENIOR_KEY)).toBe(true);

  const parell = render(<><ControlModeSenior testId="queda" /><ControlModeSenior testId="ix" /></>);
  ambElsDos();
  /* Mateix arbre, el segon xip fora: el primer no es torna a muntar. */
  const queda = screen.getByTestId('queda');
  parell.rerender(<><ControlModeSenior testId="queda" />{null}</>);
  expect(screen.queryByTestId('ix')).toBeNull();
  expect(screen.getByTestId('queda')).toBe(queda);
  ambElsDos();
  expect(queda.getAttribute('aria-checked')).toBe('true');
  parell.unmount();
  senseCap();
});

test('M2-03 · muntar fora d’UIProvider amb el Mode Bancal desat encés posa els dos atributs (✓ i tots dos)', () => {
  setVal(SENIOR_KEY, true);
  render(<ControlModeSenior etiquetaCurta testId="desat" />);
  expect(screen.getByTestId('desat').getAttribute('aria-checked')).toBe('true');
  ambElsDos();
});

test('M2-03 · un «bancal» antic desat: el xip de fora l’encén sencer i, en apagar-lo, un UIProvider de la mateixa pàgina també el deixa (seniorMode false, contrast «normal»)', () => {
  function Sonda() {
    const { seniorMode, contrastPreference } = useUIState();
    return <p data-testid="sonda" data-senior={String(seniorMode)} data-preferencia={contrastPreference} />;
  }
  setVal(CONTRAST_KEY, 'bancal');
  const avisos = [];
  const escolta = (event) => avisos.push(event?.detail?.contrast);
  window.addEventListener(ESDEVENIMENT_CONTRAST, escolta);
  try {
    render(<><UIProvider externalConfig={{}}><Sonda /></UIProvider><ControlModeSenior testId="fora" /></>);
    const sonda = screen.getByTestId('sonda');
    const fora = screen.getByTestId('fora');
    expect(sonda.dataset.senior).toBe('true');
    expect(fora.getAttribute('aria-checked')).toBe('true');
    ambElsDos();
    fireEvent.click(fora);
    expect(avisos).toEqual(['normal']);
    expect(sonda.dataset.senior).toBe('false');
    expect(sonda.dataset.preferencia).toBe('normal');
    expect(fora.getAttribute('aria-checked')).toBe('false');
    expect(getVal(CONTRAST_KEY)).toBe('normal');
    expect(getVal(SENIOR_KEY)).toBe(false);
    senseCap();
  } finally {
    window.removeEventListener(ESDEVENIMENT_CONTRAST, escolta);
  }
});

test('M2-03 · un xip que no torna un «bancal» antic no emet cap avís de contrast', () => {
  const avisos = [];
  const escolta = (event) => avisos.push(event?.detail?.contrast);
  window.addEventListener(ESDEVENIMENT_CONTRAST, escolta);
  try {
    render(<ControlModeSenior testId="net" />);
    fireEvent.click(screen.getByTestId('net'));
    fireEvent.click(screen.getByTestId('net'));
    expect(avisos).toEqual([]);
    senseCap();
  } finally {
    window.removeEventListener(ESDEVENIMENT_CONTRAST, escolta);
  }
});

test('M2-03 · dins d’UIProvider el xip no toca cap atribut (els posa App.jsx): el toc és toggleSeniorMode i el proveïdor canvia', () => {
  function Sonda() {
    const { seniorMode } = useUIState();
    return <p data-testid="sonda-dins" data-senior={String(seniorMode)} />;
  }
  render(<UIProvider externalConfig={{}}><Sonda /><ControlModeSenior testId="dins" /></UIProvider>);
  const xip = screen.getByTestId('dins');
  act(() => { fireEvent.click(xip); });
  expect(screen.getByTestId('sonda-dins').dataset.senior).toBe('true');
  expect(xip.getAttribute('aria-checked')).toBe('true');
  expect(getVal(SENIOR_KEY)).toBe(true);
  senseCap();
  act(() => { fireEvent.click(xip); });
  expect(screen.getByTestId('sonda-dins').dataset.senior).toBe('false');
  senseCap();
});
