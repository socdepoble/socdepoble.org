import { describe, expect, test } from 'vitest';
import {
  CARPETA_ALTRES, CARPETA_PER_SECCIO, ETIQUETA_NEUTRA, esAliesDelProjecte, esIdDePublicacio, etiquetaDeSeccio, itemsPublicatsDe,
  pertanyALActor, publicacioComANota, seccioDeCarpeta, seccioDePublicacio
} from './masDeLUsuari.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, aliesDeLActor } from '../../data/identitatsSeed.js';
import { NOTE_FOLDERS_SEED } from '../../data/appSeed.js';
import { SYSTEM_PAGES } from '../../config/systemPages.js';
import { MOCK_MARKET_ITEMS } from '../mercat/marketSeed.js';
import { CALENDAR_EVENTS } from '../mur/eventsSeed.js';
import { targetesDeSistema } from '../mur/targetesMur.js';
import { PAGE_COPY } from '../text/pageContent.js';

/* T1 · el MAS ensenya només el que ha publicat l'actor. */
const samarreta = { id: 'samarreta-socdepoble', title: 'Samarreta', author_id: 'soc-de-poble_official', author_entity_id: 'socdepoble', seller: 'Sóc de Poble', created_at: '2026-08-15T12:33:00.000Z', images: ['/a.png'], description: 'Mapa del tresor' };
const mac = { id: 'mac-mini-m4', title: 'Mac Mini', author_id: 'javillinares', seller: 'Javi', created_at: '2026-02-15T12:00:00.000Z' };
const remotEntitat = { id: 'r1', title: 'Fira', ownerUserId: 'u-javi', authorOrgId: 'org-1' };
const remotPersona = { id: 'r2', title: 'Ruta', ownerUserId: 'u-javi', authorOrgId: null };

test('en seed, l’entitat pilot veu la samarreta i la persona pilot el Mac Mini', () => {
  const entitat = aliesDeLActor({ tipus: 'entitat', id: 'socdepoble', slug: ENTITAT_PILOT_SLUG }, { dataMode: 'seed' });
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
  /* Grup E (261008) · Les pàgines de sistema del Mur són de l'entitat pilot i
     de ningú més: tampoc de qui diu que les signa (un autor no hi compta). */
  expect(itemsPublicatsDe({ feedPosts: [{ id: 'legal', isSystem: true, author_id: 'javillinares' }] }, new Set(['javillinares']))).toEqual([]);
  expect(itemsPublicatsDe({ feedPosts: [{ id: 'legal', isSystem: true, author_id: 'javillinares' }] }, new Set(['socdepoble'])).map((i) => i.id))
    .toEqual(['publicacio:mur:legal']);
});

/* ── Grup E de l'Onada 4 (prompt 261008_1201, tasca 2; decisió del Mestre del
   261008: el «Sóc de Poble loguejat» és l'ENTITAT socdepoble) ── Les deu
   pàgines del sistema que el Mur signa com a «Sóc de Poble» (targetesDeSistema
   amb el PAGE_COPY de veres) són de l'entitat pilot, en llavor i en remot
   (uuid de servidor + slug declarat); d'una persona, mai. */
