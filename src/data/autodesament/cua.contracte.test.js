/* T47 (ordre del Mestre, 260928) · Contracte de la cua d'autodesament.
 *
 * «Totes les dades s'han de desar automàticament sense pèrdues de dades.»
 * La cua es prova sola, sense React: magatzem injectat (memòria o un disc
 * lent de mentida), sessió injectada i rellotges falsos on cal.
 */
import { afterEach, expect, test, vi } from 'vitest';
import { clauDe, creaCua } from './cua.js';
import { creaMagatzem } from './magatzem.js';
import { ErrorValidacio, classificaError, columnaAbsent } from './errors.js';
import { eixDeLaSessio, oblidaSessio, preparaEixida, reprenSessio } from './sessio.js';
import { ambitDe } from './ambit.js';

const AMBIT = 'backend:["supabase","","T","remote"]|A';
const ALTRE = 'backend:["supabase","","T","remote"]|B';
const CONTEXT = Object.freeze({ tenantId: 'T' });
const ref = (extra = {}) => ({ ambit: AMBIT, entitat: 'fitxa', id: 'jo', context: CONTEXT, ...extra });

/* Deixa córrer les promeses pendents (rellotge de veres). */
const tick = () => new Promise((resolve) => { setTimeout(resolve, 0); });

/* Com valorPerDesar: de camp a columna, amb un límit de 10 caràcters. */
function prepara(camp, valor) {
  const llargaria = [...String(valor ?? '')].length;
  if (llargaria > 10) {
    throw new ErrorValidacio(`Com a màxim 10 caràcters (ara en són ${llargaria}).`, { columna: `col_${camp}`, llargaria, minim: 0, maxim: 10 });
  }
  return { columna: `col_${camp}`, valor };
}
const escriptor = (escriu, extra = {}) => ({ granularitat: 'camp', prepara, escriu, ...extra });

function crea({ actor = AMBIT, magatzem = creaMagatzem({ idb: null }) } = {}) {
  const sessio = { actor };
  const finestra = new EventTarget();
  const document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  const cua = creaCua({ magatzem, actorActual: () => sessio.actor, debounceMs: 700, finestra, document });
  return { cua, sessio, finestra, document, magatzem };
}

/* Un disc lent: la cau és síncrona, però cada escriptura espera que la prova l'allibere. */
function magatzemAmbDisc() {
  const base = creaMagatzem({ idb: null });
  const pendents = [];
  return {
    pendents,
    get persistent() { return true; },
    llig: base.llig,
    llista: base.llista,
    hidrata: base.hidrata,
    buida: base.buida,
    desa(clau, registre) {
      base.desa(clau, registre);
      return new Promise((resolve) => { pendents.push(() => resolve(true)); });
    },
    esborra(clau) {
      base.esborra(clau);
      return Promise.resolve(true);
    },
  };
}

afterEach(() => { vi.useRealTimers(); });

test('encua anota de manera síncrona i cap petició ix abans que la còpia durable haja aterrat', async () => {
  const magatzem = magatzemAmbDisc();
  const escriu = vi.fn(async () => ({}));
  const { cua } = crea({ magatzem });
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.encua(ref(), 'lead', 'Del Mas');
  expect(cua.llig(ref()).camps).toEqual({ lead: 'Del Mas' });
  expect(cua.llig(ref()).estat).toBe('pendent');
  const desat = cua.desaAra(ref(), 'lead');
  await tick();
  expect(escriu).not.toHaveBeenCalled();
  magatzem.pendents.forEach((allibera) => allibera());
  expect(await desat).toBe(true);
  expect(escriu).toHaveBeenCalledWith({ entitat: 'fitxa', id: 'jo', canvis: { col_lead: 'Del Mas' }, context: CONTEXT, base: null });
  expect(cua.llig(ref())).toMatchObject({ estat: 'net', camps: {} });
});

test('l’enviament espera la pausa (700 ms); desaAra (blur, eixida, publicar) la salta', async () => {
  vi.useFakeTimers();
  const escriu = vi.fn(async () => ({}));
  const { cua } = crea();
  cua.registraEscriptor('fitxa', escriptor(escriu));
  for (const valor of ['D', 'De', 'Del']) cua.encua(ref(), 'lead', valor);
  await vi.advanceTimersByTimeAsync(699);
  expect(escriu).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(escriu).toHaveBeenCalledTimes(1);
  expect(escriu.mock.calls[0][0].canvis).toEqual({ col_lead: 'Del' });
  cua.encua(ref(), 'subtitle', 'H2');
  await cua.desaAra(ref(), 'subtitle');
  expect(escriu).toHaveBeenCalledTimes(2);
});

test('camps diferents viatgen alhora; el mateix camp, en sèrie; i un camp només s’oblida quan es confirma EXACTAMENT eixa versió', async () => {
  const respostes = [];
  const escriu = vi.fn(() => new Promise((resolve) => { respostes.push(resolve); }));
  const { cua } = crea();
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.encua(ref(), 'subtitle', 'H2');
  void cua.desaAra(ref(), 'subtitle');
  cua.encua(ref(), 'lead', 'E1');
  void cua.desaAra(ref(), 'lead');
  await tick();
  expect(escriu).toHaveBeenCalledTimes(2);
  cua.encua(ref(), 'lead', 'E2');
  void cua.desaAra(ref(), 'lead');
  await tick();
  expect(escriu).toHaveBeenCalledTimes(2);
  respostes[1]({});
  await tick();
  expect(escriu).toHaveBeenCalledTimes(3);
  expect(escriu.mock.calls[2][0].canvis).toEqual({ col_lead: 'E2' });
  // E1 ja és al servidor, però E2 (més nova) no: es conserva.
  expect(cua.llig(ref()).camps).toEqual({ subtitle: 'H2', lead: 'E2' });
  respostes[2]({});
  respostes[0]({});
  await tick();
  expect(cua.llig(ref())).toMatchObject({ estat: 'net', camps: {} });
});

