// @vitest-environment node
/* Ordre del Mestre (261026, prompt 261026_1615, tasca 3) · El registre dels
   avisos natius del xat (avisosNatius.js): un sol adaptador, el permís llegit i
   guardat, mai una pregunta a qui ha dit que no, l'avís que mai trenca qui crida,
   els tocs que arriben abans que ningú escolte i l'id estable per conversa.
   Cada cas carrega un mòdul nou: el registre és d'estat de mòdul. Tot és sintètic. */
import { describe, expect, test, vi } from 'vitest';

const carrega = async () => {
  vi.resetModules();
  return import('./avisosNatius.js');
};
const promesaOberta = () => {
  let resol;
  let rebutja;
  const promesa = new Promise((r, j) => { resol = r; rebutja = j; });
  return { promesa, resol, rebutja };
};
/* Buida la cua de microtasques: la lectura del permís en registrar és asíncrona. */
const buida = async () => { for (let i = 0; i < 12; i += 1) await Promise.resolve(); };
const adaptador = (estat = 'granted', extra = {}) => {
  const a = {
    toca: null,
    estatPermis: vi.fn(async () => estat),
    demanaPermis: vi.fn(async () => 'granted'),
    avisa: vi.fn(async () => {}),
    escoltaToc: vi.fn((fn) => { a.toca = fn; }),
    ...extra
  };
  return a;
};
const registra = async (r, a) => {
  expect(r.registraAvisosNatius(a)).toBe(true);
  await buida();
  return a;
};

describe('registrar', () => {
  test.each([
    ['un objecte buit', {}],
    ['sense escoltaToc()', { estatPermis: async () => 'granted', demanaPermis: async () => 'granted', avisa: async () => {} }],
    ['un avisa que no és funció', { estatPermis: async () => 'granted', demanaPermis: async () => 'granted', avisa: 'sí', escoltaToc: () => {} }],
    ['un text', 'adaptador'],
    ['un número', 7]
  ])('%s llança TypeError i no registra res', async (_cas, dolent) => {
    const r = await carrega();
    expect(() => r.registraAvisosNatius(dolent)).toThrow(TypeError);
    expect(r.avisosNatiusDisponibles()).toBe(false);
    // Un adaptador bo encara es pot registrar després.
    expect(r.registraAvisosNatius(adaptador())).toBe(true);
  });

  test('sense adaptador (la web, la PWA, el connector) torna false i tot queda apagat', async () => {
    const r = await carrega();
    expect(r.registraAvisosNatius(null)).toBe(false);
    expect(r.registraAvisosNatius(undefined)).toBe(false);
    expect(r.avisosNatiusDisponibles()).toBe(false);
    expect(r.avisosNatiusActius()).toBe(false);
    await expect(r.demanaPermisAvisos()).resolves.toBeNull();
    await expect(r.refrescaPermisAvisos()).resolves.toBeNull();
    expect(r.avisaNatiu({ id: 1, titol: 'Pepa', cos: 'Hola', filId: 'f' })).toBe(false);
  });

  test('una sola vegada: el mateix adaptador torna true, un altre llança i no se l’escolta', async () => {
    const r = await carrega();
    const a = await registra(r, adaptador());
    const b = adaptador();
    expect(r.registraAvisosNatius(a)).toBe(true);
    expect(() => r.registraAvisosNatius(b)).toThrow('ja estan registrats');
    expect(() => r.registraAvisosNatius(b)).not.toThrow(TypeError);
    await buida();
    // El primer s'escolta i es llig una sola vegada, amb ell mateix com a `this`.
    expect(a.escoltaToc).toHaveBeenCalledTimes(1);
    expect(a.estatPermis).toHaveBeenCalledTimes(1);
    expect(a.estatPermis.mock.contexts[0]).toBe(a);
    expect(b.escoltaToc).not.toHaveBeenCalled();
    expect(b.estatPermis).not.toHaveBeenCalled();
    expect(r.avisaNatiu({ id: 3, titol: 'T', cos: 'C' })).toBe(true);
    expect(a.avisa).toHaveBeenCalledTimes(1);
    expect(b.avisa).not.toHaveBeenCalled();
  });

  test('un escoltaToc que llança no impedix registrar ni avisar', async () => {
    const r = await carrega();
    const a = adaptador('granted', { escoltaToc: vi.fn(() => { throw new Error('sense pont'); }) });
    expect(r.registraAvisosNatius(a)).toBe(true);
    await buida();
    expect(r.avisosNatiusActius()).toBe(true);
  });
});

