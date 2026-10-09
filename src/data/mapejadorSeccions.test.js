/**
 * T5 (ordre del Mestre, 260930) · El mapejador de publicacions no s'inventa el
 * dia d'un acte: el dia només ve del payload. created_at és quan s'ha
 * publicat (i en UTC), mai el dia en què passa l'acte. El payload que torna és
 * el que appendSectionSubmissionNetworkOnly escriu a section_submissions.
 */
import { describe, expect, test } from 'vitest';
import { elementDeFilaPublicada, mapSectionSubmissionToItem } from './mapejadorSeccions.js';
import { acteAEsdeveniment } from '../sections/mur/agendaMur.js';
import { autorDe } from '../config/navigation.js';
import { trobaElement } from '../sections/detail/elementDeSeccio.js';

/* Les 00:30 de l'1-10-2026 a València: en UTC encara és el 30-09. */
const PUBLICAT = '2026-09-30T22:30:00.000Z';
const acte = (payload, createdAt = PUBLICAT) => mapSectionSubmissionToItem({
  id: 'e1', sectionId: 'events', createdAt, payload: { title: 'Ball de plaça', ...payload }
});

describe('mapSectionSubmissionToItem · els actes (events)', () => {
  test('sense dia al payload no hi ha date: la publicació no en fa de dia de l’acte', () => {
    const item = acte({});
    expect(item).not.toHaveProperty('date');
    expect(item.created_at).toBe(PUBLICAT);
    // Sense dia no hi ha acte al model: l'Agenda no el pinta cap dia.
    expect(acteAEsdeveniment(item)).toBeNull();
  });

  test.each(['', '   ', null])('un dia buit (%j) tampoc no viatja', (date) => {
    expect(acte({ date })).not.toHaveProperty('date');
  });

  test('el dia triat es conserva, també a la vora de la mitjanit UTC', () => {
    const item = acte({ date: '2026-10-01', time: '00:30' });
    expect(item).toMatchObject({ date: '2026-10-01', time: '00:30', created_at: PUBLICAT });
    expect(acteAEsdeveniment(item).inici).toEqual({ dataHora: '2026-10-01T00:30', zona: 'Europe/Madrid' });
  });

  test('la resta de l’acte es munta com sempre', () => {
    const item = acte({ date: ' 2026-10-12 ', author: 'El Rentonar', image_url: 'javascript:alert(1)' });
    expect(item).toMatchObject({
      id: 'e1', sectionId: 'events', type: 'event', title: 'Ball de plaça', date: '2026-10-12',
      author_name: 'El Rentonar', image_url: null, summary: '', description: ''
    });
    // El text de cerca, com sempre, dels camps crus del payload i sense accents.
    expect(item.searchText).toBe('ball de placa');
  });
});

/* Relleu 261007 · «Límits» §5 · map(netejaText) passava l'índex com a màxim i
   retallava cada element a la seua posició (el primer quedava buit). Les
   variacions, a més, són objectes: es netegen camp a camp, mai «[object
   Object]». Proves amb diversos elements, que és on es veia el retall. */
