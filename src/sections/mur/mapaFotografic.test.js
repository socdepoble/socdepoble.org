// @vitest-environment node
/* P1-64 (pla 261028_1526 §3.7.1) · El nucli pur del Mapa Fotogràfic del Mur:
   distàncies, llindars, l'arbre d'enllaç complet i els seus talls, les dates
   de captura, l'estimació de la foto sense GPS, el nom de la zona i on va
   cada targeta. Les fixtures són sintètiques: el centre de la Torre de les
   Maçanes (townsSeed.js), uns punts al seu voltant, Penàguila i Xixona
   (townsSeed.js) i un monument a França (el Pont du Gard). L'oracle és la
   cerca voraç d'enllaç complet escrita ací a mà (la idea d'Emowe, no el seu
   codi): el tall de l'arbre ha de donar exactament els mateixos grups. */
import { describe, expect, test } from 'vitest';
import {
  GUIONS, INCERTESA_ALTA_S, LLINDARS_KM, MAX_PUNTS_AGRUPABLES, ZOOM_FOTO_A_FOTO, ZOOM_PARADES,
  agrupaPerDistancia, ajudaDelLliscador, arbreDAgrupacio, caixaLliure, centreDelGrup, clauDeContingut, clauDelConjunt,
  comparaCaptures, distanciaKm, estimaUbicacions, etiquetaDistancia, formataDia, formataHora, indexDelLlindar,
  instantDeCaptura, llindarDelLliscador, llindarDelZoom, modeDeComparacio, modeDelMapa, nomDeLaZona, nomDelGrup,
  omplix, ordenaPerCaptura, pobleMesProper, puntDeLaVora, solapen, tallaArbre, tonDeLaUbicacio
} from './mapaFotografic.js';
import { MOCK_TOWNS } from '../pobles/townsSeed.js';

const TORRE = { lat: 38.5919, lng: -0.4184 };
const PUNTS = Object.freeze([
  { id: 'torre-centre', ...TORRE },                           // 0
  { id: 'torre-150m', lat: 38.5919, lng: -0.41668 },          // 1 · uns 150 m a l'est
  { id: 'torre-1km', lat: 38.6009, lng: -0.4184 },            // 2 · 1 km al nord
  { id: 'penaguila', lat: 38.6315, lng: -0.3892 },            // 3 · townsSeed
  { id: 'xixona', lat: 38.5398, lng: -0.5085 },               // 4 · townsSeed
  { id: 'franca-pont-du-gard', lat: 43.9475, lng: 4.5350 }    // 5 · un monument a França
]);

/* L'oracle: enllaç complet voraç. Cada volta ajunta la parella de grups amb
   el diàmetre més menut que no passa el límit; els empats, la primera parella
   en l'ordre de la llista. */
function oracle(punts, limit) {
  const grups = punts.map((_, index) => [index]);
  if (limit === 0) return grups;
  for (;;) {
    let millor = null;
    for (let i = 0; i < grups.length; i += 1) {
      for (let j = i + 1; j < grups.length; j += 1) {
        let diametre = -Infinity;
        for (const a of grups[i]) for (const b of grups[j]) diametre = Math.max(diametre, distanciaKm(punts[a], punts[b]));
        if (diametre <= limit && (!millor || diametre < millor.diametre)) millor = { i, j, diametre };
      }
    }
    if (!millor) break;
    grups[millor.i] = grups[millor.i].concat(grups[millor.j]);
    grups.splice(millor.j, 1);
  }
  return grups.map((grup) => grup.sort((x, y) => x - y)).sort((x, y) => x[0] - y[0]);
}

/* Un generador de números amb llavor (Park-Miller): les proves no depenen de la sort. */
function aleatori(llavor) {
  let estat = llavor;
  return () => (estat = (estat * 16807) % 2147483647) / 2147483647;
}
const nuvol = (n, rnd, { lat = 38.4, lng = -0.7, ample = 0.5 } = {}) =>
  Array.from({ length: n }, () => ({ lat: lat + rnd() * ample, lng: lng + rnd() * ample }));

