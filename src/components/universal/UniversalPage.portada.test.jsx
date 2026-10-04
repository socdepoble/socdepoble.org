/**
 * P7-A · Onada 4, setena passada (directriu 261003_2320 del Mestre, «Hero
 * Image Toggle») · La portada plegable de la Pàgina Universal: una capacitat
 * genèrica i opcional (prop `portadaPlegable={{ clau }}`). Per defecte la
 * portada es veu; un botó amb nom («Amaga la portada» / «Mostra la
 * portada») la plega i la desplega; l'estat és de qui mira i de cada clau, es
 * recorda amb storage.js, val sense emmagatzematge i se sincronitza entre
 * pestanyes. Sense la prop, el DOM de la portada és el de sempre.
 * Les proves són fora de L2 (tractor-persistencia): poden tocar
 * l'emmagatzematge directament.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { STORAGE_PREFIX } from '../../config/storage.js';
import { CLAU_PORTADES, UniversalPage, _reiniciaPortades } from './UniversalPage.jsx';

const CLAU_DESADA = STORAGE_PREFIX + CLAU_PORTADES;
const IMATGE = '/assets/ui/plugins/gestoria_vinyeta.jpg';
const ALT = 'Un llaurador i una gestora signen papers';

function Pagina(props) {
  return (
    <MemoryRouter rutaInicial="/plugin/gestoria">
      <UniversalPage chrome="full" title="Gestoria" heroImage={IMATGE} heroAlt={ALT} {...props} />
    </MemoryRouter>
  );
}

const boto = () => screen.getByRole('button', { name: /la portada$/ });
const imatge = (container) => container.querySelector('.hero-image img');
const desat = () => JSON.parse(window.localStorage.getItem(CLAU_DESADA) ?? 'null');

beforeEach(() => {
  window.localStorage.removeItem(CLAU_DESADA);
  _reiniciaPortades();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.localStorage.removeItem(CLAU_DESADA);
  _reiniciaPortades();
});

describe('sense la prop: la portada de sempre (Llei del Píxel)', () => {
  test('el marc de la portada és exactament el d’abans i no hi ha cap botó de portada', () => {
    const { container } = render(<Pagina />);
    const marc = container.querySelector('.hero-image');
    expect(marc.outerHTML).toBe(`<div class="hero-image"><img alt="${ALT}" src="${IMATGE}"></div>`);
    expect(screen.queryByRole('button', { name: /portada/i })).toBeNull();
    expect(container.querySelector('[class*="sdp-portada"]')).toBeNull();
  });

  test('amb una clau invàlida, o sense imatge, la prop no canvia res', () => {
    const { container, unmount } = render(<Pagina portadaPlegable={{ clau: 'Clau Amb Espais' }} />);
    expect(container.querySelector('.hero-image').outerHTML).toBe(`<div class="hero-image"><img alt="${ALT}" src="${IMATGE}"></div>`);
    unmount();
    const sense = render(<Pagina heroImage={undefined} portadaPlegable={{ clau: 'plugin:gestoria' }} />);
    expect(sense.container.querySelector('.hero-image')).toBeNull();
    expect(screen.queryByRole('button', { name: /portada/i })).toBeNull();
  });

  test('un heroComponent propi (l’editor) mana: la prop no l’embolica', () => {
    const { container } = render(
      <Pagina portadaPlegable={{ clau: 'plugin:gestoria' }} topBarData={{ heroComponent: <p>Editor de la portada</p> }} />
    );
    expect(container.querySelector('.hero-image').textContent).toBe('Editor de la portada');
    expect(screen.queryByRole('button', { name: /portada/i })).toBeNull();
  });
});

describe('amb la prop: la portada plegable', () => {
  test('per defecte es veu, i el botó diu què farà i què controla', () => {
    const { container } = render(<Pagina portadaPlegable={{ clau: 'plugin:gestoria' }} />);
    const b = boto();
    expect(b.textContent).toBe('Amaga la portada');
    expect(b.getAttribute('type')).toBe('button');
    expect(b.getAttribute('aria-expanded')).toBe('true');
    const controlada = document.getElementById(b.getAttribute('aria-controls'));
    expect(controlada).not.toBeNull();
    expect(container.contains(controlada)).toBe(true);
    expect(controlada.hidden).toBe(false);
    expect(controlada.querySelector('img').getAttribute('src')).toBe(IMATGE);
    expect(controlada.querySelector('img').getAttribute('alt')).toBe(ALT);
    // La mida tàctil (44 px) i el focus visible són els del Boto de Pedra Seca.
    expect(b.classList.contains('sdp-boto')).toBe(true);
    // El botó va abans de la imatge: és el primer que troba qui navega amb el teclat.
    expect(container.querySelector('.hero-image').firstElementChild.contains(b)).toBe(true);
  });

  test('plegar amaga la imatge, el botó canvia de text i d’estat, i el focus es queda al botó', () => {
    const { container } = render(<Pagina portadaPlegable={{ clau: 'plugin:gestoria' }} />);
    const b = boto();
    b.focus();
    fireEvent.click(b);
    expect(b.textContent).toBe('Mostra la portada');
    expect(b.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(b);
    const controlada = document.getElementById(b.getAttribute('aria-controls'));
    expect(controlada.hidden).toBe(true);
    expect(imatge(container).closest('[hidden]')).toBe(controlada);
    fireEvent.click(b);
    expect(b.textContent).toBe('Amaga la portada');
    expect(controlada.hidden).toBe(false);
  });

  test('es recorda per a qui mira (storage.js): una clau, només les plegades, i desplegar l’esborra', () => {
    render(<Pagina portadaPlegable={{ clau: 'plugin:gestoria' }} />);
    expect(desat()).toBeNull();
    fireEvent.click(boto());
    expect(desat()).toEqual({ v: 1, plegades: { 'plugin:gestoria': true } });
    fireEvent.click(boto());
    expect(window.localStorage.getItem(CLAU_DESADA)).toBeNull();
  });

  test('en tornar a carregar (memòria oblidada), la pàgina naix plegada', () => {
    const primera = render(<Pagina portadaPlegable={{ clau: 'plugin:gestoria' }} />);
    fireEvent.click(boto());
    primera.unmount();
    _reiniciaPortades();
    const { container } = render(<Pagina portadaPlegable={{ clau: 'plugin:gestoria' }} />);
    expect(boto().textContent).toBe('Mostra la portada');
    expect(imatge(container).closest('[hidden]')).not.toBeNull();
  });

  test('cada clau té el seu estat: plegar la Gestoria no plega la Salut', () => {
    window.localStorage.setItem(CLAU_DESADA, JSON.stringify({ v: 1, plegades: { 'plugin:gestoria': true } }));
    _reiniciaPortades();
    render(<Pagina portadaPlegable={{ clau: 'plugin:salut' }} />);
    expect(boto().textContent).toBe('Amaga la portada');
  });

  test('un valor desat mal format no plega res', () => {
    for (const cru of ['no-es-json', '{"v":2,"plegades":{"plugin:gestoria":true}}', '{"v":1,"plegades":["plugin:gestoria"]}',
      '{"v":1,"plegades":{"plugin:gestoria":"si"}}']) {
      window.localStorage.setItem(CLAU_DESADA, cru);
      _reiniciaPortades();
      const { unmount } = render(<Pagina portadaPlegable={{ clau: 'plugin:gestoria' }} />);
      expect([cru, boto().textContent]).toEqual([cru, 'Amaga la portada']);
      unmount();
    }
  });

  test('sense emmagatzematge (mode privat, quota): plega igual en esta càrrega', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloquejat'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloquejat'); });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('bloquejat'); });
    const { container } = render(<Pagina portadaPlegable={{ clau: 'plugin:gestoria' }} />);
    expect(boto().textContent).toBe('Amaga la portada');
    fireEvent.click(boto());
    expect(boto().textContent).toBe('Mostra la portada');
    expect(imatge(container).closest('[hidden]')).not.toBeNull();
    fireEvent.click(boto());
    expect(boto().textContent).toBe('Amaga la portada');
  });

  test('dues pàgines amb la mateixa clau, en la mateixa pestanya, van a una', () => {
    render(<><Pagina portadaPlegable={{ clau: 'plugin:gestoria' }} /><Pagina portadaPlegable={{ clau: 'plugin:gestoria' }} /></>);
    const [primer, segon] = screen.getAllByRole('button', { name: /la portada$/ });
    fireEvent.click(primer);
    expect(segon.textContent).toBe('Mostra la portada');
  });

  test('entre pestanyes: l’esdeveniment storage de la clau la plega o la desplega; un altre no la toca', () => {
    render(<Pagina portadaPlegable={{ clau: 'plugin:gestoria' }} />);
    window.localStorage.setItem(CLAU_DESADA, JSON.stringify({ v: 1, plegades: { 'plugin:gestoria': true } }));
    act(() => { window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_PREFIX + 'una-altra-clau' })); });
    expect(boto().textContent).toBe('Amaga la portada');
    act(() => { window.dispatchEvent(new StorageEvent('storage', { key: CLAU_DESADA })); });
    expect(boto().textContent).toBe('Mostra la portada');
    window.localStorage.removeItem(CLAU_DESADA);
    // null: una altra pestanya ho ha buidat tot.
    act(() => { window.dispatchEvent(new StorageEvent('storage', { key: null })); });
    expect(boto().textContent).toBe('Amaga la portada');
  });

  test('les etiquetes es poden traduir (etiquetes: { amaga, mostra })', () => {
    render(<Pagina portadaPlegable={{ clau: 'plugin:gestoria', etiquetes: { amaga: 'Oculta la portada', mostra: 'Muestra la portada' } }} />);
    expect(boto().textContent).toBe('Oculta la portada');
    fireEvent.click(boto());
    expect(boto().textContent).toBe('Muestra la portada');
  });
});
