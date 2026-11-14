/* Onada R24 · CODEX-R24-12 (P1) i A-gestoria-tpv-apps-1 (R22, opció A del §11; IDEA-244 / P0-113).
   La Gestoria és oberta a la web publicada (manifest: entorn 'produccio'), però set de les dotze
   entrades (Tauler, Bancs, Impostos, Full trimestral, Històric i IA, Identitat i Finestreta i Escàner
   Local) depenen d'un tractor que cal aprovar, i «Obri el panell de Tractors» portava al panell que
   només existix al servidor de desenvolupament (WikiDePobleSection.jsx, EINES_LOCALS): fora de DEV,
   la mateixa adreça és documentació sense accions. Un navegador nou no podia acabar mai el pas.
   Ací, fora de DEV (vi.stubEnv), un navegador NOU (cap clau ni cap registre al magatzem) aprova a la
   mateixa pantalla amb el contracte de sempre: llig la fitxa sencera, signa amb WebAuthn amb
   verificació d'usuari (un autenticador de plataforma simulat que registra la clau i signa) i la porta
   de veres (exigeixAprovacio, la que crida cada tractor abans de llegir) accepta el registre desat.
   Cap drecera: mai aprovat:true, i sense signatura no s'obri res. Cada pàgina oberta porta la
   insígnia «En proves · Beta oberta» del Panell de Control. Proves escrites ABANS del fix: amb el
   codi d'abans fallen totes (vegeu _investigacio_ia_de_poble/261114_r24_claude_botigues_i_consola_zero_kit/
   onada3/gestoria_proves). */
import { webcrypto } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { CLASSE_BETA_OBERTA, TEXTOS_BETA_OBERTA } from '../plugins/registrePlugins.js';
import { exigeixAprovacio } from '../tractors/nucli/aprovacio.js';
import { base64url, concatena, desdeBase64url, sha256, utf8 } from '../tractors/nucli/canonic.js';
import { crearMagatzemMemoria } from '../tractors/nucli/magatzem.js';
import { contextAprovacio } from '../tractors/useTractors.js';
import { VistaFinestreta } from './finestreta/Finestreta.jsx';
import { VistaHistoric } from './historic/Historic.jsx';
import ShellGestoria from './tauler/ShellGestoria.jsx';
import {
  TRACTOR_ESCANER, TRACTOR_FACTURES, TRACTOR_HISTORIC, TRACTOR_IDENTITAT, TRACTOR_TAULER
} from './tractors.js';

const subtle = webcrypto.subtle;
const ORIGEN = 'https://socdepoble.org';
const RP_ID = 'socdepoble.org';
const ARA = Date.UTC(2026, 10, 14, 8, 0, 0);
const rellotge = () => ARA;
const AVUI = () => new Date(2026, 10, 14, 10, 0, 0);
/* Les esperes cobrixen l'empremta de veres de tots els tractors (crypto.subtle sobre totes les fonts). */
const ESPERA = { timeout: 15000 };
const RECORREGUT = 60000;

