import { act, cleanup, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import {
  ATRIBUT_BARRES, BARRES_DALT, BARRES_TOTES, useBarresAmbScroll
} from './useBarresAmbScroll.js';
import { BarraReproductorVeu } from '../components/universal/veu/BarraReproductorVeu.jsx';

/* Ordre del Mestre (261012, vespre) · «Fes que les barres acompanyen l'scroll
   (que s'oculten al baixar)» i el botó «Tornar a dalt» damunt de «Pobles».
   jsdom no fa scroll ni maquetació: la geometria (clientHeight, scrollHeight,
   scrollTop i getBoundingClientRect) es posa a mà, els tokens en línia a
   l'arrel i requestAnimationFrame és síncron. */

/* ── El hook sobre un arnés amb l'anatomia de la closca ─────────────────── */
function Arnes() {
  const arrelRef = useRef(null);
  const visorRef = useRef(null);
  useBarresAmbScroll({ arrelRef, visorRef, actiu: true, clauRuta: '/legal', compacte: true });
  return (
    <div className="sdp-root is-compact" ref={arrelRef} data-testid="arrel">
      <main id="main-content" tabIndex={-1} ref={visorRef} data-testid="main">
        <div className="app-main__content" data-testid="visor">
          <div className="sdp-universal-page-container sdp-universal-page-container--page">
            <header className="bar-blue"><button type="button" data-testid="arrere">Arrere</button></header>
            <section className="bar-orange"><button type="button" aria-expanded="false" data-testid="traduir">Traduir</button></section>
            <article className="content-wrapper"><p>Una lectura de prova.</p></article>
          </div>
        </div>
      </main>
      <nav className="mobile-nav" />
    </div>
  );
}

function geometria(element, { clientHeight, scrollHeight = clientHeight, top = 64, bottom = 812 }) {
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: clientHeight });
  Object.defineProperty(element, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(element, 'scrollTop', { configurable: true, writable: true, value: 0 });
  element.getBoundingClientRect = () => ({ top, bottom, left: 0, right: 375, width: 375, height: bottom - top, x: 0, y: top });
}

/* El navegador escriu el scrollTop i dispara `scroll` (que no bombolleja). */
const desplaca = (element, y) => act(() => {
  element.scrollTop = y;
  element.dispatchEvent(new Event('scroll'));
});
const recorre = (element, posicions) => posicions.forEach((y) => desplaca(element, y));
const BAIXA = [40, 80, 120, 160, 300, 600, 1200];

function prepara(dins) {
  const arrel = dins('arrel');
  arrel.style.setProperty('--sdp-space-6', '24px');
  arrel.style.setProperty('--sdp-alt-accio', '58px');
  arrel.getBoundingClientRect = () => ({ top: 0, bottom: 812, left: 0, right: 375, width: 375, height: 812, x: 0, y: 0 });
  geometria(dins('main'), { clientHeight: 748, top: 64 });
  geometria(dins('visor'), { clientHeight: 748, scrollHeight: 5000 });
  return { arrel, visor: dins('visor') };
}

function munta() {
  const vista = render(<Arnes />);
  const dins = (id) => vista.getByTestId(id);
  return { ...vista, dins, ...prepara(dins) };
}

const vista = document.defaultView;
let rafOriginal;
beforeEach(() => {
  rafOriginal = vista.requestAnimationFrame;
  vista.requestAnimationFrame = (fn) => { fn(0); return 1; };
});
afterEach(() => {
  cleanup();
  vista.requestAnimationFrame = rafOriginal;
  document.querySelectorAll('.toc-overlay, soc-de-poble').forEach((node) => node.remove());
  vi.restoreAllMocks();
});
/* Onada R29 · Prova del kit lot_10 de Codex adaptada a la integració de Claude: en obrir la veu és el hook qui torna
   les barres a «dalt», amb un MutationObserver sobre data-sdp-veu-oberta. Eixe avís arriba en una microtasca (al
   navegador, abans de pintar): la prova l'espera abans de comprovar. */
const microtasca = () => act(async () => { await Promise.resolve(); });
test.each(['desmuntar', 'tancar'])('D1: %s la veu sense scroll intermedi restaura l’estat de les barres', async (accio) => {
  vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
  vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  const { arrel, visor, dins } = munta();
  recorre(visor, BAIXA);
  expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_TOTES);
  const cosRef = { current: dins('main') };
  const fontSo = { tipus: 'audio', pistes: [{ id: 'p1', titol: 'Pista de prova', src: '/assets/audio/prova.wav' }] };
  const barra = render(<BarraReproductorVeu oberta cosRef={cosRef} fontSo={fontSo} />);
  expect(arrel.getAttribute('data-sdp-veu-oberta')).toBe('true');
  await microtasca();
  expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_DALT);
  if (accio === 'desmuntar') barra.unmount();
  else barra.rerender(<BarraReproductorVeu oberta={false} cosRef={cosRef} fontSo={fontSo} />);
  await microtasca();
  expect(arrel.hasAttribute('data-sdp-veu-oberta')).toBe(false);
  desplaca(visor, 1300);
  expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_TOTES);
});
