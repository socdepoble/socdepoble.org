/**
 * personaDeSessio.js · Ordre del Mestre, 13-10-2026 (pla 261013_1405, front A).
 * La barra negra pintava una «S»: un compte d'entrada amb contrasenya no porta
 * ni nom ni foto a les metadades i l'actor queia al correu. Ara mana la fila
 * de public.profiles, i les metadades són la reserva i manen mentre la fila
 * és d'abans d'una edició (firma). Dades sintètiques: cap compte real.
 */
import { describe, expect, test } from 'vitest';
import {
  avatarDePersona, firmaDePersona, mateixPerfil, nomDePersona, perfilDeFila, personaDeSessio, pobleDeLaPertinenca, triaAvatar
} from './personaDeSessio.js';

const FOTO = 'https://lh3.googleusercontent.com/a/pepa.png';
const FOTO_META = 'https://lh3.googleusercontent.com/a/pepa-meta.png';
const POBLE = 'La Torre de les Maçanes';
/* El símptoma: sessió de contrasenya, sense metadades, només el correu. */
const SENSE_METADADES = Object.freeze({ id: 'u-front-a', email: 'pepa@poble.test', user_metadata: Object.freeze({}) });
const FILA = Object.freeze({ id: 'u-front-a', full_name: 'Pepa Soler', avatar_url: FOTO, town_name: POBLE });

const perfilDe = (usuari, fila = FILA) => perfilDeFila(fila, usuari.id, firmaDePersona(usuari));

describe('personaDeSessio · la fila de profiles mana', () => {
  test('sense metadades, la persona pren el nom, la foto i el poble de la fila', () => {
    expect(personaDeSessio(SENSE_METADADES, perfilDe(SENSE_METADADES))).toEqual({ nom: 'Pepa Soler', avatar: FOTO, poble: POBLE });
  });

  test('control del símptoma: sense perfil, el nom és el correu (d’ací la «P» o la «S») i no hi ha foto ni poble', () => {
    expect(personaDeSessio(SENSE_METADADES, null)).toEqual({ nom: 'pepa@poble.test', avatar: null, poble: '' });
  });

  test('torna un objecte congelat i, sense sessió, null', () => {
    expect(Object.isFrozen(personaDeSessio(SENSE_METADADES, perfilDe(SENSE_METADADES)))).toBe(true);
    expect(personaDeSessio(null, perfilDe(SENSE_METADADES))).toBeNull();
    expect(personaDeSessio(undefined, null)).toBeNull();
  });

  test('camp a camp: una fila sense foto no esborra la foto de les metadades', () => {
    const usuari = { ...SENSE_METADADES, user_metadata: { picture: FOTO_META } };
    const perfil = perfilDe(usuari, { ...FILA, avatar_url: '' });
    expect(personaDeSessio(usuari, perfil)).toEqual({ nom: 'Pepa Soler', avatar: FOTO_META, poble: POBLE });
  });

  test('els valors de la fila es netegen d’espais; un nom en blanc cau a la reserva', () => {
    const perfil = perfilDe(SENSE_METADADES, { ...FILA, full_name: '   ', avatar_url: `  ${FOTO}  `, town_name: `  ${POBLE} ` });
    expect(personaDeSessio(SENSE_METADADES, perfil)).toEqual({ nom: 'pepa@poble.test', avatar: FOTO, poble: POBLE });
  });

  test.each([
    ['la fila', { ...FILA }, { town_name: 'Altre Poble' }, POBLE],
    ['les metadades, si la fila no en té', { ...FILA, town_name: '' }, { town_name: 'Altre Poble' }, 'Altre Poble'],
    ['cap: cadena buida', { ...FILA, town_name: null }, {}, '']
  ])('el poble ve de %s', (_cas, fila, meta, esperat) => {
    const usuari = { ...SENSE_METADADES, user_metadata: meta };
    expect(personaDeSessio(usuari, perfilDe(usuari, fila)).poble).toBe(esperat);
  });
});

