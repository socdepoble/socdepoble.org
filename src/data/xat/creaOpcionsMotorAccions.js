import {
  carregaAccionsMissatges as carregaAccionsAlPort,
  alternaReaccio as reaccioAlPort,
  alternaDestacat as destacatAlPort,
  alternaFixat as fixatAlPort,
  eliminaPerAMi as eliminaAlPort,
  urlAdjuntXat
} from '../backendPort.js';
import { capturaSessio, entradaSessio } from '../identitat.js';
import { esRebuigDeNormes } from '../errorsBackend.js';
import { actualitzaFilAmbMissatge, fusionaPerSeq, mapejaMissatge } from '../../sections/xat/missatges.js';

/** Opcions del motor diferit. Les refs es consulten en cada operació: cap
 * sessió, missatge ni callback queda congelat quan arriba el tros. */
export function creaOpcionsMotorAccions({ entornAccions, filsRef, desmuntat, moderacioRef,
  setEstatAccions, mutaMissatges, mutaFils, esXatPrivatDeLaIAIA }) {
  return ({
    port: {
      carregaAccionsMissatges: (...args) => carregaAccionsAlPort(...args),
      alternaReaccio: (...args) => reaccioAlPort(...args), alternaDestacat: (...args) => destacatAlPort(...args),
      alternaFixat: (...args) => fixatAlPort(...args), eliminaPerAMi: (...args) => eliminaAlPort(...args)
    },
    obteContext: () => {
      const e = entornAccions.current;
      return { ...e, clau: JSON.stringify([e.ambit, entradaSessio()]), actiu: e.actiu && !desmuntat.current, comprova: capturaSessio() };
    },
    obteMissatge: (ref) => {
      const id = typeof ref === 'string' ? ref : ref?.id ?? ref?.missatgeId;
      const filDemanat = ref?.threadId ?? ref?.filId;
      const e = entornAccions.current;
      for (const [filId, files] of Object.entries(e.missatgesPerFil)) {
        if (filDemanat && filDemanat !== filId) continue;
        const m = files.find(m => m.id === id);
        if (!m || e.esPersonaBloquejada(m.usuariId)) continue;
        const fil = filsRef.current.find(f => f.id === filId);
        if (fil?.participant === false) continue;
        return m;
      }
      return null;
    },
    onCanvi: setEstatAccions,
    creaPrivat: id => entornAccions.current.creaFil(id),
    obreFil: id => entornAccions.current.obriFil(id),
    enviaText: async (desti, text, opcions) => {
      const e = entornAccions.current;
      if (e.modeDades !== 'remote') return e.enviaAmbNormes(desti, text, opcions);
      const valida = capturaSessio(), ambit = e.ambit;
      const comprova = () => {
        valida();
        if (opcions.signal?.aborted || desmuntat.current || entornAccions.current.ambit !== ambit) throw new DOMException('Operació cancel·lada.', 'AbortError');
      };
      const moderacio = moderacioRef.current;
      if (typeof moderacio?.asseguraNormes === 'function' && !esXatPrivatDeLaIAIA(desti) && !(await moderacio.asseguraNormes())) {
        throw new DOMException('Cal acceptar les normes de convivència.', 'AbortError');
      }
      comprova();
      const { serveiXat } = await import('./serveiXat.js');
      const publica = () => {
        /* L'import o la porta de normes poden haver esperat una altra sessió. */
        comprova();
        return serveiXat.enviaMissatge(desti.id, { id: opcions.clientMsgId, text }, { ...entornAccions.current.config, signal: opcions.signal });
      };
      let desat;
      try { desat = await publica(); }
      catch (error) {
        if (!esRebuigDeNormes(error) || typeof moderacio?.asseguraNormes !== 'function') throw error;
        if (!(await moderacio.asseguraNormes({ rebutjades: true }))) throw new DOMException('Cal acceptar les normes de convivència.', 'AbortError');
        comprova(); desat = await publica();
      }
      comprova();
      if (desat?.id !== opcions.clientMsgId || desat.filId !== desti.id || desat.encuat === true
        // Import dinàmic: xatMultimedia.js es queda fora de l'arrencada estàtica del connector.
        || !Number.isSafeInteger(desat.seq) || desat.seq <= 0) throw (await import('../xatMultimedia.js')).errorAdjuntXat('sense-confirmacio');
      const definitiu = { ...mapejaMissatge(desat, e.usuariId), author: 'Jo' };
      mutaMissatges(previs => ({ ...previs, [desti.id]: fusionaPerSeq(previs[desti.id] || [], [definitiu]) }));
      mutaFils(previs => previs.map(f => f.id === desti.id ? actualitzaFilAmbMissatge(f, definitiu) : f));
      return [definitiu];
    },
    /* v1.2.23 · IDEA-331 (ordre del Mestre 261123) · El lloc el conserva qui publica, informat abans de publicar. Qui
       reenvia no és l'autor: la còpia reenviada ix sense GPS.
       v1.2.23 · L1-01 (Gauntlet R1) · Sense GPS, però no sense EXIF: una foto conserva l'orientació, la data i la
       càmera de TRIA_SENSE_UBICACIO (com abans de la IDEA-331, quan es reenviava l'original desat, que ja les
       portava), i el transport l'acredita com a punt fix d'imatgeSenseUbicacio (supabase/xatMultimedia.js). */
    enviaAdjunt: (desti, adjunt, ...resta) => entornAccions.current.sendChatMedia(desti, { ...adjunt, conservaUbicacio: false }, ...resta),
    lligBlob: async (m, { signal }) => {
      // Import dinàmic: xatMultimedia.js es queda fora de l'arrencada estàtica del connector.
      const { MAXIM_ADJUNT_XAT, MIME_XAT } = await import('../xatMultimedia.js');
      const meta = m.metadades?.adjunt;
      if (!meta?.id || MIME_XAT[meta.mime] !== m.tipus) throw new Error('Este adjunt no està disponible per a reenviar.');
      const url = await urlAdjuntXat(meta.id, { ...entornAccions.current.config, signal }, { renova: true });
      const resposta = await fetch(url, { signal, credentials: 'omit', redirect: 'error' });
      if (!resposta.ok) throw Object.assign(new Error('No hem pogut llegir l’adjunt autoritzat.'), { status: resposta.status });
      const maxim = MAXIM_ADJUNT_XAT[m.tipus];
      const chunks = []; let bytes = 0;
      if (resposta.body?.getReader) {
        const reader = resposta.body.getReader();
        try {
          for (;;) {
            if (signal?.aborted) throw new DOMException('Operació cancel·lada.', 'AbortError');
            const { done, value } = await reader.read(); if (done) break;
            bytes += value.byteLength;
            if (bytes > maxim) { await reader.cancel(); throw new Error('L’adjunt supera el límit permés.'); }
            chunks.push(value);
          }
        } finally { reader.releaseLock(); }
      } else {
        const blob = await resposta.blob(); bytes = blob.size; chunks.push(blob);
      }
      if (!bytes || bytes > maxim) throw new Error('L’adjunt no té una mida vàlida.');
      const original = new Blob(chunks, { type: meta.mime });
      if (m.tipus === 'video' && /^video\/(mp4|quicktime)$/.test(meta.mime)) {
        // Els originals antics poden dur GPS: la còpia per a reenviar es neteja
        // abans de donar-la al motor, sense mutar ni tornar a pujar l'original.
        const { senseUbicacioVideo } = await import('../../utils/ubicacioMitjans.js');
        const net = await senseUbicacioVideo(original, { signal });
        if (!net.net) throw (await import('../xatMultimedia.js')).errorAdjuntXat('video-no-acreditable');
        return net.fitxer;
      }
      if (m.tipus === 'imatge') {
        /* v1.2.23 · IDEA-331 · Des de la IDEA-331 la foto desada porta el GPS de qui l'ha publicada: la còpia per a
           reenviar es neteja al contenidor (sense recodificar), sense mutar l'original. */
        const { imatgeSenseUbicacio } = await import('../../components/universal/enquadrament/exifIncrustat.js');
        const net = imatgeSenseUbicacio(new Uint8Array(await original.arrayBuffer()));
        if (signal?.aborted) throw new DOMException('Operació cancel·lada.', 'AbortError');
        if (!net || net.format !== meta.mime) throw (await import('../xatMultimedia.js')).errorAdjuntXat('foto-codificacio');
        return new Blob([net.bytes], { type: meta.mime });
      }
      return original;
    }
  });
}
