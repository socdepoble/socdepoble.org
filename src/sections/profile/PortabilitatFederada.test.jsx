import { webcrypto } from 'node:crypto';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';
const m = vi.hoisted(() => ({ verify: vi.fn(), natiu: false }));
vi.mock('../../config/origenPublic.js', () => ({ esAppNativa: () => m.natiu }));
vi.mock('../../data/federacio/portabilitatFediversity.js', async importOriginal => {
  const actual = await importOriginal();
  return { ...actual, importaPaquetSobiraniaMunicipal: (...args) => m.verify(...args) };
});
import PortabilitatFederada, { TEXTOS_PORTABILITAT } from './PortabilitatFederada.jsx';
import {
  exportaPaquetSobiraniaMunicipal, generaParellClausFediversityEd25519,
} from '../../data/federacio/portabilitatFediversity.js';

const A = 'https://origen.example/actors/anna';
const B = 'https://desti.example/actors/anna';
const ORIGEN = { id: A, type: 'Person', alsoKnownAs: [B], movedTo: B };
const DESTI = { id: B, type: 'Person', alsoKnownAs: [A] };
const NOM = Object.fromEntries(Object.entries(TEXTOS_PORTABILITAT).map(([key, [, value]]) => [key, value]));
const UrlReal = URL;
const create = vi.fn();
const revoke = vi.fn();

