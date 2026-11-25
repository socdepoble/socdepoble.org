/**
 * lot-g3-registre-canvis-v1225.test.jsx — Bateria de verificació del Lot G3
 * (Onada v1.2.25 · IDEA-354: Registre de canvis atòmic en 3 columnes a /disseny +
 * versió clicable al peu de la barra lateral).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { MemoryRouter } from '../src/app/contexts/RouterContext';
import RegistreCanvisDisseny from '../src/sections/disseny/registre-canvis/RegistreCanvisDisseny.jsx';
import {
  LLENGUES_REGISTRE_CANVIS,
  TEXTOS_REGISTRE_CANVIS,
  VERSIONS_REGISTRE,
  localitzaItemRegistreCanvis
} from '../src/sections/disseny/registre-canvis/dadesRegistreCanvis.js';
import { CATALOG_CATEGORIES, CATALOG_ITEMS } from '../src/sections/disseny/cataleg/manifest.js';

afterEach(() => {
  cleanup();
});

describe('Lot G3 · IDEA-354 · Simetria 5 llengües i catàleg /disseny', () => {
  test('totes les versions i etiquetes del Registre de Canvis són 100 % simètriques en ca/es/en/eu/gl', () => {
    const claus = Object.keys(TEXTOS_REGISTRE_CANVIS.ca).sort();
    for (const lang of LLENGUES_REGISTRE_CANVIS) {
      expect(Object.keys(TEXTOS_REGISTRE_CANVIS[lang]).sort()).toEqual(claus);
    }
    for (const v of VERSIONS_REGISTRE) {
      for (const lang of LLENGUES_REGISTRE_CANVIS) {
        expect(v.data[lang].length).toBeGreaterThan(4);
        expect(v.titol[lang].length).toBeGreaterThan(8);
        expect(v.resum[lang].length).toBeGreaterThan(15);
        expect(v.abast[lang].length).toBeGreaterThan(10);
        expect(v.millores[lang].length).toBeGreaterThanOrEqual(2);
        expect(v.correccions[lang].length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test('la categoria registre-de-canvis i els 8 espècimens atòmics existixen al manifest de /disseny', () => {
    expect(CATALOG_CATEGORIES.find((c) => c.id === 'registre-de-canvis')).toMatchObject({
      id: 'registre-de-canvis',
      label: 'Registre de canvis',
      icon: '📋'
    });
    const itemsRc = CATALOG_ITEMS.filter((i) => i.categoryIds[0] === 'registre-de-canvis');
    expect(itemsRc.map((i) => i.id)).toEqual([
      'registre-de-canvis-conjunt',
      'registre-de-canvis-v1-2-25',
      'registre-de-canvis-v1-2-24',
      'registre-de-canvis-v1-2-23',
      'registre-de-canvis-v1-2-22',
      'registre-de-canvis-v1-2-21',
      'registre-de-canvis-v1-2-20',
      'registre-de-canvis-historic'
    ]);
    for (const item of itemsRc) {
      const en = localitzaItemRegistreCanvis(item, 'en');
      expect(en?.categoriaLabel).toBe('Changelog');
    }
  });
});

describe('Lot G3 · IDEA-354 · Acordions nadius <details>/<summary> i Expandir/Plegar tot', () => {
  test('Vista de conjunt usa <details>/<summary> sense headings dins <summary> i gestiona aria-expanded', () => {
    const { container } = render(
      <MemoryRouter rutaInicial="/disseny?categoria=registre-de-canvis&item=registre-de-canvis-conjunt">
        <RegistreCanvisDisseny versioId="conjunt" llengua="ca" />
      </MemoryRouter>
    );
    const boto = screen.getByTestId('registre-canvis-alterna-tots');
    expect(boto.getAttribute('aria-expanded')).toBe('false');
    expect(boto.textContent).toBe('Expandir tot');

    // Guia modern-web-guidance/accordion: cap heading h1..h6 dins de <summary>
    const summaries = [...container.querySelectorAll('summary')];
    expect(summaries.length).toBe(VERSIONS_REGISTRE.length * 2);
    for (const summary of summaries) {
      expect(summary.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
    }

    fireEvent.click(boto);
    expect(boto.getAttribute('aria-expanded')).toBe('true');
    expect(boto.textContent).toBe('Plegar tot');
    for (const d of container.querySelectorAll('details')) {
      expect(d.open).toBe(true);
    }

    fireEvent.click(boto);
    expect(boto.getAttribute('aria-expanded')).toBe('false');
    expect(boto.textContent).toBe('Expandir tot');
  });

  test('una fitxa de versió concreta (v1.2.25) mostra abast, millores, correccions i navegació', () => {
    render(
      <MemoryRouter rutaInicial="/disseny?categoria=registre-de-canvis&item=registre-de-canvis-v1-2-25">
        <RegistreCanvisDisseny versioId="v1-2-25" llengua="en" />
      </MemoryRouter>
    );
    expect(screen.getByTestId('registre-canvis-v1-2-25')).toBeTruthy();
    expect(screen.getByText('Status and scope of this release')).toBeTruthy();
    expect(screen.getByRole('link', { name: /Previous release · v1\.2\.24/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Overview/ })).toBeTruthy();
  });

  test('la fitxa historic ofereix la càrrega diferida d’ArxiuHistoricVersions sense inflar l’arrencada', () => {
    render(
      <MemoryRouter rutaInicial="/disseny?categoria=registre-de-canvis&item=registre-de-canvis-historic">
        <RegistreCanvisDisseny versioId="historic" llengua="ca" />
      </MemoryRouter>
    );
    expect(screen.getByTestId('registre-canvis-historic')).toBeTruthy();
    expect(screen.getByTestId('versions-boto-arxiu-historic')).toBeTruthy();
  });
});
