// @vitest-environment node
/* Onada R32.30b · Lot 01 · Verificació implacable d'i18n en 5 llengües
   (ca, es, en, eu, gl) per a l'exportació i importació de Salut:
   · Les 5 claus auditades (comuns.nota, ingesta.beguda, miccio.mesura,
     miccio.volumMl, escapament.quantitat) i totes les columnes de Diari,
     Resum, Conducta, Medicació i Diccionari tenen traducció definida i mai
     retornen claus crues ni undefined en cap de les 5 llengües.
   · Anada i tornada completa (XLSX i CSV) en ca, es, en, eu i gl.
   · Proposta d'importació (avisos i cel·les descartades) i errors de lectura
     traduïts en es, en, eu i gl, i intactes en valencià (ca). */
import { describe, expect, test } from 'vitest';
import { validaModel } from '../../../utils/fulls/index.js';
import {
  errorLlegirFitxerSalut,
  modelFullSalutTraduit,
  propostaImportacioTraduida
} from '../i18nSalut.js';
import { campDe, opcionsDe, validaApunt, validaPersona } from './diccionari.js';
import { exporta } from './exportacio.js';
import { fullDiari } from './full.js';
import { assignaJornades, sumaDies } from './hores.js';
import {
  COLUMNES_DIARI_5_LLENGUES,
  NOTA_FRANJA,
  PREFIXOS_NOTES_DIARI_5_LLENGUES,
  detectaFormat,
  llegixFitxer,
  proposaApunts
} from './importacio.js';
import { plantillaSintetica } from './__fixtures__/plantillaSintetica.js';

const LLENGUES = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);
const CINC_CLAUS_AUDITADES = Object.freeze([
  'comuns.nota',
  'ingesta.beguda',
  'miccio.mesura',
  'miccio.volumMl',
  'escapament.quantitat'
]);
const DIA = '2026-03-10';
const PERSONA = validaPersona({}).persona;
const OFSET = () => 60;
const PATRO_CLAU_CRUA = /\b(?:comuns|ingesta|miccio|escapament|absorbent|deposicio|conducta|medicacio|derivats)\.[a-zA-Z]+\b/;

let seq = 0;
const nouId = () => {
  seq += 1;
  return `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`;
};

describe('les 5 claus auditades i totes les columnes de Diari en 5 llengües', () => {
  test('comuns.nota, ingesta.beguda, miccio.mesura, miccio.volumMl i escapament.quantitat existixen en ca, es, en, eu i gl', () => {
    for (const clau of CINC_CLAUS_AUDITADES) {
      expect(COLUMNES_DIARI_5_LLENGUES[clau], clau).toBeDefined();
      for (const codi of LLENGUES) {
        const valor = COLUMNES_DIARI_5_LLENGUES[clau][codi];
        expect(typeof valor, `${clau}.${codi}`).toBe('string');
        expect(valor.trim().length, `${clau}.${codi}`).toBeGreaterThan(0);
        expect(valor).not.toContain('undefined');
        expect(PATRO_CLAU_CRUA.test(valor), `${clau}.${codi}: ${valor}`).toBe(false);
      }
    }
    for (const grup of Object.values(PREFIXOS_NOTES_DIARI_5_LLENGUES)) {
      for (const codi of LLENGUES) {
        expect(typeof grup[codi]).toBe('string');
        expect(grup[codi].length).toBeGreaterThan(0);
      }
    }
  });
});

