// @vitest-environment node
/* P1-24 (Onada 2, kit de Codex auditat per Claude, 261101) · El rebost rural
   de la IAIA: 16 càpsules curades que responen sense xarxa quan l'Atles no
   sap la pregunta. Ací es fixen la integritat, la pregunta de cada càpsula
   (també en castellà), les paraules soles que no hi han de caure, el títol
   d'un document de la Wiki que no s'hi ha de perdre, la prioritat de l'Atles
   i que cada fet que diuen casa amb la seua font. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CAPSULES_RURALS } from './iaiaRebostRural.js';
import {
  ATLES_OPERATIU, ENCAPCALAMENT_DE_SOC_DE_POBLE, MAXIM_FRAGMENT_DE_L_ATLES, RUTA_DE_LA_WIKI, RUTA_INTERNA, cercaAlRebostRural,
  cercaRellevant, consultaTecnicaIAIA, indexDeLaCapaLocal, indexDelRebostRural, oblidaIndexDeLaWiki, respostaDeLaIAIA
} from './iaiaLocal.js';
import { SECTIONS } from '../config/sections.js';
import { wikiManifest } from './wikiManifest.js';

afterEach(() => { oblidaIndexDeLaWiki(); });

const plega = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const text = (capsula) => capsula.paragrafs.join(' ');
const perId = (id) => CAPSULES_RURALS.find((capsula) => capsula.id === id);
const liniesDeRuta = (resposta) => String(resposta).split('\n').filter((linia) => linia.startsWith('· '));
const senseCarrega = () => vi.fn(() => { throw new Error('el rebost no carrega res'); });

describe('integritat del rebost', () => {
  test('16 càpsules immutables, ids únics amb el prefix rebost:, títols únics i font editorial', () => {
    expect(CAPSULES_RURALS).toHaveLength(16);
    expect(new Set(CAPSULES_RURALS.map((capsula) => capsula.id)).size).toBe(16);
    expect(new Set(CAPSULES_RURALS.map((capsula) => capsula.titol)).size).toBe(16);
    expect(Object.isFrozen(CAPSULES_RURALS)).toBe(true);
    for (const capsula of CAPSULES_RURALS) {
      expect([capsula.id, capsula.id.startsWith('rebost:')]).toEqual([capsula.id, true]);
      expect([capsula.id, [capsula, capsula.claus, capsula.exclou, capsula.paragrafs].every(Object.isFrozen)]).toEqual([capsula.id, true]);
      expect([capsula.id, capsula.fontEditorial.length > 8, capsula.claus.length > 0]).toEqual([capsula.id, true, true]);
    }
  });

  test('cada càpsula sencera dins del màxim de l’Atles, sense marcatge, adreces, correus ni «masia»', () => {
    for (const capsula of CAPSULES_RURALS) {
      const cos = `${capsula.titol} ${text(capsula)}`;
      expect([capsula.id, text(capsula).length <= MAXIM_FRAGMENT_DE_L_ATLES]).toEqual([capsula.id, true]);
      expect([capsula.id, /[<>`@]|https?:|www\./.test(cos), plega(cos).includes('masia')]).toEqual([capsula.id, false, false]);
    }
  });

  test('cada ruta és interna i d’una secció de veres (la bombolla la fa enllaç)', () => {
    const seccions = new Set(SECTIONS.map((seccio) => seccio.path));
    for (const capsula of CAPSULES_RURALS) {
      expect([capsula.id, RUTA_INTERNA.test(capsula.ruta), seccions.has(capsula.ruta)]).toEqual([capsula.id, true, true]);
    }
  });

  test('l’índex del rebost és a part: l’Atles no hi guanya ni hi perd cap document', () => {
    expect(indexDeLaCapaLocal().documents.filter((document) => document.id.startsWith('rebost:'))).toEqual([]);
    expect(indexDelRebostRural().documents.map((document) => document.id)).toEqual(CAPSULES_RURALS.map((capsula) => capsula.id));
    const abans = indexDelRebostRural();
    oblidaIndexDeLaWiki();
    expect(indexDelRebostRural()).not.toBe(abans);
  });
});

/* La pregunta natural de cada càpsula: la troba primera, sense carregar la
   Wiki, amb la capçalera de Sóc de Poble, el text sencer i la seua ruta. */
