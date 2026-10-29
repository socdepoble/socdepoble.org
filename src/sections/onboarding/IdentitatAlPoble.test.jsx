/* P1-68 (pla 261028_1526, §3.8.2.3) · El @usuari i el poble de la persona:
   la proposta de l'alta amb «D'acord», la validació en línia del servidor
   abans de cap crida, l'ocupat amb la proposta que torna la RPC i el poble
   principal que conserva els altres triats. Noms sintètics. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { AJUDA_USUARI, ETIQUETA_DESA_USUARI, ETIQUETA_POBLE, ETIQUETA_USUARI, IdentitatAlPoble, TEXT_DESAT, TITOL_PENDENT_DE_MIGRACIO, pobleAmbPrincipal } from './IdentitatAlPoble.jsx';
import { MISSATGES_USERNAME, MISSATGE_USERNAME_FORMA, MISSATGE_USERNAME_RESERVAT, errorDUsername } from './onboardingModel.js';
import { ErrorColumnaAbsent } from '../../data/autodesament/errors.js';

afterEach(cleanup);
const camp = () => screen.getByLabelText(ETIQUETA_USUARI);

test('sense confirmar: la proposta i «D’acord» la desa tal qual', async () => {
  const desa = vi.fn(async () => {});
  render(<IdentitatAlPoble usuari="annaperez" onDesaUsuari={desa} />);
  expect(screen.getByText('Et proposem @annaperez')).toBeTruthy();
  expect(camp().value).toBe('annaperez');
  expect(screen.getByText(AJUDA_USUARI)).toBeTruthy();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'D’acord, vull @annaperez' })); });
  expect(desa).toHaveBeenCalledWith('annaperez');
  expect(screen.queryByText('Et proposem @annaperez')).toBeNull();
  expect(screen.getByRole('status').textContent).toBe(TEXT_DESAT);
});

test('confirmat: cap proposta; el desat només s’activa amb un canvi', () => {
  render(<IdentitatAlPoble usuari="annaperez" confirmat onDesaUsuari={vi.fn()} />);
  expect(screen.queryByText(/Et proposem/)).toBeNull();
  expect(screen.getByRole('button', { name: ETIQUETA_DESA_USUARI }).disabled).toBe(true);
  fireEvent.change(camp(), { target: { value: 'Anna P' } });
  expect(camp().value).toBe('anna-p');
  expect(screen.getByRole('button', { name: ETIQUETA_DESA_USUARI }).disabled).toBe(false);
});

test('la forma i la reserva es diuen en línia i no criden el servidor', async () => {
  const desa = vi.fn(async () => {});
  render(<IdentitatAlPoble usuari="annaperez" confirmat onDesaUsuari={desa} />);
  fireEvent.change(camp(), { target: { value: 'ab' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: ETIQUETA_DESA_USUARI })); });
  expect(screen.getByText(MISSATGE_USERNAME_FORMA)).toBeTruthy();
  fireEvent.change(camp(), { target: { value: 'consola' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: ETIQUETA_DESA_USUARI })); });
  expect(screen.getByText(MISSATGE_USERNAME_RESERVAT)).toBeTruthy();
  expect(desa).not.toHaveBeenCalled();
});

test('ocupat: el motiu i «Fes servir» la proposta del servidor', async () => {
  const desa = vi.fn(async () => {}).mockRejectedValueOnce(errorDUsername('ocupat', { proposta: 'pepa-2' }));
  render(<IdentitatAlPoble usuari="annaperez" confirmat onDesaUsuari={desa} />);
  fireEvent.change(camp(), { target: { value: 'pepa' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: ETIQUETA_DESA_USUARI })); });
  expect(screen.getByText('Eixe identificador ja és d’algú. Et proposem @pepa-2.')).toBeTruthy();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Fes servir @pepa-2' })); });
  expect(desa).toHaveBeenLastCalledWith('pepa-2');
  expect(camp().value).toBe('pepa-2');
});

test('el poble: del catàleg, el principal triat i els altres darrere', async () => {
  const desaPoble = vi.fn(async () => {});
  render(<IdentitatAlPoble usuari="annaperez" confirmat poble="La Torre de les Maçanes · Bel·lús" pobles={['Penàguila', 'La Torre de les Maçanes', 'Bel·lús']}
    onDesaUsuari={vi.fn()} onDesaPoble={desaPoble} />);
  const selector = screen.getByLabelText(ETIQUETA_POBLE);
  expect(selector.value).toBe('La Torre de les Maçanes');
  await act(async () => { fireEvent.change(selector, { target: { value: 'Penàguila' } }); });
  expect(desaPoble).toHaveBeenCalledWith('Penàguila · La Torre de les Maçanes · Bel·lús');
  expect(pobleAmbPrincipal('A · B · C', 'B')).toBe('B · A · C');
});

/* Revisió del Bloc H (R3) · Un desat del poble que falla marca el selector,
   no l'identificador. */
