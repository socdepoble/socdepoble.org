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

/* ── Ordre del Mestre (261008) · «confirmació o feedback visual del desat
   automàtic»: el núvol amb el check, que es queda fins al canvi següent. ── */
const check = (container) => container.querySelector('.sdp-estat-desament--desat');

test('261008 · de pendent, enviant o sessio a net: el núvol amb el check, amb nom i títol, sense botó', () => {
  for (const abans of ['pendent', 'enviant', 'sessio']) {
    const { container, rerender } = render(<EstatDesament estat={abans} />);
    expect(check(container), abans).toBeNull();
    rerender(<EstatDesament estat="net" />);
    const nuvol = check(container);
    expect(nuvol, abans).not.toBeNull();
    // La classe base: el mateix cercle i el mateix blanc que les altres icones.
    expect(nuvol.classList.contains('sdp-estat-desament')).toBe(true);
    expect(nuvol.tagName).toBe('SPAN');
    expect(nuvol.getAttribute('role')).toBe('img');
    expect(nuvol.getAttribute('aria-label')).toBe('Tots els canvis estan desats.');
    expect(nuvol.getAttribute('title')).toBe('Tots els canvis estan desats.');
    expect(nuvol.getAttribute('aria-hidden')).toBeNull();
    expect(nuvol.querySelector('svg.lucide-cloud-check')).not.toBeNull();
    expect(nuvol.querySelector('svg.lucide-cloud-upload')).toBeNull();
    expect(nuvol.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('button')).toBeNull();
    expect(estatus(container).textContent).toBe(TEXTOS_ESTAT_DESAMENT.net);
    cleanup();
  }
});

test('261008 · el check es queda amb el temps (cap temporitzador) i se’n va amb el canvi següent', () => {
  vi.useFakeTimers();
  try {
    const { container, rerender, unmount } = render(<IconaEstatDesament estat="pendent" />);
    rerender(<IconaEstatDesament estat="enviant" />);
    rerender(<IconaEstatDesament estat="net" />);
    expect(check(container)).not.toBeNull();
    // Cap temporitzador viu: el check no depén del rellotge.
    expect(vi.getTimerCount()).toBe(0);
    act(() => { vi.advanceTimersByTime(10 * 60 * 1000); });
    expect(check(container)).not.toBeNull();
    // Un render nou amb el mateix estat no el fa caure.
    rerender(<IconaEstatDesament estat="net" />);
    expect(check(container)).not.toBeNull();
    // El canvi següent: torna el núvol amb la fletxa.
    rerender(<IconaEstatDesament estat="pendent" />);
    expect(check(container)).toBeNull();
    expect(container.querySelector('svg.lucide-cloud-upload')).not.toBeNull();
    // I el desat següent torna a pintar el check.
    rerender(<IconaEstatDesament estat="net" />);
    expect(check(container)).not.toBeNull();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.useRealTimers();
  }
});

/* Sense `reintentant`, un 'error' que passa a 'net' és un descart («Tornar al
   que hi ha desat», «conservar el remot»): el servidor no ha rebut res. */
test('261008 · un error descartat (error → net, sense reintentant) no diu «desat»; «Tornar a provar» (error → enviant → net), sí', () => {
  const { container, rerender } = render(<IconaEstatDesament estat="error" detall="No s’ha pogut desar." />);
  rerender(<IconaEstatDesament estat="net" />);
  expect(container.querySelector('.sdp-estat-desament')).toBeNull();
  // El reintent a mà de la cua (reintenta → desaAra) sí que passa per 'enviant'.
  rerender(<IconaEstatDesament estat="error" detall="No s’ha pogut desar." />);
  rerender(<IconaEstatDesament estat="enviant" />);
  rerender(<IconaEstatDesament estat="net" />);
  expect(check(container)).not.toBeNull();
});

/* Correcció de la revisió (261008) · La seqüència REAL d'un error temporal
   (sense xarxa, 5xx) que el reintent automàtic resol. Les dues cues donen
   prioritat al problema temporal sobre 'enviant' (cua.js, instantania;
   GlobalSaveManager.estat) i el netegen en confirmar: la persona veu
   pendent → error → net, sense cap 'enviant' entre l'error i el desat. */
const DETALL_TEMPORAL = 'No s’ha pogut desar (Sense xarxa). Es tornarà a provar sol; mentrestant, el canvi es guarda en este dispositiu.';

