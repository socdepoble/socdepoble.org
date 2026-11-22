import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Puzzle } from 'lucide-react';

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ '*': '' }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  Navigate: () => null
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));

import {
  CODIS_IDIOMA_CONSOLA, IdiomaConsolaContext, codiIdiomaConsola, tca
} from './i18nConsolaA11y.js';
import { TargetaConsola } from './peces.jsx';
import { SeccioBotiguesConsola } from './BotiguesConsola.jsx';
import { EvidenciesAvis } from './mapa/AvisosMapa.jsx';
import { DetallPeca } from './mapa/DetallPeca.jsx';
import { PaginaPanellPols } from './PolsConsola.jsx';
import { PaginaXifra } from './XifresMas.jsx';
import { horaCertificacio } from './govern/GovernConsola.jsx';

afterEach(cleanup);

describe('R32.32 · Diccionari modular a11y de la Consola en 5 llengües', () => {
  const CLAUS_ESTATIQUES = [
    'botiguesIVerificadors', 'paginesConsola', 'canalsEmpaquetatsTaxonomia',
    'paginesGovern', 'paginaEmpaquetatsNav', 'estatCadaCanal', 'passosPublicacio',
    'panellNoTrobat', 'veureFonts', 'llegintLaXifra', 'xifraNoTrobada',
    'detallDeLaPeca', 'filtresDelGraf', 'estatPerDins', 'quinsProblemesHiHa'
  ];

  test('retorna valors no buits i sense claus crues en ca, es, en, eu i gl', () => {
    expect(CODIS_IDIOMA_CONSOLA).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
    expect(codiIdiomaConsola('eu-ES')).toBe('eu');
    expect(codiIdiomaConsola('fr')).toBe('ca');
    for (const idioma of CODIS_IDIOMA_CONSOLA) {
      for (const clau of CLAUS_ESTATIQUES) {
        const valor = tca(idioma, clau);
        expect(typeof valor).toBe('string');
        expect(valor.trim().length).toBeGreaterThan(2);
        expect(valor).not.toBe(clau);
      }
      expect(tca(idioma, 'artefactesDe', 'Web')).toContain('Web');
      expect(tca(idioma, 'evidenciesRecompta', 3)).toContain('3');
      // WCAG 2.5.3 (Label in Name): en les traduccions noves comença pel verb visible; en ca conserva el literal canònic.
      if (idioma !== 'ca') {
        expect(tca(idioma, 'veureFontsRebut', '21/11/2026', 2).startsWith(tca(idioma, 'veureFonts'))).toBe(true);
      }
      for (const d of ['validat', 'certificat', 'retornat']) {
        expect(tca(idioma, 'verbDecisioAria', d, 'R-1').startsWith(tca(idioma, 'verbDecisio', d))).toBe(true);
      }
    }
  });

  test('conserva el valencià byte a byte en tots els atributs a11y', () => {
    expect(tca('ca', 'botiguesIVerificadors')).toBe('Botigues i verificadors');
    expect(tca('ca', 'paginesConsola')).toBe('Pàgines de la Consola');
    expect(tca('ca', 'estatPerDins')).toBe('Estat per dins, el més greu primer');
    expect(tca('ca', 'quinsProblemesHiHa')).toBe('Quins problemes hi ha');
    expect(tca('ca', 'detallDeLaPeca')).toBe('Detall de la peça');
    expect(tca('ca', 'filtresDelGraf')).toBe('Filtres del graf');
    expect(tca('ca', 'artefactesDe', 'Android')).toBe('Artefactes de Android, el més recent primer');
    expect(tca('ca', 'veureFontsRebut', '12:00', 1)).toBe('Veure les fonts del rebut de 12:00 (1 font)');
    expect(tca('ca', 'veureFontsRebut', '12:00', 4)).toBe('Veure les fonts del rebut de 12:00 (4 fonts)');
    expect(tca('ca', 'evidenciesRecompta', 5)).toBe('5 evidències');
  });

  test('els components de la Consola pinten els atributs a11y en les 5 llengües via IdiomaConsolaContext', () => {
    for (const idioma of CODIS_IDIOMA_CONSOLA) {
      const { unmount } = render(
        <IdiomaConsolaContext.Provider value={idioma}>
          <SeccioBotiguesConsola />
          <TargetaConsola
            icona={Puzzle}
            titol="Salut"
            subtitol="Subtítol"
            creat="2026-10-04"
            a="/consola/salut"
            estats={[{ clau: 'ok', to: 'exit', text: '10 en ordre' }]}
            problemes={[{ clau: 'p1', to: 'error', marca: 'ERROR', text: 'Falta fitxer' }]}
          />
          <EvidenciesAvis avis={{ evidencies: ['a.js', 'b.js'] }} />
          <DetallPeca
            mapa={{ nodes: [], arestes: [], avisos: [] }}
            graf={{ nodes: [], links: [] }}
            seleccio=""
            onSeleccio={() => {}}
            onRestablir={() => {}}
          />
        </IdiomaConsolaContext.Provider>
      );
      expect(screen.getByRole('region', { name: tca(idioma, 'botiguesIVerificadors') })).not.toBeNull();
      expect(screen.getByRole('list', { name: tca(idioma, 'estatPerDins') })).not.toBeNull();
      expect(screen.getByRole('list', { name: tca(idioma, 'quinsProblemesHiHa') })).not.toBeNull();
      expect(screen.getByRole('list', { name: tca(idioma, 'evidenciesRecompta', 2) })).not.toBeNull();
      expect(screen.getByRole('complementary', { name: tca(idioma, 'detallDeLaPeca') })).not.toBeNull();
      unmount();
    }
  });

  test('PaginaPanellPols i PaginaXifra localitzen els títols d’estat quan l’id o slug no existix', () => {
    for (const idioma of ['ca', 'es', 'en', 'eu', 'gl']) {
      const { container, unmount } = render(
        <IdiomaConsolaContext.Provider value={idioma}>
          <PaginaPanellPols id="inexistent" consola={{ estat: 'absent', dades: null, error: null }} />
          <PaginaXifra
            slug="inexistent"
            xifra={null}
            creat="2026-10-04"
            fonts={{ mapa: { mapa: null, estat: 'absent' }, consola: { dades: null, estat: 'absent' } }}
          />
        </IdiomaConsolaContext.Provider>
      );
      expect(container.textContent).toContain(tca(idioma, 'panellNoTrobat'));
      expect(container.textContent).toContain(tca(idioma, 'xifraNoTrobada'));
      unmount();
    }
  });
});

describe('R32.32 · Vores de dades a GovernConsola', () => {
  test('horaCertificacio mai retorna NaN:NaN davant dates corruptes, buides o fora de rang', () => {
    expect(horaCertificacio('')).toBe('—');
    expect(horaCertificacio(null)).toBe('—');
    expect(horaCertificacio(undefined)).toBe('—');
    expect(horaCertificacio('data-invalida')).toBe('—');
    expect(horaCertificacio(1e20)).toBe('—');
    const valida = horaCertificacio('2026-11-21T09:05:00.000Z');
    expect(valida).toMatch(/^\d{2}:\d{2}$/);
    expect(valida).not.toContain('NaN');
  });
});
