/* Onada R17 · AH-R17-11 / P0-88 (Sofía Bornay, Android; prompt 261110_2334,
   T1.1) · «Comparteix l'enllaç → Sóc de Poble» amb l'enllaç de recuperació del
   correu el portava a «Envia a…» del Xat: el token d'un sol ús anava a parar a
   una conversa. Ara:
     · el registre (config/compartirNatiu.js) no deixa entrar cap text amb una
       credencial d'accés (defensa en profunditat), i no la compta com a
       rebutjada: un lot fet només d'això no obri el Xat;
     · el pont (natiu/compartirNatiu.js) la buida abans del registre i de
       l'avís de la finestra; si és un enllaç de recuperació d'un origen permés
       (també dins d'un Safe Links o del redirector de Google) el porta a
       `recuperacio` (ofereixAdrecaDeRecuperacio); si no, `credencialInservible`;
     · recuperacioPendent.js el guarda com una adreça d'arribada d'un sol ús.
   Gauntlet R17 (àrbitre de 3 lents): sense App Link en este Kit (el filtre
   /registre s'empassava l'alta, l'OAuth i els convits), cap Xat per una
   credencial inservible, doble codificació i cap fals positiu de `type=`.
   Pont fals de Capacitor, com compartirNatiu.seguretat.test.js. Tot és
   sintètic: cap token ni projecte de veres. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CONNECTOR_COMPARTIR, ESDEVENIMENT_COMPARTIT, ESDEVENIMENT_FINESTRA, creaReceptorCompartit } from './compartirNatiu.js';
import { MAX_TEXT_COMPARTIT, pareixCredencialDAutenticacio } from '../config/compartirNatiu.js';
import { enllacDeRecuperacioEnText, llegixTornadaDeRecuperacio } from '../data/tornadaRecuperacio.js';
import {
  EVENT_ADRECA_DE_RECUPERACIO, EVENT_ENLLAC_DACCES_INSERVIBLE, avisaEnllacDAccesInservible, hiHaAdrecaDeRecuperacio,
  ofereixAdrecaDeRecuperacio, prenAdrecaDArribada
} from '../data/recuperacioPendent.js';

/* 56 caràcters hexadecimals, la forma del TokenHash de GoTrue. Sintètic. */
const TOKEN = '0123456789abcdef'.repeat(4).slice(0, 56);
const SUPABASE = 'https://projecte-de-proves.supabase.co';
const ORIGENS = [SUPABASE, 'https://auth.socdepoble.org', 'https://socdepoble.org'];
const PLANTILLA = `https://socdepoble.org/registre?sdp_auth=recuperacio#token_hash=${TOKEN}&type=recovery`;
const VERIFICA = `${SUPABASE}/auth/v1/verify?token=${TOKEN}&type=recovery&redirect_to=https%3A%2F%2Fsocdepoble.org%2Fregistre`;
const SAFE_LINKS = `https://eur01.safelinks.protection.outlook.com/?url=${encodeURIComponent(PLANTILLA)}&data=05%7C02&reserved=0`;
const GOOGLE = `https://www.google.com/url?q=${encodeURIComponent(PLANTILLA)}&sa=D&source=gmail`;
const GOOGLE_DINS_DE_SAFE_LINKS = `https://eur01.safelinks.protection.outlook.com/?url=${encodeURIComponent(GOOGLE)}`;

afterEach(() => {
  vi.restoreAllMocks();
  prenAdrecaDArribada();
});

