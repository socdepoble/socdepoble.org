// @vitest-environment node
/* Gestoria · nucli · proveïdors: cadència, registre après de l'historial i
   fusionat amb el catàleg, i identificació per NIF, domini, nom i fitxer.
   Empreses fictícies i CIF sintètics calculats ací. */
import { describe, expect, test } from 'vitest';
import { aprenProveidors, cadenciaDe, clauMes, identificaProveidor, indexMes, paisDelNif } from './proveidors.js';
import { crearFactura } from './model.js';
import { validaNif } from './nif.js';

/* Un CIF de lletra B calculat ací (control amb xifra). */
function cifB(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  return `B${xifres}${(10 - ((parells + senars) % 10)) % 10}`;
}
const CIF_ASSESSORIA = cifB('7111111');
const CIF_FERRETERIA = cifB('7222222');
const CIF_ALTRA = cifB('7333333');
const CIF_PROPI = cifB('7444444');
const NIF_SOM_ENERGIA = 'F55091367';

const despesa = (contrapart, nif, a, m, canvis = {}) => crearFactura({
  tipus: 'despesa',
  data: { a, m, d: 10 },
  num: `N-${a}-${m}-${contrapart.length}`,
  contrapart,
  nif,
  descripcio: `Servei ${m}/${a}`,
  subtotal: 10000,
  iva: 2100,
  total: 12100,
  origen: { metode: 'model' },
  ...canvis
});

const perClau = (registre) => Object.fromEntries(registre.map((p) => [p.clau, p]));

describe('clauMes i indexMes', () => {
  test('clau de mes i índex absolut', () => {
    expect(clauMes({ a: 2026, m: 4, d: 30 })).toBe('2026-04');
    expect(clauMes(null)).toBe('');
    expect(clauMes({ a: 2026, m: 2, d: 30 })).toBe('');
    expect(indexMes('2026-01')).toBe(2026 * 12);
    expect(indexMes('2026-12') - indexMes('2026-01')).toBe(11);
    expect(indexMes('2026-13')).toBeNull();
    expect(indexMes('abril')).toBeNull();
    expect(indexMes(null)).toBeNull();
  });
});

describe('cadenciaDe', () => {
  /* format-fiscal-03: abans, dos mesos qualssevol d'un trimestre ja feien
     «mensual» (gener i febrer; gener i març). Ara cal un indici de veres: tres
     mesos seguits o mesos contigus en dos trimestres. Gener i març és el salt
     d'una factura bimestral, i amb dues mostres no n'hi ha prou per a dir-ho. */
  test.each([
    [[], null],
    [['x', '2026-13'], null],
    [['2026-01'], 'puntual'],
    [['2026-01', '2026-02'], 'puntual'],
    [['2026-01', '2026-03'], 'puntual'],
    [['2026-01', '2026-02', '2026-03'], 'mensual'],
    [['2026-01', '2026-02', '2026-04', '2026-05'], 'mensual'],
    [['2026-03', '2026-04', '2026-06', '2026-07'], 'mensual'],
    [['2026-01', '2026-03', '2026-05'], 'bimestral'],
    [['2025-11', '2026-01', '2026-03', '2026-05', '2026-07'], 'bimestral'],
    [['2025-12', '2026-01', '2026-02'], 'mensual'],
    [['2025-01', '2025-04', '2025-07'], 'trimestral'],
    [['2025-03', '2025-04'], 'trimestral'],
    [['2024-05', '2025-05'], 'anual'],
    [['2023-11', '2024-11', '2025-11'], 'anual'],
    [['2025-01', '2025-07'], 'puntual'],
    [['2025-02', '2025-02', '2026-06'], 'puntual']
  ])('%j → %s', (mesos, esperada) => {
    expect(cadenciaDe(mesos)).toBe(esperada);
  });

  test('l\'ordre no importa', () => {
    expect(cadenciaDe(['2025-07', '2025-01', '2025-04'])).toBe('trimestral');
  });
});

