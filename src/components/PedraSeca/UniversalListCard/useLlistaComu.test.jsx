/* Fase E (261020, tasca 2; pla 261020_2045) · useLlistaComu: el toc es pinta
   de seguida; la llista pintada és sempre la confirmada més els tocs en vol;
   la resposta del servidor mana; un rebuig no deixa cap toc fantasma; la
   guarda anti-eco no deixa que el ressò del propi toc ni una revisió vella
   tornen a pintar; i una altra llista (o cap) reinicia la vista.
   Revisió adversarial 261020: H1 (resposta amb la mateixa revisió), H2 (dos
   tocs rebutjats), H3 (llista que arriba tard), H4 (una altra llista) i la
   fitxa privada que es quedava pintada. */
import { act, renderHook } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { useLlistaComu } from './useLlistaComu.js';

const ARA = '2026-10-20T19:00:00.000Z';
const ANNA = { id: 'u-anna', nom: 'Anna' };
const rellotge = () => new Date(ARA);
const ids = () => {
  let n = 0;
  return () => `id-${(n += 1)}`;
};
const LLISTA = Object.freeze({ id: 'l1', mode: 'rebost', titol: 'Compra', propietariId: ANNA.id, revisio: 4, elementsComu: [] });
const opcions = (extra = {}) => ({ actor: ANNA, rellotge, generaId: ids(), ...extra });
const noms = (resultat) => resultat.current.llista.elementsComu.map((e) => e.nom);

/** Un onMuta que es queda en vol fins que la prova el resol o el rebutja, un per toc. */
function portEnVol() {
  const crides = [];
  const onMuta = vi.fn((canvi) => new Promise((resol, rebutja) => crides.push({ canvi, resol, rebutja })));
  return { onMuta, crides };
}

