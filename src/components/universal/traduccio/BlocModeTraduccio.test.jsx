/* R51 (P0-46 / IDEA-177), fase A · El selector del mode de traducció i el seu
   magatzem local: tres modes, la revisada visible però no triable sense les
   cinc revisions, la llengua original explícita, desactivat amb el motiu per
   a qui no la pot canviar, i guardat només en este dispositiu. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { BlocModeTraduccio } from './BlocModeTraduccio.jsx';
import {
  CLAU_MODES_TRADUCCIO, MAXIM_DE_MODES, ambModeTraduccio, desaModeTraduccio, llegeixModeTraduccio, modeDeLaPublicacio, traduccioDelPayload
} from './modesTraduccioLocals.js';
import { getVal, setVal } from '../../../config/storage.js';

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

describe('modesTraduccioLocals', () => {
  test('guarda i llig el mode i la llengua d’una nota, validats pel contracte', () => {
    expect(llegeixModeTraduccio('n1')).toBeNull();
    expect(desaModeTraduccio('n1', { translation_mode: 'none', source_language: 'es' })).toBe(true);
    expect(llegeixModeTraduccio('n1')).toEqual({ translation_mode: 'none', source_language: 'es' });
    expect(getVal(CLAU_MODES_TRADUCCIO)).toEqual({ v: 1, modes: { n1: { translation_mode: 'none', source_language: 'es' } } });
  });

  test('no guarda cap mode o llengua de fora del contracte, ni la revisada (preparar no l’activa)', () => {
    for (const entrada of [
      { translation_mode: 'curated_5_langs', source_language: 'ca' }, { translation_mode: 'auto', source_language: 'ca' },
      { translation_mode: 'none', source_language: 'fr' }, { translation_mode: 'none' }, null, 'none'
    ]) expect(desaModeTraduccio('n1', entrada), JSON.stringify(entrada)).toBe(false);
    expect(desaModeTraduccio('', { translation_mode: 'none', source_language: 'ca' })).toBe(false);
    expect(getVal(CLAU_MODES_TRADUCCIO)).toBeNull();
  });

  test('una entrada desada malmesa o d’una altra versió es llig com a absent', () => {
    setVal(CLAU_MODES_TRADUCCIO, { v: 1, modes: { n1: { translation_mode: 'curated_5_langs', source_language: 'ca' }, n2: 'none' } });
    expect(llegeixModeTraduccio('n1')).toBeNull();
    expect(llegeixModeTraduccio('n2')).toBeNull();
    setVal(CLAU_MODES_TRADUCCIO, { v: 2, modes: { n1: { translation_mode: 'none', source_language: 'ca' } } });
    expect(llegeixModeTraduccio('n1')).toBeNull();
    expect(llegeixModeTraduccio('constructor')).toBeNull();
  });

  test('el magatzem té sostre: se’n va la més vella', () => {
    for (let i = 0; i <= MAXIM_DE_MODES; i += 1) desaModeTraduccio(`n${i}`, { translation_mode: 'none', source_language: 'ca' });
    expect(Object.keys(getVal(CLAU_MODES_TRADUCCIO).modes)).toHaveLength(MAXIM_DE_MODES);
    expect(llegeixModeTraduccio('n0')).toBeNull();
    expect(llegeixModeTraduccio(`n${MAXIM_DE_MODES}`)).not.toBeNull();
  });

  /* V2-04 · El que viatja al payload en republicar (publishNote reemplaça el payload sencer). */
  describe('traduccioDelPayload', () => {
    const revisades = Object.freeze(Object.fromEntries(['ca', 'es', 'en', 'eu', 'gl']
      .map((codi) => [codi, { title: `Títol ${codi}`, content: `<p>Cos ${codi}</p>`, reviewed: true, subtitle: `Sub ${codi}` }])));
    const revisada = { id: 'f1', translation_mode: 'curated_5_langs', source_language: 'ca', translations: revisades };

    test('republicar una revisada conserva les traduccions revisades, tal qual (el mateix objecte), amb el mode i la llengua', () => {
      const viatja = traduccioDelPayload({ id: 'n1' }, revisada);
      expect(viatja).toEqual({ translation_mode: 'curated_5_langs', source_language: 'ca', translations: revisades });
      expect(viatja.translations).toBe(revisades);
    });

    test('el mode de la nota mana, però les traduccions de la fila no es perden en canviar-lo', () => {
      expect(traduccioDelPayload({ id: 'n1', translation_mode: 'none', source_language: 'es' }, revisada))
        .toEqual({ translation_mode: 'none', source_language: 'es', translations: revisades });
    });

    test('sense la fila a la llista carregada, les traduccions que la nota en va copiar (notaDeLaPublicacio)', () => {
      expect(traduccioDelPayload({ id: 'n1', translation_mode: 'curated_5_langs', source_language: 'ca', translations: revisades }, null))
        .toEqual({ translation_mode: 'curated_5_langs', source_language: 'ca', translations: revisades });
    });

    test.each([
      ['un mode que no existix', { translation_mode: 'auto', source_language: 'ca' }],
      ['un mode en majúscules', { translation_mode: 'NONE', source_language: 'es' }],
      ['un mode que no és text', { translation_mode: 7, source_language: 'es' }],
      ['un mode buit', { translation_mode: '', source_language: 'es' }]
    ])('la fila amb %s: normalizeTranslationMode el rebutja i no es copia res del mode (ni la llengua)', (_, fila) => {
      expect(traduccioDelPayload({ id: 'n1' }, { id: 'f1', ...fila })).toEqual({});
    });

    test('una nota amb un mode invàlid no tapa el de la fila, que sí que és vàlid', () => {
      expect(traduccioDelPayload({ id: 'n1', translation_mode: 'auto', source_language: 'es' }, { id: 'f1', translation_mode: 'none', source_language: 'gl' }))
        .toEqual({ translation_mode: 'none', source_language: 'gl' });
    });

    test('un mode vàlid amb una llengua de fora de les cinc: el mode viatja, la llengua no', () => {
      expect(traduccioDelPayload({ id: 'n1' }, { id: 'f1', translation_mode: 'none', source_language: 'fr' })).toEqual({ translation_mode: 'none' });
    });

    test('sense mode ni traduccions, cap clau (el payload de sempre); unes traduccions que no són un registre no viatgen', () => {
      expect(traduccioDelPayload({ id: 'n1' }, null)).toEqual({});
      expect(traduccioDelPayload({ id: 'n1' }, { id: 'f1', translation_mode: null })).toEqual({});
      expect(traduccioDelPayload({ id: 'n1' }, { id: 'f1', translations: ['ca'] })).toEqual({});
      expect(traduccioDelPayload(null, null)).toEqual({});
    });
  });
});

