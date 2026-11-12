// @vitest-environment node
/* Arbre Genealògic · l'entrevista d'una pregunta per torn: ordre G4 → G1,
   validació, passos opcionals i repetibles, i aplicació idempotent a l'arbre
   sense deduir mai cap vincle per cognom. */
import { describe, expect, test } from 'vitest';
import { ANY, ARA, ARBRE_ID, arbre, comptador } from './__fixtures__/arbreSintetic.js';
import { IDIOMES } from './constants.js';
import { aplicaEntrevista, enrere, estatInicialEntrevista, pasActual, PASSOS_ENTREVISTA, progresEntrevista, respon, salta, treuResposta } from './entrevista.js';
import { arbreBuit, netejaEntrevista } from './model.js';
import { numeraSosa } from './sosa.js';
import { filtraVius } from './vius.js';

const opc = { anyActual: ANY, ara: ARA };
const persona = (nom, camps = {}) => ({ nom, cognom1: '', cognom2: '', naixement: '', lloc: '', ofici: '', difunta: false, ...camps });

function responTot(passos) {
  let estat = estatInicialEntrevista(ARBRE_ID);
  for (const valor of passos) {
    const r = respon(estat, valor, opc);
    expect(r.errors).toEqual([]);
    estat = r.estat;
  }
  return estat;
}

describe('els passos', () => {
  test('una sola pregunta per pas, en 5 llengües, i l’ordre G4 → G3 → G2 → G1', () => {
    expect(PASSOS_ENTREVISTA.map((p) => p.id)).toEqual(['casa', 'lloc', 'g4-jo', 'g4-germa', 'g3-pare', 'g3-mare', 'g2-pare-pare', 'g2-mare-pare', 'g2-pare-mare', 'g2-mare-mare', 'g1-besavi', 'font']);
    for (const pas of PASSOS_ENTREVISTA) {
      for (const camp of ['pregunta', 'ajuda', 'exemple']) expect(Object.keys(pas[camp]).sort()).toEqual([...IDIOMES].sort());
      for (const idioma of IDIOMES) expect(pas.pregunta[idioma].split('?').length - 1).toBeLessThanOrEqual(2);
    }
    expect(PASSOS_ENTREVISTA.map((p) => p.generacio)).toEqual(['CASA', 'LLOC', 'G4', 'G4', 'G3', 'G3', 'G2', 'G2', 'G2', 'G2', 'G1', 'FONT']);
  });
});

