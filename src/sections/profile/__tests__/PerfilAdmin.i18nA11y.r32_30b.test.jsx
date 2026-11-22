import { describe, expect, test } from 'vitest';
import { codiLlenguaPerfil, textosPerfilA11y } from '../i18nPerfilA11y.js';
import { textosPerfilPublicPerIdioma } from '../textosPerfilPublic.js';

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];

describe('Perfil públic, compte i panells d’administració · i18n a11y en 5 llengües (Onada R32.30b)', () => {
  test('totes les entrades de textosPerfilA11y i rentonarDadesRegistralsAria existixen en ca, es, en, eu i gl', () => {
    const claus = Object.keys(textosPerfilA11y({ language: 'ca' }));
    expect(claus.length).toBeGreaterThanOrEqual(30);
    for (const codi of LLENGUES) {
      expect(codiLlenguaPerfil({ language: codi })).toBe(codi);
      const tx = textosPerfilA11y({ language: codi });
      for (const clau of claus) {
        const val = typeof tx[clau] === 'function' ? tx[clau]('Alcoi') : tx[clau];
        expect(typeof val, `${codi}.${clau}`).toBe('string');
        expect(val.trim().length, `${codi}.${clau}`).toBeGreaterThan(0);
        expect(val).not.toContain('undefined');
      }
      const pub = textosPerfilPublicPerIdioma(codi);
      expect(pub.rentonarDadesRegistralsAria.trim().length).toBeGreaterThan(0);
    }
  });

  test('conserva byte a byte els atributs amb apòstrof en valencià (ca) i resol per traductor quan no hi ha language', () => {
    const ca = textosPerfilA11y({ language: 'ca' });
    expect(ca.resumImportacioAria).toBe("Resum d'importació i casos d'ús");
    expect(ca.importadorXmlAria).toBe("Importador d'arxius XML WXR i Blogger");
    expect(ca.filtresBancImportacioAria).toBe("Filtres del banc d'importació");
    expect(ca.inspectorArticleImportatAria).toBe("Inspector comparatiu d'article importat");
    expect(ca.ajustosUsuariTitol).toBe("Ajustos de l'Usuari");
    expect(textosPerfilPublicPerIdioma('ca').rentonarDadesRegistralsAria).toBe('Dades registrals d’El Rentonar');

    expect(codiLlenguaPerfil({ t: () => 'Cerrar sesión' })).toBe('es');
    expect(codiLlenguaPerfil({ t: () => 'Log out' })).toBe('en');
    expect(codiLlenguaPerfil({ t: () => 'Itxi saioa' })).toBe('eu');
    expect(codiLlenguaPerfil({ t: () => 'Pechar sesión' })).toBe('gl');
  });

  /* v1.2.19 · Gauntlet R1 (L3-01) · WCAG 2.5.3: el nom accessible comença pel text visible, en cada llengua. */
  test('ferPrincipal i llevar són el text visible i cada aria-label hi comença; en ca, com en la v1.2.18', () => {
    for (const codi of LLENGUES) {
      const tx = textosPerfilA11y({ language: codi });
      expect(tx.ferPrincipalPobleAria('Benifallim').startsWith(tx.ferPrincipal), codi).toBe(true);
      expect(tx.llevarPobleAria('Benifallim').startsWith(tx.llevar), codi).toBe(true);
    }
    const ca = textosPerfilA11y({ language: 'ca' });
    expect([ca.ferPrincipal, ca.llevar]).toEqual(['Fer principal', 'Llevar']);
    expect(ca.ferPrincipalPobleAria('Benifallim')).toBe('Fer principal Benifallim');
    expect(ca.llevarPobleAria('Benifallim')).toBe('Llevar Benifallim');
  });
});
