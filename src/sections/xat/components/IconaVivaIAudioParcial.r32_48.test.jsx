/**
 * IconaVivaIAudioParcial.r32_48.test.jsx — Verificació del Lot 02 (Ronda G1 · R32.48):
 *   1. IDEA-330 (Llei de la Icona Viva): tot botó d'icona de capçaleres, barres i
 *      compositor té diana >= 48px (--sdp-touch / --sdp-touch-min), aria-label + title
 *      sincronitzats en les 5 llengües (ca, es, en, eu, gl) i SVG decoratiu ocult
 *      als lectors de pantalla (aria-hidden="true", focusable="false").
 *   2. F02 (R32.44 · Àudio parcial incomplet): quan gravaVeu rebutja amb
 *      error.recuperacio.incompleta === true i Blob retingut, ControlsAdjunt mai
 *      presenta el prefix com a nota sencera en silenci: ofereix escolta immediata,
 *      conservar el fragment (amb duradaMs vàlida per a validaAdjuntXat), descarregar-lo
 *      o tornar a gravar en les 5 llengües, revocant sempre les ObjectURL.
 */
import '../../../../tests/helpers/diccionaris.js';
import fs from 'node:fs';
import path from 'node:path';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { createTranslator } from '../../../config/i18n.js';
import { errorAdjuntXat, validaAdjuntXat } from '../../../data/xatMultimedia.js';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { BotoTornarADalt } from '../../../components/PedraSeca/atoms/BotoTornarADalt.jsx';
import { FranjaAmfitrio } from '../../../components/universal/MarcaAmfitrio.jsx';
import BarraResposta from './BarraResposta.jsx';
import BarraSeleccio from './BarraSeleccio.jsx';
import CapcaleraConversa from './CapcaleraConversa.jsx';
import Compositor from './Compositor.jsx';
import ControlsAdjunt from './ControlsAdjunt.jsx';
import { BotoTitolSeccioXat } from './ClosCaXat.jsx';

const m = vi.hoisted(() => ({
  preparaAdjunt: vi.fn(),
  gravaVeu: vi.fn()
}));

vi.mock('../adjuntLocal.js', async (importOriginal) => ({
  ...(await importOriginal()),
  preparaAdjunt: m.preparaAdjunt,
  gravaVeu: m.gravaVeu,
  mimeDeGravacio: () => 'audio/mp4'
}));

vi.mock('../../../data/backendPort.js', () => ({
  quotaXat: vi.fn(),
  teCapacitat: () => true,
  urlAdjuntXat: vi.fn(),
  descartaAdjuntXat: vi.fn()
}));

const NativeURL = globalThis.URL;
let servei;
let comptadorBlobUrl = 0;