test('261008 · error temporal resolt pel reintent automàtic (error → net, amb reintentant): el check', () => {
  // Notes: pendent → enviant → error temporal (repintat durant el reintent) → net.
  const notes = render(<IconaEstatDesament estat="pendent" />);
  notes.rerender(<IconaEstatDesament estat="enviant" />);
  notes.rerender(<IconaEstatDesament estat="error" detall={DETALL_TEMPORAL} reintentant />);
  notes.rerender(<IconaEstatDesament estat="error" detall={DETALL_TEMPORAL} reintentant />);
  expect(check(notes.container)).toBeNull();
  expect(notes.container.querySelector('button.sdp-estat-desament--avis svg.lucide-triangle-alert')).not.toBeNull();
  notes.rerender(<IconaEstatDesament estat="net" />);
  expect(check(notes.container)).not.toBeNull();
  notes.unmount();
  // Perfil: la instantània diu 'error' abans que 'enviant'; de pendent, directe a l'error.
  const perfil = render(<IconaEstatDesament estat="pendent" />);
  perfil.rerender(<IconaEstatDesament estat="error" detall={DETALL_TEMPORAL} reintentant />);
  perfil.rerender(<IconaEstatDesament estat="net" />);
  expect(check(perfil.container)).not.toBeNull();
  perfil.unmount();
  // Obert ja amb l'error temporal (el canvi d'una sessió anterior): el reintent que hi passa, també.
  const obert = render(<IconaEstatDesament estat="error" detall={DETALL_TEMPORAL} reintentant />);
  obert.rerender(<IconaEstatDesament estat="net" />);
  expect(check(obert.container)).not.toBeNull();
});

test('261008 · un error temporal que passa a un altre error (sense reintentant) i després a net, no diu «desat»', () => {
  const { container, rerender } = render(<IconaEstatDesament estat="pendent" />);
  rerender(<IconaEstatDesament estat="error" detall={DETALL_TEMPORAL} reintentant />);
  // El servidor respon, però amb un conflicte: ja no es torna a provar sol.
  rerender(<IconaEstatDesament estat="error" detall="Hi ha una versió més recent d’esta nota." />);
  rerender(<IconaEstatDesament estat="net" />);
  expect(container.querySelector('.sdp-estat-desament')).toBeNull();
});

test('261008 · reintentant no canvia el DOM de l’avís, i EstatDesament el passa a la icona', () => {
  // Els ids de useId (el títol i la descripció del Dialeg) canvien d'un muntatge a l'altre.
  const dom = (node) => render(node).container.innerHTML.replace(/:r[0-9a-z]+:/g, ':id:');
  const sense = dom(<IconaEstatDesament estat="error" detall={DETALL_TEMPORAL} />);
  cleanup();
  const amb = dom(<IconaEstatDesament estat="error" detall={DETALL_TEMPORAL} reintentant />);
  cleanup();
  expect(amb).toBe(sense);
  const { container, rerender } = render(<EstatDesament estat="error" detall={DETALL_TEMPORAL} reintentant />);
  rerender(<EstatDesament estat="net" />);
  expect(check(container)).not.toBeNull();
  expect(estatus(container).textContent).toBe(TEXTOS_ESTAT_DESAMENT.net);
});

test('261008 · d’un error al check: l’avís se’n va i el check no el confon (triangle fora)', () => {
  const { container, rerender } = render(<IconaEstatDesament estat="pendent" />);
  rerender(<IconaEstatDesament estat="net" />);
  expect(check(container)).not.toBeNull();
  rerender(<IconaEstatDesament estat="error" detall="No s’ha pogut desar." />);
  expect(check(container)).toBeNull();
  expect(container.querySelector('button.sdp-estat-desament--avis svg.lucide-triangle-alert')).not.toBeNull();
});

test('261008 · sessio amb el detall obert que passa a net: el botó espera el tancament i després ix el check', () => {
  const { container, rerender } = render(
    <div className="bar-actions">
      <IconaEstatDesament estat="sessio" />
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
  // Obert: encara el botó, que diu el que passa ara.
  expect(screen.getByRole('dialog').textContent).toContain(TEXTOS_ESTAT_DESAMENT.net);
  expect(check(container)).toBeNull();
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Entesos' })); });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(check(container)).not.toBeNull();
  // El focus no cau al body: passa al control següent de la barra.
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Data' }));
});
