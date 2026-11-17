import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ProveidorBar, useBar } from './ProveidorBar.jsx';
import { creaMagatzemBar } from '../magatzem.js';
import { obriTorn } from '../nucli/torn.js';

vi.mock('../../plataforma/index.js', () => ({
  useSessioApp: () => ({ potEscriure: true, motiu: 'mode-proves', enLinia: false, modeProves: true, rutaEntrada: '/entra' })
}));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('R32.4: una relectura fallida es veu i bloqueja les mutacions fins a recuperar el disc', async () => {
  const m = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
  await m.carrega();
  await m.obriTorn(obriTorn({ id: 't-r324', fonsInicialCents: 0, ara: '2026-11-16T00:00:00Z' }), [], null);
  let avisa;
  const subscriu = m.base.subscriu;
  vi.spyOn(m.base, 'subscriu').mockImplementation((oient) => {
    avisa = oient;
    return subscriu(oient);
  });
  const carrega = vi.spyOn(m, 'carrega');
  const sonda = { actual: null };
  function Sonda() { sonda.actual = useBar(); return null; }
  render(<ProveidorBar magatzem={m}><Sonda /></ProveidorBar>);
  await waitFor(() => expect(sonda.actual.carregat).toBe(true));
  carrega.mockRejectedValueOnce(Object.assign(new Error('disc de prova'), { codi: 'NO_DISPONIBLE' }));
  await act(async () => { avisa({ tipus: 'canvi', local: false }); });
  await waitFor(() => expect(sonda.actual.errorCarrega).toBe('Les dades del dispositiu han deixat de respondre: recarrega la pàgina abans de continuar.'));
  const abans = await m.base.totes('comandes');
  await act(async () => {
    expect(await sonda.actual.accions.novaComanda({ tipus: 'barra' })).toMatchObject({ ok: false, error: { codi: 'NO_DISPONIBLE' } });
  });
  expect(await m.base.totes('comandes')).toEqual(abans);
  await act(async () => { avisa({ tipus: 'canvi', local: false }); });
  await waitFor(() => expect(sonda.actual.errorCarrega).toBeNull());
  await act(async () => {
    expect(await sonda.actual.accions.novaComanda({ tipus: 'barra' })).toMatchObject({ ok: true });
  });
  expect(await m.base.totes('comandes')).toHaveLength(1);
});
