// @vitest-environment node
/* Gestoria · font · fontNavegador: les dues fonts de carpeta amb handles
   de File System Access i FileList simulats dins de la prova (cap fitxer ni
   carpeta reals), i un recorregut sencer fins al tractor de factures. */
import { describe, expect, test } from 'vitest';
import { creaAutenticadorSimulat } from '../../../../tests/helpers/autenticadorSimulat.js';
import { ErrorTractor, executaTractorFactures } from '../nucli/tractor.js';
import { TRACTOR_FACTURES } from '../tractors.js';
import { demanaCarpeta, fontDesDeFitxers, fontDesDeHandle, oblidaFont, potTriarCarpeta } from './fontNavegador.js';

const bytes = (text) => new TextEncoder().encode(text);
const text = (b) => new TextDecoder().decode(b);
const errorDe = (promesa) => promesa.then(() => null, (error) => error);
const MODIFICAT = Date.UTC(2026, 6, 31);

class Fitxer {
  constructor(nom, contingut, { fallaLectura = false, fallaEscriptura = false } = {}) {
    this.kind = 'file';
    this.name = nom;
    this.contingut = contingut;
    this.fallaLectura = fallaLectura;
    this.fallaEscriptura = fallaEscriptura;
    this.avortat = false;
  }

  async getFile() {
    if (this.fallaLectura) throw new DOMException('no es pot llegir', 'NotReadableError');
    const dades = this.contingut;
    return { size: dades.length, lastModified: MODIFICAT, arrayBuffer: async () => dades.slice().buffer };
  }

  async createWritable() {
    const fitxer = this;
    const parts = [];
    return {
      async write(d) {
        if (fitxer.fallaEscriptura) throw new DOMException('disc ple', 'QuotaExceededError');
        parts.push(d);
      },
      async close() {
        fitxer.contingut = new Uint8Array(parts.flatMap((p) => [...p]));
      },
      async abort() {
        fitxer.avortat = true;
      }
    };
  }
}

class Carpeta {
  constructor(nom, fills = {}, { permis = 'granted', permisDemanat = 'granted', fallaRecorregut = false } = {}) {
    this.kind = 'directory';
    this.name = nom;
    this.fills = new Map();
    this.permis = permis;
    this.permisDemanat = permisDemanat;
    this.fallaRecorregut = fallaRecorregut;
    this.consultes = 0;
    this.peticions = 0;
    for (const [clau, valor] of Object.entries(fills)) {
      this.fills.set(clau, valor instanceof Fitxer || valor instanceof Carpeta ? valor
        : valor instanceof Uint8Array ? new Fitxer(clau, valor)
          : typeof valor === 'string' ? new Fitxer(clau, bytes(valor)) : new Carpeta(clau, valor));
    }
  }

  async* entries() {
    if (this.fallaRecorregut) throw new DOMException('permís retirat', 'NotAllowedError');
    for (const parella of this.fills) yield parella;
  }

  async getDirectoryHandle(nom) {
    const fill = this.fills.get(nom);
    if (!fill || fill.kind !== 'directory') throw new DOMException('no hi és', 'NotFoundError');
    return fill;
  }

  async getFileHandle(nom, { create = false } = {}) {
    const fill = this.fills.get(nom);
    if (fill) {
      if (fill.kind !== 'file') throw new DOMException('és una carpeta', 'TypeMismatchError');
      return fill;
    }
    if (!create) throw new DOMException('no hi és', 'NotFoundError');
    const nou = new Fitxer(nom, new Uint8Array(0));
    this.fills.set(nom, nou);
    return nou;
  }

  async queryPermission() {
    this.consultes += 1;
    return this.permis;
  }

  async requestPermission() {
    this.peticions += 1;
    if (this.permisDemanat instanceof Error) throw this.permisDemanat;
    return this.permisDemanat;
  }
}

const arbre = (opcions) => new Carpeta('Facturacio', {
  '2026_3T': {
    'factura.pdf': '%PDF-1.7 sintetic',
    '7777777777.csv': 'Numero de factura,7777777777',
    '.DS_Store': 'x',
    '._factura.pdf': 'x',
    Gastos: { 'llum.pdf': 'llum', Fons: { 'antic.pdf': 'antic' } }
  },
  '.git': { config: 'x' },
  __MACOSX: { 'x.pdf': 'x' },
  'Thumbs.db': 'x',
  'llegeix-me.txt': 'hola'
}, opcions);

