import { useRef } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { BarraReproductorVeu } from './BarraReproductorVeu.jsx';
import * as servei from '../../../services/veuIaiaService.js';

let audios, fetchFals, synth, enunciats;
const PUNT = 'https://veu.test/tts';
const audioResposta = () => ({ ok: true, headers: new Headers({ 'content-type': 'audio/wav' }), blob: async () => new Blob(['audio'], { type: 'audio/wav' }) });
const diferit = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };
function Pagina({ idioma = 'ca', privat = false, oberta = true, onTanca = () => {} }) {
  const cosRef = useRef(null);
  return <div className="sdp-root">
    <article ref={cosRef}><h2>Primer títol</h2><p>Segon paràgraf</p><p>Tercer paràgraf</p><p>Quart paràgraf</p></article>
    <BarraReproductorVeu oberta={oberta} cosRef={cosRef} idioma={idioma} privat={privat} onTanca={onTanca} />
  </div>;
}
beforeEach(() => {
  servei.reiniciaVeuPerProves(); servei.fixaPuntNode0(PUNT);
  audios = []; enunciats = [];
  synth = { speaking: false, pending: false, getVoices: () => [{ lang: 'ca-ES' }, { lang: 'es-ES' }],
    speak: vi.fn((u) => enunciats.push(u)), cancel: vi.fn(() => { synth.speaking = false; synth.pending = false; }) };
  window.speechSynthesis = synth;
  window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  vi.stubGlobal('Audio', class extends EventTarget {
    constructor() { super(); this.src = ''; this.pause = vi.fn(); this.load = vi.fn(); audios.push(this); }
    play() { return Promise.resolve(); }
    removeAttribute(nom) { if (nom === 'src') this.src = ''; }
    inicia() { this.dispatchEvent(new Event('playing')); }
    acaba() { this.dispatchEvent(new Event('ended')); }
  });
  URL.createObjectURL = vi.fn(() => `blob:${URL.createObjectURL.mock.calls.length}`); URL.revokeObjectURL = vi.fn();
  fetchFals = vi.fn(async (_url, o) => o.method === 'GET' ? { ok: true } : audioResposta()); vi.stubGlobal('fetch', fetchFals);
});
afterEach(() => {
  cleanup(); servei.reiniciaVeuPerProves(); vi.unstubAllGlobals(); vi.restoreAllMocks();
  delete window.speechSynthesis; delete window.SpeechSynthesisUtterance;
});
const posts = () => fetchFals.mock.calls.filter(([, o]) => o.method === 'POST').map(([, o]) => JSON.parse(o.body));

test('onstart real dispara lookahead i+1/i+2; cap avanç de ressaltat mentre només es prepara', async () => {
  const vista = render(<Pagina />);
  await waitFor(() => expect(audios).toHaveLength(1));
  expect(posts().map((p) => p.text)).toEqual(['Primer títol.']);
  act(() => audios[0].inicia());
  await waitFor(() => expect(posts()).toHaveLength(3));
  expect(posts().map((p) => p.text)).toEqual(['Primer títol.', 'Segon paràgraf.', 'Tercer paràgraf.']);
  expect(screen.getByText('Bloc 1 de 4')).toBeTruthy();
  expect(vista.container.querySelector('h2').classList.contains('sdp-veu-bloc-actiu')).toBe(true);
  await act(async () => audios[0].acaba());
  await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(2));
  expect(audios).toHaveLength(1); expect(screen.getByText('Bloc 1 de 4')).toBeTruthy();
  act(() => audios[0].inicia());
  await waitFor(() => expect(screen.getByText('Bloc 2 de 4')).toBeTruthy());
  await waitFor(() => expect(posts()).toHaveLength(4));
  expect(posts().filter((p) => p.text === 'Segon paràgraf.')).toHaveLength(1);
  vista.unmount();
  expect(URL.revokeObjectURL.mock.calls.map(([url]) => url).sort()).toEqual(['blob:1', 'blob:2']);
});

test('la cua nativa té un bloc anticipat i només onstart canvia el bloc visible; naturalend no cancel·la', async () => {
  render(<Pagina privat />);
  await waitFor(() => expect(enunciats).toHaveLength(2));
  expect(fetchFals).not.toHaveBeenCalled(); expect(synth.cancel).not.toHaveBeenCalled();
  expect(screen.getByText('Bloc 1 de 4')).toBeTruthy();
  act(() => { synth.speaking = true; enunciats[0].onstart(); });
  await act(async () => { synth.speaking = false; enunciats[0].onend(); });
  await waitFor(() => expect(enunciats).toHaveLength(3));
  expect(screen.getByText('Bloc 1 de 4')).toBeTruthy();
  act(() => { synth.speaking = true; enunciats[1].onstart(); });
  expect(screen.getByText('Bloc 2 de 4')).toBeTruthy();
  expect(synth.cancel).not.toHaveBeenCalled();
});

