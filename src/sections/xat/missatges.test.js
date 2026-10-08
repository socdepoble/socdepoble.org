import { describe, expect, it, vi } from 'vitest';
import {
  LIMIT_PAGINA,
  MAX_REINTENTS,
  actualitzaFilAmbMissatge,
  actualitzaPendent,
  afigPendent,
  agrupaComunitats,
  aplicaMarcaLocal,
  combinaMissatges,
  contactesFrequents,
  creaAgrupadorMarques,
  derivaEstat,
  esSilenciat,
  esperaReintent,
  estatDeLUltim,
  filIgual,
  filsEquivalents,
  fusionaPerSeq,
  generaId,
  interromEnviaments,
  mapejaFil,
  mapejaMissatge,
  retiraConfirmats,
  retiraPendent,
  seqMaxim,
  seqMinim,
  sumaNoLlegits,
  trobaPendent
} from './missatges.js';

const m = (id, seq, extra = {}) => ({ id, seq, sender: 'me', creatAl: '2026-09-24T10:00:00Z', estatEnviament: 'enviat', ...extra });

describe('constants', () => {
  it('fixa la pàgina en 50 i tres reintents', () => {
    expect(LIMIT_PAGINA).toBe(50);
    expect(MAX_REINTENTS).toBe(3);
  });
});

describe('generaId', () => {
  it('torna un UUID v4 diferent cada vegada', () => {
    const a = generaId();
    const b = generaId();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(a).not.toBe(b);
  });
});

describe('mapejaFil', () => {
  it('dona nom, hores en ISO sense formatar i marques numèriques', () => {
    const fil = mapejaFil({
      id: 'f1', titol: null, altresNoms: ['Pepa', 'Toni'], ultimText: 'Hola', ultimAl: '2026-09-26T08:00:00Z',
      ultimSeq: '12', llegitFinsSeq: 10, llegitPelsAltresFinsSeq: 9, noLlegits: 2, ultimAutorId: 'u2'
    });
    expect(fil.name).toBe('Pepa, Toni');
    expect(fil.title).toBe(fil.name);
    expect(fil.ultimAl).toBe('2026-09-26T08:00:00Z');
    expect(fil).not.toHaveProperty('lastMessageTime');
    expect(fil).not.toHaveProperty('lastMessagePreview');
    expect(fil.ultimSeq).toBe(12);
    expect(fil.llegitFinsSeq).toBe(10);
    expect(fil.llegitPelsAltresFinsSeq).toBe(9);
    expect(fil.noLlegits).toBe(2);
    expect(fil.tipus).toBe('directe');
    expect(fil.searchText).toBe('pepa, toni hola');
  });

  it('deriva els no llegits si el servidor no els dona i llig els ajustos personals', () => {
    const ara = Date.parse('2026-09-27T00:00:00Z');
    const fil = mapejaFil({
      id: 'f2', titol: 'Grup', tipus: 'grup', altresNoms: [], ultimSeq: 8, llegitFinsSeq: 5,
      arxivatAl: '2026-09-01T00:00:00Z', fixatAl: null, preferitAl: '2026-09-02T00:00:00Z',
      silenciatFinsAl: '2026-09-28T00:00:00Z', noLlegitManual: true
    }, ara);
    expect(fil.noLlegits).toBe(3);
    expect(fil.arxivat).toBe(true);
    expect(fil.fixat).toBe(false);
    expect(fil.preferit).toBe(true);
    expect(fil.silenciat).toBe(true);
    expect(fil.noLlegitManual).toBe(true);
    expect(fil.tipus).toBe('grup');
  });

  it('cau a «Conversa» sense títol ni membres i no queda silenciat quan la data ha passat', () => {
    expect(mapejaFil({ id: 'f3', altresNoms: [] }).name).toBe('Conversa');
    expect(esSilenciat('2020-01-01T00:00:00Z', Date.parse('2026-01-01T00:00:00Z'))).toBe(false);
    expect(esSilenciat(null)).toBe(false);
    expect(esSilenciat('no és una data')).toBe(false);
  });

  it('T63.2 · passa comunitatId i subjecte tal qual i deriva esComunitat, esCanal i esGrup', () => {
    const subjecte = { tipus: 'entitat', id: 'org-1', ruta: '/empresa/org-1', titol: 'Cooperativa' };
    const comunitat = mapejaFil({ id: 'c', tipus: 'comunitat', titol: 'Cooperativa', comunitatId: null, subjecte });
    expect(comunitat).toMatchObject({ comunitatId: null, esComunitat: true, esCanal: false, esGrup: false, potEscriure: false });
    expect(comunitat.subjecte).toBe(subjecte);
    const avisos = mapejaFil({ id: 'a', tipus: 'canal', titol: 'Avisos', comunitatId: 'c', subjecte, rol: 'membre' });
    expect(avisos).toMatchObject({ comunitatId: 'c', esComunitat: false, esCanal: true, esGrup: false, potEscriure: false, rol: 'membre' });
    expect(mapejaFil({ id: 'a', tipus: 'canal', comunitatId: 'c', rol: 'admin' }).potEscriure).toBe(true);
    expect(mapejaFil({ id: 'a', tipus: 'canal', comunitatId: 'c', rol: 'propietari' }).potEscriure).toBe(true);
    const general = mapejaFil({ id: 'g', tipus: 'grup', titol: 'General', comunitatId: 'c', subjecte, participants: '7' });
    expect(general).toMatchObject({ esGrup: true, potEscriure: true, participants: 7, participant: true });
  });

  it('T63.2 · un fil sense els camps nous queda com abans: sense comunitat, sense subjecte i participant', () => {
    const fil = mapejaFil({ id: 'd', altresNoms: ['Pepa'] });
    expect(fil).toMatchObject({ comunitatId: null, subjecte: null, esComunitat: false, esCanal: false, esGrup: false,
      rol: null, potEscriure: true, participant: true, participants: null });
    expect(mapejaFil({ id: 'v', tipus: 'grup', participant: false }).participant).toBe(false);
  });
});

