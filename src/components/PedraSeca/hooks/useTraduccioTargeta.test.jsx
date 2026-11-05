// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buidaCacheTraduccioTargetes,
  extreuCampsTargeta,
  tradueixCampsTargeta,
  useTraduccioTargeta,
} from './useTraduccioTargeta.js';
import {
  fixaCarregadorLliure,
  fixaTraductorLliure,
} from '../../../data/traductorDelLloc.js';

function TargetaProva({ targeta, traductorUrl = '', traductorLlengues }) {
  const {
    disponible,
    destins,
    fase,
    desti,
    error,
    camps,
    langDeCamp,
    tria,
    original,
  } = useTraduccioTargeta(targeta, { traductorUrl, traductorLlengues });

  return (
    <article data-testid="targeta-prova" data-fase={fase} data-desti={desti || ''}>
      <span data-testid="disponible">{String(disponible)}</span>
      <span data-testid="destins">{destins.map((d) => d.codi).join(',')}</span>
      <h3 data-testid="title" lang={langDeCamp('title')}>{camps.title}</h3>
      <p data-testid="subtitle" lang={langDeCamp('subtitle')}>{camps.subtitle}</p>
      <p data-testid="summary" lang={langDeCamp('summary')}>{camps.summary}</p>
      <div data-testid="content" lang={langDeCamp('content')}>{camps.content}</div>
      {error && <p role="alert" data-testid="error">{error}</p>}
      <button type="button" onClick={() => tria('ES')}>ES</button>
      <button type="button" onClick={() => tria('EN-GB')}>EN-GB</button>
      <button type="button" onClick={() => original()}>Original</button>
    </article>
  );
}

describe('useTraduccioTargeta (P2-13 · Traducció Dinàmica de Targetes)', () => {
  beforeEach(() => {
    buidaCacheTraduccioTargetes();
    fixaTraductorLliure(null);
    fixaCarregadorLliure(null);
  });

  afterEach(() => {
    cleanup();
    buidaCacheTraduccioTargetes();
    fixaTraductorLliure(null);
    fixaCarregadorLliure(null);
  });

  it('extreuCampsTargeta normalitza els quatre camps canònics i genera una empremta estable', () => {
    const info = extreuCampsTargeta({
      id: 'card-42',
      title: 'Mercat de la Tomaca',
      subtitle: '   ',
      summary: 'Producte de km 0 a Sóc de Poble.',
    });
    expect(info.clausActives).toEqual(['title', 'summary']);
    expect(info.valors.title).toBe('Mercat de la Tomaca');
    expect(info.valors.content).toBe('');
    expect(info.empremta).toContain('card-42');
  });

  it('tradueixCampsTargeta traduïx en lot, protegix els noms propis i reutilitza la memòria cau', async () => {
    const crides = [];
    const traductor = {
      disponible: true,
      tradueix: vi.fn(async (textos, desti) => {
        crides.push({ textos, desti });
        return {
          desti,
          traduccions: textos.map((t) => `[${desti}] ${t}`),
        };
      }),
    };

    const targeta = {
      id: 't-1',
      title: 'Benvolguts a Sóc de Poble',
      summary: 'La IAIA MarIA cuida el Mas amb Pedra Seca.',
    };

    const r1 = await tradueixCampsTargeta(targeta, 'ES', { traductor });
    expect(r1.desDeCache).toBe(false);
    expect(r1.lang).toBe('es');
    expect(r1.camps.title).toBe('[ES] Benvolguts a Sóc de Poble');
    expect(r1.camps.summary).toBe('[ES] La IAIA MarIA cuida el Mas amb Pedra Seca.');
    expect(crides).toHaveLength(1);

    // La segona crida amb la mateixa targeta i destí ha d'eixir de la memòria cau
    const r2 = await tradueixCampsTargeta(targeta, 'ES', { traductor });
    expect(r2.desDeCache).toBe(true);
    expect(r2.camps.title).toBe('[ES] Benvolguts a Sóc de Poble');
    expect(crides).toHaveLength(1);
  });

  it('marca en campsEnOriginal un camp que el motor deixa sense traduir o on es perd un nom propi', async () => {
    const traductor = {
      disponible: true,
      tradueix: vi.fn(async (textos, desti) => ({
        desti,
        traduccions: [
          // Primer camp traduït
          `[GL] ${textos[0]}`,
          // Segon camp tornat idèntic a l'entrada (no traduït)
          textos[1],
        ],
      })),
    };

    const res = await tradueixCampsTargeta(
      {
        id: 't-orig',
        title: 'Festa Major de la Torre',
        summary: 'Text que el motor no ha sabut traduir.',
      },
      'GL',
      { traductor, usarCache: false }
    );

    expect(res.camps.title).toBe('[GL] Festa Major de la Torre');
    expect(res.camps.summary).toBe('Text que el motor no ha sabut traduir.');
    expect(res.campsEnOriginal).toEqual(['summary']);
  });

  it('el hook useTraduccioTargeta carrega el transport lliure sota demanda, aplica lang per camp i restaura l’original', async () => {
    fixaTraductorLliure('apertium');
    fixaCarregadorLliure(async () => ({
      creaTraductorApertium: () => ({
        disponible: true,
        tradueix: async (textos, desti) => ({
          desti,
          traduccions: textos.map((t, idx) => (idx === 1 ? t : `(${desti}) ${t}`)),
        }),
      }),
    }));

    const targeta = {
      id: 'card-hook-1',
      title: ' pregó de la plaça',
      subtitle: 'Intraductible',
      summary: 'Trobada veïnal amb Sóc de Poble.',
      content: '',
    };

    render(<TargetaProva targeta={targeta} />);

    expect(screen.getByTestId('disponible').textContent).toBe('true');
    expect(screen.getByTestId('targeta-prova').getAttribute('data-fase')).toBe('original');
    expect(screen.getByTestId('title').getAttribute('lang')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByText('ES'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('targeta-prova').getAttribute('data-fase')).toBe('traduida');
    });

    expect(screen.getByTestId('title').textContent).toBe('(ES)  pregó de la plaça');
    expect(screen.getByTestId('title').getAttribute('lang')).toBe('es');
    // El camp que ha quedat sense traduir conserva lang="ca"
    expect(screen.getByTestId('subtitle').getAttribute('lang')).toBe('ca');
    expect(screen.getByTestId('summary').textContent).toBe('(ES) Trobada veïnal amb Sóc de Poble.');

    fireEvent.click(screen.getByText('Original'));
    expect(screen.getByTestId('targeta-prova').getAttribute('data-fase')).toBe('original');
    expect(screen.getByTestId('title').textContent).toBe(' pregó de la plaça');
    expect(screen.getByTestId('title').getAttribute('lang')).toBeNull();
  });
});
