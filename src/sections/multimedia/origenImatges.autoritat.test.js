/**
 * Auditoria de seguretat 261019 (F11) · Una aportació d'un veí no es pot fer
 * passar per obra de la IAIA: ni el seu `origen`, ni el seu `autor` o
 * `source`, ni el nom del fitxer que ella mateixa ha pujat la porten a
 * l'apartat «IAIA» amb els drets de Sóc de Poble. El contingut de
 * l'administració i les il·lustracions del paquet, igual que abans.
 */
import { describe, expect, test } from 'vitest';
import { elementDeFilaPublicada } from '../../data/mapejadorSeccions.js';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';
import { dretsDe, origenDe } from './origenImatges.js';
import { autorDeclarat } from './panellDeLaFoto.js';
import { LEGACY_MEDIA } from './legacyMedia.js';

const deUnVei = (payload) => elementDeFilaPublicada({
  id: 'v1', payload, titol: 'Pepa', createdAt: '2026-10-07T10:00:00Z', updatedAt: '2026-10-07T10:00:00Z', ownerUserId: 'U'
});

describe('una aportació d’un veí a l’Arxiu', () => {
  test('el seu origen «ia», el seu autor i la seua font no hi manen', () => {
    const foto = deUnVei({ src: '/assets/uploads/poble/la-torre/foto.jpg', title: 'Foto', origen: 'ia', autor: 'IAIA MarIA',
      source: 'Ajuntament', copyright: 'Fet per la IAIA i Nano Banana' });
    expect(origenDe(foto)).toBe('foto');
    expect(autorDeclarat(foto)).toBeNull();
    expect(dretsDe(foto, { origen: origenDe(foto) })).toBeNull();
  });

  test('el nom d’una pujada pròpia («nano_…», «…comic…») no la fa il·lustració de la casa', () => {
    for (const src of [
      'sdp-media://mitjans/p/u/multimedia/nano_banana.png',
      'https://proj.supabase.co/storage/v1/object/public/mitjans/p/u/mur/retrat-comic.webp',
      'https://exemple.cat/uploads/ia/x.png'
    ]) {
      expect(origenDe(deUnVei({ src }))).toBe('foto');
      expect(origenDe({ src })).toBe('foto');
    }
  });

  test('revisió · reprendre una imatge del paquet o del cens amb un srcDelPort propi no la porta a «IAIA»', () => {
    const cens = new Map([['/assets/fotos/iaia-maria.png', { src: '/assets/fotos/iaia-maria.png', origen: 'ia' }]]);
    const foto = deUnVei({ src: '/assets/fotos/iaia-maria.png', srcDelPort: 'https://bucket.example/u/la-meua.jpg',
      copyright: 'Fet per la IAIA i Nano Banana', title: 'Meua' });
    expect(foto).not.toHaveProperty('srcDelPort');
    expect(origenDe(foto, cens)).toBe('foto');
    expect(origenDe(deUnVei({ src: '/assets/nano_cards/mur_nano_card.jpg' }))).toBe('foto');
    expect(dretsDe(foto, { origen: origenDe(foto, cens) })).toBeNull();
  });

  test('revisió · un espai dur no disfressa «Fet per la IAIA», ni els punts un recurs del paquet', () => {
    expect(dretsDe({ src: '/x.jpg', copyright: 'Fet per la IAIA i Nano Banana' }, { origen: 'foto' })).toBeNull();
    expect(dretsDe({ src: '/x.jpg', copyright: 'Fet per la ＩＡＩＡ' }, { origen: 'foto' })).toBeNull();
    expect(origenDe({ src: '/assets/nano_cards/../../uploads/x.png' })).toBe('foto');
    expect(origenDe({ src: '/assets/nano_cards/%2e%2e/x.png' })).toBe('foto');
  });
});

describe('el contingut de l’administració i el paquet, igual que abans', () => {
  test('l’origen declarat fora d’una aportació d’un veí continua manant', () => {
    expect(origenDe({ origen: 'ia', src: '/x.jpg' })).toBe('ia');
    expect(origenDe({ origen: 'sistema', src: '/assets/nano_cards/x.jpg' })).toBe('sistema');
  });

  test('les il·lustracions del paquet continuen sent de la casa', () => {
    expect(origenDe({ src: '/assets/nano_cards/nova.jpg' })).toBe('ia');
    expect(dretsDe({ src: '/assets/nano_cards/mur_nano_card.jpg' })).toBe(COPYRIGHT_SDP);
  });

  test('l’Arxiu de la llavor es classifica igual', () => {
    expect(LEGACY_MEDIA.filter((item) => item.id.startsWith('nano-')).every((item) => origenDe(item) === 'ia')).toBe(true);
  });
});
