/* QA-R2-04 (Codex, Ronda 2; P1) · Si l'IndexedDB no deixa buidar les
   carpetes recordades en eixir (clear() falla o la base no s'obri), la RAM
   s'invalida igual (no es toca el logout ni la invalidació), però el handle
   durable continua a la base: abans, en tornar a muntar el gestor, la
   carpeta de qui havia eixit s'obria sola (permís 'granted'). Ara l'oblit
   queda pendent: cap muntatge la llista ni l'obri, i el muntatge següent
   torna a provar clear(); quan va bé, la neteja es confirma. El hook a
   soles, amb la biblioteca de veres sobre l'IndexedDB fals estricte. */
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { arbreMultimedia, clonaAmbHandles } from '../../../tests/helpers/carpetaLocalFalsa.js';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
import {
  NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS, creaBibliotecaCarpetesLocals, oblidaTotesLesCarpetesLocals, oblitCarpetesLocalsPendent
} from './bibliotecaCarpetesLocals.js';

const mocks = vi.hoisted(() => ({ sessio: null }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSessioOpcional: () => mocks.sessio }));
import { useGestorArxiusLocals } from './useGestorArxiusLocals.js';

afterEach(() => {
  cleanup();
  mocks.sessio = null;
});

const espera = (ms = 30) => act(async () => { await new Promise((resol) => { setTimeout(resol, ms); }); });
const lectures = (dir) => dir.registre.filter(([op]) => op === 'entries' || op === 'values').length;
const errada = () => new DOMException('perduda', 'UnknownError');

/* La ref de la selecció i l'entorn, estables com els de qui munta el gestor. */
function munta(bib) {
  mocks.sessio = { currentUser: { id: 'u-1' } };
  const seleccioRef = { current: null };
  const onSeleccio = vi.fn();
  const entorn = {};
  return renderHook(() => useGestorArxiusLocals({ magatzemCarpetes: bib, entorn, seleccioRef, onSeleccio }));
}

describe('QA-R2-04 · cap autoobertura mentre l’oblit és pendent', () => {
  test('clear() falla en eixir: la RAM s’invalida, el remuntatge no llista ni obri la carpeta, i el següent confirma la neteja', async () => {
    const idb = creaIdbFalsEstructurat({ clona: clonaAmbHandles });
    const bib = creaBibliotecaCarpetesLocals({ idb });
    const dir = arbreMultimedia();
    expect((await bib.desa(dir)).ok).toBe(true);

    const primer = munta(bib);
    await waitFor(() => expect(primer.result.current.volumObert).toBe(true));
    await espera();

    /* L'eixida: l'oblit i el primer reintent fallen (la base continua plena). */
    idb.errorsEnTransaccio.push(errada(), errada());
    let resultat;
    await act(async () => { resultat = await oblidaTotesLesCarpetesLocals({ idb }); });
    expect(resultat).toEqual({ ok: false, codi: 'OBLIT_CARPETES_PENDENT' });
    expect(primer.result.current.font).toBeNull();
    expect(primer.result.current.volums).toEqual([]);
    primer.unmount();
    expect(idb.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS)).toHaveLength(1);

    /* Remuntatge (la persona següent torna a /multimedia): res de l'anterior. */
    const abans = lectures(dir);
    const segon = munta(bib);
    await waitFor(() => expect(segon.result.current.arrencadaLlesta).toBe(true));
    await espera();
    expect(segon.result.current.volums).toEqual([]);
    expect(segon.result.current.font).toBeNull();
    expect(segon.result.current.estatVolum).toBe('cap');
    expect(lectures(dir)).toBe(abans);
    expect(idb.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS)).toHaveLength(1);
    expect(oblitCarpetesLocalsPendent({ idb })).toBe(true);
    segon.unmount();

    /* La base es recupera: el muntatge següent torna a provar clear() i la marca se'n va. */
    const tercer = munta(bib);
    await waitFor(() => expect(tercer.result.current.arrencadaLlesta).toBe(true));
    await espera();
    expect(idb.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS)).toHaveLength(0);
    expect(oblitCarpetesLocalsPendent({ idb })).toBe(false);
    expect(tercer.result.current.volums).toEqual([]);
    expect(tercer.result.current.font).toBeNull();
    expect(lectures(dir)).toBe(abans);
  });
});