describe('aprenProveidors', () => {
  test('agrupa per NIF encara que el nom s\'escriga diferent', () => {
    const registre = aprenProveidors([
      despesa('Exemple Assessoria SL', CIF_ASSESSORIA, 2025, 11),
      despesa('EXEMPLE ASSESSORIA, S.L.', CIF_ASSESSORIA, 2026, 2),
      despesa('Exemple Assessoria SL', CIF_ASSESSORIA, 2026, 5)
    ], { cataleg: [] });
    expect(registre).toHaveLength(1);
    expect(registre[0]).toMatchObject({
      clau: 'exemple-assessoria',
      nom: 'Exemple Assessoria SL',
      nif: CIF_ASSESSORIA,
      mesosVistos: ['2025-11', '2026-02', '2026-05'],
      cadencia: 'trimestral',
      ivaHabitual: 21,
      ultimaDescripcio: 'Servei 5/2026',
      nombreFactures: 3,
      dominis: [],
      patronsFitxer: []
    });
    expect(registre[0].paraulesText).toEqual(['Exemple Assessoria SL', 'EXEMPLE ASSESSORIA, S.L.']);
  });

  test('sense NIF agrupa pel nom, i un NIF posterior s\'hi afig', () => {
    const registre = aprenProveidors([
      despesa('Exemple Ferreteria SL', '', 2026, 1),
      despesa('Exemple Ferreteria, S.L.', CIF_FERRETERIA, 2026, 2)
    ], { cataleg: [] });
    expect(registre).toHaveLength(1);
    /* format-fiscal-03: dues compres a la ferreteria ja no la fan «mensual». */
    expect(registre[0]).toMatchObject({ nif: CIF_FERRETERIA, mesosVistos: ['2026-01', '2026-02'], cadencia: 'puntual' });
  });

  test('amb dues mostres no se sobreescriu la cadència del catàleg; amb tres, sí', () => {
    const amazon = (m, d) => despesa('Amazon', '', 2026, m, { data: { a: 2026, m, d } });
    expect(perClau(aprenProveidors([amazon(1, 10), amazon(3, 20)])).amazon).toMatchObject({
      mesosVistos: ['2026-01', '2026-03'], cadencia: 'puntual'
    });
    expect(perClau(aprenProveidors([amazon(1, 10), amazon(2, 10), amazon(3, 20)])).amazon.cadencia).toBe('mensual');
    /* Sense cadència al catàleg, la de les mostres. */
    expect(perClau(aprenProveidors([despesa('Apple', '', 2026, 1), despesa('Apple', '', 2026, 3), despesa('Apple', '', 2026, 5)])).apple.cadencia)
      .toBe('bimestral');
  });

  test('el mateix nom amb NIF diferents són dos proveïdors amb claus úniques', () => {
    const registre = aprenProveidors([
      despesa('Exemple Ferreteria SL', CIF_FERRETERIA, 2026, 1),
      despesa('Exemple Ferreteria SL', CIF_ALTRA, 2026, 2)
    ], { cataleg: [] });
    expect(registre.map((p) => p.clau).sort()).toEqual(['exemple-ferreteria', 'exemple-ferreteria-2']);
    expect(registre.map((p) => p.nif).sort()).toEqual([CIF_FERRETERIA, CIF_ALTRA].sort());
  });

  test('un NIF invàlid no fa d\'identitat: agrupa pel nom', () => {
    const registre = aprenProveidors([
      despesa('Exemple Ferreteria SL', 'B00000001', 2026, 1),
      despesa('Exemple Ferreteria SL', 'B11111111', 2026, 4)
    ], { cataleg: [] });
    expect(validaNif('B00000001').valid).toBe(false);
    expect(validaNif('B11111111').valid).toBe(false);
    expect(registre).toHaveLength(1);
    expect(registre[0].nif).toBeNull();
  });

  test('només les despeses, i mai els NIF propis', () => {
    const registre = aprenProveidors([
      crearFactura({ tipus: 'ingres', data: { a: 2026, m: 1, d: 5 }, num: 'F26 0001', contrapart: 'Exemple Client SL', nif: CIF_ALTRA }),
      despesa('Titular Exemple', CIF_PROPI, 2026, 1),
      despesa('Exemple Ferreteria SL', CIF_FERRETERIA, 2026, 1),
      null,
      despesa('', '', 2026, 1)
    ], { cataleg: [], nifsPropis: [`ES${CIF_PROPI}`] });
    expect(registre.map((p) => p.clau)).toEqual(['exemple-ferreteria']);
  });

  test('fusiona amb el catàleg per NIF i porta les entrades no vistes', () => {
    const registre = aprenProveidors([
      despesa('SOM ENERGIA SCCL', NIF_SOM_ENERGIA, 2026, 1, { subtotal: 5000, iva: 250, total: 5250 }),
      despesa('SOM ENERGIA SCCL', NIF_SOM_ENERGIA, 2026, 2, { subtotal: 5000, iva: 250, total: 5250 })
    ]);
    const p = perClau(registre);
    expect(p['som-energia']).toMatchObject({
      nom: 'SOM ENERGIA SCCL',
      nif: NIF_SOM_ENERGIA,
      dominis: ['somenergia.coop'],
      cadencia: 'mensual',
      ivaHabitual: 5,
      mesosVistos: ['2026-01', '2026-02']
    });
    expect(p['som-energia'].patronsFitxer.length).toBeGreaterThan(0);
    expect(p['som-energia'].paraulesText).toContain('Som Energia');
    /* Les del catàleg no vistes hi són, sense mesos. */
    expect(p.adobe).toMatchObject({ mesosVistos: [], nombreFactures: 0, cadencia: 'mensual', nif: 'IE6364992H' });
    expect(registre[0].clau).toBe('som-energia');
    expect(new Set(registre.map((x) => x.clau)).size).toBe(registre.length);
  });

  test('fusiona amb el catàleg pel nom quan no hi ha NIF', () => {
    const p = perClau(aprenProveidors([despesa('Lowi', '', 2026, 3)]));
    expect(p.lowi).toMatchObject({ nom: 'Lowi', nif: 'A80907397', mesosVistos: ['2026-03'], nombreFactures: 1 });
    expect(p.lowi.dominis).toContain('lowi.es');
  });

  test('un NIF que contradiu el del catàleg no fusiona', () => {
    const p = perClau(aprenProveidors([despesa('Lowi', CIF_ALTRA, 2026, 3)]));
    expect(p.lowi.mesosVistos).toEqual([]);
    /* La clau del catàleg queda per a l'entrada del catàleg; l'apresa en pren una altra. */
    expect(p['lowi-2']).toMatchObject({ nif: CIF_ALTRA, dominis: [], mesosVistos: ['2026-03'] });
  });

  test('dues empreses que casen amb la mateixa entrada del catàleg: la segona pren «clau-2»', () => {
    const p = perClau(aprenProveidors([
      despesa('Amazon Exemple Un SL', CIF_FERRETERIA, 2026, 1),
      despesa('Amazon Exemple Dos SL', CIF_ALTRA, 2026, 2)
    ]));
    expect(p.amazon).toMatchObject({ nif: CIF_FERRETERIA, mesosVistos: ['2026-01'] });
    expect(p['amazon-2']).toMatchObject({ nif: CIF_ALTRA, mesosVistos: ['2026-02'] });
    expect(p['amazon-2'].dominis).toContain('amazon.es');
  });

  test('amb una sola observació, la cadència del catàleg; si no n\'hi ha, puntual', () => {
    const p = perClau(aprenProveidors([
      despesa('Som Energia', NIF_SOM_ENERGIA, 2026, 3),
      despesa('Exemple Ferreteria SL', CIF_FERRETERIA, 2026, 3)
    ]));
    expect(p['som-energia'].cadencia).toBe('mensual');
    expect(p['exemple-ferreteria'].cadencia).toBe('puntual');
  });

  test('IVA habitual: el més repetit, arrimat al tipus conegut', () => {
    const registre = aprenProveidors([
      despesa('Exemple Ferreteria SL', CIF_FERRETERIA, 2026, 1, { subtotal: 1000, iva: 210, total: 1210 }),
      despesa('Exemple Ferreteria SL', CIF_FERRETERIA, 2026, 2, { subtotal: 333, iva: 70, total: 403 }),
      despesa('Exemple Ferreteria SL', CIF_FERRETERIA, 2026, 4, { subtotal: 1000, iva: 100, total: 1100 }),
      despesa('Exemple Ferreteria SL', CIF_FERRETERIA, 2026, 5, { subtotal: null, iva: null, total: null })
    ], { cataleg: [] });
    expect(registre[0].ivaHabitual).toBe(21);
  });

  test('l\'última descripció és la de la factura amb data més recent', () => {
    const registre = aprenProveidors([
      despesa('Exemple Ferreteria SL', CIF_FERRETERIA, 2026, 5, { descripcio: 'Cargols' }),
      despesa('Exemple Ferreteria SL', CIF_FERRETERIA, 2026, 2, { descripcio: 'Martell' }),
      despesa('Exemple Ferreteria SL', CIF_FERRETERIA, 2026, 3, { data: null, descripcio: 'Sense data' })
    ], { cataleg: [] });
    expect(registre[0].ultimaDescripcio).toBe('Cargols');
  });

  test('sense historial: només el catàleg; amb cataleg buit, res', () => {
    expect(aprenProveidors([]).every((p) => p.mesosVistos.length === 0)).toBe(true);
    expect(aprenProveidors(null, { cataleg: [] })).toEqual([]);
  });
});

