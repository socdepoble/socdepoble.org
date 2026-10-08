/**
 * Decisió 3 del Mestre (261007, confirmada) · «Imatges externes al Mur:
 * PROHIBIDES (PRIVACITAT). Per a evitar el rastreig d'IPs dels usuaris per
 * part de tercers, només es permetran imatges allotjades localment o pujades
 * al nostre servidor.» Relleu 261007 (informe 1715, «Límits» §4).
 *
 * La targeta del Mur (la mateixa de /calendari i de l'històric de l'actor) i
 * la d'un acte (EventCard, pel mateix camí) passen la imatge i l'avatar pel
 * mode estricte (fontImatgePropia de utils/sanitize.js) i els demanen sense
 * referent (imatgePrivada). Una imatge de fora no es demana: cap <img> amb
 * eixa font; sense portada, cap; sense avatar, la silueta de sempre. Una de
 * pròpia es pinta igual que abans. Els orígens són sintètics.
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
  useUIState: () => ({ externalConfig: { dataMode: 'seed' } })
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: () => false,
  loadPerfilPublic: async () => null
}));

import { TargetaDelMur } from './TargetaDelMur.jsx';
import { fixaBaseRecursos, resolveAsset } from '../../config/assetResolver.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';

const GOOGLE = 'https://lh3.googleusercontent.com/a/pepa.png';
const RASTREIG = 'https://rastreig.example/p.gif?campanya=1';
const STORAGE = 'https://projecte-sdp.supabase.co';
const PAQUET = 'https://wp.example/wp-content/plugins/soc-de-poble/dist';
const LOGO_SDP = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';

const pinta = (item) => render(<TargetaDelMur item={item} />).container.querySelector('article');
const portada = (article) => article.querySelector('img.sp-card-media');
const avatar = (article) => article.querySelector('img.sp-card-avatar');
const silueta = (article) => article.querySelector('.sp-card-avatar--fallback');
const fonts = (article) => [...article.querySelectorAll('img')].map((img) => img.getAttribute('src'));

const publicacio = (extra) => ({ id: 'p1', type: 'post', title: 'Festa major', author_name: 'Pepa', created_at: '2026-09-01T10:00:00.000Z', ...extra });

afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

describe('Decisió 3 · una publicació amb imatges de tercers', () => {
  /* '/\rastreig.example/…' · el navegador llig la barra inversa com a barra:
     és un altre origen, i el filtre de sempre (isSafeAsset) el deixava passar. */
  test('ni la portada ni l’avatar de fora es demanen: cap <img> amb eixes fonts, i la silueta de sempre', () => {
    for (const [image, author_avatar] of [[RASTREIG, GOOGLE], [GOOGLE, RASTREIG], ['/\\rastreig.example/p.gif', 'https://avatars.githubusercontent.com/u/1']]) {
      const article = pinta(publicacio({ image, author_avatar }));
      expect(fonts(article)).toEqual([]);
      expect(portada(article)).toBeNull();
      expect(article.querySelector('.sp-card-media-container')).toBeNull();
      expect(avatar(article)).toBeNull();
      expect(silueta(article)).not.toBeNull();
      // La boina es queda: el nom de qui signa continua.
      expect(article.querySelector('.sp-card-author-name').textContent).toBe('Pepa');
      cleanup();
    }
  });

  test('un avatar de Google no cau al logotip de Sóc de Poble (no signa amb la marca la publicació d’un veí)', () => {
    const article = pinta(publicacio({ author_avatar: GOOGLE }));
    expect(fonts(article).some((font) => font?.includes('logo-socdepoble'))).toBe(false);
    expect(silueta(article)).not.toBeNull();
  });

  test('image_url, imageSrc i les fotos d’un producte de fora tampoc es demanen', () => {
    expect(fonts(pinta(publicacio({ image_url: RASTREIG })))).toEqual([resolveAsset(LOGO_SDP)]);
    cleanup();
    expect(portada(pinta(publicacio({ imageSrc: GOOGLE })))).toBeNull();
    cleanup();
    const producte = { id: 'm1', type: 'market', title: 'Mel', seller: 'Apicultora', images: [RASTREIG, GOOGLE], avatar_url: GOOGLE };
    const article = pinta(producte);
    expect(fonts(article)).toEqual([]);
    expect(silueta(article)).not.toBeNull();
  });
});

