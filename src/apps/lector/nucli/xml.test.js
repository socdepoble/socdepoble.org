// @vitest-environment node
/* Lector de notícies · el lector XML (xml.js) i les entitats (entitats.js). */
import { describe, expect, test } from 'vitest';
import { descodifica, netejaText, plega, talla } from './entitats.js';
import { LIMITS_XML, NS, atributDe, fillDe, fillsDe, llegixXml, nsNet, textDe } from './xml.js';

/* Els caràcters invisibles es construïxen pel punt de codi: en cru, les portes del repo els vetarien. */
const car = (punt) => String.fromCharCode(punt);
const NBSP = car(0xA0);
const SUBSTITUT = car(0xFFFD);
const RLO = car(0x202E);
const ZWSP = car(0x200B);
const BOM = car(0xFEFF);

describe('entitats', () => {
  test('les cinc d’XML, les numèriques i les HTML de la llista; una desconeguda es queda com a text', () => {
    expect(descodifica('a &lt;b&gt; &amp; &quot;c&quot; &apos;d&apos;')).toBe('a <b> & "c" \'d\'');
    expect(descodifica('&#x41;&#66;&eacute;&nbsp;&hellip;&rsquo;')).toBe(`ABé${NBSP}…’`);
    expect(descodifica('&desconeguda; & solt &amp')).toBe('&desconeguda; & solt &amp');
  });

  test('les referències del 128 al 159 són Windows-1252, i les impossibles, U+FFFD', () => {
    expect(descodifica('&#x92;&#x96;')).toBe('’–');
    expect(descodifica('&#x81;')).toBe('');
    expect(descodifica('&#x0;&#xD800;&#x110000;')).toBe(SUBSTITUT.repeat(3));
  });

  test('netejaText lleva controls, invisibles i bidireccionals; conserva salts i tabuladors', () => {
    expect(netejaText(`a${car(0)}b${car(7)}c${RLO}d${ZWSP}e${BOM}f\tg\nh`)).toBe('abcdef\tg\nh');
    expect(plega('  una\n\n  línia\t ')).toBe('una línia');
  });

  test('talla no partix un parell subrogat', () => {
    expect(talla('ab\u{1F600}', 3)).toBe('ab');
    expect(talla('abc', 5)).toBe('abc');
  });
});

describe('llegixXml', () => {
  test('elements, atributs, text, CDATA i comentaris', () => {
    const { arrel, errors } = llegixXml('<?xml version="1.0"?><a x="1" y=\'2 &amp; 3\'><!-- no --><b>text &lt;</b><c/><![CDATA[<cru> & ]]></a>');
    expect(errors).toEqual([]);
    expect(arrel.nom).toBe('a');
    expect(atributDe(arrel, 'y')).toBe('2 & 3');
    expect(textDe(fillDe(arrel, 'b'))).toBe('text <');
    expect(fillsDe(arrel, 'c')).toHaveLength(1);
    expect(textDe(arrel)).toBe('text <<cru> & ');
  });

  test('els espais de noms es resolen sense esquema; un prefix conegut sense declarar també', () => {
    const { arrel } = llegixXml('<feed xmlns="https://www.w3.org/2005/Atom/" xmlns:m="http://search.yahoo.com/mrss/"><m:thumbnail url="u"/><media:content url="v"/><title>t</title></feed>');
    expect(arrel.ns).toBe(NS.atom);
    expect(fillDe(arrel, 'title', NS.atom)).not.toBeNull();
    expect(atributDe(fillDe(arrel, 'thumbnail', NS.media), 'url')).toBe('u');
    expect(atributDe(fillDe(arrel, 'content', NS.media), 'url')).toBe('v');
    expect(nsNet('HTTPS://purl.org/dc/elements/1.1/')).toBe(NS.dc);
  });

  test('el DOCTYPE se salta sencer: cap entitat del document s’expandix', () => {
    const doc = '<!DOCTYPE r [ <!ENTITY a "AAAA"> <!ENTITY b "&a;&a;&a;"> <!ENTITY x SYSTEM "file:///etc/passwd"> ]><r>&b; &x;</r>';
    const { arrel } = llegixXml(doc);
    expect(textDe(arrel)).toBe('&b; &x;');
  });

  test('recupera l’XML trencat i ho diu, sense llançar', () => {
    const { arrel, errors } = llegixXml('<a><b>u<c>dos</b></x><d>tres');
    expect(arrel.nom).toBe('a');
    expect(textDe(arrel)).toBe('udostres');
    expect(errors.join(' ')).toMatch(/tanca etiquetes obertes/);
    expect(errors.join(' ')).toMatch(/tancament sense obrir/);
    expect(errors.join(' ')).toMatch(/sense tancar/);
    expect(llegixXml('només text').arrel).toBeNull();
    expect(llegixXml(null)).toEqual({ arrel: null, errors: ['no és text'] });
  });

  test('un «<» solt és text i el BOM inicial no compta', () => {
    expect(textDe(llegixXml(`${BOM}<a>1 < 2</a>`).arrel)).toBe('1 < 2');
  });

  test('límits: mida i profunditat', () => {
    expect(llegixXml('x'.repeat(LIMITS_XML.caracters + 1)).errors).toEqual(['el feed és massa gran']);
    const fondo = `${'<n>'.repeat(LIMITS_XML.profunditat + 10)}fons${'</n>'.repeat(LIMITS_XML.profunditat + 10)}`;
    const { arrel } = llegixXml(fondo);
    let profunditat = 0;
    for (let node = arrel; node; node = fillDe(node, 'n')) profunditat += 1;
    expect(profunditat).toBe(LIMITS_XML.profunditat);
    expect(textDe(arrel)).toBe('fons');
  });
});