beforeEach(() => {
  vi.stubEnv('DEV', false);
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

/* ── Un autenticador de plataforma simulat per a un navegador NOU ─────────────
   El model de PanellTractors.test.jsx: registra una clau P-256 (create, amb presència i verificació
   d'usuari) i signa en DER (get). La porta en verifica el repte, l'origen, el rpId i la signatura. */
function capcalera(major, n) {
  if (n < 24) return [(major << 5) | n];
  if (n < 0x100) return [(major << 5) | 24, n];
  return [(major << 5) | 25, n >> 8, n & 0xff];
}
function cbor(valor) {
  if (Number.isInteger(valor)) return valor >= 0 ? capcalera(0, valor) : capcalera(1, -1 - valor);
  if (typeof valor === 'string') return [...capcalera(3, utf8(valor).length), ...utf8(valor)];
  if (valor instanceof Uint8Array) return [...capcalera(2, valor.length), ...valor];
  return [...capcalera(5, valor.size), ...[...valor].flatMap(([k, v]) => [...cbor(k), ...cbor(v)])];
}
function crudaADer(crua) {
  const enter = (b) => {
    let i = 0;
    while (i < b.length - 1 && b[i] === 0) i++;
    let v = [...b.subarray(i)];
    if (v[0] & 0x80) v = [0, ...v];
    return [0x02, v.length, ...v];
  };
  const cos = [...enter(crua.subarray(0, 32)), ...enter(crua.subarray(32))];
  return new Uint8Array([0x30, cos.length, ...cos]);
}
const buffer = (bytes) => bytes.slice().buffer;

async function navegadorNou() {
  const parell = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const jwk = await subtle.exportKey('jwk', parell.publicKey);
  const id = webcrypto.getRandomValues(new Uint8Array(16));
  const credentials = {
    create: vi.fn(async ({ publicKey }) => {
      const cose = new Map([[1, 2], [3, -7], [-1, 1], [-2, desdeBase64url(jwk.x)], [-3, desdeBase64url(jwk.y)]]);
      const authData = concatena(await sha256(publicKey.rp.id, subtle), new Uint8Array([0x45, 0, 0, 0, 0]), new Uint8Array(16),
        new Uint8Array([0, id.length]), id, new Uint8Array(cbor(cose)));
      const attestationObject = new Uint8Array(cbor(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]])));
      const clientDataJSON = utf8(JSON.stringify({ type: 'webauthn.create', challenge: base64url(publicKey.challenge), origin: ORIGEN }));
      return { rawId: buffer(id), response: { attestationObject: buffer(attestationObject), clientDataJSON: buffer(clientDataJSON) } };
    }),
    get: vi.fn(async ({ publicKey }) => {
      const authenticatorData = concatena(await sha256(publicKey.rpId, subtle), new Uint8Array([0x05, 0, 0, 0, 1]));
      const clientDataJSON = utf8(JSON.stringify({ type: 'webauthn.get', challenge: base64url(publicKey.challenge), origin: ORIGEN, crossOrigin: false }));
      const crua = new Uint8Array(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, parell.privateKey,
        concatena(authenticatorData, await sha256(clientDataJSON, subtle))));
      return { rawId: buffer(id), response: { authenticatorData: buffer(authenticatorData), clientDataJSON: buffer(clientDataJSON), signature: buffer(crudaADer(crua)) } };
    })
  };
  class PKC {
    static async isUserVerifyingPlatformAuthenticatorAvailable() { return true; }
  }
  return { location: { origin: ORIGEN, hostname: RP_ID }, navigator: { credentials }, PublicKeyCredential: PKC };
}

/* Un navegador sense autenticador de plataforma (o fora d'un context segur). */
const NAVEGADOR_SENSE_SIGNATURA = Object.freeze({ location: { origin: ORIGEN, hostname: RP_ID }, navigator: {} });

function closca({ modulActiu, entorn, magatzem }) {
  return render(
    <MemoryRouter rutaInicial={`/app/gestoria/${modulActiu}`}>
      <ShellGestoria magatzem={magatzem} subtle={subtle} entorn={entorn} rellotge={rellotge} inflate={null} avui={AVUI}
        descarrega={vi.fn()} modulActiu={modulActiu} hrefIdentitat="/app/gestoria/identitat" hrefFull="/app/gestoria/full" />
    </MemoryRouter>
  );
}

/* El que es veu d'un node: sense els <dialog> tancats que porta (el d'aprovació hi és sempre muntat). */
function textVisible(node) {
  const copia = node.cloneNode(true);
  copia.querySelectorAll('dialog:not([open])').forEach((d) => d.remove());
  return copia.textContent;
}

/* L'avís de la porta: el títol, i ni una paraula del panell que fora de DEV no existix. */
async function avisDeLaPorta(titol) {
  const avis = (await screen.findByText(titol, {}, ESPERA)).closest('.sdp-alerta');
  expect(avis, `l’avís «${titol}»`).toBeTruthy();
  expect(textVisible(avis)).not.toMatch(/panell de Tractors/);
  expect(within(avis).queryByRole('button', { name: 'Obri el panell de Tractors' })).toBeNull();
  return avis;
}

