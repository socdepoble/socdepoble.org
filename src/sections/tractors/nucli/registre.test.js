// @vitest-environment node
import { describe, expect, test } from 'vitest';
import {
  CAMPS_DERIVATS, ESTATS, avaluaEstat, instantDe, ordenaRegistres, preimatgeRegistre, rangNivell, validaManifest, validaRegistre
} from './registre.js';

const EMPREMTA_A = `sha256:${'a'.repeat(64)}`;
const EMPREMTA_B = `sha256:${'b'.repeat(64)}`;
const NONCE = 'AAECAwQFBgcICQoLDA0ODw';

function manifest(canvis = {}) {
  return {
    schema: 'sdp.tractor.v1',
    id: 'sdp.gestoria-lector',
    nom: 'Lector de factures',
    versio: '1.0.0',
    descripcio: 'Llig les factures de la carpeta triada i prepara el full trimestral.',
    fitxa: 'tractors/gestoria/fitxa.md',
    fonts: ['src/gestoria/lector.js', 'src/gestoria/full.js'],
    llig: ['factures/**'],
    escriu: ['eixida/**'],
    xarxa: 'cap',
    dadesPersonals: true,
    nivellMinim: 'confirmacio',
    caducitatDies: null,
    ...canvis
  };
}

let comptador = 0;
function registre(canvis = {}) {
  comptador += 1;
  const nonce = new Uint8Array(16).fill(comptador & 0xff);
  return {
    schema: 'sdp.aprovacio.v1',
    tractor: 'sdp.gestoria-lector',
    versio: '1.0.0',
    empremta: EMPREMTA_A,
    decisio: 'aprovat',
    nivell: 'confirmacio',
    data: '2026-10-01T10:00:00.000Z',
    caduca: null,
    nonce: Buffer.from(nonce).toString('base64url'),
    ...canvis
  };
}

function prova() {
  return { tipus: 'webauthn', credencial: 'AQID', authenticatorData: 'BAUG', clientDataJSON: 'BwgJ', signatura: 'CgsM' };
}

const ARA = '2026-10-02T12:00:00.000Z';

describe('validaManifest', () => {
  test('un manifest complet no té errors', () => {
    expect(validaManifest(manifest())).toEqual([]);
    expect(validaManifest(manifest({ nivellMinim: 'signatura', caducitatDies: 90, xarxa: 'api.example.org' }))).toEqual([]);
  });

  test('admet els camps derivats', () => {
    const ambDerivats = manifest();
    for (const camp of CAMPS_DERIVATS) ambDerivats[camp] = 'qualsevol';
    expect(validaManifest(ambDerivats)).toEqual([]);
  });

  test.each([
    ['schema', { schema: 'sdp.tractor.v2' }],
    ['id sense punt', { id: 'gestoria' }],
    ['id en majúscules', { id: 'Sdp.Gestoria' }],
    ['nom buit', { nom: '  ' }],
    ['versio no semver', { versio: '1.0' }],
    ['descripcio absent', { descripcio: undefined }],
    ['fitxa absoluta', { fitxa: '/etc/fitxa.md' }],
    ['fitxa amb ..', { fitxa: '../fitxa.md' }],
    ['fonts buides', { fonts: [] }],
    ['font amb barra inversa', { fonts: ['src\\a.js'] }],
    ['fonts repetides', { fonts: ['a.js', 'a.js'] }],
    ['llig no és llista', { llig: 'factures' }],
    ['escriu amb buits', { escriu: [''] }],
    ['xarxa buida', { xarxa: '' }],
    ['dadesPersonals no booleà', { dadesPersonals: 'si' }],
    ['nivellMinim desconegut', { nivellMinim: 'maxim' }],
    ['caducitatDies zero', { caducitatDies: 0 }],
    ['caducitatDies decimal', { caducitatDies: 1.5 }],
    ['caducitatDies absent', { caducitatDies: undefined }],
    ['camp desconegut', { extra: true }]
  ])('detecta %s', (_nom, canvis) => {
    expect(validaManifest(manifest(canvis)).length).toBeGreaterThan(0);
  });

  test('no és un objecte', () => {
    expect(validaManifest(null)).toHaveLength(1);
    expect(validaManifest([])).toHaveLength(1);
  });
});