describe('agrupaComunitats (T67)', () => {
  const f = (id, tipus, extra = {}) => mapejaFil({ id, tipus, titol: id, altresNoms: [], ...extra });

  it('posa Avisos primer, després els grups per activitat, suma els no llegits i pren l’últim instant dels fills', () => {
    const fils = [
      f('general', 'grup', { comunitatId: 'coop', ultimAl: '2026-09-28T10:00:00Z', noLlegits: 2 }),
      f('coop', 'comunitat', { ultimAl: '2026-09-01T00:00:00Z' }),
      f('avisos', 'canal', { comunitatId: 'coop', ultimAl: '2026-09-20T10:00:00Z', noLlegits: 1 }),
      f('festes', 'grup', { comunitatId: 'coop', ultimAl: '2026-09-28T12:00:00Z', noLlegits: 3 }),
      f('pepa', 'directe', { ultimAl: '2026-09-28T13:00:00Z', noLlegits: 9 })
    ];
    const [coop, ...resta] = agrupaComunitats(fils);
    expect(resta).toEqual([]);
    expect(coop.fil.id).toBe('coop');
    expect(coop.fills.map((x) => x.id)).toEqual(['avisos', 'festes', 'general']);
    expect(coop.noLlegits).toBe(6);
    expect(coop.ultimAl).toBe('2026-09-28T12:00:00Z');
  });

  it('ordena les comunitats per activitat, admet una comunitat buida i ignora fills orfes', () => {
    const fils = [
      f('buida', 'comunitat', { ultimAl: '2026-09-02T00:00:00Z' }),
      f('poble', 'comunitat'),
      f('g-poble', 'grup', { comunitatId: 'poble', ultimAl: '2026-09-27T00:00:00Z' }),
      f('orfe', 'grup', { comunitatId: 'no-hi-es', ultimAl: '2026-09-28T00:00:00Z' })
    ];
    const comunitats = agrupaComunitats(fils);
    expect(comunitats.map((c) => c.fil.id)).toEqual(['poble', 'buida']);
    expect(comunitats[1]).toMatchObject({ fills: [], noLlegits: 0, ultimAl: null });
    expect(agrupaComunitats(null)).toEqual([]);
  });
});

