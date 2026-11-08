// @vitest-environment node
/* P0-59 / IDEA-190 · fitxaDidactica.js: la barra dels 12 mesos i el casament nutricional per espècie, contrastats
   amb les entrades reals dels tres catàlegs del Banc de Llavors. */
import { describe, expect, test } from 'vitest';
import {
  ESPECIES_AMB_REFERENCIA, FASES_CALENDARI, MESOS_CURTS_CA, TAULA_NUTRICIONAL,
  ambComa, barra12MesosDe, binomiDe, fasesAmbMesos, nutricioDe
} from './fitxaDidactica.js';
import { FONTS_BANC_LLAVORS, entradesDelCataleg } from '../../data/patrimoni/bancLlavors.js';

const TOTES = FONTS_BANC_LLAVORS.flatMap((f) => entradesDelCataleg(f.id));
const perNom = (nom) => TOTES.find((e) => e.nom === nom);

describe('la barra dels 12 mesos', () => {
  test('dotze mesos G..D; un calendari buit o absent no en pinta cap d’actiu', () => {
    expect(MESOS_CURTS_CA.join('')).toBe('GFMAMJJASOND');
    expect(barra12MesosDe(null).some((m) => m.actiu)).toBe(false);
    expect(barra12MesosDe({}).every((m) => m.fases.length === 0)).toBe(true);
  });

  test('les fases van al seu mes, en l’ordre de FASES_CALENDARI, i els mesos fora de 1..12 o repetits no compten', () => {
    const barra = barra12MesosDe({ sembra: [3, 3, 0, 13, '4'], plantacio: [4], collita: [7], maduracioLlavors: [7, 12.5] });
    expect(barra).toHaveLength(12);
    expect(barra[2].fases).toEqual(['sembra']);
    expect(barra[3].fases).toEqual(['sembra', 'plantacio']);
    expect(barra[6].fases).toEqual(['collita', 'maduracioLlavors']);
    expect(barra.filter((m) => m.actiu).map((m) => m.mes)).toEqual([3, 4, 7]);
    expect(FASES_CALENDARI.map((f) => f.id)).toEqual(['sembra', 'plantacio', 'collita', 'maduracioLlavors']);
    expect(Object.isFrozen(barra[0])).toBe(true);
  });

  test('la llegenda només porta les fases amb mesos; el senyal sembraDirecta no és cap fase', () => {
    expect(fasesAmbMesos({ sembra: [3], plantacio: [], collita: [7], maduracioLlavors: [8], sembraDirecta: true }).map((f) => f.id))
      .toEqual(['sembra', 'collita', 'maduracioLlavors']);
    expect(fasesAmbMesos(null)).toEqual([]);
  });

  test('la collita porta un símbol neutre (cap hortalissa concreta)', () => {
    expect(FASES_CALENDARI.find((f) => f.id === 'collita').simbol).toBe('🧺');
  });
});

describe('la nutrició de referència', () => {
  test('el binomi lleva l’autor, les varietats i els accents', () => {
    expect(binomiDe('Lycopersicon esculentum Mill.')).toBe('lycopersicon esculentum');
    expect(binomiDe('Brassica oleracea var. capitata L.')).toBe('brassica oleracea');
    expect(binomiDe('Vigna unguiculata (L.) Walp.')).toBe('vigna unguiculata');
    expect(binomiDe('Solanum')).toBe('');
    expect(binomiDe(undefined)).toBe('');
  });

  test('només els sis registres SR Legacy verificats, i cada espècie apunta a un d’ells', () => {
    expect(Object.fromEntries(Object.entries(TAULA_NUTRICIONAL).map(([clau, p]) => [clau, p.fdc]))).toEqual({
      alberginia: 169228, tomaca: 170457, sindria: 167765, ceba: 170000, encisam: 169249, pastanaga: 170393
    });
    for (const clau of Object.values(ESPECIES_AMB_REFERENCIA)) expect(TAULA_NUTRICIONAL[clau], clau).toBeDefined();
    for (const perfil of Object.values(TAULA_NUTRICIONAL)) {
      expect(perfil.aliment.length).toBeGreaterThan(0);
      expect(Object.keys(perfil).sort()).toEqual(['aiguaG', 'aliment', 'fdc', 'fibraG', 'kcal100g', 'vitaminesMinerals']);
    }
  });

  test('els falsos amics i les espècies sense perfil no casen', () => {
    for (const nom of ['Cacau del collaret', 'Blat de les Índies', 'Ciuró mallorquí', 'Cigró', 'Fava de Bétera', 'Pèsol',
      'All', 'Porro', 'Rave roig', 'Carabasseta blanca', 'Carabassa de fregall', 'Garrofó pintat',
      'Bajoca de ferradura', 'Bajoca de careta curta', 'Pimentó nyora', 'Meló tendral negre', 'Carabassa xata de torrar',
      'Col de Xàtiva', 'Bleda d’Eslida']) {
      const entrada = perNom(nom);
      expect(entrada, nom).toBeDefined();
      expect(nutricioDe(entrada), nom).toBeNull();
    }
  });

  test('cada espècie amb perfil rep el seu registre FDC', () => {
    expect(nutricioDe(perNom('Albergínia blanca')).fdc).toBe(169228);
    expect(nutricioDe(perNom('Tomaca mutxamel')).fdc).toBe(170457);
    expect(nutricioDe(perNom('Tomàtiga negra')).fdc).toBe(170457);
    expect(nutricioDe(perNom('Melona')).fdc).toBe(167765);
    expect(nutricioDe(perNom('Ceba de gra')).fdc).toBe(170000);
    expect(nutricioDe(perNom('Encisam morat de Morella')).fdc).toBe(169249);
    expect(nutricioDe(perNom('Safanòria morada')).fdc).toBe(170393);
  });

  test('cap entrada amb perfil no ve d’un nom científic absent de la taula', () => {
    for (const e of TOTES) {
      const n = nutricioDe(e);
      if (n) expect(ESPECIES_AMB_REFERENCIA[binomiDe(e.nomCientific)], e.nom).toBeDefined();
    }
  });

  test('els decimals van amb coma', () => {
    expect(ambComa(94.52)).toBe('94,52');
    expect(ambComa(3)).toBe('3');
  });
});
