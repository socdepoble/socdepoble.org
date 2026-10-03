// @vitest-environment node
/* Lot BAR · les fronteres (disseny del Bar §0.7 i §A.13, inspirat en
   src/sections/gestoria/privacitat.test.js): el que no ha d'eixir del Bar.
   · Cap API de xarxa ni cap URL externa: les dades viuen al dispositiu.
   · Cap import del backend, de la Gestoria (D3), dels Tractors ni de Salut.
   · Cap emmagatzematge directe: només utils/magatzemLocal.js, per magatzem.js.
   · Cap valor de negoci a la consola.
   · Cap literal amb forma de DNI, NIE, IBAN, correu o telèfon.
   · La llavor no porta cap preu que no siga d'exemple, ni marques.
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
