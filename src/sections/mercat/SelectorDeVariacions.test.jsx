/**
 * Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 1) · El selector
 * compacte de variants: píndoles amb role="radiogroup" accessible. Ràdios
 * natius dins d'un fieldset amb llegenda (les fletxes les mou el navegador:
 * el mateix name, cap tabindex ni teclat a mida), el valor és la clau estable
 * i una variació esgotada es marca però es pot triar.
 */
import React from 'react';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { SelectorDeVariacions } from './SelectorDeVariacions.jsx';

const OPCIONS = [
  { valor: 'gris-plom', etiqueta: 'Edició Gris Plom' },
  { valor: 'verda-pi', etiqueta: 'Edició Verda', esgotada: true },
  { valor: 'llegat:2', etiqueta: 'Blanca' }
];
const pinta = (props) => render(<SelectorDeVariacions llegenda="Tria la variant" opcions={OPCIONS} valor="gris-plom" {...props} />);

afterEach(cleanup);

describe('SelectorDeVariacions', () => {
  test('un fieldset amb role="radiogroup", amb nom de la seua llegenda', () => {
    const { container } = pinta();
    const grup = within(container).getByRole('radiogroup', { name: 'Tria la variant' });
    expect(grup.tagName).toBe('FIELDSET');
    expect(grup.getAttribute('aria-labelledby')).toBe(grup.querySelector('legend').id);
  });

  test('un ràdio natiu per opció, amb el mateix name, el valor de l’opció i el seu label', () => {
    const { container } = pinta();
    const radios = within(container).getAllByRole('radio');
    expect(radios.map((radio) => radio.value)).toEqual(['gris-plom', 'verda-pi', 'llegat:2']);
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
    expect(radios.every((radio) => radio.type === 'radio' && !radio.hasAttribute('tabindex'))).toBe(true);
    expect(radios.map((radio) => radio.labels.length)).toEqual([1, 1, 1]);
    expect(new Set(radios.map((radio) => radio.id)).size).toBe(3);
    expect(radios.map((radio) => radio.checked)).toEqual([true, false, false]);
  });

  test('l’esgotada es marca (classe i Insignia dins del nom) i no es desactiva', () => {
    const { container } = pinta();
    const verda = within(container).getByRole('radio', { name: 'Edició Verda Esgotat' });
    expect(verda.disabled).toBe(false);
    expect(verda.closest('.sdp-variant').className).toBe('sdp-variant sdp-variant--esgotada');
    expect(verda.labels[0].querySelector('.sdp-insignia.sdp-insignia--avis.sdp-variant__estat').textContent).toBe('Esgotat');
    expect(container.querySelectorAll('.sdp-insignia')).toHaveLength(1);
  });

  test('triar una opció crida onCanvi amb el seu valor; és controlat', () => {
    const onCanvi = vi.fn();
    const { container, rerender } = pinta({ onCanvi });
    fireEvent.click(within(container).getByRole('radio', { name: 'Blanca' }));
    expect(onCanvi).toHaveBeenCalledWith('llegat:2');
    rerender(<SelectorDeVariacions llegenda="Tria la variant" opcions={OPCIONS} valor="verda-pi" onCanvi={onCanvi} />);
    expect(within(container).getAllByRole('radio').map((radio) => radio.checked)).toEqual([false, true, false]);
  });

  test('el text de la insígnia arriba traduït', () => {
    const { container } = pinta({ textEsgotat: 'Sold out' });
    expect(within(container).getByRole('radio', { name: 'Edició Verda Sold out' })).toBeTruthy();
  });

  test('dos selectors a la mateixa pàgina no compartixen el grup', () => {
    const { container } = render(
      <>
        <SelectorDeVariacions llegenda="A" opcions={OPCIONS} valor="gris-plom" />
        <SelectorDeVariacions llegenda="B" opcions={OPCIONS} valor="verda-pi" />
      </>
    );
    const noms = within(container).getAllByRole('radio').map((radio) => radio.name);
    expect(new Set(noms).size).toBe(2);
    expect(within(container).getAllByRole('radio').filter((radio) => radio.checked)).toHaveLength(2);
  });

  test('sense onCanvi no peta', () => {
    const { container } = render(<SelectorDeVariacions llegenda="A" opcions={OPCIONS} valor="gris-plom" />);
    expect(() => fireEvent.click(within(container).getByRole('radio', { name: 'Blanca' }))).not.toThrow();
  });
});