describe('validaRegistre', () => {
  test('confirmació sense prova i signatura amb prova són vàlides', () => {
    expect(validaRegistre(registre())).toEqual([]);
    expect(validaRegistre(registre({ nivell: 'signatura', prova: prova() }))).toEqual([]);
    expect(validaRegistre(registre({ caduca: '2027-01-01T00:00:00.000Z' }))).toEqual([]);
  });

  test.each([
    ['signatura sense prova', { nivell: 'signatura' }],
    ['confirmació amb prova', { prova: prova() }],
    ['prova d\'un altre tipus', { nivell: 'signatura', prova: { ...prova(), tipus: 'u2f' } }],
    ['prova amb camp estrany', { nivell: 'signatura', prova: { ...prova(), extra: 'x' } }],
    ['prova amb base64 clàssic', { nivell: 'signatura', prova: { ...prova(), signatura: 'ab+/' } }],
    ['nonce curt', { nonce: 'AAEC' }],
    ['nonce no canònic', { nonce: `${NONCE.slice(0, 21)}x` }],
    ['data sense zona', { data: '2026-10-01T10:00:00' }],
    ['data impossible', { data: '2026-02-31T10:00:00.000Z' }],
    ['caduca abans de data', { caduca: '2026-09-01T00:00:00.000Z' }],
    ['empremta curta', { empremta: 'sha256:abc' }],
    ['decisio desconeguda', { decisio: 'potser' }],
    ['tractor invàlid', { tractor: 'Gestoria' }],
    ['camp desconegut', { comentari: 'x' }]
  ])('detecta %s', (_nom, canvis) => {
    expect(validaRegistre(registre(canvis)).length).toBeGreaterThan(0);
  });
});

describe('utilitats', () => {
  test('instantDe accepta Date, número i ISO UTC estricte', () => {
    const ms = Date.UTC(2026, 9, 2, 12);
    expect(instantDe(new Date(ms))).toBe(ms);
    expect(instantDe(ms)).toBe(ms);
    expect(instantDe('2026-10-02T12:00:00.000Z')).toBe(ms);
    expect(instantDe('2026-10-02T12:00:00Z')).toBe(ms);
    expect(instantDe('2026-10-02T14:00:00+02:00')).toBeNaN();
    expect(instantDe('ahir')).toBeNaN();
    expect(instantDe(NaN)).toBeNaN();
    expect(instantDe(null)).toBeNaN();
  });

  test('rangNivell ordena confirmació < signatura', () => {
    expect(rangNivell('confirmacio')).toBeLessThan(rangNivell('signatura'));
    expect(rangNivell('cap')).toBe(-1);
  });

  test('preimatgeRegistre és canònica i ignora la prova', () => {
    const base = registre({ nivell: 'signatura' });
    const ambProva = { ...base, prova: prova() };
    expect(preimatgeRegistre(ambProva)).toBe(preimatgeRegistre(base));
    expect(preimatgeRegistre(base)).not.toContain(' ');
    expect(Object.keys(JSON.parse(preimatgeRegistre(base)))).toEqual(Object.keys(base).sort());
    expect(() => preimatgeRegistre(null)).toThrow(TypeError);
  });

  test('ordenaRegistres per data; en empat, la revocació guanya', () => {
    const tard = registre({ data: '2026-10-03T00:00:00.000Z' });
    const prompte = registre({ data: '2026-09-01T00:00:00.000Z' });
    const revocat = registre({ decisio: 'revocat', data: '2026-10-03T00:00:00.000Z' });
    expect(ordenaRegistres([revocat, tard, prompte])).toEqual([prompte, tard, revocat]);
    expect(ordenaRegistres([tard, revocat, prompte])).toEqual([prompte, tard, revocat]);
  });
});

