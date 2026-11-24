/**
 * eliminaPerATothomModel.js — Regles d'autoria humana multi-barret sense límit
 * temporal, execució diferida d'«Elimina per a tothom» i transport diferit
 * d'adjunts per mantindre lleugera l'arrencada estàtica (Onada v1.2.23 ·
 * R32.65_gemini · IDEA-342).
 */
import { publicaAdjuntXat, teCapacitat } from '../../data/backendPort.js';
import { capturaSessio } from '../../data/identitat.js';
import { esRebuigDeNormes } from '../../data/errorsBackend.js';
import {
  actualitzaFilAmbMissatge,
  fusionaPerSeq,
  mapejaMissatge,
  retiraPendent,
  trobaPendent
} from './missatges.js';
import {
  desfaEsborratSessioLocal,
  registraEsborratSessioLocal
} from './eliminaPerATothomPrevia.js';

const ROLS_ADMIN_GRUP = new Set(['admin', 'propietari', 'owner', 'administrador']);

export function esAdminDelFil(fil) {
  if (!fil || typeof fil !== 'object') return false;
  if (fil.esAdmin === true) return true;
  const rol = String(fil.rol ?? '').trim().toLowerCase();
  return rol !== '' && ROLS_ADMIN_GRUP.has(rol);
}

export function potEliminarMissatgePerATothom(missatge, { joId = null, orgIdsPermeses = null, fil = null } = {}) {
  if (!missatge || typeof missatge !== 'object') return false;
  if (missatge.tipus === 'sistema' || missatge.esborrat || missatge.esborratAl != null) return false;
  if (missatge.sender === 'me') return true;

  const jo = joId != null ? String(joId).trim() : '';
  const autorHuma = missatge.usuariId ?? missatge.authorId ?? missatge.autorId ?? null;
  if (jo && autorHuma != null && String(autorHuma).trim() === jo) return true;

  const orgMissatge = missatge.comOrgId
    ?? (missatge.comEntitat && typeof missatge.comEntitat === 'object' ? missatge.comEntitat.id : null)
    ?? missatge.authorOrgId
    ?? null;
  if (orgMissatge != null && orgIdsPermeses != null) {
    const orgClau = String(orgMissatge).trim();
    if (orgClau) {
      if (orgIdsPermeses instanceof Set && orgIdsPermeses.has(orgClau)) return true;
      if (Array.isArray(orgIdsPermeses) && orgIdsPermeses.some((id) => String(id).trim() === orgClau)) return true;
    }
  }

  return esAdminDelFil(fil);
}

export async function executaEliminaPerATothom({
  modeDades,
  filId,
  missatgeId,
  referencia,
  motorAccions,
  signal
}) {
  const motor = motorAccions ? await motorAccions.carrega().catch(() => null) : null;
  if (modeDades !== 'remote') {
    if (typeof motor?.eliminaPerATothom === 'function') {
      await motor.eliminaPerATothom(
        referencia ?? { id: missatgeId, missatgeId, filId, threadId: filId },
        { signal }
      ).catch(() => null);
    }
    return { estat: 'local', filId, missatgeId };
  }

  if (typeof motor?.eliminaPerATothom !== 'function') {
    throw Object.assign(
      new Error("Este servidor encara no permet eliminar missatges per a tothom."),
      { code: 'NO-DISPONIBLE' }
    );
  }
  const resposta = await motor.eliminaPerATothom(
    referencia ?? { id: missatgeId, missatgeId, filId, threadId: filId },
    { signal }
  );
  if (resposta?.estat === 'local') {
    throw Object.assign(
      new Error("No s'ha pogut eliminar el missatge per a tothom al servidor."),
      { code: 'XAT_ACCIONS_SQL_ABSENT' }
    );
  }
  return resposta;
}

