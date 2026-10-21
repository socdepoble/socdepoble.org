// @vitest-environment node
/* Onada 0.3 (Gauntlet 261016; requisit del Mestre del 261007: l'apartat
   «IAIA») · D'on ve una imatge, qui en té els drets i si és la foto d'una
   persona (origenImatges.js). La llei dels drets (MCR 261016,
   b03_multimedia.5): una foto real mai porta «Fet per la IAIA». */
import { describe, expect, test } from 'vitest';
import { COPYRIGHT_SDP, COPYRIGHT_VIQUIPEDIA } from '../../components/universal/editorial.js';
import { CENS_IMATGES } from './censImatges.js';
import { LEGACY_MEDIA } from './legacyMedia.js';
import { MEDIA_ITEMS } from './mediaContent.js';
import { dretsDe, esDeLaViquipedia, esFotoDePersona, indexaCens, origenDe } from './origenImatges.js';

const CENS = indexaCens(CENS_IMATGES);

describe('origenDe', () => {
  test('mana el camp de l’element; després el cens; després el camí; en el dubte, foto', () => {
    expect(origenDe({ origen: 'sistema', src: '/assets/nano_cards/x.jpg' })).toBe('sistema');
    expect(origenDe({ src: '/assets/uploads/brain/xat_portada.webp' }, CENS)).toBe('ia');
    expect(origenDe({ src: '/assets/uploads/brain/mac_mini_m4_1787721966622.jpg' }, CENS)).toBe('foto');
    expect(origenDe({ src: '/assets/system/ui/logo.png' })).toBe('sistema');
    expect(origenDe({ src: '/assets/nano_cards/nova.jpg' })).toBe('ia');
    expect(origenDe({ src: '/assets/ui/plugins/nova_vinyeta.webp' })).toBe('ia');
    expect(origenDe({ src: '/assets/uploads/ia/16-nou/avatars/x.png' })).toBe('ia');
    expect(origenDe({ src: '/assets/uploads/gent/avatars/pepa-comic.png' })).toBe('ia');
    expect(origenDe({ src: 'https://proj.supabase.co/storage/v1/object/public/mitjans/t/u/mur/0b5c.webp' })).toBe('foto');
    expect(origenDe({ src: '/assets/uploads/poble/la-torre-de-les-macanes/DSC00320.JPG' })).toBe('foto');
    expect(origenDe({ origen: 'inventat', src: '/x.jpg' })).toBe('foto');
    expect(origenDe(null)).toBe('foto');
  });

  test('l’arxiu: les quatre il·lustracions dels personatges i la Nano Banana són d’IA; la persona pilot, foto', () => {
    const perId = Object.fromEntries(LEGACY_MEDIA.map((item) => [item.id, origenDe(item)]));
    for (const id of ['foto-carla', 'foto-viatjant', 'foto-iaia', 'foto-sultan']) expect(perId[id], id).toBe('ia');
    expect(perId['foto-javi']).toBe('foto');
    expect(LEGACY_MEDIA.filter((item) => item.id.startsWith('nano-')).every((item) => origenDe(item) === 'ia')).toBe(true);
    /* Cap ja no diu «Fotografia històrica» d'una il·lustració. */
    expect(LEGACY_MEDIA.filter((item) => item.subtitle === 'Fotografia històrica').map((item) => item.id)).toEqual(['foto-javi']);
    expect(LEGACY_MEDIA.filter((item) => item.source === 'Fotògraf Sóc de Poble').map((item) => item.id)).toEqual(['foto-javi']);
  });
});