describe('avaluaEstat', () => {
  const avalua = (registres, canvisManifest = {}, empremta = EMPREMTA_A, ara = ARA) =>
    avaluaEstat({ manifest: manifest(canvisManifest), empremta, registres, ara });

  test('els estats possibles', () => {
    expect(ESTATS).toEqual(['pendent', 'aprovat', 'caducat', 'revocat', 'empremta-divergent']);
  });

  test('sense registres: pendent', () => {
    const estat = avalua([]);
    expect(estat).toMatchObject({ estat: 'pendent', registre: null });
    expect(estat.motiu).toMatch(/mai/);
    expect(avalua(undefined).estat).toBe('pendent');
  });

  test('ignora els registres d\'altres tractors', () => {
    expect(avalua([registre({ tractor: 'sdp.altre' })]).estat).toBe('pendent');
  });

  test('aprovació vigent: aprovat, amb el registre', () => {
    const r = registre();
    expect(avalua([r])).toMatchObject({ estat: 'aprovat', registre: r });
  });

  test('l\'últim per data mana, sense importar l\'ordre d\'entrada', () => {
    const aprovat = registre({ data: '2026-09-01T00:00:00.000Z' });
    const revocat = registre({ decisio: 'revocat', data: '2026-09-15T00:00:00.000Z' });
    const reaprovat = registre({ data: '2026-10-01T00:00:00.000Z' });
    expect(avalua([aprovat, revocat]).estat).toBe('revocat');
    expect(avalua([revocat, aprovat]).estat).toBe('revocat');
    expect(avalua([reaprovat, revocat, aprovat])).toMatchObject({ estat: 'aprovat', registre: reaprovat });
  });

  test('empremta diferent: empremta-divergent', () => {
    expect(avalua([registre()], {}, EMPREMTA_B)).toMatchObject({ estat: 'empremta-divergent' });
  });

  test('versió diferent amb la mateixa empremta: empremta-divergent', () => {
    expect(avalua([registre({ versio: '0.9.0' })]).estat).toBe('empremta-divergent');
  });

  test('caducat quan arriba la data de caducitat', () => {
    const r = registre({ caduca: '2026-10-02T00:00:00.000Z' });
    expect(avalua([r]).estat).toBe('caducat');
    expect(avalua([r], {}, EMPREMTA_A, '2026-10-02T00:00:00.000Z').estat).toBe('caducat');
    expect(avalua([r], {}, EMPREMTA_A, '2026-10-01T23:59:59.999Z').estat).toBe('aprovat');
  });

  test('caducitatDies del manifest s\'aplica encara que el registre no caduque', () => {
    const r = registre({ data: '2026-09-01T00:00:00.000Z' });
    expect(avalua([r], { caducitatDies: 30 }).estat).toBe('caducat');
    expect(avalua([r], { caducitatDies: 32 }).estat).toBe('aprovat');
  });

  test('nivell insuficient: pendent amb el registre i el motiu', () => {
    const r = registre();
    const estat = avalua([r], { nivellMinim: 'signatura' });
    expect(estat).toMatchObject({ estat: 'pendent', registre: r });
    expect(estat.motiu).toMatch(/signatura/);
  });

  test('una signatura satisfà un mínim de confirmació', () => {
    expect(avalua([registre({ nivell: 'signatura', prova: prova() })]).estat).toBe('aprovat');
  });

  test('un registre malformat del tractor bloqueja (fail-closed)', () => {
    const bo = registre();
    const dolent = { ...registre({ data: '2026-10-01T11:00:00.000Z' }), nonce: 'x' };
    expect(avalua([bo, dolent])).toMatchObject({ estat: 'pendent', registre: null });
  });

  test('un registre amb data futura bloqueja', () => {
    const futur = registre({ data: '2026-12-01T00:00:00.000Z' });
    expect(avalua([registre(), futur])).toMatchObject({ estat: 'pendent', registre: futur });
  });

  test('entrades dolentes: pendent, mai aprovat', () => {
    const r = registre();
    expect(avalua([r], { schema: 'x' }).estat).toBe('pendent');
    expect(avalua([r], {}, 'sha256:xyz').estat).toBe('pendent');
    expect(avalua([r], {}, EMPREMTA_A, 'demà').estat).toBe('pendent');
    expect(avaluaEstat().estat).toBe('pendent');
  });
});
