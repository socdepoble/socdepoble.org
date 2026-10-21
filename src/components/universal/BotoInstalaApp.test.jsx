/* Ordre del Mestre (261021, prompt 261021_0015, tasca 3) · «Instal·la al teu
   ordinador» a la barra negra. El UIProvider de veres i el magatzem de la
   pàgina (INSTALACIO), amb una finestra de mostra que porta l'esdeveniment:
   jsdom no en té, com Safari i Firefox. */
import '../../../tests/helpers/diccionaris.js';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { INSTALACIO } from '../../pwa/instalacio.js';
import { BotoInstalaApp } from './BotoInstalaApp.jsx';

/* Una finestra de Chrome d'escriptori per al magatzem de la pàgina; torna la
   funció que dispara l'oferta i la que la retira com si s'haguera instal·lat. */
function capturaDeMostra() {
  const escoltes = new Map();
  const finestra = {
    onbeforeinstallprompt: null,
    isSecureContext: true,
    matchMedia: () => ({ matches: false }),
    addEventListener: (tipus, funcio) => escoltes.set(tipus, funcio),
    removeEventListener: (tipus) => escoltes.delete(tipus)
  };
  finestra.self = finestra;
  finestra.top = finestra;
  const captura = INSTALACIO.captura({ finestra, navegador: { userAgentData: { mobile: false } } });
  expect(captura.escolta).toBe(true);
  return {
    ofereix: (e) => act(() => { escoltes.get('beforeinstallprompt')(e); }),
    instalada: () => act(() => { escoltes.get('appinstalled')?.({}); }),
    deixa: captura.deixa
  };
}

const oferta = () => ({ preventDefault: vi.fn(), prompt: vi.fn(() => Promise.resolve({ outcome: 'accepted' })) });

function Barra({ externalConfig = { manageDocumentHead: true } }) {
  return (
    <UIProvider externalConfig={externalConfig}>
      <header className="bar-black"><div className="right-icons"><BotoInstalaApp /></div></header>
    </UIProvider>
  );
}

let pagina = null;
// El UIProvider escolta el tema del sistema: jsdom no porta matchMedia.
beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
});
afterEach(() => {
  pagina?.instalada();
  pagina?.deixa();
  pagina = null;
  delete window.__SDP_EMBEDDED__;
  cleanup();
  vi.unstubAllGlobals();
});

describe('BotoInstalaApp', () => {
  test('sense oferta (Safari, Firefox, jsdom, ja instal·lada) no pinta res', () => {
    const { container } = render(<Barra />);
    expect(container.querySelector('.right-icons').children).toHaveLength(0);
  });

  test('amb l\'oferta: una pastilla amb el rètol com a nom, la icona amagada i el text llarg al title', () => {
    pagina = capturaDeMostra();
    render(<Barra />);
    pagina.ofereix(oferta());
    const boto = screen.getByRole('button', { name: 'Instal·la al teu ordinador' });
    expect(boto.className).toBe('sdp-top-bar-btn sdp-top-bar-btn--instal');
    expect(boto.getAttribute('type')).toBe('button');
    expect(boto.getAttribute('aria-label')).toBe(boto.textContent);
    expect(boto.getAttribute('title')).toBe('Instal·la Sóc de Poble al teu ordinador com a aplicació, en una finestra pròpia');
    expect(boto.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(boto.querySelector('.sdp-top-bar-btn__rotul').textContent).toBe('Instal·la al teu ordinador');
  });

  test('el clic obri el diàleg natiu (prompt dins del clic) i el botó se\'n va', () => {
    pagina = capturaDeMostra();
    render(<Barra />);
    const e = oferta();
    pagina.ofereix(e);
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Instal·la al teu ordinador' })); });
    expect(e.prompt).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('appinstalled (instal·lada pel menú del navegador) també el retira', () => {
    pagina = capturaDeMostra();
    render(<Barra />);
    pagina.ofereix(oferta());
    expect(screen.getByRole('button')).toBeTruthy();
    pagina.instalada();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('si l\'app no és l\'ama del document (incrustada o sense manageDocumentHead), res', () => {
    pagina = capturaDeMostra();
    pagina.ofereix(oferta());
    const { unmount } = render(<Barra externalConfig={{}} />);
    expect(screen.queryByRole('button')).toBeNull();
    unmount();
    window.__SDP_EMBEDDED__ = true;
    render(<Barra />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  test.each([
    ['es', 'Instala en tu ordenador', 'Instala Sóc de Poble en tu ordenador como aplicación, en una ventana propia'],
    ['en', 'Install on your computer', 'Install Sóc de Poble on your computer as an app in its own window'],
    ['eu', 'Instalatu zure ordenagailuan', 'Instalatu Sóc de Poble zure ordenagailuan aplikazio gisa, bere leihoan'],
    ['gl', 'Instala no teu ordenador', 'Instala Sóc de Poble no teu ordenador como aplicación, nunha xanela propia']
  ])('%s: el rètol i el title en la llengua de l\'amfitrió', (language, rotul, titol) => {
    pagina = capturaDeMostra();
    pagina.ofereix(oferta());
    render(<Barra externalConfig={{ manageDocumentHead: true, language }} />);
    const boto = screen.getByRole('button', { name: rotul });
    expect(boto.getAttribute('title')).toBe(titol);
  });
});
