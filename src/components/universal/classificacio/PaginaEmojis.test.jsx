import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { PaginaEmojis } from './PaginaEmojis.jsx';

afterEach(cleanup);

const catalegSintetic = () => Promise.resolve({
  GRUPS_EMOJIS: [
    {
      id: 'fruita',
      nom: 'Fruites i hortalisses',
      emojis: [
        ['1F345', '🍅', 'tomato'],
        ['1F33D', '🌽', 'ear of corn']
      ]
    }
  ]
});

describe('PaginaEmojis', () => {
  test('renderitza el títol, descripció per a cursor i la graella', async () => {
    render(
      <PaginaEmojis
        titol="Selector d'emojis"
        emojiAlCursor={true}
        carregaCataleg={catalegSintetic}
        onTornar={vi.fn()}
        onTria={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: "Selector d'emojis" })).toBeTruthy();
    expect(screen.getByText('Toca un emoji i s’escriurà on tenies el cursor, a la nota oberta.')).toBeTruthy();
    expect(await screen.findByRole('button', { name: 'tomato' })).toBeTruthy();
  });

  test('el botó Tornar crida onTornar', () => {
    const onTornar = vi.fn();
    render(
      <PaginaEmojis
        carregaCataleg={catalegSintetic}
        onTornar={onTornar}
        onTria={vi.fn()}
      />
    );

    const botoTornar = screen.getByRole('button', { name: 'Tornar' });
    fireEvent.click(botoTornar);
    expect(onTornar).toHaveBeenCalledTimes(1);
  });

  test('el botó Tancar crida onTornar', () => {
    const onTornar = vi.fn();
    render(
      <PaginaEmojis
        carregaCataleg={catalegSintetic}
        onTornar={onTornar}
        onTria={vi.fn()}
      />
    );

    const botoTancar = screen.getByRole('button', { name: 'Tancar' });
    fireEvent.click(botoTancar);
    expect(onTornar).toHaveBeenCalledTimes(1);
  });

  test('la tecla Escape activa onTornar', () => {
    const onTornar = vi.fn();
    render(
      <PaginaEmojis
        carregaCataleg={catalegSintetic}
        onTornar={onTornar}
        onTria={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onTornar).toHaveBeenCalledTimes(1);
  });

  test('tria un emoji crida onTria', async () => {
    const onTria = vi.fn();
    render(
      <PaginaEmojis
        carregaCataleg={catalegSintetic}
        onTornar={vi.fn()}
        onTria={onTria}
      />
    );

    const botoEmoji = await screen.findByRole('button', { name: 'tomato' });
    await act(async () => {
      fireEvent.click(botoEmoji);
    });
    expect(onTria).toHaveBeenCalledWith('🍅', 'tomato');
  });

  test('modePerfil mostra el text per a la fitxa', () => {
    render(
      <PaginaEmojis
        modePerfil={true}
        carregaCataleg={catalegSintetic}
        onTornar={vi.fn()}
        onTria={vi.fn()}
      />
    );

    expect(screen.getByText('Toca un emoji per assignar-lo com a emoticona de la teua fitxa.')).toBeTruthy();
  });

  test('renderitza acció secundària si es passa', () => {
    render(
      <PaginaEmojis
        carregaCataleg={catalegSintetic}
        onTornar={vi.fn()}
        onTria={vi.fn()}
        accioSecundaria={<button type="button">Llevar emoticona</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Llevar emoticona' })).toBeTruthy();
  });
});
