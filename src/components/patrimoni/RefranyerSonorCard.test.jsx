import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CATEGORIES_REFRANYER, REFRANYS_DE_POBLE_SEED } from './refranysDePobleSeed.js';
import { RefranyerSonorCard } from './RefranyerSonorCard.jsx';

describe('RefranyerSonorCard · cercador comarcal i gravadora MediaRecorder amb Llei 0', () => {
  let stopTrackSpy;

  beforeEach(() => {
    localStorage.clear();
    stopTrackSpy = vi.fn();

    globalThis.URL.createObjectURL = vi.fn(() => 'blob:https://socdepoble.org/mostra-refrany');
    globalThis.URL.revokeObjectURL = vi.fn();

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      writable: true,
      value: {
        getUserMedia: vi.fn(async () => ({
          getTracks: () => [{ stop: stopTrackSpy }],
        })),
      },
    });

    globalThis.MediaRecorder = class MockMediaRecorder {
      static isTypeSupported(mime) {
        return mime === 'audio/webm;codecs=opus';
      }

      constructor() {
        this.state = 'inactive';
        this.mimeType = 'audio/webm;codecs=opus';
        this.ondataavailable = null;
        this.onstop = null;
        this.onerror = null;
      }

      start() {
        this.state = 'recording';
      }

      stop() {
        this.state = 'inactive';
        const blob = new Blob(['mostra-audio-de-poble'], { type: 'audio/webm' });
        this.ondataavailable?.({ data: blob });
        this.onstop?.();
      }
    };
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test('conté 32 refranys curats en 4 àmbits temàtics (8 per àmbit), zero dites ofensives i filtra sense accents', () => {
    expect(REFRANYS_DE_POBLE_SEED).toHaveLength(32);
    expect(CATEGORIES_REFRANYER).toHaveLength(5);

    /* Guarda permanent d'empatia humana i no-ofensa: cap dita amb estigmes ètnics ni despectius */
    const textComplet = JSON.stringify(REFRANYS_DE_POBLE_SEED);
    expect(textComplet).not.toMatch(/gitan[oa]|mor[oa]s?\b|jueu|xarneg|foraster\s+mal/i);

    render(<RefranyerSonorCard />);
    expect(screen.getAllByText(/Escoltar en veu alta/)).toHaveLength(32);

    fireEvent.click(screen.getByRole('button', { name: 'Oratge i aigua' }));
    expect(screen.getAllByText(/Escoltar en veu alta/)).toHaveLength(8);

    fireEvent.click(screen.getByRole('button', { name: 'Tots els àmbits' }));
    fireEvent.change(screen.getByLabelText(/Cerca per paraula/), { target: { value: 'aitana' } });
    expect(screen.getByText(/Quan Aitana posa capell/)).toBeTruthy();
  });

  test('grava àudio amb MediaRecorder, allibera el micròfon, mostra preescolta i exigeix consentiment CC BY-SA 4.0', async () => {
    render(<RefranyerSonorCard />);

    const botonsGrava = screen.getAllByRole('button', { name: 'Grava com es diu al teu poble' });
    fireEvent.click(botonsGrava[0]);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Comença a gravar (màx. 15 s)' }));
    });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Atura la gravació' }));
    });

    await waitFor(() => {
      expect(screen.getByLabelText('Preescolta de la teua gravació')).toBeTruthy();
    });
    expect(stopTrackSpy).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: /Descarrega l’àudio/ }).getAttribute('href')).toBe('blob:https://socdepoble.org/mostra-refrany');

    fireEvent.change(screen.getByLabelText('Poble i comarca'), { target: { value: 'Penàguila (L’Alcoià)' } });

    /* Sense marcar el consentiment mostra error */
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Desar aportació oral' }));
    });
    expect(screen.getByText(/Marca la casella de consentiment lliure/)).toBeTruthy();

    fireEvent.click(screen.getByRole('checkbox'));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Desar aportació oral' }));
    });
    expect(screen.getByText(/Aportació anotada en este dispositiu/)).toBeTruthy();
  });

  test('R23-U02: si localStorage falla en desar mostra avís d’error honest i manté disponible la descàrrega d’àudio', async () => {
    render(<RefranyerSonorCard />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Grava com es diu al teu poble' })[0]);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Comença a gravar (màx. 15 s)' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Atura la gravació' }));
    });

    fireEvent.change(screen.getByLabelText('Poble i comarca'), { target: { value: 'Agres (El Comtat)' } });
    fireEvent.click(screen.getByRole('checkbox'));

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    try {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Desar aportació oral' }));
      });
      expect(screen.getByText(/memòria local del navegador està plena o blocada/i)).toBeTruthy();
      expect(screen.queryByText(/Aportació anotada en este dispositiu/)).toBeNull();
      expect(screen.getByRole('link', { name: /Descarrega l’àudio/ })).toBeTruthy();
    } finally {
      setItemSpy.mockRestore();
    }
  });
});
