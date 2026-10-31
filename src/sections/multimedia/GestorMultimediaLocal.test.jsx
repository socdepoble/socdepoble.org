/**
 * GestorMultimediaLocal.test.jsx — Proves unitàries i d'integració del Gestor
 * Multimèdia Local Intel·ligent (`IDEA-54` · `_multimedia_de_poble/`).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { GestorMultimediaLocal } from './GestorMultimediaLocal.jsx';
import { analitzaCarpetaMultimediaLocal } from './motorMultimediaLocal.js';

afterEach(cleanup);

describe('analitzaCarpetaMultimediaLocal (motor d’auditoria local)', () => {
  test('classifica subcarpetes, detecta emparellades amb el cens web, inèdites, bessones locals i duplicats', () => {
    const cens = new Map([
      ['/assets/uploads/brain/nano_versions_ibanez_v1_1_10.webp', { titol: 'El tauler de versions del poble', ambit: 'contingut' }]
    ]);

    const entrades = [
      {
        ruta: 'originals_raster_public/assets/uploads/brain/nano_versions_ibanez_v1_1_10.jpg',
        mida: 1055000,
        modificat: 1793282000000
      },
      {
        ruta: '00_inbox/esbos_festa_tibi.png',
        mida: 620000,
        modificat: 1793282100000
      },
      {
        ruta: 'nano_banana_historic/vinyeta_ mercat.png',
        mida: 400000,
        modificat: 1793282200000
      },
      {
        ruta: 'nano_banana_historic/vinyeta_ mercat.webp',
        mida: 140000,
        modificat: 1793282205000
      },
      {
        ruta: 'captures_treball/copia_esbos_festa_tibi.png',
        mida: 620000,
        modificat: 1793282300000
      }
    ];

    const res = analitzaCarpetaMultimediaLocal(entrades, { cens });

    expect(res.resum.totalFitxers).toBe(5);
    expect(res.resum.totalImatges).toBe(5);
    expect(res.resum.totalEmparelladesWeb).toBe(1);
    expect(res.resum.totalInedites).toBe(2);
    expect(res.resum.totalBessonesLocals).toBe(2);
    expect(res.resum.estalviBessonesBytes).toBe(260000);
    expect(res.resum.totalDuplicades).toBe(2);

    const perRuta = new Map(res.elements.map((e) => [e.ruta, e]));
    expect(perRuta.get('originals_raster_public/assets/uploads/brain/nano_versions_ibanez_v1_1_10.jpg').emparelladaWeb).toBe(true);
    expect(perRuta.get('00_inbox/esbos_festa_tibi.png').inedita).toBe(true);
    expect(perRuta.get('00_inbox/esbos_festa_tibi.png').duplicada).toBe(true);
    expect(perRuta.get('nano_banana_historic/vinyeta_ mercat.png').teBessonaLocal).toBe(true);
  });
});

describe('GestorMultimediaLocal (interfície Pedra Seca)', () => {
  test('mostra el Gestor d’arxius locals i, amb el selector de fitxers, la diagnosi de _multimedia_de_poble', async () => {
    const cens = new Map([
      ['/assets/uploads/brain/nano_versions_ibanez_v1_1_10.webp', { titol: 'El tauler de versions del poble', ambit: 'contingut' }]
    ]);

    render(<GestorMultimediaLocal cens={cens} entorn={{}} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Gestor d’arxius locals' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Vincular carpeta local' })).not.toBeNull();

    const input = screen.getByTestId('input-carpeta-multimedia-local');
    const f1 = new File([new Uint8Array(2048)], 'nano_versions_ibanez_v1_1_10.jpg', { type: 'image/jpeg' });
    Object.defineProperty(f1, 'webkitRelativePath', {
      value: '_multimedia_de_poble/originals_raster_public/assets/uploads/brain/nano_versions_ibanez_v1_1_10.jpg'
    });
    const f2 = new File([new Uint8Array(4096)], 'nova_vinyeta.png', { type: 'image/png' });
    Object.defineProperty(f2, 'webkitRelativePath', {
      value: '_multimedia_de_poble/00_inbox/nova_vinyeta.png'
    });

    fireEvent.change(input, { target: { files: [f1, f2] } });

    expect(await screen.findByRole('heading', { name: 'Diagnòstic de «_multimedia_de_poble»' })).not.toBeNull();
    expect(screen.getByText('Publicades a la web: 1')).not.toBeNull();
    expect(screen.getByText('Inèdites sense WebP: 1')).not.toBeNull();
    expect(screen.getByText('Només lectura')).not.toBeNull();
  });
});
