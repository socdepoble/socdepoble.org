import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { useRef, useSyncExternalStore } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  ATRIBUT_BARRES, BARRES_DALT, BARRES_TOTES, CLASSES_PEU_ANCORAT, ESTAT_INICIAL, FRACCIO_VISOR, seguentEstat, useBarresAmbScroll
} from './useBarresAmbScroll.js';

/* Ordre del Mestre (261012, vespre) · «Fes que les barres acompanyen l'scroll
   (que s'oculten al baixar)» i el botó «Tornar a dalt» damunt de «Pobles».
   jsdom no fa scroll ni maquetació: la geometria (clientHeight, scrollHeight,
   scrollTop i getBoundingClientRect) es posa a mà, els tokens en línia a
   l'arrel i requestAnimationFrame és síncron. */

const MESURA = Object.freeze({ max: 2000, llindar: 24, cim: 116 });
const passos = (posicions, previ = ESTAT_INICIAL) => posicions.reduce((estat, pos) => seguentEstat(estat, { ...MESURA, pos }), previ);

describe('seguentEstat · la histèresi', () => {
  test('per davall del llindar no amaga, i dins del cim tampoc', () => {
    const repos = { amagades: false, pos: 300, acumulat: 0 };
    expect(passos([310, 320], repos).amagades).toBe(false);
    expect(passos([300 + 23], repos).amagades).toBe(false);
    // Del cim cap avall, 100px de moviment: dins de les dues alçades de barra es veuen.
    expect(passos([20, 60, 100, 116]).amagades).toBe(false);
  });

  test('amaga en baixar 24px acumulats en la mateixa direcció', () => {
    const repos = { amagades: false, pos: 300, acumulat: 0 };
    expect(passos([310, 320], repos).amagades).toBe(false);
    expect(passos([310, 320, 324], repos).amagades).toBe(true);
    // Eixint del cim cap avall ja porta l'acumulat: s'amaguen en passar-lo.
    expect(passos([40, 80, 120]).amagades).toBe(true);
  });

  test('torna en pujar 24px; canviar de direcció torna a començar el compte', () => {
    const amagades = { amagades: true, pos: 800, acumulat: 40 };
    expect(passos([790, 780], amagades).amagades).toBe(true);
    expect(passos([790, 780, 776], amagades).amagades).toBe(false);
    // Puja 10, baixa 20: el compte de baixada torna a començar (20 < 24).
    const visibles = { amagades: false, pos: 800, acumulat: -10 };
    expect(passos([820], visibles)).toEqual({ amagades: false, pos: 820, acumulat: 20 });
    expect(passos([820, 825], visibles).amagades).toBe(true);
  });

  test('al cim i al final del recorregut sempre es veuen', () => {
    const amagades = { amagades: true, pos: 800, acumulat: 100 };
    expect(seguentEstat(amagades, { ...MESURA, pos: 100 }).amagades).toBe(false);
    expect(seguentEstat(amagades, { ...MESURA, pos: MESURA.max - MESURA.llindar }).amagades).toBe(false);
    expect(seguentEstat(amagades, { ...MESURA, pos: MESURA.max - MESURA.llindar - 1 }).amagades).toBe(true);
    // Sense recorregut (pàgina curta) no s'amaguen mai.
    expect(seguentEstat(ESTAT_INICIAL, { ...MESURA, max: 0, pos: 500 }).amagades).toBe(false);
  });

  test('retalla el rebot d’iOS (scrollTop negatiu o més enllà del màxim)', () => {
    expect(seguentEstat(ESTAT_INICIAL, { ...MESURA, pos: -40 })).toEqual({ amagades: false, pos: 0, acumulat: 0 });
    const avall = seguentEstat({ amagades: true, pos: 1900, acumulat: 30 }, { ...MESURA, pos: 2080 });
    expect(avall.pos).toBe(MESURA.max);
    expect(avall.amagades).toBe(false);
  });
});

/* ── El hook sobre un arnés amb l'anatomia de la closca ─────────────────── */
const capsa = { barres: null };

