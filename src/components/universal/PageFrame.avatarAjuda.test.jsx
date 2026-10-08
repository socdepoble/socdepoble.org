/* Línia I1 de l'Onada 4 (pla 261008_1201) · Dues claus opcionals més de
   `avatarAutor` (CONTRACTE-1), que només compten si hi ha fila de píndoles,
   també la de les píndoles soles:
     · `ajuda` (text no buit): una línia p.sdp-camp__ajuda, últim fill de la
       fila .page-title-avatar-accions, sencera davall de les píndoles;
     · `pujant` (només true): les píndoles «canvia» i «lleva» disabled i
       aria-busy="true" mentre la imatge puja.
   Sense les claus, el DOM de sempre. */
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
const fila = (container) => container.querySelector('.page-title-avatar-accions');
const fills = (element) => [...element.children].map((e) => `${e.tagName}.${e.className}`);
const PEPA = { chrome: 'full', title: 'Pepa', authorName: 'Pepa', authorHref: '/gent/pepa' };
const AVATAR = { src: '/assets/pepa.png', alt: 'Avatar de Pepa' };
const MARCA = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
const AJUDA = 'PNG, JPEG o WebP, fins a 10 MB.';
const pinta = (avatarAutor) => render(<PageFrame {...PEPA} avatarAutor={avatarAutor} />);
const ambPindoles = (extra = {}) => ({ ...AVATAR, onCanvia: vi.fn(), etiquetaCanvia: 'Avatar', onLleva: vi.fn(), ...extra });

describe('sense les claus noves, el DOM de sempre', () => {
  test('ajuda buida o que no és text, i pujant que no és true: la fila i les píndoles d’abans', () => {
    const base = pinta(ambPindoles());
    const html = capcalera(base.container).outerHTML;
    cleanup();
    for (const claus of [{ ajuda: '' }, { ajuda: '   ' }, { ajuda: 7 }, { ajuda: null }, { pujant: false }, { pujant: 'true' }, { pujant: 1 }, { pujant: 'sí' }]) {
      const { container, unmount } = pinta(ambPindoles(claus));
      expect(capcalera(container).outerHTML, JSON.stringify(claus)).toBe(html);
      unmount();
    }
    // Ni disabled ni aria-busy a les píndoles de sempre.
    const { container } = pinta(ambPindoles());
    for (const boto of fila(container).querySelectorAll('button')) {
      expect(boto.hasAttribute('disabled')).toBe(false);
      expect(boto.hasAttribute('aria-busy')).toBe(false);
    }
  });

  test('ajuda sense cap píndola (només onCanvia, o lectura): cap fila ni cap línia', () => {
    for (const avatar of [{ ...AVATAR, onCanvia: vi.fn(), ajuda: AJUDA }, { ...AVATAR, ajuda: AJUDA, pujant: true }]) {
      const { container, unmount } = pinta(avatar);
      expect(fila(container), JSON.stringify(Object.keys(avatar))).toBeNull();
      expect(container.querySelector('.sdp-camp__ajuda')).toBeNull();
      unmount();
    }
  });

  test('les claus no arriben al DOM com a atributs', () => {
    const { container } = pinta(ambPindoles({ ajuda: AJUDA, pujant: true }));
    expect(container.querySelector('[ajuda], [pujant]')).toBeNull();
  });
});

