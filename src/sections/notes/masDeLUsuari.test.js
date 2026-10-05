import { expect, test } from 'vitest';
import {
  CARPETA_ALTRES, CARPETA_PER_SECCIO, ETIQUETA_NEUTRA, esIdDePublicacio, etiquetaDeSeccio, itemsPublicatsDe, pertanyALActor,
  publicacioComANota, seccioDeCarpeta, seccioDePublicacio
} from './masDeLUsuari.js';
import { aliesDeLActor } from '../../data/identitatsSeed.js';
import { NOTE_FOLDERS_SEED } from '../../data/appSeed.js';
import { MOCK_MARKET_ITEMS } from '../mercat/marketSeed.js';
import { CALENDAR_EVENTS } from '../mur/eventsSeed.js';

/* T1 · el MAS ensenya només el que ha publicat l'actor. */
const samarreta = { id: 'samarreta-socdepoble', title: 'Samarreta', author_id: 'soc-de-poble_official', author_entity_id: 'socdepoble', seller: 'Sóc de Poble', created_at: '2026-08-15T12:33:00.000Z', images: ['/a.png'], description: 'Mapa del tresor' };
const mac = { id: 'mac-mini-m4', title: 'Mac Mini', author_id: 'javillinares', seller: 'Javi', created_at: '2026-02-15T12:00:00.000Z' };
const remotEntitat = { id: 'r1', title: 'Fira', ownerUserId: 'u-javi', authorOrgId: 'org-1' };
const remotPersona = { id: 'r2', title: 'Ruta', ownerUserId: 'u-javi', authorOrgId: null };

test('en seed, l’entitat pilot veu la samarreta i la persona pilot el Mac Mini', () => {
  const entitat = aliesDeLActor({ tipus: 'entitat', id: 'socdepoble', slug: 'soc-de-poble' }, { dataMode: 'seed' });
  const persona = aliesDeLActor({ tipus: 'persona', id: 'u-javi', rol: 'persona' }, { dataMode: 'seed' });
  expect(itemsPublicatsDe({ marketItems: [samarreta, mac] }, entitat).map((i) => i.id)).toEqual(['publicacio:mercat:samarreta-socdepoble']);
  expect(itemsPublicatsDe({ marketItems: [samarreta, mac] }, persona).map((i) => i.title)).toEqual(['Mac Mini']);
});

test('el convidat no hereta res de la persona pilot, i sense àlies no hi ha res', () => {
  const convidat = aliesDeLActor({ tipus: 'persona', id: 'convidat', rol: 'convidat' }, { dataMode: 'seed' });
  expect(itemsPublicatsDe({ marketItems: [samarreta, mac] }, convidat)).toEqual([]);
  expect(itemsPublicatsDe({ marketItems: [samarreta, mac] }, new Set())).toEqual([]);
  expect(pertanyALActor(samarreta, null)).toBe(false);
});

test('en remot manen les columnes: una publicació signada per l’entitat no és de la persona', () => {
  const persona = aliesDeLActor({ tipus: 'persona', id: 'u-javi' });
  const entitat = aliesDeLActor({ tipus: 'entitat', id: 'org-1' });
  expect(pertanyALActor(remotEntitat, persona)).toBe(false);
  expect(pertanyALActor(remotEntitat, entitat)).toBe(true);
  expect(pertanyALActor(remotPersona, persona)).toBe(true);
  const [ruta] = itemsPublicatsDe({ feedPosts: [remotEntitat, remotPersona] }, persona);
  expect(ruta).toMatchObject({ categoryIds: ['f-mur'], kind: 'publicacio', data: { seccio: 'mur', ruta: '/mur/r2' } });
});

test('l’element de l’espai de treball és de lectura: sense etiquetes, amb imatge, secció i data', () => {
  const [item] = itemsPublicatsDe({ marketItems: [samarreta] }, new Set(['socdepoble']));
  expect(item).toMatchObject({ title: 'Samarreta', image: '/a.png', tags: [], excerpt: 'Mapa del tresor', labels: [{ text: 'Mercat', className: 'sdp-badge-system' }] });
  expect(item.subtitle).toMatch(/15\/08\/26/);
  /* Les pàgines de sistema del Mur no són de ningú. */
  expect(itemsPublicatsDe({ feedPosts: [{ id: 'legal', isSystem: true, author_id: 'javillinares' }] }, new Set(['javillinares']))).toEqual([]);
});

/* ── F4 (ordre del Mestre, 261004; PRD de la Marató 2230, Fase 1) ──
   Els àlies de Pep i la samarreta de la llavor tenen nom propi: cap local
   de les proves (`persona`, `samarreta`) no ombreja una constant del mòdul. */
