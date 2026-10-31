/* Onada 11 (261010; prompt 261010_1730, tasca 2) · FacetaEstil: sense la
   capacitat, EstatBuit; amb ella, la llista tancada de tokens, els parells de
   contrast (els baixos bloquegen «Desar»), Previsualitza/Torna al desat
   (aplicaEstil real, recurs <style> en jsdom), Desar amb la versió, els
   errors pel codi, Historial amb Restaurar i Exporta JSON. */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MISSATGE_PERSONALITZACIO } from '../../data/errorsBackend.js';
import { PARELLS_DE_CONTRAST, TOKENS_EDITABLES } from '../../config/estil.js';

const port = vi.hoisted(() => ({ capacitats: new Set(), desa: vi.fn(), historial: vi.fn() }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => port.capacitats.has(cap),
  adminDesaPersonalitzacio: (...a) => port.desa(...a),
  adminHistorialPersonalitzacio: (...a) => port.historial(...a)
}));
const core = vi.hoisted(() => ({ valor: { personalitzacio: null, refresh: vi.fn() } }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => core.valor }));

import { FACETA_ESTIL, FacetaEstil } from './FacetaEstil.jsx';

const COLORS = TOKENS_EDITABLES.filter((t) => t.tipus === 'color').length;
const fulls = () => document.querySelectorAll('style[data-sdp-estil]');
// Decisió del Mestre (30-10-2026) · Les línies esperades es componen: tractor-tokens (T3) les prendria per declaracions.
const decl = (nom, valor) => [nom, valor].join(': ');
const DESAT = { payload: { v: 1, tokens: { '--sdp-radi-s': '12px' }, crom: null }, versio: 2 };

beforeEach(() => {
  port.capacitats = new Set(['personalitzacio']);
  port.desa.mockReset().mockResolvedValue({ clau: 'estil', payload: {}, versio: 1 });
  port.historial.mockReset().mockResolvedValue([]);
  core.valor = { personalitzacio: { taxonomia: null, estil: null }, refresh: vi.fn() };
});
afterEach(() => {
  cleanup();
  fulls().forEach((n) => n.remove());
  vi.restoreAllMocks();
});

const campDe = (etiqueta) => screen.getByLabelText(etiqueta);
const boto = (nom) => screen.getByRole('button', { name: nom });

test('FACETA_ESTIL: id, títol i icona per a qui munta el menú del Tauler', () => {
  expect(FACETA_ESTIL.id).toBe('estil');
  expect(FACETA_ESTIL.titol).toBe('Estil del poble');
  expect(typeof FACETA_ESTIL.icona).toBe('object');
  expect(Object.isFrozen(FACETA_ESTIL)).toBe(true);
});

