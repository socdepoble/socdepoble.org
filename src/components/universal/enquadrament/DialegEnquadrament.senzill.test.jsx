import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
/* L'espècimen del catàleg (últim bloc) no injecta res: la frontera amb el
   navegador se simula. La resta de proves injecten el carregador. */
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn() }));
vi.mock('./imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: () => true,
  exportaRetall: dobles.exportaRetall,
}));
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { DialegEnquadrament, didacticaDeForma, etiquetaCurtaDeForma } from './DialegEnquadrament.jsx';
import { FORMATS } from './enquadrament.js';
import { ETIQUETA_CONSERVA_EXIF } from './exifIncrustat.js';
import { dataOriginal, gpsTorre, jpegAmbExif } from '../../../../tests/helpers/jpegProva.js';
import {
  AJUDA_CAPCALERA_LLIURE, AJUDA_CAPCALERA_QUADRADA, AJUDA_RETALL, FORMES, configDeForma, costatDeSortida
} from './useEnquadramentImatge.jsx';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import EspecimenEnquadrament from '../../../sections/disseny/cataleg/detalls/EspecimenEnquadrament.jsx';

/* Onada 4 (retallador senzill, ordre del Mestre 261008) · La finestra
   «Retallar foto» de Claude per a les imatges del Perfil: el mode `senzill`
   i la `mascara` del DialegEnquadrament. Sense estes props, el retallador
   T46 de les Notes no canvia (l'últim bloc ho fixa). jsdom no té canvas: el
   carregador, l'exportador i el dibuix s'injecten. */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const foto = () => new File(['x'], 'foto.png', { type: 'image/png' });

function munta({ forma = 'avatar', font = foto(), imatge = {}, ...props } = {}) {
  const cfg = configDeForma(forma);
  const img = { amplada: 4000, alcada: 2000, tipus: 'image/png', element: { soc: 'element' }, allibera: vi.fn(), ...imatge };
  const eines = {
    carregador: vi.fn(async () => img),
    exportador: vi.fn(async () => new File(['y'], 'enquadrament.png', { type: 'image/png' })),
    dibuixant: vi.fn(() => true),
    onDesa: vi.fn(async () => true),
    onTanca: vi.fn(),
    ...props,
  };
  const vista = render(
    <DialegEnquadrament font={font} senzill mascara={cfg.mascara} formatInicial={cfg.formatInicial} formats={cfg.formats}
      sortida={cfg.sortida(font)} titol={cfg.titol} descripcio={cfg.descripcio} {...eines} />,
  );
  return { ...vista, img, font, ...eines };
}

const carregat = async (vista) => {
  await act(async () => {});
  return vista.getByLabelText('Ampliació');
};
const dialeg = (vista) => vista.getByRole('dialog');
const peu = (vista) => [...dialeg(vista).querySelectorAll('.sdp-dialeg__peu button')].map((b) => b.textContent);
const boto = (vista, nom) => within(dialeg(vista)).getByRole('button', { name: nom });

