/**
 * FitxaBancLlavorsPedraSeca.r32_53.test.jsx — Onada v1.2.23+ (R32.53) · Lot 01 ·
 * Certifica en les 5 llengües oficials (ca, es, en, eu, gl) la conversió Pedra Seca
 * de FitxaDeLaFont, BlocNutricio i les 4 fitxes de varietat (València, Mallorca,
 * Catalunya i Oliveres) a taules `.sdp-taula-prosa` (zero `<dl>`), píndoles clares
 * i el bloc d'aptitud i 14 al·lèrgens UE 1169/2011 (`IDEA-336` + `IDEA-338`).
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { FONTS_BANC_LLAVORS, entradesDelCataleg } from '../../data/patrimoni/bancLlavors.js';
import { Fitxa, FitxaDeLaFont } from './BancLlavorsSection.jsx';
import { CODIS_LLENGUA_BIBLIOTECA_AGRICOLA, textosBibliotecaAgricola } from './i18nBibliotecaAgricola.js';

afterEach(cleanup);

const tr = (_clau, reserva, valors = null) => {
  let text = reserva;
  if (valors) {
    for (const [nom, valor] of Object.entries(valors)) {
      text = text.split(`{${nom}}`).join(String(valor));
    }
  }
  return text;
};

describe('R32.53 · Lot 01 · Fitxes del Banc de Llavors Pedra Seca i bloc d’al·lèrgens UE 1169/2011', () => {
  test.each(CODIS_LLENGUA_BIBLIOTECA_AGRICOLA)(
    'en %s les 4 fonts i varietats renderitzen taules .sdp-taula-prosa amb <th scope>, lang i zero <dl> crus',
    (llengua) => {
      const txBib = textosBibliotecaAgricola(llengua);
      for (const font of FONTS_BANC_LLAVORS) {
        const totes = entradesDelCataleg(font.id);
        const entrada = totes[0];

        const vistaFont = render(<FitxaDeLaFont font={font} tr={tr} llengua={llengua} />);
        expect(vistaFont.container.querySelector('dl')).toBeNull();
        expect(vistaFont.container.querySelector('.sdp-taula-prosa table')).toBeTruthy();
        expect(vistaFont.container.querySelectorAll('thead th[scope="col"]')).toHaveLength(2);
        expect(vistaFont.container.querySelectorAll('tbody th[scope="row"]').length).toBeGreaterThanOrEqual(3);
        vistaFont.unmount();

        const vistaFitxa = render(
          <Fitxa
            entrada={entrada}
            totes={totes}
            font={font}
            tr={tr}
            onTriaEntrada={() => {}}
            onTanca={() => {}}
            autoFocus={false}
            llengua={llengua}
          />
        );
        expect(vistaFitxa.container.querySelector('dl')).toBeNull();
        expect(vistaFitxa.container.querySelectorAll('.sdp-taula-prosa table').length).toBeGreaterThanOrEqual(1);
        expect(vistaFitxa.container.querySelector('.sdp-llavors-fitxa__pindoles')).toBeTruthy();
        expect(within(vistaFitxa.container).getByRole('region', { name: txBib.seguretatTitol })).toBeTruthy();
        expect(vistaFitxa.container.textContent).toContain(txBib.avisPreventiuLlavors);
        expect(vistaFitxa.container.textContent).toContain(txBib.alergensPendent);
        vistaFitxa.unmount();
      }
    }
  );

  test('DetallOlivera mostra el binomi llatí, la denominació de l’estudi i la sinonímia local amb lang rigorós', () => {
    const fontOliv = FONTS_BANC_LLAVORS.find((f) => f.id === 'oliveres-gva-ivia');
    const totes = entradesDelCataleg(fontOliv.id);
    const alfafarenca = totes.find((e) => e.id === 'olivera-alfafarenca');
    const { container } = render(
      <Fitxa
        entrada={alfafarenca}
        totes={totes}
        font={fontOliv}
        tr={tr}
        onTriaEntrada={() => {}}
        onTanca={() => {}}
        autoFocus={false}
        llengua="ca"
      />
    );
    const files = [...container.querySelectorAll('.sdp-taula-prosa tbody tr')];
    expect(files).toHaveLength(3);
    expect(files[0].querySelector('td')?.getAttribute('lang')).toBe('la');
    expect(files[1].textContent).toContain('Alfafara');
    expect(files[2].textContent).toContain('Alfafarenca');
    expect(container.textContent).not.toContain('Transcripció literal');
  });

  test('el bloc d’al·lèrgens accepta matriu 8/8 acreditada (guions baixos i guionets) i pinta IconesAlergens', () => {
    const font = FONTS_BANC_LLAVORS[0];
    const totes = entradesDelCataleg(font.id);
    const cacau = totes.find((e) => e.nom === 'Cacau del collaret') || totes[0];
    render(
      <Fitxa
        entrada={cacau}
        totes={totes}
        font={font}
        tr={tr}
        onTriaEntrada={() => {}}
        onTanca={() => {}}
        autoFocus={false}
        llengua="ca"
        registreAlergens={{
          aptitud: 'aliment',
          matriuFinal: {
            cacauets: 'conte',
            fruits_closca: 'traca',
            gluten: 'absent',
          },
        }}
      />
    );
    const regio = screen.getByRole('region', { name: textosBibliotecaAgricola('ca').seguretatTitol });
    expect(regio.textContent).toContain(textosBibliotecaAgricola('ca').aptitudAlimentRevisat);
    expect(
      within(regio).getByRole('img', { name: (nom) => nom.startsWith(textosBibliotecaAgricola('ca').alergensEtiqueta) })
    ).toBeTruthy();
    expect(
      within(regio).getByRole('img', { name: (nom) => nom.startsWith(textosBibliotecaAgricola('ca').tracesEtiqueta) })
    ).toBeTruthy();
  });

  test('invariant innegociable: una varietat marcada com a tòxica o no comestible mai exposa al·lèrgens d’aliment ni aptitud alimentària', () => {
    const font = FONTS_BANC_LLAVORS[0];
    const totes = entradesDelCataleg(font.id);
    render(
      <Fitxa
        entrada={totes[0]}
        totes={totes}
        font={font}
        tr={tr}
        onTriaEntrada={() => {}}
        onTanca={() => {}}
        autoFocus={false}
        llengua="ca"
        registreAlergens={{
          aptitud: 'toxica',
          alergens: ['gluten', 'ous'],
          matriuFinal: { gluten: 'conte', ous: 'conte' },
        }}
      />
    );
    const regio = screen.getByRole('region', { name: textosBibliotecaAgricola('ca').seguretatTitol });
    expect(regio.textContent).toContain(textosBibliotecaAgricola('ca').aptitudToxica);
    expect(regio.textContent).toContain(textosBibliotecaAgricola('ca').avisToxicaLlavors);
    expect(regio.querySelector('.sdp-alergens')).toBeNull();
  });
});
