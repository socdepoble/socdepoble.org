/**
 * Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4: «els
 * sis paràgrafs només són per al Rebost i Salut») · La presentació llarga de
 * la pàgina d'un plugin (presentacioPlugins.js): sis paràgrafs per al Rebost
 * i per a Salut, i null per a la resta del registre.
 * Ordre del Mestre (261021, prompt 261021_0015, tasca 6; pla §7.3) · Cada
 * paràgraf porta davant el seu títol <h3>: el cos comença en H3
 * (sdp-universal-page §1.E.4, core-llegibilitat-text §2), i els paràgrafs no
 * canvien.
 *
 * El que fixa:
 *   · la forma: una cadena per plugin, sis blocs (un <h3> sense punt final i
 *     el seu <p>, un element per línia), només <h3>, <p> i <strong>, cap
 *     altre encapçalament (l'H1 i l'H2 són els del registre) i cap atribut;
 *   · que el sanejador de les pàgines de text no en lleva res: el que
 *     s'escriu és el que es pinta;
 *   · que els literals que el text cita entre cometes són els que pinta
 *     l'app (llegits de la font de src/apps/nevera i src/apps/salut): si
 *     l'app en canvia un, esta prova cau i el text es canvia amb ell;
 *   · que el text de Salut no diu res que l'avís de l'app no diga: ni un nom
 *     de malaltia, ni un consell, ni una xifra que no siga el 112.
 * Com es pinta a la pàgina (CosDeLaPagina, entre l'entradilla i el botó) ho
 * prova PluginPage.test.jsx.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { sanitizeHtml } from '../../utils/sanitize';
import { PRESENTACIO_PLUGINS, presentacioDelPlugin } from './presentacioPlugins.js';
import { IDS_PLUGINS, pluginPerId } from './registrePlugins.js';

const AMB_PRESENTACIO = ['rebost', 'salut'];
const font = (ruta) => readFileSync(path.join(process.cwd(), ruta), 'utf8');
/* Els elements d'una presentació: un per línia, cada <h3> davant del seu <p>. */
const linies = (html) => html.split('\n');
/* Només els paràgrafs (261021, tasca 6): paragrafs(salut)[1] continua sent el de «Avui». */
const paragrafs = (html) => linies(html).filter((linia) => linia.startsWith('<p>'));
const senseMarques = (html) => html.replace(/<[^>]+>/g, '');
/* El text dels títols H3 d'una presentació, en ordre. */
const titols = (html) => linies(html).filter((linia) => linia.startsWith('<h3>')).map(senseMarques);
/* Els noms de totes les marques d'un HTML, d'obertura i de tancament. */
const marques = (html) => [...html.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)/g)].map(([, nom]) => nom.toLowerCase());

