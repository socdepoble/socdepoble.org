// @vitest-environment node
/* Gestoria · nucli · factures que falten (ordre del Mestre, 14-10-2026, prompt
   261014_2015, tasca T4; pla 261014_2030): el 3T de 2026 sintètic, amb
   proveïdors mensuals i bimestrals i extractes de la forma de comptesDe. El
   catàleg integrat es canvia per un de sintètic perquè cap prova depenga de
   les seues entrades. Empreses fictícies, CIF calculats ací i imports
   inventats: cap NIF, prefix de sèrie ni import del Mestre. */
import { describe, expect, test, vi } from 'vitest';
import { crearFactura } from './model.js';
import { ESTATS_MES, facturesQueFalten } from './facturesQueFalten.js';

const { cifB, TELEFONIA } = vi.hoisted(() => {
  /* Un CIF de lletra B calculat ací (control amb xifra), com a auditoria.test.js. */
  const calculaCif = (xifres) => {
    const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
    const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
    return `B${xifres}${(10 - ((parells + senars) % 10)) % 10}`;
  };
  const entrada = Object.freeze({
    clau: 'exemple-telefonia',
    nom: 'Exemple Telefonia SL',
    nif: calculaCif('7300002'),
    nifsAlternatius: Object.freeze([]),
    pais: 'ES',
    dominis: Object.freeze(['exemple-telefonia.example']),
    patronsFitxer: Object.freeze([]),
    patronsNum: Object.freeze([]),
    paraulesText: Object.freeze(['Exemple Telefonia']),
    cadencia: 'mensual',
    ivaHabitual: 21
  });
  return { cifB: calculaCif, TELEFONIA: entrada };
});

vi.mock('./cataleg.js', async (importOriginal) => ({ ...(await importOriginal()), CATALEG_PROVEIDORS: Object.freeze([TELEFONIA]) }));

const CIF = { energia: cifB('7300001'), telefonia: TELEFONIA.nif, aigua: cifB('7300003'), anonim: cifB('7300004') };
const NOM = { energia: 'Exemple Energia SCCL', telefonia: 'Exemple Telefonia SL', aigua: 'Exemple Aigües SL', anonim: '' };
const MARQUES_PRIVADES = ['CONCEPTEPRIVAT', 'CREDITORPRIVAT', 'COMERCPRIVAT', 'REFPRIVADA'];

let comptador = 0;
function despesa(qui, a, m, d = 5, canvis = {}) {
  comptador += 1;
  return crearFactura({
    tipus: 'despesa',
    data: { a, m, d },
    num: `${qui.slice(0, 3).toUpperCase()}-${a}${String(m).padStart(2, '0')}-${comptador}`,
    contrapart: NOM[qui],
    nif: CIF[qui],
    descripcio: 'Servei',
    subtotal: 10000,
    iva: 2100,
    total: 12100,
    origen: { fitxer: `${a}_${Math.ceil(m / 3)}T/${qui}-${m}-${comptador}.pdf`, metode: 'pdf' },
    ...canvis
  });
}

let linia = 0;
function moviment(a, m, d, centims, canvis = {}) {
  linia += 1;
  return {
    linia,
    dataOperacio: { a, m, d },
    dataValor: { a, m, d },
    centims,
    conceptComu: '03',
    conceptes: [{ camps: ['RECIBO CONCEPTEPRIVAT'] }],
    ref1: `REFPRIVADA${linia}`,
    ...canvis
  };
}
/* Un rebut SEPA del proveïdor: concilia l'aparella pel NIF del creditor (R2). */
const rebut = (a, m, d, centims, qui = 'energia') => moviment(a, m, d, centims, { sepa: { cif: CIF[qui], creditor: 'CREDITORPRIVAT' } });
const DES_D_ABRIL = { a: 2026, m: 4, d: 1 };
/* Un compte de la forma de comptesDe, en euros. */
const compte = (moviments, fins = { a: 2026, m: 9, d: 30 }) => ({
  id: 'c43-0000-0001',
  entitat: '0000',
  compte4: '0001',
  divisa: 'EUR',
  desde: DES_D_ABRIL,
  fins,
  cobert: [{ desde: DES_D_ABRIL, fins }],
  saldo: 500000,
  saldoDe: 'peu',
  moviments,
  avisos: 0
});

