/* Onada R32.37 · Paritat 5 llengües (ca, es, en, eu, gl) per a DialegNovaOrganitzacio i DetallCompte. */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { UIContext } from '../../app/contexts/objectesDeContext.js';

const m = vi.hoisted(() => ({ towns: [{ id: 't', title: 'La Torre de les Maçanes' }], perfil: null }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ status: 'ready', towns: m.towns }) }));
vi.mock('./PerfilContext.jsx', async (importOriginal) => ({ ...(await importOriginal()), usePerfilOpcional: () => m.perfil }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => null }));
vi.mock('./DetallAjust.jsx', () => ({ default: () => null }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, lead, children }) => (
    <main>
      <header className="page-title"><h1>{title}</h1></header>
      <p data-testid="lead">{lead}</p>
      {children}
    </main>
  ),
}));

import { DialegNovaOrganitzacio } from './DialegNovaOrganitzacio.jsx';
import { DetallCompte } from './DetallCompte.jsx';
import { TEXTOS_ENTITATS_COMPTE, textosEntitatsCompte } from './i18nEntitatsCompte.js';

beforeEach(() => {
  m.perfil = null;
});
afterEach(cleanup);

describe('Onada R32.37 · i18nEntitatsCompte · paritat estructural en les 5 llengües oficials', () => {
  test('totes les 5 llengües exposen exactament les mateixes claus i funcions', () => {
    const clausCa = Object.keys(TEXTOS_ENTITATS_COMPTE.ca).sort();
    for (const codi of ['es', 'en', 'eu', 'gl']) {
      expect(Object.keys(TEXTOS_ENTITATS_COMPTE[codi]).sort()).toEqual(clausCa);
      const tx = textosEntitatsCompte(codi);
      expect(typeof tx.ajudaAdreca('/empresa/forn')).toBe('string');
      expect(tx.ajudaAdreca('/empresa/forn')).toContain('/empresa/forn');
      expect(typeof tx.leadMembres('El Rentonar', (n) => `d’${n}`)).toBe('string');
      expect(typeof tx.leadOrganitzacio('Forn')).toBe('string');
    }
    expect(textosEntitatsCompte('fr')).toBe(TEXTOS_ENTITATS_COMPTE.ca);
  });

  test('DialegNovaOrganitzacio mostra títol, tipus (Empresa / Grup), camps i accions en les 5 llengües', () => {
    const casos = [
      ['ca', 'Nova organització', 'Empresa o negoci', 'Grup', 'Poble', 'Tria un poble…', 'Crear', 'Cancel·lar'],
      ['es', 'Nueva organización', 'Empresa o negocio', 'Grupo', 'Pueblo', 'Elige un pueblo…', 'Crear', 'Cancelar'],
      ['en', 'New organisation', 'Company or business', 'Group', 'Village', 'Choose a village…', 'Create', 'Cancel'],
      ['eu', 'Erakunde berria', 'Enpresa edo negozioa', 'Taldea', 'Herria', 'Aukeratu herri bat…', 'Sortu', 'Utzi'],
      ['gl', 'Nova organización', 'Empresa ou negocio', 'Grupo', 'Vila', 'Escolle unha vila…', 'Crear', 'Cancelar'],
    ];

    for (const [lang, titol, empTxt, grpTxt, pobleLbl, triaTxt, crearTxt, cancelTxt] of casos) {
      render(
        <UIContext.Provider value={{ language: lang, llenguaDelText: lang }}>
          <DialegNovaOrganitzacio obert onTanca={vi.fn()} onCrea={vi.fn()} />
        </UIContext.Provider>
      );
      expect(screen.getByRole('heading', { name: titol })).toBeTruthy();
      expect(screen.getByRole('radio', { name: new RegExp(empTxt) })).toBeTruthy();
      expect(screen.getByRole('radio', { name: new RegExp(grpTxt) })).toBeTruthy();
      expect(screen.getByLabelText(new RegExp(`^${pobleLbl}`))).toBeTruthy();
      expect(screen.getByRole('option', { name: triaTxt })).toBeTruthy();
      expect(screen.getByRole('button', { name: crearTxt })).toBeTruthy();
      expect(screen.getByRole('button', { name: cancelTxt })).toBeTruthy();
      cleanup();
    }
  });

  test('DetallCompte traduïx títol i subtítol (persona, empresa i membres de grup) en les 5 llengües', () => {
    const persona = { id: 'jo', mena: 'persona', nom: 'Pep', dades: {} };
    const grup = { id: 'g1', mena: 'grup', nom: 'El Rentonar', dades: { kind: 'group' } };

    for (const [lang, titolCompte, titolMembres] of [
      ['ca', 'El compte', 'Membres i connexions'],
      ['es', 'La cuenta', 'Miembros y conexiones'],
      ['en', 'Account', 'Members and connections'],
      ['eu', 'Kontua', 'Kideak eta loturak'],
      ['gl', 'A conta', 'Membros e conexións'],
    ]) {
      render(
        <UIContext.Provider value={{ language: lang, llenguaDelText: lang }}>
          <DetallCompte identitat={persona} guardarAjust={vi.fn()} pujaMitja={vi.fn()} />
        </UIContext.Provider>
      );
      expect(screen.getByRole('heading', { level: 1, name: titolCompte })).toBeTruthy();
      cleanup();

      render(
        <UIContext.Provider value={{ language: lang, llenguaDelText: lang }}>
          <DetallCompte identitat={grup} lloc="membres" guardarAjust={vi.fn()} pujaMitja={vi.fn()} />
        </UIContext.Provider>
      );
      expect(screen.getByRole('heading', { level: 1, name: titolMembres })).toBeTruthy();
      expect(screen.getByTestId('lead').textContent).toContain('Rentonar');
      cleanup();
    }
  });
});
