import '../../../../tests/helpers/diccionaris.js';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import AdjuntXat, { TOTAL_BARRES_ONA_VEU, _reiniciaVeus, barresDOnaDeVeu } from './AdjuntXat.jsx';
import { createTranslator } from '../../../config/i18n.js';

const mocks = vi.hoisted(() => ({ urlAdjuntXat: vi.fn() }));
vi.mock('../../../data/backendPort.js', () => ({
  urlAdjuntXat: mocks.urlAdjuntXat,
  teCapacitat: () => true
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.urlAdjuntXat.mockResolvedValue('https://node.test/storage/v1/object/sign/xat_adjunts/sofia?token=1');
  for (const metode of ['pause', 'load']) vi.spyOn(HTMLMediaElement.prototype, metode).mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
});

afterEach(() => {
  cleanup();
  _reiniciaVeus();
  vi.restoreAllMocks();
});

const CONFIG = Object.freeze({ dataMode: 'remote' });
const VEU = Object.freeze({ id: 'veu-sofia-38', mime: 'audio/mp4', duradaMs: 38_000 });

describe('R32.6 · Lot 01 (P0-119) · Reproductor de notes de veu estil WhatsApp en Pedra Seca', () => {
  test('barresDOnaDeVeu és 100 % determinista per nota i acota tots els nivells entre 0 i 7', () => {
    const a1 = barresDOnaDeVeu('usuari-1/veu-sofia-38');
    const a2 = barresDOnaDeVeu('usuari-1/veu-sofia-38');
    const b = barresDOnaDeVeu('usuari-1/veu-altra-99');

    expect(a1).toHaveLength(TOTAL_BARRES_ONA_VEU);
    expect(a1).toEqual(a2);
    expect(a1).not.toEqual(b);
    for (const nivell of a1) {
      expect(Number.isInteger(nivell)).toBe(true);
      expect(nivell).toBeGreaterThanOrEqual(0);
      expect(nivell).toBeLessThanOrEqual(7);
    }
  });

  test('pinta ona determinista sense style= en línia i sincronitza les barres actives amb timeupdate i amb el lliscant accessible', async () => {
    const { container } = render(
      <AdjuntXat adjunt={VEU} tipus="veu" externalConfig={CONFIG} usuariId="u-javi" />
    );

    expect(container.querySelectorAll('[style]')).toHaveLength(0);
    const ona = container.querySelector('.sdp-xat-veu__ona');
    expect(ona).not.toBeNull();
    expect(ona.getAttribute('aria-hidden')).toBe('true');

    const totes = () => container.querySelectorAll('.sdp-xat-veu__barra');
    const actives = () => container.querySelectorAll('.sdp-xat-veu__barra--activa');
    expect(totes()).toHaveLength(TOTAL_BARRES_ONA_VEU);
    expect(actives()).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' }));
    const audio = container.querySelector('audio');
    await waitFor(() => expect(audio.getAttribute('src')).toContain('token=1'));
    fireEvent.play(audio);

    // 50 % de 38 s = 19 s -> exactament la meitat de les barres en estat actiu
    Object.defineProperty(audio, 'currentTime', { configurable: true, writable: true, value: 19 });
    fireEvent.timeUpdate(audio);
    expect(actives()).toHaveLength(TOTAL_BARRES_ONA_VEU / 2);
    expect(screen.getByRole('slider', { name: 'Posició del missatge de veu' }).getAttribute('aria-valuetext')).toBe('0:19 de 0:38');

    // Arrossegar o moure per teclat el lliscant a 28.5 s (75 %) actualitza síncronament l'ona i el rellotge
    const slider = screen.getByRole('slider', { name: 'Posició del missatge de veu' });
    fireEvent.change(slider, { target: { value: '28.5' } });
    expect(actives()).toHaveLength((TOTAL_BARRES_ONA_VEU * 3) / 4);
    expect(container.querySelector('.sdp-xat-veu__temps')?.textContent).toBe('0:28');

    // En acabar la nota de veu, l'ona torna a repòs i el rellotge mostra la durada total 0:38
    fireEvent.ended(audio);
    expect(actives()).toHaveLength(0);
    expect(container.querySelector('.sdp-xat-veu__temps')?.textContent).toBe('0:38');
  });

  test('la pastilla compacta de velocitat es munta dins de la diana tàctil i tradueix totes les etiquetes en les 5 llengües (ca, es, en, eu, gl)', async () => {
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      const t = createTranslator(lang);
      const { container } = render(
        <AdjuntXat adjunt={VEU} tipus="veu" externalConfig={CONFIG} usuariId={`u-${lang}`} t={t} locale={lang === 'en' ? 'en-GB' : 'ca-ES'} />
      );
      const botoPlay = container.querySelector('.sdp-xat-veu__boto');
      expect(botoPlay?.getAttribute('aria-label')?.trim().length).toBeGreaterThan(0);
      fireEvent.click(botoPlay);
      const audio = container.querySelector('audio');
      await waitFor(() => expect(audio.getAttribute('src')).toBeTruthy());
      fireEvent.play(audio);

      const botoVel = container.querySelector('.sdp-xat-veu__velocitat');
      const pindolaVel = container.querySelector('.sdp-xat-veu__velocitat-pindola');
      expect(botoVel).not.toBeNull();
      expect(pindolaVel).not.toBeNull();
      expect(pindolaVel.textContent).toBe('1×');
      fireEvent.click(botoVel);
      expect(pindolaVel.textContent).toBe(lang === 'en' ? '1.5×' : '1,5×');

      cleanup();
      _reiniciaVeus();
    }
  });
});