/* Tres mesos d'historial (2T) d'un proveïdor mensual, i els seus rebuts al banc. */
const historialEnergia = () => [despesa('energia', 2026, 4), despesa('energia', 2026, 5), despesa('energia', 2026, 6)];
const rebutsHistorial = () => [rebut(2026, 4, 10, -12100), rebut(2026, 5, 10, -12100), rebut(2026, 6, 10, -12100)];

const delProveidor = (r, nom) => r.linies.find((l) => l.nom === nom);
const resumDe = (l) => l.mesos.map((m) => [m.mes, m.estat, m.esperades, m.trobades.length, m.banc]);
const dels = (r, codi) => r.incidencies.filter((i) => i.codi === codi);

function congelaTot(valor) {
  if (!valor || typeof valor !== 'object') return valor;
  for (const fill of Object.values(valor)) congelaTot(fill);
  return Object.freeze(valor);
}
function noCongelats(valor, ruta = 'eixida') {
  if (!valor || typeof valor !== 'object') return [];
  const propis = Object.isFrozen(valor) ? [] : [ruta];
  return [...propis, ...Object.entries(valor).flatMap(([clau, fill]) => noCongelats(fill, `${ruta}.${clau}`))];
}

describe('facturesQueFalten: un proveïdor mensual al 3T sense la de juliol', () => {
  test('sense banc: juliol «falta», i el pagament no se sap', () => {
    const r = facturesQueFalten({
      any: 2026, t: 3, factures: [despesa('energia', 2026, 8), despesa('energia', 2026, 9)], historial: historialEnergia()
    });
    expect(r.rang).toEqual({ inici: { a: 2026, m: 7, d: 1 }, fi: { a: 2026, m: 9, d: 30 } });
    expect(r.linies).toHaveLength(1);
    const l = delProveidor(r, NOM.energia);
    expect(l).toMatchObject({ clau: 'exemple-energia', cadencia: 'mensual', domini: null });
    expect(resumDe(l)).toEqual([
      ['2026-07', 'falta', 1, 0, 'sense-extracte'],
      ['2026-08', 'completa', 1, 1, 'sense-extracte'],
      ['2026-09', 'completa', 1, 1, 'sense-extracte']
    ]);
    expect(l.mesos.map((m) => m.pagament)).toEqual([null, null, null]);
    expect(r.resum).toEqual({ falten: 1, potserFalten: 0, ambPagament: 0 });
    // La incidència és la d'auditaTrimestre, una sola vegada.
    expect(dels(r, 'FALTA_MENSUAL').map((i) => [i.mes, i.proveidor])).toEqual([['2026-07', 'exemple-energia']]);
  });

  test('amb un únic rebut dins de la banda: «falta-amb-pagament», amb la data i els cèntims marcats privats', () => {
    const comptes = [compte([
      ...rebutsHistorial(), rebut(2026, 7, 10, -12500), rebut(2026, 8, 10, -12100), rebut(2026, 9, 10, -12100),
      // Una compra amb targeta (concepte 12) dins de la banda: les parelles de l'historial diuen 03, i no hi entra.
      moviment(2026, 7, 15, -12000, { conceptComu: '12', comerc: 'COMERCPRIVAT', conceptes: [{ camps: ['COMPRA CONCEPTEPRIVAT'] }] }),
      // Un ingrés dins de la banda: no és una eixida.
      moviment(2026, 7, 12, 12500)
    ])];
    const r = facturesQueFalten({
      any: 2026, t: 3, factures: [despesa('energia', 2026, 8), despesa('energia', 2026, 9)], historial: historialEnergia(), comptes
    });
    const l = delProveidor(r, NOM.energia);
    expect(resumDe(l)).toEqual([
      ['2026-07', 'falta-amb-pagament', 1, 0, 'cobert'],
      ['2026-08', 'completa', 1, 1, 'cobert'],
      ['2026-09', 'completa', 1, 1, 'cobert']
    ]);
    expect(l.mesos[0].pagament).toEqual({ data: { a: 2026, m: 7, d: 10 }, centims: 12500, privat: true });
    expect(l.mesos.slice(1).map((m) => m.pagament)).toEqual([null, null]);
    expect(r.resum).toEqual({ falten: 1, potserFalten: 0, ambPagament: 1 });
  });

  test('dos candidats: «falta» sense pagament', () => {
    const comptes = [compte([
      ...rebutsHistorial(), rebut(2026, 7, 10, -12500), moviment(2026, 7, 20, -11800), rebut(2026, 8, 10, -12100), rebut(2026, 9, 10, -12100)
    ])];
    const r = facturesQueFalten({
      any: 2026, t: 3, factures: [despesa('energia', 2026, 8), despesa('energia', 2026, 9)], historial: historialEnergia(), comptes
    });
    const [juliol] = delProveidor(r, NOM.energia).mesos;
    /* Revisió adversarial 14-10-2026: el mes diu per què no porta pagament (la vista no pot dir «cap càrrec»). */
    expect(juliol).toMatchObject({ estat: 'falta', pagament: null, banc: 'cobert', sensePagament: 'diversos' });
    expect(r.resum).toEqual({ falten: 1, potserFalten: 0, ambPagament: 0 });
  });

  /* Revisió adversarial 14-10-2026: el cas que motiva l'ordre (Lowi, cobrat el 14-07, el 12-08 i el 14-09, sense cap
     factura al 3T). Amb la finestra de 45 dies, juliol i agost hi veien també el càrrec del mes següent i quedaven sense
     pagament; ara la finestra acaba 10 dies després de l'últim del mes, i cada mes té el seu. */
  test('un mensual sense cap factura del trimestre i cobrat cada mes: cada mes, el seu càrrec', () => {
    const comptes = [compte([...rebutsHistorial(), rebut(2026, 7, 14, -12100), rebut(2026, 8, 12, -12100), rebut(2026, 9, 14, -12100)])];
    const r = facturesQueFalten({ any: 2026, t: 3, factures: [], historial: historialEnergia(), comptes });
    expect(delProveidor(r, NOM.energia).mesos.map((m) => [m.estat, m.pagament?.data ?? null, m.sensePagament])).toEqual([
      ['falta-amb-pagament', { a: 2026, m: 7, d: 14 }, null],
      ['falta-amb-pagament', { a: 2026, m: 8, d: 12 }, null],
      ['falta-amb-pagament', { a: 2026, m: 9, d: 14 }, null]
    ]);
    expect(r.resum).toEqual({ falten: 3, potserFalten: 0, ambPagament: 3 });
  });

  test('per què no hi ha pagament: «cap» sense cap càrrec, «sense-historial» sense cap total en euros a l’historial', () => {
    const cap = facturesQueFalten({
      any: 2026, t: 3, factures: [despesa('energia', 2026, 8), despesa('energia', 2026, 9)], historial: historialEnergia(),
      comptes: [compte([...rebutsHistorial(), rebut(2026, 8, 10, -12100), rebut(2026, 9, 10, -12100)])]
    });
    expect(delProveidor(cap, NOM.energia).mesos[0]).toMatchObject({ estat: 'falta', pagament: null, sensePagament: 'cap' });
    const enDolars = historialEnergia().map((f) => ({ ...f, moneda: 'USD' }));
    const senseHistorial = facturesQueFalten({
      any: 2026, t: 3, factures: [despesa('energia', 2026, 8), despesa('energia', 2026, 9)], historial: enDolars,
      comptes: [compte([rebut(2026, 7, 10, -12100)])]
    });
    expect(delProveidor(senseHistorial, NOM.energia).mesos[0]).toMatchObject({ estat: 'falta', pagament: null, sensePagament: 'sense-historial' });
  });

  test('un càrrec que és l’únic candidat de dos mesos que falten no és el pagament de cap', () => {
    const base = [...rebutsHistorial(), moviment(2026, 8, 5, -12000), rebut(2026, 9, 10, -12100)];
    const sols = facturesQueFalten({
      any: 2026, t: 3, factures: [despesa('energia', 2026, 9)], historial: historialEnergia(), comptes: [compte(base)]
    });
    expect(delProveidor(sols, NOM.energia).mesos.map((m) => [m.estat, m.pagament, m.sensePagament])).toEqual([
      ['falta', null, 'compartit'], ['falta', null, 'compartit'], ['completa', null, null]
    ]);
    expect(sols.resum).toEqual({ falten: 2, potserFalten: 0, ambPagament: 0 });
    // Amb el rebut de juliol, juliol té dos candidats (cap) i agost un de sol, que ja no és de ningú més.
    const amb = facturesQueFalten({
      any: 2026, t: 3, factures: [despesa('energia', 2026, 9)], historial: historialEnergia(),
      comptes: [compte([...base, rebut(2026, 7, 10, -12500)])]
    });
    const [juliol, agost] = delProveidor(amb, NOM.energia).mesos;
    expect(juliol).toMatchObject({ estat: 'falta', pagament: null, sensePagament: 'diversos' });
    expect(agost).toMatchObject({
      estat: 'falta-amb-pagament', pagament: { data: { a: 2026, m: 8, d: 5 }, centims: 12000, privat: true }, sensePagament: null
    });
  });

  test('un mes sense extracte en euros: «sense-extracte» i cap pagament, encara que hi haja un moviment que hi cabria', () => {
    const moviments = () => [
      ...rebutsHistorial(), rebut(2026, 7, 10, -12100), rebut(2026, 8, 10, -12100), rebut(2026, 9, 10, -12100)
    ];
    const factures = () => [despesa('energia', 2026, 7), despesa('energia', 2026, 8)];
    const curt = facturesQueFalten({
      any: 2026, t: 3, factures: factures(), historial: historialEnergia(), comptes: [compte(moviments(), { a: 2026, m: 8, d: 31 })]
    });
    expect(delProveidor(curt, NOM.energia).mesos[2]).toEqual({
      mes: '2026-09', estat: 'falta', esperades: 1, trobades: [], pagament: null, banc: 'sense-extracte', sensePagament: 'sense-extracte'
    });
    // La prova de control: amb setembre cobert, el mateix moviment sí que és el pagament.
    const sencer = facturesQueFalten({ any: 2026, t: 3, factures: factures(), historial: historialEnergia(), comptes: [compte(moviments())] });
    expect(delProveidor(sencer, NOM.energia).mesos[2]).toMatchObject({
      estat: 'falta-amb-pagament', pagament: { data: { a: 2026, m: 9, d: 10 }, centims: 12100, privat: true }, banc: 'cobert'
    });
    // Un compte en una altra moneda no cobrix res ni hi busca pagaments.
    const altra = facturesQueFalten({
      any: 2026, t: 3, factures: factures(), historial: historialEnergia(), comptes: [{ ...compte(moviments()), divisa: 'USD' }]
    });
    expect(delProveidor(altra, NOM.energia).mesos.map((m) => m.banc)).toEqual(['sense-extracte', 'sense-extracte', 'sense-extracte']);
  });

  test('avui 14-08: setembre és «futura», no falta', () => {
    const r = facturesQueFalten({
      any: 2026, t: 3, factures: [despesa('energia', 2026, 7)], historial: historialEnergia(), avui: { a: 2026, m: 8, d: 14 }
    });
    expect(delProveidor(r, NOM.energia).mesos.map((m) => m.estat)).toEqual(['completa', 'falta', 'futura']);
    expect(r.resum).toEqual({ falten: 1, potserFalten: 0, ambPagament: 0 });
    expect(dels(r, 'FALTA_MENSUAL').map((i) => i.mes)).toEqual(['2026-08']);
    // Sense avui, cap mes és futur.
    const sense = facturesQueFalten({ any: 2026, t: 3, factures: [despesa('energia', 2026, 7)], historial: historialEnergia() });
    expect(delProveidor(sense, NOM.energia).mesos.map((m) => m.estat)).toEqual(['completa', 'falta', 'falta']);
  });
});

