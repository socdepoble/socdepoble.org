/**
 * Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar targetes») ·
 * Les props opcionals d'UniversalCard per a les llistes de les apps
 * (Notícies, la Nevera): imatgePrivada, idElement, premuda i
 * onAccioSecundaria. Sense elles, el DOM de sempre (les instantànies
 * d'UniversalCard.vinyeta.test.jsx i la comparació d'ací).
 * Anatomia (prompt §6, «el cas del Vehicle Compartit») · amb autor i imatge,
 * la boina taronja va SEMPRE dalt de tot i la imatge, després.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../../app/contexts/RouterContext';

const mocks = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));

import { UniversalCard } from './UniversalCard.jsx';
import { DURADA_PULSACIO } from './pulsacioLlarga.js';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}
const pinta = (props) => render(
  <MemoryRouter rutaInicial="/app/nevera">
    <UniversalCard {...props} />
    <Ubicacio />
  </MemoryRouter>
).container;
const html = (props) => {
  const sortida = pinta(props).querySelector('article').outerHTML;
  cleanup();
  return sortida;
};
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

const MUR = {
  title: 'Fira del Porrat', subtitle: 'Dissabte a la plaça', body: 'Porta el teu cistell.',
  imageUrl: '/assets/mur/fira.jpg', imageAlt: 'La plaça plena', labels: ['festes'],
  author: 'Pepa', authorHref: '/gent/pepa', location: 'La Torre', avatarUrl: '/assets/pepa.png',
  time: '10:05', date: '30/09/26', mainHref: '/mur/p1', hasFooter: true
};

describe('anatomia: la boina dalt de tot, la imatge després', () => {
  test('amb descripcioAccessible, els fills de l’article no canvien', () => {
    const fills = (props) => {
      const sortida = [...pinta(props).querySelector('article.sp-card').children].map((e) => e.className);
      cleanup();
      return sortida;
    };
    expect(fills({ ...MUR, descripcioAccessible: 'Dissabte' })).toEqual(fills(MUR));
  });

  test('amb autor i imatge, el primer fill de l’article és header.sp-card-header i la media va després', () => {
    const article = pinta(MUR).querySelector('article.sp-card');
    expect(article.firstElementChild.tagName).toBe('HEADER');
    expect(article.firstElementChild.className).toBe('sp-card-header');
    const fills = [...article.children];
    const capcalera = fills.indexOf(article.querySelector(':scope > header.sp-card-header'));
    const media = fills.indexOf(article.querySelector(':scope > .sp-card-media-container'));
    const cos = fills.indexOf(article.querySelector(':scope > .sp-card-body'));
    const peu = fills.indexOf(article.querySelector(':scope > footer.sp-card-footer'));
    expect(capcalera).toBe(0);
    expect(media).toBeGreaterThan(capcalera);
    expect(cos).toBe(media + 1);
    expect(peu).toBe(fills.length - 1);
  });

  test('també amb el clic propi (onMainClick) i amb les opcionals de les apps', () => {
    const article = pinta({ ...MUR, mainHref: undefined, onMainClick: () => {}, imatgePrivada: true, premuda: false, idElement: 'p1', onAccioSecundaria: () => {} })
      .querySelector('article.sp-card');
    expect(article.firstElementChild.className).toBe('sp-card-header');
    expect([...article.children].map((e) => e.className)).toEqual([
      'sp-card-header', 'sp-card-link-overlay', 'sp-card-media-container', 'sp-card-body', 'sp-card-footer'
    ]);
  });
});

describe('Llei del Píxel: sense les opcionals, el DOM de sempre', () => {
  test('absents, undefined o al valor per defecte, la targeta és la mateixa, byte a byte', () => {
    for (const base of [MUR, { ...MUR, mainHref: undefined, onMainClick: () => {} }, { title: 'Sola' }]) {
      const sempre = html(base);
      expect(html({ ...base, imatgePrivada: false, idElement: undefined, premuda: undefined, onAccioSecundaria: undefined })).toBe(sempre);
      /* Regressió de la Nevera (261004) · descripcioAccessible absent, buida o només espais: res. */
      for (const descripcioAccessible of [undefined, '', '   ']) expect(html({ ...base, descripcioAccessible })).toBe(sempre);
      expect(sempre).not.toMatch(/referrerpolicy|data-element|aria-pressed|aria-keyshortcuts|aria-describedby|sdp-nomes-lector/);
    }
  });
});