test('un error de validació conserva el text amb un error de camp persistent i la resta s’envia', async () => {
  const escriu = vi.fn(async () => ({}));
  const { cua } = crea();
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.encua(ref(), 'lead', 'massa llarg per a deu');
  // Es veu mentre s'escriu, abans de cap enviament.
  expect(cua.llig(ref()).errors.lead).toMatchObject({ tipus: 'validacio', llargaria: 21, maxim: 10 });
  cua.encua(ref(), 'subtitle', 'curt');
  expect(await cua.desaAra(ref())).toBe(false);
  expect(escriu).toHaveBeenCalledTimes(1);
  expect(escriu.mock.calls[0][0].canvis).toEqual({ col_subtitle: 'curt' });
  const { camps, errors, estat } = cua.llig(ref());
  expect(camps).toEqual({ lead: 'massa llarg per a deu' });
  expect(errors.lead.missatge).toBe('Com a màxim 10 caràcters (ara en són 21).');
  expect(estat).toBe('error');
  // Escurçat, ix i l'error desapareix.
  cua.encua(ref(), 'lead', 'curt ara');
  expect(await cua.desaAra(ref(), 'lead')).toBe(true);
  expect(cua.llig(ref())).toMatchObject({ estat: 'net', errors: {} });
});

test('un CHECK del servidor (23514) també és validació: el text es queda i no es reintenta sol', async () => {
  vi.useFakeTimers();
  const escriu = vi.fn().mockRejectedValue(new Error('Supabase 400: {"code":"23514","message":"violates check constraint"}'));
  const { cua } = crea();
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.encua(ref(), 'lead', 'Del Mas');
  expect(await cua.desaAra(ref(), 'lead')).toBe(false);
  expect(cua.llig(ref()).errors.lead).toMatchObject({ tipus: 'validacio' });
  await vi.advanceTimersByTimeAsync(120_000);
  expect(escriu).toHaveBeenCalledTimes(1);
  expect(cua.llig(ref()).camps).toEqual({ lead: 'Del Mas' });
});

test('una columna absent posa en quarantena NOMÉS eixe camp; la resta ix de seguida, i la base de revisió (CAS) avança', async () => {
  const escriu = vi.fn()
    .mockRejectedValueOnce(new Error('Supabase 400: {"code":"PGRST204","message":"Could not find the \'col_icon\' column of \'notes\' in the schema cache"}'))
    .mockResolvedValue({ revisio: 8 });
  const { cua } = crea();
  cua.registraEscriptor('nota', escriptor(escriu, { granularitat: 'entitat' }));
  const nota = ref({ entitat: 'nota', id: 'N', base: 7 });
  cua.encua(nota, 'icon', '🌾');
  cua.encua(nota, 'title', 'Tomaques');
  expect(await cua.desaAra(nota)).toBe(false);
  expect(escriu).toHaveBeenCalledTimes(2);
  expect(escriu.mock.calls[0][0]).toMatchObject({ canvis: { col_icon: '🌾', col_title: 'Tomaques' }, base: 7 });
  expect(escriu.mock.calls[1][0]).toMatchObject({ canvis: { col_title: 'Tomaques' }, base: 7 });
  const { camps, errors } = cua.llig(nota);
  expect(camps).toEqual({ icon: '🌾' });
  expect(errors.icon).toMatchObject({ tipus: 'columna', columna: 'col_icon' });
  // Teclejar no la trau de la quarantena…
  cua.encua(nota, 'icon', '🍅');
  await cua.desaAra(nota);
  expect(escriu).toHaveBeenCalledTimes(2);
  // …reprendre (una migració aplicada) sí, amb la base nova.
  cua.repren(AMBIT);
  await tick();
  expect(escriu).toHaveBeenCalledTimes(3);
  expect(escriu.mock.calls[2][0]).toMatchObject({ canvis: { col_icon: '🍅' }, base: 8 });
});

test('un error temporal es reintenta amb retrocés (1 s, 2 s…) i de seguida quan torna la xarxa', async () => {
  vi.useFakeTimers();
  const escriu = vi.fn()
    .mockRejectedValueOnce(Object.assign(new Error('Error de xarxa'), { status: 0 }))
    .mockRejectedValueOnce(Object.assign(new Error('La petició ha trigat massa temps.'), { name: 'TimeoutError' }))
    .mockRejectedValueOnce(Object.assign(new Error('Supabase 503'), { status: 503 }))
    .mockResolvedValue({});
  const { cua, finestra } = crea();
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.encua(ref(), 'lead', 'Del Mas');
  expect(await cua.desaAra(ref(), 'lead')).toBe(false);
  expect(cua.llig(ref())).toMatchObject({ estat: 'error', problema: { tipus: 'temporal', missatge: 'Error de xarxa' }, errors: {} });
  await vi.advanceTimersByTimeAsync(999);
  expect(escriu).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(escriu).toHaveBeenCalledTimes(2);
  await vi.advanceTimersByTimeAsync(1999);
  expect(escriu).toHaveBeenCalledTimes(2);
  await vi.advanceTimersByTimeAsync(1);
  expect(escriu).toHaveBeenCalledTimes(3);
  // Torna la xarxa: no s'esperen els 4 s.
  finestra.dispatchEvent(new Event('online'));
  await vi.advanceTimersByTimeAsync(0);
  expect(escriu).toHaveBeenCalledTimes(4);
  expect(cua.llig(ref())).toMatchObject({ estat: 'net', camps: {}, problema: null });
});

test('mai el text d’A amb la sessió de B: pendent sense avís, i ix quan torna A', async () => {
  const escriu = vi.fn(async () => ({}));
  const { cua, sessio } = crea();
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.encua(ref(), 'lead', 'Text d’A');
  sessio.actor = ALTRE;
  expect(await cua.desaAra(ref(), 'lead')).toBe(false);
  expect(escriu).not.toHaveBeenCalled();
  expect(cua.llig(ref())).toMatchObject({ estat: 'sessio', errors: {} });
  sessio.actor = null;
  cua.repren(AMBIT);
  await tick();
  expect(escriu).not.toHaveBeenCalled();
  sessio.actor = AMBIT;
  cua.repren(AMBIT);
  await tick();
  expect(escriu).toHaveBeenCalledTimes(1);
  expect(cua.llig(ref()).estat).toBe('net');
});