describe('Decisió 3 · les imatges pròpies es pinten com abans', () => {
  test('/assets/ del paquet: la portada i l’avatar, amb la mateixa font i sense referent', () => {
    const article = pinta(publicacio({ image: '/assets/mur/festa.webp', author_avatar: '/assets/gent/pepa.webp' }));
    expect(portada(article).getAttribute('src')).toBe('/assets/mur/festa.webp');
    expect(avatar(article).getAttribute('src')).toBe('/assets/gent/pepa.webp');
    expect(portada(article).getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(avatar(article).getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(silueta(article)).toBeNull();
  });

  test('sense avatar declarat, el logotip de reserva de sempre', () => {
    const article = pinta(publicacio({ image: '/assets/mur/festa.webp' }));
    expect(avatar(article).getAttribute('src')).toBe(resolveAsset(LOGO_SDP));
  });

  test('el nostre Storage, quan la configuració el registra (runtime.js), es pinta', () => {
    permetOrigenMitjans(STORAGE);
    const foto = `${STORAGE}/storage/v1/object/public/mitjans/poble/u/general/f.webp`;
    const article = pinta(publicacio({ image: foto, author_avatar: `${STORAGE}/storage/v1/object/public/mitjans/poble/u/perfil/a.webp` }));
    expect(fonts(article)).toEqual([`${STORAGE}/storage/v1/object/public/mitjans/poble/u/perfil/a.webp`, foto]);
  });

  test('una referència sdp-media:// i una data:image fan el mateix camí que abans (resolveAsset, sense filtre de més)', () => {
    const ref = 'sdp-media://mitjans/poble/u/general/f.webp';
    expect(portada(pinta(publicacio({ image: ref }))).getAttribute('src')).toBe(resolveAsset(ref));
    cleanup();
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    expect(portada(pinta(publicacio({ image: png }))).getAttribute('src')).toBe(png);
  });

  test('el paquet servit des d’un altre origen (plugin-url de WordPress o Sollutia): els seus recursos continuen', () => {
    /* El que fa l'element <soc-de-poble> (PedraSecaEmbed.jsx, _aplicaBaseRecursos). */
    fixaBaseRecursos(PAQUET);
    permetOrigenMitjans(PAQUET);
    const article = pinta(publicacio({ image: '/assets/mur/festa.webp' }));
    expect(portada(article).getAttribute('src')).toBe(`${PAQUET}/assets/mur/festa.webp`);
    expect(avatar(article).getAttribute('src')).toBe(`${PAQUET}${LOGO_SDP}`);
    cleanup();
    const deFora = pinta(publicacio({ image: '/assets/mur/festa.webp', author_avatar: GOOGLE }));
    expect(avatar(deFora)).toBeNull();
    expect(silueta(deFora)).not.toBeNull();
  });
});

describe('Decisió 3 · un acte del Mur (EventCard pel mateix camí)', () => {
  const acte = (extra) => ({ id: 'fira', type: 'event', title: 'Fira', date: '2026-11-14', author_name: 'Associació', ...extra });

  test('la imatge i l’avatar de fora no es demanen', () => {
    const article = pinta(acte({ image_url: GOOGLE, author_avatar: RASTREIG }));
    expect(fonts(article)).toEqual([]);
    expect(silueta(article)).not.toBeNull();
  });

  test('les pròpies es pinten com abans, sense referent', () => {
    const article = pinta(acte({ image_url: '/assets/agenda/fira.webp' }));
    expect(portada(article).getAttribute('src')).toBe('/assets/agenda/fira.webp');
    expect(portada(article).getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(avatar(article).getAttribute('src')).toBe(resolveAsset(LOGO_SDP));
  });
});