describe('perfilDeFila · una fila que no és de veres no entra', () => {
  test('la fila de reserva de l’adaptador (només la sessió reescrita) no compta', () => {
    expect(perfilDeFila({ ...FILA, reserva: true }, SENSE_METADADES.id, firmaDePersona(SENSE_METADADES))).toBeNull();
    expect(personaDeSessio(SENSE_METADADES, perfilDeFila({ ...FILA, reserva: true }, SENSE_METADADES.id, ''))).toEqual({
      nom: 'pepa@poble.test', avatar: null, poble: ''
    });
  });

  test.each([
    ['d’un altre compte', { ...FILA, id: 'u-una-altra' }, 'u-front-a'],
    ['sense id', { ...FILA, id: undefined }, 'u-front-a'],
    ['sense compte de sessió', FILA, null],
    ['null', null, 'u-front-a'],
    ['que no és un objecte', 'Pepa Soler', 'u-front-a']
  ])('una fila %s torna null', (_cas, fila, usuariId) => {
    expect(perfilDeFila(fila, usuariId, 'firma')).toBeNull();
  });

  test('l’id es compara com a text i el perfil és congelat', () => {
    const perfil = perfilDeFila({ ...FILA, id: 42 }, '42', 'f');
    expect(perfil).toEqual({ usuariId: '42', firma: 'f', nom: 'Pepa Soler', avatar: FOTO, poble: POBLE });
    expect(Object.isFrozen(perfil)).toBe(true);
  });

  test('un perfil d’un altre compte no es pinta encara que arribe a personaDeSessio', () => {
    const altre = { id: 'u-una-altra', email: 'altra@poble.test', user_metadata: {} };
    expect(personaDeSessio(SENSE_METADADES, perfilDe(altre, { ...FILA, id: 'u-una-altra' })).nom).toBe('pepa@poble.test');
  });
});

describe('firma · una edició a l’app fa manar les metadades fins que arriba la fila nova', () => {
  test('les metadades editades després de llegir la fila guanyen: el perfil vell no es pinta', () => {
    const perfilVell = perfilDe(SENSE_METADADES);
    const editat = { ...SENSE_METADADES, user_metadata: { full_name: 'Pepa Nova', avatar_url: FOTO_META } };
    expect(personaDeSessio(editat, perfilVell)).toEqual({ nom: 'Pepa Nova', avatar: FOTO_META, poble: '' });
    /* Esborrar la foto a l'app (actualitzaUsuariSessio lleva avatar_url) també: cap foto vella. */
    const senseFoto = { ...SENSE_METADADES, user_metadata: { full_name: 'Pepa Soler' } };
    expect(personaDeSessio(senseFoto, perfilVell)).toEqual({ nom: 'Pepa Soler', avatar: null, poble: '' });
  });

  test.each([
    ['id', { id: 'u-altre' }],
    ['full_name', { user_metadata: { full_name: 'x' } }],
    ['name', { user_metadata: { name: 'x' } }],
    ['avatar_url', { user_metadata: { avatar_url: 'x' } }],
    ['picture', { user_metadata: { picture: 'x' } }],
    ['town_name', { user_metadata: { town_name: 'x' } }],
    ['full_name de l’usuari', { full_name: 'x' }],
    ['avatar_url de l’usuari', { avatar_url: 'x' }],
    ['email', { email: 'altra@poble.test' }]
  ])('canvia amb %s', (_camp, canvi) => {
    expect(firmaDePersona({ ...SENSE_METADADES, ...canvi })).not.toBe(firmaDePersona(SENSE_METADADES));
  });

  test('és determinista, no depén d’altres camps ni de la identitat de l’objecte, i sense sessió és buida', () => {
    expect(firmaDePersona({ ...SENSE_METADADES, access_token: 'testimoni', user_metadata: { ...SENSE_METADADES.user_metadata } }))
      .toBe(firmaDePersona(SENSE_METADADES));
    expect(firmaDePersona(null)).toBe('');
    expect(firmaDePersona(undefined)).toBe('');
  });

  test('dos camps no es confonen en ajuntar-los', () => {
    const a = { id: 'u', user_metadata: { full_name: 'ab', name: '' } };
    const b = { id: 'u', user_metadata: { full_name: 'a', name: 'b' } };
    expect(firmaDePersona(a)).not.toBe(firmaDePersona(b));
  });
});

