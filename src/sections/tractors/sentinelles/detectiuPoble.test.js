// @vitest-environment node
/* Sentinella 7 · Detectiu del Poble amb missatges inventats. Les dades
   personals de prova es componen a trossos (cap literal sencer al codi) i són
   sintètiques: el telèfon i els documents no són de ningú. */
import { describe, expect, test } from 'vitest';
import { SENTINELLA_DETECTIU, anonimitza, observaDetectiu } from './detectiuPoble.js';

const sonda = (...trossos) => trossos.join('');
const CORREU = sonda('vei.prova', '@', 'exemple.org');
const TELEFON = sonda('600 ', '000 ', '000');
const INTERNACIONAL = sonda('+34 ', '611', '22', '33', '44');
const DNI = sonda('0000', '0000', 'T');
const NIE = sonda('X', '0000000', 'T');
const IBAN = sonda('ES00 ', '0000 0000 ', '0000 0000 0000');

const missatges = (...textos) => ({ missatges: textos.map((text) => ({ text, origen: 'bústia' })) });
const codis = (eixida) => eixida.avisos.map((a) => a.codi);

describe('anonimitza', () => {
  test('amaga correus, telèfons, DNI, NIE i IBAN i els compta', () => {
    const { text, comptes } = anonimitza(`Escriviu-me a ${CORREU} o al ${TELEFON} (${INTERNACIONAL}). DNI ${DNI}, NIE ${NIE}, compte ${IBAN}.`);
    for (const dada of [CORREU, TELEFON, INTERNACIONAL, DNI, NIE, IBAN]) expect(text).not.toContain(dada);
    expect(text).toContain('[correu]');
    expect(text).toContain('[telèfon]');
    expect(text).toContain('[DNI]');
    expect(text).toContain('[NIE]');
    expect(text).toContain('[IBAN]');
    expect(comptes).toEqual({ correu: 1, iban: 1, nie: 1, dni: 1, telefon: 2 });
  });

  test('no amaga els números normals: dates, imports, anys ni codis postals', () => {
    const text = 'El 12/03/2026 vam pagar 45,50 € al carrer Major 12, 46800, i fa 3 anys.';
    expect(anonimitza(text)).toEqual({ text, comptes: { correu: 0, iban: 0, nie: 0, dni: 0, telefon: 0 } });
  });
});

