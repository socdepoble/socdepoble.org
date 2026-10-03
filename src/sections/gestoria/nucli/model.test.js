// @vitest-environment node
/* Gestoria · nucli · model: la Factura (valors per defecte, id estable,
   normalització de noms, duplicats, incidències, estat, ordre i totals).
   Empreses fictícies i CIF sintètics. */
import { describe, expect, test } from 'vitest';
import {
  CAMPS_OBLIGATORIS, CODIS_INCIDENCIA, TIPUS_IRPF_HABITUALS, clauDuplicat, crearFactura, estatFactura, hashFnv1a, idEstable,
  normalitzaNom, numeroCompacte, ordenaFactures, totals, validaFactura
} from './model.js';
import { rangTrimestre } from './dates.js';

const CIF_A = 'A12345674';
/* Un CIF de lletra B calculat ací (control amb xifra). */
function cifB(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  return `B${xifres}${(10 - ((parells + senars) % 10)) % 10}`;
}
const CIF_B = cifB('7654321');

const completa = (canvis = {}) => crearFactura({
  tipus: 'despesa',
  data: { a: 2026, m: 4, d: 15 },
  num: 'F-1',
  contrapart: 'Exemple Energia SCCL',
  nif: CIF_A,
  descripcio: 'Subministrament',
  subtotal: 10000,
  iva: 2100,
  total: 12100,
  origen: { fitxer: 'factures/f-1.pdf', metode: 'pdf' },
  ...canvis
});

