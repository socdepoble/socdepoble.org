/**
 * Ordre del Mestre (261007) · «Comentaris = xat» · Comentar de la barra blava
 * obri un menú amb dues vies: «En privat» (el xat privat amb Sóc de Poble) i
 * «En públic» (el xat públic de l'element, amb el seu títol com a nom). És el
 * MATEIX botó del peu de la targeta (BotoComentar) i el MATEIX patró que el
 * menú de Traduir: rols menu/menuitem, aria-haspopup i aria-expanded, el focus
 * que entra a la primera fila i torna a Comentar, l'Escape que el tanca i
 * queda consumit, el clic fora, les fletxes, Inici i Fi. Sense xat públic, la
 * fila pública es queda desactivada i diu per què. Tancat, la barra no canvia
 * ni un node (Llei del Píxel).
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, onTestFinished, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));
vi.mock('../../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('../NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));

import { BarraBlava, MenuComentar, TEXTOS_COMENTAR } from './BarraBlava.jsx';
import { MenuTraduir } from '../traduccio/MenuTraduir.jsx';
import { UniversalPage } from '../UniversalPage.jsx';
import { UIProvider } from '../../../app/contexts/UIContext';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../../config/i18n.js';
import { FONT_DELS_DICCIONARIS as fontI18n } from '../../../../tests/helpers/diccionaris.js';
import { XAT_SOCDEPOBLE_DE_LLAVOR, XatSocDePobleContext } from '../../PedraSeca/hooks/xatSocDePoble.js';

/* L'enllaç del xat de la llavor, en literal: el de XAT_SOCDEPOBLE_DE_LLAVOR
   (PedraSeca/hooks/xatSocDePoble.js), la seua font (correcció C10). */
const ENLLAC_DE_LLAVOR = '/xat?amb=socdepoble';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});
beforeEach(() => { vi.clearAllMocks(); });

const res = () => {};
const TOTES = {
  onBack: res, onForward: res, onIndex: res,
  traduirVisible: true, comentarVisible: true, compartirVisible: true, connectarVisible: true,
  onTranslate: res, onComment: res, onShare: res, onConnect: res,
};
const marques = (el) => [...el.children].map((e) => `${e.tagName.toLowerCase()}.${e.getAttribute('class')}`);
const comentar = (arrel = document) => arrel.querySelector('header.bar-blue button[aria-label="Comentar"]');
const menu = () => screen.queryByRole('menu', { name: TEXTOS_COMENTAR.menu[1] });
const files = () => within(menu()).getAllByRole('menuitem');
const fila = (nom) => within(menu()).getByRole('menuitem', { name: nom });
const PRIVAT = TEXTOS_COMENTAR.privat[1];
const PUBLIC = TEXTOS_COMENTAR.public[1];
/* La ubicació d'un destí del xat, llegida com la llegirà XatSection. */
const desti = (ruta) => {
  const url = new URL(ruta, 'http://localhost');
  return { cami: url.pathname, ...Object.fromEntries(url.searchParams) };
};