test('el que esperava la sessió (JWT caducat mentre es renova) ix quan la sessió es renova, sense cap altra tecla; mai amb la de B', async () => {
  const escriu = vi.fn(async () => ({}));
  const { cua, sessio, finestra } = crea();
  cua.registraEscriptor('fitxa', escriptor(escriu));
  // JWT caducat: el port diu «ningú» fins que la renovació aterra.
  sessio.actor = null;
  cua.encua(ref(), 'lead', 'Del Mas');
  expect(await cua.desaAra(ref(), 'lead')).toBe(false);
  expect(escriu).not.toHaveBeenCalled();
  // Un canvi de sessió cap a una altra persona no l'envia.
  sessio.actor = ALTRE;
  finestra.dispatchEvent(new Event('sdp:auth-change'));
  await tick();
  expect(escriu).not.toHaveBeenCalled();
  // La renovació d'A: ix sola.
  sessio.actor = AMBIT;
  finestra.dispatchEvent(new Event('sdp:auth-change'));
  await tick();
  expect(escriu).toHaveBeenCalledTimes(1);
  expect(cua.llig(ref())).toMatchObject({ estat: 'net', camps: {} });
});

test('una renovació no buida abans de la pausa el que no esperava sessió', async () => {
  vi.useFakeTimers();
  const escriu = vi.fn(async () => ({}));
  const { cua, finestra } = crea();
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.encua(ref(), 'lead', 'Del');
  finestra.dispatchEvent(new Event('sdp:auth-change'));
  await vi.advanceTimersByTimeAsync(0);
  expect(escriu).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(700);
  expect(escriu).toHaveBeenCalledTimes(1);
});

test('la sessió es torna a mirar just abans d’enviar: un canvi mentre s’escriu a disc no deixa eixir res', async () => {
  const magatzem = magatzemAmbDisc();
  const escriu = vi.fn(async () => ({}));
  const { cua, sessio } = crea({ magatzem });
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.encua(ref(), 'lead', 'Text d’A');
  const desat = cua.desaAra(ref(), 'lead');
  sessio.actor = ALTRE;
  magatzem.pendents.forEach((allibera) => allibera());
  expect(await desat).toBe(false);
  expect(escriu).not.toHaveBeenCalled();
});

test('un AbortError de l’escriptor (sessió canviada en vol) deixa el camp pendent, sense error de camp', async () => {
  const escriu = vi.fn().mockRejectedValue(new DOMException('La sessió ha canviat.', 'AbortError'));
  const { cua } = crea();
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.encua(ref(), 'lead', 'Del Mas');
  expect(await cua.desaAra(ref(), 'lead')).toBe(false);
  expect(cua.llig(ref())).toMatchObject({ estat: 'sessio', errors: {}, camps: { lead: 'Del Mas' } });
});

test('repren envia el que havia quedat al magatzem d’una sessió anterior, només amb configuració viva', async () => {
  const magatzem = creaMagatzem({ idb: null });
  magatzem.desa(clauDe(ref()), {
    v: 1, ambit: AMBIT, entitat: 'fitxa', id: 'jo', base: null, seq: 3,
    camps: { lead: { valor: 'D’abans', versio: 3, error: null } }, actualitzat: 1,
  });
  const escriu = vi.fn(async () => ({}));
  const { cua } = crea({ magatzem });
  cua.registraEscriptor('fitxa', escriptor(escriu));
  await tick();
  expect(escriu).not.toHaveBeenCalled();
  expect(cua.llig(ref())).toMatchObject({ estat: 'sessio', camps: { lead: 'D’abans' } });
  cua.recordaContext(AMBIT, CONTEXT);
  cua.repren(AMBIT);
  await tick();
  expect(escriu).toHaveBeenCalledWith(expect.objectContaining({ canvis: { col_lead: 'D’abans' }, context: CONTEXT }));
  expect(cua.llig(ref()).camps).toEqual({});
});

test('oblida (eixir) esborra els esborranys d’eixe àmbit i no els envia; els d’un altre àmbit es queden', async () => {
  vi.useFakeTimers();
  const escriu = vi.fn(async () => ({}));
  const { cua } = crea();
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.encua(ref(), 'lead', 'Privat');
  cua.encua(ref({ ambit: ALTRE }), 'lead', 'D’altri');
  cua.oblida(AMBIT);
  expect(cua.llig(ref()).camps).toEqual({});
  expect(cua.llig(ref({ ambit: ALTRE })).camps).toEqual({ lead: 'D’altri' });
  await vi.advanceTimersByTimeAsync(5000);
  expect(escriu).not.toHaveBeenCalled();
});

test('estat pendent → enviant → net; els oients ho saben, la instantània és estable i la confirmació porta les columnes', async () => {
  const respostes = [];
  const escriu = vi.fn(() => new Promise((resolve) => { respostes.push(resolve); }));
  const { cua } = crea();
  cua.registraEscriptor('fitxa', escriptor(escriu));
  const estats = [];
  const confirmats = [];
  const deixa = cua.subscriu(() => { estats.push(cua.llig(ref()).estat); });
  cua.quanConfirma((confirmat) => { confirmats.push(confirmat); });
  cua.encua(ref(), 'lead', 'x');
  expect(cua.llig(ref()).estat).toBe('pendent');
  expect(cua.llig(ref())).toBe(cua.llig(ref()));
  const desat = cua.desaAra(ref(), 'lead');
  await tick();
  expect(cua.llig(ref()).estat).toBe('enviant');
  respostes[0]({ fila: { lema: 'x' } });
  expect(await desat).toBe(true);
  expect(cua.llig(ref()).estat).toBe('net');
  expect(estats).toEqual(expect.arrayContaining(['pendent', 'enviant', 'net']));
  expect(confirmats).toEqual([expect.objectContaining({ ambit: AMBIT, entitat: 'fitxa', id: 'jo', canvis: { col_lead: 'x' }, fila: { lema: 'x' } })]);
  deixa();
});

