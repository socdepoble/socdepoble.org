/* Onada 11 (261010; prompt 261010_1730, tasca 2) · El segon factor (TOTP) del
   superadmin: capacitat 'segonFactor' (contracte.js) sobre l'API MFA de GoTrue.
   private.es_superadmin() exigix aal2 (migració 2610061448): sense el segon
   factor confirmat en ESTA sessió, el Tauler no pot desar res.
   · Tot passa per request() (runtime.js) sobre /auth/v1/factors…: request()
     no reintenta un 401 a /auth/, així que abans de cada crida asseguraUsuari
     (auth.js) renova el JWT si li falta poc, com updateUserPassword.
   · verificaFactor rep de GoTrue una SESSIÓ NOVA (access_token amb aal2 i
     refresh_token nou; el vell queda revocat) i la desa en lloc de la vella
     amb la coreografia de renova(): dins del pany, triaRefresc(); si la
     pestanya viu del registre persistent, rotaRegistre; desaSessio com a
     renovació (la mateixa persona, la mateixa entrada); resetClient i
     sdp:auth-change, que fa que sessionService recalcule `nivell`.
   · En seed o local no hi ha GoTrue: llistaFactors torna [] i la resta
     rebutja amb 'no-disponible', sense cap petició.
   · El vocabulari de GoTrue (error_code) es queda ací: la interfície rep un
     `code` de CODI_SEGON_FACTOR (errorsBackend.js) i una frase en valencià;
     la resposta cruda viatja a `cause` i l'estat HTTP a `status`. */
import { request } from './runtime.js';
import { resetClient } from './config.js';
import { ambPany, asseguraUsuari, cosDeGoTrue, emetCanvi, esModeLocal } from './auth.js';
import { capturaSessio, desaSessio, nivellDAsseguranca, rotaRegistre, triaRefresc } from '../identitat.js';
import { CODI_SEGON_FACTOR, ambCodi, errorDeSegonFactor } from '../errorsBackend.js';

const RUTA_FACTORS = '/auth/v1/factors';
/* Un id de factor o de repte de GoTrue és un uuid; qualsevol altre text no
   pot ser cap factor del compte i no viatja a la URL. */
const ID_SEGUR = /^[A-Za-z0-9_-]{1,100}$/;
const MAXIM_NOM = 100;
const NOM_PER_DEFECTE = 'Sóc de Poble';
const EMISSOR_TOTP = 'Sóc de Poble';
const MISSATGE_SESSIO_NO_DESADA = 'El segon factor s’ha confirmat, però este navegador no ha pogut desar la sessió nova. Torna a entrar.';

const noDisponible = () => errorDeSegonFactor(CODI_SEGON_FACTOR.NO_DISPONIBLE);
const idSegur = (valor) => { const id = String(valor ?? '').trim(); return ID_SEGUR.test(id) ? id : null; };
/* GoTrue per REST torna el QR com a SVG cru (el prefix data URI l'afig només el
   client oficial, auth-js GoTrueClient.ts): el contracte promet un data URI
   per a posar-lo a <img src>. Un valor que ja n'és no es prefixa dos voltes. */
const aDataUri = (svg) => {
  const text = typeof svg === 'string' ? svg.trim() : '';
  if (!text) return '';
  return text.startsWith('data:') ? text : `data:image/svg+xml;utf-8,${encodeURIComponent(text)}`;
};

/* Un factor de GoTrue (GET /auth/v1/user → user.factors[]) en la forma del contracte. */
const factorDelContracte = (factor) => ({
  id: String(factor.id),
  nom: typeof factor.friendly_name === 'string' ? factor.friendly_name : '',
  tipus: 'totp',
  estat: factor.status === 'verified' ? 'verificat' : 'pendent'
});

/* error_code de l'API MFA de GoTrue → CODI_SEGON_FACTOR. Un 404 sense codi és
   un GoTrue sense l'API MFA (no habilitat), no un factor absent. */
