import { useState } from 'react';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { UIProvider } from '../../../app/contexts/UIContext.jsx';
import { LANGUAGE_STORAGE_KEY } from '../../../config/i18n.js';
import { delVal } from '../../../config/storage.js';
import CA from '../../../config/idiomes/ca.js';
import ES from '../../../config/idiomes/es.js';
import EN from '../../../config/idiomes/en.js';
import EU from '../../../config/idiomes/eu.js';
import GL from '../../../config/idiomes/gl.js';
import { valorPerDesar } from '../../../sections/profile/perfilCamps.js';
import { DialegEnquadrament } from './DialegEnquadrament.jsx';
/* R22.1 (Gauntlet r221-dades-04, r221-text-01, r221-text-03) · Adreces
   sintètiques del Node 0, amb noms sintètics: cap mitjà d'una entitat real. */
const PORTADA_SINTETICA_URL = 'https://socdepoble.cat/media/portada-sintetica-16x9.webp';
const VIDEO_SINTETIC_URL = 'https://socdepoble.cat/media/video-sintetic.mp4';

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })));
  delVal(LANGUAGE_STORAGE_KEY);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delVal(LANGUAGE_STORAGE_KEY);
});

const eines = () => ({
  carregador: vi.fn(async () => ({ amplada: 1920, alcada: 1080, tipus: 'image/webp', element: {}, allibera: vi.fn() })),
  exportador: vi.fn(async () => new File(['y'], 'capcalera.webp', { type: 'image/webp' })),
  dibuixant: vi.fn(() => true),
});

const carregat = () => act(async () => {});

/* R22.1 (r221-text-10) · Els títols diuen el que es prova: jsdom no maqueta,
   i ací es prova l'ORDRE del DOM. Que la fila i les píndoles caben sense
   scroll ho prova el pressupost del visor (src/css/enquadramentFilaFoto.capes.test.js). */
