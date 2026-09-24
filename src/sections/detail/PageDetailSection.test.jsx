import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const m = vi.hoisted(() => ({ slug: '', core: { status: 'ready', pages: [], pageCopy: {} } }));
vi.mock('../../app/contexts/RouterContext', () => ({
  Navigate: ({ to }) => <p>redirecció:{to}</p>,
  useParams: () => ({ slug: m.slug })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => m.core }));
vi.mock('../text/TextSection', () => ({ default: ({ page, pageKey }) => <p>pàgina:{pageKey}:{page.title}</p> }));
vi.mock('../../pages/NotFoundPage', () => ({ default: () => <p>404</p> }));
import PageDetailSection from './PageDetailSection.jsx';

afterEach(cleanup);

const visita = (slug, core = {}) => {
  m.slug = slug;
  m.core = { status: 'ready', pages: [], pageCopy: {}, ...core };
  return render(<PageDetailSection />);
};

test('W01: un slug amb ruta pròpia redirigix a la ruta canònica', () => {
  visita('projecte');
  expect(screen.getByText('redirecció:/projecte')).toBeTruthy();
});

test('W01: una pàgina sense ruta pròpia es pinta, no salta al Mur', () => {
  visita('guia', { pages: [{ id: 'guia', title: 'Guia del poble' }] });
  expect(screen.getByText('pàgina:guia:Guia del poble')).toBeTruthy();
});

test('W01: sense contingut encara no hi ha ni redirecció ni 404', () => {
  visita('guia', { status: 'loading' });
  expect(screen.getByRole('status')).toBeTruthy();
  expect(screen.queryByText('404')).toBeNull();
});

test('W01: el que no existix és un 404, i les claus heretades no són pàgines', () => {
  visita('no-existeix');
  expect(screen.getByText('404')).toBeTruthy();
  cleanup();
  visita('constructor');
  expect(screen.getByText('404')).toBeTruthy();
});
