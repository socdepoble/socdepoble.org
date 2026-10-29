/**
 * Gauntlet 261025_0545 (TE-01) · /registre parla la llengua triada.
 *
 * El registre, el consentiment RGPD, la recuperació de la contrasenya i la
 * benvinguda eren literals valencians: amb l'anglés triat, <html lang="en">
 * anunciava una llengua que la pantalla no parlava (prova CDP de l'auditoria:
 * «Nom i cognoms», «Consent el tractament de dades personals…»). I 33 claus
 * section.login.* ja traduïdes s'havien quedat òrfenes des de cc4980dec.
 *  · Font: cada clau que criden els tres fitxers és als cinc diccionaris; la
 *    reserva escrita al codi és el valor valencià (el text de sempre, byte a
 *    byte); les claus noves tenen valor propi en cada llengua i els mateixos
 *    {forats}; cap frase llarga del diccionari queda escrita fora d'una crida.
 *  · Pantalla: pintada en es, en, eu i gl, cap frase valenciana de les claus
 *    hi queda (text, aria-label, title i avisos), i el valencià no canvia.
 *  · Fora d'abast, i per això no s'hi miren: els errors de onboardingModel.js
 *    (MISSATGES_ENTRADA és només en valencià per la decisió D4 del Mestre) i
 *    els avisos de l'accés pilot, que només existixen en desenvolupament.
 */
import '../../../tests/helpers/diccionaris.js';
import React from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), config: null, t: undefined, teCapacitat: undefined, comprova: vi.fn(),
  google: vi.fn(), registra: vi.fn(), entra: vi.fn(), demana: vi.fn(), defineix: vi.fn(), marc: false, enllac: null
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate }));
/* La capçalera també és text de /registre: el títol, l'entradeta i les etiquetes es pinten. */
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, lead, labels, children }) => (
    <main><header className="page-title"><h1>{title}</h1></header>{lead ? <p>{lead}</p> : null}{(labels || []).map((etiqueta) => <span key={etiqueta}>{etiqueta}</span>)}{children}</main>
  )
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/SessionContext', () => ({
  useSession: () => ({
    currentUser: null, teCapacitat: m.teCapacitat, comprovaServidor: m.comprova, loginWithGoogle: m.google,
    registerWithPassword: m.registra, loginWithPassword: m.entra, demanaRecuperacioContrasenya: m.demana,
    definixContrasenyaNova: m.defineix, enllacDeRecuperacio: m.enllac, oblidaEnllacDeRecuperacio: vi.fn(), logout: vi.fn()
  })
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: m.config, t: m.t }) }));
vi.mock('../../config/dataMode.js', async (importOriginal) => ({
  ...(await importOriginal()),
  resolveDataMode: (config) => config.dataMode || 'remote', enterRemoteMode: vi.fn(), eleccioRemotaActiva: () => false,
  exitRemoteMode: vi.fn(), enterTestMode: vi.fn()
}));
vi.mock('../../host.js', () => ({ quanLlest: () => Promise.resolve() }));
/* Sense l'accés pilot (només de desenvolupament): així «Forçar entrada local (Mock)» es veu. */
vi.mock('../../data/sessioPilot.js', async (importOriginal) => ({ ...(await importOriginal()), entradaPilotDisponible: () => false }));
vi.mock('../../data/oauthRelay.js', async (importOriginal) => ({
  ...(await importOriginal()), googleEnMarcAlie: () => m.marc, urlPerAObrirFora: () => 'https://socdepoble.test/app/registre?mode=entrar'
}));
/* La targeta real porta accions i telemetria que ací no es proven. */
vi.mock('../../components/PedraSeca/index.js', async (importOriginal) => ({
  ...(await importOriginal()),
  UniversalCard: ({ title, subtitle, body }) => <section><h3>{title}</h3>{subtitle ? <p>{subtitle}</p> : null}{body}</section>,
}));
import OnboardingSection from './OnboardingSection.jsx';
import { MARCA_SENSE_ENTRADA_AUTOMATICA } from './onboardingModel.js';
import { MISSATGE_RECUPERACIO_ENVIADA } from './RecuperacioSteps.jsx';
import { createTranslator } from '../../config/i18n.js';
import { delEfimer, setEfimer } from '../../config/storage.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';

const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
const ALTRES = ['es', 'en', 'eu', 'gl'];
const TENANT = '00000000-0000-4000-8000-0000000000de';
const DIR = path.join(process.cwd(), 'src/sections/onboarding');
/* P1-68 (pla 261028_1526) · Els camps de l'alta per a l'@usuari i el poble viuen a CampsDIdentitatALAlta.jsx. */
const FITXERS = ['OnboardingSteps.jsx', 'RecuperacioSteps.jsx', 'OnboardingSection.jsx', 'CampsDIdentitatALAlta.jsx'];
const FONTS = Object.fromEntries(FITXERS.map((nom) => [nom, readFileSync(path.join(DIR, nom), 'utf8')]));