test('sense la capacitat personalitzacio: estat buit, cap control i cap crida al port', () => {
  port.capacitats = new Set(['admin']);
  render(<FacetaEstil />);
  expect(screen.getByText('Este node no oferix la personalització de l’estil')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Desar' })).toBeNull();
  expect(port.desa).not.toHaveBeenCalled();
  expect(port.historial).not.toHaveBeenCalled();
});

test('amb la capacitat: tots els tokens de la llista (colors i radis), el crom, els parells de contrast i «Desar» actiu amb el cànon', () => {
  render(<FacetaEstil />);
  const regio = screen.getByRole('region', { name: 'Estil del poble' });
  const colors = regio.querySelectorAll('input[type="color"]');
  expect(colors).toHaveLength(COLORS + 1);   // + el color principal del crom
  expect(regio.querySelectorAll('select')).toHaveLength(4);
  for (const t of TOKENS_EDITABLES) expect(screen.getByText(t.nom)).toBeTruthy();   // el nom tècnic, a l'ajuda
  expect(screen.getByLabelText('Radi xicotet').value).toBe('8px');
  expect(campDe('Fons de la targeta').value).toBe('#ffffff');
  const parells = within(screen.getByRole('region', { name: 'Contrast' })).getAllByRole('listitem');
  expect(parells).toHaveLength(PARELLS_DE_CONTRAST.length);
  expect(parells.some((li) => li.className.includes('--baix'))).toBe(false);
  expect(boto('Desar').disabled).toBe(false);
  expect(screen.getByText(/Gir aplicat: 0,?\.?0°/)).toBeTruthy();
  expect(fulls()).toHaveLength(0);   // obrir la faceta no escriu res
});

test('un color de contrast baix es marca en roig i bloqueja «Desar»; «Cànon» el lleva i desbloqueja', () => {
  render(<FacetaEstil />);
  fireEvent.change(campDe('Text de cos'), { target: { value: '#ffffff' } });
  const contrast = screen.getByRole('region', { name: 'Contrast' });
  const baixos = within(contrast).getAllByRole('listitem').filter((li) => li.className.includes('sdp-estil__parell--baix'));
  expect(baixos).toHaveLength(2);   // sobre l'app i sobre la targeta
  expect(baixos[0].textContent).toMatch(/^Text de cos sobre Fons de l’app: \d+,\d\d:1 · insuficient$/);
  expect(within(contrast).getByText('Contrast insuficient')).toBeTruthy();
  expect(boto('Desar').disabled).toBe(true);
  fireEvent.click(boto('Tornar Text de cos al cànon'));
  expect(within(contrast).queryByText('Contrast insuficient')).toBeNull();
  expect(boto('Desar').disabled).toBe(false);
  expect(screen.queryByRole('button', { name: 'Tornar Text de cos al cànon' })).toBeNull();
});

test('un token desat que torna al cànon es jutja contra el cànon, no contra el valor desat que l’arrel encara mostra', () => {
  /* Desat: roca clara amb text fosc (≈17:1). L'arrel ja el porta aplicat (EstilDelPoble),
     així que getComputedStyle torna eixos valors: jsdom no resol custom properties i
     es dona a mà, com a usePullToRefresh.test.js. Hex cru a posta (ALLOW_RAW_COLOR):
     són els valors de tokens.css copiats, com a contrast.test.js i estil.js. */
  const desat = { payload: { v: 1, tokens: { '--sdp-fons-roca': /* ALLOW_RAW_COLOR */ '#f3f0ec', '--sdp-sobre-roca': /* ALLOW_RAW_COLOR */ '#0e0d0c' }, crom: null }, versio: 5 };
  core.valor = { personalitzacio: { taxonomia: null, estil: desat }, refresh: vi.fn() };
  const original = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el, ...resta) => (
    el?.classList?.contains('sdp-root') ? { getPropertyValue: (nom) => desat.payload.tokens[nom] ?? '' } : original(el, ...resta)
  ));
  render(<div className="sdp-root"><FacetaEstil /></div>);
  const contrast = screen.getByRole('region', { name: 'Contrast' });
  const parell = () => within(contrast).getAllByRole('listitem').find((li) => li.textContent.startsWith('Text sobre la roca sobre Roca (barres)'));
  expect(parell().className).toBe('sdp-estil__parell');
  expect(boto('Desar').disabled).toBe(false);
  /* «Cànon» al text: en desar tornarà al blanc canònic sobre la roca clara desada. */
  fireEvent.click(boto('Tornar Text sobre la roca al cànon'));
  expect(parell().className).toBe('sdp-estil__parell sdp-estil__parell--baix');
  expect(parell().textContent).toMatch(/^Text sobre la roca sobre Roca \(barres\): 1,\d\d:1 · insuficient$/);
  expect(within(contrast).getByText('Contrast insuficient')).toBeTruthy();
  expect(boto('Desar').disabled).toBe(true);
  /* «Cànon» també a la roca: el parell torna a ser el canònic i «Desar» es desbloqueja. */
  fireEvent.click(boto('Tornar Roca (barres) al cànon'));
  expect(parell().className).toBe('sdp-estil__parell');
  expect(boto('Desar').disabled).toBe(false);
});

test('Previsualitza aplica l’esborrany a l’arrel i «Torna al que hi ha desat» el lleva quan no hi ha res desat', () => {
  render(<div className="sdp-root"><FacetaEstil /></div>);
  fireEvent.change(campDe('Radi xicotet'), { target: { value: '12px' } });
  expect(fulls()).toHaveLength(0);   // canviar el camp no escriu res fins a previsualitzar
  fireEvent.click(boto('Previsualitza'));
  expect(fulls()).toHaveLength(1);
  expect(fulls()[0].textContent).toContain(`  ${decl('--sdp-radi-s', '12px')};`);
  fireEvent.click(boto('Torna al que hi ha desat'));
  expect(fulls()).toHaveLength(0);
  expect(campDe('Radi xicotet').value).toBe('8px');
});

test('amb estil desat: l’esborrany ix d’ell, «Torna al que hi ha desat» el reaplica i desmuntar la faceta també', () => {
  core.valor = { personalitzacio: { taxonomia: null, estil: DESAT }, refresh: vi.fn() };
  const { unmount } = render(<div className="sdp-root"><FacetaEstil /></div>);
  expect(campDe('Radi xicotet').value).toBe('12px');
  expect(boto('Tornar Radi xicotet al cànon')).toBeTruthy();
  fireEvent.change(campDe('Radi mitjà'), { target: { value: '28px' } });
  fireEvent.click(boto('Previsualitza'));
  expect(fulls()[0].textContent).toContain(decl('--sdp-radi-m', '28px'));
  fireEvent.click(boto('Torna al que hi ha desat'));
  expect(fulls()).toHaveLength(1);
  expect(fulls()[0].textContent).toContain(decl('--sdp-radi-s', '12px'));
  expect(fulls()[0].textContent).not.toContain('--sdp-radi-m');
  fireEvent.change(campDe('Radi mitjà'), { target: { value: '28px' } });
  fireEvent.click(boto('Previsualitza'));
  unmount();
  expect(fulls()).toHaveLength(1);
  expect(fulls()[0].textContent).not.toContain('--sdp-radi-m');
});