export async function correEliminaPerATothomEnContext(ctx, ambit, valida, referencia, opcions = {}) {
  const {
    joId, modeDades, clauPersona, desmuntat, entornAccions, pendentsRef, missatgesRef, filActiuRef,
    esborratsPerATothomRef, motorAccions, mutaPendents, mutaMissatges,
    mutaEsborratsPerATothom, setErrorAccions
  } = ctx;
  const id = typeof referencia === 'string' ? referencia : referencia?.id ?? referencia?.missatgeId;
  const missatgeId = id != null ? String(id) : '';
  if (!missatgeId || !joId) return null;
  const pendent = trobaPendent(pendentsRef.current, missatgeId);
  if (pendent) {
    mutaPendents((previs) => retiraPendent(previs, missatgeId));
    return { estat: 'local', filId: pendent.filId, missatgeId };
  }
  let filId = typeof referencia === 'object' ? (referencia?.filId ?? referencia?.threadId ?? null) : null;
  if (!filId) {
    for (const [fId, llista] of Object.entries(missatgesRef.current)) {
      if (llista.some((m) => String(m.id) === missatgeId)) { filId = fId; break; }
    }
  }
  if (!filId) filId = filActiuRef.current;
  if (!filId) throw new Error('Este missatge ja no està disponible.');
  const araIso = new Date().toISOString();
  const tePrevi = Object.hasOwn(esborratsPerATothomRef.current, missatgeId);
  const valorPrevi = esborratsPerATothomRef.current[missatgeId];
  mutaEsborratsPerATothom((previs) => ({ ...previs, [missatgeId]: araIso }));
  if (modeDades !== 'remote') registraEsborratSessioLocal(clauPersona, missatgeId, araIso);
  try {
    valida();
    if (desmuntat.current || entornAccions.current.ambit !== ambit) {
      throw new DOMException('Operació cancel·lada.', 'AbortError');
    }
    const res = await executaEliminaPerATothom({
      modeDades,
      filId: String(filId),
      missatgeId,
      referencia,
      motorAccions,
      signal: opcions?.signal
    });
    valida();
    if (desmuntat.current || entornAccions.current.ambit !== ambit) {
      throw new DOMException('Operació cancel·lada.', 'AbortError');
    }
    const confirmatIso = typeof res?.esborratAl === 'string' && res.esborratAl ? res.esborratAl : araIso;
    mutaMissatges((previs) => {
      const actuals = previs[filId];
      if (!Array.isArray(actuals)) return previs;
      let tocat = false;
      const nous = actuals.map((m) => (String(m.id) === missatgeId
        ? (tocat = true, { ...m, text: '', metadades: {}, reaccions: [], destacat: false, fixat: false, esborrat: true, esborratAl: confirmatIso })
        : m));
      return tocat ? { ...previs, [filId]: nous } : previs;
    });
    return res ?? { estat: modeDades === 'remote' ? 'confirmat' : 'local', filId: String(filId), missatgeId, esborratAl: confirmatIso };
  } catch (error) {
    if (!desmuntat.current && entornAccions.current.ambit === ambit) {
      if (modeDades !== 'remote') desfaEsborratSessioLocal(clauPersona, missatgeId, tePrevi ? valorPrevi : null);
      mutaEsborratsPerATothom((previs) => {
        if (!Object.hasOwn(previs, missatgeId)) return previs;
        const nous = { ...previs };
        if (tePrevi) nous[missatgeId] = valorPrevi;
        else delete nous[missatgeId];
        return nous;
      });
      if (error?.name !== 'AbortError') setErrorAccions(error);
    }
    throw error;
  }
}

