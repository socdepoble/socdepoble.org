import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* Onada 4 (retallador senzill, ordre del Mestre 261008) · Un botó, una
   imatge: el selector de fitxers amagat, els 10 MB, la finestra de retall i
   UNA pujada pel camí de sempre (useHeroImageHandler). jsdom no té canvas: la
   frontera amb el navegador (imatgeCanvas.js), compressImage i el fetch del
   data URL se simulen. La resta és real. */
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn(), compressImage: vi.fn() }));
vi.mock('../../components/universal/enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: () => true,
  exportaRetall: dobles.exportaRetall,
}));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));
import { AVIS_IMATGE_PUJANT, ERROR_DESAT_IMATGE, useImatgeDeFitxa } from './useImatgeDeFitxa.jsx';
import fontDelHook from './useImatgeDeFitxa.jsx?raw';
import {
  ACCEPT_FOTO, ERROR_PES_FOTO, ERROR_TIPUS_FOTO, PES_MAXIM_FOTO,
} from '../../components/universal/enquadrament/useEnquadramentImatge.jsx';
import { AJUDA_IMATGE_PUJANT } from '../../components/universal/UniversalEditorShell.jsx';
import { ERROR_PRESSUPOST } from '../../utils/pujadaImatge.js';

const MB = 1024 * 1024;
const URL_MITJA = 'sdp-media://mitjans/t/u/avatars/hero.webp';
const DATA_URL = 'data:image/webp;base64,AAAA';

/** Una foto de `mb` megabytes (només la mida: el contingut no es llig). */
function foto(mb = 1, nom = 'foto.jpg', tipus = 'image/jpeg') {
  const fitxer = new File(['x'], nom, { type: tipus });
  Object.defineProperty(fitxer, 'size', { value: Math.round(mb * MB) });
  return fitxer;
}

beforeEach(() => {
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 4000, alcada: 2000, tipus: 'image/jpeg', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockImplementation(async () => foto(0.3, 'enquadrament.jpg'));
  dobles.compressImage.mockReset().mockResolvedValue(DATA_URL);
  vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => new Blob(['w'], { type: 'image/webp' }) })));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* Un consumidor mínim: el botó que obri, l'estat de la pujada, l'input i la finestra. */
function Prova({ control, ...opcions }) {
  const imatge = useImatgeDeFitxa(opcions);
  return (
    <>
      <button type="button" onClick={() => imatge.obri(control)}>Obrir</button>
      <output>{imatge.pujant ? 'pujant' : 'quiet'}</output>
      {imatge.input}
      {imatge.dialeg}
    </>
  );
}

function munta({ camp = 'heroImage', forma = 'capcalera', control = undefined, ...resta } = {}) {
  const p = {
    onImageUpload: vi.fn(async () => URL_MITJA), onDesaCamp: vi.fn(async () => true), onError: vi.fn(), onDesat: vi.fn(), ...resta,
  };
  const vista = render(<Prova camp={camp} forma={forma} control={control} {...p} />);
  return { ...vista, ...p, input: vista.container.querySelector(`input[data-imatge-de-fitxa="${camp}"]`) };
}
async function tria(vista, fitxer) {
  await act(async () => { fireEvent.change(vista.input, { target: { files: [fitxer] } }); });
  await act(async () => {});
}
const guarda = (nom) => act(async () => {
  fireEvent.click(within(screen.getByRole('dialog', { name: nom })).getByRole('button', { name: 'Guardar' }));
});

/* Correcció de la revisió (261008) · L'avís de «encara puja» de la fitxa és
   la MATEIXA constant que la guarda de la closca (AJUDA_IMATGE_PUJANT), no
   una còpia del text: el hook la importa i la torna a exportar. Este fitxer
   importa el hook abans que la closca, l'ordre en què un cicle la deixaria
   buida. Revisió del 261008 · toBe sobre cadenes només compara el valor: la
   identitat la garantix el text font (l'import amb àlies de la closca, cap
   declaració pròpia i cap literal). Les expressions toleren espais, salts de
   línia i altres noms al mateix import, com els deixaria un formatador. */
