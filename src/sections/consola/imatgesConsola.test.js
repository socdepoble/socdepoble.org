import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front F) · Les
   il·lustracions de la Consola, d'una sola taula (imatgesConsola.js): cap
   ruta inventada (el fitxer és al disc, dins de public/), cap imatge
   repetida (una il·lustració, un sol lloc de /consola) i cap text
   alternatiu inventat per a una imatge que ja pinta una altra font (PAGE_COPY
   o el registre de plugins): el seu. Mateix patró que les proves de l'Índex
   de l'Onada 12 (indexConsola.test.js), que la taula hereta. */
import { IMATGES_CONSOLA, imatgeDePagina } from './imatgesConsola.js';
import { IDS_PAGINES } from './consolaPagines.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { PLUGINS, pluginPerId } from '../plugins/registrePlugins.js';

const PUBLIC = path.join(process.cwd(), 'public');
const alDisc = (ruta) => path.join(PUBLIC, ...ruta.split('/').filter(Boolean));
const esFitxerAmbPes = (ruta) => existsSync(alDisc(ruta)) && statSync(alDisc(ruta)).isFile() && statSync(alDisc(ruta)).size > 0;
/* Expectativa actualitzada a propòsit (ordre del Mestre, 261021, torn fase 2,
   Mòdul B, P0-14) · Les vinyetes de Treball, el Mapa i Salut ja només viuen
   com a WebP (l'original .jpg ix de public/; la bessona té les mateixes
   mides): la forma admet .webp, però només quan no hi ha cap .jpg al costat
   (ho vigila la prova «cada fitxer és a public/…»). Abans: només .jpg. */
const FORMA = /^\/assets\/(ui\/plugins\/[a-z]+_vinyeta|nano_cards\/[a-z_]+_nano_card)\.(?:jpg|webp)$/;

/* Totes les fonts que ja pinten una imatge, amb el seu text alternatiu. */
const FONTS = [
  ...Object.entries(PAGE_COPY).filter(([, c]) => c?.image).map(([clau, c]) => ({ on: `PAGE_COPY.${clau}`, imatge: c.image, alt: c.imageAlt })),
  ...PLUGINS.map((p) => ({ on: `plugin ${p.id}`, imatge: p.imatge, alt: p.imatgeAlt }))
];

describe('la taula', () => {
  test('una entrada per a l’H2 de l’Índex i una per cada pàgina del tauler, en l’ordre d’IDS_PAGINES', () => {
    expect(Object.keys(IMATGES_CONSOLA)).toEqual(['index', ...IDS_PAGINES]);
    expect(Object.isFrozen(IMATGES_CONSOLA)).toBe(true);
    for (const [id, il] of Object.entries(IMATGES_CONSOLA)) {
      expect(Object.isFrozen(il), id).toBe(true);
      expect(Object.keys(il), id).toEqual(['imatge', 'imatgeAlt']);
    }
  });

  test('cada fitxer és a public/, amb pes, i té la forma d’una vinyeta o d’una nano card', () => {
    for (const [id, { imatge }] of Object.entries(IMATGES_CONSOLA)) {
      expect(imatge, id).toMatch(FORMA);
      expect(esFitxerAmbPes(imatge), `${imatge} no és a public/`).toBe(true);
      // Una .webp només si el seu .jpg ja no és al disc: mentre hi ha l'original, la taula nomena l'original.
      if (imatge.endsWith('.webp')) expect(existsSync(alDisc(imatge.replace(/\.webp$/, '.jpg'))), imatge).toBe(false);
    }
    expect(Object.values(IMATGES_CONSOLA).map((x) => x.imatge).filter((ruta) => ruta.endsWith('.webp')).sort())
      .toEqual(['/assets/ui/plugins/mapa_vinyeta.webp', '/assets/ui/plugins/salut_vinyeta.webp', '/assets/ui/plugins/treball_vinyeta.webp']);
  });

  test('cap imatge repetida: una il·lustració, un sol lloc de /consola (lliçó 261010)', () => {
    const rutes = Object.values(IMATGES_CONSOLA).map((x) => x.imatge);
    expect(new Set(rutes).size).toBe(rutes.length);
  });

  test('cada text alternatiu descriu la imatge (més de 20 caràcters, sense punt final) i cap es repetix', () => {
    const alts = Object.values(IMATGES_CONSOLA).map((x) => x.imatgeAlt);
    for (const alt of alts) {
      expect(alt.length, alt).toBeGreaterThan(20);
      expect(alt, alt).not.toMatch(/\.$/);
    }
    expect(new Set(alts).size).toBe(alts.length);
  });
});

describe('les fonts', () => {
  test('una imatge que ja pinta una altra font porta el text alternatiu d’eixa font', () => {
    for (const [id, { imatge, imatgeAlt }] of Object.entries(IMATGES_CONSOLA)) {
      const seues = FONTS.filter((f) => f.imatge === imatge);
      if (seues.length) expect(seues.map((f) => f.alt), `${id} · ${imatge}`).toContain(imatgeAlt);
    }
  });

  test('les de les fonts nomenades al criteri: la Consola, el Cervell, Treball, el Calendari, el Mapa i Salut', () => {
    expect(IMATGES_CONSOLA.index).toEqual({ imatge: PAGE_COPY.consola.image, imatgeAlt: PAGE_COPY.consola.imageAlt });
    expect(IMATGES_CONSOLA.explorador).toEqual({ imatge: PAGE_COPY.cervell.image, imatgeAlt: PAGE_COPY.cervell.imageAlt });
    expect(IMATGES_CONSOLA.fluxos).toEqual({ imatge: PAGE_COPY.treball.image, imatgeAlt: PAGE_COPY.treball.imageAlt });
    expect(IMATGES_CONSOLA.calendari).toEqual({ imatge: PAGE_COPY.publicar_calendari.image, imatgeAlt: PAGE_COPY.publicar_calendari.imageAlt });
    expect(IMATGES_CONSOLA.actors).toEqual({ imatge: PAGE_COPY.publicar_mapa.image, imatgeAlt: PAGE_COPY.publicar_mapa.imageAlt });
    const salut = pluginPerId('salut');
    expect(IMATGES_CONSOLA.salut).toEqual({ imatge: salut.imatge, imatgeAlt: salut.imatgeAlt });
    // «El Cervell» viu a l'Explorador: ho diu el seu copy, i per això la seua imatge va a eixa targeta.
    expect(PAGE_COPY.cervell.lead).toContain('Explorador');
  });

  test('les quatre que cap altra pantalla no pinta porten un text propi (pols, inventari, entrades i agents)', () => {
    for (const id of ['pols', 'inventari', 'entrades', 'agents']) {
      expect(FONTS.filter((f) => f.imatge === IMATGES_CONSOLA[id].imatge), id).toEqual([]);
    }
  });
});

describe('imatgeDePagina', () => {
  test('cada pàgina del tauler, la seua entrada de la taula, tal qual', () => {
    for (const id of IDS_PAGINES) expect(imatgeDePagina(id), id).toBe(IMATGES_CONSOLA[id]);
  });

  test('l’H2 de l’Índex no és cap pàgina, i un id desconegut o heretat no en porta: null i buit', () => {
    for (const id of ['index', 'mas', 'pestanyes', '', undefined, null, 'toString', '__proto__']) {
      expect(imatgeDePagina(id), String(id)).toEqual({ imatge: null, imatgeAlt: '' });
    }
  });
});
