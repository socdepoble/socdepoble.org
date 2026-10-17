/**
 * Gauntlet 261016_1530 (Bloc 3.6.6; relleu F25; MCR b36_xat.3) · La IAIA
 * local busca a la Wiki pública del paquet i contesta amb els 3 documents més
 * pròxims. Ací es prova el mòdul pur (tokenització, índex, cerca i resposta),
 * la càrrega a demanda amb les seues eixides de reserva i, amb la Wiki de
 * veres, que els enllaços porten a documents que la Wiki pinta.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  DOCUMENTS_PER_RESPOSTA, ENCAPCALAMENT_DE_LA_WIKI, RUTA_DE_LA_WIKI, TEMPS_MAXIM_DE_LA_WIKI,
  cerca, componResposta, construeixIndex, oblidaIndexDeLaWiki, respostaDeLaIAIA, rutaDeDocumentWiki,
  termesDeLaPregunta, titolDeDocument, tokenitza
} from './iaiaLocal.js';
import { wikiManifest } from './wikiManifest.js';
import { SECTIONS } from '../config/sections.js';
import { extreuEditorial } from '../sections/wiki-de-poble/parseMarkdown.js';

afterEach(() => { vi.useRealTimers(); oblidaIndexDeLaWiki(); });

const doc = (id, content, extra = {}) => ({ id, title: id, subtitle: '', tags: [], attributes: {}, content, ...extra });

const FIXTURA = [
  doc('pedra_seca', '# La pedra seca\n\nMurs de pedra seca sense ciment, com els marges dels bancals.'),
  doc('bancals', '# Els bancals\n\nEls marges sostenen la terra. La pedra hi apareix de passada.'),
  doc('tomaques', '# Calendari de les tomaques\n\nQuan es planten les tomaques de penjar.', { subtitle: 'Hort i reg', tags: ['hort'] }),
  doc('sollutia', '# Soci Sollutia\n\nSollutia és l’amfitrió de l’app.', { attributes: { description: 'Infraestructura i Model B' } }),
  doc('cuina', '# Receptes\n\nLa cassola i el pa de casa.')
];

describe('tokenitza i termesDeLaPregunta', () => {
  test('minúscules, sense diacrítics, «l·l» com a «ll», sense paraules buides ni curtes', () => {
    expect(tokenitza('Què és la INTEL·LIGÈNCIA artificial del poble? 2026 ok')).toEqual(['intelligencia', 'artificial', 'poble']);
    expect(tokenitza("L'Ànima de la IAIA")).toEqual(['anima', 'iaia']);
  });

  test('el destí d’un enllaç del Markdown i les adreces soltes no compten', () => {
    expect(tokenitza('[Genotip](?item=02_genotip) i https://exemple.cat/coses')).toEqual(['genotip']);
  });

  test('una pregunta que només saluda o nomena la IAIA no busca res', () => {
    for (const pregunta of ['Bon dia, IAIA', 'Hola IAIA MarIA!', 'Bona nit', 'Gràcies, iaia', '', null, '   ']) {
      expect([pregunta, termesDeLaPregunta(pregunta)]).toEqual([pregunta, []]);
    }
  });

  test('amb una paraula de veres, el nom de la IAIA també busca, i cap terme no es repetix', () => {
    expect(termesDeLaPregunta('Què és la pedra seca?')).toEqual(['pedra', 'seca']);
    expect(termesDeLaPregunta('La personalitat de la IAIA, la IAIA!')).toEqual(['personalitat', 'iaia']);
  });
});

describe('titolDeDocument', () => {
  test('la capçalera «# Títol» en text pla, sense punt final; sense capçalera, el del manifest', () => {
    expect(titolDeDocument(doc('a', '# La **pedra** [seca](?item=x).\n\nCos'))).toBe('La pedra seca');
    expect(titolDeDocument(doc('b', '﻿\n\n# Amb BOM\r\nCos'))).toBe('Amb BOM');
    expect(titolDeDocument(doc('c', 'Cos sense capçalera\n# Tard', { title: 'Títol del manifest' }))).toBe('Títol del manifest');
    expect(titolDeDocument({ id: 'nomes-id' })).toBe('nomes-id');
  });

  test('a tota la Wiki del paquet, és el títol que pinta la pàgina del document (extreuEditorial)', () => {
    expect(wikiManifest.items.length).toBeGreaterThan(0);
    for (const item of wikiManifest.items) {
      const esperat = extreuEditorial(item.content).titol || item.title || item.id;
      expect([item.id, titolDeDocument(item)]).toEqual([item.id, esperat]);
    }
  });
});

describe('cerca', () => {
  const index = construeixIndex(FIXTURA);

  test('el document que ho porta al títol va primer, i n’ix com a molt 3', () => {
    const resultats = cerca(index, 'Murs de pedra seca');
    expect(resultats.map((r) => r.id)).toEqual(['pedra_seca', 'bancals']);
    expect(resultats[0]).toMatchObject({ titol: 'La pedra seca' });
    expect(resultats[0].puntuacio).toBeGreaterThan(resultats[1].puntuacio);
    expect(cerca(index, 'pedra seca tomaques sollutia cassola marges')).toHaveLength(DOCUMENTS_PER_RESPOSTA);
  });

  test('el subtítol, la descripció i les etiquetes també compten', () => {
    expect(cerca(index, 'hort').map((r) => r.id)).toEqual(['tomaques']);
    expect(cerca(index, 'infraestructura').map((r) => r.id)).toEqual(['sollutia']);
  });

  test('cap document sense cap paraula de la pregunta; salutacions i paraules desconegudes no troben res', () => {
    expect(cerca(index, 'zzqx vaixell')).toEqual([]);
    expect(cerca(index, 'Bon dia, IAIA')).toEqual([]);
    expect(cerca(construeixIndex([]), 'pedra')).toEqual([]);
    expect(cerca(null, 'pedra')).toEqual([]);
  });

  test('els empats es desfan per l’identificador: el resultat és estable', () => {
    const bessons = construeixIndex([doc('b', '# Riu'), doc('a', '# Riu'), doc('c', '# Riu')]);
    expect(cerca(bessons, 'riu').map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  test('un ítem sense id o sense cap paraula no entra a l’índex', () => {
    expect(construeixIndex([{ content: '# Sense id' }, doc('ok', '', { title: '' }), null]).documents).toEqual([]);
  });
});

describe('componResposta i rutaDeDocumentWiki', () => {
  test('l’encapçalament literal i una línia per document amb el títol i l’enllaç /wikidepoble?item=<slug>', () => {
    const text = componResposta([{ id: 'pedra_seca', titol: 'La pedra seca' }, { id: 'ADR-2026-09-SOLLUTIA-MODEL-B', titol: 'Model B' }]);
    expect(text).toBe([
      'Això és el que en sé per la Wiki de Poble:',
      '· La pedra seca — /wikidepoble?item=pedra_seca',
      '· Model B — /wikidepoble?item=ADR-2026-09-SOLLUTIA-MODEL-B'
    ].join('\n'));
    expect(ENCAPCALAMENT_DE_LA_WIKI).toBe('Això és el que en sé per la Wiki de Poble:');
    expect(componResposta([])).toBeNull();
    expect(componResposta(null)).toBeNull();
  });

  test('la ruta és la de la secció Wiki de Poble, amb el slug codificat', () => {
    expect(SECTIONS.find((seccio) => seccio.id === 'wikidepoble')).toMatchObject({ path: RUTA_DE_LA_WIKI });
    expect(rutaDeDocumentWiki('a b&c')).toBe('/wikidepoble?item=a%20b%26c');
  });

  /* Revisió adversarial (Bloc 3.6.6) · encodeURIComponent deixa «!'()*» tal
     qual, i la bombolla no els reconeix dins d'una ruta: es codifiquen tots. */
  test('codifica també «!\'()*», i la Wiki llig el mateix id', () => {
    const ruta = rutaDeDocumentWiki("a(b)!c'd*e");
    expect(ruta).toBe('/wikidepoble?item=a%28b%29%21c%27d%2Ae');
    expect(new URL(ruta, 'http://localhost').searchParams.get('item')).toBe("a(b)!c'd*e");
    expect(rutaDeDocumentWiki('pedra_seca.v2~x-y')).toBe('/wikidepoble?item=pedra_seca.v2~x-y');
    // El punt final, que la bombolla llegiria com el de la frase.
    expect(rutaDeDocumentWiki('genoma.')).toBe('/wikidepoble?item=genoma%2E');
    expect(new URL(rutaDeDocumentWiki('genoma.'), 'http://localhost').searchParams.get('item')).toBe('genoma.');
  });
});

