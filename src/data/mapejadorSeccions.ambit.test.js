/**
 * IDEA-61 (T0, prompt 261102_1532; carril L1) · El mapejador i la fitxa d'àmbit
 * del Flux Universal de Publicació: en escriure (mapSectionSubmissionToItem,
 * branques 'mur' i 'mercat') i en llegir (elementDeFilaPublicada), `ambit`,
 * `estat` i `dades` passen per coaccionaAmbit del contracte. Una fitxa que no
 * viu a la secció de la fila, o sense àmbit vàlid, no viatja; una publicació
 * del Mur de sempre queda byte a byte igual (Llei del Píxel).
 */
import { describe, expect, test } from 'vitest';
import { elementDeFilaPublicada, mapSectionSubmissionToItem } from './mapejadorSeccions.js';
import { canviaEstat, esVisibleALaLlista, perAmbit, projeccioPayload } from '../utils/publicacioUniversal.js';

const PUBLICAT = '2026-11-02T18:00:00.000Z';
const textHostil = () => JSON.parse('{"toString":0}');

/* El payload que escriu publishNote per a una publicació del Mur de sempre. */
const deSempre = () => ({
  sectionId: 'mur', type: 'feed', title: 'La fira', subtitle: 'Diumenge', description: 'Entradeta',
  content: '<p>Cos</p>', copyright: '', image: '/assets/fira.png', labels: [{ text: 'Fira', className: 'sdp-badge-tag' }],
  author_name: 'Maria', author_location: 'Sella', poble_id: 'sella'
});
/* La fitxa d'un viatge, projectada pel contracte (el que publishNote envia). */
const viatge = () => projeccioPayload({
  ...deSempre(), title: 'Viatge a Alcoi', ambit: 'vehicle', estat: 'disponible',
  dades: { modalitat: 'oferisc_places', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15', places: '3', aportacio: '5 €' }
});
const producte = () => projeccioPayload({
  ...deSempre(), sectionId: 'mercat', title: 'Oli', ambit: 'mercat', estat: 'disponible',
  dades: { preu: '12 €', unitat: 'litre', categoria: 'Oli d’oliva' }
});

const escriu = (sectionId, payload, id = 'p1') => mapSectionSubmissionToItem({ id, sectionId, createdAt: PUBLICAT, payload });
const llig = (payload, columnes = {}) => elementDeFilaPublicada({
  id: 'p1', payload: JSON.parse(JSON.stringify(payload)), titol: 'Maria', createdAt: PUBLICAT, updatedAt: PUBLICAT, ownerUserId: 'U', authorOrgId: null, ...columnes
});
const senseAmbit = (element) => {
  for (const clau of ['ambit', 'estat', 'dades']) expect(element, clau).not.toHaveProperty(clau);
};
/* Una còpia sense eixes claus. */
const sense = (objecte, ...claus) => Object.fromEntries(Object.entries(objecte).filter(([clau]) => !claus.includes(clau)));

describe('escriure (mapSectionSubmissionToItem)', () => {
  test('una fitxa de vehicle a la secció mur viatja neta: ambit, estat, dades només amb els camps del contracte i el type de l’àmbit', () => {
    const element = escriu('mur', viatge());
    expect(element).toMatchObject({ sectionId: 'mur', type: 'vehicle', title: 'Viatge a Alcoi', ambit: 'vehicle', estat: 'disponible' });
    expect(element.dades).toEqual({ modalitat: 'oferisc_places', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15', places: 3, aportacio: '5 €' });
    expect(perAmbit([element], 'vehicle')).toEqual([element]);
    expect(esVisibleALaLlista(element)).toBe(true);
  });

  test('una fitxa de mercat a la seua secció conserva price, tag i category_slug del contracte', () => {
    const element = escriu('mercat', producte());
    expect(element).toMatchObject({ sectionId: 'mercat', type: 'product', ambit: 'mercat', estat: 'disponible', price: '12 €', tag: 'Oli d’oliva', category_slug: 'oli-d-oliva' });
    expect(element.dades).toEqual({ preu: '12 €', unitat: 'litre', categoria: 'Oli d’oliva' });
    expect(perAmbit([element], 'mercat')).toEqual([element]);
  });

  test('un àmbit que no viu a la secció de la fila no viatja (mercat a mur, vehicle a mercat)', () => {
    senseAmbit(escriu('mur', { ...viatge(), ambit: 'mercat' }));
    senseAmbit(escriu('mercat', { ...producte(), ambit: 'vehicle', dades: { modalitat: 'oferisc_places' } }));
  });

  test('un payload hostil escrit per l’API: àmbit desconegut fora; estat inventat cau en disponible; dades coaccionades a primitius', () => {
    senseAmbit(escriu('mur', { title: 'X', ambit: 'xyz', estat: 'disponible', dades: { preu: '1' } }));
    senseAmbit(escriu('mur', { title: 'X', ambit: 'mur', estat: 'reservat', dades: {} }));
    senseAmbit(escriu('mur', { title: 'X', ambit: textHostil(), estat: textHostil(), dades: textHostil() }));
    const element = escriu('mur', {
      title: 'Hostil', ambit: 'vehicle', estat: 'hackejat',
      dades: { modalitat: 'oferisc_places', lloc_eixida: textHostil(), lloc_arribada: ['x'], data_eixida: '2026-02-30', places: 99, punt_trobada: ' Plaça ', contacte: 'no és del vehicle', __proto__: { ofici: 'x' } }
    });
    expect(element).toMatchObject({ ambit: 'vehicle', estat: 'disponible' });
    expect(element.dades).toEqual({ modalitat: 'oferisc_places', punt_trobada: 'Plaça' });
    expect(JSON.stringify(element)).not.toContain('toString');
  });

  test('l’estat canviat pel contracte (canviaEstat) viatja; un de fora d’ESTATS no el mou', () => {
    expect(escriu('mur', canviaEstat(viatge(), 'reservat')).estat).toBe('reservat');
    expect(escriu('mur', canviaEstat(viatge(), 'tancat')).estat).toBe('tancat');
    expect(esVisibleALaLlista(escriu('mur', canviaEstat(viatge(), 'tancat')))).toBe(false);
    expect(escriu('mur', canviaEstat(viatge(), 'venut')).estat).toBe('disponible');
  });

  test('Llei del Píxel · una publicació de sempre no rep cap clau nova, i amb un àmbit invàlid queda idèntica (deepEqual)', () => {
    const abans = escriu('mur', deSempre());
    senseAmbit(abans);
    expect(escriu('mur', { ...deSempre(), ambit: 'xyz', estat: 'reservat', dades: { preu: '1' } })).toEqual(abans);
    expect(escriu('mur', { ...deSempre(), ambit: 'mur' })).toEqual(abans);
    /* Les claus de sempre, sense cap de nova ni cap de menys. */
    expect(Object.keys(escriu('mur', deSempre())).sort()).toEqual(Object.keys(abans).sort());
    const mercatDeSempre = { ...deSempre(), sectionId: 'mercat', title: 'Samarreta', price: '15 €', tag: 'Roba' };
    const producteAbans = escriu('mercat', mercatDeSempre);
    senseAmbit(producteAbans);
    expect(escriu('mercat', { ...mercatDeSempre, ambit: 'vehicle', dades: {} })).toEqual(producteAbans);
  });

  test('les altres seccions no canvien: el mapejador no hi toca', () => {
    const acte = escriu('events', { title: 'Ball', date: '2026-11-20' });
    expect(acte).toMatchObject({ type: 'event', title: 'Ball', date: '2026-11-20' });
    senseAmbit(acte);
  });
});

describe('llegir (elementDeFilaPublicada)', () => {
  test('la fila escrita es torna a llegir igual: la fitxa neta sobreviu al viatge pel port (idempotent)', () => {
    const escrit = escriu('mur', viatge());
    const llegit = llig(escrit, { sectionId: 'mur' });
    expect(llegit).toMatchObject({ ambit: 'vehicle', estat: 'disponible', type: 'vehicle' });
    expect(llegit.dades).toEqual(escrit.dades);
    expect(llig(llegit, { sectionId: 'mur' }).dades).toEqual(escrit.dades);
    const producteEscrit = escriu('mercat', producte());
    expect(llig(producteEscrit, { sectionId: 'mercat' })).toMatchObject({ ambit: 'mercat', estat: 'disponible', price: '12 €', dades: producteEscrit.dades });
  });

  test('amb el section_id de la fila, un àmbit que no hi viu no viatja; sense, es mira el sectionId del payload', () => {
    senseAmbit(llig(viatge(), { sectionId: 'mercat' }));
    senseAmbit(llig(producte(), { sectionId: 'mur' }));
    /* El payload de publishNote porta sectionId: la mateixa guarda sense la columna. */
    senseAmbit(llig({ ...producte(), sectionId: 'mur' }));
    expect(llig({ ...producte(), sectionId: 'mercat' })).toMatchObject({ ambit: 'mercat' });
    /* Sense cap secció coneguda, només l'àmbit. */
    expect(llig(sense(viatge(), 'sectionId'))).toMatchObject({ ambit: 'vehicle' });
  });

  test('un payload hostil llegit del servidor queda net o sense àmbit, i no tomba la lectura', () => {
    senseAmbit(llig({ title: 'X', ambit: 'xyz', estat: 'reservat', dades: { preu: '1' } }, { sectionId: 'mur' }));
    senseAmbit(llig({ title: 'X', ambit: ['vehicle'], estat: null, dades: 'text' }, { sectionId: 'mur' }));
    const element = llig({ title: 'X', ambit: 'treball', estat: 'hackejat', dades: { modalitat: 'oferta_feina', ofici: 'Forner', municipi: textHostil(), contacte: 'tel 600', dedicacio: 7 } }, { sectionId: 'mur' });
    expect(element).toMatchObject({ ambit: 'treball', estat: 'disponible' });
    expect(element.dades).toEqual({ modalitat: 'oferta_feina', ofici: 'Forner', contacte: 'tel 600', dedicacio: '7' });
    /* Un «__proto__» del JSON és una clau pròpia més: cap camp heretat no entra (Object.hasOwn al contracte). */
    const verinos = llig({ ambit: 'vehicle', dades: JSON.parse('{"__proto__":{"lloc_eixida":"x"},"modalitat":"busque_lloc"}') }, { sectionId: 'mur' });
    expect(verinos.dades).toEqual({ modalitat: 'busque_lloc' });
    expect(Object.getPrototypeOf(verinos.dades)).toBe(Object.prototype);
  });

  test('Llei del Píxel · el contingut que escriu publishNote arriba igual que abans, sense cap clau nova', () => {
    const legitim = { ...deSempre(), tags: ['fira'], publish_date: '2026-10-07T10:00:00.000Z' };
    const dades = { ...llig(legitim, { sectionId: 'mur' }) };
    for (const columna of ['id', 'created_at', 'updated_at', 'ownerUserId', 'author_org_id', 'authorOrgId']) delete dades[columna];
    expect(dades).toEqual(legitim);
    expect(llig({ ...legitim, ambit: 'xyz', estat: 'x', dades: {} }, { sectionId: 'mur' })).toEqual(llig(legitim, { sectionId: 'mur' }));
  });
});