describe('Grup E · les pàgines del sistema al MAS', () => {
  const SISTEMA = targetesDeSistema(PAGE_COPY);
  const ENTITAT_LLAVOR = aliesDeLActor({ tipus: 'entitat', id: ENTITAT_PILOT_ID, slug: ENTITAT_PILOT_SLUG }, { dataMode: 'seed' });
  const ENTITAT_REMOTA = aliesDeLActor({ tipus: 'entitat', id: 'uuid-org', slug: ENTITAT_PILOT_SLUG });

  /* Onada 8 (261009) · Dotze: la Consola i el Cervell hi entren com a
     pàgines del sistema. Abans, deu.
     Ordre del Mestre (261026_2126; prompt 261026_2130, tasca 1) · Tretze:
     hi entra «Descàrregues i Aplicacions». Abans, dotze.
     Ordre del Mestre (30-10-2026; candidatura NLnet NGI Fediversity) ·
     Catorze: hi entra «Candidatura Europea NLnet · NGI Fediversity». Abans,
     tretze. */
  test('les catorze pàgines del Mur, a «Mur» (f-mur), per a l’entitat pilot en llavor i en remot', () => {
    expect(SISTEMA).toHaveLength(SYSTEM_PAGES.length);
    expect(SYSTEM_PAGES).toHaveLength(14);
    for (const alies of [ENTITAT_LLAVOR, ENTITAT_REMOTA]) {
      expect(esAliesDelProjecte(alies)).toBe(true);
      const items = itemsPublicatsDe({ feedPosts: SISTEMA }, alies);
      expect(items.map((item) => item.id)).toEqual(SYSTEM_PAGES.map((pagina) => `publicacio:mur:${pagina.key}`));
      expect(items.every((item) => item.kind === 'publicacio' && item.categoryIds[0] === 'f-mur')).toBe(true);
    }
  });

  test('una persona (llavor, remot o amb l’slug de l’entitat), el convidat i una altra entitat: cap', () => {
    const cap = [
      aliesDeLActor({ tipus: 'persona', id: 'u-javi', rol: 'persona' }, { dataMode: 'seed' }),
      aliesDeLActor({ tipus: 'persona', id: 'uuid-javi', rol: 'persona' }),
      aliesDeLActor({ tipus: 'persona', id: 'uuid-x', rol: 'persona', slug: ENTITAT_PILOT_SLUG }),
      aliesDeLActor({ tipus: 'persona', id: 'convidat', rol: 'convidat' }, { dataMode: 'seed' }),
      aliesDeLActor({ tipus: 'entitat', id: 'uuid-forn', slug: 'forn-de-la-torre' }),
      // Una entitat remota sense el slug declarat no és la pilot (no es casa pel nom).
      aliesDeLActor({ tipus: 'entitat', id: 'uuid-org' })
    ];
    for (const alies of cap) {
      expect(esAliesDelProjecte(alies)).toBe(false);
      expect(itemsPublicatsDe({ feedPosts: SISTEMA }, alies)).toEqual([]);
    }
    expect([null, undefined, new Set()].map(esAliesDelProjecte)).toEqual([false, false, false]);
  });

  test('la ruta d’una pàgina del sistema és la seua (mainHref), mai /mur/:id; una de fora, la de sempre', () => {
    const items = itemsPublicatsDe({ feedPosts: SISTEMA }, ENTITAT_REMOTA);
    expect(items.map((item) => item.data.ruta)).toEqual(SYSTEM_PAGES.map((pagina) => pagina.href));
    expect(items.find((item) => item.id === 'publicacio:mur:xat').data).toMatchObject({ seccio: 'mur', ruta: '/page/xat' });
    // Defensa en profunditat (esRutaInterna, com TargetaDelMur): un mainHref de fora no és cap ruta.
    expect(publicacioComANota({ id: 'legal', isSystem: true, mainHref: 'https://fora.example/x' }, 'mur').data.ruta).toBe('/mur/legal');
    // Un element que no és del sistema no porta la seua ruta per mainHref.
    expect(publicacioComANota({ id: 'p1', mainHref: '/projecte' }, 'mur').data.ruta).toBe('/mur/p1');
  });

  test('el títol i la data del copy: la de creació de la pàgina', () => {
    const [projecte] = itemsPublicatsDe({ feedPosts: SISTEMA.filter((pagina) => pagina.id === 'projecte') }, ENTITAT_LLAVOR);
    expect(projecte.title).toBe(PAGE_COPY.projecte.title);
    expect(projecte.updatedAt).toBe(PAGE_COPY.projecte.date);
  });
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
  /* Ordre del Mestre (261007) · Amb el slug declarat 'socdepoble', l'entitat
     ja casa amb la samarreta i l'Aplec pel seu propi slug: el pont de F4 (els
     àlies del padró, identitatsSeed · aliesDeLActor) només es veu amb un
     element signat amb un àlies que no és cap slug. `delPont` porta només
     author_id 'soc-de-poble_official', sense cap signatura d'entitat. */
  const delPont = { id: 'pont-f4', title: 'Signat amb l’àlies de la llavor', author_id: 'soc-de-poble_official' };
  const dades = { marketItems: [samarretaDeLaLlavor, macMini, delPont], events: [aplec] };
  // Sense dataMode: remot, com en producció.
  const entitat = aliesDeLActor({ tipus: 'entitat', id: 'uuid-org', slug: ENTITAT_PILOT_SLUG });
  expect(itemsPublicatsDe(dades, entitat).map((i) => [i.id, i.categoryIds[0]])).toEqual([
    ['publicacio:mercat:samarreta-socdepoble', 'f-mercat'], ['publicacio:mercat:pont-f4', 'f-mercat'],
    ['publicacio:events:aplec-2023', 'f-events']
  ]);
  // Una altra entitat, no.
  expect(itemsPublicatsDe(dades, aliesDeLActor({ tipus: 'entitat', id: 'uuid-forn', slug: 'forn-de-la-torre' }))).toEqual([]);
  // La persona remota no té pont (D1): el Mac Mini de 'javillinares' no és seu.
  expect(itemsPublicatsDe(dades, aliesDeLActor({ tipus: 'persona', id: 'uuid-javi', rol: 'persona' }))).toEqual([]);
  // Una persona amb l'slug de l'entitat no és l'entitat (T6: el pont és d'entitats).
  /* Esmena de la peça dades-netes (261007) · Amb el slug declarat
     (ENTITAT_PILOT_SLUG) la persona no rep cap àlies: ni els del padró ni el
     seu slug, que només és àlies d'una entitat. No veu res de l'entitat. */
  const personaAmbSlug = aliesDeLActor({ tipus: 'persona', id: 'uuid-x', slug: ENTITAT_PILOT_SLUG });
  expect(personaAmbSlug.has('soc-de-poble_official')).toBe(false);
  expect(personaAmbSlug.has(ENTITAT_PILOT_SLUG)).toBe(false);
  expect(itemsPublicatsDe(dades, personaAmbSlug)).toEqual([]);
  // El convidat, res, tampoc en llavor.
  expect(itemsPublicatsDe(dades, aliesDeLActor({ tipus: 'persona', id: 'convidat', rol: 'convidat' }, { dataMode: 'seed' }))).toEqual([]);
});

