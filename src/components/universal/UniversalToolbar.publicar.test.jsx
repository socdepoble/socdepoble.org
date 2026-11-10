/* T41 (ordre del Mestre, 260928) · PUBLICAR obri el selector de visibilitat:
   el botó ho anuncia (aria-haspopup). La barra continua muda: només crida onPublish. */
import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import UniversalToolbar from './UniversalToolbar.jsx';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test('amb publishPopup, PUBLICAR porta aria-haspopup i continua cridant onPublish; sense, com sempre', () => {
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; }
    observe() { this.callback([{ contentRect: { width: 900 } }]); }
    disconnect() {}
  });
  const onPublish = vi.fn();
  const { container, rerender } = render(<UniversalToolbar onPublish={onPublish} publishPopup="dialog" />);
  const boto = within(container).getByRole('button', { name: 'Publicar' });
  expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
  fireEvent.click(boto);
  expect(onPublish).toHaveBeenCalledOnce();
  rerender(<UniversalToolbar onPublish={onPublish} />);
  expect(within(container).getByRole('button', { name: 'Publicar' }).hasAttribute('aria-haspopup')).toBe(false);
});

/* R16-T (P0-80 / IDEA-211, ordre del Mestre del 261109) · Amb l'estat del
   document, el botó el diu en la llengua de la interfície: blau i
   «Publicar» ('pendent'), verd i «Publicat» ('publicat'). Sense estat, la
   pastilla de sempre; amb l'etiqueta de l'adaptador (Compartir), mana ella. */
const ES = { 'section.notes.publish': 'Publicar', 'section.notes.published': 'Publicado' };
const traductor = (diccionari) => (clau, reserva) => diccionari[clau] ?? reserva;
const botoDePublicar = (container) => container.querySelector('.sdp-editor-tools__group--publicacio > .sdp-bloc-action');

test('R16-T · «Publicat» en verd i «Publicar» en blau, traduïts; sense estat, cap classe d’estat', () => {
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { this.callback = callback; }
    observe() { this.callback([{ contentRect: { width: 900 } }]); }
    disconnect() {}
  });
  const onPublish = vi.fn();
  const { container, rerender } = render(<UniversalToolbar onPublish={onPublish} publishState="publicat" />);
  expect(within(container).getByRole('button', { name: 'Publicat' }).className).toBe('sdp-bloc-action sdp-bloc-action--publicat');

  rerender(<UniversalToolbar onPublish={onPublish} publishState="publicat" t={traductor(ES)} />);
  const publicat = within(container).getByRole('button', { name: 'Publicado' });
  expect(publicat.classList.contains('sdp-bloc-action--publicat')).toBe(true);
  fireEvent.click(publicat);
  expect(onPublish).toHaveBeenCalledOnce();

  rerender(<UniversalToolbar onPublish={onPublish} publishState="pendent" t={traductor(ES)} />);
  expect(within(container).getByRole('button', { name: 'Publicar' }).className).toBe('sdp-bloc-action sdp-bloc-action--publicar');

  rerender(<UniversalToolbar onPublish={onPublish} />);
  expect(botoDePublicar(container).className).toBe('sdp-bloc-action');

  rerender(<UniversalToolbar onPublish={onPublish} publishState="desconegut" />);
  expect(botoDePublicar(container).className).toBe('sdp-bloc-action');
  expect(botoDePublicar(container).textContent).toBe('Publicar');

  rerender(<UniversalToolbar onPublish={onPublish} publishLabel="Compartir" />);
  expect(within(container).getByRole('button', { name: 'Compartir' }).className).toBe('sdp-bloc-action');
});