describe('la reserva (T43): el nom, mudat sense canvis; la foto, per triaAvatar', () => {
  test.each([
    [{ user_metadata: { full_name: 'A', name: 'B' }, full_name: 'C', email: 'd@poble.test' }, 'A'],
    [{ user_metadata: { name: 'B' }, full_name: 'C', email: 'd@poble.test' }, 'B'],
    [{ full_name: 'C', email: 'd@poble.test' }, 'C'],
    [{ email: 'd@poble.test' }, 'd@poble.test'],
    [{}, 'El meu compte'],
    [null, 'El meu compte']
  ])('nomDePersona(%o) → %s', (usuari, esperat) => {
    expect(nomDePersona(usuari)).toBe(esperat);
  });

  /* Pla 261014_1450, front B (revisió) · URL de Google, que no són pròpies: amb 'a', 'b' i
     'c' (camins relatius del mateix origen a jsdom, i per tant pròpies) la
     prova passava per la regla de la pròpia, no per l'ordre de la reserva.
     Així fixa avatar_url > picture > avatar_url de l'usuari quan cap és
     pròpia; el cas de la pròpia és al bloc del front B. */
  const G_A = 'https://lh3.googleusercontent.com/a';
  const G_B = 'https://lh3.googleusercontent.com/b';
  const G_C = 'https://lh3.googleusercontent.com/c';
  test.each([
    [{ user_metadata: { avatar_url: G_A, picture: G_B }, avatar_url: G_C }, G_A],
    [{ user_metadata: { picture: G_B }, avatar_url: G_C }, G_B],
    [{ avatar_url: G_C }, G_C],
    [{}, null]
  ])('avatarDePersona(%o) → %s', (usuari, esperat) => {
    expect(avatarDePersona(usuari)).toBe(esperat);
  });

  test('sense cap nom enlloc, ni a la fila ni a la sessió: «El meu compte»', () => {
    const usuari = { id: 'u-sense-res' };
    expect(personaDeSessio(usuari, perfilDe(usuari, { id: 'u-sense-res', full_name: '' })).nom).toBe('El meu compte');
  });
});

/* Pla 261014_1450, front B (ordre del Mestre, 14-10-2026: «La prioritat
   d'avatars ha de ser estricta») · 1) la pujada a Sóc de Poble, 2) la del
   proveïdor d'entrada (Google…), 3) cap, i Avatar hi pinta les inicials. Les
   pujades són referències opaques del bucket públic 'mitjans', com les que
   desa PerfilEditor (storage.js, carpeta 'avatars'). */
const PUJADA = 'sdp-media://mitjans/la-torre/u-front-a/avatars/pepa.webp';
const PUJADA_META = 'sdp-media://mitjans/la-torre/u-front-a/avatars/pepa-meta.webp';

describe('front B · triaAvatar: pròpia > proveïdor d’entrada > cap', () => {
  test.each([
    ['la pròpia, encara que vinga després de la de Google', [FOTO, PUJADA], PUJADA],
    ['la pròpia, quan ja és la primera', [PUJADA, FOTO], PUJADA],
    ['entre dues pròpies, la primera', [FOTO, PUJADA, PUJADA_META], PUJADA],
    ['un camí de l’app també és propi', [FOTO, '/assets/fotos/pepa.jpg'], '/assets/fotos/pepa.jpg'],
    ['una data:image també és pròpia', [FOTO, 'data:image/png;base64,AAAA'], 'data:image/png;base64,AAAA'],
    ['sense cap pròpia, la primera de Google', [FOTO, FOTO_META], FOTO],
    ['els buits no compten: la primera no buida', ['', '   ', null, FOTO_META], FOTO_META],
    ['els valors es netegen d’espais', [`  ${PUJADA}  `], PUJADA],
    ['cap candidata, buides o que no són text: null', ['', '   ', null, undefined, 42, {}], null],
    ['sense candidates: null', [], null]
  ])('%s', (_cas, candidats, esperat) => {
    expect(triaAvatar(...candidats)).toBe(esperat);
  });
});