test('descarta renuncia a un camp; reintenta torna a provar un rebuig de permís', async () => {
  const escriu = vi.fn()
    .mockRejectedValueOnce(Object.assign(new Error('Supabase 403: {"code":"42501"}'), { status: 403 }))
    .mockResolvedValue({});
  const { cua } = crea();
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.encua(ref(), 'lead', 'x');
  expect(await cua.desaAra(ref(), 'lead')).toBe(false);
  expect(cua.llig(ref()).errors.lead).toMatchObject({ tipus: 'servidor' });
  expect(await cua.reintenta(ref(), 'lead')).toBe(true);
  cua.encua(ref(), 'subtitle', 'y');
  cua.descarta(ref(), 'subtitle');
  expect(cua.llig(ref())).toMatchObject({ estat: 'net', camps: {} });
  expect(escriu).toHaveBeenCalledTimes(2);
});

test('un 409 (revisió més nova al servidor) deixa el camp en conflicte fins que la persona decidix; rebasa el torna a enviar amb la base nova', async () => {
  const escriu = vi.fn()
    .mockRejectedValueOnce(Object.assign(new Error('Conflicte'), { status: 409 }))
    .mockResolvedValue({ revisio: 10 });
  const { cua } = crea();
  cua.registraEscriptor('nota', escriptor(escriu, { granularitat: 'entitat' }));
  const nota = ref({ entitat: 'nota', id: 'N', base: 7 });
  cua.encua(nota, 'title', 'Meu');
  expect(await cua.desaAra(nota)).toBe(false);
  expect(cua.llig(nota).errors.title).toMatchObject({ tipus: 'conflicte' });
  // Teclejar no el força damunt de la versió remota.
  cua.encua(nota, 'title', 'Meu, ara');
  await cua.desaAra(nota);
  expect(escriu).toHaveBeenCalledTimes(1);
  expect(await cua.rebasa(nota, 9)).toBe(true);
  expect(escriu).toHaveBeenLastCalledWith(expect.objectContaining({ canvis: { col_title: 'Meu, ara' }, base: 9 }));
});

test('sense IndexedDB el magatzem es queda en memòria i ho declara (persistent: false)', async () => {
  const magatzem = creaMagatzem({ idb: null });
  expect(magatzem.persistent).toBe(false);
  expect(await magatzem.desa('k', { a: 1 })).toBe(false);
  expect(magatzem.llig('k')).toEqual({ a: 1 });
  await magatzem.hidrata();
  expect(magatzem.llista()).toEqual([{ a: 1 }]);
  expect(await magatzem.esborra('k')).toBe(false);
  expect(magatzem.llig('k')).toBeUndefined();
});

test('classificació: validació, columna, sessió, conflicte, permís i temporal', () => {
  expect(classificaError(new ErrorValidacio('x', { maxim: 1, llargaria: 2 }))).toMatchObject({ tipus: 'validacio', maxim: 1, llargaria: 2 });
  expect(classificaError(new Error('Supabase 400: {"code":"22001"}')).tipus).toBe('validacio');
  expect(classificaError(new Error('Supabase 400: {"code":"42703","message":"column organizations.copyright does not exist"}')))
    .toMatchObject({ tipus: 'columna', columna: 'copyright' });
  expect(columnaAbsent('Could not find the \'lema\' column of \'profiles\' in the schema cache')).toBe('lema');
  expect(classificaError(new DOMException('x', 'AbortError')).tipus).toBe('sessio');
  expect(classificaError(Object.assign(new Error('Supabase 401'), { status: 401 })).tipus).toBe('sessio');
  expect(classificaError(new Error('La sessió ha caducat. Torna a entrar.')).tipus).toBe('sessio');
  expect(classificaError(Object.assign(new Error('Conflicte'), { status: 409 })).tipus).toBe('conflicte');
  expect(classificaError(new Error('Supabase 403: {"code":"42501"}')).tipus).toBe('servidor');
  expect(classificaError(Object.assign(new Error('Error de xarxa'), { status: 0 })).tipus).toBe('temporal');
  /* T47 (correcció de la revisió, 260928) · Només és temporal el que pot anar
     bé sol si s'espera: xarxa, temps esgotat, 408, 429 i 5xx. */
  expect(classificaError(Object.assign(new Error('x'), { name: 'TimeoutError' })).tipus).toBe('temporal');
  expect(classificaError(new TypeError('Failed to fetch')).tipus).toBe('temporal');
  for (const status of [408, 429, 500, 502, 503]) {
    expect(classificaError(Object.assign(new Error(`Supabase ${status}`), { status })).tipus).toBe('temporal');
  }
  // Un 4xx determinista o una fallada que no reconeixem: error de camp, no un reintent etern.
  expect(classificaError(Object.assign(new Error('Supabase 422: invalid input'), { status: 422 })).tipus).toBe('servidor');
  expect(classificaError(Object.assign(new Error('Supabase 404'), { status: 404 })).tipus).toBe('servidor');
  expect(classificaError(new Error('El perfil no s’ha confirmat al servidor.')))
    .toEqual({ tipus: 'servidor', missatge: 'El perfil no s’ha confirmat al servidor.' });
  expect(classificaError(new TypeError('Cannot read properties of undefined')).tipus).toBe('servidor');
  expect(classificaError(new Error('desconegut')).tipus).toBe('servidor');
});

