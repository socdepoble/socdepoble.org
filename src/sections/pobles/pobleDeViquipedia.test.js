import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test, vi } from 'vitest';
import {
  DRETS_IMATGES, DRETS_TEXT, MAXIM_CREDIT, candidatsDeFitxers, credit, divisionsDe, entradillaDe, esFotoValida, esLlicenciaLliure,
  pobleDeViquipedia, provinciaDeIne, triaImatges, triaMunicipi
} from './pobleDeViquipedia.js';
import { creaCauDeViquipedia } from './cauDeViquipedia.js';
import { AGENT_USUARI, ErrorDades, creaLectorViquipedia } from '../../data/adaptadors/viquipedia/client.js';
import { RECURSOS } from '../../data/adaptadors/viquipedia/recursos.js';
import { MAXIM_LEMA } from '../../data/limitsText.js';
import { rutaXatDePagina } from '../../config/navigation.js';
import { MOCK_TOWNS } from './townsSeed.js';
import { nomDeLaGent } from './nomsDelPoble.js';
import { objecteDelPobleXat } from './xatDelPoble.js';

/* Onada 5 (F5) · L'algoritme de pobles nous de cap a peus, sense xarxa: un
   fetch fals que només serveix les captures reals del 261009, per URL. */
const DIR = resolve(process.cwd(), 'tests/frontissa/fixtures/viquipedia');
const captura = (nom) => JSON.parse(readFileSync(resolve(DIR, `${nom}.json`), 'utf8'));
const clauDUrl = (url) => {
  const u = new URL(url);
  return `${u.origin}${u.pathname}?${[...u.searchParams].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map((p) => p.join('=')).join('&')}`;
};

const TORRE = ['cerca-la-torre-de-les-macanes', 'entitats-la-torre-de-les-macanes', 'article-la-torre-de-les-macanes',
  'etiquetes-la-torre-de-les-macanes', 'fitxers-la-torre-de-les-macanes'];
const SELLA = ['cerca-sella', 'entitats-sella', 'article-sella-marina-baixa', 'etiquetes-sella', 'fitxers-sella', 'article-sella'];
const INEXISTENT = ['cerca-inexistent', 'article-inexistent'];

/* `serveix` diu quina captura respon cada URL; `com` permet servir el cos
   d'una altra (per a simular un índex de cerca que va tard). Una URL sense
   captura respon 404 i queda apuntada a `fora`. */
function wikimediaFals(serveix, com = {}) {
  const peticions = [];
  const fora = [];
  const perUrl = new Map(serveix.map((nom) => [clauDUrl(captura(nom).url), captura(com[nom] || nom)]));
  const fetchImpl = vi.fn(async (url, init) => {
    peticions.push({ url, init });
    const resposta = perUrl.get(clauDUrl(url));
    if (!resposta) {
      fora.push(url);
      return new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } });
    }
    return new Response(JSON.stringify(resposta.body), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' } });
  });
  const { llig } = creaLectorViquipedia({ fetchImpl, espaiMs: 0, atzar: () => 0 });
  return { llig, peticions, fora, fetchImpl };
}

const TORRE_GRAN = Object.freeze({
  src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eb/Torre_Gran_%28Torremanzanas%29_3.jpg/1920px-Torre_Gran_%28Torremanzanas%29_3.jpg',
  fitxer: 'Torre Gran (Torremanzanas) 3.jpg',
  amplada: 3008,
  alcada: 2000,
  autor: 'Relleu',
  llicencia: 'CC BY-SA 3.0 es',
  llicenciaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/es/deed.en',
  fontUrl: 'https://commons.wikimedia.org/wiki/File:Torre_Gran_(Torremanzanas)_3.jpg'
});

/* «parcial»: Commons només hi dona una foto que passe (l'avatar repetix la
   panoràmica i no hi ha reserva), i l'ordre en demana tres. */