function Arnes({ actiu = true, clauRuta = '/legal', extra = null }) {
  const arrelRef = useRef(null);
  const visorRef = useRef(null);
  const barres = useBarresAmbScroll({ arrelRef, visorRef, actiu, clauRuta });
  capsa.barres = barres;
  const potPujar = useSyncExternalStore(barres.subscriu, barres.potPujar, () => false);
  return (
    <div className="sdp-root is-compact" ref={arrelRef} data-testid="arrel">
      <main id="main-content" tabIndex={-1} ref={visorRef} data-testid="main">
        <div className="app-main__content" data-testid="visor">
          <div className="sdp-universal-page-container sdp-universal-page-container--page">
            <header className="bar-blue"><button type="button" data-testid="arrere">Arrere</button></header>
            <section className="bar-orange"><button type="button" aria-expanded="false" data-testid="traduir">Traduir</button></section>
            <article className="content-wrapper"><div data-testid="taula" /></article>
          </div>
        </div>
        <div className="sdp-xat-conversa"><div data-testid="xat" /></div>
        {extra}
      </main>
      <nav className="mobile-nav" />
      {potPujar ? <button type="button" className="sdp-tornar-dalt" onClick={barres.pujaADalt}>Tornar a dalt</button> : null}
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

function prepara(dins, { fonsVisor = 812, tokens = true } = {}) {
  const arrel = dins('arrel');
  if (tokens) {
    arrel.style.setProperty('--sdp-space-6', '24px');
    arrel.style.setProperty('--sdp-alt-accio', '58px');
  }
  arrel.getBoundingClientRect = () => ({ top: 0, bottom: 812, left: 0, right: 375, width: 375, height: 812, x: 0, y: 0 });
  geometria(dins('main'), { clientHeight: 748, top: 64 });
  geometria(dins('visor'), { clientHeight: 748, scrollHeight: 5000, bottom: fonsVisor });
  geometria(dins('xat'), { clientHeight: 700, scrollHeight: 5000 });
  geometria(dins('taula'), { clientHeight: Math.floor(748 * FRACCIO_VISOR) - 1, scrollHeight: 3000 });
  return { arrel, visor: dins('visor') };
}

function munta(props = {}) {
  const vista = render(<Arnes {...props} />);
  const dins = (id) => vista.getByTestId(id);
  return { ...vista, dins, ...prepara(dins, props) };
}

const vista = document.defaultView;
let rafOriginal;
let matchMediaOriginal;
/* jsdom no porta matchMedia: la preferència de moviment es posa per prova. */
const preferix = (reduida) => {
  vista.matchMedia = (consulta) => ({ matches: reduida && consulta === '(prefers-reduced-motion: reduce)', media: consulta });
};
beforeEach(() => {
  rafOriginal = vista.requestAnimationFrame;
  matchMediaOriginal = vista.matchMedia;
  vista.requestAnimationFrame = (fn) => { fn(0); return 1; };
});
afterEach(() => {
  cleanup();
  vista.requestAnimationFrame = rafOriginal;
  vista.matchMedia = matchMediaOriginal;
  document.querySelectorAll('.toc-overlay, soc-de-poble').forEach((node) => node.remove());
  vi.restoreAllMocks();
});

describe('useBarresAmbScroll · l’atribut de l’arrel', () => {
  test('en repòs no hi ha atribut; baixant, «totes» si el visor arriba a la vora de baix', () => {
    const { arrel, visor } = munta();
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
    recorre(visor, BAIXA);
    expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_TOTES);
  });

  test('«dalt» si el visor acaba abans de la vora (la barra inferior es queda)', () => {
    const { arrel, visor } = munta({ fonsVisor: 740 });
    recorre(visor, BAIXA);
    expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_DALT);
  });

  test('pujant 24px tornen, i al cim també', () => {
    const { arrel, visor } = munta();
    recorre(visor, BAIXA);
    recorre(visor, [1190, 1180]);
    expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_TOTES);
    desplaca(visor, 1176);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
    recorre(visor, [1300, 1400]);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(true);
    desplaca(visor, 0);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
  });

  test('actiu=false (escriptori o mode immersiu): cap atribut', () => {
    const { arrel, visor } = munta({ actiu: false });
    recorre(visor, BAIXA);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
  });

  test('sense els tokens del full no s’amaga res', () => {
    const { arrel, visor } = munta({ tokens: false });
    recorre(visor, BAIXA);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
  });

  test('un scroll horitzontal (scrollTop igual) no compta', () => {
    const { arrel, visor } = munta();
    recorre(visor, BAIXA);
    recorre(visor, [1190, 1180]);
    for (let i = 0; i < 5; i += 1) act(() => { visor.dispatchEvent(new Event('scroll')); });
    expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_TOTES);
    // L'acumulat de pujada (−20) no s'ha perdut: 4px més i tornen.
    desplaca(visor, 1176);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
  });

  /* Revisió adversarial 261012 · El primer scroll d'un element nou passava
     per seguentEstat amb delta 0 i, sense recorregut (max 0) o encara a dalt,
     tornava les barres: una taula de factures (.sdp-taula, overflow-x) o un
     carrusel alts lliscats de costat les feien tornar amb el visor avall. */
  test('un desplaçador alt nou que llisca de costat (una taula, un carrusel) no torna les barres', () => {
    const { arrel, visor, dins } = munta({ extra: <><div data-testid="taula-ampla" /><div data-testid="carrusel" /></> });
    geometria(dins('taula-ampla'), { clientHeight: 500 }); // sense recorregut vertical
    geometria(dins('carrusel'), { clientHeight: 500, scrollHeight: 3000 }); // amb recorregut, encara a dalt
    recorre(visor, BAIXA);
    expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_TOTES);
    for (const id of ['taula-ampla', 'carrusel']) {
      for (let i = 0; i < 3; i += 1) act(() => { dins(id).dispatchEvent(new Event('scroll')); });
      expect(arrel.getAttribute(ATRIBUT_BARRES), id).toBe(BARRES_TOTES);
    }
    expect(capsa.barres.potPujar()).toBe(false);
    // El visor continua sent el desplaçador actiu: l'acumulat de pujada hi compta.
    recorre(visor, [1190, 1176]);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
    // Control: quan el carrusel es mou en vertical, sí que compta (40px, dins del cim).
    recorre(visor, [1300, 1400]);
    expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_TOTES);
    desplaca(dins('carrusel'), 40);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
  });

  test('un desplaçador menut de dins de la pàgina, la conversa del Xat i un diàleg no compten', () => {
    const { arrel, visor, dins } = munta({ extra: <div role="dialog"><div data-testid="dins-dialeg" /></div> });
    geometria(dins('dins-dialeg'), { clientHeight: 700, scrollHeight: 4000 });
    for (const id of ['taula', 'xat', 'dins-dialeg']) {
      recorre(dins(id), BAIXA);
      expect(arrel.hasAttribute(ATRIBUT_BARRES), id).toBe(false);
    }
    // Control: res no les reté, i el visor sí que les amaga.
    recorre(visor, BAIXA);
    expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_TOTES);
  });
});

