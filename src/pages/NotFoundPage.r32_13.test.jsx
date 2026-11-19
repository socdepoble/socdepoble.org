import '../../tests/helpers/diccionaris.js';
import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { UIContext } from '../app/contexts/objectesDeContext.js';
import { MemoryRouter } from '../app/contexts/RouterContext.jsx';

vi.mock('../hooks/useSEO', () => ({ useSEO: vi.fn() }));
vi.mock('../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, subtitle, lead, labels = [], children }) => (
    <main>
      <header className="page-title">
        <div>{labels.map((l) => <span key={String(l)}>{String(l)}</span>)}</div>
        <h1>{title}</h1>
        {subtitle ? <h2>{subtitle}</h2> : null}
        {lead ? <p>{lead}</p> : null}
      </header>
      {children}
    </main>
  )
}));

import NotFoundPage from './NotFoundPage.jsx';
import { TEXTOS_NOT_FOUND, textosNotFound } from './i18nNotFound.js';

afterEach(cleanup);

describe('Onada R32.13 · Lot 03 · NotFoundPage 404 Pedra Seca 10/10 en 5 llengües', () => {
  test('diccionari i18nNotFound cobrix ca, es, en, eu, gl amb Llei 32 = 0 i 0 «usar»', () => {
    const llengues = ['ca', 'es', 'en', 'eu', 'gl'];
    expect(Object.keys(TEXTOS_NOT_FOUND).sort()).toEqual([...llengues].sort());
    for (const lang of llengues) {
      const tx = textosNotFound(lang);
      for (const val of Object.values(tx)) {
        const cadena = Array.isArray(val) ? val.join(' ') : String(val);
        expect(cadena.toLowerCase()).not.toContain('servidor del poble');
        expect(cadena.toLowerCase()).not.toMatch(/\busar\b/);
      }
    }
    expect(TEXTOS_NOT_FOUND.ca.title).toBe('Ací no hi ha res');
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])('%s: jerarquia H1->H2->H3, Llei 35 (<strong>) i dreceres /mur, /pobles, /mercat, /mapa i /', (lang) => {
    const tx = textosNotFound(lang);
    const { container } = render(
      <MemoryRouter rutaInicial="/ruta-inexistent-404">
        <UIContext.Provider value={{ language: lang, llenguaDelText: lang }}>
          <NotFoundPage />
        </UIContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: tx.title })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: tx.subtitle })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: tx.cosTitol })).toBeTruthy();

    const negreta = container.querySelector('.sdp-404-cos p strong');
    expect(negreta).not.toBeNull();
    expect(negreta.textContent).toBe(tx.cosNegreta);
    expect(container.querySelector('.btn')).toBeNull();

    const nav = screen.getByRole('navigation', { name: tx.navAriaLabel });
    const destins = within(nav).getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(destins).toEqual(['/mur', '/pobles', '/mercat', '/mapa', '/']);
  });
});