describe('contactesFrequents (T68)', () => {
  const directe = (id, altre, ultimAl, extra = {}) => mapejaFil({
    id, tipus: 'directe', altresNoms: [altre.nom], altres: [altre], ultimAl, ...extra
  });
  const pepa = { id: 'pepa', nom: 'Pepa', tipus: 'persona', avatarUrl: '/p.png' };
  const toni = { id: 'toni', nom: 'Toni', tipus: 'persona', avatarUrl: null };

  it('torna els directes de més recent a més antic, sense repetir ni comptar-se una mateixa', () => {
    const fils = [
      directe('f-pepa-vell', pepa, '2026-09-20T00:00:00Z'),
      directe('f-toni', toni, '2026-09-27T00:00:00Z'),
      directe('f-pepa', pepa, '2026-09-28T00:00:00Z'),
      directe('f-jo', { id: 'jo', nom: 'Jo' }, '2026-09-28T09:00:00Z'),
      mapejaFil({ id: 'grup', tipus: 'grup', altres: [{ id: 'maria', nom: 'Maria' }], ultimAl: '2026-09-28T10:00:00Z' }),
      mapejaFil({ id: 'iaia', tipus: 'iaia', altres: [{ id: 'iaia', nom: 'IAIA' }], ultimAl: '2026-09-28T11:00:00Z' })
    ];
    expect(contactesFrequents(fils, null, 'jo')).toEqual([
      { usuari_id: 'pepa', nom: 'Pepa', tipus: 'persona', avatar_url: '/p.png', fil_id: 'f-pepa' },
      { usuari_id: 'toni', nom: 'Toni', tipus: 'persona', avatar_url: null, fil_id: 'f-toni' }
    ]);
  });

  it('amb el padró, només hi entren els qui encara hi són i amb les seues dades; talla a n', () => {
    const fils = [directe('f-pepa', pepa, '2026-09-28T00:00:00Z'), directe('f-toni', toni, '2026-09-27T00:00:00Z')];
    const padro = [{ usuari_id: 'toni', nom: 'Toni Pastor', tipus: 'persona', avatar_url: '/t.png', fil_id: 'f-toni' }];
    expect(contactesFrequents(fils, padro, 'jo')).toEqual([
      { usuari_id: 'toni', nom: 'Toni Pastor', tipus: 'persona', avatar_url: '/t.png', fil_id: 'f-toni' }
    ]);
    const molts = Array.from({ length: 8 }, (_, i) => directe(`f${i}`, { id: `p${i}`, nom: `P${i}` }, `2026-09-2${i}T00:00:00Z`));
    expect(contactesFrequents(molts, null, 'jo')).toHaveLength(5);
    expect(contactesFrequents(molts, null, 'jo', 2).map((c) => c.usuari_id)).toEqual(['p7', 'p6']);
    expect(contactesFrequents(molts, null, 'jo', 0)).toEqual([]);
    expect(contactesFrequents(null, null, 'jo')).toEqual([]);
  });
});

describe('mapejaMissatge', () => {
  it('decidix el costat amb joId i conserva seq, tipus, resposta i esborrat', () => {
    const meu = mapejaMissatge({ id: 'a', filId: 'f', usuariId: 'jo', text: 'hola', seq: 4, creatAl: '2026-09-24T10:00:00Z' }, 'jo');
    expect(meu.sender).toBe('me');
    expect(meu.author).toBe('Jo');
    expect(meu.seq).toBe(4);
    expect(meu.tipus).toBe('text');
    expect(meu.estatEnviament).toBe('enviat');
    const altre = mapejaMissatge({ id: 'b', filId: 'f', usuariId: 'ella', autorNom: 'Pepa', text: null, tipus: 'sistema', esborratAl: '2026-09-24T11:00:00Z', respostaA: 'a', esIA: true }, 'jo');
    expect(altre.sender).toBe('other');
    expect(altre.author).toBe('Pepa');
    expect(altre.text).toBe('');
    expect(altre.tipus).toBe('sistema');
    expect(altre.esborrat).toBe(true);
    expect(altre.respostaA).toBe('a');
    expect(altre.is_ai).toBe(true);
    expect(altre.seq).toBeNull();
  });
});

