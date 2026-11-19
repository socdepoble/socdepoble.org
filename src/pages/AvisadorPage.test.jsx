import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from '../app/contexts/RouterContext.jsx';
import { exportaHorariAvisador, MISSATGE_AVISADOR } from '../services/avisador.js';
import { desaAvisador, llegixAvisador } from '../services/avisadorPreferencies.js';
import AvisadorPage, { textRic } from './AvisadorPage.jsx';
import { HORES_AVISADOR } from '../services/avisador.js';
import { TEXTOS_AVISADOR } from './textosAvisador.js';
import AvisadorEnSessio from '../components/salut/AvisadorEnSessio.jsx';

const { port, useXat } = vi.hoisted(() => ({ port: vi.fn(), useXat: vi.fn() }));
vi.mock('../data/backendPort.js', () => ({ enviaMissatge: port }));
vi.mock('../sections/xat/XatContext.jsx', () => ({ useXat }));
const { propsPageFrame } = vi.hoisted(() => ({ propsPageFrame: { actual: null } }));
vi.mock('../components/universal/PageFrame.jsx', () => ({
  PageFrame: (props) => {
    propsPageFrame.actual = props;
    return <main><header className="page-title"><h1>{props.title}</h1><p className="lead">{props.lead}</p></header>{props.children}</main>;
  }
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
  /* La còpia de l'horari té la seua pròpia regió d'alerta, sempre muntada i buida: l'error del formulari és l'altra. */
  expect(screen.getAllByRole('alert').map((a) => a.textContent).join(' ')).toContain('El descans nocturn pot durar com a màxim 12 hores.');
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

/* Onada R32.12 · T1 (ordre del Mestre, 261118 19:33) · Redisseny Pedra Seca de /page/avisador. */
describe('redisseny Pedra Seca de /page/avisador', () => {
  it('sense banda beta ni Veri*Factu, amb l’entradilla com a lead de PageFrame', () => {
    munta(<AvisadorPage />);
    expect(document.body.textContent).not.toMatch(/verifactu|veri\*factu|fase beta|facturaci/i);
    expect(propsPageFrame.actual.lead).toBe(TEXTOS_AVISADOR.intro[1]);
    expect(propsPageFrame.actual.subtitle).toBe('Batec de Vida');
    /* L'entradilla no es repetix com un paràgraf solt dins del cos. */
    const paragrafs = [...document.querySelectorAll('main > section p, main > form p')].map((p) => p.textContent);
    expect(paragrafs).not.toContain(TEXTOS_AVISADOR.intro[1]);
  });

  it('jerarquia <h3>, negretes d’escaneig, 112 clicable i vincles al Xat i a Dispositius', () => {
    munta(<AvisadorPage />);
    const h3 = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(h3).toEqual(['Com funciona i límits de seguretat', 'Horari de l’avís', 'Persones de confiança']);
    expect(document.querySelectorAll('.sdp-avisador strong').length).toBeGreaterThanOrEqual(8);
    expect(screen.getByRole('link', { name: '112' }).getAttribute('href')).toBe('tel:112');
    expect(screen.getByRole('link', { name: 'Xat' }).getAttribute('href')).toBe('/xat');
    expect(screen.getByRole('link', { name: 'Dispositius' }).getAttribute('href')).toBe('/dispositius');
    /* Cap fieldset desangelat: les seccions són <section> amb el seu <h3>. */
    expect(document.querySelector('fieldset')).toBeNull();
  });

  it('escala d’hores de 2 a 24 sense l’hora soleta, i els tres camps en la mateixa fila', () => {
    expect(HORES_AVISADOR).toEqual([2, 3, 4, 5, 6, 7, 8, 12, 24]);
    expect(Object.isFrozen(HORES_AVISADOR)).toBe(true);
    munta(<AvisadorPage />);
    expect(screen.getAllByRole('option').map((o) => o.textContent))
      .toEqual(['2 h', '3 h', '4 h', '5 h', '6 h', '7 h', '8 h', '12 h', '24 h']);
    const fila = document.querySelector('.sdp-avisador__horari');
    expect(fila.querySelectorAll(':scope > .sdp-camp')).toHaveLength(3);
    /* La nota dels 12 hores va davall de la fila, no dins del tercer camp. */
    expect(fila.textContent).not.toContain('12 hores');
    expect(fila.nextElementSibling.textContent).toBe('El descans nocturn pot durar com a màxim 12 hores.');
  });

  it('les persones de confiança: comptador, bafarada i targetes amb el nom com a nom accessible', () => {
    munta(<AvisadorPage />);
    expect(screen.getByText('0 de 3 seleccionades')).toBeTruthy();
    const bafarada = screen.getByText(MISSATGE_AVISADOR);
    expect(bafarada.className).toContain('sdp-avisador__bafarada');
    const grup = screen.getByRole('group', { name: 'Persones de confiança' });
    expect(grup.querySelectorAll('.sdp-avisador__persona')).toHaveLength(4);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Anna' }));
    expect(screen.getByText('1 de 3 seleccionades')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Anna' }).closest('.sdp-avisador__persona').className)
      .toContain('sdp-avisador__persona--triada');
    /* Tota la targeta és l'etiqueta: el label conté el nom i l'avatar (decoratiu). */
    const etiqueta = document.querySelector('label[for="' + screen.getByRole('checkbox', { name: 'Anna' }).id + '"]');
    expect(etiqueta.className).toBe('sdp-avisador__persona-cos');
  });

  it('la còpia de l’horari va al final de tot, plegada, amb botons normals', () => {
    munta(<AvisadorPage />);
    const form = document.querySelector('form');
    const copia = form.lastElementChild;
    expect(copia.tagName).toBe('DETAILS');
    expect(copia.querySelector('summary').textContent).toBe('Còpia de l’horari');
    expect(copia.textContent).toContain('no viatgen');
    const boto = screen.getByRole('button', { name: 'Descarrega l’horari' });
    expect(copia.contains(boto)).toBe(true);
    expect(boto.className).not.toMatch(/sdp-boto--ple|sdp-boto--gran/);
    /* Abans de la còpia: la casella del 112, els botons i l'estat del batec. */
    const casella112 = screen.getByRole('checkbox', { name: LIMITACIONS });
    const activa = screen.getByRole('button', { name: 'Activa l’Avisador' });
    const ordre = (a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING;
    expect(ordre(casella112, activa)).toBeTruthy();
    expect(ordre(activa, copia)).toBeTruthy();
    expect(ordre(screen.getByText('Desactivat.'), copia)).toBeTruthy();
  });

  it('textRic només pinta negretes i enllaços coneguts: cap HTML no s’interpreta', () => {
    const tx = (parell) => parell[1];
    const { container } = render(<p>{textRic('<img src=x onerror=alert(1)> **fort** {desconegut} {telefon112} **obert', tx)}</p>,
      { wrapper: MemoryRouter });
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('strong').textContent).toBe('fort');
    expect(container.textContent).toBe('<img src=x onerror=alert(1)> fort {desconegut} 112 **obert');
    expect(container.querySelector('a[href="tel:112"]')).toBeTruthy();
  });
});
