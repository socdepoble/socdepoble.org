// @vitest-environment node
/* IDEA-54/55 (Onada 261029_1605) · El mapa ÚNIC codi d'error → clau i18n del
   Gestor d'arxius locals: cada codi que exporta el motor (errors, limitacions
   de la llista, biblioteca de carpetes i suggeriment de poble) té el seu text,
   cap referència de la interfície apunta a un text que no existix, i omple no
   reinterpreta mai un «$&» d'un nom de fitxer. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  AMBITS_CATALEG_LOCAL, AVISOS_SUGGERIMENT_POBLE, CODIS_BIBLIOTECA_LOCAL, CODIS_ERROR_ARXIU_LOCAL, CODIS_LIMITACIO_LOCAL,
  CONFIANCES_SUGGERIMENT_POBLE, ErrorArxiuLocal, MOTIUS_ORIGEN_LOCAL, MOTIUS_SUGGERIMENT_POBLE
} from './motorMultimediaLocal.js';
import { ORIGENS } from './origenImatges.js';
import {
  ERRORS_BIBLIOTECA_LOCAL, ERRORS_LOCAL, ERROR_COPIA_CONSERVADA_LOCAL, ERROR_GENERIC_LOCAL, LIMITACIONS_LOCAL, TEXTOS_LOCAL,
  ERROR_MOVIMENT_SENSE_VERIFICAR_LOCAL, ERROR_RUTA_INVISIBLES_LOCAL,
  missatgeDErrorLocal, missatgeDeBibliotecaLocal, missatgeDeLimitacioLocal, omple, parellDErrorLocal, traduccioDeReserva, tradueix
} from './textosGestorLocal.js';
/* Gauntlet 261029 (cicle 1) · Els mapes viuen a suportGestorLocal.js (els .jsx només exporten components). */
import {
  TEXTOS_AMBIT_LOCAL, TEXTOS_AVIS_POBLE, TEXTOS_CONFIANCA_POBLE, TEXTOS_MOTIU_ORIGEN_LOCAL, TEXTOS_MOTIU_POBLE, TEXTOS_ORIGEN_LOCAL,
  TEXTOS_VERIFICACIO_LOCAL
} from './suportGestorLocal.js';

const PREFIX = 'section.multimedia.local.';
const DIR = path.join(process.cwd(), 'src/sections/multimedia');
const FITXERS_UI = [
  'GestorMultimediaLocal.jsx', 'BarraVolumsLocals.jsx', 'ArbreCarpetesLocals.jsx', 'GraellaAlbumLocal.jsx',
  'TaulaArxiusLocals.jsx', 'DetallArxiuLocal.jsx', 'EditorTextLocal.jsx', 'LaboratoriWebpLocal.jsx',
  'OperacionsArxiuLocal.jsx', 'AccionsCarpetaLocal.jsx', 'FormulariNomLocal.jsx', 'PropostaPobleLocal.jsx',
  /* Bloc E (IDEA-55 + P1-71) · L'estat i els fluxos del Gestor (useGestorArxiusLocals.js) i les pàgines de l'espai. */
  'useGestorArxiusLocals.js', 'PaginesEspaiMultimedia.jsx',
  /* Gauntlet 261029 (cicle 1) · Els valors que abans exportaven els .jsx. */
  'suportGestorLocal.js', 'miniaturesLocals.js'
];

const totsElsParells = () => [
  ...Object.values(TEXTOS_LOCAL), ...Object.values(ERRORS_LOCAL), ...Object.values(LIMITACIONS_LOCAL),
  ...Object.values(ERRORS_BIBLIOTECA_LOCAL), ERROR_GENERIC_LOCAL, ERROR_COPIA_CONSERVADA_LOCAL,
  ERROR_MOVIMENT_SENSE_VERIFICAR_LOCAL, ERROR_RUTA_INVISIBLES_LOCAL
];