const DTO_TORRE = Object.freeze({
  estat: 'parcial',
  id: 'la-torre-de-les-macanes',
  title: 'La Torre de les Maçanes',
  author: 'Gent de la Torre de les Maçanes',
  content: 'La Torre de les Maçanes és una vila i municipi del País Valencià situat a la comarca de l\'Alacantí, a la comarca històrica de la Foia de Xixona.',
  provincia: 'Alacant',
  comarca: 'L\'Alacantí',
  population: '749 hab',
  lat: 38.6067,
  lng: -0.4192,
  wikidata_id: 'Q1641908',
  wikipedia_title: 'La Torre de les Maçanes',
  copyright: `${DRETS_TEXT} · ${DRETS_IMATGES}`,
  imatges: { hero: TORRE_GRAN, avatar: TORRE_GRAN, reserva: null },
  /* Onada 6 (pla 261009_0245, ítem 4) · El xat del poble es diu com la seua gent. */
  chat: '/xat?sobre=poble:la-torre-de-les-macanes&titol=Gent%20de%20la%20Torre%20de%20les%20Ma%C3%A7anes&ruta=%2Fpobles%2Fla-torre-de-les-macanes'
});

describe('pobleDeViquipedia · de cap a peus amb les captures', () => {
  test('la Torre de les Maçanes: el DTO, amb les dades de la Viquipèdia, Wikidata i Commons', async () => {
    const { llig, peticions, fora } = wikimediaFals(TORRE);
    const poble = await pobleDeViquipedia('La Torre de les Maçanes', { llig });
    expect(poble).toEqual(DTO_TORRE);
    expect(fora).toEqual([]);
    expect(peticions.map(({ url }) => clauDUrl(url)).sort()).toEqual(TORRE.map((nom) => clauDUrl(captura(nom).url)).sort());
    expect(peticions.every(({ init }) => init.headers['Api-User-Agent'] === AGENT_USUARI)).toBe(true);
  });

  test('el DTO és tancat, l’entradilla cap al límit i el botó del xat és el de la Pàgina del poble', async () => {
    const { llig } = wikimediaFals(TORRE);
    const poble = await pobleDeViquipedia('La Torre de les Maçanes', { llig });
    expect(Object.isFrozen(poble)).toBe(true);
    expect(Object.isFrozen(poble.imatges)).toBe(true);
    expect(Object.isFrozen(poble.imatges.hero)).toBe(true);
    expect(Array.from(poble.content).length).toBeLessThanOrEqual(MAXIM_LEMA);
    expect(poble.chat).toBe(rutaXatDePagina(objecteDelPobleXat(poble)));
    expect(poble.id).toBe(MOCK_TOWNS.find((town) => town.title === poble.title).id);
  });

  test('la foto de Wikidata (P18) no hi entra si fa 600 px: la panoràmica és la Torre Gran, i l’escut mai es demana', async () => {
    const { llig, peticions } = wikimediaFals(TORRE);
    const poble = await pobleDeViquipedia('La Torre de les Maçanes', { llig });
    expect(poble.imatges.hero.fitxer).not.toBe('El riu251.jpg');
    expect(peticions.some(({ url }) => decodeURIComponent(url).includes('Escut'))).toBe(false);
  });

  test('Sella: tria el municipi de la Marina Baixa, no la pàgina de desambiguació', async () => {
    const { llig, peticions, fora } = wikimediaFals(SELLA);
    const poble = await pobleDeViquipedia('Sella', { llig, provincia: 'Alacant' });
    expect(fora).toEqual([]);
    expect(poble).toMatchObject({
      estat: 'parcial', id: 'sella', title: 'Sella', author: 'Gent de Sella',
      provincia: 'Alacant', comarca: 'La Marina Baixa', population: '621 hab',
      wikidata_id: 'Q985137', wikipedia_title: 'Sella (Marina Baixa)', lat: 38.6083, lng: -0.2728
    });
    expect(poble.content).toBe('Sella és un municipi del País Valencià situat a la comarca de la Marina Baixa. El municipi es troba a la zona meridional de la serra d\'Aitana. El millor accés és des de la Vila Joiosa, a través de la CV-770.');
    /* La panoràmica de Wikidata fa 9428×2538 (3,7:1): massa estreta per a
       la capçalera. Queda l'Ermita. */
    expect(poble.imatges.hero.fitxer).toBe('Ermita de Sella (restos del Castillo de Santa Bárbara) 3.jpg');
    expect(poble.imatges.reserva).toBeNull();
    expect(peticions.some(({ url }) => new URL(url).searchParams.get('titles') === 'Sella')).toBe(false);
    expect(poble.id).toBe(MOCK_TOWNS.find((town) => town.title === 'Sella').id);
  });

  test('Sella amb una província que no és la seua: cap municipi, i el títol pelat és una desambiguació', async () => {
    const { llig, peticions } = wikimediaFals(SELLA);
    const poble = await pobleDeViquipedia('Sella', { llig, provincia: 'València' });
    expect(poble).toMatchObject({ estat: 'sense-article', id: 'sella', author: 'Gent de Sella', content: '', provincia: 'València', wikidata_id: null });
    expect(peticions.some(({ url }) => new URL(url).searchParams.get('titles') === 'Sella')).toBe(true);
  });

  test('un poble que no existix: «sense-article», amb nom, id i autor, i cap text inventat', async () => {
    const { llig, fora } = wikimediaFals(INEXISTENT);
    const poble = await pobleDeViquipedia('Poble Inexistent de Prova SdP', { llig });
    expect(fora).toEqual([]);
    expect(poble).toEqual({
      estat: 'sense-article',
      id: 'poble-inexistent-de-prova-sdp',
      title: 'Poble Inexistent de Prova SdP',
      author: 'Gent de Poble Inexistent de Prova SdP',
      content: '',
      provincia: null,
      comarca: null,
      population: null,
      lat: null,
      lng: null,
      wikidata_id: null,
      wikipedia_title: null,
      copyright: null,
      imatges: { hero: null, avatar: null, reserva: null },
      chat: '/xat?sobre=poble:poble-inexistent-de-prova-sdp&titol=Gent%20de%20Poble%20Inexistent%20de%20Prova%20SdP&ruta=%2Fpobles%2Fpoble-inexistent-de-prova-sdp'
    });
  });

  test('si l’índex de cerca va tard, el títol val només verificat contra Wikidata', async () => {
    const { llig, peticions, fora } = wikimediaFals(TORRE, { 'cerca-la-torre-de-les-macanes': 'cerca-inexistent' });
    const poble = await pobleDeViquipedia('La Torre de les Maçanes', { llig });
    expect(fora).toEqual([]);
    expect(poble).toEqual(DTO_TORRE);
    expect(peticions.filter(({ url }) => new URL(url).origin === 'https://ca.wikipedia.org')).toHaveLength(1);
  });

  test('sense Commons, la proposta és «parcial»: text sí, fotos no', async () => {
    const { llig, fora } = wikimediaFals(TORRE.filter((nom) => !nom.startsWith('fitxers')));
    const poble = await pobleDeViquipedia('La Torre de les Maçanes', { llig });
    expect(fora).toHaveLength(1);
    expect(new URL(fora[0]).origin).toBe('https://commons.wikimedia.org');
    expect(poble).toMatchObject({ estat: 'parcial', content: DTO_TORRE.content, copyright: DRETS_TEXT, comarca: 'L\'Alacantí' });
    expect(poble.imatges).toEqual({ hero: null, avatar: null, reserva: null });
  });

  test('«complet» només amb les tres fotos distintes: la panoràmica, un avatar que no la repetix i la reserva', async () => {
    const torre = RECURSOS.fitxers.traductor(captura('fitxers-la-torre-de-les-macanes').body).find((f) => f.fitxer === TORRE_GRAN.fitxer);
    const quadrada = { ...torre, fitxer: 'Plaça Major.jpg', amplada: 2000, alcada: 1900, sha1: 'a'.repeat(40) };
    const apaisada = { ...torre, fitxer: 'Vista del poble.jpg', amplada: 2000, alcada: 1000, sha1: 'b'.repeat(40) };
    const ambFotos = (...mes) => {
      const { llig } = wikimediaFals(TORRE);
      return async (recurs, ...resta) => {
        const valor = await llig(recurs, ...resta);
        return recurs === 'fitxers' ? [...valor, ...mes] : valor;
      };
    };
    const complet = await pobleDeViquipedia('La Torre de les Maçanes', { llig: ambFotos(quadrada, apaisada) });
    expect(complet.estat).toBe('complet');
    expect([complet.imatges.hero.fitxer, complet.imatges.avatar.fitxer, complet.imatges.reserva.fitxer])
      .toEqual([TORRE_GRAN.fitxer, 'Plaça Major.jpg', 'Vista del poble.jpg']);
    /* Amb dos fotos no n'hi ha prou: sense reserva, o amb l'avatar que repetix la panoràmica. */
    expect((await pobleDeViquipedia('La Torre de les Maçanes', { llig: ambFotos(quadrada) })).estat).toBe('parcial');
    expect((await pobleDeViquipedia('La Torre de les Maçanes', { llig: ambFotos(apaisada) })).estat).toBe('parcial');
  });
});