describe('potTriarCarpeta i demanaCarpeta', () => {
  test('detecta el selector', () => {
    expect(potTriarCarpeta({})).toBe(false);
    expect(potTriarCarpeta(null)).toBe(false);
    expect(potTriarCarpeta({ showDirectoryPicker() {} })).toBe(true);
  });

  test('demana la carpeta amb el mode i des de l\'entorn (this)', async () => {
    const handle = new Carpeta('Facturacio');
    const rebudes = [];
    const entorn = {
      showDirectoryPicker(opcions) {
        rebudes.push({ opcions, aquest: this });
        return Promise.resolve(handle);
      }
    };
    expect(await demanaCarpeta({ mode: 'readwrite', entorn })).toBe(handle);
    expect(rebudes).toEqual([{ opcions: { mode: 'readwrite' }, aquest: entorn }]);
  });

  test.each([
    ['AbortError', 'SELECCIO_CANCELLADA'],
    ['SecurityError', 'CAL_GEST'],
    ['NotAllowedError', 'CAL_GEST'],
    ['TypeError', 'SELECTOR_FALLIT']
  ])('%s → %s', async (nom, codi) => {
    const entorn = { showDirectoryPicker: () => Promise.reject(new DOMException('selector', nom)) };
    const error = await errorDe(demanaCarpeta({ entorn }));
    expect(error).toBeInstanceOf(ErrorTractor);
    expect(error.codi).toBe(codi);
    expect(error.cause.name).toBe(nom);
  });

  test('sense selector o amb un mode desconegut', async () => {
    expect(await errorDe(demanaCarpeta({ entorn: {} }))).toMatchObject({ codi: 'SELECTOR_NO_DISPONIBLE' });
    expect(await errorDe(demanaCarpeta({ mode: 'write', entorn: { showDirectoryPicker() {} } }))).toMatchObject({ codi: 'PARAMETRES_INVALIDS' });
  });
});