function codiDeFactor(error) {
  const { status } = error;
  const codi = typeof cosDeGoTrue(error)?.error_code === 'string' ? cosDeGoTrue(error).error_code : '';
  if (codi === 'mfa_verification_failed' || codi === 'mfa_verification_rejected') return CODI_SEGON_FACTOR.CODI_INVALID;
  if (codi === 'mfa_challenge_expired') return CODI_SEGON_FACTOR.REPTE_CADUCAT;
  if (codi === 'mfa_factor_not_found') return CODI_SEGON_FACTOR.FACTOR_NO_TROBAT;
  if (codi === 'mfa_factor_name_conflict') return CODI_SEGON_FACTOR.NOM_REPETIT;
  if (codi === 'too_many_enrolled_mfa_factors') return CODI_SEGON_FACTOR.MASSA_FACTORS;
  if (/^mfa_.*_(?:not_enabled|disabled)$/.test(codi) || (status === 404 && !codi)) return CODI_SEGON_FACTOR.NO_HABILITAT;
  if (status === 401 || ['bad_jwt', 'session_not_found', 'session_expired'].includes(codi)) return CODI_SEGON_FACTOR.SENSE_SESSIO;
  return CODI_SEGON_FACTOR.DESCONEGUT;
}

/** L'error traduït, o l'original tal qual si no es tradueix (un AbortError, un error de codi). */
function traduixErrorDeFactor(error) {
  if (!error || typeof error !== 'object' || error.name === 'AbortError') return error;
  if (Object.values(CODI_SEGON_FACTOR).includes(error.code)) return error;
  const traduit = errorDeSegonFactor(codiDeFactor(error), error);
  if (error.status !== undefined) traduit.status = error.status;
  return traduit;
}

/* La sessió viva amb un JWT que no caducarà pel camí, o 'sense-sessio'. */
async function sessioPerAFactors(config, current) {
  const user = await asseguraUsuari(config, current);
  current();
  if (!user) throw errorDeSegonFactor(CODI_SEGON_FACTOR.SENSE_SESSIO);
  return user;
}

/**
 * Els factors TOTP del compte: GET /auth/v1/user → user.factors[]. Buida sense
 * sessió o sense servidor d'autenticació (seed, local).
 */
export async function llistaFactors(config = {}) {
  if (esModeLocal(config)) return [];
  const current = capturaSessio();
  const user = await asseguraUsuari(config, current);
  current();
  if (!user) return [];
  const usuari = await request('/auth/v1/user', config).catch((error) => { throw traduixErrorDeFactor(error); });
  current();
  const factors = Array.isArray(usuari?.factors) ? usuari.factors : [];
  return factors
    .filter((factor) => factor && factor.id != null && (factor.factor_type ?? 'totp') === 'totp')
    .map(factorDelContracte);
}

/**
 * Inscriu un factor TOTP pendent: POST /auth/v1/factors. Torna el QR (SVG com
 * a data URI), el secret per a escriure'l a mà i l'otpauth://. El factor no
 * val fins que verificaFactor confirma el primer codi.
 */
export async function inscriuFactor(nom, config = {}) {
  if (esModeLocal(config)) throw noDisponible();
  const current = capturaSessio();
  await sessioPerAFactors(config, current);
  const friendly = String(nom ?? '').trim().slice(0, MAXIM_NOM) || NOM_PER_DEFECTE;
  const factor = await request(RUTA_FACTORS, config, {
    method: 'POST', body: { factor_type: 'totp', friendly_name: friendly, issuer: EMISSOR_TOTP }
  }).catch((error) => { throw traduixErrorDeFactor(error); });
  current();
  if (!factor?.id || !factor?.totp) throw errorDeSegonFactor(CODI_SEGON_FACTOR.DESCONEGUT);
  return {
    id: String(factor.id),
    qr: aDataUri(factor.totp.qr_code),
    secret: typeof factor.totp.secret === 'string' ? factor.totp.secret : '',
    uri: typeof factor.totp.uri === 'string' ? factor.totp.uri : ''
  };
}