describe('facturesQueFalten: el recompte i les altres cadències', () => {
  const telefonia = (...perMes) => perMes.flatMap(([m, n]) => Array.from({ length: n }, () => despesa('telefonia', 2026, m)));

  test('dues factures cada mes: 2, 2, 1 és «potser-falta» i 2, 2, 2 és «completa»; el domini, el del catàleg', () => {
    const historial = telefonia([4, 2], [5, 2], [6, 2]);
    const caigut = facturesQueFalten({ any: 2026, t: 3, factures: telefonia([7, 2], [8, 2], [9, 1]), historial });
    const l = delProveidor(caigut, NOM.telefonia);
    expect(l).toMatchObject({ clau: 'exemple-telefonia', domini: 'exemple-telefonia.example', cadencia: 'mensual' });
    expect(resumDe(l)).toEqual([
      ['2026-07', 'completa', 2, 2, 'sense-extracte'],
      ['2026-08', 'completa', 2, 2, 'sense-extracte'],
      ['2026-09', 'potser-falta', 2, 1, 'sense-extracte']
    ]);
    expect(caigut.resum).toEqual({ falten: 0, potserFalten: 1, ambPagament: 0 });
    /* Un «potser-falta» ja en té alguna: no es busca el càrrec, i ho diu. */
    expect(l.mesos.map((m) => m.sensePagament)).toEqual([null, null, 'no-cercat']);
    const sencer = facturesQueFalten({ any: 2026, t: 3, factures: telefonia([7, 2], [8, 2], [9, 2]), historial });
    expect(delProveidor(sencer, NOM.telefonia).mesos.map((m) => m.estat)).toEqual(['completa', 'completa', 'completa']);
    expect(sencer.resum).toEqual({ falten: 0, potserFalten: 0, ambPagament: 0 });
  });

  test('un bimestral: juliol falta (FALTA_HABITUAL, una vegada), agost no s’esperava', () => {
    const historial = [despesa('aigua', 2026, 1), despesa('aigua', 2026, 3), despesa('aigua', 2026, 5)];
    const r = facturesQueFalten({ any: 2026, t: 3, factures: [despesa('aigua', 2026, 9)], historial });
    const l = delProveidor(r, NOM.aigua);
    expect(l.cadencia).toBe('bimestral');
    expect(resumDe(l)).toEqual([
      ['2026-07', 'falta', 1, 0, 'sense-extracte'],
      ['2026-08', 'completa', 0, 0, 'sense-extracte'],
      ['2026-09', 'completa', 1, 1, 'sense-extracte']
    ]);
    expect(dels(r, 'FALTA_HABITUAL').map((i) => [i.mes, i.proveidor])).toEqual([['2026-07', l.clau]]);
  });

  test('un proveïdor que el registre només coneix pel NIF ix amb una clau opaca, sense el NIF', () => {
    const historial = [despesa('anonim', 2026, 4), despesa('anonim', 2026, 5), despesa('anonim', 2026, 6)];
    const r = facturesQueFalten({ any: 2026, t: 3, historial });
    expect(r.linies).toHaveLength(1);
    const [l] = r.linies;
    expect(l.clau).toMatch(/^proveidor-[0-9a-f]{12}$/);
    expect(l.nom).toBe('Proveïdor sense nom');
    expect(l.mesos.map((m) => m.estat)).toEqual(['falta', 'falta', 'falta']);
    expect(dels(r, 'FALTA_MENSUAL').map((i) => i.proveidor)).toEqual([l.clau, l.clau, l.clau]);
    const text = JSON.stringify(r);
    expect(text).not.toContain(CIF.anonim);
    expect(text).not.toContain(CIF.anonim.toLowerCase());
  });
});

