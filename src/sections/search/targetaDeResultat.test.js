/**
 * Proves pures de la vista «Targetes» de /cerca (targetaDeResultat.js).
 * Ordre del Mestre (261019 21:34, punt 9) · Doble vista (llista / targetes)
 * per a Persones, Entitats, Pobles i Mercat, amb les mateixes dades i el
 * mateix enllaç que la fila de la llista.
 */
import { expect, test } from 'vitest';
import { TIPUS_AMB_TARGETES, propsDeTargetaDeResultat, teVistaDeTargetes, vistaValida } from './targetaDeResultat.js';
import { deAgent, deIdentitat, deMembre, dePoble, deProducte, dePublicacio, IDS_TIPUS } from './indexCerca.js';

test('?vista=: només «graella» obri les targetes; qualsevol altre valor (o cap) és la llista', () => {
  expect(vistaValida('graella')).toBe('graella');
  for (const valor of [null, undefined, '', 'llista', 'targetes', 'GRAELLA', '<script>']) expect([valor, vistaValida(valor)]).toEqual([valor, 'llista']);
});

test('Persones, Entitats, Pobles, Mercat i les tres verticals (IDEA-61) ofereixen les targetes; Tot i la resta, no', () => {
  const amb = ['persones', 'entitats', 'pobles', 'mercat', 'vehicle', 'treball', 'habitatge'];
  expect(TIPUS_AMB_TARGETES).toEqual(amb);
  expect(TIPUS_AMB_TARGETES.every((tipus) => IDS_TIPUS.includes(tipus))).toBe(true);
  expect(IDS_TIPUS.filter(teVistaDeTargetes)).toEqual(amb);
  expect(teVistaDeTargetes('tot')).toBe(false);
  for (const tipus of ['publicacions', 'agenda', 'multimedia', 'notes', 'converses', 'pagines']) expect(teVistaDeTargetes(tipus), tipus).toBe(false);
});

/* IDEA-61 (T0, prompt 261102_1532) · Una fitxa d'àmbit és una targeta com un
   producte: l'enllaç és el del seu àmbit i la meta de la fila va en etiquetes. */
test('una fitxa de Compartir cotxe: l’enllaç /vehicle/<id>, la meta de la fila en etiquetes, sense boina ni foto', () => {
  const vehicle = propsDeTargetaDeResultat(dePublicacio({
    id: 'v1', title: 'Cotxe a Alcoi', ambit: 'vehicle', estat: 'disponible', author_name: 'Pepa Fictícia',
    dades: { modalitat: 'oferisc_places', lloc_eixida: 'Benifallim', lloc_arribada: 'Alcoi', data_eixida: '2026-11-03' }
  }));
  expect([vehicle.title, vehicle.mainHref, vehicle.imageUrl, vehicle.avatarUrl, vehicle.labels, vehicle.idElement, vehicle.hasFooter])
    .toEqual(['Cotxe a Alcoi', '/vehicle/v1', undefined, undefined, ['Pepa Fictícia'], 'vehicle:v1', false]);
});

/* Revisió adversarial · La boina és la del directori (boinaDelPoble): cara i
   meta, sense el nom ni un enllaç propi. El nom, una sola vegada (el títol), i
   un sol enllaç, el de tota la targeta. */
test('una persona: la boina és la del directori (cara i meta), el nom és el títol i l’únic enllaç, sense etiquetes ni peu', () => {
  const persona = deAgent({ id: 'u7', name: 'Pepa Güell', type: 'PERSON', avatar_url: '/assets/pepa.jpg', town_name: 'Benifallim' });
  expect(propsDeTargetaDeResultat(persona)).toEqual({
    title: 'Pepa Güell',
    mainHref: '/gent/u7',
    imageUrl: undefined,
    imageAlt: '',
    avatarUrl: '/assets/pepa.jpg',
    location: 'Benifallim',
    labels: [],
    idElement: 'persones:u7',
    hasFooter: false
  });
});

test('la meta de la fila mana (amb «El teu perfil» davant) i la pròpia porta a la fitxa pública', () => {
  const propia = deIdentitat({ tipus: 'persona', id: 'jo', nom: 'Javi Poble' }, { poble: 'La Vila' });
  const props = propsDeTargetaDeResultat(propia, { meta: ['El teu perfil', ...propia.meta] });
  expect([props.location, props.mainHref, props.avatarUrl]).toEqual(['El teu perfil · La Vila', '/gent/jo', undefined]);
  expect([props.author, props.authorHref]).toEqual([undefined, undefined]);
});

test('una persona del padró sense fitxa oberta: cap enllaç (ni a la targeta ni a la boina)', () => {
  const props = propsDeTargetaDeResultat(deMembre({ usuari_id: 'u1', nom: 'Maria', tipus: 'persona' }));
  expect([props.title, props.mainHref, props.authorHref, props.author]).toEqual(['Maria', undefined, undefined, undefined]);
});

test('un poble i un producte: la imatge damunt i la meta en etiquetes, sense boina', () => {
  const poble = propsDeTargetaDeResultat(dePoble({ id: 'tibi', title: 'Tibi', comarca: "L'Alcoià", population: '1.700 hab', image_url: '/assets/tibi.jpg' }));
  expect([poble.mainHref, poble.imageUrl, poble.labels, poble.author, poble.location]).toEqual(['/pobles/tibi', '/assets/tibi.jpg', ["L'Alcoià", '1.700 hab'], undefined, undefined]);
  const producte = propsDeTargetaDeResultat(deProducte({ id: 'mac', title: 'Mac Mini', price: '900 €', author_name: 'Javi Llinares', images: ['/assets/mac.jpg'] }));
  expect([producte.mainHref, producte.imageUrl, producte.labels]).toEqual(['/mercat/mac', '/assets/mac.jpg', ['900 €', 'Javi Llinares']]);
});
