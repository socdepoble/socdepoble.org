/* IDEA-61 · Prova del camí sencer de publicació universal amb sessió.
   Les peces ja tenen proves soltes (contingutLocal.publicacioR56.test.js,
   adaptadorLocal.publicacioUniversal.test.js, NotesContext.ambit.test.jsx,
   SeccioVertical.test.jsx, MercatSection.tancat.test.jsx). Esta les encadena
   sense cap doble del port ni del Mur: l'adaptador local real, amb una sessió
   desada (desaSessio), instal·lat al port real (setBackendImplementation); el
   MurProvider real; i la vertical real (SeccioVertical o MercatSection).
   Per a cada àmbit (mercat, vehicle, treball, habitatge): una sola fila
   publicada amb useMur().sendSectionSubmission (el descriptor de sempre, sense
   noteId ni operationId), que passa pels quatre estats amb canviaEstat. En
   cada estat: una sola fila al Mur o al Mercat, perAmbit la troba, la vertical
   la pinta (menys 'tancat') i les facetes d'EspaiCerca porten tipus:<àmbit> i
   estat:<estat>. Cap console.error ni console.warn, i cap crida a la xarxa.
   Límit que queda escrit (cas de frontera): publicar des del Bloc
   (publishNote) en mode 'local' rebutja amb ErrorPublicacio(motiuModeLocal);
   eixe pas és només remot i el prova el Mestre amb una sessió real.
   Només es substituïxen l'espera de l'amfitrió, la sessió i la identitat de
   React, la recàrrega externa i, per a pintar les seccions, el router, els
   avisos, l'i18n i el SEO (el patró de MurContext.test.jsx i de les proves de
   les verticals). */
import React from 'react';
import { act, cleanup, render, renderHook, waitFor } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

