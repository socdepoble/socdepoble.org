import '../../../../tests/helpers/diccionaris.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { createTranslator } from '../../../config/i18n.js';
import ca from '../../../config/idiomes/ca.js';
import es from '../../../config/idiomes/es.js';
import en from '../../../config/idiomes/en.js';
import eu from '../../../config/idiomes/eu.js';
import gl from '../../../config/idiomes/gl.js';
import { MISSATGE_QUOTA_XAT, errorAdjuntXat } from '../../../data/xatMultimedia.js';
import { RegistrationStep } from '../../onboarding/OnboardingSteps.jsx';
import { BotoIdentitatActiva } from '../../../components/universal/identitat/BotoIdentitatActiva.jsx';
import { extreuUbicacioFitxer, formataCoordenadesCurtes, normalitzaUbicacio, urlMapaUbicacio } from '../ubicacioMitjaUI.js';
import ControlsAdjunt from './ControlsAdjunt.jsx';
import Compositor from './Compositor.jsx';
import Bombolla from './Bombolla.jsx';
import Conversa from './Conversa.jsx';
import { buidaEsborranys } from '../esborranys.js';

const m = vi.hoisted(() => ({ preparaAdjunt: vi.fn(), gravaVeu: vi.fn() }));
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

/* Onada R32.8 (kit Codex) · El vídeo del xat arriba ara a 60 segons: el
   selector de la galeria ho diu així en el diccionari i en el component. */
const SELECTOR_GALERIA = 'Tria una foto o un vídeo de fins a 60 segons';
const NativeURL = globalThis.URL;
const fil = Object.freeze({ id: 'fil-safareig', tipus: 'grup', name: 'Patrimoni del Riu', potEscriure: true, llegitFinsSeq: 10 });

