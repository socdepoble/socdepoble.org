/* Ordre del Mestre (261007) · «Fes el mateix per als ítems de prova de la Wiki
   de Poble»: emojis distints i amb sentit per a la Consola, les eines locals i
   els documents del manifest, sense tocar el manifest generat. Tots són emojis
   RGI que es veuen a Safari 16 (Unicode 13 o anteriors, sense ZWJ), la mateixa
   guarda que manifest.icones.test.js fa per als espècimens de Disseny.
   Ordre del Mestre (pla 261007_0012, §0.7) · I cada carpeta i subcarpeta de la
   Wiki, i la portada, el seu, amb la mateixa guarda. */
import { Folder } from 'lucide-react';
import { expect, test } from 'vitest';
import { wikiManifest } from '../../data/wikiManifest.js';
import { GLIF_CARPETA } from '../../components/universal/workspace/NavGlyph.jsx';
/* Revisió del 261007 (M2-14) · La guarda és una sola, compartida amb
   manifest.icones.test.js (abans, una còpia de la taula ací). */
import { defecteSafari16 } from '../../../tests/helpers/guardaEmojisSafari16.js';
import {
  ICONA_ACTA, ICONA_ADR, ICONA_DOCUMENT, ICONA_INDEX, ICONA_PORTADA, ICONES_CARPETES_WIKI, ICONES_ITEMS_WIKI, ICONES_PER_ID,
  ICONES_PER_TIPUS, glifDeCarpetaWiki, iconaDeDocument
} from './iconesWiki.js';

const valid = (glif) => defecteSafari16(glif) === null;

/* Les entrades fixes de l'arbre que declara la secció (WikiDePobleSection), a
   l'arrel, abans de les carpetes del manifest. */
const FIXES = Object.freeze([{ id: '__intro_cat', parentId: null }, { id: 'maquinaria_cat', parentId: null }]);
/* Totes les entrades de l'arbre de la Wiki de veres: les fixes i les del manifest. */
const ARBRE = [...FIXES, ...wikiManifest.categories];

test('tots els emojis de la Wiki són RGI i es veuen a Safari 16', () => {
  const tots = [
    ...Object.entries(ICONES_ITEMS_WIKI), ...Object.entries(ICONES_CARPETES_WIKI), ...Object.entries(ICONES_PER_ID),
    ...Object.entries(ICONES_PER_TIPUS),
    ['portada', ICONA_PORTADA], ['ADR', ICONA_ADR], ['índex', ICONA_INDEX], ['acta', ICONA_ACTA], ['document', ICONA_DOCUMENT]
  ];
  expect(tots.filter(([, glif]) => !valid(glif))).toEqual([]);
  expect(valid('🪪')).toBe(false);
});

/* Ordre del Mestre (pla 261007_0012, §0.7) · «La pàgina arrel de la Wiki
   ("Wiki de Poble") també ha de tindre el seu propi emoji a la llista». La
   revisió M3-07 la deixava pendent; l'ordre ja la nomena. */
test('la portada, la Consola i les tres eines locals porten emojis distints, cap de genèric; la portada, el seu (📖)', () => {
  const emojis = Object.values(ICONES_ITEMS_WIKI);
  expect(Object.keys(ICONES_ITEMS_WIKI)).toEqual(['__intro', 'consola_termodinamica', 'tractors_aprovacio', 'sentinelles_panell', 'agents_panell']);
  expect(new Set(emojis).size).toBe(emojis.length);
  expect(emojis).not.toContain(ICONA_DOCUMENT);
  // La Consola, amb l'engranatge de la convenció del catàleg (⚙️ Consola).
  expect(ICONES_ITEMS_WIKI.consola_termodinamica).toBe('⚙️');
  // La portada i la seua entrada a l'arbre, el mateix: el llibre obert.
  expect(ICONA_PORTADA).toBe('📖');
  expect([ICONES_ITEMS_WIKI.__intro, ICONES_CARPETES_WIKI.__intro_cat]).toEqual([ICONA_PORTADA, ICONA_PORTADA]);
  // Cap document del manifest no el porta: la portada es reconeix d'una ullada.
  expect(wikiManifest.items.filter((document) => iconaDeDocument(document) === ICONA_PORTADA).map((d) => d.id)).toEqual([]);
});

/* Ordre del Mestre (pla 261007_0012, §0.7) · «Cal dotar CADA carpeta i
   subcarpeta de la Wiki (Saber, Actuar, Plantilles, Consola, etc.) d'un emoji
   propi i semàntic». Sobre el manifest de veres: cap carpeta no cau en la
   reserva de Lucide. */
