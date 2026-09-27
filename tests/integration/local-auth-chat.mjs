/** Prova explícita contra el Supabase LOCAL del projecte; mai contra un remot.
 * node tests/integration/local-auth-chat.mjs
 * Les credencials de prova només viuen en memòria. Neteja només els UUID creats.
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const source = await (await fetch('http://localhost:3340/src/main.jsx')).text();
const env = JSON.parse(source.match(/import.meta.env = (\{[^\n]+\});/)?.[1] || '{}');
const endpoint = env.VITE_SUPABASE_URL;
assert.ok(['http://localhost:54321', 'http://127.0.0.1:54321'].includes(endpoint), 'Només Supabase local');
const tenant = env.VITE_TENANT_ID;
assert.match(tenant || '', /^[\da-f-]{36}$/i);
assert.ok(env.VITE_SUPABASE_ANON_KEY, 'Falta clau pública local');
const run = randomUUID();
const users = [];
let organization;
const sql = (query) => execFileSync('docker', ['exec', 'supabase_db_socdepoble.org',
  'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-Atc', query], { encoding: 'utf8' });
const request = async (path, body, token, method = 'POST') => {
  const response = await fetch(`${endpoint}${path}`, {
    method, headers: { apikey: env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token || env.VITE_SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}: ${data?.message || data?.msg || data?.error_description || 'petició rebutjada'}`);
  return data;
};
const rpc = (name, body, token) => request(`/rest/v1/rpc/${name}`, body, token);
try {
  for (const who of ['gestor', 'client']) {
    const email = `sdp-${run}-${who}@example.invalid`;
    const password = `${randomUUID()}Aa9!`;
    const signup = await request('/auth/v1/signup', { email, password,
      data: { full_name: `Prova local ${who}`, name: `Prova local ${who}`, tenant_id: tenant, accepta_rgpd: true } });
    const id = signup.user?.id || signup.id;
    assert.match(id || '', /^[\da-f-]{36}$/i);
    users.push({ id, email });
    assert.ok(signup.access_token, 'El servidor local requerix confirmació: la prova no la suplanta');
    const login = await request('/auth/v1/token?grant_type=password', { email, password });
    assert.equal(login.user.id, id, 'login torna el compte acabat de registrar');
    users.at(-1).token = login.access_token;
  }
  const [owner, customer] = users;
  const orgResult = await rpc('create_organization', { p_tenant_id: tenant, p_kind: 'company',
    p_name: 'Sóc de Poble (prova local)', p_slug: `sdp-test-${run}`, p_description: 'Prova temporal de registre i xat' }, owner.token);
  organization = Array.isArray(orgResult) ? orgResult[0] : orgResult;
  assert.ok(organization.id, 'Organització creada via RPC autenticada');
  await request(`/rest/v1/organizations?id=eq.${organization.id}`, { visibility: 'public' }, owner.token, 'PATCH');
  const directory = await rpc('membres_del_poble', { p_tenant_id: tenant }, customer.token);
  assert.ok(directory.some(row => row.usuari_id === organization.id && row.tipus === 'entitat'));
  const thread = await rpc('crea_fil_directe', { p_tenant_id: tenant, p_altre_usuari: organization.id }, customer.token);
  const messageId = randomUUID();
  const sent = await rpc('xat_envia', { p_id: messageId, p_fil_id: thread, p_text: 'Missatge de prova local' }, customer.token);
  const retry = await rpc('xat_envia', { p_id: messageId, p_fil_id: thread, p_text: 'Missatge de prova local' }, customer.token);
  assert.equal(sent[0].seq, retry[0].seq, 'Reintent idempotent');
  const inbox = await rpc('xat_fils_meus', { p_tenant_id: tenant }, owner.token);
  assert.ok(inbox.some(row => row.id === thread && row.com_entitat));
  const reply = await rpc('xat_envia', { p_id: randomUUID(), p_fil_id: thread, p_text: 'Resposta de l’entitat' }, owner.token);
  assert.equal(reply[0].com_org_id, organization.id);
  assert.equal(reply[0].usuari_id, owner.id);
  const received = await rpc('xat_nous', { p_fil_id: thread, p_despres_de_seq: sent[0].seq }, customer.token);
  assert.equal(received.length, 1);
  assert.equal(received[0].autor_nom, 'Sóc de Poble (prova local)');
  assert.equal(received[0].cos, 'Resposta de l’entitat');
  console.log('PASS: 2 registres + login real, organització, padró, enviament, reintent i recepció com a entitat.');
} finally {
  if (organization?.id) {
    assert.match(organization.id, /^[\da-f-]{36}$/i);
    sql(`delete from public.organizations where id='${organization.id}' and slug='sdp-test-${run}'`);
  }
  for (const user of users) {
    assert.match(user.id, /^[\da-f-]{36}$/i);
    sql(`delete from auth.users where id='${user.id}' and email='${user.email}'`);
  }
  console.log(`Neteja: ${users.length} comptes temporals retirats; cap credencial desada.`);
}
