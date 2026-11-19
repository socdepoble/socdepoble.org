/**
 * enviaDenunciaLssi.js — Costura R32.14 (Carril 1) entre el diàleg LSSI art. 16
 * de Gemini R32.13 (DialegDenunciaContingut.jsx) i els dos ports de denúncies
 * del backendPort: el diligent de Codex R32.13 (registraDenunciaDiligent) i
 * el de moderació de sempre (denunciaContingut).
 *
 * Regles (integracio/COSTURA_GEMINI_DENUNCIES.md de Codex, Llei 0):
 *  · Només publicacions, productes i esdeveniments amb un UUID real entren al
 *    workflow diligent. Els perfils, i qualsevol id que no siga UUID, van pel
 *    port de moderació: no s'inventa cap equivalència entre recurs i publicació.
 *  · El UUID d'operació el decidix qui crida, abans del primer intent, i es
 *    reutilitza en cada replay del mateix avís.
 *  · «Servidor» només quan el servidor ho confirma: el rebut diligent validat
 *    o { rebuda: true } del port de moderació en mode remot. El mode local de
 *    dades, sense xarxa o sense port no són mai un enviament remot.
 *  · Si el SQL diligent encara no és a producció (404 PGRST202) o el servidor
 *    el rebutja per a este recurs, es prova el port de moderació. Una fallada
 *    de xarxa no fa un segon intent per l'altre port: queda a la cua local.
 *
 * Torna { servidor: boolean, repetida: boolean, via }. Llança només els
 * rebutjos definitius de validació o de límit (codes del contracte de
 * moderació), que el diàleg mostra com a error conservant l'esborrany.
 */
import { denunciaContingut, registraDenunciaDiligent, teCapacitat } from '../../data/backendPort.js';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { normalitzaDenunciaDiligent } from '../../data/moderacio/denunciesDiligents.js';
import { detallPerAlPortModeracio, motiuPortModeracio } from './i18nDenunciaContingut.js';

export const TIPUS_DENUNCIA_DILIGENT = Object.freeze(['publicacio', 'producte', 'esdeveniment']);
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODIS_DEFINITIUS = new Set(['limit', 'objectiu-invalid', 'motiu-invalid', 'detall-massa-llarg']);
const TIPUS_AUTOR = new Set(['persona', 'entitat']);

/** UUID v4 per a una operació nova; null si l'entorn no té cap font aleatòria segura. */
export function nouIdOperacioDenuncia() {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === 'function') return c.randomUUID();
  if (typeof c?.getRandomValues !== 'function') return null;
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function teCapacitatSegura(nom) {
  try {
    return teCapacitat(nom) === true;
  } catch {
    return false;
  }
}

function esModeRemot(config) {
  try {
    return normalizeBackendConfig(config || {}).dataMode === 'remote';
  } catch {
    return false;
  }
}

/* Sense resposta del servidor (estat 0, temps esgotat o avortada): ni èxit
   ni rebuig. No es reintenta per l'altre port, per no duplicar l'avís. */
function esSenseResposta(err) {
  return err?.status === 0 || err?.name === 'TimeoutError' || err?.name === 'AbortError';
}

function entradaDiligent(tipus, id, motiu, detall, operacioId) {
  if (!TIPUS_DENUNCIA_DILIGENT.includes(tipus) || !RE_UUID.test(id) || typeof operacioId !== 'string') return null;
  if (!teCapacitatSegura('denunciesDiligents')) return null;
  try {
    return normalitzaDenunciaDiligent({ publicacioId: id, motiu, detall, operacioId });
  } catch {
    return null;
  }
}

export async function enviaDenunciaLssi({ objectiu, motiu, detall = '', operacioId = null, config = null } = {}) {
  const tipus = String(objectiu?.tipus ?? '').trim();
  const id = String(objectiu?.id ?? '').trim();
  if (!esModeRemot(config)) return { servidor: false, repetida: false, via: 'mode-local' };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { servidor: false, repetida: false, via: 'sense-xarxa' };
  }
  const motiuPort = motiuPortModeracio(motiu);
  const detallPort = detallPerAlPortModeracio(motiu, detall);

  const diligent = entradaDiligent(tipus, id, motiuPort, detallPort, operacioId);
  if (diligent) {
    try {
      const rebut = await registraDenunciaDiligent({ ...diligent }, config ?? {});
      return { servidor: true, repetida: rebut?.repetida === true, via: 'diligent' };
    } catch (err) {
      if (esSenseResposta(err)) return { servidor: false, repetida: false, via: 'sense-resposta' };
      /* El servidor ha respost però no hi ha rebut vàlid (SQL absent, recurs
         fora del workflow, permís o rebut incongruent): port de moderació. */
    }
  }

  if (!teCapacitatSegura('moderacio')) return { servidor: false, repetida: false, via: 'sense-port' };
  const autorTipus = String(objectiu?.autor?.tipus ?? '');
  const autorId = String(objectiu?.autor?.id ?? '');
  try {
    const resposta = await denunciaContingut({
      objecte: { tipus, id },
      motiu: motiuPort,
      detall: detallPort,
      autor: TIPUS_AUTOR.has(autorTipus) && autorId ? { tipus: autorTipus, id: autorId } : null,
      /* Gauntlet R32.14 · Una publicació del Mur públic (objectiuDeTargeta la marca) va per la RPC que en resol
         l'elegibilitat i l'autoria al servidor (denuncia_publicacio_mur). */
      ...(objectiu?.murPublic === true && RE_UUID.test(id) ? { murPublic: true } : {})
    }, config ?? {});
    if (resposta?.rebuda !== true) return { servidor: false, repetida: false, via: 'moderacio-sense-rebut' };
    return { servidor: true, repetida: resposta.repetida === true, via: 'moderacio' };
  } catch (err) {
    if (CODIS_DEFINITIUS.has(err?.code)) throw err;
    return { servidor: false, repetida: false, via: 'moderacio-no-disponible' };
  }
}