test('cada carpeta i subcarpeta del manifest i les dues fixes de la secció tenen emoji propi: cap Folder per defecte', () => {
  expect(wikiManifest.categories.length).toBeGreaterThan(0);
  const senseEmoji = ARBRE.filter((carpeta) => !Object.prototype.hasOwnProperty.call(ICONES_CARPETES_WIKI, carpeta.id));
  expect(senseEmoji.map((carpeta) => carpeta.id)).toEqual([]);
  for (const carpeta of ARBRE) {
    const glif = glifDeCarpetaWiki(carpeta.id);
    expect(glif, carpeta.id).not.toBe(Folder);
    expect(typeof glif, carpeta.id).toBe('string');
    expect(defecteSafari16(glif), carpeta.id).toBeNull();
  }
  // Les que nomena l'ordre: Saber, Actuar, Plantilles i Consola.
  expect([
    glifDeCarpetaWiki('folder:02_saber'), glifDeCarpetaWiki('folder:03_actuar'),
    glifDeCarpetaWiki('folder:03_actuar/plantilles'), glifDeCarpetaWiki('folder:02_saber/03_consola_termodinamica')
  ]).toEqual(['🦉', '🔨', '📋', '🌡️']);
});

test('distints entre germanes (mateixa carpeta mare) i entre totes les carpetes de l’arbre', () => {
  const perMare = new Map();
  for (const carpeta of ARBRE) {
    const mare = carpeta.parentId ?? null;
    perMare.set(mare, [...(perMare.get(mare) || []), glifDeCarpetaWiki(carpeta.id)]);
  }
  expect(perMare.size).toBeGreaterThan(1);
  for (const [mare, germanes] of perMare) expect(new Set(germanes).size, String(mare)).toBe(germanes.length);
  const totes = ARBRE.map((carpeta) => glifDeCarpetaWiki(carpeta.id));
  expect(new Set(totes).size).toBe(totes.length);
  // Cap carpeta no es confon amb la Consola ni amb les eines locals.
  const items = Object.entries(ICONES_ITEMS_WIKI).filter(([id]) => id !== '__intro').map(([, glif]) => glif);
  expect(totes.filter((glif) => items.includes(glif))).toEqual([]);
  // Revisió del §0.7 (R4) · Ni amb les regles d'un document: una plantilla
  // nova sense entrada pròpia no porta el glif de la carpeta PLANTILLES.
  const regles = [...Object.values(ICONES_PER_TIPUS), ICONA_ADR, ICONA_INDEX, ICONA_ACTA, ICONA_DOCUMENT];
  expect(totes.filter((glif) => regles.includes(glif))).toEqual([]);
});

test('glifDeCarpetaWiki: el de la taula; una carpeta nova o un id estrany, la carpeta de Lucide, sense petar', () => {
  expect(glifDeCarpetaWiki('folder:01_ser')).toBe('🌱');
  expect(glifDeCarpetaWiki('maquinaria_cat')).toBe('🎛️');
  expect(GLIF_CARPETA).toBe(Folder);
  // Un id que es diu com una propietat d'objecte no trau cap valor heretat.
  for (const id of ['folder:04_nova', 'folder:02_saber/nova', '', 'constructor', 'toString', '__proto__', null, undefined, 7]) {
    expect(glifDeCarpetaWiki(id), String(id)).toBe(Folder);
  }
});

test('un document tria: el seu propi, el prefix (ADR, índexs, actes), el tipus i, si no, el genèric', () => {
  expect(iconaDeDocument({ id: '02_genotip', attributes: { type: 'document' } })).toBe('🧬');
  // El propi mana sobre el tipus.
  expect(iconaDeDocument({ id: 'graf', attributes: { type: 'hub' } })).toBe('🕸️');
  expect(iconaDeDocument({ id: 'ADR-2027-01-NOVA', attributes: { type: 'norma' } })).toBe(ICONA_ADR);
  for (const id of ['00_index', '00_index_actuar', 'index_trellat', 'index']) {
    expect(iconaDeDocument({ id, attributes: { type: 'document' } }), id).toBe(ICONA_INDEX);
  }
  expect(iconaDeDocument({ id: 'acta_marmota_261007', attributes: {} })).toBe(ICONA_ACTA);
  expect(iconaDeDocument({ id: 'llei_nova', attributes: { type: 'norma' } })).toBe(ICONES_PER_TIPUS.norma);
  expect(iconaDeDocument({ id: 'plantilla_nova', attributes: { type: 'plantilla' } })).toBe(ICONES_PER_TIPUS.plantilla);
  // Sense res que diga més: el document genèric. Un id que es diu com una
  // propietat d'objecte no trau cap valor heretat.
  for (const document of [{ id: 'nota_solta', attributes: { type: 'document' } }, { id: 'constructor' }, { id: 'toString', attributes: { type: 'constructor' } }, null]) {
    expect(iconaDeDocument(document)).toBe(ICONA_DOCUMENT);
  }
});

test('cada document del manifest real té un emoji vàlid, i els ADR i els índexs, el de la seua família', () => {
  expect(wikiManifest.items.filter((document) => !valid(iconaDeDocument(document))).map((document) => document.id)).toEqual([]);
  for (const document of wikiManifest.items.filter((d) => /^ADR-/.test(d.id))) expect(iconaDeDocument(document), document.id).toBe(ICONA_ADR);
  for (const document of wikiManifest.items.filter((d) => d.attributes?.type === 'index')) expect(iconaDeDocument(document), document.id).toBe(ICONA_INDEX);
});