const PREGUNTES = [
  ['Què és la pedra seca?', 'rebost:pedra_seca'],
  ['Com es fa un marge de pedra seca?', 'rebost:pedra_seca'],
  ['Qui arregla un marge de pedra?', 'rebost:pedra_seca'],
  ['Què és la pilota valenciana?', 'rebost:pilota'],
  ['Quan són les partides de pilota?', 'rebost:pilota'],
  ['trinquet', 'rebost:pilota'],
  ['Com apunte els noms de les partides?', 'rebost:toponimia'],
  ['toponímia', 'rebost:toponimia'],
  ['Com recull els records del llavador?', 'rebost:llavador'],
  ['Com guarde una recepta de casa?', 'rebost:receptari'],
  ['Com recull les dites del poble?', 'rebost:refranyer'],
  ['refranyer', 'rebost:refranyer'],
  ['Com documente un ofici antic?', 'rebost:oficis'],
  ['Com conserve una cançó antiga?', 'rebost:canconer'],
  ['Com faig un anunci veïnal?', 'rebost:anunci_veinal'],
  ['Com preparo una convocatòria?', 'rebost:convocatoria'],
  /* «convoque» i «convocar» fan l'arrel «convoc», que el text ha de mostrar. */
  ['Com convoque una reunió?', 'rebost:convocatoria'],
  ['Vull convocar una reunió', 'rebost:convocatoria'],
  ['Com puc descriure una fotografia?', 'rebost:text_alternatiu'],
  ['Com preparo una trobada veïnal?', 'rebost:trobada'],
  ['Com faig un avís d’objecte perdut?', 'rebost:objecte_perdut'],
  ['Com entrevistar una persona major?', 'rebost:entrevista'],
  ['Com revise un cartell?', 'rebost:cartell'],
  ['Com escric una acta de reunió?', 'rebost:acta_veinal']
];

describe('cada càpsula respon la seua pregunta', () => {
  test('cap càpsula sense pregunta', () => {
    expect(CAPSULES_RURALS.map((capsula) => capsula.id).filter((id) => !PREGUNTES.some(([, esperat]) => esperat === id))).toEqual([]);
  });

  test.each(PREGUNTES)('«%s» → %s, sencera i sense xarxa', async (pregunta, id) => {
    expect(cercaRellevant(indexDeLaCapaLocal(), pregunta)).toEqual([]);
    expect(cercaAlRebostRural(pregunta)[0]?.id).toBe(id);
    const carrega = senseCarrega();
    const resposta = await respostaDeLaIAIA(pregunta, { carrega });
    expect(carrega).not.toHaveBeenCalled();
    const capsula = perId(id);
    expect(resposta.split('\n')[0]).toBe(ENCAPCALAMENT_DE_SOC_DE_POBLE);
    expect(resposta).toContain(`${text(capsula)}\n· ${capsula.titol} — ${capsula.ruta}`);
  });

  test.each([
    ['¿Qué es la piedra seca?', 'rebost:pedra_seca'],
    ['¿Cómo guardo una receta?', 'rebost:receptari'],
    ['¿Cómo conservo las canciones?', 'rebost:canconer'],
    ['¿Cómo reviso un cartel?', 'rebost:cartell'],
    ['lavadero', 'rebost:llavador'],
    ['refranes', 'rebost:refranyer']
  ])('en castellà, «%s» → %s (respon en valencià)', async (pregunta, id) => {
    expect(cercaAlRebostRural(pregunta)[0]?.id).toBe(id);
    expect(liniesDeRuta(await respostaDeLaIAIA(pregunta, { carrega: senseCarrega() }))[0]).toBe(`· ${perId(id).titol} — ${perId(id).ruta}`);
  });
});

