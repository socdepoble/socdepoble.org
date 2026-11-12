import { describe, expect, test, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { ARBRES_MONUMENTALS_2020, FONT_CATALEG_ARBRES_2020 } from './arbresMonumentals2020.js';
import {
  ESQUEMA_DOCTORAL_ARBRES, FORMATS_FITXES_DOCTORALS, LIMIT_BYTES_FITXES_DOCTORALS,
  calculaDeltaBiometricArbre, creaFitxaDoctoralArbre, esMesuraDendrometricaValida,
  exportaFitxesDoctoralsArbres, importaFitxesDoctoralsArbres, slugRevisionsDoctoralsArbre, validaFitxaDoctoralArbre
} from './esquemaDoctoralArbres.js';
import { puntWgs84DesDUtmEtrs89 } from './georeferenciaDoctoralArbres.js';
import { escriuCsvDoctoral, lligCsvDoctoral } from './csvDoctoralArbres.js';

const arbre = ARBRES_MONUMENTALS_2020[0];
const fitxes = ARBRES_MONUMENTALS_2020.map(valor => creaFitxaDoctoralArbre(valor));
const clona = valor => JSON.parse(JSON.stringify(valor));
const revisio = (canvis = {}) => ({
  entitatTipus: 'arbre', entitatSlug: arbre.id, id: '7f859a12-b49c-4ce7-9362-e6c383a056d1',
  campanyaAny: 2026, versio: 1, estatConservacio: 'Inspecció registrada',
  mesures: { alcadaM: 23, perimetreNormalCm: 300 }, observacions: 'Mesura de camp amb font pròpia.',
  ...canvis
});
// Variant de procedència explícita R18a: les dades desconegudes són null,
// i el recompte d'exemplars no es transforma en peus d'un mateix arbre.
const arbreArbitrat = () => ({
  ...clona(arbre), sol: null, comunitatVegetal: null,
  paginesFont: { cataleg2007: null, edicio2020: null },
  dimensions2007: {
    ...clona(arbre.dimensions2007), exemplarsDelConjunt: 2,
    peusMenys130m: null, anyNaixencaAprox: null
  },
  conservacio2007: {
    estatSalut: arbre.conservacio2007.estatSalut, amenaces: null, mesuresPropostes: null
  },
  fotos: { ...clona(arbre.fotos), mapa: null }
});
const fontArbitrada = () => ({
  ...clona(FONT_CATALEG_ARBRES_2020), id: 'la-torre-de-les-macanes-2007-2020',
  documentFont: { cami: null, sha256: null, estat: 'Pendent de documentació de la font' },
  llicenciaAcreditadaPer: null
});

describe('perfil doctoral de patrimoni arbori', () => {
  test('organitza tots els camps originals dels 19 registres sense valors de camp afegits', () => {
    expect(fitxes).toHaveLength(19);
    for (let i = 0; i < fitxes.length; i += 1) {
      const actual = fitxes[i];
      const original = ARBRES_MONUMENTALS_2020[i];
      expect(actual.id).toBe(original.id);
      expect(actual.nom).toBe(original.nom);
      expect(actual.ordre).toBe(original.ordre);
      expect(actual.taxonomia.nomCientific).toBe(original.especieCientifica);
      expect(actual.taxonomia.nomComu).toBe(original.nomComu);
      expect(actual.georeferenciacio.utmEtrs89).toEqual(original.utmEtrs89);
      expect(actual.georeferenciacio.cadastre).toEqual(original.cadastre);
      for (const camp of ['paratge', 'orientacio', 'pendent', 'sol', 'comunitatVegetal']) {
        expect(actual.georeferenciacio[camp]).toBe(original[camp]);
      }
      expect(actual.biometria.base.dimensions).toEqual(original.dimensions2007);
      expect(actual.biometria.base.data).toBe('2007-05-19');
      for (const camp of ['descripcio', 'observacions']) expect(actual.avaluacio[camp]).toBe(original[camp]);
      expect(actual.avaluacio.estatSalut).toBe(original.conservacio2007.estatSalut);
      expect(actual.avaluacio.amenaces).toBe(original.conservacio2007.amenaces);
      expect(actual.avaluacio.mesuresPropostes).toBe(original.conservacio2007.mesuresPropostes);
      for (const camp of ['categoria', 'monumental', 'propietari', 'titularitatCief', 'accesLliure', 'acces']) {
        expect(actual.proteccio[camp]).toBe(original[camp]);
      }
      expect(actual.memoria.valorCulturalHistoric).toBe(original.valorCulturalHistoric);
      expect(actual.documentacio.fotos).toEqual(original.fotos);
      expect(actual.documentacio.urlOriginal).toBe(original.enllacOriginal2007);
      expect(actual.taxonomia.verificacio).toBeNull();
      expect(actual.georeferenciacio.bioclima).toBeNull();
      expect(actual.biometria.normaGranada).toBeNull();
      expect(actual.avaluacio.vta).toBeNull();
      expect(actual.memoria.fontOral).toBeNull();
      expect(actual.biometria.revisions).toEqual([]);
      /* Onada R20 · Catàleg 2.0.1 (Arbitratge R17.3): la fitxa porta la procedència de la font, ni més ni menys.
         Estes assercions eren de la base 2.0.0, que no en tenia; la forma sense procedència es prova ací baix. */
      expect(Object.hasOwn(actual.documentacio, 'paginesFont')).toBe(Object.hasOwn(original, 'paginesFont'));
      expect(actual.documentacio.paginesFont).toEqual(original.paginesFont);
      expect(Object.hasOwn(actual.biometria.base.dimensions, 'exemplarsDelConjunt'))
        .toBe(Object.hasOwn(original.dimensions2007, 'exemplarsDelConjunt'));
      for (const camp of ['documentFont', 'llicenciaAcreditadaPer']) {
        expect(Object.hasOwn(actual.font, camp)).toBe(Object.hasOwn(FONT_CATALEG_ARBRES_2020, camp));
        expect(actual.font[camp]).toEqual(FONT_CATALEG_ARBRES_2020[camp]);
      }
      expect(calculaDeltaBiometricArbre(actual)).toEqual([]);
    }
  });

  /* Onada R20 · La forma sense procedència (la de la base 2.0.0) continua coberta: si la font no porta els camps, la
     fitxa no els inventa, i el round-trip els conserva absents. */
  test.each(['jsonld', 'csv', 'geojson'])('una font sense camps de procedència no els inventa i fa round-trip en %s', format => {
    const fontSense = fontArbitrada();
    delete fontSense.documentFont;
    delete fontSense.llicenciaAcreditadaPer;
    const senseProcedencia = ARBRES_MONUMENTALS_2020.map(original => {
      const sense = clona(original);
      delete sense.paginesFont;
      delete sense.dimensions2007.exemplarsDelConjunt;
      return creaFitxaDoctoralArbre(sense, { font: fontSense });
    });
    for (const fitxa of senseProcedencia) {
      expect(Object.hasOwn(fitxa.documentacio, 'paginesFont')).toBe(false);
      expect(Object.hasOwn(fitxa.biometria.base.dimensions, 'exemplarsDelConjunt')).toBe(false);
      expect(Object.hasOwn(fitxa.font, 'documentFont')).toBe(false);
      expect(Object.hasOwn(fitxa.font, 'llicenciaAcreditadaPer')).toBe(false);
    }
    const serialitzat = exportaFitxesDoctoralsArbres(senseProcedencia, format);
    expect(importaFitxesDoctoralsArbres(serialitzat, format)).toEqual(senseProcedencia);
    expect(exportaFitxesDoctoralsArbres(importaFitxesDoctoralsArbres(serialitzat, format), format)).toBe(serialitzat);
  });

  test.each(['jsonld', 'csv', 'geojson'])('els 19 registres fan round-trip íntegre per %s', format => {
    const serialitzat = exportaFitxesDoctoralsArbres(fitxes, format);
    const restaurat = importaFitxesDoctoralsArbres(serialitzat, format);
    expect(restaurat).toEqual(fitxes);
    expect(exportaFitxesDoctoralsArbres(restaurat, format)).toBe(serialitzat);
    expect(Object.isFrozen(restaurat)).toBe(true);
    expect(Object.isFrozen(restaurat[0].georeferenciacio.utmEtrs89)).toBe(true);
  });

  test.each(['jsonld', 'csv', 'geojson'])('la variant arbitrada conserva absència, nulls i procedència en %s', format => {
    const raw = arbreArbitrat();
    const font = fontArbitrada();
    const actual = creaFitxaDoctoralArbre(raw, { font });
    expect(actual.georeferenciacio.sol).toBeNull();
    expect(actual.georeferenciacio.comunitatVegetal).toBeNull();
    expect(actual.avaluacio.amenaces).toBeNull();
    expect(actual.avaluacio.mesuresPropostes).toBeNull();
    expect(actual.documentacio.fotos.mapa).toBeNull();
    expect(actual.documentacio.paginesFont).toEqual(raw.paginesFont);
    expect(actual.biometria.base.dimensions).toEqual(raw.dimensions2007);
    expect(actual.font).toEqual(font);
    expect(Object.isFrozen(actual.documentacio.paginesFont)).toBe(true);
    expect(Object.isFrozen(actual.font.documentFont)).toBe(true);
    const serialitzat = exportaFitxesDoctoralsArbres([actual], format);
    expect(importaFitxesDoctoralsArbres(serialitzat, format)).toEqual([actual]);
    expect(exportaFitxesDoctoralsArbres(importaFitxesDoctoralsArbres(serialitzat, format), format)).toBe(serialitzat);
    // També es conserva la distinció entre cap recompte conegut i cap camp.
    raw.dimensions2007.exemplarsDelConjunt = null;
    raw.paginesFont = { cataleg2007: 62, edicio2020: 104 };
    raw.propietari = null;
    font.documentFont = {
      cami: '01_produccio/font-de-prova.pdf', sha256: 'a'.repeat(64), estat: 'Fixture de prova, no acreditació'
    };
    font.llicenciaAcreditadaPer = 'Referència documental de prova';
    const documentada = creaFitxaDoctoralArbre(raw, { font });
    expect(documentada.proteccio.propietari).toBeNull();
    expect(importaFitxesDoctoralsArbres(exportaFitxesDoctoralsArbres([documentada], format), format))
      .toEqual([documentada]);
  });

  test.each([
    valor => { valor.documentacio.paginesFont.extra = null; },
    valor => { valor.documentacio.paginesFont.cataleg2007 = 0; },
    valor => { valor.documentacio.paginesFont.edicio2020 = '104'; },
    valor => { valor.biometria.base.dimensions.exemplarsDelConjunt = -1; },
    valor => { valor.biometria.base.dimensions.exemplarsDelConjunt = 1.5; },
    valor => { valor.font.documentFont.sha256 = 'no-és-un-hash'; },
    valor => { valor.font.documentFont.extra = 'camp desconegut'; },
    valor => { valor.font.llicenciaAcreditadaPer = {}; },
    valor => { Object.setPrototypeOf(valor.documentacio.paginesFont, { extra: true }); }
  ])('les extensions conegudes mantenen tipus, límits i claus estrictes', canvia => {
    const actual = clona(creaFitxaDoctoralArbre(arbreArbitrat(), { font: fontArbitrada() }));
    canvia(actual);
    expect(() => validaFitxaDoctoralArbre(actual)).toThrow();
  });

  test('rebutja getters en extensions opcionals sense executar-los', () => {
    const getter = vi.fn(() => null);
    const raw = arbreArbitrat();
    Object.defineProperty(raw, 'paginesFont', { get: getter, enumerable: true });
    expect(() => creaFitxaDoctoralArbre(raw, { font: fontArbitrada() })).toThrow();
    const font = fontArbitrada();
    Object.defineProperty(font.documentFont, 'sha256', { get: getter, enumerable: true });
    expect(() => creaFitxaDoctoralArbre(arbreArbitrat(), { font })).toThrow();
    const actual = clona(creaFitxaDoctoralArbre(arbreArbitrat(), { font: fontArbitrada() }));
    Object.defineProperty(actual.biometria.base.dimensions, 'exemplarsDelConjunt', { get: getter, enumerable: true });
    expect(() => validaFitxaDoctoralArbre(actual)).toThrow();
    expect(getter).not.toHaveBeenCalled();
  });

  test('una foto de 2020 no crea cotes ni una inspecció VTA', () => {
    expect(fitxes[0].documentacio.fotos.dataFoto2020).toBe('2020-05-08');
    expect(fitxes[0].biometria.base.data).toBe('2007-05-19');
    expect(fitxes[0].biometria.revisions).toEqual([]);
    expect(fitxes[0].avaluacio.vta).toBeNull();
  });

  test('les cotes desconegudes del Cementeri continuen null', () => {
    const cementeri = fitxes[18];
    expect(cementeri.biometria.base.dimensions.alcadaM).toBeNull();
    expect(cementeri.biometria.base.dimensions.perimetreNormalCm).toBeNull();
    expect(cementeri.georeferenciacio.utmEtrs89.altitudM).toBeNull();
    expect(calculaDeltaBiometricArbre(cementeri)).toEqual([]);
  });

  test('un segon poble s’injecta en les dades i les identitats romanen distintes', () => {
    const altre = creaFitxaDoctoralArbre(arbre, {
      font: { ...FONT_CATALEG_ARBRES_2020, id: 'segon-poble', municipi: 'Poble de prova' }
    });
    for (const format of ['jsonld', 'csv', 'geojson']) {
      expect(importaFitxesDoctoralsArbres(exportaFitxesDoctoralsArbres([fitxes[0], altre], format), format))
        .toEqual([fitxes[0], altre]);
    }
    expect(altre.georeferenciacio.municipi).toBe('Poble de prova');
  });

  test('els slugs de campanya separen les fonts i conserven els DTO canònics de La Torre', () => {
    expect(slugRevisionsDoctoralsArbre(arbre.id)).toBe(arbre.id);
    expect(slugRevisionsDoctoralsArbre(arbre.id, 'la-torre-de-les-macanes-2007-2020')).toBe(arbre.id);
    const esperat = 'arbre-' + createHash('sha256')
      .update(JSON.stringify([ESQUEMA_DOCTORAL_ARBRES, 'segon-poble', arbre.id])).digest('hex');
    expect(slugRevisionsDoctoralsArbre(arbre.id, 'segon-poble')).toBe(esperat);
    expect(esperat).toMatch(/^arbre-[a-f0-9]{64}$/);
    const font = { ...FONT_CATALEG_ARBRES_2020, id: 'segon-poble', municipi: 'Poble de prova' };
    expect(() => creaFitxaDoctoralArbre(arbre, { font, revisions: [revisio()] })).toThrow();
    const altre = creaFitxaDoctoralArbre(arbre, { font, revisions: [revisio({ entitatSlug: esperat })] });
    for (const format of ['jsonld', 'csv', 'geojson']) {
      expect(importaFitxesDoctoralsArbres(exportaFitxesDoctoralsArbres([altre], format), format)).toEqual([altre]);
    }
  });

  test('manté l’ID i la versió de les revisions del port neutral i calcula diferències reals', () => {
    const actual = creaFitxaDoctoralArbre(arbre, { revisions: [revisio()] });
    expect(actual.biometria.revisions[0]).toEqual(revisio());
    expect(calculaDeltaBiometricArbre(actual)).toEqual([
      { camp: 'alcadaM', unitat: 'm', anyInicial: 2007, anyFinal: 2026, inicial: 22, final: 23, delta: 1 },
      { camp: 'perimetreNormalCm', unitat: 'cm', anyInicial: 2007, anyFinal: 2026, inicial: 295, final: 300, delta: 5 }
    ]);
    expect(importaFitxesDoctoralsArbres(exportaFitxesDoctoralsArbres([actual]))[0]).toEqual(actual);
  });

  test('una magnitud textual o negativa no passa a ser una cota mesurada', () => {
    const actual = creaFitxaDoctoralArbre(arbre, {
      revisions: [revisio({ mesures: { alcadaM: '23 m', perimetreNormalCm: -1, cavitats: 'revisar' } })]
    });
    expect(calculaDeltaBiometricArbre(actual)).toEqual([]);
  });

  test('les cotes genèriques fora de rang es conserven sense alimentar el Δ científic', () => {
    const actual = creaFitxaDoctoralArbre(arbre, {
      revisions: [revisio({ mesures: { alcadaM: Number.MAX_SAFE_INTEGER, diametreCapcadaM: -1 } })]
    });
    expect(calculaDeltaBiometricArbre(actual)).toEqual([]);
    expect(esMesuraDendrometricaValida('alcadaM', Number.MAX_SAFE_INTEGER)).toBe(false);
    expect(esMesuraDendrometricaValida('diametreCapcadaM', -1)).toBe(false);
    expect(esMesuraDendrometricaValida('constructor', 23)).toBe(false);
    expect(esMesuraDendrometricaValida('alcadaM', 23)).toBe(true);
    for (const format of ['jsonld', 'csv', 'geojson']) {
      expect(importaFitxesDoctoralsArbres(exportaFitxesDoctoralsArbres([actual], format), format)).toEqual([actual]);
    }
  });

  test.each([
    { campanyaAny: 0 }, { entitatTipus: 'llavor' }, { entitatSlug: 'altre-arbre' },
    { mesures: { alcadaM: {} } }, { versio: 0 }, { id: 'nou' }
  ])('rebutja revisions alienes o malformades %j', canvi => {
    expect(() => creaFitxaDoctoralArbre(arbre, { revisions: [revisio(canvi)] })).toThrow();
  });

  test('rebutja dos registres anuals o identitats duplicades', () => {
    expect(() => creaFitxaDoctoralArbre(arbre, { revisions: [revisio(), revisio()] })).toThrow();
    expect(() => creaFitxaDoctoralArbre(arbre, { revisions: [revisio(), revisio({ campanyaAny: 2025 })] })).toThrow();
    expect(() => exportaFitxesDoctoralsArbres([fitxes[0], fitxes[0]])).toThrow();
  });

  test('admet més de 500 campanyes vàlides del contracte anual', () => {
    const revisions = Array.from({ length: 501 }, (_, index) => revisio({
      campanyaAny: index + 1, id: '00000000-0000-0000-0000-' + String(index).padStart(12, '0')
    }));
    const actual = creaFitxaDoctoralArbre(arbre, { revisions });
    expect(actual.biometria.revisions).toHaveLength(501);
    expect(actual.biometria.revisions[0].campanyaAny).toBe(501);
    expect(importaFitxesDoctoralsArbres(exportaFitxesDoctoralsArbres([actual]))).toEqual([actual]);
  });

  test('la verificació taxonòmica, VTA, bioclima i valoració necessiten una font explícita', () => {
    const actual = creaFitxaDoctoralArbre(arbre, {
      verificacioTaxonomica: {
        nomAcceptat: 'Populus alba', familia: 'Salicaceae', ordre: 'Malpighiales',
        sistema: 'APG IV', font: 'https://example.org/determinacio', data: '2026-11-11', determinador: 'Mostra de prova'
      },
      bioclima: { termotip: 'prova', ombrotip: 'prova', periode: '2000–2025',
        estacio: 'Estació de prova', font: 'https://example.org/clima' },
      valoracioGranada: { data: '2026-11-11', tecnic: 'Tècnic de prova', edicio: '2020',
        valorEUR: 1234, metode: 'Valoració de prova', font: 'Informe de prova' },
      avaluacioVta: { data: '2026-11-11', observador: 'Tècnic de prova', cavitats: 'Pendent de sonda',
        risc: 'Informe de prova', mesures: 'Seguiment', metode: 'VTA', font: 'Informe de prova' },
      fontOral: { testimoni: 'Testimoni de prova', recollitPer: 'Arxiu de prova',
        data: '2026-11-11', referencia: 'Registre de prova' }
    });
    for (const format of ['jsonld', 'csv', 'geojson']) {
      expect(importaFitxesDoctoralsArbres(exportaFitxesDoctoralsArbres([actual], format), format)).toEqual([actual]);
    }
    const senseFont = clona(actual);
    senseFont.avaluacio.vta.font = '';
    expect(() => validaFitxaDoctoralArbre(senseFont)).toThrow();
  });
});

describe('frontera d’importació doctoral', () => {
  test.each(['jsonld', 'csv', 'geojson'])('el paquet buit és reversible en %s', format => {
    expect(importaFitxesDoctoralsArbres(exportaFitxesDoctoralsArbres([], format), format)).toEqual([]);
  });

  test('JSON-LD empra context fix, termes TDWG i un literal JSON del perfil', () => {
    const paquet = JSON.parse(exportaFitxesDoctoralsArbres([fitxes[0]]));
    expect(paquet.esquema).toBe(ESQUEMA_DOCTORAL_ARBRES);
    expect(paquet['@context'].fitxa['@type']).toBe('@json');
    expect(paquet['@graph'][0]['dwc:scientificName']).toBe('Populus alba');
    paquet['@context'] = 'https://example.org/context-remot';
    expect(() => importaFitxesDoctoralsArbres(JSON.stringify(paquet))).toThrow();
  });

  test('accepta claus JSON reordenades i rebutja una projecció contradictòria o amb tipus canviat', () => {
    const paquet = JSON.parse(exportaFitxesDoctoralsArbres([fitxes[0]]));
    paquet['@context'] = Object.fromEntries(Object.entries(paquet['@context']).reverse());
    expect(importaFitxesDoctoralsArbres(JSON.stringify(paquet))).toEqual([fitxes[0]]);
    paquet['@graph'][0]['dwc:scientificName'] = { text: 'Populus alba' };
    expect(() => importaFitxesDoctoralsArbres(JSON.stringify(paquet))).toThrow();
  });

  test.each([
    valor => { valor.taxonomia.nomComu = {}; },
    valor => { valor.georeferenciacio.utmEtrs89.x = '724718'; },
    valor => { valor.georeferenciacio.utmEtrs89.x = Infinity; },
    valor => { valor.biometria.base.data = '2007-02-31'; },
    valor => { valor.documentacio.urlOriginal = 'javascript:alert(1)'; },
    valor => { valor.documentacio.fotos.mapa = '/assets/../privat'; },
    valor => { valor.font.id = 'slug\n'; },
    valor => { valor.extra = 'camp desconegut'; },
    valor => { Object.defineProperty(valor, '__proto__', { value: {}, enumerable: true }); }
  ])('rebutja tipus, rutes o claus invàlids', canvia => {
    const valor = clona(fitxes[0]);
    canvia(valor);
    expect(() => validaFitxaDoctoralArbre(valor)).toThrow();
  });

  test('rebutja accessors abans de llegir valors de registre o opcions', () => {
    const getter = vi.fn(() => 'text');
    const raw = { ...arbre };
    Object.defineProperty(raw, 'nom', { get: getter, enumerable: true });
    expect(() => creaFitxaDoctoralArbre(raw)).toThrow();
    const opcions = {};
    Object.defineProperty(opcions, 'font', { get: getter, enumerable: true });
    expect(() => creaFitxaDoctoralArbre(arbre, opcions)).toThrow();
    const fitxa = clona(fitxes[0]);
    Object.defineProperty(fitxa.taxonomia, 'nomComu', { get: getter, enumerable: true });
    expect(() => validaFitxaDoctoralArbre(fitxa)).toThrow();
    expect(getter).not.toHaveBeenCalled();
  });

  test('acota bytes, registres i cadenes abans de projectar', () => {
    expect(() => importaFitxesDoctoralsArbres(' '.repeat(LIMIT_BYTES_FITXES_DOCTORALS + 1))).toThrow();
    expect(() => importaFitxesDoctoralsArbres('𐐀'.repeat(LIMIT_BYTES_FITXES_DOCTORALS / 4 + 1))).toThrow();
    expect(() => exportaFitxesDoctoralsArbres(Array(1001).fill(fitxes[0]))).toThrow();
    const valor = clona(fitxes[0]);
    valor.avaluacio.descripcio = 'x'.repeat(16001);
    expect(() => validaFitxaDoctoralArbre(valor)).toThrow();
  });

  test('CSV conserva salts, cometes, accents i fórmula com a text', () => {
    const raw = { ...arbre, especieCientifica: '=HYPERLINK("https://example.org")', nomComu: 'Text,\namb "cometes" 🌳' };
    const valor = creaFitxaDoctoralArbre(raw);
    const csv = exportaFitxesDoctoralsArbres([valor], 'csv');
    expect(csv).toContain("'=HYPERLINK");
    expect(importaFitxesDoctoralsArbres(csv, 'csv')).toEqual([valor]);
    expect(lligCsvDoctoral(csv, 2, 15)[1][2]).toBe("'=" + 'HYPERLINK("https://example.org")');
    expect(Number(lligCsvDoctoral(csv, 2, 15)[1][7])).toBeLessThan(0);
  });

  test.each([' =SUM(1)', '\n=SUM(1)', '\t@SUM(1)', '\r\n+SUM(1)'])('protegix fórmules darrere d’espai en blanc %j', nomComu => {
    const valor = creaFitxaDoctoralArbre({ ...arbre, nomComu });
    const csv = exportaFitxesDoctoralsArbres([valor], 'csv');
    expect(lligCsvDoctoral(csv, 2, 15)[1][3]).toBe("'" + nomComu);
    expect(importaFitxesDoctoralsArbres(csv, 'csv')).toEqual([valor]);
  });

  test.each(['a,"sense tancar', '"tancat"x', 'ca"mp', '"a""'])('CSV rebutja cometes incorrectes %s', text => {
    expect(() => lligCsvDoctoral(text, 10, 20)).toThrow();
  });

  test('CSV només restaura el perfil versionat amb totes les columnes coherents', () => {
    const csv = exportaFitxesDoctoralsArbres([fitxes[0]], 'csv');
    const files = lligCsvDoctoral(csv, 2, 15);
    files[1][2] = 'Taxó alterat';
    expect(() => importaFitxesDoctoralsArbres(escriuCsvDoctoral(files), 'csv')).toThrow();
    expect(() => importaFitxesDoctoralsArbres('scientificName\nPopulus alba', 'csv')).toThrow();
  });

  test('GeoJSON usa longitud i latitud WGS84 i conserva l’altitud al seu datum original', () => {
    const paquet = JSON.parse(exportaFitxesDoctoralsArbres([fitxes[0]], 'geojson'));
    const punt = paquet.features[0].geometry.coordinates;
    expect(punt).toHaveLength(2);
    expect(punt[0]).toBeGreaterThan(-1);
    expect(punt[0]).toBeLessThan(0);
    expect(punt[1]).toBeGreaterThan(38);
    expect(punt[1]).toBeLessThan(40);
    expect(paquet.features[0].properties.fitxa.georeferenciacio.utmEtrs89.altitudM).toBe(780);
    expect(paquet).not.toHaveProperty('crs');
    paquet.features[0].geometry.coordinates = [724718, 4276790];
    expect(() => importaFitxesDoctoralsArbres(JSON.stringify(paquet), 'geojson')).toThrow();
  });

  test('un arbre sense coordenades té geometria null i conserva les altres dades', () => {
    const valor = creaFitxaDoctoralArbre({ ...arbre, utmEtrs89: null });
    const text = exportaFitxesDoctoralsArbres([valor], 'geojson');
    expect(JSON.parse(text).features[0].geometry).toBeNull();
    expect(importaFitxesDoctoralsArbres(text, 'geojson')).toEqual([valor]);
  });

  test('la inversa GRS80 coincidix amb el control publicat de PROJ i el meridià central', () => {
    // https://proj.org/en/stable/operations/projections/utm.html, exemple 12°E 56°N.
    expect(puntWgs84DesDUtmEtrs89({ fus: 32, x: 687071.44, y: 6210141.33 })).toEqual([12, 56]);
    expect(puntWgs84DesDUtmEtrs89({ fus: 30, x: 500000, y: 0 })).toEqual([-3, 0]);
  });

  test('la citació acadèmica conserva l’autoria i DataCite queda en esborrany', () => {
    // La captura primària WP 619 conserva «Rodriguez», sense accent afegit.
    const autor = 'Pedro Ferrer Rodriguez (Enginyer Tècnic Forestal i Biòleg)';
    const promotora = 'Associació Cultural i Mediambiental El Rentonar (GVA núm. 4444 · Secció Primera)';
    expect(FONT_CATALEG_ARBRES_2020.autoriaTecnica).toBe(autor);
    expect(FONT_CATALEG_ARBRES_2020.entitatPromotora).toBe(promotora);
    const bib = exportaFitxesDoctoralsArbres(fitxes, 'bibtex');
    expect(bib.match(/@misc\{/g)).toHaveLength(19);
    expect(bib.split('\n').filter(linia => linia.startsWith('  author = ')))
      .toEqual(Array(19).fill('  author = {{' + autor + '} and {' + promotora + '}},'));
    expect(bib).toContain('year = {2020}');
    const cita = JSON.parse(exportaFitxesDoctoralsArbres(fitxes, 'datacite'));
    expect(cita.estat).toBe('esborrany');
    expect(cita.recursos).toHaveLength(19);
    for (const recurs of cita.recursos) {
      expect(recurs.creators).toEqual([{ name: autor }, { name: promotora, nameType: 'Organizational' }]);
      expect(recurs.alternateIdentifiers[0].alternateIdentifierType).toBe('URN');
      expect(recurs).not.toHaveProperty('doi');
    }
    expect(FORMATS_FITXES_DOCTORALS.map(v => v.id)).toEqual(['jsonld', 'csv', 'geojson', 'bibtex', 'datacite']);
  });

  test('les metadades bibliogràfiques no entren pel lector de paquets de dades', () => {
    expect(() => importaFitxesDoctoralsArbres('{}', 'datacite')).toThrow();
    expect(() => exportaFitxesDoctoralsArbres([], 'desconegut')).toThrow();
  });
});
