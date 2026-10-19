import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «Tota entitat creada ha de
   portar el seu poble») · El diàleg porta el camp «Poble», obligatori: el
   selector de sempre (opcionsDePoble) amb els pobles del contingut core, que
   naix amb el poble de qui crea l'organització (la persona del Perfil). Per
   defecte, la persona d'estes proves és de La Torre de les Maçanes, i les
   altes d'abans ara envien el seu poble; les proves de davall fixen el camp. */
const POBLE = 'La Torre de les Maçanes';
const mocks = vi.hoisted(() => ({ towns: [], perfil: null }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ towns: mocks.towns }) }));
vi.mock('./PerfilContext.jsx', async (importOriginal) => ({ ...(await importOriginal()), usePerfilOpcional: () => mocks.perfil }));
import { DialegNovaOrganitzacio } from './DialegNovaOrganitzacio.jsx';

const ambPersonaDe = (poble) => ({ identitats: [{ id: 'jo', mena: 'persona', dades: { town_name: poble } }] });
beforeEach(() => {
  mocks.towns = [{ id: 't', title: POBLE }, { id: 'b', title: 'Benilloba' }];
  mocks.perfil = ambPersonaDe(POBLE);
});
afterEach(cleanup);

const obri = (props = {}) => {
  const onCrea = props.onCrea || vi.fn(async () => undefined);
  const onTanca = vi.fn();
  render(<DialegNovaOrganitzacio obert onTanca={onTanca} onCrea={onCrea} {...props} />);
  return { onCrea, onTanca };
};
const escriu = (etiqueta, valor) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });
const crea = () => act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Crear' })); });

test('l’identificador es deriva del nom i «Crear» envia una empresa', async () => {
  const { onCrea } = obri();
  escriu(/^Nom/, 'Forn Ca l’Àngela');
  expect(screen.getByLabelText('Identificador').value).toBe('forn-ca-l-angela');
  expect(screen.getByText(/Adreça pública: \/empresa\/forn-ca-l-angela/)).toBeTruthy();
  await crea();
  expect(onCrea).toHaveBeenCalledWith({ name: 'Forn Ca l’Àngela', slug: 'forn-ca-l-angela', kind: 'company', town_name: POBLE });
});

/* Ordre del Mestre (261008) · «Un grup no té per què pertànyer a cap empresa»:
   el camp «Empresa mare» ja no existix i «Grup» sempre s'oferix. */
