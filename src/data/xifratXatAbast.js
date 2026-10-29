/**
 * src/data/xifratXatAbast.js — Predicat pur d'abast dels fils per a E2EE
 * (`sdp-xat-v1`, P1-12 / IDEA-19; `_investigacio_ia_de_poble/
 * 261028_2330_p112_e2ee_claude/disseny_final_e2ee.md` §3, §8.1 i §21.9).
 *
 * Polaritat inversa idèntica a `private.xat_e2ee_obligatori(fil)` (§7.3):
 *   · En clar només el que és públic de veres (`canal`, `comunitat`, fil de
 *     pàgina amb `subjecte_tipus` en grup/canal/comunitat) o el directe 1:1
 *     exacte amb la IAIA (`11111111-1a1a-0000-0000-000000000000`).
 *   · Tota la resta és d'abast xifrat (`directe` persona↔persona, `directe`
 *     persona↔entitat, `grup` privat sense subjecte, `personal`).
 *   · Regles que tanquen la rebaixa (IS-02, M3-b, M3-c):
 *       1. La IAIA no es pot injectar en un directe amb una altra persona: un
 *          directe amb la IAIA exigix exactament 1 contrapart que siga la IAIA
 *          i sense `org_id`/`comEntitat`. Si hi ha més participants, es bloqueja
 *          (`iaia-injectada`).
 *       2. Un `directe` no pot tindre subjecte (`directe-amb-subjecte`): es
 *          bloqueja.
 *       3. Marca apegalosa: un fil vist xifrat (`marcatApegalos`, `e2eeObligatori`,
 *          `epocaActual >= 1`, `capEpoca` o `e2eeDesDeSeq != null`) no torna
 *          mai a clar; si el servidor el presenta com a públic o IAIA, es
 *          bloqueja (`rebaixa-apegalos`).
 */

import { IAIA_UUID } from '../config/xifratXat.js';

const PREFIX_PER_DEFECTE = 'fil-defecte:';

const text = (valor) => (typeof valor === 'string' ? valor.trim() : '');

export function esFilSintetic(filId) {
  const id = text(filId);
  return !id || id.startsWith('fake-') || id.startsWith(PREFIX_PER_DEFECTE);
}

export function teMarcaApegalosa(conversa, marcatApegalos = false) {
  if (marcatApegalos === true) return true;
  if (!conversa || typeof conversa !== 'object') return false;
  const epoca = conversa.epocaActual ?? conversa.epoca_actual ?? 0;
  const cap = text(conversa.capEpoca ?? conversa.cap_epoca_hash);
  const desDeSeq = conversa.e2eeDesDeSeq ?? conversa.e2ee_des_de_seq ?? null;
  return conversa.e2eeObligatori === true
    || conversa.e2ee_obligatori === true
    || (Number.isInteger(epoca) && epoca >= 1)
    || Boolean(cap)
    || (desDeSeq !== null && desDeSeq !== undefined);
}

function esIdIaia(id) {
  return text(id).toLowerCase() === IAIA_UUID;
}

function contrapartsDe(conversa) {
  if (Array.isArray(conversa?.altres)) return conversa.altres;
  if (Array.isArray(conversa?.participants)) return conversa.participants;
  return null;
}

/**
 * Classifica l'abast E2EE d'una conversa de manera pura i determinista.
 * Retorna un objecte congelat:
 *   `{ xifrat, obligatori, bloquejat, apegalos, motiu, tipusFil }`
 */