describe('useLlistaComu', () => {
  test('optimista: el toc puja la revisió i porta la marca de la instància', () => {
    const { result } = renderHook(() => useLlistaComu(LLISTA, opcions()));
    expect(result.current.clientInstanceId).toBe('id-1');
    act(() => { result.current.fes({ tipus: 'afegeix', entrada: { text: '2 kg de tomaca' } }); });
    expect(result.current.llista.revisio).toBe(5);
    expect(result.current.llista.darrerClientInstanceId).toBe('id-1');
    expect(result.current.resum.progres).toEqual({ fets: 0, total: 1 });
  });

  test('un error del nucli no toca la llista i es queda a `error` fins que es neteja', () => {
    const { result } = renderHook(() => useLlistaComu(LLISTA, opcions()));
    act(() => { result.current.fes({ tipus: 'commuta', elementId: 'no-hi-és' }); });
    expect(result.current.error).toEqual({ codi: 'element-absent' });
    expect(result.current.llista.revisio).toBe(4);
    act(() => { result.current.netejaError(); });
    expect(result.current.error).toBeNull();
  });

  test('la resposta del servidor mana, també amb la mateixa revisió i el nostre clientInstanceId (H1)', async () => {
    const { onMuta, crides } = portEnVol();
    const { result } = renderHook(() => useLlistaComu(LLISTA, opcions({ onMuta })));
    await act(async () => { result.current.fes({ tipus: 'afegeix', entrada: { text: 'Pa' } }); });
    expect(crides[0].canvi).toMatchObject({ revisioBase: 4, clientInstanceId: 'id-1', accio: { tipus: 'afegeix', entrada: { text: 'Pa' } } });
    const servidor = { ...LLISTA, revisio: 5, darrerClientInstanceId: 'id-1', elementsComu: [{ ...crides[0].canvi.llista.elementsComu[0], id: 'uuid-del-servidor' }] };
    await act(async () => { crides[0].resol(servidor); });
    expect(result.current.llista.elementsComu.map((e) => e.id)).toEqual(['uuid-del-servidor']);
    expect(result.current.llista.revisio).toBe(5);
  });

  test('dos tocs en vol rebutjats: la llista torna a la confirmada, sense cap toc fantasma (H2)', async () => {
    const { onMuta, crides } = portEnVol();
    const { result, rerender } = renderHook(({ l }) => useLlistaComu(l, opcions({ onMuta })), { initialProps: { l: LLISTA } });
    await act(async () => { result.current.fes({ tipus: 'afegeix', entrada: { text: 'Pa' } }); });
    await act(async () => { result.current.fes({ tipus: 'afegeix', entrada: { text: 'Llet' } }); });
    expect(noms(result)).toEqual(['Pa', 'Llet']);
    await act(async () => { crides[0].rebutja({ codi: 'ple' }); });
    expect(noms(result)).toEqual(['Llet']);
    await act(async () => { crides[1].rebutja({ codi: 'ple' }); });
    expect(noms(result)).toEqual([]);
    expect(result.current.llista.revisio).toBe(4);
    expect(result.current.error).toEqual({ codi: 'ple' });
    /* La relectura del servidor en la mateixa revisió no s'ignora: no hi ha cap revisió optimista per davant. */
    rerender({ l: { ...LLISTA, titol: 'Compra (servidor)' } });
    expect(result.current.llista.titol).toBe('Compra (servidor)');
  });

  test('el primer toc falla i el segon s’accepta: mana la instantània del servidor', async () => {
    const { onMuta, crides } = portEnVol();
    const { result } = renderHook(() => useLlistaComu(LLISTA, opcions({ onMuta })));
    await act(async () => { result.current.fes({ tipus: 'afegeix', entrada: { text: 'Pa' } }); });
    await act(async () => { result.current.fes({ tipus: 'afegeix', entrada: { text: 'Llet' } }); });
    await act(async () => { crides[0].rebutja({ codi: 'ple' }); });
    const servidor = { ...LLISTA, revisio: 6, darrerClientInstanceId: 'id-1', elementsComu: [{ id: 'f', nom: 'Formatge', capaMode: { estat: 'falta', especificacio: '', demanatPer: [], compratPer: null } }, { id: 'll', nom: 'Llet', capaMode: { estat: 'falta', especificacio: '', demanatPer: [], compratPer: null } }] };
    await act(async () => { crides[1].resol(servidor); });
    expect(noms(result)).toEqual(['Formatge', 'Llet']);
    expect(result.current.llista.revisio).toBe(6);
  });

  test('acceptat sense instantània: el toc passa a la base i un rebuig posterior no l’esborra', async () => {
    const { onMuta, crides } = portEnVol();
    const { result } = renderHook(() => useLlistaComu(LLISTA, opcions({ onMuta })));
    await act(async () => { result.current.fes({ tipus: 'afegeix', entrada: { text: 'Pa' } }); });
    await act(async () => { result.current.fes({ tipus: 'afegeix', entrada: { text: 'Llet' } }); });
    await act(async () => { crides[0].resol(undefined); });
    await act(async () => { crides[1].rebutja(new Error('xarxa')); });
    expect(noms(result)).toEqual(['Pa']);
    expect(result.current.error).toEqual({ codi: 'desconegut' });
  });

  test('la guarda anti-eco: amb un toc en vol, ni el ressò propi ni una revisió vella; la d’un altre, sí', async () => {
    const { onMuta } = portEnVol();
    const { result, rerender } = renderHook(({ l }) => useLlistaComu(l, opcions({ onMuta })), { initialProps: { l: LLISTA } });
    await act(async () => { result.current.fes({ tipus: 'afegeix', entrada: { text: 'Pa' } }); });
    const local = result.current.llista;
    rerender({ l: { ...LLISTA, revisio: 5, elementsComu: [], darrerClientInstanceId: 'id-1' } });
    expect(result.current.llista).toBe(local);
    rerender({ l: { ...LLISTA, revisio: 3 } });
    expect(result.current.llista).toBe(local);
    act(() => { result.current.rebutRemot({ ...LLISTA, revisio: 5, titol: 'D’un altre', darrerClientInstanceId: 'id-altre' }); });
    expect(result.current.llista.titol).toBe('D’un altre');
    /* El toc en vol s'hi torna a aplicar damunt. */
    expect(noms(result)).toEqual(['Pa']);
    expect(result.current.llista.revisio).toBe(6);
  });

  test('una altra llista per la prop reinicia la vista; el canal en viu no la canvia (H4)', async () => {
    const { onMuta, crides } = portEnVol();
    const B = { ...LLISTA, id: 'l2', titol: 'Una altra', revisio: 2 };
    const { result, rerender } = renderHook(({ l }) => useLlistaComu(l, opcions({ onMuta })), { initialProps: { l: { ...LLISTA, revisio: 7 } } });
    await act(async () => { result.current.fes({ tipus: 'afegeix', entrada: { text: 'Pa' } }); });
    act(() => { result.current.rebutRemot(B); });
    expect(result.current.llista.id).toBe('l1');
    rerender({ l: B });
    expect(result.current.llista).toMatchObject({ id: 'l2', titol: 'Una altra', revisio: 2, elementsComu: [] });
    /* La resposta tardana del toc a la llista d'abans no toca la nova. */
    await act(async () => { crides[0].resol({ ...LLISTA, revisio: 8 }); });
    expect(result.current.llista.id).toBe('l2');
  });

  test('una llista que no té la forma neutra: cap estat, «llista-invalida», i l’alerta se’n va quan arriba la bona (H3)', () => {
    const { result, rerender } = renderHook(({ l }) => useLlistaComu(l, opcions()), { initialProps: { l: null } });
    expect(result.current.llista).toBeNull();
    expect(result.current.error).toEqual({ codi: 'llista-invalida' });
    let resultat;
    act(() => { resultat = result.current.fes({ tipus: 'afegeix', entrada: { text: 'Pa' } }); });
    expect(resultat).toEqual({ ok: false, error: { codi: 'llista-invalida' } });
    rerender({ l: LLISTA });
    expect(result.current.llista.id).toBe('l1');
    expect(result.current.error).toBeNull();
  });

  test('si la llista desapareix (o arriba trencada), res de l’anterior es continua pintant', () => {
    const { result, rerender } = renderHook(({ l }) => useLlistaComu(l, opcions()), { initialProps: { l: LLISTA } });
    rerender({ l: { mode: 'rebost' } });
    expect(result.current.llista).toBeNull();
    expect(result.current.error).toEqual({ codi: 'llista-invalida' });
  });
});
