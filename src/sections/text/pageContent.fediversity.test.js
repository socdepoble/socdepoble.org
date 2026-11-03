/**
 * Ordre del Mestre (30-10-2026; candidatura NLnet NGI Fediversity, expedient
 * 2026-08-1a6) · PAGE_COPY.fediversity és una pàgina pública que llegiran els
 * avaluadors d'NLnet: «zero mentides belles». Esta prova fixa l'anatomia de
 * la UniversalPage (H1, H2, entradilla i cos des d'H3) i, per l'ordre
 * definitiva del Mestre (~01:00), la maquetació editorial vertical sense cap
 * taula (un blockquote amb el total, un H4 per partida i tres H5 a dins), el
 * logotip clicable d'NGI Fediversity, els quatre enllaços de fora autoritzats
 * i les imatges; i ancora al codi cada afirmació que depén d'una peça:
 * si la peça canvia (un fitxer que naix, una bandera que s'encén, una llengua
 * nova), la prova cau i el text s'ha de tornar a escriure, com fa
 * paginaDeText.test.js amb la Consola. No se'n deriva cap text.
 *
 * 01-11-2026 (ordre del Mestre 261101_0311, T2) · Passen a «Fet hui
 * (verificable)»: el connector de WordPress.org (1.1.10), les fletxes
 * (IDEA-58), el traductor (IDEA-31), les comprovacions automàtiques
 * d'accessibilitat, l'exportació Open Data i la primera fase de la
 * federació, i la prova d'integració de l'instal·lador.
 * Cada «Fet» continua ancorat al codi d'este mateix build; el que encara no
 * existix es queda a «Pendent» i es diu que no existix.
 * Gauntlet 2 261101 (carril Y; correcció del crític) · No tot això era al
 * lloc publicat (el build de l'01-11-2026 a les 01:39 CET): el comentari de
 * PAGE_COPY.fediversity ho separa, i la darrera prova d'este fitxer el vigila.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { PAGE_COPY } from './pageContent.js';
import { TITOL_GOVERN } from '../consola/govern/governConsola.js';
import { CAPACITATS, CONTRACTE_BACKEND, CONTRACTE_NUCLI } from '../../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../../data/backendPort.js';
import { getSessionState } from '../../data/sessionService.js';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';
import { SUPPORTED_LANGUAGES } from '../../config/i18n.js';
import { SECTIONS } from '../../config/sections.js';
import { VARIANTS_SOCIALS } from '../../config/imatgeSocial.js';
import * as lliure from '../../data/traductorLliure.js';
import { importaElModul } from '../../../tests/helpers/especificadorsImport.js';
import { canalsOberts } from '../../config/canalsDeBotiga.js';
import { POBLES_FEDERATS, urlsDeMunicipi } from '../../data/activitypub.js';

/* Com a App.fediversity.test.jsx: l'amfitrió ja és llest i Notes no té esborranys. */
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

/* L'app de veres a `ruta`, com la web publicada: DEV fals, sense sessió ni
   xarxa, i /__iaia/* en 404 (el servidor estàtic no el té). L'app s'importa
   ací dins: la resta del fitxer no la carrega. */
async function muntaAppSenseSessio(ruta, cos) {
  vi.stubEnv('DEV', false);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  const fetch = vi.fn(async (url) => {
    if (String(url).startsWith('/__iaia/')) return { status: 404, ok: false, statusText: 'Not Found' };
    throw new Error('Xarxa inesperada: ' + url);
  });
  vi.stubGlobal('fetch', fetch);
  const anterior = { ...getBackendImplementation() };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, async () => null])),
    getCurrentUser: () => null,
    getRuntimeDataMode: () => 'local',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => null,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => []
  });
  window.history.replaceState(null, '', ruta);
  try {
    const { default: PedraSecaEmbed } = await import('../../PedraSecaEmbed');
    render(createElement(PedraSecaEmbed, { config: { routerType: 'browser' } }));
    await waitFor(() => expect(getSessionState().estat).toBe('fora'));
    await cos(fetch);
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
    window.history.replaceState(null, '', '/');
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  }
}

/* Les mides d'una WebP, dels seus bytes (VP8X, VP8 o VP8L). El lector de
   tooling/seo (sniffImage) porta un #! que l'entorn jsdom no transforma. */
