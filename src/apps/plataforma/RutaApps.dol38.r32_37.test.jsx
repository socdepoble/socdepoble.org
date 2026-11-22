/* Onada R32.37 · DOL-38 (Assaig a la Plaça · Vicent) + paritat 5 llengües d'estats a RutaApps.jsx. */
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { delVal, setVal } from '../../config/storage.js';
import { LANGUAGE_STORAGE_KEY } from '../../config/i18n.js';
import { ENTORN_OBERT, muntaPlataforma } from './__fixtures__/munta.jsx';
import { manifestDeProva } from './__fixtures__/manifests.js';
import { CLAU_PREFERENCIES, _reiniciaPreferencies } from './preferenciesApps.js';
import { creaRegistre } from './registreApps.js';

const registreBase = (canvis = {}) => creaRegistre({ internes: [manifestDeProva(canvis)] });
const ubicacio = () => screen.getByTestId('ubicacio').textContent;

beforeEach(() => {
  delVal(CLAU_PREFERENCIES);
  delVal(LANGUAGE_STORAGE_KEY);
  _reiniciaPreferencies();
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  delVal(CLAU_PREFERENCIES);
  delVal(LANGUAGE_STORAGE_KEY);
  _reiniciaPreferencies();
});

describe('Onada R32.37 · DOL-38 · àlies canònics de Calendari Agrícola i Banc de Llavors', () => {
  test.each([
    ['/app/calendari-agricola', '/page/banc-de-llavors?llibre=calendari'],
    ['/app/calendari-agricola/inici', '/page/banc-de-llavors?llibre=calendari'],
    ['/app/banc-de-llavors', '/page/banc-de-llavors'],
    ['/app/llavors', '/page/banc-de-llavors']
  ])('%s redirigix amb replace cap a %s sense engreixar l’historial', async (origen, destiEsperat) => {
    window.history.replaceState(null, '', '/');
    const llargInicial = window.history.length;
    muntaPlataforma(origen, { registre: registreBase() });
    expect(await screen.findByText('Fora de les apps')).toBeTruthy();
    await waitFor(() => expect(ubicacio()).toBe(destiEsperat));
    expect(window.history.length).toBe(llargInicial);
  });

  test('una ruta insegura dins d’un àlies (/app/calendari-agricola/taula%20gran) continua rebutjada abans de redirigir', () => {
    muntaPlataforma('/app/calendari-agricola/taula%20gran', { registre: registreBase() });
    expect(screen.getByText('Esta adreça no és vàlida')).toBeTruthy();
  });

  test('els estats d’app apagada, no disponible i desconeguda es mostren traduïts en les 5 llengües oficials', async () => {
    const esperats = [
      ['ca', 'Esta app no està activada', 'Esta app no es pot obrir ací', 'No coneixem esta app'],
      ['es', 'Esta app no está activada', 'Esta app no se puede abrir aquí', 'No conocemos esta app'],
      ['en', 'This app is switched off', 'This app cannot be opened here', 'Unknown app'],
      ['eu', 'Aplikazio hau ez dago aktibatuta', 'Aplikazio hau ezin da hemen ireki', 'Ez dugu aplikazio hau ezagutzen'],
      ['gl', 'Esta app non está activada', 'Esta app non se pode abrir aquí', 'Non coñecemos esta app']
    ];

    for (const [codi, desactivadaTxt, noDisponibleTxt, desconegudaTxt] of esperats) {
      setVal(LANGUAGE_STORAGE_KEY, { v: 2, codi });

      muntaPlataforma('/app/prova/inici', { registre: registreBase({ actiuPerDefecte: false }) });
      expect(await screen.findByText(desactivadaTxt)).toBeTruthy();
      cleanup();

      muntaPlataforma('/app/prova/inici', {
        registre: registreBase({ dadesPersonals: 'salut' }),
        entorn: { ...ENTORN_OBERT, amaDelDocument: false }
      });
      expect(await screen.findByText(noDisponibleTxt)).toBeTruthy();
      cleanup();

      muntaPlataforma('/app/fantasma/inici', { registre: registreBase() });
      expect(await screen.findByText(desconegudaTxt)).toBeTruthy();
      cleanup();
    }
  });
});
