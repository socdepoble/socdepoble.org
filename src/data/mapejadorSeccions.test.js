/**
 * T5 (ordre del Mestre, 260930) · El mapejador de publicacions no s'inventa el
 * dia d'un acte: el dia només ve del payload. created_at és quan s'ha
 * publicat (i en UTC), mai el dia en què passa l'acte. El payload que torna és
 * el que appendSectionSubmissionNetworkOnly escriu a section_submissions.
 */
import { describe, expect, test } from 'vitest';
import { elementDeFilaPublicada, mapSectionSubmissionToItem, mergeById } from './mapejadorSeccions.js';
import { acteAEsdeveniment } from '../sections/mur/agendaMur.js';
import { autorDe } from '../config/navigation.js';
import { trobaElement } from '../sections/detail/elementDeSeccio.js';
import { variacionsDelProducte } from '../sections/mercat/variacionsDeProducte.js';

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

  /* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 1; auditoria
     Codex 2030, R6 i §3.2) · L'id estable d'una variació (el selector del
     detall la tria per ell) es conserva en escriure, net i únic dins del
     producte; el mapejador no n'inventa cap. */
  test('l’id estable d’una variació es conserva, en forma canònica', () => {
    const [gris, verda] = producte([
      { id: 'gris-plom', name: 'Edició Gris Plom', price: '15.00€' },
      { id: ' Verda-Pi ', name: 'Edició Verda', stock_status: 'Esgotat' }
    ]).variations;
    expect(gris).toEqual({ id: 'gris-plom', name: 'Edició Gris Plom', price: '15.00€' });
    expect(verda).toEqual({ id: 'verda-pi', name: 'Edició Verda', stock_status: 'Esgotat' });
  });

  test('un id que no és curt i segur no viatja, i el mapejador no n’inventa cap', () => {
    const variacions = producte([
      { id: '../mitjans_privats', name: 'A' }, { id: 'a b', name: 'B' }, { id: '<b>x</b>', name: 'C' },
      { id: 7, name: 'D' }, { id: { x: 1 }, name: 'E' }, { id: 'x'.repeat(65), name: 'F' }, { id: 'òliva', name: 'G' },
      { name: 'H' }, { id: 'x'.repeat(64), name: 'I' }
    ]).variations;
    expect(variacions.map((v) => v.id)).toEqual([undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 'x'.repeat(64)]);
    expect(variacions.map((v) => v.name)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);
  });

  test('un id repetit dins del producte: la primera el conserva, la segona viatja sense; cap variació es perd', () => {
    const variacions = producte([{ id: 'gris', name: 'A' }, { id: 'GRIS', name: 'B' }, { id: 'verda', name: 'C' }]).variations;
    expect(variacions).toEqual([{ id: 'gris', name: 'A' }, { name: 'B' }, { id: 'verda', name: 'C' }]);
  });

  test('escriure i tornar a llegir: l’id arriba igual al selector del detall', () => {
    const escrit = producte([
      { id: 'gris-plom', name: 'Edició Gris Plom', image: '/assets/uploads/gris.png' },
      { id: 'verda-pi', name: 'Edició Verda', stock_status: 'Esgotat' }
    ]);
    const llegit = elementDeFilaPublicada({ id: 'm1', payload: JSON.parse(JSON.stringify(escrit)), titol: 'Samarreta', createdAt: PUBLICAT });
    expect(llegit.variations).toEqual(escrit.variations);
    expect(variacionsDelProducte(llegit).map((v) => [v.clau, v.id, v.esgotada])).toEqual([
      ['gris-plom', 'gris-plom', false],
      ['verda-pi', 'verda-pi', true]
    ]);
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

  /* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 3; correcció F1
     de la revisió) · L'agent IA titular d'una foto no el diu el payload d'un
     veí: cap columna del servidor no el valida. Fusionada amb un element de
     l'administració amb el mateix id, la fila porta la seua propietària
     (titularDelMitja ja no hi veu cap agent: DetallMultimedia.test.jsx). */
  test('un agent titular del payload no viatja; fusionada, la fila porta la seua propietària', () => {
    const element = fila({ src: '/assets/uploads/x.jpg', kind: 'image', author_agent_id: 'iaia-maria', authorAgentId: 'iaia-maria' });
    expect(element).not.toHaveProperty('author_agent_id');
    expect(element).not.toHaveProperty('authorAgentId');
    expect(element).toMatchObject({ ownerUserId: 'U', src: '/assets/uploads/x.jpg' });
    const [fusionat] = mergeById([{ id: 'p1', src: '/assets/iaia/a.jpg', author_agent_id: 'iaia-maria' }], [element]);
    expect(fusionat).toMatchObject({ ownerUserId: 'U', src: '/assets/uploads/x.jpg' });
  });

  test('sense insígnia de sistema, ni fixació, ni enllaç de fora', () => {
    const element = fila({ isSystem: true, isAvis: true, type: 'sistema', is_pinned: true, pinned_position: 0, mainHref: 'https://fora.example' });
    for (const clau of ['isSystem', 'isAvis', 'type', 'is_pinned', 'pinned_position', 'mainHref']) expect(element).not.toHaveProperty(clau);
  });

  /* Correcció D5 (261011, refutació del front 1) · `article` (l'article on
     s'usa una foto) el posa el sistema (mediaContent.js), mai una persona: el
     Cercador el llig per a no repetir un article (indexCerca.js). */
  test('un `article` del payload no viatja: un veí no pot lligar la seua publicació a un article d’altri', () => {
    const element = fila({ title: 'Foto', src: '/assets/a.jpg', article: { sectionId: 'mercat', id: 'mac-mini-m4' } });
    expect(element).not.toHaveProperty('article');
    expect(element).toMatchObject({ title: 'Foto', src: '/assets/a.jpg' });
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

/* Revisió del Gauntlet 261017 (ID2; relleu 3: la foto de la barra és la de la
   publicació) · La foto de perfil pujada al bucket PÚBLIC
   (sdp-media://mitjans/…) que publishNote posa a author_avatar arriba a la
   fila. Abans validaUrl la buidava abans d'escriure-la, i el servidor sí que
   l'admetia (2610072230_mur_imatges_propies.sql). El bucket privat i
   qualsevol altre bucket, no: qui llig el Mur no els podria obrir. La resta
   de fonts, validaUrl com abans, i els altres camps d'imatge no canvien. */
describe('mapSectionSubmissionToItem · la foto de qui signa una publicació del Mur', () => {
  const publicacio = (payload) => mapSectionSubmissionToItem({ id: 'p1', sectionId: 'mur', createdAt: PUBLICAT, payload: { title: 'Fira', ...payload } });

  test('la del bucket públic es conserva (també des d’avatar_url, també en majúscules), neta', () => {
    expect(publicacio({ author_avatar: 'sdp-media://mitjans/t/u-1/avatars/a.webp' }).author_avatar).toBe('sdp-media://mitjans/t/u-1/avatars/a.webp');
    expect(publicacio({ avatar_url: ' sdp-media://mitjans/t/u-1/avatars/b.webp ' }).author_avatar).toBe('sdp-media://mitjans/t/u-1/avatars/b.webp');
    // Contrast final · Es desa la forma canònica (fotoDelBucketPublic).
    expect(publicacio({ author_avatar: 'SDP-MEDIA://mitjans/t/u-1/avatars/c.webp' }).author_avatar).toBe('sdp-media://mitjans/t/u-1/avatars/c.webp');
  });

  test('el bucket privat, un altre bucket o una referència sense bucket, no', () => {
    for (const ref of ['sdp-media://mitjans_privats/t/u-1/avatars/a.webp', 'sdp-media://altres/t/u-1/a.webp', 'sdp-media://mitjans', 'sdp-media:mitjans/t/a.webp']) {
      expect(publicacio({ author_avatar: ref }).author_avatar, ref).toBeNull();
    }
  });

  /* Contrast final · Un camí que puja cap al bucket privat o porta caràcters
     estranys no és del bucket públic, encara que en porte el prefix. */
  test('el prefix del bucket públic amb «..», %2e, barres inverses o control, no', () => {
    for (const ref of ['sdp-media://mitjans/../mitjans_privats/t/u-1/a.webp', 'sdp-media://mitjans/t/../../mitjans_privats/a.webp',
      'sdp-media://mitjans/%2e%2e/mitjans_privats/a.webp', 'sdp-media://mitjans/t\\..\\x.webp', 'sdp-media://mitjans/t/\u0000a.webp',
      'sdp-media://mitjans//t/a.webp', 'sdp-media://mitjans/t/a.webp?x=1', 'sdp-media://mitjans/.amagat/a.webp']) {
      expect(publicacio({ author_avatar: ref }).author_avatar, ref).toBeNull();
    }
  });

  test('la resta, validaUrl com abans (Llei del Píxel)', () => {
    expect(publicacio({ author_avatar: '/assets/gent/pepa.webp' }).author_avatar).toBe('/assets/gent/pepa.webp');
    expect(publicacio({ author_avatar: 'https://exemple.org/a.png' }).author_avatar).toBe('https://exemple.org/a.png');
    expect(publicacio({ author_avatar: '//fora.example/a.png' }).author_avatar).toBeNull();
    expect(publicacio({ author_avatar: 'javascript:alert(1)' }).author_avatar).toBeNull();
    expect(publicacio({}).author_avatar).toBeNull();
  });

  test('els altres camps d’imatge que passen per validaUrl no canvien: una sdp-media:// hi continua buidant-se', () => {
    const ref = 'sdp-media://mitjans/t/u-1/general/f.webp';
    const mur = publicacio({ image_url: ref, imageSrc: ref });
    expect([mur.image_url, mur.imageSrc]).toEqual([null, null]);
    const mercat = mapSectionSubmissionToItem({ id: 'm1', sectionId: 'mercat', createdAt: PUBLICAT, payload: { avatar_url: ref, image_url: ref } });
    expect([mercat.avatar_url, mercat.image_url, mercat.imageSrc, mercat.image]).toEqual([null, null, null, null]);
    expect(acte({ image_url: ref }).image_url).toBeNull();
  });
});

/* Auditoria Port Neutral 261025 (omissió del verificador) · mergeById feia la
   clau amb String(item.id): tots els elements sense id queien a «undefined» i
   només en sobrevivia l'últim, i un primitiu es fusionava en un objecte estrany
   ([7, 'x', true] donava [{ 0: 'x' }]). Una pèrdua silenciosa de dades. */
describe('mergeById · els elements sense id i els que no són objectes', () => {
  test('els que no porten un id de veres passen tal qual, al seu lloc, sense fusionar-se', () => {
    const fusionats = mergeById([{ title: 'A' }, { id: 'p1', title: 'U' }, { title: 'B' }], [{ title: 'C' }, { id: 'p1', title: 'U2' }]);
    expect(fusionats).toEqual([{ title: 'A' }, { id: 'p1', title: 'U2' }, { title: 'B' }, { title: 'C' }]);
    expect(mergeById([{ id: null, title: 'A' }, { id: { x: 1 }, title: 'B' }], [])).toHaveLength(2);
  });

  test('un primitiu, una llista o un null no hi entren; els ids de número es fusionen com sempre', () => {
    expect(mergeById([7, 'x', true, null, ['a']], [])).toEqual([]);
    expect(mergeById([{ id: 3, title: 'A' }], [{ id: '3', title: 'B' }])).toEqual([{ id: '3', title: 'B' }]);
  });
});
