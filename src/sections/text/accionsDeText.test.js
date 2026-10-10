/**
 * Onada 10 (261010; decisió del Mestre del 261010) · L'acció gran de les
 * pàgines de text amb ruta pròpia (accionsDeText.js): «L'Ànima de la IAIA»
 * (/iaia) porta «Anar al xat» cap al xat amb la IAIA MarIA, i cap altra
 * pàgina de text en porta.
 *
 *  · El verb és el del botó de /page/xat (accioDeLaPagina('xat')): una sola
 *    font, la clau 'section.xat.anarAlXat'.
 *  · El destí és el de rutaDelXatDeLaIAIA, segons el mode de dades del xat.
 *  · 'anima' no és cap pàgina del sistema: la IAIA no té targeta al Mur.
 */
import { describe, expect, test } from 'vitest';
import { esRutaDeLaPorta } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { createTranslator } from '../../config/i18n.js';
import { SECTIONS } from '../../config/sections.js';
import { SYSTEM_PAGES, accioDeLaPagina } from '../../config/systemPages.js';
import { IAIA_ID } from '../../data/identitatsSeed.js';
import { RUTA_XAT_DE_LA_IAIA, rutaDelXatDeLaIAIA } from '../xat/useObriXatPerDefecte.js';
import { accioDeLaPaginaDeText } from './accionsDeText.js';
import { PAGE_COPY } from './pageContent.js';

const DIRECTE = `/xat?amb=${IAIA_ID}`;

describe('accioDeLaPaginaDeText', () => {
  test('«L’Ànima de la IAIA»: la porta gran «Anar al xat», amb la forma exacta de les portes', () => {
    const porta = accioDeLaPaginaDeText('anima');
    expect(porta).toEqual({ id: 'anar-al-xat-de-la-iaia', verb: 'Anar al xat', desti: RUTA_XAT_DE_LA_IAIA, varietat: 'primari' });
    expect(Object.keys(porta)).toEqual(['id', 'verb', 'desti', 'varietat']);
  });

  test('el destí és el de la fila «IAIA MarIA» de cada mode de dades, i sempre una ruta de l’app', () => {
    expect(accioDeLaPaginaDeText('anima', undefined, 'seed').desti).toBe(DIRECTE);
    expect(accioDeLaPaginaDeText('anima', undefined, 'local').desti).toBe(DIRECTE);
    expect(accioDeLaPaginaDeText('anima', undefined, 'remote').desti).toBe(RUTA_XAT_DE_LA_IAIA);
    for (const mode of ['seed', 'local', 'remote', undefined]) {
      const { desti } = accioDeLaPaginaDeText('anima', undefined, mode);
      expect([mode, desti]).toEqual([mode, rutaDelXatDeLaIAIA(mode)]);
      expect([mode, esRutaDeLaPorta(desti)]).toEqual([mode, true]);
    }
  });

  test('el verb és el del botó de /page/xat, en cada llengua', () => {
    expect(accioDeLaPaginaDeText('anima').verb).toBe(accioDeLaPagina('xat').verb);
    const vists = new Set();
    for (const llengua of ['ca', 'es', 'en', 'eu', 'gl']) {
      const t = createTranslator(llengua);
      const { verb } = accioDeLaPaginaDeText('anima', t, 'seed');
      expect([llengua, verb]).toEqual([llengua, accioDeLaPagina('xat', t).verb]);
      expect([llengua, verb]).toEqual([llengua, t('section.xat.anarAlXat', 'Anar al xat')]);
      vists.add(verb);
    }
    expect(vists.has('Anar al xat')).toBe(true);
    expect(vists.size).toBe(5);
  });

  test('cap altra pàgina de text porta acció: ni les de PAGE_COPY ni les seccions de text', () => {
    const claus = new Set([
      ...Object.keys(PAGE_COPY),
      ...SECTIONS.filter((seccio) => seccio.kind === 'text' && seccio.pageKey).map((seccio) => seccio.pageKey)
    ]);
    expect(claus.has('anima')).toBe(true);
    expect([...claus].filter((clau) => accioDeLaPaginaDeText(clau, undefined, 'seed') !== null)).toEqual(['anima']);
    for (const estranya of ['constructor', 'toString', '__proto__', '', 'ANIMA', undefined, null, 7, {}]) {
      expect([String(estranya), accioDeLaPaginaDeText(estranya)]).toEqual([String(estranya), null]);
    }
  });

  test('la pàgina de la IAIA no és cap pàgina del sistema: ni targeta al Mur ni acció a systemPages.js', () => {
    expect(SYSTEM_PAGES.map((pagina) => pagina.key)).not.toContain('anima');
    expect(SYSTEM_PAGES.filter((pagina) => /iaia/i.test(`${pagina.key} ${pagina.href}`))).toEqual([]);
    expect(accioDeLaPagina('anima')).toBeNull();
    /* La seua secció és una pàgina de text amb ruta pròpia: la pinta TextRoute. */
    expect(SECTIONS.find((seccio) => seccio.pageKey === 'anima')).toMatchObject({ id: 'ia', path: '/iaia', kind: 'text' });
  });
});
