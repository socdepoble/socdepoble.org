import { describe, expect, test } from 'vitest';
import { codiLlenguaAdmin, textosAdminA11y } from './i18nAdminA11y.js';

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];

describe('Tauler d’Administració · i18n diferit d’accessibilitat en 5 llengües (Onada R32.30b)', () => {
  test('totes les claus i plantilles d’aria-label i alt existixen en ca, es, en, eu i gl sense undefined', () => {
    const claus = Object.keys(textosAdminA11y({ language: 'ca' }));
    expect(claus.length).toBeGreaterThanOrEqual(14);
    for (const codi of LLENGUES) {
      expect(codiLlenguaAdmin({ language: codi })).toBe(codi);
      const tx = textosAdminA11y({ language: codi });
      for (const clau of claus) {
        const val = typeof tx[clau] === 'function' ? tx[clau]('1', 'Projecte') : tx[clau];
        expect(typeof val, `${codi}.${clau}`).toBe('string');
        expect(val.trim().length, `${codi}.${clau}`).toBeGreaterThan(0);
        expect(val).not.toContain('undefined');
      }
    }
  });

  test('conserva byte a byte els literals canònics en valencià (ca) i resol idioma pel traductor', () => {
    const ca = textosAdminA11y({ language: 'ca' });
    expect(ca.menuAdministracioAria).toBe("Menú d'administració");
    expect(ca.tornarALaLlista).toBe('Tornar a la llista');
    expect(ca.versionsDesadesAria).toBe('Versions desades');
    expect(ca.accionsTaxonomiaAria).toBe('Accions de la taxonomia');
    expect(ca.segonFactorAria).toBe('Segon factor');

    expect(codiLlenguaAdmin({ t: () => 'Cerrar sesión' })).toBe('es');
    expect(codiLlenguaAdmin({ t: () => 'Log out' })).toBe('en');
    expect(codiLlenguaAdmin({ t: () => 'Itxi saioa' })).toBe('eu');
    expect(codiLlenguaAdmin({ t: () => 'Pechar sesión' })).toBe('gl');
  });

  /* v1.2.19 · Gauntlet R1 (L3-01) · WCAG 2.5.3: el nom accessible comença pel text visible, en cada llengua.
     En ca, «Cànon» i «Afegir etiqueta» queden byte a byte com en la v1.2.18 (ja no hi començaven). */
  test('llevar, restaurar, afegirEtiqueta i canon són el text visible i cada aria-label hi comença', () => {
    for (const codi of LLENGUES) {
      const tx = textosAdminA11y({ language: codi });
      expect(tx.llevarValorSerieAria(tx.categoriaSingular, 'Fira').startsWith(tx.llevar), codi).toBe(true);
      expect(tx.llevarEtiquetaPaginaAria(1, 'Agenda').startsWith(tx.llevar), codi).toBe(true);
      expect(tx.restaurarVersioAria(3).startsWith(tx.restaurar), codi).toBe(true);
      if (codi === 'ca') continue;
      expect(tx.afegirEtiquetaPaginaAria('Agenda').startsWith(tx.afegirEtiqueta), codi).toBe(true);
      expect(tx.tornarTokenAlCanonAria('Color').startsWith(tx.canon), codi).toBe(true);
    }
    const ca = textosAdminA11y({ language: 'ca' });
    expect([ca.llevar, ca.restaurar, ca.afegirEtiqueta, ca.canon]).toEqual(['Llevar', 'Restaurar', 'Afegir etiqueta', 'Cànon']);
    expect([ca.categoriesNom, ca.categoriaSingular, ca.etiquetesNom, ca.etiquetaSingular]).toEqual(['Categories', 'categoria', 'Etiquetes', 'etiqueta']);
    expect(ca.llevarValorSerieAria(ca.categoriaSingular, 'Fira')).toBe('Llevar la categoria Fira');
    expect(ca.llistaAfegidesAria(ca.etiquetesNom)).toBe('Etiquetes afegides');
    expect(ca.restaurarVersioAria(3)).toBe('Restaurar la versió 3');
    expect(ca.llevarEtiquetaPaginaAria(1, 'Agenda')).toBe('Llevar l’etiqueta 1 de Agenda');
    expect(ca.afegirEtiquetaPaginaAria('Agenda')).toBe('Afegir una etiqueta a Agenda');
    expect(ca.tornarTokenAlCanonAria('Color')).toBe('Tornar Color al cànon');
  });
});