describe('NIF alternatius, país i números vistos (G3T-12, G3T-04)', () => {
  /* Un grup fictici: la factura la fa una societat i el rebut el passa una altra del mateix grup. */
  const CATALEG = [{
    clau: 'exemple-grup', nom: 'Exemple Grup SA', nif: CIF_ASSESSORIA, nifsAlternatius: [CIF_FERRETERIA], pais: 'ES',
    dominis: ['example.com'], patronsFitxer: [], patronsNum: [], paraulesText: ['Exemple Grup'], cadencia: 'mensual', ivaHabitual: 21
  }];

  test('aprenProveidors agrupa el NIF alternatiu amb el principal i el fusiona amb el catàleg', () => {
    const registre = aprenProveidors([
      despesa('Exemple Grup SA', CIF_ASSESSORIA, 2026, 1, { num: 'G-0001' }),
      despesa('Exemple Grup Serveis SLU', CIF_FERRETERIA, 2026, 2, { num: 'g 0002' })
    ], { cataleg: CATALEG });
    expect(registre).toHaveLength(1);
    expect(registre[0]).toMatchObject({
      clau: 'exemple-grup', nif: CIF_ASSESSORIA, nifsAlternatius: [CIF_FERRETERIA], pais: 'ES',
      mesosVistos: ['2026-01', '2026-02'], numerosVistos: ['G 0002', 'G-0001'], nombreFactures: 2
    });
  });

  test('només amb el NIF alternatiu també fusiona; el catàleg sense vistos porta els alternatius', () => {
    const p = perClau(aprenProveidors([despesa('Exemple Grup Serveis SLU', CIF_FERRETERIA, 2026, 2)], { cataleg: CATALEG }));
    expect(p['exemple-grup']).toMatchObject({ nif: CIF_ASSESSORIA, nifsAlternatius: [CIF_FERRETERIA], mesosVistos: ['2026-02'] });
    expect(aprenProveidors([], { cataleg: CATALEG })[0]).toMatchObject({ nifsAlternatius: [CIF_FERRETERIA], numerosVistos: [] });
  });

  test('identificaProveidor reconeix el NIF alternatiu i descarta un tercer NIF', () => {
    const registre = aprenProveidors([], { cataleg: CATALEG });
    expect(identificaProveidor({ nif: CIF_FERRETERIA }, registre)).toMatchObject({ puntuacio: 100, proveidor: { clau: 'exemple-grup' } });
    expect(identificaProveidor({ nif: `ES${CIF_ASSESSORIA}` }, registre)).toMatchObject({ puntuacio: 100 });
    expect(identificaProveidor({ nif: CIF_ALTRA, nom: 'Exemple Grup' }, registre)).toBeNull();
  });

  test('un proveïdor de l’historial que només té el NIF alternatiu també el reconeix', () => {
    const registre = aprenProveidors([despesa('Exemple Grup SA', CIF_ASSESSORIA, 2026, 1)], { cataleg: CATALEG });
    expect(identificaProveidor({ nif: CIF_FERRETERIA }, registre)?.proveidor.clau).toBe('exemple-grup');
  });

  test('el país: el del catàleg o, si no n’hi ha, el del NIF', () => {
    const p = perClau(aprenProveidors([
      despesa('Exemple Cloud Ltd', 'IE7000001TA', 2026, 1),
      despesa('Exemple Ferreteria SL', CIF_FERRETERIA, 2026, 1),
      despesa('Exemple Sense NIF', '', 2026, 1)
    ], { cataleg: [] }));
    expect(p['exemple-cloud'].pais).toBe('IE');
    expect(p['exemple-ferreteria'].pais).toBe('ES');
    expect(p['exemple-sense-nif'].pais).toBeNull();
    expect(perClau(aprenProveidors([])).adobe.pais).toBe('IE');
  });

  test('paisDelNif: espanyol per la forma, estranger pel prefix d’IVA conegut, null si no se sap', () => {
    expect(paisDelNif(CIF_FERRETERIA)).toBe('ES');
    expect(paisDelNif(`ES-${CIF_FERRETERIA}`)).toBe('ES');
    expect(paisDelNif('B00000001')).toBe('ES');
    expect(paisDelNif('ie 7000001 ta')).toBe('IE');
    expect(paisDelNif('GB700000001')).toBe('GB');
    expect(paisDelNif('CHE-700.000.001')).toBe('CH');
    for (const nif of ['', null, undefined, 'NO NIF', 'ZZ7000001', '70-0000001', 'ESX7']) expect(paisDelNif(nif), String(nif)).toBeNull();
  });
});

