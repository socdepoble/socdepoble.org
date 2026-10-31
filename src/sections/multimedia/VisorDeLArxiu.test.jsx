/* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 3) · Les tres props
   OPCIONALS que hi posa «Multimèdia» del Perfil (filesInicials, ometFiles i
   infoInicial): sense elles, el visor de sempre, fila per fila; amb elles, les
   files de més al davant, les omeses fora i el panell desplegat. I, per a tot
   qui el munta (auditoria Codex 2030, §4.1), una referència opaca sense la URL
   del port no es pinta mai crua en un <img>. */
import { useState } from 'react';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fixaBaseRecursos } from '../../config/assetResolver.js';

vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [{ id: 'tibi', title: 'Tibi' }] }) }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useLocation: () => ({ pathname: '/multimedia', search: '', state: null, hash: '' }),
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));
import { VisorDeLArxiu } from './VisorDeLArxiu.jsx';
import { oblidaMetadades } from './useMetadadesFoto.js';

const TIBI = { id: 'town-tibi', title: 'Tibi', src: '/assets/towns/tibi/1.jpg', tag: 'Poble', source: 'Tibi', article: { sectionId: 'pobles', id: 'tibi' } };
const visor = () => document.querySelector('dialog.sdp-visor');
const etiquetes = () => [...visor().querySelectorAll('.sdp-visor__clau')].map((e) => e.textContent);
const botoInfo = () => within(visor()).getByRole('button', { name: 'Informació de la imatge' });