describe('pobleDeViquipedia · no llança mai', () => {
  const noDisponible = (poble, nom = 'Benifato') => {
    expect(poble).toMatchObject({ estat: 'no-disponible', title: nom, content: '', wikidata_id: null, copyright: null });
    expect(poble.id).toBeTruthy();
    expect(poble.author).toBe(nomDeLaGent(nom));
  };

  test('un lector que falla dona «no-disponible»', async () => {
    noDisponible(await pobleDeViquipedia('Benifato', { llig: async () => { throw new ErrorDades('UNAVAILABLE'); } }));
    noDisponible(await pobleDeViquipedia('Benifato', { llig: () => { throw new Error('síncron'); } }));
    noDisponible(await pobleDeViquipedia('Benifato', { llig: async () => undefined }));
    noDisponible(await pobleDeViquipedia('Benifato', { llig: async () => ({ inesperat: true }) }));
  });

  test('cancel·lar-ho també dona «no-disponible»', async () => {
    const { llig } = wikimediaFals(TORRE);
    const controlador = new AbortController();
    controlador.abort();
    noDisponible(await pobleDeViquipedia('La Torre de les Maçanes', { llig, signal: controlador.signal }), 'La Torre de les Maçanes');
  });

  test('sense nom no es pregunta res', async () => {
    const llig = vi.fn();
    const poble = await pobleDeViquipedia('   ', { llig });
    expect(poble).toMatchObject({ estat: 'sense-article', id: null, title: '', author: '', chat: null });
    expect(llig).not.toHaveBeenCalled();
  });
});

