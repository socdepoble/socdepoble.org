/* Onada R9 (carril C5; IDEA-112, IDEA-113 i IDEA-115) · Les consultes de llavors i rutes conserven les dades
   literals i les claus als 5 diccionaris. La font històrica d'arbres es contrasta amb el mateix corpus que
   alimenta la portada del llibre R18; el seu recorregut viu es prova a NaturaPatrimoniWorkspaceSection.r18.test.jsx. */
import { readFileSync } from 'node:fs';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';
import BancLlavorsSection from './BancLlavorsSection.jsx';
import RutesDePobleSection from './RutesDePobleSection.jsx';
import { ESPECIES_ATLES_CATALUNYA, FONTS_BANC_LLAVORS, VARIETATS_CATALEG_VALENCIA } from '../../data/patrimoni/bancLlavors.js';
import { PLANTILLA_RUTES_DE_POBLE, RUTES_LA_TORRE } from '../../data/patrimoni/rutesDePoble.js';
import { ARBRES_MONUMENTALS_LA_TORRE, FONT_ARBRES_MONUMENTALS } from '../../data/patrimoni/arbresMonumentals.js';
import { LLIBRES_ARBRES_MONUMENTALS } from '../../data/patrimoni/llibresArbresMonumentals.js';

const m = vi.hoisted(() => ({ dic: null }));
vi.mock('../../app/contexts/UIContext', async (orig) => ({
  ...(await orig()),
  useUIActions: () => ({ t: (clau, reserva) => (m.dic && Object.hasOwn(m.dic, clau) ? m.dic[clau] : reserva) })
}));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); m.dic = null; });

const FITXERS = ['BancLlavorsSection.jsx', 'RutesDePobleSection.jsx', 'EmpremtaFont.jsx'];
const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };

