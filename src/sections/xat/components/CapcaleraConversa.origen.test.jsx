/* Ordre del Mestre (261021, pla 261021_0015 §8.5) · La fletxa de la capçalera
   de la conversa. Sense origen, la de sempre, píxel a píxel (Llei del Píxel):
   només en estret (d-mobile-only), «Torna a la llista» i onTorna. Amb origen
   (onTornaAOrigen), la mateixa fletxa a totes les amplàries (sense
   d-mobile-only), amb el seu nom en les cinc llengües i cap a l'origen. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../config/i18n.js';
import CapcaleraConversa from './CapcaleraConversa.jsx';

vi.mock('../../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return { Link: ({ to, children, ...rest }) => createElement('a', { href: to, ...rest }, children) };
});

afterEach(cleanup);

const ca = createTranslator('ca');
const FIL = { id: 'd-pepa', tipus: 'directe', name: 'Pepa', altres: [{ id: 'P', tipus: 'persona', nom: 'Pepa' }], altresNoms: ['Pepa'] };
const fletxa = (container) => container.querySelector('header.sdp-xat-capcalera > button:first-child');

describe('sense origen: la fletxa de sempre', () => {
  test('només en estret, cap a la llista, amb el mateix DOM', () => {
    const onTorna = vi.fn();
    const { container } = render(<CapcaleraConversa fil={FIL} onTorna={onTorna} onSeleccionar={() => {}} t={ca} />);
    const boto = fletxa(container);
    expect(boto.getAttribute('class')).toBe('sdp-xat-icona d-mobile-only');
    expect(boto.getAttribute('aria-label')).toBe('Torna a la llista');
    expect(boto.getAttribute('type')).toBe('button');
    expect(boto.querySelector('svg')).toBeTruthy();
    fireEvent.click(boto);
    expect(onTorna).toHaveBeenCalledTimes(1);
  });

  test('un onTornaAOrigen que no és una funció no canvia res', () => {
    const { container } = render(<CapcaleraConversa fil={FIL} onTorna={() => {}} onTornaAOrigen="/iaia" t={ca} />);
    expect(fletxa(container).getAttribute('class')).toBe('sdp-xat-icona d-mobile-only');
    expect(container.querySelectorAll('header.sdp-xat-capcalera > button')).toHaveLength(1);
  });
});

describe('amb origen: la fletxa torna a la pàgina d’on s’ha entrat', () => {
  test('a totes les amplàries (sense d-mobile-only), amb el seu nom i cap a l’origen', () => {
    const onTorna = vi.fn();
    const onTornaAOrigen = vi.fn();
    const { container } = render(
      <CapcaleraConversa fil={FIL} onTorna={onTorna} onTornaAOrigen={onTornaAOrigen} onSeleccionar={() => {}} t={ca} />
    );
    const boto = screen.getByRole('button', { name: 'Torna a la pàgina anterior' });
    expect(boto).toBe(fletxa(container));
    expect(boto.getAttribute('class')).toBe('sdp-xat-icona');
    expect(boto.querySelector('svg')).toBeTruthy();
    /* Una sola fletxa: cap «Torna a la llista» amagada al costat. */
    expect(screen.queryByRole('button', { name: 'Torna a la llista' })).toBeNull();
    expect(container.querySelectorAll('.d-mobile-only')).toHaveLength(0);
    fireEvent.click(boto);
    expect(onTornaAOrigen).toHaveBeenCalledTimes(1);
    expect(onTorna).not.toHaveBeenCalled();
    /* La resta de la capçalera, com sempre: el perfil i el menú «⋯». */
    expect(container.querySelector('a.sdp-xat-capcalera__enllac')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Opcions de la conversa' })).toBeTruthy();
  });

  test('el nom de la fletxa, en les cinc llengües', () => {
    const noms = {};
    for (const codi of ['ca', 'es', 'en', 'eu', 'gl']) {
      const { container } = render(<CapcaleraConversa fil={FIL} onTorna={() => {}} onTornaAOrigen={() => {}} t={createTranslator(codi)} />);
      noms[codi] = fletxa(container).getAttribute('aria-label');
      cleanup();
    }
    expect(noms).toEqual({
      ca: 'Torna a la pàgina anterior',
      es: 'Volver a la página anterior',
      en: 'Back to the previous page',
      eu: 'Itzuli aurreko orrira',
      gl: 'Voltar á páxina anterior'
    });
  });

  test('en mode de selecció, la barra de la tria de sempre: cap fletxa', () => {
    render(<CapcaleraConversa fil={FIL} onTorna={() => {}} onTornaAOrigen={() => {}} seleccio={{ quants: 0, onEixir: () => {} }} t={ca} />);
    expect(screen.queryByRole('button', { name: 'Torna a la pàgina anterior' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Eixir de la selecció' })).toBeTruthy();
  });
});
