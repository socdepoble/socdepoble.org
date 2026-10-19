import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* Pla 261018_1605 (Tasca 4, D8; ordre del Mestre, 18-10-2026) · «Multimèdia»
   de veres: les fotos del servidor de fitxers (llistaElsMeusMitjans, la
   capacitat 'mitjansPropis'), l'avatar i la capçalera actius, la foto de
   Google de la sessió i, per al compte de Javi, la canònica. Esborra pel port
   (esborraElMeuMitja), mai l'activa. Expectativa actualitzada a propòsit: la
   primera passada (MultimediaContext, el reconeixement pel nom i la
   «biblioteca» del navegador) ja no hi és, i cap fixació porta
   `visibility: 'public'` (D1). */
const m = vi.hoisted(() => ({
  perfil: null,
  pagina: null,
  caps: new Set(),
  mode: 'remote',
  llista: null,
  esborra: null,
  mediaItems: [],
  /* Correcció F2 de la revisió · un port que no sap resoldre (la URL firmada
     que falla torna la referència tal qual, storage.js); null, el de sempre. */
  resol: null,
}));

vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => m.caps.has(cap),
  getRuntimeDataMode: () => m.mode,
  llistaElsMeusMitjans: (...args) => m.llista(...args),
  esborraElMeuMitja: (...args) => m.esborra(...args),
}));
/* Un hook per cel·la: la referència opaca es «resol» a una URL de prova. */
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => (m.resol ? m.resol(ref)
    : ref ? `https://fitxers.test/${ref.replace('sdp-media://', '')}` : ''),
}));
vi.mock('../../config/assetResolver.js', () => ({ resolRecursPropi: (src) => src }));
/* L'Arxiu visual (useMultimedia). Ordre del Mestre (18-10-2026, relleu del Pla
   2000, punt 3) · Expectativa actualitzada a propòsit: «Multimèdia» hi torna a
   llegir, però només els elements amb titular EXPLÍCIT; una foto d'algú que es
   diu igual continua fora. */
vi.mock('../multimedia/MultimediaContext.jsx', () => ({
  useMultimedia: () => ({ status: 'ready', mediaItems: m.mediaItems }),
}));
/* El visor de l'Arxiu (VisorDeLArxiu) llig els textos, el poble i la ruta. */
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useLocation: () => ({ pathname: '/el-meu-perfil', search: '', state: null, hash: '' }),
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));
vi.mock('./PerfilContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  usePerfilOpcional: () => m.perfil,
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => {
    m.pagina = props;
    const { title, lead, topBarData, children } = props;
    return (
      <main>
        <header className="page-title"><h1>{title}</h1></header>
        <p>{lead}</p>
        <p data-testid="barra-autor">{`${topBarData?.authorName || ''} · ${topBarData?.authorLocation || ''}`}</p>
        {children}
      </main>
    );
  },
}));

import {
  AVIS_SENSE_INTEGRITAT, DetallMultimedia, LIMIT_MINIATURES, MOTIU_SENSE_INTEGRITAT, arxiuDeLActor, clauDeFont, construeixGaleria,
  fotesDelText, fotoGoogleDeLaSessio, idsDeLActor, imatgesDeLaPresentacio, textosDeMultimedia, titolDeLaPujada, titularDelMitja,
} from './DetallMultimedia.jsx';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ENTITAT_PILOT_ID, IAIA_ID, PERSONA_PILOT } from '../../data/identitatsSeed.js';
import { oblidaMetadades } from '../multimedia/useMetadadesFoto.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';
import { elementDeFilaPublicada, mergeById } from '../../data/mapejadorSeccions.js';

/* Correcció F2 de la revisió · La miniatura pinta la URL del port només si és
   dels nostres (esFontImatgePropia): l'origen del servidor de fitxers de
   prova es registra com el del Supabase (data/supabase/runtime.js). */
permetOrigenMitjans('https://fitxers.test');

const UID = '99999999-8888-4777-8666-555555555555';
const TENANT = '11111111-2222-4333-8444-555555555555';
const CONFIG = Object.freeze({ tenantId: TENANT, backendId: 'supabase' });
const FOTO_GOOGLE = 'https://lh3.googleusercontent.com/a/foto-google=s96-c';
const ref = (nom) => `sdp-media://mitjans/${TENANT}/${UID}/avatars/${nom}`;
const mitja = (nom, extra = {}) => ({
  ref: ref(nom), ruta: `${TENANT}/${UID}/avatars/${nom}`, nom, carpeta: 'avatars',
  creat: '2026-10-01T10:00:00Z', mida: 1000, etag: `etag-${nom}`, tipus: 'image/webp', esborrable: true, ...extra,
});

const pep = (dades = {}) => ({
  id: 'jo', mena: 'persona', nom: 'Pep', avatar: '',
  dades: { id: UID, full_name: 'Pep', town_name: 'La Torre de les Maçanes', is_public: true, visibility: 'private', ...dades },
});
const usuariDePep = (extra = {}) => ({ id: UID, email: 'pep@poble.test', user_metadata: {}, ...extra });

let identitat;
function pinta(props = {}) {
  return render(<DetallMultimedia identitat={identitat} config={CONFIG} {...props} />);
}
const graella = () => screen.getByRole('list', { name: 'Les teues fotos' });
const targetaDe = (titol) => within(graella()).getByText(titol).closest('li');
const titols = () => within(graella()).getAllByRole('listitem').map((li) => li.querySelector('.perfil-multimedia__titol').textContent);
/* Correcció de la revisió · El títol d'una foto pujada és la data, no el nom
   del fitxer: les proves la troben pel fitxer de la seua miniatura. */
const fitxerDe = (li) => {
  const src = li.querySelector('img')?.getAttribute('src') || '';
  return src.startsWith('https://fitxers.test/') ? src.split('/').pop() : li.querySelector('.perfil-multimedia__titol').textContent;
};
const fitxers = () => within(graella()).getAllByRole('listitem').map(fitxerDe);
const targetaDeFitxer = (nom) => within(graella()).getAllByRole('listitem').find((li) => fitxerDe(li) === nom);
const esperaFitxer = (nom) => waitFor(() => expect(targetaDeFitxer(nom)).toBeTruthy());
const idsDescrits = (boto) => (boto.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);

