// @vitest-environment node
/* T8 · D13 (pla 261101_1246, decisió del Mestre) · Edat mínima de 16 anys,
   sense excepció, a la web i a les apps: la mateixa xifra que les fitxes de
   l'App Store (16+) i de Google Play (públic de 16 anys o més). Abans, les
   condicions 2.2 deien 14 anys amb l'alta de la família per davall d'eixa
   edat. Esta guarda impedix tornar-hi: una sola edat al text, dins de les
   condicions d'ús, i cap via de pàtria potestat ni de tutela. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { legalContent } from './legalContent.js';
import { PAGE_COPY } from './pageContent.js';

const HTML = legalContent.html;
/* El readme del connector de WordPress, que també diu l'edat (Changelog 1.1.11, vinyeta «Visor»). */
const README_CONNECTOR = readFileSync(resolve(process.cwd(), 'wordpress-plugin/readme.txt'), 'utf8');
const textDe = (tros) => tros.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const TEXT = textDe(HTML);

/** L'HTML de l'apartat «N. Títol», fins a l'apartat següent. */
function apartat(numero) {
  const inici = HTML.indexOf(`<h4>${numero}. `);
  const fi = HTML.indexOf(`<h4>${numero + 1}. `, inici);
  expect([numero, inici > 0, fi > inici]).toEqual([numero, true, true]);
  return HTML.slice(inici, fi);
}

describe('Legal · edat mínima de 16 anys (D13 · T8)', () => {
  test('una sola edat mínima, la de 16 anys, dins de les condicions d’ús', () => {
    expect(HTML.split('<strong>Edat mínima: 16 anys.</strong>')).toHaveLength(2);
    expect(apartat(3)).toContain('<strong>Edat mínima: 16 anys.</strong>');
    const paragraf = textDe(apartat(3).split('<p>').find((p) => p.startsWith('<strong>Edat mínima')) ?? '');
    expect(paragraf).toBe("Edat mínima: 16 anys. Per a obrir un compte i fer servir Sóc de Poble has de tindre 16 anys o més. És la mateixa edat a la web i a l'aplicació per al mòbil, i no hi ha cap excepció amb el permís de la família. Si detectem un compte d'una persona menor de 16 anys, el donarem de baixa.");
  });

  test('cap altra edat ni cap via d’alta per la família', () => {
    // Cada «N anys» que parla d'edat és un 16; els terminis de conservació («fins a 3 anys») no són edats.
    const edats = [...TEXT.matchAll(/(?:tindre|menor de|mínima:) (\d+) anys/g)].map((m) => Number(m[1]));
    expect(edats).toEqual([16, 16, 16]);
    expect(TEXT).not.toMatch(/\b1[0-5] anys\b/);
    expect(TEXT).not.toMatch(/pàtria potestat|tutela/);
    // L'article 7 de la LOPDGDD (consentiment des dels 14) ja no és la base de l'edat: no es cita a les condicions.
    expect(textDe(apartat(3))).not.toMatch(/LOPDGDD|Llei Orgànica 3\/2018|article 7/);
  });

  test('el rètol editorial puja a la versió 2.5 (avisos push del xat, Onada R9) i la pàgina /legal servix este mateix text', () => {
    expect(HTML.replace(/<\/?strong>/g, '')).toContain("<p><em>Versió 2.5 · En vigor des del 6 de novembre de 2026. Substitueix qualsevol versió anterior d'aquest text.</em></p>");
    expect(PAGE_COPY.legal).toBe(legalContent);
  });

  /* Gauntlet transversal 261101 (COMP-02) · El Changelog del connector descriu el visor que porta: l'edat
     que hi diu és la de les condicions. Si l'edat canvia ací, el readme s'ha de tornar a escriure. */
  test('el readme del connector diu la mateixa edat mínima, sense cap altra', () => {
    const edatDeLesCondicions = Number(TEXT.match(/Edat mínima: (\d+) anys\./)?.[1]);
    const edatsDelReadme = [...README_CONNECTOR.matchAll(/edat mínima de (\d+) anys/g)].map((m) => Number(m[1]));
    expect(edatsDelReadme.length).toBeGreaterThan(0);
    expect(new Set(edatsDelReadme)).toEqual(new Set([edatDeLesCondicions]));
    expect(README_CONNECTOR).not.toMatch(/\b1[0-5] anys\b|pàtria potestat|tutela/);
  });
});
