/* P1-12 pas 17 (pla 261101_1246, T7 · S5) · L'entrada «Xifratge i número de
   seguretat» del menú «⋯». Sense accioXifratge (la bandera E2EE apagada, a
   producció), el menú de sempre, element a element (Llei del Píxel). Amb ella,
   l'entrada va just darrere de «Seleccionar missatges», tanca el menú, torna el
   focus al «⋯» (el diàleg el pren per obridor) i li'l passa. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createTranslator } from '../../../config/i18n.js';
import CapcaleraConversa from './CapcaleraConversa.jsx';

vi.mock('../../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return { Link: ({ to, children, ...rest }) => createElement('a', { href: to, ...rest }, children) };
});

afterEach(cleanup);

const ca = createTranslator('ca');
const FIL = { id: 'd-pepa', tipus: 'directe', name: 'Pepa', altres: [{ id: 'P', tipus: 'persona', nom: 'Pepa' }], altresNoms: ['Pepa'] };
const obriMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Opcions de la conversa' }));
const etiquetes = () => screen.getAllByRole('menuitem').map((item) => item.textContent);

describe('sense accioXifratge: el menú de sempre', () => {
  test('les mateixes entrades i el mateix DOM del menú', () => {
    const { container } = render(<CapcaleraConversa fil={FIL} onTorna={() => {}} onSeleccionar={() => {}} t={ca} nomContrapart="Pepa" onDenunciaPersona={() => {}} />);
    obriMenu();
    expect(etiquetes()).toEqual(['Seleccionar missatges', 'Denuncia Pepa']);
    expect(container.querySelector('.sdp-xat-menu').outerHTML).toBe(
      '<div class="sdp-xat-menu" role="menu"><button type="button" role="menuitem" class="sdp-xat-menu__item">Seleccionar missatges</button>'
      + '<button type="button" role="menuitem" class="sdp-xat-menu__item">Denuncia Pepa</button></div>'
    );
  });

  test('una accioXifratge sense funció o sense etiqueta no pinta res', () => {
    render(<CapcaleraConversa fil={FIL} onTorna={() => {}} onSeleccionar={() => {}} t={ca} accioXifratge={{ etiqueta: 'Xifratge', onTria: null }} />);
    obriMenu();
    expect(etiquetes()).toEqual(['Seleccionar missatges']);
    cleanup();
    render(<CapcaleraConversa fil={FIL} onTorna={() => {}} onSeleccionar={() => {}} t={ca} accioXifratge={{ etiqueta: '', onTria: () => {} }} />);
    obriMenu();
    expect(etiquetes()).toEqual(['Seleccionar missatges']);
  });
});

describe('amb accioXifratge', () => {
  test('just darrere de «Seleccionar missatges»: tanca el menú, torna el focus al «⋯» i li’l passa', () => {
    const onTria = vi.fn();
    render(
      <CapcaleraConversa fil={FIL} onTorna={() => {}} onSeleccionar={() => {}} t={ca} nomContrapart="Pepa"
        onDenunciaPersona={() => {}} onBloqueja={() => {}}
        accioXifratge={{ etiqueta: 'Xifratge i número de seguretat', onTria }} />
    );
    obriMenu();
    expect(etiquetes()).toEqual(['Seleccionar missatges', 'Xifratge i número de seguretat', 'Denuncia Pepa', 'Bloqueja Pepa']);
    const opcions = screen.getByRole('button', { name: 'Opcions de la conversa' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Xifratge i número de seguretat' }));
    expect(onTria).toHaveBeenCalledTimes(1);
    expect(onTria).toHaveBeenCalledWith(opcions);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(opcions);
    expect(opcions.getAttribute('aria-expanded')).toBe('false');
  });
});