describe('pareixCredencialDAutenticacio (registre, pur)', () => {
  test('reconeix els tokens dels enllaços de correu i de sessió, també codificats una, dues o tres vegades', () => {
    for (const text of [
      PLANTILLA,
      VERIFICA,
      SAFE_LINKS,
      GOOGLE,
      GOOGLE_DINS_DE_SAFE_LINKS,
      `Mira este enllaç: ${PLANTILLA} gràcies`,
      'https://socdepoble.org/#access_token=eyJ.a.b&refresh_token=r1&type=recovery',
      `https://x.example/?redirect_to=https%3A%2F%2Fsocdepoble.org%2F%23token_hash%3D${TOKEN}`,
      `https://x.example/?u=https%253A%252F%252Fsocdepoble.org%252F%2523token_hash%253D${TOKEN}`,
      'https://socdepoble.org/?type=magiclink',
      'https://socdepoble.org/#x=1&TYPE=Recovery',
      `${SUPABASE}/auth/v1/verify?token=x`,
      'https://x.example/?next=%2Fauth%2Fv1%2Fverify%3Ftoken%3Dabc',
      'provider_refresh_token=abc'
    ]) expect(pareixCredencialDAutenticacio(text), text).toBe(true);
  });

  test('no confon el text corrent amb una credencial', () => {
    for (const text of [
      'Bon dia! Mira https://socdepoble.org/mur',
      'https://botiga.example/?type=email&utm=1',
      'https://botiga.example/newsletter?type=signup',
      'https://fira.example.org/form?type=invite',
      'https://botiga.example/alta?form_type=signup',
      'https://botiga.example/?subtype=recovery',
      'https://botiga.example/?type=recovery_plan',
      'https://botiga.example/?token=promocio',
      'El token de la fira és la tomaca',
      '',
      '   '
    ]) expect(pareixCredencialDAutenticacio(text), text).toBe(false);
    for (const res of [null, undefined, 42, {}, ['token_hash=1']]) expect(pareixCredencialDAutenticacio(res)).toBe(false);
  });

  test('lineal: un text hostil enorme es resol al moment (cap ReDoS)', () => {
    const hostil = `${'token_hash'.repeat(20000)}${'%25'.repeat(20000)}${'%2Fauth%2Fv1%2Fverify'.repeat(5000)}${'&type%25%25'.repeat(5000)}`;
    const inici = performance.now();
    expect(pareixCredencialDAutenticacio(hostil)).toBe(false);
    expect(performance.now() - inici).toBeLessThan(1000);
  });
});

describe('el registre: una credencial no entra mai al lot, ni obri el Xat', () => {
  const carrega = async () => {
    vi.resetModules();
    return import('../config/compartirNatiu.js');
  };

  test('un text només amb credencial no fa cap lot; amb fotos, les fotos continuen sense el text', async () => {
    const r = await carrega();
    expect(r.lliuraCompartit({ text: `Recupera la contrasenya: ${PLANTILLA}` })).toBeNull();
    expect(r.compartitPendent()).toBeNull();
    const foto = new File(['px'], 'f.png', { type: 'image/png' });
    r.lliuraCompartit({ fitxers: [foto], text: VERIFICA });
    expect(r.compartitPendent()).toMatchObject({ text: '', rebutjats: 0 });
    expect(r.compartitPendent().fitxers[0]).toBe(foto);
    expect(JSON.stringify(r.compartitPendent())).not.toContain(TOKEN);
  });

  test('un text corrent continua igual', async () => {
    const r = await carrega();
    r.lliuraCompartit({ text: 'Bon dia, poble!' });
    expect(r.compartitPendent()).toMatchObject({ text: 'Bon dia, poble!', rebutjats: 0 });
  });
});