export async function executaSendChatMediaEnContext(ctx, op, fil, adjunt, { signal, onProgres } = {}) {
  const {
    joId, vigent, filsRef, visitantsRef, moderacioRef, operacio, config,
    mutaMissatges, mutaFils, relleuViu
  } = ctx;
  const { errorAdjuntXat, normalitzaUbicacioXat } = await import('../../data/xatMultimedia.js');
  const ubicacioEsperada = normalitzaUbicacioXat(adjunt?.ubicacio);
  if (adjunt?.conservaUbicacio === false && ubicacioEsperada) throw errorAdjuntXat('ubicacio-invalida');
  const adjuntPreparat = ubicacioEsperada ? { ...adjunt, ubicacio: ubicacioEsperada } : adjunt;
  if (!joId || !vigent(op) || signal?.aborted) throw new DOMException('La sessió ha canviat.', 'AbortError');
  const complet = filsRef.current.find((f) => f.id === fil?.id) || visitantsRef.current[fil?.id] || fil;
  if (!complet?.id || complet.potEscriure === false || (complet.tipus === 'canal' && complet.potEscriure !== true)) {
    throw new Error('No pots enviar fitxers en esta conversa.');
  }
  if (!teCapacitat('xatMultimedia')) throw new Error('Este node encara no permet enviar adjunts.');
  const sessioVigent = capturaSessio();
  const moderacio = moderacioRef.current;
  if (typeof moderacio?.asseguraNormes === 'function' && !(await moderacio.asseguraNormes())) {
    throw new DOMException('Cal acceptar les normes de convivència.', 'AbortError');
  }
  sessioVigent();
  const actual = operacio.current;
  if (!vigent(actual) || actual.llinatge !== op.llinatge || signal?.aborted) throw new DOMException('La sessió ha canviat.', 'AbortError');
  const controller = new AbortController();
  let vigilada = actual;
  let acabada = false;
  const avorta = () => controller.abort(new DOMException('La sessió ha canviat o l’enviament s’ha cancel·lat.', 'AbortError'));
  const asseguraVigent = () => {
    sessioVigent();
    const ara = operacio.current;
    if (controller.signal.aborted || !vigent(ara) || ara.llinatge !== op.llinatge) {
      throw controller.signal.reason ?? new DOMException('La sessió ha canviat.', 'AbortError');
    }
  };
  const segueixRelleu = () => {
    const anterior = vigilada;
    anterior.controller.signal.removeEventListener('abort', segueixRelleu);
    relleuViu(anterior).then((nova) => {
      if (acabada) return;
      sessioVigent();
      if (!vigent(nova) || nova.llinatge !== op.llinatge) { avorta(); return; }
      vigilada = nova;
      nova.controller.signal.addEventListener('abort', segueixRelleu, { once: true });
      if (nova.controller.signal.aborted) segueixRelleu();
    }).catch(avorta);
  };
  const revalidaSessio = () => { try { asseguraVigent(); } catch { avorta(); } };
  signal?.addEventListener('abort', avorta, { once: true });
  vigilada.controller.signal.addEventListener('abort', segueixRelleu, { once: true });
  globalThis.window?.addEventListener('sdp:auth-change', revalidaSessio);
  let desat;
  const publica = () => {
    asseguraVigent();
    const enVol = publicaAdjuntXat(complet.id, adjuntPreparat, { ...config, signal: controller.signal, onProgres });
    return new Promise((resol, rebutja) => {
      const cancel = () => rebutja(controller.signal.reason);
      if (controller.signal.aborted) cancel();
      else controller.signal.addEventListener('abort', cancel, { once: true });
      Promise.resolve(enVol).then(
        (valor) => { controller.signal.removeEventListener('abort', cancel); resol(valor); },
        (error) => { controller.signal.removeEventListener('abort', cancel); rebutja(error); },
      );
    });
  };
  try {
    try { desat = await publica(); }
    catch (error) {
      if (!esRebuigDeNormes(error) || typeof moderacio?.asseguraNormes !== 'function') throw error;
      const acceptades = await moderacio.asseguraNormes({ rebutjades: true });
      asseguraVigent();
      if (acceptades !== true) throw new DOMException('Cal acceptar les normes de convivència.', 'AbortError');
      desat = await publica();
    }
  } finally {
    acabada = true;
    signal?.removeEventListener('abort', avorta);
    vigilada.controller.signal.removeEventListener('abort', segueixRelleu);
    globalThis.window?.removeEventListener('sdp:auth-change', revalidaSessio);
  }
  asseguraVigent();
  const seq = typeof desat?.seq === 'number' ? desat.seq : typeof desat?.seq === 'string' && /^[1-9]\d*$/.test(desat.seq) ? Number(desat.seq) : NaN;
  if (!desat || desat.encuat === true || desat.id !== adjunt?.id || desat.filId !== complet.id
    || !Number.isSafeInteger(seq) || seq <= 0 || desat.tipus !== adjunt.tipus) {
    throw errorAdjuntXat('sense-confirmacio');
  }
  const ubicacioConfirmada = normalitzaUbicacioXat(desat.metadades?.ubicacio);
  if ((ubicacioConfirmada && (desat.metadades.ubicacio.lat !== ubicacioConfirmada.lat || desat.metadades.ubicacio.lng !== ubicacioConfirmada.lng))
    || (ubicacioEsperada && desat.ubicacioNoAdmesa !== true && (!ubicacioConfirmada || ubicacioConfirmada.lat !== ubicacioEsperada.lat || ubicacioConfirmada.lng !== ubicacioEsperada.lng))
    || ((!ubicacioEsperada || desat.ubicacioNoAdmesa === true || adjunt.conservaUbicacio === false) && ubicacioConfirmada)) {
    throw errorAdjuntXat('sense-confirmacio');
  }
  const definitiu = { ...mapejaMissatge(desat, joId), author: 'Jo' };
  mutaMissatges((previs) => ({ ...previs, [complet.id]: fusionaPerSeq(previs[complet.id] || [], [definitiu]) }));
  mutaFils((previs) => previs.map((f) => (f.id === complet.id ? actualitzaFilAmbMissatge(f, definitiu) : f)));
  return [desat.ubicacioNoAdmesa === true ? { ...definitiu, ubicacioNoAdmesa: true } : definitiu];
}