/* t('clau', 'reserva') i tr(…): la reserva, si n'hi ha, és un literal d'una
   sola línia o una constant (MISSATGE_RECUPERACIO_ENVIADA). */
const CRIDA = /\b(?:t|tr)\(\s*(['"])([\w.]+)\1(?:\s*,\s*(?:(['"])(.*?)\3|[A-Za-z_$][\w$.]*))?\s*\)/g;
const crides = Object.entries(FONTS).flatMap(([fitxer, font]) => [...font.matchAll(CRIDA)]
  .map((trobada) => ({ fitxer, clau: trobada[2], reserva: trobada[3] ? trobada[4] : null })));
const CLAUS_USADES = [...new Set(crides.map((crida) => crida.clau))].sort();

/* Les claus que naixen amb este canvi; les òrfenes de section.login.* que tornen
   a tindre qui les cride, i dos que ja deien el mateix (Cancel·la, Torna-ho a provar). */
const NOVES = /^section\.login\.(?:registre|recuperacio|benvinguda|servidor|google)\.|^section\.login\.divisorCorreu$/;
const REUTILITZADES = [
  'section.login.loginTitle', 'section.login.registerTitle', 'section.login.placeholder.name',
  'section.login.loginEmail', 'section.login.loginPassword', 'section.login.nativa.cancela', 'common.reintenta'
];
const CLAUS_NOVES = Object.keys(CA).filter((clau) => NOVES.test(clau)).sort();
const forats = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((trobada) => trobada[1]).sort();
/* El que es pot buscar a la pantalla o a la font: la frase sencera o, amb
   {forats}, els seus trossos fixos prou llargs («Mínim» és també el principi de
   «Mínimo»: un tros curt no diu res). */
const trossos = (text) => (/\{\w+\}/.test(text)
  ? String(text).split(/\{\w+\}/).map((tros) => tros.trim()).filter((tros) => tros.length >= 8)
  : [String(text)]);
const senseComentaris = (font) => font.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('font · claus, reserves i diccionaris', () => {
  test('els tres fitxers criden les claus noves i les òrfenes reutilitzades', () => {
    expect(CLAUS_NOVES.length).toBeGreaterThanOrEqual(55);
    expect(CLAUS_NOVES.filter((clau) => !CLAUS_USADES.includes(clau))).toEqual([]);
    expect(REUTILITZADES.filter((clau) => !CLAUS_USADES.includes(clau))).toEqual([]);
  });

  test('tota clau que criden és als cinc diccionaris', () => {
    for (const [codi, dic] of Object.entries(DICCIONARIS)) {
      expect([codi, CLAUS_USADES.filter((clau) => typeof dic[clau] !== 'string' || !dic[clau].trim())]).toEqual([codi, []]);
    }
  });

  test('la reserva escrita al codi és el valor valencià: el valencià es pinta com abans', () => {
    const desfasades = crides.filter((crida) => crida.reserva !== null && crida.reserva !== CA[crida.clau])
      .map((crida) => `${crida.fitxer}: ${crida.clau}`);
    expect(desfasades).toEqual([]);
    /* L'avís d'enviat continua exportat (el llig OnboardingSection.recuperacio.test.jsx): és la reserva de la seua clau. */
    expect(MISSATGE_RECUPERACIO_ENVIADA).toBe(CA['section.login.recuperacio.enviada']);
  });

  test.each(ALTRES)('%s: cada clau nova té valor propi i els mateixos {forats}', (codi) => {
    const dic = DICCIONARIS[codi];
    expect(CLAUS_NOVES.filter((clau) => dic[clau] === CA[clau])).toEqual([]);
    expect(CLAUS_NOVES.filter((clau) => forats(dic[clau]).join() !== forats(CA[clau]).join())).toEqual([]);
  });

  test('cap frase de les claus queda escrita fora d’una crida', () => {
    for (const [fitxer, font] of Object.entries(FONTS)) {
      const resta = senseComentaris(font).replace(CRIDA, '');
      /* Els noms curts («Contrasenya», «Entrar») viuen també dins d'identificadors: els vigila la pantalla. */
      const frases = CLAUS_USADES.flatMap((clau) => trossos(CA[clau])).filter((tros) => tros.length >= 12);
      const aLaVista = frases.filter((frase) => resta.includes(frase))
        .filter((frase) => !(fitxer === 'RecuperacioSteps.jsx' && frase === MISSATGE_RECUPERACIO_ENVIADA));
      expect([fitxer, aLaVista]).toEqual([fitxer, []]);
    }
  });
});

/* ── Pantalla ───────────────────────────────────────────────────────── */

const buida = () => act(async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); });
const pinta = async () => { render(<OnboardingSection />); await buida(); };
const canvia = (etiqueta, name, value) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { name, value } });

