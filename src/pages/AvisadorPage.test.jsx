import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from '../app/contexts/RouterContext.jsx';
import { exportaHorariAvisador, MISSATGE_AVISADOR } from '../services/avisador.js';
import { desaAvisador, llegixAvisador } from '../services/avisadorPreferencies.js';
import AvisadorPage from './AvisadorPage.jsx';
import AvisadorEnSessio from '../components/salut/AvisadorEnSessio.jsx';

const { port, useXat } = vi.hoisted(() => ({ port: vi.fn(), useXat: vi.fn() }));
vi.mock('../data/backendPort.js', () => ({ enviaMissatge: port }));
vi.mock('../sections/xat/XatContext.jsx', () => ({ useXat }));
vi.mock('../components/universal/PageFrame.jsx', () => ({
  PageFrame: ({ title, children }) => <main><header className="page-title"><h1>{title}</h1></header>{children}</main>
}));

const CLAU = 'avisador:prova';
const CONFIG = {};
/* La mateixa gràcia que AvisadorEnSessio.jsx: en obrir l'app no s'avisa abans de 5 minuts. */
const GRACIA_MS = 5 * 60_000;
const LIMITACIONS = 'He llegit que l’Avisador no substituïx el 112 ni la teleassistència';
const fil = (id, nom) => ({
  id: `fil-${id}`, tipus: 'directe', participants: 2, altres: [{ id, nom, tipus: 'persona' }]
});
const XAT = {
  avisadorClau: CLAU, scopeKey: 'sessio', joId: 'jo', status: 'ready', llistaFresca: true,
  chatThreads: [fil('anna', 'Anna'), fil('miquel', 'Miquel'), fil('vicent', 'Vicent'), fil('teresa', 'Teresa'),
    { ...fil('bot', 'Bot'), esIA: true }]
};
const munta = (component) => render(component, { wrapper: MemoryRouter });

/* Activa l'Avisador a les 20:00 amb 4 hores i Anna com a persona de confiança. */
function activaAmbAnna() {
  vi.setSystemTime(new Date(2026, 10, 10, 20));
  const vista = munta(<AvisadorPage />);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '4' } });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Anna' }));
  fireEvent.click(screen.getByRole('checkbox', { name: LIMITACIONS }));
  fireEvent.click(screen.getByRole('button', { name: 'Activa l’Avisador' }));
  vista.unmount();
}

beforeEach(() => {
  window.localStorage.clear();
  port.mockReset();
  useXat.mockReturnValue(XAT);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('configura només amb un compte, desa per àmbit i restaura després de remuntar', () => {
  useXat.mockReturnValue({ avisadorClau: null, senseSessio: true });
  const sense = munta(<AvisadorPage />);
  expect(screen.getByRole('link', { name: 'Entra amb el teu compte' }).getAttribute('href')).toContain('avisador');
  expect(screen.queryByRole('combobox')).toBeNull();
  sense.unmount();

  useXat.mockReturnValue(XAT);
  const primer = munta(<AvisadorPage />);
  expect(screen.getByRole('heading', { name: 'L’Avisador' })).toBeTruthy();
  expect(screen.getByText(MISSATGE_AVISADOR).tagName).toBe('BLOCKQUOTE');
  expect(screen.queryByRole('checkbox', { name: 'Bot' })).toBeNull();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '12' } });
  fireEvent.change(screen.getByLabelText(/Inici del descans/), { target: { value: '21:30' } });
  fireEvent.change(screen.getByLabelText(/Fi del descans/), { target: { value: '07:00' } });
  for (const nom of ['Anna', 'Miquel', 'Vicent']) fireEvent.click(screen.getByRole('checkbox', { name: nom }));
  expect(screen.getByRole('checkbox', { name: 'Teresa' }).disabled).toBe(true);
  /* Sense confirmar les limitacions no es pot activar. */
  expect(screen.getByRole('button', { name: 'Activa l’Avisador' }).disabled).toBe(true);
  fireEvent.click(screen.getByRole('checkbox', { name: LIMITACIONS }));
  fireEvent.click(screen.getByRole('button', { name: 'Activa l’Avisador' }));
  expect(llegixAvisador(CLAU)).toMatchObject({
    actiu: true, horesImmobilitat: 12, horaIniciNit: '21:30', horaFiNit: '07:00',
    personesConfiansa: ['anna', 'miquel', 'vicent'].map((personaId) => ({ personaId }))
  });
  primer.unmount();

  munta(<AvisadorPage />);
  expect(screen.getByRole('combobox').value).toBe('12');
  expect(screen.getByRole('checkbox', { name: 'Anna' }).checked).toBe(true);
  expect(screen.getByRole('checkbox', { name: LIMITACIONS }).checked).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Desactiva l’Avisador' }));
  expect(llegixAvisador(CLAU)).toBeNull();
});

it('no desa un descans nocturn de més de 12 hores', () => {
  munta(<AvisadorPage />);
  fireEvent.change(screen.getByLabelText(/Inici del descans/), { target: { value: '08:00' } });
  fireEvent.change(screen.getByLabelText(/Fi del descans/), { target: { value: '07:59' } });
  fireEvent.click(screen.getByRole('checkbox', { name: 'Anna' }));
  fireEvent.click(screen.getByRole('checkbox', { name: LIMITACIONS }));
  fireEvent.click(screen.getByRole('button', { name: 'Activa l’Avisador' }));
  expect(screen.getByRole('alert').textContent).toContain('El descans nocturn pot durar com a màxim 12 hores.');
  expect(llegixAvisador(CLAU)).toBeNull();
});