test('T47 · un 4xx determinista o una fallada sense status de l’adaptador no es reintenta per sempre: error de camp, «Tornar a provar» o «Tornar al que hi ha desat»', async () => {
  vi.useFakeTimers();
  const escriu = vi.fn()
    .mockRejectedValueOnce(Object.assign(new Error('Supabase 422: {"message":"invalid input"}'), { status: 422 }))
    .mockRejectedValueOnce(new Error('El perfil no s’ha confirmat al servidor.'))
    .mockResolvedValue({});
  const { cua } = crea();
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.encua(ref(), 'lead', 'Del Mas');
  cua.encua(ref(), 'subtitle', 'H2');
  expect(await cua.desaAra(ref())).toBe(false);
  expect(escriu).toHaveBeenCalledTimes(2);
  const { camps, errors, estat, problema } = cua.llig(ref());
  expect(camps).toEqual({ lead: 'Del Mas', subtitle: 'H2' });
  expect(errors.lead).toMatchObject({ tipus: 'servidor' });
  expect(errors.subtitle).toMatchObject({ tipus: 'servidor', missatge: 'El perfil no s’ha confirmat al servidor.' });
  expect(estat).toBe('error');
  expect(problema).toBeNull();
  // Abans, un reintent cada 1, 2, 4… 60 s sense fi i sense eixida.
  await vi.advanceTimersByTimeAsync(120_000);
  expect(escriu).toHaveBeenCalledTimes(2);
  expect(cua.llig(ref()).camps).toEqual({ lead: 'Del Mas', subtitle: 'H2' });
  // Les dues eixides.
  expect(await cua.reintenta(ref(), 'lead')).toBe(true);
  cua.descarta(ref(), 'subtitle');
  expect(cua.llig(ref())).toMatchObject({ estat: 'net', camps: {}, errors: {} });
  expect(escriu).toHaveBeenCalledTimes(3);
});

test('sessió: en entrar es repren l’àmbit d’esta persona; en eixir s’oblida', async () => {
  const cua = { recordaContext: vi.fn(), repren: vi.fn(), hidrata: vi.fn(async () => {}), oblida: vi.fn() };
  reprenSessio(CONTEXT, 'A', cua);
  await tick();
  const ambit = cua.recordaContext.mock.calls[0][0];
  expect(ambit.endsWith('|A')).toBe(true);
  expect(cua.recordaContext).toHaveBeenCalledWith(ambit, CONTEXT);
  expect(cua.repren).toHaveBeenCalledWith(ambit);
  oblidaSessio(CONTEXT, 'A', cua);
  expect(cua.oblida).toHaveBeenCalledWith(ambit);
  reprenSessio(CONTEXT, null, cua);
  oblidaSessio(CONTEXT, null, cua);
  expect(cua.repren).toHaveBeenCalledTimes(1);
  expect(cua.oblida).toHaveBeenCalledTimes(1);
  // Sense persona no hi ha àmbit: cap esborrany va a un àmbit que cap sessió no tindrà.
  expect(ambitDe(CONTEXT, null)).toBeNull();
  expect(ambitDe(CONTEXT, '')).toBeNull();
  expect(ambitDe(CONTEXT, 'A')).toBe(ambit);
});

/* ── T47 (correcció de la revisió, 260928) · eixir, oblidar i hidratar ── */

/* Un IndexedDB mínim: una lectura (readonly) veu el disc tal com era en
   començar i es pot frenar (una lectura lenta); les escriptures aterren en
   ordre, sense esperar-la. */
function idbFals() {
  const disc = new Map();
  let fre = null;
  const recorre = (peticio, entrades) => {
    let i = 0;
    const seguent = () => {
      if (i >= entrades.length) { peticio.result = null; peticio.onsuccess?.(); return; }
      const [key, value] = entrades[i];
      i += 1;
      peticio.result = { key, value: structuredClone(value), continue: seguent, delete: () => { disc.delete(key); } };
      peticio.onsuccess?.();
    };
    seguent();
  };
  const db = {
    objectStoreNames: { contains: () => true },
    createObjectStore() {},
    close() {},
    transaction(_nom, mode) {
      const operacions = [];
      const foto = mode === 'readonly' ? [...disc] : null;
      const espera = mode === 'readonly' ? fre : null;
      const tx = {
        objectStore: () => ({
          /* C03 · llig-fusiona-escriu dins de la mateixa transacció: el que
             s'encua des de l'onsuccess s'executa en la mateixa volta. */
          get: (clau) => {
            const peticio = { result: undefined, onsuccess: null };
            operacions.push(() => {
              peticio.result = disc.has(clau) ? structuredClone(disc.get(clau)) : undefined;
              peticio.onsuccess?.();
            });
            return peticio;
          },
          put: (valor, clau) => { operacions.push(() => { disc.set(clau, structuredClone(valor)); }); },
          delete: (clau) => { operacions.push(() => { disc.delete(clau); }); },
          clear: () => { operacions.push(() => { disc.clear(); }); },
          openCursor: () => {
            const peticio = { result: null, onsuccess: null };
            operacions.push(() => { recorre(peticio, foto || [...disc]); });
            return peticio;
          },
        }),
      };
      Promise.resolve(espera).then(() => {
        for (const operacio of operacions) operacio();
        tx.oncomplete?.();
      });
      return tx;
    },
  };
  return {
    disc,
    frena() {
      let obri;
      fre = new Promise((resolve) => { obri = resolve; });
      return () => { fre = null; obri(); };
    },
    open() {
      const peticio = {};
      Promise.resolve().then(() => { peticio.result = db; peticio.onsuccess?.(); });
      return peticio;
    },
  };
}

const registreDisc = (extra = {}) => ({
  v: 1, ambit: AMBIT, entitat: 'fitxa', id: 'jo', base: null, seq: 3,
  camps: { lead: { valor: 'Entradilla d’ahir', versio: 3, error: null } }, actualitzat: 1, ...extra,
});

