/* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 2: «neteja visual
   total sota l'avatar»; el clic al cercle obri el retall de la imatge que ja
   hi ha) · AvatarDeCapcalera (PageFrame) admet quatre claus opcionals noves:
   `nomBoto` (el nom accessible del cercle-botó), `botoBuit` (sense imatge, el
   cercle-botó buit amb la càmera), `obriFinestra` (aria-haspopup="dialog") i
   `ocupat` (aria-busy). Sense elles, el DOM de sempre: la resta de pàgines
   (la fitxa pública, el detall, el catàleg) no canvien. */
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ capacitats: new Set(), resol: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat),
  resolveAsset: (ref, opcions) => mocks.resol(ref, opcions),
}));
import { AvatarDeCapcalera, ETIQUETA_CANVIA_AVATAR } from './PageFrame.jsx';
import { DEFAULT_AUTHOR } from './UniversalUtils.js';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.capacitats = new Set();
});
afterEach(cleanup);

const AVATAR = { src: '/assets/pepa.png', alt: 'Avatar de Pepa' };
const fills = (container) => [...container.children].map((e) => `${e.tagName}.${e.className}`);
const boto = (container) => container.querySelector('button.page-title-avatar--canvia');

describe('sense les claus noves, el DOM de sempre', () => {
  test('el nom de sempre, cap aria-haspopup ni aria-busy; sense imatge ni píndoles, res', () => {
    const { container, unmount } = render(<AvatarDeCapcalera {...AVATAR} onCanvia={vi.fn()} />);
    expect(boto(container).getAttribute('aria-label')).toBe(ETIQUETA_CANVIA_AVATAR);
    expect(boto(container).hasAttribute('aria-haspopup')).toBe(false);
    expect(boto(container).hasAttribute('aria-busy')).toBe(false);
    unmount();
    const buit = render(<AvatarDeCapcalera src="" alt="" onCanvia={vi.fn()} />);
    expect(buit.container.childElementCount).toBe(0);
  });

  test('`pujant` continua sense tocar el cercle (només les píndoles, si n’hi ha)', () => {
    const { container } = render(<AvatarDeCapcalera {...AVATAR} onCanvia={vi.fn()} pujant />);
    expect(boto(container).hasAttribute('aria-busy')).toBe(false);
    expect(boto(container).disabled).toBe(false);
  });
});

describe('amb les claus noves', () => {
  test('nomBoto, obriFinestra i ocupat: el nom, aria-haspopup="dialog" i aria-busy; el botó no es desactiva', () => {
    const onCanvia = vi.fn();
    const { container } = render(
      <AvatarDeCapcalera {...AVATAR} onCanvia={onCanvia} nomBoto="Ajusta o canvia l’avatar" obriFinestra ocupat />,
    );
    expect(fills(container)).toEqual(['BUTTON.page-title-avatar page-title-avatar--canvia']);
    const cercle = boto(container);
    expect(cercle.getAttribute('aria-label')).toBe('Ajusta o canvia l’avatar');
    expect(cercle.getAttribute('aria-haspopup')).toBe('dialog');
    expect(cercle.getAttribute('aria-busy')).toBe('true');
    expect(cercle.disabled).toBe(false);
    expect(cercle.querySelector('img.page-title-avatar__imatge').getAttribute('src')).toBe('/assets/pepa.png');
    fireEvent.click(cercle);
    expect(onCanvia).toHaveBeenCalledTimes(1);
  });

  /* Correcció de la revisió (Pla 2000) · `ocupat` també es veu (el
     carregador al lloc de la càmera) i, amb `textOcupat`, s'anuncia en una
     regió d'estat amagada, germana del cercle. Sense textOcupat, cap node nou. */
  test('ocupat: el carregador al lloc de la càmera; textOcupat, la regió d’estat amagada que el diu', () => {
    const { container, rerender } = render(<AvatarDeCapcalera {...AVATAR} onCanvia={vi.fn()} ocupat />);
    expect(fills(container)).toEqual(['BUTTON.page-title-avatar page-title-avatar--canvia']);
    expect(boto(container).querySelector('.page-title-avatar__marca .page-title-avatar__gir')).not.toBeNull();
    rerender(<AvatarDeCapcalera {...AVATAR} onCanvia={vi.fn()} ocupat textOcupat="S’està desant." />);
    expect(fills(container)).toEqual(['BUTTON.page-title-avatar page-title-avatar--canvia', 'SPAN.sdp-sr-only']);
    const estat = container.querySelector('span.sdp-sr-only');
    expect(estat.getAttribute('role')).toBe('status');
    expect(estat.textContent).toBe('S’està desant.');
    rerender(<AvatarDeCapcalera {...AVATAR} onCanvia={vi.fn()} textOcupat="S’està desant." />);
    expect(container.querySelector('span.sdp-sr-only').textContent).toBe('');
    expect(boto(container).querySelector('.page-title-avatar__gir')).toBeNull();
    expect(boto(container).querySelector('.page-title-avatar__marca svg')).not.toBeNull();
    // Sense onCanvia no hi ha res que puge: cap regió.
    rerender(<AvatarDeCapcalera {...AVATAR} ocupat textOcupat="S’està desant." />);
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  test('valors que no són els esperats són com si no hi foren (un nom buit, un "true" de text)', () => {
    const { container } = render(<AvatarDeCapcalera {...AVATAR} onCanvia={vi.fn()} nomBoto="  " obriFinestra="true" ocupat={1} />);
    expect(boto(container).getAttribute('aria-label')).toBe(ETIQUETA_CANVIA_AVATAR);
    expect(boto(container).hasAttribute('aria-haspopup')).toBe(false);
    expect(boto(container).hasAttribute('aria-busy')).toBe(false);
  });

  test('botoBuit sense imatge: el cercle-botó buit, amb la càmera i sense cap <img>; sense onCanvia, res', () => {
    const onCanvia = vi.fn();
    const { container, unmount } = render(<AvatarDeCapcalera src="" alt="Avatar de Pepa" onCanvia={onCanvia} botoBuit nomBoto="Posa un avatar" />);
    expect(fills(container)).toEqual(['BUTTON.page-title-avatar page-title-avatar--canvia']);
    expect(boto(container).querySelector('img')).toBeNull();
    expect(boto(container).querySelector('.page-title-avatar__marca svg')).not.toBeNull();
    expect(boto(container).getAttribute('aria-label')).toBe('Posa un avatar');
    fireEvent.click(boto(container));
    expect(onCanvia).toHaveBeenCalledTimes(1);
    unmount();
    const lectura = render(<AvatarDeCapcalera src="" alt="" botoBuit />);
    expect(lectura.container.childElementCount).toBe(0);
  });

  test('botoBuit amb una referència que no es pot pintar (la marca, un sdp-media:// que el port no resol): el cercle buit, mai l’esquema cru', async () => {
    const { container, unmount } = render(<AvatarDeCapcalera src={DEFAULT_AUTHOR.avatarUrl} alt="" onCanvia={vi.fn()} botoBuit />);
    expect(boto(container).querySelector('img')).toBeNull();
    unmount();
    mocks.capacitats = new Set(['mitjans']);
    mocks.resol.mockResolvedValue(null);
    const opac = render(<AvatarDeCapcalera src="sdp-media://mitjans/t/u/avatars/a.webp" alt="" onCanvia={vi.fn()} botoBuit />);
    await vi.waitFor(() => expect(mocks.resol).toHaveBeenCalled());
    expect(boto(opac.container)).not.toBeNull();
    expect(opac.container.innerHTML).not.toContain('sdp-media:');
  });
});