describe('el que el rebost no s’ha de quedar', () => {
  /* Paraules soles que diuen massa coses o que fan l'arrel d'una clau («trobe»
     → «trobada»), i «perdut», «oficis» i «reunió», que abans trobaven
     Animalets, Treball i Publicar al Calendari i les continuen trobant. */
  test.each(['pedra', 'seca', 'marges', 'eines', 'partides', 'dites', 'records', 'On ho trobe?', 'No trobe el botó', 'perdut', 'oficis', 'reunió',
    'He perdut les claus', 'Com demane les receptes del metge?', 'Quines eines hi ha?',
    /* Quatre paraules i només dues a la càpsula de l'anunci: no n'és el tema. */
    'Com preparo la paella per a la festa del poble?',
    /* Una sola arrel repetida no fa dues paraules (minimTermes i paraula sola). */
    'pedra pedres', 'marge marges', 'oficis ofici', 'trobe trobes',
    /* Feina i salut no són memòria oral ni cuina (exclou). */
    "Hi ha treball d'ofici al poble?", "Ofertes de treball d'oficis", 'Oficis i treball al poble', 'Entrevista de treball',
    'Com faig una entrevista de treball?', 'Com guarde una recepta del metge?', '¿Cómo guardo una receta del médico?'])('«%s»: cap càpsula', (pregunta) => {
    expect(cercaAlRebostRural(pregunta)).toEqual([]);
  });

  /* Abans del rebost, la pàgina Treball responia les preguntes de feina:
     les continua responent ella, no la càpsula dels oficis antics.
     O4-CLAUDE-3 · Des d'IDEA-61 (Onades 1-3, cc3e443dc), Treball és la secció
     vertical amb la llista viva de les ofertes (sections.js, /treball):
     l'entrada atles:treball de l'Atles, que té prioritat, hi porta, i
     /page/treball queda com el text de «Saber-ne més». La ruta ix de SECTIONS
     (totes les seccions), no de SECTION_ORDER: la vertical fora de la barra
     lateral (261102) continua sent una ruta interna vàlida. */
  test.each(["Hi ha treball d'ofici al poble?", "Ofertes de treball d'oficis"])('«%s» continua anant a la pàgina Treball', async (pregunta) => {
    const treball = SECTIONS.find((seccio) => seccio.id === 'treball');
    expect([treball.label, treball.path, treball.kind]).toEqual(['Treball', '/treball', 'vertical']);
    expect(ATLES_OPERATIU.find((entrada) => entrada.id === 'atles:treball')).toMatchObject({ titol: treball.label, ruta: treball.path });
    expect(RUTA_INTERNA.test(treball.path)).toBe(true);
    const resposta = await respostaDeLaIAIA(pregunta, { tempsMaxim: 60000 });
    expect(liniesDeRuta(resposta)[0]).toBe(`· ${treball.label} — ${treball.path}`);
    expect(resposta).not.toContain(perId('rebost:oficis').titol);
  }, 60000);

  /* «Pedra Seca» també és el mètode de treball i el sistema de disseny de
     Sóc de Poble: el títol d'un document de la Wiki no cau en la càpsula. */
  test.each(['Què és el mètode Pedra Seca?', 'Disseny Pedra Seca', 'Llibre Blanc de Producció (El Mètode Pedra Seca)',
    "Lleis de pas: integració de Pedra Seca a l'amfitrió", 'Tokens de Pedra Seca'])('«%s» és de la Wiki, no del rebost', (pregunta) => {
    expect(cercaAlRebostRural(pregunta)).toEqual([]);
  });

  test('les preguntes de les proves de la Wiki i del magatzem local no hi entren', () => {
    for (const pregunta of ['Què és Sollutia?', 'pedra', 'Com funciona Sollutia?', 'quota', 'Com funciona el Rebost, IAIA?', 'zzqx',
      'Com esborre la safata del pis?', 'Com esborre el meu compte?', 'Què és Sollutia i el Model B?', 'Sollutia']) {
      expect([pregunta, cercaAlRebostRural(pregunta)]).toEqual([pregunta, []]);
    }
  });

  test('una pregunta desconeguda continua anant a la Wiki, i sense la capa local tampoc no hi ha rebost', async () => {
    const carrega = vi.fn(async () => ({ items: [] }));
    expect(await respostaDeLaIAIA('quasar zigomàtic', { carrega })).toBeNull();
    expect(carrega).toHaveBeenCalledTimes(1);
    const sensePaquet = vi.fn(async () => ({ items: [] }));
    expect(await respostaDeLaIAIA('Com guarde una recepta de casa?', { carrega: sensePaquet, capaLocal: false })).toBeNull();
    expect(sensePaquet).toHaveBeenCalledTimes(1);
  });
});

