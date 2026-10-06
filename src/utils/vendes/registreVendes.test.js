// @vitest-environment node
/* Vendes · utils/vendes/registreVendes.js — el contracte neutre sdp.vendes.v1
   (ordre del Mestre, 261006). Registres vàlids i invàlids fets a mà (el
   contracte no coneix cap app: el tiquet real del Bar el prova
   apps/bar/nucli/vendes.test.js), la paritat amb les guardes del titular de
   la Gestoria (només lectura: la importen les proves, mai el mòdul) i, al
   final, la qualitat de la carpeta. Les formes d'identificador personal es
   componen a trossos (patró de la Gestoria): cap text d'esta prova té la
   forma d'un DNI, un IBAN, un telèfon ni un correu.
   Correccions de la revisió (261006): el titular porta l'àmbit i la llar no
   ven; el desglossament porta el total de cada tipus i cap base ni quota
   (Principi 4); un forat en una llista és un error. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';
import {
  AMBIT_DEL_TIPUS, APPS_ORIGEN, CANALS_VENDA, ESQUEMA_VENDES, MAX_ALIES, METODES_PAGAMENT, MONEDA_VENDES, TIPUS_TITULAR, TIPUS_VENDA,
  creaRegistreVendes, esDataValida, titularDelRegistre, validaRegistreVendes
} from './registreVendes.js';
import { comprovaText, esIdOpac as esIdOpacGestoria } from '../../sections/gestoria/identitat/nucli/guardes.js';
import { AMBITS, creaTitular, nouIdOpac } from '../../sections/gestoria/identitat/nucli/titular.js';

const t = (...trossos) => trossos.join('');
const car = (codi) => String.fromCodePoint(codi);

/* Una venda amb dos tipus d'IVA i pagament mixt: 2,00 € al 10 % i 3,00 € al 21 %. */
const vendaMixta = () => ({
  id: 'k-mgahhx2o-4f2a', numero: 1, tipus: 'venda', data: { a: 2026, m: 10, d: 2 }, hora: '10:15', canal: 'barra',
  totalCents: 500,
  perIva: [{ ivaPercent: 10, totalCents: 200 }, { ivaPercent: 21, totalCents: 300 }],
  pagaments: [{ metode: 'efectiu', importCents: 200 }, { metode: 'targeta', importCents: 300 }]
});
/* La devolució de la copa del 21 %, enllaçada i en positiu. */
const devolucio = () => ({
  id: 'k-mgahhx2o-9zzz', numero: 3, tipus: 'devolucio', data: { a: 2026, m: 10, d: 2 }, hora: '15:00', canal: 'barra',
  totalCents: 300,
  perIva: [{ ivaPercent: 21, totalCents: 300 }],
  pagaments: [{ metode: 'efectiu', importCents: 300 }],
  tiquetOrigenId: 'k-mgahhx2o-4f2a'
});
/* Un titular persona que ven: l'activitat, amb l'àmbit de la Gestoria. */
const activitat = (camps = {}) => ({ tipus: 'persona', id: 'tit_abcd', alies: 'El meu taller', ambit: 'ACTIVITAT', ...camps });
const registre = (canvis = {}) => ({
  esquema: ESQUEMA_VENDES,
  moneda: MONEDA_VENDES,
  titular: { tipus: 'entitat', id: 'tit_abcdefghijklmnop', alies: 'Bar de la Plaça', ambit: 'ENTITAT' },
  origen: { app: 'bar', establiment: 'el-meu-bar' },
  vendes: [vendaMixta(), devolucio()],
  ...canvis
});
const ambVenda = (canvis) => registre({ vendes: [{ ...vendaMixta(), ...canvis }] });
const codis = (errors) => errors.map((e) => `${e.codi} ${e.camp}`);