describe('fontDesDeHandle: lectura', () => {
  test('llista recursiva i ordenada, sense ocults ni fitxers del sistema', async () => {
    const font = fontDesDeHandle(arbre());
    expect(font.nom).toBe('Facturacio');
    const llista = await font.llista();
    expect(llista.map((e) => e.ruta)).toEqual([
      '2026_3T/7777777777.csv', '2026_3T/Gastos/Fons/antic.pdf', '2026_3T/Gastos/llum.pdf', '2026_3T/factura.pdf', 'llegeix-me.txt'
    ]);
    expect(llista[3]).toEqual({ ruta: '2026_3T/factura.pdf', mida: 17, modificat: MODIFICAT });
    expect(font.limitacions).toEqual([]);
  });

  test('límits de profunditat i de nombre de fitxers, i fitxers que no s\'obrin', async () => {
    const fonda = fontDesDeHandle(arbre(), { profunditat: 2 });
    expect((await fonda.llista()).map((e) => e.ruta)).not.toContain('2026_3T/Gastos/Fons/antic.pdf');
    expect(fonda.limitacions.map((l) => l.codi)).toEqual(['PROFUNDITAT_MAXIMA']);

    const curta = fontDesDeHandle(arbre(), { maxFitxers: 2 });
    expect(await curta.llista()).toHaveLength(2);
    expect(curta.limitacions.map((l) => l.codi)).toEqual(['MASSA_FITXERS']);

    const trencada = fontDesDeHandle(new Carpeta('F', { 'a.pdf': new Fitxer('a.pdf', bytes('a'), { fallaLectura: true }), 'b.pdf': 'b' }));
    expect((await trencada.llista()).map((e) => e.ruta)).toEqual(['b.pdf']);
    expect(trencada.limitacions).toEqual([{ codi: 'FITXER_ILLEGIBLE', missatge: "Un fitxer no s'ha pogut obrir i no es llista." }]);
  });

  test('també recorre amb values() quan no hi ha entries()', async () => {
    const interna = new Carpeta('sub', { 'b.pdf': 'b' });
    const handle = {
      kind: 'directory',
      name: 'Arrel',
      async* values() {
        yield new Fitxer('a.pdf', bytes('a'));
        yield interna;
      }
    };
    expect((await fontDesDeHandle(handle).llista()).map((e) => e.ruta)).toEqual(['a.pdf', 'sub/b.pdf']);
  });

  test('un recorregut que falla és FONT_ILLEGIBLE, mai l\'error cru', async () => {
    const error = await errorDe(fontDesDeHandle(new Carpeta('F', {}, { fallaRecorregut: true })).llista());
    expect(error).toBeInstanceOf(ErrorTractor);
    expect(error.codi).toBe('FONT_ILLEGIBLE');
  });

  test('llig els bytes d\'una ruta; rutes trampa, absents o massa grans són errors tipats', async () => {
    const font = fontDesDeHandle(arbre(), { midaMaxima: 10 });
    expect(text(await font.llig('2026_3T/Gastos/llum.pdf'))).toBe('llum');
    expect(await errorDe(font.llig('2026_3T/no-hi-es.pdf'))).toMatchObject({ codi: 'FITXER_ILLEGIBLE' });
    expect(await errorDe(font.llig('2026_3T/factura.pdf'))).toMatchObject({ codi: 'FITXER_MASSA_GRAN' });
    for (const ruta of ['../fora.pdf', '2026_3T/.DS_Store', '/abs.pdf', '2026_3T//x.pdf', '', 42]) {
      expect(await errorDe(font.llig(ruta)), String(ruta)).toMatchObject({ codi: 'RUTA_INVALIDA' });
    }
  });

  test('un handle que no és una carpeta: FONT_INVALIDA', () => {
    expect(() => fontDesDeHandle(new Fitxer('a.pdf', bytes('a')))).toThrow(expect.objectContaining({ codi: 'FONT_INVALIDA' }));
    expect(() => fontDesDeHandle(null)).toThrow(ErrorTractor);
  });
});