describe('distàncies i zoom', () => {
  test('haversine amb R = 6371 km; un punt no vàlid queda a l’infinit', () => {
    expect(distanciaKm(TORRE, TORRE)).toBe(0);
    expect(distanciaKm(PUNTS[0], PUNTS[1])).toBeCloseTo(0.149, 2);
    expect(distanciaKm(PUNTS[0], PUNTS[2])).toBeCloseTo(1.0008, 3);
    expect(distanciaKm(PUNTS[0], PUNTS[3])).toBeCloseTo(5.082, 2);
    expect(distanciaKm(PUNTS[3], PUNTS[4])).toBeCloseTo(14.543, 2);
    expect(distanciaKm(PUNTS[0], PUNTS[5])).toBeCloseTo(724.96, 1);
    expect(distanciaKm(TORRE, { lat: '38.59', lng: -0.42 })).toBe(Infinity);
    expect(distanciaKm(TORRE, { lat: 0, lng: 0 })).toBe(Infinity);
    expect(distanciaKm(null, TORRE)).toBe(Infinity);
  });

  test('el llindar de cada zoom: 100 km, 200 m i 0 només ixen del lliscador', () => {
    expect([2, 6, 7, 8, 9, 10, 11, 12, 19, Number.NaN].map(llindarDelZoom)).toEqual([Infinity, Infinity, 60, 30, 15, 6, 2, 0.8, 0.8, Infinity]);
  });

  test('lliscador ↔ llindar: posició 5 = 6 km, i cada llindar automàtic té la seua posició', () => {
    expect(LLINDARS_KM).toEqual([Infinity, 100, 60, 30, 15, 6, 2, 0.8, 0.2, 0]);
    expect(llindarDelLliscador(5)).toBe(6);
    expect(llindarDelLliscador('9')).toBe(0);
    expect(llindarDelLliscador(42)).toBe(0);
    expect(llindarDelLliscador(-3)).toBe(Infinity);
    expect(llindarDelLliscador('res')).toBe(Infinity);
    for (const [index, km] of LLINDARS_KM.entries()) expect(indexDelLlindar(km)).toBe(index);
    expect([7, 8, 9, 10, 11, 12].map((z) => indexDelLlindar(llindarDelZoom(z)))).toEqual([2, 3, 4, 5, 6, 7]);
    expect(indexDelLlindar(3)).toBe(6);
    expect(indexDelLlindar(Number.NaN)).toBe(0);
  });

  test('el mode: des del 16, foto a foto sempre (també amb un llindar manual); parades del 13 al 15 en automàtic', () => {
    expect(ZOOM_PARADES).toBe(13);
    expect(ZOOM_FOTO_A_FOTO).toBe(16);
    expect(modeDelMapa({ zoom: 16, llindarManual: 30 })).toBe('foto-a-foto');
    expect(modeDelMapa({ zoom: 18 })).toBe('foto-a-foto');
    expect(modeDelMapa({ zoom: 14, llindarManual: null })).toBe('parades');
    expect(modeDelMapa({ zoom: 14 })).toBe('parades');
    expect(modeDelMapa({ zoom: 14, llindarManual: 6 })).toBe('grups');
    expect(modeDelMapa({ zoom: 12, llindarManual: null })).toBe('grups');
    expect(modeDelMapa({ zoom: Number.NaN })).toBe('grups');
    expect(modeDelMapa()).toBe('grups');
  });

  test('etiquetes i ajuda del lliscador, amb el traductor si n’hi ha', () => {
    expect(LLINDARS_KM.map((km) => etiquetaDistancia(km))).toEqual(['Tot junt', '100 km', '60 km', '30 km', '15 km', '6 km', '2 km', '800 m', '200 m', 'Totes les parades']);
    expect(etiquetaDistancia(1.5)).toBe('1,5 km');
    expect(etiquetaDistancia(-1)).toBe('');
    const t = (clau, reserva) => `[${clau}] ${reserva}`;
    expect(etiquetaDistancia(Infinity, t)).toBe('[section.mur.mapa.totJunt] Tot junt');
    const ajuda = ajudaDelLliscador({ llindarManual: 6, mode: 'grups' });
    expect(ajuda.clau).toBe('section.mur.mapa.ajuda.distancia');
    expect(omplix(ajuda.reserva, ajuda.valors)).toBe('Agrupem en un mateix node les parades que estan a 6 km o menys entre si. Les més allunyades queden en nodes separats.');
    expect(ajudaDelLliscador({ llindarManual: 30, mode: 'foto-a-foto' }).clau).toBe('section.mur.mapa.ajuda.detallLocal');
    expect(ajudaDelLliscador({ mode: 'parades' }).clau).toBe('section.mur.mapa.ajuda.automatica');
    expect(ajudaDelLliscador({ llindarManual: Infinity }).clau).toBe('section.mur.mapa.ajuda.totJunt');
    expect(ajudaDelLliscador({ llindarManual: 0 }).clau).toBe('section.mur.mapa.ajuda.separades');
    expect(omplix('{nom} · {n} zones més · {x}', { nom: '$& La Torre', n: 3 })).toBe('$& La Torre · 3 zones més · {x}');
  });
});

