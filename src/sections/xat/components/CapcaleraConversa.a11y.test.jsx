/**
 * CapcaleraConversa.a11y.test.jsx · Ronda 13 (T4 · Accessibilitat Rural AAA, Consola Zero i 5 llengües)
 *
 * Verifica sobre CapcaleraConversa:
 *   1. Navegació per teclat (Tab, Enter, Space, Escape) i retorn determinista
 *      del focus al botó d'opcions «⋯» en tancar el menú o triar una acció
 *      (mai a document.body).
 *   2. Enllaç canònic al perfil públic en converses d'entitat (`fake-entitat:*` ->
 *      `/empresa/...` o `/socdepoble`), de persona (`/javillinares`) i de la IAIA (`/iaia`).
 *   3. Mode selecció (`seleccio={{ quants, onEixir }}`) amb regió `aria-live="polite"`.
 *   4. Consola zero (`console.error` i `console.warn` a 0) i traducció completa
 *      en les 5 llengües oficials (`ca`, `es`, `en`, `eu`, `gl`).
 */

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../../app/contexts/RouterContext', () => ({
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));

import CapcaleraConversa from './CapcaleraConversa.jsx';
import CA from '../../../config/idiomes/ca.js';
import ES from '../../../config/idiomes/es.js';
import EN from '../../../config/idiomes/en.js';
import EU from '../../../config/idiomes/eu.js';
import GL from '../../../config/idiomes/gl.js';

const DICCIONARIS = Object.freeze({ ca: CA, es: ES, en: EN, eu: EU, gl: GL });
const traductorDe = (lang = 'ca') => (clau, reserva = '') => DICCIONARIS[lang]?.[clau] ?? reserva;

let spyError;
let spyWarn;

beforeEach(() => {
  spyError = vi.spyOn(console, 'error').mockImplementation(() => {});
  spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  expect(spyError).not.toHaveBeenCalled();
  expect(spyWarn).not.toHaveBeenCalled();
  spyError.mockRestore();
  spyWarn.mockRestore();
});

