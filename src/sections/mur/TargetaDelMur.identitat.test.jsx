/**
 * Revisió del Gauntlet 261017 (ID1 i ID2; ordre del Mestre: «TERMINANTMENT
 * PROHIBIT que aparega el logotip verd de l'entitat Sóc de Poble associat a
 * Javi Llinares», i relleu 3: una sessió de veres és UNA identitat a totes les
 * superfícies) · La boina de la targeta del Mur.
 *   · ID1 · Una publicació que signa una PERSONA (autorDe: ownerUserId,
 *     owner_user_id, author_user_id o author_id) sense cap avatar ja no cau al
 *     logotip de Sóc de Poble: la silueta de sempre, la mateixa de la
 *     targeta del Mercat, del lector del MAS i de la barra taronja. Una
 *     publicació sense signatura o d'una entitat conserva el logotip de
 *     reserva (TargetaDelMur.imatgesPropies.test.jsx).
 *   · ID2 · La foto de perfil pujada a l'app (sdp-media://mitjans/…, el
 *     bucket públic) arriba a la targeta tal qual i la resol el port
 *     (UniversalCard, useResolvedAsset): abans resolveAsset la convertia en
 *     '/sdp-media://…', un camí del mateix origen que no carregava res.
 * Els identificadors són sintètics: cap és un àlies de la persona pilot.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => () => {},
  useSearchParams: () => [new URLSearchParams(), () => {}],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: () => false,
  loadPerfilPublic: async () => null
}));
/* Com la capacitat 'mitjans': el port resol una referència opaca a una URL
   servible (ací, del mateix origen); qualsevol altra font, tal qual. Cada
   referència que se li demana queda anotada (port.demanades): una del bucket
   privat seria una URL signada al client de cada lector. */
const port = vi.hoisted(() => ({ demanades: [] }));
vi.mock('../../hooks/useResolvedAsset.js', async (importOriginal) => ({
  ...await importOriginal(),
  useResolvedAsset: (ref) => {
    if (typeof ref === 'string' && ref !== '') port.demanades.push(ref);
    return typeof ref === 'string' && ref.startsWith('sdp-media://') ? `/media/${ref.slice('sdp-media://'.length)}` : '';
  }
}));

import { TargetaDelMur } from './TargetaDelMur.jsx';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';

const UUID = '7b0c6f1e-2c1a-4d7e-9a55-0f1d2e3c4b5a';
const pinta = (item) => render(<TargetaDelMur item={item} />).container.querySelector('article');
const fonts = (article) => [...article.querySelectorAll('img')].map((img) => img.getAttribute('src'));
const silueta = (article) => article.querySelector('header.sp-card-header .sp-card-avatar--fallback');
const nom = (article) => article.querySelector('.sp-card-author-name')?.textContent ?? null;
const publicacio = (extra) => ({ id: 'p1', type: 'feed', title: 'Nota de Javi', author_name: 'Javi Llinares', created_at: '2026-10-17T10:00:00.000Z', ...extra });

afterEach(cleanup);

