/**
 * T6 en remot (revisió del front «nucli», 261004) · Al servidor, l'entitat
 * pilot signa les seues publicacions amb l'id del proveïdor (author_org_id,
 * un UUID a Supabase), que la llavor no sap. La targeta del Mur (i la de
 * /calendari, que és la mateixa) el demana al port una sola vegada
 * (useEntitatDelProjecte: loadPerfilPublic amb el slug declarat) i, quan
 * arriba, la boina torna a pintar-se i porta al projecte. Una altra entitat
 * del servidor continua portant al seu perfil. En llavor, cap crida. Els UUID
 * són sintètics.
 */
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const UUID_PILOT = '0b1c2d3e-4f50-4a61-8b72-93a4b5c6d7e8';
const UUID_ALTRA = '9f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a';

const estat = vi.hoisted(() => ({
  navigate: () => {},
  accions: { t: (_, alternativa) => alternativa },
  ui: { externalConfig: { dataMode: 'remote' } },
  capacitats: new Set(['directori']),
  perfil: null,
  loadPerfilPublic: null
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => estat.navigate,
  useSearchParams: () => [new URLSearchParams(), () => {}],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => estat.accions,
  useUIState: () => estat.ui
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (capacitat) => estat.capacitats.has(capacitat),
  loadPerfilPublic: (...args) => estat.loadPerfilPublic(...args)
}));

import { TargetaDelMur } from './TargetaDelMur.jsx';
import { oblidaEntitatDelProjecte, RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';
import { ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';

const publicacio = (id, orgId) => ({ id, type: 'post', title: `Avís ${id}`, author_name: 'Sóc de Poble', author_org_id: orgId });
const hrefDe = (arrel, id) => arrel.querySelector(`[data-prova="${id}"] header.sp-card-header a.sp-card-author-link`)?.getAttribute('href') ?? null;

function pinta(items) {
  return render(
    <>
      {items.map((item) => <div key={item.id} data-prova={item.id}><TargetaDelMur item={item} /></div>)}
    </>
  ).container;
}

afterEach(() => {
  cleanup();
  oblidaEntitatDelProjecte();
});
beforeEach(() => {
  estat.ui = { externalConfig: { dataMode: 'remote' } };
  estat.capacitats = new Set(['directori']);
  estat.perfil = { tipus: 'entitat', id: UUID_PILOT, slug: ENTITAT_PILOT_SLUG, nom: 'Sóc de Poble' };
  estat.loadPerfilPublic = vi.fn(async () => estat.perfil);
});

describe('T6 en remot · la boina de l’entitat pilot pel seu id de servidor', () => {
  /* Onada 8 (261009) · La del pilot, al seu perfil (RUTA_PERFIL_PROJECTE), ja no a /projecte. */
  test('quan el port torna l’id, la boina del pilot porta al seu perfil; la d’una altra entitat, al seu', async () => {
    const arrel = pinta([publicacio('a', UUID_PILOT), publicacio('b', UUID_PILOT), publicacio('c', UUID_ALTRA)]);
    await waitFor(() => expect(hrefDe(arrel, 'a')).toBe(RUTA_PERFIL_PROJECTE));
    expect(hrefDe(arrel, 'b')).toBe(RUTA_PERFIL_PROJECTE);
    expect(hrefDe(arrel, 'c')).toBe(`/empresa/${UUID_ALTRA}`);
    /* Tres targetes, una sola crida, amb el slug declarat (mai el nom). */
    expect(estat.loadPerfilPublic).toHaveBeenCalledTimes(1);
    expect(estat.loadPerfilPublic.mock.calls[0][0]).toBe(ENTITAT_PILOT_SLUG);
  });

  test('si el servidor no té cap entitat amb el slug del pilot, el UUID continua sent una entitat qualsevol', async () => {
    estat.perfil = { tipus: 'entitat', id: UUID_PILOT, slug: 'forn', nom: 'Sóc de Poble' };
    const arrel = pinta([publicacio('a', UUID_PILOT)]);
    await waitFor(() => expect(estat.loadPerfilPublic).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(hrefDe(arrel, 'a')).toBe(`/empresa/${UUID_PILOT}`);
  });

  /* Auditoria 261007 (B) · Defensa en profunditat: l'enllaç de tota la targeta
     només és una ruta de l'app. Un mainHref de fora en un payload escrit per
     PostgREST navegava la pestanya de l'amfitrió. */
  test('l’enllaç de tota la targeta: una ruta interna es conserva i una adreça de fora cau al detall', () => {
    const overlay = (arrel, id) => arrel.querySelector(`[data-prova="${id}"] a.sp-card-link-overlay`)?.getAttribute('href') ?? null;
    const arrel = pinta([
      { ...publicacio('fora', UUID_ALTRA), mainHref: 'https://fals-poble.example/entra' },
      { ...publicacio('relativa', UUID_ALTRA), mainHref: '//fals-poble.example' },
      { id: 'projecte', isSystem: true, type: 'sistema', title: 'El projecte', mainHref: '/projecte' }
    ]);
    expect(overlay(arrel, 'fora')).toBe('/mur/fora');
    expect(overlay(arrel, 'relativa')).toBe('/mur/relativa');
    expect(overlay(arrel, 'projecte')).toBe('/projecte');
  });

  test('en llavor o sense la capacitat del directori, cap crida al port', () => {
    estat.ui = { externalConfig: { dataMode: 'seed' } };
    const llavor = pinta([publicacio('a', UUID_PILOT)]);
    expect(hrefDe(llavor, 'a')).toBe(`/empresa/${UUID_PILOT}`);
    cleanup();
    estat.ui = { externalConfig: { dataMode: 'remote' } };
    estat.capacitats = new Set();
    pinta([publicacio('a', UUID_PILOT)]);
    expect(estat.loadPerfilPublic).not.toHaveBeenCalled();
  });
});
