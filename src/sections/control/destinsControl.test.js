/**
 * P5 · Onada 4 (PRD «Control amb targetes il·lustrades de doble acció»,
 * aprovat pel Mestre el 261003) · La taula de les targetes del Panell.
 *
 * ESMENA 261003 22:34 (directrius 261003_2234 i 261003_2245 del Mestre) ·
 *   · Títol, subtítol i entradilla de cada targeta són els literals de 2245 i
 *     es lligen de la seua pàgina (PAGE_COPY), que pinta la UniversalPage a
 *     /page/<clau>: una sola font.
 *   · Cada destí no nul és una ruta estàtica d'App o una d'eixes pàgines.
 *   · Publicar al Mur és /notes (D6); Saber-ne més, la pàgina de la targeta.
 *   · Mapa, Vehicle Compartit i Animalets: sense camí per a publicar i
 *     «EN OBRES» (W4-04).
 *   · La boina és l'entitat socdepoble i porta al seu xat corporatiu.
 *     Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515): la
 *     boina porta a la pàgina del projecte (T6); el xat és el de Comentar.
 *   · Cada clau de les portes té la seua entrada en les cinc llengües i, en
 *     valencià, és la reserva de la taula.
 *
 * W4-08 (261004) · El cens actual: les sis de 2245 i Treball i Habitatge, que
 * MarIA hi ha afegit a les posicions 7 i 8 (els seus textos i la seua data
 * són els de pageContent.js, 261004 01:10). Mapa, Vehicle Compartit i
 * Animalets porten ara la vinyeta del seu plugin; cap targeta usa la icona.
 * Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, T8): cada
 * targeta porta la capçalera de la seua pàgina; Vehicle Compartit i
 * Animalets, la Nano de la pàgina, no la vinyeta.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';
import { RUTA_PROJECTE, resolvePageSlugPath } from '../../config/navigation.js';
import { IAIA_ID } from '../../data/identitatsSeed.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import fontApp from '../../app/App.jsx?raw';
import fontI18n from '../../config/i18n.js?raw';
import {
  AUTORIA_SOCDEPOBLE, DESTINS_CONTROL, TEXTOS_PORTES, XAT_SOCDEPOBLE, contingutDe, destiDePagina, enObres, portesDe, rutaDePagina
} from './destinsControl.js';

/* Les rutes estàtiques de la taula d'App: sense paràmetres ni comodins, perquè
   «/:usuari» o «*» no facen passar per bona una ruta que no té secció. */
