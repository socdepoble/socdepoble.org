// @vitest-environment node
/* Gestoria · documents · pla de neteja. Proposa i simula; mai mou ni esborra.
   Les proves de §3.5 del MAPA: un dubtós o un desconegut mai és candidat, cap
   proposta abans de la data mínima, els protegits mai, la quarantena no
   caduca amb el rellotge, un duplicat només proposa la còpia i tot és
   idempotent. Dades sintètiques: rutes genèriques i sha256 de lletres. */
import { describe, expect, test } from 'vitest';
import { CATALEG_TIPUS, DATES_BASE } from './catalegTipus.js';
import {
  ACCIONS, CARPETA_ARXIU, PAPERERA, codiConfirmacio, confirmacioNecessaria, confirmacioValida, dataMinimaEsborrat,
  planificaNeteja, simulaNeteja
} from './plaNeteja.js';

const SHA_A = 'a'.repeat(64);
const SHA_C = 'c'.repeat(64);
const AVUI = { a: 2026, m: 10, d: 4 };
const VALIDATS = { avui: AVUI, terminisValidats: true };
const CANDIDATES = ['quarantena', 'proposa-esborrat'];

/* Una factura rebuda del 2018 sense bases negatives: es pot esborrar a partir del 31/12/2025. */
const factura = (extra = {}) => ({
  ruta: 'despeses/2018/f_001.pdf',
  carpetaMestra: '_gestoria_de_poble',
  tipus: 'factura-rebuda',
  sha256: SHA_A,
  dates: { data: { a: 2018, m: 3, d: 15 } },
  fets: { basesNegatives: false },
  ...extra
});

/* Els dos fets que la persona ha de dir expressament abans de cap trasllat a la paperera. */
const SABUT = Object.freeze({ expedientObert: false, llegitPelRepositori: false });

/* A la paperera, amb tot el que cal per a proposar-ne l'esborrat definitiu. */
const aLaPaperera = (doc) => ({
  ...doc, estat: 'quarantena', dataQuarantena: AVUI, copiaSeguretat: true, expedientObert: false, llegitPelRepositori: false
});

const congela = (x) => {
  if (x && typeof x === 'object') {
    Object.values(x).forEach(congela);
    Object.freeze(x);
  }
  return x;
};

const entrada = (doc, opcions = VALIDATS) => planificaNeteja([doc], opcions).entrades[0];

/* Totes les dates base al 1990 i tots els fets que complixen les condicions del tipus. */
const TOT_PASSAT = Object.fromEntries(Object.values(DATES_BASE).map((b) => [b.camp, { a: 1990, m: 1, d: 1 }]));
const fetsQueComplixen = (t) => Object.fromEntries(t.conservacio.filter((r) => r.regla === 'condicio').map((r) => [r.fet, r.valor]));

describe('quan es pot esborrar', () => {
  test('la factura: 6 anys des del 31 de desembre de l’any següent; 10 si no se sap si hi ha bases negatives', () => {
    expect(dataMinimaEsborrat('factura-rebuda', { dates: { data: { a: 2018, m: 3, d: 15 } }, fets: { basesNegatives: false } }).data)
      .toEqual({ a: 2025, m: 12, d: 31 });
    // Un fet desconegut compta com a cert: el termini més llarg.
    expect(dataMinimaEsborrat('factura-rebuda', { dates: { data: '2018-03-15' } }).data).toEqual({ a: 2029, m: 12, d: 31 });
  });

  test('el 29 de febrer passa a l’1 de març en un any que no és bixest, mai abans', () => {
    const polissa = (fiVigencia) => dataMinimaEsborrat('polissa-asseguranca', { dates: { fiVigencia }, fets: { dePersones: false } }).data;
    expect(polissa({ a: 2024, m: 2, d: 29 })).toEqual({ a: 2026, m: 3, d: 1 });
    expect(dataMinimaEsborrat('titol-propietat', { dates: { fiVigencia: { a: 2024, m: 2, d: 29 } } }).data).toEqual({ a: 2028, m: 2, d: 29 });
  });

  test('regles fixes, dates que falten, documents vigents i condicions', () => {
    expect(dataMinimaEsborrat('llibre-verifactu')).toMatchObject({ regla: 'mai', data: null });
    expect(dataMinimaEsborrat('mostra-salut')).toMatchObject({ regla: 'persona', data: null });
    expect(dataMinimaEsborrat('codi-antic')).toMatchObject({ regla: 'arxiu', data: null });
    expect(dataMinimaEsborrat('factura-emesa', { dates: {} })).toMatchObject({ regla: 'calculada', data: null, falten: ['data'] });
    expect(dataMinimaEsborrat('document-identitat', { dates: {} })).toMatchObject({ data: null, falten: [], vigent: ['fiVigencia'] });
    expect(dataMinimaEsborrat('informe-vida-laboral').condicions).toEqual([{ fet: 'teMesNou', valor: true, complida: false }]);
    expect(dataMinimaEsborrat('tipus-estrany')).toMatchObject({ regla: 'mai' });
  });
});