beforeEach(() => {
  /* El visor llig l'EXIF de la foto oberta: cap xarxa a les proves. */
  oblidaMetadades();
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
  m.pagina = null;
  /* Ordre del Mestre (18-10-2026) · Les proves d'esborrat modelen el port amb
     la comprovació d'ús ('integritatMitjans'); la porta tancada, sense ella, té
     la seua pròpia prova («sense la comprovació d'ús del servidor…»). */
  m.caps = new Set(['mitjans', 'mitjansPropis', 'integritatMitjans']);
  m.mode = 'remote';
  m.llista = vi.fn(async () => []);
  m.esborra = vi.fn(async () => undefined);
  m.mediaItems = [];
  m.resol = null;
  identitat = pep();
  m.perfil = {
    usuari: usuariDePep(),
    identitats: [identitat],
    guardarCampPerfil: vi.fn(async () => undefined),
    autodesament: null,
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Pla 261018_1605 · Tasca 4 · les fonts de la galeria', () => {
  test('les fotos del servidor de fitxers es veuen en l’ordre del port, i la llista es demana amb la configuració del Perfil', async () => {
    m.llista.mockResolvedValue([mitja('nova.webp', { creat: '2026-10-10T10:00:00Z' }), mitja('vella.webp')]);
    pinta();
    await esperaFitxer('nova.webp');
    expect(m.llista).toHaveBeenCalledTimes(1);
    expect(m.llista).toHaveBeenCalledWith(CONFIG);
    expect(fitxers()).toEqual(['nova.webp', 'vella.webp']);
    // Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 4 · el títol és la data, mai el nom del fitxer.
    expect(titols()).toEqual(['Foto pujada el 10-10-2026', 'Foto pujada el 01-10-2026']);
    const img = targetaDeFitxer('nova.webp').querySelector('img');
    expect(img.getAttribute('src')).toBe(`https://fitxers.test/mitjans/${TENANT}/${UID}/avatars/nova.webp`);
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.hasAttribute('referrerpolicy')).toBe(false);
    // Les esborrables porten «Elimina».
    expect(within(targetaDeFitxer('vella.webp')).getByRole('button', { name: 'Elimina' }).disabled).toBe(false);
    expect(screen.getByRole('heading', { level: 1, name: 'Multimèdia' })).toBeTruthy();
    expect(screen.getByTestId('barra-autor').textContent).toBe('Pep · La Torre de les Maçanes');
  });

  test('la foto de Google de la sessió es diu com a tal, es carrega sense referent i no s’esborra', async () => {
    m.perfil.usuari = usuariDePep({
      identities: [{ provider: 'google', identity_data: { avatar_url: FOTO_GOOGLE, email: 'pep@poble.test' } }],
    });
    m.llista.mockResolvedValue([mitja('propia.webp')]);
    pinta();
    await esperaFitxer('propia.webp');
    const targeta = targetaDe('Foto del compte de Google');
    const img = targeta.querySelector('img');
    expect(img.getAttribute('src')).toBe(FOTO_GOOGLE);
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(within(targeta).getByText('De Google')).toBeTruthy();
    expect(within(targeta).queryByRole('button', { name: 'Elimina' })).toBeNull();
    expect(within(targeta).getByRole('button', { name: 'Posa com a avatar' }).disabled).toBe(false);
  });

  test('sense identitat de Google, la de user_metadata.picture; una foto que no és d’un proveïdor d’entrada, cap', () => {
    expect(fotoGoogleDeLaSessio({ user_metadata: { picture: FOTO_GOOGLE } })).toBe(FOTO_GOOGLE);
    expect(fotoGoogleDeLaSessio({
      identities: [{ provider: 'google', identity_data: { picture: 'https://lh5.googleusercontent.com/b' } }],
      user_metadata: { picture: FOTO_GOOGLE },
    })).toBe('https://lh5.googleusercontent.com/b');
    expect(fotoGoogleDeLaSessio({ user_metadata: { picture: 'https://fora.example/foto.jpg' } })).toBe('');
    expect(fotoGoogleDeLaSessio(null)).toBe('');
  });

  /* Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 4 (correcció de
     la revisió) · La llavor i el mode local corren sobre el mateix adaptador,
     que porta la capacitat i hi torna []: el que diu que no hi ha servidor és
     el mode de dades. Esta prova és la d'un port sense la capacitat. */
  test('sense la capacitat (un port sense biblioteca): cap crida al port, i només les fotos de la fitxa', () => {
    m.caps = new Set(['mitjans']);
    identitat = pep({ avatar_url: '/assets/fotos/pep.jpg', hero_url: 'data:image/png;base64,AAAA' });
    m.perfil.identitats = [identitat];
    pinta();
    expect(m.llista).not.toHaveBeenCalled();
    expect(titols()).toEqual(['Foto de perfil actual', 'Capçalera actual']);
    expect(targetaDe('Foto de perfil actual').querySelector('img').getAttribute('src')).toBe('/assets/fotos/pep.jpg');
    expect(screen.getByText('En este mode no hi ha servidor de fitxers: es veuen les fotos de la fitxa.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Elimina' })).toBeNull();
  });

  test('la llavor (capacitat present, mode seed) i el mode local: cap crida, cap «Carregant» i l’explicació', () => {
    for (const mode of ['seed', 'local']) {
      m.mode = mode;
      pinta();
      expect(m.llista).not.toHaveBeenCalled();
      expect(screen.queryByText('Carregant les teues fotos…')).toBeNull();
      expect(screen.getByText('En este mode no hi ha servidor de fitxers: es veuen les fotos de la fitxa.')).toBeTruthy();
      expect(screen.getByText('Encara no tens cap foto.')).toBeTruthy();
      expect(screen.queryByRole('button', { name: 'Elimina' })).toBeNull();
      cleanup();
    }
  });

  test('mentre es llig la llista, «Carregant…» i mai «Encara no tens cap foto.»', async () => {
    let resol;
    m.llista.mockImplementation(() => new Promise((r) => { resol = r; }));
    pinta();
    expect(screen.getByRole('status').textContent).toBe('Carregant les teues fotos…');
    await waitFor(() => expect(m.llista).toHaveBeenCalled());
    expect(screen.queryByText('Encara no tens cap foto.')).toBeNull();
    expect(screen.queryByText('En este mode no hi ha servidor de fitxers: es veuen les fotos de la fitxa.')).toBeNull();
    await act(async () => { resol([]); });
    expect(screen.getByText('Encara no tens cap foto.')).toBeTruthy();
    expect(screen.queryByText('Carregant les teues fotos…')).toBeNull();
  });

  test('si la llista falla, es diu en línia i les fotos de la fitxa continuen', async () => {
    m.llista.mockRejectedValue(new Error('No s’ha pogut llegir la teua biblioteca de fotos: el servidor no t’ho ha permés.'));
    identitat = pep({ avatar_url: '/assets/fotos/pep.jpg' });
    m.perfil.identitats = [identitat];
    pinta();
    expect((await screen.findByRole('alert')).textContent).toBe('No s’ha pogut llegir la teua biblioteca de fotos: el servidor no t’ho ha permés.');
    expect(titols()).toEqual(['Foto de perfil actual']);
  });

  test('si la llista falla i la fitxa no té cap foto, només l’error: no «Encara no tens cap foto.»', async () => {
    m.llista.mockRejectedValue(new Error('Sense xarxa'));
    pinta();
    expect((await screen.findByRole('alert')).textContent).toBe('Sense xarxa');
    expect(screen.queryByText('Encara no tens cap foto.')).toBeNull();
  });

  test('mai pel nom: una foto d’algú que es diu igual no hi és, i la canònica de Javi només per al seu compte', async () => {
    m.mediaItems = [{ id: 'x', src: '/assets/fotos/de-l-altre.jpg', title: 'Foto del tocayo', source: 'Javi Llinares' }];
    identitat = { id: 'jo', mena: 'persona', nom: 'Javi Llinares', avatar: '', dades: { id: UID, full_name: 'Javi Llinares', email: 'altre@poble.test' } };
    m.perfil.identitats = [identitat];
    m.perfil.usuari = usuariDePep({ email: 'altre@poble.test', user_metadata: { full_name: 'Javi Llinares' } });
    pinta();
    await waitFor(() => expect(m.llista).toHaveBeenCalled());
    expect(screen.queryByText('Foto del tocayo')).toBeNull();
    expect(screen.queryByText('Foto canònica del perfil')).toBeNull();
    expect(screen.getByText('Encara no tens cap foto.')).toBeTruthy();
    cleanup();
    // El compte de Javi (el correu confirmat del seu compte remot): la canònica, sense «Elimina».
    m.perfil.usuari = {
      id: UID, email: 'socdepoblecom@gmail.com', email_confirmed_at: '2026-10-01T00:00:00Z', aud: 'authenticated',
      app_metadata: { provider: 'email' }, user_metadata: {},
    };
    pinta();
    const targeta = await screen.findByText('Foto canònica del perfil').then((t) => t.closest('li'));
    expect(targeta.querySelector('img').getAttribute('src')).toBe(PERSONA_PILOT.avatar);
    expect(within(targeta).queryByRole('button', { name: 'Elimina' })).toBeNull();
    /* I el codi no compara cap nom ni cap correu de l'Arxiu, ni té biblioteca al navegador.
       Expectativa actualitzada a propòsit: relleu del Pla 2000, punt 3 · l'Arxiu visual hi torna
       (useMultimedia), però només per identificador explícit (titularDelMitja). */
    const codi = readFileSync(resolve(process.cwd(), 'src/sections/profile/DetallMultimedia.jsx'), 'utf8');
    expect(codi).not.toMatch(/getVal|setVal|\.source\b|\.author_name\b|\.email\b|\.title\s*===|\.nom\s*===/);
  });

  /* Pla 261018_1605 (Tasca 0, D7; integració) · PerfilContext copia a
     dades.email el correu de la sessió encara que GoTrue no l'haja confirmat:
     el correu només compta amb l'usuari de sessió sencer. */
  test('el correu de Javi sense confirmar (a la sessió i copiat a la fila): cap foto canònica', async () => {
    identitat = pep({ email: 'socdepoblecom@gmail.com' });
    m.perfil.identitats = [identitat];
    m.perfil.usuari = {
      id: UID, email: 'socdepoblecom@gmail.com', aud: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {},
    };
    pinta();
    await waitFor(() => expect(m.llista).toHaveBeenCalled());
    expect(screen.queryByText('Foto canònica del perfil')).toBeNull();
  });
});