describe('enllacDeRecuperacioEnText (pur)', () => {
  test('la tornada de la plantilla «Reset password» d’un origen permés, tal qual', () => {
    expect(enllacDeRecuperacioEnText(`Hola, ${PLANTILLA}`, { origens: ORIGENS })).toEqual({ href: PLANTILLA });
    expect(llegixTornadaDeRecuperacio(PLANTILLA)).toEqual({ tokenHash: TOKEN });
  });

  test('l’enllaç /auth/v1/verify de GoTrue es reescriu en la forma que llig l’adaptador', () => {
    const resultat = enllacDeRecuperacioEnText(VERIFICA, { origens: ORIGENS });
    expect(resultat).toEqual({ href: `${SUPABASE}/#token_hash=${TOKEN}&type=recovery` });
    expect(llegixTornadaDeRecuperacio(resultat.href)).toEqual({ tokenHash: TOKEN });
  });

  test('desembolcalla Safe Links d’Outlook i el redirector de Google (fins a dues capes) i valida l’origen de l’interior', () => {
    for (const embolcall of [SAFE_LINKS, GOOGLE, GOOGLE_DINS_DE_SAFE_LINKS]) {
      expect(enllacDeRecuperacioEnText(`Obri: ${embolcall}`, { origens: ORIGENS }), embolcall).toEqual({ href: PLANTILLA });
    }
    const forani = `https://eur01.safelinks.protection.outlook.com/?url=${encodeURIComponent(`https://atacant.example/registre#token_hash=${TOKEN}&type=recovery`)}`;
    expect(enllacDeRecuperacioEnText(forani, { origens: ORIGENS })).toBeNull();
    // Un amfitrió que només s'hi assembla no es desembolcalla.
    const fals = `https://safelinks.protection.outlook.com.atacant.example/?url=${encodeURIComponent(PLANTILLA)}`;
    expect(enllacDeRecuperacioEnText(fals, { origens: ORIGENS })).toBeNull();
  });

  test('la puntuació que tanca la frase no és de l’enllaç', () => {
    for (const cua of ['.', ').', '»', '…?!']) {
      expect(enllacDeRecuperacioEnText(`(${VERIFICA}${cua}`, { origens: ORIGENS }), cua)
        .toEqual({ href: `${SUPABASE}/#token_hash=${TOKEN}&type=recovery` });
    }
  });

  test('una forma implícita d’un origen permés torna l’adreça: l’adaptador ja diu que no val', () => {
    const implicita = 'https://socdepoble.org/registre#access_token=eyJ.a.b&type=recovery';
    expect(enllacDeRecuperacioEnText(implicita, { origens: ORIGENS })).toEqual({ href: implicita });
    expect(llegixTornadaDeRecuperacio(implicita)).toEqual({ motiu: 'implicita' });
  });

  test('cap origen fora de la llista, ni http, ni amb usuari o port, ni un altre tipus', () => {
    for (const text of [
      `https://socdepoble.example/registre#token_hash=${TOKEN}&type=recovery`,
      `http://socdepoble.org/registre#token_hash=${TOKEN}&type=recovery`,
      `https://socdepoble.org@atacant.example/registre#token_hash=${TOKEN}&type=recovery`,
      `https://usuari:clau@socdepoble.org/registre#token_hash=${TOKEN}&type=recovery`,
      `https://socdepoble.org:8443/registre#token_hash=${TOKEN}&type=recovery`,
      `${SUPABASE}/auth/v1/verify?token=${TOKEN}&type=signup`,
      `${SUPABASE}/auth/v1/verify?type=recovery`,
      'https://socdepoble.org/registre',
      'Sense cap enllaç'
    ]) expect(enllacDeRecuperacioEnText(text, { origens: ORIGENS }), text).toBeNull();
  });

  test('sense orígens vàlids no accepta res', () => {
    expect(enllacDeRecuperacioEnText(PLANTILLA)).toBeNull();
    expect(enllacDeRecuperacioEnText(PLANTILLA, { origens: ['http://socdepoble.org', 'no és cap url', undefined, null] })).toBeNull();
    expect(enllacDeRecuperacioEnText(42, { origens: ORIGENS })).toBeNull();
  });
});

