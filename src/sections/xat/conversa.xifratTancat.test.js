/* Onada R30 · R29-E2EE-02 (decisió tancada, pla R30 §4) · Un missatge xifrat
   que este dispositiu no ha pogut obrir té el mateix text serè a la cita, a
   la barra de resposta i a l'anunci en viu (textDeCita, anunciDeNous) que a
   la bombolla, en les cinc llengües, i mai el codi tècnic. El predicat
   (esXifratTancat) és el mateix de la còpia (copiaSeguretatXat.js). */
import { describe, expect, test } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../config/i18n.js';
import CA from '../../config/idiomes/ca.js';
import { anunciDeNous, CODIS_SENSE_CLAU_AL_DISPOSITIU, esXifratTancat, textDeCita, textXifratTancat, TEXT_XIFRAT_NO_OBERT, TEXT_XIFRAT_TANCAT } from './conversa.js';
import { mapejaMissatge } from './missatges.js';

const TEXTOS = Object.freeze({
  ca: 'Missatge xifrat d’extrem a extrem en un altre dispositiu',
  es: 'Mensaje cifrado de extremo a extremo en otro dispositivo',
  en: 'End-to-end encrypted message on another device',
  eu: 'Beste gailu batean muturretik muturrera zifratutako mezua',
  gl: 'Mensaxe cifrada de extremo a extremo noutro dispositivo'
});
/* Onada R30 · R29-E2EE-02 · Quan no és una clau que falta al dispositiu (integritat, clau nova
   sense confirmar, codi desconegut), el text neutre: igual de serè, i sempre cert. */
const NO_OBERT = Object.freeze({
  ca: 'No s’ha pogut obrir este missatge xifrat',
  es: 'No se ha podido abrir este mensaje cifrado',
  en: 'This encrypted message could not be opened',
  eu: 'Ezin izan da zifratutako mezu hau ireki',
  gl: 'Non se puido abrir esta mensaxe cifrada'
});

const tancat = (codi = 'epoca-desconeguda') => mapejaMissatge({
  id: 'm-tancat', filId: 'f-1', usuariId: 'pepa', autorNom: 'Pepa', seq: 7, text: null,
  seguretat: { xifrat: true, verificat: false, codi }
}, 'jo');

describe('R29-E2EE-02 · esXifratTancat', () => {
  test('només un xifrat que no ha verificat el pipeline', () => {
    expect(esXifratTancat(tancat())).toBe(true);
    expect(esXifratTancat({ seguretat: { xifrat: true, codi: 'claus-bloquejades' } })).toBe(true);
    expect(esXifratTancat({ seguretat: { xifrat: true, verificat: true } })).toBe(false);
    expect(esXifratTancat({ seguretat: { xifrat: false, verificat: false } })).toBe(false);
    for (const res of [null, undefined, {}, { text: 'hola' }, { seguretat: null }]) expect(esXifratTancat(res)).toBe(false);
  });

  test('la reserva del codi és el valor exacte del diccionari valencià', () => {
    const [clau, reserva] = TEXT_XIFRAT_TANCAT;
    expect(clau).toBe('section.xat.xifratge.tancat');
    expect(CA[clau]).toBe(reserva);
    expect(reserva).toBe(TEXTOS.ca);
    const [clauNeutra, reservaNeutra] = TEXT_XIFRAT_NO_OBERT;
    expect(clauNeutra).toBe('section.xat.xifratge.noObert');
    expect(CA[clauNeutra]).toBe(reservaNeutra);
    expect(reservaNeutra).toBe(NO_OBERT.ca);
  });

  test('«en un altre dispositiu» només quan a este li falta la clau; la integritat i la resta, el text neutre', () => {
    for (const codi of ['epoca-desconeguda', 'sense-epoca', 'epoca-saltada', 'sense-context', 'claus-bloquejades']) {
      expect(CODIS_SENSE_CLAU_AL_DISPOSITIU.has(codi)).toBe(true);
      expect(textXifratTancat(tancat(codi))).toBe(TEXT_XIFRAT_TANCAT);
    }
    for (const codi of ['xifrat-manipulat', 'firma-invalida', 'repeticio', 'autor-no-autoritzat', 'bifurcacio',
      'contingut-invalid', 'adjunt-manipulat', 'clau-nova-sense-confirmar', 'kid-no-fixat', 'codi-que-encara-no-existix']) {
      expect(textXifratTancat(tancat(codi))).toBe(TEXT_XIFRAT_NO_OBERT);
    }
    /* Sense codi (el valor per defecte de tancat() no hi entra): el text neutre. */
    expect(textXifratTancat({ seguretat: { xifrat: true, verificat: false } })).toBe(TEXT_XIFRAT_NO_OBERT);
    expect(textXifratTancat(null)).toBe(TEXT_XIFRAT_NO_OBERT);
  });
});

describe('R29-E2EE-02 · la cita, la barra de resposta i l’anunci en viu', () => {
  test.each(Object.keys(TEXTOS))('%s · textDeCita i anunciDeNous diuen el text serè, sense codi', (llengua) => {
    const t = createTranslator(llengua);
    for (const [codi, textos] of [['sense-context', TEXTOS], ['epoca-desconeguda', TEXTOS], ['xifrat-manipulat', NO_OBERT], ['clau-nova-sense-confirmar', NO_OBERT]]) {
      const text = textDeCita(tancat(codi), t);
      expect(text).toBe(textos[llengua]);
      expect(text).not.toContain(codi);
      expect(anunciDeNous([tancat(codi)], t)).toBe(`Pepa: ${textos[llengua]}`);
    }
  });

  test('la làpida i el bloqueig manen; un xifrat obert diu el seu text', () => {
    const t = createTranslator('ca');
    expect(textDeCita({ ...tancat(), esborrat: true }, t)).toBe("S'ha esborrat este missatge");
    expect(textDeCita({ ...tancat(), bloquejat: true }, t)).toBe('Missatge amagat');
    expect(textDeCita({ text: '*Bon* dia', seguretat: { xifrat: true, verificat: true } }, t)).toBe('Bon dia');
    expect(textDeCita({ text: '', tipus: 'imatge' }, t)).toBe('Foto adjunta');
  });
});
