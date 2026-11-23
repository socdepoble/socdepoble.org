/* v1.2.23 · X2 (ordre del Mestre 261123) · La veu recollida abans que el telèfon talle la gravació.
   La crònica R32.41 diu que «es guarda la veu que ja s'havia recollit», i en la v1.2.22 era una nota preparada per a
   escoltar-la i enviar-la. Des del kit Codex R32.44, gravaVeu (adjuntLocal.js) la rebutja dins d'un error 'gravacio'
   amb `recuperacio` (incompleta, duradaMs null, duradaCapturaMs). Estes proves fixen que grava() de ControlsAdjunt
   la torna a deixar preparada:
   · l'avís «No hem pogut acabar la gravació.» diu a la vista que la gravació s'ha tallat;
   · la veu es pot escoltar (la previsualització de sempre, amb els mateixos bytes) i enviar amb la durada de la
     captura arrodonida a un enter positiu, que és el que exigix validaAdjuntXat; només viatja la forma d'una nota
     sencera (ni `incompleta` ni `duradaCapturaMs`);
   · si no cap a la quota, l'avís és el de la quota (SDP-XAT-020) i no es perd;
   · sense bytes, o després de Cancel·la, res no canvia.
   La prova de punta a punta amb la gravadora de veres que llança en stop() és pageContent.versions.veuR32_41.test.jsx;
   ací n'hi ha una altra, també de veres, per a l'error del sistema (onerror). */
import '../../../../tests/helpers/diccionaris.js';
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import ControlsAdjunt from './ControlsAdjunt.jsx';
import Compositor from './Compositor.jsx';
import { createTranslator } from '../../../config/i18n.js';
import { ERRORS_ADJUNT_XAT, errorAdjuntXat, validaAdjuntXat } from '../../../data/xatMultimedia.js';

const m = vi.hoisted(() => ({ gravaVeu: vi.fn(), gravaVeuDeVeres: null }));
vi.mock('../adjuntLocal.js', async (importOriginal) => {
  const original = await importOriginal();
  m.gravaVeuDeVeres = original.gravaVeu;
  return { ...original, gravaVeu: m.gravaVeu, mimeDeGravacio: () => 'audio/mp4' };
});
vi.mock('../../../data/backendPort.js', () => ({ quotaXat: vi.fn(), teCapacitat: () => true, urlAdjuntXat: vi.fn(), descartaAdjuntXat: vi.fn() }));

const NativeURL = globalThis.URL;
const fil = { id: 'fil-x2' };
const AVIS_TALLADA = ERRORS_ADJUNT_XAT.gravacio;
let servei;
let urlsCreades;
const deferred = () => { let resolve, reject; const promise = new Promise((r, j) => { resolve = r; reject = j; }); return { promise, resolve, reject }; };
const llig = (blob) => new Promise((resol, rebutja) => {
  const lector = new FileReader();
  lector.onload = () => resol(lector.result);
  lector.onerror = () => rebutja(lector.error);
  lector.readAsText(blob);
});

beforeEach(() => {
  vi.clearAllMocks();
  servei = { teCapacitat: () => true, quotaXat: vi.fn().mockResolvedValue({ usats: 0, limit: 20_000_000 }) };
  urlsCreades = new Map();
  vi.stubGlobal('navigator', { ...globalThis.navigator, mediaDevices: { getUserMedia: vi.fn() } });
  // Cada URL local apunta al seu Blob: la prova llig els bytes que de veres arriben a la previsualització.
  vi.stubGlobal('URL', Object.assign(class extends NativeURL {}, {
    createObjectURL: vi.fn((blob) => { const url = `blob:x2-veu-${urlsCreades.size}`; urlsCreades.set(url, blob); return url; }),
    revokeObjectURL: vi.fn()
  }));
  // jsdom no reproduïx: el reproductor de veu només ha de poder cridar-ho.
  for (const metode of ['pause', 'load']) vi.spyOn(HTMLMediaElement.prototype, metode).mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const enValencia = (_, alternativa) => alternativa;
function Barra({ t, onEnvia = vi.fn() }) {
  const [valor, setValor] = useState('');
  return (
    <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: () => {} }}>
      <ControlsAdjunt usuariId="persona-x2" fil={fil} servei={servei} onEnvia={onEnvia} t={t}>
        {(adjunts) => <Compositor valor={valor} onCanvia={setValor} onEnvia={() => setValor('')} t={t ?? enValencia} adjunts={adjunts} />}
      </ControlsAdjunt>
    </AppGridContext.Provider>
  );
}

/* L'error que torna gravaVeu (Codex R32.44) quan el telèfon talla la gravació i hi havia bytes. */
const errorAmbVeu = ({ text = 'veu recollida abans del tall', motiu = 'stop', ...recuperacio } = {}) => errorAdjuntXat('gravacio', {
  motiu, recuperable: true,
  recuperacio: Object.freeze({ id: 'veu-tallada', fitxer: new Blob([text], { type: 'audio/mp4' }), tipus: 'veu', duradaMs: null,
    duradaCapturaMs: 4_200, incompleta: true, ...recuperacio })
});

