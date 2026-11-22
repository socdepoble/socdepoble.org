/* Atles 2D (ordre del Mestre del 21-11-2026 a les 23:28; pla 261121_2335, Carril 1, Tram 1, punts a i b) ·
   Les cinc pàgines de l'Atles a /disseny?categoria=atles-2d: es munten, pinten les xifres que diuen les dades
   (recomptades de dades/atles2dDades.js, mai escrites a mà a la prova) i els filtres filtren. També fixa el que
   no han de fer: cap H1 nou, cap petició de xarxa, cap camí absolut del disc ni cap paraula vetada. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import { normalizeSearchText } from '../../../../config/contentHelpers.js';
import { ATLES, ORIGEN_ATLES } from '../dades/atles2dDades.js';
import { rutaEspecimen } from '../manifest.js';
import EspecimenAtles2dPresentacio from './EspecimenAtles2dPresentacio.jsx';
import EspecimenAtles2dPobleVirtual from './EspecimenAtles2dPobleVirtual.jsx';
import EspecimenAtles2dXarxesMon from './EspecimenAtles2dXarxesMon.jsx';
import EspecimenAtles2dMapaEntitats from './EspecimenAtles2dMapaEntitats.jsx';
import EspecimenAtles2dMotorEstudis from './EspecimenAtles2dMotorEstudis.jsx';
import { dataDeVerificacio, nomsDEntitat, textDeCerca } from './atles2dComu.jsx';

const ARREL = process.cwd();
const compta = (llista, clau) => llista.reduce((r, x) => ({ ...r, [x[clau]]: (r[x[clau]] || 0) + 1 }), {});
const { placa, xarxes, entitats } = ATLES;
const CELLES = entitats.files.flatMap((fila) => entitats.entitats.map((e) => fila.cel_les[e.id]));
const munta = (Pagina) => render(<MemoryRouter rutaInicial="/disseny"><Pagina /></MemoryRouter>);
const ATLES_TITOL = Object.freeze({
  'atles-2d-poble-virtual': '1. El poble virtual (Assaig a la Plaça)',
  'atles-2d-xarxes-mon': '2. Xarxes del món (Orkut i 11 referents rurals)',
  'atles-2d-mapa-entitats': '3. Mapa 2D de les 5 entitats (60 cel·les)',
  'atles-2d-motor-estudis': '4. Motor d’estudis de mercat (Proposta funcional)'
});
const recompte = (container) => container.querySelector('.sdp-atles__recompte[aria-live="polite"]').textContent;
/* v1.2.19 · Gauntlet R2 (L4R2-04) · La data de les dades, recomptada ací a banda de les pàgines: «21-11-2026 a les 19:34». */
const DATA_DADES = ATLES.meta.generat.replace(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}).*$/, '$3-$2-$1 a les $4');
const VERSIO_CURTA = ATLES.meta.versio_codi.split(' ·')[0];
const datacio = (container) => container.querySelector('.sdp-atles__datacio');