describe('constants', () => {
  test('esquema, moneda i llistes tancades, congelades', () => {
    expect(ESQUEMA_VENDES).toBe('sdp.vendes.v1');
    expect(MONEDA_VENDES).toBe('EUR');
    expect(TIPUS_TITULAR).toEqual(['persona', 'entitat']);
    expect(APPS_ORIGEN).toEqual(['bar']);
    expect(TIPUS_VENDA).toEqual(['venda', 'devolucio']);
    expect(CANALS_VENDA).toEqual(['barra', 'taula', 'emportar']);
    expect(METODES_PAGAMENT).toEqual(['efectiu', 'targeta', 'altre']);
    expect(MAX_ALIES).toBe(80);
    for (const llista of [TIPUS_TITULAR, APPS_ORIGEN, TIPUS_VENDA, CANALS_VENDA, METODES_PAGAMENT]) expect(Object.isFrozen(llista)).toBe(true);
  });
});

describe('registres vàlids', () => {
  test('una venda amb dos tipus d’IVA i pagament mixt, i la seua devolució enllaçada', () => {
    expect(validaRegistreVendes(registre())).toEqual([]);
  });

  test('sense titular (null), sense vendes, una persona (la seua activitat) com a titular i els tres canals', () => {
    expect(validaRegistreVendes(registre({ titular: null, vendes: [] }))).toEqual([]);
    expect(validaRegistreVendes(registre({ titular: activitat({ id: 'tit_ponmlkjihgfedcba' }) }))).toEqual([]);
    for (const canal of CANALS_VENDA) expect(validaRegistreVendes(ambVenda({ canal })), canal).toEqual([]);
  });

  test('una venda que val zero (tot convidat): sense desglossament ni pagaments', () => {
    expect(validaRegistreVendes(ambVenda({ totalCents: 0, perIva: [], pagaments: [] }))).toEqual([]);
  });

  test('una devolució que torna zero (d’una línia convidada) porta el pagament a zero', () => {
    const zero = { ...devolucio(), totalCents: 0, perIva: [], pagaments: [{ metode: 'efectiu', importCents: 0 }] };
    expect(validaRegistreVendes(registre({ vendes: [vendaMixta(), zero] }))).toEqual([]);
  });

  test('l’IVA al 0 % i el tipus que siga: el contracte no coneix cap tipus vigent', () => {
    const perIva = [{ ivaPercent: 0, totalCents: 200 }, { ivaPercent: 7, totalCents: 300 }];
    expect(validaRegistreVendes(ambVenda({ perIva }))).toEqual([]);
  });

  test('el 29 de febrer d’un any de traspàs, la mitjanit i l’últim minut', () => {
    expect(validaRegistreVendes(ambVenda({ data: { a: 2028, m: 2, d: 29 }, hora: '00:00' }))).toEqual([]);
    expect(validaRegistreVendes(ambVenda({ data: { a: 2000, m: 2, d: 29 }, hora: '23:59' }))).toEqual([]);
  });

  test('sobrevivix a un JSON d’anada i tornada', () => {
    expect(validaRegistreVendes(JSON.parse(JSON.stringify(creaRegistreVendes(registre()))))).toEqual([]);
  });
});

