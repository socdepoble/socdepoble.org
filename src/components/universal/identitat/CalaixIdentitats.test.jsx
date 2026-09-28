import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

/* T43 (ordre del Mestre, 260928) · el calaix «Amb qui actues?». */
vi.mock('../../../hooks/useResolvedAsset.js', () => ({ useResolvedAsset: () => '' }));
import { CalaixIdentitats } from './CalaixIdentitats.jsx';

afterEach(cleanup);

const IDENTITATS = [
  { tipus: 'persona', id: 'u-1', nom: 'Pepa Soler', avatar: null, rol: 'persona', activa: false },
  { tipus: 'entitat', id: 'o-1', nom: 'Forn de la Torre', avatar: null, rol: 'owner', activa: true },
  { tipus: 'entitat', id: 'o-2', nom: 'Colla', avatar: null, rol: 'admin', activa: false }
];

function pinta(props = {}) {
  const accions = { onTanca: vi.fn(), onTria: vi.fn(), onConnectar: vi.fn(), onFitxa: vi.fn() };
  const vista = render(<CalaixIdentitats obert identitats={IDENTITATS} {...accions} {...props} />);
  return { ...vista, ...accions };
}

test('títol i descripció, llista amb l’activa marcada (aria-current i «Activa») i els rols', () => {
  const { container } = pinta();
  const dialeg = screen.getByRole('dialog', { name: 'Amb qui actues?' });
  expect(dialeg.textContent).toContain('Tria amb quina identitat vols publicar i editar. Pots canviar quan vullgues.');
  const llista = within(dialeg).getByRole('list', { name: 'Identitats' });
  const botons = within(llista).getAllByRole('button');
  expect(botons.map((b) => b.getAttribute('aria-current'))).toEqual([null, 'true', null]);
  expect(botons[1].textContent).toContain('Activa');
  expect(botons[0].textContent).toContain('Persona');
  expect(botons[1].textContent).toContain('Propietari');
  expect(botons[2].textContent).toContain('Administra');
  expect(container.ownerDocument.querySelectorAll('dialog [style]')).toHaveLength(0);
});

test('triar una identitat la passa al pare; les accions del peu naveguen', () => {
  const { onTria, onConnectar, onFitxa } = pinta();
  fireEvent.click(screen.getByRole('button', { name: /Colla/ }));
  expect(onTria).toHaveBeenCalledWith('entitat', 'o-2');
  fireEvent.click(screen.getByRole('button', { name: 'Connectar-me a una organització' }));
  fireEvent.click(screen.getByRole('button', { name: 'La meua fitxa i ajustos' }));
  expect(onConnectar).toHaveBeenCalledTimes(1);
  expect(onFitxa).toHaveBeenCalledTimes(1);
});

test('tancat, no es mostra; el botó de tancar avisa el pare', () => {
  const { onTanca, unmount } = pinta();
  fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
  expect(onTanca).toHaveBeenCalledWith('boto');
  unmount();
  pinta({ obert: false });
  expect(screen.queryByRole('dialog')).toBeNull();
});
