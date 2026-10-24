import { describe, expect, test } from 'vitest';
import {
  FORMATS, FORMAT_DE_LA_FONT, FORMAT_PER_DEFECTE, FORMAT_SORTIDA, PAS_TECLAT, ZOOM_MAX, ambLliscador, ambTecla, arrossega, esSencera,
  estatInicial, limita, lliscador, marcBase, marges, midaSortida, midaVisor, opcionsSortida, pessic, proporcio,
  rectDeRetall, textAmpliacio, tipusDeSortida, zoomMaxim,
} from './enquadrament.js';

/* T46 (ordre del Mestre, 260928) · la matemàtica del re-enquadrament. */

describe('T46 · formats', () => {
  /* Directiva del Mestre (261024, àudio 22:47) · Actualitzada a posta: el
     quadrat continua primer i de sèrie, i s'hi afigen 3:2, 21:9 i les tres
     verticals (4:5, 3:4 i 9:16). Abans: 1:1, Original, 4:3 i 16:9. */
  test('el quadrat és el de sèrie i va primer; després Original, les apaïsades, les panoràmiques i les verticals', () => {
    expect(FORMAT_PER_DEFECTE).toBe('1:1');
    expect(FORMATS.map((f) => f.valor)).toEqual(['1:1', 'original', '4:3', '3:2', '16:9', '21:9', '4:5', '3:4', '9:16']);
    expect(estatInicial()).toEqual({ format: '1:1', zoom: 1, cx: 0.5, cy: 0.5 });
  });

  test('Directiva 261024 · les files noves: etiqueta, proporció i congelades com les altres', () => {
    const noves = FORMATS.filter((f) => ['3:2', '21:9', '4:5', '3:4', '9:16'].includes(f.valor));
    expect(noves.map((f) => [f.valor, f.etiqueta, f.ratio])).toEqual([
      ['3:2', 'Apaisat (3:2)', 3 / 2],
      ['21:9', 'Superpanoràmic (21:9)', 21 / 9],
      ['4:5', 'Vertical (4:5)', 4 / 5],
      ['3:4', 'Foli (3:4)', 3 / 4],
      ['9:16', 'Vertical llarg (9:16)', 9 / 16],
    ]);
    // Les de sempre no canvien: la fila i l'ajuda del quadrat i de l'original, i les etiquetes.
    expect(FORMATS.filter((f) => ['1:1', 'original', '4:3', '16:9'].includes(f.valor)).map((f) => f.etiqueta))
      .toEqual(['Quadrat (1:1)', 'Original', 'Apaisat (4:3)', 'Panoràmic (16:9)']);
    expect(Object.isFrozen(FORMATS) && FORMATS.every((f) => Object.isFrozen(f))).toBe(true);
  });

  test('Directiva 261024 · una vertical en una foto apaïsada pren tota l’alçada; una superpanoràmica, tota l’amplada', () => {
    expect(rectDeRetall(estatInicial('9:16'), 4000, 2000)).toEqual({ x: 1438, y: 0, w: 1125, h: 2000 });
    expect(rectDeRetall(estatInicial('21:9'), 4000, 2000)).toEqual({ x: 0, y: 143, w: 4000, h: 1714 });
    expect(midaVisor(proporcio('9:16', 4000, 2000))).toEqual({ amplada: 540, alcada: 960 });
    expect(midaVisor(proporcio('21:9', 4000, 2000))).toEqual({ amplada: 960, alcada: 411 });
  });

  test('proporcio: amb ratio, la del format; «original», la de la foto', () => {
    expect(proporcio('1:1', 4000, 2000)).toBe(1);
    expect(proporcio('16:9', 4000, 2000)).toBeCloseTo(16 / 9);
    expect(proporcio('original', 4000, 2000)).toBe(2);
  });
});

describe('T46 · marc i retall', () => {
  test('marcBase: el marc més gran de la proporció que cap dins la foto', () => {
    expect(marcBase(4000, 2000, 1)).toEqual({ w: 2000, h: 2000 });
    expect(marcBase(2000, 4000, 16 / 9)).toEqual({ w: 2000, h: 1125 });
  });

  test('rectDeRetall de l’estat inicial 1:1 sobre 4000×2000 és el quadrat central', () => {
    expect(rectDeRetall(estatInicial('1:1'), 4000, 2000)).toEqual({ x: 1000, y: 0, w: 2000, h: 2000 });
  });

  test('«original» a zoom 1 és la foto sencera', () => {
    const e = estatInicial('original');
    expect(rectDeRetall(e, 4000, 2000)).toEqual({ x: 0, y: 0, w: 4000, h: 2000 });
    expect(esSencera(e, 4000, 2000)).toBe(true);
    expect(esSencera(estatInicial('1:1'), 4000, 2000)).toBe(false);
    expect(esSencera({ ...e, zoom: 2 }, 4000, 2000)).toBe(false);
  });

  test('una foto que ja és quadrada, en 1:1 a zoom 1, també és sencera', () => {
    expect(esSencera(estatInicial('1:1'), 1024, 1024)).toBe(true);
  });
});

