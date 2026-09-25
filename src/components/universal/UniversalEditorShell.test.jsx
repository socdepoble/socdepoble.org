import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { EditableField } from './UniversalEditorShell.jsx';
import { sanitizeHtml } from '../../utils/sanitize.js';

afterEach(cleanup);

/* Simula una tecla: el navegador ja ha escrit al DOM quan arriba l'«input».
   Passa pel sanejador per complir la porta tractor-innerhtml (també als tests). */
function tecleja(camp, html) {
  camp.innerHTML = sanitizeHtml(html);
  fireEvent.input(camp);
}

test('A2 · amb el focus al camp, el valor que torna del pare no reescriu el DOM', () => {
  const onChange = vi.fn();
  const { container, rerender } = render(<EditableField html="" onChange={onChange} className="camp" />);
  const camp = container.querySelector('.camp');
  fireEvent.focus(camp);

  tecleja(camp, 'H');
  const nodeTeclejat = camp.firstChild;
  expect(onChange).toHaveBeenLastCalledWith('H');
  // El pare desa el valor i el torna com a prop: el node de text ha de ser el
  // mateix, perquè reescriure'l torna el cursor a l'inici («Hola» → «aloH»).
  rerender(<EditableField html="H" onChange={onChange} className="camp" />);
  expect(camp.firstChild).toBe(nodeTeclejat);

  tecleja(camp, 'Hola');
  // Un valor endarrerit (desat asíncron) tampoc no trepitja el que s'escriu.
  rerender(<EditableField html="Hol" onChange={onChange} className="camp" />);
  expect(camp.textContent).toBe('Hola');
});

test('A2 · en perdre el focus es pinta el valor desat', () => {
  const onBlur = vi.fn();
  const { container, rerender } = render(<EditableField html="Vell" onBlur={onBlur} className="camp" />);
  const camp = container.querySelector('.camp');
  fireEvent.focus(camp);
  tecleja(camp, 'Nou');
  fireEvent.blur(camp);
  expect(onBlur).toHaveBeenLastCalledWith('Nou');
  rerender(<EditableField html="Nou desat" onBlur={onBlur} className="camp" />);
  expect(camp.textContent).toBe('Nou desat');
});

test('A2 · els hooks no depenen del return null: el camp pot aparéixer després', () => {
  const { container, rerender } = render(<EditableField html={null} className="camp" />);
  expect(container.querySelector('.camp')).toBeNull();
  rerender(<EditableField html="Títol" className="camp" />);
  expect(container.querySelector('.camp').textContent).toBe('Títol');
  rerender(<EditableField html={null} className="camp" />);
  expect(container.querySelector('.camp')).toBeNull();
});

test('A3 · un camp buidat es desa com a cadena buida, no com a <br>, salts o espais', () => {
  const onChange = vi.fn();
  const onBlur = vi.fn();
  const { container } = render(<EditableField html="Hola" onChange={onChange} onBlur={onBlur} className="camp" />);
  const camp = container.querySelector('.camp');
  fireEvent.focus(camp);
  for (const buit of ['<br>', '\n\n', ' ', '&nbsp;', '<div><br></div>', '<p><br></p>']) {
    tecleja(camp, buit);
    expect(onChange).toHaveBeenLastCalledWith('');
  }
  fireEvent.blur(camp);
  expect(onBlur).toHaveBeenLastCalledWith('');
});

test('A3 · un camp buidat queda realment buit en perdre el focus (placeholder sense :has())', () => {
  const onChange = vi.fn();
  const { container, rerender } = render(<EditableField html="" onChange={onChange} className="camp" />);
  const camp = container.querySelector('.camp');
  fireEvent.focus(camp);
  tecleja(camp, 'H');
  rerender(<EditableField html="H" onChange={onChange} className="camp" />);
  tecleja(camp, '<br>');
  rerender(<EditableField html="" onChange={onChange} className="camp" />);
  fireEvent.blur(camp);
  expect(camp.childNodes).toHaveLength(0);
});

test('A3 · el text i les imatges pròpies es conserven', () => {
  const onChange = vi.fn();
  const { container } = render(<EditableField html="" onChange={onChange} className="camp" />);
  const camp = container.querySelector('.camp');
  fireEvent.focus(camp);
  tecleja(camp, 'Hola <strong>món</strong>');
  expect(onChange).toHaveBeenLastCalledWith('Hola <strong>món</strong>');
  tecleja(camp, '<img src="/assets/a.png" alt="">');
  expect(onChange.mock.lastCall[0]).toMatch(/^<img\b/);
});
