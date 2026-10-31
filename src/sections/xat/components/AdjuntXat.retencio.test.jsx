/* QA-C01 (Gauntlet 261029_1858) · Les peces d'adjunts retenen la URL blob:
   desxifrada que pinten o reprodueixen: el registre LRU del xat xifrat no la
   revoca mai mentre la peça és muntada, i l'allibera en desmuntar-se o en
   canviar de font. El doble del port fa de decorador amb el registre REAL
   (creaRegistreBlobsAdjunts) i un pressupost per a un sol adjunt. La bandera
   d'E2EE es llig amb un getter: apagada, la crida de sempre ({ renova }). */
import '../../../../tests/helpers/diccionaris.js';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { creaRegistreBlobsAdjunts, errorPressupostBlobs } from '../../../data/xatMultimediaXifrat.js';

const m = vi.hoisted(() => ({ actiu: true, urlAdjuntXat: vi.fn(), registre: null, revocades: [], n: 0 }));
vi.mock('../../../data/backendPort.js', () => ({ urlAdjuntXat: m.urlAdjuntXat, teCapacitat: () => true }));
vi.mock('../../../config/xifratXat.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, get E2EE_ACTIU_PER_DEFECTE() { return m.actiu; } };
});
import AdjuntXat, { _reiniciaVeus } from './AdjuntXat.jsx';

const config = { dataMode: 'remote' };
const foto1 = { id: 'foto-1', mime: 'image/webp' };
const foto2 = { id: 'foto-2', mime: 'image/webp' };
const veu = { id: 'veu-1', mime: 'audio/webm', duradaMs: 4000 };
/* Cada adjunt fa 6 bytes en clar i el pressupost és de 10: només en cap un. */
const BYTES = 6;

/* El decorador fals: memòria cau del registre, URL nova amb renova, i la retenció
   en el mateix tic que es servix (com motor.urlAdjunt). */
async function urlDelDoble(id, _config, opcions = {}) {
  const desada = opcions.renova ? null : m.registre.obte(id);
  const url = desada ?? m.registre.desa(id, `blob:sintetic/${id}/${++m.n}`, BYTES);
  if (typeof opcions.reten === 'function') opcions.reten(m.registre.reten(id));
  return url;
}
const srcsVius = () => [...document.querySelectorAll('img, video, audio')].map((e) => e.getAttribute('src')).filter(Boolean);
let errors;

