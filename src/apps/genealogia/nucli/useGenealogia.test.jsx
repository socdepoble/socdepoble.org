/* Arbre Genealògic · ProveidorGenealogia amb un magatzem en memòria: l'avís,
   l'entrevista que crea l'arbre si no n'hi ha, desar persones i vincles amb
   errors en codi, les alertes, Sosa, la importació i el canvi d'arbre. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { ARA, comptador, uid } from './__fixtures__/arbreSintetic.js';
import { creaMagatzemGenealogia } from '../magatzem.js';
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
