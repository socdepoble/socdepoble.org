import { describe, expect, test } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import {
  LAMINES_BOTANIQUES_NODE0,
  METADADES_LABORATORI_BOTANIC_NODE0,
  obteLaminaBotanicaNode0,
} from '../../data/patrimoni/laminesBotaniquesNode0.js';
import { ESPECIES_HERBARI_LA_TORRE_117 } from '../../data/patrimoni/herbariLaTorre117.js';
import { FONTS_BANC_LLAVORS, entradesDelCataleg } from '../../data/patrimoni/bancLlavors.js';
import { modelHerbariWorkspace } from './modelHerbariWorkspace.js';
import { TEXTOS_HERBARI } from './textosHerbari.js';
import FitxaHerbari from './FitxaHerbari.jsx';
import { Fitxa } from './BancLlavorsSection.jsx';

describe('P0-118 · Làmines botàniques fotorrealistes generades al Node 0', () => {
  test('declara 24 estudis morfològics, 12 d’Herbari i 12 del Banc de Llavors', () => {
    const entrades = Object.values(LAMINES_BOTANIQUES_NODE0);
    expect(entrades).toHaveLength(24);
    expect(entrades.filter((e) => e.colleccio === 'herbari')).toHaveLength(12);
    expect(entrades.filter((e) => e.colleccio === 'banc-de-llavors')).toHaveLength(12);
    expect(METADADES_LABORATORI_BOTANIC_NODE0.motorImatge).toContain('Z-Image-Turbo');

    expect(entrades.every((e) => e.morfologiaDoctoralCa.trim())).toBe(true);
  });

  test('no muta els fitxers literals de l’Herbari ni del Banc de Llavors i manté les variants pendents fora de la Columna 2', () => {
    const timoLiteral = ESPECIES_HERBARI_LA_TORRE_117.find((e) => e.id === 'herbari-113-timo');
    expect(timoLiteral).toBeDefined();
    expect(timoLiteral).not.toHaveProperty('imageUrl');

    const projectats = modelHerbariWorkspace(TEXTOS_HERBARI.ca, obteLaminaBotanicaNode0).items;
    const timoProjectat = projectats.find((e) => e.id === 'herbari-113-timo');
    expect(timoProjectat).not.toHaveProperty('imageUrl');
    expect(obteLaminaBotanicaNode0('cv-13-tomaca-de-pera')?.imatgePrincipal).toBeNull();
    expect(obteLaminaBotanicaNode0('cv-11-tomaca-mutxamel')?.imatgePrincipal).toBeNull();

    const tomacaLiteral = entradesDelCataleg('cataleg-valencia').find((v) => v.id === 'cv-13-tomaca-de-pera');
    expect(tomacaLiteral).toBeDefined();
    expect(tomacaLiteral).not.toHaveProperty('imageUrl');
  });

  test('FitxaHerbari i Fitxa del Banc de Llavors pinten l’estudi morfològic i amaguen les làmines pendents', async () => {
    const timo = ESPECIES_HERBARI_LA_TORRE_117.find((e) => e.id === 'herbari-113-timo');
    const textosHerbari = {
      documental: 'Transcripció literal',
      valencia: 'Valencià',
      castella: 'Castellà',
      angles: 'Anglés',
      cientific: 'Nom científic',
      zona: 'Zona',
      usos: 'Usos',
      toxicitatAdvertida: 'Tòxica',
      toxicitatDesconeguda: 'Sense advertència',
      font: 'Font',
      pagina: 'Pàgina',
      empremta: 'SHA-256',
      veu: 'Escolta',
      atura: 'Atura',
      veuError: 'Error',
      veuAbsent: 'No disponible',
    };
    const locutor = { local: false, disponible: () => false };
    render(<FitxaHerbari especie={timo} textos={textosHerbari} locutor={locutor} />);
    const regioTimo = await screen.findByRole('region', { name: 'Estudi morfològic de Timó' });
    expect(within(regioTimo).queryByRole('img')).toBeNull();

    const fontValencia = FONTS_BANC_LLAVORS.find((f) => f.id === 'cataleg-valencia');
    const totesValencia = entradesDelCataleg('cataleg-valencia');
    const entradaTomaca = totesValencia.find((e) => e.id === 'cv-11-tomaca-mutxamel');
    render(
      <Fitxa
        entrada={entradaTomaca}
        totes={totesValencia}
        onTriaEntrada={() => {}}
        font={fontValencia}
        onTanca={() => {}}
        tr={(_k, fb) => fb}
        autoFocus={false}
      />,
    );
    await waitFor(() => expect(screen.getAllByRole('region', { name: /Estudi morfològic de/i })).toHaveLength(2));
  });
});
