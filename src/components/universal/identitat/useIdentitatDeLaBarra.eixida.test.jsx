import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../config/i18n.js';

/* Gauntlet R32.6 · L'eixida des del calaix «Amb qui actues?», en la llengua de
   la interfície (PERFIL-01 i I18N-02), el focus després de «No eixir encara»
   (PERFIL-02) i el nom del botó que obri el calaix (PERFIL-04). La barra de
   veres (el hook, el botó i el calaix); la sessió, la identitat, els mitjans i
   el traductor, simulats. */
const m = vi.hoisted(() => ({ t: null, user: null, identitat: null, logout: vi.fn(), preparaEixida: vi.fn() }));
vi.mock('../../../app/contexts/SessionContext', () => ({
  useSession: () => ({ currentUser: m.user, logout: m.logout, preparaEixida: m.preparaEixida }),
  useSessioOpcional: () => ({ currentUser: m.user, logout: m.logout, preparaEixida: m.preparaEixida }),
}));
vi.mock('../../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => m.identitat,
  useIdentitatOpcional: () => m.identitat,
}));
vi.mock('../../../hooks/useResolvedAsset.js', () => ({ useResolvedAsset: () => '' }));
vi.mock('../../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActionsOpcional: () => (m.t ? { t: m.t } : null),
}));
import { useIdentitatDeLaBarra } from './useIdentitatDeLaBarra.js';
import { BotoIdentitatActiva } from './BotoIdentitatActiva.jsx';
import { CalaixIdentitats } from './CalaixIdentitats.jsx';
import { ERROR_EIXIDA } from '../EixidaSegura.jsx';

function Barra() {
  const { boto, calaix } = useIdentitatDeLaBarra({ onNavega: vi.fn(), etiquetaEntrar: 'Entrar' });
  return (
    <>
      <header className="bar-black"><div className="right-icons"><BotoIdentitatActiva {...boto} /></div></header>
      {calaix ? <CalaixIdentitats {...calaix} /> : null}
    </>
  );
}

const PERSONA = { tipus: 'persona', id: 'u-1', nom: 'Pepa Soler', avatar: null, rol: 'persona' };
const FORN = { tipus: 'entitat', id: 'o-1', nom: 'Forn de la Torre', avatar: null, rol: 'owner' };
const PENDENTS = [{ entitat: 'fitxa', camps: ['lead'] }, { entitat: 'nota', camps: ['content'] }];
/* Els literals valencians de l'avís que no poden eixir en cap altra llengua. */
const LITERALS_CA = ['Encara hi ha canvis sense desar', 'No eixir encara', 'Eixir igualment', 'Tens ', 'Si ixes ara', ERROR_EIXIDA];

beforeEach(() => {
  m.t = null;
  m.user = { id: 'u-1' };
  m.identitat = { actor: PERSONA, identitats: [{ ...PERSONA, activa: true }, { ...FORN, activa: false }], setActor: vi.fn(() => true) };
  m.logout.mockReset().mockResolvedValue(undefined);
  m.preparaEixida.mockReset().mockResolvedValue([]);
});
afterEach(cleanup);

async function obriAvis(nomBoto, nomEixir) {
  m.preparaEixida.mockResolvedValueOnce(PENDENTS);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: nomBoto })); });
  /* v1.2.23 · R2E-04 (Gauntlet R2) · REAPUNTADA: en una llengua que no és el valencià el calaix s'obri quan
     arriba el tros dels seus textos (useIdentitatDeLaBarra.js · preparaTextosCalaix). El mateix invariant: el
     calaix s'obri amb el botó d'eixir en la llengua de la interfície. */
  const dialeg = await screen.findByRole('dialog');
  const eixir = within(dialeg).getByRole('button', { name: nomEixir });
  await act(async () => { fireEvent.click(eixir); });
  return { dialeg, eixir };
}