describe('ID1 · una persona sense foto mai no signa amb el logotip de Sóc de Poble', () => {
  test('per cada clau de persona (autorDe), la silueta i el seu nom; cap <img> del logotip', () => {
    for (const clau of ['ownerUserId', 'owner_user_id', 'author_user_id', 'author_id']) {
      const article = pinta(publicacio({ [clau]: UUID }));
      expect(nom(article), clau).toBe('Javi Llinares');
      expect(fonts(article).some((font) => font?.includes('logo-socdepoble')), clau).toBe(false);
      expect(silueta(article), clau).not.toBeNull();
      cleanup();
    }
  });

  test('una entitat sense logo i una publicació sense signatura conserven el logotip de reserva (Llei del Píxel)', () => {
    expect(fonts(pinta(publicacio({ author_name: 'Forn de la Torre', author_org_id: 'forn' })))).toContain(DEFAULT_AUTHOR.avatarUrl);
    cleanup();
    expect(fonts(pinta(publicacio({})))).toContain(DEFAULT_AUTHOR.avatarUrl);
  });

  /* Revisió del Gauntlet 261017 (ID1, actes) · Un acte que signa una persona
     sense foto pintava el logotip a la seua targeta (EventCard queia a
     DEFAULT_AUTHOR) i la silueta al seu detall (elementDeSeccio.js). Ara la
     targeta diu el mateix que el detall. */
  test('un acte que signa una persona sense foto: la silueta, com al seu detall; l’entitat i l’acte sense signatura, el logotip', () => {
    const acte = (extra) => ({ id: 'fira', type: 'event', title: 'Fira', date: '2026-11-14', author_name: 'Pepa Soler', ...extra });
    for (const clau of ['ownerUserId', 'owner_user_id', 'author_user_id', 'author_id']) {
      const article = pinta(acte({ [clau]: UUID }));
      expect(nom(article), clau).toBe('Pepa Soler');
      expect(fonts(article).some((font) => font?.includes('logo-socdepoble')), clau).toBe(false);
      expect(silueta(article), clau).not.toBeNull();
      cleanup();
    }
    expect(fonts(pinta(acte({ author_name: 'Forn de la Torre', author_org_id: 'forn' })))).toContain(DEFAULT_AUTHOR.avatarUrl);
    cleanup();
    expect(fonts(pinta(acte({ author_name: undefined })))).toContain(DEFAULT_AUTHOR.avatarUrl);
  });
});

describe('ID2 · la foto de perfil pujada (sdp-media://mitjans/…) la resol el port', () => {
  test('la boina pinta la URL del port, mai la referència crua ni «/sdp-media://…»', () => {
    const article = pinta(publicacio({ ownerUserId: UUID, author_avatar: 'sdp-media://mitjans/t/u/avatars/a.webp' }));
    const avatar = article.querySelector('header.sp-card-header img.sp-card-avatar');
    expect(avatar?.getAttribute('src')).toBe('/media/mitjans/t/u/avatars/a.webp');
    expect(fonts(article).some((font) => /sdp-media/i.test(font || ''))).toBe(false);
  });

  /* Revisió del Gauntlet 261017 (ID2, contrast) · Només el bucket públic
     passa tal qual. Abans qualsevol referència opaca hi passava, també
     sdp-media://mitjans_privats/…: el client de cada lector demanava al port
     que en signara una URL (storage.js, createSignedUrl), que només podia
     obrir la propietària. Una referència que no és del bucket públic no es
     demana: la silueta, sense cap «/sdp-media://…» ni cap URL del port. */
  test('una referència del bucket privat o d’un altre bucket no es demana al port: la silueta', () => {
    for (const ref of ['sdp-media://mitjans_privats/t/u/avatars/a.webp', 'SDP-MEDIA://mitjans_privats/t/u/a.webp', 'sdp-media://altres/t/u/a.webp',
      /* Contrast final · El prefix del bucket públic amb un camí que hi puja (o brut) tampoc. */
      'sdp-media://mitjans/../mitjans_privats/t/u/a.webp', 'sdp-media://mitjans/%2e%2e/mitjans_privats/a.webp', 'sdp-media://mitjans/t\\..\\a.webp']) {
      port.demanades = [];
      const article = pinta(publicacio({ ownerUserId: UUID, author_avatar: ref }));
      expect(port.demanades, ref).toEqual([]);
      expect(fonts(article).some((font) => /sdp-media|\/media\//i.test(font || '')), ref).toBe(false);
      expect(silueta(article), ref).not.toBeNull();
      cleanup();
    }
  });

  test('la del bucket públic, també en majúscules, sí: el port rep la forma canònica', () => {
    port.demanades = [];
    const article = pinta(publicacio({ ownerUserId: UUID, author_avatar: 'SDP-MEDIA://mitjans/t/u/avatars/a.webp' }));
    expect(port.demanades).toContain('sdp-media://mitjans/t/u/avatars/a.webp');
    expect(article.querySelector('header.sp-card-header img.sp-card-avatar')?.getAttribute('src')).toBe('/media/mitjans/t/u/avatars/a.webp');
  });
});
