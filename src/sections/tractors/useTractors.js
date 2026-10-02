/**
 * useTractors.js — estat i accions de la porta d'aprovació per a la UI.
 *
 * Un sol magatzem per pàgina (IndexedDB si es deixa obrir, si no memòria;
 * injectable a les proves).
 * L'estat de cada tractor ix d'avaluaEstat i, si diu «aprovat», també de
 * verificaRegistre: el panell no diu mai «aprovat» si exigeixAprovacio, la
 * porta de veres, diria que no. origen = location.origin, rpId = hostname.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ErrorAprovacio, autenticadorDePlataforma, confirmacioValida, preparaRegistre, registraClauWebAuthn,
  signaAmbWebAuthn, verificaRegistre
} from './nucli/aprovacio.js';
import { ErrorEmpremta } from './nucli/empremta.js';
import { crearMagatzem } from './nucli/magatzem.js';
import { avaluaEstat, instantDe, ordenaRegistres } from './nucli/registre.js';
import { TRACTORS, empremtaDe, empremtesDe } from './registreTractors.js';

const ETIQUETA_CLAU = 'Clau de plataforma d’este navegador';
const missatgeDe = (error) => error?.message ?? String(error);

let magatzemCompartit = null;

/* El magatzem de la pàgina: el mateix per al panell i per als tractors.
   crearMagatzem passa a memòria si IndexedDB no hi és o no es deixa obrir
   (també quan open() falla més tard); aleshores persistent és false i el
   panell ho avisa. */
export function magatzemTractors() {
  magatzemCompartit ||= crearMagatzem();
  return magatzemCompartit;
}

export function entornDe(entorn = globalThis) {
  return { origen: entorn?.location?.origin ?? '', rpId: entorn?.location?.hostname ?? '' };
}

/* Promesa<boolean>: PublicKeyCredential i un autenticador de plataforma amb
   verificació d'usuari (Touch ID, Windows Hello...). No llança mai. */
export function suportaWebAuthn(entorn = globalThis) {
  return autenticadorDePlataforma(entorn);
}

function trobaTractor(tractors, id) {
  const tractor = tractors.find((t) => t.id === id);
  if (!tractor) throw new ErrorAprovacio('APROVACIO_REQUERIDA', `No hi ha cap tractor «${String(id)}» al catàleg.`);
  return tractor;
}

/* Tot el que necessita exigeixAprovacio des del tractor, llegit ara mateix. */
export async function contextAprovacio(id, {
  magatzem, subtle, tractors = TRACTORS, entorn = globalThis, rellotge = Date.now
} = {}) {
  const desti = magatzem ?? magatzemTractors();
  const tractor = trobaTractor(tractors, id);
  const info = await empremtaDe(tractor, subtle);
  const [registres, claus] = await Promise.all([desti.registres(id), desti.claus()]);
  return { manifest: tractor.manifest, empremta: info.empremta, registres, claus, ...entornDe(entorn), ara: rellotge() };
}

/* La fila que pinta el panell. estat: pendent · aprovat · caducat · revocat ·
   empremta-divergent · incomplet · error. registre: el vigent (el darrer). */
export async function estatDelTractor({ tractor, info, registres, claus, ara, origen, rpId, subtle }) {
  const propis = ordenaRegistres((Array.isArray(registres) ? registres : []).filter((r) => r?.tractor === tractor.id));
  const fila = {
    ...tractor,
    empremta: info.empremta,
    curta: info.curta,
    fontsAbsents: info.fontsAbsents,
    registres: propis,
    registre: propis.length ? propis[propis.length - 1] : null
  };
  if (info.estat !== 'ok') return { ...fila, estat: info.estat === 'incomplet' ? 'incomplet' : 'error', motiu: info.motiu };
  const avaluacio = avaluaEstat({ manifest: tractor.manifest, empremta: info.empremta, registres: propis, ara });
  if (avaluacio.estat === 'aprovat') {
    const verificacio = await verificaRegistre({ registre: avaluacio.registre, claus, origen, rpId, subtle });
    if (!verificacio.valid) {
      return { ...fila, estat: 'pendent', registre: avaluacio.registre, motiu: `L'aprovació no supera la verificació: ${verificacio.motiu}` };
    }
  }
  return { ...fila, estat: avaluacio.estat, registre: avaluacio.registre ?? fila.registre, motiu: avaluacio.motiu };
}

