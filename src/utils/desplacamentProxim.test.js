/**
 * Onada R26.3 · desplacamentProxim: el salt de proximitat de CENS01 i CENS02 és el canònic de
 * l'app (desplacaASeccio). La prova de les barres enganxades fa caure la primera versió del kit,
 * que deixava el destí a 16 px del cim del visor, tapat per la barra.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { desplacaDinsApp, enfocaSenseSalt } from './desplacamentProxim.js';

const defineix = (node, props) => {
  for (const [nom, valor] of Object.entries(props)) Object.defineProperty(node, nom, { value: valor, configurable: true });
};

/** .sdp-root > visor (scroll propi) > .sdp-universal-page-container > [barra enganxada de 100 px, destí]. */
function munta({ ambBarra = true } = {}) {
  const arrel = document.createElement('div');
  arrel.className = 'sdp-root';
  const visor = document.createElement('div');
  visor.style.overflowY = 'auto';
  defineix(visor, { scrollHeight: 3000, clientHeight: 640, clientTop: 0, scrollTo: vi.fn() });
  visor.getBoundingClientRect = () => ({ top: 0, bottom: 640 });
  const pagina = document.createElement('div');
  pagina.className = 'sdp-universal-page-container';
  if (ambBarra) {
    const barra = document.createElement('div');
    barra.style.position = 'sticky';
    barra.style.top = '0px';
    defineix(barra, { offsetHeight: 100 });
    pagina.appendChild(barra);
  }
  const desti = document.createElement('div');
  desti.tabIndex = -1;
  desti.getBoundingClientRect = () => ({ top: 600, bottom: 700 });
  pagina.appendChild(desti);
  visor.appendChild(pagina);
  arrel.appendChild(visor);
  document.body.appendChild(arrel);
  return { arrel, visor, desti };
}

const vista = () => document.defaultView;
const matchMediaOriginal = vista().matchMedia;
const preferix = (reduit) => {
  vista().matchMedia = (q) => ({ matches: reduit && q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} });
};

afterEach(() => {
  document.body.replaceChildren();
  vista().matchMedia = matchMediaOriginal;
});

describe('desplacamentProxim', () => {
  test('deixa el destí per davall de la barra enganxada i mou només el visor de l’app', () => {
    const { visor, desti } = munta();
    const finestra = vi.spyOn(vista(), 'scrollTo').mockImplementation(() => {});
    expect(desplacaDinsApp(desti)).toBe(true);
    expect(visor.scrollTo).toHaveBeenCalledTimes(1);
    expect(visor.scrollTo.mock.calls[0][0].top).toBe(500);
    expect(finestra).not.toHaveBeenCalled();
    finestra.mockRestore();
  });

  test('moviment reduït: salt immediat; si no, suau', () => {
    const { visor, desti } = munta({ ambBarra: false });
    preferix(true);
    desplacaDinsApp(desti);
    expect(visor.scrollTo.mock.calls[0][0]).toEqual({ top: 600, behavior: 'auto' });
    preferix(false);
    desplacaDinsApp(desti);
    expect(visor.scrollTo.mock.calls[1][0]).toEqual({ top: 600, behavior: 'smooth' });
  });

  test('sense destí no fa res, i el focus no demana cap salt', () => {
    expect(desplacaDinsApp(null)).toBe(false);
    expect(enfocaSenseSalt(null)).toBe(false);
    const { desti } = munta();
    const focus = vi.spyOn(desti, 'focus');
    expect(enfocaSenseSalt(desti)).toBe(true);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(desti);
  });
});
