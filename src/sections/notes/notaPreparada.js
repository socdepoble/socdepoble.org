/**
 * notaPreparada.js — P4 (ordre del Mestre, 261003) · La «Nota sense títol»
 * que sempre espera al Bloc de Notes per a convidar a escriure.
 *
 * És una nota que encara NO existix al servidor. Té des del principi el seu
 * id definitiu (un UUID creat ací: els dos adaptadors accepten `input.id`),
 * viu en memòria i es pinta a la llista com qualsevol altra. Obrir-la, triar-ne
 * la carpeta, una categoria o l'emoticona no crea res: el Bloc no s'omple de
 * notes buides. La primera escriptura amb contingut de veres (text que no siga
 * la llavor, o una imatge) la crea amb creaNota, amb el MATEIX id: la
 * selecció, la URL (?nota=) i l'editor (les seues claus són l'id) no canvien,
 * i TipTap no es remunta ni perd el cursor.
 *
 * El que s'escriu mentre la creació viatja es queda ací. Quan la nota ja és a
 * la llista, els camps que hi difereixen passen al canal de sempre
 * (setLocalNoteField: la cua d'autodesament, amb la revisió del servidor) i es
 * prepara una nota nova. Fins eixe moment, qui pinta la llista porta damunt
 * de la nota els camps d'ací (`camps`): l'editor mai rep un cos vell.
 *
 * Revisió de P4 (261003) · La creació té estat (`creacio`), que l'editor pinta
 * a la barra taronja amb la peça de sempre (EstatDesament): 'enviant' mentre
 * viatja; 'error' si no s'ha pogut crear, amb el motiu, «Torna-ho a provar» i
 * la veritat: el text encara només és en esta pestanya. Una fallada s'avisa
 * una vegada per nota i motiu. Un error que pot haver arribat al servidor
 * (temps esgotat, xarxa a mitja resposta, clau duplicada) es resol per id
 * abans de donar-lo per fallit. Si l'endoll crea la nota amb un altre id,
 * s'adopta el del servidor. L'entrada passa pel sanejador del canal.
 */
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { extractPlainText } from '../../utils/contentAdapter.js';
import { netejaCamp } from './netejaCamp.js';
import { esLlavorDeNota, formaCompacta } from './llavorNota.js';

/** El títol de la fitxa de la llista mentre la persona no n'escriu cap. */
export const TITOL_NOTA_PREPARADA = 'Nota sense títol';

/** El que diu la barra taronja quan la nota no s'ha pogut crear. */
export function detallDeCreacioFallida(motiu = '') {
  const perque = motiu ? ` (${motiu})` : '';
  return `No s’ha pogut crear la nota${perque}. El que hi has escrit encara només és en esta pestanya: es tornarà a provar quan hi tornes a escriure.`;
}
/** Després d'una creació tallada (AbortError): res no ha fallat, però encara no hi és. */
export const DETALL_CREACIO_PENDENT = 'La nota encara no s’ha creat al servidor: es tornarà a provar quan hi tornes a escriure.';

const CAMPS_DE_TEXT = new Set(['title', 'subtitle', 'lead', 'content']);
const CAMPS_D_IMATGE = new Set(['heroImage', 'logoImage']);

/** Un UUID v4. `randomUUID` només existix en context segur: un amfitrió
 *  servit per http té `getRandomValues`, que basta. */
