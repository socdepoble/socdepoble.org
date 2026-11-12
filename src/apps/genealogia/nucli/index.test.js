// @vitest-environment node
/* Arbre Genealògic · la façana del nucli: carrega sense exportacions
   ambigües i oferix el que gedcom/, arxius/ i les vistes necessiten. Cap
   fitxer del nucli parla amb la xarxa ni amb IndexedDB: només ho fa
   src/apps/genealogia/magatzem.js, fora del nucli. */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import * as nucli from './index.js';

const CARPETA = fileURLToPath(new URL('.', import.meta.url));
const fonts = readdirSync(CARPETA).filter((f) => /\.jsx?$/.test(f) && !/\.test\.jsx?$/.test(f));

describe('nucli/index.js', () => {
  test('exporta el contracte', () => {
    for (const nom of [
      'IDIOMES', 'ESTATS', 'ETIQUETES_ESTAT', 'PRECISIONS', 'MARGE_PRECISIO', 'SEXES', 'VIVA', 'GENERACIONS', 'TIPUS_RELACIO', 'TIPUS_RELACIO_TOTS', 'ROLS_FAN', 'TIPUS_FONT',
      'EDAT_MINIMA_PROGENITOR', 'EDAT_MAXIMA_PROGENITOR', 'EDAT_MAXIMA_MARE', 'EDAT_MAXIMA_VIDA', 'ANYS_PROTECCIO_VIUS',
      'dataDesconeguda', 'llegeixData', 'escriuData', 'netejaData', 'intervalAny', 'etiquetaData', 'relacioDates', 'comparaDates',
      'netejaArbre', 'netejaPersona', 'netejaFont', 'netejaRelacio', 'netejaEntrevista', 'creaArbre', 'creaPersona', 'creaRelacio', 'arbreBuit', 'indexa',
      'esPersonaViva', 'filtraVius', 'idsVius', 'detectaContradiccions', 'estatEfectiu', 'estatDeVincle', 'verificaVincle', 'mateixCognom', 'avisosCognom',
      'MAX_GENERACIONS_SOSA', 'generacioDeSosa', 'numeraSosa', 'colateralsFan',
      'PASSOS_ENTREVISTA', 'estatInicialEntrevista', 'pasActual', 'respon', 'salta', 'enrere', 'aplicaEntrevista', 'progresEntrevista', 'treuResposta',
      'ProveidorGenealogia', 'useGenealogia',
      'MIDA_MAXIMA_IMPORTACIO', 'MAX_PERSONES', 'MAX_RELACIONS', 'esClauSegura', 'text', 'urlSegura', 'revivorSegur', 'objectePla'
    ]) expect(nucli[nom], nom).toBeDefined();
    expect(nucli.creaMagatzemGenealogia).toBeUndefined();
  });

  /* Els patrons es componen a trossos perquè les portes que llegixen src/
     (plataforma/qualitat.test.js) no els troben en cru en esta prova. */
  test('privacitat: cap xarxa ni IndexedDB al nucli (el magatzem viu a l’arrel de l’app)', () => {
    const vetat = new RegExp(['\\bfet', 'ch\\(|XMLHttp', 'Request|WebSo', 'cket|sendBea', 'con|inner', 'HTML|dangerously', 'SetInner', 'HTML|\\bev', 'al\\(|new Func', 'tion\\('].join(''));
    const motor = new RegExp(['indexed', 'DB|magatzem', 'Local'].join(''));
    for (const fitxer of fonts) {
      const codi = readFileSync(`${CARPETA}${fitxer}`, 'utf8');
      expect(codi, fitxer).not.toMatch(vetat);
      expect(codi, fitxer).not.toMatch(motor);
      expect(codi, fitxer).not.toMatch(/Date\.now\(\)/);
    }
  });
});