describe('hashFnv1a', () => {
  test('vectors de referència de FNV-1a 64', () => {
    expect(hashFnv1a('')).toBe('cbf29ce484222325');
    expect(hashFnv1a('a')).toBe('af63dc4c8601ec8c');
    expect(hashFnv1a('foobar')).toBe('85944171f73967e8');
  });

  test('UTF-8: els accents compten', () => {
    expect(hashFnv1a('plaça')).not.toBe(hashFnv1a('placa'));
    expect(hashFnv1a('plaça')).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('crearFactura', () => {
  test('valors per defecte', () => {
    const f = crearFactura();
    expect(f).toEqual({
      id: expect.stringMatching(/^f_[0-9a-f]{16}$/),
      tipus: 'despesa',
      data: null,
      num: '',
      contrapart: '',
      nif: '',
      descripcio: '',
      subtotal: null,
      iva: null,
      total: null,
      origen: { fitxer: null, metode: 'manual' },
      confianca: {},
      estat: 'pendent'
    });
    expect(crearFactura(null)).toEqual(f);
  });

  test('llig la data i els imports escrits', () => {
    const f = crearFactura({ data: '15/04/2026', subtotal: '1.234,56 €', iva: '259,26', total: '1.493,82 €', num: '  F-7 ', contrapart: `Exemple${String.fromCharCode(0xa0)}SL ` });
    expect(f.data).toEqual({ a: 2026, m: 4, d: 15 });
    expect([f.subtotal, f.iva, f.total]).toEqual([123456, 25926, 149382]);
    expect(f.num).toBe('F-7');
    expect(f.contrapart).toBe('Exemple SL');
  });

  test('imports que no són cèntims enters: null', () => {
    const f = crearFactura({ subtotal: 12.5, iva: 'res', total: Number.NaN });
    expect([f.subtotal, f.iva, f.total]).toEqual([null, null, null]);
  });

  test('tipus, mètode i confiança es netegen', () => {
    const f = crearFactura({ tipus: 'altre', origen: { metode: 'telepatia', sha256: 'ab12', fitxer: '' }, confianca: { num: 'alta', total: 'molta', iva: 'baixa' } });
    expect(f.tipus).toBe('despesa');
    expect(f.origen).toEqual({ fitxer: null, metode: 'manual', sha256: 'ab12' });
    expect(f.confianca).toEqual({ num: 'alta', iva: 'baixa' });
    expect(crearFactura({ tipus: 'ingres' }).tipus).toBe('ingres');
  });

  test('id estable: el mateix contingut, el mateix id', () => {
    expect(completa().id).toBe(completa().id);
    expect(completa().id).toBe(idEstable(completa()));
    expect(completa({ num: 'F-2' }).id).not.toBe(completa().id);
    expect(completa({ tipus: 'ingres' }).id).not.toBe(completa().id);
    expect(completa({ total: 12101 }).id).not.toBe(completa().id);
    expect(completa({ origen: { fitxer: 'altra.pdf', metode: 'pdf' } }).id).not.toBe(completa().id);
    expect(completa({ nif: 'a-12345674' }).id).toBe(completa().id);
    expect(completa({ descripcio: 'Una altra descripció' }).id).toBe(completa().id);
  });

  test('un id explícit es respecta', () => {
    expect(completa({ id: ' meu-id ' }).id).toBe('meu-id');
  });

  test('estat calculat, i un pendent explícit es respecta', () => {
    expect(completa().estat).toBe('completa');
    expect(completa({ estat: 'pendent' }).estat).toBe('pendent');
    expect(completa({ estat: 'completa', total: null }).estat).toBe('pendent');
  });

  test('retenció d’IRPF opcional: absent si no se’n diu res, en cèntims positius si sí', () => {
    expect(completa()).not.toHaveProperty('retencio');
    expect(crearFactura({ retencio: '-150,00 €' }).retencio).toBe(15000);
    expect(crearFactura({ retencio: '(150,00)' }).retencio).toBe(15000);
    expect(crearFactura({ retencio: '150,00' }).retencio).toBe(15000);
    expect(crearFactura({ retencio: 15000 }).retencio).toBe(15000);
    expect(crearFactura({ retencio: -15000 }).retencio).toBe(15000);
    expect(crearFactura({ retencio: 0 }).retencio).toBe(0);
    expect(crearFactura({ retencio: null }).retencio).toBeNull();
    expect(crearFactura({ retencio: 'res' }).retencio).toBeNull();
    expect(crearFactura({ retencio: 12.5 }).retencio).toBeNull();
  });

  test('la retenció no entra a l’id', () => {
    expect(completa({ retencio: 1500 }).id).toBe(completa().id);
  });

  test('els espais durs i prims valen com a espais als textos i a la data', () => {
    const [dur, estret, xifra, prim] = [0xa0, 0x202f, 0x2007, 0x2009].map((codi) => String.fromCharCode(codi));
    const f = crearFactura({ num: `${dur}F-7${estret}`, contrapart: `Exemple${xifra}Serveis${prim}SL`, data: `15${dur}abr${prim}2026` });
    expect(f.num).toBe('F-7');
    expect(f.contrapart).toBe('Exemple Serveis SL');
    expect(f.data).toEqual({ a: 2026, m: 4, d: 15 });
  });
});

describe('normalitzaNom', () => {
  test.each([
    ['Som Energia, SCCL', 'som energia'],
    ['Vodafone España S.A.U.', 'vodafone espana'],
    ['Exemple Energia S. L.', 'exemple energia'],
    ['Exemple Energia S.L.U.', 'exemple energia'],
    ['Exemple Serveis SL Unipersonal', 'exemple serveis'],
    ['Exemple Serveis, S.A.', 'exemple serveis'],
    ['Exemple S.Coop.V.', 'exemple'],
    ['Exemple S. Coop. V.', 'exemple'],
    ['Exemple Software S.à r.l.', 'exemple software'],
    ['Exemple Cloud EMEA Limited', 'exemple cloud emea'],
    ['Exemple Ltd.', 'exemple'],
    ['Exemple, Inc.', 'exemple'],
    ['Exemple LLC', 'exemple'],
    ['Exemple GmbH', 'exemple'],
    ['Exemple SARL', 'exemple'],
    ['Exemple B.V.', 'exemple'],
    ['Exemple Sociedad Limitada', 'exemple'],
    ['Col·lectiu Exemple', 'collectiu exemple'],
    ["L'Exemple del Poble", 'lexemple del poble'],
    ['  ÀÉÏÒÚ   Ç  ', 'aeiou c'],
    ['Exemple & Fills (Botiga)', 'exemple fills botiga']
  ])('«%s» → «%s»', (text, nom) => {
    expect(normalitzaNom(text)).toBe(nom);
  });

  test('mai buida un nom que només és un sufix', () => {
    expect(normalitzaNom('SL')).toBe('sl');
    expect(normalitzaNom('S.A.')).toBe('sa');
  });

  test('buit o absent', () => {
    expect(normalitzaNom('')).toBe('');
    expect(normalitzaNom(null)).toBe('');
    expect(normalitzaNom('...')).toBe('');
  });
});

describe('clauDuplicat', () => {
  test('amb NIF: el NIF normalitzat i el número sense espais en majúscules', () => {
    expect(clauDuplicat({ nif: 'es-a-12345674', num: ' f 001 ', contrapart: 'Qualsevol' })).toBe(`${CIF_A}|F001`);
  });

  test('sense NIF: el nom normalitzat', () => {
    expect(clauDuplicat({ contrapart: 'Exemple Energia, S.C.C.L.', num: 'a 1' })).toBe('exemple energia|A1');
    expect(clauDuplicat({ contrapart: 'Exemple Energia SCCL', num: 'A1' })).toBe(clauDuplicat({ contrapart: 'exemple energia', num: 'a1' }));
  });

  test('absent', () => {
    expect(clauDuplicat({})).toBe('|');
    expect(clauDuplicat(null)).toBe('|');
  });

  test('numeroCompacte és la part del número de la clau', () => {
    expect(numeroCompacte(' f 001 ')).toBe('F001');
    expect(numeroCompacte('x-0004')).toBe('X-0004');
    expect(numeroCompacte(null)).toBe('');
    expect(clauDuplicat({ nif: CIF_A, num: 'rh 0001' }).split('|')[1]).toBe(numeroCompacte('rh 0001'));
  });
});

describe('validaFactura', () => {
  test('una factura completa no té incidències', () => {
    expect(validaFactura(completa())).toEqual([]);
    expect(validaFactura(completa({ nif: CIF_B }))).toEqual([]);
  });

  test('CAMP_BUIT, un per camp obligatori, amb el fitxer i l’id', () => {
    const f = crearFactura({ origen: { fitxer: 'buida.pdf' } });
    const incidencies = validaFactura(f);
    expect(incidencies.map((i) => i.camp)).toEqual(CAMPS_OBLIGATORIS);
    for (const i of incidencies) expect(i).toMatchObject({ codi: 'CAMP_BUIT', severitat: 'mitjana', fitxer: 'buida.pdf', facturaId: f.id });
    expect(incidencies[2].missatge).toBe('Falta el proveïdor.');
    expect(validaFactura(crearFactura({ tipus: 'ingres' }))[2].missatge).toBe('Falta el client.');
  });

  test('una data invàlida o un import no enter compten com a buits', () => {
    const f = { ...completa(), data: { a: 2026, m: 2, d: 30 }, iva: 21.5 };
    expect(validaFactura(f).filter((i) => i.codi === 'CAMP_BUIT').map((i) => i.camp)).toEqual(['data', 'iva']);
  });

  test('IVA_INCOHERENT amb més d’un cèntim de diferència', () => {
    expect(validaFactura(completa({ total: 12101 }))).toEqual([]);
    expect(validaFactura(completa({ total: 12099 }))).toEqual([]);
    const [incidencia] = validaFactura(completa({ total: 12102 }));
    expect(incidencia).toMatchObject({ codi: 'IVA_INCOHERENT', severitat: 'alta' });
    expect(incidencia.missatge).toContain('121,00 €');
    expect(incidencia.missatge).toContain('121,02 €');
  });

  test.each([[10000, 0], [10000, 400], [10000, 500], [10000, 1000], [10000, 2100], [10000, 2150], [10000, 2059], [50, 11], [-10000, -2100], [3, 1]])(
    'subtotal %i i IVA %i: tipus habitual',
    (subtotal, iva) => {
      expect(validaFactura(completa({ subtotal, iva, total: subtotal + iva }))).toEqual([]);
    }
  );

  test.each([[10000, 1500, '15,0'], [10000, 800, '8,0'], [10000, -2100, '-21,0']])(
    'subtotal %i i IVA %i: TIPUS_IVA_INUSUAL (%s %)',
    (subtotal, iva, percentatge) => {
      const incidencies = validaFactura(completa({ subtotal, iva, total: subtotal + iva }));
      expect(incidencies).toEqual([expect.objectContaining({ codi: 'TIPUS_IVA_INUSUAL', severitat: 'baixa', missatge: `Tipus d'IVA inusual: ${percentatge} %.` })]);
    }
  );

  /* format-fiscal-01: el 22 % era abans un cas «baixa» d'esta taula. Per damunt
     del 21 % general (amb la tolerància de 0,6 punts) ja no és inusual sinó
     sospitós: sol ser la base i l'IVA llegits al revés. */
  test.each([[10000, 2200, '22,0'], [1736, 8264, '476,0'], [-1736, -8264, '476,0']])(
    'subtotal %i i IVA %i: per damunt del 21 %, TIPUS_IVA_INUSUAL alta i factura pendent (%s %)',
    (subtotal, iva, percentatge) => {
      const f = completa({ subtotal, iva, total: subtotal + iva });
      expect(validaFactura(f)).toEqual([expect.objectContaining({
        codi: 'TIPUS_IVA_INUSUAL',
        severitat: 'alta',
        missatge: `Tipus d'IVA del ${percentatge} %, per damunt del 21 % general: revisa si s'han llegit la base i l'IVA al revés.`
      })]);
      expect(f.estat).toBe('pendent');
    }
  );

  test('dins de la tolerància o a un cèntim del 21 %, cap incidència', () => {
    expect(validaFactura(completa({ subtotal: 10000, iva: 2159, total: 12159 }))).toEqual([]);
    expect(validaFactura(completa({ subtotal: 3, iva: 1, total: 4 }))).toEqual([]);
  });

  test('amb subtotal zero no es mira el tipus', () => {
    expect(validaFactura(completa({ subtotal: 0, iva: 0, total: 0 }))).toEqual([]);
  });

  test('NIF_INVALID', () => {
    const incidencies = validaFactura(completa({ nif: 'A12345675' }));
    expect(incidencies).toEqual([expect.objectContaining({ codi: 'NIF_INVALID', severitat: 'mitjana' })]);
    expect(incidencies[0].missatge).toContain('(CIF)');
    expect(validaFactura(completa({ nif: 'IE3668997OH' }))).toEqual([]);
  });

  test('FORA_TRIMESTRE només amb rang, extrems inclosos', () => {
    const rang = rangTrimestre(2026, 2);
    expect(validaFactura(completa(), { rang })).toEqual([]);
    expect(validaFactura(completa({ data: '01/04/2026' }), { rang })).toEqual([]);
    expect(validaFactura(completa({ data: '30/06/2026' }), { rang })).toEqual([]);
    const fora = validaFactura(completa({ data: '31/03/2026' }), { rang });
    expect(fora).toEqual([expect.objectContaining({ codi: 'FORA_TRIMESTRE', severitat: 'mitjana' })]);
    expect(fora[0].missatge).toBe('La data 31/03/2026 cau fora del període (01/04/2026 - 30/06/2026).');
    expect(validaFactura(completa({ data: '31/03/2026' }))).toEqual([]);
  });

  test('diverses incidències alhora', () => {
    const f = crearFactura({ data: '01/01/2026', num: 'X', contrapart: 'Exemple', nif: 'res', subtotal: 10000, iva: 1500, total: 99 });
    const codis = validaFactura(f, { rang: rangTrimestre(2026, 2) }).map((i) => i.codi);
    expect(codis).toEqual(['IVA_INCOHERENT', 'TIPUS_IVA_INUSUAL', 'NIF_INVALID', 'FORA_TRIMESTRE']);
  });

  test('l’ordre de les incidències és el de CODIS_INCIDENCIA', () => {
    const f = crearFactura({ data: '01/01/2026', num: 'X', contrapart: 'Exemple', nif: 'res', subtotal: 10000, iva: 1500, total: 99, retencio: 1500 });
    const codis = validaFactura(f, { rang: rangTrimestre(2026, 2) }).map((i) => i.codi);
    expect(codis).toEqual(['IVA_INCOHERENT', 'TIPUS_IVA_INUSUAL', 'NIF_INVALID', 'FORA_TRIMESTRE', 'RETENCIO_IRPF']);
    expect(codis).toEqual(CODIS_INCIDENCIA.filter((codi) => codis.includes(codi)));
  });
});

describe('retenció d’IRPF', () => {
  /* Base de 1.000 €, IVA del 21 % i retenció del 15 %: el total a cobrar és 1.060 €. */
  const professional = (canvis = {}) => completa({ subtotal: 100000, iva: 21000, total: 106000, retencio: 15000, ...canvis });
  const codisDe = (f) => validaFactura(f).map((i) => i.codi);
  const AVIS_FULL = 'El full de la gestoria no té columna de retenció: cal decidir com es declara.';

  test('constants', () => {
    expect(TIPUS_IRPF_HABITUALS).toEqual([7, 15, 19]);
    /* format-fiscal-02 hi afig MONEDA_ESTRANGERA, que validaFactura emet just després de CAMP_BUIT; G3T-R04,
       ABONAMENT, l'última. */
    expect(CODIS_INCIDENCIA).toEqual([
      'CAMP_BUIT', 'MONEDA_ESTRANGERA', 'IVA_INCOHERENT', 'TIPUS_IVA_INUSUAL', 'NIF_INVALID', 'FORA_TRIMESTRE', 'RETENCIO_IRPF',
      'ABONAMENT'
    ]);
    expect(Object.isFrozen(CODIS_INCIDENCIA)).toBe(true);
  });

  test('el total que descompta la retenció quadra, ± 1 cèntim, i la factura és completa', () => {
    for (const total of [106000, 106001, 105999]) expect(codisDe(professional({ total }))).toEqual(['RETENCIO_IRPF']);
    expect(professional().estat).toBe('completa');
  });

  test('el total sense descomptar la retenció també quadra', () => {
    expect(codisDe(professional({ total: 121000 }))).toEqual(['RETENCIO_IRPF']);
    expect(professional({ total: 121000 }).estat).toBe('completa');
  });

  test('RETENCIO_IRPF: informativa, amb l’import i el percentatge, sense dades de la contrapart', () => {
    const [incidencia] = validaFactura(professional());
    expect(incidencia).toMatchObject({ codi: 'RETENCIO_IRPF', severitat: 'info', camp: 'retencio', fitxer: 'factures/f-1.pdf' });
    expect(incidencia.missatge).toBe(`La factura porta una retenció d'IRPF de 150,00 € (15 % de la base) i el total ja la descompta. ${AVIS_FULL}`);
    expect(incidencia.missatge).not.toContain(CIF_A);
    expect(incidencia.missatge).not.toContain('Exemple');
    expect(validaFactura(professional({ total: 121000 }))[0].missatge).toContain('(15 % de la base) i el total no la descompta.');
  });

  test.each([
    ['7 %', 50000, 10500, 3500],
    ['19 %', 80000, 16800, 15200],
    ['7,5 %', 100000, 21000, 7500]
  ])('percentatge de la base: %s', (percentatge, subtotal, iva, retencio) => {
    const incidencies = validaFactura(professional({ subtotal, iva, retencio, total: subtotal + iva - retencio }));
    expect(incidencies.map((i) => i.codi)).toEqual(['RETENCIO_IRPF']);
    expect(incidencies[0].missatge).toContain(`(${percentatge} de la base) i el total ja la descompta.`);
  });

  test('sense subtotal no hi ha percentatge ni comprovació del total', () => {
    const incidencies = validaFactura(professional({ subtotal: null }));
    expect(incidencies.map((i) => i.codi)).toEqual(['CAMP_BUIT', 'RETENCIO_IRPF']);
    expect(incidencies[1].missatge).toBe(`La factura porta una retenció d'IRPF de 150,00 €. ${AVIS_FULL}`);
  });

  test('IVA_INCOHERENT si no quadra ni amb la retenció ni sense', () => {
    const f = professional({ total: 100000 });
    const incidencies = validaFactura(f);
    expect(incidencies.map((i) => i.codi)).toEqual(['IVA_INCOHERENT', 'RETENCIO_IRPF']);
    expect(incidencies[0]).toMatchObject({ severitat: 'alta' });
    expect(incidencies[0].missatge).toBe(
      "Ni subtotal + IVA (1.210,00 €) ni descomptant-ne la retenció d'IRPF (1.060,00 €) quadren amb el total (1.000,00 €). Pot ser un error de lectura."
    );
    expect(incidencies[1].missatge).toBe(`La factura porta una retenció d'IRPF de 150,00 € (15 % de la base). ${AVIS_FULL}`);
    expect(f.estat).toBe('pendent');
  });

  test('retenció zero, nul·la o absent: el comportament d’abans', () => {
    for (const retencio of [0, null, undefined]) {
      const incidencies = validaFactura(professional({ retencio }));
      expect(incidencies.map((i) => i.codi)).toEqual(['IVA_INCOHERENT']);
      expect(incidencies[0].missatge).toBe("Subtotal + IVA (1.210,00 €) no quadra amb el total (1.060,00 €). Pot ser una retenció d'IRPF o un error de lectura.");
    }
  });

  test('rectificativa amb retenció: amb la base negativa, la retenció hi suma', () => {
    const f = professional({ num: 'R-1', subtotal: -100000, iva: -21000, total: -106000 });
    expect(codisDe(f)).toEqual(['RETENCIO_IRPF']);
    expect(validaFactura(f)[0].missatge).toContain('(15 % de la base) i el total ja la descompta.');
    expect(f.estat).toBe('completa');
  });

  test('una retenció negativa posada a mà compta pel seu valor absolut', () => {
    const f = { ...professional(), retencio: -15000 };
    expect(codisDe(f)).toEqual(['RETENCIO_IRPF']);
    expect(estatFactura(f)).toBe('completa');
  });

  test('una retenció que no és un enter no compta', () => {
    const f = { ...professional(), retencio: '150,00' };
    expect(codisDe(f)).toEqual(['IVA_INCOHERENT']);
    expect(estatFactura(f)).toBe('pendent');
  });
});

describe('estatFactura', () => {
  test('completa només amb tot en regla', () => {
    expect(estatFactura(completa())).toBe('completa');
    expect(estatFactura({ ...completa(), num: '' })).toBe('pendent');
    expect(estatFactura({ ...completa(), total: 13000 })).toBe('pendent');
    expect(estatFactura({ ...completa(), nif: 'A12345675' })).toBe('pendent');
    expect(estatFactura({ ...completa(), confianca: { total: 'baixa' } })).toBe('pendent');
    expect(estatFactura({ ...completa(), confianca: { total: 'mitjana' } })).toBe('completa');
  });

  test('un tipus d’IVA inusual no la deixa pendent', () => {
    expect(estatFactura(completa({ subtotal: 10000, iva: 1500, total: 11500 }))).toBe('completa');
  });

  test('un tipus d’IVA per damunt del 21 % sí que la deixa pendent', () => {
    expect(estatFactura({ ...completa(), subtotal: 1736, iva: 8264, total: 10000 })).toBe('pendent');
    expect(estatFactura({ ...completa(), subtotal: 10000, iva: 2500, total: 12500 })).toBe('pendent');
  });

  test('una moneda que no és l’euro la deixa pendent; en euros, no', () => {
    expect(estatFactura({ ...completa(), moneda: 'USD' })).toBe('pendent');
    expect(estatFactura({ ...completa(), moneda: 'EUR' })).toBe('completa');
  });
});

describe('moneda (format-fiscal-02)', () => {
  test('crearFactura: absent és euros; el codi es normalitza; un valor que no és un codi ISO no passa per euros', () => {
    expect(completa()).not.toHaveProperty('moneda');
    expect(completa({ moneda: 'usd' }).moneda).toBe('USD');
    expect(completa({ moneda: ' EUR ' }).moneda).toBe('EUR');
    expect(completa({ moneda: '$' }).moneda).toBe('XXX');
    expect(completa({ moneda: null })).not.toHaveProperty('moneda');
    expect(completa({ moneda: '' })).not.toHaveProperty('moneda');
    expect(completa({ moneda: 'USD' }).id).toBe(completa().id);
  });

  test('MONEDA_ESTRANGERA: alta, demana els imports en euros i deixa la factura pendent', () => {
    const f = completa({ moneda: 'USD' });
    const incidencies = validaFactura(f);
    expect(incidencies).toEqual([{
      codi: 'MONEDA_ESTRANGERA',
      severitat: 'alta',
      camp: 'moneda',
      missatge: 'Els imports d’esta factura són en USD, i el full va en euros. Escriu-los en euros (l’import del càrrec al banc '
        + 'o el canvi oficial del dia de la factura, art. 79.Once de la Llei de l’IVA) i marca «Els imports ja són en euros».',
      fitxer: 'factures/f-1.pdf',
      facturaId: f.id
    }]);
    expect(f.estat).toBe('pendent');
    expect(validaFactura(completa({ moneda: '$' }))[0].missatge).toMatch(/^Els imports d’esta factura són en una moneda que no és l’euro, /);
  });

  test('en euros, explícits o absents, cap incidència', () => {
    expect(validaFactura(completa({ moneda: 'EUR' }))).toEqual([]);
    expect(completa({ moneda: 'EUR' }).estat).toBe('completa');
  });

  test('l’ordre: CAMP_BUIT, MONEDA_ESTRANGERA i la resta', () => {
    const f = crearFactura({ num: 'X', contrapart: 'Exemple', nif: CIF_A, subtotal: 10000, iva: 2100, total: 99, moneda: 'GBP' });
    const codis = validaFactura(f).map((i) => i.codi);
    expect(codis).toEqual(['CAMP_BUIT', 'MONEDA_ESTRANGERA', 'IVA_INCOHERENT']);
    expect(codis).toEqual(CODIS_INCIDENCIA.filter((codi) => codis.includes(codi)));
  });
});

/* G3T-R04: la Factura porta `abonament` i la persona sap per què els imports són negatius. */
describe('abonament', () => {
  const abonament = (canvis = {}) => completa({ abonament: true, subtotal: -10000, iva: -2100, total: -12100, ...canvis });

  test('crearFactura el conserva només si és true, i l’id no en depén', () => {
    expect(abonament().abonament).toBe(true);
    expect(completa()).not.toHaveProperty('abonament');
    expect(completa({ abonament: 'sí' })).not.toHaveProperty('abonament');
    expect(abonament().id).toBe(completa({ subtotal: -10000, iva: -2100, total: -12100 }).id);
  });

  test('ABONAMENT mitjana, amb el fitxer i la factura, mentre algun import és negatiu', () => {
    const f = abonament();
    const [i, ...resta] = validaFactura(f);
    expect(resta).toEqual([]);
    expect(i).toMatchObject({ codi: 'ABONAMENT', severitat: 'mitjana', fitxer: 'factures/f-1.pdf', facturaId: f.id });
    expect(i.missatge).toMatch(/negatiu/);
    expect(i.missatge).not.toContain('Exemple');
  });

  test('si la persona torna els imports a positiu, l’avís se’n va', () => {
    expect(validaFactura(abonament({ subtotal: 10000, iva: 2100, total: 12100 }))).toEqual([]);
    expect(validaFactura(completa({ subtotal: -10000, iva: -2100, total: -12100 }))).toEqual([]);
  });

  test('l’ordre: després de la retenció', () => {
    const codis = validaFactura(abonament({ retencio: 1500, total: -10600 })).map((i) => i.codi);
    expect(codis).toEqual(['RETENCIO_IRPF', 'ABONAMENT']);
    expect(codis).toEqual(CODIS_INCIDENCIA.filter((codi) => codis.includes(codi)));
  });
});

describe('ordenaFactures', () => {
  const f = (num, data) => crearFactura({ num, data });
  const llista = [f('F-10', '02/04/2026'), f('F-2', '02/04/2026'), f('Z', null), f('F-1', '15/05/2026'), f('A', '01/04/2026')];

  test('ascendent per data i número (xifres com a números), sense data al final', () => {
    expect(ordenaFactures(llista).map((x) => x.num)).toEqual(['A', 'F-2', 'F-10', 'F-1', 'Z']);
  });

  test('descendent, i sense data també al final', () => {
    expect(ordenaFactures(llista, 'desc').map((x) => x.num)).toEqual(['F-1', 'F-10', 'F-2', 'A', 'Z']);
  });

  test('no toca la llista original i accepta absents', () => {
    const copia = [...llista];
    ordenaFactures(llista);
    expect(llista).toEqual(copia);
    expect(ordenaFactures(null)).toEqual([]);
  });

  test('desempat determinista per id', () => {
    const a = crearFactura({ id: 'b', num: '1', data: '01/04/2026' });
    const b = crearFactura({ id: 'a', num: '1', data: '01/04/2026' });
    expect(ordenaFactures([a, b]).map((x) => x.id)).toEqual(['a', 'b']);
    expect(ordenaFactures([b, a], 'desc').map((x) => x.id)).toEqual(['a', 'b']);
  });
});

describe('totals', () => {
  test('suma en cèntims i avisa si falta algun import', () => {
    expect(totals([completa(), completa({ subtotal: 5000, iva: 1050, total: 6050 })])).toEqual({ subtotal: 15000, iva: 3150, total: 18150, incomplet: false });
    expect(totals([completa(), completa({ iva: null })])).toEqual({ subtotal: 20000, iva: 2100, total: 24200, incomplet: true });
  });

  test('llista buida', () => {
    expect(totals([])).toEqual({ subtotal: 0, iva: 0, total: 0, incomplet: false });
    expect(totals(null)).toEqual({ subtotal: 0, iva: 0, total: 0, incomplet: false });
  });
});