describe('registres invàlids', () => {
  test('no és un objecte', () => {
    for (const dolent of [null, undefined, 'sdp.vendes.v1', [], 42]) {
      expect(validaRegistreVendes(dolent), String(dolent)).toEqual([{ codi: 'REGISTRE_INVALID', camp: 'registre', missatge: 'El registre de vendes ha de ser un objecte.' }]);
    }
  });

  test('l’esquema, la moneda, les vendes que no són una llista', () => {
    expect(codis(validaRegistreVendes(registre({ esquema: 'sdp.vendes.v2', moneda: 'USD', vendes: {} })))).toEqual([
      'ESQUEMA_INVALID registre.esquema', 'MONEDA_INVALIDA registre.moneda', 'VENDES_INVALIDES registre.vendes'
    ]);
  });

  test('claus de més, a cada nivell: la llista blanca no deixa passar res', () => {
    const r = registre();
    r.exportatA = 'ara';
    r.titular.formaJuridica = 'cooperativa';
    r.origen.taulaId = 't5';
    r.vendes[0].data.h = 10;
    r.vendes[0].perIva[0].tipus = 'S1';
    r.vendes[0].pagaments[0].canviCents = 300;
    expect(codis(validaRegistreVendes(r))).toEqual([
      'CAMP_DESCONEGUT registre.exportatA', 'CAMP_DESCONEGUT registre.titular.formaJuridica', 'CAMP_DESCONEGUT registre.origen.taulaId',
      'CAMP_DESCONEGUT registre.vendes[0].data.h', 'CAMP_DESCONEGUT registre.vendes[0].perIva[0].tipus',
      'CAMP_DESCONEGUT registre.vendes[0].pagaments[0].canviCents'
    ]);
  });

  test('Principi 4: el desglossament no porta base ni quota (el resultat d’una regla d’impostos)', () => {
    const perIva = [{ ivaPercent: 10, baseCents: 182, quotaCents: 18, totalCents: 200 }, { ivaPercent: 21, totalCents: 300 }];
    expect(codis(validaRegistreVendes(ambVenda({ perIva })))).toEqual([
      'CAMP_DESCONEGUT registre.vendes[0].perIva[0].baseCents', 'CAMP_DESCONEGUT registre.vendes[0].perIva[0].quotaCents'
    ]);
  });

  test('cap nom de persona ni cap text de la caixa: ni atesPer, ni obertPer, ni notes, ni el motiu', () => {
    const errors = validaRegistreVendes(ambVenda({ atesPer: 'Cambrer 1', obertPer: 'Encarregada', notes: 'Sense gel', motiu: 'Copa trencada' }));
    expect(codis(errors)).toEqual([
      'CAMP_DESCONEGUT registre.vendes[0].atesPer', 'CAMP_DESCONEGUT registre.vendes[0].obertPer',
      'CAMP_DESCONEGUT registre.vendes[0].notes', 'CAMP_DESCONEGUT registre.vendes[0].motiu'
    ]);
    expect(errors.every((e) => e.missatge.includes('cap nom de persona'))).toBe(true);
  });

  test('el titular mal format', () => {
    const titular = (canvis) => codis(validaRegistreVendes(registre({ titular: canvis })));
    expect(titular(undefined)).toEqual(['CAMP_OBLIGATORI registre.titular']);
    expect(titular('tit_abcdefghijklmnop')).toEqual(['TITULAR_INVALID registre.titular']);
    expect(titular([])).toEqual(['TITULAR_INVALID registre.titular']);
    expect(titular({})).toEqual([
      'TIPUS_INVALID registre.titular.tipus', 'ID_INVALID registre.titular.id', 'CAMP_OBLIGATORI registre.titular.alies', 'CAMP_OBLIGATORI registre.titular.ambit'
    ]);
    expect(titular({ tipus: 'bar', id: 'Tit_Abc', alies: 'Bar', ambit: 'ACTIVITAT' })).toEqual(['TIPUS_INVALID registre.titular.tipus', 'ID_INVALID registre.titular.id']);
    expect(titular(activitat({ id: t('tit_', '0000', '0000', 't') }))).toEqual(['ID_INVALID registre.titular.id']);
    expect(titular(activitat({ alies: 'x'.repeat(81) }))).toEqual(['TEXT_MASSA_LLARG registre.titular.alies']);
    expect(titular(activitat({ alies: t('Taller', '\n', 'nou') }))).toEqual(['TEXT_INVALID registre.titular.alies']);
    expect(titular(activitat({ alies: t('nom', '@', 'exemple', '.org') }))).toEqual(['IDENTIFICADOR_PERSONAL registre.titular.alies']);
  });

  test('l’àmbit del titular: la llar no ven mai, i l’àmbit va lligat al tipus', () => {
    const titular = (canvis) => codis(validaRegistreVendes(registre({ titular: canvis })));
    expect(titular(activitat({ alies: 'La meua llar', ambit: 'LLAR' }))).toEqual(['AMBIT_INVALID registre.titular.ambit']);
    expect(titular({ tipus: 'entitat', id: 'tit_abcd', alies: 'Cooperativa', ambit: 'LLAR' })).toEqual(['AMBIT_INVALID registre.titular.ambit']);
    expect(titular(activitat({ ambit: 'ENTITAT' }))).toEqual(['AMBIT_INVALID registre.titular.ambit']);
    expect(titular({ tipus: 'entitat', id: 'tit_abcd', alies: 'Cooperativa', ambit: 'ACTIVITAT' })).toEqual(['AMBIT_INVALID registre.titular.ambit']);
    expect(titular(activitat({ ambit: 'activitat' }))).toEqual(['AMBIT_INVALID registre.titular.ambit']);
    expect(titular(activitat({ ambit: undefined }))).toEqual(['CAMP_OBLIGATORI registre.titular.ambit']);
    expect(titular({ tipus: 'bar', id: 'tit_abcd', alies: 'Bar', ambit: 'LLAR' })).toEqual(['TIPUS_INVALID registre.titular.tipus', 'AMBIT_INVALID registre.titular.ambit']);
    expect(titular({ tipus: 'entitat', id: 'tit_abcd', alies: 'Cooperativa', ambit: 'ENTITAT' })).toEqual([]);
  });

  test('l’origen: només el Bar, i l’establiment és un slug', () => {
    expect(codis(validaRegistreVendes(registre({ origen: { app: 'nevera', establiment: 'El Meu Bar' } })))).toEqual([
      'APP_INVALIDA registre.origen.app', 'SLUG_INVALID registre.origen.establiment'
    ]);
    expect(codis(validaRegistreVendes(registre({ origen: null })))).toEqual(['ORIGEN_INVALID registre.origen']);
    expect(codis(validaRegistreVendes(registre({ origen: { app: 'bar', establiment: 'a'.repeat(65) } })))).toEqual(['SLUG_INVALID registre.origen.establiment']);
  });

  test('imports negatius o que no són enters de cèntims', () => {
    expect(codis(validaRegistreVendes(ambVenda({ totalCents: -500 })))).toEqual(['IMPORT_INVALID registre.vendes[0].totalCents']);
    expect(codis(validaRegistreVendes(ambVenda({ totalCents: 5.5 })))).toEqual(['IMPORT_INVALID registre.vendes[0].totalCents']);
    const perIva = vendaMixta().perIva;
    perIva[0].totalCents = -200;
    expect(codis(validaRegistreVendes(ambVenda({ perIva })))).toEqual(['IMPORT_INVALID registre.vendes[0].perIva[0].totalCents']);
    expect(codis(validaRegistreVendes(ambVenda({ pagaments: [{ metode: 'efectiu', importCents: -200 }, { metode: 'targeta', importCents: 700 }] }))))
      .toEqual(['IMPORT_INVALID registre.vendes[0].pagaments[0].importCents']);
    expect(codis(validaRegistreVendes(ambVenda({ pagaments: [{ metode: 'efectiu', importCents: '500' }] }))))
      .toEqual(['IMPORT_INVALID registre.vendes[0].pagaments[0].importCents']);
  });

  test('una devolució en negatiu tampoc: el signe no va dins dels imports', () => {
    const negativa = {
      ...devolucio(), totalCents: -300, perIva: [{ ivaPercent: 21, totalCents: -300 }],
      pagaments: [{ metode: 'efectiu', importCents: -300 }]
    };
    expect(codis(validaRegistreVendes(registre({ vendes: [negativa] })))).toEqual([
      'IMPORT_INVALID registre.vendes[0].totalCents', 'IMPORT_INVALID registre.vendes[0].perIva[0].totalCents',
      'IMPORT_INVALID registre.vendes[0].pagaments[0].importCents'
    ]);
  });

  test('dates impossibles i hores que no són «HH:MM»', () => {
    for (const data of [{ a: 2026, m: 2, d: 29 }, { a: 2026, m: 4, d: 31 }, { a: 2026, m: 13, d: 1 }, { a: 2026, m: 0, d: 1 }, { a: 1900, m: 2, d: 29 },
      { a: 999, m: 1, d: 1 }, { a: 2026, m: 10, d: 2.5 }, '2026-10-02', null]) {
      expect(codis(validaRegistreVendes(ambVenda({ data }))), JSON.stringify(data)).toEqual(['DATA_INVALIDA registre.vendes[0].data']);
    }
    for (const hora of ['24:00', '9:05', '12:60', '12.30', '12:30:00', 1230, undefined]) {
      expect(codis(validaRegistreVendes(ambVenda({ hora }))), String(hora)).toEqual(['HORA_INVALIDA registre.vendes[0].hora']);
    }
  });

  test('id, número, tipus i canal', () => {
    expect(codis(validaRegistreVendes(ambVenda({ id: 'K-1', numero: 0, tipus: 'factura', canal: 'domicili' })))).toEqual([
      'ID_INVALID registre.vendes[0].id', 'NUMERO_INVALID registre.vendes[0].numero', 'TIPUS_INVALID registre.vendes[0].tipus',
      'CANAL_INVALID registre.vendes[0].canal'
    ]);
    expect(codis(validaRegistreVendes(registre({ vendes: [vendaMixta(), vendaMixta()] })))).toEqual(['ID_REPETIT registre.vendes[1].id']);
    expect(codis(validaRegistreVendes(registre({ vendes: [vendaMixta(), 'k-2'] })))).toEqual(['VENDA_INVALIDA registre.vendes[1]']);
  });

  test('la devolució sempre diu d’on ve; la venda, mai', () => {
    const senseOrigen = devolucio();
    delete senseOrigen.tiquetOrigenId;
    expect(codis(validaRegistreVendes(registre({ vendes: [senseOrigen] })))).toEqual(['CAMP_OBLIGATORI registre.vendes[0].tiquetOrigenId']);
    expect(codis(validaRegistreVendes(registre({ vendes: [{ ...devolucio(), tiquetOrigenId: 'k-mgahhx2o-9zzz' }] }))))
      .toEqual(['ID_INVALID registre.vendes[0].tiquetOrigenId']);
    expect(codis(validaRegistreVendes(ambVenda({ tiquetOrigenId: 'k-1' })))).toEqual(['CAMP_SOBRANT registre.vendes[0].tiquetOrigenId']);
  });

  test('les xifres no quadren: el desglossament, els pagaments', () => {
    const perIva = vendaMixta().perIva;
    perIva[1].totalCents = 299;
    expect(codis(validaRegistreVendes(ambVenda({ perIva })))).toEqual(['DESGLOSSAMENT_NO_QUADRA registre.vendes[0].perIva']);
    expect(codis(validaRegistreVendes(ambVenda({ perIva: [vendaMixta().perIva[0]] })))).toEqual(['DESGLOSSAMENT_NO_QUADRA registre.vendes[0].perIva']);
    expect(codis(validaRegistreVendes(ambVenda({ pagaments: [{ metode: 'targeta', importCents: 300 }] })))).toEqual(['PAGAMENTS_NO_QUADREN registre.vendes[0].pagaments']);
  });

  test('el desglossament i els pagaments: llistes d’objectes, tipus d’IVA d’un enter de 0 a 100 sense repetir, mètodes coneguts', () => {
    expect(codis(validaRegistreVendes(ambVenda({ perIva: null, pagaments: 'efectiu' })))).toEqual([
      'DESGLOSSAMENT_INVALID registre.vendes[0].perIva', 'PAGAMENTS_INVALIDS registre.vendes[0].pagaments'
    ]);
    expect(codis(validaRegistreVendes(ambVenda({ perIva: [10], pagaments: [500] })))).toEqual([
      'DESGLOSSAMENT_INVALID registre.vendes[0].perIva[0]', 'PAGAMENTS_INVALIDS registre.vendes[0].pagaments[0]'
    ]);
    const [deu, vintIU] = vendaMixta().perIva;
    expect(codis(validaRegistreVendes(ambVenda({ perIva: [deu, { ...vintIU, ivaPercent: 10 }] })))).toEqual(['IVA_REPETIT registre.vendes[0].perIva[1].ivaPercent']);
    for (const ivaPercent of [-1, 101, 10.5, '10']) {
      expect(codis(validaRegistreVendes(ambVenda({ perIva: [{ ...deu, ivaPercent }, vintIU] }))), String(ivaPercent)).toEqual(['IVA_INVALID registre.vendes[0].perIva[0].ivaPercent']);
    }
    expect(codis(validaRegistreVendes(ambVenda({ pagaments: [{ metode: 'bizum', importCents: 500 }] })))).toEqual(['METODE_INVALID registre.vendes[0].pagaments[0].metode']);
  });

  test('un forat en una llista (vendes, desglossament o pagaments) és un error: el que passa la validació sobrevivix al JSON', () => {
    const ambForat = (element) => {
      const llista = [];
      llista[1] = element;
      return llista;
    };
    const vendes = ambForat(vendaMixta());
    expect(0 in vendes).toBe(false);
    expect(codis(validaRegistreVendes(registre({ vendes })))).toEqual(['VENDA_INVALIDA registre.vendes[0]']);
    expect(() => creaRegistreVendes(registre({ vendes }))).toThrow(expect.objectContaining({ codi: 'REGISTRE_INVALID' }));
    expect(codis(validaRegistreVendes(ambVenda({ perIva: ambForat({ ivaPercent: 10, totalCents: 500 }) }))))
      .toEqual(['DESGLOSSAMENT_INVALID registre.vendes[0].perIva[0]']);
    expect(codis(validaRegistreVendes(ambVenda({ pagaments: ambForat({ metode: 'efectiu', importCents: 500 }) }))))
      .toEqual(['PAGAMENTS_INVALIDS registre.vendes[0].pagaments[0]']);
  });
});