export function useTractors({ magatzem, subtle, tractors = TRACTORS, entorn = globalThis, rellotge = Date.now } = {}) {
  const [desti] = useState(() => magatzem ?? magatzemTractors());
  const { origen, rpId } = entornDe(entorn);
  const [vista, setVista] = useState({ carregant: true, error: null, tractors: [], claus: [] });
  const [webauthn, setWebauthn] = useState(false);
  const empremtes = useRef(null);
  const torn = useRef(0);

  const llegixEmpremtes = useCallback(async () => {
    const cau = empremtes.current;
    if (cau && cau.tractors === tractors && cau.subtle === subtle) return cau.llista;
    const llista = await empremtesDe(tractors, subtle);
    empremtes.current = { tractors, subtle, llista };
    return llista;
  }, [tractors, subtle]);

  const refresca = useCallback(async () => {
    const meu = ++torn.current;
    try {
      const infos = await llegixEmpremtes();
      const [registres, claus] = await Promise.all([desti.registres(), desti.claus()]);
      const ara = rellotge();
      const files = await Promise.all(tractors.map((tractor, i) => estatDelTractor({
        tractor, info: infos[i], registres, claus, ara, origen, rpId, subtle
      })));
      if (meu === torn.current) setVista({ carregant: false, error: null, tractors: files, claus });
    } catch (error) {
      if (meu === torn.current) {
        setVista((previ) => ({ ...previ, carregant: false, error: `No s'han pogut llegir les aprovacions: ${missatgeDe(error)}` }));
      }
    }
  }, [desti, llegixEmpremtes, tractors, rellotge, origen, rpId, subtle]);

  useEffect(() => {
    refresca();
    return () => {
      torn.current += 1;
    };
  }, [refresca]);

  useEffect(() => {
    let viu = true;
    suportaWebAuthn(entorn).then((si) => {
      if (viu) setWebauthn(si);
    });
    return () => {
      viu = false;
    };
  }, [entorn]);

  /* nivell 'signatura': registra una clau si no n'hi ha cap i signa amb WebAuthn.
     nivell 'confirmacio': el text escrit ha de ser l'empremta curta.
     `empremta` (opcional): la que ha vist el Mestre; si el codi ha canviat
     mentrestant, no s'aprova res. */
  const aprova = useCallback(async (id, { nivell, confirmacio, empremta: empremtaVista } = {}) => {
    const tractor = trobaTractor(tractors, id);
    const info = await empremtaDe(tractor, subtle);
    if (info.estat !== 'ok') {
      throw new ErrorEmpremta(info.estat === 'incomplet' ? 'EMPREMTA_INCOMPLETA' : 'EMPREMTA_INVALIDA', info.motiu, info.fontsAbsents);
    }
    if (empremtaVista !== undefined && empremtaVista !== info.empremta) {
      throw new ErrorAprovacio('EMPREMTA_DIVERGENT', 'La versió ha canviat mentre la revisaves: torna a llegir la fitxa.');
    }
    const ara = rellotge();
    const base = { manifest: tractor.manifest, empremta: info.empremta, decisio: 'aprovat', nivell, ara };
    let registre;
    if (nivell === 'signatura') {
      const credentials = entorn?.navigator?.credentials;
      let claus = await desti.claus();
      if (!claus.length) {
        const nova = await registraClauWebAuthn({ credentials, rpId, origen, subtle });
        await desti.afegixClau({ ...nova, creat: new Date(ara).toISOString(), etiqueta: ETIQUETA_CLAU });
        claus = await desti.claus();
      }
      const clau = claus[claus.length - 1];
      registre = await signaAmbWebAuthn({ registre: preparaRegistre(base), credencial: clau.credencial, credentials, rpId, subtle });
      const verificacio = await verificaRegistre({ registre, claus, origen, rpId, subtle });
      if (!verificacio.valid) throw new ErrorAprovacio('SIGNATURA_INVALIDA', verificacio.motiu);
    } else if (nivell === 'confirmacio') {
      if (!confirmacioValida(confirmacio, info.empremta)) {
        throw new ErrorAprovacio('CONFIRMACIO_INCORRECTA', 'L’empremta escrita no coincidix amb l’empremta curta d’esta versió.');
      }
      registre = preparaRegistre(base);
    } else {
      throw new ErrorAprovacio('NIVELL_INSUFICIENT', 'Cal triar un nivell d’aprovació: signatura o confirmació escrita.');
    }
    await desti.afegixRegistre(registre);
    await refresca();
    return registre;
  }, [tractors, subtle, rellotge, entorn, desti, rpId, origen, refresca]);

  /* Revoca l'aprovació vigent (també la d'una versió anterior: si el codi
     tornara arrere, l'aprovació vella tornaria a valdre). Els registres
     s'ordenen per data: si el rellotge ha tornat arrere des d'aprovar (NTP,
     canvi d'hora a mà), la revocació porta la data de l'aprovació, mai una
     d'anterior, que no revocaria res. En empat, ordenaRegistres posa la
     revocació darrere: guanya, i amb el mateix mil·lisegon (rellotge gruixut)
     el panell diu «revocat» de seguida i no «data futura». */
  const revoca = useCallback(async (id) => {
    const tractor = trobaTractor(tractors, id);
    const propis = await desti.registres(id);
    const darrer = propis.length ? propis[propis.length - 1] : null;
    if (darrer?.decisio !== 'aprovat') throw new ErrorAprovacio('APROVACIO_REQUERIDA', 'No hi ha cap aprovació que revocar.');
    const ara = Math.max(instantDe(rellotge()), instantDe(darrer.data));
    const registre = preparaRegistre({
      manifest: tractor.manifest, empremta: darrer.empremta, decisio: 'revocat', nivell: 'confirmacio', ara
    });
    await desti.afegixRegistre(registre);
    await refresca();
    return registre;
  }, [tractors, desti, rellotge, refresca]);

  const exporta = useCallback(() => desti.exporta(), [desti]);

  const oblidaTot = useCallback(async () => {
    await desti.esborraTot();
    await refresca();
  }, [desti, refresca]);

  return {
    ...vista,
    persistent: desti.persistent !== false,
    webauthn,
    origen,
    rpId,
    aprova,
    revoca,
    exporta,
    oblidaTot,
    recarrega: refresca
  };
}