describe('arbre d’enllaç complet i talls', () => {
  test('un monument a França i les fonts de la Torre conviuen en grups separats a 100 km i s’ajunten a «Tot junt»', () => {
    const arbre = arbreDAgrupacio(PUNTS);
    expect(arbre.n).toBe(6);
    expect(arbre.retallat).toBe(false);
    const tall = (km) => tallaArbre(arbre, km);
    expect(tall(Infinity)).toEqual([[0, 1, 2, 3, 4, 5]]);
    for (const km of [100, 60, 30, 15]) expect(tall(km)).toEqual([[0, 1, 2, 3, 4], [5]]);
    expect(tall(6)).toEqual([[0, 1, 2, 3], [4], [5]]);
    expect(tall(2)).toEqual([[0, 1, 2], [3], [4], [5]]);
    expect(tall(0.8)).toEqual([[0, 1], [2], [3], [4], [5]]);
    expect(tall(0.2)).toEqual([[0, 1], [2], [3], [4], [5]]);
    expect(tall(0)).toEqual([[0], [1], [2], [3], [4], [5]]);
    for (const km of LLINDARS_KM) expect(tall(km)).toEqual(oracle(PUNTS, km));
  });

  test('cap cadena: A–B i B–C a 5 km no ajunten A amb C (10 km) a 6 km', () => {
    const cadena = [{ lat: 38.5, lng: -0.4184 }, { lat: 38.545, lng: -0.4184 }, { lat: 38.59, lng: -0.4184 }];
    expect(distanciaKm(cadena[0], cadena[1])).toBeCloseTo(5.0038, 3);
    expect(distanciaKm(cadena[0], cadena[2])).toBeCloseTo(10.0075, 3);
    expect(agrupaPerDistancia(cadena, 6)).toEqual([[0, 1], [2]]);
    expect(agrupaPerDistancia(cadena, 11)).toEqual([[0, 1, 2]]);
  });

  test('tres punts idèntics: separats a 0, junts a 200 m', () => {
    const iguals = [TORRE, TORRE, TORRE];
    expect(agrupaPerDistancia(iguals, 0)).toEqual([[0], [1], [2]]);
    expect(agrupaPerDistancia(iguals, 0.2)).toEqual([[0, 1, 2]]);
  });

  test('entrades buides o estranyes: mai llança', () => {
    expect(agrupaPerDistancia([], 6)).toEqual([]);
    expect(agrupaPerDistancia([TORRE], 6)).toEqual([[0]]);
    expect(arbreDAgrupacio(null)).toEqual({ n: 0, fusions: [], retallat: false, resolucioKm: 0 });
    expect(tallaArbre(null, 6)).toEqual([]);
    expect(tallaArbre({ n: 2, fusions: 'res' }, 6)).toEqual([[0], [1]]);
    // Un punt sense coordenades vàlides només s'ajunta amb «Tot junt».
    const ambBrut = [TORRE, { lat: 'x', lng: 1 }, PUNTS[1]];
    expect(agrupaPerDistancia(ambBrut, 100)).toEqual([[0, 2], [1]]);
    expect(agrupaPerDistancia(ambBrut, Infinity)).toEqual([[0, 1, 2]]);
    // Ni amb un llindar enorme: només «Tot junt» (Infinity) l'ajunta.
    expect(agrupaPerDistancia([{ lat: 5, lng: 5 }, { lat: 'x', lng: 1 }], 10000)).toEqual([[0], [1]]);
  });

  test('empats deterministes: una quadrícula equidistant dona sempre el mateix que l’oracle', () => {
    const quadricula = [];
    for (let i = 0; i < 6; i += 1) for (let j = 0; j < 6; j += 1) quadricula.push({ lat: 38 + i * 0.01, lng: -0.4 + j * 0.01 });
    const arbre = arbreDAgrupacio(quadricula);
    for (const km of [0.5, 1.2, 1.6, 2.5, 4, 8]) {
      expect(tallaArbre(arbre, km)).toEqual(oracle(quadricula, km));
      expect(tallaArbre(arbreDAgrupacio(quadricula), km)).toEqual(tallaArbre(arbre, km));
    }
    // Un empat exacte (mig grau de latitud en el mateix meridià, representable en binari):
    // guanya la parella (0, 1), el node que queda és el 0, i el 2 es queda a soles.
    const fila = [{ lat: 38, lng: -0.4 }, { lat: 38.5, lng: -0.4 }, { lat: 39, lng: -0.4 }];
    expect(distanciaKm(fila[0], fila[1])).toBe(distanciaKm(fila[1], fila[2]));
    expect(arbreDAgrupacio(fila).fusions[0]).toMatchObject({ a: 0, b: 1 });
    expect(agrupaPerDistancia(fila, 60)).toEqual([[0, 1], [2]]);
    // Un empat dins d'una mateixa fila (0–1 i 0–2, mig grau cada una): guanya la j més baixa.
    const empatEnFila = [{ lat: 38.5, lng: -0.4 }, { lat: 39, lng: -0.4 }, { lat: 38, lng: -0.4 }];
    expect(distanciaKm(empatEnFila[0], empatEnFila[1])).toBe(distanciaKm(empatEnFila[0], empatEnFila[2]));
    expect(agrupaPerDistancia(empatEnFila, 60)).toEqual([[0, 1], [2]]);
  });

  test('oracle: conjunts aleatoris de 30 i 80 punts, els deu llindars', () => {
    const rnd = aleatori(7);
    for (const n of [30, 80]) {
      const punts = nuvol(n, rnd);
      const arbre = arbreDAgrupacio(punts);
      for (const km of LLINDARS_KM) expect(tallaArbre(arbre, km)).toEqual(oracle(punts, km));
    }
  });

  test('les fusions van en ordre d’altura i cada tall és un prefix', () => {
    const arbre = arbreDAgrupacio(nuvol(60, aleatori(11)));
    const altures = arbre.fusions.map((f) => f.altura);
    expect(altures).toEqual([...altures].sort((a, b) => a - b));
    expect(arbre.fusions.every((f) => f.a < f.b)).toBe(true);
  });

  test(`més de ${MAX_PUNTS_AGRUPABLES} punts: les coordenades idèntiques es fonen abans, amb el mateix resultat`, () => {
    const llocs = nuvol(40, aleatori(3));
    const molts = Array.from({ length: 5000 }, (_, index) => llocs[(index * 7) % llocs.length]);
    const inici = performance.now();
    const arbre = arbreDAgrupacio(molts);
    expect(performance.now() - inici).toBeLessThan(1500);
    expect(arbre.retallat).toBe(false);
    for (const km of [0, 0.8, 6, Infinity]) {
      const grups = tallaArbre(arbre, km);
      const perLloc = oracle(llocs, km).map((grup) => grup.map((i) => llocs[i]));
      // Cada grup del conjunt gran porta exactament els punts dels llocs d'un grup de l'oracle.
      if (km === 0) expect(grups).toHaveLength(5000);
      else expect(grups.map((g) => new Set(g.map((i) => molts[i])).size).sort()).toEqual(perLloc.map((g) => g.length).sort());
    }
  });

  test(`més de ${MAX_PUNTS_AGRUPABLES} punts a la mateixa latitud i a 1 km: la fusió prèvia mira les dues coordenades, i a altura 0`, () => {
    const dos = [{ lat: 38.5919, lng: -0.4184 }, { lat: 38.5919, lng: -0.4069 }];
    expect(distanciaKm(dos[0], dos[1])).toBeCloseTo(1.0, 1);
    const alterns = Array.from({ length: 700 }, (_, index) => dos[index % 2]);
    const arbre = arbreDAgrupacio(alterns);
    expect(arbre).toMatchObject({ retallat: false, resolucioKm: 0 });
    const grups = tallaArbre(arbre, 0.2);
    expect(grups.map((g) => g.length)).toEqual([350, 350]);
    expect(grups[0].every((i) => i % 2 === 0)).toBe(true);
    expect(tallaArbre(arbre, 2)).toHaveLength(1);
  });

  test(`molts punts no vàlids (més de ${MAX_PUNTS_AGRUPABLES}): mai no entren a la matriu i només s'ajunten a «Tot junt»`, () => {
    const valids = nuvol(10, aleatori(13));
    const barreja = [...Array.from({ length: 1600 }, () => null), ...valids, { lat: Number.NaN, lng: 1 }];
    const arbre = arbreDAgrupacio(barreja);
    // Només 10 vàlids: l'arbre és exacte, sense cap cel·la.
    expect(arbre).toMatchObject({ n: 1611, retallat: false, resolucioKm: 0 });
    expect(tallaArbre(arbre, Infinity)).toEqual([Array.from({ length: 1611 }, (_, i) => i)]);
    for (const km of [100, 6, 0.8]) {
      const grups = tallaArbre(arbre, km);
      const delsValids = grups.filter((g) => g[0] >= 1600 && g[0] < 1610);
      expect(delsValids).toEqual(oracle(valids, km).map((g) => g.map((i) => i + 1600)));
      expect(grups.filter((g) => g[0] < 1600 || g[0] === 1610).every((g) => g.length === 1)).toBe(true);
    }
    const altures = arbre.fusions.map((f) => f.altura);
    expect(altures).toEqual([...altures].sort((x, y) => x - y));
    expect(arbre.fusions.every((f) => f.a < f.b)).toBe(true);
  });

  test('cota de rendiment: 800 punts diferents en menys d’un segon i mig, i deu talls en menys de 50 ms', () => {
    const punts = nuvol(800, aleatori(5), { lat: 35, lng: -5, ample: 10 });
    const inici = performance.now();
    const arbre = arbreDAgrupacio(punts);
    const mig = performance.now();
    for (const km of LLINDARS_KM) tallaArbre(arbre, km);
    const fi = performance.now();
    expect(arbre.n).toBe(800);
    expect(arbre.fusions).toHaveLength(799);
    expect(mig - inici).toBeLessThan(1500);
    expect(fi - mig).toBeLessThan(50);
  });

  test('massa punts diferents: s’arrodonix, l’arbre ho diu i no llança', () => {
    const punts = nuvol(3000, aleatori(9), { lat: 35, lng: -5, ample: 12 });
    const arbre = arbreDAgrupacio(punts);
    expect(arbre.retallat).toBe(true);
    expect(tallaArbre(arbre, 0)).toHaveLength(3000);
    expect(tallaArbre(arbre, Infinity)).toEqual([Array.from({ length: 3000 }, (_, i) => i)]);
  });

  /* El diàmetre de veres d'un grup: mai més del llindar més dues diagonals de cel·la. */
  const diametre = (punts, grup) => {
    let pitjor = 0;
    for (let i = 0; i < grup.length; i += 1) for (let j = i + 1; j < grup.length; j += 1) pitjor = Math.max(pitjor, distanciaKm(punts[grup[i]], punts[grup[j]]));
    return pitjor;
  };

  test('retallat: cel·les en sèrie 1-2-5, la més menuda que hi cap, i la resolució que diu l’arbre és la que es complix', () => {
    for (const [n, llavor, maxima] of [[1600, 21, 0.79], [2500, 22, 3.1]]) {
      const punts = nuvol(n, aleatori(llavor));
      const arbre = arbreDAgrupacio(punts);
      expect(arbre.retallat).toBe(true);
      expect(arbre.resolucioKm).toBeGreaterThan(0);
      // Amb 0,5° de quadre, cel·les de 0,005° (1 600 punts) i de 0,02° (2 500): abans eren de 0,01° i de 0,1° (16 km de diagonal).
      expect(arbre.resolucioKm).toBeLessThanOrEqual(maxima);
      for (const km of [0.2, 2, 6]) {
        for (const grup of tallaArbre(arbre, km)) expect(diametre(punts, grup)).toBeLessThanOrEqual(km + 2 * arbre.resolucioKm);
      }
    }
  });

  test('centre i nom d’un grup', () => {
    expect(centreDelGrup(PUNTS, [0, 2])).toEqual({ lat: (38.5919 + 38.6009) / 2, lng: -0.4184 });
    expect(centreDelGrup(PUNTS, [])).toBeNull();
    const parades = [{ lloc: 'La Torre' }, { lloc: 'La Torre' }, { lloc: 'Penàguila' }, { lloc: 'Xixona' }, { lloc: '' }];
    expect(nomDelGrup([0, 1], parades)).toBe('La Torre');
    expect(nomDelGrup([0, 2], parades)).toBe('La Torre · Penàguila');
    expect(nomDelGrup([0, 2, 3], parades)).toBe('La Torre · 2 zones més');
    expect(nomDelGrup([0, 1, 2, 3, 4], parades, { nomDeTot: 'Totes les fotos del Mur' })).toBe('Totes les fotos del Mur');
    expect(nomDelGrup([4], parades, { nomSenseLloc: 'Lloc sense nom' })).toBe('Lloc sense nom');
    expect(nomDelGrup([0, 2, 3], parades, { formataMes: (primer, n) => `${primer} +${n}` })).toBe('La Torre +2');
  });
});