describe('imatgePrivada', () => {
  test('una imatge i un avatar de fora no es pinten; els propis, sense referent', () => {
    let article = pinta({ ...MUR, imageUrl: 'https://servidor.example/foto.jpg', avatarUrl: 'https://servidor.example/a.png', imatgePrivada: true })
      .querySelector('article');
    expect(article.querySelector('.sp-card-media-container')).toBeNull();
    expect(article.querySelector('img.sp-card-avatar')).toBeNull();
    expect(article.querySelector('.sp-card-avatar--fallback')).not.toBeNull();
    cleanup();
    article = pinta({ ...MUR, imatgePrivada: true }).querySelector('article');
    expect(article.querySelector('img.sp-card-media').getAttribute('src')).toBe('/assets/mur/fira.jpg');
    expect(article.querySelector('img.sp-card-media').getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(article.querySelector('img.sp-card-avatar').getAttribute('referrerpolicy')).toBe('no-referrer');
  });

  test('sense la prop, la regla de sempre: una https de fora es pinta (i sense referrerpolicy)', () => {
    const article = pinta({ ...MUR, imageUrl: 'https://servidor.example/foto.jpg' }).querySelector('article');
    expect(article.querySelector('img.sp-card-media').getAttribute('src')).toBe('https://servidor.example/foto.jpg');
    expect(article.querySelector('img.sp-card-media').hasAttribute('referrerpolicy')).toBe(false);
  });

  test('el filtre és el de les peces de les apps: un data: de mapa de bits sí, un SVG en data: o un javascript:, no', () => {
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    expect(pinta({ title: 'x', imageUrl: png, imatgePrivada: true }).querySelector('img.sp-card-media').getAttribute('src')).toBe(png);
    cleanup();
    for (const dolenta of ['data:image/svg+xml;base64,PHN2Zy8+', 'javascript:alert(1)', '//servidor.example/x.jpg']) {
      expect([dolenta, pinta({ title: 'x', imageUrl: dolenta, imatgePrivada: true }).querySelector('img.sp-card-media')]).toEqual([dolenta, null]);
      cleanup();
    }
  });
});

describe('idElement i premuda', () => {
  test('idElement posa data-element a l’element principal: al botó i a l’enllaç', () => {
    expect(pinta({ title: 'x', onMainClick: () => {}, idElement: 'oli' }).querySelector('button.sp-card-link-overlay').dataset.element).toBe('oli');
    cleanup();
    expect(pinta({ title: 'x', mainHref: '/mur/1', idElement: 42 }).querySelector('a.sp-card-link-overlay').dataset.element).toBe('42');
  });

  test('premuda posa aria-pressed al botó de tota la targeta; a un enllaç, mai', () => {
    expect(pinta({ title: 'x', onMainClick: () => {}, premuda: true }).querySelector('button.sp-card-link-overlay').getAttribute('aria-pressed')).toBe('true');
    cleanup();
    expect(pinta({ title: 'x', onMainClick: () => {}, premuda: false }).querySelector('button.sp-card-link-overlay').getAttribute('aria-pressed')).toBe('false');
    cleanup();
    expect(pinta({ title: 'x', mainHref: '/mur/1', premuda: true }).querySelector('a.sp-card-link-overlay').hasAttribute('aria-pressed')).toBe(false);
  });
});

/* Ordre del Mestre, 261004 (regressió de la Nevera) · El que la rajola deia al
   lector (l'estat i l'especificació) ho diu la descripció de l'element principal. */
describe('descripcioAccessible', () => {
  test('al botó de tota la targeta: aria-describedby apunta a un span .sdp-nomes-lector, dins del botó, amb el text', () => {
    const container = pinta({ title: 'Llet', onMainClick: () => {}, descripcioAccessible: 'sense lactosa, S’ha acabat' });
    const boto = screen.getByRole('button', { name: 'Llet' });
    const id = boto.getAttribute('aria-describedby');
    expect(id).toBeTruthy();
    const span = container.ownerDocument.getElementById(id);
    expect(span.tagName).toBe('SPAN');
    expect(span.className).toBe('sdp-nomes-lector');
    expect(span.textContent).toBe('sense lactosa, S’ha acabat');
    expect(span.parentElement).toBe(boto);
    expect(boto.children).toHaveLength(1);
    /* El nom continua sent el títol (aria-label): la descripció no s'hi barreja. */
    expect(boto.getAttribute('aria-label')).toBe('Llet');
    /* Els fills de l'article, els de sempre: l'element principal i el cos. */
    expect([...boto.closest('article.sp-card').children].map((e) => e.className)).toEqual(['sp-card-link-overlay', 'sp-card-body']);
  });

  test('a l’enllaç de tota la targeta també; cada targeta, el seu id', () => {
    const { container } = render(
      <MemoryRouter rutaInicial="/app/nevera">
        <UniversalCard title="Ous" mainHref="/mur/1" descripcioAccessible="S’ha acabat" />
        <UniversalCard title="Pa" mainHref="/mur/2" descripcioAccessible="de llenya" />
      </MemoryRouter>
    );
    const enllacos = [...container.querySelectorAll('a.sp-card-link-overlay')];
    const ids = enllacos.map((a) => a.getAttribute('aria-describedby'));
    expect(new Set(ids).size).toBe(2);
    expect(ids.map((id) => container.ownerDocument.getElementById(id).textContent)).toEqual(['S’ha acabat', 'de llenya']);
    expect(ids.map((id) => container.ownerDocument.getElementById(id).parentElement)).toEqual(enllacos);
    expect(screen.getByRole('link', { name: 'Ous' })).toBe(enllacos[0]);
  });

  test('es neteja d’espais; sense element principal (ni enllaç ni botó, o amb portes) no es pinta res', () => {
    pinta({ title: 'x', onMainClick: () => {}, descripcioAccessible: '  sense gluten  ' });
    const boto = screen.getByRole('button', { name: 'x' });
    expect(document.getElementById(boto.getAttribute('aria-describedby')).textContent).toBe('sense gluten');
    cleanup();
    const quieta = pinta({ title: 'Quieta', descripcioAccessible: 'No disponible' });
    expect(quieta.querySelector('.sdp-nomes-lector, [aria-describedby]')).toBeNull();
    cleanup();
    const ambPortes = pinta({ title: 'Portes', mainHref: '/mur/1', descripcioAccessible: 'Res', portes: [{ id: 'a', verb: 'Obri', nom: 'la porta', desti: '/mur/1' }] });
    expect(ambPortes.querySelector('.sdp-nomes-lector, [aria-describedby]')).toBeNull();
  });
});

describe('onAccioSecundaria', () => {
  const principal = (container) => container.querySelector('.sp-card-link-overlay');

  test('el clic dret obri l’acció secundària amb l’element; el clic normal fa la principal', () => {
    const onMainClick = vi.fn();
    const onAccioSecundaria = vi.fn();
    const boto = principal(pinta({ title: 'Oli', onMainClick, onAccioSecundaria }));
    expect(boto.getAttribute('aria-keyshortcuts')).toBe('Shift+F10');
    fireEvent.contextMenu(boto);
    expect(onAccioSecundaria).toHaveBeenCalledTimes(1);
    expect(onAccioSecundaria).toHaveBeenCalledWith(boto);
    fireEvent.click(boto);
    expect(onMainClick).toHaveBeenCalledTimes(1);
  });

  test('Maj+F10 i la tecla de menú, sobre l’element enfocat', () => {
    vi.useFakeTimers();
    const onAccioSecundaria = vi.fn();
    const boto = principal(pinta({ title: 'Oli', onMainClick: () => {}, onAccioSecundaria }));
    fireEvent.keyDown(boto, { key: 'F10', shiftKey: true });
    expect(onAccioSecundaria).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    fireEvent.keyDown(boto, { key: 'ContextMenu' });
    expect(onAccioSecundaria).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(boto, { key: 'F10' });
    expect(onAccioSecundaria).toHaveBeenCalledTimes(2);
  });

  test('la pulsació llarga obri l’acció secundària i el clic que la seguix no fa la principal', () => {
    vi.useFakeTimers();
    const onMainClick = vi.fn();
    const onAccioSecundaria = vi.fn();
    const boto = principal(pinta({ title: 'Oli', onMainClick, onAccioSecundaria }));
    fireEvent.pointerDown(boto, { button: 0, clientX: 5, clientY: 5 });
    act(() => { vi.advanceTimersByTime(DURADA_PULSACIO); });
    expect(onAccioSecundaria).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(boto);
    fireEvent.click(boto);
    expect(onMainClick).not.toHaveBeenCalled();
    /* Una pulsació curta: el clic de sempre. */
    fireEvent.pointerDown(boto, { button: 0, clientX: 5, clientY: 5 });
    fireEvent.pointerUp(boto);
    fireEvent.click(boto);
    expect(onMainClick).toHaveBeenCalledTimes(1);
  });

  test('amb un enllaç principal, el clic que seguix una pulsació llarga no navega', () => {
    vi.useFakeTimers();
    const onAccioSecundaria = vi.fn();
    const container = pinta({ title: 'Notícia', mainHref: '/app/lector?article=a1', onAccioSecundaria });
    const enllac = principal(container);
    fireEvent.pointerDown(enllac, { button: 0, clientX: 1, clientY: 1 });
    act(() => { vi.advanceTimersByTime(DURADA_PULSACIO); });
    fireEvent.pointerUp(enllac);
    fireEvent.click(enllac);
    expect(onAccioSecundaria).toHaveBeenCalledTimes(1);
    expect(ubicacio()).toBe('/app/nevera');
    fireEvent.click(enllac);
    expect(ubicacio()).toBe('/app/lector?article=a1');
  });
});
