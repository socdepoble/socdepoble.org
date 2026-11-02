/* IDEA-61 (T0, prompt 261102_1532) · El compositor «On es publica?»: les
   cinc opcions d'àmbit, el formulari guiat que naix del contracte
   (utils/publicacioUniversal.js · CAMPS), els errors de validaFitxa en línia
   i l'anunci curt, la previsualització (UniversalCard amb les etiquetes de
   l'àmbit i de l'estat, i el resum del contracte) i la fitxa normalitzada que
   torna «Desar l'àmbit». Dades sintètiques. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../../../app/contexts/RouterContext', () => ({ Link: 'a', useNavigate: () => vi.fn() }));
vi.mock('../NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import { DialegAmbit } from './DialegAmbit.jsx';
import { CAMPS, RESERVES_I18N } from '../../../utils/publicacioUniversal.js';

afterEach(cleanup);

const t = (_clau, reserva) => reserva;
const TITOL = 'On es publica?';
const DOCUMENT = Object.freeze({ title: 'Viatge a Alcoi', subtitle: 'Dissabte de matí', lead: 'Isc de la Torre a les huit.', authorName: 'Pepa', authorLocation: 'La Torre' });
const AMBITS_VISIBLES = ['Mur', 'Mercat', 'Compartir cotxe', 'Treball', 'Habitatge'];

const pinta = (props = {}) => {
  const onDesa = vi.fn();
  const onTanca = vi.fn();
  render(<DialegAmbit obert onDesa={onDesa} onTanca={onTanca} t={t} document={DOCUMENT} {...props} />);
  return { onDesa, onTanca, dialeg: screen.getByRole('dialog', { name: TITOL }) };
};
const radio = (dialeg, nom) => within(dialeg).getByRole('radio', { name: nom });
const tria = (dialeg, nom) => fireEvent.click(radio(dialeg, nom));
/* Un control del formulari pel seu rètol exacte (el «(obligatori)» va dins de l'etiqueta). */
const camp = (dialeg, retol) => within(dialeg).getByLabelText(new RegExp(`^${retol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( \\(obligatori\\))?$`));
const escriu = (dialeg, retol, value) => fireEvent.change(camp(dialeg, retol), { target: { value } });
const desar = (dialeg) => fireEvent.click(within(dialeg).getByRole('button', { name: 'Desar l’àmbit' }));
const etiquetesDeLaTargeta = (dialeg) => {
  const llista = within(dialeg).queryByRole('list', { name: 'Categories' });
  return llista ? [...llista.querySelectorAll('li')].map((li) => [li.textContent, li.className]) : [];
};
const previsualitzacio = (dialeg) => within(dialeg).getByText('Així es veurà al Mur').closest('section');

test('les cinc opcions d’àmbit; sense fitxa, Mur triat i cap camp: només la previsualització de la nota', () => {
  const { dialeg } = pinta();
  expect(within(dialeg).getAllByRole('radio').map((r) => r.labels[0].querySelector('.sdp-targeta-opcio__titol').textContent)).toEqual(AMBITS_VISIBLES);
  expect(radio(dialeg, 'Mur').checked).toBe(true);
  // Revisió L2-A1 · La insígnia de la triada porta text (mai només color), explícit des d'ací.
  expect(within(radio(dialeg, 'Mur').labels[0]).getByText('Triat').className).toBe('sdp-insignia sdp-insignia--exit sdp-targeta-opcio__insignia');
  expect(within(radio(dialeg, 'Treball').labels[0]).queryByText('Triat')).toBeNull();
  expect(within(dialeg).queryAllByRole('combobox')).toEqual([]);
  expect(within(dialeg).queryAllByRole('textbox')).toEqual([]);
  expect(within(dialeg).queryByRole('alert')).toBeNull();
  // La targeta de la nota, sense cap etiqueta nova ni resum (Llei del Píxel).
  const seccio = previsualitzacio(dialeg);
  expect(within(seccio).getByRole('heading', { name: 'Viatge a Alcoi' })).toBeTruthy();
  expect(seccio.querySelector('.sp-card-author-name').textContent).toBe('Pepa');
  expect(etiquetesDeLaTargeta(dialeg)).toEqual([]);
  expect(within(dialeg).getByRole('button', { name: 'Desar l’àmbit' })).toBeTruthy();
  expect(within(dialeg).getByRole('button', { name: 'Cancel·lar' })).toBeTruthy();
});