describe('BlocModeTraduccio', () => {
  const radio = (nom) => screen.getByRole('radio', { name: new RegExp(nom) });

  test('tres modes; per defecte, l’automàtica quan cal; la revisada, visible però desactivada amb el recompte', () => {
    render(<BlocModeTraduccio id="n1" potEditar />);
    expect(screen.getByRole('group', { name: 'Traducció' })).toBeTruthy();
    expect(radio('Traducció automàtica quan cal').checked).toBe(true);
    const revisada = radio('Revisada en les 5 llengües');
    expect(revisada.disabled).toBe(true);
    expect(screen.getByText('0 de 5 revisades. Calen les 5 traduccions revisades.')).toBeTruthy();
    expect(radio('Sense traducció').disabled).toBe(false);
    // R51V-02 · L'esborrany és d'este dispositiu i viatja amb la publicació.
    expect(screen.getByText('Es guarda en este dispositiu i viatja amb la publicació quan la publiques o l’actualitzes al Mur.')).toBeTruthy();
  });

  test('triar un mode i la llengua original els guarda en este dispositiu', () => {
    render(<BlocModeTraduccio id="n1" potEditar />);
    act(() => { fireEvent.click(radio('Sense traducció')); });
    expect(llegeixModeTraduccio('n1')).toEqual({ translation_mode: 'none', source_language: 'ca' });
    act(() => { fireEvent.change(screen.getByLabelText('Llengua original'), { target: { value: 'gl' } }); });
    expect(llegeixModeTraduccio('n1')).toEqual({ translation_mode: 'none', source_language: 'gl' });
    cleanup();
    // En tornar a obrir la nota, el que s'hi va guardar.
    render(<BlocModeTraduccio id="n1" potEditar />);
    expect(radio('Sense traducció').checked).toBe(true);
    expect(screen.getByLabelText('Llengua original').value).toBe('gl');
  });

  test('la llengua inicial és la que es dona, si és de les cinc', () => {
    render(<BlocModeTraduccio id="n2" potEditar llenguaInicial="eu" />);
    expect(screen.getByLabelText('Llengua original').value).toBe('eu');
    cleanup();
    render(<BlocModeTraduccio id="n3" potEditar llenguaInicial="fr" />);
    expect(screen.getByLabelText('Llengua original').value).toBe('ca');
  });

  test('qui no la pot canviar la veu desactivada, amb el motiu, i no guarda res', () => {
    render(<BlocModeTraduccio id="n1" motiu="Esta publicació la signa una altra persona." />);
    expect(radio('Sense traducció').closest('fieldset').disabled).toBe(true);
    expect(screen.getByLabelText('Llengua original').disabled).toBe(true);
    expect(screen.getByText('Esta publicació la signa una altra persona.')).toBeTruthy();
    act(() => { fireEvent.click(radio('Sense traducció')); });
    expect(llegeixModeTraduccio('n1')).toBeNull();
    cleanup();
    render(<BlocModeTraduccio id="n1" />);
    expect(screen.getByText('Només qui l’ha escrita, o la persona superadministradora en una publicació d’altri, pot canviar la traducció.')).toBeTruthy();
  });

  test('amb les cinc revisades, la revisada es pot triar però no es guarda localment: el canvi es queda i ho avisa', () => {
    render(<BlocModeTraduccio id="n1" potEditar revisades={5} />);
    const revisada = radio('Revisada en les 5 llengües');
    expect(revisada.disabled).toBe(false);
    act(() => { fireEvent.click(revisada); });
    expect(revisada.checked).toBe(true);
    expect(llegeixModeTraduccio('n1')).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('No s’ha pogut guardar en este dispositiu');
  });

  /* R51V-02 · Sense esborrany en este dispositiu, el selector parteix del que
     ja porta la publicació; amb esborrany, mana l'esborrany. */
  test('parteix del mode que ja porta la publicació; l’esborrany d’este dispositiu hi mana', () => {
    render(<BlocModeTraduccio id="n7" potEditar publicat={{ translation_mode: 'none', source_language: 'eu' }} />);
    expect(radio('Sense traducció').checked).toBe(true);
    expect(screen.getByLabelText('Llengua original').value).toBe('eu');
    cleanup();
    desaModeTraduccio('n7', { translation_mode: 'on_the_fly', source_language: 'gl' });
    render(<BlocModeTraduccio id="n7" potEditar publicat={{ translation_mode: 'none', source_language: 'eu' }} />);
    expect(radio('Traducció automàtica quan cal').checked).toBe(true);
    expect(screen.getByLabelText('Llengua original').value).toBe('gl');
    cleanup();
    // Un mode publicat de fora del contracte no hi compta: la regla general.
    render(<BlocModeTraduccio id="n8" potEditar publicat={{ translation_mode: 'auto', source_language: 'eu' }} />);
    expect(radio('Traducció automàtica quan cal').checked).toBe(true);
    expect(screen.getByLabelText('Llengua original').value).toBe('ca');
  });

  test('en una revisió editorial (viatja false) diu que només es guarda en este dispositiu', () => {
    render(<BlocModeTraduccio id="n9" potEditar viatja={false} />);
    expect(screen.getByText('Esta peça és de l’arxiu editorial: el mode de traducció només es guarda en este dispositiu, perquè la revisió editorial encara no el pot portar.')).toBeTruthy();
    expect(screen.queryByText(/viatja amb la publicació/)).toBeNull();
  });
});

