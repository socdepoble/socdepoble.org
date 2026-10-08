import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* Ordre del Mestre (261007, ordre E) · L'ordre «/» Imatge ja no falla en
   silenci: amb `onToast` (el canal de la capçalera, que DocumentEditor li
   passa), diu per què no ha inserit res. Sense, el comportament de sempre.
   jsdom no té canvas: compressImage se simula, i el selector de fitxers
   «tria» en fer-li click. */
const dobles = vi.hoisted(() => ({ compressImage: vi.fn() }));
vi.mock('../../../../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));
import { creaOrdres } from './index.js';

const CURT = 'data:image/webp;base64,AAAA';

function editorFals() {
  const cadena = { focus: () => cadena, deleteRange: () => cadena, setImage: vi.fn(() => cadena), run: vi.fn(() => true) };
  return { editor: { chain: () => cadena }, cadena };
}
function triaRa(fitxer) {
  vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function tria() {
    Object.defineProperty(this, 'files', { value: [fitxer], configurable: true });
    this.dispatchEvent(new Event('change'));
  });
}
const ordreImatge = (opcions) => creaOrdres(opcions).find((o) => o.id === 'imatge');
const foto = (tipus = 'image/jpeg', nom = 'arbre.jpg') => new File(['x'], nom, { type: tipus });

beforeEach(() => {
  dobles.compressImage.mockReset().mockResolvedValue(CURT);
  vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => new Blob(['w'], { type: 'image/webp' }) })));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('ordre E · l’ordre «/» Imatge avisa pel canal de la capçalera', () => {
  test('una pujada rebutjada avisa amb el missatge del port i no insereix res', async () => {
    triaRa(foto());
    const onToast = vi.fn();
    const onImageUpload = vi.fn().mockRejectedValue(new Error('El servidor no admet la pujada.'));
    const { editor, cadena } = editorFals();
    await ordreImatge({ onImageUpload, onToast }).executa({ editor, range: { from: 1, to: 2 } });
    expect(onImageUpload).toHaveBeenCalledTimes(1);
    expect(onToast).toHaveBeenCalledWith('El servidor no admet la pujada.', 'error');
    expect(cadena.setImage).not.toHaveBeenCalled();
  });

  test('un rebuig sense missatge diu el de la capçalera', async () => {
    triaRa(foto());
    const onToast = vi.fn();
    const { editor } = editorFals();
    await ordreImatge({ onImageUpload: vi.fn().mockRejectedValue({}), onToast }).executa({ editor, range: { from: 1, to: 2 } });
    expect(onToast).toHaveBeenCalledWith('No s\'ha pogut processar la imatge.', 'error');
  });

  test('un fitxer que no és una imatge avisa com la capçalera i no es comprimix ni es puja', async () => {
    triaRa(foto('application/pdf', 'nota.pdf'));
    const onToast = vi.fn();
    const onImageUpload = vi.fn();
    const { editor, cadena } = editorFals();
    await ordreImatge({ onImageUpload, onToast }).executa({ editor, range: { from: 1, to: 2 } });
    expect(onToast).toHaveBeenCalledWith('Només imatges, de moment.', 'error');
    expect(dobles.compressImage).not.toHaveBeenCalled();
    expect(onImageUpload).not.toHaveBeenCalled();
    expect(cadena.setImage).not.toHaveBeenCalled();
  });

  test('sense límit de pes nou: una foto gran es continua inserint, com sempre', async () => {
    triaRa(new File([new Uint8Array(6 * 1024 * 1024)], 'gran.jpg', { type: 'image/jpeg' }));
    const onToast = vi.fn();
    const { editor, cadena } = editorFals();
    await ordreImatge({ onToast }).executa({ editor, range: { from: 1, to: 2 } });
    expect(onToast).not.toHaveBeenCalled();
    expect(cadena.setImage).toHaveBeenCalledWith({ src: CURT, alt: 'gran.jpg' });
  });

  test('sense onToast, el de sempre: cap avís per a un fitxer que no és imatge i un console.warn per al rebuig', async () => {
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    triaRa(foto('application/pdf', 'nota.pdf'));
    await ordreImatge({}).executa({ ...editorFals(), range: { from: 1, to: 2 } });
    expect(avis).not.toHaveBeenCalled();
    vi.mocked(HTMLInputElement.prototype.click).mockRestore();
    triaRa(foto());
    const { editor, cadena } = editorFals();
    await ordreImatge({ onImageUpload: vi.fn().mockRejectedValue(new Error('Sense xarxa.')) }).executa({ editor, range: { from: 1, to: 2 } });
    expect(avis).toHaveBeenCalledWith('[slash] No s\'ha pogut inserir la imatge:', 'Sense xarxa.');
    expect(cadena.setImage).not.toHaveBeenCalled();
  });
});