describe('CapcaleraConversa.a11y · Ronda 13 (WCAG 2.1.3 Teclat, Entitats, ARIA i 5 llengües)', () => {
  test('1. Converses d’entitat (fake-entitat:el-rentonar, oli-de-la-torre, socdepoble) i IAIA enllacen al perfil canònic amb atributs ARIA complets', () => {
    const casos = [
      {
        fil: {
          id: 'fake-entitat:el-rentonar',
          name: 'Associació El Rentonar',
          tipus: 'directe',
          comEntitat: true,
          entitatNom: 'Associació El Rentonar',
          altres: [{ id: 'el-rentonar', tipus: 'entitat', nom: 'Associació El Rentonar' }]
        },
        hrefEsperat: '/empresa/el-rentonar'
      },
      {
        fil: {
          id: 'fake-entitat:socdepoble',
          name: 'Sóc de Poble',
          tipus: 'directe',
          comEntitat: true,
          entitatNom: 'Sóc de Poble',
          altres: [{ id: 'socdepoble', tipus: 'entitat', nom: 'Sóc de Poble' }]
        },
        hrefEsperat: '/socdepoble'
      },
      {
        fil: {
          id: 'fake-iaia',
          name: 'IAIA MarIA',
          tipus: 'directe',
          esIA: true,
          altres: [{ id: 'iaia', tipus: 'iaia', nom: 'IAIA MarIA' }]
        },
        hrefEsperat: '/iaia'
      }
    ];

    for (const { fil, hrefEsperat } of casos) {
      const { container } = render(
        <CapcaleraConversa
          fil={fil}
          onTorna={vi.fn()}
          onSeleccionar={vi.fn()}
          t={traductorDe('ca')}
        />
      );
      const enllac = container.querySelector('a.sdp-xat-capcalera__enllac');
      expect(enllac).not.toBeNull();
      expect(enllac.getAttribute('href')).toBe(hrefEsperat);
      expect(enllac.getAttribute('aria-label')).toContain(fil.name);
      cleanup();
    }
  });

  test('2. Navegació per teclat al menú «⋯»: obertura, Escape i accions de moderació/silenci retornen sempre el focus al botó «⋯» (mai a document.body)', () => {
    const onSeleccionar = vi.fn();
    const onDenuncia = vi.fn();
    const onSilenci = vi.fn();

    render(
      <CapcaleraConversa
        fil={{
          id: 'fil-1',
          name: 'Pepa la Fornera',
          tipus: 'directe',
          altres: [{ id: 'pepa', tipus: 'persona', nom: 'Pepa la Fornera' }]
        }}
        nomContrapart="Pepa la Fornera"
        onTorna={vi.fn()}
        onSeleccionar={onSeleccionar}
        onDenunciaPersona={onDenuncia}
        accioSilenci={{ etiqueta: 'Silencia les notificacions', onTria: onSilenci }}
        t={traductorDe('ca')}
      />
    );

    const botoMenu = screen.getByRole('button', { name: 'Opcions de la conversa' });
    expect(botoMenu.getAttribute('aria-haspopup')).toBe('menu');
    expect(botoMenu.getAttribute('aria-expanded')).toBe('false');

    // Obrim el menú i comprovem aria-expanded="true"
    botoMenu.focus();
    fireEvent.click(botoMenu);
    expect(botoMenu.getAttribute('aria-expanded')).toBe('true');

    const menu = screen.getByRole('menu');
    expect(menu).not.toBeNull();
    const items = screen.getAllByRole('menuitem');
    expect(items.length).toBeGreaterThanOrEqual(3);

    // Premem Escape amb el focus dins d'un menuitem: el menú es tanca i el focus torna a botoMenu
    items[0].focus();
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(botoMenu);
    expect(document.activeElement).not.toBe(document.body);

    // Tornem a obrir i accionem «Denuncia Pepa la Fornera»
    fireEvent.click(botoMenu);
    const itemDenuncia = screen.getByRole('menuitem', { name: /Denuncia Pepa la Fornera/i });
    fireEvent.click(itemDenuncia);
    expect(onDenuncia).toHaveBeenCalledTimes(1);
    expect(onDenuncia).toHaveBeenCalledWith(botoMenu);
    expect(document.activeElement).toBe(botoMenu);
  });

  test('3. Fletxa de retorn a l’origen (onTornaAOrigen) visible en totes les amplàries i mode selecció amb aria-live="polite"', () => {
    const onTornaAOrigen = vi.fn();
    const onEixir = vi.fn();

    const { rerender } = render(
      <CapcaleraConversa
        fil={{ id: 'f1', name: 'Oli de La Torre', tipus: 'directe' }}
        onTorna={vi.fn()}
        onTornaAOrigen={onTornaAOrigen}
        onSeleccionar={vi.fn()}
        t={traductorDe('ca')}
      />
    );

    const botoOrigen = screen.getByRole('button', { name: 'Torna a la pàgina anterior' });
    expect(botoOrigen.classList.contains('d-mobile-only')).toBe(false);
    fireEvent.click(botoOrigen);
    expect(onTornaAOrigen).toHaveBeenCalledTimes(1);

    rerender(
      <CapcaleraConversa
        fil={{ id: 'f1', name: 'Oli de La Torre', tipus: 'directe' }}
        onTorna={vi.fn()}
        onSeleccionar={vi.fn()}
        seleccio={{ quants: 3, onEixir }}
        t={traductorDe('ca')}
      />
    );

    const infoSeleccio = screen.getByText('3 triats');
    expect(infoSeleccio.getAttribute('aria-live')).toBe('polite');
    fireEvent.click(screen.getByRole('button', { name: 'Eixir de la selecció' }));
    expect(onEixir).toHaveBeenCalledTimes(1);
  });

  test('4. Renderitza i tradueix totes les etiquetes accessibles en les 5 llengües oficials (ca, es, en, eu, gl) sense cadenes buides', () => {
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      const t = traductorDe(lang);
      const { container } = render(
        <CapcaleraConversa
          fil={{
            id: 'fil-poble',
            name: 'Gent de la Torre',
            tipus: 'grup',
            participants: 12,
            subjecte: { titol: 'La Torre de les Maçanes', ruta: '/pobles/la-torre-de-les-macanes' }
          }}
          onTorna={vi.fn()}
          onSeleccionar={vi.fn()}
          t={t}
        />
      );

      const enllacPagina = container.querySelector('a.sdp-xat-capcalera__enllac');
      expect(enllacPagina).not.toBeNull();
      expect(enllacPagina.getAttribute('href')).toBe('/pobles/la-torre-de-les-macanes');
      expect(enllacPagina.getAttribute('aria-label')?.trim().length).toBeGreaterThan(0);

      const botoOpcions = container.querySelector('.sdp-xat-capcalera__menu button');
      expect(botoOpcions?.getAttribute('aria-label')?.trim().length).toBeGreaterThan(0);
      fireEvent.click(botoOpcions);
      const menuItem = screen.getByRole('menuitem');
      expect(menuItem.textContent.trim().length).toBeGreaterThan(0);

      cleanup();
    }
  });

  /* Gauntlet R21 (regressio_ui_xat-03, versions_i_portes-01) · L'encapçalament de
     nivell 1 és un <strong> amb role="heading": cap element H1 (base.css el centrava
     i la Regla de les Capçaleres només l'admet dins de header.page-title). */
  test('5. R21-GC-04 · Exposa exactament un encapçalament de nivell 1 amb el nom de la conversa (normal i selecció), sense cap element H1, mantenint el botó enrere com a primer fill', () => {
    const fil = { id: 'fake-iaia', name: 'IAIA MarIA', tipus: 'ia', esIA: true };
    const { container, rerender } = render(
      <CapcaleraConversa fil={fil} onTorna={vi.fn()} onSeleccionar={vi.fn()} t={traductorDe('ca')} />
    );
    const h1Normal = screen.getAllByRole('heading', { level: 1 });
    expect(h1Normal).toHaveLength(1);
    expect(h1Normal[0].textContent).toBe('IAIA MarIA');
    expect(h1Normal[0].tagName).toBe('STRONG');
    expect(h1Normal[0].classList.contains('sdp-xat-capcalera__nom')).toBe(true);
    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('header.sdp-xat-capcalera > button:first-child')).not.toBeNull();

    rerender(
      <CapcaleraConversa
        fil={fil}
        seleccio={{ quants: 2, onEixir: vi.fn() }}
        t={traductorDe('ca')}
      />
    );
    const h1Seleccio = screen.getAllByRole('heading', { level: 1 });
    expect(h1Seleccio).toHaveLength(1);
    expect(h1Seleccio[0].textContent).toBe('IAIA MarIA');
    expect(h1Seleccio[0].classList.contains('sdp-sr-only')).toBe(true);
    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('header.sdp-xat-capcalera > button:first-child')).not.toBeNull();
  });

  /* Gauntlet R21 (regressio_ui_xat-07) · Fora de la vista del xat (l'espècimen del
     catàleg), `nivellTitol` baixa l'encapçalament: cap nivell 1 de més a la pàgina. */
  test('6. nivellTitol: 5 el baixa a nivell 5 (normal i selecció); null el deixa sense encapçalament; un valor fora de rang, també', () => {
    const fil = { id: 'g-festa', name: 'Festa major', tipus: 'grup', altresNoms: ['Pepa', 'Vicent'] };
    const { container, rerender } = render(
      <CapcaleraConversa fil={fil} nivellTitol={5} onTorna={vi.fn()} onSeleccionar={vi.fn()} t={traductorDe('ca')} />
    );
    expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 5 }).textContent).toBe('Festa major');

    rerender(<CapcaleraConversa fil={fil} nivellTitol={5} seleccio={{ quants: 0, onEixir: vi.fn() }} t={traductorDe('ca')} />);
    expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 5 }).textContent).toBe('Festa major');

    for (const nivell of [null, 0, 7, '1']) {
      rerender(<CapcaleraConversa fil={fil} nivellTitol={nivell} onTorna={vi.fn()} onSeleccionar={vi.fn()} t={traductorDe('ca')} />);
      expect([nivell, screen.queryAllByRole('heading')]).toEqual([nivell, []]);
      expect([nivell, container.querySelector('strong.sdp-xat-capcalera__nom')?.textContent]).toEqual([nivell, 'Festa major']);
    }
  });
});