/* R51V-02 · El document que es publica porta el mode d'este dispositiu; el
   que ja porta una publicació es llig amb el contracte. */
describe('modeDeLaPublicacio i ambModeTraduccio', () => {
  test('modeDeLaPublicacio: els dos camps del contracte (també la revisada), o null', () => {
    expect(modeDeLaPublicacio({ translation_mode: 'curated_5_langs', source_language: 'es', title: 'x' }))
      .toEqual({ translation_mode: 'curated_5_langs', source_language: 'es' });
    for (const dolenta of [null, undefined, 'none', [], { translation_mode: 'none' }, { translation_mode: 'auto', source_language: 'ca' }, { translation_mode: 'none', source_language: 'fr' }])
      expect(modeDeLaPublicacio(dolenta), JSON.stringify(dolenta)).toBeNull();
  });

  test('ambModeTraduccio: el document amb el mode d’este dispositiu; sense, el mateix objecte', () => {
    const doc = { id: 'n1', title: 'Crònica' };
    expect(ambModeTraduccio(doc)).toBe(doc);
    desaModeTraduccio('n1', { translation_mode: 'none', source_language: 'en' });
    expect(ambModeTraduccio(doc)).toEqual({ id: 'n1', title: 'Crònica', translation_mode: 'none', source_language: 'en' });
    expect(doc).toEqual({ id: 'n1', title: 'Crònica' });
    expect(ambModeTraduccio(null)).toBeNull();
  });
});