describe('cap proposta abans de la data mínima', () => {
  test('el dia abans es conserva; el mateix dia es trasllada a la paperera', () => {
    const abans = entrada(factura(), { avui: { a: 2025, m: 12, d: 30 }, terminisValidats: true });
    expect(abans).toMatchObject({ accio: 'conserva', esPotEsborrarDesDe: '2025-12-31' });
    expect(abans.motius).toEqual(['es pot esborrar a partir del 31/12/2025 (a verificar amb la gestoria)']);
    const dia = entrada(factura(SABUT), { avui: { a: 2025, m: 12, d: 31 }, terminisValidats: true });
    expect(dia).toMatchObject({ accio: 'quarantena', a: `${PAPERERA}/251231/_gestoria_de_poble/despeses/2018/f_001.pdf` });
  });

  test('C3 · mentre la gestoria no valide els terminis, no es proposa res que en depenga', () => {
    for (const opcions of [{ avui: AVUI }, { avui: AVUI, terminisValidats: 'true' }, { avui: { a: 2090, m: 1, d: 1 } }]) {
      const e = entrada(factura(), opcions);
      expect(e.accio, JSON.stringify(opcions)).toBe('conserva');
      expect(e.motius[0]).toMatch(/a verificar amb la gestoria: no es proposa res/);
      expect(e.esPotEsborrarDesDe).toBe('2025-12-31');
    }
    // El que no depén d'un termini (una condició complida) sí que es pot proposar.
    const informe = { ruta: 'ss/vida_laboral_vell.pdf', tipus: 'informe-vida-laboral', fets: { teMesNou: true }, ...SABUT };
    expect(entrada(informe, { avui: AVUI }).accio).toBe('quarantena');
  });

  test('sense la data d’avui no hi ha pla', () => {
    for (const avui of [undefined, null, '', 'demà', { a: 2026, m: 2, d: 30 }]) {
      expect(() => planificaNeteja([factura()], { avui }), String(avui)).toThrow(RangeError);
    }
  });
});