describe('Gauntlet R32.6 · eixir des del calaix «Amb qui actues?»', () => {
  test.each([
    ['en', {
      boto: 'Active identity: Pepa Soler. Switch identity, language or sign out',
      eixir: 'Sign out of Sóc de Poble',
      titol: 'You still have unsaved changes',
      noEixir: 'Stay signed in',
      igualment: 'Sign out anyway',
      cos: 'You have 2 changes that the server does not have yet (in the profile: the standfirst; in Notes: 1 note). If you sign out now, they will be deleted from this device.',
      error: 'Could not sign out.',
    }],
    ['eu', {
      boto: 'Identitate aktiboa: Pepa Soler. Aldatu identitatea, hizkuntza edo irten',
      eixir: 'Irten Sóc de Pobletik',
      titol: 'Oraindik gorde gabeko aldaketak daude',
      noEixir: 'Ez irten oraindik',
      igualment: 'Irten hala ere',
      cos: 'Zerbitzariak oraindik ez dituen 2 aldaketa dituzu (fitxan: sarrera; Oharretan: ohar 1). Orain irteten bazara, gailu honetatik ezabatuko dira.',
      error: 'Ezin izan da saioa itxi.',
    }],
  ])('PERFIL-01 · en %s, l’avís, els botons, el cos i l’error ixen en la llengua de la interfície', async (codi, textos) => {
    m.t = createTranslator(codi);
    render(<Barra />);
    const { dialeg } = await obriAvis(textos.boto, textos.eixir);
    expect(m.logout).not.toHaveBeenCalled();
    expect(within(dialeg).getByText(textos.titol)).toBeTruthy();
    expect(within(dialeg).getByText(textos.cos)).toBeTruthy();
    expect(within(dialeg).getByRole('button', { name: textos.noEixir })).toBeTruthy();

    m.logout.mockRejectedValueOnce(new Error('xarxa'));
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: textos.igualment })); });
    expect(m.logout).toHaveBeenCalledTimes(1);
    expect(within(dialeg).getByText(textos.error)).toBeTruthy();
    for (const literal of LITERALS_CA) expect(dialeg.textContent).not.toContain(literal);
  });

  test('sense traductor, l’avís i l’error són els valencians de sempre', async () => {
    render(<Barra />);
    const { dialeg } = await obriAvis('Identitat activa: Pepa Soler. Canviar identitat, idioma o eixir', 'Eixir de Sóc de Poble');
    expect(within(dialeg).getByText('Encara hi ha canvis sense desar')).toBeTruthy();
    expect(within(dialeg).getByText('Tens 2 canvis que el servidor encara no té (a la fitxa: l’entradilla; a Notes: 1 nota). Si ixes ara, s’esborraran d’este dispositiu.')).toBeTruthy();
    m.logout.mockRejectedValueOnce(new Error('xarxa'));
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Eixir igualment' })); });
    expect(within(dialeg).getByText(ERROR_EIXIDA)).toBeTruthy();
  });

  test.each([
    ['ca', null, 'Identitat activa: Pepa Soler. Canviar identitat, idioma o eixir', 'Eixir de Sóc de Poble', 'No eixir encara'],
    ['en', 'en', 'Active identity: Pepa Soler. Switch identity, language or sign out', 'Sign out of Sóc de Poble', 'Stay signed in'],
  ])('PERFIL-02 · en %s, «No eixir encara» torna el focus a «Eixir de Sóc de Poble», dins del calaix', async (_codi, llengua, nomBoto, nomEixir, nomNoEixir) => {
    m.t = llengua ? createTranslator(llengua) : null;
    render(<Barra />);
    const { dialeg, eixir } = await obriAvis(nomBoto, nomEixir);
    const noEixir = within(dialeg).getByRole('button', { name: nomNoEixir });
    expect(document.activeElement).toBe(noEixir);
    await act(async () => { fireEvent.click(noEixir); });
    expect(within(dialeg).queryByRole('button', { name: nomNoEixir })).toBeNull();
    expect(m.logout).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(eixir);
    expect(dialeg.contains(document.activeElement)).toBe(true);
  });
});
