// @vitest-environment node
/* El Bar · nucli/vendes.js — els tiquets del Bar com a registre sdp.vendes.v1
   (ordre del Mestre, 261006). Tots els tiquets són REALS: fets amb les
   funcions del nucli (creaComanda, afegeixProducte, afegeixPagament, tanca,
   creaDevolucio) sobre la carta d'exemple, cap objecte inventat a mà. La
   data i l'hora ixen de la zona IANA de l'establiment que rep l'adaptador
   (correcció de la revisió, 261006), no de la del procés: totes les proves
   valen en qualsevol TZ. Correccions de la mateixa revisió: el desglossament
   porta el total de cada tipus (cap base ni quota), el titular porta l'àmbit
   i un tiquet sense tancatA es refusa amb l'id als detalls. */
import { describe, expect, test } from 'vitest';
import { ESQUEMA_VENDES, MONEDA_VENDES, validaRegistreVendes } from '../../../utils/vendes/registreVendes.js';
import { afegeixPagament, tanca } from './cobrament.js';
import { afegeixProducte, convida, creaComanda, totals } from './comanda.js';
import { ESTABLIMENT_EXEMPLE, llavorCarta } from './llavor.js';
import { creaDevolucio } from './tiquet.js';
import { dataLocal, esTiquetDeVenda, esZona, horaEnZona, registreDeVendes, vendaDeTiquet } from './vendes.js';

const CARTA = llavorCarta();
const P = (id) => CARTA.productes.find((p) => p.id === id);
const IVA = ESTABLIMENT_EXEMPLE.ivaPerDefecte;
const ESTABLIMENT = ESTABLIMENT_EXEMPLE.slug;
/* La zona de l'establiment del poble. */
const ZONA = 'Europe/Madrid';
const OPCIONS = Object.freeze({ establiment: ESTABLIMENT, zona: ZONA });
/* La cava amb el seu propi IVA (21 %): un producte de la carta pot portar ivaPercent (cataleg.js). */
const CAVA_21 = { ...P('cava'), ivaPercent: 21 };
let n = 0;
const nouId = (prefix) => { n += 1; return `${prefix}-${n}`; };

const obri = (ara, origen = { tipus: 'barra' }, tornId = 'torn-1') => creaComanda({ id: nouId('c'), tornId, origen, ara, per: 'Cambrer 1' });
const afig = (comanda, producte, ara, opcions = {}) => afegeixProducte(comanda, { producte, ivaPerDefecte: IVA, ...opcions }, { ara, idLinia: nouId('l') });
const paga = (comanda, metode, importCents, ara, extra = {}) => afegeixPagament(comanda, { metode, importCents, ...extra }, { id: nouId('p'), ara });

/* A · barra: olives (2,00 € al 10 %) i una copa de cava (3,00 € al 21 %) amb nota;
   pagament mixt: 2,00 € en efectiu (en lliura 5,00) i 3,00 € amb targeta. */
function tiquetA() {
  const ara = '2026-10-02T08:00:00.000Z';
  let c = afig(afig(obri(ara), P('olives'), ara), CAVA_21, ara, { nota: 'Ben freda' });
  c = paga(c, 'efectiu', 200, ara, { lliuratCents: 500 });
  c = paga(c, 'targeta', 300, ara);
  return tanca(c, { numero: 1, ara: '2026-10-02T08:15:00.000Z' });
}
/* B · la taula 5: dos cafés amb llet (3,00 € al 10 %), amb targeta. */
function tiquetB() {
  const ara = '2026-10-02T11:30:00.000Z';
  const c = afig(obri(ara, { tipus: 'taula', taulaId: 't5' }), P('cafe-llet'), ara, { quantitat: 2 });
  return tanca(paga(c, 'targeta', 300, ara), { numero: 2, ara: '2026-10-02T12:00:00.000Z' });
}
/* D · la devolució de la copa de cava d'A, en efectiu, amb motiu i qui la fa. */
const devolucioDe = (tiquet, linia, { numero = 3, ara = '2026-10-02T13:00:00.000Z' } = {}) => creaDevolucio(tiquet, [{ liniaId: linia.id, quantitat: 1 }], {
  motiu: 'Copa trencada', metode: 'efectiu', id: nouId('k'), ara, numero, tornId: 'torn-1', per: 'Encarregada'
});
/* C · per a emportar, un refresc (2,00 € al 10 %), tancat a les 22:30 UTC: a Europe/Madrid, les 00:30 del dia 3. */
function tiquetC() {
  const ara = '2026-10-02T22:25:00.000Z';
  const c = afig(obri(ara, { tipus: 'emportar' }), P('refresc-cola'), ara);
  return tanca(paga(c, 'efectiu', 200, ara), { numero: 4, ara: '2026-10-02T22:30:00.000Z' });
}
/* E · tres dies després, en un altre torn: una aigua (1,00 € al 10 %). */
function tiquetE() {
  const ara = '2026-10-05T09:00:00.000Z';
  const c = afig(obri(ara, { tipus: 'barra' }, 'torn-2'), P('aigua'), ara);
  return tanca(paga(c, 'efectiu', 100, ara), { numero: 1, ara });
}

