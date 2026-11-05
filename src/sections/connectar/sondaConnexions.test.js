import { afterEach, describe, expect, test, vi } from 'vitest';

/* Ronda 7 (GLOBAL-06) · Si el servidor té les connexions: un NO-DISPONIBLE es
   recorda per backend en este document; cap altre error no es recorda. */
const m = vi.hoisted(() => ({ capacitats: new Set(['connexionsPubliques']) }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (cap) => m.capacitats.has(cap)
}));
import { ambitDeConnexions, connexionsPotserDisponibles, oblidaSondaConnexions, recordaSiNoDisponibles } from './sondaConnexions.js';

afterEach(() => { oblidaSondaConnexions(); m.capacitats = new Set(['connexionsPubliques']); });

describe('sondaConnexions', () => {
  test('sense la capacitat, mai', () => {
    m.capacitats = new Set();
    expect(connexionsPotserDisponibles('a')).toBe(false);
  });

  test('NO-DISPONIBLE es recorda només per al seu backend', () => {
    expect(connexionsPotserDisponibles('a')).toBe(true);
    recordaSiNoDisponibles('a', { code: 'NO-DISPONIBLE' });
    expect(connexionsPotserDisponibles('a')).toBe(false);
    expect(connexionsPotserDisponibles('b')).toBe(true);
  });

  test('un altre error, o cap, no es recorda', () => {
    for (const error of [{ code: 'DESCONEGUT' }, { name: 'AbortError' }, null, undefined, new Error('x')]) recordaSiNoDisponibles('a', error);
    expect(connexionsPotserDisponibles('a')).toBe(true);
  });

  test('una configuració il·legible és un àmbit més', () => {
    expect(typeof ambitDeConnexions({})).toBe('string');
    expect(ambitDeConnexions({ get supabaseUrl() { throw new Error('x'); } })).toEqual(expect.any(String));
  });
});

test('R6: un 404 de passarel·la o fitxa no anul·la connexions fins a recarregar',()=>{
 for(const error of [{status:404},{statusCode:404,code:'NOT_FOUND'},{status:502,message:'Could not find the function behind proxy'},{code:403},{code:'PGRST301'}])recordaSiNoDisponibles('a',error);
 expect(connexionsPotserDisponibles('a')).toBe(true);
 for(const code of ['PGRST202','PGRST205','no-disponible']){oblidaSondaConnexions();recordaSiNoDisponibles('a',{status:404,code});expect(connexionsPotserDisponibles('a')).toBe(false);}
});
