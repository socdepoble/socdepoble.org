// @vitest-environment node
/* IDEA-61 (T0, prompt 261102_1532) · El contracte pur del Flux Universal de
   Publicació (utils/publicacioUniversal.js). Cada funció amb casos bons i
   dolents (dades no-objecte, claus reservades, enums fora de llista, enters
   com a text, dates i hores invàlides, llargàries, idempotència), la regla
   de la RLS llegida del SQL (cap section_id nou), les classes que ja existixen
   a src/css, un fuzz determinista i la qualitat del parell (ESLint en procés,
   Baseline 2022, cap caràcter invisible). Patró de
   utils/productes/producteUniversal.test.js. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';
import {
  AMBITS, CAMPS, CLAUS_RESERVADES, ESTATS, ESTATS_IMMOBLE, ESTAT_PER_DEFECTE, MODALITATS, RESERVES_I18N, SECTION_ID_PER_AMBIT,
  TO_PER_ESTAT, TYPE_PER_AMBIT, ambitDe, campDe, canviaEstat, coaccionaAmbit, esDeLAmbit, esFitxaDAmbit, esVisibleALaLlista,
  etiquetaDAmbit, etiquetaDEstat, etiquetaDOpcio, etiquetaDeCamp, etiquetesDAmbit, normalitzaDades, normalitzaEstat, perAmbit,
  projeccioPayload, resumDeFitxa, rutaDAmbit, seccioDAmbit, textCercable, tipusDAmbit, validaFitxa
} from './publicacioUniversal.js';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const car = (codi) => String.fromCodePoint(codi);
/* Caràcters que no poden anar en cru al fitxer (la prova de qualitat ho vigila): es construïxen. */
const NUL = car(0x0);
const SOH = car(0x1);
const BEL = car(0x7);
const ACCENT_AGUT = car(0x301);
const PUNT_DALT = car(0x307);
const SOMRIURE = car(0x1F600);
/* Un surrogat alt solt (la meitat d'una emoticona): PostgreSQL rebutja un jsonb que en porte. */
const SURROGAT_ALT = car(0xD83D);
const acabaEnSurrogatAlt = (text) => {
  const ultim = text.charCodeAt(text.length - 1);
  return ultim >= 0xD800 && ultim <= 0xDBFF;
};
/* Un traductor que marca cada crida: la clau i la reserva que ha rebut. */
const marca = (clau, reserva) => `[${clau}] ${reserva}`;
const VERTICALS = ['mercat', 'vehicle', 'treball', 'habitatge'];
const SECRET = 'SECRET-CONTACTE-613';

/* La TAULA DE CLAUS del prompt (ca.js), copiada literalment. */
const TAULA = {
  'ambit.mur': 'Mur', 'ambit.mercat': 'Mercat', 'ambit.vehicle': 'Compartir cotxe', 'ambit.treball': 'Treball', 'ambit.habitatge': 'Habitatge',
  'ambit.estat.disponible': 'Disponible', 'ambit.estat.reservat': 'Reservat', 'ambit.estat.complet': 'Complet', 'ambit.estat.tancat': 'Tancat',
  'ambit.modalitat.oferisc_places': 'Oferisc places', 'ambit.modalitat.busque_lloc': 'Busque lloc', 'ambit.modalitat.recarrec_comunitari': 'Recàrrec comunitari',
  'ambit.modalitat.oferta_feina': 'Oferta de feina', 'ambit.modalitat.oferisc_ofici': 'Oferisc el meu ofici', 'ambit.modalitat.jornal_agricola': 'Jornal agrícola',
  'ambit.modalitat.relleu_generacional': 'Relleu generacional', 'ambit.modalitat.lloguer': 'Lloguer', 'ambit.modalitat.venda': 'Venda',
  'ambit.modalitat.compartir_casa': 'Compartir casa', 'ambit.modalitat.masoveria_urbana': 'Masoveria urbana',
  'ambit.estatImmoble.llest_per_entrar': 'Llest per a entrar', 'ambit.estatImmoble.a_reformar': 'Per a reformar',
  'ambit.camp.modalitat': 'Modalitat', 'ambit.camp.estat': 'Estat', 'ambit.camp.lloc_eixida': 'Lloc d’eixida', 'ambit.camp.lloc_arribada': 'Lloc d’arribada',
  'ambit.camp.data_eixida': 'Dia d’eixida', 'ambit.camp.hora_eixida': 'Hora d’eixida', 'ambit.camp.data_tornada': 'Dia de tornada',
  'ambit.camp.hora_tornada': 'Hora de tornada', 'ambit.camp.places': 'Places disponibles', 'ambit.camp.aportacio': 'Aportació per plaça',
  'ambit.camp.punt_trobada': 'Punt de trobada', 'ambit.camp.preu': 'Preu', 'ambit.camp.unitat': 'Unitat', 'ambit.camp.categoria': 'Categoria',
  'ambit.camp.estoc': 'Disponibilitat', 'ambit.camp.ofici': 'Ofici o sector', 'ambit.camp.municipi': 'Municipi', 'ambit.camp.dedicacio': 'Dedicació',
  'ambit.camp.remuneracio': 'Remuneració orientativa', 'ambit.camp.contacte': 'Com contactar', 'ambit.camp.superficie_m2': 'Superfície (m²)',
  'ambit.camp.habitacions': 'Habitacions', 'ambit.camp.estat_immoble': 'Estat de l’immoble', 'ambit.camp.condicions': 'Condicions'
};

/* Fitxes de mostra, una per àmbit vertical. */
const viatge = () => ({
  modalitat: 'oferisc_places', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15', hora_eixida: '08:30',
  places: 3, aportacio: '5 €', punt_trobada: 'La plaça'
});
const oferta = () => ({ modalitat: 'oferta_feina', ofici: 'Pastor', municipi: 'La Torre', dedicacio: 'Mitja jornada', remuneracio: '900 €/mes', contacte: SECRET });
const casa = () => ({ modalitat: 'lloguer', preu: '450 €/mes', superficie_m2: 80, habitacions: 3, estat_immoble: 'a_reformar', municipi: 'La Torre', condicions: 'Sense animals' });
const producte = () => ({ preu: '3 €', unitat: 'kg', categoria: 'Verdura d’horta', estoc: 'Poc' });
const FITXES = { mercat: producte, vehicle: viatge, treball: oferta, habitatge: casa };

/* El payload d'una publicació del Mur de sempre (publishNote, NotesContext.jsx). */
const publicacioDelMur = () => ({
  sectionId: 'mur', type: 'feed', title: 'Hola poble', subtitle: '', description: '', content: '<p>Hola</p>', copyright: 'CC BY-SA',
  image: null, labels: [], author_name: 'Pepa', author_avatar: 'sdp-media://mitjans/la-torre/u1/avatars/a.webp', poble_id: 'la-torre',
  origen: { tipus: 'persona', id: 'u1' }, publish_date: '2026-11-02'
});