describe('Pla 261018_1605 · Tasca 4 · duplicats i esborrat', () => {
  test('«Eliminar duplicats» esborra pel port només les còpies sobreres (es conserva la més antiga), amb confirmació', async () => {
    m.llista.mockResolvedValue([
      mitja('copia-nova.webp', { etag: 'mateix', mida: 2048, creat: '2026-10-12T10:00:00Z' }),
      mitja('altra.webp', { etag: 'altre', mida: 2048, creat: '2026-10-11T10:00:00Z' }),
      mitja('original.webp', { etag: 'mateix', mida: 2048, creat: '2026-10-02T10:00:00Z' }),
      // Una còpia del llegat: el port no la deixa esborrar.
      mitja('llegat.webp', { etag: 'mateix', mida: 2048, creat: '2026-10-05T10:00:00Z', esborrable: false }),
    ]);
    pinta();
    await esperaFitxer('copia-nova.webp');
    expect(within(targetaDeFitxer('copia-nova.webp')).getByText('Còpia repetida')).toBeTruthy();
    expect(within(targetaDeFitxer('original.webp')).queryByText('Còpia repetida')).toBeNull();
    /* Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 4 (correcció
       de la revisió) · La insígnia només en una còpia que «Eliminar duplicats»
       esborraria: així el compte de «Tens N…» i les insígnies diuen el mateix. */
    expect(within(targetaDeFitxer('llegat.webp')).queryByText('Còpia repetida')).toBeNull();
    expect(within(graella()).getAllByText('Còpia repetida')).toHaveLength(1);
    expect(screen.getByText(/Tens 1 còpia repetida d’una foto que ja tens/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar duplicats' }));
    const dialeg = screen.getByRole('dialog', { name: 'Vols eliminar les còpies repetides?' });
    // Una sola còpia: el verb, en singular.
    expect(within(dialeg).getByText(/^S’esborrarà 1 còpia del servidor de fitxers i no es podrà recuperar\./)).toBeTruthy();
    expect(within(dialeg).getByRole('button', { name: 'Cancel·lar' }).hasAttribute('data-sdp-focus-inicial')).toBe(true);
    expect(m.esborra).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Eliminar duplicats' })); });
    expect(m.esborra).toHaveBeenCalledTimes(1);
    expect(m.esborra).toHaveBeenCalledWith(ref('copia-nova.webp'), CONFIG);
    expect(targetaDeFitxer('copia-nova.webp')).toBeUndefined();
    expect(fitxers()).toEqual(['altra.webp', 'original.webp', 'llegat.webp']);
    expect(screen.getByRole('status').textContent).toBe('S’ha eliminat 1 còpia repetida.');
    expect(screen.queryByRole('button', { name: 'Eliminar duplicats' })).toBeNull();
    // El Bloc dels duplicats ja no hi és: el focus, a la llista.
    expect(document.activeElement).toBe(graella());
  });

  test('còpies de diverses fotos: el text en plural i el diàleg també', async () => {
    m.llista.mockResolvedValue([
      mitja('a2.webp', { etag: 'a', mida: 1, creat: '2026-10-12T10:00:00Z' }),
      mitja('a1.webp', { etag: 'a', mida: 1, creat: '2026-10-02T10:00:00Z' }),
      mitja('b2.webp', { etag: 'b', mida: 1, creat: '2026-10-12T10:00:00Z' }),
      mitja('b1.webp', { etag: 'b', mida: 1, creat: '2026-10-02T10:00:00Z' }),
    ]);
    pinta();
    await esperaFitxer('a2.webp');
    expect(screen.getByText(/^Tens 2 còpies repetides de 2 fotos que ja tens\./)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar duplicats' }));
    expect(within(screen.getByRole('dialog')).getByText(/^S’esborraran 2 còpies del servidor de fitxers i no es podran recuperar\./)).toBeTruthy();
  });

  test('si en «Eliminar duplicats» una còpia falla, es diu quantes s’han eliminat i la que falla continua', async () => {
    m.llista.mockResolvedValue([
      mitja('c3.webp', { etag: 'c', mida: 1, creat: '2026-10-12T10:00:00Z' }),
      mitja('c2.webp', { etag: 'c', mida: 1, creat: '2026-10-11T10:00:00Z' }),
      mitja('c1.webp', { etag: 'c', mida: 1, creat: '2026-10-02T10:00:00Z' }),
    ]);
    m.esborra.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('El servidor no t’ho ha permés.'));
    pinta();
    await esperaFitxer('c3.webp');
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar duplicats' }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar duplicats' })); });
    expect(m.esborra).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('alert').textContent).toBe('S’ha eliminat 1 foto, però no totes. El servidor no t’ho ha permés.');
    expect(fitxers()).toEqual(['c2.webp', 'c1.webp']);
  });

  test('si una de les còpies és l’avatar actiu, es conserva l’activa i s’esborra l’altra', () => {
    const nova = mitja('nova.webp', { etag: 'e', mida: 9, creat: '2026-10-12T10:00:00Z' });
    const vella = mitja('vella.webp', { etag: 'e', mida: 9, creat: '2026-10-01T10:00:00Z' });
    const { fotos, sobreres } = construeixGaleria({ mitjans: [nova, vella], avatar: nova.ref });
    expect(sobreres.map((e) => e.ref)).toEqual([vella.ref]);
    expect(fotos.map((e) => [e.ref, e.avatarActiu, e.duplicat])).toEqual([[nova.ref, true, false], [vella.ref, false, true]]);
    // La mateixa font (sense la consulta) és una sola foto, no dues.
    expect(construeixGaleria({ avatar: '/assets/fotos/a.jpg?v=2', canonica: '/assets/fotos/a.jpg' }).fotos).toHaveLength(1);
    expect(clauDeFont(' SDP-MEDIA://mitjans/A.webp#x ')).toBe('sdp-media://mitjans/a.webp');
  });

  /* Correcció de la revisió · L'avatar desat a la fila (el que veu el veïnat)
     i el de l'esborrany de la cua, amb el mateix contingut: es conserven els
     dos, i cap no és una còpia sobrera. */
  test('una protegida (la desada) i l’activa de l’esborrany amb el mateix contingut: es conserven totes dues', () => {
    const desada = mitja('desada.webp', { etag: 'e', mida: 9, creat: '2026-10-01T10:00:00Z' });
    const nova = mitja('nova.webp', { etag: 'e', mida: 9, creat: '2026-10-12T10:00:00Z' });
    const vella = mitja('vella.webp', { etag: 'e', mida: 9, creat: '2026-09-01T10:00:00Z' });
    const { fotos, sobreres, grupsRepetits } = construeixGaleria({ mitjans: [nova, desada, vella], avatar: nova.ref, protegides: [desada.ref] });
    expect(sobreres.map((e) => e.ref)).toEqual([vella.ref]);
    expect(grupsRepetits).toBe(1);
    expect(fotos.find((e) => e.ref === desada.ref)).toMatchObject({ protegida: true, duplicat: false, avatarActiu: false });
  });

  test('una URL pública del Storage de `mitjans` és la mateixa foto que la seua referència opaca', () => {
    permetOrigenMitjans('https://projecte.supabase.co');
    const publica = `https://projecte.supabase.co/storage/v1/object/public/mitjans/${TENANT}/${UID}/avatars/A.webp?t=1`;
    expect(clauDeFont(publica)).toBe(`sdp-media://mitjans/${TENANT}/${UID}/avatars/a.webp`);
    // D'un origen que no és nostre, tal qual.
    expect(clauDeFont('https://fora.example/storage/v1/object/public/mitjans/x/y/avatars/a.webp')).toBe('https://fora.example/storage/v1/object/public/mitjans/x/y/avatars/a.webp');
    const copia = mitja('a.webp', { etag: 'e', mida: 9, creat: '2026-10-12T10:00:00Z' });
    const vella = mitja('vella.webp', { etag: 'e', mida: 9, creat: '2026-09-01T10:00:00Z' });
    const { fotos, sobreres } = construeixGaleria({ mitjans: [copia, vella], protegides: [publica] });
    expect(fotos.find((e) => e.ref === copia.ref).protegida).toBe(true);
    expect(sobreres.map((e) => e.ref)).toEqual([vella.ref]);
  });

  test('el títol d’una foto pujada és la seua data, mai el nom del fitxer', () => {
    expect(titolDeLaPujada('2026-10-12T10:00:00Z')).toBe('Foto pujada el 12-10-2026');
    expect(titolDeLaPujada(null)).toBe('Foto pujada');
    expect(titolDeLaPujada('brossa')).toBe('Foto pujada');
  });

  test('una foto amb nom de UUID: ni el títol ni el text alternatiu porten el UUID; els botons el lligen pel títol', async () => {
    const UUID_FITXER = '3f2a8c1e-7b4d-4e2a-9c1f-0a1b2c3d4ec9.webp';
    m.llista.mockResolvedValue([mitja(UUID_FITXER, { creat: '2026-10-12T10:00:00Z' })]);
    identitat = pep({ avatar_url: ref(UUID_FITXER) });
    m.perfil.identitats = [identitat];
    pinta();
    await esperaFitxer(UUID_FITXER);
    const targeta = targetaDeFitxer(UUID_FITXER);
    expect(targeta.textContent).not.toContain('3f2a8c1e');
    expect(targeta.textContent).not.toContain('.webp');
    expect(targeta.querySelector('img').getAttribute('alt')).toBe('');
    const titol = targeta.querySelector('.perfil-multimedia__titol');
    // També l'avatar actiu, si és una foto pujada.
    expect(titol.textContent).toBe('Foto pujada el 12-10-2026');
    for (const nom of ['Posa com a avatar', 'Posa com a capçalera', 'Elimina']) {
      expect(idsDescrits(within(targeta).getByRole('button', { name: nom }))[0]).toBe(titol.id);
    }
  });

  test('«Elimina» demana confirmació i esborra pel port; l’avatar actiu no es pot eliminar i diu per què', async () => {
    m.llista.mockResolvedValue([mitja('activa.webp'), mitja('una.webp')]);
    identitat = pep({ avatar_url: ref('activa.webp') });
    m.perfil.identitats = [identitat];
    pinta();
    await esperaFitxer('una.webp');
    const activa = targetaDeFitxer('activa.webp');
    expect(within(activa).getByText('Avatar actiu')).toBeTruthy();
    const botoActiva = within(activa).getByRole('button', { name: 'Elimina' });
    expect(botoActiva.disabled).toBe(true);
    // Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 4 · el botó llig el títol i el motiu.
    expect(document.getElementById(idsDescrits(botoActiva)[1]).textContent)
      .toBe('És el teu avatar: posa’n un altre abans d’eliminar-la.');
    expect(within(activa).getByRole('button', { name: 'Posa com a avatar' }).disabled).toBe(true);

    fireEvent.click(within(targetaDeFitxer('una.webp')).getByRole('button', { name: 'Elimina' }));
    const dialeg = screen.getByRole('dialog', { name: 'Vols eliminar esta foto?' });
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·lar' }));
    expect(m.esborra).not.toHaveBeenCalled();
    fireEvent.click(within(targetaDeFitxer('una.webp')).getByRole('button', { name: 'Elimina' }));
    await act(async () => {
      fireEvent.click(within(screen.getByRole('dialog', { name: 'Vols eliminar esta foto?' })).getByRole('button', { name: 'Elimina' }));
    });
    expect(m.esborra).toHaveBeenCalledTimes(1);
    expect(m.esborra).toHaveBeenCalledWith(ref('una.webp'), CONFIG);
    expect(fitxers()).toEqual(['activa.webp']);
    expect(screen.getByRole('status').textContent).toBe('S’ha eliminat la foto.');
    // La targeta que l'ha obert ja no hi és: el focus, a la llista.
    expect(document.activeElement).toBe(graella());
  });

  /* Revisió adversarial (18-10-2026) · Una foto que la presentació de la fitxa
     fa servir no es pot eliminar; i el diàleg avisa que una publicació antiga
     que la porte deixarà de vore-la. */
  test('una foto citada a la presentació no es pot eliminar, i el diàleg avisa de les publicacions', async () => {
    const publica = `https://fitxers.test/storage/v1/object/public/mitjans/${TENANT}/${UID}/avatars/publica.webp`;
    expect(fotesDelText(`<p>Hola</p><img src="${ref('cos.webp')}"><img src='${publica}'>`)).toEqual([ref('cos.webp'), publica]);
    expect(fotesDelText('<img src="https://fora.example/x.webp">')).toEqual([]);
    expect(fotesDelText(null)).toEqual([]);

    m.llista.mockResolvedValue([mitja('cos.webp'), mitja('lliure.webp')]);
    identitat = pep({ presentacio_html: `<p>Ma casa</p><img src="${ref('cos.webp')}">` });
    m.perfil.identitats = [identitat];
    pinta();
    await esperaFitxer('lliure.webp');
    const boto = within(targetaDeFitxer('cos.webp')).getByRole('button', { name: 'Elimina' });
    expect(boto.disabled).toBe(true);
    expect(document.getElementById(idsDescrits(boto)[1]).textContent)
      .toBe('La teua fitxa la fa servir (la foto o la presentació que veu el veïnat): no es pot eliminar mentre la tinga.');

    fireEvent.click(within(targetaDeFitxer('lliure.webp')).getByRole('button', { name: 'Elimina' }));
    const dialeg = screen.getByRole('dialog', { name: 'Vols eliminar esta foto?' });
    expect(within(dialeg).getByText(/Si l’havies posada en alguna publicació, allí deixarà de vore’s\./)).toBeTruthy();
  });

  /* Ordre del Mestre (18-10-2026, després de les auditories 2030) · Sense la
     capacitat 'integritatMitjans' ningú no sap si una publicació fa servir la
     foto: les còpies es veuen, però ni «Elimina» ni «Eliminar duplicats»
     esborren res, i ho diuen. Posar-la d'avatar continua igual. */
  test('sense la comprovació d’ús del servidor, cap esborrat: els botons, desactivats i explicats', async () => {
    m.caps = new Set(['mitjans', 'mitjansPropis']);
    const vella = mitja('vella.webp', { etag: 'mateix', creat: '2026-09-01T10:00:00Z' });
    const copia = mitja('copia.webp', { etag: 'mateix', creat: '2026-10-01T10:00:00Z' });
    m.llista.mockResolvedValue([copia, vella]);
    pinta();
    await esperaFitxer('copia.webp');

    const duplicats = screen.getByRole('button', { name: 'Eliminar duplicats' });
    expect(duplicats.disabled).toBe(true);
    expect(document.getElementById(idsDescrits(duplicats)[0]).textContent).toBe(AVIS_SENSE_INTEGRITAT);

    const elimina = within(targetaDeFitxer('vella.webp')).getByRole('button', { name: 'Elimina' });
    expect(elimina.disabled).toBe(true);
    expect(document.getElementById(idsDescrits(elimina)[1]).textContent).toBe(MOTIU_SENSE_INTEGRITAT);

    fireEvent.click(duplicats);
    fireEvent.click(elimina);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(m.esborra).not.toHaveBeenCalled();
    expect(within(targetaDeFitxer('vella.webp')).getByRole('button', { name: 'Posa com a avatar' }).disabled).toBe(false);
  });

  test('eliminar l’última foto: el focus, al text de buit', async () => {
    m.llista.mockResolvedValue([mitja('sola.webp')]);
    pinta();
    await esperaFitxer('sola.webp');
    fireEvent.click(screen.getByRole('button', { name: 'Elimina' }));
    await act(async () => {
      fireEvent.click(within(screen.getByRole('dialog', { name: 'Vols eliminar esta foto?' })).getByRole('button', { name: 'Elimina' }));
    });
    expect(document.activeElement).toBe(screen.getByText('Encara no tens cap foto.'));
  });

  test('si mentre es confirma la foto passa a ser l’avatar desat, no s’esborra i no es diu cap èxit', async () => {
    m.llista.mockResolvedValue([mitja('una.webp'), mitja('altra.webp')]);
    const { rerender } = pinta();
    await esperaFitxer('una.webp');
    fireEvent.click(within(targetaDeFitxer('una.webp')).getByRole('button', { name: 'Elimina' }));
    identitat = pep({ avatar_url: ref('una.webp') });
    m.perfil.identitats = [identitat];
    rerender(<DetallMultimedia identitat={identitat} config={CONFIG} />);
    await act(async () => {
      fireEvent.click(within(screen.getByRole('dialog', { name: 'Vols eliminar esta foto?' })).getByRole('button', { name: 'Elimina' }));
    });
    expect(m.esborra).not.toHaveBeenCalled();
    const avis = screen.getByRole('status');
    expect(avis.textContent).toBe('No s’ha eliminat cap foto.');
    expect(avis.className).not.toContain('exit');
  });

  test('si el port no l’esborra, l’error es diu en línia i la foto continua', async () => {
    m.llista.mockResolvedValue([mitja('una.webp')]);
    m.esborra.mockRejectedValue(new Error('No s’ha pogut esborrar la foto: el servidor no t’ho ha permés.'));
    pinta();
    await esperaFitxer('una.webp');
    fireEvent.click(screen.getByRole('button', { name: 'Elimina' }));
    await act(async () => {
      fireEvent.click(within(screen.getByRole('dialog', { name: 'Vols eliminar esta foto?' })).getByRole('button', { name: 'Elimina' }));
    });
    expect(screen.getByRole('alert').textContent).toBe('No s’ha pogut esborrar la foto: el servidor no t’ho ha permés.');
    expect(fitxers()).toEqual(['una.webp']);
  });
});

