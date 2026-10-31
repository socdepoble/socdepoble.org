// @vitest-environment node
/* VQ · Fase 3a de l'eina de pobles nous (ordre nocturna 261030_0252, Fase 3;
   f3-ordres §VQ i seguiment del cicle 2, «legal-llista-emmagatzematge-sense-
   indexeddb») · La pàgina «Legal i privacitat» diu:
     · a l'apartat 20, la llista d'emmagatzematge del navegador, ara també la
       base de dades del navegador (IndexedDB): les carpetes locals de
       Multimèdia (socdepoble_arxius_locals_v1) i la cau de la Viquipèdia
       (sdp-viquipedia), i les dues claus de preferències noves;
     · a l'apartat 21, què passa quan prems «Porta-ho de la Viquipèdia».
   Cada afirmació s'ancora al codi: si un nom, un límit o el transport
   canvien, esta prova cau i el text legal s'ha de tornar a escriure.
   L'empremta nova de PAGE_COPY.legal l'aprova el Mestre (frontissa). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { legalContent } from './legalContent.js';
import { MAX_CARPETES_RECORDADES, NOM_BD_ARXIUS_LOCALS } from '../multimedia/bibliotecaCarpetesLocals.js';
import { MAXIM_ENTRADES, NOM_BD, VIDA_MS } from '../pobles/cauDeViquipedia.js';
import { CLAU_CONSENTIMENT } from '../pobles/consentimentViquipedia.js';
import { TEXTOS_VIQUIPEDIA } from '../pobles/CreditsDeViquipedia.jsx';
import { CAMPS_DE_FITXA } from '../pobles/fitxaDelPoble.js';
import { STORAGE_PREFIX } from '../../config/storage.js';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const textDe = (tros) => tros.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const recte = (text) => text.replace(/’/g, "'");
function apartat(numero) {
  const html = legalContent.html;
  const inici = html.indexOf(`<h4>${numero}. `);
  const fi = html.indexOf(`<h4>${numero + 1}. `, inici);
  expect([numero, inici > 0, fi > inici]).toEqual([numero, true, true]);
  return html.slice(inici, fi);
}
const conte = (text, trossos) => {
  for (const tros of trossos) expect([tros, text.includes(tros)]).toEqual([tros, true]);
};

describe('Legal · apartat 20: la base de dades del navegador', () => {
  test('nomena les dues bases IndexedDB amb el nom que fa servir el codi', () => {
    const vint = apartat(20);
    expect(vint).toContain('<p><strong>Base de dades del navegador</strong> (<em>IndexedDB</em>)');
    expect(NOM_BD_ARXIUS_LOCALS).toBe('socdepoble_arxius_locals_v1');
    expect(vint).toContain(`<code>${NOM_BD_ARXIUS_LOCALS}</code>`);
    expect(vint).toContain(`<code>${NOM_BD}</code>`);
  });

  test('les carpetes locals: què es guarda, el límit i com s’esborra, com fa el codi', () => {
    const carpetes = textDe(apartat(20).split('<li>').find((li) => li.startsWith(`<code>${NOM_BD_ARXIUS_LOCALS}</code>`)) ?? '');
    conte(carpetes, [
      `(com a molt ${MAX_CARPETES_RECORDADES})`,
      'el nom de cada carpeta', "l'última vegada que l'has oberta",
      'No hi guarda cap fitxer ni puja res al servidor', 'quan prems «Oblidar» o quan ixes de la sessió'
    ]);
    // L'eixida de la sessió les oblida de veres (SessionContext · DESPRES_DE_TANCAR).
    const sessio = llig('src/app/contexts/SessionContext.jsx');
    expect(sessio).toMatch(/DESPRES_DE_TANCAR = Object\.freeze\(\[[^\]]*oblidaCarpetesLocalsEnEixir/);
    expect(llig('src/sections/multimedia/textosGestorLocal.js')).toContain("'Oblidar'");
  });

  test('la cau de la Viquipèdia: dades públiques, 200 pobles, 30 dies, i el que diu de tu', () => {
    const cau = textDe(apartat(20).split('<li>').find((li) => li.startsWith(`<code>${NOM_BD}</code>`)) ?? '');
    conte(cau, [
      `com a molt ${MAXIM_ENTRADES} pobles`, 'passats 30 dies', 'No hi ha cap dada teua',
      'diu de quins pobles les has portades', `«${recte(TEXTOS_VIQUIPEDIA.deixa[1])}»`, `«${recte(TEXTOS_VIQUIPEDIA.porta[1])}»`
    ]);
    expect(VIDA_MS.complet).toBe(30 * 24 * 60 * 60 * 1000);
  });

  test('les dues claus de preferències noves, amb el nom físic de storage.js', () => {
    const vint = apartat(20);
    expect(vint).toContain(`<code>${STORAGE_PREFIX}${CLAU_CONSENTIMENT}</code>`);
    const oblit = /CLAU_OBLIT_CARPETES_PENDENT = '([^']+)'/.exec(llig('src/app/contexts/SessionContext.jsx'))?.[1];
    expect(oblit).toBe('arxius-locals-oblit-pendent');
    expect(vint).toContain(`<code>${STORAGE_PREFIX}${oblit}</code>`);
  });
});

describe('Legal · apartat 21: «Porta-ho de la Viquipèdia»', () => {
  const paragraf = () => textDe(apartat(21).split('<p>')
    .find((p) => p.startsWith("<strong>Les dades de la Viquipèdia per a completar la fitxa d'un poble.</strong>")) ?? '');

  test('només en prémer el botó; què rep Wikimedia i què no', () => {
    const text = paragraf();
    expect(text).not.toBe('');
    conte(text, [
      `el botó «${recte(TEXTOS_VIQUIPEDIA.porta[1])}»`,
      'Mentre no el prems, el teu navegador no es connecta amb la Viquipèdia, Wikidata ni Wikimedia Commons',
      'Wikimedia Foundation',
      'reben el nom del poble i, com en qualsevol connexió a internet, la teua adreça IP',
      "Sóc de Poble no hi envia galetes, cap identificador teu ni l'adreça de la pàgina",
      'Les fotos de Commons es baixen dels seus servidors de la mateixa manera, sense galetes',
      `«${recte(TEXTOS_VIQUIPEDIA.creditsTitol[1])}»`,
      `«${recte(TEXTOS_VIQUIPEDIA.recorda[1])}»`, `<code>${STORAGE_PREFIX}${CLAU_CONSENTIMENT}</code>`.replace(/<[^>]+>/g, ''),
      "A l'aplicació nativa, de moment, el botó no hi és."
    ]);
    // El que fa el codi: el que falta és el de CAMPS_DE_FITXA.
    expect(text).toContain("li falta l'entradilla, la foto, la província o la comarca");
    expect(CAMPS_DE_FITXA).toEqual(['content', 'image_url', 'provincia', 'comarca']);
  });

  test('el transport és el que diu: sense galetes ni referent, a l’API i a les fotos', () => {
    expect(llig('src/data/adaptadors/sollutia/creaFrontissa.js')).toContain("credentials: 'omit'");
    expect(llig('src/data/adaptadors/viquipedia/client.js')).toContain("referrerPolicy: 'no-referrer'");
    const credits = llig('src/sections/pobles/CreditsDeViquipedia.jsx');
    expect(credits).toContain('crossOrigin="anonymous"');
    expect(credits).toContain('referrerPolicy="no-referrer"');
    // A l'app nativa el panell no es munta.
    expect(llig('src/sections/pobles/fitxaDelPoble.js')).toMatch(/esAppNativa\(\)\) return false/);
  });
});

/* Gauntlet 261030, cicle 3 (legal-11-eixides-sense-wikimedia) · L'apartat 11
   tancava la llista d'eixides amb el traductor tot sol, i l'apartat 21 diu que
   Wikimedia i OpenStreetMap també reben la IP quan prems el seu botó. Cap dels
   dos és encarregat del tractament: van a l'excepció, no a la llista. */
describe('Legal · apartat 11: tot el que ix cap als serveis de fora d’un botó', () => {
  test('l’excepció nomena els tres botons amb el nom del codi, i ni Wikimedia ni OpenStreetMap són encarregats', () => {
    const onze = apartat(11);
    conte(textDe(onze), [
      'excepte el que el teu navegador envia, amb la teua adreça IP, als serveis de fora que tries fer servir amb un botó (apartat 21)',
      'el text de les pàgines que tries traduir amb el botó «Traduir»',
      `el nom del poble que completes amb «${recte(TEXTOS_VIQUIPEDIA.porta[1])}»`,
      'la zona del mapa que mires amb «Vore mapa»'
    ]);
    expect(llig('src/config/idiomes/ca.js')).toMatch(/'section\.mur\.mapa\.voreMapa':\s*["']Vore mapa["']/);
    const llista = onze.slice(onze.indexOf('<ul>'), onze.indexOf('</ul>'));
    expect(llista).not.toMatch(/Wikimedia|Viquip|OpenStreetMap/);
    // L'apartat 21 explica els tres.
    conte(textDe(apartat(21)), ['«Vore mapa»', '«Traduir»', `«${recte(TEXTOS_VIQUIPEDIA.porta[1])}»`]);
  });
});
