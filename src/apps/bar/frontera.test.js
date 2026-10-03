// @vitest-environment node
/* Lot BAR · les fronteres (disseny del Bar §0.7 i §A.13, inspirat en
   src/sections/gestoria/privacitat.test.js): el que no ha d'eixir del Bar.
   · Cap API de xarxa ni cap URL externa: les dades viuen al dispositiu.
   · Cap import del backend, de la Gestoria (D3), dels Tractors ni de Salut.
   · Cap emmagatzematge directe: només utils/magatzemLocal.js, per magatzem.js.
   · Cap valor de negoci a la consola.
   · Cap literal amb forma de DNI, NIE, IBAN, correu o telèfon.
   · La llavor no porta cap preu que no siga d'exemple, ni marques.
   EXCEPCIÓ (Onada 3, demanada pel Mestre): llavors/laParroquia.js és una
   llavor REAL, amb marques i preus de veres, sobre la còpia del CSV de
   Loyverse (llavors/la-parroquia-loyverse.csv). Va separada de la genèrica
   (nucli/llavor.js, la de la primera càrrega, que continua sense marques),
   només es carrega amb import() dinàmic des de llavors/index.js, darrere
   d'un literal de compilació (servidor de desenvolupament o
   VITE_SDP_BAR_LLAVOR_LA_PARROQUIA=1), i el seu CSV tampoc no porta cap
   dada personal ni cap URL.
   Els patrons vetats es componen a trossos (patró de la Gestoria). */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { llavorCarta, llavorSala, ESTABLIMENT_EXEMPLE } from './nucli/llavor.js';

const ARREL = process.cwd();
const BASE = 'src/apps/bar';
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.jsx?$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