describe('facturesQueFalten: les incidències reutilitzades', () => {
  test('una factura del 4T a la llista: FORA_TRIMESTRE, i no compta en cap mes', () => {
    const octubre = despesa('energia', 2026, 10);
    const r = facturesQueFalten({
      any: 2026, t: 3, factures: [despesa('energia', 2026, 8), despesa('energia', 2026, 9), octubre], historial: historialEnergia()
    });
    expect(dels(r, 'FORA_TRIMESTRE')).toHaveLength(1);
    const l = delProveidor(r, NOM.energia);
    expect(l.mesos.map((m) => m.mes)).toEqual(['2026-07', '2026-08', '2026-09']);
    expect(l.mesos[0]).toMatchObject({ estat: 'falta', trobades: [] });
    expect(l.mesos.flatMap((m) => m.trobades)).not.toContain(octubre.num);
  });

  test('un forat a la numeració del proveïdor: FORAT_NUMERACIO d’auditaTrimestre una sola vegada, i els mesos complets', () => {
    const factures = [
      despesa('energia', 2026, 7, 5, { num: 'ENE-0101' }), despesa('energia', 2026, 8, 5, { num: 'ENE-0102' }),
      despesa('energia', 2026, 9, 5, { num: 'ENE-0104' })
    ];
    const r = facturesQueFalten({ any: 2026, t: 3, factures, historial: historialEnergia() });
    expect(dels(r, 'FORAT_NUMERACIO')).toEqual([
      { codi: 'FORAT_NUMERACIO', missatge: expect.stringContaining('«ENE-0103»'), proveidor: 'exemple-energia', numeros: ['ENE-0103'] }
    ]);
    const l = delProveidor(r, NOM.energia);
    expect(l.mesos.map((m) => [m.estat, m.trobades])).toEqual([
      ['completa', ['ENE-0101']], ['completa', ['ENE-0102']], ['completa', ['ENE-0104']]
    ]);
    expect(r.resum).toEqual({ falten: 0, potserFalten: 0, ambPagament: 0 });
  });

  test('només els quatre codis, reduïts a codi, missatge, proveidor, mes i numeros', () => {
    const r = facturesQueFalten({
      any: 2026, t: 3, factures: [despesa('energia', 2026, 8), despesa('energia', 2026, 10)], historial: historialEnergia()
    });
    expect(r.incidencies.length).toBeGreaterThan(0);
    for (const i of r.incidencies) {
      expect(['FALTA_MENSUAL', 'FALTA_HABITUAL', 'FORAT_NUMERACIO', 'FORA_TRIMESTRE']).toContain(i.codi);
      expect(Object.keys(i).every((clau) => ['codi', 'missatge', 'proveidor', 'mes', 'numeros'].includes(clau)), Object.keys(i).join()).toBe(true);
    }
    // El correu no revisat i les incidències de cada factura no hi entren.
    expect(r.incidencies.map((i) => i.codi)).not.toContain('CORREU_NO_REVISAT');
  });
});