describe('T46 · límits', () => {
  test('cx=0 enganxa el marc a la vora esquerra', () => {
    expect(rectDeRetall({ ...estatInicial('1:1'), cx: 0 }, 4000, 2000).x).toBe(0);
    expect(rectDeRetall({ ...estatInicial('1:1'), cx: 1 }, 4000, 2000).x).toBe(2000);
  });

  test('el zoom queda entre 1 i zoomMaxim', () => {
    expect(limita({ ...estatInicial('1:1'), zoom: 0.5 }, 4000, 2000).zoom).toBe(1);
    expect(limita({ ...estatInicial('1:1'), zoom: 10 }, 4000, 2000).zoom).toBe(ZOOM_MAX);
    expect(limita({ ...estatInicial('1:1'), zoom: Number.NaN }, 4000, 2000).zoom).toBe(1);
  });

  test('zoomMaxim: el retall no baixa de 200 px', () => {
    expect(zoomMaxim(300, 300, 1)).toBe(1.5);
    expect(zoomMaxim(150, 150, 1)).toBe(1);
    expect(zoomMaxim(4000, 2000, 1)).toBe(ZOOM_MAX);
  });
});

describe('T46 · moure i ampliar', () => {
  test('arrossegar cap a la dreta mou el centre cap a l’esquerra; sense marge vertical, cy no es mou', () => {
    // Visor de 400 px CSS sobre un marc de 2000 px: s = 0,2 px de pantalla per px d'imatge.
    const e = arrossega(estatInicial('1:1'), 40, 25, 400, 4000, 2000);
    expect(e.cx).toBeCloseTo(0.5 - 40 / (0.2 * 4000));
    expect(e.cy).toBe(0.5);
  });

  test('arrossegar sense amplada de visor no fa res', () => {
    expect(arrossega(estatInicial('1:1'), 40, 0, 0, 4000, 2000).cx).toBe(0.5);
  });

  test('pessic: el zoom inicial escalat per la distància, dins dels límits', () => {
    expect(pessic(estatInicial('1:1'), 1, 100, 200, 4000, 2000).zoom).toBe(2);
    expect(pessic(estatInicial('1:1'), 1, 100, 200, 300, 300).zoom).toBe(1.5);
    expect(pessic(estatInicial('1:1'), 1, 0, 200, 4000, 2000).zoom).toBe(1);
  });

  test('marges: una panoràmica en quadrat a zoom 1 no es mou en vertical; a zoom 2, sí', () => {
    expect(marges(estatInicial('1:1'), 4000, 2000)).toEqual({ x: true, y: false });
    expect(marges({ ...estatInicial('1:1'), zoom: 2 }, 4000, 2000)).toEqual({ x: true, y: true });
  });

  test('lliscador i ambLliscador fan anada i tornada exacta', () => {
    const base = { ...estatInicial('1:1'), zoom: 2 };
    for (const v of [0, 13, 30, 50, 77, 100]) {
      expect(lliscador(ambLliscador(base, 'x', v, 4000, 2000), 'x', 4000, 2000)).toBe(v);
      expect(lliscador(ambLliscador(base, 'y', v, 4000, 2000), 'y', 4000, 2000)).toBe(v);
    }
    expect(lliscador(estatInicial('1:1'), 'y', 4000, 2000)).toBe(50);
    expect(ambLliscador(estatInicial('1:1'), 'x', 0, 4000, 2000).cx).toBeCloseTo(0.25);
  });
});

