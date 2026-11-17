import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import GinySalutDispositiuJarvis from './GinySalutDispositiuJarvis.jsx';
import { IDIOMES_SALUT_DISPOSITIU, TEXTOS_SALUT_DISPOSITIU } from './textosSalutDispositiuJarvis.js';

vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ language: 'ca', t: (_, text) => text }) }));
afterEach(cleanup);
/* R32.3 · El botó d'alliberar només s'oferix amb memòria temporal confirmada: les fixtures que netegen
   porten una categoria purgable confirmada (estat inicial «ready»). Sense productor, cap categoria. */
const PURGABLE = Object.freeze({ id: 'sdp-pwa-recursos-v0', tipus: 'regenerable', bytes: 3, purgable: true, entrades: 1 });
const lectura = (avisos = [], categories = [PURGABLE]) => ({ usage: 10, quota: 100, persistent: null, categories, avisos });
function servei({ dades = lectura(), purga = { estat: 'complet', bytesEliminats: 0, bytesAlliberats: null, entradesEliminades: 0 }, historial } = {}) {
  return {
    lligSalutEmmagatzematgeDispositiu: vi.fn().mockResolvedValue(dades),
    historialNetegesLocals: historial || vi.fn().mockResolvedValue({ registres: [], persistent: false }),
    purgaMemoriaCauRegenerable: vi.fn().mockResolvedValue(purga),
  };
}
async function esperaUi(estat) {
  await waitFor(() => expect(screen.getByTestId('giny-salut-dispositiu-jarvis').dataset.estatUi).toBe(estat));
}
function neteja(idioma = 'ca') { fireEvent.click(screen.getByRole('button', { name: TEXTOS_SALUT_DISPOSITIU[idioma].botoAlliberar })); }

test.each(IDIOMES_SALUT_DISPOSITIU)('R32.2 %s: cap productor en diagnòstic no es presenta com 0 B nets', async (idioma) => {
  const tx = TEXTOS_SALUT_DISPOSITIU[idioma];
  render(<GinySalutDispositiuJarvis idioma={idioma} servei={servei({ dades: lectura(['CAP_PRODUCTOR_REGENERABLE_CONFIRMAT'], []) })} />);
  await esperaUi('partial');
  /* R32.3 · El compartiment diu «0 B confirmats» (sense «no hi ha memòria acumulada») i no inventa una
     detecció de memòries sense verificar que el servei no ha fet; el missatge és el bloqueig. */
  expect(tx.compartimentTemporalNet).toMatch(/^0 B /);
  expect(screen.queryByText(tx.estatBuit)).toBeNull();
  expect(screen.queryByText(tx.compartimentTemporalParcial)).toBeNull();
  expect(screen.getAllByText(tx.estatBloquejat).length).toBeGreaterThan(0);
  expect(screen.getByRole('button', { name: tx.botoAlliberar }).disabled).toBe(true);
});

test('R32.2: el diagnòstic posterior no esborra l’error explícit del rebut', async () => {
  const srv = servei({ purga: { estat: 'fallit', bytesEliminats: 0, bytesAlliberats: null, error: { codi: 'PURGA_FALLIDA' } } });
  render(<GinySalutDispositiuJarvis servei={srv} />);
  await esperaUi('ready'); neteja();
  await waitFor(() => expect(srv.lligSalutEmmagatzematgeDispositiu).toHaveBeenCalledTimes(2));
  await esperaUi('error');
});

test('R32.2: l’historial no disponible no s’inventa com cap neteja anterior', async () => {
  const srv = servei({ historial: vi.fn().mockRejectedValue(new Error('IDB fallida')) });
  render(<GinySalutDispositiuJarvis servei={srv} />);
  await waitFor(() => expect(screen.getByTestId('giny-salut-dispositiu-jarvis').dataset.estatUi).not.toBe('loading'));
  expect(screen.queryByText(TEXTOS_SALUT_DISPOSITIU.ca.historialCap)).toBeNull();
});