describe('el permís', () => {
  test('la lectura en registrar és asíncrona i decidix si els avisos són actius', async () => {
    const r = await carrega();
    const a = adaptador('granted');
    r.registraAvisosNatius(a);
    // Disponible ja; actiu només quan el permís llegit diu 'granted'.
    expect(r.avisosNatiusDisponibles()).toBe(true);
    expect(r.avisosNatiusActius()).toBe(false);
    await buida();
    expect(r.avisosNatiusActius()).toBe(true);
    expect(a.demanaPermis).not.toHaveBeenCalled();
  });

  test.each(['denied', 'prompt', 'prompt-with-rationale', undefined, null])('amb %j no són actius', async (estat) => {
    const r = await carrega();
    await registra(r, adaptador('granted', { estatPermis: vi.fn(async () => estat) }));
    expect(r.avisosNatiusDisponibles()).toBe(true);
    expect(r.avisosNatiusActius()).toBe(false);
  });

  test('una lectura que falla deixa els avisos apagats, sense llançar', async () => {
    const r = await carrega();
    const a = adaptador('granted', { estatPermis: vi.fn(async () => { throw new Error('pont'); }) });
    await registra(r, a);
    expect(r.avisosNatiusActius()).toBe(false);
  });

  test('refrescar torna a llegir els ajustos, mai pregunta i guarda la resposta', async () => {
    const r = await carrega();
    const a = await registra(r, adaptador('granted'));
    a.estatPermis.mockResolvedValue('denied');
    await expect(r.refrescaPermisAvisos()).resolves.toBe('denied');
    expect(r.avisosNatiusActius()).toBe(false);
    a.estatPermis.mockResolvedValue('granted');
    await expect(r.refrescaPermisAvisos()).resolves.toBe('granted');
    expect(r.avisosNatiusActius()).toBe(true);
    // Si la lectura falla, es queda l'últim estat conegut.
    a.estatPermis.mockRejectedValue(new Error('pont'));
    await expect(r.refrescaPermisAvisos()).resolves.toBe('granted');
    expect(r.avisosNatiusActius()).toBe(true);
    expect(a.demanaPermis).not.toHaveBeenCalled();
  });

  test('demanar mai torna a preguntar a qui ha dit que no', async () => {
    const r = await carrega();
    const a = await registra(r, adaptador('denied'));
    await expect(r.demanaPermisAvisos()).resolves.toBe('denied');
    await expect(r.demanaPermisAvisos()).resolves.toBe('denied');
    expect(a.demanaPermis).not.toHaveBeenCalled();
    expect(r.avisosNatiusActius()).toBe(false);
  });

  test('demanar amb el permís ja concedit no pregunta', async () => {
    const r = await carrega();
    const a = await registra(r, adaptador('granted'));
    await expect(r.demanaPermisAvisos()).resolves.toBe('granted');
    expect(a.demanaPermis).not.toHaveBeenCalled();
  });

  test.each([
    ['granted', true],
    ['denied', false]
  ])('amb "prompt" pregunta una vegada i guarda la resposta %j', async (resposta, actius) => {
    const r = await carrega();
    const a = await registra(r, adaptador('prompt', { demanaPermis: vi.fn(async () => resposta) }));
    expect(r.avisosNatiusActius()).toBe(false);
    await expect(r.demanaPermisAvisos()).resolves.toBe(resposta);
    expect(a.demanaPermis).toHaveBeenCalledTimes(1);
    expect(r.avisosNatiusActius()).toBe(actius);
  });

  test('dues crides alhora comparteixen la mateixa pregunta; acabada, la següent en fa una de nova', async () => {
    const r = await carrega();
    const resposta = promesaOberta();
    const a = await registra(r, adaptador('prompt', { demanaPermis: vi.fn(() => resposta.promesa) }));
    const primera = r.demanaPermisAvisos();
    const segona = r.demanaPermisAvisos();
    expect(segona).toBe(primera);
    await buida();
    expect(a.demanaPermis).toHaveBeenCalledTimes(1);
    resposta.resol('granted');
    await expect(Promise.all([primera, segona])).resolves.toEqual(['granted', 'granted']);
    expect(r.avisosNatiusActius()).toBe(true);
    a.estatPermis.mockResolvedValue('granted');
    const tercera = r.demanaPermisAvisos();
    expect(tercera).not.toBe(primera);
    await expect(tercera).resolves.toBe('granted');
    expect(a.demanaPermis).toHaveBeenCalledTimes(1);
  });

  test('si la pregunta falla torna l’estat conegut sense llançar, i es pot tornar a provar', async () => {
    const r = await carrega();
    const a = await registra(r, adaptador('prompt', { demanaPermis: vi.fn(async () => { throw new Error('pont'); }) }));
    await expect(r.demanaPermisAvisos()).resolves.toBe('prompt');
    expect(r.avisosNatiusActius()).toBe(false);
    a.demanaPermis.mockResolvedValue('granted');
    await expect(r.demanaPermisAvisos()).resolves.toBe('granted');
    expect(a.demanaPermis).toHaveBeenCalledTimes(2);
    expect(r.avisosNatiusActius()).toBe(true);
  });
});

