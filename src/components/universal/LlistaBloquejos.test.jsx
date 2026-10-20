/* Fase D (261020, tasca 2; pla 261020_1300) · La llista de persones i
   entitats bloquejades, amb el valor de useModeracio simulat: una sola línia
   d'estat (sense ningú que mire, carregant, només la sessió, error), «No has
   bloquejat ningú» només quan se sap, una fila per bloqueig amb el nom (o
   «Sense nom») i «Desbloqueja», i el focus que passa a la fila següent. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CODI_MODERACIO, errorDeModeracio } from '../../data/contracte.js';
import { LlistaBloquejos } from './LlistaBloquejos.jsx';

afterEach(cleanup);

const PEPA = Object.freeze({ tipus: 'persona', id: 'pepa', nom: 'Pepa', creatAl: null });
const FORN = Object.freeze({ tipus: 'entitat', id: 'forn', nom: null, creatAl: null });
const valor = (mes = {}) => ({
  disponible: true, potBloquejar: true, estatBloquejos: 'llest', codiErrorBloquejos: null, bloquejats: [PEPA, FORN],
  desbloqueja: vi.fn().mockResolvedValue(undefined), ...mes
});

describe('l’estat', () => {
  test('sense proveïdor, res', () => {
    const { container } = render(<LlistaBloquejos moderacio={null} />);
    expect(container.childNodes).toHaveLength(0);
  });

  test('sense ningú que mire (un visitant del remot): entra al compte', () => {
    render(<LlistaBloquejos moderacio={valor({ potBloquejar: false })} />);
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('Persones i entitats bloquejades');
    expect(screen.getByRole('status').textContent).toBe('Entra al compte per a vore les persones que has bloquejat.');
    expect(screen.queryByRole('list')).toBeNull();
  });

  test('carregant: la línia, i ni llista ni «No has bloquejat ningú»', () => {
    render(<LlistaBloquejos moderacio={valor({ estatBloquejos: 'carregant', bloquejats: [] })} />);
    expect(screen.getByRole('status').textContent).toBe('Carregant els bloquejos…');
    expect(screen.queryByText('No has bloquejat ningú.')).toBeNull();
  });

  test('sense la migració: l’avís de la sessió, i els bloquejos de la sessió', () => {
    render(<LlistaBloquejos moderacio={valor({ estatBloquejos: 'error', codiErrorBloquejos: 'no-disponible', bloquejats: [PEPA] })} />);
    expect(screen.getByRole('status').textContent).toBe('Estos bloquejos només duren esta sessió: el servidor encara no els guarda.');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  test('una altra fallada: l’error, i mai «No has bloquejat ningú»', () => {
    render(<LlistaBloquejos moderacio={valor({ estatBloquejos: 'error', codiErrorBloquejos: 'desconegut', bloquejats: [] })} />);
    expect(screen.getByRole('alert').textContent).toBe('No s’han pogut carregar els bloquejos. Torna-ho a provar.');
    expect(screen.queryByText('No has bloquejat ningú.')).toBeNull();
  });

  test('llest i buit: «No has bloquejat ningú.»; sense títol amb ambTitol={false}', () => {
    render(<LlistaBloquejos moderacio={valor({ bloquejats: [] })} ambTitol={false} />);
    expect(screen.getByText('No has bloquejat ningú.')).toBeTruthy();
    expect(screen.queryByRole('heading')).toBeNull();
  });
});

describe('les files', () => {
  test('una per bloqueig, amb el nom o «Sense nom», i «Desbloqueja» amb el nom al nom accessible', () => {
    render(<LlistaBloquejos moderacio={valor()} />);
    const files = screen.getAllByRole('listitem');
    expect(files.map((fila) => fila.querySelector('.sdp-bloquejos__nom').textContent)).toEqual(['Pepa', 'Sense nom']);
    expect(screen.getByRole('button', { name: 'Desbloqueja Pepa' }).textContent).toBe('Desbloqueja');
    expect(screen.getByRole('button', { name: 'Desbloqueja Sense nom' })).toBeTruthy();
  });

  test('desbloquejar crida desbloqueja({ tipus, id, nom }) i el focus passa a la fila següent', async () => {
    const moderacio = valor();
    const vista = render(<LlistaBloquejos moderacio={moderacio} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Desbloqueja Pepa' })); });
    expect(moderacio.desbloqueja).toHaveBeenCalledWith({ tipus: 'persona', id: 'pepa', nom: 'Pepa' });
    /* El proveïdor ja l'ha llevada (la capa optimista). */
    vista.rerender(<LlistaBloquejos moderacio={{ ...moderacio, bloquejats: [FORN] }} />);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Desbloqueja Sense nom' }));
  });

  test('l’últim: el focus va a «No has bloquejat ningú.»', async () => {
    const moderacio = valor({ bloquejats: [PEPA] });
    const vista = render(<LlistaBloquejos moderacio={moderacio} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Desbloqueja Pepa' })); });
    vista.rerender(<LlistaBloquejos moderacio={{ ...moderacio, bloquejats: [] }} />);
    expect(document.activeElement).toBe(screen.getByText('No has bloquejat ningú.'));
  });

  test('si el servidor diu que no, l’error es diu en línia', async () => {
    const moderacio = valor({ desbloqueja: vi.fn().mockRejectedValue(errorDeModeracio(CODI_MODERACIO.LIMIT)) });
    render(<LlistaBloquejos moderacio={moderacio} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Desbloqueja Pepa' })); });
    expect(screen.getByRole('alert').textContent)
      .toBe('Has fet massa denúncies o bloquejos en poc de temps. Torna-ho a provar d’ací a una estona.');
  });
});