describe('mode senzill · l’anatomia de la finestra de Claude', () => {
  test('títol curt, la línia d’ajuda davall, el visor sol i el peu exacte: Restablir · Cancel·lar · Guardar', async () => {
    const vista = munta();
    await carregat(vista);
    const d = vista.getByRole('dialog', { name: 'Retalla la foto' });
    expect(d.querySelector('.sdp-dialeg__descripcio').textContent).toBe(AJUDA_RETALL);
    expect(d.getAttribute('aria-describedby')).toBeTruthy();
    expect(peu(vista)).toEqual(['Restablir', 'Cancel·lar', 'Guardar']);
    expect(boto(vista, 'Restablir').className).toContain('sdp-enquadrament__restablir');
    expect(boto(vista, 'Guardar').className).toContain('sdp-boto--primari');
    expect(boto(vista, 'Cancel·lar').className).toContain('sdp-boto--secundari');
    // Sense la X: Escape continua tancant.
    expect(within(d).queryByRole('button', { name: 'Tancar' })).toBeNull();
    expect(d.classList.contains('sdp-enquadrament__dialeg--senzill')).toBe(true);
    expect(document.querySelector('[style]')).toBeNull();
  });

  test('fora els lliscadors de posició, la «Forma» i la geolocalització (també si el pare la permetera)', async () => {
    const vista = munta({ permetGeolocalitzacio: true });
    await carregat(vista);
    expect(vista.queryByLabelText('Posició horitzontal')).toBeNull();
    expect(vista.queryByLabelText('Posició vertical')).toBeNull();
    expect(vista.container.ownerDocument.querySelector('fieldset')).toBeNull();
    expect(vista.queryByRole('radio')).toBeNull();
    expect(vista.queryByRole('checkbox')).toBeNull();
    expect(vista.queryByRole('button', { name: 'Centrar' })).toBeNull();
    expect(vista.queryByRole('button', { name: 'Desar l’enquadrament' })).toBeNull();
  });

  test('una sola fila de zoom: −, el lliscador «Ampliació» i +, en eixe ordre', async () => {
    const vista = munta();
    const zoom = await carregat(vista);
    const fila = document.querySelector('.sdp-enquadrament__zoom');
    expect([...fila.children].map((e) => e.getAttribute('aria-label'))).toEqual(['Allunyar', 'Ampliació', 'Apropar']);
    expect(zoom.type).toBe('range');
    expect(zoom.getAttribute('aria-valuetext')).toBe('100 %');
    // Les icones no tenen nom propi: el nom és del botó.
    expect(fila.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(2);
  });
});

describe('mode senzill · la màscara', () => {
  test('avatar: el visor dins de la caixa amb el cercle; el fitxer continua quadrat', async () => {
    const vista = munta({ forma: 'avatar' });
    await carregat(vista);
    const caixa = document.querySelector('.sdp-enquadrament__visor-caixa');
    expect(caixa.classList.contains('sdp-enquadrament__visor-caixa--cercle')).toBe(true);
    // L'arrossegament continua anant al canvas, que és dins de la caixa.
    expect(caixa.querySelector('canvas.sdp-enquadrament__visor')).not.toBeNull();
    expect(vista.dibuixant).toHaveBeenLastCalledWith(caixa.querySelector('canvas'), vista.img.element, { x: 1000, y: 0, w: 2000, h: 2000 });
    await act(async () => { fireEvent.click(boto(vista, 'Guardar')); });
    const [, , opcions] = vista.exportador.mock.calls[0];
    expect(opcions.amplada).toBe(opcions.alcada);
  });

  test('logotip i capçalera: la mateixa caixa, sense cercle', async () => {
    for (const forma of ['logotip', 'capcalera']) {
      const vista = munta({ forma });
      await carregat(vista);
      const caixa = document.querySelector('.sdp-enquadrament__visor-caixa');
      expect(caixa, forma).not.toBeNull();
      expect(caixa.classList.contains('sdp-enquadrament__visor-caixa--cercle'), forma).toBe(false);
      cleanup();
    }
  });
});

describe('mode senzill · zoom', () => {
  test('− i + fan el pas de l’ajudant i es desactiven als límits', async () => {
    const vista = munta();
    const zoom = await carregat(vista);
    const menys = boto(vista, 'Allunyar');
    const mes = boto(vista, 'Apropar');
    expect(menys.disabled).toBe(true);
    expect(mes.disabled).toBe(false);
    act(() => { fireEvent.click(mes); });
    expect(zoom.getAttribute('aria-valuetext')).toBe('110 %');
    expect(menys.disabled).toBe(false);
    act(() => { fireEvent.click(menys); });
    expect(zoom.getAttribute('aria-valuetext')).toBe('100 %');
    // Al màxim (4000×2000 en quadrat: 2000 / 200 → el sostre de 4×), + es desactiva.
    act(() => { fireEvent.change(zoom, { target: { value: '4' } }); });
    expect(zoom.getAttribute('aria-valuetext')).toBe('400 %');
    expect(mes.disabled).toBe(true);
    expect(menys.disabled).toBe(false);
  });

  test('una foto massa xicoteta per a ampliar: els dos botons i el lliscador, desactivats', async () => {
    const vista = munta({ imatge: { amplada: 200, alcada: 200 } });
    const zoom = await carregat(vista);
    expect(zoom.disabled).toBe(true);
    expect(boto(vista, 'Allunyar').disabled).toBe(true);
    expect(boto(vista, 'Apropar').disabled).toBe(true);
  });

  test('la roda del ratolí sobre el visor amplia a passos menuts, no desplaça el diàleg i respecta els límits', async () => {
    const vista = munta();
    const zoom = await carregat(vista);
    const canvas = document.querySelector('canvas');
    // Una osca de ratolí cap amunt (100 px): un pas sencer.
    let lliure;
    act(() => { lliure = fireEvent.wheel(canvas, { deltaY: -100 }); });
    expect(lliure).toBe(false); // preventDefault: el cos del diàleg no fa scroll
    expect(zoom.getAttribute('aria-valuetext')).toBe('110 %');
    // Un gir menut de trackpad: un pas menut.
    act(() => { fireEvent.wheel(canvas, { deltaY: -10 }); });
    expect(zoom.getAttribute('aria-valuetext')).toBe('112 %');
    // Cap avall, fins al mínim i no més.
    act(() => { for (let i = 0; i < 10; i += 1) fireEvent.wheel(canvas, { deltaY: 400 }); });
    expect(zoom.getAttribute('aria-valuetext')).toBe('100 %');
    // En línies (Firefox): 3 línies ≈ 48 px.
    act(() => { fireEvent.wheel(canvas, { deltaY: -3, deltaMode: 1 }); });
    expect(zoom.getAttribute('aria-valuetext')).toBe('110 %');
  });

  test('el teclat sobre el visor es manté: fletxes, + i −, i Retorn desa', async () => {
    const vista = munta();
    const zoom = await carregat(vista);
    const canvas = document.querySelector('canvas');
    act(() => { fireEvent.keyDown(canvas, { key: '+' }); });
    expect(zoom.getAttribute('aria-valuetext')).toBe('110 %');
    act(() => { fireEvent.keyDown(canvas, { key: 'ArrowRight' }); });
    expect(document.querySelector('[aria-live="polite"].sdp-nomes-lector').textContent).toContain('Posició');
    await act(async () => { fireEvent.keyDown(canvas, { key: 'Enter' }); });
    expect(vista.onDesa).toHaveBeenCalledTimes(1);
  });
});

describe('mode senzill · el peu', () => {
  test('Restablir torna a l’estat inicial (centrat, sense zoom)', async () => {
    const vista = munta();
    const zoom = await carregat(vista);
    const canvas = document.querySelector('canvas');
    act(() => { fireEvent.click(boto(vista, 'Apropar')); });
    act(() => { fireEvent.keyDown(canvas, { key: 'ArrowRight' }); });
    expect(vista.dibuixant).not.toHaveBeenLastCalledWith(canvas, vista.img.element, { x: 1000, y: 0, w: 2000, h: 2000 });
    act(() => { fireEvent.click(boto(vista, 'Restablir')); });
    expect(zoom.getAttribute('aria-valuetext')).toBe('100 %');
    expect(vista.dibuixant).toHaveBeenLastCalledWith(canvas, vista.img.element, { x: 1000, y: 0, w: 2000, h: 2000 });
  });

  test('Guardar recodifica SEMPRE (sense ampliar també) i lliura el retall; Cancel·lar tanca sense desar; Escape tanca', async () => {
    const vista = munta();
    await carregat(vista);
    await act(async () => { fireEvent.click(boto(vista, 'Guardar')); });
    expect(vista.exportador).toHaveBeenCalledTimes(1);
    expect(vista.onDesa.mock.calls[0][0]).not.toBe(vista.font);
    expect(vista.onDesa.mock.calls[0][1]).toMatchObject({ format: '1:1', rect: { x: 1000, y: 0, w: 2000, h: 2000 } });
    fireEvent.click(boto(vista, 'Cancel·lar'));
    expect(vista.onTanca).toHaveBeenLastCalledWith('boto');
    expect(vista.onDesa).toHaveBeenCalledTimes(1);
    fireEvent(dialeg(vista), new Event('cancel', { cancelable: true }));
    expect(vista.onTanca).toHaveBeenLastCalledWith('esc');
  });

  test('si el desat falla, l’error ix en línia dins de la finestra, que continua oberta; el segon intent passa', async () => {
    const onDesa = vi.fn().mockRejectedValueOnce(new Error('No s’ha pogut pujar la imatge.')).mockResolvedValueOnce(true);
    const vista = munta({ onDesa });
    await carregat(vista);
    await act(async () => { fireEvent.click(boto(vista, 'Guardar')); });
    expect(within(dialeg(vista)).getByRole('alert').textContent).toBe('No s’ha pogut pujar la imatge.');
    expect(vista.onTanca).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(boto(vista, 'Guardar')); });
    expect(onDesa).toHaveBeenCalledTimes(2);
    expect(within(dialeg(vista)).queryByRole('alert')).toBeNull();
  });
});