beforeEach(() => {
  m.actiu = true;
  m.n = 0;
  m.revocades = [];
  m.registre = creaRegistreBlobsAdjunts({ pressupost: 10, revoca: (url) => m.revocades.push(url) });
  m.urlAdjuntXat.mockReset().mockImplementation(urlDelDoble);
  /* Sense IntersectionObserver la peça demana la URL en muntar-se (jsdom). */
  vi.stubGlobal('IntersectionObserver', undefined);
  for (const metode of ['pause', 'load']) vi.spyOn(HTMLMediaElement.prototype, metode).mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
  errors = vi.spyOn(console, 'error');
});
afterEach(() => {
  cleanup();
  expect(errors).not.toHaveBeenCalled();
  _reiniciaVeus();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const Dues = ({ primera = true, segona = true }) => (
  <>
    {primera ? <AdjuntXat adjunt={foto1} tipus="imatge" externalConfig={config} usuariId="A" /> : null}
    {segona ? <AdjuntXat adjunt={foto2} tipus="imatge" externalConfig={config} usuariId="A" /> : null}
  </>
);

test('dues fotos i pressupost per a una: la primera, muntada, no es revoca; en desmuntar-la, sí', async () => {
  const vista = render(<Dues segona={false} />);
  await waitFor(() => expect(srcsVius()).toHaveLength(1));
  const [u1] = srcsVius();
  expect(m.urlAdjuntXat).toHaveBeenCalledWith('foto-1', expect.objectContaining({ dataMode: 'remote' }), { renova: false, reten: expect.any(Function) });

  vista.rerender(<Dues />);
  await waitFor(() => expect(srcsVius()).toHaveLength(2));
  expect(m.revocades).toEqual([]);
  expect(m.registre.estat()).toMatchObject({ entrades: 2, bytes: 12 });

  vista.rerender(<Dues primera={false} />);
  await waitFor(() => expect(m.revocades).toEqual([u1]));
  expect(srcsVius().filter((src) => m.revocades.includes(src))).toEqual([]);
  expect(m.registre.estat()).toMatchObject({ entrades: 1, bytes: 6 });
});

test('renovar la font (error de càrrega) allibera la URL vella només quan la nova ja és posada', async () => {
  render(<AdjuntXat adjunt={foto1} tipus="imatge" externalConfig={config} usuariId="A" />);
  const imatge = await screen.findByAltText('Foto adjunta');
  const vella = imatge.getAttribute('src');
  fireEvent.error(imatge);
  await waitFor(() => expect(screen.getByAltText('Foto adjunta').getAttribute('src')).not.toBe(vella));
  await waitFor(() => expect(m.revocades).toEqual([vella]));
  expect(srcsVius().filter((src) => m.revocades.includes(src))).toEqual([]);
  // La segona fallada deixa la peça en «Torna-ho a provar» i allibera la que ja no es pinta.
  const nova = screen.getByAltText('Foto adjunta').getAttribute('src');
  fireEvent.error(screen.getByAltText('Foto adjunta'));
  expect(await screen.findByRole('button', { name: 'Torna-ho a provar' })).toBeTruthy();
  render(<AdjuntXat adjunt={foto2} tipus="imatge" externalConfig={config} usuariId="A" />);
  await waitFor(() => expect(m.revocades).toEqual([vella, nova]));
});

test('una resposta que arriba després de desmuntar-se allibera la seua retenció', async () => {
  let solta;
  m.urlAdjuntXat.mockImplementationOnce((id, configCrida, opcions) => new Promise((resolve) => {
    solta = () => resolve(urlDelDoble(id, configCrida, opcions));
  }));
  const vista = render(<AdjuntXat adjunt={foto1} tipus="imatge" externalConfig={config} usuariId="A" />);
  vista.unmount();
  await act(async () => { solta(); await Promise.resolve(); });
  await waitFor(() => expect(m.registre.estat().entrades).toBe(1));
  render(<AdjuntXat adjunt={foto2} tipus="imatge" externalConfig={config} usuariId="A" />);
  await waitFor(() => expect(m.revocades).toEqual(['blob:sintetic/foto-1/1']));
});

test('una resposta rebuda però encara sense pintar quan la peça es desmunta en el mateix lot també s’allibera', async () => {
  let solta;
  m.urlAdjuntXat.mockImplementationOnce((id, configCrida, opcions) => new Promise((resolve) => {
    solta = () => resolve(urlDelDoble(id, configCrida, opcions));
  }));
  const vista = render(<AdjuntXat adjunt={foto1} tipus="imatge" externalConfig={config} usuariId="A" />);
  await act(async () => {
    solta();
    for (let i = 0; i < 5; i += 1) await Promise.resolve();
    vista.unmount();
  });
  render(<AdjuntXat adjunt={foto2} tipus="imatge" externalConfig={config} usuariId="A" />);
  await waitFor(() => expect(m.revocades).toEqual(['blob:sintetic/foto-1/1']));
});

const AmbVeu = ({ ambVeu = true }) => (
  <>
    {ambVeu ? <AdjuntXat adjunt={veu} tipus="veu" externalConfig={config} usuariId="A" /> : null}
    <AdjuntXat adjunt={foto1} tipus="imatge" externalConfig={config} usuariId="A" />
  </>
);

test('la nota de veu reté la seua URL mentre és muntada', async () => {
  const vista = render(<AmbVeu />);
  await screen.findByAltText('Foto adjunta');
  const deLaFoto = screen.getByAltText('Foto adjunta').getAttribute('src');
  fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' }));
  const audio = vista.container.querySelector('audio');
  await waitFor(() => expect(audio.getAttribute('src')).toMatch(/^blob:sintetic\/veu-1\//));
  // Dues retingudes per damunt del pressupost: cap revocada.
  expect(m.revocades).toEqual([]);
  vista.rerender(<AmbVeu ambVeu={false} />);
  await waitFor(() => expect(m.revocades).toHaveLength(1));
  expect(m.revocades[0]).toMatch(/^blob:sintetic\/veu-1\//);
  expect(srcsVius()).toEqual([deLaFoto]);
});

test('sense lloc dins del sostre, la peça mostra l’error amb «Torna-ho a provar»', async () => {
  m.urlAdjuntXat.mockRejectedValueOnce(errorPressupostBlobs());
  render(<AdjuntXat adjunt={foto1} tipus="imatge" externalConfig={config} usuariId="A" />);
  expect(await screen.findByText(/No hem pogut obrir el fitxer\./)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
  expect(await screen.findByAltText('Foto adjunta')).toBeTruthy();
});

test('bandera apagada: la crida de sempre, sense cap retenció', async () => {
  m.actiu = false;
  const vista = render(<Dues segona={false} />);
  await waitFor(() => expect(srcsVius()).toHaveLength(1));
  expect(m.urlAdjuntXat).toHaveBeenCalledWith('foto-1', expect.objectContaining({ dataMode: 'remote' }), { renova: false });
  vista.rerender(<Dues />);
  await waitFor(() => expect(srcsVius()).toHaveLength(2));
  // Sense retenció, el LRU de sempre desallotja la primera (el comportament que QA-C01 corregix amb la bandera encesa).
  expect(m.revocades).toEqual(['blob:sintetic/foto-1/1']);
});