describe('fusionaPerSeq', () => {
  it('lleva duplicats per id, ordena per seq i deixa els sense seq al final', () => {
    const existents = [m('a', 1), m('b', 3), m('p', null, { creatAl: '2026-09-24T12:00:00Z' })];
    const nous = [m('c', 2), m('b', 3, { text: 'editat' })];
    const fusio = fusionaPerSeq(existents, nous);
    expect(fusio.map((x) => x.id)).toEqual(['a', 'c', 'b', 'p']);
    expect(fusio[2].text).toBe('editat');
    expect(seqMaxim(fusio)).toBe(3);
    expect(seqMinim(fusio)).toBe(1);
    expect(seqMaxim([])).toBeNull();
    expect(seqMinim([m('p', null)])).toBeNull();
  });
});

describe('derivaEstat i combinaMissatges', () => {
  it('pendent sense seq, enviat amb seq, llegit quan els altres han llegit fins a eixe seq', () => {
    expect(derivaEstat(m('a', null), 5)).toBe('pendent');
    expect(derivaEstat(m('a', 6), 5)).toBe('enviat');
    expect(derivaEstat(m('a', 5), 5)).toBe('llegit');
    expect(derivaEstat(m('a', 1, { sender: 'other' }), 0)).toBe('enviat');
    expect(derivaEstat(m('a', null, { estatEnviament: 'error' }), 9)).toBe('error');
  });

  it('estatDeLUltim: només per a l\'últim missatge propi del fil', () => {
    const fil = { ultimAutorId: 'jo', ultimSeq: 4, llegitPelsAltresFinsSeq: 3 };
    expect(estatDeLUltim(fil, 'jo')).toBe('enviat');
    expect(estatDeLUltim({ ...fil, llegitPelsAltresFinsSeq: 4 }, 'jo')).toBe('llegit');
    expect(estatDeLUltim(fil, 'altra')).toBeNull();
    expect(estatDeLUltim({ ...fil, ultimSeq: 0 }, 'jo')).toBeNull();
    expect(estatDeLUltim(fil, null)).toBeNull();
  });

  /* Regressió (auditoria de Codex 2150, C3): el rebut del port és el PROPI.
     Que JO haja rebut el meu missatge no diu res del destinatari. */
  it('el rebut propi mai es pinta com a «entregat» als altres', () => {
    const fil = mapejaFil({
      id: 'f', tipus: 'directe', ultimAutorId: 'jo', ultimSeq: 1, llegitFinsSeq: 1, rebutFinsSeq: 1, llegitPelsAltresFinsSeq: 0
    });
    expect(estatDeLUltim(fil, 'jo')).toBe('enviat');
    expect(combinaMissatges([m('a', 1)], [], 0).map((x) => x.estatEnviament)).toEqual(['enviat']);
  });

  it('posa els pendents al final i conserva la identitat dels objectes que no canvien', () => {
    const servidor = [m('a', 1), m('b', 2)];
    const pendents = [m('p', null, { estatEnviament: 'pendent' })];
    const resultat = combinaMissatges(servidor, pendents, 1);
    expect(resultat.map((x) => x.estatEnviament)).toEqual(['llegit', 'enviat', 'pendent']);
    expect(resultat[1]).toBe(servidor[1]);
  });
});

describe('no llegits i marques locals', () => {
  it('suma només les converses ni silenciades ni arxivades', () => {
    expect(sumaNoLlegits([
      { noLlegits: 2 }, { noLlegits: 3, silenciat: true }, { noLlegits: 4, arxivat: true }, { noLlegits: '1' }
    ])).toBe(3);
    expect(sumaNoLlegits([])).toBe(0);
  });

  it('aplicaMarcaLocal és monòtona i baixa els no llegits sense passar del que hi havia', () => {
    const fil = { id: 'f', ultimSeq: 10, llegitFinsSeq: 4, noLlegits: 6 };
    const a = aplicaMarcaLocal(fil, 7);
    expect(a.llegitFinsSeq).toBe(7);
    expect(a.noLlegits).toBe(3);
    expect(aplicaMarcaLocal(a, 5)).toBe(a);
    expect(aplicaMarcaLocal(a, 10).noLlegits).toBe(0);
  });

  it('actualitzaFilAmbMissatge puja ultimSeq i el text de la fila', () => {
    const fil = { id: 'f', name: 'Pepa', ultimSeq: 3, ultimText: 'abans', llegitFinsSeq: 3, noLlegits: 0 };
    const nou = actualitzaFilAmbMissatge(fil, m('x', 4, { text: 'després', usuariId: 'jo', creatAl: '2026-09-25T00:00:00Z' }));
    expect(nou.ultimSeq).toBe(4);
    expect(nou.ultimText).toBe('després');
    expect(nou.ultimAl).toBe('2026-09-25T00:00:00Z');
    expect(nou.ultimAutorId).toBe('jo');
    expect(nou.searchText).toBe('pepa després');
  });
});

