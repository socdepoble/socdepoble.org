/* IDEA-359 (v1.2.26 · Pedra Seca 2.0) · Retirada definitiva de la icona
   fantasma 🎴 a UniversalToolbar.jsx. La Maquetadora Editorial no-destructiva
   viu dins de «Més eines» (segona fila) en ample i dins de «Format del text»
   en compacte, amb el glif Lucide Sparkles (o Undo2 en desfer): el grup de
   publicació resta sempre net amb Borrar i Publicar.
   IDEA-41 / revisió adversarial 261028 · Ample o compacte, és la cel·la de
   48px (.sdp-bloc-icon) amb el glif i el nom accessible (aria-label i title):
   la pastilla amb el text passava la barra a dues files. D3 de l'integrador
   (Llei del Píxel): IDEA-359.1 (Llibre Mestre l. 3700) només retira 🎴. */
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
const segonaFila = (container) => container.querySelector('.sdp-editor-tools__segona-fila');
const obriMenu = (container, mode) => {
  fireEvent.click(within(container).getByRole('button', { name: mode === 'compacta' ? 'Format del text' : 'Més eines' }));
};
const comprovaBoto = (boto, proposa, container) => {
  expect(container.textContent).not.toContain('🎴');
  expect(boto.className).toBe('sdp-bloc-icon');
  expect(boto.getAttribute('aria-label')).toBe('Maqueta la targeta');
  expect(boto.getAttribute('title')).toBe('Maqueta la targeta');
  // Cap text a la vista: només el glif, amagat al lector (el nom és l'aria-label).
  expect(boto.textContent).toBe('');
  expect(boto.querySelector('svg.lucide-sparkles')).not.toBeNull();
  expect(boto.querySelector('svg').getAttribute('width')).toBe('24');
  expect(boto.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
  expect(boto.disabled).toBe(false);
  fireEvent.click(boto);
  expect(proposa).toHaveBeenCalledTimes(1);
};

test('sense onProposaCard, el grup de publicació és el de sempre: Borrar i Publicar', () => {
  amplada(900);
  const { container } = render(<UniversalToolbar onPublish={() => {}} onDelete={() => {}} />);
  expect([...grupPublicacio(container).querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Borrar', 'Publicar']);
});

test('ampla: el grup de publicació és sempre Borrar i Publicar; «Maqueta la targeta» (sense 🎴) viu dins de «Més eines»', () => {
  amplada(900);
  const proposa = vi.fn();
  const { container } = render(<UniversalToolbar onPublish={() => {}} onDelete={() => {}} onProposaCard={proposa} />);
  expect([...grupPublicacio(container).querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Borrar', 'Publicar']);
  expect(container.textContent).not.toContain('🎴');
  expect(segonaFila(container).hidden).toBe(true);
  expect(within(container).queryByRole('button', { name: 'Maqueta la targeta' })).toBeNull();
  obriMenu(container, 'ampla');
  const boto = within(container).getByRole('button', { name: 'Maqueta la targeta' });
  expect(segonaFila(container).contains(boto)).toBe(true);
  expect(segonaFila(container).lastElementChild).toBe(boto);
  expect(grupPublicacio(container).contains(boto)).toBe(false);
  expect(grupFormat(container).contains(boto)).toBe(false);
  comprovaBoto(boto, proposa, container);
});

test('compacta: «Maqueta la targeta» (sense 🎴) viu dins de «Format del text», l’última darrere del divisor', () => {
  amplada(320);
  const proposa = vi.fn();
  const { container } = render(<UniversalToolbar onPublish={() => {}} onDelete={() => {}} onProposaCard={proposa} />);
  expect([...grupPublicacio(container).querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Borrar', 'Publicar']);
  expect(grupFormat(container).hidden).toBe(true);
  expect(within(container).queryByRole('button', { name: 'Maqueta la targeta' })).toBeNull();
  obriMenu(container, 'compacta');
  const botons = [...grupFormat(container).querySelectorAll('button')];
  const boto = within(container).getByRole('button', { name: 'Maqueta la targeta' });
  expect(boto).toBe(botons.at(-1));
  expect(botons.at(-2).getAttribute('aria-label')).toBe('Divisor');
  expect(grupPublicacio(container).contains(boto)).toBe(false);
  comprovaBoto(boto, proposa, container);
});

for (const [mode, px] of [['ampla', 900], ['compacta', 320]]) {
  test(`${mode}: apagat quan no hi ha res a proposar; amb proposaCardDesfer, «Desfés la maquetació» amb la icona de desfer`, () => {
    amplada(px);
    const proposa = vi.fn();
    const { container, rerender } = render(<UniversalToolbar onProposaCard={proposa} proposaCardDisabled />);
    obriMenu(container, mode);
    const apagat = within(container).getByRole('button', { name: 'Maqueta la targeta' });
    expect(apagat.disabled).toBe(true);
    fireEvent.click(apagat);
    expect(proposa).not.toHaveBeenCalled();
    rerender(<UniversalToolbar onProposaCard={proposa} proposaCardDesfer />);
    const desfer = within(container).getByRole('button', { name: 'Desfés la maquetació' });
    expect(desfer.disabled).toBe(false);
    expect(desfer.className).toBe('sdp-bloc-icon');
    expect(desfer.textContent).toBe('');
    expect(desfer.querySelector('svg.lucide-undo-2')).not.toBeNull();
    expect(desfer.getAttribute('title')).toBe('Desfés la maquetació');
    expect(desfer.querySelector('svg').getAttribute('width')).toBe('24');
    expect(desfer.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
  });
}

test('les etiquetes passen per t (claus section.notes.proposaCard i section.notes.proposaCardDesfer)', () => {
  amplada(900);
  const t = (clau, text) => (clau.startsWith('section.notes.proposaCard') ? `[${clau}]` : text);
  const { container, rerender } = render(<UniversalToolbar onProposaCard={() => {}} t={t} />);
  obriMenu(container, 'ampla');
  expect(within(container).getByRole('button', { name: '[section.notes.proposaCard]' })).toBeTruthy();
  rerender(<UniversalToolbar onProposaCard={() => {}} proposaCardDesfer t={t} />);
  expect(within(container).getByRole('button', { name: '[section.notes.proposaCardDesfer]' })).toBeTruthy();
});

const MOTIU = 'Prem «Editar» per a maquetar la targeta.';
const MOTIU_EINES = 'En lectura: prem «Editar» per a escriure i donar format al text.';
for (const [mode, px] of [['ampla', 900], ['compacta', 320]]) {
  test(`${mode}: apagat en repòs, el motiu és la descripció accessible i el rètol del botó; el nom no canvia`, () => {
    amplada(px);
    const proposa = vi.fn();
    const { container } = render(<UniversalToolbar onProposaCard={proposa} proposaCardDisabled proposaCardMotiu={MOTIU} />);
    obriMenu(container, mode);
    const boto = within(container).getByRole('button', { name: 'Maqueta la targeta', description: MOTIU });
    expect(boto.disabled).toBe(true);
    expect(boto.getAttribute('aria-label')).toBe('Maqueta la targeta');
    expect(boto.getAttribute('title')).toBe(MOTIU);
    fireEvent.click(boto);
    expect(proposa).not.toHaveBeenCalled();
  });
}

test('el motiu només acompanya el botó apagat: encés, el title de sempre', () => {
  amplada(900);
  const { container } = render(<UniversalToolbar onProposaCard={() => {}} proposaCardMotiu={MOTIU} />);
  obriMenu(container, 'ampla');
  const boto = within(container).getByRole('button', { name: 'Maqueta la targeta' });
  expect(boto.disabled).toBe(false);
  expect(boto.getAttribute('title')).toBe('Maqueta la targeta');
});

test('motiuEnLectura descriu la barra amb un text amagat (cap píxel); sense, cap atribut ni node nou', () => {
  amplada(900);
  const { container, rerender } = render(<UniversalToolbar onPublish={() => {}} motiuEnLectura={MOTIU_EINES} />);
  const barra = within(container).getByRole('group', { name: "Eines de l'editor", description: MOTIU_EINES });
  const motiu = container.querySelector(`[id="${barra.getAttribute('aria-describedby')}"]`);
  expect(motiu.hidden).toBe(true);
  expect(motiu.textContent).toBe(MOTIU_EINES);
  expect(motiu.parentElement).toBe(barra);
  rerender(<UniversalToolbar onPublish={() => {}} />);
  expect(barra.hasAttribute('aria-describedby')).toBe(false);
  expect(barra.querySelector(':scope > span[hidden]')).toBeNull();
  expect(barra.textContent).not.toContain(MOTIU_EINES);
});