describe('/page/banc-de-llavors · BancLlavorsSection', () => {
  test('els tres catàlegs, amb l’autoria del document; la cerca filtra en local', () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const { container } = render(<BancLlavorsSection />);
    expect(screen.getByRole('status').textContent).toBe('45 de 45');
    expect(container.querySelectorAll('ol > li')).toHaveLength(24);
    fireEvent.click(screen.getByRole('button', { name: 'Mostra’n més' }));
    expect(container.querySelectorAll('ol > li')).toHaveLength(45);
    const opcions = within(screen.getByRole('combobox')).getAllByRole('option').map((o) => o.textContent);
    expect(opcions).toEqual(FONTS_BANC_LLAVORS.map((f) => `${f.autoria} · ${f.ambit}`));
    expect(opcions[1]).toBe('Associació de Varietats Locals (AVL), de Mallorca · Mallorca');
    expect(container.textContent).not.toMatch(/Acadèmia Valenciana de la Llengua/);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'quarentena' } });
    expect(screen.getByRole('status').textContent).toBe('1 de 45');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'no-hi-ha-res-aixi' } });
    expect(screen.getByText('No hi ha cap resultat amb esta cerca.')).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
    expect(container.querySelector('form, input:not([type=search]), textarea')).toBeNull();
  });

  test('la fitxa del Catàleg valencià es desplega in-situ (sense modal): barra de 12 mesos, nutrició, informació tècnica literal, nom de l’índex, pàgina i empremta', () => {
    render(<BancLlavorsSection />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'quarantena' } });
    fireEvent.click(screen.getByRole('button', { name: /Tomaca quarantena/ }));
    expect(screen.queryByRole('dialog')).toBeNull();
    const fitxa = screen.getByRole('region', { name: 'Tomaca quarantena' });
    const v = VARIETATS_CATALEG_VALENCIA.find((x) => x.nom === 'Tomaca quarantena');
    expect(within(fitxa).getByText('Pes mitjà del fruit: 180 – 220 g')).toBeTruthy();
    expect(within(fitxa).getByText('Tomaca quarentena')).toBeTruthy();
    expect(within(fitxa).getAllByRole('listitem').length).toBeGreaterThanOrEqual(12);
    expect(fitxa.textContent).toContain('18 kcal / 100 g');
    // Cap prosa sense font (fitonutrients, rebost, cuina).
    expect(fitxa.textContent).not.toMatch(/Licopè|Conservació al rebost|Cuina tradicional|fitonutrients/);
    // R9V-C5-10 · les pàgines són les del PDF (el número imprés pot ser un altre).
    expect(fitxa.textContent).toContain(`Pàgina ${v.pagina} del PDF`);
    expect(fitxa.textContent).toContain(FONTS_BANC_LLAVORS[0].sha256.slice(0, 8));
    expect(fitxa.textContent).toContain(`Document: ${FONTS_BANC_LLAVORS[0].document}`);
    expect(fitxa.textContent).not.toContain('no s’ha transcrit');
    // Els valors nutricionals diuen de quin registre de l'USDA són i que no venen de la font del catàleg.
    expect(within(fitxa).getByRole('heading', { name: 'Valors nutricionals de referència (per 100 g)' })).toBeTruthy();
    expect(fitxa.textContent).toContain('Valors de referència per 100 g: «Tomatoes, red, ripe, raw, year round average», USDA FoodData Central SR Legacy, FDC 170457; no són de la font del catàleg.');
    expect(fitxa.textContent).toContain('1,2 g de fibra · 94,52 g d’aigua');
    // La barra: dotze mesos G..D, la llegenda del PDF (p. 14: Sembra, Trasplantament, Recol·lecció, Maduració)
    // i, per al lector, les fases en paraules. La collita porta un símbol neutre.
    const barra = within(fitxa).getByRole('region', { name: 'Calendari dels 12 mesos' });
    const llegenda = [...barra.querySelectorAll('.sdp-barra-12-mesos__llegenda-item')].map((s) => s.textContent);
    expect(llegenda).toEqual(['🌱 Sembra', '🌿 Trasplantament', '🧺 Recol·lecció', '🌾 Maduració llavors']);
    expect(barra.textContent).not.toContain('🍆');
    const mesos = barra.querySelectorAll('.sdp-barra-12-mesos__mes');
    expect([...mesos].map((m) => m.querySelector('.sdp-barra-12-mesos__inicial').textContent).join('')).toBe('GFMAMJJASOND');
    for (const mes of mesos) expect(mes.getAttribute('aria-label')).toMatch(/^(Gener|Febrer|Març|Abril|Maig|Juny|Juliol|Agost|Setembre|Octubre|Novembre|Desembre): (repòs|(Sembra|Trasplantament|Recol·lecció|Maduració llavors)(, (Sembra|Trasplantament|Recol·lecció|Maduració llavors))*)$/);
    expect(mesos[11].getAttribute('aria-label')).toBe('Desembre: Sembra');
    expect(mesos[1].getAttribute('aria-label')).toBe('Febrer: Trasplantament');
    fireEvent.click(within(fitxa).getByRole('button', { name: 'Tancar' }));
    expect(screen.queryByRole('region', { name: 'Tomaca quarantena' })).toBeNull();
  });

  test('sense finestra: en obrir, el focus va al títol de la fitxa; en tancar, torna al botó de la llista', () => {
    render(<BancLlavorsSection />);
    const boto = screen.getByRole('button', { name: /Tomaca de pera/ });
    boto.focus();
    fireEvent.click(boto);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Tomaca de pera' }));
    fireEvent.click(within(screen.getByRole('region', { name: 'Tomaca de pera' })).getByRole('button', { name: 'Tancar' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Tomaca de pera/ }));
  });

  test('les varietats germanes (mateix nom científic de la font) canvien la fitxa sense tancar-la', () => {
    render(<BancLlavorsSection />);
    fireEvent.click(screen.getByRole('button', { name: /Albergínia blanca/ }));
    const grup = screen.getByRole('group', { name: 'Varietats de la mateixa espècie' });
    expect(within(grup).getAllByRole('button').map((b) => b.textContent)).toEqual(
      VARIETATS_CATALEG_VALENCIA.filter((v) => v.nomCientific === 'Solanum melongena L.').map((v) => v.nom)
    );
    expect(within(grup).getByRole('button', { name: 'Albergínia blanca' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(within(grup).getByRole('button', { name: 'Albergínia roja de Gandia' }));
    expect(screen.getByRole('region', { name: 'Albergínia roja de Gandia' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Albergínia blanca' })).toBeNull();
  });

  test('la nutrició només casa per l’espècie, i una espècie sense perfil no porta cap bloc ni cap excusa', () => {
    render(<BancLlavorsSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Mostra’n més' }));
    fireEvent.click(screen.getByRole('button', { name: /Cacau del collaret/ }));
    const cacau = screen.getByRole('region', { name: 'Cacau del collaret' });
    expect(within(cacau).queryByRole('region', { name: 'Valors nutricionals de referència (per 100 g)' })).toBeNull();
    expect(cacau.textContent).not.toMatch(/kcal|USDA/);
    fireEvent.click(within(cacau).getByRole('button', { name: 'Tancar' }));
    fireEvent.click(screen.getByRole('button', { name: /Bajoca de ferradura/ }));
    const bajoca = screen.getByRole('region', { name: 'Bajoca de ferradura' });
    expect(within(bajoca).queryByRole('region', { name: 'Valors nutricionals de referència (per 100 g)' })).toBeNull();
    expect(bajoca.textContent).not.toMatch(/kcal|USDA/);
  });

  test('la llegenda d’una fitxa de sembra directa és la del PDF: Sembra directa, sense Trasplantament', () => {
    render(<BancLlavorsSection />);
    fireEvent.click(screen.getByRole('button', { name: /Bajoca de ferradura/ }));
    const barra = within(screen.getByRole('region', { name: 'Bajoca de ferradura' })).getByRole('region', { name: 'Calendari dels 12 mesos' });
    const llegenda = [...barra.querySelectorAll('.sdp-barra-12-mesos__llegenda-item')].map((s) => s.textContent);
    expect(llegenda).toEqual(['🌱 Sembra directa', '🧺 Recol·lecció', '🌾 Maduració llavors']);
    expect(barra.querySelectorAll('.sdp-barra-12-mesos__mes')[2].getAttribute('aria-label')).toBe('Març: Sembra directa');
    // Les 11 fitxes de sembra directa del PDF (pàgines 18-23, 25, 26, 38, 40 i 48), i cap altra.
    expect(VARIETATS_CATALEG_VALENCIA.filter((v) => v.calendari?.sembraDirecta === true).map((v) => v.pagina))
      .toEqual([18, 19, 20, 21, 22, 23, 25, 26, 38, 40, 48]);
  });

  test('l’AVL i l’Atles es despleguen in-situ: origen, temporada i llistes literals', () => {
    render(<BancLlavorsSection />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'avl-mallorca' } });
    expect(screen.getByRole('status').textContent).toBe('65 de 65');
    expect(screen.getByRole('link', { name: 'www.varietatslocals.org' }).getAttribute('href')).toBe('https://www.varietatslocals.org');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'tomatiga mutxamel' } });
    fireEvent.click(screen.getByRole('button', { name: /Tomàtiga de Mutxamel/ }));
    let fitxa = screen.getByRole('region', { name: 'Tomàtiga de Mutxamel' });
    expect(fitxa.textContent).toContain('Son Juny, Sant Joan, Mallorca');
    expect(fitxa.textContent).toContain('Varietats d’estiu');
    // Sense calendari transcrit: cap barra i cap frase d'excusa. Solanum lycopersicum sí que té perfil.
    expect(within(fitxa).queryByRole('region', { name: 'Calendari dels 12 mesos' })).toBeNull();
    expect(fitxa.textContent).not.toContain('no s’ha transcrit');
    expect(fitxa.textContent).toContain('FDC 170457');
    fireEvent.click(within(fitxa).getByRole('button', { name: 'Tancar' }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'atles-catalunya' } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } });
    expect(screen.getByRole('status').textContent).toBe('15 de 15');
    fireEvent.click(screen.getByRole('button', { name: /^Pèsol/ }));
    fitxa = screen.getByRole('region', { name: 'Pèsol' });
    expect(within(fitxa).getByText('Pèsol de la floreta – pèsol de Llavaneres, pèsol garrofal')).toBeTruthy();
    expect(within(fitxa).queryByRole('region', { name: 'Calendari dels 12 mesos' })).toBeNull();
    expect(fitxa.textContent).not.toMatch(/no s’ha transcrit|kcal/);
  });

  test('l’Atles: la línia d’OCR que ajunta dues varietats es mostra partida i amb l’avís (R9V-C5-04)', () => {
    render(<BancLlavorsSection />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'atles-catalunya' } });
    fireEvent.click(screen.getByRole('button', { name: /^Pèsol/ }));
    const fitxa = screen.getByRole('region', { name: 'Pèsol' });
    const regio = within(fitxa).getByRole('region', { name: 'Varietats locals' });
    expect(within(regio).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Pèsol negre', 'Pèsol de la floreta']);
    // L'avís va just davall de la llista que s'ha partit.
    expect(regio.querySelector('ul + p')?.textContent).toContain('A la línia 453 del text extret del PDF hi ha 2 varietats juntes; el PDF (pàgina 59)');
    fireEvent.click(within(fitxa).getByRole('button', { name: 'Tancar' }));
    // Una espècie sense línies juntes no porta cap avís ni cap partició.
    fireEvent.click(screen.getByRole('button', { name: /^All · / }));
    const all = screen.getByRole('region', { name: 'All' });
    expect(within(within(all).getByRole('region', { name: 'Varietats locals' })).getAllByRole('listitem').map((li) => li.textContent)).toEqual(ESPECIES_ATLES_CATALUNYA[0].llista);
    expect(all.textContent).not.toContain('text extret del PDF');
  });

  test('la llengua de la font: no es diu «en valencià» d’un catàleg de Mallorca o de Catalunya (R9V-C5-03)', () => {
    const { container } = render(<BancLlavorsSection />);
    expect(container.textContent).toContain('El contingut documental es manté en la llengua de la font: no es traduïx.');
    expect(container.textContent).not.toMatch(/en valencià, com a la font/);
    for (const dic of Object.values(DICCIONARIS)) expect(dic['patrimoni.font.llengua']).not.toMatch(/valenci|Valencian|valentzi/i);
  });
});