test('T47 · una tecla mentre es llig IndexedDB no descarta els altres camps d’esborrany del mateix registre (lectura lenta)', async () => {
  const idb = idbFals();
  const clau = clauDe(ref());
  idb.disc.set(clau, registreDisc());
  const allibera = idb.frena();
  const { cua } = crea({ magatzem: creaMagatzem({ idb }) });
  const hidratat = cua.hidrata();
  await tick();                                   // la lectura ja ha començat: veu el disc d'abans
  cua.encua(ref(), 'subtitle', 'H2 nou');
  await tick();                                   // el put del registre parcial ha aterrat
  allibera();
  await hidratat;
  // Abans: la clau tocada es protegia sencera i l'entradilla d'ahir es perdia (també del disc).
  expect(cua.llig(ref()).camps).toEqual({ subtitle: 'H2 nou', lead: 'Entradilla d’ahir' });
  await tick();
  expect(Object.keys(idb.disc.get(clau).camps).sort()).toEqual(['lead', 'subtitle']);
  // La tecla següent és més nova que la versió recuperada: es desa, no es confon.
  cua.encua(ref(), 'lead', 'Entradilla de hui');
  expect(cua.llig(ref()).camps.lead).toBe('Entradilla de hui');
  expect(idb.disc.get(clau).seq).toBeGreaterThanOrEqual(3);
});

test('T47 · el camp que esta pestanya ja ha confirmat durant la lectura no ressuscita amb la versió vella del disc', async () => {
  const idb = idbFals();
  const clau = clauDe(ref());
  idb.disc.set(clau, registreDisc({ camps: { lead: { valor: 'Vell', versio: 3, error: null } } }));
  const allibera = idb.frena();
  const escriu = vi.fn(async () => ({}));
  const { cua } = crea({ magatzem: creaMagatzem({ idb }) });
  cua.registraEscriptor('fitxa', escriptor(escriu));
  const hidratat = cua.hidrata();
  await tick();
  cua.encua(ref(), 'lead', 'Nou');
  expect(await cua.desaAra(ref(), 'lead')).toBe(true);
  allibera();
  await hidratat;
  expect(cua.llig(ref()).camps).toEqual({});
  await tick();
  expect(idb.disc.has(clau)).toBe(false);
});

test('T47 · oblida esborra del disc per àmbit, també el que esta pestanya no ha llegit mai; els d’un altre àmbit es queden', async () => {
  const idb = idbFals();
  const altri = clauDe(ref({ ambit: ALTRE }));
  idb.disc.set(clauDe(ref()), registreDisc());
  idb.disc.set(clauDe(ref({ entitat: 'organitzacio', id: 'O' })), registreDisc({ entitat: 'organitzacio', id: 'O' }));
  idb.disc.set(altri, registreDisc({ ambit: ALTRE }));
  const { cua } = crea({ magatzem: creaMagatzem({ idb }) });
  // Sense hidratar: la cau d'esta pestanya és buida (abans, no s'esborrava res).
  expect(await cua.oblida(AMBIT)).toBe(true);
  expect([...idb.disc.keys()]).toEqual([altri]);
});

test('T47 · oblidar mentre es llig IndexedDB: la lectura (més vella) no torna l’àmbit oblidat', async () => {
  const idb = idbFals();
  idb.disc.set(clauDe(ref()), registreDisc());
  idb.disc.set(clauDe(ref({ ambit: ALTRE })), registreDisc({ ambit: ALTRE }));
  const allibera = idb.frena();
  const { cua } = crea({ magatzem: creaMagatzem({ idb }) });
  const hidratat = cua.hidrata();
  await tick();
  const oblidat = cua.oblida(AMBIT);
  allibera();
  await hidratat;
  expect(await oblidat).toBe(true);
  expect(cua.llig(ref()).camps).toEqual({});
  expect(cua.llig(ref({ ambit: ALTRE })).camps).toEqual({ lead: 'Entradilla d’ahir' });
  expect([...idb.disc.keys()]).toEqual([clauDe(ref({ ambit: ALTRE }))]);
});

/* L'àmbit d'A per a CONTEXT, tal com el calcula la sessió. */
const AMBIT_A = ambitDe(CONTEXT, 'A');
const refA = (extra = {}) => ref({ ambit: AMBIT_A, ...extra });

test('T47 · eixir: primer s’envia el pendent amb la sessió encara vàlida, després es tanca i s’oblida la resta', async () => {
  const ordre = [];
  const escriu = vi.fn(async ({ canvis }) => { ordre.push(`envia ${Object.keys(canvis)}`); return {}; });
  const { cua, sessio } = crea({ actor: AMBIT_A });
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.encua(refA(), 'subtitle', 'No enviat');                     // dins de la pausa: encara no ha eixit
  cua.encua(refA(), 'lead', 'massa llarg per a deu');           // el servidor no el pot tindre
  cua.encua(ref({ ambit: ALTRE }), 'lead', 'D’altri');
  const tanca = vi.fn(async () => { ordre.push('tanca'); sessio.actor = null; return 'fora'; });
  expect(await eixDeLaSessio({ config: CONTEXT, usuariId: 'A', tanca, cua })).toBe('fora');
  expect(ordre).toEqual(['envia col_subtitle', 'tanca']);
  // L'esborrany que no s'ha pogut enviar s'oblida d'este dispositiu (ordinador compartit)…
  expect(cua.llig(refA()).camps).toEqual({});
  // …i el d'una altra persona no es toca.
  expect(cua.llig(ref({ ambit: ALTRE })).camps).toEqual({ lead: 'D’altri' });
});

test('T47 · eixir no queda penjat d’una xarxa morta: com a màxim 3 s, i es tanca igual', async () => {
  vi.useFakeTimers();
  const escriu = vi.fn(() => new Promise(() => {}));
  const { cua } = crea({ actor: AMBIT_A });
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.encua(refA(), 'lead', 'Del Mas');
  const tanca = vi.fn(async () => {});
  const eixida = eixDeLaSessio({ config: CONTEXT, usuariId: 'A', tanca, cua });
  await vi.advanceTimersByTimeAsync(2999);
  expect(escriu).toHaveBeenCalledTimes(1);
  expect(tanca).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  await eixida;
  expect(tanca).toHaveBeenCalledTimes(1);
  expect(cua.llig(refA()).camps).toEqual({});
});

