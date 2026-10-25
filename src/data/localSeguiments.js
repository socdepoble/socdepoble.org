/**
 * localSeguiments.js — Els seguiments (capacitat 'seguiments'; T6b, IDEA-14,
 * decisió del Mestre, 261024) per als modes `seed` i `local`.
 *
 * L'adaptador de src/data/supabase/seguiments.js hi delega quan el mode de
 * dades no és remot, com organizations.js a localPerfils: este mòdul fa de
 * servidor, amb les MATEIXES regles que les RPC de
 * supabase/migrations/2610241430_seguiments.sql:
 *   · una persona, només si és del padró local de persones (PERSONES_SEED: en
 *     local només hi ha un poble) i no és qui crida. Amb sessió, la fitxa de
 *     qui entra és la de la persona pilot (localPerfils), i els seus àlies
 *     també són seus;
 *   · una entitat, la fitxa del padró (loadPerfilPublic de localPerfils, de
 *     tipus 'entitat' o 'grup'; en la llavor totes són públiques), mai una
 *     que administres (`propietari`);
 *   · cap bloqueig de qui crida: l'adaptador li passa els seus (la moderació
 *     local només coneix els que posa la mateixa persona; el de l'altra banda
 *     no existix ací, i al servidor és a l'ombra: no canvia res per a qui
 *     seguix);
 *   · deixar de seguir és un esborrat suau: la fila es queda amb `deixatAl`.
 *     Tornar-la a seguir la reprén (`reactivatAl`) com a molt una vegada cada
 *     ESPERA_DE_REPRESA, comptada des de l'última represa o, si no n'hi ha
 *     cap, des de l'alta (Gauntlet 261024_1945, Gemini G1945-03: la primera
 *     represa ja no és lliure), i `primer` (i `nou`, el mateix valor) només és true
 *     la primera vegada de totes que la parella se seguix;
 *   · LIMIT_PER_HORA altes o represes per hora, en una finestra lliscant i
 *     comptades al registre de les altes (`altes`: un moment per cada alta o
 *     represa acceptada, que ni deixar de seguir ni tornar a seguir no
 *     esborren; T2 261024_1800, Codex C6-01: abans es comptaven files, i una
 *     parella represa diverses vegades en una hora hi pesava una sola), i
 *     LIMIT_TOTAL vius;
 *   · quiEmSegueix({ orgId }) només per a qui administra l'entitat.
 * IDEA-22 (pla 261025_0045, T5; Directiva del Mestre 261025) · Connectar des
 * d'una entitat, com 2610250100_seguiments_des_d_entitat.sql: amb `com` (al
 * mateix objecte que el seguit), qui seguix és l'entitat `com`, si qui crida
 * l'administra (la fitxa del padró en diu `propietari`, el rol owner o admin
 * de localPerfils · rolDe); si no, SDP-SEG-007. Les files de les entitats
 * van a part (`filesDEntitats`): una entitat seguix cada destí com a molt una
 * vegada, la faça qui la faça de les que l'administren, i qualsevol la pot
 * deixar. Una entitat no se seguix a ella mateixa (SDP-SEG-003); sí una altra
 * que també administres, o una persona (també qui actua). La quota per hora
 * és la del registre de la PERSONA que actua (`altes`), mai de l'entitat; els
 * bloquejos, els seus; els LIMIT_TOTAL vius, de qui seguix (la persona o
 * l'entitat). quiEmSegueix torna `tipus` ('persona' o 'entitat'): d'una
 * entitat, el seu id i el seu nom, mai els de qui ho va fer, i se'n queda
 * fora si qui crida ha bloquejat l'entitat o la persona que hi va fer
 * l'última alta o represa (`actor`, el seguidor del servidor).
 * Una lectura només torna seguiments vius, amaga el que tapa un bloqueig de
 * qui crida, com el servidor, i va per data (des de quan se seguix ara, la
 * més nova primer). Els errors porten els codis de MISSATGES_SEGUIMENTS.
 *
 * Singleton de mòdul en memòria, com localXat i localPerfils: cap dada a
 * localStorage (tractor-persistencia L2) i cap xarxa. Es perd en recarregar,
 * a posta. El rellotge és injectable (`ara`) per a les proves.
 */
