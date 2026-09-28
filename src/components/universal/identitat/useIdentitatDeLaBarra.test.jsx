import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* T43 (ordre del Mestre, 260928) · la identitat de la barra negra amb el
   botó i el calaix de veres; la sessió, la identitat i els mitjans simulats. */
const m = vi.hoisted(() => ({ user: null, identitat: null }));
vi.mock('../../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: m.user }) }));
vi.mock('../../../app/contexts/IdentitatContext', () => ({ useIdentitat: () => m.identitat }));
/* Com la capacitat 'mitjans': un sdp-media:// es resol a una URL servible
   (ací, del mateix origen, que l'Avatar accepta). */
vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => (ref?.startsWith('sdp-media://') ? `/media/${ref.slice('sdp-media://'.length)}` : ref || '')
}));
import { useIdentitatDeLaBarra } from './useIdentitatDeLaBarra.js';
import { BotoIdentitatActiva } from './BotoIdentitatActiva.jsx';
import { CalaixIdentitats } from './CalaixIdentitats.jsx';

function Barra({ onNavega }) {
  const { boto, calaix } = useIdentitatDeLaBarra({ onNavega, etiquetaEntrar: 'Entrar' });
  return (
    <>
      <header className="bar-black"><div className="right-icons"><BotoIdentitatActiva {...boto} /></div></header>
      {calaix ? <CalaixIdentitats {...calaix} /> : null}
    </>
  );
}

const PERSONA = { tipus: 'persona', id: 'u-1', nom: 'Pepa Soler', avatar: 'https://lh3.googleusercontent.com/a/pepa.png', rol: 'persona' };
const FORN = { tipus: 'entitat', id: 'o-1', nom: 'Forn de la Torre', avatar: null, rol: 'owner' };

afterEach(cleanup);
beforeEach(() => {
  m.user = { id: 'u-1', user_metadata: { avatar_url: 'https://lh3.googleusercontent.com/a/pepa.png' } };
  m.identitat = {
    actor: PERSONA,
    identitats: [{ ...PERSONA, activa: true }, { ...FORN, activa: false }],
    setActor: vi.fn(() => true)
  };
});

test('una entitat sense logo mostra les SEUES inicials, mai la foto de la persona', () => {
  m.identitat.actor = FORN;
  render(<Barra onNavega={vi.fn()} />);
  const boto = screen.getByRole('button', { name: 'Identitat activa: Forn de la Torre (organització). Canviar identitat' });
  expect(boto.querySelector('img')).toBeNull();
  expect(boto.querySelector('.sdp-avatar').textContent).toBe('FD');
  expect(boto.innerHTML).not.toContain('pepa.png');
});

test('el logo desat com a sdp-media:// es resol abans de pintar-lo', () => {
  m.identitat.actor = { ...FORN, avatar: 'sdp-media://mitjans/forn.webp' };
  render(<Barra onNavega={vi.fn()} />);
  const img = screen.getByRole('button', { name: /Forn de la Torre/ }).querySelector('img');
  expect(img.getAttribute('src')).toBe('/media/mitjans/forn.webp');
});

test('el calaix és germà del header, sense estils en línia; triar crida setActor i el tanca', async () => {
  const { container } = render(<Barra onNavega={vi.fn()} />);
  expect(screen.queryByRole('dialog')).toBeNull();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Identitat activa: Pepa Soler. Canviar identitat' })); });
  const dialeg = screen.getByRole('dialog', { name: 'Amb qui actues?' });
  expect(dialeg.closest('header.bar-black')).toBeNull();
  expect(container.querySelector('header.bar-black').contains(dialeg)).toBe(false);
  expect(dialeg.querySelectorAll('[style]')).toHaveLength(0);
  expect(screen.getByRole('button', { name: /Identitat activa: Pepa Soler/ }).getAttribute('aria-expanded')).toBe('true');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Forn de la Torre/ })); });
  expect(m.identitat.setActor).toHaveBeenCalledWith('entitat', 'o-1');
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('les accions del calaix tanquen i naveguen; sense sessió el botó porta a /registre', async () => {
  const onNavega = vi.fn();
  const vista = render(<Barra onNavega={onNavega} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Identitat activa/ })); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Connectar-me a una organització' })); });
  // Poliment T43 · les organitzacions reals (padró), no el catàleg d'agents de /perfil.
  expect(onNavega).toHaveBeenLastCalledWith('/cerca?tipus=entitats');
  expect(screen.queryByRole('dialog')).toBeNull();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Identitat activa/ })); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'La meua fitxa i ajustos' })); });
  expect(onNavega).toHaveBeenLastCalledWith('/el-meu-perfil');
  vista.unmount();
  m.user = null;
  m.identitat = { actor: { tipus: 'persona', id: null, nom: null, avatar: null, rol: 'convidat' }, identitats: [], setActor: vi.fn(() => false) };
  const { container } = render(<Barra onNavega={onNavega} />);
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(onNavega).toHaveBeenLastCalledWith('/registre');
  expect(container.ownerDocument.querySelector('dialog')).toBeNull();
});
