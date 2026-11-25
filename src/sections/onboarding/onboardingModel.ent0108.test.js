/* v1.2.25 · K-CAB-ENT0108 (cablatge de les claus de G9, ENT0108-VS-03) · Tres rebuigs de GoTrue a l'entrada amb Google
   que oauthRelay.js ara traduïx a un codi propi de CODI_ENTRADA (abans tots eren DESCONEGUT, «No s’ha pogut completar
   l’entrada amb Google»): les altes tancades, el compte suspés i el correu de Google sense confirmar. La vista els diu
   amb la clau canònica (section.login.error.*) en la llengua de la interfície; sense traductor, la reserva valenciana
   de MISSATGES_ENTRADA, que és byte a byte el valor de ca.js. */
import { describe, expect, test } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { CODI_ENTRADA } from '../../data/errorsBackend.js';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';
import ca from '../../config/idiomes/ca.js';
import { textosOnboardingExtra } from './i18nOnboardingExtra.js';
import { codiDEntrada, esSilenciDEntrada, missatgeDEntrada, missatgeDEntradaAmbGoogle, toDeLErrorDEntrada } from './onboardingModel.js';

const LLENGUES = SUPPORTED_LANGUAGES.map(({ code }) => code);
const CASOS = [
  ['ALTES_TANCADES', 'section.login.error.altesTancades'],
  ['COMPTE_SUSPES', 'section.login.error.compteSuspes'],
  ['CORREU_GOOGLE_PENDENT', 'section.login.error.confirmaCorreuGoogle']
];
const errorDe = (nom) => Object.assign(new Error('No s’ha pogut completar l’entrada amb Google.', { cause: { error: 'access_denied' } }),
  { code: CODI_ENTRADA[nom] });

describe('K-CAB-ENT0108 · les tres frases de l’entrada amb Google, pel codi i en la llengua de la interfície', () => {
  test('les cinc llengües del selector són les de la prova', () => {
    expect(LLENGUES).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
  });

  test.each(CASOS)('%s: és un codi d’entrada conegut, no és cap silenci ni DESCONEGUT', (nom) => {
    expect(typeof CODI_ENTRADA[nom]).toBe('string');
    expect(codiDEntrada(errorDe(nom))).toBe(CODI_ENTRADA[nom]);
    expect(esSilenciDEntrada(errorDe(nom))).toBe(false);
  });

  test.each(CASOS)('%s: la reserva valenciana és byte a byte el valor de ca.js (%s)', (nom, clau) => {
    expect(typeof ca[clau]).toBe('string');
    expect(missatgeDEntrada(errorDe(nom))).toBe(ca[clau]);
    expect(missatgeDEntradaAmbGoogle(errorDe(nom), textosOnboardingExtra('en'))).toBe(ca[clau]);
  });

  for (const [nom, clau] of CASOS) {
    test.each(LLENGUES)(`${nom} · %s: missatgeDEntradaAmbGoogle diu la clau del diccionari d’eixa llengua`, (llengua) => {
      const t = createTranslator(llengua);
      const esperat = t(clau);
      expect(esperat).not.toBe(clau);
      if (llengua !== 'ca') expect(esperat).not.toBe(ca[clau]);
      const text = missatgeDEntradaAmbGoogle(errorDe(nom), textosOnboardingExtra(llengua), t);
      expect([llengua, text]).toEqual([llengua, esperat]);
      expect(text).not.toBe(textosOnboardingExtra(llengua).googleDesconegut);
      expect(text).not.toMatch(/access_denied|signup_disabled|user_banned|provider_email|\{/);
    });
  }

  test('les tres frases són diferents entre elles en cada llengua (cap codi cau en la frase d’un altre)', () => {
    for (const llengua of LLENGUES) {
      const t = createTranslator(llengua);
      const frases = CASOS.map(([nom]) => missatgeDEntradaAmbGoogle(errorDe(nom), textosOnboardingExtra(llengua), t));
      expect([llengua, new Set(frases).size]).toEqual([llengua, 3]);
    }
  });

  test('els altres codis no canvien: DESCONEGUT continua amb la frase de Google de textosOnboardingExtra, també amb traductor', () => {
    for (const llengua of LLENGUES) {
      const textos = textosOnboardingExtra(llengua);
      const t = createTranslator(llengua);
      expect(missatgeDEntradaAmbGoogle({ code: CODI_ENTRADA.DESCONEGUT }, textos, t)).toBe(textos.googleDesconegut);
      expect(missatgeDEntradaAmbGoogle({ code: CODI_ENTRADA.MASSA_INTENTS }, textos, t)).toBe(textos.googleMassaIntents);
    }
  });

  test('el to de l’avís: les altes tancades i el correu de Google pendent són avís (la persona no ha fet res mal); el compte suspés, error', () => {
    expect(toDeLErrorDEntrada(CODI_ENTRADA.ALTES_TANCADES)).toBe('avis');
    expect(toDeLErrorDEntrada(CODI_ENTRADA.CORREU_GOOGLE_PENDENT)).toBe('avis');
    expect(toDeLErrorDEntrada(CODI_ENTRADA.CORREU_PENDENT)).toBe('avis');
    expect(toDeLErrorDEntrada(CODI_ENTRADA.COMPTE_SUSPES)).toBe('error');
  });
});
