/* Indicadors del Tauler d'administració (decisió del Mestre 261003,
   «Graphfy»): les funcions pures d'agregació. Totes les dades són
   sintètiques (correus de poble.test). «ara» és sempre fix: cap prova depén
   del rellotge ni de la zona de qui les executa. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { nivellHistograma } from '../../components/PedraSeca/index.js';
import {
  LLINDAR_GRUP_PETIT, TEXT_PROTEGIT, altesPerMes, barresHistograma, darrerAcces, entitatsPerTipus, formatNombre,
  protegixRecompte, protegixSerie
} from './indicadors.js';

const ARA = new Date('2026-10-15T10:00:00Z');
const DIA = 24 * 60 * 60 * 1000;
const faDies = (dies) => new Date(ARA.getTime() - dies * DIA).toISOString();

let seq = 0;
const persona = (created_at, last_sign_in_at = null) => {
  seq += 1;
  return { id: `p-${seq}`, email: `persona${seq}@poble.test`, created_at, last_sign_in_at };
};
const repetix = (n, fes) => Array.from({ length: n }, fes);
const clausDe = (grups) => grups.map((g) => g.clau);
const textDe = (grups, clau) => grups.find((g) => g.clau === clau).text;
const textos = (serie) => serie.grups.map((g) => g.text);

/* L'intrús que llig el panell i sap el total d'una sèrie: d'una xifra
   exacta en sap el valor; d'un «menys de L», que va d'1 a L−1; d'una «xifra
   protegida», que no és petita ni zero (L o més). Cada domini és un interval
   d'enters, i la suma d'intervals cobrix tots els enters entre la suma dels
   mínims i la dels màxims: per a cada grup petit, torna els valors que
   encaixen amb el total. */
function valorsPossibles(grups, total, llindar = LLINDAR_GRUP_PETIT) {
  const domini = (g) => {
    if (g.petit) return [1, llindar - 1];
    if (g.amagat) return [llindar, Infinity];
    return [g.recompte, g.recompte];
  };
  const resultat = new Map();
  grups.forEach((g, i) => {
    if (!g.petit) return;
    const altres = grups.filter((_, j) => j !== i).map(domini);
    const minim = altres.reduce((s, [a]) => s + a, 0);
    const maxim = altres.reduce((s, [, b]) => s + b, 0);
    const valors = [];
    for (let v = 1; v < llindar; v += 1) if (total - v >= minim && total - v <= maxim) valors.push(v);
    resultat.set(i, valors);
  });
  return resultat;
}

/* Tots els vectors de `n` recomptes que sumen `total` o menys. */
function vectors(n, total) {
  if (n === 0) return [[]];
  const eixida = [];
  for (let primer = 0; primer <= total; primer += 1) {
    for (const resta of vectors(n - 1, total - primer)) eixida.push([primer, ...resta]);
  }
  return eixida;
}

/* Tots els vectors de `n` recomptes, cadascun de 0 a `maxim`. */
function graella(n, maxim) {
  let eixida = [[]];
  for (let i = 0; i < n; i += 1) {
    eixida = eixida.flatMap((v) => Array.from({ length: maxim + 1 }, (_, valor) => [...v, valor]));
  }
  return eixida;
}

afterEach(() => { vi.useRealTimers(); });

describe('protegixRecompte', () => {
  test('zero i a partir del llindar, la xifra; d’1 a 4, «menys de 5» i cap xifra', () => {
    expect(LLINDAR_GRUP_PETIT).toBe(5);
    expect(protegixRecompte(0)).toEqual({ recompte: 0, text: '0', petit: false });
    for (const n of [1, 2, 3, 4]) expect(protegixRecompte(n)).toEqual({ recompte: null, text: 'menys de 5', petit: true });
    expect(protegixRecompte(5)).toEqual({ recompte: 5, text: '5', petit: false });
    expect(protegixRecompte(12)).toEqual({ recompte: 12, text: '12', petit: false });
  });

  test('el llindar es pot canviar', () => {
    expect(protegixRecompte(2, 3)).toEqual({ recompte: null, text: 'menys de 3', petit: true });
    expect(protegixRecompte(3, 3)).toEqual({ recompte: 3, text: '3', petit: false });
  });

  test('un recompte que no és un enter no negatiu és un error de programació', () => {
    for (const dolent of [-1, 1.5, Number.NaN, Infinity, '3', null, undefined]) {
      expect(() => protegixRecompte(dolent)).toThrow(TypeError);
    }
  });

  test('els milers porten el separador valencià', () => {
    expect(formatNombre(1234)).toMatch(/^1.?234$/);
    expect(formatNombre(12345)).toBe('12.345');
  });
});

