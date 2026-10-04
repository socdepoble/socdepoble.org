import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const m = vi.hoisted(() => ({ slug: '', core: { status: 'ready', pages: [], pageCopy: {} }, props: null }));
vi.mock('../../app/contexts/RouterContext', () => ({
  Navigate: ({ to }) => <p>redirecció:{to}</p>,
  useParams: () => ({ slug: m.slug })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => m.core }));
vi.mock('../text/TextSection', () => ({
  default: (props) => {
    m.props = props;
    return <p>pàgina:{props.pageKey}:{props.page.title}</p>;
  }
}));
vi.mock('../../pages/NotFoundPage', () => ({ default: () => <p>404</p> }));
import PageDetailSection from './PageDetailSection.jsx';
import { PublicarDeLaPagina } from '../control/PublicarDeLaPagina.jsx';
import { DESTINS_CONTROL } from '../control/destinsControl.js';
import fontPagina from './PageDetailSection.jsx?raw';

afterEach(() => {
  cleanup();
  m.props = null;
});

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

/* T8 (ordre del Mestre, 261004, prompt 261004_0515 §6) · Una pàgina amb
   destí al Panell porta el botó Publicar dalt (accioPrincipal, lloc 'dalt')
   i el conserva baix (children). Es decidix amb destiDePagina(slug), mai amb
   un element que pinta null. */
test('T8 · una pàgina amb destí passa el botó Publicar dalt (accioPrincipal) i el conserva baix', () => {
  for (const desti of DESTINS_CONTROL) {
    visita(desti.pagina);
    const { accioPrincipal, children } = m.props;
    expect([desti.pagina, accioPrincipal.type, accioPrincipal.props]).toEqual([desti.pagina, PublicarDeLaPagina, { clau: desti.pagina, lloc: 'dalt' }]);
    expect([desti.pagina, children.type, children.props]).toEqual([desti.pagina, PublicarDeLaPagina, { clau: desti.pagina }]);
    cleanup();
  }
});

test('T8 · una pàgina sense destí no porta cap acció dalt (null, no un element que pinta null)', () => {
  visita('guia', { pages: [{ id: 'guia', title: 'Guia del poble' }] });
  expect(m.props.accioPrincipal).toBeNull();
  /* El de baix es passa com sempre: PublicarDeLaPagina no hi pinta res. */
  expect(m.props.children.props).toEqual({ clau: 'guia' });
});

/* Higiene d'amfitrió (ordre del Mestre, 261004) · Canviar de pàgina no busca
   res pel document de l'amfitrió ni obri el shadow root de <soc-de-poble>
   des de fora: la recol·locació del desplaçador és d'App (preparaRecolocacio). */
test('canviar de slug no consulta el document ni mou cap .app-main', () => {
  const main = document.createElement('div');
  main.className = 'app-main';
  main.scrollTo = vi.fn();
  document.body.appendChild(main);
  const consulta = vi.spyOn(document, 'querySelector');
  try {
    const { rerender } = visita('guia', { pages: [{ id: 'guia', title: 'Guia' }, { id: 'altra', title: 'Altra' }] });
    m.slug = 'altra';
    rerender(<PageDetailSection />);
    expect(screen.getByText('pàgina:altra:Altra')).toBeTruthy();
    expect(main.scrollTo).not.toHaveBeenCalled();
    expect(consulta.mock.calls.filter(([selector]) => /app-main|soc-de-poble/.test(String(selector)))).toEqual([]);
  } finally {
    consulta.mockRestore();
    main.remove();
  }
  expect(fontPagina).not.toMatch(/document\s*\.\s*querySelector/);
  expect(fontPagina).not.toMatch(/\.shadowRoot/);
});

test('W01: el que no existix és un 404, i les claus heretades no són pàgines', () => {
  visita('no-existeix');
  expect(screen.getByText('404')).toBeTruthy();
  cleanup();
  visita('constructor');
  expect(screen.getByText('404')).toBeTruthy();
});