describe('respostaDeLaIAIA', () => {
  const ambFixtura = () => Promise.resolve({ items: FIXTURA });

  test('compon la resposta amb els documents trobats', async () => {
    const carrega = vi.fn(ambFixtura);
    expect(await respostaDeLaIAIA('Què és Sollutia?', { carrega })).toBe(
      `${ENCAPCALAMENT_DE_LA_WIKI}\n· Soci Sollutia — /wikidepoble?item=sollutia`
    );
    expect(carrega).toHaveBeenCalledTimes(1);
  });

  test('sense cap document trobat, null', async () => {
    expect(await respostaDeLaIAIA('zzqx', { carrega: ambFixtura })).toBeNull();
  });

  test('una salutació ni tan sols carrega la Wiki', async () => {
    const carrega = vi.fn(ambFixtura);
    expect(await respostaDeLaIAIA('Bon dia, IAIA', { carrega })).toBeNull();
    expect(carrega).not.toHaveBeenCalled();
  });

  test('si la càrrega falla o el manifest no és vàlid, null i mai cap rebuig', async () => {
    await expect(respostaDeLaIAIA('pedra', { carrega: () => Promise.reject(new Error('xarxa')) })).resolves.toBeNull();
    await expect(respostaDeLaIAIA('pedra', { carrega: () => { throw new Error('síncron'); } })).resolves.toBeNull();
    await expect(respostaDeLaIAIA('pedra', { carrega: () => Promise.resolve(null) })).resolves.toBeNull();
  });

  test(`si la Wiki no arriba en ${TEMPS_MAXIM_DE_LA_WIKI} ms, null`, async () => {
    vi.useFakeTimers();
    const resposta = respostaDeLaIAIA('pedra', { carrega: () => new Promise(() => {}) });
    await vi.advanceTimersByTimeAsync(TEMPS_MAXIM_DE_LA_WIKI);
    await expect(resposta).resolves.toBeNull();
  });
});

