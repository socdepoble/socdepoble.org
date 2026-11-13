import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  navigate: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock('./runtime.js', () => ({
  getCurrentUser: () => ({ id: '00000000-0000-4000-8000-000000000001' }),
  getResolvedConfig: (cfg = {}) => ({
    runtimeDataMode: cfg.runtimeDataMode || 'remote',
    supabaseUrl: 'https://exemple.supabase.co',
    supabaseAnonKey: 'clau-test',
    tenantId: 'socdepoble',
  }),
  request: (...args) => mocks.request(...args),
  rpc: vi.fn(),
}));

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [mocks.params, vi.fn()],
  useLocation: () => ({ pathname: '/perfil', search: '', hash: '' }),
  useParams: () => ({}),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alt) => alt, language: 'ca' }),
  useUIState: () => ({ externalConfig: {} }),
}));

import { admetVideoDeCapcalera, fitxaDeLectura, documentDeFitxa, valorPerDesar } from '../../sections/profile/perfilCamps.js';
import { perfilDOrganitzacio, perfilDePersona } from './perfils.js';
import { reiniciaMemoriaDirectori, updateOrganization } from './organizations.js';
import { ErrorColumnaAbsent } from '../autodesament/errors.js';
import ProfileSection from '../../sections/profile/ProfileSection.jsx';
import { TargetaViva } from '../../components/universal/TargetaViva.jsx';

/* R22.1 (Gauntlet r221-dades-02/-04, r221-text-01/-08) · Adreces i identitats
   SINTÈTIQUES: cap mitjà ni fitxa d'una entitat real a les proves. */
const ORG_ID = '00000000-0000-4000-8000-0000000000a1';
const PORTADA_PROPIA = 'https://socdepoble.org/media/portada-sintetica-16x9.webp';
const VIDEO_PROPI = 'https://socdepoble.org/media/video-sintetic.mp4';

beforeEach(() => {
  vi.clearAllMocks();
  reiniciaMemoriaDirectori();
});

afterEach(() => {
  cleanup();
});

/* R22.1 (r221-text-10) · El títol diu el que es prova. Ací: els camps
   (perfilCamps, persona, organització i agent), els DTO, la degradació
   d'updateOrganization i les targetes (ProfileSection i TargetaViva). La fitxa
   pública (FitxaPublica de PerfilPublicSection) té la seua prova a
   PerfilPublicSection.video.test.jsx, i el directori del poble
   (EntitatsDelPoble), a src/sections/pobles/EntitatsDelPoble.video.test.jsx.
   PENDENT, explícit: la portada vertical 9:16 per a mòbil de l'acta
   261113_0442 no la fa servir cap llavor ni cap pantalla. */