/* Tot el que /registre diu: el text, els noms accessibles i els avisos (toasts). */
function textDeLaPantalla() {
  const atributs = [...document.body.querySelectorAll('[aria-label],[title],[placeholder]')]
    .flatMap((node) => ['aria-label', 'title', 'placeholder'].map((nom) => node.getAttribute(nom)).filter(Boolean));
  return [document.body.textContent, ...atributs].join('\n');
}

/**
 * Recorre els estats de /registre en una llengua i torna el que s'hi ha dit.
 * Sense provocar els errors de onboardingModel.js (fora d'abast, D4).
 */
async function recorre(codi) {
  const d = DICCIONARIS[codi];
  const vist = [];
  const mira = () => { vist.push(textDeLaPantalla()); };
  const tanca = () => { mira(); cleanup(); };
  m.t = createTranslator(codi);

  /* Mode de proves amb el servidor caigut: l'avís, «Torna-ho a provar» i «Forçar entrada local». */
  m.config = { dataMode: 'seed', tenantId: TENANT };
  m.teCapacitat = (capacitat) => capacitat === 'salut';
  m.comprova.mockResolvedValue({ ok: false });
  await pinta(); tanca();
  /* De tornada al mode de proves: «Connectar amb el servidor». */
  m.teCapacitat = undefined;
  setEfimer(MARCA_SENSE_ENTRADA_AUTOMATICA, true);
  await pinta(); tanca();

  m.config = { dataMode: 'remote', tenantId: TENANT };
  m.teCapacitat = (capacitat) => capacitat === 'recuperacioContrasenya';
  /* Crear compte: el consentiment, i els dos errors propis del formulari (parella i RGPD). */
  m.registra.mockResolvedValue({});
  await pinta();
  expect(screen.getByRole('checkbox').labels[0].textContent).toBe(d['section.login.registre.consentiment']);
  canvia(d['section.login.placeholder.name'], 'name', 'Ana Puig');
  canvia(d['section.login.loginEmail'], 'email', 'ana@poble.test');
  canvia(d['section.login.loginPassword'], 'password', 'contrasenya-llarga');
  canvia(d['section.login.registre.confirmaContrasenya'], 'confirmPassword', 'una-altra-contrasenya');
  await act(async () => { fireEvent.submit(document.querySelector('form')); });
  expect(screen.getByText(d['section.login.registre.errorRgpd'])).toBeTruthy();
  expect(screen.getByText(d['section.login.registre.errorContrasenyes'])).toBeTruthy();
  mira();
  /* Sense sessió en tornar: «Confirma el teu compte». */
  canvia(d['section.login.registre.confirmaContrasenya'], 'confirmPassword', 'contrasenya-llarga');
  fireEvent.click(screen.getByRole('checkbox'));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: d['section.login.registre.botoCrear'] })); });
  expect(screen.getByRole('heading', { name: d['section.login.registre.enviatTitol'] })).toBeTruthy();
  tanca();

  /* Entrar: els errors propis, «Has oblidat la contrasenya?» i la recuperació. */
  m.demana.mockResolvedValue(undefined);
  await pinta();
  fireEvent.click(screen.getByRole('button', { name: d['section.login.loginTitle'], exact: true }));
  await act(async () => { fireEvent.submit(document.querySelector('form')); });
  expect(screen.getByText(d['section.login.registre.errorCorreu'])).toBeTruthy();
  expect(screen.getByText(d['section.login.registre.errorContrasenya'])).toBeTruthy();
  mira();
  fireEvent.click(screen.getByRole('button', { name: d['section.login.registre.oblidada'] }));
  await act(async () => { fireEvent.submit(document.querySelector('form')); });
  expect(screen.getByText(d['section.login.registre.errorCorreu'])).toBeTruthy();
  mira();
  canvia(d['section.login.loginEmail'], 'email', 'ana@poble.test');
  await act(async () => { fireEvent.submit(document.querySelector('form')); });
  expect(screen.getByText(d['section.login.recuperacio.enviada'])).toBeTruthy();
  tanca();

  /* Google: l'espera amb «Cancel·la l’entrada». */
  m.google.mockReturnValue(new Promise(() => {}));
  await pinta();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: d['section.login.google.boto'] })); });
  expect(screen.getByRole('button', { name: d['section.login.nativa.cancela'] })).toBeTruthy();
  tanca();
  /* Dins d'un marc d'un altre origen: l'eixida a una pestanya nova. */
  m.marc = true;
  await pinta(); tanca();
  m.marc = false;

  /* Els avisos d'èxit: compte creat, entrada amb contrasenya i amb Google, contrasenya nova desada. */
  m.registra.mockResolvedValue({ access_token: 'x' });
  m.entra.mockResolvedValue({});
  m.google.mockResolvedValue({});
  await pinta();
  canvia(d['section.login.placeholder.name'], 'name', 'Ana Puig');
  canvia(d['section.login.loginEmail'], 'email', 'ana@poble.test');
  canvia(d['section.login.loginPassword'], 'password', 'contrasenya-llarga');
  canvia(d['section.login.registre.confirmaContrasenya'], 'confirmPassword', 'contrasenya-llarga');
  fireEvent.click(screen.getByRole('checkbox'));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: d['section.login.registre.botoCrear'] })); });
  fireEvent.click(screen.getByRole('button', { name: d['section.login.loginTitle'], exact: true }));
  canvia(d['section.login.loginEmail'], 'email', 'ana@poble.test');
  canvia(d['section.login.loginPassword'], 'password', 'contrasenya-llarga');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: d['section.login.registre.botoEntrar'] })); });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: d['section.login.google.boto'] })); });
  tanca();

  /* L'enllaç del correu: «Definix la contrasenya nova» (i en desar, l'avís) i l'enllaç perdut. */
  m.enllac = 'pendent';
  m.defineix.mockResolvedValue(undefined);
  await pinta();
  canvia(d['section.login.recuperacio.novaCamp'], 'password', 'contrasenya-llarga');
  canvia(d['section.login.recuperacio.novaConfirma'], 'confirmPassword', 'contrasenya-llarga');
  mira();
  await act(async () => { fireEvent.submit(document.querySelector('form')); });
  tanca();
  m.enllac = 'perdut';
  await pinta(); tanca();
  m.enllac = null;

  return [...vist, ...m.toast.mock.calls.map(([text]) => text)].join('\n');
}

