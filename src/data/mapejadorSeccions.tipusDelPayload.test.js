/**
 * Auditoria de seguretat 261019 (F3, F7 i F9) · elementDeFilaPublicada deixa
 * viatjar com a text només el que és text: un objecte en una clau de text del
 * payload d'un veí (o {"toString":0}, que no es pot convertir en primitiu) no
 * arriba a les vistes. El contingut real, el que escriu publishNote, arriba
 * igual que abans.
 */
import { describe, expect, test } from 'vitest';
import { elementDeFilaPublicada } from './mapejadorSeccions.js';
import { origenPublic } from './origenNota.js';
import { fotosDeLAgenda, fotosDelMercat, fotosDelMur } from '../sections/multimedia/mediaContent.js';
import { propsDeTargetaDeProducte } from '../sections/mercat/targetaDeProducte.js';
import { variacionsDelProducte } from '../sections/mercat/variacionsDeProducte.js';
import { autorDeclarat, formataGps } from '../sections/multimedia/panellDeLaFoto.js';
import { deActe, deMedia, deProducte, dePublicacio } from '../sections/search/indexCerca.js';

/* Un valor JSON que tomba String(), un join i React. */
const HOSTIL = Object.freeze({ toString: 0 });
const textHostil = () => JSON.parse('{"toString":0}');

const CLAUS_DE_TEXT = [
  'title', 'name', 'subtitle', 'post_subtitle', 'lead', 'excerpt', 'description', 'summary', 'content',
  'plainText', 'body', 'entradilla', 'author', 'author_name', 'seller', 'price', 'author_location',
  'location', 'population', 'town_name', 'provincia', 'comarca', 'tag', 'category_slug', 'category',
  'copyright', 'source', 'autor', 'nomPoble', 'poble', 'poble_id', 'icon', 'imageAlt', 'type', 'kind',
  'date', 'time', 'publish_date', 'dataCaptura', 'searchText', 'comments', 'likes', 'file', 'sectionId'
];
/* Llibre Mestre, P1-61 · og_image i featured_image (la imatge que l'autor tria
   per a xarxes, config/imatgeSocial.js) són claus d'imatge com les altres. */
const CLAUS_D_IMATGE = ['image', 'image_url', 'imageSrc', 'images', 'src', 'avatar_url', 'author_avatar', 'logo_image',
  'og_image', 'featured_image'];

const fila = (payload) => elementDeFilaPublicada({
  id: 'p1', payload: JSON.parse(JSON.stringify(payload)), titol: 'Nom del servidor',
  createdAt: '2026-10-07T10:00:00Z', updatedAt: '2026-10-07T11:00:00Z', ownerUserId: 'U', authorOrgId: null
});

const payloadHostil = () => ({
  ...Object.fromEntries(CLAUS_DE_TEXT.map((clau) => [clau, textHostil()])),
  ...Object.fromEntries(CLAUS_D_IMATGE.map((clau) => [clau, [textHostil(), '/assets/a.png']])),
  labels: [{ text: textHostil(), className: 'sdp-badge-tag' }, textHostil()],
  variations: textHostil(),
  tags: [textHostil(), 'bona'],
  geolocalitzacio: { lat: textHostil(), lng: 1.5, altitud: [1] },
  origen: { tipus: 'connexio', itemId: textHostil(), titol: 'Sella' }
});

/* Cap objecte del payload hostil no ha sobreviscut on les vistes llegixen text. */
function senseValorsHostils(valor) {
  if (valor === null || typeof valor !== 'object') return true;
  if (Object.hasOwn(valor, 'toString')) return false;
  return Object.values(valor).every(senseValorsHostils);
}