describe('fail-closed', () => {
  const lluny = { avui: { a: 2090, m: 1, d: 1 }, terminisValidats: true };

  test('un document dubtós o desconegut mai es proposa per a esborrar, ni dins de la paperera', () => {
    const dubtosos = [
      factura({ revisa: true }),
      factura({ tipus: 'desconegut' }),
      factura({ tipus: 'factura' }),
      factura({ tipus: undefined }),
      aLaPaperera(factura({ revisa: true })),
      aLaPaperera(factura({ tipus: 'desconegut' }))
    ];
    for (const e of planificaNeteja(dubtosos, lluny).entrades) expect(e.accio).toBe('revisa');
  });

  test('si falta la data que fixa el termini, «revisa\'l»; si falta la de fi, encara és vigent', () => {
    expect(entrada(factura({ dates: {} }))).toMatchObject({ accio: 'revisa' });
    expect(entrada(factura({ dates: {} })).motius).toEqual(['falta la data del document per a saber quan es pot esborrar']);
    const polissa = { ruta: 'casa/polissa_llar.pdf', tipus: 'polissa-asseguranca', dates: {} };
    expect(entrada(polissa)).toMatchObject({ accio: 'conserva', motius: ['encara és vigent: no hi ha la data de fi de la vigència o de la titularitat'] });
  });

  test('rutes que pugen de carpeta, absolutes o buides, i estats estranys: «revisa\'l»', () => {
    for (const extra of [
      { ruta: '../fora.pdf' }, { ruta: '/abs/f.pdf' }, { ruta: 'C:\\f.pdf' }, { ruta: 'a//b.pdf' }, { ruta: '' }, { ruta: 42 },
      { carpetaMestra: 'a/b' }, { carpetaMestra: '..' }, { estat: 'esborrat' }
    ]) {
      expect(entrada(factura(extra), lluny).accio, JSON.stringify(extra)).toBe('revisa');
    }
  });

  test('una còpia que llig el repositori o un expedient obert no es toquen mai', () => {
    expect(entrada(factura({ llegitPelRepositori: true }), lluny).accio).toBe('conserva');
    expect(entrada(factura({ expedientObert: true }), lluny).accio).toBe('conserva');
    expect(entrada(aLaPaperera(factura({})), lluny).accio).toBe('proposa-esborrat');
    expect(entrada({ ...aLaPaperera(factura()), expedientObert: true }, lluny).accio).toBe('conserva');
  });

  test('un fet que no se sap val com a «sí»: cap trasllat a la paperera fins que la persona diga que no', () => {
    const e = entrada(factura(), lluny);
    expect(e).toMatchObject({ accio: 'conserva', a: null });
    expect(e.motius).toEqual(['cal dir que no hi ha cap expedient obert', 'cal dir que cap prova del repositori la llig']);
    expect(entrada(factura({ expedientObert: false }), lluny).motius).toEqual(['cal dir que cap prova del repositori la llig']);
    expect(entrada(factura({ llegitPelRepositori: false }), lluny).motius).toEqual(['cal dir que no hi ha cap expedient obert']);
    expect(entrada(factura(SABUT), lluny).accio).toBe('quarantena');
    // El classificador no sap mai si el repositori llig una còpia: el pla no en trasllada cap.
    const original = { ruta: 'a/fitxa.webloc', tipus: 'enllac', sha256: SHA_A };
    const copia = { ruta: 'b/fitxa.webloc', tipus: 'duplicat-exacte', original: 'a/fitxa.webloc', sha256: SHA_A };
    for (const e2 of planificaNeteja([original, copia], lluny).entrades) expect(CANDIDATES).not.toContain(e2.accio);
  });
});

describe('tipus protegits', () => {
  const lluny = { avui: { a: 2090, m: 1, d: 1 }, terminisValidats: true };

  test('un protegit «sempre» mai és candidat: com a molt, es pot arxivar', () => {
    const sempre = CATALEG_TIPUS.filter((t) => t.protegit === 'sempre');
    expect(sempre.length).toBeGreaterThan(8);
    for (const t of sempre) {
      for (const estat of ['viu', 'arxivat', 'quarantena']) {
        const doc = aLaPaperera({ ruta: `p/${t.id}.pdf`, tipus: t.id, sha256: SHA_A, dates: TOT_PASSAT, fets: fetsQueComplixen(t) });
        const e = entrada({ ...doc, estat }, lluny);
        expect(CANDIDATES, `${t.id} (${estat})`).not.toContain(e.accio);
        expect(['conserva', 'arxiva', 'revisa'], `${t.id} (${estat})`).toContain(e.accio);
        if (estat !== 'viu') expect(e.accio, `${t.id} (${estat})`).not.toBe('arxiva');
      }
    }
    expect(entrada({ ruta: 'id/dni_caducat.pdf', tipus: 'document-identitat', dates: TOT_PASSAT }, lluny))
      .toMatchObject({ accio: 'arxiva', a: `${CARPETA_ARXIU}/id/dni_caducat.pdf` });
  });

  test('un protegit fins al venciment es pot traslladar quan vence, i esborrar-lo demana confirmació escrita', () => {
    const e = entrada(aLaPaperera(factura()), VALIDATS);
    expect(e).toMatchObject({ accio: 'proposa-esborrat', confirmacio: 'escrita', codiConfirmacio: 'AAAA-AAAA' });
    const rebut = {
      ruta: 'banc/justificant.pdf', tipus: 'rebut-pagament', sha256: SHA_C, dates: { data: { a: 2018, m: 1, d: 1 } }, fets: { basesNegatives: false }
    };
    expect(entrada(aLaPaperera(rebut), VALIDATS)).toMatchObject({ accio: 'proposa-esborrat', confirmacio: 'dos-passos', codiConfirmacio: null });
  });

  test('confirmacioNecessaria i confirmacioValida: escrita per als protegits, cap per als que no s’esborren mai', () => {
    for (const t of CATALEG_TIPUS) {
      expect(confirmacioNecessaria(t.id), t.id).toBe(t.protegit === 'no' ? 'dos-passos' : 'escrita');
    }
    expect(codiConfirmacio(SHA_C)).toBe('CCCC-CCCC');
    expect(codiConfirmacio('no és un sha')).toBeNull();
    expect(confirmacioValida('factura-rebuda', SHA_C, { text: ' cccc cccc ' })).toBe('escrita');
    expect(confirmacioValida('factura-rebuda', SHA_C, { text: 'CCCC-CCCD' })).toBeNull();
    expect(confirmacioValida('factura-rebuda', SHA_C, { passos: 2 })).toBeNull();
    expect(confirmacioValida('rebut-pagament', SHA_C, { passos: 2 })).toBe('dos-passos');
    expect(confirmacioValida('rebut-pagament', SHA_C, { passos: 1 })).toBeNull();
    expect(confirmacioValida('rebut-pagament', 'curt', { passos: 2 })).toBeNull();
    for (const id of ['llibre-verifactu', 'expedient-marca', 'plantilla-en-blanc', 'desconegut', 'tipus-estrany']) {
      expect(confirmacioValida(id, SHA_C, { text: 'CCCC-CCCC', passos: 2 }), id).toBeNull();
    }
  });
});