describe('esperaReintent', () => {
  it('dobla la base a cada intent i afig fins a la mitat de la base com a component aleatori', () => {
    expect(esperaReintent(0, 0)).toBe(1000);
    expect(esperaReintent(0, 0.999999)).toBeLessThan(1500);
    expect(esperaReintent(1, 0)).toBe(2000);
    expect(esperaReintent(1, 0.5)).toBe(2500);
    expect(esperaReintent(2, 0)).toBe(4000);
    expect(esperaReintent(2, 0.999999)).toBeLessThan(6000);
    expect(esperaReintent(2, 0.999999)).toBeGreaterThanOrEqual(4000);
  });
});

describe('pendents', () => {
  it('afig, troba, actualitza, retira i lleva els confirmats pel servidor', () => {
    let mapa = afigPendent({}, 'f', m('p1', null, { estatEnviament: 'pendent' }));
    mapa = afigPendent(mapa, 'f', m('p2', null, { estatEnviament: 'pendent' }));
    expect(trobaPendent(mapa, 'p2')).toEqual({ filId: 'f', missatge: mapa.f[1] });
    expect(trobaPendent(mapa, 'zzz')).toBeNull();
    const ambError = actualitzaPendent(mapa, 'p1', { estatEnviament: 'error', error: 'xarxa' });
    expect(ambError.f[0].estatEnviament).toBe('error');
    expect(actualitzaPendent(mapa, 'zzz', {})).toBe(mapa);
    const sense = retiraPendent(ambError, 'p1');
    expect(sense.f.map((x) => x.id)).toEqual(['p2']);
    expect(retiraPendent(sense, 'zzz')).toBe(sense);
    expect(retiraConfirmats(sense, 'f', [m('p2', 8)])).toEqual({});
    expect(retiraConfirmats(sense, 'f', [m('altre', 8)])).toBe(sense);
    expect(retiraConfirmats(sense, 'g', [m('p2', 8)])).toBe(sense);
  });

  /* Decisió 1 del Mestre (261007) · «Bombolles del xat: S'HAN DE CONSERVAR».
     Una renovació del JWT avorta els enviaments en vol: passen a error amb el
     text i l'id intactes, i les que ja eren en error no es toquen. */
  it('interromEnviaments passa a error els pendents en vol i deixa la resta tal com estava', () => {
    let mapa = afigPendent({}, 'f', m('p1', null, { estatEnviament: 'pendent', text: 'en vol', respostaA: 'm-0', error: null }));
    mapa = afigPendent(mapa, 'f', m('p2', null, { estatEnviament: 'error', text: 'ja fallit', error: 'xarxa' }));
    mapa = afigPendent(mapa, 'g', m('p3', null, { estatEnviament: 'error', text: 'altre fil', error: 'xarxa' }));
    const interromput = interromEnviaments(mapa);
    expect(interromput.f[0]).toEqual({ ...mapa.f[0], estatEnviament: 'error', error: null });
    expect(interromput.f[1]).toBe(mapa.f[1]);
    expect(interromput.g).toBe(mapa.g);
    expect(trobaPendent(interromput, 'p1').missatge).toMatchObject({ id: 'p1', text: 'en vol', respostaA: 'm-0' });
    /* Sense cap en vol, el mateix mapa: cap render per a res. */
    expect(interromEnviaments(interromput)).toBe(interromput);
    expect(interromEnviaments({})).toEqual({});
  });
});