describe('facturesQueFalten: privacitat, immutabilitat i límits', () => {
  const escenari = () => ({
    any: 2026,
    t: 3,
    factures: [despesa('energia', 2026, 8), despesa('energia', 2026, 9)],
    historial: historialEnergia(),
    comptes: [compte([
      ...rebutsHistorial(), rebut(2026, 7, 10, -12500), rebut(2026, 8, 10, -12100), rebut(2026, 9, 10, -12100),
      moviment(2026, 7, 15, -12000, { conceptComu: '12', comerc: 'COMERCPRIVAT' })
    ])],
    avui: { a: 2026, m: 10, d: 14 }
  });

  test('no modifica res del que rep (tot congelat a l’entrada) i l’eixida és congelada en profunditat', () => {
    const entrada = escenari();
    const abans = JSON.stringify(entrada);
    congelaTot(entrada);
    const r = facturesQueFalten(entrada);
    expect(JSON.stringify(entrada)).toBe(abans);
    expect(noCongelats(r)).toEqual([]);
    expect(delProveidor(r, NOM.energia).mesos[0].estat).toBe('falta-amb-pagament');
    // Una entrada sense congelar tampoc es toca, ni es congela.
    const lliure = escenari();
    const text = JSON.stringify(lliure);
    facturesQueFalten(lliure);
    expect(JSON.stringify(lliure)).toBe(text);
    expect(Object.isFrozen(lliure.comptes[0].moviments[0])).toBe(false);
    expect(Object.isFrozen(lliure.factures[0])).toBe(false);
  });

  test('cap text de concepte, comerç, creditor ni referència; cap NIF; del moviment, només data i cèntims privats', () => {
    const r = facturesQueFalten(escenari());
    const text = JSON.stringify(r);
    for (const marca of MARQUES_PRIVADES) expect(text, marca).not.toContain(marca);
    for (const nif of Object.values(CIF)) expect(text, nif).not.toContain(nif);
    expect(text).not.toContain('c43-0000-0001');
    const pagaments = r.linies.flatMap((l) => l.mesos.map((m) => m.pagament)).filter(Boolean);
    expect(pagaments).toHaveLength(1);
    for (const p of pagaments) {
      expect(Object.keys(p).sort()).toEqual(['centims', 'data', 'privat']);
      expect(Object.keys(p.data).sort()).toEqual(['a', 'd', 'm']);
      expect(p.privat).toBe(true);
    }
    for (const l of r.linies) {
      expect(Object.keys(l).sort()).toEqual(['cadencia', 'clau', 'domini', 'mesos', 'nom']);
      expect(String(l.domini)).not.toMatch(/https?:/);
      for (const m of l.mesos) expect(ESTATS_MES).toContain(m.estat);
    }
  });

  test('sense historial ni factures: cap línia, cap incidència i el resum a zero', () => {
    const r = facturesQueFalten({ any: 2026, t: 3 });
    expect(r.linies).toEqual([]);
    expect(r.incidencies).toEqual([]);
    expect(r.resum).toEqual({ falten: 0, potserFalten: 0, ambPagament: 0 });
    expect(Object.isFrozen(r.linies)).toBe(true);
  });

  test('un trimestre que no existix és un RangeError, com a auditaTrimestre', () => {
    expect(() => facturesQueFalten({ any: 2026, t: 5 })).toThrow(RangeError);
    expect(() => facturesQueFalten({ any: 2026, t: 0 })).toThrow(RangeError);
    expect(() => facturesQueFalten({ any: '2026', t: 3 })).toThrow(RangeError);
    expect(() => facturesQueFalten()).toThrow(RangeError);
  });

  test('els estats dels mesos són cinc i la llista és congelada', () => {
    expect(ESTATS_MES).toEqual(['completa', 'falta', 'potser-falta', 'falta-amb-pagament', 'futura']);
    expect(Object.isFrozen(ESTATS_MES)).toBe(true);
  });
});
