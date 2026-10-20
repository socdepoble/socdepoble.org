/* Fase D (261020, tasca 2; pla 261020_1300) · «Més opcions» (⋮) de la boina:
   el botó diu que obri un menú, les files són exactament les que pertoquen
   (denunciar sempre; bloquejar només amb permís i un nom), el comportament és
   el de tots els menús emergents (Escape torna el focus al ⋮, una tria el
   tanca, li torna el focus i el passa a onTria) i la mostra del catàleg no
   furta el focus. Sense traductor, la reserva en valencià. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { BotoModeracio, MenuModeracio } from './Moderacio.jsx';

afterEach(cleanup);

const files = () => screen.getAllByRole('menuitem').map((fila) => fila.textContent);
const obri = () => {
  const boto = screen.getByRole('button', { name: 'Més opcions: Fira de tardor' });
  act(() => { fireEvent.click(boto); });
  return boto;
};

describe('BotoModeracio', () => {
  test('tancat, només el ⋮ amb el títol al nom accessible, i diu que obri un menú', () => {
    const { container } = render(<BotoModeracio titol="Fira de tardor" onTria={vi.fn()} />);
    const boto = screen.getByRole('button', { name: 'Més opcions: Fira de tardor' });
    expect(boto.getAttribute('aria-haspopup')).toBe('menu');
    expect(boto.getAttribute('aria-expanded')).toBe('false');
    expect(boto.className).toBe('btn-icon-orange');
    expect(container.querySelector('[role="menu"]')).toBeNull();
    expect(container.firstChild.className).toBe('sdp-moderacio');
  });

  test('sense permís de bloquejar, una sola fila: «Denuncia el contingut»', () => {
    render(<BotoModeracio titol="Fira de tardor" nomAutor="Pepa" onTria={vi.fn()} />);
    const boto = obri();
    expect(boto.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('menu', { name: 'Opcions del contingut' })).toBeTruthy();
    expect(files()).toEqual(['Denuncia el contingut']);
    /* El focus entra a la primera fila (useMenuEmergent). */
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Denuncia el contingut' }));
  });

  test('amb permís i un nom, també «Bloqueja Pepa»; sense nom, no', () => {
    render(<BotoModeracio titol="Fira de tardor" nomAutor="Pepa" potBloquejar onTria={vi.fn()} />);
    obri();
    expect(files()).toEqual(['Denuncia el contingut', 'Bloqueja Pepa']);
    cleanup();
    render(<BotoModeracio titol="Fira de tardor" nomAutor="  " potBloquejar onTria={vi.fn()} />);
    obri();
    expect(files()).toEqual(['Denuncia el contingut']);
  });

  test('un perfil diu «Denuncia {nom}» i un nom amb «$&» es pinta tal qual', () => {
    render(<BotoModeracio titol="Fira de tardor" nomAutor="Pep $& Co" tipusObjectiu="persona" potBloquejar onTria={vi.fn()} />);
    obri();
    expect(files()).toEqual(['Denuncia Pep $& Co', 'Bloqueja Pep $& Co']);
  });

  test('una tria tanca el menú, torna el focus al ⋮ i crida onTria(via, boto)', () => {
    const onTria = vi.fn();
    render(<BotoModeracio titol="Fira de tardor" nomAutor="Pepa" potBloquejar onTria={onTria} />);
    const boto = obri();
    act(() => { fireEvent.click(screen.getByRole('menuitem', { name: 'Bloqueja Pepa' })); });
    expect(onTria).toHaveBeenCalledWith('bloqueja', boto);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(boto);
    obri();
    act(() => { fireEvent.click(screen.getByRole('menuitem', { name: 'Denuncia el contingut' })); });
    expect(onTria).toHaveBeenLastCalledWith('denuncia', boto);
  });

  test('Escape tanca el menú, queda consumit (preventDefault) i torna el focus al ⋮', () => {
    render(<BotoModeracio titol="Fira de tardor" onTria={vi.fn()} />);
    const boto = obri();
    let consumit = false;
    act(() => { consumit = !fireEvent.keyDown(screen.getByRole('menuitem'), { key: 'Escape' }); });
    expect(consumit).toBe(true);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(boto);
  });

  test('les fletxes mouen el focus per les files', () => {
    render(<BotoModeracio titol="Fira de tardor" nomAutor="Pepa" potBloquejar onTria={vi.fn()} />);
    obri();
    act(() => { fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' }); });
    expect(document.activeElement.textContent).toBe('Bloqueja Pepa');
    act(() => { fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' }); });
    expect(document.activeElement.textContent).toBe('Denuncia el contingut');
  });
});

describe('MenuModeracio · mostra (el catàleg)', () => {
  test('obert i quiet: no furta el focus i no tria', () => {
    const onTria = vi.fn();
    const abans = document.activeElement;
    render(<MenuModeracio potBloquejar nomAutor="Pepa" onTria={onTria} onTanca={vi.fn()} mostra />);
    expect(document.activeElement).toBe(abans);
    expect(files()).toEqual(['Denuncia el contingut', 'Bloqueja Pepa']);
    act(() => { fireEvent.click(screen.getByRole('menuitem', { name: 'Bloqueja Pepa' })); });
    expect(onTria).not.toHaveBeenCalled();
  });

  test('un missatge diu «Denuncia el missatge»', () => {
    render(<MenuModeracio tipusObjectiu="missatge" onTria={vi.fn()} onTanca={vi.fn()} mostra />);
    expect(files()).toEqual(['Denuncia el missatge']);
  });
});