beforeEach(() => {
  for (const f of [m.navigate, m.toast, m.comprova, m.google, m.registra, m.entra, m.demana, m.defineix]) f.mockReset();
  m.t = undefined; m.teCapacitat = undefined; m.marc = false; m.enllac = null;
  delEfimer(MARCA_SENSE_ENTRADA_AUTOMATICA);
});
afterEach(() => {
  cleanup();
  delEfimer(MARCA_SENSE_ENTRADA_AUTOMATICA);
});

describe('pantalla · la llengua triada', () => {
  test.each(ALTRES)('%s: cap frase valenciana de les claus queda a /registre', async (codi) => {
    const dic = DICCIONARIS[codi];
    const dit = await recorre(codi);
    const valencianes = CLAUS_USADES.filter((clau) => dic[clau] !== CA[clau]).flatMap((clau) => trossos(CA[clau]));
    expect(valencianes.length).toBeGreaterThan(50);
    expect(valencianes.filter((frase) => dit.includes(frase))).toEqual([]);
    /* I el que hi ha és la seua llengua: els quatre avisos d'èxit. */
    expect(m.toast.mock.calls.map(([text]) => text)).toEqual([
      dic['section.login.benvinguda.compteCreat'], dic['section.login.benvinguda.deNou'], dic['section.login.benvinguda.deNou'],
      dic['section.login.benvinguda.contrasenyaDesada']
    ]);
  });

  test('ca: el valencià de sempre, amb els nodes de sempre al voltant de cada peça', async () => {
    m.t = createTranslator('ca');
    m.config = { dataMode: 'seed', tenantId: TENANT };
    await pinta();
    expect(screen.getByRole('checkbox').labels[0].textContent)
      .toBe('Consent el tractament de dades personals (RGPD Llei 05) exclusivament per a Sóc de Poble.');
    expect(screen.getAllByRole('heading').map((h) => h.textContent))
      .toEqual(['Benvinguda al Mas Electrònic', 'Benvinguda a la Beta de Sóc de Poble', 'Accés ràpid amb Google', 'Crea el teu compte']);
    const benvinguda = document.querySelector('.onboarding-card__intro--espaiada');
    expect(benvinguda.innerHTML).toBe('L\'accés és <strong>totalment segur</strong> i les teues dades estan protegides per llei (RGPD Llei 05). '
      + 'Com que estem en proves, t\'agrairem que ens avises si trobes algun problema, especialment al mòbil. Et mantindrem al dia de les novetats!');
    for (const etiqueta of ['Nom i cognoms', 'Correu electrònic', 'Contrasenya', 'Confirmar contrasenya']) expect(screen.getByLabelText(etiqueta)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mostra la contrasenya' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Opcions d’accés' })).toBeTruthy();
  });
});