describe('protegixSerie', () => {
  test('sense grups petits, totes les xifres', () => {
    const serie = protegixSerie([0, 5, 12, 0]);
    expect(serie.protegida).toBe(false);
    expect(textos(serie)).toEqual(['0', '5', '12', '0']);
    expect(serie.grups.every((g) => !g.petit && !g.amagat)).toBe(true);
  });

  test('un grup petit sol s’amaga amb el grup no buit més pròxim; mai amb un zero', () => {
    const serie = protegixSerie([0, 3, 0, 8, 20]);
    expect(textos(serie)).toEqual(['0', 'menys de 5', '0', TEXT_PROTEGIT, '20']);
    expect(serie.grups[3]).toEqual({ recompte: null, text: TEXT_PROTEGIT, petit: false, amagat: true });
    expect(serie.grups[1]).toEqual({ recompte: null, text: 'menys de 5', petit: true, amagat: false });
  });

  test('la tria va per proximitat, no per valor; si empaten, el primer', () => {
    expect(textos(protegixSerie([9, 2, 30]))).toEqual([TEXT_PROTEGIT, 'menys de 5', '30']);
    expect(textos(protegixSerie([30, 2, 9]))).toEqual([TEXT_PROTEGIT, 'menys de 5', '9']);
  });

  test('si un grup protegit no basta, se n’amaguen més', () => {
    expect(textos(protegixSerie([1, 5, 9, 40]))).toEqual(['menys de 5', TEXT_PROTEGIT, TEXT_PROTEGIT, '40']);
  });

  test('dos grups petits que sumen el llindar es cobrixen entre ells', () => {
    expect(textos(protegixSerie([2, 3, 10]))).toEqual(['menys de 5', 'menys de 5', '10']);
  });

  test('si ni amagant-los tots n’hi ha prou, la sèrie sencera queda protegida', () => {
    for (const recomptes of [[3, 0, 5], [0, 4, 0], [1, 1, 0]]) {
      const serie = protegixSerie(recomptes);
      expect(serie.protegida).toBe(true);
      expect(serie.grups.every((g) => g.recompte === null && g.text === TEXT_PROTEGIT && !g.petit && g.amagat)).toBe(true);
    }
  });

  test('un recompte invàlid és un error de programació', () => {
    expect(() => protegixSerie([1, -1])).toThrow(TypeError);
    expect(() => protegixSerie([1.5])).toThrow(TypeError);
  });

  test('garantia: amb el total sabut, cada «menys de 5» pot valdre qualsevol xifra d’1 a 4 (tots els vectors de 4 grups de 0 a 12)', () => {
    let ambPetits = 0;
    for (const recomptes of graella(4, 12)) {
      const serie = protegixSerie(recomptes);
      if (serie.protegida) continue;
      const total = recomptes.reduce((a, b) => a + b, 0);
      for (const [i, valors] of valorsPossibles(serie.grups, total)) {
        ambPetits += 1;
        expect(valors, `${recomptes} · grup ${i}`).toEqual([1, 2, 3, 4]);
      }
    }
    expect(ambPetits).toBeGreaterThan(10000);
  });

  test('ni sabent el mètode: cap «menys de 5» queda fixat en una sola xifra (sèries de 3, 5 i 6 grups)', () => {
    for (const [n, maxim] of [[3, 24], [5, 14], [6, 12]]) {
      const vistos = new Map();
      for (const recomptes of vectors(n, maxim)) {
        const serie = protegixSerie(recomptes);
        const total = recomptes.reduce((a, b) => a + b, 0);
        const clau = `${total}|${textos(serie).join('/')}`;
        if (!vistos.has(clau)) vistos.set(clau, serie.grups.map(() => new Set()));
        serie.grups.forEach((g, i) => { if (g.petit) vistos.get(clau)[i].add(recomptes[i]); });
      }
      const ambPetit = [...vistos.values()].flat().filter((valors) => valors.size > 0);
      const fixats = [...vistos].flatMap(([clau, conjunts]) => conjunts
        .map((valors, i) => (valors.size === 1 ? `${clau} · grup ${i}` : null)).filter(Boolean));
      expect(ambPetit.length, `${n} grups`).toBeGreaterThan(100);
      expect(fixats, `${n} grups`).toEqual([]);
    }
  });
});

