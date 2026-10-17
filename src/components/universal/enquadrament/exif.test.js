import { describe, expect, test, vi } from 'vitest';
import { MAX_BYTES_EXIF, coordenadesValides, llegixExif, llegixMetadadesImatge, senseDades, teExif } from './exif.js';
import {
  APP0_JFIF, IMATGE, SOI, TIPUS, app1Exif, concatena, dataOriginal, gpsTorre, jpegAmbExif, orientacio, segment, tiff,
} from './jpegProva.js';

/* Onada 4, T3a · El lector d'EXIF propi (ADR multimèdia §3.1). Tots els JPEG
   es munten ací (jpegProva.js): cap foto real, cap ubicació de ningú. */

const COMPLET = {
  ifd0: [orientacio(6)],
  exif: dataOriginal('2017:05:14 10:22:33', '+02:00'),
  gps: gpsTorre(),
};
const ESPERAT = {
  orientacio: 6,
  gps: { lat: 38.5919, lng: -0.4184, altitud: 456.7 },
  dataCaptura: '2017-05-14T10:22:33+02:00',
};

describe('T3a · lectura completa', () => {
  test('big-endian (MM): orientació, GPS i data de captura', () => {
    expect(llegixExif(jpegAmbExif({ ordre: 'MM', ...COMPLET }).buffer)).toEqual(ESPERAT);
  });

  test('little-endian (II): el mateix resultat', () => {
    expect(llegixExif(jpegAmbExif({ ordre: 'II', ...COMPLET }).buffer)).toEqual(ESPERAT);
  });

  test('accepta una vista (Uint8Array amb desplaçament dins del buffer)', () => {
    const bytes = jpegAmbExif(COMPLET);
    const gran = concatena(Uint8Array.of(9, 9, 9), bytes);
    expect(llegixExif(gran.subarray(3))).toEqual(ESPERAT);
  });

  test('sud i est: latitud negativa i longitud positiva; altitud davall del nivell de la mar', () => {
    const r = llegixExif(jpegAmbExif({ gps: gpsTorre({ latRef: 'S', lngRef: 'E', altRef: 1 }) }));
    expect(r.gps).toEqual({ lat: -38.5919, lng: 0.4184, altitud: -456.7 });
  });

  test('sense altitud, altitud null; sense Exif IFD, data null', () => {
    const r = llegixExif(jpegAmbExif({ ifd0: [orientacio(1)], gps: gpsTorre({ alt: null }) }));
    expect(r).toEqual({ orientacio: 1, gps: { lat: 38.5919, lng: -0.4184, altitud: null }, dataCaptura: null });
  });

  test('ambGps: false no llig el GPS encara que hi siga; ambData: false, la data tampoc', () => {
    expect(llegixExif(jpegAmbExif(COMPLET), { ambGps: false })).toEqual({ ...ESPERAT, gps: null });
    expect(llegixExif(jpegAmbExif(COMPLET), { ambGps: false, ambData: false })).toEqual({ orientacio: 6, gps: null, dataCaptura: null });
  });

  test('una data sense zona horària ix sense sufix; una zona mal formada s’ignora', () => {
    expect(llegixExif(jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33') })).dataCaptura).toBe('2017-05-14T10:22:33');
    expect(llegixExif(jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33', '2 hores') })).dataCaptura).toBe('2017-05-14T10:22:33');
  });

  test('una data de zeros o impossible no és cap data', () => {
    expect(llegixExif(jpegAmbExif({ exif: dataOriginal('0000:00:00 00:00:00') })).dataCaptura).toBeNull();
    expect(llegixExif(jpegAmbExif({ exif: dataOriginal('2017:13:14 10:22:33') })).dataCaptura).toBeNull();
    expect(llegixExif(jpegAmbExif({ exif: dataOriginal('                   ') })).dataCaptura).toBeNull();
  });

  test('l’APP1 «Exif» es troba darrere d’altres segments i d’un APP1 que no és Exif (XMP)', () => {
    const xmp = segment(0xe1, new TextEncoder().encode('http://ns.adobe.com/xap/1.0/\0<x/>'));
    const app2 = segment(0xe2, Uint8Array.of(1, 2, 3, 4));
    const bytes = concatena(SOI, APP0_JFIF, xmp, app2, app1Exif(tiff(COMPLET)), IMATGE);
    expect(llegixExif(bytes)).toEqual(ESPERAT);
  });

  test('bytes de farciment 0xFF entre segments no el despisten', () => {
    const bytes = concatena(SOI, Uint8Array.of(0xff, 0xff), app1Exif(tiff(COMPLET)), IMATGE);
    expect(llegixExif(bytes)).toEqual(ESPERAT);
  });
});

describe('T3a · orientació', () => {
  test('1..8 es tornen tal qual; fora de rang, null', () => {
    for (let o = 1; o <= 8; o += 1) expect(llegixExif(jpegAmbExif({ ifd0: [orientacio(o)] })).orientacio).toBe(o);
    expect(llegixExif(jpegAmbExif({ ifd0: [orientacio(0)] })).orientacio).toBeNull();
    expect(llegixExif(jpegAmbExif({ ifd0: [orientacio(9)] })).orientacio).toBeNull();
  });
});

describe('T3a · coordenades impossibles', () => {
  test('un denominador 0 fa la coordenada il·legible: sense GPS', () => {
    expect(llegixExif(jpegAmbExif({ gps: gpsTorre({ lat: [[38, 0], [35, 1], [0, 1]] }) })).gps).toBeNull();
    expect(llegixExif(jpegAmbExif({ gps: gpsTorre({ lng: [[0, 1], [25, 1], [624, 0]] }) })).gps).toBeNull();
  });

  test('latitud de més de 90° o longitud de més de 180°: sense GPS', () => {
    expect(llegixExif(jpegAmbExif({ gps: gpsTorre({ lat: [[95, 1], [0, 1], [0, 1]] }) })).gps).toBeNull();
    expect(llegixExif(jpegAmbExif({ gps: gpsTorre({ lng: [[190, 1], [0, 1], [0, 1]] }) })).gps).toBeNull();
  });

  test('minuts o segons de 60 o més no són sexagesimals: sense GPS', () => {
    expect(llegixExif(jpegAmbExif({ gps: gpsTorre({ lat: [[38, 1], [75, 1], [0, 1]] }) })).gps).toBeNull();
  });

  test('el 0/0 d’un receptor sense senyal no és cap lloc', () => {
    const zero = [[0, 1], [0, 1], [0, 1]];
    expect(llegixExif(jpegAmbExif({ gps: gpsTorre({ lat: zero, lng: zero }) })).gps).toBeNull();
  });

  test('sense referència N/S o E/W, o amb una de falsa: sense GPS', () => {
    expect(llegixExif(jpegAmbExif({ gps: gpsTorre({ latRef: 'X' }) })).gps).toBeNull();
    expect(llegixExif(jpegAmbExif({ gps: gpsTorre().filter((e) => e.tag !== 3) })).gps).toBeNull();
  });

  test('coordenadesValides', () => {
    expect(coordenadesValides(38.59, -0.41)).toBe(true);
    expect(coordenadesValides(-90, 180)).toBe(true);
    expect(coordenadesValides(90.0001, 0)).toBe(false);
    expect(coordenadesValides(0, -180.5)).toBe(false);
    expect(coordenadesValides(Number.NaN, 1)).toBe(false);
    expect(coordenadesValides(1, Infinity)).toBe(false);
    expect(coordenadesValides(0, 0)).toBe(false);
  });
});

describe('T3a · fitxers trencats: mai llança, «sense dades»', () => {
  const formaBuida = senseDades();

  test('no és un JPEG: buit, a l’atzar, un PNG, un text, null', () => {
    expect(llegixExif(new ArrayBuffer(0))).toEqual(formaBuida);
    expect(llegixExif(Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8))).toEqual(formaBuida);
    const png = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52);
    expect(llegixExif(png)).toEqual(formaBuida);
    expect(llegixExif('no soc un buffer')).toEqual(formaBuida);
    expect(llegixExif(null)).toEqual(formaBuida);
    expect(llegixExif(undefined)).toEqual(formaBuida);
  });

  test('truncat a qualsevol byte: cap excepció i, si l’APP1 queda tallat, sense dades', () => {
    const bytes = jpegAmbExif(COMPLET);
    const fiApp1 = SOI.length + APP0_JFIF.length + app1Exif(tiff(COMPLET)).length;
    for (let tall = 0; tall < bytes.length; tall += 1) {
      const r = llegixExif(bytes.slice(0, tall));
      expect(Object.keys(r).sort()).toEqual(['dataCaptura', 'gps', 'orientacio']);
      if (tall < fiApp1) expect(r).toEqual(formaBuida);
    }
  });

  test('un SOS abans de l’APP1: la cerca s’atura (l’EXIF va abans de la imatge)', () => {
    const bytes = concatena(SOI, IMATGE, app1Exif(tiff(COMPLET)));
    expect(llegixExif(bytes)).toEqual(formaBuida);
  });

  test('un segment amb longitud menor que 2 o que passa del fitxer: sense dades', () => {
    expect(llegixExif(concatena(SOI, Uint8Array.of(0xff, 0xe1, 0x00, 0x01), IMATGE))).toEqual(formaBuida);
    expect(llegixExif(concatena(SOI, Uint8Array.of(0xff, 0xe1, 0xff, 0xff, 0x45, 0x78)))).toEqual(formaBuida);
  });

  test('capçalera TIFF falsa: ordre de bytes desconegut o número màgic que no és 42', () => {
    expect(llegixExif(jpegAmbExif({ ordre: 'XX', ...COMPLET }))).toEqual(formaBuida);
    expect(llegixExif(jpegAmbExif({ magic: 43, ...COMPLET }))).toEqual(formaBuida);
  });

  test('IFD cíclics: un punter que torna a l’IFD0 no fa cap bucle', () => {
    const r = llegixExif(jpegAmbExif({ ...COMPLET, punterExif: 8, punterGps: 8 }));
    expect(r).toEqual({ orientacio: 6, gps: null, dataCaptura: null });
  });

  test('el GPS IFD apunta a l’Exif IFD (ja visitat): no es torna a llegir', () => {
    const t = tiff(COMPLET);
    const v = new DataView(t.buffer);
    // L'IFD0 té tres entrades ordenades: 0x0112, 0x8769, 0x8825. El valor del punter GPS és a 8+2+2*12+8.
    const posExif = v.getUint32(8 + 2 + 12 + 8);
    v.setUint32(8 + 2 + 2 * 12 + 8, posExif);
    const r = llegixExif(concatena(SOI, app1Exif(t), IMATGE));
    expect(r).toEqual({ orientacio: 6, gps: null, dataCaptura: '2017-05-14T10:22:33+02:00' });
  });

  test('punters i desplaçaments fora del buffer: s’ignoren', () => {
    expect(llegixExif(jpegAmbExif({ ...COMPLET, punterGps: 0xfffffff0 })).gps).toBeNull();
    expect(llegixExif(jpegAmbExif({ ...COMPLET, punterExif: 0x7fffffff })).dataCaptura).toBeNull();
    const latLluny = gpsTorre().map((e) => (e.tag === 2 ? { ...e, offset: 0xffff0000 } : e));
    expect(llegixExif(jpegAmbExif({ gps: latLluny })).gps).toBeNull();
  });

  test('quantitats absurdes: un IFD de 65.535 entrades o una entrada de 4.294.967.295 valors', () => {
    const t = tiff({ ifd0: [orientacio(6)] });
    new DataView(t.buffer).setUint16(8, 0xffff);
    expect(llegixExif(concatena(SOI, app1Exif(t), IMATGE))).toEqual(formaBuida);
    const enorme = gpsTorre().map((e) => (e.tag === 2 ? { ...e, nombre: 0xffffffff } : e));
    expect(llegixExif(jpegAmbExif({ gps: enorme })).gps).toBeNull();
    const textEnorme = [{ tag: 0x9003, tipus: TIPUS.ASCII, valors: '2017:05:14 10:22:33', nombre: 100000 }];
    expect(llegixExif(jpegAmbExif({ exif: textEnorme })).dataCaptura).toBeNull();
  });

  test('un IFD0 a l’offset 0 (la capçalera) o més enllà del segment: sense dades', () => {
    const t = tiff(COMPLET);
    const v = new DataView(t.buffer);
    v.setUint32(4, 0);
    expect(llegixExif(concatena(SOI, app1Exif(t), IMATGE))).toEqual(formaBuida);
    v.setUint32(4, t.length + 10);
    expect(llegixExif(concatena(SOI, app1Exif(t), IMATGE))).toEqual(formaBuida);
  });
});

describe('T3a · teExif', () => {
  test('diu si hi ha un APP1 «Exif» abans de la imatge', () => {
    expect(teExif(jpegAmbExif(COMPLET))).toBe(true);
    expect(teExif(concatena(SOI, APP0_JFIF, IMATGE))).toBe(false);
    expect(teExif(new ArrayBuffer(0))).toBe(false);
    expect(teExif(null)).toBe(false);
  });
});

describe('T3a · llegixMetadadesImatge (File o Blob)', () => {
  test('llig un File i només en demana els primers MAX_BYTES_EXIF', async () => {
    const fitxer = new File([jpegAmbExif(COMPLET)], 'foto.jpg', { type: 'image/jpeg' });
    const tall = vi.spyOn(fitxer, 'slice');
    expect(await llegixMetadadesImatge(fitxer)).toEqual(ESPERAT);
    expect(tall).toHaveBeenCalledWith(0, MAX_BYTES_EXIF);
  });

  test('passa les opcions (sense GPS)', async () => {
    const fitxer = new File([jpegAmbExif(COMPLET)], 'foto.jpg', { type: 'image/jpeg' });
    expect((await llegixMetadadesImatge(fitxer, { ambGps: false })).gps).toBeNull();
  });

  test('una cosa que no és un Blob, o un Blob que no es deixa llegir: sense dades, sense rebutjar', async () => {
    expect(await llegixMetadadesImatge('foto.jpg')).toEqual(senseDades());
    expect(await llegixMetadadesImatge(null)).toEqual(senseDades());
    const blob = new Blob([jpegAmbExif(COMPLET)]);
    vi.spyOn(blob, 'slice').mockImplementation(() => { throw new Error('llegit'); });
    expect(await llegixMetadadesImatge(blob)).toEqual(senseDades());
  });

  test('un PNG de veres (signatura) no té EXIF que llegir', async () => {
    const png = new Blob([Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)], { type: 'image/png' });
    expect(await llegixMetadadesImatge(png)).toEqual(senseDades());
  });
});

/* Onada 0.3 (Gauntlet 261016) · El visor de l'Arxiu visual diu la càmera,
   l'autor i els drets que declara la foto: Make, Model, Artist i Copyright de
   l'IFD0, només amb l'opció ambCamera. Sense l'opció, la sortida de sempre. */
const ascii = (tag, valors) => ({ tag, tipus: TIPUS.ASCII, valors });
const CAMERA = [
  orientacio(6),
  ascii(0x010f, 'Canon'),
  ascii(0x0110, 'Canon EOS 5D Mark IV'),
  ascii(0x013b, 'Pepa Garcia'),
  ascii(0x8298, '(c) Pepa Garcia, CC BY 4.0')
];
const AMB_CAMERA = { ifd0: CAMERA, exif: COMPLET.exif, gps: COMPLET.gps };

describe('Onada 0.3 · ambCamera: càmera, autor i drets', () => {
  test('sense l’opció, la sortida és la de sempre: les tres claus de senseDades(), encara que el fitxer porte càmera', () => {
    for (const ordre of ['II', 'MM']) {
      const r = llegixExif(jpegAmbExif({ ordre, ...AMB_CAMERA }));
      expect(r).toEqual(ESPERAT);
      expect(Object.keys(r).sort()).toEqual(Object.keys(senseDades()).sort());
    }
  });

  test('amb l’opció, a més, la marca i el model, l’autor i els drets, en II i en MM', () => {
    for (const ordre of ['II', 'MM']) {
      expect(llegixExif(jpegAmbExif({ ordre, ...AMB_CAMERA }), { ambCamera: true })).toEqual({
        ...ESPERAT,
        camera: { marca: 'Canon', model: 'Canon EOS 5D Mark IV' },
        autor: 'Pepa Garcia',
        copyright: '(c) Pepa Garcia, CC BY 4.0'
      });
    }
  });

  test('es combina amb les altres opcions: sense GPS ni data, la càmera continua', () => {
    const r = llegixExif(jpegAmbExif(AMB_CAMERA), { ambCamera: true, ambGps: false, ambData: false });
    expect(r).toEqual({ orientacio: 6, gps: null, dataCaptura: null, camera: { marca: 'Canon', model: 'Canon EOS 5D Mark IV' }, autor: 'Pepa Garcia', copyright: '(c) Pepa Garcia, CC BY 4.0' });
  });

  test('els espais de farciment fora; un text buit és null; només el model fa càmera', () => {
    const r = llegixExif(jpegAmbExif({ ifd0: [ascii(0x0110, 'DSC-RX100   '), ascii(0x013b, '    '), ascii(0x8298, '')] }), { ambCamera: true });
    expect(r.camera).toEqual({ marca: null, model: 'DSC-RX100' });
    expect(r.autor).toBeNull();
    expect(r.copyright).toBeNull();
  });

  test('un text que no és ASCII imprimible no es torna (mai s’inventa); el Copyright amb fotògraf i editor dona el primer', () => {
    const r = llegixExif(jpegAmbExif({ ifd0: [ascii(0x013b, 'Pepa Garcés'), ascii(0x8298, 'Fotògraf\0Editor')] }), { ambCamera: true });
    expect(r.autor).toBeNull();
    expect(r.copyright).toBeNull();
    const dos = llegixExif(jpegAmbExif({ ifd0: [ascii(0x8298, 'Pepa\0Editorial')] }), { ambCamera: true });
    expect(dos.copyright).toBe('Pepa');
  });

  test('un text de més de 256 caràcters no es llig; de 255, sí', () => {
    const llarg = llegixExif(jpegAmbExif({ ifd0: [ascii(0x8298, 'x'.repeat(256))] }), { ambCamera: true });
    expect(llarg.copyright).toBeNull();
    const just = llegixExif(jpegAmbExif({ ifd0: [ascii(0x8298, 'x'.repeat(255))] }), { ambCamera: true });
    expect(just.copyright).toBe('x'.repeat(255));
  });

  test('sense EXIF, o d’una cosa que no és un buffer: les sis claus, a null', () => {
    const buit = { ...senseDades(), camera: null, autor: null, copyright: null };
    expect(llegixExif(concatena(SOI, APP0_JFIF, IMATGE), { ambCamera: true })).toEqual(buit);
    expect(llegixExif(null, { ambCamera: true })).toEqual(buit);
    expect(llegixExif(jpegAmbExif({ ordre: 'XX', ...AMB_CAMERA }), { ambCamera: true })).toEqual(buit);
  });

  test('llegixMetadadesImatge passa l’opció; sense Blob, les sis claus a null', async () => {
    const fitxer = new File([jpegAmbExif(AMB_CAMERA)], 'foto.jpg', { type: 'image/jpeg' });
    expect((await llegixMetadadesImatge(fitxer, { ambCamera: true })).camera).toEqual({ marca: 'Canon', model: 'Canon EOS 5D Mark IV' });
    expect(await llegixMetadadesImatge(fitxer)).toEqual(ESPERAT);
    expect(await llegixMetadadesImatge('foto.jpg', { ambCamera: true })).toEqual({ ...senseDades(), camera: null, autor: null, copyright: null });
  });
});
