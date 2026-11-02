// @vitest-environment node
/**
 * IDEA-61 (T0, prompt 261102_1532) · Les fitxes d'àmbit a l'índex de /cerca
 * (indexCerca.js): una fitxa de vehicle, treball o habitatge viu a la secció
 * 'mur' amb l'àmbit al payload, s'indexa amb el tipus del seu àmbit, obri
 * /<ambit>/<id> i es busca pels seus camps estructurats, mai pel contacte.
 * Una publicació de sempre no canvia en res (Llei del Píxel). Dades
 * sintètiques.
 */
import { describe, expect, test } from 'vitest';
import { resolveItemPath } from '../../config/navigation.js';
import { AMBITS } from '../../utils/publicacioUniversal.js';
import { IDS_TIPUS, TIPUS_CERCA, cercaEntrades, deMedia, deProducte, dePublicacio, tipusValid } from './indexCerca.js';

const TORRE = 'La Torre de les Maçanes';
const VEHICLE = Object.freeze({
  id: 'v1', title: 'Cotxe a Alcoi dilluns', type: 'vehicle', ambit: 'vehicle', estat: 'disponible', town_name: TORRE,
  author_name: 'Pepa Fictícia', created_at: '2026-11-01T08:00:00.000Z', content: 'Isc del llavador a les 7:30.',
  dades: Object.freeze({
    modalitat: 'oferisc_places', lloc_eixida: TORRE, lloc_arribada: 'Alcoi', data_eixida: '2026-11-03', hora_eixida: '07:30', places: 3, aportacio: '2 €'
  })
});
const TREBALL = Object.freeze({
  id: 't1', title: 'Busquem qui pode', ambit: 'treball', estat: 'reservat',
  dades: Object.freeze({ modalitat: 'oferta_feina', ofici: 'Poda d’oliveres', municipi: 'Benifallim', contacte: '612345678 poda@exemple.com' })
});
const HABITATGE = Object.freeze({
  id: 'h1', title: 'Casa al carrer Major', ambit: 'habitatge', estat: 'tancat', dades: Object.freeze({ modalitat: 'lloguer', preu: '400 €', habitacions: 3 })
});
const DE_SEMPRE = Object.freeze({ id: 'p1', title: 'Festa de la Cirera', town_name: TORRE, created_at: '2026-06-01T10:00:00.000Z', summary: 'Programa.' });

describe('TIPUS_CERCA', () => {
  test('les tres verticals, darrere del Mercat, amb la clau i la reserva de la taula d’i18n', () => {
    const ids = TIPUS_CERCA.map((tipus) => tipus.id);
    const mercat = ids.indexOf('mercat');
    expect(ids.slice(mercat, mercat + 4)).toEqual(['mercat', 'vehicle', 'treball', 'habitatge']);
    expect(TIPUS_CERCA.filter((tipus) => ['vehicle', 'treball', 'habitatge'].includes(tipus.id)).map((tipus) => [tipus.clau, tipus.text])).toEqual([
      ['section.search.tipus.vehicle', 'Compartir cotxe'],
      ['section.search.tipus.treball', 'Treball'],
      ['section.search.tipus.habitatge', 'Habitatge']
    ]);
    for (const ambit of AMBITS.filter((candidat) => candidat !== 'mur')) expect(IDS_TIPUS, ambit).toContain(ambit);
    expect(tipusValid('vehicle')).toBe('vehicle');
    expect(tipusValid('habitatge')).toBe('habitatge');
    expect(tipusValid('mur')).toBe('tot');
  });
});