/* Llig la fitxa sencera al diàleg, la marca com a llegida i signa: el camí de la persona, sencer. */
async function aprovaAci(avis, manifest) {
  fireEvent.click(within(avis).getByRole('button', { name: 'Llig la fitxa i aprova’l' }));
  const dialeg = await screen.findByRole('dialog', { name: `Aprova «${manifest.nom}»` });
  const fitxa = within(dialeg).getByRole('region', { name: 'Fitxa explicativa' });
  expect(fitxa.textContent).toContain(`Tractor «${manifest.nom}»`);
  expect(fitxa.textContent).toContain('Què llig');
  /* La fitxa diu com es revoca fora de DEV: cap instrucció impossible dins del diàleg tampoc. */
  expect(fitxa.textContent).toContain('fora del servidor de desenvolupament, amb «Revoca l’aprovació» a la mateixa pantalla');
  fireEvent.click(within(dialeg).getByRole('checkbox', { name: /He llegit la fitxa sencera/ }));
  const signa = await within(dialeg).findByRole('button', { name: 'Signa amb Touch ID o clau de pas' }, ESPERA);
  await waitFor(() => expect(signa.disabled).toBe(false));
  fireEvent.click(signa);
}

/* La porta de veres accepta el registre desat: el mateix exigeixAprovacio que crida el tractor abans de llegir. */
async function laPortaDeVeresHoAccepta(manifest, { magatzem, entorn }) {
  const context = await contextAprovacio(manifest.id, { magatzem, subtle, entorn, rellotge });
  const registre = await exigeixAprovacio({ ...context, subtle });
  expect(registre).toMatchObject({ tractor: manifest.id, decisio: 'aprovat', nivell: 'signatura', empremta: context.empremta });
  expect(registre.prova?.tipus).toBe('webauthn');
}

describe('CODEX-R24-12 · un navegador nou a la web publicada aprova el tractor a la mateixa pantalla', () => {
  test.each([
    ['tauler', 'Cal aprovar el tractor'],
    ['bancs', 'Cal aprovar el tractor']
  ])('%s: «Cal aprovar el tractor» sense cap panell; llig la fitxa, signa i el selector dels extractes s’obri', async (modulActiu, titol) => {
    const entorn = await navegadorNou();
    const magatzem = crearMagatzemMemoria();
    closca({ modulActiu, entorn, magatzem });
    const avis = await avisDeLaPorta(titol);
    expect(avis.textContent).toContain('Gestoria · Tauler de l’empresa');
    expect(avis.textContent).toContain('en este navegador');
    expect(screen.queryByLabelText('Tria els extractes del banc')).toBeNull();
    await aprovaAci(avis, TRACTOR_TAULER);
    expect(await screen.findByLabelText('Tria els extractes del banc', {}, ESPERA)).toBeTruthy();
    expect(screen.queryByText(titol)).toBeNull();
    expect(entorn.navigator.credentials.create).toHaveBeenCalledTimes(1);
    expect(entorn.navigator.credentials.get).toHaveBeenCalledTimes(1);
    expect(await magatzem.claus()).toHaveLength(1);
    await laPortaDeVeresHoAccepta(TRACTOR_TAULER, { magatzem, entorn });
  }, RECORREGUT);

  test('escàner: aprova el seu tractor i, des del mateix panell, també el del Tauler per a abocar-hi els extractes', async () => {
    const entorn = await navegadorNou();
    const magatzem = crearMagatzemMemoria();
    closca({ modulActiu: 'escaner', entorn, magatzem });
    const avis = await avisDeLaPorta('Cal aprovar el tractor');
    expect(avis.textContent).toContain('Gestoria · Escàner Local de la carpeta');
    await aprovaAci(avis, TRACTOR_ESCANER);
    const delTauler = await avisDeLaPorta('Per a abocar els extractes cal també el Tauler');
    expect(screen.getByRole('heading', { level: 2, name: 'Tria la carpeta' })).toBeTruthy();
    await laPortaDeVeresHoAccepta(TRACTOR_ESCANER, { magatzem, entorn });
    await aprovaAci(delTauler, TRACTOR_TAULER);
    await waitFor(() => expect(screen.queryByText('Per a abocar els extractes cal també el Tauler')).toBeNull(), ESPERA);
    await laPortaDeVeresHoAccepta(TRACTOR_TAULER, { magatzem, entorn });
    /* La primera signatura registra la clau; la segona la reutilitza. */
    expect(entorn.navigator.credentials.create).toHaveBeenCalledTimes(1);
    expect(entorn.navigator.credentials.get).toHaveBeenCalledTimes(2);
  }, RECORREGUT);

  test('full trimestral: «Cal aprovar el tractor de factures» sense panell; aprovat, ja es pot triar la carpeta', async () => {
    const entorn = await navegadorNou();
    const magatzem = crearMagatzemMemoria();
    closca({ modulActiu: 'full', entorn, magatzem });
    const avis = await avisDeLaPorta('Cal aprovar el tractor de factures');
    expect(avis.textContent).toContain('en este navegador');
    await aprovaAci(avis, TRACTOR_FACTURES);
    expect(await screen.findByText('El tractor de factures està aprovat: pots triar la carpeta.', {}, ESPERA)).toBeTruthy();
    await laPortaDeVeresHoAccepta(TRACTOR_FACTURES, { magatzem, entorn });
  }, RECORREGUT);

  test('històric i IA: aprovat a la mateixa vista, el selector de tot el període s’obri', async () => {
    const entorn = await navegadorNou();
    const magatzem = crearMagatzemMemoria();
    render(
      <MemoryRouter rutaInicial="/app/gestoria/historic">
        <VistaHistoric magatzem={magatzem} subtle={subtle} entorn={entorn} rellotge={rellotge} avui={{ a: 2026, m: 11, d: 14 }} descarrega={vi.fn()} />
      </MemoryRouter>
    );
    const avis = await avisDeLaPorta('Cal aprovar el tractor');
    expect(avis.textContent).toContain('Gestoria · Històric del banc i despesa en IA');
    await aprovaAci(avis, TRACTOR_HISTORIC);
    expect(await screen.findByLabelText('Tria els extractes del banc de tot el període', {}, ESPERA)).toBeTruthy();
    await laPortaDeVeresHoAccepta(TRACTOR_HISTORIC, { magatzem, entorn });
  }, RECORREGUT);

  test('identitat i Finestreta: aprovat a la mateixa vista, el selector de la carpeta s’obri', async () => {
    const entorn = await navegadorNou();
    const magatzem = crearMagatzemMemoria();
    render(
      <MemoryRouter rutaInicial="/app/gestoria/identitat">
        <VistaFinestreta magatzem={magatzem} subtle={subtle} entorn={entorn} rellotge={rellotge} />
      </MemoryRouter>
    );
    const avis = await avisDeLaPorta('Cal aprovar el tractor');
    expect(avis.textContent).toContain('Gestoria · Fitxa d’identitat i Finestreta');
    await aprovaAci(avis, TRACTOR_IDENTITAT);
    expect(await screen.findByLabelText('Tria la carpeta arrel de la Gestoria', {}, ESPERA)).toBeTruthy();
    await laPortaDeVeresHoAccepta(TRACTOR_IDENTITAT, { magatzem, entorn });
  }, RECORREGUT);
});

