// @vitest-environment node
/* IDEA-25 i IDEA-45 (Llibre Mestre, Fita 23; kit de Gemini de l'Onada 2,
   261101, auditat) · La porta universal de la vCard: la targeta d'una persona
   només amb el que la seua fitxa publicada ja ensenya, la d'una organització
   és exactament la de vcardOrganitzacio.js (una sola font), i cap valor pot
   injectar una propietat ni trencar el plegat a 75 octets. */
import { describe, expect, test } from 'vitest';
import * as organitzacio from '../sections/profile/vcardOrganitzacio.js';
import { TIPUS_VCARD, desaVcard, nomFitxerVcard, vcardDePerfilPublic, vcardDePersona } from './exportaVCard.js';

const linies = (text) => text.replace(/\r\n /g, '').split('\r\n').filter(Boolean);
const propietats = (text) => linies(text).map((l) => l.split(/[:;]/)[0]);
const octets = (text) => new TextEncoder().encode(text).length;
// Un «\» solt al final d'una línia física: una seqüència d'escapament partida.
const barraSolta = (fisica) => (fisica.match(/\\+$/)?.[0].length ?? 0) % 2 === 1;

const PEPA = Object.freeze({
  tipus: 'persona', id: 'p-1', nom: 'Maria del Mar Pla', usuari: 'maria-pla', bio: 'Apicultora de la Serra',
  lema: 'Mel de romer i timó.', poble: 'La Torre de les Maçanes', esIA: false, publicat: true
});
const FORN = Object.freeze({
  tipus: 'entitat', id: 'forn-1', slug: 'forn', nom: 'Forn de la Plaça', poble: 'La Torre de les Maçanes · Xixona',
  correu: 'forn@exemple.cat', bio: 'Forn', lema: 'Pa de llenya', esIA: false, publicat: true
});
const URL_PEPA = 'https://socdepoble.org/gent/maria-pla';

describe('vcardDePersona (IDEA-25)', () => {
  test('el nom sencer sense endevinar cognoms, el @usuari, la bio i el lema en una nota i l’URL de la fitxa', () => {
    const text = vcardDePersona({ nom: PEPA.nom, usuari: PEPA.usuari, bio: PEPA.bio, lema: PEPA.lema, url: URL_PEPA });
    expect(linies(text)).toEqual([
      'BEGIN:VCARD', 'VERSION:3.0', 'N:;Maria del Mar Pla;;;', 'FN:Maria del Mar Pla', 'NICKNAME:@maria-pla',
      'NOTE:Apicultora de la Serra\\nMel de romer i timó.', `URL:${URL_PEPA}`, 'END:VCARD'
    ]);
    expect(text.endsWith('END:VCARD\r\n')).toBe(true);
    expect(text.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
  });

  test('privacitat: cap correu, telèfon, adreça, codi postal ni poble, encara que vinguen', () => {
    const text = vcardDePersona({
      nom: 'Pepa', correu: 'pepa@exemple.cat', telefon: '+34 600 123 456', adreca: 'Carrer Major, 4',
      codiPostal: '03108', poble: 'La Torre de les Maçanes', organitzacio: 'Cooperativa'
    });
    expect(propietats(text)).toEqual(['BEGIN', 'VERSION', 'N', 'FN', 'END']);
    expect(text).not.toMatch(/pepa@|600|Major|03108|Torre|Cooperativa/);
  });

  test('el @usuari només en la forma del servidor; si no, cap NICKNAME', () => {
    for (const usuari of ['Pepa', '@pepa', 'pe pa', 'pepa-', 'pepa\r\nEMAIL:robat@x.cat', 'pèpa', '', null, 42]) {
      expect(vcardDePersona({ nom: 'Pepa', usuari }), String(usuari)).not.toMatch(/NICKNAME/);
    }
  });

  test('cap valor injecta una propietat: salts, «;», «,» i «\\» escapats; controls i bidi fora', () => {
    // Els invisibles, per punt de codi (cap caràcter cru al codi font): RLO (U+202E) i BEL (U+0007).
    const text = vcardDePersona({
      nom: `Pepa\r\nEMAIL:robat@x.cat;a,b\\c${String.fromCodePoint(0x202E, 0x0007)}`,
      bio: 'Bio\nTEL:666', lema: 'Lema;X-ABShowAs:COMPANY'
    });
    expect(propietats(text)).toEqual(['BEGIN', 'VERSION', 'N', 'FN', 'NOTE', 'END']);
    expect(linies(text)).toContain('FN:Pepa\\nEMAIL:robat@x.cat\\;a\\,b\\\\c');
    expect(linies(text)).toContain('N:;Pepa\\nEMAIL:robat@x.cat\\;a\\,b\\\\c;;;');
    expect(linies(text)).toContain('NOTE:Bio\\nTEL:666\\nLema\\;X-ABShowAs:COMPANY');
  });

  test('la web només http(s) pública, sense credencials, espais ni controls', () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,x', 'ftp://exemple.cat/', 'https://usuari:clau@exemple.cat/',
      'https://exem ple.cat/', 'https://exemple.cat/\r\nTEL:1', '/gent/pepa', '', null]) {
      expect(vcardDePersona({ nom: 'Pepa', url }), String(url)).not.toMatch(/URL/);
    }
    expect(linies(vcardDePersona({ nom: 'Pepa', url: 'https://SOCDEPOBLE.org/gent/pepa' }))).toContain('URL:https://socdepoble.org/gent/pepa');
  });

  test('sense nom, cap targeta; sense bio ni lema, cap nota buida', () => {
    for (const nom of ['', '   ', null, undefined, 42, String.fromCodePoint(0x200B)]) expect(vcardDePersona({ nom }), String(nom)).toBeNull();
    expect(vcardDePersona()).toBeNull();
    expect(propietats(vcardDePersona({ nom: 'Pepa', bio: '  ', lema: String.fromCodePoint(0x200B) }))).toEqual(['BEGIN', 'VERSION', 'N', 'FN', 'END']);
    expect(linies(vcardDePersona({ nom: 'Pepa', lema: 'Només el lema' }))).toContain('NOTE:Només el lema');
  });

  test('una bio llarga es plega a 75 octets, sense partir cap caràcter ni cap escapament, i es desfà exacta', () => {
    const bio = 'Çàéíòú, ·; \\ i «€» '.repeat(25).slice(0, 500);
    const text = vcardDePersona({ nom: PEPA.nom, bio, url: URL_PEPA });
    const fisiques = text.split('\r\n');
    expect(fisiques.some((l) => l.startsWith(' '))).toBe(true);
    for (const fisica of fisiques) {
      expect(octets(fisica), fisica).toBeLessThanOrEqual(75);
      expect(barraSolta(fisica), fisica).toBe(false);
    }
    expect(linies(text)).toContain(`NOTE:${organitzacio.escapaValor(bio)}`);
  });
});