const TOTS = fitxersDe(BASE);
const PRODUCCIO = TOTS.filter((f) => !/\.test\.jsx?$/.test(f));
const NUCLI = PRODUCCIO.filter((f) => f.startsWith(`${BASE}/nucli/`));
const especificadors = (codi) => [...codi.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
const trobaEn = (fitxers, vetats) => fitxers.flatMap((f) => vetats.filter(([patro]) => patro.test(llig(f))).map(([, que]) => `${f}: ${que}`));

describe('xarxa', () => {
  test('cap API de xarxa al codi de producció del Bar', () => {
    const vetats = [
      [new RegExp(['\\bfet', 'ch\\('].join('')), 'fetch'],
      [new RegExp(['XMLHttp', 'Request'].join('')), 'XMLHttpRequest'],
      [new RegExp(['Web', 'Socket'].join('')), 'WebSocket'],
      [new RegExp(['Event', 'Source'].join('')), 'EventSource'],
      [new RegExp(['send', 'Beacon'].join('')), 'sendBeacon'],
      [new RegExp(['\\bimport', 'Scripts\\('].join('')), 'importScripts']
    ];
    expect(trobaEn(PRODUCCIO, vetats)).toEqual([]);
  });

  test('cap URL externa (ni a la llavor ni a les imatges)', () => {
    const url = new RegExp(['https?', ':\\/\\/'].join(''));
    expect(PRODUCCIO.filter((f) => url.test(llig(f)))).toEqual([]);
  });
});

describe('imports', () => {
  test('cap import del backend, de la Gestoria (D3), dels Tractors ni de Salut', () => {
    const vetat = /supabase|backendPort|adaptadors|\/data\/|sections\/(?:gestoria|tractors|salut)\/|apps\/salut\//;
    const trobats = PRODUCCIO.flatMap((f) => especificadors(llig(f)).filter((e) => vetat.test(e)).map((e) => `${f}: ${e}`));
    expect(trobats).toEqual([]);
  });

  test('el nucli és pur: sense React, sense DOM i sense cap import de fora del nucli (excepte utils)', () => {
    for (const f of NUCLI) {
      const codi = llig(f);
      for (const e of especificadors(codi)) expect(e.startsWith('./') || e.startsWith('../../../utils/'), `${f}: ${e}`).toBe(true);
      const senseComentaris = codi.replace(/\/\*[\s\S]*?\*\//g, '');
      expect(/\b(?:document|window|React)\b|from 'react'/.test(senseComentaris), f).toBe(false);
    }
  });
});

describe('emmagatzematge i consola', () => {
  test('cap emmagatzematge directe: només magatzem.js, sobre utils/magatzemLocal.js', () => {
    const vetat = new RegExp(['local', 'Storage|session', 'Storage|indexed', 'DB\\b|document\\.', 'cookie'].join(''));
    expect(PRODUCCIO.filter((f) => vetat.test(llig(f)))).toEqual([]);
    const importen = PRODUCCIO.filter((f) => especificadors(llig(f)).some((e) => e.endsWith('utils/magatzemLocal.js')));
    expect(importen).toEqual([`${BASE}/magatzem.js`]);
  });

  test('cap valor de negoci a la consola', () => {
    const consola = new RegExp(['\\bcon', 'sole\\.'].join(''));
    expect(PRODUCCIO.filter((f) => consola.test(llig(f)))).toEqual([]);
  });
});

describe('dades personals i llavor', () => {
  test('cap literal amb forma de DNI, NIE, IBAN, correu o telèfon (proves incloses)', () => {
    const vetats = [
      [/\b[XYZ]?\d{7,8}[A-HJ-NP-TV-Z]\b/, 'DNI/NIE'],
      [/\bES\d{2}[\s]?\d{4}/, 'IBAN'],
      [/[\w.+-]+@[\w-]+\.[a-z]{2,}/i, 'correu'],
      [/\b(?:\+34[\s.-]?)?[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/, 'telèfon']
    ];
    expect(trobaEn(TOTS, vetats)).toEqual([]);
  });

  test('la llavor no conté cap preu marcat exemple: false ni cap preu que no siga enter', () => {
    const carta = llavorCarta();
    expect(carta.productes.filter((p) => p.exemple !== true).map((p) => p.id)).toEqual([]);
    expect(carta.productes.flatMap((p) => p.variants).filter((v) => !Number.isSafeInteger(v.preuCents))).toEqual([]);
    expect(llig(`${BASE}/nucli/llavor.js`)).not.toMatch(/exemple:\s*false/);
  });

  test('la llavor és genèrica: cap marca coneguda ni nom de persona; l’establiment és d’exemple', () => {
    const text = JSON.stringify({ carta: llavorCarta(), sala: llavorSala(), establiment: ESTABLIMENT_EXEMPLE }).toLowerCase();
    const marques = ['coca', 'pepsi', 'fanta', 'nestl', 'cola cao', 'colacao', 'mahou', 'estrella', 'damm', 'heineken', 'schweppes',
      'aquarius', 'bailey', 'larios', 'beefeater', 'marie brizard', 'osborne', 'loyverse'];
    expect(marques.filter((m) => text.includes(m))).toEqual([]);
    expect(ESTABLIMENT_EXEMPLE.nom).toBe('El meu bar');
  });
});

describe('la llavor real de La Parròquia (excepció declarada)', () => {
  const estatics = (codi) => [
    ...[...codi.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)].map((m) => m[1]),
    ...[...codi.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)].map((m) => m[1])
  ];
  const dinamics = (codi) => [...codi.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const CSV = `${BASE}/llavors/la-parroquia-loyverse.csv`;

  test('cap import estàtic de l’adaptador: només llavors/index.js el carrega, amb import()', () => {
    expect(PRODUCCIO.filter((f) => estatics(llig(f)).some((e) => /laParroquia(?:\.js)?$/.test(e)))).toEqual([]);
    expect(PRODUCCIO.filter((f) => dinamics(llig(f)).some((e) => /laParroquia(?:\.js)?$/.test(e)))).toEqual([`${BASE}/llavors/index.js`]);
  });

  test('l’import() de l’adaptador va darrere del literal de compilació EXACTE: sense la bandera, Vite trau del paquet els preus i els costos', () => {
    const literal = /import\.meta\.env\.DEV \|\| import\.meta\.env\.VITE_SDP_BAR_LLAVOR_LA_PARROQUIA === '1'\s*\?\s*\(\) => import\('\.\/laParroquia\.js'\)/;
    const codi = llig(`${BASE}/llavors/index.js`);
    expect(codi).toMatch(literal);
    expect(dinamics(codi)).toEqual(['./laParroquia.js']);
  });

  test('el CSV només l’importa l’adaptador, i la caixa (magatzem, ProveidorBar, AppBar, rutesBar) no el nomena', () => {
    expect(PRODUCCIO.filter((f) => especificadors(llig(f)).some((e) => /\.csv(?:\?|$)/.test(e)))).toEqual([`${BASE}/llavors/laParroquia.js`]);
    for (const f of ['magatzem.js', 'estat/ProveidorBar.jsx', 'AppBar.jsx', 'rutesBar.js']) {
      expect(especificadors(llig(`${BASE}/${f}`)).filter((e) => /laParroquia|\.csv/.test(e)), f).toEqual([]);
    }
  });

  test('el CSV no porta cap correu, telèfon, DNI, NIE, IBAN ni URL', () => {
    const vetats = [
      [/\b[XYZ]?\d{7,8}[A-HJ-NP-TV-Z]\b/, 'DNI/NIE'],
      [/\bES\d{2}[\s]?\d{4}/, 'IBAN'],
      [/[\w.+-]+@[\w-]+\.[a-z]{2,}/i, 'correu'],
      [/\b(?:\+34[\s.-]?)?[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/, 'telèfon'],
      [new RegExp(['https?', ':\\/\\/|\\bwww\\.'].join(''), 'i'), 'URL']
    ];
    const text = llig(CSV);
    expect(text.length).toBeGreaterThan(0);
    expect(vetats.filter(([patro]) => patro.test(text)).map(([, que]) => que)).toEqual([]);
  });
});
