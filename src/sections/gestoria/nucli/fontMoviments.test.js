// @vitest-environment node
/* Onada 12 (261011; ordres 261011_0130, punt 6). El port dels moviments del
   banc: els dos adaptadors d'ara (Norma 43 i CSV) passen el kit de
   conformitat, i un tercer adaptador (el d'un agregador bancari, fet ací de
   mentida i sense xarxa) s'endolla sense tocar res. Dades sintètiques. */
import { describe, expect, test } from 'vitest';
import { concilia } from './concilia.js';
import {
  CAMPS_MOVIMENT, ESQUEMA_FONT_MOVIMENTS, TIPUS_FONT_MOVIMENTS, comprovaFont, creaFont, fontDeC43, fontDeCsv, llegixFonts, uneixMoviments
} from './fontMoviments.js';
import { crearFactura } from './model.js';

const D = (a, m, d) => ({ a, m, d });

/* ── Norma 43 sintètica, registre a registre (forma de c43.test.js) ── */
const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
const camp = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const COMPTE = { entitat: '9999', oficina: '0001', compte: '0000004321' };
const r11 = (des, fins) => `11${COMPTE.entitat}${COMPTE.oficina}${COMPTE.compte}${des}${fins}2${xifres(0, 14)}9783${camp('TITULAR SINTETIC', 26)}${camp('', 3)}`;
const r22 = ({ op, centims }) => `22${camp('', 4)}0001${op}${op}990001${xifres(centims, 14)}${xifres(0, 10)}${camp('', 12)}${camp('', 16)}`;
const r23 = (text) => `2301${camp(text, 38)}${camp('', 38)}`;
const r33 = (carrecs) => `33${COMPTE.entitat}${COMPTE.oficina}${COMPTE.compte}${xifres(carrecs.length, 5)}${xifres(carrecs.reduce((s, c) => s + c, 0), 14)}${xifres(0, 5)}${xifres(0, 14)}1${xifres(carrecs.reduce((s, c) => s + c, 0), 14)}978${camp('', 4)}`;
const r88 = (n) => `88${'9'.repeat(18)}${xifres(n, 6)}${camp('', 54)}`;
/* Un extracte amb els càrrecs que es diuen: [{ op: 'aammdd', centims, text }]. */
function norma43(des, fins, carrecs) {
  const linies = [r11(des, fins), ...carrecs.flatMap((c) => [r22(c), r23(c.text)]), r33(carrecs.map((c) => c.centims))];
  return `${[...linies, r88(linies.length)].join('\r\n')}\r\n`;
}
const JULIOL = norma43('990701', '990731', [
  { op: '990705', centims: 12100, text: 'PAGO FACTURA PRV-1001' },
  { op: '990710', centims: 150, text: 'CAFE BAR SINTETIC' },
  { op: '990710', centims: 150, text: 'CAFE BAR SINTETIC' }
]);
/* Se solapa amb l'anterior: torna a portar el dia 10 i afig l'agost. */
const JULIOL_AGOST = norma43('990710', '990831', [
  { op: '990710', centims: 150, text: 'CAFE BAR SINTETIC' },
  { op: '990710', centims: 150, text: 'CAFE BAR SINTETIC' },
  { op: '990802', centims: 4500, text: 'COMPRA FERRETERIA' }
]);
const TARGETA = ['Extracte de targeta', 'Fecha;Comercio;Importe', '01/07/2099;FERRETERIA SINTETICA;25,00', '02/07/2099;FORN SINTETIC;2,00',
  '03/07/2099;FERRETERIA SINTETICA;-5,00'].join('\n');