test('261008 · «Grup» sempre s’oferix, amb l’ajuda nova i sense cap camp «Empresa mare»', () => {
  obri();
  const grup = screen.getByRole('radio', { name: /Grup/ });
  expect(grup.closest('.sdp-casella').textContent).toContain('Una colla, una associació, un col·lectiu…');
  expect(screen.queryByText(/empresa que ja administres/)).toBeNull();
  expect(screen.queryByText('Per a crear un grup, primer has d’administrar una empresa.')).toBeNull();
  fireEvent.click(grup);
  expect(screen.queryByLabelText(/Empresa mare/)).toBeNull();
  /* Gauntlet 261016 (Bloc 3.5.2) · L'únic selector és el del poble: abans no
     n'hi havia cap, i la prova ho fixava per a la mare. */
  expect(screen.getAllByRole('combobox')).toEqual([screen.getByLabelText(/^Poble/)]);
  expect(screen.getByText(/Adreça pública: \/grup\//)).toBeTruthy();
});

test('261008 · un grup s’envia sense mare', async () => {
  const { onCrea } = obri();
  escriu(/^Nom/, 'Colla de dolçainers');
  fireEvent.click(screen.getByRole('radio', { name: /Grup/ }));
  await crea();
  expect(onCrea).toHaveBeenCalledWith({ name: 'Colla de dolçainers', slug: 'colla-de-dolcainers', kind: 'group', town_name: POBLE });
  expect(onCrea.mock.calls[0][0]).not.toHaveProperty('parentOrganizationId');
});

test('261008 · una prop «empresesMare» d’abans no torna a pintar el camp ni envia cap mare', async () => {
  const { onCrea } = obri({ empresesMare: [{ valor: 'E1', etiqueta: 'Forn' }] });
  escriu(/^Nom/, 'Colla');
  fireEvent.click(screen.getByRole('radio', { name: /Grup/ }));
  expect(screen.queryByLabelText(/Empresa mare/)).toBeNull();
  await crea();
  expect(onCrea).toHaveBeenCalledWith({ name: 'Colla', slug: 'colla', kind: 'group', town_name: POBLE });
});

test('un nom massa curt es marca al camp i no s’envia', async () => {
  const { onCrea } = obri();
  escriu(/^Nom/, 'F');
  await crea();
  expect(onCrea).not.toHaveBeenCalled();
  expect(screen.getByText('El nom ha de tindre entre 2 i 120 caràcters.')).toBeTruthy();
});

test('l’identificador repetit que torna el servidor apareix al camp «Identificador»', async () => {
  const onCrea = vi.fn(async () => {
    throw new Error('Supabase 409: {"code":"23505","message":"L’identificador ja pertany a una altra organització."}');
  });
  obri({ onCrea });
  escriu(/^Nom/, 'Forn');
  await crea();
  const camp = screen.getByLabelText('Identificador');
  const error = screen.getByText('L’identificador ja pertany a una altra organització.');
  expect(camp.getAttribute('aria-describedby')).toContain(error.closest('p').id);
  expect(camp.getAttribute('aria-invalid')).toBe('true');
});

test('un altre error del servidor es mostra damunt del formulari', async () => {
  obri({ onCrea: vi.fn(async () => { throw new Error('Sense xarxa'); }) });
  escriu(/^Nom/, 'Forn');
  await crea();
  expect(screen.getByRole('alert').textContent).toBe('Sense xarxa');
});

test('l’identificador editat a mà es normalitza', async () => {
  const { onCrea } = obri();
  escriu(/^Nom/, 'Forn');
  escriu('Identificador', 'El Forn Vell');
  await crea();
  expect(onCrea).toHaveBeenCalledWith({ name: 'Forn', slug: 'el-forn-vell', kind: 'company', town_name: POBLE });
});

/* Gauntlet 261016 (Bloc 3.5.2) · «Poble» és obligatori. Sense poble triat
   (la persona no en té i no se n'ha triat cap), el camp diu què cal fer i no
   s'envia res; triant-ne un, s'envia amb l'alta. */
test('Gauntlet 261016 · sense poble el camp «Poble» ho diu i no s’envia; triant-ne un, s’envia', async () => {
  mocks.perfil = null;
  const { onCrea } = obri();
  escriu(/^Nom/, 'Forn');
  const poble = screen.getByLabelText(/^Poble/);
  expect(poble.value).toBe('');
  expect(screen.getByText('Poble').closest('label').textContent).toBe('Poble (obligatori)');
  await crea();
  expect(onCrea).not.toHaveBeenCalled();
  const error = screen.getByText('Cada organització ha de tindre el seu poble: tria’n un.');
  expect(poble.getAttribute('aria-describedby')).toContain(error.closest('p').id);
  expect(poble.getAttribute('aria-invalid')).toBe('true');
  fireEvent.change(poble, { target: { value: 'Benilloba' } });
  await crea();
  expect(onCrea).toHaveBeenCalledWith({ name: 'Forn', slug: 'forn', kind: 'company', town_name: 'Benilloba' });
});

test('Gauntlet 261016 · el selector porta els pobles del node i naix amb el de la persona, també si no hi és', () => {
  mocks.perfil = ambPersonaDe('Penàguila');
  obri();
  const poble = screen.getByLabelText(/^Poble/);
  expect(poble.value).toBe('Penàguila');
  expect(within(poble).getAllByRole('option').map((opcio) => opcio.value)).toEqual(['', 'Benilloba', POBLE, 'Penàguila']);
  expect(within(poble).getAllByRole('option')[0].textContent).toBe('Tria un poble…');
});

/* Pla 261018_1605 (Tasca 2, D5; ordre del Mestre, 18-10-2026) · Una persona de
   més d'un poble ('A · B'): l'organització nova naix només amb el principal. */
test('261018 · amb diversos pobles, el selector naix només amb el principal i l’alta l’envia sol', async () => {
  mocks.perfil = ambPersonaDe(`${POBLE} · Benilloba`);
  const { onCrea } = obri();
  const poble = screen.getByLabelText(/^Poble/);
  expect(poble.value).toBe(POBLE);
  expect(within(poble).getAllByRole('option').map((opcio) => opcio.value)).toEqual(['', 'Benilloba', POBLE]);
  escriu(/^Nom/, 'Forn');
  await crea();
  expect(onCrea).toHaveBeenCalledWith({ name: 'Forn', slug: 'forn', kind: 'company', town_name: POBLE });
});

test('Cancel·lar tanca amb el motiu «boto»', () => {
  const { onTanca } = obri();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel·lar' }));
  expect(onTanca).toHaveBeenCalledWith('boto');
});

test('un enviament pendent bloqueja doble submit, tancament i canvis de tipus', async () => {
  let resol;
  const onCrea = vi.fn(() => new Promise((resolve) => { resol = resolve; }));
  const { onTanca } = obri({ onCrea });
  escriu(/^Nom/, 'Colla');
  const formulari = screen.getByLabelText(/^Nom/).closest('form');
  act(() => { fireEvent.submit(formulari); fireEvent.submit(formulari); });
  expect(onCrea).toHaveBeenCalledTimes(1);
  expect(formulari.getAttribute('aria-busy')).toBe('true');
  expect(screen.getByLabelText(/^Nom/).disabled).toBe(true);
  expect(screen.getByRole('radio', { name: /Grup/ }).closest('fieldset').disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
  fireEvent.click(screen.getByRole('dialog'));
  expect(onTanca).not.toHaveBeenCalled();
  await act(async () => resol());
  expect(formulari.getAttribute('aria-busy')).toBe('false');
  fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
  expect(onTanca).toHaveBeenCalledOnce();
});

test('l’error conserva els camps i permet reintentar sense una alta duplicada', async () => {
  const onCrea = vi.fn().mockRejectedValueOnce(new Error('Sense xarxa')).mockResolvedValueOnce({ id: 'N' });
  obri({ onCrea });
  escriu(/^Nom/, 'Forn');
  await crea();
  expect(screen.getByRole('alert').textContent).toBe('Sense xarxa');
  expect(screen.getByLabelText(/^Nom/).value).toBe('Forn');
  await crea();
  expect(onCrea).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('alert')).toBeNull();
});