/* Esmena de la peça dades-netes (261007) · Abans era una prova [DEFECTE]: el
   slug declarat de l'entitat pilot ('socdepoble') és el mateix text amb què
   la llavor signa la samarreta i l'Aplec (author_entity_id), aliesDeLActor
   afegia el slug de qualsevol actor i pertanyALActor no mira el tipus de
   l'autor, de manera que una persona amb l'slug de l'entitat els veia com a
   seus. Tancat a identitatsSeed.js (aliesDeLActor: el slug, només per a una
   entitat): ara és de regressió, en remot i en llavor. L'entitat, amb el
   mateix slug, continua veient-los. */
test('F4 · una persona amb l’slug de l’entitat pilot no veu la samarreta ni l’Aplec; l’entitat, sí', () => {
  const dades = {
    marketItems: [MOCK_MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble')],
    events: [CALENDAR_EVENTS.find((acte) => acte.id === 'aplec-2023')]
  };
  const persona = { tipus: 'persona', id: 'uuid-x', rol: 'persona', slug: ENTITAT_PILOT_SLUG };
  expect(itemsPublicatsDe(dades, aliesDeLActor(persona))).toEqual([]);
  // En llavor, la persona rep els àlies de la persona pilot, però mai els de l'entitat.
  expect(itemsPublicatsDe(dades, aliesDeLActor(persona, { dataMode: 'seed' }))).toEqual([]);
  // El slug d'una entitat continua valent com a àlies.
  const entitat = aliesDeLActor({ tipus: 'entitat', id: 'uuid-org', slug: ENTITAT_PILOT_SLUG });
  expect(entitat.has(ENTITAT_PILOT_SLUG)).toBe(true);
  expect(itemsPublicatsDe(dades, entitat).map((i) => i.id)).toEqual([
    'publicacio:mercat:samarreta-socdepoble', 'publicacio:events:aplec-2023'
  ]);
  // Una entitat qualsevol, amb el seu slug: l'àlies hi és, encara que no signe res de la llavor.
  expect(aliesDeLActor({ tipus: 'entitat', id: 'uuid-forn', slug: 'forn-de-la-torre' })).toEqual(new Set(['uuid-forn', 'forn-de-la-torre']));
});
