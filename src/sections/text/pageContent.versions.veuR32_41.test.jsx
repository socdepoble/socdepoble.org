/* v1.2.23 · costura Llei 0 de /versions (verificació del carril K1, P2) · La crònica de l'Onada R32.41
   (pageContent.r10.js, «Correcció · El micròfon es tanca encara que el telèfon talle la gravació», en les cinc
   llengües) diu dues coses: si en aturar una gravació de veu del Xat el telèfon ja l'havia tallada, el micròfon es
   tanca igualment i «es guarda la veu que ja s'havia recollit».

   Abans, una cerca de text dins de grava() (ControlsAdjunt.jsx) buscava `.recuperacio`, i un mutant que no fa res
   (`void e?.recuperacio`) la feia verda. Esta prova ho fixa de punta a punta, sense cap simulacre del Xat:
   · la gravadora és la de veres (gravaVeu d'adjuntLocal.js) i la pantalla també (ControlsAdjunt amb el Compositor);
   · només són falsos el micròfon (getUserMedia) i un MediaRecorder que, com el telèfon que ja ha tallat la
     gravació, llança en stop();
   · no imposa cap disseny: passa si la veu recollida abans del tall es pot escoltar (la previsualització de sempre)
     o desar (un enllaç), amb els mateixos bytes.

   En la v1.2.22 era cert: resolAmbChunksAcumulatsOError resolia amb la veu recollida i la previsualització la deixava
   escoltar i enviar. Des del kit Codex R32.44, gravaVeu la rebutja dins d'un error 'gravacio' (recuperacio.fitxer,
   durada null, incompleta) i grava() només en fa setError(e): la persona veu «No hem pogut acabar la gravació.» i la
   nota es perd. Era ROJA a propòsit (Llei 0) fins a la v1.2.23 · X2 (ordre del Mestre 261123): grava() de
   ControlsAdjunt.jsx recull e.recuperacio (veuRecuperada) i la veu torna a la pantalla. */
import '../../../tests/helpers/diccionaris.js';
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AppGridContext } from '../../components/layout/AppGridShell.jsx';
import ControlsAdjunt from '../xat/components/ControlsAdjunt.jsx';
import Compositor from '../xat/components/Compositor.jsx';

// El port de backend, com a les proves de ControlsAdjunt: la quota arriba pel servei de la prova.
vi.mock('../../data/backendPort.js', () => ({ quotaXat: vi.fn(), teCapacitat: () => true, urlAdjuntXat: vi.fn(), descartaAdjuntXat: vi.fn() }));

const VEU_ABANS_DEL_TALL = 'veu recollida abans del tall';
const NativeURL = globalThis.URL;
let pistes;
let urlsCreades;

/* El telèfon que ja ha tallat la gravació: el gravador continua dient 'recording', però stop() llança. */
class GravadoraTallada {
  static isTypeSupported = (mime) => mime === 'audio/mp4';
  constructor() { this.state = 'inactive'; GravadoraTallada.ultima = this; }
  start() { this.state = 'recording'; this.onstart?.(); }
  stop() { throw new DOMException('El telèfon ja ha tallat la gravació', 'InvalidStateError'); }
}

const llig = (blob) => new Promise((resol, rebutja) => {
  const lector = new FileReader();
  lector.onload = () => resol(lector.result);
  lector.onerror = () => rebutja(lector.error);
  lector.readAsText(blob);
});

beforeEach(() => {
  pistes = [{ stop: vi.fn() }, { stop: vi.fn() }];
  urlsCreades = new Map();
  vi.stubGlobal('MediaRecorder', GravadoraTallada);
  vi.stubGlobal('navigator', { ...globalThis.navigator, mediaDevices: { getUserMedia: vi.fn(async () => ({ getTracks: () => pistes })) } });
  // Cada URL local apunta al seu Blob: la prova llig els bytes que de veres arriben a la pantalla.
  vi.stubGlobal('URL', Object.assign(class extends NativeURL {}, {
    createObjectURL: vi.fn((blob) => { const url = `blob:k1-veu-${urlsCreades.size}`; urlsCreades.set(url, blob); return url; }),
    revokeObjectURL: vi.fn()
  }));
  // jsdom no reproduïx: el reproductor de veu només ha de poder cridar-ho.
  for (const metode of ['pause', 'load']) vi.spyOn(HTMLMediaElement.prototype, metode).mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const enValencia = (_, alternativa) => alternativa;
function Barra() {
  const [valor, setValor] = useState('');
  const [servei] = useState(() => ({ teCapacitat: () => true, quotaXat: vi.fn().mockResolvedValue({ usats: 0, limit: 20_000_000 }) }));
  return (
    <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: () => {} }}>
      <ControlsAdjunt usuariId="persona-k1" fil={{ id: 'fil-k1' }} servei={servei} onEnvia={vi.fn()}>
        {(adjunts) => <Compositor valor={valor} onCanvia={setValor} onEnvia={() => setValor('')} t={enValencia} adjunts={adjunts} />}
      </ControlsAdjunt>
    </AppGridContext.Provider>
  );
}

