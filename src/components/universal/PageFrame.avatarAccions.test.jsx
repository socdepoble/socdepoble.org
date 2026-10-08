/* Contracte-1 (pla 261008_1201, el retallador de l'avatar) · L'avatar redó
   del bloc del títol (PageFrame, avatarAutor) admet tres claus opcionals
   noves: amb onCanvia i `etiquetaCanvia`, davall de l'avatar una píndola de
   text visible que fa el mateix que l'avatar; amb `onLleva` i una imatge
   pintada, una segona píndola que la lleva (`etiquetaLleva`, per defecte
   «Llevar l'avatar»). Sense eixes claus, el DOM de sempre. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ capacitats: new Set(), resol: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat),
  resolveAsset: (ref, opcions) => mocks.resol(ref, opcions)
}));
import { ETIQUETA_CANVIA_AVATAR, ETIQUETA_LLEVA_AVATAR, PageFrame } from './PageFrame.jsx';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.capacitats = new Set();
});
afterEach(cleanup);

const capcalera = (container) => container.querySelector('header.page-title');
const fills = (element) => [...element.children].map((e) => `${e.tagName}.${e.className}`);
const PEPA = { chrome: 'full', title: 'Pepa', authorName: 'Pepa', authorHref: '/gent/pepa' };
const AVATAR = { src: '/assets/pepa.png', alt: 'Avatar de Pepa' };
const pinta = (avatarAutor) => render(<PageFrame {...PEPA} avatarAutor={avatarAutor} />);

describe('sense les claus noves, el DOM de sempre', () => {
  test('amb onCanvia i sense etiquetaCanvia ni onLleva: l’avatar-botó sol, cap fila de píndoles', () => {
    const { container } = pinta({ ...AVATAR, onCanvia: vi.fn() });
    expect(fills(capcalera(container))).toEqual(['BUTTON.page-title-avatar page-title-avatar--canvia', 'H1.']);
    expect(container.querySelector('.page-title-avatar-accions')).toBeNull();
  });

  test('un text buit o que no és text i un onLleva que no és funció són com si no hi foren', () => {
    for (const claus of [{ etiquetaCanvia: '' }, { etiquetaCanvia: '   ' }, { etiquetaCanvia: 7 }, { onLleva: 'llevar' }, { onLleva: null }]) {
      const { container, unmount } = pinta({ ...AVATAR, onCanvia: vi.fn(), ...claus });
      expect(fills(capcalera(container)), JSON.stringify(claus)).toEqual(['BUTTON.page-title-avatar page-title-avatar--canvia', 'H1.']);
      unmount();
    }
  });

  test('etiquetaCanvia sense onCanvia (lectura): cap píndola, l’avatar de lectura', () => {
    const { container } = pinta({ ...AVATAR, etiquetaCanvia: 'Canviar l’avatar' });
    expect(fills(capcalera(container))).toEqual(['DIV.page-title-avatar', 'H1.']);
  });
});

describe('amb les claus noves, les píndoles davall de l’avatar, abans de l’H1', () => {
  test('etiquetaCanvia: una píndola de text visible que crida el mateix onCanvia que l’avatar', () => {
    const onCanvia = vi.fn();
    const { container } = pinta({ ...AVATAR, onCanvia, etiquetaCanvia: 'Canviar l’avatar' });
    expect(fills(capcalera(container))).toEqual([
      'BUTTON.page-title-avatar page-title-avatar--canvia', 'DIV.page-title-avatar-accions', 'H1.'
    ]);
    const fila = container.querySelector('.page-title-avatar-accions');
    const pindola = within(fila).getByRole('button', { name: 'Canviar l’avatar' });
    expect(pindola.getAttribute('type')).toBe('button');
    expect(pindola.className).toBe('sdp-classificacio-pindola');
    expect(pindola.querySelector('.sp-card-label.sdp-badge-buit > .sdp-classificacio-pindola__text').textContent).toBe('Canviar l’avatar');
    expect(pindola.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    fireEvent.click(pindola);
    expect(onCanvia).toHaveBeenCalledTimes(1);
    // L'avatar continua sent el botó de sempre, amb el seu nom.
    fireEvent.click(within(capcalera(container)).getByRole('button', { name: ETIQUETA_CANVIA_AVATAR }));
    expect(onCanvia).toHaveBeenCalledTimes(2);
  });

  test('onLleva: una segona píndola que crida onLleva, amb el text per defecte o el de qui la passa', () => {
    const onLleva = vi.fn();
    const onCanvia = vi.fn();
    let { container } = pinta({ ...AVATAR, onCanvia, etiquetaCanvia: 'Canviar l’avatar', onLleva });
    const fila = container.querySelector('.page-title-avatar-accions');
    expect([...fila.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Canviar l’avatar', ETIQUETA_LLEVA_AVATAR]);
    expect(ETIQUETA_LLEVA_AVATAR).toBe("Llevar l'avatar");
    fireEvent.click(within(fila).getByRole('button', { name: ETIQUETA_LLEVA_AVATAR }));
    expect(onLleva).toHaveBeenCalledTimes(1);
    expect(onCanvia).not.toHaveBeenCalled();
    cleanup();
    ({ container } = pinta({ ...AVATAR, onLleva, etiquetaLleva: 'Traure el logotip' }));
    expect(fills(capcalera(container))).toEqual(['DIV.page-title-avatar', 'DIV.page-title-avatar-accions', 'H1.']);
    expect([...container.querySelectorAll('.page-title-avatar-accions button')].map((b) => b.textContent)).toEqual(['Traure el logotip']);
  });

  test('onLleva sense imatge pintada (el port encara la resol): cap píndola de llevar', async () => {
    mocks.capacitats = new Set(['mitjans']);
    let resol;
    mocks.resol.mockImplementation(() => new Promise((r) => { resol = r; }));
    const onLleva = vi.fn();
    const { container } = pinta({ src: 'sdp-media://avatars/pepa', alt: 'Avatar de Pepa', onCanvia: vi.fn(), etiquetaCanvia: 'Canviar l’avatar', onLleva });
    // Mentre es resol: la caixa i la píndola de canviar, cap de llevar.
    expect([...container.querySelectorAll('.page-title-avatar-accions button')].map((b) => b.textContent)).toEqual(['Canviar l’avatar']);
    await act(async () => { resol('https://mitjans.socdepoble.org/pepa.webp'); });
    expect([...container.querySelectorAll('.page-title-avatar-accions button')].map((b) => b.textContent)).toEqual(['Canviar l’avatar', ETIQUETA_LLEVA_AVATAR]);
  });

  test('les claus no arriben al DOM com a atributs', () => {
    const { container } = pinta({ ...AVATAR, onCanvia: vi.fn(), etiquetaCanvia: 'Canviar l’avatar', onLleva: vi.fn(), etiquetaLleva: 'Llevar' });
    expect(container.querySelector('[etiquetacanvia], [onlleva], [etiquetalleva]')).toBeNull();
  });
});

/* Correcció de la revisió (261008) · Un avatar_url que no es pot pintar (la
   marca de Sóc de Poble d'un agent de la llavor, una adreça insegura, un
   sdp-media:// esborrat o d'un amfitrió sense 'mitjans') deixava la persona
   sense cap control: PageFrame no pintava res i el Perfil no obri la ranura
   perquè el camp no és buit. Amb les claus noves, les píndoles soles. */
