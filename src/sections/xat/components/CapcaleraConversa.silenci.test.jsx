/* B8C-5 (marató 261101_2143; B8-CLIENT §5.1) · L'entrada del silenci al menú
   «⋯» de la conversa. Sense accioSilenci, el menú de sempre, element a element
   (Llei del Píxel). Amb ella, va darrere de «Xifratge i número de seguretat» (si
   hi és) i davant de la moderació, tanca el menú, torna el focus al «⋯» i li'l
   passa. */
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
const base = { fil: FIL, onTorna: () => {}, onSeleccionar: () => {}, t: ca };

describe('sense accioSilenci: el menú de sempre', () => {
  test('el mateix DOM del menú que abans del silenci', () => {
    const { container } = render(<CapcaleraConversa {...base} nomContrapart="Pepa" onDenunciaPersona={() => {}} onBloqueja={() => {}} />);
    obriMenu();
    expect(etiquetes()).toEqual(['Seleccionar missatges', 'Denuncia Pepa', 'Bloqueja Pepa']);
    expect(container.querySelector('.sdp-xat-menu').outerHTML).toBe(
      '<div class="sdp-xat-menu" role="menu"><button type="button" role="menuitem" class="sdp-xat-menu__item">Seleccionar missatges</button>'
      + '<button type="button" role="menuitem" class="sdp-xat-menu__item">Denuncia Pepa</button>'
      + '<button type="button" role="menuitem" class="sdp-xat-menu__item">Bloqueja Pepa</button></div>'
    );
  });

  test('una accioSilenci sense funció o sense etiqueta no pinta res', () => {
    render(<CapcaleraConversa {...base} accioSilenci={{ etiqueta: 'Silencia les notificacions', onTria: null }} />);
    obriMenu();
    expect(etiquetes()).toEqual(['Seleccionar missatges']);
    cleanup();
    render(<CapcaleraConversa {...base} accioSilenci={{ etiqueta: '', onTria: () => {} }} />);
    obriMenu();
    expect(etiquetes()).toEqual(['Seleccionar missatges']);
  });
});

describe('amb accioSilenci', () => {
  test('darrere del xifratge i davant de la moderació: tanca el menú, torna el focus al «⋯» i li’l passa', () => {
    const onTria = vi.fn();
    const onXifratge = vi.fn();
    render(
      <CapcaleraConversa {...base} nomContrapart="Pepa" onDenunciaPersona={() => {}} onBloqueja={() => {}}
        accioXifratge={{ etiqueta: 'Xifratge i número de seguretat', onTria: onXifratge }}
        accioSilenci={{ etiqueta: 'Silencia les notificacions', onTria }} />
    );
    obriMenu();
    expect(etiquetes()).toEqual(['Seleccionar missatges', 'Xifratge i número de seguretat', 'Silencia les notificacions', 'Denuncia Pepa', 'Bloqueja Pepa']);
    const opcions = screen.getByRole('button', { name: 'Opcions de la conversa' });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Silencia les notificacions' }));
    expect(onTria).toHaveBeenCalledTimes(1);
    expect(onTria).toHaveBeenCalledWith(opcions);
    expect(onXifratge).not.toHaveBeenCalled();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(opcions);
    expect(opcions.getAttribute('aria-expanded')).toBe('false');
  });

  test('sense xifratge (la bandera E2EE apagada), just darrere de «Seleccionar missatges»', () => {
    render(<CapcaleraConversa {...base} nomContrapart="Pepa" onDesbloqueja={() => {}} accioSilenci={{ etiqueta: 'Deixa de silenciar', onTria: () => {} }} />);
    obriMenu();
    expect(etiquetes()).toEqual(['Seleccionar missatges', 'Deixa de silenciar', 'Desbloqueja Pepa']);
  });

  test('en mode de selecció no hi ha menú', () => {
    render(<CapcaleraConversa {...base} seleccio={{ quants: 0, onEixir: () => {} }} accioSilenci={{ etiqueta: 'Silencia les notificacions', onTria: () => {} }} />);
    expect(screen.queryByRole('button', { name: 'Opcions de la conversa' })).toBeNull();
  });
});
