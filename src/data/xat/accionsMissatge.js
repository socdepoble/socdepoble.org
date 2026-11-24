import { rebutEliminacioMissatge } from './rebutEliminacioMissatge.js';
import { MAXIM_ADJUNT_XAT } from '../xatMultimedia.js';
/* v1.2.8 · La projecció pura viu en un mòdul sense dependències: XatContext la necessita a l'arrencada
   i el motor (amb xatMultimedia.js) es carrega en diferit. */
export { projectaAccionsMissatges } from './projeccioAccionsMissatges.js';
/** R32.7 · Sidecar de sessió. Ni seq, ni missatges autoritaris, ni Storage
 * persistent. Les operacions optimistes tenen revisió per funció/missatge. */
const abortat = () => new DOMException('La sessió o la conversa han canviat.', 'AbortError');
const error = (text, code = 'XAT_ACCIO_INVALIDA') => Object.assign(new Error(text), { code });
const buida = (m) => ({ missatgeId: m.id, filId: m.threadId ?? m.filId, reaccions: [], destacat: false, fixat: false, amagat: false });
const camps = { alternaReaccio: 'reaccions', alternaDestacat: 'destacat', alternaFixat: 'fixat', eliminaPerAMi: 'amagat' };

export function creaAccionsMissatge({ port, obteContext, obteMissatge, onCanvi = () => {},
  creaPrivat, obreFil = () => {}, onEliminaConfirmada = () => {}, enviaText, enviaAdjunt, lligBlob, generaId = () => crypto.randomUUID(), maximBlobsBytes = 20_000_000 }) {
  let clau = null, perMissatge = {}, destacats = [], esborranyPrivat = null, tancat = false;
  let bytesBlobs = 0, generacioBlobs = 0;
  const pressupostBlobs = Math.min(20_000_000, Number.isSafeInteger(maximBlobsBytes) && maximBlobsBytes > 0 ? maximBlobsBytes : 20_000_000);
  const revisions = new Map(), confirmats = new Map(), cues = new Map(), controls = new Set(), manifests = new Map();
  const snapshot = () => ({ perMissatge, destacats, esborranyPrivat });
  const publica = () => { if (!tancat) onCanvi(snapshot()); };
  const retiraBlob = (manifest, id) => {
    if (manifest.generacioBlobs === generacioBlobs) bytesBlobs = Math.max(0, bytesBlobs - (manifest.reserves.get(id) ?? 0));
    manifest.reserves.delete(id); manifest.blobs.delete(id);
  };
  const retiraBlobs = manifest => { for (const id of [...manifest.reserves.keys()]) retiraBlob(manifest, id); };
  const sincronitza = () => {
    const ctx = obteContext();
    if (ctx.clau !== clau) {
      for (const control of controls) control.abort(abortat());
      controls.clear(); revisions.clear(); confirmats.clear(); cues.clear(); manifests.clear();
      bytesBlobs = 0; generacioBlobs += 1; clau = ctx.clau; perMissatge = {}; destacats = []; esborranyPrivat = null; publica();
    }
    return ctx;
  };
  const revalida = () => { try { sincronitza(); } catch { for (const c of controls) c.abort(abortat()); } };
  const captura = (signal) => {
    const ctx = sincronitza();
    if (tancat || !ctx.actiu || !ctx.usuariId || signal?.aborted) throw abortat();
    const control = new AbortController(); controls.add(control);
    const avorta = () => control.abort(abortat()); signal?.addEventListener('abort', avorta, { once: true });
    const comprova = () => {
      const actual = obteContext();
      if (tancat || control.signal.aborted || !actual.actiu || actual.clau !== ctx.clau) throw abortat();
      ctx.comprova?.();
    };
    const acaba = () => { controls.delete(control); signal?.removeEventListener('abort', avorta); };
    return { ctx, control, comprova, acaba };
  };
  const espera = (promesa, op) => new Promise((resolve, reject) => {
    const cancella = () => reject(abortat());
    if (op.control.signal.aborted) cancella();
    else op.control.signal.addEventListener('abort', cancella, { once: true });
    Promise.resolve(promesa).then(v => {
      op.control.signal.removeEventListener('abort', cancella);
      try { op.comprova(); resolve(v); } catch (e) { reject(e); }
    }, e => { op.control.signal.removeEventListener('abort', cancella); reject(e); });
  });
  const font = (referencia) => {
    const m = obteMissatge(referencia);
    if (!m?.id || perMissatge[m.id]?.esborrat === true || !(m.threadId ?? m.filId) || m.bloquejat || m.esborrat || m.estatEnviament === 'pendent' || m.estatEnviament === 'error') {
      throw error('Este missatge ja no està disponible.');
    }
    return m;
  };
  const desa = (id, parcial) => { if (perMissatge[id]?.esborrat === true) return; perMissatge = { ...perMissatge, [id]: { ...perMissatge[id], ...parcial } }; publica(); };

  async function muta(nom, referencia, valor, extra = {}) {
    const op = captura(extra.signal);
    let m;
    try { m = font(referencia); } catch (e) { op.acaba(); throw e; }
    const camp = camps[nom];
    const base = perMissatge[m.id] ?? buida(m), clauRevisio = `${m.id}:${camp}`;
    if (!confirmats.has(clauRevisio)) confirmats.set(clauRevisio, base[camp]);
    const revisio = (revisions.get(clauRevisio) ?? 0) + 1; revisions.set(clauRevisio, revisio);
    let optimista;
    const dades = { filId: base.filId, missatgeId: m.id };
    if (nom === 'alternaReaccio') {
      const emoji = String(valor ?? '');
      if (!emoji.trim() || [...emoji].length > 16) { op.acaba(); throw error('Tria una emoticona vàlida.'); }
      const activa = typeof extra.activa === 'boolean' ? extra.activa : !base.reaccions.some(r => r.emoji === emoji && r.meua);
      optimista = base.reaccions.map(r => r.meua && (activa || r.emoji === emoji) ? { ...r, total: r.total - 1, meua: false } : r).filter(r => r.total > 0);
      if (activa) {
        const existent = optimista.find(r => r.emoji === emoji);
        optimista = existent ? optimista.map(r => r === existent ? { ...r, total: r.total + 1, meua: true } : r) : [...optimista, { emoji, total: 1, meua: true }];
      }
      Object.assign(dades, { emoji, activa });
    } else {
      optimista = nom === 'eliminaPerAMi' ? true : typeof valor === 'boolean' ? valor : !base[camp];
      if (nom !== 'eliminaPerAMi') dades.actiu = optimista;
    }
    desa(m.id, { ...base, [camp]: optimista, estat: 'pendent' });
    // Serialitza la intenció de cada funció: el darrer gest també és el darrer al servidor.
    const anterior = cues.get(clauRevisio) ?? Promise.resolve();
    const feina = anterior.catch(() => {}).then(async () => {
      op.comprova();
      let estat = 'confirmat', resultat;
      try {
        if (op.ctx.modeDades !== 'remote') estat = 'local';
        else resultat = await espera(port[nom](dades, { ...obteContext().config, signal: op.control.signal }), op);
      } catch (e) {
        op.comprova();
        if (e?.code !== 'XAT_ACCIONS_SQL_ABSENT') throw e;
        estat = 'local';
      }
      op.comprova();
      confirmats.set(clauRevisio, resultat ? resultat[camp] : optimista);
      const altresPendents = [...cues.keys()].some(k => k.startsWith(`${m.id}:`) && k !== clauRevisio);
      if (revisions.get(clauRevisio) === revisio) desa(m.id, { [camp]: confirmats.get(clauRevisio), estat: altresPendents ? 'pendent' : estat });
      return { estat, missatgeId: m.id, filId: base.filId, [camp]: resultat ? resultat[camp] : optimista };
    }).catch(e => {
      try {
        op.comprova();
        if (revisions.get(clauRevisio) === revisio) desa(m.id, { [camp]: confirmats.get(clauRevisio), estat: 'error' });
      } catch { /* Una altra sessió mai no rep rollback ni estat anterior. */ }
      throw e;
    }).finally(() => { op.acaba(); if (cues.get(clauRevisio) === feina) cues.delete(clauRevisio); });
    cues.set(clauRevisio, feina); return feina;
  }

  async function eliminaPerATothom(referencia, { signal } = {}) {
    const op = captura(signal);
    try {
      const m = font(referencia), dades = { filId: m.threadId ?? m.filId, missatgeId: m.id };
      if (op.ctx.modeDades !== 'remote' || typeof port.eliminaPerATothom !== 'function') throw error('Este servidor encara no permet eliminar per a tothom.', 'XAT_ACCIONS_SQL_ABSENT');
      const raw = await espera(port.eliminaPerATothom(dades, { ...obteContext().config, signal: op.control.signal }), op);
      op.comprova();
      const rebut = rebutEliminacioMissatge(raw, dades);
      desa(m.id, { ...rebut, estat: 'confirmat' });
      destacats = destacats.filter(x => x.missatgeId !== m.id);
      onEliminaConfirmada(rebut); return rebut;
    } finally { op.acaba(); }
  }

  async function carrega(dades, { signal } = {}) {
    const op = captura(signal);
    const inici = new Map(revisions);
    const pendentsEnLlegir = new Set(cues.keys());
    try {
      if (op.ctx.modeDades !== 'remote') return { ...snapshot(), estat: 'local', teMes: false, seguentId: null };
      const resultat = await espera(port.carregaAccionsMissatges(dades, { ...obteContext().config, signal: op.control.signal }), op);
      const nou = { ...perMissatge };
      for (const fila of resultat.missatges) {
        const previa = nou[fila.missatgeId];
        if (previa?.estat === 'local' || previa?.esborrat === true) continue;
        const combinada = { ...fila, estat: 'confirmat' };
        for (const camp of Object.values(camps)) {
          const k = `${fila.missatgeId}:${camp}`;
          if (revisions.get(k) !== inici.get(k) || cues.has(k) || pendentsEnLlegir.has(k)) {
            combinada[camp] = previa?.[camp] ?? combinada[camp];
            combinada.estat = previa?.estat ?? 'pendent';
          } else confirmats.set(k, fila[camp]);
        }
        nou[fila.missatgeId] = combinada;
      }
      perMissatge = nou;
      if (dades.nomesDestacats) destacats = dades.despresDeId ? [...destacats, ...resultat.missatges] : resultat.missatges;
      publica(); return { ...resultat, estat: 'confirmat' };
    } catch (e) {
      op.comprova();
      if (e?.code !== 'XAT_ACCIONS_SQL_ABSENT') throw e;
      return { missatges: [], teMes: false, seguentId: null, estat: 'local' };
    } finally { op.acaba(); }
  }

  async function responEnPrivat(referencia, { signal } = {}) {
    const op = captura(signal);
    try {
      const m = font(referencia);
      if (m.sender === 'me' || m.usuariId === op.ctx.usuariId) throw error('Tria un missatge d’una altra persona.');
      const entitat = m.comOrgId || m.comEntitat?.id;
      if (m.comEntitat && !entitat) throw error('No hem pogut identificar l’entitat destinatària.');
      const destinatari = entitat || m.usuariId;
      if (!destinatari) throw error('No hem pogut identificar la persona destinatària.');
      const filId = await espera(creaPrivat(destinatari), op);
      if (!filId) throw error('No hem pogut obrir la conversa privada.');
      op.comprova(); obreFil(filId);
      // Només text visible: ni respostaA d'un altre fil, ni URLs privades d'adjunts.
      const cita = { text: String(m.text ?? '').slice(0, 4096), autorNom: String(m.author ?? m.autorNom ?? 'Veí') };
      esborranyPrivat = { filId, cita, textCita: `${cita.autorNom}: ${cita.text}`, respostaA: null };
      publica(); return esborranyPrivat;
    } finally { op.acaba(); }
  }

  async function reenviaAConverses(referencies, destinacions, { operacioId, signal } = {}) {
    const op = captura(signal);
    try {
      if (!Array.isArray(referencies) || !referencies.length || referencies.length > 20
        || !Array.isArray(destinacions) || !destinacions.length || destinacions.length > 10) throw error('Tria fins a 20 missatges i 10 converses.');
      const fonts = referencies.map(font), destins = [...new Map(destinacions.map(d => [typeof d === 'string' ? d : d?.id, typeof d === 'string' ? { id: d } : d])).values()];
      if (destins.some(d => !d?.id || d.potEscriure === false)) throw error('Hi ha una conversa que no permet enviar missatges.');
      const empremta = JSON.stringify([fonts.map(m => [m.id, m.threadId ?? m.filId, m.text, m.tipus]), destins.map(d => d.id)]);
      let manifest = operacioId ? manifests.get(operacioId) : null;
      if (operacioId && (!manifest || manifest.empremta !== empremta)) throw error('El reintent no correspon al mateix reenviament.');
      if (!manifest) {
        if (manifests.size >= 32) throw error('Hi ha massa reenviaments en esta sessió. Torna a obrir el xat.');
        operacioId = generaId(); manifest = { empremta, entrades: new Map(), blobs: new Map(), reserves: new Map(), generacioBlobs, enVol: false }; manifests.set(operacioId, manifest);
      }
      if (manifest.enVol) throw error('Este reenviament encara està en curs.');
      manifest.enVol = true;
      const resultats = [];
      try {
        for (const [indexMissatge, original] of fonts.entries()) {
          for (const desti of destins) {
          op.comprova(); font(original);
          const clauParella = `${indexMissatge}:${desti.id}`;
          let item = manifest.entrades.get(clauParella);
          if (!item) { item = { id: generaId(), estat: 'pendent' }; manifest.entrades.set(clauParella, item); }
          if (item.estat !== 'confirmat') {
            try {
              let resposta;
              if (['imatge', 'video', 'veu'].includes(original.tipus)) {
                if (!manifest.blobs.has(original.id)) {
                  // Reservem abans de descarregar: també compta la xarxa en vol.
                  const reserva = MAXIM_ADJUNT_XAT[original.tipus];
                  if (bytesBlobs + reserva > pressupostBlobs) throw error('Hi ha altres adjunts preparant-se. Espera que acaben i torna-ho a provar.', 'XAT_MEMORIA_ADJUNTS');
                  bytesBlobs += reserva; manifest.reserves.set(original.id, reserva);
                  try {
                    const blob = await espera(lligBlob(original, { signal: op.control.signal }), op);
                    if (!(blob instanceof Blob) || !blob.size || blob.size > reserva) throw error('L’adjunt no té una mida vàlida.');
                    bytesBlobs -= reserva - blob.size; manifest.reserves.set(original.id, blob.size); manifest.blobs.set(original.id, blob);
                  } catch (e) { retiraBlob(manifest, original.id); throw e; }
                }
                const fitxer = manifest.blobs.get(original.id);
                const metes = original.metadades?.adjunt;
                resposta = await espera(enviaAdjunt(desti, { id: item.id, tipus: original.tipus, fitxer, duradaMs: metes?.duradaMs ?? null, ...(original.text ? { text: original.text } : {}) }, { signal: op.control.signal }), op);
              } else if (original.tipus === 'text' || !original.tipus) {
                if (!String(original.text ?? '').trim()) throw error('Este missatge no té text per a reenviar.');
                resposta = await espera(enviaText(desti, original.text, { clientMsgId: item.id, esperaLaXarxa: false, signal: op.control.signal }), op);
              } else throw error('Este tipus de missatge encara no es pot reenviar.');
              const confirmat = Array.isArray(resposta) && resposta.length === 1 && resposta.some(m => m?.id === item.id
                && (m.threadId ?? m.filId) === desti.id && m.tipus === (original.tipus || 'text')
                && Number.isSafeInteger(m.seq) && m.seq > 0 && m.encuat !== true);
              if (!confirmat) throw error('El servidor no ha confirmat el reenviament.', 'sense-confirmacio');
              item.estat = 'confirmat'; item.error = null;
            } catch (e) { op.comprova(); item.estat = 'error'; item.error = e; }
          }
          resultats.push({ indexMissatge, destinacioId: desti.id, id: item.id, estat: item.estat, ...(item.error ? { error: item.error } : {}) });
          }
          // Els reintents retenen IDs/resultats, mai Blobs de missatges anteriors.
          retiraBlob(manifest, original.id);
        }
      } finally { manifest.enVol = false; retiraBlobs(manifest); }
      return { operacioId, resultats };
    } finally { op.acaba(); }
  }
  return Object.freeze({ sincronitza, snapshot, carregaAccionsMissatges: carrega,
    activa: () => { tancat = false; globalThis.window?.addEventListener('sdp:auth-change', revalida); },
    alternaReaccio: (m, emoji, activa) => muta('alternaReaccio', m, emoji, { activa }),
    alternaDestacat: (m, actiu) => muta('alternaDestacat', m, actiu),
    alternaFixat: (m, actiu) => muta('alternaFixat', m, actiu),
    eliminaPerAMi: m => muta('eliminaPerAMi', m, true), eliminaPerATothom, responEnPrivat, reenviaAConverses,
    tanca: () => { tancat = true; globalThis.window?.removeEventListener('sdp:auth-change', revalida); for (const c of controls) c.abort(abortat()); controls.clear(); manifests.clear(); bytesBlobs = 0; generacioBlobs += 1; }
  });
}