const aliesDePep = new Set(['u-pep']);

test('F4 · un mitjà de l’actor va a «Multimèdia» (f-media), amb la imatge presa de src; un vídeo no fa de portada', () => {
  const foto = { id: 'm1', title: 'Bancal', src: '/f.jpg', kind: 'image', ownerUserId: 'u-pep', created_at: '2026-09-01T10:00:00.000Z' };
  const video = { id: 'm2', title: 'Sega', src: '/s.mp4', kind: 'video', ownerUserId: 'u-pep' };
  const daltri = { id: 'm3', title: 'Altra', src: '/a.jpg', ownerUserId: 'u-altri' };
  const items = itemsPublicatsDe({ mediaItems: [foto, video, daltri] }, aliesDePep);
  expect(items.map((i) => i.id)).toEqual(['publicacio:multimedia:m1', 'publicacio:multimedia:m2']);
  expect(CARPETA_PER_SECCIO.multimedia).toBe('f-media');
  expect(items[0]).toMatchObject({
    kind: 'publicacio', categoryIds: ['f-media'], image: '/f.jpg',
    labels: [{ text: 'Multimèdia', className: 'sdp-badge-system' }],
    data: { seccio: 'multimedia', ruta: '/multimedia/m1' }
  });
  expect(items[1].image).toBe('');
});

/* Poliment de F4 (revisió de la Marató 2230) · `src` és el fitxer d'un mitjà:
   fora de Multimèdia no fa de portada. */
test('F4 · la portada presa de src és només de Multimèdia: al Mur, al Mercat o en una secció desconeguda, no', () => {
  const ambSrc = { id: 'x1', title: 'Amb src', src: '/x.jpg', kind: 'image', ownerUserId: 'u-pep' };
  const items = itemsPublicatsDe({
    feedPosts: [ambSrc], marketItems: [ambSrc], mediaItems: [ambSrc], fonts: [['receptes', [ambSrc]]]
  }, aliesDePep);
  expect(items.map((item) => [item.id, item.image])).toEqual([
    ['publicacio:mur:x1', ''], ['publicacio:mercat:x1', ''],
    ['publicacio:multimedia:x1', '/x.jpg'], ['publicacio:receptes:x1', '']
  ]);
  // Un mitjà sense `kind` encara és una imatge; amb un camp d'imatge propi, el Mur pinta el seu.
  expect(publicacioComANota({ id: 'x2', src: '/y.jpg' }, 'multimedia').image).toBe('/y.jpg');
  expect(publicacioComANota({ ...ambSrc, image_url: '/i.jpg' }, 'mur').image).toBe('/i.jpg');
});

test('F4 · una secció sense carpeta pròpia va a «Altres notes» (CARPETA_ALTRES)', () => {
  expect(CARPETA_ALTRES).toBe('f-notes');
  expect(NOTE_FOLDERS_SEED.find((carpeta) => carpeta.id === CARPETA_ALTRES)?.name).toBe('Altres notes');
  const [item] = itemsPublicatsDe({ fonts: [['receptes', [{ id: 'r1', title: 'Coca', ownerUserId: 'u-pep' }]]] }, aliesDePep);
  expect(item).toMatchObject({ id: 'publicacio:receptes:r1', categoryIds: [CARPETA_ALTRES], data: { seccio: 'receptes' } });
});

/* Poliment de F4 (revisió de la Marató 2230) · L'id d'una secció no és cap nom. */
test('F4 · una secció desconeguda porta l’etiqueta neutra «Publicació», mai el seu id cru; les del catàleg, el seu nom', () => {
  const [item] = itemsPublicatsDe({ fonts: [['receptes', [{ id: 'r1', title: 'Coca', ownerUserId: 'u-pep' }]]] }, aliesDePep);
  expect(ETIQUETA_NEUTRA).toBe('Publicació');
  expect(item.labels).toEqual([{ text: ETIQUETA_NEUTRA, className: 'sdp-badge-system' }]);
  // La ruta i el xat de la publicació continuen sabent d'on és.
  expect(item.data).toMatchObject({ seccio: 'receptes', ruta: '/receptes/r1' });
  expect(['mur', 'mercat', 'events', 'multimedia', 'receptes', undefined].map(etiquetaDeSeccio))
    .toEqual(['Mur', 'Mercat', 'Esdeveniments', 'Multimèdia', 'Publicació', 'Publicació']);
});

/* F4 (bloquejant de Codex, relleus 16 i 21) · El format de l'id es desfà ací:
   el Bloc sap de quina font és la publicació triada i quina font omple cada
   carpeta pròpia. */
