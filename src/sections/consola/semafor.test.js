// @vitest-environment node
/* Onada 6 (requisit 8) · El semàfor de la Consola: verd, taronja i roig
   segons la gravetat, i neutre per al que només informa. */
import { describe, expect, test } from 'vitest';
import {
  COLOR_DE_SEVERITAT, COLOR_D_ESTAT, COLOR_D_ESTAT_TASCA, NEUTRE, TO_SEMAFOR, colorDAvisos, colorDeTasques, etiquetaDeTo,
  pitjor, semaforDEtiquetes, toDEstat, toDeColor
} from './semafor.js';
import { ETIQUETES } from './consolaPagines.js';
import { ESTATS_TASCA, SEVERITATS } from './mapa/contracteMapa.js';
import { TO_ESTAT } from './mapa/grafMapa.js';
import {
  problemaCandat, problemaDAvis, problemaDeSkill, problemaTasca, problemesDeCandats, problemesDeTasques
} from './problemesConsola.js';

describe('el semàfor', () => {
  test('tres colors amb el vocabulari d’Insignia, sense CSS nou, i cap blau', () => {
    expect(TO_SEMAFOR).toEqual({ verd: 'exit', taronja: 'avis', roig: 'error' });
    expect(NEUTRE).toBe('neutre');
    expect(toDeColor('blau')).toBe('neutre');
    expect(Object.values(TO_SEMAFOR)).not.toContain('info');
  });

  test('alta roig; mitjana i baixa taronja: tot el vocabulari del contracte', () => {
    expect(COLOR_DE_SEVERITAT).toEqual({ alta: 'roig', mitjana: 'taronja', baixa: 'taronja' });
    expect(Object.keys(COLOR_DE_SEVERITAT).sort()).toEqual([...SEVERITATS].sort());
  });

  test('el color d’uns avisos és el del més greu, no el del recompte', () => {
    const de = (...s) => s.map((severitat) => ({ severitat }));
    expect(colorDAvisos([])).toBe('verd');
    expect(colorDAvisos(null)).toBe('verd');
    expect(colorDAvisos(de('baixa', 'baixa', 'baixa', 'baixa'))).toBe('taronja');
    expect(colorDAvisos(de('mitjana', 'alta'))).toBe('roig');
    expect(colorDAvisos(de('desconeguda'))).toBe('taronja');
  });

  test('pitjor: el més greu, i el que no és del semàfor no compta', () => {
    expect(pitjor([])).toBe('verd');
    expect(pitjor(['verd', 'taronja'])).toBe('taronja');
    expect(pitjor(['taronja', 'roig', 'verd'])).toBe('roig');
    expect(pitjor([null, 'blau', undefined])).toBe('verd');
  });

  test('les etiquetes d’estat de les peces: VIU i ACTIU verd; MORT i SENSE CONSUMIDOR roig; la resta taronja; SENSE MESURA neutre', () => {
    for (const t of ['VIU', 'ACTIU', 'EN MARXA']) expect(toDEstat(t), t).toBe('exit');
    for (const t of ['MORT', 'SENSE CONSUMIDOR']) expect(toDEstat(t), t).toBe('error');
    for (const t of ['SENSE LLANÇADOR', 'PARCIAL', 'DESCONEGUT', 'FALTA', 'SENSE LECTOR', 'SENSE CANDATS', 'SENSE DECLARACIÓ']) {
      expect(toDEstat(t), t).toBe('avis');
    }
    expect(toDEstat('SENSE MESURA')).toBe('neutre');
    // Un text que no és a la taula no es pot dir bo.
    expect(toDEstat('ESTAT NOU')).toBe('avis');
    expect(Object.isFrozen(COLOR_D_ESTAT)).toBe(true);
  });

  test('una etiqueta és { text, to }, immutable', () => {
    const e = etiquetaDeTo('VIU', 'exit');
    expect(e).toEqual({ text: 'VIU', to: 'exit' });
    expect(Object.isFrozen(e)).toBe(true);
  });

  /* Correcció de l'Onada 6 (revisió adversarial) · les xifres que compten
     tasques prenen el color del seu pitjor estat, el mateix de la insígnia de
     la tasca (grafMapa.js · TO_ESTAT); sense cap tasca, cap color. */
  test('les tasques: viva verd, morta roig, la resta taronja; sense cap, cap color', () => {
    expect(Object.keys(COLOR_D_ESTAT_TASCA).sort()).toEqual([...ESTATS_TASCA].sort());
    for (const estat of ESTATS_TASCA) expect(toDeColor(COLOR_D_ESTAT_TASCA[estat]), estat).toBe(TO_ESTAT[estat]);
    const t = (...estats) => estats.map((estat) => ({ estat }));
    expect(colorDeTasques([])).toBeNull();
    expect(colorDeTasques(null)).toBeNull();
    expect(colorDeTasques(t('viu', 'viu'))).toBe('verd');
    expect(colorDeTasques(t('viu', 'desconegut'))).toBe('taronja');
    expect(colorDeTasques(t('desconegut', 'mort'))).toBe('roig');
    expect(colorDeTasques(t('estat-nou'))).toBe('taronja');
  });
});

/* Correcció de l'Onada 6 (revisió adversarial: «la llista també ha de fer de
   semàfor») · Cada problema porta una marca amb el to del seu color. */