/* Correcció de la revisió (Pla 261018_1605, Tasca 4) · Mentre la cua guarda
   un esborrany de l'avatar o de la capçalera (pendent o rebutjat, com un 403),
   la fila desada continua sent la que veu el veïnat: la seua foto no es pot
   eliminar, ni amb «Elimina» ni amb «Eliminar duplicats». Amb la cua de veres. */
/* Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 4 (revisió adversarial) ·
   el motiu de bloqueig d'una foto protegida també compta la presentació. */
describe('Pla 261018_1605 · Tasca 4 · la foto desada, protegida amb un esborrany a la cua', () => {
  const AMBIT = 'ambit-guarda-desada';
  const clauCua = { ambit: AMBIT, context: CONFIG, entitat: 'perfil', id: 'jo' };
  const MOTIU_DESADA = 'La teua fitxa la fa servir (la foto o la presentació que veu el veïnat): no es pot eliminar mentre la tinga.';

  beforeEach(async () => {
    await cuaDesament.reinicia();
    identitat = pep({ avatar_url: ref('desada.webp'), hero_url: ref('cap.webp') });
    m.perfil.identitats = [identitat];
    m.perfil.autodesament = { ambit: AMBIT, context: CONFIG };
    m.llista.mockResolvedValue([mitja('desada.webp'), mitja('nova.webp'), mitja('cap.webp')]);
  });
  afterEach(async () => { await cuaDesament.reinicia(); });

  for (const [cas, camp, valor, fitxer] of [
    ['un esborrany de logoImage a una altra foto', 'logoImage', ref('nova.webp'), 'desada.webp'],
    ['«Llevar l’avatar» (un esborrany buit)', 'logoImage', '', 'desada.webp'],
    ['un esborrany de heroImage a una altra foto', 'heroImage', ref('nova.webp'), 'cap.webp'],
  ]) {
    test(`${cas}: la desada no es pot eliminar i diu per què`, async () => {
      cuaDesament.encua(clauCua, camp, valor);
      pinta();
      await esperaFitxer('nova.webp');
      const targeta = targetaDeFitxer(fitxer);
      const boto = within(targeta).getByRole('button', { name: 'Elimina' });
      expect(boto.disabled).toBe(true);
      expect(document.getElementById(idsDescrits(boto)[1]).textContent).toBe(MOTIU_DESADA);
      // Les insígnies continuen dient el de l'esborrany, com l'editor.
      if (camp === 'logoImage') expect(within(targeta).queryByText('Avatar actiu')).toBeNull();
      fireEvent.click(boto);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(m.esborra).not.toHaveBeenCalled();
    });
  }

  test('«Eliminar duplicats» conserva la desada i l’activa de l’esborrany, encara que siguen còpies', async () => {
    m.llista.mockResolvedValue([
      mitja('nova.webp', { etag: 'e', mida: 9, creat: '2026-10-12T10:00:00Z' }),
      mitja('desada.webp', { etag: 'e', mida: 9, creat: '2026-10-05T10:00:00Z' }),
      mitja('vella.webp', { etag: 'e', mida: 9, creat: '2026-09-01T10:00:00Z' }),
    ]);
    cuaDesament.encua(clauCua, 'logoImage', ref('nova.webp'));
    pinta();
    await esperaFitxer('nova.webp');
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar duplicats' }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar duplicats' })); });
    expect(m.esborra.mock.calls.map(([r]) => r)).toEqual([ref('vella.webp')]);
  });
});

