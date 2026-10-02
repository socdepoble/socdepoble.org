/**
 * T1 (prompt comú 261002_0125) · L'adaptador de lectura de Google Calendar
 * amb un fetch simulat (cap xarxa): la consulta, la paginació, els actes de
 * dia sencer i amb hora, els cancel·lats, els errors tipats; i l'autorització
 * OAuth (l'adreça, la lectura de la tornada i l'espera de la finestra).
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { entradaOcorreElDia } from '../calendariGlobal.js';
import {
  AMBIT_LECTURA, CANAL_OAUTH, MAX_RESULTATS, TIPUS_MISSATGE_OAUTH, crearFontGoogle, esAdrecaDeRetorn, esClientGoogle,
  esdevenimentDeGoogle, esperaRespostaOAuth, generaEstatOAuth, llegixRespostaOAuth, urlAutoritzacioGoogle,
  urlEsdevenimentsGoogle
} from './googleCalendar.js';

const CLIENT = '123456789012-provesprovesproves.apps.googleusercontent.com';
const ORIGEN = 'http://localhost:3000';
const RETORN = `${ORIGEN}/auth/calendari-google.html`;
const ESTAT = 'abcdefabcdefabcdefabcdefabcdefabcdefabcdef';
const TOKEN = 'ya29.token-de-proves-0123456789';
const OCTUBRE = { desde: new Date(2026, 9, 1), fins: new Date(2026, 10, 1) };

const FIRA = { id: 'fira1', status: 'confirmed', summary: 'Fira de tardor', start: { date: '2026-10-17' }, end: { date: '2026-10-18' } };
const CONCERT = {
  id: 'concert1', status: 'confirmed', summary: 'Concert a la plaça', location: 'Plaça Major',
  start: { dateTime: '2026-10-10T19:00:00+02:00', timeZone: 'Europe/Madrid' }, end: { dateTime: '2026-10-10T21:00:00+02:00', timeZone: 'Europe/Madrid' }
};
const ANULLAT = { id: 'anullat1', status: 'cancelled' };

const resposta = (cos, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => cos });
function fetchDe(...respostes) {
  return vi.fn(async () => {
    const seguent = respostes.shift();
    if (seguent instanceof Error) throw seguent;
    return seguent;
  });
}
const font = (fetchImpl, extra = {}) => crearFontGoogle({
  id: 'privat', nom: 'El meu calendari', calendarId: 'primary', colorToken: 'accio', obteToken: () => TOKEN, fetchImpl, ...extra
});
const tipusDe = async (promesa) => promesa.then(() => 'cap', (error) => error.tipus ?? error.name);

describe('lectura · events.list', () => {
  test('la consulta: calendari codificat, instàncies soltes per ordre d’inici, el rang, 250 per pàgina, la zona del poble i només els camps que es pinten', () => {
    const url = new URL(urlEsdevenimentsGoogle({ calendarId: 'calendari@example.org', ...OCTUBRE }));
    expect(url.origin + url.pathname).toBe('https://www.googleapis.com/calendar/v3/calendars/calendari%40example.org/events');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      singleEvents: 'true', orderBy: 'startTime', timeMin: OCTUBRE.desde.toISOString(), timeMax: OCTUBRE.fins.toISOString(),
      maxResults: String(MAX_RESULTATS), timeZone: 'Europe/Madrid'
    });
    expect(url.searchParams.get('fields')).not.toMatch(/attendees|organizer|creator/);
    expect(url.searchParams.has('pageToken')).toBe(false);
  });

  test('pagina amb nextPageToken, porta el token Bearer i torna les entrades de totes les pàgines', async () => {
    const fetchImpl = fetchDe(resposta({ items: [FIRA], nextPageToken: 'pagina-2' }), resposta({ items: [CONCERT] }));
    const entrades = await font(fetchImpl).llistaEntrades(OCTUBRE);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const [primera, opcions] = fetchImpl.mock.calls[0];
    expect(new URL(primera).searchParams.has('pageToken')).toBe(false);
    expect(new URL(fetchImpl.mock.calls[1][0]).searchParams.get('pageToken')).toBe('pagina-2');
    expect(opcions).toMatchObject({ method: 'GET', credentials: 'omit', headers: { Authorization: `Bearer ${TOKEN}` } });
    expect(entrades.map((entrada) => entrada.esdeveniment.titol)).toEqual(['Fira de tardor', 'Concert a la plaça']);
    expect(entrades.every((entrada) => entrada.font === 'privat' && entrada.agenda && entrada.item === null)).toBe(true);
  });

  test('fetch es crida com a funció lliure (el del navegador no admet cap altre this)', async () => {
    let elThis = 'sense cridar';
    const fetchImpl = function () {
      elThis = this;
      return Promise.resolve(resposta({ items: [] }));
    };
    await font(fetchImpl).llistaEntrades(OCTUBRE);
    expect(elThis).toBeUndefined();
  });

  test('un acte de dia sencer: start.date i end.date EXCLUSIU, com el model', async () => {
    const [entrada] = await font(fetchDe(resposta({ items: [FIRA] }))).llistaEntrades(OCTUBRE);
    expect(entrada.esdeveniment).toMatchObject({ totElDia: true, inici: { data: '2026-10-17' }, fi: { data: '2026-10-18' } });
    expect(entradaOcorreElDia(entrada, '2026-10-17')).toBe(true);
    expect(entradaOcorreElDia(entrada, '2026-10-18')).toBe(false);
  });

  test('un acte amb hora: el dateTime de Google amb la zona del poble, encara que l’acte en porte una altra', async () => {
    const llunya = { ...CONCERT, id: 'nova-york', start: { dateTime: '2026-10-10T19:00:00+02:00', timeZone: 'America/New_York' } };
    const [concert, altre] = await font(fetchDe(resposta({ items: [CONCERT, llunya] }))).llistaEntrades(OCTUBRE);
    expect(concert.esdeveniment).toMatchObject({ totElDia: false, inici: { dataHora: '2026-10-10T19:00:00+02:00', zona: 'Europe/Madrid' }, lloc: 'Plaça Major' });
    expect(new Date(concert.moment).getHours()).toBe(19);
    expect(altre.esdeveniment.inici.zona).toBe('Europe/Madrid');
  });

  test('els cancel·lats no hi són; la descripció passa a text pla i l’enllaç només si és https', async () => {
    const ric = { ...CONCERT, id: 'ric', description: '<p>Porta <b>cadira</b></p>', htmlLink: 'javascript:alert(1)' };
    const net = { ...CONCERT, id: 'net', htmlLink: 'https://www.google.com/calendar/event?eid=net' };
    const entrades = await font(fetchDe(resposta({ items: [ANULLAT, ric, net] }))).llistaEntrades(OCTUBRE);
    expect(entrades.map((entrada) => entrada.esdeveniment.id)).toEqual(['ric', 'net']);
    expect(entrades[0].esdeveniment.descripcio).toBe('Porta cadira');
    expect(entrades[0].esdeveniment.enllac).toBeNull();
    expect(entrades[1].esdeveniment.enllac).toBe('https://www.google.com/calendar/event?eid=net');
    expect(esdevenimentDeGoogle(ANULLAT, 'privat')).toBeNull();
  });

  test('l’uid porta la font: el mateix acte en dos calendaris no repetix la clau de les vistes', () => {
    expect(esdevenimentDeGoogle(CONCERT, 'privat').uid).toBe('gcal-privat:concert1@socdepoble.org');
    expect(esdevenimentDeGoogle(CONCERT, 'org').uid).toBe('gcal-org:concert1@socdepoble.org');
  });

  test('sense token, SENSE_AUTORITZACIO i cap petició', async () => {
    const fetchImpl = vi.fn();
    expect(await tipusDe(font(fetchImpl, { obteToken: () => null }).llistaEntrades(OCTUBRE))).toBe('SENSE_AUTORITZACIO');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  test('401 és TOKEN_CADUCAT; 403 i 404, SENSE_ACCES; la quota, un 500 o la xarxa caiguda, XARXA', async () => {
    const error = (status, reason) => resposta({ error: { code: status, errors: [{ reason }] } }, status);
    expect(await tipusDe(font(fetchDe(error(401, 'authError'))).llistaEntrades(OCTUBRE))).toBe('TOKEN_CADUCAT');
    expect(await tipusDe(font(fetchDe(error(403, 'forbidden'))).llistaEntrades(OCTUBRE))).toBe('SENSE_ACCES');
    expect(await tipusDe(font(fetchDe(error(404, 'notFound'))).llistaEntrades(OCTUBRE))).toBe('SENSE_ACCES');
    expect(await tipusDe(font(fetchDe(error(403, 'rateLimitExceeded'))).llistaEntrades(OCTUBRE))).toBe('XARXA');
    expect(await tipusDe(font(fetchDe(resposta(null, 500))).llistaEntrades(OCTUBRE))).toBe('XARXA');
    expect(await tipusDe(font(fetchDe(new TypeError('Failed to fetch'))).llistaEntrades(OCTUBRE))).toBe('XARXA');
  });

  test('una resposta sense llista, un acte que no passa pel model o massa pàgines: RESPOSTA_INVALIDA, mai mitja font', async () => {
    expect(await tipusDe(font(fetchDe(resposta({ items: 'res' }))).llistaEntrades(OCTUBRE))).toBe('RESPOSTA_INVALIDA');
    const senseInici = { id: 'trencat', summary: 'Sense inici' };
    expect(await tipusDe(font(fetchDe(resposta({ items: [FIRA, senseInici] }))).llistaEntrades(OCTUBRE))).toBe('RESPOSTA_INVALIDA');
    const infinit = vi.fn(async () => resposta({ items: [], nextPageToken: 'una-altra' }));
    expect(await tipusDe(font(infinit, { maxPagines: 3 }).llistaEntrades(OCTUBRE))).toBe('RESPOSTA_INVALIDA');
    expect(infinit).toHaveBeenCalledTimes(3);
  });

  test('un senyal avortat no és cap error de la font: arriba com a AbortError', async () => {
    const control = new AbortController();
    control.abort();
    expect(await tipusDe(font(vi.fn()).llistaEntrades({ ...OCTUBRE, signal: control.signal }))).toBe('AbortError');
    const tallat = vi.fn(async () => { throw new DOMException('tallat', 'AbortError'); });
    expect(await tipusDe(font(tallat).llistaEntrades(OCTUBRE))).toBe('AbortError');
  });

  test('un rang al revés o sense calendari és un error de programació (TypeError)', async () => {
    await expect(font(vi.fn()).llistaEntrades({ desde: OCTUBRE.fins, fins: OCTUBRE.desde })).rejects.toThrow(TypeError);
    expect(() => font(vi.fn(), { calendarId: '' })).toThrow(TypeError);
    expect(() => font('no-es-cap-funcio')).toThrow(TypeError);
  });
});

describe('autorització · l’adreça', () => {
  test('client web, flux de token, només lectura, permisos incrementals, l’estat i el compte suggerit', () => {
    const url = new URL(urlAutoritzacioGoogle({ clientId: CLIENT, redirectUri: RETORN, estat: ESTAT, loginHint: 'veina@example.org' }));
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: CLIENT, redirect_uri: RETORN, response_type: 'token', scope: AMBIT_LECTURA, state: ESTAT,
      include_granted_scopes: 'true', login_hint: 'veina@example.org'
    });
    const ambPrompt = new URL(urlAutoritzacioGoogle({ clientId: CLIENT, redirectUri: RETORN, estat: ESTAT, prompt: 'select_account' }));
    expect(ambPrompt.searchParams.get('prompt')).toBe('select_account');
    expect(ambPrompt.searchParams.has('login_hint')).toBe(false);
  });

  test('sense client vàlid, amb una tornada que no és https (fora de local), sense estat o amb un prompt inventat: SENSE_CONFIGURACIO', () => {
    const base = { clientId: CLIENT, redirectUri: RETORN, estat: ESTAT };
    for (const dolent of [{ clientId: 'client-qualsevol' }, { redirectUri: 'http://example.org/auth/calendari-google.html' }, { estat: 'curt' }, { prompt: 'sempre' }]) {
      expect(() => urlAutoritzacioGoogle({ ...base, ...dolent })).toThrow(expect.objectContaining({ tipus: 'SENSE_CONFIGURACIO' }));
    }
    expect(esClientGoogle(CLIENT)).toBe(true);
    expect(esAdrecaDeRetorn('https://example.org/auth/calendari-google.html')).toBe(true);
    expect(esAdrecaDeRetorn('https://usuari:clau@example.org/')).toBe(false);
  });

  test('l’estat és imprevisible i n’hi ha un de nou cada vegada; sense criptografia no se’n fabrica cap', () => {
    const [a, b] = [generaEstatOAuth(), generaEstatOAuth()];
    expect(a).toMatch(/^[0-9a-f]{48}$/);
    expect(a).not.toBe(b);
    expect(() => generaEstatOAuth({})).toThrow(expect.objectContaining({ tipus: 'SENSE_CONFIGURACIO' }));
  });
});

describe('autorització · la tornada', () => {
  const fragment = (params) => `#${new URLSearchParams(params)}`;
  const correcte = { access_token: TOKEN, token_type: 'Bearer', expires_in: '3599', scope: AMBIT_LECTURA, state: ESTAT };

  test('llig el token i quan caduca (amb un minut de marge)', () => {
    expect(llegixRespostaOAuth(fragment(correcte), ESTAT, { ara: 1000 })).toEqual({ token: TOKEN, caduca: 1000 + 3539 * 1000 });
    expect(llegixRespostaOAuth(fragment(correcte).slice(1), ESTAT, { ara: 0 }).token).toBe(TOKEN);
  });

  test('un state que no és el d’esta petició: SENSE_AUTORITZACIO amb motiu «estat», encara que porte un token', () => {
    expect(() => llegixRespostaOAuth(fragment({ ...correcte, state: 'un-altre-estat-qualsevol' }), ESTAT))
      .toThrow(expect.objectContaining({ tipus: 'SENSE_AUTORITZACIO', motiu: 'estat' }));
    expect(() => llegixRespostaOAuth(fragment(correcte), '')).toThrow(expect.objectContaining({ motiu: 'estat' }));
  });

  test('el permís denegat, sense token, un tipus que no és Bearer o sense l’àmbit del calendari: SENSE_AUTORITZACIO', () => {
    expect(() => llegixRespostaOAuth(fragment({ error: 'access_denied', state: ESTAT }), ESTAT))
      .toThrow(expect.objectContaining({ tipus: 'SENSE_AUTORITZACIO', message: 'No has donat permís per a llegir el calendari.' }));
    expect(() => llegixRespostaOAuth(fragment({ ...correcte, access_token: '' }), ESTAT)).toThrow(expect.objectContaining({ motiu: 'token' }));
    expect(() => llegixRespostaOAuth(fragment({ ...correcte, token_type: 'mac' }), ESTAT)).toThrow(expect.objectContaining({ motiu: 'tipus' }));
    expect(() => llegixRespostaOAuth(fragment({ ...correcte, scope: 'email profile' }), ESTAT)).toThrow(expect.objectContaining({ motiu: 'ambit' }));
  });
});

describe('autorització · l’espera de la finestra', () => {
  afterEach(() => vi.useRealTimers());

  /* Un emissor d'esdeveniments mínim: la finestra mare i el canal. */
  function creaEmissor(extra = {}) {
    const oients = new Map();
    return {
      ...extra,
      addEventListener: (tipus, oient) => {
        if (!oients.has(tipus)) oients.set(tipus, new Set());
        oients.get(tipus).add(oient);
      },
      removeEventListener: (tipus, oient) => oients.get(tipus)?.delete(oient),
      emet: (tipus, event) => [...(oients.get(tipus) ?? [])].forEach((oient) => oient(event)),
      oients: (tipus) => oients.get(tipus)?.size ?? 0
    };
  }
  const missatge = (params) => ({ type: TIPUS_MISSATGE_OAUTH, hash: `#${new URLSearchParams(params)}` });
  const correcte = { access_token: TOKEN, token_type: 'Bearer', expires_in: '3599', state: ESTAT };
  function prepara(opcions = {}) {
    const finestraMare = creaEmissor({ location: { origin: ORIGEN } });
    const canal = creaEmissor({ close: vi.fn() });
    const finestra = { closed: false };
    const promesa = esperaRespostaOAuth({ estat: ESTAT, finestra, finestraMare, crearCanal: () => canal, ...opcions });
    return { finestraMare, canal, finestra, promesa };
  }

  test('la finestra emergent del mateix origen torna el token; després no queda cap oient ni canal obert', async () => {
    const { finestraMare, canal, finestra, promesa } = prepara();
    finestraMare.emet('message', { origin: ORIGEN, source: finestra, data: missatge(correcte) });
    await expect(promesa).resolves.toMatchObject({ token: TOKEN });
    expect(finestraMare.oients('message')).toBe(0);
    expect(canal.oients('message')).toBe(0);
    expect(canal.close).toHaveBeenCalled();
  });

  test('ignora un altre origen, una altra finestra i un altre state; el canal (COOP) també servix', async () => {
    const { finestraMare, canal, finestra, promesa } = prepara();
    let acabada = false;
    promesa.then(() => { acabada = true; });
    finestraMare.emet('message', { origin: 'https://example.com', source: finestra, data: missatge(correcte) });
    finestraMare.emet('message', { origin: ORIGEN, source: {}, data: missatge(correcte) });
    canal.emet('message', { data: missatge({ ...correcte, state: 'un-altre-estat-qualsevol' }) });
    canal.emet('message', { data: { type: 'un-altre-missatge', hash: '' } });
    await Promise.resolve();
    expect(acabada).toBe(false);
    canal.emet('message', { data: missatge(correcte) });
    await expect(promesa).resolves.toMatchObject({ token: TOKEN });
    expect(CANAL_OAUTH).toBe('sdp-gcal-oauth');
  });

  test('el permís denegat amb el nostre state rebutja; el temps esgotat i la cancel·lació també', async () => {
    const denegat = prepara();
    denegat.canal.emet('message', { data: missatge({ error: 'access_denied', state: ESTAT }) });
    await expect(denegat.promesa).rejects.toMatchObject({ tipus: 'SENSE_AUTORITZACIO' });

    vi.useFakeTimers();
    const lent = prepara({ temps: 1000 });
    vi.advanceTimersByTime(1000);
    await expect(lent.promesa).rejects.toMatchObject({ tipus: 'SENSE_AUTORITZACIO', motiu: 'temps' });
    vi.useRealTimers();

    const control = new AbortController();
    const cancellada = prepara({ signal: control.signal });
    control.abort();
    await expect(cancellada.promesa).rejects.toMatchObject({ name: 'AbortError' });
    expect(cancellada.finestraMare.oients('message')).toBe(0);
  });

  test('sense BroadcastChannel (o si no es pot crear) continua esperant per la finestra', async () => {
    const finestraMare = creaEmissor({ location: { origin: ORIGEN } });
    const finestra = {};
    const promesa = esperaRespostaOAuth({ estat: ESTAT, finestra, finestraMare, crearCanal: () => { throw new Error('sense canal'); } });
    finestraMare.emet('message', { origin: ORIGEN, source: finestra, data: missatge(correcte) });
    await expect(promesa).resolves.toMatchObject({ token: TOKEN });
  });
});