/* Auditoria 261007 (B) · Les comprovacions de «fins on» llegixen marcatFins
   (pendent, en vol o confirmada) després de buidar el temporitzador: amb cap
   marca pendent, és el valor confirmat o en vol que llegia `enviatFins`, un
   accessor que només cridaven estes proves i s'ha llevat. */
describe('creaAgrupadorMarques', () => {
  function rellotge() {
    const cua = [];
    return {
      temps: {
        setTimeout: (fn) => { cua.push(fn); return cua.length; },
        clearTimeout: (id) => { cua[id - 1] = null; }
      },
      dispara() {
        const pendents = cua.splice(0);
        pendents.forEach((fn) => fn && fn());
      },
      quants: () => cua.filter(Boolean).length
    };
  }

  it('envia una sola marca per conversa amb el seq més alt i mai cap arrere', () => {
    const envia = vi.fn();
    const r = rellotge();
    const agrupador = creaAgrupadorMarques(envia, 2000, r.temps);
    expect(agrupador.marca('f', 3)).toBe(true);
    expect(agrupador.marca('f', 5)).toBe(true);
    expect(agrupador.marca('f', 4)).toBe(false);
    expect(r.quants()).toBe(1);
    expect(envia).not.toHaveBeenCalled();
    r.dispara();
    expect(envia).toHaveBeenCalledTimes(1);
    expect(envia).toHaveBeenCalledWith('f', 5);
    expect(agrupador.marcatFins('f')).toBe(5);
    expect(agrupador.marca('f', 2)).toBe(false);
    expect(agrupador.marca('f', 5)).toBe(false);
    expect(r.quants()).toBe(0);
    expect(agrupador.marca('f', 6)).toBe(true);
    expect(agrupador.marca('g', 1)).toBe(true);
    r.dispara();
    expect(envia).toHaveBeenCalledTimes(3);
    expect(envia).toHaveBeenLastCalledWith('g', 1);
  });

  it('rebutja valors buits i cancela els temporitzadors pendents', () => {
    const envia = vi.fn();
    const r = rellotge();
    const agrupador = creaAgrupadorMarques(envia, 2000, r.temps);
    expect(agrupador.marca(null, 3)).toBe(false);
    expect(agrupador.marca('f', 0)).toBe(false);
    expect(agrupador.marca('f', 'no')).toBe(false);
    agrupador.marca('f', 3);
    agrupador.cancela();
    expect(r.quants()).toBe(0);
    r.dispara();
    expect(envia).not.toHaveBeenCalled();
    expect(agrupador.marcatFins('f')).toBe(0);
  });

  /* Auditoria 261007 (B) · Una marca fallida no queda com a enviada. */
  it('una marca que falla s’oblida: la mateixa lectura es torna a acceptar i a enviar', async () => {
    const envia = vi.fn().mockRejectedValueOnce(new Error('xarxa')).mockResolvedValue({ llegitFinsSeq: 15 });
    const r = rellotge();
    const agrupador = creaAgrupadorMarques(envia, 2000, r.temps);
    expect(agrupador.marca('f', 15)).toBe(true);
    expect(agrupador.marcatFins('f')).toBe(15);
    r.dispara();
    /* En vol: ni es repetix ni es deixa caure. */
    expect(agrupador.marca('f', 15)).toBe(false);
    expect(agrupador.marcatFins('f')).toBe(15);
    await Promise.resolve(); await Promise.resolve();
    expect(agrupador.marcatFins('f')).toBe(0);
    expect(agrupador.marca('f', 15)).toBe(true);
    r.dispara();
    expect(envia).toHaveBeenCalledTimes(2);
    expect(envia).toHaveBeenLastCalledWith('f', 15);
    await Promise.resolve(); await Promise.resolve();
    expect(agrupador.marcatFins('f')).toBe(15);
    expect(agrupador.marca('f', 15)).toBe(false);
  });

  it('una marca en vol que falla no esborra la confirmada ni una de més alta que ja vola', async () => {
    let falla;
    const envia = vi.fn()
      .mockResolvedValueOnce({})
      .mockReturnValueOnce(new Promise((_, rebutja) => { falla = rebutja; }))
      .mockResolvedValueOnce({});
    const r = rellotge();
    const agrupador = creaAgrupadorMarques(envia, 2000, r.temps);
    agrupador.marca('f', 5); r.dispara();
    await Promise.resolve(); await Promise.resolve();
    expect(agrupador.marcatFins('f')).toBe(5);
    agrupador.marca('f', 8); r.dispara();
    agrupador.marca('f', 9); r.dispara();
    falla(new Error('xarxa'));
    await Promise.resolve(); await Promise.resolve();
    expect(agrupador.marcatFins('f')).toBe(9);
    expect(agrupador.marca('f', 6)).toBe(false);
  });

  it('una resposta tardana d’abans de cancela no escriu res en l’àmbit nou', async () => {
    let resol;
    const envia = vi.fn().mockReturnValueOnce(new Promise((ok) => { resol = ok; }));
    const r = rellotge();
    const agrupador = creaAgrupadorMarques(envia, 2000, r.temps);
    agrupador.marca('f', 7); r.dispara();
    agrupador.cancela();
    resol({});
    await Promise.resolve(); await Promise.resolve();
    expect(agrupador.marcatFins('f')).toBe(0);
    expect(agrupador.marca('f', 7)).toBe(true);
  });

  it('un envia que llança de manera síncrona compta com a fallada', async () => {
    const envia = vi.fn(() => { throw new Error('síncron'); });
    const r = rellotge();
    const agrupador = creaAgrupadorMarques(envia, 2000, r.temps);
    agrupador.marca('f', 4); r.dispara();
    await Promise.resolve(); await Promise.resolve();
    expect(agrupador.marcatFins('f')).toBe(0);
    expect(agrupador.marca('f', 4)).toBe(true);
  });
});