function rutesEstatiques() {
  const rutes = new Set();
  for (const m of fontApp.matchAll(/<Route\s+path="([^"]+)"/g)) {
    const ruta = m[1].replace(/^\//, '');
    if (!ruta.includes(':') && !ruta.includes('*')) rutes.add(ruta);
  }
  return rutes;
}
const camiDe = (ruta) => ruta.split('?')[0].replace(/^\//, '');
/* Una pàgina de /page/:slug que pinta PageDetailSection: una clau pròpia de
   PAGE_COPY sense ruta canònica (si en tinguera, redirigiria). */
const esPaginaServida = (ruta) => {
  const trobat = /^\/page\/([^/?#]+)$/.exec(ruta);
  if (!trobat || !fontApp.includes('<Route path="/page/:slug"')) return false;
  const clau = decodeURIComponent(trobat[1]);
  return Object.hasOwn(PAGE_COPY, clau) && resolvePageSlugPath(clau) === null;
};
const perId = Object.fromEntries(DESTINS_CONTROL.map((desti) => [desti.id, desti]));

/* Els textos de les targetes, literals del document 261003_2245. */
const TEXTOS_2245 = {
  mur: [
    'Publicar al Mur',
    'Comparteix pensaments, notícies o fotografies amb tot el veïnat.',
    'Tot el que escrigues al mur principal serà el cor de la plaça digital. Recorda que la teua opinió serà llegida per tota la comunitat; fes servir el sentit comú i respecta sempre la resta de persones que conviuen en aquesta xarxa.'
  ],
  mercat: [
    'Publicar al Mercat',
    'Dona una segona vida a les coses que ja no uses.',
    'Totes les transaccions i acords es fan de manera privada i directa entre els veïns. La plataforma no intervé en els pagaments ni es fa responsable dels intercanvis, funcionant únicament com un tauler d\'anuncis de proximitat.'
  ],
  calendari: [
    'Publicar al Calendari',
    'Anuncia esdeveniments, festes i reunions comunitàries.',
    'Tot esdeveniment publicat passarà a formar part de l\'agenda global del poble i podrà ser exportat a altres calendaris. Assegura\'t de tindre els permisos necessaris per a convocar o promocionar l\'activitat abans de penjar-la.'
  ],
  mapa: [
    'Publicar al Mapa',
    'Si tens coses que vols geolocalitzar, este és el lloc.',
    'Per defecte esborrem la geolocalització i les dades EXIF de totes les teues fotos per privacitat, però per a publicar al mapa cal donar autorització explícita i ser conscient que la teua foto es podrà localitzar públicament des d\'altres pàgines i pobles.'
  ],
  vehicle: [
    'Vehicle Compartit',
    'Aprofita els seients buits i estalvia en els trajectes.',
    'La publicació de trajectes implica compartir horaris i rutes habituals de manera pública. Els acords de despeses es faran fora de l\'aplicació, sota la responsabilitat exclusiva de conductor i passatgers.'
  ],
  animalets: [
    'Animalets',
    'Troba, adopta o avisa sobre els animals del poble.',
    'Les dades de contacte que faces públiques per a trobar un animal perdut seran visibles per a tothom. Utilitza la xarxa amb responsabilitat per a garantir el benestar dels animals i respectar la privacitat del veïnat.'
  ]
};

/* W4-08 · Les dues targetes que MarIA ha afegit (pageContent.js, 261004
   01:10). Van a part: no són literals del document 2245. */
const TEXTOS_261004 = {
  treball: [
    'Treball',
    'Ofertes de feina i recerca de professionals al poble.',
    'Un espai per a connectar qui busca faena amb qui en té per a oferir. Recorda que l\'acord laboral s\'ha de tancar en persona.'
  ],
  habitatge: [
    'Habitatge',
    'Lloguer i compravenda de cases i pisos al poble.',
    'Facilitem la informació d\'habitatges disponibles per a atraure nova gent o ajudar a qui ja hi viu.'
  ]
};
const TEXTOS = { ...TEXTOS_2245, ...TEXTOS_261004 };

/* La data de cada targeta i de la seua pàgina: [hora, dia, dateTime]. */
const DATA_2245 = ['22:45', '03/10/26', '2026-10-03T22:45:00+02:00'];
const DATA_261004 = ['01:10', '04/10/26', '2026-10-04T01:10:00+02:00'];
const dataDe = (id) => (Object.hasOwn(TEXTOS_261004, id) ? DATA_261004 : DATA_2245);

/* El cos de cada pàgina: els tres H5 de 2245 i les negretes, en ordre. */
const COS_2245 = {
  mur: [
    ['La plaça major en obert', 'Exigència de respecte', 'Contingut persistent'],
    ['Mur principal', 'to constructiu i respectuós', 'contingut de valor']
  ],
  mercat: [
    ['Molt més que vendre', 'Acords entre persones', 'Responsabilitat comunitària'],
    ['Mercat del poble', 'intercanviar eines', 'tauler d\'anuncis digital', 'no fa d\'intermediària', 'trellat']
  ],
  calendari: [
    ['L\'agenda que ens unix', 'Visibilitat i difusió', 'Convocatòries legítimes'],
    ['calendari comunitari', 'pública per a tota la xarxa', 'tens l\'autoritat']
  ],
  mapa: [
    ['Un espai per a situar-nos al territori', 'La privacitat sempre per davant', 'Visibilitat oberta'],
    ['mapa de la comarca', 'esborra totes les dades EXIF', 'visible i geolocalitzable']
  ],
  vehicle: [
    ['Moviment eficient i solidari', 'Privacitat en les rutes', 'Sense intermediaris'],
    ['oferir els seients buits', 'rutina de desplaçaments', 'acord privat']
  ],
  animalets: [
    ['Una xarxa de rescat i adopció', 'Avisos d\'emergència', 'Compromís amb la fauna'],
    ['benestar animal', 'telèfon o contacte', 'respecte als animals']
  ]
};
/* W4-08 · El cos de les dues pàgines de MarIA: un H5, cap negreta i un paràgraf. */
const COS_261004 = {
  treball: [['Connectem talent local'], []],
  habitatge: [['Obrir portes tancades'], []]
};
const COS = { ...COS_2245, ...COS_261004 };
const PARAGRAFS = (id) => (Object.hasOwn(COS_261004, id) ? 1 : 3);

describe('destinsControl · les targetes i on porta cada porta', () => {
  test('huit destins, en l’ordre de la graella, sense cap repetit, cadascun amb la seua pàgina', () => {
    expect(DESTINS_CONTROL.map((desti) => desti.id)).toEqual(['mur', 'mercat', 'calendari', 'mapa', 'vehicle', 'animalets', 'treball', 'habitatge']);
    expect(DESTINS_CONTROL.map((desti) => desti.pagina)).toEqual([
      'publicar_mur', 'publicar_mercat', 'publicar_calendari', 'publicar_mapa', 'vehicle_compartit', 'animalets', 'treball', 'habitatge'
    ]);
    expect(new Set(DESTINS_CONTROL.map((desti) => desti.id)).size).toBe(DESTINS_CONTROL.length);
    expect(Object.isFrozen(DESTINS_CONTROL)).toBe(true);
  });

  /* PRD §2 corregit · De les 16 accions, 9 tenen destí: Publicar al Mur i
     els huit Saber-ne més. Les 7 Publicar restants esperen el seu editor. */
  test('cada destí no nul és una ruta estàtica d’App o una pàgina que pinta /page/:slug; 9 de 16', () => {
    const rutes = rutesEstatiques();
    const destins = DESTINS_CONTROL.flatMap((desti) => [desti.publicar, desti.saberMes]).filter(Boolean);
    expect(destins.length).toBe(9);
    for (const cami of destins) {
      expect(cami.startsWith('/'), cami).toBe(true);
      expect(rutes.has(camiDe(cami)) || esPaginaServida(cami), cami).toBe(true);
    }
    for (const desti of DESTINS_CONTROL) {
      if (desti.seccio) expect(rutes.has(camiDe(desti.seccio)), desti.seccio).toBe(true);
    }
  });

  test('Mur: Publicar → /notes (el Bloc, D6) i Saber-ne més → la seua pàgina', () => {
    expect(perId.mur.publicar).toBe('/notes');
    expect(perId.mur.saberMes).toBe('/page/publicar_mur');
    expect(rutaDePagina('vehicle_compartit')).toBe('/page/vehicle_compartit');
  });

  test('Mercat i Calendari: la secció existix, però encara cap camí per a publicar', () => {
    expect([perId.mercat.publicar, perId.mercat.seccio, perId.mercat.saberMes]).toEqual([null, '/mercat', '/page/publicar_mercat']);
    expect([perId.calendari.publicar, perId.calendari.seccio, perId.calendari.saberMes]).toEqual([null, '/calendari', '/page/publicar_calendari']);
  });

  test('W4-04 · Mapa, Vehicle Compartit i Animalets: cap camí per a publicar, cap secció (no hi ha ruta /mapa) i «EN OBRES»', () => {
    for (const id of ['mapa', 'vehicle', 'animalets']) {
      expect([perId[id].publicar, perId[id].seccio], id).toEqual([null, null]);
      expect(enObres(perId[id]), id).toBe(true);
    }
    for (const id of ['mur', 'mercat', 'calendari']) expect(enObres(perId[id]), id).toBe(false);
    expect(rutesEstatiques().has('mapa')).toBe(false);
  });

  /* W4-08 · Treball i Habitatge, darrere d'Animalets: com Mapa, Vehicle
     Compartit i Animalets, sense secció ni camí per a publicar, i Saber-ne més
     cap a la seua pàgina. */
  test('W4-08 · Treball i Habitatge: posicions 7 i 8, cap camí per a publicar, «en obres» i la seua pàgina', () => {
    expect(DESTINS_CONTROL.slice(6).map((desti) => desti.id)).toEqual(['treball', 'habitatge']);
    for (const id of ['treball', 'habitatge']) {
      expect([perId[id].publicar, perId[id].seccio, perId[id].saberMes], id).toEqual([null, null, `/page/${id}`]);
      expect(enObres(perId[id]), id).toBe(true);
    }
  });

  /* W4-04 · Els títols literals de les tres targetes. La directriu 2245 del
     Mestre els fixa ara com «Publicar al Mapa», «Vehicle Compartit» i
     «Animalets» (abans «Compartir vehicle» i «Animalets i mascotes»):
     l'invariant és el mateix, presents a les posicions 4, 5 i 6 amb el títol
     literal del Mestre, i el literal és el definitiu. */
  test('W4-04 · els títols i els subtítols literals de les tres targetes, els de 2245', () => {
    expect(['mapa', 'vehicle', 'animalets'].map((id) => [contingutDe(perId[id]).titol, contingutDe(perId[id]).subtitol])).toEqual([
      ['Publicar al Mapa', 'Si tens coses que vols geolocalitzar, este és el lloc.'],
      ['Vehicle Compartit', 'Aprofita els seients buits i estalvia en els trajectes.'],
      ['Animalets', 'Troba, adopta o avisa sobre els animals del poble.']
    ]);
  });

  test('el contingut de cada targeta és el literal de la seua pàgina (2245 o 261004) i la data, la de la pàgina', () => {
    expect(Object.keys(TEXTOS)).toEqual(DESTINS_CONTROL.map((desti) => desti.id));
    for (const desti of DESTINS_CONTROL) {
      const contingut = contingutDe(desti);
      expect([desti.id, contingut.titol, contingut.subtitol, contingut.entradilla]).toEqual([desti.id, ...TEXTOS[desti.id]]);
      /* La mateixa pastilla a la boina i a la barra taronja de la pàgina. */
      expect([desti.id, contingut.time, contingut.date, contingut.dateTime]).toEqual([desti.id, ...dataDe(desti.id)]);
    }
    expect(contingutDe({ pagina: 'no-hi-es' })).toBeNull();
    expect(contingutDe({ pagina: 'constructor' })).toBeNull();
  });

  /* W4-08 · Totes les targetes porten il·lustració. Cap targeta usa la icona
     de la insígnia lateral.
     Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, T8,
     «imatges fantasma»): DIVERGENCIES_DE_PORTADA (['vehicle', 'animalets'])
     passa a []. La imatge ja no és de la taula: contingutDe la llig de la
     capçalera de la pàgina (PAGE_COPY image i imageAlt), i la targeta és el
     hero de la seua pàgina per a TOTS els destins. Vehicle Compartit porta
     el SEAT 600 de la pàgina (vehicle_nano_card.jpg), no «El Titi». */
  const DIVERGENCIES_DE_PORTADA = [];
  test('T8 · la imatge de cada targeta és la capçalera de la seua pàgina, amb el mateix text alternatiu; cap divergència', () => {
    for (const desti of DESTINS_CONTROL) {
      const { image, imageAlt } = PAGE_COPY[desti.pagina];
      const contingut = contingutDe(desti);
      /* Cap segona font: la taula ja no porta imatge. */
      expect([desti.id, Object.hasOwn(desti, 'imatge'), desti.icona]).toEqual([desti.id, false, null]);
      expect([desti.id, contingut.imatge, contingut.imatgeAlt]).toEqual([desti.id, image, imageAlt]);
      expect([desti.id, typeof image, imageAlt.length > 0]).toEqual([desti.id, 'string', true]);
      expect(existsSync(resolve(process.cwd(), 'public', image.replace(/^\//, ''))), image).toBe(true);
    }
    const divergents = DESTINS_CONTROL.filter((desti) => contingutDe(desti).imatge !== PAGE_COPY[desti.pagina].image).map((desti) => desti.id);
    expect(divergents).toEqual(DIVERGENCIES_DE_PORTADA);
  });

  /* El cas que va vore el Mestre: la targeta de Vehicle Compartit pintava «El
     Titi» (la vinyeta del plugin) i la seua pàgina, el SEAT 600. */
  test('T8 · Vehicle Compartit i Animalets: la Nano de la pàgina, mai la vinyeta del plugin', () => {
    expect(contingutDe(perId.vehicle).imatge).toBe('/assets/nano_cards/vehicle_nano_card.jpg');
    expect(contingutDe(perId.animalets).imatge).toBe('/assets/nano_cards/animalets_nano_card.jpg');
    for (const desti of DESTINS_CONTROL) {
      expect([desti.id, JSON.stringify(desti).includes('_vinyeta')]).toEqual([desti.id, false]);
    }
  });

  test('T8 · una pàgina sense imatge dona una targeta sense imatge (la icona, si n’hi ha), no una inventada', () => {
    PAGE_COPY.__prova_sense_imatge = { title: 'Sense imatge', date: '2026-10-04T01:10:00+02:00' };
    try {
      expect(contingutDe({ pagina: '__prova_sense_imatge' })).toMatchObject({ titol: 'Sense imatge', imatge: null, imatgeAlt: '' });
    } finally {
      delete PAGE_COPY.__prova_sense_imatge;
    }
  });

  /* W4-09 · L'autoria ja no porta l'enllaç: l'id de llavor només val per al
     xat local (XAT_SOCDEPOBLE). En remot, l'enllaç el resol xatCorporatiu.js.
     Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515, T6): la
     boina porta SEMPRE a la pàgina de l'autor; per a l'entitat pilot, la del
     projecte (RUTA_PROJECTE, resolta per l'id de l'entitat). El xat
     corporatiu és el de Comentar (ControlSection). */
  test('la boina és l’entitat socdepoble, no la IAIA, i porta al projecte; el xat de la llavor és a part', () => {
    expect(AUTORIA_SOCDEPOBLE).toEqual({
      author: 'Sóc de Poble',
      location: 'La Torre de les Maçanes',
      avatarUrl: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg',
      authorHref: '/projecte'
    });
    expect(AUTORIA_SOCDEPOBLE.authorHref).toBe(RUTA_PROJECTE);
    expect(AUTORIA_SOCDEPOBLE.authorHref).not.toContain('/xat');
    expect(rutesEstatiques().has(camiDe(AUTORIA_SOCDEPOBLE.authorHref))).toBe(true);
    expect(XAT_SOCDEPOBLE).toBe('/xat?amb=socdepoble');
    expect(XAT_SOCDEPOBLE).not.toContain(encodeURIComponent(IAIA_ID));
    expect(rutesEstatiques().has(camiDe(XAT_SOCDEPOBLE))).toBe(true);
    expect(Object.isFrozen(AUTORIA_SOCDEPOBLE)).toBe(true);
  });

  /* P6 · El gran botó de cada pàgina ix d'esta taula: cap segona font. */
  test('destiDePagina: el destí de cadascuna de les sis pàgines; cap altra clau', () => {
    for (const desti of DESTINS_CONTROL) expect(destiDePagina(desti.pagina), desti.pagina).toBe(desti);
    for (const clau of ['disseny', 'constructor', '', null, undefined, 42, 'PUBLICAR_MUR']) {
      expect([clau, destiDePagina(clau)]).toEqual([clau, null]);
    }
  });
});

describe('destinsControl · les pàgines de les targetes (PAGE_COPY)', () => {
  test('cos: els H5 i les negretes de cada pàgina (2245 o 261004), i el sanejador els conserva', () => {
    expect(Object.keys(COS)).toEqual(DESTINS_CONTROL.map((desti) => desti.id));
    for (const desti of DESTINS_CONTROL) {
      const pagina = PAGE_COPY[desti.pagina];
      const sanejat = new DOMParser().parseFromString(sanitizeHtml(pagina.html), 'text/html').body;
      const [titols, negretes] = COS[desti.id];
      expect([desti.id, [...sanejat.querySelectorAll('h5')].map((h) => h.textContent)]).toEqual([desti.id, titols]);
      expect([desti.id, [...sanejat.querySelectorAll('strong')].map((s) => s.textContent)]).toEqual([desti.id, negretes]);
      expect([desti.id, sanejat.querySelectorAll('p').length]).toEqual([desti.id, PARAGRAFS(desti.id)]);
      /* Cap altre nivell de títol: la pàgina usa H5, com el document. */
      expect([desti.id, sanejat.querySelectorAll('h1, h2, h3, h4, h6').length]).toEqual([desti.id, 0]);
    }
  });

  /* P6 (directriu 2325, confirmació 4) · Pàgines d'acció: cap etiqueta. Un
     `labels: []` explícit, perquè propsDePaginaDeText no hi pose les de sèrie
     (la clau en majúscules i «Pàgina»). */
  test('cap clau té ruta canònica (PageDetailSection les pinta); totes porten data i cap etiqueta', () => {
    for (const desti of DESTINS_CONTROL) {
      const pagina = PAGE_COPY[desti.pagina];
      expect(resolvePageSlugPath(desti.pagina), desti.pagina).toBeNull();
      expect(pagina.date, desti.pagina).toBe(dataDe(desti.id)[2]);
      expect([desti.pagina, pagina.labels]).toEqual([desti.pagina, []]);
    }
  });
});

describe('destinsControl · les portes', () => {
  const reserva = (_, text) => text;

  test('Publicar primer, en primari; Saber-ne més, en secundari (D4), amb els noms del PRD §5.2 i els títols nous', () => {
    expect(portesDe(perId.mur, reserva)).toEqual([
      { id: 'publicar', verb: 'Publicar', nom: 'Publicar al Mur', desti: '/notes', varietat: 'primari', enObres: '(en obres)', avis: '“Publicar al Mur” encara està en obres.' },
      { id: 'saber', verb: 'Saber-ne més', nom: 'Saber-ne més sobre el Mur', desti: '/page/publicar_mur', varietat: 'secundari', enObres: '(en obres)', avis: '“Saber-ne més sobre el Mur” encara està en obres.' }
    ]);
    expect(portesDe(perId.vehicle, reserva).map((porta) => [porta.nom, porta.desti])).toEqual([
      ['Publicar: Vehicle Compartit', null], ['Saber-ne més: Vehicle Compartit', '/page/vehicle_compartit']
    ]);
    expect(portesDe(perId.animalets, reserva).map((porta) => [porta.nom, porta.desti])).toEqual([
      ['Publicar: Animalets', null], ['Saber-ne més: Animalets', '/page/animalets']
    ]);
  });

  test('cada nom conté el verb visible (WCAG 2.5.3) i el títol de la targeta', () => {
    for (const desti of DESTINS_CONTROL) {
      const titol = contingutDe(desti).titol.replace(/^Publicar a(l)? /, '');
      for (const porta of portesDe(desti, reserva)) {
        expect(porta.nom.startsWith(porta.verb), porta.nom).toBe(true);
        expect(porta.nom.includes(titol), porta.nom).toBe(true);
      }
    }
  });

  test('amb el traductor anglés, les portes i l’avís es tradueixen; els destins no canvien', () => {
    const [publicar, saber] = portesDe(perId.mapa, createTranslator('en'));
    expect([publicar.verb, publicar.nom, publicar.enObres, publicar.avis]).toEqual([
      'Publish', 'Publish on the Map', '(under construction)', '“Publish on the Map” is still under construction.'
    ]);
    expect([saber.verb, saber.nom, saber.desti]).toEqual(['Learn more', 'Learn more about the Map', '/page/publicar_mapa']);
    expect(portesDe(perId.mur, createTranslator('en')).map((porta) => porta.desti)).toEqual(['/notes', '/page/publicar_mur']);
  });
});

describe('destinsControl · claus i18n', () => {
  const parells = [
    ...Object.values(TEXTOS_PORTES),
    ...DESTINS_CONTROL.flatMap((desti) => [desti.noms.publicar, desti.noms.saberMes])
  ];
  const LLENGUES = SUPPORTED_LANGUAGES.map(({ code }) => code);

  /* 5 comunes i 2 per cada un dels huit destins (W4-08: Treball i Habitatge). */
  test('21 claus, sense cap repetida', () => {
    expect(parells).toHaveLength(21);
    expect(new Set(parells.map(([clau]) => clau)).size).toBe(21);
  });

  test('en valencià, cada clau diu el mateix que la reserva de la taula', () => {
    const ca = createTranslator('ca');
    for (const [clau, text] of parells) expect([clau, ca(clau)]).toEqual([clau, text]);
  });

  /* El traductor cau al valencià si una llengua no té la clau: es compten les
     aparicions al diccionari, una per llengua (LLEI_07, paritat). */
  test('cada clau té entrada pròpia en les cinc llengües, una sola vegada', () => {
    for (const [clau] of parells) {
      expect([clau, fontI18n.split(`'${clau}':`).length - 1]).toEqual([clau, LLENGUES.length]);
    }
    expect(createTranslator('en')('section.control.vehicle.publicar')).toBe('Publish: Shared Vehicle');
    expect(createTranslator('es')('section.control.porta.saberMes')).toBe('Saber más');
    expect(createTranslator('eu')('section.control.porta.publicar')).toBe('Argitaratu');
    expect(createTranslator('gl')('section.control.porta.saberMes')).toBe('Saber máis');
    expect(createTranslator('en')('section.control.habitatge.saberMes')).toBe('Learn more: Housing');
    expect(createTranslator('es')('section.control.treball.publicar')).toBe('Publicar: Trabajo');
  });

  /* Mort el codi que la targeta estàndard ja no necessita: el títol i el
     subtítol de cada targeta ixen de PAGE_COPY, no del diccionari. */
  test('les claus de títol i subtítol de la versió compacta ja no existixen en cap llengua', () => {
    for (const desti of DESTINS_CONTROL) {
      for (const camp of ['titol', 'subtitol']) {
        const clau = `section.control.${desti.id}.${camp}`;
        expect([clau, fontI18n.includes(`'${clau}':`)]).toEqual([clau, false]);
      }
    }
  });
});