beforeEach(async () => {
  const actual = await vi.importActual('../../data/federacio/portabilitatFediversity.js');
  m.verify.mockReset().mockImplementation(actual.importaPaquetSobiraniaMunicipal);
  m.natiu = false;
  create.mockReset().mockReturnValue('blob:trasllat'); revoke.mockReset();
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('URL', class extends UrlReal {
    static createObjectURL = create;
    static revokeObjectURL = revoke;
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function actors() {
  fireEvent.change(screen.getByLabelText(NOM.origen), { target: { value: JSON.stringify(ORIGEN) } });
  fireEvent.change(screen.getByLabelText(NOM.desti), { target: { value: JSON.stringify(DESTI) } });
}
const comprova = () => fireEvent.click(screen.getByRole('button', { name: NOM.comprova }));
const llegixBlob = blob => new Promise(resolve => {
  const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsText(blob);
});

test('FEDI-01 · prepara i descarrega un Move coherent amb el motor real, sense xarxa ni èxit remot', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch');
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  render(<PortabilitatFederada />);
  actors(); comprova();
  expect(screen.getByText(NOM.correcte)).toBeTruthy();
  const preparat = JSON.parse(screen.getByLabelText(NOM.move).value);
  expect(preparat).toMatchObject({ type: 'Move', actor: A, object: A, target: B });
  expect(preparat).not.toHaveProperty('proof');
  fireEvent.click(screen.getByRole('button', { name: NOM.descarrega }));
  expect(click).toHaveBeenCalledOnce();
  expect(click.mock.instances[0].download).toBe('socdepoble-trasllat-move.json');
  expect(JSON.parse(await llegixBlob(create.mock.calls[0][0]))).toEqual(preparat);
  expect(fetch).not.toHaveBeenCalled();
  expect(m.verify).not.toHaveBeenCalled();
});

test('una destinació sense alsoKnownAs, JSON corrupte i un altre identificador mai produïxen fitxer', () => {
  render(<PortabilitatFederada actorOrigen={ORIGEN} />);
  fireEvent.change(screen.getByLabelText(NOM.desti), { target: { value: '{' } });
  comprova(); expect(screen.getByText(NOM.errorJson)).toBeTruthy();
  for (const desti of [{ id: B }, { ...DESTI, id: 'https://impostor.example/actor' }]) {
    fireEvent.change(screen.getByLabelText(NOM.desti), { target: { value: JSON.stringify(desti) } });
    comprova(); expect(screen.getByText(NOM.errorActors)).toBeTruthy();
    expect(screen.queryByRole('button', { name: NOM.descarrega })).toBeNull();
  }
  expect(create).not.toHaveBeenCalled();
});

test('editar els actors invalida el Move; en l’app nativa es mostra el JSON sense simular cap descàrrega', () => {
  m.natiu = true;
  render(<PortabilitatFederada />);
  actors(); comprova();
  expect(screen.getByLabelText(NOM.move)).toBeTruthy();
  expect(screen.getByText(NOM.natiu)).toBeTruthy();
  expect(screen.queryByRole('button', { name: NOM.descarrega })).toBeNull();
  fireEvent.change(screen.getByLabelText(NOM.desti), { target: { value: '{}' } });
  expect(screen.queryByLabelText(NOM.move)).toBeNull();
  expect(screen.queryByText(NOM.correcte)).toBeNull();
});

async function paquetReal() {
  const keys = await generaParellClausFediversityEd25519({ controller: A, idClau: `${A}#key` });
  const signed = await exportaPaquetSobiraniaMunicipal({ actor: ORIGEN, privateKeyJwk: keys.privateKeyJwk, verificationMethod: `${A}#key`, notes: [{ title: 'Nota original' }] });
  return { ...keys, signed };
}
function preparaVerificacio(signed, key) {
  fireEvent.click(screen.getByText(NOM.verificaPaquet));
  fireEvent.change(screen.getByLabelText(NOM.paquet), { target: { value: JSON.stringify(signed) } });
  fireEvent.change(screen.getByLabelText(NOM.clau), { target: { value: JSON.stringify(key) } });
}
const verifica = async () => { await act(async () => { fireEvent.click(screen.getByRole('button', { name: NOM.botoPaquet })); }); };

test('verifica un paquet signat real; detecta manipulació i mai importa ni confia en claus del fitxer', async () => {
  const { signed, publicKeyJwk } = await paquetReal();
  const fetch = vi.spyOn(globalThis, 'fetch');
  render(<PortabilitatFederada />);
  preparaVerificacio(signed, publicKeyJwk);
  await verifica();
  expect(await screen.findByText(NOM.paquetValid)).toBeTruthy();
  expect(m.verify).toHaveBeenCalledWith(signed, { publicKeyJwk, actorDesti: undefined });
  fireEvent.change(screen.getByLabelText(NOM.paquet), { target: { value: JSON.stringify({ ...signed, notes: [{ title: 'Manipulada' }] }) } });
  await verifica();
  expect(await screen.findByText(NOM.paquetInvalid)).toBeTruthy();
  expect(screen.queryByText(NOM.paquetValid)).toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
});

test('no accepta claus privades i les retira del camp abans de fer criptografia', async () => {
  const { signed, privateKeyJwk } = await paquetReal();
  render(<PortabilitatFederada />);
  preparaVerificacio(signed, privateKeyJwk);
  await verifica();
  expect(screen.getByText(NOM.clauPrivada)).toBeTruthy();
  expect(screen.getByLabelText(NOM.clau).value).toBe('');
  expect(m.verify).not.toHaveBeenCalled();
});

test('un canvi de camp o identitat invalida una verificació pendent i buida dades anteriors', async () => {
  const { signed, publicKeyJwk } = await paquetReal();
  let resolve;
  m.verify.mockReturnValueOnce(new Promise(done => { resolve = done; }));
  const view = render(<PortabilitatFederada scopeKey="anna" actorOrigen={ORIGEN} />);
  preparaVerificacio(signed, publicKeyJwk);
  await verifica();
  await waitFor(() => expect(m.verify).toHaveBeenCalledOnce());
  view.rerender(<PortabilitatFederada scopeKey="pepa" />);
  await act(async () => { resolve({ valid: true }); });
  expect(screen.getByLabelText(NOM.origen).value).toBe('');
  expect(screen.getByLabelText(NOM.paquet).value).toBe('');
  expect(screen.getByLabelText(NOM.clau).value).toBe('');
  expect(screen.queryByText(NOM.paquetValid)).toBeNull();
});

test('els 22 textos tenen reserva valenciana i valor als cinc diccionaris', () => {
  for (const [clau, reserva] of Object.values(TEXTOS_PORTABILITAT)) {
    expect(CA[clau], clau).toBe(reserva);
    for (const diccionari of [ES, EN, EU, GL]) expect(diccionari[clau], clau).toBeTypeOf('string');
  }
});
