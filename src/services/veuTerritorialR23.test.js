import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CLAU_VEU_PREFERIDA,
  IDS_VEU_VALIDA,
  VEUS_TERRITORIALS,
  VEU_AUTO_NAVEGADOR,
  VEU_PER_DEFECTE,
  desaVeuPreferida,
  esVeuValida,
  llegeixVeuPreferida,
  normalitzaIdVeu,
  reiniciaPreferenciaVeuPerProves,
  subscriuVeuPreferida,
} from './veusTerritorials.js';
import { fixaPuntNode0, parla, reiniciaVeuPerProves } from './veuIaiaService.js';

describe('veusTerritorials · enum tancat i persistència sanejada', () => {
  beforeEach(() => {
    localStorage.clear();
    reiniciaPreferenciaVeuPerProves();
  });

  afterEach(() => {
    localStorage.clear();
    reiniciaPreferenciaVeuPerProves();
    vi.restoreAllMocks();
  });

  test('exposa exactament les 7 veus obertes Matxa-TTS v2 més la veu nativa del dispositiu', () => {
    expect(VEUS_TERRITORIALS).toHaveLength(8);
    expect(IDS_VEU_VALIDA).toEqual([
      'gina_valencia',
      'arnau_valencia',
      'berta_valencia',
      'lluc_valencia',
      'emma_occidental',
      'elia_central',
      'olga_balear',
      'auto_navegador',
    ]);
  });

  test('rebutja qualsevol identificador desconegut o maliciós i torna sempre a gina_valencia', () => {
    expect(esVeuValida('arnau_valencia')).toBe(true);
    expect(esVeuValida('../../etc/passwd')).toBe(false);
    expect(normalitzaIdVeu('script:alert(1)')).toBe(VEU_PER_DEFECTE);

    localStorage.setItem(CLAU_VEU_PREFERIDA, 'veu_inventada_99');
    expect(llegeixVeuPreferida()).toBe(VEU_PER_DEFECTE);
  });

  test('desa la preferència vàlida en localStorage i notifica els subscriptors', () => {
    const notificacions = [];
    const desubscriu = subscriuVeuPreferida((novaVeu) => notificacions.push(novaVeu));

    const desada = desaVeuPreferida('emma_occidental');
    expect(desada).toBe('emma_occidental');
    expect(localStorage.getItem(CLAU_VEU_PREFERIDA)).toBe('emma_occidental');
    expect(llegeixVeuPreferida()).toBe('emma_occidental');
    expect(notificacions).toEqual(['emma_occidental']);

    desubscriu();
  });
});

describe('veuIaiaService + veuNode0 · propagació de veu territorial i degradació neta', () => {
  let utterances = [];

  beforeEach(() => {
    utterances = [];
    localStorage.clear();
    reiniciaVeuPerProves();
    fixaPuntNode0('https://veu-node0.test/api/tts');

    globalThis.SpeechSynthesisUtterance = class MockUtterance {
      constructor(text) {
        this.text = text;
        this.lang = '';
        this.voice = null;
        this.onend = null;
        this.onerror = null;
        utterances.push(this);
      }
    };

    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      writable: true,
      value: {
        cancel: vi.fn(),
        getVoices: () => [{ lang: 'ca-ES', name: 'Valencià Local' }],
        speak: vi.fn((u) => {
          queueMicrotask(() => u.onend?.());
        }),
      },
    });
  });

  afterEach(() => {
    reiniciaVeuPerProves();
    vi.restoreAllMocks();
  });

  test('envia el camp "veu" al POST del Node 0 segons la veu preferida triada', async () => {
    desaVeuPreferida('arnau_valencia');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).endsWith('/salut')) {
        return { ok: true, status: 200, headers: new Headers() };
      }
      return { ok: false, status: 503, headers: new Headers() };
    });

    await parla('Bon dia des de la Muntanya d’Alacant.');

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const [urlSalut] = fetchSpy.mock.calls[0];
    expect(urlSalut).toBe('https://veu-node0.test/api/tts/salut');

    const [urlPost, initPost] = fetchSpy.mock.calls[1];
    expect(urlPost).toBe('https://veu-node0.test/api/tts');
    expect(JSON.parse(initPost.body)).toEqual({
      text: 'Bon dia des de la Muntanya d’Alacant.',
      idioma: 'ca',
      veu: 'arnau_valencia',
    });
    /* Com que el POST del Node 0 ha tornat 503, cau netament a speechSynthesis local. */
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(utterances[0].text).toContain('Bon dia');
  });

  test('amb auto_navegador omet la crida de xarxa al Node 0 i llig directament amb speechSynthesis', async () => {
    desaVeuPreferida(VEU_AUTO_NAVEGADOR);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await parla(' Text llegit pel motor natiu del dispositiu. ');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
  });
});
