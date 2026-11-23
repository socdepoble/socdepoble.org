/* Onada R32.37 + R32.45 (Lkits-07 i Lkits-10) · Paritat literal en les 5 llengües per a les regions
   aria-label, encapçalaments, formularis i botons dels panells d'admin d'entitats. */
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

const EXPECTATIVES_LITERALS = [
  ['ca', 'Usuaris, dispositius i botigues', 'Directori d’usuaris i dispositius', 'Descàrregues oficials', 'Pàgines originals en revisió privada', 'Consulta el directori', 'Obri l’esborrany amb Edició avançada'],
  ['es', 'Usuarios, dispositivos y tiendas', 'Directorio de usuarios y dispositivos', 'Descargas oficiales', 'Páginas originales en revisión privada', 'Consultar el directorio', 'Abrir el borrador con Edición avanzada'],
  ['en', 'Users, devices and app stores', 'Users and devices directory', 'Official downloads', 'Original pages under private review', 'Query directory', 'Open draft in Advanced editing'],
  ['eu', 'Erabiltzaileak, gailuak eta dendak', 'Erabiltzaileen eta gailuen direktorioa', 'Deskarga ofizialak', 'Berrikuspen pribatuko jatorrizko orriak', 'Kontsultatu direktorioa', 'Ireki zirriborroa Edizio aurreratuarekin'],
  ['gl', 'Usuarios, dispositivos e tendas', 'Directorio de usuarios e dispositivos', 'Descargas oficiais', 'Páxinas orixinais en revisión privada', 'Consultar o directorio', 'Abrir o borrador con Edición avanzada']
];

describe('Onada R32.37 + R32.45 · i18nAdminEntitats · paritat completa en les 5 llengües', () => {
  test('les 5 llengües tenen paritat de claus i codis BCP 47 vàlids', () => {
    const claus = Object.keys(TEXTOS_ADMIN_ENTITATS.ca).sort();
    for (const codi of ['ca', 'es', 'en', 'eu', 'gl']) {
      expect(Object.keys(TEXTOS_ADMIN_ENTITATS[codi]).sort()).toEqual(claus);
      expect(textosAdminEntitats(codi).locale).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
    }
    expect(textosAdminEntitats('pt')).toBe(TEXTOS_ADMIN_ENTITATS.ca);
  });

  test('PanellUsuarisDispositiusBotigues, PanellSessionsDetall i PaginesTrilogiaWp traduïxen regions i controls amb literals explícits', async () => {
    for (const [codi, regUsuaris, regSessions, regDescarregues, regTrilogia, botoSessions, linkTrilogia] of EXPECTATIVES_LITERALS) {
      render(
        <UIContext.Provider value={{ language: codi, llenguaDelText: codi }}>
          <PanellUsuarisDispositiusBotigues consulta={vi.fn()} nativaIos={false} />
        </UIContext.Provider>
      );
      expect(screen.getByRole('article', { name: regUsuaris })).toBeTruthy();
      expect(screen.getByRole('region', { name: regSessions })).toBeTruthy();
      expect(screen.getByRole('region', { name: regDescarregues })).toBeTruthy();
      expect(screen.getByRole('button', { name: botoSessions })).toBeTruthy();
      cleanup();

      render(
        <UIContext.Provider value={{ language: codi, llenguaDelText: codi }}>
          <PaginesTrilogiaWp />
        </UIContext.Provider>
      );
      expect(await screen.findByRole('region', { name: regTrilogia })).toBeTruthy();
      expect(screen.getByRole('link', { name: linkTrilogia })).toBeTruthy();
      cleanup();
    }
  });
});