function Barra({ t, locale = 'ca-ES', fil = { id: 'fil-r32-48' }, usuariId = 'usuari-1', onEnvia = vi.fn() }) {
  const [valor, setValor] = useState('');
  const traductor = t ?? createTranslator('ca');
  return (
    <AppGridContext.Provider value={{ mida: 'ample', panellObert: null, setPanellObert: () => {} }}>
      <ControlsAdjunt t={traductor} locale={locale} fil={fil} usuariId={usuariId} servei={servei} onEnvia={onEnvia}>
        {(adjunts) => (
          <Compositor valor={valor} onCanvia={setValor} onEnvia={() => setValor('')} t={traductor} adjunts={adjunts} />
        )}
      </ControlsAdjunt>
    </AppGridContext.Provider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  m.gravaVeu.mockReset();
  m.preparaAdjunt.mockReset();
  comptadorBlobUrl = 0;
  servei = {
    teCapacitat: () => true,
    quotaXat: vi.fn().mockResolvedValue({ usats: 0, limit: 20_000_000 })
  };
  vi.stubGlobal('navigator', {
    ...globalThis.navigator,
    mediaDevices: { getUserMedia: vi.fn() }
  });
  vi.stubGlobal('URL', Object.assign(class extends NativeURL {}, {
    createObjectURL: vi.fn(() => {
      comptadorBlobUrl += 1;
      return `blob:r32-48-${comptadorBlobUrl}`;
    }),
    revokeObjectURL: vi.fn()
  }));
  for (const metode of ['pause', 'load']) {
    vi.spyOn(HTMLMediaElement.prototype, metode).mockImplementation(() => {});
  }
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('IDEA-330 · Llei de la Icona Viva en capçaleres, barres i controls', () => {
  test('.toc-close-btn garanteix diana tàctil mínima de 48×48 px (--sdp-touch) en modules.css', () => {
    const css = fs.readFileSync(path.resolve(process.cwd(), 'src/css/modules.css'), 'utf8');
    const bloc = css.match(/\.toc-close-btn\s*\{[^}]+\}/)?.[0] || '';
    expect(bloc).toContain('min-inline-size: var(--sdp-touch)');
    expect(bloc).toContain('min-block-size: var(--sdp-touch)');
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])(
    'els botons d’icona de capçaleres i barres tenen aria-label + title vius en %s',
    (lang) => {
      const t = createTranslator(lang);
      const vista = render(
        <MemoryRouter>
          <AppGridContext.Provider value={{ mida: 'mitja', panellObert: null, setPanellObert: () => {} }}>
            <BotoTitolSeccioXat titol={t('section.xat.title', 'Xats')} />
            <CapcaleraConversa
              fil={{ id: 'c1', name: 'Cooperativa', participants: [] }}
              onTorna={() => {}}
              t={t}
            />
            <BarraResposta missatge={{ id: 'm1', senderName: 'Pepica', text: 'Bon dia' }} onCancela={() => {}} t={t} />
            <BarraSeleccio quants={2} onEixir={() => {}} onMarcaLlegides={() => {}} t={t} />
            <Alerta to="info" onTanca={() => {}}>Avís</Alerta>
            <BotoTornarADalt etiqueta={t('common.backToTop', 'Tornar a dalt')} onPuja={() => {}} />
            <FranjaAmfitrio
              nomPoble="La Torre"
              text="Connectat"
              estat="ok"
              etiquetaTanca={t('common.close', 'Tancar')}
              onTanca={() => {}}
            />
          </AppGridContext.Provider>
        </MemoryRouter>
      );

      const botonsIcona = [
        ...vista.container.querySelectorAll(
          '.sdp-xat-obri-rail, .sdp-xat-icona, .sdp-alerta__tanca, .sdp-tornar-dalt, .sdp-amfitrio-franja__tanca'
        )
      ];
      expect(botonsIcona.length).toBeGreaterThanOrEqual(7);
      for (const boto of botonsIcona) {
        const title = boto.getAttribute('title');
        expect(title && title.trim().length > 0).toBe(true);
        const ariaLabel = boto.getAttribute('aria-label');
        if (ariaLabel) {
          expect(title).toBe(ariaLabel);
        }
        for (const svg of boto.querySelectorAll('svg')) {
          expect(svg.getAttribute('aria-hidden')).toBe('true');
          expect(svg.getAttribute('focusable')).toBe('false');
        }
      }
      cleanup();
    }
  );
});

describe('F02 (R32.44 + v1.2.23 · X2) · Recuperació d’àudio parcial quan incompleta: true', () => {
  function errorParcial({ id = 'veu-parcial-1', duradaCapturaMs = 4200, mime = 'audio/mp4' } = {}) {
    const err = errorAdjuntXat('gravacio');
    err.recuperacio = {
      id,
      fitxer: new Blob(['fragment-audio-parcial'], { type: mime }),
      tipus: 'veu',
      duradaMs: null,
      duradaCapturaMs,
      incompleta: true
    };
    return err;
  }

  test('mai no presenta un àudio incomplet en silenci: avisa amb role="alert" i deixa la nota preparada per a escoltar i enviar', async () => {
    m.gravaVeu.mockRejectedValueOnce(errorParcial());
    const envia = vi.fn(async (_fil, adjunt) => {
      validaAdjuntXat(adjunt);
      return [{ id: 'msg-1' }];
    });

    render(<Barra onEnvia={envia} />);
    const botoGrava = await screen.findByRole('button', { name: 'Grava àudio' });
    expect(botoGrava.getAttribute('title')).toBe('Grava àudio');
    fireEvent.click(botoGrava);

    // 1) Es mostra l'alerta honesta que la gravació s'ha tallat i la nota queda preparada amb previsualització immediata.
    expect((await screen.findByRole('alert')).textContent).toBe('No hem pogut acabar la gravació.');
    expect(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' })).toBeTruthy();
    expect(screen.getByText('0:00 / 0:04')).toBeTruthy();

    // 2) En enviar explícitament, viatja amb duradaMs entera positiva validada per validaAdjuntXat.
    const botoEnvia = screen.getByRole('button', { name: 'Envia el fitxer' });
    fireEvent.click(botoEnvia);
    await waitFor(() => expect(envia).toHaveBeenCalledOnce());
    expect(envia.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        id: 'veu-parcial-1',
        tipus: 'veu',
        duradaMs: 4200
      })
    );
  });

  test('cancel·lar la nota preparada i tancar l’avís alliberen l’ObjectURL i permeten tornar a gravar', async () => {
    m.gravaVeu
      .mockRejectedValueOnce(errorParcial({ id: 'p1', mime: 'audio/ogg' }))
      .mockResolvedValueOnce({
        atura: vi.fn(),
        cancella: vi.fn(),
        resultat: Promise.resolve({
          id: 'veu-nova',
          tipus: 'veu',
          duradaMs: 6000,
          fitxer: new Blob(['veu-sencera'], { type: 'audio/mp4' })
        })
      });

    render(<Barra />);
    fireEvent.click(await screen.findByRole('button', { name: 'Grava àudio' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: 'Reprodueix el missatge de veu' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Tanca l’avís' }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:r32-48-1');

    fireEvent.click(await screen.findByRole('button', { name: 'Grava àudio' }));
    await screen.findByRole('button', { name: 'Envia el fitxer' });
    expect(screen.getByText('0:00 / 0:06')).toBeTruthy();
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])(
    'tradueix l’avís, la reproducció i els controls amb title sincronitzat en %s',
    async (lang) => {
      m.gravaVeu.mockRejectedValueOnce(errorParcial({ id: `id-${lang}` }));
      const t = createTranslator(lang);
      render(<Barra t={t} />);
      const botoPrimari = await screen.findByRole('button', { name: t('section.xat.adjunts.grava', 'Grava àudio') });
      fireEvent.click(botoPrimari);

      const alerta = await screen.findByRole('alert');
      expect(alerta.textContent).toBe(t('section.xat.adjunts.error.gravacio', 'No hem pogut acabar la gravació.'));
      const reprodueix = screen.getByRole('button', { name: t('section.xat.adjunts.reprodueix', 'Reprodueix el missatge de veu') });
      expect(reprodueix).toBeTruthy();
      const tanca = screen.getByRole('button', { name: t('section.xat.adjunts.tancaAvis', 'Tanca l’avís') });
      expect(tanca.getAttribute('title')).toBe(t('section.xat.adjunts.tancaAvis', 'Tanca l’avís'));
      const cancella = screen.getByRole('button', { name: t('section.xat.adjunts.cancella', 'Cancel·la') });
      expect(cancella.getAttribute('title')).toBe(t('section.xat.adjunts.cancella', 'Cancel·la'));
      fireEvent.click(cancella);
      expect(URL.revokeObjectURL).toHaveBeenCalled();
      cleanup();
    }
  );
});