describe('/page/rutes-de-poble · RutesDePobleSection', () => {
  test('la taula dels 6 itineraris i les parades de cada ruta', () => {
    const { container } = render(<RutesDePobleSection />);
    const files = within(screen.getByRole('region', { name: 'Resum dels itineraris' })).getAllByRole('row').slice(1);
    expect(files.map((f) => [...f.children].map((c) => c.textContent))).toEqual(RUTES_LA_TORRE.rutes.map((r) => [String(r.numero), r.eix, r.temps, r.distancia, String(r.parades.length)]));
    expect(container.querySelectorAll('article')).toHaveLength(6);
    expect(screen.getByRole('heading', { name: 'Ruta 6 · SOM PAISATGE' })).toBeTruthy();
    expect(container.textContent).toContain('11:00 · Excursió al Pou de la Neu. Es visitarà tant el paratge natural del Rentonar com el Pou de la Neu.');
    expect(container.textContent).toContain('Revisió 2021‐04‐28 17:46:27');
    expect(container.textContent).toContain('Durada: 4 h · Distància: 1,3 km · Pàgina 4 del PDF');
    expect(screen.getByRole('link', { name: 'gentdelatorre.net' }).getAttribute('href')).toBe(RUTES_LA_TORRE.font.web);
    expect(container.textContent).toContain(`Document: ${RUTES_LA_TORRE.font.document}`);
    expect(container.textContent).toContain(RUTES_LA_TORRE.font.sha256.slice(0, 8));
    expect(container.textContent).not.toMatch(/mas[ií]a/i);
    expect(container.textContent).not.toMatch(/\b\d{3} \d{2,3} \d{2,3}\b/);
  });

  test('una altra font en la mateixa forma es pinta igual (plantilla), sense cap dada de La Torre', () => {
    const conjunt = {
      ...RUTES_LA_TORRE, poble: 'Poble de prova',
      rutes: [{ ...RUTES_LA_TORRE.rutes[0], numero: 1, eix: 'EIX DE PROVA', parades: [{ hora: '09:00', titol: 'Parada de prova', explicacio: '', linies: [1, 1] }] }],
      recursos: []
    };
    const { container } = render(<RutesDePobleSection conjunt={conjunt} />);
    expect(screen.getByRole('heading', { name: 'Els itineraris de Poble de prova' })).toBeTruthy();
    expect(container.querySelectorAll('article')).toHaveLength(1);
    expect(container.textContent).not.toContain('SOM PAISATGE');
    expect(container.textContent).toContain('Ací només hi ha les dades d’este poble.');
    expect(container.textContent).not.toContain('dades de La Torre');
  });

  test('la plantilla buida i una font sense web ni empremta no peten ni inventen enllaços ni empremtes (R9V-C5-06)', () => {
    const buida = render(<RutesDePobleSection conjunt={{ ...PLANTILLA_RUTES_DE_POBLE, poble: 'Poble de prova' }} />);
    expect(screen.getByRole('heading', { name: 'Els itineraris de Poble de prova' })).toBeTruthy();
    expect(buida.container.querySelector('a, details, table, article')).toBeNull();
    buida.unmount();
    const font = { ...RUTES_LA_TORRE.font, web: '', sha256: '', document: '' };
    const { container } = render(<RutesDePobleSection conjunt={{ ...RUTES_LA_TORRE, font }} />);
    expect(container.querySelectorAll('article')).toHaveLength(6);
    expect(container.querySelector('a')).toBeNull();
    const resums = [...container.querySelectorAll('summary')].map((s) => s.textContent);
    expect(resums).toEqual(Array(6).fill('Programa d’activitats'));
    expect(container.textContent).toContain(`Revisió ${RUTES_LA_TORRE.font.revisio}`);
  });
});

