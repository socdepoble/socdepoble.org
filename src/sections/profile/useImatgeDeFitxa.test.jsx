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
import { AVIS_IMATGE_PUJANT, useImatgeDeFitxa } from './useImatgeDeFitxa.jsx';
import fontDelHook from './useImatgeDeFitxa.jsx?raw';
import {
  ACCEPT_FOTO, ERROR_PES_FOTO, ERROR_TIPUS_FOTO, PES_MAXIM_FOTO,
} from '../../components/universal/enquadrament/useEnquadramentImatge.jsx';
import { AJUDA_IMATGE_PUJANT } from '../../components/universal/UniversalEditorShell.jsx';

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
  test('capçalera: el retall de 1.200 × 675 puja UNA vegada sense tornar-lo a reduir, i es desa el camp', async () => {
    const acaba = vi.fn();
    const vista = munta({ control: { acaba } });
    fireEvent.click(screen.getByRole('button', { name: 'Obrir' }));
    await tria(vista, foto(3));
    expect(vista.onImageUpload).not.toHaveBeenCalled();
    await guarda('Retalla la capçalera');
    expect(dobles.exportaRetall).toHaveBeenCalledTimes(1);
    expect(dobles.exportaRetall.mock.calls[0][2]).toEqual({ amplada: 1200, alcada: 675, tipus: 'image/jpeg' });
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