describe('avisar', () => {
  test('sense permís concedit no avisa: qui crida pinta el toast', async () => {
    const r = await carrega();
    const a = await registra(r, adaptador('prompt'));
    expect(r.avisaNatiu({ id: 1, titol: 'Pepa', cos: 'Hola', filId: 'f' })).toBe(false);
    expect(a.avisa).not.toHaveBeenCalled();
  });

  test.each([
    ['sense avís', undefined],
    ['un avís null', null],
    ['sense id', { titol: 'T', cos: 'C' }],
    ['un id de text', { id: '7', titol: 'T', cos: 'C' }],
    ['un id decimal', { id: 1.5, titol: 'T', cos: 'C' }],
    ['un id NaN', { id: Number.NaN, titol: 'T', cos: 'C' }],
    ['un id infinit', { id: Number.POSITIVE_INFINITY, titol: 'T', cos: 'C' }],
    ['un id fora dels enters segurs', { id: 2 ** 53, titol: 'T', cos: 'C' }],
    ['títol i cos buits', { id: 7, titol: '   ', cos: '' }],
    ['títol i cos que no són text', { id: 7, titol: 42, cos: { text: 'Hola' } }]
  ])('%s: false i l’adaptador no es crida', async (_cas, avis) => {
    const r = await carrega();
    const a = await registra(r, adaptador('granted'));
    expect(r.avisaNatiu(avis)).toBe(false);
    expect(a.avisa).not.toHaveBeenCalled();
  });

  test('amb permís encarrega l’avís net: camps retallats i res més', async () => {
    const r = await carrega();
    const a = await registra(r, adaptador('granted'));
    expect(r.avisaNatiu({ id: 7, titol: '  Pepa  ', cos: '\nHola, veïna\t', filId: ' fil-1 ', html: '<b>x</b>' })).toBe(true);
    expect(a.avisa).toHaveBeenCalledTimes(1);
    expect(a.avisa.mock.calls[0][0]).toEqual({ id: 7, titol: 'Pepa', cos: 'Hola, veïna', filId: 'fil-1' });
    expect(a.avisa.mock.contexts[0]).toBe(a);
    // Només títol, només cos, o un filId que no és text: també avisa.
    expect(r.avisaNatiu({ id: 8, titol: 'Pepa', cos: '' })).toBe(true);
    expect(r.avisaNatiu({ id: 9, cos: 'Hola', filId: 99 })).toBe(true);
    expect(a.avisa.mock.calls[1][0]).toEqual({ id: 8, titol: 'Pepa', cos: '', filId: '' });
    expect(a.avisa.mock.calls[2][0]).toEqual({ id: 9, titol: '', cos: 'Hola', filId: '' });
  });

  test('un adaptador que llança o rebutja mai trenca qui crida', async () => {
    const r = await carrega();
    const a = await registra(r, adaptador('granted'));
    const fuites = vi.fn();
    process.on('unhandledRejection', fuites);
    try {
      a.avisa.mockImplementationOnce(() => { throw new Error('sense pont'); });
      expect(() => r.avisaNatiu({ id: 1, titol: 'T', cos: 'C' })).not.toThrow();
      a.avisa.mockImplementationOnce(() => { throw new Error('sense pont'); });
      // Síncron: no s'ha encarregat, el xat pinta el toast.
      expect(r.avisaNatiu({ id: 1, titol: 'T', cos: 'C' })).toBe(false);
      a.avisa.mockImplementationOnce(() => Promise.reject(new Error('el sistema diu que no')));
      // Asíncron: ja s'havia encarregat; la fallada s'empassa.
      expect(r.avisaNatiu({ id: 2, titol: 'T', cos: 'C' })).toBe(true);
      a.avisa.mockImplementationOnce(() => undefined);
      expect(r.avisaNatiu({ id: 3, titol: 'T', cos: 'C' })).toBe(true);
      await new Promise((resol) => { setTimeout(resol, 0); });
      expect(fuites).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', fuites);
    }
  });

  test('quan la persona lleva el permís als ajustos, deixa d’avisar', async () => {
    const r = await carrega();
    const a = await registra(r, adaptador('granted'));
    expect(r.avisaNatiu({ id: 1, titol: 'T', cos: 'C' })).toBe(true);
    a.estatPermis.mockResolvedValue('denied');
    await r.refrescaPermisAvisos();
    expect(r.avisaNatiu({ id: 2, titol: 'T', cos: 'C' })).toBe(false);
    expect(a.avisa).toHaveBeenCalledTimes(1);
  });
});

