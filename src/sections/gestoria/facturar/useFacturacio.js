/**
 * useFacturacio.js — l'estat de la pantalla de Facturació: el perfil fiscal,
 * el llibre Veri*Factu, la verificació de la cadena, la persistència i les
 * accions (desar el perfil i el llegat, emetre, anul·lar, fer i restaurar la
 * còpia del llibre).
 *
 * Ordre del Mestre, 261007 («tindre la facturació operativa inclús sense
 * xarxa»; passos 1, 2 i 3 del mapa de la Gestoria). Tot és d'este ordinador:
 *   · el llibre és el port IndexedDB de només afegir (creaPortIndexedDB) i el
 *     perfil, el seu magatzem propi (creaMagatzemPerfil); sense IndexedDB no
 *     hi ha facturació (SENSE_INDEXEDDB), mai una reserva en memòria;
 *   · l'empremta la calcula WebCrypto: sense context segur (https o
 *     localhost) la pantalla ho diu i no emet res (buit G14);
 *   · cada emissió passa per emissio.emet (numerar, construir i afegir en una
 *     sola secció) amb el número que la pantalla ha mostrat: si entremig se
 *     n'ha emés un altre, el nucli el refusa i es torna a mostrar;
 *   · després de cada acció es torna a llegir el llibre i a verificar la
 *     cadena sencera, amb la marca de l'última còpia com a ultimsConeguts;
 *   · la persistència es demana quan el perfil ja permet emetre, i es diu
 *     si el navegador l'ha concedida o no;
 *   · la còpia va a la carpeta que tria la persona (el patró de
 *     fontNavegador, que no sobreescriu mai) o es descarrega, i deixa la seua
 *     marca al perfil. La restauració verifica la cadena abans de tocar res.
 * Correccions de la revisió (ordre del Mestre, 261007):
 *   · F3 · amb incidències greus a la cadena (TRUNCAMENT, TRENCAMENT…) no
 *     s'emet ni s'anul·la res: el número següent repetiria el d'una factura
 *     perduda i la còpia bona ja no es podria restaurar mai (COPIA_DIVERGENT).
 *     La via és restaurar la còpia bona (pas 5); verificar continua obert;
 *   · F2 · la còpia d'un llibre amb incidències, o que no conté el registre de
 *     la marca vigent, es fa (amb «incidencia» al nom) però no deixa marca;
 *   · F4 · desar la configuració o el llegat porta els registres del llibre
 *     llegits en eixe moment: amb factures del NIF vigent, el perfil és fix
 *     (PERFIL_FIXAT al magatzem).
 * Prompt 261014_1605, front G1 · PODER 1 (el PDF en un clic): la factura que
 * es mostra en paper és estat d'ací, no del llibre. Emesa bé, el formulari
 * l'obri (mostraEmesa) en tancar el seu diàleg de confirmació, i «Factura» de
 * cada fila del llibre fa servir el mateix estat: sempre hi ha
 * una sola ImpressioFactura muntada, perquè toca l'<html> i el <body>. En
 * tancar-la, el focus torna on diu qui l'ha oberta (el botó de la fila, o
 * l'acció principal del formulari quan l'ha oberta l'emissió).
 * Cap crida de xarxa. Proves: port, perfil, subtle, idb, locks,
 * emmagatzematge, rellotge, entorn i descarrega s'injecten.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { errorAmbCodi } from '../facturacio/comu.js';
import { creaEmissio } from '../facturacio/emissio.js';
import { creaMagatzemPerfil, esPerfilFixat } from '../facturacio/magatzemPerfil.js';
import { registraAnulacio, verificaCadena } from '../facturacio/registre/cadena.js';
import { dataHoraAmbHus } from '../facturacio/registre/empremta.js';
import { llibreDesDeJson, restauraCopia } from '../facturacio/registre/port.js';
import { creaPortIndexedDB } from '../facturacio/registre/portIndexedDB.js';
import { xmlDeRegistres } from '../facturacio/registre/xmlAeat.js';
import { demanaCarpeta, fontDesDeHandle, oblidaFont, potTriarCarpeta } from '../font/fontNavegador.js';
import { TIPUS_COPIA, TIPUS_XML, marcaDeCopia, nomFitxerCopia, nomFitxerXml, ultimsConegutsDe } from './nucli/copia.js';
import { clauDeFactura, euros } from './nucli/formulari.js';
import { TIPUS_CSV, llibreCsv, nomDelLlibreCsv } from './nucli/llibreCsv.js';

const PERFIL_BUIT = Object.freeze({ config: null, llegat: null, copia: null });

/* El títol de l'avís de cada error que la persona pot trobar-se. */
const TITOLS_ERROR = Object.freeze({
  CONFIG_INVALIDA: 'Les dades de l’empresa no estan completes',
  /* Prompt 261014_1605, G1 · PODER 5: la «data de pas» és el primer dia que factures ací. */
  SENSE_DATA_PAS: 'Falta el primer dia que factures ací',
  LLEGAT_INVALID: 'Les factures d’abans no s’han pogut llegir',
  FACTURA_INVALIDA: 'La factura no està completa',
  NUMERO_NO_CORRELATIU: 'El número ha canviat',
  NUMERO_REPETIT: 'El número ha canviat',
  CADENA_CANVIADA: 'El llibre ha canviat mentrestant',
  DATA_FUTURA: 'La data és de demà o més avant',
  ABANS_DEL_PAS: 'La data és d’abans del pas',
  SERIE_CONFUSA: 'Esta sèrie es confondria amb la d’abans',
  SERIE_AMB_FORATS: 'La sèrie té forats',
  FACTURA_RECTIFICADA_INEXISTENT: 'Eixa factura no es pot referir',
  FACTURA_JA_SUBSTITUIDA: 'Eixe tiquet ja té la seua factura',
  RECTIFICADES_DE_DIVERSOS_CLIENTS: 'Eixes factures són de clients diferents',
  FACTURA_INEXISTENT: 'Eixa factura no és al llibre',
  CADENA_AMB_INCIDENCIES: 'El llibre té incidències',
  PERFIL_FIXAT: 'Ja hi ha factures emeses',
  MARCA_ENRERE: 'Esta còpia no arriba on arribava l’anterior',
  DUPLICAT: 'Ja estava fet',
  COPIA_INVALIDA: 'La còpia no és bona',
  COPIA_DIVERGENT: 'La còpia és d’un altre llibre',
  COPIA_ALTERADA: 'La còpia i el llibre no coincidixen',
  SELECTOR_NO_DISPONIBLE: 'Este navegador no tria carpetes',
  CAL_GEST: 'Torna a prémer el botó',
  ESCRIPTURA_DENEGADA: 'No hi ha permís per a escriure',
  FITXER_JA_EXISTEIX: 'Ja hi ha un fitxer amb este nom'
});

