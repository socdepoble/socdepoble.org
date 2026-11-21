/* La Nevera de Casa · Onada R32.24 · T3 (Triatge i reparació Node 0 R769–R985):
   · R888 / R936: Temporada i perTemporada parlen les 5 llengües (ca, es, en, eu, gl)
     en mesos, títols de temporada, grups de temporada i subtítols/entradetes del catàleg.
   · R883: EncarrecBotigaPoble enllaça aria-expanded + aria-controls cap al panell obert.
   · R880: ComparticioLlistaCompra enllaça aria-expanded + aria-controls i cau netament
     al camp d'enllaç manual quan navigator.clipboard no existix. */
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../../utils/__fixtures__/navegadorFals.js';
import { ENTORN_OBERT, muntaPlataforma } from '../../plataforma/__fixtures__/munta.jsx';
import { creaRegistre } from '../../plataforma/registreApps.js';
import AppNevera from '../AppNevera.jsx';
import { creaMagatzemNevera } from '../magatzem.js';
import manifestNevera from '../manifest.js';
import { ARTICLES_BASE, afig, estatInicial } from '../nucli/index.js';
import {
  grupsDeTemporada,
  nomDelMes,
  seccionsDeTemporada,
  titolDeTemporada,
} from '../vistes/perTemporada.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const tancats = [];

async function prepara(estat = null) {
  const idb = creaIdbFals();
  const locks = creaLocksFals();
  const canal = creaCanalFals();
  const magatzem = creaMagatzemNevera({ idb: idb.idb, navegador: { locks }, Canal: canal.Canal });
  tancats.push(magatzem);
  if (estat) await magatzem.desa(estat);
  const App = () => <AppNevera magatzem={magatzem} descarrega={vi.fn()} />;
  const registre = creaRegistre({
    internes: [{ ...manifestNevera, carrega: () => Promise.resolve({ default: App }) }],
  });
  return { registre };
}

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
});

afterEach(async () => {
  cleanup();
  while (tancats.length > 0) tancats.pop().tanca();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Onada R32.24 · T3 · Nevera (R880, R883, R888, R936)', () => {
  test('perTemporada conserva el valencià per defecte i traduïx mesos, títols i seccions a es, en, eu i gl', () => {
    expect(nomDelMes(10)).toBe('Octubre');
    expect(titolDeTemporada(10)).toBe('De temporada a l’octubre');
    expect(titolDeTemporada(1)).toBe('De temporada al gener');

    expect(nomDelMes(1, 'es')).toBe('Enero');
    expect(titolDeTemporada(10, 'es')).toBe('De temporada en octubre');
    expect(titolDeTemporada(10, 'en')).toBe('In season in October');
    expect(titolDeTemporada(10, 'eu')).toBe('Sasoikoa urrian');
    expect(titolDeTemporada(10, 'gl')).toBe('De tempada en outubro');

    expect(seccionsDeTemporada('en').map((s) => s.nom)).toEqual([
      'Peak season',
      'Early season',
      'Late season',
    ]);
    expect(grupsDeTemporada(false, 'eu').map((g) => g.nom)).toContain('Sasoitik kanpo');
  });

  test('Temporada renderitza subtítols, entradetes, mes i grups en anglés quan idioma="en"', async () => {
    const taronja = ARTICLES_BASE.find((a) => a.categoriaId === 'fruita-verdura') || ARTICLES_BASE[0];
    const estat = afig(estatInicial(), 'casa', taronja.id);
    const { registre } = await prepara(estat);
    muntaPlataforma('/app/nevera/temporada/casa?mes=1', {
      registre,
      entorn: ENTORN,
      externalConfig: { language: 'en' },
    });

    expect(await screen.findByText('January')).toBeTruthy();
    const detall = within(document.getElementById('app-grid-main'));
    expect(await detall.findByText('In season in January')).toBeTruthy();
    expect(screen.getAllByText(/Fruit/i).length).toBeGreaterThan(0);
  });

  test('EncarrecBotigaPoble i ComparticioLlistaCompra enllacen aria-controls amb el panell obert i suporten absència de clipboard', async () => {
    const estat = afig(estatInicial(), 'casa', ARTICLES_BASE[0].id);
    const { registre } = await prepara(estat);
    Object.defineProperty(window.navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });

    muntaPlataforma('/app/nevera/llista/casa', { registre, entorn: ENTORN });

    const botoEncarrec = await screen.findByRole('button', { name: 'Prepara encàrrec per a la botiga local' });
    expect(botoEncarrec.getAttribute('aria-expanded')).toBe('false');
    expect(botoEncarrec.getAttribute('aria-controls')).toBeNull();

    fireEvent.click(botoEncarrec);
    expect(botoEncarrec.getAttribute('aria-expanded')).toBe('true');
    const idEncarrec = botoEncarrec.getAttribute('aria-controls');
    expect(idEncarrec).toBeTruthy();
    expect(document.getElementById(idEncarrec)).not.toBeNull();

    const botoCompartix = screen.getByRole('button', { name: 'Compartix o importa la llista' });
    expect(botoCompartix.getAttribute('aria-controls')).toBeNull();
    fireEvent.click(botoCompartix);
    const idCompartix = botoCompartix.getAttribute('aria-controls');
    expect(idCompartix).toBeTruthy();
    expect(document.getElementById(idCompartix)).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Copia l’enllaç' }));
    expect(await screen.findByLabelText('Enllaç per a compartir')).toBeTruthy();
  });
});