const RE_IMPORT_DE_LA_CLOSCA = new RegExp(
  String.raw`import\s*\{[^}]*\bAJUDA_IMATGE_PUJANT\s+as\s+AVIS_IMATGE_PUJANT\b[^}]*\}\s*`
  + String.raw`from\s*(['"])\.\.\/\.\.\/components\/universal\/UniversalEditorShell\.jsx\1`
);
const RE_REEXPORTACIO = /export\s*\{[^}]*\bAVIS_IMATGE_PUJANT\b[^}]*\}/;
const RE_DECLARACIO_PROPIA = /\b(?:const|let|var|function|class)\s+AVIS_IMATGE_PUJANT\b/;

describe('l’avís de pujada', () => {
  test('AVIS_IMATGE_PUJANT és AJUDA_IMATGE_PUJANT de UniversalEditorShell, no una còpia', () => {
    expect(AVIS_IMATGE_PUJANT).toBe(AJUDA_IMATGE_PUJANT);
    expect(AVIS_IMATGE_PUJANT).toBe('Encara s’està desant la imatge. Quan acabe, la podràs tornar a canviar.');
    expect(fontDelHook).toMatch(RE_IMPORT_DE_LA_CLOSCA);
    expect(fontDelHook).toMatch(RE_REEXPORTACIO);
    expect(fontDelHook).not.toMatch(RE_DECLARACIO_PROPIA);
    // Cap literal propi: si la closca canvia el text, la fitxa canvia amb ella.
    expect(fontDelHook).not.toContain('Encara s’està desant');
  });

  test('les expressions del text font no depenen del format de la línia', () => {
    const partit = [
      'import {',
      '  ALTRA_COSA,',
      '  AJUDA_IMATGE_PUJANT as AVIS_IMATGE_PUJANT,',
      "} from '../../components/universal/UniversalEditorShell.jsx';",
    ].join('\n');
    expect(partit).toMatch(RE_IMPORT_DE_LA_CLOSCA);
    expect('export {\n  AVIS_IMATGE_PUJANT,\n  ALTRA_COSA\n};').toMatch(RE_REEXPORTACIO);
    // Un altre mòdul, o el nom sense àlies, no valen; una còpia local sí que es veu.
    expect("import { AJUDA_IMATGE_PUJANT as AVIS_IMATGE_PUJANT } from './UniversalEditorShell.jsx';").not.toMatch(RE_IMPORT_DE_LA_CLOSCA);
    expect("import { AJUDA_IMATGE_PUJANT } from '../../components/universal/UniversalEditorShell.jsx';").not.toMatch(RE_IMPORT_DE_LA_CLOSCA);
    expect("export const AVIS_IMATGE_PUJANT = 'x';").toMatch(RE_DECLARACIO_PROPIA);
  });
});