test('R32.2: unmount avorta la purga i impedeix reobrir el diagnòstic', async () => {
  let resolPurga;
  const srv = servei();
  srv.purgaMemoriaCauRegenerable.mockImplementation(() => new Promise((resolve) => { resolPurga = resolve; }));
  const vista = render(<GinySalutDispositiuJarvis servei={srv} />);
  await esperaUi('ready'); neteja();
  await waitFor(() => expect(resolPurga).toBeTypeOf('function'));
  const opcions = srv.purgaMemoriaCauRegenerable.mock.calls[0][0];
  vista.unmount();
  await act(async () => { resolPurga({ estat: 'complet', bytesEliminats: 100, bytesAlliberats: null }); });
  expect(srv.lligSalutEmmagatzematgeDispositiu).toHaveBeenCalledTimes(1);
  expect(opcions.signal?.aborted).toBe(true);
});

test('R32.2: canvi de servei descarta un rebut tardà del servei anterior', async () => {
  let resolPurga;
  const antic = servei();
  antic.purgaMemoriaCauRegenerable.mockImplementation(() => new Promise((resolve) => { resolPurga = resolve; }));
  const nou = servei({ dades: lectura(['CAP_PRODUCTOR_REGENERABLE_CONFIRMAT'], []) });
  const vista = render(<GinySalutDispositiuJarvis servei={antic} />);
  await esperaUi('ready'); neteja();
  await waitFor(() => expect(resolPurga).toBeTypeOf('function'));
  vista.rerender(<GinySalutDispositiuJarvis servei={nou} />);
  await act(async () => { resolPurga({ estat: 'complet', bytesEliminats: 100, bytesAlliberats: null }); });
  await esperaUi('partial');
  expect(antic.lligSalutEmmagatzematgeDispositiu).toHaveBeenCalledTimes(1);
});

test.each(['CAP_PRODUCTOR_REGENERABLE_CONFIRMAT', 'NETEJA_ATOMICA_NO_DISPONIBLE'])('R32.2: %s impedeix èxit fins i tot en un rebut inconsistent', async (codi) => {
  render(<GinySalutDispositiuJarvis servei={servei({ purga: { estat: 'complet', bytesEliminats: 100, bytesAlliberats: null, avisos: [codi] } })} />);
  await esperaUi('ready'); neteja(); await esperaUi('partial');
});

test.each(IDIOMES_SALUT_DISPOSITIU)('R32.2 %s: NETEJA_ATOMICA mostra indisponibilitat, no falta de memòria cau', async (idioma) => {
  render(<GinySalutDispositiuJarvis idioma={idioma} servei={servei({ purga: { estat: 'bloquejat', bytesEliminats: 0, bytesAlliberats: null, avisos: ['NETEJA_ATOMICA_NO_DISPONIBLE'] } })} />);
  await esperaUi('ready'); neteja(idioma); await esperaUi('partial');
  expect(screen.getAllByText(TEXTOS_SALUT_DISPOSITIU[idioma].estatNetejaNoDisponible).length).toBeGreaterThan(0);
  expect(screen.queryByText(TEXTOS_SALUT_DISPOSITIU[idioma].estatBloquejat)).toBeNull();
});

test('R32.2: el servei Codex real sense productor retorna bloqueig i bytes físics desconeguts al giny', async () => {
  const { creaServeiSalutEmmagatzematgeDispositiu } = await import('../../data/salutEmmagatzematgeDispositiu.js');
  const srv = creaServeiSalutEmmagatzematgeDispositiu({
    navegador: { storage: { estimate: async () => ({ usage: 10, quota: 100 }) }, locks: { request: (_, __, callback) => callback() } },
    memories: { keys: async () => [] }, origen: 'https://example.test', id: () => 'rebut-r322',
    magatzemHistorial: { totes: async () => [], estatPersistencia: async () => ({ persistent: false }) },
  });
  const purga = vi.spyOn(srv, 'purgaMemoriaCauRegenerable');
  render(<GinySalutDispositiuJarvis servei={srv} />); await esperaUi('partial');
  /* R32.3 · Sense productor el giny no oferix la neteja: el botó està deshabilitat i el clic no arriba al
     servei. El rebut del servei real, cridat directament, continua sent bloqueig honest amb 0 B. */
  expect(screen.getByRole('button', { name: TEXTOS_SALUT_DISPOSITIU.ca.botoAlliberar }).disabled).toBe(true);
  neteja();
  expect(purga).not.toHaveBeenCalled();
  const rebut = await srv.purgaMemoriaCauRegenerable();
  expect(rebut).toMatchObject({ estat: 'bloquejat', bytesEliminats: 0, bytesAlliberats: null });
  expect(rebut.avisos).toContain('CAP_PRODUCTOR_REGENERABLE_CONFIRMAT');
  await esperaUi('partial');
});