/* Descàrrega amb Blob i un enllaç temporal, com a PanellGestoria.jsx: res passa per cap servidor. */
function descarregaPerDefecte({ nom, tipus, dades }) {
  const url = URL.createObjectURL(new Blob([dades], { type: tipus || 'application/octet-stream' }));
  const enllac = document.createElement('a');
  enllac.href = url;
  enllac.download = nom;
  enllac.rel = 'noopener';
  enllac.click();
  // Safari necessita que la URL visca un moment després del clic.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * La data d'avui a Madrid, «aaaa-mm-dd»: la que comprova el registre (DATA_FUTURA).
 * @param {number} instant
 * @returns {string}
 */
export const dataDeHui = (instant) => dataHoraAmbHus(instant).slice(0, 10);

/* El llibre, el perfil i el resum: els injectats o els d'este navegador. Sense WebCrypto o sense IndexedDB, l'error. */
function obriRecursos({ port, perfil, subtle, idb, locks, emmagatzematge, rellotge }) {
  const resum = subtle ?? globalThis.crypto?.subtle;
  if (!resum || typeof resum.digest !== 'function') {
    return {
      error: errorAmbCodi('SENSE_WEBCRYPTO', 'Este navegador no deixa calcular l’empremta de les factures. Obri la Gestoria amb https o des d’este mateix ordinador (localhost).')
    };
  }
  try {
    return {
      port: port ?? creaPortIndexedDB({ idb, locks, emmagatzematge, subtle: resum }),
      perfil: perfil ?? creaMagatzemPerfil({ idb, rellotge }),
      subtle: resum,
      propis: { port: !port, perfil: !perfil },
      error: null
    };
  } catch (error) {
    return { error };
  }
}

/* L'avís d'un error: el títol pel codi, el text del nucli i la llista de detalls, si és de textos. */
function avisDe(zona, error) {
  const cancellat = error?.codi === 'SELECCIO_CANCELLADA';
  return {
    zona,
    to: cancellat ? 'info' : 'error',
    titol: cancellat ? 'No s’ha triat cap carpeta' : (TITOLS_ERROR[error?.codi] ?? 'No s’ha pogut fer'),
    text: cancellat ? 'La còpia no s’ha fet.' : (error?.message ?? String(error)),
    detalls: Array.isArray(error?.detalls) ? error.detalls.filter((d) => typeof d === 'string') : []
  };
}

/* L'avís d'una acció que ha eixit bé (o a mitges: to 'avis'). */
const avisExit = (zona, titol, text, to = 'exit') => ({ zona, to, titol, text, detalls: [] });

/* Emetre o anul·lar sobre un llibre amb incidències greus (troballa F3, 261007). */
const cadenaAmbIncidencies = () => errorAmbCodi('CADENA_AMB_INCIDENCIES',
  'Mentre la cadena tinga incidències (pas 4), no es pot emetre ni anul·lar cap factura. Si tens una còpia bona del llibre, restaura-la al pas 5.');
/* «un registre», «3 registres». */
const quantsRegistres = (n) => (n === 1 ? 'un registre' : `${n} registres`);

/**
 * @param {object} [opcions] totes injectables per a les proves
 * @returns {object} l'estat i les accions de la pantalla
 */
export function useFacturacio({
  port: portDonat, perfil: perfilDonat, subtle: subtleDonat, idb, locks, emmagatzematge,
  rellotge = Date.now, entorn = globalThis, descarrega = descarregaPerDefecte, imprimix
} = {}) {
  /* El rellotge de l'última pintada: un rellotge nou a cada pintada no ha de tornar a llegir el llibre. */
  const ara = useRef(rellotge);
  ara.current = rellotge;
  const [recursos] = useState(() => obriRecursos({
    port: portDonat, perfil: perfilDonat, subtle: subtleDonat, idb, locks, emmagatzematge, rellotge: () => ara.current()
  }));
  const { port, perfil, subtle } = recursos;
  const [dades, setDades] = useState(() => ({
    fase: recursos.error ? 'error' : 'carregant', error: recursos.error, perfil: PERFIL_BUIT, tots: [], informe: null, verificatA: null
  }));
  /* null: encara no s'ha demanat · 'pendent' · 'concedida' · 'denegada' · 'sense-api' · 'memoria' */
  const [persistencia, setPersistencia] = useState(null);
  const [ocupat, setOcupat] = useState(null);
  const [avis, setAvis] = useState(null);
  /* PODER 1 (Prompt 261014_1605, G1): la clau de la factura que es mostra en paper (no el registre: després
     d'anul·lar-la, el seu estat canvia), i on torna el focus en tancar-la (un element, o una funció que el dona). */
  const [mostrada, setMostrada] = useState(null);
  const tornaFocus = useRef(null);
  const viu = useRef(true);

  /* Llegir el perfil i el llibre, i verificar la cadena sencera amb la marca de l'última còpia. */
  const recarrega = useCallback(async () => {
    const [llegit, tots] = await Promise.all([perfil.llig(), port.llig()]);
    const informe = await verificaCadena(tots, { subtle, ultimsConeguts: ultimsConegutsDe(llegit.copia) });
    if (viu.current) setDades({ fase: 'llest', error: null, perfil: llegit, tots, informe, verificatA: ara.current() });
  }, [perfil, port, subtle]);

  useEffect(() => {
    viu.current = true;
    if (recursos.error) return undefined;
    recarrega().catch((error) => {
      if (viu.current) setDades((abans) => ({ ...abans, fase: 'error', error }));
    });
    return () => {
      viu.current = false;
    };
  }, [recursos, recarrega]);

  /* Les connexions que ha obert la pantalla es tanquen amb ella; les injectades, no. */
  useEffect(() => () => {
    if (recursos.propis?.port) recursos.port.tanca?.();
    if (recursos.propis?.perfil) recursos.perfil.tanca?.();
  }, [recursos]);

  const config = dades.perfil.config?.dades ?? null;
  const llegat = dades.perfil.llegat?.dades ?? null;
  const emissio = useMemo(() => {
    if (!port || !config || !llegat) return { cas: null, error: null };
    try {
      return { cas: creaEmissio({ port, config, llegat, subtle }), error: null };
    } catch (error) {
      return { cas: null, error };
    }
  }, [port, config, llegat, subtle]);
  const nif = config?.nif ?? null;
  const cadena = useMemo(() => (nif ? dades.tots.filter((r) => r.idEmisor === nif) : []), [dades.tots, nif]);
  /* El perfil permet emetre; la cadena, verificada sencera, no té cap incidència greu (troballa F3). */
  const perfilLlest = Boolean(emissio.cas);
  const cadenaBona = dades.informe?.valida === true;
  const potEmetre = perfilLlest && cadenaBona;
  /* Ja hi ha factures del NIF vigent: el NIF, la data de pas i el llegat declarat són fixos (troballa F4). */
  const perfilFixat = esPerfilFixat(config, dades.tots);
  /* L'últim informe, per a les accions: un diàleg obert abans que la cadena tinguera incidències no emet ni anul·la. */
  const informeActual = useRef(dades.informe);
  informeActual.current = dades.informe;

  const demanaPersistencia = useCallback(async () => {
    if (port?.persistent === false) {
      setPersistencia('memoria');
      return;
    }
    if (typeof port?.demanaPersistencia !== 'function') {
      setPersistencia('sense-api');
      return;
    }
    setPersistencia('pendent');
    let resposta;
    try {
      resposta = await port.demanaPersistencia();
    } catch {
      resposta = false;
    }
    if (viu.current) setPersistencia(resposta === true ? 'concedida' : resposta === false ? 'denegada' : 'sense-api');
  }, [port]);

  /* Quan el perfil ja permet emetre, es demana una vegada que el navegador no esborre el llibre
     (també amb la cadena aturada: el llibre que queda s'ha de conservar). */
  useEffect(() => {
    if (perfilLlest && persistencia === null) demanaPersistencia();
  }, [perfilLlest, persistencia, demanaPersistencia]);

  /* Una acció: marca l'ocupació, buida l'avís i, si falla, en deixa l'avís a la seua zona. */
  const executa = useCallback(async (nom, zona, fn) => {
    setOcupat(nom);
    setAvis(null);
    try {
      return { ok: true, resultat: await fn() };
    } catch (error) {
      if (viu.current) setAvis(avisDe(zona, error));
      return { ok: false, error };
    } finally {
      if (viu.current) setOcupat(null);
    }
  }, []);

  const exit = useCallback((zona, titol, text, to) => {
    if (viu.current) setAvis(avisExit(zona, titol, text, to));
  }, []);

  /** Mostra en paper la factura de `clau`; en tancar-la, el focus anirà a `torna`. */
  const mostraFactura = useCallback((clau, torna = null) => {
    tornaFocus.current = torna;
    setMostrada(clau);
  }, []);

  const tancaFactura = useCallback(() => {
    const torna = tornaFocus.current;
    tornaFocus.current = null;
    setMostrada(null);
    const desti = typeof torna === 'function' ? torna() : torna;
    if (desti?.isConnected) desti.focus();
  }, []);

  /* El perfil es desa amb el llibre llegit en eixe moment (no el de la pantalla, que pot anar tard):
     el magatzem hi mira si ja s'ha emés amb el NIF vigent (PERFIL_FIXAT). */
  const desaConfig = useCallback(async (nova) => {
    const r = await executa('perfil', 'perfil', async () => {
      const versio = await perfil.afegixConfig(nova, { registres: await port.llig() });
      await recarrega();
      return versio;
    });
    if (r.ok) exit('perfil', 'Dades de l’empresa desades', `S’ha desat la versió ${r.resultat.versio} en este ordinador. Les anteriors es conserven.`);
    return r;
  }, [executa, exit, perfil, port, recarrega]);

  const desaLlegat = useCallback(async (nou) => {
    const r = await executa('llegat', 'llegat', async () => {
      const versio = await perfil.afegixLlegat(nou, { registres: await port.llig() });
      await recarrega();
      return versio;
    });
    if (r.ok) exit('llegat', 'Factures d’abans desades', 'Les sèries de l’eina d’abans queden tancades: el programa numera en les seues.');
    return r;
  }, [executa, exit, perfil, port, recarrega]);

  /** El número que tindria ara una factura; no reserva res. */
  const seguentNumero = useCallback(async ({ tipus, dataExpedicio }) => {
    if (!emissio.cas) return { numero: null, error: null };
    try {
      return { numero: await emissio.cas.seguentNumero({ tipus, dataExpedicio }), error: null };
    } catch (error) {
      return { numero: null, error };
    }
  }, [emissio]);

  const emet = useCallback(async (dadesFactura) => {
    const r = await executa('emetent', 'factura', async () => {
      if (!emissio.cas) throw emissio.error ?? errorAmbCodi('SENSE_PERFIL', 'Primer cal desar les dades de l’empresa i les factures d’abans.');
      if (informeActual.current?.valida !== true) throw cadenaAmbIncidencies();
      const alta = await emissio.cas.emet(dadesFactura, { instant: ara.current() });
      await recarrega();
      return alta;
    });
    if (r.ok) exit('factura', `Factura ${r.resultat.numSerie} emesa`, `Total: ${euros(r.resultat.importTotal)}. Ja és al llibre, encadenada a l’anterior.`);
    return r;
  }, [executa, exit, emissio, recarrega]);

  /* PODER 1 (Prompt 261014_1605, G1): la factura acabada d'emetre, en paper. L'alta que torna emet() és el
     registre del llibre que pinta ImpressioFactura. La crida el formulari després de tancar el seu diàleg:
     el diàleg torna el focus on era i, després, la factura el porta al seu títol. */
  const mostraEmesa = useCallback((alta, torna = null) => {
    if (viu.current && alta) mostraFactura(clauDeFactura(alta), torna);
  }, [mostraFactura]);

  const anulla = useCallback(async (registre, motiu) => {
    const r = await executa('anul·lant', 'llibre', async () => {
      if (informeActual.current?.valida !== true) throw cadenaAmbIncidencies();
      const anulacio = await registraAnulacio(port, {
        idEmisor: registre.idEmisor, numSerie: registre.numSerie, dataExpedicio: registre.dataExpedicio,
        ...(typeof motiu === 'string' && motiu.trim() ? { motiu: motiu.trim() } : {}), instant: ara.current(), subtle
      });
      await recarrega();
      return anulacio;
    });
    if (r.ok) exit('llibre', `Factura ${registre.numSerie} anul·lada`, 'L’anul·lació és un registre nou del llibre: la factura i el seu número es conserven.');
    return r;
  }, [executa, exit, port, subtle, recarrega]);

  const verifica = useCallback(() => executa('verificant', 'llibre', recarrega), [executa, recarrega]);

  /* La còpia: el selector de carpeta s'obri el primer de tot, dins del gest de la persona. */
  const exporta = useCallback(async (desti) => {
    const r = await executa('exportant', 'copia', async () => {
      let font = null;
      if (desti === 'carpeta') {
        const handle = await demanaCarpeta({ mode: 'readwrite', entorn });
        font = fontDesDeHandle(handle, { extensionsEscriptura: ['json'] });
        if (typeof font.escriu !== 'function') {
          oblidaFont(font);
          throw errorAmbCodi('ESCRIPTURA_DENEGADA', 'Este navegador no deixa escriure en la carpeta: descarrega la còpia.');
        }
      }
      try {
        const text = await port.exporta();
        const registres = llibreDesDeJson(text);
        /* Troballa F2 (261007): només és una còpia bona la d'un llibre correcte que conté el registre
           de la marca vigent. Si no, es fa igualment (per a la gestoria, amb «incidencia» al nom), però
           no deixa marca: la bona continua sent la d'abans i el truncament es continua veient. */
        const { copia } = await perfil.llig();
        const { valida: bona } = await verificaCadena(registres, { subtle, ultimsConeguts: ultimsConegutsDe(copia) });
        const nomFitxer = nomFitxerCopia(ara.current(), { incidencia: !bona });
        const bytes = new TextEncoder().encode(text);
        if (font) await font.escriu(nomFitxer, bytes);
        else descarrega({ nom: nomFitxer, tipus: TIPUS_COPIA, dades: bytes });
        if (bona) await perfil.afegixCopia(marcaDeCopia(registres, nomFitxer));
        await recarrega();
        return { nomFitxer, registres: registres.length, carpeta: font?.nom ?? null, bona };
      } finally {
        if (font) oblidaFont(font);
      }
    });
    if (r.ok) {
      const on = r.resultat.carpeta !== null ? `a la carpeta «${r.resultat.carpeta}»` : 'a les descàrregues';
      const desada = `«${r.resultat.nomFitxer}» (${quantsRegistres(r.resultat.registres)}) s’ha desat ${on}.`;
      if (r.resultat.bona) exit('copia', 'Còpia feta', `${desada} Guarda-la també fora d’este ordinador.`);
      else {
        exit('copia', 'Còpia feta, però no és una còpia bona', `${desada} El llibre té incidències (pas 4): esta còpia serveix per a portar-la `
          + 'a la gestoria, però no substituïx l’última còpia bona. Per a arreglar el llibre, restaura la còpia bona.', 'avis');
      }
    }
    return r;
  }, [executa, exit, entorn, port, descarrega, perfil, subtle, recarrega]);

  /* Onada 6 (261009): l'XML de prova dels registres de l'empresa, descarregat. No s'envia enlloc;
     només d'una cadena correcta, perquè una cadena amb incidències no es podria remetre. */
  const exportaXml = useCallback(async () => {
    const r = await executa('xml', 'llibre', async () => {
      if (informeActual.current?.valida !== true) {
        throw errorAmbCodi('CADENA_AMB_INCIDENCIES', 'Mentre la cadena tinga incidències (pas 4), no es fa l’XML: primer s’ha d’arreglar el llibre.');
      }
      const { xml, registres: quants } = xmlDeRegistres(cadena, { obligat: { nom: config?.nom, nif: config?.nif } });
      const nomFitxer = nomFitxerXml(ara.current());
      descarrega({ nom: nomFitxer, tipus: TIPUS_XML, dades: new TextEncoder().encode(xml) });
      return { nomFitxer, quants };
    });
    if (r.ok) {
      exit('llibre', 'XML de prova descarregat', `«${r.resultat.nomFitxer}» porta ${quantsRegistres(r.resultat.quants)}. No s’ha enviat res a l’AEAT, `
        + 'i li falta el bloc del sistema informàtic: és per a provar-lo, no per a presentar-lo.', 'info');
    }
    return r;
  }, [executa, exit, cadena, config, descarrega]);

  /* Gauntlet 261016, Onada 3: el llibre registre de factures expedides d'un període, en CSV per a la
     gestoria (nucli/llibreCsv.js). Com l'XML, només d'una cadena correcta: d'un llibre amb incidències,
     la gestoria rep la còpia del pas 5. La pantalla avisa abans que ix sense xifrar. */
  const exportaLlibre = useCallback(async ({ files, any = null, trimestre = null } = {}) => {
    const r = await executa('csv', 'llibre', async () => {
      if (informeActual.current?.valida !== true) {
        throw errorAmbCodi('CADENA_AMB_INCIDENCIES', 'Mentre la cadena tinga incidències (pas 4), no es fa el llibre per a la gestoria: primer s’ha d’arreglar el llibre.');
      }
      const llista = Array.isArray(files) ? files : [];
      const nomFitxer = nomDelLlibreCsv({ any, trimestre });
      descarrega({ nom: nomFitxer, tipus: TIPUS_CSV, dades: new TextEncoder().encode(llibreCsv(llista)) });
      return { nomFitxer, quantes: llista.length };
    });
    if (r.ok) {
      const quantes = r.resultat.quantes === 1 ? 'una factura' : `${r.resultat.quantes} factures`;
      exit('llibre', 'Llibre descarregat', `«${r.resultat.nomFitxer}» porta ${quantes} (les anul·lades hi són, marcades). `
        + 'Ix sense xifrar: guarda’l en un lloc segur.');
    }
    return r;
  }, [executa, exit, descarrega]);

  const restaura = useCallback(async (text) => {
    const r = await executa('restaurant', 'copia', async () => {
      const resultat = await restauraCopia(port, text, { verifica: (registres) => verificaCadena(registres, { subtle }) });
      await recarrega();
      return resultat;
    });
    if (r.ok) {
      exit('copia', 'Còpia restaurada', r.resultat.afegits
        ? `S’ha afegit al llibre ${quantsRegistres(r.resultat.afegits)}, i la cadena s’ha tornat a verificar.`
        : 'El llibre ja tenia tot el que porta la còpia: no s’hi ha afegit res.');
    }
    return r;
  }, [executa, exit, port, subtle, recarrega]);

  return {
    fase: dades.fase,
    error: dades.error,
    perfil: dades.perfil,
    config,
    llegat,
    potEmetre,
    /* El perfil permet emetre, però la cadena té incidències greus: emetre i anul·lar, aturats (F3). */
    bloquejatPerCadena: perfilLlest && !cadenaBona,
    cadenaBona,
    perfilFixat,
    errorEmissio: emissio.error,
    cadena,
    tots: dades.tots,
    informe: dades.informe,
    verificatA: dades.verificatA,
    persistencia,
    persistent: port?.persistent !== false,
    ocupat,
    avis,
    potTriarCarpeta: potTriarCarpeta(entorn),
    /* Onada 6: qui imprimix la factura (per defecte, window.print a ImpressioFactura); les proves l'injecten. */
    imprimix,
    /* PODER 1 (Prompt 261014_1605, G1): la factura en paper, una sola a la vegada. */
    mostrada,
    mostraFactura,
    mostraEmesa,
    tancaFactura,
    dataDeHui: () => dataDeHui(ara.current()),
    tancaAvis: () => setAvis(null),
    desaConfig,
    desaLlegat,
    seguentNumero,
    emet,
    anulla,
    verifica,
    exporta,
    exportaXml,
    exportaLlibre,
    restaura,
    demanaPersistencia
  };
}