describe('mapa codi → text', () => {
  test('cada codi d’error del motor té el seu text (i res de més)', () => {
    expect(Object.keys(ERRORS_LOCAL).sort()).toEqual([...CODIS_ERROR_ARXIU_LOCAL].sort());
    expect(Object.keys(LIMITACIONS_LOCAL).sort()).toEqual([...CODIS_LIMITACIO_LOCAL].sort());
    expect(Object.keys(ERRORS_BIBLIOTECA_LOCAL).sort()).toEqual([...CODIS_BIBLIOTECA_LOCAL].sort());
  });

  test('cada motiu, avís, confiança, àmbit i origen del suggeriment té el seu text', () => {
    expect(Object.keys(TEXTOS_MOTIU_POBLE).sort()).toEqual([...MOTIUS_SUGGERIMENT_POBLE].sort());
    expect(Object.keys(TEXTOS_AVIS_POBLE).sort()).toEqual([...AVISOS_SUGGERIMENT_POBLE].sort());
    expect(Object.keys(TEXTOS_CONFIANCA_POBLE).sort()).toEqual([...CONFIANCES_SUGGERIMENT_POBLE].sort());
    expect(Object.keys(TEXTOS_AMBIT_LOCAL).sort()).toEqual([...AMBITS_CATALEG_LOCAL].sort());
    expect(Object.keys(TEXTOS_ORIGEN_LOCAL).sort()).toEqual([...ORIGENS].sort());
    expect(Object.keys(TEXTOS_MOTIU_ORIGEN_LOCAL).sort()).toEqual([...MOTIUS_ORIGEN_LOCAL].sort());
    expect(Object.keys(TEXTOS_VERIFICACIO_LOCAL).sort()).toEqual(['bytes', 'mida', 'sha256']);
  });

  test('tots els parells són [clau del Gestor, reserva sense apòstrof recte], cap clau repetida', () => {
    const claus = new Set();
    for (const parell of totsElsParells()) {
      expect(Array.isArray(parell) && parell.length === 2, String(parell)).toBe(true);
      const [clau, reserva] = parell;
      expect(clau.startsWith(PREFIX), clau).toBe(true);
      expect(typeof reserva === 'string' && reserva.trim() !== '', clau).toBe(true);
      expect(reserva.includes("'"), clau).toBe(false);
      expect(claus.has(clau), clau).toBe(false);
      claus.add(clau);
    }
    expect(Object.isFrozen(TEXTOS_LOCAL) && Object.isFrozen(TEXTOS_LOCAL.titol)).toBe(true);
  });

  test('tot codi del motor dona un text propi; un codi desconegut, la reserva genèrica', () => {
    for (const codi of CODIS_ERROR_ARXIU_LOCAL) {
      const text = missatgeDErrorLocal(traduccioDeReserva, new ErrorArxiuLocal(codi, 'x'));
      expect([codi, text]).toEqual([codi, ERRORS_LOCAL[codi][1]]);
    }
    expect(missatgeDErrorLocal(traduccioDeReserva, new Error('cap codi'))).toBe(ERROR_GENERIC_LOCAL[1]);
    expect(missatgeDErrorLocal(traduccioDeReserva, null)).toBe(ERROR_GENERIC_LOCAL[1]);
    for (const codi of CODIS_LIMITACIO_LOCAL) expect(missatgeDeLimitacioLocal(traduccioDeReserva, codi)).toBe(LIMITACIONS_LOCAL[codi][1]);
    for (const codi of CODIS_BIBLIOTECA_LOCAL) expect(missatgeDeBibliotecaLocal(traduccioDeReserva, codi)).toBe(ERRORS_BIBLIOTECA_LOCAL[codi][1]);
    expect(missatgeDeLimitacioLocal(traduccioDeReserva, 'RES')).toBe(ERROR_GENERIC_LOCAL[1]);
  });

  test('el detall de l’error omple els marcadors (moviment incomplet, original no mogut, còpia conservada)', () => {
    expect(missatgeDErrorLocal(traduccioDeReserva, new ErrorArxiuLocal('MOVIMENT_INCOMPLET', 'x', { detall: { origen: 'a/x.png', desti: 'b/x.png' } })))
      .toBe('S’ha copiat a «b/x.png», però l’original «a/x.png» no s’ha pogut esborrar: ara n’hi ha dos.');
    expect(missatgeDErrorLocal(traduccioDeReserva, new ErrorArxiuLocal('ORIGINAL_NO_MOGUT', 'x', { detall: { webp: 'a/x.webp', desti: 'originals_raster_public/x.png' } })))
      .toContain('«a/x.webp»');
    const conservada = new ErrorArxiuLocal('CONFLICTE_DISC', 'x', { detall: { copiaConservada: 'b/x.png' } });
    expect(parellDErrorLocal(conservada)).toBe(ERROR_COPIA_CONSERVADA_LOCAL);
    expect(missatgeDErrorLocal(traduccioDeReserva, conservada)).toContain('«b/x.png»');
    expect(parellDErrorLocal(new ErrorArxiuLocal('CONFLICTE_DISC', 'x', { detall: { modificat: 3 } }))).toBe(ERRORS_LOCAL.CONFLICTE_DISC);
  });

  test('QA-A02 i QA-A05: la còpia sense verificar i el nom amb invisibles tenen un missatge propi', () => {
    const senseVerificar = new ErrorArxiuLocal('MOVIMENT_INCOMPLET', 'x', {
      detall: { origen: 'a/x.mp4', desti: 'b/x.mp4', copiaConservada: 'b/x.mp4', motiu: 'SENSE_VERIFICAR' }
    });
    expect(parellDErrorLocal(senseVerificar)).toBe(ERROR_MOVIMENT_SENSE_VERIFICAR_LOCAL);
    expect(missatgeDErrorLocal(traduccioDeReserva, senseVerificar))
      .toBe('S’ha copiat a «b/x.mp4», però no s’ha pogut comprovar que la còpia siga idèntica: l’original «a/x.mp4» es conserva i ara n’hi ha dos.');
    const invisibles = new ErrorArxiuLocal('RUTA_INVALIDA', 'x', { detall: { motiu: 'CARACTERS_INVISIBLES' } });
    expect(parellDErrorLocal(invisibles)).toBe(ERROR_RUTA_INVISIBLES_LOCAL);
    /* Sense el motiu, els textos de sempre. */
    expect(parellDErrorLocal(new ErrorArxiuLocal('MOVIMENT_INCOMPLET', 'x', { detall: { origen: 'a', desti: 'b' } }))).toBe(ERRORS_LOCAL.MOVIMENT_INCOMPLET);
    expect(parellDErrorLocal(new ErrorArxiuLocal('RUTA_INVALIDA', 'x'))).toBe(ERRORS_LOCAL.RUTA_INVALIDA);
  });
});