describe('vocabulari tancat', () => {
  test('àmbits, estats, tipus, modalitats i tons, exactes i congelats', () => {
    expect(AMBITS).toEqual(['mur', 'mercat', 'vehicle', 'treball', 'habitatge']);
    expect(ESTATS).toEqual(['disponible', 'reservat', 'complet', 'tancat']);
    expect(ESTAT_PER_DEFECTE).toBe('disponible');
    expect(TYPE_PER_AMBIT).toEqual({ mur: 'feed', mercat: 'product', vehicle: 'vehicle', treball: 'treball', habitatge: 'habitatge' });
    expect(MODALITATS).toEqual({
      vehicle: ['oferisc_places', 'busque_lloc', 'recarrec_comunitari'],
      treball: ['oferta_feina', 'oferisc_ofici', 'jornal_agricola', 'relleu_generacional'],
      habitatge: ['lloguer', 'venda', 'compartir_casa', 'masoveria_urbana']
    });
    expect(ESTATS_IMMOBLE).toEqual(['llest_per_entrar', 'a_reformar']);
    expect(TO_PER_ESTAT).toEqual({ disponible: 'exit', reservat: 'avis', complet: 'neutre', tancat: 'error' });
    for (const valor of [AMBITS, ESTATS, TYPE_PER_AMBIT, MODALITATS, MODALITATS.vehicle, MODALITATS.treball, MODALITATS.habitatge, ESTATS_IMMOBLE, TO_PER_ESTAT, CLAUS_RESERVADES, SECTION_ID_PER_AMBIT, RESERVES_I18N, CAMPS]) {
      expect(Object.isFrozen(valor)).toBe(true);
    }
  });

  test('el type de sèrie de publishNote és el de mur: feed', () => {
    expect(llig('src/sections/notes/NotesContext.jsx')).toContain("type: compartir ? 'compartit' : 'feed'");
  });

  test('SECTION_ID_PER_AMBIT només emet mur o mercat, els literals de la RLS d’insert i d’update del SQL', () => {
    expect(Object.keys(SECTION_ID_PER_AMBIT)).toEqual([...AMBITS]);
    expect(SECTION_ID_PER_AMBIT).toEqual({ mur: 'mur', mercat: 'mercat', vehicle: 'mur', treball: 'mur', habitatge: 'mur' });
    const sql = llig('supabase/migrations/2609080000_initial_schema.sql');
    const politica = (nom) => {
      const inici = sql.indexOf(`create policy "${nom}" on public.section_submissions`);
      expect(inici, nom).toBeGreaterThan(-1);
      const fi = sql.indexOf('drop policy', inici);
      return sql.slice(inici, fi === -1 ? undefined : fi);
    };
    const ADMESOS = "section_id in ('mur', 'mercat', 'events', 'multimedia', 'notes')";
    for (const nom of ['private write section_submissions', 'private update section_submissions']) {
      const text = politica(nom);
      expect(text, nom).toContain(ADMESOS);
      for (const seccio of Object.values(SECTION_ID_PER_AMBIT)) {
        expect(['mur', 'mercat'], seccio).toContain(seccio);
        expect(text, `${nom} · ${seccio}`).toContain(`'${seccio}'`);
      }
    }
    for (const ambit of AMBITS) expect(seccioDAmbit(ambit)).toBe(SECTION_ID_PER_AMBIT[ambit]);
  });
});

describe('reserves i18n', () => {
  test('RESERVES_I18N és la TAULA DE CLAUS, caràcter a caràcter', () => {
    expect(RESERVES_I18N).toEqual(TAULA);
  });

  test('cada àmbit, estat, opció d’enum i camp té la seua clau', () => {
    for (const ambit of AMBITS) expect(TAULA[`ambit.${ambit}`], ambit).toBeTruthy();
    for (const estat of ESTATS) expect(TAULA[`ambit.estat.${estat}`], estat).toBeTruthy();
    for (const ambit of VERTICALS) {
      for (const campDef of CAMPS[ambit]) {
        expect(campDef.clau).toBe(`ambit.camp.${campDef.id}`);
        expect(campDef.reserva, campDef.id).toBe(TAULA[campDef.clau]);
        if (campDef.tipus === 'enum') {
          for (const opcio of campDef.opcions) expect(TAULA[`${campDef.clauOpcions}.${opcio}`], opcio).toBeTruthy();
        }
      }
    }
  });

  test('etiquetaDAmbit, etiquetaDEstat, etiquetaDeCamp i etiquetaDOpcio: t(clau, reserva) o la reserva', () => {
    expect(etiquetaDAmbit('vehicle')).toBe('Compartir cotxe');
    expect(etiquetaDAmbit('vehicle', marca)).toBe('[ambit.vehicle] Compartir cotxe');
    expect(etiquetaDAmbit('constructor')).toBe('Mur');
    expect(etiquetaDEstat('reservat', marca)).toBe('[ambit.estat.reservat] Reservat');
    expect(etiquetaDEstat('volant')).toBe('Disponible');
    expect(etiquetaDeCamp(campDe('vehicle', 'lloc_eixida'), marca)).toBe('[ambit.camp.lloc_eixida] Lloc d’eixida');
    expect(etiquetaDeCamp(null, marca)).toBe('');
    expect(etiquetaDOpcio(campDe('habitatge', 'estat_immoble'), 'a_reformar', marca)).toBe('[ambit.estatImmoble.a_reformar] Per a reformar');
    expect(etiquetaDOpcio(campDe('habitatge', 'modalitat'), 'oferisc_places')).toBe('');
    expect(etiquetaDOpcio(campDe('habitatge', 'preu'), 'lloguer')).toBe('');
    /* Un traductor que torna res o que falla: la reserva. */
    expect(etiquetaDAmbit('treball', () => '')).toBe('Treball');
    expect(etiquetaDAmbit('treball', () => { throw new Error('x'); })).toBe('Treball');
    expect(etiquetaDAmbit('treball', () => 7)).toBe('Treball');
  });
});

describe('CAMPS', () => {
  const ids = (ambit) => CAMPS[ambit].map((c) => c.id);

  test('els camps de cada àmbit, en ordre; mur no en té cap', () => {
    expect(ids('mur')).toEqual([]);
    expect(ids('mercat')).toEqual(['preu', 'unitat', 'categoria', 'estoc']);
    expect(ids('vehicle')).toEqual(['modalitat', 'lloc_eixida', 'lloc_arribada', 'data_eixida', 'hora_eixida', 'data_tornada', 'hora_tornada', 'places', 'aportacio', 'punt_trobada']);
    expect(ids('treball')).toEqual(['modalitat', 'ofici', 'municipi', 'dedicacio', 'remuneracio', 'contacte']);
    expect(ids('habitatge')).toEqual(['modalitat', 'preu', 'superficie_m2', 'habitacions', 'estat_immoble', 'municipi', 'condicions']);
    for (const ambit of AMBITS) expect(new Set(ids(ambit)).size).toBe(ids(ambit).length);
  });

  test('tipus, obligatoris, rangs, llargàries i privadesa, com el contracte', () => {
    const tipus = (ambit) => Object.fromEntries(CAMPS[ambit].map((c) => [c.id, c.tipus]));
    expect(tipus('mercat')).toEqual({ preu: 'preu', unitat: 'text', categoria: 'text', estoc: 'text' });
    expect(tipus('vehicle')).toEqual({
      modalitat: 'enum', lloc_eixida: 'text', lloc_arribada: 'text', data_eixida: 'data', hora_eixida: 'hora', data_tornada: 'data',
      hora_tornada: 'hora', places: 'enter', aportacio: 'preu', punt_trobada: 'text'
    });
    expect(tipus('treball')).toEqual({ modalitat: 'enum', ofici: 'text', municipi: 'text', dedicacio: 'text', remuneracio: 'text', contacte: 'text' });
    expect(tipus('habitatge')).toEqual({ modalitat: 'enum', preu: 'preu', superficie_m2: 'enter', habitacions: 'enter', estat_immoble: 'enum', municipi: 'text', condicions: 'text' });
    const obligatoris = (ambit) => CAMPS[ambit].filter((c) => c.obligatori).map((c) => c.id);
    expect(obligatoris('mercat')).toEqual(['preu']);
    expect(obligatoris('vehicle')).toEqual(['modalitat', 'lloc_eixida', 'lloc_arribada', 'data_eixida']);
    expect(obligatoris('treball')).toEqual(['modalitat', 'ofici']);
    expect(obligatoris('habitatge')).toEqual(['modalitat', 'preu']);
    expect(campDe('vehicle', 'places')).toMatchObject({ min: 1, max: 9, obligatoriSi: { camp: 'modalitat', valor: 'oferisc_places' }, obligatori: false });
    expect(campDe('habitatge', 'superficie_m2')).toMatchObject({ min: 1, max: 100000 });
    expect(campDe('habitatge', 'habitacions')).toMatchObject({ min: 0, max: 50 });
    expect(campDe('vehicle', 'modalitat').opcions).toBe(MODALITATS.vehicle);
    expect(campDe('treball', 'modalitat').opcions).toBe(MODALITATS.treball);
    expect(campDe('habitatge', 'modalitat').opcions).toBe(MODALITATS.habitatge);
    expect(campDe('habitatge', 'estat_immoble')).toMatchObject({ opcions: ESTATS_IMMOBLE, clauOpcions: 'ambit.estatImmoble', obligatori: false });
    expect(campDe('treball', 'contacte').privat).toBe(true);
    for (const ambit of VERTICALS) {
      for (const campDef of CAMPS[ambit]) {
        expect(Object.isFrozen(campDef), campDef.id).toBe(true);
        expect(campDef.maxim, campDef.id).toBe(['condicions', 'dedicacio', 'remuneracio'].includes(campDef.id) ? 500 : 120);
        if (campDef.id !== 'contacte') expect(campDef.privat, campDef.id).toBeUndefined();
      }
    }
    expect(campDe('vehicle', 'contacte')).toBeNull();
    expect(campDe('volar', 'preu')).toBeNull();
  });

  test('cap id de camp és una clau reservada del payload ni una clau que el mapejador reinterpreta', () => {
    const DEL_MAPEJADOR = ['origen', 'source', 'autor', 'slug', 'mainHref', 'article', 'isSystem', 'is_pinned', 'pinned_position', 'type', 'price', 'title', 'sectionId', 'id'];
    for (const ambit of VERTICALS) {
      for (const { id } of CAMPS[ambit]) {
        expect(CLAUS_RESERVADES, id).not.toContain(id);
        expect(DEL_MAPEJADOR, id).not.toContain(id);
        expect(id.startsWith('author_'), id).toBe(false);
      }
    }
    expect(CLAUS_RESERVADES).not.toContain('origen');
    expect(CLAUS_RESERVADES).not.toContain('author_name');
  });
});