describe('les marques dels problemes', () => {
  test('un avís porta la seua severitat: alta roig, mitjana i baixa taronja', () => {
    expect(problemaDAvis({ node: 'skill:a', codi: 'orfe', severitat: 'mitjana' })).toEqual({
      clau: 'skill:a|orfe|0', text: 'a · orfe', marca: 'mitjana', to: 'avis'
    });
    expect(problemaDAvis({ node: 'script:t/x.mjs', codi: 'script-absent', severitat: 'alta' }, 3)).toEqual({
      clau: 'script:t/x.mjs|script-absent|3', text: 'script-absent', ruta: 't/x.mjs', marca: 'alta', to: 'error'
    });
    expect(problemaDAvis({ node: 'skill:a', codi: 'x', severitat: 'baixa' }).to).toBe('avis');
    // Sense severitat, cap marca: no se n'inventa cap.
    expect(problemaDAvis({ node: 'skill:a', codi: 'x' })).not.toHaveProperty('marca');
  });

  test('una tasca porta el seu estat; les vives no són cap problema', () => {
    expect(problemaTasca({ id: 'reflex', estat: 'mort' })).toEqual({ clau: 'reflex', text: 'reflex', marca: 'mort', to: 'error' });
    expect(problemesDeTasques([
      { id: 'b', estat: 'desconegut' }, { id: 'a', estat: 'viu' }, { id: 'c', estat: 'mort' }, { id: 'd', estat: 'declarat-sense-llancador' }
    ]).map((p) => `${p.marca}:${p.to}:${p.text}`)).toEqual(['mort:error:c', 'sense llançador:avis:d', 'desconegut:avis:b']);
  });

  test('un candat: sense consumidor roig, per acreditar taronja; els acreditats no hi són', () => {
    const c = (id, acreditat) => ({ id, arnes: 'Claude Code', esdeveniment: id, acreditat });
    expect(problemaCandat(c('Post', false))).toEqual({ clau: 'Post', text: 'Claude Code · Post', marca: 'sense consumidor', to: 'error' });
    expect(problemesDeCandats([c('A', null), c('B', true), c('C', false)], 'k|').map((p) => `${p.clau}:${p.marca}:${p.to}`))
      .toEqual(['k|C:sense consumidor:error', 'k|A:per acreditar:avis']);
  });

  test('una skill sencera porta el seu color de l’Inventari; una part dels seus avisos, la severitat més greu d’eixa part', () => {
    const s = { id: 'skill:a', nom: 'a', avisos: [{ codi: 'orfe', severitat: 'mitjana' }, { codi: 'fora-segell', severitat: 'alta' }] };
    expect(problemaDeSkill(s)).toEqual({ clau: 'skill:a', text: 'a · orfe, fora-segell', marca: 'roig', to: 'error' });
    expect(problemaDeSkill({ ...s, avisos: s.avisos.slice(0, 1) })).toEqual({ clau: 'skill:a', text: 'a · orfe', marca: 'ambre', to: 'avis' });
    // Una part: mai «ambre» d'una skill que l'Inventari pinta roja.
    expect(problemaDeSkill(s, s.avisos.slice(0, 1))).toEqual({ clau: 'skill:a', text: 'a · orfe', marca: 'mitjana', to: 'avis' });
    expect(problemaDeSkill(s, s.avisos.slice(1))).toEqual({ clau: 'skill:a', text: 'a · fora-segell', marca: 'alta', to: 'error' });
  });
});

/* IDEA-40 (decisió del Mestre, 261028, Bloc H) · La insígnia quadrada porta el
   semàfor de les etiquetes: la més greu dels tres colors, amb el seu text. El
   que només informa («Canvis nous», «Sense font», neutre o un to de fora del
   semàfor) no hi compta. Cap quart color. */
describe('el semàfor de la insígnia', () => {
  test('cada etiqueta del tauler: Cal reparar roig, Important taronja, En ordre verd; Canvis nous i Sense font, cap', () => {
    expect(semaforDEtiquetes([ETIQUETES.reparar])).toEqual({ to: 'error', text: 'Cal reparar' });
    expect(semaforDEtiquetes([ETIQUETES.important])).toEqual({ to: 'avis', text: 'Important' });
    expect(semaforDEtiquetes([ETIQUETES.enOrdre])).toEqual({ to: 'exit', text: 'En ordre' });
    expect(semaforDEtiquetes([ETIQUETES.nou])).toBeNull();
    expect(semaforDEtiquetes([ETIQUETES.senseFont])).toBeNull();
  });

  test('la més greu mana, siga on siga de la llista; «Canvis nous» al costat no canvia res', () => {
    expect(semaforDEtiquetes([ETIQUETES.enOrdre, ETIQUETES.reparar, ETIQUETES.important])).toEqual({ to: 'error', text: 'Cal reparar' });
    expect(semaforDEtiquetes([ETIQUETES.important, ETIQUETES.nou])).toEqual({ to: 'avis', text: 'Important' });
    expect(semaforDEtiquetes([ETIQUETES.nou, ETIQUETES.enOrdre])).toEqual({ to: 'exit', text: 'En ordre' });
    // Dues del mateix color: la primera.
    expect(semaforDEtiquetes([{ text: 'A', to: 'avis' }, { text: 'B', to: 'avis' }]).text).toBe('A');
  });

  test('cap quart color: el blau (info), neutre, el text pla i el que no és etiqueta no hi compten', () => {
    for (const etiquetes of [undefined, null, [], ['VIU'], [null], [{ text: 'Acció', to: 'info' }], [{ text: 'x', to: 'neutre' }], [{ text: 'x' }], 'En ordre']) {
      expect(semaforDEtiquetes(etiquetes), JSON.stringify(etiquetes)).toBeNull();
    }
    const tons = new Set([ETIQUETES.reparar, ETIQUETES.important, ETIQUETES.enOrdre].map((e) => semaforDEtiquetes([e]).to));
    expect(tons).toEqual(new Set(Object.values(TO_SEMAFOR)));
    expect(Object.isFrozen(semaforDEtiquetes([ETIQUETES.enOrdre]))).toBe(true);
  });
});