test('T47 · si tancar la sessió falla, la persona continua dins i el seu text també', async () => {
  const { cua } = crea({ actor: AMBIT_A });
  cua.encua(refA(), 'lead', 'Del Mas');                          // sense escriptor: no pot eixir
  const tanca = vi.fn(async () => { throw new Error('Sense xarxa'); });
  await expect(eixDeLaSessio({ config: CONTEXT, usuariId: 'A', tanca, cua, limitMs: 10 })).rejects.toThrow('Sense xarxa');
  expect(cua.llig(refA()).camps).toEqual({ lead: 'Del Mas' });
});

test('T47 · després d’oblidar, el que encara arribe d’eixe àmbit (un editor que es desmunta) no torna al disc fins a una entrada nova', async () => {
  const { cua } = crea();
  cua.encua(ref(), 'lead', 'Privat');
  await cua.oblida(AMBIT);
  cua.encua(ref(), 'lead', 'Tard');
  expect(cua.llig(ref()).camps).toEqual({});
  cua.recordaContext(AMBIT, CONTEXT);                            // tornar a entrar
  cua.encua(ref(), 'lead', 'Entrada nova');
  expect(cua.llig(ref()).camps).toEqual({ lead: 'Entrada nova' });
});

/* ── T47 (correcció de la revisió C01–C04, 260928) ── */

test('T47 · C01 · preparaEixida fa l’intent final i diu el que el servidor encara no té, sense tancar ni oblidar res', async () => {
  const escriu = vi.fn(async () => ({}));
  const { cua } = crea({ actor: AMBIT_A });
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.encua(refA(), 'subtitle', 'Ix');                            // dins de la pausa: ix en l'intent final
  cua.encua(refA(), 'lead', 'massa llarg per a deu');           // validació: el servidor no el pot tindre
  cua.encua(ref({ ambit: ALTRE }), 'lead', 'D’altri');
  const enviaNotes = vi.fn(async () => true);
  const pendentsNotes = vi.fn(async () => [{ entitat: 'nota', id: 'n', camps: ['title'] }]);
  const pendents = await preparaEixida({
    config: CONTEXT, usuariId: 'A', cua, abansDeTancar: [enviaNotes], pendentsDe: [pendentsNotes],
  });
  expect(escriu).toHaveBeenCalledTimes(1);
  expect(escriu.mock.calls[0][0].canvis).toEqual({ col_subtitle: 'Ix' });
  expect(enviaNotes).toHaveBeenCalledWith('A', { espera: 3000 });
  expect(pendents).toEqual([
    { entitat: 'fitxa', id: 'jo', camps: ['lead'] },
    { entitat: 'nota', id: 'n', camps: ['title'] },
  ]);
  // Res no s'ha esborrat: ho decidix la persona, després de llegir l'avís.
  expect(cua.llig(refA()).camps).toEqual({ lead: 'massa llarg per a deu' });
  expect(cua.llig(ref({ ambit: ALTRE })).camps).toEqual({ lead: 'D’altri' });
});

test('T47 · C02 · eixir envia amb els gestors injectats (Notes) abans de tancar i els oblida després, només si tancar va bé; un gestor que falla no talla l’eixida', async () => {
  const avisos = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const ordre = [];
    const { cua } = crea({ actor: AMBIT_A });
    const envia = vi.fn(async () => { ordre.push('envia notes'); return true; });
    const oblida = vi.fn(async () => { ordre.push('oblida notes'); return []; });
    const tanca = vi.fn(async () => { ordre.push('tanca'); return 'fora'; });
    const eix = (extra) => eixDeLaSessio({ config: CONTEXT, usuariId: 'A', cua, tanca, abansDeTancar: [envia], despresDeTancar: [oblida], ...extra });
    expect(await eix()).toBe('fora');
    expect(ordre).toEqual(['envia notes', 'tanca', 'oblida notes']);
    expect(envia).toHaveBeenCalledWith('A', { espera: 3000 });
    expect(oblida).toHaveBeenCalledWith('A');
    // Si tancar falla, la persona continua dins i les seues notes també.
    await expect(eix({ tanca: async () => { throw new Error('Sense xarxa'); } })).rejects.toThrow('Sense xarxa');
    expect(oblida).toHaveBeenCalledTimes(1);
    // Un gestor que llança o rebutja no impedix eixir.
    const trenca = () => { throw new Error('trencat'); };
    const rebutja = async () => { throw new Error('rebutjat'); };
    expect(await eix({ abansDeTancar: [trenca, rebutja], despresDeTancar: [trenca, rebutja] })).toBe('fora');
    expect(tanca).toHaveBeenCalledTimes(2);
  } finally {
    avisos.mockRestore();
  }
});