test('canviar d’àmbit canvia el formulari: els camps del contracte, amb el seu rètol, l’obligatori i l’Estat', () => {
  const { dialeg } = pinta();
  tria(dialeg, 'Compartir cotxe');
  for (const campDef of CAMPS.vehicle) expect(camp(dialeg, RESERVES_I18N[campDef.clau]), campDef.id).toBeTruthy();
  expect(within(dialeg).getByLabelText('Lloc d’eixida (obligatori)')).toBeTruthy();
  expect(within(dialeg).getByLabelText('Punt de trobada')).toBeTruthy();
  expect(camp(dialeg, 'Dia d’eixida').getAttribute('type')).toBe('date');
  expect(camp(dialeg, 'Hora d’eixida').getAttribute('type')).toBe('time');
  expect([camp(dialeg, 'Places disponibles').getAttribute('type'), camp(dialeg, 'Places disponibles').getAttribute('max')]).toEqual(['number', '9']);
  // Les places només són obligatòries quan s'oferixen places (obligatoriSi).
  expect(within(dialeg).queryByLabelText('Places disponibles (obligatori)')).toBeNull();
  escriu(dialeg, 'Modalitat', 'oferisc_places');
  expect(within(dialeg).getByLabelText('Places disponibles (obligatori)')).toBeTruthy();
  const estat = camp(dialeg, 'Estat');
  expect([...estat.options].map((o) => o.textContent)).toEqual(['Disponible', 'Reservat', 'Complet', 'Tancat']);
  tria(dialeg, 'Treball');
  for (const campDef of CAMPS.treball) expect(camp(dialeg, RESERVES_I18N[campDef.clau]), campDef.id).toBeTruthy();
  expect(within(dialeg).queryByLabelText(/^Lloc d’eixida/)).toBeNull();
  // Els textos llargs (500) van en una àrea de text.
  expect(camp(dialeg, 'Dedicació').tagName).toBe('TEXTAREA');
  tria(dialeg, 'Mur');
  expect(within(dialeg).queryAllByRole('combobox')).toEqual([]);
});

