import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ProveidorBar, useBar } from './ProveidorBar.jsx';
import { creaMagatzemBar } from '../magatzem.js';
import { llavorCarta } from '../nucli/llavor.js';
import { obriTorn } from '../nucli/torn.js';

vi.mock('../../plataforma/index.js', () => ({
  useSessioApp: () => ({ potEscriure: true, motiu: 'mode-proves', enLinia: false, modeProves: true, rutaEntrada: '/entra' })
}));
const ARA = '2026-11-16T00:00:00.000Z';
const oberts = [];
function magatzemNou() {
  const m = creaMagatzemBar({ idb: null, navegador: {}, Canal: null });
  oberts.push(m);
  return m;
}
afterEach(() => {
  cleanup();
  for (const m of oberts.splice(0)) m.base.tanca();
  vi.restoreAllMocks();
});

test('R32.4: una restauració confirmada amb reread fallida no deixa sobreescriure el disc amb la carta antiga; una lectura bona recupera', async () => {
  const origen = magatzemNou();
  await origen.carrega();
  const carta = llavorCarta();
  carta.productes[0].nom = 'Carta restaurada';
  await origen.desaCarta(carta);
  await origen.obriTorn(obriTorn({ id: 't-restore', fonsInicialCents: 0, ara: ARA }), [], null);
  const copia = await origen.exportaCopia(new Date(ARA));
  const desti = magatzemNou();
  let avisa;
  const subscriu = desti.base.subscriu;
  vi.spyOn(desti.base, 'subscriu').mockImplementation((oient) => {
    avisa = oient;
    return subscriu(oient);
  });
  const sonda = { actual: null };
  function Sonda() { sonda.actual = useBar(); return null; }
  render(<ProveidorBar magatzem={desti}><Sonda /></ProveidorBar>);
  await waitFor(() => expect(sonda.actual.carregat).toBe(true));
  const antiga = sonda.actual.carta;
  vi.spyOn(desti, 'carrega').mockRejectedValueOnce(Object.assign(new Error('lectura de prova'), { codi: 'NO_DISPONIBLE' }));
  await act(async () => {
    expect(await sonda.actual.accions.restauraCopia(copia)).toMatchObject({ ok: false, error: { codi: 'NO_DISPONIBLE' } });
  });
  expect((await desti.base.obte('cataleg', 'carta')).productes[0].nom).toBe('Carta restaurada');
  expect(sonda.actual.errorCarrega).toBeTruthy();
  await act(async () => {
    expect(await sonda.actual.accions.desaCarta(antiga)).toMatchObject({ ok: false, error: { codi: 'NO_DISPONIBLE' } });
  });
  expect((await desti.base.obte('cataleg', 'carta')).productes[0].nom).toBe('Carta restaurada');
  await act(async () => { avisa({ tipus: 'canvi', local: false }); });
  await waitFor(() => expect(sonda.actual.errorCarrega).toBeNull());
  expect(sonda.actual.carta.productes[0].nom).toBe('Carta restaurada');
  await act(async () => {
    expect(await sonda.actual.accions.desaCarta(sonda.actual.carta)).toMatchObject({ ok: true });
  });
  expect((await desti.base.obte('cataleg', 'carta')).productes[0].nom).toBe('Carta restaurada');
});

test('R32.4: rebutjar una còpia abans del commit conserva la lectura vàlida', async () => {
  const m = magatzemNou();
  const sonda = { actual: null };
  function Sonda() { sonda.actual = useBar(); return null; }
  render(<ProveidorBar magatzem={m}><Sonda /></ProveidorBar>);
  await waitFor(() => expect(sonda.actual.carregat).toBe(true));
  await act(async () => {
    expect((await sonda.actual.accions.restauraCopia('{}')).ok).toBe(false);
  });
  expect(sonda.actual.errorCarrega).toBeNull();
  await act(async () => {
    expect(await sonda.actual.accions.desaCarta(sonda.actual.carta)).toMatchObject({ ok: true });
  });
});