/** Obri un repte del factor: POST /auth/v1/factors/{id}/challenge → { repteId, caduca }. */
export async function reptaFactor(factorId, config = {}) {
  if (esModeLocal(config)) throw noDisponible();
  const id = idSegur(factorId);
  if (!id) throw errorDeSegonFactor(CODI_SEGON_FACTOR.FACTOR_NO_TROBAT);
  const current = capturaSessio();
  await sessioPerAFactors(config, current);
  const repte = await request(`${RUTA_FACTORS}/${id}/challenge`, config, { method: 'POST', body: {} })
    .catch((error) => { throw traduixErrorDeFactor(error); });
  current();
  if (!repte?.id) throw errorDeSegonFactor(CODI_SEGON_FACTOR.DESCONEGUT);
  /* GoTrue torna expires_at en segons Unix. */
  const caduca = typeof repte.expires_at === 'number' ? new Date(repte.expires_at * 1000).toISOString() : null;
  return { repteId: String(repte.id), caduca };
}

/**
 * Confirma el codi del repte: POST /auth/v1/factors/{id}/verify. La resposta
 * és la sessió nova (aal2), que substituïx la vella amb la coreografia de
 * renova() (auth.js) i avisa amb sdp:auth-change. Torna { nivell } del JWT
 * nou ('aal2' si el token no és llegible).
 */
export async function verificaFactor({ factorId, repteId, codi } = {}, config = {}) {
  if (esModeLocal(config)) throw noDisponible();
  const id = idSegur(factorId);
  const repte = idSegur(repteId);
  if (!id) throw errorDeSegonFactor(CODI_SEGON_FACTOR.FACTOR_NO_TROBAT);
  if (!repte) throw errorDeSegonFactor(CODI_SEGON_FACTOR.REPTE_CADUCAT);
  const code = String(codi ?? '').replace(/\s+/g, '');
  if (!/^\d{4,10}$/.test(code)) throw errorDeSegonFactor(CODI_SEGON_FACTOR.CODI_INVALID);
  const current = capturaSessio();
  await sessioPerAFactors(config, current);
  /* Dins del pany de renovació: una altra pestanya no rota el registre mentre
     esta canvia de sessió, i el refresh token nou es desa abans que ningú
     torne a gastar el vell (que GoTrue acaba de revocar). */
  return ambPany(undefined, async () => {
    current();
    const sessio = await request(`${RUTA_FACTORS}/${id}/verify`, config, { method: 'POST', body: { challenge_id: repte, code } })
      .catch((error) => { throw traduixErrorDeFactor(error); });
    if (!sessio?.access_token || !sessio?.user?.id) throw errorDeSegonFactor(CODI_SEGON_FACTOR.DESCONEGUT);
    current();
    const tria = triaRefresc();
    if (tria && tria.mode !== 'efimer') rotaRegistre(tria.rt, sessio.refresh_token, tria.sub);
    if (!desaSessio(sessio, { renovacio: true })) throw ambCodi(new Error(MISSATGE_SESSIO_NO_DESADA), CODI_SEGON_FACTOR.DESCONEGUT);
    resetClient();
    emetCanvi(sessio.user);
    return { nivell: nivellDAsseguranca(sessio.access_token) ?? 'aal2' };
  });
}

/** Retira un factor: DELETE /auth/v1/factors/{id} → { id }. */
export async function retiraFactor(factorId, config = {}) {
  if (esModeLocal(config)) throw noDisponible();
  const id = idSegur(factorId);
  if (!id) throw errorDeSegonFactor(CODI_SEGON_FACTOR.FACTOR_NO_TROBAT);
  const current = capturaSessio();
  await sessioPerAFactors(config, current);
  const resposta = await request(`${RUTA_FACTORS}/${id}`, config, { method: 'DELETE' })
    .catch((error) => { throw traduixErrorDeFactor(error); });
  current();
  return { id: String(resposta?.id ?? id) };
}