describe('Pla 261018_1605 · Tasca 4 · posar-la d’avatar o de capçalera', () => {
  test('«Posa com a avatar» descarta l’esborrany de la cua i després desa avatar_url; «Posa com a capçalera», hero_url', async () => {
    const autodesament = { ambit: 'ambit-de-prova', context: CONFIG };
    m.perfil.autodesament = autodesament;
    const descarta = vi.spyOn(cuaDesament, 'descarta');
    m.llista.mockResolvedValue([mitja('nova.webp')]);
    pinta();
    await esperaFitxer('nova.webp');
    const targeta = targetaDeFitxer('nova.webp');
    await act(async () => { fireEvent.click(within(targeta).getByRole('button', { name: 'Posa com a avatar' })); });
    const clauCua = { ambit: 'ambit-de-prova', context: CONFIG, entitat: 'perfil', id: 'jo' };
    expect(descarta).toHaveBeenCalledWith(clauCua, 'logoImage');
    expect(m.perfil.guardarCampPerfil).toHaveBeenCalledWith('avatar_url', ref('nova.webp'), 'jo');
    expect(descarta.mock.invocationCallOrder[0]).toBeLessThan(m.perfil.guardarCampPerfil.mock.invocationCallOrder[0]);
    expect(screen.getByRole('status').textContent).toBe('Ja és el teu avatar.');

    await act(async () => { fireEvent.click(within(targeta).getByRole('button', { name: 'Posa com a capçalera' })); });
    expect(descarta).toHaveBeenLastCalledWith(clauCua, 'heroImage');
    expect(m.perfil.guardarCampPerfil).toHaveBeenLastCalledWith('hero_url', ref('nova.webp'), 'jo');
    expect(screen.getByRole('status').textContent).toBe('Ja és la teua capçalera.');
  });

  test('si el desat falla, el motiu es diu en línia', async () => {
    m.perfil.guardarCampPerfil.mockRejectedValue(new Error('Sense xarxa'));
    m.llista.mockResolvedValue([mitja('nova.webp')]);
    pinta();
    await esperaFitxer('nova.webp');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Posa com a avatar' })); });
    expect(screen.getByRole('alert').textContent).toBe('Sense xarxa');
  });

  test('qui no pot editar la fitxa (una baixa en curs) ho veu tot desactivat', async () => {
    identitat = pep({ baixa_demanada_at: '2026-10-01T10:00:00Z' });
    m.perfil.identitats = [identitat];
    m.llista.mockResolvedValue([
      mitja('a.webp', { etag: 'e', mida: 1 }),
      mitja('b.webp', { etag: 'e', mida: 1, creat: '2026-09-01T10:00:00Z' }),
    ]);
    pinta();
    await esperaFitxer('a.webp');
    /* Expectativa actualitzada a propòsit: relleu del Pla 2000, punt 3 · mirar-la
       al visor no canvia res, i la miniatura l'obri també en lectura. */
    for (const boto of within(graella()).getAllByRole('button').filter((b) => !b.matches('.sdp-visor__obridor'))) {
      expect(boto.disabled).toBe(true);
    }
    expect(screen.getByRole('button', { name: 'Eliminar duplicats' }).disabled).toBe(true);
    expect(screen.getByText('Ara la fitxa es veu en lectura: de moment no pots canviar ni eliminar cap foto.')).toBeTruthy();
  });

  test(`${LIMIT_MINIATURES} miniatures d’entrada i «Mostra’n més» per a la resta`, async () => {
    m.llista.mockResolvedValue(Array.from({ length: LIMIT_MINIATURES + 2 }, (_, i) => mitja(`foto-${String(i).padStart(2, '0')}.webp`)));
    pinta();
    await esperaFitxer('foto-00.webp');
    expect(within(graella()).getAllByRole('listitem')).toHaveLength(LIMIT_MINIATURES);
    const mes = screen.getByRole('button', { name: 'Mostra’n més' });
    mes.focus();
    fireEvent.click(mes);
    expect(within(graella()).getAllByRole('listitem')).toHaveLength(LIMIT_MINIATURES + 2);
    expect(screen.queryByRole('button', { name: 'Mostra’n més' })).toBeNull();
    // El botó ha desaparegut: el focus, al primer botó de la primera foto nova.
    const primeraNova = within(graella()).getAllByRole('listitem')[LIMIT_MINIATURES];
    expect(fitxerDe(primeraNova)).toBe(`foto-${LIMIT_MINIATURES}.webp`);
    expect(document.activeElement).toBe(within(primeraNova).getByRole('button', { name: 'Posa com a avatar' }));
  });

  test('si en posar-la d’avatar el botó queda desactivat, el focus continua a la mateixa targeta', async () => {
    m.llista.mockResolvedValue([mitja('altra.webp'), mitja('nova.webp')]);
    const { rerender } = pinta();
    await esperaFitxer('nova.webp');
    m.perfil.guardarCampPerfil.mockImplementation(async (columna, font) => {
      // Com PerfilContext: la fila nova arriba abans que es resolga el desat.
      identitat = pep({ avatar_url: font });
      m.perfil.identitats = [identitat];
      rerender(<DetallMultimedia identitat={identitat} config={CONFIG} />);
    });
    const posa = within(targetaDeFitxer('nova.webp')).getByRole('button', { name: 'Posa com a avatar' });
    posa.focus();
    await act(async () => { fireEvent.click(posa); });
    const targeta = targetaDeFitxer('nova.webp');
    expect(within(targeta).getByText('Avatar actiu')).toBeTruthy();
    expect(within(targeta).getByRole('button', { name: 'Posa com a avatar' }).disabled).toBe(true);
    expect(document.activeElement).toBe(within(targeta).getByRole('button', { name: 'Posa com a capçalera' }));
  });
});

