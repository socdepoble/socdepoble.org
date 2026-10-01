import { describe, expect, it } from 'vitest';
import {
  codiDEntrada,
  findSeedOrganization,
  missatgeDEntrada,
  normalizeSlug,
  readableBackendError,
  toDeLErrorDEntrada,
  validateOrganization,
  validateRegistration
} from '../../src/sections/onboarding/onboardingModel.js';
import { CODI_BACKEND_INABASTABLE, CODI_ENTRADA } from '../../src/data/errorsBackend.js';

describe('onboardingModel', () => {
  it('normalitza identificadors valencians sense deixar caràcters insegurs', () => {
    expect(normalizeSlug('  Sóc de Poble! ')).toBe('soc-de-poble');
    expect(normalizeSlug('El Rentonar / Grup')).toBe('el-rentonar-grup');
  });

  it('rebutja registres incomplets i contrasenyes curtes', () => {
    expect(validateRegistration({ name: 'A', email: 'correu', password: 'curta' })).toEqual({
      name: 'Escriu el teu nom complet.',
      email: 'Escriu un correu electrònic vàlid.',
      password: 'Utilitza almenys 10 caràcters.'
    });
  });

  it('accepta el blueprint de les dues organitzacions', () => {
    expect(validateOrganization({ name: 'Sóc de Poble', slug: 'soc-de-poble', description: '' })).toEqual({});
    expect(validateOrganization({ name: 'Rentonar', slug: 'rentonar', description: '' })).toEqual({});
  });

  it('troba el grup només davall de la seua empresa', () => {
    const rows = [{ id: 'group-id', kind: 'group', slug: 'rentonar', parent_organization_id: 'company-id' }];
    expect(findSeedOrganization(rows, { kind: 'group', slug: 'rentonar' }, 'company-id')?.id).toBe('group-id');
    expect(findSeedOrganization(rows, { kind: 'group', slug: 'rentonar' }, 'other-id')).toBeNull();
  });

  it('extrau el missatge segur del cos d’error de Supabase', () => {
    const error = new Error('Supabase 400: {"message":"Identificador ocupat"}');
    expect(readableBackendError(error)).toBe('Identificador ocupat');
  });

  /* T4 (ordre del Mestre, 260930) · GoTrue porta el text a `msg`: abans eixia el JSON cru. */
  it('llig també el camp msg de GoTrue, i message mana si hi és', () => {
    expect(readableBackendError(new Error('Supabase 422: {"code":422,"error_code":"x","msg":"Signups not allowed"}'))).toBe('Signups not allowed');
    expect(readableBackendError(new Error('Supabase 400: {"message":"PostgREST","msg":"GoTrue"}'))).toBe('PostgREST');
    expect(readableBackendError(new Error('Supabase 400: {"msg":{}}'))).toBe('Supabase 400: {"msg":{}}');
    expect(readableBackendError(new Error('Supabase 400: null'))).toBe('Supabase 400: null');
  });

  it('missatgeDEntrada tria la frase pel codi, no pel text de l’error', () => {
    for (const code of Object.values(CODI_ENTRADA)) {
      const text = missatgeDEntrada(Object.assign(new Error('Supabase 400: {"msg":"cru"}'), { code }));
      expect(text, code).not.toMatch(/Supabase|cru|\{/);
      expect(text.length, code).toBeGreaterThan(10);
    }
    expect(missatgeDEntrada({ code: CODI_ENTRADA.CREDENCIALS, message: 'Invalid login credentials' }))
      .toBe('El correu o la contrasenya no són correctes.');
  });

  /* Correcció de la revisió T1–T4 (260930) · Abans, un error sense codi queia a
     readableBackendError i la vista parsejava el `msg` de GoTrue («Signups not
     allowed»). Ara una resposta del servidor (estat HTTP d'error) sense codi és
     DESCONEGUT, amb la frase genèrica, i mai el text del proveïdor. El text propi
     de l'adaptador sense estat (GOOGLE_LOCAL_UNAVAILABLE) continua eixint tal qual. */
  it('sense codi conegut: una resposta del servidor té la frase genèrica i mai el text del proveïdor; un servidor inabastable sense codi també té frase', () => {
    const generica = 'No s’ha pogut completar l’operació. Revisa les dades i torna-ho a provar.';
    const signups = Object.assign(new Error('Supabase 422: {"code":422,"error_code":"signup_disabled","msg":"Signups not allowed"}'), { status: 422 });
    expect(codiDEntrada(signups)).toBe(CODI_ENTRADA.DESCONEGUT);
    expect(missatgeDEntrada(signups)).toBe(generica);
    expect(missatgeDEntrada(Object.assign(new Error('Supabase 400: {"msg":"Signups not allowed"}'), { status: 400 }))).toBe(generica);
    expect(missatgeDEntrada(Object.assign(new Error('Service Unavailable'), { status: 503 }))).toBe(generica);
    expect(missatgeDEntrada({ code: CODI_ENTRADA.DESCONEGUT, message: 'Signups not allowed' })).toBe(generica);
    expect(missatgeDEntrada(new Error(''))).toBe(generica);
    expect(missatgeDEntrada(null)).toBe(generica);
    expect(toDeLErrorDEntrada(CODI_ENTRADA.DESCONEGUT)).toBe('error');
    expect(missatgeDEntrada(Object.assign(new Error('Text propi'), { code: 'GOOGLE_LOCAL_UNAVAILABLE' }))).toBe('Text propi');
    const servidor = missatgeDEntrada(Object.assign(new Error('Supabase 0: {"x":1}'), { status: 0 }));
    expect(servidor).toBe(missatgeDEntrada({ code: CODI_ENTRADA.SERVIDOR_INABASTABLE }));
    expect(codiDEntrada(Object.assign(new Error('x'), { codi: CODI_BACKEND_INABASTABLE }))).toBe(CODI_ENTRADA.SERVIDOR_INABASTABLE);
    expect(codiDEntrada(new TypeError('Failed to fetch'))).toBe(CODI_ENTRADA.SERVIDOR_INABASTABLE);
    expect(codiDEntrada(new TypeError('x is not a function'))).toBeNull();
    expect(codiDEntrada(null)).toBeNull();
    expect(codiDEntrada({ code: 'toString' })).toBeNull();
  });

  it('el to de l’avís: les credencials són error; el servidor, els intents i el correu pendent, avís', () => {
    expect(toDeLErrorDEntrada(CODI_ENTRADA.CREDENCIALS)).toBe('error');
    expect(toDeLErrorDEntrada(CODI_ENTRADA.SERVIDOR_INABASTABLE)).toBe('avis');
    expect(toDeLErrorDEntrada(CODI_ENTRADA.MASSA_INTENTS)).toBe('avis');
    expect(toDeLErrorDEntrada(CODI_ENTRADA.CORREU_PENDENT)).toBe('avis');
    expect(toDeLErrorDEntrada(CODI_ENTRADA.CONTRASENYA_FEBLE)).toBe('error');
    expect(toDeLErrorDEntrada(CODI_ENTRADA.COMPTE_EXISTENT)).toBe('error');
    expect(toDeLErrorDEntrada(null)).toBe('error');
  });
});