describe('altesPerMes', () => {
  test('la finestra són els 12 últims mesos, amb el mes d’«ara» marcat i les marques de trimestre', () => {
    const { mesos } = altesPerMes([], { ara: ARA });
    expect(clausDe(mesos)).toEqual([
      '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04',
      '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'
    ]);
    expect(mesos[0].etiqueta).toBe('novembre de 2025');
    expect(mesos[4].etiqueta).toBe('març de 2026');
    expect(mesos[11].etiqueta).toBe('octubre de 2026 (mes en curs, parcial)');
    expect(mesos.filter((m) => m.enCurs).map((m) => m.clau)).toEqual(['2026-10']);
    expect(mesos.map((m) => m.marca)).toEqual(['', '', 'gen.', '', '', 'abr.', '', '', 'jul.', '', '', 'oct.']);
  });

  test('el mes en curs sempre porta el seu nom, i el mes d’abans en cedix la marca', () => {
    const novembre = altesPerMes([], { ara: new Date('2026-11-20T12:00:00Z') }).mesos;
    expect(novembre.map((m) => m.marca)).toEqual(['', 'gen.', '', '', 'abr.', '', '', 'jul.', '', '', '', 'nov.']);
    const juny = altesPerMes([], { ara: new Date('2026-06-02T12:00:00Z') }).mesos;
    expect(juny.map((m) => m.marca)).toEqual(['jul.', '', '', 'oct.', '', '', 'gen.', '', '', 'abr.', '', 'juny']);
  });

  test('el canvi d’any: amb «ara» al gener, de febrer de l’any passat a gener', () => {
    const { mesos } = altesPerMes([], { ara: new Date('2026-01-10T12:00:00Z') });
    expect(mesos[0].clau).toBe('2025-02');
    expect(mesos[11]).toMatchObject({ clau: '2026-01', etiqueta: 'gener de 2026 (mes en curs, parcial)', marca: 'gen.' });
  });

  test('compta les altes de cada mes; un grup petit no porta la xifra, i el mes no buit més pròxim tampoc', () => {
    const persones = [
      ...repetix(6, () => persona('2026-09-12T16:00:00Z')),
      ...repetix(3, () => persona('2026-08-02T08:00:00Z')),
      ...repetix(9, () => persona('2026-03-02T08:00:00Z'))
    ];
    const { mesos, total, buit, protegida } = altesPerMes(persones, { ara: ARA });
    expect(buit).toBe(false);
    expect(protegida).toBe(false);
    expect(textDe(mesos, '2026-08')).toBe('menys de 5');
    expect(mesos.find((m) => m.clau === '2026-08').recompte).toBeNull();
    expect(textDe(mesos, '2026-09')).toBe(TEXT_PROTEGIT);
    expect(mesos.find((m) => m.clau === '2026-09')).toMatchObject({ recompte: null, amagat: true, petit: false });
    expect(textDe(mesos, '2026-03')).toBe('9');
    expect(textDe(mesos, '2026-07')).toBe('0');
    // Amb un grup amagat, el total el delataria per resta: no n'hi ha.
    expect(total).toBeNull();
  });

  test('sense cap grup petit, el total de la finestra', () => {
    const persones = [
      ...repetix(6, () => persona('2026-09-12T16:00:00Z')),
      ...repetix(5, () => persona('2026-03-02T08:00:00Z'))
    ];
    expect(altesPerMes(persones, { ara: ARA }).total).toEqual({ etiqueta: 'Total dels 12 mesos', recompte: 11, text: '11', petit: false });
  });

  test('els mesos es tallen en la zona del poble, no en la de qui executa', () => {
    const vora = [
      ...repetix(5, () => persona('2026-03-31T22:30:00Z')), // 1 d'abril a les 00.30 a Europe/Madrid
      ...repetix(5, () => persona('2026-03-31T21:30:00Z'))  // 31 de març a les 23.30
    ];
    const madrid = altesPerMes(vora, { ara: ARA });
    expect(textDe(madrid.mesos, '2026-03')).toBe('5');
    expect(textDe(madrid.mesos, '2026-04')).toBe('5');
    const utc = altesPerMes(vora, { ara: ARA, zona: 'UTC' });
    expect(textDe(utc.mesos, '2026-03')).toBe('10');
    expect(textDe(utc.mesos, '2026-04')).toBe('0');
  });

  test('llig els microsegons de Postgres i els mil·lisegons', () => {
    const persones = [
      ...repetix(3, () => persona('2026-09-12T16:00:00.123456+00:00')),
      ...repetix(2, () => persona(Date.parse('2026-09-20T10:00:00Z')))
    ];
    const { mesos, descartades } = altesPerMes(persones, { ara: ARA });
    expect(textDe(mesos, '2026-09')).toBe('5');
    expect(descartades).toEqual({ recompte: 0, text: '0', petit: false, amagat: false });
  });

  test('les dates il·legibles es descarten i es diuen; les de fora de la finestra no compten', () => {
    const persones = [
      persona('no és una data'), persona(''), persona(null), persona(undefined), persona({}), persona('2026-13-45'),
      persona('2026-02-30T99:00:00Z'),
      persona('2024-01-01T00:00:00Z'), persona('2027-06-01T00:00:00Z')
    ];
    const { mesos, descartades, buit } = altesPerMes(persones, { ara: ARA });
    expect(buit).toBe(false);
    expect(descartades).toEqual({ recompte: 7, text: '7', petit: false, amagat: false });
    expect(mesos.every((m) => m.text === '0')).toBe(true);
  });

  test('poques descartades i cap altre grup que les cobrisca: la sèrie sencera queda protegida', () => {
    const resultat = altesPerMes([persona('x'), persona('y')], { ara: ARA });
    expect(resultat.protegida).toBe(true);
    expect(resultat.descartades).toEqual({ recompte: null, text: TEXT_PROTEGIT, petit: false, amagat: true });
    expect(resultat.mesos.every((m) => m.recompte === null && m.amagat)).toBe(true);
    expect(resultat.total).toBeNull();
  });

  test('buit: cap llista, una llista buida o files que no són objectes', () => {
    for (const entrada of [[], null, undefined, 'x', {}, [null, 3, 'x']]) {
      const resultat = altesPerMes(entrada, { ara: ARA });
      expect(resultat.buit).toBe(true);
      expect(resultat.protegida).toBe(false);
      expect(resultat.mesos).toHaveLength(12);
      expect(resultat.mesos.every((m) => m.text === '0')).toBe(true);
      expect(resultat.total).toMatchObject({ recompte: 0, text: '0' });
    }
  });

  test('determinista: el mateix «ara» dona el mateix resultat, faça el rellotge el que faça', () => {
    const persones = repetix(7, (_, i) => persona(`2026-0${(i % 9) + 1}-10T10:00:00Z`));
    const primer = altesPerMes(persones, { ara: ARA });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2031-05-05T05:05:05Z'));
    expect(altesPerMes(persones, { ara: ARA })).toEqual(primer);
    expect(altesPerMes(persones, { ara: ARA.getTime() })).toEqual(primer);
    expect(altesPerMes(persones, { ara: ARA.toISOString() })).toEqual(primer);
  });

  test('sense un «ara» vàlid, o amb una finestra impossible, és un error', () => {
    for (const ara of [undefined, null, 'ahir', new Date('x'), {}]) expect(() => altesPerMes([], { ara })).toThrow(TypeError);
    expect(() => altesPerMes([])).toThrow(TypeError);
    for (const mesos of [0, 121, 1.5, '12']) expect(() => altesPerMes([], { ara: ARA, mesos })).toThrow(TypeError);
    expect(clausDe(altesPerMes([], { ara: ARA, mesos: 3 }).mesos)).toEqual(['2026-08', '2026-09', '2026-10']);
  });

  test('privacitat: el resultat no porta cap correu ni cap identificador', () => {
    const persones = repetix(9, () => persona('2026-09-12T16:00:00Z', faDies(3)));
    const text = JSON.stringify(altesPerMes(persones, { ara: ARA }));
    for (const p of persones) {
      expect(text).not.toContain(p.email);
      expect(text).not.toContain(p.id);
    }
  });
});

