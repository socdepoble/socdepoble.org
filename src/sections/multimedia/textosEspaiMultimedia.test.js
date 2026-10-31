// @vitest-environment node
/* Gauntlet 261029 (cicle 1, àrea i18n-a11y) · Els textos de /multimedia en
   cada llengua:
     · plurals-1-arxius: amb n = 1, cap «1 arxius», «1 imatges», «1 mesos» ni
       «1 elements» (el basc diu igual el singular i el plural);
     · mesos-basc-en-castella: sense les dades d'Intl de la llengua (el Chrome
       d'escriptori no en porta d'eu ni de gl), la taula de mesos pròpia en
       compte del castellà que hi posava el motor;
     · formatkb-no-localitzat: la mida amb el separador decimal de la llengua
       i un fitxer buit és «0 KB». */
import { afterEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';
import { TEXTOS_ESPAI as E, MESOS_ESPAI, calendariDe, segonsNombre } from './textosEspaiMultimedia.js';
import { tradueix } from './textosGestorLocal.js';
import { etiquetaDelMes } from './cronologia.js';
import { formatKb } from './motorMultimediaLocal.js';
import {
  ARREL_LOCAL, GALERIA_CRONOLOGIA, GALERIA_TOTS, PREFIX_MES, construeixCategoriesMultimedia, construeixItemsMultimedia, idVistaDe,
  indexaArbreLocal
} from './arbreMultimedia.js';

const LLENGUES = SUPPORTED_LANGUAGES.map(({ code }) => code);
const trDe = (codi) => (parell, valors) => tradueix(createTranslator(codi), parell, valors);

afterEach(() => vi.restoreAllMocks());

/* Els textos del model com els fa MultimediaSection (textosModel), en una llengua. */
const textosDe = (codi) => {
  const tr = trDe(codi);
  return {
    titol: 'Arxiu visual', senseData: 'Sense data', portada: tr(E.portada), portadaSubtitol: tr(E.portadaSubtitol),
    galeriaTots: tr(E.galeriaTots), galeriaIaia: tr(E.galeriaIaia), cronologia: tr(E.cronologia), local: tr(E.local),
    vistaCarpeta: tr(E.vistaCarpeta), imatges: tr(E.imatges), imatgesUn: tr(E.imatgesUn), arxius: tr(E.arxius),
    arxiusUn: tr(E.arxiusUn), document: tr(E.document), senseTitol: tr(E.senseTitol), llistaRetallada: tr(E.llistaRetallada),
    calendari: calendariDe(tr), insignies: {}
  };
};

describe('plurals-1-arxius', () => {
  const PARELLS = [['arxius', 'arxiusUn'], ['imatges', 'imatgesUn'], ['mesos', 'mesosUn'], ['elements', 'elementsUn']];

  test.each(LLENGUES.filter((codi) => codi !== 'eu'))('%s: amb n = 1, el singular; amb 2, el plural de sempre', (codi) => {
    const tr = trDe(codi);
    for (const [plural, singular] of PARELLS) {
      const valors = { n: 1, pes: '1 KB' };
      expect([codi, plural, tr(segonsNombre(1, E[plural], E[singular]), valors)])
        .not.toEqual([codi, plural, tr(E[plural], valors)]);
      expect(tr(segonsNombre(2, E[plural], E[singular]), { n: 2, pes: '1 KB' })).toBe(tr(E[plural], { n: 2, pes: '1 KB' }));
    }
    if (codi === 'ca') {
      expect(tr(segonsNombre(1, E.arxius, E.arxiusUn), { n: 1, pes: '1 KB' })).toBe('1 arxiu · 1 KB');
      expect(tr(segonsNombre(1, E.elements, E.elementsUn), { n: 1 })).toBe('1 element');
    }
  });

  test('la Columna 2: una galeria amb una sola imatge i un volum amb un sol arxiu, en singular (en)', () => {
    const textos = textosDe('en');
    const unic = { id: 'foto-1', title: 'Fira', src: '/a.jpg', created_at: '2026-08-16T08:00:00.000Z' };
    const elements = [{ ruta: 'acta.pdf', nom: 'acta.pdf', carpeta: '', ext: 'pdf', tipus: 'document', vista: 'pdf', mida: 193, modificat: 1 }];
    const index = indexaArbreLocal({ sal: 'sal-de-prova', carpetes: [], elements });
    const items = construeixItemsMultimedia({
      cataleg: { totes: [unic], deLaIaia: [], grupsMes: [] }, index, elements, nomVolum: 'docs', carpetaActiva: '', textos, locale: 'en-GB'
    });
    const perId = new Map(items.map((item) => [item.id, item]));
    expect(perId.get(idVistaDe(GALERIA_TOTS)).subtitle).toBe('1 image');
    expect(perId.get(idVistaDe(ARREL_LOCAL)).subtitle).toBe('1 file · 1 KB');
  });
});

describe('mesos-basc-en-castella', () => {
  /* Com el Chrome d'escriptori: cap dada d'eu ni de gl, i toLocaleDateString
     hi posa en silenci la llengua del sistema (el castellà). */
  const comChrome = () => {
    const sense = (locale) => /^(eu|gl)\b/i.test(String(locale));
    const original = Intl.DateTimeFormat.supportedLocalesOf;
    vi.spyOn(Intl.DateTimeFormat, 'supportedLocalesOf').mockImplementation((locales, opcions) =>
      original.call(Intl.DateTimeFormat, [].concat(locales).filter((l) => !sense(l)), opcions));
    const local = Date.prototype.toLocaleDateString;
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockImplementation(function toLocaleDateString(locale, opcions) {
      return local.call(this, sense(locale) ? 'es-ES' : locale, opcions);
    });
  };

  test('sense les dades del basc ni del gallec, la taula pròpia; amb les del valencià, el motor de sempre', () => {
    comChrome();
    expect(etiquetaDelMes('2026-08', 'eu-ES', calendariDe(trDe('eu')))).toBe('2026(e)ko abuztua');
    expect(etiquetaDelMes('2026-02', 'gl-ES', calendariDe(trDe('gl')))).toBe('Febreiro de 2026');
    expect(etiquetaDelMes('2026-08', 'ca-ES', calendariDe(trDe('ca')))).toMatch(/^Agost de?l? 2026$/);
    /* Sense taula, el de sempre (el castellà del sistema): la reserva és opcional. */
    expect(etiquetaDelMes('2026-08', 'eu-ES')).toBe('Agosto de 2026');
  });

  test('la Columna 1 i la Columna 2 de la Cronologia passen la taula (eu)', () => {
    comChrome();
    const textos = textosDe('eu');
    const grupsMes = [{ key: '2026-08', label: 'Agosto de 2026', items: [{ id: 'f', title: 'F', created_at: '2026-08-16T08:00:00.000Z' }] }];
    const categories = construeixCategoriesMultimedia({ grupsMes, textos, locale: 'eu-ES' });
    expect(categories.find((c) => c.id === `${PREFIX_MES}2026-08`).label).toBe('2026(e)ko abuztua');
    const items = construeixItemsMultimedia({ cataleg: { totes: grupsMes[0].items, deLaIaia: [], grupsMes }, textos, locale: 'eu-ES' });
    expect(items.find((i) => i.id === idVistaDe(`${PREFIX_MES}2026-08`)).title).toContain('2026(e)ko abuztua');
    expect(items.some((i) => i.id === idVistaDe(GALERIA_CRONOLOGIA))).toBe(true);
  });

  test('les cinc llengües tenen els dotze mesos i la plantilla amb {mes} i {any}', () => {
    for (const codi of LLENGUES) {
      const { mesos, plantilla } = calendariDe(trDe(codi));
      expect(mesos).toHaveLength(12);
      expect(new Set(mesos).size).toBe(12);
      expect(plantilla).toMatch(/\{mes\}/);
      expect(plantilla).toMatch(/\{any\}/);
    }
    expect(MESOS_ESPAI).toHaveLength(12);
  });
});

describe('formatkb-no-localitzat', () => {
  test('el separador decimal de la llengua; sense locale, el valencià', () => {
    const mb = 2.5 * 1024 * 1024;
    expect(formatKb(mb, 'ca-ES')).toBe('2,50 MB');
    expect(formatKb(mb, 'es-ES')).toBe('2,50 MB');
    expect(formatKb(mb, 'gl-ES')).toBe('2,50 MB');
    expect(formatKb(mb, 'eu-ES')).toBe('2,50 MB');
    expect(formatKb(mb, 'en-GB')).toBe('2.50 MB');
    expect(formatKb(mb)).toBe('2,50 MB');
    expect(formatKb(mb, null)).toBe('2,50 MB');
  });

  test('0 bytes és «0 KB»; d’1 a 1.023 bytes, «1 KB»; el que arredonix a 1.024 KB ja és «1,00 MB»', () => {
    expect(formatKb(0)).toBe('0 KB');
    expect(formatKb(undefined)).toBe('0 KB');
    expect(formatKb(-5)).toBe('0 KB');
    expect(formatKb(1)).toBe('1 KB');
    expect(formatKb(5 * 1024)).toBe('5 KB');
    expect(formatKb(1024 * 1024 - 1, 'ca')).toBe('1,00 MB');
    expect(formatKb(1024 * 1024 - 1, 'en-GB')).toBe('1.00 MB');
  });
});
