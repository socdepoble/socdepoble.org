// @vitest-environment node
/* O4-CLAUDE-1 (ordre del Mestre, captura 261102_2121) · La correspondència
   pura entre l'àmbit de la fitxa i la carpeta del Bloc: àmbit → carpeta per
   la secció (CARPETA_PER_SECCIO[SECTION_ID_PER_AMBIT]), i carpeta → àmbit
   només en els dos casos del Mercat. El mapa de veres (masDeLUsuari.js). */
import { describe, expect, test } from 'vitest';
import { ambitPerCanviDeCarpeta, carpetaDeLAmbit } from './carpetaAmbit.js';
import { CARPETA_PER_SECCIO } from '../../../sections/notes/masDeLUsuari.js';
import { AMBITS } from '../../../utils/publicacioUniversal.js';

describe('carpetaDeLAmbit', () => {
  test('el Mercat va a la carpeta del Mercat; Mur, Compartir cotxe, Treball i Habitatge, a la del Mur', () => {
    expect(Object.fromEntries(AMBITS.map((ambit) => [ambit, carpetaDeLAmbit(ambit, CARPETA_PER_SECCIO)]))).toEqual({
      mur: 'f-mur', mercat: 'f-mercat', vehicle: 'f-mur', treball: 'f-mur', habitatge: 'f-mur'
    });
  });

  test('un àmbit desconegut, sense mapa o amb una clau heretada: cap carpeta', () => {
    expect(carpetaDeLAmbit('tramvia', CARPETA_PER_SECCIO)).toBeNull();
    expect(carpetaDeLAmbit('__proto__', CARPETA_PER_SECCIO)).toBeNull();
    expect(carpetaDeLAmbit('mercat', null)).toBeNull();
    expect(carpetaDeLAmbit('mercat', {})).toBeNull();
    expect(carpetaDeLAmbit('vehicle', Object.create({ mur: 'f-heretada' }))).toBeNull();
  });
});

describe('ambitPerCanviDeCarpeta', () => {
  const canvi = (ambitActual, abans, despres) => ambitPerCanviDeCarpeta({ ambitActual, abans, despres, carpetaPerSeccio: CARPETA_PER_SECCIO });

  test('moure la nota a la carpeta del Mercat li posa l’àmbit Mercat (des de qualsevol altre àmbit)', () => {
    expect(canvi('mur', 'f-mur', 'f-mercat')).toBe('mercat');
    expect(canvi('vehicle', 'f-mur', 'f-mercat')).toBe('mercat');
    expect(canvi('mur', 'f-notes', 'f-mercat')).toBe('mercat');
    // Ja ho era: res.
    expect(canvi('mercat', 'f-notes', 'f-mercat')).toBeNull();
  });

  test('traure-la del Mercat cap al Mur amb l’àmbit Mercat la torna al Mur', () => {
    expect(canvi('mercat', 'f-mercat', 'f-mur')).toBe('mur');
  });

  test('cap altre moviment toca la fitxa', () => {
    expect(canvi('mercat', 'f-mercat', 'f-notes')).toBeNull();
    expect(canvi('vehicle', 'f-mercat', 'f-mur')).toBeNull();
    expect(canvi('treball', 'f-mur', 'f-notes')).toBeNull();
    expect(canvi('mur', 'f-notes', 'f-mur')).toBeNull();
    expect(canvi('mercat', 'f-mercat', 'f-mercat')).toBeNull();
    expect(ambitPerCanviDeCarpeta({ ambitActual: 'mur', abans: 'f-mur', despres: 'f-mercat', carpetaPerSeccio: null })).toBeNull();
    expect(ambitPerCanviDeCarpeta()).toBeNull();
  });
});