describe('useBarresAmbScroll · quan no s’amaguen', () => {
  test('amb un diàleg obert o l’Índex de la pàgina', () => {
    const { arrel, visor } = munta({ extra: <dialog open /> });
    recorre(visor, BAIXA);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
    cleanup();
    const indice = document.createElement('div');
    indice.className = 'toc-overlay';
    document.body.appendChild(indice);
    const segona = munta();
    recorre(segona.visor, BAIXA);
    expect(segona.arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
    // Control: tancat l'Índex, el mateix gest les amaga.
    indice.remove();
    recorre(segona.visor, [1300, 1400]);
    expect(segona.arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_TOTES);
  });

  test('amb un menú obert en una barra ([aria-expanded="true"]): iOS no hi deixa el focus', () => {
    const { arrel, visor, dins } = munta();
    dins('traduir').setAttribute('aria-expanded', 'true');
    recorre(visor, BAIXA);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
    dins('traduir').setAttribute('aria-expanded', 'false');
    recorre(visor, [1300, 1400]);
    expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_TOTES);
  });

  test('amb el focus de teclat dins d’una barra; el d’un toc (sense :focus-visible) no les reté', () => {
    const { arrel, visor, dins } = munta();
    const arrere = dins('arrere');
    let deTeclat = true;
    arrere.matches = (selector) => (selector === ':focus-visible' ? deTeclat : Element.prototype.matches.call(arrere, selector));
    act(() => arrere.focus());
    recorre(visor, BAIXA);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
    deTeclat = false;
    recorre(visor, [1300, 1400]);
    expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_TOTES);
  });

  test('el focus de teclat que entra en una barra amagada la torna (WCAG 2.4.11), i també un diàleg', () => {
    const { arrel, visor, dins } = munta({ extra: <dialog><button type="button" data-testid="dins">D’acord</button></dialog> });
    const arrere = dins('arrere');
    arrere.matches = (selector) => (selector === ':focus-visible' ? true : Element.prototype.matches.call(arrere, selector));
    recorre(visor, BAIXA);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(true);
    fireEvent.focusIn(arrere);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
    recorre(visor, [1300, 1400]);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(true);
    fireEvent.focusIn(dins('dins'));
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
  });

  /* Revisió adversarial 261012 · Abans del focusin, el navegador centra la
     barra enganxada que el visor retalla (Chrome amb Tab i amb focus(),
     provat al navegador: el focusin ja veu el scrollTop nou) i el contingut
     puja mig visor (−461px a 375×812). El hook torna a posar la posició
     d'abans, que el registre encara guarda. */
  test('el Tab cap a una barra amagada no desplaça el contingut: torna la posició d’abans del salt', () => {
    const { arrel, visor, dins } = munta();
    const arrere = dins('arrere');
    arrere.matches = (selector) => (selector === ':focus-visible' ? true : Element.prototype.matches.call(arrere, selector));
    recorre(visor, BAIXA);
    expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_TOTES);
    visor.scrollTop = 1200 - 461; // el salt del navegador, abans del focusin
    fireEvent.focusIn(arrere);
    expect(visor.scrollTop).toBe(1200);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
    expect(capsa.barres.potPujar()).toBe(true);
    // L'esdeveniment scroll del salt arriba després i ja no mou res.
    act(() => { visor.dispatchEvent(new Event('scroll')); });
    expect(visor.scrollTop).toBe(1200);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
    // Un focus fora de les barres (el contingut) no toca la posició.
    recorre(visor, [1300, 1400]);
    visor.scrollTop = 900;
    fireEvent.focusIn(dins('taula'));
    expect(visor.scrollTop).toBe(900);
  });

  test('el canvi de ruta reinicia: barres a la vista i cap botó', () => {
    const { arrel, visor, rerender } = munta();
    recorre(visor, BAIXA);
    recorre(visor, [1190, 1170]);
    expect(capsa.barres.potPujar()).toBe(true);
    recorre(visor, [1300, 1400]);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(true);
    rerender(<Arnes clauRuta="/mur" />);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
    expect(capsa.barres.potPujar()).toBe(false);
  });
});