describe('/page/arbres-monumentals · font documental reutilitzada pel llibre R18', () => {
  const corpus = JSON.parse(readFileSync(`${process.cwd()}/src/data/importacio/paginesTrilogiaIMoliWp.corpus.json`, 'utf8'));
  const pagina = corpus.find(item => item.id === FONT_ARBRES_MONUMENTALS.wpId);
  const cos = () => new DOMParser().parseFromString(pagina.contentHtml, 'text/html').body;

  test('els 19 noms i les dues marques monumentals conserven els enllaços literals de WordPress', () => {
    expect(pagina).toMatchObject({ id: FONT_ARBRES_MONUMENTALS.wpId, slug: FONT_ARBRES_MONUMENTALS.slug,
      title: FONT_ARBRES_MONUMENTALS.titol, date: FONT_ARBRES_MONUMENTALS.data, link: FONT_ARBRES_MONUMENTALS.enllac });
    expect(LLIBRES_ARBRES_MONUMENTALS[0].portada).toEqual({ wpId: pagina.id, slug: pagina.slug });
    expect(ARBRES_MONUMENTALS_LA_TORRE).toHaveLength(19);
    const anchors = [...cos().querySelectorAll('li a[href]')];
    for (const arbre of ARBRES_MONUMENTALS_LA_TORRE) {
      const anchor = anchors.find(item => item.getAttribute('href') === arbre.enllac);
      expect(anchor, arbre.nom).toBeTruthy();
      expect(anchor.textContent).toBe(arbre.nom);
      expect(anchor.closest('li').textContent.includes('(Monumental)')).toBe(arbre.monumental);
      expect(Object.keys(arbre).sort()).toEqual(['enllac', 'id', 'liniaText', 'monumental', 'nom', 'ordre']);
    }
  });

  test('la data de 2017, l’autoria i la consideració de protecció mantenen l’ordre de la font (R9V-C5-02)', () => {
    const normalitza = text => text.replace(/\s+/g, ' ').trim();
    const text = normalitza(cos().textContent);
    let anterior = -1;
    for (const clau of ['actualitzacio', 'deuAnys', 'senseBioleg', 'autoria', 'ordenanca']) {
      const index = text.indexOf(normalitza(FONT_ARBRES_MONUMENTALS.paragrafs[clau]));
      expect(index, clau).toBeGreaterThan(anterior);
      anterior = index;
    }
    const c = FONT_ARBRES_MONUMENTALS.cites;
    expect([c.actualitzacio, c.deuAnys, c.senseBioleg, c.autoria, c.ordenanca]).toEqual([1, 3, 7, 23, 25]);
    expect(FONT_ARBRES_MONUMENTALS.paragrafs.ordenanca).toContain('Considerem');
    expect(FONT_ARBRES_MONUMENTALS.paragrafs.ordenanca).toContain('en vigor des de l’any 2005');
  });
});

