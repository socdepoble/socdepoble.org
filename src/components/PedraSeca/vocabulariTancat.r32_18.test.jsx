import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { Superficie } from './composicio/index.jsx';
import { Accordion, AccordionItem } from './organismes/Accordion.jsx';
import AppGridColumn from '../layout/AppGridColumn.jsx';

afterEach(cleanup);

// Els mapes de producció són constants locals dels mòduls: la Porta Catàleg
// (C1) llegiria qualsevol `export const` en majúscules d'un .jsx de PedraSeca
// com un component. La prova fixa ací, en literal, les classes esperades.
const OMBRA_ESPERADA = { 1: 'sdp-ombra-1', 2: 'sdp-ombra-2', 3: 'sdp-ombra-3' };
const RADI_ESPERAT = { s: 'sdp-radi-s', m: 'sdp-radi-m', g: 'sdp-radi-g', pastilla: 'sdp-radi-pastilla' };

describe('R32.18 · Mapes literals tancats (zero classe-opaca)', () => {
  test('Superficie resol totes les combinacions d’elevació (1..3) i radi (s, m, g, pastilla) des de mapes congelats', () => {
    for (const [eleva, classeOmbra] of Object.entries(OMBRA_ESPERADA)) {
      for (const [radi, classeRadi] of Object.entries(RADI_ESPERAT)) {
        const { container, unmount } = render(
          <Superficie eleva={Number(eleva)} radi={radi} data-testid="sup">Contingut</Superficie>
        );
        const node = container.firstElementChild;
        expect(node.classList.contains('sdp-superficie')).toBe(true);
        expect(node.classList.contains(classeOmbra)).toBe(true);
        expect(node.classList.contains(classeRadi)).toBe(true);
        expect(node.classList).toHaveLength(3);
        unmount();
      }
    }
  });

  test('AccordionItem commuta la fletxa entre les dues entrades del mapa congelat', () => {
    const { container } = render(
      <Accordion>
        <AccordionItem title="Pregunta freqüent">Resposta clara</AccordionItem>
      </Accordion>
    );
    const boto = screen.getByRole('button', { name: 'Pregunta freqüent' });
    const fletxa = container.querySelector('svg');
    expect(fletxa.getAttribute('class')).toBe('accordion-item__fletxa');
    fireEvent.click(boto);
    expect(fletxa.getAttribute('class')).toBe('accordion-item__fletxa accordion-item__fletxa--obert');
  });

  test('Superficie no inventa classes per a valors fora dels mapes', () => {
    const { container } = render(<Superficie eleva={9} radi="xl">Contingut</Superficie>);
    expect(container.firstElementChild.className).toBe('sdp-superficie');
  });

  test('AppGridColumn conserva exactament les 6 combinacions de capçalera oberta (acordió × crom fosc)', () => {
    const casos = [
      [{ esDark: false }, 'app-grid-col-header'],
      [{ esDark: true }, 'app-grid-col-header app-grid-col-header--dark'],
      [{ esDark: 'intens' }, 'app-grid-col-header app-grid-col-header--dark-intens'],
      [{ variant: 'accordion', esDark: false }, 'app-grid-col-header app-grid-col-header--accordion'],
      [{ variant: 'accordion', esDark: true }, 'app-grid-col-header app-grid-col-header--accordion app-grid-col-header--dark'],
      [{ variant: 'accordion', esDark: 'intens' }, 'app-grid-col-header app-grid-col-header--accordion app-grid-col-header--dark-intens'],
    ];

    for (const [props, esperat] of casos) {
      const { container, unmount } = render(<AppGridColumn titol="Columna" {...props} />);
      expect(container.firstElementChild.className).toBe(esperat);
      unmount();
    }
  });
});