describe('darrerAcces', () => {
  test('els trams van en ordre de temps, amb les vores incloses al tram de dalt', () => {
    const persones = [
      ...repetix(5, () => persona('2026-01-01T00:00:00Z', faDies(30))),   // 30 dies justos: primer tram
      ...repetix(5, () => persona('2026-01-01T00:00:00Z', faDies(30.5))), // segon
      ...repetix(5, () => persona('2026-01-01T00:00:00Z', faDies(90))),   // segon
      ...repetix(5, () => persona('2026-01-01T00:00:00Z', faDies(365))),  // tercer
      ...repetix(6, () => persona('2026-01-01T00:00:00Z', faDies(400))),  // més d'un any
      ...repetix(5, () => persona('2026-01-01T00:00:00Z', null))          // mai
    ];
    const { trams, total, descartades, buit, protegida } = darrerAcces(persones, { ara: ARA });
    expect(clausDe(trams)).toEqual(['fins-30-dies', 'fins-90-dies', 'fins-365-dies', 'mes-d-un-any', 'mai']);
    expect(trams.map((t) => t.text)).toEqual(['5', '10', '5', '6', '5']);
    expect(trams.map((t) => t.etiqueta)).toEqual(['Fa 30 dies o menys', 'Fa de 31 a 90 dies', 'Fa de 91 a 365 dies', 'Fa més d’un any', 'No han entrat mai']);
    expect(total).toEqual({ etiqueta: 'Total', recompte: 31, text: '31', petit: false });
    expect(descartades.text).toBe('0');
    expect(buit).toBe(false);
    expect(protegida).toBe(false);
  });

  test('mai: null, absent o text buit; una entrada futura compta com a recent; una il·legible es descarta', () => {
    const persones = [
      persona('2026-01-01T00:00:00Z', null), persona('2026-01-01T00:00:00Z', undefined), persona('2026-01-01T00:00:00Z', '  '),
      { id: 'sense-camp', email: 'sense@poble.test', created_at: '2026-01-01T00:00:00Z' },
      persona('2026-01-01T00:00:00Z', '2026-10-15T11:00:00Z'),
      persona('2026-01-01T00:00:00Z', 'demà')
    ];
    const { trams, total, descartades } = darrerAcces(persones, { ara: ARA });
    // Tres grups petits (4 + 1 + 1) que, amb el total, ja es cobrixen entre ells.
    expect(textDe(trams, 'mai')).toBe('menys de 5');
    expect(textDe(trams, 'fins-30-dies')).toBe('menys de 5');
    expect(textDe(trams, 'fins-90-dies')).toBe('0');
    expect(descartades).toEqual({ recompte: null, text: 'menys de 5', petit: true, amagat: false });
    expect(total).toBeNull();
  });

  test('un sol tram petit: s’amaga també el tram no buit més pròxim', () => {
    const persones = [
      ...repetix(12, () => persona('2026-01-01T00:00:00Z', faDies(3))),
      ...repetix(7, () => persona('2026-01-01T00:00:00Z', faDies(40))),
      ...repetix(9, () => persona('2026-01-01T00:00:00Z', faDies(100))),
      ...repetix(3, () => persona('2026-01-01T00:00:00Z', null))
    ];
    const { trams, total } = darrerAcces(persones, { ara: ARA });
    expect(trams.map((t) => t.text)).toEqual(['12', '7', TEXT_PROTEGIT, '0', 'menys de 5']);
    expect(total).toBeNull();
  });

  test('buit i sense «ara»', () => {
    const { trams, buit } = darrerAcces([], { ara: ARA });
    expect(buit).toBe(true);
    expect(trams.every((t) => t.text === '0')).toBe(true);
    expect(() => darrerAcces([], {})).toThrow(TypeError);
  });

  test('privacitat: cap correu ni identificador al resultat', () => {
    const persones = repetix(8, () => persona('2026-01-01T00:00:00Z', faDies(2)));
    const text = JSON.stringify(darrerAcces(persones, { ara: ARA }));
    for (const p of persones) expect(text).not.toContain(p.email);
  });
});

