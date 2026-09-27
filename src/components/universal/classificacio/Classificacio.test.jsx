import React from 'react';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../../../app/contexts/RouterContext', () => ({ Link: 'a', useNavigate: () => vi.fn() }));
import { BotoneraClassificacio } from './BotoneraClassificacio.jsx';
import { DialegValors } from './DialegValors.jsx';
import { DialegCarpeta } from './DialegCarpeta.jsx';
import { DialegEmoticona } from './DialegEmoticona.jsx';

afterEach(cleanup);

const AVIS = 'Cal almenys una categoria. Si vols netejar-les, marca’n una de general, com «General».';

test('T23 · la botonera porta un quart botó d’emoticona: ploma sense emoticona, l’emoticona quan n’hi ha', () => {
  const onObri = vi.fn();
  const { rerender } = render(<BotoneraClassificacio carpeta="Mur" categories={[]} etiquetes={[]} onObri={onObri} />);
  const grup = screen.getByRole('group', { name: 'Classificació del document' });
  const botons = within(grup).getAllByRole('button');
  expect(botons).toHaveLength(4);
  expect(botons[3].textContent).toBe('Emoticona—');
  expect(botons[3].querySelector('svg.lucide-feather')).toBeTruthy();
  fireEvent.click(botons[3]);
  expect(onObri).toHaveBeenLastCalledWith('emoticona');

  rerender(<BotoneraClassificacio carpeta="Mur" categories={[]} etiquetes={[]} emoticona="🍅" onObri={onObri} />);
  const ambEmoticona = within(screen.getByRole('group', { name: 'Classificació del document' })).getAllByRole('button')[3];
  expect(ambEmoticona.querySelector('svg')).toBeNull();
  expect(ambEmoticona.querySelector('.sdp-classificacio-botonera__glif').textContent).toBe('🍅');
  expect(ambEmoticona.textContent).toBe('🍅Emoticona');
});

test('T23 · el diàleg d’emoticona només desa un sol emoji, i «Llevar» la buida', () => {
  const onDesa = vi.fn();
  render(<DialegEmoticona obert onTanca={vi.fn()} actual="🍅" onDesa={onDesa} />);
  const camp = screen.getByRole('textbox', { name: 'Emoticona' });
  const desar = screen.getByRole('button', { name: 'Desar' });
  expect(camp.value).toBe('🍅');
  expect(desar.disabled).toBe(false);
  fireEvent.change(camp, { target: { value: 'ab' } });
  expect(desar.disabled).toBe(true);
  expect(screen.getByText('Ha de ser un sol emoji, sense text.')).toBeTruthy();
  fireEvent.change(camp, { target: { value: ' 🧱 ' } });
  expect(desar.disabled).toBe(false);
  fireEvent.keyDown(camp, { key: 'Enter' });
  expect(onDesa).toHaveBeenLastCalledWith('🧱');
  fireEvent.click(screen.getByRole('button', { name: 'Llevar' }));
  expect(onDesa).toHaveBeenLastCalledWith('');
});

function dialegCategories(props = {}) {
  const handlers = { onDesa: vi.fn(), onReanomena: vi.fn(), onEsborra: vi.fn(), onTanca: vi.fn() };
  render(
    <DialegValors
      obert titol="Categories de la nota" etiquetaNou="Nova categoria"
      cataleg={['A', 'B', 'Sistema']} seleccionats={['A']} minim={1} fixos={['Sistema']}
      avisMinim={AVIS} {...handlers} {...props}
    />
  );
  return handlers;
}

test('la botonera porta Carpetes, Categories i Etiquetes, amb resum, i obri cada modal', () => {
  const onObri = vi.fn();
  render(<BotoneraClassificacio carpeta="Mur" categories={['Sistema']} etiquetes={['a', 'b']} onObri={onObri} />);
  const grup = screen.getByRole('group', { name: 'Classificació del document' });
  const botons = within(grup).getAllByRole('button');
  expect(botons.map((b) => b.textContent)).toEqual(['CarpetesMur', 'Categories1', 'Etiquetes2', 'Emoticona—']);
  botons.forEach((b) => expect(b.getAttribute('aria-haspopup')).toBe('dialog'));
  fireEvent.click(botons[0]); fireEvent.click(botons[1]); fireEvent.click(botons[2]); fireEvent.click(botons[3]);
  expect(onObri.mock.calls.map(([tipus]) => tipus)).toEqual(['carpeta', 'categories', 'etiquetes', 'emoticona']);
});

