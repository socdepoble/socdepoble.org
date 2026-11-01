// @vitest-environment node
/* P1-12 pas 17 (pla 261101_1246, T7 · S5) · La taula de l'estat honest del
   xifratge per conversa: amb la bandera apagada, res; un text només on és cert
   (§13); número de seguretat només en un directe entre dues persones; cap
   interruptor per conversa. Les reserves són els valors valencians del
   diccionari i hi són a les cinc llengües. */
import { describe, expect, test } from 'vitest';
import { ambitDelFil } from '../../data/xifratXatAbast.js';
import { IAIA_UUID } from '../../config/xifratXat.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';
import { ESTAT_XIFRATGE, TEXTOS_XIFRATGE, estatXifratgeDelFil } from './estatXifratgeFil.js';

const PERSONA = '22222222-2222-4222-8222-222222222222';
const ORG = '99999999-9999-4999-8999-999999999999';
const abastDe = (fil, opcions) => ambitDelFil(fil, opcions);
const encés = (abast, entornSegur = true) => estatXifratgeDelFil({ actiu: true, abast, entornSegur });

describe('la correspondència abast → estat', () => {
  test('bandera apagada (o sense servei): apagat i invisible, siga quin siga el fil', () => {
    const directe = abastDe({ id: 'f1', tipus: 'directe', altres: [{ id: PERSONA, tipus: 'persona' }] });
    for (const actiu of [false, undefined, 'true', 1]) {
      expect(estatXifratgeDelFil({ actiu, abast: directe, entornSegur: true })).toMatchObject({ estat: ESTAT_XIFRATGE.apagat, visible: false, potVerificar: false, text: null });
    }
    expect(estatXifratgeDelFil()).toMatchObject({ estat: 'apagat', visible: false });
  });

  test('sense abast, en mode local o en un fil sintètic: no disponible i invisible', () => {
    expect(encés(null)).toMatchObject({ estat: ESTAT_XIFRATGE.noDisponible, visible: false });
    expect(encés(abastDe({ id: 'f1', tipus: 'directe' }, { modeDades: 'local' }))).toMatchObject({ estat: 'no-disponible', visible: false });
    expect(encés(abastDe({ id: 'fake-1', tipus: 'directe' }))).toMatchObject({ estat: 'no-disponible', visible: false });
  });

  test('públic i IAIA: visibles, diuen que no són xifrats d’extrem a extrem i no tenen número', () => {
    const canal = encés(abastDe({ id: 'f2', tipus: 'canal' }));
    expect(canal).toMatchObject({ estat: ESTAT_XIFRATGE.public, visible: true, potVerificar: false, text: TEXTOS_XIFRATGE.public });
    expect(CA[canal.text[0]]).toMatch(/no està xifrat d’extrem a extrem/);
    const pagina = encés(abastDe({ id: 'f3', tipus: 'grup', subjecte_tipus: 'pagina' }));
    expect(pagina.estat).toBe('public');
    const iaia = encés(abastDe({ id: 'f4', tipus: 'directe', altres: [{ id: IAIA_UUID, tipus: 'persona' }] }));
    expect(iaia).toMatchObject({ estat: ESTAT_XIFRATGE.iaia, visible: true, potVerificar: false, text: TEXTOS_XIFRATGE.iaia });
    /* Encara que l'entorn no puga xifrar, un xat públic és públic: el text no canvia. */
    expect(encés(abastDe({ id: 'f2', tipus: 'canal' }), false).estat).toBe('public');
  });

  test('bloquejats per l’abast (IAIA injectada, directe amb subjecte, fil desconegut, rebaixa apegalosa): canvi inesperat', () => {
    const casos = [
      abastDe({ id: 'f5', tipus: 'directe', altres: [{ id: IAIA_UUID }, { id: PERSONA }] }),
      abastDe({ id: 'f6', tipus: 'directe', subjecte_tipus: 'pagina', altres: [{ id: PERSONA, tipus: 'persona' }] }),
      abastDe(null),
      abastDe({ id: 'f7', tipus: 'canal', epocaActual: 2 })
    ];
    expect(casos.map((c) => c.motiu)).toEqual(['iaia-injectada', 'directe-amb-subjecte', 'fil-desconegut', 'rebaixa-apegalos']);
    for (const abast of casos) {
      expect(encés(abast)).toMatchObject({ estat: ESTAT_XIFRATGE.bloquejat, visible: true, potVerificar: false, text: TEXTOS_XIFRATGE.canviInesperat });
    }
    /* Un abast que no és xifrat però tampoc públic ni IAIA no promet res: bloquejat. */
    expect(encés({ xifrat: false, bloquejat: false, motiu: 'inventat', tipusFil: null }).estat).toBe('bloquejat');
  });

  test('abast xifrat en un entorn que no pot xifrar: sense primitives (cap «es xifren»)', () => {
    const directe = abastDe({ id: 'f8', tipus: 'directe', altres: [{ id: PERSONA, tipus: 'persona' }] });
    expect(encés(directe, false)).toMatchObject({ estat: ESTAT_XIFRATGE.sensePrimitives, visible: true, potVerificar: false, text: TEXTOS_XIFRATGE.sensePrimitives });
  });

  test('entitat: pendent de l’equip signat; grup privat: xifrat sense número; directe persona: xifrat amb número', () => {
    expect(encés(abastDe({ id: 'f9', tipus: 'directe', org_id: ORG, altres: [{ id: ORG, tipus: 'entitat' }] })))
      .toMatchObject({ estat: ESTAT_XIFRATGE.entitatPendent, potVerificar: false, text: TEXTOS_XIFRATGE.entitatPendent });
    expect(encés(abastDe({ id: 'f10', tipus: 'grup', altres: [{ id: PERSONA }] })))
      .toMatchObject({ estat: ESTAT_XIFRATGE.xifrat, visible: true, potVerificar: false, text: TEXTOS_XIFRATGE.avisFil, nota: TEXTOS_XIFRATGE.numero.grup });
    expect(encés(abastDe({ id: 'f11', tipus: 'directe', altres: [{ id: PERSONA, tipus: 'persona' }] })))
      .toMatchObject({ estat: ESTAT_XIFRATGE.xifrat, visible: true, potVerificar: true, text: TEXTOS_XIFRATGE.avisFil, nota: null });
    /* Les notes a una mateixa (personal): xifrades, però sense cap parell per a comparar.
       Gauntlet T7b-G07 · El seu text no demana comparar cap número. */
    const personal = encés(abastDe({ id: 'f12', tipus: 'personal' }));
    expect(personal).toMatchObject({ estat: 'xifrat', potVerificar: false, text: TEXTOS_XIFRATGE.avisFilPersonal, nota: null });
    expect(CA[personal.text[0]]).not.toMatch(/Comproveu el número/);
    expect(CA[personal.text[0]]).toMatch(/no hi ha cap número de seguretat que comparar/);
    /* Un directe xifrat amb un motiu que no és ni persona ni personal no promet res. */
    expect(encés({ xifrat: true, bloquejat: false, motiu: 'inventat', tipusFil: 'directe' }).estat).toBe('bloquejat');
  });

  test('la mateixa combinació torna el mateix objecte congelat (identitat estable entre pintades)', () => {
    const fil = { id: 'f11', tipus: 'directe', altres: [{ id: PERSONA, tipus: 'persona' }] };
    const una = encés(abastDe(fil));
    expect(encés(abastDe(fil))).toBe(una);
    expect(Object.isFrozen(una)).toBe(true);
  });
});

