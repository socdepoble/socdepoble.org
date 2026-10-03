// @vitest-environment node
import { describe, expect, test } from 'vitest';
import {
  ESTATS_TEMPORADA, TEMPORADES, creaCalendari, deTemporadaEn, esDeTemporada, esMes, estatEnMes, estatTemporada,
  temporadaDe, tramsDeMesos
} from './index.js';

const clauDe = (nom) => temporadaDe(nom)?.clau ?? null;

describe('temporadaDe: accents, majúscules i plurals', () => {
  test('valencià i castellà, singular i plural, amb accents o sense', () => {
    const casos = {
      tomaques: ['Tomaques', 'tomaca', 'TOMÀQUET', 'tomata', 'Tomate', 'tomates', 'Tomates de colgar', 'Tomate pera grande'],
      taronges: ['Taronja', 'taronges', 'Naranjas', 'NARANJA', 'Naranjas de la Ribera', 'Naranjas para zumo casero'],
      creilles: ['Creïlles', 'creilla', 'Patatas', 'patata', 'Patatas gallegas para freír', 'Bossa de creïlles'],
      carxofes: ['Carxofa', 'carxofes', 'Alcachofa', 'alcachofas'],
      bajoquetes: ['Bajoqueta', 'bajoquetes', 'Ferraura', 'Judía verde redonda fina', 'judias verdes finas', 'Mongetes tendres'],
      melons: ['Meló', 'melons', 'Melón', 'melones', 'Medio melón amarillo maduro'],
      carabasso: ['Carabassó', 'carabassons', 'Calabacín blanco redondo', 'calabacines'],
      carabasses: ['Carabassa', 'carabasses', 'Calabaza de cidra', 'Media calabaza grande'],
      llimes: ['Llima', 'llimes', 'Llimona', 'Limón', 'limones'],
      espinacs: ['Espinacs', 'espinac', 'Espinacas tiernas de hoja'],
      pesols: ['Pésols', 'pèsol', 'guisantes'],
      encisam: ['Encisam', 'enciams', 'Lechuga larga de la vega', 'Lechugas de huerto'],
      safanories: ['Safanòries', 'pastanagues', 'Zanahorias'],
      sindries: ['Síndria', 'Meló d’Alger', "meló d'alger", 'Media sandía negra sin pepitas']
    };
    for (const [clau, noms] of Object.entries(casos)) {
      for (const nom of noms) expect(clauDe(nom), nom).toBe(clau);
    }
  });

  test('se salten les paraules de davant, les xifres i les unitats', () => {
    expect(clauDe('Rama de tomates de colgar')).toBe('tomaques');
    expect(clauDe('2 kg de tomaques')).toBe('tomaques');
    expect(clauDe('Un quilo de taronges')).toBe('taronges');
    expect(clauDe('Malla de cebes')).toBe('cebes');
    expect(clauDe('Mitja síndria')).toBe('sindries');
  });

  test('el nucli és la primera paraula que queda: «Tomaca pera» és tomaca, «Pera tomaca» és pera', () => {
    expect(clauDe('Tomaques pera de penjar')).toBe('tomaques');
    expect(clauDe('Pera tomaca')).toBe('peres');
  });

  test('guanya el sinònim més llarg', () => {
    expect(clauDe('Figa flor')).toBe('bacores');
    expect(clauDe('Figues')).toBe('figues');
    expect(clauDe('All tendre')).toBe('alls-tendres');
    expect(clauDe('Ajos tiernos')).toBe('alls-tendres');
    expect(clauDe('Alls')).toBe('alls');
    expect(clauDe('Alls morats')).toBe('alls');
    expect(clauDe('All porro')).toBe('porros');
    expect(clauDe('Col llombarda')).toBe('cols');
    expect(clauDe('Coliflor')).toBe('coliflors');
  });

  test('la dacsa, només en panolla', () => {
    expect(clauDe('Maíz dulce en mazorca fresco')).toBe('panolles');
    expect(clauDe('Panolles de dacsa')).toBe('panolles');
    expect(clauDe('Maíz dulce tierno')).toBeNull();
    expect(clauDe('Maíz')).toBeNull();
  });

  test('el que no és al calendari no s’etiqueta', () => {
    for (const nom of ['Plàtans', 'Plátanos canarios maduros', 'Banana', 'Piña', 'Mango', 'Kiwi del Cantábrico', 'Lima', 'Arándanos', 'Seta', 'Yuca']) {
      expect(temporadaDe(nom), nom).toBeNull();
    }
  });
});