describe('vcardDePerfilPublic (la porta universal)', () => {
  test('una entitat o un grup públic: exactament la targeta de vcardDOrganitzacio (una sola font)', () => {
    const url = 'https://socdepoble.org/empresa/forn';
    for (const tipus of ['entitat', 'grup']) {
      const perfil = { ...FORN, tipus };
      expect(vcardDePerfilPublic(perfil, { url }), tipus).toBe(organitzacio.vcardDOrganitzacio({ nom: FORN.nom, poble: FORN.poble, correu: FORN.correu, url }));
    }
    // El poble que ensenya la fitxa (p. ex. el fundacional) mana sobre el del DTO.
    expect(linies(vcardDePerfilPublic({ ...FORN, poble: '' }, { poble: 'La Torre de les Maçanes' }))).toContain('ADR;TYPE=WORK:;;;La Torre de les Maçanes;;;');
    // També quan la fitxa no n'ensenya cap ('' explícit): la targeta no porta el del DTO.
    expect(propietats(vcardDePerfilPublic({ ...FORN, poble: 'Xixona' }, { poble: '' }))).not.toContain('ADR');
    expect(vcardDePerfilPublic({ ...FORN, poble: 'Xixona' }, { poble: '' })).not.toMatch(/Xixona/);
    // Un correu sense forma vàlida no hi entra, com a la fitxa.
    expect(vcardDePerfilPublic({ ...FORN, correu: 'forn@exemple.cat\r\nTEL:666' })).not.toMatch(/EMAIL|TEL/);
  });

  test('una persona publicada: la targeta de vcardDePersona, sense el correu ni el poble del DTO', () => {
    const perfil = { ...PEPA, correu: 'pepa@exemple.cat', telefon: '600123456' };
    const text = vcardDePerfilPublic(perfil, { poble: 'Xixona', url: URL_PEPA });
    expect(text).toBe(vcardDePersona({ nom: PEPA.nom, usuari: PEPA.usuari, bio: PEPA.bio, lema: PEPA.lema, url: URL_PEPA }));
    expect(text).not.toMatch(/EMAIL|TEL|ADR|ORG|X-ABShowAs|Xixona|Torre/);
  });

  test.each([
    ['una IA', { ...PEPA, esIA: true }],
    ['una IA del catàleg', { ...FORN, tipus: 'ia' }],
    ['una persona no publicada', { ...PEPA, publicat: false }],
    ['una persona sense la marca de publicada', { ...PEPA, publicat: undefined }],
    ['una marca de publicada que no és el booleà true (com a la fitxa)', { ...PEPA, publicat: 'true' }],
    ['una organització no publicada', { ...FORN, publicat: false }],
    ['un tipus desconegut', { ...PEPA, tipus: 'altre' }],
    ['una persona sense nom', { ...PEPA, nom: '  ' }],
    ['res', null],
    ['sense fitxa', undefined],
    ['un text', 'Pepa'],
    ['un número', 42]
  ])('%s: cap targeta', (_cas, perfil) => {
    expect(vcardDePerfilPublic(perfil, { url: URL_PEPA })).toBeNull();
  });
});

describe('la façana', () => {
  test('el tipus MIME, el nom del fitxer i la descàrrega són els de vcardOrganitzacio.js, no cap còpia', () => {
    expect(TIPUS_VCARD).toBe(organitzacio.TIPUS_VCARD);
    expect(TIPUS_VCARD).toBe('text/vcard;charset=utf-8');
    expect(nomFitxerVcard).toBe(organitzacio.nomFitxerVcard);
    expect(desaVcard).toBe(organitzacio.desaVcard);
    expect(nomFitxerVcard(PEPA.nom)).toBe('maria-del-mar-pla.vcf');
  });
});