import { PERSONA_PILOT } from './identitatsSeed.js';
import { PERSONES_SEED, localPerfils } from './localPerfils.js';
import { comDelContracte, errorDeSeguiment, seguitDelContracte } from './contracte.js';

/* Els sostres de public.segueix (2610241430). 30 altes o represes per hora: Gauntlet 261024_1945
   (Codex G-01, Gemini G1945-02). */
export const LIMIT_PER_HORA = 30;
export const LIMIT_TOTAL = 1000;
export const ESPERA_DE_REPRESA = 10 * 60 * 1000;
const UNA_HORA = 60 * 60 * 1000;
/* Qui seguix sense fitxa local (el convidat): el nom de reserva dels membres (localPerfils). */
const NOM_DE_RESERVA = 'Veí/na';
const TIPUS_D_ENTITAT = new Set(['entitat', 'grup']);

const clauDe = ({ tipus, id }) => `${tipus}:${id}`;
/* La més nova primer; a la mateixa hora, per id (el servidor: coalesce(reactivat_al, creat_al) desc, id). */
const perData = (a, b) => (a.creatAl === b.creatAl ? String(a.id).localeCompare(String(b.id)) : (a.creatAl < b.creatAl ? 1 : -1));
/* Des de quan se seguix ara: la darrera represa o, si no n'hi ha, l'alta. */
const desDe = (fila) => fila.reactivatAl || fila.creatAl;
const viva = (fila) => Boolean(fila) && !fila.deixatAl;
const despresDe = (iso, limit) => Boolean(iso) && Date.parse(iso) > limit;

/**
 * `perfils` (opcional, per a les proves): qui resol les fitxes i el nom de
 * qui seguix. Per defecte, localPerfils. `persones`: el padró local de
 * persones que es poden seguir. Per defecte, PERSONES_SEED.
 */
