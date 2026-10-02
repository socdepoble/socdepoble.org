/**
 * Bucle adversarial (auditoria Codex 261002_0148, punt 10) · Les entrades
 * d'una connexió no sobreviuen a la desconnexió: cada resultat porta la
 * versió de sessió amb què es va demanar, i només es mostra el de la versió
 * vigent del seu compte. El primer cas és el reproductor de Codex, portat tal
 * qual (dades sintètiques, fetch simulat, cap compte real de Google).
 */
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { llegixConfigFonts } from './configFonts.js';
import { MOTIU_IDENTITAT, desaToken, estatDelCompte, instantania, oblidaTot } from './sessioFonts.js';
import { useFontsCalendari } from './useFontsCalendari.js';

const config = llegixConfigFonts({ VITE_GOOGLE_OAUTH_CLIENT_ID: '123-proves.apps.googleusercontent.com' }, { origen: 'http://localhost:3000' });
const rang = { desde: new Date('2026-10-01T00:00:00Z'), fins: new Date('2026-11-01T00:00:00Z') };
const NOVEMBRE = { desde: new Date('2026-11-01T00:00:00Z'), fins: new Date('2026-12-01T00:00:00Z') };
const ORG = 'calendari@example.org';
const DUES = llegixConfigFonts({
  VITE_GOOGLE_OAUTH_CLIENT_ID: '123-proves.apps.googleusercontent.com',
  VITE_GCAL_FONTS: JSON.stringify([
    { id: 'privat', nom: 'El meu calendari', calendarId: 'primary' },
    { id: 'organitzacio', nom: 'Organització', calendarId: ORG, compte: ORG }
  ])
}, { origen: 'http://localhost:3000' });

const resposta = (items) => ({ ok: true, status: 200, json: async () => ({ items }) });
const acte = (id, summary, dia = '2026-10-10') => ({ id, summary, start: { date: dia }, end: { date: dia.replace(/\d{2}$/, (d) => String(Number(d) + 1).padStart(2, '0')) } });
const titols = (result) => result.current.entrades.map((e) => e.esdeveniment.titol);
const caduca = () => Date.now() + 600000;
/* Una promesa que es resol des de fora: la resposta de Google arriba quan la prova vol. */
function pendent() {
  let resol;
  const promesa = new Promise((r) => { resol = r; });
  return { promesa, resol };
}