describe('entradillaDe', () => {
  test('un text curt es queda sencer', () => {
    expect(entradillaDe('Tibi és un municipi de l\'Alcoià.')).toBe('Tibi és un municipi de l\'Alcoià.');
  });

  test('només el primer paràgraf, en text pla i sense caràcters de control', () => {
    expect(entradillaDe('\u0007Primer\u0000   paràgraf.\n\nSegon paràgraf.')).toBe('Primer paràgraf.');
  });

  test('es talla a l’última fi de frase dins del límit', () => {
    const extracte = RECURSOS.article.traductor(captura('article-sella-marina-baixa').body).extracte;
    expect(Array.from(extracte).length).toBeGreaterThan(MAXIM_LEMA);
    expect(entradillaDe(extracte)).toMatch(/CV-770\.$/);
    expect(entradillaDe('Una frase. Dues frases i més text', 20)).toBe('Una frase.');
  });

  test('sense cap fi de frase, per l’última paraula sencera i amb «…»', () => {
    const text = 'paraula '.repeat(60).trim();
    const tall = entradillaDe(text);
    expect(tall.endsWith('paraula…')).toBe(true);
    expect(Array.from(tall).length).toBeLessThanOrEqual(MAXIM_LEMA);
    expect(entradillaDe('Una, dues, tres quatre', 13)).toBe('Una, dues…');
  });

  test('un emoji compta com un caràcter', () => {
    expect(entradillaDe('🌾'.repeat(MAXIM_LEMA))).toBe('🌾'.repeat(MAXIM_LEMA));
    const tall = entradillaDe('🌾'.repeat(MAXIM_LEMA + 40));
    expect(Array.from(tall)).toHaveLength(MAXIM_LEMA);
    expect(tall.endsWith('🌾…')).toBe(true);
  });
});