function midesWebp(bytes) {
  if (bytes.toString('latin1', 0, 4) !== 'RIFF' || bytes.toString('latin1', 8, 12) !== 'WEBP') return null;
  const tros = bytes.toString('latin1', 12, 16);
  if (tros === 'VP8X') return { type: 'image/webp', width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
  if (tros === 'VP8 ') return { type: 'image/webp', width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  if (tros === 'VP8L') {
    const bits = bytes.readUInt32LE(21);
    return { type: 'image/webp', width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

const ARREL = path.resolve(import.meta.dirname, '../../..');
const copy = PAGE_COPY.fediversity;
const doc = new DOMParser().parseFromString(copy.html, 'text/html');
const text = doc.body.textContent.replace(/\s+/g, ' ');
/* Les quatre partides (H4 «n · …») i el que hi ha davall de cadascuna fins al
   pròxim H1-H4 o a la panoràmica. O4-CLAUDE-2 (ordre del Mestre, 261102
   21:38) · Cada partida és ara una Subtargeta (div.sdp-subtargeta): el seu H4
   n'és el primer fill i la secció acaba amb la caixa. Fora de les partides,
   el cos continua pla. */
const partides = () => [...doc.querySelectorAll('h4')].filter((h4) => /^\d · /.test(h4.textContent));
function seccio(inici) {
  const nodes = [];
  for (let node = inici.nextElementSibling; node && !/^H[1-4]$/.test(node.tagName) && node.tagName !== 'IMG'; node = node.nextElementSibling) nodes.push(node);
  return nodes;
}
const textDe = (nodes) => nodes.map((node) => node.textContent).join(' ').replace(/\s+/g, ' ').trim();
const partida = (i) => textDe(seccio(partides()[i]));
function apartat(i, nom) {
  const nodes = seccio(partides()[i]);
  const inici = nodes.findIndex((node) => node.tagName === 'H5' && node.textContent === nom);
  if (inici === -1) return null;
  const fi = nodes.findIndex((node, j) => j > inici && node.tagName === 'H5');
  return textDe(nodes.slice(inici + 1, fi === -1 ? undefined : fi));
}
const existix = (rel) => existsSync(path.join(ARREL, rel));
const imatge = (cami) => midesWebp(readFileSync(path.join(ARREL, 'public', cami)));
/* Gauntlet 261030, cicle 2 (troballa fediversity-estats-falsos-en-el-mateix-build) ·
   Un estat ancorat al codi d'este mateix build, no al desplegament: si la peça
   hi és, la pàgina l'afirma i no la nega; si no hi és, la nega i no l'afirma. */
const concorda = (hiEs, nega, afirma) => (hiEs ? afirma && !nega : nega && !afirma);
const llegix = (rel) => readFileSync(path.join(ARREL, rel), 'utf8');
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const elementAmb = (marca) => [...doc.querySelectorAll('li')].find((li) => li.textContent.includes(marca));
const ORIGEN = 'https://socdepoble.org';
const WORDPRESS = 'https://wordpress.org/plugins/socdepoble/';
/* 01-11-2026 · Les adreces de federació de l'apartat de verificació en viu,
   derivades del codi que les publica (activitypub.js i federacio-iaia.mjs):
   totes responien 200 el 01-11-2026 a les 04:05 CET (curl). La del pla,
   /ap/actors/la-torre-de-les-macanes/outbox.json, donava 404: no és cap
   ruta del codi i la pàgina no l'enllaça. */
/* O4-CLAUDE-2 (ordre del Mestre, 261102 21:38) · El paquet de dades obertes estàtic de La Torre
   (public/opendata/), enllaçat en relatiu a la verificació en viu. Ni mercat.jsonld ni
   llocs.geojson: no existixen. */
const OPENDATA = Object.freeze([
  '/opendata/municipi.jsonld', '/opendata/manifest.json', '/opendata/llicencies.md',
  '/opendata/noticies.jsonld', '/opendata/agenda.jsonld', '/opendata/memoria.md'
]);
const ENDPOINTS_FEDERACIO = () => {
  const actors = ['socdepoble', ...POBLES_FEDERATS].map((slug) => urlsDeMunicipi(slug, { origen: ORIGEN }));
  return [
    `${ORIGEN}/.well-known/nodeinfo`, `${ORIGEN}/nodeinfo/2.1.json`,
    ...actors.map((urls) => urls.actor), ...actors.map((urls) => urls.outbox),
    `${ORIGEN}/.well-known/host-meta`
  ];
};

describe('anatomia (skill sdp-universal-page)', () => {
  test('H1, H2 i data: els literals de l’ordre del Mestre', () => {
    expect(copy.title).toBe('Candidatura Europea NLnet · NGI Fediversity');
    expect(copy.subtitle).toBe("50.000 € i 1.000 hores d'enginyeria lliure per a la sobirania digital dels pobles rurals (Expedient 2026-08-1a6)");
    expect(copy.date).toBe('2026-10-30T00:06:00+01:00');
    expect(copy.lead).not.toMatch(/[<>]/);
  });

  test('el cos comença en H3: tres, en l’ordre del Mestre, i cap H1 ni H2', () => {
    expect(doc.querySelectorAll('h1, h2')).toHaveLength(0);
    expect([...doc.querySelectorAll('h3')].map((h) => h.textContent)).toEqual([
      'Què és NGI Fediversity i per què Sóc de Poble hi encaixa',
      'Agenda viva i estat de les 4 partides: 1.000 hores i 50.000 €',
      'Verificació en viu per als avaluadors i el veïnat'
    ]);
  });

  test('la portada quadrada és la de la targeta i no es repetix al cos; al mig del cos, la panoràmica', () => {
    expect(copy).toMatchObject({ image: '/assets/uploads/fediversity-hero.webp', imageWidth: 1024, imageHeight: 1024, imageFetchPriority: 'high' });
    expect(imatge(copy.image)).toMatchObject({ type: 'image/webp', width: 1024, height: 1024 });
    expect(copy.html).not.toContain('fediversity-hero');
    const imgs = [...doc.querySelectorAll('img')];
    expect(imgs.map((img) => img.getAttribute('src'))).toEqual(['/assets/uploads/ngi-fediversity-tag.svg', '/assets/uploads/fediversity-maquinaria.webp']);
    const cos = imgs[1];
    expect([cos.getAttribute('width'), cos.getAttribute('height')]).toEqual(['1376', '768']);
    expect(imatge('/assets/uploads/fediversity-maquinaria.webp')).toMatchObject({ type: 'image/webp', width: 1376, height: 768 });
    expect(cos.getAttribute('alt').length).toBeGreaterThan(40);
    expect(copy.imageAlt.length).toBeGreaterThan(40);
    // El logotip, al primer H3; la panoràmica, entre el segon i el tercer.
    const ordre = [...doc.body.querySelectorAll('h3, img')].map((node) => (node.tagName === 'IMG' ? node.getAttribute('src').split('/').pop() : node.tagName));
    expect(ordre).toEqual(['H3', 'ngi-fediversity-tag.svg', 'H3', 'fediversity-maquinaria.webp', 'H3']);
    // Les bessones .png i la variant social de la portada, al disc.
    for (const cami of ['/assets/uploads/fediversity-hero.png', '/assets/uploads/fediversity-maquinaria.png']) expect([cami, existix(`public${cami}`)]).toEqual([cami, true]);
    expect(VARIANTS_SOCIALS[copy.image]).toBe('/assets/uploads/fediversity-hero-social-1200x630.jpg');
  });

  test('etiquetes: Sistema, una categoria i una etiqueta, sense duplicats', () => {
    expect(copy.labels).toEqual([
      { text: 'Sistema', className: 'sdp-badge-system' },
      { text: 'Candidatura europea', className: 'sdp-badge-category' },
      { text: 'NGI Fediversity', className: 'sdp-badge-tag' }
    ]);
  });

  /* Ordre definitiva del Mestre (~01:00) · «Fora la taula»: res que obligue a
     desplaçar de costat al mòbil, la lletra de cos, i cada partida a l'índex
     de la barra blava (H1..H6). */
  test('maquetació vertical: cap taula; un blockquote amb el total; un H4 per partida amb els seus tres H5', () => {
    expect(doc.querySelectorAll('table, thead, tbody, tr, td, th, caption, .sdp-taula-prosa')).toHaveLength(0);
    expect([...doc.querySelectorAll('blockquote')].map((cita) => cita.textContent.trim())).toEqual([
      "Total sol·licitat: 1.000 hores · 50.000 € (50 €/hora). Candidatura en fase d'avaluació (Expedient 2026-08-1a6)."
    ]);
    // El total va dins del segon H3, abans de la primera partida.
    expect(doc.querySelector('blockquote').previousElementSibling.previousElementSibling.textContent).toMatch(/^Agenda viva/);
    expect(partides()).toHaveLength(4);
    for (const [i, h4] of partides().entries()) {
      expect([i, seccio(h4).filter((node) => node.tagName === 'H5').map((h5) => h5.textContent)]).toEqual([i, ['Què diu la candidatura', 'Fet hui (verificable)', 'Pendent']]);
    }
    // Cap salt de nivell: després d'un Hn només ve un Hn+1 o menys.
    const nivells = [...doc.querySelectorAll('h3, h4, h5, h6')].map((h) => Number(h.tagName[1]));
    expect(nivells[0]).toBe(3);
    nivells.slice(1).forEach((nivell, i) => expect([i, nivell <= nivells[i] + 1]).toEqual([i, true]));
    /* Cap estil ni color nou: la classe del logotip (page-title-logo, layout.css) i, O4-CLAUDE-2
       (prova posada al dia a propòsit), la de la primitiva Subtargeta, una per partida (bloc
       .sdp-subtargeta de modules.css). */
    expect(copy.html).not.toMatch(/\sstyle=/);
    expect([...copy.html.matchAll(/\sclass="([^"]*)"/g)].map((m) => m[1])).toEqual([
      'page-title-logo',
      'sdp-targetes',
      'sdp-targeta',
      ...Array(4).fill('sdp-subtargeta'),
      'sdp-targetes',
      'sdp-targeta'
    ]);
  });

  /* O4-CLAUDE-2 (ordre del Mestre, 261102 21:38) · Cada partida, una Subtargeta: el seu H4 és el
     títol (el primer fill) i els tres H5 hi són dins. El total, la panoràmica i la resta del cos,
     fora. Cap paraula canviada: el text de cada caixa és el de la seua partida. */
  test('cada partida és una Subtargeta: el seu H4 com a títol i els seus tres H5 dins; cap més caixa', () => {
    const caixes = [...doc.querySelectorAll('div.sdp-subtargeta')];
    expect(caixes).toHaveLength(4);
    expect(doc.querySelectorAll('[data-sdp-subtargeta]')).toHaveLength(4);
    for (const [i, caixa] of caixes.entries()) {
      expect([i, caixa.getAttribute('data-sdp-subtargeta'), caixa.parentElement === doc.body]).toEqual([i, '', true]);
      expect(caixa.firstElementChild).toBe(partides()[i]);
      expect([...caixa.querySelectorAll(':scope > h5')].map((h5) => h5.textContent)).toEqual(['Què diu la candidatura', 'Fet hui (verificable)', 'Pendent']);
      expect(caixa.querySelectorAll('h3, h4')).toHaveLength(1);
      expect(textDe([caixa])).toBe(`${partides()[i].textContent} ${partida(i)}`);
    }
    for (const fora of [doc.querySelector('blockquote'), doc.querySelector('img[src$="fediversity-maquinaria.webp"]'), ...doc.querySelectorAll('h3')]) {
      expect(fora.closest('.sdp-subtargeta')).toBeNull();
    }
  });

  test('el logotip d’NGI Fediversity: local, clicable cap a la convocatòria, amb mides i avís d’avaluació', () => {
    const img = doc.querySelector('img[src="/assets/uploads/ngi-fediversity-tag.svg"]');
    const a = img.closest('a');
    expect([a.getAttribute('href'), a.getAttribute('target'), a.getAttribute('rel')]).toEqual(['https://nlnet.nl/fediversity/', '_blank', 'noopener noreferrer']);
    expect([img.getAttribute('width'), img.getAttribute('height')]).toEqual(['2040', '503']);
    expect(img.getAttribute('alt')).toContain('candidatura de Sóc de Poble està en avaluació');
    // L'SVG del disc: el viewBox que diuen les mides, i res que s'execute o que vaja a fora.
    const svg = readFileSync(path.join(ARREL, 'public/assets/uploads/ngi-fediversity-tag.svg'), 'utf8');
    expect(svg).toMatch(/viewBox="0 0 2040 503"/);
    expect(svg).not.toMatch(/<script|\son[a-z]+\s*=|foreignObject|<!ENTITY|<!DOCTYPE|@import|javascript:|href="https?:/i);
    // Al costat, en text visible: en avaluació i sense cap finançament.
    expect(a.parentElement.nextElementSibling.textContent).toBe("El logotip porta a la pàgina oficial de la convocatòria. Sóc de Poble no rep cap finançament d'NGI Fediversity: la seua candidatura està en avaluació.");
  });
});

/* O6-CLAUDE (ordre del Mestre, prompt 261102_1532, Onada 6) · «En lloc de llistes monòtones de
   punts, subtítols <h4> seguits de paràgrafs narratius on les paraules principals vagen en negreta.»
   Les tres raons ja no són una llista de «<strong>Etiqueta:</strong> …»: cada una és un H4 i un sol
   paràgraf, amb el mateix text (l'etiqueta sense els dos punts i l'explicació en majúscula). I la
   Prova d'Or de la lectura diagonal: cap paràgraf pla, i cap negreta dins d'un encapçalament. */
describe('O6 · lectura diagonal: H4 + paràgraf, i cap paràgraf pla', () => {
  test('les tres raons: un H4 i un paràgraf cadascuna, darrere de «tres raons», sense cap llista', () => {
    const intro = [...doc.querySelectorAll('p')].find((p) => p.textContent === 'Sóc de Poble hi encaixa per tres raons:');
    const raons = [];
    for (let node = intro.nextElementSibling; node && node.textContent !== 'Els nodes actius del Fedivers de Sóc de Poble'; node = node.nextElementSibling) raons.push(node);
    expect(raons.map((node) => node.tagName)).toEqual(['H4', 'P', 'H4', 'P', 'H4', 'P']);
    expect(raons.filter((node) => node.tagName === 'H4').map((h4) => h4.textContent)).toEqual(['Dades separades de la interfície', 'Model B', 'Codi lliure']);
    const [dades, modelB, codi] = raons.filter((node) => node.tagName === 'P').map((p) => p.textContent);
    /* 03-11-2026 (arbitratge 12:22; prova posada al dia a propòsit) · Cada raó porta ara al final
       l'«Exemple pràctic» de MarIA (10:50). La comparació continua exacta (toBe): qualsevol frase
       nova o canviada en estos tres paràgrafs fa caure la prova i s'ha de tornar a mirar. */
    expect(dades).toBe("L'aplicació demana les dades a través d'un port neutral, src/data/backendPort.js, i un kit de conformitat comprova qualsevol adaptador abans d'enxufar-lo. Hui hi ha un sol servidor de dades, el Supabase de Sóc de Poble. Exemple pràctic: és com l'aigua del poble; les canonades i l'aixeta de casa són sempre les mateixes, tant si hui l'aigua ve d'un depòsit compartit com si demà l'ajuntament connecta el seu propi pou municipal sense picar cap paret.");
    expect(modelB).toBe("Una web amfitriona, com una de WordPress, pot allotjar l'aplicació com un component. Les dades del poble, però, viuen al servidor de Sóc de Poble, que és l'única font de veritat. Canviar de servidor és una decisió documentada, amb un adaptador que ha de passar el kit de conformitat. Exemple pràctic: l'associació Gent de la Torre ja tenia la seua web en WordPress; amb el nostre connector hi ha incrustat l'aplicació sencera en dos minuts, sense perdre el seu disseny ni haver de mantindre cap servidor propi.");
    expect(codi).toBe('El fitxer LICENSE del projecte declara la llicència GNU AGPL, versió 3 o posterior (AGPL-3.0-or-later). Hi és des del 3 de setembre de 2026. Exemple pràctic: cap empresa pot tancar el servei ni cobrar un peatge als veïns demà passat; qualsevol ajuntament o cooperativa pot descarregar el codi, auditar-lo i posar-lo a rodar en un ordinador propi.');
    expect(raons.map((node) => node.querySelector('code')?.textContent ?? null)).toEqual([null, 'src/data/backendPort.js', null, null, null, 'LICENSE']);
    // Cap llista de «<strong>Etiqueta:</strong> …» a la pàgina.
    expect([...doc.querySelectorAll('li')].filter((li) => /^<strong>[^<]*:<\/strong>/.test(li.innerHTML.trim()))).toEqual([]);
  });

  test('cap paràgraf pla: tot paràgraf amb text porta negreta, i cap encapçalament no en porta', () => {
    const plans = [...doc.querySelectorAll('p')].filter((p) => p.textContent.trim() && !p.querySelector('strong')).map((p) => p.textContent.slice(0, 60));
    expect(plans).toEqual([]);
    expect([...doc.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter((h) => h.querySelector('strong')).map((h) => h.textContent)).toEqual([]);
    // Negretes ben formades: ni niuades, ni buides, ni dins del codi.
    expect(doc.querySelectorAll('strong strong, code strong, strong:empty')).toHaveLength(0);
  });
});

describe('les partides: les del formulari enviat', () => {
  test('quatre partides amb el títol literal del Mestre, les hores i l’import', () => {
    expect(partides().map((h4) => h4.textContent)).toEqual([
      '1 · Arquitectura Model B (160 h · 8.000 €)',
      '2 · UX/WCAG AAA + Fletxes IDEA-58 + Traductor Apertium IDEA-31 (240 h · 12.000 €)',
      '3 · Mòduls Cívics + Karpathy + Open Data Municipal + ActivityPub (440 h · 22.000 €)',
      '4 · >25.000 proves + flake.nix reproduïble (160 h · 8.000 €)'
    ]);
  });

  test('160 + 240 + 440 + 160 = 1.000 h i 8.000 + 12.000 + 22.000 + 8.000 = 50.000 €, a 50 €/h, com diu el total', () => {
    const xifres = partides().map((h4) => /\(([\d.]+) h · ([\d.]+) €\)$/.exec(h4.textContent).slice(1).map((n) => Number(n.replace(/\./g, ''))));
    expect(xifres).toEqual([[160, 8000], [240, 12000], [440, 22000], [160, 8000]]);
    expect(xifres.reduce((suma, [hores]) => suma + hores, 0)).toBe(1000);
    expect(xifres.reduce((suma, [, euros]) => suma + euros, 0)).toBe(50000);
    expect(xifres.every(([hores, euros]) => euros === hores * 50)).toBe(true);
    expect(doc.querySelector('blockquote').textContent).toContain('1.000 hores · 50.000 € (50 €/hora)');
  });

  test('les tres «Bales de Plata», dins de la partida 3, sense hores al formulari enviat', () => {
    const tercera = partida(2);
    expect(tercera).toContain('no tenen hores pròpies');
    for (const bala of ['Mètode Karpathy', 'Exportació Open Data per municipi', 'Federació ActivityPub i WebFinger']) expect(tercera).toContain(bala);
  });
});

describe('honestedat: cada afirmació ancorada al codi', () => {
  test('en avaluació: cap diner rebut, cap emblema de la UE, i només els enllaços de fora autoritzats', () => {
    expect(copy.lead).toContain("està en avaluació: encara no s'ha concedit cap diner");
    expect(text).toContain('candidatura està en avaluació');
    expect(text).toContain("Candidatura en fase d'avaluació (Expedient 2026-08-1a6)");
    expect(`${copy.lead} ${text}`).not.toMatch(/subvenció concedida|hem rebut|ens han concedit|finançat per la Unió|amb el finançament de/i);
    // Ordres del Mestre de les ~00:50 (els nodes) i de les ~01:00 (la convocatòria i la fundació).
    // 31-10-2026 · i la fitxa del connector al directori de WordPress.org (ordre del Mestre, Ronda 1).
    // 01-11-2026 (T2) · i les adreces de federació de l'apartat de verificació en viu, absolutes.
    const autoritzats = new Set(['https://nlnet.nl/fediversity/', 'https://nlnet.nl/', 'https://socdepoble.org', 'https://gentdelatorre.net', 'http://socdepoble.cat', WORDPRESS, ...ENDPOINTS_FEDERACIO()]);
    const externs = [...copy.html.matchAll(/https?:\/\/[^"'\s<]+/gi)].map((m) => m[0]);
    expect(new Set(externs)).toEqual(autoritzats);
    for (const a of doc.querySelectorAll('a[href^="http"]')) {
      expect([a.getAttribute('href'), a.getAttribute('target'), a.getAttribute('rel')]).toEqual([a.getAttribute('href'), '_blank', 'noopener noreferrer']);
    }
    // L'únic logotip és el d'NGI Fediversity, local: cap emblema de la UE.
    expect([...doc.querySelectorAll('img')].filter((img) => /logo|tag|emblem|flag/i.test(img.getAttribute('src'))).map((img) => img.getAttribute('src'))).toEqual(['/assets/uploads/ngi-fediversity-tag.svg']);
    expect(copy.html).not.toMatch(/emblem|bandera de la UE|eu-flag/i);
  });

  test('la convocatòria i la fundació, enllaçades al primer bloc', () => {
    const [primer] = doc.querySelectorAll('h3');
    const enllacos = [];
    for (let node = primer.nextElementSibling; node && node.tagName !== 'H3'; node = node.nextElementSibling) {
      enllacos.push(...[...node.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]));
    }
    expect(enllacos).toEqual(expect.arrayContaining([['NGI Fediversity', 'https://nlnet.nl/fediversity/'], ['fundació NLnet', 'https://nlnet.nl/']]));
  });

  test('els nodes actius: tres, clicables, i tres portes al mateix servei (Model B), sense ActivityPub encara', () => {
    const h4 = [...doc.querySelectorAll('h4')].filter((h) => !/^\d · /.test(h.textContent));
    /* O6-CLAUDE (ordre del Mestre, prompt 261102_1532, Onada 6; prova posada al dia a propòsit) ·
       Les tres raons, abans una llista «<strong>Etiqueta:</strong> …», són ara tres H4, davant dels
       nodes actius i de la visió. Tot el primer H3, en H4: cap salt de nivell. */
    expect(h4.map((h) => h.textContent)).toEqual([
      'Dades separades de la interfície', 'Model B', 'Codi lliure',
      'Els nodes actius del Fedivers de Sóc de Poble', 'La visió: nodes germans «Gent de…»'
    ]);
    // Dins del primer H3: cap H4 salta de nivell.
    const capcaleres = [...doc.querySelectorAll('h3, h4')].map((h) => h.tagName);
    expect(capcaleres.slice(0, 7)).toEqual(['H3', 'H4', 'H4', 'H4', 'H4', 'H4', 'H3']);
    // Dins del seu H4 (gentdelatorre.net també ix a la partida 1 i a la verificació en viu).
    const h4Nodes = h4.find((h) => h.textContent === 'Els nodes actius del Fedivers de Sóc de Poble');
    const nodes = seccio(h4Nodes).flatMap((node) => [...node.querySelectorAll('a')]);
    expect(nodes.map((a) => [a.getAttribute('href'), a.textContent, a.getAttribute('target'), a.getAttribute('rel')])).toEqual([
      ['https://socdepoble.org', 'socdepoble.org', '_blank', 'noopener noreferrer'],
      ['https://gentdelatorre.net', 'gentdelatorre.net', '_blank', 'noopener noreferrer'],
      ['http://socdepoble.cat', 'socdepoble.cat', '_blank', 'noopener noreferrer'],
      ['/page/node-zero', 'Node 0 · Mac mini M4', null, null],
      ['/fedivers', 'nodes del nostre Fedivers rural', null, null]
    ]);
    expect(text).toContain('Hui hi ha tres nodes actius, i es poden visitar:');
    expect(text).toContain('hui són tres portes al mateix servei: la mateixa aplicació i el mateix servidor de dades de Sóc de Poble, segons el Model B');
    expect(text).toContain('Encara no parlen ActivityPub entre ells');
  });

  test('la visió «Gent de…»: Gent de la Torre ja és actiu; la resta, intenció i sense cap domini inventat', () => {
    for (const poble of ['Gent de Xixona', 'Gent de Relleu', 'Gent de Tibi', "Gent d'Alcoleja", 'Gent de Penàguila']) expect([poble, text.includes(poble)]).toEqual([poble, true]);
    expect(text).toContain('Gent de la Torre ja és actiu');
    expect(text).toContain('Hui encara no tenen node propi');
    expect(copy.html.replaceAll('socdepoble.cat', '')).not.toMatch(/gentde(?!latorre)[a-z]+\.|\.(?:cat|es|eu|com)\b/i);
    const visio = textDe(seccio([...doc.querySelectorAll('h4')].find((h) => h.textContent === 'La visió: nodes germans «Gent de…»')));
    expect(visio).toContain('el connector oficial de Sóc de Poble ja està publicat i actiu al directori de WordPress.org, amb el nom socdepoble i la versió 1.1.12');
    expect(visio).toContain("la seua fitxa, wordpress.org/plugins/socdepoble, porta la guia d'instal·lació i 10 captures de pantalla");
    const readme = llegix('wordpress-plugin/readme.txt');
    const captures = (readme.split(/^== Screenshots ==$/m)[1] ?? '').split(/^== /m)[0].match(/^\d+\. /gm) ?? [];
    expect(captures).toHaveLength(10);
    expect(readme).toMatch(/^= 1\.1\.12 =$/m);
    expect(readme).toMatch(/^== Installation ==$/m);
    expect(text).not.toMatch(/s'obri a tothom amb la primera versió|ha aprovat el connector|encara no és al directori/);
    expect(canalsOberts().map((canal) => canal.url)).toContain(WORDPRESS);
    const fitxa = doc.querySelector(`a[href="${WORDPRESS}"]`);
    expect([fitxa?.textContent, fitxa?.getAttribute('target'), fitxa?.getAttribute('rel')]).toEqual(['wordpress.org/plugins/socdepoble', '_blank', 'noopener noreferrer']);
  });

  test('alineada amb PAGE_COPY.fedivers: els mateixos tres nodes i la mateixa visió, i el Fedivers continua sense fer', () => {
    const fedivers = PAGE_COPY.fedivers.html;
    for (const tros of ['<strong>tres d’actius</strong>', '<strong>socdepoble.org</strong>', '<strong>gentdelatorre.net</strong>', '<strong>socdepoble.cat</strong>', 'Gent de Xixona', 'Gent de Relleu', 'Gent de Tibi', 'Gent d’Alcoleja', 'Gent de Penàguila', 'Hui encara no està fet']) {
      expect([tros, fedivers.includes(tros)]).toEqual([tros, true]);
    }
  });

  test('el finançament del fons, literal de nlnet.nl/fediversity', () => {
    expect(text).toContain('Next Generation Internet de la Comissió Europea');
    expect(text).toContain('Horizon Europe de la Unió Europea, amb el conveni de subvenció número 101136078');
  });

  /* P1-23 el construïx un altre constructor (30-10-2026): «no existix» només
     mentre el fitxer no és a l'arbre; quan hi és, «en curs», fins que
     l'orquestradora reescriga l'apartat en aterrar i desplegar-se. */
  /* 01-11-2026 (T2) · L'Open Data i la primera fase d'ActivityPub, desplegades
     i verificades en viu, passen a «Fet hui»: «fet» només mentre el codi hi
     és, i «no existix» només mentre no hi és. La segona fase d'ActivityPub
     (seguir, rebre i lliurar) no existix al codi: es queda a «Pendent». */
  test('P1-23: Open Data, ActivityPub, flake.nix i l’instal·lador. «No existix» només mentre no existixen', () => {
    const tercera = apartat(2, 'Pendent');
    const fet3 = apartat(2, 'Fet hui (verificable)');
    const quarta = apartat(3, 'Pendent');
    const casa = (existeix, noExistix, enCurs) => (existeix ? enCurs && !noExistix : noExistix);
    expect(concorda(existix('src/data/exportaMunicipiOpenData.js'),
      /Exportació Open Data per municipi[^:]*: no existix/.test(partida(2)), fet3.includes('Exportació Open Data per municipi: des de la fitxa pública de cada poble es descarrega'))).toBe(true);
    expect(concorda(existix('src/data/activitypub.js'),
      /Federació ActivityPub i WebFinger[^:]*: no existix/.test(partida(2)), fet3.includes('Federació ActivityPub i WebFinger, primera fase, només de lectura'))).toBe(true);
    // La segona fase: cap Follow, Accept ni lliurament al codi de la federació.
    const fase2 = ['src/data/activitypub.js', 'tooling/vite/federacio-iaia.mjs', 'tooling/seo/genera-federacio.mjs']
      .some((rel) => /['"](?:Follow|Accept)['"]|\bsignatura HTTP\b|\bSignature:/.test(senseComentaris(llegix(rel))));
    expect(concorda(fase2, tercera.includes("Federació ActivityPub, segona fase, perquè un avís publicat al node d'un poble es puga llegir des del node d'un poble veí: encara no existix. Hui no es pot seguir cap poble des de Mastodon, ni rebre res a la bústia d'entrada (inbox), ni lliurar les publicacions amb signatures HTTP."),
      /Federació ActivityPub, segona fase[^.]*: (?:fet|ja)/.test(tercera))).toBe(true);
    expect(fet3).not.toMatch(/Mastodon[^.]*(?:ja es pot seguir|segueix)|bústia d'entrada/);
    expect(casa(existix('flake.nix'), quarta.includes('flake.nix: no existix'), quarta.includes('flake.nix: en curs'))).toBe(true);
    expect(casa(existix('tooling/instalador'), quarta.includes("L'instal·lador: no existix"), quarta.includes("L'instal·lador: en curs"))).toBe(true);
    // Seguir des de Mastodon és fase 2: la pàgina no diu que es puga seguir cap poble.
    expect(text).toContain('Seguir un poble des de Mastodon serà una fase posterior');
  });

  /* Gauntlet 261030, cicle 2 (Gemini G1 i Codex C11) · L'Open Data són les
     dades PÚBLIQUES del poble, amb les seues llicències (mai «totes les
     dades», que es confondria amb la migració protegida), i cada «ja és al
     repositori» i «encara no» de P1-23 ancorat al codi: si algú endolla el
     paquet a l'aplicació o esborra les proves, esta prova cau i la frase
     s'ha de tornar a escriure. */
  test('P1-23: el que diu de l’Open Data i d’ActivityPub és el que hi ha al repositori', async () => {
    const tercera = apartat(2, 'Fet hui (verificable)');
    const pendent3 = apartat(2, 'Pendent');
    expect(tercera).toContain('les dades públiques del poble, amb les seues llicències');
    expect(partida(2)).not.toMatch(/totes les dades/);
    const opendata = readFileSync(path.join(ARREL, 'src/data/exportaMunicipiOpenData.js'), 'utf8');
    for (const peca of ['export async function exportaMunicipiOpenData(', 'export async function verificaPaquetOpenData(', 'data/llicencies.md']) expect([peca, opendata.includes(peca)]).toEqual([peca, true]);
    expect(existix('src/data/exportaMunicipiOpenData.test.js')).toBe(true);
    expect(tercera).toContain('des de la fitxa pública de cada poble es descarrega un paquet estàndard amb les dades públiques del poble');
    /* T2 · D04/D10 (assalt 261101) · La 1.2.0, el verificador i el restaurador, cada un amb les seues proves. */
    expect(tercera).toContain("El generador del paquet, en la versió 1.2.0 del format, el seu verificador i un restaurador que comprova cada SHA-256 abans de tornar a carregar el poble en un altre servidor de dades tenen proves. Hui el restaurador només s'executa a les proves, sobre l'adaptador local, sense cap pantalla.");
    /* Gauntlet transversal 261101 (VE-02) · Qui porta les notícies és el paquet, no el restaurador
       de la frase d'abans: la frase nomena el seu subjecte. */
    expect(tercera).toContain("sense cap pantalla. Hui el paquet porta les notícies i els actes de l'agenda");
    expect(tercera).not.toMatch(/pantalla\. Hui porta /);
    /* Gauntlet transversal 261101 (H4-06) · L'adaptador local no és cap «altre servidor de dades» en
       servei: la partida 1 diu que n'hi ha un de sol. */
    expect(tercera).not.toContain("(hui, l'adaptador local)");
    for (const fitxer of ['src/data/importaMunicipiOpenData.js', 'src/data/importaMunicipiOpenData.test.js', 'src/data/importaMunicipiOpenData.adaptadorLocal.test.js']) {
      expect([fitxer, existix(fitxer)]).toEqual([fitxer, true]);
    }
    /* «Només s'executa a les proves … sense cap pantalla»: cap mòdul de l'aplicació (src/ sense les proves)
       importa el restaurador, llegit de l'AST com a la prova del generador. Si un Tauler l'importa, la
       prova cau i les dues frases de la partida 3 s'han de tornar a escriure. */
    const importaElRestaurador = (codi, fitxer) => importaElModul(codi, 'importaMunicipiOpenData', fitxer);
    expect(importaElRestaurador("import { importaMunicipiOpenData } from '../../data/importaMunicipiOpenData.js';\n", 'peca.jsx')).toBe(true);
    expect(importaElRestaurador('/* el restaurador (importaMunicipiOpenData.js) */\nexport const x = 1;\n', 'peca.js')).toBe(false);
    const srcRestaurador = path.join(ARREL, 'src');
    const quiRestaura = readdirSync(srcRestaurador, { recursive: true }).map(String)
      .filter((fitxer) => /\.(?:js|jsx)$/.test(fitxer) && !/\.test\.(?:js|jsx)$/.test(fitxer) && !fitxer.endsWith('importaMunicipiOpenData.js'))
      .filter((fitxer) => importaElRestaurador(readFileSync(path.join(srcRestaurador, fitxer), 'utf8'), fitxer));
    expect(quiRestaura).toEqual([]);
    expect(llegix('src/data/importaMunicipiOpenData.js')).toContain('export async function importaMunicipiOpenData(');
    expect(llegix('src/data/local/dadesObertesLocal.js')).toContain('async restauraDadesObertes(');
    // El format que diu: JSON-LD, Data Package v2 i el manifest SHA-256 (BagIt).
    for (const peca of ['datapackage.json', 'manifest-sha256.txt', 'application/ld+json']) expect([peca, opendata.includes(peca)]).toEqual([peca, true]);
    expect(tercera).toContain('en JSON-LD de schema.org i amb un Data Package v2 de Frictionless i un manifest SHA-256 per a comprovar cada fitxer');
    // Ronda 2 · Ja es descarrega: la fitxa del poble (DetallPoble.jsx) és el mòdul de l'app que importa el generador.
    /* Gauntlet 261030, cicle 3 (inercia-per-text-cru-falsos-rojos) · Es miren
       els especificadors d'import (AST), no el text cru: un comentari que nomena
       el generador ja no posa esta prova en roig; un import de veres, sí. */
    const importaElGenerador = (codi, fitxer) => importaElModul(codi, 'exportaMunicipiOpenData', fitxer);
    expect(importaElGenerador('export const x = 1;\n/* Com el paquet de dades obertes (exportaMunicipiOpenData), cap fila del veïnat. */\n', 'peca.js')).toBe(false);
    expect(importaElGenerador("import { exportaMunicipiOpenData } from '../../data/exportaMunicipiOpenData.js';\n", 'peca.js')).toBe(true);
    const src = path.join(ARREL, 'src');
    const quiLImporta = readdirSync(src, { recursive: true }).map(String)
      .filter((fitxer) => /\.(?:js|jsx)$/.test(fitxer) && !/\.test\.(?:js|jsx)$/.test(fitxer) && !fitxer.endsWith('exportaMunicipiOpenData.js'))
      .filter((fitxer) => importaElGenerador(readFileSync(path.join(src, fitxer), 'utf8'), fitxer));
    expect(quiLImporta).toContain('sections/pobles/DetallPoble.jsx');
    /* Revisió de la Ronda 2 (R-01, R2-COR-03) · El paquet diu què porta de veres: el directori d'entitats i la memòria en Markdown; notícies, agenda i memòria cultural encara no.
       01-11-2026 · Ancorat al comportament: el que recullDadesPubliquesDelMunicipi encara deixa a «pendents» no s'exporta. */
    /* T2 · D04/D10 (assalt 261101) · El port de producció (Supabase) servix les notícies i l'agenda en anònim, i
       memòria cultural i memòria oral a null (src/data/supabase/dadesObertes.js): el doble de davall en té la forma, i
       la pàgina ho ha de dir col·lecció a col·lecció. */
    const { recullDadesPubliquesDelMunicipi } = await import('../../data/exportaMunicipiOpenData.js');
    const supabaseDadesObertes = senseComentaris(llegix('src/data/supabase/dadesObertes.js'));
    expect(supabaseDadesObertes).toMatch(/noticies: llistaFitada\(perClau\.get\('feedPosts'\)[^\n]*\n\s*agenda: llistaFitada\(perClau\.get\('events'\)[^\n]*\n\s*memoria: null,\n\s*memoriaOral: null/);
    const formaDeSupabase = { noticies: [], agenda: [], memoria: null, memoriaOral: null };
    const port = new Proxy({}, { get: (_, metode) => (metode === 'teCapacitat' ? () => true : metode === 'then' ? undefined
      : metode === 'llegixDadesObertes' ? async () => formaDeSupabase : async () => []) });
    const recollides = await recullDadesPubliquesDelMunicipi(port, { slug: 'la-torre-de-les-macanes', nom: 'La Torre de les Maçanes' });
    const pendentsDelPaquet = (recollides.pendents ?? []).map((pendent) => pendent.coleccio);
    // Exportada = no és a «pendents»: aleshores la pàgina ho ha d'afirmar i no negar-ho; pendent, al revés.
    const exportada = (coleccio) => !pendentsDelPaquet.includes(coleccio);
    expect(concorda(exportada('noticies'), /les notícies[^.;]*encara no s'hi exporten/.test(tercera), /porta les notícies/.test(tercera))).toBe(true);
    expect(concorda(exportada('agenda'), /l'agenda[^.;]*encara no s'hi exporten/.test(tercera), /els actes de l'agenda/.test(tercera))).toBe(true);
    expect(concorda(exportada('memoria'), /la memòria cultural[^.;]*encara no s'hi exporten/.test(tercera), /porta[^.;]*la memòria cultural/.test(tercera))).toBe(true);
    expect(concorda(exportada('memoriaOral'), /les fitxes de memòria oral encara no s'hi exporten/.test(tercera), /porta[^.;]*les fitxes de memòria oral/.test(tercera))).toBe(true);
    expect(pendentsDelPaquet).toEqual(['memoria', 'memoriaOral', 'configuracio']);
    expect(tercera).not.toContain('memòria de les fonts pendents');
    // ActivityPub: la fase 1 (lectura) i les seues proves, al repositori.
    for (const fitxer of ['src/data/activitypub.js', 'src/data/activitypub.test.js', 'tooling/seo/genera-federacio.mjs', 'tooling/seo/genera-federacio.test.mjs']) expect([fitxer, existix(fitxer)]).toEqual([fitxer, true]);
    expect(tercera).toContain('Federació ActivityPub i WebFinger, primera fase, només de lectura');
    expect(partida(2)).not.toMatch(/S'està escrivint/);
    /* Cicle 2 (fediversity-estats-falsos-en-el-mateix-build) · DEROGA «però
       encara no està publicada»: el build web que porta esta pàgina publica
       /ap/ (vite.config.js registra federacioIaia, que emet ap/** al
       generateBundle, i firebase.json servix /ap/**). Publicada o no ho diu
       este build, no el desplegament. WebFinger al lloc estàtic, vegeu el bloc
       de sota; les seues regles per a un servidor propi són a flake.nix. */
    const publicaAp = /\bfederacioIaia\(/.test(senseComentaris(llegix('vite.config.js'))) && llegix('firebase.json').includes('"source": "/ap/**"');
    expect(concorda(publicaAp, /no està publicada|no es publica a/.test(partida(2)), tercera.includes("el lloc web publica a /ap/ els documents d'ActivityPub de Sóc de Poble i de La Torre de les Maçanes, l'únic poble federat"))).toBe(true);
    /* Tancament 261030 (P1-23, ordre del Mestre: WebFinger compatible amb
       Firebase Hosting) · DEROGA «encara no les respon socdepoble.org»: el
       build web emet host-meta i el JRD dels actors principals
       (federacio-iaia.mjs crida fitxersWebFingerEstatic) i firebase.json porta
       una reescriptura per compte, també per a l'àlies. La frase diu quins
       comptes, que va per la via alternativa (host-meta), que els pobles de
       mostra no, i que encara no s'ha provat amb un Mastodon de veres. */
    const firebase = JSON.parse(llegix('firebase.json')).hosting;
    const reescrituraDe = (usuari, jrd) => firebase.rewrites.some((r) => r.destination === `/.well-known/webfinger/${jrd}.json` && r.regex?.includes(`acct(?::|%3a)${usuari}(?:@|%40)`));
    const webfingerEstatic = /\bfitxersWebFingerEstatic\(/.test(senseComentaris(llegix('tooling/vite/federacio-iaia.mjs')))
      && reescrituraDe('socdepoble', 'socdepoble') && reescrituraDe('la-torre-de-les-macanes', 'la-torre-de-les-macanes')
      && reescrituraDe('latorredelesmacanes', 'la-torre-de-les-macanes');
    expect(concorda(webfingerEstatic, /encara no les respon socdepoble\.org/.test(partida(2)), tercera.includes('socdepoble.org publica la via alternativa que consulta Mastodon, el document host-meta, '
      + 'perquè es puguen trobar @socdepoble@socdepoble.org i @la-torre-de-les-macanes@socdepoble.org, que també es troba com a @latorredelesmacanes@socdepoble.org'))).toBe(true);
    /* Decisió del Mestre del 31-10-2026 (Ronda 2): la federació és només per a La Torre.
       La pàgina no pot prometre WebFinger, actor ni outbox als pobles de mostra. */
    expect(tercera).toContain('Els pobles de mostra no es poden trobar així, i no tenen actor ni outbox');
    expect(partida(2)).not.toContain('tots els pobles del directori');
    expect(partida(2)).not.toContain('dels pobles de mostra');
    expect(tercera).toContain("de La Torre de les Maçanes, l'únic poble federat");
    expect(llegix('src/data/activitypub.js')).toMatch(/export const POBLES_FEDERATS = Object\.freeze\(\['la-torre-de-les-macanes'\]\)/);
    expect(tercera).toContain('/nodeinfo/2.1.json');
    /* Revisió de la Ronda 2 (R-07) · Cap paraula anglesa a la prosa: els noms tècnics van en <code>. */
    expect(copy.html).toContain('Ni els xats ni les aportacions de persones (<code>section_submissions</code>) no es publiquen.');
    expect(copy.html).toContain('avisos <code>Note</code>, notícies <code>Article</code> i actes <code>Event</code> com a <code>Create</code>');
    expect(copy.html).toContain("valida l'identificador del poble configurat (<code>tenant</code>) i l'origen i pot executar <code>npm ci</code>");
    expect(copy.html).toContain('<code>package-lock.json</code>');
    expect(text).not.toMatch(/les submissions|valida el tenant/);
    /* V1-04 · «outbox» és un nom tècnic anglés: la primera vegada, «la bústia de sortida (<code>outbox</code>)», i mai fora de <code>. */
    expect(copy.html).toContain("també porta la bústia de sortida (<code>outbox</code>) d'ActivityStreams 2.0.");
    expect(copy.html).toContain('i no tenen actor ni <code>outbox</code>.');
    const senseCodi = new DOMParser().parseFromString(copy.html, 'text/html');
    senseCodi.querySelectorAll('code').forEach((codi) => codi.remove());
    /* Gauntlet 261101 (A-05) · Un enllaç que té per text la seua pròpia adreça
       (/ap/outbox/…) és una adreça, no prosa: com el <code>, no compta. */
    senseCodi.querySelectorAll('a[href^="https://"]').forEach((a) => {
      if (a.textContent === a.getAttribute('href').replace(ORIGEN, '')) a.remove();
    });
    expect(senseCodi.body.textContent).not.toMatch(/outbox/i);
    expect(text).toMatch(/outbox/);
    expect(pendent3).toContain("Encara no s'ha provat amb un servidor de Mastodon de veres");
    expect(pendent3.includes("les regles per a un servidor propi (flake.nix) encara no s'han verificat amb Nix")).toBe(/\/\.well-known\/webfinger/.test(llegix('flake.nix')));
  });

  test('la IAIA local és BM25 sense models, i el Mètode Karpathy no existix', () => {
    const iaia = readFileSync(path.join(ARREL, 'src/data/iaiaLocal.js'), 'utf8');
    expect(iaia).toMatch(/BM25/);
    expect(iaia).not.toMatch(/from ['"][^'"]*(openai|anthropic|gemini|transformers|onnx|llama)/i);
    expect(text).toContain('cerca BM25 dins del navegador, sense models de llenguatge ni tòkens');
    expect(text).toMatch(/Mètode Karpathy[^:]*: no existix/);
  });

  test('el xifratge del Xat: la pàgina diu «bandera apagada» mentre la bandera és apagada', () => {
    expect([E2EE_ACTIU_PER_DEFECTE, text.includes("està preparat darrere d'una bandera apagada: hui no està actiu")]).toEqual([false, true]);
    /* 01-11-2026 (T2) · Les primitives que nomena són les del motor (xifratXatCripto.js), i
       el xifratge no ix mai a «Fet hui»: és codi i proves, apagat. */
    const cripto = senseComentaris(llegix('src/data/xifratXatCripto.js'));
    for (const peca of ["name: 'ECDH', namedCurve: 'P-256'", "name: 'ECDSA', namedCurve: 'P-256'", 'AEAD_AES_256_GCM', 'subtle']) expect([peca, cripto.includes(peca)]).toEqual([peca, true]);
    expect(apartat(3, 'Pendent')).toContain("el motor criptogràfic, amb WebCrypto (claus P-256 per a ECDH i ECDSA i xifratge AES-GCM de 256 bits), i les seues proves són al repositori");
    for (const i of [0, 1, 2, 3]) expect([i, /xifratge d'extrem a extrem|E2EE/.test(apartat(i, 'Fet hui (verificable)'))]).toEqual([i, false]);
  });

  test('la llicència: el fitxer LICENSE és GNU AGPL, versió 3 o posterior', () => {
    const llicencia = readFileSync(path.join(ARREL, 'LICENSE'), 'utf8').replace(/\s+/g, ' ');
    expect(llicencia).toContain('GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version');
    expect(text).toContain('GNU AGPL, versió 3 o posterior (AGPL-3.0-or-later)');
  });

  test('les cinc llengües de la interfície, i la CSP a index.html', () => {
    expect(SUPPORTED_LANGUAGES.map((llengua) => llengua.code)).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
    expect(text).toContain('cinc llengües: valencià, castellà, anglés, basc i gallec');
    expect(readFileSync(path.join(ARREL, 'index.html'), 'utf8')).toMatch(/http-equiv="Content-Security-Policy"/);
  });

  /* Gauntlet 261030, cicle 2 (troballa fediversity-estats-falsos-en-el-mateix-build;
     auditories_residus §4.6) · DEROGA «en construcció. Hui socdepoble.org
     encara no traduïx les pàgines»: la pàgina viatja en el mateix build que
     el traductor i les fletxes, i una frase sobre el desplegament no podia
     ser certa en cap. L'estat ix del codi d'este build: si l'entrada del lloc
     (main.jsx) fixa el traductor lliure, la partida 2 diu que el botó Traduir
     ja el demana i mai que no traduïx; si l'espai de treball de Disseny i de
     la Wiki de Poble penja les fletxes (navegacioTeclat.js), ho diu, amb els
     seus enllaços. Les dues continuen «en curs», a «Pendent» (B3: mai «fet»
     per a res sense desplegar). */
  /* 01-11-2026 (ordre del Mestre 261101_0311, T2) · DEROGA «en curs» i «cap
     Fet hui les promet» (B3: mai «fet» sense desplegar): les fletxes i el
     traductor ja són desplegats. Verificat en viu el 01-11-2026 al paquet de
     socdepoble.org: el tros navegacioTeclat i el de traductorLliure, amb
     l'extrem d'Apertium. Passen a «Fet hui», i cada frase continua ancorada al
     codi d'este mateix build: si la peça se'n va, la prova cau. */
  test('el traductor i les fletxes: la partida 2 diu el que fa este mateix build, a «Fet hui»', () => {
    const segona = apartat(1, 'Pendent');
    const fet2 = apartat(1, 'Fet hui (verificable)');
    const fletxes = elementAmb('(IDEA-58)');
    const traductor = elementAmb('(IDEA-31)');
    expect([Boolean(fletxes), Boolean(traductor)]).toEqual([true, true]);
    // IDEA-58: les columnes de l'espai de treball (UniversalWorkspace) pengen les fletxes, i Disseny i la Wiki de Poble el munten.
    const espai = senseComentaris(llegix('src/components/universal/workspace/UniversalWorkspace.jsx'));
    const fletxesViues = /from '\.\/navegacioTeclat\.js'/.test(espai) && /gestionaTeclaLlista\(/.test(espai) && /gestionaTeclaArbre\(/.test(espai)
      && ['src/sections/disseny/DesignSection.jsx', 'src/sections/wiki-de-poble/WikiDePobleSection.jsx'].every((rel) => /<UniversalWorkspace\b/.test(llegix(rel)));
    const textFletxes = fletxes.textContent.replace(/\s+/g, ' ');
    expect(concorda(fletxesViues, /no existix|en construcció|encara no|en curs/.test(textFletxes), textFletxes.includes('↑ ↓ ← →, Inici i Fi mouen el focus per les columnes de Disseny i de la Wiki de Poble'))).toBe(true);
    // Inici i Fi també són de navegacioTeclat.js.
    expect(senseComentaris(llegix('src/components/universal/workspace/navegacioTeclat.js'))).toMatch(/'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'/);
    if (fletxesViues) expect([...fletxes.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['/disseny', '/wikidepoble', '/notes', '/pobles', '/mur', '/consola']);
    for (const rel of ['pobles/PoblesSection.jsx', 'mur/MurSection.jsx', 'consola/ConsolaSection.jsx']) {
      expect(senseComentaris(llegix(`src/sections/${rel}`))).toMatch(/onKeyDown=\{gestionaTeclaGraella\}/);
    }
    expect(llegix('src/sections/notes/NotesSection.jsx')).toMatch(/<UniversalWorkspace\b/);
    // IDEA-31: l'entrada del lloc (main.jsx, fora dels comentaris) fixa el traductor lliure del navegador.
    const traductorDelLloc = /\bfixaTraductorLliure\(\s*'apertium'\s*\)/.test(senseComentaris(llegix('src/main.jsx')));
    const textTraductor = traductor.textContent.replace(/\s+/g, ' ');
    expect(concorda(traductorDelLloc, /no traduïx|no es traduïx|en construcció|en curs/.test(textTraductor), textTraductor.includes('a socdepoble.org, el botó Traduir de la barra blava la demana des del navegador'))).toBe(true);
    expect([...traductor.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['/traduccions']);
    // Les dues, a «Fet hui» i no a «Pendent».
    expect([fet2.includes('(IDEA-58)'), fet2.includes('(IDEA-31)'), segona.includes('(IDEA-58)'), segona.includes('(IDEA-31)')]).toEqual([fletxesViues, traductorDelLloc, false, false]);
    expect(text).not.toMatch(/encara no traduïx|no està publicada/);
    expect(segona).toContain("L'objectiu és WCAG 2.2 AAA, i hui no tenim cap certificació d'accessibilitat");
    // Cap certificació promesa: el Pendent ho diu, i cap «Fet hui» parla d'AAA certificat.
    expect(fet2).not.toMatch(/certifica|AAA/);
    // El criteri 2.1.1 Teclat és de nivell A; el d'AAA és el 2.1.3.
    expect(text).toContain('2.1.1 Teclat de les WCAG, que és de nivell A');
    expect(text).toContain('El criteri de nivell AAA és el 2.1.3 Teclat sense excepció');
  });

  /* Gauntlet 261030, cicle 2 · Les llengües i els serveis del traductor que
     diu la partida 2 són els de MOTORS_TRADUCCIO (traductorLliure.js, la font
     única de l'àrea A1): Apertium per al castellà, l'anglés, el francés i el
     gallec; MyMemory (Translated) per al basc i l'alemany. */
  test('IDEA-31: cada llengua, amb el servei que diu el codi', () => {
    expect(lliure.MOTORS_TRADUCCIO).toBeTruthy();
    const perMotor = (motor) => Object.entries(lliure.MOTORS_TRADUCCIO).filter(([, m]) => m.motor === motor).map(([desti]) => desti).sort();
    expect([perMotor('apertium'), perMotor('mymemory')]).toEqual([['EN-GB', 'ES', 'FR', 'GL'], ['DE', 'EU']]);
    expect(apartat(1, 'Fet hui (verificable)')).toContain("amb Apertium, un traductor de programari lliure, al castellà, l'anglés, el francés i el gallec, i amb MyMemory, un servei de l'empresa Translated, al basc i a l'alemany");
  });

  /* Ordre del Mestre (30-10-2026, prompt 2208, T2) i decisió del Mestre del
     31-10-2026 · Prova actualitzada a propòsit: la Consola és oberta a tothom.
     Derogat: «A la web publicada demana un compte amb el rol de superadmin».
     Es prova el comportament, no la font: en un build (DEV fals) i sense
     sessió, /fediversity porta a /page/fediversity, i /consola munta la
     Consola de veres, amb el Govern del Mestre i les seues pàgines, sense
     RequireAuth (ni /registre ni «Accés restringit») i sense cap lectura a
     /__iaia/* en un paquet sense instantània; al build web, amb la bandera de
     la instantània, només els quatre GET sense credencials (decisió del
     Mestre, 31-10-2026). Ni guarda ni literal d'App.jsx (correcció 31-10-2026). */
  test('cada enllaç és una ruta de l’app, i la Consola és oberta a tothom, com diu la pàgina', async () => {
    const rutesDeSeccio = new Set(SECTIONS.map((seccio) => seccio.path));
    const altres = new Set(['/page/consola', '/consola', '/traduccions', '/wikidepoble', '/fedivers']);
    /* O4-CLAUDE-2 (prova posada al dia a propòsit) · Els fitxers del paquet de dades obertes
       estàtic no són rutes de l'app: els vigila la prova de la verificació en viu, de davall. */
    const hrefs = [...doc.querySelectorAll('a')].map((a) => a.getAttribute('href')).filter((href) => !href.startsWith('https://') && !OPENDATA.includes(href));
    /* 01-11-2026 (T2) · Un document de la Wiki de Poble, per l'id que porta el paquet de la Wiki (wikiManifest.js). */
    const manifest = llegix('src/data/wikiManifest.js');
    const delaWiki = (href) => /^\/wikidepoble\?item=[a-z0-9_]+$/.test(href) && manifest.includes(`"id": "${href.split('=')[1]}"`);
    expect(hrefs.filter((href) => !rutesDeSeccio.has(href) && !altres.has(href) && !delaWiki(href))).toEqual([]);
    expect(hrefs).toContain('/wikidepoble?item=perfil_minim_allotjament_node_municipal');
    for (const ruta of ['/pobles', '/notes', '/multimedia', '/xat', '/disseny', '/consola', '/versions']) expect([ruta, hrefs.includes(ruta)]).toEqual([ruta, true]);
    // Decisió del Mestre (31-10-2026) · La web publicada mostra les dades reals, amb la instantània sanejada del build.
    expect(text).toContain("És oberta a tothom, sense compte ni rol: a la web publicada en mostra les dades reals del sistema, amb la instantània sanejada que es genera en cada publicació, i les lectures en viu i les escriptures només es fan a l'ordinador on es treballa.");
    expect(text).not.toMatch(/superadmin/);
    // L'adreça curta, de veres: /fediversity porta a la pàgina.
    await muntaAppSenseSessio('/fediversity', async () => {
      await waitFor(() => expect(window.location.pathname).toBe('/page/fediversity'), { timeout: 8000 });
    });
    // La ruta de la Consola, de veres, en un paquet sense la instantània (WordPress, l'app): cap lectura.
    await muntaAppSenseSessio('/consola', async (fetch) => {
      expect(await screen.findByRole('navigation', { name: 'Pàgines de la Consola' }, { timeout: 8000 })).toBeTruthy();
      expect(screen.getAllByRole('heading', { name: TITOL_GOVERN }).length).toBeGreaterThan(0);
      expect(window.location.pathname).toBe('/consola');
      expect(screen.queryByText('Accés restringit')).toBeNull();
      expect(fetch.mock.calls.map(([url]) => String(url)).filter((url) => url.startsWith('/__iaia/'))).toEqual([]);
    });
    /* Decisió del Mestre (31-10-2026) · Al build web (la bandera que segella
       sdp:consola-instantania), /consola llig la instantània publicada: les
       quatre fonts (StrictMode les munta dues vegades i avorta la primera),
       amb un GET al mateix origen i sense credencials. Ací el servidor respon
       404, i la Consola es pinta igual. */
    vi.stubEnv('SDP_CONSOLA_INSTANTANIA', '1');
    await muntaAppSenseSessio('/consola', async (fetch) => {
      expect(await screen.findByRole('navigation', { name: 'Pàgines de la Consola' }, { timeout: 8000 })).toBeTruthy();
      expect(screen.queryByText('Accés restringit')).toBeNull();
      const iaia = () => fetch.mock.calls.filter(([url]) => String(url).startsWith('/__iaia/'));
      await waitFor(() => expect(new Set(iaia().map(([url]) => String(url))).size).toBe(4));
      expect([...new Set(iaia().map(([url]) => String(url)))].sort()).toEqual(['/__iaia/consola.json', '/__iaia/empaquetats.json', '/__iaia/govern.json', '/__iaia/mapa.json']);
      expect(iaia().every(([, opcions]) => opcions?.credentials === 'omit' && !opcions?.method)).toBe(true);
    });
  }, 30000);

  test('valencià: formes valencianes (este, hui, anglés)', () => {
    const tot = JSON.stringify(copy);
    expect(tot).not.toMatch(/(?:^|[^\p{L}])(?:aquest|aquesta|aquests|aquestes|avui|anglès)(?=$|[^\p{L}])/iu);
  });

  /* T2 · D04/D10 (assalt 261101) · Refet amb el contracte final: 'versioClient' (T8b) i 'dadesObertes' i
     'restauracioDadesObertes' (T2) hi afigen tres capacitats.
     IDEA-24 (marató 261101_2143, B4) · 'transferenciaPropietat' n'afig una altra: 35 capacitats i 115 mètodes.
     B8C-2 (marató 261101_2143, B8) · 'avisosPush' i 'silenciXat' n'afigen dues més: 37 capacitats i 118 mètodes. */
  test('F4 · la partida 1 i el document del Model B diuen les xifres exactes del contracte (32 nucli, 37 capacitats i 118 totals) sense dades inventades', () => {
    const primeraFet = apartat(0, 'Fet hui (verificable)');
    const primeraPendent = apartat(0, 'Pendent');
    expect(CONTRACTE_NUCLI).toHaveLength(32);
    expect(Object.keys(CAPACITATS)).toHaveLength(37);
    expect(CONTRACTE_BACKEND).toHaveLength(118);
    expect(primeraFet).toContain(
      `L'inventari de l'API del port neutral (${CONTRACTE_NUCLI.length} mètodes del nucli i ${Object.keys(CAPACITATS).length} capacitats atòmiques a src/data/contracte.js) i dels requisits d'allotjament verificables del Model B, en esborrany a la Wiki de Poble.`
    );
    /* Decisió del Mestre (xat 261031, revisió R3 H-04): l'inventari és un
       esborrany i els recursos mínims encara no s'han mesurat.
       01-11-2026 (T2; carril B4) · El perfil mínim d'allotjament mesura la web
       estàtica i cita els preus oficials, en esborrany; la mida de la base de
       dades i la càrrega d'un servidor encara no. «Fet» diu el perfil en
       esborrany i «Pendent», el que el mateix document diu que no s'ha mesurat. */
    expect(primeraFet).not.toMatch(/documentats a la Wiki/);
    const perfil = readFileSync(path.join(ARREL, '_wiki_de_poble/02_saber/architecture/perfil_minim_allotjament_node_municipal.md'), 'utf8');
    expect(perfil).toMatch(/^status: esborrany$/m);
    expect(perfil).toContain('## 8. Tres escenaris de cost mensual');
    expect(perfil).toContain("La mida de la base de dades i la càrrega real d'un servidor no s'han mesurat.");
    expect(primeraFet).toContain("El perfil mínim d'allotjament d'un node municipal, en esborrany a la Wiki de Poble: la mida mesurada de la web estàtica, el que necessita la base de dades i tres escenaris de cost mensual per a un ajuntament menut, amb els preus oficials.");
    expect(primeraPendent).toContain("Mesurar la mida de la base de dades de producció i la càrrega real d'un servidor, i fixar amb eixes xifres els recursos mínims d'allotjament.");
    expect(primeraPendent).not.toContain("Documentar l'API i els requisits d'allotjament");
    const docModelB = readFileSync(
      path.join(ARREL, '_wiki_de_poble/02_saber/architecture/api_port_neutral_i_allotjament_model_b.md'),
      'utf8'
    );
    expect(docModelB).toContain('32 operacions obligatòries del Nucli (`CONTRACTE_NUCLI`)');
    expect(docModelB).toContain('37 capacitats atòmiques opcionals (`CAPACITATS`)');
    expect(docModelB).toContain('86 mètodes addicionals');
    expect(docModelB).toContain('118 mètodes');
    /* Gauntlet transversal 261101 (H4-02) · Cap recompte vell (els 111 de la Ronda 2, o qualsevol de 100 a 117)
       d'operacions o de mètodes: el document diu els 118 de CONTRACTE_BACKEND a tot arreu. */
    expect(docModelB).not.toMatch(/\b1(0\d|1[0-7]) (operacions|mètodes)/);
    expect(docModelB).not.toMatch(/12\s*€|2\s*vCPU|40\s*GB|CouchDB|PocketBase/i);
  });
});

test('Lot5 · el document enumera exactament els noms reals del nucli i les capacitats',()=>{
 const doc=readFileSync(path.join(ARREL,'_wiki_de_poble/02_saber/architecture/api_port_neutral_i_allotjament_model_b.md'),'utf8');
 const nucli=doc.slice(doc.indexOf('## 32 operacions'),doc.indexOf('## 37 capacitats'));
 expect([...nucli.matchAll(/^- `([^`]+)`$/gm)].map(m=>m[1])).toEqual(CONTRACTE_NUCLI);
 const files=[...doc.matchAll(/^\| `([^`]+)` \| (.+) \|$/gm)].map(m=>[m[1],[...m[2].matchAll(/`([^`]+)`/g)].map(m=>m[1])]);expect(Object.fromEntries(files)).toEqual(CAPACITATS);
 for(const ruta of [...doc.matchAll(/`((?:src|tooling|wordpress-plugin)\/[a-zA-Z0-9_./-]+\.(?:js|jsx|mjs|nix|php))`/g)].map(m=>m[1]))expect(existix(ruta),ruta).toBe(true);
});

/* 01-11-2026 (ordre del Mestre 261101_0311, T2) · Les fites noves de «Fet hui
   (verificable)» i els enllaços de verificació en viu, en un clic. Cada una,
   ancorada al codi d'este build o a una prova que la reproduïx. */
describe('01-11-2026 · fet hui, verificable, i enllaçat en un clic', () => {
  test('partida 1: el connector de WordPress.org i el node viu que el fa servir', () => {
    const fet1 = apartat(0, 'Fet hui (verificable)');
    expect(fet1).toContain('El connector oficial per a WordPress, publicat i actiu al directori de WordPress.org en la versió 1.1.12 (wordpress.org/plugins/socdepoble), i un node viu que el fa servir, gentdelatorre.net, el de Gent de la Torre: la mateixa aplicació en una web de WordPress, amb el mateix servidor de dades (Model B).');
    const li = elementAmb('El connector oficial per a WordPress');
    expect([...li.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.getAttribute('target'), a.getAttribute('rel')]))
      .toEqual([[WORDPRESS, '_blank', 'noopener noreferrer'], ['https://gentdelatorre.net', '_blank', 'noopener noreferrer']]);
    expect(canalsOberts().map((canal) => canal.url)).toContain(WORDPRESS);
    // El que no està fet es queda a «Pendent»: cap instal·lació administra més d'un poble.
    expect(apartat(0, 'Pendent')).toContain("Administrar més d'un poble des de la mateixa instal·lació: hui cada instal·lació es configura per a un sol poble.");
    expect(apartat(0, 'Pendent')).toContain("Evolucionar l'adaptador local, src/data/local/, com a compromís estratègic de la beca NLnet, cap a una arquitectura 100% fora de línia i local primer per al món rural. Guardarà les dades al dispositiu amb IndexedDB i SQLite, amb una cua d'operacions encadenades amb SHA-256 fora de línia i sincronització determinista per a pobles de muntanya sense cobertura.");
    /* Ordre 261103_0522 (Gauntlet O7-9, ronda 3; P3-CUA-08) · La cua de src/data/local/ encadena
       hashos SHA-256 sense cap clau: integritat, no autenticitat. Res de «signades». */
    expect(PAGE_COPY.fediversity.html).not.toMatch(/operacions signad/);
  });

  test('partida 2: les comprovacions automàtiques d’accessibilitat són les que hi ha al repositori', () => {
    const li = elementAmb("Comprovacions automàtiques d'accessibilitat");
    const frase = li.textContent.replace(/\s+/g, ' ');
    expect(apartat(1, 'Fet hui (verificable)')).toContain(frase);
    // Les proves de contrast: 7:1 per al títol, el cos i el text suau, sobre els quatre fons.
    const tokens = llegix('src/css/tokens.contracte.test.js');
    expect(tokens).toContain("const SUPERFICIES = ['--sdp-fons-targeta', '--sdp-fons-app', '--sdp-fons-subtil', '--sdp-fons-lectura'];");
    expect(tokens).toContain("for (const text of ['--sdp-text-titol', '--sdp-text-cos', '--sdp-text-suau'])");
    expect(tokens).toMatch(/toBeGreaterThanOrEqual\(7\)/);
    expect(frase).toContain("contrast d'almenys 7:1 als tres colors de text del sistema (títol, cos i text suau) sobre els seus quatre fons principals (src/css/tokens.contracte.test.js)");
    // La porta de disseny: colors, lletra, botons de menys de 44 px i focus amagat.
    const guarda = senseComentaris(llegix('tooling/gates/design_guard.mjs'));
    for (const regla of ['RAW_HEX', 'FONT_SMALL', 'TOUCH_SIZE', 'FOCUS_NONE', 'px < 44']) expect([regla, guarda.includes(regla)]).toEqual([regla, true]);
    expect(frase).toContain('la porta de disseny tooling/gates/design_guard.mjs busca al codi colors fora del sistema, lletra massa menuda, botons de menys de 44 píxels i el focus amagat');
    // Cap eina que no existix: wcag_contrast_audit.mjs només es pot nomenar si hi és.
    const auditoria = readdirSync(path.join(ARREL, 'tooling'), { recursive: true }).map(String).some((fitxer) => /wcag_contrast_audit/.test(fitxer));
    if (!auditoria) expect(copy.html).not.toContain('wcag_contrast_audit');
  });

  test('partida 4: la prova d’integració de l’instal·lador diu el que fa, i el defecte conegut es queda a «Pendent»', () => {
    const fet4 = apartat(3, 'Fet hui (verificable)');
    const pendent4 = apartat(3, 'Pendent');
    const prova = llegix('tests/inicia-node-germa.test.mjs');
    /* La prova executa la CLI de veres per a Xixona, en un mkdtemp, amb la release de HEAD extreta
       amb git archive (Gauntlet 261101, B4-G05), i genera la federació del node. */
    for (const peca of ["slug: 'xixona'", 'mkdtempSync(path.join(os.tmpdir()', 'tooling/instalador/inicia-node-germa.mjs', 'genera-federacio.mjs', "stdio: ['ignore', 'pipe', 'pipe']", 'SECRET', "'archive'", "'HEAD'"]) {
      expect([peca, prova.includes(peca)]).toEqual([peca, true]);
    }
    expect(fet4).toContain("Una prova d'integració de l'instal·lador de nodes germans (tests/inicia-node-germa.test.mjs): executa tooling/instalador/inicia-node-germa.mjs sense cap pregunta, amb l'última versió confirmada d'este repositori (HEAD, extreta amb git archive), per a un segon poble de prova, Xixona, en una carpeta temporal.");
    expect(fet4).toContain("Comprova que cada fitxer d'eixa versió arriba al node nou amb la seua empremta SHA-256, que cap clau secreta no viatja al node nou i que la federació que publicaria el node (NodeInfo 2.1, host-meta i WebFinger) porta l'origen del poble nou.");
    // Gauntlet 261101 (B4-G04) · Ni «punta a punta» ni «el repositori queda intacte»: la prova no compila ni servix cap web.
    expect(fet4).not.toMatch(/punta a punta|repositori queda intacte/);
    // La guia curta que deixa l'instal·lador al node nou, i que la prova no executa.
    expect(llegix('tooling/instalador/inicia-node-germa.mjs')).toMatch(/writeFileSync\(path\.join\(target,'INICIA_NODE\.md'\)/);
    expect(fet4).toContain("L'instal·lador hi deixa una guia curta, INICIA_NODE.md, amb els passos per a compilar-lo i publicar-lo; la prova no els executa.");
    // El defecte que la prova fixa (el node encara hereta La Torre) es diu a «Pendent» mentre la prova el fixe.
    const defecte = /test\('\[DEFECTE\] el node de Xixona encara hereta La Torre/.test(prova);
    expect(concorda(defecte, /publica el seu propi poble al Fedivers(?!: encara no)/.test(fet4),
      pendent4.includes("el node nou encara hereta de la versió l'actor federat de La Torre de les Maçanes i les regles de WebFinger de socdepoble.org: encara no publica el seu propi poble al Fedivers"))).toBe(true);
    // Ni la compilació d'una còpia real ni Nix ni cap node independent: la prova no executa npm ni Nix.
    expect(prova).not.toMatch(/spawnSync\([^)]*['"](?:npm|nix)['"]/);
    expect(pendent4).toContain("Encara no s'ha provat la compilació d'una còpia real, ni s'ha verificat amb Nix ni s'ha desplegat cap node independent.");
  });

  /* Carrils B1, B2 i B3 de la marató (01-11-2026) · Cada frase, ancorada al seu codi. */
  /* T2 · D04/D10 (assalt 261101) · La 1.2.0 (memòria oral) i el Pendent nou. */
  test('partida 3: el format 1.2.0 de les dades obertes, i el que encara no s’exporta', async () => {
    const { VERSIO_FORMAT } = await import('../../data/exportaMunicipiOpenData.js');
    expect(VERSIO_FORMAT).toBe('1.2.0');
    const opendata = llegix('src/data/exportaMunicipiOpenData.js');
    for (const peca of ["'@type': 'NewsArticle'", "'@type': 'Event'", "'@type': 'CreativeWork'", "'BEGIN:VCALENDAR'", "mediatype: 'text/calendar'"]) expect([peca, opendata.includes(peca)]).toEqual([peca, true]);
    expect(apartat(2, 'Pendent')).toContain("Exportar també la memòria cultural i les fitxes de memòria oral revisades de cada poble: el format del paquet ja les sap escriure (memòria CreativeWork i fitxes en Open Knowledge Format v0.2), però Sóc de Poble no té cap mòdul de memòria cultural i el servidor de dades encara no desa cap fitxa de memòria oral revisada. Tornar a carregar un paquet en el servidor de dades de producció també és pendent: hui només el restaura, a les proves, l'adaptador local.");
    for (const peca of ["nom: 'memoria-oral.jsonld'", 'markdownOkf(', "nom: 'okf/index.md'"]) expect([peca, opendata.includes(peca)]).toEqual([peca, true]);
    // Els motius, els mateixos que el paquet escriu a la seua memòria.
    expect(opendata).toContain("encara no hi ha cap lectura pública garantida d'estes dades");
    expect(opendata).toContain('el Mas no té cap mòdul de memòria cultural');
    expect(opendata).toContain('el servidor de dades encara no desa cap fitxa de memòria oral revisada');
    // «Hui només el restaura, a les proves, l'adaptador local»: Supabase no exporta restauraDadesObertes; l'adaptador local, sí (H4-06: cap pantalla l'importa, prova P1-23).
    expect(senseComentaris(llegix('src/data/supabase/index.js'))).not.toContain('restauraDadesObertes');
  });

  test('partida 3: l’estructurador local de memòria oral, sense model, amb el botó del Bloc de Notes si el Bloc el porta; el Mètode Karpathy amb models no existix', async () => {
    const fet3 = apartat(2, 'Fet hui (verificable)');
    const memoria = await import('../notes/memoriaOral.js');
    expect([memoria.OKF_VERSIO, typeof memoria.estructuraMemoriaOral, typeof memoria.marcaRevisioHumana]).toEqual(['0.2', 'function', 'function']);
    // Determinista i sense xarxa ni models: cap import de fora, cap fetch.
    const codi = senseComentaris(llegix('src/sections/notes/memoriaOral.js'));
    expect([...codi.matchAll(/from '([^']+)'/g)].map((m) => m[1]).every((font) => font.startsWith('./') || font.startsWith('../'))).toBe(true);
    expect(codi).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket|openai|anthropic|gemini/i);
    // La fitxa naix en esborrany i sense «verified»; només marcaRevisioHumana la promou.
    const relat = 'La iaia contava que a la Torre de les Maçanes, quan arribava la collita de les olives, tot el poble anava a l’almàssera i les xiquetes portaven el berenar als bancals de dalt.';
    const fitxa = memoria.estructuraMemoriaOral(relat);
    expect(JSON.stringify(fitxa)).toMatch(/"status":"draft"/);
    expect(JSON.stringify(fitxa)).not.toMatch(/"verified"/);
    expect(fet3).toContain("i una fitxa en Open Knowledge Format (OKF v0.2) en esborrany, que només una persona pot donar per revisada. Pren l'esquema del Mètode Karpathy sense cap model de llenguatge: és determinista i no fa servir ni xarxa ni tòkens.");
    // «Cap botó propi» mentre cap peça de l'aplicació no la crida.
    const src = path.join(ARREL, 'src');
    const quiLaCrida = readdirSync(src, { recursive: true }).map(String)
      .filter((fitxer) => /\.(?:js|jsx)$/.test(fitxer) && !/\.test\.(?:js|jsx)$/.test(fitxer) && !/notes\/(?:memoriaOral|proposaCard)\.js$/.test(fitxer))
      .filter((fitxer) => /\bestructuraMemoriaOral\(/.test(senseComentaris(readFileSync(path.join(src, fitxer), 'utf8'))));
    /* T3.2-UI (261101) · El botó és «Proposa Card» del Bloc de Notes: el Bloc
       passa l'adaptador (memoriaOralDelBloc.js, que la crida) i l'editor obri
       la fitxa (FitxaMemoriaOral), amb la revisió i la descàrrega. */
    const ambBoto = quiLaCrida.some((fitxer) => /notes\/memoriaOralDelBloc\.js$/.test(fitxer))
      && /\bmemoriaOral: citaOrigen \? null : memoriaOral\b/.test(senseComentaris(llegix('src/sections/notes/NotesEditor.jsx')))
      && /<FitxaMemoriaOral\b/.test(llegix('src/components/universal/DocumentEditor.jsx'))
      && ['marcaRevisioHumana(', 'estructuraMemoriaOral('].every((crida) => senseComentaris(llegix('src/sections/notes/memoriaOralDelBloc.js')).includes(crida))
      && ['createObjectURL(', '.download = ', '<AreaText'].every((peca) => llegix('src/components/universal/FitxaMemoriaOral.jsx').includes(peca));
    const FRASE_BOTO = "Al Bloc de Notes, el botó «Proposa Card» n'obri la fitxa de la nota oberta: hi mostra el títol, el poble detectat, les etiquetes i els avisos; qui ha entrat amb el seu compte la pot donar per revisada, i es descarrega com a fitxer Markdown (dins de l'app per a mòbil, se'n copia el text).";
    expect(concorda(ambBoto, fet3.includes('Encara no té cap botó propi a l\'aplicació.'), fet3.includes(FRASE_BOTO))).toBe(true);
    // El Mètode Karpathy de la candidatura, amb models de llenguatge: no existix.
    expect(apartat(2, 'Pendent')).toContain('Mètode Karpathy amb models de llenguatge, per a processar, ordenar i etiquetar la memòria oral de la gent gran: no existix. Ni l\'estructurador local ni la IAIA local no en fan servir cap.');
  });

  test('partida 3: les alertes municipals del Mur són les que pinta el Mur, i només d’un ajuntament', async () => {
    const fet3 = apartat(2, 'Fet hui (verificable)');
    const alertes = await import('../mur/alertesMunicipals.js');
    expect(Object.values(alertes.TIPUS_ALERTA).map((tipus) => tipus.text)).toEqual(['Alerta municipal', 'Bàndol urgent']);
    expect(alertes.VIGENCIA_ALERTA_MS).toBe(72 * 60 * 60 * 1000);
    expect(['Alerta', 'Emergència', 'Bàndol urgent'].map((etiqueta) => alertes.normalitzaEtiqueta(etiqueta))).toEqual(['alerta', 'emergencia', 'bandol_urgent']);
    // Signada per un ajuntament, alerta; per una altra entitat o per un veí amb la mateixa etiqueta, res.
    const publicacio = (camps) => ({ id: 'p', type: 'feed', title: 'Avís', ...camps });
    const esAjuntament = (id) => id === 'ajuntament';
    expect([
      alertes.alertaMunicipalDe(publicacio({ labels: ['Emergència'], author_org_id: 'ajuntament' }), esAjuntament),
      alertes.alertaMunicipalDe(publicacio({ labels: ['Bàndol urgent'], author_org_id: 'ajuntament' }), esAjuntament),
      alertes.alertaMunicipalDe(publicacio({ labels: ['Alerta'], author_org_id: 'forn' }), esAjuntament),
      alertes.alertaMunicipalDe(publicacio({ labels: ['Alerta'], ownerUserId: 'u-vei' }), () => true)
    ]).toEqual(['alerta', 'bandol_urgent', null, null]);
    const mur = senseComentaris(llegix('src/sections/mur/MurSection.jsx'));
    for (const peca of ['alertaMunicipalDe(', 'vigentsDalt(', '<RegioAlertesVigents', 'useAjuntamentsDelMur(']) expect([peca, mur.includes(peca)]).toEqual([peca, true]);
    expect(senseComentaris(llegix('src/sections/mur/TargetaDelMur.jsx'))).toMatch(/<DistintiuAlertaMunicipal\b/);
    /* Gauntlet 261101 (A-03) · «fins a 72 hores després de la seua data» val també per a una
       data futura, que esVigent dona per vigent: si el codi posa un límit a les futures, cau. */
    const ara = Date.UTC(2026, 10, 1, 12);
    const hores = (n) => n * 60 * 60 * 1000;
    expect([hores(71), hores(73), -hores(365 * 24)].map((fa) => alertes.esVigent(ara - fa, ara))).toEqual([true, false, true]);
    expect(fet3).toContain("quan un ajuntament signa una publicació amb l'etiqueta «Alerta», «Emergència» o «Bàndol urgent», la seua targeta porta el distintiu «Alerta municipal» o «Bàndol urgent» i, fins a 72 hores després de la seua data, puja al capdamunt del Mur amb un avís que la nomena. La mateixa etiqueta posada per un veí no fa cap alerta.");
    expect(fet3).not.toContain('durant 72 hores');
    expect(apartat(2, 'Pendent')).not.toMatch(/alertes d'emergència/);
  });

  test('verificació en viu: el connector, el node germà i cada adreça de federació, en un clic i amb l’adreça absoluta', () => {
    const [, , verificacio] = doc.querySelectorAll('h3');
    const enllacos = [];
    for (let node = verificacio.nextElementSibling; node; node = node.nextElementSibling) enllacos.push(...node.querySelectorAll('a[href^="https://"]'));
    expect(enllacos.map((a) => a.getAttribute('href'))).toEqual([WORDPRESS, 'https://gentdelatorre.net', ...ENDPOINTS_FEDERACIO()]);
    for (const a of enllacos) expect([a.getAttribute('href'), a.getAttribute('target'), a.getAttribute('rel')]).toEqual([a.getAttribute('href'), '_blank', 'noopener noreferrer']);
    /* Cada adreça de federació porta el seu camí com a text de l'enllaç, sense <code> (Gauntlet
       261101, A-05): la píndola del codi imposava el seu color dins de l'enllaç. */
    for (const a of enllacos.slice(2)) expect([a.textContent, a.querySelector('code')]).toEqual([a.getAttribute('href').replace(ORIGEN, ''), null]);
    // Mai la ruta del pla que dona 404, ni cap consulta ?resource= (Firebase no l'encamina).
    expect(copy.html).not.toContain('/ap/actors/la-torre-de-les-macanes/outbox.json');
    expect(copy.html).not.toContain('webfinger?resource=');
    // Les rutes, les que publica el build: NodeInfo (federacio-iaia.mjs) i host-meta (genera-federacio.mjs).
    const iaia = llegix('tooling/vite/federacio-iaia.mjs');
    expect(iaia).toContain("export const RUTA_NODEINFO = '/.well-known/nodeinfo';");
    expect(iaia).toContain("export const RUTA_NODEINFO_21 = '/nodeinfo/2.1.json';");
    expect(llegix('tooling/seo/genera-federacio.mjs')).toMatch(/host-meta/);
    /* D05 (pla 261101_1246, carril T3) · La bústia de La Torre porta sempre la pàgina pública del poble
       (paginaDelPoble de genera-federacio.mjs; la seua prova lliga esta frase al generador) i ja no pot estar buida. */
    const bustiaTorre = textDe([...doc.querySelectorAll('li')].filter((li) => li.textContent.includes('/ap/outbox/la-torre-de-les-macanes.json')));
    expect(bustiaTorre).toContain("La de La Torre porta la pàgina pública del poble i, quan n'hi ha, les publicacions públiques d'entitats del poble.");
    expect(bustiaTorre).not.toContain('pot estar buida');
    // I la descàrrega de les dades obertes, des de Pobles.
    expect(elementAmb('Des de la fitxa de cada poble es descarrega').querySelector('a').getAttribute('href')).toBe('/pobles');
  });

  /* O4-CLAUDE-2 (ordre del Mestre, 261102 21:38) · Al final de la verificació en viu, els sis
     fitxers del paquet de dades obertes estàtic, en relatiu i amb el mateix estil que les adreces
     de federació (el camí com a text, en una pestanya nova), darrere d'una frase que diu què són.
     Cada fitxer és al disc (public/) i, menys el manifest mateix, al manifest del paquet: la
     mateixa regla que certifica-enllacos.mjs (OPENDATA_404 i OPENDATA_FORA_MANIFEST). */
  test('verificació en viu: el paquet de dades obertes estàtic, sis fitxers que existixen, en relatiu', () => {
    const [, , verificacio] = doc.querySelectorAll('h3');
    const enllacos = [];
    for (let node = verificacio.nextElementSibling; node; node = node.nextElementSibling) enllacos.push(...node.querySelectorAll('a[href^="/opendata/"]'));
    expect(enllacos.map((a) => a.getAttribute('href'))).toEqual(OPENDATA);
    expect([...doc.querySelectorAll('a[href*="opendata"]')]).toHaveLength(OPENDATA.length);
    for (const a of enllacos) {
      expect([a.textContent, a.getAttribute('target'), a.getAttribute('rel'), a.querySelector('code')]).toEqual([a.getAttribute('href'), '_blank', 'noopener noreferrer', null]);
    }
    const llista = enllacos[0].closest('ul');
    expect(enllacos.every((a) => a.closest('ul') === llista)).toBe(true);
    expect(llista.previousElementSibling.textContent).toBe('I estos obrin el paquet de dades obertes estàtic de La Torre de les Maçanes, els fitxers que el lloc web publica tal qual:');
    // L'últim apartat de la pàgina, darrere de les adreces de federació i abans del tancament.
    expect(llista.nextElementSibling.textContent).toMatch(/^Esta pàgina canvia quan canvia el codi\./);
    const manifest = JSON.parse(llegix('public/opendata/manifest.json'));
    const camins = new Set(manifest.resources.map((recurs) => recurs.path));
    for (const href of OPENDATA) {
      expect([href, existix(`public${href}`)]).toEqual([href, true]);
      if (href !== '/opendata/manifest.json') expect([href, camins.has(href.replace('/opendata/', ''))]).toEqual([href, true]);
    }
    expect(copy.html).not.toMatch(/mercat\.jsonld|llocs\.geojson/);
    /* C2-09 (àrbitre) · La frase segons el paquet de veres: amb les notícies i l'agenda a 0
       (manifest.socdepoble.comptes, i la memòria diu «No s'exporta en esta versió»), la pàgina
       diu que ixen buits; amb elements, ho hauria de dir al revés. */
    const { noticies, agenda } = manifest.socdepoble.comptes;
    const memoria = llegix('public/opendata/memoria.md');
    const frase = elementAmb('/opendata/noticies.jsonld').textContent;
    expect(frase).toContain("les notícies i els actes de l'agenda públics.");
    expect(frase).not.toContain("quan n'hi ha");
    expect(frase.includes('En esta versió del paquet estàtic, tots dos ixen buits: la memòria diu per què.')).toBe(noticies === 0 && agenda === 0);
    expect([noticies, agenda].map((compte) => memoria.includes(`(${compte})\n\nNo s'exporta en esta versió`))).toEqual([noticies === 0, agenda === 0]);
  });
});

/* Gauntlet 2 261101 (carril Y; correcció del crític) · El comentari de PAGE_COPY.fediversity deia que
   «tot això ja és desplegat i verificat en viu (01-11-2026, 04:05 CET)», i el lloc publicat servia
   un build anterior a la marató (01:39 CET): les alertes, la fitxa OKF, l'Open Data 1.1.0 i esta
   versió de la pàgina hi arriben amb el pròxim desplegament. I la pàgina diu que «el registre de
   canvis és a Versions»: /versions ha de portar l'entrega de l'1 de novembre. */
describe('Gauntlet 2 · el comentari del desplegament i el registre de canvis', () => {
  test('el comentari separa el que és al lloc publicat del que arriba amb el pròxim desplegament', () => {
    const font = llegix('src/sections/text/pageContent.js');
    const clau = font.indexOf('  "fediversity": {');
    const comentari = font.slice(font.lastIndexOf('/*', clau), clau).replace(/\s+/g, ' ');
    /* La frase vella només hi pot quedar citada, dins de la correcció que la desmentix. */
    expect(comentari).toContain('Este comentari deia que «tot això ja és desplegat i verificat en viu (01-11-2026, 04:05 CET)», i només n\'és una part.');
    expect(comentari.replace(/Este comentari deia que «[^»]*»/, '')).not.toContain('tot això ja és desplegat i verificat en viu');
    expect(comentari).toContain('El lloc publicat servix el build de l\'01-11-2026 a les 01:39 CET');
    expect(comentari).toMatch(/NO hi són encara, i arriben amb el pròxim desplegament d'este arbre/);
    for (const peca of ['les alertes municipals del Mur', 'la fitxa de memòria oral OKF', "el format 1.1.0 de l'Open Data (agenda.ics)"]) {
      expect(comentari).toContain(peca);
    }
    expect(comentari).toContain('el correu a NLnet ha d\'anar després');
  });

  test('«El registre de canvis és a Versions»: /versions porta l’entrega de l’1 de novembre, pendent de desplegar', () => {
    expect(textDe([doc.body])).toContain('El registre de canvis és a Versions');
    /* O6 (ordre del Mestre, prompt 261102_1532; prova posada al dia a propòsit) · L'entrega de l'1 de
       novembre porta ara la seua numeració pròpia, v1.0.3 (abans, totes deien v1.0.0); continua
       pendent de desplegar i amb el connector 1.1.10. */
    expect(PAGE_COPY.versions.html).toContain('<h3>1 de novembre de 2026 · v1.0.3 (build pendent de desplegar) · Connector WordPress v1.1.10</h3>');
  });

  /* Gauntlet O7-9, ronda 2 (PC-03, O8-PORT-03, O89-RURAL-12; ordre del Mestre 261103_0522) · El pilot
     «Node 0 La Torre de les Maçanes» està en preparació amb el maquinari que ja és al poble: la pàgina en
     diu l'arquitectura prevista, sense cap xifra que no estiga mesurada (el «4 W en repòs») ni cap «ja
     operatiu». Cada camí del repositori que cita la pàgina existix (la versió anterior en citava set que
     no). Els mòduls que cap pantalla no importa no ixen a «Fet hui», com el xifratge («codi i proves,
     apagat»), i la signatura no hi ix com a FEP-8b32 mentre codifique la prova en base64url: si una
     pantalla els importa, si desapareixen o si el motor canvia de format, la prova cau i el text s'ha
     de tornar a escriure. */
  test('Node 0: pilot en preparació, sense xifres sense mesura; a «Fet hui» només el que l’app fa servir i existix', () => {
    const visio = textDe(seccio([...doc.querySelectorAll('h4')].find((h) => h.textContent === 'La visió: nodes germans «Gent de…»')));
    expect(visio).toContain('pilot comunitari «Node 0 La Torre de les Maçanes», que està en preparació amb el maquinari disponible al poble: un Mac Mini amb processador Apple M4 i 24 GB de memòria unificada.');
    expect(visio).toContain('Mentre el pilot no estiga en servei, esta pàgina no en dona cap xifra de consum ni de càrrega: encara no hi ha cap mesura.');
    expect(apartat(0, 'Pendent')).toContain('Posar en servei el pilot «Node 0 La Torre de les Maçanes», el primer node independent, en el Mac Mini que ja és al poble');
    expect(text).not.toMatch(/\d\s?W\b|en repòs|ja (?:és|està) operatiu|NVMe/);
    // Cada camí del repositori que cita la pàgina existix.
    const camins = [...doc.querySelectorAll('code')].map((code) => code.textContent).filter((cami) => /^(?:src|tests|tooling|wordpress-plugin|public)\//.test(cami));
    expect(camins.length).toBeGreaterThan(5);
    expect(camins.filter((cami) => !existix(cami))).toEqual([]);
    // Els tres mòduls de les Onades 7-9: cap fitxer de src/ de fora de la família els importa.
    const familia = {
      portabilitatFediversity: 'src/data/federacio/portabilitatFediversity.js',
      pontEmergenciaRural: 'src/data/local/pontEmergenciaRural.js',
      sincronitzadorCarpetaLocal: 'src/data/local/sincronitzadorCarpetaLocal.js'
    };
    const src = path.join(ARREL, 'src');
    const fonts = readdirSync(src, { recursive: true }).map((fitxer) => String(fitxer).split(path.sep).join('/'))
      .filter((fitxer) => /\.(?:js|jsx)$/.test(fitxer) && !/\.test\.(?:js|jsx)$/.test(fitxer) && !Object.values(familia).includes(`src/${fitxer}`));
    const connectats = Object.keys(familia).filter((nom) => fonts.some((fitxer) => importaElModul(readFileSync(path.join(src, fitxer), 'utf8'), nom, fitxer)));
    expect(connectats).toEqual([]);
    for (const [nom, rel] of Object.entries(familia)) {
      expect([rel, existix(rel)]).toEqual([rel, true]);
      for (const i of [0, 1, 2, 3]) expect([nom, i, apartat(i, 'Fet hui (verificable)').includes(rel)]).toEqual([nom, i, false]);
      expect([nom, apartat(0, 'Pendent').includes(rel)]).toEqual([nom, true]);
    }
    expect(apartat(0, 'Pendent')).toContain("el codi i les seues proves per a intercanviar alertes i notes amb empremta SHA-256 són al repositori, però cap pantalla de l'aplicació no els fa servir encara.");
    // FEP-8b32 (eddsa-jcs-2022) mana base58-btc («z…»): mentre el motor codifique la prova en base64url («u…»), no la complix.
    expect(/const proofValue = `u\$\{codificaBase64Url\(/.test(senseComentaris(llegix(familia.portabilitatFediversity)))).toBe(true);
    for (const i of [0, 1, 2, 3]) expect([i, apartat(i, 'Fet hui (verificable)').includes('FEP-8b32')]).toEqual([i, false]);
    expect(apartat(0, 'Pendent')).toContain("la signatura encara no passa els vectors oficials del W3C: codifica la prova en base64url, i l'especificació mana base58-btc.");
  });
});
