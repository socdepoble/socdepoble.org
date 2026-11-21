import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CONTRACTE_NUCLI } from '../../../data/contracte.js';
import { estatPort } from '../../../data/backendPortEstat.js';
import { setBackendImplementation } from '../../../data/backendPort.js';
import { permetOrigenMitjans } from '../../../utils/sanitize.js';
import {
  DetallMultimedia,
  clauDeFont,
  construeixGaleria,
  fotesDelText,
} from '../DetallMultimedia.jsx';

vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => (ref ? `https://fitxers.r3224.test/${ref.replace('sdp-media://', '')}` : ''),
}));
vi.mock('../../../config/assetResolver.js', async (importOriginal) => ({
  ...(await importOriginal()),
  resolRecursPropi: (src) => src,
}));
vi.mock('../../multimedia/MultimediaContext.jsx', () => ({
  useMultimedia: () => ({ status: 'ready', mediaItems: [] }),
}));
vi.mock('../../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_k, d) => d }) }));
vi.mock('../../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
vi.mock('../../../app/contexts/RouterContext', () => ({
  useLocation: () => ({ pathname: '/el-meu-perfil', search: '', state: null, hash: '' }),
  useNavigate: () => vi.fn(),
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

const m = vi.hoisted(() => ({ perfil: null }));
vi.mock('../PerfilContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  usePerfilOpcional: () => m.perfil,
}));

permetOrigenMitjans('https://fitxers.r3224.test');
permetOrigenMitjans('https://alt.r3224.test');

const TENANT = '11111111-2222-4333-8444-555555555555';
const UID = '99999999-8888-4777-8666-555555555555';

describe('R32.24 · DetallMultimedia · Enxufabilitat E5 = 0 via backendProtocolPublic', () => {
  let estatInicialPort;

  beforeEach(() => {
    estatInicialPort = {
      currentImpl: estatPort.currentImpl,
      isLocked: estatPort.isLocked,
      dispose: estatPort.dispose,
    };
    Object.assign(estatPort, { currentImpl: null, isLocked: false, dispose: null });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
  });

  afterEach(() => {
    cleanup();
    Object.assign(estatPort, estatInicialPort);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test('el codi font de DetallMultimedia.jsx no conté cap senyal literal de protocol del proveïdor (E5 = 0)', () => {
    const codi = readFileSync(resolve(process.cwd(), 'src/sections/profile/DetallMultimedia.jsx'), 'utf8');
    const senseComentaris = codi
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .split('\n')
      .map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1'))
      .join('\n')
      .replace(/\\\//g, '/');

    expect(senseComentaris).not.toMatch(/\/(?:auth|rest|realtime|storage|functions|graphql)\/v1\b/);
    expect(senseComentaris).not.toMatch(/@supabase\//);
    expect(senseComentaris).toContain('backendProtocolPublic.js');
  });

  test('preserva 100 % el comportament amb URLs antigues, rutes relatives, blob:, data: i rebutja rutes privades/traversal', () => {
    const urlAntiga = `https://fitxers.r3224.test/storage/v1/object/public/mitjans/${TENANT}/${UID}/avatars/Foto_1.WEBP?t=99#sdp-crop=1`;
    expect(clauDeFont(urlAntiga)).toBe(`sdp-media://mitjans/${TENANT}/${UID}/avatars/foto_1.webp`);

    // Rutes relatives, blob: i data: romanen intactes
    expect(clauDeFont('/assets/fotos/pep.jpg?v=3#x')).toBe('/assets/fotos/pep.jpg');
    expect(clauDeFont('blob:https://socdepoble.org/abcd-1234')).toBe('blob:https://socdepoble.org/abcd-1234');
    expect(clauDeFont('data:image/webp;base64,UklGRg==')).toBe('data:image/webp;base64,UklGRg==');

    // URLs privades, signades, d'altres buckets, amb credencials o traversal mai es tornen referència opaca
    const signada = `https://fitxers.r3224.test/storage/v1/object/sign/mitjans/${TENANT}/${UID}/avatars/privada.webp?token=secret`;
    const altreBucket = `https://fitxers.r3224.test/storage/v1/object/public/altre/${TENANT}/foto.webp`;
    const traversal = `https://fitxers.r3224.test/storage/v1/object/public/mitjans/${TENANT}/../privat.webp`;
    const traversalCodificat = `https://fitxers.r3224.test/storage/v1/object/public/mitjans/${TENANT}/%2e%2e/privat.webp`;
    const dobleBarra = `https://fitxers.r3224.test/storage/v1/object/public/mitjans//${TENANT}/foto.webp`;
    const credencials = `https://usuari:clau@fitxers.r3224.test/storage/v1/object/public/mitjans/${TENANT}/a.webp`;

    expect(clauDeFont(signada)).not.toMatch(/^sdp-media:\/\//);
    expect(clauDeFont(altreBucket)).not.toMatch(/^sdp-media:\/\//);
    expect(clauDeFont(traversal)).not.toMatch(/^sdp-media:\/\//);
    expect(clauDeFont(traversalCodificat)).not.toMatch(/^sdp-media:\/\//);
    expect(clauDeFont(dobleBarra)).not.toMatch(/^sdp-media:\/\//);
    expect(clauDeFont(credencials)).not.toMatch(/^sdp-media:\/\//);

    const html = [
      `<img src="sdp-media://mitjans/${TENANT}/${UID}/avatars/opaca.webp">`,
      `<img src="${urlAntiga}">`,
      `<img src="${signada}">`,
      `<img src="${altreBucket}">`,
      '<img src="/assets/fotos/local.webp">',
      '<img src="blob:https://socdepoble.org/1234">',
    ].join('');
    expect(fotesDelText(html)).toEqual([
      `sdp-media://mitjans/${TENANT}/${UID}/avatars/opaca.webp`,
      urlAntiga,
    ]);
  });

  test('delega en un backend alternatiu substituïble (classificaCamiMitja i prefixMitjansPublics) i revalida respostes hostils', async () => {
    const nucli = Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, () => null]));
    const refPropia = `sdp-media://mitjans/${TENANT}/${UID}/avatars/alt.webp`;
    const urlAlt = `https://alt.r3224.test/fitxers-publics/mitjans/${TENANT}/${UID}/avatars/ALT.webp`;

    const esborraSpy = vi.fn(async () => undefined);
    setBackendImplementation({
      ...nucli,
      getRuntimeDataMode: () => 'remote',
      llistaElsMeusMitjans: async () => [
        {
          ref: refPropia,
          ruta: `${TENANT}/${UID}/avatars/alt.webp`,
          nom: 'alt.webp',
          carpeta: 'avatars',
          creat: '2026-10-12T10:00:00Z',
          mida: 1024,
          etag: 'e-alt',
          tipus: 'image/webp',
          esborrable: true,
        },
      ],
      esborraElMeuMitja: esborraSpy,
      comprovaUsImatge: async () => false,
      prefixMitjansPublics: (base) => `${base}/fitxers-publics/mitjans/`,
      classificaCamiMitja: (cami) => (
        cami.startsWith('/fitxers-publics/mitjans/')
          ? { ref: `sdp-media://mitjans/${cami.slice('/fitxers-publics/mitjans/'.length)}` }
          : null
      ),
      esReferenciaMitjaPrivada: () => false,
      normalitzaVerificacioRecuperacio: () => null,
      urlAutoritzacioGoogle: () => 'https://alt.r3224.test/oauth',
    });

    expect(clauDeFont(urlAlt)).toBe(refPropia);
    expect(fotesDelText(`<p><img src="${urlAlt}"></p>`)).toEqual([urlAlt]);

    // La foto citada per URL del backend alternatiu a presentacio_html queda protegida contra esborrat
    const { fotos, sobreres } = construeixGaleria({
      mitjans: [
        { ref: refPropia, etag: 'dup', mida: 10, creat: '2026-10-12T10:00:00Z', esborrable: true },
        { ref: `sdp-media://mitjans/${TENANT}/${UID}/avatars/vella.webp`, etag: 'dup', mida: 10, creat: '2026-10-01T10:00:00Z', esborrable: true },
      ],
      protegides: fotesDelText(`<p><img src="${urlAlt}"></p>`),
    });
    expect(fotos.find((f) => f.ref === refPropia)?.protegida).toBe(true);
    expect(sobreres.map((f) => f.ref)).toEqual([`sdp-media://mitjans/${TENANT}/${UID}/avatars/vella.webp`]);

    // Render real amb el port muntat: el botó «Elimina» de la foto citada a la presentació està desactivat
    const identitat = {
      id: 'jo',
      mena: 'persona',
      nom: 'Pep',
      avatar: '',
      dades: {
        id: UID,
        full_name: 'Pep',
        town_name: 'La Torre de les Maçanes',
        is_public: true,
        visibility: 'private',
        presentacio_html: `<p><img src="${urlAlt}"></p>`,
      },
    };
    m.perfil = {
      usuari: { id: UID, email: 'pep@poble.test', user_metadata: {} },
      identitats: [identitat],
      guardarCampPerfil: vi.fn(async () => undefined),
      autodesament: null,
    };

    render(<DetallMultimedia identitat={identitat} config={{ tenantId: TENANT, backendId: 'alt' }} />);
    const llista = await screen.findByRole('list', { name: 'Les teues fotos' });
    await waitFor(() => expect(within(llista).getAllByRole('listitem')).toHaveLength(1));
    const botoElimina = within(llista).getByRole('button', { name: 'Elimina' });
    expect(botoElimina.disabled).toBe(true);

    // Revalidació defensiva: si un backend hostil retorna una referència amb traversal o query, es rebutja
    setBackendImplementation({
      ...nucli,
      prefixMitjansPublics: () => '',
      classificaCamiMitja: () => ({ ref: 'sdp-media://mitjans/../privat.webp?token=secret' }),
      esReferenciaMitjaPrivada: () => false,
      normalitzaVerificacioRecuperacio: () => null,
      urlAutoritzacioGoogle: () => 'https://alt.r3224.test/oauth',
    });
    expect(clauDeFont(urlAlt)).toBe(urlAlt);
    expect(fotesDelText(`<img src="${urlAlt}">`)).toEqual([]);
  });
});