describe('amb la Wiki de veres del paquet', () => {
  const ids = new Set(wikiManifest.items.map((item) => item.id));
  const enllacos = (text) => [...String(text).matchAll(/\/wikidepoble\?item=([^\s]+)/g)].map((m) => decodeURIComponent(m[1]));

  test('la càrrega per defecte (import() del manifest) troba 3 documents que la Wiki pinta', async () => {
    const text = await respostaDeLaIAIA('Què és Sollutia i el Model B?');
    expect(text.split('\n')[0]).toBe(ENCAPCALAMENT_DE_LA_WIKI);
    const slugs = enllacos(text);
    expect(slugs).toHaveLength(DOCUMENTS_PER_RESPOSTA);
    expect(slugs.every((slug) => ids.has(slug))).toBe(true);
    /* Cada document trobat porta alguna paraula de la pregunta. */
    const index = construeixIndex(wikiManifest.items);
    for (const slug of slugs) {
      const document = index.documents.find((d) => d.id === slug);
      expect([slug, ['sollutia', 'model'].some((terme) => document.freq.has(terme))]).toEqual([slug, true]);
    }
  });

  test('una salutació o una paraula que no hi és, null: la IAIA respon la frase de sempre', async () => {
    expect(await respostaDeLaIAIA('Bon dia, IAIA')).toBeNull();
    expect(await respostaDeLaIAIA('zzqxwv')).toBeNull();
  });

  /* Qualitat mínima de la cerca. Mesura del 261016 sobre el manifest d'eixe
     dia: 79 de 79 documents es troben pel seu títol. El manifest es regenera
     amb la Wiki, i per això el sostre deixa un marge del 10 %. */
  test('cada document es troba pel seu propi títol entre els 3 primers', () => {
    const index = construeixIndex(wikiManifest.items);
    const ambTermes = index.documents.filter((d) => termesDeLaPregunta(d.titol).length);
    const perduts = ambTermes.filter((d) => !cerca(index, d.titol).some((r) => r.id === d.id)).map((d) => `${d.id}: ${d.titol}`);
    expect(ambTermes.length).toBeGreaterThan(0);
    expect(perduts.length / ambTermes.length, perduts.join('\n')).toBeLessThanOrEqual(0.1);
  });
});