describe('observaDetectiu', () => {
  test('troba els temes recurrents per missatge, en valencià i en castellà', () => {
    const eixida = observaDetectiu(missatges(
      'El fanal del carrer Nou no funciona i està fosc.',
      'La farola de la plaza lleva un mes apagada.',
      'Fa dies que no hi ha llum a la placeta: fanal, fanal i fanal.',
      'El contenidor de fems està ple.',
      'Hi ha un clot enorme a la vorera.'
    ));
    expect(eixida.avisos.find((a) => a.font === 'tema:enllumenat')).toMatchObject({ codi: 'DET-RECURRENT', severitat: 'groga' });
    expect(eixida.avisos.find((a) => a.font === 'tema:enllumenat').missatge).toBe('Enllumenat: 3 de 5 missatges (60 %) en parlen.');
    expect(eixida.avisos.filter((a) => a.codi === 'DET-RECURRENT')).toHaveLength(1);
    expect(eixida.informe).toContain('- Enllumenat: 3 (60 %)');
    expect(eixida.informe).toContain('- Fems i reciclatge: 1 (20 %)');
  });

  test('cinc missatges o més i més d’una quarta part: roja', () => {
    const textos = [
      'No passa l’autobús.', 'El bus no para al poble.', 'L’horari del bus ha canviat.', 'No hi ha parada coberta.',
      'Falta transport el diumenge.', 'Cap altra cosa.', 'Res de res.'
    ];
    expect(observaDetectiu(missatges(...textos)).avisos.find((a) => a.codi === 'DET-RECURRENT')).toMatchObject({ severitat: 'roja', font: 'tema:transport' });
  });

  test('una queixa recurrent però minoritària és groga', () => {
    const textos = [
      'Falta pressió a l’aigua.', 'No tenim agua caliente.', 'L’aixeta de la font goteja.',
      ...Array.from({ length: 10 }, (_v, i) => `Missatge sense tema número ${i}.`)
    ];
    const recurrent = observaDetectiu(missatges(...textos)).avisos.find((a) => a.codi === 'DET-RECURRENT');
    expect(recurrent).toMatchObject({ severitat: 'groga', font: 'tema:aigua' });
  });

  test('les dades personals s’amaguen abans de comptar i l’informe no porta cap text original', () => {
    const eixida = observaDetectiu(missatges(
      `Soc la del ${TELEFON}: el fanal continua apagat.`,
      `Escriviu a ${CORREU}, el fanal no va.`,
      'El fanal de baix tampoc.'
    ));
    expect(eixida.avisos.find((a) => a.codi === 'DET-ANONIMITZAT').missatge).toBe('S’han amagat 2 dades personals abans de comptar (1 correu, 1 telèfon).');
    const tot = JSON.stringify(eixida);
    for (const dada of [TELEFON, CORREU, 'continua apagat']) expect(tot).not.toContain(dada);
  });

  test('l’avís diu cada tipus de dada amb paraules, en singular o en plural', () => {
    const eixida = observaDetectiu(missatges(`Al ${TELEFON} o al ${INTERNACIONAL}.`, `Compte ${IBAN}, ${CORREU} i DNI ${DNI}.`));
    expect(eixida.avisos.find((a) => a.codi === 'DET-ANONIMITZAT').missatge)
      .toBe('S’han amagat 5 dades personals abans de comptar (1 correu, 1 IBAN, 1 DNI, 2 telèfons).');
  });

  test('l’origen no copia cap text: només bústia, Pàgina Universal, altres orígens o sense origen', () => {
    const NOM = sonda('Maria ', 'Sintètica ', 'de Prova');
    const eixida = observaDetectiu({
      missatges: [
        { text: 'El fanal no va.', origen: CORREU },
        { text: 'El fanal continua igual.', origen: NOM },
        { text: 'El fanal de baix.', origen: 'Pàgina Universal' },
        { text: 'El fanal de dalt.', origen: 'bustia_octubre.json' },
        { text: 'El fanal de la plaça.' }
      ]
    });
    expect(eixida.informe.split('\n')[0]).toBe('5 missatges llegits (bústia: 1, Pàgina Universal: 1, altres orígens: 2, sense origen: 1).');
    const tot = JSON.stringify(eixida);
    for (const dada of [CORREU, NOM, 'Sintètica', 'bustia_octubre']) expect(tot).not.toContain(dada);
  });

  test('les paraules que es repetixen fora dels temes, sense noms propis', () => {
    const eixida = observaDetectiu(missatges(
      'Les obres de la piscina no acaben. Ho diu Vicent Ferrer.',
      'Quan obriran la piscina? Pregunteu a Vicent.',
      'La piscina municipal fa falta. Vicent ho sap.'
    ));
    const paraules = eixida.avisos.find((a) => a.codi === 'DET-PARAULES');
    expect(paraules.missatge).toContain('piscina (3)');
    expect(paraules.missatge).not.toMatch(/vicent/i);
  });

  test('un nom a l’inici del missatge o darrere d’un tractament (Sra.) tampoc es compta', () => {
    const eixida = observaDetectiu(missatges(
      'Sra. Ferrer demana la piscina coberta.',
      'Ferrer torna a preguntar per la piscina.',
      'Piscina tancada, diu la Sra. Ferrer, i fa falta.'
    ));
    const paraules = eixida.avisos.find((a) => a.codi === 'DET-PARAULES');
    expect(paraules.missatge).toContain('piscina (3)');
    expect(paraules.missatge).not.toMatch(/ferrer/i);
  });

  test('sense missatges: informa', () => {
    expect(codis(observaDetectiu({ missatges: [] }))).toEqual(['DET-SENSE-MISSATGES']);
    expect(codis(observaDetectiu(null))).toEqual(['DET-SENSE-MISSATGES']);
  });
});

describe('l’entrada', () => {
  const { prepara } = SENTINELLA_DETECTIU.entrada;

  test('un JSON amb textos o amb objectes, i un text amb un missatge per paràgraf', () => {
    const json = new TextEncoder().encode(JSON.stringify({ missatges: ['Un.', { text: 'Dos.', origen: 'Pàgina Universal' }] }));
    expect(prepara([{ nom: 'bustia.json', bytes: json }, { nom: 'notes.txt', text: 'Tres\nlínies.\n\nQuatre.' }]).missatges).toEqual([
      { text: 'Un.', origen: 'bustia.json' },
      { text: 'Dos.', origen: 'Pàgina Universal' },
      { text: 'Tres\nlínies.', origen: 'notes.txt' },
      { text: 'Quatre.', origen: 'notes.txt' }
    ]);
  });

  test('un text sense paràgrafs: un missatge per línia', () => {
    expect(prepara([{ nom: 'l.txt', text: 'U\nDos\n' }]).missatges.map((m) => m.text)).toEqual(['U', 'Dos']);
  });

  test('un text desat en windows-1252 o en UTF-16 es llig amb els accents', () => {
    const frase = 'La farmàcia tanca massa prompte.';
    const latin1 = Uint8Array.from(frase, (c) => c.charCodeAt(0));
    const utf16 = Uint8Array.from([0xff, 0xfe, ...[...frase].flatMap((c) => [c.charCodeAt(0) & 0xff, c.charCodeAt(0) >> 8])]);
    expect(prepara([{ nom: 'a.txt', bytes: latin1 }, { nom: 'b.txt', bytes: utf16 }]).missatges.map((m) => m.text)).toEqual([frase, frase]);
  });
});