describe('elementDeFilaPublicada · els tipus del payload', () => {
  test('les claus de text que porten un objecte no viatgen; la reserva de quan falta les substituïx', () => {
    const element = fila(payloadHostil());
    for (const clau of CLAUS_DE_TEXT.filter((c) => c !== 'author_name')) {
      expect(element, clau).not.toHaveProperty(clau);
    }
    /* author_name, sense el del payload, és el títol de la fila (la columna). */
    expect(element.author_name).toBe('Nom del servidor');
    expect(senseValorsHostils(element)).toBe(true);
  });

  test('les imatges en llista conserven les cadenes i deixen null on hi havia un objecte', () => {
    const element = fila(payloadHostil());
    for (const clau of CLAUS_D_IMATGE) expect(element[clau], clau).toEqual([null, '/assets/a.png']);
    expect(fila({ image: textHostil() })).not.toHaveProperty('image');
  });

  test('revisió · un número es queda com el seu text, un booleà no viatja, el preu i la revisió', () => {
    const element = fila({ title: 5, subtitle: true, type: 'event', sectionId: 7, price: 12, revision: textHostil(), time: 1030 });
    expect(element).toMatchObject({ title: '5', type: 'event', sectionId: '7', price: 12, time: '1030' });
    expect(element).not.toHaveProperty('subtitle');
    expect(element).not.toHaveProperty('revision');
    expect(fila({ price: true, revision: 3 })).toMatchObject({ revision: 3 });
    expect(fila({ price: true })).not.toHaveProperty('price');
  });

  test('revisió · una etiqueta és text pla o un objecte amb text de cadena; la que no en té cap no viatja', () => {
    expect(fila({ labels: [null, 'Fira', 7, { text: 5, className: 'sdp-badge-tag' }, true, { text: textHostil() }, { className: 'sdp-badge-tag' }] }).labels)
      .toEqual(['Fira', '7', { text: '5', className: 'sdp-badge-tag' }]);
  });

  test('etiquetes, variacions, tags, geolocalització i origen', () => {
    const element = fila(payloadHostil());
    expect(element.labels).toEqual([]);
    expect(element).not.toHaveProperty('variations');
    expect(element.tags).toEqual(['bona']);
    expect(element.geolocalitzacio).toEqual({ lng: 1.5 });
    expect(element).not.toHaveProperty('origen');
    expect(fila({ origen: 'ia' })).not.toHaveProperty('origen');
    expect(fila({ labels: textHostil() })).not.toHaveProperty('labels');
  });

  test('les vistes que tombava (Mercat, Multimèdia i el proveïdor de l’Arxiu) ja no llancen', () => {
    const element = fila(payloadHostil());
    expect(() => propsDeTargetaDeProducte(element)).not.toThrow();
    expect(() => fotosDelMur([element])).not.toThrow();
    expect(() => fotosDelMercat([element])).not.toThrow();
    expect(() => fotosDeLAgenda([element])).not.toThrow();
    expect(() => variacionsDelProducte(element)).not.toThrow();
    expect(() => autorDeclarat(element)).not.toThrow();
    expect(() => formataGps(element.geolocalitzacio)).not.toThrow();
    /* Revisió · /cerca (indexCerca.js) i la targeta d'un acte llegixen sectionId i el títol com a text. */
    for (const adaptador of [dePublicacio, deActe, deProducte, deMedia]) expect(() => adaptador(element), adaptador.name).not.toThrow();
    expect(() => fila({ type: 'event', title: 5 }).title.toLowerCase()).not.toThrow();
    for (const foto of [...fotosDelMur([element]), ...fotosDelMercat([element]), ...fotosDeLAgenda([element])]) {
      for (const [clau, valor] of Object.entries(foto)) {
        if (clau !== 'article') expect(() => String(valor), clau).not.toThrow();
      }
    }
  });

  test('[DEFECTE d’abans] sense la neteja, el mateix payload tombava el proveïdor de l’Arxiu i la targeta', () => {
    const cru = { id: 'p1', ...payloadHostil(), image_url: '/assets/a.png' };
    expect(() => fotosDelMur([cru])).toThrow(TypeError);
    expect(() => String(propsDeTargetaDeProducte(cru).body)).toThrow(TypeError);
    expect(HOSTIL.toString).toBe(0);
  });

  test('el contingut que escriu publishNote arriba igual que abans', () => {
    const origen = origenPublic({ tipus: 'connexio', itemId: 'sella', titol: 'Sella', sectionId: 'pobles', ruta: '/pobles/sella', objecte: 'poble' });
    const extern = origenPublic({ tipus: 'extern', url: 'https://exemple.cat/article', titol: 'Article' });
    const legitim = {
      sectionId: 'mur', type: 'compartit', origen, title: 'La fira', subtitle: 'Diumenge', description: 'Entradeta',
      content: '<p>Cos</p>', copyright: '© Maria', image: '/assets/fira.png', labels: [{ text: 'Fira', className: 'sdp-badge-tag' }],
      author_name: 'Maria', author: 'Maria', author_avatar: 'sdp-media://mitjans/p/u/avatars/a.png', author_location: 'Sella',
      poble_id: 'sella', publish_date: '2026-10-07T10:00:00.000Z', icon: '🎉', logo_image: '/assets/logo.png',
      image_url: ['/assets/fira.png'], price: 12, tags: ['fira'], geolocalitzacio: { lat: 38.6, lng: -0.3, altitud: 400 },
      variations: [{ id: 'gris', name: 'Gris', price: '15€' }], searchText: 'la fira'
    };
    const dades = { ...fila(legitim) };
    for (const columna of ['id', 'created_at', 'updated_at', 'ownerUserId', 'author_org_id', 'authorOrgId']) delete dades[columna];
    expect(dades).toEqual(legitim);
    expect(fila({ origen: extern }).origen).toEqual(extern);
  });
});