describe('temporadaDe: els elaborats no són de temporada', () => {
  test('una marca darrere del nom el trau del calendari', () => {
    const elaborats = [
      'Tomate frito de la abuela', 'Tomaca fregida', 'Tomaques fregides', 'Tomate triturado fino', 'Tomate tamizado suave',
      'Tomate concentrado de bote', 'Tomates pelados enteros', 'Tomate rallado para untar', 'Tomates secos al sol', 'Tomate deshidratado en dados',
      'Pésols congelats', 'Espinacas congeladas en hoja', 'Guisantes ultracongelados finos', 'Uvas pasas sultanas', 'Raïm pansa',
      'Higos secos de la sierra', 'Melocotón en almíbar ligero', 'Pimientos asados al horno', 'Pebrots rostits',
      'Pimientos rojos del piquillo', 'Pebrots en tires condimentats', 'Remolatxa cuita i pelada', 'Maíz en mazorca cocido',
      'Alcachofas en conserva natural', 'Carxofes en llauna', 'Creïlles de bossa', 'Patatas fritas onduladas',
      'Patatas chips al punto de sal', 'Creïlles amb allioli', 'Maduixes amb nata', 'Ajo morado en polvo', 'Ceba fregida cruixent',
      'Pepinos encurtidos en vinagre', 'Albergínies escalivades', 'Llima d’ungles'
    ];
    for (const nom of elaborats) expect(temporadaDe(nom), nom).toBeNull();
  });

  test('aperitius i condiments: palla, sabor, granulat i cruixent són marques', () => {
    const elaborats = [
      'Patatas paja finas', 'Creïlles palla', 'Patatas sabor jamón ibérico', 'Creïlles sabor pernil', 'Ajo granulado de bote',
      'Alls granulats', 'Cebolla crujiente para ensalada', 'Ceba cruixent'
    ];
    for (const nom of elaborats) expect(temporadaDe(nom), nom).toBeNull();
    /* Límit conegut: un fresc amb «sabor» al nom també es queda sense etiqueta (la regla del dubte). */
    expect(temporadaDe('Tomaques sabor d’abans')).toBeNull();
  });

  test('el que comença per l’elaborat tampoc: el nucli no és cap fruita', () => {
    const elaborats = [
      'Zumo de naranjas valencianas', 'Suc de taronja', 'Melmelada de maduixa', 'Iogurt de maduixa', 'Gaspatxo',
      'Guacamole casero de aguacate', 'Amanida de tres colors', 'Sopa de safanòria', 'Crema de calabaza asada',
      'Salsa de tomaca', 'Verdures congelades variades', 'Barreja de verdures', 'Farina de dacsa', 'Coquetes de dacsa', 'Gelat de llima'
    ];
    for (const nom of elaborats) expect(temporadaDe(nom), nom).toBeNull();
  });

  test('«per a», «para» i «freír» no són marques: el producte continua fresc', () => {
    expect(clauDe('Taronges per a suc')).toBe('taronges');
    expect(clauDe('Pimientos verdes para freír')).toBe('pebrots');
    expect(clauDe('Uva negra sin pepitas')).toBe('raim');
  });

  test('«amanida», el plat, no és marca: «Tomaques d’amanida» és tomaca; el participi masculí sí que ho és', () => {
    expect(clauDe('Tomaques d’amanida')).toBe('tomaques');
    expect(clauDe("Tomaques d'amanida")).toBe('tomaques');
    expect(clauDe('Encisam per a amanida')).toBe('encisam');
    expect(clauDe('Tomates para ensalada de casa')).toBe('tomaques');
    expect(clauDe('Encisam amanit')).toBeNull();
    expect(clauDe('Encisams amanits')).toBeNull();
    /* Límit conegut: el femení del participi fa l'arrel del plat i ja no es distingix. */
    expect(clauDe('Tomaques amanides')).toBe('tomaques');
  });
});

