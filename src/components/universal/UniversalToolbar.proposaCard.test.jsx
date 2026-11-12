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
/* En compacte, les opcions de format viuen darrere de «⋯» (el lloc i el nom
   de l'«Aa» d'abans, «Format del text»): s'obrin abans de buscar el botó. */
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

/* IDEA-59 / P1-72 (punt 4) · En compacte les opcions porten també les eines
   secundàries (ratllat, citació i divisor, darrere de les llistes): la cel·la
   continua sent l'última, ara darrere del divisor. */
test('compacta (R2): la cel·la va dins de «⋯», l’última, darrere del divisor, i el grup de publicació torna a ser Borrar i Publicar', () => {
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
  expect(botons.at(-2).getAttribute('aria-label')).toBe('Divisor');
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

/* AH-02 (Onada R21; Gauntlet R21, ui_fase2-01) · El document en repòs: el botó
   apagat diu per què (proposaCardMotiu, al title: el nom continua sent
   l'aria-label i el title en passa a ser la descripció), i la barra descriu el
   repòs de les eines de format (motiuEnLectura, un text amagat). Sense les
   props, el DOM de sempre. */
const MOTIU = 'Prem «Editar» per a proposar la Card.';
const MOTIU_EINES = 'En lectura: prem «Editar» per a escriure i donar format al text.';
for (const [mode, px] of [['ampla', 900], ['compacta', 320]]) {
  test(`${mode}: apagat en repòs, el motiu és la descripció accessible i el rètol del botó; el nom no canvia`, () => {
    amplada(px);
    const proposa = vi.fn();
    const { container } = render(<UniversalToolbar onProposaCard={proposa} proposaCardDisabled proposaCardMotiu={MOTIU} />);
    obriFormat(container, mode);
    const boto = within(container).getByRole('button', { name: 'Proposa Card', description: MOTIU });
    expect(boto.disabled).toBe(true);
    expect(boto.getAttribute('aria-label')).toBe('Proposa Card');
    expect(boto.getAttribute('title')).toBe(MOTIU);
    fireEvent.click(boto);
    expect(proposa).not.toHaveBeenCalled();
  });
}

test('el motiu només acompanya el botó apagat: encés, el title de sempre', () => {
  amplada(900);
  const { container } = render(<UniversalToolbar onProposaCard={() => {}} proposaCardMotiu={MOTIU} />);
  const boto = within(container).getByRole('button', { name: 'Proposa Card' });
  expect(boto.disabled).toBe(false);
  expect(boto.getAttribute('title')).toBe('Proposa Card');
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
