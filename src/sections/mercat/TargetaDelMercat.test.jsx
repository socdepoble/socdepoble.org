/**
 * Esmena 2 del pla 261007_1645 · TargetaDelMercat és una extracció pura del
 * JSX de cada producte de MercatSection (Llei del Píxel): la mateixa
 * UniversalCard, amb les props de targetaDeProducte.js, el seu objecte,
 * Connectar cap a /connectar i el peu canònic. Fora de l'App (sense
 * UIProvider, l'espècimen del catàleg) es pinta amb la reserva en valencià.
 *
 * Decisió 3 del Mestre (261007, confirmada) · «Imatges externes al Mur:
 * PROHIBIDES (PRIVACITAT).» Relleu 261007 (peça «imatges-detall») · La foto i
 * l'avatar passen pel mode estricte (fontImatgePropia) i es demanen sense
 * referent (imatgePrivada), com TargetaDelMur. Una de fora no es demana; una
 * de pròpia es pinta igual, amb el mateix src i un referrerpolicy de més
 * (cap píxel). Els orígens són sintètics.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), ui: true }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => {
    if (!mocks.ui) throw new Error('fora de l’app');
    return { t: (_, alternativa) => alternativa };
  },
  useUIState: () => ({ externalConfig: {} })
}));

import { TargetaDelMercat } from './TargetaDelMercat.jsx';
import { UniversalCard } from '../../components/PedraSeca';
import { objecteDe, rutaConnectarObjecte } from '../../config/navigation';
import { MARKET_ITEMS } from './marketContent.js';
import { propsDeTargetaDeProducte } from './targetaDeProducte.js';
import { fixaBaseRecursos } from '../../config/assetResolver.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';

const t = (_, alternativa) => alternativa;
const senseIds = (html) => html.replace(/\s(?:id|for|aria-controls|aria-labelledby|aria-describedby)="[^"]*"/g, '');
/* Decisió 3 (261007) · L'únic canvi del DOM per a les imatges pròpies. */
const senseReferent = (html) => html.replaceAll(' referrerpolicy="no-referrer"', '');

/* El JSX que MercatSection pintava abans de l'extracció, tal qual. */
function TargetaDAbans({ item }) {
  const producte = objecteDe(item, 'mercat');
  return (
    <UniversalCard
      {...propsDeTargetaDeProducte(item, t)}
      objecte={producte}
      onConnect={() => mocks.navigate(rutaConnectarObjecte(producte))}
      hasFooter={true}
      showTranslate={true}
      showComment={true}
      showShare={true}
      showConnect={true}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.ui = true;
});
afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

describe('TargetaDelMercat', () => {
  /* Decisió 3 del Mestre (261007) · Abans esta prova exigia el DOM d'abans
     byte a byte. La decisió hi afig referrerpolicy="no-referrer" a cada <img>
     (imatgePrivada): la llavor només porta imatges pròpies, i sense eixe
     atribut el DOM és el d'abans, amb els mateixos src. */
  test.each(MARKET_ITEMS.map((item) => [item.id, item]))('%s: el mateix DOM que el JSX d’abans de MercatSection, amb les imatges sense referent', (_id, item) => {
    const contenidor = render(<TargetaDelMercat item={item} />).container;
    const ara = contenidor.innerHTML;
    const imatges = [...contenidor.querySelectorAll('img')];
    expect(imatges.every((img) => img.getAttribute('referrerpolicy') === 'no-referrer')).toBe(true);
    cleanup();
    const abans = render(<TargetaDAbans item={item} />).container.innerHTML;
    expect(senseIds(senseReferent(ara))).toBe(senseIds(abans));
  });

  test('Connectar porta a /connectar amb el descriptor del producte', () => {
    const samarreta = MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
    render(<TargetaDelMercat item={samarreta} />);
    fireEvent.click(screen.getByRole('button', { name: /connectar/i }));
    expect(mocks.navigate).toHaveBeenCalledWith(rutaConnectarObjecte(objecteDe(samarreta, 'mercat')));
  });

  test('fora de l’App (sense UIProvider): es pinta igual, amb la reserva en valencià', () => {
    const samarreta = MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
    const dins = render(<TargetaDelMercat item={samarreta} />).container.innerHTML;
    cleanup();
    mocks.ui = false;
    const fora = render(<TargetaDelMercat item={samarreta} />).container.innerHTML;
    expect(senseIds(fora)).toBe(senseIds(dins));
  });
});