it('el monitor continua fora de la pàgina i usa el port neutral amb id, límit i confirmació', async () => {
  vi.useFakeTimers();
  port.mockImplementation(async (_fil, { id }) => ({ id, seq: 4 }));
  activaAmbAnna();

  vi.setSystemTime(new Date(2026, 10, 11, 9, 59));
  munta(<AvisadorEnSessio clau={CLAU} config={CONFIG} />);
  expect(port).not.toHaveBeenCalled();
  /* A les 10:00 ja toca avisar, però l'app s'acaba d'obrir: primer passa la gràcia. */
  await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
  expect(port).not.toHaveBeenCalled();
  await act(async () => { await vi.advanceTimersByTimeAsync(GRACIA_MS); });
  expect(port).toHaveBeenCalledOnce();
  const contacte = llegixAvisador(CLAU).personesConfiansa[0];
  expect(port).toHaveBeenCalledWith('fil-anna', { id: contacte.idMissatge, text: expect.stringContaining('Avís automàtic') },
    { signal: expect.any(AbortSignal), senseSafata: true });
  expect(contacte.estat).toBe('enviat');
  desaAvisador(CLAU, null);
  await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
  expect(port).toHaveBeenCalledOnce();
});

it('en tornar a l’app amb el llindar ja superat no avisa abans de la gràcia, i un toc real l’anul·la', async () => {
  vi.useFakeTimers();
  port.mockImplementation(async (_fil, { id }) => ({ id, seq: 4 }));
  activaAmbAnna();

  /* L'endemà a les 11:00 ja han passat 5 hores actives (20:00–22:00 i 08:00–11:00). */
  vi.setSystemTime(new Date(2026, 10, 11, 11));
  const afegeix = vi.spyOn(document, 'addEventListener');
  munta(<AvisadorEnSessio clau={CLAU} config={CONFIG} />);
  expect(port).not.toHaveBeenCalled();
  await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
  expect(port).not.toHaveBeenCalled();

  const abans = llegixAvisador(CLAU).ultimBatec;
  /* Un esdeveniment sintètic no compta com a activitat. */
  fireEvent.pointerDown(document.body);
  expect(llegixAvisador(CLAU).ultimBatec).toBe(abans);
  /* jsdom no pot crear un esdeveniment amb isTrusted: es crida l'escolta registrada. */
  const [, toc] = afegeix.mock.calls.find(([tipus, , captura]) => tipus === 'pointerdown' && captura === true);
  act(() => { toc({ isTrusted: true, repeat: false }); });
  expect(llegixAvisador(CLAU).ultimBatec).toBe(Date.now());

  await act(async () => { await vi.advanceTimersByTimeAsync(GRACIA_MS + 60_000); });
  expect(port).not.toHaveBeenCalled();
  expect(llegixAvisador(CLAU).personesConfiansa[0].estat).toBe('pendent');
});

it('una concessió tardana del Web Lock no pot enviar després de desmuntar', async () => {
  vi.useFakeTimers();
  activaAmbAnna();
  // jsdom lliura storage amb un timer de 0 ms: es completa abans de mesurar el monitor.
  await act(async () => { await vi.advanceTimersByTimeAsync(0); });
  vi.setSystemTime(new Date(2026, 10, 11, 10));

  const continuacions = [];
  const descriptor = Object.getOwnPropertyDescriptor(navigator, 'locks');
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: { request: (_nom, _opcions, callback) => new Promise((resolve) => {
      continuacions.push(() => resolve(callback({})));
    }) }
  });
  try {
    const monitor = munta(<AvisadorEnSessio clau={CLAU} config={CONFIG} />);
    expect(continuacions.length).toBeGreaterThan(0);
    monitor.unmount();
    for (const continua of continuacions) continua();
    await Promise.resolve();
    expect(port).not.toHaveBeenCalled();
    expect(llegixAvisador(CLAU).personesConfiansa[0].estat).toBe('pendent');
    vi.runAllTicks();
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    if (descriptor) Object.defineProperty(navigator, 'locks', descriptor);
    else delete navigator.locks;
  }
});

it('carrega un horari a la vista sense activar-lo ni enviar cap missatge', async () => {
  munta(<AvisadorPage />);
  const text = exportaHorariAvisador({ horesImmobilitat: 12, horaIniciNit: '21:30', horaFiNit: '07:00' });
  const fitxer = new File([text], 'avisador-horari.json', { type: 'application/json' });
  fitxer.text = async () => text;
  fireEvent.change(screen.getByLabelText('Importa un horari (.json)'), { target: { files: [fitxer] } });
  expect(await screen.findByText(/Horari carregat al formulari/)).toBeTruthy();
  expect(screen.getByRole('combobox').value).toBe('12');
  expect(screen.getByLabelText(/Inici del descans/).value).toBe('21:30');
  expect(llegixAvisador(CLAU)).toBeNull();
  expect(port).not.toHaveBeenCalled();
});