/* Comença a gravar amb un resultat que la prova decidix; torna el resultat per a rebutjar-lo. */
async function gravaAmbResultat(props = {}) {
  const resultat = deferred();
  m.gravaVeu.mockResolvedValueOnce({ atura: vi.fn(), cancella: vi.fn(), resultat: resultat.promise });
  render(<Barra {...props} />);
  const grava = await screen.findByRole('button', { name: props.t ? props.t('section.xat.adjunts.grava', 'Grava àudio') : 'Grava àudio' });
  await waitFor(() => expect(grava.disabled).toBe(false));
  fireEvent.click(grava);
  await screen.findByRole('timer');
  return resultat;
}

/* Els bytes que la previsualització fa sonar (la font es posa en prémer Reprodueix). */
async function veuQueSona() {
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' })); });
  await waitFor(() => expect(document.querySelector('audio[src]')).not.toBeNull());
  return llig(urlsCreades.get(document.querySelector('audio[src]').getAttribute('src')));
}

describe('v1.2.23 · X2 · la veu recollida abans del tall arriba a la persona', () => {
  test.each([
    ['una captura entera', 4_200, 4_200],
    ['una captura amb decimals', 4_200.6, 4_201],
    ['una captura de menys d’un mil·lisegon', 0.3, 1]
  ])('es pot escoltar i enviar amb la durada de la captura arrodonida a un enter positiu (%s)', async (_, duradaCapturaMs, duradaMs) => {
    const envia = vi.fn().mockResolvedValue([{ id: 'm' }]);
    const resultat = await gravaAmbResultat({ onEnvia: envia });
    const error = errorAmbVeu({ duradaCapturaMs });
    await act(async () => { resultat.reject(error); });

    // L'avís diu que la gravació no ha acabat, i la veu recollida hi és.
    expect((await screen.findByRole('alert')).textContent).toBe(AVIS_TALLADA);
    expect(screen.queryByRole('timer')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Atura la gravació' })).toBeNull();
    expect(await veuQueSona()).toBe('veu recollida abans del tall');

    // Tal com arriba de gravaVeu no es podria enviar (durada null); preparada, sí.
    let rebuig = null;
    try { validaAdjuntXat(error.recuperacio); } catch (e) { rebuig = e; }
    expect(rebuig?.code).toBe('durada');
    fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
    await waitFor(() => expect(envia).toHaveBeenCalledOnce());
    const [filEnviat, entrada] = envia.mock.calls[0];
    expect(filEnviat).toBe(fil);
    expect(Object.keys(entrada).sort()).toEqual(['duradaMs', 'fitxer', 'id', 'tipus']);
    expect(entrada).toMatchObject({ id: 'veu-tallada', tipus: 'veu', duradaMs });
    expect(entrada.fitxer).toBe(error.recuperacio.fitxer);
    expect(Number.isSafeInteger(entrada.duradaMs) && entrada.duradaMs > 0).toBe(true);
    expect(() => validaAdjuntXat(entrada)).not.toThrow();
    // En enviar, l'avís se'n va amb la nota.
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Reprodueix el missatge de veu' })).toBeNull());
  });

  test('si s’havia aturat sola als 5 minuts, també ho diu, com una nota sencera', async () => {
    const resultat = await gravaAmbResultat();
    await act(async () => { resultat.reject(errorAmbVeu({ motiu: 'onstop-absent', aturada: 'temps', duradaCapturaMs: 300_000 })); });
    expect((await screen.findByRole('alert')).textContent).toBe(AVIS_TALLADA);
    const estat = screen.getByRole('status');
    expect(estat.textContent).toBe('La gravació s’ha aturat sola en arribar als 5 minuts. Escolta-la abans d’enviar.');
    expect(estat.classList.contains('sdp-xat-adjunts__avis')).toBe(true);
    expect(screen.getByRole('button', { name: 'Envia el fitxer' })).toBeTruthy();
  });

  test('sense espai a la quota, l’avís és el de la quota (SDP-XAT-020) i no es perd', async () => {
    servei.quotaXat.mockResolvedValue({ usats: 19_999_990, limit: 20_000_000 });
    const envia = vi.fn();
    const resultat = await gravaAmbResultat({ onEnvia: envia });
    await act(async () => { resultat.reject(errorAmbVeu({ text: 'una veu que ja no hi cap' })); });
    expect((await screen.findByRole('alert')).textContent).toBe(ERRORS_ADJUNT_XAT['SDP-XAT-020']);
    expect(screen.queryByRole('button', { name: 'Reprodueix el missatge de veu' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Envia el fitxer' })).toBeNull();
    expect(await screen.findByRole('button', { name: 'Grava àudio' })).toBeTruthy();
    expect(envia).not.toHaveBeenCalled();
  });

  test('sense bytes recollits, l’avís de sempre i cap nota', async () => {
    const resultat = await gravaAmbResultat();
    await act(async () => { resultat.reject(errorAdjuntXat('gravacio', { motiu: 'onstop-absent', recuperable: false })); });
    expect((await screen.findByRole('alert')).textContent).toBe(AVIS_TALLADA);
    expect(screen.queryByRole('button', { name: 'Reprodueix el missatge de veu' })).toBeNull();
    expect(await screen.findByRole('button', { name: 'Grava àudio' })).toBeTruthy();
  });

  test('una recuperació que no és d’una veu o no té captura no es pren per una nota', async () => {
    const resultat = await gravaAmbResultat();
    await act(async () => { resultat.reject(errorAmbVeu({ duradaCapturaMs: Number.NaN })); });
    expect((await screen.findByRole('alert')).textContent).toBe(AVIS_TALLADA);
    expect(screen.queryByRole('button', { name: 'Reprodueix el missatge de veu' })).toBeNull();
  });

  /* v1.2.23 · X2 (Gauntlet R1) · Les altres tres guardes de veuRecuperada, una per una: el codi ha de ser 'gravacio',
     la recuperació ha de ser d'una veu i ha de portar bytes. Cap no es pren per una nota; l'avís és el de l'error. */
  test.each([
    ['una recuperació d’un altre tipus (vídeo)', () => errorAmbVeu({ tipus: 'video' }), AVIS_TALLADA],
    ['una recuperació sense bytes (Blob buit)', () => errorAmbVeu({ fitxer: new Blob([], { type: 'audio/mp4' }) }), AVIS_TALLADA],
    ['un error que no és de la gravació (micro-ocupat) encara que porte recuperació', () => errorAdjuntXat('micro-ocupat', {
      recuperacio: errorAmbVeu().recuperacio }), ERRORS_ADJUNT_XAT['micro-ocupat']]
  ])('%s no es pren per una nota', async (_, error, avis) => {
    const envia = vi.fn();
    const resultat = await gravaAmbResultat({ onEnvia: envia });
    await act(async () => { resultat.reject(error()); });
    expect((await screen.findByRole('alert')).textContent).toBe(avis);
    expect(screen.queryByRole('button', { name: 'Reprodueix el missatge de veu' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Envia el fitxer' })).toBeNull();
    expect(await screen.findByRole('button', { name: 'Grava àudio' })).toBeTruthy();
    expect(envia).not.toHaveBeenCalled();
  });

  test('després de Cancel·la, la veu que arriba tard no torna', async () => {
    const resultat = await gravaAmbResultat();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
    await act(async () => { resultat.reject(errorAmbVeu()); });
    expect(await screen.findByRole('button', { name: 'Grava àudio' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Reprodueix el missatge de veu' })).toBeNull();
  });

  test('l’avís parla la llengua de qui grava', async () => {
    const t = createTranslator('es');
    const resultat = await gravaAmbResultat({ t });
    await act(async () => { resultat.reject(errorAmbVeu()); });
    expect((await screen.findByRole('alert')).textContent).toBe(t('section.xat.adjunts.error.gravacio', AVIS_TALLADA));
    expect(t('section.xat.adjunts.error.gravacio', AVIS_TALLADA)).not.toBe(AVIS_TALLADA);
    expect(screen.getByRole('button', { name: t('section.xat.adjunts.envia', 'Envia el fitxer') })).toBeTruthy();
  });

  /* De veres: un error del sistema (onerror) amb dades abans i al final. Codex R32.44 les conserva a `recuperacio`,
     i ara la persona també les pot escoltar (abans de la v1.2.23 la nota es perdia en este cas). */
  test('amb la gravadora de veres, un error del sistema (onerror) també deixa la veu recollida', async () => {
    const pistes = [{ stop: vi.fn() }];
    class Gravadora {
      static isTypeSupported = (mime) => mime === 'audio/mp4';
      constructor() { this.state = 'inactive'; Gravadora.ultima = this; }
      start() { this.state = 'recording'; this.onstart?.(); }
      stop() { this.state = 'inactive'; }
    }
    vi.stubGlobal('MediaRecorder', Gravadora);
    m.gravaVeu.mockImplementationOnce((opcions) => m.gravaVeuDeVeres({
      ...opcions, Recorder: Gravadora, mediaDevices: { getUserMedia: async () => ({ getTracks: () => pistes }) }
    }));
    render(<Barra />);
    const grava = await screen.findByRole('button', { name: 'Grava àudio' });
    await waitFor(() => expect(grava.disabled).toBe(false));
    fireEvent.click(grava);
    await screen.findByRole('button', { name: 'Atura la gravació' });
    const gravadora = Gravadora.ultima;
    await act(async () => {
      gravadora.ondataavailable({ data: new Blob(['principi-'], { type: 'audio/mp4' }) });
      gravadora.onerror({ error: new DOMException('El còdec ha fallat', 'UnknownError') });
    });
    await act(async () => {
      gravadora.ondataavailable?.({ data: new Blob(['final'], { type: 'audio/mp4' }) });
      gravadora.onstop?.();
    });
    expect((await screen.findByRole('alert')).textContent).toBe(AVIS_TALLADA);
    expect(await veuQueSona()).toBe('principi-final');
    expect(screen.getByRole('button', { name: 'Envia el fitxer' })).toBeTruthy();
    for (const pista of pistes) expect(pista.stop).toHaveBeenCalledOnce();
  });
});