describe('les dues sèries juntes: cap xifra amagada ix restant', () => {
  /* Els dos casos dels revisors: totes les altes cauen dins de la finestra
     i totes les dates es lligen, de manera que les dos sèries sumen el
     mateix, el total de persones. L'intrús el sap (una sèrie sense grups
     amagats el dona sencer) i l'aplica a l'altra. */
  const casos = {
    'tots donats d’alta al setembre, 3 sense entrar mai': [
      ...repetix(10, () => persona('2026-09-12T16:00:00Z', faDies(3))),
      ...repetix(3, () => persona('2026-09-12T16:00:00Z', null))
    ],
    '6 altes al setembre i 3 a l’agost, tots recents': [
      ...repetix(6, () => persona('2026-09-12T16:00:00Z', faDies(3))),
      ...repetix(3, () => persona('2026-08-02T08:00:00Z', faDies(3)))
    ]
  };

  for (const [nom, persones] of Object.entries(casos)) {
    test(nom, () => {
      const altes = altesPerMes(persones, { ara: ARA });
      const accessos = darrerAcces(persones, { ara: ARA });
      const serieAltes = [...altes.mesos, altes.descartades];
      const serieAccessos = [...accessos.trams, accessos.descartades];
      const petits = [...serieAltes, ...serieAccessos].filter((g) => g.petit);
      expect(petits.length).toBeGreaterThan(0);
      for (const valors of valorsPossibles(serieAltes, persones.length).values()) expect(valors).toEqual([1, 2, 3, 4]);
      for (const valors of valorsPossibles(serieAccessos, persones.length).values()) expect(valors).toEqual([1, 2, 3, 4]);
      // El total només hi és en la sèrie sense grups amagats: és el que l'intrús ja sap.
      expect(altes.total === null).toBe(serieAltes.some((g) => g.petit || g.amagat));
      expect(accessos.total === null).toBe(serieAccessos.some((g) => g.petit || g.amagat));
    });
  }
});