export function createLocalSeguimentsAdapter({ perfils = localPerfils, persones = PERSONES_SEED, ara = () => new Date() } = {}) {
  /* qui seguix → Map(clau del seguit → { tipus, id, nom, creatAl, reactivatAl, deixatAl, nomSeguidor }). */
  let files = new Map();
  /* T2 · qui seguix → [ms de cada alta o represa de l'última hora] (private.seguiments_altes). */
  let altes = new Map();
  /* IDEA-22 · l'entitat que seguix → Map(clau del seguit → fila, amb `actor`: qui hi va fer l'última alta o represa). */
  let filesDEntitats = new Map();

  const delPadro = (id) => persones.find((p) => String(p.id) === String(id)) || null;
  /* Els identificadors de qui crida: el seu id i, amb sessió, els de la persona pilot. */
  const propis = (usuari, qui) => new Set([String(qui), ...(usuari?.id ? [String(usuari.id), ...PERSONA_PILOT.alies] : [])]);
  const fitxaDEntitat = (id, usuari) => {
    const fitxa = perfils.loadPerfilPublic(id, usuari);
    return fitxa && TIPUS_D_ENTITAT.has(fitxa.tipus) ? fitxa : null;
  };
  /* L'id canònic d'un seguit (el slug d'una entitat porta al seu id), o el demanat. */
  const canonic = (seguit, usuari) => {
    if (seguit.tipus === 'persona') return { tipus: 'persona', id: String(delPadro(seguit.id)?.id ?? seguit.id) };
    return { tipus: 'entitat', id: String(fitxaDEntitat(seguit.id, usuari)?.id ?? seguit.id) };
  };
  const esBloquejat = (seguit, bloquejos) => (Array.isArray(bloquejos) ? bloquejos : [])
    .some((b) => b?.tipus === seguit.tipus && String(b.id) === String(seguit.id));
  const nomDeQuiSeguix = (usuari) => (usuari?.id ? perfils.getProfile(usuari)?.full_name || null : null);
  /* IDEA-22 · L'entitat amb què es connecta (`com`), si qui crida l'administra; sense `com`, null. */
  const entitatDeCom = (dades, usuari) => {
    const com = comDelContracte(dades);
    if (com === null) return null;
    const fitxa = fitxaDEntitat(com, usuari);
    if (!fitxa?.propietari) throw errorDeSeguiment('SDP-SEG-007');
    return fitxa;
  };

  /* El seguit resolt contra el padró, amb l'ordre de les portes de public.segueix.
     IDEA-22 · Com a `entitat`, 003 només per a ella mateixa. */
  function resol(dades, usuari, qui, bloquejos, entitat = null) {
    const seguit = seguitDelContracte(dades);
    if (seguit.tipus === 'persona') {
      if (!entitat && propis(usuari, qui).has(seguit.id)) throw errorDeSeguiment('SDP-SEG-003');
      if (esBloquejat(seguit, bloquejos)) throw errorDeSeguiment('SDP-SEG-004');
      const persona = delPadro(seguit.id);
      if (!persona) throw errorDeSeguiment('SDP-SEG-002');
      return { tipus: 'persona', id: String(persona.id), nom: persona.nom || null };
    }
    const fitxa = fitxaDEntitat(seguit.id, usuari);
    if (entitat ? fitxa && String(fitxa.id) === String(entitat.id) : fitxa?.propietari) throw errorDeSeguiment('SDP-SEG-003');
    if (esBloquejat(seguit, bloquejos) || (fitxa && esBloquejat({ tipus: 'entitat', id: fitxa.id }, bloquejos))) {
      throw errorDeSeguiment('SDP-SEG-004');
    }
    if (!fitxa) throw errorDeSeguiment('SDP-SEG-002');
    return { tipus: 'entitat', id: String(fitxa.id), nom: fitxa.nom || null };
  }

  /* Les files de qui seguix: la persona o, amb `entitat`, l'entitat. */
  const magatzemDe = (entitat) => (entitat ? filesDEntitats : files);
  const clauDelSeguidor = (qui, entitat) => String(entitat ? entitat.id : qui);
  const filesDe = (qui, entitat = null) => {
    const magatzem = magatzemDe(entitat);
    const clau = clauDelSeguidor(qui, entitat);
    if (!magatzem.has(clau)) magatzem.set(clau, new Map());
    return magatzem.get(clau);
  };

  return {
    /**
     * Seguix una persona o una entitat. Idempotent: `nou` i `primer` false si
     * ja la seguia. Una fila deixada es reprén (també amb `primer` false):
     * només la primera vegada de totes dona `primer` true.
     */
    segueix(dades, { usuari = null, qui = null, bloquejos = [] } = {}) {
      if (!qui) throw errorDeSeguiment('SDP-SEG-000');
      seguitDelContracte(dades);
      const entitat = entitatDeCom(dades, usuari);
      const seguit = resol(dades, usuari, qui, bloquejos, entitat);
      const meues = filesDe(qui, entitat);
      const nomSeguidor = entitat ? entitat.nom || null : nomDeQuiSeguix(usuari);
      const ja = meues.get(clauDe(seguit));
      if (viva(ja)) return { seguint: true, creatAl: desDe(ja), nou: false, primer: false };
      const moment = ara();
      const ms = moment.getTime();
      if (ja && despresDe(ja.reactivatAl || ja.creatAl, ms - ESPERA_DE_REPRESA)) throw errorDeSeguiment('SDP-SEG-006');
      /* La poda i el compte del registre de la PERSONA que actua (com segueix: les de més d'una hora se'n van). */
      const delRegistre = (altes.get(String(qui)) || []).filter((al) => al > ms - UNA_HORA);
      altes.set(String(qui), delRegistre);
      if (delRegistre.length >= LIMIT_PER_HORA || [...meues.values()].filter(viva).length >= LIMIT_TOTAL) throw errorDeSeguiment('SDP-SEG-006');
      delRegistre.push(ms);
      if (ja) {
        Object.assign(ja, { nom: seguit.nom, reactivatAl: moment.toISOString(), deixatAl: null, nomSeguidor, actor: String(qui) });
        return { seguint: true, creatAl: ja.reactivatAl, nou: false, primer: false };
      }
      const fila = { ...seguit, creatAl: moment.toISOString(), reactivatAl: null, deixatAl: null, nomSeguidor, actor: String(qui) };
      meues.set(clauDe(seguit), fila);
      return { seguint: true, creatAl: fila.creatAl, nou: true, primer: true };
    },

    /**
     * Deixa de seguir: marca la fila viva (esborrat suau). Idempotent: també
     * si no la seguia, i sense cap altra porta que, amb `com`, administrar l'entitat.
     */
    deixaDeSeguir(dades, { usuari = null, qui = null } = {}) {
      if (!qui) throw errorDeSeguiment('SDP-SEG-000');
      const seguit = seguitDelContracte(dades);
      const entitat = entitatDeCom(dades, usuari);
      const meues = magatzemDe(entitat).get(clauDelSeguidor(qui, entitat));
      if (meues) {
        const moment = ara().toISOString();
        for (const clau of new Set([clauDe(seguit), clauDe(canonic(seguit, usuari))])) {
          const fila = meues.get(clau);
          if (viva(fila)) fila.deixatAl = moment;
        }
      }
      return { seguint: false };
    },

    /** Si qui crida (o, amb `com`, l'entitat que administra) la seguix ara (només el bloqueig de qui crida l'amaga). */
    estatSeguiment(dades, { usuari = null, qui = null, bloquejos = [] } = {}) {
      const seguit = seguitDelContracte(dades);
      if (!qui) return { seguint: false, creatAl: null };
      const entitat = entitatDeCom(dades, usuari);
      const fila = magatzemDe(entitat).get(clauDelSeguidor(qui, entitat))?.get(clauDe(canonic(seguit, usuari)));
      if (!viva(fila) || esBloquejat(fila, bloquejos)) return { seguint: false, creatAl: null };
      return { seguint: true, creatAl: desDe(fila) };
    },

    /** A qui seguix qui crida, la més nova primer. */
    elsMeusSeguiments({ qui = null, bloquejos = [] } = {}) {
      if (!qui) return [];
      return [...(files.get(String(qui))?.values() || [])]
        .filter((fila) => viva(fila) && !esBloquejat(fila, bloquejos))
        .map((fila) => ({ tipus: fila.tipus, id: fila.id, nom: fila.nom, creatAl: desDe(fila) }))
        .sort(perData);
    },

    /**
     * Qui seguix qui crida (sense orgId) o l'entitat orgId, només per a qui
     * l'administra (si no, SDP-SEG-005, també si no existix): les persones i,
     * IDEA-22, les entitats, amb el seu `tipus`. Amaga qui crida ha bloquejat.
     */
    quiEmSegueix(opcions = {}, { usuari = null, qui = null, bloquejos = [] } = {}) {
      if (!qui) return [];
      const orgId = opcions?.orgId ?? null;
      let esDelSeguit;
      if (orgId === null || orgId === '') {
        const jo = propis(usuari, qui);
        esDelSeguit = (fila) => fila.tipus === 'persona' && jo.has(fila.id);
      } else {
        const { id } = seguitDelContracte({ tipus: 'entitat', id: orgId });
        const fitxa = fitxaDEntitat(id, usuari);
        if (!fitxa?.propietari) throw errorDeSeguiment('SDP-SEG-005');
        esDelSeguit = (fila) => fila.tipus === 'entitat' && fila.id === String(fitxa.id);
      }
      const llista = [];
      for (const [seguidor, meues] of files) {
        if (esBloquejat({ tipus: 'persona', id: seguidor }, bloquejos)) continue;
        for (const fila of meues.values()) {
          if (viva(fila) && esDelSeguit(fila)) llista.push({ tipus: 'persona', id: seguidor, nom: fila.nomSeguidor || NOM_DE_RESERVA, creatAl: desDe(fila) });
        }
      }
      /* IDEA-22 · D'una entitat, el seu id i el seu nom; fora si qui crida l'ha bloquejada, o la persona que hi va actuar. */
      for (const [entitatId, meues] of filesDEntitats) {
        if (esBloquejat({ tipus: 'entitat', id: entitatId }, bloquejos)) continue;
        for (const fila of meues.values()) {
          if (viva(fila) && esDelSeguit(fila) && !esBloquejat({ tipus: 'persona', id: fila.actor }, bloquejos)) {
            llista.push({ tipus: 'entitat', id: entitatId, nom: fila.nomSeguidor || null, creatAl: desDe(fila) });
          }
        }
      }
      return llista.sort(perData);
    },

    /** Per a les proves: oblida els seguiments. */
    reinicia() { files = new Map(); altes = new Map(); filesDEntitats = new Map(); }
  };
}

export const localSeguiments = createLocalSeguimentsAdapter();
export const reiniciaLocalSeguiments = () => localSeguiments.reinicia();