test('orfandat: la darrera categoria no es pot desmarcar ni esborrar, i la modal ho explica', () => {
  dialegCategories();
  const a = screen.getByRole('checkbox', { name: 'A' });
  expect(a.checked).toBe(true);
  expect(a.disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Esborrar «A»' }).disabled).toBe(true);
  expect(screen.getByText(AVIS)).toBeTruthy();
});

test('orfandat: amb dues categories se’n pot llevar una, i aleshores l’altra queda fixada', () => {
  const { onDesa } = dialegCategories({ seleccionats: ['A', 'B'] });
  fireEvent.click(screen.getByRole('checkbox', { name: 'A' }));
  expect(screen.getByRole('checkbox', { name: 'B' }).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(onDesa).toHaveBeenCalledWith(['B']);
});

test('orfandat: una nota sense categoria no es pot desar fins que en tria una', () => {
  const { onDesa } = dialegCategories({ seleccionats: [] });
  const desar = screen.getByRole('button', { name: 'Desar' });
  expect(desar.disabled).toBe(true);
  fireEvent.click(screen.getByRole('checkbox', { name: 'B' }));
  expect(desar.disabled).toBe(false);
  fireEvent.click(desar);
  expect(onDesa).toHaveBeenCalledWith(['B']);
});

test('les etiquetes poden quedar buides', () => {
  const onDesa = vi.fn();
  render(<DialegValors obert titol="Etiquetes" etiquetaNou="Nova etiqueta" cataleg={['x']} seleccionats={['x']} minim={0}
    onDesa={onDesa} onReanomena={vi.fn()} onEsborra={vi.fn()} onTanca={vi.fn()} />);
  const x = screen.getByRole('checkbox', { name: 'x' });
  expect(x.disabled).toBe(false);
  fireEvent.click(x);
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(onDesa).toHaveBeenCalledWith([]);
});

test('afegir crea el valor i el selecciona per a esta nota', () => {
  const { onDesa } = dialegCategories();
  const camp = screen.getByRole('textbox', { name: 'Nova categoria' });
  fireEvent.change(camp, { target: { value: '  Hort ' } });
  fireEvent.keyDown(camp, { key: 'Enter' });
  expect(screen.getByRole('checkbox', { name: 'Hort' }).checked).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(onDesa).toHaveBeenCalledWith(['A', 'Hort']);
});

test('reanomenar demana el nom nou i l’aplica a totes les notes', () => {
  const { onReanomena, onDesa } = dialegCategories();
  fireEvent.click(screen.getByRole('button', { name: 'Reanomenar «A»' }));
  const camp = screen.getByRole('textbox', { name: 'Nou nom per a «A»' });
  fireEvent.change(camp, { target: { value: 'B' } });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
  // Un nom que ja existix no s'aplica.
  expect(onReanomena).not.toHaveBeenCalled();
  expect(screen.getByText('Ja hi ha «B». Tria un altre nom.')).toBeTruthy();
  fireEvent.change(camp, { target: { value: 'Z' } });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
  expect(onReanomena).toHaveBeenCalledWith('A', 'Z');
  expect(screen.getByRole('checkbox', { name: 'Z' }).checked).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(onDesa).toHaveBeenCalledWith(['Z']);
});

test('esborrar demana confirmació i el lleva de totes les notes', () => {
  const { onEsborra } = dialegCategories({ seleccionats: ['A', 'B'] });
  fireEvent.click(screen.getByRole('button', { name: 'Esborrar «B»' }));
  expect(onEsborra).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar: esborrar «B»' }));
  expect(onEsborra).toHaveBeenCalledWith('B');
  expect(screen.queryByRole('checkbox', { name: 'B' })).toBeNull();
});

test('els valors de sèrie no es poden reanomenar ni esborrar', () => {
  dialegCategories();
  expect(screen.getByRole('button', { name: 'Reanomenar «Sistema»' }).disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Esborrar «Sistema»' }).disabled).toBe(true);
});

test('carpetes: se’n tria sempre una; crear, reanomenar i esborrar queden deshabilitats i explicats', () => {
  const onDesa = vi.fn();
  render(<DialegCarpeta obert onTanca={vi.fn()} onDesa={onDesa} seleccionada="f-mur"
    opcions={[{ id: 'f-mur', nom: 'Mur' }, { id: 'f-notes', nom: 'Altres notes' }]}
    avis="Encara no hi ha contracte de dades per a gestionar carpetes." />);
  expect(screen.getByRole('radio', { name: 'Mur' }).checked).toBe(true);
  fireEvent.click(screen.getByRole('radio', { name: 'Altres notes' }));
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(onDesa).toHaveBeenCalledWith('f-notes');
  for (const nom of ['Crear carpeta', 'Reanomenar carpeta', 'Esborrar carpeta']) {
    expect(screen.getByRole('button', { name: nom }).disabled).toBe(true);
  }
  expect(screen.getByText('Encara no hi ha contracte de dades per a gestionar carpetes.')).toBeTruthy();
});
