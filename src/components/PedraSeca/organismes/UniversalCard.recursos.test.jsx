/**
 * UniversalCard · base dels recursos (T5, 261001).
 *
 * L'avatar de Pobles (avatar_url cru) i el directori de perfils (/perfil)
 * arribaven a la targeta amb '/assets/…' sense resoldre.
 * Ara imageUrl i avatarUrl es resolen en pintar-los. Sense base, idèntics.
 * Gauntlet R21 · SectionItemCard s'ha retirat (orfe, Tractor Pedra Seca
 * LLEI_08): el cas del directori el guarda ara ProfileSection.poble.test.jsx
 * sobre la targeta que pinta /perfil.
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../../../app/contexts/RouterContext', async () => {
  const { createElement: h } = await import('react');
  return {
    useNavigate: () => vi.fn(),
    Link: ({ to, children, ...resta }) => h('a', { href: to, ...resta }, children)
  };
});
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

import { UniversalCard } from './UniversalCard.jsx';
import { fixaBaseRecursos } from '../../../config/assetResolver.js';

const PAQUET = 'https://wp.example/wp-content/plugins/socdepoble-enxufe/dist';
const IMATGE = '/assets/towns/tibi/1.jpg';
const AVATAR = '/assets/towns/tibi/2.jpg';

afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

const fonts = (props) => {
  const { container } = render(<UniversalCard title="Tibi" hasFooter={false} {...props} />);
  const resultat = {
    imatge: container.querySelector('img.sp-card-media')?.getAttribute('src') ?? null,
    avatar: container.querySelector('img.sp-card-avatar')?.getAttribute('src') ?? null
  };
  cleanup();
  return resultat;
};

test('sense base, imageUrl i avatarUrl es pinten idèntics (Llei del Píxel)', () => {
  expect(fonts({ imageUrl: IMATGE, avatarUrl: AVATAR })).toEqual({ imatge: IMATGE, avatar: AVATAR });
});

test('amb base, imageUrl i avatarUrl pengen del paquet', () => {
  fixaBaseRecursos(PAQUET);
  expect(fonts({ imageUrl: IMATGE, avatarUrl: AVATAR })).toEqual({ imatge: `${PAQUET}${IMATGE}`, avatar: `${PAQUET}${AVATAR}` });
});

test('un valor ja resolt pel consumidor (Mercat, Mur) no es duplica; https: i data: intactes', () => {
  fixaBaseRecursos(PAQUET);
  expect(fonts({ imageUrl: `${PAQUET}${IMATGE}`, avatarUrl: `${PAQUET}${AVATAR}` }))
    .toEqual({ imatge: `${PAQUET}${IMATGE}`, avatar: `${PAQUET}${AVATAR}` });
  expect(fonts({ imageUrl: 'https://cdn.example/x.jpg', avatarUrl: 'data:image/png;base64,AAAA' }))
    .toEqual({ imatge: 'https://cdn.example/x.jpg', avatar: 'data:image/png;base64,AAAA' });
});

test('amb base, una font insegura continua sense pintar-se', () => {
  fixaBaseRecursos(PAQUET);
  expect(fonts({ imageUrl: 'javascript:alert(1)', avatarUrl: 'javascript:alert(1)', author: 'Pepa' }))
    .toEqual({ imatge: null, avatar: null });
});
