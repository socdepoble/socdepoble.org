import { describe, it, expect } from 'vitest';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
import { creaDiariPublicacions } from './actesPublicacio.js';
const note = '44000000-0000-4000-8000-000000000001';
describe('R21 v2 · UUID de l’acte i rebut de l’operació', () => {
  it('doble tab, remuntatge i resposta perduda reutilitzen els dos UUID', async () => {
    const indexedDB = creaIdbFalsEstructurat(); const a = creaDiariPublicacions({indexedDB}), b = creaDiariPublicacions({indexedDB});
    const [first, duplicate] = await Promise.all([a.comenca('scope',note,{revision:1}), b.comenca('scope',note,{revision:1})]);
    expect(first).toEqual(duplicate); expect(first.actId).not.toBe(note);
    expect(await creaDiariPublicacions({indexedDB}).comenca('scope',note,{revision:2})).toEqual(first);
  });
  it('actualitzar conserva acte però estrena operació; republicar estrena els dos', async () => {
    const d = creaDiariPublicacions({indexedDB:creaIdbFalsEstructurat()}); const a = await d.comenca('scope',note,{revision:1});
    await d.confirma('scope',note,a.operationId); const update = await d.comenca('scope',note,{actId:a.actId,revision:2});
    expect(update.actId).toBe(a.actId); expect(update.operationId).not.toBe(a.operationId);
    await d.retira('scope',note); const next = await d.comenca('scope',note,{revision:3});
    expect(next.actId).not.toBe(a.actId); expect(next.operationId).not.toBe(update.operationId);
    await expect(d.confirma('scope',note,update.operationId)).rejects.toMatchObject({name:'AbortError'});
  });
  it('una altra identitat o backend no reutilitza l’acte', async () => {
    const d = creaDiariPublicacions({indexedDB:creaIdbFalsEstructurat()}); const a = await d.comenca('A',note,{revision:1});
    const b = await d.comenca('B',note,{revision:1}); expect(a.actId).not.toBe(b.actId);
  });
  it('no envia un intent sense persistència o revisió vàlida', async () => {
    const d = creaDiariPublicacions({indexedDB:null}); await expect(d.comenca('scope',note,{revision:1})).rejects.toThrow('persistent');
    await expect(d.comenca('scope',note,{revision:-1})).rejects.toThrow();
  });
});

/* Gauntlet R22 (notes-07) · Si la consulta ha confirmat que el servidor no té l'operació, el reintent porta la revisió
   vigent (mateix acte i mateixa operació); sense eixa confirmació, la revisió de l'intent no es toca. */
describe('R22 · reintent després d’una fallada i d’una edició', () => {
  it('noAplicat reescriu la revisió de l’intent pendent i conserva acte i operació', async () => {
    const d = creaDiariPublicacions({ indexedDB: creaIdbFalsEstructurat() });
    const primer = await d.comenca('scope', note, { revision: 3 });
    const reintent = await d.comenca('scope', note, { revision: 4, noAplicat: true });
    expect(reintent).toMatchObject({ actId: primer.actId, operationId: primer.operationId, revision: 4, pending: true });
    expect(await d.llegix('scope', note)).toMatchObject({ revision: 4, operationId: primer.operationId });
  });
  it('sense noAplicat (resposta potser perduda), l’intent es reprén amb la revisió original', async () => {
    const d = creaDiariPublicacions({ indexedDB: creaIdbFalsEstructurat() });
    const primer = await d.comenca('scope', note, { revision: 3 });
    expect(await d.comenca('scope', note, { revision: 4 })).toEqual(primer);
  });
});
