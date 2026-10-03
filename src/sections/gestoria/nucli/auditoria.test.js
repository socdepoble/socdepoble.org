// @vitest-environment node
/* Gestoria · nucli · auditoria: trimestres sintètics (2T de 2026) amb
   proveïdors mensuals, trimestrals, anuals i puntuals, rebuts, duplicats,
   NIF propi i creuament amb el correu. Empreses fictícies i CIF calculats. */
import { describe, expect, test } from 'vitest';
import { auditaTrimestre, SEVERITATS } from './auditoria.js';
import { aprenProveidors } from './proveidors.js';
import { crearFactura } from './model.js';

/* Un CIF de lletra B calculat ací (control amb xifra). */
function cifB(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  return `B${xifres}${(10 - ((parells + senars) % 10)) % 10}`;
}
const CIF = {
  energia: cifB('7100001'),
  assessoria: cifB('7100002'),
  dominis: cifB('7100003'),
  ferreteria: cifB('7100004'),
  antic: cifB('7100005'),
  impremta: cifB('7100006'),
  fusteria: cifB('7100007'),
  client: cifB('7100008'),
  propi: cifB('7100009')
};
const NOMS = {
  energia: 'Exemple Energia SCCL',
  assessoria: 'Exemple Assessoria SL',
  dominis: 'Exemple Dominis SL',
  ferreteria: 'Exemple Ferreteria SL',
  antic: 'Exemple Antic SL',
  impremta: 'Exemple Impremta SL',
  fusteria: 'Exemple Fusteria SL',
  client: 'Exemple Client SL'
};

let comptador = 0;
const despesa = (qui, a, m, d = 10, canvis = {}) => {
  comptador += 1;
  return crearFactura({
    tipus: 'despesa',
    data: { a, m, d },
    num: `${qui.slice(0, 3).toUpperCase()}-${a}-${m}-${comptador}`,
    contrapart: NOMS[qui],
    nif: CIF[qui],
    descripcio: 'Servei',
    subtotal: 10000,
    iva: 2100,
    total: 12100,
    origen: { fitxer: `${a}_${Math.ceil(m / 3)}T/${qui}-${m}-${comptador}.pdf`, metode: 'pdf' },
    ...canvis
  });
};

const HISTORIAL = [
  despesa('energia', 2026, 1), despesa('energia', 2026, 2), despesa('energia', 2026, 3),
  despesa('assessoria', 2025, 11), despesa('assessoria', 2026, 2),
  despesa('dominis', 2024, 5), despesa('dominis', 2025, 5),
  despesa('ferreteria', 2026, 3),
  despesa('antic', 2025, 1), despesa('antic', 2025, 2), despesa('antic', 2025, 3),
  despesa('impremta', 2025, 8), despesa('impremta', 2026, 2),
  despesa('fusteria', 2026, 3)
];
const REGISTRE = aprenProveidors(HISTORIAL);

const ingres = crearFactura({
  tipus: 'ingres', data: { a: 2026, m: 4, d: 15 }, num: 'F26 0001', contrapart: NOMS.client, nif: CIF.client,
  descripcio: 'Taller', subtotal: 50000, iva: 10500, total: 60500, origen: { fitxer: '2026_2T/F26 0001.pdf', metode: 'pdf' }
});

const audita = (parametres = {}) => auditaTrimestre({ any: 2026, t: 2, factures: [], documents: [], proveidors: REGISTRE, ...parametres });
const dels = (r, codi) => r.incidencies.filter((i) => i.codi === codi);
const codis = (r) => r.incidencies.map((i) => i.codi);

