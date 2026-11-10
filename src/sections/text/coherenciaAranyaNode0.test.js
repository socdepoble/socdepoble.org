import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolvePageSlugPath } from '../../config/navigation.js';
import { PAGE_COPY } from './pageContent.js';

const SLUGS_SISTEMA_AUDITATS = Object.freeze([
  'node-zero',
  'fediversity',
  'la-iaia-sabuda',
]);

/* El cos de la pàgina no porta cap capçalera de nivell 1. La classe [1] fa que el patró no
   continga l'etiqueta literal: la porta Design Guard (tooling/gates/design_guard.mjs) compta les
   etiquetes literals de cada fitxer, i el patró d'una prova no és cap capçalera. */
const CAPCALERA_DE_NIVELL_1 = /<h[1][\s>]/i;

const llegix = (ruta) => readFileSync(path.join(process.cwd(), ruta), 'utf8');
/* Els primers trams que declara l'enrutador (src/app/App.jsx), amb barra o sense (ActorRoutes):
   el mateix recompte que navigation.canoniques.test.js. */
const TRAMS_DE_L_ENRUTADOR = new Set(
  [...llegix('src/app/App.jsx').matchAll(/<Route\s+path="\/?([^"/:*]+)/g)].map(([, tram]) => tram)
);
/* Els trams que el hosting servix com a fitxers, fora de la SPA: els que exclou la reescriptura
   cap a /index.html de firebase.json («!/@(assets|…)/**»). */
const reescripturaSpa = JSON.parse(llegix('firebase.json')).hosting.rewrites
  .find((regla) => regla.destination === '/index.html');
const TRAMS_ESTATICS = new Set(/^!\/@\(([^)]+)\)\/\*\*$/.exec(reescripturaSpa.source)[1].split('|'));

/* /page/<clau>: una pàgina de PAGE_COPY o una adreça coneguda de navigation.js (resolvePageSlugPath).
   La resta: el primer tram el declara l'enrutador o el servix el hosting com a fitxer. */
const destiInternExistix = (href) => {
  const cami = href.split(/[?#]/)[0];
  if (cami.startsWith('/page/')) {
    const pagina = /^\/page\/([^/]+)$/.exec(cami);
    return Boolean(pagina) && (Object.hasOwn(PAGE_COPY, pagina[1]) || resolvePageSlugPath(pagina[1]) !== null);
  }
  const [primerTram] = cami.slice(1).split('/');
  return TRAMS_DE_L_ENRUTADOR.has(primerTram) || TRAMS_ESTATICS.has(primerTram);
};

const htmlsDeLaPagina = (pagina) => [
  pagina.html ?? pagina.content ?? '',
  ...Object.values(pagina.translations || {}).map((traduccio) => traduccio?.html ?? ''),
].map(String);

describe('Onada R16.24 (Expedient R16-AJ) · Coherència Text ↔ Codi en /page/node-zero, /page/fediversity i /page/la-iaia-sabuda', () => {
  it('les 3 pàgines de sistema existeixen a PAGE_COPY amb títol, subtítol i html semàntic (H2/H3/H4 + <p>, <strong> als dossiers, cap capçalera de nivell 1 al cos i 0 referències obsoletes)', () => {
    for (const slug of SLUGS_SISTEMA_AUDITATS) {
      const pagina = PAGE_COPY[slug];
      expect(pagina, `Falta PAGE_COPY['${slug}']`).toBeTruthy();
      expect(typeof pagina.title).toBe('string');
      expect(pagina.title.length).toBeGreaterThan(3);
      expect(typeof pagina.subtitle).toBe('string');
      expect(pagina.subtitle.length).toBeGreaterThan(5);
      const html = String(pagina.html ?? pagina.content ?? '');
      expect(html.length).toBeGreaterThan(200);

      // Zero referències obsoletes a nodrir-la-iaia
      const jsonComplet = JSON.stringify(pagina);
      expect(jsonComplet).not.toContain('nodrir-la-iaia');
      expect(jsonComplet).not.toMatch(/Nodrir la IAIA/i);

      // Regles tipogràfiques i de jerarquia: H2/H3/H4 + <p> + <strong>, cap capçalera de nivell 1 al cos
      expect(html).not.toMatch(CAPCALERA_DE_NIVELL_1);
      expect(html).toMatch(/<h[234][\s>]/i);
      expect(html).toContain('<p');
      /* SEG-R15b-02 (R16b) · La IAIA Sabuda és un sol paràgraf pla i honest (NodrirLaIaiaSection.test.jsx); els dossiers porten negretes. */
      if (slug !== 'la-iaia-sabuda') expect(html).toContain('<strong>');
    }
  });

  it('tots els enllaços interns de les 3 pàgines, en totes les llengües, van a una pàgina /page/<clau> de PAGE_COPY o de navigation.js, o el seu primer tram el declara App.jsx o el servix el hosting com a fitxers, fora de la SPA', () => {
    expect(TRAMS_DE_L_ENRUTADOR.has('page')).toBe(true);
    expect(TRAMS_DE_L_ENRUTADOR.has('mur')).toBe(true);
    expect(TRAMS_ESTATICS.has('opendata')).toBe(true);
    expect(destiInternExistix('/page/pagina-que-no-existix')).toBe(false);
    expect(destiInternExistix('/page/node-zero/x')).toBe(false);
    expect(destiInternExistix('/ruta-que-no-existix/fitxa')).toBe(false);
    expect(destiInternExistix('/page/nodrir-la-iaia')).toBe(true);

    let interns = 0;
    for (const slug of SLUGS_SISTEMA_AUDITATS) {
      for (const html of htmlsDeLaPagina(PAGE_COPY[slug])) {
        const hrefs = [...html.matchAll(/href=["']([^"']+)["']/g)].map((m) => m[1]);
        for (const href of hrefs) {
          if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('#')) {
            continue;
          }
          interns += 1;
          expect(href.startsWith('/'), `Enllaç relatiu "${href}" dins de /page/${slug}`).toBe(true);
          expect(destiInternExistix(href), `Ruta interna desconeguda "${href}" dins de /page/${slug}`).toBe(true);
        }
      }
    }
    expect(interns).toBeGreaterThan(0);
  });
});
