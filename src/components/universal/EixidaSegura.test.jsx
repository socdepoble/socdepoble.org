import { describe, expect, test } from 'vitest';
import { ERROR_EIXIDA, TEXTOS_AVIS_EIXIDA, textPendentsEixida, textosAvisEixida } from './EixidaSegura.jsx';

/* Gauntlet R32.6 (PERFIL-01 i I18N-02) · L'avís que diu QUÈ s'esborrarà en
   eixir, en les cinc llengües de la interfície. Sense llengua, el valencià de
   sempre lletra per lletra: FullAjustos, ControlSection i DetallAjust no en
   passen cap i han de pintar exactament el mateix que abans. */
const FITXA = { entitat: 'fitxa', camps: ['title', 'lead'] };
const NOTA = { entitat: 'nota', camps: ['content'] };
const LITERALS_CA = ['Tens ', 'canvi', 'Si ixes ara', 'a la fitxa', 'a Notes', 'l’entradilla', 'presentació', ERROR_EIXIDA,
  'Encara hi ha canvis sense desar', 'No eixir encara', 'Eixir igualment'];

describe('textPendentsEixida', () => {
  test('sense llengua, el text valencià de sempre (byte a byte)', () => {
    expect(textPendentsEixida([NOTA])).toBe('Tens 1 canvi que el servidor encara no té (a Notes: 1 nota). Si ixes ara, s’esborraran d’este dispositiu.');
    expect(textPendentsEixida([FITXA, NOTA, { ...NOTA }])).toBe('Tens 4 canvis que el servidor encara no té (a la fitxa: el nom, l’entradilla; a Notes: 2 notes). Si ixes ara, s’esborraran d’este dispositiu.');
    expect(textPendentsEixida([{ entitat: 'fitxa', camps: ['desconegut'] }])).toBe('Tens 1 canvi que el servidor encara no té (a la fitxa: desconegut). Si ixes ara, s’esborraran d’este dispositiu.');
    expect(textPendentsEixida()).toBe('Tens 0 canvis que el servidor encara no té. Si ixes ara, s’esborraran d’este dispositiu.');
    expect(textPendentsEixida([NOTA], 'ca')).toBe(textPendentsEixida([NOTA]));
  });

  test.each([
    ['es', 'Tienes 1 cambio que el servidor todavía no tiene (en Notas: 1 nota). Si sales ahora, se borrará de este dispositivo.',
      'Tienes 4 cambios que el servidor todavía no tiene (en la ficha: el nombre, la entradilla; en Notas: 2 notas). Si sales ahora, se borrarán de este dispositivo.'],
    ['en', 'You have 1 change that the server does not have yet (in Notes: 1 note). If you sign out now, it will be deleted from this device.',
      'You have 4 changes that the server does not have yet (in the profile: the name, the standfirst; in Notes: 2 notes). If you sign out now, they will be deleted from this device.'],
    ['eu', 'Zerbitzariak oraindik ez duen aldaketa 1 duzu (Oharretan: ohar 1). Orain irteten bazara, gailu honetatik ezabatuko da.',
      'Zerbitzariak oraindik ez dituen 4 aldaketa dituzu (fitxan: izena, sarrera; Oharretan: 2 ohar). Orain irteten bazara, gailu honetatik ezabatuko dira.'],
    ['gl', 'Tes 1 cambio que o servidor aínda non ten (en Notas: 1 nota). Se saes agora, borrarase deste dispositivo.',
      'Tes 4 cambios que o servidor aínda non ten (na ficha: o nome, a entradiña; en Notas: 2 notas). Se saes agora, borraranse deste dispositivo.'],
  ])('en %s, els noms dels camps, el plural de «nota» i la frase sencera', (llengua, un, quatre) => {
    expect(textPendentsEixida([NOTA], llengua)).toBe(un);
    expect(textPendentsEixida([FITXA, NOTA, { ...NOTA }], llengua)).toBe(quatre);
    for (const literal of LITERALS_CA) expect(quatre).not.toContain(literal);
  });

  test('cada camp de la fitxa té nom en les cinc llengües', () => {
    const camps = ['title', 'subtitle', 'lead', 'content', 'logoImage', 'heroImage', 'copyright'];
    for (const llengua of ['ca', 'es', 'en', 'eu', 'gl']) {
      for (const camp of camps) expect(textPendentsEixida([{ entitat: 'fitxa', camps: [camp] }], llengua)).not.toContain(`: ${camp})`);
    }
  });

  test('una llengua que no és de les cinc (o una clau d’Object) és el valencià', () => {
    expect(textPendentsEixida([NOTA], 'fr')).toBe(textPendentsEixida([NOTA]));
    expect(textPendentsEixida([NOTA], 'constructor')).toBe(textPendentsEixida([NOTA]));
    expect(textPendentsEixida([{ entitat: 'fitxa', camps: ['toString'] }], 'en')).toContain('in the profile: toString');
  });
});

describe('textosAvisEixida', () => {
  test('el valencià conserva ERROR_EIXIDA i els literals de sempre', () => {
    expect(ERROR_EIXIDA).toBe('No s’ha pogut tancar la sessió.');
    expect(textosAvisEixida()).toEqual({ titol: 'Encara hi ha canvis sense desar', noEixir: 'No eixir encara', eixirIgualment: 'Eixir igualment', error: ERROR_EIXIDA });
    expect(textosAvisEixida('fr')).toBe(TEXTOS_AVIS_EIXIDA.ca);
    expect(textosAvisEixida('constructor')).toBe(TEXTOS_AVIS_EIXIDA.ca);
  });

  test.each([
    ['es', 'No se ha podido cerrar la sesión.'],
    ['en', 'Could not sign out.'],
    ['eu', 'Ezin izan da saioa itxi.'],
    ['gl', 'Non se puido pechar a sesión.'],
  ])('en %s, títol, botons i error sense cap literal valencià', (llengua, error) => {
    const textos = textosAvisEixida(llengua);
    expect(textos.error).toBe(error);
    for (const text of Object.values(textos)) {
      expect(text).toBeTruthy();
      for (const literal of LITERALS_CA) expect(text).not.toContain(literal);
    }
  });
});
