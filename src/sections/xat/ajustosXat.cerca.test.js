/* Revisió adversarial 260930 (P2, «Cerca als ajustos») · Els dos ajustos
   reals del full (el tema i la llengua) només existien com a capçalera de
   secció, i la cerca només mirava les etiquetes de les files: «llengua»,
   «idioma», «theme» o «hizkuntza» donaven «Cap ajust coincidix» quan
   l'ajust hi era. Ara la capçalera i les paraules clau del grup també es
   busquen, en la llengua de la interfície i en valencià. */
import { describe, expect, test } from 'vitest';
import { createTranslator } from '../../config/i18n.js';
import { cercaAjustos, etiquetaDeFila, pilaDeResultat } from './ajustosXat.js';

const etiquetes = (resultats, t) => resultats.map(({ fila }) => etiquetaDeFila(fila, t));

/* Un traductor de mentida, com els de les proves del model: el que no hi
   és torna la reserva en valencià. */
const traductor = (diccionari) => (clau, text) => diccionari[clau] ?? text;
const EN = traductor({
  'section.xat.ajustos.aparenca': 'Appearance',
  'section.xat.ajustos.tema': 'Theme',
  'section.xat.ajustos.llengua': 'Language',
  'section.xat.ajustos.tema.paraules': 'look colours colors night',
  'section.xat.ajustos.llengua.paraules': 'languages'
});

describe('cercaAjustos · capçaleres i paraules clau', () => {
  test('en valencià, «llengua» i «idioma» troben la secció Llengua de l’Aparença', () => {
    for (const terme of ['llengua', 'Idioma', 'idiomes', 'llengües']) {
      const resultats = cercaAjustos(terme);
      expect([terme, etiquetes(resultats)]).toEqual([terme, ['Llengua']]);
      expect(resultats[0]).toMatchObject({ pagina: 'aparenca', cami: ['arrel', 'aparenca'] });
    }
  });

  test('«tema» troba la secció Tema abans que l’opció que el conté per casualitat (sis-tema)', () => {
    expect(etiquetes(cercaAjustos('tema'))).toEqual(['Tema', 'Igual que el sistema']);
    expect(etiquetes(cercaAjustos('colors'))).toEqual(['Tema']);
  });

  test('en anglés, «theme» i «language» troben les seues seccions, i el valencià continua valent', () => {
    expect(etiquetes(cercaAjustos('theme', { t: EN }), EN)).toEqual(['Theme']);
    expect(etiquetes(cercaAjustos('language', { t: EN }), EN)).toEqual(['Language']);
    expect(etiquetes(cercaAjustos('llengua', { t: EN }), EN)).toEqual(['Language']);
    expect(etiquetes(cercaAjustos('night', { t: EN }), EN)).toEqual(['Theme']);
  });

  test('amb el traductor de veres, les capçaleres de cada llengua es troben pel seu nom', () => {
    const casos = [
      ['es', 'idioma', 'Idioma'],
      ['en', 'theme', 'Theme'],
      ['en', 'language', 'Language'],
      ['eu', 'gaia', 'Gaia'],
      ['eu', 'hizkuntza', 'Hizkuntza'],
      ['gl', 'lingua', 'Lingua']
    ];
    for (const [codi, terme, esperat] of casos) {
      const t = createTranslator(codi);
      expect([codi, terme, etiquetes(cercaAjustos(terme, { t }), t)[0]]).toEqual([codi, terme, esperat]);
    }
  });

  test('les paraules clau no fan soroll: les cerques d’abans donen el mateix', () => {
    expect(etiquetes(cercaAjustos('APARENCA'))).toEqual(['Aparença']);
    expect(etiquetes(cercaAjustos('memoria'))).toEqual(['Dades i memòria local']);
    expect(etiquetes(cercaAjustos('mode clar'))).toEqual(['Mode clar']);
    expect(etiquetes(cercaAjustos('fosc'))[0]).toBe('Mode fosc');
    expect(cercaAjustos('zzz')).toEqual([]);
  });

  test('la secció trobada obri la seua pàgina, i el focus hi torna al resultat', () => {
    const [llengua] = cercaAjustos('llengua');
    expect(llengua.fila).toMatchObject({ id: 'seccio-llengua', tipus: 'seccio' });
    expect(pilaDeResultat(llengua)).toEqual([{ id: 'arrel', origen: null }, { id: 'aparenca', origen: 'seccio-llengua' }]);
  });
});