describe('CODEX-R24-12 · sense signatura no s’aprova res (cap drecera)', () => {
  test('un navegador sense autenticador de plataforma llig la fitxa i el diàleg diu per què no pot signar; la porta continua tancada', async () => {
    const magatzem = crearMagatzemMemoria();
    closca({ modulActiu: 'tauler', entorn: NAVEGADOR_SENSE_SIGNATURA, magatzem });
    const avis = await avisDeLaPorta('Cal aprovar el tractor');
    fireEvent.click(within(avis).getByRole('button', { name: 'Llig la fitxa i aprova’l' }));
    const dialeg = await screen.findByRole('dialog', { name: `Aprova «${TRACTOR_TAULER.nom}»` });
    fireEvent.click(within(dialeg).getByRole('checkbox', { name: /He llegit la fitxa sencera/ }));
    expect(within(dialeg).getByText('Este navegador no pot signar')).toBeTruthy();
    expect(within(dialeg).queryByRole('button', { name: 'Signa amb Touch ID o clau de pas' })).toBeNull();
    expect(within(dialeg).getByRole('button', { name: 'Aprova amb confirmació escrita' }).disabled).toBe(true);
    expect(await magatzem.registres()).toEqual([]);
    expect(screen.queryByLabelText('Tria els extractes del banc')).toBeNull();
  }, RECORREGUT);

  test('una signatura que no es completa (Touch ID cancel·lat) no desa cap registre ni obri el Tauler', async () => {
    const entorn = await navegadorNou();
    entorn.navigator.credentials.get.mockRejectedValueOnce(new DOMException('La persona ha cancel·lat.', 'NotAllowedError'));
    const magatzem = crearMagatzemMemoria();
    closca({ modulActiu: 'tauler', entorn, magatzem });
    const avis = await avisDeLaPorta('Cal aprovar el tractor');
    await aprovaAci(avis, TRACTOR_TAULER);
    const dialeg = screen.getByRole('dialog', { name: `Aprova «${TRACTOR_TAULER.nom}»` });
    expect(await within(dialeg).findByText('La signatura no s’ha completat o no és vàlida. No s’ha aprovat res: torna-ho a provar.', {}, ESPERA)).toBeTruthy();
    expect(await magatzem.registres()).toEqual([]);
    expect(screen.queryByLabelText('Tria els extractes del banc')).toBeNull();
  }, RECORREGUT);
});