describe('mode senzill · l’eixida exacta de cada forma', () => {
  /* Gauntlet 261016 (Bloc 1, Llei del Quadrat: «avatars quadrats de 400 × 400
     px», «la capçalera i la targeta són exactament la mateixa imatge de
     1.200 × 1.200») · L'avatar passa de 600 a 400 (MIDA_AVATAR); el logotip
     es queda en 600 (MIDA_LOGOTIP) i la capçalera deixa el 16:9 (1.200 × 675,
     ordre 261008, derogada pel pla del Gauntlet) i és un quadrat. */
  test('avatar: 400 × 400 exactes; logotip: 600 × 600 exactes; capçalera: 1.200 × 1.200 exactes (1:1)', async () => {
    const casos = [
      ['avatar', { x: 1000, y: 0, w: 2000, h: 2000 }, { amplada: 400, alcada: 400, tipus: 'image/png' }],
      ['logotip', { x: 1000, y: 0, w: 2000, h: 2000 }, { amplada: 600, alcada: 600, tipus: 'image/png' }],
      ['capcalera', { x: 1000, y: 0, w: 2000, h: 2000 }, { amplada: 1200, alcada: 1200, tipus: 'image/png' }],
    ];
    for (const [forma, rect, opcions] of casos) {
      const vista = munta({ forma });
      await carregat(vista);
      await act(async () => { fireEvent.click(boto(vista, 'Guardar')); });
      expect(vista.exportador.mock.calls[0].slice(1), forma).toEqual([rect, opcions]);
      cleanup();
    }
  });

  /* Gauntlet 261016 (Bloc 1) · Abans l'avatar no s'ampliava (un retall de
     300 px ixia a 300 × 300). Ara les tres formes són exactes. */
  test('un retall més menut que l’eixida: les tres formes s’amplien a la mida exacta', async () => {
    const xicoteta = { amplada: 400, alcada: 300 };
    const casos = [['avatar', 400, 400], ['logotip', 600, 600], ['capcalera', 1200, 1200]];
    for (const [forma, amplada, alcada] of casos) {
      const vista = munta({ forma, imatge: xicoteta });
      await carregat(vista);
      await act(async () => { fireEvent.click(boto(vista, 'Guardar')); });
      expect(vista.exportador.mock.calls[0][2], forma).toMatchObject({ amplada, alcada });
      cleanup();
    }
  });

  /* Directiva del Mestre (261024, àudio 22:47) · Actualitzada a posta: la
     capçalera ja no és exacta ni d'una sola forma. Oferix tots els FORMATS
     (el quadrat de sèrie) i porta `costatLlarg` (1.200). L'avatar i el
     logotip, idèntics. */
  test('la taula de formes: proporció, màscara i títol', () => {
    expect(Object.keys(FORMES)).toEqual(['avatar', 'logotip', 'capcalera']);
    expect(FORMES.avatar).toMatchObject({ format: '1:1', mascara: 'cercle', titol: 'Retalla la foto', midaSortida: 400, exacta: { amplada: 400, alcada: 400 } });
    expect(FORMES.logotip).toMatchObject({ format: '1:1', mascara: null, titol: 'Retalla el logotip', exacta: { amplada: 600, alcada: 600 } });
    expect(FORMES.avatar.formats.map((f) => [f.valor, f.ratio])).toEqual([['1:1', 1]]);
    expect(FORMES.logotip.formats.map((f) => [f.valor, f.ratio])).toEqual([['1:1', 1]]);
    expect(FORMES.capcalera).toMatchObject({ format: '1:1', mascara: null, titol: 'Retalla la capçalera', midaSortida: 1200, costatLlarg: 1200 });
    expect('exacta' in FORMES.capcalera).toBe(false);
    /* Actualitzada a posta (P1-11, integració 261024): les mateixes formes que
       FORMATS, en el mateix ordre, amb les ajudes pròpies de la fitxa (no les de les Notes). */
    expect(FORMES.capcalera.formats.map((f) => [f.valor, f.etiqueta, f.ratio])).toEqual(FORMATS.map((f) => [f.valor, f.etiqueta, f.ratio]));
    expect(FORMES.capcalera.formats.map((f) => f.ajuda)).toEqual(FORMATS.map((f) => (f.ratio === 1 ? AJUDA_CAPCALERA_QUADRADA : AJUDA_CAPCALERA_LLIURE)));
    expect(FORMES.capcalera.formats.some((f) => /nota/i.test(f.ajuda))).toBe(false);
    expect(Object.isFrozen(FORMES.capcalera.formats) && FORMES.capcalera.formats.every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(FORMES) && Object.isFrozen(FORMES.capcalera) && Object.isFrozen(FORMES.avatar.exacta)).toBe(true);
  });

  test('Directiva 261024 · l’eixida de la capçalera porta costatLlarg; la de l’avatar i la del logotip, la mida exacta de sempre', () => {
    const fitxer = foto();
    expect(configDeForma('capcalera').sortida(fitxer)).toEqual({ ampladaMaxima: 1200, format: 'image/png', costatLlarg: 1200 });
    expect(configDeForma('avatar').sortida(fitxer)).toEqual({ ampladaMaxima: 400, format: 'image/png', exacta: { amplada: 400, alcada: 400 } });
    expect(configDeForma('logotip').sortida(fitxer)).toEqual({ ampladaMaxima: 600, format: 'image/png', exacta: { amplada: 600, alcada: 600 } });
    expect(['capcalera', 'avatar', 'logotip'].map(costatDeSortida)).toEqual([1200, 400, 600]);
    expect(configDeForma('capcalera').formats).toBe(FORMES.capcalera.formats);
  });
});

