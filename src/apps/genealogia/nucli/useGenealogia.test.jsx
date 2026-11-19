/* Arbre Genealògic · ProveidorGenealogia amb un magatzem en memòria: l'avís,
   l'entrevista que crea l'arbre si no n'hi ha, desar persones i vincles amb
   errors en codi, les alertes, Sosa, la importació i el canvi d'arbre. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { ARA, comptador, uid } from './__fixtures__/arbreSintetic.js';
import { creaIdbFals } from '../../../utils/__fixtures__/navegadorFals.js';
import { NOM_BASE, creaMagatzemGenealogia } from '../magatzem.js';
import { creaArbre, creaPersona } from './model.js';
import { ProveidorGenealogia, useGenealogia } from './useGenealogia.jsx';

const RELLOTGE = () => new Date(ARA);

function munta() {
  const magatzem = creaMagatzemGenealogia({ idb: null, navegador: null, Canal: null, anyActual: 2026 });
  const nouId = comptador();
  const wrapper = ({ children }) => (
    <ProveidorGenealogia magatzem={magatzem} rellotge={RELLOTGE} nouId={nouId}>{children}</ProveidorGenealogia>
  );
  const vista = renderHook(() => useGenealogia(), { wrapper });
  return { ...vista, magatzem };
}

afterEach(cleanup);

describe('ProveidorGenealogia', () => {
  test('fora del proveïdor llança', () => {
    const silenci = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useGenealogia())).toThrow(/ProveidorGenealogia/);
    silenci.mockRestore();
  });

  test('arrenca buit, en memòria, amb l’avís pendent', async () => {
    const { result } = munta();
    await waitFor(() => expect(result.current.carregat).toBe(true));
    expect(result.current).toMatchObject({ persistent: false, avisAcceptat: false, arbres: [], complet: null, alertes: [], sosa: null, anyActual: 2026 });
    await act(() => result.current.acceptaAvis());
    expect(result.current.avisAcceptat).toBe(true);
  });

  test('l’entrevista crea l’arbre i la persona arrel, viva', async () => {
    const { result } = munta();
    await waitFor(() => expect(result.current.carregat).toBe(true));
    await act(async () => { expect(await result.current.respon('Ca la Prova')).toEqual({ ok: true, errors: [] }); });
    expect(result.current.arbres).toHaveLength(1);
    expect(result.current.complet.arbre.malnomCasa).toBe('Ca la Prova');
    await act(() => result.current.salta());
    let resposta;
    await act(async () => { resposta = await result.current.respon({ nom: 'Anna', naixement: '1978-13' }); });
    expect(resposta).toEqual({ ok: false, errors: [{ camp: 'naixement', clau: 'rang' }] });
    await act(async () => { resposta = await result.current.respon({ nom: 'Anna', cognom1: 'Prova', naixement: '1978' }); });
    expect(resposta.ok).toBe(true);
    const [anna] = result.current.complet.persones;
    expect(anna).toMatchObject({ nom: 'Anna', viva: 'si', estat: 'aproximat' });
    expect(result.current.complet.arbre.arrelId).toBe(anna.id);
    expect(result.current.esViva(anna.id)).toBe(true);
    expect(result.current.sosa.perPersona.get(anna.id)).toEqual([1]);
    await act(() => result.current.enrere());
    expect(result.current.complet.entrevista.pas).toBe(2);
  });

  test('persones i vincles: errors en codi, alertes i esborrat en cascada', async () => {
    const { result } = munta();
    await waitFor(() => expect(result.current.carregat).toBe(true));
    let r;
    await act(async () => { r = await result.current.desaPersona({ nom: 'Sense arbre' }); });
    expect(r).toEqual({ ok: false, errors: [{ camp: 'arbre', clau: 'sense-arbre' }] });
    await act(() => result.current.creaArbre({ titol: 'Família de prova' }));
    await act(async () => { r = await result.current.desaPersona({ nom: 'X', sexe: 'Z' }); });
    expect(r).toMatchObject({ ok: false, errors: [{ camp: 'sexe', clau: 'invalid' }] });
    let pare;
    let fill;
    await act(async () => { pare = (await result.current.desaPersona({ nom: 'Pare', sexe: 'M', naixement: '1900', defuncio: '1970' })).persona; });
    await act(async () => { fill = (await result.current.desaPersona({ nom: 'Fill', naixement: '1905' })).persona; });
    expect(pare.origen).toBe('ma');
    await act(async () => { r = await result.current.desaRelacio({ tipus: 'progenitor', de: pare.id, a: fill.id, evidencia: { fontEscrita: true, vincleExplicit: true }, estat: 'aproximat' }); });
    expect(r.relacio.estat).toBe('confirmat');
    await act(async () => { r = await result.current.desaRelacio({ tipus: 'progenitor', de: pare.id, a: uid(777) }); });
    expect(r.errors).toEqual([{ camp: 'a', clau: 'invalid' }]);
    expect(result.current.alertes.map((a) => a.tipus)).toEqual(['progenitor-massa-jove']);
    await act(() => result.current.posaArrel(fill.id));
    expect(result.current.sosa.perPersona.get(pare.id)).toEqual([2]);
    await act(() => result.current.esborraPersona(pare.id));
    expect(result.current.complet.persones.map((p) => p.nom)).toEqual(['Fill']);
    expect(result.current.complet.relacions).toEqual([]);
  });

  test('importa un arbre nou, el fa actiu, i triaArbre torna a l’anterior', async () => {
    const { result } = munta();
    await waitFor(() => expect(result.current.carregat).toBe(true));
    let primer;
    await act(async () => { primer = await result.current.creaArbre({ titol: 'Primer' }); });
    const arbreImportat = creaArbre({ id: uid(500), titol: 'Importat', ara: ARA });
    const entrant = { arbre: arbreImportat, persones: [creaPersona({ id: uid(501), arbreId: uid(500), ara: ARA, nom: 'Besavi', naixement: '1850' }, { anyActual: 2026 })], relacions: [], entrevista: null };
    await act(() => result.current.importa(entrant, { mode: 'nou' }));
    expect(result.current.arbreActiu).toBe(uid(500));
    expect(result.current.esViva(uid(501))).toBe(false);
    await expect(result.current.importa(entrant, { mode: 'nou' })).rejects.toThrow(TypeError);
    await act(() => result.current.triaArbre(primer));
    expect(result.current.complet.arbre.titol).toBe('Primer');
    await act(() => result.current.marcaCopia());
    expect(result.current.ultimaCopia).toBe(ARA);
    await act(() => result.current.esborraArbre(primer));
    expect(result.current.arbres.map((a) => a.titol)).toEqual(['Importat']);
  });
});

/* P1-81 · la base xifrada amb frase de pas, des del proveïdor: el disc (IDB fals)
   no porta cap nom, les escriptures es tornen a xifrar, i la clau es descarta en
   bloquejar i en pagehide. Iteracions de producció: cada derivació tarda una mica. */