describe('dePublicacio amb una fitxa d’àmbit', () => {
  test('un vehicle s’indexa amb el tipus vehicle, la clau vehicle:<id>, l’enllaç /vehicle/<id>, l’àmbit i l’estat', () => {
    const e = dePublicacio(VEHICLE);
    expect([e.tipus, e.clau, e.href, e.ambit, e.estat]).toEqual(['vehicle', 'vehicle:v1', '/vehicle/v1', 'vehicle', 'disponible']);
    expect(e.titol).toBe('Cotxe a Alcoi dilluns');
    expect(e.meta.slice(0, 2)).toEqual(['Pepa Fictícia', TORRE]);
    expect(e.poble).toBe(TORRE);
    expect(e.extracte).toBe('Isc del llavador a les 7:30.');
  });

  test('el text cercable porta l’àmbit, la modalitat (id i reserva) i els llocs: «cotxe», «oferisc» i «alcoi» la troben', () => {
    const e = dePublicacio(VEHICLE);
    for (const tros of ['compartir cotxe', 'oferisc places', 'la torre de les macanes', 'alcoi']) expect(e.text, tros).toContain(tros);
    const index = [dePublicacio(DE_SEMPRE), e];
    const { llista, perTipus } = cercaEntrades(index, 'cotxe');
    expect(llista.map((resultat) => resultat.clau)).toEqual(['vehicle:v1']);
    expect(perTipus.vehicle).toBe(1);
    expect(perTipus.publicacions).toBe(0);
    expect(cercaEntrades(index, 'alcoi', 'vehicle').llista.map((resultat) => resultat.id)).toEqual(['v1']);
    expect(cercaEntrades(index, 'cirera', 'vehicle').total).toBe(0);
    expect(cercaEntrades(index, 'cirera').llista.map((resultat) => resultat.clau)).toEqual(['publicacions:p1']);
  });

  test('el contacte d’una oferta de treball no s’indexa mai; l’ofici i el municipi, sí', () => {
    const e = dePublicacio(TREBALL);
    expect([e.tipus, e.clau, e.href, e.estat]).toEqual(['treball', 'treball:t1', '/treball/t1', 'reservat']);
    expect(e.text).toContain('oliveres');
    expect(e.text).toContain('benifallim');
    expect(e.text).toContain('oferta de feina');
    expect(e.text).not.toContain('612345678');
    expect(e.text).not.toContain('exemple');
    expect(cercaEntrades([e], 'oliveres').total).toBe(1);
    expect(cercaEntrades([e], '612345678').total).toBe(0);
    expect(cercaEntrades([e], 'exemple').total).toBe(0);
  });

  test('un estat fora del vocabulari és «disponible»; «tancat» es conserva (la faceta Estat el pinta)', () => {
    expect(dePublicacio({ ...VEHICLE, estat: 'venut' }).estat).toBe('disponible');
    expect(dePublicacio({ ...VEHICLE, estat: undefined }).estat).toBe('disponible');
    expect(dePublicacio({ ...VEHICLE, estat: 7 }).estat).toBe('disponible');
    const casa = dePublicacio(HABITATGE);
    expect([casa.tipus, casa.href, casa.estat]).toEqual(['habitatge', '/habitatge/h1', 'tancat']);
    expect(casa.text).toContain('lloguer');
  });

  test('una publicació de sempre no canvia: tipus publicacions, la ruta de sempre, sense ambit ni estat', () => {
    const e = dePublicacio(DE_SEMPRE);
    expect([e.tipus, e.clau, e.href]).toEqual(['publicacions', 'publicacions:p1', resolveItemPath({ ...DE_SEMPRE, sectionId: 'mur' })]);
    expect(e).not.toHaveProperty('ambit');
    expect(e).not.toHaveProperty('estat');
    /* Un `type` de producte sense àmbit explícit (un element de llegat) tampoc. */
    const llegat = dePublicacio({ ...DE_SEMPRE, type: 'product' });
    expect(llegat.tipus).toBe('publicacions');
    expect(llegat).not.toHaveProperty('ambit');
    /* Un `ambit` que no és del vocabulari, o 'mur', és el Mur de sempre. */
    for (const ambit of ['mur', 'cotxe', '', null, 7, ['vehicle']]) {
      const altra = dePublicacio({ ...DE_SEMPRE, ambit, estat: 'reservat' });
      expect(altra.tipus, String(ambit)).toBe('publicacions');
      expect(altra, String(ambit)).not.toHaveProperty('ambit');
      expect(altra, String(ambit)).not.toHaveProperty('estat');
      expect(altra.href, String(ambit)).toBe(e.href);
    }
  });

  test('un producte del flux universal (ambit mercat) porta l’estat i els seus camps al text; un de llegat, res nou', () => {
    const flux = deProducte({
      id: 'mp', title: 'Mel del flux', ambit: 'mercat', estat: 'complet', price: '8 €', dades: { preu: '8 €', unitat: 'pot de mig quilo', categoria: 'Mel' }
    });
    expect([flux.tipus, flux.clau, flux.ambit, flux.estat]).toEqual(['mercat', 'mercat:mp', 'mercat', 'complet']);
    expect(flux.text).toContain('pot de mig quilo');
    const llegat = deProducte({ id: 'ml', title: 'Mel de romer', price: '8 €', type: 'product' });
    expect([llegat.tipus, llegat.clau]).toEqual(['mercat', 'mercat:ml']);
    expect(llegat).not.toHaveProperty('ambit');
    expect(llegat).not.toHaveProperty('estat');
  });
});

describe('la foto d’una fitxa d’àmbit (deMedia · fotoDe)', () => {
  test('l’article d’una fitxa que viu a mur amb l’àmbit al payload porta la clau del seu àmbit; un article de sempre, la de sempre', () => {
    const foto = (article) => deMedia({ id: 'f', title: 'Foto', article }).fotoDe;
    expect(foto({ sectionId: 'mur', id: 'v1', ambit: 'vehicle' })).toBe('vehicle:v1');
    expect(foto({ sectionId: 'vehicle', id: 'v1' })).toBe('vehicle:v1');
    expect(foto({ sectionId: 'treball', id: 't1' })).toBe('treball:t1');
    expect(foto({ sectionId: 'habitatge', id: 'h1' })).toBe('habitatge:h1');
    expect(foto({ sectionId: 'mur', id: 'p1' })).toBe('publicacions:p1');
    expect(foto({ sectionId: 'mur', id: 'p1', ambit: 'mur' })).toBe('publicacions:p1');
    expect(foto({ sectionId: 'mercat', id: 'm1' })).toBe('mercat:m1');
    expect(foto({ sectionId: 'cotxe', id: 'x' })).toBeNull();
    expect(foto({ sectionId: 'mur', ambit: 'vehicle' })).toBeNull();
  });

  test('a la vista «tot», la foto d’un vehicle que ja ix no es repetix; amb el filtre Multimèdia, sí', () => {
    const vehicle = dePublicacio(VEHICLE);
    const foto = deMedia({ id: 'f1', title: 'Cotxe a Alcoi (foto)', article: { sectionId: 'mur', id: 'v1', ambit: 'vehicle' } });
    const tot = cercaEntrades([vehicle, foto], 'cotxe');
    expect(tot.llista.map((e) => e.clau)).toEqual(['vehicle:v1']);
    expect(tot.perTipus).toMatchObject({ tot: 1, vehicle: 1, multimedia: 1 });
    expect(cercaEntrades([vehicle, foto], 'cotxe', 'multimedia').llista.map((e) => e.clau)).toEqual(['multimedia:f1']);
  });
});
