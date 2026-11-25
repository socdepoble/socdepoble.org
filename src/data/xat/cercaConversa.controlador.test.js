// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { creaControladorCercaConversa, creaIndexCercaConversa, fusionaResultatsCerca, navegaResultatsCerca } from './cercaConversa.js';

const F = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ALTRE = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const id = n => `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
const fila = (n, extra = {}) => ({ id: id(n), filId: F, seq: n, text: 'café', creatAl: `2026-11-25T03:00:${String(n).padStart(2, '0')}.123456Z`, ...extra });
const pagina = (missatges, limit = 50) => ({ missatges, seguent: missatges.length === limit ? { creatAl: missatges.at(-1).creatAl, seq: missatges.at(-1).seq } : null });
const diferit = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const captura = promise => promise.then(value => ({ value }), error => ({ error }));
const buidaPila = async () => { for (let i = 0; i < 15; i++) await Promise.resolve(); };
function instancia(opcions = {}) {
  const vida = new AbortController();
  let vigent = true;
  const cercaPagina = vi.fn(async () => pagina([]));
  const carregaPerId = vi.fn(async (_fil, target) => fila(Number.parseInt(target.slice(-12), 16)));
  const controlador = creaControladorCercaConversa({ filId: F, generacioSessio: 1, comprovaAmbit: () => vigent, signal: vida.signal, cercaPagina, carregaPerId, ...opcions });
  return { controlador, vida, cercaPagina, carregaPerId, fixaVigent: valor => { vigent = valor; } };
}

describe('controlador de cerca C11 · contracte i vida', () => {
  it('01 · preserva motors anteriors i no executa transport en construir/llegir/provider', () => {
    const f = instancia(), a = f.controlador.llegixEstat();
    expect(f.controlador.llegixEstat()).toBe(a);
    expect(a.cercadorG1([], 'café')).toEqual([]);
    const fora = f.controlador.subscriu(vi.fn()); fora();
    expect(f.cercaPagina).not.toHaveBeenCalled(); expect(f.carregaPerId).not.toHaveBeenCalled();
    expect(creaIndexCercaConversa([fila(1)], { filId: F }).cerca('CAFE')).toHaveLength(1);
    expect(fusionaResultatsCerca([fila(1)], [fila(1)], { filId: F })).toHaveLength(1);
    expect(navegaResultatsCerca([fila(1)]).actual).toBe(1);
  });
  it('02 · buida consulta sense RPC i no reutilitza Promise antiga després de netejar', async () => {
    const espera = diferit(), f = instancia({ cercaPagina: vi.fn(() => espera.promise) });
    await f.controlador.canviaConsulta('   ');
    const antiga = captura(f.controlador.canviaConsulta('café')); await buidaPila();
    const neta = await f.controlador.canviaConsulta('');
    expect(neta.fase).toBe('inactiva'); expect(neta.ids).toEqual([]);
    expect((await antiga).error.codi).toBe('CERCA_DESCARTADA');
    expect((await f.controlador.carregaMes()).fase).toBe('inactiva');
    espera.resolve(pagina([fila(1)])); await buidaPila(); expect(f.controlador.llegixEstat().ids).toEqual([]);
  });
  it.each([null, 3, 'x'.repeat(257), 'a' + '\u0300'.repeat(65)])('03 · consulta invàlida visible: %s', async consulta => {
    const f = instancia();
    await expect(f.controlador.canviaConsulta(consulta)).rejects.toMatchObject({ codi: 'CONSULTA_INVALIDA' });
    expect(f.controlador.llegixEstat()).toMatchObject({ fase: 'error', ids: [], error: { codi: 'CONSULTA_INVALIDA' } });
    expect(f.cercaPagina).not.toHaveBeenCalled();
  });
  it.each(['resolve', 'reject'])('04 · A tardana %s no modifica B', async mode => {
    const a = diferit(), b = diferit(), transport = vi.fn((_f, q) => q === 'café' ? a.promise : b.promise);
    const { controlador } = instancia({ cercaPagina: transport });
    const antiga = captura(controlador.canviaConsulta('café')); await buidaPila();
    const nova = controlador.canviaConsulta('te'); await buidaPila(); b.resolve(pagina([fila(2, { text: 'te' })])); await nova;
    const snapshot = controlador.llegixEstat();
    if (mode === 'resolve') a.resolve(pagina([fila(1)])); else a.reject(new Error('fallada antiga'));
    await antiga; await buidaPila(); expect(controlador.llegixEstat()).toBe(snapshot);
  });
  it('05 · A→B→A no valida la primera A ni el provider vell', async () => {
    const esperes = [diferit(), diferit(), diferit()]; let n = 0;
    const { controlador } = instancia({ cercaPagina: () => esperes[n++].promise });
    const primera = captura(controlador.canviaConsulta('café')); await buidaPila(); const provider = controlador.llegixEstat().cercadorG1;
    const segona = captura(controlador.canviaConsulta('te')); await buidaPila();
    const tercera = controlador.canviaConsulta('café'); await buidaPila();
    esperes[2].resolve(pagina([fila(3)])); await tercera;
    esperes[0].resolve(pagina([fila(1)])); esperes[1].resolve(pagina([fila(2, { text: 'te' })])); await Promise.all([primera, segona]);
    expect(controlador.llegixEstat().ids).toEqual([id(3)]); expect(provider([], 'café')).toEqual([]);
  });
  it('06 · canvi de sessió/compte/tenant/backend/fil és terminal per guarda, encara que torne true', async () => {
    const f = instancia(); await f.controlador.canviaConsulta('café');
    f.fixaVigent(false); expect(f.controlador.llegixEstat().fase).toBe('revocada');
    f.fixaVigent(true); await expect(f.controlador.canviaConsulta('te')).rejects.toMatchObject({ codi: 'AMBIT_REVOCAT' });
    const altra = instancia(); expect(altra.controlador.llegixEstat().fase).toBe('inactiva');
  });
  it('07 · signal ja avortat refusa el constructor abans del transport', () => {
    const vida = new AbortController(), cercaPagina = vi.fn(); vida.abort();
    expect(() => instancia({ signal: vida.signal, cercaPagina })).toThrow('AMBIT_REVOCAT'); expect(cercaPagina).not.toHaveBeenCalled();
  });
  it.each(['resolve', 'reject'])('08 · abort pendent i settlement %s tardà no publica', async mode => {
    const espera = diferit(), f = instancia({ cercaPagina: () => espera.promise });
    const p = captura(f.controlador.canviaConsulta('café')); await buidaPila(); f.vida.abort();
    expect((await p).error).toMatchObject({ codi: 'AMBIT_REVOCAT' });
    const terminal = f.controlador.llegixEstat();
    if (mode === 'resolve') espera.resolve(pagina([fila(1)])); else espera.reject(new Error('tardà'));
    await buidaPila(); expect(f.controlador.llegixEstat()).toBe(terminal); expect(terminal.ids).toEqual([]);
  });
  it('09 · provider detecta false, torna[] immediat i coalescix listeners fora de la pila', async () => {
    const f = instancia({ cercaPagina: async () => pagina([fila(1)]) }); await f.controlador.canviaConsulta('café'); await buidaPila();
    const snapshot = f.controlador.llegixEstat(), primer = vi.fn(), segon = vi.fn(); f.controlador.subscriu(primer); f.controlador.subscriu(segon);
    f.fixaVigent(false); expect(snapshot.cercadorG1([], 'café')).toEqual([]);
    const terminal = f.controlador.llegixEstat(); expect(f.controlador.llegixEstat()).toBe(terminal);
    expect(primer).not.toHaveBeenCalled(); expect(segon).not.toHaveBeenCalled();
    await buidaPila(); expect(primer).toHaveBeenCalledTimes(1); expect(segon).toHaveBeenCalledTimes(1);
    f.fixaVigent(true); expect(snapshot.cercadorG1([], 'café')).toEqual([]); expect(f.controlador.llegixEstat()).toBe(terminal);
  });
  it.each(['resolta', 'rebutjada'])('10 · guarda Promise %s es refusa i consumix rejection', async mode => {
    expect(() => instancia({ comprovaAmbit: () => mode === 'resolta' ? Promise.resolve(true) : Promise.reject(new Error('guard async')) })).toThrow('AMBIT_REVOCAT');
    await buidaPila();
  });
  it('11 · guard false durant await rebutjat conserva causa i revocació terminal', async () => {
    const espera = diferit(), f = instancia({ cercaPagina: () => espera.promise }), causa = new Error('NotReadableError');
    const p = captura(f.controlador.canviaConsulta('café')); await buidaPila(); f.fixaVigent(false); espera.reject(causa);
    expect((await p).error).toMatchObject({ codi: 'AMBIT_REVOCAT', cause: causa });
    f.fixaVigent(true); expect(f.controlador.llegixEstat().fase).toBe('revocada');
  });
  it('causa privada conserva identitat sense publicar-se en JSON ni en el snapshot', async () => {
    const causa = { detallPrivat: 'dada-sintetica-no-publica' };
    const { controlador } = instancia({ cercaPagina: () => Promise.reject(causa) });
    const { error } = await captura(controlador.canviaConsulta('café'));
    expect(error.cause).toBe(causa);
    expect(Object.getOwnPropertyDescriptor(error, 'cause').enumerable).toBe(false);
    expect(JSON.stringify(error)).not.toContain(causa.detallPrivat);
    const snapshot = controlador.llegixEstat();
    expect(snapshot.error.codi).toBe('CERCA_TRANSPORT');
    expect(Object.hasOwn(snapshot.error, 'cause')).toBe(false);
    expect(JSON.stringify(snapshot)).not.toContain(causa.detallPrivat);
  });
});

describe('controlador de cerca C11 · pàgines i dades', () => {
  it('12 · carregaMes coalescix la mateixa Promise per identitat', async () => {
    const espera = diferit(), transport = vi.fn().mockResolvedValueOnce(pagina([fila(3), fila(2)], 2)).mockImplementationOnce(() => espera.promise);
    const { controlador } = instancia({ cercaPagina: transport, limit: 2 }); await controlador.canviaConsulta('café');
    const a = controlador.carregaMes(), b = controlador.carregaMes(); expect(a).toBe(b); await buidaPila(); expect(transport).toHaveBeenCalledTimes(2);
    espera.resolve(pagina([fila(1)], 2)); await a;
  });
  it('13 · pàgina plena encara parcial i pàgina buida final acredita completitud', async () => {
    const transport = vi.fn().mockResolvedValueOnce(pagina([fila(2), fila(1)], 2)).mockResolvedValueOnce(pagina([], 2));
    const { controlador } = instancia({ cercaPagina: transport, limit: 2 });
    expect((await controlador.canviaConsulta('café')).completa).toBe(false);
    expect((await controlador.carregaMes()).completa).toBe(true);
    await controlador.carregaMes(); expect(transport).toHaveBeenCalledTimes(2);
  });
  it('14 · cursor ix de la darrera fila crua encara que siga retirada', async () => {
    const files = [fila(2), fila(1, { esborratAl: '2026-11-25T04:00:00Z' })];
    const transport = vi.fn().mockResolvedValueOnce(pagina(files, 2)).mockResolvedValueOnce(pagina([], 2));
    const { controlador } = instancia({ cercaPagina: transport, limit: 2 }); const a = await controlador.canviaConsulta('café');
    expect(a.ids).toEqual([id(2)]); expect(a.seguent.seq).toBe(1); await controlador.carregaMes();
    expect(transport.mock.calls[1][2].abansDe).toEqual({ creatAl: files[1].creatAl, seq: 1 });
  });
  it('15 · cursor microsegons i empat seq exactes sense reconstruir dates', async () => {
    const dat = '2026-11-25T02:00:00.123456+00:00';
    const transport = vi.fn().mockResolvedValueOnce(pagina([fila(3, { creatAl: dat }), fila(2, { creatAl: dat })], 2)).mockResolvedValueOnce(pagina([fila(1, { creatAl: dat })], 2));
    const { controlador } = instancia({ cercaPagina: transport, limit: 2 }); await controlador.canviaConsulta('café'); await controlador.carregaMes();
    expect(transport.mock.calls[1][2].abansDe).toEqual({ creatAl: dat, seq: 2 }); expect(controlador.llegixEstat().ids).toEqual([id(3), id(2), id(1)]);
  });
  it('16 · ordre SQL per instant exacte/offset i data no monòtona amb seq', async () => {
    const files = [fila(1, { creatAl: '2026-11-25T03:00:00.123457+01:00' }), fila(9, { creatAl: '2026-11-25T02:00:00.123456Z' })];
    const { controlador } = instancia({ cercaPagina: async () => pagina(files) });
    expect((await controlador.canviaConsulta('café')).ids).toEqual([id(1), id(9)]);
  });
  it.each(['2026-02-30T00:00:00Z', '2025-02-29T00:00:00Z', '2026-01-01T24:00:00Z', '2026-01-01T00:00:00.1234567Z', '2026-01-01T00:00:00+24:00', '2026-01-01T00:00:00+01:99'])('16b · refusa RFC3339 invàlid %s', async creatAl => {
    const { controlador } = instancia({ cercaPagina: async () => pagina([fila(1, { creatAl })]) });
    await expect(controlador.canviaConsulta('café')).rejects.toMatchObject({ codi: 'RESPOSTA_CERCA_INVALIDA' });
    expect(controlador.llegixEstat().error.recuperable).toBe(false);
  });
  it('17 · cursor repetit i cursor incoherent són error, no bucle ni èxit buit', async () => {
    const primera = pagina([fila(2), fila(1)], 2), transport = vi.fn().mockResolvedValue(primera);
    const { controlador } = instancia({ cercaPagina: transport, limit: 2 }); await controlador.canviaConsulta('café');
    await expect(controlador.carregaMes()).rejects.toMatchObject({ codi: 'CURSOR_CERCA_INVALID' });
    expect(controlador.llegixEstat()).toMatchObject({ fase: 'error', completa: false, ids: [id(2), id(1)] });
    await expect(controlador.reintenta()).rejects.toMatchObject({ codi: 'CURSOR_CERCA_INVALID' });
    const altre = instancia({ cercaPagina: async () => ({ missatges: [fila(1)], seguent: { creatAl: fila(2).creatAl, seq: 2 } }), limit: 1 });
    await expect(altre.controlador.canviaConsulta('café')).rejects.toMatchObject({ codi: 'CURSOR_CERCA_INVALID' });
  });
  it('18 · transport absent/capacitat i sync throw són error visible, mai fallback local reeixit', async () => {
    const causa = new Error('sense-capacitat'), { controlador } = instancia({ cercaPagina: () => { throw causa; } });
    controlador.actualitzaLocals([fila(1)], { revisio: 1 });
    await expect(controlador.canviaConsulta('café')).rejects.toMatchObject({ codi: 'CERCA_TRANSPORT', cause: causa });
    expect(controlador.llegixEstat()).toMatchObject({ fase: 'error', completa: false, ids: [id(1)], error: { codi: 'CERCA_TRANSPORT', recuperable: true } });
    await expect(controlador.carregaMes()).rejects.toMatchObject({ codi: 'CERCA_TRANSPORT' });
  });
  it('19 · error posterior conserva cursor i reintenta exactament la pàgina fallida', async () => {
    const transport = vi.fn().mockResolvedValueOnce(pagina([fila(3), fila(2)], 2)).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(pagina([fila(1)], 2));
    const { controlador } = instancia({ cercaPagina: transport, limit: 2 }); await controlador.canviaConsulta('café'); const cursor = controlador.llegixEstat().seguent;
    await expect(controlador.carregaMes()).rejects.toThrow(); expect(controlador.llegixEstat().seguent).toBe(cursor);
    await controlador.reintenta(); expect(transport.mock.calls[2][2].abansDe).toBe(cursor); expect(controlador.llegixEstat().ids).toHaveLength(3);
  });
  it('20 · desduplica local/remot i IDs repetits dins una resposta', async () => {
    const transport = vi.fn().mockResolvedValueOnce(pagina([fila(3), fila(3)], 2)).mockResolvedValueOnce(pagina([fila(2), fila(1)], 2));
    const { controlador } = instancia({ cercaPagina: transport, limit: 2 }); controlador.actualitzaLocals([fila(2)], { revisio: 1 });
    await controlador.canviaConsulta('café'); expect((await controlador.carregaMes()).ids).toEqual([id(3), id(2), id(1)]);
  });
  it('21 · fil alié i seq divergent no publiquen pàgina parcial', async () => {
    const a = instancia({ cercaPagina: async () => pagina([fila(1, { filId: ALTRE })]) });
    await expect(a.controlador.canviaConsulta('café')).rejects.toMatchObject({ codi: 'RESPOSTA_CERCA_INVALIDA' }); expect(a.controlador.llegixEstat().ids).toEqual([]);
    const b = instancia({ cercaPagina: async () => pagina([fila(1, { seq: 2 })]) }); b.controlador.actualitzaLocals([fila(1)], { revisio: 1 });
    await expect(b.controlador.canviaConsulta('café')).rejects.toMatchObject({ codi: 'RESPOSTA_CERCA_INVALIDA' }); expect(b.controlador.llegixEstat().ids).toEqual([id(1)]);
  });
  it('22–23 · overlay arribat durant await guanya i es torna a filtrar l’edició', async () => {
    const espera = diferit(), { controlador } = instancia({ cercaPagina: () => espera.promise }); controlador.actualitzaLocals([fila(1)], { revisio: 1 });
    const p = controlador.canviaConsulta('café'); await buidaPila();
    controlador.actualitzaLocals([fila(1, { text: 'te', editatAl: '2026-11-25T04:00:00Z' })], { revisio: 2 });
    espera.resolve(pagina([fila(1)])); await p; expect(controlador.llegixEstat().ids).toEqual([]);
  });
  it.each([{ esborratAl: 'ara' }, { amagat: true }, { bloquejat: true }, { xifrat: true }, { seguretat: { xifrat: true, verificat: false } }])('24 · retirada persistent %j no ressuscita', async flags => {
    const espera = diferit(), { controlador } = instancia({ cercaPagina: () => espera.promise });
    controlador.actualitzaLocals([fila(1)], { revisio: 1 }); const p = controlador.canviaConsulta('café'); await buidaPila();
    controlador.actualitzaLocals([fila(1, flags)], { revisio: 2 }); controlador.actualitzaLocals([], { revisio: 3 });
    espera.resolve(pagina([fila(1)])); await p; expect(controlador.llegixEstat().ids).toEqual([]);
  });
  it('25 · eixir de la finestra local no és una làpida', async () => {
    const { controlador } = instancia({ cercaPagina: async () => pagina([fila(1)]) }); controlador.actualitzaLocals([fila(1)], { revisio: 1 }); await controlador.canviaConsulta('café');
    controlador.actualitzaLocals([fila(2)], { revisio: 2 }); expect(controlador.llegixEstat().ids).toEqual([id(2), id(1)]);
  });
  it('26 · revisions inferiors/iguals divergents no sobreescriuen estat', () => {
    const { controlador } = instancia(); const inicial = controlador.actualitzaLocals([fila(1)], { revisio: 2 });
    expect(controlador.actualitzaLocals([fila(1)], { revisio: 2 })).toBe(inicial);
    expect(() => controlador.actualitzaLocals([], { revisio: 1 })).toThrow('REVISIO_LOCAL_INVALIDA');
    expect(() => controlador.actualitzaLocals([], { revisio: 2 })).toThrow('REVISIO_LOCAL_INVALIDA');
  });
  it('27 · provider nou en resultats, [] en consulta aliena i zero RPC per repetir-lo', async () => {
    const espera = diferit(), transport = vi.fn(() => espera.promise), { controlador } = instancia({ cercaPagina: transport });
    const p = controlador.canviaConsulta('café'); const antic = controlador.llegixEstat().cercadorG1; await buidaPila(); espera.resolve(pagina([fila(1)])); await p;
    const nou = controlador.llegixEstat().cercadorG1; expect(nou).not.toBe(antic); expect(antic([], 'café')).toEqual([]);
    expect(nou([], 'te')).toEqual([]); expect(nou([], 'café')).toEqual([id(1)]); expect(nou([], 'café')).toEqual([id(1)]);
    expect(nou([fila(1, { amagat: true })], 'café')).toEqual([]); expect(transport).toHaveBeenCalledTimes(1);
  });
  it('28 · notificacions coalescides i callback fallit visible sense saltar altres listeners', async () => {
    const { controlador } = instancia(), segon = vi.fn(); controlador.subscriu(() => { throw new Error('UI'); }); controlador.subscriu(segon);
    controlador.actualitzaLocals([fila(1)], { revisio: 1 }); controlador.actualitzaLocals([fila(2)], { revisio: 2 }); expect(segon).not.toHaveBeenCalled();
    await buidaPila(); expect(segon).toHaveBeenCalledTimes(1); expect(controlador.llegixEstat().error.codi).toBe('SUBSCRIPTOR_FALLIT');
  });
});

describe('controlador de cerca C11 · salt autoritzat i costura G6', () => {
  it('29 · ID antic sempre es carrega abans del rebut encara que conste localment', async () => {
    const f = instancia({ cercaPagina: async () => pagina([fila(1)]) }); f.controlador.actualitzaLocals([fila(1)], { revisio: 1 }); await f.controlador.canviaConsulta('café');
    const rebut = await f.controlador.preparaSalt(id(1)); expect(f.carregaPerId).toHaveBeenCalledWith(F, id(1), expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(f.controlador.comprovaSalt(rebut).id).toBe(id(1)); expect(Object.isFrozen(rebut)).toBe(true);
  });
  it.each(['resolve', 'reject'])('30/G6 · salt vell %s després de selecció B no torna a mostrar avis vell', async mode => {
    const espera = diferit(), carregador = vi.fn((_f, target) => target === id(1) ? espera.promise : fila(2));
    const { controlador } = instancia({ cercaPagina: async () => pagina([fila(2), fila(1)]), carregaPerId: carregador }); await controlador.canviaConsulta('café');
    const a = captura(controlador.preparaSalt(id(1))); await buidaPila(); const rebutB = await controlador.preparaSalt(id(2)); const estatB = controlador.llegixEstat();
    if (mode === 'resolve') espera.resolve(fila(1)); else espera.reject(new Error('vell rebutjat'));
    expect((await a).error.codi).toBe('CERCA_DESCARTADA'); await buidaPila(); expect(controlador.llegixEstat()).toBe(estatB); expect(controlador.comprovaSalt(rebutB).id).toBe(id(2));
  });
  it('30b · consulta nova invalida també un salt pendent que després rebutja', async () => {
    const espera = diferit(), { controlador } = instancia({ cercaPagina: async () => pagina([fila(1)]), carregaPerId: () => espera.promise }); await controlador.canviaConsulta('café');
    const salt = captura(controlador.preparaSalt(id(1))); await buidaPila(); await controlador.canviaConsulta('te'); espera.reject(new Error('tardà')); await salt;
    expect(controlador.llegixEstat().salt.fase).toBe('inactiu');
  });
  it.each([null, fila(1, { filId: ALTRE }), fila(1, { esborratAl: 'ara' }), fila(1, { text: 'te' })])('31 · salt no disponible %j retira el hit i mostra error', async resposta => {
    const { controlador } = instancia({ cercaPagina: async () => pagina([fila(1)]), carregaPerId: async () => resposta }); await controlador.canviaConsulta('café');
    await expect(controlador.preparaSalt(id(1))).rejects.toMatchObject({ codi: 'MISSATGE_NO_DISPONIBLE' });
    expect(controlador.llegixEstat().ids).toEqual([]); expect(controlador.llegixEstat().salt.error.codi).toBe('MISSATGE_NO_DISPONIBLE');
  });
  it('32 · rebut inventat/alié i revocació durant espera UI refusen focus', async () => {
    const f = instancia({ cercaPagina: async () => pagina([fila(1)]) }); await f.controlador.canviaConsulta('café'); const rebut = await f.controlador.preparaSalt(id(1));
    expect(() => f.controlador.comprovaSalt({ ...rebut })).toThrow('CERCA_DESCARTADA');
    const altra = instancia(); expect(() => altra.controlador.comprovaSalt(rebut)).toThrow('CERCA_DESCARTADA');
    f.fixaVigent(false); expect(() => f.controlador.comprovaSalt(rebut)).toThrow('AMBIT_REVOCAT');
  });
  it('33 · destrueix idempotent; subscripció fora no rep i pendents no publiquen', async () => {
    const espera = diferit(), { controlador } = instancia({ cercaPagina: () => espera.promise }), listener = vi.fn(); const fora = controlador.subscriu(listener);
    const p = captura(controlador.canviaConsulta('café')); await buidaPila(); fora(); controlador.destrueix(); const tancat = controlador.llegixEstat(); controlador.destrueix();
    expect(controlador.llegixEstat()).toBe(tancat); expect((await p).error.codi).toBe('INSTANCIA_TANCADA');
    espera.resolve(pagina([fila(1)])); await buidaPila(); expect(controlador.llegixEstat()).toBe(tancat); expect(listener).toHaveBeenCalledTimes(1);
  });
  it('34 · còpies de DTO/config/cursor resisteixen mutació després d’await', async () => {
    const dades = fila(1, { metadades: { adjunt: { nom: 'privat.txt' } } }), config = { filId: F, cercaPagina: async () => pagina([dades]) };
    const { controlador } = instancia(config); const p = controlador.canviaConsulta('café'); config.filId = ALTRE; await p;
    dades.text = 'te'; dades.metadades.adjunt.nom = 'alterat'; const snapshot = controlador.llegixEstat();
    expect(snapshot.filId).toBe(F); expect(snapshot.missatges[0].text).toBe('café'); expect(snapshot.missatges[0].metadades.adjunt.nom).toBe('privat.txt');
    expect(() => { snapshot.missatges[0].text = 'alterat'; }).toThrow();
  });
  it('G6 · callback per-ID síncron que llança queda dins Promise/error visible', async () => {
    const causa = new Error('carregador síncron'), { controlador } = instancia({ cercaPagina: async () => pagina([fila(1)]), carregaPerId: () => { throw causa; } });
    await controlador.canviaConsulta('café'); let p; expect(() => { p = controlador.preparaSalt(id(1)); }).not.toThrow();
    await expect(p).rejects.toMatchObject({ codi: 'SALT_TRANSPORT', cause: causa }); expect(controlador.llegixEstat().salt.error.codi).toBe('SALT_TRANSPORT');
  });
  it('C9 · guarda falsa mentre per-ID rebutja és terminal i conserva causa', async () => {
    const espera = diferit(), f = instancia({ cercaPagina: async () => pagina([fila(1)]), carregaPerId: () => espera.promise }), causa = new Error('NotReadableError');
    await f.controlador.canviaConsulta('café'); const p = captura(f.controlador.preparaSalt(id(1))); await buidaPila(); f.fixaVigent(false); espera.reject(causa);
    expect((await p).error).toMatchObject({ codi: 'AMBIT_REVOCAT', cause: causa }); f.fixaVigent(true); expect(f.controlador.llegixEstat().fase).toBe('revocada');
  });
  it('netejar després de consulta invàlida lleva l’error sense RPC', async () => {
    const f = instancia(); await expect(f.controlador.canviaConsulta(null)).rejects.toThrow();
    expect((await f.controlador.canviaConsulta('')).fase).toBe('inactiva'); expect(f.cercaPagina).not.toHaveBeenCalled();
  });
  it('provider UI no invoca getters de DTO ni deixa escapar errors de dades', async () => {
    const f = instancia({ cercaPagina: async () => pagina([fila(1)]) }); await f.controlador.canviaConsulta('café');
    const getter = vi.fn(() => { throw new Error('No s’ha de cridar'); }), dto = { id: id(1) }; Object.defineProperty(dto, 'amagat', { get: getter });
    expect(f.controlador.llegixEstat().cercadorG1([dto], 'café')).toEqual([]); expect(getter).not.toHaveBeenCalled();
  });
  it.each([{ seq: 2 }, { creatAl: fila(2).creatAl }])('per-ID refusa UUID amb seq/data de creació divergents %j', async canvi => {
    const { controlador } = instancia({ cercaPagina: async () => pagina([fila(1)]), carregaPerId: async () => fila(1, canvi) }); await controlador.canviaConsulta('café');
    await expect(controlador.preparaSalt(id(1))).rejects.toMatchObject({ codi: 'RESPOSTA_CERCA_INVALIDA' }); expect(controlador.llegixEstat().ids).toEqual([]);
  });
  it.each([{ cas: 'fila nova posterior [4,1]', files: [fila(4), fila(1)] }, { cas: 'fixture superposada original [2,1]', files: [fila(2), fila(1)] }])('crítica root · continuació fora de frontera: $cas', async ({ files }) => {
    const transport = vi.fn().mockResolvedValueOnce(pagina([fila(3), fila(2)], 2)).mockResolvedValueOnce(pagina(files, 2));
    const { controlador } = instancia({ cercaPagina: transport, limit: 2 }); await controlador.canviaConsulta('café');
    const abans = controlador.llegixEstat(); await expect(controlador.carregaMes()).rejects.toMatchObject({ codi: 'CURSOR_CERCA_INVALID' });
    expect(controlador.llegixEstat().missatges).toBe(abans.missatges); expect(controlador.llegixEstat().ids).toEqual([id(3), id(2)]); expect(controlador.llegixEstat().seguent).toBe(abans.seguent);
  });
  it.each([true, false])('crítica root · actualització local invàlida és atòmica (consulta activa=%s)', async activa => {
    const f = instancia({ cercaPagina: async () => pagina([fila(1)]) }); if (activa) await f.controlador.canviaConsulta('café');
    const abans = f.controlador.llegixEstat();
    expect(() => f.controlador.actualitzaLocals([fila(1, { text: 'a' + '\u0300'.repeat(65), editatAl: '2026-11-25T05:00:00Z' })], { revisio: 1 })).toThrow('RESPOSTA_CERCA_INVALIDA');
    expect(f.controlador.llegixEstat()).toBe(abans);
    expect(() => f.controlador.actualitzaLocals([fila(1, { text: 'café nou', editatAl: '2026-11-25T05:00:00Z' })], { revisio: 1 })).not.toThrow();
    if (activa) expect(f.controlador.llegixEstat().missatges[0].text).toBe('café nou');
  });
  it('crítica root · candidata local fallida no aplica tampoc làpides ni elimina remots', async () => {
    const { controlador } = instancia({ cercaPagina: async () => pagina([fila(2), fila(1)]) }); await controlador.canviaConsulta('café');
    expect(() => controlador.actualitzaLocals([fila(2, { esborratAl: 'ara' }), fila(1, { text: 'a' + '\u0300'.repeat(65), editatAl: '2026-11-25T05:00:00Z' })], { revisio: 1 })).toThrow('RESPOSTA_CERCA_INVALIDA');
    controlador.actualitzaLocals([fila(1)], { revisio: 1 }); expect(controlador.llegixEstat().ids).toEqual([id(2), id(1)]);
  });
  it.each([{ seq: 99 }, { creatAl: '2026-11-25T04:00:01.123456Z' }])('crítica agent4 · local conegut no canvia identitat: %j', async canvi => {
    const { controlador } = instancia(); controlador.actualitzaLocals([fila(1)], { revisio: 1 });
    const abans = controlador.llegixEstat(); expect(() => controlador.actualitzaLocals([fila(1, canvi)], { revisio: 2 })).toThrow('RESPOSTA_CERCA_INVALIDA');
    expect(controlador.llegixEstat()).toBe(abans); expect(() => controlador.actualitzaLocals([fila(1)], { revisio: 2 })).not.toThrow();
  });
  it.each([{ seq: 99, esborratAl: 'ara' }, { creatAl: '2026-11-25T04:00:01.123456Z', editatAl: '2026-11-25T05:00:00Z' }])('crítica agent4 · identitat es valida abans de retirar remots: %j', async canvi => {
    const { controlador } = instancia({ cercaPagina: async () => pagina([fila(1)]) }); await controlador.canviaConsulta('café');
    const abans = controlador.llegixEstat(); expect(() => controlador.actualitzaLocals([fila(1, canvi)], { revisio: 1 })).toThrow('RESPOSTA_CERCA_INVALIDA');
    expect(controlador.llegixEstat()).toBe(abans); controlador.actualitzaLocals([fila(1)], { revisio: 1 }); expect(controlador.llegixEstat().ids).toEqual([id(1)]);
  });
  it('identitat també es conserva quan una fila ix de la finestra o es retira', () => {
    const { controlador } = instancia(); controlador.actualitzaLocals([fila(1)], { revisio: 1 }); controlador.actualitzaLocals([], { revisio: 2 });
    expect(() => controlador.actualitzaLocals([fila(1, { seq: 99 })], { revisio: 3 })).toThrow('RESPOSTA_CERCA_INVALIDA');
    controlador.actualitzaLocals([fila(1, { esborratAl: 'ara' })], { revisio: 3 });
    expect(() => controlador.actualitzaLocals([fila(1, { seq: 99, esborratAl: 'ara' })], { revisio: 4 })).toThrow('RESPOSTA_CERCA_INVALIDA');
  });
  it('crítica agent4 · fresc te no dóna rebut per overlay café datat', async () => {
    const { controlador } = instancia({ cercaPagina: async () => pagina([fila(1)]), carregaPerId: async () => fila(1, { text: 'te' }) });
    controlador.actualitzaLocals([fila(1, { editatAl: '2026-11-25T05:00:00Z' })], { revisio: 1 }); await controlador.canviaConsulta('café');
    await expect(controlador.preparaSalt(id(1))).rejects.toMatchObject({ codi: 'MISSATGE_NO_DISPONIBLE' }); expect(controlador.llegixEstat().ids).toEqual([]);
  });
  it('salt retorna la fila fresca, encara que un overlay datat també coincidisca', async () => {
    const fresca = fila(1, { text: 'café servidor' });
    const { controlador } = instancia({ cercaPagina: async () => pagina([fila(1)]), carregaPerId: async () => fresca });
    controlador.actualitzaLocals([fila(1, { text: 'café local', editatAl: '2026-11-25T05:00:00Z' })], { revisio: 1 }); await controlador.canviaConsulta('café');
    expect(controlador.llegixEstat().missatges[0].text).toBe('café local');
    const rebut = await controlador.preparaSalt(id(1)); expect(rebut.missatge.text).toBe('café servidor'); expect(controlador.comprovaSalt(rebut).text).toBe('café servidor');
    controlador.actualitzaLocals([fresca], { revisio: 2 }); expect(controlador.comprovaSalt(rebut).text).toBe('café servidor');
    controlador.actualitzaLocals([fila(1, { text: 'café editat després', editatAl: '2026-11-25T06:00:00Z' })], { revisio: 3 });
    expect(() => controlador.comprovaSalt(rebut)).toThrow('CERCA_DESCARTADA');
  });
});