describe('mapSectionSubmissionToItem · variacions del Mercat i etiquetes de Notes', () => {
  const producte = (variations) => mapSectionSubmissionToItem({
    id: 'm1', sectionId: 'mercat', createdAt: PUBLICAT, payload: { title: 'Samarreta', variations }
  });
  const nota = (tags) => mapSectionSubmissionToItem({
    id: 'n1', sectionId: 'notes', createdAt: PUBLICAT, payload: { title: 'Nota', tags }
  });

  test('les variacions (objectes) arriben senceres, cap retallada per l’índex', () => {
    const variacions = [
      { name: 'Edició Gris Plom', price: '15.00€', description: 'Cotó Roly Gris. Discreta i elegant.', image: '/assets/uploads/gris.png' },
      { name: 'Edició Verda', price: '15.00€', description: 'Edició especial en color verd pi.', image: '/assets/uploads/verd.jpg', stock_status: 'Esgotat' },
      { name: 'Edició Blanca', price: '16.00€', description: 'Sense estampar.' }
    ];
    expect(producte(variacions).variations).toEqual(variacions);
  });

  test('cada camp de la variació passa pel sanejador: text net i imatge validada', () => {
    const [primera, segona] = producte([
      { name: '  Gris\u0007 ', price: 15, description: 'Línia\r\nnova', image: 'javascript:alert(1)', sku: 'X-1' },
      { name: 'Verda', image: '//fora.example/a.png' }
    ]).variations;
    expect(primera).toEqual({ name: 'Gris', price: '15', description: 'Línia\nnova', image: null });
    expect(segona).toEqual({ name: 'Verda', image: null });
    expect(JSON.stringify([primera, segona])).not.toContain('[object Object]');
  });

  /* Revisió adversarial (Relleu 261007) · Decisió 3 del Mestre (261007) · Una
     pujada pròpia es guarda com a sdp-media:// (storage.js) i validaUrl la
     tornava null: la foto pròpia d'una variació es perdia en escriure. */
  test('la imatge pròpia d’una variació (sdp-media:// dels dos buckets) es conserva', () => {
    const [publica, privada, altre] = producte([
      { name: 'Gris', image: ' sdp-media://mitjans/t/u/v.png ' },
      { name: 'Verda', image: 'sdp-media://mitjans_privats/t/u/w.webp' },
      { name: 'Blanca', image: 'sdp-media://altre_bucket/t/u/x.png' }
    ]).variations;
    expect(publica).toEqual({ name: 'Gris', image: 'sdp-media://mitjans/t/u/v.png' });
    expect(privada).toEqual({ name: 'Verda', image: 'sdp-media://mitjans_privats/t/u/w.webp' });
    expect(altre).toEqual({ name: 'Blanca', image: null });
  });

  test('una variació en cadena es conserva neta; el que no és variació no viatja', () => {
    expect(producte([' Gris ', 'Verda', null, 7, ['x']]).variations).toEqual(['Gris', 'Verda']);
    expect(producte('Gris').variations).toEqual([]);
  });

  test('les etiquetes d’una nota arriben senceres, també la primera', () => {
    expect(nota(['Festes', 'Mercat', 'Pobles del Comtat']).tags).toEqual(['Festes', 'Mercat', 'Pobles del Comtat']);
    expect(nota([' Festes\u0000 ', 'Mercat']).tags).toEqual(['Festes', 'Mercat']);
  });
});

/* Auditoria 261007 (B) · La publicació d'un veí es llig amb l'autoria de les
   columnes; cap clau del payload no fa d'autoritat. */
