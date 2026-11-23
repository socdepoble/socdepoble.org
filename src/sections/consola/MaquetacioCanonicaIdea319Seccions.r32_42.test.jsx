import fs from 'node:fs';
import path from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { TargetaConsola } from './peces.jsx';
import { IndexConsola } from './IndexConsola.jsx';
import { CandidatsAlergens } from '../../components/PedraSeca/molecules/CandidatsAlergens.jsx';
import { ESTAT_CANDIDATS_ALERGENS } from '../../utils/textosAlergens.js';
import { BlocPerfil } from '../profile/BlocPerfil.jsx';
import { TargetaViva, AVISOS_TARGETA_VIVA } from '../../components/universal/TargetaViva.jsx';

const ARREL = process.cwd();
const llig = (rel) => fs.readFileSync(path.join(ARREL, rel), 'utf8');
const IconaProva = () => <svg aria-hidden="true" />;

afterEach(cleanup);

describe('Onada v1.2.21 · R32.42 · IDEA-319 Maquetació Canònica H3/H4 i amplada 100 % en vistes fora de /disseny', () => {
  test('IndexConsola i TargetaConsola emeten H3 per a l’arrel, H4 per a pàgines/targetes i H5 per a peces/mètriques, sense cap H2', () => {
    const { container } = render(
      <MemoryRouter rutaInicial="/consola">
        <div>
          <TargetaConsola
            icona={IconaProva}
            titol="Targeta de prova"
            headingLevel="h4"
            metriques={['12 fitxers']}
            a="/consola/salut"
          />
          <IndexConsola />
        </div>
      </MemoryRouter>
    );

    expect(container.querySelectorAll('h2')).toHaveLength(0);
    expect(container.querySelector('.sdp-consola__index > h3')).not.toBeNull();
    expect(container.querySelectorAll('.sdp-consola__index-pagina > h4').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.sdp-consola__index-pagina > h5').length).toBeGreaterThan(0);
    expect(container.querySelector('article.sdp-consola__targeta h4.sp-card-title')?.textContent).toBe('Targeta de prova');
    expect(container.querySelector('h5.sdp-consola__metrica')?.textContent).toBe('12 fitxers');
  });

  test('BlocPerfil emet H3 i permet anidar TargetaViva amb headingLevel={4} sense col·lisió jeràrquica', () => {
    const doc = {
      title: 'Associació El Rentonar',
      subtitle: 'Custòdia agrària i patrimoni viu',
      lead: 'Memòria viva de La Torre de les Maçanes.',
      content: '<p>Contingut</p>',
    };
    const { container } = render(
      <MemoryRouter rutaInicial="/perfil">
        <BlocPerfil titol="Vista targeta">
          <TargetaViva
            document={doc}
            autor={{ nom: 'El Rentonar', avatar: '', poble: 'La Torre de les Maçanes', ruta: '/entitat/rentonar' }}
            etiquetes={[]}
            avis={AVISOS_TARGETA_VIVA.perfil}
            headingLevel="h4"
          />
        </BlocPerfil>
      </MemoryRouter>
    );

    const h2ForaDialeg = [...container.querySelectorAll('h2')].filter((h) => !h.closest('dialog'));
    expect(h2ForaDialeg).toHaveLength(0);
    expect(container.querySelector('h3.perfil-compte__titol')?.textContent).toBe('Vista targeta');
    expect(container.querySelector('article.sp-card h4.sp-card-title')?.textContent).toBe('Associació El Rentonar');
  });

  test('CandidatsAlergens admet nivell="h4" quan s’incrusta sota el bloc H3 d’Al·lèrgens en ReceptaDetailSection', () => {
    const proposta = {
      estat: ESTAT_CANDIDATS_ALERGENS,
      cobertura: 'completa',
      alergens: [{ id: 'cacauets', estat: 'candidat', evidencies: [] }],
      pendents: [],
    };
    const { container } = render(
      <CandidatsAlergens proposta={proposta} llengua="ca" nivell="h4" />
    );
    expect(container.querySelector('h3')).toBeNull();
    expect(container.querySelector('h4')).not.toBeNull();
  });

  test('CSS fora de diferit-atles-2d.css: cap selector editorial migrat conserva --sdp-measure ni 68ch/65ch, i la prosa usa --sdp-text-small', () => {
    const modulesCss = llig('src/css/modules.css');
    expect(modulesCss).not.toMatch(/\.sdp-consola__index\s*\{[^}]*max-width:\s*65ch/);
    expect(modulesCss).not.toMatch(/\.sdp-llista-nodes__descripcio\s*\{[^}]*--sdp-measure/);
    expect(modulesCss).not.toMatch(/\.sdp-resultat-cerca__extracte\s*\{[^}]*--sdp-measure/);
    expect(modulesCss).toMatch(/\.devices-panel__body\s+\.card__body\s+p\s*\{[^}]*font-size:\s*var\(--sdp-text-small\)/);

    const modeSeniorCss = llig('src/css/diferit-mode-senior.css');
    expect(modeSeniorCss).not.toMatch(/--sdp-measure/);

    const gestoriaCss = llig('src/css/diferit-gestoria.css');
    expect(gestoriaCss).not.toMatch(/\.sdp-gestoria-enviament\s*\{[^}]*--sdp-measure/);

    const exploradorCss = llig('src/css/diferit-explorador.css');
    expect(exploradorCss).not.toMatch(/\.sdp-explorador__detall\s*>\s*p\s*\{[^}]*--sdp-measure/);

    const appsCss = llig('src/css/diferit-apps-plataforma.css');
    expect(appsCss).not.toMatch(/68ch/);

    const componentsCss = llig('src/css/components.css');
    expect(componentsCss).toMatch(/\.anatomia__nota,\s*\.anatomia__avis\s*\{[^}]*font-size:\s*var\(--sdp-text-small\)/);

    const avisadorCss = llig('src/css/diferit-avisador.css');
    expect(avisadorCss).toMatch(/\.sdp-avisador__nota\s*\{[^}]*font-size:\s*var\(--sdp-text-small\)/);

    const lssiCss = llig('src/css/diferit-denuncies-lssi.css');
    expect(lssiCss).toMatch(/\.sdp-safata-lssi__ajuda\s*\{[^}]*font-size:\s*var\(--sdp-text-small\)/);
  });
});