describe('entitatsPerTipus', () => {
  const entitat = (kind, i) => ({ id: `o-${kind}-${i}`, name: `Entitat ${i}`, slug: `entitat-${i}`, kind, description: '', created_at: '2026-01-01T00:00:00Z' });

  test('de més a menys; els empats en l’ordre del CHECK; els recomptes no es protegixen', () => {
    const entitats = [
      ...repetix(3, (_, i) => entitat('group', i)),
      ...repetix(1, (_, i) => entitat('city_hall', i)),
      ...repetix(3, (_, i) => entitat('company', i))
    ];
    const { tipus, total, buit } = entitatsPerTipus(entitats);
    expect(clausDe(tipus)).toEqual(['company', 'group', 'city_hall', 'entity']);
    expect(tipus.map((t) => t.text)).toEqual(['3', '3', '1', '0']);
    expect(tipus.map((t) => t.marca)).toEqual(['Empreses', 'Grups', 'Ajuntaments', 'Entitats']);
    expect(tipus.every((t) => t.petit === false && t.amagat === false)).toBe(true);
    expect(total).toEqual({ etiqueta: 'Total', recompte: 7, text: '7', petit: false });
    expect(buit).toBe(false);
  });

  test('«Altres tipus» només apareix si n’hi ha cap fora del CHECK', () => {
    expect(clausDe(entitatsPerTipus([entitat('entity', 1)]).tipus)).not.toContain('altres');
    const { tipus } = entitatsPerTipus([entitat('cooperativa', 1), entitat(undefined, 2), entitat('altres', 3), entitat('entity', 4)]);
    expect(tipus[0]).toMatchObject({ clau: 'altres', etiqueta: 'Altres tipus', recompte: 3 });
  });

  test('buit: cap entitat, o una entrada que no és una llista', () => {
    for (const entrada of [[], null, 'x']) {
      const { tipus, buit, total } = entitatsPerTipus(entrada);
      expect(buit).toBe(true);
      expect(tipus).toHaveLength(4);
      expect(total.text).toBe('0');
    }
  });
});

