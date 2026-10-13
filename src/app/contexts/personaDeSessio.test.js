/**
 * personaDeSessio.js · Ordre del Mestre, 13-10-2026 (pla 261013_1405, front A).
 * La barra negra pintava una «S»: un compte d'entrada amb contrasenya no porta
 * ni nom ni foto a les metadades i l'actor queia al correu. Ara mana la fila
 * de public.profiles, i les metadades són la reserva i manen mentre la fila
 * és d'abans d'una edició (firma). Dades sintètiques: cap compte real.
 */
import { describe, expect, test } from 'vitest';
import {
  avatarDePersona, firmaDePersona, mateixPerfil, nomDePersona, perfilDeFila, personaDeSessio, pobleDeLaPertinenca
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

describe('la reserva de sempre (T43), mudada sense canvis', () => {
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

  test.each([
    [{ user_metadata: { avatar_url: 'a', picture: 'b' }, avatar_url: 'c' }, 'a'],
    [{ user_metadata: { picture: 'b' }, avatar_url: 'c' }, 'b'],
    [{ avatar_url: 'c' }, 'c'],
    [{}, null]
  ])('avatarDePersona(%o) → %s', (usuari, esperat) => {
    expect(avatarDePersona(usuari)).toBe(esperat);
  });

  test('sense cap nom enlloc, ni a la fila ni a la sessió: «El meu compte»', () => {
    const usuari = { id: 'u-sense-res' };
    expect(personaDeSessio(usuari, perfilDe(usuari, { id: 'u-sense-res', full_name: '' })).nom).toBe('El meu compte');
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
