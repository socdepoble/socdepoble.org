/* Onada 6 (tasca 12) · «Nova conversa» i la IAIA:
   · la IAIA hi porta la seua cara (la iaia del mocador roig de «Festa del
     Poble», retallada per l'enquadrament 'iaia'), també quan no és al padró;
   · amb el nivell d'IA a 0 (`senseIAIA`) no hi és: ni entre els contactes
     d'ajuda ni en el padró que es cerca. «Sóc de Poble» no canvia. */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import DialegNovaConversa from './DialegNovaConversa.jsx';
import { contactesDAjuda, esContacteDeLaIAIA, senseContacteDeLaIAIA } from '../contactesAjuda.js';
import { AGENTS_MAP } from '../../../data/agentsSeed.js';
import { CARA_DE_LA_IAIA } from '../../../data/xatsPerDefecte.js';
import { IAIA_ID } from '../../../data/identitatsSeed.js';

const t = (_, alternativa) => alternativa;
const PADRO = [
  { usuari_id: 'u-jose', nom: 'José Martí', tipus: 'persona', fil_id: null },
  { usuari_id: 'iaia-remota', nom: 'IAIA MarIA', tipus: 'ia', fil_id: null, avatar_url: AGENTS_MAP.IAIA.avatar_url },
  { usuari_id: 'sdp', nom: 'Sóc de Poble', tipus: 'entitat', fil_id: null }
];

afterEach(cleanup);

async function obert(padro, extra = {}) {
  render(
    <DialegNovaConversa
      obert t={t} onTanca={() => {}} cercaMembres={vi.fn(async () => padro)} contactesFrequents={[]}
      joId="jo" joNom="Javi" onTriaMembre={vi.fn()} onObriFil={vi.fn()} onVes={vi.fn()} {...extra}
    />
  );
  const dialeg = screen.getByRole('dialog', { name: 'Nova conversa' });
  await waitFor(() => expect(within(dialeg).getByRole('button', { name: /Sóc de Poble/ })).toBeTruthy());
  return dialeg;
}

test('contactesDAjuda: la IAIA que no és al padró porta la cara; amb senseIAIA, no hi és', () => {
  const [sdp, iaia] = contactesDAjuda([]);
  expect(sdp).toEqual({ nom: 'Sóc de Poble', tipus: 'entitat', usuari_id: 'ajuda:entitat', noDisponible: true });
  expect(iaia).toMatchObject({ nom: 'IAIA MarIA', tipus: 'ia', noDisponible: true, avatar_url: AGENTS_MAP.IAIA.avatar_url });
  expect(contactesDAjuda([], { senseIAIA: true }).map((c) => c.nom)).toEqual(['Sóc de Poble']);
});

test('esContacteDeLaIAIA: per id o pel nom del seu tipus; senseContacteDeLaIAIA no toca la resta', () => {
  expect(esContacteDeLaIAIA({ usuari_id: IAIA_ID, tipus: 'ia' })).toBe(true);
  expect(esContacteDeLaIAIA(PADRO[1])).toBe(true);
  expect(esContacteDeLaIAIA({ usuari_id: 'x', nom: 'IAIA MarIA', tipus: 'persona' })).toBe(false);
  expect(senseContacteDeLaIAIA(PADRO).map((m) => m.usuari_id)).toEqual(['u-jose', 'sdp']);
  const sense = [PADRO[0]];
  expect(senseContacteDeLaIAIA(sense)).toBe(sense);
});

test('la IAIA de «Nova conversa» porta la cara retallada de «Festa del Poble»', async () => {
  const dialeg = await obert(PADRO);
  const fila = within(dialeg).getByRole('button', { name: /IAIA MarIA/ });
  const avatar = fila.querySelector('.sdp-avatar');
  expect(avatar.classList.contains('sdp-avatar--enquadrat-iaia')).toBe(true);
  expect(avatar.querySelector('img').getAttribute('src')).toBe(CARA_DE_LA_IAIA.src);
  /* Sóc de Poble, la de sempre. */
  expect(within(dialeg).getByRole('button', { name: /Sóc de Poble/ }).querySelector('.sdp-avatar--enquadrat')).toBeNull();
});

test('amb el nivell d’IA a 0 la IAIA no hi és, ni en cercar-la', async () => {
  const dialeg = await obert(PADRO, { senseIAIA: true });
  expect(within(dialeg).queryByRole('button', { name: /IAIA MarIA/ })).toBeNull();
  fireEvent.change(within(dialeg).getByRole('searchbox'), { target: { value: 'iaia' } });
  await waitFor(() => expect(within(dialeg).getByText('Cap contacte amb eixe nom.')).toBeTruthy());
  expect(within(dialeg).queryByRole('button', { name: /IAIA MarIA/ })).toBeNull();
});
