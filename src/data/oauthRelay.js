/**
 * oauthRelay.js — AUTENTICACIÓ DISTRIBUÏDA SENSE LLISTA BLANCA DINÀMICA
 *
 * PROBLEMA QUE RESOL (auditoria 260829):
 *   `loginWithGoogle()` enviava l'usuari a Google amb
 *   `redirect_to = window.location.origin + pathname`. Com que eixe origen
 *   no estava a la llista blanca de Supabase, GoTrue NO fallava: queia
 *   silenciosament al `SITE_URL` del projecte i l'usuari acabava sempre a
 *   socdepoble.org, fora del seu entorn.
 *   I encara pitjor: no hi havia CAP codi a tot `src/` que llegira la
 *   tornada. Zero `location.hash`, zero `URLSearchParams`, zero bescanvi.
 *   El botó de Google era un bitllet d'anada sense estació de tornada.
 *
 * ESTRATÈGIA:
 *   Una sola adreça a la llista blanca, per sempre: el relé. L'origen que
 *   inicia el flux viatja com a paràmetre del relé, no com a `redirect_to`.
 *   El relé el valida i torna el codi. El proveïdor d'identitat no ha de
 *   conéixer mai cap `localhost`.
 *
 * PER QUÈ PKCE I NO IMPLICIT:
 *   Amb el flux implícit torna un `access_token` al fragment de la URL, que
 *   acaba a l'historial del navegador. Amb PKCE torna un codi d'un sol ús
 *   que no val res sense el verificador, i el verificador no ix mai de la
 *   pestanya que va començar el flux.
 *
 * TRES CAMINS DE TORNADA, per ordre:
 *   1. Emergent + `window.opener.postMessage` — el camí net.
 *   2. Emergent + esdeveniment `storage` — quan Google talla l'`opener` amb
 *      capçaleres COOP. Passa de veres; no és teòric.
 *   3. Redirecció completa — iPads amb emergents bloquejats.
 *   La finestra amfitriona (Sollutia, local) no navega mai fora
 *   en els casos 1 i 2.
 *
 * ⚠ A VERIFICAR CONTRA LA TEUA VERSIÓ DE GOTRUE ABANS DE DESPLEGAR:
 *   el nom del `grant_type` de bescanvi (ací `pkce`) i el nom del camp
 *   (`auth_code`). Estan a `EXCHANGE_GRANT` i `EXCHANGE_FIELD`, aïllats a
 *   propòsit. Comprova-ho amb una crida de prova; si el teu GoTrue espera
 *   noms distints, es canvien en dos llocs i prou.
 */

import { setVal, delVal, getEfimer, setEfimer, delEfimer } from '../config/storage.js';
import { desaSessio } from './identitat.js';

/* ───────────────────────── Configuració ───────────────────────── */

/** L'ÚNICA adreça registrada a Supabase. Sobreescriptible per entorn. */
const RELAY_PER_DEFECTE = 'https://auth.socdepoble.org/callback';

const CLAU_VERIFICADOR = 'sdp:oauth:verificador';
const CLAU_TRASPAS = 'sdp:oauth:traspas';
const EXCHANGE_GRANT = 'pkce';
const EXCHANGE_FIELD = 'auth_code';
const TEMPS_MAXIM_MS = 180000;

const relayUrl = (config) => {
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    return window.location.origin + '/auth/callback.html';
  }
  return config?.oauthRelayUrl || RELAY_PER_DEFECTE;
};
const relayOrigin = (config) => new URL(relayUrl(config)).origin;

/* ───────────────────────── PKCE ───────────────────────── */

const ALFABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

export function generaVerificador(longitud = 64) {
  const bytes = new Uint8Array(longitud);
  crypto.getRandomValues(bytes);
  let eixida = '';
  for (const b of bytes) eixida += ALFABET[b % ALFABET.length];
  return eixida;
}

