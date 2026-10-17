/**
 * T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · La barra taronja
 * d'una publicació pròpia vista des del MAS (PublicacioDetall) enllaça a la
 * pàgina de qui la signa, com la seua targeta al Mur:
 *  · una persona, al seu perfil; l'entitat pilot (per identificador), al
 *    projecte;
 *  · sense nom propi, la reserva «Sóc de Poble» va al projecte;
 *  · un nom sense identitat coneguda no s'endevina: sense enllaç.
 * Llei del Píxel: el nom, l'avatar i el poble de la barra no canvien.
 * Onada 8 (261009) · «Al projecte» és ara el perfil de Sóc de Poble
 * (RUTA_PERFIL_PROJECTE), mai /projecte.
 */
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: () => {}, t: (_, alternativa) => alternativa,
  identitat: { actor: { tipus: 'persona', id: 'U', nom: 'Pep' } },
  core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] },
  mur: { status: 'ready', feedPosts: [], events: [], marketItems: [] },
  /* Sense UIProvider (null): fora de l'app, cap crida al port. */
  ui: null, capacitats: new Set(), perfil: null, loadPerfilPublic: null
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  useUIState: () => {
    if (!mocks.ui) throw new Error('fora de l’app');
    return mocks.ui;
  }
}));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat),
  loadPerfilPublic: (...args) => mocks.loadPerfilPublic(...args)
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'U' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));

import { PublicacioDetall, rutaDeLaBarraDeLaPublicacio } from './PublicacioDetall.jsx';
import { publicacioComANota } from './masDeLUsuari.js';
import { oblidaEntitatDelProjecte, RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';
import { ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';

const CREAT = '2026-09-20T09:15:00Z';

/* L'autoria de la barra taronja: el nom que es llig i on porta (null sense enllaç). */
function barra(item, seccio = 'mur') {
  const { container } = render(<PublicacioDetall item={publicacioComANota({ created_at: CREAT, ...item }, seccio)} />);
  const autor = container.querySelector('section.bar-orange .sp-card-author');
  return {
    nom: autor?.querySelector('.sp-card-author-name')?.textContent ?? null,
    href: autor?.matches('a.sp-card-author-link') ? autor.getAttribute('href') : null
  };
}

afterEach(() => {
  cleanup();
  oblidaEntitatDelProjecte();
  mocks.ui = null;
  mocks.capacitats = new Set();
});

describe('T6 · la barra taronja de PublicacioDetall porta a la pàgina de qui signa', () => {
  test('sense nom propi, la reserva «Sóc de Poble» porta al projecte', () => {
    expect(barra({ id: 'coca', title: 'Recepta de coca' })).toEqual({ nom: 'Sóc de Poble', href: RUTA_PERFIL_PROJECTE });
  });

  /* Gauntlet 261016 · diürn 1530 (Bloc -1; ordre del Mestre: la persona pilot
     és «Javi Llinares») · Derogat el «Javi» d'esta prova: la barra de la
     persona pilot porta el seu nom sencer (signaturaDeQuiSigna), com la barra
     de la seua pàgina, encara que l'element diga «Javi». */
  test('una persona, al seu perfil; l’entitat pilot, al projecte; una altra entitat, al seu perfil', () => {
    expect(barra({ id: 'mac', title: 'Mac', author_name: 'Javi', owner_user_id: 'javillinares' }, 'mercat'))
      .toEqual({ nom: 'Javi Llinares', href: '/gent/javillinares' });
    cleanup();
    expect(barra({ id: 'samarreta', title: 'Samarreta', seller: 'Sóc de Poble', author_entity_id: 'socdepoble' }, 'mercat'))
      .toEqual({ nom: 'Sóc de Poble', href: RUTA_PERFIL_PROJECTE });
    cleanup();
    expect(barra({ id: 'pa', title: 'Pa', author_name: 'Forn', author_org_id: 'forn' }))
      .toEqual({ nom: 'Forn', href: '/empresa/forn' });
  });

  test('un nom sense identitat coneguda queda sense enllaç (no s’endevina pel nom)', () => {
    expect(barra({ id: 'avis', title: 'Avís', author_name: 'Sóc de Poble' })).toEqual({ nom: 'Sóc de Poble', href: null });
    cleanup();
    expect(barra({ id: 'cistella', title: 'Cistella', seller: 'Pepa' }, 'mercat')).toEqual({ nom: 'Pepa', href: null });
  });

  /* T6 en remot · una publicació de l'entitat pilot porta l'id del servidor
     (un UUID sintètic ací): quan el port el torna pel slug declarat, la
     barra es torna a pintar i porta al projecte. */
  test('en remot, l’entitat pilot pel seu id de servidor porta al projecte', async () => {
    const UUID_PILOT = '0b1c2d3e-4f50-4a61-8b72-93a4b5c6d7e8';
    mocks.ui = { externalConfig: { dataMode: 'remote' } };
    mocks.capacitats = new Set(['directori']);
    mocks.loadPerfilPublic = vi.fn(async () => ({ tipus: 'entitat', id: UUID_PILOT, slug: ENTITAT_PILOT_SLUG, nom: 'Sóc de Poble' }));
    const { container } = render(<PublicacioDetall item={publicacioComANota({
      id: 'avis', title: 'Avís', created_at: CREAT, author_name: 'Sóc de Poble', author_org_id: UUID_PILOT
    }, 'mur')} />);
    const href = () => container.querySelector('section.bar-orange a.sp-card-author-link')?.getAttribute('href') ?? null;
    await waitFor(() => expect(href()).toBe(RUTA_PERFIL_PROJECTE));
    expect(mocks.loadPerfilPublic).toHaveBeenCalledTimes(1);
    expect(mocks.loadPerfilPublic.mock.calls[0][0]).toBe(ENTITAT_PILOT_SLUG);
  });

  test('rutaDeLaBarraDeLaPublicacio: qui signa mana; després, la reserva', () => {
    expect(rutaDeLaBarraDeLaPublicacio({ author_name: 'Javi', owner_user_id: 'javillinares' })).toBe('/gent/javillinares');
    expect(rutaDeLaBarraDeLaPublicacio({})).toBe(RUTA_PERFIL_PROJECTE);
    expect(rutaDeLaBarraDeLaPublicacio({ seller: 'Pepa' })).toBeUndefined();
    expect(rutaDeLaBarraDeLaPublicacio({ author_name: 'Pepa' })).toBeUndefined();
  });
});
