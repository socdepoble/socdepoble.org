/* QA-A01b al pre-commit (Gauntlet 261029, c1 · precommit-sense-a01b) · En eixir
   de la sessió, el gestor d'arxius locals muntat s'invalida tot sol: /multimedia
   és pública i el proveïdor no es desmunta, i en un ordinador compartit la
   persona següent no ha de vore ni llegir res de l'anterior. La prova completa
   (miniatures blob: revocades, la URL i la portada) és a
   MultimediaSection.espai.test.jsx, a la suite sencera; esta és la lleugera del
   pre-commit: el hook a soles, la sessió doblada i la carpeta local falsa. */
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { arbreMultimedia, creaBibliotecaFalsa } from '../../../tests/helpers/carpetaLocalFalsa.js';
import { oblidaTotesLesCarpetesLocals } from './bibliotecaCarpetesLocals.js';

const mocks = vi.hoisted(() => ({ sessio: null }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSessioOpcional: () => mocks.sessio }));
/* Només pel pes de la importació (la Pedra Seca sencera, uns 0,6 s): el hook en fa servir
   canviaElDisc per a classificar errors d'escriptura, que l'eixida no toca. */
vi.mock('./OperacionsArxiuLocal.jsx', () => ({ canviaElDisc: () => false }));
import { useGestorArxiusLocals } from './useGestorArxiusLocals.js';

afterEach(() => {
  /* Sense globals, Testing Library no desmunta sola: cap gestor d'una prova escolta l'oblit de la següent. */
  cleanup();
  mocks.sessio = null;
});

/* Un volum recordat amb permís concedit: el gestor l'obri sol en muntar-se. */
async function muntaAmbVolum(seleccio = { carpeta: '00_inbox', ruta: null }) {
  mocks.sessio = { currentUser: { id: 'u-1' } };
  const bib = creaBibliotecaFalsa([{ id: 'v1', handle: arbreMultimedia() }]);
  const onSeleccio = vi.fn();
  const seleccioRef = { current: seleccio };
  const vista = renderHook(() => useGestorArxiusLocals({ magatzemCarpetes: bib, entorn: {}, seleccioRef, onSeleccio }));
  await waitFor(() => expect(vista.result.current.volumObert).toBe(true));
  expect(vista.result.current.entrades.length).toBeGreaterThan(0);
  return { ...vista, bib, onSeleccio };
}

/* El gestor invalidat: cap font (la de l'anterior ja no llig res del disc), cap entrada, cap volum actiu i la portada. */
async function expectInvalidat({ result, onSeleccio }, fontAbans) {
  expect(result.current.font).toBeNull();
  expect(result.current.volumObert).toBe(false);
  expect(result.current.entrades).toEqual([]);
  expect(result.current.volumActiu).toBeNull();
  expect(result.current.estatVolum).toBe('cap');
  expect(onSeleccio).toHaveBeenLastCalledWith({ portada: true });
  expect(fontAbans.handle).toBeNull();
  await expect(fontAbans.llista()).rejects.toMatchObject({ codi: 'FONT_OBLIDADA' });
}

describe('QA-A01b · el gestor no sobreviu a qui l’ha obert', () => {
  test('eixida de veres (currentUser a null i l’oblit de DESPRES_DE_TANCAR): el gestor s’invalida i no torna a obrir res', async () => {
    const vista = await muntaAmbVolum();
    const fontAbans = vista.result.current.font;
    expect(fontAbans.handle).not.toBeNull();

    mocks.sessio = { currentUser: null };
    vista.rerender();
    /* DESPRES_DE_TANCAR: la biblioteca del perfil, buidada, i l'avís de l'oblit. */
    await vista.bib.oblidaTotes();
    await act(async () => {
      await oblidaTotesLesCarpetesLocals({ idb: null });
    });

    await expectInvalidat(vista, fontAbans);
    expect(vista.result.current.volums).toEqual([]);
  });

  test('entra una altra persona (u-1 → u-2): el gestor s’invalida i la biblioteca es torna a llegir sense obrir cap volum', async () => {
    const vista = await muntaAmbVolum();
    const fontAbans = vista.result.current.font;

    mocks.sessio = { currentUser: { id: 'u-2' } };
    vista.rerender();

    await expectInvalidat(vista, fontAbans);
    await waitFor(() => expect(vista.bib.crides.filter(([m]) => m === 'llista')).toHaveLength(2));
    await waitFor(() => expect(vista.result.current.volums.map((v) => v.id)).toEqual(['v1']));
    expect(vista.result.current.estatVolum).toBe('cap');
    expect(vista.result.current.font).toBeNull();
  });

  test('una renovació del JWT (el mateix id) no toca res', async () => {
    const { result, rerender, onSeleccio } = await muntaAmbVolum();
    const fontAbans = result.current.font;
    mocks.sessio = { currentUser: { id: 'u-1', renovat: true } };
    rerender();
    expect(result.current.font).toBe(fontAbans);
    expect(result.current.volumObert).toBe(true);
    expect(fontAbans.handle).not.toBeNull();
    expect(onSeleccio).not.toHaveBeenCalled();
  });
});