describe('els adaptadors d’ara', () => {
  test('la Norma 43: passa el kit, sense avisos, i cada moviment porta el contracte sencer', () => {
    const font = fontDeC43(JULIOL, { nom: 'juliol.n43' });
    expect(comprovaFont(font)).toEqual([]);
    expect(font).toMatchObject({ esquema: ESQUEMA_FONT_MOVIMENTS, tipus: 'c43', nom: 'juliol.n43', local: true, avisos: [] });
    expect(font.cobertura).toEqual({ des: D(2099, 7, 5), fins: D(2099, 7, 10) });
    const [primer] = font.llegixMoviments();
    expect(Object.keys(primer)).toEqual([...CAMPS_MOVIMENT]);
    expect(primer).toMatchObject({
      data: D(2099, 7, 5), dataValor: D(2099, 7, 5), concepte: 'PAGO FACTURA PRV-1001', import: -12100, saldo: null, moneda: 'EUR',
      compte: '9999-4321', origen: { font: font.id, tipus: 'c43', posicio: 2 }
    });
    expect(primer.id).toMatch(/^mv_[0-9a-f]{16}$/);
  });

  test('el número sencer del compte no ix mai: només l’entitat i els quatre últims dígits', () => {
    const text = JSON.stringify(fontDeC43(JULIOL).llegixMoviments().map((m) => [m.id, m.compte, m.concepte, m.origen]));
    expect(text).not.toContain(COMPTE.compte);
    expect(text).toContain('9999-4321');
  });

  test('el CSV de la targeta: passa el kit i diu el format que ha detectat', () => {
    const font = fontDeCsv(TARGETA, { nom: 'targeta.csv' });
    expect(comprovaFont(font)).toEqual([]);
    expect(font).toMatchObject({ tipus: 'csv', targeta: true, format: { delimitador: 'punt i coma', signe: 'girat', motiuSigne: 'TARGETA' } });
    expect(font.llegixMoviments().map((m) => [m.import, m.compte, m.saldo, m.detall.comerc])).toEqual([
      [-2500, null, null, 'FERRETERIA SINTETICA'], [-200, null, null, 'FORN SINTETIC'], [500, null, null, 'FERRETERIA SINTETICA']
    ]);
  });

  test('els tipus declarats són els dels adaptadors que existixen', () => {
    expect([fontDeC43(JULIOL).tipus, fontDeCsv(TARGETA).tipus]).toEqual([...TIPUS_FONT_MOVIMENTS]);
  });
});

describe('l’identificador estable', () => {
  test('dues lectures del mateix fitxer donen els mateixos id, i dos cafés iguals del mateix dia en tenen dos', () => {
    const [x, y] = [fontDeC43(JULIOL), fontDeC43(JULIOL)];
    expect(x.id).toBe(y.id);
    expect(x.llegixMoviments().map((m) => m.id)).toEqual(y.llegixMoviments().map((m) => m.id));
    expect(new Set(x.llegixMoviments().map((m) => m.id)).size).toBe(3);
  });

  test('dos extractes que se solapen: el dia repetit només compta una vegada', () => {
    const { moviments, repetits, avisos } = llegixFonts([fontDeC43(JULIOL, { nom: 'a.n43' }), fontDeC43(JULIOL_AGOST, { nom: 'b.n43' })]);
    expect(repetits).toBe(2);
    expect(moviments.map((m) => [m.data.m, m.data.d, m.import])).toEqual([[7, 5, -12100], [7, 10, -150], [7, 10, -150], [8, 2, -4500]]);
    expect(avisos).toEqual([]);
  });

  test('el mateix fitxer triat dues vegades no duplica res', () => {
    expect(llegixFonts([fontDeC43(JULIOL), fontDeC43(JULIOL)])).toMatchObject({ repetits: 3, moviments: { length: 3 } });
  });

  test('uneixMoviments no es fia de res: llistes buides, nul·les o sense id', () => {
    expect(uneixMoviments(null)).toEqual({ moviments: [], repetits: 0, dubtosos: 0 });
    expect(uneixMoviments([null, [null, {}, { id: 7 }]])).toEqual({ moviments: [], repetits: 0, dubtosos: 0 });
  });
});

