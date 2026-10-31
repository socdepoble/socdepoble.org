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
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { PAGE_COPY } from './pageContent.js';
import { TITOL_GOVERN } from '../consola/govern/governConsola.js';
import { CONTRACTE_NUCLI } from '../../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../../data/backendPort.js';
import { getSessionState } from '../../data/sessionService.js';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';
import { SUPPORTED_LANGUAGES } from '../../config/i18n.js';
import { SECTIONS } from '../../config/sections.js';
import { VARIANTS_SOCIALS } from '../../config/imatgeSocial.js';
import * as lliure from '../../data/traductorLliure.js';
import { importaElModul } from '../../../tests/helpers/especificadorsImport.js';

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

const ARREL = process.cwd();
const copy = PAGE_COPY.fediversity;
const doc = new DOMParser().parseFromString(copy.html, 'text/html');
const text = doc.body.textContent.replace(/\s+/g, ' ');
/* Les quatre partides (H4 «n · …») i el que hi ha davall de cadascuna fins al
   pròxim H1-H4 o a la panoràmica: el cos és pla, tot germà del <body>. */
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
    // Cap estil ni color nou: l'única classe és la del logotip (page-title-logo, layout.css).
    expect(copy.html).not.toMatch(/\sstyle=/);
    expect([...copy.html.matchAll(/\sclass="([^"]*)"/g)].map((m) => m[1])).toEqual(['page-title-logo']);
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
  test('en avaluació: cap diner rebut, cap emblema de la UE, i només els quatre enllaços de fora autoritzats', () => {
    expect(copy.lead).toContain("està en avaluació: encara no s'ha concedit cap diner");
    expect(text).toContain('candidatura està en avaluació');
    expect(text).toContain("Candidatura en fase d'avaluació (Expedient 2026-08-1a6)");
    expect(`${copy.lead} ${text}`).not.toMatch(/subvenció concedida|hem rebut|ens han concedit|finançat per la Unió|amb el finançament de/i);
    // Ordres del Mestre de les ~00:50 (els nodes) i de les ~01:00 (la convocatòria i la fundació).
    // 31-10-2026 · i la fitxa del connector al directori de WordPress.org (ordre del Mestre, Ronda 1).
    const autoritzats = new Set(['https://nlnet.nl/fediversity/', 'https://nlnet.nl/', 'https://socdepoble.org', 'https://gentdelatorre.net', 'https://wordpress.org/plugins/socdepoble/']);
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

  test('els nodes actius: dos, clicables, i dues portes al mateix servei (Model B), sense ActivityPub encara', () => {
    const h4 = [...doc.querySelectorAll('h4')].filter((h) => !/^\d · /.test(h.textContent));
    expect(h4.map((h) => h.textContent)).toEqual(['Els nodes actius del Fedivers de Sóc de Poble', 'La visió: nodes germans «Gent de…»']);
    // Dins del primer H3: cap H4 salta de nivell.
    const capcaleres = [...doc.querySelectorAll('h3, h4')].map((h) => h.tagName);
    expect(capcaleres.slice(0, 3)).toEqual(['H3', 'H4', 'H4']);
    const nodes = [...doc.querySelectorAll('a[href="https://socdepoble.org"], a[href="https://gentdelatorre.net"]')];
    expect(nodes.map((a) => [a.getAttribute('href'), a.textContent, a.getAttribute('target'), a.getAttribute('rel')])).toEqual([
      ['https://socdepoble.org', 'socdepoble.org', '_blank', 'noopener noreferrer'],
      ['https://gentdelatorre.net', 'gentdelatorre.net', '_blank', 'noopener noreferrer']
    ]);
    expect(text).toContain('hui són dues portes al mateix servei: la mateixa aplicació i el mateix servidor de dades de Sóc de Poble, segons el Model B');
    expect(text).toContain('Encara no parlen ActivityPub entre ells');
  });

  test('la visió «Gent de…»: Gent de la Torre ja és actiu; la resta, intenció i sense cap domini inventat', () => {
    for (const poble of ['Gent de Xixona', 'Gent de Relleu', 'Gent de Tibi', "Gent d'Alcoleja", 'Gent de Penàguila']) expect([poble, text.includes(poble)]).toEqual([poble, true]);
    expect(text).toContain('Gent de la Torre ja és actiu');
    expect(text).toContain('Hui encara no tenen node propi');
    expect(copy.html).not.toMatch(/gentde(?!latorre)[a-z]+\.|\.(?:cat|es|eu|com)\b/i);
    /* 31-10-2026 · WordPress.org ha aprovat l'slug socdepoble (el repositori
       https://plugins.svn.wordpress.org/socdepoble/ existix), però fins al primer
       commit SVN api.wordpress.org diu «Plugin not found»: la pàgina diu
       l'aprovació, enllaça la fitxa i no diu que ja s'hi puga instal·lar. */
    expect(text).toContain('el directori oficial de connectors de WordPress.org ja ha aprovat el connector de Sóc de Poble, amb el nom socdepoble');
    expect(text).toContain("s'obri a tothom amb la primera versió que hi publiquem");
    expect(text).not.toContain('encara no és al directori');
    expect(text).not.toMatch(/ja es pot (?:descarregar|instal·lar)[^.]*WordPress\.org/i);
    const fitxa = doc.querySelector('a[href="https://wordpress.org/plugins/socdepoble/"]');
    expect([fitxa?.textContent, fitxa?.getAttribute('target'), fitxa?.getAttribute('rel')]).toEqual(['wordpress.org/plugins/socdepoble', '_blank', 'noopener noreferrer']);
  });

  test('alineada amb PAGE_COPY.fedivers: els mateixos dos nodes i la mateixa visió, i el Fedivers continua sense fer', () => {
    const fedivers = PAGE_COPY.fedivers.html;
    for (const tros of ['<strong>socdepoble.org</strong>', '<strong>gentdelatorre.net</strong>', 'Gent de Xixona', 'Gent de Relleu', 'Gent de Tibi', 'Gent d’Alcoleja', 'Gent de Penàguila', 'Hui encara no està fet']) {
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
  test('P1-23: Open Data, ActivityPub, flake.nix i l’instal·lador. «No existix» només mentre no existixen', () => {
    const tercera = apartat(2, 'Pendent');
    const quarta = apartat(3, 'Pendent');
    const casa = (existeix, noExistix, enCurs) => (existeix ? enCurs && !noExistix : noExistix);
    expect(casa(existix('src/data/exportaMunicipiOpenData.js'),
      /Exportació Open Data per municipi[^:]*: no existix/.test(tercera), /Exportació Open Data per municipi[^:]*: en curs/.test(tercera))).toBe(true);
    expect(casa(existix('src/data/activitypub.js'),
      /Federació ActivityPub i WebFinger[^:]*: no existix/.test(tercera), /Federació ActivityPub i WebFinger[^:]*: en curs/.test(tercera))).toBe(true);
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
  test('P1-23: el que diu de l’Open Data i d’ActivityPub és el que hi ha al repositori', () => {
    const tercera = apartat(2, 'Pendent');
    expect(tercera).toContain('les dades públiques del poble, amb les seues llicències');
    expect(tercera).not.toMatch(/totes les dades/);
    const opendata = readFileSync(path.join(ARREL, 'src/data/exportaMunicipiOpenData.js'), 'utf8');
    for (const peca of ['export async function exportaMunicipiOpenData(', 'export async function verificaPaquetOpenData(', 'data/llicencies.md']) expect([peca, opendata.includes(peca)]).toEqual([peca, true]);
    expect(existix('src/data/exportaMunicipiOpenData.test.js')).toBe(true);
    expect(tercera).toContain('El generador del paquet i el seu verificador ja són al repositori, amb proves, però encara no es pot descarregar des de l\'aplicació');
    // «Encara no es pot descarregar»: cap mòdul de l'app (fora de les proves) no importa el generador.
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
    expect(quiLImporta).toEqual([]);
    // ActivityPub: la fase 1 (lectura) i les seues proves, al repositori.
    for (const fitxer of ['src/data/activitypub.js', 'src/data/activitypub.test.js', 'tooling/seo/genera-federacio.mjs', 'tooling/seo/genera-federacio.test.mjs']) expect([fitxer, existix(fitxer)]).toEqual([fitxer, true]);
    expect(tercera).toContain('La primera fase, només de lectura, ja és al repositori, amb proves');
    expect(tercera).not.toMatch(/S'està escrivint/);
    /* Cicle 2 (fediversity-estats-falsos-en-el-mateix-build) · DEROGA «però
       encara no està publicada»: el build web que porta esta pàgina publica
       /ap/ (vite.config.js registra federacioIaia, que emet ap/** al
       generateBundle, i firebase.json servix /ap/**). Publicada o no ho diu
       este build, no el desplegament. WebFinger al lloc estàtic, vegeu el bloc
       de sota; les seues regles per a un servidor propi són a flake.nix. */
    const publicaAp = /\bfederacioIaia\(/.test(senseComentaris(llegix('vite.config.js'))) && llegix('firebase.json').includes('"source": "/ap/**"');
    expect(concorda(publicaAp, /no està publicada|no es publica/.test(tercera), tercera.includes("el lloc web publica a /ap/ els documents d'ActivityPub de Sóc de Poble i dels pobles de mostra"))).toBe(true);
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
    expect(concorda(webfingerEstatic, /encara no les respon socdepoble\.org/.test(tercera), tercera.includes('socdepoble.org publica la via alternativa que consulta Mastodon, el document host-meta, '
      + 'perquè es puguen trobar @socdepoble@socdepoble.org i @la-torre-de-les-macanes@socdepoble.org, que també es troba com a @latorredelesmacanes@socdepoble.org'))).toBe(true);
    expect(tercera).toContain('Els pobles de mostra no es poden trobar així');
    expect(tercera).toContain("Encara no s'ha provat amb un servidor de Mastodon de veres");
    expect(tercera.includes("les regles per a un servidor propi (flake.nix) encara no s'han verificat amb Nix")).toBe(/\/\.well-known\/webfinger/.test(llegix('flake.nix')));
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
  test('el traductor i les fletxes: la partida 2 diu el que fa este mateix build, i cap «Fet hui» les promet', () => {
    const segona = apartat(1, 'Pendent');
    const fletxes = elementAmb('(IDEA-58)');
    const traductor = elementAmb('(IDEA-31)');
    expect([Boolean(fletxes), Boolean(traductor)]).toEqual([true, true]);
    // IDEA-58: les columnes de l'espai de treball (UniversalWorkspace) pengen les fletxes, i Disseny i la Wiki de Poble el munten.
    const espai = senseComentaris(llegix('src/components/universal/workspace/UniversalWorkspace.jsx'));
    const fletxesViues = /from '\.\/navegacioTeclat\.js'/.test(espai) && /gestionaTeclaLlista\(/.test(espai) && /gestionaTeclaArbre\(/.test(espai)
      && ['src/sections/disseny/DesignSection.jsx', 'src/sections/wiki-de-poble/WikiDePobleSection.jsx'].every((rel) => /<UniversalWorkspace\b/.test(llegix(rel)));
    const textFletxes = fletxes.textContent.replace(/\s+/g, ' ');
    expect(concorda(fletxesViues, /no existix|en construcció|encara no/.test(textFletxes), textFletxes.includes('les fletxes ja mouen el focus per les columnes de Disseny i de la Wiki de Poble'))).toBe(true);
    if (fletxesViues) expect([...fletxes.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['/disseny', '/wikidepoble']);
    // IDEA-31: l'entrada del lloc (main.jsx, fora dels comentaris) fixa el traductor lliure del navegador.
    const traductorDelLloc = /\bfixaTraductorLliure\(\s*'apertium'\s*\)/.test(senseComentaris(llegix('src/main.jsx')));
    const textTraductor = traductor.textContent.replace(/\s+/g, ' ');
    expect(concorda(traductorDelLloc, /no traduïx|no es traduïx|en construcció/.test(textTraductor), textTraductor.includes('a socdepoble.org, el botó Traduir de la barra blava la demana des del navegador'))).toBe(true);
    expect([...traductor.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual(['/traduccions']);
    // Les dues, «en curs» a «Pendent»; cap frase sobre el desplegament; cap «Fet hui» les promet (B3).
    expect(segona).toMatch(/\(IDEA-58\): en curs/);
    expect(segona).toMatch(/\(IDEA-31\): en curs/);
    expect(text).not.toMatch(/encara no traduïx|no està publicada/);
    expect(segona).toContain("L'objectiu és WCAG 2.2 AAA, i hui no tenim cap certificació d'accessibilitat");
    // Cap apartat «Fet hui» no promet ni el traductor ni les fletxes.
    expect(apartat(1, 'Fet hui (verificable)')).not.toMatch(/IDEA-58|IDEA-31|Apertium|fletxes/);
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
    expect(apartat(1, 'Pendent')).toContain("amb Apertium, un traductor de programari lliure, al castellà, l'anglés, el francés i el gallec, i amb MyMemory, un servei de l'empresa Translated, al basc i a l'alemany");
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
    const altres = new Set(['/page/consola', '/consola', '/traduccions', '/wikidepoble']);
    const hrefs = [...doc.querySelectorAll('a')].map((a) => a.getAttribute('href')).filter((href) => !href.startsWith('https://'));
    expect(hrefs.filter((href) => !rutesDeSeccio.has(href) && !altres.has(href))).toEqual([]);
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
});