/* ═══════════════════════════════════════════════════════════════════
   Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 3; auditories 2030
   de Codex §1.5 i §4.1 i de Gemini) · «Multimèdia» per a cada actor del
   Perfil (la persona, una empresa o un grup i un agent IA), amb el visor
   complet de l'Arxiu i les accions del Perfil al seu panell. La titularitat,
   només per identificadors explícits; cap esborrat d'una organització ni d'un
   agent, i el de la persona, tancat sense 'integritatMitjans'.
   ═══════════════════════════════════════════════════════════════════ */
const forn = (dades = {}) => ({
  id: 'O', mena: 'empresa', nom: 'Forn', avatar: '',
  dades: { id: 'O', role: 'owner', name: 'Forn', town_name: 'Benilloba', ...dades },
});
const iaia = (dades = {}) => ({
  id: IAIA_ID, mena: 'agent', nom: 'IAIA MarIA', avatar: '',
  dades: { id: IAIA_ID, name: 'IAIA MarIA', ...dades },
});
const visor = () => document.querySelector('dialog.sdp-visor');
const visorObert = () => visor()?.hasAttribute('open') === true;
const fila = (etiqueta) => [...visor().querySelectorAll('.sdp-visor__fila')]
  .find((f) => f.querySelector('.sdp-visor__clau')?.textContent === etiqueta) || null;
const obridorDe = (li) => li.querySelector('button.sdp-visor__obridor');
/* La targeta d'una foto pel seu títol, a la llista de qualsevol actor. */
const targetaAmb = (titol) => screen.getByText(titol, { selector: '.perfil-multimedia__titol' }).closest('li');

describe('Relleu del Pla 2000 · la titularitat, només per identificadors explícits', () => {
  test('titularDelMitja: l’entitat que el signa mana sobre qui l’ha pujat; després l’agent i la persona; mai el nom', () => {
    expect(titularDelMitja({ author_org_id: 'O', ownerUserId: UID })).toEqual({ mena: 'organitzacio', id: 'O' });
    expect(titularDelMitja({ author_org_id: null, authorOrgId: null, ownerUserId: UID })).toEqual({ mena: 'persona', id: UID });
    expect(titularDelMitja({ author_agent_id: IAIA_ID })).toEqual({ mena: 'agent', id: IAIA_ID });
    /* Expectativa actualitzada a propòsit (correcció F1 de la revisió): un
       element amb persona propietària (la columna owner_user_id que signa el
       servidor) és d'eixa persona, encara que diga un agent. */
    expect(titularDelMitja({ author_agent_id: IAIA_ID, ownerUserId: UID })).toEqual({ mena: 'persona', id: UID });
    expect(titularDelMitja({ owner_user_id: ` ${UID} ` })).toEqual({ mena: 'persona', id: UID });
    // El nom, el correu i qui signa el text no són cap titular.
    expect(titularDelMitja({ source: 'Forn', author_name: 'Forn', author: 'Pep', email: 'pep@poble.test' })).toBeNull();
    expect(titularDelMitja(null)).toBeNull();
  });

  test('idsDeLActor: la persona pel seu uid; l’organització i l’agent pel seu id i els àlies que el catàleg declara per a eixe id', () => {
    expect([...idsDeLActor(pep())]).toEqual([UID]);
    expect([...idsDeLActor({ id: 'jo', mena: 'persona', dades: {} }, { id: UID })]).toEqual([UID]);
    expect([...idsDeLActor(forn())]).toEqual(['O']);
    // L'entitat pilot de la llavor: el seu id i els àlies declarats (soc-de-poble_official).
    expect(idsDeLActor({ id: ENTITAT_PILOT_ID, mena: 'empresa', dades: {} }).has('soc-de-poble_official')).toBe(true);
    // Un homònim d'un altre poble (un altre id, el mateix slug i el mateix nom): només el seu id.
    const homonim = { id: '77777777-0000-4000-8000-000000000000', mena: 'empresa', nom: 'Sóc de Poble', dades: { slug: 'socdepoble' } };
    expect([...idsDeLActor(homonim)]).toEqual(['77777777-0000-4000-8000-000000000000']);
    // La IAIA del catàleg: el seu id i el seu slug declarat; un altre agent amb el mateix slug, no.
    expect([...idsDeLActor(iaia())]).toEqual([IAIA_ID, 'iaia-maria']);
    expect([...idsDeLActor({ id: 'A2', mena: 'agent', dades: { slug: 'iaia-maria' } })]).toEqual(['A2']);
  });

  test('arxiuDeLActor: de la seua mena, amb un dels seus ids i una imatge pròpia', () => {
    const items = [
      { id: 'a', src: '/assets/forn/a.jpg', author_org_id: 'O' },
      { id: 'b', src: '/assets/forn/b.jpg', author_org_id: 'O2' },
      { id: 'c', src: 'https://fora.example/c.jpg', author_org_id: 'O' },
      { id: 'd', src: '/assets/forn/d.mp4', kind: 'video', author_org_id: 'O' },
      { id: 'e', src: '/assets/forn/e.jpg', ownerUserId: 'O' },
    ];
    expect(arxiuDeLActor(items, new Set(['O']), 'organitzacio').map((i) => i.id)).toEqual(['a']);
    expect(arxiuDeLActor(items, new Set(), 'organitzacio')).toEqual([]);
  });

  test('les imatges de la presentació: només les pròpies, en ordre i sense repetir', () => {
    const html = `<p><img src="/assets/forn/pa.webp" alt=""><img alt='x' src='${ref('cos.webp')}'>`
      + '<img src="https://fora.example/x.jpg"><img src="/assets/forn/pa.webp"><img src="/assets/a.jpg?v=1&amp;w=2"></p>';
    expect(imatgesDeLaPresentacio(html)).toEqual(['/assets/forn/pa.webp', ref('cos.webp'), '/assets/a.jpg?v=1&w=2']);
    expect(imatgesDeLaPresentacio(null)).toEqual([]);
  });

  test('els textos de cada mena: «de» amb l’apòstrof davant de vocal, mai davant d’una i semiconsonant', () => {
    expect(textosDeMultimedia('organitzacio', 'Forn').buit).toBe('Encara no hi ha cap foto amb titularitat de Forn.');
    expect(textosDeMultimedia('organitzacio', 'Ateneu').buit).toBe('Encara no hi ha cap foto amb titularitat d’Ateneu.');
    expect(textosDeMultimedia('agent', 'IAIA MarIA').buit).toBe('Encara no hi ha cap foto amb titularitat de IAIA MarIA.');
    expect(textosDeMultimedia('organitzacio', 'Forn').posaAvatar).toBe('Posa com a logotip');
    expect(textosDeMultimedia('agent', 'IAIA MarIA').posaAvatar).toBe('Posa com a avatar');
  });
});