describe('front B · personaDeSessio pinta la pujada abans que la de Google', () => {
  const GOOGLE = Object.freeze({ avatar_url: FOTO_META, picture: FOTO_META });

  test('fila amb la pujada i metadades de Google → la pujada', () => {
    const usuari = { ...SENSE_METADADES, user_metadata: GOOGLE };
    expect(personaDeSessio(usuari, perfilDe(usuari, { ...FILA, avatar_url: PUJADA })).avatar).toBe(PUJADA);
  });

  test('fila amb la de Google (la que copia el trigger d’alta) i metadades amb la pujada → la pujada', () => {
    const usuari = { ...SENSE_METADADES, user_metadata: { avatar_url: PUJADA_META, picture: FOTO_META } };
    expect(personaDeSessio(usuari, perfilDe(usuari)).avatar).toBe(PUJADA_META);
  });

  test('una pujada a l’usuari de la sessió (actualitzaUsuariSessio) també guanya a la de Google de les metadades', () => {
    const usuari = { ...SENSE_METADADES, user_metadata: GOOGLE, avatar_url: PUJADA_META };
    expect(personaDeSessio(usuari, perfilDe(usuari)).avatar).toBe(PUJADA_META);
    expect(avatarDePersona(usuari)).toBe(PUJADA_META);
  });

  test('només fotos de Google → la de la fila, com sempre', () => {
    const usuari = { ...SENSE_METADADES, user_metadata: GOOGLE };
    expect(personaDeSessio(usuari, perfilDe(usuari)).avatar).toBe(FOTO);
  });

  test('cap foto enlloc → null (Avatar hi pinta les inicials)', () => {
    expect(personaDeSessio(SENSE_METADADES, perfilDe(SENSE_METADADES, { ...FILA, avatar_url: '' })).avatar).toBeNull();
  });

  test('firma invàlida: la fila no entra encara que siga una pujada', () => {
    const perfilVell = perfilDe(SENSE_METADADES, { ...FILA, avatar_url: PUJADA });
    const editat = { ...SENSE_METADADES, user_metadata: { full_name: 'Pepa Nova', avatar_url: FOTO_META } };
    expect(personaDeSessio(editat, perfilVell).avatar).toBe(FOTO_META);
  });

  test('esborrar la pujada → null: ni la fila vella ni cap reserva', () => {
    const ambPujada = { ...SENSE_METADADES, user_metadata: { full_name: 'Pepa Soler', avatar_url: PUJADA }, avatar_url: PUJADA };
    const perfilVell = perfilDe(ambPujada, { ...FILA, avatar_url: PUJADA });
    expect(personaDeSessio(ambPujada, perfilVell).avatar).toBe(PUJADA);
    /* actualitzaUsuariSessio en esborrar: fora avatar_url i picture de les
       metadades i avatar_url de l'usuari. La firma canvia. */
    const esborrat = { ...SENSE_METADADES, user_metadata: { full_name: 'Pepa Soler' } };
    expect(personaDeSessio(esborrat, perfilVell).avatar).toBeNull();
    /* I la fila rellegida, ja sense foto, tampoc en porta cap. */
    expect(personaDeSessio(esborrat, perfilDe(esborrat, { ...FILA, avatar_url: '' })).avatar).toBeNull();
  });
});

describe('mateixPerfil i pobleDeLaPertinenca', () => {
  test('mateixPerfil compara els cinc camps', () => {
    const a = perfilDe(SENSE_METADADES);
    expect(mateixPerfil(a, perfilDe(SENSE_METADADES))).toBe(true);
    expect(mateixPerfil(a, a)).toBe(true);
    expect(mateixPerfil(a, null)).toBe(false);
    expect(mateixPerfil(null, null)).toBe(true);
    for (const camp of ['usuariId', 'firma', 'nom', 'avatar', 'poble']) {
      expect([camp, mateixPerfil(a, { ...a, [camp]: 'altre' })]).toEqual([camp, false]);
    }
  });

  test.each([
    [{ town_name: POBLE }, POBLE],
    [{ town_name: `  ${POBLE} ` }, POBLE],
    [{ town_name: null }, ''],
    [{}, ''],
    [null, '']
  ])('pobleDeLaPertinenca(%o) → «%s»', (membership, esperat) => {
    expect(pobleDeLaPertinenca(membership)).toBe(esperat);
  });
});