describe('ambitDe, esFitxaDAmbit, esDeLAmbit i perAmbit', () => {
  test('l’àmbit explícit mana; sense, el Mercat pel type; la resta és mur', () => {
    expect(ambitDe({ ambit: 'vehicle', type: 'product' })).toBe('vehicle');
    expect(ambitDe({ type: 'product' })).toBe('mercat');
    expect(ambitDe({ type: 'market' })).toBe('mercat');
    expect(ambitDe({ type: 'feed' })).toBe('mur');
    expect(ambitDe({ ambit: 'constructor', type: 'feed' })).toBe('mur');
    expect(ambitDe({ ambit: ['vehicle'] })).toBe('mur');
    for (const valor of [null, undefined, 'vehicle', 3, [], ['vehicle']]) expect(ambitDe(valor), String(valor)).toBe('mur');
  });

  test('esFitxaDAmbit: només un àmbit vertical explícit', () => {
    expect(esFitxaDAmbit({ ambit: 'treball' })).toBe(true);
    expect(esFitxaDAmbit({ ambit: 'mercat' })).toBe(true);
    expect(esFitxaDAmbit({ ambit: 'mur' })).toBe(false);
    expect(esFitxaDAmbit({ type: 'product' })).toBe(false);
    expect(esFitxaDAmbit(publicacioDelMur())).toBe(false);
    for (const valor of [null, undefined, 'treball', [], { ambit: 'volar' }]) expect(esFitxaDAmbit(valor), String(valor)).toBe(false);
  });

  test('esDeLAmbit i perAmbit: filtre estable, tolerant a null i a no-llistes', () => {
    const items = [
      { id: 'a', type: 'feed' }, null, { id: 'b', ambit: 'vehicle', dades: viatge() }, 'text', { id: 'c', type: 'product' },
      { id: 'd', ambit: 'mercat' }, { id: 'e', ambit: 'treball' }, undefined, { id: 'f', ambit: 'vehicle' }
    ];
    expect(perAmbit(items, 'vehicle').map((i) => i.id)).toEqual(['b', 'f']);
    expect(perAmbit(items, 'mercat').map((i) => i.id)).toEqual(['c', 'd']);
    expect(perAmbit(items, 'mur').map((i) => i.id)).toEqual(['a']);
    expect(perAmbit(items, 'habitatge')).toEqual([]);
    expect(perAmbit(items, 'volar')).toEqual([]);
    for (const valor of [null, undefined, {}, 'vehicle', 3]) expect(perAmbit(valor, 'vehicle'), String(valor)).toEqual([]);
    expect(esDeLAmbit(null, 'mur')).toBe(false);
    expect(esDeLAmbit({ type: 'feed' }, 'mur')).toBe(true);
    expect(esDeLAmbit({ type: 'feed' }, 'constructor')).toBe(false);
  });
});

describe('esVisibleALaLlista', () => {
  test('tot ix llevat del tancat; sense estat, disponible; un no-objecte, no', () => {
    expect(esVisibleALaLlista(publicacioDelMur())).toBe(true);
    expect(esVisibleALaLlista({ ambit: 'vehicle', estat: 'reservat' })).toBe(true);
    expect(esVisibleALaLlista({ ambit: 'vehicle', estat: 'complet' })).toBe(true);
    expect(esVisibleALaLlista({ ambit: 'vehicle', estat: 'tancat' })).toBe(false);
    expect(esVisibleALaLlista({ estat: 'tancat' })).toBe(false);
    expect(esVisibleALaLlista({ estat: 'TANCAT' })).toBe(true);
    expect(esVisibleALaLlista({ estat: ['tancat'] })).toBe(true);
    for (const valor of [null, undefined, 'tancat', [], 0]) expect(esVisibleALaLlista(valor), String(valor)).toBe(false);
  });
});