describe('Relleu del Pla 2000 · una organització: les fotos de la seua fitxa i les de l’Arxiu amb el seu id', () => {
  const ARXIU = [
    { id: 'm-forn', src: '/assets/forn/forn-al-mati.jpg', title: 'El forn al matí', author_org_id: 'O' },
    // Pujada per la persona per a l'organització: és de l'organització.
    { id: 'm-pujada', src: '/assets/forn/pa-de-pep.jpg', title: 'El pa de Pep', ownerUserId: UID, author_org_id: 'O' },
    // Un homònim pel nom (sense cap id) i una altra organització: mai.
    { id: 'm-homonim', src: '/assets/altre/forn.jpg', title: 'Forn', source: 'Forn', author_name: 'Forn' },
    { id: 'm-altra', src: '/assets/altre/org.jpg', title: 'Una altra', author_org_id: 'O2' },
    // De la persona: no és de l'organització.
    { id: 'm-pep', src: '/assets/pep/pep.jpg', title: 'Pep al bancal', ownerUserId: UID },
  ];

  beforeEach(() => {
    m.mediaItems = ARXIU;
    identitat = forn({
      logo_url: '/assets/forn/logo.webp',
      hero_url: '/assets/forn/cap.webp',
      presentacio_html: '<p>El pa</p><img src="/assets/forn/pa.webp"><img src="https://fora.example/x.jpg">',
    });
    m.perfil.identitats = [pep(), identitat];
  });

  test('es veuen el logotip, la capçalera, la presentació i les de l’Arxiu amb titular explícit; ni l’homònim ni una altra ni la persona', () => {
    pinta();
    const llista = screen.getByRole('list', { name: 'Les fotos de Forn' });
    const noms = within(llista).getAllByRole('listitem').map((li) => li.querySelector('.perfil-multimedia__titol').textContent);
    expect(noms).toEqual(['Logotip actual', 'Capçalera actual', 'Foto de la presentació', 'El forn al matí', 'El pa de Pep']);
    expect(screen.queryByText('Forn', { selector: '.perfil-multimedia__titol' })).toBeNull();
    expect(screen.queryByText('Una altra')).toBeNull();
    expect(screen.queryByText('Pep al bancal')).toBeNull();
    expect(within(llista).getAllByText('De l’Arxiu visual')).toHaveLength(2);
    // Cap biblioteca del servidor de fitxers (la carpeta no diu de qui és) ni cap esborrat.
    expect(m.llista).not.toHaveBeenCalled();
    expect(screen.queryByText('En este mode no hi ha servidor de fitxers: es veuen les fotos de la fitxa.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Elimina' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Eliminar duplicats' })).toBeNull();
    expect(within(llista).getAllByRole('button', { name: 'Posa com a logotip' })).toHaveLength(5);
    expect(within(llista).getByText('Logotip actiu')).toBeTruthy();
  });

  test('la persona no hi veu les de l’organització, encara que les haja pujades ella', () => {
    identitat = pep();
    m.perfil.identitats = [identitat];
    m.caps = new Set(['mitjans']);
    pinta();
    expect(titols()).toEqual(['Pep al bancal']);
  });

  test('sense cap foto provable: ho diu clarament', () => {
    m.mediaItems = [{ id: 'm-homonim', src: '/assets/altre/forn.jpg', title: 'Forn', source: 'Forn' }];
    identitat = forn();
    m.perfil.identitats = [identitat];
    pinta();
    expect(screen.getByText('Encara no hi ha cap foto amb titularitat de Forn.')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });

  test('«Posa com a logotip» desa logo_url i «Posa com a capçalera», hero_url, a l’organització, després de descartar l’esborrany de la cua', async () => {
    m.perfil.autodesament = { ambit: 'ambit-org', context: CONFIG };
    const descarta = vi.spyOn(cuaDesament, 'descarta');
    pinta();
    const targeta = targetaAmb('El forn al matí');
    await act(async () => { fireEvent.click(within(targeta).getByRole('button', { name: 'Posa com a logotip' })); });
    const clauCua = { ambit: 'ambit-org', context: CONFIG, entitat: 'organitzacio', id: 'O' };
    expect(descarta).toHaveBeenCalledWith(clauCua, 'logoImage');
    expect(m.perfil.guardarCampPerfil).toHaveBeenCalledWith('logo_url', '/assets/forn/forn-al-mati.jpg', 'O');
    expect(screen.getByRole('status').textContent).toBe('Ja és el logotip de Forn.');
    await act(async () => { fireEvent.click(within(targetaAmb('El forn al matí')).getByRole('button', { name: 'Posa com a capçalera' })); });
    expect(descarta).toHaveBeenLastCalledWith(clauCua, 'heroImage');
    expect(m.perfil.guardarCampPerfil).toHaveBeenLastCalledWith('hero_url', '/assets/forn/forn-al-mati.jpg', 'O');
    expect(screen.getByRole('status').textContent).toBe('Ja és la capçalera de Forn.');
  });

  test('cap esborrat per a una organització, ni amb la comprovació d’ús del servidor ni al visor', async () => {
    m.caps = new Set(['mitjans', 'mitjansPropis', 'integritatMitjans']);
    pinta();
    expect(m.llista).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Elimina' })).toBeNull();
    act(() => obridorDe(targetaAmb('El forn al matí')).click());
    expect(visorObert()).toBe(true);
    expect(within(visor()).queryByRole('button', { name: 'Elimina' })).toBeNull();
    expect(within(visor()).getByRole('button', { name: 'Posa com a logotip' })).toBeTruthy();
  });
});

describe('Relleu del Pla 2000 · un agent IA: el seu id o un àlies declarat al catàleg', () => {
  test('les de l’agent (id i slug del catàleg) i les seues de la fitxa; mai les d’un altre agent ni les d’una persona amb el mateix id', async () => {
    m.mediaItems = [
      { id: 'a1', src: '/assets/iaia/a1.jpg', title: 'La IAIA a la fresca', author_agent_id: IAIA_ID },
      { id: 'a2', src: '/assets/iaia/a2.jpg', title: 'La IAIA al Mas', authorAgentId: 'iaia-maria' },
      { id: 'a3', src: '/assets/iaia/a3.jpg', title: 'Un altre agent', author_agent_id: 'nano-banana' },
      { id: 'a4', src: '/assets/iaia/a4.jpg', title: 'Per nom', source: 'IAIA MarIA' },
      { id: 'a5', src: '/assets/iaia/a5.jpg', title: 'Com a persona', ownerUserId: IAIA_ID },
    ];
    identitat = iaia({ avatar_url: '/assets/uploads/brain/iaia_maria_avatar.jpg' });
    m.perfil.identitats = [pep(), identitat];
    pinta();
    const llista = screen.getByRole('list', { name: 'Les fotos de IAIA MarIA' });
    expect(within(llista).getAllByRole('listitem').map((li) => li.querySelector('.perfil-multimedia__titol').textContent))
      .toEqual(['Foto de perfil actual', 'La IAIA a la fresca', 'La IAIA al Mas']);
    expect(screen.queryByRole('button', { name: 'Elimina' })).toBeNull();
    await act(async () => { fireEvent.click(within(targetaAmb('La IAIA al Mas')).getByRole('button', { name: 'Posa com a avatar' })); });
    expect(m.perfil.guardarCampPerfil).toHaveBeenCalledWith('avatar_url', '/assets/iaia/a2.jpg', IAIA_ID);
    expect(screen.getByRole('status').textContent).toBe('Ja és l’avatar de IAIA MarIA.');
  });

  /* Correcció F1 de la revisió · Una publicació d'un veí (section_submissions,
     elementDeFilaPublicada) no pot dir que la seua foto és d'un agent: ni amb
     l'id ni amb l'slug, ni reprenent l'id d'un element de l'administració. */
  test('una foto d’un veí amb author_agent_id al payload continua sent seua, mai de l’agent', () => {
    const deVei = (payload, id = 'v1') => elementDeFilaPublicada({
      id, payload: { src: '/assets/uploads/x.jpg', kind: 'image', title: 'La del veí', ...payload },
      titol: 'La del veí', createdAt: '2026-10-18T10:00:00Z', ownerUserId: UID, authorOrgId: null,
    });
    const files = [deVei({ author_agent_id: IAIA_ID }), deVei({ authorAgentId: 'iaia-maria' }, 'v2')];
    for (const fila of files) {
      expect(fila).not.toHaveProperty('author_agent_id');
      expect(fila).not.toHaveProperty('authorAgentId');
      expect(titularDelMitja(fila)).toEqual({ mena: 'persona', id: UID });
    }
    expect(arxiuDeLActor(files, idsDeLActor(iaia()), 'agent')).toEqual([]);
    expect(arxiuDeLActor(files, idsDeLActor(pep()), 'persona')).toEqual(files);
    // Una fila del veí amb l'id d'un element de l'administració que sí que és de l'agent.
    const admin = { id: 'v1', src: '/assets/iaia/a1.jpg', title: 'La IAIA', author_agent_id: IAIA_ID };
    const fusionat = mergeById([admin], [files[0]]);
    expect(fusionat[0].author_agent_id).toBe(IAIA_ID);
    expect(titularDelMitja(fusionat[0])).toEqual({ mena: 'persona', id: UID });
    expect(arxiuDeLActor(fusionat, idsDeLActor(iaia()), 'agent')).toEqual([]);

    m.mediaItems = files;
    identitat = iaia();
    m.perfil.identitats = [pep(), identitat];
    pinta();
    expect(screen.queryByText('La del veí')).toBeNull();
    expect(screen.getByText('Encara no hi ha cap foto amb titularitat de IAIA MarIA.')).toBeTruthy();
  });

  test('un agent sense cap foto provable ho diu', () => {
    identitat = iaia();
    m.perfil.identitats = [identitat];
    pinta();
    expect(screen.getByText('Encara no hi ha cap foto amb titularitat de IAIA MarIA.')).toBeTruthy();
  });
});

describe('Relleu del Pla 2000 · el visor complet de l’Arxiu, amb les accions del Perfil', () => {
  test('la miniatura obri el visor amb la foto, el panell desplegat i les accions al davant; tancar torna el focus a la miniatura', async () => {
    m.llista.mockResolvedValue([mitja('nova.webp', { creat: '2026-10-12T10:00:00Z' })]);
    pinta();
    await esperaFitxer('nova.webp');
    const obridor = obridorDe(targetaDeFitxer('nova.webp'));
    expect(obridor.getAttribute('aria-haspopup')).toBe('dialog');
    expect(obridor.getAttribute('aria-label')).toBe('Obri al visor');
    expect(document.getElementById(obridor.getAttribute('aria-describedby')).textContent).toBe('Foto pujada el 12-10-2026');
    expect(visorObert()).toBe(false);
    obridor.focus();
    act(() => obridor.click());
    expect(visorObert()).toBe(true);
    // La referència opaca es pinta amb la URL del port, mai crua.
    const img = visor().querySelector('img.sdp-visor__imatge');
    expect(img.getAttribute('src')).toBe(`https://fitxers.test/mitjans/${TENANT}/${UID}/avatars/nova.webp`);
    expect(visor().innerHTML).not.toContain('src="sdp-media:');
    // El panell, desplegat: el títol (la data), les accions i les dades de la foto.
    expect(within(visor()).getByRole('button', { name: 'Informació de la imatge' }).getAttribute('aria-expanded')).toBe('true');
    expect(visor().querySelector('.sdp-visor__titol').textContent).toBe('Foto pujada el 12-10-2026');
    const etiquetes = [...visor().querySelectorAll('.sdp-visor__clau')].map((e) => e.textContent);
    expect(etiquetes[0]).toBe('Accions');
    expect(etiquetes).toEqual(expect.arrayContaining(['Data i hora de captura', 'Resolució', 'Càmera', 'Drets d’ús']));
    // Una pujada no és de cap article ni de cap poble: ni «Poble» ni «Publicat a»; i de la persona, cap GPS.
    expect(etiquetes).not.toContain('Poble');
    expect(etiquetes).not.toContain('Publicat a');
    expect(fila('Coordenades GPS').querySelector('.sdp-visor__valor').textContent).toBe('No es mostren en la foto d’una persona');
    const accions = fila('Accions');
    expect(within(accions).getAllByRole('button').map((b) => b.textContent)).toEqual(['Posa com a avatar', 'Posa com a capçalera', 'Elimina']);
    act(() => within(visor()).getByRole('button', { name: 'Tancar el visor' }).click());
    expect(visorObert()).toBe(false);
    expect(document.activeElement).toBe(obridorDe(targetaDeFitxer('nova.webp')));
  });

  /* Correcció F2 de la revisió (auditoria Codex 2030, §4.1) · Un port que no
     sap resoldre una referència (una URL firmada que falla torna la
     referència tal qual, storage.js) o que en torna una de fora: cap <img>
     amb l'esquema opac, ni a la graella ni al visor. */
  test('si el port torna la referència sense resoldre (o una URL de fora), cap <img> la pinta crua', () => {
    const privada = `sdp-media://mitjans_privats/${TENANT}/altre-membre/portades/x.webp`;
    const defora = `sdp-media://mitjans/${TENANT}/altre-membre/portades/y.webp`;
    m.resol = (font) => (font === defora ? 'https://fora.example/y.webp' : font);
    m.mediaItems = [
      { id: 'p1', src: privada, title: 'La privada d’un altre', author_org_id: 'O' },
      { id: 'p2', src: defora, title: 'La de fora', author_org_id: 'O' },
    ];
    identitat = forn();
    m.perfil.identitats = [identitat];
    pinta();
    const imatges = () => [...document.querySelectorAll('img')].map((img) => img.getAttribute('src') || '');
    expect(targetaAmb('La privada d’un altre').querySelector('img')).toBeNull();
    expect(targetaAmb('La de fora').querySelector('img')).toBeNull();
    expect(imatges().filter((src) => /^sdp-media:/i.test(src) || src.startsWith('https://fora.example'))).toEqual([]);
    act(() => obridorDe(targetaAmb('La privada d’un altre')).click());
    expect(visorObert()).toBe(true);
    expect(visor().querySelector('img.sdp-visor__imatge')?.getAttribute('src') || '').toBe('');
    expect(visor().innerHTML).not.toContain('src="sdp-media:');
    expect(imatges().filter((src) => /^sdp-media:/i.test(src))).toEqual([]);
  });

  test('«Posa com a avatar» des del visor desa la columna; el focus es queda al visor', async () => {
    m.llista.mockResolvedValue([mitja('nova.webp')]);
    const { rerender } = pinta();
    await esperaFitxer('nova.webp');
    m.perfil.guardarCampPerfil.mockImplementation(async (columna, font) => {
      identitat = pep({ avatar_url: font });
      m.perfil.identitats = [identitat];
      rerender(<DetallMultimedia identitat={identitat} config={CONFIG} />);
    });
    act(() => obridorDe(targetaDeFitxer('nova.webp')).click());
    const posa = within(fila('Accions')).getByRole('button', { name: 'Posa com a avatar' });
    posa.focus();
    await act(async () => { fireEvent.click(posa); });
    expect(m.perfil.guardarCampPerfil).toHaveBeenCalledWith('avatar_url', ref('nova.webp'), 'jo');
    // La foto ja és l'avatar: el botó, desactivat, i el focus a la capçalera, dins del visor.
    expect(visorObert()).toBe(true);
    expect(within(fila('Accions')).getByRole('button', { name: 'Posa com a avatar' }).disabled).toBe(true);
    expect(document.activeElement).toBe(within(fila('Accions')).getByRole('button', { name: 'Posa com a capçalera' }));
  });

  test('sense la comprovació d’ús del servidor, «Elimina» del visor està desactivat i diu per què', async () => {
    m.caps = new Set(['mitjans', 'mitjansPropis']);
    m.llista.mockResolvedValue([mitja('una.webp')]);
    pinta();
    await esperaFitxer('una.webp');
    act(() => obridorDe(targetaDeFitxer('una.webp')).click());
    const elimina = within(fila('Accions')).getByRole('button', { name: 'Elimina' });
    expect(elimina.disabled).toBe(true);
    expect(document.getElementById(elimina.getAttribute('aria-describedby')).textContent).toBe(MOTIU_SENSE_INTEGRITAT);
    fireEvent.click(elimina);
    expect(screen.queryByRole('dialog', { name: 'Vols eliminar esta foto?' })).toBeNull();
    expect(m.esborra).not.toHaveBeenCalled();
  });

  test('amb la comprovació d’ús, «Elimina» del visor el tanca i demana confirmació; confirmat, esborra pel port', async () => {
    m.llista.mockResolvedValue([mitja('una.webp'), mitja('altra.webp')]);
    pinta();
    await esperaFitxer('una.webp');
    const obridor = obridorDe(targetaDeFitxer('una.webp'));
    obridor.focus();
    act(() => obridor.click());
    fireEvent.click(within(fila('Accions')).getByRole('button', { name: 'Elimina' }));
    expect(visorObert()).toBe(false);
    const dialeg = screen.getByRole('dialog', { name: 'Vols eliminar esta foto?' });
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Elimina' })); });
    expect(m.esborra).toHaveBeenCalledWith(ref('una.webp'), CONFIG);
    expect(fitxers()).toEqual(['altra.webp']);
  });

  test('la foto de Google no s’obri al visor (sense referent); anterior i següent passen per les pròpies', async () => {
    m.perfil.usuari = usuariDePep({ identities: [{ provider: 'google', identity_data: { avatar_url: FOTO_GOOGLE } }] });
    m.llista.mockResolvedValue([mitja('a.webp', { creat: '2026-10-12T10:00:00Z' }), mitja('b.webp', { creat: '2026-10-11T10:00:00Z' })]);
    pinta();
    await esperaFitxer('a.webp');
    expect(obridorDe(targetaDe('Foto del compte de Google'))).toBeNull();
    act(() => obridorDe(targetaDeFitxer('a.webp')).click());
    expect(visor().querySelector('.sdp-visor__titol').textContent).toBe('Foto pujada el 12-10-2026');
    act(() => within(visor()).getByRole('button', { name: 'Imatge següent' }).click());
    expect(visor().querySelector('.sdp-visor__titol').textContent).toBe('Foto pujada el 11-10-2026');
    act(() => within(visor()).getByRole('button', { name: 'Imatge següent' }).click());
    expect(visor().querySelector('.sdp-visor__titol').textContent).toBe('Foto pujada el 12-10-2026');
  });

  test('una foto de l’Arxiu d’una organització porta al visor el seu article i les seues accions', () => {
    m.mediaItems = [{
      id: 'feed-forn', src: '/assets/forn/forn-al-mati.jpg', title: 'El forn al matí', author_org_id: 'O',
      article: { sectionId: 'mur', id: 'forn' },
    }];
    identitat = forn();
    m.perfil.identitats = [identitat];
    pinta();
    act(() => obridorDe(targetaAmb('El forn al matí')).click());
    expect(visor().querySelector('img.sdp-visor__imatge').getAttribute('src')).toBe('/assets/forn/forn-al-mati.jpg');
    expect(fila('Publicat a').querySelector('a').getAttribute('href')).toBe('/mur/forn');
    expect(within(fila('Accions')).getAllByRole('button').map((b) => b.textContent)).toEqual(['Posa com a logotip', 'Posa com a capçalera']);
  });
});
