import { describe, expect, it } from 'vitest';
import { MOCK_TOWNS, POBLES_APLEC_2023 } from './townsSeed.js';
import { candidatsDeFitxers, esFotoValida, esNomExclos } from './pobleDeViquipedia.js';

describe('IDEA-86 / IDEA-90 · Prohibició absoluta d’escuts municipals i heràldica en fitxes de pobles i Gent de <Poble>', () => {
  it('cap poble de MOCK_TOWNS ni de POBLES_APLEC_2023 declara shield_url, coat_of_arms ni imatges d’escuts o banderes', () => {
    const tots = [...MOCK_TOWNS, ...POBLES_APLEC_2023];
    expect(tots.length).toBeGreaterThanOrEqual(21);

    for (const poble of tots) {
      expect(poble).not.toHaveProperty('shield_url');
      expect(poble).not.toHaveProperty('coat_of_arms');
      expect(poble).not.toHaveProperty('escut');
      expect(poble).not.toHaveProperty('p94');

      for (const camp of ['image_url', 'avatar_url', 'logo_url']) {
        const valor = poble[camp];
        if (typeof valor === 'string' && valor.trim()) {
          expect(esNomExclos(valor), `${poble.id}.${camp} no pot apuntar a cap escut/bandera/mapa: ${valor}`).toBe(false);
          expect(valor).not.toMatch(/hero_nanobanana/i);
        }
      }

      // L'autoria col·lectiva és sempre "Gent de <Poble>", mai "Ajuntament de <Poble>"
      expect(String(poble.author || '')).toMatch(/^Gent d/i);
      expect(String(poble.author || '')).not.toMatch(/Ajuntament/i);
    }
  });

  it('esNomExclos i candidatsDeFitxers bloquegen qualsevol variant d’escut heràldic (P94) o bandera (P41)', () => {
    const prohibits = [
      'Escut_de_Benillup.svg',
      'Escut_de_Benillup.png',
      'Escudo_de_Gorga.jpg',
      'Coat_of_arms_of_Planes.png',
      'Benilloba_CoA.jpg',
      'Blason_ville_fr.png',
      'Bandera_de_Muro.jpg',
      'Flag_of_Pego.png',
      'Mapa_comarcal_Alcoia.png',
    ];

    for (const fitxer of prohibits) {
      expect(esNomExclos(fitxer), `Ha d'excloure ${fitxer}`).toBe(true);
      expect(
        esFotoValida({
          src: `https://upload.wikimedia.org/${fitxer}`,
          fitxer,
          mime: 'image/jpeg',
          amplada: 1600,
          alcada: 1200,
          llicencia: 'CC BY-SA 4.0',
        })
      ).toBe(false);
    }

    const triats = candidatsDeFitxers({
      p18: 'Escut_de_Benillup.png',
      insignies: ['Simbol_oficial_ajuntament.jpg'],
      imatatgePagina: 'Bandera_de_Benillup.jpg',
      fitxers: [
        'Simbol_oficial_ajuntament.jpg',
        'Escudo_municipal.jpg',
        'Panoramica_de_Benillup_i_el_barranc.jpg',
        'Placa_ de_l_Esglesia_de_Benillup.jpg',
      ],
    });

    expect(triats).toEqual([
      'Panoramica de Benillup i el barranc.jpg',
      'Placa  de l Esglesia de Benillup.jpg',
    ]);
  });
});