describe('validaFitxa', () => {
  const errorsDe = (ambit, dades) => validaFitxa(ambit, dades).errors;

  test('mur sempre és vàlid; un àmbit desconegut, mai', () => {
    expect(validaFitxa('mur', {})).toEqual({ ok: true, errors: [] });
    expect(validaFitxa('mur', null)).toEqual({ ok: true, errors: [] });
    for (const ambit of ['volar', 'constructor', null, undefined, 3, ['vehicle']]) {
      expect(validaFitxa(ambit, viatge()), String(ambit)).toEqual({ ok: false, errors: [{ camp: 'ambit', codi: 'enum' }] });
    }
  });

  test('les quatre fitxes de mostra són vàlides', () => {
    for (const ambit of VERTICALS) expect(validaFitxa(ambit, FITXES[ambit]()), ambit).toEqual({ ok: true, errors: [] });
  });

  test('obligatori: el que falta, el buit, el que no és un objecte i el que només és al prototip', () => {
    expect(errorsDe('vehicle', {})).toEqual([
      { camp: 'modalitat', codi: 'obligatori' }, { camp: 'lloc_eixida', codi: 'obligatori' },
      { camp: 'lloc_arribada', codi: 'obligatori' }, { camp: 'data_eixida', codi: 'obligatori' }
    ]);
    for (const dades of [null, undefined, 'text', 7, ['preu']]) {
      expect(errorsDe('mercat', dades), String(dades)).toEqual([{ camp: 'preu', codi: 'obligatori' }]);
    }
    expect(errorsDe('mercat', { preu: '   ' })).toEqual([{ camp: 'preu', codi: 'obligatori' }]);
    expect(errorsDe('mercat', { preu: `${SOH}${BEL}` })).toEqual([{ camp: 'preu', codi: 'obligatori' }]);
    expect(errorsDe('mercat', { preu: null })).toEqual([{ camp: 'preu', codi: 'obligatori' }]);
    expect(errorsDe('habitatge', Object.create({ modalitat: 'lloguer', preu: '3' }))).toEqual([
      { camp: 'modalitat', codi: 'obligatori' }, { camp: 'preu', codi: 'obligatori' }
    ]);
  });

  test('places: obligatori només quan s’oferixen places; enter d’1 a 9, també com a text', () => {
    const sensePlaces = viatge();
    delete sensePlaces.places;
    expect(errorsDe('vehicle', sensePlaces)).toEqual([{ camp: 'places', codi: 'obligatori' }]);
    expect(errorsDe('vehicle', { ...sensePlaces, modalitat: 'busque_lloc' })).toEqual([]);
    /* La condició només mira propietats pròpies, com els camps (L0-A3). */
    expect(errorsDe('vehicle', { modalitat: 'oferisc_places' })).toContainEqual({ camp: 'places', codi: 'obligatori' });
    expect(errorsDe('vehicle', Object.create({ modalitat: 'oferisc_places' }))).toEqual([
      { camp: 'modalitat', codi: 'obligatori' }, { camp: 'lloc_eixida', codi: 'obligatori' },
      { camp: 'lloc_arribada', codi: 'obligatori' }, { camp: 'data_eixida', codi: 'obligatori' }
    ]);
    expect(errorsDe('vehicle', { ...viatge(), places: '3' })).toEqual([]);
    expect(errorsDe('vehicle', { ...viatge(), places: ' 9 ' })).toEqual([]);
    expect(errorsDe('vehicle', { ...viatge(), places: 0 })).toEqual([{ camp: 'places', codi: 'rang' }]);
    expect(errorsDe('vehicle', { ...viatge(), places: 10 })).toEqual([{ camp: 'places', codi: 'rang' }]);
    expect(errorsDe('vehicle', { ...viatge(), places: '-1' })).toEqual([{ camp: 'places', codi: 'rang' }]);
    for (const dolent of ['tres', '3.5', 3.5, '1e2', NaN, Infinity, true, [3], { n: 3 }, 2 ** 53]) {
      expect(errorsDe('vehicle', { ...viatge(), places: dolent }), String(dolent)).toEqual([{ camp: 'places', codi: 'format' }]);
    }
  });

  test('dates aaaa-mm-dd de calendari i hores HH:MM', () => {
    for (const bona of ['2026-11-15', '2024-02-29', '2000-02-29', '1999-12-31', ' 2026-01-01 ']) {
      expect(errorsDe('vehicle', { ...viatge(), data_eixida: bona, data_tornada: bona }), bona).toEqual([]);
    }
    for (const dolenta of ['2026-02-30', '2026-02-29', '1900-02-29', '2026-13-01', '2026-00-10', '2026-04-31', '15/11/2026', '2026-11-15T08:30', 20261115, '', ['2026-11-15']]) {
      const errors = errorsDe('vehicle', { ...viatge(), data_tornada: dolenta });
      expect(errors, String(dolenta)).toEqual(dolenta === '' ? [] : [{ camp: 'data_tornada', codi: 'format' }]);
    }
    for (const bona of ['00:00', '08:30', '23:59', ' 12:00 ']) expect(errorsDe('vehicle', { ...viatge(), hora_tornada: bona }), bona).toEqual([]);
    for (const dolenta of ['24:00', '9:30', '08:60', '0830', '08:30:00', 830, ['08:30']]) {
      expect(errorsDe('vehicle', { ...viatge(), hora_tornada: dolenta }), String(dolenta)).toEqual([{ camp: 'hora_tornada', codi: 'format' }]);
    }
  });

  test('enums tancats: només les opcions de la llista de l’àmbit', () => {
    expect(errorsDe('vehicle', { ...viatge(), modalitat: 'lloguer' })).toEqual([{ camp: 'modalitat', codi: 'enum' }]);
    expect(errorsDe('habitatge', { ...casa(), modalitat: 'oferisc_places' })).toEqual([{ camp: 'modalitat', codi: 'enum' }]);
    expect(errorsDe('habitatge', { ...casa(), estat_immoble: 'nou' })).toEqual([{ camp: 'estat_immoble', codi: 'enum' }]);
    expect(errorsDe('habitatge', { ...casa(), estat_immoble: ['a_reformar'] })).toEqual([{ camp: 'estat_immoble', codi: 'enum' }]);
    expect(errorsDe('treball', { ...oferta(), modalitat: 'Oferta_feina' })).toEqual([{ camp: 'modalitat', codi: 'enum' }]);
    expect(errorsDe('treball', { ...oferta(), modalitat: 'constructor' })).toEqual([{ camp: 'modalitat', codi: 'enum' }]);
  });

  test('text: un objecte o una llista no és text; més llarg que el màxim, llargaria (120, i 500 als llargs)', () => {
    expect(errorsDe('treball', { ...oferta(), ofici: { nom: 'Pastor' } })).toEqual([{ camp: 'ofici', codi: 'format' }]);
    expect(errorsDe('treball', { ...oferta(), ofici: ['Pastor'] })).toEqual([{ camp: 'ofici', codi: 'format' }]);
    expect(errorsDe('treball', { ...oferta(), ofici: true })).toEqual([{ camp: 'ofici', codi: 'format' }]);
    expect(errorsDe('treball', { ...oferta(), ofici: 12 })).toEqual([]);
    expect(errorsDe('treball', { ...oferta(), ofici: 'a'.repeat(120) })).toEqual([]);
    expect(errorsDe('treball', { ...oferta(), ofici: 'a'.repeat(121) })).toEqual([{ camp: 'ofici', codi: 'llargaria' }]);
    expect(errorsDe('treball', { ...oferta(), ofici: `  ${'a'.repeat(120)}  ` })).toEqual([]);
    expect(errorsDe('treball', { ...oferta(), dedicacio: 'a'.repeat(500), remuneracio: 'b'.repeat(500) })).toEqual([]);
    expect(errorsDe('treball', { ...oferta(), dedicacio: 'a'.repeat(501) })).toEqual([{ camp: 'dedicacio', codi: 'llargaria' }]);
    expect(errorsDe('habitatge', { ...casa(), condicions: 'c'.repeat(501) })).toEqual([{ camp: 'condicions', codi: 'llargaria' }]);
    expect(errorsDe('mercat', { ...producte(), preu: 'p'.repeat(121) })).toEqual([{ camp: 'preu', codi: 'llargaria' }]);
  });

  test('els errors s’acumulen en l’ordre dels camps', () => {
    expect(errorsDe('habitatge', { modalitat: 'x', superficie_m2: 0, habitacions: 51, estat_immoble: 'nou' })).toEqual([
      { camp: 'modalitat', codi: 'enum' }, { camp: 'preu', codi: 'obligatori' }, { camp: 'superficie_m2', codi: 'rang' },
      { camp: 'habitacions', codi: 'rang' }, { camp: 'estat_immoble', codi: 'enum' }
    ]);
  });
});

