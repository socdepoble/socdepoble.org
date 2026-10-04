// @vitest-environment-options {"url": "https://socdepoble.sollutia.com/app/registre?mode=entrar"}
/* B · Onada 4, quarta passada (261003) · Directriu de MarIA 261003_2221 i
   auditoria de Codex 261003_1950 (W4-06, «Resposta a Claude v0.5.0»). Dins
   d'un iframe d'un altre lloc amb COOP, cap camí de tornada no arriba a la
   mare (el límit conegut d'oauthRelay.js). La decisió és avisar ABANS d'OAuth
   i oferir l'eixida fora del marc.
   POLÍTICA CONSERVADORA: el detector veu ORÍGENS, no llocs ni particions.
   Es rebutja Google en qualsevol marc el document de dalt del qual és d'un
   altre origen, també els subdominis del mateix lloc, on el navegador potser
   sí que hi arribaria. El marc del mateix origen i el component directe de
   WordPress (cap marc) fan el camí de sempre.
   jsdom declara window.top [LegacyUnforgeable]: no es pot falsejar. La
   finestra de cada cas es construïx amb el model de la política del mateix
   origen (top.location.href només es pot llegir si els dos orígens són
   iguals) i passa pel detector de veres; entraAmbGoogle el crida per
   _intern, com redirigeix. Navegadors reals, [NO VERIFICAT] ací. */