describe('Decisió 3 · imatges de tercers i pròpies a la targeta del producte', () => {
  const GOOGLE = 'https://lh3.googleusercontent.com/a/pepa.png';
  const RASTREIG = 'https://rastreig.example/p.gif';
  const STORAGE = 'https://mercat-1.supabase.test';
  const PAQUET = 'https://wp-mercat.example/wp-content/plugins/soc-de-poble/dist';
  const producte = (extra) => ({ id: 'mel', title: 'Mel de romer', seller: 'Pepa', created_at: '2026-09-01T10:00:00.000Z', ...extra });
  const pinta = (item) => render(<TargetaDelMercat item={item} />).container.querySelector('article');
  const fonts = (article) => [...article.querySelectorAll('img')].map((img) => img.getAttribute('src'));
  const silueta = (article) => article.querySelector('.sp-card-avatar--fallback');

  test('ni la foto ni l’avatar de fora es demanen: cap <img> amb eixes fonts, sense bloc d’imatge i la silueta', () => {
    for (const [images, author_avatar] of [[[RASTREIG], GOOGLE], [[GOOGLE], RASTREIG], [['/\\rastreig.example/p.gif'], 'https://avatars.githubusercontent.com/u/1']]) {
      const article = pinta(producte({ images, author_avatar }));
      expect(fonts(article)).toEqual([]);
      expect(article.querySelector('.sp-card-media-container')).toBeNull();
      expect(silueta(article)).not.toBeNull();
      // La boina es queda: el nom de qui ven continua.
      expect(article.querySelector('.sp-card-author-name').textContent).toBe('Pepa');
      cleanup();
    }
  });

  test('un avatar_url de fora (sense author_avatar) tampoc es demana', () => {
    const article = pinta(producte({ images: ['/assets/mercat/mel.webp'], avatar_url: GOOGLE }));
    expect(fonts(article)).toEqual(['/assets/mercat/mel.webp']);
    expect(silueta(article)).not.toBeNull();
  });

  test('/assets/ del paquet: la foto i l’avatar, amb la mateixa font que abans i sense referent', () => {
    const item = producte({ images: ['/assets/mercat/mel.webp'], author_avatar: '/assets/gent/pepa.webp' });
    const article = pinta(item);
    expect(fonts(article)).toEqual(['/assets/gent/pepa.webp', '/assets/mercat/mel.webp']);
    expect([...article.querySelectorAll('img')].every((img) => img.getAttribute('referrerpolicy') === 'no-referrer')).toBe(true);
    cleanup();
    expect(fonts(render(<TargetaDAbans item={item} />).container)).toEqual(['/assets/gent/pepa.webp', '/assets/mercat/mel.webp']);
  });

  test('el nostre Storage, quan la configuració el registra, es pinta com abans', () => {
    permetOrigenMitjans(STORAGE);
    const foto = `${STORAGE}/storage/v1/object/public/mitjans/poble/u/mercat/mel.webp`;
    const cara = `${STORAGE}/storage/v1/object/public/mitjans/poble/u/perfil/a.webp`;
    expect(fonts(pinta(producte({ images: [foto], author_avatar: cara })))).toEqual([cara, foto]);
  });

  test('un sdp-media:// cru no es pinta a la targeta, com abans (el filtre de sempre); una data:image ràster, sí', () => {
    const item = producte({ images: ['sdp-media://mitjans/poble/u/mercat/mel.webp'] });
    expect(fonts(pinta(item))).toEqual([]);
    cleanup();
    expect(fonts(render(<TargetaDAbans item={item} />).container)).toEqual([]);
    cleanup();
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    expect(fonts(pinta(producte({ images: [png] })))).toEqual([png]);
  });

  /* Revisió adversarial del 261008 · Canvi declarat: el mode estricte només
     admet data:image ràster. Una data:image/svg+xml, que abans passava pel
     filtre de la targeta (isSafeAsset), ja no es pinta; cap font legítima
     n'escriu. */
  test('una foto o un avatar en data:image/svg+xml ja no es pinten (abans, sí)', () => {
    /* Dos valors diferents: imatgesDeProducte no admet com a foto l'avatar de qui ven. */
    const FOTO = 'data:image/svg+xml;base64,PHN2Zy8+';
    const CARA = 'data:image/svg+xml;base64,PHN2ZyAvPg==';
    const item = producte({ images: [FOTO], author_avatar: CARA });
    const article = pinta(item);
    expect(fonts(article)).toEqual([]);
    expect(silueta(article)).not.toBeNull();
    cleanup();
    expect(fonts(render(<TargetaDAbans item={item} />).container)).toEqual([CARA, FOTO]);
  });

  test('el paquet servit des d’un altre origen (plugin-url): els seus recursos continuen; un avatar de fora, no', () => {
    /* El que fa l'element <soc-de-poble> (PedraSecaEmbed.jsx, _aplicaBaseRecursos). */
    fixaBaseRecursos(PAQUET);
    permetOrigenMitjans(PAQUET);
    expect(fonts(pinta(producte({ images: ['/assets/mercat/mel.webp'], author_avatar: '/assets/gent/pepa.webp' }))))
      .toEqual([`${PAQUET}/assets/gent/pepa.webp`, `${PAQUET}/assets/mercat/mel.webp`]);
    cleanup();
    const deFora = pinta(producte({ images: ['/assets/mercat/mel.webp'], author_avatar: GOOGLE }));
    expect(fonts(deFora)).toEqual([`${PAQUET}/assets/mercat/mel.webp`]);
    expect(silueta(deFora)).not.toBeNull();
  });
});