describe('T46 · eixida', () => {
  test('midaSortida redueix fins a 1200 pel costat llarg i no amplia mai', () => {
    expect(midaSortida({ w: 2000, h: 2000 })).toEqual({ amplada: 1200, alcada: 1200 });
    expect(midaSortida({ w: 800, h: 800 })).toEqual({ amplada: 800, alcada: 800 });
    expect(midaSortida({ w: 3200, h: 1800 })).toEqual({ amplada: 1200, alcada: 675 });
  });

  test('midaVisor: costat llarg de 960 amb la proporció del marc', () => {
    expect(midaVisor(1)).toEqual({ amplada: 960, alcada: 960 });
    expect(midaVisor(16 / 9)).toEqual({ amplada: 960, alcada: 540 });
    expect(midaVisor(0.5)).toEqual({ amplada: 480, alcada: 960 });
  });

  /* Poliment T46 · Un WebP, un AVIF o un SVG també poden ser transparents: en
     JPEG eixirien amb fons blanc. Van en PNG (després, compressImage → WebP). */
  test('tipusDeSortida: els formats que poden dur transparència van en PNG; la resta, JPEG', () => {
    expect(tipusDeSortida('image/png')).toBe('image/png');
    expect(tipusDeSortida('image/gif')).toBe('image/png');
    expect(tipusDeSortida('image/webp')).toBe('image/png');
    expect(tipusDeSortida('image/avif')).toBe('image/png');
    expect(tipusDeSortida('image/svg+xml')).toBe('image/png');
    expect(tipusDeSortida('IMAGE/WEBP')).toBe('image/png');
    expect(tipusDeSortida('image/jpeg')).toBe('image/jpeg');
    expect(tipusDeSortida('')).toBe('image/jpeg');
  });

  /* Poliment T46 · Publicar al Mur és una còpia: en una nota ja publicada, la
     targeta del Mur no canvia fins que es torna a publicar. L'ajuda no ho amaga. */
  test('l’ajuda del quadrat no promet que la targeta del Mur canvie sola', () => {
    const quadrat = FORMATS.find((f) => f.valor === '1:1');
    expect(quadrat.ajuda).toContain('targeta del Mur');
    expect(quadrat.ajuda).toContain('fins que la tornes a publicar');
  });

  test('textAmpliacio en percentatge', () => {
    expect(textAmpliacio(1)).toBe('100 %');
    expect(textAmpliacio(2.345)).toBe('235 %');
  });
});

/* Onada 4, T3a · L'eixida demanada pel pare (RETALLADOR §1) i el teclat sobre el visor. */
describe('T3a · opcionsSortida', () => {
  test('sense `sortida`, exactament el contracte T46: 1.200 pel costat llarg i el tipus intermedi', () => {
    expect(opcionsSortida({ w: 2000, h: 2000 }, 'image/jpeg')).toEqual({ amplada: 1200, alcada: 1200, tipus: 'image/jpeg' });
    expect(opcionsSortida({ w: 3200, h: 1800 }, 'image/png', null)).toEqual({ amplada: 1200, alcada: 675, tipus: 'image/png' });
  });

  test('amb `sortida`: WebP de sèrie, l’amplada màxima i la qualitat', () => {
    expect(FORMAT_SORTIDA).toBe('image/webp');
    expect(opcionsSortida({ w: 2000, h: 2000 }, 'image/jpeg', { ampladaMaxima: 600 }))
      .toEqual({ amplada: 600, alcada: 600, tipus: 'image/webp' });
    expect(opcionsSortida({ w: 2000, h: 1000 }, 'image/png', { ampladaMaxima: 800, format: 'image/jpeg', qualitat: 0.8 }))
      .toEqual({ amplada: 800, alcada: 400, tipus: 'image/jpeg', qualitat: 0.8 });
  });

  test('amb `sortida`: mai s’amplia; format o qualitat desconeguts, els de sèrie', () => {
    expect(opcionsSortida({ w: 400, h: 300 }, 'image/jpeg', { ampladaMaxima: 600 })).toEqual({ amplada: 400, alcada: 300, tipus: 'image/webp' });
    expect(opcionsSortida({ w: 2000, h: 2000 }, 'image/jpeg', { format: 'image/gif', qualitat: 7 })).toEqual({ amplada: 1200, alcada: 1200, tipus: 'image/webp' });
  });

  /* Pla 2000 (punt 2; correcció F3 de la revisió) · El format de la imatge
     carregada: la transparència d'un PNG o d'un WebP no es perd. */
  test('amb `format: FORMAT_DE_LA_FONT`: el tipus intermedi de la imatge carregada', () => {
    const sortida = { ampladaMaxima: 400, format: FORMAT_DE_LA_FONT, exacta: { amplada: 400, alcada: 400 } };
    expect(opcionsSortida({ w: 2000, h: 2000 }, 'image/webp', sortida)).toEqual({ amplada: 400, alcada: 400, tipus: 'image/png' });
    expect(opcionsSortida({ w: 2000, h: 2000 }, 'image/png', sortida)).toEqual({ amplada: 400, alcada: 400, tipus: 'image/png' });
    expect(opcionsSortida({ w: 2000, h: 2000 }, 'image/jpeg', sortida)).toEqual({ amplada: 400, alcada: 400, tipus: 'image/jpeg' });
    expect(opcionsSortida({ w: 2000, h: 2000 }, '', sortida)).toEqual({ amplada: 400, alcada: 400, tipus: 'image/jpeg' });
  });

  /* Directiva del Mestre (261024, àudio 22:47) · La capçalera de forma
     lliure: el costat llarg fa exactament `costatLlarg` i l'altre seguix la
     proporció del retall. */
  test('amb `costatLlarg`: el costat llarg exacte i l’altre amb la proporció del retall', () => {
    const sortida = { ampladaMaxima: 1200, costatLlarg: 1200 };
    expect(opcionsSortida({ w: 2000, h: 2000 }, 'image/jpeg', sortida)).toEqual({ amplada: 1200, alcada: 1200, tipus: 'image/webp' });
    expect(opcionsSortida({ w: 3556, h: 2000 }, 'image/jpeg', sortida)).toEqual({ amplada: 1200, alcada: 675, tipus: 'image/webp' });
    expect(opcionsSortida({ w: 1125, h: 2000 }, 'image/jpeg', sortida)).toEqual({ amplada: 675, alcada: 1200, tipus: 'image/webp' });
    expect(opcionsSortida({ w: 4000, h: 1714 }, 'image/jpeg', sortida)).toEqual({ amplada: 1200, alcada: 514, tipus: 'image/webp' });
  });

  test('amb `costatLlarg`: un retall menut s’amplia (com `exacta`); l’amplada màxima no el retalla', () => {
    expect(opcionsSortida({ w: 400, h: 300 }, 'image/png', { ampladaMaxima: 1200, costatLlarg: 1200, format: 'image/png' }))
      .toEqual({ amplada: 1200, alcada: 900, tipus: 'image/png' });
    expect(opcionsSortida({ w: 300, h: 400 }, 'image/png', { ampladaMaxima: 600, costatLlarg: 1200 }))
      .toEqual({ amplada: 900, alcada: 1200, tipus: 'image/webp' });
    // Una proporció extrema: l'altre costat mai baixa d'1 px.
    expect(opcionsSortida({ w: 5000, h: 1 }, 'image/jpeg', { costatLlarg: 1200 })).toEqual({ amplada: 1200, alcada: 1, tipus: 'image/webp' });
  });

  test('precedència: `exacta` guanya a `costatLlarg`; un `costatLlarg` invàlid no s’aplica (l’amplada màxima de sempre)', () => {
    expect(opcionsSortida({ w: 3200, h: 1800 }, 'image/jpeg', { costatLlarg: 1200, exacta: { amplada: 400, alcada: 400 } }))
      .toEqual({ amplada: 400, alcada: 400, tipus: 'image/webp' });
    for (const costatLlarg of [0, -5, 'abc', null, undefined, Number.NaN]) {
      expect(opcionsSortida({ w: 400, h: 300 }, 'image/jpeg', { ampladaMaxima: 1200, costatLlarg }), String(costatLlarg))
        .toEqual({ amplada: 400, alcada: 300, tipus: 'image/webp' });
    }
  });
});