describe('anada i tornada d’XLSX i CSV en ca, es, en, eu i gl sense claus crues ni undefined', () => {
  const crus = [
    { tipus: 'son', moment: '2026-03-10T07:05', event: 'alcar-se' },
    { tipus: 'miccio', moment: '2026-03-10T07:20', volumMl: 310, mesura: 'mesurat', lloc: 'vater', urgencia: 2, nota: 'Primera del matí' },
    { tipus: 'miccio', moment: '2026-03-10T10:15', volumMl: 180, mesura: 'estimat', lloc: 'vater' },
    { tipus: 'miccio', moment: '2026-03-10T12:30', mesura: 'no-mesurat', lloc: 'vater' },
    { tipus: 'ingesta', moment: '2026-03-10T08:10', volumMl: 220, beguda: 'cafe', estimat: true, rebutjada: false, nota: 'Tebe' },
    { tipus: 'ingesta', moment: '2026-03-10T09:40', volumMl: 150, beguda: 'infusio', estimat: false, rebutjada: false },
    { tipus: 'ingesta', moment: '2026-03-10T11:00', volumMl: 200, beguda: 'brou-sopa', estimat: false, rebutjada: false },
    { tipus: 'escapament', moment: '2026-03-10T13:20', quantitat: 'gotes', circumstancia: 'no-se-sap', nota: 'En alçar-se' },
    { tipus: 'escapament', moment: '2026-03-10T16:45', quantitat: 'humit', circumstancia: 'no-se-sap' },
    { tipus: 'escapament', moment: '2026-03-10T19:10', quantitat: 'xopat', circumstancia: 'no-se-sap' },
    { tipus: 'son', moment: '2026-03-10T15:00', event: 'migdiada-inici' },
    { tipus: 'son', moment: '2026-03-10T16:00', event: 'migdiada-fi' },
    { tipus: 'son', moment: '2026-03-10T22:20', event: 'gitar-se', nota: 'Tranquil' },
    { tipus: 'son', moment: '2026-03-10T22:45', event: 'adormir-se' },
    { tipus: 'conducta', moment: '2026-03-10T18:00', conductes: ['cridar'], intensitat: 2, resultat: 'es-calma-prompte' },
    { tipus: 'medicacio', moment: '2026-03-10T20:00', nom: 'pastilla nit', dosi: '1', pauta: 'fixa', estat: 'presa', etiqueta: 'per-dormir' },
    /* v1.2.19 · Gauntlet R1 (L3-03): apunts amb les marques del sistema (els de la graella) a la nota. */
    { tipus: 'ingesta', moment: '2026-03-10T13:50', volumMl: 120, beguda: 'altra', estimat: true, rebutjada: false, nota: `Líquid del menjar · ${NOTA_FRANJA}` },
    { tipus: 'miccio', moment: '2026-03-10T14:10', volumMl: 250, mesura: 'mesurat', lloc: 'vater', nota: NOTA_FRANJA },
    { tipus: 'escapament', moment: '2026-03-10T17:30', quantitat: 'gotes', circumstancia: 'no-se-sap', nota: NOTA_FRANJA }
  ];
  const originals = assignaJornades(
    crus.map((c) => validaApunt({ ...c, id: nouId(), ofsetMin: 60 }, { ambId: true }).apunt),
    PERSONA
  );
  const esperatsDiari = originals
    .filter((a) => ['miccio', 'ingesta', 'escapament', 'son'].includes(a.tipus))
    .sort((a, b) => (a.moment < b.moment ? -1 : 1))
    .map((a) => ({ ...a, id: undefined, jornada: undefined }));

  test.each(LLENGUES)('idioma %s: el model traduït és vàlid i no conté undefined ni claus crues', (idioma) => {
    const { model, periode } = fullDiari({ des: DIA, dies: 1, apunts: originals, persona: PERSONA, ofsetDe: OFSET });
    const traduit = modelFullSalutTraduit(model, {
      des: DIA, fins: sumaDies(DIA, 0), dies: 1, completes: periode.completes, nomPersona: '', idioma
    });
    expect(validaModel(traduit)).toEqual([]);
    const textosVisibles = traduit.fulles.flatMap((f) => [
      f.nom,
      ...f.columnes.map((c) => c.titol),
      ...f.files.flat().filter((v) => v !== null)
    ]).map(String);
    for (const txt of textosVisibles) {
      expect(txt).not.toContain('undefined');
      expect(PATRO_CLAU_CRUA.test(txt), `${idioma}: ${txt}`).toBe(false);
    }
    /* v1.2.19 · Gauntlet R1 (L3-03): la columna Notes és text de la persona i ix sense traduir. */
    expect(traduit.fulles[1].files.map((fila) => fila[13]), idioma).toEqual(model.fulles[1].files.map((fila) => fila[13]));

    for (const format of ['xlsx', 'csv']) {
      const fitxer = exporta({ model: traduit, format, des: DIA, dies: 1, fullaCsv: traduit.fulles[1].nom });
      if (format === 'csv') {
        expect(fitxer.dades).not.toContain('undefined');
        expect(PATRO_CLAU_CRUA.test(fitxer.dades)).toBe(false);
      }
      const bytes = typeof fitxer.dades === 'string' ? new TextEncoder().encode(fitxer.dades) : fitxer.dades;
      const llegit = llegixFitxer(bytes, fitxer.nom);
      expect(llegit.ok).toBe(true);
      expect(detectaFormat(llegit.llibre)).toBe('diari-salut');
      const proposta = proposaApunts({ llibre: llegit.llibre, persona: PERSONA, ofsetDe: OFSET, fitxer: fitxer.nom });
      const recuperats = [...proposta.apunts]
        .sort((a, b) => (a.moment < b.moment ? -1 : 1))
        .map((a) => ({ ...a, id: undefined, jornada: undefined }));
      expect(recuperats).toEqual(esperatsDiari);
      for (const apunt of proposta.apunts) {
        expect(validaApunt(apunt, { ambId: true }).ok).toBe(true);
      }
    }
  });

  test('totes les opcions de beguda es reconeixen en exportar i reimportar en les 5 llengües', () => {
    const begudes = opcionsDe(campDe('ingesta', 'beguda')).map((o, idx) => validaApunt({
      id: nouId(),
      tipus: 'ingesta',
      moment: `${DIA}T${String(8 + idx).padStart(2, '0')}:00`,
      ofsetMin: 60,
      volumMl: 150,
      beguda: o.valor,
      estimat: false,
      rebutjada: false
    }, { ambId: true }).apunt);
    const apunts = assignaJornades(begudes, PERSONA);
    const { model, periode } = fullDiari({ des: DIA, dies: 1, apunts, persona: PERSONA, ofsetDe: OFSET });
    for (const idioma of LLENGUES) {
      const traduit = modelFullSalutTraduit(model, {
        des: DIA, fins: DIA, dies: 1, completes: periode.completes, nomPersona: '', idioma
      });
      const csv = exporta({ model: traduit, format: 'csv', des: DIA, dies: 1 });
      const llegit = llegixFitxer(new TextEncoder().encode(csv.dades), csv.nom);
      const proposta = proposaApunts({ llibre: llegit.llibre, persona: PERSONA, ofsetDe: OFSET, fitxer: csv.nom });
      expect(proposta.apunts.map((a) => a.beguda), idioma).toEqual(begudes.map((b) => b.beguda));
    }
  });
});

