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

describe('auditaTrimestre: DUPLICAT i NIF_PROPI', () => {
  test('dues factures del mateix proveïdor i número', () => {
    const a = despesa('ferreteria', 2026, 5, 10, { num: 'T 77' });
    const b = despesa('ferreteria', 2026, 5, 11, { num: 't77' });
    const [i, ...resta] = dels(audita({ factures: [a, b] }), 'DUPLICAT');
    expect(resta).toEqual([]);
    expect(i).toMatchObject({ severitat: 'mitjana', facturaId: b.id, fitxer: b.origen.fitxer });
    expect(i.missatge).toBe(`Possible duplicat: la factura «t77» d'Exemple Ferreteria SL apareix més d'una vegada (també a «${a.origen.fitxer.split('/').pop()}»).`);
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