describe('respon, salta i enrere', () => {
  test('flux bàsic, sense mutar', () => {
    const inicial = estatInicialEntrevista(ARBRE_ID);
    const r = respon(inicial, 'Ca la Prova', opc);
    expect(r.ok).toBe(true);
    expect(inicial.pas).toBe(0);
    expect(pasActual(r.estat).id).toBe('lloc');
    expect(r.estat.respostes.casa).toBe('Ca la Prova');
    expect(progresEntrevista(r.estat)).toEqual({ fet: 1, total: 12, generacio: 'LLOC' });
    expect(enrere(r.estat).pas).toBe(0);
  });

  test('pas obligatori, data invàlida i nom buit', () => {
    let estat = salta(salta(estatInicialEntrevista(ARBRE_ID)));
    expect(pasActual(estat).id).toBe('g4-jo');
    expect(salta(estat)).toBe(estat);
    expect(respon(estat, '', opc)).toMatchObject({ ok: false, errors: [{ camp: 'valor', clau: 'obligatori' }] });
    expect(respon(estat, persona('Anna', { naixement: '1978-13' }), opc).errors).toEqual([{ camp: 'naixement', clau: 'rang' }]);
    expect(respon(estat, persona(''), opc).errors).toEqual([{ camp: 'nom', clau: 'obligatori' }]);
    expect(respon(estat, { nom: { x: 1 } }, opc).errors).toEqual([{ camp: 'nom', clau: 'invalid' }]);
    estat = respon(estat, persona('Anna', { naixement: '1978' }), opc).estat;
    expect(pasActual(estat).id).toBe('g4-germa');
  });

  test('pas repetible: s’afig i es queda; el buit passa al següent; treuResposta', () => {
    let estat = responTot(['', '', persona('Anna')]);
    estat = respon(estat, persona('Germà 1'), opc).estat;
    estat = respon(estat, persona('Germà 2'), opc).estat;
    expect(pasActual(estat).id).toBe('g4-germa');
    expect(estat.respostes['g4-germa'].map((g) => g.nom)).toEqual(['Germà 1', 'Germà 2']);
    expect(treuResposta(estat, 'g4-germa', 0).respostes['g4-germa'].map((g) => g.nom)).toEqual(['Germà 2']);
    estat = respon(estat, null, opc).estat;
    expect(pasActual(estat).id).toBe('g3-pare');
  });

  test('el besavi ha de dir de quin iaio és fill, i eixe iaio ha d’estar respost', () => {
    const estat = responTot(['', '', persona('Anna'), '', persona('Pare'), '', persona('Iaio'), '', '', '']);
    expect(pasActual(estat).id).toBe('g1-besavi');
    expect(respon(estat, persona('Besavi'), opc).errors).toEqual([{ camp: 'fillDe', clau: 'obligatori' }]);
    expect(respon(estat, persona('Besavi', { fillDe: 'g2-mare-mare' }), opc).errors).toEqual([{ camp: 'fillDe', clau: 'sense-progenitor' }]);
    expect(respon(estat, persona('Besavi', { fillDe: 'g2-pare-pare' }), opc).ok).toBe(true);
  });

  test('la font és una opció tancada, i en acabar no hi ha més preguntes', () => {
    let estat = responTot(['', '', persona('Anna'), '', '', '', '', '', '', '', '']);
    expect(pasActual(estat).id).toBe('font');
    expect(respon(estat, 'rumor', opc).errors).toEqual([{ camp: 'valor', clau: 'opcio' }]);
    estat = respon(estat, 'oral', opc).estat;
    expect(estat.completada).toBe(true);
    expect(pasActual(estat)).toBeNull();
    expect(respon(estat, 'oral', opc).ok).toBe(false);
    expect(progresEntrevista(estat)).toEqual({ fet: 12, total: 12, generacio: 'FI' });
    expect(netejaEntrevista(estat)).toEqual(estat);
  });
});