describe('els textos', () => {
  const parells = [];
  const recull = (objecte) => {
    for (const valor of Object.values(objecte)) {
      if (Array.isArray(valor)) parells.push(valor);
      else recull(valor);
    }
  };
  recull(TEXTOS_XIFRATGE);

  test('totes les claus són de section.xat.xifratge.* i la reserva és el valor valencià, idèntic', () => {
    expect(parells.length).toBe(21);
    for (const [clau, reserva] of parells) {
      expect(clau.startsWith('section.xat.xifratge.')).toBe(true);
      expect(CA[clau], clau).toBe(reserva);
    }
  });

  test('les cinc llengües tenen cada clau, amb un text propi fora del valencià i els mateixos marcadors', () => {
    const marcadors = (text) => (String(text).match(/\{\w+\}/g) || []).sort().join(',');
    for (const [clau] of parells) {
      for (const [codi, dic] of Object.entries({ es: ES, en: EN, eu: EU, gl: GL })) {
        expect(typeof dic[clau], `${codi} ${clau}`).toBe('string');
        expect(dic[clau], `${codi} ${clau}`).not.toBe(CA[clau]);
        expect(marcadors(dic[clau]), `${codi} ${clau}`).toBe(marcadors(CA[clau]));
      }
    }
  });

  test('§13: cap «mai», «100 %», «immune» ni «inviolable»', () => {
    for (const [clau] of parells) {
      expect(CA[clau], clau).not.toMatch(/\bmai\b|100\s?%|immune|inviolable/i);
    }
  });
});