describe('les imatges', () => {
  const MOSTRA = RECURSOS.fitxers.traductor(captura('fitxers-mostra-exclusions').body);
  const TORRE_FITXER = MOSTRA.find((f) => f.fitxer === TORRE_GRAN.fitxer);
  const quadrada = { ...TORRE_FITXER, fitxer: 'Plaça Major.jpg', amplada: 2000, alcada: 1900, sha1: 'a'.repeat(40) };
  const apaisada = { ...TORRE_FITXER, fitxer: 'Vista del poble.jpg', amplada: 4000, alcada: 2000, sha1: 'b'.repeat(40) };

  test('fora l’escut (SVG), la localització (mapa de 255 px) i la foto de 600 px', () => {
    expect(MOSTRA).toHaveLength(4);
    expect(triaImatges(MOSTRA)).toEqual({ hero: TORRE_GRAN, avatar: TORRE_GRAN, reserva: null });
  });

  test('fora també les fotos amb restriccions o amb una llicència que no és lliure', () => {
    expect(triaImatges([{ ...TORRE_FITXER, restriccions: 'trademarked' }]).hero).toBeNull();
    expect(triaImatges([{ ...TORRE_FITXER, llicencia: 'CC BY-NC-SA 4.0' }]).hero).toBeNull();
    expect(triaImatges([{ ...TORRE_FITXER, llicencia: 'GFDL' }]).hero).toBeNull();
  });

  /* Gauntlet 261030, cicle 3 (vq-autor-commons-llarg-rebutja-tota-la-proposta) ·
     El crèdit d'una foto és text de Commons sense sostre: si passava del que
     guarda la cau, la cau rebutjava tota la proposta. Es talla amb «…». */
  test('l’autor i la llicència d’una foto es tallen a MAXIM_CREDIT punts de codi, i la cau desa la proposta', async () => {
    const tria = triaImatges([{ ...TORRE_FITXER, autor: `${'A'.repeat(230)}🌄`, llicencia: `CC BY-SA 4.0 ${'x'.repeat(250)}` }]);
    expect(MAXIM_CREDIT).toBe(200);
    expect(tria.hero.autor).toBe(`${'A'.repeat(MAXIM_CREDIT - 1)}…`);
    expect(Array.from(tria.hero.llicencia)).toHaveLength(MAXIM_CREDIT);
    expect(tria.hero.llicencia.startsWith('CC BY-SA 4.0 ')).toBe(true);
    // Un crèdit que ja hi cap no es toca, i cap valor no s'inventa.
    expect(triaImatges([TORRE_FITXER]).hero.autor).toBe(TORRE_FITXER.autor);
    expect(credit('A'.repeat(MAXIM_CREDIT))).toBe('A'.repeat(MAXIM_CREDIT));
    expect([credit(null), credit(undefined)]).toEqual([null, null]);
    const cau = creaCauDeViquipedia({ idb: null, Canal: null, navegador: null });
    const entrada = await cau.desa('la-torre', { estat: 'parcial', id: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes', imatges: tria });
    expect(entrada.dto.imatges.hero.autor).toBe(tria.hero.autor);
  });

  test('sense cap apaïsada no hi ha panoràmica', () => {
    expect(triaImatges([{ ...TORRE_FITXER, amplada: 1200, alcada: 2400 }])).toEqual({ hero: null, avatar: null, reserva: null });
  });

  test('l’avatar és la foto més quadrada que no siga la panoràmica, mai un escut', () => {
    const escut = { ...quadrada, fitxer: 'Escut de la Torre.jpg', amplada: 1200, alcada: 1200, sha1: 'c'.repeat(40) };
    const tria = triaImatges([TORRE_FITXER, escut, quadrada]);
    expect(tria.hero.fitxer).toBe(TORRE_GRAN.fitxer);
    expect(tria.avatar.fitxer).toBe('Plaça Major.jpg');
  });

  test('la reserva és una altra apaïsada, amb un fitxer i un sha1 diferents', () => {
    const copia = { ...apaisada, fitxer: 'Còpia.jpg', sha1: TORRE_FITXER.sha1 };
    const p18 = TORRE_GRAN.fitxer;
    expect(triaImatges([TORRE_FITXER, copia], { p18 }).reserva).toBeNull();
    const tria = triaImatges([TORRE_FITXER, apaisada], { p18 });
    expect(tria.hero.fitxer).toBe(TORRE_GRAN.fitxer);
    expect(tria.reserva.fitxer).toBe('Vista del poble.jpg');
  });

  test('a igualtat de forma mana la foto de Wikidata (P18), encara que siga més menuda', () => {
    expect(triaImatges([apaisada, TORRE_FITXER], { p18: TORRE_GRAN.fitxer }).hero.fitxer).toBe(TORRE_GRAN.fitxer);
    expect(triaImatges([apaisada, TORRE_FITXER]).hero.fitxer).toBe('Vista del poble.jpg');
  });

  test('a Commons només es pregunta per fotos: ni l’escut (P94), ni mapes, ni logotips, ni SVG', () => {
    const torre = RECURSOS.article.traductor(captura('article-la-torre-de-les-macanes').body);
    const [entitatTorre] = RECURSOS.entitats.traductor(captura('entitats-la-torre-de-les-macanes').body);
    expect(candidatsDeFitxers({ ...entitatTorre, imatgePagina: torre.imatgePagina, fitxers: torre.fitxers }))
      .toEqual(['El riu251.jpg', 'Torre Gran (Torremanzanas) 3.jpg']);
    const sella = RECURSOS.article.traductor(captura('article-sella-marina-baixa').body);
    const [entitatSella] = RECURSOS.entitats.traductor(captura('entitats-sella').body);
    expect(candidatsDeFitxers({ ...entitatSella, imatgePagina: sella.imatgePagina, fitxers: sella.fitxers }))
      .toEqual(['Sella-Panorama.jpg', 'Ermita de Sella (restos del Castillo de Santa Bárbara) 3.jpg']);
    expect(candidatsDeFitxers({ insignies: ['Escut de Sella.jpg'], fitxers: ['Escut_de_Sella.jpg'] })).toEqual([]);
  });

  /* Regla del Mestre, confirmada el 261030: mai l'escut per als pobles ni per
     a «Gent de…» (Gent de la Torre inclosa); l'escut és sempre exclusiu de la
     institució Ajuntament. Dos guardes: el nom del fitxer (en valencià,
     castellà i anglés) i l'escut que Wikidata declara (P94), encara que el
     seu nom no ho diga. */
  test.each([
    'Escut de la Torre de les Maçanes.png', 'Escudo de Torremanzanas.jpg', 'Coat of arms of Sella.jpg',
    'Sella_coat_of_arms.png', 'escut_oficial_de_Relleu.webp',
    /* Gauntlet 261030, tancament (escut-p94-nomes-primera-declaracio) · També
       en les altres llengües de Commons, i amb «_» en lloc d'espai. */
    'Blasó de Poble.png', 'Wappen Poble.png', 'Poble CoA.png', 'Poble_CoA.png', 'Stemma di Poble.jpg',
    'Brasão de Poble.png', 'Herb Poble.png', 'Poble heràldica.png', 'Poble heraldica.png', 'Armoiries de Poble.jpg'
  ])('regla del Mestre: un escut pel nom ni es demana ni es pinta (%s)', (fitxer) => {
    expect(candidatsDeFitxers({ p18: fitxer, imatgePagina: fitxer, fitxers: [fitxer] })).toEqual([]);
    expect(esFotoValida({ ...TORRE_FITXER, fitxer })).toBe(false);
    expect(triaImatges([{ ...TORRE_FITXER, fitxer }])).toEqual({ hero: null, avatar: null, reserva: null });
  });

  test('regla del Mestre: l’escut de Wikidata (P94) no es demana encara que el nom no diga «escut», ni si P18 o la pàgina el repetixen', () => {
    const p94 = 'Torremanzanas.jpg';
    expect(candidatsDeFitxers({ p18: p94, insignies: [p94], imatgePagina: 'torremanzanas.jpg', fitxers: ['Torremanzanas.jpg', 'Torre_Gran.jpg'] }))
      .toEqual(['Torre Gran.jpg']);
  });

  /* Gauntlet 261030, tancament (escut-p94-nomes-primera-declaracio) · Un
     municipi pot declarar dos escuts (SVG i PNG, l'actual i l'històric): cap
     dels dos, ni la bandera, el segell o el logotip de l'Ajuntament. */
  test('regla del Mestre: cap de les insígnies que declara Wikidata es demana, no sols la primera', () => {
    // Cap d'estos noms no diu «escut»: només els para la declaració de Wikidata.
    const insignies = ['Poble oficial.svg', 'Poble oficial.png', 'Poble antic.jpg', 'Senyera de Poble.png', 'Ajuntament de Poble.png'];
    expect(candidatsDeFitxers({
      p18: 'Poble antic.jpg', insignies, imatgePagina: 'Poble_oficial.png',
      fitxers: ['Poble oficial.png', 'Senyera_de_Poble.png', 'ajuntament de Poble.png', 'Poble vista.jpg']
    })).toEqual(['Poble vista.jpg']);
    expect(candidatsDeFitxers({ fitxers: ['Poble oficial.png', 'Poble vista.jpg'] })).toEqual(['Poble oficial.png', 'Poble vista.jpg']);
    // Una sola insígnia en text pelat també val.
    expect(candidatsDeFitxers({ insignies: 'Poble antic.jpg', fitxers: ['Poble antic.jpg', 'Poble vista.jpg'] })).toEqual(['Poble vista.jpg']);
  });

  test.each([['P94', 'normal'], ['P94', 'deprecated'], ['P41', 'normal'], ['P158', 'normal'], ['P154', 'normal']])(
    'regla del Mestre: si Wikidata declara la foto de la Torre Gran com a %s (%s) a més de l’escut, ni es demana ni es pinta',
    async (propietat, rank) => {
      const { llig: base, peticions } = wikimediaFals(TORRE);
      const entitat = captura('entitats-la-torre-de-les-macanes').body.entities.Q1641908;
      const [model] = entitat.claims.P94;
      const insignia = {
        ...model, rank, mainsnak: { ...model.mainsnak, property: propietat, datavalue: { ...model.mainsnak.datavalue, value: TORRE_GRAN.fitxer } }
      };
      const claims = { ...entitat.claims, [propietat]: [...(entitat.claims[propietat] || []), insignia] };
      const llig = async (recurs, ...resta) => (recurs === 'entitats'
        ? RECURSOS.entitats.traductor({ entities: { Q1641908: { ...entitat, claims } } })
        : base(recurs, ...resta));
      const poble = await pobleDeViquipedia('La Torre de les Maçanes', { llig });
      expect(poble.author).toBe('Gent de la Torre de les Maçanes');
      expect(poble.wikidata_id).toBe('Q1641908');
      expect(poble.imatges).toEqual({ hero: null, avatar: null, reserva: null });
      const demanats = peticions.map(({ url }) => decodeURIComponent(url).replace(/_/g, ' '));
      expect(demanats.some((url) => url.includes(TORRE_GRAN.fitxer))).toBe(false);
    }
  );

  test('regla del Mestre: si Wikidata diu que l’escut és la mateixa foto de la Torre Gran, cap foto del poble (ni la de «Gent de la Torre») la porta, i no es demana', async () => {
    const { llig: base, peticions } = wikimediaFals(TORRE);
    const llig = async (recurs, ...resta) => {
      const valor = await base(recurs, ...resta);
      return recurs === 'entitats' ? valor.map((entitat) => ({ ...entitat, insignies: [TORRE_GRAN.fitxer] })) : valor;
    };
    const poble = await pobleDeViquipedia('La Torre de les Maçanes', { llig });
    expect(poble.author).toBe('Gent de la Torre de les Maçanes');
    expect(poble.imatges).toEqual({ hero: null, avatar: null, reserva: null });
    const demanats = peticions.map(({ url }) => decodeURIComponent(url).replace(/_/g, ' '));
    expect(demanats.some((url) => url.includes(TORRE_GRAN.fitxer))).toBe(false);
    // Sense l'escut declarat, la mateixa foto sí que és la panoràmica i l'avatar.
    const sense = await pobleDeViquipedia('La Torre de les Maçanes', { llig: base });
    expect([sense.imatges.hero.fitxer, sense.imatges.avatar.fitxer]).toEqual([TORRE_GRAN.fitxer, TORRE_GRAN.fitxer]);
  });

  test.each([
    ['CC BY-SA 3.0 es', true], ['CC BY 2.0', true], ['CC0', true], ['Public domain', true],
    ['CC BY-NC 2.0', false], ['CC BY-ND 4.0', false], ['GFDL', false], ['', false], [null, false]
  ])('llicència %s → lliure: %s', (llicencia, lliure) => {
    expect(esLlicenciaLliure(llicencia)).toBe(lliure);
  });
});

describe('on és el poble', () => {
  test('la província pel codi INE', () => {
    expect(provinciaDeIne('03132')).toBe('Alacant');
    expect(provinciaDeIne('12040')).toBe('Castelló');
    expect(provinciaDeIne('46250')).toBe('València');
    expect(provinciaDeIne('30030')).toBeNull();
    expect(provinciaDeIne('3132')).toBeNull();
  });

  test('la comarca i la província a partir de les etiquetes de P131', () => {
    expect(divisionsDe(RECURSOS.etiquetes.traductor(captura('etiquetes-la-torre-de-les-macanes').body)))
      .toEqual({ provincia: 'Alacant', comarca: 'L\'Alacantí' });
    expect(divisionsDe(null)).toEqual({ provincia: null, comarca: null });
  });

  test('dos municipis amb el mateix nom no s’endevinen: cal la província', () => {
    const [sella] = RECURSOS.entitats.traductor(captura('entitats-sella').body);
    const homonim = { ...sella, qid: 'Q1', ine: '46999' };
    expect(triaMunicipi([sella, homonim], 'Sella')).toBeNull();
    expect(triaMunicipi([sella, homonim], 'Sella', { provincia: 'Alicante' })).toBe(sella);
    expect(triaMunicipi([{ ...sella, esMunicipi: false }], 'Sella')).toBeNull();
    expect(triaMunicipi([sella], 'Relleu')).toBeNull();
  });
});
