/**
 * FitxaHerbariPedraSeca.r32_50.test.jsx — Onada v1.2.23 (R32.50) · IDEA-338 + IDEA-336 ·
 * Verifica el redisseny Pedra Seca de FitxaHerbari:
 *   1. Substitució del <dl> cru per píndoles d'usos i paratge + taula semàntica
 *      `.sdp-taula-prosa` de 2 columnes (amb <th scope="col">, <th scope="row"> i lang).
 *   2. Bloc d'aptitud alimentària / toxicitat + integració d'IconesAlergens per al
 *      contracte d'unanimitat 8/8 d'IDEA-336 (`aptitud`, `matriuFinal`).
 *   3. Invariant innegociable: una planta tòxica o no comestible mai es mostra com
 *      a apta per al consum ni exposa al·lèrgens alimentaris enganyosos.
 *   4. Peu net de Font Documental amb SHA-256 segmentat amb <wbr>.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { ESPECIES_HERBARI_LA_TORRE_117 } from '../../data/patrimoni/herbariLaTorre117.js';
import FitxaHerbari from './FitxaHerbari.jsx';
import { TEXTOS_HERBARI } from './textosHerbari.js';

afterEach(cleanup);

describe('IDEA-338 · FitxaHerbari Pedra Seca (píndoles, .sdp-taula-prosa, seguretat/al·lèrgens i font)', () => {
  test.each(Object.entries(TEXTOS_HERBARI))(
    'en %s pinta píndoles d’usos i paratge, taula .sdp-taula-prosa accessible i peu de Font Documental sense <dl>',
    (_lang, tx) => {
      const arnet = ESPECIES_HERBARI_LA_TORRE_117.find((e) => e.id.includes('arnet-roig')) || ESPECIES_HERBARI_LA_TORRE_117[2];
      const { container, unmount } = render(<FitxaHerbari especie={arnet} textos={tx} />);

      expect(container.querySelector('dl')).toBeNull();
      const llistaPindoles = container.querySelector('.sdp-herbari-fitxa__pindoles');
      expect(llistaPindoles).toBeTruthy();
      expect(llistaPindoles.textContent).toContain(tx.aliment);
      expect(llistaPindoles.textContent).toContain(arnet.zonaHerbari);

      const taulaWrap = container.querySelector('.sdp-taula-prosa');
      expect(taulaWrap).toBeTruthy();
      expect(taulaWrap.getAttribute('role')).toBe('region');
      expect(taulaWrap.getAttribute('tabindex')).toBe('0');
      const taula = taulaWrap.querySelector('table');
      expect(within(taula).getAllByRole('columnheader')).toHaveLength(2);
      expect(within(taula).getAllByRole('rowheader')).toHaveLength(4);
      expect(within(taula).getByText(arnet.nomCastella).closest('td').getAttribute('lang')).toBe('es');
      expect(within(taula).getByText(arnet.nomAngles).closest('td').getAttribute('lang')).toBe('en');
      expect(within(taula).getByText(arnet.nomCientific).closest('td').getAttribute('lang')).toBe('la');

      expect(container.textContent).toContain(tx.alergensPendent);
      expect(container.textContent).toContain(arnet.font.document);
      expect(container.querySelectorAll('.sdp-herbari-fitxa__empremta code wbr').length).toBeGreaterThanOrEqual(7);
      unmount();
    }
  );

  test('connecta IconesAlergens quan arriba un registre de consens 8/8 d’IDEA-336 per a una espècie alimentària (ex. Ametler -> fruits_closca)', () => {
    const ametler = ESPECIES_HERBARI_LA_TORRE_117.find((e) => e.slug === 'ametler') || ESPECIES_HERBARI_LA_TORRE_117[2];
    const registre = {
      aptitud: 'aliment',
      estatConsens: 'unanimitat_8x8',
      matriuFinal: {
        gluten: 'absent',
        crustacis: 'absent',
        ous: 'absent',
        peix: 'absent',
        cacauets: 'absent',
        soja: 'absent',
        llet: 'absent',
        fruits_closca: 'conte',
        api: 'absent',
        mostassa: 'absent',
        sesam: 'traca',
        sulfits: 'absent',
        tramussos: 'absent',
        molluscs: 'absent',
      },
    };
    render(<FitxaHerbari especie={ametler} textos={TEXTOS_HERBARI.ca} registreAlergens={registre} />);

    const iconesPrincipals = screen.getByRole('img', { name: /Al·lèrgens:.*fruits de closca/i });
    expect(iconesPrincipals).toBeTruthy();
    const iconesTraces = screen.getByRole('img', { name: /Possibles traces:.*sèsam/i });
    expect(iconesTraces).toBeTruthy();
  });

  test('invariant de seguretat IDEA-336: una espècie tòxica mai mostra aptitud alimentària ni icones d’al·lèrgens d’aliment', () => {
    const toxica = ESPECIES_HERBARI_LA_TORRE_117.find((e) => e.esToxica === true);
    const registreMalformat = {
      aptitud: 'aliment',
      alergens: ['gluten'],
    };
    const { container } = render(<FitxaHerbari especie={toxica} textos={TEXTOS_HERBARI.ca} registreAlergens={registreMalformat} />);

    expect(screen.getByText(TEXTOS_HERBARI.ca.aptitudToxica)).toBeTruthy();
    expect(screen.getByText(TEXTOS_HERBARI.ca.toxicitatAdvertida)).toBeTruthy();
    expect(container.querySelector('.sdp-alergens')).toBeNull();
  });
});