describe('els tocs dels avisos', () => {
  test('els tocs d’abans que ningú escolte es guarden (els 5 últims) i van al primer oient', async () => {
    const r = await carrega();
    const a = await registra(r, adaptador('granted'));
    for (let i = 1; i <= 7; i += 1) a.toca({ filId: `fil-${i}` });
    const primer = vi.fn();
    const segon = vi.fn();
    r.escoltaTocAvis(primer);
    expect(primer.mock.calls.map(([toc]) => toc)).toEqual(
      ['fil-3', 'fil-4', 'fil-5', 'fil-6', 'fil-7'].map((filId) => ({ filId }))
    );
    // Ja lliurats: el segon oient no els rep.
    r.escoltaTocAvis(segon);
    expect(segon).not.toHaveBeenCalled();
  });

  test('sense filId (o buit, o que no és text) el toc s’ignora; el bo arriba retallat i sol', async () => {
    const r = await carrega();
    const a = await registra(r, adaptador('granted'));
    for (const dolent of [undefined, null, {}, { filId: '   ' }, { filId: 42 }, { filId: null }]) a.toca(dolent);
    a.toca({ filId: ' fil-9 ', notificacio: { id: 1 } });
    const oient = vi.fn();
    r.escoltaTocAvis(oient);
    expect(oient.mock.calls).toEqual([[{ filId: 'fil-9' }]]);
    a.toca({});
    a.toca({ filId: '' });
    expect(oient).toHaveBeenCalledTimes(1);
  });

  test('amb oients, el toc arriba a tots al moment; un oient trencat no talla els altres', async () => {
    const r = await carrega();
    const a = await registra(r, adaptador('granted'));
    const trencat = vi.fn(() => { throw new Error('trencat'); });
    const bo = vi.fn();
    r.escoltaTocAvis(trencat);
    r.escoltaTocAvis(bo);
    expect(() => a.toca({ filId: 'fil-1' })).not.toThrow();
    expect(trencat).toHaveBeenCalledWith({ filId: 'fil-1' });
    expect(bo).toHaveBeenCalledWith({ filId: 'fil-1' });
  });

  test('deixar d’escoltar: ja no rep res, i sense cap oient els tocs tornen a guardar-se', async () => {
    const r = await carrega();
    const a = await registra(r, adaptador('granted'));
    const primer = vi.fn();
    const segon = vi.fn();
    const deixaPrimer = r.escoltaTocAvis(primer);
    const deixaSegon = r.escoltaTocAvis(segon);
    deixaPrimer();
    a.toca({ filId: 'fil-1' });
    expect(primer).not.toHaveBeenCalled();
    expect(segon).toHaveBeenCalledTimes(1);
    deixaSegon();
    deixaSegon();
    a.toca({ filId: 'fil-2' });
    expect(segon).toHaveBeenCalledTimes(1);
    const tercer = vi.fn();
    r.escoltaTocAvis(tercer);
    expect(tercer.mock.calls).toEqual([[{ filId: 'fil-2' }]]);
  });

  test('un oient que no és funció no escolta ni es menja els tocs guardats', async () => {
    const r = await carrega();
    const a = await registra(r, adaptador('granted'));
    a.toca({ filId: 'fil-1' });
    const deixa = r.escoltaTocAvis('no');
    expect(deixa).toBeTypeOf('function');
    expect(() => deixa()).not.toThrow();
    const oient = vi.fn();
    r.escoltaTocAvis(oient);
    expect(oient.mock.calls).toEqual([[{ filId: 'fil-1' }]]);
  });
});

