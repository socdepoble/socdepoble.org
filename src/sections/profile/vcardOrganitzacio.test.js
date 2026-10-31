// @vitest-environment node
/* P1-59 (b) (Llibre Mestre, Fita 23 i IDEA-45; guàrdia nocturna 261030, Fase
   3) · La vCard d'una organització pública, en local: només el que la fitxa
   ja ensenya (nom, poble, correu públic i web), en vCard 3.0, amb CRLF, cada
   línia plegada a 75 octets i cap valor que puga injectar una propietat. */
import { describe, expect, test, vi } from 'vitest';
import { TIPUS_VCARD, desaVcard, escapaValor, nomFitxerVcard, plega, vcardDOrganitzacio } from './vcardOrganitzacio.js';

const linies = (text) => text.replace(/\r\n /g, '').split('\r\n').filter(Boolean);
const octets = (text) => new TextEncoder().encode(text).length;

describe('vcardDOrganitzacio', () => {
  test('una organització: vCard 3.0 d’empresa amb el nom, el poble principal, el correu públic i la web', () => {
    const text = vcardDOrganitzacio({ nom: 'Forn de la Plaça', poble: 'La Torre de les Maçanes · Xixona', correu: 'forn@exemple.cat', url: 'https://socdepoble.org/empresa/forn' });
    expect(linies(text)).toEqual([
      'BEGIN:VCARD', 'VERSION:3.0', 'N:;;;;', 'FN:Forn de la Plaça', 'ORG:Forn de la Plaça', 'X-ABShowAs:COMPANY',
      'ADR;TYPE=WORK:;;;La Torre de les Maçanes;;;', 'EMAIL;TYPE=INTERNET,WORK:forn@exemple.cat',
      'URL:https://socdepoble.org/empresa/forn', 'END:VCARD'
    ]);
    expect(text.endsWith('END:VCARD\r\n')).toBe(true);
    expect(text.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
  });

  test('sense nom, cap targeta; sense poble, correu o web, cap línia buida d’eixos camps', () => {
    for (const nom of ['', '   ', null, undefined, String.fromCodePoint(0x200B)]) expect(vcardDOrganitzacio({ nom }), String(nom)).toBeNull();
    expect(linies(vcardDOrganitzacio({ nom: 'Rentonar' }))).toEqual(['BEGIN:VCARD', 'VERSION:3.0', 'N:;;;;', 'FN:Rentonar', 'ORG:Rentonar', 'X-ABShowAs:COMPANY', 'END:VCARD']);
  });

  test('un correu que no és vàlid o una web que no és http(s) pública no hi entren', () => {
    const text = vcardDOrganitzacio({ nom: 'Forn', correu: 'forn@exemple.cat\r\nTEL:666', url: 'javascript:alert(1)' });
    expect(text).not.toMatch(/EMAIL|URL|TEL/);
    expect(vcardDOrganitzacio({ nom: 'Forn', url: 'https://usuari:clau@exemple.cat/' })).not.toMatch(/URL/);
    expect(vcardDOrganitzacio({ nom: 'Forn', url: 'ftp://exemple.cat/' })).not.toMatch(/URL/);
  });

  test('cap valor injecta una propietat: salts, «;», «,» i «\\» escapats; controls i bidi fora', () => {
    // Els invisibles, escrits per punt de codi (cap caràcter cru al codi font): RLO (U+202E) i BEL (U+0007).
    const text = vcardDOrganitzacio({ nom: `Forn\r\nEMAIL:robat@x.cat;a,b\\c${String.fromCodePoint(0x202E, 0x0007)}`, poble: 'Poble;X\nTEL:1' });
    const props = linies(text).map((l) => l.split(/[:;]/)[0]);
    expect(props).toEqual(['BEGIN', 'VERSION', 'N', 'FN', 'ORG', 'X-ABShowAs', 'ADR', 'END']);
    expect(linies(text)).toContain('FN:Forn\\nEMAIL:robat@x.cat\\;a\\,b\\\\c');
    expect(linies(text)).toContain('ADR;TYPE=WORK:;;;Poble\\;X\\nTEL:1;;;');
  });

  test('les línies llargues es pleguen a 75 octets i es desfan exactes, sense partir cap caràcter', () => {
    const nom = 'Cooperativa Agrícola i Caixa Rural de la Torre de les Maçanes · Sòcia d’Honor de l’Alcoià i el Comtat';
    const text = vcardDOrganitzacio({ nom });
    for (const fisica of text.split('\r\n')) expect(octets(fisica), fisica).toBeLessThanOrEqual(75);
    expect(linies(text)).toContain(`FN:${nom}`);
    expect(text.split('\r\n').some((l) => l.startsWith(' '))).toBe(true);
  });
});

describe('peces', () => {
  test('escapaValor i plega', () => {
    expect(escapaValor(' a;b,c\\d\ne ')).toBe('a\\;b\\,c\\\\d\\ne');
    expect(plega('x'.repeat(75))).toBe('x'.repeat(75));
    expect(plega('x'.repeat(76))).toBe(`${'x'.repeat(75)}\r\n x`);
    // Un caràcter de dos octets que no hi cap no es partix: passa sencer a la línia següent.
    expect(plega(`${'x'.repeat(74)}ç`)).toBe(`${'x'.repeat(74)}\r\n ç`);
  });

  test('MILLORA-01 (Gemini 1217) · cap plec partix una seqüència d’escapament (\\n, \\,, \\; ni \\\\), i la línia es desfà exacta', () => {
    // El cas de la frontera: el «\» de «\n» seria l'octet 75 i passa sencer, amb la «n», a la línia següent.
    expect(plega(`${'x'.repeat(74)}\\nA`)).toBe(`${'x'.repeat(74)}\r\n \\nA`);
    const senar = (fisica) => (fisica.match(/\\+$/)?.[0].length ?? 0) % 2 === 1;
    for (const escapament of ['\\n', '\\,', '\\;', '\\\\']) {
      for (let desfase = 0; desfase < 80; desfase += 1) {
        const linia = `FN:${'x'.repeat(desfase)}${escapament.repeat(60)}ç${escapament}`;
        const plegada = plega(linia);
        for (const fisica of plegada.split('\r\n')) {
          expect(octets(fisica), fisica).toBeLessThanOrEqual(75);
          expect(senar(fisica), `${escapament} +${desfase}: ${fisica}`).toBe(false);
        }
        expect(plegada.replace(/\r\n /g, '')).toBe(linia);
      }
    }
    // Una targeta sencera amb molts valors escapats: cap línia física acaba amb un «\» solt.
    const text = vcardDOrganitzacio({ nom: 'Forn, Pa; i Coca\\'.repeat(8), poble: 'Poble;\nX'.repeat(12) });
    expect(text.split('\r\n').some(senar)).toBe(false);
    expect(linies(text)).toContain(`FN:${escapaValor('Forn, Pa; i Coca\\'.repeat(8))}`);
  });

  test('nomFitxerVcard: ASCII, minúscules i .vcf; sense nom, contacte.vcf', () => {
    expect(nomFitxerVcard('Forn de la Plaça · Cal Pep')).toBe('forn-de-la-placa-cal-pep.vcf');
    expect(nomFitxerVcard('../../etc/passwd')).toBe('etc-passwd.vcf');
    for (const nom of ['', '¿¡', null]) expect(nomFitxerVcard(nom), String(nom)).toBe('contacte.vcf');
    expect(nomFitxerVcard('a'.repeat(200)).length).toBeLessThanOrEqual(64);
  });
});

describe('desaVcard', () => {
  test('un Blob text/vcard, un enllaç temporal amb el nom del fitxer, i la URL es revoca', () => {
    vi.useFakeTimers();
    try {
      const enllac = { click: vi.fn() };
      const doc = { createElement: vi.fn(() => enllac) };
      let blob = null;
      const urls = { createObjectURL: vi.fn((b) => { blob = b; return 'blob:x'; }), revokeObjectURL: vi.fn() };
      expect(desaVcard('BEGIN:VCARD\r\nEND:VCARD\r\n', 'forn.vcf', { doc, urls })).toBe(true);
      expect(blob.type).toBe(TIPUS_VCARD);
      expect(enllac).toMatchObject({ href: 'blob:x', download: 'forn.vcf', rel: 'noopener' });
      expect(enllac.click).toHaveBeenCalledOnce();
      vi.advanceTimersByTime(1000);
      expect(urls.revokeObjectURL).toHaveBeenCalledWith('blob:x');
    } finally {
      vi.useRealTimers();
    }
  });

  test('sense text, document o createObjectURL, no fa res', () => {
    expect(desaVcard('', 'a.vcf', { doc: {}, urls: { createObjectURL: vi.fn() } })).toBe(false);
    expect(desaVcard('x', 'a.vcf', { doc: null, urls: { createObjectURL: vi.fn() } })).toBe(false);
    expect(desaVcard('x', 'a.vcf', { doc: {}, urls: {} })).toBe(false);
  });
});