test('F4 · la secció d’un id de publicació i la d’una carpeta pròpia; res per a una nota o una carpeta qualsevol', () => {
  expect(['mur', 'mercat', 'events', 'multimedia', 'receptes']
    .map((seccio) => seccioDePublicacio(publicacioComANota({ id: 'a:b/c' }, seccio).id)))
    .toEqual(['mur', 'mercat', 'events', 'multimedia', 'receptes']);
  expect([null, undefined, '', 'n1', '3e2ce4b4-d71d-4e1f-be12-b3c08f73c747', 'publicacio:', 'publicacio:mur'].map(seccioDePublicacio))
    .toEqual([null, null, null, null, null, null, null]);
  expect(['f-mur', 'f-mercat', 'f-events', 'f-media'].map(seccioDeCarpeta)).toEqual(['mur', 'mercat', 'events', 'multimedia']);
  expect([CARPETA_ALTRES, 'f-pobles', null, undefined].map(seccioDeCarpeta)).toEqual([null, null, null, null]);
});

/* Revisió de F4 (ronda 2, R2d) · El camí d'un id (publicació o nota) el
   decidix el prefix, també quan l'id és malformat i no té secció. */
test('F4 · un id amb el prefix publicacio:, ben format o no, és de publicació; cap altre ho és', () => {
  expect(['publicacio:mur:p2', 'publicacio:multimedia:a:b', 'publicacio::x', 'publicacio:mur', 'publicacio:']
    .map(esIdDePublicacio)).toEqual([true, true, true, true, true]);
  expect([null, undefined, '', 'n1', 'publicacio', 'Publicacio:mur:p2', ' publicacio:mur:p2', 'x-publicacio:mur:p2']
    .map(esIdDePublicacio)).toEqual([false, false, false, false, false, false, false, false]);
});

test('F4 (D2) · la publicació del Mur nascuda d’una nota pròpia no s’emet: la peça és la nota', () => {
  const doMur = { id: 'p1', title: 'De la nota', ownerUserId: 'u-pep' };
  const altre = { id: 'p2', title: 'Directa', ownerUserId: 'u-pep' };
  const publicadesDesDeNotes = new Set(['p1']);
  expect(itemsPublicatsDe({ feedPosts: [doMur, altre] }, aliesDePep, { publicadesDesDeNotes }).map((i) => i.id)).toEqual(['publicacio:mur:p2']);
  // Només el Mur: publicar una nota no escriu a cap altra secció.
  expect(itemsPublicatsDe({ marketItems: [doMur] }, aliesDePep, { publicadesDesDeNotes }).map((i) => i.id)).toEqual(['publicacio:mercat:p1']);
  // Sense l'opció, com sempre.
  expect(itemsPublicatsDe({ feedPosts: [doMur] }, aliesDePep)).toHaveLength(1);
});

test('F4 · en remot, l’entitat amb l’slug declarat de la llavor reconeix la samarreta i l’Aplec; ningú més', () => {
  const samarretaDeLaLlavor = MOCK_MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
  const macMini = MOCK_MARKET_ITEMS.find((item) => item.author_id === 'javillinares');
  const aplec = CALENDAR_EVENTS.find((acte) => acte.id === 'aplec-2023');
  const dades = { marketItems: [samarretaDeLaLlavor, macMini], events: [aplec] };
  // Sense dataMode: remot, com en producció.
  const entitat = aliesDeLActor({ tipus: 'entitat', id: 'uuid-org', slug: 'soc-de-poble' });
  expect(itemsPublicatsDe(dades, entitat).map((i) => [i.id, i.categoryIds[0]])).toEqual([
    ['publicacio:mercat:samarreta-socdepoble', 'f-mercat'], ['publicacio:events:aplec-2023', 'f-events']
  ]);
  // Una altra entitat, no.
  expect(itemsPublicatsDe(dades, aliesDeLActor({ tipus: 'entitat', id: 'uuid-forn', slug: 'forn-de-la-torre' }))).toEqual([]);
  // La persona remota no té pont (D1): el Mac Mini de 'javillinares' no és seu.
  expect(itemsPublicatsDe(dades, aliesDeLActor({ tipus: 'persona', id: 'uuid-javi', rol: 'persona' }))).toEqual([]);
  // Una persona amb l'slug de l'entitat no és l'entitat (T6: el pont és d'entitats).
  expect(itemsPublicatsDe(dades, aliesDeLActor({ tipus: 'persona', id: 'uuid-x', slug: 'soc-de-poble' }))).toEqual([]);
  // El convidat, res, tampoc en llavor.
  expect(itemsPublicatsDe(dades, aliesDeLActor({ tipus: 'persona', id: 'convidat', rol: 'convidat' }, { dataMode: 'seed' }))).toEqual([]);
});
