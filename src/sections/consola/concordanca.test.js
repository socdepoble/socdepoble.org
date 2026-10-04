import { describe, expect, test } from 'vitest';
import { ambMajuscula, compteOMesura, concorda, de, llegidaAmbVocal, plural, senseMesura } from './concordanca.js';

/* Correcció 261004 (verificador de la tercera passada, punts 2 i 3) · La
   concordança de nombre i l'ortografia de «de» davant d'una xifra, comunes a
   tota la Consola (i al compilador del Mapa). */
describe('concordança', () => {
  test('el nom, el verb o l’adjectiu concorden amb la xifra', () => {
    expect(plural(1, 'cadena', 'cadenes')).toBe('1 cadena');
    expect(plural(0, 'cadena', 'cadenes')).toBe('0 cadenes');
    expect(concorda(1, 'rep', 'reben')).toBe('rep');
    expect(senseMesura(null, 'torn', 'torns', 'Torns sense mesura')).toBe('Torns sense mesura');
    expect(compteOMesura(null, 'rebut', 'rebuts')).toBe('rebuts sense mesura');
    expect(compteOMesura(0, 'rebut', 'rebuts')).toBe('0 rebuts');
  });
});

describe('«de» davant d’una xifra', () => {
  test('s’apostrofa quan la xifra es llig amb vocal: u, onze, huit, huitanta, huit-cents, un milió', () => {
    for (const n of [1, 8, 11, 80, 85, 89, 800, 899, 8000, 11000, 80000, 1000000, 8000000]) expect(llegidaAmbVocal(n), String(n)).toBe(true);
  });

  test('no s’apostrofa davant de consonant: zero, dos, deu, díhuit, cent, mil, mil milions', () => {
    for (const n of [0, 2, 7, 10, 18, 21, 30, 79, 90, 100, 150, 180, 1000, 1999, 2000, 1000000000]) expect(llegidaAmbVocal(n), String(n)).toBe(false);
    for (const raro of [-1, 1.5, NaN, null, '1']) expect(llegidaAmbVocal(raro), String(raro)).toBe(false);
  });

  test('de(n, text): «d’1 agent», «de 30 skills»; a començament de frase, amb majúscula', () => {
    expect(de(1, plural(1, 'agent', 'agents'))).toBe('d’1 agent');
    expect(de(30, plural(30, 'skill', 'skills'))).toBe('de 30 skills');
    expect(de(8)).toBe('d’8');
    expect(de(150)).toBe('de 150');
    expect(`3 ${de(11, '')}`).toBe('3 d’');
    expect(ambMajuscula(de(1, '1 mètrica'))).toBe('D’1 mètrica');
    expect(ambMajuscula(de(2, '2 mètriques'))).toBe('De 2 mètriques');
    expect(ambMajuscula('')).toBe('');
  });
});
