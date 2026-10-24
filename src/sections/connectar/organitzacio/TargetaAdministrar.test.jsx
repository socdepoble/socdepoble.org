import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { TargetaAdministrar } from './TargetaAdministrar.jsx';

/* T43 (ordre del Mestre, 260928) · la targeta d'administrar, estat per estat. */
afterEach(cleanup);

const pinta = (props) => {
  const accions = { onConnecta: vi.fn(), onActua: vi.fn(), onEditaFitxa: vi.fn(), onEntra: vi.fn() };
  const vista = render(<TargetaAdministrar nom="Sóc de Poble" {...accions} {...props} />);
  return { ...vista, ...accions };
};

test('pot-connectar (remot): diu què vol dir, les converses, qui llig la justificació, i l’envia', async () => {
  const { container, onConnecta } = pinta({ estat: 'pot-connectar', ambRevisio: true });
  const text = container.textContent;
  expect(text).toContain('Vols administrar Sóc de Poble?');
  expect(text).toContain('anirà signat per Sóc de Poble, no per tu');
  expect(text).toContain('Com a administradora veuràs també les converses de Sóc de Poble amb la gent del poble.');
  expect(text).toContain('La teua explicació la llegirà l’equip de Sóc de Poble.');
  expect(text).toContain('Actuar com a l’organització no és automàtic');
  const camp = screen.getByRole('textbox', { name: 'Explica breument qui eres (opcional)' });
  expect(camp.getAttribute('maxlength')).toBe('1000');
  fireEvent.change(camp, { target: { value: '  Porte la botiga des de 2019.  ' } });
  /* Actualitzada a posta (261024 T6a): administrar no és connectar (IDEA-14); amb revisió, «Demanar administrar-la». */
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Demanar administrar-la' })); });
  expect(onConnecta).toHaveBeenCalledWith('Porte la botiga des de 2019.');
});

test('pot-connectar (seed): alta immediata, sense justificació', () => {
  const { container } = pinta({ estat: 'pot-connectar', ambRevisio: false });
  expect(container.textContent).toContain('En este poble de proves l’alta és immediata.');
  /* IDEA-14 (261024 T6a) · sense revisió, el botó ho diu: «Administrar-la ara», i l'explicació no parla de connectar-s'hi. */
  expect(screen.getByRole('button', { name: 'Administrar-la ara' })).toBeTruthy();
  expect(container.textContent).toContain('Si l’administres, podràs editar la seua fitxa');
  expect(container.textContent).not.toMatch(/connect/i);
  expect(screen.queryByRole('textbox')).toBeNull();
});

test('mentre s’envia, el botó està ocupat (aria-busy) i no es pot tornar a prémer', () => {
  pinta({ estat: 'pot-connectar', carregant: true });
  const boto = screen.getByRole('button', { name: 'Treballant…' });
  expect(boto.getAttribute('aria-busy')).toBe('true');
  expect(boto.disabled).toBe(true);
});

test('administres: «Actua com a» i «Edita la fitxa» són botons separats; actiu, només editar', () => {
  const { onActua, onEditaFitxa, container, unmount } = pinta({ estat: 'administres', rol: 'owner' });
  expect(container.textContent).toContain('Ja administres Sóc de Poble · Propietari.');
  expect(container.textContent).toContain('Editar la fitxa no canvia amb qui actues.');
  fireEvent.click(screen.getByRole('button', { name: 'Actua com a Sóc de Poble' }));
  fireEvent.click(screen.getByRole('button', { name: 'Edita la fitxa de Sóc de Poble' }));
  expect(onActua).toHaveBeenCalledTimes(1);
  expect(onEditaFitxa).toHaveBeenCalledTimes(1);
  unmount();
  const actiu = pinta({ estat: 'administres', rol: 'admin', actiu: true });
  expect(screen.queryByRole('button', { name: /Actua com a/ })).toBeNull();
  expect(actiu.container.textContent).toContain('Ara actues com a Sóc de Poble');
});