describe('261007 · el botó Comentar de la barra i el seu menú', () => {
  test('Llei del Píxel · tancat, el trio de sempre; Comentar només diu que obri un menú', () => {
    const { container } = render(<BarraBlava {...TOTES} comentarXat="comu" />);
    expect(marques(container.querySelector('.sp-card-actions'))).toEqual(['button.sp-card-action', 'button.sp-card-action', 'button.sp-card-action']);
    expect(comentar().getAttribute('title')).toBe('Comentar');
    expect(comentar().getAttribute('aria-haspopup')).toBe('menu');
    expect(comentar().getAttribute('aria-expanded')).toBe('false');
    expect(menu()).toBeNull();
  });

  test('obrir: just després de Comentar, dues files grans amb icona i línia, i el focus a la primera', () => {
    render(<BarraBlava {...TOTES} comentarXat="comu" />);
    fireEvent.click(comentar());
    expect(comentar().getAttribute('aria-expanded')).toBe('true');
    expect(comentar().nextElementSibling).toBe(menu());
    expect(files().map((element) => element.getAttribute('aria-disabled'))).toEqual([null, null]);
    expect(fila(PRIVAT).textContent).toBe(`${PRIVAT}${TEXTOS_COMENTAR.privatDetall[1]}`);
    expect(fila(PUBLIC).textContent).toBe(`${PUBLIC}${TEXTOS_COMENTAR.publicDetall[1]}`);
    /* El nom és la via; la línia de davall n'és la descripció. */
    expect(fila(PRIVAT).getAttribute('aria-describedby')).toBeTruthy();
    expect(document.getElementById(fila(PRIVAT).getAttribute('aria-describedby')).textContent).toBe(TEXTOS_COMENTAR.privatDetall[1]);
    for (const element of files()) expect(element.querySelector('svg.sdp-menu-traduir__marca')).not.toBeNull();
    expect(document.activeElement).toBe(files()[0]);
    // Un segon clic a Comentar el tanca (el pointerdown sobre el botó no compta com a «fora»).
    fireEvent.pointerDown(comentar());
    fireEvent.click(comentar());
    expect(menu()).toBeNull();
  });

  /* Onada 8 (261009) · «En privat» diu amb qui: el nom de l'autor
     (comentarPrivatAmb, useAccions). Sense nom, la línia de sempre. Tancat,
     el mateix trio de sempre. */
  test('Onada 8 · amb el nom de l’autor, «En privat» diu «Un xat només entre tu i {nom}»', () => {
    const { container } = render(<BarraBlava {...TOTES} comentarXat="comu" comentarPrivatAmb="Pepa" />);
    expect(marques(container.querySelector('.sp-card-actions'))).toEqual(['button.sp-card-action', 'button.sp-card-action', 'button.sp-card-action']);
    fireEvent.click(comentar());
    expect(fila(PRIVAT).textContent).toBe(`${PRIVAT}Un xat només entre tu i Pepa`);
    expect(TEXTOS_COMENTAR.privatDetallAmb[1].replace('{nom}', 'Pepa')).toBe('Un xat només entre tu i Pepa');
    cleanup();
    render(<BarraBlava {...TOTES} comentarXat="comu" comentarPrivatAmb="  " />);
    fireEvent.click(comentar());
    expect(fila(PRIVAT).textContent).toBe(`${PRIVAT}${TEXTOS_COMENTAR.privatDetall[1]}`);
  });

  test('Onada 8 · la barra d’una pàgina amb autor: el menú en diu el nom i «En privat» obri el seu xat', () => {
    const objecte = { tipus: 'publicacio', id: 'coca', titol: 'Coca', ruta: '/mur/coca', autor: { tipus: 'persona', id: 'pepa', nom: 'Pepa' } };
    render(<UniversalPage title="Coca" chrome="full" objecte={objecte}><p>Cos</p></UniversalPage>);
    fireEvent.click(comentar());
    expect(fila(PRIVAT).textContent).toBe(`${PRIVAT}Un xat només entre tu i Pepa`);
    fireEvent.click(fila(PRIVAT));
    expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?amb=pepa');
  });

  test('triar: tanca el menú, torna el focus a Comentar i passa la via', () => {
    const onComment = vi.fn();
    render(<BarraBlava {...TOTES} onComment={onComment} comentarXat="comu" />);
    fireEvent.click(comentar());
    fireEvent.click(fila(PRIVAT));
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(comentar());
    fireEvent.click(comentar());
    fireEvent.click(fila(PUBLIC));
    expect(onComment.mock.calls).toEqual([['privat'], ['public']]);
    expect(menu()).toBeNull();
  });

  test('sense xat públic («privat»): la fila pública es queda, desactivada, diu per què i no fa res', () => {
    const onComment = vi.fn();
    render(<BarraBlava {...TOTES} onComment={onComment} comentarXat="privat" />);
    fireEvent.click(comentar());
    const publica = fila(PUBLIC);
    expect(publica.getAttribute('aria-disabled')).toBe('true');
    expect(publica.disabled).toBe(false); // enfocable i llegible (T7)
    expect(publica.textContent).toBe(`${PUBLIC}${TEXTOS_COMENTAR.senseXatPublic[1]}`);
    fireEvent.click(publica);
    expect(onComment).not.toHaveBeenCalled();
    expect(menu()).not.toBeNull();
    fireEvent.click(fila(PRIVAT));
    expect(onComment.mock.calls).toEqual([['privat']]);
  });

  test('Escape tanca, torna el focus a Comentar i queda consumit', () => {
    const alaFinestra = vi.fn();
    window.addEventListener('keydown', alaFinestra);
    try {
      render(<BarraBlava {...TOTES} comentarXat="comu" />);
      fireEvent.click(comentar());
      const noCancellat = fireEvent.keyDown(files()[0], { key: 'Escape' });
      expect(noCancellat).toBe(false); // preventDefault
      expect(alaFinestra).not.toHaveBeenCalled(); // stopPropagation: l'amfitrió no el rep
      expect(menu()).toBeNull();
      expect(document.activeElement).toBe(comentar());
    } finally {
      window.removeEventListener('keydown', alaFinestra);
    }
  });

  test('les fletxes, Inici i Fi mouen el focus (també per la fila desactivada); un clic fora el tanca', () => {
    render(<BarraBlava {...TOTES} comentarXat="privat" />);
    fireEvent.click(comentar());
    const [privada, publica] = files();
    fireEvent.keyDown(privada, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(publica);
    fireEvent.keyDown(publica, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(privada);
    fireEvent.keyDown(privada, { key: 'End' });
    expect(document.activeElement).toBe(publica);
    fireEvent.keyDown(publica, { key: 'Home' });
    expect(document.activeElement).toBe(privada);
    fireEvent.keyDown(privada, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(publica);
    act(() => { fireEvent.pointerDown(document.body); });
    expect(menu()).toBeNull();
  });

  test('un handler propi (comentarXat null): cap menú ni atribut nou, el clic va al handler', () => {
    const onComment = vi.fn();
    render(<BarraBlava {...TOTES} onComment={onComment} />);
    expect(comentar().hasAttribute('aria-haspopup')).toBe(false);
    expect(comentar().hasAttribute('aria-expanded')).toBe(false);
    fireEvent.click(comentar());
    expect(onComment).toHaveBeenCalledTimes(1);
    expect(menu()).toBeNull();
  });

  test('si el botó deixa d’oferir el menú amb el menú obert, es tanca i no torna a eixir sol', () => {
    const { rerender } = render(<BarraBlava {...TOTES} comentarXat="comu" />);
    fireEvent.click(comentar());
    expect(menu()).not.toBeNull();
    rerender(<BarraBlava {...TOTES} comentarXat="comu" accionsInoperatives onClickInoperatiu={vi.fn()} />);
    expect(menu()).toBeNull();
    rerender(<BarraBlava {...TOTES} comentarXat="comu" />);
    expect(menu()).toBeNull();
    expect(comentar().getAttribute('aria-expanded')).toBe('false');
  });

  test('inoperatiu (l’editor): cap menú, encara que digui on porta; el clic diu quin botó és', () => {
    const onComment = vi.fn();
    const onClickInoperatiu = vi.fn();
    render(<BarraBlava {...TOTES} onComment={onComment} comentarXat="comu" accionsInoperatives onClickInoperatiu={onClickInoperatiu} />);
    expect(comentar().hasAttribute('aria-haspopup')).toBe(false);
    fireEvent.click(comentar());
    expect(onClickInoperatiu).toHaveBeenCalledWith('comentar');
    expect(onComment).not.toHaveBeenCalled();
    expect(menu()).toBeNull();
  });
});

/* Correcció C4 · El mode `mostra` de MenuComentar, el MATEIX contracte que el
   de MenuTraduir: l'espècimen del catàleg el pinta obert i quiet, sense
   furtar el focus, sense escoltar la pàgina i sense tria. */
describe('261007 · MenuComentar en mostra (l’espècimen del catàleg)', () => {
  /* Un botó de la pàgina amb el focus, que la mostra no ha de furtar. */
  const fora = () => {
    const boto = document.createElement('button');
    boto.textContent = 'Fora';
    document.body.appendChild(boto);
    boto.focus();
    onTestFinished(() => { boto.remove(); });
    return boto;
  };

  test('obert i quiet: les dues files, cap focus furtat, ni Escape ni clic fora el tanquen, i cap tria', () => {
    const boto = fora();
    const onTria = vi.fn();
    const onTanca = vi.fn();
    render(<MenuComentar ambPublic onTria={onTria} onTanca={onTanca} mostra />);
    expect(files().map((element) => element.getAttribute('aria-disabled'))).toEqual([null, null]);
    expect(document.activeElement).toBe(boto);
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.keyDown(files()[0], { key: 'Escape' });
    act(() => { fireEvent.pointerDown(document.body); });
    fireEvent.click(fila(PRIVAT));
    fireEvent.click(fila(PUBLIC));
    expect([onTria.mock.calls.length, onTanca.mock.calls.length]).toEqual([0, 0]);
    expect(menu()).not.toBeNull();
    // Les fletxes continuen movent el focus per les files, com a MenuTraduir.
    files()[0].focus();
    fireEvent.keyDown(files()[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(files()[1]);
  });

  test('sense xat públic: la fila pública, desactivada i amb la raó, també en mostra', () => {
    render(<MenuComentar onTria={vi.fn()} onTanca={vi.fn()} mostra />);
    expect(fila(PUBLIC).getAttribute('aria-disabled')).toBe('true');
    expect(fila(PUBLIC).textContent).toBe(`${PUBLIC}${TEXTOS_COMENTAR.senseXatPublic[1]}`);
  });

  test('el mateix contracte que MenuTraduir: en mostra cap dels dos furta el focus ni es tanca', () => {
    const boto = fora();
    const tanques = [vi.fn(), vi.fn()];
    render(
      <>
        <MenuComentar ambPublic onTria={vi.fn()} onTanca={tanques[0]} mostra />
        <MenuTraduir opcions={[{ codi: 'ES', nom: 'Castellà' }]} onTria={vi.fn()} onTanca={tanques[1]} mostra />
      </>
    );
    expect(document.activeElement).toBe(boto);
    fireEvent.keyDown(document, { key: 'Escape' });
    act(() => { fireEvent.pointerDown(document.body); });
    expect(tanques.map((tanca) => tanca.mock.calls.length)).toEqual([0, 0]);
    expect(screen.getAllByRole('menu')).toHaveLength(2);
  });

  test('fora de mostra, el de sempre: el focus entra a la primera fila i l’Escape el tanca', () => {
    fora();
    const onTanca = vi.fn();
    render(<MenuComentar ambPublic onTria={vi.fn()} onTanca={onTanca} />);
    expect(document.activeElement).toBe(files()[0]);
    fireEvent.keyDown(files()[0], { key: 'Escape' });
    expect(onTanca).toHaveBeenCalledTimes(1);
  });
});

/* La barra de veres d'una pàgina: UniversalPage → PageFrame → useAccions →
   BarraBlava, sense cap prop nova. */
describe('261007 · el menú a la barra d’una pàgina', () => {
  test('una pàgina amb xat públic: «En públic» obri el seu xat; «En privat», el de Sóc de Poble (llavor)', () => {
    window.history.replaceState(null, '', '/constitucio');
    const { container } = render(<UniversalPage chrome="context" title="Constitució" />);
    fireEvent.click(comentar(container));
    fireEvent.click(fila(PUBLIC));
    expect(desti(mocks.navigate.mock.calls.at(-1)[0])).toEqual({ cami: '/xat', sobre: 'pagina:/constitucio', titol: 'Constitució', ruta: '/constitucio' });
    fireEvent.click(comentar(container));
    fireEvent.click(fila(PRIVAT));
    expect(mocks.navigate).toHaveBeenLastCalledWith(ENLLAC_DE_LLAVOR);
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  test('una pàgina sense xat públic (/page/xat): la pública, desactivada; la privada, al xat resolt en remot', () => {
    window.history.replaceState(null, '', '/page/xat');
    const remot = Object.freeze({ estat: 'remot', href: '/xat?amb=7d1f4c2e-9a3b-4c5d-8e6f-0a1b2c3d4e5f', avis: null });
    const { container } = render(
      <XatSocDePobleContext.Provider value={remot}>
        <UniversalPage chrome="context" title="El Xat" />
      </XatSocDePobleContext.Provider>
    );
    fireEvent.click(comentar(container));
    expect(fila(PUBLIC).getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(fila(PUBLIC));
    expect(mocks.navigate).not.toHaveBeenCalled();
    fireEvent.click(fila(PRIVAT));
    expect(mocks.navigate).toHaveBeenCalledWith(remot.href);
  });

  test('en remot, mentre el xat privat no hi és: el clic diu l’avís del proveïdor i no navega', () => {
    window.history.replaceState(null, '', '/constitucio');
    const resolent = Object.freeze({ estat: 'resolent', href: null, avis: 'Encara es busca.' });
    const { container } = render(
      <XatSocDePobleContext.Provider value={resolent}>
        <UniversalPage chrome="context" title="Constitució" />
      </XatSocDePobleContext.Provider>
    );
    fireEvent.click(comentar(container));
    fireEvent.click(fila(PRIVAT));
    expect(mocks.toast).toHaveBeenCalledWith('Encara es busca.');
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  test('sense proveïdor, la llavor: el xat de l’entitat pilot del padró', () => {
    expect(XAT_SOCDEPOBLE_DE_LLAVOR).toEqual({ estat: 'llavor', href: ENLLAC_DE_LLAVOR, avis: null, resol: null });
  });
});

/* Els textos nous: cinc llengües i la reserva valenciana (LLEI_07). */
describe('261007 · els textos del menú de Comentar', () => {
  const LLENGUES = SUPPORTED_LANGUAGES.map(({ code }) => code);

  test('cada clau té valor propi en les cinc llengües, una sola vegada, i la reserva és el valor valencià', () => {
    /* Onada 8 (261009) · privatDetallAmb: «Un xat només entre tu i {nom}». */
    expect(Object.keys(TEXTOS_COMENTAR).sort()).toEqual(['menu', 'privat', 'privatDetall', 'privatDetallAmb', 'public', 'publicDetall', 'senseXatPublic']);
    for (const [clau, reserva] of Object.values(TEXTOS_COMENTAR)) {
      expect([clau, createTranslator('ca')(clau)]).toEqual([clau, reserva]);
      for (const codi of LLENGUES.filter((llengua) => llengua !== 'ca')) {
        const valor = createTranslator(codi)(clau);
        expect([clau, codi, valor === clau, valor === reserva]).toEqual([clau, codi, false, false]);
      }
      expect([clau, fontI18n.split(`'${clau}':`).length - 1]).toEqual([clau, LLENGUES.length]);
    }
  });

  test('dins de l’app, el menú parla la llengua de la interfície', () => {
    /* L'UIProvider escolta el tema del sistema: jsdom no porta matchMedia. */
    vi.stubGlobal('matchMedia', vi.fn((query) => ({
      matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn()
    })));
    render(
      <UIProvider externalConfig={{ language: 'es' }}>
        <BarraBlava {...TOTES} comentarXat="privat" />
      </UIProvider>
    );
    fireEvent.click(comentar());
    const t = createTranslator('es');
    const castella = screen.getByRole('menu', { name: t(TEXTOS_COMENTAR.menu[0]) });
    expect(within(castella).getAllByRole('menuitem').map((element) => element.textContent)).toEqual([
      `${t(TEXTOS_COMENTAR.privat[0])}${t(TEXTOS_COMENTAR.privatDetall[0])}`,
      `${t(TEXTOS_COMENTAR.public[0])}${t(TEXTOS_COMENTAR.senseXatPublic[0])}`
    ]);
  });
});