/* G1-07 i G1-08 (Gauntlet de l'arbre R9) · L'encapçalament dels arbres no afirma cap protecció (la font en fa una
   consideració), i el programa de 2021 de les rutes porta una nota que diu que no és cap oferta vigent. */
describe('Gauntlet R9 · G1-07 i G1-08', () => {
  test('arbres: «quina protecció hi cita» en les 5 llengües, mai «què el protegix»', () => {
    const esperat = { ca: 'Qui l’ha fet i quina protecció hi cita', es: 'Quién lo hizo y qué protección cita', en: 'Who made it and which protection it cites', eu: 'Nork egin zuen eta zer babes aipatzen duen', gl: 'Quen o fixo e que protección cita' };
    for (const [llengua, dic] of Object.entries(DICCIONARIS)) {
      expect(dic['patrimoni.arbres.qui'], llengua).toBe(esperat[llengua]);
      expect(dic['patrimoni.arbres.qui'], llengua).not.toMatch(/protegix|protege\b|protects|babesten|protexe/);
    }
  });

  test('rutes: la nota de vigència va davall del resum, una sola vegada, amb l’editor i l’any de la font', () => {
    const { container } = render(<RutesDePobleSection />);
    const nota = 'Programa publicat per Gent de La Torre el 2021: no és cap oferta vigent i ací no es reserva res.';
    const notes = [...container.querySelectorAll('p')].filter((p) => p.textContent === nota);
    expect(notes).toHaveLength(1);
    expect(notes[0].previousElementSibling).toBe(screen.getByRole('region', { name: 'Resum dels itineraris' }));
    expect(notes[0].nextElementSibling.tagName).toBe('ARTICLE');
    expect(RUTES_LA_TORRE.font.editor.startsWith('Gent de La Torre · ')).toBe(true);
    expect(RUTES_LA_TORRE.font.revisio.startsWith('2021')).toBe(true);
  });

  test('rutes: la nota en castellà, i cap nota sense font o sense rutes', () => {
    m.dic = ES;
    const es = render(<RutesDePobleSection />);
    expect(es.container.textContent).toContain('Programa publicado por Gent de La Torre en 2021: no es ninguna oferta vigente y aquí no se reserva nada.');
    es.unmount();
    m.dic = null;
    const buida = render(<RutesDePobleSection conjunt={{ ...PLANTILLA_RUTES_DE_POBLE, poble: 'Poble de prova' }} />);
    expect(buida.container.textContent).not.toContain('oferta vigent');
    buida.unmount();
    const senseData = render(<RutesDePobleSection conjunt={{ ...RUTES_LA_TORRE, font: { ...RUTES_LA_TORRE.font, revisio: '' } }} />);
    expect(senseData.container.textContent).not.toContain('oferta vigent');
  });

  /* FAV-03 · El text de la nota, literal en les 5 llengües (com el títol dels arbres), i pintat amb l'editor
     i l'any de la font: cap llengua no pot dir que el programa és vigent o que ací es reserva. */
  const VIGENCIA = {
    ca: 'Programa publicat per {editor} el {any}: no és cap oferta vigent i ací no es reserva res.',
    es: 'Programa publicado por {editor} en {any}: no es ninguna oferta vigente y aquí no se reserva nada.',
    en: 'Programme published by {editor} in {any}: it is not a current offer and nothing can be booked here.',
    eu: '{editor} taldeak {any}. urtean argitaratu zuen programa da: ez da indarreko eskaintza bat, eta hemen ez da ezer erreserbatzen.',
    gl: 'Programa publicado por {editor} en {any}: non é ningunha oferta vixente e aquí non se reserva nada.'
  };

  test.each(Object.keys(VIGENCIA))('%s · la nota de vigència, literal i pintada una sola vegada', (llengua) => {
    expect(DICCIONARIS[llengua]['patrimoni.rutes.vigencia']).toBe(VIGENCIA[llengua]);
    m.dic = DICCIONARIS[llengua];
    const { container } = render(<RutesDePobleSection />);
    const nota = VIGENCIA[llengua].replace('{editor}', 'Gent de La Torre').replace('{any}', '2021');
    expect([...container.querySelectorAll('p')].filter((p) => p.textContent === nota)).toHaveLength(1);
  });

  test('amb editor i revisió però sense cap ruta, no hi ha nota de vigència', () => {
    const { container } = render(<RutesDePobleSection conjunt={{ ...RUTES_LA_TORRE, rutes: [] }} />);
    expect(container.textContent).toContain(RUTES_LA_TORRE.font.editor);
    expect(container.textContent).toContain(`Revisió ${RUTES_LA_TORRE.font.revisio}`);
    expect(container.textContent).not.toContain('oferta vigent');
    expect(container.querySelectorAll('article')).toHaveLength(0);
  });
});

describe('les claus de la interfície', () => {
  const usades = new Set();
  for (const fitxer of FITXERS) {
    const text = readFileSync(`${process.cwd()}/src/sections/patrimoni/${fitxer}`, 'utf8');
    for (const [, clau] of text.matchAll(/tr\('([\w.-]+)'/g)) usades.add(clau);
  }
  test('cada clau usada és als 5 diccionaris, amb text no buit', () => {
    expect(usades.size).toBeGreaterThan(30);
    for (const [llengua, dic] of Object.entries(DICCIONARIS)) {
      for (const clau of usades) expect(typeof dic[clau] === 'string' && dic[clau].trim().length > 0, `${llengua}: ${clau}`).toBe(true);
    }
  });
  test('en castellà, la interfície canvia i les dades documentals no es traduïxen', () => {
    m.dic = ES;
    const { container } = render(<RutesDePobleSection />);
    expect(screen.getByRole('region', { name: 'Resumen de los itinerarios' })).toBeTruthy();
    expect(container.textContent).toContain('Duración');
    expect(container.textContent).toContain('SOM PA, SOM OLI');
    expect(container.querySelector('ol[lang="ca"]')).toBeTruthy();
  });
});