describe('la quarantena no caduca sola', () => {
  test('amb el rellotge a +10 anys no s’esborra res: com a molt, es proposa i espera una persona', () => {
    const docs = [aLaPaperera(factura()), { ...aLaPaperera(factura({ ruta: 'despeses/2018/f_002.pdf' })), copiaSeguretat: undefined }];
    const opcions = { avui: { a: 2036, m: 10, d: 4 }, terminisValidats: true };
    const { pla, documents, moviments } = simulaNeteja(docs, opcions);
    expect(pla.entrades.map((e) => e.accio)).toEqual(['proposa-esborrat', 'conserva']);
    expect(pla.entrades[1].motius).toEqual(['falta la còpia de seguretat (3-2-1)']);
    expect(pla.entrades[0].confirmacio).toBe('escrita');
    expect(moviments).toEqual([]);
    expect(documents).toEqual(docs);
  });

  test('a la paperera, cada comprovació que falta es diu', () => {
    const e = entrada({ ...factura(), estat: 'quarantena', dataQuarantena: AVUI, sha256: undefined });
    expect(e.accio).toBe('conserva');
    expect(e.motius).toEqual([
      "falta l'empremta sha256 per al rebut",
      'falta la còpia de seguretat (3-2-1)',
      'cal dir que no hi ha cap expedient obert',
      'cal dir que cap prova del repositori la llig'
    ]);
    expect(e.de).toBe(`${PAPERERA}/261004/_gestoria_de_poble/despeses/2018/f_001.pdf`);
  });
});

describe('duplicats', () => {
  const original = { ruta: 'a/fitxa.webloc', tipus: 'enllac', sha256: SHA_A };
  const copia = { ruta: 'b/fitxa.webloc', tipus: 'duplicat-exacte', original: 'a/fitxa.webloc', sha256: SHA_A, ...SABUT };

  test('es proposa la còpia, mai l’original', () => {
    const [eOriginal, eCopia] = planificaNeteja([original, copia], { avui: AVUI }).entrades;
    expect(eOriginal.accio).toBe('conserva');
    expect(eCopia).toMatchObject({ accio: 'quarantena', a: `${PAPERERA}/261004/b/fitxa.webloc` });
  });

  test('sense l’original al pla, o si l’original també se’n va, la còpia es queda', () => {
    expect(entrada({ ...copia, fets: { originalConservat: true } }, { avui: AVUI }).accio).toBe('conserva');
    const originalQueSenVa = { ...original, ...SABUT, fets: { serveiDonatDeBaixa: true } };
    const [eOriginal, eCopia] = planificaNeteja([originalQueSenVa, copia], { avui: AVUI }).entrades;
    expect(eOriginal.accio).toBe('quarantena');
    expect(eCopia.accio).toBe('conserva');
    expect(eCopia.motius).toEqual(["es podrà quan es conserva l'original"]);
  });

  test('no es creu l’etiqueta: el sha256 de la còpia ha de ser el de l’original, o «revisa\'l»', () => {
    const diferent = planificaNeteja([original, { ...copia, sha256: SHA_C }], { avui: AVUI }).entrades[1];
    expect(diferent.accio).toBe('revisa');
    expect(diferent.motius).toEqual(["diu que és un duplicat, però el seu sha256 no és el de l'original: revisa'l"]);
    expect(planificaNeteja([original, { ...copia, sha256: undefined }], { avui: AVUI }).entrades[1].accio).toBe('revisa');
    expect(planificaNeteja([{ ...original, sha256: undefined }, copia], { avui: AVUI }).entrades[1].accio).toBe('revisa');
    // Majúscules o minúscules, la mateixa empremta.
    expect(planificaNeteja([original, { ...copia, sha256: SHA_A.toUpperCase() }], { avui: AVUI }).entrades[1].accio).toBe('quarantena');
    // Una factura protegida amb una «còpia» mal etiquetada: mai es proposa esborrar-la amb dos passos.
    const falsaCopia = aLaPaperera({
      ruta: 'despeses/2018/f_001 copia.pdf', carpetaMestra: '_gestoria_de_poble', tipus: 'duplicat-exacte', original: 'despeses/2018/f_001.pdf', sha256: SHA_C
    });
    const lluny = { avui: { a: 2090, m: 1, d: 1 }, terminisValidats: true };
    expect(planificaNeteja([factura(), falsaCopia], lluny).entrades[1]).toMatchObject({ accio: 'revisa', confirmacio: null });
  });

  test('una còpia que llig el repositori no és mai candidata', () => {
    expect(planificaNeteja([original, { ...copia, llegitPelRepositori: true }], { avui: AVUI }).entrades[1].accio).toBe('conserva');
  });
});