describe('barresHistograma', () => {
  test('un grup petit es dibuixa a mig llindar i es llig «menys de 5»; l’escala arriba al llindar', () => {
    // 2 + 3 = 5: amb el total, els dos grups petits ja es cobrixen entre ells.
    const persones = [...repetix(2, () => persona('2026-09-12T16:00:00Z')), ...repetix(3, () => persona('2026-08-12T16:00:00Z'))];
    const { mesos } = altesPerMes(persones, { ara: ARA });
    const { barres, maxim, formatValor } = barresHistograma(mesos);
    expect(barres).toHaveLength(12);
    expect(barres.map((b) => b.id)).toEqual(clausDe(mesos));
    expect(barres.find((b) => b.id === '2026-09')).toMatchObject({ etiqueta: 'setembre de 2026', valor: 2.5 });
    expect(barres.find((b) => b.id === '2026-08').valor).toBe(2.5);
    // Cap barra porta la xifra exacta d'un grup petit (2 ni 3).
    expect(barres.some((b) => b.valor === 2 || b.valor === 3)).toBe(false);
    expect(maxim).toBe(5);
    expect(formatValor(2.5)).toBe('menys de 5');
    expect(formatValor(0)).toBe('0');
  });

  test('un grup protegit es dibuixa com un de petit i es llig «xifra protegida»; l’escala la fixen les xifres visibles', () => {
    const persones = [
      ...repetix(2, () => persona('2026-09-12T16:00:00Z')),
      ...repetix(9, () => persona('2026-07-12T16:00:00Z')),
      ...repetix(12, () => persona('2026-03-12T16:00:00Z'))
    ];
    const { mesos } = altesPerMes(persones, { ara: ARA });
    const { barres, maxim, formatValor } = barresHistograma(mesos);
    const juliol = barres.find((b) => b.id === '2026-07');
    expect(juliol.valor).not.toBe(9);
    expect(formatValor(juliol.valor)).toBe(TEXT_PROTEGIT);
    expect(formatValor(barres.find((b) => b.id === '2026-09').valor)).toBe('menys de 5');
    expect(maxim).toBe(12);
    expect(formatValor(12)).toBe('12');
  });

  test('a ull, un grup protegit i un de petit tenen la mateixa alçada, siga quin siga el màxim', () => {
    const persones = [...repetix(2, () => persona('2026-09-12T16:00:00Z')), ...repetix(9, () => persona('2026-07-12T16:00:00Z'))];
    const { barres } = barresHistograma(altesPerMes(persones, { ara: ARA }).mesos);
    const petit = barres.find((b) => b.id === '2026-09').valor;
    const protegit = barres.find((b) => b.id === '2026-07').valor;
    expect(protegit).not.toBe(petit);
    for (let maxim = 5; maxim <= 1000; maxim += 1) {
      expect(nivellHistograma(protegit, maxim), `màxim ${maxim}`).toBe(nivellHistograma(petit, maxim));
    }
  });

  test('sense grups amagats, cap escala imposada i cap text amagat', () => {
    const { tipus } = entitatsPerTipus([{ kind: 'group' }, { kind: 'company' }, { kind: 'company' }]);
    const { barres, maxim, formatValor } = barresHistograma(tipus);
    expect(maxim).toBeUndefined();
    expect(barres.map((b) => b.valor)).toEqual([2, 1, 0, 0]);
    expect(formatValor(2.5)).toBe('2,5');
    expect(formatValor(1)).toBe('1');
  });

  test('la unitat concorda amb la xifra, també en un grup petit', () => {
    const unitat = ['alta', 'altes'];
    const persones = [...repetix(2, () => persona('2026-09-12T16:00:00Z')), ...repetix(3, () => persona('2026-08-12T16:00:00Z'))];
    const ambPetit = barresHistograma(altesPerMes(persones, { ara: ARA }).mesos, { unitat });
    expect(ambPetit.formatValor(2.5)).toBe('menys de 5 altes');
    expect(ambPetit.formatValor(0)).toBe('0 altes');
    const { formatValor } = barresHistograma(entitatsPerTipus([{ kind: 'group' }]).tipus, { unitat: ['entitat', 'entitats'] });
    expect(formatValor(1)).toBe('1 entitat');
    expect(formatValor(1234)).toMatch(/^1.?234 entitats$/);
  });
});
