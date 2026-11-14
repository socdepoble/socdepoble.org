// @vitest-environment node
/* Onada R24 · IDEA-260 (a), carril xat_ui (C1 i C2 de
   _investigacio_ia_de_poble/261114_r24_claude_botigues_i_consola_zero_kit/onada1/xat_duplicats.md,
   opció B triada per l'integrador) · La captura del Mestre del 14-11 04:28
   (261114_0428_captura_xat_duplicats_damia_sofia_alfredo_i_consola_404_chunks.png)
   tenia 12 files: Damià, Sofía i Alfredo dues vegades (el canal privat de
   Sóc de Poble, on el Mestre entra com a gestor, i el directe personal del
   «Connexió nova»), i dues files «Cap missatge.» (Alfredo dimarts i Luisfe
   diumenge) que ningú no havia escrit. L'accessori les reproduïx tal com les
   torna xat_fils_meus i les mapeja missatges.js. Una fila per persona (mai
   pel nom), cap canal d'entitat amagat (R21.8) i cap directe buit a la llista
   fins al primer missatge, llevat que siga el fil obert. */
import { describe, expect, test } from 'vitest';
import { mapejaFil } from './missatges.js';
import { IAIA_ID } from '../../data/identitatsSeed.js';
import { clauDePersona, esDirecteBuit, identitatsDeLaFila, unaFilaPerPersona } from './unaFilaPerPersona.js';

const ARA = Date.parse('2026-11-14T04:28:00Z');
const SDP = { entitatId: 'org-sdp', entitatNom: 'Sóc de Poble' };
const persona = (id, nom) => ({ id, nom, tipus: 'persona' });

/* Un fil com el torna xat_fils_meus (adaptador remot) i el mapeja missatges.js. */
function fil({ id, qui, nom, al, text = null, seq = text ? 1 : 0, entitat = false, ...resta }) {
  return mapejaFil({
    id,
    tipus: 'directe',
    titol: null,
    altres: [persona(qui, nom)],
    altresNoms: [nom],
    ...(entitat ? { ...SDP, comEntitat: true } : {}),
    ultimText: text,
    ultimAl: text ? al : null,
    actualitzatAl: al,
    ultimAutorId: text ? 'jo' : null,
    ultimSeq: seq,
    llegitFinsSeq: seq,
    ...resta
  }, ARA);
}