describe('elementDeFilaPublicada · el payload d’un veí no és autoritat', () => {
  const fila = (payload, columnes = {}) => elementDeFilaPublicada({
    id: 'p1', payload, titol: 'Títol de la fila', createdAt: '2026-10-07T10:00:00Z', updatedAt: '2026-10-07T11:00:00Z',
    ownerUserId: 'U', authorOrgId: null, ...columnes
  });

  test('una entitat del payload no signa: autorDe torna la persona de la columna', () => {
    const element = fila({ author_org_id: 'socdepoble', authorOrgId: 'socdepoble', author_entity_id: 'socdepoble' });
    expect(autorDe(element)).toEqual({ tipus: 'persona', id: 'U' });
  });

  test('l’entitat de la columna sí que signa', () => {
    expect(autorDe(fila({ author_org_id: 'altra' }, { authorOrgId: 'ORG' }))).toEqual({ tipus: 'entitat', id: 'ORG' });
  });

  test('una persona del payload no fa ombra a la propietària', () => {
    const element = fila({ ownerUserId: 'X', owner_user_id: 'X', author_user_id: 'X', author_id: 'X' });
    expect(element).toMatchObject({ ownerUserId: 'U' });
    expect(element).not.toHaveProperty('owner_user_id');
    expect(element).not.toHaveProperty('author_user_id');
    expect(element).not.toHaveProperty('author_id');
  });

  test('sense insígnia de sistema, ni fixació, ni enllaç de fora', () => {
    const element = fila({ isSystem: true, isAvis: true, type: 'sistema', is_pinned: true, pinned_position: 0, mainHref: 'https://fora.example' });
    for (const clau of ['isSystem', 'isAvis', 'type', 'is_pinned', 'pinned_position', 'mainHref']) expect(element).not.toHaveProperty(clau);
  });

  test('un tipus legítim es conserva', () => {
    expect(fila({ type: 'compartit' }).type).toBe('compartit');
  });

  test('un slug del payload no segresta el detall d’una altra publicació', () => {
    const intrusa = fila({ slug: 'a', title: 'Intrusa' }, { id: 'b' });
    const legitima = fila({ title: 'Legítima' }, { id: 'a' });
    expect(intrusa).not.toHaveProperty('slug');
    expect(trobaElement({ items: [intrusa, legitima] }, 'a')).toBe(legitima);
  });

  test('les etiquetes perden l’href i les classes que no són d’etiqueta', () => {
    const { labels } = fila({ labels: [
      { text: 'Oficial', href: 'https://fora.example', className: 'sdp-badge-system' },
      { text: 'Capa', className: 'sp-card-link-overlay sdp-badge-tag' },
      { text: 'Festes', className: 'sdp-badge-category' },
      'Pla'
    ] });
    expect(labels).toEqual([
      { text: 'Oficial' },
      { text: 'Capa', className: 'sdp-badge-tag' },
      { text: 'Festes', className: 'sdp-badge-category' },
      'Pla'
    ]);
  });

  test('les columnes d’id i dates manen, i el nom cau al títol de la fila', () => {
    const element = fila({ id: 'fals', created_at: '2099-01-01', updated_at: '2099-01-01' });
    expect(element).toMatchObject({ id: 'p1', created_at: '2026-10-07T10:00:00Z', updated_at: '2026-10-07T11:00:00Z', author_name: 'Títol de la fila' });
  });

  test('un payload buit o que no és un objecte no tomba la lectura', () => {
    expect(fila(null)).toMatchObject({ id: 'p1', ownerUserId: 'U', author_org_id: null });
    expect(fila(['x'])).not.toHaveProperty('0');
  });
});

/* Onada 6 (decisió 2 de la nit del 261009) · El mapejador d'escriptura ja no
   persistix «La Torre de les Maçanes» com a poble d'una publicació del Mur
   que no en porta; i el poble declarat (poble_id) només viatja amb la forma
   d'un id de poble. */
describe('mapSectionSubmissionToItem · el poble de la publicació', () => {
  const publicacio = (payload) => mapSectionSubmissionToItem({ id: 'p1', sectionId: 'mur', createdAt: PUBLICAT, payload: { title: 'Fira', ...payload } });

  test('sense poble al payload, cap town_name inventat', () => {
    const item = publicacio({});
    expect(item).not.toHaveProperty('town_name');
    expect(JSON.stringify(item)).not.toContain('La Torre de les Maçanes');
  });

  test('el town_name del payload es conserva net', () => {
    expect(publicacio({ town_name: ' Relleu ' }).town_name).toBe('Relleu');
  });

  test('poble_id: un slug viatja (en minúscules); qualsevol altra cosa, no', () => {
    expect(publicacio({ poble_id: 'la-torre-de-les-macanes' }).poble_id).toBe('la-torre-de-les-macanes');
    expect(publicacio({ poble_id: ' Sella ' }).poble_id).toBe('sella');
    for (const brossa of ['La Torre de les Maçanes', '../../x', 'a--b', '', { id: 'sella' }, 'x'.repeat(81)]) {
      expect(publicacio({ poble_id: brossa }), JSON.stringify(brossa)).not.toHaveProperty('poble_id');
    }
    // També al Mercat i a l'agenda.
    expect(mapSectionSubmissionToItem({ id: 'm1', sectionId: 'mercat', createdAt: PUBLICAT, payload: { poble_id: 'orxeta' } }).poble_id).toBe('orxeta');
    expect(acte({ poble_id: 'tibi' }).poble_id).toBe('tibi');
  });
});