describe('dates de captura', () => {
  test('el text d’exif.js i el brut d’EXIF; una data que no existix no és cap data', () => {
    expect(instantDeCaptura('2026-10-12T10:00:00+02:00')).toEqual({ s: Date.UTC(2026, 9, 12, 8) / 1000, zona: '+02:00', dia: '2026-10-12', local: '2026-10-12T10:00:00' });
    expect(instantDeCaptura('2026:10:12 10:00:00')).toMatchObject({ zona: null, dia: '2026-10-12', local: '2026-10-12T10:00:00' });
    expect(instantDeCaptura('2026-10-12T10:00:00Z')).toMatchObject({ zona: '+00:00' });
    for (const brut of ['2026-02-30T10:00:00', '2026-13-01T10:00:00', '2026-10-12', null, 42, '2026-10-12T24:00:00']) expect(instantDeCaptura(brut)).toBeNull();
  });

  test('ordre: amb zona a totes, per l’instant; si no, per l’hora de rellotge; sense data, al final i en l’ordre d’entrada', () => {
    const ambZona = [
      { id: 'b', dataCaptura: '2026-10-12T10:00:00+02:00' },  // 08:00 UTC
      { id: 'a', dataCaptura: '2026-10-12T09:30:00+00:00' },  // 09:30 UTC
      { id: 'x' },
      { id: 'c', dataCaptura: '2026-10-12T07:00:00+00:00' }
    ];
    expect(ordenaPerCaptura(ambZona).map((f) => f.id)).toEqual(['c', 'b', 'a', 'x']);
    const barreja = [...ambZona, { id: 'n', dataCaptura: '2026-10-12T09:45:00' }];
    expect(ordenaPerCaptura(barreja).map((f) => f.id)).toEqual(['c', 'a', 'n', 'b', 'x']);
    expect(modeDeComparacio([instantDeCaptura('2026-10-12T10:00:00+02:00'), null])).toBe('instant');
    expect(modeDeComparacio([instantDeCaptura('2026-10-12T10:00:00')])).toBe('local');
    expect(comparaCaptures(null, null)).toBe(0);
    expect(comparaCaptures(instantDeCaptura('2026-10-12T10:00:00'), null)).toBe(-1);
  });

  test('dia i hora de les targetes, llegits com a text (cap zona convertida)', () => {
    expect(formataDia('2026-10-12T23:30:00-05:00')).toBe('12/10/2026');
    expect(formataHora('2026-10-12T23:30:00-05:00')).toBe('23:30');
    expect(formataDia('2026:10:12 08:05:00')).toBe('12/10/2026');
    expect(formataDia(null)).toBe('');
    expect(formataHora('2026-10-12')).toBe('');
  });
});