describe('omple i tradueix', () => {
  test('omple no reinterpreta «$&» ni «$1» d’un nom i deixa visibles els marcadors sense valor', () => {
    expect(omple('«{nom}»', { nom: 'a$&b$1.md' })).toBe('«a$&b$1.md»');
    expect(omple('{n} de {total}', { n: 0 })).toBe('0 de {total}');
    expect(omple('{toString}', {})).toBe('{toString}');
    expect(omple('sense', null)).toBe('sense');
  });

  test('tradueix fa servir el traductor, i la reserva si el traductor falla o no torna text', () => {
    const parell = TEXTOS_LOCAL.recordada;
    expect(tradueix((c) => `⟦${c}⟧`, parell)).toBe(`⟦${parell[0]}⟧`);
    expect(tradueix(() => '', parell, { nom: 'X' })).toBe('Carpeta recordada: «X»');
    expect(tradueix(() => { throw new Error('trencat'); }, parell, { nom: 'X' })).toBe('Carpeta recordada: «X»');
    expect(tradueix(traduccioDeReserva, null)).toBe('');
  });
});

describe('les referències de la interfície', () => {
  test('cada T.x i T[\'x\'] dels components existix a TEXTOS_LOCAL, i cada text s’usa', () => {
    const font = FITXERS_UI.map((f) => readFileSync(path.join(DIR, f), 'utf8')).join('\n')
      + readFileSync(path.join(DIR, 'MultimediaSection.jsx'), 'utf8');
    const usades = new Set([
      ...[...font.matchAll(/\bT\.(\w+)/g)].map((m) => m[1]),
      ...[...font.matchAll(/\bT\['([\w.]+)'\]/g)].map((m) => m[1]),
      ...[...font.matchAll(/TEXTOS_LOCAL\.(\w+)/g)].map((m) => m[1]),
      /* Les claus dels arranjaments [valor, 'clau'] (filtres, tipus, qualitats i columnes). */
      ...[...font.matchAll(/'((?:filtre|tipus|lab|col)\.[\w.]+)'/g)].map((m) => m[1])
    ]);
    const inexistents = [...usades].filter((u) => !Object.hasOwn(TEXTOS_LOCAL, u));
    expect(inexistents).toEqual([]);
    const sobrants = Object.keys(TEXTOS_LOCAL).filter((k) => !usades.has(k));
    expect(sobrants).toEqual([]);
  });
});