describe('identificaProveidor', () => {
  const registre = aprenProveidors([
    despesa('Exemple Assessoria SL', CIF_ASSESSORIA, 2026, 1),
    despesa('Som Energia', NIF_SOM_ENERGIA, 2026, 1)
  ]);
  const clau = (r) => r?.proveidor?.clau ?? null;

  test('per NIF (amb prefix ES o sense)', () => {
    expect(identificaProveidor({ nif: CIF_ASSESSORIA }, registre)).toMatchObject({ puntuacio: 100 });
    expect(clau(identificaProveidor({ nif: `ES-${CIF_ASSESSORIA}` }, registre))).toBe('exemple-assessoria');
  });

  test('per domini, correu o subdomini', () => {
    const r = identificaProveidor({ domini: 'factures@somenergia.coop' }, registre);
    expect(r).toMatchObject({ puntuacio: 90 });
    expect(clau(r)).toBe('som-energia');
    expect(clau(identificaProveidor({ domini: 'clients.lowi.es' }, registre))).toBe('lowi');
  });

  test('pel nom: igual (80) o començant per una paraula coneguda (65)', () => {
    expect(identificaProveidor({ nom: 'EXEMPLE ASSESSORIA, S.L.' }, registre)).toMatchObject({ puntuacio: 80 });
    const r = identificaProveidor({ nom: 'Lowi Mòbil Exemple' }, registre);
    expect(clau(r)).toBe('lowi');
    expect(r.puntuacio).toBe(65);
  });

  test('pel nom del fitxer (50)', () => {
    const r = identificaProveidor({ nomFitxer: '2026_2T/lowi_abril.pdf' }, registre);
    expect(clau(r)).toBe('lowi');
    expect(r.puntuacio).toBe(50);
  });

  test('diversos senyals sumen 5 cadascun', () => {
    expect(identificaProveidor({ domini: 'lowi.es', nomFitxer: 'lowi_abril.pdf' }, registre).puntuacio).toBe(95);
    expect(identificaProveidor({ nif: NIF_SOM_ENERGIA, nom: 'Som Energia', domini: 'somenergia.coop' }, registre).puntuacio).toBe(100);
  });

  test('un NIF vàlid diferent descarta el proveïdor', () => {
    expect(identificaProveidor({ nif: CIF_ALTRA, nom: 'Som Energia' }, registre)).toBeNull();
    /* Un NIF invàlid no descarta res. */
    expect(clau(identificaProveidor({ nif: 'B00000001', nom: 'Som Energia' }, registre))).toBe('som-energia');
  });

  test('sense senyals, sense coincidència o sense registre: null', () => {
    expect(identificaProveidor({}, registre)).toBeNull();
    expect(identificaProveidor(null, registre)).toBeNull();
    expect(identificaProveidor({ nom: 'Exemple Desconegut SL', domini: 'example.org' }, registre)).toBeNull();
    expect(identificaProveidor({ nif: CIF_ASSESSORIA }, null)).toBeNull();
  });

  test('en un empat guanya el proveïdor vist a l\'historial', () => {
    const base = { nif: null, patronsFitxer: [], paraulesText: [], dominis: ['example.com'] };
    const nou = { ...base, clau: 'nou', nom: 'Nou', mesosVistos: [] };
    const vist = { ...base, clau: 'vist', nom: 'Vist', mesosVistos: ['2026-01'] };
    expect(clau(identificaProveidor({ domini: 'example.com' }, [nou, vist]))).toBe('vist');
    expect(clau(identificaProveidor({ domini: 'example.com' }, [vist, nou]))).toBe('vist');
  });
});