describe('temporadaDe: cap fals positiu evident', () => {
  test('noms que s’assemblen a una fruita o una hortalissa', () => {
    const falsos = [
      'Pimienta negra', 'Pebre', 'Coca-Cola', 'Cola Cao', 'Olives', 'Aceitunas', 'Cebollino', 'Limonada', 'Naranjada',
      'Manzanilla', 'Pepinillos', 'Pere', 'Per a demà', 'Pero', 'Allà baix', 'Porras', 'Cebo vivo', 'Mel', 'Patatilla',
      'Fesols', 'Ametles', 'Orxata', 'Safrà', 'Pa', 'Sucre', 'Gel de dutxa', 'Pizza', 'Coca de llanda', 'Llavors',
      'Agua de rosas', 'Aguas termales', 'Aigua'
    ];
    for (const nom of falsos) expect(temporadaDe(nom), nom).toBeNull();
  });

  test('el que no és text, o és buit, és null', () => {
    for (const dolent of [null, undefined, '', '   ', 12, {}, [], true, '2 kg', 'de la']) expect(temporadaDe(dolent), String(dolent)).toBeNull();
  });
});

describe('estatTemporada i esDeTemporada', () => {
  test('les taronges: inici a l’octubre, plena a l’hivern, final al juny, fora a l’estiu', () => {
    expect(estatTemporada('Taronges', 10)).toBe('inici');
    expect(estatTemporada('Taronges', 1)).toBe('plena');
    expect(estatTemporada('Naranjas', 4)).toBe('plena');
    expect(estatTemporada('Taronges', 5)).toBe('final');
    expect(estatTemporada('Taronges', 6)).toBe('final');
    expect(estatTemporada('Taronges', 8)).toBe('fora');
  });

  test('tot l’any amb plena: el més pròxim mana (creïlles, plena d’abril a juliol)', () => {
    const creilles = temporadaDe('Creïlles');
    expect(creilles.estats).toEqual([
      'inici', 'inici', 'inici', 'plena', 'plena', 'plena', 'plena', 'final', 'final', 'final', 'final', 'inici'
    ]);
  });

  test('a la mateixa distància, final (safanòries a l’agost: tres mesos a cada plena)', () => {
    expect(estatTemporada('Safanòries', 8)).toBe('final');
    expect(estatTemporada('Safanòries', 9)).toBe('inici');
    expect(estatTemporada('Safanòries', 7)).toBe('final');
  });

  test('esDeTemporada és plena, inici o final', () => {
    expect(esDeTemporada('Maduixes', 4)).toBe(true);
    expect(esDeTemporada('Maduixes', 1)).toBe(true);
    expect(esDeTemporada('Maduixes', 9)).toBe(false);
    expect(esDeTemporada('Plàtans', 4)).toBe(false);
    expect(esDeTemporada('Xampinyons', 8)).toBe(true);
  });

  test('un mes que no és mes, o un nom que no casa, torna null (i false)', () => {
    for (const mes of [0, 13, 1.5, '10', null, undefined, Number.NaN, -1]) {
      expect(estatTemporada('Taronges', mes), String(mes)).toBeNull();
      expect(esDeTemporada('Taronges', mes), String(mes)).toBe(false);
    }
    expect(estatTemporada('Plàtans', 5)).toBeNull();
    expect(estatTemporada('Tomaca fregida', 8)).toBeNull();
  });

  test('ESTATS_TEMPORADA és la llista tancada, i cada temporada en té dotze d’eixa llista', () => {
    expect(ESTATS_TEMPORADA).toEqual(['plena', 'inici', 'final', 'fora']);
    for (const t of TEMPORADES) {
      expect(t.estats).toHaveLength(12);
      for (const estat of t.estats) expect(ESTATS_TEMPORADA).toContain(estat);
      expect(t.estats.filter((estat) => estat === 'plena')).toHaveLength(t.plens.length);
      expect(t.estats.filter((estat) => estat !== 'fora')).toHaveLength(t.mesos.length);
    }
  });
});