describe('normalitzaDades', () => {
  test('només els camps de l’àmbit, coaccionats; la resta i el que no passa, fora', () => {
    expect(normalitzaDades('vehicle', {
      ...viatge(), places: '3', hora_eixida: ' 08:30 ', data_eixida: ' 2026-11-15 ', punt_trobada: `  La plaça${NUL}  `, aportacio: 5,
      origen: 'x', isSystem: true, mainHref: 'https://fora.example', contacte: 'no és de vehicle', constructor: 'x', toString: 'y'
    })).toEqual({
      modalitat: 'oferisc_places', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15', hora_eixida: '08:30',
      places: 3, aportacio: '5', punt_trobada: 'La plaça'
    });
    expect(normalitzaDades('habitatge', { ...casa(), superficie_m2: '80', habitacions: '-0', estat_immoble: 'nou', condicions: 'Primera\r\nSegona' }))
      .toEqual({ modalitat: 'lloguer', preu: '450 €/mes', superficie_m2: 80, habitacions: 0, municipi: 'La Torre', condicions: 'Primera\nSegona' });
    expect(Object.is(normalitzaDades('habitatge', { habitacions: '-0' }).habitacions, 0)).toBe(true);
    expect(normalitzaDades('treball', { modalitat: 'oferta_feina', ofici: ['Pastor'], municipi: {}, dedicacio: true, remuneracio: null, contacte: '' }))
      .toEqual({ modalitat: 'oferta_feina' });
    expect(normalitzaDades('mercat', { preu: 3, unitat: 'kg', categoria: '   ', estoc: NaN })).toEqual({ preu: '3', unitat: 'kg' });
  });

  test('el text es retalla al màxim i la data, l’hora, l’enter i l’enum invàlids cauen', () => {
    const llarg = normalitzaDades('treball', { ofici: 'a'.repeat(200), dedicacio: 'b'.repeat(600) });
    expect(llarg.ofici).toBe('a'.repeat(120));
    expect(llarg.dedicacio).toBe('b'.repeat(500));
    expect(normalitzaDades('vehicle', { data_eixida: '2026-02-30', hora_eixida: '24:00', places: 12, modalitat: 'volar' })).toEqual({});
    expect(normalitzaDades('vehicle', { places: 2 ** 53 })).toEqual({});
    expect(normalitzaDades('vehicle', { places: 3.0 })).toEqual({ places: 3 });
  });

  test('tolerant: res que no siga un objecte dona {}, i un àmbit desconegut o mur també', () => {
    for (const valor of [null, undefined, 'x', 3, [], [viatge()], true]) expect(normalitzaDades('vehicle', valor), String(valor)).toEqual({});
    expect(normalitzaDades('mur', viatge())).toEqual({});
    expect(normalitzaDades('volar', viatge())).toEqual({});
    expect(normalitzaDades('constructor', viatge())).toEqual({});
    expect(normalitzaDades('vehicle', Object.create(viatge()))).toEqual({});
  });

  test('el retall mai deixa un surrogat alt solt al final: jsonb vàlid per a PostgreSQL (L0-A1)', () => {
    /* 121 unitats UTF-16: el retall a 120 partiria l'emoticona. */
    const partida = normalitzaDades('treball', { ofici: `${'a'.repeat(119)}${SOMRIURE}` });
    expect(acabaEnSurrogatAlt(partida.ofici)).toBe(false);
    expect(partida.ofici).toBe('a'.repeat(119));
    /* 120 unitats justes: l'emoticona sencera es queda. */
    expect(normalitzaDades('treball', { ofici: `${'a'.repeat(118)}${SOMRIURE}` }).ofici).toBe(`${'a'.repeat(118)}${SOMRIURE}`);
    /* L'espai que queda al descobert en llevar la meitat també cau. */
    expect(normalitzaDades('treball', { ofici: `${'a'.repeat(118)} ${SOMRIURE}` }).ofici).toBe('a'.repeat(118));
    /* Un text hostil que ja acaba en surrogat alt solt: fora; si només hi ha això, el camp cau. */
    expect(normalitzaDades('treball', { ofici: `abc${SURROGAT_ALT}` }).ofici).toBe('abc');
    expect(normalitzaDades('treball', { ofici: SURROGAT_ALT })).toEqual({});
    expect(normalitzaDades('treball', { ofici: ` ${SURROGAT_ALT} ` })).toEqual({});
    /* Els llargs (500) igual. */
    const llarg = normalitzaDades('habitatge', { condicions: `${'c'.repeat(499)}${SOMRIURE}` });
    expect(llarg.condicions).toBe('c'.repeat(499));
    expect(acabaEnSurrogatAlt(llarg.condicions)).toBe(false);
  });

  test('idempotent: normalitza(normalitza(x)) és normalitza(x)', () => {
    const casos = [
      ['vehicle', viatge()], ['treball', oferta()], ['habitatge', casa()], ['mercat', producte()],
      ['treball', { modalitat: 'oferta_feina', ofici: `${'a'.repeat(118)} b`, dedicacio: `x ${'é'.repeat(600)}` }],
      /* El retall a 120 partiria el parell substitut de l'emoticona: textNet lleva la meitat solta i el punt fix es manté. */
      ['treball', { ofici: `${'a'.repeat(119)}${SOMRIURE}` }],
      ['treball', { ofici: `${'a'.repeat(118)} ${SOMRIURE}` }],
      ['habitatge', { condicions: `q${PUNT_DALT}`.repeat(300), preu: ` 1${NUL} € ` }],
      ['vehicle', { places: '3', lloc_eixida: `e${ACCENT_AGUT}`.repeat(200) }]
    ];
    for (const [ambit, dades] of casos) {
      const una = normalitzaDades(ambit, dades);
      expect(normalitzaDades(ambit, una), ambit).toEqual(una);
    }
  });
});

describe('normalitzaEstat i coaccionaAmbit', () => {
  test('un estat de la llista o el de sèrie', () => {
    for (const estat of ESTATS) expect(normalitzaEstat(estat)).toBe(estat);
    for (const valor of ['Tancat', 'obert', '', null, undefined, 3, ['tancat'], { estat: 'tancat' }]) expect(normalitzaEstat(valor), String(valor)).toBe('disponible');
  });

  test('coaccionaAmbit: { ambit, estat, dades } net, o null sense àmbit vàlid', () => {
    expect(coaccionaAmbit({ ambit: 'vehicle', estat: 'reservat', dades: { ...viatge(), places: '4', isSystem: true }, title: 'x' }))
      .toEqual({ ambit: 'vehicle', estat: 'reservat', dades: { ...viatge(), places: 4 } });
    expect(coaccionaAmbit({ ambit: 'mercat', estat: 'volant', dades: 'no' })).toEqual({ ambit: 'mercat', estat: 'disponible', dades: {} });
    expect(coaccionaAmbit({ ambit: 'mur' })).toEqual({ ambit: 'mur', estat: 'disponible', dades: {} });
    for (const valor of [publicacioDelMur(), { ambit: 'volar' }, { ambit: 'constructor' }, { type: 'product' }, null, undefined, 'vehicle', [], 3]) {
      expect(coaccionaAmbit(valor), String(valor)).toBeNull();
    }
  });

  test('coaccionaAmbit amb el section_id de la fila: l’àmbit ha de viure a eixa secció (SECTION_ID_PER_AMBIT), si no, null (L0-A2)', () => {
    /* Una fila de 'mur' amb ambit 'mercat' escrita per l'API no és cap producte. */
    expect(coaccionaAmbit({ ambit: 'mercat', dades: producte() }, 'mur')).toBeNull();
    /* Una fila de 'mercat' amb ambit 'vehicle' no és cap viatge. */
    expect(coaccionaAmbit({ ambit: 'vehicle', dades: viatge() }, 'mercat')).toBeNull();
    expect(coaccionaAmbit({ ambit: 'vehicle', dades: viatge() }, 'mur')).toEqual({ ambit: 'vehicle', estat: 'disponible', dades: viatge() });
    expect(coaccionaAmbit({ ambit: 'mercat', estat: 'reservat', dades: producte() }, 'mercat')).toEqual({ ambit: 'mercat', estat: 'reservat', dades: producte() });
    expect(coaccionaAmbit({ ambit: 'mur' }, 'mur')).toEqual({ ambit: 'mur', estat: 'disponible', dades: {} });
    expect(coaccionaAmbit({ ambit: 'mur' }, 'mercat')).toBeNull();
    /* Cap fitxa d'àmbit viu a events, multimedia ni notes. */
    for (const seccio of ['events', 'multimedia', 'notes', '', 'MUR', 'constructor']) {
      for (const ambit of AMBITS) expect(coaccionaAmbit({ ambit, dades: {} }, seccio), `${ambit} @ ${seccio}`).toBeNull();
    }
    /* Sense section_id (o amb un que no és text): el comportament de sempre. */
    for (const seccio of [undefined, null, 3, ['mur'], { sectionId: 'mur' }]) {
      expect(coaccionaAmbit({ ambit: 'treball', dades: oferta() }, seccio), String(seccio)).toEqual({ ambit: 'treball', estat: 'disponible', dades: oferta() });
    }
    for (const ambit of AMBITS) expect(coaccionaAmbit({ ambit, dades: {} }, seccioDAmbit(ambit)), ambit).not.toBeNull();
  });
});