/* El mateix contracte, l'altra meitat: fora de DEV, la persona que ha aprovat en este navegador ho pot
   revocar a la mateixa pantalla (useTractors().revoca, el registre «revocat» de sempre), i la porta de veres
   torna a tancar. En DEV, cap botó nou: es revoca al panell. */
describe('CODEX-R24-12 · revocar l’aprovació a la mateixa pantalla', () => {
  test('tauler: aprovat i revocat; l’avís torna amb «té l’aprovació revocada» i la porta de veres refusa', async () => {
    const entorn = await navegadorNou();
    const magatzem = crearMagatzemMemoria();
    closca({ modulActiu: 'tauler', entorn, magatzem });
    await aprovaAci(await avisDeLaPorta('Cal aprovar el tractor'), TRACTOR_TAULER);
    await screen.findByLabelText('Tria els extractes del banc', {}, ESPERA);
    fireEvent.click(screen.getByRole('button', { name: `Revoca l’aprovació de «${TRACTOR_TAULER.nom}»` }));
    const avis = await avisDeLaPorta('Cal aprovar el tractor');
    expect(avis.textContent).toContain('té l’aprovació revocada');
    expect(screen.queryByLabelText('Tria els extractes del banc')).toBeNull();
    expect((await magatzem.registres(TRACTOR_TAULER.id)).map((r) => r.decisio)).toEqual(['aprovat', 'revocat']);
    const context = await contextAprovacio(TRACTOR_TAULER.id, { magatzem, subtle, entorn, rellotge });
    await expect(exigeixAprovacio({ ...context, subtle })).rejects.toMatchObject({ codi: 'APROVACIO_REVOCADA' });
  }, RECORREGUT);

  test('en DEV, ni la via en línia ni el botó de revocar: «Obri el panell de Tractors», com sempre', async () => {
    vi.stubEnv('DEV', true);
    const entorn = await navegadorNou();
    closca({ modulActiu: 'tauler', entorn, magatzem: crearMagatzemMemoria() });
    const avis = (await screen.findByText('Cal aprovar el tractor', {}, ESPERA)).closest('.sdp-alerta');
    expect(avis.textContent).toContain('Aprova’l amb la teua signatura al panell de Tractors: sense, cap fitxer es llig i el Tauler no té xifres.');
    expect(within(avis).getByRole('button', { name: 'Obri el panell de Tractors' })).toBeTruthy();
    expect(within(avis).queryByRole('button', { name: 'Llig la fitxa i aprova’l' })).toBeNull();
    expect(avis.querySelector('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: /Revoca l’aprovació/ })).toBeNull();
  }, RECORREGUT);
});

/* A-gestoria-tpv-apps-1 i IDEA-244 · Les set entrades que s'obrin porten la insígnia del Panell de
   Control (registrePlugins.js: el text valencià i la classe canònica de components.css, sense estil nou);
   les tres «en obres» continuen dient-ho, sense la insígnia. */
describe('A-gestoria-tpv-apps-1 · la insígnia «En proves · Beta oberta» a cada entrada oberta', () => {
  const pindoles = (arrel) => [...arrel.querySelectorAll('.page-title-labels > li')];
  const ambInsignia = (arrel) => pindoles(arrel).filter((li) => li.textContent === TEXTOS_BETA_OBERTA.ca);

  test.each(['tauler', 'bancs', 'impostos', 'full', 'escaner'])('closca · %s', async (modulActiu) => {
    const { container } = closca({ modulActiu, entorn: NAVEGADOR_SENSE_SIGNATURA, magatzem: crearMagatzemMemoria() });
    await waitFor(() => expect(container.querySelector('header.page-title > h1')).toBeTruthy());
    const insignies = ambInsignia(container);
    expect(insignies).toHaveLength(1);
    expect(insignies[0].className.split(/\s+/)).toContain(CLASSE_BETA_OBERTA);
    expect(pindoles(container).map((li) => li.textContent)).toEqual(['GESTORIA', 'PANELL INTERN', TEXTOS_BETA_OBERTA.ca]);
  });

  test.each(['contactes', 'burocracia', 'informes'])('closca · %s continua «en obres», sense la insígnia', async (modulActiu) => {
    const { container } = closca({ modulActiu, entorn: NAVEGADOR_SENSE_SIGNATURA, magatzem: crearMagatzemMemoria() });
    await waitFor(() => expect(container.querySelector('header.page-title > h1')).toBeTruthy());
    expect(pindoles(container).map((li) => li.textContent)).toEqual(['GESTORIA', 'PANELL INTERN', 'En obres']);
  });

  test('històric i IA, i identitat i Finestreta', async () => {
    const historic = render(
      <MemoryRouter rutaInicial="/app/gestoria/historic">
        <VistaHistoric magatzem={crearMagatzemMemoria()} subtle={subtle} entorn={NAVEGADOR_SENSE_SIGNATURA} rellotge={rellotge}
          avui={{ a: 2026, m: 11, d: 14 }} descarrega={vi.fn()} />
      </MemoryRouter>
    );
    expect(pindoles(historic.container).map((li) => li.textContent)).toEqual(['GESTORIA', 'Històric i IA', TEXTOS_BETA_OBERTA.ca]);
    expect(ambInsignia(historic.container)[0].className.split(/\s+/)).toContain(CLASSE_BETA_OBERTA);
    historic.unmount();
    const finestreta = render(
      <MemoryRouter rutaInicial="/app/gestoria/identitat">
        <VistaFinestreta magatzem={crearMagatzemMemoria()} subtle={subtle} entorn={NAVEGADOR_SENSE_SIGNATURA} rellotge={rellotge} />
      </MemoryRouter>
    );
    expect(pindoles(finestreta.container).map((li) => li.textContent)).toEqual(['GESTORIA', 'Identitat i Finestreta', TEXTOS_BETA_OBERTA.ca]);
    expect(ambInsignia(finestreta.container)[0].className.split(/\s+/)).toContain(CLASSE_BETA_OBERTA);
  });
});

/* La instrucció impossible no torna: cap font de producció dels dos carrils escriu el botó o la frase
   del panell fora de la via de desenvolupament (AprovacioEnLinia.jsx, darrere del literal DEV). Es mira
   el codi, sense els comentaris: els que expliquen el camí de DEV (revocar al panell) diuen la veritat. */
describe('CODEX-R24-12 · cap pantalla de la Gestoria promet el panell fora de la via de DEV', () => {
  const ARREL = process.cwd();
  const fitxersDe = (directori) => readdirSync(path.join(ARREL, directori), { withFileTypes: true }).flatMap((entrada) => {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) return fitxersDe(ruta);
    return /\.jsx?$/.test(entrada.name) && !/\.test\.jsx?$/.test(entrada.name) ? [ruta] : [];
  });
  const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  const PANELL = /Obri el panell de Tractors|al panell de Tractors/;
  test('«Obri el panell de Tractors» i «al panell de Tractors» només hi són a AprovacioEnLinia.jsx', () => {
    const fonts = [...fitxersDe('src/sections/gestoria'), ...fitxersDe('src/sections/tractors')];
    expect(fonts.length).toBeGreaterThan(60);
    const ambPanell = fonts.filter((ruta) => PANELL.test(senseComentaris(readFileSync(path.join(ARREL, ruta), 'utf8'))));
    expect(ambPanell).toEqual(['src/sections/tractors/AprovacioEnLinia.jsx']);
    // Sonda: el filtre de comentaris no amaga el codi.
    expect(PANELL.test(senseComentaris("/* al panell de Tractors */ const b = 'Obri el panell de Tractors';"))).toBe(true);
    expect(PANELL.test(senseComentaris('/* al panell de Tractors */\n// Obri el panell de Tractors\nconst b = 1;'))).toBe(false);
  });

  test('la insígnia del carril és la del registre de plugins: el mateix text valencià i la mateixa classe', async () => {
    const { ETIQUETA_BETA_OBERTA } = await import('./insigniaBetaOberta.js');
    expect(ETIQUETA_BETA_OBERTA).toEqual({ text: TEXTOS_BETA_OBERTA.ca, className: CLASSE_BETA_OBERTA });
    expect(Object.isFrozen(ETIQUETA_BETA_OBERTA)).toBe(true);
  });
});