function base64url(buffer) {
  let bin = '';
  for (const b of new Uint8Array(buffer)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function generaRepte(verificador) {
  const dades = new TextEncoder().encode(verificador);
  return base64url(await crypto.subtle.digest('SHA-256', dades));
}

/* ───────────────────────── Bescanvi ───────────────────────── */

async function bescanvia(codi, verificador, { supabaseUrl, supabaseAnonKey }) {
  const resposta = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=${EXCHANGE_GRANT}`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ [EXCHANGE_FIELD]: codi, code_verifier: verificador })
  });

  if (!resposta.ok) {
    const cos = await resposta.text().catch(() => '');
    throw new Error(`No s'ha pogut completar l'entrada (${resposta.status}). ${cos}`);
  }

  const sessio = await resposta.json();
  if (!sessio?.access_token) throw new Error('El servidor no ha tornat cap sessió.');

  /* CORRECCIÓ P0 (260908). Abans: els dos tokens a sessionStorage i el `user`
     a localStorage amb setVal. Les tres peces han de tindre la mateixa vida o
     l'app es queda amb un usuari sense token (sessió fantasma). Ho fa
     `desaSessio`, que és l'únic lloc del projecte que escriu les tres claus. */
  desaSessio(sessio);
  delEfimer(CLAU_VERIFICADOR);
  window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: sessio.user } }));
  return sessio;
}

/* ───────────────────────── Anada ───────────────────────── */

/**
 * Obri l'entrada amb Google. Resol amb la sessió; rebutja amb un error
 * llegible. La pàgina amfitriona no navega si l'emergent s'obri.
 */
export async function entraAmbGoogle(config = {}, resolConfig) {
  const { supabaseUrl, supabaseAnonKey, hasSupabaseConfig } = resolConfig(config);
  if (!hasSupabaseConfig) throw new Error('L\'entrada amb Google necessita connexió amb Supabase.');

  // Circuit Breaker per evitar bucles de redirecció cap a l'autenticació
  const clauCb = 'sdp:oauth:cb';
  const intentsCb = getEfimer(clauCb, { count: 0, time: Date.now() });
  if (Date.now() - intentsCb.time > 60000) {
    intentsCb.count = 1;
    intentsCb.time = Date.now();
  } else {
    intentsCb.count += 1;
  }
  setEfimer(clauCb, intentsCb);
  
  if (intentsCb.count > 4) {
    throw new Error('Massa intents d\'inici de sessió seguits. Circuit Breaker activat. Espera un minut.');
  }

  // Obertura síncrona per evitar bloqueig a Safari (Safari matarà el popup si ve després d'un await)
  const emergent = window.open('', 'sdp-oauth', 'width=520,height=680');

  const verificador = generaVerificador();
  const repte = await generaRepte(verificador);
  setEfimer(CLAU_VERIFICADOR, verificador);

  const destiRelay = `${relayUrl(config)}?sdp_origin=${encodeURIComponent(window.location.origin)}&sdp_path=${encodeURIComponent(window.location.pathname)}`;
  
  const state = generaVerificador(16);
  setEfimer('sdp:oauth:state', state);

  const url = `${supabaseUrl}/auth/v1/authorize`
    + `?provider=google`
    + `&code_challenge=${encodeURIComponent(repte)}`
    + `&code_challenge_method=S256`
    + `&state=${encodeURIComponent(state)}`
    + `&redirect_to=${encodeURIComponent(destiRelay)}`;

  // Camí 3: emergent bloquejat. Redirecció completa.
  if (!emergent) {
    window.location.href = url;
    return new Promise(() => {}); // Penjarà a propòsit perquè ja naveguem.
  }

  try {
    emergent.location.href = url;
  } catch {
    // Fallback extrem si el navegador bloqueja mutar l'emergent
    window.location.href = url;
    return new Promise(() => {});
  }

  return esperaCodi(emergent, config)
    .then((codi) => bescanvia(codi, verificador, { supabaseUrl, supabaseAnonKey }))
    .finally(() => delEfimer(CLAU_VERIFICADOR));
}

/**
 * Escolta les dues vies de tornada de l'emergent alhora.
 */
function esperaCodi(emergent, config) {
  return new Promise((resol, rebutja) => {
    const origenRelay = relayOrigin(config);
    let acabat = false;

    const neteja = () => {
      window.removeEventListener('message', perMissatge);
      window.removeEventListener('storage', perStorage);
      clearInterval(vigilant);
      clearTimeout(rellotge);
      delVal(CLAU_TRASPAS);
    };
    const acaba = (fn, valor) => { if (acabat) return; acabat = true; neteja(); fn(valor); };

    // Camí 1 — l'emergent ha tornat a l'origen de l'app i ens parla.
    function perMissatge(e) {
      if (e.origin !== origenRelay && e.origin !== window.location.origin) return; // Validació estricta
      if (e.source !== emergent) return;
      const d = e.data;
      if (!d || d.type !== 'sdp:oauth') return;
      
      const storedState = getEfimer('sdp:oauth:state', null);
      if (!storedState || !d.state || d.state !== storedState) {
        return acaba(rebutja, new Error('Estat OAuth no vàlid. Possible atac CSRF.'));
      }
      
      if (d.error) return acaba(rebutja, new Error(d.error));
      if (d.code) acaba(resol, d.code);
    }

    // Camí 2 — Google ha tallat l'`opener` amb COOP. L'emergent deixa el
    // codi a l'emmagatzematge del nostre origen i açò el replega.
    function perStorage(e) {
      if (e.key !== CLAU_TRASPAS || !e.newValue) return;
      try {
        const d = JSON.parse(e.newValue);
        if (!d.t || Date.now() - d.t > 120000) return;
        
        const storedState = getEfimer('sdp:oauth:state', null);
        if (!storedState || !d.state || d.state !== storedState) {
          return acaba(rebutja, new Error('Estat OAuth no vàlid al storage. Possible atac CSRF.'));
        }
        
        if (d?.error) return acaba(rebutja, new Error(d.error));
        if (d?.code) acaba(resol, d.code);
      } catch { /* valor malmés: s'ignora */ }
    }

    const vigilant = setInterval(() => {
      try {
        if (emergent.closed) acaba(rebutja, new Error('S\'ha tancat la finestra abans d\'acabar d\'entrar.'));
      } catch {
        // Bloqueig de COOP. No podem accedir a emergent.closed, confiem en storage o timeout.
      }
    }, 700);

    const rellotge = setTimeout(() => {
      try { emergent.close(); } catch { /* ja tancada */ }
      acaba(rebutja, new Error('L\'entrada ha tardat massa. Torna a provar.'));
    }, TEMPS_MAXIM_MS);

    window.addEventListener('message', perMissatge);
    window.addEventListener('storage', perStorage);
  });
}

/* ───────────────────────── Tornada ───────────────────────── */

/**
 * Crida-la UNA vegada quan l'app es munte, abans de pintar res.
 *
 * Resol tres situacions:
 *   a) Som l'emergent que acaba de tornar del relé → passem el codi a la
 *      finestra mare i ens tanquem.
 *   b) Som la finestra principal després d'una redirecció completa → bescanviem.
 *   c) No hi ha res al fragment → no fem res.
 */
export async function gestionaTornada(config = {}, resolConfig) {
  if (typeof window === 'undefined') return null;
  delVal(CLAU_TRASPAS);

  const qSearch = new URLSearchParams(window.location.search);
  const qHash = new URLSearchParams(window.location.hash.substring(1));
  
  const codi = qSearch.get('sdp_code') || qSearch.get('code') || qHash.get('sdp_code') || qHash.get('code');
  const error = qSearch.get('sdp_oauth_error') || qSearch.get('error') || qSearch.get('error_description') || qHash.get('sdp_oauth_error') || qHash.get('error') || qHash.get('error_description');
  if (!codi && !error) return null;

  const somEmergent = (() => {
    try { return window.opener && window.opener !== window; } catch { return false; }
  })();

  const urlState = qSearch.get('state') || qHash.get('state');

  // (a) Som l'emergent: no bescanviem ací — el verificador viu a la mare.
  if (somEmergent || window.name === 'sdp-oauth') {
    netejaRetorn();
    const carrega = error ? { type: 'sdp:oauth', error, state: urlState } : { type: 'sdp:oauth', code: codi, state: urlState };
    try {
      window.opener.postMessage(carrega, window.location.origin);
    } catch {
      // COOP ens ha tallat l'`opener`. Via storage.
      setVal(CLAU_TRASPAS, { ...carrega, t: Date.now() });
    }
    if (!window.opener) setVal(CLAU_TRASPAS, { ...carrega, t: Date.now() });
    setTimeout(() => { try { window.close(); } catch { /* ignora */ } }, 60);
    return null;
  }

  // (b) Finestra principal després de redirecció completa.
  if (error) {
    netejaRetorn();
    throw new Error(error);
  }

  const storedState = getEfimer('sdp:oauth:state', null);
  delEfimer('sdp:oauth:state');
  
  // Comprovació estricta (fail-closed) del state per redireccions completes
  if (!storedState || !urlState || urlState !== storedState) {
    netejaRetorn();
    throw new Error('Estat OAuth no vàlid o absent. Possible atac CSRF.');
  }

  const verificador = getEfimer(CLAU_VERIFICADOR, null);
  if (!verificador) {
    netejaRetorn();
    throw new Error('S\'ha perdut el verificador d\'esta entrada. Torna a començar des del botó d\'entrar.');
  }
  const { supabaseUrl, supabaseAnonKey } = resolConfig(config);
  return bescanvia(codi, verificador, { supabaseUrl, supabaseAnonKey }).finally(() => netejaRetorn());
}

function netejaRetorn() {
  const u = new URL(window.location.href);
  u.searchParams.delete('sdp_code');
  u.searchParams.delete('sdp_oauth_error');
  u.searchParams.delete('code');
  u.searchParams.delete('error');
  u.searchParams.delete('error_description');
  
  if (u.hash.includes('code=') || u.hash.includes('sdp_code=') || u.hash.includes('error=')) {
    u.hash = '';
  }
  
  window.history.replaceState(null, '', u.pathname + u.search + u.hash);
}

/** Utilitat per a proves i per al tractor. */
export const _intern = { CLAU_VERIFICADOR, CLAU_TRASPAS, relayOrigin, base64url };