describe('ajuda · la línia davall de les píndoles', () => {
  test('amb avatar pintat: últim fill de la fila, després de «canvia» i «lleva», abans de l’H1', () => {
    const { container } = pinta(ambPindoles({ ajuda: AJUDA }));
    expect(fills(capcalera(container))).toEqual([
      'BUTTON.page-title-avatar page-title-avatar--canvia', 'DIV.page-title-avatar-accions', 'H1.'
    ]);
    expect(fills(fila(container))).toEqual(['BUTTON.sdp-classificacio-pindola', 'BUTTON.sdp-classificacio-pindola', 'P.sdp-camp__ajuda']);
    expect(fila(container).querySelector('.sdp-camp__ajuda').textContent).toBe(AJUDA);
  });

  test('el text es neteja d’espais als extrems', () => {
    const { container } = pinta(ambPindoles({ ajuda: `  ${AJUDA}  ` }));
    expect(fila(container).querySelector('.sdp-camp__ajuda').textContent).toBe(AJUDA);
  });

  test('en el camí de les píndoles soles (la marca o una adreça insegura): també', () => {
    for (const src of [MARCA, 'javascript:alert(1)']) {
      const { container, unmount } = pinta(ambPindoles({ src, ajuda: AJUDA }));
      expect(fills(capcalera(container)), src).toEqual(['DIV.page-title-avatar-accions', 'H1.']);
      expect(fills(fila(container)), src).toEqual(['BUTTON.sdp-classificacio-pindola', 'BUTTON.sdp-classificacio-pindola', 'P.sdp-camp__ajuda']);
      unmount();
    }
  });

  test('mentre el port resol un sdp-media://: la píndola de canviar i l’ajuda; resolt, també la de llevar', async () => {
    mocks.capacitats = new Set(['mitjans']);
    let resol;
    mocks.resol.mockImplementation(() => new Promise((r) => { resol = r; }));
    const { container } = pinta(ambPindoles({ src: 'sdp-media://avatars/pepa', ajuda: AJUDA }));
    expect(fills(fila(container))).toEqual(['BUTTON.sdp-classificacio-pindola', 'P.sdp-camp__ajuda']);
    await act(async () => { resol('https://mitjans.socdepoble.org/pepa.webp'); });
    expect(fills(fila(container))).toEqual(['BUTTON.sdp-classificacio-pindola', 'BUTTON.sdp-classificacio-pindola', 'P.sdp-camp__ajuda']);
  });

  test('un sdp-media:// que el port no resol: les píndoles soles i l’ajuda', async () => {
    mocks.capacitats = new Set(['mitjans']);
    mocks.resol.mockResolvedValue(null);
    const { container } = pinta(ambPindoles({ src: 'sdp-media://avatars/pepa', ajuda: AJUDA }));
    await act(async () => {});
    expect(fills(capcalera(container))).toEqual(['DIV.page-title-avatar-accions', 'H1.']);
    expect(fila(container).lastElementChild.textContent).toBe(AJUDA);
  });
});

describe('pujant · les píndoles desactivades i ocupades mentre la imatge puja', () => {
  test('«canvia» i «lleva» disabled i aria-busy="true"; cap clic arriba; l’avatar-botó no canvia', () => {
    const avatar = ambPindoles({ pujant: true });
    const { container } = pinta(avatar);
    const pindoles = [...fila(container).querySelectorAll('button')];
    expect(pindoles.map((b) => b.textContent)).toEqual(['Avatar', ETIQUETA_LLEVA_AVATAR]);
    for (const boto of pindoles) {
      expect(boto.disabled, boto.textContent).toBe(true);
      expect(boto.getAttribute('aria-busy'), boto.textContent).toBe('true');
      fireEvent.click(boto);
    }
    expect(avatar.onLleva).not.toHaveBeenCalled();
    expect(avatar.onCanvia).not.toHaveBeenCalled();
    const avatarBoto = within(capcalera(container)).getByRole('button', { name: ETIQUETA_CANVIA_AVATAR });
    expect(avatarBoto.hasAttribute('disabled')).toBe(false);
    expect(avatarBoto.hasAttribute('aria-busy')).toBe(false);
  });

  test('en acabar (pujant false), les píndoles tornen a ser les de sempre', () => {
    const avatar = ambPindoles();
    const vista = render(<PageFrame {...PEPA} avatarAutor={{ ...avatar, pujant: true }} />);
    vista.rerender(<PageFrame {...PEPA} avatarAutor={avatar} />);
    const pindoles = [...fila(vista.container).querySelectorAll('button')];
    for (const boto of pindoles) {
      expect(boto.hasAttribute('disabled')).toBe(false);
      expect(boto.hasAttribute('aria-busy')).toBe(false);
    }
    fireEvent.click(within(fila(vista.container)).getByRole('button', { name: ETIQUETA_LLEVA_AVATAR }));
    expect(avatar.onLleva).toHaveBeenCalledTimes(1);
  });

  test('en el camí de les píndoles soles, també', () => {
    const { container } = pinta(ambPindoles({ src: MARCA, pujant: true, ajuda: AJUDA }));
    const pindoles = [...fila(container).querySelectorAll('button')];
    expect(pindoles).toHaveLength(2);
    for (const boto of pindoles) {
      expect(boto.disabled).toBe(true);
      expect(boto.getAttribute('aria-busy')).toBe('true');
    }
  });
});