function BarraMostra({ servei, onEnvia, t }) {
  const [valor, setValor] = useState('');
  return (
    <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: () => {} }}>
      <ControlsAdjunt usuariId="sofia-bornay" fil={fil} servei={servei} onEnvia={onEnvia} t={t}>
        {(adjunts) => <Compositor valor={valor} onCanvia={setValor} onEnvia={() => setValor('')} t={t} adjunts={adjunts} />}
      </ControlsAdjunt>
    </AppGridContext.Provider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  buidaEsborranys();
  vi.stubGlobal('URL', Object.assign(class extends NativeURL {}, {
    createObjectURL: vi.fn().mockReturnValue('blob:safareig-local'),
    revokeObjectURL: vi.fn()
  }));
  for (const metode of ['pause', 'load']) vi.spyOn(HTMLMediaElement.prototype, metode).mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('R32.8 · Lot 01 + Lot 02 · Google Omnicanal, Geolocalització per Defecte, Avís ✕ i Avatar SB 36px', () => {
  test('Lot 01 · RegistrationStep mostra el commutador Entrar | Crear compte dalt de tot i connecta Crear compte amb el botó de Google', () => {
    const t = createTranslator('ca');
    const { container } = render(
      <MemoryRouter>
        <RegistrationStep
          modeInicial="crear"
          teAccesGoogle
          onRegister={vi.fn()}
          onLogin={vi.fn()}
          t={t}
        />
      </MemoryRouter>
    );

    const pindola = container.querySelector('.onboarding-form__pindola');
    const intro = container.querySelector('.onboarding-card__intro');
    expect(pindola).not.toBeNull();
    expect(intro).not.toBeNull();
    expect(pindola.compareDocumentPosition(intro) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText('També pots crear el compte en un sol toc amb el botó de Google de dalt.')).toBeTruthy();
  });

  test('Lot 02 · ubicacioMitjaUI rescata ISO-6709 de vídeo MP4/MOV i valida rangs geogràfics', async () => {
    expect(normalitzaUbicacio({ lat: 0, lng: 0 })).toBeNull();
    expect(normalitzaUbicacio({ lat: 95, lng: -0.4 })).toBeNull();
    expect(formataCoordenadesCurtes({ lat: 38.6412, lng: -0.4912 })).toBe('38.64°, -0.49°');
    expect(urlMapaUbicacio({ lat: 38.6412, lng: -0.4912 })).toBe('https://www.openstreetmap.org/?mlat=38.64120&mlon=-0.49120#map=17/38.64120/-0.49120');

    const bytesIso = new TextEncoder().encode('ftypmp42...moov...udta...©xyz+38.5892-000.4214+780.0/...');
    const videoFitxer = new Blob([bytesIso], { type: 'video/mp4' });
    await expect(extreuUbicacioFitxer(videoFitxer)).resolves.toEqual({ lat: 38.5892, lng: -0.4214, altitud: 780 });
  });

  test('Lot 02 · ControlsAdjunt activa la ubicació per defecte («Ubicació inclosa») i permet amagar-la en 1 toc («Amaga el lloc»)', async () => {
    const t = createTranslator('ca');
    const servei = { teCapacitat: () => true, quotaXat: vi.fn().mockResolvedValue({ usats: 0, limit: 250_000_000 }) };
    const envia = vi.fn().mockResolvedValue([{ id: 'msg-1' }]);

    m.preparaAdjunt.mockImplementation(async () => ({
      id: 'adj-safareig',
      tipus: 'video',
      duradaMs: 8000,
      senseUbicacio: true,
      ubicacio: { lat: 38.6412, lng: -0.4912 },
      fitxer: new Blob(['video'], { type: 'video/mp4' })
    }));

    render(<BarraMostra servei={servei} onEnvia={envia} t={t} />);
    const adjunta = await screen.findByRole('button', { name: 'Adjunta' });
    await waitFor(() => expect(adjunta.hasAttribute('aria-disabled')).toBe(false));

    fireEvent.change(screen.getByLabelText(SELECTOR_GALERIA), {
      target: { files: [new Blob(['video'], { type: 'video/mp4' })] }
    });

    // Per defecte: ubicació activa i visible abans d'enviar (text i format de Codex R32.8, píndola de Gemini).
    expect(await screen.findByText(/S’inclourà la ubicació on s’ha fet \(38,64°, -0,49°\)/)).toBeTruthy();
    const botoAmaga = screen.getByRole('button', { name: 'Amaga el lloc' });

    // «Amaga el lloc» neteja el fitxer (identificador nou) i passa a «Ubicació amagada»; s'envia sense coordenades.
    fireEvent.click(botoAmaga);
    expect(await screen.findByText('Ubicació amagada')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
    await waitFor(() => expect(envia).toHaveBeenCalledTimes(1));
    expect(envia.mock.calls[0][1]).toMatchObject({ conservaUbicacio: false, senseUbicacio: true });
    expect(envia.mock.calls[0][1].ubicacio).toBeUndefined();
    expect(envia.mock.calls[0][1].id).not.toBe('adj-safareig');
  });

  test('Lot 02 · ControlsAdjunt i els 5 diccionaris eliminen la broma dels diners del servidor i tenen botó ✕ per tancar l’avís', async () => {
    for (const dict of [ca, es, en, eu, gl]) {
      const quotaTxt = dict['section.xat.adjunts.error.quota'];
      expect(typeof quotaTxt).toBe('string');
      expect(quotaTxt.length).toBeGreaterThan(20);
      expect(quotaTxt.toLowerCase()).not.toMatch(/diners|dinero|money|diru|cartos/);
      expect(typeof dict['section.xat.ubicacio.amaga']).toBe('string');
      expect(typeof dict['section.xat.ubicacio.veureMapa']).toBe('string');
      expect(typeof dict['section.xat.adjunts.tancaAvis']).toBe('string');
    }

    const t = createTranslator('ca');
    const servei = { teCapacitat: () => true, quotaXat: vi.fn().mockResolvedValue({ usats: 19_999_999, limit: 20_000_000 }) };
    m.preparaAdjunt.mockResolvedValueOnce({
      id: 'adj-gran',
      tipus: 'imatge',
      fitxer: new Blob(['gran'], { type: 'image/webp' })
    });

    render(<BarraMostra servei={servei} onEnvia={vi.fn()} t={t} />);
    const adjunta = await screen.findByRole('button', { name: 'Adjunta' });
    await waitFor(() => expect(adjunta.hasAttribute('aria-disabled')).toBe(false));

    fireEvent.change(screen.getByLabelText(SELECTOR_GALERIA), {
      target: { files: [new Blob(['gran'], { type: 'image/jpeg' })] }
    });

    const alerta = await screen.findByRole('alert');
    /* Integració R32.8 a 3 vies · El text de la quota és el de Codex R32.8
       (MISSATGE_QUOTA_XAT, la font única que també copia el diccionari): la
       redacció de Gemini no va entrar al diccionari. */
    expect(alerta.textContent).toBe(MISSATGE_QUOTA_XAT);
    expect(alerta.textContent).toBe(ca['section.xat.adjunts.error.quota']);
    const botoTanca = screen.getByRole('button', { name: 'Tanca l’avís' });
    fireEvent.click(botoTanca);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('Lot 02 · Bombolla pinta «Veure al mapa» clicable (no enfocable en triable), Conversa tanca avisFil amb ✕ i BotoIdentitatActiva mesura 36px visuals', () => {
    const t = createTranslator('ca');
    const missatgeUbicat = {
      id: 'm-safareig',
      seq: 1,
      sender: 'other',
      author: 'Sofía Bornay',
      usuariId: 'sofia-bornay',
      text: 'El safareig antic del riu.',
      metadades: { ubicacio: { lat: 38.5892, lng: -0.4214 } },
      creatAl: '2026-11-17T17:20:00.000Z',
      estatEnviament: 'enviat'
    };

    const { rerender, container } = render(
      <MemoryRouter>
        <ol className="sdp-xat-missatges">
          <Bombolla missatge={missatgeUbicat} esGrup locale="ca-ES" t={t} />
        </ol>
      </MemoryRouter>
    );

    const enllacMapa = screen.getByRole('link', { name: 'Veure al mapa' });
    expect(enllacMapa.getAttribute('href')).toContain('mlat=38.58920&mlon=-0.42140');
    expect(enllacMapa.getAttribute('target')).toBe('_blank');

    rerender(
      <MemoryRouter>
        <ol className="sdp-xat-missatges">
          <Bombolla
            missatge={missatgeUbicat}
            esGrup
            seleccio={{ actiu: true, triat: false, onAlterna: vi.fn() }}
            locale="ca-ES"
            t={t}
          />
        </ol>
      </MemoryRouter>
    );
    expect(screen.queryByRole('link', { name: 'Veure al mapa' })).toBeNull();
    expect(container.querySelector('.sdp-xat-ubicacio-xip')?.tagName).toBe('SPAN');

    cleanup();

    // Conversa: avisFil tancable amb ✕
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, value: 400 });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 400 });
    try {
      render(
        <MemoryRouter>
          <AppGridContext.Provider value={{ mida: 'ample' }}>
            <Conversa
              fil={fil}
              messages={[missatgeUbicat]}
              avisFil={errorAdjuntXat('xarxa')}
              onSendMessage={vi.fn()}
              onBack={vi.fn()}
              onEnviaAlBloc={vi.fn()}
              onCopia={vi.fn()}
              hiHaMes={false}
              carregantMes={false}
              onCarregaMes={vi.fn()}
              onReintenta={vi.fn()}
              onDescarta={vi.fn()}
              onMarcaVist={vi.fn()}
              locale="ca-ES"
              t={t}
            />
          </AppGridContext.Provider>
        </MemoryRouter>
      );
      expect(screen.getByText("No s'ha pogut actualitzar la conversa.")).toBeTruthy();
      fireEvent.click(within(document.querySelector('.sdp-xat-avis-public')).getByRole('button', { name: 'Tanca l’avís' }));
      expect(screen.queryByText("No s'ha pogut actualitzar la conversa.")).toBeNull();
    } finally {
      delete HTMLElement.prototype.scrollHeight;
      delete HTMLElement.prototype.clientHeight;
    }

    cleanup();

    // Cercle SB 36px (2.25rem) dins de diana --sdp-touch a header.bar-black
    render(
      <header className="bar-black">
        <div className="right-icons">
          <BotoIdentitatActiva teSessio perfil nom="Sofía Bornay" llavor="sofia-bornay" onClick={vi.fn()} />
        </div>
      </header>
    );
    expect(screen.getByRole('button', { name: 'El teu perfil: Sofía Bornay' }).textContent).toBe('SB');
    const modulesCss = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8');
    expect(modulesCss).toMatch(/\.sdp-top-bar-avatar\s+\.sdp-avatar\s*\{[^}]*width:\s*2\.25rem;\s*height:\s*2\.25rem;/);
  });
});
