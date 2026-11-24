/* Arbre Genealògic · proves regressives G12 (R32.71): anti-doble-clic en
   desar persona nova, anti-doble-salt en l'entrevista i neteja d'errors en
   editar (sets vs resets). */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { ENTORN_OBERT, muntaPlataforma } from '../../plataforma/__fixtures__/munta.jsx';
import { _reiniciaPreferencies } from '../../plataforma/preferenciesApps.js';
import { creaRegistre } from '../../plataforma/registreApps.js';
import manifestGenealogia from '../manifest.js';
import AppGenealogia from '../AppGenealogia.jsx';
import { VERSIO_AVIS } from '../textos.js';
import { carregaArbre, creaMagatzemGenealogia, desaArbre, desaMeta, llistaArbres } from '../magatzem.js';
import { ARBRE_ID, complet, persona, uid } from '../nucli/__fixtures__/arbreSintetic.js';

const ENTORN = Object.freeze({ ...ENTORN_OBERT, produccio: false });
const ARA = new Date(2026, 10, 24, 1, 30);
let magatzem;
let comptador;

function munta(url) {
  const App = () => (
    <AppGenealogia
      magatzem={magatzem}
      rellotge={() => ARA}
      nouId={() => {
        comptador += 1;
        return `00000000-0000-4000-8000-${String(8000 + comptador).padStart(12, '0')}`;
      }}
    />
  );
  const carrega = vi.fn(() => Promise.resolve({ default: App }));
  muntaPlataforma(url, { registre: creaRegistre({ internes: [{ ...manifestGenealogia, carrega }] }), entorn: ENTORN });
}

beforeEach(async () => {
  comptador = 0;
  window.localStorage.clear();
  _reiniciaPreferencies();
  magatzem = creaMagatzemGenealogia({ idb: null, navegador: null, Canal: null, anyActual: 2026 });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  await desaMeta(magatzem, 'avis', { acceptatA: '2026-11-01T08:00:00.000Z', versio: VERSIO_AVIS });
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('G12 · Ergonomia AAA i anti-doble-clic en Genealogia', () => {
  test('doble clic en crear una persona nova no duplica registres i corregix errors en escriure', async () => {
    const base = complet([
      persona(1, { nom: 'Arrel', cognom1: 'Mostra', sexe: 'F', naixement: '1990', viva: 'si' })
    ], [], { arrelId: uid(1) });
    await desaArbre(magatzem, base);
    await desaMeta(magatzem, 'arbreActiu', ARBRE_ID);

    munta('/app/genealogia/persones/nova');
    const campNom = await screen.findByRole('textbox', { name: 'Nom' });
    const grupNaixement = screen.getByRole('group', { name: 'Naixement' });
    fireEvent.click(within(grupNaixement).getByRole('radio', { name: 'Exacta (1908)' }));
    const campAny = within(grupNaixement).getByRole('textbox');

    /* Provoca un error de data invàlida i comprova que desapareix en corregir el camp. */
    fireEvent.change(campAny, { target: { value: 'data-no-valida' } });
    const botoDesa = screen.getByRole('button', { name: 'Desa' });
    expect(botoDesa.closest('.sdp-accions')).toBeTruthy();
    fireEvent.click(botoDesa);
    await waitFor(() => expect(campAny.getAttribute('aria-invalid')).toBe('true'));

    fireEvent.change(campAny, { target: { value: '1958' } });
    expect(campAny.getAttribute('aria-invalid')).not.toBe('true');

    /* Doble clic ràpid sobre Desa només inserix una persona nova. */
    fireEvent.change(campNom, { target: { value: 'Pepa' } });
    fireEvent.click(botoDesa);
    fireEvent.click(botoDesa);

    await waitFor(async () => {
      const desat = await carregaArbre(magatzem, ARBRE_ID);
      expect(desat.persones).toHaveLength(2);
    });
  });

  test('doble clic sobre «Salta» o «Següent» a l’entrevista no salta dues preguntes de colp', async () => {
    munta('/app/genealogia/entrevista');
    const titolPas0 = await screen.findByRole('heading', { level: 3 });
    expect(titolPas0.textContent).toMatch(/malnom de la vostra casa/);

    const salta = screen.getByRole('button', { name: 'Salta' });
    fireEvent.click(salta);
    fireEvent.click(salta);

    /* El pas següent immediat és el de mas/partida/poble (pas 1), mai el pas 2. */
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3 }).textContent).toMatch(/mas, partida o poble/);
    });
    const [arbre] = await llistaArbres(magatzem);
    expect((await carregaArbre(magatzem, arbre.id)).entrevista.pas).toBe(1);
  });
});