/* Auditoria 261007 (B) · El sondeig de la llista no crida setFils si res no ha canviat. */
describe('filIgual i filsEquivalents', () => {
  const brut = (extra = {}) => ({
    id: 'f', titol: 'Pepa', altresNoms: ['Pepa'], altres: [{ id: 'P', nom: 'Pepa' }], subjecte: { tipus: 'pagina', id: '/mur' },
    ultimSeq: 3, llegitFinsSeq: 1, ...extra
  });

  it('dos mapejos de la mateixa fila són iguals encara que les llistes i el subjecte siguen objectes nous', () => {
    const ara = Date.UTC(2026, 9, 7);
    const a = mapejaFil(brut(), ara);
    const b = mapejaFil(brut(), ara);
    expect(a.altres).not.toBe(b.altres);
    expect(filIgual(a, b)).toBe(true);
    expect(filsEquivalents([a], [b])).toBe(true);
  });

  it('qualsevol camp que es pinta els fa diferents, també el silenci que caduca amb l’hora', () => {
    const ara = Date.UTC(2026, 9, 7);
    const base = mapejaFil(brut(), ara);
    expect(filIgual(base, mapejaFil(brut({ ultimSeq: 4 }), ara))).toBe(false);
    expect(filIgual(base, mapejaFil(brut({ altres: [{ id: 'P', nom: 'Pepa Soler' }] }), ara))).toBe(false);
    expect(filIgual(base, mapejaFil(brut({ subjecte: { tipus: 'pagina', id: '/mercat' } }), ara))).toBe(false);
    const silenciat = brut({ silenciatFinsAl: new Date(ara + 1000).toISOString() });
    expect(filIgual(mapejaFil(silenciat, ara), mapejaFil(silenciat, ara + 2000))).toBe(false);
    expect(filIgual(base, { ...base, extra: true })).toBe(false);
  });

  it('l’ordre i la llargària compten', () => {
    const ara = Date.UTC(2026, 9, 7);
    const a = mapejaFil(brut({ id: 'a' }), ara);
    const b = mapejaFil(brut({ id: 'b' }), ara);
    expect(filsEquivalents([a, b], [a, b])).toBe(true);
    expect(filsEquivalents([a, b], [b, a])).toBe(false);
    expect(filsEquivalents([a], [a, b])).toBe(false);
    expect(filsEquivalents([], [])).toBe(true);
    expect(filsEquivalents(null, [])).toBe(false);
  });
});