let fetchEspia;
beforeEach(() => {
  fetchEspia = vi.fn(() => Promise.reject(new Error('cap petició de xarxa')));
  vi.stubGlobal('fetch', fetchEspia);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('les dades de l’Atles (dades/atles2dDades.js)', () => {
  test('porten l’origen amb el SHA-256 i conserven els recomptes de la maqueta', () => {
    expect(ORIGEN_ATLES.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(readFileSync(path.join(ARREL, 'src/sections/disseny/cataleg/dades/atles2dDades.js'), 'utf8')).toContain(ORIGEN_ATLES.sha256);
    expect([placa.rondes.length, placa.perfils.length, placa.dolors.length, ATLES.contradiccions.length]).toEqual([6, 15, 61, 15]);
    expect([xarxes.length, entitats.files.length, entitats.entitats.length, CELLES.length]).toEqual([12, 12, 5, 60]);
    expect(compta(CELLES, 'estat')).toEqual({
      fet: entitats.resum.fet, a_mitges: entitats.resum.a_mitges, falta: entitats.resum.falta, no_aplica: entitats.resum.no_aplica
    });
    expect(CELLES.filter((c) => c.estat_gemini && c.estat_gemini !== c.estat)).toHaveLength(entitats.resum.canvis_respecte_gemini);
  });

  test('no publiquen cap directori personal, cap camí del worktree ni cap paraula vetada', () => {
    const text = JSON.stringify(ATLES);
    expect(text).not.toMatch(/\/Users\//);
    expect(text).not.toMatch(/_builds_de_poble\/sandboxes_r26/);
    expect(text.toLowerCase()).not.toContain(['ma', 'sia'].join(''));
  });

  test('només les importen les pàgines de l’Atles: ni el manifest ni el registre de carregadors', () => {
    for (const fitxer of ['src/sections/disseny/cataleg/manifest.js', 'src/sections/disseny/cataleg/detailRegistry.jsx', 'src/sections/disseny/DesignSection.jsx']) {
      expect(readFileSync(path.join(ARREL, fitxer), 'utf8'), fitxer).not.toMatch(/import[^;]*atles2dDades/);
    }
    const registre = readFileSync(path.join(ARREL, 'src/sections/disseny/cataleg/detailRegistry.jsx'), 'utf8');
    for (const pagina of ['Presentacio', 'PobleVirtual', 'XarxesMon', 'MapaEntitats', 'MotorEstudis']) {
      expect(registre).toContain(`lazyRoute(() => import('./detalls/EspecimenAtles2d${pagina}.jsx'))`);
    }
  });
});

describe('Presentació i marc comú', () => {
  test('l’avís d’Orkut, les quatre xifres globals i les quatre targetes que porten a cada pàgina', () => {
    const { container } = munta(EspecimenAtles2dPresentacio);
    expect(container.querySelector('h1')).toBeNull();
    expect(screen.getByRole('note').textContent).toContain('Orkut continua congelat al codi.');
    const xifres = within(screen.getByRole('list', { name: 'Les quatre xifres de l’Atles' })).getAllByRole('listitem');
    expect(xifres.map((li) => li.querySelector('.sdp-atles__xifra-n').textContent)).toEqual([
      String(placa.dolors.length), String(placa.perfils.length), String(xarxes.length), `${entitats.resum.fet} / ${CELLES.length}`
    ]);
    const perEstat = compta(placa.dolors, 'estat');
    expect(xifres[0].textContent).toContain(`${perEstat.resolt} resolts · ${perEstat.en_kit} en kit · ${perEstat.decisio_mestre} per decidir · ${perEstat.obert} oberts`);
    expect(xifres[2].textContent).toContain('Orkut, 9,6 / 10');
    for (const id of ['atles-2d-poble-virtual', 'atles-2d-xarxes-mon', 'atles-2d-mapa-entitats', 'atles-2d-motor-estudis']) {
      /* Sense selector d'atribut: el motor de selectors de jsdom no casa bé un href amb «?» i «&». */
      const enllac = [...container.querySelectorAll('a')].find((a) => a.getAttribute('href') === rutaEspecimen(id));
      expect(enllac, id).toBeTruthy();
      expect(enllac.textContent).toContain(ATLES_TITOL[id]);
      expect(rutaEspecimen(id)).toBe(`/disseny?categoria=atles-2d&item=${id}`);
    }
    expect(screen.getByText(ORIGEN_ATLES.sha256)).toBeTruthy();
    expect(screen.getByText(`Les ${placa.fonts_llegides.length} fonts llegides per a la vista del poble virtual`)).toBeTruthy();
  });

  /* v1.2.19 · Gauntlet R2 (L4R2-04) · Llei 0: les dades són d'un dia i d'una versió, i la pàgina ho diu a dalt. */
  test('una nota a la vista diu de quina data i de quina versió del codi són les dades', () => {
    expect(DATA_DADES).toMatch(/^\d{2}-\d{2}-\d{4} a les \d{2}:\d{2}$/);
    const { container } = munta(EspecimenAtles2dPresentacio);
    const nota = datacio(container);
    expect(nota).not.toBeNull();
    expect(nota.closest('section').querySelector('h2').id).toBe('atles-presentacio-obertura');
    expect(nota.textContent).toContain(`Fotografia del ${DATA_DADES}, contra el codi ${ATLES.meta.versio_codi}.`);
    expect(nota.textContent).toContain('no es veu ací fins que algú pose al dia les dades');
  });
});

describe('1. El poble virtual', () => {
  test('pinta les rondes, els veïns i tots els dolors, i els filtres filtren', () => {
    const { container } = munta(EspecimenAtles2dPobleVirtual);
    expect(container.querySelector('h1')).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: `Les ${placa.rondes.length} rondes, en ordre` })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: `Els ${placa.perfils.length} veïns` })).toBeTruthy();
    expect(recompte(container)).toBe(`${placa.dolors.length} de ${placa.dolors.length} dolors`);
    expect(screen.getByRole('img', { name: /^Dolors per estat: / }).getAttribute('aria-label'))
      .toContain(`${compta(placa.dolors, 'estat').resolt} Resolt`);

    const obert = placa.dolors.filter((d) => d.estat === 'obert');
    fireEvent.click(within(screen.getByRole('group', { name: 'Estat' })).getByRole('button', { name: /Obert/ }));
    expect(recompte(container)).toBe(`${obert.length} de ${placa.dolors.length} dolors`);
    fireEvent.click(within(screen.getByRole('group', { name: 'Gravetat' })).getByRole('button', { name: 'P0' }));
    expect(recompte(container)).toBe(`${obert.filter((d) => d.severitat === 'P0').length} de ${placa.dolors.length} dolors`);

    fireEvent.click(screen.getByRole('button', { name: 'Lleva els filtres' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Ronda' }), { target: { value: 'R04' } });
    expect(recompte(container)).toBe(`${placa.dolors.filter((d) => d.ronda === 'R04').length} de ${placa.dolors.length} dolors`);

    fireEvent.click(screen.getByRole('button', { name: 'Lleva els filtres' }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Busca' }), { target: { value: 'DOL-14' } });
    expect(recompte(container)).toBe(`1 de ${placa.dolors.length} dolors`);
    expect(screen.getByRole('heading', { level: 3, name: placa.dolors.find((d) => d.id === 'DOL-14').titol })).toBeTruthy();
  });

  test('«Vore els seus dolors» tria el veí al selector i deixa només els seus', () => {
    const { container } = munta(EspecimenAtles2dPobleVirtual);
    const pepa = placa.dolors.filter((d) => d.perfils.includes('pepa'));
    const fitxaPepa = screen.getByRole('heading', { level: 3, name: /^Pepa,/ }).closest('li');
    fireEvent.click(within(fitxaPepa).getByRole('button', { name: `Vore els seus dolors (${pepa.length})` }));
    expect(screen.getByRole('combobox', { name: 'Veí' }).value).toBe('pepa');
    expect(recompte(container)).toBe(`${pepa.length} de ${placa.dolors.length} dolors`);
    expect(screen.getByRole('heading', { level: 3, name: /^Pepa,/ }).closest('li').getAttribute('aria-current')).toBe('true');
  });

  test('el número del botó és el que es veu: «Vore els seus dolors» lleva la resta de filtres', () => {
    const { container } = munta(EspecimenAtles2dPobleVirtual);
    const llorenc = placa.dolors.filter((d) => d.perfils.includes('llorenc'));
    fireEvent.click(within(screen.getByRole('group', { name: 'Estat' })).getByRole('button', { name: /Obert/ }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Busca' }), { target: { value: 'DOL-14' } });
    expect(recompte(container)).not.toBe(`${llorenc.length} de ${placa.dolors.length} dolors`);
    const fitxa = screen.getByRole('heading', { level: 3, name: /^Llorenç,/ }).closest('li');
    fireEvent.click(within(fitxa).getByRole('button', { name: `Vore els seus dolors (${llorenc.length})` }));
    expect(recompte(container)).toBe(`${llorenc.length} de ${placa.dolors.length} dolors`);
    expect(screen.getByRole('combobox', { name: 'Veí' }).value).toBe('llorenc');
    expect(screen.getByRole('searchbox', { name: 'Busca' }).value).toBe('');
  });

  /* v1.2.19 · Gauntlet R2 (L4R2-03) · Amb el teclat de l'iPad s'escriu sense accent: la cerca ha de trobar igual. */
  test('la cerca de dolors no distingix accents ni majúscules', () => {
    const { container } = munta(EspecimenAtles2dPobleVirtual);
    const cerca = (q) => {
      fireEvent.change(screen.getByRole('searchbox', { name: 'Busca' }), { target: { value: q } });
      return recompte(container);
    };
    const text = (d) => normalizeSearchText([d.titol, d.descripcio, d.superficie, d.nota, d.versio_o_kit, d.id].join(' '));
    for (const [pla, accentuat] of [['sessio', 'sessió'], ['bandol', 'bàndol'], ['notificacio', 'notificació']]) {
      const esperats = placa.dolors.filter((d) => text(d).includes(pla)).length;
      expect(esperats, pla).toBeGreaterThan(0);
      expect(cerca(pla), pla).toBe(`${esperats} de ${placa.dolors.length} dolors`);
      expect(cerca(accentuat), accentuat).toBe(`${esperats} de ${placa.dolors.length} dolors`);
      expect(cerca(accentuat.toUpperCase()), accentuat.toUpperCase()).toBe(`${esperats} de ${placa.dolors.length} dolors`);
    }
  });

  /* v1.2.19 · Gauntlet R2 (L4R2-04) · L'estat dels dolors és el del dia de les dades: res de «avui». */
  test('l’obertura diu de quin dia és l’estat dels dolors, no en parla en present', () => {
    const { container } = munta(EspecimenAtles2dPobleVirtual);
    const obertura = screen.getByRole('heading', { level: 2, name: 'Què va dir el poble virtual' }).closest('section');
    expect(obertura.textContent).not.toMatch(/\bavui\b/);
    expect(obertura.textContent).toContain(`com estava cada dolor el ${DATA_DADES}`);
    expect(datacio(container)?.textContent).toContain(ATLES.meta.versio_codi);
  });

  test('les mètriques i les discrepàncies, senceres', () => {
    munta(EspecimenAtles2dPobleVirtual);
    expect(within(screen.getByRole('region', { name: 'Mètriques de les rondes' })).getAllByRole('row')).toHaveLength(placa.metriques.length + 1);
    for (const { titol } of ATLES.contradiccions) expect(screen.getAllByText(titol).length).toBeGreaterThan(0);
  });
});

describe('2. Xarxes del món', () => {
  test('el gràfic ordena per afinitat, la cerca i l’ordenació filtren i el clic porta a la fitxa', () => {
    const { container } = munta(EspecimenAtles2dXarxesMon);
    const files = within(container.querySelector('.sdp-atles__grafic')).getAllByRole('button');
    expect(files).toHaveLength(xarxes.length);
    const ordenades = [...xarxes].sort((a, b) => b.afinitat_sdp_sobre_10 - a.afinitat_sdp_sobre_10);
    expect(files.map((b) => b.querySelector('.sdp-atles__grafic-nom').textContent)).toEqual(ordenades.map((x) => x.nom));
    expect(files[0].textContent.startsWith(ordenades[0].nom)).toBe(true);
    expect(container.querySelector('.sdp-atles__grafic-pista').style.getPropertyValue('--atles-fraccio')).toBe(String(ordenades[0].afinitat_sdp_sobre_10 / 10));
    expect(recompte(container)).toBe(`${xarxes.length} de ${xarxes.length} xarxes`);
    expect(screen.getAllByText('Anti-model')).toHaveLength(xarxes.filter((x) => x.afinitat_sdp_sobre_10 < 5).length);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Busca' }), { target: { value: 'nextdoor' } });
    expect(recompte(container)).toBe(`1 de ${xarxes.length} xarxes`);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Busca' }), { target: { value: '' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Ordena' }), { target: { value: 'nom' } });
    const perNom = [...xarxes].sort((a, b) => a.nom.localeCompare(b.nom, 'ca')).map((x) => x.nom);
    expect([...container.querySelectorAll('.sdp-atles__graella article h3')].map((h) => h.textContent)).toEqual(perNom);

    const hylo = files.find((b) => b.textContent.startsWith('Hylo'));
    fireEvent.click(hylo);
    expect(hylo.getAttribute('aria-pressed')).toBe('true');
    const fitxa = screen.getByRole('article', { name: /^Hylo/ });
    expect(fitxa.getAttribute('aria-current')).toBe('true');
    expect(document.activeElement).toBe(fitxa);
  });

  test('la cerca llig el text de les fitxes, mai les claus de la dada ni l’adreça', () => {
    const { container } = munta(EspecimenAtles2dXarxesMon);
    /* Els valors de text, recollits a banda de textDeCerca: tots els camps de text llevat de l'id i de l'adreça.
       v1.2.19 · Gauntlet R2 (L4R2-03): plegats com la cerca universal (sense accents ni majúscules). */
    const trossos = (x) => Object.entries(x).filter(([clau]) => clau !== 'id' && clau !== 'url_referencia')
      .flatMap(([, valor]) => (Array.isArray(valor) ? valor : [valor])).filter((v) => typeof v === 'string').map(normalizeSearchText);
    const valors = (x) => normalizeSearchText(trossos(x).join(' '));
    const cerca = (q) => {
      fireEvent.change(screen.getByRole('searchbox', { name: 'Busca' }), { target: { value: q } });
      return recompte(container);
    };
    for (const xarxa of xarxes) {
      for (const tros of trossos(xarxa)) expect(textDeCerca(xarxa)).toContain(tros);
      expect(textDeCerca(xarxa)).toHaveLength(valors(xarxa).length);
    }
    expect(cerca('url')).toBe(`0 de ${xarxes.length} xarxes`);
    expect(cerca('model')).toBe(`${xarxes.filter((x) => valors(x).includes('model')).length} de ${xarxes.length} xarxes`);
    expect(xarxes.filter((x) => valors(x).includes('model'))).toHaveLength(3);
    /* Les claus de la dada no es busquen: els testimonis són tokens que només existixen com a clau. «moderacio» i
       «mecanica» ja no ho són, perquè sense accents casen, com toca, amb «moderació» i «mecànica» del text. */
    for (const clau of ['stack', 'afinitat_sdp', 'que_adoptar', 'stack_observable', 'model_negoci', 'url_referencia']) {
      expect(cerca(clau), clau).toBe(`0 de ${xarxes.length} xarxes`);
    }
    for (const clau of ['afinitat_sdp', 'que_adoptar', 'stack_observable', 'model_negoci']) {
      expect(xarxes.every((x) => Object.keys(x).some((k) => k.startsWith(clau))), clau).toBe(true);
    }
    for (const [pla, accentuat] of [['moderacio', 'moderació'], ['verificacio', 'verificació'], ['pagina', 'pàgina'], ['mecanica', 'mecànica']]) {
      const esperades = xarxes.filter((x) => valors(x).includes(pla)).length;
      expect(esperades, pla).toBeGreaterThan(0);
      expect(cerca(pla), pla).toBe(`${esperades} de ${xarxes.length} xarxes`);
      expect(cerca(accentuat), accentuat).toBe(`${esperades} de ${xarxes.length} xarxes`);
      expect(cerca(accentuat.toUpperCase()), accentuat.toUpperCase()).toBe(`${esperades} de ${xarxes.length} xarxes`);
    }
    expect(cerca('10')).toBe(`${xarxes.filter((x) => valors(x).includes('10')).length} de ${xarxes.length} xarxes`);
    expect(cerca('10')).not.toBe(`${xarxes.length} de ${xarxes.length} xarxes`);
  });

  test('cada fitxa diu què adoptem i què rebutgem, i Orkut ve peça per peça', () => {
    munta(EspecimenAtles2dXarxesMon);
    const adopta = xarxes.reduce((n, x) => n + x.que_adoptar_clean_room.length, 0);
    const rebutja = xarxes.reduce((n, x) => n + x.que_rebutjar_frontalment.length, 0);
    expect(document.querySelectorAll('.sdp-atles__llista-si > li')).toHaveLength(adopta);
    expect(document.querySelectorAll('.sdp-atles__llista-no > li')).toHaveLength(rebutja);
    const orkut = within(screen.getByRole('region', { name: 'Orkut, peça per peça' }));
    expect(orkut.getAllByRole('row')).toHaveLength(placa.orkut.mecaniques.length + 1);
    expect(orkut.getAllByText('Adoptem')).toHaveLength(placa.orkut.mecaniques.filter((m) => m.adoptar === 'si').length);
    const externs = screen.getAllByRole('link').filter((enllac) => enllac.getAttribute('target') === '_blank');
    expect(externs).toHaveLength(xarxes.filter((x) => x.url_referencia).length);
    for (const enllac of externs) expect(enllac.getAttribute('rel')).toBe('noopener noreferrer');
  });

  /* v1.2.19 · Gauntlet R2 (L4R2-07) · WCAG 3.1.2: cap dels 12 eslògans no és en valencià, i VoiceOver tria la veu pel lang. */
  test('cada eslògan porta la llengua en què està escrit, i a Nebenan només el tros alemany', () => {
    const { container } = munta(EspecimenAtles2dXarxesMon);
    const eslogans = [...container.querySelectorAll('.sdp-atles__eslogan')];
    expect(eslogans).toHaveLength(xarxes.filter((x) => x.eslogan_posicionament).length);
    const llengues = {};
    for (const p of eslogans) {
      const parts = p.querySelectorAll('[lang]');
      expect(parts, p.textContent).toHaveLength(1);
      const lang = parts[0].getAttribute('lang');
      llengues[lang] = (llengues[lang] || 0) + 1;
    }
    expect(llengues).toEqual({ en: 6, fr: 2, de: 1, es: 3 });
    /* Cap paraula no es perd en partir l'eslògan: es llig igual que la dada. */
    expect(eslogans.map((p) => p.textContent)).toEqual(
      [...xarxes].sort((a, b) => b.afinitat_sdp_sobre_10 - a.afinitat_sdp_sobre_10).filter((x) => x.eslogan_posicionament)
        .map((x) => `«${x.eslogan_posicionament.trim()}»`)
    );
    const nebenan = screen.getByRole('article', { name: /^Nebenan/ }).querySelector('.sdp-atles__eslogan');
    expect(nebenan.querySelector('[lang="de"]').textContent).toBe('Für gute Nachbarschaft');
    expect(nebenan.textContent).toBe('«Für gute Nachbarschaft (Per un bon veïnatge)»');
    expect(screen.getByRole('article', { name: /^PanneauPocket/ }).querySelector('.sdp-atles__eslogan [lang]').getAttribute('lang')).toBe('fr');
  });
});

describe('3. Mapa 2D de les 5 entitats', () => {
  test('la graella 12 × 5, el visor amb l’evidència i els filtres d’estat i de corregides', () => {
    const { container } = munta(EspecimenAtles2dMapaEntitats);
    const graella = within(screen.getByRole('region', { name: 'Mapa 2D: dimensions per entitat' }));
    expect(graella.getAllByRole('columnheader')).toHaveLength(entitats.entitats.length + 1);
    expect(graella.getAllByRole('rowheader')).toHaveLength(entitats.files.length);
    const botons = graella.getAllByRole('button');
    expect(botons).toHaveLength(CELLES.length);
    expect(botons.filter((b) => b.textContent.includes('Corregida'))).toHaveLength(entitats.resum.canvis_respecte_gemini);
    expect(botons.filter((b) => b.getAttribute('aria-pressed') === 'true')).toHaveLength(1);

    const fila = entitats.files.findIndex((f) => f.dimensio_id === 'rutes_i_urls_canoniques');
    const cella = entitats.files[fila].cel_les.usuari_vei;
    fireEvent.click(botons[fila * entitats.entitats.length]);
    const visor = container.querySelector('.sdp-atles__detall');
    expect(within(visor).getByRole('heading', { level: 3 }).textContent).toBe(`${entitats.files[fila].titol} · ${entitats.entitats[0].titol}`);
    for (const cami of cella.evidencia) expect(within(visor).getByText(cami)).toBeTruthy();
    /* v1.2.19 · Gauntlet R2 (L4R2-04): l'evidència és la del codi d'una versió concreta. */
    expect(within(visor).getByText(`Evidència al codi de la ${VERSIO_CURTA}`)).toBeTruthy();

    const apagades = () => botons.filter((b) => b.className.includes('sdp-atles__cel--apagada')).length;
    expect(apagades()).toBe(0);
    expect(botons.filter((b) => b.textContent.includes('fora del filtre'))).toHaveLength(0);
    fireEvent.click(within(screen.getByRole('group', { name: 'Ressalta un estat' })).getByRole('button', { name: /Falta/ }));
    expect(apagades()).toBe(CELLES.length - entitats.resum.falta);
    /* v1.2.19 · Gauntlet R2 (L4R2-05): el lector de pantalla també sap quines queden fora del ressalt, i només eixes. */
    const fora = botons.filter((b) => b.querySelector('.sdp-sr-only')?.textContent.endsWith(', fora del filtre'));
    expect(fora).toHaveLength(CELLES.length - entitats.resum.falta);
    expect(fora.every((b) => b.className.includes('sdp-atles__cel--apagada'))).toBe(true);
    fireEvent.click(within(screen.getByRole('group', { name: 'Ressalta un estat' })).getByRole('button', { name: 'Tots' }));
    fireEvent.click(screen.getByRole('switch', { name: `Només les corregides (${entitats.resum.canvis_respecte_gemini})` }));
    expect(apagades()).toBe(CELLES.length - entitats.resum.canvis_respecte_gemini);
  });

  /* v1.2.19 · Gauntlet R2 (L4R2-04) · El mapa diu de quin dia i de quina versió és, i la verificació en valencià. */
  test('la graella diu què hi havia al codi d’una versió i un dia, i la data de verificació és en valencià', () => {
    const { container } = munta(EspecimenAtles2dMapaEntitats);
    const resum = screen.getByRole('heading', { level: 2, name: 'Les cinc pàgines d’entitat, en dues dimensions' }).closest('section');
    expect(resum.textContent).toContain(`Cada cel·la diu què hi havia al codi de la ${VERSIO_CURTA} el ${DATA_DADES}`);
    expect(datacio(container)?.textContent).toContain(ATLES.meta.versio_codi);
    const verificat = [...container.querySelectorAll('.sdp-atles__recompte')].find((p) => p.textContent.startsWith('Verificat el'));
    const [hora] = entitats.verificat_el.match(/\d{2}:\d{2}:\d{2}/);
    const [any] = entitats.verificat_el.match(/\d{4}$/);
    expect(verificat.textContent).not.toMatch(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/);
    expect(verificat.textContent).toMatch(new RegExp(`^Verificat el \\d{2}-\\d{2}-${any} a les ${hora} \\([A-Z]{2,5}\\) · `));
    expect(dataDeVerificacio('Sat Nov  1 07:05:09 CEST 2026')).toBe('01-11-2026 a les 07:05:09 (CEST)');
    expect(dataDeVerificacio('dissabte, 21 de novembre')).toBe('dissabte, 21 de novembre');
  });

  test('les cinc entitats, l’estatut de l’Ajuntament i les rutes reals', () => {
    munta(EspecimenAtles2dMapaEntitats);
    for (const e of entitats.entitats) expect(screen.getAllByText(e.titol).length).toBeGreaterThan(0);
    const aj = entitats.files.map((f) => f.cel_les.ajuntament_entitat_oficial);
    const llista = (titol) => within(screen.getByRole('heading', { level: 3, name: titol }).closest('li')).getAllByRole('listitem');
    expect(llista('Què hi ha ja al codi')).toHaveLength(aj.filter((c) => c.estat !== 'falta').length);
    expect(llista('Què falta del tot')).toHaveLength(aj.filter((c) => c.estat === 'falta').length);
    expect(llista('Què cal planificar abans de picar codi')).toHaveLength(7);
    expect(screen.getByRole('heading', { level: 2, name: `Les ${entitats.rutes_reals.length} rutes reals de cada entitat` })).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'Les rutes reals de cada entitat' })).getAllByRole('row')).toHaveLength(entitats.rutes_reals.length + 1);
  });

  test('la columna «Entitat» de les rutes diu el nom de l’entitat, no l’id de la matriu', () => {
    munta(EspecimenAtles2dMapaEntitats);
    const rutes = within(screen.getByRole('region', { name: 'Les rutes reals de cada entitat' }));
    const columna = rutes.getAllByRole('row').slice(1).map((fila) => within(fila).getAllByRole('cell')[2].textContent);
    expect(columna).toEqual(entitats.rutes_reals.map((r) => nomsDEntitat(r.entitat, entitats.entitats)));
    /* Els ids compostos (usuari_vei, empresa_cooperativa…) ja no hi són; «poble» és alhora id i paraula. */
    for (const text of columna) for (const e of entitats.entitats.filter(({ id }) => id.includes('_'))) expect(text).not.toContain(e.id);
    expect(nomsDEntitat('usuari_vei / empresa_cooperativa / grup_associacio', entitats.entitats))
      .toBe('Usuari / Veí · Empresa / Comerç / Cooperativa · Grup / Comunitat / Associació');
    expect(nomsDEntitat('poble (administració multipoble)', entitats.entitats)).toBe('Poble (administració multipoble)');
    expect(nomsDEntitat('totes', entitats.entitats)).toBe('totes');
  });

  test('la vista «Per entitat»: les 12 cel·les d’una entitat en llista, amb els mateixos filtres i el mateix visor', () => {
    const { container } = munta(EspecimenAtles2dMapaEntitats);
    for (const e of entitats.entitats) expect(screen.getAllByText(e.titol.split(' / ')[0]).length).toBeGreaterThan(0);
    fireEvent.click(within(screen.getByRole('group', { name: 'Vista' })).getByRole('button', { name: 'Per entitat' }));
    expect(screen.queryByRole('region', { name: 'Mapa 2D: dimensions per entitat' })).toBeNull();
    fireEvent.click(within(screen.getByRole('group', { name: 'Entitat' })).getByRole('button', { name: '5. Ajuntament' }));
    const aj = entitats.entitats.find((e) => e.id === 'ajuntament_entitat_oficial');
    const llista = within(screen.getByRole('list', { name: `Les ${entitats.files.length} cel·les de ${aj.titol}` }));
    const botons = llista.getAllByRole('button');
    expect(botons).toHaveLength(entitats.files.length);
    expect(botons.map((b) => b.querySelector('.sdp-atles__cel-dimensio').textContent)).toEqual(entitats.files.map((f) => f.titol));
    const cellesAj = entitats.files.map((f) => f.cel_les.ajuntament_entitat_oficial);
    fireEvent.click(within(screen.getByRole('group', { name: 'Ressalta un estat' })).getByRole('button', { name: /Falta/ }));
    expect(botons.filter((b) => b.className.includes('sdp-atles__cel--apagada'))).toHaveLength(cellesAj.filter((c) => c.estat !== 'falta').length);
    fireEvent.click(botons[entitats.files.length - 1]);
    expect(botons[entitats.files.length - 1].getAttribute('aria-pressed')).toBe('true');
    expect(within(container.querySelector('.sdp-atles__detall')).getByRole('heading', { level: 3 }).textContent)
      .toBe(`${entitats.files[entitats.files.length - 1].titol} · ${aj.titol}`);
    fireEvent.click(within(screen.getByRole('group', { name: 'Vista' })).getByRole('button', { name: 'Graella 12 × 5' }));
    expect(screen.getByRole('region', { name: 'Mapa 2D: dimensions per entitat' })).toBeTruthy();
  });
});

