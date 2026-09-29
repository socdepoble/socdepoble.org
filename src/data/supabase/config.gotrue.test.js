import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/* T48 · Amb supabase-js de veres: els clients de config.js no porten GoTrueClient,
   i per tant auth-js no pot avisar «Multiple GoTrueClient instances detected»
   encara que el JWT canvie i es creen clients nous. */
const state = vi.hoisted(() => ({ token: null }));
vi.mock('../identitat.js', () => ({ jwtPerBackend: config => config.tenantId === 'A' ? state.token : null }));
vi.mock('./runtime.js', () => ({ getResolvedConfig: config => ({ ...config, hasSupabaseConfig: Boolean(config.supabaseUrl && config.supabaseAnonKey) }) }));

const b64u = (valor) => btoa(JSON.stringify(valor)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
/* Ben format i amb `exp` futur: el temps real el llig com un token de veres. */
const jwt = (sub) => `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u({ sub, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.c2ln`;
const CONFIG = { supabaseUrl: 'https://gotrue.example.test', supabaseAnonKey: 'sb_publishable_prova', tenantId: 'A' };
const avisosGoTrue = (espia) => espia.mock.calls.filter((args) => args.some((arg) => String(arg).includes('GoTrueClient')));

let warn;
beforeEach(() => { warn = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => { warn.mockRestore(); });

test('T48 · canviar dues vegades de JWT i demanar-lo en paral·lel no avisa de GoTrueClient', async () => {
  const { getClient, resetClient } = await import('./config.js');
  state.token = jwt('persona-1');
  const [primer, mateix] = await Promise.all([getClient(CONFIG), getClient(CONFIG)]);
  expect(mateix).toBe(primer);
  state.token = jwt('persona-2');
  const segon = await getClient();
  state.token = jwt('persona-3');
  const tercer = await getClient();
  expect(new Set([primer, segon, tercer]).size).toBe(3);
  // Sense auth-js: qualsevol ús de client.auth llança a posta.
  expect(() => tercer.auth.getSession).toThrow(/accessToken/);
  expect(avisosGoTrue(warn)).toEqual([]);
  resetClient();
});

test('control · dos clients amb auth-js al mateix origen sí que avisen: l’espia ho veu', () => {
  const opcions = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, opcions);
  createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, opcions);
  expect(avisosGoTrue(warn).length).toBeGreaterThan(0);
});
