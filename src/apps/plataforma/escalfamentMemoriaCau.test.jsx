/* Plataforma d'Apps Enxufables · l'avís que escalfa la memòria cau de les apps
   (escalfamentMemoriaCau.js, ordre del Mestre del 261007). El component només
   avisa la pàgina, sense cap dada, i només quan és l'ama del document; el
   worker el toca src/pwa/registre.js, a l'entrada pròpia (registre.test.js). */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, screen } from '@testing-library/react';
import { muntaPlataforma } from './__fixtures__/munta.jsx';
import { manifestDeProva } from './__fixtures__/manifests.js';
import { ESDEVENIMENT_APP_VISITADA, anunciaAppVisitada } from './escalfamentMemoriaCau.js';
import { creaRegistre } from './registreApps.js';

/** Una finestra de mostra: un EventTarget amb el que mira esAmaDelDocument. */
function finestraDeMostra({ incrustada = false, encastada = false } = {}) {
  const finestra = new EventTarget();
  finestra.Event = Event;
  finestra.self = finestra;
  finestra.top = incrustada ? {} : finestra;
  finestra.__SDP_EMBEDDED__ = encastada;
  return finestra;
}

const registreDeProva = () => creaRegistre({ internes: [manifestDeProva()] });

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
});

describe('anunciaAppVisitada', () => {
  test('al lloc propi (ama del document) avisa la pàgina amb un esdeveniment sense cap dada', () => {
    const finestra = finestraDeMostra();
    const rebuts = [];
    finestra.addEventListener(ESDEVENIMENT_APP_VISITADA, (esdeveniment) => rebuts.push(esdeveniment));
    expect(anunciaAppVisitada({ manageDocumentHead: true }, finestra)).toBe(true);
    expect(rebuts).toHaveLength(1);
    expect(rebuts[0].type).toBe('sdp:app-visitada');
    expect(rebuts[0].detail).toBeUndefined();
  });

  test('dins d\'un amfitrió (WordPress, Sollutia), d\'un iframe o sense finestra, cap avís', () => {
    const escolta = vi.fn();
    for (const [config, finestra] of [
      [{}, finestraDeMostra()],
      [undefined, finestraDeMostra()],
      [{ manageDocumentHead: false }, finestraDeMostra()],
      [{ manageDocumentHead: true }, finestraDeMostra({ encastada: true })],
      [{ manageDocumentHead: true }, finestraDeMostra({ incrustada: true })]
    ]) {
      finestra.addEventListener(ESDEVENIMENT_APP_VISITADA, escolta);
      expect(anunciaAppVisitada(config, finestra), JSON.stringify(config)).toBe(false);
    }
    expect(anunciaAppVisitada({ manageDocumentHead: true }, null)).toBe(false);
    expect(escolta).not.toHaveBeenCalled();
  });

  test('si l\'avís falla, no llança', () => {
    const finestra = finestraDeMostra();
    finestra.dispatchEvent = () => { throw new Error('InvalidStateError'); };
    expect(anunciaAppVisitada({ manageDocumentHead: true }, finestra)).toBe(false);
  });
});

describe('useEscalfamentMemoriaCau dins de RutaApps', () => {
  test('al lloc propi, RutaApps avisa una vegada en muntar-se', async () => {
    const escolta = vi.fn();
    window.addEventListener(ESDEVENIMENT_APP_VISITADA, escolta);
    try {
      muntaPlataforma('/app/prova/inici', { registre: registreDeProva(), externalConfig: { manageDocumentHead: true } });
      await screen.findByTestId('ubicacio');
      expect(document.querySelector('.sdp-app-contenidor')).toBeTruthy();
      expect(escolta).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener(ESDEVENIMENT_APP_VISITADA, escolta);
    }
  });

  /* Revisió F1 (261007): una closca per app. Passar d'una vista o d'una app a
     una altra no torna a muntar RutaApps, i la pàgina ha de saber-ho. */
  test('dins de /app/*, cada canvi de ruta torna a avisar; l\'avís continua sense cap dada', async () => {
    const rebuts = [];
    const escolta = (esdeveniment) => rebuts.push(esdeveniment);
    window.addEventListener(ESDEVENIMENT_APP_VISITADA, escolta);
    try {
      muntaPlataforma('/app/prova/inici', { registre: registreDeProva(), externalConfig: { manageDocumentHead: true } });
      await screen.findByTestId('ubicacio');
      expect(rebuts).toHaveLength(1);
      act(() => {
        window.history.pushState(null, '', '/app/prova/caixa');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      expect((await screen.findByTestId('ubicacio')).textContent).toBe('/app/prova/caixa');
      expect(rebuts).toHaveLength(2);
      expect(rebuts.every((esdeveniment) => esdeveniment.detail === undefined)).toBe(true);
    } finally {
      window.removeEventListener(ESDEVENIMENT_APP_VISITADA, escolta);
    }
  });

  test('dins d\'un amfitrió (sense manageDocumentHead) o fora de /app/*, cap avís', async () => {
    const escolta = vi.fn();
    window.addEventListener(ESDEVENIMENT_APP_VISITADA, escolta);
    try {
      muntaPlataforma('/app/prova/inici', { registre: registreDeProva(), externalConfig: {} });
      await screen.findByTestId('ubicacio');
      expect(document.querySelector('.sdp-app-contenidor')).toBeTruthy();
      cleanup();
      muntaPlataforma('/mur', { registre: registreDeProva(), externalConfig: { manageDocumentHead: true } });
      expect(await screen.findByText('Fora de les apps')).toBeTruthy();
      expect(escolta).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(ESDEVENIMENT_APP_VISITADA, escolta);
    }
  });
});
