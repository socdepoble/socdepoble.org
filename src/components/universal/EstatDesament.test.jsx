import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import {
  EstatDesament, IconaEstatDesament, RegioEstatDesament, TEXTOS_ESTAT_DESAMENT, TITOL_DETALL_DESAMENT,
} from './EstatDesament.jsx';

/* T47 (ordre del Mestre, 260928) · L'indicador de la skill sdp-universal-editor §1.
   T51 (ordre del Mestre, 260928) · Ja no és la ploma (reservada al botó
   d'emoticona): és el núvol amb la fletxa de lucide (CloudUpload). */
afterEach(cleanup);

const estatus = (container) => container.querySelector('[role="status"]');
const icona = (container) => container.querySelector('.sdp-estat-desament');

test('net: l’indicador desapareix, però la regió d’estat continua al DOM per al lector de pantalla', () => {
  const { container } = render(<EstatDesament estat="net" />);
  expect(icona(container)).toBeNull();
  expect(estatus(container).getAttribute('aria-live')).toBe('polite');
  expect(estatus(container).classList.contains('sdp-nomes-lector')).toBe(true);
  expect(estatus(container).textContent).toBe(TEXTOS_ESTAT_DESAMENT.net);
});

test('pendent i enviant: es veu el núvol, decoratiu, amb el text al títol i a la regió d’estat', () => {
  for (const estat of ['pendent', 'enviant']) {
    const { container } = render(<EstatDesament estat={estat} />);
    const nuvol = icona(container);
    expect(nuvol.tagName).toBe('SPAN');
    expect(nuvol.classList.contains('sdp-estat-desament--pendent')).toBe(true);
    expect(nuvol.getAttribute('aria-hidden')).toBe('true');
    expect(nuvol.getAttribute('title')).toBe(TEXTOS_ESTAT_DESAMENT[estat]);
    // T51 · el glif nou; la ploma ja no s'hi pinta mai.
    expect(nuvol.querySelector('svg.lucide-cloud-upload')).not.toBeNull();
    expect(container.querySelector('svg.lucide-feather')).toBeNull();
    expect(estatus(container).textContent).toBe(TEXTOS_ESTAT_DESAMENT[estat]);
    expect(container.querySelector('button')).toBeNull();
    cleanup();
  }
});

/* Correcció C14 (260928) · El detall d'un error (conflicte, validació,
   quarantena) no pot viure només al `title` d'un span sense focus. */
test('C14 · error i sessio: la icona és un botó amb nom que obri el detall; pendent continua decorativa', () => {
  for (const estat of ['error', 'sessio']) {
    const { container } = render(<IconaEstatDesament estat={estat} detall="El servidor encara no pot guardar la data de publicació: es guarda en este dispositiu." />);
    const boto = icona(container);
    expect(boto.tagName).toBe('BUTTON');
    expect(boto.getAttribute('type')).toBe('button');
    expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
    expect(boto.getAttribute('aria-expanded')).toBe('false');
    expect(boto.getAttribute('aria-hidden')).toBeNull();
    expect(boto.getAttribute('aria-label')).toBe(`${TEXTOS_ESTAT_DESAMENT[estat]} Vore el detall`);
    expect(boto.classList.contains(estat === 'error' ? 'sdp-estat-desament--avis' : 'sdp-estat-desament--pendent')).toBe(true);
    expect(boto.classList.contains('sdp-estat-desament--boto')).toBe(true);
    expect(boto.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    // T51 · «sessio» porta el núvol dels canvis pendents; «error», el triangle.
    expect(boto.querySelector(estat === 'error' ? 'svg.lucide-triangle-alert' : 'svg.lucide-cloud-upload')).not.toBeNull();
    expect(boto.querySelector('svg.lucide-feather')).toBeNull();
    cleanup();
  }
});

test('C14 · el detall s’obri en un Dialeg de la barra, amb el text i les accions; el focus torna al botó', () => {
  const reintenta = vi.fn();
  const detall = 'Hi ha una versió més recent d’esta nota. El teu esborrany es guarda en este dispositiu fins que tries quina vols conservar.';
  render(
    <>
      <IconaEstatDesament estat="error" detall={detall} accions={[{ text: 'Tornar a provar', onClick: reintenta }]} />
      <button type="button">Data</button>
    </>
  );
  const boto = screen.getByRole('button', { name: `${TEXTOS_ESTAT_DESAMENT.error} Vore el detall` });
  boto.focus();
  act(() => { fireEvent.click(boto); });
  const dialeg = screen.getByRole('dialog', { name: TITOL_DETALL_DESAMENT });
  expect(dialeg.classList.contains('sdp-dialeg--barra')).toBe(true);
  expect(dialeg.textContent).toContain(detall);
  expect(boto.getAttribute('aria-expanded')).toBe('true');
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Tornar a provar' })); });
  expect(reintenta).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(boto);
  // Sense accions pròpies, només «Entesos».
  act(() => { fireEvent.click(boto); });
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Entesos' })); });
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('C14 · si tot es desa amb el detall obert, el botó espera el tancament i el focus passa al control següent, no al body', () => {
  const { rerender } = render(
    <div className="bar-actions">
      <IconaEstatDesament estat="error" detall="No s’ha pogut desar. Es tornarà a provar sol." />
      <button type="button">Data</button>
    </div>
  );
  const boto = screen.getByRole('button', { name: /Vore el detall/ });
  boto.focus();
  act(() => { fireEvent.click(boto); });
  rerender(
    <div className="bar-actions">
      <IconaEstatDesament estat="net" />
      <button type="button">Data</button>
    </div>
  );
  // Obert: el detall diu el que passa ara.
  expect(screen.getByRole('dialog').textContent).toContain(TEXTOS_ESTAT_DESAMENT.net);
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Entesos' })); });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.querySelector('.sdp-estat-desament')).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Data' }));
});

test('C13 · la regió viva es pot muntar a part de la icona, i la icona sola no porta cap regió', () => {
  const { container } = render(<IconaEstatDesament estat="pendent" />);
  expect(container.querySelector('[role="status"]')).toBeNull();
  cleanup();
  const regio = render(<RegioEstatDesament estat="error" detall="Detall" />).container.firstElementChild;
  expect(regio.getAttribute('role')).toBe('status');
  expect(regio.getAttribute('aria-live')).toBe('polite');
  expect(regio.textContent).toBe('Detall');
});

test('error: el núvol es canvia per un avís i el detall mana sobre el text per defecte', () => {
  const detall = 'No s’ha pogut desar (Error de xarxa). Es tornarà a provar sol.';
  const { container } = render(<EstatDesament estat="error" detall={detall} />);
  expect(icona(container).classList.contains('sdp-estat-desament--avis')).toBe(true);
  expect(estatus(container).textContent).toBe(detall);
});

test('un estat desconegut es tracta com a pendent: mai diu «desat» sense saber-ho', () => {
  const { container } = render(<EstatDesament estat="potser" />);
  expect(icona(container).classList.contains('sdp-estat-desament--pendent')).toBe(true);
  expect(estatus(container).textContent).toBe(TEXTOS_ESTAT_DESAMENT.pendent);
});