describe('T3a · ambTecla', () => {
  const W = 4000;
  const H = 2000;
  const base = { ...estatInicial('1:1'), zoom: 2 };

  test('les fletxes mouen el marc com els lliscadors; Maj, quatre vegades més', () => {
    expect(lliscador(ambTecla(base, 'ArrowRight', W, H), 'x', W, H)).toBe(50 + PAS_TECLAT);
    expect(lliscador(ambTecla(base, 'ArrowLeft', W, H), 'x', W, H)).toBe(50 - PAS_TECLAT);
    expect(lliscador(ambTecla(base, 'ArrowDown', W, H), 'y', W, H)).toBe(50 + PAS_TECLAT);
    expect(lliscador(ambTecla(base, 'ArrowUp', W, H), 'y', W, H)).toBe(50 - PAS_TECLAT);
    expect(lliscador(ambTecla(base, 'ArrowRight', W, H, FORMATS, { gran: true }), 'x', W, H)).toBe(50 + 4 * PAS_TECLAT);
  });

  test('a la vora, el marc no ix de la foto', () => {
    const vora = ambLliscador(base, 'x', 100, W, H);
    expect(lliscador(ambTecla(vora, 'ArrowRight', W, H), 'x', W, H)).toBe(100);
  });

  test('+ i − amplien dins dels límits; una tecla aliena torna null', () => {
    expect(ambTecla(estatInicial('1:1'), '+', W, H).zoom).toBeCloseTo(1.1);
    expect(ambTecla(estatInicial('1:1'), '=', W, H).zoom).toBeCloseTo(1.1);
    expect(ambTecla(estatInicial('1:1'), '-', W, H).zoom).toBe(1);
    expect(ambTecla({ ...estatInicial('1:1'), zoom: ZOOM_MAX }, '+', W, H).zoom).toBe(ZOOM_MAX);
    expect(ambTecla(base, 'a', W, H)).toBeNull();
    expect(ambTecla(base, 'Enter', W, H)).toBeNull();
  });
});