let avis;
beforeEach(() => { avis = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => {
  cleanup();
  oblidaTot();
  avis.mockRestore();
});

test('reconnectar no mostra esdeveniments privats de la sessió anterior', async () => {
  let completaSegona;
  const primera = { ok: true, json: async () => ({ items: [{ id: 'old', summary: 'PrivateOldSynthetic', start: { date: '2026-10-10' }, end: { date: '2026-10-11' } }] }) };
  const fetchImpl = vi.fn().mockResolvedValueOnce(primera).mockImplementationOnce(() => new Promise((r) => { completaSegona = r; }));
  const { result } = renderHook(() => useFontsCalendari(rang, { config, fetchImpl }));
  act(() => desaToken('', { token: 'ya29.synthetic-old', caduca: Date.now() + 600000 }));
  await waitFor(() => expect(result.current.entrades.length).toBe(1));
  act(() => result.current.desconnecta(''));
  expect(result.current.entrades).toEqual([]);
  act(() => desaToken('', { token: 'ya29.synthetic-new', caduca: Date.now() + 600000 }));
  await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
  const durantCarrega = result.current.entrades.map((e) => e.esdeveniment.titol);
  await act(async () => completaSegona({ ok: true, json: async () => ({ items: [] }) }));
  expect(durantCarrega).not.toContain('PrivateOldSynthetic');
});

test('desconnectar i tornar a connectar: la font diu «carregant» sense cap entrada fins que arriba la resposta nova', async () => {
  const segona = pendent();
  const fetchImpl = vi.fn()
    .mockResolvedValueOnce(resposta([acte('vell', 'Acte de la sessió A')]))
    .mockImplementationOnce(() => segona.promesa);
  const { result } = renderHook(() => useFontsCalendari(rang, { config, fetchImpl }));
  act(() => desaToken('', { token: 'ya29.synthetic-a', caduca: caduca() }));
  await waitFor(() => expect(titols(result)).toEqual(['Acte de la sessió A']));
  act(() => result.current.desconnecta(''));
  act(() => desaToken('', { token: 'ya29.synthetic-b', caduca: caduca() }));
  await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
  expect(titols(result)).toEqual([]);
  expect(result.current.comptes[0].fonts[0]).toMatchObject({ fase: 'carregant', error: null });
  await act(async () => segona.resol(resposta([acte('nou', 'Acte de la sessió B')])));
  expect(titols(result)).toEqual(['Acte de la sessió B']);
});

test('una resposta tardana de la sessió anterior es descarta: no apareix ni abans ni després de la nova', async () => {
  const vella = pendent();
  const nova = pendent();
  const senyals = [];
  const fetchImpl = vi.fn((url, { signal }) => {
    senyals.push(signal);
    return senyals.length === 1 ? vella.promesa : nova.promesa;
  });
  const { result } = renderHook(() => useFontsCalendari(rang, { config, fetchImpl }));
  act(() => desaToken('', { token: 'ya29.synthetic-a', caduca: caduca() }));
  await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
  act(() => result.current.desconnecta(''));
  // Desconnectar avorta la consulta en curs del compte.
  expect(senyals[0].aborted).toBe(true);
  act(() => desaToken('', { token: 'ya29.synthetic-b', caduca: caduca() }));
  await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
  // La sessió A respon tard (un servidor que no fa cas del senyal): no compta.
  await act(async () => vella.resol(resposta([acte('tard', 'Resposta tardana de A')])));
  expect(titols(result)).toEqual([]);
  await act(async () => nova.resol(resposta([acte('nou', 'Acte de B')])));
  expect(titols(result)).toEqual(['Acte de B']);
});

test('dos comptes: desconnectar-ne un buida només les seues dades; reconnectar-lo no les torna a mostrar', async () => {
  const reconnexio = pendent();
  let crides = 0;
  const fetchImpl = vi.fn((url) => {
    const delOrg = decodeURIComponent(new URL(url).pathname.split('/')[4]) === ORG;
    if (!delOrg) return Promise.resolve(resposta([acte('fira', 'Fira privada')]));
    crides += 1;
    return crides === 1 ? Promise.resolve(resposta([acte('ple', 'Ple de l’organització', '2026-10-20')])) : reconnexio.promesa;
  });
  const { result } = renderHook(() => useFontsCalendari(rang, { config: DUES, fetchImpl }));
  act(() => {
    desaToken('', { token: 'ya29.synthetic-privat', caduca: caduca() });
    desaToken(ORG, { token: 'ya29.synthetic-org', caduca: caduca() });
  });
  await waitFor(() => expect(titols(result)).toEqual(['Fira privada', 'Ple de l’organització']));
  act(() => result.current.desconnecta(ORG));
  expect(titols(result)).toEqual(['Fira privada']);
  act(() => desaToken(ORG, { token: 'ya29.synthetic-org-2', caduca: caduca() }));
  await waitFor(() => expect(crides).toBe(2));
  expect(titols(result)).toEqual(['Fira privada']);
  // El compte privat no s'ha tornat a demanar: ni el seu període ni la seua sessió han canviat.
  expect(fetchImpl.mock.calls.filter(([url]) => new URL(url).pathname.includes('/primary/'))).toHaveLength(1);
  await act(async () => reconnexio.resol(resposta([])));
  expect(titols(result)).toEqual(['Fira privada']);
});

test('un refresc del mateix compte i la mateixa sessió (canviar de període, tornar a provar) sí que conserva les entrades mentre carrega', async () => {
  const refresc = pendent();
  const fetchImpl = vi.fn()
    .mockResolvedValueOnce(resposta([acte('fira', 'Fira de tardor')]))
    .mockImplementationOnce(() => refresc.promesa);
  const { result, rerender } = renderHook(({ periode }) => useFontsCalendari(periode, { config, fetchImpl }), { initialProps: { periode: rang } });
  act(() => desaToken('', { token: 'ya29.synthetic-a', caduca: caduca() }));
  await waitFor(() => expect(titols(result)).toEqual(['Fira de tardor']));
  rerender({ periode: NOVEMBRE });
  await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
  // Cap parpelleig dins de la mateixa sessió: la graella només en pinta les del període que es veu.
  expect(titols(result)).toEqual(['Fira de tardor']);
  await act(async () => refresc.resol(resposta([acte('magosta', 'Magosta', '2026-11-07')])));
  expect(titols(result)).toEqual(['Magosta']);
});

/* Deixa sentida la identitat «ningú» al mòdul de la sessió: les proves de davall no envien cap avís.
   Revisió adversarial (regressio-01) · Abans connectava sense que el mòdul
   sabera qui havia entrat i esperava MOTIU_IDENTITAT: és el missatge fals que
   s'ha corregit (amb la identitat desconeguda, el motiu és el neutre). Ara la
   persona entra primer, que és l'escenari que el títol descriu: qui ix és qui
   havia entrat, i «Ha canviat qui ha entrat» és cert. */
test('eixir de Sóc de Poble (sdp:auth-change sense persona) amaga a l’instant les entrades i avorta la consulta en curs', async () => {
  const lenta = pendent();
  const senyals = [];
  const fetchImpl = vi.fn((url, { signal }) => {
    senyals.push(signal);
    return senyals.length === 1 ? Promise.resolve(resposta([acte('fira', 'Fira de tardor')])) : lenta.promesa;
  });
  act(() => { window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: { id: 'persona-sintetica' } } })); });
  const { result, rerender } = renderHook(({ periode }) => useFontsCalendari(periode, { config, fetchImpl }), { initialProps: { periode: rang } });
  act(() => desaToken('', { token: 'ya29.synthetic-a', caduca: caduca() }));
  await waitFor(() => expect(titols(result)).toEqual(['Fira de tardor']));
  rerender({ periode: NOVEMBRE });
  await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
  act(() => { window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: null } })); });
  expect(titols(result)).toEqual([]);
  expect(result.current.comptes[0]).toMatchObject({ fase: 'desconnectat', error: { tipus: 'SENSE_AUTORITZACIO', missatge: MOTIU_IDENTITAT } });
  expect(senyals[1].aborted).toBe(true);
  await act(async () => lenta.resol(resposta([acte('tard', 'Resposta tardana')])));
  expect(titols(result)).toEqual([]);
});

test('una sessió nova mai reutilitza la versió d’una altra, ni després d’oblidar-ho tot', () => {
  desaToken('', { token: 'ya29.synthetic-a', caduca: caduca() });
  const connectat = estatDelCompte(instantania(), '').versio;
  oblidaTot();
  desaToken('', { token: 'ya29.synthetic-b', caduca: caduca() });
  expect(estatDelCompte(instantania(), '').versio).toBeGreaterThan(connectat);
});
