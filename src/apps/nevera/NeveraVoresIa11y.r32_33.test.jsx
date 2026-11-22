import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ENTORN_OBERT, muntaPlataforma } from '../plataforma/__fixtures__/munta.jsx';
import { ClosaAplicacio } from '../plataforma/index.js';
import { creaRegistre } from '../plataforma/registreApps.js';
import { CODIS_IDIOMA_NEVERA, textosVistaNevera } from './i18nNevera.js';
import manifestNevera from './manifest.js';
import { ambPreusMercadona, nomLlistaVisible } from './mercadona.js';
import { ComparadorMercadona } from './vistes/Mercadona.jsx';

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1280);
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Onada R32.33 · La Nevera · vores de preus (-0 / NaN) i i18n 5 llengues al comparador local', () => {
  test('nomLlistaVisible tradueix el llegat Mercadona en les 5 llengues i conserva el valencia per defecte', () => {
    expect(nomLlistaVisible('Mercadona')).toBe('Botiga de poble');
    for (const idioma of CODIS_IDIOMA_NEVERA) {
      expect(nomLlistaVisible('Mercadona', idioma)).toBe(textosVistaNevera(idioma).botigaDePoble);
      expect(nomLlistaVisible('Mercat del dijous', idioma)).toBe('Mercat del dijous');
    }
  });

  test('ambPreusMercadona no peta amb entrades nules ni pinta -0,00 € o NaN €', () => {
    expect(ambPreusMercadona(null, null)).toEqual([]);
    const articles = [
      { id: 'p-zero', nom: 'Aigua' },
      { id: 'p-nan', nom: 'Oli' },
    ];
    const productes = [
      { id: 'p-zero', preuEnvas: -0, preuUnitari: -0, unitatPreuUnitari: 'l' },
      { id: 'p-nan', preuEnvas: NaN, preuUnitari: Infinity, unitatPreuUnitari: 'l' },
    ];
    const resultat = ambPreusMercadona(articles, productes);
    expect(resultat[0].valor).toBe('0,00 € · 0,00 €/l');
    expect(resultat[0].valor).not.toContain('-0');
    expect(resultat[1]).toEqual({ id: 'p-nan', nom: 'Oli' });
  });

  test.each(CODIS_IDIOMA_NEVERA)(
    'ComparadorMercadona en %s exposa etiquetes accessibles, proveidor per defecte localitzat i zero -0,00 €',
    async (idioma) => {
      const tx = textosVistaNevera(idioma);
      const producte = {
        id: 'mer-oli',
        nom: 'Oli oliva',
        quantitat: 1,
        unitat: 'l',
        preuCentims: 450,
        preuUnitariCentims: -0,
        unitatPreuUnitari: 'l',
      };
      const ColumnaBuida = () => null;
      const VistaProva = () => <ComparadorMercadona producte={producte} />;
      const App = () => (
        <ClosaAplicacio
          rutes={[{ path: 'rebost', Esquerra: ColumnaBuida, Mig: VistaProva, Detall: ColumnaBuida }]}
          titols={{ esquerra: tx.llistes, mig: tx.compra }}
        />
      );
      const registre = creaRegistre({
        internes: [{ ...manifestNevera, carrega: () => Promise.resolve({ default: App }) }],
      });

      const { container } = muntaPlataforma('/app/nevera/rebost', {
        registre,
        entorn: { ...ENTORN_OBERT, produccio: false },
        externalConfig: { language: idioma },
      });

      expect(await screen.findByRole('group', { name: tx.comparadorLlegenda })).toBeTruthy();
      const campProveidor = screen.getByLabelText(tx.proveidorLocal);
      expect(campProveidor.value).toBe(tx.proveidorDefecte);
      expect(container.textContent).not.toContain('-0,00 €');

      fireEvent.change(campProveidor, { target: { value: 'Forn de la plaça' } });
      expect(campProveidor.value).toBe('Forn de la plaça');
    }
  );
});
