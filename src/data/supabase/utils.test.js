// @vitest-environment node
/* Auditoria 261007 (B) · utils.js només conserva handleError, l'únic helper
   que fa servir algú (storage.js i xat.js). withRetry, batchInsert,
   getPagination, getCount i searchWithPagination eren codi mort i s'han
   retirat: esta prova vigila que no tornen sense un cridador. */
import { describe, expect, test } from 'vitest';
import * as utils from './utils.js';

describe('supabase/utils', () => {
  test('només exporta handleError', () => {
    expect(Object.keys(utils)).toEqual(['handleError']);
  });

  test('handleError conserva la forma { error, code, details }', () => {
    expect(utils.handleError(null)).toEqual({ error: null, code: 200 });
    expect(utils.handleError(new Error('JWT expired'))).toMatchObject({ error: 'SESSIO_CADUCADA', code: 401 });
    expect(utils.handleError(new Error('duplicate key value'))).toMatchObject({ error: 'DUPLICAT', code: 409 });
    expect(utils.handleError(new TypeError('Failed to fetch'))).toMatchObject({ error: 'XARXA', code: 0 });
    const cru = Object.assign(new Error('altre'), { status: 418 });
    expect(utils.handleError(cru)).toEqual({ error: 'altre', code: 418, details: cru });
  });
});
