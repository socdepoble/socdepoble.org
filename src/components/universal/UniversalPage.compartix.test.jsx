/**
 * Plaça, canvi 6 (261124, v1.2.24) · «Compartir» de la barra de la Pàgina
 * Universal sempre respon. Si el menú del telèfon falla amb un error que no és
 * tancar-lo (AbortError), copia l'enllaç i ho diu; si el porta-retalls tampoc
 * pot, o no n'hi ha, l'avís porta l'enllaç sencer i diu com copiar-lo a mà.
 * Tancar el menú no és cap error: ni còpia ni avís. És el mateix camí que
 * compartix (PedraSeca/hooks/useAccions.js), que la barra ara reutilitza.
 * navigator.share i navigator.clipboard són simulats; el router és el de veres.
 * Revisió adversarial (261124) · L'avís dels avisos és el de veres
 * (NotificationProvider i AvisadorEfimer): l'espia només apunta les crides.
 */
import { act, render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('./NotificationContext.jsx', async (importOriginal) => {
  const real = await importOriginal();
  const { useCallback } = await import('react');
  return {
    ...real,
    useToast: () => {
      const { showToast } = real.useToast();
      const espia = useCallback((...args) => { mocks.toast(...args); showToast(...args); }, [showToast]);
      return { showToast: espia };
    }
  };
});

import { BrowserRouter } from '../../app/contexts/RouterContext';
import { NotificationProvider } from './NotificationContext.jsx';
import { UniversalPage } from './UniversalPage.jsx';

const botoCompartir = (container) => container.querySelector('header.bar-blue [aria-label="Compartir"]');
const error = (name) => Object.assign(new Error(name), { name });
const AVIS_COPIAT = 'Enllaç copiat al porta-retalls.';
const avisSenseCopiar = (url) => `No s'ha pogut copiar l'enllaç. Mantín-lo premut per a copiar-lo: ${url}`;
/* Revisió adversarial (261124) · L'avís que demana copiar l'enllaç a mà dura
   15 s: llegir-lo, mantindre el dit damunt i triar «Copia» no cap en 6. */
const DURADA_SENSE_COPIAR = 15000;

let errorDeConsola;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_CANONICAL_URL', '');
  window.history.replaceState(null, '', '/mur/publicacio-3');
  errorDeConsola = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  delete window.navigator.share;
  delete window.navigator.clipboard;
  errorDeConsola.mockRestore();
  vi.unstubAllEnvs();
});

function simula({ share, clipboard }) {
  if (share !== undefined) Object.defineProperty(window.navigator, 'share', { value: share, configurable: true });
  if (clipboard !== undefined) Object.defineProperty(window.navigator, 'clipboard', { value: clipboard, configurable: true });
}

function tocaCompartir() {
  const { container } = render(
    <NotificationProvider>
      <BrowserRouter><UniversalPage chrome="context" title="Còpies de seguretat" /></BrowserRouter>
    </NotificationProvider>
  );
  fireEvent.click(botoCompartir(container));
  return container;
}

describe('Compartir de la barra sempre respon', () => {
  test('el menú del telèfon el rebutja (NotAllowedError): copia l’enllaç i diu «Enllaç copiat»', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    const share = vi.fn(() => Promise.reject(error('NotAllowedError')));
    simula({ share, clipboard: { writeText } });
    tocaCompartir();
    expect(share).toHaveBeenCalledWith({ title: 'Còpies de seguretat', url: window.location.href });
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(AVIS_COPIAT));
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(mocks.toast).toHaveBeenCalledTimes(1);
    expect(errorDeConsola).not.toHaveBeenCalled();
  });

  test('el menú falla i el porta-retalls també: l’avís porta l’enllaç i diu com copiar-lo', async () => {
    const writeText = vi.fn(() => Promise.reject(error('NotAllowedError')));
    simula({ share: vi.fn(() => Promise.reject(error('NotAllowedError'))), clipboard: { writeText } });
    tocaCompartir();
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(avisSenseCopiar(window.location.href), DURADA_SENSE_COPIAR));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(mocks.toast).toHaveBeenCalledTimes(1);
  });

  test('el menú falla i no hi ha porta-retalls: l’avís porta l’enllaç', async () => {
    simula({ share: vi.fn(() => Promise.reject(error('NotAllowedError'))) });
    tocaCompartir();
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(avisSenseCopiar(window.location.href), DURADA_SENSE_COPIAR));
  });

  test('sense menú del telèfon i amb el porta-retalls que refusa: l’avís porta l’enllaç', async () => {
    simula({ clipboard: { writeText: vi.fn(() => Promise.reject(error('NotAllowedError'))) } });
    tocaCompartir();
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(avisSenseCopiar(window.location.href), DURADA_SENSE_COPIAR));
    expect(errorDeConsola).not.toHaveBeenCalled();
  });

  test('sense menú del telèfon ni porta-retalls: l’avís porta l’enllaç (abans, una excepció muda)', async () => {
    tocaCompartir();
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(avisSenseCopiar(window.location.href), DURADA_SENSE_COPIAR));
  });

  test('sense menú del telèfon, amb porta-retalls: copia i diu «Enllaç copiat»', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    simula({ clipboard: { writeText } });
    tocaCompartir();
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(AVIS_COPIAT));
    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });

  test('tancar el menú (AbortError) no és cap error: ni còpia, ni avís, ni consola', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    const share = vi.fn(() => Promise.reject(error('AbortError')));
    simula({ share, clipboard: { writeText } });
    tocaCompartir();
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    await new Promise((resolt) => setTimeout(resolt, 0));
    expect(writeText).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(errorDeConsola).not.toHaveBeenCalled();
  });

  test('el menú del telèfon comparteix: ni còpia ni avís', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    const share = vi.fn(() => Promise.resolve());
    simula({ share, clipboard: { writeText } });
    tocaCompartir();
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    await new Promise((resolt) => setTimeout(resolt, 0));
    expect(writeText).not.toHaveBeenCalled();
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  /* Revisió adversarial (261124) · De punta a punta, amb l'avís de veres:
     l'avís que porta l'enllaç continua a la pantalla als 14,999 s i se'n va
     als 15 s. Amb 6 s, la persona no arribava a copiar-lo a mà. */
  test('l’avís que porta l’enllaç es queda 15 segons a la pantalla', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      simula({
        share: vi.fn(() => Promise.reject(error('NotAllowedError'))),
        clipboard: { writeText: vi.fn(() => Promise.reject(error('NotAllowedError'))) }
      });
      const container = tocaCompartir();
      // compartix només espera promeses: n'hi ha prou de buidar la cua de microtasques.
      for (let volta = 0; volta < 5; volta += 1) {
        await act(async () => { await Promise.resolve(); });
      }
      const avis = () => container.querySelector('.sdp-avisador-efimer');
      expect(avis()?.textContent).toBe(avisSenseCopiar(window.location.href));
      act(() => { vi.advanceTimersByTime(DURADA_SENSE_COPIAR - 1); });
      expect(avis()?.textContent).toBe(avisSenseCopiar(window.location.href));
      act(() => { vi.advanceTimersByTime(1); });
      expect(avis()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
