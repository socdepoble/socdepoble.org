/* Gauntlet 261022_0225 (crítica Claude, STRESS-2 i F4) · Una bombolla amb
   adjunt: entrar i eixir del mode de selecció no desmunta l'adjunt ni torna a
   demanar cap URL signada (abans, 2 peticions HTTP per foto a cada volta), i
   en el mode de selecció l'adjunt no porta cap control dins de la casella.
   REV-ESTRES-1 i REV-ESTRES-3 · El vídeo que sonava es para en entrar-hi (i
   no pot tornar a sonar sense controls), i la nota de veu torna, en eixir,
   quieta i sense l'estat d'abans. */
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { urlAdjuntXat } from '../../../data/backendPort.js';
import Bombolla from './Bombolla.jsx';

vi.mock('../../../data/backendPort.js', async (original) => ({
  ...(await original()),
  teCapacitat: () => true,
  urlAdjuntXat: vi.fn(async (id) => `https://adjunts.invalid/${id}`)
}));

/* El navegador avisa que la caixa és a la vista tan bon punt s'observa. */
class SempreALaVista {
  constructor(callback) { this.callback = callback; }

  observe(node) { queueMicrotask(() => this.callback([{ isIntersecting: true, target: node }], this)); }

  unobserve() {}

  disconnect() {}
}

const t = (_, alternativa) => alternativa;
const FOTO = Object.freeze({
  id: 'm1', seq: 1, sender: 'other', author: 'Pep', usuariId: 'pep', text: 'Foto', tipus: 'imatge',
  creatAl: '2026-10-22T10:00:00Z', estatEnviament: 'enviat', metadades: { adjunt: { id: '00000000-0000-4000-8000-000000000001' } }
});
const CONFIG = Object.freeze({ dataMode: 'remote' });

/* jsdom no reprodueix: play i pause són espies. */
let pausa;
beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', SempreALaVista);
  urlAdjuntXat.mockClear();
  pausa = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const pinta = (seleccio, missatge = FOTO) => (
  <MemoryRouter>
    <ol><Bombolla missatge={missatge} locale="ca-ES" t={t} configAdjunts={CONFIG} usuariAdjunts="u-1" seleccio={seleccio} /></ol>
  </MemoryRouter>
);
const TRIA = Object.freeze({ actiu: true, triat: false, onAlterna: () => {} });
const ambAdjunt = (tipus) => Object.freeze({ ...FOTO, text: '', tipus, metadades: { adjunt: { id: FOTO.metadades.adjunt.id, duradaMs: 60000 } } });

test('entrar i eixir del mode de selecció no torna a demanar la URL de la foto', async () => {
  const vista = render(pinta(null));
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  expect(urlAdjuntXat).toHaveBeenCalledTimes(1);
  const imatge = vista.container.querySelector('img.sdp-xat-adjunt__imatge');
  expect(imatge).not.toBeNull();

  const tria = { actiu: true, triat: false, onAlterna: () => {} };
  await act(async () => { vista.rerender(pinta(tria)); });
  const casella = vista.container.querySelector('[role="checkbox"]');
  expect(casella).not.toBeNull();
  /* La mateixa foto, sense cap botó ni control dins de la casella. */
  expect(vista.container.querySelector('img.sdp-xat-adjunt__imatge')).toBe(imatge);
  expect(casella.querySelector('button, video[controls], audio[controls], input')).toBeNull();

  await act(async () => { vista.rerender(pinta(null)); });
  expect(vista.container.querySelector('img.sdp-xat-adjunt__imatge')).toBe(imatge);
  expect(urlAdjuntXat).toHaveBeenCalledTimes(1);
});

test('el vídeo que sonava es para en entrar en selecció, i no torna a sonar fins que n’ixes', async () => {
  const missatge = ambAdjunt('video');
  const vista = render(pinta(null, missatge));
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  const video = vista.container.querySelector('video');
  expect(video.hasAttribute('controls')).toBe(true);
  fireEvent.play(video);
  pausa.mockClear();

  await act(async () => { vista.rerender(pinta(TRIA, missatge)); });
  expect(vista.container.querySelector('video')).toBe(video);
  expect(video.hasAttribute('controls')).toBe(false);
  expect(pausa).toHaveBeenCalled();
  /* Sense controls dins de la casella: si torna a sonar, es para. */
  pausa.mockClear();
  fireEvent.play(video);
  expect(pausa).toHaveBeenCalledTimes(1);

  await act(async () => { vista.rerender(pinta(null, missatge)); });
  pausa.mockClear();
  fireEvent.play(video);
  expect(pausa).not.toHaveBeenCalled();
  expect(urlAdjuntXat).toHaveBeenCalledTimes(1);
});

test('la nota de veu que sonava es para en entrar en selecció i en eixir torna quieta, sense l’estat d’abans', async () => {
  const missatge = ambAdjunt('veu');
  const vista = render(pinta(null, missatge));
  const boto = () => vista.container.querySelector('.sdp-xat-veu__boto');
  await act(async () => { fireEvent.click(boto()); await Promise.resolve(); await Promise.resolve(); });
  await act(async () => { fireEvent.play(vista.container.querySelector('audio')); });
  expect(boto().getAttribute('aria-label')).toBe('Pausa el missatge de veu');
  pausa.mockClear();

  await act(async () => { vista.rerender(pinta(TRIA, missatge)); });
  expect(pausa).toHaveBeenCalled();
  const casella = vista.container.querySelector('[role="checkbox"]');
  expect(casella.querySelector('audio, button, input')).toBeNull();
  expect(casella.textContent).toContain('Missatge de veu');

  await act(async () => { vista.rerender(pinta(null, missatge)); });
  expect(boto().getAttribute('aria-label')).toBe('Reprodueix el missatge de veu');
  expect(vista.container.querySelector('input[type="range"]').disabled).toBe(true);
  expect(vista.container.querySelector('audio').getAttribute('src')).toBeNull();
});