describe('fontDesDeHandle: escriptura', () => {
  const RUTA = '2026_3T/2026-FACTURACIO-Associacio_Titular_Exemple_-_3T.csv';

  test('amb el permís concedit escriu un fitxer nou, sense tornar a demanar-lo', async () => {
    const handle = arbre();
    const r = await fontDesDeHandle(handle).escriu(RUTA, bytes('a,b'));
    expect(r).toEqual({ ruta: RUTA, mida: 3, sobreescrit: false });
    expect(text((await handle.getDirectoryHandle('2026_3T')).fills.get(RUTA.split('/')[1]).contingut)).toBe('a,b');
    expect(handle.peticions).toBe(0);
  });

  test('si el permís no hi és, el demana; denegat o sense gest, no escriu res', async () => {
    const demanat = arbre({ permis: 'prompt' });
    await fontDesDeHandle(demanat).escriu('nou.xlsx', bytes('x'));
    expect(demanat.peticions).toBe(1);

    for (const permisDemanat of ['denied', new DOMException('cal un gest', 'SecurityError')]) {
      const handle = arbre({ permis: 'prompt', permisDemanat });
      const error = await errorDe(fontDesDeHandle(handle).escriu('nou.csv', bytes('x')));
      expect(error).toMatchObject({ name: 'ErrorTractor', codi: 'ESCRIPTURA_DENEGADA' });
      expect(handle.fills.has('nou.csv')).toBe(false);
    }
  });

  test('mai sobreescriu un fitxer existent sense { sobreescriu: true }', async () => {
    const handle = new Carpeta('F', { 'full.csv': 'vell' });
    const font = fontDesDeHandle(handle);
    expect(await errorDe(font.escriu('full.csv', bytes('nou')))).toMatchObject({ codi: 'FITXER_JA_EXISTEIX' });
    expect(await errorDe(font.escriu('full.csv', bytes('nou'), { sobreescriu: 'si' }))).toMatchObject({ codi: 'FITXER_JA_EXISTEIX' });
    expect(text(handle.fills.get('full.csv').contingut)).toBe('vell');
    expect(await font.escriu('full.csv', bytes('nou'), { sobreescriu: true })).toMatchObject({ sobreescrit: true });
    expect(text(handle.fills.get('full.csv').contingut)).toBe('nou');
  });

  test('només CSV i XLSX, només en carpetes que ja existixen i mai fora de la carpeta', async () => {
    const handle = arbre();
    const font = fontDesDeHandle(handle);
    expect(await errorDe(font.escriu('script.js', bytes('x')))).toMatchObject({ codi: 'ESCRIPTURA_NO_PERMESA' });
    expect(handle.consultes).toBe(0);
    expect(await errorDe(font.escriu('2027_1T/full.csv', bytes('x')))).toMatchObject({ codi: 'CARPETA_NO_TROBADA' });
    expect(handle.fills.has('2027_1T')).toBe(false);
    expect(await errorDe(font.escriu('../fora.csv', bytes('x')))).toMatchObject({ codi: 'RUTA_INVALIDA' });
    expect(await errorDe(font.escriu('2026_3T/Gastos', bytes('x')))).toMatchObject({ codi: 'ESCRIPTURA_NO_PERMESA' });
    expect(await errorDe(font.escriu('full.csv', 'no són bytes'))).toMatchObject({ codi: 'PARAMETRES_INVALIDS' });
  });

  test('si l\'escriptura falla, s\'avorta i es diu ESCRIPTURA_FALLIDA', async () => {
    const malalt = new Fitxer('full.csv', bytes('vell'), { fallaEscriptura: true });
    const font = fontDesDeHandle(new Carpeta('F', { 'full.csv': malalt }));
    const error = await errorDe(font.escriu('full.csv', bytes('nou'), { sobreescriu: true }));
    expect(error).toMatchObject({ name: 'ErrorTractor', codi: 'ESCRIPTURA_FALLIDA' });
    expect(malalt.avortat).toBe(true);
    expect(text(malalt.contingut)).toBe('vell');
  });

  test('sense API de permisos no hi ha escriu', () => {
    const handle = arbre();
    handle.queryPermission = undefined;
    expect(fontDesDeHandle(handle).escriu).toBeUndefined();
  });
});

describe('fontDesDeFitxers', () => {
  const fitxer = (webkitRelativePath, contingut, { name = webkitRelativePath.split('/').pop(), size } = {}) => {
    const dades = bytes(contingut);
    return { name, webkitRelativePath, size: size ?? dades.length, lastModified: MODIFICAT, arrayBuffer: async () => dades.slice().buffer };
  };
  const llistaDeFitxers = (fitxers) => Object.assign(Object.create(null), { length: fitxers.length }, fitxers);

  test('rutes sense la carpeta triada, ordenades i sense ocults; no escriu', async () => {
    const font = fontDesDeFitxers(llistaDeFitxers([
      fitxer('Facturacio/2026_3T/factura.pdf', 'pdf'),
      fitxer('Facturacio/2026_3T/.DS_Store', 'x'),
      fitxer('Facturacio/__MACOSX/2026_3T/._factura.pdf', 'x'),
      fitxer('Facturacio/2026_2T/full.csv', 'csv')
    ]));
    expect(font.nom).toBe('Facturacio');
    expect(font.escriu).toBeUndefined();
    expect(await font.llista()).toEqual([
      { ruta: '2026_2T/full.csv', mida: 3, modificat: MODIFICAT },
      { ruta: '2026_3T/factura.pdf', mida: 3, modificat: MODIFICAT }
    ]);
    expect(text(await font.llig('2026_3T/factura.pdf'))).toBe('pdf');
  });

  test('un File sense webkitRelativePath va a l\'arrel pel seu nom', async () => {
    const font = fontDesDeFitxers([fitxer('', 'a', { name: 'solt.pdf' })]);
    expect(font.nom).toBe('');
    expect((await font.llista()).map((e) => e.ruta)).toEqual(['solt.pdf']);
  });

  test('límits i errors tipats', async () => {
    const font = fontDesDeFitxers([
      fitxer('F/a.pdf', 'a'), fitxer('F/b.pdf', 'b'), fitxer('F/c.pdf', 'c', { size: 50 })
    ], { maxFitxers: 2, midaMaxima: 10 });
    expect((await font.llista()).map((e) => e.ruta)).toEqual(['a.pdf', 'b.pdf']);
    expect(font.limitacions.map((l) => l.codi)).toEqual(['MASSA_FITXERS']);
    expect(await errorDe(font.llig('c.pdf'))).toMatchObject({ codi: 'FITXER_ILLEGIBLE' });
    expect(await errorDe(font.llig('../a.pdf'))).toMatchObject({ codi: 'RUTA_INVALIDA' });
    const gran = fontDesDeFitxers([fitxer('F/c.pdf', 'c', { size: 50 })], { midaMaxima: 10 });
    expect(await errorDe(gran.llig('c.pdf'))).toMatchObject({ codi: 'FITXER_MASSA_GRAN' });
    expect(() => fontDesDeFitxers(null)).toThrow(expect.objectContaining({ codi: 'FONT_INVALIDA' }));
  });
});