test('T47 · C03 · dues pestanyes al mateix registre: una escriptura o un esborrat d’una no trepitja al disc els camps de l’altra', async () => {
  const idb = idbFals();
  const clau = clauDe(ref());
  const entrada = (valor, versio) => ({ valor, versio, error: null });
  const registre = (camps, seq) => ({ v: 1, ambit: AMBIT, entitat: 'fitxa', id: 'jo', base: null, seq, camps, actualitzat: 1 });
  const a = creaMagatzem({ idb });
  const b = creaMagatzem({ idb });
  await a.hidrata();
  await b.hidrata();                                              // B s'obri abans que A escriga l'entradilla
  expect(await a.desa(clau, registre({ lead: entrada('Entradilla d’A', 1) }, 1))).toBe(true);
  expect(await b.desa(clau, registre({ subtitle: entrada('H2 de B', 1) }, 1))).toBe(true);
  // Abans, el put de B (sense l'entradilla a la seua cau) la trepitjava.
  expect(Object.keys(idb.disc.get(clau).camps).sort()).toEqual(['lead', 'subtitle']);
  // El servidor confirma l'H2 de B i B l'oblida: l'entradilla d'A es queda.
  expect(await b.esborra(clau)).toBe(true);
  expect(idb.disc.get(clau).camps).toEqual({ lead: entrada('Entradilla d’A', 1) });
  // Una pestanya que la llig i la confirma no esborra una versió més nova d'una altra.
  const c = creaMagatzem({ idb });
  await c.hidrata();
  expect(c.llig(clau).camps.lead.valor).toBe('Entradilla d’A');
  expect(await a.desa(clau, registre({ lead: entrada('Entradilla d’A, ara', 2) }, 2))).toBe(true);
  expect(await c.esborra(clau)).toBe(true);
  expect(idb.disc.get(clau).camps.lead.valor).toBe('Entradilla d’A, ara');
  // Sense cap camp, la clau se'n va del disc.
  expect(await a.esborra(clau)).toBe(true);
  expect(idb.disc.has(clau)).toBe(false);
});

test('T47 · C04 · un esborrany del disc amb base no es torna a enviar sol en entrar: espera verifica, que el compara amb el servidor', async () => {
  const magatzem = creaMagatzem({ idb: null });
  magatzem.desa(clauDe(ref()), {
    v: 1, ambit: AMBIT, entitat: 'fitxa', id: 'jo', base: null, seq: 3, actualitzat: 1,
    camps: {
      lead: { valor: 'Vell', versio: 1, error: { tipus: 'servidor', missatge: 'x' }, baseValor: 'Orig' },
      subtitle: { valor: 'H2 meu', versio: 2, error: null, baseValor: 'H2' },
      title: { valor: 'Pep', versio: 3, error: null, baseValor: 'Pere' },
    },
  });
  const escriu = vi.fn(async () => ({}));
  const { cua, finestra } = crea({ magatzem });
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.recordaContext(AMBIT, CONTEXT);
  // L'entrada de sessió, el retorn de la xarxa i el canvi de visibilitat no l'envien.
  cua.repren(AMBIT);
  finestra.dispatchEvent(new Event('online'));
  await tick();
  expect(escriu).not.toHaveBeenCalled();
  expect(cua.pendentsDe(AMBIT)).toEqual([{ entitat: 'fitxa', id: 'jo', camps: ['lead', 'subtitle', 'title'] }]);
  // En obrir la fitxa: el nom ja és el del servidor (s'oblida), l'H2 no l'ha
  // tocat ningú (ix) i l'entradilla l'ha canviada un altre dispositiu (conflicte).
  expect(await cua.verifica(ref(), { lead: 'Nou', subtitle: 'H2', title: 'Pep' })).toBe(true);
  expect(escriu).toHaveBeenCalledTimes(1);
  expect(escriu.mock.calls[0][0].canvis).toEqual({ col_subtitle: 'H2 meu' });
  expect(cua.llig(ref()).camps).toEqual({ lead: 'Vell' });
  expect(cua.llig(ref()).errors.lead).toMatchObject({ tipus: 'conflicte' });
  // Ni teclejar ni reprendre el força damunt del «Nou» de l'altre dispositiu.
  cua.encua(ref(), 'lead', 'Vell 2');
  await cua.desaAra(ref(), 'lead');
  cua.repren(AMBIT);
  await tick();
  expect(escriu).toHaveBeenCalledTimes(1);
  // «Conservar el meu»: la base passa a ser el valor del servidor i ix ja.
  expect(await cua.conserva(ref(), 'lead', 'Nou')).toBe(true);
  expect(escriu).toHaveBeenLastCalledWith(expect.objectContaining({ canvis: { col_lead: 'Vell 2' } }));
  expect(cua.llig(ref())).toMatchObject({ estat: 'net', camps: {} });
});

test('T47 · C04 · el que s’escriu en esta pàgina amb base ix sol, com sempre; la base és la del primer canvi i verifica no el toca', async () => {
  vi.useFakeTimers();
  const escriu = vi.fn(async () => ({}));
  const { cua } = crea();
  cua.registraEscriptor('fitxa', escriptor(escriu));
  cua.encua(ref(), 'lead', 'Nou', { baseValor: 'Abans' });
  cua.encua(ref(), 'lead', 'Nou 2', { baseValor: 'Ignorada' });
  expect(await cua.verifica(ref(), { lead: 'Un altre' })).toBe(true);
  expect(cua.llig(ref()).errors).toEqual({});
  await vi.advanceTimersByTimeAsync(700);
  expect(escriu).toHaveBeenCalledTimes(1);
  expect(escriu.mock.calls[0][0].canvis).toEqual({ col_lead: 'Nou 2' });
  expect(cua.llig(ref())).toMatchObject({ estat: 'net', camps: {} });
});

test('T47 · C04 · la base d’un camp arriba al disc: una altra càrrega de pàgina l’ha de verificar', async () => {
  const idb = idbFals();
  const { cua } = crea({ magatzem: creaMagatzem({ idb }) });
  cua.encua(ref(), 'lead', 'Meu', { baseValor: 'Del servidor' });
  await tick();
  expect(idb.disc.get(clauDe(ref())).camps.lead).toMatchObject({ valor: 'Meu', baseValor: 'Del servidor' });
  const escriu = vi.fn(async () => ({}));
  const nova = crea({ magatzem: creaMagatzem({ idb }) }).cua;
  nova.registraEscriptor('fitxa', escriptor(escriu));
  await nova.hidrata();
  nova.recordaContext(AMBIT, CONTEXT);
  nova.repren(AMBIT);
  await tick();
  expect(escriu).not.toHaveBeenCalled();
  expect(await nova.verifica(ref(), { lead: 'Del servidor' })).toBe(true);
  expect(escriu).toHaveBeenCalledWith(expect.objectContaining({ canvis: { col_lead: 'Meu' } }));
});