export function nouIdDeNota() {
  const cripto = globalThis.crypto;
  if (typeof cripto?.randomUUID === 'function') return cripto.randomUUID();
  const octets = cripto.getRandomValues(new Uint8Array(16));
  octets[6] = (octets[6] & 0x0f) | 0x40;
  octets[8] = (octets[8] & 0x3f) | 0x80;
  const hex = Array.from(octets, (octet) => octet.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/* Gauntlet 261016 (Bloc 3.9; ordre del Mestre: la plantilla «s'esvaeix al
   primer clic» i la verge no es publica mai) · `llavor` pot ser una llista
   (la llavor d'ara i la d'abans) i es compara normalitzada: el cos que torna
   TipTap no porta els salts de línia de la llavor escrita, i abans la cadena
   exacta no casava mai. Amb una llavor, la plantilla del Bloc
   (llavorNota.js) tampoc no compta, siga en la forma que siga. */
function esLlavor(valor, llavor) {
  const llavors = (Array.isArray(llavor) ? llavor : [llavor]).filter((l) => typeof l === 'string' && l.trim());
  if (!llavors.length) return false;
  return llavors.some((l) => valor === l || formaCompacta(valor) === formaCompacta(l)) || esLlavorDeNota(valor);
}

/** Contingut de veres: algun text (el cos, si no és la llavor) o una imatge.
 *  La classificació, l'emoticona, els drets o la data sols no creen la nota. */
export function teContingut(camps, llavor = null) {
  return Object.entries(camps || {}).some(([camp, valor]) => {
    if (typeof valor !== 'string') return false;
    if (CAMPS_D_IMATGE.has(camp)) return valor.trim() !== '';
    if (!CAMPS_DE_TEXT.has(camp)) return false;
    if (camp === 'content' && esLlavor(valor, llavor)) return false;
    return extractPlainText(valor, Infinity).trim() !== '' || /<img\b/i.test(valor);
  });
}

/* Una creació que pot haver arribat al servidor encara que torne error: el
   temps esgotat de request() (12 s), la xarxa caiguda a mitja resposta
   (estat 0) o un reintent que topa amb la mateixa clau (409: la nota ja
   existix, també a localNotes). */
const potHaverArribat = (error) => error?.name === 'TimeoutError' || error?.status === 409 || error?.status === 0;

const netejaCamps = (camps) => Object.fromEntries(
  Object.entries(camps).map(([camp, valor]) => [camp, netejaCamp(camp, valor)])
);

const estatNou = (clau) => ({
  clau, id: nouIdDeNota(), camps: {}, ara: new Date().toISOString(),
  // L'id que ha posat el servidor, si l'endoll no ha respectat el nostre.
  idServidor: null,
  // L'estat de la creació per a la barra taronja: null (res a desar) o { estat, detall }.
  creacio: null
});
const iguals = (a, b) => a === b || JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** L'escriptura de la nota preparada per a l'editor (NotesEditor). Fora del
 *  Bloc (el catàleg, les proves d'una peça sola) no n'hi ha: null. */
export const NotaPreparadaContext = createContext(null);
export const useNotaPreparadaDelBloc = () => useContext(NotaPreparadaContext);

/**
 * @param {object} opcions
 * @param {string|null} opcions.clau   L'àmbit (workspaceKey): en canviar, la preparada es reinicia.
 * @param {object} opcions.base        L'entrada de la nota nova (carpeta activa i drets).
 * @param {string|string[]|null} opcions.llavor La llavor del cos (o les llavors), que no compta com a escrit.
 * @param {Array} opcions.notes        Les notes de la llista (per a vore quan ja hi és).
 * @param {Function} [opcions.resolNota] resolveNote: si una creació incerta ha arribat.
 * @param {Function} [opcions.adopta]  (idPreparat, idDelServidor) quan l'endoll posa un altre id.
 * @returns {{ id: string, document: object, camps: object, creacio: object|null,
 *   escriu: Function, desa: Function, reintenta: Function }}
 */
export function useNotaPreparada({
  clau = null, base = null, llavor = null, notes, creaNota, resolNota, setLocalNoteField, updateNote, informaError, adopta
}) {
  const [estat, setEstat] = useState(() => estatNou(clau));
  const estatRef = useRef(estat);
  // L'id de la nota que s'està creant, o ja creada i a l'espera de la llista
  // (una sola creació per nota).
  const creacioRef = useRef(null);
  // La creació en vol: la promesa i l'entrada que s'hi ha enviat.
  const enVolRef = useRef(null);
  // L'id de la nota que no s'ha pogut crear: ja no es prova a cada tecla.
  const fallidaRef = useRef(null);
  // L'última fallada avisada ({ id, missatge }): un avís per nota i motiu.
  const avisatRef = useRef(null);
  const viusRef = useRef(null);
  useLayoutEffect(() => {
    viusRef.current = { base, llavor, creaNota, resolNota, setLocalNoteField, updateNote, informaError, adopta };
  });

  /* Eixir del Bloc amb la creació en vol: esta memòria se'n va amb el
     component, i el que s'ha escrit mentrestant no es pot perdre. Quan la
     creació torna, el que difereix de la nota CREADA (l'adaptador remot no
     insereix ni el subtítol, ni l'entradilla, ni les imatges) s'envia sanejat
     amb updateNote, l'id i la revisió de la nota creada. Es llig en tornar, no
     ara: React neteja de pare a fill, i el buidatge final de l'editor (fill)
     arriba després d'esta neteja. */
  useLayoutEffect(() => () => {
    const enVol = enVolRef.current;
    if (!enVol || creacioRef.current !== enVol.id) return;
    enVol.promesa.then((creada) => {
      const { id, camps } = estatRef.current;
      if (id !== enVol.id) return undefined;
      const referencia = creada && typeof creada === 'object' ? creada : enVol.entrada;
      const diferents = {};
      for (const [camp, valor] of Object.entries(camps)) {
        const net = netejaCamp(camp, valor);
        if (!iguals(referencia[camp], net)) diferents[camp] = net;
      }
      if (!Object.keys(diferents).length) return undefined;
      return viusRef.current?.updateNote?.(String(referencia.id ?? id), diferents, creada?.revision);
    }).catch(() => {});
  }, []);

  const renova = useCallback((nou) => {
    estatRef.current = nou;
    setEstat(nou);
  }, []);

  /* Un altre àmbit (entrada de sessió, actor, poble): la preparada d'abans no
     hi passa. Una creació en vol d'abans la talla creaNota (AbortError). */
  useLayoutEffect(() => {
    if (estatRef.current.clau === clau) return;
    creacioRef.current = null;
    fallidaRef.current = null;
    renova(estatNou(clau));
  }, [clau, renova]);

  /* La creació no ha arribat. `error` null és un AbortError: no ha fallat res
     (ningú no l'avisa), però la nota encara no hi és. */
  const falla = useCallback((id, error) => {
    creacioRef.current = null;
    fallidaRef.current = id;
    const actual = estatRef.current;
    if (actual.id !== id) return;
    if (!error) {
      renova({ ...actual, creacio: { estat: 'pendent', detall: DETALL_CREACIO_PENDENT } });
      return;
    }
    const missatge = error?.message || String(error || '');
    renova({ ...actual, creacio: { estat: 'error', detall: detallDeCreacioFallida(missatge) } });
    // La barra porta l'estat; el toast, només la primera vegada de cada motiu.
    const avisat = avisatRef.current;
    if (avisat?.id === id && avisat.missatge === missatge) return;
    avisatRef.current = { id, missatge };
    viusRef.current?.informaError?.(error);
  }, [renova]);

  const intentaCrear = useCallback((actual) => {
    const vius = viusRef.current || {};
    if (typeof vius.creaNota !== 'function' || !teContingut(actual.camps, vius.llavor)) return;
    const { id } = actual;
    creacioRef.current = id;
    fallidaRef.current = null;
    // L'entrada passa pel sanejador del canal (netejaCamp), com cada tecla d'una nota de veres.
    const entrada = { ...netejaCamps({ ...vius.base, ...actual.camps }), id };
    renova({ ...actual, creacio: { estat: 'enviant', detall: '' } });
    const promesa = Promise.resolve().then(() => vius.creaNota(entrada));
    enVolRef.current = { id, promesa, entrada };
    const viva = () => creacioRef.current === id && estatRef.current.id === id;
    promesa.then((creada) => {
      if (!viva()) return;
      /* Un endoll que no respecta l'id del client (el contracte no ho exigix):
         s'adopta el del servidor. La materialització el busca a la llista. */
      const delServidor = creada?.id != null ? String(creada.id) : null;
      if (delServidor && delServidor !== id) renova({ ...estatRef.current, idServidor: delServidor });
    }, (error) => {
      if (!viva()) return undefined;
      if (error?.name === 'AbortError') return falla(id, null);
      const resol = viusRef.current?.resolNota;
      if (!potHaverArribat(error) || typeof resol !== 'function') return falla(id, error);
      /* Potser ja hi és: resolveNote la injecta a la llista i es materialitza
         pel camí de sempre. Si no hi és (o no es pot saber), ha fallat. */
      return Promise.resolve().then(() => resol(id)).then(
        (resolta) => { if (resolta?.status !== 'found' && viva()) falla(id, error); },
        () => { if (viva()) falla(id, error); }
      );
    });
  }, [renova, falla]);

  /* `reintenta`: després d'una creació fallida, només el desat amb pausa de
     l'editor (saveRemote: 800 ms sense teclejar, o en eixir del camp) o el
     «Torna-ho a provar» de la barra ho tornen a provar. Amb una fallada que
     dura (un servidor caigut, un poble mal configurat), cada tecla no fa una
     petició nova. */
  const escriuAmb = useCallback((id, camp, valor, reintenta) => {
    const actual = estatRef.current;
    if (id == null || String(id) !== actual.id) return;
    const nou = { ...actual, camps: { ...actual.camps, [camp]: valor } };
    renova(nou);
    if (creacioRef.current === nou.id) return;
    if (fallidaRef.current === nou.id && !reintenta) return;
    intentaCrear(nou);
  }, [renova, intentaCrear]);
  /* Cada tecla (updateLocal) i la botonera; el desat amb pausa (saveRemote). */
  const escriu = useCallback((id, camp, valor) => escriuAmb(id, camp, valor, false), [escriuAmb]);
  const desa = useCallback((id, camp, valor) => escriuAmb(id, camp, valor, true), [escriuAmb]);
  /* «Torna-ho a provar» (el detall de la barra taronja): sense cap tecla nova. */
  const reintenta = useCallback(() => {
    const actual = estatRef.current;
    if (creacioRef.current === actual.id) return;
    intentaCrear(actual);
  }, [intentaCrear]);

  /* La nota ja és a la llista (creaNota o resolveNote l'hi han posada): el
     que s'ha escrit mentre viatjava passa a la cua de sempre i es prepara una
     nota nova. En layout: abans de pintar i abans de cap tecla, i amb el
     setLocalNoteField del mateix render (la nota ja és a les seues dades).
     Amb l'id del servidor (endoll que no respecta el nostre), la selecció hi
     passa (adopta). */
  const idALaLlista = estat.idServidor ?? estat.id;
  const materialitzada = useMemo(
    () => (notes || []).find((nota) => String(nota.id) === idALaLlista) || null,
    [notes, idALaLlista]
  );
  useLayoutEffect(() => {
    if (!materialitzada) return;
    const { id, camps, clau: clauActual, idServidor } = estatRef.current;
    const idNota = String(materialitzada.id);
    if (idNota !== (idServidor ?? id)) return;
    const vius = viusRef.current || {};
    for (const [camp, valor] of Object.entries(camps)) {
      if (!iguals(materialitzada[camp], valor)) vius.setLocalNoteField?.(idNota, camp, valor);
    }
    creacioRef.current = null;
    fallidaRef.current = null;
    renova(estatNou(clauActual));
    if (idNota !== id) vius.adopta?.(id, idNota);
  }, [materialitzada, renova]);

  const document = useMemo(() => ({
    ...base, ...estat.camps, id: estat.id, isPublished: false, updatedAt: estat.ara, preparada: true
  }), [base, estat.camps, estat.id, estat.ara]);

  return { id: estat.id, document, camps: estat.camps, creacio: estat.creacio, escriu, desa, reintenta };
}