const A = tiquetA();
const B = tiquetB();
const D = devolucioDe(A, A.linies[1]);
const C = tiquetC();
const E = tiquetE();
/* O · una comanda oberta: no és cap venda. */
const O = afig(obri('2026-10-02T09:00:00.000Z'), P('olives'), '2026-10-02T09:00:00.000Z');

const ids = (registre) => registre.vendes.map((v) => v.id);

describe('un tiquet real del Bar com a venda', () => {
  test('dos tipus d’IVA i pagament mixt: el total de cada tipus amb l’IVA inclòs, cap base ni quota (Principi 4)', () => {
    expect(A.totals.totalCents).toBe(500);
    expect(A.totals.perIva).toEqual([{ ivaPercent: 10, baseCents: 182, quotaCents: 18 }, { ivaPercent: 21, baseCents: 248, quotaCents: 52 }]);
    const registre = registreDeVendes([A], OPCIONS);
    expect(validaRegistreVendes(registre)).toEqual([]);
    expect(registre).toMatchObject({ esquema: ESQUEMA_VENDES, moneda: MONEDA_VENDES, titular: null, origen: { app: 'bar', establiment: 'el-meu-bar' } });
    expect(registre.vendes).toEqual([{
      id: A.id, numero: 1, tipus: 'venda', data: { a: 2026, m: 10, d: 2 }, hora: '10:15', canal: 'barra', totalCents: 500,
      perIva: [{ ivaPercent: 10, totalCents: 200 }, { ivaPercent: 21, totalCents: 300 }],
      pagaments: [{ metode: 'efectiu', importCents: 200 }, { metode: 'targeta', importCents: 300 }]
    }]);
    expect(JSON.stringify(registre)).not.toMatch(/baseCents|quotaCents/);
  });

  test('la devolució enllaçada ix en positiu, amb tipus devolucio i el tiquet d’origen', () => {
    expect(D.totals.totalCents).toBe(-300);
    expect(D.pagaments.map((p) => p.importCents)).toEqual([-300]);
    expect(vendaDeTiquet(D, ZONA)).toEqual({
      id: D.id, numero: 3, tipus: 'devolucio', data: { a: 2026, m: 10, d: 2 }, hora: '15:00', canal: 'barra', totalCents: 300,
      perIva: [{ ivaPercent: 21, totalCents: 300 }],
      pagaments: [{ metode: 'efectiu', importCents: 300 }],
      tiquetOrigenId: A.id
    });
    expect(validaRegistreVendes(registreDeVendes([A, D], OPCIONS))).toEqual([]);
  });

  test('una devolució d’una línia convidada torna zero, i el zero no porta signe', () => {
    const ara = '2026-10-02T16:00:00.000Z';
    const amb = afig(afig(obri(ara), P('olives'), ara), P('cava'), ara);
    const convidat = convida(amb, amb.linies[1].id, { motiu: 'Casa', ara });
    const tiquet = tanca(paga(convidat, 'targeta', totals(convidat).pendentCents, ara), { numero: 5, ara });
    const venda = vendaDeTiquet(devolucioDe(tiquet, tiquet.linies[1], { numero: 6, ara }), ZONA);
    expect(venda).toMatchObject({ totalCents: 0, perIva: [], pagaments: [{ metode: 'efectiu', importCents: 0 }] });
    expect(Object.is(venda.totalCents, -0)).toBe(false);
    expect(Object.is(venda.pagaments[0].importCents, -0)).toBe(false);
  });

  test('el canal és l’origen de la comanda, sense la taula', () => {
    expect([A, B, C].map((t) => vendaDeTiquet(t, ZONA).canal)).toEqual(['barra', 'taula', 'emportar']);
    expect(vendaDeTiquet(B, ZONA)).toMatchObject({ totalCents: 300, perIva: [{ ivaPercent: 10, totalCents: 300 }] });
  });

  test('no ix cap àlies de cambrer, cap nota, cap motiu, cap taula ni cap torn', () => {
    /* Les dades hi eren: el filtre no és buit. */
    expect(A.atesPer).toBe('Cambrer 1');
    expect(A.linies[1].nota).toBe('Ben freda');
    expect(D).toMatchObject({ atesPer: 'Encarregada', motiu: 'Copa trencada' });
    expect(B.origen.taulaId).toBe('t5');
    const text = JSON.stringify(registreDeVendes([A, B, C, D, E], OPCIONS));
    for (const vetat of ['Cambrer', 'Encarregada', 'Ben freda', 'Copa trencada', 't5', 'torn-1', 'torn-2', 'Olives', 'Cava',
      'atesPer', 'obertPer', 'nota', 'motiu', 'taulaId', 'lliurat', 'canvi', 'linies', 'historial', 'tancatA']) {
      expect(text, vetat).not.toContain(vetat);
    }
  });

  test('vendaDeTiquet: una comanda oberta no és cap venda', () => {
    expect(esTiquetDeVenda(O)).toBe(false);
    expect(esTiquetDeVenda(A)).toBe(true);
    expect(() => vendaDeTiquet(O, ZONA)).toThrow(expect.objectContaining({ codi: 'TIQUET' }));
    expect(() => vendaDeTiquet(null, ZONA)).toThrow(expect.objectContaining({ codi: 'TIQUET' }));
    expect(() => vendaDeTiquet({ ...A, tancatA: 'ahir' }, ZONA)).toThrow(expect.objectContaining({ codi: 'MOMENT' }));
    expect(() => vendaDeTiquet(A)).toThrow(expect.objectContaining({ codi: 'ZONA' }));
  });
});