describe('4. Motor d’estudis de mercat', () => {
  test('les dues fases, els quatre passos, els principis, les preguntes i la maqueta, que diu que és inventada', () => {
    const { container } = munta(EspecimenAtles2dMotorEstudis);
    expect(container.querySelector('h1')).toBeNull();
    expect(screen.getByRole('note').textContent).toContain('Proposta per a decidir.');
    expect(screen.getByRole('heading', { level: 3, name: ATLES.mercat_subtitols[0] })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3, name: ATLES.mercat_subtitols[1] })).toBeTruthy();
    expect(container.querySelectorAll('.sdp-atles__passos > li')).toHaveLength(ATLES.mercat.flux_ux_en_4_passos.length);
    const principis = within(screen.getByRole('heading', { level: 2, name: 'Principis que no es negocien' }).closest('section')).getAllByRole('listitem');
    expect(principis).toHaveLength(ATLES.mercat.principis_etics_innegociables.length);
    expect(within(screen.getByRole('heading', { level: 2, name: 'Preguntes per al Mestre' }).closest('section')).getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByRole('img', { name: /^Maqueta d’un informe d’estudi de mercat/ }).textContent).toContain('no són dades reals');
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  /* v1.2.19 · Gauntlet R2 (L4R2-08) · El rètol i la xifra parlen del mateix conjunt: les rondes que diu la dada. */
  test('«Què tenim ja com a fonament» compta les rondes igual que les nomena: les que tenen veus i les que no', () => {
    const { container } = munta(EspecimenAtles2dMotorEstudis);
    const fonament = screen.getByRole('heading', { level: 2, name: 'Què tenim ja com a fonament' }).closest('section');
    const entrada = [...fonament.querySelectorAll('dt')].find((dt) => dt.textContent.startsWith('Les rondes'))?.parentElement;
    expect(entrada, container.textContent.slice(0, 80)).toBeTruthy();
    const text = entrada.textContent;
    const ambVeus = placa.rondes.filter((r) => r.num_perfils > 0);
    const senseVeus = placa.rondes.filter((r) => !(r.num_perfils > 0));
    expect(ambVeus.length + senseVeus.length).toBe(placa.rondes.length);
    expect(senseVeus.length).toBeGreaterThan(0);
    expect(text).toContain(`${placa.rondes.length} rondes: ${ambVeus.length} amb veus`);
    expect(text).toContain(`i ${senseVeus.length} sense cap veu`);
    for (const ronda of placa.rondes) expect(text.split(ronda.id).length - 1, ronda.id).toBeGreaterThan(0);
    expect(text).toContain(`${placa.perfils.length} veus i ${placa.dolors.length} dolors`);
    expect(text).not.toContain('#01–#04 i la Fase 5');
  });
});

describe('les cinc pàgines', () => {
  test.each([
    ['presentacio', EspecimenAtles2dPresentacio], ['poble-virtual', EspecimenAtles2dPobleVirtual], ['xarxes-mon', EspecimenAtles2dXarxesMon],
    ['mapa-entitats', EspecimenAtles2dMapaEntitats], ['motor-estudis', EspecimenAtles2dMotorEstudis]
  ])('%s: cap H1, cap petició de xarxa, cap botó sense type i cap camí absolut del disc', (_, Pagina) => {
    const { container } = munta(Pagina);
    expect(container.querySelector('.sdp-atles')).not.toBeNull();
    expect(container.querySelector('h1')).toBeNull();
    expect([...container.querySelectorAll('button')].filter((b) => !b.getAttribute('type'))).toEqual([]);
    expect(container.textContent).not.toMatch(/\/Users\//);
    expect(fetchEspia).not.toHaveBeenCalled();
  });
});