describe('projeccioPayload', () => {
  test('Llei del Píxel: una publicació del Mur ix idèntica, sense cap clau nova', () => {
    const entrada = publicacioDelMur();
    const eixida = projeccioPayload(entrada);
    expect(eixida).toEqual(publicacioDelMur());
    expect(Object.keys(eixida)).toEqual(Object.keys(entrada));
    expect(eixida).not.toBe(entrada);
    /* Amb 'mur' explícit, les tres claus d'àmbit no s'escriuen. */
    expect(projeccioPayload({ ...publicacioDelMur(), ambit: 'mur', estat: 'tancat', dades: { preu: '3' } })).toEqual(publicacioDelMur());
    expect(projeccioPayload({ ...publicacioDelMur(), ambit: 'volar', dades: { preu: '3' } })).toEqual(publicacioDelMur());
    for (const valor of [null, undefined, 'x', 3, []]) expect(projeccioPayload(valor), String(valor)).toEqual({});
  });

  test('mercat: price = dades.preu, tag i category_slug de la categoria, type product', () => {
    const eixida = projeccioPayload({ ...publicacioDelMur(), ambit: 'mercat', estat: 'reservat', dades: { ...producte(), origen: 'x' }, price: 'vell', type: 'feed' });
    expect(eixida).toEqual({
      ...publicacioDelMur(), ambit: 'mercat', estat: 'reservat', dades: producte(), type: 'product', price: '3 €', tag: 'Verdura d’horta', category_slug: 'verdura-d-horta'
    });
    const senseCategoria = projeccioPayload({ ambit: 'mercat', dades: { preu: '2 €' } });
    expect(senseCategoria).toEqual({ ambit: 'mercat', estat: 'disponible', dades: { preu: '2 €' }, type: 'product', price: '2 €' });
    const categoriaBuida = projeccioPayload({ ambit: 'mercat', dades: { preu: '2 €', categoria: '···' } });
    expect(categoriaBuida).toEqual({ ambit: 'mercat', estat: 'disponible', dades: { preu: '2 €', categoria: '···' }, type: 'product', price: '2 €', tag: '···' });
    expect(projeccioPayload({ ambit: 'mercat', dades: {}, price: 'vell' })).toEqual({ ambit: 'mercat', estat: 'disponible', dades: {}, type: 'product', price: 'vell' });
  });

  test('vehicle, treball i habitatge: la resta sense claus reservades + ambit, estat, dades i type; author_name i origen es queden', () => {
    const eixida = projeccioPayload({
      ...publicacioDelMur(), ambit: 'vehicle', estat: 'x', dades: { ...viatge(), places: '3' },
      isSystem: true, is_pinned: true, pinned_position: 1, mainHref: 'https://fora.example', slug: 'admin', article: 'x', autor: 'x', source: 'x',
      author_org_id: 'org', author_id: 'u', owner_user_id: 'u', srcDelPort: 'x'
    });
    expect(eixida).toEqual({ ...publicacioDelMur(), ambit: 'vehicle', estat: 'disponible', dades: viatge(), type: 'vehicle' });
    expect(projeccioPayload({ ambit: 'treball', estat: 'complet', dades: oferta(), type: 'product' }))
      .toEqual({ ambit: 'treball', estat: 'complet', dades: oferta(), type: 'treball' });
    expect(projeccioPayload({ ambit: 'habitatge', dades: casa() }).type).toBe('habitatge');
    expect(projeccioPayload({ ambit: 'habitatge', dades: casa() }).price).toBeUndefined();
    for (const clau of CLAUS_RESERVADES) expect(eixida, clau).not.toHaveProperty(clau);
  });
});

describe('seccioDAmbit, tipusDAmbit, rutaDAmbit i canviaEstat', () => {
  test('secció i type de l’àmbit, mur per a tot el desconegut (també les claus del prototip)', () => {
    expect(seccioDAmbit('mercat')).toBe('mercat');
    for (const ambit of ['mur', 'vehicle', 'treball', 'habitatge', 'volar', 'constructor', 'toString', null, undefined, 3]) expect(seccioDAmbit(ambit), String(ambit)).toBe('mur');
    expect(tipusDAmbit('vehicle')).toBe('vehicle');
    expect(tipusDAmbit('mercat')).toBe('product');
    for (const ambit of ['mur', 'volar', 'constructor', null]) expect(tipusDAmbit(ambit), String(ambit)).toBe('feed');
  });

  test('rutaDAmbit: /<ambit>/<id codificat>, com getSectionItemPath', () => {
    expect(rutaDAmbit('vehicle', 'abc')).toBe('/vehicle/abc');
    expect(rutaDAmbit('treball', 'a b/c?d')).toBe('/treball/a%20b%2Fc%3Fd');
    expect(rutaDAmbit('habitatge', 42)).toBe('/habitatge/42');
    expect(rutaDAmbit('mercat', 'p1')).toBe('/mercat/p1');
    expect(rutaDAmbit('mur', 'n1')).toBe('/mur/n1');
    expect(rutaDAmbit('volar', 'n1')).toBe('/mur/n1');
    expect(rutaDAmbit('constructor', 'n1')).toBe('/mur/n1');
    expect(rutaDAmbit('vehicle', null)).toBe('/vehicle/');
    expect(rutaDAmbit('vehicle', { toString: 0 })).toBe('/vehicle/');
    expect(rutaDAmbit('vehicle', ['a'])).toBe('/vehicle/');
  });

  test('canviaEstat: una còpia amb l’estat; un estat fora d’ESTATS no canvia res', () => {
    const payload = { ambit: 'vehicle', estat: 'disponible', dades: viatge() };
    const reservat = canviaEstat(payload, 'reservat');
    expect(reservat).toEqual({ ...payload, estat: 'reservat' });
    expect(reservat).not.toBe(payload);
    expect(reservat.dades).toBe(payload.dades);
    expect(payload.estat).toBe('disponible');
    for (const dolent of ['obert', 'Reservat', '', null, undefined, ['reservat'], 3]) expect(canviaEstat(payload, dolent), String(dolent)).toEqual(payload);
    expect(canviaEstat({ title: 'x' }, 'tancat')).toEqual({ title: 'x', estat: 'tancat' });
    for (const valor of [null, undefined, 'x', [], 3]) expect(canviaEstat(valor, 'tancat'), String(valor)).toEqual({});
  });
});