describe('R22.1 · Peça 2 · Vídeo Principal + Portada: camps, DTO, updateOrganization i targetes (ProfileSection, TargetaViva)', () => {
  test('perfilCamps.js suporta heroVideo → hero_video_url en persona, organització i agent i bloqueja fonts forasteres', () => {
    for (const mena of ['persona', 'organitzacio', 'agent']) {
      const identitat = {
        mena,
        nom: 'Fitxa sintètica',
        dades: {
          hero_url: PORTADA_PROPIA,
          hero_video_url: VIDEO_PROPI,
        },
      };
      expect(fitxaDeLectura(identitat)).toMatchObject({
        heroImage: PORTADA_PROPIA,
        heroVideo: VIDEO_PROPI,
      });
      expect(documentDeFitxa(identitat)).toMatchObject({
        heroImage: PORTADA_PROPIA,
        heroVideo: VIDEO_PROPI,
      });

      expect(valorPerDesar(mena, 'heroVideo', VIDEO_PROPI)).toEqual({
        columna: 'hero_video_url',
        valor: VIDEO_PROPI,
      });
      expect(valorPerDesar(mena, 'heroVideo', 'sdp-media://mitjans/portada-video.mp4')).toEqual({
        columna: 'hero_video_url',
        valor: 'sdp-media://mitjans/portada-video.mp4',
      });
      expect(valorPerDesar(mena, 'heroVideo', '')).toEqual({
        columna: 'hero_video_url',
        valor: null,
      });
      expect(() => valorPerDesar(mena, 'heroVideo', 'https://evil.example/video.mp4')).toThrow();
    }
  });

  /* Gauntlet r221-dades-07 i r221-text-09 · El missatge diu «(.mp4 o .webm)» i
     el CHECK de 20261113060000 només admet el bucket públic: una capçalera
     pública no pot apuntar al bucket privat (cap visitant el pot signar), ni a
     un fitxer que no és vídeo, ni escapar amb '..'. */
  test('valorPerDesar només admet un fitxer .mp4/.webm propi o del bucket públic, mai el privat', () => {
    for (const mena of ['persona', 'organitzacio', 'agent']) {
      for (const dolenta of [
        'sdp-media://mitjans_privats/00000000-0000-4000-8000-000000000001/secret-familia.mp4',
        'https://socdepoble.cat/media/foto.webp',
        '/assets/uploads/brain/logotip.webp',
        'https://socdepoble.cat/media/sense-extensio',
        'sdp-media://mitjans/../fora.mp4',
        `https://socdepoble.org/media/${'v'.repeat(2050)}.mp4`,
        'https://socdepoble.org/media/salt\nde-linia.mp4',
      ]) {
        expect(() => valorPerDesar(mena, 'heroVideo', dolenta), `${mena} · ${dolenta.slice(0, 60)}`).toThrow(/\.mp4 o \.webm/);
      }
      expect(valorPerDesar(mena, 'heroVideo', 'https://socdepoble.cat/media/spot.webm?v=2')).toEqual({
        columna: 'hero_video_url', valor: 'https://socdepoble.cat/media/spot.webm?v=2',
      });
      expect(valorPerDesar(mena, 'heroVideo', '/media/video-propi.mp4')).toEqual({ columna: 'hero_video_url', valor: '/media/video-propi.mp4' });
    }
  });

  /* Gauntlet r221-text-05 i r221-ui-06 · El panell del vídeo només s'oferix
     quan la fila llegida porta la columna (el servidor la pot desar). */
  test('admetVideoDeCapcalera: només amb la columna a la fila (null inclòs), per a cada mena', () => {
    for (const mena of ['persona', 'empresa', 'grup', 'agent']) {
      expect(admetVideoDeCapcalera({ mena, dades: { hero_url: PORTADA_PROPIA } }), mena).toBe(false);
      expect(admetVideoDeCapcalera({ mena, dades: { hero_url: '', hero_video_url: null } }), mena).toBe(true);
      expect(admetVideoDeCapcalera({ mena, dades: { hero_video_url: VIDEO_PROPI } }), mena).toBe(true);
    }
    expect(admetVideoDeCapcalera({ mena: 'persona', dades: null })).toBe(false);
    expect(admetVideoDeCapcalera(null)).toBe(false);
  });

  test('perfilDOrganitzacio i perfilDePersona pinten només el vídeo de la fila, i cap altre', () => {
    const filaSenseColumna = {
      id: ORG_ID,
      slug: 'entitat-sintetica',
      name: 'Entitat sintètica',
      kind: 'company',
      hero_url: '',
      town_name: 'Poble sintètic',
    };
    const dtoBase = perfilDOrganitzacio(filaSenseColumna);
    expect(dtoBase.hero).toBe('');
    expect(Object.hasOwn(dtoBase, 'heroVideo')).toBe(false);
    expect(Object.hasOwn(perfilDOrganitzacio({ ...filaSenseColumna, hero_video_url: null }), 'heroVideo')).toBe(false);

    const dtoPropi = perfilDOrganitzacio({ ...filaSenseColumna, hero_url: PORTADA_PROPIA, hero_video_url: VIDEO_PROPI });
    expect(dtoPropi).toMatchObject({ hero: PORTADA_PROPIA, heroVideo: VIDEO_PROPI });

    const dtoPersona = perfilDePersona({
      id: '00000000-0000-4000-8000-000000000099',
      full_name: 'Veïna Productora',
      hero_url: PORTADA_PROPIA,
      hero_video_url: VIDEO_PROPI,
      is_public: true,
    }, null);
    expect(dtoPersona.heroVideo).toBe(VIDEO_PROPI);
  });

  test('updateOrganization degrada amb elegància (columnesOpcionals) quan hero_video_url encara no s’ha migrat al servidor remot', async () => {
    const errPgrst = new Error("Could not find the 'hero_video_url' column of 'organizations' in the schema cache");
    mocks.request
      .mockRejectedValueOnce(errPgrst)
      .mockResolvedValueOnce([{ id: ORG_ID, name: 'Entitat sintètica', slug: 'entitat-sintetica' }]);

    const parcial = await updateOrganization(ORG_ID, {
      name: 'Entitat sintètica',
      hero_video_url: VIDEO_PROPI,
    });
    expect(mocks.request).toHaveBeenCalledTimes(2);
    expect(parcial.campsNoDesats).toEqual(['hero_video_url']);

    // Quan només s'intenta desar hero_video_url sobre un servidor sense la columna, informa amb ErrorColumnaAbsent.
    await expect(
      updateOrganization(ORG_ID, { hero_video_url: VIDEO_PROPI }),
    ).rejects.toBeInstanceOf(ErrorColumnaAbsent);
  });

  test('ProfileSection i TargetaViva pinten el reproductor <video poster={hero_url} controls playsInline preload="metadata"> a la UniversalCard', () => {
    const dir = render(
      <ProfileSection
        agents={[{
          id: ORG_ID,
          name: 'Entitat sintètica',
          type: 'COMPANY',
          tag: 'EMPRESA',
          role: 'Productora',
          town_name: 'Poble sintètic',
          avatar_url: '/assets/avatars/avatar-corporatiu-quadrat.png',
          hero_url: PORTADA_PROPIA,
          hero_video_url: VIDEO_PROPI,
        }]}
      />,
    );
    const videoDirectori = dir.container.querySelector('.sp-card-media-container--video > video.sp-card-media--video');
    expect(videoDirectori).toBeTruthy();
    expect(videoDirectori.getAttribute('src')).toBe(VIDEO_PROPI);
    expect(videoDirectori.getAttribute('poster')).toBe(PORTADA_PROPIA);
    expect(videoDirectori.hasAttribute('controls')).toBe(true);
    expect(videoDirectori.hasAttribute('playsinline')).toBe(true);
    // R22.1 (r221-text-10) · El títol ho promet: es prova.
    expect(videoDirectori.getAttribute('preload')).toBe('metadata');

    cleanup();
    const viva = render(
      <TargetaViva
        document={{
          title: 'Entitat sintètica',
          subtitle: 'Productora',
          lead: 'Text sintètic',
          heroImage: PORTADA_PROPIA,
          heroVideo: VIDEO_PROPI,
        }}
        autor={{ nom: 'Entitat sintètica', poble: 'Poble sintètic' }}
      />,
    );
    const videoViva = viva.container.querySelector('.sp-card-media-container--video > video.sp-card-media--video');
    expect(videoViva).toBeTruthy();
    expect(videoViva.getAttribute('src')).toBe(VIDEO_PROPI);
    expect(videoViva.getAttribute('poster')).toBe(PORTADA_PROPIA);
    expect(videoViva.hasAttribute('controls')).toBe(true);
    expect(videoViva.hasAttribute('playsinline')).toBe(true);
    expect(videoViva.getAttribute('preload')).toBe('metadata');
  });
});