describe('R22.1 · Peça 4 · DialegEnquadrament Tot-en-Un («Canviar foto» abans del visor + Vídeo Principal + selectors sense aria-hidden + 5 llengües)', () => {
  test('«Canviar foto» va abans del visor en el DOM, input[data-enquadrament-foto] i input[data-enquadrament-video] NO tenen aria-hidden, i es pot vincular, pujar i llevar el vídeo principal', async () => {
    const onCanviaVideo = vi.fn(async () => true);
    const onPujaVideo = vi.fn(async () => VIDEO_SINTETIC_URL);
    const onTanca = vi.fn();
    const vista = render(
      <DialegEnquadrament
        obert
        senzill
        noDestructiu
        font={PORTADA_SINTETICA_URL}
        onCanviaFoto={vi.fn(() => null)}
        ajudaFoto="PNG, JPEG o WebP, fins a 10 MB."
        videoUrl=""
        onCanviaVideo={onCanviaVideo}
        onPujaVideo={onPujaVideo}
        onDesa={vi.fn(async () => true)}
        onTanca={onTanca}
        {...eines()}
      />,
    );
    await carregat();
    const d = vista.getByRole('dialog');

    const inputFoto = d.querySelector('input[type="file"][data-enquadrament-foto]');
    const inputVideo = d.querySelector('input[type="file"][data-enquadrament-video]');
    expect(inputFoto).toBeTruthy();
    expect(inputFoto.hasAttribute('aria-hidden')).toBe(false);
    expect(inputFoto.tabIndex).toBe(-1);
    expect(inputVideo).toBeTruthy();
    expect(inputVideo.hasAttribute('aria-hidden')).toBe(false);
    expect(inputVideo.tabIndex).toBe(-1);

    // «Canviar foto» va abans del visor en l'ordre del DOM (el que cap sense scroll, el pressupost de modules.css)
    const barraFoto = d.querySelector('.sdp-enquadrament__foto');
    const visor = d.querySelector('.sdp-enquadrament__visor-caixa');
    expect(Boolean(barraFoto.compareDocumentPosition(visor) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);

    // L'ajuda diu que només s'admeten vídeos allotjats a Sóc de Poble i quina foto fa de portada
    expect(d.textContent).toContain(CA['editor.enquadrament.videoAjudaPortada']);

    // Rebutja vídeo d'un domini alié
    const campUrl = within(d).getByLabelText(CA['editor.enquadrament.videoEtiqueta']);
    fireEvent.change(campUrl, { target: { value: 'https://youtube.com/watch?v=123' } });
    await act(async () => {
      fireEvent.click(within(d).getByRole('button', { name: CA['editor.enquadrament.videoVincula'] }));
    });
    expect(onCanviaVideo).not.toHaveBeenCalled();
    expect(within(d).getByRole('alert').textContent).toBe(CA['editor.enquadrament.videoErrorFont']);

    // Vincula vídeo propi en HTTPS (.mp4)
    fireEvent.change(campUrl, { target: { value: VIDEO_SINTETIC_URL } });
    await act(async () => {
      fireEvent.click(within(d).getByRole('button', { name: CA['editor.enquadrament.videoVincula'] }));
    });
    expect(onCanviaVideo).toHaveBeenCalledWith(VIDEO_SINTETIC_URL);

    // Puja fitxer de vídeo propi des del selector ocult
    onCanviaVideo.mockClear();
    const fitxerVideo = new File(['video'], 'spot.mp4', { type: 'video/mp4' });
    await act(async () => {
      fireEvent.change(inputVideo, { target: { files: [fitxerVideo] } });
    });
    expect(onPujaVideo).toHaveBeenCalledWith(fitxerVideo);
    expect(onCanviaVideo).toHaveBeenCalledWith(VIDEO_SINTETIC_URL);
  });

  test('prémer «Guardar» desa automàticament el vídeo pendent fins i tot sense moure el marc de la foto, i «Llevar vídeo» el buida', async () => {
    const onCanviaVideo = vi.fn(async () => true);
    const onDesa = vi.fn(async () => true);
    const onTanca = vi.fn();
    const vista = render(
      <DialegEnquadrament
        obert
        senzill
        noDestructiu
        formatInicial="original"
        font={PORTADA_SINTETICA_URL}
        videoUrl=""
        onCanviaVideo={onCanviaVideo}
        onDesa={onDesa}
        onTanca={onTanca}
        {...eines()}
      />,
    );
    await carregat();
    const d = vista.getByRole('dialog');
    const campUrl = within(d).getByLabelText(CA['editor.enquadrament.videoEtiqueta']);
    fireEvent.change(campUrl, { target: { value: VIDEO_SINTETIC_URL } });
    await act(async () => {
      fireEvent.click(within(d).getByRole('button', { name: CA['editor.enquadrament.guardar'] }));
    });
    expect(onCanviaVideo).toHaveBeenCalledWith(VIDEO_SINTETIC_URL);
    expect(onDesa).not.toHaveBeenCalled();
    expect(onTanca).toHaveBeenCalledWith('boto');

    cleanup();
    const onCanviaVideo2 = vi.fn(async () => true);
    const vistaAmbVideo = render(
      <DialegEnquadrament
        obert
        senzill
        noDestructiu
        font={PORTADA_SINTETICA_URL}
        videoUrl={VIDEO_SINTETIC_URL}
        onCanviaVideo={onCanviaVideo2}
        onDesa={vi.fn(async () => true)}
        onTanca={vi.fn()}
        {...eines()}
      />,
    );
    await carregat();
    await act(async () => {
      fireEvent.click(within(vistaAmbVideo.getByRole('dialog')).getByRole('button', { name: CA['editor.enquadrament.videoLleva'] }));
    });
    expect(onCanviaVideo2).toHaveBeenCalledWith('');
  });

  test.each([
    ['ca', CA],
    ['es', ES],
    ['en', EN],
    ['eu', EU],
    ['gl', GL],
  ])('tradueix l’etiqueta i l’ajuda del vídeo a %s', async (idioma, diccionari) => {
    const vista = render(
      <UIProvider externalConfig={{ language: idioma }}>
        <DialegEnquadrament
          obert
          senzill
          font={PORTADA_SINTETICA_URL}
          videoUrl={VIDEO_SINTETIC_URL}
          onCanviaVideo={vi.fn(async () => true)}
          onDesa={vi.fn(async () => true)}
          onTanca={vi.fn()}
          {...eines()}
        />
      </UIProvider>,
    );
    await carregat();
    const d = vista.getByRole('dialog');
    expect(within(d).getByLabelText(diccionari['editor.enquadrament.videoEtiqueta'])).toBeTruthy();
    expect(d.textContent).toContain(diccionari['editor.enquadrament.videoAjudaPortada']);
    expect(within(d).getByRole('button', { name: diccionari['editor.enquadrament.videoVincula'] })).toBeTruthy();
    expect(within(d).getByRole('button', { name: diccionari['editor.enquadrament.videoLleva'] })).toBeTruthy();
  });
});

const diferida = () => {
  let resol;
  let rebutja;
  const promesa = new Promise((r, x) => { resol = r; rebutja = x; });
  return { promesa, resol, rebutja };
};

/* R22.1 (r221-ui-02, r221-text-11) · Sense aria-hidden, els dos selectors de
   fitxers del diàleg són a l'arbre accessible (tabIndex -1 només els trau de
   l'ordre del tabulador): porten el nom del botó que els obri, en la llengua
   de la interfície. Abans no en tenien cap i el navegador els deia en la seua. */
describe('R22.1 · els selectors de fitxers del diàleg tenen nom en la llengua de la interfície', () => {
  test.each([
    ['ca', CA],
    ['es', ES],
    ['en', EN],
    ['eu', EU],
    ['gl', GL],
  ])('a %s, «Canviar foto» i «Pujar vídeo» donen nom als seus input[type=file]', async (idioma, diccionari) => {
    const vista = render(
      <UIProvider externalConfig={{ language: idioma }}>
        <DialegEnquadrament
          obert
          senzill
          font={PORTADA_SINTETICA_URL}
          onCanviaFoto={vi.fn(() => null)}
          videoUrl=""
          onCanviaVideo={vi.fn(async () => true)}
          onPujaVideo={vi.fn(async () => VIDEO_SINTETIC_URL)}
          onDesa={vi.fn(async () => true)}
          onTanca={vi.fn()}
          {...eines()}
        />
      </UIProvider>,
    );
    await carregat();
    const d = vista.getByRole('dialog');
    const foto = within(d).getByLabelText(diccionari['editor.enquadrament.canviaFoto'], { selector: 'input[type="file"]' });
    const video = within(d).getByLabelText(diccionari['editor.enquadrament.videoPuja'], { selector: 'input[type="file"]' });
    expect(foto.hasAttribute('data-enquadrament-foto')).toBe(true);
    expect(video.hasAttribute('data-enquadrament-video')).toBe(true);
    for (const entrada of [foto, video]) {
      expect(entrada.hasAttribute('aria-hidden')).toBe(false);
      expect(entrada.tabIndex).toBe(-1);
    }
  });

  test('una etiqueta pròpia de «Canviar foto» també dona nom al seu selector', async () => {
    const vista = render(
      <DialegEnquadrament obert senzill font={PORTADA_SINTETICA_URL} onCanviaFoto={vi.fn(() => null)}
        etiquetaCanviaFoto="Triar una altra foto" onDesa={vi.fn(async () => true)} onTanca={vi.fn()} {...eines()} />,
    );
    await carregat();
    const d = vista.getByRole('dialog');
    expect(within(d).getByRole('button', { name: 'Triar una altra foto' })).toBeTruthy();
    expect(within(d).getByLabelText('Triar una altra foto', { selector: 'input[type="file"]' })).toBeTruthy();
  });
});

/* R22.1 (r221-text-07) · «Pujant el vídeo…» només mentre es puja un fitxer:
   vincular una adreça o llevar el vídeo també desen, però no pugen res. */
describe('R22.1 · el rètol del botó de pujada només diu «Pujant el vídeo…» quan es puja', () => {
  const rotols = (d) => within(d).getAllByRole('button').map((b) => b.textContent);

  test('vincular, llevar i pujar: cada acció amb el seu rètol', async () => {
    const desat = diferida();
    const pujat = diferida();
    const onCanviaVideo = vi.fn(() => desat.promesa);
    const vista = render(
      <DialegEnquadrament obert senzill font={PORTADA_SINTETICA_URL} videoUrl=""
        onCanviaVideo={onCanviaVideo} onPujaVideo={vi.fn(() => pujat.promesa)}
        onDesa={vi.fn(async () => true)} onTanca={vi.fn()} {...eines()} />,
    );
    await carregat();
    const d = vista.getByRole('dialog');
    fireEvent.change(within(d).getByLabelText(CA['editor.enquadrament.videoEtiqueta']), { target: { value: VIDEO_SINTETIC_URL } });
    await act(async () => { fireEvent.click(within(d).getByRole('button', { name: CA['editor.enquadrament.videoVincula'] })); });
    // Vinculant: desa, però no puja.
    expect(onCanviaVideo).toHaveBeenCalledWith(VIDEO_SINTETIC_URL);
    expect(rotols(d)).toContain(CA['editor.enquadrament.videoPuja']);
    expect(rotols(d)).not.toContain(CA['editor.enquadrament.videoPujant']);
    await act(async () => { desat.resol(true); });

    // Llevant (sense vídeo desat al pare, l'esborrany es buida i prou): tampoc no puja.
    await act(async () => { fireEvent.click(within(d).getByRole('button', { name: CA['editor.enquadrament.videoLleva'] })); });
    expect(rotols(d)).not.toContain(CA['editor.enquadrament.videoPujant']);

    // Pujant un fitxer de veres: ara sí.
    const entrada = d.querySelector('input[type="file"][data-enquadrament-video]');
    await act(async () => { fireEvent.change(entrada, { target: { files: [new File(['v'], 'spot.mp4', { type: 'video/mp4' })] } }); });
    expect(rotols(d)).toContain(CA['editor.enquadrament.videoPujant']);
    expect(rotols(d)).not.toContain(CA['editor.enquadrament.videoPuja']);
    await act(async () => { pujat.resol(VIDEO_SINTETIC_URL); });
    expect(rotols(d)).toContain(CA['editor.enquadrament.videoPuja']);
    expect(rotols(d)).not.toContain(CA['editor.enquadrament.videoPujant']);
  });

  test('llevar un vídeo desat no diu «Pujant el vídeo…» mentre es desa', async () => {
    const desat = diferida();
    const vista = render(
      <DialegEnquadrament obert senzill font={PORTADA_SINTETICA_URL} videoUrl={VIDEO_SINTETIC_URL}
        onCanviaVideo={vi.fn(() => desat.promesa)} onPujaVideo={vi.fn(async () => VIDEO_SINTETIC_URL)}
        onDesa={vi.fn(async () => true)} onTanca={vi.fn()} {...eines()} />,
    );
    await carregat();
    const d = vista.getByRole('dialog');
    await act(async () => { fireEvent.click(within(d).getByRole('button', { name: CA['editor.enquadrament.videoLleva'] })); });
    expect(rotols(d)).toContain(CA['editor.enquadrament.videoPuja']);
    expect(rotols(d)).not.toContain(CA['editor.enquadrament.videoPujant']);
    await act(async () => { desat.resol(true); });
  });
});

/* R22.1 (r221-ui-09) · «Llevar vídeo» es desmunta i «Vincular vídeo» queda
   desactivat quan acaben: el focus no pot caure al <body> (WCAG 2.4.3). Torna
   al camp de l'adreça, dins del diàleg; si la persona ja era en un altre
   control, s'hi queda. El pare fa el que fa PerfilEditor: desa i torna el
   valor nou com a videoUrl. */
function AmbPare({ inicial = '', desa = async () => true }) {
  const [video, setVideo] = useState(inicial);
  return (
    <DialegEnquadrament obert senzill font={PORTADA_SINTETICA_URL} videoUrl={video}
      onCanviaVideo={async (valor) => { const fet = await desa(valor); setVideo(valor); return fet; }}
      onDesa={vi.fn(async () => true)} onTanca={vi.fn()} {...eines()} />
  );
}

describe('R22.1 · el focus no cau al <body> després de vincular o de llevar el vídeo', () => {
  const campUrl = (d) => within(d).getByLabelText(CA['editor.enquadrament.videoEtiqueta']);
  const premsa = async (d, nom) => {
    const boto = within(d).getByRole('button', { name: nom });
    boto.focus();
    expect(document.activeElement).toBe(boto);
    await act(async () => { fireEvent.click(boto); });
    return boto;
  };

  test('«Llevar vídeo» d’un vídeo desat: el botó se’n va i el focus va al camp de l’adreça', async () => {
    const vista = render(<AmbPare inicial={VIDEO_SINTETIC_URL} />);
    await carregat();
    const d = vista.getByRole('dialog');
    const boto = await premsa(d, CA['editor.enquadrament.videoLleva']);
    await carregat();
    expect(boto.isConnected).toBe(false);
    expect(campUrl(d).value).toBe('');
    expect(document.activeElement).toBe(campUrl(d));
  });

  test('«Llevar vídeo» d’un esborrany sense desar: el mateix', async () => {
    const vista = render(<AmbPare />);
    await carregat();
    const d = vista.getByRole('dialog');
    fireEvent.change(campUrl(d), { target: { value: VIDEO_SINTETIC_URL } });
    const boto = await premsa(d, CA['editor.enquadrament.videoLleva']);
    expect(boto.isConnected).toBe(false);
    expect(document.activeElement).toBe(campUrl(d));
  });

  test('«Vincular vídeo»: acaba desactivat (l’adreça ja és la desada) i el focus va al camp de l’adreça', async () => {
    const vista = render(<AmbPare />);
    await carregat();
    const d = vista.getByRole('dialog');
    fireEvent.change(campUrl(d), { target: { value: VIDEO_SINTETIC_URL } });
    const boto = await premsa(d, CA['editor.enquadrament.videoVincula']);
    await carregat();
    expect(boto.disabled).toBe(true);
    expect(campUrl(d).value).toBe(VIDEO_SINTETIC_URL);
    expect(document.activeElement).toBe(campUrl(d));
  });

  test('si mentre es desa la persona ja és en un altre control, el focus s’hi queda', async () => {
    const desat = diferida();
    const vista = render(<AmbPare desa={() => desat.promesa} />);
    await carregat();
    const d = vista.getByRole('dialog');
    fireEvent.change(campUrl(d), { target: { value: VIDEO_SINTETIC_URL } });
    await premsa(d, CA['editor.enquadrament.videoVincula']);
    const cancela = within(d).getByRole('button', { name: CA['common.cancela'] });
    cancela.focus();
    await act(async () => { desat.resol(true); });
    await carregat();
    expect(document.activeElement).toBe(cancela);
  });
});

/* R22.1 (Gauntlet r221-dades-07, r221-text-09 i r221-ui-06) · Un sol
   validador: el diàleg fa servir esVideoDeCapcaleraDesable, el mateix de
   valorPerDesar i el sobre del CHECK de 20261113060000. Abans en tenia un de
   propi que donava per bo el bucket privat i '..': la cua el rebutjava
   després, amb un avís d'«imatge» que culpava el servidor. Un relatiu sense
   barra o un http:// el CHECK els rebutja (23514): el diàleg també. */
describe('R22.1 · el diàleg valida el vídeo amb el validador de valorPerDesar', () => {
  const DOLENTS = [
    ['el bucket privat', 'sdp-media://mitjans_privats/00000000-0000-4000-8000-000000000001/secret.mp4'],
    ['un «..» dins de la referència pública', 'sdp-media://mitjans/../fora.mp4'],
    ['un «..» que salta al bucket privat', 'sdp-media://mitjans/../mitjans_privats/u/x.mp4'],
    ['un camí relatiu sense barra', 'media/spot.mp4'],
    ['un camí relatiu amb punt', './spot.webm'],
    ['un nom de fitxer sol', 'spot.webm'],
    // L'origen de la finestra de jsdom és http: el mateix origen, però no https (el CHECK el rebutja).
    ['un http:// del mateix origen de la finestra', `${window.location.origin}/media/spot.mp4`],
    ['una imatge del Node 0', 'https://socdepoble.cat/media/foto.webp'],
    ['massa llarg', `https://socdepoble.org/media/${'v'.repeat(2050)}.mp4`],
  ];
  const BONS = [
    VIDEO_SINTETIC_URL,
    'https://socdepoble.org/media/spot.webm?v=2',
    'sdp-media://mitjans/00000000-0000-4000-8000-000000000001/spot.mp4',
    '/media/video-propi.mp4',
  ];

  const vincula = async (valor) => {
    const onCanviaVideo = vi.fn(async () => true);
    const vista = render(
      <DialegEnquadrament obert senzill font={PORTADA_SINTETICA_URL} videoUrl=""
        onCanviaVideo={onCanviaVideo} onDesa={vi.fn(async () => true)} onTanca={vi.fn()} {...eines()} />,
    );
    await carregat();
    const d = vista.getByRole('dialog');
    fireEvent.change(within(d).getByLabelText(CA['editor.enquadrament.videoEtiqueta']), { target: { value: valor } });
    await act(async () => { fireEvent.click(within(d).getByRole('button', { name: CA['editor.enquadrament.videoVincula'] })); });
    const avis = within(d).queryByRole('alert')?.textContent ?? null;
    cleanup();
    return { onCanviaVideo, avis };
  };

  test.each(DOLENTS)('«Vincular vídeo» rebutja %s al diàleg mateix, sense desar res', async (_cas, valor) => {
    const { onCanviaVideo, avis } = await vincula(valor);
    expect(onCanviaVideo).not.toHaveBeenCalled();
    expect(avis).toBe(CA['editor.enquadrament.videoErrorFont']);
    // El mateix que diria la cua: valorPerDesar també el rebutja.
    expect(() => valorPerDesar('organitzacio', 'heroVideo', valor)).toThrow(/\.mp4 o \.webm/);
  });

  test('admet el mateix que valorPerDesar: un https propi, el bucket públic i un camí propi', async () => {
    for (const valor of BONS) {
      const { onCanviaVideo, avis } = await vincula(valor);
      expect(onCanviaVideo, valor).toHaveBeenCalledWith(valor);
      expect(avis, valor).toBeNull();
      expect(valorPerDesar('organitzacio', 'heroVideo', valor)).toEqual({ columna: 'hero_video_url', valor });
    }
  });
});

/* R22.1 (Gauntlet, P2 del Node 0, i r221-text-05 b) · «Guardar» desava
   primer el vídeo pendent i, si fallava, la foto retallada tampoc no es
   desava. Ara la foto es desa sempre, i l'avís del vídeo ix al diàleg. */
describe('R22.1 · un vídeo pendent mai bloqueja el desat de la foto', () => {
  const fitxer = () => new File(['x'], 'portada.webp', { type: 'image/webp' });

  test('si el desat del vídeo falla, la foto es desa igual i l’avís del vídeo ix al diàleg', async () => {
    const onCanviaVideo = vi.fn(async () => { throw new Error('El servidor no ha acceptat el vídeo.'); });
    const onDesa = vi.fn(async () => true);
    const vista = render(
      <DialegEnquadrament obert senzill noDestructiu font={fitxer()} videoUrl=""
        onCanviaVideo={onCanviaVideo} onDesa={onDesa} onTanca={vi.fn()}
        lectorMetadades={vi.fn(async () => null)} {...eines()} />,
    );
    await carregat();
    const d = vista.getByRole('dialog');
    fireEvent.change(within(d).getByLabelText(CA['editor.enquadrament.videoEtiqueta']), { target: { value: VIDEO_SINTETIC_URL } });
    await act(async () => { fireEvent.click(within(d).getByRole('button', { name: CA['editor.enquadrament.guardar'] })); });
    expect(onCanviaVideo).toHaveBeenCalledWith(VIDEO_SINTETIC_URL);
    expect(onDesa).toHaveBeenCalledTimes(1);
    expect(onDesa.mock.calls[0][0]).toBeInstanceOf(File);
    expect(within(d).getByRole('alert').textContent).toBe('El servidor no ha acceptat el vídeo.');
  });

  test('amb el vídeo desat, la foto es desa després, sense cap avís', async () => {
    const ordre = [];
    const onCanviaVideo = vi.fn(async () => { ordre.push('video'); return true; });
    const onDesa = vi.fn(async () => { ordre.push('foto'); return true; });
    const vista = render(
      <DialegEnquadrament obert senzill noDestructiu font={fitxer()} videoUrl=""
        onCanviaVideo={onCanviaVideo} onDesa={onDesa} onTanca={vi.fn()}
        lectorMetadades={vi.fn(async () => null)} {...eines()} />,
    );
    await carregat();
    const d = vista.getByRole('dialog');
    fireEvent.change(within(d).getByLabelText(CA['editor.enquadrament.videoEtiqueta']), { target: { value: VIDEO_SINTETIC_URL } });
    await act(async () => { fireEvent.click(within(d).getByRole('button', { name: CA['editor.enquadrament.guardar'] })); });
    expect(ordre).toEqual(['video', 'foto']);
    expect(within(d).queryByRole('alert')).toBeNull();
  });
});