describe('etiquetesDAmbit', () => {
  test('cap etiqueta per a mur, per a un producte de llegat ni per a res que no siga una fitxa', () => {
    expect(etiquetesDAmbit(publicacioDelMur(), marca)).toEqual([]);
    expect(etiquetesDAmbit({ ambit: 'mur', estat: 'tancat' }, marca)).toEqual([]);
    expect(etiquetesDAmbit({ type: 'product', price: '3 €' }, marca)).toEqual([]);
    for (const valor of [null, undefined, 'vehicle', [], { ambit: 'volar' }]) expect(etiquetesDAmbit(valor, marca), String(valor)).toEqual([]);
  });

  test('l’àmbit amb sdp-badge-system i l’estat amb la insígnia del seu to; sense t, les reserves', () => {
    expect(etiquetesDAmbit({ ambit: 'vehicle', estat: 'reservat' }, marca)).toEqual([
      { text: '[ambit.vehicle] Compartir cotxe', className: 'sdp-badge-system' },
      { text: '[ambit.estat.reservat] Reservat', className: 'sdp-insignia sdp-insignia--avis' }
    ]);
    expect(etiquetesDAmbit({ ambit: 'treball' })).toEqual([
      { text: 'Treball', className: 'sdp-badge-system' },
      { text: 'Disponible', className: 'sdp-insignia sdp-insignia--exit' }
    ]);
    expect(etiquetesDAmbit({ ambit: 'habitatge', estat: 'complet' }, null)[1]).toEqual({ text: 'Complet', className: 'sdp-insignia sdp-insignia--neutre' });
    expect(etiquetesDAmbit({ ambit: 'mercat', estat: 'tancat' })[1]).toEqual({ text: 'Tancat', className: 'sdp-insignia sdp-insignia--error' });
    expect(etiquetesDAmbit({ ambit: 'mercat', estat: 'volant' })[1].className).toBe('sdp-insignia sdp-insignia--exit');
  });

  test('les classes existixen a src/css (cap classe nova: Pedra Seca)', () => {
    const components = llig('src/css/components.css');
    const modules = llig('src/css/modules.css');
    /* Les regles del full van alineades amb més d'un espai abans de la clau. */
    expect(components).toMatch(/\.sdp-insignia\s+\{/);
    for (const to of Object.values(TO_PER_ESTAT)) expect(components, to).toMatch(new RegExp(`\\.sdp-insignia--${to}\\s+\\{`));
    expect(modules).toMatch(/\.sdp-badge-system\s+\{/);
  });
});

describe('resumDeFitxa i textCercable', () => {
  test('una línia curta per àmbit, amb les reserves o el traductor; res per a mur', () => {
    expect(resumDeFitxa({ ambit: 'vehicle', dades: viatge() })).toBe('Oferisc places · La Torre → Alcoi · 2026-11-15 08:30 · Places disponibles: 3 · 5 €');
    expect(resumDeFitxa({ ambit: 'vehicle', dades: { modalitat: 'busque_lloc', lloc_eixida: 'Alcoi', data_eixida: '2026-12-01' } })).toBe('Busque lloc · Alcoi · 2026-12-01');
    expect(resumDeFitxa({ ambit: 'treball', dades: oferta() })).toBe('Oferta de feina · Pastor · La Torre · 900 €/mes');
    expect(resumDeFitxa({ ambit: 'habitatge', dades: casa() })).toBe('Lloguer · 450 €/mes · 80 m² · Habitacions: 3 · Per a reformar · La Torre');
    expect(resumDeFitxa({ ambit: 'mercat', dades: producte() })).toBe('3 € · kg · Verdura d’horta · Poc');
    expect(resumDeFitxa({ ambit: 'vehicle', dades: viatge() }, marca)).toBe('[ambit.modalitat.oferisc_places] Oferisc places · La Torre → Alcoi · 2026-11-15 08:30 · [ambit.camp.places] Places disponibles: 3 · 5 €');
    expect(resumDeFitxa({ ambit: 'mercat', dades: {} })).toBe('');
    expect(resumDeFitxa({ ambit: 'vehicle', dades: 'x' })).toBe('');
    for (const valor of [publicacioDelMur(), { ambit: 'mur', dades: viatge() }, { type: 'product', price: '3' }, null, 'vehicle']) expect(resumDeFitxa(valor), String(valor)).toBe('');
  });

  test('un text llarg només aporta la primera línia, retallada', () => {
    const resum = resumDeFitxa({ ambit: 'treball', dades: { modalitat: 'oferisc_ofici', ofici: 'Fuster', remuneracio: `${'r'.repeat(80)}\nsegona línia` } });
    expect(resum).toBe(`Oferisc el meu ofici · Fuster · ${'r'.repeat(59)}…`);
    expect(resum).not.toContain('segona');
  });

  test('el tros del resum es retalla per punts de codi: cap emoticona partida (L0-A1)', () => {
    /* 58 r + emoticona (2 unitats) + 10 x = 70 unitats, 69 punts de codi: el tall a 59 cau just darrere de l'emoticona. */
    const resum = resumDeFitxa({ ambit: 'treball', dades: { modalitat: 'oferisc_ofici', ofici: 'Fuster', remuneracio: `${'r'.repeat(58)}${SOMRIURE}${'x'.repeat(10)}` } });
    expect(resum).toBe(`Oferisc el meu ofici · Fuster · ${'r'.repeat(58)}${SOMRIURE}…`);
    expect(acabaEnSurrogatAlt(resum.replace('…', ''))).toBe(false);
    /* 60 emoticones (120 unitats) són 60 punts de codi: no cal retallar. */
    const seixanta = SOMRIURE.repeat(60);
    expect(resumDeFitxa({ ambit: 'treball', dades: { modalitat: 'oferisc_ofici', ofici: seixanta } })).toBe(`Oferisc el meu ofici · ${seixanta}`);
    /* 61 emoticones (122 unitats, dins del màxim de 500 de remuneracio): 59 senceres i els punts suspensius. */
    expect(resumDeFitxa({ ambit: 'treball', dades: { modalitat: 'oferisc_ofici', remuneracio: SOMRIURE.repeat(61) } })).toBe(`Oferisc el meu ofici · ${SOMRIURE.repeat(59)}…`);
    /* A ofici (màxim 120 unitats) 61 emoticones ja arriben retallades a 60 per normalitzaDades: cap retall del resum. */
    expect(resumDeFitxa({ ambit: 'treball', dades: { modalitat: 'oferisc_ofici', ofici: SOMRIURE.repeat(61) } })).toBe(`Oferisc el meu ofici · ${seixanta}`);
  });

  test('el contacte mai ix al resum ni al text cercable', () => {
    const item = { ambit: 'treball', dades: oferta() };
    expect(resumDeFitxa(item)).not.toContain(SECRET);
    expect(resumDeFitxa(item, marca)).not.toContain(SECRET);
    expect(textCercable(item)).not.toContain(SECRET);
    expect(textCercable({ ambit: 'treball', dades: { contacte: SECRET } })).toBe('Treball');
  });

  test('textCercable: l’àmbit i els camps estructurats, amb id i reserva dels enums; res per a mur', () => {
    expect(textCercable({ ambit: 'vehicle', dades: viatge() })).toBe('Compartir cotxe oferisc_places Oferisc places La Torre Alcoi 2026-11-15 08:30 3 5 € La plaça');
    expect(textCercable({ ambit: 'habitatge', dades: casa() })).toBe('Habitatge lloguer Lloguer 450 €/mes 80 3 a_reformar Per a reformar La Torre Sense animals');
    expect(textCercable({ ambit: 'mercat', dades: producte() })).toBe('Mercat 3 € kg Verdura d’horta Poc');
    for (const valor of [publicacioDelMur(), { ambit: 'mur', dades: viatge() }, { type: 'product' }, null, undefined, 'x']) expect(textCercable(valor), String(valor)).toBe('');
  });
});

describe('fuzz determinista: res no llança, res desconegut passa, tot és idempotent', () => {
  const lcg = (llavor) => {
    let x = llavor >>> 0;
    return () => {
      x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
      return x / 4294967296;
    };
  };
  const BRUTS = [
    null, undefined, true, false, 0, -0, -1, 3, 9, 3.5, 2 ** 53, 1e21, NaN, Infinity, 12n, Symbol('s'), () => 'x',
    '', '   ', '3', ' 7 ', '-0', '-5', '1e2', 'abc', 'a'.repeat(600), `x${NUL}y${BEL}z`, 'u\r\nv', `e${ACCENT_AGUT}`.repeat(130),
    `${'a'.repeat(119)}${SOMRIURE}`, `${'a'.repeat(499)}${SOMRIURE}`, SOMRIURE.repeat(70), `abc${SURROGAT_ALT}`, SURROGAT_ALT,
    '2026-02-29', '2024-02-29', '2026-02-30', '2026-11-15', ' 2026-11-15 ', '09:30', '9:30', '25:00', '23:59',
    'oferisc_places', 'busque_lloc', 'lloguer', 'a_reformar', 'constructor',
    {}, { toString: 0 }, { valueOf: () => 3 }, [], ['x'], [3], Object.create(null), new Map(), new Date(0)
  ];
  const EXTRES = ['origen', 'isSystem', 'mainHref', 'author_org_id', 'constructor', 'toString', 'hasOwnProperty', 'price', 'type', 'title'];

  test('400 fitxes brutes per àmbit, amb claus de més', () => {
    const atzar = lcg(261102);
    const tria = (llista) => llista[Math.floor(atzar() * llista.length)];
    for (let i = 0; i < 400; i += 1) {
      const ambit = tria([...AMBITS, 'volar', 'constructor']);
      const dades = {};
      const campsDe = AMBITS.includes(ambit) ? CAMPS[ambit] : CAMPS.vehicle;
      for (const { id } of campsDe) if (atzar() < 0.8) dades[id] = tria(BRUTS);
      for (const extra of EXTRES) if (atzar() < 0.3) dades[extra] = tria(BRUTS);
      /* El secret només viu al camp privat: cap altre camp el porta. */
      if (ambit === 'treball') dades.contacte = SECRET;
      const estat = tria([...ESTATS, 'volant', null, 3]);
      const entrada = { ...publicacioDelMur(), ambit, estat, dades, isSystem: true, author_org_id: 'org' };

      const netes = normalitzaDades(ambit, dades);
      expect(normalitzaDades(ambit, netes), `${ambit} #${i}`).toEqual(netes);
      const permesos = AMBITS.includes(ambit) ? CAMPS[ambit].map((c) => c.id) : [];
      for (const clau of Object.keys(netes)) expect(permesos, `${ambit} #${i} ${clau}`).toContain(clau);
      for (const valor of Object.values(netes)) {
        expect(['string', 'number'], `${ambit} #${i}`).toContain(typeof valor);
        if (typeof valor === 'string') expect(acabaEnSurrogatAlt(valor), `${ambit} #${i}`).toBe(false);
      }

      const resultat = validaFitxa(ambit, dades);
      expect(typeof resultat.ok).toBe('boolean');
      expect(Array.isArray(resultat.errors)).toBe(true);
      for (const error of resultat.errors) expect(['obligatori', 'format', 'rang', 'enum', 'llargaria'], `${ambit} #${i}`).toContain(error.codi);
      expect(resultat.ok, `${ambit} #${i}`).toBe(resultat.errors.length === 0);

      const payload = projeccioPayload(entrada);
      if (AMBITS.includes(ambit) && ambit !== 'mur') {
        for (const clau of CLAUS_RESERVADES) expect(payload, `${ambit} #${i} ${clau}`).not.toHaveProperty(clau);
        expect(payload.dades, `${ambit} #${i}`).toEqual(netes);
        expect(ESTATS, `${ambit} #${i}`).toContain(payload.estat);
        expect(coaccionaAmbit(payload), `${ambit} #${i}`).toEqual({ ambit, estat: payload.estat, dades: netes });
        expect(coaccionaAmbit(payload, seccioDAmbit(ambit)), `${ambit} #${i}`).toEqual({ ambit, estat: payload.estat, dades: netes });
        expect(coaccionaAmbit(payload, ambit === 'mercat' ? 'mur' : 'mercat'), `${ambit} #${i}`).toBeNull();
        const item = { ...payload, id: `f${i}` };
        const resum = resumDeFitxa(item, marca);
        const cercable = textCercable(item);
        expect(typeof resum).toBe('string');
        expect(typeof cercable).toBe('string');
        expect(acabaEnSurrogatAlt(resum.replace(/…/g, '')), `${ambit} #${i}`).toBe(false);
        if (ambit === 'treball') {
          expect(resum, `${ambit} #${i}`).not.toContain(SECRET);
          expect(cercable, `${ambit} #${i}`).not.toContain(SECRET);
        }
        expect(etiquetesDAmbit(item, marca)).toHaveLength(2);
        expect(typeof esVisibleALaLlista(item)).toBe('boolean');
        expect(rutaDAmbit(ambit, item.id)).toBe(`/${ambit}/f${i}`);
      } else {
        expect(payload, `${ambit} #${i}`).not.toHaveProperty('ambit');
        expect(payload, `${ambit} #${i}`).not.toHaveProperty('dades');
        expect(etiquetesDAmbit(payload, marca)).toEqual([]);
        expect(resumDeFitxa(payload, marca)).toBe('');
      }
    }
  });
});

describe('qualitat de publicacioUniversal.js i la seua prova', () => {
  const FITXERS = ['src/utils/publicacioUniversal.js', 'src/utils/publicacioUniversal.test.js'];
  const MODUL = FITXERS[0];
  const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const t = (...trossos) => trossos.join('');

  test('ESLint: zero missatges, avisos inclosos', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FITXERS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FITXERS.length);
    expect(missatges).toEqual([]);
    /* Sonda: la configuració del projecte és activa. */
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/utils', 'sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);

  test('JS pur: una sola importació (netejaText de sanitize.js), cap rellotge, atzar, DOM, React, xarxa ni emmagatzematge', () => {
    const codi = senseComentaris(llig(MODUL));
    expect(codi.match(/^import .*$/gm)).toEqual(["import { netejaText } from './sanitize.js';"]);
    expect(/\brequire\s*\(/.test(codi)).toBe(false);
    const impurs = new RegExp(t('\\b(?:Da', 'te|React|use[A-Z]\\w*|win', 'dow|docu', 'ment|navi', 'gator|global', 'This|set', 'Timeout|set',
      'Interval|fet', 'ch|XMLHttp', 'Request|local', 'Storage|session', 'Storage|indexed', 'DB)\\b|Math\\.ran', 'dom|cryp', 'to\\.'));
    expect(impurs.test(t('new Da', 'te()'))).toBe(true);
    expect(codi.match(impurs)).toBeNull();
  });

  test('cap regex amb retrocés: cap quantificador imbricat ni alternança dins d’un grup repetit', () => {
    const codi = senseComentaris(llig(MODUL));
    /* Les branques no se solapen (cada caràcter té una sola eixida): lineal. */
    const literals = codi.match(/\/(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\n\\[])+\/[a-z]*/g) ?? [];
    expect(literals.length).toBeGreaterThan(0);
    for (const literal of literals) {
      expect(literal, literal).not.toMatch(/\)[+*]\??|\)\{/);
      expect(literal, literal).not.toMatch(/[+*]\)[+*]/);
    }
  });

  test('Baseline 2022: cap API més nova ni lookbehind', () => {
    const vetat = /\.(?:findLast|findLastIndex|toSorted|toReversed|toSpliced|with)\(|Object\.groupBy|withResolvers|\(\?<[=!]/;
    expect(vetat.test(llig(MODUL))).toBe(false);
  });

  test('cap caràcter de control, invisible, combinant ni bidi en cru (prova inclosa)', () => {
    const rangs = [[0x0000, 0x0008], [0x000B, 0x001F], [0x007F, 0x009F], [0x00A0, 0x00A0], [0x0300, 0x036F], [0x061C, 0x061C], [0x200B, 0x200F],
      [0x202A, 0x202E], [0x2060, 0x2069], [0xFEFF, 0xFEFF]];
    const re = new RegExp(`[${rangs.map(([a, b]) => (a === b ? car(a) : `${car(a)}-${car(b)}`)).join('')}]`, 'u');
    for (const fitxer of FITXERS) {
      const text = llig(fitxer);
      const m = re.exec(text);
      const on = m ? `${fitxer}:${text.slice(0, m.index).split('\n').length} U+${m[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}` : '';
      expect(on).toBe('');
    }
  });

  test('cada comentari de referència porta IDEA-61 (T0, prompt 261102_1532) a la capçalera', () => {
    expect(llig(MODUL)).toContain('IDEA-61 (T0, prompt 261102_1532)');
  });
});