/* Directiva del Mestre (261024, àudio 22:47) · «El quadrat únic és una
   limitació inacceptable»: la capçalera del mode senzill tria la forma (la
   mateixa «Forma» del T46), davall del zoom i abans de la casella de l'EXIF.
   L'avatar i el logotip (una sola forma) no canvien gens. */
describe('mode senzill · la forma de la capçalera', () => {
  const fotoGps = () => new File([jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33'), gps: gpsTorre() })], 'arbre.jpg', { type: 'image/jpeg' });
  const tria = (vista, valor) => act(() => { fireEvent.click(vista.container.ownerDocument.querySelector(`input[type="radio"][value="${valor}"]`)); });
  const guarda = (vista) => act(async () => { fireEvent.click(boto(vista, 'Guardar')); });
  const exportadorAmbMida = () => vi.fn(async (_element, _rect, { amplada, alcada, tipus }) => (
    Object.assign(new File(['y'], 'enquadrament.png', { type: tipus }), { amplada, alcada })
  ));

  test('capçalera: «Forma» amb tots els formats, el quadrat marcat, davall de la fila de zoom i abans de la casella de l’EXIF', async () => {
    const vista = munta({ forma: 'capcalera', font: fotoGps(), ofereixConservarExif: true });
    await carregat(vista);
    const casella = await within(dialeg(vista)).findByRole('checkbox', { name: new RegExp(ETIQUETA_CONSERVA_EXIF) });
    const grup = dialeg(vista).querySelector('fieldset');
    expect(grup.querySelector('legend').textContent).toBe('Forma');
    const formes = within(grup).getAllByRole('radio');
    expect(formes.map((r) => r.value)).toEqual(FORMATS.map((f) => f.valor));
    expect(formes.filter((r) => r.checked).map((r) => r.value)).toEqual(['1:1']);
    const zoom = dialeg(vista).querySelector('.sdp-enquadrament__zoom');
    expect(zoom.compareDocumentPosition(grup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(grup.compareDocumentPosition(casella) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Mentre desa, la forma no es pot canviar.
    expect(grup.disabled).toBe(false);
    expect(document.querySelector('[style]')).toBeNull();
  });

  /* Directiva del Mestre (261025, pla 261025_0045, T3) · Píndoles d'un sol
     toc i una sola línia de didàctica: el visor no ix de la vista. */
  test('T3 · capçalera: píndoles curtes amb el nom sencer accessible, una sola didàctica que canvia amb la tria, diàleg m', async () => {
    const vista = munta({ forma: 'capcalera' });
    await carregat(vista);
    expect(dialeg(vista).classList.contains('sdp-dialeg--m')).toBe(true);
    const grup = within(dialeg(vista)).getByRole('radiogroup', { name: 'Forma' });
    expect([...grup.querySelectorAll('label')].map((l) => l.textContent))
      .toEqual(FORMATS.map((f) => (f.valor === 'original' ? 'Orig.' : f.valor)));
    expect(within(grup).getByRole('radio', { name: 'Panoràmic (16:9)' })).toBeTruthy();
    /* Cap llista d'ajudes: una sola línia, la de la triada, lligada al grup. */
    const didactica = dialeg(vista).querySelector('.sdp-enquadrament__didactica');
    expect(grup.getAttribute('aria-describedby')).toBe(didactica.id);
    expect(dialeg(vista).querySelectorAll('.sdp-casella__ajuda')).toHaveLength(0);
    const quadrat = FORMES.capcalera.formats.find((f) => f.valor === '1:1');
    expect(didactica.textContent).toBe(`${quadrat.etiqueta} · ${quadrat.ajuda}`);
    /* Un sol toc a la píndola (el label) tria la forma. */
    act(() => { fireEvent.click(within(grup).getByText('16:9')); });
    expect(within(grup).getByRole('radio', { name: 'Panoràmic (16:9)' }).checked).toBe(true);
    const panoramic = FORMES.capcalera.formats.find((f) => f.valor === '16:9');
    expect(didactica.textContent).toBe(`${panoramic.etiqueta} · ${panoramic.ajuda}`);
    expect(didactica.getAttribute('aria-live')).toBe('polite');
    /* El visor, davant de tot: la caixa del visor és el primer fill del cos i el grup va després del zoom. */
    /* Cicle 3 (261030, VD) · El mode senzill el diu el diàleg; el cos porta només classes amb regla. */
    expect(dialeg(vista).classList.contains('sdp-enquadrament__dialeg--senzill')).toBe(true);
    const cos = dialeg(vista).querySelector('.sdp-enquadrament');
    expect(cos.className).toBe('sdp-enquadrament sdp-enquadrament--formes');
    expect(cos.firstElementChild.className).toBe('sdp-enquadrament__visor-caixa');
  });

  test('T3 · les etiquetes curtes i la didàctica, pures', () => {
    expect(etiquetaCurtaDeForma({ valor: 'original', etiqueta: 'Original' })).toBe('Orig.');
    expect(etiquetaCurtaDeForma({ valor: '21:9', etiqueta: 'Superpanoràmic (21:9)' })).toBe('21:9');
    expect(didacticaDeForma({ etiqueta: 'Foli (3:4)', ajuda: 'Ajuda.' })).toBe('Foli (3:4) · Ajuda.');
    expect(didacticaDeForma({ etiqueta: 'Foli (3:4)' })).toBe('Foli (3:4)');
    expect(didacticaDeForma(null)).toBe('');
  });

  test('avatar i logotip: cap «Forma», el DOM del mode senzill de sempre', async () => {
    for (const forma of ['avatar', 'logotip']) {
      const vista = munta({ forma });
      await carregat(vista);
      expect(dialeg(vista).querySelector('fieldset'), forma).toBeNull();
      expect(dialeg(vista).classList.contains('sdp-dialeg--s'), forma).toBe(true);
      expect(within(dialeg(vista)).queryByRole('radio'), forma).toBeNull();
      const cos = dialeg(vista).querySelector('.sdp-enquadrament');
      expect(cos.className, forma).toBe('sdp-enquadrament');
      expect([...cos.children].map((e) => e.className), forma).toEqual([
        `sdp-enquadrament__visor-caixa${forma === 'avatar' ? ' sdp-enquadrament__visor-caixa--cercle' : ''}`,
        'sdp-nomes-lector',
        'sdp-enquadrament__zoom',
      ]);
      cleanup();
    }
  });

  test('el visor seguix la forma triada (16:9, 9:16, 21:9) i el dibuix pinta el seu retall; Restablir no la canvia', async () => {
    const vista = munta({ forma: 'capcalera' });
    await carregat(vista);
    const canvas = () => dialeg(vista).querySelector('canvas');
    expect([canvas().getAttribute('width'), canvas().getAttribute('height')]).toEqual(['960', '960']);
    const casos = [
      ['16:9', ['960', '540'], { x: 222, y: 0, w: 3556, h: 2000 }],
      ['9:16', ['540', '960'], { x: 1438, y: 0, w: 1125, h: 2000 }],
      ['21:9', ['960', '411'], { x: 0, y: 143, w: 4000, h: 1714 }],
    ];
    for (const [valor, mida, rect] of casos) {
      tria(vista, valor);
      expect([canvas().getAttribute('width'), canvas().getAttribute('height')], valor).toEqual(mida);
      expect(vista.dibuixant, valor).toHaveBeenLastCalledWith(canvas(), vista.img.element, rect);
    }
    // La caixa no porta cap cercle: només l'avatar es pinta redó.
    expect(dialeg(vista).querySelector('.sdp-enquadrament__visor-caixa--cercle')).toBeNull();
    act(() => { fireEvent.click(boto(vista, 'Apropar')); });
    act(() => { fireEvent.click(boto(vista, 'Restablir')); });
    expect(dialeg(vista).querySelector('input[type="radio"][value="21:9"]').checked).toBe(true);
    expect(vista.dibuixant).toHaveBeenLastCalledWith(canvas(), vista.img.element, { x: 0, y: 143, w: 4000, h: 1714 });
  });

  test('el CSS de la caixa del visor no força cap quadrat: cap aspect-ratio ni cap mida fixa (bloc T46 de modules.css)', () => {
    const css = readFileSync(path.join(process.cwd(), 'src/css/modules.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const regles = [...css.matchAll(/([^{}]*\.sdp-enquadrament__visor-caixa[^{}]*)\{([^{}]*)\}/g)];
    expect(regles.length).toBeGreaterThan(0);
    for (const [, selector, cos] of regles) {
      if (selector.includes('--cercle')) continue;
      expect(cos, selector.trim()).not.toMatch(/aspect-ratio|(?<![-\w])(width|height)\s*:(?!\s*(?:auto|fit-content)\s*;)/);
    }
  });

  test('capçalera en 16:9: onDesa rep un fitxer de 1.200 × 675 (l’exportador, amb costatLlarg); en 1:1, 1.200 × 1.200 com abans', async () => {
    const casos = [['16:9', 1200, 675], ['9:16', 675, 1200], ['21:9', 1200, 514], ['1:1', 1200, 1200]];
    for (const [valor, amplada, alcada] of casos) {
      const exportador = exportadorAmbMida();
      const vista = munta({ forma: 'capcalera', exportador });
      await carregat(vista);
      if (valor !== '1:1') tria(vista, valor);
      await guarda(vista);
      const [fitxer, info] = vista.onDesa.mock.calls[0];
      expect([fitxer.amplada, fitxer.alcada], valor).toEqual([amplada, alcada]);
      expect(info.format, valor).toBe(valor);
      expect(exportador.mock.calls[0][2], valor).toEqual({ amplada, alcada, tipus: 'image/png' });
      cleanup();
    }
  });

  test('un retall de capçalera més menut que l’eixida s’amplia fins a 1.200 pel costat llarg, en qualsevol forma', async () => {
    const xicoteta = { amplada: 400, alcada: 300 };
    const casos = [['1:1', 1200, 1200], ['original', 1200, 900], ['3:4', 900, 1200]];
    for (const [valor, amplada, alcada] of casos) {
      const vista = munta({ forma: 'capcalera', imatge: xicoteta });
      await carregat(vista);
      if (valor !== '1:1') tria(vista, valor);
      await guarda(vista);
      expect(vista.exportador.mock.calls[0][2], valor).toMatchObject({ amplada, alcada });
      cleanup();
    }
  });
});

describe('l’espècimen del catàleg · els tres modes senzills', () => {
  /* Gauntlet 261016 (Bloc 1) · L'avatar en cercle ix ara a 400 × 400
     exactes: la llegenda de l'espècimen la calcula de la taula FORMES.
     Directiva del Mestre (261024, àudio 22:47) · Actualitzada a posta: el
     botó de la capçalera ja no diu «Capçalera quadrada (1.200 × 1.200)» sinó
     «Capçalera de forma lliure (1.200 pel costat llarg)», i la llegenda diu
     la forma triada (el quadrat de sèrie: 1.200 × 1.200). */
  test('cercle de 400 × 400, quadrat de 600 × 600 i capçalera de 1.200 × 1.200 en 1:1, amb la imatge del repositori; sense style=', async () => {
    dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 1024, alcada: 1024, tipus: 'image/png', element: {}, allibera: vi.fn() });
    dobles.exportaRetall.mockReset().mockResolvedValue(new File(['y'], 'enquadrament.png', { type: 'image/png' }));
    URL.createObjectURL = vi.fn(() => 'blob:prova');
    URL.revokeObjectURL = vi.fn();
    try {
      const { container } = render(<MemoryRouter><EspecimenEnquadrament /></MemoryRouter>);
      expect([...container.querySelectorAll('.sdp-especimen h4')].map((h) => h.textContent))
        .toContain('Les imatges de la fitxa: la finestra senzilla');
      const casos = [
        ['Avatar en cercle', 'Retalla la foto', true, '400 × 400 px exactes, avatar en cercle'],
        ['Logotip quadrat (600 × 600)', 'Retalla el logotip', false, '600 × 600 px exactes, logotip quadrat'],
        ['Capçalera de forma lliure (1.200 pel costat llarg)', 'Retalla la capçalera', false, '1200 × 1200 px, 1200 pel costat llarg, capçalera en 1:1'],
      ];
      for (const [boto, finestra, cercle, text] of casos) {
        await act(async () => { fireEvent.click(screen.getByRole('button', { name: boto })); });
        await act(async () => {});
        const dialeg = screen.getByRole('dialog', { name: finestra });
        expect(Boolean(dialeg.querySelector('.sdp-enquadrament__visor-caixa--cercle')), boto).toBe(cercle);
        /* Una adreça ja resolta desada sencera no té res a desar (contracte
           T46): s'amplia un pas abans de guardar. */
        act(() => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Apropar' })); });
        await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Guardar' })); });
        expect(screen.queryByRole('dialog', { name: finestra })).toBeNull();
        expect(screen.getByAltText('El resultat de la finestra senzilla').closest('figure').textContent, boto).toContain(text);
      }
      expect(container.querySelector('[style]')).toBeNull();
    } finally {
      delete URL.createObjectURL;
      delete URL.revokeObjectURL;
    }
  });
});

describe('regressió T46 · sense `senzill`, el retallador de les Notes no canvia', () => {
  test('la X, els lliscadors de posició, la Forma, «Centrar» i «Desar l’enquadrament»; cap fila de zoom ni caixa', async () => {
    const img = { amplada: 4000, alcada: 2000, tipus: 'image/jpeg', element: {}, allibera: vi.fn() };
    const vista = render(<DialegEnquadrament font={foto()} carregador={vi.fn(async () => img)} dibuixant={vi.fn(() => true)}
      exportador={vi.fn()} onDesa={vi.fn()} onTanca={vi.fn()} mascara="cercle" />);
    await act(async () => {});
    const d = vista.getByRole('dialog', { name: 'Enquadrar la imatge' });
    expect(within(d).getByRole('button', { name: 'Tancar' })).toBeTruthy();
    expect(vista.getByLabelText('Posició horitzontal')).toBeTruthy();
    expect(vista.getByLabelText('Posició vertical')).toBeTruthy();
    expect(d.querySelector('legend').textContent).toBe('Forma');
    expect([...d.querySelectorAll('.sdp-dialeg__peu button')].map((b) => b.textContent)).toEqual(['Cancel·lar', 'Centrar', 'Desar l’enquadrament']);
    expect(d.querySelector('.sdp-enquadrament__zoom')).toBeNull();
    expect(d.querySelector('.sdp-enquadrament__visor-caixa')).toBeNull();
    expect(d.querySelector('.sdp-enquadrament__visor-marc canvas')).not.toBeNull();
    expect(d.classList.contains('sdp-enquadrament__dialeg--senzill')).toBe(false);
    // La roda no és del T46: no es prevé (el cos del diàleg fa scroll com sempre).
    expect(fireEvent.wheel(d.querySelector('canvas'), { deltaY: -100 })).toBe(true);
  });
});
