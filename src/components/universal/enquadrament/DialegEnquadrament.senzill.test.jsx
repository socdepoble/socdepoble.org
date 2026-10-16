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
import { DialegEnquadrament } from './DialegEnquadrament.jsx';
import { AJUDA_RETALL, FORMES, configDeForma } from './useEnquadramentImatge.jsx';
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

  test('la taula de formes: proporció, màscara i títol', () => {
    expect(Object.keys(FORMES)).toEqual(['avatar', 'logotip', 'capcalera']);
    expect(FORMES.avatar).toMatchObject({ format: '1:1', mascara: 'cercle', titol: 'Retalla la foto', midaSortida: 400, exacta: { amplada: 400, alcada: 400 } });
    expect(FORMES.logotip).toMatchObject({ format: '1:1', mascara: null, titol: 'Retalla el logotip', exacta: { amplada: 600, alcada: 600 } });
    expect(FORMES.capcalera).toMatchObject({ format: '1:1', mascara: null, titol: 'Retalla la capçalera', exacta: { amplada: 1200, alcada: 1200 } });
    expect(FORMES.capcalera.formats.map((f) => [f.valor, f.ratio])).toEqual([['1:1', 1]]);
    expect(Object.isFrozen(FORMES) && Object.isFrozen(FORMES.capcalera) && Object.isFrozen(FORMES.avatar.exacta)).toBe(true);
  });
});

describe('l’espècimen del catàleg · els tres modes senzills', () => {
  /* Gauntlet 261016 (Bloc 1) · L'avatar en cercle ix ara a 400 × 400
     exactes i la capçalera a 1.200 × 1.200 exactes: la llegenda de
     l'espècimen la calcula de la taula FORMES. El nom del botó de la
     capçalera és text de l'espècimen (EspecimenEnquadrament.jsx): ja no diu
     16:9 sinó «Capçalera quadrada (1.200 × 1.200)», i es clica per eixe nom. */
  test('cercle de 400 × 400, quadrat de 600 × 600 i capçalera de 1.200 × 1.200, amb la imatge del repositori; sense style=', async () => {
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
        ['Capçalera quadrada (1.200 × 1.200)', 'Retalla la capçalera', false, '1200 × 1200 px exactes, capçalera'],
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