test('sense sessió porta a entrar; pendent diu la data; cap acció en no-disponible, te-propietaria ni membre', () => {
  const sense = pinta({ estat: 'sense-sessio' });
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
  expect(sense.onEntra).toHaveBeenCalled();
  sense.unmount();
  const pendent = pinta({ estat: 'pendent', data: '2026-09-28T10:00:00Z' });
  expect(pendent.container.textContent).toMatch(/Petició enviada el .*2026/);
  expect(screen.queryAllByRole('button')).toEqual([]);
  pendent.unmount();
  for (const estat of ['no-disponible', 'te-propietaria', 'membre', 'no-del-poble', 'activant', 'comprovant']) {
    const vista = pinta({ estat });
    expect(screen.queryAllByRole('button'), estat).toEqual([]);
    vista.unmount();
  }
});

test('T43b-2 · comprovant: cap formulari; l’error de lectura té títol propi i no diu «enviar»', () => {
  const comprovant = pinta({ estat: 'comprovant' });
  expect(screen.getByRole('status').textContent).toBe('Comprovant si ja has demanat administrar Sóc de Poble…');
  expect(screen.queryByRole('textbox')).toBeNull();
  comprovant.unmount();
  const lectura = pinta({ estat: 'pot-connectar', errorLectura: Object.assign(new Error('Supabase 500: boom'), { code: 'ALTRE' }) });
  expect(lectura.container.textContent).toContain('No s’ha pogut comprovar');
  expect(lectura.container.textContent).not.toContain('No s’ha pogut enviar');
  expect(lectura.container.textContent).not.toContain('Supabase');
});

test('T43b-3 · sense nom de confiança: «esta organització», ben apostrofat i en majúscula a l’inici', () => {
  const { container, unmount } = pinta({ estat: 'pot-connectar', nom: null });
  expect(container.textContent).toContain('Vols administrar esta organització?');
  expect(container.textContent).toContain('les converses d’esta organització amb la gent del poble');
  unmount();
  pinta({ estat: 'te-propietaria', nom: null });
  expect(screen.getByText('Esta organització ja té qui l’administra')).toBeTruthy();
});

/* Correcció C17 (260928) · Un formulari no viu dins d'una regió viva: l'explicació
   i el formulari van en una Alerta sense rol; el resultat curt continua sent viu. */
test('C17 · pot-connectar i rebutjada: l’explicació i el formulari no són dins de cap regió viva', () => {
  for (const estat of ['pot-connectar', 'rebutjada']) {
    const { container, unmount } = pinta({ estat });
    const form = container.querySelector('form');
    expect(form, estat).toBeTruthy();
    expect(form.closest('[role="status"], [role="alert"], [aria-live]'), estat).toBeNull();
    // La mateixa pell de sempre.
    expect(form.closest('.sdp-alerta'), estat).toBeTruthy();
    expect(screen.queryByRole('status'), estat).toBeNull();
    unmount();
  }
  pinta({ estat: 'pendent', data: '2026-09-28T10:00:00Z' });
  expect(screen.getByRole('status').textContent).toMatch(/Petició enviada el .*2026/);
});

test('rebutjada deixa tornar-ho a demanar; un error genèric ix en una alerta sense el text cru', async () => {
  const { onConnecta } = pinta({ estat: 'rebutjada', error: Object.assign(new Error('Supabase 500: boom'), { code: 'ALTRE' }) });
  expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut enviar la petició');
  expect(screen.getByRole('alert').textContent).not.toContain('Supabase');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Tornar a demanar-ho' })); });
  expect(onConnecta).toHaveBeenCalledWith('');
});

/* IDEA-14 (Directiva del Mestre, 261024; G-04) · A Connectar l'únic primari és
   el del MAS (D1): demanar o fer l'administració és secundari, en tots els estats. */
test('IDEA-14 · cap estat de la targeta porta un botó primari', () => {
  for (const props of [
    { estat: 'pot-connectar', ambRevisio: true }, { estat: 'pot-connectar', ambRevisio: false }, { estat: 'rebutjada' },
    { estat: 'sense-sessio' }, { estat: 'administres', rol: 'owner' }
  ]) {
    const { container, unmount } = pinta(props);
    expect(container.querySelectorAll('button').length, props.estat).toBeGreaterThan(0);
    expect(container.querySelector('.sdp-boto--primari'), props.estat).toBeNull();
    unmount();
  }
});