test('saltar a un altre bloc elimina els futurs antics i no deixa que els seus onstart tardans facen avançar la barra', async () => {
  render(<Pagina privat />);
  await waitFor(() => expect(enunciats).toHaveLength(2));
  const iniciVell = enunciats[1].onstart;
  act(() => enunciats[0].onstart());
  fireEvent.click(screen.getByRole('button', { name: 'Apartats i cerca al text' }));
  fireEvent.click(screen.getByRole('button', { name: /4\s*Quart paràgraf/ }));
  await waitFor(() => expect(enunciats).toHaveLength(3));
  expect(synth.cancel).toHaveBeenCalledOnce();
  act(() => iniciVell());
  expect(screen.getByText('Bloc 4 de 4')).toBeTruthy();
  act(() => enunciats[2].onstart());
  expect(screen.getByText('Bloc 4 de 4')).toBeTruthy();
});

test('idioma i veu invaliden la sessió; el resultat antic que ignore abort no pot iniciar àudio', async () => {
  const antiga = diferit();
  fetchFals.mockImplementation((_url, o) => o.method === 'GET' ? Promise.resolve({ ok: true })
    : posts().length === 1 ? antiga.promise : Promise.resolve(audioResposta()));
  const vista = render(<Pagina />);
  await waitFor(() => expect(posts()).toHaveLength(1));
  const vell = fetchFals.mock.calls.find(([, o]) => o.method === 'POST')[1].signal;
  act(() => servei.desaVeuPreferida('arnau_valencia'));
  await waitFor(() => expect(posts().some((p) => p.veu === 'arnau_valencia')).toBe(true));
  expect(vell.aborted).toBe(true);
  await waitFor(() => expect(audios).toHaveLength(1));
  await act(async () => antiga.resolve(audioResposta()));
  expect(audios).toHaveLength(1);
  vista.rerender(<Pagina idioma="es" />);
  await waitFor(() => expect(posts().some((p) => p.idioma === 'es')).toBe(true));
  await waitFor(() => expect(audios).toHaveLength(2));
  expect(audios[0].pause).toHaveBeenCalled();
});

test('una locució aliena pausa la barra; tancar la barra antiga no talla la nova veu', async () => {
  const onTanca = vi.fn(); render(<Pagina privat onTanca={onTanca} />);
  await waitFor(() => expect(enunciats).toHaveLength(2));
  act(() => enunciats[0].onstart());
  let aliena;
  await act(async () => { aliena = servei.parla('Veu aliena.', { privat: true }); aliena.catch(() => {}); });
  await screen.findByRole('button', { name: 'Continua la lectura' });
  await waitFor(() => expect(enunciats).toHaveLength(3));
  const abans = synth.cancel.mock.calls.length;
  fireEvent.click(screen.getByRole('button', { name: 'Tancar el reproductor de veu' }));
  expect(onTanca).toHaveBeenCalledOnce(); expect(synth.cancel).toHaveBeenCalledTimes(abans);
  await act(async () => enunciats[2].onend()); await aliena;
});

test('una precàrrega futura fallida no atura el bloc actual; el fallback es fa quan arriba eixe bloc', async () => {
  fetchFals.mockImplementation(async (_url, o) => o.method === 'GET' ? { ok: true }
    : JSON.parse(o.body).text === 'Segon paràgraf.' ? { ok: false, headers: new Headers() } : audioResposta());
  render(<Pagina />);
  await waitFor(() => expect(audios).toHaveLength(1)); act(() => audios[0].inicia());
  await waitFor(() => expect(posts()).toHaveLength(3));
  expect(enunciats).toHaveLength(0); expect(screen.getByText('Bloc 1 de 4')).toBeTruthy();
  await act(async () => audios[0].acaba());
  await waitFor(() => expect(enunciats).toHaveLength(2));
  expect(enunciats[0].text).toBe('Segon paràgraf.');
  expect(screen.getByText('Bloc 1 de 4')).toBeTruthy();
  act(() => enunciats[0].onstart()); expect(screen.getByText('Bloc 2 de 4')).toBeTruthy();
});