/* Correccions 261011 (refutador adversari, punts 2 i 7): roges abans del canvi. */
describe('correccions del refutador · dos extractes sense compte conegut', () => {
  const extracte = (files) => ['Fecha;Comercio;Importe', ...files].join('\n');
  const SUBSCRIPCIO = '05/07/2099;SUBSCRIPCIO SINTETICA;-9,99';

  test('dues targetes amb la mateixa subscripció el mateix dia: no es perd cap moviment, i s’avisa del dubte', () => {
    const a = fontDeCsv(extracte([SUBSCRIPCIO, '06/07/2099;FORN SINTETIC;-2,00']), { nom: 'targeta_a.csv' });
    const b = fontDeCsv(extracte([SUBSCRIPCIO, '07/07/2099;BAR SINTETIC;-3,00']), { nom: 'targeta_b.csv' });
    const unio = llegixFonts([a, b]);
    expect(unio.moviments.map((m) => m.import)).toEqual([-999, -999, -200, -300]);
    expect(unio).toMatchObject({ repetits: 0, dubtosos: 1 });
  });

  test('igual si els dos fitxers es diuen igual: sense compte conegut, mai es desduplica en silenci', () => {
    const a = fontDeCsv(extracte([SUBSCRIPCIO, '06/07/2099;FORN SINTETIC;-2,00']), { nom: 'movimientos.csv' });
    const b = fontDeCsv(extracte([SUBSCRIPCIO, '07/07/2099;BAR SINTETIC;-3,00']), { nom: 'movimientos.csv' });
    expect(llegixFonts([a, b])).toMatchObject({ repetits: 0, dubtosos: 1, moviments: { length: 4 } });
  });

  test('el mateix fitxer triat dues vegades (mateix nom i mateix contingut) sí que és el mateix: compta una vegada', () => {
    const text = extracte([SUBSCRIPCIO, '06/07/2099;FORN SINTETIC;-2,00']);
    expect(llegixFonts([fontDeCsv(text, { nom: 'targeta_a.csv' }), fontDeCsv(text, { nom: 'targeta_a.csv' })]))
      .toMatchObject({ repetits: 2, dubtosos: 0, moviments: { length: 2 } });
  });

  test('l’id d’un moviment de CSV porta la identitat del fitxer: dos fitxers de nom diferent no compartixen cap id', () => {
    const a = fontDeCsv(extracte([SUBSCRIPCIO]), { nom: 'targeta_a.csv' });
    const b = fontDeCsv(extracte([SUBSCRIPCIO]), { nom: 'targeta_b.csv' });
    expect(a.llegixMoviments()[0].id).not.toBe(b.llegixMoviments()[0].id);
    expect(comprovaFont(a)).toEqual([]);
  });

  test('punt 7 · la moneda viatja amb el moviment fins a la conciliació: un càrrec en dòlars no és en euros', () => {
    const font = fontDeCsv(['Fecha;Concepto;Importe;Moneda', '01/07/2099;SINTETIC INC;-12,50;USD', '02/07/2099;SINTETIC SL;-3,00;EUR'].join('\n'));
    expect(font.llegixMoviments().map((m) => [m.moneda, m.detall.moneda])).toEqual([['USD', 'USD'], ['EUR', undefined]]);
  });

  test('el nom del fitxer fa de pista: «tarjeta» al nom vol dir targeta, i les compres en positiu es giren', () => {
    const text = ['Fecha;Concepto;Importe', '01/07/2099;FERRETERIA SINTETICA;25,00', '02/07/2099;FORN SINTETIC;2,50'].join('\n');
    expect(fontDeCsv(text, { nom: 'moviments.csv' })).toMatchObject({ targeta: false, format: { signeDubtos: true } });
    expect(fontDeCsv(text, { nom: 'Tarjeta_juliol.csv' })).toMatchObject({ targeta: true, format: { signe: 'girat', signeDubtos: false } });
  });
});

