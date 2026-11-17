import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { _reiniciaTransicioDeDocument, lazyRouteRenovable, marcaTransicioDeDocument } from '../../apps/plataforma/lazyRoute.js';
import { PanellDiferitDelPerfil } from './PerfilShell.jsx';
import { SlotErrorBoundary } from '../../components/universal/workspace/SlotErrorBoundary.jsx';
import { _reiniciaAutocuracio, incidents } from '../../utils/autocuracio.js';
import '../../host.js';

beforeEach(() => {
  _reiniciaTransicioDeDocument();
  _reiniciaAutocuracio();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  _reiniciaTransicioDeDocument();
  vi.restoreAllMocks();
});

describe('Onada R32 · T1 · Panells diferits de PerfilShell i vite:preloadError en transició', () => {
  test('host.js calla el fals vite:preloadError durant una recàrrega de document i l’anota fora de transició', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    marcaTransicioDeDocument(Date.now());
    window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
    expect(spy).not.toHaveBeenCalled();

    _reiniciaTransicioDeDocument();
    window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
    expect(spy).toHaveBeenCalledWith(
      '[host] Error de xarxa en la càrrega diferida de mòduls Vite:',
      expect.any(Event),
    );
  });

  test('PanellDiferitDelPerfil aïlla una fallada de xarxa i permet un reintent real sense tombar el Perfil', async () => {
    let intents = 0;
    const renovable = lazyRouteRenovable(() => {
      intents += 1;
      if (intents === 1) {
        return Promise.reject(new TypeError('Failed to fetch dynamically imported module'));
      }
      return Promise.resolve({
        default: ({ identitat }) => <p>{`panell viu per a ${identitat?.nom ?? 'sistema'}`}</p>,
      });
    });

    render(<PanellDiferitDelPerfil renovable={renovable} propsPanell={{ identitat: { nom: 'Javi' } }} />);

    expect(await screen.findByText('Revisa la connexió i torna-ho a provar.')).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(intents).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Tornar a provar' }));
    expect(await screen.findByText('panell viu per a Javi')).toBeTruthy();
    expect(intents).toBe(2);
  });

  test('un error intern de render puja al límit del detall i no es disfressa de fallada de xarxa', async () => {
    const renovable = lazyRouteRenovable(() => Promise.resolve({
      default: () => { throw new Error('error de render intern'); },
    }));

    await expect(async () => {
      render(<PanellDiferitDelPerfil renovable={renovable} />);
      await act(async () => { await Promise.resolve(); });
    }).rejects.toThrow('error de render intern');
  });
});

/* Onada R32.2 · Peixos Daurats (2 × P2, PerfilShell) · rebuigDeCarrega embolica en LazyRouteError QUALSEVOL
   rebuig de l'import(). Un tros que ARRIBA i peta en avaluar-se (TDZ entre trossos, exportació nomenada que
   falta, throw al nivell superior) és un error de codi determinista: el navegador el guarda al mapa de mòduls
   i cap reintent el cura. No pot dir «Revisa la connexió»: puja cru al límit del detall (SlotErrorBoundary),
   que l'anota i el mostra tal com feia el viu 8a6396b66 amb el lazy nu. La fallada de transport continua
   dins del panell, amb reintent real, i ara també deixa rastre («tros», amb el nom del panell). */
describe('Onada R32.2 · un tros que arriba i peta en avaluar-se no es disfressa de fallada de xarxa', () => {
  test.each([
    ['TDZ entre trossos', () => new ReferenceError("Cannot access 'X' before initialization")],
    ['propietat d’undefined al nivell superior', () => new TypeError("Cannot read properties of undefined (reading 'camp')")],
    ['exportació nomenada que falta', () => new SyntaxError("The requested module './x.js' does not provide an export named 'y'")],
  ])('%s: puja cru al límit del detall, que l’anota; cap avís de xarxa ni reintent fútil', async (_cas, causa) => {
    const error = causa();
    let intents = 0;
    const renovable = lazyRouteRenovable(() => { intents += 1; return Promise.reject(error); });

    render(
      <SlotErrorBoundary domini="detall" resetKey="x">
        <PanellDiferitDelPerfil renovable={renovable} on="perfil-prova" />
      </SlotErrorBoundary>,
    );

    expect(await screen.findByText(error.message)).toBeTruthy();
    expect(screen.queryByText('Revisa la connexió i torna-ho a provar.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tornar a provar' })).toBeNull();
    expect(intents).toBe(1);
    expect(incidents()).toEqual([expect.objectContaining({ tipus: 'panell', on: 'detall', accio: 'fallback' })]);
  });

  test('la fallada de transport es queda al panell i deixa un sol rastre «tros» amb el nom del panell per intent', async () => {
    let intents = 0;
    const renovable = lazyRouteRenovable(() => {
      intents += 1;
      return Promise.reject(new TypeError('Failed to fetch dynamically imported module: https://socdepoble.org/assets/x.js'));
    });

    render(
      <SlotErrorBoundary domini="detall" resetKey="x">
        <PanellDiferitDelPerfil renovable={renovable} on="perfil-prova" />
      </SlotErrorBoundary>,
    );

    expect(await screen.findByText('Revisa la connexió i torna-ho a provar.')).toBeTruthy();
    expect(incidents()).toEqual([expect.objectContaining({ tipus: 'tros', on: 'perfil-prova', accio: 'fallback', vegades: 1 })]);

    fireEvent.click(screen.getByRole('button', { name: 'Tornar a provar' }));
    expect(await screen.findByText('Revisa la connexió i torna-ho a provar.')).toBeTruthy();
    await act(async () => { await Promise.resolve(); });
    expect(intents).toBe(2);
    expect(incidents()).toHaveLength(2);
    expect(incidents().every((i) => i.tipus === 'tros' && i.on === 'perfil-prova')).toBe(true);
  });
});

/* Codex R32.2 · G07 · Un altre `renovable` és un altre propietari: el panell nou no hereta la barrera del
   panell que no va arribar (resetKey). Oracle de text: el comú de xarxa, 'error.xarxa'. */
test('R32.2 · canviar d’apartat diferit no conserva la barrera del panell anterior', async () => {
  const falla = lazyRouteRenovable(() => Promise.reject(new TypeError('Failed to fetch dynamically imported module')));
  const arriba = lazyRouteRenovable(() => Promise.resolve({ default: () => <p>un altre apartat viu</p> }));
  const vista = render(<PanellDiferitDelPerfil renovable={falla} />);
  expect(await screen.findByText('Revisa la connexió i torna-ho a provar.')).toBeTruthy();
  vista.rerender(<PanellDiferitDelPerfil renovable={arriba} />);
  expect(await screen.findByText('un altre apartat viu')).toBeTruthy();
  expect(screen.queryByText('Revisa la connexió i torna-ho a provar.')).toBeNull();
});
