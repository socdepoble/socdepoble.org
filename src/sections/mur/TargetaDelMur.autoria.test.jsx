/**
 * T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · La boina taronja
 * d'una targeta del Mur enllaça SEMPRE a la pàgina de qui signa:
 *  · una persona, al seu perfil (el Javi, /gent/javillinares);
 *  · l'entitat pilot («Sóc de Poble», per identificador), al projecte;
 *  · una pàgina del sistema o una publicació signada amb la reserva «Sóc de
 *    Poble» (sense nom ni identitat), també al projecte. Derogat per l'ordre
 *    del Mestre del 261004 (prompt 261004_0515): el sistema anava a /pobles;
 *  · un nom sense identitat coneguda no s'endevina: sense enllaç.
 * Les publicacions i els actes (EventCard) seguixen la mateixa regla.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));

import { TargetaDelMur, rutaDeLaBoinaDelMur } from './TargetaDelMur.jsx';
import { targetesDeSistema } from './targetesMur.js';
import { MARKET_ITEMS } from '../mercat/marketContent.js';
import { EVENTS } from './eventsContent.js';
import { RUTA_PROJECTE } from '../../config/navigation.js';
import { PAGE_COPY } from '../text/pageContent.js';

const MAC = MARKET_ITEMS.find((item) => item.id === 'mac-mini-m4');
const SAMARRETA = MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');

const boina = (item) => {
  const article = render(<TargetaDelMur item={item} />).container.querySelector('article');
  const capcal = article.querySelector('header.sp-card-header');
  return {
    primer: article.firstElementChild === capcal,
    nom: capcal.querySelector('.sp-card-author-name')?.textContent ?? null,
    href: capcal.querySelector('a.sp-card-author-link')?.getAttribute('href') ?? null
  };
};

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); });

describe('T6 · la boina del Mur porta a la pàgina de qui signa', () => {
  test('una pàgina del sistema signa «Sóc de Poble» i porta al projecte, no a /pobles', () => {
    const [sistema] = targetesDeSistema(PAGE_COPY);
    expect(sistema.isSystem).toBe(true);
    expect(boina(sistema)).toEqual({ primer: true, nom: 'Sóc de Poble', href: RUTA_PROJECTE });
    expect(RUTA_PROJECTE).toBe('/projecte');
  });

  test('una publicació sense nom ni identitat signa amb la reserva i porta al projecte', () => {
    expect(boina({ id: 'p1', type: 'post', title: 'Sense signatura', created_at: '2026-09-01T10:00:00.000Z' }))
      .toEqual({ primer: true, nom: 'Sóc de Poble', href: '/projecte' });
  });

  test('el Javi, al seu perfil; l’entitat pilot, al projecte, per identificador', () => {
    expect(boina(MAC)).toMatchObject({ nom: 'Javi', href: '/gent/javillinares' });
    expect(boina(SAMARRETA)).toMatchObject({ nom: 'Sóc de Poble', href: '/projecte' });
    expect(boina({ id: 'f', type: 'post', title: 'Pa', author_name: 'Forn', author_org_id: 'forn' })).toMatchObject({ href: '/empresa/forn' });
  });

  test('un nom sense identitat coneguda queda sense enllaç (no s’endevina pel nom)', () => {
    const article = render(<TargetaDelMur item={{ id: 'n', type: 'post', title: 'Avís', author_name: 'Sóc de Poble' }} />).container;
    expect(article.querySelector('a.sp-card-author-link')).toBeNull();
    expect(article.querySelector('span.sp-card-author-block')).not.toBeNull();
    cleanup();
    expect(boina({ id: 'm', type: 'market', title: 'Cistella', seller: 'Pepa' }).href).toBeNull();
  });

  test('un acte: la persona que el signa, al seu perfil; el sistema, al projecte', () => {
    expect(boina({ id: 'e1', type: 'event', title: 'Ball', date: '2026-11-14', author_name: 'Javi', owner_user_id: 'javillinares' }))
      .toMatchObject({ nom: 'Javi', href: '/gent/javillinares' });
    cleanup();
    expect(boina({ id: 'e2', type: 'event', title: 'Festa', date: '2026-11-14', isSystem: true }))
      .toMatchObject({ nom: 'Sóc de Poble', href: '/projecte' });
    cleanup();
    expect(boina({ id: 'e3', type: 'event', title: 'Reunió', date: '2026-11-14', author_name: 'Pepa' }).href).toBeNull();
  });

  /* Revisió del front «boina-publicar» (261004) · L'acte de la llavor «2n Aplec
     pel Territori» signa Sóc de Poble: porta l'id de l'entitat pilot a la
     dada (eventsSeed.js), com la samarreta, i la boina va al projecte per
     l'id. El mateix al Mur i a /calendari (la mateixa targeta). */
  test('l’acte de la llavor signat per Sóc de Poble porta al projecte, per identificador', () => {
    const [aplec] = EVENTS;
    expect(aplec.id).toBe('aplec-2023');
    expect(boina(aplec)).toMatchObject({ nom: 'Sóc de Poble', href: RUTA_PROJECTE });
  });

  test('rutaDeLaBoinaDelMur: qui signa mana; després, el sistema i la reserva', () => {
    expect(rutaDeLaBoinaDelMur({ isSystem: true, author_name: 'Javi', owner_user_id: 'javillinares' })).toBe('/gent/javillinares');
    expect(rutaDeLaBoinaDelMur({ isSystem: true })).toBe('/projecte');
    expect(rutaDeLaBoinaDelMur({})).toBe('/projecte');
    expect(rutaDeLaBoinaDelMur({ seller: 'Pepa' })).toBeUndefined();
    expect(rutaDeLaBoinaDelMur({ author_name: 'Pepa' })).toBeUndefined();
  });
});
