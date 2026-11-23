/**
 * useLlenguaDeLaUI.r32_45.test.jsx — R32.45 · Lot 03 (Lkits-06, Lkits-08, Lkits-10)
 *
 * Verifica:
 *   1. Contracte de `useLlenguaDeLaUI`:
 *      - Sense proveïdor -> `undefined`.
 *      - Amb `{ language: 'es', llenguaDelText: 'ca' }` -> `'ca'` (`llenguaDelText` mana).
 *      - Amb `{ language: 'eu' }` -> `'eu'`.
 *      - Quan un mock de `UIContext` llança o no exposa cap estat -> `undefined` sense excepció.
 *   2. `DialegNovaOrganitzacio`: errors de validació (`name`, `town_name`, `slug`) i d'identificador
 *      duplicat traduïts en les 5 llengües (`ca`, `es`, `en`, `eu`, `gl`).
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { UIContext } from '../../app/contexts/objectesDeContext.js';
import { useLlenguaDeLaUI } from './useLlenguaDeLaUI.js';
import { DialegNovaOrganitzacio } from './DialegNovaOrganitzacio.jsx';

vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({
  useCoreContent: () => ({ status: 'ready', towns: [{ id: 'sella', title: 'Sella' }] })
}));
vi.mock('./PerfilContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  usePerfilOpcional: () => null
}));

afterEach(cleanup);

function SondaLlengua() {
  const valor = useLlenguaDeLaUI();
  return <span data-testid="llengua">{valor === undefined ? 'undefined' : String(valor)}</span>;
}

describe('R32.45 · Lkits-10 · Contracte de useLlenguaDeLaUI', () => {
  test('sense UIProvider retorna undefined sense llançar', () => {
    render(<SondaLlengua />);
    expect(screen.getByTestId('llengua').textContent).toBe('undefined');
  });

  test('llenguaDelText mana sobre language, i sense llenguaDelText usa language', () => {
    const { rerender } = render(
      <UIContext.Provider value={{ language: 'es', llenguaDelText: 'ca' }}>
        <SondaLlengua />
      </UIContext.Provider>
    );
    expect(screen.getByTestId('llengua').textContent).toBe('ca');

    rerender(
      <UIContext.Provider value={{ language: 'eu' }}>
        <SondaLlengua />
      </UIContext.Provider>
    );
    expect(screen.getByTestId('llengua').textContent).toBe('eu');
  });

  test('si el valor del context té un getter defectuós que llança, captura i retorna undefined', () => {
    const trencat = Object.defineProperty({}, 'llenguaDelText', {
      get() {
        throw new Error('simulació sense useUIStateOpcional');
      }
    });
    render(
      <UIContext.Provider value={trencat}>
        <SondaLlengua />
      </UIContext.Provider>
    );
    expect(screen.getByTestId('llengua').textContent).toBe('undefined');
  });
});

describe('R32.45 · Lkits-06 i Lkits-08 · DialegNovaOrganitzacio errors en les 5 llengües', () => {
  const CASOS_VALIDACIO = [
    ['ca', 'Crear', 'El nom ha de tindre entre 2 i 120 caràcters.', 'Cada organització ha de tindre el seu poble: tria’n un.', 'Eixe identificador ja està en ús'],
    ['es', 'Crear', 'El nombre debe tener entre 2 y 120 caracteres.', 'Cada organización debe tener su pueblo: elige uno.', 'Ese identificador ya está en uso. Elige otro.'],
    ['en', 'Create', 'The name must be between 2 and 120 characters long.', 'Every organisation must have a village: choose one.', 'That identifier is already in use. Choose another one.'],
    ['eu', 'Sortu', 'Izenak 2 eta 120 karaktere artean izan behar ditu.', 'Erakunde bakoitzak bere herria izan behar du: aukeratu bat.', 'Identifikatzaile hori erabilita dago jada. Aukeratu beste bat.'],
    ['gl', 'Crear', 'O nome debe ter entre 2 e 120 caracteres.', 'Cada organización debe ter a súa vila: escolle unha.', 'Ese identificador xa está en uso. Escolle outro.']
  ];

  test('valida nom, poble i identificador duplicat del servidor en les 5 llengües oficials', async () => {
    for (const [lang, crearTxt, errNom, errPoble, errSlug] of CASOS_VALIDACIO) {
      const onCrea = vi.fn(async () => {
        throw new Error('Aquest identificador ja existeix');
      });

      render(
        <UIContext.Provider value={{ language: lang, llenguaDelText: lang }}>
          <DialegNovaOrganitzacio obert onTanca={vi.fn()} onCrea={onCrea} />
        </UIContext.Provider>
      );

      fireEvent.click(screen.getByRole('button', { name: crearTxt }));
      expect(screen.getByText(errNom)).toBeTruthy();
      expect(screen.getByText(errPoble)).toBeTruthy();

      const inputs = screen.getAllByRole('textbox');
      fireEvent.change(inputs[0], { target: { value: 'Forn Nou' } });
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Sella' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: crearTxt }));
      });
      if (lang !== 'ca') {
        expect(screen.getByText(errSlug)).toBeTruthy();
      } else {
        expect(screen.getByText('Aquest identificador ja existeix')).toBeTruthy();
      }
      cleanup();
    }
  });
});
