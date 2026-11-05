import { describe, expect, test } from 'vitest';
import {
  avaluaFiltresContextuals,
  avaluaRetencioPublicacio
} from './politicaRetencioIFiltresUsuari.js';

describe('Ronda 22 · politicaRetencioIFiltresUsuari (Eixos 5 i 6 Estudi Doctoral Mastodon)', () => {
  test('1. avaluaFiltresContextuals aplica filtres warn/hide per superfície, respecta whole_word i ignora filtres caducats', () => {
    const filtres = [
      {
        id: 'f-spoiler',
        title: 'Avís de festa sorpresa',
        context: ['mur', 'fedivers'],
        keywords: [{ keyword: 'sorpresa', whole_word: true }],
        filter_action: 'warn',
        expires_at: '2026-12-01T00:00:00Z'
      },
      {
        id: 'f-caducat',
        title: 'Filtre antic ja vençut',
        context: ['mur'],
        keywords: [' mercat '],
        filter_action: 'hide',
        expires_at: '2026-10-01T00:00:00Z'
      }
    ];

    const pecaAmbSorpresa = {
      title: 'Preparatius de la festa sorpresa a la plaça',
      content: 'Porteu cadires i fanalets.'
    };

    const resMur = avaluaFiltresContextuals(pecaAmbSorpresa, filtres, 'mur', '2026-11-04T21:00:00Z');
    expect(resMur.accio).toBe('warn');
    expect(resMur.oculta).toBe(false);
    expect(resMur.avisos).toEqual(['Avís de festa sorpresa']);

    // En una altra superfície on el filtre no està actiu ('converses') no s'aplica
    const resConversa = avaluaFiltresContextuals(pecaAmbSorpresa, filtres, 'converses', '2026-11-04T21:00:00Z');
    expect(resConversa.accio).toBe('cap');

    // El filtre caducat sobre 'mercat' s'ignora
    const pecaMercat = { title: 'Mercat de tardor a La Torre' };
    expect(avaluaFiltresContextuals(pecaMercat, filtres, 'mur', '2026-11-04T21:00:00Z').accio).toBe('cap');
  });

  test('2. avaluaRetencioPublicacio blinda sempre Sóc de Poble, El Rentonar, Coordinadora, fixats i marcadors, i només caduca avisos efímers vençuts', () => {
    const cronicaRentonar = {
      id: 'cronica-1998',
      author_entity_id: 'rentonar',
      title: 'Les mines d’aigua històriques de La Torre',
      created_at: '1998-05-10T10:00:00Z',
      efimera: true
    };
    const rRentonar = avaluaRetencioPublicacio(cronicaRentonar, { diesRetencioEfimers: 7 }, '2026-11-04T21:00:00Z');
    expect(rRentonar.maiEsborrar).toBe(true);
    expect(rRentonar.caducada).toBe(false);

    const trajecteVehiclePassat = {
      id: 'cotxe-alcoi-ahir',
      ambit: 'vehicle',
      author_entity_id: 'vei-particular',
      title: 'Baixe a Alcoi demà a les 8h (2 places lliures)',
      data_viatge: '2026-11-01T08:00:00Z'
    };
    const rVehicle = avaluaRetencioPublicacio(trajecteVehiclePassat, {}, '2026-11-04T21:00:00Z');
    expect(rVehicle.maiEsborrar).toBe(false);
    expect(rVehicle.caducada).toBe(true);
    expect(rVehicle.accioRecomanada).toBe('arxiva_efimer');

    // Si el veí l'ha fixat o guardat en marcadors, mai caduca
    const rVehicleGuardat = avaluaRetencioPublicacio(
      { ...trajecteVehiclePassat, bookmarked: true },
      {},
      '2026-11-04T21:00:00Z'
    );
    expect(rVehicleGuardat.maiEsborrar).toBe(true);
    expect(rVehicleGuardat.caducada).toBe(false);
  });
});
