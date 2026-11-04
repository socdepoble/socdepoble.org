// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { darreraDataDelText, imatgesAmbDataDelCos, triaImatgeSeo } from '../../tooling/seo/triaImatgeSeo.js';
import { CURSOS_PEDRA_EN_SEC_2026_EVENT } from '../sections/mur/eventsSeed.js';
import { primeraImatgeSocial } from '../config/imatgeSocial.js';

describe('triaImatgeSeo · selector temporal i editorial d’imatge SEO (og:image)', () => {
  test('darreraDataDelText extreu l’última data en valencià de cada tanda', () => {
    expect(darreraDataDelText('23, 24, 30 i 31 d’octubre de 2026')).toBe('2026-10-31');
    expect(darreraDataDelText('6, 7 i 14 de novembre de 2026')).toBe('2026-11-14');
  });

  test('imatgesAmbDataDelCos associa cada cartell amb la data final de la seua tanda', () => {
    const tandes = imatgesAmbDataDelCos(CURSOS_PEDRA_EN_SEC_2026_EVENT.description, '2026');
    expect(tandes).toEqual([
      {
        src: '/assets/events/cartell_pedra_en_sec_fageca_2026.webp',
        alt: 'Cartell informatiu i programa del curs Introducció a la pedra en sec: l’art dels marges a Fageca (23, 24, 30 i 31 d’octubre)',
        fi: '2026-10-31'
      },
      {
        src: '/assets/events/cartell_pedra_en_sec_alcosser_2026.webp',
        alt: 'Cartell informatiu i programa del curs Construcció amb pedra en sec: l’art dels marges a Alcosser (6, 7 i 14 de novembre)',
        fi: '2026-11-14'
      }
    ]);
  });

  test('a l’octubre (2026-10-20) tria la primera tanda vigent (Fageca)', () => {
    const res = triaImatgeSeo(CURSOS_PEDRA_EN_SEC_2026_EVENT, { ara: '2026-10-20' });
    expect(res.imatge).toBe('/assets/events/cartell_pedra_en_sec_fageca_2026.webp');
    expect(res.motiu).toBe('primera-tanda-vigent');
    expect(res.fi).toBe('2026-10-31');
  });

  test('al novembre (2026-11-03), quan Fageca ja ha passat, salta automàticament a la segona tanda vigent (Alcosser)', () => {
    const res = triaImatgeSeo(CURSOS_PEDRA_EN_SEC_2026_EVENT, { ara: '2026-11-03' });
    expect(res.imatge).toBe('/assets/events/cartell_pedra_en_sec_alcosser_2026.webp');
    expect(res.motiu).toBe('tanda-vigent-2');
    expect(res.fi).toBe('2026-11-14');
    expect(CURSOS_PEDRA_EN_SEC_2026_EVENT.og_image).toBe(res.imatge);
  });

  test('primeraImatgeSocial resol og_image d’Alcosser cap a la seua variant -social-1200x630.jpg per a WhatsApp', () => {
    const social = primeraImatgeSocial('events', CURSOS_PEDRA_EN_SEC_2026_EVENT);
    expect(social).toEqual({
      estat: 'triada',
      ref: '/assets/events/cartell_pedra_en_sec_alcosser_2026.webp',
      url: 'https://socdepoble.org/assets/events/cartell_pedra_en_sec_alcosser_2026-social-1200x630.jpg',
      posicio: 0
    });
  });
});