export function ambitDelFil(conversa, { modeDades = 'remote', marcatApegalos = false } = {}) {
  const resultat = (xifrat, obligatori, bloquejat, apegalos, motiu, tipusFil = null) =>
    Object.freeze({ xifrat, obligatori, bloquejat, apegalos, motiu, tipusFil });

  if (modeDades !== 'remote') {
    return resultat(false, false, false, false, 'mode-no-remot', null);
  }
  if (!conversa || typeof conversa !== 'object' || Array.isArray(conversa)) {
    return resultat(true, true, true, Boolean(marcatApegalos), 'fil-desconegut', null);
  }
  const filId = text(conversa.id);
  if (!filId) {
    return resultat(true, true, true, Boolean(marcatApegalos), 'fil-desconegut', null);
  }
  if (esFilSintetic(filId)) {
    return resultat(false, false, false, false, 'fil-sintetic', null);
  }

  const apegalos = teMarcaApegalosa(conversa, marcatApegalos);
  const tipus = text(conversa.tipus);
  const subjecteTipus = text(conversa.subjecte_tipus ?? conversa.subjecteTipus ?? conversa.subjecte?.tipus ?? (typeof conversa.subjecte === 'string' ? conversa.subjecte : ''));
  const teSubjecte = Boolean(subjecteTipus || conversa.subjecte || conversa.subjecte_id || conversa.subjecteId);
  const orgId = text(conversa.org_id ?? conversa.orgId ?? (conversa.comEntitat && typeof conversa.comEntitat === 'string' ? conversa.comEntitat : ''));
  const esEntitat = Boolean(orgId || conversa.comEntitat === true);
  const altres = contrapartsDe(conversa);

  if (tipus === 'directe') {
    if (teSubjecte) {
      return resultat(true, true, true, apegalos, 'directe-amb-subjecte', 'directe');
    }
    const interlocutorId = text(conversa.interlocutor_id ?? conversa.interlocutorId);
    const llistaAltres = altres ?? (interlocutorId ? [{ id: interlocutorId, tipus: 'persona' }] : []);
    const conteIaia = Boolean(
      conversa.esIA === true
      || esIdIaia(interlocutorId)
      || llistaAltres.some((p) => esIdIaia(p?.id ?? p?.usuari_id ?? p))
    );

    if (conteIaia) {
      // xat_fils_meus declara el recompte total com a integer. Si arriba,
      // ha de confirmar el 1:1; els adaptadors antics poden ometre'l.
      const recompte = conversa.participants;
      const recompteCoherent = recompte === undefined || recompte === null || recompte === 2
        || (Array.isArray(recompte) && !Array.isArray(conversa.altres));
      const unicaIaia = !esEntitat
        && recompteCoherent
        && llistaAltres.length === 1
        && esIdIaia(llistaAltres[0]?.id ?? llistaAltres[0]?.usuari_id ?? llistaAltres[0]);
      if (!unicaIaia) {
        return resultat(true, true, true, apegalos, 'iaia-injectada', 'directe');
      }
      if (apegalos) {
        return resultat(true, true, true, true, 'rebaixa-apegalos', 'directe');
      }
      return resultat(false, false, false, false, 'iaia', null);
    }

    if (esEntitat) {
      return resultat(true, true, false, apegalos, 'directe-entitat', 'entitat');
    }

    if (llistaAltres.length === 1) {
      const altra = llistaAltres[0];
      const idAltra = text(altra?.id ?? altra?.usuari_id ?? altra);
      if (idAltra && !esIdIaia(idAltra) && (!altra?.tipus || altra.tipus === 'persona')) {
        return resultat(true, true, false, apegalos, 'directe-persona', 'directe');
      }
    }

    return resultat(true, true, true, apegalos, 'fil-incomplet', 'directe');
  }

  if (tipus === 'canal' || tipus === 'comunitat') {
    if (apegalos) {
      return resultat(true, true, true, true, 'rebaixa-apegalos', null);
    }
    return resultat(false, false, false, false, 'public', null);
  }

  if (tipus === 'grup') {
    if (teSubjecte) {
      if (apegalos) {
        return resultat(true, true, true, true, 'rebaixa-apegalos', 'grup');
      }
      return resultat(false, false, false, false, 'public', null);
    }
    return resultat(true, true, false, apegalos, 'grup-privat', 'grup');
  }

  if (tipus === 'personal') {
    return resultat(true, true, false, apegalos, 'personal', 'directe');
  }

  return resultat(true, true, true, apegalos, 'fil-incomplet', null);
}
