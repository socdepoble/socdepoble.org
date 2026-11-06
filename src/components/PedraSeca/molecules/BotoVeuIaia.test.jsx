/* IDEA-108 (261106) · «🔊 Escolta la IAIA»: botó d'alternança. */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../config/i18n.js';

const mocks = vi.hoisted(() => ({ t: null, language: 'ca', servei: null }));
vi.mock('../../../app/contexts/UIContext', () => ({
  useUIActionsOpcional: () => (mocks.t ? { t: mocks.t } : null),
  useUIStateOpcional: () => ({ language: mocks.language }),
}));
vi.mock('../../../services/veuIaiaService.js', () => ({
  CODI_VEU_AVORTADA: 'VEU_AVORTADA',
  veuDisponible: (o) => mocks.servei.disponible(o),
  parla: (...a) => mocks.servei.parla(...a),
  atura: (...a) => mocks.servei.atura(...a),
}));
import { BotoVeuIaia } from './BotoVeuIaia.jsx';

let alliberaParla;
beforeEach(() => {
  mocks.t = null;
  mocks.language = 'ca';
  alliberaParla = null;
  mocks.servei = {
    disponible: vi.fn(() => true),
    parla: vi.fn(() => new Promise((resolve, reject) => { alliberaParla = { resolve, reject }; })),
    atura: vi.fn(() => { alliberaParla?.reject(Object.assign(new Error('x'), { codi: 'VEU_AVORTADA' })); }),
  };
});
afterEach(cleanup);

/* El servei es carrega amb import(): el botó s'activa quan ha arribat. */
const preparat = async () => {
  const boto = screen.getByRole('button');
  await waitFor(() => expect(mocks.servei.disponible).toHaveBeenCalled());
  await waitFor(() => expect(boto.disabled).toBe(false));
  return boto;
};

describe('BotoVeuIaia', () => {
  test('mostra «🔊 Escolta la IAIA» amb aria-pressed=false', () => {
    render(<BotoVeuIaia text="Hola" />);
    const boto = screen.getByRole('button', { name: 'Escolta la IAIA' });
    expect(boto.getAttribute('aria-pressed')).toBe('false');
  });

  test('en prémer parla en privat per defecte, i en tornar a prémer s’atura', async () => {
    render(<BotoVeuIaia text="Quin és el teu nom?" />);
    const boto = await preparat();
    fireEvent.click(boto);
    expect(mocks.servei.parla).toHaveBeenCalledWith('Quin és el teu nom?', { idioma: 'ca', privat: true });
    await waitFor(() => expect(boto.getAttribute('aria-pressed')).toBe('true'));
    fireEvent.click(boto);
    expect(mocks.servei.atura).toHaveBeenCalled();
    await waitFor(() => expect(boto.getAttribute('aria-pressed')).toBe('false'));
    expect(screen.queryByRole('status')).toBeNull();
  });

  test('en acabar la locució torna a l’estat de repòs', async () => {
    render(<BotoVeuIaia text="Hola" />);
    const boto = await preparat();
    fireEvent.click(boto);
    await waitFor(() => expect(boto.getAttribute('aria-pressed')).toBe('true'));
    await act(async () => { alliberaParla.resolve(); });
    expect(boto.getAttribute('aria-pressed')).toBe('false');
  });

  test('sense veu: botó desactivat amb explicació, i no parla', async () => {
    mocks.servei.disponible = vi.fn(() => false);
    render(<BotoVeuIaia text="Hola" />);
    const boto = screen.getByRole('button');
    expect((await screen.findByRole('status')).textContent).toBe('Este navegador no pot llegir en veu alta.');
    expect(boto.disabled).toBe(true);
    expect(screen.getByRole('status').textContent).toBe('Este navegador no pot llegir en veu alta.');
    fireEvent.click(boto);
    expect(mocks.servei.parla).not.toHaveBeenCalled();
  });

  test('una fallada del servei s’explica sense bloquejar el botó', async () => {
    render(<BotoVeuIaia text="Hola" />);
    fireEvent.click(await preparat());
    await act(async () => { alliberaParla.reject(Object.assign(new Error('x'), { codi: 'ALTRA' })); });
    expect(screen.getByRole('status').textContent).toBe('No s’ha pogut llegir en veu alta. Torna-ho a provar.');
    expect(screen.getByRole('button').disabled).toBe(false);
  });

  test('en desmuntar-se mentre parla, atura la veu', async () => {
    const { unmount } = render(<BotoVeuIaia text="Hola" />);
    fireEvent.click(await preparat());
    unmount();
    expect(mocks.servei.atura).toHaveBeenCalled();
  });

  test('V-02 · si el text canvia mentre parla, la veu calla i el botó torna a repòs', async () => {
    const { rerender } = render(<BotoVeuIaia text="Primer" />);
    const boto = await preparat();
    fireEvent.click(boto);
    await waitFor(() => expect(boto.getAttribute('aria-pressed')).toBe('true'));
    mocks.servei.atura.mockClear();
    rerender(<BotoVeuIaia text="Segon" />);
    expect(mocks.servei.atura).toHaveBeenCalled();
    await waitFor(() => expect(boto.getAttribute('aria-pressed')).toBe('false'));
    expect(screen.queryByRole('status')).toBeNull();
  });

  test('V-02 · si el text canvia en repòs, no s’atura res', async () => {
    const { rerender } = render(<BotoVeuIaia text="Primer" />);
    await preparat();
    rerender(<BotoVeuIaia text="Segon" />);
    expect(mocks.servei.atura).not.toHaveBeenCalled();
  });

  test('V-06 · el botó desactivat apunta amb aria-describedby al missatge, i l’emoji és aria-hidden', async () => {
    mocks.servei.disponible = vi.fn(() => false);
    render(<BotoVeuIaia text="Hola" />);
    const missatge = await screen.findByRole('status');
    const boto = screen.getByRole('button');
    expect(boto.disabled).toBe(true);
    expect(missatge.id).toBeTruthy();
    expect(boto.getAttribute('aria-describedby')).toBe(missatge.id);
    const emoji = boto.querySelector('span[aria-hidden="true"]');
    expect(emoji.textContent).toMatch(/🔊/);
    expect(boto.textContent).toMatch(/Escolta la IAIA/);
  });

  test('segueix l’idioma de la interfície i es tradueix', async () => {
    mocks.t = createTranslator('en');
    mocks.language = 'en';
    render(<BotoVeuIaia text="Hello" />);
    fireEvent.click(await preparat());
    expect(screen.getByRole('button', { name: 'Listen to the IAIA' })).toBeTruthy();
    expect(mocks.servei.parla).toHaveBeenCalledWith('Hello', { idioma: 'en', privat: true });
  });
});