describe('estatEnMes, esMes i tramsDeMesos', () => {
  test('estatEnMes llig la temporada ja trobada', () => {
    const tomaques = temporadaDe('Tomaques');
    expect(estatEnMes(tomaques, 8)).toBe('plena');
    expect(estatEnMes(tomaques, 5)).toBe('inici');
    expect(estatEnMes(tomaques, 11)).toBe('final');
    expect(estatEnMes(tomaques, 2)).toBe('fora');
    expect(estatEnMes(null, 2)).toBeNull();
    expect(estatEnMes({ estats: ['plena'] }, 1)).toBeNull();
    expect(estatEnMes(tomaques, 0)).toBeNull();
  });

  test('esMes', () => {
    expect([1, 6, 12].every(esMes)).toBe(true);
    expect([0, 13, 2.5, '3', null].some(esMes)).toBe(false);
  });

  test('tramsDeMesos: trams seguits, amb la volta de l’any', () => {
    expect(tramsDeMesos([10, 11, 12, 1, 2])).toEqual([[10, 2]]);
    expect(tramsDeMesos([3, 4, 5, 9, 10])).toEqual([[3, 5], [9, 10]]);
    expect(tramsDeMesos([12, 1])).toEqual([[12, 1]]);
    expect(tramsDeMesos([5])).toEqual([[5, 5]]);
    expect(tramsDeMesos([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toEqual([[1, 12]]);
    expect(tramsDeMesos([])).toEqual([]);
    expect(tramsDeMesos([0, 13, 'x', 4])).toEqual([[4, 4]]);
    expect(tramsDeMesos(null)).toEqual([]);
    expect(tramsDeMesos(temporadaDe('Taronges').mesos)).toEqual([[10, 6]]);
  });
});

describe('deTemporadaEn', () => {
  test('l’octubre: primer les plenes, després els inicis i els finals, en l’ordre de les dades', () => {
    const octubre = deTemporadaEn(10);
    const rang = { plena: 0, inici: 1, final: 2 };
    expect(octubre.every((t, i) => i === 0 || rang[octubre[i - 1].estat] <= rang[t.estat])).toBe(true);
    const estatDe = (clau) => octubre.find((t) => t.clau === clau)?.estat ?? null;
    expect(estatDe('caquis')).toBe('plena');
    expect(estatDe('magranes')).toBe('plena');
    expect(estatDe('taronges')).toBe('inici');
    expect(estatDe('castanyes')).toBe('inici');
    expect(estatDe('tomaques')).toBe('final');
    expect(estatDe('maduixes')).toBeNull();
    expect(octubre).toHaveLength(TEMPORADES.filter((t) => t.estats[9] !== 'fora').length);
  });

  test('cada mes: les plenes, els inicis i els finals, i dins de cada estat l’ordre de dades.js', () => {
    for (let mes = 1; mes <= 12; mes += 1) {
      const esperat = ['plena', 'inici', 'final'].flatMap((estat) => TEMPORADES.filter((t) => t.estats[mes - 1] === estat).map((t) => t.clau));
      expect(deTemporadaEn(mes).map((t) => t.clau), String(mes)).toEqual(esperat);
    }
  });

  test('cada element és la temporada i el seu estat, congelat', () => {
    const [primera] = deTemporadaEn(10);
    expect(Object.isFrozen(primera)).toBe(true);
    expect(Object.keys(primera).sort()).toEqual(['clau', 'estat', 'estats', 'mesos', 'nom', 'plens', 'sinonims', 'tipus']);
  });

  test('un mes que no és mes torna una llista buida', () => {
    for (const mes of [0, 13, '10', null]) expect(deTemporadaEn(mes)).toEqual([]);
  });
});

describe('determinisme', () => {
  test('la mateixa entrada dona el mateix, sempre', () => {
    expect(temporadaDe('Tomates')).toBe(temporadaDe('tomaques'));
    expect(deTemporadaEn(3)).toEqual(deTemporadaEn(3));
    for (let mes = 1; mes <= 12; mes += 1) expect(estatTemporada('Pomes', mes)).toBe(estatTemporada('Manzanas', mes));
  });

  test('tot el que torna està congelat', () => {
    expect(Object.isFrozen(TEMPORADES)).toBe(true);
    for (const t of TEMPORADES) {
      for (const valor of [t, t.mesos, t.plens, t.estats, t.sinonims]) expect(Object.isFrozen(valor)).toBe(true);
    }
  });
});

describe('creaCalendari', () => {
  const ENTRADES = [
    { clau: 'prova', nom: 'Prova', tipus: 'fruita', mesos: '1-6', plens: '3', sinonims: ['mostra'] },
    { clau: 'llista', nom: 'Llista', tipus: 'hortalissa', mesos: [11, 12, 1], plens: [12], sinonims: [] }
  ];

  test('la mateixa API sobre unes altres dades, amb els mesos en text o en llista', () => {
    const calendari = creaCalendari(ENTRADES);
    expect(calendari.temporades.map((t) => t.clau)).toEqual(['prova', 'llista']);
    expect(calendari.temporadaDe('Mostres')?.clau).toBe('prova');
    expect(calendari.estatTemporada('Prova', 1)).toBe('inici');
    expect(calendari.estatTemporada('Prova', 6)).toBe('final');
    expect(calendari.estatTemporada('Llista', 1)).toBe('final');
    expect(calendari.esDeTemporada('Llista', 7)).toBe(false);
    expect(calendari.deTemporadaEn(12).map((t) => [t.clau, t.estat])).toEqual([['llista', 'plena']]);
    expect(calendari.temporadaDe('Tomaques')).toBeNull();
  });

  test('el mig exacte entre dues plenes és final (abril i octubre, a tres mesos de cada una)', () => {
    const calendari = creaCalendari([{ clau: 'mig', nom: 'Mig', tipus: 'fruita', mesos: '1-12', plens: '1,7', sinonims: [] }]);
    expect(calendari.temporades[0].estats).toEqual([
      'plena', 'final', 'final', 'final', 'inici', 'inici', 'plena', 'final', 'final', 'final', 'inici', 'inici'
    ]);
  });

  test('les entrades que no valen no hi entren, i no llança mai', () => {
    const dolentes = [
      null, 3, {}, { clau: 'Majúscules', nom: 'X', tipus: 'fruita', mesos: '1', plens: '1' },
      { clau: 'sense-nom', nom: ' ', tipus: 'fruita', mesos: '1', plens: '1' },
      { clau: 'sense-tipus', nom: 'X', mesos: '1', plens: '1' },
      { clau: 'mes-13', nom: 'X', tipus: 'fruita', mesos: '1-13', plens: '1' },
      { clau: 'plena-fora', nom: 'X', tipus: 'fruita', mesos: '1-3', plens: '5' },
      { clau: 'sense-plena', nom: 'X', tipus: 'fruita', mesos: '1-3', plens: '' },
      { clau: 'tram-sense-plena', nom: 'X', tipus: 'fruita', mesos: '1-3,6-8', plens: '2' },
      { clau: 'brossa', nom: 'X', tipus: 'fruita', mesos: 'gener', plens: '1' },
      { clau: 'prova', nom: 'Repetida', tipus: 'fruita', mesos: '1', plens: '1' }
    ];
    const calendari = creaCalendari([ENTRADES[0], ...dolentes]);
    expect(calendari.temporades.map((t) => t.clau)).toEqual(['prova']);
    for (const res of [null, undefined, 'x', {}]) expect(creaCalendari(res).temporades).toEqual([]);
  });

  test('cada tram de temporada necessita un mes ple: sense, no hi entra; amb, cada tram té el seu inici i el seu final', () => {
    const dosTrams = (plens) => creaCalendari([{ clau: 'dos-trams', nom: 'Dos trams', tipus: 'fruita', mesos: '1-3,6-8', plens, sinonims: [] }]).temporades;
    expect(dosTrams('2')).toEqual([]);
    expect(dosTrams([7])).toEqual([]);
    const [valida] = dosTrams('2,7');
    expect(valida.estats).toEqual(['inici', 'plena', 'final', 'fora', 'fora', 'inici', 'plena', 'final', 'fora', 'fora', 'fora', 'fora']);
    /* Amb la volta de l'any: de novembre a febrer és un sol tram. */
    expect(creaCalendari([{ clau: 'volta', nom: 'Volta', tipus: 'fruita', mesos: '11-2', plens: '1', sinonims: [] }]).temporades).toHaveLength(1);
  });

  test('no toca les entrades', () => {
    const entrades = JSON.parse(JSON.stringify(ENTRADES));
    creaCalendari(entrades);
    expect(entrades).toEqual(ENTRADES);
  });
});
