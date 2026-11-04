/* IDEA-61 (T0, prompt 261102_1532) i O4-CLAUDE-1 (ordre del Mestre, captura
   261102_2121: fora la finestra modal, dins de l'«Edició avançada») · El
   compositor «On es publica?» en línia: el títol i l'ajuda visibles, les cinc
   opcions d'àmbit, el formulari guiat que naix del contracte
   (utils/publicacioUniversal.js · CAMPS) davall de l'àmbit triat, els errors
   de validaFitxa en línia després del primer canvi (o quan PUBLICAR s'ha
   aturat), la previsualització (UniversalCard amb les etiquetes de l'àmbit i
   de l'estat, i el resum del contracte) i la fitxa normalitzada que ix a cada
   canvi, sense cap botó de desar ni cap diàleg. Dades sintètiques. */
import { StrictMode } from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../../../app/contexts/RouterContext', () => ({ Link: 'a', useNavigate: () => vi.fn() }));
vi.mock('../NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import { BlocAmbit } from './BlocAmbit.jsx';
import { CAMPS, RESERVES_I18N } from '../../../utils/publicacioUniversal.js';

afterEach(cleanup);

const t = (_clau, reserva) => reserva;
const TITOL = 'On es publica?';
const AJUDA = 'Tria si és una publicació del Mur o una fitxa per al Mercat, Calendari, Mapa, Compartir cotxe, Animalets, Treball o Habitatge.';
const DOCUMENT = Object.freeze({ title: 'Viatge a Alcoi', subtitle: 'Dissabte de matí', lead: 'Isc de la Torre a les huit.', authorName: 'Pepa', authorLocation: 'La Torre' });
const AMBITS_VISIBLES = ['Mur', 'Mercat', 'Calendari', 'Mapa', 'Compartir cotxe', 'Animalets', 'Treball', 'Habitatge'];
const MISSATGE_INCOMPLETA = 'La fitxa de «Compartir cotxe» no està completa.';

const pinta = (props = {}) => {
  const onCanvia = vi.fn();
  const vista = render(<BlocAmbit onCanvia={onCanvia} t={t} document={DOCUMENT} {...props} />);
  return { onCanvia, vista, bloc: screen.getByRole('group', { name: TITOL }) };
};
const selectorAmbit = (bloc) => within(bloc).getByLabelText('Àmbit');
const ambitTriat = (bloc) => selectorAmbit(bloc).value;
const tria = (bloc, nom) => {
  const sel = selectorAmbit(bloc);
  const opcio = [...sel.options].find((o) => o.textContent === nom || o.value === nom);
  fireEvent.change(sel, { target: { value: opcio ? opcio.value : nom } });
};
/* Un control del formulari pel seu rètol exacte (el «(obligatori)» va dins de l'etiqueta). */
const camp = (bloc, retol) => within(bloc).getByLabelText(new RegExp(`^${retol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( \\(obligatori\\))?$`));
const escriu = (bloc, retol, value) => fireEvent.change(camp(bloc, retol), { target: { value } });
const etiquetesDeLaTargeta = (bloc) => {
  const llista = within(bloc).queryByRole('list', { name: 'Categories' });
  return llista ? [...llista.querySelectorAll('li')].map((li) => [li.textContent, li.className]) : [];
};
const previsualitzacio = (bloc) => within(bloc).getByText('Així es veurà al Mur').closest('section');
const invalid = (bloc, retol) => camp(bloc, retol).getAttribute('aria-invalid');

test('en línia, sense diàleg ni botons: el títol i l’ajuda visibles, el selector desplegable amb els huit àmbits i, sense fitxa, Mur triat i cap camp addicional', () => {
  const { bloc } = pinta();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(within(bloc).queryAllByRole('button')).toEqual([]);
  expect(bloc.querySelector('.sdp-bloc-ambit__titol').textContent).toBe(TITOL);
  expect(bloc.querySelector('.sdp-bloc-ambit__ajuda').textContent).toBe(AJUDA);
  expect(document.getElementById(bloc.getAttribute('aria-describedby')).textContent).toBe(AJUDA);
  expect(within(bloc).queryAllByRole('radio')).toEqual([]);
  expect(selectorAmbit(bloc).tagName).toBe('SELECT');
  expect([...selectorAmbit(bloc).options].map((o) => o.textContent)).toEqual(AMBITS_VISIBLES);
  expect(ambitTriat(bloc)).toBe('mur');
  expect(within(bloc).getAllByRole('combobox')).toEqual([selectorAmbit(bloc)]);
  expect(within(bloc).queryAllByRole('textbox')).toEqual([]);
  expect(bloc.querySelector('.sdp-alerta')).toBeNull();
  // La targeta de la nota, sense cap etiqueta nova ni resum (Llei del Píxel).
  const seccio = previsualitzacio(bloc);
  expect(within(seccio).getByRole('heading', { name: 'Viatge a Alcoi' })).toBeTruthy();
  expect(seccio.querySelector('.sp-card-author-name').textContent).toBe('Pepa');
  expect(etiquetesDeLaTargeta(bloc)).toEqual([]);
});

test('triar un àmbit escriu de seguida la seua fitxa (motiu «ambit») i obri els camps del contracte davall del selector', () => {
  const { bloc, onCanvia } = pinta();
  tria(bloc, 'Compartir cotxe');
  expect(onCanvia).toHaveBeenCalledTimes(1);
  expect(onCanvia).toHaveBeenLastCalledWith({ ambit: 'vehicle', estat: 'disponible', dades: {} }, 'ambit', false);
  for (const campDef of CAMPS.vehicle) expect(within(bloc).getByLabelText(new RegExp(`^${RESERVES_I18N[campDef.clau]}`)), campDef.id).toBeTruthy();
  expect(within(bloc).getByLabelText('Estat')).toBeTruthy();
  expect(within(bloc).getByLabelText('Lloc d’eixida (obligatori)')).toBeTruthy();
  expect(camp(bloc, 'Dia d’eixida').getAttribute('type')).toBe('date');
  expect(camp(bloc, 'Hora d’eixida').getAttribute('type')).toBe('time');
  expect([camp(bloc, 'Places disponibles').getAttribute('type'), camp(bloc, 'Places disponibles').getAttribute('max')]).toEqual(['number', '9']);
  // Les places només són obligatòries quan s'oferixen places (obligatoriSi).
  expect(within(bloc).queryByLabelText('Places disponibles (obligatori)')).toBeNull();
  escriu(bloc, 'Modalitat', 'oferisc_places');
  expect(within(bloc).getByLabelText('Places disponibles (obligatori)')).toBeTruthy();
  expect([...camp(bloc, 'Estat').options].map((o) => o.textContent)).toEqual(['Disponible', 'Reservat', 'Complet', 'Tancat']);
  tria(bloc, 'Treball');
  expect(onCanvia).toHaveBeenLastCalledWith({ ambit: 'treball', estat: 'disponible', dades: {} }, 'ambit', false);
  for (const campDef of CAMPS.treball) expect(camp(bloc, RESERVES_I18N[campDef.clau]), campDef.id).toBeTruthy();
  expect(within(bloc).queryByLabelText(/^Lloc d’eixida/)).toBeNull();
  // Els textos llargs (500) van en una àrea de text.
  expect(camp(bloc, 'Dedicació').tagName).toBe('TEXTAREA');
  // Calendari, Mapa i Animalets també obrin els seus camps guiats del contracte.
  for (const [nom, id] of [['Calendari', 'calendari'], ['Mapa', 'mapa'], ['Animalets', 'animalets']]) {
    tria(bloc, nom);
    expect(ambitTriat(bloc)).toBe(id);
    for (const campDef of CAMPS[id]) expect(camp(bloc, RESERVES_I18N[campDef.clau]), `${id}:${campDef.id}`).toBeTruthy();
  }
  tria(bloc, 'Mur');
  expect(onCanvia).toHaveBeenLastCalledWith({ ambit: 'mur', estat: 'disponible', dades: {} }, 'ambit', true);
  expect(within(bloc).getAllByRole('combobox')).toEqual([selectorAmbit(bloc)]);
});

test('els errors en línia arriben amb el primer canvi d’un camp, i cada canvi escriu la fitxa normalitzada (motiu «dades»)', () => {
  const { bloc, onCanvia } = pinta();
  tria(bloc, 'Compartir cotxe');
  // Triar l'àmbit no és un canvi d'un camp: encara cap error.
  expect(invalid(bloc, 'Modalitat')).toBeNull();
  expect(invalid(bloc, 'Lloc d’eixida')).toBeNull();
  escriu(bloc, 'Modalitat', 'busque_lloc');
  expect(onCanvia).toHaveBeenLastCalledWith({ ambit: 'vehicle', estat: 'disponible', dades: { modalitat: 'busque_lloc' } }, 'dades', false);
  expect(invalid(bloc, 'Modalitat')).toBeNull();
  const eixida = camp(bloc, 'Lloc d’eixida');
  expect(eixida.getAttribute('aria-invalid')).toBe('true');
  expect(document.getElementById(eixida.getAttribute('aria-describedby')).textContent).toBe('Falta un camp obligatori: Lloc d’eixida');
  expect(invalid(bloc, 'Punt de trobada')).toBeNull();
  // Cap anunci ni avís de resum mentre s'escriu: només els errors de cada camp.
  expect(within(bloc).queryByRole('alert')).toBeNull();
  expect(bloc.querySelector('.sdp-alerta')).toBeNull();
  escriu(bloc, 'Lloc d’eixida', '  La Torre ');
  expect(onCanvia).toHaveBeenLastCalledWith({ ambit: 'vehicle', estat: 'disponible', dades: { modalitat: 'busque_lloc', lloc_eixida: 'La Torre' } }, 'dades', false);
  // El camp conserva el que s'ha escrit (els espais inclosos): només la fitxa ix neta.
  expect(camp(bloc, 'Lloc d’eixida').value).toBe('  La Torre ');
  escriu(bloc, 'Lloc d’arribada', 'Alcoi');
  escriu(bloc, 'Dia d’eixida', '2026-11-15');
  expect(invalid(bloc, 'Lloc d’eixida')).toBeNull();
  expect(invalid(bloc, 'Dia d’eixida')).toBeNull();
  escriu(bloc, 'Estat', 'reservat');
  expect(onCanvia).toHaveBeenLastCalledWith({
    ambit: 'vehicle', estat: 'reservat',
    dades: { modalitat: 'busque_lloc', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15' }
  }, 'dades', true);
  // Canviar d'àmbit torna a començar sense errors.
  tria(bloc, 'Habitatge');
  expect(invalid(bloc, 'Modalitat')).toBeNull();
});

test('quan PUBLICAR s’ha aturat (mostraErrors), els errors es veuen sense tocar res, amb l’avís curt no viu; completa, l’avís se’n va', () => {
  const { bloc, onCanvia } = pinta({ valor: { ambit: 'vehicle', estat: 'disponible', dades: {} }, mostraErrors: true });
  expect(ambitTriat(bloc)).toBe('vehicle');
  expect(invalid(bloc, 'Modalitat')).toBe('true');
  expect(invalid(bloc, 'Lloc d’eixida')).toBe('true');
  const avis = bloc.querySelector('.sdp-alerta.sdp-alerta--error');
  expect(avis.textContent).toBe(MISSATGE_INCOMPLETA);
  // No viu: el selector de visibilitat ja l'anuncia (role="alert"), no dues vegades.
  expect(avis.hasAttribute('role')).toBe(false);
  escriu(bloc, 'Modalitat', 'busque_lloc');
  escriu(bloc, 'Lloc d’eixida', 'La Torre');
  escriu(bloc, 'Lloc d’arribada', 'Alcoi');
  expect(bloc.querySelector('.sdp-alerta')).not.toBeNull();
  escriu(bloc, 'Dia d’eixida', '2026-11-15');
  expect(bloc.querySelector('.sdp-alerta')).toBeNull();
  expect(onCanvia).toHaveBeenLastCalledWith({
    ambit: 'vehicle', estat: 'disponible',
    dades: { modalitat: 'busque_lloc', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15' }
  }, 'dades', true);
});

test('un valor d’enum fora de la llista és impossible, i un enter fora de rang diu el rang', () => {
  const { bloc, onCanvia } = pinta();
  tria(bloc, 'Habitatge');
  const modalitat = camp(bloc, 'Modalitat');
  expect([...modalitat.options].map((o) => [o.value, o.textContent])).toEqual([
    ['', '—'], ['lloguer', 'Lloguer'], ['venda', 'Venda'], ['compartir_casa', 'Compartir casa'], ['masoveria_urbana', 'Masoveria urbana']
  ]);
  fireEvent.change(modalitat, { target: { value: 'okupacio' } });
  expect(modalitat.value).toBe('');
  const estatImmoble = camp(bloc, 'Estat de l’immoble');
  fireEvent.change(estatImmoble, { target: { value: 'ruina' } });
  expect(estatImmoble.value).toBe('');
  expect(document.getElementById(modalitat.getAttribute('aria-describedby')).textContent).toBe('Falta un camp obligatori: Modalitat');
  escriu(bloc, 'Modalitat', 'venda');
  escriu(bloc, 'Habitacions', '99');
  expect(document.getElementById(camp(bloc, 'Habitacions').getAttribute('aria-describedby')).textContent).toBe('El valor de «Habitacions» és fora del rang permés.');
  // La fitxa que ix no porta cap valor fora del contracte.
  expect(onCanvia).toHaveBeenLastCalledWith({ ambit: 'habitatge', estat: 'disponible', dades: { modalitat: 'venda' } }, 'dades', false);
});

test('la previsualització: la targeta de la nota amb l’àmbit i l’estat com a etiquetes, i el resum de la fitxa', () => {
  const { bloc } = pinta();
  tria(bloc, 'Habitatge');
  expect(etiquetesDeLaTargeta(bloc)).toEqual([
    ['Habitatge', 'sp-card-label sdp-badge-system'],
    ['Disponible', 'sp-card-label sdp-insignia sdp-insignia--exit']
  ]);
  escriu(bloc, 'Modalitat', 'lloguer');
  escriu(bloc, 'Preu', '400 €');
  escriu(bloc, 'Superfície (m²)', '80');
  escriu(bloc, 'Habitacions', '3');
  escriu(bloc, 'Estat de l’immoble', 'llest_per_entrar');
  escriu(bloc, 'Municipi', 'Alcoi');
  const seccio = previsualitzacio(bloc);
  expect(within(seccio).getByRole('heading', { name: 'Viatge a Alcoi' })).toBeTruthy();
  expect(within(seccio).getByText('Lloguer · 400 € · 80 m² · Habitacions: 3 · Llest per a entrar · Alcoi')).toBeTruthy();
  escriu(bloc, 'Estat', 'reservat');
  expect(etiquetesDeLaTargeta(bloc)).toEqual([
    ['Habitatge', 'sp-card-label sdp-badge-system'],
    ['Reservat', 'sp-card-label sdp-insignia sdp-insignia--avis']
  ]);
  // Tornar al Mur lleva les etiquetes i el resum: la targeta de sempre.
  tria(bloc, 'Mur');
  expect(etiquetesDeLaTargeta(bloc)).toEqual([]);
  expect(within(previsualitzacio(bloc)).queryByText(/Lloguer/)).toBeNull();
});

test('sense títol encara, la targeta de la previsualització es titula com l’àmbit', () => {
  const { bloc } = pinta({ document: { title: '', lead: '' } });
  tria(bloc, 'Treball');
  expect(within(previsualitzacio(bloc)).getByRole('heading', { name: 'Treball' })).toBeTruthy();
});

test('la fitxa ix normalitzada pel contracte: text net, enters, data, hora i estat', () => {
  const { bloc, onCanvia } = pinta();
  tria(bloc, 'Compartir cotxe');
  escriu(bloc, 'Modalitat', 'oferisc_places');
  escriu(bloc, 'Lloc d’eixida', '  La Torre ');
  escriu(bloc, 'Lloc d’arribada', 'Alcoi');
  escriu(bloc, 'Dia d’eixida', '2026-11-15');
  escriu(bloc, 'Hora d’eixida', '07:30');
  escriu(bloc, 'Places disponibles', '3');
  escriu(bloc, 'Aportació per plaça', '5 €');
  escriu(bloc, 'Estat', 'reservat');
  expect(onCanvia).toHaveBeenLastCalledWith({
    ambit: 'vehicle', estat: 'reservat',
    dades: { modalitat: 'oferisc_places', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15', hora_eixida: '07:30', places: 3, aportacio: '5 €' }
  }, 'dades', true);
  expect(within(previsualitzacio(bloc)).getByText('Oferisc places · La Torre → Alcoi · 2026-11-15 07:30 · Places disponibles: 3 · 5 €')).toBeTruthy();
});

test('amb una fitxa prèvia naix omplida; canviar d’àmbit i tornar-hi recupera les dades i les torna a escriure; el contacte no ix al resum', () => {
  const valor = { ambit: 'treball', estat: 'complet', dades: { modalitat: 'oferisc_ofici', ofici: 'Forner', contacte: '600 000 000' } };
  const { bloc, onCanvia } = pinta({ valor });
  expect(ambitTriat(bloc)).toBe('treball');
  expect(camp(bloc, 'Ofici o sector').value).toBe('Forner');
  expect(camp(bloc, 'Com contactar').value).toBe('600 000 000');
  expect(camp(bloc, 'Estat').value).toBe('complet');
  expect(within(previsualitzacio(bloc)).getByText('Oferisc el meu ofici · Forner')).toBeTruthy();
  expect(within(previsualitzacio(bloc)).queryByText(/600 000 000/)).toBeNull();
  expect(onCanvia).not.toHaveBeenCalled();
  tria(bloc, 'Mercat');
  expect(onCanvia).toHaveBeenLastCalledWith({ ambit: 'mercat', estat: 'complet', dades: {} }, 'ambit', false);
  expect(within(bloc).queryByLabelText(/^Ofici o sector/)).toBeNull();
  expect(camp(bloc, 'Preu').value).toBe('');
  tria(bloc, 'Treball');
  expect(camp(bloc, 'Ofici o sector').value).toBe('Forner');
  expect(onCanvia).toHaveBeenLastCalledWith({ ambit: 'treball', estat: 'complet', dades: valor.dades }, 'ambit', true);
});

test('l’estat no queda congelat al muntatge: un àmbit nou de la fitxa (des de fora) es pren amb les seues dades; el mateix àmbit no esborra el que s’escriu', () => {
  const onCanvia = vi.fn();
  const { rerender } = render(<BlocAmbit onCanvia={onCanvia} t={t} document={DOCUMENT} valor={null} />);
  let bloc = screen.getByRole('group', { name: TITOL });
  expect(ambitTriat(bloc)).toBe('mur');
  // L'entrada ?ambit=vehicle escriu la fitxa després del primer muntatge.
  rerender(<BlocAmbit onCanvia={onCanvia} t={t} document={DOCUMENT} valor={{ ambit: 'vehicle', estat: 'disponible', dades: {} }} />);
  bloc = screen.getByRole('group', { name: TITOL });
  expect(ambitTriat(bloc)).toBe('vehicle');
  expect(within(bloc).getByLabelText('Lloc d’eixida (obligatori)')).toBeTruthy();
  escriu(bloc, 'Places disponibles', '3');
  // La nota rep la fitxa normalitzada i torna a pintar: el camp no es buida.
  rerender(<BlocAmbit onCanvia={onCanvia} t={t} document={DOCUMENT} valor={{ ambit: 'vehicle', estat: 'disponible', dades: { places: 3 } }} />);
  expect(camp(bloc, 'Places disponibles').value).toBe('3');
  // Moure la nota a la carpeta del Mercat li posa l'àmbit Mercat.
  rerender(<BlocAmbit onCanvia={onCanvia} t={t} document={DOCUMENT} valor={{ ambit: 'mercat', estat: 'reservat', dades: { preu: '3 €' } }} />);
  expect(ambitTriat(bloc)).toBe('mercat');
  expect(camp(bloc, 'Preu').value).toBe('3 €');
  expect(camp(bloc, 'Estat').value).toBe('reservat');
  // Cap d'estos canvis de fora no escriu res.
  expect(onCanvia).toHaveBeenCalledTimes(1);
});

/* Correcció A1-02 de l'àrbitre (O4-CLAUDE-1) · Un canvi d'àmbit des de fora
   (moure la nota a la carpeta del Mercat) també guarda les dades vives de
   l'àmbit que se'n va: tornar-hi amb un clic recupera l'última edició, no la
   del muntatge. */
test('un àmbit que canvia des de fora guarda les dades vives de l’anterior: tornar-hi recupera l’última edició, no la del muntatge', () => {
  const onCanvia = vi.fn();
  const VEHICLE = { ambit: 'vehicle', estat: 'disponible', dades: { modalitat: 'busque_lloc', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15' } };
  const { rerender } = render(<BlocAmbit onCanvia={onCanvia} t={t} document={DOCUMENT} valor={VEHICLE} />);
  const bloc = screen.getByRole('group', { name: TITOL });
  escriu(bloc, 'Lloc d’arribada', 'Cocentaina');
  const editada = { ...VEHICLE, dades: { ...VEHICLE.dades, lloc_arribada: 'Cocentaina' } };
  expect(onCanvia).toHaveBeenLastCalledWith(editada, 'dades', true);
  rerender(<BlocAmbit onCanvia={onCanvia} t={t} document={DOCUMENT} valor={editada} />);
  // DialegCarpeta porta la nota al Mercat: la fitxa del Mercat, buida.
  rerender(<BlocAmbit onCanvia={onCanvia} t={t} document={DOCUMENT} valor={{ ambit: 'mercat', estat: 'disponible', dades: {} }} />);
  expect(ambitTriat(bloc)).toBe('mercat');
  tria(bloc, 'Compartir cotxe');
  expect(camp(bloc, 'Lloc d’arribada').value).toBe('Cocentaina');
  expect(onCanvia).toHaveBeenLastCalledWith(editada, 'ambit', true);
});

test('sota StrictMode, cada canvi escriu una sola vegada', () => {
  const onCanvia = vi.fn();
  render(<StrictMode><BlocAmbit onCanvia={onCanvia} t={t} document={DOCUMENT} /></StrictMode>);
  const bloc = screen.getByRole('group', { name: TITOL });
  expect(onCanvia).not.toHaveBeenCalled();
  tria(bloc, 'Treball');
  expect(onCanvia).toHaveBeenCalledTimes(1);
  escriu(bloc, 'Ofici o sector', 'Forner');
  expect(onCanvia).toHaveBeenCalledTimes(2);
  escriu(bloc, 'Estat', 'tancat');
  expect(onCanvia).toHaveBeenCalledTimes(3);
  expect(onCanvia).toHaveBeenLastCalledWith({ ambit: 'treball', estat: 'tancat', dades: { ofici: 'Forner' } }, 'dades', false);
});

test('L2-A1 i L2-A2: el títol, l’ajuda, l’etiqueta «Àmbit» i els codis d’error passen pel traductor t(clau, reserva)', () => {
  const crides = new Map();
  const traductor = (clau, reserva) => {
    crides.set(clau, reserva);
    return clau === 'editor.ambit.boto' || clau === 'editor.ambit.titol' || clau.startsWith('editor.ambit.error.') ? `[${clau}] ${reserva}` : reserva;
  };
  const onCanvia = vi.fn();
  render(<BlocAmbit onCanvia={onCanvia} t={traductor} document={DOCUMENT} />);
  const bloc = screen.getByRole('group', { name: `[editor.ambit.titol] ${TITOL}` });
  expect(crides.get('editor.ambit.ajuda')).toBe(AJUDA);
  expect(crides.get('editor.ambit.boto')).toBe('Àmbit');
  expect(within(bloc).getByLabelText('[editor.ambit.boto] Àmbit')).toBeTruthy();

  fireEvent.change(within(bloc).getByLabelText('[editor.ambit.boto] Àmbit'), { target: { value: 'habitatge' } });
  escriu(bloc, 'Modalitat', 'venda');
  escriu(bloc, 'Preu', 'x'.repeat(130));
  escriu(bloc, 'Habitacions', '99');
  escriu(bloc, 'Superfície (m²)', '1.5');

  expect(crides.get('editor.ambit.error.llargaria')).toBe('El text de «{camp}» és massa llarg.');
  expect(crides.get('editor.ambit.error.rang')).toBe('El valor de «{camp}» és fora del rang permés.');
  expect(crides.get('editor.ambit.error.format')).toBe('El valor de «{camp}» no té la forma esperada.');
});

/* Correcció D2-publicacio-5-verticals-02 (Onada 4) · La fitxa que ix
   (normalitzaDades) descarta el valor fora del contracte, però el bloc el
   continua pintant amb el seu error: onCanvia porta, com a tercer argument,
   si les dades que la persona veu passen validaFitxa. Així qui el munta no
   publica una fitxa que la mateixa pantalla dona per errònia. El Mur, sempre
   vàlid. */
test('el tercer argument d’onCanvia diu si les dades locals són vàlides: «60» habitacions és fals encara que la fitxa que ix siga neta', () => {
  const { bloc, onCanvia } = pinta();
  tria(bloc, 'Habitatge');
  expect(onCanvia).toHaveBeenLastCalledWith({ ambit: 'habitatge', estat: 'disponible', dades: {} }, 'ambit', false);
  escriu(bloc, 'Modalitat', 'lloguer');
  escriu(bloc, 'Preu', '450 €/mes');
  expect(onCanvia).toHaveBeenLastCalledWith({ ambit: 'habitatge', estat: 'disponible', dades: { modalitat: 'lloguer', preu: '450 €/mes' } }, 'dades', true);
  escriu(bloc, 'Habitacions', '60');
  // La fitxa que ix no porta les habitacions, però les dades locals no són vàlides.
  expect(document.getElementById(camp(bloc, 'Habitacions').getAttribute('aria-describedby')).textContent).toBe('El valor de «Habitacions» és fora del rang permés.');
  expect(onCanvia).toHaveBeenLastCalledWith({ ambit: 'habitatge', estat: 'disponible', dades: { modalitat: 'lloguer', preu: '450 €/mes' } }, 'dades', false);
  // Canviar l'Estat no ho amaga.
  escriu(bloc, 'Estat', 'reservat');
  expect(onCanvia).toHaveBeenLastCalledWith({ ambit: 'habitatge', estat: 'reservat', dades: { modalitat: 'lloguer', preu: '450 €/mes' } }, 'dades', false);
  // Tornar a l'àmbit amb el valor dolent (des del Mur) el recupera: continua sent fals.
  tria(bloc, 'Mur');
  expect(onCanvia).toHaveBeenLastCalledWith({ ambit: 'mur', estat: 'reservat', dades: {} }, 'ambit', true);
  tria(bloc, 'Habitatge');
  expect(onCanvia).toHaveBeenLastCalledWith({ ambit: 'habitatge', estat: 'reservat', dades: { modalitat: 'lloguer', preu: '450 €/mes' } }, 'ambit', false);
  escriu(bloc, 'Habitacions', '3');
  expect(onCanvia).toHaveBeenLastCalledWith({ ambit: 'habitatge', estat: 'reservat', dades: { modalitat: 'lloguer', preu: '450 €/mes', habitacions: 3 } }, 'dades', true);
});

/* idea61-05 (Gauntlet T7a, 261104) · El camp «Com contactar» de Treball va
   marcat `privat` al contracte, que només vol dir fora de la targeta i de la
   cerca: la fitxa de lectura del detall el mostra a la gent registrada del
   poble (la fitxa és per a contactar). La previsualització l'amaga a posta, i
   el formulari no ho deia: ara el camp porta una ajuda lligada per
   aria-describedby (amb l'error, si n'hi ha). Cap altre camp en porta. */
test('idea61-05 · «Com contactar» diu qui el veurà (ajuda lligada al control, també amb l’error); cap altre camp porta ajuda', () => {
  const AJUDA_CONTACTE = 'Ho veurà la gent registrada del poble en obrir la fitxa; no ix a la targeta ni a la cerca.';
  const crides = new Map();
  const traductor = (clau, reserva) => { crides.set(clau, reserva); return reserva; };
  const onCanvia = vi.fn();
  render(<BlocAmbit onCanvia={onCanvia} t={traductor} document={DOCUMENT} valor={{ ambit: 'treball', estat: 'disponible', dades: {} }} />);
  const bloc = screen.getByRole('group', { name: TITOL });
  expect(crides.get('editor.ambit.contacteVisible')).toBe(AJUDA_CONTACTE);
  const contacte = camp(bloc, 'Com contactar');
  const ids = () => contacte.getAttribute('aria-describedby').split(' ');
  expect(ids().map((id) => document.getElementById(id).textContent)).toEqual([AJUDA_CONTACTE]);
  expect(bloc.querySelectorAll('.sdp-camp__ajuda')).toHaveLength(1);
  escriu(bloc, 'Com contactar', 'x'.repeat(130));
  expect(ids().map((id) => document.getElementById(id).textContent)).toEqual([AJUDA_CONTACTE, 'El text de «Com contactar» és massa llarg.']);
  for (const ambit of ['Mercat', 'Compartir cotxe', 'Habitatge']) {
    tria(bloc, ambit);
    expect(bloc.querySelectorAll('.sdp-camp__ajuda'), ambit).toHaveLength(0);
  }
  expect(CAMPS.treball.filter((campDef) => campDef.privat).map((campDef) => campDef.id)).toEqual(['contacte']);
});

/* G3-g2-matriu-05 (AH-04.3: calendari multi-dia) · Una fi anterior a l'inici
   (validaFitxa · 'ordre') es diu en línia al camp de la fi, amb la seua clau
   (editor.ambit.error.ordre), i no deixa publicar (tercer argument fals). */
test('calendari: una fi anterior a l’inici diu l’error «ordre» al camp de la fi i no és vàlida', () => {
  const traduides = new Map();
  const traductor = (clau, reserva) => { traduides.set(clau, reserva); return reserva; };
  const onCanvia = vi.fn();
  render(<BlocAmbit onCanvia={onCanvia} t={traductor} document={DOCUMENT}
    valor={{ ambit: 'calendari', estat: 'disponible', dades: { data_inici: '2026-11-22', lloc: 'Bancals', data_fi: '2026-11-20' } }} mostraErrors />);
  const bloc = screen.getByRole('group', { name: TITOL });
  const dataFi = camp(bloc, 'Dia de finalització');
  expect(dataFi.getAttribute('aria-invalid')).toBe('true');
  expect(document.getElementById(dataFi.getAttribute('aria-describedby')).textContent).toBe('El valor de «Dia de finalització» no pot ser anterior a l’inici.');
  expect(traduides.get('editor.ambit.error.ordre')).toBe('El valor de «{camp}» no pot ser anterior a l’inici.');
  escriu(bloc, 'Dia de finalització', '2026-11-24');
  expect(dataFi.getAttribute('aria-invalid')).not.toBe('true');
  expect(onCanvia).toHaveBeenLastCalledWith(expect.objectContaining({ ambit: 'calendari' }), 'dades', true);
  escriu(bloc, 'Dia de finalització', '2026-11-21');
  expect(onCanvia).toHaveBeenLastCalledWith(expect.objectContaining({ ambit: 'calendari' }), 'dades', false);
});

/* G3-pedra-seca-i18n-13 (Pedra Seca §6: «Els botons d'àmbit de "On es
   publica?" exigixen 58px segons el contracte O4») · AH-04 hi posa un
   Selector: porta la classe del bloc que li dona --sdp-alt-accio (58 px), no
   el sòl genèric de 48 px. */
test('el Selector «Àmbit» porta la classe de l’alçada d’acció de Pedra Seca (58 px)', () => {
  const { bloc } = pinta();
  expect(selectorAmbit(bloc).classList.contains('sdp-bloc-ambit__selector')).toBe(true);
});

/* G3-pedra-seca-i18n-12 i -13 · Les regles del bloc a components.css: cap
   regla orfa per a GrupOpcions (.sdp-grup, que AH-04 ha retirat); els Camps
   del bloc (el de l'àmbit i els de la fitxa) sense el marge de formulari, de
   manera que l'espai entre peces el dona només el gap de la Pila (abans 16 +
   20 = 36 px davall del selector); i el Selector de l'àmbit a 58 px. */
test('components.css: el ritme del bloc és el gap de la Pila i el Selector de l’àmbit fa --sdp-alt-accio', () => {
  const css = readFileSync(path.join(process.cwd(), 'src/css/components.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  expect(css).not.toMatch(/\.sdp-bloc-ambit\s*>\s*\.sdp-grup/);
  expect(css).toMatch(/\.sdp-bloc-ambit \.sdp-camp\s*\{\s*margin:\s*0;\s*\}/);
  expect(css).toMatch(/\.sdp-bloc-ambit__selector\s*\{\s*min-block-size:\s*var\(--sdp-alt-accio\);\s*\}/);
});
