import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Coffee } from 'lucide-react';
import { MemoryRouter, useLocation } from '../../../app/contexts/RouterContext.jsx';
import { LiniaDelTemps } from './LiniaDelTemps.jsx';

afterEach(cleanup);

const APUNTS = [
  { id: 'a-1', hora: '07:30', titol: 'Obri el torn', detall: 'Fons de 100,00 €', icona: Coffee },
  { id: 'a-2', hora: '09:05', titol: 'Comanda de la barra' },
  { id: 'a-3', hora: 'ahir', moment: '2026-10-01T23:10', titol: 'Tancament' }
];

function Ruta() {
  const { pathname, search } = useLocation();
  return <p data-testid="ruta">{`${pathname}${search}`}</p>;
}

describe('LiniaDelTemps', () => {
  test('una llista ordenada amb nom; cada apunt, la seua hora i el seu títol', () => {
    const { container } = render(<LiniaDelTemps apunts={APUNTS} etiqueta="Torn de hui" />);
    const llista = screen.getByRole('list', { name: 'Torn de hui' });
    expect(llista.tagName).toBe('OL');
    const items = within(llista).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    const hores = [...container.querySelectorAll('time.sdp-linia-temps__hora')];
    expect(hores.map((t) => [t.textContent, t.getAttribute('datetime')])).toEqual([
      ['07:30', '07:30'], ['09:05', '09:05'], ['ahir', '2026-10-01T23:10']
    ]);
    expect(items[0].textContent).toContain('Fons de 100,00 €');
    expect(items[0].querySelector('svg.lucide-coffee')).not.toBeNull();
    expect(container.querySelector('[style]')).toBeNull();
  });

  test('sense ruta ni onTria, text quiet: cap botó ni enllaç', () => {
    render(<LiniaDelTemps apunts={APUNTS} etiqueta="Torn" />);
    expect(screen.queryAllByRole('button')).toEqual([]);
    expect(screen.queryAllByRole('link')).toEqual([]);
  });

  test('amb onTria, botons amb l’hora dins del nom i aria-current a l’apunt triat', () => {
    const tria = vi.fn();
    render(<LiniaDelTemps apunts={APUNTS} etiqueta="Torn" onTria={tria} seleccionat="a-2" />);
    const boto = screen.getByRole('button', { name: /^09:05: Comanda de la barra/ });
    expect(boto.getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('button', { name: /^07:30: Obri el torn/ }).hasAttribute('aria-current')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /^07:30: Obri el torn/ }));
    expect(tria).toHaveBeenCalledWith('a-1');
  });

  test('amb ruta, enllaços del router propi: la tria viu a la URL', () => {
    const ambRuta = APUNTS.map((apunt) => ({ ...apunt, ruta: `/registre/2026-10-02/${apunt.id}` }));
    render(
      <MemoryRouter rutaInicial="/registre/2026-10-02">
        <LiniaDelTemps apunts={ambRuta} etiqueta="Jornada" seleccionat="a-3" />
        <Ruta />
      </MemoryRouter>
    );
    const enllac = screen.getByRole('link', { name: /^09:05: Comanda de la barra/ });
    expect(enllac.getAttribute('href')).toBe('/registre/2026-10-02/a-2');
    expect(screen.getByRole('link', { name: /^ahir: Tancament/ }).getAttribute('aria-current')).toBe('true');
    fireEvent.click(enllac);
    expect(screen.getByTestId('ruta').textContent).toBe('/registre/2026-10-02/a-2');
  });

  test('sense apunts, l’estat buit de Pedra Seca amb el text que es passa', () => {
    const { container } = render(<LiniaDelTemps apunts={[]} etiqueta="Torn" buit="Encara no has apuntat res hui." />);
    expect(container.querySelector('.sdp-buit')).not.toBeNull();
    expect(screen.getByText('Encara no has apuntat res hui.')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });
});