describe('estimació (la foto amb GPS més pròxima en el temps de la mateixa publicació)', () => {
  const GALERIA = [
    { id: 'a', origen: 'exif', lat: 38.5919, lng: -0.4184, dataCaptura: '2026-10-12T10:00:00+02:00' },
    { id: 'b', origen: null, dataCaptura: '2026-10-12T10:40:00+02:00' },
    { id: 'c', origen: 'exif', lat: 38.6009, lng: -0.4184, dataCaptura: '2026-10-12T11:00:00+02:00' },
    { id: 'd', origen: null, dataCaptura: '2026-10-13T09:00:00+02:00' },
    { id: 'e', origen: null, dataCaptura: '2026-10-12T10:30:00' },
    { id: 'f', origen: null, dataCaptura: null }
  ];

  test('gps, estimada (amb referència, diferència i incertesa) i poble; mai una interpolació', () => {
    const [a, b, c, d, e, f] = estimaUbicacions(GALERIA, { centreDelPoble: TORRE });
    expect(a).toMatchObject({ estat: 'gps', lat: 38.5919 });
    expect(b).toMatchObject({ estat: 'estimada', referencia: 'c', diferencia_s: 1200, incertesaAlta: false, lat: 38.6009, lng: -0.4184 });
    expect(c.estat).toBe('gps');
    expect(d).toMatchObject({ estat: 'estimada', referencia: 'c', diferencia_s: 79200, incertesaAlta: true });
    // Una hora sense zona no es compara amb les que en porten.
    expect(e).toMatchObject({ estat: 'poble', lat: TORRE.lat, lng: TORRE.lng });
    expect(f.estat).toBe('poble');
    // Les coordenades estimades són sempre les d'una foto real: cap punt a mig camí.
    expect([b, d].every((x) => [a, c].some((g) => g.lat === x.lat && g.lng === x.lng))).toBe(true);
    expect(INCERTESA_ALTA_S).toBe(7200);
  });

  test('més de 2 hores el mateix dia és incertesa alta; sense poble, pendent; unes coordenades sense EXIF són indicades', () => {
    const [, tard] = estimaUbicacions([GALERIA[0], { id: 't', dataCaptura: '2026-10-12T12:00:01+02:00' }]);
    expect(tard).toMatchObject({ estat: 'estimada', diferencia_s: 7201, incertesaAlta: true });
    // Un altre dia també és incertesa alta, encara que siguen 40 minuts (passada la mitjanit).
    const nit = { id: 'n', origen: 'exif', lat: 38.5919, lng: -0.4184, dataCaptura: '2026-10-12T23:30:00+02:00' };
    const [, matinada] = estimaUbicacions([nit, { id: 'm0', dataCaptura: '2026-10-13T00:10:00+02:00' }]);
    expect(matinada).toMatchObject({ estat: 'estimada', referencia: 'n', diferencia_s: 2400, incertesaAlta: true });
    expect(estimaUbicacions([{ id: 'z', origen: null }])[0]).toMatchObject({ estat: 'pendent', lat: null, lng: null });
    expect(estimaUbicacions([{ id: 'm', origen: 'manual', lat: 38.6, lng: -0.4 }])[0].estat).toBe('indicada');
    expect(estimaUbicacions(null)).toEqual([]);
    expect(['gps', 'estimada', 'poble', 'indicada', 'pendent', 'res'].map(tonDeLaUbicacio)).toEqual(['verd', 'ocre', 'ocre', 'ocre', null, null]);
  });
});

