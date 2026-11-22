/* Onada R32.37 · Paritat 5 llengües de les regions aria-label i locale als panells d'admin d'entitats. */
import React from 'react';
import { webcrypto } from 'node:crypto';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { UIContext } from '../../../app/contexts/objectesDeContext.js';

const state = vi.hoisted(() => ({ sessio: null }));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => state.sessio }));
vi.mock('../../../app/contexts/RouterContext.jsx', () => ({ Link: ({ to, children }) => <a href={to}>{children}</a> }));

import PaginesTrilogiaWp from './PaginesTrilogiaWp.jsx';
import PanellUsuarisDispositiusBotigues from './PanellUsuarisDispositiusBotigues.jsx';
import { TEXTOS_ADMIN_ENTITATS, textosAdminEntitats } from './i18nAdminEntitats.js';

beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto);
  state.sessio = { currentUser: { id: 'admin-1' }, generacio: 1, estat: 'dins', esSuperadmin: true, nivell: 'aal2' };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Onada R32.37 · i18nAdminEntitats · 0 atributs aria-label monolingües en les 5 llengües', () => {
  test('les 5 llengües tenen paritat de claus i codis BCP 47 vàlids', () => {
    const claus = Object.keys(TEXTOS_ADMIN_ENTITATS.ca).sort();
    for (const codi of ['ca', 'es', 'en', 'eu', 'gl']) {
      expect(Object.keys(TEXTOS_ADMIN_ENTITATS[codi]).sort()).toEqual(claus);
      expect(textosAdminEntitats(codi).locale).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
    }
    expect(textosAdminEntitats('pt')).toBe(TEXTOS_ADMIN_ENTITATS.ca);
  });

  test('PanellUsuarisDispositiusBotigues, PanellSessionsDetall i PaginesTrilogiaWp traduïxen totes les regions aria-label', async () => {
    for (const codi of ['ca', 'es', 'en', 'eu', 'gl']) {
      const tx = textosAdminEntitats(codi);

      render(
        <UIContext.Provider value={{ language: codi, llenguaDelText: codi }}>
          <PanellUsuarisDispositiusBotigues consulta={vi.fn()} nativaIos={false} />
        </UIContext.Provider>
      );
      expect(screen.getByRole('article', { name: tx.usuarisBotiguesRegio })).toBeTruthy();
      expect(screen.getByRole('region', { name: tx.directoriSessionsRegio })).toBeTruthy();
      expect(screen.getByRole('region', { name: tx.descarreguesOficialsRegio })).toBeTruthy();
      cleanup();

      render(
        <UIContext.Provider value={{ language: codi, llenguaDelText: codi }}>
          <PaginesTrilogiaWp />
        </UIContext.Provider>
      );
      expect(await screen.findByRole('region', { name: tx.paginesTrilogiaRegio })).toBeTruthy();
      cleanup();
    }
  });
});