describe('l’id de l’avís', () => {
  const FILS = [
    '3f2b8c1e-6a4d-4e7b-9c2a-1d5e8f0a7b3c',
    '3f2b8c1e-6a4d-4e7b-9c2a-1d5e8f0a7b3d',
    'c0ffee00-0000-4000-8000-000000000001',
    'fil-1',
    'fil-2',
    'àéíòú·ŀl€🙂',
    'x'.repeat(5000)
  ];

  test('estable: el mateix fil dona el mateix id, també després de recarregar el mòdul', async () => {
    const abans = (await carrega()).idDAvis;
    const despres = (await carrega()).idDAvis;
    for (const fil of FILS) expect(despres(fil), fil).toBe(abans(fil));
    // Fixat: un canvi de càlcul deixaria avisos vells sense substituir a la safata.
    expect(despres('ab')).toBe(97 * 31 + 98);
    expect(despres(42)).toBe(despres('42'));
  });

  test('positiu, enter de 31 bits i acceptat per avisaNatiu', async () => {
    const r = await carrega();
    const a = await registra(r, adaptador('granted'));
    for (const fil of FILS) {
      const id = r.idDAvis(fil);
      expect(Number.isSafeInteger(id), fil).toBe(true);
      expect(id, fil).toBeGreaterThan(0);
      expect(id, fil).toBeLessThanOrEqual(2 ** 31 - 1);
      expect(r.avisaNatiu({ id, titol: 'T', cos: 'C', filId: fil }), fil).toBe(true);
    }
    expect(a.avisa).toHaveBeenCalledTimes(FILS.length);
  });

  test('fils diferents donen ids diferents', async () => {
    const r = await carrega();
    expect(new Set(FILS.map(r.idDAvis)).size).toBe(FILS.length);
  });

  test('null, undefined i buit no llancen i donen 1', async () => {
    const r = await carrega();
    for (const buit of [null, undefined, '']) expect(r.idDAvis(buit)).toBe(1);
  });
});

/* Revisió 261026 · La primera lectura del permís pot arribar tard: si mentrestant
   la persona ja ha dit que sí, la lectura vella ('prompt') no l'esborra. */
describe('lectures del permís encavalcades', () => {
  test('una primera lectura lenta no tapa el «granted» que ja ha arribat', async () => {
    const r = await carrega();
    const lenta = promesaOberta();
    let crides = 0;
    const a = adaptador('prompt', {
      estatPermis: vi.fn(() => { crides += 1; return crides === 1 ? lenta.promesa : Promise.resolve('prompt'); }),
      demanaPermis: vi.fn(async () => 'granted')
    });
    expect(r.registraAvisosNatius(a)).toBe(true);
    await buida();
    // La lectura del registre (la primera) continua oberta.
    expect(a.estatPermis).toHaveBeenCalledOnce();
    await expect(r.demanaPermisAvisos()).resolves.toBe('granted');
    expect(r.avisosNatiusActius()).toBe(true);
    lenta.resol('prompt');
    await buida();
    expect(r.avisosNatiusActius()).toBe(true);
    expect(a.demanaPermis).toHaveBeenCalledOnce();
  });
});

/* Revisió 261026 · Android 13+ torna 'prompt-with-rationale' després d'un «No»:
   no és «encara no ho ha decidit» i no s'hi torna a preguntar. */
describe('després d’un «No» a Android 13+', () => {
  test('prompt-with-rationale no torna a obrir el diàleg del sistema', async () => {
    const r = await carrega();
    const a = await registra(r, adaptador('prompt-with-rationale'));
    await expect(r.demanaPermisAvisos()).resolves.toBe('prompt-with-rationale');
    expect(a.demanaPermis).not.toHaveBeenCalled();
    expect(r.avisosNatiusActius()).toBe(false);
  });
});

describe('netejaAvisosNatius', () => {
  test('crida l’adaptador si en porta, i mai llança (ni sense adaptador ni si rebutja)', async () => {
    const r = await carrega();
    expect(() => r.netejaAvisosNatius()).not.toThrow();
    const netejaAvisos = vi.fn(async () => { throw new Error('sense connector'); });
    await registra(r, adaptador('granted', { netejaAvisos }));
    expect(() => r.netejaAvisosNatius()).not.toThrow();
    await buida();
    expect(netejaAvisos).toHaveBeenCalledOnce();
  });
});