describe('una referència que no es pot pintar: les píndoles soles, perquè es puga canviar o buidar', () => {
  const MARCA = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
  const botonsDeLaFila = (container) => [...container.querySelectorAll('.page-title-avatar-accions button')].map((b) => b.textContent);

  test('la marca de l’entitat o una adreça insegura: la fila sense avatar, abans de l’H1; cada píndola crida la seua acció', () => {
    for (const src of [MARCA, 'javascript:alert(1)', '//dolent.cat/x.png']) {
      const onCanvia = vi.fn();
      const onLleva = vi.fn();
      const { container, unmount } = pinta({ src, alt: 'Avatar de Pepa', onCanvia, etiquetaCanvia: 'Avatar', onLleva });
      expect(fills(capcalera(container)), src).toEqual(['DIV.page-title-avatar-accions', 'H1.']);
      // Cap avatar ni cap imatge al bloc del títol (la boina de la barra taronja és a part).
      expect(capcalera(container).querySelector('.page-title-avatar, img'), src).toBeNull();
      expect(botonsDeLaFila(container), src).toEqual(['Avatar', ETIQUETA_LLEVA_AVATAR]);
      const fila = container.querySelector('.page-title-avatar-accions');
      fireEvent.click(within(fila).getByRole('button', { name: 'Avatar' }));
      fireEvent.click(within(fila).getByRole('button', { name: ETIQUETA_LLEVA_AVATAR }));
      expect(onCanvia, src).toHaveBeenCalledTimes(1);
      expect(onLleva, src).toHaveBeenCalledTimes(1);
      unmount();
    }
  });

  test('un sdp-media:// que el port no resol (missing, error) o un amfitrió sense mitjans: la fila sola, quan ja no carrega', async () => {
    const casos = [
      ['missing', () => { mocks.capacitats = new Set(['mitjans']); mocks.resol.mockResolvedValue(null); }],
      ['error', () => { mocks.capacitats = new Set(['mitjans']); mocks.resol.mockRejectedValue(new Error('xarxa')); }],
      ['marca', () => { mocks.capacitats = new Set(['mitjans']); mocks.resol.mockResolvedValue(MARCA); }],
      ['unsupported', () => { mocks.capacitats = new Set(); }]
    ];
    for (const [nom, prepara] of casos) {
      prepara();
      const { container, unmount } = pinta({ src: 'sdp-media://avatars/pepa', alt: 'Avatar de Pepa', onCanvia: vi.fn(), etiquetaCanvia: 'Avatar', onLleva: vi.fn() });
      await act(async () => {});
      expect(fills(capcalera(container)), nom).toEqual(['DIV.page-title-avatar-accions', 'H1.']);
      expect(botonsDeLaFila(container), nom).toEqual(['Avatar', ETIQUETA_LLEVA_AVATAR]);
      unmount();
      mocks.resol.mockReset();
    }
  });

  test('sense les claus noves (només onCanvia, o lectura), el DOM de sempre: res damunt de l’H1', async () => {
    for (const avatar of [{ src: MARCA, onCanvia: vi.fn() }, { src: MARCA }, { src: 'javascript:alert(1)', onCanvia: vi.fn(), etiquetaCanvia: '' }]) {
      const { container, unmount } = pinta(avatar);
      expect(fills(capcalera(container)), JSON.stringify(avatar)).toEqual(['H1.']);
      unmount();
    }
    mocks.capacitats = new Set(['mitjans']);
    mocks.resol.mockResolvedValue(null);
    const { container } = pinta({ src: 'sdp-media://avatars/pepa', alt: '', onCanvia: vi.fn() });
    await act(async () => {});
    expect(fills(capcalera(container))).toEqual(['H1.']);
  });

  test('sense cap referència (src buit), res: la pàgina hi posa la seua ranura', () => {
    for (const src of ['', '   ', undefined]) {
      const { container, unmount } = pinta({ src, onCanvia: vi.fn(), etiquetaCanvia: 'Avatar', onLleva: vi.fn() });
      expect(fills(capcalera(container)), String(src)).toEqual(['H1.']);
      unmount();
    }
  });

  test('amb un logotip (o senseLogo), cap píndola d’avatar', () => {
    const avatar = { src: MARCA, onCanvia: vi.fn(), etiquetaCanvia: 'Avatar', onLleva: vi.fn() };
    let { container } = render(<PageFrame {...PEPA} avatarAutor={avatar} logoEntitat={{ clar: '/assets/forn.webp', alt: 'Forn' }} />);
    expect(container.querySelector('.page-title-avatar-accions')).toBeNull();
    cleanup();
    ({ container } = render(<PageFrame {...PEPA} avatarAutor={avatar} senseLogo />));
    expect(container.querySelector('.page-title-avatar-accions')).toBeNull();
  });
});

describe('CSS · la fila de píndoles, només amb tokens i dins de @layer components', () => {
  const css = readFileSync(path.join(process.cwd(), 'src/css/components.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

  test('.page-title-avatar-accions: fila centrada que salta de línia, amb l’aire de l’avatar abans de l’H1', () => {
    const inici = css.indexOf('.page-title-avatar-accions {');
    expect(inici).toBeGreaterThan(-1);
    const regla = css.slice(inici, css.indexOf('}', inici));
    for (const declaracio of ['display: flex;', 'flex-wrap: wrap;', 'justify-content: center;', 'gap: var(--sdp-space-2);', 'margin-block-end: var(--sdp-space-4);']) {
      expect(regla, declaracio).toContain(declaracio);
    }
    expect(regla).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|\d+px/i);
    // La capa que obri just abans de la regla encara és oberta quan la regla arriba.
    const obertura = css.lastIndexOf('@layer components {', inici);
    expect(obertura).toBeGreaterThan(-1);
    let fons = 0;
    for (let i = css.indexOf('{', obertura); i < inici; i += 1) {
      if (css[i] === '{') fons += 1;
      else if (css[i] === '}') fons -= 1;
    }
    expect(fons).toBe(1);
  });
});