describe('proposta d’importació i errors de lectura traduïts en 5 llengües', () => {
  test('avisos i cel·les descartades de la graella es traduïxen sense claus crues ni undefined', () => {
    const bytes = plantillaSintetica({
      franges: { '01': { miccio: 250 }, '07': { aigua: 'x', miccio: 200 }, 18: { urgencia: 3 }, 21: { muda: 1 } },
      resum: { data: DIA, alcar: '07:30', dormir: '22:30' }
    });
    const llegit = llegixFitxer(bytes, 'plantilla.xlsx');
    const base = proposaApunts({ llibre: llegit.llibre, persona: PERSONA, ofsetDe: OFSET, fitxer: 'plantilla.xlsx' });
    expect(propostaImportacioTraduida(base, 'ca')).toBe(base);

    for (const idioma of ['es', 'en', 'eu', 'gl']) {
      const tr = propostaImportacioTraduida(base, idioma);
      expect(tr.avisos.length).toBe(base.avisos.length);
      expect(tr.descartats.length).toBe(base.descartats.length);
      for (let i = 0; i < base.avisos.length; i += 1) {
        expect(tr.avisos[i].text, `${idioma}:${base.avisos[i].codi}`).not.toBe(base.avisos[i].text);
        expect(tr.avisos[i].text).not.toContain('undefined');
      }
      for (let i = 0; i < base.descartats.length; i += 1) {
        expect(tr.descartats[i].motiu, `${idioma}:${base.descartats[i].lloc}`).not.toBe(base.descartats[i].motiu);
        expect(tr.descartats[i].motiu).not.toContain('undefined');
      }
      expect(errorLlegirFitxerSalut('El fitxer és buit.', idioma)).not.toBe('El fitxer és buit.');
    }
  });
});