describe('el rang', () => {
  const font = fontDeC43(JULIOL_AGOST);

  test('els dos extrems hi entren; un extrem absent deixa el rang obert', () => {
    expect(font.llegixMoviments({ des: D(2099, 7, 10), fins: D(2099, 7, 10) })).toHaveLength(2);
    expect(font.llegixMoviments({ des: D(2099, 7, 11) })).toHaveLength(1);
    expect(font.llegixMoviments({ fins: D(2099, 7, 9) })).toHaveLength(0);
    expect(font.llegixMoviments({ des: D(2099, 8, 2), fins: D(2099, 8, 2) }).map((m) => m.import)).toEqual([-4500]);
  });

  test('el tall del trimestre: el 30 de setembre és del 3r i l’1 d’octubre, del 4t', () => {
    const tall = fontDeCsv(['Fecha;Concepto;Importe', '30/09/2099;ULTIM DEL TERCER;-1,00', '01/10/2099;PRIMER DEL QUART;-2,00'].join('\n'));
    expect(tall.llegixMoviments({ des: D(2099, 7, 1), fins: D(2099, 9, 30) }).map((m) => m.concepte)).toEqual(['ULTIM DEL TERCER']);
    expect(tall.llegixMoviments({ des: D(2099, 10, 1), fins: D(2099, 12, 31) }).map((m) => m.concepte)).toEqual(['PRIMER DEL QUART']);
  });
});

describe('enxufable: un tercer adaptador', () => {
  /* El que faria un agregador bancari: rep moviments d'on siga i en fa una font amb creaFont. */
  const moviment = (id, data, centims) => ({
    id, data, dataValor: data, concepte: 'MOVIMENT DE L’AGREGADOR', import: centims, saldo: 100000 + centims, moneda: 'EUR',
    compte: '9999-4321', origen: { posicio: id }, detall: { dataOperacio: data, dataValor: data, centims, conceptes: [] }
  });
  const agregador = creaFont({ tipus: 'agregador-de-prova', nom: 'Banc sintètic', moviments: [moviment('ag_2', D(2099, 7, 9), -300), moviment('ag_1', D(2099, 7, 8), -200)] });

  test('passa el mateix kit i ordena per data', () => {
    expect(comprovaFont(agregador)).toEqual([]);
    expect(agregador.llegixMoviments().map((m) => m.id)).toEqual(['ag_1', 'ag_2']);
  });

  test('els seus moviments s’unixen amb els dels fitxers i entren a la conciliació pel `detall`', () => {
    const { moviments } = llegixFonts([fontDeC43(JULIOL), agregador]);
    expect(moviments).toHaveLength(5);
    const pagada = crearFactura({ data: D(2099, 7, 1), num: 'PRV-1001', contrapart: 'Proveidor Sintetic SL', nif: ['A1234', '5674'].join(''), subtotal: 10000, iva: 2100, total: 12100 });
    const resultat = concilia({ moviments: moviments.map((m) => m.detall), factures: [pagada] });
    expect(resultat.parelles).toEqual([expect.objectContaining({ regla: 'R1', confianca: 'alta', diferencia: 0 })]);
  });

  test('una font de xarxa (local: false) no es llig com si fora local: cal esperar-la', () => {
    const remota = creaFont({ tipus: 'agregador-de-prova', moviments: [], local: false });
    expect(() => llegixFonts([remota])).toThrow(/no és local/);
    expect(comprovaFont(remota)).toEqual([]);
  });

  test('el kit caça una font que no complix: id repetits, imports amb decimals, desordre i rang trencat', () => {
    expect(comprovaFont(null)).toEqual(['Una font és un objecte.']);
    expect(comprovaFont({ ...agregador, esquema: 'un-altre' })).toEqual([expect.stringContaining('esquema')]);
    const dolenta = {
      ...agregador,
      llegixMoviments: () => [
        { ...moviment('x', D(2099, 7, 9), -300), origen: { font: agregador.id } },
        { ...moviment('x', D(2099, 7, 8), -2.5), origen: { font: agregador.id } }
      ]
    };
    const errors = comprovaFont(dolenta).join(' ');
    expect(errors).toMatch(/cèntims enters/);
    expect(errors).toMatch(/mateix id/);
    expect(errors).toMatch(/ordenats per data/);
    expect(errors).toMatch(/rang/);
  });
});
