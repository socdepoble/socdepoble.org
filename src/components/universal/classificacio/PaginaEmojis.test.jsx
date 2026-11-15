import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { PaginaEmojis } from './PaginaEmojis.jsx';
import { AmbitCapesEnrere } from '../../PedraSeca/hooks/useCapaEnrere.js';

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

  /* Onada R29 · R29-CV-07 · Dins de <soc-de-poble> (un shadow root per instància, amb el seu àmbit de capes,
     com PedraSecaEmbed), un Escape premut en un camp de l'amfitrió o dins d'una altra instància no tanca la
     pàgina; el premut dins del seu arbre, sí. */
  test('encastada, només la tanca un Escape premut dins del seu shadow root', () => {
    const escape = () => new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true, composed: true });
    render(<><input aria-label="Cerca del tema" /><div data-testid="amfitrio-1" /><div data-testid="amfitrio-2" /></>);
    const instancia = (testId) => {
      const host = screen.getByTestId(testId);
      const lloc = document.createElement('div');
      /* Onada R29 · Segona passada (RUT-R29-01): tancat, com el crea PedraSecaEmbed. */
      host.attachShadow({ mode: 'closed' }).append(lloc);
      const onTornar = vi.fn();
      render(
        <AmbitCapesEnrere.Provider value={host}>
          <PaginaEmojis carregaCataleg={catalegSintetic} onTornar={onTornar} onTria={vi.fn()} />
        </AmbitCapesEnrere.Provider>,
        { container: lloc }
      );
      return { lloc, onTornar };
    };
    const primera = instancia('amfitrio-1');
    const segona = instancia('amfitrio-2');

    screen.getByRole('textbox', { name: 'Cerca del tema' }).dispatchEvent(escape());
    expect(primera.onTornar).not.toHaveBeenCalled();
    expect(segona.onTornar).not.toHaveBeenCalled();

    primera.lloc.querySelector('button').dispatchEvent(escape());
    expect(primera.onTornar).toHaveBeenCalledTimes(1);
    expect(segona.onTornar).not.toHaveBeenCalled();
  });
});