describe('idempotència i simulació', () => {
  const lot = () => congela([
    factura(SABUT),
    factura({ ruta: 'despeses/2026/f_009.pdf', dates: { data: { a: 2026, m: 1, d: 10 } } }),
    { ruta: 'eines/prototip.py', carpetaMestra: '_gestoria_de_poble', tipus: 'codi-antic' },
    { ruta: 'id/dni_caducat.pdf', tipus: 'document-identitat', dates: { fiVigencia: { a: 2019, m: 5, d: 1 } } },
    { ruta: 'x/document.pdf', tipus: 'desconegut', revisa: true },
    { ruta: 'a/fitxa.webloc', tipus: 'enllac', sha256: SHA_A },
    { ruta: 'b/fitxa.webloc', tipus: 'duplicat-exacte', original: 'a/fitxa.webloc', sha256: SHA_A, ...SABUT }
  ]);

  test('el mateix pla dues vegades, sense tocar l’entrada; cada acció és de la llista tancada', () => {
    const docs = lot();
    const primer = planificaNeteja(docs, VALIDATS);
    expect(planificaNeteja(docs, VALIDATS)).toEqual(primer);
    expect(primer.entrades.map((e) => e.accio)).toEqual(['quarantena', 'conserva', 'arxiva', 'arxiva', 'revisa', 'conserva', 'quarantena']);
    for (const e of primer.entrades) expect(ACCIONS).toContain(e.accio);
    expect(primer.resum).toEqual({ conserva: 2, revisa: 1, arxiva: 2, quarantena: 2, 'proposa-esborrat': 0 });
    expect(primer).toMatchObject({ avui: '2026-10-04', terminisValidats: true });
  });

  test('la simulació diu de on a on, i simular-la una altra vegada no proposa cap trasllat nou', () => {
    const primera = simulaNeteja(lot(), VALIDATS);
    expect(primera.moviments).toEqual([
      { accio: 'quarantena', de: '_gestoria_de_poble/despeses/2018/f_001.pdf', a: `${PAPERERA}/261004/_gestoria_de_poble/despeses/2018/f_001.pdf` },
      { accio: 'arxiva', de: '_gestoria_de_poble/eines/prototip.py', a: `_gestoria_de_poble/${CARPETA_ARXIU}/eines/prototip.py` },
      { accio: 'arxiva', de: 'id/dni_caducat.pdf', a: `${CARPETA_ARXIU}/id/dni_caducat.pdf` },
      { accio: 'quarantena', de: 'b/fitxa.webloc', a: `${PAPERERA}/261004/b/fitxa.webloc` }
    ]);
    expect(primera.documents).toHaveLength(7);
    const segona = simulaNeteja(primera.documents, VALIDATS);
    expect(segona.moviments).toEqual([]);
    expect(segona.documents).toEqual(primera.documents);
    // Cap document desapareix mai: la simulació no esborra.
    expect(segona.documents.map((d) => d.ruta)).toEqual(lot().map((d) => d.ruta));
  });
});