/* Grava, el telèfon talla la gravació i la persona prem «Atura la gravació». Amb `onstop`, el gravador encara
   emet les últimes dades i onstop (W3C); sense, gravaVeu espera ESPERA_STOP_VEU_MS (1,5 s) i acaba igualment. */
async function gravaITalla({ onstop }) {
  render(<Barra />);
  const grava = await screen.findByRole('button', { name: 'Grava àudio' });
  await waitFor(() => expect(grava.disabled).toBe(false));
  fireEvent.click(grava);
  const atura = await screen.findByRole('button', { name: 'Atura la gravació' });
  const gravadora = GravadoraTallada.ultima;
  await act(async () => { gravadora.ondataavailable({ data: new Blob([VEU_ABANS_DEL_TALL], { type: 'audio/mp4' }) }); });
  // La persona parla un moment: el Compositor no pren per Atura el segon toc d'un doble toc (MARGE_DOBLE_TOC, 600 ms).
  await act(() => new Promise((resol) => { setTimeout(resol, 650); }));
  const parades = vi.spyOn(gravadora, 'stop');
  await act(async () => { fireEvent.click(atura); });
  // El telèfon ja havia tallat la gravació: stop() s'ha cridat i ha llançat (la neteja el pot tornar a provar).
  expect(parades).toHaveBeenCalled();
  expect(parades.mock.results.every((resultat) => resultat.type === 'throw')).toBe(true);
  if (onstop) {
    await act(async () => {
      gravadora.ondataavailable?.({ data: new Blob([' i el final'], { type: 'audio/mp4' }) });
      gravadora.onstop?.();
    });
  }
  // La gravació s'acaba (amb error o sense): el botó torna a ser «Grava àudio».
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Atura la gravació' })).toBeNull(), { timeout: 4_000 });
}

/* Les URL locals que la pantalla ensenya (src o href), amb el text del seu Blob. Si hi ha el reproductor de la
   previsualització, es prem: la font només es posa en reproduir. */
async function veuALaPantalla() {
  const reproductor = screen.queryByRole('button', { name: 'Reprodueix el missatge de veu' });
  if (reproductor) {
    await act(async () => { fireEvent.click(reproductor); });
    await waitFor(() => expect(document.querySelector('audio[src]')).not.toBeNull());
  }
  const urls = [...document.querySelectorAll('[src], [href]')]
    .map((element) => element.getAttribute('src') ?? element.getAttribute('href'))
    .filter((url) => urlsCreades.has(url));
  return Promise.all(urls.map((url) => llig(urlsCreades.get(url))));
}

describe('Llei 0 · R32.41 · El micròfon es tanca encara que el telèfon talle la gravació (de punta a punta)', () => {
  test.each([
    ['el gravador encara envia onstop', true],
    ['el gravador ja no envia onstop', false]
  ])('R32.41 · el micròfon es tanca igualment (%s)', async (_, onstop) => {
    await gravaITalla({ onstop });
    for (const pista of pistes) expect(pista.stop).toHaveBeenCalledOnce();
  });

  test.each([
    ['el gravador encara envia onstop', true],
    ['el gravador ja no envia onstop', false]
  ])('R32.41 · la veu recollida abans del tall arriba a la persona, per a escoltar-la o desar-la (%s)', async (_, onstop) => {
    await gravaITalla({ onstop });
    const textos = await veuALaPantalla();
    expect(
      textos.some((text) => text.startsWith(VEU_ABANS_DEL_TALL)),
      'La crònica R32.41 diu «es guarda la veu que ja s’havia recollit», i la pantalla no l’ofereix: grava() de ControlsAdjunt.jsx no recull error.recuperacio de gravaVeu (Codex R32.44)'
    ).toBe(true);
  });
});
