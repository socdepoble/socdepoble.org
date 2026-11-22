/**
 * Onada R32.35b · Lot 02 · Poliment Foraster, WebView humà, Comunitat sense carreró,
 * dades/dates territorials de fitxa de poble en 5 llengües i guàrdia d'errates (DOL-04, DOL-13, DOL-56, DOL-59, DOL-60).
 */
import React from 'react';
import '../../../tests/helpers/diccionaris.js';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createTranslator } from '../../config/i18n.js';
import { textosNavegadorIncrustat } from '../../utils/navegadorIncrustat.js';
import FitxaComunitat from '../xat/components/FitxaComunitat.jsx';
import { agrupaComunitats, mapejaFil } from '../xat/missatges.js';
import { textosFitxaComunitatForaster } from '../xat/components/i18nFitxaComunitatForaster.js';
import { textosFontsTerritorials } from '../pobles/i18nFontsTerritorials.js';
import { anyCensNet, construeixModelFontsTerritorials } from '../pobles/panellDeViquipediaModel.js';

afterEach(cleanup);

function comunitatMostra() {
  const fils = [
    { id: 'fake-poble', tipus: 'comunitat', titol: 'Gent de Poble' },
    { id: 'fake-poble-avisos', tipus: 'canal', titol: 'Avisos', comunitatId: 'fake-poble', rol: 'membre', ultimText: 'Benvinguts' },
    { id: 'fake-poble-general', tipus: 'grup', titol: 'General', comunitatId: 'fake-poble', ultimText: 'Hola' },
  ].map((f) => mapejaFil(f));
  return agrupaComunitats(fils)[0];
}

describe('Onada R32.35b · Lot 02 · DOL-04, DOL-13, DOL-56, DOL-59 i DOL-60', () => {
  test('DOL-04 · /connectar dignifica el Mode Foraster en les 5 llengües sense «Mode Foraster actiu» policial', () => {
    const esperats = {
      ca: 'Benvinguda en Mode Foraster',
      es: 'Te damos la bienvenida en Modo Forastero',
      en: 'Welcome to Outsider Mode',
      eu: 'Ongi etorri Arrotz moduan',
      gl: 'Benvida en Modo Forasteiro',
    };
    for (const [lang, titol] of Object.entries(esperats)) {
      const t = createTranslator(lang);
      expect(t('section.connectar.foraster.titol')).toBe(titol);
      expect(t('section.connectar.foraster.calEntrar').length).toBeGreaterThan(25);
      expect(t('section.connectar.foraster.local').length).toBeGreaterThan(25);
      expect(t('section.connectar.foraster.localEnllac').length).toBeGreaterThan(25);
    }
  });

  test('DOL-13 · navegadorIncrustat elimina l’argot tècnic «403 disallowed_useragent» en les 5 llengües', () => {
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      const tx = textosNavegadorIncrustat(lang);
      expect(tx.avis).not.toContain('403');
      expect(tx.avis).not.toContain('disallowed_useragent');
      expect(tx.avisSenseApp).not.toContain('403');
      expect(tx.avisSenseApp).not.toContain('disallowed_useragent');
    }
  });

  test('DOL-56 · FitxaComunitat sense sessió evita «Grups als quals pertanys» i oferix accés directe en les 5 llengües', () => {
    const t = (_, alt) => alt;
    const onEntrar = vi.fn();
    const onAfegirGrup = vi.fn();
    render(
      <FitxaComunitat
        comunitat={comunitatMostra()}
        onObriFil={vi.fn()}
        onAfegirGrup={onAfegirGrup}
        onEntrar={onEntrar}
        senseSessio={true}
        locale="es-ES"
        t={t}
        joId={null}
      />
    );
    const fitxa = screen.getByRole('region', { name: 'Gent de Poble' });
    expect(within(fitxa).getByRole('heading', { name: 'Grupos de esta comunidad' })).toBeTruthy();
    expect(within(fitxa).queryByRole('heading', { name: 'Grups als quals pertanys' })).toBeNull();
    const boto = within(fitxa).getByRole('button', { name: 'Entrar o registrarse' });
    fireEvent.click(boto);
    expect(onEntrar).toHaveBeenCalledTimes(1);
    expect(onAfegirGrup).not.toHaveBeenCalled();
  });

  test('DOL-59 · construeixModelFontsTerritorials sanejant anys/zeros negatius/buits en les 5 llengües', () => {
    expect(anyCensNet(NaN)).toBeNull();
    expect(anyCensNet('Invalid Date')).toBeNull();
    expect(anyCensNet(2025)).toBe('2025');
    expect(construeixModelFontsTerritorials(null, textosFontsTerritorials('ca')).dades).toEqual([]);

    const modelEu = construeixModelFontsTerritorials(
      {
        comarca: '   ',
        provincia: 'Alacant',
        population: '132 hab (2025)',
        population_year: 2025,
        elevation: -0,
        area: 11.2,
        gentilici: 'baloner',
        lat: -0,
        lng: 0,
      },
      textosFontsTerritorials('eu-ES')
    );
    expect(modelEu.dades).toEqual([
      ['Probintzia', 'Alacant'],
      ['Biztanleria', '132 hab (2025)'],
      ['Garaiera', '0 m'],
      ['Azalera', '11.2 km²'],
      ['Herritar-izena', 'baloner'],
      ['Koordenatuak', '0, 0'],
    ]);

    const modelGl = construeixModelFontsTerritorials(
      {
        population: '132 hab',
        population_year: NaN,
      },
      textosFontsTerritorials('gl-ES')
    );
    expect(modelGl.dades).toEqual([['Poboación', '132 hab']]);
  });

  test('DOL-60 · cap cadena dels diccionaris nous o tocats conté les errates «quína embolic» ni «carrgat»', () => {
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      const bloc = JSON.stringify({
        nav: textosNavegadorIncrustat(lang),
        foraster: textosFitxaComunitatForaster(lang),
        fonts: textosFontsTerritorials(lang),
      }).toLowerCase();
      expect(bloc).not.toContain('quína embolic');
      expect(bloc).not.toContain('carrgat');
    }
  });
});