describe('recuperacioPendent: l’adreça oferida i l’avís d’inservible', () => {
  test('una adreça de recuperació s’oferix una vegada, en memòria, i avisa', () => {
    const avisos = vi.fn();
    window.addEventListener(EVENT_ADRECA_DE_RECUPERACIO, avisos);
    expect(ofereixAdrecaDeRecuperacio('https://socdepoble.org/registre')).toBe(false);
    expect(ofereixAdrecaDeRecuperacio(42)).toBe(false);
    expect(hiHaAdrecaDeRecuperacio()).toBe(false);
    expect(ofereixAdrecaDeRecuperacio(PLANTILLA)).toBe(true);
    expect(avisos).toHaveBeenCalledTimes(1);
    expect(hiHaAdrecaDeRecuperacio()).toBe(true);
    expect(prenAdrecaDArribada()).toBe(PLANTILLA);
    expect(hiHaAdrecaDeRecuperacio()).toBe(false);
    expect(prenAdrecaDArribada()).toBeNull();
    // Mai a cap emmagatzematge.
    for (const magatzem of [window.localStorage, window.sessionStorage]) {
      for (let i = 0; i < magatzem.length; i += 1) expect(magatzem.getItem(magatzem.key(i))).not.toContain(TOKEN);
    }
    window.removeEventListener(EVENT_ADRECA_DE_RECUPERACIO, avisos);
  });

  test('l’avís d’inservible no porta cap detall', () => {
    const avisos = [];
    const escolta = (event) => avisos.push(event.detail);
    window.addEventListener(EVENT_ENLLAC_DACCES_INSERVIBLE, escolta);
    avisaEnllacDAccesInservible();
    expect(avisos).toEqual([null]);
    window.removeEventListener(EVENT_ENLLAC_DACCES_INSERVIBLE, escolta);
  });
});

/* El pont fals: l'oient de cada esdeveniment, per nom. */
function muntatge({ recuperacio, credencialInservible, origensAutenticacio = ORIGENS } = {}) {
  const oients = new Map();
  const asa = { remove: vi.fn(async () => {}) };
  const pont = {
    addListener: vi.fn((connector, nom, cb) => { oients.set(nom, cb); return asa; }),
    convertFileSrc: vi.fn((ruta) => `https://localhost/_capacitor_file_${ruta}`),
    nativePromise: vi.fn(async () => ({}))
  };
  const finestra = Object.assign(new EventTarget(), { Capacitor: pont, CustomEvent: globalThis.CustomEvent });
  const avisos = [];
  finestra.addEventListener(ESDEVENIMENT_FINESTRA, (e) => avisos.push(e.detail));
  const receptor = creaReceptorCompartit({ finestra, llegix: vi.fn(), recuperacio, credencialInservible, origensAutenticacio });
  const lliura = vi.fn(() => 1);
  return { pont, asa, oients, receptor, lliura, avisos };
}
const buida = () => new Promise((resol) => { setTimeout(resol, 0); });