describe('auditaTrimestre: el trimestre sencer', () => {
  const factures = [
    despesa('energia', 2026, 4), despesa('energia', 2026, 6),
    despesa('ferreteria', 2026, 5),
    ingres
  ];
  const r = audita({ factures });

  test('falta la factura mensual de maig, i només eixa', () => {
    expect(dels(r, 'FALTA_MENSUAL')).toEqual([{
      codi: 'FALTA_MENSUAL',
      severitat: 'alta',
      missatge: "Falta la factura de maig de 2026 d'Exemple Energia SCCL, que factura cada mes.",
      proveidor: 'exemple-energia',
      mes: '2026-05'
    }]);
  });

  test('indicis dels habituals: trimestral, anual i el puntual repetit; no el puntual d\'una vegada', () => {
    const habituals = dels(r, 'FALTA_HABITUAL');
    expect(habituals.map((i) => i.proveidor).sort()).toEqual(['exemple-assessoria', 'exemple-dominis', 'exemple-impremta']);
    for (const i of habituals) {
      expect(i.severitat).toBe('mitjana');
      expect(i.missatge).toMatch(/^Indici: /);
      expect(i.missatge).toMatch(/Pot ser normal/);
    }
    expect(habituals.find((i) => i.proveidor === 'exemple-assessoria').missatge).toMatch(/trimestre anterior/);
    expect(habituals.find((i) => i.proveidor === 'exemple-dominis').missatge).toMatch(/l'any passat/);
  });

  test('un proveïdor mensual que fa temps que no factura no avisa', () => {
    expect(r.incidencies.some((i) => i.proveidor === 'exemple-antic')).toBe(false);
  });

  test('cap entrada del catàleg sense historial avisa', () => {
    expect(r.incidencies.filter((i) => i.proveidor).every((i) => i.proveidor.startsWith('exemple-'))).toBe(true);
  });

  test('sense correu: cobertura «no-revisat» i l\'avís informatiu', () => {
    expect(r.cobertura).toEqual({ carpeta: 'revisada', correu: 'no-revisat', correusRevisats: 0, periodeCorreu: null });
    expect(dels(r, 'CORREU_NO_REVISAT')).toEqual([{
      codi: 'CORREU_NO_REVISAT',
      severitat: 'info',
      missatge: "Correu no revisat: la detecció de factures absents es basa només en la carpeta i l'historial."
    }]);
  });

  test('resum i ordre per severitat', () => {
    expect(r.resum).toEqual({ factures: 4, completes: 4, pendents: 0, ingressos: 1, despeses: 3 });
    const pesos = r.incidencies.map((i) => SEVERITATS.indexOf(i.severitat));
    expect(pesos).toEqual([...pesos].sort((x, y) => x - y));
    expect(pesos.every((p) => p >= 0)).toBe(true);
  });

  test('mai no declara el trimestre complet', () => {
    for (const i of r.incidencies) expect(i.missatge).not.toMatch(/\bcomplet\b/i);
    expect(JSON.stringify(r.cobertura)).not.toMatch(/complet/);
  });
});

describe('auditaTrimestre: FALTA_MENSUAL', () => {
  test('amb avui, els mesos que encara no han arribat no avisen', () => {
    const factures = [despesa('energia', 2026, 4)];
    const maig = audita({ factures, avui: { a: 2026, m: 5, d: 15 } });
    expect(dels(maig, 'FALTA_MENSUAL').map((i) => i.mes)).toEqual(['2026-05']);
    const abril = audita({ factures, avui: { a: 2026, m: 4, d: 20 } });
    expect(dels(abril, 'FALTA_MENSUAL')).toEqual([]);
    const despres = audita({ factures, avui: { a: 2026, m: 7, d: 2 } });
    expect(dels(despres, 'FALTA_MENSUAL').map((i) => i.mes)).toEqual(['2026-05', '2026-06']);
  });

  test('sense cap factura del trimestre avisa dels tres mesos, amb «d\'» davant de vocal', () => {
    const r = audita();
    expect(dels(r, 'FALTA_MENSUAL').map((i) => i.mes)).toEqual(['2026-04', '2026-05', '2026-06']);
    expect(dels(r, 'FALTA_MENSUAL')[0].missatge).toBe("Falta la factura d'abril de 2026 d'Exemple Energia SCCL, que factura cada mes.");
  });

  test('no avisa dels mesos anteriors al primer vist', () => {
    /* format-fiscal-03: dos mesos ja no fan «mensual»; en calen tres seguits. */
    const registre = aprenProveidors([despesa('fusteria', 2026, 5), despesa('fusteria', 2026, 6), despesa('fusteria', 2026, 7)], { cataleg: [] });
    const r = audita({ proveidors: registre, factures: [despesa('fusteria', 2026, 6)] });
    expect(dels(r, 'FALTA_MENSUAL').map((i) => i.mes)).toEqual(['2026-05']);
  });

  test('alta només si ha facturat els tres mesos d’algun trimestre anterior; si no, mitjana', () => {
    expect(dels(audita(), 'FALTA_MENSUAL').map((i) => i.severitat)).toEqual(['alta', 'alta', 'alta']);
    /* Febrer, març i abril: mensual, però cap trimestre sencer. */
    const registre = aprenProveidors([despesa('fusteria', 2026, 2), despesa('fusteria', 2026, 3), despesa('fusteria', 2026, 4)], { cataleg: [] });
    const r = auditaTrimestre({ any: 2026, t: 3, factures: [], proveidors: registre, avui: { a: 2026, m: 10, d: 2 } });
    expect(dels(r, 'FALTA_MENSUAL').map((i) => [i.mes, i.severitat])).toEqual([
      ['2026-07', 'mitjana'], ['2026-08', 'mitjana'], ['2026-09', 'mitjana']
    ]);
  });

  test('dues compres en mesos diferents d’un trimestre no fan cap proveïdor mensual', () => {
    const amazon = (m, d) => crearFactura({ tipus: 'despesa', data: { a: 2026, m, d }, num: `A${m}`, contrapart: 'Amazon', total: '10,00' });
    const r = auditaTrimestre({ any: 2026, t: 2, factures: [], proveidors: aprenProveidors([amazon(1, 10), amazon(3, 20)]), avui: { a: 2026, m: 7, d: 2 } });
    expect(dels(r, 'FALTA_MENSUAL')).toEqual([]);
    expect(r.incidencies.filter((i) => i.proveidor === 'amazon')).toEqual([]);
  });

  test('una factura sense data no tapa el mes, però el missatge ho diu', () => {
    const r = audita({ factures: [despesa('energia', 2026, 4), despesa('energia', 2026, 6), despesa('energia', 2026, 5, 10, { data: null })] });
    const [falta] = dels(r, 'FALTA_MENSUAL');
    expect(falta.mes).toBe('2026-05');
    expect(falta.missatge).toMatch(/una factura seua sense data/);
  });

  test('el NIF propi no impedix reconéixer el proveïdor pel nom', () => {
    const r = audita({
      nifsPropis: [CIF.propi],
      factures: [despesa('energia', 2026, 4, 10, { nif: CIF.propi }), despesa('energia', 2026, 5), despesa('energia', 2026, 6)]
    });
    expect(dels(r, 'FALTA_MENSUAL')).toEqual([]);
    expect(dels(r, 'NIF_PROPI')).toHaveLength(1);
  });
});

describe('auditaTrimestre: proveïdors bimestrals (format-fiscal-03)', () => {
  /* Una distribuïdora d'aigua que factura cada dos mesos: novembre, gener, març i maig. */
  const registre = aprenProveidors(
    [despesa('energia', 2025, 11), despesa('energia', 2026, 1), despesa('energia', 2026, 3), despesa('energia', 2026, 5)],
    { cataleg: [] }
  );
  const tercer = (factures) => auditaTrimestre({ any: 2026, t: 3, factures, proveidors: registre, avui: { a: 2026, m: 10, d: 2 } });

  test('la cadència apresa és bimestral', () => {
    expect(registre[0]).toMatchObject({ clau: 'exemple-energia', cadencia: 'bimestral' });
  });

  test('amb juliol i setembre no falta res: agost no s’espera', () => {
    const r = tercer([despesa('energia', 2026, 7), despesa('energia', 2026, 9)]);
    expect(dels(r, 'FALTA_MENSUAL')).toEqual([]);
    expect(dels(r, 'FALTA_HABITUAL')).toEqual([]);
  });

  test('sense la de setembre: un indici de severitat mitjana per a eixe mes', () => {
    const r = tercer([despesa('energia', 2026, 7)]);
    expect(dels(r, 'FALTA_MENSUAL')).toEqual([]);
    expect(dels(r, 'FALTA_HABITUAL')).toEqual([{
      codi: 'FALTA_HABITUAL',
      severitat: 'mitjana',
      missatge: 'Indici: falta la factura de setembre de 2026 d\'Exemple Energia SCCL, que factura cada dos mesos. Pot ser normal; revisa-ho.',
      proveidor: 'exemple-energia',
      mes: '2026-09'
    }]);
  });

  test('una factura que arriba un mes més tard compta, i el compte continua des d’ella', () => {
    const r = tercer([despesa('energia', 2026, 8)]);
    expect(dels(r, 'FALTA_HABITUAL')).toEqual([]);
  });

  test('sense cap factura del trimestre, falten juliol i setembre; amb avui a agost, només juliol', () => {
    expect(dels(tercer([]), 'FALTA_HABITUAL').map((i) => i.mes)).toEqual(['2026-07', '2026-09']);
    const agost = auditaTrimestre({ any: 2026, t: 3, factures: [], proveidors: registre, avui: { a: 2026, m: 8, d: 20 } });
    expect(dels(agost, 'FALTA_HABITUAL').map((i) => i.mes)).toEqual(['2026-07']);
  });
});

describe('auditaTrimestre: FALTA_HABITUAL', () => {
  test('amb el trimestre encara obert, només l\'anual si el seu mes ja ha arribat', () => {
    const obert = audita({ factures: [despesa('energia', 2026, 4)], avui: { a: 2026, m: 4, d: 20 } });
    expect(dels(obert, 'FALTA_HABITUAL')).toEqual([]);
    const maig = audita({ factures: [despesa('energia', 2026, 4)], avui: { a: 2026, m: 5, d: 2 } });
    expect(dels(maig, 'FALTA_HABITUAL').map((i) => i.proveidor)).toEqual(['exemple-dominis']);
  });

  test('un anual no avisa fora del seu trimestre', () => {
    const r = auditaTrimestre({ any: 2026, t: 3, factures: [], proveidors: REGISTRE });
    expect(dels(r, 'FALTA_HABITUAL').some((i) => i.proveidor === 'exemple-dominis')).toBe(false);
  });

  test('si el proveïdor ja hi és, no avisa', () => {
    const r = audita({ factures: [despesa('assessoria', 2026, 5), despesa('dominis', 2026, 5), despesa('impremta', 2026, 4)] });
    expect(dels(r, 'FALTA_HABITUAL')).toEqual([]);
  });
});

describe('auditaTrimestre: REBUT_SENSE_FACTURA', () => {
  const factures = [despesa('energia', 2026, 4), despesa('energia', 2026, 5), despesa('energia', 2026, 6)];

  test('un rebut sense proveïdor ni import', () => {
    const r = audita({ factures, documents: [{ ruta: '2026_2T/Receipt-2345-6789.pdf', tipus: 'rebut' }] });
    expect(dels(r, 'REBUT_SENSE_FACTURA')).toEqual([{
      codi: 'REBUT_SENSE_FACTURA',
      severitat: 'mitjana',
      missatge: "Rebut «Receipt-2345-6789.pdf» sense factura relacionada: no se n'ha pogut saber el proveïdor ni l'import. Un rebut de pagament no substituïx la factura.",
      fitxer: '2026_2T/Receipt-2345-6789.pdf'
    }]);
  });

  test('un rebut amb l\'import d\'una factura del trimestre no avisa (±1 cèntim)', () => {
    const r = audita({ factures, documents: [{ ruta: 'Receipt-1.pdf', tipus: 'rebut', import: 12101 }] });
    expect(dels(r, 'REBUT_SENSE_FACTURA')).toEqual([]);
  });

  test('un rebut d\'un import que no és de cap factura', () => {
    const [i] = dels(audita({ factures, documents: [{ ruta: 'Receipt-1.pdf', tipus: 'rebut', import: 9900 }] }), 'REBUT_SENSE_FACTURA');
    expect(i.missatge).toMatch(/per 99,00 € sense cap factura d'eixe import/);
  });

  test('un rebut d\'un proveïdor conegut sense factura seua', () => {
    const r = audita({ factures, documents: [{ ruta: 'r.pdf', tipus: 'rebut', proveidor: 'exemple-assessoria' }] });
    expect(dels(r, 'REBUT_SENSE_FACTURA')[0]).toMatchObject({ proveidor: 'exemple-assessoria', fitxer: 'r.pdf' });
    expect(dels(r, 'REBUT_SENSE_FACTURA')[0].missatge).toMatch(/d'Exemple Assessoria SL sense cap factura d'eixe proveïdor/);
  });

  test('el proveïdor es reconeix pel nom del fitxer, i amb el mateix import ja no avisa', () => {
    const rebut = { ruta: '2026_2T/fal-receipt-0001.pdf', tipus: 'rebut', import: 2000 };
    const sense = audita({ factures, documents: [rebut] });
    expect(dels(sense, 'REBUT_SENSE_FACTURA')[0].proveidor).toBe('fal-ai');
    const fal = crearFactura({
      tipus: 'despesa', data: { a: 2026, m: 5, d: 2 }, num: 'FAL-1', contrapart: 'fal.ai', subtotal: 2000, iva: 0, total: 2000
    });
    expect(dels(audita({ factures: [...factures, fal], documents: [rebut] }), 'REBUT_SENSE_FACTURA')).toEqual([]);
  });

  test('els altres tipus de document no són rebuts', () => {
    const r = audita({ factures, documents: [{ ruta: 'Receipt-1.pdf', tipus: 'factura' }, { ruta: 'x.csv', tipus: 'extracte' }, null] });
    expect(dels(r, 'REBUT_SENSE_FACTURA')).toEqual([]);
  });
});

describe('auditaTrimestre: REBUT_SENSE_FACTURA pel número citat (G3T-04)', () => {
  /* Tres factures del mateix proveïdor i del mateix import: casar per import amagaria la que falta. */
  const serie = (n, canvis = {}) => despesa('ferreteria', 2026, 5, 10 + n, { num: `X-000${n}`, ...canvis });
  const tres = [serie(1), serie(2), serie(3)];
  const rebut = (canvis) => ({ ruta: '2026_2T/Receipt-7000-0001.pdf', tipus: 'rebut', import: 12100, ...canvis });

  test('cita un número absent: alta amb el número, encara que l’import case amb una altra factura', () => {
    const avisos = dels(audita({ factures: tres, documents: [rebut({ numeroCitat: 'X-0004' })] }), 'REBUT_SENSE_FACTURA');
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({ severitat: 'alta', numero: 'X-0004', fitxer: '2026_2T/Receipt-7000-0001.pdf' });
    expect(avisos[0].missatge).toContain('cita la factura «X-0004»');
    expect(avisos[0].missatge).toMatch(/no substituïx la factura/);
  });

  test('cita un número present: no avisa, encara que l’import no case', () => {
    const r = audita({ factures: tres, documents: [rebut({ numeroCitat: 'X-0002', import: 9900 })] });
    expect(dels(r, 'REBUT_SENSE_FACTURA')).toEqual([]);
  });

  test('la cita es normalitza com clauDuplicat (espais i majúscules) i també sense separadors', () => {
    for (const numeroCitat of ['x-0002', ' X-0002 ', 'X 0002', 'X0002', 'X.0002']) {
      expect(dels(audita({ factures: tres, documents: [rebut({ numeroCitat })] }), 'REBUT_SENSE_FACTURA'), numeroCitat).toEqual([]);
    }
  });

  test('un número llegit truncat casa pel nom del fitxer de la factura, que acaba amb el número citat', () => {
    const truncada = despesa('ferreteria', 2026, 5, 4, { num: 'X', origen: { fitxer: '2026_2T/Invoice-X-0004.pdf', metode: 'pdf' } });
    const r = audita({ factures: [...tres, truncada], documents: [rebut({ numeroCitat: 'X-0004' })] });
    expect(dels(r, 'REBUT_SENSE_FACTURA')).toEqual([]);
    /* Una cita curta no casa pel nom del fitxer. */
    const curta = audita({ factures: [truncada], documents: [rebut({ numeroCitat: '04' })] });
    expect(dels(curta, 'REBUT_SENSE_FACTURA')).toHaveLength(1);
  });

  test('sense número citat (null o absent), casa com abans per proveïdor i import', () => {
    expect(dels(audita({ factures: tres, documents: [rebut({ numeroCitat: null, import: 12101 })] }), 'REBUT_SENSE_FACTURA')).toEqual([]);
    expect(dels(audita({ factures: tres, documents: [rebut({ numeroCitat: '' })] }), 'REBUT_SENSE_FACTURA')).toEqual([]);
    const [i] = dels(audita({ factures: tres, documents: [rebut({ numeroCitat: null, import: 9900 })] }), 'REBUT_SENSE_FACTURA');
    expect(i).toMatchObject({ severitat: 'mitjana' });
    expect(i).not.toHaveProperty('numero');
  });

  test('una factura d’un trimestre anterior (al registre o a l’historial) no falta', () => {
    const anterior = despesa('ferreteria', 2026, 3, 30, { num: 'X-0000' });
    const registre = aprenProveidors([...HISTORIAL, anterior]);
    expect(dels(audita({ proveidors: registre, factures: tres, documents: [rebut({ numeroCitat: 'X-0000' })] }), 'REBUT_SENSE_FACTURA')).toEqual([]);
    const ambHistorial = audita({ factures: tres, historial: [anterior], documents: [rebut({ numeroCitat: 'X 0000' })] });
    expect(dels(ambHistorial, 'REBUT_SENSE_FACTURA')).toEqual([]);
  });

  test('un cobrament també pot citar una factura emesa', () => {
    const r = audita({ factures: [ingres], documents: [rebut({ numeroCitat: 'F26 0001', import: null })] });
    expect(dels(r, 'REBUT_SENSE_FACTURA')).toEqual([]);
  });

  test('amb el proveïdor conegut, el missatge el nomena', () => {
    const [i] = dels(audita({ factures: tres, documents: [rebut({ numeroCitat: 'X-0009', proveidor: 'exemple-ferreteria' })] }), 'REBUT_SENSE_FACTURA');
    expect(i).toMatchObject({ proveidor: 'exemple-ferreteria', numero: 'X-0009' });
    expect(i.missatge).toMatch(/^Rebut «Receipt-7000-0001\.pdf» d'Exemple Ferreteria SL: cita la factura «X-0009»/);
  });

  /* G3T-R06: el número citat es busca entre les factures del proveïdor del rebut. */
  test('un rebut d’un proveïdor que cita el número d’una factura d’un altre: alta', () => {
    const deFusteria = rebut({ numeroCitat: 'X-0002', proveidor: 'exemple-fusteria' });
    const [i, ...resta] = dels(audita({ factures: tres, documents: [deFusteria] }), 'REBUT_SENSE_FACTURA');
    expect(resta).toEqual([]);
    expect(i).toMatchObject({ severitat: 'alta', numero: 'X-0002', proveidor: 'exemple-fusteria' });
    /* La factura de la fusteria amb el mateix número sí que casa; sense proveïdor al rebut, com abans. */
    const propia = despesa('fusteria', 2026, 5, 20, { num: 'X-0002' });
    expect(dels(audita({ factures: [...tres, propia], documents: [deFusteria] }), 'REBUT_SENSE_FACTURA')).toEqual([]);
    expect(dels(audita({ factures: tres, documents: [rebut({ numeroCitat: 'X-0002' })] }), 'REBUT_SENSE_FACTURA')).toEqual([]);
  });

  test('una factura sense proveïdor conegut o una d’emesa també es poden citar', () => {
    const senseProveidor = crearFactura({ tipus: 'despesa', data: { a: 2026, m: 5, d: 3 }, num: 'Q-0101', contrapart: '', total: 5000 });
    const deFusteria = (numeroCitat) => rebut({ numeroCitat, proveidor: 'exemple-fusteria' });
    expect(dels(audita({ factures: [senseProveidor], documents: [deFusteria('Q-0101')] }), 'REBUT_SENSE_FACTURA')).toEqual([]);
    expect(dels(audita({ factures: [ingres], documents: [deFusteria('F26 0001')] }), 'REBUT_SENSE_FACTURA')).toEqual([]);
  });

  test('d’un altre trimestre, només els números del mateix proveïdor (registre i historial)', () => {
    const anterior = despesa('ferreteria', 2026, 3, 30, { num: 'X-0000' });
    const registre = aprenProveidors([...HISTORIAL, anterior]);
    const deFusteria = rebut({ numeroCitat: 'X-0000', proveidor: 'exemple-fusteria' });
    expect(dels(audita({ proveidors: registre, factures: tres, documents: [deFusteria] }), 'REBUT_SENSE_FACTURA')).toHaveLength(1);
    expect(dels(audita({ factures: tres, historial: [anterior], documents: [deFusteria] }), 'REBUT_SENSE_FACTURA')).toHaveLength(1);
    const deFerreteria = rebut({ numeroCitat: 'X-0000', proveidor: 'exemple-ferreteria' });
    expect(dels(audita({ proveidors: registre, factures: tres, documents: [deFerreteria] }), 'REBUT_SENSE_FACTURA')).toEqual([]);
    expect(dels(audita({ factures: tres, historial: [anterior], documents: [deFerreteria] }), 'REBUT_SENSE_FACTURA')).toEqual([]);
  });
});

/* R3T-03: un rebut sense número que paga alhora dues o més factures del proveïdor. Imports inventats. */
describe('auditaTrimestre: PAGAMENT_AGRUPAT', () => {
  const ferreteria = (num, base) => {
    const iva = Math.round((base * 21) / 100);
    return despesa('ferreteria', 2026, 5, 5, { num, subtotal: base, iva, total: base + iva });
  };
  const dues = [ferreteria('FE-0101', 110000), ferreteria('FE-0102', 230000)];
  const rebut = (canvis) => ({ ruta: '2026_2T/Justi_0001.pdf', tipus: 'rebut', proveidor: 'exemple-ferreteria', ...canvis });
  const agrupats = (r) => dels(r, 'PAGAMENT_AGRUPAT');

  test('l’import és la suma de l’IVA de dues factures: informativa, amb els números, i cap REBUT_SENSE_FACTURA', () => {
    const r = audita({ factures: dues, documents: [rebut({ import: 23100 + 48300 })] });
    expect(dels(r, 'REBUT_SENSE_FACTURA')).toEqual([]);
    const [i, ...resta] = agrupats(r);
    expect(resta).toEqual([]);
    expect(i).toMatchObject({
      codi: 'PAGAMENT_AGRUPAT', severitat: 'info', fitxer: '2026_2T/Justi_0001.pdf', proveidor: 'exemple-ferreteria', numeros: ['FE-0101', 'FE-0102']
    });
    expect(i.missatge).toBe("Rebut «Justi_0001.pdf» d'Exemple Ferreteria SL: l'import (714,00 €) és la suma de l'IVA de les factures "
      + "«FE-0101» i «FE-0102». Pareix un pagament agrupat d'eixes factures, que ja són a la proposta: no cal buscar-ne cap més.");
  });

  test('també pels totals, i amb la combinació més curta (± 1 cèntim)', () => {
    const tres = [...dues, ferreteria('FE-0103', 50000)];
    const [i] = agrupats(audita({ factures: tres, documents: [rebut({ import: 133100 + 278300 + 1 })] }));
    expect(i).toMatchObject({ numeros: ['FE-0101', 'FE-0102'] });
    expect(i.missatge).toMatch(/la suma dels totals de les factures/);
  });

  test('no és cap pagament agrupat: un import que no casa, sense proveïdor o d’un altre proveïdor', () => {
    const casos = [
      rebut({ import: 9900 }),
      rebut({ import: 23100 + 48300, proveidor: undefined }),
      rebut({ import: 23100 + 48300, proveidor: 'exemple-fusteria' })
    ];
    for (const document of casos) {
      const r = audita({ factures: dues, documents: [document] });
      expect(agrupats(r)).toEqual([]);
      expect(dels(r, 'REBUT_SENSE_FACTURA')).toHaveLength(1);
    }
  });

  test('una sola factura no fa cap agrupació: el rebut amb el seu import ja casa', () => {
    const r = audita({ factures: dues, documents: [rebut({ import: 133100 })] });
    expect(agrupats(r)).toEqual([]);
    expect(dels(r, 'REBUT_SENSE_FACTURA')).toEqual([]);
  });
});

describe('auditaTrimestre: FORAT_NUMERACIO (G3T-05)', () => {
  const amb = (qui, nums) => nums.map((num, k) => despesa(qui, 2026, 5, 1 + k, { num }));
  const forats = (r) => dels(r, 'FORAT_NUMERACIO');

  test('X-0001, 0002, 0003 i 0005 d’un proveïdor: indici de severitat mitjana amb la X-0004', () => {
    const [i, ...resta] = forats(audita({ factures: amb('ferreteria', ['X-0001', 'X-0002', 'X-0003', 'X-0005']) }));
    expect(resta).toEqual([]);
    expect(i).toMatchObject({ codi: 'FORAT_NUMERACIO', severitat: 'mitjana', numeros: ['X-0004'], proveidor: 'exemple-ferreteria' });
    expect(i.missatge).toBe("Indici: falta el número «X-0004» a la sèrie de factures d'Exemple Ferreteria SL (entre «X-0001» i «X-0005»). "
      + "Pot ser una factura anul·lada o d'un altre compte; si no, falta a la carpeta.");
  });

  test('diversos números que falten, en ordre', () => {
    const [i] = forats(audita({ factures: amb('ferreteria', ['T7 0010', 'T7 0013', 'T7 0014', 'T7 0016']) }));
    expect(i.numeros).toEqual(['T7 0011', 'T7 0012', 'T7 0015']);
    expect(i.missatge).toMatch(/falten els números «T7 0011», «T7 0012» i «T7 0015»/);
  });

  test('una numeració global que no és densa no avisa', () => {
    expect(forats(audita({ factures: amb('energia', ['FE7700000101', 'FE7700000774']) }))).toEqual([]);
    /* 1, 2 i 9: el rang (9) passa de tres vegades els vistos (3 × 3). */
    expect(forats(audita({ factures: amb('ferreteria', ['X-0001', 'X-0002', 'X-0010']) }))).toEqual([]);
  });

  test('per prefix i per proveïdor: les sèries no es barregen', () => {
    const r = audita({
      factures: [...amb('ferreteria', ['A-0001', 'A-0003', 'A-0004', 'B-0010', 'B-0011', 'B-0013']), ...amb('fusteria', ['A-0002', 'B-0012'])]
    });
    expect(forats(r).map((i) => [i.proveidor, i.numeros])).toEqual([['exemple-ferreteria', ['A-0002']], ['exemple-ferreteria', ['B-0012']]]);
  });

  /* G3T-R07: un autònom numera igual per a tots els clients: dos números seus amb un salt són factures d'altres. */
  test('un proveïdor amb només dos números al trimestre no fa cap forat; la sèrie emesa pròpia, sí', () => {
    expect(forats(audita({ factures: amb('impremta', ['2026/015', '2026/018']) }))).toEqual([]);
    expect(forats(audita({ factures: amb('impremta', ['2026/015', '2026/016', '2026/018']) })).map((i) => i.numeros)).toEqual([['2026/017']]);
  });

  test('cap avís sense comptador final, amb una sola factura o sense número', () => {
    const r = audita({ factures: [...amb('ferreteria', ['QX7ZK2WM', 'X-0001', '']), ...amb('fusteria', ['Z-0007'])] });
    expect(forats(r)).toEqual([]);
  });

  test('la sèrie emesa pròpia dins del trimestre', () => {
    const emesa = (num, d) => crearFactura({ ...ingres, id: '', num, data: { a: 2026, m: 5, d } });
    const [i] = forats(audita({ factures: [emesa('F26 0003', 2), emesa('F26 0005', 20)] }));
    expect(i).toMatchObject({ severitat: 'mitjana', numeros: ['F26 0004'] });
    expect(i).not.toHaveProperty('proveidor');
    expect(i.missatge).toMatch(/^Indici: falta el número «F26 0004» a la teua sèrie de factures emeses/);
  });

  test('la correlativitat de la sèrie emesa amb l’historial: el forat entre trimestres', () => {
    const emesa = (num, a, m) => crearFactura({ ...ingres, id: '', num, data: { a, m, d: 15 } });
    const delTrimestre = [emesa('F26 0003', 2026, 5)];
    expect(forats(audita({ factures: delTrimestre, historial: [emesa('F26 0001', 2026, 2), emesa('F26 0002', 2026, 3)] }))).toEqual([]);
    /* Les despeses de l'historial no són de la sèrie pròpia, encara que el número s'hi assemble. */
    const aliena = despesa('ferreteria', 2026, 3, 10, { num: 'F26 0002' });
    const [i] = forats(audita({ factures: delTrimestre, historial: [emesa('F26 0001', 2026, 2), aliena] }));
    expect(i.numeros).toEqual(['F26 0002']);
    /* Un forat antic de l'historial no és d'este trimestre. */
    const antic = audita({ factures: delTrimestre, historial: [emesa('F26 0000', 2025, 12), emesa('F26 0002', 2026, 3)] });
    expect(forats(antic)).toEqual([]);
  });
});

describe('auditaTrimestre: IVA_ESTRANGER (operacions amb l’estranger)', () => {
  /* Un NIF-IVA sintètic d'Irlanda: prefix de país i xifres inventades. */
  const NIF_IE = 'IE7000001TA';
  const CATALEG = [{
    clau: 'exemple-nuvol', nom: 'Exemple Núvol Inc', nif: null, pais: 'US', dominis: [], patronsFitxer: [], patronsNum: [],
    paraulesText: ['Exemple Núvol'], cadencia: null, ivaHabitual: null
  }];
  const registre = aprenProveidors([], { cataleg: CATALEG });
  const estrangera = (canvis) => crearFactura({
    tipus: 'despesa', data: { a: 2026, m: 5, d: 31 }, num: 'EX-0001', contrapart: 'Exemple Cloud Ltd', nif: NIF_IE,
    descripcio: 'Servei', subtotal: 4150, iva: 0, total: 4150, origen: { fitxer: '2026_2T/EX-0001.pdf', metode: 'pdf' }, ...canvis
  });
  const estrangeres = (r) => dels(r, 'IVA_ESTRANGER');

  test('NIF-IVA d’un altre país i sense IVA: possible autoliquidació, a preguntar a la gestoria', () => {
    const f = estrangera();
    const [i, ...resta] = estrangeres(audita({ factures: [f] }));
    expect(resta).toEqual([]);
    expect(i).toMatchObject({ severitat: 'mitjana', pais: 'IE', facturaId: f.id, fitxer: f.origen.fitxer });
    expect(i.missatge).toBe("Factura d'una empresa d'un altre país (Irlanda) sense IVA: pot ser una operació amb autoliquidació "
      + '(inversió del subjecte passiu). Pregunta-ho a la gestoria.');
  });

  test('amb IVA repercutit per una empresa no establerta: que la gestoria diga si és deduïble', () => {
    const [i] = estrangeres(audita({ factures: [estrangera({ subtotal: 2500, iva: 525, total: 3025 })] }));
    expect(i.missatge).toBe("Factura d'una empresa d'un altre país (Irlanda) amb IVA (21 %): pregunta a la gestoria si eixe IVA és deduïble.");
  });

  test('sense NIF a la factura, el país del proveïdor del catàleg', () => {
    const f = estrangera({ nif: '', contrapart: 'Exemple Núvol Inc', moneda: 'USD', subtotal: 1000, total: 1000 });
    const [i] = estrangeres(audita({ proveidors: registre, factures: [f] }));
    expect(i).toMatchObject({ pais: 'US' });
    expect(i.missatge).toMatch(/^Factura d'una empresa d'un altre país \(Estats Units\) sense IVA/);
  });

  test('un NIF espanyol mana sobre el país del catàleg', () => {
    const f = estrangera({ nif: CIF.ferreteria, contrapart: 'Exemple Núvol Inc' });
    expect(estrangeres(audita({ proveidors: registre, factures: [f] }))).toEqual([]);
  });

  test('no avisen: les factures espanyoles, els ingressos, el NIF propi ni un IVA que no s’ha llegit', () => {
    const r = audita({
      nifsPropis: [NIF_IE],
      factures: [
        despesa('ferreteria', 2026, 5),
        crearFactura({ ...ingres, id: '', nif: 'IE7000002TA', iva: 0, total: 50000 }),
        estrangera({ num: 'EX-0002' }),
        estrangera({ nif: 'IE7000003TA', num: 'EX-0003', iva: null })
      ]
    });
    expect(estrangeres(r)).toEqual([]);
  });

  test('el to: una pregunta per a la gestoria, no una instrucció fiscal', () => {
    const r = audita({ factures: [estrangera(), estrangera({ num: 'EX-0009', subtotal: 1000, iva: 210, total: 1210 })] });
    expect(estrangeres(r)).toHaveLength(2);
    for (const i of estrangeres(r)) {
      expect(i.missatge).toMatch(/gestoria/);
      expect(i.missatge).not.toMatch(/\b(?:has de|cal declarar|declara-la|aplica)\b/i);
    }
  });
});

describe('auditaTrimestre: POSSIBLE_DOBLE_COBRAMENT', () => {
  const dobles = (r) => dels(r, 'POSSIBLE_DOBLE_COBRAMENT');

  test('mateix proveïdor, dia i import amb números diferents: indici de severitat baixa', () => {
    const a = despesa('ferreteria', 2026, 5, 29, { num: 'X-0011' });
    const b = despesa('ferreteria', 2026, 5, 29, { num: 'X-0012' });
    const [i, ...resta] = dobles(audita({ factures: [a, b] }));
    expect(resta).toEqual([]);
    expect(i).toMatchObject({ severitat: 'baixa', facturaId: b.id, fitxer: b.origen.fitxer });
    expect(i.missatge).toBe("Indici: «X-0012» i «X-0011» d'Exemple Ferreteria SL són del mateix dia (29/05/2026) i del mateix import "
      + '(121,00 €): possible doble cobrament, comprova-ho.');
  });

  test('l’ordre de les factures no canvia l’avís: el tractor i la revisió diuen el mateix', () => {
    const a = despesa('ferreteria', 2026, 5, 28, { num: 'X-0031' });
    const b = despesa('ferreteria', 2026, 5, 28, { num: 'X-0032' });
    const clau = (r) => dobles(r).map((i) => `${i.facturaId}|${i.missatge}`);
    expect(clau(audita({ factures: [b, a] }))).toEqual(clau(audita({ factures: [a, b] })));
    expect(dobles(audita({ factures: [b, a] }))[0].facturaId).toBe(b.id);
  });

  test('no avisa: dies o imports diferents, el mateix número (ja és DUPLICAT), sense número o un altre proveïdor', () => {
    const r = audita({
      factures: [
        despesa('ferreteria', 2026, 5, 20, { num: 'X-0021' }), despesa('ferreteria', 2026, 5, 21, { num: 'X-0022' }),
        despesa('ferreteria', 2026, 5, 22, { num: 'X-0023' }), despesa('ferreteria', 2026, 5, 22, { num: 'X-0024', total: 12000, iva: 2000 }),
        despesa('ferreteria', 2026, 5, 23, { num: 'X-0025' }), despesa('ferreteria', 2026, 5, 23, { num: ' x-0025' }),
        despesa('ferreteria', 2026, 5, 24, { num: '' }), despesa('ferreteria', 2026, 5, 24, { num: 'X-0026' }),
        despesa('ferreteria', 2026, 5, 25, { num: 'X-0027' }), despesa('fusteria', 2026, 5, 25, { num: 'X-0028' })
      ]
    });
    expect(dobles(r)).toEqual([]);
    expect(dels(r, 'DUPLICAT')).toHaveLength(1);
  });
});

describe('auditaTrimestre: DUPLICAT i NIF_PROPI', () => {
  test('dues factures del mateix proveïdor i número', () => {
    const a = despesa('ferreteria', 2026, 5, 10, { num: 'T 77' });
    const b = despesa('ferreteria', 2026, 5, 11, { num: 't77' });
    const [i, ...resta] = dels(audita({ factures: [a, b] }), 'DUPLICAT');
    expect(resta).toEqual([]);
    expect(i).toMatchObject({ severitat: 'mitjana', facturaId: b.id, fitxer: b.origen.fitxer });
    expect(i.missatge).toBe(`Possible duplicat: la factura «t77» d'Exemple Ferreteria SL apareix més d'una vegada (també a «${a.origen.fitxer.split('/').pop()}»).`);
  });

  test('l’ordre de les factures no canvia quina porta l’avís: la del fitxer que va darrere', () => {
    const a = despesa('ferreteria', 2026, 5, 10, { num: 'T 78', origen: { fitxer: '2026_2T/t78.pdf', metode: 'pdf' } });
    const b = despesa('ferreteria', 2026, 5, 11, { num: 't78', origen: { fitxer: '2026_2T/t78 copia.pdf', metode: 'pdf' } });
    const clau = (r) => dels(r, 'DUPLICAT').map((i) => `${i.facturaId}|${i.missatge}`);
    expect(clau(audita({ factures: [b, a] }))).toEqual(clau(audita({ factures: [a, b] })));
    /* «t78 copia.pdf» va davant de «t78.pdf» (l'espai abans que el punt), com en la llista de la carpeta. */
    expect(dels(audita({ factures: [a, b] }), 'DUPLICAT')[0].facturaId).toBe(a.id);
  });

  test('no són duplicats: sense número, tipus diferent o un altre proveïdor', () => {
    const r = audita({
      factures: [
        despesa('ferreteria', 2026, 5, 10, { num: '' }), despesa('ferreteria', 2026, 5, 10, { num: '' }),
        despesa('ferreteria', 2026, 5, 10, { num: 'X-1' }), despesa('fusteria', 2026, 5, 10, { num: 'X-1' }),
        crearFactura({ ...despesa('ferreteria', 2026, 5, 10, { num: 'X-1' }), id: '', tipus: 'ingres' })
      ]
    });
    expect(dels(r, 'DUPLICAT')).toEqual([]);
  });

  test('documents amb el mateix contingut (sense grups donats)', () => {
    const r = audita({ documents: [
      { ruta: '2026_2T/a.pdf', sha256: 's1', tipus: 'factura' },
      { ruta: '2026_2T/b.pdf', sha256: 's1', tipus: 'factura' },
      { ruta: '2026_2T/c.pdf', sha256: 's2', tipus: 'factura' }
    ] });
    expect(dels(r, 'DUPLICAT')).toEqual([{
      codi: 'DUPLICAT',
      severitat: 'mitjana',
      missatge: 'Document duplicat: «b.pdf» té el mateix contingut que «a.pdf».',
      fitxer: '2026_2T/b.pdf'
    }]);
  });

  test('amb els grups de detectaDuplicats, mana el que diuen', () => {
    const documents = [{ ruta: 'a/f.pdf', sha256: 's1' }, { ruta: 'a/f copia.pdf', sha256: 's1' }];
    const ambGrups = audita({ documents, duplicats: [{ motiu: 'nom', documents: [documents[0], documents[1]] }] });
    expect(dels(ambGrups, 'DUPLICAT')[0].missatge).toBe('Document duplicat: «f copia.pdf» pareix una còpia de «f.pdf».');
    expect(dels(audita({ documents, duplicats: [] }), 'DUPLICAT')).toEqual([]);
  });

  test('NIF propi en una despesa i en un ingrés, sense escriure el NIF al missatge', () => {
    const r = audita({
      nifsPropis: [`ES ${CIF.propi}`],
      factures: [
        despesa('ferreteria', 2026, 5, 10, { nif: CIF.propi }),
        crearFactura({ ...ingres, id: '', nif: CIF.propi })
      ]
    });
    const propis = dels(r, 'NIF_PROPI');
    expect(propis).toHaveLength(2);
    expect(propis.every((i) => i.severitat === 'alta' && i.facturaId)).toBe(true);
    expect(propis.map((i) => i.missatge).join(' ')).not.toContain(CIF.propi);
    expect(propis[0].missatge).toMatch(/proveïdor és el teu/);
    expect(propis[1].missatge).toMatch(/client és el teu/);
  });
});

describe('auditaTrimestre: correu', () => {
  const factures = [despesa('energia', 2026, 4), despesa('energia', 2026, 5), despesa('energia', 2026, 6)];
  const correu = (data, canvis = {}) => ({
    de: 'factures@somenergia.coop', nomRemitent: 'Som Energia', domini: 'somenergia.coop', assumpte: 'La teua factura',
    data, idMissatge: `m${data?.m}${data?.d}@example.com`, adjunts: [], esFactura: true, ...canvis
  });

  test('un correu de factura d\'un proveïdor del catàleg sense document', () => {
    const r = audita({ factures, correus: [correu({ a: 2026, m: 5, d: 3 })] });
    expect(dels(r, 'CORREU_SENSE_DOCUMENT')).toEqual([{
      codi: 'CORREU_SENSE_DOCUMENT',
      severitat: 'alta',
      missatge: 'Un correu de factura de Som Energia, SCCL (03/05/2026) sense cap factura seua a la carpeta en ±7 dies ni en el mateix mes.',
      proveidor: 'som-energia',
      mes: '2026-05'
    }]);
    expect(dels(r, 'CORREU_NO_REVISAT')).toEqual([]);
  });

  test('diversos correus del mateix proveïdor i mes fan un sol avís', () => {
    const r = audita({ factures, correus: [correu({ a: 2026, m: 5, d: 3 }), correu({ a: 2026, m: 5, d: 20 }), correu({ a: 2026, m: 6, d: 1 })] });
    const avisos = dels(r, 'CORREU_SENSE_DOCUMENT');
    expect(avisos.map((i) => i.mes)).toEqual(['2026-05', '2026-06']);
    expect(avisos[0].missatge).toMatch(/^2 correus de factura de Som Energia, SCCL \(03\/05\/2026, 20\/05\/2026\)/);
  });

  test('amb una factura del proveïdor a ±7 dies o al mateix mes, no avisa', () => {
    const energia = { de: 'avisos@example.com', nomRemitent: 'Exemple Energia', domini: 'example.com' };
    const prop = audita({ factures: [despesa('energia', 2026, 4, 28)], correus: [correu({ a: 2026, m: 5, d: 4 }, energia)] });
    expect(dels(prop, 'CORREU_SENSE_DOCUMENT')).toEqual([]);
    const mateixMes = audita({ factures: [despesa('energia', 2026, 5, 30)], correus: [correu({ a: 2026, m: 5, d: 1 }, energia)] });
    expect(dels(mateixMes, 'CORREU_SENSE_DOCUMENT')).toEqual([]);
    const lluny = audita({ factures: [despesa('energia', 2026, 4, 1)], correus: [correu({ a: 2026, m: 5, d: 20 }, energia)] });
    expect(dels(lluny, 'CORREU_SENSE_DOCUMENT').map((i) => i.proveidor)).toEqual(['exemple-energia']);
  });

  test('a la vora del trimestre compta la factura del mes veí de l\'historial', () => {
    const energia = { nomRemitent: 'Exemple Energia', domini: 'example.com' };
    const r = audita({ factures: [], correus: [correu({ a: 2026, m: 4, d: 3 }, energia)] });
    expect(dels(r, 'CORREU_SENSE_DOCUMENT')).toEqual([]);
  });

  test('s\'ignoren: els que no són de factura, els de fora del trimestre, sense data o sense proveïdor', () => {
    const r = audita({
      factures,
      correus: [
        correu({ a: 2026, m: 5, d: 3 }, { esFactura: false }),
        correu({ a: 2026, m: 7, d: 5 }),
        correu(null),
        correu({ a: 2026, m: 5, d: 3 }, { de: 'x@example.org', domini: 'example.org', nomRemitent: 'Desconegut' }),
        null
      ]
    });
    expect(dels(r, 'CORREU_SENSE_DOCUMENT')).toEqual([]);
    expect(r.cobertura).toEqual({
      carpeta: 'revisada', correu: 'revisat', correusRevisats: 5,
      periodeCorreu: { inici: { a: 2026, m: 5, d: 3 }, fi: { a: 2026, m: 7, d: 5 } }
    });
  });

  test('l\'adjunt també identifica el proveïdor', () => {
    const r = audita({ factures, correus: [correu({ a: 2026, m: 5, d: 3 }, { domini: 'example.org', nomRemitent: '', adjunts: ['lowi_maig.pdf'] })] });
    expect(dels(r, 'CORREU_SENSE_DOCUMENT').map((i) => i.proveidor)).toEqual(['lowi']);
  });

  test('cobertura parcial o sense dates: avís informatiu', () => {
    const parcial = audita({ factures, correus: [correu({ a: 2026, m: 4, d: 15 }, { esFactura: false })] });
    expect(dels(parcial, 'CORREU_PARCIAL')[0].missatge).toBe('El correu revisat va del 15/04/2026 al 15/04/2026: no cobrix tot el trimestre.');
    const senseDates = audita({ factures, correus: [] });
    expect(senseDates.cobertura).toMatchObject({ correu: 'revisat', correusRevisats: 0, periodeCorreu: null });
    expect(dels(senseDates, 'CORREU_PARCIAL')[0].missatge).toMatch(/cap missatge amb data/);
    const sencer = audita({ factures, correus: [correu({ a: 2026, m: 3, d: 30 }, { esFactura: false }), correu({ a: 2026, m: 7, d: 1 }, { esFactura: false })] });
    expect(dels(sencer, 'CORREU_PARCIAL')).toEqual([]);
  });

  test('sense registre, el catàleg encara identifica el correu i no hi ha avisos d\'absència', () => {
    const r = auditaTrimestre({ any: 2026, t: 2, factures: [], correus: [correu({ a: 2026, m: 5, d: 3 })] });
    expect(codis(r)).toEqual(['CORREU_SENSE_DOCUMENT', 'CORREU_PARCIAL']);
  });
});

describe('auditaTrimestre: validació i entrades', () => {
  test('inclou les incidències de cada factura, amb el rang del trimestre', () => {
    const fora = despesa('ferreteria', 2026, 7, 2);
    const coixa = despesa('ferreteria', 2026, 5, 10, { num: '', iva: 500 });
    const r = audita({ factures: [fora, coixa] });
    expect(dels(r, 'FORA_TRIMESTRE')).toEqual([expect.objectContaining({ facturaId: fora.id })]);
    expect(dels(r, 'CAMP_BUIT')).toEqual([expect.objectContaining({ camp: 'num', facturaId: coixa.id })]);
    expect(dels(r, 'IVA_INCOHERENT')).toHaveLength(1);
    expect(r.resum).toMatchObject({ factures: 2, completes: 1, pendents: 1 });
  });

  test('un trimestre que no existix és un error', () => {
    expect(() => auditaTrimestre({ any: 2026, t: 5 })).toThrow(RangeError);
    expect(() => auditaTrimestre()).toThrow(RangeError);
  });

  test('entrades buides', () => {
    const r = auditaTrimestre({ any: 2026, t: 1, factures: null, documents: null });
    expect(r.resum).toEqual({ factures: 0, completes: 0, pendents: 0, ingressos: 0, despeses: 0 });
    expect(codis(r)).toEqual(['CORREU_NO_REVISAT']);
  });
});