import { afterEach, expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { getEfimer } from '../config/storage.js';
import { esborraSessio } from './identitat.js';
import { beginAuthAttempt, cancelAuthAttempts } from './authAttempt.js';
import {
  _intern, entraAmbGoogle, esMarcDAltreOrigen, googleEnMarcAlie, exigeixSenseMarcAlie, urlPerAObrirFora,
  CODI_ENTRADA_EN_MARC, AVIS_ENTRADA_EN_MARC
} from './oauthRelay.js';

const ORIGEN_APP = 'https://socdepoble.sollutia.com';
const config = () => ({ hasSupabaseConfig: true, supabaseUrl: 'https://backend.example.test', supabaseAnonKey: 'public' });
const emmagatzemat = () => [window.localStorage, window.sessionStorage]
  .flatMap((capa) => Object.keys(capa).sort().map((clau) => `${clau}=${capa.getItem(clau)}`)).join('\n');

/* El model de la política del mateix origen: el document de dalt deixa llegir
   location.href només a un marc del seu mateix origen; si no, SecurityError,
   com Chrome, Firefox i Safari. */
function finestraDeDalt(origen) {
  const finestra = { location: { href: `${origen}/pagina` } };
  finestra.self = finestra;
  finestra.top = finestra;
  return finestra;
}
function marcDins(origenDalt, origenMarc = ORIGEN_APP) {
  const dalt = {
    location: {
      get href() {
        if (origenDalt !== origenMarc) throw new DOMException('Blocked a frame from accessing a cross-origin frame.', 'SecurityError');
        return `${origenDalt}/pagina`;
      }
    }
  };
  dalt.top = dalt;
  dalt.self = dalt;
  const finestra = { top: dalt, location: { href: `${origenMarc}/app/registre` } };
  finestra.self = finestra;
  return finestra;
}

/* Revisió adversarial (261003, nit) · Marcs niuats, amb `parent` de veres: la
   finestra de dalt és de l'app i es pot llegir, però el marc del mig és d'un
   altre origen (A → B → A). L'emmagatzematge del marc de baix també és
   particionat: mirar només `top` el deixava passar. */
function marcNiuat(origenMig) {
  const dalt = { location: { href: `${ORIGEN_APP}/pagina` } };
  dalt.top = dalt; dalt.self = dalt; dalt.parent = dalt;
  const mig = {
    top: dalt,
    parent: dalt,
    location: {
      get href() {
        if (origenMig !== ORIGEN_APP) throw new DOMException('Blocked a frame from accessing a cross-origin frame.', 'SecurityError');
        return `${origenMig}/mig`;
      }
    }
  };
  mig.self = mig;
  const finestra = { top: dalt, parent: mig, location: { href: `${ORIGEN_APP}/app/registre` } };
  finestra.self = finestra;
  return finestra;
}

/* La matriu mínima de Codex (primera part, mateix origen, mateix lloc, un
   altre lloc), el component directe de WordPress i dos marges. */
const CASOS = [
  ['primera part (finestra de dalt)', () => finestraDeDalt(ORIGEN_APP), false],
  ['WordPress amb el component directe (cap marc)', () => finestraDeDalt('https://gentdelatorre.net'), false],
  ['iframe del mateix origen', () => marcDins(ORIGEN_APP), false],
  ['iframe d’un altre origen del mateix lloc (www.sollutia.com): rebutjat per política', () => marcDins('https://www.sollutia.com'), true],
  ['iframe d’un altre lloc (gentdelatorre.net)', () => marcDins('https://gentdelatorre.net'), true],
  ['iframe amb sandbox sense allow-same-origin (origen opac)', () => marcDins(ORIGEN_APP, 'null'), true],
  ['iframe del mateix origen dins d’un marc del mateix origen (A → A → A)', () => marcNiuat(ORIGEN_APP), false],
  ['revisió · iframe de l’app dins d’un marc d’un altre lloc, amb l’app a dalt (A → B → A)', () => marcNiuat('https://gentdelatorre.net'), true]
];

afterEach(() => {
  cancelAuthAttempts(); esborraSessio(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  window.sessionStorage.clear();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/app/registre?mode=entrar');
});

test.each(CASOS)('esMarcDAltreOrigen · %s', (_cas, fes, refusat) => {
  expect(esMarcDAltreOrigen(fes())).toBe(refusat);
});

test('esMarcDAltreOrigen · un navegador que no llança però no dona l’adreça també és un marc alié; sense finestra, cap', () => {
  const dalt = { location: {} };
  const finestra = { top: dalt, location: {} };
  finestra.self = finestra;
  expect(esMarcDAltreOrigen(finestra)).toBe(true);
  // Un marc desenganxat (top null) o cap finestra (fora del navegador): no hi ha cap marc a rebutjar.
  const solt = { top: null };
  solt.self = solt;
  expect(esMarcDAltreOrigen(solt)).toBe(false);
  expect(esMarcDAltreOrigen(null)).toBe(false);
});

test('esMarcDAltreOrigen · amb les finestres de veres de jsdom: la de dalt i un iframe del mateix origen no són marcs aliens', () => {
  expect(window.top).toBe(window.self);
  expect(esMarcDAltreOrigen(window)).toBe(false);
  expect(googleEnMarcAlie()).toBe(false);
  expect(() => exigeixSenseMarcAlie()).not.toThrow();
  const iframe = document.createElement('iframe');
  document.body.append(iframe);
  try {
    const marc = iframe.contentWindow;
    // Premissa: és un marc de veres (top no és ell) i el document de dalt és del mateix origen (es llig).
    expect(marc.top !== marc.self).toBe(true);
    expect(typeof marc.top.location.href).toBe('string');
    expect(esMarcDAltreOrigen(marc)).toBe(false);
    // Revisió · i un marc niuat dins d'eixe, tot del mateix origen: el detector camina pels pares i tampoc el rebutja.
    const fill = marc.document.createElement('iframe');
    marc.document.body.append(fill);
    expect(fill.contentWindow.parent).toBe(marc);
    expect(esMarcDAltreOrigen(fill.contentWindow)).toBe(false);
  } finally { iframe.remove(); }
});

test.each(CASOS)('B · entraAmbGoogle, %s', async (_cas, fes, refusat) => {
  const crypto = {
    getRandomValues: vi.fn(webcrypto.getRandomValues.bind(webcrypto)),
    subtle: { digest: vi.fn(webcrypto.subtle.digest.bind(webcrypto.subtle)) }
  };
  vi.stubGlobal('crypto', crypto);
  const finestra = fes();
  const detector = vi.spyOn(_intern, 'esMarcDAltreOrigen').mockImplementation(() => esMarcDAltreOrigen(finestra));
  const popup = { location: {}, closed: false, close: vi.fn() };
  const obri = vi.spyOn(window, 'open').mockReturnValue(popup);
  const redirigeix = vi.spyOn(_intern, 'redirigeix').mockImplementation(() => {});
  const resolConfig = vi.fn(config);
  // Una altra entrada en curs (la del correu, per exemple).
  const previ = beginAuthAttempt();
  const abans = emmagatzemat();
  const work = entraAmbGoogle({}, resolConfig);
  expect(detector).toHaveBeenCalledWith(window);
  if (refusat) {
    await expect(work).rejects.toMatchObject({ code: CODI_ENTRADA_EN_MARC, message: AVIS_ENTRADA_EN_MARC });
    // Zero intents OAuth, zero emergents, zero redireccions, zero PKCE, zero ids i zero registres.
    expect(obri).not.toHaveBeenCalled();
    expect(redirigeix).not.toHaveBeenCalled();
    expect(crypto.getRandomValues).not.toHaveBeenCalled();
    expect(crypto.subtle.digest).not.toHaveBeenCalled();
    expect(resolConfig).not.toHaveBeenCalled();
    expect(emmagatzemat()).toBe(abans);
    expect(() => previ.assertCurrent()).not.toThrow();
    expect(window.location.href).toBe(`${ORIGEN_APP}/app/registre?mode=entrar`);
  } else {
    const result = expect(work).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(popup.location.href).toContain('/auth/v1/authorize'));
    expect(obri).toHaveBeenCalledTimes(1);
    expect(getEfimer(_intern.CLAU_VERIFICADOR, null)).toBeTruthy();
    expect(getEfimer(_intern.CLAU_INTENT, null)).toMatch(_intern.FORMA_INTENT);
    // L'entrada amb Google és un intent: el de abans s'ha avortat, com sempre.
    expect(() => previ.assertCurrent()).toThrow();
    cancelAuthAttempts(); await result;
  }
});

test('B · exigeixSenseMarcAlie i googleEnMarcAlie passen pel mateix detector, amb la finestra de veres', () => {
  const detector = vi.spyOn(_intern, 'esMarcDAltreOrigen').mockReturnValue(true);
  expect(googleEnMarcAlie()).toBe(true);
  let error = null;
  try { exigeixSenseMarcAlie(); } catch (e) { error = e; }
  expect(error).toBeInstanceOf(Error);
  expect(error).toMatchObject({ code: 'ENTRADA_EN_MARC', message: AVIS_ENTRADA_EN_MARC });
  expect(detector.mock.calls).toEqual([[window], [window]]);
  // El text: les paraules clau primer i en valencià.
  expect(AVIS_ENTRADA_EN_MARC).toBe('Dins d’este marc no es pot entrar amb Google. Obri Sóc de Poble en una pestanya nova per a entrar.');
});

test('urlPerAObrirFora · l’entrada real de l’app al seu origen, sense codis OAuth, marques ni fragment', () => {
  expect(urlPerAObrirFora()).toBe(`${ORIGEN_APP}/app/registre?mode=entrar`);
  window.history.replaceState(null, '', `/app/registre?mode=entrar&code=VELL&state=S&sdp_oauth_attempt=${'A'.repeat(22)}&sdp_auth=alta#access_token=vell`);
  expect(urlPerAObrirFora()).toBe(`${ORIGEN_APP}/app/registre?mode=entrar`);
  // Una pàgina sense tornada http(s) possible: cap adreça (la interfície no pinta l'enllaç).
  for (const href of ['about:blank', 'about:srcdoc', 'file:///C:/pagina.html', 'no és una URL']) {
    expect(urlPerAObrirFora({ href }), href).toBeNull();
  }
});
