/** Prova explícita contra el Supabase LOCAL del projecte; mai contra un remot.
 * node tests/integration/local-auth-chat.mjs
 * Les credencials de prova només viuen en memòria. Neteja només els UUID creats.
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
// eslint-disable-next-line no-restricted-imports -- Prova de transport del proveïdor, fora de la UI i només contra localhost.
import { createClient } from '@supabase/supabase-js';

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
let realtime;
let outsiderRealtime;
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
  for (const who of ['gestor', 'client', 'extern']) {
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
  const [owner, customer, outsider] = users;
  await request(`/rest/v1/profiles?id=eq.${owner.id}`, { full_name: 'Àngels Martí', icon: '🌻', copyright: '© Àngels' }, owner.token, 'PATCH');
  const accentSearch = await rpc('membres_del_poble', { p_tenant_id: tenant, p_cerca: 'MARTI angels' }, customer.token);
  assert.ok(accentSearch.some(row => row.usuari_id === owner.id), 'Accents, majúscules i paraules en qualsevol ordre');
  const directThread = await rpc('crea_fil_directe', { p_tenant_id: tenant, p_altre_usuari: owner.id }, customer.token);
  outsiderRealtime = createClient(endpoint, env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }, accessToken: async () => outsider.token
  });
  await Promise.resolve(outsiderRealtime.realtime.setAuth(outsider.token));
  for (const topic of [`xat:f:${directThread}`, 'xat:f:uuid-invalid']) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Realtime: no arriba la denegació de permisos')), 8000);
      outsiderRealtime.channel(topic, { config: { private: true } })
        .on('broadcast', { event: 'nous' }, () => reject(new Error('Un tercer ha rebut un avís privat')))
        .subscribe((status, error) => {
          if (status === 'CHANNEL_ERROR') {
            clearTimeout(timer);
            if (/permissions/i.test(error?.message || '')) resolve();
            else reject(new Error(`Denegació inesperada: ${error?.message || status}`));
          }
          if (status === 'SUBSCRIBED') { clearTimeout(timer); reject(new Error('Un tercer pot entrar al canal privat')); }
        });
    });
    await outsiderRealtime.removeAllChannels();
  }
  realtime = createClient(endpoint, env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }, accessToken: async () => owner.token
  });
  await Promise.resolve(realtime.realtime.setAuth(owner.token));
  let notify;
  const notifications = [];
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Realtime local: temps d’espera de subscripció')), 8000);
    realtime.channel(`xat:f:${directThread}`, { config: { private: true } })
      .on('broadcast', { event: 'nous' }, event => { notifications.push(event); notify?.(); })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') { clearTimeout(timer); resolve(); }
        if (['CHANNEL_ERROR', 'TIMED_OUT'].includes(status)) { clearTimeout(timer); reject(new Error(`Realtime local: ${status}`)); }
      });
  });
  await rpc('xat_envia', { p_id: randomUUID(), p_fil_id: directThread, p_text: 'Persona a persona' }, customer.token);
  if (!notifications.length) await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Realtime local: falta avís de missatge')), 8000);
    notify = () => { clearTimeout(timer); resolve(); };
  });
  assert.ok(notifications[0].payload.seq > 0, 'Avís privat en temps real');
  const directReceived = await rpc('xat_nous', { p_fil_id: directThread, p_despres_de_seq: 0 }, owner.token);
  assert.ok(directReceived.some(row => row.cos === 'Persona a persona'));
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
  // La prova SQL es desfà sencera: comprova també la còpia privada de GoTrue
  // sense invalidar les sessions temporals que usa esta prova HTTP.
  sql(`begin;
    update auth.users set raw_user_meta_data=raw_user_meta_data || '{"icon":"🌻","copyright":"© Àngels"}'::jsonb where id='${owner.id}';
    select set_config('request.jwt.claim.sub','${owner.id}',true);
    select public.demana_baixa('Prova temporal');
    do $$ begin
      if exists(select 1 from profiles where id='${owner.id}' and (icon is not null or copyright <> '')) then raise exception 'Perfil no retirat'; end if;
      if exists(select 1 from auth.users where id='${owner.id}' and raw_user_meta_data ?| array['icon','copyright']) then raise exception 'Metadades no retirades'; end if;
    end $$;
    select public.demana_baixa('Reintent');
    select public.cancela_baixa();
    do $$ begin
      if not exists(select 1 from profiles where id='${owner.id}' and icon='🌻' and copyright='© Àngels') then raise exception 'Perfil no restaurat'; end if;
      if not exists(select 1 from auth.users where id='${owner.id}' and raw_user_meta_data->>'icon'='🌻' and raw_user_meta_data->>'copyright'='© Àngels') then raise exception 'Metadades no restaurades'; end if;
    end $$;
    rollback;`);
  console.log('PASS: 3 registres + login, cerca amb accents, enviament/recepció entre persones i entitat, Realtime privat (tercer i UUID invàlid rebutjats), reintent idempotent, baixa i restauració d’icon/copyright.');
} finally {
  if (realtime) await realtime.removeAllChannels();
  if (outsiderRealtime) await outsiderRealtime.removeAllChannels();
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
