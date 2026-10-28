/* IDEA-41 (Llibre Mestre; Mestre 261028, Bloc H) · «🎴 Proposa Card» a la barra
   d'eines, només si l'editor el demana: en ample, el primer botó del grup de
   publicació; en compacte, l'últim del grup d'«Aa» (R2, revisió final 261028:
   al grup de publicació passava la barra del Bloc a dues files als telèfons).
   Ample o compacte, la cel·la de 48px (.sdp-bloc-icon) amb el glif i el nom
   accessible: la pastilla amb el text passava la barra a dues files (revisió
   adversarial 261028). Sense la prop, la barra de sempre. */
import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import UniversalToolbar from './UniversalToolbar.jsx';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const amplada = (px) => vi.stubGlobal('ResizeObserver', class {
  constructor(callback) { this.callback = callback; }
  observe() { this.callback([{ contentRect: { width: px } }]); }
  disconnect() {}
});
const grupPublicacio = (container) => container.querySelector('.sdp-editor-tools__group--publicacio');
const grupFormat = (container) => container.querySelector('.sdp-editor-tools__format-options');
/* En compacte, les opcions de format viuen darrere d'«Aa»: s'obrin abans de buscar el botó. */
const obriFormat = (container, mode) => {
  if (mode === 'compacta') fireEvent.click(within(container).getByRole('button', { name: 'Format del text' }));
};
const comprovaCella = (boto, proposa) => {
  expect(boto.className).toBe('sdp-bloc-icon');
  expect(boto.getAttribute('title')).toBe('Proposa Card');
  expect(boto.querySelector('span[aria-hidden="true"]').textContent).toBe('🎴');
  expect(boto.textContent).toBe('🎴');
  expect(boto.disabled).toBe(false);
  fireEvent.click(boto);
  expect(proposa).toHaveBeenCalledTimes(1);
};

test('sense onProposaCard, el grup de publicació és el de sempre: Borrar i Publicar', () => {
  amplada(900);
  const { container } = render(<UniversalToolbar onPublish={() => {}} onDelete={() => {}} />);
  expect([...grupPublicacio(container).querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Borrar', 'Publicar']);
});

test('ampla: una cel·la .sdp-bloc-icon de 48px davant de Borrar i Publicar, amb el glif amagat al lector i el nom accessible', () => {
  amplada(900);
  const proposa = vi.fn();
  const { container } = render(<UniversalToolbar onPublish={() => {}} onDelete={() => {}} onProposaCard={proposa} />);
  const botons = [...grupPublicacio(container).querySelectorAll('button')];
  const boto = within(container).getByRole('button', { name: 'Proposa Card' });
  expect(boto).toBe(botons[0]);
  expect(botons.slice(1).map((b) => b.textContent)).toEqual(['Borrar', 'Publicar']);
  expect(grupFormat(container).contains(boto)).toBe(false);
  comprovaCella(boto, proposa);
});

test('compacta (R2): la cel·la va dins d\'«Aa», darrere de la llista numerada, i el grup de publicació torna a ser Borrar i Publicar', () => {
  amplada(320);
  const proposa = vi.fn();
  const { container } = render(<UniversalToolbar onPublish={() => {}} onDelete={() => {}} onProposaCard={proposa} />);
  expect([...grupPublicacio(container).querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Borrar', 'Publicar']);
  expect(grupFormat(container).hidden).toBe(true);
  expect(within(container).queryByRole('button', { name: 'Proposa Card' })).toBeNull();
  obriFormat(container, 'compacta');
  const botons = [...grupFormat(container).querySelectorAll('button')];
  const boto = within(container).getByRole('button', { name: 'Proposa Card' });
  expect(boto).toBe(botons.at(-1));
  expect(botons.at(-2).getAttribute('aria-label')).toBe('Llista numerada');
  expect(grupPublicacio(container).contains(boto)).toBe(false);
  comprovaCella(boto, proposa);
});

for (const [mode, px] of [['ampla', 900], ['compacta', 320]]) {
  test(`${mode}: apagat quan no hi ha res a proposar; amb proposaCardDesfer, «Desfés la proposta» amb la icona de desfer, la mateixa cel·la`, () => {
    amplada(px);
    const proposa = vi.fn();
    const { container, rerender } = render(<UniversalToolbar onProposaCard={proposa} proposaCardDisabled />);
    obriFormat(container, mode);
    const apagat = within(container).getByRole('button', { name: 'Proposa Card' });
    expect(apagat.disabled).toBe(true);
    fireEvent.click(apagat);
    expect(proposa).not.toHaveBeenCalled();
    rerender(<UniversalToolbar onProposaCard={proposa} proposaCardDesfer />);
    const desfer = within(container).getByRole('button', { name: 'Desfés la proposta' });
    expect(desfer.disabled).toBe(false);
    expect(desfer.className).toBe('sdp-bloc-icon');
    expect(desfer.getAttribute('title')).toBe('Desfés la proposta');
    expect(desfer.querySelector('svg').getAttribute('width')).toBe('24');
    expect(desfer.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
  });
}

test('les etiquetes passen per t (claus section.notes.proposaCard i section.notes.proposaCardDesfer)', () => {
  amplada(900);
  const t = (clau, text) => (clau.startsWith('section.notes.proposaCard') ? `[${clau}]` : text);
  const { container, rerender } = render(<UniversalToolbar onProposaCard={() => {}} t={t} />);
  expect(within(container).getByRole('button', { name: '[section.notes.proposaCard]' })).toBeTruthy();
  rerender(<UniversalToolbar onProposaCard={() => {}} proposaCardDesfer t={t} />);
  expect(within(container).getByRole('button', { name: '[section.notes.proposaCardDesfer]' })).toBeTruthy();
});