beforeEach(() => {
  oblidaMetadades();
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('el visor de l’Arxiu · les props opcionals del Perfil', () => {
  test('sense les props noves, les files de sempre i el panell plegat', () => {
    render(<VisorDeLArxiu llista={[TIBI]} index={0} />);
    expect(visor().hasAttribute('open')).toBe(true);
    expect(botoInfo().getAttribute('aria-expanded')).toBe('false');
    expect(etiquetes()).toEqual([
      'Data i hora de captura', 'Coordenades GPS', 'Càmera', 'Resolució', 'Autor', 'Poble', 'Drets d’ús', 'Origen', 'Publicat a',
      'Enllaç de la imatge', 'Comentar', 'Connectar',
    ]);
  });

  test('filesInicials al davant, ometFiles fora i infoInicial desplega el panell', () => {
    const files = [{ clau: 'accions-perfil', etiqueta: 'Accions', valor: <button type="button">Posa com a avatar</button> }];
    render(<VisorDeLArxiu llista={[TIBI]} index={0} filesInicials={files} ometFiles={['poble', 'publicat']} infoInicial />);
    expect(botoInfo().getAttribute('aria-expanded')).toBe('true');
    expect(etiquetes()[0]).toBe('Accions');
    expect(etiquetes()).not.toContain('Poble');
    expect(etiquetes()).not.toContain('Publicat a');
    expect(etiquetes()).toContain('Resolució');
    expect(within(visor()).getByRole('button', { name: 'Posa com a avatar' })).toBeTruthy();
  });

  test('tancat, les files de més no es pinten', () => {
    const files = [{ clau: 'accions-perfil', etiqueta: 'Accions', valor: 'x' }];
    render(<VisorDeLArxiu llista={[TIBI]} index={-1} filesInicials={files} infoInicial />);
    expect(visor().hasAttribute('open')).toBe(false);
    expect(visor().querySelectorAll('.sdp-visor__fila')).toHaveLength(0);
  });

  test('una referència opaca sense la URL del port no es pinta crua; amb la URL, sí, i l’EXIF no es demana', () => {
    const opaca = { id: 'p', title: 'Pujada', src: 'sdp-media://mitjans/t/u/avatars/a.webp' };
    const { rerender } = render(<VisorDeLArxiu llista={[opaca]} index={0} />);
    expect(visor().querySelector('img')).toBeNull();
    expect(visor().textContent).toContain('Esta entrada no porta cap imatge.');
    act(() => rerender(<VisorDeLArxiu llista={[{ ...opaca, srcDelPort: 'https://fitxers.test/a.webp' }]} index={0} />));
    expect(visor().querySelector('img.sdp-visor__imatge').getAttribute('src')).toBe('https://fitxers.test/a.webp');
    expect(fetch).not.toHaveBeenCalled();
  });
});

/* Ordre del Mestre (30-10-2026, B3) · Al panell, la URL completa de la foto i el
   botó d'un sol clic «Copiar l’enllaç de la imatge», amb la confirmació
   «Enllaç copiat» en una regió role="status"; si no es pot copiar, ho diu.
   D'un arxiu local o d'una mitja del port, cap URL ni cap botó. */
describe('el visor de l’Arxiu · copiar l’enllaç de la imatge (B3)', () => {
  const COPIA = 'Copiar l’enllaç de la imatge';
  const panell = () => visor().querySelector('.sdp-visor__panell');
  const filaEnllac = () => [...visor().querySelectorAll('.sdp-visor__fila')]
    .find((f) => f.querySelector('dt').textContent === 'Enllaç de la imatge')?.querySelector('dd');
  const botoCopia = () => within(panell()).queryByRole('button', { name: COPIA });
  const estat = () => within(filaEnllac()).getByRole('status');
  const portaRetalls = (writeText) => Object.defineProperty(navigator, 'clipboard', { value: writeText ? { writeText } : undefined, configurable: true });
  afterEach(() => {
    delete navigator.clipboard;
  });

  test('la URL completa del lloc, un botó amb nom i la confirmació «Enllaç copiat» en role=status', async () => {
    const writeText = vi.fn(async () => {});
    portaRetalls(writeText);
    render(<VisorDeLArxiu llista={[TIBI]} index={0} infoInicial />);
    const url = `${window.location.origin}/assets/towns/tibi/1.jpg`;
    expect(filaEnllac().querySelector('[translate="no"]').textContent).toBe(url);
    // La URL és text, no cap enllaç navegable (cap salt fora de l'app).
    expect(filaEnllac().querySelector('a')).toBeNull();
    const boto = botoCopia();
    expect([boto.tagName, boto.getAttribute('type'), boto.disabled, boto.tabIndex]).toEqual(['BUTTON', 'button', false, 0]);
    expect(estat().textContent).toBe('');
    boto.focus();
    await act(async () => { boto.click(); });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(url);
    expect(estat().textContent).toBe('Enllaç copiat');
    // El focus es queda al botó: qui va amb teclat pot tornar a copiar.
    expect(document.activeElement).toBe(boto);
  });

  test('si el navegador no deixa copiar (permís negat o cap porta-retalls), ho diu i mai «Enllaç copiat»', async () => {
    const writeText = vi.fn(async () => { throw new DOMException('Denegat', 'NotAllowedError'); });
    portaRetalls(writeText);
    render(<VisorDeLArxiu llista={[TIBI]} index={0} infoInicial />);
    await act(async () => { botoCopia().click(); });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(estat().textContent).toBe('No s’ha pogut copiar: selecciona l’enllaç i copia’l a mà.');
    cleanup();
    portaRetalls(null);
    render(<VisorDeLArxiu llista={[TIBI]} index={0} infoInicial />);
    await act(async () => { botoCopia().click(); });
    expect(estat().textContent).toBe('No s’ha pogut copiar: selecciona l’enllaç i copia’l a mà.');
    expect(panell().textContent).not.toContain('Enllaç copiat');
  });

  test('un segon clic torna a anunciar-ho: mentre copia, la regió es buida', async () => {
    let acaba = null;
    const writeText = vi.fn(() => new Promise((resol) => { acaba = resol; }));
    portaRetalls(writeText);
    render(<VisorDeLArxiu llista={[TIBI]} index={0} infoInicial />);
    for (let vegada = 1; vegada <= 2; vegada += 1) {
      await act(async () => { botoCopia().click(); });
      expect([vegada, estat().textContent]).toEqual([vegada, '']);
      await act(async () => { acaba(); });
      expect([vegada, estat().textContent]).toEqual([vegada, 'Enllaç copiat']);
    }
    expect(writeText).toHaveBeenCalledTimes(2);
  });

  test('canviar de foto buida l’avís i porta la URL de la nova', async () => {
    portaRetalls(vi.fn(async () => {}));
    const altra = { ...TIBI, id: 'town-tibi-2', src: '/assets/towns/tibi/2.jpg' };
    const { rerender } = render(<VisorDeLArxiu llista={[TIBI, altra]} index={0} infoInicial />);
    await act(async () => { botoCopia().click(); });
    expect(estat().textContent).toBe('Enllaç copiat');
    act(() => rerender(<VisorDeLArxiu llista={[TIBI, altra]} index={1} infoInicial />));
    expect(estat().textContent).toBe('');
    expect(filaEnllac().querySelector('[translate="no"]').textContent).toBe(`${window.location.origin}/assets/towns/tibi/2.jpg`);
  });

  test('privacitat: d’un arxiu local o d’una mitja del port, cap URL, cap blob:, cap URL signada i cap botó', () => {
    const SIGNADA = 'https://abc.supabase.co/storage/v1/object/sign/mitjans_privats/t/u/avatars/a.webp?token=SECRET';
    const casos = [
      { id: '__lf_9x7k2', title: 'IMG_0001.jpg', src: 'blob:http://localhost:3000/3f2a9c1e-8b7d-4e21-9a0f-0c5d6e7f8a9b' },
      { id: 'local', title: 'IMG_0002.jpg', src: '/Users/javi/Pictures/IMG_0002.jpg' },
      { id: 'privada', title: 'Pujada', src: 'sdp-media://mitjans_privats/t/u/avatars/a.webp', srcDelPort: SIGNADA },
    ];
    for (const item of casos) {
      // Com el munta l'Arxiu (/multimedia): amb l'avís de quan no n'hi ha cap (T4.2).
      render(<VisorDeLArxiu llista={[item]} index={0} infoInicial avisSenseEnllac />);
      expect([item.id, botoCopia()]).toEqual([item.id, null]);
      expect([item.id, filaEnllac().textContent]).toEqual([item.id, 'No té cap enllaç públic d’este lloc']);
      const text = panell().innerHTML;
      for (const fuga of ['blob:', '/Users/', 'token=', 'supabase.co', 'sdp-media']) expect([item.id, fuga, text.includes(fuga)]).toEqual([item.id, fuga, false]);
      cleanup();
    }
  });

  /* Ordre del Mestre (30-10-2026, prompt 2208, T4.2; QA-T3-UX-01) · Sense la
     prop avisSenseEnllac (tot qui el munta fora de l'Arxiu: les publicacions,
     el Perfil), una foto sense enllaç públic no porta la fila «Enllaç de la
     imatge» ni el text; amb un enllaç públic, la fila i el botó, com sempre. */
  test('fora de l’Arxiu (sense avisSenseEnllac): sense enllaç públic, cap fila; amb un, la URL i el botó', () => {
    const casos = [
      { id: '__lf_9x7k2', title: 'IMG_0001.jpg', src: 'blob:http://localhost:3000/3f2a9c1e-8b7d-4e21-9a0f-0c5d6e7f8a9b' },
      { id: 'pujada', title: 'Pujada', src: 'sdp-media://mitjans/t/u/avatars/a.webp', srcDelPort: 'https://fitxers.test/a.webp' },
      { id: 'fora', title: 'Fora', src: 'https://cdn.example/x.jpg' },
    ];
    for (const item of casos) {
      render(<VisorDeLArxiu llista={[item]} index={0} infoInicial />);
      expect([item.id, etiquetes().includes('Enllaç de la imatge')]).toEqual([item.id, false]);
      expect([item.id, panell().textContent.includes('No té cap enllaç públic')]).toEqual([item.id, false]);
      expect([item.id, botoCopia()]).toEqual([item.id, null]);
      expect([item.id, etiquetes().includes('Resolució')]).toEqual([item.id, true]);
      cleanup();
    }
    render(<VisorDeLArxiu llista={[TIBI]} index={0} infoInicial />);
    expect(filaEnllac().querySelector('[translate="no"]').textContent).toBe(`${window.location.origin}/assets/towns/tibi/1.jpg`);
    expect(botoCopia()).not.toBeNull();
  });
});

/* Gauntlet 261030 (f4b) · Les quatre troballes del visor sobre B3: el focus
   (B3-FOCUS-FLETXA), la reserva sense porta-retalls (B3-RESERVA-SENSE-TECLAT),
   l'origen públic de l'app nativa i el resolutor de l'amfitrió
   (b3-visor-origen-i-resolutor-sense-prova) i la foto que ja arriba resolta
   dins d'un amfitrió (B3-AMFITRIO-FALS-NEGATIU). */
describe('el visor de l’Arxiu · copiar l’enllaç: focus, teclat, app nativa i amfitrió (B3, Gauntlet 261030)', () => {
  const COPIA = 'Copiar l’enllaç de la imatge';
  const NO_COPIAT = 'No s’ha pogut copiar: selecciona l’enllaç i copia’l a mà.';
  const PAQUET = 'https://amfitrio.example/wp-content/plugins/socdepoble/dist';
  const panell = () => visor().querySelector('.sdp-visor__panell');
  const filaEnllac = () => [...visor().querySelectorAll('.sdp-visor__fila')]
    .find((f) => f.querySelector('dt').textContent === 'Enllaç de la imatge')?.querySelector('dd');
  const textUrl = () => filaEnllac().querySelector('[translate="no"]').textContent;
  const botoCopia = () => within(panell()).queryByRole('button', { name: COPIA });
  const estat = () => within(filaEnllac()).getByRole('status');
  const portaRetalls = (writeText) => Object.defineProperty(navigator, 'clipboard', { value: writeText ? { writeText } : undefined, configurable: true });
  const local = (n) => `${window.location.origin}/assets/towns/tibi/${n}.jpg`;
  const foto = (n) => ({ ...TIBI, id: `town-tibi-${n}`, src: `/assets/towns/tibi/${n}.jpg` });
  /* El visor com el munta /multimedia: l'índex és del pare i les fletxes el canvien (onCanvi). */
  function AmbFletxes({ llista }) {
    const [index, setIndex] = useState(0);
    return <VisorDeLArxiu llista={llista} index={index} onCanvi={setIndex} infoInicial />;
  }
  afterEach(() => {
    delete navigator.clipboard;
    delete window.Capacitor;
    fixaBaseRecursos('/');
    window.getSelection()?.removeAllRanges();
  });

  test('amb el focus a «Copiar l’enllaç» (també després de copiar), les fletxes passen fotos i el focus es queda al mateix botó', async () => {
    portaRetalls(vi.fn(async () => {}));
    render(<AmbFletxes llista={[foto(1), foto(2), foto(3)]} />);
    const boto = botoCopia();
    boto.focus();
    await act(async () => { boto.click(); });
    expect(estat().textContent).toBe('Enllaç copiat');
    for (const n of [2, 3, 1, 2]) {
      act(() => { fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' }); });
      expect([n, textUrl()]).toEqual([n, local(n)]);
      expect([n, document.activeElement === boto, boto.isConnected, visor().contains(document.activeElement)]).toEqual([n, true, true, true]);
      // Canviar de foto buida l'avís.
      expect([n, estat().textContent]).toEqual([n, '']);
    }
    act(() => { fireEvent.keyDown(document.activeElement, { key: 'ArrowLeft' }); });
    expect(textUrl()).toBe(local(1));
    expect(document.activeElement === boto).toBe(true);
  });

  test('una còpia que acaba tard d’una altra foto no es pinta mai, ni en tornar-hi', async () => {
    const acaben = [];
    portaRetalls(vi.fn(() => new Promise((resol) => { acaben.push(resol); })));
    const { rerender } = render(<VisorDeLArxiu llista={[foto(1), foto(2)]} index={0} infoInicial />);
    await act(async () => { botoCopia().click(); });
    act(() => rerender(<VisorDeLArxiu llista={[foto(1), foto(2)]} index={1} infoInicial />));
    await act(async () => { acaben[0](); });
    expect([textUrl(), estat().textContent]).toEqual([local(2), '']);
    act(() => rerender(<VisorDeLArxiu llista={[foto(1), foto(2)]} index={0} infoInicial />));
    expect([textUrl(), estat().textContent]).toEqual([local(1), '']);
  });

  test('si no es pot copiar, la URL queda seleccionada i el focus, al botó: Ctrl+C (⌘C) la copia des del teclat', async () => {
    const casos = [
      ['permís negat', vi.fn(async () => { throw new DOMException('Denegat', 'NotAllowedError'); })],
      ['cap porta-retalls (context no segur)', null]
    ];
    for (const [motiu, writeText] of casos) {
      portaRetalls(writeText);
      render(<VisorDeLArxiu llista={[TIBI]} index={0} infoInicial />);
      const boto = botoCopia();
      boto.focus();
      await act(async () => { boto.click(); });
      expect([motiu, estat().textContent]).toEqual([motiu, NO_COPIAT]);
      expect([motiu, window.getSelection().toString()]).toEqual([motiu, local(1)]);
      expect([motiu, document.activeElement === boto]).toEqual([motiu, true]);
      cleanup();
      window.getSelection().removeAllRanges();
    }
    // Si copia, no se selecciona res.
    portaRetalls(vi.fn(async () => {}));
    render(<VisorDeLArxiu llista={[TIBI]} index={0} infoInicial />);
    await act(async () => { botoCopia().click(); });
    expect([estat().textContent, window.getSelection().toString()]).toEqual(['Enllaç copiat', '']);
    cleanup();
    // Canviar de foto se'n porta l'avís i la selecció; el focus es queda al botó i les fletxes continuen.
    portaRetalls(null);
    render(<AmbFletxes llista={[foto(1), foto(2), foto(3)]} />);
    const boto = botoCopia();
    boto.focus();
    await act(async () => { boto.click(); });
    expect([estat().textContent, window.getSelection().toString()]).toEqual([NO_COPIAT, local(1)]);
    act(() => { fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' }); });
    expect([textUrl(), estat().textContent, window.getSelection().toString(), document.activeElement === boto]).toEqual([local(2), '', '', true]);
    act(() => { fireEvent.keyDown(document.activeElement, { key: 'ArrowRight' }); });
    expect(textUrl()).toBe(local(3));
  });

  test('a l’app nativa, la URL de l’origen públic (origenDeLaPagina), mai la de https://localhost', async () => {
    window.Capacitor = { isNativePlatform: () => true };
    const writeText = vi.fn(async () => {});
    portaRetalls(writeText);
    render(<VisorDeLArxiu llista={[TIBI]} index={0} infoInicial />);
    expect(textUrl()).toBe('https://socdepoble.org/assets/towns/tibi/1.jpg');
    await act(async () => { botoCopia().click(); });
    expect(writeText).toHaveBeenCalledWith('https://socdepoble.org/assets/towns/tibi/1.jpg');
    expect(filaEnllac().innerHTML).not.toContain(window.location.origin);
  });

  test('dins d’un amfitrió, la URL del paquet (resolRecursPropi); i una foto que ja arriba resolta porta la mateixa', async () => {
    fixaBaseRecursos(PAQUET);
    const writeText = vi.fn(async () => {});
    portaRetalls(writeText);
    const resolta = { ...TIBI, id: 'town-tibi-resolta', src: `${PAQUET}/assets/towns/tibi/1.jpg` };
    const { rerender } = render(<VisorDeLArxiu llista={[TIBI, resolta]} index={0} infoInicial />);
    expect(textUrl()).toBe(`${PAQUET}/assets/towns/tibi/1.jpg`);
    await act(async () => { botoCopia().click(); });
    expect(writeText).toHaveBeenLastCalledWith(`${PAQUET}/assets/towns/tibi/1.jpg`);
    act(() => rerender(<VisorDeLArxiu llista={[TIBI, resolta]} index={1} infoInicial />));
    expect(textUrl()).toBe(`${PAQUET}/assets/towns/tibi/1.jpg`);
    await act(async () => { botoCopia().click(); });
    expect(writeText).toHaveBeenLastCalledWith(`${PAQUET}/assets/towns/tibi/1.jpg`);
    cleanup();
    // Una base que és un camí del mateix lloc: la crua i la resolta, el mateix enllaç.
    const CAMI = '/wp-content/plugins/socdepoble/dist';
    fixaBaseRecursos(CAMI);
    const resoltaCami = { ...TIBI, id: 'town-tibi-cami', src: `${CAMI}/assets/towns/tibi/1.jpg` };
    const { rerender: rerenderCami } = render(<VisorDeLArxiu llista={[TIBI, resoltaCami]} index={0} infoInicial />);
    expect(textUrl()).toBe(`${window.location.origin}${CAMI}/assets/towns/tibi/1.jpg`);
    act(() => rerenderCami(<VisorDeLArxiu llista={[TIBI, resoltaCami]} index={1} infoInicial />));
    expect(textUrl()).toBe(`${window.location.origin}${CAMI}/assets/towns/tibi/1.jpg`);
  });
});
