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
import { AMBITS, RESERVES_I18N } from '../../utils/publicacioUniversal.js';
import {
  IDS_TIPUS, TIPUS_CERCA, TIPUS_DE_LA_FONT_MUR, cercaEntrades, deActe, deActeDelCalendari, deMedia, deProducte, dePublicacio, tipusValid
} from './indexCerca.js';

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

/* G3-g2-matriu-06 (part 2) · La llista dels àmbits ja no s'escriu a mà: es
   deriva d'AMBITS (el contracte), i un àmbit nou sense el seu tipus de cerca
   fa caure la prova. La clau és section.search.tipus.<àmbit> i la reserva, la
   de l'àmbit (ambit.<àmbit>). */
const AMBITS_DE_CERCA = AMBITS.filter((ambit) => ambit !== 'mur');

describe('TIPUS_CERCA', () => {
  test('cada àmbit del contracte (menys el Mur) és un tipus, darrere de Publicacions i en l’ordre d’AMBITS, amb la clau i la reserva de l’àmbit', () => {
    const ids = TIPUS_CERCA.map((tipus) => tipus.id);
    const primer = ids.indexOf(AMBITS_DE_CERCA[0]);
    expect(ids[primer - 1]).toBe('publicacions');
    expect(ids.slice(primer, primer + AMBITS_DE_CERCA.length)).toEqual(AMBITS_DE_CERCA);
    expect(TIPUS_CERCA.filter((tipus) => AMBITS_DE_CERCA.includes(tipus.id)).map((tipus) => [tipus.clau, tipus.text])).toEqual(
      AMBITS_DE_CERCA.map((ambit) => [`section.search.tipus.${ambit}`, RESERVES_I18N[`ambit.${ambit}`]])
    );
    for (const ambit of AMBITS_DE_CERCA) {
      expect(IDS_TIPUS, ambit).toContain(ambit);
      expect(tipusValid(ambit), ambit).toBe(ambit);
    }
    expect(tipusValid('mur')).toBe('tot');
  });

  /* G3-pedra-seca-i18n-16 · «Calendari» volia dir una cosa al Mur (la píndola
     ho porta tot: els actes i les fitxes d'àmbit 'calendari', agendaMur.js ·
     esActeDelCalendari) i una altra a la cerca (dos xips: «Agenda», els actes;
     «Calendari», només les fitxes). Ara és un sol tipus amb el nom de la
     píndola, com Mercat (els productes de sempre i les fitxes 'mercat'), i un
     ?tipus=agenda d'abans porta al Calendari. */
  test('Calendari és un sol tipus: els actes de l’agenda i les fitxes «calendari»; ?tipus=agenda d’abans hi porta', () => {
    expect(IDS_TIPUS).not.toContain('agenda');
    expect(tipusValid('agenda')).toBe('calendari');
    const acte = deActeDelCalendari({ id: 'e1', title: 'Curs de pedra en sec a Fageca', date: '2026-11-21' });
    const fitxa = dePublicacio({ id: 'c1', title: 'Curs de pedra en sec a Alcosser', ambit: 'calendari', estat: 'disponible', dades: { data_inici: '2026-11-28', lloc: 'Alcosser' } });
    expect([acte.tipus, acte.clau, fitxa.tipus, fitxa.clau]).toEqual(['calendari', 'calendari:e1', 'calendari', 'calendari:c1']);
    const { llista, perTipus } = cercaEntrades([acte, fitxa], 'pedra', 'calendari');
    expect(llista.map((e) => e.id).sort()).toEqual(['c1', 'e1']);
    expect(perTipus.calendari).toBe(2);
    expect(deMedia({ id: 'f', title: 'Foto', article: { sectionId: 'events', id: 'e1' } }).fotoDe).toBe('calendari:e1');
    /* La tria de targetes de l'editor (NotesEditor) continua amb deActe: el
       tipus 'agenda', que formaDelGrup.js du a l'objecte 'esdeveniment'. */
    const perALEditor = deActe({ id: 'e1', title: 'Curs de pedra en sec a Fageca', date: '2026-11-21' });
    expect([perALEditor.tipus, perALEditor.clau]).toEqual(['agenda', 'agenda:e1']);
    expect({ ...perALEditor, tipus: 'calendari', clau: 'calendari:e1' }).toEqual(acte);
  });

  /* G3-g2-matriu-06 i G3-ah-conformitat-07 (ARB-L4-01) · La font del Mur de
     /cerca (useCercaGlobal) declara els tipus que en naixen: es deriven
     d'AMBITS. Abans, Calendari, Mapa i Animalets no hi eren i, amb el Mur
     carregant o caigut, el filtre deia «Cap resultat». */
  test('TIPUS_DE_LA_FONT_MUR: tots els tipus que naixen del Mur (publicacions, actes, productes i cada fitxa d’àmbit)', () => {
    expect(TIPUS_DE_LA_FONT_MUR).toEqual(['publicacions', ...AMBITS_DE_CERCA]);
    const nascuts = [
      dePublicacio(DE_SEMPRE).tipus, deActeDelCalendari({ id: 'e1', title: 'Aplec' }).tipus, deProducte({ id: 'm1', title: 'Mel' }).tipus,
      ...AMBITS_DE_CERCA.map((ambit) => (ambit === 'mercat' ? deProducte({ id: 'mp', title: 'x', ambit }) : dePublicacio({ id: ambit, title: 'x', ambit })).tipus)
    ];
    for (const tipus of nascuts) {
      expect(TIPUS_DE_LA_FONT_MUR, tipus).toContain(tipus);
      expect(IDS_TIPUS, tipus).toContain(tipus);
    }
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