const OWNER = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const TENANT = '3c4d5e6f-7a8b-4c9d-8e0f-1a2b3c4d5e6f';
const estat = vi.hoisted(() => ({ notesConfig: null }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('../../app/contexts/SessionContext.jsx', async (original) => {
  const sessio = Object.freeze({ currentUser: { id: '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5' }, generacio: 1 });
  return { ...await original(), useSession: () => sessio, useSessioOpcional: () => sessio };
});
vi.mock('../../app/contexts/IdentitatContext.jsx', () => {
  const id = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
  const identitat = Object.freeze({ actorId: id, actorKey: id, actor: { tipus: 'persona', id }, memberships: [] });
  return { useIdentitat: () => identitat };
});
vi.mock('../../app/contexts/useRecarregaExterna.jsx', () => ({ useRecarregaExterna: () => {} }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => () => {},
  useSearchParams: () => [new URLSearchParams(), () => {}],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../app/contexts/UIContext', async (original) => ({ ...await original(),
  useUIActions: () => ({ t: (_clau, reserva) => reserva, normalizeSearchText: (text) => text }),
  useUIState: () => ({ locale: 'ca', externalConfig: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
/* Només per al cas de frontera: el Bloc amb les dades d'un node local. */
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({
  notes: [], noteFolders: [], scopeKey: 'local', workspaceKey: 'local', config: estat.notesConfig, status: 'ready',
  notesComplete: true, canCreate: true, updateNote: async () => { throw new Error('No s’havia de desar res.'); },
  confirmaPublicacioNota: async () => {}, resolveNote: async () => ({ status: 'not-found' }), mouNota: async () => {}, esborraNota: async () => {}
}) }));

import { setBackendImplementation } from '../backendPort.js';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { esperaLaIAIA, reiniciaLocalXat } from '../localXat.js';
import { creaAdaptadorLocal } from './adaptadorLocal.js';
import { MurProvider, useMur } from '../../sections/mur/MurContext';
import SeccioVertical from '../../sections/verticals/SeccioVertical.jsx';
import MercatSection from '../../sections/mercat/MercatSection.jsx';
import { NotesProvider, useNotes } from '../../sections/notes/NotesContext';
import { ErrorPublicacio, MOTIU_LOCAL, motiuModeLocal } from '../../sections/notes/visibilitatNota.js';
import { ESTATS, canviaEstat, esVisibleALaLlista, perAmbit, projeccioPayload, seccioDAmbit } from '../../utils/publicacioUniversal.js';
import { deProducte, dePublicacio } from '../../sections/search/indexCerca.js';
import { facetesDeLEntrada } from '../../sections/search/facetesCerca.js';

const ARA = new Date('2026-11-18T18:00:00.000Z');
const xarxa = vi.fn(() => { throw new Error('XARXA_PROHIBIDA'); });
let adaptador;
let errors;
let avisos;

beforeAll(() => {
  vi.stubGlobal('fetch', xarxa);
  reiniciaLocalXat();
  errors = vi.spyOn(console, 'error');
  avisos = vi.spyOn(console, 'warn');
  adaptador = creaAdaptadorLocal({ mode: 'local', tenantId: TENANT, ara: () => new Date(ARA) });
  setBackendImplementation(adaptador, true);
  configuraBackendSessio(adaptador.configuracio);
  expect(desaSessio({ access_token: 'testimoni-opac-local', user: { id: OWNER, email: 'proves@poble.invalid', user_metadata: {} } })).toBe(true);
});
afterEach(cleanup);
afterAll(async () => {
  expect(errors).not.toHaveBeenCalled();
  expect(avisos).not.toHaveBeenCalled();
  expect(xarxa).not.toHaveBeenCalled();
  await esperaLaIAIA();
  reiniciaLocalXat();
  await adaptador.destroy();
  esborraSessio({ abast: 'tot' });
  errors.mockRestore();
  avisos.mockRestore();
  vi.unstubAllGlobals();
});

/* Els camps de cada àmbit, com els envia l'editor (projeccioPayload els normalitza). */
const FITXES = {
  mercat: { id: '6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c01', titol: 'Oli de la collita', dades: { preu: '12 €', unitat: 'litre', categoria: 'Oli d’oliva' } },
  vehicle: { id: '6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c02', titol: 'Viatge a Alcoi', dades: { modalitat: 'oferisc_places', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-25', places: '3', aportacio: '5 €' } },
  treball: { id: '6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c03', titol: 'Es busca forner', dades: { modalitat: 'oferta_feina', ofici: 'Forn' } },
  habitatge: { id: '6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c04', titol: 'Casa de poble en lloguer', dades: { modalitat: 'lloguer', preu: '350 €' } }
};
const payloadDe = (ambit) => projeccioPayload({
  sectionId: seccioDAmbit(ambit), title: FITXES[ambit].titol, subtitle: '', description: '', content: '<p>Cos</p>',
  copyright: '', image: '', labels: [], author_name: 'Pepa', ambit, estat: 'disponible', dades: FITXES[ambit].dades
});
const Vista = ({ ambit }) => (ambit === 'mercat' ? <MercatSection /> : <SeccioVertical ambit={ambit} />);
/* Les targetes pintades a la graella de la secció que porten el títol. */
const targetesAmb = (titol) => [...document.querySelectorAll('.sdp-card-grid > *')].filter((node) => node.textContent.includes(titol));

describe('IDEA-61 · el camí sencer amb sessió: port real, adaptador local, Mur real i vertical real', () => {
  test.each(['mercat', 'vehicle', 'treball', 'habitatge'])('%s: una fila, quatre estats, la vertical i les facetes de la Cerca', async (ambit) => {
    const { id, titol } = FITXES[ambit];
    const viu = { mur: null };
    const Sonda = () => { viu.mur = useMur(); return null; };
    render(<MurProvider config={adaptador.configuracio}><Sonda /><Vista ambit={ambit} /></MurProvider>);
    await waitFor(() => expect(viu.mur.status).toBe('ready'));

    const payload = payloadDe(ambit);
    const sectionId = seccioDAmbit(ambit);
    await act(async () => { await viu.mur.sendSectionSubmission({ id, sectionId, payload }); });

    for (const estatNou of ESTATS) {
      await act(async () => { await viu.mur.sendSectionSubmission({ id, sectionId, payload: canviaEstat(payload, estatNou) }); });
      await act(async () => { viu.mur.refresh(); });
      await waitFor(() => expect([...viu.mur.feedPosts, ...viu.mur.marketItems].find((fila) => fila.id === id)?.estat).toBe(estatNou));

      const files = [...viu.mur.feedPosts, ...viu.mur.marketItems].filter((fila) => fila.id === id);
      expect(files).toHaveLength(1);
      const [fila] = perAmbit(files, ambit);
      expect(fila).toMatchObject({ id, ambit, estat: estatNou, title: titol, ownerUserId: OWNER });
      expect((ambit === 'mercat' ? viu.mur.marketItems : viu.mur.feedPosts).map((element) => element.id)).toContain(id);
      expect(esVisibleALaLlista(fila)).toBe(estatNou !== 'tancat');

      await waitFor(() => expect(targetesAmb(titol)).toHaveLength(estatNou === 'tancat' ? 0 : 1));

      const entrada = ambit === 'mercat' ? deProducte(fila) : dePublicacio(fila);
      expect(facetesDeLEntrada(entrada, { ara: ARA.getTime() })).toEqual(expect.arrayContaining([`tipus:${ambit}`, `estat:${estatNou}`]));
    }

    /* A l'adaptador mateix: una sola fila (cap duplicat), tancada però encara viva. */
    const { feedPosts, marketItems } = await adaptador.loadMur(OWNER, {});
    expect(perAmbit([...feedPosts, ...marketItems].filter((fila) => fila.id === id), ambit).map((fila) => fila.estat)).toEqual(['tancat']);
  });
});

describe('IDEA-61 · frontera: el pas del Bloc és només remot', () => {
  test('publishNote en mode local rebutja amb ErrorPublicacio(motiuModeLocal) i no escriu cap fila', async () => {
    estat.notesConfig = adaptador.configuracio;
    expect(estat.notesConfig.dataMode).toBe('local');
    const abans = await adaptador.loadMur(OWNER, {});
    const wrapper = ({ children }) => <MurProvider config={adaptador.configuracio}><NotesProvider>{children}</NotesProvider></MurProvider>;
    const { result } = renderHook(useNotes, { wrapper });
    const nota = { id: 'nota-local', title: 'Viatge des del Bloc', content: '<p>Cos</p>', revision: 1, fitxa: { ambit: 'vehicle', estat: 'disponible', dades: FITXES.vehicle.dades } };
    let rebuig;
    await act(async () => { rebuig = await result.current.publishNote(nota).catch((error) => error); });
    expect(rebuig).toBeInstanceOf(ErrorPublicacio);
    expect(rebuig.message).toBe(motiuModeLocal());
    expect(rebuig.message).toBe(MOTIU_LOCAL);
    expect(await adaptador.loadMur(OWNER, {})).toEqual(abans);
  });
});