const instantDe = (valor) => {
  const t = new Date(valor || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
};
/* La mateixa forma que les files de XatSection (memo `files`), ja ordenades. */
const filaDe = (f) => ({ clau: String(f.id), tipus: 'fil', fil: f, fixat: Boolean(f.fixat), instant: instantDe(f.ultimAl) });
const ordena = (files) => [...files].sort((a, b) => (Number(b.fixat) - Number(a.fixat)) || (b.instant - a.instant));

/* Les 12 files de la captura, de dalt a baix. */
function filsDeLaCaptura(extra = {}) {
  return [
    fil({ id: 'c-damia', qui: 'damia', nom: 'Damià Llorens Jordà', al: '2026-11-12T19:10:00Z', text: 'Hola amic! Em veus la foto?', entitat: true, ...extra['c-damia'] }),
    fil({ id: 'c-sofia', qui: 'sofia', nom: 'Sofía Bornay', al: '2026-11-12T19:00:00Z', text: 'Hola Sofia!!! Pots veure el xat?', entitat: true, ...extra['c-sofia'] }),
    fil({ id: 'c-alfredo', qui: 'alfredo', nom: 'Alfredo Llorens', al: '2026-11-10T10:00:00Z', entitat: true }),
    fil({ id: 'c-luisfe', qui: 'luisfe', nom: 'Luisfe', al: '2026-11-08T10:00:00Z', entitat: true }),
    fil({ id: 'd-nando', qui: 'nando', nom: 'Nando Llinares', al: '2026-11-07T12:00:00Z', text: 'Ifufi' }),
    fil({ id: 'd-anna', qui: 'anna', nom: 'Anna Calvo', al: '2026-11-05T12:00:00Z', text: 'Connexió nova: m’he connectat amb tu a Sóc de Poble.' }),
    fil({ id: 'd-pep', qui: 'pep', nom: 'Pep c', al: '2026-11-03T20:58:00Z', text: 'Connexió nova: m’he connectat amb tu a Sóc de Poble.' }),
    fil({ id: 'd-diego', qui: 'diego', nom: 'Diego Baldo', al: '2026-11-03T20:57:30Z', text: 'Connexió nova: m’he connectat amb tu a Sóc de Poble.' }),
    fil({ id: 'd-sofia', qui: 'sofia', nom: 'Sofía Bornay', al: '2026-11-03T20:57:00Z', text: 'Connexió nova: m’he connectat amb tu a Sóc de Poble.', ...extra['d-sofia'] }),
    fil({ id: 'd-alfredo', qui: 'alfredo', nom: 'Alfredo Llorens', al: '2026-11-03T20:56:30Z', text: 'Connexió nova: m’he connectat amb tu a Sóc de Poble.' }),
    fil({ id: 'd-damia', qui: 'damia', nom: 'Damià Llorens Jordà', al: '2026-11-03T20:56:00Z', text: 'Connexió nova: m’he connectat amb tu a Sóc de Poble.', ...extra['d-damia'] }),
    fil({ id: 'd-carmen', qui: 'carmen', nom: 'Carmen Chabrera', al: '2026-11-03T20:55:00Z', text: 'Connexió nova: m’he connectat amb tu a Sóc de Poble.' })
  ];
}
const filesDeLaCaptura = (extra) => ordena(filsDeLaCaptura(extra).map(filaDe));
const claus = (files) => files.map((fila) => fila.clau);
const nomsDe = (files) => files.map((fila) => fila.fil.name);

describe('IDEA-260 (a) · la captura del Mestre: una fila per persona i cap directe buit', () => {
  /* R24 · Gauntlet (G-client-11) · Abans, C2 amagava també els canals d'entitat
     buits (c-alfredo, c-luisfe). La regla R21.8.3 del Mestre, «mai s'oculten
     fils comEntitat», mana: el d'Alfredo es plega a la seua fila i el de
     Luisfe es llista sol. Només s'amaguen els directes personals buits. */
  test('les 12 files de la captura queden en 9: Damià, Sofía i Alfredo una sola vegada; els canals d’entitat buits es queden (R21.8.3)', () => {
    const abans = filesDeLaCaptura();
    expect(abans).toHaveLength(12);
    expect(nomsDe(abans).filter((nom) => nom === 'Damià Llorens Jordà')).toHaveLength(2);

    const despres = unaFilaPerPersona(abans);
    expect(claus(despres)).toEqual([
      'persona:damia', 'persona:sofia', 'persona:alfredo', 'c-luisfe', 'd-nando', 'd-anna', 'd-pep', 'd-diego', 'd-carmen'
    ]);
    for (const nom of ['Damià Llorens Jordà', 'Sofía Bornay', 'Alfredo Llorens']) {
      expect(nomsDe(despres).filter((n) => n === nom)).toHaveLength(1);
    }
    expect(nomsDe(despres)).toContain('Luisfe');
    /* La fila d'Alfredo la representa el directe amb missatges, no el canal buit. */
    expect(despres[2].fil.id).toBe('d-alfredo');
    expect(despres[2].canals.map((c) => c.id)).toEqual(['c-alfredo', 'd-alfredo']);
  });

  /* Onada R24 · Elephant P2 (CA-3) · Abans, «…l’obri (P-2)…»: la fila de
     Damià, sense cap no llegit, la representava el canal de Sóc de Poble (el
     més recent, 'c-damia', «Hola amic! Em veus la foto?»), i prémer-la posava
     el Mestre a escriure com a entitat. Ara la representa el directe personal.
     La posició a la llista no canvia: la de la més recent. */
  test('la fila plegada va al lloc de la més recent, sense no llegits obri el directe personal (CA-3) i conserva tots els canals (R21.8: cap canal amagat)', () => {
    const [damia, sofia] = unaFilaPerPersona(filesDeLaCaptura());
    expect(damia.tipus).toBe('fil');
    expect(damia.clau).toBe('persona:damia');
    expect(damia.fil.id).toBe('d-damia');
    expect(damia.fil.ultimText).toBe('Connexió nova: m’he connectat amb tu a Sóc de Poble.');
    expect(sofia.fil.id).toBe('d-sofia');
    expect(damia.canals.map((c) => c.id)).toEqual(['c-damia', 'd-damia']);
    expect(sofia.canals.map((c) => c.id)).toEqual(['c-sofia', 'd-sofia']);
    expect(identitatsDeLaFila(damia.canals, damia.fil.id).map(({ clau, nom }) => [clau, nom])).toEqual([
      ['personal', null],
      ['entitat:org-sdp', 'Sóc de Poble']
    ]);
  });

  test('amb el directe personal de Damià obert (com a la captura), la fila el representa, al mateix lloc', () => {
    const files = unaFilaPerPersona(filesDeLaCaptura(), { obert: 'd-damia' });
    expect(claus(files)[0]).toBe('persona:damia');
    expect(files[0].fil.id).toBe('d-damia');
    expect(files[0].canals.map((c) => c.id)).toEqual(['c-damia', 'd-damia']);
    expect(files).toHaveLength(9);
  });

  test('un directe buit es llista si és el fil obert: el d’Alfredo es plega amb el seu personal; el de Luisfe, sol', () => {
    const ambAlfredo = unaFilaPerPersona(filesDeLaCaptura(), { obert: 'c-alfredo' });
    expect(claus(ambAlfredo)).toEqual([
      'persona:damia', 'persona:sofia', 'persona:alfredo', 'c-luisfe', 'd-nando', 'd-anna', 'd-pep', 'd-diego', 'd-carmen'
    ]);
    expect(ambAlfredo[2].fil.id).toBe('c-alfredo');
    expect(ambAlfredo[2].canals.map((c) => c.id)).toEqual(['c-alfredo', 'd-alfredo']);

    const ambLuisfe = unaFilaPerPersona(filesDeLaCaptura(), { obert: 'c-luisfe' });
    expect(claus(ambLuisfe)).toContain('c-luisfe');
    expect(ambLuisfe.find((fila) => fila.clau === 'c-luisfe').canals).toBeUndefined();
  });

  test('els no llegits se sumen, i la fila és fixada, preferida o marcada a mà si ho és algun dels seus canals', () => {
    const files = unaFilaPerPersona(filesDeLaCaptura({
      'c-damia': { ultimSeq: 4, llegitFinsSeq: 2 },
      'd-damia': { ultimSeq: 5, llegitFinsSeq: 2, fixatAl: '2026-11-04T00:00:00Z', preferitAl: '2026-11-04T00:00:00Z' },
      'd-sofia': { noLlegitManual: true }
    }));
    const damia = files.find((fila) => fila.clau === 'persona:damia');
    expect(damia.fil.noLlegits).toBe(5);
    expect(damia.fil.fixat).toBe(true);
    expect(damia.fixat).toBe(true);
    expect(damia.fil.preferit).toBe(true);
    expect(files[0]).toBe(damia);
    const sofia = files.find((fila) => fila.clau === 'persona:sofia');
    expect(sofia.fil.noLlegitManual).toBe(true);
    /* Onada R24 · Elephant P2 (CA-3) · Abans 'c-sofia' (el més recent): cap
       canal de Sofía no porta no llegits comptats, i ara guanya el personal. */
    expect(sofia.fil.id).toBe('d-sofia');
    /* Damià sí que en porta: els no llegits continuen manant (G-client-4), i
       el més recent amb no llegits és el canal de Sóc de Poble. */
    expect(damia.fil.id).toBe('c-damia');
  });

  /* Onada R24 · Elephant P2 (CA-3) · L'ordre sencer del representant: el fil
     obert; el canal no silenciat amb no llegits més recent; el PERSONAL (amb
     missatges i, si no, qualsevol); i només sense cap personal, el més recent
     amb missatges i el més recent. */
  test('CA-3 · el representant: obert → no llegits → personal → més recent amb missatges → més recent', () => {
    const canalAmbNoLlegits = unaFilaPerPersona(filesDeLaCaptura({ 'c-damia': { ultimSeq: 3, llegitFinsSeq: 1 } }));
    expect(canalAmbNoLlegits[0].fil.id).toBe('c-damia');
    const personalAmbNoLlegits = unaFilaPerPersona(filesDeLaCaptura({ 'd-damia': { ultimSeq: 3, llegitFinsSeq: 1 } }));
    expect(personalAmbNoLlegits[0].fil.id).toBe('d-damia');
    /* Un canal silenciat amb no llegits no mana: sense cap altre no llegit, el personal. */
    const silenciat = unaFilaPerPersona(filesDeLaCaptura({ 'c-damia': { ultimSeq: 3, llegitFinsSeq: 1, silenciatFinsAl: '2099-01-01T00:00:00Z' } }));
    expect(silenciat[0].fil.id).toBe('d-damia');
    /* El fil obert sempre guanya, també el canal d'entitat sense no llegits. */
    expect(unaFilaPerPersona(filesDeLaCaptura(), { obert: 'c-damia' })[0].fil.id).toBe('c-damia');
    /* Sense cap canal personal (dues entitats amb la mateixa persona), com abans: el més recent amb missatges. */
    const duesEntitats = ordena([
      fil({ id: 'c-a', qui: 'x', nom: 'X', al: '2026-11-12T10:00:00Z', entitat: true, entitatId: 'org-a', entitatNom: 'A' }),
      fil({ id: 'c-b', qui: 'x', nom: 'X', al: '2026-11-11T10:00:00Z', text: 'Hola', entitat: true, entitatId: 'org-b', entitatNom: 'B' })
    ].map(filaDe));
    expect(unaFilaPerPersona(duesEntitats)[0].fil.id).toBe('c-b');
    /* A la safata d'arxivades (ambBuits), un personal buit també guanya un canal d'entitat amb missatges. */
    const arxivades = ordena([
      fil({ id: 'c-y', qui: 'y', nom: 'Y', al: '2026-11-12T10:00:00Z', text: 'Com a entitat', entitat: true }),
      fil({ id: 'd-y', qui: 'y', nom: 'Y', al: '2026-11-01T10:00:00Z' })
    ].map(filaDe));
    expect(unaFilaPerPersona(arxivades, { ambBuits: true })[0].fil.id).toBe('d-y');
  });

  test('la vista d’arxivades plega però conserva els buits (ambBuits)', () => {
    const files = unaFilaPerPersona(filesDeLaCaptura(), { ambBuits: true });
    expect(claus(files)).toEqual([
      'persona:damia', 'persona:sofia', 'persona:alfredo', 'c-luisfe', 'd-nando', 'd-anna', 'd-pep', 'd-diego', 'd-carmen'
    ]);
  });
});

describe('clauDePersona i esDirecteBuit · només un directe amb una sola persona, mai pel nom', () => {
  test('dos comptes homònims (ids diferents) no es pleguen mai', () => {
    const files = ordena([
      fil({ id: 'h1', qui: 'sofia-1', nom: 'Sofía Bornay', al: '2026-11-12T10:00:00Z', text: 'Una' }),
      fil({ id: 'h2', qui: 'sofia-2', nom: 'Sofía Bornay', al: '2026-11-11T10:00:00Z', text: 'Altra' })
    ].map(filaDe));
    expect(unaFilaPerPersona(files)).toBe(files);
  });

  test('un canal on qui mira és la clienta d’una entitat (altres = [entitat]) no té clau i no es plega', () => {
    const client = mapejaFil({
      id: 'cli', tipus: 'directe', altres: [{ id: 'org-sdp', nom: 'Sóc de Poble', tipus: 'entitat' }], altresNoms: ['Sóc de Poble'],
      entitatId: 'org-sdp', entitatNom: 'Sóc de Poble', comEntitat: false, ultimText: 'Hola', ultimAl: '2026-11-12T10:00:00Z', ultimSeq: 1
    }, ARA);
    expect(clauDePersona(client)).toBeNull();
    const files = ordena([client, fil({ id: 'p', qui: 'org-sdp', nom: 'Sóc de Poble', al: '2026-11-11T10:00:00Z', text: 'x' })].map(filaDe));
    expect(unaFilaPerPersona(files)).toBe(files);
  });

  test('la IAIA, el fil propi, les files per defecte, les pàgines, els grups i els canals no tenen clau ni s’amaguen buits', () => {
    const iaia = mapejaFil({ id: 'ia', tipus: 'directe', altres: [persona(IAIA_ID, 'IAIA MarIA')], altresNoms: ['IAIA MarIA'], ultimSeq: 0 }, ARA);
    const iaia2 = mapejaFil({ id: 'ia2', tipus: 'directe', altres: [persona(IAIA_ID, 'IAIA MarIA')], altresNoms: ['IAIA MarIA'], ultimSeq: 0, ...SDP, comEntitat: true }, ARA);
    const propi = mapejaFil({ id: 'jo-propi', tipus: 'directe', esPropi: true, altres: [persona('jo', 'Javi')], ultimSeq: 0 }, ARA);
    const perDefecte = mapejaFil({ id: 'per-defecte:javi', tipus: 'directe', perDefecte: 'javi', altres: [persona('javi', 'Javi Llinares')], ultimSeq: 0 }, ARA);
    const pagina = mapejaFil({ id: 'pg', tipus: 'directe', subjecte: { tipus: 'pagina', id: '/mur', titol: 'Mur' }, altres: [persona('damia', 'Damià')], ultimSeq: 0 }, ARA);
    const grup = mapejaFil({ id: 'g', tipus: 'grup', altres: [persona('damia', 'Damià')], ultimSeq: 0 }, ARA);
    const canal = mapejaFil({ id: 'k', tipus: 'canal', altres: [persona('damia', 'Damià')], ultimSeq: 0 }, ARA);
    for (const f of [iaia, iaia2, propi, perDefecte, pagina, grup, canal]) {
      expect(clauDePersona(f)).toBeNull();
      expect(esDirecteBuit(f)).toBe(false);
    }
    const files = [iaia, iaia2, propi, perDefecte, pagina, grup, canal].map(filaDe);
    expect(unaFilaPerPersona(files)).toBe(files);
  });

  test('un directe amb dues persones o amb missatges no és buit; ultimSeq absent (accessoris vells) tampoc', () => {
    expect(esDirecteBuit(fil({ id: 'b', qui: 'x', nom: 'X', al: '2026-11-10T10:00:00Z' }))).toBe(true);
    expect(esDirecteBuit(fil({ id: 'm', qui: 'x', nom: 'X', al: '2026-11-10T10:00:00Z', text: 'Hola' }))).toBe(false);
    expect(esDirecteBuit({ ...fil({ id: 'f', qui: 'x', nom: 'X', al: '2026-11-10T10:00:00Z' }), ultimTipus: 'imatge' })).toBe(false);
    expect(esDirecteBuit({ id: 'vell', tipus: 'directe', name: 'Vell' })).toBe(false);
    /* R24 · G-client-11 · R21.8.3: un canal on qui mira actua com a entitat no és mai «buit» que s'amague. */
    expect(esDirecteBuit(fil({ id: 'e', qui: 'x', nom: 'X', al: '2026-11-10T10:00:00Z', entitat: true }))).toBe(false);
    expect(clauDePersona({ ...fil({ id: 'dos', qui: 'x', nom: 'X', al: '2026-11-10T10:00:00Z' }), altres: [persona('x', 'X'), persona('y', 'Y')] })).toBeNull();
  });

  test('sense res a plegar ni a amagar, la mateixa referència (com anteposaActors)', () => {
    const files = ordena([
      fil({ id: 'a', qui: 'a', nom: 'A', al: '2026-11-12T10:00:00Z', text: 'x' }),
      fil({ id: 'b', qui: 'b', nom: 'B', al: '2026-11-11T10:00:00Z', text: 'y' })
    ].map(filaDe));
    expect(unaFilaPerPersona(files)).toBe(files);
    expect(unaFilaPerPersona(files, { obert: 'a' })).toBe(files);
    expect(unaFilaPerPersona(null)).toBeNull();
  });
});

describe('identitatsDeLaFila · una identitat per canal, en ordre fix', () => {
  test('menys de dues identitats, cap; dos directes personals (duplicat latent CA-4) fan una sola «Personal», la del fil obert', () => {
    const [a] = filsDeLaCaptura();
    expect(identitatsDeLaFila(null, 'x')).toEqual([]);
    expect(identitatsDeLaFila([a], a.id)).toEqual([]);
    const p1 = fil({ id: 'p1', qui: 'x', nom: 'X', al: '2026-11-12T10:00:00Z', text: 'u' });
    const p2 = fil({ id: 'p2', qui: 'x', nom: 'X', al: '2026-11-11T10:00:00Z', text: 'd' });
    const sdp = fil({ id: 's', qui: 'x', nom: 'X', al: '2026-11-10T10:00:00Z', text: 's', entitat: true });
    /* Dos canals, però una sola identitat: res a triar, cap píndola ni selector. */
    expect(identitatsDeLaFila([p1, p2], 'p2')).toEqual([]);
    expect(identitatsDeLaFila([p1, p2, sdp], 'p2').map(({ clau, fil: f }) => [clau, f.id])).toEqual([['personal', 'p2'], ['entitat:org-sdp', 's']]);
    expect(identitatsDeLaFila([p1, p2, sdp], null).map(({ clau, fil: f }) => [clau, f.id])).toEqual([['personal', 'p1'], ['entitat:org-sdp', 's']]);
  });

  test('«Personal» primer i les entitats per nom, encara que l’últim missatge canvie l’ordre dels canals', () => {
    const personal = fil({ id: 'p', qui: 'x', nom: 'X', al: '2026-11-12T10:00:00Z', text: 'u' });
    const rentonar = { ...fil({ id: 'r', qui: 'x', nom: 'X', al: '2026-11-13T10:00:00Z', text: 'r', entitat: true }), entitatId: 'org-r', entitatNom: 'El Rentonar' };
    const sdp = fil({ id: 's', qui: 'x', nom: 'X', al: '2026-11-14T10:00:00Z', text: 's', entitat: true });
    expect(identitatsDeLaFila([sdp, rentonar, personal], 's').map(({ clau }) => clau)).toEqual(['personal', 'entitat:org-r', 'entitat:org-sdp']);
  });
});
