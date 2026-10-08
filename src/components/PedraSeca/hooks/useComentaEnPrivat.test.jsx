/**
 * Ordre del Mestre (261007) · useComentaEnPrivat: la via «En privat» de
 * Comentar, ara una peça pròpia que també fa servir la fila d'ajuda per
 * defecte del Xat (sections/xat/useObriXatPerDefecte.js). Sense opcions,
 * la navegació de sempre (un sol argument); amb opcions, les passa a
 * navigate, també quan el xat arriba després de resoldre's.
 */
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));
vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));

import { useComentaEnPrivat } from './useAccions.js';
import { XAT_SOCDEPOBLE_DE_LLAVOR, XatSocDePobleContext } from './xatSocDePoble.js';

const UUID = '7d1f4c2e-9a3b-4c5d-8e6f-0a1b2c3d4e5f';
const ambXat = (valor) => renderHook(() => useComentaEnPrivat(), {
  wrapper: ({ children }) => <XatSocDePobleContext.Provider value={valor}>{children}</XatSocDePobleContext.Provider>
});

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/xat/sdp-per-defecte%3Asocdepoble');
});

describe('261007 · useComentaEnPrivat', () => {
  test('sense proveïdor, el xat de la llavor; sense opcions, navigate amb un sol argument', () => {
    const { result } = renderHook(() => useComentaEnPrivat());
    result.current();
    expect(mocks.navigate.mock.calls).toEqual([[XAT_SOCDEPOBLE_DE_LLAVOR.href]]);
  });

  test('amb opcions (la fila del xat), navigate les rep: la ruta de pas no queda a l’historial', () => {
    const { result } = ambXat({ estat: 'remot', href: `/xat?amb=${UUID}`, avis: null });
    result.current({ replace: true });
    expect(mocks.navigate.mock.calls).toEqual([[`/xat?amb=${UUID}`, { replace: true }]]);
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  test('encara sense resoldre: l’avís, una resolució i, quan arriba, la navegació amb les mateixes opcions', async () => {
    const resol = vi.fn(() => Promise.resolve({ estat: 'remot', href: `/xat?amb=${UUID}`, avis: null }));
    const { result } = ambXat({ estat: 'pendent', href: null, avis: 'Encara es busca.', resol });
    result.current({ replace: true });
    expect(mocks.toast).toHaveBeenCalledWith('Encara es busca.');
    expect(resol).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith(`/xat?amb=${UUID}`, { replace: true }));
  });

  test('sense xat on portar ni res a resoldre: només l’avís, cap navegació', () => {
    const { result } = ambXat({ estat: 'absent', href: null, avis: 'No disponible.', resol: null });
    result.current({ replace: true });
    expect(mocks.toast).toHaveBeenCalledWith('No disponible.');
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