describe('oblidaFont', () => {
  test('desenxufa: cap mètode torna a llegir ni a escriure', async () => {
    const handle = arbre();
    const font = fontDesDeHandle(handle);
    await font.llista();
    expect(oblidaFont(font)).toBe(true);
    expect(font.limitacions).toEqual([]);
    for (const crida of [() => font.llista(), () => font.llig('2026_3T/factura.pdf'), () => font.escriu('a.csv', bytes('x'))]) {
      expect(await errorDe(crida())).toMatchObject({ name: 'ErrorTractor', codi: 'FONT_OBLIDADA' });
    }
    expect(handle.fills.has('a.csv')).toBe(false);
    expect(oblidaFont(font)).toBe(false);
  });

  test('també la de fitxers; una font que no és d\'este mòdul torna false', async () => {
    const font = fontDesDeFitxers([{ name: 'a.pdf', webkitRelativePath: 'F/a.pdf', size: 1, lastModified: 0, arrayBuffer: async () => new ArrayBuffer(1) }]);
    expect(oblidaFont(font)).toBe(true);
    expect(await errorDe(font.llig('a.pdf'))).toMatchObject({ codi: 'FONT_OBLIDADA' });
    expect(oblidaFont({ llista() {} })).toBe(false);
    expect(oblidaFont(null)).toBe(false);
  });
});

describe('de la carpeta al tractor', () => {
  test('una carpeta triada amb el selector arriba a la proposta, i en acabar es desenxufa', async () => {
    const csv = [
      'Número de factura,7777777777',
      'Fecha de la factura,31 jul 2026',
      'Importe de la factura,"12,10 €"',
      'Descripción,Importe',
      'Servei,"10,00"',
      'Subtotal,"10,00"',
      'I.V.A. (21%),"2,10"',
      'Total,"12,10"'
    ].join('\n');
    const handle = new Carpeta('Facturacio', { '2026_3T': { '7777777777.csv': csv, '.DS_Store': 'x' } });
    const font = fontDesDeHandle(handle);
    const ara = Date.UTC(2026, 9, 2);
    const empremta = `sha256:${'ab'.repeat(32)}`;
    // El tractor exigix signatura: l'autenticador WebAuthn simulat la fa i la porta la verifica.
    const autenticador = await creaAutenticadorSimulat();
    const registre = await autenticador.signa({ manifest: TRACTOR_FACTURES, empremta, ara: ara - 1000 });
    const r = await executaTractorFactures({
      font, any: 2026, t: 3, aprovacio: {
        manifest: TRACTOR_FACTURES, empremta, registres: [registre], claus: autenticador.claus,
        origen: autenticador.origen, rpId: autenticador.rpId, ara
      }
    });
    expect(r.proposta.despeses).toHaveLength(1);
    expect(r.proposta.despeses[0]).toMatchObject({ num: '7777777777', total: 1210, origen: { fitxer: '2026_3T/7777777777.csv' } });
    expect(handle.fills.get('2026_3T').fills.size).toBe(2);
    expect(oblidaFont(font)).toBe(true);
  });
});
