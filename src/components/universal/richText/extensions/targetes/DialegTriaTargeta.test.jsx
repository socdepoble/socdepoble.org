/* T7 (ordre del Mestre, prompt 261004_0515) · El selector de targetes:
   busca amb la funció de l'adaptador, no oferix res privat, insereix la
   triada i oblida la tria en tancar. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { DialegTriaTargeta, MAXIM_OPCIONS } from './DialegTriaTargeta.jsx';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const ENTRADES = Object.freeze([
  { clau: 'publicacions:1', tipus: 'publicacions', id: '1', titol: 'La festa de la Torre', extracte: 'Música a la plaça', href: '/mur/1' },
  { clau: 'notes:n1', tipus: 'notes', id: 'n1', titol: 'La festa privada', extracte: 'Només meua', href: '/notes?nota=n1', privada: true },
  { clau: 'pobles:7', tipus: 'pobles', id: '7', titol: 'La Torre de les Maçanes', extracte: 'L’Alacantí', href: '/pobles/7' }
]);

function munta(props = {}) {
  const cerca = vi.fn(() => ENTRADES);
  const onTria = vi.fn();
  const onTanca = vi.fn();
  const vista = render(<DialegTriaTargeta obert cerca={cerca} onTria={onTria} onTanca={onTanca} {...props} />);
  return { ...vista, cerca, onTria, onTanca };
}

const dialeg = () => screen.getByRole('dialog', { name: 'Inserir una targeta' });
const busca = (text) => fireEvent.change(within(dialeg()).getByRole('searchbox', { name: 'Busca' }), { target: { value: text } });

test('sense consulta no es busca: un avís diu què es pot buscar', () => {
  const { cerca } = munta();
  expect(dialeg().open).toBe(true);
  expect(cerca).not.toHaveBeenCalled();
  expect(within(dialeg()).getByRole('status').textContent).toMatch(/una publicació, un acte, un producte, un poble o una pàgina/);
  expect(within(dialeg()).getByRole('button', { name: 'Inserir' }).disabled).toBe(true);
});

test('busca amb cerca(consulta) i només oferix el que es pot incrustar (cap nota privada)', () => {
  const { cerca } = munta();
  busca('  festa ');
  expect(cerca).toHaveBeenLastCalledWith('festa');
  const opcions = within(dialeg()).getAllByRole('radio');
  expect(opcions).toHaveLength(2);
  expect(opcions.map((opcio) => opcio.value)).toEqual(['publicacio:1', 'poble:7']);
  expect(within(dialeg()).getByText('Publicació')).toBeTruthy();
  expect(within(dialeg()).getByText('Poble')).toBeTruthy();
  expect(within(dialeg()).queryByText('La festa privada')).toBeNull();
});

test('triar i Inserir: onTria rep l’entrada sencera, i la tria s’oblida', () => {
  const { onTria } = munta();
  busca('festa');
  fireEvent.click(within(dialeg()).getAllByRole('radio')[0]);
  fireEvent.click(within(dialeg()).getByRole('button', { name: 'Inserir' }));
  expect(onTria).toHaveBeenCalledWith(ENTRADES[0]);
  expect(within(dialeg()).getByRole('searchbox', { name: 'Busca' }).value).toBe('');
});

test('sense coincidències ho diu; i una font que peta no tomba el diàleg', () => {
  munta({ cerca: () => [] });
  busca('res');
  expect(within(dialeg()).getByRole('status').textContent).toBe('Cap targeta pública coincidix amb la cerca.');
  cleanup();
  munta({ cerca: () => { throw new Error('font caiguda'); } });
  busca('festa');
  expect(within(dialeg()).queryAllByRole('radio')).toHaveLength(0);
});

/* Revisió del front «editor» (261004) · La regió viva viu sempre muntada i
   només li canvia el text: una regió que naix ja plena sovint no s'anuncia
   (VoiceOver, NVDA), i l'aparició de resultats no s'anunciava mai. Amb
   resultats, el recompte és només per al lector: la pantalla no canvia. */
test('la regió role=status és sempre el mateix node: ajuda, recompte per al lector i cap resultat', () => {
  const cerca = (consulta) => ENTRADES.filter((entrada) => entrada.titol.toLowerCase().includes(consulta.toLowerCase()));
  munta({ cerca });
  const regio = within(dialeg()).getByRole('status');
  expect(regio.textContent).toMatch(/una publicació, un acte, un producte, un poble o una pàgina/);
  expect(regio.className).toBe('sdp-tria-targeta__avis');
  busca('torre');
  expect(within(dialeg()).getAllByRole('radio')).toHaveLength(2);
  expect(within(dialeg()).getByRole('status')).toBe(regio);
  expect(regio.textContent).toBe('Resultats: 2');
  expect(regio.className).toBe('sdp-tria-targeta__avis sdp-nomes-lector');
  busca('zzz');
  expect(within(dialeg()).getByRole('status')).toBe(regio);
  expect(regio.textContent).toBe('Cap targeta pública coincidix amb la cerca.');
  expect(regio.className).toBe('sdp-tria-targeta__avis');
});

test('com a molt MAXIM_OPCIONS opcions, sense repetir clau', () => {
  const moltes = Array.from({ length: 40 }, (_, i) => ({ clau: `pobles:${i % 30}`, tipus: 'pobles', id: String(i % 30), titol: `Poble ${i % 30}`, extracte: '' }));
  munta({ cerca: () => moltes });
  busca('poble');
  expect(within(dialeg()).getAllByRole('radio')).toHaveLength(MAXIM_OPCIONS);
});

test('Cancel·lar i Escape tanquen pel pare i obliden la consulta', () => {
  const { onTanca } = munta();
  busca('festa');
  fireEvent.click(within(dialeg()).getByRole('button', { name: 'Cancel·lar' }));
  expect(onTanca).toHaveBeenLastCalledWith('boto', undefined);
  expect(within(dialeg()).getByRole('searchbox', { name: 'Busca' }).value).toBe('');
  busca('torre');
  fireEvent(dialeg(), new Event('cancel', { cancelable: true }));
  expect(onTanca).toHaveBeenLastCalledWith('esc', undefined);
  expect(within(dialeg()).getByRole('searchbox', { name: 'Busca' }).value).toBe('');
});

test('en tancar-se, el focus torna on era', () => {
  const boto = document.createElement('button');
  boto.textContent = 'Origen';
  document.body.appendChild(boto);
  boto.focus();
  const cerca = () => ENTRADES;
  const { rerender } = render(<DialegTriaTargeta obert={false} cerca={cerca} onTria={vi.fn()} onTanca={vi.fn()} />);
  rerender(<DialegTriaTargeta obert cerca={cerca} onTria={vi.fn()} onTanca={vi.fn()} />);
  rerender(<DialegTriaTargeta obert={false} cerca={cerca} onTria={vi.fn()} onTanca={vi.fn()} />);
  expect(document.activeElement).toBe(boto);
  boto.remove();
});