test('un obligatori buit marca l’error en línia, anuncia que la fitxa no està completa i no desa; omplit, desa', () => {
  const { dialeg, onDesa } = pinta();
  tria(dialeg, 'Compartir cotxe');
  expect(within(dialeg).queryByRole('alert')).toBeNull();
  desar(dialeg);
  expect(onDesa).not.toHaveBeenCalled();
  expect(within(dialeg).getByRole('alert').textContent).toBe('La fitxa de «Compartir cotxe» no està completa.');
  const modalitat = camp(dialeg, 'Modalitat');
  expect(modalitat.getAttribute('aria-invalid')).toBe('true');
  expect(document.getElementById(modalitat.getAttribute('aria-describedby')).textContent).toBe('Falta un camp obligatori: Modalitat');
  expect(camp(dialeg, 'Lloc d’eixida').getAttribute('aria-invalid')).toBe('true');
  expect(camp(dialeg, 'Punt de trobada').getAttribute('aria-invalid')).toBeNull();
  // La validació és viva des del primer «Desar»: en omplir-los, els errors se'n van.
  escriu(dialeg, 'Modalitat', 'busque_lloc');
  escriu(dialeg, 'Lloc d’eixida', 'La Torre');
  escriu(dialeg, 'Lloc d’arribada', 'Alcoi');
  expect(within(dialeg).getByRole('alert')).toBeTruthy();
  escriu(dialeg, 'Dia d’eixida', '2026-11-15');
  expect(within(dialeg).queryByRole('alert')).toBeNull();
  expect(camp(dialeg, 'Modalitat').getAttribute('aria-invalid')).toBeNull();
  desar(dialeg);
  expect(onDesa).toHaveBeenCalledWith({
    ambit: 'vehicle', estat: 'disponible',
    dades: { modalitat: 'busque_lloc', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15' }
  });
});

test('un valor d’enum fora de la llista és impossible: el selector només porta les opcions del contracte', () => {
  const { dialeg, onDesa } = pinta();
  tria(dialeg, 'Habitatge');
  const modalitat = camp(dialeg, 'Modalitat');
  expect([...modalitat.options].map((o) => [o.value, o.textContent])).toEqual([
    ['', '—'], ['lloguer', 'Lloguer'], ['venda', 'Venda'], ['compartir_casa', 'Compartir casa'], ['masoveria_urbana', 'Masoveria urbana']
  ]);
  fireEvent.change(modalitat, { target: { value: 'okupacio' } });
  expect(modalitat.value).toBe('');
  escriu(dialeg, 'Preu', '400 €');
  const estatImmoble = camp(dialeg, 'Estat de l’immoble');
  fireEvent.change(estatImmoble, { target: { value: 'ruina' } });
  expect(estatImmoble.value).toBe('');
  desar(dialeg);
  expect(onDesa).not.toHaveBeenCalled();
  expect(document.getElementById(modalitat.getAttribute('aria-describedby')).textContent).toBe('Falta un camp obligatori: Modalitat');
  // Un enter fora de rang tampoc passa: l'error diu el rang.
  escriu(dialeg, 'Modalitat', 'venda');
  escriu(dialeg, 'Habitacions', '99');
  desar(dialeg);
  expect(onDesa).not.toHaveBeenCalled();
  expect(document.getElementById(camp(dialeg, 'Habitacions').getAttribute('aria-describedby')).textContent).toBe('El valor de «Habitacions» és fora del rang permés.');
});

test('la previsualització: la targeta de la nota amb l’àmbit i l’estat com a etiquetes, i el resum de la fitxa', () => {
  const { dialeg } = pinta();
  tria(dialeg, 'Habitatge');
  expect(etiquetesDeLaTargeta(dialeg)).toEqual([
    ['Habitatge', 'sp-card-label sdp-badge-system'],
    ['Disponible', 'sp-card-label sdp-insignia sdp-insignia--exit']
  ]);
  escriu(dialeg, 'Modalitat', 'lloguer');
  escriu(dialeg, 'Preu', '400 €');
  escriu(dialeg, 'Superfície (m²)', '80');
  escriu(dialeg, 'Habitacions', '3');
  escriu(dialeg, 'Estat de l’immoble', 'llest_per_entrar');
  escriu(dialeg, 'Municipi', 'Alcoi');
  const seccio = previsualitzacio(dialeg);
  expect(within(seccio).getByRole('heading', { name: 'Viatge a Alcoi' })).toBeTruthy();
  expect(within(seccio).getByText('Lloguer · 400 € · 80 m² · Habitacions: 3 · Llest per a entrar · Alcoi')).toBeTruthy();
  escriu(dialeg, 'Estat', 'reservat');
  expect(etiquetesDeLaTargeta(dialeg)).toEqual([
    ['Habitatge', 'sp-card-label sdp-badge-system'],
    ['Reservat', 'sp-card-label sdp-insignia sdp-insignia--avis']
  ]);
  // Tornar al Mur lleva les etiquetes i el resum: la targeta de sempre.
  tria(dialeg, 'Mur');
  expect(etiquetesDeLaTargeta(dialeg)).toEqual([]);
  expect(within(previsualitzacio(dialeg)).queryByText(/Lloguer/)).toBeNull();
});

test('sense títol encara, la targeta de la previsualització es titula com l’àmbit', () => {
  const { dialeg } = pinta({ document: { title: '', lead: '' } });
  tria(dialeg, 'Treball');
  expect(within(previsualitzacio(dialeg)).getByRole('heading', { name: 'Treball' })).toBeTruthy();
});

test('«Desar l’àmbit» torna la fitxa normalitzada pel contracte: text net, enters, data, hora i estat', () => {
  const { dialeg, onDesa } = pinta();
  tria(dialeg, 'Compartir cotxe');
  escriu(dialeg, 'Modalitat', 'oferisc_places');
  escriu(dialeg, 'Lloc d’eixida', '  La Torre ');
  escriu(dialeg, 'Lloc d’arribada', 'Alcoi');
  escriu(dialeg, 'Dia d’eixida', '2026-11-15');
  escriu(dialeg, 'Hora d’eixida', '07:30');
  escriu(dialeg, 'Places disponibles', '3');
  escriu(dialeg, 'Aportació per plaça', '5 €');
  escriu(dialeg, 'Estat', 'reservat');
  desar(dialeg);
  expect(onDesa).toHaveBeenCalledTimes(1);
  expect(onDesa).toHaveBeenCalledWith({
    ambit: 'vehicle', estat: 'reservat',
    dades: { modalitat: 'oferisc_places', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15', hora_eixida: '07:30', places: 3, aportacio: '5 €' }
  });
  expect(within(previsualitzacio(dialeg)).getByText('Oferisc places · La Torre → Alcoi · 2026-11-15 07:30 · Places disponibles: 3 · 5 €')).toBeTruthy();
});

test('amb una fitxa prèvia naix omplida; canviar d’àmbit i tornar-hi recupera les dades; el contacte no ix al resum', () => {
  const valor = { ambit: 'treball', estat: 'complet', dades: { modalitat: 'oferisc_ofici', ofici: 'Forner', contacte: '600 000 000' } };
  const { dialeg, onDesa } = pinta({ valor });
  expect(radio(dialeg, 'Treball').checked).toBe(true);
  expect(camp(dialeg, 'Ofici o sector').value).toBe('Forner');
  expect(camp(dialeg, 'Com contactar').value).toBe('600 000 000');
  expect(camp(dialeg, 'Estat').value).toBe('complet');
  expect(within(previsualitzacio(dialeg)).getByText('Oferisc el meu ofici · Forner')).toBeTruthy();
  expect(within(previsualitzacio(dialeg)).queryByText(/600 000 000/)).toBeNull();
  tria(dialeg, 'Mercat');
  expect(within(dialeg).queryByLabelText(/^Ofici o sector/)).toBeNull();
  expect(camp(dialeg, 'Preu').value).toBe('');
  tria(dialeg, 'Treball');
  expect(camp(dialeg, 'Ofici o sector').value).toBe('Forner');
  desar(dialeg);
  expect(onDesa).toHaveBeenCalledWith({ ambit: 'treball', estat: 'complet', dades: valor.dades });
});

test('Mur: «Desar l’àmbit» torna la fitxa buida del Mur, sense cap dada', () => {
  const { dialeg, onDesa } = pinta({ valor: { ambit: 'mercat', estat: 'reservat', dades: { preu: '3 €' } } });
  expect(radio(dialeg, 'Mercat').checked).toBe(true);
  tria(dialeg, 'Mur');
  desar(dialeg);
  expect(onDesa).toHaveBeenCalledWith({ ambit: 'mur', estat: 'reservat', dades: {} });
});

test('Escape (el «cancel» del <dialog>), Cancel·lar i la X tanquen sense desar', () => {
  const { dialeg, onDesa, onTanca } = pinta();
  fireEvent(dialeg, new Event('cancel', { cancelable: true }));
  expect(onTanca).toHaveBeenLastCalledWith('esc');
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·lar' }));
  expect(onTanca).toHaveBeenLastCalledWith('boto');
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Tancar' }));
  expect(onTanca).toHaveBeenLastCalledWith('boto');
  expect(onDesa).not.toHaveBeenCalled();
});

test('L2-A1 i L2-A2: la insígnia «Triat» i els codis d’error passen pel traductor t(clau, reserva)', () => {
  const crides = new Map();
  const traductor = (clau, reserva) => {
    crides.set(clau, reserva);
    return clau === 'editor.ambit.triat' || clau.startsWith('editor.ambit.error.') ? `[${clau}] ${reserva}` : reserva;
  };
  const { dialeg } = pinta({ t: traductor });
  expect(crides.get('editor.ambit.triat')).toBe('Triat');
  expect(within(dialeg).getByText('[editor.ambit.triat] Triat')).toBeTruthy();

  tria(dialeg, 'Habitatge');
  escriu(dialeg, 'Modalitat', 'venda');
  escriu(dialeg, 'Preu', 'x'.repeat(130));
  escriu(dialeg, 'Habitacions', '99');
  escriu(dialeg, 'Superfície (m²)', '1.5');
  desar(dialeg);

  expect(crides.get('editor.ambit.error.llargaria')).toBe('El text de «{camp}» és massa llarg.');
  expect(crides.get('editor.ambit.error.rang')).toBe('El valor de «{camp}» és fora del rang permés.');
  expect(crides.get('editor.ambit.error.format')).toBe('El valor de «{camp}» no té la forma esperada.');
});