/* Correcció de la revisió de la línia I1 (prova 4) · La línia d'ajuda va
   lligada amb aria-describedby als controls que trien la foto: la píndola
   «canvia» i l'avatar-botó, com el Camp de Pedra Seca (formulari.jsx).
   «Llevar» no: el límit de la foto no li diu res. Sense ajuda, cap id. */
describe('aria-describedby · la línia d’ajuda lligada als controls que trien la foto', () => {
  test('amb avatar pintat: la píndola «canvia» i l’avatar-botó la citen; «lleva», no', () => {
    const { container } = pinta(ambPindoles({ ajuda: AJUDA }));
    const linia = fila(container).querySelector('.sdp-camp__ajuda');
    expect(linia.id).toMatch(/-ajuda$/);
    const [canvia, lleva] = fila(container).querySelectorAll('button');
    expect(canvia.getAttribute('aria-describedby')).toBe(linia.id);
    expect(lleva.hasAttribute('aria-describedby')).toBe(false);
    const avatar = within(capcalera(container)).getByRole('button', { name: ETIQUETA_CANVIA_AVATAR, description: AJUDA });
    expect(avatar.getAttribute('aria-describedby')).toBe(linia.id);
    expect(within(fila(container)).getByRole('button', { name: 'Avatar', description: AJUDA })).toBe(canvia);
  });

  test('en el camí de les píndoles soles: la píndola «canvia» la cita', () => {
    const { container } = pinta(ambPindoles({ src: MARCA, ajuda: AJUDA }));
    expect(fills(capcalera(container))).toEqual(['DIV.page-title-avatar-accions', 'H1.']);
    expect(within(fila(container)).getByRole('button', { name: 'Avatar', description: AJUDA })).toBeTruthy();
  });

  test('mentre puja, la descripció és la que passa la pàgina', () => {
    const PUJANT = 'Encara s’està desant la imatge.';
    const { container } = pinta(ambPindoles({ ajuda: PUJANT, pujant: true }));
    expect(within(fila(container)).getByRole('button', { name: 'Avatar', description: PUJANT }).disabled).toBe(true);
  });

  test('dos avatars a la mateixa pàgina no es comparteixen l’id', () => {
    const { container } = render(
      <>
        <PageFrame {...PEPA} avatarAutor={ambPindoles({ ajuda: AJUDA })} />
        <PageFrame {...PEPA} avatarAutor={ambPindoles({ ajuda: AJUDA })} />
      </>
    );
    const ids = [...container.querySelectorAll('.page-title-avatar-accions > .sdp-camp__ajuda')].map((p) => p.id);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  test('sense ajuda, ni id ni aria-describedby (tampoc a l’avatar-botó)', () => {
    const { container } = pinta(ambPindoles());
    expect(capcalera(container).querySelectorAll('[aria-describedby], [id]')).toHaveLength(0);
  });
});

describe('CSS · la línia d’ajuda de la fila, només amb tokens i dins de @layer components', () => {
  const css = readFileSync(path.join(process.cwd(), 'src/css/components.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

  test('.page-title-avatar-accions > .sdp-camp__ajuda: una línia sencera, centrada i sense marge propi', () => {
    const inici = css.indexOf('.page-title-avatar-accions > .sdp-camp__ajuda {');
    expect(inici).toBeGreaterThan(-1);
    const regla = css.slice(inici, css.indexOf('}', inici));
    for (const declaracio of ['flex-basis: 100%;', 'margin: 0;', 'text-align: center;']) {
      expect(regla, declaracio).toContain(declaracio);
    }
    expect(regla).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|\d+px|:has\(|color-mix/i);
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