describe('claus, títol i targetes', () => {
  test('la clau d’un grup no depén de l’ordre; la del conjunt canvia amb qualsevol foto', () => {
    expect(clauDeContingut(['b', 'a'])).toBe(clauDeContingut(['a', 'b']));
    expect(clauDeContingut(null)).toBe(clauDeContingut([]));
    expect(clauDeContingut(['a'])).not.toBe(clauDeContingut(['b']));
    // Curta encara que el grup porte mil fotos amb la seua adreça: l'emmagatzematge del portal és compartit.
    const mil = Array.from({ length: 1000 }, (_, i) => `feed:${i}|/assets/uploads/gent/veina/mur/foto-${i}.webp`);
    expect(clauDeContingut(mil)).toMatch(/^[0-9a-z]{1,7}$/);
    expect(clauDeContingut([...mil].reverse())).toBe(clauDeContingut(mil));
    const fotos = [{ id: 'p|a.jpg', lat: 38.59, lng: -0.42, dataCaptura: '2026-10-12T10:00:00' }];
    expect(clauDelConjunt(fotos)).toBe(clauDelConjunt(fotos.map((f) => ({ ...f }))));
    expect(clauDelConjunt(fotos)).not.toBe(clauDelConjunt([{ ...fotos[0], lat: 38.6 }]));
    expect(clauDelConjunt(fotos)).toMatch(/^[0-9a-z]+$/);
  });

  test('nom de la zona, només amb els pobles de la llavor: rodalia, comarca, general i fora', () => {
    const opcions = { pobles: MOCK_TOWNS, nomGeneral: 'Totes les fotos del Mur', nomDeFora: 'Zona sense nom al catàleg' };
    expect(nomDeLaZona({ ...opcions, centre: { lat: 38.592, lng: -0.42 }, zoom: 14 })).toBe('La Torre de les Maçanes · rodalia');
    expect(nomDeLaZona({ ...opcions, centre: { lat: 38.6315, lng: -0.3892 }, zoom: 12 })).toBe('Penàguila · rodalia');
    expect(nomDeLaZona({ ...opcions, centre: { lat: 38.592, lng: -0.42 }, zoom: 9 })).toBe("L'Alacantí");
    expect(nomDeLaZona({ ...opcions, centre: { lat: 38.592, lng: -0.42 }, zoom: 5 })).toBe('Totes les fotos del Mur');
    expect(nomDeLaZona({ ...opcions, centre: { lat: 43.9475, lng: 4.535 }, zoom: 12 })).toBe('Zona sense nom al catàleg');
    expect(nomDeLaZona({ ...opcions, centre: null, zoom: 12 })).toBe('Totes les fotos del Mur');
    expect(nomDeLaZona({ ...opcions, centre: { lat: 38.592, lng: -0.42 }, zoom: 14, rodalia: (nom) => `${nom} (entorn)` })).toBe('La Torre de les Maçanes (entorn)');
    expect(pobleMesProper(TORRE, [{ title: '', lat: 1, lng: 1 }, { title: 'Sense lloc' }])).toBeNull();
  });

  test('cada targeta va a una caixa lliure, sense tapar cap punt ni cap altra targeta', () => {
    const mida = { w: 176, h: 160 };
    const origen = { x: 400, y: 300 };
    const primera = caixaLliure({ origen, mida, punts: [origen] });
    expect(solapen(primera, { x: origen.x, y: origen.y, w: 0, h: 0 }, 8)).toBe(false);
    const segona = caixaLliure({ origen, mida, ocupades: [primera], punts: [origen] });
    expect(solapen(primera, segona, 8)).toBe(false);
    expect(Math.hypot(segona.x + 88 - origen.x, segona.y + 80 - origen.y)).toBeLessThan(400);
    // Amb els límits del mapa (un telèfon), un punt a la vora dreta no deixa la targeta tallada.
    const vora = { x: 360, y: 150 };
    const dins = caixaLliure({ origen: vora, mida, punts: [vora], limits: { w: 375, h: 400 } });
    expect(dins.x).toBeGreaterThanOrEqual(8);
    expect(dins.x + dins.w).toBeLessThanOrEqual(375 - 8);
    expect(dins.y + dins.h).toBeLessThanOrEqual(400 - 8);
    // Si cap no hi cap sencera, la primera lliure encara que isca.
    expect(caixaLliure({ origen: vora, mida, punts: [vora], limits: { w: 100, h: 100 } })).not.toBeNull();
    // Sense lloc lliure, a la dreta i davall del punt.
    expect(caixaLliure({ origen, mida, ocupades: [{ x: -1e4, y: -1e4, w: 2e4, h: 2e4 }] })).toEqual({ x: 416, y: 316, w: 176, h: 160 });
    expect(puntDeLaVora({ x: 0, y: 50 }, { x: 10, y: 20, w: 100, h: 60 })).toEqual({ x: 10, y: 50 });
    expect(puntDeLaVora({ x: 500, y: 500 }, { x: 10, y: 20, w: 100, h: 60 })).toEqual({ x: 110, y: 80 });
    expect(GUIONS).toBe('4 5');
  });
});