describe('presentació dels plugins', () => {
  test('només el Rebost i Salut en tenen, i tots dos són del registre', () => {
    expect(Object.isFrozen(PRESENTACIO_PLUGINS)).toBe(true);
    expect(Object.keys(PRESENTACIO_PLUGINS)).toEqual(AMB_PRESENTACIO);
    for (const id of AMB_PRESENTACIO) {
      expect([id, IDS_PLUGINS.includes(id), typeof PRESENTACIO_PLUGINS[id]]).toEqual([id, true, 'string']);
    }
  });

  test('presentacioDelPlugin: l’HTML del Rebost i de Salut, i null per a la resta', () => {
    for (const id of AMB_PRESENTACIO) expect([id, presentacioDelPlugin(id)]).toEqual([id, PRESENTACIO_PLUGINS[id]]);
    for (const id of IDS_PLUGINS.filter((un) => !AMB_PRESENTACIO.includes(un))) {
      expect([id, presentacioDelPlugin(id)]).toEqual([id, null]);
    }
    // Només claus pròpies: res heretat d'Object, ni un id que no és text.
    for (const res of ['', 'constructor', '__proto__', 'toString', 'hasOwnProperty', 'Rebost', 'rebost/', 'consola', null, undefined, 3, ['rebost']]) {
      expect([String(res), presentacioDelPlugin(res)]).toEqual([String(res), null]);
    }
  });

  test.each(AMB_PRESENTACIO)('%s: sis blocs (un <h3> i el seu <p>), només h3, p i strong, cap altre encapçalament i cap atribut', (id) => {
    const html = presentacioDelPlugin(id);
    const plugin = pluginPerId(id);
    // Ordre del Mestre (261021, prompt 261021_0015, tasca 6) · El cos comença en H3 i alterna títol i paràgraf.
    expect(html).toMatch(/^<h3>/);
    expect(linies(html)).toHaveLength(12);
    for (const [index, linia] of linies(html).entries()) {
      const forma = index % 2 === 0 ? /^<h3>[^<]+<\/h3>$/ : /^<p>.+<\/p>$/;
      expect([index, forma.test(linia)]).toEqual([index, true]);
    }
    expect(paragrafs(html)).toHaveLength(6);
    for (const [index, paragraf] of paragrafs(html).entries()) {
      expect([index, /^<p>.+<\/p>$/.test(paragraf)]).toEqual([index, true]);
      // Un sol <p> per línia, i les negretes ben tancades.
      expect([index, paragraf.split('<p>').length - 1, paragraf.split('</p>').length - 1]).toEqual([index, 1, 1]);
      expect([index, paragraf.split('<strong>').length]).toEqual([index, paragraf.split('</strong>').length]);
      expect([index, senseMarques(paragraf).trim().length > 0]).toEqual([index, true]);
    }
    // Sis títols, tots distints, sense espais sobrers ni punt final, i cap repetix l'H1 ni l'H2 del registre.
    expect(titols(html)).toHaveLength(6);
    expect(new Set(titols(html)).size).toBe(6);
    for (const titol of titols(html)) {
      expect([titol, titol.length > 0, titol === titol.trim(), titol.endsWith('.')]).toEqual([titol, true, true, false]);
      expect([titol, titol === plugin.titol, titol === plugin.subtitol]).toEqual([titol, false, false]);
    }
    expect(html.split('<p>').length - 1).toBe(6);
    expect(html.split('<h3>').length - 1).toBe(6);
    expect([...new Set(marques(html))].sort()).toEqual(['h3', 'p', 'strong']);
    // Cap altre encapçalament. Escrit com a classe [124-6]: design_guard llig els literals de capçalera de qualsevol .js.
    expect(html).not.toMatch(/<h[124-6]\b/i);
    // Cap atribut (ni classe, ni estil, ni enllaç): totes les marques són nues.
    expect(html.match(/<[^>]+>/g).filter((marca) => !/^<\/?(?:h3|p|strong)>$/.test(marca))).toEqual([]);
    // Cap entitat: el text pla que es llig és el que hi ha escrit.
    expect(html).not.toMatch(/&[a-z#0-9]+;/i);
  });

  test.each(AMB_PRESENTACIO)('%s: el sanejador de les pàgines de text no en lleva ni en canvia res', (id) => {
    const html = presentacioDelPlugin(id);
    expect(sanitizeHtml(html)).toBe(html);
  });

  test.each(AMB_PRESENTACIO)('%s: diu el nom de l’eina i el del seu botó, els del registre', (id) => {
    const text = senseMarques(presentacioDelPlugin(id));
    const plugin = pluginPerId(id);
    expect(text).toContain(plugin.titol);
    expect(text).toContain(`«${plugin.etiquetaObrir}»`);
    // I diu, honestament, que encara està en proves i que el botó pot no fer res.
    expect(text).toContain('en proves');
    expect(text).toMatch(/el botó «[^»]+» (?:t’hi porta; si no, el botó )?no fa res/);
  });
});

/* Els literals que el text cita entre cometes són els que pinta l'app. Es
   lligen de la font (text), sense muntar cap app: [literal, fitxer, com hi
   apareix escrit]. */
describe('els literals citats són els de l’app', () => {
  const NEVERA = 'src/apps/nevera';
  const SALUT = 'src/apps/salut';
  const CITES = {
    rebost: [
      ['N’hi ha', `${NEVERA}/vistes/vestits.js`, "'hi-ha': 'N’hi ha'"],
      ['Se n’acaba', `${NEVERA}/vistes/vestits.js`, "'se-n-acaba': 'Se n’acaba'"],
      ['S’ha acabat', `${NEVERA}/vistes/vestits.js`, "acabat: 'S’ha acabat'"],
      ['El que tens a casa', `${NEVERA}/vistes/Casa.jsx`, "nom: 'El que tens a casa'"],
      ['No el seguisques', `${NEVERA}/vistes/Casa.jsx`, "etiqueta: 'No el seguisques'"],
      ['Cal comprar', `${NEVERA}/vistes/Casa.jsx`, 'titol="Cal comprar"'],
      ['Afig-ho tot', `${NEVERA}/vistes/Casa.jsx`, "text: 'Afig-ho tot'"],
      ['La compra', `${NEVERA}/manifest.js`, "ca: 'La compra'"]
    ],
    salut: [
      ['Avui', `${SALUT}/manifest.js`, "ca: 'Avui'"],
      ['Full per al metge', `${SALUT}/manifest.js`, "ca: 'Full per al metge'"],
      ['Resum i avisos', `${SALUT}/manifest.js`, "ca: 'Resum i avisos'"],
      ['He apuntat tot el dia', `${SALUT}/vistes/Diari.jsx`, 'etiqueta="He apuntat tot el dia"'],
      ['Ho he entés', `${SALUT}/vistes/Ajustos.jsx`, '>Ho he entés</Boto>'],
      ['parla-ho amb el metge', `${SALUT}/textos.js`, '«parla-ho amb el metge»'],
      ['truca al 112', `${SALUT}/textos.js`, '«truca al 112»']
    ]
  };

  test.each(Object.entries(CITES).flatMap(([id, cites]) => cites.map((cita) => [id, ...cita])))(
    '%s cita «%s», que és a %s', (id, literal, fitxer, comHiEs) => {
      expect(senseMarques(presentacioDelPlugin(id))).toContain(`«${literal}»`);
      expect(font(fitxer)).toContain(comHiEs);
    }
  );

  test('rebost: «Ajustos» és una entrada de la Nevera, i la còpia es descarrega i es recupera allí', () => {
    expect(presentacioDelPlugin('rebost')).toContain('a <strong>Ajustos</strong> pots <strong>descarregar una còpia</strong> i recuperar-la');
    expect(font('src/apps/nevera/manifest.js')).toContain("ca: 'Ajustos'");
    const ajustos = font('src/apps/nevera/vistes/Ajustos.jsx');
    expect(ajustos).toContain('>Descarrega una còpia</Boto>');
    expect(ajustos).toContain('etiqueta="Recupera una còpia"');
  });

  test('rebost: gratuïta, sense dades personals i en proves, com diu el manifest de la Nevera', () => {
    const manifest = font('src/apps/nevera/manifest.js');
    expect(manifest).toContain("nivell: 'gratuit'");
    expect(manifest).toContain('dadesPersonals: false');
    expect(manifest).toContain("entorn: 'desenvolupament'");
    const text = senseMarques(presentacioDelPlugin('rebost'));
    expect(text).toContain('És gratuïta, no demana cap dada personal');
    expect(text).toContain('l’eina no fa cap crida a internet');
  });

  /* Els nou botons d'apunt de la pantalla «Avui»: el text els cita TOTS, amb
     el nom del camp `boto` del diccionari de Salut, i cap que no hi siga. */
  test('salut: els botons d’apunt citats són exactament els del diccionari de l’app', () => {
    const botons = [...font('src/apps/salut/nucli/diccionari.js').matchAll(/\bboto: '([^']+)'/g)].map(([, nom]) => nom);
    expect(botons).toHaveLength(9);
    const segon = senseMarques(paragrafs(presentacioDelPlugin('salut'))[1]);
    const citats = [...segon.matchAll(/«([^»]+)»/g)].map(([, nom]) => nom);
    expect(citats[0]).toBe('Avui');
    expect([...citats.slice(1)].sort()).toEqual([...botons].sort());
  });

  test('salut: el mode nit existix a la pantalla d’apuntar', () => {
    expect(senseMarques(presentacioDelPlugin('salut'))).toContain('Hi ha un mode nit');
    expect(font('src/apps/salut/vistes/Diari.jsx')).toMatch(/^\s*Mode nit$/m);
  });
});

/* Cap consell mèdic i cap promesa. El text de Salut diu el mateix que l'avís
   de l'app (apps/salut/textos.js), que és un esborrany pendent de la revisió
   del Mestre i, idealment, d'algú de salut. Açò no substituïx eixa revisió:
   només vigila que no s'hi cole el que l'avís prohibix. */
describe('salut: el text no promet ni aconsella', () => {
  const text = senseMarques(PRESENTACIO_PLUGINS.salut);

  test('diu què no és, amb les paraules de l’avís de l’app', () => {
    const avis = font('src/apps/salut/textos.js');
    for (const frase of ['No és un producte sanitari', 'no diu què li passa a ningú', 'no recomana tractaments ni quantitats de medicació',
      'no vol dir que tot vaja bé']) {
      expect([frase, text.includes(frase), avis.includes(frase)]).toEqual([frase, true, true]);
    }
  });

  test('on van les dades: el mateix que diu l’avís', () => {
    const avis = font('src/apps/salut/textos.js');
    expect(text).toContain('No s’envien a Sóc de Poble, ni a cap servidor, ni a cap intel·ligència artificial.');
    expect(avis).toContain('No s’envien a Sóc de Poble, ni a cap servidor, ni a cap intel·ligència artificial.');
    expect(text).toContain('es queden en este dispositiu, dins d’este navegador');
    expect(avis).toContain('Es queden en este dispositiu, dins d’este navegador');
  });

  test('cap xifra que no siga el 112, i cap paraula de diagnòstic, de dosi ni de garantia', () => {
    expect(text.replace(/\b112\b/g, '')).not.toMatch(/\d/);
    expect(text).not.toMatch(/diagn[oò]stic|infecci|dem[eè]nci|malalti|\bdosi\b|mil·lilitres|\bml\b|garanti/i);
  });

  test('el Rebost tampoc porta cap xifra', () => {
    expect(senseMarques(PRESENTACIO_PLUGINS.rebost)).not.toMatch(/\d/);
  });
});