describe('aplicaEntrevista', () => {
  const respostesCompletes = (font = 'oral') => responTot([
    'Ca la Prova', 'Mas de la Prova',
    persona('Anna', { cognom1: 'Prova', cognom2: 'Exemple', naixement: '1978' }),
    persona('Germà', { cognom1: 'Prova' }), null,
    persona('Pare', { cognom1: 'Prova', naixement: '~1950' }),
    persona('Mare', { cognom1: 'Exemple', naixement: '1952?' }),
    persona('Iaio', { cognom1: 'Prova', naixement: '1920s', difunta: true }), null, null, null,
    persona('Besavi', { cognom1: 'Prova', fillDe: 'g2-pare-pare', sexe: 'M' }), null,
    font
  ]);

  test('crea persones aproximades, vincles progenitor i parella, i l’arrel', () => {
    const estat = respostesCompletes();
    const c = aplicaEntrevista(estat, arbreBuit(arbre()), { nouId: comptador(), ara: ARA, anyActual: ANY });
    const perOrigen = new Map(c.persones.map((p) => [p.origen, p]));
    expect([...perOrigen.keys()].sort()).toEqual(['entrevista:g1-besavi:0', 'entrevista:g2-pare-pare', 'entrevista:g3-mare', 'entrevista:g3-pare', 'entrevista:g4-germa:0', 'entrevista:g4-jo']);
    const jo = perOrigen.get('entrevista:g4-jo');
    expect(jo).toMatchObject({ viva: 'si', estat: 'aproximat', generacio: 'G4', casa: 'Ca la Prova', cognom2: 'Exemple' });
    expect(perOrigen.get('entrevista:g3-pare')).toMatchObject({ sexe: 'M', naixement: { precisio: 'aproximada', any: 1950 } });
    expect(perOrigen.get('entrevista:g3-mare')).toMatchObject({ sexe: 'F', naixement: { precisio: 'estimada', any: 1952 } });
    expect(perOrigen.get('entrevista:g2-pare-pare')).toMatchObject({ viva: 'no', naixement: { precisio: 'aproximada', any: 1925 } });
    expect(perOrigen.get('entrevista:g4-germa:0').casa).toBe('');
    expect(c.arbre).toMatchObject({ arrelId: jo.id, malnomCasa: 'Ca la Prova', poble: 'Mas de la Prova' });
    const nom = (id) => c.persones.find((p) => p.id === id).nom;
    const vincles = c.relacions.map((r) => `${r.tipus}:${nom(r.de)}>${nom(r.a)}:${r.estat}`).sort();
    expect(vincles).toEqual([
      'parella:Pare>Mare:aproximat',
      'progenitor:Besavi>Iaio:aproximat',
      'progenitor:Iaio>Pare:aproximat',
      'progenitor:Mare>Anna:aproximat',
      'progenitor:Mare>Germà:aproximat',
      'progenitor:Pare>Anna:aproximat',
      'progenitor:Pare>Germà:aproximat'
    ]);
    expect(c.entrevista).toBe(estat);
    const sosa = numeraSosa(c, jo.id);
    expect(sosa.perPersona.get(perOrigen.get('entrevista:g2-pare-pare').id)).toEqual([4]);
    expect(sosa.perPersona.get(perOrigen.get('entrevista:g1-besavi:0').id)).toEqual([8]);
  });

  test('Cognom ≠ Parentiu: mai enllaça per cognom', () => {
    const estat = responTot(['', '', persona('Anna', { cognom1: 'Prova' }), null, null, null, persona('Iaio', { cognom1: 'Prova' })]);
    const c = aplicaEntrevista(estat, arbreBuit(arbre()), { nouId: comptador(), ara: ARA, anyActual: ANY });
    expect(c.persones).toHaveLength(2);
    expect(c.relacions).toEqual([]);
  });

  test('idempotent; la resposta «document» sense cap font no confirma cap vincle', () => {
    const nouId = comptador();
    const primer = aplicaEntrevista(respostesCompletes(), arbreBuit(arbre()), { nouId, ara: ARA, anyActual: ANY });
    const segon = aplicaEntrevista(respostesCompletes(), primer, { nouId, ara: ARA, anyActual: ANY });
    expect(segon.persones).toEqual(primer.persones);
    expect(segon.relacions).toEqual(primer.relacions);
    const document = aplicaEntrevista(respostesCompletes('document'), primer, { nouId, ara: ARA, anyActual: ANY });
    expect(document.relacions.map((r) => r.id)).toEqual(primer.relacions.map((r) => r.id));
    expect(new Set(document.relacions.map((r) => r.estat))).toEqual(new Set(['aproximat']));
    expect(document.relacions.every((r) => r.evidencia.fontEscrita === false && r.fontIds.length === 0)).toBe(true);
    /* Tampoc des de zero: cap vincle G1 (ni cap altre) ix [CONFIRMAT]. */
    const nou = aplicaEntrevista(respostesCompletes('document'), arbreBuit(arbre()), { nouId: comptador(), ara: ARA, anyActual: ANY });
    expect(nou.relacions.some((r) => r.estat === 'confirmat')).toBe(false);
  });

  test('una font escrita apuntada després a l’editor es conserva en reaplicar', () => {
    const nouId = comptador();
    const primer = aplicaEntrevista(respostesCompletes(), arbreBuit(arbre()), { nouId, ara: ARA, anyActual: ANY });
    const ambFont = {
      ...primer,
      relacions: primer.relacions.map((r, i) => (i === 0 ? { ...r, evidencia: { ...r.evidencia, fontEscrita: true }, estat: 'confirmat' } : r))
    };
    const despres = aplicaEntrevista(respostesCompletes('document'), ambFont, { nouId, ara: ARA, anyActual: ANY });
    expect(despres.relacions[0]).toMatchObject({ estat: 'confirmat', evidencia: { fontEscrita: true } });
  });

  test('viu, ha mort o no ho sé: la resposta es conserva i protegix una iaia centenària viva', () => {
    const estat = responTot([
      '', '', persona('Anna', { naixement: '1978' }), null, null, null,
      persona('Iaio', { naixement: '1924', viva: 'no' }),
      persona('Iaia', { naixement: '1926', viva: 'si' }),
      persona('Iaio matern', { naixement: '1920' }), null, null, 'oral'
    ]);
    const c = aplicaEntrevista(estat, arbreBuit(arbre()), { nouId: comptador(), ara: ARA, anyActual: ANY });
    const perOrigen = new Map(c.persones.map((p) => [p.origen, p]));
    expect(perOrigen.get('entrevista:g4-jo').viva).toBe('si');
    expect(perOrigen.get('entrevista:g2-pare-pare').viva).toBe('no');
    expect(perOrigen.get('entrevista:g2-mare-pare').viva).toBe('si');
    expect(perOrigen.get('entrevista:g2-pare-mare').viva).toBe('desconegut');
    /* 2026 - 1926 = 100 anys: sense el «viu», la regla dels 100 anys la deixaria eixir. */
    const { idsOcults } = filtraVius(c, { anyActual: ANY });
    expect(idsOcults).toContain(perOrigen.get('entrevista:g2-mare-pare').id);
    expect(idsOcults).not.toContain(perOrigen.get('entrevista:g2-pare-pare').id);
    /* Reaplicar no perd el «viu». */
    const segon = aplicaEntrevista(estat, c, { nouId: comptador(), ara: ARA, anyActual: ANY });
    expect(segon.persones.find((p) => p.origen === 'entrevista:g2-mare-pare').viva).toBe('si');
  });

  test('una resposta antiga amb la casella difunta es llig com a «ha mort»', () => {
    const estat = responTot(['', '', persona('Anna'), null, persona('Pare', { difunta: true })]);
    expect(estat.respostes['g3-pare']).toMatchObject({ viva: 'no', difunta: true });
    expect(respon(estat, persona('Mare', { viva: 'potser' }), opc).errors).toEqual([{ camp: 'viva', clau: 'invalid' }]);
  });

  test('amb nomesPasId, els canvis fets a l’editor en altres passos es conserven', () => {
    const nouId = comptador();
    const primer = aplicaEntrevista(respostesCompletes(), arbreBuit(arbre()), { nouId, ara: ARA, anyActual: ANY });
    const editat = { ...primer, persones: primer.persones.map((p) => (p.origen === 'entrevista:g3-pare' ? { ...p, nom: 'Pere', estat: 'confirmat' } : p)) };
    const despres = aplicaEntrevista(respostesCompletes(), editat, { nouId, ara: ARA, anyActual: ANY, nomesPasId: 'font' });
    expect(despres.persones.find((p) => p.origen === 'entrevista:g3-pare')).toMatchObject({ nom: 'Pere', estat: 'confirmat' });
  });

  test('germans sense pares coneguts: relació germa', () => {
    const estat = responTot(['', '', persona('Anna'), persona('Germà')]);
    const c = aplicaEntrevista(estat, arbreBuit(arbre()), { nouId: comptador(), ara: ARA, anyActual: ANY });
    expect(c.relacions.map((r) => r.tipus)).toEqual(['germa']);
  });
});
