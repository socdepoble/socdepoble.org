// @vitest-environment node
/* Onada R29 · G11 · Les claus noves de R29 (reproductor en mode àudio, R29-02-05, i carpeta CRDT plena) són
   als cinc diccionaris; en valencià, el valor és la reserva exacta del codi, i les altres quatre llengües
   no deixen el text valencià on la frase és pròpia (es i gl diuen «Pista anterior» igual que el valencià). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import CA from './idiomes/ca.js';
import ES from './idiomes/es.js';
import EN from './idiomes/en.js';
import EU from './idiomes/eu.js';
import GL from './idiomes/gl.js';
import { TEXTOS_MODE_RURAL } from '../sections/control/textosModeRural.js';

const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
const font = readFileSync(path.join(process.cwd(), 'src/components/universal/veu/BarraReproductorVeu.jsx'), 'utf8');
const PARELLS_AUDIO = [...font.matchAll(/\[\s*'(veu\.reproductor\.\w+Audio)'\s*,\s*'([^']*)'\s*\]/g)]
  .map(([, clau, reserva]) => [clau, reserva]);
const PARELLS = [...PARELLS_AUDIO, TEXTOS_MODE_RURAL.crdtCarpetaQuota];

describe('Onada R29 · claus noves del reproductor d’àudio i de la carpeta CRDT', () => {
  test('el reproductor declara les 13 claus de pistes, a més de les tres que ja hi eren', () => {
    expect(PARELLS_AUDIO.map(([clau]) => clau)).toEqual(expect.arrayContaining([
      'veu.reproductor.anteriorAudio', 'veu.reproductor.seguentAudio', 'veu.reproductor.pausaAudio',
      'veu.reproductor.continuaAudio', 'veu.reproductor.tornaEscoltarAudio', 'veu.reproductor.apartatsAudio',
      'veu.reproductor.cercaPlaceholderAudio', 'veu.reproductor.cercaEtiquetaAudio', 'veu.reproductor.senseResultatsAudio',
      'veu.reproductor.copiaAudio', 'veu.reproductor.copiatAudio', 'veu.reproductor.errorCopiaAudio', 'veu.reproductor.tancaAudio'
    ]));
  });

  test('en valencià, el diccionari diu la reserva exacta del codi', () => {
    expect(PARELLS.filter(([clau, reserva]) => CA[clau] !== reserva).map(([clau]) => clau)).toEqual([]);
  });

  test.each(['es', 'en', 'eu', 'gl'])('%s · totes hi són, sense marcadors de més ni de menys', (codi) => {
    const dic = DICCIONARIS[codi];
    const marcadors = (text) => (String(text).match(/\{\w+\}/g) ?? []).sort().join(',');
    expect(PARELLS.filter(([clau]) => typeof dic[clau] !== 'string' || !dic[clau].trim()).map(([clau]) => clau)).toEqual([]);
    expect(PARELLS.filter(([clau, reserva]) => marcadors(dic[clau]) !== marcadors(reserva)).map(([clau]) => clau)).toEqual([]);
  });

  test.each(['en', 'eu'])('%s · cap text nou és el valencià', (codi) => {
    expect(PARELLS.filter(([clau, reserva]) => DICCIONARIS[codi][clau] === reserva).map(([clau]) => clau)).toEqual([]);
  });

  test('la carpeta plena: cada llengua diu els dos límits i el camí de la còpia', () => {
    const clau = 'section.control.rural.crdtCarpetaQuota';
    for (const [codi, dic] of Object.entries(DICCIONARIS)) {
      expect([codi, /1[.,]000/.test(dic[clau]), dic[clau].includes('4 MB')]).toEqual([codi, true, true]);
    }
    /* El botó que cal prémer es diu igual al missatge i al botó (section.control.rural.exportaVault). */
    for (const [codi, dic] of Object.entries(DICCIONARIS)) {
      const boto = dic['section.control.rural.exportaVault'].toLowerCase();
      expect([codi, dic[clau].toLowerCase().includes(boto.replace(/^(preparar|prepare|prestatu) /, ''))]).toEqual([codi, true]);
    }
  });

  test('eu · el reproductor de so és «erreproduzigailu», com a la resta de claus', () => {
    expect(EU['veu.reproductor.tancaAudio']).toMatch(/erreproduzigailu/);
  });
});