describe('ProveidorGenealogia · base xifrada (P1-81)', () => {
  const FRASE = 'quatre paraules ben llargues';

  test('activa, escriu xifrat, bloqueja, desbloqueja, es tanca en pagehide i es desactiva', async () => {
    const fals = creaIdbFals();
    const magatzem = creaMagatzemGenealogia({ idb: fals.idb, navegador: null, Canal: null, anyActual: 2026 });
    const nouId = comptador();
    const wrapper = ({ children }) => (
      <ProveidorGenealogia magatzem={magatzem} rellotge={RELLOTGE} nouId={nouId}>{children}</ProveidorGenealogia>
    );
    const { result } = renderHook(() => useGenealogia(), { wrapper });
    const disc = () => JSON.stringify(['arbres', 'persones', 'relacions', 'entrevistes', 'meta', 'cofre'].map((s) => fals.files(NOM_BASE, s)));
    await waitFor(() => expect(result.current.carregat).toBe(true));
    expect(result.current).toMatchObject({ xifrat: false, bloquejat: false });
    await act(() => result.current.creaArbre({ titol: 'Família de prova' }));
    await act(() => result.current.desaPersona({ nom: 'Vicenta', cognom1: 'Ferrer' }));
    expect(disc()).toMatch(/Vicenta/);

    let r;
    await act(async () => { r = await result.current.activaXifrat('curta'); });
    expect(r).toEqual({ ok: false, errors: [{ camp: null, clau: 'frase-curta' }] });
    await act(async () => { r = await result.current.activaXifrat(FRASE); });
    expect(r).toEqual({ ok: true, errors: [] });
    expect(result.current).toMatchObject({ xifrat: true, bloquejat: false });
    expect(result.current.complet.persones.map((p) => p.nom)).toEqual(['Vicenta']);
    expect(disc()).not.toMatch(/Vicenta|Ferrer|Família/);

    await act(() => result.current.desaPersona({ nom: 'Rosalia', cognom1: 'Ferrer' }));
    expect(result.current.complet.persones.map((p) => p.nom).sort()).toEqual(['Rosalia', 'Vicenta']);
    expect(disc()).not.toMatch(/Rosalia|Vicenta|Ferrer/);

    await act(() => result.current.bloqueja());
    expect(result.current).toMatchObject({ xifrat: true, bloquejat: true, complet: null, arbres: [] });
    await act(async () => { r = await result.current.desbloqueja('una altra frase incorrecta'); });
    expect(r).toEqual({ ok: false, errors: [{ camp: null, clau: 'frase-incorrecta' }] });
    expect(result.current.bloquejat).toBe(true);
    await act(async () => { r = await result.current.desbloqueja(FRASE); });
    expect(r.ok).toBe(true);
    expect(result.current.bloquejat).toBe(false);
    expect(result.current.complet.persones.map((p) => p.nom).sort()).toEqual(['Rosalia', 'Vicenta']);

    await act(async () => { window.dispatchEvent(new Event('pagehide')); });
    await waitFor(() => expect(result.current.bloquejat).toBe(true));
    expect(result.current.complet).toBeNull();

    await act(async () => { r = await result.current.desactivaXifrat(FRASE); });
    expect(r).toEqual({ ok: true, errors: [] });
    expect(result.current).toMatchObject({ xifrat: false, bloquejat: false });
    expect(result.current.complet.persones.map((p) => p.nom).sort()).toEqual(['Rosalia', 'Vicenta']);
    expect(fals.files(NOM_BASE, 'cofre')).toEqual([]);
  }, 30000);

  function muntaXifrat() {
    const fals = creaIdbFals();
    const magatzem = creaMagatzemGenealogia({ idb: fals.idb, navegador: null, Canal: null, anyActual: 2026 });
    const nouId = comptador();
    const wrapper = ({ children }) => (
      <ProveidorGenealogia magatzem={magatzem} rellotge={RELLOTGE} nouId={nouId}>{children}</ProveidorGenealogia>
    );
    return { fals, magatzem, ...renderHook(() => useGenealogia(), { wrapper }) };
  }
  const noms = (result) => result.current.complet?.persones.map((p) => p.nom).sort() ?? null;

  test('es tanca encara que el disc no es puga llegir (bloqueja i pagehide)', async () => {
    const { magatzem, result } = muntaXifrat();
    await waitFor(() => expect(result.current.carregat).toBe(true));
    await act(() => result.current.creaArbre({ titol: 'Família de prova' }));
    await act(() => result.current.desaPersona({ nom: 'Vicenta', cognom1: 'Ferrer' }));
    await act(() => result.current.activaXifrat(FRASE));
    expect(noms(result)).toEqual(['Vicenta']);
    const bolca = magatzem.bolca;
    const trenca = () => {
      magatzem.bolca = () => Promise.reject(Object.assign(new Error('IndexedDB no disponible'), { codi: 'NO_DISPONIBLE' }));
    };

    trenca();
    await act(() => result.current.bloqueja());
    expect(result.current).toMatchObject({ xifrat: true, bloquejat: true, complet: null, arbres: [] });
    expect(result.current.error?.codi).toBe('NO_DISPONIBLE');

    magatzem.bolca = bolca;
    await act(() => result.current.desbloqueja(FRASE));
    expect(noms(result)).toEqual(['Vicenta']);
    trenca();
    await act(async () => { window.dispatchEvent(new Event('pagehide')); });
    expect(result.current).toMatchObject({ xifrat: true, bloquejat: true, complet: null, arbres: [] });
    magatzem.bolca = bolca;
  }, 30000);

  test('dos desats seguits: un xifrat que acaba tard no trepitja el més nou', async () => {
    const { result } = muntaXifrat();
    await waitFor(() => expect(result.current.carregat).toBe(true));
    await act(() => result.current.creaArbre({ titol: 'Família de prova' }));
    await act(() => result.current.activaXifrat(FRASE));
    const subtle = globalThis.crypto.subtle;
    const encrypt = subtle.encrypt.bind(subtle);
    let primer = true;
    const espia = vi.spyOn(subtle, 'encrypt').mockImplementation(async (...args) => {
      if (primer) {
        primer = false;
        await new Promise((resol) => { setTimeout(resol, 60); });
      }
      return encrypt(...args);
    });
    let a;
    let b;
    try {
      await act(async () => {
        const pere = result.current.desaPersona({ nom: 'Pere', cognom1: 'Ferrer' });
        await new Promise((resol) => { setTimeout(resol, 5); });
        const rosalia = result.current.desaPersona({ nom: 'Rosalia', cognom1: 'Ferrer' });
        [a, b] = await Promise.all([pere, rosalia]);
      });
    } finally {
      espia.mockRestore();
    }
    expect([a.ok, b.ok]).toEqual([true, true]);
    await act(() => result.current.bloqueja());
    await act(() => result.current.desbloqueja(FRASE));
    expect(noms(result)).toEqual(['Pere', 'Rosalia']);
  }, 30000);
});