describe('dretsDe', () => {
  test('el declarat mana; després el Copyright de l’EXIF', () => {
    expect(dretsDe({ copyright: ' CC BY 4.0 ', src: '/assets/towns/tibi/1.jpg' })).toBe('CC BY 4.0');
    expect(dretsDe({ src: '/assets/uploads/poble/x.jpg' }, { origen: 'foto', copyrightExif: '(c) Pepa' })).toBe('(c) Pepa');
  });

  test('una foto de poble de la Viquipèdia, els de Wikimedia; una il·lustració d’IA, els de Sóc de Poble', () => {
    expect(dretsDe({ src: '/assets/towns/tibi/2.jpg' })).toBe(COPYRIGHT_VIQUIPEDIA);
    expect(dretsDe({ src: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Tibi.jpg' })).toBe(COPYRIGHT_VIQUIPEDIA);
    expect(dretsDe({ src: '/assets/nano_cards/mur_nano_card.jpg' })).toBe(COPYRIGHT_SDP);
  });

  test('LLEI · una foto real sense drets declarats: null («No declarats»), mai «Fet per la IAIA»', () => {
    for (const item of [
      { src: '/assets/fotos/javi-llinares-perfil-1200px.jpg', origen: 'foto' },
      { src: '/assets/uploads/poble/la-torre-de-les-macanes/DSC00320.JPG' },
      { src: '/assets/uploads/brain/mac_mini_m4_1787721966622.jpg' }
    ]) expect(dretsDe(item, { origen: origenDe(item, CENS) }), item.src).toBeNull();
    /* Ni declarat: el text de sèrie de la casa en una foto real no es creu
       (una pujada que l'hereta); en una il·lustració d'IA, sí. */
    expect(dretsDe({ src: '/assets/uploads/poble/x.jpg', copyright: COPYRIGHT_SDP }, { origen: 'foto' })).toBeNull();
    expect(dretsDe({ src: '/assets/towns/tibi/1.jpg', copyright: COPYRIGHT_SDP }, { origen: 'foto' })).toBe(COPYRIGHT_VIQUIPEDIA);
    expect(dretsDe({ src: '/assets/uploads/poble/x.jpg' }, { origen: 'foto', copyrightExif: 'Fet per la IAIA' })).toBeNull();
    expect(dretsDe({ src: '/assets/nano_cards/x.jpg', copyright: COPYRIGHT_SDP }, { origen: 'ia' })).toBe(COPYRIGHT_SDP);
    /* Totes les fotos del cens i de la llavor: cap foto real porta el text de la IAIA. */
    const reals = [...CENS_IMATGES, ...MEDIA_ITEMS].filter((item) => origenDe(item, CENS) !== 'ia');
    expect(reals.length).toBeGreaterThan(30);
    expect(reals.filter((item) => dretsDe(item, { origen: origenDe(item, CENS) }) === COPYRIGHT_SDP).map((item) => item.src)).toEqual([]);
  });

  test('esDeLaViquipedia: només towns/ i Wikimedia', () => {
    expect([esDeLaViquipedia('/assets/towns/x/1.jpg'), esDeLaViquipedia('/assets/uploads/poble/x.jpg'), esDeLaViquipedia(null)]).toEqual([true, false, false]);
  });
});

describe('esFotoDePersona', () => {
  test('l’àmbit persona del cens, o un camí de gent, usuaris, avatars o perfil', () => {
    expect(esFotoDePersona({ src: '/assets/fotos/javi-llinares-perfil-1200px.jpg' }, CENS)).toBe(true);
    expect(esFotoDePersona({ src: '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/08-javi-llinares-perfil-1024px.jpg' }, CENS)).toBe(true);
    expect(esFotoDePersona({ src: '/assets/uploads/avatars/pepica-vall-comic.png' })).toBe(true);
    expect(esFotoDePersona({ src: '/assets/uploads/ajuntament/la-torre-de-les-macanes/avatar/IMG_20200904_143451.jpg' })).toBe(true);
    expect(esFotoDePersona({ src: 'sdp-media://mitjans/poble/u/perfil/a.webp' })).toBe(true);
    expect(esFotoDePersona({ src: '/assets/uploads/gent/x/posts/a.jpg' })).toBe(true);
    expect(esFotoDePersona({ ambit: 'persona', src: '/x.jpg' })).toBe(true);
    /* Sense el cens (encara no ha arribat): el nom del fitxer de perfil i el camp de l'arxiu bastan. */
    expect(esFotoDePersona({ src: '/assets/fotos/javi-llinares-perfil-1200px.jpg' })).toBe(true);
    expect(esFotoDePersona(LEGACY_MEDIA.find((item) => item.id === 'foto-javi'))).toBe(true);
    expect(LEGACY_MEDIA.filter((item) => esFotoDePersona(item)).map((item) => item.id)).toEqual(['foto-javi']);
    expect(esFotoDePersona({ src: '/assets/uploads/poble/la-torre-de-les-macanes/DSC00320.JPG' }, CENS)).toBe(false);
    expect(esFotoDePersona({ src: '/assets/towns/tibi/1.jpg' }, CENS)).toBe(false);
  });
});
