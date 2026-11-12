import { afterEach, describe, expect, test, vi } from 'vitest';
import { CREACIO_ADMINISTRACIO_DEL_PERFIL, datesDAdministracio, datesDAplicacio, metadadesAplicacioDelNode, metadadesDatesDelPerfil } from './datesDelPerfil.js';
import { APLICACIONS, aplicacionsValides } from './aplicacions.js';
import { pluginPerId } from '../plugins/registrePlugins.js';
import { DATA_DEL_SNIPPET } from '../control/destiSnippet.js';
import { PAGE_COPY } from '../text/pageContent.js';

afterEach(() => vi.restoreAllMocks());

describe('R55 · dates documentades del perfil', () => {
  test('els sis IDs tenen creació de definició Git, cap fallback de publicació', () => {
    expect(CREACIO_ADMINISTRACIO_DEL_PERFIL.commit).toBe('c49d173c440367cfdc79be577404ceb6b8d7aa52');
    expect(CREACIO_ADMINISTRACIO_DEL_PERFIL.instant).toBe('2026-11-05T16:40:48+01:00');
    expect(CREACIO_ADMINISTRACIO_DEL_PERFIL.ids).toHaveLength(6);
    expect(CREACIO_ADMINISTRACIO_DEL_PERFIL).not.toHaveProperty('publicat');
    for (const id of CREACIO_ADMINISTRACIO_DEL_PERFIL.ids) {
      expect(datesDAdministracio({ id })).toMatchObject({ time:'16:40', date:'05/11/26' });
      expect(datesDAdministracio({ id }).dateTime).toContain('2026-11-05T16:40:48');
    }
  });

  test.each([undefined, null, {}, {id:'admin-nou'}, {id:'__proto__'}, {id:'constructor'}])('una entrada sense origen autoritzat no rep cap rellotge (%j)', item => {
    expect(datesDAdministracio(item)).toEqual({ time:'',date:'',dateTime:'' });
  });

  test('el resultat no consulta Date.now i no muta l’entrada', () => {
    const item=Object.freeze({ id:'admin-taxonomia', creat:'invàlida' });
    vi.spyOn(Date,'now').mockImplementation(() => { throw Error('Clock is not a document source'); });
    expect(datesDAdministracio(item)).toMatchObject({time:'16:40',date:'05/11/26'});
    expect(item.creat).toBe('invàlida');
  });

  test('un apartat nou usa la data explícita i la modificació més recent', () => {
    const item={id:'admin-botigues',creat:'2026-11-08T03:26:00+01:00',updated_at:'2026-11-08T03:30:00+01:00'};
    expect(datesDAdministracio(item)).toMatchObject({time:'03:30',date:'08/11/26'});
    expect(datesDAdministracio({...item,updated_at:'2026-11-01'})).toMatchObject({time:'03:26',date:'08/11/26'});
  });

  test('la publicació és un camp explícit, mai la data Git convertida', () => {
    const item={id:'admin-taxonomia',publicat:'2026-12-10'};
    expect(datesDAdministracio(item)).toEqual({time:'',date:'10/12/26',dateTime:'2026-12-10'});
  });

  test.each([
    ['gestoria','gestoria'],['rebost','rebost'],['salut','salut'],['genealogia','genealogia'],['avisador','avisador'],['lector-rss','rss'],['tpv','tpv'],
  ])('la fitxa local %s reutilitza exactament pluginPerId(%s).data', (id,pluginId) => {
    expect(metadadesAplicacioDelNode(id)).toEqual({creat:pluginPerId(pluginId).data});
    expect(APLICACIONS.find(x=>x.id===id).creat).toBe(pluginPerId(pluginId).data);
  });

  test('Snippet conserva el dia; Mètriques/Cervell reutilitzen el copy amb semàntica editorial', () => {
    expect(metadadesAplicacioDelNode('snippet')).toEqual({creat:DATA_DEL_SNIPPET});
    expect(datesDAplicacio(APLICACIONS.find(x=>x.id==='snippet'))).toEqual({time:'',date:'03/10/26',dateTime:'2026-10-03'});
    expect(metadadesAplicacioDelNode('metriques')).toEqual({creat:PAGE_COPY.consola.date});
    expect(metadadesAplicacioDelNode('cervell')).toEqual({creat:PAGE_COPY.cervell.date});
  });

  /* P0-114 (ordre del Mestre, 261111) · Deu: L'Avisador torna al Perfil. */
  test('la validació conserva les dates de deu apps i les preferències/rols existents', () => {
    const apps=aplicacionsValides(APLICACIONS);
    expect(apps).toHaveLength(10);
    expect(apps.map(x=>x.creat)).toEqual(APLICACIONS.map(x=>x.creat));
    /* R19 · T3 (ordre del Mestre, 261111; pla 261111_1720) · Les set amb destí real són connectades amb
       la seua ruta (aplicacions.test.js en fixa els valors); la validació no les canvia. Abans: totes pendents. */
    for(const app of apps){const declarada=APLICACIONS.find(x=>x.id===app.id);expect([app.id,app.estat,app.ruta]).toEqual([app.id,declarada.estat,declarada.ruta??null]);expect(Object.isFrozen(app)).toBe(true);}
    /* Arbitratge R19 del carril (P1) · El Snippet és connectat a la seua fitxa del Panell (/control?fitxa=snippet). */
    expect(apps.filter(x=>x.estat==='pendent').map(x=>x.id)).toEqual(['metriques','cervell']);
    expect(apps.filter(x=>x.intern).map(({id,panell})=>({id,panell}))).toEqual([{id:'metriques',panell:null},{id:'cervell',panell:null}]);
  });

  test('la mateixa ID federada no rep metadades locals, però conserva les explícites', () => {
    const [empty,sourced]=aplicacionsValides([
      {id:'gestoria',nom:'Una altra Gestoria'},
      {id:'snippet',nom:'Un altre Snippet',created_at:'2024-02-29',updated_at:'2024-03-01',panell:null},
    ]);
    expect(empty).not.toHaveProperty('creat');
    expect(datesDAplicacio(empty)).toEqual({time:'',date:'',dateTime:''});
    expect(sourced).toMatchObject({creat:'2024-02-29',modificat:'2024-03-01',panell:null});
    expect(datesDAplicacio(sourced)).toEqual({time:'',date:'01/03/24',dateTime:'2024-03-01'});
  });

  test.each([null,undefined,42,new Date('2026-11-08'),()=> '2026-11-08','2026-02-30','2026-13-01','2026-01-01T25:00:00Z','ara',''])('rebutja una data no real o de tipus incorrecte (%s)', value => {
    const [app]=aplicacionsValides([{id:'gestoria',nom:'Independent',creat:value}]);
    expect(app).not.toHaveProperty('creat');
    expect(datesDAplicacio(app)).toEqual({time:'',date:'',dateTime:''});
  });

  test('els àlies vàlids no es perden darrere d’un primer candidat malformat', () => {
    expect(metadadesDatesDelPerfil({creat:'sense data',created_at:'2024-02-29',modificat:'',updated_at:'2024-03-03',publicat:null,publish_date:'2024-03-01'})).toEqual({creat:'2024-02-29',modificat:'2024-03-03',publicat:'2024-03-01'});
  });

  test('instants a prop de mitjanit es mostren amb el lector local canònic', () => {
    expect(datesDAplicacio({creat:'2026-10-03T23:30:00Z'})).toMatchObject({time:'01:30',date:'04/10/26'});
    expect(datesDAplicacio({creat:'2026-11-03T23:30:00Z'})).toMatchObject({time:'00:30',date:'04/11/26'});
  });
});