describe('el selector de fitxers', () => {
  test('obri fa clic a l’input amagat, que diu què s’admet', () => {
    const vista = munta();
    const clic = vi.spyOn(vista.input, 'click');
    fireEvent.click(screen.getByRole('button', { name: 'Obrir' }));
    expect(clic).toHaveBeenCalledTimes(1);
    expect(vista.input.getAttribute('accept')).toBe(ACCEPT_FOTO);
    expect(ACCEPT_FOTO).toBe('image/png,image/jpeg,image/webp');
    expect(vista.input.getAttribute('aria-hidden')).toBe('true');
    expect(vista.input.tabIndex).toBe(-1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('tancar el selector sense triar (cancel) no puja fins a cap <dialog>', () => {
    const vista = munta();
    const pare = vi.fn();
    vista.container.addEventListener('cancel', pare);
    vista.input.dispatchEvent(new Event('cancel', { bubbles: true }));
    expect(pare).not.toHaveBeenCalled();
  });
});

describe('el filtre de pes i de tipus, abans d’obrir res', () => {
  test('més de 10 MB: l’avís (toast) i cap finestra, ni es llig la foto', async () => {
    expect(PES_MAXIM_FOTO).toBe(10 * MB);
    const vista = munta();
    await tria(vista, foto(10.5));
    expect(vista.onError).toHaveBeenCalledWith(ERROR_PES_FOTO);
    expect(ERROR_PES_FOTO).toContain('10 MB');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(dobles.carregaImatge).not.toHaveBeenCalled();
    expect(vista.onImageUpload).not.toHaveBeenCalled();
  });

  test('una foto de mòbil de 9 MB sí que arriba a la finestra', async () => {
    const vista = munta();
    await tria(vista, foto(9));
    expect(vista.onError).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Retalla la capçalera' })).toBeTruthy();
  });

  test('un fitxer que no és imatge, o un format que no és PNG, JPEG ni WebP: l’avís i cap finestra', async () => {
    const vista = munta();
    await tria(vista, foto(1, 'nota.pdf', 'application/pdf'));
    await tria(vista, foto(1, 'gat.gif', 'image/gif'));
    expect(vista.onError.mock.calls).toEqual([[ERROR_TIPUS_FOTO], [ERROR_TIPUS_FOTO]]);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Guardar · una pujada', () => {
  /* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · Abans el retall de la
     capçalera era de 1.200 × 675 (16:9); ara és un quadrat de 1.200 × 1.200. */
  test('capçalera: el retall de 1.200 × 1.200 puja UNA vegada sense tornar-lo a reduir, i es desa el camp', async () => {
    const acaba = vi.fn();
    const vista = munta({ control: { acaba } });
    fireEvent.click(screen.getByRole('button', { name: 'Obrir' }));
    await tria(vista, foto(3));
    expect(vista.onImageUpload).not.toHaveBeenCalled();
    await guarda('Retalla la capçalera');
    expect(dobles.exportaRetall).toHaveBeenCalledTimes(1);
    expect(dobles.exportaRetall.mock.calls[0][2]).toEqual({ amplada: 1200, alcada: 1200, tipus: 'image/jpeg' });
    const retallat = await dobles.exportaRetall.mock.results[0].value;
    expect(dobles.compressImage).toHaveBeenCalledTimes(1);
    expect(dobles.compressImage).toHaveBeenCalledWith(retallat, { maxSize: 1200, format: 'image/webp', quality: 0.8 });
    expect(vista.onImageUpload).toHaveBeenCalledTimes(1);
    expect(vista.onImageUpload.mock.calls[0][0].name).toBe('heroImage.webp');
    expect(vista.onDesaCamp.mock.calls).toEqual([['heroImage', URL_MITJA]]);
    expect(acaba).toHaveBeenCalledTimes(1);
    expect(vista.onDesat).toHaveBeenCalledWith('heroImage');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(vista.onError).not.toHaveBeenCalled();
  });

  test('logotip: 600 × 600 exactes, comprimit a 600 (no a 1.200) al camp logoImage', async () => {
    const vista = munta({ camp: 'logoImage', forma: 'logotip' });
    await tria(vista, foto(2, 'logo.png', 'image/png'));
    await guarda('Retalla el logotip');
    expect(dobles.exportaRetall.mock.calls[0][2]).toEqual({ amplada: 600, alcada: 600, tipus: 'image/png' });
    expect(dobles.compressImage.mock.calls[0][1]).toEqual({ maxSize: 600, format: 'image/webp', quality: 0.8 });
    expect(vista.onImageUpload.mock.calls[0][0].name).toBe('logoImage.webp');
    expect(vista.onDesaCamp.mock.calls).toEqual([['logoImage', URL_MITJA]]);
  });

  test('un retall de 6 MB (més que els 5 de sempre) puja: el límit és el de la foto de fitxa', async () => {
    dobles.exportaRetall.mockImplementation(async () => foto(6, 'enquadrament.png', 'image/png'));
    const vista = munta();
    await tria(vista, foto(8));
    await guarda('Retalla la capçalera');
    expect(dobles.compressImage).toHaveBeenCalledTimes(1);
    expect(vista.onDesaCamp).toHaveBeenCalledTimes(1);
  });

  test('un esdeveniment no és cap control: no es crida cap `acaba`', async () => {
    const vista = munta({ control: { type: 'click', acaba: 'no' } });
    fireEvent.click(screen.getByRole('button', { name: 'Obrir' }));
    await tria(vista, foto(1));
    await guarda('Retalla la capçalera');
    expect(vista.onDesaCamp).toHaveBeenCalledTimes(1);
  });
});

describe('Cancel·lar i els errors', () => {
  test('Cancel·lar no puja res ni desa res, i la closca no torna a la imatge', async () => {
    const acaba = vi.fn();
    const vista = munta({ control: { acaba } });
    fireEvent.click(screen.getByRole('button', { name: 'Obrir' }));
    await tria(vista, foto(1));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Retalla la capçalera' })).getByRole('button', { name: 'Cancel·lar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(dobles.exportaRetall).not.toHaveBeenCalled();
    expect(vista.onImageUpload).not.toHaveBeenCalled();
    expect(vista.onDesaCamp).not.toHaveBeenCalled();
    expect(acaba).not.toHaveBeenCalled();
    expect(vista.onDesat).not.toHaveBeenCalled();
  });

  /* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · L'avatar d'una persona es
     desa al camp logoImage, però puja com a avatar: 400 × 400 exactes i dins
     del pressupost de les fotos (la forma va amb el fitxer). Un fetch que
     torna els bytes de veres del data URL i un codificador que en fa el pes
     que se li diu. */
  const pesDeQualitat = (pesos) => async (_f, { quality }) => `data:image/webp;base64,${btoa(`RIFF\u0000\u0000\u0000\u0000WEBPVP8 ${'x'.repeat(pesos(quality) - 16)}`)}`;
  function fetchDeVeres() {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const bytes = Uint8Array.from(atob(url.slice(url.indexOf(',') + 1)), (c) => c.charCodeAt(0));
      return { blob: async () => new Blob([bytes], { type: 'image/webp' }) };
    }));
  }

  test('avatar (camp logoImage): 400 × 400 exactes i, si pesa massa, baixa la qualitat a la mateixa mida', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(pesDeQualitat((q) => (q > 0.7 ? 90000 : 50000)));
    const vista = munta({ camp: 'logoImage', forma: 'avatar' });
    await tria(vista, foto(2));
    await guarda('Retalla la foto');
    expect(dobles.exportaRetall.mock.calls[0][2]).toEqual({ amplada: 400, alcada: 400, tipus: 'image/jpeg' });
    /* Gauntlet 261016 (P1 de l'auditoria adversarial) · Abans, l'escala fixa
       (0,8, 0,72 i 0,64, el primer que hi cabia); ara, la cerca de la qualitat
       més alta que hi cap (0,68), sempre a 400. */
    expect(dobles.compressImage.mock.calls.map(([, o]) => [o.maxSize, o.quality])).toEqual([0.8, 0.4, 0.6, 0.68, 0.72].map((q) => [400, q]));
    expect(vista.onImageUpload.mock.calls.map(([f]) => [f.name, f.size])).toEqual([['logoImage.webp', 50000]]);
    expect(vista.onDesaCamp.mock.calls).toEqual([['logoImage', URL_MITJA]]);
  });

  test('una foto que pesa massa fins i tot a la qualitat més baixa: l’avís dins de la finestra, cap pujada ni desat', async () => {
    fetchDeVeres();
    dobles.compressImage.mockImplementation(pesDeQualitat(() => 90000));
    const vista = munta();
    await tria(vista, foto(2));
    await guarda('Retalla la capçalera');
    const finestra = screen.getByRole('dialog', { name: 'Retalla la capçalera' });
    expect(within(finestra).getByRole('alert').textContent).toBe(ERROR_PRESSUPOST);
    // Gauntlet 261016 (P1) · La cerca fins a la qualitat mínima: cinc intents (abans, els sis de l'escala).
    expect(dobles.compressImage.mock.calls.map(([, o]) => o.quality)).toEqual([0.8, 0.4, 0.2, 0.08, 0.04]);
    expect(vista.onImageUpload).not.toHaveBeenCalled();
    expect(vista.onDesaCamp).not.toHaveBeenCalled();
    expect(vista.onError).not.toHaveBeenCalled();
  });

  test('si la pujada falla, l’error ix en línia dins de la finestra (cap toast) i torna a provar', async () => {
    const onImageUpload = vi.fn().mockRejectedValueOnce(new Error('Sense xarxa.')).mockResolvedValueOnce(URL_MITJA);
    const vista = munta({ onImageUpload });
    await tria(vista, foto(1));
    await guarda('Retalla la capçalera');
    const finestra = screen.getByRole('dialog', { name: 'Retalla la capçalera' });
    expect(within(finestra).getByRole('alert').textContent).toBe('Sense xarxa.');
    expect(vista.onError).not.toHaveBeenCalled();
    expect(vista.onDesaCamp).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toBe('quiet');
    await guarda('Retalla la capçalera');
    expect(onImageUpload).toHaveBeenCalledTimes(2);
    expect(vista.onDesaCamp.mock.calls).toEqual([['heroImage', URL_MITJA]]);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  /* Bloc 3.5.4 (Gauntlet 261016; P2 de Codex, «error 403») · Abans, el
     resultat del desat del camp s'esperava sense mirar-lo: un false (la cua
     del Perfil no ha pogut deixar la imatge al servidor) tancava la finestra,
     cridava `acaba` i onDesat com si s'haguera desat. */
  test('si el desat del camp torna false, la finestra continua oberta amb l’avís, sense acaba ni onDesat; tornar a Guardar ho torna a provar', async () => {
    const acaba = vi.fn();
    const onDesaCamp = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const vista = munta({ control: { acaba }, camp: 'logoImage', forma: 'avatar', onDesaCamp });
    fireEvent.click(screen.getByRole('button', { name: 'Obrir' }));
    await tria(vista, foto(1));
    await guarda('Retalla la foto');
    const finestra = screen.getByRole('dialog', { name: 'Retalla la foto' });
    expect(within(finestra).getByRole('alert').textContent).toBe(ERROR_DESAT_IMATGE);
    expect(acaba).not.toHaveBeenCalled();
    expect(vista.onDesat).not.toHaveBeenCalled();
    expect(vista.onError).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toBe('quiet');
    await guarda('Retalla la foto');
    expect(onDesaCamp.mock.calls).toEqual([['logoImage', URL_MITJA], ['logoImage', URL_MITJA]]);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(acaba).toHaveBeenCalledTimes(1);
    expect(vista.onDesat).toHaveBeenCalledWith('logoImage');
  });

  test('si el desat del camp rebutja, el seu missatge és l’avís de la finestra', async () => {
    const onDesaCamp = vi.fn(async () => { throw new Error('El servidor no ha acceptat la imatge.'); });
    const vista = munta({ onDesaCamp });
    await tria(vista, foto(1));
    await guarda('Retalla la capçalera');
    expect(within(screen.getByRole('dialog', { name: 'Retalla la capçalera' })).getByRole('alert').textContent)
      .toBe('El servidor no ha acceptat la imatge.');
    expect(vista.onDesat).not.toHaveBeenCalled();
    expect(vista.onError).not.toHaveBeenCalled();
  });

  test('un desat que no diu res (undefined) continua sent un desat fet, com sempre', async () => {
    const vista = munta({ onDesaCamp: vi.fn(async () => undefined) });
    await tria(vista, foto(1));
    await guarda('Retalla la capçalera');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(vista.onDesat).toHaveBeenCalledWith('heroImage');
  });
});

/* Correcció de la revisió (261008) · La guarda de pujada de l'ordre E
   (261007) a la fitxa. Escape tanca la finestra encara que estiga desant, i
   el desat continua: tornar a obrir o triar una altra foto no ha de llançar
   una segona pujada que trepitge la primera (ni el seu control). */
describe('Escape a mitja pujada', () => {
  const SEGONA = 'sdp-media://mitjans/t/u/avatars/segona.webp';
  /* Una pujada que no acaba fins que la prova ho diu. */
  function pujadaPendent() {
    const estat = {};
    const onImageUpload = vi.fn()
      .mockImplementationOnce(() => new Promise((resol, rebutja) => Object.assign(estat, { resol, rebutja })))
      .mockResolvedValue(SEGONA);
    return { onImageUpload, estat };
  }
  async function guardaIEscapa(nom) {
    await guarda(nom);
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('pujant'));
    await act(async () => { fireEvent(screen.getByRole('dialog', { name: nom }), new Event('cancel', { cancelable: true })); });
    expect(screen.queryByRole('dialog')).toBeNull();
  }

  test('tornar a obrir o triar una altra foto no puja res més; guanya la primera, amb el seu control', async () => {
    const { onImageUpload, estat } = pujadaPendent();
    const acaba = vi.fn();
    const vista = munta({ onImageUpload, control: { acaba } });
    fireEvent.click(screen.getByRole('button', { name: 'Obrir' }));
    await tria(vista, foto(1));
    await guardaIEscapa('Retalla la capçalera');
    await waitFor(() => expect(onImageUpload).toHaveBeenCalledTimes(1));

    const clic = vi.spyOn(vista.input, 'click');
    fireEvent.click(screen.getByRole('button', { name: 'Obrir' }));
    expect(clic).not.toHaveBeenCalled();
    // Un fitxer que arriba igualment (un selector que ja era obert): ni finestra ni pujada.
    await tria(vista, foto(1, 'segona.jpg'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(vista.onError.mock.calls).toEqual([[AVIS_IMATGE_PUJANT, 'info'], [AVIS_IMATGE_PUJANT, 'info']]);

    await act(async () => { estat.resol(URL_MITJA); });
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('quiet'));
    expect(onImageUpload).toHaveBeenCalledTimes(1);
    expect(vista.onDesaCamp.mock.calls).toEqual([['heroImage', URL_MITJA]]);
    expect(acaba).toHaveBeenCalledTimes(1);
    expect(vista.onDesat).toHaveBeenCalledWith('heroImage');
    // Acabada la pujada, es torna a poder obrir.
    fireEvent.click(screen.getByRole('button', { name: 'Obrir' }));
    expect(clic).toHaveBeenCalledTimes(1);
  });

  test('si la pujada falla amb la finestra ja tancada, l’avís va fora (toast) i no es desa res', async () => {
    const { onImageUpload, estat } = pujadaPendent();
    const vista = munta({ camp: 'logoImage', forma: 'logotip', onImageUpload });
    await tria(vista, foto(1, 'logo.png', 'image/png'));
    await guardaIEscapa('Retalla el logotip');
    await waitFor(() => expect(onImageUpload).toHaveBeenCalledTimes(1));
    await act(async () => { estat.rebutja(new Error('Sense xarxa.')); });
    await waitFor(() => expect(vista.onError).toHaveBeenCalledWith('Sense xarxa.'));
    expect(vista.onError).toHaveBeenCalledTimes(1);
    expect(vista.onDesaCamp).not.toHaveBeenCalled();
    expect(vista.onDesat).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toBe('quiet');
  });
});

/* ═══════════════════════════════════════════════════════════════════
   ORDRE DEL MESTRE (18-10-2026, RELLEU DEL PLA 2000, PUNT 2) · «En fer clic
   directament sobre el cercle de l'avatar, obri directament
   DialegEnquadrament carregant la imatge que ja hi ha … i agrupa "Canviar
   foto", "Llevar avatar" i "Guardar enquadre" dins del propi diàleg.»
   L'opció `finestra` i les eixides `ajusta` i `tanca` del hook. Sense
   `finestra`, la finestra de sempre (les proves de dalt).
   ═══════════════════════════════════════════════════════════════════ */
describe('Pla 2000 · ajusta, finestra i tanca', () => {
  const ADRECA = 'https://mitjans.test/avatar.webp';
  const FINESTRA = Object.freeze({ canviaFoto: true, ajudaFoto: 'PNG, JPEG o WebP, fins a 10 MB.', etiquetaDesa: 'Guardar enquadre' });

  /* El consumidor de dalt, amb els dos botons nous: «Ajustar» (l'adreça ja
     resolta) i «Tancar» (tanca). */
  function ProvaAjust({ font = ADRECA, ...opcions }) {
    const imatge = useImatgeDeFitxa(opcions);
    return (
      <>
        <button type="button" onClick={() => imatge.ajusta(font)}>Ajustar</button>
        <button type="button" onClick={() => imatge.obri()}>Obrir</button>
        <button type="button" onClick={() => imatge.tanca()}>Tancar</button>
        <output>{imatge.pujant ? 'pujant' : 'quiet'}</output>
        {imatge.input}
        {imatge.dialeg}
      </>
    );
  }
  function muntaAjust({ finestra = FINESTRA, font = ADRECA, ...resta } = {}) {
    const p = {
      onImageUpload: vi.fn(async () => URL_MITJA), onDesaCamp: vi.fn(async () => true), onError: vi.fn(), onDesat: vi.fn(), ...resta,
    };
    const vista = render(<ProvaAjust camp="logoImage" forma="avatar" font={font} finestra={finestra} {...p} />);
    return { ...vista, ...p, input: vista.container.querySelector('input[data-imatge-de-fitxa="logoImage"]') };
  }
  const finestraOberta = () => screen.getByRole('dialog', { name: 'Retalla la foto' });

  test('ajusta(adreça) obri la finestra amb eixa imatge, sense passar pel selector ni validar-la', async () => {
    const vista = muntaAjust();
    const clic = vi.spyOn(vista.input, 'click');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ajustar' })); });
    expect(clic).not.toHaveBeenCalled();
    expect(dobles.carregaImatge.mock.calls.map(([font]) => font)).toEqual([ADRECA]);
    expect(finestraOberta().querySelector('.sdp-enquadrament__visor-caixa--cercle')).not.toBeNull();
    expect(vista.onError).not.toHaveBeenCalled();
  });

  test('ajusta sense adreça no obri res (qui crida obri el selector)', async () => {
    muntaAjust({ font: '' });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ajustar' })); });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(dobles.carregaImatge).not.toHaveBeenCalled();
  });

  test('la finestra porta «Canviar foto», els formats i «Guardar enquadre»; sense `finestra`, la de sempre', async () => {
    muntaAjust();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ajustar' })); });
    const d = finestraOberta();
    expect(within(d).getByRole('button', { name: 'Canviar foto', description: FINESTRA.ajudaFoto })).toBeTruthy();
    expect(d.querySelector('input[type="file"][data-enquadrament-foto]').getAttribute('accept')).toBe(ACCEPT_FOTO);
    expect([...d.querySelectorAll('.sdp-dialeg__peu button')].map((b) => b.textContent)).toEqual(['Restablir', 'Cancel·lar', 'Guardar enquadre']);
    cleanup();
    muntaAjust({ finestra: null });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ajustar' })); });
    expect(finestraOberta().querySelector('.sdp-enquadrament__foto')).toBeNull();
    expect(within(finestraOberta()).getByRole('button', { name: 'Guardar' })).toBeTruthy();
  });

  test('«Canviar foto» obri la foto nova en la mateixa finestra; una que no s’admet ho diu dins i no la canvia', async () => {
    const vista = muntaAjust();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ajustar' })); });
    const d = finestraOberta();
    const dins = d.querySelector('input[type="file"][data-enquadrament-foto]');
    await act(async () => { fireEvent.change(dins, { target: { files: [foto(1, 'gif.gif', 'image/gif')] } }); });
    expect(within(d).getByRole('alert').textContent).toBe(ERROR_TIPUS_FOTO);
    await act(async () => { fireEvent.change(dins, { target: { files: [foto(11)] } }); });
    expect(within(d).getByRole('alert').textContent).toBe(ERROR_PES_FOTO);
    expect(dobles.carregaImatge).toHaveBeenCalledTimes(1);
    // Cap toast: el modal el taparia.
    expect(vista.onError).not.toHaveBeenCalled();
    const nova = foto(2, 'nova.jpg');
    await act(async () => { fireEvent.change(dins, { target: { files: [nova] } }); });
    expect(dobles.carregaImatge).toHaveBeenLastCalledWith(nova, expect.anything());
    expect(finestraOberta()).toBe(d);
    expect(within(d).queryByRole('alert')).toBeNull();
  });

  test('Guardar enquadre puja el retall pel camí de sempre i desa el camp: la persona no torna a triar cap fitxer', async () => {
    const vista = muntaAjust();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ajustar' })); });
    // 4000 × 2000 en cercle: el quadrat central de 2000, a 400 × 400.
    await act(async () => { fireEvent.click(within(finestraOberta()).getByRole('button', { name: 'Guardar enquadre' })); });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(dobles.exportaRetall.mock.calls[0].slice(1)).toEqual([{ x: 1000, y: 0, w: 2000, h: 2000 }, { amplada: 400, alcada: 400, tipus: 'image/jpeg' }]);
    expect(vista.onImageUpload).toHaveBeenCalledTimes(1);
    expect(vista.onDesaCamp.mock.calls).toEqual([['logoImage', URL_MITJA]]);
    expect(vista.onDesat).toHaveBeenCalledWith('logoImage');
  });

  /* Correcció F3 de la revisió · La imatge que ja hi ha (una adreça) ix en el
     format de la que s'ha carregat: un PNG o un WebP amb transparència no
     torna amb fons blanc. Una foto nova de «Canviar foto», pel seu tipus. */
  test('re-enquadrar la que ja hi ha conserva el format de la imatge carregada (WebP o PNG → PNG, JPEG → JPEG)', async () => {
    dobles.carregaImatge.mockResolvedValue({ amplada: 4000, alcada: 2000, tipus: 'image/webp', element: {}, allibera: vi.fn() });
    muntaAjust();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ajustar' })); });
    await act(async () => { fireEvent.click(within(finestraOberta()).getByRole('button', { name: 'Guardar enquadre' })); });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(dobles.exportaRetall.mock.calls[0][2]).toEqual({ amplada: 400, alcada: 400, tipus: 'image/png' });
    cleanup();
    dobles.carregaImatge.mockResolvedValue({ amplada: 4000, alcada: 2000, tipus: 'image/png', element: {}, allibera: vi.fn() });
    muntaAjust();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ajustar' })); });
    // «Canviar foto» amb una foto JPEG nova: pel tipus del fitxer, com sempre.
    const dins = finestraOberta().querySelector('input[type="file"][data-enquadrament-foto]');
    await act(async () => { fireEvent.change(dins, { target: { files: [foto(1, 'nova.jpg', 'image/jpeg')] } }); });
    await act(async () => {});
    await act(async () => { fireEvent.click(within(finestraOberta()).getByRole('button', { name: 'Guardar enquadre' })); });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(dobles.exportaRetall.mock.calls[1][2]).toEqual({ amplada: 400, alcada: 400, tipus: 'image/jpeg' });
  });

  test('mentre puja, «Canviar foto» és desactivat i ajusta no fa res més que dir-ho; tanca tanca la finestra', async () => {
    let resol;
    const onImageUpload = vi.fn(() => new Promise((r) => { resol = r; }));
    const vista = muntaAjust({ onImageUpload });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ajustar' })); });
    const d = finestraOberta();
    await act(async () => { fireEvent.click(within(d).getByRole('button', { name: 'Guardar enquadre' })); });
    await waitFor(() => expect(onImageUpload).toHaveBeenCalledTimes(1));
    // Dins, mentre desa, «Canviar foto» està desactivat.
    expect(within(d).getByRole('button', { name: 'Canviar foto' }).disabled).toBe(true);
    await act(async () => { fireEvent(d, new Event('cancel', { cancelable: true })); });
    expect(screen.queryByRole('dialog')).toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ajustar' })); });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(vista.onError).toHaveBeenCalledWith(AVIS_IMATGE_PUJANT, 'info');
    await act(async () => { resol(URL_MITJA); });
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('quiet'));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ajustar' })); });
    expect(finestraOberta()).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Tancar' })); });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