describe('registreDeVendes', () => {
  test('les comandes obertes no hi entren, i l’ordre és el de tancatA', () => {
    const registre = registreDeVendes([E, O, C, D, B, A], OPCIONS);
    expect(ids(registre)).toEqual([A.id, B.id, D.id, C.id, E.id]);
    expect(validaRegistreVendes(registre)).toEqual([]);
  });

  test('al mateix moment, per número', () => {
    const ara = '2026-10-02T18:00:00.000Z';
    const tiquet = (numero) => tanca(paga(afig(obri(ara), P('olives'), ara), 'efectiu', 200, ara), { numero, ara });
    const sis = tiquet(6);
    const cinc = tiquet(5);
    expect(ids(registreDeVendes([sis, cinc], OPCIONS))).toEqual([cinc.id, sis.id]);
  });

  test('el filtre per dates, amb els dos extrems inclosos i null com a rang obert', () => {
    const tots = [A, B, C, D, E];
    const diaE = dataLocal(E.tancatA, ZONA);
    expect(ids(registreDeVendes(tots, { ...OPCIONS, des: diaE, fins: diaE }))).toEqual([E.id]);
    expect(ids(registreDeVendes(tots, { ...OPCIONS, des: diaE }))).toEqual([E.id]);
    const finsA = registreDeVendes(tots, { ...OPCIONS, fins: dataLocal(A.tancatA, ZONA) });
    expect(ids(finsA)).toContain(A.id);
    expect(ids(finsA)).not.toContain(E.id);
    expect(ids(registreDeVendes(tots, OPCIONS))).toHaveLength(5);
    expect(registreDeVendes(tots, { ...OPCIONS, des: { a: 2030, m: 1, d: 1 } }).vendes).toEqual([]);
  });

  test('el titular el posa qui crida: un de la Gestoria passa sencer i se’n queden tipus, id, àlies i àmbit', () => {
    const titular = {
      schema: 'sdp.gestoria.titular.v1', id: 'tit_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', tipus: 'persona', ambit: 'ACTIVITAT', alies: 'El meu bar',
      formaJuridica: null, persona: 'tit_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', representants: []
    };
    const registre = registreDeVendes([A], { ...OPCIONS, titular });
    expect(registre.titular).toEqual({ tipus: 'persona', id: 'tit_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', alies: 'El meu bar', ambit: 'ACTIVITAT' });
    expect(registreDeVendes([A], { ...OPCIONS, titular: null }).titular).toBeNull();
  });

  test('el titular de la llar no ven: la frontera LLAR/ACTIVITAT de la Gestoria es fa complir al contracte', () => {
    const llar = {
      schema: 'sdp.gestoria.titular.v1', id: 'tit_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', tipus: 'persona', ambit: 'LLAR', alies: 'La meua llar',
      formaJuridica: null, persona: null, representants: []
    };
    expect(() => registreDeVendes([A], { ...OPCIONS, titular: llar })).toThrow(expect.objectContaining({
      codi: 'REGISTRE_INVALID', detalls: [expect.objectContaining({ codi: 'AMBIT_INVALID', camp: 'registre.titular.ambit' })]
    }));
  });

  test('el registre és congelat en profunditat i sobrevivix a un JSON d’anada i tornada', () => {
    const registre = registreDeVendes([A, D], OPCIONS);
    for (const valor of [registre, registre.origen, registre.vendes, registre.vendes[0], registre.vendes[0].perIva[0], registre.vendes[1].pagaments[0]]) {
      expect(Object.isFrozen(valor)).toBe(true);
    }
    expect(validaRegistreVendes(JSON.parse(JSON.stringify(registre)))).toEqual([]);
  });

  test('arguments dolents: la llista, la zona, les dates, el rang i l’establiment', () => {
    expect(() => registreDeVendes(A, OPCIONS)).toThrow(expect.objectContaining({ codi: 'TIQUETS' }));
    expect(() => registreDeVendes([A], { establiment: ESTABLIMENT })).toThrow(expect.objectContaining({ codi: 'ZONA' }));
    expect(() => registreDeVendes([A], { ...OPCIONS, zona: 'Europa/Lloc-Inventat' })).toThrow(expect.objectContaining({ codi: 'ZONA' }));
    expect(() => registreDeVendes([A], { ...OPCIONS, des: { a: 2026, m: 2, d: 30 } })).toThrow(expect.objectContaining({ codi: 'DATA' }));
    expect(() => registreDeVendes([A], { ...OPCIONS, fins: '2026-10-02' })).toThrow(expect.objectContaining({ codi: 'DATA' }));
    expect(() => registreDeVendes([A], { ...OPCIONS, des: { a: 2026, m: 10, d: 3 }, fins: { a: 2026, m: 10, d: 2 } }))
      .toThrow(expect.objectContaining({ codi: 'RANG' }));
    expect(() => registreDeVendes([A], { zona: ZONA })).toThrow(expect.objectContaining({ codi: 'REGISTRE_INVALID' }));
  });

  test('un tiquet tancat mal format no es descarta d’amagat: el contracte el refusa amb els detalls', () => {
    const dolent = { ...A, totals: { ...A.totals, totalCents: -1 } };
    let error = null;
    try {
      registreDeVendes([B, dolent], { ...OPCIONS, titular: { tipus: 'persona', id: 'Tit', alies: 'El meu bar', ambit: 'ACTIVITAT' } });
    } catch (e) {
      error = e;
    }
    expect(error?.codi).toBe('REGISTRE_INVALID');
    expect(error.detalls.map((e) => e.camp)).toEqual(['registre.titular.id', 'registre.vendes[0].totalCents']);
  });

  test('un tiquet tancat sense tancatA, encara que siga d’un altre any: REGISTRE_INVALID amb la posició i l’id als detalls', () => {
    const senseMoment = { ...E, tancatA: null };
    let error = null;
    try {
      registreDeVendes([A, O, senseMoment], { ...OPCIONS, des: { a: 2026, m: 10, d: 2 }, fins: { a: 2026, m: 10, d: 2 } });
    } catch (e) {
      error = e;
    }
    expect(error?.codi).toBe('REGISTRE_INVALID');
    expect(error.detalls).toEqual([{ codi: 'MOMENT_INVALID', camp: 'tiquets[2].tancatA', missatge: `El tiquet ${E.id} no té el moment del tancament (tancatA).` }]);
    /* Un id que no és opac no ix al missatge. */
    try {
      registreDeVendes([{ ...senseMoment, id: 'Tiquet 7' }], OPCIONS);
    } catch (e) {
      error = e;
    }
    expect(error.detalls[0].missatge).toBe('Un tiquet sense id vàlid no té el moment del tancament (tancatA).');
  });
});