test('Desar: adminDesaPersonalitzacio amb clau estil, el payload { v, tokens, crom } i la versió que s’editava; després, avís i refresh', async () => {
  core.valor = { personalitzacio: { taxonomia: null, estil: DESAT }, refresh: vi.fn() };
  port.desa.mockResolvedValue({ clau: 'estil', payload: {}, versio: 3 });
  render(<div className="sdp-root"><FacetaEstil /></div>);
  fireEvent.change(campDe('Fons elevat'), { target: { value: '#ff7300' } });   // fora de cap parell: no toca el contrast
  fireEvent.change(campDe('Radi gran'), { target: { value: '28px' } });
  await act(async () => { fireEvent.click(boto('Desar')); });
  expect(port.desa).toHaveBeenCalledTimes(1);
  expect(port.desa).toHaveBeenCalledWith({
    clau: 'estil',
    payload: { v: 1, tokens: { '--sdp-radi-s': '12px', '--sdp-fons-elevat': '#ff7300', '--sdp-radi-g': '28px' }, crom: null },
    versio: 2
  });
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Estil desat per a tot el poble (versió 3).'));
  expect(core.valor.refresh).toHaveBeenCalledTimes(1);
  expect(fulls()).toHaveLength(1);   // el desat queda aplicat
});

test.each([
  ['cal-segon-factor', MISSATGE_PERSONALITZACIO['cal-segon-factor']],
  ['conflicte-versio', MISSATGE_PERSONALITZACIO['conflicte-versio']],
  ['no-disponible', MISSATGE_PERSONALITZACIO['no-disponible']],
  [undefined, MISSATGE_PERSONALITZACIO.desconegut]
])('Desar amb el codi %s: la frase de MISSATGE_PERSONALITZACIO, sense el text del proveïdor', async (code, frase) => {
  port.desa.mockRejectedValue(Object.assign(new Error('Supabase 403: {"code":"42501"}'), code ? { code } : {}));
  render(<FacetaEstil />);
  await act(async () => { fireEvent.click(boto('Desar')); });
  const alerta = await screen.findByRole('alert');
  expect(alerta.textContent).toContain(frase);
  expect(alerta.textContent).not.toContain('Supabase');
  expect(core.valor.refresh).not.toHaveBeenCalled();
  expect(boto('Desar').disabled).toBe(false);
});

test('Historial: demana les versions de la clau estil i «Restaurar» porta la versió a l’esborrany', async () => {
  port.historial.mockResolvedValue([
    { versio: 2, payload: { v: 1, tokens: { '--sdp-radi-s': '16px' }, crom: { to: 20 } }, creat: '2026-10-10T10:00:00.000Z', autor: 'u1' },
    { versio: 1, payload: { v: 1, tokens: {}, crom: null }, creat: null, autor: null }
  ]);
  render(<FacetaEstil />);
  await act(async () => { fireEvent.click(boto('Historial')); });
  expect(port.historial).toHaveBeenCalledWith('estil');
  const llista = await screen.findByRole('list', { name: 'Versions desades' });
  expect(within(llista).getAllByRole('listitem')).toHaveLength(2);
  expect(within(llista).getAllByRole('listitem')[0].textContent).toContain('Versió 2');
  fireEvent.click(boto('Restaurar la versió 2'));
  expect(campDe('Radi xicotet').value).toBe('16px');
  expect(screen.getByText(/Gir aplicat: 20[,.]0°/)).toBeTruthy();
  expect(screen.getByRole('status').textContent).toContain('Versió 2 carregada a l’esborrany');
  // Plegar
  fireEvent.click(boto('Historial'));
  expect(screen.queryByRole('list', { name: 'Versions desades' })).toBeNull();
});

test('Historial buit: ho diu', async () => {
  render(<FacetaEstil />);
  await act(async () => { fireEvent.click(boto('Historial')); });
  expect(await screen.findByText('Encara no hi ha cap versió desada.')).toBeTruthy();
});

test('Exporta JSON: baixa el payload de l’esborrany com a fitxer JSON', () => {
  const crea = vi.fn(() => 'blob:estil');
  const revoca = vi.fn();
  vi.stubGlobal('URL', Object.assign(Object.create(URL), { createObjectURL: crea, revokeObjectURL: revoca }));
  const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { clic.enllac = this; });
  render(<FacetaEstil />);
  fireEvent.change(campDe('Radi xicotet'), { target: { value: '16px' } });
  fireEvent.click(boto('Exporta JSON'));
  expect(crea).toHaveBeenCalledTimes(1);
  const blob = crea.mock.calls[0][0];
  expect(blob).toBeInstanceOf(Blob);
  expect(blob.type).toBe('application/json');
  expect(clic.enllac.download).toBe('estil-del-poble-v0.json');
  expect(revoca).toHaveBeenCalledWith('blob:estil');
  vi.unstubAllGlobals();
});