describe('el pont: la credencial no arriba mai al Xat', () => {
  test('l’enllaç de Sofía (plantilla) va a la recuperació, i el registre i la finestra reben el text buit, sense rebutjats', async () => {
    const recuperacio = vi.fn(() => true);
    const credencialInservible = vi.fn();
    const { pont, oients, receptor, lliura, avisos } = muntatge({ recuperacio, credencialInservible });
    await receptor.escolta(lliura);
    // Només el menú Compartir: cap App Link en este Kit.
    expect(pont.addListener).toHaveBeenCalledTimes(1);
    expect(pont.addListener).toHaveBeenCalledWith(CONNECTOR_COMPARTIR, ESDEVENIMENT_COMPARTIT, expect.any(Function));
    oients.get(ESDEVENIMENT_COMPARTIT)({ fitxers: [], text: `Partager le lien: ${PLANTILLA}`, assumpte: 'Sóc de Poble' });
    await buida();
    expect(recuperacio).toHaveBeenCalledTimes(1);
    expect(recuperacio).toHaveBeenCalledWith(PLANTILLA);
    expect(credencialInservible).not.toHaveBeenCalled();
    expect(lliura).toHaveBeenCalledTimes(1);
    expect(lliura.mock.calls[0][0]).toMatchObject({ text: '', rebutjats: 0, fitxers: [] });
    expect(JSON.stringify(lliura.mock.calls)).not.toContain(TOKEN);
    expect(JSON.stringify(avisos)).not.toContain(TOKEN);
  });

  test('l’enllaç /auth/v1/verify a l’assumpte i el de Safe Links també van a la recuperació', async () => {
    for (const [dades, esperat] of [
      [{ fitxers: [], text: '', assumpte: VERIFICA }, `${SUPABASE}/#token_hash=${TOKEN}&type=recovery`],
      [{ fitxers: [], text: `Correu d’Outlook: ${SAFE_LINKS}` }, PLANTILLA]
    ]) {
      const recuperacio = vi.fn(() => true);
      const { oients, receptor, lliura } = muntatge({ recuperacio });
      await receptor.escolta(lliura);
      oients.get(ESDEVENIMENT_COMPARTIT)(dades);
      await buida();
      expect(recuperacio).toHaveBeenCalledWith(esperat);
      expect(lliura.mock.calls[0][0]).toMatchObject({ text: '', rebutjats: 0 });
    }
  });

  test('una credencial passat el retall de 4096 caràcters tampoc no passa', async () => {
    const recuperacio = vi.fn(() => true);
    const { oients, receptor, lliura } = muntatge({ recuperacio });
    await receptor.escolta(lliura);
    oients.get(ESDEVENIMENT_COMPARTIT)({ fitxers: [], text: `${'a'.repeat(MAX_TEXT_COMPARTIT + 500)} ${PLANTILLA}` });
    await buida();
    expect(lliura.mock.calls[0][0].text).toBe('');
    expect(recuperacio).toHaveBeenCalledWith(PLANTILLA);
  });

  test('d’un origen que no és nostre, sense qui la reba o si la recuperació falla: fora el text, cap rebutjat i l’avís d’inservible', async () => {
    const casos = [
      { recuperacio: vi.fn(() => true), text: `https://atacant.example/registre#token_hash=${TOKEN}&type=recovery` },
      { recuperacio: undefined, text: PLANTILLA },
      { recuperacio: vi.fn(() => { throw new Error('trencat'); }), text: PLANTILLA },
      { recuperacio: vi.fn(() => false), text: PLANTILLA }
    ];
    for (const { recuperacio, text } of casos) {
      const credencialInservible = vi.fn();
      const { oients, receptor, lliura, avisos } = muntatge({ recuperacio, credencialInservible });
      await receptor.escolta(lliura);
      oients.get(ESDEVENIMENT_COMPARTIT)({ fitxers: [], text });
      await buida();
      expect(lliura.mock.calls[0][0], text).toMatchObject({ text: '', rebutjats: 0 });
      expect(credencialInservible, text).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(avisos), text).not.toContain(TOKEN);
    }
  });

  test('un avís d’inservible que llança no tomba el lot', async () => {
    const { oients, receptor, lliura } = muntatge({ credencialInservible: () => { throw new Error('trencat'); } });
    await receptor.escolta(lliura);
    oients.get(ESDEVENIMENT_COMPARTIT)({ fitxers: [], text: PLANTILLA });
    await buida();
    expect(lliura).toHaveBeenCalledTimes(1);
  });

  test('un text corrent continua arribant al Xat, sense avisos', async () => {
    const credencialInservible = vi.fn();
    const { oients, receptor, lliura } = muntatge({ credencialInservible });
    await receptor.escolta(lliura);
    oients.get(ESDEVENIMENT_COMPARTIT)({ fitxers: [], text: 'Mira https://socdepoble.org/mur' });
    await buida();
    expect(lliura.mock.calls[0][0]).toMatchObject({ text: 'Mira https://socdepoble.org/mur', rebutjats: 0 });
    expect(credencialInservible).not.toHaveBeenCalled();
  });
});