/* La zona de l'establiment, no la del dispositiu que exporta: el dia i l'hora
   locals, també quan el tancament passa la mitjanit. Valen en qualsevol TZ. */
describe('la data i l’hora, en la zona de l’establiment', () => {
  test('esZona: els noms IANA que el navegador coneix', () => {
    for (const zona of ['Europe/Madrid', 'Atlantic/Canary', 'UTC']) expect(esZona(zona), zona).toBe(true);
    for (const zona of ['', 'Europa/Lloc-Inventat', null, undefined, 42]) expect(esZona(zona), String(zona)).toBe(false);
  });

  test('a Europe/Madrid, les 22:30 UTC del dia 2 són les 00:30 del dia 3', () => {
    expect(vendaDeTiquet(A, ZONA)).toMatchObject({ data: { a: 2026, m: 10, d: 2 }, hora: '10:15' });
    expect(vendaDeTiquet(C, ZONA)).toMatchObject({ data: { a: 2026, m: 10, d: 3 }, hora: '00:30' });
  });

  test('el mateix tiquet tancat prop de mitjanit canvia de dia i de trimestre segons la zona de l’establiment', () => {
    const moment = '2026-03-31T22:30:00.000Z';
    expect([dataLocal(moment, 'Europe/Madrid'), horaEnZona(moment, 'Europe/Madrid')]).toEqual([{ a: 2026, m: 4, d: 1 }, '00:30']);
    expect([dataLocal(moment, 'Atlantic/Canary'), horaEnZona(moment, 'Atlantic/Canary')]).toEqual([{ a: 2026, m: 3, d: 31 }, '23:30']);
    expect([dataLocal(moment, 'UTC'), horaEnZona(moment, 'UTC')]).toEqual([{ a: 2026, m: 3, d: 31 }, '22:30']);
    /* La mitjanit és 00:00, mai 24:00. */
    expect(horaEnZona('2026-03-31T22:00:00.000Z', 'Europe/Madrid')).toBe('00:00');
    expect(() => dataLocal(moment)).toThrow(expect.objectContaining({ codi: 'ZONA' }));
  });

  test('el filtre per dates mira el dia de l’establiment', () => {
    const tots = [A, B, C, D, E];
    const dia = (d) => ({ a: 2026, m: 10, d });
    expect(ids(registreDeVendes(tots, { ...OPCIONS, des: dia(2), fins: dia(2) }))).toEqual([A.id, B.id, D.id]);
    expect(ids(registreDeVendes(tots, { ...OPCIONS, des: dia(3), fins: dia(3) }))).toEqual([C.id]);
    expect(ids(registreDeVendes(tots, { ...OPCIONS, des: dia(3), fins: dia(5) }))).toEqual([C.id, E.id]);
    /* A les Canàries (UTC+1), el refresc de les 22:30 UTC encara és del dia 2. */
    expect(ids(registreDeVendes(tots, { ...OPCIONS, zona: 'Atlantic/Canary', des: dia(2), fins: dia(2) }))).toEqual([A.id, B.id, D.id, C.id]);
  });
});