test('si el poble no es desa, l’error és del selector «El teu poble», no de l’identificador', async () => {
  const desaPoble = vi.fn(async () => { throw new Error('Sense connexió'); });
  render(<IdentitatAlPoble usuari="annaperez" confirmat poble="La Torre de les Maçanes" pobles={['La Torre de les Maçanes', 'Benifallim']}
    onDesaUsuari={vi.fn()} onDesaPoble={desaPoble} />);
  await act(async () => { fireEvent.change(screen.getByLabelText(ETIQUETA_POBLE), { target: { value: 'Benifallim' } }); });
  const selector = screen.getByLabelText(ETIQUETA_POBLE);
  const idError = screen.getByText('Sense connexió').closest('p').id;
  expect(selector.getAttribute('aria-invalid')).toBe('true');
  expect(selector.getAttribute('aria-describedby').split(' ')).toContain(idError);
  expect(camp().getAttribute('aria-invalid')).toBeNull();
  expect(camp().getAttribute('aria-describedby').split(' ')).not.toContain(idError);
  // Escriure a l'identificador no esborra l'error del poble.
  fireEvent.change(camp(), { target: { value: 'annap' } });
  expect(screen.getByLabelText(ETIQUETA_POBLE).getAttribute('aria-invalid')).toBe('true');
});

/* Revisió del Bloc H (R4) · «Desat.» entra en una regió que ja hi era (així
   s'anuncia) i, confirmada la proposta amb «D'acord», el focus va al camp. */
test('la regió «Desat.» naix buida i s’omple; després de «D’acord», el focus és al camp de l’identificador', async () => {
  let resol;
  const desa = vi.fn(() => new Promise((r) => { resol = r; }));
  const { container } = render(<IdentitatAlPoble usuari="annaperez" onDesaUsuari={desa} />);
  const regio = container.querySelector('p[role="status"]');
  expect(regio).not.toBeNull();
  expect(regio.textContent).toBe('');
  const dAcord = screen.getByRole('button', { name: 'D’acord, vull @annaperez' });
  dAcord.focus();
  await act(async () => { fireEvent.click(dAcord); });
  expect(container.querySelector('p[role="status"]')).toBe(regio);
  await act(async () => { resol(); });
  expect(screen.queryByText('Et proposem @annaperez')).toBeNull();
  expect(container.querySelector('p[role="status"]')).toBe(regio);
  expect(regio.textContent).toBe(TEXT_DESAT);
  expect(document.activeElement).toBe(camp());
  // El desat des del camp no mou el focus: es queda on la persona l'ha dut.
  cleanup();
  render(<IdentitatAlPoble usuari="annaperez" confirmat onDesaUsuari={vi.fn(async () => {})} />);
  fireEvent.change(camp(), { target: { value: 'annap' } });
  const desaBoto = screen.getByRole('button', { name: ETIQUETA_DESA_USUARI });
  desaBoto.focus();
  await act(async () => { fireEvent.click(desaBoto); });
  expect(document.activeElement).not.toBe(camp());
  expect(screen.getByRole('status').textContent).toBe(TEXT_DESAT);
});

test('sense poble desat, La Torre de les Maçanes preseleccionada; sense catàleg, cap selector', () => {
  render(<IdentitatAlPoble usuari="annaperez" confirmat poble="" pobles={['Penàguila', 'La Torre de les Maçanes']} onDesaUsuari={vi.fn()} onDesaPoble={vi.fn()} />);
  expect(screen.getByLabelText(ETIQUETA_POBLE).value).toBe('La Torre de les Maçanes');
  cleanup();
  render(<IdentitatAlPoble usuari="annaperez" confirmat poble="" pobles={[]} onDesaUsuari={vi.fn()} onDesaPoble={vi.fn()} />);
  expect(screen.queryByLabelText(ETIQUETA_POBLE)).toBeNull();
});

/* APP-D1 (pla 261029_0216, Pas 2) · El servidor encara no té 2610282100: un
   avís explícit (role=status, mai alert ni el camp en roig) amb el motiu de
   l'adaptador i el valor que no s'ha desat; mai «Desat.». La persona no ha
   fet res mal: res a corregir, el valor es queda escrit per a tornar-ho a
   provar. Qualsevol altre error continua com abans. */