describe('creaRegistreVendes', () => {
  test('una còpia nova, amb les claus del contracte i congelada en profunditat', () => {
    const dades = registre({ titular: activitat({ alies: '  El meu taller  ' }) });
    const creat = creaRegistreVendes(dades);
    expect(creat.titular).toEqual({ tipus: 'persona', id: 'tit_abcd', alies: 'El meu taller', ambit: 'ACTIVITAT' });
    expect(Object.keys(creat.titular)).toEqual(['tipus', 'id', 'alies', 'ambit']);
    expect(Object.keys(creat)).toEqual(['esquema', 'moneda', 'titular', 'origen', 'vendes']);
    expect(creat.vendes[0].perIva).toEqual([{ ivaPercent: 10, totalCents: 200 }, { ivaPercent: 21, totalCents: 300 }]);
    expect(Object.keys(creat.vendes[0])).toEqual(['id', 'numero', 'tipus', 'data', 'hora', 'canal', 'totalCents', 'perIva', 'pagaments']);
    expect(creat.vendes[1].tiquetOrigenId).toBe('k-mgahhx2o-4f2a');
    for (const valor of [creat, creat.titular, creat.origen, creat.vendes, creat.vendes[0], creat.vendes[0].data, creat.vendes[0].perIva[1], creat.vendes[1].pagaments[0]]) {
      expect(Object.isFrozen(valor)).toBe(true);
    }
    expect(creat.vendes[0]).not.toBe(dades.vendes[0]);
    expect(creat.vendes[0].perIva).not.toBe(dades.vendes[0].perIva);
    dades.vendes[0].totalCents = 1;
    expect(creat.vendes[0].totalCents).toBe(500);
    expect(Object.isFrozen(dades)).toBe(false);
  });

  test('un registre invàlid llança REGISTRE_INVALID amb tots els errors a `detalls`', () => {
    let error = null;
    try {
      creaRegistreVendes(ambVenda({ totalCents: -1, atesPer: 'Cambrer 1' }));
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(Error);
    expect(error.codi).toBe('REGISTRE_INVALID');
    expect(codis(error.detalls)).toEqual(['CAMP_DESCONEGUT registre.vendes[0].atesPer', 'IMPORT_INVALID registre.vendes[0].totalCents']);
  });
});

describe('esDataValida', () => {
  test('dies que existixen, i res més', () => {
    expect(esDataValida({ a: 2026, m: 10, d: 2 })).toBe(true);
    expect(esDataValida({ a: 2024, m: 2, d: 29 })).toBe(true);
    for (const dolent of [{ a: 2025, m: 2, d: 29 }, { a: 2026, m: 6, d: 31 }, { a: 10000, m: 1, d: 1 }, {}, null, '2026-10-02', [2026, 10, 2]]) {
      expect(esDataValida(dolent), JSON.stringify(dolent)).toBe(false);
    }
  });
});

describe('la Gestoria hi pot entrar (només lectura de les seues guardes)', () => {
  test('un titular de la Gestoria, fet amb creaTitular, passa al registre amb { tipus, id, alies, ambit }; el de la llar, no', () => {
    const llar = creaTitular({ id: nouIdOpac('tit', new Uint8Array(16).fill(17)), tipus: 'persona', ambit: 'LLAR', alies: 'La meua llar' });
    const deLActivitat = creaTitular({ id: nouIdOpac('tit', new Uint8Array(16).fill(34)), tipus: 'persona', ambit: 'ACTIVITAT', alies: 'El meu bar', persona: llar.id });
    const titular = titularDelRegistre(deLActivitat);
    expect(titular).toEqual({ tipus: 'persona', id: deLActivitat.id, alies: 'El meu bar', ambit: 'ACTIVITAT' });
    expect(validaRegistreVendes(registre({ titular }))).toEqual([]);
    const entitat = creaTitular({ id: 'tit_cooperativa', tipus: 'entitat', ambit: 'ENTITAT', alies: 'Cooperativa del poble', formaJuridica: 'cooperativa' });
    expect(validaRegistreVendes(registre({ titular: titularDelRegistre(entitat) }))).toEqual([]);
    /* La frontera LLAR/ACTIVITAT de la Gestoria: res de la llar entra en un registre de l'activitat. */
    expect(codis(validaRegistreVendes(registre({ titular: titularDelRegistre(llar) })))).toEqual(['AMBIT_INVALID registre.titular.ambit']);
  });

  test('paritat de l’àmbit: els de la Gestoria, un per tipus, i cap és la llar', () => {
    expect(AMBIT_DEL_TIPUS).toEqual({ persona: 'ACTIVITAT', entitat: 'ENTITAT' });
    expect(Object.isFrozen(AMBIT_DEL_TIPUS)).toBe(true);
    expect(Object.keys(AMBIT_DEL_TIPUS)).toEqual(TIPUS_TITULAR);
    for (const [tipus, ambit] of Object.entries(AMBIT_DEL_TIPUS)) {
      expect(AMBITS, ambit).toContain(ambit);
      /* La Gestoria accepta la parella (creaTitular llançaria). */
      const extra = tipus === 'entitat' ? { formaJuridica: 'cooperativa' } : { persona: 'tit_llarllarllar' };
      expect(creaTitular({ id: 'tit_parella', tipus, ambit, alies: 'Parella', ...extra }).ambit).toBe(ambit);
    }
    expect(Object.values(AMBIT_DEL_TIPUS)).not.toContain('LLAR');
  });

  test('titularDelRegistre: sense titular, null; un valor que no és un objecte passa tal qual i la validació el troba', () => {
    expect(titularDelRegistre(null)).toBeNull();
    expect(titularDelRegistre(undefined)).toBeNull();
    expect(titularDelRegistre('tit_abcd')).toBe('tit_abcd');
    expect(codis(validaRegistreVendes(registre({ titular: titularDelRegistre('tit_abcd') })))).toEqual(['TITULAR_INVALID registre.titular']);
  });

  test('paritat de l’id opac: el registre accepta exactament els ids de titular que accepta la Gestoria', () => {
    const ids = [
      'tit_abcdefghijklmnop', nouIdOpac('tit', new Uint8Array(16)), 'abcd', 'abc', 'Tit_abcd', '1tit', '_tit', 'tit-amb-guions_i_baixos9',
      'a'.repeat(96), 'a'.repeat(97), t('tit_', '0000', '0000', 't'), t('tit_', 'x', '0000000', 'l'), t('tit_', 'es', '00', '_0000_0000_0000_0000'),
      t('tit_6', '00', '_00_00_00'), 'tit abcd', 'tit.abcd', 42, null
    ];
    for (const id of ids) {
      const delRegistre = !codis(validaRegistreVendes(registre({ titular: activitat({ id }) }))).includes('ID_INVALID registre.titular.id');
      expect(delRegistre, String(id)).toBe(esIdOpacGestoria(id));
    }
  });

  test('paritat de l’àlies: els mateixos errors que comprovaText de la Gestoria (obligatori, 80 caràcters)', () => {
    const aliesos = [
      'Bar de la Plaça', '  Forn  ', 'x'.repeat(80), 'x'.repeat(81), '', '   ', null, 42, t('Llar', '\n', 'nova'), t('Llar', car(0x7F)),
      t('Bar ', '0000', '0000', 'T'), t('nom', '@', 'exemple', '.org'), t('Tel ', '6', '00', ' 00 00 00'), t('ES', '00', ' 0000 0000 0000 0000 0000'),
      t('Casa ', 'Y', '0000000', 'X'), 'Taula 12', 'Any 2026'
    ];
    for (const alies of aliesos) {
      const gestoria = [];
      comprovaText(alies, 'registre.titular.alies', gestoria, { obligatori: true, maxim: 80 });
      const nostres = validaRegistreVendes(registre({ titular: activitat({ alies }) })).filter((e) => e.camp === 'registre.titular.alies');
      expect(nostres.map((e) => e.codi), JSON.stringify(alies)).toEqual(gestoria.map((e) => e.codi));
    }
  });
});

describe('qualitat de src/utils/vendes', () => {
  const ARREL = process.cwd();
  const CARPETA = 'src/utils/vendes';
  const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
  const TOTS = readdirSync(path.join(ARREL, CARPETA)).filter((f) => /\.jsx?$/.test(f)).map((f) => `${CARPETA}/${f}`).sort();
  const PRODUCCIO = TOTS.filter((f) => !/\.test\.jsx?$/.test(f));
  const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  test('el cens: el mòdul i la seua prova', () => {
    expect(TOTS).toEqual([`${CARPETA}/registreVendes.js`, `${CARPETA}/registreVendes.test.js`]);
  });

  test('ESLint: zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(TOTS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(TOTS.length);
    expect(missatges).toEqual([]);
    /* Sonda: la configuració del projecte és activa. */
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, CARPETA, 'sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);

  test('JS pur: cap import, cap rellotge, atzar, DOM, React, xarxa ni emmagatzematge', () => {
    const impurs = new RegExp(t('\\b(?:Da', 'te|React|use[A-Z]\\w*|win', 'dow|docu', 'ment|navi', 'gator|global', 'This|set', 'Timeout|set',
      'Interval|fet', 'ch|XMLHttp', 'Request|local', 'Storage|session', 'Storage|indexed', 'DB)\\b|Math\\.ran', 'dom|cryp', 'to\\.'));
    expect(impurs.test(t('new Da', 'te()'))).toBe(true);
    for (const fitxer of PRODUCCIO) {
      const codi = senseComentaris(llig(fitxer));
      expect(codi.match(impurs), fitxer).toBeNull();
      expect(/\bimport\b|\brequire\s*\(/.test(codi), fitxer).toBe(false);
    }
  });

  test('Principi 4 de la Gestoria: cap model de declaració, cap llista de tipus d’IVA ni cap càlcul de quota', () => {
    for (const fitxer of PRODUCCIO) {
      const codi = senseComentaris(llig(fitxer));
      expect(/\b(?:303|130|111|390)\b/.test(codi), `${fitxer}: model`).toBe(false);
      expect(/TIPUS_IVA|\b(?:4|10|21)\s*,\s*(?:10|21)\b/.test(codi), `${fitxer}: tipus vigents`).toBe(false);
      expect(/ivaPercent\s*[*/]|[*/]\s*\(?\s*100\s*\+/.test(codi), `${fitxer}: càlcul de quota`).toBe(false);
      expect(/\b(?:baseCents|quotaCents)\b/.test(codi), `${fitxer}: base o quota`).toBe(false);
    }
  });

  test('Baseline 2022: cap API més nova ni lookbehind', () => {
    const vetat = /\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers|\(\?<[=!]/;
    for (const fitxer of PRODUCCIO) expect(vetat.test(llig(fitxer)), fitxer).toBe(false);
  });

  test('cap caràcter de control, invisible, combinant ni bidi en cru (proves incloses)', () => {
    const rangs = [[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x00A0, 0x00A0], [0x0300, 0x036F], [0x061C, 0x061C], [0x200B, 0x200F],
      [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF]];
    const re = new RegExp(`[${rangs.map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');
    for (const fitxer of TOTS) expect(re.test(llig(fitxer)), fitxer).toBe(false);
  });
});