describe('useBarresAmbScroll · cicle de vida i arrel ombra', () => {
  test('en desmuntar es lleva l’atribut i es retiren els escoltadors', () => {
    const { arrel, visor, unmount } = munta();
    const retira = vi.spyOn(arrel, 'removeEventListener');
    recorre(visor, BAIXA);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(true);
    unmount();
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
    expect(retira.mock.calls.map(([tipus]) => tipus).sort()).toEqual(['focusin', 'scroll']);
    // L'arrel desmuntada ja no escolta: un scroll no hi torna a escriure.
    recorre(visor, [1300, 1400, 1500]);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
  });

  test('dins d’una arrel ombra (<soc-de-poble>) el scroll es captura a l’arrel de l’app', () => {
    const amfitrio = document.createElement('soc-de-poble');
    document.body.appendChild(amfitrio);
    const ombra = amfitrio.attachShadow({ mode: 'closed' });
    const punt = document.createElement('div');
    ombra.appendChild(punt);
    render(<Arnes />, { container: punt });
    const dins = (id) => ombra.querySelector(`[data-testid="${id}"]`);
    const { arrel, visor } = prepara(dins);
    recorre(visor, BAIXA);
    expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_TOTES);
  });
});

describe('useBarresAmbScroll · el botó «Tornar a dalt»', () => {
  test('l’store només avisa quan canvia potPujar', () => {
    const { visor } = munta();
    const avisos = vi.fn();
    const deixa = capsa.barres.subscriu(avisos);
    recorre(visor, BAIXA); // amagades: potPujar continua fals
    expect(avisos).not.toHaveBeenCalled();
    recorre(visor, [1190, 1170, 1160, 1150]); // tornen amb 1170 > 748: un avís
    expect(avisos).toHaveBeenCalledTimes(1);
    expect(capsa.barres.potPujar()).toBe(true);
    recorre(visor, [700, 600]); // per davall d'una pantalla: un altre
    expect(avisos).toHaveBeenCalledTimes(2);
    expect(capsa.barres.potPujar()).toBe(false);
    deixa();
  });

  /* Revisió adversarial 261012 · Abans, al final del recorregut el botó
     apareixia damunt de l'última fila («Connectar +» de l'última targeta de
     /pobles, tapat un 76%), i al final ja no es pot baixar més per a
     traure-la de davall. Ara les barres hi tornen però el botó no; en pujar
     fora del final, apareix. Sense tocar cap coixí: la pintura inicial i el
     recorregut de cap pàgina no canvien. */
  test('al final del recorregut les barres tornen però el botó no; pujant fora del final, apareix', () => {
    const { arrel, visor } = munta();
    const max = 5000 - 748;
    recorre(visor, [...BAIXA, 2400, max - 40]);
    expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_TOTES);
    expect(capsa.barres.potPujar()).toBe(false);
    desplaca(visor, max);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
    expect(capsa.barres.potPujar()).toBe(false);
    expect(arrel.querySelector('.sdp-tornar-dalt')).toBeNull();
    desplaca(visor, max - 10); // encara dins del final (el llindar, 24px)
    expect(capsa.barres.potPujar()).toBe(false);
    desplaca(visor, max - 30);
    expect(arrel.hasAttribute(ATRIBUT_BARRES)).toBe(false);
    expect(capsa.barres.potPujar()).toBe(true);
    expect(arrel.querySelector('.sdp-tornar-dalt')).not.toBeNull();
    // Tornant al final se'n va: l'última fila queda lliure.
    desplaca(visor, max);
    expect(capsa.barres.potPujar()).toBe(false);
  });

  test('pujaADalt porta el visor a dalt amb moviment suau i el focus al <main>', () => {
    const { visor, dins } = munta();
    visor.scrollTo = vi.fn();
    preferix(false);
    recorre(visor, BAIXA);
    recorre(visor, [1190, 1170]);
    act(() => dins('arrel').querySelector('.sdp-tornar-dalt').click());
    expect(visor.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(document.activeElement).toBe(dins('main'));
  });

  test('amb moviment reduït el salt és instantani', () => {
    const { visor } = munta();
    visor.scrollTo = vi.fn();
    preferix(true);
    recorre(visor, BAIXA);
    recorre(visor, [1190, 1170]);
    act(() => capsa.barres.pujaADalt());
    expect(visor.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });
});

/* Revisió adversarial 261012 · Els peus ancorats a baix reserven l'alçada de
   la barra inferior (modules.css): amb «totes» la reserva quedava buida i
   «Cancel·lar» i «Desar autoria» (o el compositor del Xat en tauleta) quedaven
   suspesos sobre una franja buida; i el botó «Tornar a dalt» queia damunt de
   «Desar autoria» i del botó d'enviar. */
describe('useBarresAmbScroll · amb un peu ancorat a baix', () => {
  test('per a cada peu: la barra inferior es queda («dalt», mai «totes») i el botó no apareix', () => {
    expect(CLASSES_PEU_ANCORAT).toEqual(['sdp-drets__peu', 'sdp-xat-compositor', 'sdp-xat-fitxa-comunitat__peu']);
    for (const classe of CLASSES_PEU_ANCORAT) {
      const { arrel, visor, unmount } = munta({ extra: <div className={classe} /> });
      recorre(visor, BAIXA);
      expect(arrel.getAttribute(ATRIBUT_BARRES), classe).toBe(BARRES_DALT);
      recorre(visor, [1190, 1170]);
      expect(arrel.hasAttribute(ATRIBUT_BARRES), classe).toBe(false);
      expect(capsa.barres.potPujar(), classe).toBe(false);
      expect(arrel.querySelector('.sdp-tornar-dalt'), classe).toBeNull();
      unmount();
    }
  });

  test('un peu que apareix sense canviar de ruta (la conversa que s’obri) també compta', () => {
    const { arrel, visor, rerender } = munta();
    recorre(visor, BAIXA);
    recorre(visor, [1190, 1170]);
    expect(capsa.barres.potPujar()).toBe(true);
    rerender(<Arnes extra={<form className="sdp-xat-compositor" />} />);
    recorre(visor, [1300, 1400]);
    expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_DALT);
    recorre(visor, [1390, 1370]);
    expect(capsa.barres.potPujar()).toBe(false);
  });

  test('dins d’un espècimen del catàleg (.sdp-especimen) no compta: el marc no toca la barra', () => {
    const { arrel, visor } = munta({ extra: <section className="sdp-especimen"><footer className="sdp-drets__peu" /></section> });
    recorre(visor, BAIXA);
    expect(arrel.getAttribute(ATRIBUT_BARRES)).toBe(BARRES_TOTES);
    recorre(visor, [1190, 1170]);
    expect(capsa.barres.potPujar()).toBe(true);
  });
});