test('APP-D1 · l’@usuari sense la RPC (NO-DISPONIBLE): avís «Pendent de migració», el valor es queda i cap «Desat.»', async () => {
  const desa = vi.fn(async () => { throw errorDUsername('NO-DISPONIBLE'); });
  render(<IdentitatAlPoble usuari="annaperez" onDesaUsuari={desa} />);
  fireEvent.change(camp(), { target: { value: 'annap' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: ETIQUETA_DESA_USUARI })); });
  expect(desa).toHaveBeenCalledWith('annap');
  const avis = screen.getByText(TITOL_PENDENT_DE_MIGRACIO).closest('[role="status"]');
  expect(avis).not.toBeNull();
  expect(avis.textContent).toContain(MISSATGES_USERNAME['NO-DISPONIBLE']);
  expect(avis.textContent).toContain('@annap');
  expect(screen.queryByRole('alert')).toBeNull();
  // El valor escrit no es descarta, el camp no és en roig i el botó torna a estar actiu.
  expect(camp().value).toBe('annap');
  expect(camp().getAttribute('aria-invalid')).toBeNull();
  expect(screen.getByRole('button', { name: ETIQUETA_DESA_USUARI }).disabled).toBe(false);
  expect(screen.queryByText(TEXT_DESAT)).toBeNull();
  // La proposta de l'alta continua: no s'ha confirmat res.
  expect(screen.getByText('Et proposem @annaperez')).toBeTruthy();
  // Escriure de nou lleva l'avís; un desat que va bé no en deixa cap rastre.
  fireEvent.change(camp(), { target: { value: 'annap2' } });
  expect(screen.queryByText(TITOL_PENDENT_DE_MIGRACIO)).toBeNull();
  desa.mockImplementation(async () => {});
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: ETIQUETA_DESA_USUARI })); });
  expect(screen.queryByText(TITOL_PENDENT_DE_MIGRACIO)).toBeNull();
  expect(screen.getByRole('status').textContent).toBe(TEXT_DESAT);
});

test('APP-D1 · el poble amb una columna que el servidor no té (ErrorColumnaAbsent): l’avís nomena el poble i el selector no es marca en roig', async () => {
  const desaPoble = vi.fn(async () => { throw new ErrorColumnaAbsent('El servidor encara no té la columna «town_name» del perfil: el canvi no s’ha desat. Cal aplicar-hi una migració pendent.', { columna: 'town_name', camps: ['town_name'] }); });
  render(<IdentitatAlPoble usuari="annaperez" confirmat poble="La Torre de les Maçanes" pobles={['La Torre de les Maçanes', 'Benifallim']}
    onDesaUsuari={vi.fn()} onDesaPoble={desaPoble} />);
  await act(async () => { fireEvent.change(screen.getByLabelText(ETIQUETA_POBLE), { target: { value: 'Benifallim' } }); });
  expect(desaPoble).toHaveBeenCalledWith('Benifallim · La Torre de les Maçanes');
  const avis = screen.getByText(TITOL_PENDENT_DE_MIGRACIO).closest('[role="status"]');
  expect(avis.textContent).toContain('«Benifallim»');
  expect(avis.textContent).toContain('migració pendent');
  expect(screen.queryByRole('alert')).toBeNull();
  // El selector torna al poble que de veres hi ha i no es marca com a error de la persona.
  const selector = screen.getByLabelText(ETIQUETA_POBLE);
  expect(selector.value).toBe('La Torre de les Maçanes');
  expect(selector.getAttribute('aria-invalid')).toBeNull();
  expect(screen.queryByText(TEXT_DESAT)).toBeNull();
});

test('APP-D1 · regressió: un altre error de l’@usuari (ocupat) o del poble (xarxa) es diu com abans, sense l’avís de migració', async () => {
  const desa = vi.fn(async () => { throw errorDUsername('ocupat', { proposta: 'annap-2' }); });
  const desaPoble = vi.fn(async () => { throw new Error('Sense connexió'); });
  render(<IdentitatAlPoble usuari="annaperez" confirmat poble="La Torre de les Maçanes" pobles={['La Torre de les Maçanes', 'Benifallim']}
    onDesaUsuari={desa} onDesaPoble={desaPoble} />);
  fireEvent.change(camp(), { target: { value: 'annap' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: ETIQUETA_DESA_USUARI })); });
  expect(screen.getByText('Eixe identificador ja és d’algú. Et proposem @annap-2.')).toBeTruthy();
  expect(camp().getAttribute('aria-invalid')).toBe('true');
  await act(async () => { fireEvent.change(screen.getByLabelText(ETIQUETA_POBLE), { target: { value: 'Benifallim' } }); });
  expect(screen.getByLabelText(ETIQUETA_POBLE).getAttribute('aria-invalid')).toBe('true');
  expect(screen.queryByText(TITOL_PENDENT_DE_MIGRACIO)).toBeNull();
});