describe('l’Atles continua manant', () => {
  test.each([
    ['Què és el Mercat?', 'atles:mercat'],
    ['anunci', 'atles:mercat'],
    ["Quan és la collita de l'oliva i l'oli a l'almàssera?", 'atles:oliva_oli'],
    ['Quines fonts i sendes de muntanya hi ha?', 'atles:patrimoni_fonts']
  ])('«%s» → %s, no el rebost', async (pregunta, id) => {
    const entrada = ATLES_OPERATIU.find((e) => e.id === id);
    expect(liniesDeRuta(await respostaDeLaIAIA(pregunta, { carrega: senseCarrega() }))).toEqual([`· ${entrada.titol} — ${entrada.ruta}`]);
  });
});

describe('cada fet casa amb la seua font', () => {
  test('cap càpsula no promet el que la IAIA no fa: diu el que no fa', () => {
    expect(text(perId('rebost:anunci_veinal'))).toContain('No publique res per tu');
    expect(text(perId('rebost:trobada'))).toContain('no faig reserves ni envie invitacions');
    expect(text(perId('rebost:receptari'))).toContain('no valide conserves ni done consells de salut');
    expect(text(perId('rebost:convocatoria'))).toContain('no tinc cap agenda en directe');
    expect(text(perId('rebost:pilota'))).toContain('no conec els horaris ni les partides de hui');
    /* Cap col·lecció de memòria oral: l'Atles diu que encara no n'hi ha. */
    expect(ATLES_OPERATIU.find((e) => e.id === 'atles:patrimoni_fonts').paragrafs.join(' ')).toContain('encara no té cap col·lecció');
    for (const capsula of CAPSULES_RURALS) expect([capsula.id, /col·lecci|arxiu del poble/.test(text(capsula))]).toEqual([capsula.id, false]);
  });

  test('vendre, canviar o regalar és del Mercat, i el Bloc de Notes és la ruta de les notes', () => {
    const mercat = ATLES_OPERATIU.find((e) => e.id === 'atles:mercat');
    for (const verb of ['vendre', 'canviar', 'regalar']) expect(mercat.claus).toContain(verb);
    expect(text(perId('rebost:anunci_veinal'))).toContain('vendre, canviar o regalar coses, el lloc és el Mercat');
    expect(perId('rebost:receptari').ruta).toBe(ATLES_OPERATIU.find((e) => e.id === 'atles:notes').ruta);
  });

  test('«D’això en parla la Wiki de Poble» és cert: el mètode Pedra Seca el respon la Wiki pública', async () => {
    expect(text(perId('rebost:pedra_seca'))).toContain("D'això en parla la Wiki de Poble");
    expect(wikiManifest.items.some((item) => /^# .*Pedra Seca/m.test(item.content || ''))).toBe(true);
    /* La consulta del diàleg és la Wiki sola: hi troba el mètode pel títol. */
    const consulta = await consultaTecnicaIAIA('Què és el mètode Pedra Seca?', { tempsMaxim: 60000 });
    expect(consulta.estat).toBe('resposta');
    expect(consulta.fonts.some((font) => font.titol.includes('Pedra Seca'))).toBe(true);
    /* I al fil, la segona capa (no el rebost) cita eixe document de la Wiki. */
    const resposta = await respostaDeLaIAIA('Què és el mètode Pedra Seca?', { tempsMaxim: 60000 });
    expect(liniesDeRuta(resposta).some((linia) => linia.includes('Pedra Seca') && linia.includes(`${RUTA_DE_LA_WIKI}?item=`))).toBe(true);
    expect(resposta).not.toContain(perId('rebost:pedra_seca').titol);
  }, 60000);

  test('els dos fets culturals porten la seua font pública', () => {
    expect(perId('rebost:pedra_seca').fontEditorial).toContain('ich.unesco.org');
    expect(perId('rebost:pilota').fontEditorial).toContain('portalinmaterial.cultura.gob.es');
  });
});
